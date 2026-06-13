<template>
  <div class="card-surface p-4 h-full flex flex-col">
    <button
      class="btn-primary w-full flex items-center justify-center gap-2 mb-4"
      @click="emit('new-chat')"
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
      <span>新对话</span>
    </button>

    <div
      v-if="currentOCR"
      class="p-3 bg-accent-50 rounded-2xl mb-4"
    >
      <p class="text-xs font-semibold text-accent-700 mb-1">
        已关联识别结果
      </p>
      <p class="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">
        {{ currentOCR.text.slice(0, 50) }}...
      </p>
    </div>

    <div class="flex items-center justify-between mb-2 px-1">
      <h3 class="text-xs font-semibold tracking-widest uppercase text-neutral-400">
        历史对话
      </h3>
      <span class="text-xs text-neutral-400 font-mono">{{ recentChats.length }}</span>
    </div>
    <div class="flex-1 overflow-y-auto -mx-1">
      <ChatHistoryList
        variant="desktop"
        :sessions="recentChats"
        :current-id="currentChatId"
        @select="emit('load-chat', $event)"
        @remove="emit('remove-chat', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { OCRResult, ChatSession } from '@/types'
import ChatHistoryList from './ChatHistoryList.vue'

defineProps<{
  currentOCR: OCRResult | null
  recentChats: ChatSession[]
  currentChatId: string | null
}>()

const emit = defineEmits<{
  'new-chat': []
  'load-chat': [id: string]
  'remove-chat': [id: string]
}>()
</script>
