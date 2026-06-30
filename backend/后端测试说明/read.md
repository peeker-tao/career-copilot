# 后端接口测试说明

> 支持 **Swagger UI**（浏览器）与 **REST Client**（VS Code）两种测试方式，推荐使用 Swagger UI。

---

## 🚀 快速开始

### 前置准备

| 步骤 | 操作 | 说明 |
|:----:|------|------|
| 1 | 启动后端服务 | `cd backend && npm run start:dev` |
| 2 | 打开 Swagger UI | 浏览器访问 [`http://localhost:3002/api-docs`](http://localhost:3002/api-docs) |

### 通用测试流程

```
① POST /api/auth/register    ──→  注册账号（邮箱 + 密码）
② POST /api/auth/login       ──→  登录 → 复制返回的 accessToken
③ 点击 Authorize 按钮        ──→  输入 "Bearer <粘贴的accessToken>"
④ 调用各模块接口             ──→  按需测试
```

### 备注

- 全部操作用 `id`（UUID）进行查找
- 测试用简历位于 [`10份测试简历/`](10份测试简历/) 目录（共 10 份 PDF）
- **详细指令与流程见：[指令操作流程及说明](../../项目设计文件/相应指令.md)**
- AI 密钥见下方说明

---

## 🔑 AI 配置说明

### 使用提供的密钥（推荐）

> ⚠️ 本项目结束后会删除此密钥，请勿用于其他场景。

```env
LLM_PROVIDER=deepseek
DEEPSEEK_API_KEY=私发给你
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
DEEPSEEK_MODEL=deepseek-chat
```

### 使用自己的密钥

参照 [`backend/.env.example`](../../backend/.env.example) 创建 `.env` 文件，支持以下 Provider：

| Provider | 环境变量 | 模型 |
|:--------:|----------|:----:|
| OpenAI | `OPENAI_API_KEY` | gpt-4o-mini |
| 通义千问 | `DASHSCOPE_API_KEY` | qwen-turbo |
| DeepSeek | `DEEPSEEK_API_KEY` | deepseek-chat |

---

## 📚 各模块测试说明

| 模块 | 文件 | 主要功能 |
|:----:|------|----------|
| 🔐 [认证模块](认证模块/read.md) | `auth/` | 注册、登录、刷新 Token、获取/修改个人资料 |
| 👤 [用户模块](用户模块/read.md) | `user/` | 获取用户列表/详情 |
| 📄 [简历模块](简历模块/read.md) | `resume/` | 上传简历、CRUD、AI 筛选基准测试（seed/import/stats/evaluate） |
| 🎙️ [面试模块](面试模块/read.md) | `interview/` | 创建面试、提交回答、异步报告生成、WebSocket 流式对话 |
| 📊 [职业规划模块](职业规划模块/read.md) | `career/` | 创建规划、市场洞察、查看规划详情 |
| 🤖 [AI 模块](AI模块/read.md) | `ai/` | 简历解析、生成面试题、评估回答、生成报告、生成职业规划 |
| 🔧 [管理模块](管理模块/read.md) | `admin/` | 管理员后台：用户/简历/面试/职业规划跨用户管理 |
| 🎯 [岗位匹配模块](岗位匹配模块/read.md) | `job-matching/` | AI 岗位推荐、匹配度分析、岗位状态管理 |
| 📚 [学习资源模块](学习资源模块/read.md) | `learning-resources/` | 学习资源浏览、分类筛选、AI 个性化推荐 |
| ❓ [题库模块](题库模块/read.md) | `question-bank/` | 面试题库浏览、AI 生成题目 |

---

## ✅ 任务完成进度

> 基于 `backend/src/` 全部源码逐模块审计（2026-06-17），与实际仓库一致。

### 状态图例

| 标记 | 含义 |
|:----:|------|
| ✅ **已完成** | 代码完整实现，功能可正常使用 |
| ⚠️ **基本完成** | 核心代码已实现，少量功能缺失 |
| ❌ **未实现** | 尚未编码实现 |

### 任务清单

| 编号 | 任务名称 | 负责人 | 状态 | 模块 |
|:----:|----------|:------:|:----:|:----|
| T-001 | Prisma Schema 设计与迁移 | 赵原一 | ✅ | 数据库 |
| T-002 | 统一响应格式与异常处理 | 赵原一 | ✅ | 公共基础架构 |
| T-003 | Prisma 服务封装 | 赵原一 | ✅ | 公共基础架构 |
| T-004 | 环境变量配置 | 赵原一 | ✅ | 公共基础架构 |
| T-005 | JWT 认证逻辑 | 陶宏阳 | ✅ | 认证模块 |
| T-006 | 个人资料接口 | 赵原一 | ✅ | 认证模块 |
| T-007 | 简历上传接口 | 赵原一 | ✅ | 简历模块 |
| T-008 | 简历解析服务 | 陶宏阳 | ✅ | 简历模块 |
| T-009 | 简历 CRUD 接口 | 赵原一 | ✅ | 简历模块 |
| T-010 | LLM 适配器封装 | 陶宏阳 | ✅ | AI 服务层 |
| T-011 | LLM Prompt 工程 | 陶宏阳 | ✅ | 面试模块 |
| T-012 | 面试 CRUD + WebSocket | 陶宏阳 | ✅ | 面试模块 |
| T-013 | 面试报告生成服务 | 陶宏阳 | ✅ | 面试模块 |
| T-014 | 面试历史接口 | 赵原一 | ✅ | 面试模块 |
| T-015 | 职业规划生成服务 | 陶宏阳 | ✅ | 职业规划模块 |
| T-016 | 市场洞察数据接口 | 赵原一 | ✅ | 职业规划模块 |
| T-017 | 职业规划 CRUD | 赵原一 | ⚠️ | 职业规划模块 |
| T-018 | Bull 队列配置 | 赵原一 | ✅ | 消息队列 |
| T-019 | Redis 服务封装 | 赵原一 | ⚠️ | Redis 缓存 |
| T-020 | Multer 文件上传配置 | 赵原一 | ✅ | 文件上传 |
| T-021 | 管理员后台 | 陶宏阳 | ✅ | 管理模块 |
| T-022 | 岗位匹配推荐 | 陶宏阳 | ✅ | 岗位匹配模块 |
| T-023 | 学习资源管理 | 赵原一 | ✅ | 学习资源模块 |
| T-024 | 题库管理与生成 | 陶宏阳 | ✅ | 题库模块 |
| T-026 | 简历筛选基准测试 | 赵原一 | ✅ | 简历模块 |
| T-027 | 异步报告生成 | 陶宏阳 | ✅ | 面试模块 |

### 缺项详情

| 编号 | 任务 | 缺项说明 |
|:----:|------|----------|
| T-017 | 职业规划 CRUD | 缺少 `DELETE /api/career/plans/:id` 接口 |
| T-018 | Bull 队列配置 | ✅ `QueueService` 已完整实现 resume-queue 和 feedback-generator 队列的入队、状态查询、重试策略配置 |
| T-019 | Redis 服务封装 | 缺少会话缓存/黑名单/限流等操作方法（连接已完成） |

### 额外实现的功能

| 功能 | 位置 | 说明 |
|------|------|------|
| 自定义 JSON Body 解析器 | `main.ts` | 处理 Swagger UI 中未转义的控制字符（`\n`, `\r`, `\t`） |
| OCR 简历回退识别 | `resume.parser.ts` | 扫描件/图片 PDF 自动回退 tesseract.js OCR |
| 角色守卫 + 装饰器 | `guards/`, `decorators/` | 预留 RBAC 权限体系 |
| Swagger 文档 | `main.ts` | OpenAPI 3.0，`persistAuthorization + tryItOutEnabled` |
| 面试流式输出 | `interview.gateway.ts` | WebSocket `ai_message_chunk` 流式推送 |
| 简历筛选基准测试 | `resume/` | CSV 数据集批量导入/种子/统计/评估（AI 准确率测试） |
| 异步报告生成 | `interview/` + `queue/` | BullMQ 队列异步生成面试报告，支持轮询状态；对话不足时提前返回 `failed`，避免队列重试 |

> **统计：** 共 **27** 项任务 — **25 项已全部完成** + **2 项基本完成**（核心代码就绪，少量缺项）
