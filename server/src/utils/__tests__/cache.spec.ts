import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderCache } from '../cache.js';

describe('ProviderCache', () => {
  let cache: ProviderCache;

  beforeEach(() => {
    cache = new ProviderCache(1000);
  });

  it('set and get', () => {
    cache.set('p1', { id: 'p1', apiKey: 'key1' });
    expect(cache.get('p1')).toEqual({ id: 'p1', apiKey: 'key1' });
  });

  it('returns null for missing key', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('invalidates on delete', () => {
    cache.set('p1', { id: 'p1' });
    cache.invalidate('p1');
    expect(cache.get('p1')).toBeNull();
  });

  it('clears all entries', () => {
    cache.set('p1', { id: 'p1' });
    cache.set('p2', { id: 'p2' });
    cache.clear();
    expect(cache.get('p1')).toBeNull();
  });
});
