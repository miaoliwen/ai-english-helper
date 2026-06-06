<template>
  <button @click="exportMarkdown"
          class="flex items-center gap-1.5 px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-xl transition-all duration-300 text-sm font-medium touch-target">
    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
    </svg>
    <span>导出 MD</span>
  </button>
</template>

<script setup lang="ts">
import FileSaver from 'file-saver'

const props = defineProps<{ content: string; title?: string }>()

function exportMarkdown() {
  const blob = new Blob([props.content], { type: 'text/markdown;charset=utf-8' })
  FileSaver.saveAs(blob, `${props.title || 'export'}.md`)
}
</script>