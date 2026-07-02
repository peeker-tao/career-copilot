import {
  IsOptional,
  IsString,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProfileDto {
  @ApiPropertyOptional({ description: '用户昵称', example: '张三' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: '昵称至少2个字符' })
  @MaxLength(20, { message: '昵称最多20个字符' })
  name?: string;

  @ApiPropertyOptional({ description: '头像 URL', example: 'https://example.com/avatar.png' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ description: '教育背景', example: '本科-计算机科学与技术' })
  @IsOptional()
  @IsString()
  education?: string;

  @ApiPropertyOptional({ description: '目标岗位', example: '前端开发工程师' })
  @IsOptional()
  @IsString()
  targetPosition?: string;
}
