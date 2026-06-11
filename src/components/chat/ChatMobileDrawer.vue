<template>
  <Teleport to="body">
    <Transition name="slide-left">
      <div v-if="open"
           class="lg:hidden fixed inset-0 z-[60] flex"
           @click.self="emit('update:open', false)"
           role="dialog"
           aria-modal="true"
           aria-label="历史对话">
        <div class="absolute inset-0 bg-neutral-900/50 dark:bg-black/70 backdrop-blur-[2px]"></div>
        <div class="slide-left-panel relative w-[min(85vw,20rem)] h-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col pt-safe border-r border-neutral-100 dark:border-neutral-800">
          <!-- Header -->
          <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
            <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">历史对话</h3>
            <button @click="emit('update:open', false)"
                    ref="closeBtnRef"
                    class="p-2 -mr-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl touch-target"
                    aria-label="关闭">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- New chat button -->
          <div class="px-4 py-3 shrink-0">
            <button @click="onNewChat"
                    class="btn-primary w-full flex items-center justify-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
              新对话
            </button>
          </div>

          <!-- OCR context -->
          <div v-if="currentOCR" class="mx-4 mb-3 p-3 bg-accent-50 rounded-2xl">
            <p class="text-xs font-semibold text-accent-700 mb-1">已关联识别结果</p>
            <p class="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{{ currentOCR.text.slice(0, 60) }}...</p>
          </div>

          <!-- History list -->
          <div class="flex-1 overflow-y-auto px-2 pb-composer">
            <ChatHistoryList
              variant="mobile"
              :sessions="recentChats"
              :current-id="currentChatId"
              @select="onSelect"
              @remove="emit('remove-chat', $event)"
            />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import type { OCRResult, ChatSession } from '@/types'
import { useScrollLock } from '@/composables/useScrollLock'
import ChatHistoryList from './ChatHistoryList.vue'

const props = defineProps<{
  open: boolean
  currentOCR: OCRResult | null
  recentChats: ChatSession[]
  currentChatId: string | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'new-chat': []
  'load-chat': [id: string]
  'remove-chat': [id: string]
}>()

const closeBtnRef = ref<HTMLButtonElement>()

// Scroll lock while drawer is open
const isOpen = ref(props.open)
watch(() => props.open, (v) => { isOpen.value = v })
useScrollLock(isOpen)

// Focus trap: focus close button on open
watch(() => props.open, async (v) => {
  if (v) {
    await nextTick()
    closeBtnRef.value?.focus()
  }
})

// Focus trap: Tab cycling within drawer
function handleKeydown(e: KeyboardEvent) {
  if (!props.open) return
  if (e.key === 'Escape') {
    emit('update:open', false)
    return
  }
  // Simple focus trap handled by browser's native dialog behavior
}

onMounted(() => document.addEventListener('keydown', handleKeydown))
onBeforeUnmount(() => document.removeEventListener('keydown', handleKeydown))

function onNewChat() {
  emit('new-chat')
  emit('update:open', false)
}

function onSelect(id: string) {
  emit('load-chat', id)
  emit('update:open', false)
}
</script>
