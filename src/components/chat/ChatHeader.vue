<template>
  <div class="shrink-0 px-3 sm:px-5 py-2.5 lg:py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between gap-2 pt-safe lg:pt-4">
    <div class="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
      <button
        @click="emit('open-history')"
        class="lg:hidden p-2 -ml-1 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl touch-target"
        aria-label="打开历史对话"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"/>
        </svg>
      </button>
      <div class="hidden lg:flex w-8 h-8 bg-neutral-900 dark:bg-neutral-100 rounded-xl items-center justify-center shrink-0">
        <svg class="w-4 h-4 text-white dark:text-neutral-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
        </svg>
      </div>
      <div class="min-w-0 flex-1 flex justify-center lg:justify-start">
        <ModelSwitcher
          kind="chat"
          :presets="modelPresets.chat"
          :active-id="modelPresets.activeChatId"
          :disabled="isStreaming"
          :centered="true"
          class="max-lg:[&_button]:mx-auto"
          @select="onSelectChat"
          @manage="emit('open-settings')"
        />
        <p class="hidden lg:block text-xs text-neutral-400 font-mono truncate max-w-[200px] mt-0.5">
          {{ currentModelName || '未配置' }}
        </p>
      </div>
    </div>
    <div class="flex items-center gap-0.5 sm:gap-1 shrink-0">
      <button
        @click="emit('new-chat')"
        class="p-2 text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl touch-target lg:hidden"
        aria-label="新对话"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
        </svg>
      </button>
      <div class="hidden sm:flex items-center gap-1">
        <ExportPanel v-if="hasMessages" :content="exportContent" :title="currentSessionTitle" />
        <button v-if="hasMessages" @click="emit('add-to-favorites')"
                class="p-2 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 dark:hover:bg-accent-900/20 rounded-xl transition-all touch-target"
                aria-label="收藏对话">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z"/>
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ModelPresets, ChatSession } from '@/types'
import ModelSwitcher from '@/components/ModelSwitcher.vue'
import ExportPanel from '@/components/ExportPanel.vue'

const props = defineProps<{
  isStreaming: boolean
  modelPresets: ModelPresets
  currentModelName: string
  currentSession: ChatSession | null
  exportContent: string
  hasMessages: boolean
}>()

const emit = defineEmits<{
  'open-history': []
  'new-chat': []
  'select-chat-preset': [id: string]
  'open-settings': []
  'add-to-favorites': []
}>()

const currentSessionTitle = props.currentSession?.title || ''

function onSelectChat(id: string) {
  emit('select-chat-preset', id)
}
</script>
