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

function normalizeUrl(url: string): string {
  // 移除末尾的斜杠
  let normalized = url.replace(/\/+$/, '')

  // 如果 URL 已经包含 /v1/chat/completions，只保留基础部分
  if (normalized.endsWith('/v1/chat/completions')) {
    normalized = normalized.replace('/v1/chat/completions', '')
  }

  return normalized
}

function getConfig(userSettings?: { baseUrl?: string; apiKey?: string; modelId?: string }) {
  const baseUrl = userSettings?.baseUrl?.trim()
  const apiKey = userSettings?.apiKey?.trim()
  const modelId = userSettings?.modelId?.trim()

  if (!baseUrl) throw new Error('Base URL 未配置，请先在设置中配置对话模型的 Base URL')
  if (!apiKey) throw new Error('API Key 未配置，请先在设置中配置对话模型的 API Key')
  if (!modelId) throw new Error('模型 ID 未配置，请先在设置中配置对话模型的模型 ID')

  return { apiUrl: normalizeUrl(baseUrl), apiKey, modelId }
}

/**
 * 非流式调用 DeepSeek API
 */
export async function chatCompletion(
  messages: DeepSeekMessage[],
  userSettings?: { baseUrl?: string; apiKey?: string; modelId?: string }
): Promise<string> {
  const cfg = getConfig(userSettings)
  if (!cfg.apiKey) {
    throw new Error('DeepSeek API Key 未配置，请在设置或 .env.local 中配置')
  }

  const response = await fetch(`${cfg.apiUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.modelId,
      messages,
      temperature: 0.7,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error?.message || `DeepSeek API 错误: ${response.status}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

/**
 * 流式调用 DeepSeek API (SSE)
 */
export async function streamChatCompletion(
  messages: DeepSeekMessage[],
  onChunk: (content: string) => void,
  onDone?: () => void,
  onError?: (error: Error) => void,
  userSettings?: { baseUrl?: string; apiKey?: string; modelId?: string }
): Promise<void> {
  const cfg = getConfig(userSettings)
  if (!cfg.apiKey) {
    const error = new Error('DeepSeek API Key 未配置，请在设置或 .env.local 中配置')
    onError?.(error)
    throw error
  }

  try {
    const apiUrl = `${cfg.apiUrl}/v1/chat/completions`
    console.log('[DeepSeek] 请求 URL:', apiUrl)
    console.log('[DeepSeek] 模型 ID:', cfg.modelId)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${cfg.apiKey}`
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
      const errorData = await response.json().catch(() => ({}))
      console.error('[DeepSeek] API 错误响应:', errorData)
      throw new Error(errorData.error?.message || `DeepSeek API 错误: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('无法读取响应流')
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n').filter(line => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onDone?.()
            return
          }

          try {
            const parsed: DeepSeekStreamChunk = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) {
              onChunk(content)
            }
            if (parsed.choices[0]?.finish_reason === 'stop') {
              onDone?.()
              return
            }
          } catch {
            // 忽略无法解析的行
          }
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
 * 模拟流式响应（用于开发测试）
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

基于你提供的图片内容，我来详细分析这道题目：

### 题目分析
这是一道典型的英语阅读理解题，考查对文章主旨和细节的理解能力。

### 详细解答

**第一题：** 文章主要讲述了作者对于环境保护的个人见解和经历。

根据文章第一段：
> "Environmental protection is not just a slogan, but a responsibility we all share..."

可以看出作者的核心观点是环境保护需要每个人的参与。

**第二题：** 选项分析

- **A选项**：正确。因为文章明确提到了...
- **B选项**：错误。原文中并未提及经济因素...
- **C选项**：错误。与原文意思相反...
- **D选项**：错误。过于绝对化...

### 知识点总结
1. **主旨大意题**解题技巧：关注首尾段和转折词
2. **细节理解题**解题技巧：定位关键词，同义替换
3. **推理判断题**解题技巧：依据原文，避免过度推断

### 公式应用
在阅读理解中，统计数据常用于支撑论点：

$$\\text{成功率} = \\frac{\\text{正确答题数}}{\\text{总题数}} \\times 100\\%$$

如果你还有其他问题，欢迎继续提问！`
    : `## 回答

你好！关于你的问题：**"${lastMessage}"**

### 核心要点

这是一个很好的英语学习问题。让我为你详细解答：

1. **首先**，我们需要理解这个语法点的基本结构...
2. **其次**，从语用学角度分析其使用场景...
3. **最后**，结合常见错误进行对比说明...

### 示例

\`\`\`english
This is a sample sentence demonstrating the grammar point in context.
\`\`\`

### 补充说明

> 语言学习是一个循序渐进的过程，建议多阅读、多练习、多思考。

有任何不清楚的地方，随时问我！`

  const chunks = mockResponse.split('')
  for (const chunk of chunks) {
    await new Promise(resolve => setTimeout(resolve, 15))
    onChunk(chunk)
  }
  onDone?.()
}