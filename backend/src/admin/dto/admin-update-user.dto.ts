import { IsOptional, IsString, IsEmail, IsIn, MinLength, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AdminUpdateUserDto {
  @ApiPropertyOptional({ description: '用户姓名' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(20)
  name?: string;

  @ApiPropertyOptional({ description: '电子邮箱' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: '用户角色', enum: ['user', 'admin'] })
  @IsOptional()
  @IsString()
  @IsIn(['user', 'admin'])
  role?: string;

  @ApiPropertyOptional({ description: '头像 URL' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '最高学历' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: '目标岗位' })
  @IsOptional()
  @IsString()
  targetPosition?: string;
}
