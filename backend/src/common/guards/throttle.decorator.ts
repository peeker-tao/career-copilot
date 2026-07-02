import { SetMetadata } from '@nestjs/common';
import { THROTTLE_KEY, ThrottleOptions } from './throttle.guard';

/**
 * @Throttle() 装饰器 — 用于设置接口的频率限制
 *
 * @example
 * ```typescript
 * @Throttle({ limit: 10, windowSeconds: 60 })
 * @Post('login')
 * login(@Body() dto: LoginDto) { ... }
 * ```
 */
export const Throttle = (options: ThrottleOptions) =>
  SetMetadata(THROTTLE_KEY, options);
