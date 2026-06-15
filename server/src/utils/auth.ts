import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken, TokenPayload } from './jwt.js';
import prisma from './db.js';

/** 校验 Bearer token，注入 request.user = { userId, email, role } */
export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  try {
    const payload = verifyAccessToken(authHeader.substring(7));
    // 拉取最新角色（避免 token 内角色过期/被提升后仍可访问）
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true },
    });
    if (!user) return reply.status(401).send({ error: 'Unauthorized' });
    (request as any).user = { userId: payload.userId, email: payload.email, role: user.role };
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

/** 仅允许 role === 'admin' 通过 */
export async function requireAdmin(request: FastifyRequest, reply: FastifyReply) {
  await authenticate(request, reply);
  if (reply.sent) return; // authenticate 已经返回 401
  const role = (request as any).user?.role;
  if (role !== 'admin') {
    return reply.status(403).send({ error: 'Forbidden: admin role required' });
  }
}
