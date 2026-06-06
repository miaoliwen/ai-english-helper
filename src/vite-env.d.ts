/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_DEFAULT_CHAT_BASE_URL?: string
  readonly VITE_DEFAULT_VISION_BASE_URL?: string
  readonly VITE_DEFAULT_CHAT_MODEL?: string
  readonly VITE_DEFAULT_VISION_MODEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
