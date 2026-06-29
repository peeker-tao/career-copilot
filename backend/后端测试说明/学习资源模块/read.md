# 学习资源模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/learning-resources/*`

## 认证方式

所有接口均需 **Bearer Token** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）

---

## 接口列表

### 1. 浏览资源 — `GET /api/learning-resources`

| 项目 | 内容 |
|------|------|
| 功能 | 浏览学习资源库，支持分类/类型/难度筛选和关键词搜索（分页） |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `category`（可选，分类）、`type`（可选，资源类型）、`difficulty`（可选，难度）、`search`（可选，关键词搜索）、`tags`（可选，标签数组）、`page`（可选，默认 1）、`limit`（可选，默认 10） |
| 示例 | `GET /api/learning-resources?category=前端开发&difficulty=beginner&page=1&limit=10` |
| 测试建议 | 不传任何筛选条件调一次看全部资源，再逐步加筛选条件 |

### 2. 获取分类列表 — `GET /api/learning-resources/categories`

| 项目 | 内容 |
|------|------|
| 功能 | 获取所有资源分类的去重列表 |
| 认证方式 | ✅ 需要 Bearer Token |
| 返回内容 | 字符串数组（分类名称列表） |
| 测试建议 | 先在数据库中预置一些资源数据，再调此接口验证分类是否正确 |

### 3. 获取资源详情 — `GET /api/learning-resources/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 获取单个学习资源的完整信息，同时递增使用次数 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（资源 ID） |
| 测试建议 | 从浏览接口返回列表中复制 ID 传入 |

### 4. AI 个性化推荐 — `POST /api/learning-resources/recommendations`

| 项目 | 内容 |
|------|------|
| 功能 | 根据用户的目标岗位和技能差距，AI 推荐学习资源 |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | `targetPosition`（可选）、`gapSkills`（可选，技能差距数组）、`count`（可选，推荐数量） |
| 请求体示例 | `{ "targetPosition": "前端开发工程师", "gapSkills": ["React", "TypeScript"], "count": 5 }` |
| 注意事项 | ⚠️ 会先查数据库已有资源，不足时自动调用 AI 生成补充 |
| 测试建议 | 先通过浏览接口了解现有资源，再根据技能差距调用此接口获取推荐 |

---

## 通用注意事项

1. **资源预置**：学习资源数据需先通过数据库 seeding 或 AI 生成填充，空数据库下分类列表可能为空
2. **AI 补全**：个性化推荐接口在数据库资源不足时会调用 AI 生成并持久化到数据库
3. **响应延迟**：AI 生成推荐可能耗时 5-10 秒，请耐心等待
4. **使用计数**：调用资源详情接口会自动递增 `usageCount` 字段，用于统计热门资源
