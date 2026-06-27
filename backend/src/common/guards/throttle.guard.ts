import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisService } from '../../redis/redis.service';

export const THROTTLE_KEY = 'throttle';
export const THROTTLE_DEFAULT_LIMIT = 60;
export const THROTTLE_DEFAULT_WINDOW = 60;

export interface ThrottleOptions {
  limit?: number;
  windowSeconds?: number;
}

/**
 * 频率限制守卫 — 基于 Redis 的固定窗口限流
 *
 * 用法:
 *   @Throttle({ limit: 10, windowSeconds: 60 })  // 每分钟 10 次
 *   @UseGuards(ThrottleGuard)
 *
 * 类级别也可用:
 *   @Throttle({ limit: 30, windowSeconds: 60 })
 *   @UseGuards(ThrottleGuard)
 *   export class SomeController {}
 */
@Injectable()
export class ThrottleGuard implements CanActivate {
  constructor(
    private redisService: RedisService,
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 获取自定义限流配置（方法级 > 类级 > 默认值）
    const options = this.getThrottleOptions(context);
    const { limit, windowSeconds } = options;

    // 2. 生成限流 key
    const request = context.switchToHttp().getRequest();
    const key = this.generateKey(request);

    // 3. 执行限流检查
    const result = await this.redisService.rateLimit(
      `throttle:${key}`,
      windowSeconds,
      limit,
    );

    // 4. 设置响应头（通知客户端限流状态）
    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', limit);
    response.header('X-RateLimit-Remaining', result.remaining);
    response.header('X-RateLimit-Reset', result.reset);

    // 5. 如果超出限制，抛 429
    if (!result.allowed) {
      throw new HttpException(
        {
          code: 429,
          message: `请求过于频繁，请 ${result.reset} 秒后重试`,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getThrottleOptions(context: ExecutionContext): ThrottleOptions {
    // 方法级配置优先
    const methodOptions = this.reflector.getAllAndOverride<ThrottleOptions>(
      THROTTLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return {
      limit: methodOptions?.limit ?? THROTTLE_DEFAULT_LIMIT,
      windowSeconds: methodOptions?.windowSeconds ?? THROTTLE_DEFAULT_WINDOW,
    };
  }

  private generateKey(request: any): string {
    // 优先使用用户 ID（已登录），其次使用 IP
    const userId = request.user?.id;
    if (userId) {
      return `user:${userId}`;
    }
    const ip =
      request.ip ||
      request.headers['x-forwarded-for'] ||
      request.connection?.remoteAddress ||
      'unknown';
    return `ip:${ip}`;
  }
}
