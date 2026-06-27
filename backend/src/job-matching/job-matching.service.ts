import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class JobMatchingService {
  private readonly logger = new Logger(JobMatchingService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  /**
   * AI 根据用户技能生成岗位推荐
   */
  async recommendJobs(userId: string, options?: { limit?: number }) {
    const limit = options?.limit || 10;

    // 1. 获取用户信息和技能
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new NotFoundException('用户不存在');

    // 从简历中提取技能
    const resumes = await this.prisma.resume.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });

    const skills = resumes[0]?.skills || [];
    const targetPosition = user.targetPosition || '';

    // 2. 检查是否有现成的推荐
    const existingMatches = await this.prisma.jobMatch.findMany({
      where: { userId, status: { not: 'archived' } },
      orderBy: { matchScore: 'desc' },
      take: limit,
    });

    if (existingMatches.length >= 5) {
      return { items: existingMatches, source: 'database' };
    }

    // 3. AI 生成推荐
    try {
      const aiRecommendations = await this.generateAIRecommendations(
        skills,
        targetPosition,
      );

      // 4. 保存到数据库
      const created: any[] = [];
      for (const rec of aiRecommendations) {
        const match = await this.prisma.jobMatch.create({
          data: {
            userId,
            position: rec.position,
            company: rec.company || null,
            location: rec.location || null,
            salaryRange: rec.salaryRange || null,
            description: rec.description || null,
            requirements: rec.requirements ? (rec.requirements as any) : null,
            matchScore: rec.matchScore || 0,
            matchDetails: rec.matchDetails
              ? (rec.matchDetails as any)
              : undefined,
            source: 'ai_recommended',
          },
        });
        created.push(match);
      }

      return { items: created, source: 'ai_generated' };
    } catch (err) {
      this.logger.error(`AI 岗位推荐失败: ${(err as Error).message}`);
      // 降级：返回已有推荐
      return { items: existingMatches, source: 'database_fallback' };
    }
  }

  /**
   * 获取用户保存的岗位列表
   */
  async getUserMatches(
    userId: string,
    options: { page?: number; limit?: number; status?: string },
  ) {
    const { page = 1, limit = 10, status } = options;
    const where: any = { userId };
    if (status) where.status = status;

    const [items, total] = await Promise.all([
      this.prisma.jobMatch.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { matchScore: 'desc' },
      }),
      this.prisma.jobMatch.count({ where }),
    ]);

    return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  /**
   * 更新岗位状态（保存/投递/归档）
   */
  async updateMatchStatus(
    id: string,
    userId: string,
    status: string,
  ) {
    const match = await this.prisma.jobMatch.findFirst({
      where: { id, userId },
    });
    if (!match) throw new NotFoundException('岗位推荐不存在');

    return this.prisma.jobMatch.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * 根据简历 ID 分析岗位匹配度
   */
  async analyzeMatch(resumeId: string, userId: string, position: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id: resumeId, userId },
    });
    if (!resume) throw new NotFoundException('简历不存在');

    const skills = resume.skills || [];

    const systemPrompt = `你是一个岗位匹配分析专家。根据用户的技能和目标岗位，评估匹配度。以严格的 JSON 格式返回。`;

    const userPrompt = `目标岗位: ${position}
用户技能: ${skills.join(', ')}

请分析:
1. matchScore: 匹配度 (0-100)
2. matchedSkills: 已匹配的技能列表
3. missingSkills: 缺失的关键技能列表
4. suggestions: 提升匹配度的建议 (2-3条)

以 JSON 格式返回。`;

    try {
      const result = (await this.aiService.callLLM(
        systemPrompt,
        userPrompt,
      )) as any;

      return {
        position,
        matchScore: result.matchScore || 0,
        matchedSkills: result.matchedSkills || [],
        missingSkills: result.missingSkills || [],
        suggestions: result.suggestions || [],
      };
    } catch (err) {
      this.logger.error(`匹配分析失败: ${(err as Error).message}`);
      // 降级：基于关键字简单匹配
      const keywordMatches = skills.filter((s) =>
        position.toLowerCase().includes(s.toLowerCase()),
      );
      return {
        position,
        matchScore: Math.min(Math.round((keywordMatches.length / 5) * 100), 100),
        matchedSkills: keywordMatches,
        missingSkills: [],
        suggestions: ['请完善简历技能信息以获得更精准的分析'],
      };
    }
  }

  /**
   * 调用 AI 生成岗位推荐
   */
  private async generateAIRecommendations(
    skills: string[],
    targetPosition: string,
  ): Promise<any[]> {
    const systemPrompt = `你是一个职业推荐专家。根据用户的技能和目标岗位，推荐 5 个适合的岗位。以严格的 JSON 数组格式返回。`;

    const userPrompt = `目标岗位: ${targetPosition || '未指定'}
技能: ${skills.join(', ') || '未填写'}

请推荐 5 个适合的岗位，每个岗位包含:
- position: 岗位名称
- company: 公司名称（知名科技公司）
- location: 地点
- salaryRange: 薪资范围
- description: 岗位简介
- requirements: 核心要求列表
- matchScore: 匹配度 (0-100)
- matchDetails: { matchedSkills, missingSkills, suggestions }

以 JSON 数组格式返回。`;

    const result = await this.aiService.callLLM(systemPrompt, userPrompt);
    return Array.isArray(result) ? result : [];
  }

  /* ══════════════════════════════════════════════
     外部数据导入（Kaggle 数据集等）
     ══════════════════════════════════════════════ */

  /**
   * 导入外部岗位匹配数据（用于种子数据导入）
   */
  async importJobMatch(data: {
    userId: string;
    position: string;
    company?: string | null;
    location?: string | null;
    description?: string | null;
    requirements?: any;
    matchScore: number;
    matchDetails?: any;
    status?: string;
    source?: string;
  }) {
    // 如果传了 email，查找对应的 user
    let userId = data.userId;
    if (data.userId.includes('@')) {
      const user = await this.prisma.user.findUnique({
        where: { email: data.userId },
      });
      if (!user) {
        // 创建一个系统用户用于存储数据
        const newUser = await this.prisma.user.create({
          data: {
            email: data.userId,
            name: 'Kaggle Data Import',
            passwordHash: '$2b$10$imported', // 占位，不能直接登录
          },
        });
        userId = newUser.id;
      } else {
        userId = user.id;
      }
    }

    return this.prisma.jobMatch.create({
      data: {
        userId,
        position: data.position,
        company: data.company || null,
        location: data.location || null,
        description: data.description || null,
        requirements: data.requirements || null,
        matchScore: data.matchScore,
        matchDetails: data.matchDetails || null,
        status: data.status || 'pending',
        source: data.source || 'external',
      },
    });
  }
}
