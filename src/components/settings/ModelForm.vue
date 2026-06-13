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
import type { CustomModelConfig } from '@/types/config'
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