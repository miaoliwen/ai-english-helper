import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as syncService from '../services/sync.service.js';
import { verifyAccessToken } from '../utils/jwt.js';

async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  try {
    (request as any).user = verifyAccessToken(authHeader.substring(7));
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export default async function syncRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/api/sync/sessions', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.getSessions(userId);
  });

  app.get('/api/sync/sessions/:id', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    return syncService.getSession(userId, id);
  });

  app.post('/api/sync/sessions', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.upsertSession(userId, request.body as any);
  });

  app.put('/api/sync/sessions/:id', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    return syncService.upsertSession(userId, { id, ...(request.body as any) });
  });

  app.delete('/api/sync/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    await syncService.deleteSession(userId, id);
    return reply.status(204).send();
  });

  app.get('/api/sync/favorites', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.getFavorites(userId);
  });

  app.post('/api/sync/favorites', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.addFavorite(userId, request.body as any);
  });

  app.delete('/api/sync/favorites/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    await syncService.deleteFavorite(userId, id);
    return reply.status(204).send();
  });

  app.get('/api/sync/ocr-results', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.getOCRResults(userId);
  });

  app.post('/api/sync/ocr-results', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.createOCRResult(userId, request.body as any);
  });

  app.delete('/api/sync/ocr-results/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    await syncService.deleteOCRResult(userId, id);
    return reply.status(204).send();
  });
}
