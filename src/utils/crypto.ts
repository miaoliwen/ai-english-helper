/**
 * 本地配置加密工具。
 *
 * 安全说明：浏览器端无法真正保护 API Key 免受本机脚本/扩展读取。
 * 这里的目标是避免 localStorage 明文存储，并兼容旧版本已保存的数据。
 *
 * 密钥派生策略：
 * - 新用户：密钥从随机生成的「设备密钥」派生，设备密钥存储在 sessionStorage
 *   （关闭标签页即失效，XSS 无法持久获取）
 * - 旧用户：兼容硬编码常量派生的旧密钥，自动迁移到新方案
 */

const LEGACY_SALT = 'AIEH-2024-SALT'
const LEGACY_PEPPER = 'ai-english-helper-secure'
const ENCRYPTION_PREFIX = 'enc:v1:'
const DEVICE_KEY_STORAGE = 'aieh-device-key'
const PBKDF2_ITERATIONS = 150000

/** 从密码 + 盐值派生 AES-256-GCM 密钥 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  )

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/** 获取或创建设备密钥（存储在 sessionStorage，标签页关闭即清除） */
function getOrCreateDeviceKey(): string {
  let key = sessionStorage.getItem(DEVICE_KEY_STORAGE)
  if (!key) {
    const arr = new Uint8Array(32)
    crypto.getRandomValues(arr)
    key = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('')
    sessionStorage.setItem(DEVICE_KEY_STORAGE, key)
  }
  return key
}

/** 获取新方案密钥（从设备密钥 + 随机盐派生） */
// 密钥缓存：避免重复派生
let cachedNewKey: Promise<CryptoKey> | null = null
let cachedLegacyKey: Promise<CryptoKey> | null = null

function getNewKey(): Promise<CryptoKey> {
  if (!cachedNewKey) {
    const deviceKey = getOrCreateDeviceKey()
    const salt = new TextEncoder().encode('aieh-v2-salt-' + deviceKey.slice(0, 8))
    cachedNewKey = deriveKey(deviceKey, salt)
  }
  return cachedNewKey
}

/** 获取旧方案密钥（兼容已保存的旧数据） */
function getLegacyKey(): Promise<CryptoKey> {
  if (!cachedLegacyKey) {
    cachedLegacyKey = deriveKey(LEGACY_PEPPER, new TextEncoder().encode(LEGACY_SALT))
  }
  return cachedLegacyKey
}

function isBase64(value: string): boolean {
  return /^[A-Za-z0-9+/]+=*$/.test(value)
}

async function decryptPayload(payload: string, useLegacy: boolean): Promise<string> {
  const key = useLegacy ? await getLegacyKey() : await getNewKey()
  const decoder = new TextDecoder()
  const combined = Uint8Array.from(atob(payload), c => c.charCodeAt(0))
  const iv = combined.slice(0, 12)
  const encrypted = combined.slice(12)
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted)
  return decoder.decode(decrypted)
}

export async function encryptData(data: string): Promise<string> {
  const key = await getNewKey()
  const encoder = new TextEncoder()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoder.encode(data)
  )

  const encryptedArray = new Uint8Array(encrypted)
  const combined = new Uint8Array(iv.length + encryptedArray.length)
  combined.set(iv)
  combined.set(encryptedArray, iv.length)

  return `${ENCRYPTION_PREFIX}${btoa(String.fromCharCode(...combined))}`
}

export async function decryptData(encryptedData: string): Promise<string> {
  if (!encryptedData) return ''

  if (encryptedData.startsWith(ENCRYPTION_PREFIX)) {
    // 优先尝试新密钥，失败则回退旧密钥（自动迁移）
    try {
      return await decryptPayload(encryptedData.slice(ENCRYPTION_PREFIX.length), false)
    } catch {
      return await decryptPayload(encryptedData.slice(ENCRYPTION_PREFIX.length), true)
    }
  }

  // 兼容旧版本：旧数据是无前缀 base64；更旧的数据可能是明文。
  if (isBase64(encryptedData)) {
    try {
      return await decryptPayload(encryptedData, false)
    } catch {
      try {
        return await decryptPayload(encryptedData, true)
      } catch {
        return encryptedData
      }
    }
  }

  return encryptedData
}

export async function encryptConfig(config: Record<string, string>): Promise<Record<string, string>> {
  const encrypted: Record<string, string> = {}
  for (const [key, value] of Object.entries(config)) {
    encrypted[key] = value ? await encryptData(value) : value
  }
  return encrypted
}

export async function decryptConfig(config: Record<string, string>): Promise<Record<string, string>> {
  const decrypted: Record<string, string> = {}
  for (const [key, value] of Object.entries(config)) {
    decrypted[key] = value ? await decryptData(value) : value
  }
  return decrypted
}
