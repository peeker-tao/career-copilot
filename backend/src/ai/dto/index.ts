import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsNumber,
  IsIn,
  Min,
  Max,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/* ────────── 简历解析 ────────── */

export class ParseResumeDto {
  @ApiProperty({ description: '简历原始文本', example: '姓名：张三\n电话：13800138000\n...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  text!: string;
}

/* ────────── 面试题生成 ────────── */

export class GenerateQuestionDto {
  @ApiProperty({ description: '目标岗位', example: '前端开发工程师' })
  @IsString()
  @IsNotEmpty()
  position!: string;

  @ApiPropertyOptional({ description: '所属行业', example: '互联网' })
  @IsString()
  @IsOptional()
  industry?: string;

  @ApiProperty({ description: '难度级别', enum: ['junior', 'mid', 'senior'] })
  @IsString()
  @IsIn(['junior', 'mid', 'senior'])
  difficulty!: 'junior' | 'mid' | 'senior';

  @ApiPropertyOptional({ description: '题目数量', example: 5 })
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(20)
  count?: number;

  @ApiPropertyOptional({ description: '重点考察技能', example: ['React', 'TypeScript'] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}

/* ────────── 回答评估 ────────── */

export class EvaluateAnswerDto {
  @ApiProperty({ description: '面试题目', example: '请解释 React 虚拟 DOM 的原理' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiPropertyOptional({ description: '期望答案', example: '虚拟 DOM 是真实 DOM 的 JS 对象表示...' })
  @IsString()
  @IsOptional()
  expectedAnswer?: string;

  @ApiPropertyOptional({ description: '目标岗位', example: '前端开发工程师' })
  @IsString()
  @IsOptional()
  position?: string;

  @ApiPropertyOptional({ description: '难度级别', example: 'mid' })
  @IsString()
  @IsOptional()
  difficulty?: string;

  @ApiProperty({ description: '用户回答内容', example: '虚拟 DOM 是一种...' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  answer!: string;
}

/* ────────── 面试报告 ────────── */

export class InterviewMessageDto {
  @ApiProperty({ description: '面试问题' })
  @IsString()
  @IsNotEmpty()
  question!: string;

  @ApiProperty({ description: '用户回答' })
  @IsString()
  @IsNotEmpty()
  answer!: string;

  @ApiPropertyOptional({ description: '评分（0-100）' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  score?: number;
}

export class GenerateReportDto {
  @ApiProperty({ description: '面试问答记录列表', type: [InterviewMessageDto] })
  @IsArray()
  @IsNotEmpty()
  messages!: InterviewMessageDto[];
}

/* ────────── 职业规划 ────────── */

export class GenerateCareerPlanDto {
  @ApiProperty({ description: '当前技能列表', example: ['JavaScript', 'Vue', 'CSS'] })
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty()
  currentSkills!: string[];

  @ApiProperty({ description: '目标岗位', example: '高级前端开发工程师' })
  @IsString()
  @IsNotEmpty()
  targetPosition!: string;

  @ApiPropertyOptional({ description: '工作经验', example: '1年前端开发经验' })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiPropertyOptional({ description: '教育背景', example: '本科-计算机科学与技术' })
  @IsString()
  @IsOptional()
  education?: string;

  @ApiPropertyOptional({ description: '个人目标', example: '希望在2年内成长为高级前端工程师' })
  @IsString()
  @IsOptional()
  goals?: string;
}
