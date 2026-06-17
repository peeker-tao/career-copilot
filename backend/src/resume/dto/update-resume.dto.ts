import { IsOptional, IsString, IsArray, IsObject, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateResumeDto {
  @ApiPropertyOptional({
    description: '简历标题',
    example: '张三 - 前端开发简历',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: '技能标签',
    example: ['JavaScript', 'React', 'TypeScript'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  skills?: string[];

  @ApiPropertyOptional({
    description: '解析状态',
    enum: ['parsing', 'completed', 'failed'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['parsing', 'completed', 'failed'])
  status?: string;

  @ApiPropertyOptional({
    description: '完整的简历解析数据（JSON 对象）',
    example: {
      basicInfo: { name: '张三', phone: '13800138000', email: 'test@test.com' },
      education: [
        {
          school: '北京大学',
          major: '计算机科学与技术',
          degree: '本科',
          startDate: '2018-09',
          endDate: '2022-06',
        },
      ],
      experience: [
        {
          company: '字节跳动',
          position: '前端工程师',
          startDate: '2022-07',
          endDate: '至今',
          description: '负责核心业务前端开发',
        },
      ],
      projects: [
        {
          name: '电商平台',
          role: '前端开发',
          techStack: ['React', 'TypeScript'],
          description: '...',
        },
      ],
      skills: ['JavaScript', 'React'],
      summary: '3 年前端开发经验',
    },
  })
  @IsOptional()
  @IsObject()
  parsedData?: Record<string, unknown>;
}
