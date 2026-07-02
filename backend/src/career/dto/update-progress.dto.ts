import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateProgressDto {
  @ApiProperty({
    description: '阶段序号（从0开始）',
    example: 1,
  })
  @Type(() => Number)
  @IsInt({ message: 'phase 必须是整数' })
  @Min(0, { message: 'phase 必须大于等于 0' })
  phase: number;

  @ApiProperty({
    description: '完成进度百分比（0-100）',
    example: 100,
    minimum: 0,
    maximum: 100,
  })
  @Type(() => Number)
  @IsInt({ message: 'progress 必须是整数' })
  @Min(0, { message: 'progress 必须大于等于 0' })
  @Max(100, { message: 'progress 必须小于等于 100' })
  progress: number;
}
