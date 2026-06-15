import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../../utils/db.js';
import * as authService from '../auth.service.js';

describe('auth.service — 角色提升与登录', () => {
  beforeEach(async () => {
    await prisma.chatSession.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.oCRResult.deleteMany();
    await prisma.user.deleteMany();
  });

  afterAll(async () => {
    await prisma.chatSession.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.oCRResult.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('首位注册用户自动成为 admin', async () => {
    const r = await authService.register('first@ex.com', 'password123');
    expect(r.user.role).toBe('admin');
    // token 内也带 role
    const payload = JSON.parse(Buffer.from(r.accessToken.split('.')[1], 'base64').toString());
    expect(payload.role).toBe('admin');
  });

  it('后续注册用户为普通 user', async () => {
    await authService.register('first@ex.com', 'password123');
    const r = await authService.register('second@ex.com', 'password123');
    expect(r.user.role).toBe('user');
  });

  it('重复邮箱注册抛 EMAIL_EXISTS', async () => {
    await authService.register('dup@ex.com', 'password123');
    await expect(authService.register('dup@ex.com', 'password123')).rejects.toThrow('EMAIL_EXISTS');
  });

  it('登录返回正确 role', async () => {
    await authService.register('login@ex.com', 'password123');
    const r = await authService.login('login@ex.com', 'password123');
    expect(r.user.role).toBe('admin'); // 首位
  });

  it('错误密码抛 INVALID_CREDENTIALS', async () => {
    await authService.register('wrong@ex.com', 'password123');
    await expect(authService.login('wrong@ex.com', 'nope')).rejects.toThrow('INVALID_CREDENTIALS');
  });

  it('refresh 换发新 token 且保留 role', async () => {
    const r = await authService.register('refresh@ex.com', 'password123');
    const newTokens = await authService.refresh(r.refreshToken);
    expect(newTokens.accessToken).toBeTruthy();
    const payload = JSON.parse(Buffer.from(newTokens.accessToken.split('.')[1], 'base64').toString());
    expect(payload.role).toBe('admin');
  });
});
