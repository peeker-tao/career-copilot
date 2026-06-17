import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: '邮箱地址', example: 'user@example.com' })
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @ApiProperty({ description: '密码（至少6位）', example: 'Test123456' })
  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  @MaxLength(50)
  password: string;

  @ApiProperty({ description: '用户昵称', example: '张三' })
  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  name: string;
}
