import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as syncService from '../services/sync.service.js';
import { NotFoundError } from '../services/sync.service.js';
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

/**
 * 包装 handler：把 service 抛出的 NotFoundError 统一转成 404。
 * （插件级 setErrorHandler 在某些 hook 抛错路径下不可靠，故在 route 层显式捕获）
 */
function wrap<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (e: any) {
      const reply = args[1] as FastifyReply;
      if (e instanceof NotFoundError) {
        return reply.status(404).send({ error: 'Resource not found' });
      }
      throw e;
    }
  }) as T;
}

export default async function syncRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  app.get('/api/sync/sessions', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.getSessions(userId);
  });

  app.get('/api/sync/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    const session = await syncService.getSession(userId, id);
    if (!session) return reply.status(404).send({ error: 'Resource not found' });
    return session;
  });

  app.post('/api/sync/sessions', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.upsertSession(userId, request.body as any);
  });

  app.put('/api/sync/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    try {
      return await syncService.upsertSession(userId, { id, ...(request.body as any) });
    } catch (e) {
      if (e instanceof NotFoundError) return reply.status(404).send({ error: 'Resource not found' });
      throw e;
    }
  });

  app.delete('/api/sync/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    try {
      await syncService.deleteSession(userId, id);
      return reply.status(204).send();
    } catch (e) {
      if (e instanceof NotFoundError) return reply.status(404).send({ error: 'Resource not found' });
      throw e;
    }
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
    try {
      await syncService.deleteFavorite(userId, id);
      return reply.status(204).send();
    } catch (e) {
      if (e instanceof NotFoundError) return reply.status(404).send({ error: 'Resource not found' });
      throw e;
    }
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
    try {
      await syncService.deleteOCRResult(userId, id);
      return reply.status(204).send();
    } catch (e) {
      if (e instanceof NotFoundError) return reply.status(404).send({ error: 'Resource not found' });
      throw e;
    }
  });
}
