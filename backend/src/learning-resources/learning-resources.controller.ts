import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LearningResourcesService } from './learning-resources.service';
import { BrowseResourcesDto, AiRecommendationsDto } from './dto/learning-resources.dto';

@ApiTags('学习资源')
@Controller('learning-resources')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningResourcesController {
  constructor(private readonly service: LearningResourcesService) {}

  @Get()
  @ApiOperation({ summary: '浏览学习资源（分页、筛选、搜索）' })
  async browse(@Query() dto: BrowseResourcesDto) {
    return this.service.browse(dto);
  }

  @Get('categories')
  @ApiOperation({ summary: '获取所有资源分类' })
  async getCategories() {
    return this.service.getCategories();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取单个资源详情' })
  async getById(@Param('id') id: string) {
    return this.service.getById(id);
  }

  @Post('recommendations')
  @ApiOperation({ summary: 'AI 个性化推荐（基于技能缺口）' })
  async getRecommendations(
    @CurrentUser() user: any,
    @Body() dto: AiRecommendationsDto,
  ) {
    return this.service.getAiRecommendations(user.userId, dto);
  }
}
