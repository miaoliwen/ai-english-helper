// src/services/__tests__/modelApi.spec.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { detectApiFormat, fetchModelList, testConnection } from '../modelApi'

describe('modelApi', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  describe('detectApiFormat', () => {
    it('should detect openai format', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true
      }))

      const format = await detectApiFormat('https://api.openai.com')
      expect(format).toBe('openai')
    })

    it('should detect deepseek format', async () => {
      vi.stubGlobal('fetch', vi.fn()
        .mockResolvedValueOnce({ ok: false })
        .mockResolvedValueOnce({ ok: true })
      )

      const format = await detectApiFormat('https://api.deepseek.com')
      expect(format).toBe('deepseek')
    })

    it('should return auto when no format detected', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false
      }))

      const format = await detectApiFormat('https://unknown.api.com')
      expect(format).toBe('auto')
    })
  })

  describe('fetchModelList', () => {
    it('should fetch openai format models', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          data: [
            { id: 'gpt-4', name: 'GPT-4' },
            { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' }
          ]
        })
      }))

      const result = await fetchModelList('https://api.openai.com', 'sk-test', 'openai')
      expect(result.models).toHaveLength(2)
      expect(result.models[0].id).toBe('gpt-4')
    })

    it('should fetch deepseek format models', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          models: [
            { id: 'deepseek-chat', name: 'DeepSeek Chat' }
          ]
        })
      }))

      const result = await fetchModelList('https://api.deepseek.com', 'sk-test', 'deepseek')
      expect(result.models).toHaveLength(1)
      expect(result.models[0].id).toBe('deepseek-chat')
    })

    it('should throw error on failure', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Unauthorized'
      }))

      await expect(fetchModelList('https://api.openai.com', 'invalid', 'openai'))
        .rejects.toThrow('获取模型列表失败: Unauthorized')
    })
  })

  describe('testConnection', () => {
    it('should return success when connection works', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ data: [] })
      }))

      const result = await testConnection('https://api.openai.com', 'sk-test', 'gpt-4', 'openai')
      expect(result.success).toBe(true)
    })

    it('should return failure when connection fails', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')))

      const result = await testConnection('https://api.openai.com', 'sk-test', 'gpt-4', 'openai')
      expect(result.success).toBe(false)
      expect(result.message).toBe('Network error')
    })
  })
})