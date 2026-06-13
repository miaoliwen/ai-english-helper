// src/stores/__tests__/config.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useConfigStore } from '../config'

describe('config store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Mock localStorage
    const store: Record<string, string> = {}
    vi.stubGlobal('localStorage', {
      getItem: vi.fn((key: string) => store[key] || null),
      setItem: vi.fn((key: string, value: string) => { store[key] = value }),
      removeItem: vi.fn((key: string) => { delete store[key] }),
      clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]) })
    })
  })

  it('should initialize with default config', () => {
    const store = useConfigStore()
    expect(store.mode).toBe('server')
    expect(store.customModels).toEqual([])
    expect(store.serverModels).toEqual([])
  })

  it('should set mode', () => {
    const store = useConfigStore()
    store.setMode('custom')
    expect(store.mode).toBe('custom')
    expect(localStorage.getItem('aieh-app-config')).toContain('"mode":"custom"')
  })

  it('should add custom model', () => {
    const store = useConfigStore()
    const newModel = store.addCustomModel('chat')
    expect(newModel.id).toBeDefined()
    expect(newModel.name).toBe('新对话模型')
    expect(store.customModels.length).toBe(1)
  })

  it('should update custom model', () => {
    const store = useConfigStore()
    const newModel = store.addCustomModel('chat')
    const updatedModel = { ...newModel, name: 'Updated Model' }
    store.updateCustomModel(updatedModel)
    expect(store.customModels[0].name).toBe('Updated Model')
  })

  it('should remove custom model', () => {
    const store = useConfigStore()
    const newModel = store.addCustomModel('chat')
    store.removeCustomModel(newModel.id)
    expect(store.customModels.length).toBe(0)
  })

  it('should set active model', () => {
    const store = useConfigStore()
    const newModel = store.addCustomModel('chat')
    store.setActiveModel(newModel.id, 'chat')
    expect(store.config.activeChatId).toBe(newModel.id)
  })
})