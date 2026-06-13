import { FastifyInstance } from 'fastify';
import { getEnabledServerModels } from '../services/server-model.service.js';
import { authenticate } from '../utils/auth.js';

export default async function modelsRoutes(app: FastifyInstance) {
  app.get('/api/models/server', { preHandler: [authenticate] }, async () => {
    const models = await getEnabledServerModels();
    return {
      models: models.map(m => ({
        id: m.id, modelId: m.modelId, name: m.name, type: m.type, providerName: m.provider.name,
      })),
    };
  });
}
