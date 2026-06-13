import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OCRResult, ChatSession, ChatMessage, FavoriteItem, ModelSettings } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'
import {
  saveOCRResult, getOCRResult, getAllOCRResults, deleteOCRResult,
  saveChatSession, getChatSession, getAllChatSessions, deleteChatSession
} from '@/db'
import { useModelStore } from './model'
import { useFavoritesStore } from './favorites'

const ACTIVE_CHAT_ID_KEY = 'aieh-active-chat-id'

function saveActiveChatId(id: string | null) {
  try {
    if (id) localStorage.setItem(ACTIVE_CHAT_ID_KEY, id)
    else localStorage.removeItem(ACTIVE_CHAT_ID_KEY)
  } catch { /* ignore */ }
}

function loadActiveChatId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_CHAT_ID_KEY)
  } catch { /* ignore */ }
  return null
}

function stripExifData(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    if (!dataUrl.startsWith('data:image/')) {
      resolve(dataUrl)
      return
    }
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) { resolve(dataUrl); return }
      ctx.drawImage(img, 0, 0)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export const useAppStore = defineStore('app', () => {
  const modelStore = useModelStore()
  const favoritesStore = useFavoritesStore()

  const currentOCR = ref<OCRResult | null>(null)
  const currentChat = ref<ChatSession | null>(null)
  const isProcessing = ref(false)
  const streamContent = ref('')
  const recentOCRs = ref<OCRResult[]>([])
  const recentChats = ref<ChatSession[]>([])
  const settingsModalOpen = ref(false)

  const modelPresets = computed(() => modelStore.modelPresets)
  const activeChatPreset = computed(() => modelStore.activeChatPreset)
  const activeVisionPreset = computed(() => modelStore.activeVisionPreset)
  const favorites = computed(() => favoritesStore.favorites)

  const modelSettings = computed<ModelSettings>(() => {
    return {
      chatModel: activeChatPreset.value?.modelId || '',
      visionModel: activeVisionPreset.value?.modelId || ''
    }
  })

  const savedChatId = loadActiveChatId()
  if (savedChatId) {
    getChatSession(savedChatId).then((session) => {
      if (session) {
        currentChat.value = session
        if (session.ocrResultId) {
          getOCRResult(session.ocrResultId).then((ocr) => {
            if (ocr) currentOCR.value = ocr
          })
        }
      }
    })
  }

  const hasCurrentOCR = computed(() => !!currentOCR.value)
  const hasCurrentChat = computed(() => !!currentChat.value)

  const isChatModelConfigured = computed(() =>
    !!modelSettings.value.chatModel?.trim()
  )
  const isVisionModelConfigured = computed(() =>
    !!modelSettings.value.visionModel?.trim()
  )
  const isModelConfigured = computed(() => isChatModelConfigured.value || isVisionModelConfigured.value)

  function openSettings() {
    settingsModalOpen.value = true
  }

  async function loadRecents() {
    recentOCRs.value = await getAllOCRResults()
    recentChats.value = await getAllChatSessions()
    await favoritesStore.loadAll()
  }

  async function createOCRResult(imageBase64: string, text: string, markdown: string) {
    const strippedBase64 = await stripExifData(imageBase64)
    const result: OCRResult = {
      id: uuidv4(),
      imageBase64: strippedBase64,
      text,
      markdown,
      createdAt: Date.now()
    }
    await saveOCRResult(result)
    currentOCR.value = result
    recentOCRs.value = await getAllOCRResults()
    return result
  }

  async function loadOCR(id: string) {
    const result = await getOCRResult(id)
    if (result) currentOCR.value = result
    return result
  }

  function clearCurrentOCR() {
    currentOCR.value = null
  }

  async function deleteOCR(id: string) {
    await deleteOCRResult(id)
    if (currentOCR.value?.id === id) currentOCR.value = null
    recentOCRs.value = await getAllOCRResults()
  }

  async function createChatSession(title: string, ocrResultId?: string) {
    const session: ChatSession = {
      id: uuidv4(),
      title,
      messages: [],
      ocrResultId,
      createdAt: Date.now(),
      updatedAt: Date.now()
    }
    await saveChatSession(session)
    currentChat.value = session
    saveActiveChatId(session.id)
    recentChats.value = await getAllChatSessions()
    return session
  }

  async function loadChat(id: string) {
    const session = await getChatSession(id)
    if (session) {
      currentChat.value = session
      saveActiveChatId(session.id)
      if (session.ocrResultId) {
        const ocr = await getOCRResult(session.ocrResultId)
        if (ocr) currentOCR.value = ocr
      }
    }
    return session
  }

  async function addMessageToChat(sessionId: string, message: ChatMessage) {
    const session = await getChatSession(sessionId)
    if (session) {
      session.messages.push(message)
      session.updatedAt = Date.now()
      await saveChatSession(session)
      if (currentChat.value?.id === sessionId) currentChat.value = session
      recentChats.value = await getAllChatSessions()
    }
  }

  async function deleteChat(id: string) {
    await deleteChatSession(id)
    if (currentChat.value?.id === id) {
      currentChat.value = null
      saveActiveChatId(null)
    }
    recentChats.value = await getAllChatSessions()
  }

  async function removeLastMessage(sessionId: string) {
    const session = await getChatSession(sessionId)
    if (session && session.messages.length > 0) {
      session.messages.pop()
      session.updatedAt = Date.now()
      await saveChatSession(session)
      if (currentChat.value?.id === sessionId) currentChat.value = session
      recentChats.value = await getAllChatSessions()
    }
  }

  async function addToFavorites(item: Omit<FavoriteItem, 'id' | 'createdAt'>) {
    return favoritesStore.add(item)
  }

  async function removeFavorite(id: string) {
    await favoritesStore.remove(id)
  }

  async function searchFavoriteItems(query: string) {
    await favoritesStore.search(query)
  }

  function setStreamContent(content: string) {
    streamContent.value = content
  }

  function appendStreamContent(chunk: string) {
    streamContent.value += chunk
  }

  function clearStreamContent() {
    streamContent.value = ''
  }

  return {
    currentOCR, currentChat, isProcessing, streamContent,
    recentOCRs, recentChats, favorites,
    modelSettings, modelPresets, activeChatPreset, activeVisionPreset,
    hasCurrentOCR, hasCurrentChat,
    isChatModelConfigured, isVisionModelConfigured, isModelConfigured,
    settingsModalOpen, openSettings,
    loadRecents,
    createOCRResult, loadOCR, clearCurrentOCR, deleteOCR,
    createChatSession, loadChat, addMessageToChat, deleteChat, removeLastMessage,
    addToFavorites, removeFavorite, searchFavoriteItems,
    setStreamContent, appendStreamContent, clearStreamContent,
    setActiveChatPreset: modelStore.setActiveChatPreset,
    setActiveVisionPreset: modelStore.setActiveVisionPreset,
    upsertChatPreset: modelStore.upsertChatPreset,
    upsertVisionPreset: modelStore.upsertVisionPreset,
    removeChatPreset: modelStore.removeChatPreset,
    removeVisionPreset: modelStore.removeVisionPreset
  }
})
