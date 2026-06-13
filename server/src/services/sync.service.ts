import prisma from '../utils/db.js';

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

export async function upsertSession(userId: string, data: { id?: string; title?: string; messages: any[]; ocrId?: string }) {
  const payload = {
    userId,
    title: data.title || null,
    messages: JSON.stringify(data.messages),
    ocrId: data.ocrId || null,
  };
  if (data.id) {
    return prisma.chatSession.update({ where: { id: data.id }, data: payload });
  }
  const { id: _, ...rest } = payload as any;
  return prisma.chatSession.create({ data: rest });
}

export async function deleteSession(userId: string, id: string) {
  const session = await prisma.chatSession.findFirst({ where: { id, userId } });
  if (!session) throw new Error('NOT_FOUND');
  return prisma.chatSession.delete({ where: { id } });
}

export async function getFavorites(userId: string) {
  return prisma.favorite.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function addFavorite(userId: string, data: { title: string; type: string; content: string; ocrId?: string; chatId?: string; tags?: string[] }) {
  return prisma.favorite.create({
    data: {
      userId,
      title: data.title,
      type: data.type,
      content: data.content,
      ocrId: data.ocrId || null,
      chatId: data.chatId || null,
      tags: data.tags ? JSON.stringify(data.tags) : null,
    },
  });
}

export async function deleteFavorite(userId: string, id: string) {
  const fav = await prisma.favorite.findFirst({ where: { id, userId } });
  if (!fav) throw new Error('NOT_FOUND');
  return prisma.favorite.delete({ where: { id } });
}

export async function getOCRResults(userId: string) {
  return prisma.oCRResult.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } });
}

export async function createOCRResult(userId: string, data: { text: string; markdown: string; imageBase64?: string }) {
  return prisma.oCRResult.create({ data: { userId, text: data.text, markdown: data.markdown, imageBase64: data.imageBase64 || null } });
}

export async function deleteOCRResult(userId: string, id: string) {
  const ocr = await prisma.oCRResult.findFirst({ where: { id, userId } });
  if (!ocr) throw new Error('NOT_FOUND');
  return prisma.oCRResult.delete({ where: { id } });
}
