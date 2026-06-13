// src/utils/__tests__/crypto.spec.ts
import { describe, it, expect } from 'vitest'
import { encodeApiKey, decodeApiKey, isEncoded } from '../crypto'

describe('crypto', () => {
  it('should encode and decode api key', () => {
    const original = 'sk-test-1234567890'
    const encoded = encodeApiKey(original)
    expect(encoded).not.toBe(original)
    expect(isEncoded(encoded)).toBe(true)
    expect(decodeApiKey(encoded)).toBe(original)
  })

  it('should handle empty string', () => {
    expect(encodeApiKey('')).toBe('')
    expect(decodeApiKey('')).toBe('')
  })

  it('should handle already encoded key', () => {
    const encoded = encodeApiKey('sk-test')
    expect(decodeApiKey(encoded)).toBe('sk-test')
  })
})