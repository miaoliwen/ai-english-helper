<template>
  <div class="p-5 space-y-4 md:max-h-[60vh] md:overflow-y-auto pb-nav">
    <button
      v-if="preset"
      class="md:hidden flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 -ml-1 px-1 py-1 rounded-lg touch-target"
      aria-label="返回预设列表"
      @click="$emit('back')"
    >
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
      </svg>
      返回列表
    </button>
    <template v-if="preset">
      <div>
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">预设昵称</label>
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
        <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">模型 ID</label>
        <input
          v-model="local.modelId"
          type="text"
          placeholder="例如：deepseek-chat"
          enterkeyhint="next"
          autocomplete="off"
          class="input-field text-sm"
        >
        <p class="mt-1 text-[11px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
          API Key 和 Base URL 由服务端环境变量配置，前端无需填写
        </p>
      </div>
      <div class="pt-2 flex flex-col gap-2">
        <slot name="actions" />
      </div>
      <div
        v-if="diagnostic"
        class="rounded-xl p-3.5 text-xs"
        :class="diagnostic.success ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'"
      >
        <p class="font-semibold mb-0.5">{{ diagnostic.message }}</p>
        <p v-if="diagnostic.details">{{ diagnostic.details }}</p>
      </div>
    </template>
    <div v-else class="hidden md:block text-center text-sm text-neutral-400 py-10">
      选择一个预设或新增一个开始
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ModelPreset } from '@/types'

export interface DiagnosticResult {
  success: boolean
  message: string
  details?: string
}

const props = defineProps<{
  preset: ModelPreset | null
  diagnostic: DiagnosticResult | null
}>()

const emit = defineEmits<{
  'update:preset': [value: ModelPreset]
  'back': []
}>()

const local = ref<ModelPreset>({
  id: props.preset?.id ?? '',
  name: props.preset?.name ?? '',
  modelId: props.preset?.modelId ?? ''
})

watch(() => props.preset?.id, (newId) => {
  if (newId && newId !== local.value.id) {
    const p = props.preset
    if (p) local.value = { ...p }
  }
}, { immediate: true })

watch(local, (val) => {
  emit('update:preset', { ...val })
}, { deep: true })
</script>
