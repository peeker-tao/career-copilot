import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import { CreateInterviewDto } from './dto/create-interview.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('面试')
@Controller('interviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InterviewController {
  constructor(private interviewService: InterviewService) {}

  @Post()
  @ApiOperation({
    summary: '创建面试',
    description: '创建 AI 模拟面试，自动生成第一道题',
  })
  create(@CurrentUser('id') userId: string, @Body() dto: CreateInterviewDto) {
    return this.interviewService.create(userId, dto);
  }

  @Get()
  @ApiOperation({
    summary: '面试历史',
    description: '获取当前用户的面试记录（分页）',
  })
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
    description: '按状态筛选（不传则查全部）',
    enum: ['in_progress', 'completed', 'cancelled'],
  })
  findAll(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.interviewService.findAll(userId, { page, limit, status });
  }

  @Get(':id')
  @ApiOperation({
    summary: '面试详情',
    description: '获取面试详情及完整对话记录',
  })
  findOne(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.interviewService.findOne(id, userId);
  }

  @Get(':id/messages')
  @ApiOperation({ summary: '面试对话', description: '获取面试的对话消息列表' })
  getMessages(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.interviewService.getMessages(id, userId);
  }

  @Post(':id/answer')
  @ApiOperation({
    summary: '提交回答',
    description: '提交用户回答，AI 评估后返回评分、反馈和下一题',
  })
  submitAnswer(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitAnswerDto,
  ) {
    return this.interviewService.submitAnswer(id, userId, dto.content);
  }

  @Post(':id/feedback')
  @ApiOperation({
    summary: '生成面试报告',
    description: '根据对话记录生成多维度评分报告',
  })
  generateFeedback(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.interviewService.generateFeedback(id, userId);
  }

  @Post(':id/complete')
  complete(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.interviewService.complete(id, userId);
  }
}
