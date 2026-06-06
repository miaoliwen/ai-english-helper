<template>
  <div ref="rootEl" class="relative inline-block">
    <button
      type="button"
      @click="toggle"
      :disabled="disabled"
      class="flex items-center gap-1.5 max-w-[200px] px-2.5 py-1.5 rounded-lg text-sm font-medium
             text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800
             disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      :title="title"
    >
      <span class="truncate">{{ activeName || '未选择' }}</span>
      <svg class="w-3.5 h-3.5 shrink-0 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"/>
      </svg>
    </button>

    <Transition name="scale">
      <div v-if="open"
           class="absolute z-40 top-full mt-1.5 right-0 min-w-[220px] card-surface p-1 shadow-lg">
        <div class="px-2 py-1.5 text-[10px] font-semibold tracking-widest uppercase text-neutral-400">
          {{ kind === 'chat' ? '对话模型预设' : '视觉模型预设' }}
        </div>
        <ul class="max-h-64 overflow-y-auto">
          <li v-for="p in presets" :key="p.id">
            <button
              type="button"
              @click="select(p.id)"
              class="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-left
                     hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
              :class="p.id === activeId ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400' : 'text-neutral-700 dark:text-neutral-200'"
            >
              <span class="truncate flex-1">{{ p.name || '未命名预设' }}</span>
              <span v-if="!p.apiKey" class="shrink-0 text-[10px] text-amber-600 dark:text-amber-400">无 Key</span>
              <svg v-if="p.id === activeId" class="shrink-0 w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
              </svg>
            </button>
          </li>
          <li v-if="presets.length === 0" class="px-2 py-3 text-xs text-neutral-400 text-center">
            暂无预设
          </li>
        </ul>
        <div class="border-t border-neutral-100 dark:border-neutral-800 mt-1 pt-1">
          <button type="button" @click="manage"
                  class="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs
                         text-neutral-500 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87l.22.127c.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992v.255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124l-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c.55 0 1.02-.398 1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87l-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992v-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124l.22-.128c.332-.183.582-.495.644-.869l.214-1.281z"/>
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            管理预设…
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import type { ModelPreset } from '@/types'

const props = defineProps<{
  kind: 'chat' | 'vision'
  presets: ModelPreset[]
  activeId: string
  disabled?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'manage'): void
}>()

const open = ref(false)
const rootEl = ref<HTMLDivElement | null>(null)

const activeName = computed(
  () => props.presets.find((p) => p.id === props.activeId)?.name || ''
)

const title = computed(() =>
  props.kind === 'chat' ? '切换对话模型' : '切换视觉模型'
)

function toggle() {
  if (props.disabled) return
  open.value = !open.value
}

function select(id: string) {
  open.value = false
  if (id !== props.activeId) emit('select', id)
}

function manage() {
  open.value = false
  emit('manage')
}

function onDocClick(e: MouseEvent) {
  if (!open.value) return
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    open.value = false
  }
}

onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
</script>
