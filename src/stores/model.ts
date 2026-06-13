import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { ModelPreset, ModelPresets } from '@/types'
import { v4 as uuidv4 } from '@/utils/uuid'

const MODEL_PRESETS_KEY = 'aieh-model-presets'

function buildDefaultChatPreset(): ModelPreset {
  return {
    id: uuidv4(),
    name: '默认对话',
    modelId: import.meta.env.VITE_DEFAULT_CHAT_MODEL || 'deepseek-chat'
  }
}

function buildDefaultVisionPreset(): ModelPreset {
  return {
    id: uuidv4(),
    name: '默认视觉',
    modelId: import.meta.env.VITE_DEFAULT_VISION_MODEL || 'gpt-4o'
  }
}

function normalizePresets(raw: unknown): ModelPresets {
  const data = raw as ModelPresets | null | undefined
  const chat: ModelPreset[] = Array.isArray(data?.chat) ? data.chat : []
  const vision: ModelPreset[] = Array.isArray(data?.vision) ? data.vision : []
  if (chat.length === 0) chat.push(buildDefaultChatPreset())
  if (vision.length === 0) vision.push(buildDefaultVisionPreset())
  const activeChatId = chat.some((p) => p.id === data?.activeChatId) ? data!.activeChatId : chat[0]!.id
  const activeVisionId = vision.some((p) => p.id === data?.activeVisionId) ? data!.activeVisionId : vision[0]!.id
  return { chat, vision, activeChatId, activeVisionId }
}

function loadPresets(): ModelPresets {
  try {
    const saved = localStorage.getItem(MODEL_PRESETS_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.chat || parsed.vision) {
        return normalizePresets(parsed)
      }
    }
  } catch { /* ignore */ }
  return normalizePresets(null)
}

function savePresets(presets: ModelPresets) {
  localStorage.setItem(MODEL_PRESETS_KEY, JSON.stringify(presets))
}

export const useModelStore = defineStore('model', () => {
  const modelPresets = ref<ModelPresets>(loadPresets())

  const activeChatPreset = computed<ModelPreset | null>(() =>
    modelPresets.value.chat.find((p) => p.id === modelPresets.value.activeChatId) ?? modelPresets.value.chat[0] ?? null
  )
  const activeVisionPreset = computed<ModelPreset | null>(() =>
    modelPresets.value.vision.find((p) => p.id === modelPresets.value.activeVisionId) ?? modelPresets.value.vision[0] ?? null
  )

  function persist() {
    savePresets(modelPresets.value)
  }

  function setActiveChatPreset(id: string) {
    if (!modelPresets.value.chat.some((p) => p.id === id)) return
    modelPresets.value = { ...modelPresets.value, activeChatId: id }
    persist()
  }

  function setActiveVisionPreset(id: string) {
    if (!modelPresets.value.vision.some((p) => p.id === id)) return
    modelPresets.value = { ...modelPresets.value, activeVisionId: id }
    persist()
  }

  function upsertChatPreset(preset: ModelPreset) {
    const list = [...modelPresets.value.chat]
    const idx = list.findIndex((p) => p.id === preset.id)
    if (idx >= 0) list[idx] = preset
    else list.push(preset)
    modelPresets.value = { ...modelPresets.value, chat: list }
    persist()
  }

  function upsertVisionPreset(preset: ModelPreset) {
    const list = [...modelPresets.value.vision]
    const idx = list.findIndex((p) => p.id === preset.id)
    if (idx >= 0) list[idx] = preset
    else list.push(preset)
    modelPresets.value = { ...modelPresets.value, vision: list }
    persist()
  }

  function removeChatPreset(id: string) {
    const list = modelPresets.value.chat.filter((p) => p.id !== id)
    if (list.length === 0) list.push(buildDefaultChatPreset())
    const activeId = modelPresets.value.activeChatId === id ? list[0]!.id : modelPresets.value.activeChatId
    modelPresets.value = { ...modelPresets.value, chat: list, activeChatId: activeId }
    persist()
  }

  function removeVisionPreset(id: string) {
    const list = modelPresets.value.vision.filter((p) => p.id !== id)
    if (list.length === 0) list.push(buildDefaultVisionPreset())
    const activeId = modelPresets.value.activeVisionId === id ? list[0]!.id : modelPresets.value.activeVisionId
    modelPresets.value = { ...modelPresets.value, vision: list, activeVisionId: activeId }
    persist()
  }

  return {
    modelPresets, activeChatPreset, activeVisionPreset,
    setActiveChatPreset, setActiveVisionPreset,
    upsertChatPreset, upsertVisionPreset,
    removeChatPreset, removeVisionPreset
  }
})
