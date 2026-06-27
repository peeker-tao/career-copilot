import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: '注册邮箱' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty({ description: '重置令牌' })
  @IsNotEmpty()
  token: string;

  @ApiProperty({ example: 'NewP@ss123', description: '新密码' })
  @IsNotEmpty()
  newPassword: string;
}
