# 题库模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/question-bank/*`

## 认证方式

所有接口均需 **Bearer Token** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）

---

## 接口列表

### 1. 浏览题库 — `GET /api/question-bank`

| 项目 | 内容 |
|------|------|
| 功能 | 浏览面试题库，支持分类/题型/难度筛选和关键词搜索（分页） |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `category`（可选，分类）、`type`（可选，题型：`choice` / `short_answer` / `coding` / `behavioral`）、`difficulty`（可选，难度：`easy` / `medium` / `hard`）、`search`（可选，关键词）、`tags`（可选，标签数组）、`page`（可选，默认 1）、`limit`（可选，默认 10） |
| 示例 | `GET /api/question-bank?category=前端开发&type=coding&difficulty=medium` |
| 测试建议 | 先不传筛选条件查看全部，再逐个添加筛选条件测试 |

### 2. 获取分类列表 — `GET /api/question-bank/categories`

| 项目 | 内容 |
|------|------|
| 功能 | 获取题库所有分类的去重列表 |
| 认证方式 | ✅ 需要 Bearer Token |
| 返回内容 | 字符串数组（分类名称列表） |

### 3. 题目详情 — `GET /api/question-bank/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 获取单个题目的完整信息，同时递增使用次数 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（题目 ID） |
| 测试建议 | 从浏览接口返回列表中复制 ID 传入 |

### 4. AI 生成题目 — `POST /api/question-bank/generate`

| 项目 | 内容 |
|------|------|
| 功能 | 根据岗位/分类/难度，AI 生成面试题目并批量保存到数据库 |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | `position`（可选）、`category`（可选）、`difficulty`（可选，`easy` / `medium` / `hard`）、`type`（可选，`choice` / `short_answer` / `coding` / `behavioral`）、`count`（可选，生成数量） |
| 请求体示例 | `{ "category": "前端开发", "difficulty": "medium", "type": "coding", "count": 5 }` |
| 注意事项 | ⚠️ 生成的题目会**持久化到数据库**，后续可通过浏览接口查看 |
| 测试建议 | 先调浏览接口看题库是否为空，若为空则调生成接口填充数据 |

---

## 通用注意事项

1. **AI 生成**：生成题目依赖 AI 模型，响应时间约 5-15 秒
2. **持久化**：AI 生成的题目会保存到数据库，生成后可通过浏览接口查看和管理
3. **数据预置**：题库数据可通过数据库 seeding 或 AI 生成接口填充，空库下浏览/分类接口可能无数据
4. **使用统计**：调用题目详情接口会自动递增 `usageCount`，便于统计高频题目
