import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../../utils/db.js';
import { createProvider, getProviders, updateProvider, deleteProvider } from '../provider.service.js';

describe('provider.service', () => {
  beforeEach(async () => {
    // 先删依赖 provider 的 ServerModel，避免外键约束残留 / 跨 spec 顺序依赖
    await prisma.serverModel.deleteMany();
    await prisma.provider.deleteMany();
  });

  afterAll(async () => {
    // 全套 spec 共享同一 SQLite，末尾也清表，避免污染后续 spec
    await prisma.serverModel.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.$disconnect();
  });

  it('createProvider creates a provider with encrypted apiKey', async () => {
    const provider = await createProvider({
      name: 'Test Provider',
      baseUrl: 'https://api.test.com',
      apiKey: 'sk-test-key-12345',
      format: 'openai',
    });
    expect(provider.id).toBeTruthy();
    expect(provider.name).toBe('Test Provider');
    expect(provider.apiKey).not.toBe('sk-test-key-12345');
  });

  it('getProviders returns all providers with models', async () => {
    await createProvider({
      name: 'P1',
      baseUrl: 'https://api.p1.com',
      apiKey: 'key1',
      format: 'openai',
    });
    const providers = await getProviders();
    expect(providers.length).toBe(1);
    expect(providers[0].models).toEqual([]);
  });

  it('updateProvider updates fields', async () => {
    const p = await createProvider({
      name: 'Old Name',
      baseUrl: 'https://api.old.com',
      apiKey: 'key',
      format: 'auto',
    });
    const updated = await updateProvider(p.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
  });

  it('deleteProvider removes provider', async () => {
    const p = await createProvider({
      name: 'To Delete',
      baseUrl: 'https://api.del.com',
      apiKey: 'key',
      format: 'auto',
    });
    await deleteProvider(p.id);
    const all = await getProviders();
    expect(all.length).toBe(0);
  });
});