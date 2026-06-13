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
          :class="errors.name ? 'border-red-400 dark:border-red-600' : ''"
          @input="clearError('name')"
        >
        <p v-if="errors.name" class="mt-1 text-xs text-red-500">{{ errors.name }}</p>
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
          :class="errors.baseUrl ? 'border-red-400 dark:border-red-600' : ''"
          @input="clearError('baseUrl')"
        >
        <p v-if="errors.baseUrl" class="mt-1 text-xs text-red-500">{{ errors.baseUrl }}</p>
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
          :class="errors.apiKey ? 'border-red-400 dark:border-red-600' : ''"
          @input="clearError('apiKey')"
        >
        <p v-if="errors.apiKey" class="mt-1 text-xs text-red-500">{{ errors.apiKey }}</p>
      </div>

      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">模型ID</label>
        <ModelListSelector
          :base-url="local.baseUrl"
          :model-id="local.modelId"
          :api-key="local.apiKey"
          :api-format="local.apiFormat"
          :class="errors.modelId ? 'border-red-400 dark:border-red-600' : ''"
          @update:base-url="local.baseUrl = $event"
          @update:model-id="local.modelId = $event"
          @update:api-format="local.apiFormat = $event"
        />
        <p v-if="errors.modelId" class="mt-1 text-xs text-red-500">{{ errors.modelId }}</p>
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
import { reactive, watch } from 'vue'
import type { CustomModelConfig } from '@/types/config'
import ModelListSelector from './ModelListSelector.vue'

export interface DiagnosticResult {
  success: boolean
  message: string
  details?: string
}

export interface ValidationErrors {
  name?: string
  baseUrl?: string
  apiKey?: string
  modelId?: string
}

const props = defineProps<{
  model: CustomModelConfig | null
  diagnostic: DiagnosticResult | null
}>()

const emit = defineEmits<{
  'update:model': [value: CustomModelConfig]
  'back': []
}>()

const local = reactive<CustomModelConfig>({
  id: '',
  name: '',
  apiKey: '',
  baseUrl: '',
  modelId: '',
  apiFormat: 'auto'
})

const errors = reactive<ValidationErrors>({})

function clearError(field: keyof ValidationErrors) {
  delete errors[field]
}

function validate(): boolean {
  let valid = true
  ;(Object.keys(errors) as (keyof ValidationErrors)[]).forEach(k => delete errors[k])

  if (!local.name.trim()) {
    errors.name = '请输入模型名称'
    valid = false
  }

  if (!local.baseUrl.trim()) {
    errors.baseUrl = '请输入 Base URL'
    valid = false
  } else if (!/^https?:\/\/.+/.test(local.baseUrl.trim())) {
    errors.baseUrl = '请输入有效的 URL（以 http:// 或 https:// 开头）'
    valid = false
  }

  if (!local.apiKey.trim()) {
    errors.apiKey = '请输入 API Key'
    valid = false
  }

  if (!local.modelId.trim()) {
    errors.modelId = '请输入或选择一个模型 ID'
    valid = false
  }

  return valid
}

defineExpose({ validate })

watch(() => props.model, (m) => {
  if (m) {
    local.id = m.id
    local.name = m.name
    local.apiKey = m.apiKey
    local.baseUrl = m.baseUrl
    local.modelId = m.modelId
    local.apiFormat = m.apiFormat
  }
}, { immediate: true, deep: true })

watch(local, (val) => {
  emit('update:model', { ...val })
}, { deep: true })
</script>
