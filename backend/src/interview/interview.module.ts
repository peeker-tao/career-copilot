import { Module } from '@nestjs/common';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { AiInterviewService } from './ai-interview.service';
import { InterviewGateway } from './interview.gateway';
import { InterviewReportService } from './interview-report.service';
import { InterviewProcessor } from './interview.processor';

@Module({
  imports: [],
  controllers: [InterviewController],
  providers: [
    InterviewService,
    AiInterviewService,
    InterviewGateway,
    InterviewReportService,
    InterviewProcessor,
  ],
  exports: [
    InterviewService,
    AiInterviewService,
    InterviewReportService,
    InterviewProcessor,
  ],
})
export class InterviewModule {}
