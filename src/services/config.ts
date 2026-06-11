export interface ApiModelSettings {
  baseUrl?: string
  apiKey?: string
  modelId?: string
}

export interface ResolvedModelConfig {
  endpoint: string
  apiKey: string
  modelId: string
}

const CHAT_COMPLETIONS_PATH = '/v1/chat/completions'

/** API 调用并发限制器 */
const MAX_CONCURRENT_REQUESTS = 3
let activeRequests = 0
const pendingQueue: Array<() => void> = []

function acquireSlot(): Promise<void> {
  if (activeRequests < MAX_CONCURRENT_REQUESTS) {
    activeRequests++
    return Promise.resolve()
  }
  return new Promise((resolve) => {
    pendingQueue.push(resolve)
  })
}

function releaseSlot() {
  activeRequests--
  const next = pendingQueue.shift()
  if (next) {
    activeRequests++
    next()
  }
}

/** 防抖包装器 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delayMs: number
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pendingResolve: ((value: any) => void) | null = null
  let pendingReject: ((reason?: any) => void) | null = null
  let latestArgs: Parameters<T> | null = null

  return function (this: any, ...args: Parameters<T>): Promise<ReturnType<T>> {
    latestArgs = args
    if (timer) clearTimeout(timer)

    return new Promise((resolve, reject) => {
      pendingResolve = resolve
      pendingReject = reject
      timer = setTimeout(async () => {
        try {
          const result = await fn.apply(this, latestArgs!)
          pendingResolve?.(result)
        } catch (err) {
          pendingReject?.(err)
        } finally {
          timer = null
          pendingResolve = null
          pendingReject = null
        }
      }, delayMs)
    })
  }
}

/** 带并发限制的 fetch 包装 */
export async function limitedFetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  await acquireSlot()
  try {
    return await fetch(input, init)
  } finally {
    releaseSlot()
  }
}

/** 单次请求消息列表总长度限制（字符数） */
const MAX_MESSAGES_TOTAL_LENGTH = 100_000

export function validateMessagesLength(messages: Array<{ content: string }>): void {
  const totalLength = messages.reduce((sum, m) => sum + m.content.length, 0)
  if (totalLength > MAX_MESSAGES_TOTAL_LENGTH) {
    throw new Error(`消息总长度（${totalLength} 字符）超出限制，请缩短对话历史后重试`)
  }
}

export function normalizeBaseUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim()
  if (!trimmed) return ''

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    throw new Error('Base URL 格式不正确，请填写完整的 http(s) 地址')
  }

  if (url.protocol !== 'https:') {
    if (url.protocol === 'http:') {
      throw new Error('不安全的 HTTP 连接：API Key 将以明文传输，请使用 HTTPS 地址')
    }
    throw new Error('Base URL 仅支持 https 协议')
  }

  url.hash = ''
  url.search = ''
  return url.toString().replace(/\/+$/, '')
}

export function buildChatCompletionsEndpoint(rawUrl: string): string {
  const normalized = normalizeBaseUrl(rawUrl)
  if (!normalized) return ''

  if (normalized.endsWith(CHAT_COMPLETIONS_PATH)) {
    return normalized
  }

  if (normalized.endsWith('/v1')) {
    return `${normalized}/chat/completions`
  }

  return `${normalized}${CHAT_COMPLETIONS_PATH}`
}

export function resolveModelConfig(
  settings: ApiModelSettings | undefined,
  label: string
): ResolvedModelConfig {
  const baseUrl = settings?.baseUrl?.trim()
  const apiKey = settings?.apiKey?.trim()
  const modelId = settings?.modelId?.trim()

  if (!baseUrl) throw new Error(`${label} Base URL 未配置，请先在设置中填写 API 地址`)
  if (!apiKey) throw new Error(`${label} API Key 未配置，请先在设置中填写密钥`)
  if (!modelId) throw new Error(`${label} 模型 ID 未配置，请先在设置中填写模型名称`)

  return {
    endpoint: buildChatCompletionsEndpoint(baseUrl),
    apiKey,
    modelId
  }
}

export async function readApiError(response: Response, providerName: string): Promise<string> {
  const statusHint = getStatusHint(response.status)
  return `${providerName} API 请求失败（${response.status}）${statusHint}`.trim()
}

/** 根据 HTTP 状态码返回用户友好的提示 */
function getStatusHint(status: number): string {
  switch (true) {
    case status === 401: return '：API Key 无效或已过期'
    case status === 403: return '：无权访问该资源'
    case status === 404: return '：接口地址或模型不存在'
    case status === 429: return '：请求过于频繁，请稍后重试'
    case status >= 500: return '：服务端错误，请稍后重试'
    default: return ''
  }
}

