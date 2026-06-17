// ============================================================
// 简历解析队列消费者 — Bull 异步解析
// T-009: Resume Processor
// ============================================================

import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { ResumeParser } from './resume.parser';

@Processor('resume-parser')
export class ResumeProcessor extends WorkerHost {
  private readonly logger = new Logger(ResumeProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly resumeParser: ResumeParser,
  ) {
    super();
  }

  async process(job: Job<{ resumeId: string }>): Promise<void> {
    const { resumeId } = job.data;
    this.logger.log(`🔄 开始解析简历: resumeId=${resumeId}, jobId=${job.id}`);

    try {
      // 1. 从 DB 获取简历记录
      const resume = await this.prisma.resume.findUnique({
        where: { id: resumeId },
      });

      if (!resume) {
        this.logger.warn(`⚠️ 简历不存在: ${resumeId}`);
        return;
      }

      if (!resume.fileUrl) {
        throw new Error('简历文件路径为空');
      }

      // 2. 提取文件文本
      const text = await this.resumeParser.extractText(resume.fileUrl);

      // 3. LLM 结构化提取
      const parsedData = await this.resumeParser.parseWithLLM(text);

      // 4. 更新数据库
      await this.prisma.resume.update({
        where: { id: resumeId },
        data: {
          parsedData: JSON.parse(JSON.stringify(parsedData)),
          skills: parsedData.skills || [],
          status: 'completed',
        },
      });

      this.logger.log(
        `✅ 简历解析完成: resumeId=${resumeId}, skills=${parsedData.skills.length} 项`,
      );
    } catch (error) {
      this.logger.error(
        `❌ 简历解析失败: resumeId=${resumeId}`,
        error instanceof Error ? error.message : String(error),
      );

      // 解析失败更新状态
      await this.prisma.resume
        .update({
          where: { id: resumeId },
          data: { status: 'failed' },
        })
        .catch((e) => {
          this.logger.error(`更新失败状态出错: ${e.message}`);
        });
    }
  }
}
