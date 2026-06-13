import { api } from './api'
import { OCR_VISION_PROMPT } from './prompts'

export interface MimoOCRResponse {
  text: string
  markdown: string
  confidence: number
}

export async function recognizeImage(
  imageBase64: string,
  modelId?: string
): Promise<MimoOCRResponse> {
  const data = await api.proxyVision({
    model: modelId || 'gpt-4o',
    messages: [
      { role: 'system', content: OCR_VISION_PROMPT },
      {
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: imageBase64 } }
        ]
      }
    ],
    temperature: 0.2,
    max_tokens: 4096
  })

  const content = data.choices?.[0]?.message?.content || ''

  return {
    text: content.replace(/^[#>\-\s]+|[`*_~]+|```/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 500),
    markdown: content,
    confidence: 0.95
  }
}
