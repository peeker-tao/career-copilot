import { Module } from '@nestjs/common';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { ResumeParser } from './resume.parser';

@Module({
  controllers: [ResumeController],
  providers: [ResumeService, ResumeParser],
  exports: [ResumeService, ResumeParser],
})
export class ResumeModule {}
