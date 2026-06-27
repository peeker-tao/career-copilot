# Career-Copilot 项目架构规划

> 版本：v1.1 | 日期：2026-06-27
> 状态：✅ 已实现 ⏳ 待测试
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
┌───────────────────────────────────────────────────────────────────┐
│                       Frontend (React + Vite)                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ 用户页面  │ │ 面试模拟  │ │ 职业规划  │ │ 简历管理  │ │ 岗位匹配│ │
│  │ (登录/    │ │ (数字人   │ │ (路径     │ │ (上传/    │ │ (推荐/  │ │
│  │  注册)    │ │  对话)   │ │  推荐)   │ │  解析)   │ │ 分析)  │ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────────────┐  │
│  │ 学习资源  │ │ 面试题库  │ │ 语音面试  │ │ 管理员后台        │  │
│  └──────────┘ └──────────┘ └──────────┘ └────────────────────┘  │
└──────────────────────┬───────────────────────────────────────────┘
                       │ HTTP / WebSocket
┌──────────────────────▼───────────────────────────────────────────┐
│                     API Gateway (NestJS)                          │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ │
│  │ Auth     │ │ Interview│ │ Career   │ │ Resume   │ │Admin   │ │
│  │ Module   │ │ Module   │ │ Module   │ │ Module   │ │Module  │ │
│  ├──────────┤ ├──────────┤ ├──────────┤ ├──────────┤ ├────────┤ │
│  │JobMatch  │ │ Learning │ │Question  │ │Voice     │ │Resume  │ │
│  │ Module   │ │ Resources│ │ Bank     │ │Interview │ │NER(svc)│ │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └────────┘ │
└──────┬──────────────┬──────────────┬─────────────────────────────┘
       │              │              │
┌──────▼──────┐ ┌─────▼──────┐ ┌────▼──────────────────┐
│ PostgreSQL  │ │   Redis    │ │  AI Services           │
│ (用户/简历/ │ │ (会话缓存/ │ │  ├─ LLM (面试生成)     │
│  面试/题库) │ │  消息队列) │ │  ├─ 语音识别 (ASR)     │
│  岗位/资源) │ │            │ │  ├─ 语音合成 (TTS)     │
└─────────────┘ └────────────┘ │  └─ NER 实体识别       │
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

// ═══════════════ 🆕 新增 v1.1 模型 ⏳ 待测试 ═══════════════

model JobMatch {
  id              String   @id @default(cuid())
  userId          String
  resumeId        String?
  targetPosition  String   // 目标岗位
  matchScore      Float?   // 匹配度 (0-100)
  matchData       Json?    // 匹配详情（技能匹配、经验匹配等）
  recommendations Json?    // 推荐的岗位列表
  status          String   @default("completed")
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])
  resume          Resume?  @relation(fields: [resumeId], references: [id])
}

model LearningResource {
  id          String   @id @default(cuid())
  userId      String
  title       String
  description String?
  url         String?
  resourceType String  // course | article | video | book | project
  tags        String[]
  difficulty  String?  // beginner | intermediate | advanced
  relevanceScore Float?
  source      String?  // 来源：system | ai_recommended | user_saved
  completed   Boolean  @default(false)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

model QuestionBank {
  id          String   @id @default(cuid())
  userId      String?
  position    String   // 目标岗位
  question    String
  answer      String?
  questionType String  // technical | behavioral | project | hr
  difficulty  String   @default("medium") // easy | medium | hard
  tags        String[]
  source      String?  // ai_generated | user_added
  createdAt   DateTime @default(now())

  user        User?    @relation(fields: [userId], references: [id])
}

model VoiceInterviewSession {
  id              String   @id @default(cuid())
  userId          String
  interviewId     String?
  status          String   @default("in_progress") // in_progress | completed | cancelled
  audioUrl        String?  // 录音文件地址
  duration        Int?     // 持续时间（秒）
  questionCount   Int      @default(0)
  transcript      Json?    // 语音转文字记录
  startedAt       DateTime @default(now())
  completedAt     DateTime?

  user            User     @relation(fields: [userId], references: [id])
  interview       Interview? @relation(fields: [interviewId], references: [id])
}

model VoiceInterviewSummary {
  id              String   @id @default(cuid())
  sessionId       String   @unique
  overallScore    Float?   // 综合评分
  fluencyScore    Float?   // 流利度评分
  pronunciationScore Float? // 发音评分
  contentScore    Float?   // 内容评分
  feedback        Json?    // 分题反馈
  suggestions     String?  // 改进建议
  createdAt       DateTime @default(now())

  session         VoiceInterviewSession @relation(fields: [sessionId], references: [id])
}

model AdminLog {
  id          String   @id @default(cuid())
  adminId     String
  action      String   // 操作类型
  target      String?  // 操作对象
  detail      Json?    // 操作详情
  ip          String?
  createdAt   DateTime @default(now())

  admin       User     @relation(fields: [adminId], references: [id])
}

model ScreeningResult {
  id          String   @id @default(cuid())
  resumeId    String
  position    String   // 招聘岗位
  score       Float    // 综合评分 (0-100)
  details     Json?    // 各维度评分详情
  isQualified Boolean? // 是否合格
  createdAt   DateTime @default(now())

  resume      Resume   @relation(fields: [resumeId], references: [id])
}

model ResumeNerCache {
  id          String   @id @default(cuid())
  resumeId    String   @unique
  rawText     String?  // 原始文本
  entities    Json?    // NER 实体列表
  structured  Json?    // 结构化结果
  modelVersion String? // NER 模型版本
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  resume      Resume   @relation(fields: [resumeId], references: [id])
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
| `/job-matching` | 岗位匹配 | 岗位推荐、匹配度分析 |
| `/job-matching/:id` | 匹配详情 | 技能匹配详情、推荐岗位列表 |
| `/learning-resources` | 学习资源 | 课程/文章/视频推荐列表 |
| `/learning-resources/:id` | 资源详情 | 学习资源详情 |
| `/question-bank` | 面试题库 | 按岗位/题型筛选面试题 |
| `/question-bank/:id` | 题目详情 | 题目答案、参考解析 |
| `/voice-interview` | 语音面试 | 语音面试入口 |
| `/voice-interview/:id` | 语音面试中 | 语音对话界面 |
| `/voice-interview/:id/report` | 语音面试报告 | 语音评估报告 |
| `/admin` | 管理后台 | 用户管理、数据统计 |
| `/admin/users` | 用户管理 | 用户列表、角色管理 |
| `/admin/logs` | 操作日志 | 管理员操作审计日志 |

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

### 5.4 岗位匹配与推荐

**流程：**

```
用户简历 + 目标岗位 → 技能提取与标准化
          ↓
LLM 分析技能差距与匹配度
          ↓
生成匹配度评分 + 各维度详情
          ↓
推荐相关岗位 / 技能提升建议
```

**技术要点：**

- 基于简历解析结果提取技能标签
- LLM 进行技能匹配度分析（JSON 结构化输出）
- 支持按岗位名称、技能关键词筛选
- 匹配结果包含：整体评分、技能匹配、经验匹配、教育匹配

### 5.5 学习资源推荐

**流程：**

```
技能差距分析结果 → 生成学习需求
          ↓
系统推荐 + LLM 推荐学习资源
          ↓
按类型（课程/文章/视频/书籍）分类展示
          ↓
用户收藏、标记完成
```

**技术要点：**

- 内置学习资源库 + LLM 动态推荐
- 资源与技能差距直接关联
- 用户可标记学习完成状态
- 支持难度分级（初级/中级/高级）

### 5.6 面试题库

**流程：**

```
按岗位 + 题型生成面试题
          ↓
LLM 生成题目 + 参考答案 + 解析
          ↓
用户练习、查看答案
          ↓
收藏高频考题
```

**技术要点：**

- 支持四种题型：技术题、行为题、项目经验题、HR 题
- LLM 按岗位动态生成题目
- 可作为面试前的独立练习模块

### 5.7 语音面试

**流程：**

```
用户发起语音面试 → 前端录音 → 音频流上传
          ↓
后端 ASR 语音转文字 → LLM 评估回答
          ↓
TTS 语音合成 AI 提问 → 播放给用户
          ↓
多轮对话 → 生成语音面试报告
```

**技术要点：**

- 前端使用 MediaRecorder API 录音
- ASR 支持：Azure Speech / 阿里云语音识别
- TTS 支持：Azure Speech / 阿里云语音合成
- 录音文件暂存至服务器，面试结束后清理
- 评估维度：流利度、发音、内容、综合评分

### 5.8 管理员后台

**功能模块：**

- **用户管理**：用户列表、角色分配、账号启用/停用
- **数据统计**：注册用户数、面试次数、活跃度统计
- **操作审计**：管理员操作日志记录与查询
- **系统配置**：AI 模型参数、面试题配置

**技术要点：**

- 基于角色（user/admin）的权限控制
- 所有管理员操作记录 AdminLog
- 数据统计支持按时间范围筛选

### 5.9 简历 NER 实体识别

**流程：**

```
上传简历 → Python NER 服务 (port 8001)
          ↓
BIO 字典匹配 + 规则引擎
          ↓
识别人名、电话、邮箱、技能、学历等实体
          ↓
返回结构化结果 → 前端展示
```

**技术要点：**

- 独立 Python 服务，基于 Flask/FastAPI
- 使用 BIO 标注模式进行实体识别
- 字典匹配 + 正则规则双引擎
- 覆盖 10+ 类简历实体
- 结果缓存至 ResumeNerCache 表

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
│   │   │   ├── JobMatching/     # 岗位匹配
│   │   │   ├── LearningResource/# 学习资源
│   │   │   ├── QuestionBank/    # 面试题库
│   │   │   ├── VoiceInterview/  # 语音面试
│   │   │   ├── Admin/           # 管理员后台
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
│   │   ├── job-matching/        # 🆕 岗位匹配模块（v1.1）⏳ 待测试
│   │   │   ├── job-matching.controller.ts
│   │   │   ├── job-matching.service.ts
│   │   │   └── dto/
│   │   ├── learning-resources/  # 🆕 学习资源模块（v1.1）⏳ 待测试
│   │   │   ├── learning-resources.controller.ts
│   │   │   ├── learning-resources.service.ts
│   │   │   └── dto/
│   │   ├── question-bank/       # 🆕 面试题库模块（v1.1）⏳ 待测试
│   │   │   ├── question-bank.controller.ts
│   │   │   ├── question-bank.service.ts
│   │   │   └── dto/
│   │   ├── voice-interview/     # 🆕 语音面试模块（v1.1）⏳ 待测试
│   │   │   ├── voice-interview.controller.ts
│   │   │   ├── voice-interview.service.ts
│   │   │   ├── voice-interview.gateway.ts    # WebSocket
│   │   │   └── dto/
│   │   ├── admin/               # 🆕 管理员模块（v1.1）⏳ 待测试
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   └── dto/
│   │   ├── resume-ner/          # 🆕 简历NER模块（v1.1）⏳ 待测试
│   │   │   ├── resume-ner.controller.ts
│   │   │   ├── resume-ner.service.ts
│   │   │   └── ner-python-client.ts    # Python 服务客户端
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

### 🆕 岗位匹配模块（v1.1 新增）⏳ 待测试

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/job-matching/match` | 简历与目标岗位匹配度分析 |
| GET  | `/api/job-matching/matches` | 获取匹配历史列表 |
| GET  | `/api/job-matching/matches/:id` | 获取匹配详情 |
| POST | `/api/job-matching/recommend` | 基于简历推荐岗位 |
| DELETE | `/api/job-matching/matches/:id` | 删除匹配记录 |

### 🆕 学习资源模块（v1.1 新增）⏳ 待测试

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/learning-resources` | 获取学习资源列表（分页+筛选） |
| GET  | `/api/learning-resources/:id` | 获取资源详情 |
| POST | `/api/learning-resources` | 新增学习资源 |
| PATCH | `/api/learning-resources/:id` | 更新资源状态（完成/收藏） |

### 🆕 面试题库模块（v1.1 新增）⏳ 待测试

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/question-bank` | 获取题目列表（分页+筛选） |
| GET  | `/api/question-bank/:id` | 获取题目详情 |
| POST | `/api/question-bank/generate` | 按岗位生成面试题 |
| POST | `/api/question-bank` | 手动添加题目 |

### 🆕 语音面试模块（v1.1 新增）⏳ 待测试

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/voice-interview/sessions` | 创建语音面试会话 |
| GET  | `/api/voice-interview/sessions` | 获取会话列表 |
| GET  | `/api/voice-interview/sessions/:id` | 获取会话详情 |
| POST | `/api/voice-interview/sessions/:id/upload` | 上传音频片段 |
| POST | `/api/voice-interview/sessions/:id/evaluate` | 评估回答 |
| POST | `/api/voice-interview/sessions/:id/complete` | 结束会话 |
| GET  | `/api/voice-interview/sessions/:id/report` | 获取评估报告 |
| WS   | `/ws/voice-interview` | 语音面试实时通信 |

### 🆕 管理员模块（v1.1 新增）⏳ 待测试

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/admin/users` | 用户列表（分页+筛选） |
| PATCH | `/api/admin/users/:id` | 更新用户角色/状态 |
| GET  | `/api/admin/stats` | 系统数据统计 |
| GET  | `/api/admin/logs` | 操作日志列表 |
| POST | `/api/admin/logs` | 写入操作日志 |
| DELETE | `/api/admin/logs` | 清理过期日志 |

### 🆕 简历 NER 模块（v1.1 新增）⏳ 待测试

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/resume-ner/parse` | NER 实体识别（调用 Python 服务） |
| POST | `/api/resume-ner/parse-structured` | NER + 结构化输出 |
| GET  | `/api/resume-ner/cache/:resumeId` | 获取缓存的 NER 结果 |

---

## 八、开发阶段规划

### 第一阶段：基础搭建（1-2 周） ✅ 已实现 ⏳ 待测试

- [x] 初始化前后端项目（Vite + NestJS）
- [x] 配置 PostgreSQL + Redis（Docker Compose）
- [x] 实现用户注册/登录（JWT）
- [x] 搭建前端 Layout 框架 + 路由

### 第二阶段：简历管理（1 周） ✅ 已实现 ⏳ 待测试

- [x] 简历上传与文件解析
- [x] LLM 简历信息提取
- [x] 简历列表与详情展示
- [x] 技能雷达图可视化

### 第三阶段：AI 面试官（核心，2-3 周） ✅ 已实现 ⏳ 待测试

- [x] LLM API 接入与 Prompt 工程
- [x] 面试创建与多轮对话逻辑
- [x] WebSocket 实时通信
- [x] 前端数字人对话界面
- [x] 面试报告生成

### 第四阶段：职业规划（1-2 周） ✅ 已实现 ⏳ 待测试

- [x] 技能差距分析
- [x] 学习路线生成
- [x] 市场数据整合
- [x] 规划展示页面

### 第五阶段：新增业务模块（1-2 周） ✅ 已实现 ⏳ 待测试

- [x] 岗位匹配与推荐模块
- [x] 学习资源推荐模块
- [x] 面试题库模块
- [x] 语音面试模块（ASR/TTS）
- [x] 管理员后台模块
- [x] 简历 NER 实体识别服务（Python）

### 第六阶段：优化与部署（1 周） ⏳ 待测试

- [x] 语音合成/识别集成
- [x] 响应式适配
- [x] Docker 部署
- [x] 项目文档完善

---

## 九、推荐分工

| 成员 | 建议分工 |
|------|---------|
| **陶宏阳**（负责人） | 项目架构、AI 核心逻辑、后端面试模块、语音面试、代码审查 |
| **邓继舟** | 前端开发（面试对话页、数字人组件、简历页、语音面试） |
| **赵原一** | 后端开发（用户/简历/岗位匹配/学习资源模块、数据库设计、API） |
| **李烨** | 前端开发（职业规划页、仪表盘、岗位匹配、管理员后台、样式与交互） |

> **v1.1 新增模块分工：**
> - **岗位匹配 + 学习资源**：赵原一（后端）+ 李烨（前端）
> - **面试题库**：陶宏阳（后端）+ 邓继舟（前端）
> - **语音面试**：陶宏阳（后端 + 语音集成）+ 邓继舟（前端）
> - **管理员后台**：赵原一（后端）+ 李烨（前端）
> - **简历 NER 服务**：陶宏阳（Python 服务搭建）
>
> 建议全员都了解整体架构，前后端接口协商一致后再各自开发。
