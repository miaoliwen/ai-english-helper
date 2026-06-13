# Phase 1: 代码质量 + TypeScript 严格化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 提升 TypeScript 严格度，消除 `any` 类型，建立 ESLint，拆分大文件

**Architecture:** 先配置后编码，先工具后组件。每步可独立验证（`vue-tsc --noEmit`）。

**Tech Stack:** TypeScript 5.4, Vue 3.4, Pinia, Vite 5, ESLint

---

### Task 1: TypeScript 严格度增强

**Files:**
- Modify: `tsconfig.json`

- [ ] **Step 1: 追加 TS 严格选项**

修改 `tsconfig.json`，在 `compilerOptions` 中追加：

```json
{
  "compilerOptions": {
    "noUncheckedIndexedAccess": true,
    "noImplicitReturns": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

- [ ] **Step 2: 运行类型检查**

Run: `npm run build`

如果有类型错误，逐行修复直到通过。常见修复模式：

- `noUncheckedIndexedAccess` 修复：对数组/对象索引访问后添加空值检查
```typescript
// 修复前
return modelPresets.value.chat[0]
// 修复后
return modelPresets.value.chat[0] ?? null
```

- `noImplicitReturns` 修复：为所有可能遗漏 return 的函数补全：
```typescript
function loadActiveChatId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CHAT_ID_KEY)
  } catch { /* ignore */ }
  return null  // 已有，无需修改
}
```

- [ ] **Step 3: 确认构建通过**

Run: `npm run build`
Expected: 零 error，dist/ 正常输出

---

### Task 2: 消除 `any` 类型

**Files:**
- Modify: `src/services/config.ts:40-65`
- Modify: `src/stores/app.ts:164`

- [ ] **Step 1: 修复 config.ts 的 debounce 泛型**

将 `.ts` 文件中的 `any` 替换为 `unknown`，添加类型断言：

```typescript
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingResolve: ((value: ReturnType<T>) => void) | null = null
  let pendingReject: ((reason: unknown) => void) | null = null
  let latestArgs: Parameters<T> | null = null

  return function (this: ThisParameterType<T>, ...args: Parameters<T>): Promise<ReturnType<T>> {
    latestArgs = args
    if (timer) clearTimeout(timer)

    return new Promise((resolve, reject) => {
      pendingResolve = resolve
      pendingReject = reject
      timer = setTimeout(async () => {
        try {
          const result = await fn.apply(this, latestArgs!)
          pendingResolve?.(result)
        } catch (err) {
          pendingReject?.(err)
        } finally {
          timer = null
          pendingResolve = null
          pendingReject = null
        }
      }, delayMs)
    })
  }
}
```

- [ ] **Step 2: 修复 stores/app.ts 的 normalizePresets**

将 `raw: any` 改为 `raw: unknown`，添加类型守卫：

```typescript
function normalizePresets(raw: unknown): ModelPresets {
  const data = raw as ModelPresets | null | undefined
  const chat: ModelPreset[] = Array.isArray(data?.chat) ? data.chat : []
  const vision: ModelPreset[] = Array.isArray(data?.vision) ? data.vision : []

  if (chat.length === 0) chat.push(buildDefaultChatPreset())
  if (vision.length === 0) vision.push(buildDefaultVisionPreset())

  const activeChatId = chat.some((p) => p.id === data?.activeChatId) ? data.activeChatId : chat[0].id
  const activeVisionId = vision.some((p) => p.id === data?.activeVisionId) ? data.activeVisionId : vision[0].id

  return { chat, vision, activeChatId, activeVisionId }
}
```

- [ ] **Step 3: 验证构建通过**

Run: `npm run build`
Expected: 零 error

---

### Task 3: 安装并配置 ESLint

**Files:**
- Modify: `package.json`
- Create: `eslint.config.js`
- Modify: `.gitignore` (如需要)

- [ ] **Step 1: 安装 ESLint 依赖**

```bash
npm install -D eslint @eslint/js typescript-eslint eslint-plugin-vue
```

- [ ] **Step 2: 创建 ESLint 配置**

创建 `eslint.config.js`：

```javascript
import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['src/**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: tseslint.parser
      }
    }
  },
  {
    rules: {
      'vue/multi-word-component-names': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }]
    }
  },
  {
    ignores: ['dist/', 'node_modules/']
  }
]
```

- [ ] **Step 3: 更新 package.json 的 lint 脚本**

```json
{
  "scripts": {
    "lint": "eslint ."
  }
}
```

- [ ] **Step 4: 运行 lint 修复**

```bash
npm run lint -- --fix
```

逐个处理剩余 warnings（主要是 `no-explicit-any` 的 warn，现阶段允许）。

- [ ] **Step 5: 验证构建通过**

Run: `npm run build`
Expected: 零 error

---

### Task 4: 拆分 SettingsModal.vue 为子组件

**Files:**
- Create: `src/components/settings/PresetForm.vue`
- Create: `src/components/settings/PresetList.vue`
- Modify: `src/components/SettingsModal.vue`

- [ ] **Step 1: 创建 PresetForm.vue**

```vue
<template>
  <div class="p-5 space-y-4 md:max-h-[60vh] md:overflow-y-auto pb-nav">
    <template v-if="preset">
      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">预设昵称</label>
        <input v-model="local.name" type="text" placeholder="例如：DeepSeek 主力" enterkeyhint="next" autocomplete="off" class="input-field text-sm" />
      </div>
      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">模型 ID</label>
        <input v-model="local.modelId" type="text" placeholder="例如：deepseek-chat" enterkeyhint="next" autocomplete="off" class="input-field text-sm" />
      </div>
      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Base URL</label>
        <input v-model="local.baseUrl" type="text" placeholder="例如：https://api.deepseek.com" inputmode="url" enterkeyhint="next" autocomplete="url" class="input-field text-sm" />
      </div>
      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">API Key</label>
        <input v-model="local.apiKey" :type="showKey ? 'text' : 'password'" placeholder="sk-..." enterkeyhint="done" autocomplete="off" class="input-field text-sm" />
      </div>
      <div class="pt-2 flex flex-col gap-2">
        <slot name="actions" :preset="local" />
      </div>
      <div v-if="diagnostic" class="rounded-xl p-3.5 text-xs"
           :class="diagnostic.success ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'">
        <p class="font-semibold mb-0.5">{{ diagnostic.message }}</p>
        <p v-if="diagnostic.details">{{ diagnostic.details }}</p>
      </div>
    </template>
    <div v-else class="text-center text-sm text-neutral-400 py-10">
      选择一个预设或新增一个开始
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ModelPreset } from '@/types'
import type { DiagnosticResult } from '@/utils/diagnostics'

const props = defineProps<{
  preset: ModelPreset | null
  diagnostic: DiagnosticResult | null
}>()

const emit = defineEmits<{
  'update:preset': [value: ModelPreset]
}>()

const showKey = ref(false)

const local = ref<ModelPreset>({ ...props.preset ?? { id: '', name: '', baseUrl: '', apiKey: '', modelId: '' } })

watch(() => props.preset, (val) => {
  if (val) local.value = { ...val }
}, { immediate: true })

watch(local, (val) => {
  emit('update:preset', { ...val })
}, { deep: true })
</script>
```

- [ ] **Step 2: 简化 SettingsModal.vue，使用新组件**

将 SettingsModal.vue 模板中的编辑器部分（`.p-5.space-y-4` 区域）替换为：

```vue
<PresetForm
  :preset="editing"
  :diagnostic="diagnostic"
  @update:preset="editing = $event"
>
  <template #actions="{ preset }">
    <button @click="testConnection" :disabled="testing"
            class="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
      {{ testing ? '测试中...' : '测试当前预设' }}
    </button>
    <button @click="setActive" :disabled="preset.id === currentActiveId"
            class="btn-primary w-full flex items-center justify-center gap-2 text-sm">
      设为当前使用
    </button>
  </template>
</PresetForm>
```

- [ ] **Step 3: 验证构建通过**

Run: `npm run build`
Expected: 零 error

---

### Task 5: 拆分 stores/app.ts 为子 store

**Files:**
- Create: `src/stores/model.ts`
- Create: `src/stores/favorites.ts`
- Modify: `src/stores/app.ts`

- [ ] **Step 1: 创建 stores/model.ts**

```typescript
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { ModelPreset, ModelPresets } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'
import { encryptConfig, decryptConfig } from '@/utils/crypto'

const MODEL_PRESETS_KEY = 'aieh-model-presets'

function buildDefaultChatPreset(): ModelPreset {
  return {
    id: uuidv4(),
    name: '默认对话',
    baseUrl: import.meta.env.VITE_DEFAULT_CHAT_BASE_URL || '',
    apiKey: '',
    modelId: import.meta.env.VITE_DEFAULT_CHAT_MODEL || ''
  }
}

function buildDefaultVisionPreset(): ModelPreset {
  return {
    id: uuidv4(),
    name: '默认视觉',
    baseUrl: import.meta.env.VITE_DEFAULT_VISION_BASE_URL || '',
    apiKey: '',
    modelId: import.meta.env.VITE_DEFAULT_VISION_MODEL || ''
  }
}

function normalizePresets(raw: unknown): ModelPresets {
  const data = raw as ModelPresets | null | undefined
  const chat: ModelPreset[] = Array.isArray(data?.chat) ? data.chat : []
  const vision: ModelPreset[] = Array.isArray(data?.vision) ? data.vision : []

  if (chat.length === 0) chat.push(buildDefaultChatPreset())
  if (vision.length === 0) vision.push(buildDefaultVisionPreset())

  const activeChatId = chat.some((p) => p.id === data?.activeChatId) ? data.activeChatId : chat[0].id
  const activeVisionId = vision.some((p) => p.id === data?.activeVisionId) ? data.activeVisionId : vision[0].id

  return { chat, vision, activeChatId, activeVisionId }
}

async function loadModelPresets(): Promise<ModelPresets> {
  try {
    const saved = localStorage.getItem(MODEL_PRESETS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const decrypted = await decryptConfig(parsed)
      if (decrypted.chat || decrypted.vision) {
        return normalizePresets(decrypted)
      }
    }
  } catch { /* ignore */ }
  return normalizePresets(null)
}

async function saveModelPresets(presets: ModelPresets) {
  const encrypted = await encryptConfig(presets as unknown as Record<string, string>)
  localStorage.setItem(MODEL_PRESETS_KEY, JSON.stringify(encrypted))
}

export const useModelStore = defineStore('model', () => {
  const modelPresets = ref<ModelPresets>({
    chat: [], vision: [], activeChatId: '', activeVisionId: ''
  })

  loadModelPresets().then((presets) => {
    modelPresets.value = presets
  })

  const activeChatPreset = computed(() =>
    modelPresets.value.chat.find((p) => p.id === modelPresets.value.activeChatId) || modelPresets.value.chat[0] ?? null
  )
  const activeVisionPreset = computed(() =>
    modelPresets.value.vision.find((p) => p.id === modelPresets.value.activeVisionId) || modelPresets.value.vision[0] ?? null
  )

  async function setActiveChatPreset(id: string) {
    if (!modelPresets.value.chat.some((p) => p.id === id)) return
    modelPresets.value = { ...modelPresets.value, activeChatId: id }
    await saveModelPresets(modelPresets.value)
  }

  async function setActiveVisionPreset(id: string) {
    if (!modelPresets.value.vision.some((p) => p.id === id)) return
    modelPresets.value = { ...modelPresets.value, activeVisionId: id }
    await saveModelPresets(modelPresets.value)
  }

  async function upsertChatPreset(preset: ModelPreset) {
    const list = [...modelPresets.value.chat]
    const idx = list.findIndex((p) => p.id === preset.id)
    if (idx >= 0) list[idx] = preset
    else list.push(preset)
    modelPresets.value = { ...modelPresets.value, chat: list }
    await saveModelPresets(modelPresets.value)
  }

  async function upsertVisionPreset(preset: ModelPreset) {
    const list = [...modelPresets.value.vision]
    const idx = list.findIndex((p) => p.id === preset.id)
    if (idx >= 0) list[idx] = preset
    else list.push(preset)
    modelPresets.value = { ...modelPresets.value, vision: list }
    await saveModelPresets(modelPresets.value)
  }

  async function removeChatPreset(id: string) {
    const list = modelPresets.value.chat.filter((p) => p.id !== id)
    if (list.length === 0) list.push(buildDefaultChatPreset())
    const activeId = modelPresets.value.activeChatId === id ? list[0].id : modelPresets.value.activeChatId
    modelPresets.value = { ...modelPresets.value, chat: list, activeChatId: activeId }
    await saveModelPresets(modelPresets.value)
  }

  async function removeVisionPreset(id: string) {
    const list = modelPresets.value.vision.filter((p) => p.id !== id)
    if (list.length === 0) list.push(buildDefaultVisionPreset())
    const activeId = modelPresets.value.activeVisionId === id ? list[0].id : modelPresets.value.activeVisionId
    modelPresets.value = { ...modelPresets.value, vision: list, activeVisionId: activeId }
    await saveModelPresets(modelPresets.value)
  }

  return {
    modelPresets, activeChatPreset, activeVisionPreset,
    setActiveChatPreset, setActiveVisionPreset,
    upsertChatPreset, upsertVisionPreset,
    removeChatPreset, removeVisionPreset
  }
})
```

需在顶部添加 `import { computed } from 'vue'`。

- [ ] **Step 2: 创建 stores/favorites.ts**

```typescript
import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { FavoriteItem } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'
import { saveFavorite, getAllFavorites, deleteFavorite, searchFavorites } from '@/db'

export const useFavoritesStore = defineStore('favorites', () => {
  const favorites = ref<FavoriteItem[]>([])

  async function loadAll() {
    favorites.value = await getAllFavorites()
  }

  async function add(item: Omit<FavoriteItem, 'id' | 'createdAt'>) {
    const favorite: FavoriteItem = { ...item, id: uuidv4(), createdAt: Date.now() }
    await saveFavorite(favorite)
    favorites.value = await getAllFavorites()
    return favorite
  }

  async function remove(id: string) {
    await deleteFavorite(id)
    favorites.value = await getAllFavorites()
  }

  async function search(query: string) {
    if (!query.trim()) {
      favorites.value = await getAllFavorites()
      return
    }
    favorites.value = await searchFavorites(query)
  }

  return { favorites, loadAll, add, remove, search }
})
```

- [ ] **Step 3: 重构 stores/app.ts**

将原 `app.ts` 的 OCR + Chat 逻辑保留到 `src/stores/app-core.ts`，`app.ts` 变为聚合入口。

创建 `src/stores/app-core.ts`，包含：

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OCRResult, ChatSession, ChatMessage, ModelSettings, ModelPresets } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'
import { useModelStore } from './model'
import { useFavoritesStore } from './favorites'
import {
  saveOCRResult, getOCRResult, getAllOCRResults, deleteOCRResult,
  saveChatSession, getChatSession, getAllChatSessions, deleteChatSession
} from '@/db'

const ACTIVE_CHAT_ID_KEY = 'aieh-active-chat-id'

function saveActiveChatId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_CHAT_ID_KEY, id)
    else localStorage.removeItem(ACTIVE_CHAT_ID_KEY)
  } catch { /* ignore */ }
}

function loadActiveChatId(): string | null {
  try { return localStorage.getItem(ACTIVE_CHAT_ID_KEY) }
  catch { return null }
}

function stripExifData(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith('data:image/')) { resolve(dataUrl); return }
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export const useAppStore = defineStore('app', () => {
  const currentOCR = ref<OCRResult | null>(null)
  const currentChat = ref<ChatSession | null>(null)
  const isProcessing = ref(false)
  const streamContent = ref('')
  const recentOCRs = ref<OCRResult[]>([])
  const recentChats = ref<ChatSession[]>([])
  const settingsModalOpen = ref(false)

  const modelStore = useModelStore()
  const favoritesStore = useFavoritesStore()

  const modelSettings = computed<ModelSettings>(() => {
    const chat = modelStore.activeChatPreset
    const vision = modelStore.activeVisionPreset
    return {
      chatModel: chat?.modelId || '',
      chatBaseUrl: chat?.baseUrl || '',
      chatApiKey: chat?.apiKey || '',
      visionModel: vision?.modelId || '',
      visionBaseUrl: vision?.baseUrl || '',
      visionApiKey: vision?.apiKey || ''
    }
  })

  const savedChatId = loadActiveChatId()
  if (savedChatId) {
    getChatSession(savedChatId).then((session) => {
      if (session) {
        currentChat.value = session
        if (session.ocrResultId) {
          getOCRResult(session.ocrResultId).then((ocr) => {
            if (ocr) currentOCR.value = ocr
          })
        }
      }
    })
  }

  const hasCurrentOCR = computed(() => !!currentOCR.value)
  const hasCurrentChat = computed(() => !!currentChat.value)
  const isChatModelConfigured = computed(() =>
    !!(modelSettings.value.chatBaseUrl?.trim() && modelSettings.value.chatApiKey?.trim() && modelSettings.value.chatModel?.trim())
  )
  const isVisionModelConfigured = computed(() =>
    !!(modelSettings.value.visionBaseUrl?.trim() && modelSettings.value.visionApiKey?.trim() && modelSettings.value.visionModel?.trim())
  )
  const isModelConfigured = computed(() => isChatModelConfigured.value || isVisionModelConfigured.value)

  function openSettings() { settingsModalOpen.value = true }

  async function loadRecents() {
    recentOCRs.value = await getAllOCRResults()
    recentChats.value = await getAllChatSessions()
    favoritesStore.favorites = await (await import('@/db')).getAllFavorites()
  }

  // ... (保留 createOCRResult, loadOCR, clearCurrentOCR, deleteOCR,
  //       createChatSession, loadChat, addMessageToChat, deleteChat,
  //       removeLastMessage, addToFavorites, removeFavorite, searchFavoriteItems,
  //       setStreamContent, appendStreamContent, clearStreamContent 等方法)

  return {
    currentOCR, currentChat, isProcessing, streamContent,
    recentOCRs, recentChats, settingsModalOpen,
    modelSettings, hasCurrentOCR, hasCurrentChat,
    isChatModelConfigured, isVisionModelConfigured, isModelConfigured,
    openSettings, loadRecents,
    // ... 保留所有方法
  }
})
```

更新 `src/stores/app.ts` 为聚合入口：

```typescript
export { useModelStore } from './model'
export { useFavoritesStore } from './favorites'
export { useAppStore } from './app-core'
```

更新所有导入 `@/stores/app` 的其他文件，确保导入 `useModelStore` 和 `useFavoritesStore` 的地方依赖新的聚合入口（不需要改动——聚合入口重新导出了所有 store）。

- [ ] **Step 4: 验证构建通过**

Run: `npm run build`
Expected: 零 error

---

---

### Task 6: 提取 UploadView 中的相机和 OCR 逻辑为 composable

**Files:**
- Create: `src/composables/useImageUpload.ts`
- Modify: `src/views/UploadView.vue`

- [ ] **Step 1: 创建 useImageUpload.ts**

```typescript
import { ref } from 'vue'

export interface UploadResult {
  file: File
  dataUrl: string
}

export function useImageUpload() {
  const dragOver = ref(false)
  const fileInput = ref<HTMLInputElement | null>(null)

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    dragOver.value = true
  }

  function onDragLeave() {
    dragOver.value = false
  }

  function onDrop(e: DragEvent): UploadResult | null {
    e.preventDefault()
    dragOver.value = false
    const file = e.dataTransfer?.files?.[0]
    if (!file || !file.type.startsWith('image/')) return null
    return { file, dataUrl: URL.createObjectURL(file) }
  }

  function onFileSelected(e: Event): UploadResult | null {
    const input = e.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file || !file.type.startsWith('image/')) return null
    return { file, dataUrl: URL.createObjectURL(file) }
  }

  function triggerFileInput() {
    fileInput.value?.click()
  }

  return { dragOver, fileInput, onDragOver, onDragLeave, onDrop, onFileSelected, triggerFileInput }
}
```

- [ ] **Step 2: 更新 UploadView.vue**

将 `src/views/UploadView.vue` 中的拖拽/文件选取逻辑替换为 `useImageUpload` composable，保持原有 UI 结构不变。

- [ ] **Step 3: 验证构建通过**

Run: `npm run build`
Expected: 零 error

---

### 验证清单

- [ ] `npm run build` 通过（vue-tsc + vite）
- [ ] `npm run lint` 零 error
- [ ] 零 `any` 类型
- [ ] SettingsModal 功能正常（手动验证：打开、编辑、保存、切换预设）
- [ ] 应用路由功能正常（手动验证：首页 → 上传 → 聊天 → 收藏）
