import { IsOptional, IsString, IsArray, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BrowseQuestionsDto {
  @ApiPropertyOptional({ description: '分类', example: 'java' })
  @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '题型', example: 'coding' })
  @IsOptional() @IsString() @IsIn(['choice', 'short_answer', 'coding', 'behavioral'])
  type?: string;

  @ApiPropertyOptional({ description: '难度', example: 'medium' })
  @IsOptional() @IsString() @IsIn(['easy', 'medium', 'hard'])
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

export class GenerateQuestionsDto {
  @ApiPropertyOptional({ description: '目标岗位', example: 'Java后端' })
  @IsOptional() @IsString()
  position?: string;

  @ApiPropertyOptional({ description: '分类', example: 'java' })
  @IsOptional() @IsString()
  category?: string;

  @ApiPropertyOptional({ description: '难度', example: 'medium' })
  @IsOptional() @IsString() @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional({ description: '题型', example: 'coding' })
  @IsOptional() @IsString() @IsIn(['choice', 'short_answer', 'coding', 'behavioral'])
  type?: string;

  @ApiPropertyOptional({ description: '生成数量', example: 5 })
  @IsOptional() @Type(() => Number) @IsNumber()
  count?: number;
}
