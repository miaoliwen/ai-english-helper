import prisma from '../utils/db.js';
import { encodeApiKey, decodeApiKey, maskApiKey } from '../utils/crypto.js';

interface CreateProviderInput {
  name: string;
  baseUrl: string;
  apiKey: string;
  format?: string;
}

interface UpdateProviderInput {
  name?: string;
  baseUrl?: string;
  apiKey?: string;
  format?: string;
  enabled?: boolean;
}

function maskKey(key: string): string {
  const decoded = decodeApiKey(key);
  return maskApiKey(decoded);
}

export async function createProvider(input: CreateProviderInput) {
  return prisma.provider.create({
    data: {
      name: input.name,
      baseUrl: input.baseUrl,
      apiKey: encodeApiKey(input.apiKey),
      format: input.format || 'auto',
    },
  });
}

export async function getProviders() {
  return prisma.provider.findMany({
    include: { models: true },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getProvider(id: string) {
  return prisma.provider.findUnique({
    where: { id },
    include: { models: true },
  });
}

export async function updateProvider(id: string, input: UpdateProviderInput) {
  const data: Record<string, any> = { ...input };
  if (input.apiKey !== undefined) {
    data.apiKey = encodeApiKey(input.apiKey);
  }
  return prisma.provider.update({ where: { id }, data });
}

export async function deleteProvider(id: string) {
  return prisma.provider.delete({ where: { id } });
}

export async function getProviderWithKey(id: string) {
  const provider = await prisma.provider.findUnique({ where: { id } });
  if (!provider) return null;
  return { ...provider, apiKey: decodeApiKey(provider.apiKey) };
}

export function toSafeProvider(provider: any) {
  return { ...provider, apiKey: maskKey(provider.apiKey) };
}