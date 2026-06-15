import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import prisma from '../../utils/db.js';
import * as syncService from '../sync.service.js';
import { NotFoundError } from '../sync.service.js';
import { hashPassword } from '../../utils/password.js';

describe('sync.service — 用户隔离 / IDOR 防护', () => {
  let userA: string;
  let userB: string;

  beforeEach(async () => {
    // 清表
    await prisma.chatSession.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.oCRResult.deleteMany();
    await prisma.user.deleteMany();

    const a = await prisma.user.create({ data: { email: 'a@ex.com', password: await hashPassword('p1'), role: 'user' } });
    const b = await prisma.user.create({ data: { email: 'b@ex.com', password: await hashPassword('p2'), role: 'user' } });
    userA = a.id;
    userB = b.id;
  });

  afterAll(async () => {
    await prisma.chatSession.deleteMany();
    await prisma.favorite.deleteMany();
    await prisma.oCRResult.deleteMany();
    await prisma.user.deleteMany();
    await prisma.$disconnect();
  });

  it('A 创建的 session，B 不能读（getSession 返回 null）', async () => {
    const s = await syncService.upsertSession(userA, { title: 'A', messages: [{ role: 'user', content: 'x' }] });
    const got = await syncService.getSession(userB, s.id);
    expect(got).toBeNull();
  });

  it('B 用 A 的 session id 做 upsert(update) → 抛 NotFoundError，且不修改 A 的数据', async () => {
    const s = await syncService.upsertSession(userA, { title: 'A-original', messages: [] });
    await expect(syncService.upsertSession(userB, { id: s.id, title: 'hijacked', messages: [] })).rejects.toBeInstanceOf(NotFoundError);
    // A 的 session 标题未变
    const aSession = await syncService.getSession(userA, s.id);
    expect(aSession?.title).toBe('A-original');
  });

  it('B 删除 A 的 session → 抛 NotFoundError', async () => {
    const s = await syncService.upsertSession(userA, { title: 'A', messages: [] });
    await expect(syncService.deleteSession(userB, s.id)).rejects.toBeInstanceOf(NotFoundError);
    // 仍存在
    const still = await syncService.getSession(userA, s.id);
    expect(still).not.toBeNull();
  });

  it('B 删除 A 的 favorite / ocr → NotFoundError', async () => {
    const fav = await syncService.addFavorite(userA, { title: 'A', type: 'chat', content: 'c' });
    const ocr = await syncService.createOCRResult(userA, { text: 't', markdown: 'm' });
    await expect(syncService.deleteFavorite(userB, fav.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(syncService.deleteOCRResult(userB, ocr.id)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('upsertSession 不回写 userId（不会把 A 的 session 偷给 B）', async () => {
    const s = await syncService.upsertSession(userA, { title: 'A', messages: [] });
    // 直接查 DB 确认 owner 未变
    const raw = await prisma.chatSession.findUnique({ where: { id: s.id } });
    expect(raw?.userId).toBe(userA);
  });
});
