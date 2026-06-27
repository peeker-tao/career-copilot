import { Module } from '@nestjs/common';
import { VoiceInterviewController } from './voice-interview.controller';
import { VoiceInterviewService } from './voice-interview.service';

@Module({
  imports: [],
  controllers: [VoiceInterviewController],
  providers: [VoiceInterviewService],
  exports: [VoiceInterviewService],
})
export class VoiceInterviewModule {}
