# 服务端模式后端设计

## 概述

为服务端模式添加完整的后端支持，实现 AI 提供商的动态配置和模型管理。部署后，管理员通过 API 接口配置 AI 提供商（如 DeepSeek、OpenAI、智谱），系统自动获取可用模型列表，前端服务端模式动态展示服务器提供的模型。

## 需求

- 服务端统一管理模型配置，所有用户共享
- 支持同时配置多个 AI 提供商
- 管理接口通过 API 操作（无管理界面）
- 前端服务端模式从服务器动态获取模型列表
- 环境变量作为初始默认值自动导入

## 数据模型

### Provider 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| name | String | 提供商名称，如 "DeepSeek" |
| baseUrl | String | API 地址，如 "https://api.deepseek.com" |
| apiKey | String | 加密存储的 API Key |
| format | String | openai / deepseek / zhipu / auto，默认 "auto" |
| enabled | Boolean | 是否启用，默认 true |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

### ServerModel 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | String (UUID) | 主键 |
| providerId | String | 外键关联 Provider |
| modelId | String | 模型 ID，如 "deepseek-chat" |
| name | String | 显示名称，如 "DeepSeek Chat" |
| type | String | "chat" 或 "vision" |
| enabled | Boolean | 是否启用，默认 true |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

约束：`@@unique([providerId, modelId])` 防止重复模型。

关系：`Provider 1:N ServerModel`，`onDelete: Cascade`。

## API 接口

### 管理接口（需管理员权限）

#### GET /api/admin/providers

列出所有提供商及其模型。

响应：
```json
{
  "providers": [
    {
      "id": "uuid",
      "name": "DeepSeek",
      "baseUrl": "https://api.deepseek.com",
      "format": "deepseek",
      "enabled": true,
      "models": [
        { "id": "uuid", "modelId": "deepseek-chat", "name": "DeepSeek Chat", "type": "chat", "enabled": true }
      ]
    }
  ]
}
```

#### POST /api/admin/providers

添加提供商。

请求体：
```json
{
  "name": "DeepSeek",
  "baseUrl": "https://api.deepseek.com",
  "apiKey": "sk-xxx",
  "format": "deepseek"
}
```

响应：返回创建的提供商（apiKey 已脱敏）。

#### PUT /api/admin/providers/:id

更新提供商信息（name、baseUrl、apiKey、format、enabled）。

#### DELETE /api/admin/providers/:id

删除提供商及其所有关联模型（Cascade）。

#### POST /api/admin/providers/:id/test

测试提供商连接。调用 `/v1/models` 端点验证 API Key 和 baseUrl 是否有效。

响应：
```json
{
  "success": true,
  "message": "连接成功",
  "models": ["deepseek-chat", "deepseek-coder"]
}
```

#### GET /api/admin/providers/:id/models

从提供商 API 拉取可用模型列表（不做保存，仅返回）。

#### PUT /api/admin/models/:id

更新模型（启用/禁用、修改类型、修改名称）。

### 公开接口（所有登录用户可用）

#### GET /api/models/server

获取服务器可用模型列表（仅返回 enabled 的提供商和模型）。

响应：
```json
{
  "models": [
    { "id": "uuid", "modelId": "deepseek-chat", "name": "DeepSeek Chat", "type": "chat", "providerName": "DeepSeek" },
    { "id": "uuid", "modelId": "gpt-4o", "name": "GPT-4o", "type": "vision", "providerName": "OpenAI" }
  ]
}
```

## 代理路由重构

### 现有路由改造

`POST /api/proxy/chat` 和 `POST /api/proxy/vision` 改为从数据库读取 Provider 配置：

1. 从请求体提取 `model` 字段
2. 查找 `ServerModel`（含 `enabled` 检查）→ 关联 `Provider`（含 `enabled` 检查）
3. 使用 Provider 的 `baseUrl` + `apiKey`（解密后）转发请求
4. 模型未找到返回 404，提供商禁用返回 503

### 缓存策略

Provider 配置缓存在内存中（Map<providerId, Provider>），配置变更时清除缓存。缓存 TTL 5 分钟。

### 环境变量兼容

- `AI_CHAT_API_KEY` / `AI_CHAT_BASE_URL` 等环境变量仍支持
- 首次启动时自动导入为默认 Provider
- 后续管理通过 API 接口操作

## 前端适配

### 服务端模式变更

1. `ServerModePanel` 从 `GET /api/models/server` 获取模型列表
2. 删除 `config.ts` 中的 `defaultServerModels` 硬编码
3. `ServerModelConfig` 类型增加 `providerName` 字段

### 新增 Store 方法

```typescript
async function fetchServerModels(): Promise<ServerModelConfig[]>
```

### 数据流

```
打开设置 → 服务端模式 → fetchServerModels() → 渲染模型列表
```

## 安全考虑

- API Key 在数据库中加密存储（复用 `encodeApiKey`/`decodeApiKey`）
- 管理接口需要 JWT 认证 + 角色检查（`role === 'admin'`）
- 响应中的 apiKey 脱敏处理（仅显示前 8 位 + `***`）
- 代理路由缓存防止频繁解密

## 测试策略

### 单元测试

- Provider CRUD 操作
- ServerModel CRUD 操作
- API Key 加密解密
- 模型列表获取与过滤

### 集成测试

- 管理接口完整流程（添加提供商 → 获取模型 → 启用/禁用）
- 代理路由完整流程（认证 → 模型查找 → 转发请求）
- 错误场景（模型未找到、提供商禁用、API Key 无效）

### 手动测试

- 添加提供商 → 测试连接 → 获取模型列表 → 启用模型
- 前端切换到服务端模式 → 看到服务器提供的模型 → 选择使用
- 发送对话请求 → 验证代理路由正确转发
