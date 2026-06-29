import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Query,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiOperation,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { ResumeService } from './resume.service';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { RewriteSectionDto, RewriteSuggestionsDto } from './dto/rewrite-resume.dto';
import {
  ScreeningBenchmarkImportDto,
  ScreeningEvaluateDto,
} from './dto/screening-benchmark.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('简历')
@Controller('resumes')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ResumeController {
  constructor(private resumeService: ResumeService) {}

  @Post('upload')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '简历文件（PDF 或 DOCX，最大 10MB）',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'resumes'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    }),
  )
  upload(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser('id') userId: string,
  ) {
    return this.resumeService.upload(userId, file);
  }

  @Get()
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: '页码（默认 1）',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: '每页条数（默认 10）',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    type: String,
    description: '筛选状态：parsing/completed/failed',
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.resumeService.findAll(userId, { page, limit, status });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.resumeService.findOne(id, userId);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateResumeDto,
  ) {
    return this.resumeService.update(id, userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.resumeService.remove(id, userId);
  }

  @Post(':id/rewrite-suggestions')
  @ApiBody({ type: RewriteSuggestionsDto })
  async rewriteSuggestions(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RewriteSuggestionsDto,
  ) {
    return this.resumeService.generateRewriteSuggestions(id, userId, {
      goal: dto.goal,
      focusAreas: dto.focusAreas,
    });
  }

  @Post(':id/rewrite-section')
  @ApiBody({ type: RewriteSectionDto })
  async rewriteSection(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RewriteSectionDto,
  ) {
    return this.resumeService.rewriteSection(
      id,
      userId,
      dto.section,
      dto.instruction,
    );
  }

  // ================================================
  // 筛选基准评估 (Dataset 4: AI Resume Screening)
  // ================================================

  @Post('screening/benchmark-import')
  @HttpCode(201)
  @ApiBody({
    type: ScreeningBenchmarkImportDto,
    examples: {
      '一条记录': {
        summary: '单条导入示例',
        value: {
          records: [
            {
              resumeId: 1,
              name: '张三',
              skills: ['Python', 'TensorFlow', 'NLP', 'Docker'],
              experienceYears: 5,
              education: '硕士',
              certifications: 'PMP',
              jobRole: 'Software Engineer',
              recruiterDecision: 'Hire',
              salaryExpectation: 120000,
              projectsCount: 8,
              aiScore: 85,
            },
          ],
        },
      },
      '多条记录': {
        summary: '批量导入示例（2条）',
        value: {
          records: [
            {
              resumeId: 1,
              name: '张三',
              skills: ['Python', 'TensorFlow'],
              experienceYears: 5,
              education: '硕士',
              certifications: 'PMP',
              jobRole: 'Software Engineer',
              recruiterDecision: 'Hire',
              salaryExpectation: 120000,
              projectsCount: 8,
              aiScore: 85,
            },
            {
              resumeId: 2,
              name: '李四',
              skills: ['Java', 'Spring Boot', 'SQL'],
              experienceYears: 3,
              education: '本科',
              jobRole: 'Software Engineer',
              recruiterDecision: 'Review',
              salaryExpectation: 80000,
              projectsCount: 5,
              aiScore: 72,
            },
          ],
        },
      },
    },
  })
  async importScreeningBenchmark(
    @CurrentUser('id') userId: string,
    @Body() dto: ScreeningBenchmarkImportDto,
  ) {
    if (!dto.records || dto.records.length === 0) {
      throw new BadRequestException('records 不能为空');
    }
    return this.resumeService.importScreeningBenchmark(dto.records, userId);
  }

  @Post('screening/benchmark-seed')
  @HttpCode(201)
  @ApiOperation({ summary: '导入默认基准数据集', description: '从系统 CSV 数据集自动导入 1000 条岗位筛选基准记录，无需传入任何数据' })
  async seedDefaultBenchmarks(
    @CurrentUser('id') userId: string,
  ) {
    return this.resumeService.seedDefaultBenchmarks(userId);
  }

  @Get('screening/benchmark-stats')
  @ApiOperation({ summary: '获取基准统计', description: '返回当前用户指定岗位的 AI 评分分布、招聘决策分布等统计数据。不传 jobRole 则返回所有岗位的统计。' })
  @ApiQuery({ name: 'jobRole', required: false, description: '岗位名称（不传则返回全部 4 个岗位的统计）' })
  async getBenchmarkStats(
    @CurrentUser('id') userId: string,
    @Query('jobRole') jobRole?: string,
  ) {
    if (jobRole) {
      return this.resumeService.getBenchmarkStats(userId, jobRole);
    }
    return this.resumeService.getAllBenchmarkStats(userId);
  }

  @Post('screening/evaluate')
  @HttpCode(201)
  @ApiBody({
    type: ScreeningEvaluateDto,
    examples: {
      '高匹配候选人': {
        summary: '技术栈匹配度高，经验丰富',
        value: {
          jobRole: 'Software Engineer',
          skills: ['Python', 'TypeScript', 'React', 'Docker', 'AWS'],
          experienceYears: 6,
          education: '硕士',
          certifications: 'AWS Certified Developer',
          projectsCount: 10,
        },
      },
      '中等匹配候选人': {
        summary: '部分技能匹配，经验适中',
        value: {
          jobRole: 'Data Scientist',
          skills: ['Python', 'Pandas', 'Scikit-learn'],
          experienceYears: 3,
          education: '本科',
          certifications: '',
          projectsCount: 4,
        },
      },
      '入门级候选人': {
        summary: '经验较少，技能基础',
        value: {
          jobRole: 'Cybersecurity Analyst',
          skills: ['Linux', 'Wireshark', 'Python'],
          experienceYears: 1,
          education: '本科',
          projectsCount: 2,
        },
      },
    },
  })
  async evaluateScreening(
    @CurrentUser('id') userId: string,
    @Body() dto: ScreeningEvaluateDto,
  ) {
    return this.resumeService.evaluateScreening(dto, userId);
  }
}
