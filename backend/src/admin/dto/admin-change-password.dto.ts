import { IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AdminChangePasswordDto {
  @ApiProperty({ description: '新密码', minLength: 6, maxLength: 50 })
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  newPassword: string;
}
