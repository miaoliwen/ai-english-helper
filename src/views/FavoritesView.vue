<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
      <div>
        <div class="section-label">Library</div>
        <h2 class="text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">收藏图书馆</h2>
          <p class="text-neutral-500 dark:text-neutral-400 mt-2">管理你的学习收藏，支持离线查看与快速检索</p>
      </div>
      <div class="relative">
        <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="搜索收藏..."
               class="input-field pl-11 pr-4 w-full sm:w-72" />
        <svg class="w-5 h-5 text-neutral-400 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
        </svg>
      </div>
    </div>

    <!-- Filter Tabs -->
    <div class="flex items-center gap-2 mb-8">
      <button v-for="tab in tabs" :key="tab.value" @click="activeTab = tab.value"
              class="px-5 py-2.5 rounded-2xl text-sm font-medium transition-all duration-300"
              :class="activeTab === tab.value ? 'bg-accent-600 text-white shadow-glow' : 'bg-white text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 border border-neutral-200 dark:border-neutral-700'">
        {{ tab.label }}
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="filteredItems.length === 0" class="card-surface p-20 text-center">
      <div class="w-16 h-16 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-5">
        <svg class="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z"/>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">{{ searchQuery ? '没有找到匹配的收藏' : '暂无收藏内容' }}</h3>
      <p class="text-neutral-500 dark:text-neutral-400 mb-6">{{ searchQuery ? '尝试其他关键词搜索' : '在识别或对话页面点击收藏按钮，将内容添加到这里' }}</p>
      <router-link v-if="!searchQuery" to="/upload" class="btn-primary">去上传识别</router-link>
    </div>

    <!-- Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="item in filteredItems" :key="item.id"
           class="card-surface-hover p-6 group cursor-pointer"
           @click="viewItem(item)">
        <div class="flex items-start justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  :class="item.type === 'ocr' ? 'bg-accent-50 text-accent-700' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'">
              {{ item.type === 'ocr' ? '识别' : '对话' }}
            </span>
            <span v-for="tag in item.tags.slice(0, 2)" :key="tag" class="px-2 py-0.5 bg-neutral-50 dark:bg-neutral-800/50 text-neutral-500 dark:text-neutral-400 rounded-lg text-xs font-medium">
              {{ tag }}
            </span>
          </div>
          <div class="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
            <button @click.stop="exportItem(item)" class="p-2 text-neutral-300 hover:text-accent-600 hover:bg-accent-50 rounded-lg transition-all touch-target" title="导出 Markdown" aria-label="导出 Markdown">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"/>
              </svg>
            </button>
            <button @click.stop="deleteItem(item.id)" class="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all touch-target" title="删除" aria-label="删除收藏">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
              </svg>
            </button>
          </div>
        </div>

        <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 mb-2 line-clamp-1">{{ item.title }}</h3>
        <div class="bg-neutral-50 dark:bg-neutral-800/50 rounded-2xl p-3.5 mb-4 max-h-28 overflow-y-auto">
          <p class="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-3">{{ item.content.slice(0, 180) }}...</p>
        </div>

        <div class="flex items-center justify-between">
          <span class="text-xs text-neutral-400 font-mono">{{ formatDate(item.createdAt) }}</span>
          <span class="text-sm text-accent-600 font-medium flex items-center gap-1">
            查看详情
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
            </svg>
          </span>
        </div>
      </div>
    </div>

    <!-- Detail Modal: 移动端全屏 sheet，桌面端居中弹窗 -->
    <Transition name="scale">
      <div v-if="selectedItem" class="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" @click.self="selectedItem = null">
        <div class="absolute inset-0 bg-neutral-900/30 backdrop-blur-sm"></div>
        <div class="relative bg-white dark:bg-neutral-900 sm:rounded-4xl shadow-2xl w-full sm:max-w-3xl max-h-[90vh] sm:max-h-[80vh] overflow-hidden flex flex-col
                    rounded-t-3xl sm:rounded-4xl">
          <div class="px-5 sm:px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
            <div class="flex items-center gap-2 sm:gap-3 min-w-0">
              <span class="px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0"
                    :class="selectedItem.type === 'ocr' ? 'bg-accent-50 text-accent-700' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'">
                {{ selectedItem.type === 'ocr' ? '识别结果' : '对话记录' }}
              </span>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100 truncate">{{ selectedItem.title }}</h3>
            </div>
            <div class="flex items-center gap-1 sm:gap-2 shrink-0">
              <ExportPanel :content="selectedItem.content" :title="selectedItem.title" />
              <button @click="selectedItem = null" class="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all touch-target">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto p-5 sm:p-6 pb-nav">
            <MarkdownRenderer :content="selectedItem.content" />
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useAppStore } from '@/stores/app'
import type { FavoriteItem } from '@/types'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import FileSaver from 'file-saver'
import { useScrollLock } from '@/composables/useScrollLock'

const store = useAppStore()

const searchQuery = ref('')
const activeTab = ref<'all' | 'ocr' | 'chat'>('all')
const selectedItem = ref<FavoriteItem | null>(null)

useScrollLock(computed(() => selectedItem.value !== null))

const tabs = [
  { label: '全部', value: 'all' as const },
  { label: '识别', value: 'ocr' as const },
  { label: '对话', value: 'chat' as const }
]

const filteredItems = computed(() => {
  let items = store.favorites
  if (activeTab.value !== 'all') items = items.filter(item => item.type === activeTab.value)
  return items
})

onMounted(() => { store.loadRecents() })

let searchTimeout: ReturnType<typeof setTimeout> | null = null
function handleSearch() {
  if (searchTimeout) clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => { store.searchFavoriteItems(searchQuery.value) }, 300)
}
onBeforeUnmount(() => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
    searchTimeout = null
  }
})

function viewItem(item: FavoriteItem) { selectedItem.value = item }
function exportItem(item: FavoriteItem) {
  const blob = new Blob([item.content], { type: 'text/markdown;charset=utf-8' })
  FileSaver.saveAs(blob, `${item.title}.md`)
}
async function deleteItem(id: string) {
  if (confirm('确定要删除这个收藏吗？')) { await store.removeFavorite(id) }
}
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>