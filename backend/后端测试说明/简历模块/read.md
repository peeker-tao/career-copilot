# 简历模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`/api/resumes/*`

## 认证方式

所有接口均需 **Bearer Token** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）

---

## 接口列表

### 1. 上传简历 — `POST /api/resumes/upload`

| 项目 | 内容 |
|------|------|
| 功能 | 上传 PDF 或 DOCX 格式的简历文件（最大 10MB） |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求格式 | `multipart/form-data` |
| 请求参数 | `file`（文件字段，选择本地文件） |
| 注意事项 | ⚠️ **关键**：在 Swagger UI 中，此接口的请求体类型为 `multipart/form-data`，**不是 JSON**。需要在 Swagger UI 的请求体中选择 "file" 字段，点击 "选择文件" 按钮选择本地的 PDF 或 DOCX 文件 |
| 注意事项 | ⚠️ 上传后系统会自动触发**异步解析**，解析状态会变为 `parsing`，解析完成后变为 `completed` |
| 测试建议 | 使用项目提供的 `项目设计文件\后端测试说明\10份测试简历` 目录中的 PDF 文件（4.pdf ~ 13.pdf）进行测试 |

### 2. 获取简历列表 — `GET /api/resumes`

| 项目 | 内容 |
|------|------|
| 功能 | 获取当前用户的简历列表（分页） |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `page`（可选，默认 1）、`limit`（可选，默认 10）、`status`（可选，筛选状态） |
| 示例 | `GET /api/resumes?page=1&limit=10` — 第一页，每页10条 |
| | `GET /api/resumes?status=completed` — 仅查看解析完成的简历 |
| 注意事项 | ⚠️ `status` 可选值：`parsing`（解析中）、`completed`（解析完成）、`failed`（解析失败） |
| 测试建议 | 上传简历后等待几秒，再用此接口查看状态是否变为 `completed` |

### 3. 获取简历详情 — `GET /api/resumes/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 根据 ID 获取单份简历的详细信息 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（简历 ID） |
| 注意事项 | ⚠️ ID 必须从简历列表返回结果中获取，该接口只返回当前登录用户自己的简历 |

### 4. 更新简历 — `PUT /api/resumes/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 手动更新简历的解析内容 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（简历 ID） |
| 请求体参数 | `parsedData`（JSON 对象，简历解析后的结构化数据） |
| 请求体示例 | `{ "parsedData": { "name": "张三", "phone": "13800138000", "skills": ["JavaScript", "Vue"] } }` |
| 注意事项 | ⚠️ `parsedData` 是一个 **JSON 对象**，可以包含任何简历字段，没有固定 schema |
| 测试建议 | 上传并解析简历后，可用此接口手动修正解析结果中不准确的部分 |

### 5. 删除简历 — `DELETE /api/resumes/:id`

| 项目 | 内容 |
|------|------|
| 功能 | 删除指定的简历及上传的文件 |
| 认证方式 | ✅ 需要 Bearer Token |
| 路径参数 | `id`（简历 ID） |
| 注意事项 | ⚠️ **删除后不可恢复**，会同时删除数据库记录和上传的文件 |
| 测试建议 | 建议在确认不再需要时才删除，测试时可以先上传再删除验证流程 |

---

### 6. AI 筛选基准测试 — `POST /api/resumes/screening/benchmark/import`

| 项目 | 内容 |
|------|------|
| 功能 | 从 CSV 数据集批量导入简历基准测试记录（追加模式，不会删除已有数据） |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | `records`（必填，数组，每项含：`resume`、`jobRole`、`label`、`confidenceScore` 等字段） |
| 请求体示例 | `{ "records": [{ "resume": "5+ years experience...", "jobRole": "Data Scientist", "label": 1, "confidenceScore": 0.95 }] }` |
| 返回内容 | `{ "imported": 500 }` 表示成功导入的记录数 |
| 注意事项 | ⚠️ 此接口为**纯追加**模式，不会清空已有数据；每次导入重复调用会累积重复记录 |
| 测试建议 | 可配合数据集脚本 `datasets/analyze_ai_screening.py` 生成的 JSON 数据使用 |

### 7. 种子数据 — `POST /api/resumes/screening/benchmark/seed`

| 项目 | 内容 |
|------|------|
| 功能 | 从预设 CSV 数据集（`datasets/AI_Resume_Screening/AI_Resume_Screening.csv`）填充 500 条基准测试数据 |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求方式 | 直接 `POST`，**不需要请求体** |
| 返回内容 | `{ "imported": 500, "jobRoles": ["Data Scientist", "Software Engineer", ...] }` |
| 注意事项 | ⚠️ 先清空再导入，每次调用会先删除当前用户的所有旧数据再重新导入 |
| 测试建议 | 首次测试时调用此接口快速填充数据，后续评估和统计依赖此数据 |

### 8. 统计信息 — `GET /api/resumes/screening/benchmark/stats`

| 项目 | 内容 |
|------|------|
| 功能 | 获取基准测试数据的统计信息（总量、各岗位分布、标签分布等） |
| 认证方式 | ✅ 需要 Bearer Token |
| 查询参数 | `jobRole`（可选，筛选特定岗位的统计） |
| 示例 | `GET /api/resumes/screening/benchmark/stats?jobRole=Data%20Scientist` |
| 测试建议 | 调用种子数据后，用此接口查看数据分布是否合理 |

### 9. 评估测试 — `POST /api/resumes/screening/benchmark/evaluate`

| 项目 | 内容 |
|------|------|
| 功能 | 用基准测试数据评估 AI 简历筛选的准确率（返回准确率、精确率、召回率、F1 等指标） |
| 认证方式 | ✅ 需要 Bearer Token |
| 请求体参数 | `jobRole`（可选，筛选特定岗位进行评估）、`sampleSize`（可选，采样数量） |
| 请求体示例 | `{ "jobRole": "Data Scientist", "sampleSize": 50 }` 或 `{ "jobRole": "Software Engineer" }` |
| Swagger 示例值 | ① 高匹配岗位：`{ "jobRole": "Data Scientist", "sampleSize": 100 }`<br>② 中等岗位：`{ "jobRole": "Software Engineer", "sampleSize": 50 }`<br>③ 入门级岗位：`{ "jobRole": "Java Developer", "sampleSize": 20 }` |
| 返回内容 | `{ "accuracy": 0.85, "precision": 0.80, "recall": 0.75, "f1Score": 0.77, ... }` |
| 注意事项 | ⚠️ 依赖基准测试数据，需先调用 seed 或 import 接口填充数据 |
| 测试建议 | 先 seed 500 条数据，再对不同岗位分别评估 |

---

## 通用注意事项

1. **文件格式**：仅支持 **PDF** 和 **DOCX** 格式，文件大小限制为 **10MB**
2. **解析延迟**：简历上传后为异步解析，需要等待 3-10 秒，可通过 `GET /api/resumes` 查看状态
3. **自行 ID 管理**：所有简历操作均使用简历 ID（CUID 格式），需从列表接口获取
4. **数据隔离**：每个用户只能查看和操作自己上传的简历，无法看到其他用户的简历
5. **测试简历**：项目已提供 10 份测试简历 PDF 文件，位于 `项目设计文件\后端测试说明\10份测试简历` 目录下，可直接用于测试上传接口
