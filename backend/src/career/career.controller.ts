import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { CareerService } from './career.service';
import { MarketInsightService } from './market-insight.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('职业规划')
@Controller('career')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CareerController {
  constructor(
    private careerService: CareerService,
    private marketInsightService: MarketInsightService,
  ) {}

  @Post('plan')
  createPlan(@CurrentUser('id') userId: string, @Body() dto: CreatePlanDto) {
    return this.careerService.createPlan(userId, dto);
  }

  @Get('plans')
  getPlans(@CurrentUser('id') userId: string) {
    return this.careerService.getPlans(userId);
  }

  @Get('plans/:id')
  getPlan(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.careerService.getPlan(id, userId);
  }

  @Get('market-insight')
  @ApiOperation({
    summary: '获取市场洞察数据',
    description:
      '通过 AI 生成目标岗位的模拟市场数据（薪资、需求趋势、核心技能等）',
  })
  @ApiQuery({
    name: 'position',
    required: true,
    description: '目标岗位名称，例如：前端开发工程师、Java 后端、产品经理',
    example: '前端开发工程师',
  })
  getMarketInsight(@Query('position') position: string) {
    return this.marketInsightService.getInsight(position);
  }

  @Delete('plans/:id')
  @ApiOperation({
    summary: '删除职业规划',
    description: '删除指定的职业规划记录',
  })
  deletePlan(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.careerService.deletePlan(id, userId);
  }
}
