# 岗位匹配模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/job-matching/*`

## 认证方式

所有接口均需 **Bearer Token** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）

---

## 接口列表

### 1. AI 岗位推荐 — `GET /api/job-matching/recommendations`

| 项目 | 内容 |
|------|------|
| 功能 | 基于用户的技能和目标岗位，AI 智能推荐匹配的岗位 |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `limit`（可选，1-50，默认 5） |
| 示例 | `GET /api/job-matching/recommendations?limit=10` |
| 返回内容 | 推荐岗位列表（含匹配度评分、匹配详情、技能交集/差距等） |
| 注意事项 | ⚠️ 推荐数据由 AI 根据用户上传的简历技能生成，建议先上传简历再调用此接口 |
| 测试建议 | 先上传简历并等待解析完成，再调此接口获取岗位推荐 |

### 2. 已保存岗位列表 — `GET /api/job-matching/matches`

| 项目 | 内容 |
|------|------|
| 功能 | 获取用户已保存的匹配岗位列表（分页 + 状态筛选） |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `page`（可选，默认 1）、`limit`（可选，1-50，默认 10）、`status`（可选，筛选状态） |
| 示例 | `GET /api/job-matching/matches?status=saved` |
| 测试建议 | 先调用导入接口或分析接口，再用此接口查看已保存的岗位 |

### 3. 更新岗位状态 — `PATCH /api/job-matching/matches/:id/status`

| 项目 | 内容 |
|------|------|
| 功能 | 更新已保存岗位的投递状态 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（匹配记录 ID） |
| 请求体参数 | `status`（必填，状态值） |
| 请求体示例 | `{ "status": "applied" }` |
| 测试建议 | 获取已保存岗位列表后，复制某个岗位的 ID，修改其状态 |

### 4. 分析匹配度 — `POST /api/job-matching/analyze`

| 项目 | 内容 |
|------|------|
| 功能 | 分析指定简历与目标岗位的匹配度，生成详细报告 |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | `resumeId`（必填，简历 ID）、`position`（必填，目标岗位） |
| 请求体示例 | `{ "resumeId": "cm8abc123...", "position": "前端开发工程师" }` |
| 返回内容 | 匹配度评分、技能匹配/差距分析、经验匹配、教育匹配等 |
| 注意事项 | ⚠️ 内部调用 AI 生成分析，若 AI 调用失败会自动降级为关键词匹配模式 |
| 测试建议 | 先上传简历并等待解析完成，填好简历 ID 和目标岗位再调用 |

### 5. 导入外部数据 — `POST /api/job-matching/import`

| 项目 | 内容 |
|------|------|
| 功能 | 导入外部岗位匹配数据（如从 Kaggle 数据集导入） |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | `position`（必填）、`company`（可选）、`location`（可选）、`description`（可选）、`requirements`（可选）、`matchScore`（0-100）、`matchDetails`（可选）、`status`（可选）、`source`（可选） |
| 请求体示例 | `{ "position": "Software Engineer", "company": "Google", "matchScore": 85, "source": "kaggle" }` |
| 测试建议 | 配合外部数据集使用，手动导入测试数据 |

---

## 通用注意事项

1. **AI 依赖**：岗位推荐和分析依赖 AI 模型生成数据，响应可能有 5-15 秒延迟
2. **降级机制**：AI 调用失败时自动降级为关键词匹配模式，仍可返回结果
3. **数据隔离**：岗位匹配数据按用户隔离，每个用户只能查看自己的推荐和保存列表
4. **推荐前提**：AI 推荐依赖用户简历中的技能信息，建议先上传并解析简历
