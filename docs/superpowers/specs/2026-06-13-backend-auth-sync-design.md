# 后端认证与同步系统 — 设计文档

## 概述

为 AI 英语解题助手增加 Node.js 后端，提供邮箱注册登录、数据云同步和 AI API 代理能力。采用 Fastify + Prisma + SQLite 技术栈，单体架构部署。

## 核心目标

1. **用户系统**：邮箱注册登录，JWT 双 Token 认证
2. **数据同步**：聊天会话、收藏、OCR 结果云端存储
3. **API 代理**：服务端转发 AI API 请求，保护 API Key

## 技术栈

| 层 | 技术 |
|----|------|
| 框架 | Fastify 5 |
| ORM | Prisma 6 |
| 数据库 | SQLite (better-sqlite3) |
| 认证 | JWT (jsonwebtoken) + bcrypt |
| 部署 | Docker / PM2 |

## 项目结构

```
ai-english-helper/
├── server/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── plugins/          # Fastify 插件
│   │   ├── routes/
│   │   │   ├── auth.ts       # 注册/登录/刷新
│   │   │   ├── sync.ts       # 数据同步
│   │   │   └── proxy.ts      # AI 代理
│   │   ├── services/         # 业务逻辑层
│   │   ├── utils/
│   │   │   ├── jwt.ts
│   │   │   └── password.ts
│   │   └── app.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
└── src/
    ├── services/api.ts       # 后端 API 客户端
    └── stores/auth.ts        # 认证状态管理
```

## 数据库模型

- **User**: id, email (unique), password (bcrypt), nickname?, timestamps
- **ChatSession**: id, userId (FK), title?, messages (JSON), ocrId?, timestamps
- **Favorite**: id, userId (FK), title, type (ocr|chat), content, tags (JSON), timestamps
- **OCRResult**: id, userId (FK), text, markdown, imageBase64?, timestamps

所有数据表级联删除（删用户则清空关联数据）。

## API 路由

### 认证 `/api/auth`
- `POST /register` — 邮箱+密码注册，限流 5次/小时/IP
- `POST /login` — 邮箱+密码登录，限流 10次/分钟/IP
- `POST /refresh` — 刷新 Token
- `GET /me` — 获取当前用户（需认证）
- `PUT /me` — 修改用户信息（需认证）

### 数据同步 `/api/sync`
- `GET/POST /sessions` — 列表/创建聊天
- `GET/PUT/DELETE /sessions/:id` — 单个聊天的 CRUD
- `GET/POST /favorites` — 收藏列表/添加
- `DELETE /favorites/:id` — 取消收藏
- `GET/POST /ocr-results` — OCR 记录列表/上传
- `DELETE /ocr-results/:id` — 删除 OCR 记录

### AI 代理 `/api/proxy`
- `POST /chat` — 流式聊天代理
- `POST /vision` — 视觉识别代理

## Token 策略

- Access Token: 15 分钟过期，前端内存存储
- Refresh Token: 7 天过期，localStorage 持久化
- 401 时自动用 Refresh Token 换取新 Access Token

## 安全设计

- 密码 bcrypt (cost=12)
- 注册/登录接口限流
- API Key 仅存在服务端环境变量
- JWT 认证中间件保护所有业务路由
