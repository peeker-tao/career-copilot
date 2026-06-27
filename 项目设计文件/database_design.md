# Career-Copilot 数据库设计文档

> 版本：v1.1 | 日期：2026-06-28
> 数据库：PostgreSQL 15+ | 缓存：Redis 7+
> 状态：✅ 已实现 ⏳ 待测试 | 🆕 v1.1 新增

---

## 一、ER 图

```mermaid
erDiagram
    users ||--o{ resumes : "拥有"
    users ||--o{ interviews : "发起"
    users ||--o{ career_plans : "拥有"
    users ||--o{ job_matches : "拥有"
    users ||--o{ voice_interview_sessions : "发起"
    users ||--o{ resume_bookmarks : "收藏"
    users ||--o{ password_reset_tokens : "重置令牌"
    interviews ||--o{ interview_messages : "包含"
    interviews }o--|| resumes : "关联"
    resumes ||--o{ resume_bookmarks : "被收藏"
    resumes ||--o{ resume_ner_cache : "NER 缓存"

    users {
        string id PK "CUID 主键"
        string email UK "邮箱（唯一）"
        string passwordHash "bcrypt 加密"
        string name "昵称"
        string avatar "头像（可空）"
        string education "教育背景（可空）"
        string targetPosition "目标岗位（可空）"
        string role "user | admin"
        json modelConfig "LLM 配置（可空）"
        datetime createdAt "注册时间"
        datetime updatedAt "更新时间"
    }

    resumes {
        string id PK "CUID 主键"
        string userId FK "所属用户"
        string title "简历名称"
        string fileUrl "文件地址（可空）"
        json parsedData "LLM 解析数据"
        string[] skills "技能标签"
        json suggestions "优化建议（可空）"
        json evaluations "六维评分（可空）"
        string status "parsing/completed/failed"
        datetime createdAt "上传时间"
        datetime updatedAt "更新时间"
    }

    interviews {
        string id PK "CUID 主键"
        string userId FK "面试者"
        string resumeId FK "关联简历（可空）"
        string targetPosition "目标岗位"
        string difficulty "easy/medium/hard"
        string status "in_progress/completed"
        int questionCount "题目总数"
        int score "综合得分（可空）"
        datetime startedAt "开始时间"
        datetime completedAt "结束时间（可空）"
        json overallFeedback "综合反馈（可空）"
    }

    interview_messages {
        string id PK "CUID 主键"
        string interviewId FK "所属面试"
        string role "ai | user"
        text content "消息内容"
        string questionType "technical/behavioral/project（可空）"
        string feedback "AI 反馈（可空）"
        datetime createdAt "发送时间"
    }

    career_plans {
        string id PK "CUID 主键"
        string userId FK "所属用户"
        string targetPosition "目标岗位"
        string[] currentSkills "当前技能"
        string[] gapSkills "技能差距"
        json roadmap "学习路线"
        json marketInsight "市场数据（可空）"
        int progress "总进度 0-100"
        datetime createdAt "创建时间"
        datetime updatedAt "更新时间"
    }

    job_matches {
        string id PK "CUID 主键"
        string userId FK "所属用户"
        string position "岗位名称"
        string company "公司（可空）"
        string location "地点（可空）"
        string salaryRange "薪资范围（可空）"
        string description "岗位描述（可空）"
        json requirements "岗位要求（可空）"
        float matchScore "匹配度 0-100"
        json matchDetails "匹配详情（可空）"
        string status "pending/saved/applied/archived"
        string source "来源（可空）"
        string applyUrl "投递链接（可空）"
        datetime createdAt "创建时间"
        datetime updatedAt "更新时间"
    }

    learning_resources {
        string id PK "CUID 主键"
        string title "资源标题"
        string url "资源链接"
        string type "course/article/video/book/documentation"
        string category "技能分类"
        string[] tags "标签"
        string description "描述（可空）"
        string provider "平台（可空）"
        string difficulty "beginner/intermediate/advanced"
        string duration "学习时长（可空）"
        float rating "评分（可空）"
        float relevanceScore "推荐相关度（可空）"
        boolean aiGenerated "AI 生成（可空）"
        int usageCount "使用次数"
        datetime createdAt "创建时间"
        datetime updatedAt "更新时间"
    }

    question_bank {
        string id PK "CUID 主键"
        string category "分类"
        string type "choice/short_answer/coding/behavioral"
        string difficulty "easy/medium/hard"
        string title "题目标题"
        json content "题目内容（含选项、答案、解析）"
        string[] tags "标签"
        string source "来源（可空）"
        int usageCount "使用次数"
        datetime createdAt "创建时间"
        datetime updatedAt "更新时间"
    }

    voice_interview_sessions {
        string id PK "CUID 主键"
        string userId FK "所属用户"
        string interviewId "关联面试（可空）"
        string targetPosition "目标岗位"
        string difficulty "easy/medium/hard"
        string resumeId "关联简历（可空）"
        string status "recording/paused/completed/cancelled"
        string audioUrl "音频地址（可空）"
        int durationSeconds "持续时间"
        json transcript "对话转录"
        datetime startedAt "开始时间"
        datetime completedAt "结束时间（可空）"
        datetime createdAt "创建时间"
        datetime updatedAt "更新时间"
    }

    resume_bookmarks {
        string id PK "CUID 主键"
        string userId FK "所属用户"
        string resumeId FK "被收藏简历"
        string notes "备注（可空）"
        datetime createdAt "创建时间"
    }

    password_reset_tokens {
        string id PK "CUID 主键"
        string userId FK "所属用户"
        string token UK "重置令牌"
        datetime expiresAt "过期时间"
        boolean used "是否已使用"
        datetime createdAt "创建时间"
    }
```

---

## 二、表结构详解

### 2.1 User（用户表）

用户账号与个人信息存储。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 用户唯一标识（CUID） |
| `email` | `VARCHAR(255)` | **UNIQUE**, NOT NULL | 登录邮箱 |
| `password_hash` | `TEXT` | NOT NULL | bcrypt 加密后的密码 |
| `name` | `VARCHAR(50)` | NOT NULL | 昵称，2-20 字符 |
| `avatar` | `TEXT` | nullable | 头像 URL |
| `education` | `TEXT` | nullable | 教育背景，如"华中科技大学 软件工程 2024级" |
| `target_position` | `VARCHAR(100)` | nullable | 目标岗位，如"后端开发工程师" |
| `role` | `VARCHAR(20)` | NOT NULL, DEFAULT `'user'` | 角色：`user` / `admin` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 注册时间 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 最后更新时间 |

**索引：**

- 主键：`id`
- 唯一索引：`email`

---

### 2.2 Resume（简历表）

用户上传的简历文件及其 LLM 解析结果。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 简历唯一标识（CUID） |
| `user_id` | `VARCHAR(30)` | **FK → users.id**, NOT NULL | 所属用户 |
| `title` | `VARCHAR(255)` | NOT NULL | 简历名称，如"小明_后端简历.pdf" |
| `file_url` | `TEXT` | nullable | 原始文件存储地址（OSS/本地） |
| `parsed_data` | `JSONB` | nullable | LLM 提取的结构化数据（见下方 JSON 结构） |
| `skills` | `TEXT[]` | NOT NULL, DEFAULT `'{}'` | 技能标签数组，如 `{"Java","Spring Boot","MySQL"}` |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'parsing'` | 解析状态：`parsing` / `completed` / `failed` |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 上传时间 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 最后更新时间 |

**索引：**

- 主键：`id`
- 外键：`userId` → User.id
- 复合索引：`(userId, createdAt)` — 按用户查询简历列表

**`parsedData` JSON 结构：**

```json
{
  "basicInfo": {
    "name": "小明",
    "phone": "138****1234",
    "email": "xiaoming@example.com"
  },
  "education": [
    { "school": "华中科技大学", "major": "软件工程", "degree": "本科", "period": "2022-2026" }
  ],
  "experience": [
    { "company": "XX科技", "position": "后端开发实习生", "period": "2025.06-2025.09", "description": "负责后端 API 开发" }
  ],
  "skills": ["Java", "Spring Boot", "MySQL", "Redis", "Git", "Docker"],
  "projects": [
    { "name": "在线商城系统", "role": "后端开发", "techStack": ["Spring Boot", "MySQL"], "description": "..." }
  ]
}
```

---

### 2.3 Interview（面试会话表）

AI 模拟面试的会话记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 面试会话唯一标识（CUID） |
| `user_id` | `VARCHAR(30)` | **FK → users.id**, NOT NULL | 面试者 |
| `resume_id` | `VARCHAR(30)` | **FK → resumes.id**, nullable | 关联的简历（用于基于简历出题） |
| `target_position` | `VARCHAR(100)` | NOT NULL | 目标岗位，如"后端开发工程师" |
| `difficulty` | `VARCHAR(10)` | NOT NULL, DEFAULT `'medium'` | 难度：`easy` / `medium` / `hard` |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'in_progress'` | 状态：`in_progress` / `completed` |
| `question_count` | `INTEGER` | NOT NULL, DEFAULT `0` | 已出题总数 |
| `score` | `INTEGER` | nullable | 综合评分（百分制） |
| `started_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 面试开始时间 |
| `completed_at` | `TIMESTAMPTZ` | nullable | 面试结束时间 |
| `overall_feedback` | `JSONB` | nullable | 综合反馈 JSON |

**索引：**

- 主键：`id`
- 外键：`userId` → User.id
- 外键：`resumeId` → Resume.id
- 复合索引：`(userId, status, createdAt)` — 按用户和状态查询面试列表
- 索引：`(targetPosition)` — 按岗位筛选

**`overallFeedback` JSON 结构：**

```json
{
  "overallScore": 78,
  "dimensions": {
    "professionalSkill": { "score": 80, "comment": "专业技能扎实" },
    "communication": { "score": 75, "comment": "表达较清晰" },
    "logicalThinking": { "score": 82, "comment": "逻辑思维能力强" },
    "projectExperience": { "score": 70, "comment": "项目介绍缺乏亮点" }
  },
  "strengths": ["Java 基础扎实", "逻辑清晰"],
  "weaknesses": ["分布式经验不足", "项目深度不够"],
  "improvementSuggestions": [
    { "item": "深入学习 Redis", "priority": "high", "resources": ["《Redis 设计与实现》"] }
  ],
  "answerDetails": [
    { "question": "HashMap 实现原理", "score": 4, "comment": "底层结构答得好" }
  ]
}
```

---

### 2.4 InterviewMessage（面试消息表）

面试过程中的逐条对话记录。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 消息唯一标识（CUID） |
| `interview_id` | `VARCHAR(30)` | **FK → interviews.id**, NOT NULL | 所属面试会话 |
| `role` | `VARCHAR(10)` | NOT NULL | 角色：`ai` / `user` |
| `content` | `TEXT` | NOT NULL | 消息正文 |
| `question_type` | `VARCHAR(20)` | nullable | 题目类型：`technical` / `behavioral` / `project`（仅 ai 消息有效） |
| `feedback` | `TEXT` | nullable | AI 对用户回答的即时评分与反馈（仅 ai 消息有效） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 发送时间 |

**索引：**

- 主键：`id`
- 外键：`interviewId` → Interview.id
- 复合索引：`(interviewId, createdAt)` — 按会话查询消息列表（正序）

---

### 2.5 CareerPlan（职业规划表）

AI 生成的个性化职业发展路径。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 规划唯一标识（CUID） |
| `user_id` | `VARCHAR(30)` | **FK → users.id**, NOT NULL | 所属用户 |
| `target_position` | `VARCHAR(100)` | NOT NULL | 目标岗位 |
| `current_skills` | `TEXT[]` | NOT NULL, DEFAULT `'{}'` | 当前具备的技能 |
| `gap_skills` | `TEXT[]` | NOT NULL, DEFAULT `'{}'` | 与目标岗位之间的技能差距 |
| `roadmap` | `JSONB` | NOT NULL | 分阶段学习路线（见下方 JSON 结构） |
| `market_insight` | `JSONB` | nullable | 市场数据洞察 |
| `progress` | `INTEGER` | NOT NULL, DEFAULT `0` | 总完成进度（0-100） |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 最后更新时间 |

**索引：**

- 主键：`id`
- 外键：`userId` → User.id
- 复合索引：`(userId, createdAt)` — 按用户查询规划列表

**`roadmap` JSON 结构：**

```json
[
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
    "goal": "掌握 Redis、消息队列等常用中间件",
    "skills": ["Redis", "RabbitMQ", "Elasticsearch"],
    "resources": [],
    "estimatedWeeks": 3
  }
]
```

**`marketInsight` JSON 结构：**

```json
{
  "averageSalary": "15K-30K",
  "demandTrend": "持续增长",
  "topSkills": ["Java", "Spring Boot", "MySQL", "Redis", "微服务"],
  "experienceDistribution": {
    "应届": "20%",
    "1-3年": "35%",
    "3-5年": "30%",
    "5年以上": "15%"
  }
}
```

---

### 2.6 JobMatch（岗位匹配表）🆕 v1.1

AI 推荐的岗位匹配记录，供用户查看与目标岗位的匹配度。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 唯一标识（CUID） |
| `user_id` | `VARCHAR(30)` | **FK → users.id**, NOT NULL | 所属用户 |
| `position` | `VARCHAR(100)` | NOT NULL | 岗位名称 |
| `company` | `VARCHAR(100)` | nullable | 公司名称 |
| `location` | `VARCHAR(100)` | nullable | 工作地点 |
| `salary_range` | `VARCHAR(50)` | nullable | 薪资范围 |
| `description` | `TEXT` | nullable | 岗位描述 |
| `requirements` | `JSONB` | nullable | 岗位要求列表 |
| `match_score` | `FLOAT` | NOT NULL | 匹配度（0-100） |
| `match_details` | `JSONB` | nullable | 匹配详情 |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'pending'` | 状态：`pending` / `saved` / `applied` / `archived` |
| `source` | `VARCHAR(30)` | nullable | 来源：`ai_recommended` / `manual` / `external` |
| `apply_url` | `TEXT` | nullable | 投递链接 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 更新时间 |

**索引：**
- 主键：`id`
- 外键：`userId` → User.id
- 复合索引：`(userId, status)` — 按用户和状态查询岗位列表
- 索引：`(position)` — 按岗位筛选

**`matchDetails` JSON 结构：**
```json
{
  "matchedSkills": ["Java", "Spring Boot", "MySQL"],
  "missingSkills": ["微服务", "Redis", "消息队列"],
  "suggestions": [
    { "skill": "微服务架构", "priority": "high", "resource": "Spring Cloud 官方文档" }
  ]
}
```

---

### 2.7 LearningResource（学习资源表）🆕 v1.1

全局共享的学习资源库，支持 AI 推荐与手动录入。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 唯一标识（CUID） |
| `title` | `VARCHAR(255)` | NOT NULL | 资源标题 |
| `url` | `TEXT` | NOT NULL | 资源链接 |
| `type` | `VARCHAR(20)` | NOT NULL | 类型：`course` / `article` / `video` / `book` / `documentation` |
| `category` | `VARCHAR(50)` | NOT NULL | 技能分类 |
| `tags` | `TEXT[]` | NOT NULL, DEFAULT `'{}'` | 标签数组 |
| `description` | `TEXT` | nullable | 资源描述 |
| `provider` | `VARCHAR(100)` | nullable | 提供平台 |
| `difficulty` | `VARCHAR(20)` | NOT NULL, DEFAULT `'intermediate'` | 难度：`beginner` / `intermediate` / `advanced` |
| `duration` | `VARCHAR(50)` | nullable | 学习时长估计 |
| `rating` | `FLOAT` | nullable | 评分（0-5） |
| `relevance_score` | `FLOAT` | nullable | AI 推荐相关度 |
| `ai_generated` | `BOOLEAN` | NOT NULL, DEFAULT `false` | 是否 AI 生成 |
| `usage_count` | `INTEGER` | NOT NULL, DEFAULT `0` | 使用次数 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 更新时间 |

**索引：**
- 主键：`id`
- 复合索引：`(category, type)` — 按分类和类型查询
- GIN 索引：`tags`

---

### 2.8 QuestionBank（面试题库表）🆕 v1.1

全局面试题库，支持分类检索与 AI 生成题目。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 唯一标识（CUID） |
| `category` | `VARCHAR(50)` | NOT NULL | 分类：`java` / `python` / `frontend` / `system-design` / `behavioral` 等 |
| `type` | `VARCHAR(20)` | NOT NULL | 题型：`choice` / `short_answer` / `coding` / `behavioral` |
| `difficulty` | `VARCHAR(10)` | NOT NULL, DEFAULT `'medium'` | 难度：`easy` / `medium` / `hard` |
| `title` | `VARCHAR(255)` | NOT NULL | 题目标题 |
| `content` | `JSONB` | NOT NULL | 题目内容 |
| `tags` | `TEXT[]` | NOT NULL, DEFAULT `'{}'` | 标签数组 |
| `source` | `VARCHAR(20)` | nullable | 来源：`manual` / `ai_generated` / `crawled` |
| `usage_count` | `INTEGER` | NOT NULL, DEFAULT `0` | 使用次数 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 更新时间 |

**索引：**
- 主键：`id`
- 复合索引：`(category, difficulty)` — 按分类和难度筛选
- GIN 索引：`tags`

**`content` JSON 结构：**
```json
{
  "question": "ArrayList 和 LinkedList 的区别是什么？",
  "options": ["A. 线程安全", "B. 底层数据结构不同", "C. 允许空值"],
  "answer": "B",
  "explanation": "ArrayList 基于数组实现，LinkedList 基于双向链表实现..."
}
```

---

### 2.9 VoiceInterviewSession（语音面试会话表）🆕 v1.1

语音面试的会话记录，包含音频与转录信息。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 唯一标识（CUID） |
| `user_id` | `VARCHAR(30)` | **FK → users.id**, NOT NULL | 所属用户 |
| `interview_id` | `VARCHAR(30)` | nullable | 关联面试（用于回放分析） |
| `target_position` | `VARCHAR(100)` | NOT NULL | 目标岗位 |
| `difficulty` | `VARCHAR(10)` | NOT NULL, DEFAULT `'medium'` | 难度：`easy` / `medium` / `hard` |
| `resume_id` | `VARCHAR(30)` | nullable | 关联简历 |
| `status` | `VARCHAR(20)` | NOT NULL, DEFAULT `'recording'` | 状态：`recording` / `paused` / `completed` / `cancelled` |
| `audio_url` | `TEXT` | nullable | 音频文件地址 |
| `duration_seconds` | `INTEGER` | NOT NULL, DEFAULT `0` | 会话时长（秒） |
| `transcript` | `JSONB` | nullable | 对话转录 |
| `started_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 开始时间 |
| `completed_at` | `TIMESTAMPTZ` | nullable | 结束时间 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 创建时间 |
| `updated_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 更新时间 |

**索引：**
- 主键：`id`
- 外键：`userId` → User.id
- 复合索引：`(userId, status)` — 按用户和状态查询

**`transcript` JSON 结构：**
```json
[
  { "timestamp": "00:05", "speaker": "ai", "text": "请介绍一下你的项目经历" },
  { "timestamp": "00:12", "speaker": "user", "text": "我参与过一个电商平台项目..." }
]
```

---

### 2.10 ResumeBookmark（简历收藏表）🆕 v1.1

用户收藏他人/示例简历，用于参考学习。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 唯一标识（CUID） |
| `user_id` | `VARCHAR(30)` | **FK → users.id**, NOT NULL | 收藏用户 |
| `resume_id` | `VARCHAR(30)` | **FK → resumes.id**, NOT NULL | 被收藏简历 |
| `notes` | `TEXT` | nullable | 收藏备注 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 收藏时间 |

**索引：**
- 主键：`id`
- 外键：`userId` → User.id
- 外键：`resumeId` → Resume.id
- 唯一约束：`(userId, resumeId)` — 防止重复收藏

---

### 2.11 PasswordResetToken（密码重置令牌表）🆕 v1.1

用户密码重置的临时令牌存储。

| 字段 | 类型 | 约束 | 说明 |
|------|------|:----:|------|
| `id` | `VARCHAR(30)` | **PRIMARY KEY** | 唯一标识（CUID） |
| `user_id` | `VARCHAR(30)` | **FK → users.id**, NOT NULL | 所属用户 |
| `token` | `VARCHAR(255)` | **UNIQUE**, NOT NULL | 重置令牌 |
| `expires_at` | `TIMESTAMPTZ` | NOT NULL | 过期时间 |
| `used` | `BOOLEAN` | NOT NULL, DEFAULT `false` | 是否已使用 |
| `created_at` | `TIMESTAMPTZ` | NOT NULL, DEFAULT `now()` | 创建时间 |

**索引：**
- 主键：`id`
- 唯一索引：`token`
- 索引：`userId`

---

## 三、表关系总览

| 关系 | 类型 | 说明 |
|------|:----:|------|
| `users` → `resumes` | 1:N | 一个用户可上传多份简历 |
| `users` → `interviews` | 1:N | 一个用户可进行多次面试 |
| `users` → `career_plans` | 1:N | 一个用户可拥有多个职业规划 |
| `users` → `job_matches` 🆕 | 1:N | 一个用户可拥有多个岗位匹配推荐 |
| `users` → `voice_interview_sessions` 🆕 | 1:N | 一个用户可发起多次语音面试 |
| `users` → `resume_bookmarks` 🆕 | 1:N | 一个用户可收藏多份简历 |
| `users` → `password_reset_tokens` 🆕 | 1:N | 一个用户可拥有多个重置令牌 |
| `interviews` → `interview_messages` | 1:N | 一次面试包含多条对话消息 |
| `interviews` → `resumes` | N:1 | 一次面试可选关联一份简历 |
| `resumes` → `resume_bookmarks` 🆕 | 1:N | 一份简历可被多个用户收藏 |

**外键约束（DDL 中已定义，此处汇总）：**

| 外键 | 来源表 | 引用表 | 删除策略 |
|------|--------|--------|:--------:|
| `resumes.user_id` → `users.id` | `resumes` | `users` | CASCADE |
| `interviews.user_id` → `users.id` | `interviews` | `users` | CASCADE |
| `interviews.resume_id` → `resumes.id` | `interviews` | `resumes` | SET NULL |
| `interview_messages.interview_id` → `interviews.id` | `interview_messages` | `interviews` | CASCADE |
| `career_plans.user_id` → `users.id` | `career_plans` | `users` | CASCADE |

---

## 四、SQL DDL 完整脚本

以下为完整的 PostgreSQL DDL 建表脚本，可直接在 PostgreSQL 15+ 中执行。

```sql
-- ============================================================
-- Career-Copilot 数据库建表脚本
-- 数据库：PostgreSQL 15+
-- 日期：2026-06-13
-- ============================================================

-- 启用 UUID 扩展（如需使用 UUID 主键可改用此方案）
-- CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    email           VARCHAR(255)    NOT NULL UNIQUE,            -- 登录邮箱（唯一）
    password_hash   TEXT            NOT NULL,                   -- bcrypt 加密密码
    name            VARCHAR(50)     NOT NULL,                   -- 昵称
    avatar          TEXT,                                       -- 头像 URL
    education       TEXT,                                       -- 教育背景
    target_position VARCHAR(100),                               -- 目标岗位
    role            VARCHAR(20)     NOT NULL DEFAULT 'user',    -- user / admin
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),     -- 注册时间
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()      -- 更新时间
);

COMMENT ON TABLE users IS '用户账号与个人信息';
COMMENT ON COLUMN users.id IS '用户唯一标识（CUID）';
COMMENT ON COLUMN users.email IS '登录邮箱，全局唯一';
COMMENT ON COLUMN users.password_hash IS 'bcrypt 加密后的密码哈希值';
COMMENT ON COLUMN users.name IS '用户昵称，2-20 字符';
COMMENT ON COLUMN users.education IS '教育背景，如：华中科技大学 软件工程 2024级';
COMMENT ON COLUMN users.target_position IS '目标岗位，如：后端开发工程师';
COMMENT ON COLUMN users.role IS '用户角色：user（普通用户）/ admin（管理员）';

-- ============================================================
-- 2. 简历表
-- ============================================================
CREATE TABLE IF NOT EXISTS resumes (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    user_id         VARCHAR(30)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title           VARCHAR(255)    NOT NULL,                   -- 简历名称
    file_url        TEXT,                                       -- 原始文件地址
    parsed_data     JSONB,                                      -- LLM 解析后的结构化数据
    skills          TEXT[]          NOT NULL DEFAULT '{}',      -- 技能标签数组
    status          VARCHAR(20)     NOT NULL DEFAULT 'parsing', -- parsing / completed / failed
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),     -- 上传时间
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()      -- 更新时间
);

CREATE INDEX idx_resumes_user_id_created_at ON resumes(user_id, created_at DESC);

COMMENT ON TABLE resumes IS '用户上传的简历文件及其 LLM 解析结果';
COMMENT ON COLUMN resumes.user_id IS '所属用户 ID，外键 → users.id';
COMMENT ON COLUMN resumes.title IS '简历名称，如：小明_后端简历.pdf';
COMMENT ON COLUMN resumes.file_url IS '原始文件存储地址（OSS 或本地路径）';
COMMENT ON COLUMN resumes.parsed_data IS 'LLM 提取的结构化简历数据（JSONB）';
COMMENT ON COLUMN resumes.skills IS '提取的技能标签数组，如 {Java, Spring Boot, MySQL}';
COMMENT ON COLUMN resumes.status IS '解析状态：parsing（解析中）/ completed（完成）/ failed（失败）';

-- ============================================================
-- 3. 面试会话表
-- ============================================================
CREATE TABLE IF NOT EXISTS interviews (
    id               VARCHAR(30)     PRIMARY KEY,               -- CUID 主键
    user_id          VARCHAR(30)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id        VARCHAR(30)     REFERENCES resumes(id) ON DELETE SET NULL,
    target_position  VARCHAR(100)    NOT NULL,                  -- 目标岗位
    difficulty       VARCHAR(10)     NOT NULL DEFAULT 'medium', -- easy / medium / hard
    status           VARCHAR(20)     NOT NULL DEFAULT 'in_progress', -- in_progress / completed
    question_count   INTEGER         NOT NULL DEFAULT 0,        -- 已出题总数
    score            INTEGER,                                   -- 综合评分（百分制）
    started_at       TIMESTAMPTZ     NOT NULL DEFAULT now(),    -- 面试开始时间
    completed_at     TIMESTAMPTZ,                               -- 面试结束时间
    overall_feedback JSONB                                      -- 综合反馈 JSON
);

CREATE INDEX idx_interviews_user_id_status_created
    ON interviews(user_id, status, created_at DESC);
CREATE INDEX idx_interviews_target_position
    ON interviews(target_position);

COMMENT ON TABLE interviews IS 'AI 模拟面试的会话记录';
COMMENT ON COLUMN interviews.user_id IS '面试者 ID，外键 → users.id';
COMMENT ON COLUMN interviews.resume_id IS '关联简历 ID（可选，用于基于简历出题）';
COMMENT ON COLUMN interviews.target_position IS '目标岗位，如：后端开发工程师';
COMMENT ON COLUMN interviews.difficulty IS '面试难度：easy（简单）/ medium（中等）/ hard（困难）';
COMMENT ON COLUMN interviews.status IS '面试状态：in_progress（进行中）/ completed（已结束）';
COMMENT ON COLUMN interviews.question_count IS '本次面试已出题目总数';
COMMENT ON COLUMN interviews.score IS '综合评分，百分制';
COMMENT ON COLUMN interviews.overall_feedback IS '面试结束后 LLM 生成的综合反馈（JSONB）';

-- ============================================================
-- 4. 面试消息表
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_messages (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    interview_id    VARCHAR(30)     NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
    role            VARCHAR(10)     NOT NULL,                   -- ai / user
    content         TEXT            NOT NULL,                   -- 消息正文
    question_type   VARCHAR(20),                                -- technical / behavioral / project
    feedback        TEXT,                                       -- AI 即时评分与反馈
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()      -- 发送时间
);

CREATE INDEX idx_messages_interview_id_created
    ON interview_messages(interview_id, created_at ASC);

COMMENT ON TABLE interview_messages IS '面试过程中的逐条对话记录';
COMMENT ON COLUMN interview_messages.interview_id IS '所属面试会话 ID，外键 → interviews.id';
COMMENT ON COLUMN interview_messages.role IS '消息发送者：ai（面试官）/ user（用户）';
COMMENT ON COLUMN interview_messages.content IS '消息正文内容';
COMMENT ON COLUMN interview_messages.question_type IS '题目类型：technical（技术）/ behavioral（行为）/ project（项目）';
COMMENT ON COLUMN interview_messages.feedback IS 'AI 对用户回答的即时评分与反馈';

-- ============================================================
-- 5. 职业规划表
-- ============================================================
CREATE TABLE IF NOT EXISTS career_plans (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    user_id         VARCHAR(30)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_position VARCHAR(100)    NOT NULL,                   -- 目标岗位
    current_skills  TEXT[]          NOT NULL DEFAULT '{}',      -- 当前具备的技能
    gap_skills      TEXT[]          NOT NULL DEFAULT '{}',      -- 技能差距
    roadmap         JSONB           NOT NULL,                   -- 分阶段学习路线
    market_insight  JSONB,                                      -- 市场数据洞察
    progress        INTEGER         NOT NULL DEFAULT 0,         -- 总进度（0-100）
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),     -- 创建时间
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()      -- 更新时间
);

CREATE INDEX idx_career_plans_user_id_created
    ON career_plans(user_id, created_at DESC);

COMMENT ON TABLE career_plans IS 'AI 生成的个性化职业发展路径';
COMMENT ON COLUMN career_plans.user_id IS '所属用户 ID，外键 → users.id';
COMMENT ON COLUMN career_plans.target_position IS '目标岗位，如：后端开发工程师';
COMMENT ON COLUMN career_plans.current_skills IS '当前具备的技能数组';
COMMENT ON COLUMN career_plans.gap_skills IS '与目标岗位之间的技能差距';
COMMENT ON COLUMN career_plans.roadmap IS '分阶段学习路线（JSONB），包含阶段目标、学习资源、预估时间';
COMMENT ON COLUMN career_plans.market_insight IS '目标岗位的市场数据洞察（JSONB），包含薪资范围、需求趋势';
COMMENT ON COLUMN career_plans.progress IS '总完成进度百分比（0-100）';

-- ============================================================
-- 6. 岗位匹配表 🆕 v1.1
-- ============================================================
CREATE TABLE IF NOT EXISTS job_matches (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    user_id         VARCHAR(30)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    position        VARCHAR(100)    NOT NULL,                   -- 岗位名称
    company         VARCHAR(100),                               -- 公司名称
    location        VARCHAR(100),                               -- 工作地点
    salary_range    VARCHAR(50),                                -- 薪资范围
    description     TEXT,                                       -- 岗位描述
    requirements    JSONB,                                      -- 岗位要求列表
    match_score     DOUBLE PRECISION NOT NULL,                  -- 匹配度（0-100）
    match_details   JSONB,                                      -- 匹配详情
    status          VARCHAR(20)     NOT NULL DEFAULT 'pending', -- pending / saved / applied / archived
    source          VARCHAR(30),                                -- ai_recommended / manual / external
    apply_url       TEXT,                                       -- 投递链接
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_matches_user_id_status ON job_matches(user_id, status);
CREATE INDEX idx_job_matches_position ON job_matches(position);

COMMENT ON TABLE job_matches IS 'AI 推荐的岗位匹配记录';
COMMENT ON COLUMN job_matches.user_id IS '所属用户 ID，外键 → users.id';
COMMENT ON COLUMN job_matches.position IS '岗位名称，如：Java 后端开发工程师';
COMMENT ON COLUMN job_matches.match_score IS '与用户简历的匹配度，0-100';
COMMENT ON COLUMN job_matches.match_details IS '匹配详情（JSONB），包含匹配技能、缺失技能和改进建议';
COMMENT ON COLUMN job_matches.status IS '状态：pending（待处理）/ saved（已收藏）/ applied（已投递）/ archived（已归档）';
COMMENT ON COLUMN job_matches.source IS '来源：ai_recommended（AI 推荐）/ manual（手动添加）/ external（外部导入）';

-- ============================================================
-- 7. 学习资源表 🆕 v1.1
-- ============================================================
CREATE TABLE IF NOT EXISTS learning_resources (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    title           VARCHAR(255)    NOT NULL,                   -- 资源标题
    url             TEXT            NOT NULL,                   -- 资源链接
    type            VARCHAR(20)     NOT NULL,                   -- course / article / video / book / documentation
    category        VARCHAR(50)     NOT NULL,                   -- 技能分类
    tags            TEXT[]          NOT NULL DEFAULT '{}',      -- 标签数组
    description     TEXT,                                       -- 资源描述
    provider        VARCHAR(100),                               -- 提供平台
    difficulty      VARCHAR(20)     NOT NULL DEFAULT 'intermediate', -- beginner / intermediate / advanced
    duration        VARCHAR(50),                                -- 学习时长估计
    rating          DOUBLE PRECISION,                           -- 评分（0-5）
    relevance_score DOUBLE PRECISION,                           -- AI 推荐相关度
    ai_generated    BOOLEAN         NOT NULL DEFAULT false,     -- 是否 AI 生成
    usage_count     INTEGER         NOT NULL DEFAULT 0,         -- 使用次数
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_learning_resources_category_type ON learning_resources(category, type);
-- GIN 索引支持 tags 数组查询
CREATE INDEX idx_learning_resources_tags ON learning_resources USING GIN(tags);

COMMENT ON TABLE learning_resources IS '全局共享的学习资源库';
COMMENT ON COLUMN learning_resources.type IS '资源类型：course（课程）/ article（文章）/ video（视频）/ book（书籍）/ documentation（文档）';
COMMENT ON COLUMN learning_resources.category IS '技能分类，如：Java / Spring Boot / Redis';
COMMENT ON COLUMN learning_resources.difficulty IS '难度：beginner（初级）/ intermediate（中级）/ advanced（高级）';
COMMENT ON COLUMN learning_resources.ai_generated IS '是否由 AI 自动生成推荐';

-- ============================================================
-- 8. 面试题库表 🆕 v1.1
-- ============================================================
CREATE TABLE IF NOT EXISTS question_bank (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    category        VARCHAR(50)     NOT NULL,                   -- java / python / frontend / system-design / behavioral
    type            VARCHAR(20)     NOT NULL,                   -- choice / short_answer / coding / behavioral
    difficulty      VARCHAR(10)     NOT NULL DEFAULT 'medium',  -- easy / medium / hard
    title           VARCHAR(255)    NOT NULL,                   -- 题目标题
    content         JSONB           NOT NULL,                   -- 题目内容
    tags            TEXT[]          NOT NULL DEFAULT '{}',      -- 标签数组
    source          VARCHAR(20),                                -- manual / ai_generated / crawled
    usage_count     INTEGER         NOT NULL DEFAULT 0,         -- 使用次数
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_question_bank_category_difficulty ON question_bank(category, difficulty);
CREATE INDEX idx_question_bank_tags ON question_bank USING GIN(tags);

COMMENT ON TABLE question_bank IS '全局面试题库';
COMMENT ON COLUMN question_bank.category IS '题目分类，如：java / python / frontend / system-design / behavioral';
COMMENT ON COLUMN question_bank.type IS '题型：choice（选择题）/ short_answer（简答题）/ coding（编程题）/ behavioral（行为题）';
COMMENT ON COLUMN question_bank.content IS '题目内容（JSONB），包含题目、选项、答案和解析';
COMMENT ON COLUMN question_bank.source IS '来源：manual（手动录入）/ ai_generated（AI 生成）/ crawled（爬取）';

-- ============================================================
-- 9. 语音面试会话表 🆕 v1.1
-- ============================================================
CREATE TABLE IF NOT EXISTS voice_interview_sessions (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    user_id         VARCHAR(30)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    interview_id    VARCHAR(30)     REFERENCES interviews(id) ON DELETE SET NULL,
    target_position VARCHAR(100)    NOT NULL,                   -- 目标岗位
    difficulty      VARCHAR(10)     NOT NULL DEFAULT 'medium',  -- easy / medium / hard
    resume_id       VARCHAR(30),                                -- 关联简历 ID
    status          VARCHAR(20)     NOT NULL DEFAULT 'recording', -- recording / paused / completed / cancelled
    audio_url       TEXT,                                       -- 音频文件地址
    duration_seconds INTEGER       NOT NULL DEFAULT 0,          -- 会话时长（秒）
    transcript      JSONB,                                      -- 对话转录
    started_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),     -- 开始时间
    completed_at    TIMESTAMPTZ,                                -- 结束时间
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT now()
);

CREATE INDEX idx_voice_interview_user_id_status ON voice_interview_sessions(user_id, status);

COMMENT ON TABLE voice_interview_sessions IS '语音面试的会话记录';
COMMENT ON COLUMN voice_interview_sessions.user_id IS '所属用户 ID，外键 → users.id';
COMMENT ON COLUMN voice_interview_sessions.interview_id IS '关联的文本面试会话 ID（可选）';
COMMENT ON COLUMN voice_interview_sessions.status IS '状态：recording（录制中）/ paused（已暂停）/ completed（已完成）/ cancelled（已取消）';
COMMENT ON COLUMN voice_interview_sessions.transcript IS '对话转录文本（JSONB），包含时间戳、说话人和内容';

-- ============================================================
-- 10. 简历收藏表 🆕 v1.1
-- ============================================================
CREATE TABLE IF NOT EXISTS resume_bookmarks (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    user_id         VARCHAR(30)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    resume_id       VARCHAR(30)     NOT NULL REFERENCES resumes(id) ON DELETE CASCADE,
    notes           TEXT,                                       -- 收藏备注
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now(),     -- 收藏时间
    -- 唯一约束防止重复收藏
    CONSTRAINT uq_resume_bookmarks UNIQUE (user_id, resume_id)
);

COMMENT ON TABLE resume_bookmarks IS '用户收藏他人/示例简历';
COMMENT ON COLUMN resume_bookmarks.user_id IS '收藏用户 ID，外键 → users.id';
COMMENT ON COLUMN resume_bookmarks.resume_id IS '被收藏简历 ID，外键 → resumes.id';
COMMENT ON COLUMN resume_bookmarks.notes IS '收藏时的备注信息';

-- ============================================================
-- 11. 密码重置令牌表 🆕 v1.1
-- ============================================================
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id              VARCHAR(30)     PRIMARY KEY,                -- CUID 主键
    user_id         VARCHAR(30)     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(255)    NOT NULL UNIQUE,            -- 重置令牌
    expires_at      TIMESTAMPTZ     NOT NULL,                   -- 过期时间
    used            BOOLEAN         NOT NULL DEFAULT false,     -- 是否已使用
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT now()      -- 创建时间
);

CREATE INDEX idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);

COMMENT ON TABLE password_reset_tokens IS '密码重置的临时令牌存储';
COMMENT ON COLUMN password_reset_tokens.token IS '重置令牌，唯一标识';
COMMENT ON COLUMN password_reset_tokens.expires_at IS '令牌过期时间';
COMMENT ON COLUMN password_reset_tokens.used IS '是否已被使用';
```

---

## 五、Redis 数据结构设计

Redis 用于缓存、会话管理和消息队列，不替代 PostgreSQL 的持久化存储。

### 5.1 缓存 Key 命名规范

```
career-copilot:<模块>:<业务>:<ID>
```

### 5.2 缓存项

| Key | 类型 | TTL | 说明 |
|-----|:----:|:---:|------|
| `career-copilot:session:{interviewId}` | `String (JSON)` | 2h | 面试会话状态（当前题目、轮次等） |
| `career-copilot:token:access:{userId}` | `String` | 15min | Access Token 黑名单（登出时使用） |
| `career-copilot:token:refresh:{userId}` | `String` | 7d | Refresh Token 存储 |
| `career-copilot:rate-limit:{ip}` | `String (Int)` | 1min | 接口频率限制计数 |
| `career-copilot:market-insight:{position}` | `String (JSON)` | 1d | 市场数据缓存（减少 LLM 调用） |
| `career-copilot:job-match:{matchId}` 🆕 | `String (JSON)` | 1h | 岗位匹配详情缓存 |
| `career-copilot:voice-session:{sessionId}` 🆕 | `String (JSON)` | 2h | 语音面试会话状态缓存 |
| `career-copilot:question-bank:{category}` 🆕 | `String (JSON)` | 1h | 面试题库分类缓存 |
| `career-copilot:learning:{category}` 🆕 | `String (JSON)` | 1h | 学习资源分类缓存 |

### 5.3 面试会话缓存结构

```json
// Key: career-copilot:session:intv_xxx
{
  "interviewId": "intv_xxx",
  "userId": "clx...",
  "currentRound": 3,
  "maxRounds": 8,
  "difficulty": "medium",
  "targetPosition": "后端开发工程师",
  "context": [
    { "role": "ai", "content": "请介绍一下 HashMap 的实现原理？" },
    { "role": "user", "content": "HashMap 底层是..." },
    { "role": "ai", "content": "回答得不错，那负载因子呢？" }
  ],
  "scores": [4, 5],
  "status": "in_progress"
}
```

> 面试结束后，将完整数据写入 PostgreSQL，Redis 缓存即可释放。

### 5.4 Bull 消息队列

| Queue | 说明 | Consumer |
|-------|------|----------|
| `resume-parser` | 简历异步解析任务 | Resume Module |
| `feedback-generator` | 面试反馈生成任务 | Interview Module |
| `job-matching` 🆕 | 岗位匹配分析任务 | JobMatching Module |
| `voice-interview` 🆕 | 语音面试转录与评估任务 | VoiceInterview Module |
| `screening` 🆕 | AI 简历筛选分析任务 | AI Module |
| `learning-recommend` 🆕 | 学习资源推荐生成任务 | LearningResources Module |

---

## 六、数据库初始化与种子数据

### 6.1 执行 DDL 建表（首次部署）

```bash
# 方式一：使用 psql 直接执行 DDL 脚本
psql -h localhost -U app -d career_copilot -f backend/scripts/init.sql

# 方式二：从 Docker 容器内执行
docker exec -i career-copilot-postgres-1 psql -U app -d career_copilot < backend/scripts/init.sql

# 方式三：如果使用 pgAdmin / DBeaver 等 GUI 工具，
# 直接打开 backend/scripts/init.sql 并执行全部内容
```

### 6.2 推荐 SQL 脚本目录结构

```
backend/
├── scripts/
│   ├── init.sql           # DDL 建表脚本（可 Docker 自动执行）
│   ├── seed.sql           # 种子数据脚本（可选）
│   ├── migrate_v1.1.sql   # 后续版本迁移脚本
│   └── rollback_v1.1.sql  # 回滚脚本
├── docker-compose.yml
└── ...
```

### 6.2 初始化种子数据（可选）

创建 `backend/scripts/seed.sql` 用于开发和测试：

```sql
-- ============================================================
-- 种子数据脚本
-- 使用方式: psql -d career_copilot -f seed.sql
-- ============================================================

-- 插入演示用户（密码: abc123456, bcrypt 哈希值）
INSERT INTO users (id, email, password_hash, name, role)
VALUES (
    'clx_demo_user_001',
    'demo@career-copilot.com',
    '$2b$10$8K1p/a0dL1LXMIgoEDFrwOfMQkfAjkMBcGmE0Fy5XDZcXKIQBMEqy',
    '演示用户',
    'user'
) ON CONFLICT (email) DO NOTHING;

-- 插入演示简历
INSERT INTO resumes (id, user_id, title, status, skills, parsed_data)
VALUES (
    'clx_demo_resume_001',
    'clx_demo_user_001',
    '演示用户_后端简历.pdf',
    'completed',
    ARRAY['Java', 'Spring Boot', 'MySQL', 'Redis', 'Git'],
    '{
        "basicInfo": {
            "name": "演示用户",
            "phone": "138****8888",
            "email": "demo@career-copilot.com"
        },
        "education": [
            {"school": "华中科技大学", "major": "软件工程", "degree": "本科", "period": "2022-2026"}
        ],
        "skills": ["Java", "Spring Boot", "MySQL", "Redis", "Git"],
        "projects": [
            {"name": "在线商城系统", "role": "后端开发", "techStack": ["Spring Boot", "MySQL"]}
        ]
    }'::jsonb
) ON CONFLICT (id) DO NOTHING;
```

```bash
# 方式一：直接使用 psql 导入
psql -h localhost -U app -d career_copilot -f backend/scripts/seed.sql

# 方式二：如果使用 Docker
docker exec -i career-copilot-postgres-1 psql -U app -d career_copilot < backend/scripts/seed.sql
```

---

## 七、Docker Compose 配置

```yaml
# backend/docker-compose.yml
version: "3.8"

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: career_copilot
      POSTGRES_USER: app
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      # 首次启动自动执行初始化建表脚本
      - ./scripts/init.sql:/docker-entrypoint-initdb.d/01-init.sql
      # 可选的种子数据脚本
      - ./scripts/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app -d career_copilot"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redisdata:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  python-ner: # 🆕 v1.1 简历命名实体识别服务
    build:
      context: ../datasets
      dockerfile: Dockerfile
    ports:
      - "8001:8001"
    environment:
      - FLASK_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8001/health"]
      interval: 10s
      timeout: 5s
      retries: 3

volumes:
  pgdata:
  redisdata:
```

> **说明：** `docker-entrypoint-initdb.d/` 目录下的 `.sql` 文件会在 PostgreSQL 容器**首次启动时自动按文件名顺序执行**，用于初始化表结构和种子数据。后续重启不会重复执行。

```

---

## 八、PostgreSQL 数据类型参考

| 分类 | PostgreSQL 类型 | 说明 | 对应应用类型 |
|------|:---------------:|------|:------------:|
| 文本 | `VARCHAR(n)` | 定长字符串，如 `VARCHAR(30)` | `String` |
| 文本 | `TEXT` | 变长字符串，无长度限制 | `String` |
| 整数 | `INTEGER` / `INT` | 4 字节整数，范围 ±21 亿 | `number` |
| 浮点 | `DOUBLE PRECISION` | 8 字节浮点数 | `number` |
| 布尔 | `BOOLEAN` | true / false | `boolean` |
| 时间戳 | `TIMESTAMPTZ` | 带时区时间戳，毫秒精度 | `Date` |
| 日期 | `DATE` | 日期（无时间） | `Date` |
| JSON | `JSONB` | 二进制 JSON，支持索引和查询 | `object` |
| 数组 | `TEXT[]` | 文本数组，如 `{Java, SQL}` | `string[]` |
| 数组 | `INTEGER[]` | 整数数组，如 `{1, 2, 3}` | `number[]` |

---

## 九、查询性能建议

### 9.1 高频查询

| 场景 | 查询模式 | 建议 |
|------|----------|------|
| 用户登录 | `SELECT * FROM users WHERE email = ?` | email 已有唯一索引，性能良好 |
| 简历列表 | `SELECT * FROM resumes WHERE user_id = ? ORDER BY created_at DESC` | 已建 `(userId, createdAt)` 复合索引 |
| 面试历史 | `SELECT * FROM interviews WHERE user_id = ? AND status = ?` | 已建 `(userId, status, createdAt)` 复合索引 |
| 消息记录 | `SELECT * FROM interview_messages WHERE interview_id = ? ORDER BY created_at` | 已建 `(interviewId, createdAt)` 索引 |
| 岗位匹配列表 🆕 | `SELECT * FROM job_matches WHERE user_id = ? AND status = ?` | 已建 `(userId, status)` 复合索引 |
| 学习资源检索 🆕 | `SELECT * FROM learning_resources WHERE category = ? AND type = ?` | 已建 `(category, type)` 复合索引 |
| 题库分类查询 🆕 | `SELECT * FROM question_bank WHERE category = ? AND difficulty = ?` | 已建 `(category, difficulty)` 复合索引 |
| 语音面试列表 🆕 | `SELECT * FROM voice_interview_sessions WHERE user_id = ? AND status = ?` | 已建 `(userId, status)` 复合索引 |

### 9.2 JSONB 字段查询

PostgreSQL jsonb 支持丰富的查询操作符，无需反序列化：

```sql
-- 查询简历中 skills 数组包含 Java 的记录
SELECT * FROM resumes
WHERE parsed_data @> '{"skills": ["Java"]}';

-- 查询教育背景中 school = '华中科技大学' 的简历
SELECT * FROM resumes
WHERE parsed_data @> '{"education": [{"school": "华中科技大学"}]}';

-- 查询面试反馈中 overallScore >= 80 的记录
SELECT * FROM interviews
WHERE overall_feedback @> '{"overallScore": 80}'
   OR overall_feedback->>'overallScore' >= '80';

-- 查询职业规划中 roadmap 第一个阶段的技能包含 Spring Boot 的记录
SELECT * FROM career_plans
WHERE roadmap @> '[{"skills": ["Spring Boot"]}]';
```

**常用 JSONB 操作符：**

| 操作符 | 说明 | 示例 |
|:------:|------|------|
| `->` | 取 JSON 字段（返回 JSON） | `parsed_data->'basicInfo'` |
| `->>` | 取 JSON 字段（返回文本） | `parsed_data->>'skills'` |
| `@>` | 包含判断 | `parsed_data @> '{"skills":["Java"]}'` |
| `?` | 键是否存在 | `parsed_data ? 'projects'` |
| `#>>` | 路径访问 | `parsed_data #>> '{basicInfo,name}'` |

### 9.3  N+1 问题防范

避免循环查询，使用 JOIN 一次加载关联数据：

```sql
-- 推荐：一次 JOIN 查询面试及其所有消息
SELECT i.*, im.id AS msg_id, im.role, im.content, im.created_at AS msg_created_at
FROM interviews i
LEFT JOIN interview_messages im ON im.interview_id = i.id
WHERE i.id = 'intv_xxx'
ORDER BY im.created_at ASC;

-- 推荐：批量查询用户的简历和面试统计
SELECT u.id, u.name,
       COUNT(DISTINCT r.id) AS resume_count,
       COUNT(DISTINCT i.id) AS interview_count,
       AVG(i.score)::INTEGER AS avg_score
FROM users u
LEFT JOIN resumes r ON r.user_id = u.id
LEFT JOIN interviews i ON i.user_id = u.id AND i.status = 'completed'
WHERE u.id = 'clx...'
GROUP BY u.id, u.name;
```

---

## 十、环境变量

```env
# backend/.env
# PostgreSQL 连接串（格式：postgresql://用户:密码@主机:端口/数据库名）
DATABASE_URL="postgresql://app:${DB_PASSWORD}@localhost:5432/career_copilot"

# Redis 连接串
REDIS_URL="redis://localhost:6379/0"

# 数据库连接参数（也可拆分为独立变量供 psql 使用）
DB_HOST=localhost
DB_PORT=5432
DB_NAME=career_copilot
DB_USER=app
DB_PASSWORD=your_password_here

# 🆕 v1.1 LLM 供应商配置（三选一，按优先级：OPENAI > DASHESCOPE > DEEPSEEK）
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_BASE_URL=https://api.openai.com/v1
DASHSCOPE_API_KEY=sk-your-dashscope-api-key
DEEPSEEK_API_KEY=sk-your-deepseek-api-key

# 🆕 v1.1 LLM 模型选择
LLM_PROVIDER=dashscope           # openai / dashscope / deepseek
LLM_MODEL=qwen-plus              # 不同 provider 支持的模型不同

# 🆕 v1.1 Python NER 服务地址
PYTHON_NER_URL=http://localhost:8001

# 🆕 v1.1 语音面试相关
VOICE_UPLOAD_DIR=./uploads/voice
```
