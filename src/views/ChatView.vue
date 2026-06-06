<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100dvh-5rem)]">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full py-5">
      <!-- Sidebar (desktop) -->
      <div class="hidden lg:block lg:col-span-1">
        <div class="card-surface p-4 h-full flex flex-col">
          <button @click="startNewChat" class="btn-primary w-full flex items-center justify-center gap-2 mb-4">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
            </svg>
            <span>新对话</span>
          </button>

          <div v-if="store.currentOCR" class="p-3 bg-accent-50 rounded-2xl mb-4">
            <p class="text-xs font-semibold text-accent-700 mb-1">已关联识别结果</p>
            <p class="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{{ store.currentOCR.text.slice(0, 50) }}...</p>
          </div>

          <div class="flex items-center justify-between mb-2 px-1">
            <h3 class="text-xs font-semibold tracking-widest uppercase text-neutral-400">历史对话</h3>
            <span class="text-xs text-neutral-400 font-mono">{{ store.recentChats.length }}</span>
          </div>
          <div class="flex-1 overflow-y-auto space-y-1 -mx-1">
            <div v-for="session in store.recentChats" :key="session.id"
                 class="group flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-300"
                 :class="currentSession?.id === session.id ? 'bg-accent-50 text-accent-700' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'">
              <button @click="loadChat(session.id)" class="flex-1 text-left min-w-0">
                <p class="truncate font-medium">{{ session.title || '未命名对话' }}</p>
                <p class="text-xs text-neutral-400 truncate">{{ session.messages[session.messages.length - 1]?.content.slice(0, 24) || '无消息' }}</p>
              </button>
              <button @click.stop="removeChat(session.id)"
                      class="ml-1.5 p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg lg:opacity-0 lg:group-hover:opacity-100 transition-all touch-target"
                      aria-label="删除对话">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Chat Area -->
      <div class="lg:col-span-3 flex flex-col h-full card-surface overflow-hidden">
        <!-- Header -->
        <div class="px-4 sm:px-6 py-4 border-b border-neutral-100 flex items-center justify-between gap-2">
          <div class="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <!-- 移动端：抽屉触发器 -->
            <button
              @click="isHistoryOpen = true"
              class="lg:hidden p-2 -ml-1 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 rounded-xl touch-target"
              aria-label="打开历史对话"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5M3.75 17.25h16.5"/>
              </svg>
            </button>
            <div class="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/>
              </svg>
            </div>
            <div class="min-w-0">
              <ModelSwitcher
                kind="chat"
                :presets="store.modelPresets.chat"
                :active-id="store.modelPresets.activeChatId"
                :disabled="isStreaming"
                @select="onSelectChat"
                @manage="openSettings"
              />
              <p class="text-[10px] text-neutral-400 font-mono truncate max-w-[160px] sm:max-w-[200px]">
                {{ store.modelSettings.chatModel || '未配置' }}
              </p>
            </div>
          </div>
          <div class="flex items-center gap-1 sm:gap-2 shrink-0">
            <ExportPanel v-if="currentSession && currentSession.messages.length > 0" :content="exportContent" :title="currentSession.title" />
            <button v-if="currentSession && currentSession.messages.length > 0" @click="addChatToFavorites"
                    class="p-2 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 rounded-xl transition-all touch-target"
                    aria-label="收藏对话">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-6">
          <div v-if="!currentSession || currentSession.messages.length === 0" class="flex flex-col items-center justify-center h-full text-center">
            <div class="w-20 h-20 bg-accent-50 rounded-3xl flex items-center justify-center mb-5 animate-float">
              <svg class="w-10 h-10 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-2">开始对话</h3>
            <p class="text-neutral-500 dark:text-neutral-400 max-w-xs text-balance">
              {{ store.currentOCR ? '基于识别结果提问，获取深度解答' : '直接输入英语问题，AI 将为你详细解答' }}
            </p>
          </div>

          <template v-else>
            <div v-for="message in currentSession.messages" :key="message.id"
                 class="flex" :class="message.role === 'user' ? 'justify-end' : 'justify-start'">
              <div class="flex max-w-3xl" :class="message.role === 'user' ? 'flex-row-reverse' : 'flex-row'">
                <div class="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-1"
                     :class="message.role === 'user' ? 'bg-accent-100 ml-2.5' : 'bg-neutral-100 dark:bg-neutral-800 mr-2.5'">
                  <svg v-if="message.role === 'user'" class="w-3.5 h-3.5 text-accent-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                  </svg>
                  <svg v-else class="w-3.5 h-3.5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                  </svg>
                </div>
                <div class="rounded-2xl px-5 py-3.5"
                     :class="message.role === 'user' ? 'bg-accent-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'">
                  <MarkdownRenderer v-if="message.role === 'assistant'" :content="message.content" />
                  <p v-else class="leading-relaxed text-sm">{{ message.content }}</p>
                </div>
              </div>
            </div>

            <div v-if="isStreaming" class="flex justify-start">
              <div class="flex max-w-3xl">
                <div class="w-7 h-7 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center mr-2.5 mt-1">
                  <svg class="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
                  </svg>
                </div>
                <div class="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-5 py-3.5 text-neutral-800 dark:text-neutral-200">
                  <MarkdownRenderer v-if="store.streamContent" :content="store.streamContent" />
                  <div v-else class="flex items-center gap-2">
                    <div class="w-2 h-2 bg-accent-400 rounded-full animate-bounce"></div>
                    <div class="w-2 h-2 bg-accent-400 rounded-full animate-bounce animation-delay-150"></div>
                    <div class="w-2 h-2 bg-accent-400 rounded-full animate-bounce animation-delay-300"></div>
                  </div>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- Input -->
        <div class="px-4 sm:px-5 py-4 pb-nav border-t border-neutral-100">
          <div v-if="!store.isChatModelConfigured" class="mb-3 flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <p class="text-xs text-amber-700 dark:text-amber-400">对话模型未配置，请在导航栏设置中填入模型信息后开始使用</p>
          </div>
          <div class="flex items-end gap-2 sm:gap-3">
            <div class="flex-1 relative">
              <textarea
                v-model="inputMessage"
                @keydown.enter.prevent="sendMessage"
                rows="1"
                inputmode="text"
                enterkeyhint="send"
                autocapitalize="sentences"
                autocomplete="off"
                autocorrect="off"
                spellcheck="false"
                class="w-full px-4 sm:px-5 py-3.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 resize-none text-base sm:text-sm
                       focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
                :placeholder="store.isChatModelConfigured ? '输入你的问题...' : '请先配置对话模型...'"
                :disabled="isStreaming || !store.isChatModelConfigured"
              ></textarea>
            </div>
            <button @click="sendMessage" :disabled="!inputMessage.trim() || isStreaming || !store.isChatModelConfigured"
                    class="btn-primary px-4 py-3.5 disabled:opacity-40 touch-target"
                    aria-label="发送消息">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Mobile history drawer (仅 lg 以下) -->
    <Teleport to="body">
      <Transition name="slide-up">
        <div v-if="isHistoryOpen"
             class="lg:hidden fixed inset-0 z-[60] flex"
             @click.self="isHistoryOpen = false"
             role="dialog"
             aria-modal="true"
             aria-label="历史对话">
          <div class="absolute inset-0 bg-neutral-900/40 dark:bg-black/60 backdrop-blur-sm"></div>
          <div class="relative ml-auto w-[85%] max-w-sm h-full bg-white dark:bg-neutral-900 shadow-2xl flex flex-col pt-safe">
            <div class="px-5 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">历史对话</h3>
              <button @click="isHistoryOpen = false"
                      class="p-2 -mr-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl touch-target"
                      aria-label="关闭">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div class="px-4 py-3 shrink-0">
              <button @click="startNewChat(); isHistoryOpen = false"
                      class="btn-primary w-full flex items-center justify-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
                </svg>
                新对话
              </button>
            </div>
            <div v-if="store.currentOCR" class="mx-4 mb-3 p-3 bg-accent-50 rounded-2xl">
              <p class="text-xs font-semibold text-accent-700 mb-1">已关联识别结果</p>
              <p class="text-sm text-neutral-700 dark:text-neutral-300 line-clamp-2">{{ store.currentOCR.text.slice(0, 60) }}...</p>
            </div>
            <div class="flex-1 overflow-y-auto px-3 pb-nav">
              <div v-if="store.recentChats.length === 0" class="text-center text-sm text-neutral-400 py-10">
                还没有历史对话
              </div>
              <div v-else class="space-y-1">
                <div v-for="session in store.recentChats" :key="session.id"
                     class="group flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm"
                     :class="currentSession?.id === session.id ? 'bg-accent-50 text-accent-700' : 'text-neutral-600 dark:text-neutral-400'">
                  <button @click="loadChat(session.id); isHistoryOpen = false" class="flex-1 text-left min-w-0">
                    <p class="truncate font-medium">{{ session.title || '未命名对话' }}</p>
                    <p class="text-xs text-neutral-400 truncate">{{ session.messages[session.messages.length - 1]?.content.slice(0, 30) || '无消息' }}</p>
                  </button>
                  <button @click.stop="removeChat(session.id)"
                          class="p-2 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg touch-target shrink-0"
                          aria-label="删除对话">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Toast: 使用 safe-area 避开刘海 -->
    <Transition name="scale">
      <div v-if="toast" class="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-lg text-sm font-medium"
           :style="{ top: `max(5.5rem, calc(env(safe-area-inset-top, 0px) + 1rem))` }"
           :class="toast.type === 'success' ? 'bg-neutral-900 text-white' : 'bg-red-600 text-white'">
        {{ toast.message }}
      </div>
    </Transition>

    <SettingsModal v-model:visible="isSettingsOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { v4 as uuidv4 } from '@/utils/uuid'
import { streamChatCompletion, mockStreamChatCompletion } from '@/services/deepseek'
import { buildChatSystemPrompt, wrapUserMessage } from '@/services/prompts'
import { sanitizeUntrusted } from '@/utils/sanitize'
import { validateMessagesLength } from '@/services/config'
import { useScrollLock } from '@/composables/useScrollLock'
import type { ChatMessage, DeepSeekMessage } from '@/types'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import ModelSwitcher from '@/components/ModelSwitcher.vue'
import SettingsModal from '@/components/SettingsModal.vue'

const USE_REAL_API = true

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const inputMessage = ref('')
const isStreaming = ref(false)
const messagesContainer = ref<HTMLDivElement>()
const currentSession = computed(() => store.currentChat)
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

// 取消句柄：路由切换或组件卸载时，把 in-flight 流式 chunk 回调短路。
// 避免切换到别的对话时，旧响应的 chunk 继续写入新对话的 streamContent。
interface StreamCancel { cancelled: boolean }
let activeCancel: StreamCancel | null = null
function createStreamCancel(): StreamCancel { return { cancelled: false } }
function cancelActiveStream() {
  if (activeCancel) activeCancel.cancelled = true
  if (isStreaming.value) isStreaming.value = false
}

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 2400)
}

const isSettingsOpen = ref(false)
function openSettings() { isSettingsOpen.value = true }

// 移动端历史对话抽屉
const isHistoryOpen = ref(false)
useScrollLock(isHistoryOpen)

async function onSelectChat(id: string) {
  await store.setActiveChatPreset(id)
  showToast('success', '已切换对话模型')
}

const exportContent = computed(() => {
  if (!currentSession.value) return ''
  return currentSession.value.messages.map(m => {
    const role = m.role === 'user' ? '## 用户' : '## AI助手'
    return `${role}\n\n${m.content}\n`
  }).join('\n---\n\n')
})

onMounted(async () => {
  await store.loadRecents()
  const chatId = route.params.id as string
  if (chatId) await store.loadChat(chatId)
})

watch(() => route.params.id, async (id) => {
  // 切对话/退出当前对话时，把 in-flight 流停下，避免 chunk 串到新会话
  cancelActiveStream()
  if (id) await store.loadChat(id as string)
})

// 组件卸载时清理
onBeforeUnmount(() => {
  cancelActiveStream()
  if (toastTimer) {
    clearTimeout(toastTimer)
    toastTimer = null
  }
})

async function startNewChat() {
  const session = await store.createChatSession('新对话', store.currentOCR?.id)
  router.push(`/chat/${session.id}`)
}

async function loadChat(id: string) {
  router.push(`/chat/${id}`)
}

async function removeChat(id: string) {
  if (!confirm('确定要删除这个对话吗？此操作不可恢复。')) return
  const isCurrent = currentSession.value?.id === id
  await store.deleteChat(id)
  // store.deleteChat 已自动清空 currentChat；如非当前会话则无须处理
  showToast('success', '对话已删除')
  // 若用户停留在 /chat/:id 路由且当前对话被删，URL 已失效，重定向到 /chat
  if (isCurrent && route.params.id === id) {
    router.replace('/chat')
  }
}

async function sendMessage() {
  if (!inputMessage.value.trim() || isStreaming.value) return
  const content = inputMessage.value.trim()
  inputMessage.value = ''

  if (!currentSession.value) await startNewChat()

  const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content, timestamp: Date.now() }
  await store.addMessageToChat(currentSession.value!.id, userMessage)
  await scrollToBottom()

  // 早期长度校验：流开始前先检查整轮消息长度，
  // 避免流到一半才因总长超限被服务方拒掉
  const messages = buildMessages(content)
  try {
    validateMessagesLength(messages)
  } catch (error) {
    const message = error instanceof Error ? error.message : '请求失败'
    showToast('error', message)
    return
  }

  isStreaming.value = true
  store.clearStreamContent()

  // 准备取消句柄：路由切换或组件卸载时调用，停止后续写入
  const cancel = createStreamCancel()
  activeCancel = cancel

  try {
    let currentText = ''

    const apiCall = USE_REAL_API ? streamChatCompletion : mockStreamChatCompletion
    await apiCall(
      messages,
      (chunk) => {
        if (cancel.cancelled) return
        currentText += chunk
        store.appendStreamContent(chunk)
        scrollToBottom()
      },
      () => { isStreaming.value = false },
      (error) => { console.error('Stream error:', error); isStreaming.value = false },
      {
        baseUrl: store.modelSettings.chatBaseUrl,
        apiKey: store.modelSettings.chatApiKey,
        modelId: store.modelSettings.chatModel
      }
    )

    if (cancel.cancelled) {
      // 被取消时把已收集的内容落库，附 cancellation 标记
      if (currentSession.value && currentText) {
        const assistantMessage: ChatMessage = { id: uuidv4(), role: 'assistant', content: currentText + '\n\n_[回复已中断]_', timestamp: Date.now() }
        await store.addMessageToChat(currentSession.value.id, assistantMessage)
      }
      store.clearStreamContent()
      isStreaming.value = false
      return
    }

    const assistantMessage: ChatMessage = { id: uuidv4(), role: 'assistant', content: currentText, timestamp: Date.now() }
    if (currentSession.value) await store.addMessageToChat(currentSession.value.id, assistantMessage)
    store.clearStreamContent()
  } catch (error) {
    const message = error instanceof Error ? error.message : '请求失败'
    showToast('error', message)
    isStreaming.value = false
  } finally {
    if (activeCancel === cancel) activeCancel = null
  }
}

function buildMessages(userContent: string): DeepSeekMessage[] {
  const messages: DeepSeekMessage[] = [{
    role: 'system',
    content: buildChatSystemPrompt(store.currentOCR?.markdown)
  }]
  if (currentSession.value) {
    // 历史消息也按不可信数据处理：清洗后保留角色标记，
    // 防止历史轮次里的注入尝试污染后续轮次
    for (const msg of currentSession.value.messages) {
      messages.push({
        role: msg.role,
        content: msg.role === 'user' ? wrapUserMessage(msg.content) : sanitizeUntrusted(msg.content)
      })
    }
  }
  // 当前用户消息用同一套防护包裹
  messages.push({ role: 'user', content: wrapUserMessage(userContent) })
  return messages
}

async function scrollToBottom() {
  await nextTick()
  if (messagesContainer.value) messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
}

async function addChatToFavorites() {
  if (!currentSession.value) return
  await store.addToFavorites({
    title: currentSession.value.title || '对话记录',
    type: 'chat',
    content: exportContent.value,
    chatSessionId: currentSession.value.id,
    tags: ['对话', 'AI解析']
  })
  showToast('success', '已添加到收藏')
}
</script>

<style scoped>
textarea { min-height: 48px; max-height: 120px; }
</style>
