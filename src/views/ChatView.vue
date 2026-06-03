<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[calc(100dvh-5rem)]">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-5 h-full py-5">
      <!-- Sidebar -->
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
                      class="ml-1.5 p-1 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                      title="删除对话">
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
        <div class="px-6 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/>
              </svg>
            </div>
            <div>
              <h2 class="font-semibold text-neutral-900 dark:text-neutral-100 text-sm">{{ store.modelSettings.chatModel }}</h2>
              <p class="text-xs text-neutral-400 font-mono">stream / sse</p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <ExportPanel v-if="currentSession && currentSession.messages.length > 0" :content="exportContent" :title="currentSession.title" />
            <button v-if="currentSession && currentSession.messages.length > 0" @click="addChatToFavorites"
                    class="p-2 text-neutral-400 hover:text-accent-600 hover:bg-accent-50 rounded-xl transition-all">
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
                <div class="bg-neutral-100 dark:bg-neutral-800 rounded-2xl px-5 py-3.5">
                  <div class="flex items-center gap-2">
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
        <div class="px-5 py-4 border-t border-neutral-100">
          <div v-if="!store.isChatModelConfigured" class="mb-3 flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <p class="text-xs text-amber-700 dark:text-amber-400">对话模型未配置，请在导航栏设置中填入模型信息后开始使用</p>
          </div>
          <div class="flex items-end gap-3">
            <div class="flex-1 relative">
              <textarea v-model="inputMessage" @keydown.enter.prevent="sendMessage" rows="1"
                        class="w-full px-5 py-3.5 bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 rounded-2xl text-neutral-800 dark:text-neutral-200 placeholder-neutral-400 resize-none text-sm
                               focus:outline-none focus:border-accent-400 focus:ring-2 focus:ring-accent-100 transition-all"
                        :placeholder="store.isChatModelConfigured ? '输入你的问题...' : '请先配置对话模型...'"
                        :disabled="isStreaming || !store.isChatModelConfigured"></textarea>
            </div>
            <button @click="sendMessage" :disabled="!inputMessage.trim() || isStreaming || !store.isChatModelConfigured"
                    class="btn-primary px-4 py-3.5 disabled:opacity-40">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { v4 as uuidv4 } from '@/utils/uuid'
import { streamChatCompletion, mockStreamChatCompletion } from '@/services/deepseek'
import type { ChatMessage, DeepSeekMessage } from '@/types'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ExportPanel from '@/components/ExportPanel.vue'

const USE_REAL_API = true

const store = useAppStore()
const route = useRoute()
const router = useRouter()

const inputMessage = ref('')
const isStreaming = ref(false)
const messagesContainer = ref<HTMLDivElement>()
const currentSession = computed(() => store.currentChat)

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
  if (id) await store.loadChat(id as string)
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
  if (isCurrent) router.push('/chat')
}

async function sendMessage() {
  if (!inputMessage.value.trim() || isStreaming.value) return
  const content = inputMessage.value.trim()
  inputMessage.value = ''

  if (!currentSession.value) await startNewChat()

  const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content, timestamp: Date.now() }
  await store.addMessageToChat(currentSession.value!.id, userMessage)
  await scrollToBottom()

  isStreaming.value = true
  store.clearStreamContent()

  try {
    const messages = buildMessages(content)
    let currentText = ''

    const apiCall = USE_REAL_API ? streamChatCompletion : mockStreamChatCompletion
    await apiCall(
      messages,
      (chunk) => { currentText += chunk; store.appendStreamContent(chunk); scrollToBottom() },
      () => { isStreaming.value = false },
      (error) => { console.error('Stream error:', error); isStreaming.value = false },
      {
        baseUrl: store.modelSettings.chatBaseUrl,
        apiKey: store.modelSettings.chatApiKey,
        modelId: store.modelSettings.chatModel
      }
    )

    const assistantMessage: ChatMessage = { id: uuidv4(), role: 'assistant', content: currentText, timestamp: Date.now() }
    if (currentSession.value) await store.addMessageToChat(currentSession.value.id, assistantMessage)
    store.clearStreamContent()
  } catch (error) {
    const message = error instanceof Error ? error.message : '请求失败'
    alert(message)
    isStreaming.value = false
  }
}

function buildMessages(userContent: string): DeepSeekMessage[] {
  const messages: DeepSeekMessage[] = [{
    role: 'system',
    content: `你是一位专业的英语学习助手，擅长解析英语题目、语法讲解和阅读理解分析。请使用 Markdown 格式输出，支持数学公式（LaTeX 语法）。${store.currentOCR ? '\n\n以下是通过 OCR 识别的题目内容，请基于这些内容进行解析：\n\n' + store.currentOCR.markdown : ''}`
  }]
  if (currentSession.value) {
    for (const msg of currentSession.value.messages) messages.push({ role: msg.role, content: msg.content })
  }
  messages.push({ role: 'user', content: userContent })
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
  alert('已添加到收藏')
}
</script>

<style scoped>
textarea { min-height: 48px; max-height: 120px; }
</style>