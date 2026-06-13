<template>
  <a
    href="#main-content"
    class="skip-link"
  >跳转到主内容</a>
  <div
    id="main-content"
    class="relative isolate"
  >
    <div
      aria-hidden="true"
      class="absolute inset-0 -z-10 overflow-hidden hidden md:block"
    >
      <div class="aurora-blob aurora-a bg-accent-300/40 dark:bg-accent-500/20 w-[560px] h-[560px] -top-40 -left-32" />
      <div class="aurora-blob aurora-b bg-accent-200/30 dark:bg-accent-700/15 w-[500px] h-[500px] top-16 right-[-180px]" />
    </div>

    <div class="page-shell pb-24">
      <section class="pt-16 md:pt-24 pb-16 md:pb-20">
        <div class="max-w-3xl mx-auto text-center">
          <p class="section-label">English AI Tutor</p>
          <h1 class="page-hero-title mt-4">
            <span class="hero-line hero-line-1">英语题目</span>
            <br>
            <span class="hero-line hero-line-2">一拍即解</span>
          </h1>
          <p class="text-lg font-extralight tracking-tight-sub text-neutral-500 dark:text-neutral-400 mt-6 max-w-xl mx-auto">
            拍照上传试卷或练习册，AI 识别题干并分步讲解
          </p>

          <div
            v-if="!store.isModelConfigured && !warnDismissed"
            class="alert-banner-warn mt-8 max-w-lg mx-auto text-left"
          >
            <button
              class="absolute top-3 right-3 p-1 rounded-full text-amber-700/50 dark:text-amber-300/50 hover:text-amber-900 dark:hover:text-amber-200 hover:bg-amber-100/50 dark:hover:bg-amber-900/20 transition-colors"
              aria-label="关闭提示"
              title="关闭"
              @click="warnDismissed = true"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <svg
              class="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.75"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <div class="flex-1 min-w-0 pr-5">
              <p class="text-sm font-medium text-amber-900 dark:text-amber-200">
                尚未配置 API Key
              </p>
              <p class="mt-1 text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                填写对话与视觉模型的地址和密钥后即可使用。密钥加密保存在本设备。
              </p>
              <button
                class="mt-2 text-xs font-semibold text-amber-900 dark:text-amber-200 underline underline-offset-2"
                @click="store.openSettings()"
              >
                打开设置
              </button>
            </div>
          </div>

          <div class="mt-10 flex flex-wrap items-center justify-center gap-4">
            <router-link
              to="/upload"
              class="btn-primary text-base"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              开始识别
            </router-link>
            <router-link
              to="/chat"
              class="btn-secondary"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
              直接提问
            </router-link>
          </div>
        </div>
      </section>

      <section class="border-t border-black/6 dark:border-white/6 pt-10">
        <div class="flex items-end justify-between mb-6">
          <div>
            <p class="section-label">Recent</p>
            <h2 class="text-3xl font-book tracking-tighter-section text-black dark:text-white">
              最近记录
            </h2>
          </div>
          <router-link
            v-if="recentItems.length > 0"
            to="/favorites"
            class="text-sm font-medium text-neutral-500 hover:text-black dark:text-neutral-400 dark:hover:text-white transition-colors"
          >
            查看全部
          </router-link>
        </div>

        <div
          v-if="recentItems.length === 0"
          class="surface-panel p-12 sm:p-16 text-center"
        >
          <div class="w-12 h-12 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mx-auto mb-4">
            <svg
              class="w-6 h-6 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
              />
            </svg>
          </div>
          <p class="text-neutral-500 dark:text-neutral-400">
            还没有识别或对话记录
          </p>
          <router-link
            to="/upload"
            class="inline-block mt-5 text-sm font-medium text-black dark:text-white hover:underline"
          >
            上传第一道题目
          </router-link>
        </div>

        <ul
          v-else
          class="list-panel"
        >
          <li
            v-for="(item, index) in recentItems"
            :key="item.id"
            :style="{ '--i': index }"
            class="stagger-item group flex items-center gap-4 px-4 sm:px-5 py-4 cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
            @click="navigateToItem(item)"
          >
            <span
              class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-mono font-semibold tracking-tight-tag"
              :class="item.type === 'ocr'
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'bg-black/5 dark:bg-white/10 text-neutral-500 dark:text-neutral-400'"
            >
              {{ item.type === 'ocr' ? 'OCR' : 'AI' }}
            </span>
            <p class="flex-1 min-w-0 text-sm text-neutral-700 dark:text-neutral-300 line-clamp-1 tracking-tight-body">
              {{ item.preview }}
            </p>
            <span class="shrink-0 text-xs text-neutral-400 font-mono tabular-nums hidden sm:block">
              {{ formatDate(item.createdAt) }}
            </span>
            <button
              aria-label="删除记录"
              class="shrink-0 w-8 h-8 flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100 transition-all"
              @click.stop="removeItem(item)"
            >
              <svg
                class="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
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
