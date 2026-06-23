import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { ResumeParser } from './resume.parser';
import { UpdateResumeDto } from './dto/update-resume.dto';
import * as fs from 'fs';

@Injectable()
export class ResumeService {
  private readonly logger = new Logger(ResumeService.name);

  constructor(
    private prisma: PrismaService,
    private resumeParser: ResumeParser,
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
}
