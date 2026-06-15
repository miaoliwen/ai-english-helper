import prisma from '../utils/db.js';

export class NotFoundError extends Error {
  constructor(message = 'NOT_FOUND') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export async function getSessions(userId: string) {
  return prisma.chatSession.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, updatedAt: true, createdAt: true },
  });
}

export async function getSession(userId: string, id: string) {
  return prisma.chatSession.findFirst({ where: { id, userId } });
}

export async function upsertSession(
  userId: string,
  data: { id?: string; title?: string; messages: any[]; ocrId?: string },
) {
  // 严格基于 userId 鉴权：必须先校验该 session 属于当前用户
  if (data.id) {
    const existing = await prisma.chatSession.findFirst({ where: { id: data.id, userId } });
    if (!existing) throw new NotFoundError();
    // 仅更新允许的字段，不要回写 userId（避免 IDOR 窃取）
    return prisma.chatSession.update({
      where: { id: data.id },
      data: {
        title: data.title ?? null,
        messages: JSON.stringify(data.messages ?? []),
        ocrId: data.ocrId ?? null,
      },
    });
  }
  return prisma.chatSession.create({
    data: {
      userId,
      title: data.title ?? null,
      messages: JSON.stringify(data.messages ?? []),
      ocrId: data.ocrId ?? null,
    },
  });
}

export async function deleteSession(userId: string, id: string) {
  const session = await prisma.chatSession.findFirst({ where: { id, userId } });
  if (!session) throw new NotFoundError();
  return prisma.chatSession.delete({ where: { id } });
}

export async function getFavorites(userId: string) {
  return prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function addFavorite(
  userId: string,
  data: { title: string; type: string; content: string; ocrId?: string; chatId?: string; tags?: string[] },
) {
  return prisma.favorite.create({
    data: {
      userId,
      title: data.title,
      type: data.type,
      content: data.content,
      ocrId: data.ocrId ?? null,
      chatId: data.chatId ?? null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
    },
  });
}

export async function deleteFavorite(userId: string, id: string) {
  const fav = await prisma.favorite.findFirst({ where: { id, userId } });
  if (!fav) throw new NotFoundError();
  return prisma.favorite.delete({ where: { id } });
}

export async function getOCRResults(userId: string) {
  return prisma.oCRResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createOCRResult(userId: string, data: { text: string; markdown: string; imageBase64?: string }) {
  return prisma.oCRResult.create({ data: { userId, text: data.text, markdown: data.markdown, imageBase64: data.imageBase64 ?? null } });
}

export async function deleteOCRResult(userId: string, id: string) {
  const ocr = await prisma.oCRResult.findFirst({ where: { id, userId } });
  if (!ocr) throw new NotFoundError();
  return prisma.oCRResult.delete({ where: { id } });
}
