/**
 * 知识库种子脚本
 * =============
 * 将 QuestionBank 表中的题目数据向量化并存入 Redis 向量库。
 *
 * 用法:
 *   npx ts-node -P ../tsconfig.json scripts/seed-knowledge.ts
 *   （在 backend 目录下执行）
 *
 * 前置条件:
 *   - PostgreSQL 已运行且 QuestionBank 有数据
 *   - Redis 已运行
 *   - .env 配置正确
 */

import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { spawn, ChildProcess } from 'child_process';
import * as readline from 'readline';
import * as path from 'path';

// ── 配置 ──────────────────────────────────────────────────────
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379/0';
const NAMESPACE = 'rag:interview';
// Python 嵌入 Worker
const PYTHON_PATH = path.resolve(__dirname, '..', '..', '.venv', 'Scripts', 'python.exe');
const WORKER_SCRIPT = path.resolve(__dirname, 'embed_worker.py');

// ── 格式化题目 → 知识文本 ──────────────────────────────────
interface Question {
  id: string;
  category: string;
  type: string;
  difficulty: string;
  title: string;
  content: { question: string; options?: string[]; answer?: string; explanation?: string };
  tags: string[];
}

function formatQuestion(q: Question): string {
  const parts: string[] = [];

  // 标题/问题
  parts.push(`【题目】${q.title}`);
  parts.push(`【分类】${q.category}  |  难度: ${q.difficulty}  |  类型: ${q.type}`);

  // 详细问题描述
  const questionText = typeof q.content.question === 'string'
    ? q.content.question
    : JSON.stringify(q.content.question);
  parts.push(`【问题】${questionText}`);

  // 选择题选项
  if (q.content.options && Array.isArray(q.content.options)) {
    q.content.options.forEach((opt: string, i: number) => {
      parts.push(`  ${String.fromCharCode(65 + i)}. ${opt}`);
    });
  }

  // 答案
  if (q.content.answer) {
    parts.push(`【答案】${q.content.answer}`);
  }

  // 解析
  if (q.content.explanation) {
    parts.push(`【解析】${q.content.explanation}`);
  }

  // 标签
  if (q.tags && q.tags.length > 0) {
    parts.push(`【标签】${q.tags.join(', ')}`);
  }

  return parts.join('\n');
}

// ── 嵌入 Worker 管理 ────────────────────────────────────────
function createEmbedder(): { worker: ChildProcess; rl: readline.Interface } {
  const worker = spawn(PYTHON_PATH, [WORKER_SCRIPT], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, HF_ENDPOINT: process.env.HF_ENDPOINT || 'https://hf-mirror.com' },
  });

  const rl = readline.createInterface({ input: worker.stdout! });

  return { worker, rl };
}

function embedText(text: string, worker: ChildProcess, rl: readline.Interface): Promise<number[]> {
  return new Promise((resolve, reject) => {
    const onLine = (line: string) => {
      try {
        const msg = JSON.parse(line);
        if (msg.ready) return; // 就绪消息，忽略
        rl.off('line', onLine);
        if (msg.ok) resolve(msg.embedding);
        else reject(new Error(msg.error || '嵌入失败'));
      } catch { /* 忽略解析错误 */ }
    };
    rl.on('line', onLine);

    const request = JSON.stringify({ text }) + '\n';
    worker.stdin?.write(request, 'utf-8');
  });
}

// ── Mock SimpleRagService.store ──────────────────────────────
async function storeEmbedding(
  redis: Redis,
  namespace: string,
  key: string,
  content: string,
  vector: number[],
  metadata: Record<string, unknown>,
) {
  // 存储文档
  await redis.setex(`${namespace}:${key}`, 7 * 24 * 3600, JSON.stringify({ content, metadata, vector }));

  // 存储向量用于检索
  await redis.zadd(`${namespace}:vectors`, 0, key);
  await redis.setex(`${namespace}:vec:${key}`, 7 * 24 * 3600, JSON.stringify({ vector, content, metadata }));
}

// ── 主流程 ──────────────────────────────────────────────────
async function main() {
  console.log('🚀 开始填充知识库...\n');

  // 1. 连接 DB
  const prisma = new PrismaClient();
  await prisma.$connect();
  console.log('✅ 已连接 PostgreSQL');

  // 2. 连接 Redis
  const redis = new Redis(REDIS_URL);
  console.log('✅ 已连接 Redis');

  // 3. 启动嵌入 Worker
  console.log('⏳ 启动嵌入 Worker...');
  const { worker, rl } = createEmbedder();
  // 等待就绪
  await new Promise<void>((resolve) => {
    rl.on('line', (line) => {
      try {
        const msg = JSON.parse(line);
        if (msg.ready) {
          console.log(`✅ 嵌入 Worker 就绪 (model: ${msg.model})`);
          resolve();
        }
      } catch { /* ignore */ }
    });
  });

  // 4. 读取 QuestionBank
  const questions = await prisma.questionBank.findMany({
    orderBy: { createdAt: 'asc' },
  });
  console.log(`📚 共读取 ${questions.length} 条题目\n`);

  // 5. 逐条嵌入并存储
  let success = 0;
  let failed = 0;

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i] as unknown as Question;
    const content = formatQuestion(q);
    const key = `${q.category}:${q.id}`;

    // 构建元数据
    const metadata: Record<string, unknown> = {
      category: q.category,
      difficulty: q.difficulty,
      type: q.type,
      tags: q.tags,
    };

    process.stdout.write(`  [${i + 1}/${questions.length}] ${q.title.slice(0, 40).padEnd(42)} `);

    try {
      const vector = await embedText(content, worker, rl);
      await storeEmbedding(redis, NAMESPACE, key, content, vector, metadata);
      console.log('✅');
      success++;
    } catch (err: any) {
      console.log(`❌ ${err.message}`);
      failed++;
    }
  }

  // 6. 清理
  worker.kill('SIGTERM');
  rl.close();
  redis.disconnect();
  await prisma.$disconnect();

  console.log(`\n📊 知识库填充完成！成功: ${success}, 失败: ${failed}`);
}

main().catch((err) => {
  console.error('❌ 脚本执行失败:', err);
  process.exit(1);
});
