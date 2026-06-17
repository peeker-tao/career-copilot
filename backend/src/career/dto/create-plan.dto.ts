import { IsString, IsOptional, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePlanDto {
  @ApiProperty({
    description: '目标岗位名称',
    example: '前端开发工程师',
  })
  @IsString({ message: 'targetPosition 必须是字符串' })
  targetPosition: string;

  @ApiPropertyOptional({
    description: '当前具备的技能列表',
    example: ['Vue', 'React', 'Node.js'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'currentSkills 必须是数组' })
  currentSkills?: string[];

  @ApiPropertyOptional({
    description: '关联的简历 ID',
    example: 'cm8abc123...',
  })
  @IsOptional()
  @IsString({ message: 'resumeId 必须是字符串' })
  resumeId?: string;
}
