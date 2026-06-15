const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

class ApiClient {
  private accessToken: string | null = null
  private refreshToken: string | null = null
  private refreshPromise: Promise<void> | null = null

  setTokens(access: string, refresh: string) {
    this.accessToken = access
    this.refreshToken = refresh
    localStorage.setItem('refreshToken', refresh)
  }

  clearTokens() {
    this.accessToken = null
    this.refreshToken = null
    localStorage.removeItem('refreshToken')
  }

  loadStoredRefreshToken() {
    this.refreshToken = localStorage.getItem('refreshToken')
  }

  get isLoggedIn() {
    return !!this.refreshToken
  }

  private get authHeader(): Record<string, string> {
    return this.accessToken ? { 'Authorization': `Bearer ${this.accessToken}` } : {}
  }

  private async request(path: string, options: RequestInit = {}): Promise<any> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.authHeader,
      ...(options.headers as Record<string, string>),
    }

    let response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

    if (response.status === 401 && this.refreshToken && !path.includes('/auth/refresh')) {
      if (!this.refreshPromise) {
        this.refreshPromise = this.doRefresh()
      }
      await this.refreshPromise
      this.refreshPromise = null
      headers['Authorization'] = `Bearer ${this.accessToken}`
      response = await fetch(`${BASE_URL}${path}`, { ...options, headers })
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || 'Request failed')
    }

    if (response.status === 204) return null
    return response.json()
  }

  private async doRefresh() {
    if (!this.refreshToken) throw new Error('No refresh token')
    const response = await fetch(`${BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: this.refreshToken }),
    })
    if (!response.ok) {
      this.clearTokens()
      throw new Error('Session expired')
    }
    const data = await response.json()
    this.accessToken = data.accessToken
    this.refreshToken = data.refreshToken
    localStorage.setItem('refreshToken', data.refreshToken)
  }

  // Auth
  async register(email: string, password: string, nickname?: string) {
    const data = await this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, nickname }),
    })
    this.setTokens(data.accessToken, data.refreshToken)
    return data.user
  }

  async login(email: string, password: string) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    this.setTokens(data.accessToken, data.refreshToken)
    return data.user
  }

  logout() { this.clearTokens() }

  async getMe() { return this.request('/api/auth/me') }

  /** 通用 GET，供其它 store 复用鉴权头与刷新逻辑 */
  async get(path: string) { return this.request(path) }

  // Sync
  async getSessions() { return this.request('/api/sync/sessions') }
  async getSession(id: string) { return this.request(`/api/sync/sessions/${id}`) }
  async saveSession(data: any) { return this.request('/api/sync/sessions', { method: 'POST', body: JSON.stringify(data) }) }
  async updateSession(id: string, data: any) { return this.request(`/api/sync/sessions/${id}`, { method: 'PUT', body: JSON.stringify(data) }) }
  async deleteSession(id: string) { return this.request(`/api/sync/sessions/${id}`, { method: 'DELETE' }) }
  async getFavorites() { return this.request('/api/sync/favorites') }
  async addFavorite(data: any) { return this.request('/api/sync/favorites', { method: 'POST', body: JSON.stringify(data) }) }
  async deleteFavorite(id: string) { return this.request(`/api/sync/favorites/${id}`, { method: 'DELETE' }) }
  async getOCRResults() { return this.request('/api/sync/ocr-results') }
  async addOCRResult(data: any) { return this.request('/api/sync/ocr-results', { method: 'POST', body: JSON.stringify(data) }) }
  async deleteOCRResult(id: string) { return this.request(`/api/sync/ocr-results/${id}`, { method: 'DELETE' }) }

  // Proxy - non-streaming (vision OCR)
  async proxyVision(body: any) {
    return this.request('/api/proxy/vision', { method: 'POST', body: JSON.stringify(body) })
  }

  // Proxy - streaming (chat)
  async proxyChatStream(body: any, signal?: AbortSignal): Promise<Response> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...this.authHeader }

    const response = await fetch(`${BASE_URL}/api/proxy/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal,
    })

    if (response.status === 401 && this.refreshToken) {
      if (!this.refreshPromise) this.refreshPromise = this.doRefresh()
      await this.refreshPromise
      this.refreshPromise = null
      headers['Authorization'] = `Bearer ${this.accessToken}`
      const retry = await fetch(`${BASE_URL}/api/proxy/chat`, {
        method: 'POST', headers, body: JSON.stringify(body), signal,
      })
      if (!retry.ok) throw new Error('Session expired')
      return retry
    }

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }))
      throw new Error(err.error || 'Proxy request failed')
    }

    return response
  }
}

export const api = new ApiClient()
