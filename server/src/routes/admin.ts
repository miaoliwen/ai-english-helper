import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createProvider, getProviders, updateProvider, deleteProvider, getProviderWithKey, toSafeProvider } from '../services/provider.service.js';
import { getServerModels, createServerModel, updateServerModel, deleteServerModel } from '../services/server-model.service.js';
import { authenticate } from '../utils/auth.js';
import { detectApiFormat, fetchModelList } from '../utils/model-api.js';
import { ProviderCache } from '../utils/cache.js';

const providerCache = new ProviderCache();

export default async function adminRoutes(app: FastifyInstance) {
  app.get('/api/admin/providers', { preHandler: [authenticate] }, async () => {
    const providers = await getProviders();
    return { providers: providers.map(toSafeProvider) };
  });

  app.post('/api/admin/providers', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, baseUrl, apiKey, format } = request.body as any;
    if (!name || !baseUrl || !apiKey) return reply.status(400).send({ error: 'name, baseUrl, apiKey required' });
    const provider = await createProvider({ name, baseUrl, apiKey, format });
    return toSafeProvider(provider);
  });

  app.put('/api/admin/providers/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { name, baseUrl, apiKey, format, enabled } = request.body as any;
    try {
      const updated = await updateProvider(id, { name, baseUrl, apiKey, format, enabled });
      providerCache.clear();
      return toSafeProvider(updated);
    } catch { return reply.status(404).send({ error: 'Provider not found' }); }
  });

  app.delete('/api/admin/providers/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    try { await deleteProvider(id); providerCache.clear(); return { success: true }; }
    catch { return reply.status(404).send({ error: 'Provider not found' }); }
  });

  app.post('/api/admin/providers/:id/test', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const provider = await getProviderWithKey(id);
    if (!provider) return reply.status(404).send({ error: 'Provider not found' });
    try {
      const format = provider.format === 'auto' ? await detectApiFormat(provider.baseUrl) : provider.format;
      const result = await fetchModelList(provider.baseUrl, provider.apiKey, format);
      return { success: true, message: '连接成功', models: result.models.map(m => m.id) };
    } catch (e: any) { return { success: false, message: e.message || '连接失败' }; }
  });

  app.get('/api/admin/providers/:id/models', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const provider = await getProviderWithKey(id);
    if (!provider) return reply.status(404).send({ error: 'Provider not found' });
    try {
      const format = provider.format === 'auto' ? await detectApiFormat(provider.baseUrl) : provider.format;
      return await fetchModelList(provider.baseUrl, provider.apiKey, format);
    } catch (e: any) { return reply.status(502).send({ error: e.message }); }
  });

  app.post('/api/admin/models', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { providerId, modelId, name, type } = request.body as any;
    if (!providerId || !modelId || !name || !type) return reply.status(400).send({ error: 'providerId, modelId, name, type required' });
    try { return await createServerModel({ providerId, modelId, name, type }); }
    catch (e: any) { return reply.status(400).send({ error: e.message }); }
  });

  app.put('/api/admin/models/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { name, type, enabled } = request.body as any;
    try { return await updateServerModel(id, { name, type, enabled }); }
    catch { return reply.status(404).send({ error: 'Model not found' }); }
  });

  app.delete('/api/admin/models/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    try { await deleteServerModel(id); return { success: true }; }
    catch { return reply.status(404).send({ error: 'Model not found' }); }
  });
}
