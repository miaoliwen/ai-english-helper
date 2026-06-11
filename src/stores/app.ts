import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { OCRResult, ChatSession, ChatMessage, FavoriteItem, ModelSettings, ModelPreset, ModelPresets } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'
import { encryptConfig, decryptConfig } from '@/utils/crypto'
import {
  saveOCRResult,
  getOCRResult,
  getAllOCRResults,
  deleteOCRResult,
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
const MODEL_PRESETS_KEY = 'aieh-model-presets'

/** 通过 Canvas 重绘图片来剥离 EXIF 元数据（GPS、设备信息等） */
function stripExifData(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    // 非 data: URL 或非图片格式，直接返回
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
      // 以 JPEG 输出（质量 0.85），自动丢弃所有 EXIF
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

const emptyModelSettings: ModelSettings = {
  chatModel: import.meta.env.VITE_DEFAULT_CHAT_MODEL || '',
  chatBaseUrl: import.meta.env.VITE_DEFAULT_CHAT_BASE_URL || '',
  chatApiKey: '',
  visionModel: import.meta.env.VITE_DEFAULT_VISION_MODEL || '',
  visionBaseUrl: import.meta.env.VITE_DEFAULT_VISION_BASE_URL || '',
  visionApiKey: ''
}

/** 从环境变量构建的"出厂默认"对话模型预设。 */
function buildDefaultChatPreset(): ModelPreset {
  return {
    id: uuidv4(),
    name: '默认对话',
    baseUrl: import.meta.env.VITE_DEFAULT_CHAT_BASE_URL || '',
    apiKey: '',
    modelId: import.meta.env.VITE_DEFAULT_CHAT_MODEL || ''
  }
}

function buildDefaultVisionPreset(): ModelPreset {
  return {
    id: uuidv4(),
    name: '默认视觉',
    baseUrl: import.meta.env.VITE_DEFAULT_VISION_BASE_URL || '',
    apiKey: '',
    modelId: import.meta.env.VITE_DEFAULT_VISION_MODEL || ''
  }
}

async function loadModelSettings(): Promise<ModelSettings> {
  try {
    const saved = localStorage.getItem(MODEL_SETTINGS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const decrypted = await decryptConfig(parsed)
      return { ...emptyModelSettings, ...decrypted }
    }
  } catch { /* ignore */ }
  return { ...emptyModelSettings }
}

async function saveModelSettings(settings: ModelSettings) {
  // 兼容旧字段写入（迁移后不再调用，新数据走 saveModelPresets）
  const encrypted = await encryptConfig(settings as unknown as Record<string, string>)
  localStorage.setItem(MODEL_SETTINGS_KEY, JSON.stringify(encrypted))
}
// 显式导出仅用于测试或外部强制覆盖场景
export { saveModelSettings }

/**
 * 加载模型预设集合。若本地没有，尝试从旧版 ModelSettings 迁移成一条默认预设。
 */
async function loadModelPresets(): Promise<ModelPresets> {
  // 1. 尝试读新格式
  try {
    const saved = localStorage.getItem(MODEL_PRESETS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      const decrypted = await decryptConfig(parsed)
      if (decrypted.chat || decrypted.vision) {
        return normalizePresets(decrypted)
      }
    }
  } catch { /* ignore */ }

  // 2. 迁移旧 ModelSettings
  const legacy = await loadModelSettings()
  const chatPreset: ModelPreset = {
    id: uuidv4(),
    name: '已迁移：对话模型',
    baseUrl: legacy.chatBaseUrl,
    apiKey: legacy.chatApiKey,
    modelId: legacy.chatModel
  }
  const visionPreset: ModelPreset = {
    id: uuidv4(),
    name: '已迁移：视觉模型',
    baseUrl: legacy.visionBaseUrl,
    apiKey: legacy.visionApiKey,
    modelId: legacy.visionModel
  }
  return {
    chat: [chatPreset],
    vision: [visionPreset],
    activeChatId: chatPreset.id,
    activeVisionId: visionPreset.id
  }
}

async function saveModelPresets(presets: ModelPresets) {
  const encrypted = await encryptConfig(presets as unknown as Record<string, string>)
  localStorage.setItem(MODEL_PRESETS_KEY, JSON.stringify(encrypted))
}

/** 归一化：确保 activeId 指向一个真实预设，否则回退到第一个或新建默认。 */
function normalizePresets(raw: any): ModelPresets {
  const chat: ModelPreset[] = Array.isArray(raw?.chat) ? raw.chat : []
  const vision: ModelPreset[] = Array.isArray(raw?.vision) ? raw.vision : []

  if (chat.length === 0) chat.push(buildDefaultChatPreset())
  if (vision.length === 0) vision.push(buildDefaultVisionPreset())

  const activeChatId = chat.some((p) => p.id === raw?.activeChatId) ? raw.activeChatId : chat[0].id
  const activeVisionId = vision.some((p) => p.id === raw?.activeVisionId) ? raw.activeVisionId : vision[0].id

  return { chat, vision, activeChatId, activeVisionId }
}

export const useAppStore = defineStore('app', () => {
  const currentOCR = ref<OCRResult | null>(null)
  const currentChat = ref<ChatSession | null>(null)
  const isProcessing = ref(false)
  const streamContent = ref('')
  const recentOCRs = ref<OCRResult[]>([])
  const recentChats = ref<ChatSession[]>([])
  const favorites = ref<FavoriteItem[]>([])
  const settingsModalOpen = ref(false)

  // 模型预设集合（多套）
  const modelPresets = ref<ModelPresets>({
    chat: [],
    vision: [],
    activeChatId: '',
    activeVisionId: ''
  })

  // 兼容视图：当前激活的预设展开为单配置形态，供 services 读取
  const modelSettings = computed<ModelSettings>(() => {
    const chat = modelPresets.value.chat.find((p) => p.id === modelPresets.value.activeChatId)
      || modelPresets.value.chat[0]
    const vision = modelPresets.value.vision.find((p) => p.id === modelPresets.value.activeVisionId)
      || modelPresets.value.vision[0]
    return {
      chatModel: chat?.modelId || '',
      chatBaseUrl: chat?.baseUrl || '',
      chatApiKey: chat?.apiKey || '',
      visionModel: vision?.modelId || '',
      visionBaseUrl: vision?.baseUrl || '',
      visionApiKey: vision?.apiKey || ''
    }
  })

  // 异步加载加密的配置（迁移旧版 ModelSettings）
  loadModelPresets().then((presets) => {
    modelPresets.value = presets
  })

  const hasCurrentOCR = computed(() => !!currentOCR.value)
  const hasCurrentChat = computed(() => !!currentChat.value)
  const isChatModelConfigured = computed(() =>
    !!(modelSettings.value.chatBaseUrl?.trim() && modelSettings.value.chatApiKey?.trim() && modelSettings.value.chatModel?.trim())
  )
  const isVisionModelConfigured = computed(() =>
    !!(modelSettings.value.visionBaseUrl?.trim() && modelSettings.value.visionApiKey?.trim() && modelSettings.value.visionModel?.trim())
  )

  // 兼容性：任意模型已配置即视为已配置
  const isModelConfigured = computed(() => isChatModelConfigured.value || isVisionModelConfigured.value)

  function openSettings() {
    settingsModalOpen.value = true
  }

  const activeChatPreset = computed(() =>
    modelPresets.value.chat.find((p) => p.id === modelPresets.value.activeChatId) || modelPresets.value.chat[0] || null
  )
  const activeVisionPreset = computed(() =>
    modelPresets.value.vision.find((p) => p.id === modelPresets.value.activeVisionId) || modelPresets.value.vision[0] || null
  )

  // —— 模型预设 actions ——
  async function setActiveChatPreset(id: string) {
    if (!modelPresets.value.chat.some((p) => p.id === id)) return
    modelPresets.value = { ...modelPresets.value, activeChatId: id }
    await saveModelPresets(modelPresets.value)
  }
  async function setActiveVisionPreset(id: string) {
    if (!modelPresets.value.vision.some((p) => p.id === id)) return
    modelPresets.value = { ...modelPresets.value, activeVisionId: id }
    await saveModelPresets(modelPresets.value)
  }
  async function upsertChatPreset(preset: ModelPreset) {
    const list = [...modelPresets.value.chat]
    const idx = list.findIndex((p) => p.id === preset.id)
    if (idx >= 0) list[idx] = preset
    else list.push(preset)
    modelPresets.value = { ...modelPresets.value, chat: list }
    await saveModelPresets(modelPresets.value)
  }
  async function upsertVisionPreset(preset: ModelPreset) {
    const list = [...modelPresets.value.vision]
    const idx = list.findIndex((p) => p.id === preset.id)
    if (idx >= 0) list[idx] = preset
    else list.push(preset)
    modelPresets.value = { ...modelPresets.value, vision: list }
    await saveModelPresets(modelPresets.value)
  }
  async function removeChatPreset(id: string) {
    const list = modelPresets.value.chat.filter((p) => p.id !== id)
    if (list.length === 0) list.push(buildDefaultChatPreset())
    const activeId = modelPresets.value.activeChatId === id ? list[0].id : modelPresets.value.activeChatId
    modelPresets.value = { ...modelPresets.value, chat: list, activeChatId: activeId }
    await saveModelPresets(modelPresets.value)
  }
  async function removeVisionPreset(id: string) {
    const list = modelPresets.value.vision.filter((p) => p.id !== id)
    if (list.length === 0) list.push(buildDefaultVisionPreset())
    const activeId = modelPresets.value.activeVisionId === id ? list[0].id : modelPresets.value.activeVisionId
    modelPresets.value = { ...modelPresets.value, vision: list, activeVisionId: activeId }
    await saveModelPresets(modelPresets.value)
  }

  async function loadRecents() {
    recentOCRs.value = await getAllOCRResults()
    recentChats.value = await getAllChatSessions()
    favorites.value = await getAllFavorites()
  }

  async function createOCRResult(imageBase64: string, text: string, markdown: string) {
    // 通过 Canvas 重绘剥离 EXIF 数据（GPS 坐标、设备信息等）
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
    if (result) {
      currentOCR.value = result
    }
    return result
  }

  function clearCurrentOCR() {
    currentOCR.value = null
  }

  async function deleteOCR(id: string) {
    await deleteOCRResult(id)
    if (currentOCR.value?.id === id) {
      currentOCR.value = null
    }
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

  async function removeLastMessage(sessionId: string) {
    const session = await getChatSession(sessionId)
    if (session && session.messages.length > 0) {
      session.messages.pop()
      session.updatedAt = Date.now()
      await saveChatSession(session)
      if (currentChat.value?.id === sessionId) {
        currentChat.value = session
      }
      recentChats.value = await getAllChatSessions()
    }
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

  return {
    currentOCR,
    currentChat,
    isProcessing,
    streamContent,
    recentOCRs,
    recentChats,
    favorites,
    modelSettings,
    modelPresets,
    activeChatPreset,
    activeVisionPreset,
    hasCurrentOCR,
    hasCurrentChat,
    isChatModelConfigured,
    isVisionModelConfigured,
    isModelConfigured,
    settingsModalOpen,
    openSettings,
    loadRecents,
    createOCRResult,
    loadOCR,
    clearCurrentOCR,
    deleteOCR,
    createChatSession,
    loadChat,
    addMessageToChat,
    deleteChat,
    removeLastMessage,
    addToFavorites,
    removeFavorite,
    searchFavoriteItems,
    setStreamContent,
    appendStreamContent,
    clearStreamContent,
    setActiveChatPreset,
    setActiveVisionPreset,
    upsertChatPreset,
    upsertVisionPreset,
    removeChatPreset,
    removeVisionPreset
  }
})
