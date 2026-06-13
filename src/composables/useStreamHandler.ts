import { ref, onBeforeUnmount } from 'vue'
import { streamChatCompletion } from '@/services/deepseek'
import type { DeepSeekMessage } from '@/types'

export interface StreamHandlerOptions {
  messages: DeepSeekMessage[]
  modelId: string
  onChunk: (chunk: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
}

export function useStreamHandler() {
  const isStreaming = ref(false)
  let abortController: AbortController | null = null

  async function startStream(options: StreamHandlerOptions): Promise<string> {
    const { messages, modelId, onChunk, onDone, onError } = options

    cancelStream()

    isStreaming.value = true
    abortController = new AbortController()
    const signal = abortController.signal

    let currentText = ''

    try {
      await streamChatCompletion(
        messages,
        (chunk) => {
          if (signal.aborted) return
          currentText += chunk
          onChunk(chunk)
        },
        () => { isStreaming.value = false; onDone?.() },
        (error) => {
          if (signal.aborted) {
            isStreaming.value = false
            return
          }
          console.error('Stream error:', error)
          isStreaming.value = false
          onError?.(error)
        },
        { modelId, signal }
      )
    } catch (error) {
      if (!signal.aborted) {
        isStreaming.value = false
        throw error
      }
    } finally {
      if (!signal.aborted) {
        isStreaming.value = false
      }
    }

    return currentText
  }

  function cancelStream() {
    if (abortController) {
      abortController.abort()
      abortController = null
    }
    isStreaming.value = false
  }

  onBeforeUnmount(() => cancelStream())

  return { isStreaming, startStream, cancelStream }
}
