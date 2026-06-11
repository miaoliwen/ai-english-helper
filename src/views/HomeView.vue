<template>
  <a href="#main-content" class="skip-link">跳转到主内容</a>
  <div class="relative isolate" id="main-content">
    <div aria-hidden="true" class="absolute inset-0 -z-10 overflow-hidden hidden md:block">
      <div class="aurora-blob aurora-a bg-accent-300/30 dark:bg-accent-500/15 w-[520px] h-[520px] -top-32 -left-24" />
      <div class="aurora-blob aurora-b bg-accent-200/30 dark:bg-accent-700/10 w-[480px] h-[480px] top-20 right-[-160px]" />
    </div>

    <div class="page-shell pb-24">
      <!-- Hero：左文右图 Bento（非居中） -->
      <section class="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center pt-12 md:pt-20 pb-16 md:pb-20">
        <div class="order-2 lg:order-1">
          <h1 class="page-hero-title text-center">
            英语题目<br />一拍即解
          </h1>
          <div v-if="!store.isModelConfigured && !warnDismissed" class="alert-banner-warn mt-6 relative">
            <button
              @click="warnDismissed = true"
              class="absolute top-2 right-2 p-1 rounded-md text-amber-700/60 dark:text-amber-300/60 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-colors"
              aria-label="关闭提示"
              title="关闭"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
            <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <div class="flex-1 min-w-0 pr-5">
              <p class="text-sm font-medium text-amber-900 dark:text-amber-200">尚未配置 API Key</p>
              <p class="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                填写对话与视觉模型的地址和密钥后即可使用。密钥加密保存在本设备。
              </p>
              <button @click="store.openSettings()" class="mt-3 text-xs font-semibold text-amber-900 dark:text-amber-200 underline underline-offset-2">
                打开设置
              </button>
            </div>
          </div>

          <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
            <router-link to="/upload" class="btn-primary">开始识别</router-link>
            <router-link to="/chat" class="btn-secondary">直接提问</router-link>
          </div>
        </div>


      </section>

      <!-- 最近记录：列表分组，减少卡片嵌套 -->
      <section class="border-t border-neutral-200/80 dark:border-neutral-800 pt-10">
        <div class="flex items-end justify-between mb-5">
          <div>
            <p class="section-label">Recent</p>
            <h2 class="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">最近记录</h2>
          </div>
          <router-link
            v-if="recentItems.length > 0"
            to="/favorites"
            class="text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >查看全部</router-link>
        </div>

        <div v-if="recentItems.length === 0" class="surface-panel p-12 sm:p-16 text-center">
          <div class="w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mx-auto mb-4">
            <svg class="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/>
            </svg>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">还没有识别或对话记录</p>
          <router-link to="/upload" class="inline-block mt-5 text-sm font-medium text-accent-700 dark:text-accent-400 hover:underline">
            上传第一道题目
          </router-link>
        </div>

        <ul v-else class="list-panel">
          <li
            v-for="(item, index) in recentItems"
            :key="item.id"
            :style="{ '--i': index }"
            @click="navigateToItem(item)"
            class="stagger-item group flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
          >
            <span
              class="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-mono font-semibold"
              :class="item.type === 'ocr'
                ? 'bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-400'
                : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500'"
            >
              {{ item.type === 'ocr' ? 'OCR' : 'AI' }}
            </span>
            <p class="flex-1 min-w-0 text-sm text-neutral-800 dark:text-neutral-200 line-clamp-1">
              {{ item.preview }}
            </p>
            <span class="shrink-0 text-xs text-neutral-400 font-mono tabular-nums hidden sm:block">
              {{ formatDate(item.createdAt) }}
            </span>
            <button
              @click.stop="removeItem(item)"
              aria-label="删除记录"
              class="shrink-0 p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all touch-target"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'

const store = useAppStore()
const router = useRouter()
const warnDismissed = ref(false)

onMounted(() => {
  store.loadRecents()
})

type RecentItem = {
  id: string
  type: 'ocr' | 'chat'
  preview: string
  createdAt: number
  target: string
}

const recentItems = computed<RecentItem[]>(() => {
  const ocrs: RecentItem[] = store.recentOCRs.map(o => ({
    id: o.id,
    type: 'ocr',
    preview: o.text || '图片识别',
    createdAt: o.createdAt,
    target: '/upload'
  }))
  const chats: RecentItem[] = store.recentChats.map(c => ({
    id: c.id,
    type: 'chat',
    preview: c.title || c.messages[0]?.content || '新对话',
    createdAt: c.updatedAt,
    target: `/chat/${c.id}`
  }))
  return [...ocrs, ...chats]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 6)
})

function navigateToItem(item: RecentItem) {
  if (item.type === 'ocr') {
    store.loadOCR(item.id)
    router.push('/upload')
  } else {
    router.push(item.target)
  }
}

async function removeItem(item: RecentItem) {
  if (!confirm(`确定要删除这条${item.type === 'ocr' ? '识别' : '对话'}记录吗？`)) return
  if (item.type === 'ocr') {
    await store.deleteOCR(item.id)
  } else {
    await store.deleteChat(item.id)
  }
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString('zh-CN', {
    month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
  })
}
</script>
