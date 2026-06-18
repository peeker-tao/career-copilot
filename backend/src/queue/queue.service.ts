import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, Job } from 'bullmq';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(@InjectQueue('resume-parser') private resumeQueue: Queue) {}

  /**
   * 添加简历解析任务到队列
   * @param resumeId 简历 ID
   * @returns 创建的 Job
   */
  async addResumeParsingJob(
    resumeId: string,
  ): Promise<Job<{ resumeId: string }>> {
    const job = await this.resumeQueue.add(
      'parse-resume',
      { resumeId },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 60000,
        },
      },
    );
    this.logger.log(
      `📤 简历解析任务已入队列: resumeId=${resumeId}, jobId=${job.id}`,
    );
    return job;
  }

  /**
   * 获取简历解析任务状态
   * @param jobId 任务 ID
   */
  async getJobStatus(jobId: string): Promise<{
    status: 'waiting' | 'active' | 'completed' | 'failed';
    progress?: number;
    returnValue?: unknown;
    failedReason?: string;
  }> {
    const job = await this.resumeQueue.getJob(jobId);
    if (!job) {
      throw new Error(`任务不存在: ${jobId}`);
    }

    const state = await job.getState();
    return {
      status: state as 'waiting' | 'active' | 'completed' | 'failed',
      progress: job.progress as number | undefined,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }
}
