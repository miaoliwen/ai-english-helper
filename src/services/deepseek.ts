import { api } from './api'

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekStreamChunk {
  id: string
  choices: Array<{
    delta: { content?: string; role?: string }
    index: number
    finish_reason: string | null
  }>
}

export async function streamChatCompletion(
  messages: DeepSeekMessage[],
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void,
  options?: { modelId?: string; signal?: AbortSignal }
): Promise<void> {
  try {
    const response = await api.proxyChatStream({
      model: options?.modelId || 'deepseek-chat',
      messages,
      stream: true,
    }, options?.signal)

    const reader = response.body?.getReader()
    if (!reader) throw new Error('无法读取流式响应')

    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split(/\r?\n/)
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed || !trimmed.startsWith('data:')) continue

        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') {
          onDone?.()
          return
        }

        try {
          const parsed: DeepSeekStreamChunk = JSON.parse(payload)
          const content = parsed.choices?.[0]?.delta?.content
          if (content) onChunk(content)
          if (parsed.choices?.[0]?.finish_reason) {
            onDone?.()
            return
          }
        } catch {
          // Ignore keepalive or partial provider-specific lines.
        }
      }
    }

    onDone?.()
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error))
    onError?.(err)
    throw err
  }
}
