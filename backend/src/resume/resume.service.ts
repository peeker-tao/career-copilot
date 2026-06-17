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
import * as path from 'path';

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

    // 创建简历记录（初始状态）
    const resume = await this.prisma.resume.create({
      data: {
        userId,
        title: file.originalname,
        fileUrl: file.path,
        status: 'parsing',
      },
    });

    try {
      // 同步解析：提取文本 + LLM 结构化提取
      this.logger.log(`🔄 开始解析简历: resumeId=${resume.id}`);
      if (!resume.fileUrl) {
        throw new Error('简历文件路径为空');
      }
      const text = await this.resumeParser.extractText(resume.fileUrl);
      const parsedData = await this.resumeParser.parseWithLLM(text);

      // 更新数据库
      const updated = await this.prisma.resume.update({
        where: { id: resume.id },
        data: {
          parsedData: JSON.parse(JSON.stringify(parsedData)),
          skills: parsedData.skills || [],
          status: 'completed',
        },
      });

      this.logger.log(
        `✅ 简历解析完成: resumeId=${resume.id}, skills=${parsedData.skills.length} 项`,
      );
      return updated;
    } catch (error) {
      this.logger.error(
        `❌ 简历解析失败: resumeId=${resume.id}`,
        error instanceof Error ? error.message : String(error),
      );

      // 更新失败状态
      await this.prisma.resume
        .update({
          where: { id: resume.id },
          data: { status: 'failed' },
        })
        .catch((e) => {
          this.logger.error(`更新失败状态出错: ${e.message}`);
        });

      // 仍然返回简历记录，但 status 为 failed
      return this.prisma.resume.findUnique({ where: { id: resume.id } });
    }
  }

  async findAll(
    userId: string,
    options: { page?: number; limit?: number; status?: string },
  ) {
    const { page = 1, limit = 10, status } = options;
    const skip = (page - 1) * limit;

    const where: any = { userId };
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
