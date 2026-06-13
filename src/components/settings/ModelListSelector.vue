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