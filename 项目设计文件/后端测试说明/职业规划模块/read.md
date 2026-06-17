# 职业规划模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/career/*`

## 认证方式

所有接口均需 **Bearer Token** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）

---

## 接口列表

### 1. 创建职业规划 — `POST /api/career/plan`

| 项目 | 内容 |
|------|------|
| 功能 | 创建职业规划，AI 分析技能差距并生成学习路线 |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | `targetPosition`（必填，目标岗位）、`currentSkills`（可选，当前技能列表）、`resumeId`（可选，关联简历 ID） |
| 请求体示例 | `{ "targetPosition": "前端开发工程师", "currentSkills": ["Vue", "CSS", "JavaScript"], "resumeId": "cm8abc123..." }` |
| 注意事项 | ⚠️ `targetPosition` 是**必填字段**，需完整填写岗位名称；`currentSkills` 为可选的字符串数组 |
| 注意事项 | ⚠️ 若同时传了 `resumeId` 和 `currentSkills`，系统以 `currentSkills` 为准 |
| 测试建议 | 1. 先用市场洞察接口了解目标岗位的技能要求<br>2. 根据自身情况填写 `currentSkills`<br>3. 调用此接口生成规划，AI 会输出技能分析、差距分析和学习路线 |

### 2. 获取规划列表 — `GET /api/career/plans`

| 项目 | 内容 |
|------|------|
| 功能 | 获取当前用户的所有职业规划记录 |
| 认证方式 | ✅ 需要 Bearer Token |
| 注意事项 | ⚠️ 返回当前用户创建的全部规划列表，无分页参数 |
| 测试建议 | 创建职业规划后调用此接口查看所有已创建的规划 |

### 3. 获取规划详情 — `GET /api/career/plans/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 根据 ID 获取单条职业规划的详细信息 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（规划 ID） |
| 注意事项 | ⚠️ ID 需从规划列表接口中获取，仅返回当前用户自己的规划 |
| 测试建议 | 从规划列表返回结果中复制 `id`，传入此接口查看规划的完整 AI 分析内容 |

### 4. 市场洞察 — `GET /api/career/market-insight`

| 项目 | 内容 |
|------|------|
| 功能 | 通过 AI 生成目标岗位的模拟市场数据（薪资、需求趋势、核心技能等） |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `position`（**必填**，目标岗位名称） |
| 示例 | `GET /api/career/market-insight?position=前端开发工程师` |
| 返回内容 | 岗位名称、平均薪资、薪资范围、需求趋势、核心技能列表、行业分布等 AI 生成的市场洞察数据 |
| 注意事项 | ⚠️ `position` 是必填的 Query 参数，在 Swagger UI 的 "Parameters" 区域填写，**不是**请求体（Request Body） |
| 注意事项 | ⚠️ 返回数据由 AI 生成，为模拟数据，仅供参考 |
| 测试建议 | 在创建职业规划前先调用此接口了解目标岗位的市场需求和技能要求，以便更准确填写规划信息 |

---

## 通用注意事项

1. **AI 推理**：规划内容和市场洞察数据均由 AI 模型生成，数据为模拟结果，仅供参考
2. **响应延迟**：AI 生成规划内容较多（技能分析+差距分析+学习路线），响应时间可能较长（5-20 秒），请耐心等待
3. **Query 参数 vs Body 参数**：`GET /api/career/market-insight` 的 `position` 是 **Query 参数**，在 Swagger UI 中位于 Parameters 区域，不是底部的 Request Body 区域
4. **数据隔离**：职业规划数据按用户隔离，每个用户只能查看自己的规划
5. **规划 ID**：规划 ID 为 CUID 格式（如 `cm8abc123...`），创建规划后可从返回结果中获取
