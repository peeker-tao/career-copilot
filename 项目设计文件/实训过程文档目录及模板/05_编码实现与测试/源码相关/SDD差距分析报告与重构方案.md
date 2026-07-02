# SDD 差距分析报告与重构方案

> **项目**: Career-Copilot AI模拟面试官与智能职业规划平台
> **编写人**: 陶宏阳（项目负责人）
> **日期**: 2026-06-18
> **版本**: v1.0

---

## 一、总体评估

基于 SDD（系统设计文档）标准和项目规范文档，对后端代码进行了全量审计。当前后端约 2,000+ 行核心代码分布在 20+ 个文件中，整体架构符合 NestJS 模块化标准，但在 **安全性、异步化、类型安全、代码完整性** 方面存在明显差距。

| 维度 | 评分 | 说明 |
|------|------|------|
| 架构清晰度 | ⭐⭐⭐⭐ | 模块化良好，职责划分清晰 |
| 类型安全 | ⭐⭐⭐ | 存在少量 `any` 类型和 JSON 序列化反模式 |
| 安全性 | ⭐⭐⭐ | 硬编码 Secret 回退问题，无敏感信息泄露 |
| 异步化 | ⭐⭐⭐ | 简历解析同步阻塞 HTTP 线程 |
| 完整性 | ⭐⭐⭐ | QueueService 空实现、Career 缺少 DELETE |
| 可维护性 | ⭐⭐⭐⭐ | 命名规范基本一致，注释充分 |
| 测试覆盖 | ⭐⭐ | 单元测试较少 |

---

## 二、P0 — 关键安全与性能问题

### 2.1 硬编码 JWT Secret 回退（安全漏洞）

**文件**: `src/auth/auth.service.ts`
**行号**: 第 54、75、78、81 行

```typescript
// ❌ 硬编码回退 — 生产环境可能忘记配置环境变量导致安全风险
secret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-in-production'

// ❌ expiresIn 使用 any 断言 + 字符串回退
expiresIn: (process.env.JWT_ACCESS_EXPIRES || '15m') as any
```

**SDD 要求**: 敏感信息应通过 ConfigService 注入，启动时校验必填配置。

**修复方案**:

- 在 `auth.module.ts` 中使用 `ConfigModule` + `ConfigService` 注入 JWT 配置
- 在 `app.module.ts` 中使用 `ConfigModule.forRoot({ validationSchema: Joi })` 校验必填变量
- 移除 `|| 'your-jwt-secret-key-change-in-production'` 回退

### 2.2 硬编码 Redis URL 回退（安全漏洞）

**文件**: `src/redis/redis.service.ts`
**行号**: 第 7 行

```typescript
// ❌ 硬编码回退
super(process.env.REDIS_URL || 'redis://localhost:6379/0');
```

**SDD 要求**: 环境变量依赖应在应用启动时验证。

**修复方案**:

- 通过 ConfigService 注入 REDIS_URL
- 添加 `@nestjs/config` 配置校验

### 2.3 简历解析同步阻塞 HTTP 线程（性能问题）

**文件**: `src/resume/resume.service.ts`
**行号**: 第 38-68 行

```typescript
// ❌ 同步调用 LLM 解析 — 平均耗时 3-8s，阻塞 Tomcat 线程
const text = await this.resumeParser.extractText(resume.fileUrl);
const parsedData = await this.resumeParser.parseWithLLM(text);
```

**SDD 要求**: 耗时操作应采用异步处理，避免阻塞 HTTP 线程池。

**修复方案**:

- 上传时立刻返回「解析中」状态
- 通过 BullMQ 队列异步执行解析
- 解析完成后通过 Socket.io 推送通知或前端轮询

---

## 三、P1 — 代码完整性与类型安全

### 3.1 QueueService 空实现

**文件**: `src/queue/queue.service.ts`
**行号**: 第 1-4 行

```typescript
// ❌ 纯占位符
@Injectable()
export class QueueService {
  // Bull 队列管理 — 待实现
}
```

**SDD 要求**: 所有注入的服务必须有完整实现或清晰的错误提示。

**修复方案**: 实现 BullMQ Queue 的基本封装，至少包含 `addJob` 和 `getJobStatus` 方法。

### 3.2 Career 模块缺少 DELETE 端点

**文件**: `src/career/career.controller.ts`、`src/career/career.service.ts`

当前 CareerPlan 创建后无法删除，用户无法管理自己的职业规划列表。

**修复方案**:

- Controller 新增 `DELETE /career/plans/:id`
- Service 新增 `deletePlan(userId, planId)` 方法

### 3.3 `any` 类型滥用

**文件中多处出现**:

| 位置 | 代码 | 问题 |
|------|------|------|
| `auth.service.ts` | `generateTokens` 中 `as any` | expiresIn 类型丢失 |
| `resume.service.ts` | `findAll` 中 `where: any` | where 条件未类型化 |
| `resume.service.ts` | `JSON.parse(JSON.stringify(parsedData))` | 反序列化导致类型丢失 |
| `career.service.ts` | `JSON.parse(JSON.stringify(planResult.roadmap))` | 同上 |
| `interview.service.ts` | 同上模式 | 同上 |

**SDD 要求**: 项目规范明确「禁止使用 `any`，使用 `unknown` 替代」。

### 3.4 Prisma JSON 字段序列化反模式

**SDD 要求**: Prisma 5 支持直接传入 JSON 对象，无需 `JSON.parse(JSON.stringify(x))`。

```typescript
// ❌ 反模式
roadmap: JSON.parse(JSON.stringify(planResult.roadmap))

// ✅ 直接传入
roadmap: planResult.roadmap as any
// 或使用结构化克隆
roadmap: structuredClone(planResult.roadmap)
```

---

## 四、P2 — 代码质量提升

### 4.1 面试 Action 归一化逻辑重复

**文件**: `src/interview/ai-interview.service.ts` 第 83-92 行
**文件**: `src/interview/interview.service.ts` 中存在类似逻辑

面试引擎中 LLM 返回的 `nextAction` 字段归一化逻辑在两个 Service 中重复实现。

**修复方案**: 提取为独立工具函数，放在 `interview/utils.ts` 或 `ai-interview.service.ts` 中共用。

### 4.2 RolesGuard role 字段使用

**文件**: `src/auth/guards/roles.guard.ts`
**行号**: 第 20 行

```typescript
return requiredRoles.includes(user.role);
```

**分析**: Prisma schema 中 User 模型有 `role String @default("user")` 字段，且 JWT 策略需要将 role 注入到 user 对象。当前 `JwtStrategy.validate()` 中需确认是否包含了 `role` 字段。

### 4.3 UserService.findById 安全性

**文件**: `src/user/user.service.ts`
**行号**: 第 21-23 行

```typescript
// ⚠️ 查询所有字段后再手动剔除 passwordHash
const user = await this.prisma.user.findUnique({ where: { id } });
const { passwordHash, ...result } = user;
```

**SDD 要求**: 使用 `select` 选择需要的字段，避免查询不需要的敏感字段。

### 4.4 JSON 解析中间件复杂度

**文件**: `src/main.ts`
**行号**: 第 21-91 行

自定义 JSON 解析器约 70 行，复杂度较高。虽然解决了 Swagger 控制字符问题，但增加了维护成本。

**修复方案**: 评估是否可以使用 NestJS 内置 `ValidationPipe` 的 `transform` 选项替代。

---

## 五、重构执行计划

| 优先级 | 任务 | 文件 | 预计工作量 |
|--------|------|------|-----------|
| P0 | 修复 JWT Secret 硬编码 | auth.service.ts, auth.module.ts | 小 |
| P0 | 修复 Redis URL 硬编码 | redis.service.ts | 小 |
| P0 | 简历解析异步化 (BullMQ) | resume.service.ts, queue.service.ts, resume.processor.ts | 大 |
| P1 | 实现 QueueService 完整代码 | queue.service.ts, queue.module.ts | 中 |
| P1 | 新增 Career DELETE 端点 | career.controller.ts, career.service.ts | 小 |
| P1 | 修复 any 类型 | 多个文件 | 中 |
| P1 | 移除 JSON.parse(JSON.stringify()) | 多个文件 | 小 |
| P2 | 面试 Action 归一化抽取 | interview/ | 小 |
| P2 | UserService 使用 select | user.service.ts | 小 |
| P2 | 评估 JSON 解析中间件简化方案 | main.ts | 小 |

---

## 六、代码规范合规检查

### 6.1 命名规范 ✅/❌

| 规范要求 | 合规状态 | 说明 |
|----------|----------|------|
| 文件/文件夹 kebab-case | ✅ | 全部符合 |
| 类名 PascalCase | ✅ | 全部符合 |
| 方法名 camelCase | ✅ | 全部符合 |
| 禁止 `any` | ❌ | 多处需要修复 |
| DTO 使用 class-validator | ✅ | 全部符合 |
| RESTful 复数路由 | ✅ | 全部符合 |
| 统一异常过滤器 | ✅ | HttpExceptionFilter 已实现 |
| 统一响应拦截器 | ✅ | ResponseInterceptor 已实现 |

### 6.2 模块结构 ✅/❌

| 要求 | 合规 | 说明 |
|------|------|------|
| 标准 NestJS 模块 | ✅ | 所有模块符合 |
| provider/controller 分离 | ✅ | 职责清晰 |
| DTO 单独目录 | ✅ | 全部模块有 DTO |
| 全局前缀 /api | ✅ | main.ts 配置 |
| Swagger 文档 | ✅ | 全部 endpoint 有 @ApiOperation |

---

## 七、总结

后端代码整体质量较好，模块化设计和注释充分，核心业务逻辑（AI 面试引擎、简历解析器）实现健壮。主要问题集中在 **安全性（硬编码回退）**、**异步化（简历解析阻塞）** 和 **代码完整性（QueueService 空实现）** 三个方面。

建议优先修复 P0 问题，再逐步跟进 P1/P2 优化项。

---
*本文档根据 SDD 标准与项目规范自动生成*
