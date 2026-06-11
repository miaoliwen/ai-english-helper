<template>
  <div class="chat-message-assistant">
    <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
      <div class="flex gap-3">
        <div class="hidden sm:flex w-7 h-7 rounded-md bg-neutral-200/80 dark:bg-neutral-700 items-center justify-center shrink-0 mt-0.5">
          <slot name="assistant-icon">
            <svg class="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
            </svg>
          </slot>
        </div>
        <div class="flex-1 min-w-0">
          <div v-if="content" class="inline-block max-w-[88%] sm:max-w-[80%] rounded-[1.25rem] px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-neutral-700/50">
            <MarkdownRenderer reading :content="content" />
          </div>
          <div v-else class="inline-block rounded-[1.25rem] px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800/50 border border-neutral-200/50 dark:border-neutral-700/50">
            <div class="flex items-center gap-1.5">
              <div class="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce animation-delay-150"></div>
              <div class="w-2 h-2 bg-neutral-400 dark:bg-neutral-500 rounded-full animate-bounce animation-delay-300"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

defineProps<{
  content: string
}>()
</script>
