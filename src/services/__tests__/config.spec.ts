import { describe, it, expect } from 'vitest'
import {
  validateMessagesLength,
  normalizeBaseUrl,
  buildChatCompletionsEndpoint,
  readApiError,
} from '../config'

describe('validateMessagesLength', () => {
  it('does not throw for empty array', () => {
    expect(() => validateMessagesLength([])).not.toThrow()
  })

  it('does not throw for short messages', () => {
    const messages = [{ content: 'hello' }, { content: 'world' }]
    expect(() => validateMessagesLength(messages)).not.toThrow()
  })

  it('throws when total content exceeds 100,000 characters', () => {
    const messages = [{ content: 'a'.repeat(100_001) }]
    expect(() => validateMessagesLength(messages)).toThrow()
  })
})

describe('normalizeBaseUrl', () => {
  it('normalizes valid HTTPS URL', () => {
    expect(normalizeBaseUrl('https://api.example.com/')).toBe('https://api.example.com')
  })

  it('trims trailing whitespace', () => {
    expect(normalizeBaseUrl('  https://api.example.com  ')).toBe('https://api.example.com')
  })

  it('returns empty string for empty input', () => {
    expect(normalizeBaseUrl('')).toBe('')
  })
})

describe('buildChatCompletionsEndpoint', () => {
  it('builds from base URL', () => {
    expect(buildChatCompletionsEndpoint('https://api.example.com')).toBe(
      'https://api.example.com/v1/chat/completions'
    )
  })
})

describe('readApiError', () => {
  it('returns generic message', async () => {
    const response = new Response(null, { status: 503 })
    const msg = await readApiError(response, '测试')
    expect(msg).toContain('503')
  })
})
