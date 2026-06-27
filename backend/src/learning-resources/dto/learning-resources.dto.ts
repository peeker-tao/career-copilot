import { IsOptional, IsString, IsNumber, IsArray } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BrowseResourcesDto {
  @ApiPropertyOptional({ description: '分类', example: 'java' })
  @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '类型', example: 'course' })
  @IsOptional() @IsString()
  type?: string;

  @ApiPropertyOptional({ description: '难度', example: 'intermediate' })
  @IsOptional() @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: '搜索关键词' })
  @IsOptional() @IsString()
  search?: string;

  @ApiPropertyOptional({ description: '标签筛选' })
  @IsOptional() @IsArray() @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: '页码', example: 1 })
  @IsOptional() @Type(() => Number) @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: '每页条数', example: 20 })
  @IsOptional() @Type(() => Number) @IsNumber()
  limit?: number;
}

export class AiRecommendationsDto {
  @ApiPropertyOptional({ description: '目标岗位', example: 'Java后端工程师' })
  @IsOptional() @IsString()
  targetPosition?: string;

  @ApiPropertyOptional({ description: '技能缺口（覆盖 careerPlan gapSkills）' })
  @IsOptional() @IsArray() @IsString({ each: true })
  gapSkills?: string[];

  @ApiPropertyOptional({ description: '推荐数量', example: 5 })
  @IsOptional() @Type(() => Number) @IsNumber()
  count?: number;
}
