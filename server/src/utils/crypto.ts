import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.ENCRYPTION_SECRET || 'aieh-default-secret-change-in-prod',
  'salt',
  32
);
const IV_LENGTH = 16;

export function encodeApiKey(key: string): string {
  if (!key) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decodeApiKey(encoded: string): string {
  if (!encoded) return '';
  const parts = encoded.split(':');
  if (parts.length !== 2) return encoded;
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return key + '***';
  return key.substring(0, 8) + '***';
}
