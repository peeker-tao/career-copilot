# 系统设计说明书 — 高层设计（HLD）

> **项目名称：** Career-Copilot — AI 驱动的大学生求职面试与职业规划平台
> **文档版本：** V1.0
> **日期：** 2026-06-13
> **设计状态：** ✅ 已完成

---

## 一、设计概述

### 1.1 设计目标

- **高内聚低耦合**：模块职责清晰，独立可测
- **类型安全**：全栈 TypeScript，编译时捕获错误
- **可扩展性**：AI Provider 工厂模式，新增模型零改动
- **实时交互**：WebSocket 流式输出，打字机效果提升体验

### 1.2 设计约束

| 约束 | 说明 |
|:----:|------|
| 运行环境 | Node.js 22+，PostgreSQL 15+，Redis 7+ |
| 开发语言 | TypeScript（全栈） |
| 部署方式 | Docker Compose 容器化 |
| 交付时限 | 2 周内完成 MVP 交付 |

---

## 二、系统架构

### 2.1 分层架构图

```
┌──────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                              │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐   │
│  │   Web Browser       │  │   Swagger UI / REST Client       │   │
│  │   (React SPA)       │  │   (API 测试)                     │   │
│  └─────────┬───────────┘  └──────────────┬───────────────────┘   │
└────────────┼──────────────────────────────┼──────────────────────┘
             │ HTTP REST (JSON)             │ WS (Socket.io)
┌────────────▼──────────────────────────────▼──────────────────────┐
│                       API GATEWAY LAYER                           │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  NestJS Application (Port 3002)                            │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │   │
│  │  │ Auth     │ │ Resume   │ │Interview │ │ Career     │   │   │
│  │  │ Module   │ │ Module   │ │ Module   │ │ Module     │   │   │
│  │  └──────────┘ └──────────┘ └──────────┘ └────────────┘   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐                   │   │
│  │  │ AI       │ │ Common   │ │ Queue    │                   │   │
│  │  │ Module   │ │ Module   │ │ Module   │                   │   │
│  │  └──────────┘ └──────────┘ └──────────┘                   │   │
│  └────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
             │                    │                │
┌────────────▼──────┐  ┌─────────▼────────┐  ┌───▼────────────────┐
│   DATA LAYER      │  │  CACHE LAYER     │  │  AI SERVICE LAYER  │
│  ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌────────────────┐ │
│  │ PostgreSQL   │ │  │ │   Redis 7    │ │  │ │   LLM Factory  │ │
│  │ - users      │ │  │ │ - 会话缓存   │ │  │ │ ├─ OpenAI      │ │
│  │ - resumes    │ │  │ │ - 消息队列   │ │  │ │ ├─ 通义千问    │ │
│  │ - interviews │ │  │ │ - Token 黑   │ │  │ │ └─ DeepSeek   │ │
│  │ - messages   │ │  │ │   名单       │ │  │ └────────────────┘ │
│  │ - career_    │ │  │ └──────────────┘ │  └────────────────────┘ │
│  │   plans      │ │  └─────────────────┘                          │
│  └──────────────┘ │                                               │
└───────────────────┘                                               │
```

### 2.2 技术栈详细说明

| 层次 | 组件 | 版本 | 选型理由 |
|:----:|------|:----:|----------|
| 客户端 | React | 18.x | 组件化、生态丰富 |
| 客户端 | Vite | 5.x | 极速开发热更新 |
| 客户端 | Ant Design | 5.x | 企业级 UI 组件库 |
| 客户端 | Zustand | 4.x | 轻量 TS 友好状态管理 |
| 网关 | NestJS | 10.x | 模块化架构、装饰器模式 |
| 网关 | Socket.io | 4.7+ | WebSocket 实时通信 |
| 数据 | PostgreSQL | 15+ | 成熟稳定关系型数据库 |
| 数据 | Prisma | 5.x | TypeScript 类型安全 ORM |
| 缓存 | Redis | 7+ | 高性能内存缓存 |
| 队列 | BullMQ | 5.x | Redis 持久化消息队列 |
| AI | OpenAI SDK | 4.x | LLM 模型调用 |
| 部署 | Docker Compose | — | 快速容器编排 |

---

## 三、模块设计

### 3.1 模块依赖关系

```mermaid
graph TD
    AppModule[AppModule 根模块]
    
    subgraph 业务模块
        AuthModule[AuthModule 认证]
        UserModule[UserModule 用户]
        ResumeModule[ResumeModule 简历]
        InterviewModule[InterviewModule 面试]
        CareerModule[CareerModule 职业规划]
        AiModule[AiModule AI服务]
    end
    
    subgraph 基础设施模块
        CommonModule[CommonModule 公共]
        QueueModule[QueueModule 队列]
        RedisModule[RedisModule 缓存]
    end
    
    AppModule --> AuthModule
    AppModule --> UserModule
    AppModule --> ResumeModule
    AppModule --> InterviewModule
    AppModule --> CareerModule
    AppModule --> AiModule
    AppModule --> CommonModule
    AppModule --> QueueModule
    AppModule --> RedisModule
    
    AiModule --> CommonModule
    AuthModule --> CommonModule
    ResumeModule --> CommonModule
    ResumeModule --> QueueModule
    InterviewModule --> CommonModule
    InterviewModule --> AiModule
    CareerModule --> CommonModule
    CareerModule --> AiModule
```

### 3.2 模块职责

#### AuthModule（认证模块）

| 组件 | 职责 |
|:----:|------|
| `AuthController` | 注册/登录/Token 刷新/个人资料 5 个端点 |
| `AuthService` | bcrypt 密码加密、JWT 生成/验证、Token 轮换 |
| `JwtStrategy` | Bearer Token 鉴权策略 |
| `JwtRefreshStrategy` | Refresh Token 鉴权策略 |
| `JwtAuthGuard` | JWT 守卫，保护需要认证的接口 |
| `RolesGuard` | 角色权限守卫 |

#### ResumeModule（简历模块）

| 组件 | 职责 |
|:----:|------|
| `ResumeController` | 上传/列表/详情/更新/删除 |
| `ResumeService` | 文件存储、数据库 CRUD |
| `ResumeParser` | PDF/Word/OCR 文本提取 + LLM 结构化解析 |
| `ResumeProcessor` | Bull 队列消费者，异步解析处理 |

#### InterviewModule（面试模块 — 核心）

| 组件 | 职责 |
|:----:|------|
| `InterviewController` | 创建面试/历史列表/详情/回答提交/报告生成 |
| `InterviewService` | 面试业务逻辑 |
| `InterviewGateway` | WebSocket 网关，JWT 鉴权，流式对话 |
| `AiInterviewService` | AI 面试引擎：出题/评估/追问/结束判断 |
| `InterviewReportService` | LLM 综合评价报告生成 |

#### AiModule（AI 服务层）

| 组件 | 职责 |
|:----:|------|
| `AiController` | 5 个 AI 功能 REST 端点 |
| `AiService` | 统一入口：简历解析/出题/评估/报告/规划 |
| `LLMProvider` | 工厂模式，自动选择可用 Provider |
| `OpenAICompatibleProvider` | OpenAI SDK 实现（兼容通义千问、DeepSeek） |

#### CareerModule（职业规划模块）

| 组件 | 职责 |
|:----:|------|
| `CareerController` | 规划 CRUD + 市场洞察 |
| `CareerService` | 规划业务逻辑 |
| `CareerPlanner` | LLM 规划生成引擎：差距分析 + 学习路线 |
| `MarketInsightService` | 市场数据查询 |

---

## 四、数据库设计

### 4.1 ER 图

```mermaid
erDiagram
    users ||--o{ resumes : "拥有"
    users ||--o{ interviews : "发起"
    users ||--o{ career_plans : "拥有"
    interviews ||--o{ interview_messages : "包含"
    interviews }o--|| resumes : "可选关联"

    users {
        string id PK
        string email UK "邮箱-唯一"
        string passwordHash "bcrypt 加密"
        string name "昵称"
        string avatar "头像 URL"
        string education "教育背景"
        string targetPosition "目标岗位"
        string role "user|admin"
        datetime createdAt
        datetime updatedAt
    }

    resumes {
        string id PK
        string userId FK
        string title "简历名称"
        string fileUrl "文件地址"
        json parsedData "LLM 解析数据"
        string[] skills "技能标签"
        string status "parsing|completed|failed"
        datetime createdAt
        datetime updatedAt
    }

    interviews {
        string id PK
        string userId FK
        string resumeId FK "可选关联"
        string targetPosition "目标岗位"
        string difficulty "easy|medium|hard"
        string status "in_progress|completed"
        int questionCount
        int score "综合得分"
        json overallFeedback "综合反馈"
        datetime startedAt
        datetime completedAt
    }

    interview_messages {
        string id PK
        string interviewId FK
        string role "ai|user"
        text content "消息内容"
        string questionType "technical|behavioral|project"
        string feedback "AI 即时反馈"
        datetime createdAt
    }

    career_plans {
        string id PK
        string userId FK
        string targetPosition "目标岗位"
        string[] currentSkills "当前技能"
        string[] gapSkills "技能差距"
        json roadmap "学习路线"
        json marketInsight "市场数据"
        int progress "进度 0-100"
        datetime createdAt
        datetime updatedAt
    }
```

### 4.2 表结构

详见 [`项目设计文件/database_design.md`](../database_design.md)。

---

## 五、API 设计

### 5.1 通用规范

| 规范项 | 说明 |
|:------:|------|
| 基础路径 | `/api` |
| 响应格式 | `{ code, message, data }` |
| 认证方式 | `Authorization: Bearer <access_token>` |
| 分页参数 | `page`（默认 1）、`pageSize`（默认 10） |
| 文件上传 | `multipart/form-data` |

### 5.2 接口总览

| 模块 | 接口数 | 认证要求 |
|:----:|:------:|:--------:|
| Auth | 5 | 3 个公开 + 2 个需认证 |
| Resume | 5 | 全部需认证 |
| Interview | 6 REST + 1 WS | 全部需认证 |
| Career | 5 | 全部需认证 |
| AI | 5 | 全部需认证 |

### 5.3 详细接口定义

详见 [`项目设计文件/api_documentation.md`](../api_documentation.md)。

---

## 六、核心流程设计

### 6.1 AI 面试流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant C as InterviewController
    participant S as InterviewService
    participant AI as AiInterviewService
    participant LLM as LLM Provider
    
    U->>C: POST /api/interviews {position, difficulty}
    C->>S: createInterview()
    S->>AI: generateFirstQuestion(position, difficulty)
    AI->>LLM: chat(systemPrompt + position)
    LLM-->>AI: question JSON
    AI-->>S: first question
    S-->>C: interview + question
    C-->>U: { interviewId, firstQuestion }
    
    Note over U,LLM: 多轮对话循环（5-8 轮）
    
    U->>C: POST /api/interviews/:id/answer {content}
    C->>S: submitAnswer()
    S->>AI: evaluateAndContinue(history)
    AI->>LLM: chat(context + answer)
    LLM-->>AI: { score, feedback, nextAction, nextQuestion? }
    AI-->>S: evaluation result
    S-->>C: { feedback, nextQuestion } / { complete }
    C-->>U: response
    
    Note over U,LLM: 面试结束 → 生成报告
    
    U->>C: POST /api/interviews/:id/feedback
    C->>S: getReport()
    S->>AI: generateReport(messages)
    AI->>LLM: chat(reportPrompt + history)
    LLM-->>AI: report JSON
    AI-->>S: structured report
    S-->>C: report
    C-->>U: { score, dimensions, strengths, suggestions }
```

### 6.2 简历解析流程（异步队列模式）

```mermaid
sequenceDiagram
    participant U as 用户
    participant C as ResumeController
    participant S as ResumeService
    participant Q as BullMQ Queue
    participant P as ResumeProcessor
    participant LLM as LLM Provider
    
    U->>C: POST /resumes/upload (PDF/DOCX)
    C->>S: upload(userId, file)
    S->>S: 校验格式 + 存文件 + 创建 DB 记录(status=parsing)
    S->>Q: addResumeParsingJob(resumeId)
    Q-->>S: job created
    S-->>C: 立即返回 resume { id, status: "parsing" }
    C-->>U: 201 { resumeId, status: "parsing" }
    
    Note over U,LLM: 异步解析开始（不阻塞 HTTP）
    
    Q-->>P: job dispatched
    P->>P: extractText(fileUrl)
    alt PDF 扫描件
        P->>P: pdf-parse 文本过短 → OCR 回退
    end
    P->>LLM: parseResume(text)
    LLM-->>P: { skills, education, experience... }
    P->>S: update DB: parsedData + skills + status=completed
    
    Note over U,S: 前端轮询
    
    U->>C: GET /resumes/:id
    C-->>U: { status: "completed", parsedData, skills }
```

### 6.3 WebSocket 实时对话流程

```mermaid
sequenceDiagram
    participant F as 前端
    participant GW as InterviewGateway
    participant AI as AiInterviewService
    participant DB as Database
    
    F->>GW: connect /ws?token=JWT
    GW->>GW: JWT 鉴权
    GW-->>F: connected
    
    F->>GW: user_answer {interviewId, content}
    GW->>DB: 保存用户回答
    
    GW->>AI: evaluateAndContinue()
    AI->>AI: LLM 调用（流式）
    
    loop 流式输出
        AI-->>GW: content chunk
        GW-->>F: ai_message_chunk {chunk}
    end
    
    GW-->>F: ai_message_done {fullContent, score, feedback, nextAction}
    GW->>DB: 保存 AI 回答 + 评分
```

---

## 七、安全设计

### 7.1 认证机制

```
┌─────────────────────────────────────────────────────┐
│                   JWT 双 Token 机制                    │
│                                                       │
│  Access Token (15分钟)       Refresh Token (7天)      │
│  ┌──────────────────┐      ┌──────────────────┐      │
│  │ 用户ID            │      │ 用户ID            │      │
│  │ 角色              │      │ Token ID         │      │
│  │ 签发时间           │      │ 签发时间           │      │
│  │ 过期时间           │      │ 过期时间           │      │
│  └──────────────────┘      └──────────────────┘      │
│                                                       │
│  每次请求携带 Access Token                             │
│  过期后用 Refresh Token 轮换获取新 Token 对             │
└─────────────────────────────────────────────────────┘
```

### 7.2 密码安全

- 使用 `bcrypt` 哈希存储密码
- salt rounds = 10
- 响应中过滤 `passwordHash` 字段

### 7.3 配置安全（SDD 重构加固）

- 所有敏感配置（`JWT_SECRET`、`REDIS_URL`、`DATABASE_URL`）通过 `@nestjs/config` 的 `ConfigService` 注入
- 应用启动时校验必填配置，缺失则抛异常阻止启动，避免使用不安全的默认值
- `JwtModule` 使用 `registerAsync({ global: true })` 全局共享配置，消除各模块重复注册

### 7.4 接口防护

| 防护措施 | 实现方式 |
|:--------:|----------|
| JWT 认证 | Passport JWT Strategy（ConfigService 注入密钥） |
| 角色权限 | RolesGuard + Roles 装饰器 |
| 参数校验 | class-validator DTO |
| 文件类型校验 | Multer fileFilter |
| 文件大小限制 | 10MB 上限 |
| 敏感字段保护 | Prisma `select` 按需查询，禁止全字段查询后手动剔除 |

---

## 八、部署设计

### 8.1 容器架构

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    
  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    
  backend:
    build: ./backend
    ports: ["3002:3002"]
    depends_on: [postgres, redis]
    env_file: ./backend/.env
```

### 8.2 环境变量配置

| 变量 | 说明 | 示例 |
|:----:|------|:----:|
| `DATABASE_URL` | PostgreSQL 连接 | `postgresql://app:app123456@localhost:5432/career_copilot` |
| `REDIS_URL` | Redis 连接 | `redis://localhost:6379/0` |
| `JWT_SECRET` | JWT 加密密钥 | — |
| `LLM_PROVIDER` | 指定 AI Provider | `openai` / `dashscope` / `deepseek` |
| `OPENAI_API_KEY` | OpenAI API 密钥 | — |

---

## 九、设计决策记录

| 编号 | 决策 | 选项 | 选择理由 |
|:----:|------|:----:|----------|
| ADR-001 | ORM 选型 | Prisma / TypeORM / Sequelize | Prisma 类型安全、TS 优先、迁移工具完善 |
| ADR-002 | 实时通信 | WebSocket(Socket.io) / SSE / 轮询 | 双向通信、低延迟、适合对话场景 |
| ADR-003 | AI Provider | 工厂模式 / 硬编码 | 工厂模式支持多模型无感切换 |
| ADR-004 | 文件存储 | 本地文件系统 / OSS | MVP 阶段本地存储，后续可扩展 OSS |
| ADR-005 | 任务队列 | Bull(BullMQ) / 直接调用 | 解耦耗时操作、失败重试 |
| ADR-006 | 配置管理 | ConfigService 注入 / process.env 直接读取 | ConfigService 可测试性强、支持默认值与校验；所有模块统一使用 ConfigService |
| ADR-007 | 简历解析模式 | 同步阻塞 / 异步队列（BullMQ） | 异步模式避免耗时 LLM 调用阻塞 HTTP 线程池，上传即返回，前端轮询结果 |
| ADR-008 | JSON 序列化策略 | `JSON.parse(JSON.stringify())` / Prisma 5 直接传对象 | Prisma 5+ 原生支持 JSON 对象，直接传入简化代码且保留类型信息 |
| ADR-009 | JWT 密钥管理 | 模块级 registerAsync / Controller 级 process.env | 使用 JwtModule.registerAsync({ global: true }) 全局共享配置，避免重复注册和硬编码回退 |

---

## 十、附录

### 10.1 设计变更记录

| 版本 | 日期 | 变更内容 | 变更人 |
|:----:|:----:|----------|:------:|
| V1.0 | 2026-06-13 | 初始设计 | 陶宏阳 |
| V1.1 | 2026-06-18 | 与实际代码同步更新 | 陶宏阳 |

### 10.2 参考文档

| 文档名称 | 路径 |
|----------|:----:|
| 项目架构文档 | `项目设计文件/project_architecture.md` |
| API 接口文档 | `项目设计文件/api_documentation.md` |
| 数据库设计文档 | `项目设计文件/database_design.md` |
| 项目规范文档 | `项目设计文件/project_standards.md` |
