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

  it('maskApiKey shows first 8 chars and ***', () => {
    expect(maskApiKey('sk-1234567890abcdef')).toBe('sk-12345***');
  });

  it('maskApiKey handles short keys', () => {
    expect(maskApiKey('abc')).toBe('abc***');
  });
});
