<template>
  <div class="shrink-0 px-3 sm:px-5 pt-2 pb-composer border-t border-neutral-100 dark:border-neutral-800 bg-white/90 dark:bg-neutral-950/90 backdrop-blur-md">
    <div v-if="!modelConfigured" class="max-w-3xl mx-auto mb-2 flex items-center gap-2 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-3 py-2">
      <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
      </svg>
      <p class="text-xs text-amber-700 dark:text-amber-400 flex-1">模型未配置</p>
      <button @click="emit('open-settings')" class="text-xs font-medium text-amber-700 dark:text-amber-300 underline shrink-0">去设置</button>
    </div>
    <div class="max-w-3xl mx-auto chat-composer">
      <textarea
        ref="textareaRef"
        v-model="inputMessage"
        @keydown="handleKeydown"
        @input="resizeTextarea"
        rows="1"
        inputmode="text"
        enterkeyhint="send"
        autocapitalize="sentences"
        autocomplete="off"
        autocorrect="on"
        spellcheck="true"
        :placeholder="modelConfigured ? '输入你的问题…' : '请先配置对话模型'"
        :disabled="disabled"
      ></textarea>
      <button
        @click="handleSend"
        :disabled="!inputMessage.trim() || disabled"
        class="chat-composer-send mb-0.5"
        aria-label="发送消息"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"/>
        </svg>
      </button>
    </div>
    <p class="max-w-3xl mx-auto mt-1.5 text-center text-[11px] text-neutral-400 hidden sm:block">Enter 发送 · Shift+Enter 换行</p>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'

const props = defineProps<{
  disabled: boolean
  modelConfigured: boolean
}>()

const emit = defineEmits<{
  send: [content: string]
  'open-settings': []
}>()

const inputMessage = ref('')
const textareaRef = ref<HTMLTextAreaElement>()

function resizeTextarea() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${Math.min(el.scrollHeight, 400)}px`
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key !== 'Enter') return
  if (e.shiftKey) return
  e.preventDefault()
  handleSend()
}

async function handleSend() {
  const content = inputMessage.value.trim()
  if (!content || props.disabled) return
  inputMessage.value = ''
  await nextTick()
  resizeTextarea()
  emit('send', content)
}

function focus() {
  textareaRef.value?.focus()
}

defineExpose({ focus })
</script>
