# Career-Copilot API 接口文档

> 版本：v1.0 | 日期：2026-06-13
> 基础 URL：`/api/v1`

---

## 一、通用规范

### 1.1 请求格式

- **Content-Type**: `application/json`（文件上传使用 `multipart/form-data`）
- **认证方式**: Bearer Token（JWT），在 `Authorization` 头中携带

```
Authorization: Bearer <access_token>
```

### 1.2 响应格式

所有接口统一返回格式：

```json
{
  "code": 200,
  "message": "success",
  "data": { }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | number | HTTP 状态码 |
| `message` | string | 提示信息 |
| `data` | object/array | 业务数据 |

### 1.3 错误码定义

| code | message | 说明 |
|:----:|---------|------|
| 200 | success | 请求成功 |
| 201 | created | 创建成功 |
| 400 | bad request | 请求参数错误 |
| 401 | unauthorized | 未认证 / Token 失效 |
| 403 | forbidden | 无权限访问 |
| 404 | not found | 资源不存在 |
| 409 | conflict | 资源冲突（如邮箱已注册） |
| 413 | file too large | 文件大小超限 |
| 422 | unprocessable entity | 语义错误（如文件格式不支持） |
| 429 | too many requests | 请求频率超限 |
| 500 | internal server error | 服务器内部错误 |

### 1.4 分页规范

列表接口统一分页参数：

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码 |
| `pageSize` | number | 10 | 每页条数（最大 50） |

分页响应：

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [],
    "pagination": {
      "page": 1,
      "pageSize": 10,
      "total": 100
    }
  }
}
```

---

## 二、认证模块（Auth）

### POST `/auth/register` — 用户注册

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "abc123456",
  "name": "小明"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `email` | string | ✅ | 邮箱，需合法格式 |
| `password` | string | ✅ | 密码，≥ 6 位 |
| `name` | string | ✅ | 昵称，2-20 字符 |

**响应 `201`：**

```json
{
  "code": 201,
  "message": "注册成功",
  "data": {
    "user": {
      "id": "clx...",
      "email": "user@example.com",
      "name": "小明",
      "avatar": null,
      "role": "user"
    },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### POST `/auth/login` — 用户登录

**请求体：**

```json
{
  "email": "user@example.com",
  "password": "abc123456"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `email` | string | ✅ | 注册邮箱 |
| `password` | string | ✅ | 密码 |

**响应 `200`：** 同注册返回结构

### POST `/auth/refresh` — 刷新 Token

**请求体：**

```json
{
  "refreshToken": "eyJhbG..."
}
```

**响应 `200`：**

```json
{
  "code": 200,
  "message": "token 刷新成功",
  "data": {
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### GET `/auth/profile` — 获取用户信息

**请求头：** `Authorization: Bearer <token>`

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "clx...",
    "email": "user@example.com",
    "name": "小明",
    "avatar": "https://...",
    "education": "华中科技大学 软件工程 本科 2024级",
    "targetPosition": "后端开发工程师",
    "role": "user",
    "createdAt": "2026-06-13T08:00:00.000Z"
  }
}
```

### PATCH `/auth/profile` — 修改个人资料

**请求体：**

```json
{
  "name": "小明改名字了",
  "avatar": "https://...",
  "education": "武汉大学 计算机科学与技术 硕士 2024级",
  "targetPosition": "算法工程师"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `name` | string | | 昵称 |
| `avatar` | string | | 头像 URL |
| `education` | string | | 教育背景 |
| `targetPosition` | string | | 目标岗位 |

**响应 `200`：** 返回更新后的用户信息

---

## 三、简历模块（Resume）

### POST `/resumes/upload` — 上传简历

**请求格式：** `multipart/form-data`

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `file` | File | ✅ | 简历文件，支持 `.pdf` / `.docx`，≤ 10MB |
| `title` | string | | 简历名称（默认使用文件名） |

**响应 `201`：**

```json
{
  "code": 201,
  "message": "上传成功，简历解析中",
  "data": {
    "id": "clx...",
    "title": "小明_简历_2026.pdf",
    "fileUrl": "https://...",
    "status": "parsing"
  }
}
```

> 简历解析为异步任务（通过 BullMQ 队列执行）。HTTP 请求立即返回，不阻塞线程。
> 前端轮询 `GET /resumes/:id` 直到 `status` 变为 `completed` 或 `failed`。

### GET `/resumes` — 获取简历列表

**查询参数：** 标准分页参数

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "clx...",
        "title": "小明_后端简历.pdf",
        "status": "completed",
        "skills": ["Java", "Spring Boot", "MySQL", "Redis"],
        "createdAt": "2026-06-13T08:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 3 }
  }
}
```

### GET `/resumes/:id` — 获取简历详情（含解析数据）

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "clx...",
    "title": "小明_后端简历.pdf",
    "status": "completed",
    "fileUrl": "https://...",
    "parsedData": {
      "basicInfo": {
        "name": "小明",
        "phone": "138****1234",
        "email": "user@example.com"
      },
      "education": [
        { "school": "华中科技大学", "major": "软件工程", "degree": "本科", "period": "2022-2026" }
      ],
      "experience": [
        { "company": "XX科技", "position": "后端开发实习生", "period": "2025.06-2025.09", "description": "..." }
      ],
      "skills": ["Java", "Spring Boot", "MySQL", "Redis", "Git", "Docker"],
      "projects": [
        { "name": "在线商城系统", "role": "后端开发", "techStack": ["Spring Boot", "MySQL"], "description": "..." }
      ]
    },
    "createdAt": "2026-06-13T08:00:00.000Z"
  }
}
```

### PUT `/resumes/:id` — 手动编辑简历解析结果

**请求体：**

```json
{
  "parsedData": {
    "skills": ["Java", "Spring Boot", "MySQL", "Redis", "RabbitMQ"]
  }
}
```

**响应 `200`：** 返回更新后的简历数据

### DELETE `/resumes/:id` — 删除简历

**响应 `200`：**

```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 四、面试模块（Interview）

### POST `/interviews` — 创建面试会话

**请求体：**

```json
{
  "resumeId": "clx...",
  "targetPosition": "后端开发工程师",
  "difficulty": "medium"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `resumeId` | string | | 关联简历 ID（可选，传了则基于简历出题） |
| `targetPosition` | string | ✅ | 目标岗位 |
| `difficulty` | string | ✅ | `easy` / `medium` / `hard` |

**响应 `201`：**

```json
{
  "code": 201,
  "message": "面试会话创建成功",
  "data": {
    "id": "intv_xxx",
    "targetPosition": "后端开发工程师",
    "difficulty": "medium",
    "status": "in_progress",
    "startedAt": "2026-06-13T08:00:00.000Z",
    "firstQuestion": "请介绍一下 Java 中的 HashMap 底层实现原理？"
  }
}
```

### GET `/interviews` — 获取面试历史

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `page` | number | | 页码 |
| `pageSize` | number | | 每页条数 |
| `status` | string | | 筛选：`in_progress` / `completed` |
| `targetPosition` | string | | 按岗位筛选 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "intv_xxx",
        "targetPosition": "后端开发工程师",
        "difficulty": "medium",
        "status": "completed",
        "score": 78,
        "questionCount": 8,
        "startedAt": "2026-06-13T08:00:00.000Z",
        "completedAt": "2026-06-13T08:25:00.000Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 15 }
  }
}
```

### GET `/interviews/:id` — 获取面试详情

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "intv_xxx",
    "targetPosition": "后端开发工程师",
    "difficulty": "medium",
    "status": "completed",
    "score": 78,
    "questionCount": 8,
    "startedAt": "2026-06-13T08:00:00.000Z",
    "completedAt": "2026-06-13T08:25:00.000Z"
  }
}
```

### GET `/interviews/:id/messages` — 获取面试对话记录

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "messages": [
      {
        "id": "msg_1",
        "role": "ai",
        "content": "请介绍一下 Java 中 HashMap 的底层实现原理？",
        "questionType": "technical",
        "createdAt": "2026-06-13T08:00:00.000Z"
      },
      {
        "id": "msg_2",
        "role": "user",
        "content": "HashMap 底层是数组+链表+红黑树实现的...",
        "createdAt": "2026-06-13T08:01:00.000Z"
      },
      {
        "id": "msg_3",
        "role": "ai",
        "content": "回答得不错，但我注意到你没有提到负载因子和扩容机制，能否再详细说明一下？",
        "questionType": "technical",
        "feedback": "评分：4/5。对底层结构描述清晰，但扩容机制遗漏。",
        "createdAt": "2026-06-13T08:01:30.000Z"
      }
    ]
  }
}
```

### DELETE `/interviews/:id` — 删除面试记录

**说明：** 删除指定的面试记录及其所有对话消息（级联删除）。

**路径参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `id` | string | ✅ | 面试会话 ID |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "删除成功",
  "data": {
    "message": "面试记录已成功删除",
    "deletedInterview": {
      "id": "intv_xxx",
      "targetPosition": "Java后端开发",
      "status": "completed"
    }
  }
}
```

**错误响应：**

- `404`: 面试记录不存在或不属于当前用户

### POST `/interviews/:id/answer` — 提交用户回答

**请求体：**

```json
{
  "content": "HashMap 底层是数组+链表+红黑树实现的..."
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `content` | string | ✅ | 用户回答内容 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "userMessageId": "msg_2",
    "aiResponse": {
      "id": "msg_3",
      "role": "ai",
      "content": "回答得不错，但我注意到你没有提到负载因子和扩容机制，能否再详细说明一下？",
      "feedback": "评分：4/5。对底层结构描述清晰，但扩容机制遗漏。",
      "isFollowUp": true
    }
  }
}
```

| 返回字段 | 类型 | 说明 |
|----------|------|------|
| `aiResponse.isFollowUp` | boolean | 是否追问（true=继续追问，false=进入下一题） |
| `aiResponse.questionType` | string | `technical` / `behavioral` / `project` |

### POST `/interviews/:id/feedback` — 获取面试总结报告

**说明：** 面试结束后调用（状态为 `completed` 时），生成最终报告。

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "interviewId": "intv_xxx",
    "overallScore": 78,
    "dimensions": {
      "professionalSkill": { "score": 80, "comment": "专业技能扎实，但对分布式相关知识了解不足" },
      "communication": { "score": 75, "comment": "表达较清晰，但结构可以更严谨" },
      "logicalThinking": { "score": 82, "comment": "逻辑思维能力强" },
      "projectExperience": { "score": 70, "comment": "项目介绍缺乏亮点和数据支撑" }
    },
    "strengths": ["Java 基础扎实", "逻辑清晰", "学习态度积极"],
    "weaknesses": ["分布式经验不足", "项目深度不够", "缺乏系统设计思维"],
    "improvementSuggestions": [
      { "item": "深入学习 Redis、消息队列等中间件", "priority": "high", "resources": ["《Redis 设计与实现》", "MIT 6.824 分布式系统"] },
      { "item": "重新梳理项目，用 STAR 法则准备项目介绍", "priority": "high", "resources": [] },
      { "item": "刷系统设计相关题目", "priority": "medium", "resources": ["《系统设计面试》Alex Xu"] }
    ],
    "answerDetails": [
      { "question": "HashMap 实现原理", "score": 4, "comment": "底层结构答得好，扩容机制遗漏" },
      { "question": "MySQL 索引优化", "score": 3, "comment": "覆盖面不够" }
    ]
  }
}
```

### WebSocket `/ws/interview/:id` — 实时面试对话

**说明：** 用于流式传输 AI 回答，实现打字机效果。

**连接方式：**

```
ws://host/api/v1/ws/interview/intv_xxx?token=<access_token>
```

**消息格式（服务端 → 客户端）：**

```json
{
  "type": "ai_message_chunk",
  "data": {
    "messageId": "msg_3",
    "chunk": "回答得不错，但"
  }
}
```

```json
{
  "type": "ai_message_done",
  "data": {
    "messageId": "msg_3",
    "fullContent": "回答得不错，但我注意到你没有提到负载因子和扩容机制，能否再详细说明一下？",
    "feedback": "评分：4/5。对底层结构描述清晰，但扩容机制遗漏。",
    "isFollowUp": true
  }
}
```

**消息格式（客户端 → 服务端）：**

```json
{
  "type": "user_answer",
  "data": {
    "content": "HashMap 底层是数组+链表+红黑树实现的..."
  }
}
```

---

## 五、职业规划模块（Career）

### POST `/career/plan` — 生成职业规划

**请求体：**

```json
{
  "targetPosition": "后端开发工程师",
  "resumeId": "clx...",
  "currentSkills": ["Java", "MySQL"]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `targetPosition` | string | ✅ | 目标岗位 |
| `resumeId` | string | | 关联简历（自动提取技能） |
| `currentSkills` | string[] | | 手动填写的当前技能（与 resumeId 二选一） |

**响应 `201`：**

```json
{
  "code": 201,
  "message": "职业规划生成成功",
  "data": {
    "id": "plan_xxx",
    "targetPosition": "后端开发工程师",
    "currentSkills": ["Java", "MySQL"],
    "gapSkills": ["Spring Boot", "Redis", "消息队列", "Docker", "微服务"],
    "roadmap": [
      {
        "phase": 1,
        "title": "基础巩固（2周）",
        "goal": "熟练掌握 Spring Boot 框架",
        "skills": ["Spring Boot", "MyBatis", "RESTful API"],
        "resources": [
          { "name": "Spring Boot 官方文档", "type": "document", "url": "https://spring.io/guides" },
          { "name": "尚硅谷 Spring Boot 教程", "type": "video", "url": "..." }
        ],
        "estimatedWeeks": 2
      },
      {
        "phase": 2,
        "title": "中间件进阶（3周）",
        "goal": "掌握 Redis、消息队列等核心中间件",
        "skills": ["Redis", "RabbitMQ", "Elasticsearch"],
        "resources": [
          { "name": "《Redis 设计与实现》", "type": "book", "url": "..." }
        ],
        "estimatedWeeks": 3
      },
      {
        "phase": 3,
        "title": "项目实战（4周）",
        "goal": "完成一个分布式项目并部署",
        "skills": ["Docker", "微服务", "项目部署"],
        "resources": [],
        "estimatedWeeks": 4
      }
    ],
    "marketInsight": {
      "averageSalary": "15K-30K",
      "demandTrend": "持续增长",
      "topSkills": ["Java", "Spring Boot", "MySQL", "Redis", "微服务"],
      "experienceDistribution": {
        "entry": "20%",
        "junior": "35%",
        "mid": "30%",
        "senior": "15%"
      }
    },
    "createdAt": "2026-06-13T08:00:00.000Z"
  }
}
```

### GET `/career/plans` — 获取职业规划列表

**查询参数：** 标准分页参数

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "plan_xxx",
        "targetPosition": "后端开发工程师",
        "progress": 30,
        "createdAt": "2026-06-13T08:00:00.000Z"
      }
    ],
    "pagination": { "page": 1, "pageSize": 10, "total": 2 }
  }
}
```

### GET `/career/plans/:id` — 获取规划详情

**响应 `200`：** 同 POST 创建返回的完整数据结构

### DELETE `/career/plans/:id` — 删除规划

**响应 `200`：**

```json
{
  "code": 200,
  "message": "删除成功"
}
```

### PATCH `/career/plans/:id/progress` — 更新学习进度（待实现）

**请求体：**

```json
{
  "phase": 1,
  "progress": 100
}
```

### GET `/career/market-insight` — 获取市场洞察数据

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `position` | string | ✅ | 目标岗位 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "averageSalary": "15K-30K",
    "demandTrend": "持续增长",
    "topSkills": ["Java", "Spring Boot", "MySQL", "Redis", "微服务"],
    "experienceDistribution": {
      "entry": "20%",
      "junior": "35%",
      "mid": "30%",
      "senior": "15%"
    }
  }
}

---

## 六、仪表盘模块（Dashboard）

### GET `/dashboard` — 获取首页概览数据

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "stats": {
      "totalInterviews": 15,
      "averageScore": 72,
      "totalResumes": 3,
      "activePlans": 1
    },
    "recentInterviews": [
      {
        "id": "intv_xxx",
        "targetPosition": "后端开发工程师",
        "score": 78,
        "completedAt": "2026-06-13T08:25:00.000Z"
      }
    ],
    "recentPlans": [
      {
        "id": "plan_xxx",
        "targetPosition": "后端开发工程师",
        "progress": 30
      }
    ],
    "scoreTrend": [
      { "date": "2026-06-01", "score": 58 },
      { "date": "2026-06-05", "score": 65 },
      { "date": "2026-06-10", "score": 72 },
      { "date": "2026-06-13", "score": 78 }
    ]
  }
}
```

---

## 七、接口与页面映射对照表

| 前端页面 | 路由 | 对应 API |
|----------|------|----------|
| 登录页 | `/login` | `POST /auth/login`、`POST /auth/register` |
| 首页仪表盘 | `/` | `GET /dashboard` |
| 简历列表 | `/resume` | `GET /resumes` |
| 简历详情 | `/resume/:id` | `GET /resumes/:id`、`PUT /resumes/:id`、`DELETE /resumes/:id` |
| 简历上传 | `/resume/upload` | `POST /resumes/upload` |
| 面试准备 | `/interview` | `POST /interviews` |
| 面试中 | `/interview/:id` | `WS /ws/interview/:id`、`POST /interviews/:id/answer` |
| 面试报告 | `/interview/:id/report` | `GET /interviews/:id/messages`、`POST /interviews/:id/feedback` |
| 面试历史 | `/history` | `GET /interviews` |
| 职业规划 | `/career-plan` | `POST /career/plan`、`GET /career/plans` |
| 规划详情 | `/career-plan/:id` | `GET /career/plans/:id` |
| 个人中心 | `/profile` | `GET /auth/profile`、`PATCH /auth/profile` |
| 市场洞察 | `/market-insight` | `GET /career/market-insight` |

---

## 八、TS 类型定义（前后端共享）

```typescript
// 用户
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  education?: string;
  targetPosition?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

// 简历
interface Resume {
  id: string;
  title: string;
  status: 'parsing' | 'completed' | 'failed';
  fileUrl?: string;
  parsedData?: ParsedResume;
  skills: string[];
  createdAt: string;
}

interface ParsedResume {
  basicInfo: { name: string; phone: string; email: string };
  education: Education[];
  experience: Experience[];
  skills: string[];
  projects: Project[];
}

// 面试
interface Interview {
  id: string;
  targetPosition: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: 'in_progress' | 'completed';
  score?: number;
  questionCount: number;
  startedAt: string;
  completedAt?: string;
}

interface InterviewMessage {
  id: string;
  role: 'ai' | 'user';
  content: string;
  questionType?: 'technical' | 'behavioral' | 'project';
  feedback?: string;
  createdAt: string;
}

interface InterviewReport {
  overallScore: number;
  dimensions: Record<string, { score: number; comment: string }>;
  strengths: string[];
  weaknesses: string[];
  improvementSuggestions: Suggestion[];
  answerDetails: AnswerDetail[];
}

// 职业规划
interface CareerPlan {
  id: string;
  targetPosition: string;
  currentSkills: string[];
  gapSkills: string[];
  roadmap: Phase[];
  marketInsight?: MarketInsight;
  createdAt: string;
}

interface Phase {
  phase: number;
  title: string;
  goal: string;
  skills: string[];
  resources: Resource[];
  estimatedWeeks: number;
}