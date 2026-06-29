import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { CurrentUser } from './auth/decorators/current-user.decorator';
import { join } from 'path';

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
