import { Controller, Get, Res, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { join } from 'path';
import { readFileSync } from 'fs';

@ApiTags('Dashboard')
@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('reset-password.html')
  getResetPasswordPage(@Res() res: any) {
    const filePath = join(__dirname, '..', '..', 'public', 'reset-password.html');
    let html = readFileSync(filePath, 'utf-8');

    const apiUrl = this.configService.get<string>(
      'RESET_PASSWORD_API_URL',
      'http://localhost:3002/api/auth',
    );
    html = html.replace(/\{\{RESET_PASSWORD_API_URL\}\}/g, apiUrl);

    res.type('text/html').send(html);
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
