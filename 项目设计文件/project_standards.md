# Career-Copilot 项目规范文档

> 版本：v1.1 | 日期：2026-06-28
> 适用范围：全团队统一遵守
> 状态：✅ 已实现 ⏳ 待测试

---

## 一、Git 工作流规范

### 1.1 分支策略

```
main          ─── 生产分支，只从 release/merge 合并
  ├─ develop  ─── 开发主分支，功能分支从此拉出
  │    ├─ feat/xxx     ─── 功能分支：feat/ai-interview, feat/resume-upload
  │    ├─ fix/xxx      ─── 修复分支：fix/login-error
  │    └─ refactor/xxx ─── 重构分支：refactor/api-structure
  └─ release  ─── 发版分支：release/v1.0.0
```

### 1.2 分支命名规范

| 类型 | 格式 | 示例 |
|------|------|------|
| 功能开发 | `feat/<简短描述>` | `feat/resume-upload` |
| Bug 修复 | `fix/<问题简述>` | `fix/login-401-error` |
| 重构 | `refactor/<模块名>` | `refactor/api-response` |
| 文档 | `docs/<内容>` | `docs/api-spec` |
| 样式调整 | `style/<页面>` | `style/interview-page` |

### 1.3 Commit Message 规范

使用 Conventional Commits 格式：

```
<type>(<scope>): <subject>

<body>
```

| type | 说明 |
|------|------|
| `feat` | 新功能 |
| `fix` | Bug 修复 |
| `docs` | 文档更新 |
| `style` | 样式/格式调整（不影响代码逻辑） |
| `refactor` | 代码重构 |
| `perf` | 性能优化 |
| `test` | 测试相关 |
| `chore` | 构建/工具链 |

**示例：**

```
feat(resume): 实现简历 PDF 上传与解析功能

- 集成 pdf-parse 进行文本提取
- 调用 LLM 结构化解析简历内容
- 前端展示技能雷达图
```

### 1.4 Code Review 流程

1. 功能开发完成后，提交 Pull Request 到 `develop` 分支
2. PR 标题格式：`[类型/模块] 描述`，如 `[feat/resume] 简历上传功能`
3. PR 描述需包含：改动内容、影响范围、测试情况
4. 至少 1 名其他团队成员 Review 通过后方可合并
5. 禁止直接向 `main` 分支推送代码

---

## 二、代码规范

### 2.1 通用规范

- **缩进**: 使用 2 个空格（前后端统一）
- **引号**: TypeScript / JavaScript 统一使用**单引号**
- **分号**: 必须使用分号结尾
- **行尾**: LF（Unix 风格）
- **最大行长度**: 120 字符
- **文件编码**: UTF-8

### 2.2 TypeScript 规范

- **类型定义**: 禁止使用 `any`，使用 `unknown` 替代不明确的类型
- **命名风格**:
  - 变量/函数: `camelCase`（驼峰）
  - 类/接口/类型: `PascalCase`（大驼峰）
  - 常量: `UPPER_SNAKE_CASE`（全大写蛇形）
  - 文件/文件夹: `kebab-case`（短横线连接）
  - 数据库字段: `camelCase`（Prisma 自动转 snake_case）
- **组件名**: 使用 PascalCase，如 `UserProfile.tsx`
- **API 接口函数**: 以 HTTP 方法前缀，如 `getUserList()`、`createInterview()`

**示例：**

```typescript
// ✅ 正确
interface UserProfile {
  userId: string;
  displayName: string;
}

const MAX_RETRY_COUNT = 3;

async function fetchInterviewList(params: PaginationParams): Promise<ApiResponse<Interview[]>> {
  // ...
}

// ❌ 错误
const get_user_list = () => {};  // 非 camelCase
interface user_profile {}        // 非 PascalCase
```

### 2.3 React / 前端规范

- **组件定义**: 使用函数组件 + Hooks，不使用 Class 组件
- **文件组织**: 每个组件一个文件夹，包含 `.tsx`、`.module.css`、`index.ts`

```
components/Button/
├── Button.tsx
├── Button.module.css
└── index.ts        # re-export
```

- **状态管理**: 全局状态用 Zustand，页面级状态用组件内 `useState` / `useReducer`
- **样式方案**: 优先 TailwindCSS 原子类，复杂样式用 CSS Module
- **API 调用**: 统一通过 `src/api/` 下的封装函数，不在组件中直接写 Axios

```
src/api/
├── request.ts              # Axios 实例（拦截器配置）
├── auth.ts                 # 认证相关 API
├── resume.ts               # 简历相关 API
├── interview.ts            # 面试相关 API
├── career.ts               # 职业规划相关 API
├── job-matching.ts         # 🆕 岗位匹配与推荐 API
├── learning-resources.ts   # 🆕 学习资源推荐 API
├── question-bank.ts        # 🆕 面试题库 API
├── voice-interview.ts      # 🆕 语音面试 API
├── admin.ts                # 🆕 管理员后台 API
└── resume-ner.ts           # 🆕 简历 NER 解析 API
```

### 2.4 NestJS / 后端规范

- **模块结构**: 遵循 NestJS 标准模块化

```
src/resume/
├── resume.module.ts        # 模块定义
├── resume.controller.ts    # 路由控制
├── resume.service.ts       # 业务逻辑
├── resume.parser.ts        # 工具服务
├── resume.processor.ts     # Bull 队列消费者
└── dto/
    ├── create-resume.dto.ts
    └── update-resume.dto.ts

**v1.1 新增模块结构：**

```
src/job-matching/
├── job-matching.module.ts
├── job-matching.controller.ts    # 岗位匹配与推荐 API
├── job-matching.service.ts
└── dto/

src/learning-resources/
├── learning-resources.module.ts
├── learning-resources.controller.ts  # 学习资源推荐 API
├── learning-resources.service.ts
└── dto/

src/question-bank/
├── question-bank.module.ts
├── question-bank.controller.ts    # 面试题库 API
├── question-bank.service.ts
└── dto/

src/voice-interview/
├── voice-interview.module.ts
├── voice-interview.controller.ts  # 语音面试 API
├── voice-interview.service.ts
├── voice-interview.gateway.ts     # WebSocket 实时语音网关
└── dto/

src/admin/
├── admin.module.ts
├── admin.controller.ts       # 管理员后台 API
├── admin.service.ts
└── dto/

src/resume-ner/
├── resume-ner.module.ts
├── resume-ner.controller.ts  # 简历 NER 解析 API
├── resume-ner.service.ts     # 调用 Python NER HTTP 服务
└── dto/
```
```

- **DTO 验证**: 使用 `class-validator` 装饰器进行参数校验

```typescript
import { IsEmail, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail({}, { message: '邮箱格式不正确' })
  email: string;

  @IsString()
  @MinLength(6, { message: '密码至少6位' })
  password: string;
}
```

- **错误处理**: 统一使用 NestJS 异常过滤器，不直接在 controller 中 try-catch
- **路由命名**: RESTful 风格，复数名词
- **配置管理**: 所有敏感配置（JWT_SECRET、REDIS_URL、API Key 等）必须通过 `ConfigService` 注入，禁止使用 `process.env` 直接读取或硬编码默认值
- **JSON 类型安全**: Prisma JSON 字段写入时使用 `as unknown as Prisma.InputJsonValue` 断言，禁止使用 `JSON.parse(JSON.stringify(obj))` 作为类型转换手段

---

## 三、接口规范

### 3.1 API 设计原则

- 使用 RESTful 风格
- 版本号统一在 URL 中：`/api/v1/xxx`
- 资源用复数名词：`/resumes`、`/interviews`
- 查询用 Query 参数，创建用 Request Body
- 统一响应格式（详见 `api_documentation.md`）

### 3.2 前后端协作

- **接口定义前置**: 前端开发前，后端先给出接口定义（Swagger / 本文档）
- **Mock 数据**: 前端使用 MSW（Mock Service Worker）或本地 JSON Mock 接口
- **联调阶段**: 接口稳定后，前端切到真实后端地址

### 3.3 环境配置

| 环境 | 后端地址 | 说明 |
|------|----------|------|
| 开发 | `http://localhost:3001/api/v1` | 本地开发 |
| 测试 | `https://test-api.career-copilot.com/api/v1` | 测试服务器 |
| 生产 | `https://api.career-copilot.com/api/v1` | 正式上线 |

---

## 四、数据库规范

### 4.1 命名规范

- **表名**: 小写复数，如 `users`、`resumes`、`interviews`
- **字段名**: Prisma 中使用 camelCase，自动映射为数据库 snake_case
- **主键**: 统一使用 `id`，类型为 `cuid` 字符串
- **外键**: `xxxId` 格式，如 `userId`、`resumeId`
- **时间字段**: `createdAt`、`updatedAt` 统一由 Prisma 的 `@default(now())` 和 `@updatedAt` 自动管理

### 4.2 迁移管理

- 使用 Prisma Migrate 管理数据库版本：`npx prisma migrate dev`
- 每次数据库变更生成一次迁移，并提交到代码仓库
- 禁止手动修改数据库结构

---

## 五、AI 服务规范

### 5.1 LLM 调用规范

- **统一入口**: 所有 LLM 调用通过 `ai/llm.provider.ts`，不直接在业务模块调用 API
- **Prompt 管理**: 核心 Prompt 定义在独立的 prompt 模板文件中

```
src/ai/prompts/
├── interview.system.prompt.ts    # 面试官 System Prompt
├── interview.feedback.prompt.ts  # 面试报告 Prompt
├── resume.parse.prompt.ts        # 简历解析 Prompt
├── career.plan.prompt.ts         # 职业规划 Prompt
├── market.insight.prompt.ts      # 市场洞察 Prompt
├── job-matching.prompt.ts        # 🆕 岗位匹配 Prompt
├── learning-resources.prompt.ts  # 🆕 学习资源推荐 Prompt
├── question-bank.prompt.ts       # 🆕 面试题库 Prompt
└── screening.prompt.ts           # 🆕 AI 简历筛选 Prompt
```

- **降级策略**: LLM 调用失败时返回友好提示，不抛出 500
- **超时设置**: LLM 请求超时 30 秒

### 5.2 Python NER 服务规范（v1.1 新增）

- **独立服务**: NER 解析为独立 Flask 服务（`backend/ner-service/`），通过 HTTP 与 NestJS 主服务通信
- **端口**: NER 服务运行在 `http://localhost:8001`
- **通信方式**: NestJS `resume-ner` 模块通过 `@nestjs/axios` HTTP 调用 NER 服务
- **NER 输出格式**: BIO 标注字典 + 规则引擎，输出 JSON `{ entities: [{ text, label, start, end }] }`
- **启动方式**: `python ner-service/app.py`，需独立启动
- **环境变量**: `NER_SERVICE_URL=http://localhost:8001`

### 5.3 API Key 管理

- API Key 存储在 `.env` 文件中，不提交到代码仓库
- `.env.example` 提供模板，标注所需的环境变量
- 所有配置通过 `ConfigService` 注入，禁止 `process.env` 硬编码
- 关键配置（JWT_SECRET、REDIS_URL）须在启动时校验，缺失则直接抛出异常

```
# .env.example
DATABASE_URL="postgresql://..."
REDIS_URL="redis://..."
JWT_SECRET="your-secret-key"
LLM_API_KEY="sk-xxx"
LLM_BASE_URL="https://api.deepseek.com"
```

---

## 六、项目沟通规范

### 6.1 每日站会

| 时间 | 时长 | 内容 |
|------|:----:|------|
| 每天早上 | 10-15 分钟 | ① 昨天完成了什么 ② 今天计划做什么 ③ 有什么阻塞 |

### 6.2 文档维护

- 所有文档使用 Markdown 格式，存放在项目根目录的 `docs/` 文件夹
- 接口变更时，必须同步更新 `api_documentation.md`
- 功能新增时，更新 `user_stories.md` 中的对应内容

### 6.3 版本管理

| 版本 | 日期 | 说明 |
|:----:|:----:|------|
| 版本 | 日期 | 说明 | 状态 |
|:----:|:----:|------|:----:|
| v0.1 | 2026-05 | 内部开发版本 | ✅ 已完成 |
| v1.0 | 2026-06-13 | MVP 版本（P0 功能全部完成） | ✅ 已完成 |
| v1.1 | 2026-06-28 | 全功能版本（P0+P1 功能，含岗位匹配、学习资源、面试题库、语音面试、管理员后台、简历NER） | ⏳ 待测试 |
| v2.0 | TBD | 优化与部署（性能优化、生产部署） | 📅 规划中 |

---

## 七、开发环境搭建

### 7.1 环境要求

| 工具 | 版本要求 |
|------|----------|
| Node.js | >= 18 LTS |
| pnpm / npm | pnpm >= 8 / npm >= 9 |
| PostgreSQL | >= 15 |
| Redis | >= 7 |

### 7.2 快速启动

```bash
# 后端
cd backend
cp .env.example .env          # 配置环境变量
pnpm install
pnpm prisma:migrate            # 初始化数据库
pnpm prisma:seed               # 填充测试数据
pnpm start:dev                 # 启动开发服务器 (localhost:3001)

# 前端
cd frontend
pnpm install
pnpm dev                       # 启动开发服务器 (localhost:5173)
```

### 7.3 Docker 启动（可选）

```bash
cd backend
docker-compose up -d           # 启动 PostgreSQL + Redis
pnpm start:dev                 # 启动后端
```

---

## 八、常用命令速查

```bash
# 后端
pnpm start:dev              # 启动开发模式
pnpm build                  # 构建
pnpm lint                   # 代码检查
pnpm format                 # 代码格式化
pnpm prisma:generate        # 生成 Prisma Client
pnpm prisma:migrate         # 执行数据库迁移
pnpm prisma:seed            # 填充测试数据
pnpm test                   # 运行测试
pnpm nest:build             # 编译 NestJS（类型检查）

# 前端
pnpm dev                    # 启动开发模式
pnpm build                  # 构建
pnpm lint                   # 代码检查
pnpm preview                # 预览构建结果
```
