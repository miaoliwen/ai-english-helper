# 模型配置功能重新设计 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重新设计模型配置功能，支持自定义配置模式和服务器端模式，实现完整的API配置和模型列表自动拉取功能。

**Architecture:** 采用完全重构方案，创建新的配置类型定义、配置store和UI组件。支持两种配置模式的全局切换，实现模型列表自动拉取和API Key安全存储。

**Tech Stack:** Vue 3, TypeScript, Pinia, Tailwind CSS, Web Crypto API

---

## 文件结构

```
src/
├── types/
│   └── config.ts                    # 新的配置类型定义
├── stores/
│   └── config.ts                    # 新的配置store
├── services/
│   └── modelApi.ts                  # 模型API服务（自动拉取、格式检测）
├── components/
│   └── settings/
│       ├── ModelConfig.vue          # 主配置页面
│       ├── CustomModePanel.vue      # 自定义模式面板
│       ├── ServerModePanel.vue      # 服务端模式面板
│       ├── ModelForm.vue            # 模型编辑表单
│       └── ModelListSelector.vue    # 模型列表选择器
└── utils/
    └── crypto.ts                    # 加密工具函数
```

---

### Task 1: 创建配置类型定义

**Files:**
- Create: `src/types/config.ts`

- [ ] **Step 1: 创建类型定义文件**

```typescript
// src/types/config.ts

// API格式类型
export type ApiFormat = 'openai' | 'deepseek' | 'zhipu' | 'auto'

// 自定义模型配置
export interface CustomModelConfig {
  id: string
  name: string           // 预设名称
  apiKey: string         // API Key（加密存储）
  baseUrl: string        // Base URL
  modelId: string        // 模型ID（自动拉取或手动输入）
  apiFormat: ApiFormat   // API格式
}

// 服务端模型配置
export interface ServerModelConfig {
  id: string
  name: string           // 模型名称
  modelId: string        // 模型ID
  description?: string   // 描述信息
  available: boolean     // 是否可用
}

// 全局配置
export interface AppConfig {
  mode: 'custom' | 'server'           // 全局模式
  customModels: CustomModelConfig[]   // 自定义模型列表
  serverModels: ServerModelConfig[]   // 服务端模型列表
  activeChatId: string                // 当前激活的对话模型ID
  activeVisionId: string              // 当前激活的视觉模型ID
}

// 模型类型（对话/视觉）
export type ModelType = 'chat' | 'vision'

// 模型列表响应
export interface ModelListResponse {
  models: Array<{
    id: string
    name?: string
  }>
}
```

- [ ] **Step 2: 验证类型定义**

运行TypeScript检查确保类型定义正确：
```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 3: 提交代码**

```bash
git add src/types/config.ts
git commit -m "feat: add model config type definitions"
```

---

### Task 2: 创建加密工具函数

**Files:**
- Create: `src/utils/crypto.ts`

- [ ] **Step 1: 创建加密工具函数**

```typescript
// src/utils/crypto.ts

const ENCODED_KEY_PREFIX = 'enc:'

// 简单混淆（基础保护）
export function encodeApiKey(key: string): string {
  if (!key) return ''
  return ENCODED_KEY_PREFIX + btoa(unescape(encodeURIComponent(key)))
}

export function decodeApiKey(encoded: string): string {
  if (!encoded || !encoded.startsWith(ENCODED_KEY_PREFIX)) return encoded
  const base64 = encoded.slice(ENCODED_KEY_PREFIX.length)
  return decodeURIComponent(escape(atob(base64)))
}

// 检查是否已编码
export function isEncoded(key: string): boolean {
  return key.startsWith(ENCODED_KEY_PREFIX)
}
```

- [ ] **Step 2: 验证加密函数**

创建测试文件验证加密解密功能：
```typescript
// src/utils/__tests__/crypto.spec.ts
import { describe, it, expect } from 'vitest'
import { encodeApiKey, decodeApiKey, isEncoded } from '../crypto'

describe('crypto', () => {
  it('should encode and decode api key', () => {
    const original = 'sk-test-1234567890'
    const encoded = encodeApiKey(original)
    expect(encoded).not.toBe(original)
    expect(isEncoded(encoded)).toBe(true)
    expect(decodeApiKey(encoded)).toBe(original)
  })

  it('should handle empty string', () => {
    expect(encodeApiKey('')).toBe('')
    expect(decodeApiKey('')).toBe('')
  })

  it('should handle already encoded key', () => {
    const encoded = encodeApiKey('sk-test')
    expect(decodeApiKey(encoded)).toBe('sk-test')
  })
})
```

- [ ] **Step 3: 运行测试验证**

```bash
cd "D:\ai英语解题助手"; npm test
```

- [ ] **Step 4: 提交代码**

```bash
git add src/utils/crypto.ts src/utils/__tests__/crypto.spec.ts
git commit -m "feat: add API key encryption utilities"
```

---

### Task 3: 创建模型API服务

**Files:**
- Create: `src/services/modelApi.ts`

- [ ] **Step 1: 创建模型API服务**

```typescript
// src/services/modelApi.ts

import type { ApiFormat, ModelListResponse } from '@/types/config'

// 检测API格式
export async function detectApiFormat(baseUrl: string): Promise<ApiFormat> {
  // 尝试OpenAI格式
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) return 'openai'
  } catch {}

  // 尝试DeepSeek格式
  try {
    const response = await fetch(`${baseUrl}/api/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) return 'deepseek'
  } catch {}

  // 默认返回auto
  return 'auto'
}

// 获取模型列表
export async function fetchModelList(
  baseUrl: string,
  apiKey: string,
  format: ApiFormat = 'auto'
): Promise<ModelListResponse> {
  let actualFormat = format

  if (format === 'auto') {
    actualFormat = await detectApiFormat(baseUrl)
  }

  let url: string
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  switch (actualFormat) {
    case 'openai':
      url = `${baseUrl}/v1/models`
      break
    case 'deepseek':
      url = `${baseUrl}/api/models`
      break
    case 'zhipu':
      url = `${baseUrl}/api/models`
      break
    default:
      url = `${baseUrl}/v1/models`
  }

  const response = await fetch(url, { method: 'GET', headers })

  if (!response.ok) {
    throw new Error(`获取模型列表失败: ${response.statusText}`)
  }

  const data = await response.json()

  // 解析不同格式的响应
  let models: Array<{ id: string; name?: string }> = []

  if (data.data && Array.isArray(data.data)) {
    // OpenAI格式
    models = data.data.map((m: any) => ({
      id: m.id,
      name: m.name || m.id
    }))
  } else if (data.models && Array.isArray(data.models)) {
    // DeepSeek格式
    models = data.models.map((m: any) => ({
      id: m.id || m,
      name: m.name || m.id || m
    }))
  } else if (Array.isArray(data)) {
    // 简单数组格式
    models = data.map((m: any) => ({
      id: typeof m === 'string' ? m : m.id,
      name: typeof m === 'string' ? m : m.name || m.id
    }))
  }

  return { models }
}

// 测试连接
export async function testConnection(
  baseUrl: string,
  apiKey: string,
  modelId: string,
  format: ApiFormat = 'auto'
): Promise<{ success: boolean; message: string }> {
  try {
    // 尝试获取模型列表来测试连接
    await fetchModelList(baseUrl, apiKey, format)
    return { success: true, message: '连接成功' }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '连接失败'
    }
  }
}
```

- [ ] **Step 2: 验证模型API服务**

运行TypeScript检查确保类型正确：
```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 3: 提交代码**

```bash
git add src/services/modelApi.ts
git commit -m "feat: add model API service with auto-detection"
```

---

### Task 4: 创建配置Store

**Files:**
- Create: `src/stores/config.ts`
- Modify: `src/stores/app.ts`

- [ ] **Step 1: 创建配置Store**

```typescript
// src/stores/config.ts

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AppConfig, CustomModelConfig, ServerModelConfig, ModelType } from '@/types/config'
import { v4 as uuidv4 } from '@/utils/uuid'
import { encodeApiKey, decodeApiKey } from '@/utils/crypto'

const APP_CONFIG_KEY = 'aieh-app-config'

// 默认服务端模型
const defaultServerModels: ServerModelConfig[] = [
  {
    id: 'server-chat-default',
    name: 'DeepSeek Chat',
    modelId: 'deepseek-chat',
    description: '服务端提供的对话模型',
    available: true
  },
  {
    id: 'server-vision-default',
    name: 'GPT-4o',
    modelId: 'gpt-4o',
    description: '服务端提供的视觉模型',
    available: true
  }
]

// 加载配置
function loadConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(APP_CONFIG_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 解密API Keys
      if (parsed.customModels) {
        parsed.customModels = parsed.customModels.map((m: CustomModelConfig) => ({
          ...m,
          apiKey: decodeApiKey(m.apiKey)
        }))
      }
      return parsed
    }
  } catch {}
  
  // 返回默认配置
  return {
    mode: 'server',
    customModels: [],
    serverModels: defaultServerModels,
    activeChatId: '',
    activeVisionId: ''
  }
}

// 保存配置
function saveConfig(config: AppConfig) {
  // 加密API Keys
  const toSave = {
    ...config,
    customModels: config.customModels.map(m => ({
      ...m,
      apiKey: encodeApiKey(m.apiKey)
    }))
  }
  localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(toSave))
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<AppConfig>(loadConfig())

  // 计算属性
  const mode = computed(() => config.value.mode)
  const customModels = computed(() => config.value.customModels)
  const serverModels = computed(() => config.value.serverModels)
  
  const activeChatModel = computed(() => {
    if (config.value.mode === 'server') {
      return config.value.serverModels.find(m => 
        m.modelId === 'deepseek-chat' && m.available
      ) || config.value.serverModels[0]
    }
    return config.value.customModels.find(m => m.id === config.value.activeChatId)
  })

  const activeVisionModel = computed(() => {
    if (config.value.mode === 'server') {
      return config.value.serverModels.find(m => 
        m.modelId === 'gpt-4o' && m.available
      ) || config.value.serverModels[0]
    }
    return config.value.customModels.find(m => m.id === config.value.activeVisionId)
  })

  // 方法
  function setMode(mode: 'custom' | 'server') {
    config.value.mode = mode
    saveConfig(config.value)
  }

  function addCustomModel(modelType: ModelType): CustomModelConfig {
    const id = uuidv4()
    const newModel: CustomModelConfig = {
      id,
      name: modelType === 'chat' ? '新对话模型' : '新视觉模型',
      apiKey: '',
      baseUrl: '',
      modelId: '',
      apiFormat: 'auto'
    }
    config.value.customModels.push(newModel)
    saveConfig(config.value)
    return newModel
  }

  function updateCustomModel(model: CustomModelConfig) {
    const index = config.value.customModels.findIndex(m => m.id === model.id)
    if (index !== -1) {
      config.value.customModels[index] = model
      saveConfig(config.value)
    }
  }

  function removeCustomModel(id: string) {
    config.value.customModels = config.value.customModels.filter(m => m.id !== id)
    if (config.value.activeChatId === id) {
      config.value.activeChatId = config.value.customModels[0]?.id || ''
    }
    if (config.value.activeVisionId === id) {
      config.value.activeVisionId = config.value.customModels[0]?.id || ''
    }
    saveConfig(config.value)
  }

  function setActiveModel(id: string, modelType: ModelType) {
    if (modelType === 'chat') {
      config.value.activeChatId = id
    } else {
      config.value.activeVisionId = id
    }
    saveConfig(config.value)
  }

  function getCustomModelsByType(modelType: ModelType): CustomModelConfig[] {
    // 根据modelId判断类型（简单判断）
    return config.value.customModels.filter(m => {
      if (modelType === 'chat') {
        return !m.modelId.includes('vision') && !m.modelId.includes('gpt-4o')
      } else {
        return m.modelId.includes('vision') || m.modelId.includes('gpt-4o')
      }
    })
  }

  return {
    config,
    mode,
    customModels,
    serverModels,
    activeChatModel,
    activeVisionModel,
    setMode,
    addCustomModel,
    updateCustomModel,
    removeCustomModel,
    setActiveModel,
    getCustomModelsByType
  }
})
```

- [ ] **Step 2: 更新app.ts导出**

```typescript
// src/stores/app.ts

export { useModelStore } from './model'
export { useFavoritesStore } from './favorites'
export { useAppStore } from './app-core'
export { useConfigStore } from './config'
```

- [ ] **Step 3: 验证Store**

运行TypeScript检查：
```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 4: 提交代码**

```bash
git add src/stores/config.ts src/stores/app.ts
git commit -m "feat: add config store with mode switching"
```

---

### Task 5: 创建ModelListSelector组件

**Files:**
- Create: `src/components/settings/ModelListSelector.vue`

- [ ] **Step 1: 创建模型列表选择器组件**

```vue
<!-- src/components/settings/ModelListSelector.vue -->
<template>
  <div class="space-y-2">
    <div class="flex items-center gap-2">
      <input
        v-model="localBaseUrl"
        type="url"
        placeholder="输入API Base URL"
        class="input-field text-sm flex-1"
        @blur="onBaseUrlChange"
      >
      <button
        :disabled="loading || !localBaseUrl"
        class="btn-secondary text-sm px-3 py-2"
        @click="fetchModels"
      >
        <svg
          v-if="loading"
          class="w-4 h-4 animate-spin"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
          />
        </svg>
        <span v-else>获取模型列表</span>
      </button>
    </div>

    <div v-if="error" class="text-xs text-red-500 dark:text-red-400">
      {{ error }}
    </div>

    <select
      v-if="models.length > 0"
      v-model="localModelId"
      class="input-field text-sm"
      @change="onModelChange"
    >
      <option value="">选择模型</option>
      <option
        v-for="model in models"
        :key="model.id"
        :value="model.id"
      >
        {{ model.name || model.id }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { fetchModelList, detectApiFormat } from '@/services/modelApi'
import type { ApiFormat } from '@/types/config'

const props = defineProps<{
  baseUrl: string
  modelId: string
  apiKey?: string
  apiFormat?: ApiFormat
}>()

const emit = defineEmits<{
  'update:baseUrl': [value: string]
  'update:modelId': [value: string]
  'update:apiFormat': [value: ApiFormat]
}>()

const localBaseUrl = ref(props.baseUrl)
const localModelId = ref(props.modelId)
const models = ref<Array<{ id: string; name?: string }>>([])
const loading = ref(false)
const error = ref('')

watch(() => props.baseUrl, (val) => {
  localBaseUrl.value = val
})

watch(() => props.modelId, (val) => {
  localModelId.value = val
})

function onBaseUrlChange() {
  emit('update:baseUrl', localBaseUrl.value)
}

function onModelChange() {
  emit('update:modelId', localModelId.value)
}

async function fetchModels() {
  if (!localBaseUrl.value) return

  loading.value = true
  error.value = ''

  try {
    // 自动检测API格式
    const format = props.apiFormat || 'auto'
    const detectedFormat = format === 'auto' 
      ? await detectApiFormat(localBaseUrl.value)
      : format
    
    if (format === 'auto') {
      emit('update:apiFormat', detectedFormat)
    }

    const response = await fetchModelList(
      localBaseUrl.value,
      props.apiKey || '',
      format
    )
    
    models.value = response.models
    
    if (response.models.length === 0) {
      error.value = '未找到可用模型'
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '获取模型列表失败'
    models.value = []
  } finally {
    loading.value = false
  }
}
</script>
```

- [ ] **Step 2: 验证组件**

运行TypeScript检查：
```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 3: 提交代码**

```bash
git add src/components/settings/ModelListSelector.vue
git commit -m "feat: add ModelListSelector component"
```

---

### Task 6: 创建ModelForm组件

**Files:**
- Create: `src/components/settings/ModelForm.vue`

- [ ] **Step 1: 创建模型编辑表单组件**

```vue
<!-- src/components/settings/ModelForm.vue -->
<template>
  <div class="p-5 space-y-4 md:max-h-[60vh] md:overflow-y-auto pb-nav">
    <button
      class="md:hidden flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 -ml-1 px-1 py-1 rounded-lg touch-target"
      aria-label="返回模型列表"
      @click="$emit('back')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      返回列表
    </button>

    <template v-if="model">
      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">模型名称</label>
        <input
          v-model="local.name"
          type="text"
          placeholder="例如：DeepSeek 主力"
          enterkeyhint="next"
          autocomplete="off"
          class="input-field text-sm"
        >
      </div>

      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">API格式</label>
        <select
          v-model="local.apiFormat"
          class="input-field text-sm"
        >
          <option value="auto">自动检测</option>
          <option value="openai">OpenAI兼容</option>
          <option value="deepseek">DeepSeek</option>
          <option value="zhipu">智谱</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Base URL</label>
        <input
          v-model="local.baseUrl"
          type="url"
          placeholder="例如：https://api.deepseek.com"
          enterkeyhint="next"
          autocomplete="off"
          class="input-field text-sm"
        >
      </div>

      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">API Key</label>
        <input
          v-model="local.apiKey"
          type="password"
          placeholder="输入API Key"
          enterkeyhint="next"
          autocomplete="off"
          class="input-field text-sm"
        >
      </div>

      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">模型ID</label>
        <ModelListSelector
          :base-url="local.baseUrl"
          :model-id="local.modelId"
          :api-key="local.apiKey"
          :api-format="local.apiFormat"
          @update:base-url="local.baseUrl = $event"
          @update:model-id="local.modelId = $event"
          @update:api-format="local.apiFormat = $event"
        />
      </div>

      <div class="pt-2 flex flex-col gap-2">
        <slot name="actions" />
      </div>

      <div
        v-if="diagnostic"
        class="rounded-xl p-3.5 text-xs"
        :class="diagnostic.success 
          ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' 
          : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'"
      >
        <p class="font-semibold mb-0.5">{{ diagnostic.message }}</p>
        <p v-if="diagnostic.details">{{ diagnostic.details }}</p>
      </div>
    </template>

    <div v-else class="hidden md:block text-center text-sm text-neutral-400 py-10">
      选择一个模型或新增一个开始
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { CustomModelConfig, ApiFormat } from '@/types/config'
import ModelListSelector from './ModelListSelector.vue'

export interface DiagnosticResult {
  success: boolean
  message: string
  details?: string
}

const props = defineProps<{
  model: CustomModelConfig | null
  diagnostic: DiagnosticResult | null
}>()

const emit = defineEmits<{
  'update:model': [value: CustomModelConfig]
  'back': []
}>()

const local = ref<CustomModelConfig>({
  id: props.model?.id ?? '',
  name: props.model?.name ?? '',
  apiKey: props.model?.apiKey ?? '',
  baseUrl: props.model?.baseUrl ?? '',
  modelId: props.model?.modelId ?? '',
  apiFormat: props.model?.apiFormat ?? 'auto'
})

watch(() => props.model?.id, (newId) => {
  if (newId && newId !== local.value.id) {
    const m = props.model
    if (m) local.value = { ...m }
  }
}, { immediate: true })

watch(local, (val) => {
  emit('update:model', { ...val })
}, { deep: true })
</script>
```

- [ ] **Step 2: 验证组件**

运行TypeScript检查：
```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 3: 提交代码**

```bash
git add src/components/settings/ModelForm.vue
git commit -m "feat: add ModelForm component"
```

---

### Task 7: 创建CustomModePanel组件

**Files:**
- Create: `src/components/settings/CustomModePanel.vue`

- [ ] **Step 1: 创建自定义模式面板组件**

```vue
<!-- src/components/settings/CustomModePanel.vue -->
<template>
  <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
    <!-- 模型列表 -->
    <div
      class="md:border-r border-neutral-100 dark:border-neutral-800 p-3 space-y-1 md:max-h-[60vh] md:overflow-y-auto"
      :class="mobileStep === 'list' ? 'block' : 'hidden md:block'"
    >
      <button
        class="w-full flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors touch-target"
        @click="addNew"
      >
        <svg
          class="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M12 4.5v15m7.5-7.5h-15"
          />
        </svg>
        新增模型
      </button>

      <div
        v-for="model in models"
        :key="model.id"
        class="px-3 py-2.5 rounded-xl cursor-pointer transition-colors group"
        :class="model.id === editingId 
          ? 'bg-accent-50 dark:bg-accent-900/20' 
          : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'"
        @click="selectModel(model.id)"
      >
        <div class="flex items-center gap-2">
          <span
            class="flex-1 truncate text-sm font-medium"
            :class="model.id === activeId 
              ? 'text-accent-700 dark:text-accent-400' 
              : 'text-neutral-800 dark:text-neutral-200'"
          >
            {{ model.name || '未命名模型' }}
          </span>
          <span
            v-if="model.id === activeId"
            class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300"
          >
            使用中
          </span>
          <svg
            class="md:hidden w-4 h-4 text-neutral-300 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </div>
        <p class="text-xs text-neutral-400 truncate mt-0.5 font-mono">
          {{ model.modelId || '—' }}
        </p>
        <button
          v-if="models.length > 1"
          class="mt-1 px-2 py-1 rounded-md text-xs text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all touch-target"
          @click.stop="remove(model.id)"
        >
          删除
        </button>
      </div>
    </div>

    <!-- 编辑器 -->
    <div
      :class="mobileStep === 'editor' ? 'block' : 'hidden md:block'"
    >
      <ModelForm
        :model="editing"
        :diagnostic="diagnostic"
        @update:model="onModelUpdate"
        @back="mobileStep = 'list'"
      >
        <template #actions>
          <button
            :disabled="testing"
            class="btn-secondary w-full flex items-center justify-center gap-2 text-sm"
            @click="testConnection"
          >
            <svg
              v-if="testing"
              class="w-4 h-4 animate-spin"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
              />
            </svg>
            <span>{{ testing ? '测试中...' : '测试当前配置' }}</span>
          </button>
          <button
            :disabled="editing?.id === activeId"
            class="btn-primary w-full flex items-center justify-center gap-2 text-sm"
            @click="setActive"
          >
            设为当前使用
          </button>
        </template>
      </ModelForm>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { CustomModelConfig, ModelType } from '@/types/config'
import type { DiagnosticResult } from './ModelForm.vue'
import { testConnection as testConnectionApi } from '@/services/modelApi'

const props = defineProps<{
  modelType: ModelType
}>()

const store = useConfigStore()

const editingId = ref<string | null>(null)
const editing = ref<CustomModelConfig | null>(null)
const mobileStep = ref<'list' | 'editor'>('list')
const testing = ref(false)
const diagnostic = ref<DiagnosticResult | null>(null)

const models = computed(() => store.getCustomModelsByType(props.modelType))
const activeId = computed(() => 
  props.modelType === 'chat' 
    ? store.config.activeChatId 
    : store.config.activeVisionId
)

function selectModel(id: string) {
  const m = models.value.find(x => x.id === id)
  if (!m) return
  editingId.value = id
  editing.value = { ...m }
  diagnostic.value = null
  mobileStep.value = 'editor'
}

function addNew() {
  const newModel = store.addCustomModel(props.modelType)
  selectModel(newModel.id)
}

async function remove(id: string) {
  if (!confirm('确定要删除这个模型配置吗？')) return
  store.removeCustomModel(id)
  if (editingId.value === id) {
    editingId.value = null
    editing.value = null
  }
}

async function setActive() {
  if (!editing.value) return
  store.updateCustomModel(editing.value)
  store.setActiveModel(editing.value.id, props.modelType)
  diagnostic.value = { 
    success: true, 
    message: '已设为当前使用', 
    details: `模型「${editing.value.name}」已激活` 
  }
}

async function testConnection() {
  if (!editing.value) return
  testing.value = true
  diagnostic.value = null
  
  try {
    const result = await testConnectionApi(
      editing.value.baseUrl,
      editing.value.apiKey,
      editing.value.modelId,
      editing.value.apiFormat
    )
    diagnostic.value = {
      success: result.success,
      message: result.message,
      details: result.success ? `模型「${editing.value.modelId}」响应正常` : undefined
    }
  } catch (error) {
    diagnostic.value = {
      success: false,
      message: '测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }
  } finally {
    testing.value = false
  }
}

function onModelUpdate(val: CustomModelConfig) {
  editing.value = val
}

// 监听模型更新
watch(editing, (val) => {
  if (val) {
    store.updateCustomModel(val)
  }
}, { deep: true })
</script>
```

- [ ] **Step 2: 验证组件**

运行TypeScript检查：
```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 3: 提交代码**

```bash
git add src/components/settings/CustomModePanel.vue
git commit -m "feat: add CustomModePanel component"
```

---

### Task 8: 创建ServerModePanel组件

**Files:**
- Create: `src/components/settings/ServerModePanel.vue`

- [ ] **Step 1: 创建服务端模式面板组件**

```vue
<!-- src/components/settings/ServerModePanel.vue -->
<template>
  <div class="p-5 space-y-6">
    <div class="rounded-xl bg-accent-50 dark:bg-accent-900/20 p-4">
      <div class="flex items-start gap-3">
        <svg
          class="w-5 h-5 text-accent-600 dark:text-accent-400 mt-0.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <div>
          <p class="text-sm font-medium text-accent-800 dark:text-accent-200">
            服务端模式
          </p>
          <p class="text-xs text-accent-600 dark:text-accent-400 mt-1">
            所有请求将通过服务器代理处理，无需配置API Key
          </p>
        </div>
      </div>
    </div>

    <!-- 对话模型 -->
    <div>
      <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        对话模型
      </h4>
      <div
        v-if="chatModel"
        class="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
            <svg
              class="w-5 h-5 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {{ chatModel.name }}
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              {{ chatModel.modelId }}
            </p>
          </div>
          <span
            class="text-xs font-semibold px-2 py-1 rounded-full"
            :class="chatModel.available 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'"
          >
            {{ chatModel.available ? '可用' : '不可用' }}
          </span>
        </div>
      </div>
      <div v-else class="text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
        暂无可用的对话模型
      </div>
    </div>

    <!-- 视觉模型 -->
    <div>
      <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        视觉模型
      </h4>
      <div
        v-if="visionModel"
        class="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
            <svg
              class="w-5 h-5 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {{ visionModel.name }}
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              {{ visionModel.modelId }}
            </p>
          </div>
          <span
            class="text-xs font-semibold px-2 py-1 rounded-full"
            :class="visionModel.available 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'"
          >
            {{ visionModel.available ? '可用' : '不可用' }}
          </span>
        </div>
      </div>
      <div v-else class="text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
        暂无可用的视觉模型
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'

const store = useConfigStore()

const chatModel = computed(() => {
  return store.serverModels.find(m => 
    m.modelId === 'deepseek-chat' && m.available
  ) || store.serverModels[0]
})

const visionModel = computed(() => {
  return store.serverModels.find(m => 
    m.modelId === 'gpt-4o' && m.available
  ) || store.serverModels.find(m => m.modelId !== 'deepseek-chat')
})
</script>
```

- [ ] **Step 2: 验证组件**

运行TypeScript检查：
```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 3: 提交代码**

```bash
git add src/components/settings/ServerModePanel.vue
git commit -m "feat: add ServerModePanel component"
```

---

### Task 9: 创建ModelConfig主组件

**Files:**
- Create: `src/components/settings/ModelConfig.vue`
- Modify: `src/components/SettingsModal.vue`

- [ ] **Step 1: 创建主配置页面组件**

```vue
<!-- src/components/settings/ModelConfig.vue -->
<template>
  <div class="space-y-6">
    <!-- 模式切换 -->
    <div>
      <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
        配置模式
      </label>
      <div class="flex gap-2">
        <button
          class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="mode === 'custom' 
            ? 'bg-accent-600 text-white' 
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
          @click="setMode('custom')"
        >
          自定义配置
        </button>
        <button
          class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="mode === 'server' 
            ? 'bg-accent-600 text-white' 
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
          @click="setMode('server')"
        >
          服务端模式
        </button>
      </div>
    </div>

    <!-- 根据模式显示不同内容 -->
    <CustomModePanel
      v-if="mode === 'custom'"
      :model-type="modelType"
    />
    <ServerModePanel v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { ModelType } from '@/types/config'
import CustomModePanel from './CustomModePanel.vue'
import ServerModePanel from './ServerModePanel.vue'

const props = defineProps<{
  modelType: ModelType
}>()

const store = useConfigStore()

const mode = computed(() => store.mode)

function setMode(newMode: 'custom' | 'server') {
  store.setMode(newMode)
}
</script>
```

- [ ] **Step 2: 更新SettingsModal.vue**

需要更新SettingsModal.vue以使用新的ModelConfig组件。首先读取当前文件内容，然后进行修改。

- [ ] **Step 3: 验证组件**

运行TypeScript检查：
```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 4: 提交代码**

```bash
git add src/components/settings/ModelConfig.vue src/components/SettingsModal.vue
git commit -m "feat: add ModelConfig main component"
```

---

### Task 10: 集成和测试

**Files:**
- Modify: `src/components/SettingsModal.vue`
- Modify: `src/stores/app-core.ts`

- [ ] **Step 1: 更新SettingsModal.vue**

更新设置模态框以支持新的配置模式：

```vue
<!-- 更新SettingsModal.vue中的标签页 -->
<script setup lang="ts">
// ... 现有代码

import ModelConfig from './settings/ModelConfig.vue'

// 添加模型类型状态
const modelType = ref<ModelType>('chat')

// 更新标签页
const tabs = [
  { label: '对话模型', value: 'chat' as ModelType },
  { label: '视觉模型', value: 'vision' as ModelType }
]
</script>

<!-- 更新模板中的内容区域 -->
<template>
  <!-- ... 现有代码 -->
  
  <!-- Content -->
  <div class="flex-1 overflow-y-auto">
    <ModelConfig :model-type="modelType" />
  </div>
  
  <!-- ... 现有代码 -->
</template>
```

- [ ] **Step 2: 运行测试**

```bash
cd "D:\ai英语解题助手"; npm test
```

- [ ] **Step 3: 运行lint检查**

```bash
cd "D:\ai英语解题助手"; npm run lint
```

- [ ] **Step 4: 运行TypeScript检查**

```bash
cd "D:\ai英语解题助手"; npx vue-tsc --noEmit
```

- [ ] **Step 5: 提交代码**

```bash
git add -A
git commit -m "feat: complete model config redesign integration"
```

---

## 验收标准

1. ✅ 用户可以切换自定义/服务端模式
2. ✅ 自定义模式下可以配置API Key、Base URL、模型ID
3. ✅ 输入Base URL后可以自动拉取模型列表
4. ✅ 支持多种API格式（OpenAI、DeepSeek、智谱）
5. ✅ API Key安全存储
6. ✅ 服务端模式下显示只读模型信息
7. ✅ 从旧配置平滑迁移
8. ✅ 所有测试通过
