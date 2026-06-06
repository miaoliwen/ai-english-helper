<template>
  <Transition name="scale">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
      <div class="absolute inset-0 bg-neutral-900/30 dark:bg-black/50 backdrop-blur-sm"></div>
      <div class="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-accent-50 dark:bg-accent-900/20 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">模型预设</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">管理多套对话/视觉模型，顶部下拉中可快速切换</p>
            </div>
          </div>
          <button @click="close" class="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all touch-target" aria-label="关闭">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="px-6 pt-4 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <button v-for="t in tabs" :key="t.value" @click="activeTab = t.value"
                  class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
                  :class="activeTab === t.value
                    ? 'border-accent-600 text-accent-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'">
            {{ t.label }}
            <span class="ml-1 text-xs text-neutral-400">{{ t.value === 'chat' ? store.modelPresets.chat.length : store.modelPresets.vision.length }}</span>
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <!-- Preset list (desktop: 始终可见; mobile: 仅在 mobileStep==='list' 时可见) -->
            <div class="md:border-r border-neutral-100 dark:border-neutral-800 p-3 space-y-1 md:max-h-[60vh] md:overflow-y-auto"
                 :class="mobileStep === 'list' ? 'block' : 'hidden md:block'">
              <button @click="addNew" class="w-full flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 transition-colors touch-target">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                新增预设
              </button>
              <div v-for="p in currentList" :key="p.id"
                   @click="selectPreset(p.id)"
                   class="px-3 py-2.5 rounded-xl cursor-pointer transition-colors group"
                   :class="p.id === editingId ? 'bg-accent-50 dark:bg-accent-900/20' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'">
                <div class="flex items-center gap-2">
                  <span class="flex-1 truncate text-sm font-medium"
                        :class="p.id === currentActiveId ? 'text-accent-700 dark:text-accent-400' : 'text-neutral-800 dark:text-neutral-200'">
                    {{ p.name || '未命名预设' }}
                  </span>
                  <span v-if="p.id === currentActiveId" class="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent-100 dark:bg-accent-900/40 text-accent-700 dark:text-accent-300">
                    使用中
                  </span>
                  <!-- 移动端：右箭头提示进入编辑 -->
                  <svg class="md:hidden w-4 h-4 text-neutral-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                  </svg>
                </div>
                <p class="text-xs text-neutral-400 truncate mt-0.5 font-mono">
                  {{ p.modelId || '—' }}
                </p>
                <button v-if="currentList.length > 1" @click.stop="remove(p.id)"
                        class="mt-1 px-2 py-1 rounded-md text-xs text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 sm:opacity-0 sm:group-hover:opacity-100 transition-all touch-target">
                  删除
                </button>
              </div>
            </div>

            <!-- Editor -->
            <div class="p-5 space-y-4 md:max-h-[60vh] md:overflow-y-auto pb-nav"
                 :class="mobileStep === 'editor' ? 'block' : 'hidden md:block'">
              <!-- 移动端：编辑器顶部"返回" -->
              <button v-if="editing" @click="mobileStep = 'list'"
                      class="md:hidden flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 -ml-1 px-1 py-1 rounded-lg touch-target"
                      aria-label="返回预设列表">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                </svg>
                返回列表
              </button>
              <template v-if="editing">
                <div>
                  <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">预设昵称</label>
                  <input v-model="editing.name" type="text" placeholder="例如：DeepSeek 主力" enterkeyhint="next" autocomplete="off" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">模型 ID</label>
                  <input v-model="editing.modelId" type="text" placeholder="例如：deepseek-chat" enterkeyhint="next" autocomplete="off" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Base URL</label>
                  <input v-model="editing.baseUrl" type="text" placeholder="例如：https://api.deepseek.com" inputmode="url" enterkeyhint="next" autocomplete="url" class="input-field text-sm" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">API Key</label>
                  <div class="relative">
                    <input v-model="editing.apiKey" :type="showKey ? 'text' : 'password'" placeholder="sk-..." enterkeyhint="done" autocomplete="off" class="input-field text-sm pr-12" />
                    <button @click="showKey = !showKey" type="button" :aria-label="showKey ? '隐藏 API Key' : '显示 API Key'" class="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-600 touch-target">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                        <path v-if="showKey" stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                        <path v-else stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178zM15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                    </button>
                  </div>
                </div>

                <div class="pt-2 flex flex-col gap-2">
                  <button @click="testConnection" :disabled="testing" class="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
                    <svg v-if="testing" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
                    </svg>
                    <span>{{ testing ? '测试中...' : '测试当前预设' }}</span>
                  </button>
                  <button @click="setActive" :disabled="editing.id === currentActiveId"
                          class="btn-primary w-full flex items-center justify-center gap-2 text-sm">
                    设为当前使用
                  </button>
                </div>

                <div v-if="diagnostic" class="rounded-xl p-3.5 text-xs"
                     :class="diagnostic.success ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/10 text-red-700 dark:text-red-400'">
                  <p class="font-semibold mb-0.5">{{ diagnostic.message }}</p>
                  <p v-if="diagnostic.details">{{ diagnostic.details }}</p>
                </div>
              </template>
              <div v-else class="hidden md:block text-center text-sm text-neutral-400 py-10">
                选择一个预设或新增一个开始
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3 shrink-0">
          <button @click="close" class="btn-ghost text-sm touch-target">关闭</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, toRef, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import type { ModelPreset } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'
import { diagnoseDeepSeekConfig, diagnoseMimoConfig, type DiagnosticResult } from '@/utils/diagnostics'
import { useScrollLock } from '@/composables/useScrollLock'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

// 锁住 body 滚动，避免移动端背景穿透
useScrollLock(toRef(props, 'visible'))

const store = useAppStore()
type Tab = 'chat' | 'vision'
const activeTab = ref<Tab>('chat')
const tabs = [
  { label: '对话模型', value: 'chat' as Tab },
  { label: '视觉模型', value: 'vision' as Tab }
]

const editingId = ref<string | null>(null)
const editing = ref<ModelPreset | null>(null)
const mobileStep = ref<'list' | 'editor'>('list')
const showKey = ref(false)
const testing = ref(false)
const diagnostic = ref<DiagnosticResult | null>(null)

const currentList = computed<ModelPreset[]>(() =>
  activeTab.value === 'chat' ? store.modelPresets.chat : store.modelPresets.vision
)
const currentActiveId = computed(() =>
  activeTab.value === 'chat' ? store.modelPresets.activeChatId : store.modelPresets.activeVisionId
)

function selectPreset(id: string) {
  const p = currentList.value.find((x) => x.id === id)
  if (!p) return
  editingId.value = id
  // 深拷贝避免直接改 store 数据
  editing.value = { ...p }
  diagnostic.value = null
  mobileStep.value = 'editor'
}

function addNew() {
  const id = uuidv4()
  const p: ModelPreset = {
    id,
    name: activeTab.value === 'chat' ? '新对话预设' : '新视觉预设',
    baseUrl: '',
    apiKey: '',
    modelId: ''
  }
  if (activeTab.value === 'chat') {
    store.upsertChatPreset(p)
  } else {
    store.upsertVisionPreset(p)
  }
  selectPreset(id)
}

async function remove(id: string) {
  if (!confirm('确定要删除这个预设吗？')) return
  if (activeTab.value === 'chat') {
    await store.removeChatPreset(id)
  } else {
    await store.removeVisionPreset(id)
  }
  if (editingId.value === id) {
    editingId.value = null
    editing.value = null
  }
}

async function setActive() {
  if (!editing.value) return
  // 先持久化编辑
  if (activeTab.value === 'chat') {
    await store.upsertChatPreset(editing.value)
    await store.setActiveChatPreset(editing.value.id)
  } else {
    await store.upsertVisionPreset(editing.value)
    await store.setActiveVisionPreset(editing.value.id)
  }
  diagnostic.value = { success: true, message: '已设为当前使用', details: `预设「${editing.value.name}」已激活` }
}

// 编辑实时同步：用户改表单字段就 upsert
watch(editing, async (val) => {
  if (!val) return
  if (activeTab.value === 'chat') {
    await store.upsertChatPreset(val)
  } else {
    await store.upsertVisionPreset(val)
  }
}, { deep: true })

async function testConnection() {
  if (!editing.value) return
  testing.value = true
  diagnostic.value = null
  try {
    diagnostic.value = activeTab.value === 'chat'
      ? await diagnoseDeepSeekConfig(editing.value.baseUrl, editing.value.apiKey, editing.value.modelId)
      : await diagnoseMimoConfig(editing.value.baseUrl, editing.value.apiKey, editing.value.modelId)
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

function close() { emit('update:visible', false) }

watch(() => props.visible, (val) => {
  if (val) {
    // 默认选中当前激活项
    editingId.value = currentActiveId.value
    const p = currentList.value.find((x) => x.id === editingId.value)
    editing.value = p ? { ...p } : null
    diagnostic.value = null
    mobileStep.value = 'list'
  }
})

// 切 tab 时刷新编辑项
watch(activeTab, () => {
  editingId.value = currentActiveId.value
  const p = currentList.value.find((x) => x.id === editingId.value)
  editing.value = p ? { ...p } : null
  diagnostic.value = null
})
</script>
