// src/services/modelApi.ts

import type { ApiFormat, ModelListResponse } from '@/types/config'

// 检测API格式
export async function detectApiFormat(baseUrl: string): Promise<ApiFormat> {
  // 尝试OpenAI格式
  try {
    const response = await fetch(`${baseUrl}/v1/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) return 'openai'
  } catch {}

  // 尝试DeepSeek格式
  try {
    const response = await fetch(`${baseUrl}/api/models`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })
    if (response.ok) return 'deepseek'
  } catch {}

  // 默认返回auto
  return 'auto'
}

// 获取模型列表
export async function fetchModelList(
  baseUrl: string,
  apiKey: string,
  format: ApiFormat = 'auto'
): Promise<ModelListResponse> {
  let actualFormat = format

  if (format === 'auto') {
    actualFormat = await detectApiFormat(baseUrl)
  }

  let url: string
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`
  }

  switch (actualFormat) {
    case 'openai':
      url = `${baseUrl}/v1/models`
      break
    case 'deepseek':
      url = `${baseUrl}/api/models`
      break
    case 'zhipu':
      url = `${baseUrl}/api/models`
      break
    default:
      url = `${baseUrl}/v1/models`
  }

  const response = await fetch(url, { method: 'GET', headers })

  if (!response.ok) {
    throw new Error(`获取模型列表失败: ${response.statusText}`)
  }

  const data = await response.json()

  // 解析不同格式的响应
  let models: Array<{ id: string; name?: string }> = []

  if (data.data && Array.isArray(data.data)) {
    // OpenAI格式
    models = data.data.map((m: any) => ({
      id: m.id,
      name: m.name || m.id
    }))
  } else if (data.models && Array.isArray(data.models)) {
    // DeepSeek格式
    models = data.models.map((m: any) => ({
      id: m.id || m,
      name: m.name || m.id || m
    }))
  } else if (Array.isArray(data)) {
    // 简单数组格式
    models = data.map((m: any) => ({
      id: typeof m === 'string' ? m : m.id,
      name: typeof m === 'string' ? m : m.name || m.id
    }))
  }

  return { models }
}

// 测试连接
export async function testConnection(
  baseUrl: string,
  apiKey: string,
  format: ApiFormat = 'auto'
): Promise<{ success: boolean; message: string }> {
  try {
    // 尝试获取模型列表来测试连接
    await fetchModelList(baseUrl, apiKey, format)
    return { success: true, message: '连接成功' }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : '连接失败'
    }
  }
}