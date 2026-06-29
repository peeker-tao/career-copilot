# 管理模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/admin/*`

## 认证方式

所有接口均需 **Bearer Token + 管理员角色** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）
4. ⚠️ 仅管理员（`role: "admin"`）可使用此模块，普通用户调用返回 403

---

## 接口列表

### 用户管理

#### 1. 用户列表 — `GET /api/admin/users`

| 项目 | 内容 |
|------|------|
| 功能 | 获取所有用户列表（分页 + 搜索） |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |
| 查询参数 | `page`（可选，默认 1）、`limit`（可选，默认 10）、`search`（可选，搜索邮箱/昵称） |
| 示例 | `GET /api/admin/users?page=1&limit=20&search=test` |
| 测试建议 | 注册多个账号后，用此接口查看所有用户 |

#### 2. 用户详情 — `GET /api/admin/users/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 获取指定用户的详细信息及关联数据计数 |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |
| 路径参数 | `id`（用户 ID） |
| 返回内容 | 用户信息 + 简历数、面试数、职业规划数等统计 |

#### 3. 修改用户 — `PATCH /api/admin/users/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 修改指定用户的昵称/邮箱/角色等 |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |
| 路径参数 | `id`（用户 ID） |
| 请求体参数 | `name`（可选）、`email`（可选）、`role`（可选，`user` / `admin`）、`avatar`（可选）、`education`（可选）、`targetPosition`（可选） |
| 请求体示例 | `{ "role": "admin", "name": "管理员" }` |
| 注意事项 | ⚠️ `email` 修改时会校验唯一性 |

#### 4. 删除用户 — `DELETE /api/admin/users/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 删除指定用户及所有关联数据（级联删除） |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |
| 路径参数 | `id`（用户 ID） |
| 注意事项 | ⚠️ **删除后不可恢复**，会同时删除用户的简历、面试、职业规划等全部数据 |

#### 5. 重置密码 — `POST /api/admin/users/:id/reset-password`

| 项目 | 内容 |
|------|------|
| 功能 | 管理员强制重置指定用户的密码 |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |
| 路径参数 | `id`（用户 ID） |
| 请求体参数 | `newPassword`（必填，6-50 位） |
| 请求体示例 | `{ "newPassword": "NewPass123" }` |

---

### 简历管理（跨用户）

#### 6. 简历列表 — `GET /api/admin/resumes`

| 项目 | 内容 |
|------|------|
| 功能 | 获取所有用户的简历列表（分页） |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |
| 查询参数 | `page`（可选）、`limit`（可选）、`search`（可选） |
| 注意事项 | ⚠️ 不同于普通用户的 `GET /api/resumes`，此接口返回**全部用户的简历** |

#### 7. 简历详情 — `GET /api/admin/resumes/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 获取任意用户的简历详情 |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |

#### 8. 删除简历 — `DELETE /api/admin/resumes/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 删除任意用户的简历（含上传文件） |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |

---

### 面试管理（跨用户）

#### 9. 面试列表 — `GET /api/admin/interviews`

| 项目 | 内容 |
|------|------|
| 功能 | 获取所有用户的面试记录（分页） |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |

#### 10. 面试详情 — `GET /api/admin/interviews/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 获取任意用户的面试详情 |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |

#### 11. 删除面试 — `DELETE /api/admin/interviews/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 删除任意面试（级联删除消息） |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |

---

### 职业规划管理（跨用户）

#### 12. 规划列表 — `GET /api/admin/career-plans`

| 项目 | 内容 |
|------|------|
| 功能 | 获取所有用户的职业规划记录 |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |

#### 13. 规划详情 — `GET /api/admin/career-plans/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 获取任意用户的职业规划详情 |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |

#### 14. 删除规划 — `DELETE /api/admin/career-plans/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 删除任意职业规划 |
| 认证方式 | ✅ 需要 Bearer Token（管理员） |

---

## 通用注意事项

1. **管理员权限**：使用此模块前，需先在数据库中将对应用户的 `role` 改为 `admin`，或通过 `PATCH /api/admin/users/:id` 将自己提升为管理员
2. **数据隔离注意**：此模块是**跨用户**的管理后台，可以看到所有用户的数据，请谨慎操作删除类接口
3. **级联删除**：删除用户时会级联删除所有关联数据（简历、面试、职业规划等），不可恢复
