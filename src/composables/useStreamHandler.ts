import { ref, onBeforeUnmount } from 'vue'
import { streamChatCompletion, mockStreamChatCompletion } from '@/services/deepseek'
import type { DeepSeekMessage } from '@/types'

export interface StreamHandlerOptions {
  messages: DeepSeekMessage[]
  baseUrl: string
  apiKey: string
  modelId: string
  onChunk: (chunk: string) => void
  onDone?: () => void
  onError?: (error: Error) => void
  useRealApi?: boolean
}

export function useStreamHandler() {
  const isStreaming = ref(false)
  let abortController: AbortController | null = null

  async function startStream(options: StreamHandlerOptions): Promise<string> {
    const { messages, baseUrl, apiKey, modelId, onChunk, onDone, onError, useRealApi = true } = options

    // Abort any existing stream before starting a new one
    cancelStream()

    isStreaming.value = true
    abortController = new AbortController()
    const signal = abortController.signal

    let currentText = ''

    try {
      const apiCall = useRealApi ? streamChatCompletion : mockStreamChatCompletion
      await apiCall(
        messages,
        (chunk) => {
          if (signal.aborted) return
          currentText += chunk
          onChunk(chunk)
        },
        () => { isStreaming.value = false; onDone?.() },
        (error) => {
          // Don't report abort as an error
          if (signal.aborted) {
            isStreaming.value = false
            return
          }
          console.error('Stream error:', error)
          isStreaming.value = false
          onError?.(error)
        },
        { baseUrl, apiKey, modelId, signal }
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
