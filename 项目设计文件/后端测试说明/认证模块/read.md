# 认证模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/auth/*`

---

## 接口列表

### 1. 用户注册 — `POST /api/auth/register`

| 项目 | 内容 |
|------|------|
| 功能 | 使用邮箱+密码注册新用户 |
| 认证方式 | ❌ 无需登录 |
| 请求体参数 | `email`（邮箱）、`password`（密码，至少6位）、`name`（昵称，2-20字符） |
| 请求体示例 | `{ "email": "test@example.com", "password": "Test123456", "name": "测试用户" }` |
| 注意事项 | ⚠️ `email` 必须符合邮箱格式；`password` 至少 6 位；`name` 至少 2 个字符 |
| 测试建议 | 每个测试会话先用此接口注册一个新账号，避免重复注册冲突 |

### 2. 用户登录 — `POST /api/auth/login`

| 项目 | 内容 |
|------|------|
| 功能 | 使用邮箱+密码登录，返回 Token 对 |
| 认证方式 | ❌ 无需登录 |
| 请求体参数 | `email`（邮箱）、`password`（密码） |
| 请求体示例 | `{ "email": "test@example.com", "password": "Test123456" }` |
| 返回内容 | `accessToken`（15分钟有效）、`refreshToken`、`user` 对象 |
| 注意事项 | ⚠️ 登录成功后请**复制 `accessToken`**，点击 Swagger UI 右上角的 **Authorize** 按钮，输入 `Bearer <accessToken>`，否则其他需要认证的接口无法使用 |
| 测试建议 | 建议在 Swagger UI 中先执行登录，再配置 Authorize，然后测试其他所有模块 |

### 3. 刷新 Token — `POST /api/auth/refresh`

| 项目 | 内容 |
|------|------|
| 功能 | 使用 refreshToken 换取新的 Token 对 |
| 认证方式 | ❌ 无需登录 |
| 请求体参数 | `refreshToken`（登录时返回的 refreshToken） |
| 请求体示例 | `{ "refreshToken": "eyJhbGciOi..." }` |
| 注意事项 | ⚠️ `refreshToken` 有效期较长，若 `accessToken` 过期（15分钟），可用此接口刷新，无需重新登录 |

### 4. 获取用户信息 — `GET /api/auth/profile`

| 项目 | 内容 |
|------|------|
| 功能 | 返回当前登录用户的详细信息 |
| 认证方式 | ✅ 需要 Bearer Token |
| 注意事项 | ⚠️ 必须先配置 Authorize，否则返回 401 |

### 5. 修改个人资料 — `PATCH /api/auth/profile`

| 项目 | 内容 |
|------|------|
| 功能 | 修改昵称/头像/学历/目标岗位 |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | 以下均为可选字段：`name`（昵称）、`avatar`（头像URL）、`education`（学历）、`targetPosition`（目标岗位） |
| 请求体示例 | `{ "name": "新昵称", "education": "本科", "targetPosition": "前端开发工程师" }` |
| 注意事项 | ⚠️ 所有字段均为可选的，只需传需要修改的字段 |

---

## 通用注意事项

1. **Token 有效期**：`accessToken` 有效期为 **15 分钟**，过期后需调用刷新接口获取新 Token
2. **Authorize 操作**：在 Swagger UI 中配置 Authorization 时，格式必须为 `Bearer <token>`，不要遗漏 `Bearer` 前缀
3. **测试顺序建议**：注册 → 登录 → 配置 Authorize → 测试其他接口
