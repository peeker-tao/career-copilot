import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ResumeParser } from './resume.parser';
import { UpdateResumeDto } from './dto/update-resume.dto';
import {
  ScreeningEvaluateDto,
  ScreeningBenchmarkRecordDto,
} from './dto/screening-benchmark.dto';
import { AiService } from '../ai/ai.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private prisma: PrismaService,
    private resumeParser: ResumeParser,
    private aiService: AiService,
  ) {}

  async upload(userId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传文件');
    }

    // 校验文件格式
    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowedMimes.includes(file.mimetype)) {
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
      throw new BadRequestException('仅支持 PDF 和 DOCX 格式');
    }

    // 创建简历记录（初始状态：parsing）
    const resume = await this.prisma.resume.create({
      data: {
        userId,
        title: file.originalname,
        fileUrl: file.path,
        status: 'parsing',
      },
    });

    this.logger.log(`📄 开始同步解析简历: resumeId=${resume.id}`);

    try {
      // 1. 提取文件文本
      const text = await this.resumeParser.extractText(file.path);
      this.logger.log(`📝 文本提取完成: ${text.length} 字符`);

      // 2. LLM 结构化解析
      const parsedData = await this.resumeParser.parseWithLLM(text);
      this.logger.log(`🤖 LLM 解析完成: skills=${parsedData.skills.length} 项`);

      // 3. 更新数据库
      const updated = await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          parsedData: parsedData as any,
          skills: parsedData.skills || [],
          suggestions: (parsedData.suggestions as any[]) ?? undefined,
          evaluations: (parsedData.evaluations as any[]) ?? undefined,
          status: 'completed',
        },
      });

      this.logger.log(`✅ 简历解析完成: resumeId=${resume.id}`);
      return updated;
    } catch (error) {
      this.logger.error(
        `❌ 简历解析失败: resumeId=${resume.id}`,
        error instanceof Error ? error.message : String(error),
      );

      await this.prisma.resume.update({
        where: { id: resume.id },
        data: { status: 'failed' },
      });

      throw new BadRequestException(
        `简历解析失败: ${error instanceof Error ? error.message : '未知错误'}`,
      );
    }
  }

  async findAll(
    userId: string,
    options: { page?: number; limit?: number; status?: string },
  ) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const where: { userId: string; status?: string } = { userId };
    if (status) {
      where.status = status;
    }

    const [items, total] = await Promise.all([
      this.prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resume.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) {
      throw new NotFoundException('简历不存在');
    }

    return resume;
  }

  async update(id: string, userId: string, dto: UpdateResumeDto) {
    await this.findOne(id, userId);

    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('请求体不能为空，请传入 JSON 数据');
    }

    // 去除 Prisma 不允许更新的只读字段
    const updatableFields = { ...dto } as Record<string, unknown>;
    delete updatableFields.id;
    delete updatableFields.userId;
    delete updatableFields.fileUrl;
    delete updatableFields.createdAt;
    delete updatableFields.updatedAt;

    if (Object.keys(updatableFields).length === 0) {
      // 没有可更新的字段时，返回当前数据而非报错
      return this.findOne(id, userId);
    }

    return this.prisma.resume.update({
      where: { id },
      data: updatableFields,
    });
  }

  async remove(id: string, userId: string) {
    const resume = await this.findOne(id, userId);

    // 删除本地文件
    if (resume.fileUrl && fs.existsSync(resume.fileUrl)) {
      fs.unlinkSync(resume.fileUrl);
      this.logger.log(`🗑️ 已删除简历文件: ${resume.fileUrl}`);
    }

    return this.prisma.resume.delete({
      where: { id },
    });
  }

  /**
   * AI 生成各章节的改写建议
   */
  async generateRewriteSuggestions(
    id: string,
    userId: string,
    options?: { goal?: string; focusAreas?: string[] },
  ) {
    const resume = await this.findOne(id, userId);
    const parsedData = resume.parsedData as Record<string, any> | null;
    if (!parsedData) {
      throw new BadRequestException('简历尚未解析完成，无法生成修改建议');
    }

    const systemPrompt = `你是一个资深简历优化专家。根据简历内容和优化目标，为每个章节提供具体的改写建议。以严格的 JSON 格式返回。`;

    const userPrompt = `简历内容: ${JSON.stringify(parsedData, null, 2)}
优化目标: ${options?.goal || '提升简历竞争力'}
重点关注: ${(options?.focusAreas || ['全部']).join(', ')}

请对以下章节分别给出改写建议:
1. summary - 个人摘要
2. experience - 工作/实习经历
3. projects - 项目经历
4. skills - 技能描述
5. education - 教育经历

每个建议包含:
- section: 章节名
- original: 原文摘要
- suggestion: 改写后的建议文本
- reason: 改写理由
- priority: high/medium/low

以 JSON 数组格式返回。`;

    try {
      return await this.aiService.callLLM(systemPrompt, userPrompt, 0.3, 'resume:rewrite');
    } catch (err) {
      this.logger.error(`AI 改写建议生成失败: ${(err as Error).message}`);
      throw new BadRequestException('AI 改写建议生成失败，请稍后重试');
    }
  }

  /**
   * AI 重写指定章节
   */
  async rewriteSection(
    id: string,
    userId: string,
    section: string,
    instruction?: string,
  ) {
    const resume = await this.findOne(id, userId);
    const parsedData = resume.parsedData as Record<string, any> | null;
    if (!parsedData) {
      throw new BadRequestException('简历尚未解析完成，无法重写');
    }

    const sectionContent = parsedData[section];
    if (!sectionContent) {
      throw new BadRequestException(`简历中不存在章节 "${section}"`);
    }

    const systemPrompt = `你是一个资深简历优化专家。根据用户提供的章节内容和修改指令，输出优化后的版本。保留所有事实信息，只优化表达方式和结构。以 JSON 格式返回优化后的内容。`;

    const userPrompt = `章节 "${section}":
原始内容: ${JSON.stringify(sectionContent, null, 2)}
修改指令: ${instruction || '优化表达，突出成果和量化数据'}

请输出优化后的 "${section}" 章节内容。保持与原结构一致，但改进表达。`;

    try {
      const rewritten = await this.aiService.callLLM(systemPrompt, userPrompt, 0.3, 'resume:rewrite');

      // 保存改写结果到简历中
      const updatedParsedData = {
        ...parsedData,
        [`${section}_rewritten`]: rewritten,
      };

      await this.prisma.resume.update({
        where: { id },
        data: {
          parsedData: updatedParsedData as any,
        },
      });

      return {
        section,
        original: sectionContent,
        rewritten,
      };
    } catch (err) {
      this.logger.error(`AI 章节重写失败: ${(err as Error).message}`);
      throw new BadRequestException('AI 章节重写失败，请稍后重试');
    }
  }

  // ================================================
  // 筛选基准评估 (Dataset 4) — 持久化 + 分用户
  // ================================================

  /**
   * 批量导入筛选基准数据（持久化到数据库，按用户隔离）
   */
  async importScreeningBenchmark(
    records: ScreeningBenchmarkRecordDto[],
    userId: string,
  ) {
    this.logger.log(`📊 导入筛选基准数据: userId=${userId}, count=${records.length}`);

    if (!records || records.length === 0) {
      throw new BadRequestException('记录列表不能为空');
    }

    // 校验必需字段
    for (const r of records) {
      if (!r.jobRole || !r.skills || !r.education) {
        throw new BadRequestException(
          '每条记录必须包含 jobRole, skills, education',
        );
      }
    }

    // 追加式导入：直接添加新记录，不清除任何已有数据
    const data = records.map((r) => ({
      userId,
      resumeId: r.resumeId,
      name: r.name,
      skills: r.skills,
      experienceYears: r.experienceYears,
      education: r.education,
      certifications: r.certifications ?? null,
      jobRole: r.jobRole,
      recruiterDecision: r.recruiterDecision,
      salaryExpectation: r.salaryExpectation,
      projectsCount: r.projectsCount,
      aiScore: r.aiScore,
    }));

    // 分批写入，避免单次事务过大
    const BATCH = 100;
    for (let i = 0; i < data.length; i += BATCH) {
      await this.prisma.screeningBenchmark.createMany({
        data: data.slice(i, i + BATCH),
      });
    }

    return {
      success: true,
      imported: records.length,
      message: `成功导入 ${records.length} 条筛选基准记录`,
    };
  }

  /**
   * 为当前用户导入默认基准数据（不传 records 时使用系统内置的 CSV 数据集）
   */
  async seedDefaultBenchmarks(
    userId: string,
    customRecords?: ScreeningBenchmarkRecordDto[],
  ) {
    try {
      if (customRecords && customRecords.length > 0) {
        return this.importScreeningBenchmark(customRecords, userId);
      }

      // 尝试从服务端 datasets 目录读取 CSV
      const csvPath = this.resolveDatasetCsvPath();
      this.logger.log(`🔍 seedDefaultBenchmarks: csvPath resolved to ${csvPath}`);
      if (!csvPath) {
        // 没有服务端 CSV → 让客户端通过 import_benchmark.py 上传
        return {
          success: false,
          message:
            '服务端未找到数据集文件，请使用 import_benchmark.py 脚本导入',
        };
      }

      this.logger.log(`🔍 Reading CSV from: ${csvPath}, exists: ${fs.existsSync(csvPath)}`);
      const records = this.parseCsvRecords(csvPath);
      this.logger.log(`🔍 Parsed ${records.length} records from CSV`);
      return this.importScreeningBenchmark(records, userId);
    } catch (err) {
      this.logger.error(`❌ seedDefaultBenchmarks 失败: ${(err as Error).message}`);
      this.logger.error(`❌ Stack: ${(err as Error).stack}`);
      throw err;
    }
  }

  /**
   * 获取当前用户指定岗位的基准统计（用于评估时参考对照）
   */
  async getBenchmarkStats(userId: string, jobRole: string) {
    const benchmarks = await this.prisma.screeningBenchmark.findMany({
      where: { userId, jobRole },
      orderBy: { aiScore: 'desc' },
    });

    if (benchmarks.length === 0) {
      return { jobRole, total: 0, message: '暂无该岗位的基准数据' };
    }

    const scores = benchmarks.map((b) => b.aiScore);
    const avgScore =
      scores.reduce((a, b) => a + b, 0) / scores.length;
    const decisions: Record<string, number> = {};
    for (const b of benchmarks) {
      decisions[b.recruiterDecision] =
        (decisions[b.recruiterDecision] || 0) + 1;
    }

    return {
      jobRole,
      total: benchmarks.length,
      avgAiScore: Math.round(avgScore * 10) / 10,
      minScore: Math.min(...scores),
      maxScore: Math.max(...scores),
      decisionDistribution: decisions,
      topCandidates: benchmarks.slice(0, 5).map((b) => ({
        name: b.name,
        aiScore: b.aiScore,
        decision: b.recruiterDecision,
        experienceYears: b.experienceYears,
        education: b.education,
      })),
    };
  }

  /**
   * 获取当前用户所有岗位的基准统计
   */
  async getAllBenchmarkStats(userId: string) {
    const roles = await this.prisma.screeningBenchmark.findMany({
      where: { userId },
      select: { jobRole: true },
      distinct: ['jobRole'],
    });

    if (roles.length === 0) {
      return { roles: [], message: '暂无基准数据，请先调用 benchmark-seed 导入' };
    }

    const stats = await Promise.all(
      roles.map((r) => this.getBenchmarkStats(userId, r.jobRole)),
    );

    return { roles: stats };
  }

  /**
   * 筛选评估 — 使用 AI 对候选人档案进行评分，并返回同岗位基准对照
   */
  async evaluateScreening(dto: ScreeningEvaluateDto, userId: string) {
    this.logger.log(`🔍 执行筛选评估: role=${dto.jobRole}`);

    // 1. 获取同岗位基准数据作为参考
    const benchmarkStats = await this.getBenchmarkStats(userId, dto.jobRole);

    const benchmarkContext =
      benchmarkStats && 'total' in benchmarkStats && benchmarkStats.total > 0
        ? `\n\n📊 同岗位基准参考（基于 ${benchmarkStats.total} 份历史数据）：
- 平均 AI 评分: ${benchmarkStats.avgAiScore}
- AI 评分范围: ${benchmarkStats.minScore} ~ ${benchmarkStats.maxScore}
- 招聘决策分布: ${JSON.stringify(benchmarkStats.decisionDistribution)}
- 最高分候选人经验年限: ${(benchmarkStats.topCandidates ?? []).map((c) => c.name + '(' + c.experienceYears + '年)').join('、')}`
        : '';

    // 2. 构建提示词
    const prompt = `你是一个专业的 AI 招聘筛选助手。请根据以下职位要求和候选人信息，给出综合评分和评估意见。

职位: ${dto.jobRole}
技能: ${dto.skills.join(', ')}
经验年限: ${dto.experienceYears} 年
教育背景: ${dto.education}
${dto.certifications ? `证书: ${dto.certifications}` : ''}
${dto.projectsCount ? `项目数量: ${dto.projectsCount}` : ''}${benchmarkContext}

请从以下几个维度评估（每项 0-100 分）：
1. 技能匹配度 (skillMatch)
2. 经验相关度 (experienceRelevance)
3. 教育适配度 (educationFit)
4. 综合评分 (overallScore)
5. 推荐决策 (recommendation): "hire" / "review" / "reject"

以严格 JSON 格式返回:
{
  "skillMatch": number,
  "experienceRelevance": number,
  "educationFit": number,
  "overallScore": number,
  "recommendation": "hire" | "review" | "reject",
  "strengths": string[],
  "weaknesses": string[],
  "comment": string
}`;

    try {
      const aiResult = await this.aiService.callLLM(
        '你是一个专业的 AI 招聘筛选助手。',
        prompt,
        0.3,
        'resume:screening',
      );

      // 3. 返回 AI 评分 + 基准对照
      return {
        evaluation: aiResult,
        benchmark: benchmarkStats,
      };
    } catch (err) {
      this.logger.error(`AI 筛选评估失败: ${(err as Error).message}`);
      throw new BadRequestException('AI 筛选评估失败，请稍后重试');
    }
  }

  // ================== 内部辅助方法 ==================

  /**
   * 解析数据集 CSV 文件路径
   */
  private resolveDatasetCsvPath(): string | null {
    // 尝试多个可能路径
    const candidates = [
      // 相对于后端运行目录
      '../datasets/AI_Resume_Screening/AI_Resume_Screening.csv',
      // 相对于 backend 目录
      '../../datasets/AI_Resume_Screening/AI_Resume_Screening.csv',
      // 基于 __dirname 的深度优先路径
      path.join(__dirname, '../../../datasets/AI_Resume_Screening/AI_Resume_Screening.csv'),
      // 绝对路径
      'D:\\gitclone\\软件工程实训（二）\\career-copilot\\datasets\\AI_Resume_Screening\\AI_Resume_Screening.csv',
      // 环境变量
      process.env.BENCHMARK_CSV_PATH,
    ].filter(Boolean) as string[];

    for (const p of candidates) {
      if (fs.existsSync(p)) {
        this.logger.log(`✅ CSV 路径解析成功: ${p}`);
        return p;
      }
    }
    this.logger.warn(`❌ 所有 CSV 候选路径均不存在: ${JSON.stringify(candidates)}`);
    return null;
  }

  /**
   * 解析 CSV 文件为 ScreeningBenchmarkRecordDto[]
   */
  /**
   * 解析一行 CSV（支持双引号包裹的字段，如 Skills 中的逗号）
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  private parseCsvRecords(csvPath: string): ScreeningBenchmarkRecordDto[] {
    const content = fs.readFileSync(csvPath, 'utf-8').trim();
    const lines = content.split('\n');
    const headers = this.parseCsvLine(lines[0]);
    const records: ScreeningBenchmarkRecordDto[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCsvLine(lines[i]);
      if (values.length < headers.length) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => (row[h] = values[idx]));

      records.push({
        resumeId: parseInt(row['Resume_ID'] || '0'),
        name: row['Name'] || '',
        skills: (row['Skills'] || '').split(',').map((s) => s.trim()),
        experienceYears: parseFloat(row['Experience (Years)'] || '0'),
        education: row['Education'] || '',
        certifications:
          row['Certifications'] && row['Certifications'] !== 'None'
            ? row['Certifications']
            : undefined,
        jobRole: row['Job Role'] || '',
        recruiterDecision: row['Recruiter Decision'] || '',
        salaryExpectation: parseInt(row['Salary Expectation ($)'] || '0'),
        projectsCount: parseInt(row['Projects Count'] || '0'),
        aiScore: parseInt(row['AI Score (0-100)'] || '0'),
      });
    }

    return records;
  }
}
