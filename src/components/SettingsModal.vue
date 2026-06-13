<template>
  <Transition name="scale">
    <div
      v-if="visible"
      ref="modalRef"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
      @click.self="close"
    >
      <div class="absolute inset-0 bg-neutral-900/30 dark:bg-black/50 backdrop-blur-sm" />
      <div class="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-accent-50 dark:bg-accent-900/20 rounded-xl flex items-center justify-center">
              <svg
                class="w-5 h-5 text-accent-600 dark:text-accent-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">
                模型配置
              </h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">
                配置对话和视觉模型，支持自定义或服务端模式
              </p>
            </div>
          </div>
          <button
            class="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all touch-target"
            aria-label="关闭"
            @click="close"
          >
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <!-- Tabs -->
        <div class="px-6 pt-4 flex items-center gap-2 border-b border-neutral-100 dark:border-neutral-800 shrink-0">
          <button
            v-for="t in tabs"
            :key="t.value"
            class="px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px"
            :class="activeTab === t.value
              ? 'border-accent-600 text-accent-600'
              : 'border-transparent text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'"
            @click="activeTab = t.value"
          >
            {{ t.label }}
          </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6">
          <ModelConfig :model-type="activeTab" />
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-3 shrink-0">
          <p class="text-xs text-neutral-400">
            配置自动保存到本地
          </p>
          <button
            class="btn-ghost text-sm touch-target"
            @click="close"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, toRef, watch } from 'vue'
import { useScrollLock } from '@/composables/useScrollLock'
import ModelConfig from './settings/ModelConfig.vue'
import type { ModelType } from '@/types/config'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

// 锁住 body 滚动，避免移动端背景穿透
useScrollLock(toRef(props, 'visible'))

const modalRef = ref<HTMLDivElement | null>(null)
const lastFocusedElement = ref<HTMLElement | null>(null)

// Focus trap + Escape 关闭
function handleModalKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    close()
    return
  }
  if (e.key !== 'Tab' || !modalRef.value) return

  const focusable = modalRef.value.querySelectorAll<HTMLElement>(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  const first = focusable[0]
  const last = focusable[focusable.length - 1]

  if (!first || !last) return

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault()
    last.focus()
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault()
    first.focus()
  }
}

onMounted(() => {
  lastFocusedElement.value = document.activeElement as HTMLElement
})

watch(() => props.visible, (val) => {
  if (val) {
    document.addEventListener('keydown', handleModalKeydown)
    // 模态框打开后聚焦第一个可交互元素
    nextTick(() => {
      const focusable = modalRef.value?.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      focusable?.[0]?.focus()
    })
  } else {
    document.removeEventListener('keydown', handleModalKeydown)
    lastFocusedElement.value?.focus()
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleModalKeydown)
})

const activeTab = ref<ModelType>('chat')
const tabs = [
  { label: '对话模型', value: 'chat' as ModelType },
  { label: '视觉模型', value: 'vision' as ModelType }
]

function close() { emit('update:visible', false) }
</script>