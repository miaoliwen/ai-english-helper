# 模型配置功能重新设计

## 概述

重新设计模型配置功能，支持两种配置模式：
1. **自定义配置模式**：用户自己提供API Key、Base URL、模型ID（自动拉取）
2. **服务端模式**：使用服务器端提供的模型服务，显示只读模型信息

## 设计目标

1. 支持完整的自定义配置（API Key、Base URL、模型ID、预设名称）
2. 支持服务端模式，显示只读模型信息
3. 全局模式切换
4. 模型列表自动拉取（支持多API格式）
5. API Key安全存储
6. 平滑的数据迁移

## 数据结构

### CustomModelConfig

```typescript
interface CustomModelConfig {
  id: string
  name: string           // 预设名称
  apiKey: string         // API Key（加密存储）
  baseUrl: string        // Base URL
  modelId: string        // 模型ID（自动拉取或手动输入）
  apiFormat: 'openai' | 'deepseek' | 'zhipu' | 'auto'  // API格式
}
```

### ServerModelConfig

```typescript
interface ServerModelConfig {
  id: string
  name: string           // 模型名称
  modelId: string        // 模型ID
  description?: string   // 描述信息
  available: boolean     // 是否可用
}
```

### AppConfig

```typescript
interface AppConfig {
  mode: 'custom' | 'server'           // 全局模式
  customModels: CustomModelConfig[]   // 自定义模型列表
  serverModels: ServerModelConfig[]   // 服务端模型列表
  activeChatId: string                // 当前激活的对话模型ID
  activeVisionId: string              // 当前激活的视觉模型ID
}
```

## UI设计

### 设置页面布局

```
┌─────────────────────────────────────────────────────────┐
│  模型配置                                                │
├─────────────────────────────────────────────────────────┤
│  配置模式                                                │
│  ┌─────────────────┐  ┌─────────────────┐              │
│  │   自定义配置     │  │   服务端模式     │              │
│  └─────────────────┘  └─────────────────┘              │
├─────────────────────────────────────────────────────────┤
│  [根据选择的模式显示不同的内容]                           │
└─────────────────────────────────────────────────────────┘
```

### 自定义配置模式

```
┌─────────────────────────────────────────────────────────┐
│  对话模型配置                                            │
├─────────────────────────────────────────────────────────┤
│  + 添加对话模型                                          │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ DeepSeek 主力                          [使用中]  │   │
│  │ deepseek-chat                                      │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │ GPT-4o 备用                                        │   │
│  │ gpt-4o                                             │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  编辑配置                                                │
│  预设名称: [DeepSeek 主力                    ]          │
│  API格式:  [OpenAI兼容      ▼]                         │
│  Base URL: [https://api.deepseek.com       ]          │
│            [获取模型列表]                                │
│  API Key:  [sk-***************************]          │
│  模型ID:   [deepseek-chat     ▼]                       │
│            (自动拉取的模型列表)                           │
├─────────────────────────────────────────────────────────┤
│  [测试连接]  [设为当前使用]                               │
└─────────────────────────────────────────────────────────┘
```

### 服务端模式

```
┌─────────────────────────────────────────────────────────┐
│  服务端模型信息                                          │
├─────────────────────────────────────────────────────────┤
│  对话模型                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 模型名称: DeepSeek Chat                          │   │
│  │ 模型ID: deepseek-chat                            │   │
│  │ 状态: 可用                                        │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  视觉模型                                                │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 模型名称: GPT-4o                                 │   │
│  │ 模型ID: gpt-4o                                   │   │
│  │ 状态: 可用                                        │   │
│  └─────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────┤
│  ℹ️ 服务端模式下，所有请求将通过服务器代理处理            │
└─────────────────────────────────────────────────────────┘
```

## 功能流程

### 模型列表自动拉取流程

```
用户输入Base URL
    ↓
点击"获取模型列表"按钮
    ↓
系统调用 {baseUrl}/v1/models 接口
    ↓
解析响应，提取模型列表
    ↓
填充模型ID下拉框
    ↓
用户选择模型
```

### API格式自动检测

```typescript
async function detectApiFormat(baseUrl: string): Promise<ApiFormat> {
  // 尝试OpenAI格式
  try {
    const response = await fetch(`${baseUrl}/v1/models`)
    if (response.ok) return 'openai'
  } catch {}
  
  // 尝试DeepSeek格式
  try {
    const response = await fetch(`${baseUrl}/api/models`)
    if (response.ok) return 'deepseek'
  } catch {}
  
  // 默认返回auto
  return 'auto'
}
```

## 存储设计

### localStorage key

```typescript
const APP_CONFIG_KEY = 'aieh-app-config'
```

### 存储结构

```typescript
interface StoredConfig {
  mode: 'custom' | 'server'
  customModels: CustomModelConfig[]
  activeChatId: string
  activeVisionId: string
}
```

## API Key安全处理

### 简单混淆（基础保护）

```typescript
function encodeApiKey(key: string): string {
  return btoa(key)
}

function decodeApiKey(encoded: string): string {
  return atob(encoded)
}
```

### 更安全的方案（Web Crypto API）

```typescript
async function encryptApiKey(key: string, password: string): Promise<string> {
  // 使用AES-GCM加密
  // ...
}
```

## 组件结构

```
src/
├── components/
│   └── settings/
│       ├── ModelConfig.vue          # 主配置页面
│       ├── CustomModePanel.vue      # 自定义模式面板
│       ├── ServerModePanel.vue      # 服务端模式面板
│       ├── ModelForm.vue            # 模型编辑表单
│       └── ModelListSelector.vue    # 模型列表选择器
├── stores/
│   └── config.ts                    # 新的配置store
└── types/
    └── config.ts                    # 配置类型定义
```

## 迁移策略

### 从旧配置迁移

```typescript
function migrateFromOldConfig(oldPresets: ModelPresets): AppConfig {
  const customModels: CustomModelConfig[] = [
    ...oldPresets.chat.map(p => ({
      id: p.id,
      name: p.name,
      apiKey: '',
      baseUrl: '',
      modelId: p.modelId,
      apiFormat: 'auto' as const
    })),
    ...oldPresets.vision.map(p => ({
      id: p.id,
      name: p.name,
      apiKey: '',
      baseUrl: '',
      modelId: p.modelId,
      apiFormat: 'auto' as const
    }))
  ]
  
  return {
    mode: 'server', // 默认使用服务端模式
    customModels,
    serverModels: [],
    activeChatId: oldPresets.activeChatId,
    activeVisionId: oldPresets.activeVisionId
  }
}
```

## 实现步骤

### 第一阶段：基础结构

1. 创建新的类型定义 (`types/config.ts`)
2. 创建新的配置store (`stores/config.ts`)
3. 实现数据迁移逻辑

### 第二阶段：UI组件

1. 创建ModelConfig主组件
2. 创建CustomModePanel组件
3. 创建ServerModePanel组件
4. 创建ModelForm组件
5. 创建ModelListSelector组件

### 第三阶段：功能实现

1. 实现模型列表自动拉取
2. 实现API格式自动检测
3. 实现API Key加密存储
4. 实现测试连接功能

### 第四阶段：集成和测试

1. 集成到现有设置页面
2. 测试各种场景
3. 优化用户体验

## 验收标准

1. 用户可以切换自定义/服务端模式
2. 自定义模式下可以配置API Key、Base URL、模型ID
3. 输入Base URL后可以自动拉取模型列表
4. 支持多种API格式（OpenAI、DeepSeek、智谱）
5. API Key安全存储
6. 服务端模式下显示只读模型信息
7. 从旧配置平滑迁移
8. 所有测试通过
