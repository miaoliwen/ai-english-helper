/**
 * 加密学安全的 UUID v4 实现（基于 Web Crypto）。
 * 旧版本使用 Math.random()，在集群 ID 命名空间里虽然碰撞概率极低，
 * 但放在名为 v4 的函数里容易让后来人误用。改为标准 v4 格式 + 加密随机。
 */
export function v4(): string {
  // 16 字节随机 → 32 个十六进制字符
  const bytes = new Uint8Array(16)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    // 极少见 fallback：test runner / SSR。仍然走 best-effort 随机。
    for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  // 设置 v4 (0100) 与 variant (10xx) 位
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80

  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
  return (
    hex.slice(0, 8) + '-' +
    hex.slice(8, 12) + '-' +
    hex.slice(12, 16) + '-' +
    hex.slice(16, 20) + '-' +
    hex.slice(20, 32)
  )
}

/** 短 ID：用于收藏 / 历史记录等本地展示场景，碰撞概率极低。 */
export function generateId(): string {
  const bytes = new Uint8Array(8)
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes)
  } else {
    for (let i = 0; i < 8; i++) bytes[i] = Math.floor(Math.random() * 256)
  }
  return Date.now().toString(36) + '-' + Array.from(bytes, b => b.toString(36).padStart(2, '0')).join('')
}