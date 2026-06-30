import { IsString, IsOptional, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateInterviewDto {
  @ApiProperty({ description: '目标岗位', example: '前端开发工程师' })
  @IsString({ message: 'targetPosition 必须是字符串' })
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
