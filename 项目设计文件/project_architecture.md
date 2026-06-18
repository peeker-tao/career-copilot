# Career-Copilot 项目架构规划

> AI 模拟面试官 + 智能职业规划平台

---

## 一、技术栈选型

### 前端

| 技术 | 选型 | 说明 |
|------|------|------|
| 框架 | **React 18 + TypeScript** | 组件化开发，生态丰富 |
| 构建工具 | **Vite** | 极速 HMR，开发体验好 |
| UI 组件库 | **Ant Design (antd)** | 企业级 UI，表单/表格/弹窗完善 |
| 状态管理 | **Zustand** | 轻量、TS 友好 |
| 路由 | **React Router v6** | SPA 路由 |
| 数字人交互 | **WebRTC / 腾讯云小微 / Azure Speech** | 实时语音对话 |
| 可视化图表 | **ECharts / AntV** | 职业路径/技能雷达图 |
| HTTP 请求 | **Axios** | 请求/拦截器 |
| 样式方案 | **TailwindCSS + CSS Modules** | 原子化 + 局部样式 |

### 后端

| 技术 | 选型 | 说明 |
|------|------|------|
| 运行时 | **Node.js (>=18 LTS)** | 高并发 I/O 适合 AI 场景 |
| 框架 | **NestJS** | 模块化架构、装饰器、TS 原生支持 |
| 数据库 | **PostgreSQL** | 关系型数据存储 |
| ORM | **Prisma** | TS 优先、类型安全 |
| 缓存 | **Redis** | 面试会话缓存、token 存储 |
| AI/LLM | **OpenAI API / 通义千问 API / DeepSeek API** | 面试题生成、追问、反馈 |
| 语音 | **Azure Speech Services / 阿里云语音** | 语音合成（TTS）+ 语音识别（ASR） |
| 认证 | **JWT (Access + Refresh Token)** | 用户鉴权 |
| 消息队列 | **Bull (基于 Redis)** | 异步任务（简历解析） |
| 部署 | **Docker + Docker Compose** | 容器化部署 |

---

## 二、系统整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React + Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ 用户页面  │  │ 面试模拟  │  │ 职业规划  │  │ 简历管理   │  │
│  │ (登录/    │  │ (数字人   │  │ (路径     │  │ (上传/     │  │
│  │  注册)    │  │  对话)   │  │  推荐)   │  │  解析)    │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼──────────────────────────────────────┐
│                  API Gateway (NestJS)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │ Auth     │  │ Interview│  │ Career   │  │ Resume     │  │
│  │ Module   │  │ Module   │  │ Module   │  │ Module     │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────┘  │
└──────┬──────────────┬──────────────┬────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────────────┐
│ PostgreSQL  │ │   Redis    │ │  AI Services           │
│ (用户/简历/ │ │ (会话缓存/ │ │  ├─ LLM (面试生成)     │
│  面试记录)  │ │  消息队列) │ │  ├─ 语音识别 (ASR)     │
└─────────────┘ └────────────┘ │  └─ 语音合成 (TTS)     │
                               └────────────────────────┘
```

---

## 三、数据库设计

### 3.1 核心表结构

```prisma
// schema.prisma

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  passwordHash  String
  name          String
  avatar        String?
  role          String   @default("user") // user | admin
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  resumes       Resume[]
  interviews    Interview[]
  careerPlans   CareerPlan[]
}

model Resume {
  id          String   @id @default(cuid())
  userId      String
  title       String   // 简历名称
  fileUrl     String?  // 原始文件地址
  parsedData  Json?    // 解析后的结构化数据（技能、经历、教育等）
  skills      String[] // 提取的技能标签
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])
}

model Interview {
  id              String   @id @default(cuid())
  userId          String
  targetPosition  String   // 目标岗位
  difficulty      String   @default("medium") // easy | medium | hard
  status          String   @default("in_progress") // in_progress | completed
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  overallFeedback Json?    // 综合面试反馈

  user            User     @relation(fields: [userId], references: [id])
  messages        InterviewMessage[]
}

model InterviewMessage {
  id          String   @id @default(cuid())
  interviewId String
  role        String   // "ai" | "user"
  content     String
  questionType String? // "technical" | "behavioral" | "project"
  feedback    String?  // AI 对回答的即时反馈
  createdAt   DateTime @default(now())

  interview   Interview @relation(fields: [interviewId], references: [id])
}

model CareerPlan {
  id              String   @id @default(cuid())
  userId          String
  targetPosition  String   // 目标岗位
  currentSkills   String[] // 当前技能
  gapSkills       String[] // 技能差距
  roadmap         Json     // 学习路线 (阶段/课程/时间)
  marketInsight   Json?    // 市场数据洞察
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user            User     @relation(fields: [userId], references: [id])
}
```

---

## 四、前端页面路由规划

| 路由 | 页面 | 功能说明 |
|------|------|---------|
| `/login` | 登录/注册 | 邮箱密码 / OAuth |
| `/` | 首页 / 仪表盘 | 快速入口、近期面试记录 |
| `/resume` | 简历管理 | 上传/编辑/解析简历 |
| `/resume/:id` | 简历详情 | 技能雷达图、经验概览 |
| `/interview` | 面试准备 | 选择岗位、难度、开始面试 |
| `/interview/:id` | 面试中 | 数字人对话界面（核心功能） |
| `/interview/:id/report` | 面试报告 | 面试评分、反馈、改进建议 |
| `/career-plan` | 职业规划 | 目标岗位选择、路径推荐 |
| `/career-plan/:id` | 路径详情 | 分阶段学习计划、课程推荐 |
| `/profile` | 个人中心 | 修改资料、查看历史 |

---

## 五、核心模块详细设计

### 5.1 AI 模拟面试官

```
用户选择岗位 → 系统生成面试题 → 用户回答 → AI追问/反馈
                                                  ↻
                                    (多轮对话直到面试结束)
                                            ↓
                                    生成面试报告与改进建议
```

**技术要点：**

- 使用 **LLM 结构化输出** 生成面试题（System Prompt 控制风格）
- 每次用户回答后，LLM 判断：① 评分 ② 是否追问 ③ 即时反馈
- 支持 **WebSocket** 实现流式输出，打字机效果展示 AI 回答
- (可选) 集成 **语音合成**，数字人朗读题目

**Prompt 设计思路：**

```
System: 你是一名资深的{岗位}面试官。请根据以下规则进行面试：
1. 先问一个{岗位}的核心面试题
2. 根据候选人的回答，给出1-5分评分和针对性反馈
3. 如果回答不完整，进行追问
4. 面试至少进行5-8轮
5. 面试结束后，汇总优缺点和改进建议
```

### 5.2 简历解析与技能分析

**流程：**

```
上传简历(PDF/Word) → 文件转文本 → LLM结构化提取
                                    ↓
                            技能标签、工作经历、教育背景
                                    ↓
                            技能雷达图可视化
```

**技术要点：**

- 后端使用 `pdf-parse` / `mammoth` 解析文档
- LLM 提取结构化信息（JSON 格式）
- 技能标签映射到标准技能库

### 5.3 职业发展路径推荐

**流程：**

```
用户输入目标岗位 + 当前技能
          ↓
LLM + 市场数据分析技能差距
          ↓
生成分阶段学习计划
          ↓
推荐学习资源（课程/书籍/项目）
```

**数据来源：**

- 简历解析出的当前技能
- 市场招聘数据（爬取或公开数据集）
- LLM 对岗位要求的理解

---

## 六、项目目录结构

```
career-copilot/
├── frontend/                    # 前端项目
│   ├── public/
│   ├── src/
│   │   ├── api/                 # API 接口封装
│   │   ├── assets/              # 静态资源
│   │   ├── components/          # 公共组件
│   │   │   ├── Layout/
│   │   │   ├── DigitalHuman/    # 数字人组件
│   │   │   └── SkillRadar/      # 技能雷达图
│   │   ├── hooks/               # 自定义 Hooks
│   │   ├── pages/               # 页面
│   │   │   ├── Login/
│   │   │   ├── Home/
│   │   │   ├── Resume/
│   │   │   ├── Interview/
│   │   │   ├── CareerPlan/
│   │   │   └── Profile/
│   │   ├── store/               # Zustand 状态
│   │   ├── types/               # TS 类型定义
│   │   ├── utils/               # 工具函数
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                     # 后端项目 (NestJS)
│   ├── prisma/
│   │   └── schema.prisma        # 数据库模型
│   ├── src/
│   │   ├── auth/                # 认证模块
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   └── dto/
│   │   ├── user/                # 用户模块
│   │   ├── resume/              # 简历模块
│   │   │   ├── resume.controller.ts
│   │   │   ├── resume.service.ts
│   │   │   ├── resume.parser.ts        # 简历解析引擎
│   │   │   └── resume.processor.ts     # BullMQ 队列消费者（异步解析）
│   │   ├── interview/           # 面试模块（核心）
│   │   │   ├── interview.controller.ts
│   │   │   ├── interview.service.ts
│   │   │   ├── interview.gateway.ts       # WebSocket
│   │   │   ├── interview.utils.ts         # 面试动作标准化
│   │   │   ├── interview-report.service.ts# 面试报告生成
│   │   │   ├── ai-interview.service.ts    # AI 面试逻辑
│   │   │   └── dto/
│   │   ├── career/              # 职业规划模块
│   │   │   ├── career.controller.ts
│   │   │   ├── career.service.ts
│   │   │   ├── career.planner.ts
│   │   │   └── market-insight.service.ts  # 市场洞察
│   │   ├── ai/                  # AI 统一入口
│   │   │   ├── ai.module.ts
│   │   │   ├── ai.service.ts
│   │   │   ├── ai.controller.ts       # 5 个 AI 端点
│   │   │   ├── llm.provider.ts       # LLM 适配器
│   │   │   ├── dto/
│   │   │   ├── providers/            # LLM Provider 实现
│   │   │   └── prompts/              # 5 个 Prompt 模板
│   │   ├── queue/               # 消息队列
│   │   │   ├── queue.module.ts       # BullMQ 配置
│   │   │   └── queue.service.ts      # 作业调度
│   │   ├── redis/               # Redis 缓存
│   │   │   ├── redis.module.ts       # Redis 连接
│   │   │   └── redis.service.ts      # 缓存方法
│   │   ├── common/              # 公共模块
│   │   ├── types/               # 全局类型定义
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── docker-compose.yml       # PostgreSQL + Redis
│   ├── Dockerfile
│   ├── .env.example
│   ├── tsconfig.json
│   └── package.json
│
├── docs/                        # 文档
│   ├── api.md                   # API 接口文档
│   └── architecture.md
├── datasets/                    # 数据集说明
│   └── datasets_proposition.md
└── README.md
```

---

## 七、API 接口规划

### 认证模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录 |
| POST | `/api/auth/refresh` | 刷新 Token |
| GET  | `/api/auth/profile` | 获取用户信息 |
| PATCH | `/api/auth/profile` | 修改个人资料 |

### 简历模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/resumes/upload` | 上传简历文件（异步解析） |
| GET  | `/api/resumes` | 获取简历列表（分页） |
| GET  | `/api/resumes/:id` | 获取简历详情（含解析数据） |
| PUT  | `/api/resumes/:id` | 编辑简历 |
| DELETE | `/api/resumes/:id` | 删除简历 |

### 面试模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/interviews` | 创建面试会话（AI 自动出题） |
| GET  | `/api/interviews` | 获取面试历史（分页+筛选） |
| GET  | `/api/interviews/:id` | 获取面试详情 |
| GET  | `/api/interviews/:id/messages` | 获取对话历史 |
| POST | `/api/interviews/:id/answer` | 提交回答（AI 评估+追问/下一题） |
| POST | `/api/interviews/:id/feedback` | 获取面试反馈报告 |
| WS   | `/ws/interview` | WebSocket 实时对话（流式） |

### 职业规划模块

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/career/plan` | 生成职业规划 |
| GET  | `/api/career/plans` | 获取规划列表 |
| GET  | `/api/career/plans/:id` | 获取规划详情 |
| DELETE | `/api/career/plans/:id` | 删除规划 |
| POST | `/api/career/market-insight` | 获取岗位市场数据 |

### AI 统一服务层

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ai/resume/parse` | 简历文本 → 结构化 JSON |
| POST | `/api/ai/interview/question` | 根据岗位生成面试题 |
| POST | `/api/ai/interview/evaluate` | 评估用户回答 |
| POST | `/api/ai/interview/report` | 面试对话 → 综合评价报告 |
| POST | `/api/ai/career/plan` | 技能分析 → 职业规划 + 学习路线 |

---

## 八、开发阶段规划

### 第一阶段：基础搭建（1-2 周）

- [ ] 初始化前后端项目（Vite + NestJS）
- [ ] 配置 PostgreSQL + Redis（Docker Compose）
- [ ] 实现用户注册/登录（JWT）
- [ ] 搭建前端 Layout 框架 + 路由

### 第二阶段：简历管理（1 周）

- [ ] 简历上传与文件解析
- [ ] LLM 简历信息提取
- [ ] 简历列表与详情展示
- [ ] 技能雷达图可视化

### 第三阶段：AI 面试官（核心，2-3 周）

- [ ] LLM API 接入与 Prompt 工程
- [ ] 面试创建与多轮对话逻辑
- [ ] WebSocket 实时通信
- [ ] 前端数字人对话界面
- [ ] 面试报告生成

### 第四阶段：职业规划（1-2 周）

- [ ] 技能差距分析
- [ ] 学习路线生成
- [ ] 市场数据整合
- [ ] 规划展示页面

### 第五阶段：优化与部署（1 周）

- [ ] 语音合成/识别（可选）
- [ ] 响应式适配
- [ ] Docker 部署
- [ ] 项目文档完善

---

## 九、推荐分工

| 成员 | 建议分工 |
|------|---------|
| **陶宏阳**（负责人） | 项目架构、AI 核心逻辑、后端面试模块、代码审查 |
| **邓继舟** | 前端开发（面试对话页、数字人组件、简历页） |
| **赵原一** | 后端开发（用户/简历模块、数据库设计、API） |
| **李烨** | 前端开发（职业规划页、仪表盘、样式与交互） |

> 建议全员都了解整体架构，前后端接口协商一致后再各自开发。
