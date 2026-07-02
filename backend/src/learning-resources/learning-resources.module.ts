import { Module } from '@nestjs/common';
import { LearningResourcesController } from './learning-resources.controller';
import { LearningResourcesService } from './learning-resources.service';
import { LearningResourcesSeedService } from './learning-resources-seed.service';
import { CommonModule } from '../common/common.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [CommonModule, AiModule],
  controllers: [LearningResourcesController],
  providers: [LearningResourcesService, LearningResourcesSeedService],
  exports: [LearningResourcesService],
})
export class LearningResourcesModule {}
