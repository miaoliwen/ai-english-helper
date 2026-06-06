import { readApiError, resolveModelConfig, limitedFetch, validateMessagesLength, type ApiModelSettings } from './config'

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface DeepSeekStreamChunk {
  id: string
  choices: Array<{
    delta: {
      content?: string
      role?: string
    }
    index: number
    finish_reason: string | null
  }>
}

/**
 * 非流式调用 OpenAI 兼容的 Chat Completions API。
 */
export async function chatCompletion(
  messages: DeepSeekMessage[],
  userSettings?: ApiModelSettings
): Promise<string> {
  const cfg = resolveModelConfig(userSettings, '对话模型')
  validateMessagesLength(messages)

  const response = await limitedFetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.modelId,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, '对话模型'))
  }

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

/**
 * 流式调用 OpenAI 兼容的 Chat Completions API。
 */
export async function streamChatCompletion(
  messages: DeepSeekMessage[],
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void,
  userSettings?: ApiModelSettings
): Promise<void> {
  try {
    const cfg = resolveModelConfig(userSettings, '对话模型')
    validateMessagesLength(messages)
    const response = await limitedFetch(cfg.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cfg.apiKey}`
      },
      body: JSON.stringify({
        model: cfg.modelId,
        messages,
        stream: true,
        temperature: 0.7,
        max_tokens: 4096
      })
    })

    if (!response.ok) {
      throw new Error(await readApiError(response, '对话模型'))
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('无法读取流式响应')
    }

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

/**
 * 开发演示用的模拟流式响应，无需真实 API Key。
 */
export async function mockStreamChatCompletion(
  messages: DeepSeekMessage[],
  onChunk: (content: string) => void,
  onDone?: () => void
): Promise<void> {
  const lastMessage = messages[messages.length - 1]?.content || ''
  const hasOCRContext = messages.some(m => m.role === 'system' && m.content.includes('OCR'))

  const mockResponse = hasOCRContext
    ? `## 深度解析

我已经读取到题目图片的 OCR 内容。下面会按英语题常见解题路径处理：

### 题目定位
先定位题干关键词，再回到原文寻找同义替换或转折信息。

### 答题思路
1. 判断题型：主旨、细节、推理或词义。
2. 排除绝对化、无中生有和偷换概念的选项。
3. 用原文证据支撑最终答案。

如果你继续追问某一道小题，我会进一步拆解选项。`
    : `## 回答

你问的是：**${lastMessage}**

我会先解释核心语法或阅读逻辑，再给出例句和常见误区。`

  for (const chunk of mockResponse.split('')) {
    await new Promise(resolve => setTimeout(resolve, 15))
    onChunk(chunk)
  }
  onDone?.()
}
