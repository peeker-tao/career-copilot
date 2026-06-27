import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RewriteSectionDto {
  @ApiProperty({ description: '要重写的章节名称', example: 'experience' })
  @IsString()
  section!: string;

  @ApiPropertyOptional({ description: '自定义修改指令', example: '突出量化成果，使用 STAR 法则' })
  @IsOptional()
  @IsString()
  instruction?: string;
}

export class RewriteSuggestionsDto {
  @ApiPropertyOptional({ description: '自定义优化目标', example: '更适合大厂后端岗位' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ description: '重点关注方面', example: ['项目经历', '技能描述'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  focusAreas?: string[];
}
