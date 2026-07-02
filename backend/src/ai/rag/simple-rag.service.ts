import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../redis/redis.service';
import { LocalEmbedderService } from './local-embedder.service';

/**
 * 简易 RAG 引擎 —— 本地 Embedding + Redis 向量检索
 * 
 * 工作流程：
 *   存入：文本 → 本地 Embedding 模型 → 向量 → 存入 Redis
 *   检索：查询 → 本地 Embedding 模型 → 向量 → Redis 相似度搜索 → 返回 Top-K
 *   生成：System Prompt + 检索结果 + 用户问题 → LLM → 回答
 */
@Injectable()
export class SimpleRagService {
  private readonly logger = new Logger(SimpleRagService.name);

  // 知识库命名空间（用于 Redis key 隔离）
  private readonly NAMESPACES = {
    INTERVIEW_QUESTIONS: 'rag:interview',
    CAREER_ADVICE: 'rag:career',
    RESUME_TEMPLATES: 'rag:resume',
  };

  constructor(
    private redis: RedisService,
    private embedder: LocalEmbedderService,
  ) {
    this.logger.log('🔤 Embedding: 本地模型 (BGE-Small-ZH via Python Worker)');
  }

  /**
   * 生成文本的向量嵌入
   */
  private async embed(text: string): Promise<number[]> {
    return this.embedder.embed(text);
  }

  /**
   * 将知识存入向量库
   * @param namespace 命名空间（按业务隔离）
   * @param key       唯一标识
   * @param content   原始文本内容
   * @param metadata  附加元数据 { position, difficulty, tags }
   */
  async store(namespace: string, key: string, content: string, metadata: Record<string, unknown> = {}) {
    const vector = await this.embed(content);
    const doc = JSON.stringify({ content, metadata, vector });
    // 存储到 Redis
    await this.redis.cacheSet(
      `${namespace}:${key}`,
      doc,
      7 * 24 * 3600, // 保留 7 天
    );
    // 将向量存储到专门的向量集合（用于相似度检索）
    await this.redis.zadd(`${namespace}:vectors`, 0, key);
    // 存储向量值用于后续计算
    await this.redis.cacheSet(
      `${namespace}:vec:${key}`,
      { vector, content, metadata },
      7 * 24 * 3600,
    );
    this.logger.log(`✅ 知识已存储 [${namespace}] ${key}`);
  }

  /**
   * 余弦相似度计算
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    let dot = 0, magA = 0, magB = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }
    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    return denom === 0 ? 0 : dot / denom;
  }

  /**
   * 检索最相似的 Top-K 条知识
   * @param namespace 命名空间
   * @param query     查询文本
   * @param topK      返回条数（默认 3）
   */
  async retrieve(namespace: string, query: string, topK = 3): Promise<Array<{ content: string; metadata: Record<string, unknown>; score: number }>> {
    const queryVector = await this.embed(query);

    // 获取所有存储的键
    const keys = await this.redis.keys(`${namespace}:vec:*`);
    if (keys.length === 0) return [];

    // 批量获取所有向量
    const pipeline = this.redis.pipeline();
    for (const key of keys) {
      pipeline.get(key);
    }
    const results = await pipeline.exec();
    if (!results) return [];

    // 计算相似度并排序
    const scored: Array<{ content: string; metadata: Record<string, unknown>; score: number }> = [];

    for (const [, raw] of results) {
      if (!raw || typeof raw !== 'string') continue;
      try {
        const { vector, content, metadata } = JSON.parse(raw);
        const score = this.cosineSimilarity(queryVector, vector);
        scored.push({ content, metadata, score });
      } catch { /* skip */ }
    }

    // 按相似度降序取 Top-K
    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  }

  /**
   * 使用 RAG 增强 LLM 调用
   * @param systemPrompt 原始 System Prompt
   * @param userMessage  用户问题
   * @param namespace    知识库命名空间
   */
  async augmentCall(
    systemPrompt: string,
    userMessage: string,
    namespace: string,
  ): Promise<string> {
    // 1. 检索相关知识
    const relevantDocs = await this.retrieve(namespace, userMessage, 3);

    // 2. 构建增强上下文
    let ragContext = '';
    if (relevantDocs.length > 0) {
      ragContext = '【参考知识库中的相关内容】\n'
        + relevantDocs.map((d, i) =>
          `[参考 ${i + 1}]（相似度: ${(d.score * 100).toFixed(1)}%）\n${d.content}`
        ).join('\n\n')
        + '\n\n请结合上述参考内容回答用户问题。';
    }

    // 3. 拼接增强后的 prompt
    const enhancedPrompt = ragContext
      ? `${systemPrompt}\n\n${ragContext}`
      : systemPrompt;

    return enhancedPrompt;
  }
}
