import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { v4 as uuidv4 } from '@/utils/uuid'
import { buildChatSystemPrompt, wrapUserMessage } from '@/services/prompts'
import { sanitizeUntrusted } from '@/utils/sanitize'
import { validateMessagesLength } from '@/services/config'
import { useStreamHandler } from './useStreamHandler'
import { useToast } from './useToast'
import type { ChatMessage, DeepSeekMessage, ChatSession } from '@/types'

export function useChatActions() {
  const store = useAppStore()
  const router = useRouter()
  const route = useRoute()
  const { showToast } = useToast()
  const { isStreaming, startStream, cancelStream } = useStreamHandler()

  const currentSession = computed(() => store.currentChat)

  const exportContent = computed(() => {
    if (!currentSession.value) return ''
    return currentSession.value.messages.map(m => {
      const role = m.role === 'user' ? '## 用户' : '## AI助手'
      return `${role}\n\n${m.content}\n`
    }).join('\n---\n\n')
  })

  /** Build the messages array with system prompt + injection defense */
  function buildMessages(userContent: string): DeepSeekMessage[] {
    const messages: DeepSeekMessage[] = [{
      role: 'system',
      content: buildChatSystemPrompt(store.currentOCR?.markdown)
    }]
    if (currentSession.value) {
      for (const msg of currentSession.value.messages) {
        messages.push({
          role: msg.role,
          content: msg.role === 'user' ? wrapUserMessage(msg.content) : sanitizeUntrusted(msg.content)
        })
      }
    }
    messages.push({ role: 'user', content: wrapUserMessage(userContent) })
    return messages
  }

  async function sendMessage(content: string, scrollToBottom: () => Promise<void>) {
    if (!content || isStreaming.value) return

    if (!currentSession.value) await startNewChat()

    const userMessage: ChatMessage = { id: uuidv4(), role: 'user', content, timestamp: Date.now() }
    await store.addMessageToChat(currentSession.value!.id, userMessage)
    await scrollToBottom()

    const messages = buildMessages(content)
    try {
      validateMessagesLength(messages)
    } catch (error) {
      const msg = error instanceof Error ? error.message : '请求失败'
      showToast('error', msg)
      return
    }

    store.clearStreamContent()

    try {
      const currentText = await startStream({
        messages,
        modelId: store.modelSettings.chatModel,
        onChunk: (chunk) => {
          store.appendStreamContent(chunk)
          scrollToBottom()
        },
        onDone: () => {},
        onError: (error) => {
          showToast('error', error.message || '请求失败')
        }
      })

      // Stream completed — persist the assistant message
      if (currentText && currentSession.value) {
        const assistantMessage: ChatMessage = { id: uuidv4(), role: 'assistant', content: currentText, timestamp: Date.now() }
        await store.addMessageToChat(currentSession.value.id, assistantMessage)
      }
      store.clearStreamContent()
    } catch (error) {
      // Stream was cancelled or errored — persist partial content if available
      if (currentSession.value) {
        const partial = store.streamContent
        if (partial) {
          const assistantMessage: ChatMessage = {
            id: uuidv4(),
            role: 'assistant',
            content: partial + '\n\n_[回复已中断]_',
            timestamp: Date.now()
          }
          await store.addMessageToChat(currentSession.value.id, assistantMessage)
        }
      }
      store.clearStreamContent()
      const msg = error instanceof Error ? error.message : '请求失败'
      showToast('error', msg)
    }
  }

  async function startNewChat(): Promise<ChatSession> {
    const session = await store.createChatSession('新对话', store.currentOCR?.id)
    router.push(`/chat/${session.id}`)
    return session
  }

  async function loadChat(id: string) {
    router.push(`/chat/${id}`)
  }

  async function removeChat(id: string) {
    if (!confirm('确定要删除这个对话吗？此操作不可恢复。')) return
    const isCurrent = currentSession.value?.id === id
    await store.deleteChat(id)
    showToast('success', '对话已删除')
    if (isCurrent && route.params.id === id) {
      router.replace('/chat')
    }
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

  async function regenerateLastResponse(scrollToBottom: () => Promise<void>) {
    if (!currentSession.value || isStreaming.value) return
    const messages = currentSession.value.messages
    if (messages.length < 2) return
    const lastAssistant = messages[messages.length - 1]
    const lastUser = messages[messages.length - 2]
    if (!lastAssistant || !lastUser) return
    if (lastAssistant.role !== 'assistant' || lastUser.role !== 'user') return

    // Remove last assistant message from DB, then re-send
    await store.removeLastMessage(currentSession.value.id)
    await sendMessage(lastUser.content, scrollToBottom)
  }

  function cancelActiveStream() {
    cancelStream()
  }

  return {
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
  }
}
