import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../utils/auth.js';
import { findServerModelByModelId } from '../services/server-model.service.js';
import { getProviderWithKey } from '../services/provider.service.js';
import { ProviderCache } from '../utils/cache.js';

const providerCache = new ProviderCache();

async function getProviderForModel(modelId: string) {
  const cached = providerCache.get(modelId);
  if (cached) return cached;
  const serverModel = await findServerModelByModelId(modelId);
  if (!serverModel) return null;
  if (!serverModel.enabled || !serverModel.provider.enabled) return null;
  const provider = await getProviderWithKey(serverModel.providerId);
  if (!provider) return null;
  providerCache.set(modelId, provider);
  return provider;
}

export default async function proxyRoutes(app: FastifyInstance) {
  app.post('/api/proxy/chat', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const modelId = body.model;
    if (!modelId) return reply.status(400).send({ error: 'model field required' });
    const provider = await getProviderForModel(modelId);
    if (!provider) return reply.status(404).send({ error: `Model '${modelId}' not found or disabled` });
    const isStream = body.stream !== false;
    try {
      const response = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
        body: JSON.stringify({ model: modelId, messages: body.messages, stream: isStream, temperature: body.temperature ?? 0.7, max_tokens: body.max_tokens ?? 4096 }),
      });
      if (!response.ok) { const errText = await response.text(); return reply.status(response.status).send({ error: `AI API error: ${errText}` }); }
      if (isStream) {
        reply.raw.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) { const { done, value } = await reader.read(); if (done) break; reply.raw.write(decoder.decode(value)); }
        reply.raw.end();
      } else { return await response.json(); }
    } catch (e: any) { return reply.status(502).send({ error: e.message || 'Proxy error' }); }
  });

  app.post('/api/proxy/vision', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const modelId = body.model || 'gpt-4o';
    const provider = await getProviderForModel(modelId);
    if (!provider) return reply.status(404).send({ error: `Model '${modelId}' not found or disabled` });
    try {
      const response = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return reply.status(response.status).send(data);
    } catch (e: any) { return reply.status(502).send({ error: e.message || 'Proxy error' }); }
  });
}
