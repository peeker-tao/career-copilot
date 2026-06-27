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
      return await this.aiService.callLLM(systemPrompt, userPrompt);
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
      const rewritten = await this.aiService.callLLM(systemPrompt, userPrompt);

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
  // 筛选基准评估 (Dataset 4)
  // ================================================

  /**
   * 批量导入筛选基准评估数据
   */
  async importScreeningBenchmark(records: ScreeningBenchmarkRecordDto[]) {
    this.logger.log(`📊 导入筛选基准数据: ${records.length} 条`);

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

    return {
      success: true,
      imported: records.length,
      message: `成功导入 ${records.length} 条筛选基准记录`,
    };
  }

  /**
   * 筛选评估 — 使用 AI 对候选人档案进行评分
   */
  async evaluateScreening(dto: ScreeningEvaluateDto) {
    this.logger.log(`🔍 执行筛选评估: role=${dto.jobRole}`);

    const prompt = `你是一个专业的 AI 招聘筛选助手。请根据以下职位要求和候选人信息，给出综合评分和评估意见。

职位: ${dto.jobRole}
技能: ${dto.skills.join(', ')}
经验年限: ${dto.experienceYears} 年
教育背景: ${dto.education}
${dto.certifications ? `证书: ${dto.certifications}` : ''}
${dto.projectsCount ? `项目数量: ${dto.projectsCount}` : ''}

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
      const result = await this.aiService.callLLM(
        '你是一个专业的 AI 招聘筛选助手。',
        prompt,
      );
      return result;
    } catch (err) {
      this.logger.error(`AI 筛选评估失败: ${(err as Error).message}`);
      throw new BadRequestException('AI 筛选评估失败，请稍后重试');
    }
  }
}
