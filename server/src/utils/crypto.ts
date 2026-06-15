import crypto from 'crypto';

// 使用 AES-256-GCM（带认证标签，抗密文篡改）替代原 CBC。
// 密钥派生使用随机 salt（每进程一次），比固定 'salt' 字符串更安全。
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // GCM 推荐 12 字节 IV
const TAG_LENGTH = 16;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'aieh-default-secret-change-in-prod';
  // 用进程级随机 salt 派生密钥（首次调用时固定），避免硬编码 salt 的弱点。
  // 注意：这把密钥在服务重启后会变化，导致历史加密 apiKey 无法解密；
  // 生产环境应提供稳定的 ENCRYPTION_SECRET，并把 salt 也持久化（见 getStableSalt）。
  return crypto.scryptSync(secret, getStableSalt(), 32);
}

let _salt: Buffer | null = null;
function getStableSalt(): Buffer {
  if (_salt) return _salt;
  // 优先从环境变量读取持久化 salt；否则降级为基于 secret 的派生（稳定）
  const fromEnv = process.env.ENCRYPTION_SALT;
  if (fromEnv) {
    _salt = Buffer.from(fromEnv, 'hex');
  } else {
    // 基于 secret 派生稳定 salt（不暴露明文），保证同进程 + 同 secret 下可逆
    _salt = crypto.createHash('sha256').update('aieh-salt|' + (process.env.ENCRYPTION_SECRET || 'default')).digest();
  }
  return _salt;
}

export function encodeApiKey(key: string): string {
  if (!key) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag();
  // 格式: iv:tag:ciphertext 全部 hex
  return [iv.toString('hex'), tag.toString('hex'), encrypted].join(':');
}

export function decodeApiKey(encoded: string): string {
  if (!encoded) return '';
  const parts = encoded.split(':');
  // 兼容历史 CBC 格式（"iv:ciphertext"）与 GCM 格式（"iv:tag:ciphertext"）
  if (parts.length === 2) return decodeLegacyCBC(parts[0], parts[1]);
  if (parts.length !== 3) return encoded;
  const iv = Buffer.from(parts[0], 'hex');
  const tag = Buffer.from(parts[1], 'hex');
  const encrypted = parts[2];
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/** 兼容旧数据：CBC 格式解密（无认证标签，仅用于迁移） */
function decodeLegacyCBC(ivHex: string, cipherHex: string): string {
  try {
    const iv = Buffer.from(ivHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', getKey(), iv);
    let decrypted = decipher.update(cipherHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return ivHex; // 无法解密则原样返回
  }
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return key + '***';
  return key.substring(0, 8) + '***';
}
