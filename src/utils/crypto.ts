// src/utils/crypto.ts

const ENCODED_KEY_PREFIX = 'enc:'

// 简单混淆（基础保护）
export function encodeApiKey(key: string): string {
  if (!key) return ''
  return ENCODED_KEY_PREFIX + btoa(unescape(encodeURIComponent(key)))
}

export function decodeApiKey(encoded: string): string {
  if (!encoded || !encoded.startsWith(ENCODED_KEY_PREFIX)) return encoded
  const base64 = encoded.slice(ENCODED_KEY_PREFIX.length)
  return decodeURIComponent(escape(atob(base64)))
}

// 检查是否已编码
export function isEncoded(key: string): boolean {
  return key.startsWith(ENCODED_KEY_PREFIX)
}