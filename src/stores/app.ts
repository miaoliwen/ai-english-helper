import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OCRResult, ChatSession, ChatMessage, FavoriteItem, ModelSettings } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'
import { encryptConfig, decryptConfig } from '@/utils/crypto'
import {
  saveOCRResult,
  getOCRResult,
  getAllOCRResults,
  saveChatSession,
  getChatSession,
  getAllChatSessions,
  deleteChatSession,
  saveFavorite,
  getAllFavorites,
  deleteFavorite,
  searchFavorites
} from '@/db'

const MODEL_SETTINGS_KEY = 'aieh-model-settings'

const emptyModelSettings: ModelSettings = {
  chatModel: '',
  chatBaseUrl: '',
  chatApiKey: '',
  visionModel: '',
  visionBaseUrl: '',
  visionApiKey: ''
}

async function loadModelSettings(): Promise<ModelSettings> {
  try {
    const saved = localStorage.getItem(MODEL_SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 解密配置
      const decrypted = await decryptConfig(parsed)
      return { ...emptyModelSettings, ...decrypted }
    }
  } catch { /* ignore */ }
  return { ...emptyModelSettings }
}

async function saveModelSettings(settings: ModelSettings) {
  // 加密配置
  const encrypted = await encryptConfig(settings as unknown as Record<string, string>)
  localStorage.setItem(MODEL_SETTINGS_KEY, JSON.stringify(encrypted))
}

export const useAppStore = defineStore('app', () => {
  const currentOCR = ref<OCRResult | null>(null)
  const currentChat = ref<ChatSession | null>(null)
  const isProcessing = ref(false)
  const streamContent = ref('')
  const recentOCRs = ref<OCRResult[]>([])
  const recentChats = ref<ChatSession[]>([])
  const favorites = ref<FavoriteItem[]>([])
  const modelSettings = ref<ModelSettings>({ ...emptyModelSettings })

  // 异步加载加密的配置
  loadModelSettings().then(settings => {
    modelSettings.value = settings
  })

  const hasCurrentOCR = computed(() => !!currentOCR.value)
  const hasCurrentChat = computed(() => !!currentChat.value)
  const isChatModelConfigured = computed(() =>
    !!(modelSettings.value.chatBaseUrl?.trim() && modelSettings.value.chatApiKey?.trim() && modelSettings.value.chatModel?.trim())
  )
  const isVisionModelConfigured = computed(() =>
    !!(modelSettings.value.visionBaseUrl?.trim() && modelSettings.value.visionApiKey?.trim() && modelSettings.value.visionModel?.trim())
  )

  async function loadRecents() {
    recentOCRs.value = await getAllOCRResults()
    recentChats.value = await getAllChatSessions()
    favorites.value = await getAllFavorites()
  }

  async function createOCRResult(imageBase64: string, text: string, markdown: string) {
    const result: OCRResult = {
      id: uuidv4(),
      imageBase64,
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
    if (result) {
      currentOCR.value = result
    }
    return result
  }

  function clearCurrentOCR() {
    currentOCR.value = null
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
    recentChats.value = await getAllChatSessions()
    return session
  }

  async function loadChat(id: string) {
    const session = await getChatSession(id)
    if (session) {
      currentChat.value = session
    }
    return session
  }

  async function addMessageToChat(sessionId: string, message: ChatMessage) {
    const session = await getChatSession(sessionId)
    if (session) {
      session.messages.push(message)
      session.updatedAt = Date.now()
      await saveChatSession(session)
      if (currentChat.value?.id === sessionId) {
        currentChat.value = session
      }
      recentChats.value = await getAllChatSessions()
    }
  }

  async function deleteChat(id: string) {
    await deleteChatSession(id)
    if (currentChat.value?.id === id) {
      currentChat.value = null
    }
    recentChats.value = await getAllChatSessions()
  }

  async function addToFavorites(item: Omit<FavoriteItem, 'id' | 'createdAt'>) {
    const favorite: FavoriteItem = {
      ...item,
      id: uuidv4(),
      createdAt: Date.now()
    }
    await saveFavorite(favorite)
    favorites.value = await getAllFavorites()
    return favorite
  }

  async function removeFavorite(id: string) {
    await deleteFavorite(id)
    favorites.value = await getAllFavorites()
  }

  async function searchFavoriteItems(query: string) {
    if (!query.trim()) {
      favorites.value = await getAllFavorites()
      return
    }
    favorites.value = await searchFavorites(query)
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

  async function updateModelSettings(settings: Partial<ModelSettings>) {
    modelSettings.value = { ...modelSettings.value, ...settings }
    await saveModelSettings(modelSettings.value)
  }

  return {
    currentOCR,
    currentChat,
    isProcessing,
    streamContent,
    recentOCRs,
    recentChats,
    favorites,
    modelSettings,
    hasCurrentOCR,
    hasCurrentChat,
    isChatModelConfigured,
    isVisionModelConfigured,
    loadRecents,
    createOCRResult,
    loadOCR,
    clearCurrentOCR,
    createChatSession,
    loadChat,
    addMessageToChat,
    deleteChat,
    addToFavorites,
    removeFavorite,
    searchFavoriteItems,
    setStreamContent,
    appendStreamContent,
    clearStreamContent,
    updateModelSettings
  }
})