import { describe, it, expect } from 'vitest';
import { encodeApiKey, decodeApiKey, maskApiKey } from '../crypto.js';

describe('crypto utilities', () => {
  it('encodeApiKey produces encrypted string', () => {
    const encoded = encodeApiKey('sk-test-key-12345');
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');
  });

  it('decodeApiKey reverses encodeApiKey', () => {
    const key = 'sk-test-key-12345';
    const encoded = encodeApiKey(key);
    expect(decodeApiKey(encoded)).toBe(key);
  });

  it('GCM 格式：密文包含 iv:tag:ciphertext 三段', () => {
    const encoded = encodeApiKey('sk-key');
    const parts = encoded.split(':');
    expect(parts.length).toBe(3);
    // iv 12 字节 = 24 hex；tag 16 字节 = 32 hex
    expect(parts[0].length).toBe(24);
    expect(parts[1].length).toBe(32);
  });

  it('每次加密的 IV 不同（同一明文两次密文不同）', () => {
    const a = encodeApiKey('same-key');
    const b = encodeApiKey('same-key');
    expect(a).not.toBe(b);
    expect(decodeApiKey(a)).toBe('same-key');
    expect(decodeApiKey(b)).toBe('same-key');
  });

  it('篡改 GCM 认证标签后解密应失败（抗密文篡改）', () => {
    const encoded = encodeApiKey('sk-secret');
    const [iv, tag, cipher] = encoded.split(':');
    // 翻转 tag 一个比特
    const tamperedTag = tag.slice(0, -1) + (tag.slice(-1) === '0' ? '1' : '0');
    expect(() => decodeApiKey([iv, tamperedTag, cipher].join(':'))).toThrow();
  });

  it('空字符串直通', () => {
    expect(encodeApiKey('')).toBe('');
    expect(decodeApiKey('')).toBe('');
  });

  it('maskApiKey shows first 8 chars and ***', () => {
    expect(maskApiKey('sk-1234567890abcdef')).toBe('sk-12345***');
  });

  it('maskApiKey handles short keys', () => {
    expect(maskApiKey('abc')).toBe('abc***');
  });
});
