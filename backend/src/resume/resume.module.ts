import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeParser } from './resume.parser';
import { ResumeProcessor } from './resume.processor';

@Module({
  imports: [BullModule.registerQueue({ name: 'resume-parser' })],
  controllers: [ResumeController],
  providers: [ResumeService, ResumeParser, ResumeProcessor],
  exports: [ResumeService, ResumeParser],
})
export class ResumeModule {}
