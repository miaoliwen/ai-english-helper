import { readApiError, resolveModelConfig, limitedFetch, validateVisionImageSize, type ApiModelSettings } from './config'
import { OCR_VISION_PROMPT } from './prompts'

export interface MimoOCRResponse {
  text: string
  markdown: string
  confidence: number
}

/**
 * 调用 OpenAI 兼容视觉模型进行结构化 OCR。
 * @param imageBase64 图片 Base64 数据，包含 data:image/... 前缀
 */
export async function recognizeImage(
  imageBase64: string,
  userSettings?: ApiModelSettings
): Promise<MimoOCRResponse> {
  validateVisionImageSize(imageBase64)
  const cfg = resolveModelConfig(userSettings, '视觉模型')

  const response = await limitedFetch(cfg.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`
    },
    body: JSON.stringify({
      model: cfg.modelId,
      messages: [
        {
          role: 'system',
          content: OCR_VISION_PROMPT
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: imageBase64 }
            }
          ]
        }
      ],
      temperature: 0.2,
      max_tokens: 4096
    })
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, '视觉模型'))
  }

  const data = await response.json()
  const content = data.choices?.[0]?.message?.content || ''

  return {
    // 仅剥离 markdown 装饰符号；保留 $ 以便预览含 LaTeX 的公式
    text: content.replace(/^[#>\-\s]+|[`*_~]+|```/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500),
    markdown: content,
    confidence: 0.95
  }
}

/**
 * 开发演示用的模拟识别结果，无需真实 API Key。
 */
export async function mockRecognizeImage(_imageBase64: string): Promise<MimoOCRResponse> {
  await new Promise(resolve => setTimeout(resolve, 800))

  return {
    text: 'Sample English reading comprehension text for development testing.',
    markdown: `## 识别结果

**题目类型：** 英语阅读理解

### 原文
This is a sample passage for testing the OCR and AI analysis pipeline. The actual content will be replaced when connected to a real vision API.

### 问题
1. What is the main idea of this passage?
2. Which statement is true according to the text?

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
