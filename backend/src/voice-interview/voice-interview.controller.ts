import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Delete,
  Patch,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { VoiceInterviewService } from './voice-interview.service';
import { CreateVoiceSessionDto } from './dto/create-voice-session.dto';
import { SaveTranscriptDto } from './dto/save-transcript.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('语音面试')
@Controller('voice-interviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceInterviewController {
  constructor(private voiceInterviewService: VoiceInterviewService) {}

  @Post()
  @ApiOperation({
    summary: '创建语音面试会话',
    description: '开始语音面试，创建会话记录',
  })
  createSession(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVoiceSessionDto,
  ) {
    return this.voiceInterviewService.createSession(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: '语音面试历史', description: '获取语音面试会话列表（分页）' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  getSessions(
    @CurrentUser('id') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: string,
  ) {
    return this.voiceInterviewService.getSessions(userId, {
      page,
      limit,
      status,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: '语音面试详情' })
  getSession(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.voiceInterviewService.getSession(id, userId);
  }

  @Get(':id/summary')
  @ApiOperation({
    summary: '语音面试摘要',
    description: '获取 AI 分析语音面试转录生成的摘要',
  })
  getSummary(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.voiceInterviewService.getSessionSummary(id, userId);
  }

  @Patch(':id/toggle-pause')
  @ApiOperation({ summary: '暂停/恢复语音面试' })
  togglePause(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.voiceInterviewService.togglePause(id, userId);
  }

  @Post(':id/transcript')
  @ApiOperation({ summary: '保存转录内容', description: '保存语音识别的文本内容' })
  saveTranscript(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: SaveTranscriptDto,
  ) {
    return this.voiceInterviewService.saveTranscript(id, userId, dto);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: '结束语音面试', description: '结束并保存语音面试记录' })
  completeSession(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.voiceInterviewService.completeSession(id, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除语音面试记录' })
  removeSession(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.voiceInterviewService.removeSession(id, userId);
  }
}
