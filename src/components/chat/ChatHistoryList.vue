<template>
  <div
    v-if="sessions.length === 0"
    class="text-center text-sm text-neutral-400"
    :class="variant === 'mobile' ? 'py-10 px-4' : 'py-6 px-2'"
  >
    还没有历史对话
  </div>
  <div
    v-else
    :class="variant === 'mobile' ? 'space-y-0.5' : 'space-y-1'"
  >
    <div
      v-for="session in sessions"
      :key="session.id"
      class="group flex items-center rounded-xl text-sm"
      :class="[
        variant === 'mobile' ? 'gap-2 px-3 py-3' : 'justify-between px-3 py-2.5 transition-all duration-300',
        currentId === session.id
          ? (variant === 'mobile' ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'bg-accent-50 text-accent-700')
          : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
      ]"
    >
      <button
        class="flex-1 text-left min-w-0"
        @click="emit('select', session.id)"
      >
        <p class="truncate font-medium">
          {{ session.title || '未命名对话' }}
        </p>
        <p class="text-xs text-neutral-400 truncate">
          {{ lastMessagePreview(session) }}
        </p>
      </button>
      <button
        :class="[
          'text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg touch-target shrink-0',
          variant === 'mobile' ? 'p-2' : 'ml-1.5 p-1.5 lg:opacity-0 lg:group-hover:opacity-100 transition-all'
        ]"
        aria-label="删除对话"
        @click.stop="emit('remove', session.id)"
      >
        <svg
          :class="variant === 'mobile' ? 'w-4 h-4' : 'w-3.5 h-3.5'"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
          />
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ChatSession } from '@/types'

const props = defineProps<{
  sessions: ChatSession[]
  currentId: string | null
  variant: 'desktop' | 'mobile'
}>()

const emit = defineEmits<{
  select: [id: string]
  remove: [id: string]
}>()

function lastMessagePreview(session: ChatSession): string {
  const lastMsg = session.messages[session.messages.length - 1]?.content || ''
  const maxLen = props.variant === 'mobile' ? 30 : 24
  return lastMsg.slice(0, maxLen) || '无消息'
}
</script>
