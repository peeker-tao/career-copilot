import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { AiInterviewService } from './ai-interview.service';
import { InterviewGateway } from './interview.gateway';
import { InterviewReportService } from './interview-report.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [InterviewController],
  providers: [
    InterviewService,
    AiInterviewService,
    InterviewGateway,
    InterviewReportService,
  ],
  exports: [InterviewService, AiInterviewService, InterviewReportService],
})
export class InterviewModule {}
