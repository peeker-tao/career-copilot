import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('用户')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  @ApiOperation({
    summary: '获取用户列表/详情',
    description: '不传 id 返回全部用户；传 id 返回指定用户（均不含密码）',
  })
  @ApiQuery({ name: 'id', required: false, description: '用户 ID（不传则返回全部）' })
  findOne(@Query('id') id?: string) {
    if (!id) {
      return this.userService.findAll();
    }
    return this.userService.findById(id);
  }
}
