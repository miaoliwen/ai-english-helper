<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
    <!-- Asymmetric Hero -->
    <section class="pt-12 pb-16 lg:pt-20 lg:pb-24">
      <div class="flex flex-col items-center text-center">
        <div>
          <div class="section-label">AI-Powered English Learning</div>
          <h1 class="section-title mb-6">
            智能识别<br>
            <span class="gradient-text">深度解析</span>
          </h1>
          <p class="text-lg text-neutral-500 leading-relaxed max-w-md mb-8 text-balance mx-auto">
            上传英语题目图片，AI 自动识别并深度解析。所有数据本地存储，保障隐私安全。
          </p>
          <div class="flex flex-wrap items-center justify-center gap-3">
            <router-link to="/upload" class="btn-primary flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
              </svg>
              <span>开始上传识别</span>
            </router-link>
            <router-link to="/chat" class="btn-ghost flex items-center gap-2">
              <span>直接提问</span>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
              </svg>
            </router-link>
          </div>
        </div>
      </div>
    </section>

    <!-- Recent Activity -->
    <section class="py-12">
      <div class="flex items-end justify-between mb-8">
        <div>
          <div class="section-label">Recent Activity</div>
          <h2 class="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">最近记录</h2>
        </div>
        <router-link to="/favorites" class="text-sm font-medium text-accent-600 hover:text-accent-700 flex items-center gap-1 transition-colors">
          <span>查看全部</span>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
          </svg>
        </router-link>
      </div>

      <div v-if="recentItems.length === 0" class="card-surface p-12 text-center">
        <div class="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg class="w-7 h-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
        </div>
        <p class="text-neutral-500 dark:text-neutral-400">暂无记录，开始你的第一次识别吧</p>
      </div>

      <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="(item, index) in recentItems"
          :key="item.id"
          @click="navigateToItem(item)"
          class="card-surface-hover p-5 cursor-pointer"
          :style="{ animationDelay: `${index * 100}ms` }"
        >
          <div class="flex items-center gap-3 mb-3">
            <span class="px-2.5 py-1 rounded-lg text-xs font-semibold"
                  :class="item.type === 'ocr' ? 'bg-accent-50 text-accent-700' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'">
              {{ item.type === 'ocr' ? '识别' : '对话' }}
            </span>
            <span class="text-xs text-neutral-400 font-mono">{{ formatDate(item.createdAt) }}</span>
          </div>
          <h4 class="font-semibold text-neutral-900 dark:text-neutral-100 mb-1.5 line-clamp-1">{{ item.title }}</h4>
          <p class="text-sm text-neutral-500 dark:text-neutral-400 line-clamp-2">{{ item.preview }}</p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const router = useRouter()

onMounted(() => {
  store.loadRecents()
})

const recentItems = computed(() => {
  const items = [
    ...store.recentOCRs.map(ocr => ({
      id: ocr.id,
      type: 'ocr' as const,
      title: '图片识别 ' + formatDate(ocr.createdAt),
      preview: ocr.text.slice(0, 100) + '...',
      createdAt: ocr.createdAt,
      target: '/upload'
    })),
    ...store.recentChats.map(chat => ({
      id: chat.id,
      type: 'chat' as const,
      title: chat.title || '对话记录',
      preview: chat.messages[0]?.content.slice(0, 100) + '...' || '无内容',
      createdAt: chat.updatedAt,
      target: `/chat/${chat.id}`
    }))
  ]
  return items.sort((a, b) => b.createdAt - a.createdAt).slice(0, 6)
})

function navigateToItem(item: typeof recentItems.value[0]) {
  if (item.type === 'ocr') {
    store.loadOCR(item.id)
    router.push('/upload')
  } else {
    router.push(`/chat/${item.id}`)
  }
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>