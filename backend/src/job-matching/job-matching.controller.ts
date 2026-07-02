import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiProperty,
  ApiPropertyOptional,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JobMatchingService } from './job-matching.service';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';

export class RecommendQueryDto {
  @ApiPropertyOptional({
    description: '推荐数量（1-50）',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class MatchQueryDto {
  @ApiPropertyOptional({
    description: '页码（从 1 开始）',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({
    description: '每页数量（1-50）',
    example: 10,
    minimum: 1,
    maximum: 50,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @ApiPropertyOptional({
    description: '筛选状态 (pending/saved/applied/archived)',
    example: 'saved',
  })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateStatusDto {
  @ApiProperty({
    description: '目标状态',
    example: 'applied',
    enum: ['pending', 'saved', 'applied', 'archived'],
  })
  @IsString()
  status!: string;
}

export class AnalyzeMatchDto {
  @ApiProperty({
    description: '简历 ID',
    example: 'cm7abc123def456xyz',
  })
  @IsString()
  resumeId!: string;

  @ApiProperty({
    description: '目标岗位名称',
    example: '前端工程师',
  })
  @IsString()
  position!: string;
}

/** 一键导入基准数据的返回结构 */
export class SeedDefaultResponseDto {
  @ApiProperty({ description: 'CSV 总行数', example: 9544 })
  total!: number;

  @ApiProperty({ description: '成功导入数', example: 9500 })
  success!: number;

  @ApiProperty({ description: '跳过行数', example: 44 })
  skipped!: number;

  @ApiProperty({ description: '错误详情列表', example: [] })
  errors!: string[];
}

/** 数据库统计返回结构 */
export class StatsResponseDto {
  @ApiProperty({ description: '岗位匹配总记录数', example: 9544 })
  total!: number;

  @ApiProperty({
    description: '按状态分布',
    example: { pending: 100, saved: 9000, applied: 300, archived: 144 },
  })
  statusDistribution!: Record<string, number>;

  @ApiProperty({
    description: '按来源分布',
    example: { external: 9500, ai_recommended: 44 },
  })
  sourceDistribution!: Record<string, number>;

  @ApiProperty({
    description: '分数统计',
    example: { average: 72.5, max: 100, min: 0 },
  })
  scoreStats!: { average: number; max: number; min: number };

  @ApiProperty({
    description: '热门岗位 Top 10',
    example: [{ position: '软件工程师', count: 120, avgMatchScore: 78.5 }],
  })
  topPositions!: { position: string; count: number; avgMatchScore: number }[];

  @ApiProperty({
    description: '热门公司 Top 10',
    example: [{ company: '字节跳动', count: 85, avgMatchScore: 75.0 }],
  })
  topCompanies!: { company: string | null; count: number; avgMatchScore: number }[];
}

export class ImportJobMatchDto {
  @ApiProperty({
    description: '岗位名称',
    example: '软件工程师',
  })
  @IsString()
  position!: string;

  @ApiPropertyOptional({
    description: '公司名称',
    example: '字节跳动',
  })
  @IsOptional()
  @IsString()
  company?: string;

  @ApiPropertyOptional({
    description: '工作地点',
    example: '北京',
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({
    description: '岗位描述',
    example: '负责核心业务系统的设计与开发',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: '任职要求列表',
    example: ['技能要求: JavaScript, TypeScript, React', '学历要求: 本科及以上'],
  })
  @IsOptional()
  requirements?: any;

  @ApiProperty({
    description: '匹配度（0-100）',
    example: 85,
    minimum: 0,
    maximum: 100,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  matchScore!: number;

  @ApiPropertyOptional({
    description: '匹配详情',
    example: {
      matchedSkills: ['JavaScript', 'TypeScript'],
      missingSkills: ['Docker'],
      sourceData: 'kaggle_resume_dataset',
    },
  })
  @IsOptional()
  matchDetails?: any;

  @ApiPropertyOptional({
    description: '状态',
    example: 'saved',
    enum: ['pending', 'saved', 'applied', 'archived'],
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: '数据来源',
    example: 'external',
  })
  @IsOptional()
  @IsString()
  source?: string;
}

@ApiTags('岗位匹配')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('job-matching')
export class JobMatchingController {
  constructor(private readonly jobMatchingService: JobMatchingService) {}

  @Get('recommendations')
  @ApiOperation({ summary: '获取 AI 智能岗位推荐' })
  @ApiOkResponse({ description: '返回推荐岗位列表及数据来源（ai_generated / database）' })
  async getRecommendations(
    @CurrentUser('id') userId: string,
    @Query() query: RecommendQueryDto,
  ) {
    return this.jobMatchingService.recommendJobs(userId, {
      limit: query.limit,
    });
  }

  @Get('matches')
  @ApiOperation({ summary: '获取我保存的岗位列表' })
  @ApiOkResponse({ description: '分页返回已保存的岗位匹配列表' })
  async getMatches(
    @CurrentUser('id') userId: string,
    @Query() query: MatchQueryDto,
  ) {
    return this.jobMatchingService.getUserMatches(userId, query);
  }

  @Patch('matches/:id/status')
  @ApiOperation({ summary: '更新岗位状态' })
  @ApiOkResponse({ description: '返回更新后的岗位记录' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.jobMatchingService.updateMatchStatus(id, userId, dto.status);
  }

  @Post('analyze')
  @ApiOperation({ summary: '分析简历与目标岗位的匹配度' })
  @ApiCreatedResponse({ description: '返回匹配度分析结果（匹配分数、匹配/缺失技能、建议）' })
  async analyzeMatch(
    @CurrentUser('id') userId: string,
    @Body() dto: AnalyzeMatchDto,
  ) {
    return this.jobMatchingService.analyzeMatch(
      dto.resumeId,
      userId,
      dto.position,
    );
  }

  @Post('import')
  @ApiOperation({ summary: '导入外部岗位匹配数据（Kaggle 数据集等）' })
  @ApiCreatedResponse({ description: '返回新创建的岗位匹配记录' })
  @HttpCode(HttpStatus.CREATED)
  async importMatch(
    @CurrentUser('id') userId: string,
    @Body() dto: ImportJobMatchDto,
  ) {
    return this.jobMatchingService.importJobMatch({
      ...dto,
      userId,
    });
  }

  @Post('seed-default')
  @ApiOperation({
    summary: '一键导入默认基准数据（Kaggle 简历数据集）',
    description:
      '从 datasets/resume_datasets/resume_data.csv 读取约 10,000 条默认岗位基准数据并导入系统。由前端调用触发。',
  })
  @ApiCreatedResponse({
    description: '返回导入统计结果',
    type: SeedDefaultResponseDto,
  })
  @HttpCode(HttpStatus.CREATED)
  async seedDefaultData(@CurrentUser('id') userId: string) {
    return this.jobMatchingService.seedDefaultData(userId);
  }

  @Get('stats')
  @ApiOperation({
    summary: '获取岗位匹配数据库统计',
    description:
      '返回总记录数、状态分布、来源分布、分数统计、热门岗位 Top 10、热门公司 Top 10',
  })
  @ApiOkResponse({
    description: '数据库统计信息',
    type: StatsResponseDto,
  })
  async getStats() {
    return this.jobMatchingService.getStats();
  }
}
