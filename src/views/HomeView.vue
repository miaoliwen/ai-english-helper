<template>
  <div class="relative isolate">
    <!-- Aurora background -->
    <div aria-hidden="true" class="absolute inset-0 -z-10 overflow-hidden">
      <div class="aurora-blob aurora-a bg-accent-300/40 dark:bg-accent-500/20 w-[520px] h-[520px] -top-32 -left-24" />
      <div class="aurora-blob aurora-b bg-accent-200/40 dark:bg-accent-700/15 w-[480px] h-[480px] top-20 right-[-160px]" />
      <div class="aurora-blob aurora-c bg-accent-400/30 dark:bg-accent-400/10 w-[600px] h-[600px] top-[60%] left-[20%]" />
    </div>

    <!-- Floating letters -->
    <div aria-hidden="true" class="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      <span
        v-for="(l, i) in letters"
        :key="i"
        class="floating-letter"
        :style="l.style"
      >{{ l.text }}</span>
    </div>

    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
      <!-- Hero -->
      <section class="pt-20 pb-14 text-center">
        <h1 class="text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
          AI 英语解题助手
        </h1>
        <p class="mt-3 text-neutral-500 dark:text-neutral-400">
          上传题目图片，AI 自动识别与解析。本地存储，隐私安全。
        </p>
        <div class="mt-7 flex items-center justify-center gap-3">
          <router-link to="/upload" class="btn-primary">开始识别</router-link>
          <router-link to="/chat" class="btn-ghost">直接提问</router-link>
        </div>
      </section>

      <!-- Recent -->
      <section>
        <div class="flex items-end justify-between mb-4">
          <h2 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100">最近记录</h2>
          <router-link
            v-if="recentItems.length > 0"
            to="/favorites"
            class="text-sm text-accent-600 hover:text-accent-700 px-2 py-1 -mr-2 rounded-lg"
          >查看全部</router-link>
        </div>

        <div v-if="recentItems.length === 0" class="card-surface p-10 text-center text-neutral-500 dark:text-neutral-400">
          暂无记录
        </div>

        <ul v-else class="card-surface divide-y divide-neutral-100 dark:divide-neutral-800">
          <li
            v-for="item in recentItems"
            :key="item.id"
            @click="navigateToItem(item)"
            class="group flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/40 transition-colors"
          >
            <span
              class="shrink-0 w-1.5 h-1.5 rounded-full"
              :class="item.type === 'ocr' ? 'bg-accent-500' : 'bg-neutral-400'"
            />
            <p class="flex-1 min-w-0 truncate text-sm text-neutral-800 dark:text-neutral-200">
              {{ item.preview }}
            </p>
            <span class="shrink-0 text-xs text-neutral-400 font-mono">
              {{ formatDate(item.createdAt) }}
            </span>
            <button
              @click.stop="removeItem(item)"
              :title="'删除该记录'"
              aria-label="删除记录"
              class="shrink-0 p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md opacity-70 sm:opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all touch-target"
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

// 飘动的英文字母 / 单词。固定池子避免 SSR 漂移
const LETTER_POOL = [
  'A', 'B', 'C', 'D', 'E', 'F',
  'ABC', 'READ', 'LEARN', 'GRAMMAR', 'VERB', 'NOUN',
  'λ', '∑', 'π', '∞', 'Ω', 'α'
]
const LETTER_COUNT = 14

type FloatingLetter = { text: string; style: Record<string, string> }

const letters = ref<FloatingLetter[]>([])

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function buildLetters() {
  const arr: FloatingLetter[] = []
  for (let i = 0; i < LETTER_COUNT; i++) {
    const text = LETTER_POOL[Math.floor(Math.random() * LETTER_POOL.length)]
    const size = rand(20, 56) // px
    const left = rand(2, 96) // vw
    const duration = rand(18, 32) // s
    const delay = rand(0, 24) // s —— 错开起点
    const drift = rand(-120, 120) // px 横向漂移
    arr.push({
      text,
      style: {
        left: `${left}vw`,
        fontSize: `${size}px`,
        animationDuration: `${duration}s`,
        animationDelay: `-${delay}s`,
        '--drift': `${drift}px`
      } as Record<string, string>
    })
  }
  return arr
}

onMounted(() => {
  store.loadRecents()
  letters.value = buildLetters()
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
