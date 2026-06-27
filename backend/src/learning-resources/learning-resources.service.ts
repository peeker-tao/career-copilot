import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { BrowseResourcesDto, AiRecommendationsDto } from './dto/learning-resources.dto';

@Injectable()
export class LearningResourcesService {
  private readonly logger = new Logger(LearningResourcesService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async browse(dto: BrowseResourcesDto) {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (dto.category) where.category = dto.category;
    if (dto.type) where.type = dto.type;
    if (dto.difficulty) where.difficulty = dto.difficulty;
    if (dto.tags?.length) where.tags = { hasSome: dto.tags };
    if (dto.search) {
      where.OR = [
        { title: { contains: dto.search, mode: 'insensitive' } },
        { description: { contains: dto.search, mode: 'insensitive' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.learningResource.findMany({
        where,
        skip,
        take: limit,
        orderBy: { relevanceScore: 'desc' },
      }),
      this.prisma.learningResource.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const resource = await this.prisma.learningResource.findUnique({ where: { id } });
    if (!resource) {
      throw new BadRequestException('学习资源不存在');
    }

    // 增加浏览次数
    await this.prisma.learningResource.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return resource;
  }

  async getCategories() {
    const result = await this.prisma.learningResource.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return result.map((r) => r.category);
  }

  /**
   * AI 个性化推荐：根据用户技能缺口和目标岗位推荐学习资源
   */
  async getAiRecommendations(userId: string, dto: AiRecommendationsDto) {
    // 1. 获取用户的 careerPlan gapSkills
    let gapSkills = dto.gapSkills;
    let targetPosition = dto.targetPosition;

    if (!gapSkills?.length || !targetPosition) {
      const latestPlan = await this.prisma.careerPlan.findFirst({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
      if (latestPlan) {
        gapSkills = gapSkills || (latestPlan.gapSkills as string[]) || [];
        targetPosition = targetPosition || latestPlan.targetPosition || '';
      }
    }

    // 2. 先在数据库中搜索匹配的资源
    const dbResources = await this.prisma.learningResource.findMany({
      where: {
        OR: [
          ...(gapSkills?.length
            ? gapSkills.map((skill) => ({
                OR: [
                  { category: { contains: skill, mode: 'insensitive' as const } },
                  { tags: { has: skill } },
                  { title: { contains: skill, mode: 'insensitive' as const } },
                ],
              }))
            : []),
        ],
      },
      take: 10,
      orderBy: { relevanceScore: 'desc' },
    });

    // 3. 如果数据库中有足够资源，直接返回
    if (dbResources.length >= (dto.count || 5)) {
      return {
        source: 'database',
        gapSkills: gapSkills || [],
        targetPosition: targetPosition || '',
        recommendations: dbResources.slice(0, dto.count || 5),
      };
    }

    // 4. 如果不够，调用 AI 生成补充推荐
    try {
      const systemPrompt = `你是一个学习路径推荐专家。根据用户的技能缺口和目标岗位，推荐最合适的学习资源。
以严格的 JSON 数组格式返回，每条包含：
- title: 资源标题
- url: 资源链接（使用知名平台真实链接）
- type: course | article | video | book | documentation
- category: 技能分类
- tags: 相关标签数组
- description: 简短描述
- provider: 平台名称（Coursera, Udemy, YouTube, MDN, 等）
- difficulty: beginner | intermediate | advanced
- duration: 学习时长估计`;

      const userPrompt = `目标岗位: ${targetPosition || '未指定'}
技能缺口: ${(gapSkills || ['综合']).join(', ')}
已经有的资源: ${dbResources.length > 0 ? dbResources.map((r) => r.title).join(', ') : '无'}
需要补充推荐 ${Math.max((dto.count || 5) - dbResources.length, 1)} 条。`;

      const raw = await this.aiService.callLLM(systemPrompt, userPrompt);
      let aiResources: any[];
      try {
        aiResources = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        aiResources = [];
      }

      if (!Array.isArray(aiResources)) aiResources = [];

      // 保存 AI 生成的资源到数据库
      const saved = [];
      for (const r of aiResources) {
        try {
          const created = await this.prisma.learningResource.create({
            data: {
              title: r.title || 'Untitled',
              url: r.url || '',
              type: r.type || 'article',
              category: r.category || 'general',
              tags: r.tags || [],
              description: r.description || null,
              provider: r.provider || null,
              difficulty: r.difficulty || 'intermediate',
              duration: r.duration || null,
              aiGenerated: true,
              relevanceScore: 5.0,
            },
          });
          saved.push(created);
        } catch {
          // 跳过单个失败
        }
      }

      return {
        source: 'ai_generated',
        gapSkills: gapSkills || [],
        targetPosition: targetPosition || '',
        recommendations: [...dbResources, ...saved].slice(0, dto.count || 5),
      };
    } catch (err) {
      this.logger.error(`AI 推荐失败: ${(err as Error).message}`);
      // 降级：返回数据库中找到的资源
      return {
        source: 'database_fallback',
        gapSkills: gapSkills || [],
        targetPosition: targetPosition || '',
        recommendations: dbResources,
      };
    }
  }
}
