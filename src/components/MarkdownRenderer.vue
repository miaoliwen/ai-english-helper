<template>
  <div
    class="markdown-content"
    :class="{ 'markdown-reading': reading }"
    v-html="renderedContent"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{ content: string; reading?: boolean }>()
const renderedContent = computed(() => renderMarkdown(props.content))
</script>