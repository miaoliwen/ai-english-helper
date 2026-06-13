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