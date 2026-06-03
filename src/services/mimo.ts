export interface MimoOCRResponse {
  text: string
  markdown: string
  confidence: number
}

function normalizeUrl(url: string): string {
  // 移除末尾的斜杠
  return url.replace(/\/+$/, '')
}

function getConfig(userSettings?: { baseUrl?: string; apiKey?: string; modelId?: string }) {
  const baseUrl = userSettings?.baseUrl?.trim()
  const apiKey = userSettings?.apiKey?.trim()
  const modelId = userSettings?.modelId?.trim()

  if (!baseUrl) throw new Error('Base URL 未配置，请先在设置中配置视觉模型的 Base URL')
  if (!apiKey) throw new Error('API Key 未配置，请先在设置中配置视觉模型的 API Key')
  if (!modelId) throw new Error('模型 ID 未配置，请先在设置中配置视觉模型的模型 ID')

  return { apiUrl: normalizeUrl(baseUrl), apiKey, modelId }
}

/**
 * 调用 Mimo 进行视觉结构化识别 (OpenAI兼容格式)
 * @param imageBase64 图片 Base64 数据 (含 data:image/... 前缀)
 * @returns 识别结果
 */
export async function recognizeImage(
  imageBase64: string,
  userSettings?: { baseUrl?: string; apiKey?: string; modelId?: string }
): Promise<MimoOCRResponse> {
  const cfg = getConfig(userSettings)
  if (!cfg.apiKey) {
    throw new Error('Mimo API Key 未配置，请在设置或 .env.local 中配置')
  }

  console.log('[Mimo] 请求 URL:', cfg.apiUrl)
  console.log('[Mimo] 模型 ID:', cfg.modelId)

  const response = await fetch(cfg.apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.modelId,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: '请识别这张图片中的内容。如果是英语题目，请提取所有文本、公式和选项，并以结构化的 Markdown 格式输出。保留原始排版和公式（使用 LaTeX 语法）。'
            },
            {
              type: 'image_url',
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    console.error('[Mimo] API 错误响应:', error)
    throw new Error(error.error?.message || `Mimo API 错误: ${response.status} ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  return {
    text: content.replace(/[#*`\-_\[\]()$]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500),
    markdown: content,
    confidence: 0.95
  }
}

/**
 * 模拟识别（用于开发测试，无需真实 API Key）
 */
export async function mockRecognizeImage(_imageBase64: string): Promise<MimoOCRResponse> {
  await new Promise(resolve => setTimeout(resolve, 1500))

  return {
    text: 'Sample English reading comprehension text for development testing.',
    markdown: `## 识别结果

**题目类型：** 英语阅读理解

### 原文
This is a sample passage for testing the OCR and AI analysis pipeline. The actual content will be replaced when connected to the real Mimo V2.5 API.

### 问题
1. What is the main idea of this passage?
2. Which of the following statements is true according to the text?

### 选项
- A. Option A
- B. Option B
- C. Option C
- D. Option D

### 公式示例
$$E = mc^2$$

---
*识别时间：${new Date().toLocaleString('zh-CN')}*`,
    confidence: 0.95
  }
}