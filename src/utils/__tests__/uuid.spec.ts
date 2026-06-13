import { describe, it, expect } from 'vitest'
import { v4, generateId } from '../uuid'

const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('v4', () => {
  it('returns 36-character string', () => {
    expect(v4()).toHaveLength(36)
  })

  it('matches UUID v4 regex', () => {
    for (let i = 0; i < 100; i++) {
      expect(v4()).toMatch(UUID_V4_REGEX)
    }
  })

  it('generates unique values across 1000 calls', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      const id = v4()
      expect(seen.has(id)).toBe(false)
      seen.add(id)
    }
  })
})

describe('generateId', () => {
  it('returns a non-empty string', () => {
    const id = generateId()
    expect(id).toBeTruthy()
    expect(typeof id).toBe('string')
    expect(id.length).toBeGreaterThan(0)
  })

  it('generates unique values across 1000 calls', () => {
    const seen = new Set<string>()
    for (let i = 0; i < 1000; i++) {
      const id = generateId()
      expect(seen.has(id)).toBe(false)
      seen.add(id)
    }
  })

  it('contains only alphanumeric + hyphen characters', () => {
    for (let i = 0; i < 100; i++) {
      expect(generateId()).toMatch(/^[0-9a-z-]+$/)
    }
  })
})
