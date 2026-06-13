<template>
  <a
    href="#chat-main"
    class="skip-link"
  >跳转到聊天内容</a>
  <div
    id="chat-main"
    class="h-[100vh] h-[100dvh] lg:h-[calc(100vh-5rem)] lg:h-[calc(100dvh-5rem-env(safe-area-inset-top,0px))] max-w-7xl mx-auto lg:px-8"
  >
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-0 lg:gap-5 h-full lg:py-5">
      <!-- Desktop sidebar -->
      <div class="hidden lg:block lg:col-span-1">
        <ChatSidebar
          :current-o-c-r="store.currentOCR"
          :recent-chats="store.recentChats"
          :current-chat-id="currentSession?.id ?? null"
          @new-chat="startNewChat"
          @load-chat="loadChat"
          @remove-chat="removeChat"
        />
      </div>

      <!-- Chat Area -->
      <div class="lg:col-span-3 flex flex-col h-full bg-white dark:bg-black lg:card-surface overflow-hidden">
        <ChatHeader
          :is-streaming="isStreaming"
          :model-presets="store.modelPresets"
          :current-model-name="store.modelSettings.chatModel || ''"
          :current-session="currentSession"
          :export-content="exportContent"
          :has-messages="!!currentSession && currentSession.messages.length > 0"
          @open-history="isHistoryOpen = true"
          @new-chat="startNewChat"
          @select-chat-preset="onSelectChat"
          @open-settings="openSettings"
          @add-to-favorites="addChatToFavorites"
        />

        <ChatMessages
          ref="messagesRef"
          :messages="currentSession?.messages ?? []"
          :is-streaming="isStreaming"
          :stream-content="store.streamContent"
          :is-empty="!currentSession || currentSession.messages.length === 0"
          :ocr-context="store.currentOCR?.markdown ?? ''"
          @regenerate="handleRegenerate"
        />

        <ChatInput
          :disabled="isStreaming || !store.isChatModelConfigured"
          :model-configured="store.isChatModelConfigured"
          @send="handleSend"
          @open-settings="openSettings"
        />
      </div>
    </div>

    <!-- Mobile drawer -->
    <ChatMobileDrawer
      v-model:open="isHistoryOpen"
      :current-o-c-r="store.currentOCR"
      :recent-chats="store.recentChats"
      :current-chat-id="currentSession?.id ?? null"
      @new-chat="startNewChat"
      @load-chat="loadChat"
      @remove-chat="removeChat"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useChatActions } from '@/composables/useChatActions'
import { useToast } from '@/composables/useToast'
import { ChatHeader, ChatInput, ChatMessages, ChatSidebar, ChatMobileDrawer } from '@/components/chat'

const store = useAppStore()
const route = useRoute()
const router = useRouter()
const { showToast } = useToast()

const {
  isStreaming,
  currentSession,
  exportContent,
  sendMessage,
  startNewChat,
  loadChat,
  removeChat,
  addChatToFavorites,
  regenerateLastResponse,
  cancelActiveStream
} = useChatActions()

const messagesRef = ref<InstanceType<typeof ChatMessages>>()
const isHistoryOpen = ref(false)

function openSettings() { store.openSettings() }

async function onSelectChat(id: string) {
  await store.setActiveChatPreset(id)
  showToast('success', '已切换对话模型')
}

async function handleSend(content: string) {
  await sendMessage(content, async () => {
    await messagesRef.value?.scrollToBottom()
  })
}

async function handleRegenerate() {
  await regenerateLastResponse(async () => {
    await messagesRef.value?.scrollToBottom()
  })
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && isHistoryOpen.value) {
    isHistoryOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
  store.loadRecents()
  const chatId = route.params.id as string
  if (chatId) {
    store.loadChat(chatId)
  } else if (store.currentChat) {
    router.replace(`/chat/${store.currentChat.id}`)
  }
})

watch(() => route.params.id, async (id) => {
  cancelActiveStream()
  if (id) await store.loadChat(id as string)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown)
  cancelActiveStream()
})
</script>
