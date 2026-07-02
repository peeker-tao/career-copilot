import { ApiProperty } from '@nestjs/swagger';

export class AsrResponseDto {
  @ApiProperty({ description: '语音识别后的文本', example: '我叫张三，是一名前端开发工程师' })
  text: string;
}
