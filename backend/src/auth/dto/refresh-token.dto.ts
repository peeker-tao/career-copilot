import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: '刷新令牌（refreshToken）', example: 'eyJhbGciOiJIUzI1NiIs...', required: true })
  @IsString({ message: 'refreshToken 必须是字符串' })
  refreshToken: string;
}
