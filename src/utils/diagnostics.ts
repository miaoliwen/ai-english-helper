/**
 * 模型配置诊断工具
 * 帮助用户验证 API 配置是否正确
 */

export interface DiagnosticResult {
  success: boolean
  message: string
  details?: string
}

export async function diagnoseDeepSeekConfig(
  baseUrl: string,
  apiKey: string,
  modelId: string
): Promise<DiagnosticResult> {
  // 1. 验证 URL 格式
  if (!baseUrl) {
    return {
      success: false,
      message: 'Base URL 未填写',
      details: '请在设置中填写 DeepSeek API 的 Base URL，例如：https://api.deepseek.com'
    }
  }

  // 标准化 URL
  let normalizedUrl = baseUrl.replace(/\/+$/, '')
  if (normalizedUrl.endsWith('/v1/chat/completions')) {
    normalizedUrl = normalizedUrl.replace('/v1/chat/completions', '')
  }

  // 2. 验证 API Key
  if (!apiKey) {
    return {
      success: false,
      message: 'API Key 未填写',
      details: '请在设置中填写 DeepSeek API Key'
    }
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      success: false,
      message: 'API Key 格式可能不正确',
      details: 'DeepSeek API Key 通常以 sk- 开头，请检查是否正确'
    }
  }

  // 3. 验证 Model ID
  if (!modelId) {
    return {
      success: false,
      message: '模型 ID 未填写',
      details: '请在设置中填写模型 ID，例如：deepseek-chat 或 deepseek-v4-flash'
    }
  }

  // 4. 测试 API 连接
  try {
    const apiUrl = `${normalizedUrl}/v1/chat/completions`
    console.log('[诊断] 测试 URL:', apiUrl)

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: `API 返回错误: ${response.status}`,
        details: errorData.error?.message || response.statusText
      }
    }

    return {
      success: true,
      message: 'DeepSeek API 配置正确！',
      details: `成功连接到 ${normalizedUrl}，模型 ${modelId} 可用`
    }
  } catch (error) {
    return {
      success: false,
      message: '无法连接到 API',
      details: error instanceof Error ? error.message : '网络错误，请检查 URL 是否正确'
    }
  }
}

export async function diagnoseMimoConfig(
  baseUrl: string,
  apiKey: string,
  modelId: string
): Promise<DiagnosticResult> {
  // 1. 验证 URL 格式
  if (!baseUrl) {
    return {
      success: false,
      message: 'Base URL 未填写',
      details: '请在设置中填写 Mimo API 的完整端点 URL，例如：https://api.xiaomimimo.com/v1/chat/completions'
    }
  }

  // 2. 验证 API Key
  if (!apiKey) {
    return {
      success: false,
      message: 'API Key 未填写',
      details: '请在设置中填写 Mimo API Key'
    }
  }

  // 3. 验证 Model ID
  if (!modelId) {
    return {
      success: false,
      message: '模型 ID 未填写',
      details: '请在设置中填写模型 ID，例如：mimo-v2.5'
    }
  }

  // 4. 测试 API 连接（发送一个简单的文本请求）
  try {
    console.log('[诊断] 测试 Mimo URL:', baseUrl)

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 10
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return {
        success: false,
        message: `API 返回错误: ${response.status}`,
        details: errorData.error?.message || response.statusText
      }
    }

    return {
      success: true,
      message: 'Mimo API 配置正确！',
      details: `成功连接到 ${baseUrl}，模型 ${modelId} 可用`
    }
  } catch (error) {
    return {
      success: false,
      message: '无法连接到 API',
      details: error instanceof Error ? error.message : '网络错误，请检查 URL 是否正确'
    }
  }
}

/**
 * 获取配置示例和说明
 */
export function getConfigExamples() {
  return {
    deepseek: {
      baseUrl: 'https://api.deepseek.com',
      apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
      modelId: 'deepseek-chat',
      description: '对话模型只需填写基础 URL，代码会自动添加 /v1/chat/completions'
    },
    mimo: {
      baseUrl: 'https://api.xiaomimimo.com/v1/chat/completions',
      apiKey: 'sk-xxxxxxxxxxxxxxxxxxxxxxxx',
      modelId: 'mimo-v2.5',
      description: '视觉模型需要填写完整的 API 端点 URL'
    }
  }
}