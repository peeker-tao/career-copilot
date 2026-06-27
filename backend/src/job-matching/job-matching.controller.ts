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
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;
}

export class MatchQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateStatusDto {
  @IsString()
  status!: string;
}

export class AnalyzeMatchDto {
  @IsString()
  resumeId!: string;

  @IsString()
  position!: string;
}

export class ImportJobMatchDto {
  @IsString()
  position!: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  requirements?: any;

  @IsNumber()
  @Min(0)
  @Max(100)
  matchScore!: number;

  @IsOptional()
  matchDetails?: any;

  @IsOptional()
  @IsString()
  status?: string;

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
  async getMatches(
    @CurrentUser('id') userId: string,
    @Query() query: MatchQueryDto,
  ) {
    return this.jobMatchingService.getUserMatches(userId, query);
  }

  @Patch('matches/:id/status')
  @ApiOperation({ summary: '更新岗位状态' })
  async updateStatus(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateStatusDto,
  ) {
    return this.jobMatchingService.updateMatchStatus(id, userId, dto.status);
  }

  @Post('analyze')
  @ApiOperation({ summary: '分析简历与目标岗位的匹配度' })
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
  @HttpCode(HttpStatus.CREATED)
  async importMatch(@Body() dto: ImportJobMatchDto) {
    // 使用数据导入专用账号
    return this.jobMatchingService.importJobMatch({
      ...dto,
      userId: 'kaggle_data@import.local',
    });
  }
}
