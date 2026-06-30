import {
  Controller,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { VoiceService } from './voice.service';
import { TtsDto } from './dto/tts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('语音')
@Controller('voice')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VoiceController {
  constructor(private voiceService: VoiceService) {}

  @Post('asr')
  @ApiOperation({
    summary: '语音识别 (ASR)',
    description: '上传音频文件，返回识别后的文字（使用 Whisper 模型）',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: '音频文件（支持 mp3/wav/ogg/webm/m4a/flac 等格式，最大 20MB）',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'uploads', 'audio'),
        filename: (_req, file, cb) => {
          const ext = extname(file.originalname);
          const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
          cb(null, name);
        },
      }),
      limits: { fileSize: 20 * 1024 * 1024 }, // 20MB
      fileFilter: (_req, file, cb) => {
        const allowedMimeTypes = [
          'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-wav',
          'audio/ogg', 'audio/webm', 'audio/mp4', 'audio/x-m4a',
          'audio/flac', 'audio/x-flac',
        ];
        const allowedExts = ['.mp3', '.wav', '.ogg', '.webm', '.mp4', '.m4a', '.flac'];
        const ext = extname(file.originalname).toLowerCase();

        if (allowedMimeTypes.includes(file.mimetype) || allowedExts.includes(ext)) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`不支持的音频格式: ${file.originalname}`), false);
        }
      },
    }),
  )
  async asr(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('请上传音频文件');
    }
    return this.voiceService.speechToText(file);
  }

  @Post('tts')
  @ApiOperation({
    summary: '语音合成 (TTS)',
    description: '将文字合成为语音，返回音频文件 URL（使用 OpenAI TTS 模型）',
  })
  async tts(@Body() dto: TtsDto) {
    return this.voiceService.textToSpeech(dto.text, dto.voice);
  }
}
