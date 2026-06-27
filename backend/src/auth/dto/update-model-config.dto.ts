import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateModelConfigDto {
  @ApiPropertyOptional({
    description: 'LLM 提供商',
    example: 'openai',
    enum: ['openai', 'dashscope', 'deepseek'],
  })
  @IsOptional()
  @IsString()
  provider?: string;

  @ApiPropertyOptional({
    description: '模型名称',
    example: 'gpt-4o-mini',
  })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiPropertyOptional({
    description: 'API Key',
    example: 'sk-xxx',
  })
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'API Key 不能为空' })
  apiKey?: string;

  @ApiPropertyOptional({
    description: 'API Base URL',
    example: 'https://api.openai.com/v1',
  })
  @IsOptional()
  @IsString()
  baseURL?: string;

  @ApiPropertyOptional({
    description: '温度参数 (0-2)',
    example: 0.7,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: '最大 Token 数',
    example: 2048,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(128000)
  maxTokens?: number;
}
