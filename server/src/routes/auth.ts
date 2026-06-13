import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as authService from '../services/auth.service.js';
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

export default async function authRoutes(app: FastifyInstance) {
  app.post('/api/auth/register', {
    config: { rateLimit: { max: 5, timeWindow: '1 hour' } },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password, nickname } = request.body as any;
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password required' });
    }
    if (password.length < 6) {
      return reply.status(400).send({ error: 'Password must be at least 6 characters' });
    }
    try {
      return await authService.register(email, password, nickname);
    } catch (e: any) {
      if (e.message === 'EMAIL_EXISTS') {
        return reply.status(409).send({ error: 'Email already registered' });
      }
      throw e;
    }
  });

  app.post('/api/auth/login', {
    config: { rateLimit: { max: 10, timeWindow: '1 minute' } },
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { email, password } = request.body as any;
    if (!email || !password) {
      return reply.status(400).send({ error: 'Email and password required' });
    }
    try {
      return await authService.login(email, password);
    } catch (e: any) {
      if (e.message === 'INVALID_CREDENTIALS') {
        return reply.status(401).send({ error: 'Invalid email or password' });
      }
      throw e;
    }
  });

  app.post('/api/auth/refresh', async (request: FastifyRequest, reply: FastifyReply) => {
    const { refreshToken } = request.body as any;
    if (!refreshToken) {
      return reply.status(400).send({ error: 'Refresh token required' });
    }
    try {
      return await authService.refresh(refreshToken);
    } catch {
      return reply.status(401).send({ error: 'Invalid refresh token' });
    }
  });

  app.get('/api/auth/me', { preHandler: [authenticate] }, async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return authService.getUser(userId);
  });

  app.put('/api/auth/me', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { nickname, password } = request.body as any;
    return authService.updateUser(userId, { nickname, password });
  });
}
