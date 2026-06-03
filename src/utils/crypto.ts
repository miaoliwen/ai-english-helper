/**
 * 配置加密工具
 * 用于加密存储敏感的 API 配置信息
 */

// 应用盐值（用于密钥派生）
const APP_SALT = 'AIEH-2024-SALT'
const APP_PEPPER = 'ai-english-helper-secure'

/**
 * 从字符串派生加密密钥
 */
async function deriveKey(password: string): Promise<CryptoKey> {
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
      salt: encoder.encode(APP_SALT),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

/**
 * 加密数据
 */
export async function encryptData(data: string): Promise<string> {
  try {
    const key = await deriveKey(APP_PEPPER)
    const encoder = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))

    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    )

    // 将 IV 和加密数据合并并转为 base64
    const encryptedArray = new Uint8Array(encrypted)
    const combined = new Uint8Array(iv.length + encryptedArray.length)
    combined.set(iv)
    combined.set(encryptedArray, iv.length)

    return btoa(String.fromCharCode(...combined))
  } catch (error) {
    console.error('[Crypto] 加密失败:', error)
    // 降级处理：返回原始数据（不推荐，但保证功能可用）
    return data
  }
}

/**
 * 解密数据
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    // 检查是否是加密数据（base64 格式）
    if (!encryptedData || !encryptedData.match(/^[A-Za-z0-9+/]+=*$/)) {
      // 不是加密数据，直接返回（兼容旧格式）
      return encryptedData
    }

    const key = await deriveKey(APP_PEPPER)
    const decoder = new TextDecoder()

    // 从 base64 解码
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0))

    // 提取 IV 和加密数据
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    )

    return decoder.decode(decrypted)
  } catch (error) {
    console.error('[Crypto] 解密失败，可能是旧格式数据:', error)
    // 降级处理：返回原始数据（兼容未加密的旧数据）
    return encryptedData
  }
}

/**
 * 加密配置对象
 */
export async function encryptConfig(config: Record<string, string>): Promise<Record<string, string>> {
  const encrypted: Record<string, string> = {}

  for (const [key, value] of Object.entries(config)) {
    if (value) {
      encrypted[key] = await encryptData(value)
    } else {
      encrypted[key] = value
    }
  }

  return encrypted
}

/**
 * 解密配置对象
 */
export async function decryptConfig(config: Record<string, string>): Promise<Record<string, string>> {
  const decrypted: Record<string, string> = {}

  for (const [key, value] of Object.entries(config)) {
    if (value) {
      decrypted[key] = await decryptData(value)
    } else {
      decrypted[key] = value
    }
  }

  return decrypted
}
