// src/stores/config.ts

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import type { AppConfig, CustomModelConfig, ServerModelConfig, ModelType } from '@/types/config'
import { v4 as uuidv4 } from '@/utils/uuid'
import { encodeApiKey, decodeApiKey } from '@/utils/crypto'

const APP_CONFIG_KEY = 'aieh-app-config'

// 加载配置
function loadConfig(): AppConfig {
  try {
    const saved = localStorage.getItem(APP_CONFIG_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      // 解密API Keys
      if (parsed.customModels) {
        parsed.customModels = parsed.customModels.map((m: CustomModelConfig) => ({
          ...m,
          apiKey: decodeApiKey(m.apiKey)
        }))
      }
      return parsed
    }
  } catch (e) {
    // 使用默认配置
  }
  
  // 返回默认配置
  return {
    mode: 'server',
    customModels: [],
    serverModels: [],
    activeChatId: '',
    activeVisionId: ''
  }
}

// 保存配置
function saveConfig(config: AppConfig) {
  // 加密API Keys
  const toSave = {
    ...config,
    customModels: config.customModels.map(m => ({
      ...m,
      apiKey: encodeApiKey(m.apiKey)
    }))
  }
  localStorage.setItem(APP_CONFIG_KEY, JSON.stringify(toSave))
}

export const useConfigStore = defineStore('config', () => {
  const config = ref<AppConfig>(loadConfig())

  // 计算属性
  const mode = computed(() => config.value.mode)
  const customModels = computed(() => config.value.customModels)
  const serverModels = computed(() => config.value.serverModels)
  
  const activeChatModel = computed(() => {
    if (config.value.mode === 'server') {
      return config.value.serverModels.find(m => 
        m.modelId === 'deepseek-chat' && m.available
      ) || config.value.serverModels[0]
    }
    return config.value.customModels.find(m => m.id === config.value.activeChatId)
  })

  const activeVisionModel = computed(() => {
    if (config.value.mode === 'server') {
      return config.value.serverModels.find(m => 
        m.modelId === 'gpt-4o' && m.available
      ) || config.value.serverModels[0]
    }
    return config.value.customModels.find(m => m.id === config.value.activeVisionId)
  })

  // 方法
  function setMode(mode: 'custom' | 'server') {
    config.value.mode = mode
    saveConfig(config.value)
  }

  function addCustomModel(modelType: ModelType): CustomModelConfig {
    const id = uuidv4()
    const newModel: CustomModelConfig = {
      id,
      name: modelType === 'chat' ? '新对话模型' : '新视觉模型',
      apiKey: '',
      baseUrl: '',
      modelId: '',
      apiFormat: 'auto'
    }
    config.value.customModels.push(newModel)
    saveConfig(config.value)
    return newModel
  }

  function updateCustomModel(model: CustomModelConfig) {
    const index = config.value.customModels.findIndex(m => m.id === model.id)
    if (index !== -1) {
      config.value.customModels[index] = model
      saveConfig(config.value)
    }
  }

  function removeCustomModel(id: string) {
    config.value.customModels = config.value.customModels.filter(m => m.id !== id)
    if (config.value.activeChatId === id) {
      config.value.activeChatId = config.value.customModels[0]?.id || ''
    }
    if (config.value.activeVisionId === id) {
      config.value.activeVisionId = config.value.customModels[0]?.id || ''
    }
    saveConfig(config.value)
  }

  function setActiveModel(id: string, modelType: ModelType) {
    if (modelType === 'chat') {
      config.value.activeChatId = id
    } else {
      config.value.activeVisionId = id
    }
    saveConfig(config.value)
  }

  function getCustomModelsByType(modelType: ModelType): CustomModelConfig[] {
    return config.value.customModels.filter(m => {
      if (modelType === 'chat') {
        return !m.modelId.includes('vision') && !m.modelId.includes('gpt-4o')
      } else {
        return m.modelId.includes('vision') || m.modelId.includes('gpt-4o') || m.modelId === ''
      }
    })
  }

  async function fetchServerModels(): Promise<ServerModelConfig[]> {
    try {
      const token = localStorage.getItem('aieh-access-token') || '';
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
      const response = await fetch(`${baseUrl}/api/models/server`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!response.ok) return [];
      const data = await response.json();
      return (data.models || []).map((m: any) => ({
        id: m.id,
        name: m.name,
        modelId: m.modelId,
        type: m.type,
        providerName: m.providerName,
        available: true,
      }));
    } catch {
      return [];
    }
  }

  return {
    config,
    mode,
    customModels,
    serverModels,
    activeChatModel,
    activeVisionModel,
    setMode,
    addCustomModel,
    updateCustomModel,
    removeCustomModel,
    setActiveModel,
    getCustomModelsByType,
    fetchServerModels
  }
})