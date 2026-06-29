# Career-Copilot Backend

Career-Copilot 后端服务 — NestJS + Prisma + PostgreSQL + Redis

## 技术栈

| 类别 | 选型 |
|:----:|------|
| 框架 | NestJS 10 + TypeScript |
| ORM | Prisma 5 + PostgreSQL 15 |
| 缓存/队列 | Redis 7 + BullMQ |
| 认证 | JWT 双 Token（Access + Refresh） |
| 实时通信 | WebSocket (Socket.IO) |
| AI 接入 | 多 Provider 适配（OpenAI / DeepSeek / 通义千问） |
| RAG 知识库 | BAAI/bge-small-zh-v1.5 (fastembed + Python Worker) |

## 快速开始

```bash
# 安装依赖
npm install

# 启动数据库 & Redis
docker compose up -d

# 数据库迁移
npx prisma migrate dev

# 启动开发服务器
npm run start:dev
```

## 数据初始化

```bash
# 填充面试题库（29 条）
npx ts-node scripts/seed-questionbank.ts

# 生成 Embedding 向量并存入 Redis
npx ts-node scripts/seed-knowledge.ts

# 验证 RAG 检索效果
npx ts-node scripts/test-rag-e2e.ts
```

## 目录结构

```
src/
├── ai/            # AI 统一入口（LLM 调用 + 缓存 + RAG）
├── auth/          # 认证模块
├── career/        # 职业规划模块
├── common/        # 公共工具（过滤器、拦截器、管道）
├── interview/     # 面试模块（核心）
├── queue/         # 消息队列
├── redis/         # Redis 缓存服务
├── resume/        # 简历模块
├── resume-ner/    # 简历 NER 解析
├── question-bank/ # 面试题库
├── job-matching/  # 岗位匹配
├── learning-resources/ # 学习资源
├── voice-interview/    # 语音面试
└── admin/         # 管理后台
scripts/           # 数据初始化 & Embedding 脚本
prisma/            # 数据库 Schema
```

## RAG 知识库

- **嵌入模型**: `BAAI/bge-small-zh-v1.5`（本地，ONNX Runtime）
- **向量维度**: 512 维
- **运行方式**: Python Worker 子进程（`scripts/embed_worker.py`）
- **存储**: Redis Hash（`rag:*` 命名空间）
- **已填充数据**: 29 条面试题（Java/Python/前端/系统设计等类别）
