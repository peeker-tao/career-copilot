import { Injectable, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(configService: ConfigService) {
    const redisUrl = configService.get<string>('REDIS_URL');
    if (!redisUrl) {
      throw new Error(
        'REDIS_URL 环境变量未配置。请检查 .env 文件或环境变量设置。',
      );
    }
    super(redisUrl);
    this.logger.log(`🔗 Redis 连接已建立`);
  }

  onModuleDestroy() {
    this.disconnect();
  }

  /**
   * 设置缓存（带过期时间）
   * @param key   缓存键
   * @param value 缓存值（自动 JSON 序列化）
   * @param ttl   过期时间（秒），默认 3600（1小时）
   */
  async cacheSet(key: string, value: unknown, ttl = 3600): Promise<void> {
    const serialized =
      typeof value === 'string' ? value : JSON.stringify(value);
    await this.setex(key, ttl, serialized);
  }

  /**
   * 获取缓存（自动 JSON 反序列化）
   * @param key 缓存键
   */
  async cacheGet<T = unknown>(key: string): Promise<T | null> {
    const raw = await this.get(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  }

  /**
   * 删除缓存
   * @param key 缓存键
   */
  async cacheDel(key: string): Promise<void> {
    await this.del(key);
  }

  // ----------------------- session helpers -----------------------
  async setSession(key: string, value: unknown, ttlSeconds = 3600) {
    await this.cacheSet(`session:${key}`, value, ttlSeconds);
  }

  async getSession<T = unknown>(key: string): Promise<T | null> {
    return this.cacheGet<T>(`session:${key}`);
  }

  async delSession(key: string) {
    await this.cacheDel(`session:${key}`);
  }

  // ----------------------- blacklist helpers -----------------------
  async blacklistToken(token: string, ttlSeconds: number) {
    if (!token) return;
    const key = `blacklist:${token}`;
    // store a placeholder value with TTL
    await this.set(key, '1', 'EX', Math.max(1, Math.floor(ttlSeconds)));
  }

  async isBlacklisted(token: string): Promise<boolean> {
    if (!token) return false;
    const key = `blacklist:${token}`;
    const v = await this.get(key);
    return v !== null;
  }

  async removeFromBlacklist(token: string) {
    if (!token) return;
    await this.del(`blacklist:${token}`);
  }

  // ----------------------- simple fixed-window rate limiter -----------------------
  async rateLimit(key: string, windowSeconds = 60, limit = 60) {
    const redisKey = `rate:${key}`;
    const current = await this.incr(redisKey);
    if (current === 1) {
      await this.expire(redisKey, windowSeconds);
    }
    const remaining = Math.max(0, limit - current);
    return {
      allowed: current <= limit,
      remaining,
      reset: await this.ttl(redisKey),
    };
  }
}
