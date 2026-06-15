import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../../utils/db.js';
import { createProvider } from '../provider.service.js';
import { getServerModels, createServerModel, updateServerModel, getEnabledServerModels } from '../server-model.service.js';

describe('server-model.service', () => {
  let providerId: string;

  beforeEach(async () => {
    await prisma.serverModel.deleteMany();
    await prisma.provider.deleteMany();
    const p = await createProvider({ name: 'Test', baseUrl: 'https://api.test.com', apiKey: 'sk-test', format: 'openai' });
    providerId = p.id;
  });

  afterAll(async () => {
    await prisma.serverModel.deleteMany();
    await prisma.provider.deleteMany();
    await prisma.$disconnect();
  });

  it('createServerModel creates a model', async () => {
    const model = await createServerModel({ providerId, modelId: 'gpt-4o', name: 'GPT-4o', type: 'vision' });
    expect(model.modelId).toBe('gpt-4o');
    expect(model.type).toBe('vision');
  });

  it('getServerModels returns models with provider info', async () => {
    await createServerModel({ providerId, modelId: 'gpt-4o', name: 'GPT-4o', type: 'vision' });
    const models = await getServerModels();
    expect(models.length).toBe(1);
    expect(models[0].provider.name).toBe('Test');
  });

  it('getEnabledServerModels filters by enabled', async () => {
    await createServerModel({ providerId, modelId: 'gpt-4o', name: 'GPT-4o', type: 'vision' });
    const m2 = await createServerModel({ providerId, modelId: 'gpt-3.5', name: 'GPT-3.5', type: 'chat' });
    await updateServerModel(m2.id, { enabled: false });
    const enabled = await getEnabledServerModels();
    expect(enabled.length).toBe(1);
    expect(enabled[0].modelId).toBe('gpt-4o');
  });

  it('updateServerModel updates fields', async () => {
    const m = await createServerModel({ providerId, modelId: 'gpt-4o', name: 'GPT-4o', type: 'vision' });
    const updated = await updateServerModel(m.id, { type: 'chat' });
    expect(updated.type).toBe('chat');
  });
});