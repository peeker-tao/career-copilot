import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ParseResumeDto,
  GenerateQuestionDto,
  EvaluateAnswerDto,
  GenerateReportDto,
  GenerateCareerPlanDto,
} from './dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('resume/parse')
  @HttpCode(200)
  @ApiOperation({ summary: '简历解析', description: '将简历文本解析为结构化 JSON' })
  parseResume(@Body() dto: ParseResumeDto) {
    return this.aiService.parseResume(dto.text);
  }

  @Post('interview/question')
  @HttpCode(200)
  @ApiOperation({ summary: '生成面试题', description: '根据岗位/难度生成面试题列表' })
  generateQuestion(@Body() dto: GenerateQuestionDto) {
    return this.aiService.generateQuestion(dto);
  }

  @Post('interview/evaluate')
  @HttpCode(200)
  @ApiOperation({ summary: '评估回答', description: '评估用户对面试题的回答并给出评分' })
  evaluateAnswer(@Body() dto: EvaluateAnswerDto) {
    const { question, expectedAnswer, position, difficulty, answer } = dto;
    return this.aiService.evaluateAnswer(
      { question, expectedAnswer, position, difficulty },
      answer,
    );
  }

  @Post('interview/report')
  @HttpCode(200)
  @ApiOperation({ summary: '生成面试报告', description: '根据对话记录生成综合评价报告' })
  generateReport(@Body() dto: GenerateReportDto) {
    return this.aiService.generateReport(dto.messages);
  }

  @Post('career/plan')
  @HttpCode(200)
  @ApiOperation({ summary: '生成职业规划', description: '技能分析 → 差距分析 → 学习路线' })
  generateCareerPlan(@Body() dto: GenerateCareerPlanDto) {
    return this.aiService.generateCareerPlan(dto);
  }
}
