import { Module } from '@nestjs/common';
import { JobMatchingController } from './job-matching.controller';
import { JobMatchingService } from './job-matching.service';
import { CommonModule } from '../common/common.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [CommonModule, AiModule],
  controllers: [JobMatchingController],
  providers: [JobMatchingService],
  exports: [JobMatchingService],
})
export class JobMatchingModule {}
