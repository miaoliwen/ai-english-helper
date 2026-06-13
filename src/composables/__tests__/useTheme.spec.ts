import { describe, it, expect, beforeEach, vi } from 'vitest'

const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value },
    clear: () => { store = {} },
    removeItem: (key: string) => { delete store[key] },
  }
})()

describe('useTheme', () => {
  beforeEach(() => {
    document.documentElement.classList.remove('dark')
    localStorageMock.clear()
    vi.stubGlobal('localStorage', localStorageMock)
    vi.resetModules()
  })

  it('provides theme controls', async () => {
    const { useTheme } = await import('../useTheme')
    const { currentTheme, toggleTheme, applyTheme } = useTheme()
    expect(currentTheme).toBeDefined()
    expect(typeof toggleTheme).toBe('function')
    expect(typeof applyTheme).toBe('function')
  })

  it('defaults to light', async () => {
    const { useTheme } = await import('../useTheme')
    const { currentTheme } = useTheme()
    expect(currentTheme.value).toBe('light')
  })

  it('toggles between light and dark', async () => {
    const { useTheme } = await import('../useTheme')
    const { currentTheme, isDark, toggleTheme } = useTheme()
    const initial = currentTheme.value
    toggleTheme()
    expect(currentTheme.value).not.toBe(initial)
    expect(isDark.value).toBe(currentTheme.value === 'dark')
  })

  it('applies theme and persists to localStorage', async () => {
    const { useTheme } = await import('../useTheme')
    const { currentTheme, applyTheme } = useTheme()
    applyTheme('dark')
    expect(currentTheme.value).toBe('dark')
    expect(localStorageMock.getItem('aieh-theme')).toBe('dark')
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('switches back to light', async () => {
    const { useTheme } = await import('../useTheme')
    const { currentTheme, applyTheme } = useTheme()
    applyTheme('dark')
    applyTheme('light')
    expect(currentTheme.value).toBe('light')
    expect(localStorageMock.getItem('aieh-theme')).toBe('light')
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })
})
