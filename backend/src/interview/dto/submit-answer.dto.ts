import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitAnswerDto {
  @ApiProperty({
    description: '用户的回答内容',
    example: '我觉得 useState 适合简单的状态...',
  })
  @IsString({ message: 'content 必须是字符串' })
  content: string;
}
