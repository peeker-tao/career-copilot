<div align="center">

# 🚀 Career-Copilot

**AI 驱动的大学生求职面试与职业规划平台**

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)
![NestJS](https://img.shields.io/badge/NestJS-10-E0234E?logo=nestjs)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql)
![Redis](https://img.shields.io/badge/Redis-7-DC382D?logo=redis)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

## 💡 痛点

大学生求职常陷困境：**零面试经验、简历石沉大海、对未来一片茫然。**

## ✨ 特色功能

- **🤖 AI 模拟面试** — 数字人面试官根据目标岗位自动出题，支持追问 + 评分 + 流式对话
- **📄 简历智能解析** — 上传 PDF/Word，AI 自动提取技能树，一键关联面试
- **📊 多维面试报告** — 专业能力、沟通表达、逻辑思维、项目经验四维评估
- **🎯 职业规划** — 技能差距分析 + 分阶段学习路线 + 市场洞察，告别迷茫

## 🛠️ 技术栈

| 前端 | 后端 | 基础设施 |
|:----:|:----:|:--------:|
| React 18 + TypeScript | NestJS + Prisma | PostgreSQL 15 |
| Ant Design 5 + TailwindCSS | JWT 双 Token 认证 | Redis 7 + Bull 队列 |
| Zustand + React Router | WebSocket + OpenAI SDK | Docker Compose |

## � 项目负责人

| 成员 | 班级 | 角色 | GitHub |
|:----:|:----:|:----:|:------:|
| 陶宏阳 | 软件 2402 | 后端 / AI 面试引擎 | [@peeker-tao](https://github.com/peeker-tao) |

## 👥 团队成员

| 成员 | 班级 | 角色 | GitHub |
|:----:|:----:|:----:|:------:|
| 邓继舟 | 软件 2402 | 前端 / 简历面试模块 | [@hezhui845](https://github.com/hezhui845) |
| 赵原一 | 软件 2402 | 后端 / 数据库与部署 | [@sixteen06](https://github.com/sixteen06) |
| 李烨 | 软件 2402 | 前端 / 仪表盘与职业规划 | [@lyxyz5223](https://github.com/lyxyz5223) |

## 🚦 快速开始

```bash
# 后端
cd backend && npm install && npx prisma migrate dev && npm run start:dev

# 前端  
cd frontend && npm install && npm run dev
```

> 📖 详细文档：[架构](./project_architecture.md) · [API](./api_documentation.md) · [数据库](./database_design.md)
