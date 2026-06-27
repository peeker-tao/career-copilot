import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  Min,
  Max,
} from 'class-validator';

/**
 * 单条基准评估记录
 */
export class ScreeningBenchmarkRecordDto {
  @IsNumber()
  resumeId: number;

  @IsString()
  name: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears: number;

  @IsString()
  education: string;

  @IsOptional()
  @IsString()
  certifications?: string;

  @IsString()
  jobRole: string;

  @IsString()
  recruiterDecision: string;

  @IsNumber()
  salaryExpectation: number;

  @IsNumber()
  projectsCount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  aiScore: number;
}

/**
 * 基准评估批量导入请求
 */
export class ScreeningBenchmarkImportDto {
  @IsArray()
  records: ScreeningBenchmarkRecordDto[];
}

/**
 * 筛选评估请求
 */
export class ScreeningEvaluateDto {
  @IsString()
  jobRole: string;

  @IsArray()
  @IsString({ each: true })
  skills: string[];

  @IsNumber()
  @Min(0)
  @Max(50)
  experienceYears: number;

  @IsString()
  education: string;

  @IsOptional()
  @IsString()
  certifications?: string;

  @IsOptional()
  @IsNumber()
  projectsCount?: number;
}
