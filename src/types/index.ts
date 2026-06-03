export interface OCRResult {
  id: string
  text: string
  markdown: string
  imageBase64: string
  createdAt: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
}

export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  ocrResultId?: string
  createdAt: number
  updatedAt: number
}

export interface FavoriteItem {
  id: string
  title: string
  type: 'ocr' | 'chat'
  content: string
  ocrResultId?: string
  chatSessionId?: string
  tags: string[]
  createdAt: number
}

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ModelSettings {
  chatModel: string
  chatBaseUrl: string
  chatApiKey: string
  visionModel: string
  visionBaseUrl: string
  visionApiKey: string
}

export interface AppState {
  currentOCR: OCRResult | null
  currentChat: ChatSession | null
  isProcessing: boolean
  streamContent: string
}