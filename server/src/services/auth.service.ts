import prisma from '../utils/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, TokenPayload } from '../utils/jwt.js';

export async function register(email: string, password: string, nickname?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('EMAIL_EXISTS');

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, password: hashed, nickname },
  });
  const payload: TokenPayload = { userId: user.id, email: user.email };
  return {
    user: { id: user.id, email: user.email, nickname: user.nickname },
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error('INVALID_CREDENTIALS');

  const valid = await comparePassword(password, user.password);
  if (!valid) throw new Error('INVALID_CREDENTIALS');

  const payload: TokenPayload = { userId: user.id, email: user.email };
  return {
    user: { id: user.id, email: user.email, nickname: user.nickname },
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
  };
}

export async function refresh(token: string) {
  const { verifyRefreshToken } = await import('../utils/jwt.js');
  const payload = verifyRefreshToken(token);
  const user = await prisma.user.findUnique({ where: { id: payload.userId } });
  if (!user) throw new Error('USER_NOT_FOUND');

  const newPayload: TokenPayload = { userId: user.id, email: user.email };
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
  };
}

export async function getUser(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('USER_NOT_FOUND');
  return { id: user.id, email: user.email, nickname: user.nickname };
}

export async function updateUser(userId: string, data: { nickname?: string; password?: string }) {
  const updateData: Record<string, string> = {};
  if (data.nickname) updateData.nickname = data.nickname;
  if (data.password) updateData.password = await hashPassword(data.password);
  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData,
  });
  return { id: user.id, email: user.email, nickname: user.nickname };
}
