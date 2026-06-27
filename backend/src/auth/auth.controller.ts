import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateModelConfigDto } from './dto/update-model-config.dto';
import { ForgotPasswordDto, ResetPasswordDto } from './dto/forgot-password.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { ThrottleGuard } from '../common/guards/throttle.guard';
import { Throttle } from '../common/guards/throttle.decorator';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @Throttle({ limit: 5, windowSeconds: 3600 }) // 每小时最多 5 次注册
  @UseGuards(ThrottleGuard)
  @ApiOperation({ summary: '用户注册', description: '邮箱+密码注册，返回 Token 对' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Throttle({ limit: 10, windowSeconds: 60 }) // 每分钟最多 10 次登录尝试
  @UseGuards(ThrottleGuard)
  @ApiOperation({ summary: '用户登录', description: '邮箱+密码登录，返回 Token 对' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('refresh')
  @ApiOperation({ summary: '刷新 Token', description: '使用 refreshToken 换取新的 Token 对' })
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取用户信息', description: '返回当前登录用户的详细信息' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.authService.getProfile(userId);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改个人资料', description: '修改昵称/头像/学历/目标岗位' })
  updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.authService.updateProfile(userId, dto);
  }

  @Patch('model-config')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '更新模型配置', description: '更新当前用户的 LLM 模型配置（提供商、API Key、模型参数等）' })
  updateModelConfig(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateModelConfigDto,
  ) {
    return this.authService.updateModelConfig(userId, dto as any);
  }

  @Post('forgot-password')
  @HttpCode(200)
  @Throttle({ limit: 3, windowSeconds: 3600 }) // 每小时最多 3 次
  @UseGuards(ThrottleGuard)
  @ApiOperation({ summary: '忘记密码', description: '发送密码重置邮件' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(200)
  @Throttle({ limit: 5, windowSeconds: 3600 }) // 每小时最多 5 次
  @UseGuards(ThrottleGuard)
  @ApiOperation({ summary: '重置密码', description: '使用令牌重置密码' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
