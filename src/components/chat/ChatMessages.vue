<template>
  <div ref="scrollContainer" class="flex-1 overflow-y-auto overscroll-contain scroll-smooth">
    <!-- Empty state -->
    <div v-if="isEmpty" class="flex flex-col items-center justify-center h-full text-center px-6 py-12">
      <div class="w-16 h-16 lg:w-20 lg:h-20 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mb-5">
        <svg class="w-8 h-8 lg:w-10 lg:h-10 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">有什么可以帮你的？</h3>
      <p class="text-[15px] text-neutral-500 dark:text-neutral-400 max-w-sm leading-relaxed">
        {{ ocrContext ? '基于识别结果提问，获取深度解答' : '输入英语题目或语法问题，AI 将为你详细解答' }}
      </p>
    </div>

    <!-- Messages -->
    <div v-else role="log" aria-live="polite" aria-label="聊天消息">
      <div v-for="message in messages" :key="message.id"
           class="border-b border-transparent"
           :class="message.role === 'assistant' ? 'chat-message-assistant' : ''">
        <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5 content-visibility-auto">
          <ChatMessageBubble :message="message" />
        </div>
      </div>

      <!-- Regenerate button (after last assistant message, when not streaming) -->
      <div v-if="!isStreaming && messages.length >= 2 && messages[messages.length - 1]?.role === 'assistant'"
           class="max-w-3xl mx-auto px-4 sm:px-6 pb-2 flex justify-start">
        <button @click="emit('regenerate')"
                class="p-2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors touch-target"
                aria-label="重新生成回复">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
          </svg>
        </button>
      </div>

      <StreamingIndicator v-if="isStreaming" :content="streamContent" />

      <!-- Sentinel for IntersectionObserver auto-scroll detection -->
      <div ref="sentinelRef" class="h-px" aria-hidden="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { ChatMessage } from '@/types'
import { useChatScroll } from '@/composables/useChatScroll'
import ChatMessageBubble from './ChatMessageBubble.vue'
import StreamingIndicator from './StreamingIndicator.vue'

defineProps<{
  messages: ChatMessage[]
  isStreaming: boolean
  streamContent: string
  isEmpty: boolean
  ocrContext: string
}>()

const emit = defineEmits<{
  regenerate: []
}>()

const scrollContainer = ref<HTMLElement>()
const sentinelRef = ref<HTMLElement>()

const {
  scrollToBottom,
  observeSentinel,
  onStreamChunk
} = useChatScroll(scrollContainer)

// Observe sentinel once it's mounted
watch(sentinelRef, (el) => {
  if (el) observeSentinel(el)
})

defineExpose({ scrollToBottom, onStreamChunk })
</script>

<style scoped>
.content-visibility-auto {
  content-visibility: auto;
  contain-intrinsic-size: auto 80px;
}
</style>
