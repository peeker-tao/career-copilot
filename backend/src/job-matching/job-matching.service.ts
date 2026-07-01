import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import * as fs from 'fs/promises';
import * as path from 'path';
import { parse } from 'csv-parse/sync';

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
        0.3,
        'job:matching',
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

    const result = await this.aiService.callLLM(systemPrompt, userPrompt, 0.3, 'job:recommend');
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

  /* ══════════════════════════════════════════════
     一键导入默认基准数据（Kaggle 数据集）
     ══════════════════════════════════════════════ */

  /**
   * 从前端一键导入 Kaggle resume 数据集作为默认基准数据
   * 读取 datasets/resume_datasets/resume_data.csv 并批量导入 job_matches 表
   */
  async seedDefaultData(userId: string): Promise<{
    total: number;
    success: number;
    skipped: number;
    errors: string[];
  }> {
    const csvPath = path.resolve(
      process.cwd(),
      '..',
      'datasets',
      'resume_datasets',
      'resume_data.csv',
    );

    this.logger.log(`开始读取基准数据文件: ${csvPath}`);

    let csvContent: string;
    try {
      csvContent = await fs.readFile(csvPath, 'utf-8');
    } catch (err) {
      this.logger.error(`无法读取 CSV 文件: ${csvPath}`);
      throw new NotFoundException(
        `基准数据文件未找到: ${csvPath}。请确保 datasets/resume_datasets/resume_data.csv 存在。`,
      );
    }

    // 解析 CSV（处理 BOM 头）
    const cleaned = csvContent.replace(/^\uFEFF/, '');
    const records: Record<string, string>[] = parse(cleaned, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
      trim: true,
      bom: true,
    });

    this.logger.log(`CSV 解析完成，共 ${records.length} 行`);

    // 批量导入统计
    let success = 0;
    let skipped = 0;
    const errors: string[] = [];
    const batchSize = 500; // 分批插入

    for (let i = 0; i < records.length; i++) {
      const row = records[i];
      try {
        const position = (row['job_position_name'] || row['\ufeffjob_position_name'] || '').trim();
        if (!position) {
          skipped++;
          continue;
        }

        // 解析技能
        const skillsRaw = (row['skills'] || '').trim();
        const skills = skillsRaw
          ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
          : [];

        // 解析匹配分数 (0-1 → 0-100)
        const rawScore = parseFloat(row['matched_score'] || '0');
        const matchScore = Math.max(0, Math.min(100, Math.round(rawScore * 100)));

        // 解析公司
        const company = this.cleanField(row['professional_company_names']);
        const location = this.cleanField(row['locations']);

        // 解析要求
        const reqSkillsRaw = (row['skills_required'] || '').trim();
        const reqSkills = reqSkillsRaw
          ? reqSkillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
          : [];
        const eduReq = this.cleanField(row['educationaL_requirements']);
        const expReq = this.cleanField(row['experiencere_requirement']);

        const requirementsList: string[] = [];
        if (reqSkills.length > 0) {
          requirementsList.push(`技能要求: ${reqSkills.slice(0, 10).join(', ')}`);
        }
        if (eduReq && !['none', 'n/a', 'na'].includes(eduReq.toLowerCase())) {
          requirementsList.push(`学历要求: ${eduReq}`);
        }
        if (expReq && !['none', 'n/a', 'na'].includes(expReq.toLowerCase())) {
          requirementsList.push(`经验要求: ${expReq}`);
        }

        // 描述（职业目标）
        let description = this.cleanField(row['career_objective']);
        if (!description && row['responsibilities']) {
          description = (row['responsibilities'] || '').trim().slice(0, 500);
        }

        // 构建 matchDetails
        const missingSkills = reqSkills.filter(
          (s) => !skills.includes(s),
        );
        const matchDetails = {
          matchedSkills: skills.slice(0, 20),
          missingSkills: missingSkills.slice(0, 10),
          sourceData: 'kaggle_resume_dataset',
        };

        // 构建 requirements
        const requirements =
          requirementsList.length > 0 ? requirementsList : undefined;

        // 清理公司名
        let cleanCompany: string | null = company || null;
        if (
          cleanCompany &&
          ['none', 'n/a', 'na'].includes(cleanCompany.toLowerCase())
        ) {
          cleanCompany = null;
        }

        await this.prisma.jobMatch.create({
          data: {
            userId,
            position,
            company: cleanCompany,
            location: location || null,
            salaryRange: null,
            description: description?.slice(0, 500) || null,
            requirements: requirements as any || null,
            matchScore,
            matchDetails: matchDetails as any,
            status: 'pending',
            source: 'external',
          },
        });
        success++;

        // 每批输出日志
        if (success % batchSize === 0) {
          this.logger.log(`导入进度: ${success}/${records.length}`);
        }
      } catch (err) {
        errors.push(`行 ${i + 2}: ${(err as Error).message}`);
        skipped++;
      }
    }

    this.logger.log(
      `基准数据导入完成: 成功 ${success}, 跳过 ${skipped}, 错误 ${errors.length}`,
    );

    return { total: records.length, success, skipped, errors };
  }

  /** 清理字段：去空、去 'None'、去 'N/A' */
  private cleanField(value: string | undefined | null): string | null {
    if (!value) return null;
    const cleaned = value.trim();
    if (!cleaned || ['none', 'n/a', 'na', 'null'].includes(cleaned.toLowerCase())) {
      return null;
    }
    return cleaned;
  }

  /* ══════════════════════════════════════════════
     数据库统计
     ══════════════════════════════════════════════ */

  /**
   * 获取岗位匹配模块数据库统计信息
   */
  async getStats() {
    const [
      total,
      statusCounts,
      sourceCounts,
      avgScoreResult,
      topPositions,
      topCompanies,
    ] = await Promise.all([
      // 1. 总记录数
      this.prisma.jobMatch.count(),

      // 2. 按状态统计
      this.prisma.jobMatch.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // 3. 按来源统计
      this.prisma.jobMatch.groupBy({
        by: ['source'],
        _count: { id: true },
      }),

      // 4. 平均匹配分数
      this.prisma.jobMatch.aggregate({
        _avg: { matchScore: true },
        _max: { matchScore: true },
        _min: { matchScore: true },
      }),

      // 5. 热门岗位 Top 10
      this.prisma.jobMatch.groupBy({
        by: ['position'],
        _count: { id: true },
        _avg: { matchScore: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // 6. 热门公司 Top 10
      this.prisma.jobMatch.groupBy({
        by: ['company'],
        _count: { id: true },
        _avg: { matchScore: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
        where: { company: { not: null } },
      }),
    ]);

    // 统计各状态数量
    const statusMap: Record<string, number> = {};
    for (const item of statusCounts) {
      statusMap[item.status] = item._count.id;
    }

    // 统计各来源数量
    const sourceMap: Record<string, number> = {};
    for (const item of sourceCounts) {
      sourceMap[item.source || 'unknown'] = item._count.id;
    }

    return {
      total,
      statusDistribution: statusMap,
      sourceDistribution: sourceMap,
      scoreStats: {
        average: avgScoreResult._avg.matchScore
          ? Math.round(avgScoreResult._avg.matchScore * 10) / 10
          : 0,
        max: avgScoreResult._max.matchScore ?? 0,
        min: avgScoreResult._min.matchScore ?? 0,
      },
      topPositions: topPositions.map((p) => ({
        position: p.position,
        count: p._count.id,
        avgMatchScore: p._avg.matchScore
          ? Math.round(p._avg.matchScore * 10) / 10
          : 0,
      })),
      topCompanies: topCompanies
        .filter((c) => c.company)
        .map((c) => ({
          company: c.company,
          count: c._count.id,
          avgMatchScore: c._avg.matchScore
            ? Math.round(c._avg.matchScore * 10) / 10
            : 0,
        })),
    };
  }
}
