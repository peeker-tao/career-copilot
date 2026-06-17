# AI 模块 — Swagger UI 测试说明

## 接口前缀

所有接口：`POST /api/ai/*`

## 认证方式

所有接口均需 **Bearer Token** 认证：

1. 先调用 `POST /api/auth/login` 获取 `accessToken`
2. 在 Swagger UI 右上角点击 **Authorize** 按钮
3. 输入 `Bearer <accessToken>`（例如 `Bearer eyJhbGciOi...`）

---

## 接口列表

### 1. 简历解析 — `POST /api/ai/resume/parse`

| 项目 | 内容 |
|------|------|
| 功能 | 将简历原始文本解析为结构化 JSON |
| 请求体 | `{ "text": "姓名：张三\n电话：13800138000\n..." }` |
| 注意事项 | ⚠️ `text` 字段需传入**完整的简历纯文本**（最少 10 个字符），可直接填入简历文件中复制出的文字 |
| 测试建议 | 使用提供的 10 份测试简历文件，手动将 PDF 内容粘贴到 text 字段测试 |

### 2. 生成面试题 — `POST /api/ai/interview/question`

| 项目 | 内容 |
|------|------|
| 功能 | 根据岗位、难度、技能生成面试题目列表 |
| 请求体示例 | `{ "position": "前端开发工程师", "difficulty": "mid", "count": 5, "skills": ["React", "TypeScript"] }` |
| 注意事项 | ⚠️ `difficulty` 仅支持 `junior` / `mid` / `senior` 三种值；`count` 可选（1-20，默认 5） |
| 测试建议 | 先调用职业规划或市场洞察获取目标岗位的技能要求，再针对性生成面试题 |

### 3. 评估回答 — `POST /api/ai/interview/evaluate`

| 项目 | 内容 |
|------|------|
| 功能 | 评估用户对某道面试题的回答，给出评分和反馈 |
| 请求体示例 | `{ "question": "请解释 React 虚拟 DOM 的原理", "answer": "虚拟 DOM 是一种...", "position": "前端开发工程师", "difficulty": "mid" }` |
| 注意事项 | ⚠️ `answer` 字段最少 **5 个字符**，可包含换行；若回答较长（含代码/多段文字），**可能触发 JSON 控制字符转义**，Swagger UI 中直接粘贴即可，后端已做兼容处理 |
| 测试建议 | 先用生成面试题接口获取题目，再填入自己的回答进行测试 |

### 4. 生成面试报告 — `POST /api/ai/interview/report`

| 项目 | 内容 |
|------|------|
| 功能 | 根据整个面试的问答记录生成综合评价报告 |
| 请求体示例 | `{ "messages": [{ "question": "...", "answer": "...", "score": 85 }] }` |
| 注意事项 | ⚠️ `messages` 是数组，至少需包含 1 条记录；每条记录中 `score` 可选（0-100） |
| 测试建议 | 可先调用面试模块的 `POST /api/interviews/:id/feedback` 生成报告，此处为 AI 底层接口，仅供调试使用 |

### 5. 生成职业规划 — `POST /api/ai/career/plan`

| 项目 | 内容 |
|------|------|
| 功能 | 技能分析 → 差距分析 → 学习路线 |
| 请求体示例 | `{ "currentSkills": ["JavaScript", "Vue", "CSS"], "targetPosition": "高级前端开发工程师", "experience": "1年前端开发经验", "education": "本科-计算机科学与技术", "goals": "希望在2年内成长为高级前端工程师" }` |
| 注意事项 | ⚠️ `currentSkills` 是**必填数组**，至少 1 项技能；其余字段可选但建议填写以获取更精准的规划 |
| 测试建议 | 先调用 `GET /api/career/market-insight` 了解目标岗位的市场需求，据此填写技能和目标 |

---

## 通用注意事项

1. **控制字符问题**：在 Swagger UI 的 JSON 编辑框中粘贴含换行的文本时，后端已自动处理 `\n` 等未转义控制字符，无需手动转义
2. **超时说明**：AI 接口调用外部大模型 API，响应时间可能较长（5-15 秒），请耐心等待
3. **API Key 配置**：若未配置自己的 API Key，系统使用默认密钥（`sk-adf2d1486f924b9ba75da484c65fab05`），地址为 `https://api.deepseek.com/v1`
4. **数据隔离**：此模块直接调用 AI，不操作数据库，不会自动保存结果；如需持久化请调用业务模块接口
