<div align="center">

# 🚀 Career-Copilot

**AI 驱动的大学生求职面试与职业规划平台**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)
![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

## 功能模块

| 模块 | 核心能力 |
|:----:|----------|
| 🤖 **AI 面试** | 按岗位自动出题 → 追问 → 评分 → WebSocket 流式对话 |
| 🎤 **语音面试** | ASR 语音识别 + TTS 语音合成，支持实时语音对话 |
| 📄 **简历解析** | PDF/Word 上传 → AI 提取技能树，一键关联面试 |
| ✏️ **简历改写** | AI 辅助优化简历，分章节重写建议 |
| 🔍 **简历筛选** | AI 五维评估，支持批量基准测试 |
| 🎯 **岗位匹配** | 基于简历的岗位推荐与匹配度分析 |
| 📚 **面试题库** | 按岗位/技能 AI 生成题目，分类筛选 |
| 📖 **学习推荐** | AI 智能推荐学习资源 |
| 🧭 **职业规划** | 技能差距分析 + 学习路线 + 市场洞察 |
| 📊 **面试报告** | 专业能力、沟通表达、逻辑思维等多维评估 |
| 🔧 **管理后台** | 用户/简历/面试/规划管理，角色权限控制 |

## 技术栈

- **前端**：React 18 + Vite + Ant Design + TypeScript + Zustand
- **后端**：NestJS 11 + Prisma + PostgreSQL 15 + Redis 7 + WebSocket
- **AI**：OpenAI / 通义千问 / DeepSeek 多模型适配 + RAG 本地知识库

## 快速启动
---

## 功能模块

| 模块 | 核心能力 |
|:----:|----------|
| 🤖 **AI 面试** | 按岗位自动出题 → 追问 → 评分 → WebSocket 流式对话 |
| 🎤 **语音面试** | ASR 语音识别 + TTS 语音合成，支持实时语音对话 |
| 📄 **简历解析** | PDF/Word 上传 → AI 提取技能树，一键关联面试 |
| ✏️ **简历改写** | AI 辅助优化简历，分章节重写建议 |
| 🔍 **简历筛选** | AI 五维评估，支持批量基准测试 |
| 🎯 **岗位匹配** | 基于简历的岗位推荐与匹配度分析 |
| 📚 **面试题库** | 按岗位/技能 AI 生成题目，分类筛选 |
| 📖 **学习推荐** | AI 智能推荐学习资源 |
| 🧭 **职业规划** | 技能差距分析 + 学习路线 + 市场洞察 |
| 📊 **面试报告** | 专业能力、沟通表达、逻辑思维等多维评估 |
| 🔧 **管理后台** | 用户/简历/面试/规划管理，角色权限控制 |

## 技术栈

- **前端**：React 18 + Vite + Ant Design + TypeScript + Zustand
- **后端**：NestJS 11 + Prisma + PostgreSQL 15 + Redis 7 + WebSocket
- **AI**：OpenAI / 通义千问 / DeepSeek 多模型适配 + RAG 本地知识库

## 快速启动

```bash
# 1. 启动数据库 (PostgreSQL + Redis)
cd backend && docker compose up -d

# 2. 后端
npm install && npx prisma generate && npx prisma migrate dev && npm run start:dev

# 前端
cd frontend && npm install && npm run dev
# 如果你使用的是yarn
cd frontend && yarn && yarn dev

# 后端
# 1. 启动数据库 (PostgreSQL + Redis)
cd backend && docker compose up -d

# 2. 安装依赖并运行
npm install && npx prisma generate && npx prisma migrate dev && npm run start:dev

# 3. 用户前端 (新终端, port 5173)
cd frontend/frontend && yarn install && yarn run dev

# 4. 管理后台 (新终端, port 4177)
cd backend/admin-frontend && npm install && npm run dev
```

> ⚠️ 首次使用请先配置 `.env` 文件中的 API Key。详细步骤见：[快速开始指令.md](./项目设计文件/快速开始指令.md)

## 团队

| 成员 | 角色 | GitHub |
|:----:|:----:|:------:|
| 陶宏阳 | 后端 / AI 引擎 | [@peeker-tao](https://github.com/peeker-tao) |
| 邓继舟 | 前端 / 简历面试 | [@hezhui845](https://github.com/hezhui845) |
| 赵原一 | 后端 / 数据库部署 | [@sixteen06](https://github.com/sixteen06) |
| 李烨 | 前端 / 仪表盘规划 | [@lyxyz5223](https://github.com/lyxyz5223) |

## 文档

[架构设计](./项目设计文件/project_architecture.md) · [API 文档](./项目设计文件/api_documentation.md) · [数据库设计](./项目设计文件/database_design.md) · [快速开始](./项目设计文件/快速开始指令.md)
> ⚠️ 首次使用请先配置 `.env` 文件中的 API Key。详细步骤见：[快速开始指令.md](./项目设计文件/快速开始指令.md)

## 团队

| 成员 | 角色 | GitHub |
|:----:|:----:|:------:|
| 陶宏阳 | 后端 / AI 引擎 | [@peeker-tao](https://github.com/peeker-tao) |
| 邓继舟 | 前端 / 简历面试 | [@hezhui845](https://github.com/hezhui845) |
| 赵原一 | 后端 / 数据库部署 | [@sixteen06](https://github.com/sixteen06) |
| 李烨 | 前端 / 仪表盘规划 | [@lyxyz5223](https://github.com/lyxyz5223) |

## 文档

[架构设计](./项目设计文件/project_architecture.md) · [API 文档](./项目设计文件/api_documentation.md) · [数据库设计](./项目设计文件/database_design.md) · [快速开始](./项目设计文件/快速开始指令.md)
