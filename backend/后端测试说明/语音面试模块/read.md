# 语音面试模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/voice-interviews/*`

## 认证方式

所有接口均需 **Bearer Token** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）

---

## 接口列表

### 1. 创建语音面试 — `POST /api/voice-interviews`

| 项目 | 内容 |
|------|------|
| 功能 | 创建语音面试会话，初始状态为 `recording` |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | `targetPosition`（必填，目标岗位）、`difficulty`（可选，`easy` / `medium` / `hard`，默认 `medium`）、`resumeId`（可选，关联简历 ID） |
| 请求体示例 | `{ "targetPosition": "前端开发工程师", "difficulty": "medium" }` |
| 测试建议 | 创建一个语音面试会话，记录返回的会话 ID |

### 2. 面试历史 — `GET /api/voice-interviews`

| 项目 | 内容 |
|------|------|
| 功能 | 获取当前用户的语音面试历史（分页） |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `page`（可选，默认 1）、`limit`（可选，默认 10） |
| 测试建议 | 创建若干语音面试后，用此接口查看列表 |

### 3. 面试详情 — `GET /api/voice-interviews/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 获取语音面试的详细信息 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（会话 ID） |

### 4. 获取 AI 摘要 — `GET /api/voice-interviews/:id/summary`

| 项目 | 内容 |
|------|------|
| 功能 | 获取语音面试的 AI 摘要（技能评估、表现分析等） |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（会话 ID） |
| 注意事项 | ⚠️ 需先完成面试（调用 complete 接口），AI 才会生成完整的摘要 |

### 5. 暂停/恢复 — `PATCH /api/voice-interviews/:id/toggle-pause`

| 项目 | 内容 |
|------|------|
| 功能 | 切换语音面试的暂停/录制状态 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（会话 ID） |
| 说明 | `recording` ↔ `paused` 状态切换 |
| 测试建议 | 创建会话后调用此接口暂停，再调用一次恢复 |

### 6. 保存转录 — `POST /api/voice-interviews/:id/transcript`

| 项目 | 内容 |
|------|------|
| 功能 | 保存语音面试的转录内容 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（会话 ID） |
| 请求体参数 | `transcript`（必填，转录消息数组：`[{ timestamp, speaker, text }]`）、`durationSeconds`（可选，会话时长秒数） |
| 请求体示例 | `{ "transcript": [{ "timestamp": 0, "speaker": "ai", "text": "请介绍一下你自己" }, { "timestamp": 5, "speaker": "user", "text": "我是..." }], "durationSeconds": 120 }` |
| 测试建议 | 创建会话后，模拟保存几轮对话的转录内容 |

### 7. 结束面试 — `POST /api/voice-interviews/:id/complete`

| 项目 | 内容 |
|------|------|
| 功能 | 结束语音面试，标记为 `completed`，触发 AI 摘要生成 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（会话 ID） |
| 测试建议 | 保存转录后调用此接口结束面试，再用获取摘要接口查看结果 |

### 8. 删除记录 — `DELETE /api/voice-interviews/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 删除语音面试记录 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（会话 ID） |
| 注意事项 | ⚠️ 删除后不可恢复 |

---

## 通用注意事项

1. **面试流程**：创建会话 → 保存转录（反复） → 结束面试 → 查看 AI 摘要
2. **状态管理**：语音面试的状态包括 `recording`（录制中）/ `paused`（已暂停）/ `completed`（已完成）
3. **AI 摘要**：摘要由 AI 在完成面试后异步生成，需调用 complete 接口触发
4. **转录格式**：`transcript` 参数为数组，每条记录包含 `timestamp`（秒数）、`speaker`（`ai` / `user`）、`text`（文本内容）
5. **数据隔离**：语音面试数据按用户隔离，每个用户只能查看自己的面试记录
