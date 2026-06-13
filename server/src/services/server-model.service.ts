import prisma from '../utils/db.js';

interface CreateServerModelInput {
  providerId: string;
  modelId: string;
  name: string;
  type: string;
}

interface UpdateServerModelInput {
  name?: string;
  type?: string;
  enabled?: boolean;
}

export async function createServerModel(input: CreateServerModelInput) {
  return prisma.serverModel.create({ data: input });
}

export async function getServerModels() {
  return prisma.serverModel.findMany({ include: { provider: true }, orderBy: { createdAt: 'asc' } });
}

export async function getEnabledServerModels() {
  return prisma.serverModel.findMany({
    where: { enabled: true, provider: { enabled: true } },
    include: { provider: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function updateServerModel(id: string, input: UpdateServerModelInput) {
  return prisma.serverModel.update({ where: { id }, data: input });
}

export async function deleteServerModel(id: string) {
  return prisma.serverModel.delete({ where: { id } });
}

export async function findServerModelByModelId(modelId: string) {
  return prisma.serverModel.findFirst({ where: { modelId }, include: { provider: true } });
}