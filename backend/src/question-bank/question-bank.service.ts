import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { AiService } from '../ai/ai.service';
import { BrowseQuestionsDto, GenerateQuestionsDto } from './dto/question-bank.dto';

@Injectable()
export class QuestionBankService {
  private readonly logger = new Logger(QuestionBankService.name);

  constructor(
    private prisma: PrismaService,
    private aiService: AiService,
  ) {}

  async browse(dto: BrowseQuestionsDto) {
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
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.questionBank.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.questionBank.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getById(id: string) {
    const question = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!question) {
      throw new BadRequestException('题目不存在');
    }

    // 增加浏览次数
    await this.prisma.questionBank.update({
      where: { id },
      data: { usageCount: { increment: 1 } },
    });

    return question;
  }

  async getCategories() {
    const result = await this.prisma.questionBank.findMany({
      select: { category: true },
      distinct: ['category'],
    });
    return result.map((r) => r.category);
  }

  async generate(dto: GenerateQuestionsDto) {
    const systemPrompt = `你是一个专业的技术面试出题专家。根据要求生成高质量的面试题目。
以严格的 JSON 数组格式返回，每条包含：
- category: 分类
- type: choice | short_answer | coding | behavioral
- difficulty: easy | medium | hard
- title: 题目标题
- content: { question, options?(选择题用), answer, explanation }`;

    const userPrompt = `请生成 ${dto.count || 5} 道面试题目：
岗位方向: ${dto.position || '通用'}
分类: ${dto.category || '综合'}
难度: ${dto.difficulty || 'medium'}
题型: ${dto.type || 'mixed'}`;

    try {
      const raw = await this.aiService.callLLM(systemPrompt, userPrompt);
      let questions: any[];
      try {
        questions = typeof raw === 'string' ? JSON.parse(raw) : raw;
      } catch {
        throw new BadRequestException('AI 返回格式异常');
      }

      if (!Array.isArray(questions)) {
        throw new BadRequestException('AI 返回格式异常');
      }

      // 批量保存到数据库
      const created = [];
      for (const q of questions) {
        const saved = await this.prisma.questionBank.create({
          data: {
            category: q.category || dto.category || 'general',
            type: q.type || 'short_answer',
            difficulty: q.difficulty || 'medium',
            title: q.title || q.content?.question?.slice(0, 100) || 'Untitled',
            content: q.content || q,
            tags: [],
            source: 'ai_generated',
          },
        });
        created.push(saved);
      }

      return { count: created.length, questions: created };
    } catch (err) {
      this.logger.error(`AI 生成题目失败: ${(err as Error).message}`);
      throw new BadRequestException('AI 生成题目失败');
    }
  }
}
