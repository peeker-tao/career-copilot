import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { InterviewReportService } from './interview-report.service';

/**
 * 面试反馈生成处理器
 * 消费 feedback-generator 队列，异步生成面试报告
 */
@Processor('feedback-generator')
export class InterviewProcessor extends WorkerHost {
  private readonly logger = new Logger(InterviewProcessor.name);

  constructor(
    private interviewReportService: InterviewReportService,
  ) {
    super();
  }

  async process(job: Job<{ interviewId: string; userId: string }>): Promise<any> {
    const { interviewId, userId } = job.data;
    this.logger.log(`📋 开始异步生成面试报告: interviewId=${interviewId}, jobId=${job.id}`);

    try {
      // 更新进度
      await job.updateProgress(10);

      // 调用报告生成服务
      const report = await this.interviewReportService.generateReport(
        interviewId,
        userId,
      );

      await job.updateProgress(100);
      this.logger.log(`✅ 面试报告生成完成: interviewId=${interviewId}, score=${report.overallScore}`);
      return report;
    } catch (error) {
      this.logger.error(
        `❌ 面试报告生成失败: interviewId=${interviewId}, error=${(error as Error).message}`,
      );
      throw error;
    }
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job) {
    this.logger.log(`✅ 面试反馈任务完成: jobId=${job.id}`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error) {
    this.logger.error(
      `❌ 面试反馈任务失败: jobId=${job.id}, error=${error.message}`,
    );
  }
}
