import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TranscriptEntry {
  @ApiProperty({ description: '时间戳（秒）', example: 12.5 })
  @IsNumber()
  timestamp: number;

  @ApiProperty({ description: '说话人', example: 'user | interviewer' })
  @IsString()
  speaker: string;

  @ApiProperty({ description: '文本内容', example: '请介绍一下你的项目经验' })
  @IsString()
  text: string;
}

export class SaveTranscriptDto {
  @ApiProperty({ description: '对话记录列表' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranscriptEntry)
  transcript: TranscriptEntry[];

  @ApiProperty({ description: '录音时长（秒）', example: 120 })
  @IsNumber()
  durationSeconds: number;
}
