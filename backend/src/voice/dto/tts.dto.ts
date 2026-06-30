import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TtsDto {
  @ApiProperty({ description: '要合成语音的文本', example: '请介绍一下你的项目经验' })
  @IsString({ message: 'text 必须是字符串' })
  text: string;

  @ApiPropertyOptional({
    description: '语音角色（默认 longanyang - 阳光大男孩）',
    example: 'longanyang',
    enum: ['longanyang', 'longxiaochun_v3', 'longwan_v3', 'longanyun_v3', 'longanzhi_v3', 'alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'],
  })
  @IsOptional()
  @IsString()
  voice?: string;
}

export class TtsResponseDto {
  @ApiProperty({ description: '音频文件 URL', example: '/uploads/audio/xxx.mp3' })
  url: string;

  @ApiProperty({ description: '音频文件路径（供后端使用）' })
  path: string;
}
