import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { DeepSeekMessage } from '@/types'

const mockStreamChatCompletion = vi.fn()

vi.mock('@/services/deepseek', () => ({
  streamChatCompletion: mockStreamChatCompletion,
}))

describe('useStreamHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const defaultMessages: DeepSeekMessage[] = [{ role: 'user', content: 'hello' }]

  it('starts with isStreaming false', async () => {
    const { useStreamHandler } = await import('../useStreamHandler')
    const { isStreaming } = useStreamHandler()
    expect(isStreaming.value).toBe(false)
  })

  it('collects chunks from stream', async () => {
    mockStreamChatCompletion.mockImplementation(
      (_messages: unknown[], onChunk: (chunk: string) => void, onDone: () => void) => {
        onChunk('Hello')
        onChunk(' world')
        onDone?.()
        return Promise.resolve()
      }
    )

    const { useStreamHandler } = await import('../useStreamHandler')
    const { isStreaming, startStream } = useStreamHandler()
    const onChunk = vi.fn()

    const result = await startStream({
      messages: defaultMessages,
      baseUrl: 'https://api.example.com',
      apiKey: 'sk-xxx',
      modelId: 'gpt-4',
      onChunk,
    })

    expect(result).toBe('Hello world')
    expect(onChunk).toHaveBeenCalledTimes(2)
    expect(isStreaming.value).toBe(false)
  })
})
