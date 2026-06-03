/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MIMO_API_KEY: string
  readonly VITE_MIMO_API_URL: string
  readonly VITE_MIMO_MODEL_ID: string
  readonly VITE_DEEPSEEK_API_KEY: string
  readonly VITE_DEEPSEEK_API_URL: string
  readonly VITE_DEEPSEEK_MODEL_ID: string
  readonly VITE_PROXY_API_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}