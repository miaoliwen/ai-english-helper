import { buildChatCompletionsEndpoint, readApiError } from '@/services/config'

export interface DiagnosticResult {
  success: boolean
  message: string
  details?: string
}

async function diagnoseOpenAICompatibleConfig(
  label: string,
  baseUrl: string,
  apiKey: string,
  modelId: string,
  userPrompt: string
): Promise<DiagnosticResult> {
  if (!baseUrl.trim()) {
    return {
      success: false,
      message: 'Base URL 未填写',
      details: `请填写${label}的 API 地址，例如：https://api.example.com 或 https://api.example.com/v1/chat/completions`
    }
  }

  if (!apiKey.trim()) {
    return {
      success: false,
      message: 'API Key 未填写',
      details: `请填写${label}的 API Key。若使用自建代理，也可以填写代理服务约定的访问令牌。`
    }
  }

  if (!modelId.trim()) {
    return {
      success: false,
      message: '模型 ID 未填写',
      details: `请填写${label}的模型 ID，例如 deepseek-chat、gpt-4o-mini 或服务商文档中的模型名。`
    }
  }

  let endpoint = ''
  try {
    endpoint = buildChatCompletionsEndpoint(baseUrl)
  } catch (error) {
    return {
      success: false,
      message: 'Base URL 格式不正确',
      details: error instanceof Error ? error.message : '请检查 URL 是否完整'
    }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`
      },
      body: JSON.stringify({
        model: modelId.trim(),
        messages: [{ role: 'user', content: userPrompt }],
        max_tokens: 16,
        temperature: 0
      })
    })

    if (!response.ok) {
      return {
        success: false,
        message: `API 返回错误：${response.status}`,
        details: await readApiError(response, label)
      }
    }

    return {
      success: true,
      message: `${label}配置可用`,
      details: `已成功连接 ${endpoint}，模型 ${modelId.trim()} 可访问。`
    }
  } catch (error) {
    return {
      success: false,
      message: '无法连接到 API',
      details: error instanceof Error ? error.message : '网络错误，请检查 URL、代理或浏览器跨域策略'
    }
  }
}

export function diagnoseDeepSeekConfig(
  baseUrl: string,
  apiKey: string,
  modelId: string
): Promise<DiagnosticResult> {
  return diagnoseOpenAICompatibleConfig('对话模型', baseUrl, apiKey, modelId, 'Reply with OK.')
}

export function diagnoseMimoConfig(
  baseUrl: string,
  apiKey: string,
  modelId: string
): Promise<DiagnosticResult> {
  return diagnoseOpenAICompatibleConfig('视觉模型', baseUrl, apiKey, modelId, 'Reply with OK.')
}

export function getConfigExamples() {
  return {
    chat: {
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
      modelId: 'deepseek-chat',
      description: '可填写基础 URL、/v1 地址或完整 /v1/chat/completions 端点。'
    },
    vision: {
      baseUrl: 'https://api.example.com/v1/chat/completions',
      apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
      modelId: 'gpt-4o-mini',
      description: '视觉模型需支持 OpenAI 兼容的 image_url 消息格式。'
    }
  }
}
