import { IsString, IsOptional } from 'class-validator';
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
}
