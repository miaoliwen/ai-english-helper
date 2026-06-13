const CHAT_COMPLETIONS_PATH = '/v1/chat/completions'

export function normalizeBaseUrl(baseUrl: string): string {
  let url = baseUrl.trim()
  if (!url) return ''

  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  url = url.replace(/\/+$/, '')
  if (url.endsWith(CHAT_COMPLETIONS_PATH)) {
    url = url.slice(0, -CHAT_COMPLETIONS_PATH.length).replace(/\/+$/, '')
  }
  return url
}

export function buildChatCompletionsEndpoint(baseUrl: string): string {
  return normalizeBaseUrl(baseUrl) + CHAT_COMPLETIONS_PATH
}

export async function readApiError(response: Response, label?: string): Promise<string> {
  try {
    const body = await response.json()
    return `${label ? `[${label}] ` : ''}${body.error?.message || body.error || response.statusText}`
  } catch {
    return `${label ? `[${label}] ` : ''}HTTP ${response.status}: ${response.statusText}`
  }
}

const MAX_CONTENT_LENGTH = 8000

export function validateMessagesLength(messages: Array<{ role: string; content: string }>): void {
  for (const msg of messages) {
    if (typeof msg.content === 'string' && msg.content.length > MAX_CONTENT_LENGTH * 5) {
      throw new Error(`消息过长（超过 ${(MAX_CONTENT_LENGTH * 5 / 1000).toFixed(0)}k 字符）`)
    }
  }
}
