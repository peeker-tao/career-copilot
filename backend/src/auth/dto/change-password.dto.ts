import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    description: '当前密码',
    example: 'oldPassword123',
  })
  @IsString()
  oldPassword!: string;

  @ApiProperty({
    description: '新密码（至少 6 位）',
    example: 'newPassword123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6, { message: '新密码至少 6 位' })
  newPassword!: string;
}
