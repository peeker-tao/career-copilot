import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class CreateVoiceSessionDto {
  @ApiProperty({ description: '目标岗位', example: '前端开发工程师' })
  @IsString()
  targetPosition: string;

  @ApiPropertyOptional({ description: '难度', example: 'medium', enum: ['easy', 'medium', 'hard'] })
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string;

  @ApiPropertyOptional({ description: '简历 ID' })
  @IsOptional()
  @IsString()
  resumeId?: string;
}
