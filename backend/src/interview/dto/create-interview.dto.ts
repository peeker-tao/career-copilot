import { IsString, IsOptional, IsIn, MinLength, MaxLength, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInterviewDto {
  @ApiProperty({ description: '目标岗位', example: '前端开发工程师' })
  @IsString({ message: 'targetPosition 必须是字符串' })
  @MinLength(2, { message: '岗位名称至少需要 2 个字符' })
  @MaxLength(50, { message: '岗位名称不能超过 50 个字符' })
  @Matches(/^[\u4e00-\u9fa5a-zA-Z0-9\s\/\+\-]+$/, {
    message: '岗位名称只能包含中文、英文字母、数字、空格和少量符号（/ + -）',
  })
  targetPosition: string;

  @ApiPropertyOptional({
    description: '难度',
    example: 'mid',
    enum: ['junior', 'mid', 'senior'],
  })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ description: '关联的简历 ID', example: 'cmqg...' })
  @IsOptional()
  @IsString()
  resumeId?: string;

  @ApiPropertyOptional({
    description: '面试类型: text(文字面试) / audio(语音面试)',
    example: 'text',
    enum: ['text', 'audio'],
  })
  @IsOptional()
  @IsIn(['text', 'audio'], { message: 'type 必须是 text 或 audio' })
  type?: string;
}
