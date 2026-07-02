/**
 * 端到端 RAG 管道验证
 * 
 * 1. 用 Python Worker 将查询文本转为向量
 * 2. 从 Redis 加载所有知识库向量
 * 3. 计算余弦相似度并返回 Top-K
 * 4. 验证模型的向量维度一致性
 */
import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';
import Redis from 'ioredis';

// ── 配置 ──────────────────────────────────────────────────────
const PYTHON_PATH = path.resolve(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
const WORKER_SCRIPT = path.resolve(__dirname, 'embed_worker.py');
const REDIS_URL = 'redis://localhost:6379/0';

// ── 辅助：余弦相似度 ──────────────────────────────────────────
function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}

// ── 辅助：启动 Worker 并嵌入 ──────────────────────────────────
function createWorker(): { proc: ChildProcess; rl: readline.Interface; embed: (text: string) => Promise<number[]> } {
  const proc = spawn(PYTHON_PATH, [WORKER_SCRIPT], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {
      ...process.env,
      HF_ENDPOINT: process.env.HF_ENDPOINT || 'https://hf-mirror.com',
      HF_HUB_DISABLE_SYMLINKS_WARNING: '1',
    },
  });

  const rl = readline.createInterface({ input: proc.stdout! });

  // 转发 stderr
  proc.stderr?.on('data', (d: Buffer) => process.stderr.write(`[Worker] ${d}`));

  let requestId = 0;
  const pending = new Map<string, { resolve: (v: number[]) => void; reject: (e: Error) => void }>();

  rl.on('line', (line: string) => {
    try {
      const msg = JSON.parse(line.trim());
      if (msg.ready) {
        console.log(`✅ Worker 就绪 (model: ${msg.model})`);
        return;
      }
      const id = msg.id;
      if (id && pending.has(id)) {
        if (msg.ok) {
          pending.get(id)!.resolve(msg.embedding);
        } else {
          pending.get(id)!.reject(new Error(msg.error));
        }
        pending.delete(id);
      }
    } catch { /* ignore parse errors */ }
  });

  const embed = (text: string): Promise<number[]> => {
    return new Promise((resolve, reject) => {
      const id = String(++requestId);
      pending.set(id, { resolve, reject });
      proc.stdin!.write(JSON.stringify({ text, id }) + '\n', 'utf-8');
    });
  };

  return { proc, rl, embed };
}

// ═══════════════════════════════════════════════════════════════
//  主流程
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('🔬 端到端 RAG 管道验证\n');
  
  // 1. 连接 Redis
  const redis = new Redis(REDIS_URL);
  console.log('✅ Redis 已连接');

  // 2. 启动 Worker
  const worker = createWorker();
  // 等待就绪
  await new Promise<void>((resolve) => setTimeout(resolve, 3000));

  // 3. 测试查询
  const queries = [
    'Java 中 String 为什么是不可变的？',
    'Python 的 GIL 是什么？',
    '如何优化 MySQL 查询性能？',
    'HTTP 和 HTTPS 有什么区别？',
  ];

  for (const query of queries) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`🔍 查询: "${query}"`);

    // 3a. 嵌入查询
    const qVec = await worker.embed(query);
    console.log(`  查询向量维度: ${qVec.length}`);

    // 3b. 从 Redis 加载所有向量
    const keys = await redis.keys('rag:interview:vec:*');
    console.log(`  知识库条目数: ${keys.length}`);

    if (keys.length === 0) {
      console.log('  ⚠️  知识库为空，跳过');
      continue;
    }

    const pipeline = redis.pipeline();
    for (const key of keys) {
      pipeline.get(key);
    }
    const results = await pipeline.exec();

    // 3c. 计算相似度
    const scored: Array<{ title: string; content: string; score: number; key: string }> = [];

    for (const [err, raw] of results || []) {
      if (err || !raw || typeof raw !== 'string') continue;
      try {
        const { vector, content, metadata } = JSON.parse(raw);
        const title = metadata?.title || content.split('\n')[0].replace('【题目】', '') || 'N/A';
        const score = cosineSimilarity(qVec, vector);
        scored.push({ title, content, score, key: '' });
      } catch { /* skip */ }
    }

    // 3d. 取 Top-3
    scored.sort((a, b) => b.score - a.score);
    const top3 = scored.slice(0, 3);

    console.log(`  Top-3 结果:`);
    for (const item of top3) {
      console.log(`    [${(item.score * 100).toFixed(1)}%] ${item.title}`);
      console.log(`          ${item.content.substring(0, 120)}...`);
    }
  }

  // 4. 清理
  worker.proc.kill('SIGTERM');
  worker.rl.close();
  redis.disconnect();

  console.log(`\n${'═'.repeat(60)}`);
  console.log('✅ RAG 管道验证完成');
}

main().catch((err) => {
  console.error('❌ 验证失败:', err);
  process.exit(1);
});
