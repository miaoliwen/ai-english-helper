<template>
  <div
    v-if="message.role === 'user'"
    class="flex justify-end"
  >
    <div class="max-w-[88%] sm:max-w-[80%] rounded-[1.25rem] px-4 py-2.5 bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900">
      <p class="text-[15px] sm:text-base leading-[1.65] whitespace-pre-wrap break-words">
        {{ message.content }}
      </p>
    </div>
  </div>

  <div
    v-else
    class="flex gap-3 group/msg"
  >
    <div class="hidden sm:flex w-7 h-7 rounded-md bg-neutral-200/80 dark:bg-neutral-700 items-center justify-center shrink-0 mt-0.5">
      <slot name="assistant-icon">
        <svg
          class="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
          />
        </svg>
      </slot>
    </div>
    <div class="flex-1 min-w-0">
      <div class="inline-block max-w-[88%] sm:max-w-[80%] rounded-[1.25rem] px-4 py-2.5 bg-neutral-100 dark:bg-neutral-800/50 text-neutral-900 dark:text-neutral-100 border border-neutral-200/50 dark:border-neutral-700/50">
        <MarkdownRenderer
          reading
          :content="message.content"
        />
      </div>
      <div class="flex items-center gap-1 mt-1.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
        <button
          class="p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 rounded-lg transition-colors touch-target"
          :aria-label="copied ? '已复制' : '复制内容'"
          @click="copyContent"
        >
          <svg
            v-if="!copied"
            class="w-3.5 h-3.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9.75a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
            />
          </svg>
          <svg
            v-else
            class="w-3.5 h-3.5 text-green-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            stroke-width="2"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ChatMessage } from '@/types'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'

const props = defineProps<{
  message: ChatMessage
}>()

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | null = null

async function copyContent() {
  try {
    await navigator.clipboard.writeText(props.message.content)
    copied.value = true
    if (copyTimer) clearTimeout(copyTimer)
    copyTimer = setTimeout(() => { copied.value = false }, 1500)
  } catch {
    // Clipboard API unavailable — silently ignore
  }
}
</script>
