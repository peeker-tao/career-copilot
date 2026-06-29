import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { join } from 'path';

@ApiTags('Dashboard')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('reset-password.html')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getResetPasswordPage(@Res() res: any) {
    res.sendFile(join(__dirname, '..', '..', 'public', 'reset-password.html'));
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: '获取 Dashboard 数据', description: '返回用户的面试统计、简历数、活跃计划等概览数据' })
  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  async getDashboard(@CurrentUser() user: { id: string }) {
    const data = await this.appService.getDashboard(user.id);
    return {
      code: 200,
      message: 'success',
      data,
    };
  }
}
