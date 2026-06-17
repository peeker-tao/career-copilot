import { Module } from '@nestjs/common';
import { CareerController } from './career.controller';
import { CareerService } from './career.service';
import { CareerPlanner } from './career.planner';
import { MarketInsightService } from './market-insight.service';

@Module({
  controllers: [CareerController],
  providers: [CareerService, CareerPlanner, MarketInsightService],
  exports: [CareerService, CareerPlanner, MarketInsightService],
})
export class CareerModule {}
