# 用户模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/users/*`

## 认证方式

所有接口均需 **Bearer Token** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）

---

## 接口列表

### 1. 获取用户列表/详情 — `GET /api/users`

| 项目 | 内容 |
|------|------|
| 功能 | 不传 id 返回全部用户列表；传 id 返回指定用户详情 |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `id`（可选，用户 ID） |
| 示例 | `GET /api/users` — 返回所有用户 |
| | `GET /api/users?id=cm8abc123...` — 返回指定用户 |
| 返回内容 | 用户对象数组（不含密码字段） |
| 注意事项 | ⚠️ 未传 id 时返回**全部用户列表**，适合调试时查看有哪些用户存在；传 id 获取单个用户的详细信息 |
| 测试建议 | 1. 先不传 id 调用，查看用户列表<br>2. 从返回结果中复制某个用户的 id<br>3. 传入 id 参数查询单个用户详情 |

---

## 通用注意事项

1. **密码安全**：所有接口返回的用户数据**均不包含密码字段**，无需担心密码泄露
2. **ID 格式**：用户 ID 为 Prisma 生成的 CUID 格式（如 `cm8abc123def456...`），在 Swagger UI 中直接粘贴即可
3. **数据来源**：用户数据由注册接口 `POST /api/auth/register` 创建，管理员也可通过此接口查看系统中有哪些注册用户
