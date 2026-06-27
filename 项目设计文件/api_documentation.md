# Career-Copilot API 接口文档

> 版本：v1.1 | 日期：2026-06-27
> 状态：✅ 已实现 ⏳ 待测试
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

### POST `/auth/forgot-password` — 忘记密码

**请求体：**

```json
{
  "email": "user@example.com"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `email` | string | ✅ | 注册邮箱 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "重置链接已发送至邮箱"
}
```

> 限流：每小时最多 3 次请求

### POST `/auth/reset-password` — 重置密码

**请求体：**

```json
{
  "token": "reset_token_xxx",
  "password": "newPassword123"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `token` | string | ✅ | 重置令牌 |
| `password` | string | ✅ | 新密码（≥ 6 位） |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "密码重置成功"
}
```

> 限流：每小时最多 5 次请求

### PATCH `/auth/model-config` — 更新模型配置

**请求体：**

```json
{
  "provider": "deepseek",
  "model": "deepseek-chat",
  "apiKey": "sk-xxx"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `provider` | string | | 服务商：`openai` / `dashscope` / `deepseek` |
| `model` | string | | 模型名称 |
| `apiKey` | string | | API Key（加密存储） |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "模型配置已更新"
}
```

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

### POST `/resumes/:id/rewrite-suggestions` — 获取简历改写建议

**请求体：**

```json
{
  "targetPosition": "后端开发工程师"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `targetPosition` | string | ✅ | 目标岗位 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "suggestions": [
      {
        "section": "summary",
        "original": "有两年开发经验",
        "suggested": "拥有2年全栈开发经验，精通Java和Spring Boot框架",
        "reason": "突出技术栈和年限，更具说服力"
      }
    ]
  }
}
```

### POST `/resumes/:id/rewrite-section` — 改写简历特定部分

**请求体：**

```json
{
  "section": "summary",
  "targetPosition": "后端开发工程师",
  "content": "有两年开发经验"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `section` | string | ✅ | 改写部分：`summary` / `experience` / `skills` / `projects` |
| `targetPosition` | string | ✅ | 目标岗位 |
| `content` | string | ✅ | 原始内容 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "rewritten": "拥有2年全栈开发经验，精通Java和Spring Boot框架",
    "changes": ["补充技术栈细节", "优化表达方式"]
  }
}
```

### POST `/resumes/screening/benchmark-import` — 导入岗位筛选基准数据

> ⚠️ 无需认证，用于批量导入 Kaggle 等外部简历筛选基准数据集

**请求体：**

```json
{
  "records": [
    {
      "resumeId": "ext_001",
      "position": "Data Scientist",
      "skills": ["Python", "Machine Learning", "SQL"],
      "experience": 3,
      "education": "Master",
      "aiScore": 92
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `records` | array | ✅ | 基准记录列表 |

**响应 `201`：**

```json
{
  "code": 201,
  "message": "导入成功",
  "data": {
    "imported": 50,
    "total": 50
  }
}
```

### POST `/resumes/screening/evaluate` — AI 简历筛选评估

> ⚠️ 无需认证，基于 5 个维度对简历进行 AI 打分

**请求体：**

```json
{
  "resumeText": "...",
  "position": "Data Scientist",
  "criteria": {
    "skills": ["Python", "Machine Learning"],
    "minExperience": 2,
    "minEducation": "Bachelor"
  }
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `resumeText` | string | ✅ | 简历文本内容 |
| `position` | string | ✅ | 目标岗位 |
| `criteria` | object | ✅ | 筛选标准 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overallScore": 85,
    "dimensions": {
      "skillsMatch": 90,
      "experience": 80,
      "education": 100,
      "keywordCoverage": 85,
      "formatQuality": 70
    },
    "recommendation": "recommend",
    "summary": "候选人技能匹配度高，建议进入面试环节"
  }
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

### PATCH `/career/plans/:id/progress` — 更新学习进度

**请求体：**

```json
{
  "phase": 1,
  "progress": 100
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `phase` | number | ✅ | 阶段序号 |
| `progress` | number | ✅ | 进度百分比（0-100） |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "更新成功",
  "data": {
    "id": "plan_xxx",
    "phase": 1,
    "progress": 100
  }
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

## 七、🆕 岗位匹配模块（Job Matching）⏳ 待测试

> 基于 AI 的岗位推荐与匹配度分析

**基础路径：** `/api/v1/job-matching`
**认证：** 需 JWT

### GET `/job-matching/recommendations` — 获取 AI 智能岗位推荐

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `limit` | number | | 返回数量（1-50，默认 10） |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "rec_001",
      "position": "高级后端开发工程师",
      "company": "字节跳动",
      "location": "北京",
      "matchScore": 92,
      "reason": "您的 Java 和微服务经验与该岗位高度匹配",
      "skills": ["Java", "Spring Boot", "微服务", "Redis"]
    }
  ]
}
```

### GET `/job-matching/matches` — 获取用户保存的岗位列表

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `page` | number | | 页码（默认 1） |
| `limit` | number | | 每页条数（默认 20） |
| `status` | string | | 状态筛选：`saved` / `applied` / `interviewing` / `offered` / `rejected` |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "match_001",
        "position": "后端开发工程师",
        "company": "阿里巴巴",
        "status": "saved",
        "matchScore": 88,
        "createdAt": "2026-06-20T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 15
    }
  }
}
```

### PATCH `/job-matching/matches/:id/status` — 更新岗位状态

**请求体：**

```json
{
  "status": "applied"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `status` | string | ✅ | 新状态：`saved` / `applied` / `interviewing` / `offered` / `rejected` |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "状态更新成功"
}
```

### POST `/job-matching/analyze` — 分析简历与目标岗位匹配度

**请求体：**

```json
{
  "resumeId": "res_001",
  "position": "后端开发工程师"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `resumeId` | string | ✅ | 简历 ID |
| `position` | string | ✅ | 目标岗位 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overallScore": 85,
    "skillMatch": {
      "matched": ["Java", "MySQL", "Git"],
      "missing": ["Kubernetes", "Docker"],
      "score": 80
    },
    "experienceMatch": {
      "requiredYears": 3,
      "actualYears": 2.5,
      "score": 75
    },
    "suggestions": [
      "补充 Docker 和 Kubernetes 相关项目经验",
      "突出微服务架构设计能力"
    ]
  }
}
```

### POST `/job-matching/import` — 导入外部岗位匹配数据

> 用于批量导入 Kaggle 等外部数据集

**请求体：**

```json
{
  "records": [
    {
      "resumeId": "ext_001",
      "position": "Data Scientist",
      "company": "Google",
      "matchScore": 90
    }
  ]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `records` | array | ✅ | 匹配记录列表 |

**响应 `201`：**

```json
{
  "code": 201,
  "message": "导入成功",
  "data": { "imported": 100 }
}
```

---

## 八、🆕 学习资源模块（Learning Resources）⏳ 待测试

> 个性化学习资源推荐与浏览

**基础路径：** `/api/v1/learning-resources`
**认证：** 需 JWT

### GET `/learning-resources` — 浏览学习资源

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `page` | number | | 页码（默认 1） |
| `limit` | number | | 每页条数（默认 20） |
| `category` | string | | 分类筛选 |
| `keyword` | string | | 搜索关键词 |
| `difficulty` | string | | 难度筛选：`beginner` / `intermediate` / `advanced` |
| `type` | string | | 资源类型：`video` / `article` / `course` / `book` |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "lr_001",
        "title": "Spring Boot 实战教程",
        "type": "course",
        "category": "后端开发",
        "difficulty": "intermediate",
        "url": "https://example.com/spring-boot",
        "description": "从零开始学习 Spring Boot",
        "rating": 4.5
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 50
    }
  }
}
```

### GET `/learning-resources/categories` — 获取所有资源分类

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "name": "前端开发", "count": 25 },
    { "name": "后端开发", "count": 40 },
    { "name": "数据结构与算法", "count": 15 }
  ]
}
```

### GET `/learning-resources/:id` — 获取单个资源详情

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "lr_001",
    "title": "Spring Boot 实战教程",
    "type": "course",
    "category": "后端开发",
    "difficulty": "intermediate",
    "url": "https://example.com/spring-boot",
    "description": "从零开始学习 Spring Boot",
    "rating": 4.5,
    "tags": ["Java", "Spring", "微服务"],
    "duration": "12 小时"
  }
}
```

### POST `/learning-resources/recommendations` — AI 个性化资源推荐

**请求体：**

```json
{
  "skillGaps": ["Kubernetes", "Docker", "微服务架构"],
  "targetPosition": "高级后端开发工程师",
  "preferredType": "course",
  "limit": 5
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `skillGaps` | string[] | ✅ | 技能缺口列表 |
| `targetPosition` | string | ✅ | 目标岗位 |
| `preferredType` | string | | 偏好资源类型 |
| `limit` | number | | 返回数量（默认 5） |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "lr_002",
      "title": "Docker 与 Kubernetes 实战",
      "type": "course",
      "reason": "针对您缺少的容器化技能",
      "relevanceScore": 95
    }
  ]
}
```

---

## 九、🆕 面试题库模块（Question Bank）⏳ 待测试

> AI 驱动的面试题目生成与管理

**基础路径：** `/api/v1/question-bank`
**认证：** 需 JWT

### GET `/question-bank` — 浏览题库

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `page` | number | | 页码（默认 1） |
| `limit` | number | | 每页条数（默认 20） |
| `category` | string | | 分类筛选 |
| `difficulty` | string | | 难度：`easy` / `medium` / `hard` |
| `type` | string | | 题型：`choice` / `short_answer` / `coding` |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "qb_001",
        "question": "请解释 Java 中 HashMap 的工作原理",
        "type": "short_answer",
        "category": "Java 基础",
        "difficulty": "medium",
        "tags": ["集合", "哈希"]
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 200
    }
  }
}
```

### GET `/question-bank/categories` — 获取所有分类

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": [
    { "name": "Java 基础", "count": 50 },
    { "name": "Spring Boot", "count": 35 },
    { "name": "数据库", "count": 40 }
  ]
}
```

### GET `/question-bank/:id` — 获取题目详情

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "qb_001",
    "question": "请解释 Java 中 HashMap 的工作原理",
    "type": "short_answer",
    "category": "Java 基础",
    "difficulty": "medium",
    "tags": ["集合", "哈希"],
    "answer": "HashMap 基于数组+链表+红黑树实现...",
    "hint": "从 put() 方法入手"
  }
}
```

### POST `/question-bank/generate` — AI 生成面试题目

**请求体：**

```json
{
  "position": "后端开发工程师",
  "skills": ["Java", "Spring Boot", "MySQL"],
  "difficulty": "medium",
  "count": 5,
  "types": ["short_answer", "coding"]
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `position` | string | ✅ | 目标岗位 |
| `skills` | string[] | ✅ | 技能列表 |
| `difficulty` | string | | 难度（默认 `medium`） |
| `count` | number | | 生成数量（默认 5，最大 20） |
| `types` | string[] | | 题型列表 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "questions": [
      {
        "question": "Spring Boot 中如何实现全局异常处理？",
        "type": "short_answer",
        "difficulty": "medium",
        "category": "Spring Boot",
        "answer": "使用 @ControllerAdvice 注解..."
      }
    ]
  }
}
```

---

## 十、🆕 语音面试模块（Voice Interview）⏳ 待测试

> 模拟语音面试会话管理

**基础路径：** `/api/v1/voice-interviews`
**认证：** 需 JWT

### POST `/voice-interviews` — 创建语音面试会话

**请求体：**

```json
{
  "position": "后端开发工程师",
  "difficulty": "medium",
  "duration": 30
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `position` | string | ✅ | 面试岗位 |
| `difficulty` | string | | 难度（默认 `medium`） |
| `duration` | number | | 预计时长（分钟，默认 30） |

**响应 `201`：**

```json
{
  "code": 201,
  "message": "创建成功",
  "data": {
    "id": "vi_001",
    "position": "后端开发工程师",
    "status": "in_progress",
    "startedAt": "2026-06-27T10:00:00Z"
  }
}
```

### GET `/voice-interviews` — 获取语音面试历史

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `page` | number | | 页码（默认 1） |
| `limit` | number | | 每页条数（默认 20） |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "vi_001",
        "position": "后端开发工程师",
        "status": "completed",
        "score": 85,
        "duration": 25,
        "createdAt": "2026-06-27T10:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 5
    }
  }
}
```

### GET `/voice-interviews/:id` — 获取语音面试详情

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": "vi_001",
    "position": "后端开发工程师",
    "status": "in_progress",
    "questions": ["请介绍您的项目经验", "Java 中 HashMap 的原理是什么？"],
    "answers": ["...", "..."],
    "startedAt": "2026-06-27T10:00:00Z"
  }
}
```

### GET `/voice-interviews/:id/summary` — 获取 AI 生成面试摘要

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "overallScore": 82,
    "strengths": ["技术基础扎实", "表达清晰"],
    "weaknesses": ["项目经验描述不够具体"],
    "recommendation": "建议补充分布式系统相关知识",
    "transcript": "面试完整转录文本..."
  }
}
```

### PATCH `/voice-interviews/:id/toggle-pause` — 暂停/恢复面试

**响应 `200`：**

```json
{
  "code": 200,
  "message": "已暂停"
}
```

### POST `/voice-interviews/:id/transcript` — 保存转录内容

**请求体：**

```json
{
  "content": "面试音频转录文本...",
  "timestamp": "00:05:30"
}
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `content` | string | ✅ | 转录文本 |
| `timestamp` | string | | 时间戳标记 |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "保存成功"
}
```

### POST `/voice-interviews/:id/complete` — 结束语音面试

**响应 `200`：**

```json
{
  "code": 200,
  "message": "面试已结束",
  "data": {
    "summary": {
      "score": 85,
      "duration": 28,
      "questionCount": 8
    }
  }
}
```

### DELETE `/voice-interviews/:id` — 删除语音面试记录

**响应 `200`：**

```json
{
  "code": 200,
  "message": "删除成功"
}
```

---

## 十一、🆕 管理员模块（Admin）⏳ 待测试

> 管理员后台管理功能

**基础路径：** `/api/v1/admin`
**认证：** 需 JWT + `admin` 角色

### 用户管理

#### GET `/admin/users` — 获取用户列表

**查询参数：**

| 参数 | 类型 | 必填 | 说明 |
|------|------|:----:|------|
| `page` | number | | 页码（默认 1） |
| `limit` | number | | 每页条数（默认 20） |
| `keyword` | string | | 搜索关键词（用户名/邮箱） |

**响应 `200`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "list": [
      {
        "id": "user_001",
        "username": "zhangsan",
        "email": "zhangsan@example.com",
        "role": "user",
        "status": "active",
        "createdAt": "2026-06-01T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100
    }
  }
}
```

#### GET `/admin/users/:id` — 获取用户详情

#### PATCH `/admin/users/:id` — 修改用户信息

**请求体：**

```json
{
  "username": "新用户名",
  "email": "new@example.com",
  "role": "admin",
  "status": "disabled"
}
```

#### DELETE `/admin/users/:id` — 删除用户

#### POST `/admin/users/:id/reset-password` — 重置用户密码

**请求体：**

```json
{
  "password": "newPassword123"
}
```

### 简历管理

#### GET `/admin/resumes` — 获取跨用户简历列表

#### GET `/admin/resumes/:id` — 获取任意简历详情

#### DELETE `/admin/resumes/:id` — 删除任意简历

### 面试管理

#### GET `/admin/interviews` — 获取跨用户面试列表

#### GET `/admin/interviews/:id` — 获取面试详情（含消息）

#### DELETE `/admin/interviews/:id` — 删除任意面试

### 职业规划管理

#### GET `/admin/career-plans` — 获取跨用户职业规划列表

#### GET `/admin/career-plans/:id` — 获取职业规划详情

#### DELETE `/admin/career-plans/:id` — 删除任意职业规划

---

## 十二、🆕 简历 NER 模块（Resume NER）⏳ 待测试

> 命名实体识别微服务（内部服务，无 REST 端点）

简历 NER 模块是一个**无控制器的全局服务模块**，作为 Python NER 微服务的客户端，提供以下方法：

| 方法 | 用途 | 调用后端 |
|------|------|---------|
| `extractEntities(text)` | 提取命名实体（人名、技能、学历等） | `POST {ner_api_url}`（mode=full） |
| `extractStructured(text)` | 提取结构化简历信息 | `POST {ner_api_url}`（mode=structured） |
| `healthCheck()` | 检查 NER 服务健康状态 | `GET {ner_api_url}/health` |

- Python NER 服务默认地址：`http://localhost:8001`（可通过环境变量 `NER_API_URL` 配置）
- NER 服务故障时自动降级，不影响主业务流程
- 采用 BIO 字典匹配 + 规则引擎的中文简历实体识别方案

---

## 十三、接口与页面映射对照表

| 前端页面 | 路由 | 对应 API |
|----------|------|----------|
| 登录页 | `/login` | `POST /auth/login`、`POST /auth/register` |
| 首页仪表盘 | `/` | `GET /dashboard` |
| 简历列表 | `/resume` | `GET /resumes` |
| 简历详情 | `/resume/:id` | `GET /resumes/:id`、`PUT /resumes/:id`、`DELETE /resumes/:id` |
| 简历上传 | `/resume/upload` | `POST /resumes/upload` |
| 简历改写 | `/resume/:id/rewrite` | `POST /resumes/:id/rewrite-suggestions`、`POST /resumes/:id/rewrite-section` |
| 面试准备 | `/interview` | `POST /interviews` |
| 面试中 | `/interview/:id` | `WS /ws/interview/:id`、`POST /interviews/:id/answer` |
| 面试报告 | `/interview/:id/report` | `GET /interviews/:id/messages`、`POST /interviews/:id/feedback` |
| 面试历史 | `/history` | `GET /interviews` |
| 职业规划 | `/career-plan` | `POST /career/plan`、`GET /career/plans` |
| 规划详情 | `/career-plan/:id` | `GET /career/plans/:id` |
| 个人中心 | `/profile` | `GET /auth/profile`、`PATCH /auth/profile` |
| 市场洞察 | `/market-insight` | `GET /career/market-insight` |
| 岗位推荐 | `/job-matching` | `GET /job-matching/recommendations` |
| 岗位匹配管理 | `/job-matching/matches` | `GET /job-matching/matches`、`PATCH /job-matching/matches/:id/status` |
| 学习资源 | `/resources` | `GET /learning-resources`、`POST /learning-resources/recommendations` |
| 面试题库 | `/question-bank` | `GET /question-bank`、`GET /question-bank/:id`、`POST /question-bank/generate` |
| 语音面试 | `/voice-interview` | `POST /voice-interviews`、`GET /voice-interviews`、`GET /voice-interviews/:id/summary` |
| 管理员 | `/admin` | `GET /admin/users`、`GET /admin/resumes`、`GET /admin/interviews`、`GET /admin/career-plans` |

---

## 十四、TS 类型定义（前后端共享）

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

// 岗位匹配
interface JobRecommendation {
  id: string;
  position: string;
  company: string;
  location: string;
  matchScore: number;
  reason: string;
  skills: string[];
  url?: string;
}

interface JobMatch {
  id: string;
  position: string;
  company: string;
  status: 'saved' | 'applied' | 'interviewing' | 'offered' | 'rejected';
  matchScore: number;
  notes?: string;
  createdAt: string;
}

interface MatchAnalysis {
  overallScore: number;
  skillMatch: { matched: string[]; missing: string[]; score: number };
  experienceMatch: { requiredYears: number; actualYears: number; score: number };
  suggestions: string[];
}

// 学习资源
interface LearningResource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'course' | 'book';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  url: string;
  description: string;
  rating: number;
  tags?: string[];
  duration?: string;
}

// 面试题库
interface QuestionBankItem {
  id: string;
  question: string;
  type: 'choice' | 'short_answer' | 'coding';
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  answer?: string;
  hint?: string;
}

// 语音面试
interface VoiceInterview {
  id: string;
  position: string;
  status: 'in_progress' | 'completed';
  score?: number;
  duration?: number;
  questions: string[];
  answers: string[];
  startedAt: string;
  completedAt?: string;
}

interface VoiceInterviewSummary {
  overallScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
  transcript: string;
}

// 简历 NER
interface NerEntityResult {
  entities: Array<{ text: string; type: string; start: number; end: number }>;
}

interface NerStructuredResult {
  name?: string;
  phone?: string;
  email?: string;
  skills: string[];
  education: Array<{ school: string; degree: string; major: string; period: string }>;
  experience: Array<{ company: string; position: string; period: string; description: string }>;
}

// AI 筛选评估
interface ScreeningResult {
  overallScore: number;
  dimensions: {
    skillsMatch: number;
    experience: number;
    education: number;
    keywordCoverage: number;
    formatQuality: number;
  };
  recommendation: 'recommend' | 'pending' | 'reject';
  summary: string;
}

// 管理员
interface AdminUser {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  status: 'active' | 'disabled';
  createdAt: string;
  lastLoginAt?: string;
}

// 分页
interface PaginatedResult<T> {
  list: T[];
  pagination: { page: number; pageSize: number; total: number };
}