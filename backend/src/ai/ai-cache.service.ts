import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { createHash } from 'crypto';

/**
 * AI 响应缓存服务
 * 
 * 对 LLM 的请求内容做哈希，相同请求直接返回缓存结果。
 * 适用场景：简历解析、面试题生成（相同岗位/难度大概率重复）
 * 缓存策略：基于内容的 exact match 哈希
 */
@Injectable()
export class AiCacheService {
  private readonly logger = new Logger(AiCacheService.name);

  // 不同场景的缓存 TTL（秒）
  // 注意：key 为调用时传入的 cachePrefix，与 TTL 映射
  private readonly TTL: Record<string, number> = {
    'resume:parse': 7 * 24 * 3600,       // 简历解析缓存 7 天
    'interview:question': 24 * 3600,      // 面试题缓存 24 小时
    'interview:evaluate': 3600,            // 回答评估缓存 1 小时
    'career:plan': 24 * 3600,              // 职业规划缓存 24 小时
    'general': 3600,                       // 通用缓存 1 小时
  };

  constructor(private redis: RedisService) {}

  /**
   * 生成请求的缓存键
   * 基于 systemPrompt + userMessage 的 SHA256 哈希
   */
  private buildCacheKey(prefix: string, systemPrompt: string, userMessage: string): string {
    const hash = createHash('sha256')
      .update(systemPrompt + userMessage)
      .digest('hex')
      .substring(0, 32);  // 取前 32 位足够
    return `ai:cache:${prefix}:${hash}`;
  }

  /**
   * 尝试从缓存获取
   * @returns 缓存命中返回内容，否则返回 null
   */
  async get(prefix: string, systemPrompt: string, userMessage: string): Promise<string | null> {
    const key = this.buildCacheKey(prefix, systemPrompt, userMessage);
    const cached = await this.redis.cacheGet<string>(key);
    if (cached) {
      this.logger.debug(`🎯 缓存命中 [${prefix}]`);
    }
    return cached;
  }

  /**
   * 写入缓存
   */
  async set(prefix: string, systemPrompt: string, userMessage: string, content: string): Promise<void> {
    const key = this.buildCacheKey(prefix, systemPrompt, userMessage);
    const ttl = this.TTL[prefix] ?? this.TTL['general'];
    await this.redis.cacheSet(key, content, ttl);
    this.logger.debug(`💾 缓存已写入 [${prefix}] TTL=${ttl}s`);
  }

  /**
   * 清除指定前缀的所有缓存（管理员手动调用）
   */
  async clearPrefix(prefix: string): Promise<void> {
    const keys = await this.redis.keys(`ai:cache:${prefix}:*`);
    if (keys.length > 0) {
      const pipeline = this.redis.pipeline();
      for (const key of keys) {
        pipeline.del(key);
      }
      await pipeline.exec();
      this.logger.log(`🧹 已清除 ${keys.length} 条 [${prefix}] 缓存`);
    }
  }
}
