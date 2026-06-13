import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('useToast', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.resetModules()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a toast', async () => {
    const { useToast } = await import('../useToast')
    const { toast, showToast } = useToast()
    showToast('success', '操作成功')
    expect(toast.value).toEqual({ type: 'success', message: '操作成功' })
  })

  it('dismisses a toast', async () => {
    const { useToast } = await import('../useToast')
    const { toast, showToast, dismissToast } = useToast()
    showToast('success', 'test')
    expect(toast.value).not.toBeNull()
    dismissToast()
    expect(toast.value).toBeNull()
  })

  it('auto-dismisses after default duration', async () => {
    const { useToast } = await import('../useToast')
    const { toast, showToast } = useToast()
    showToast('success', 'auto dismiss')
    expect(toast.value).not.toBeNull()
    vi.advanceTimersByTime(2400)
    expect(toast.value).toBeNull()
  })

  it('auto-dismisses after custom duration', async () => {
    const { useToast } = await import('../useToast')
    const { toast, showToast } = useToast()
    showToast('error', 'custom', 500)
    vi.advanceTimersByTime(500)
    expect(toast.value).toBeNull()
  })

  it('replaces existing toast on rapid calls', async () => {
    const { useToast } = await import('../useToast')
    const { toast, showToast } = useToast()
    showToast('success', 'first')
    showToast('error', 'second')
    expect(toast.value).toEqual({ type: 'error', message: 'second' })
    vi.advanceTimersByTime(2400)
    expect(toast.value).toBeNull()
  })
})
