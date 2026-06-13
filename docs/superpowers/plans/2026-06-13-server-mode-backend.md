# 服务端模式后端 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add server-side AI provider and model management so the server mode dynamically serves available models from the database instead of hardcoded values.

**Architecture:** Prisma schema adds `Provider` and `ServerModel` tables. Admin API manages providers/models. Proxy routes read from DB instead of env vars. Frontend fetches server models via API.

**Tech Stack:** Fastify v5, Prisma v6.5, SQLite, TypeScript, Vue 3, Pinia

---

### Task 1: Prisma Schema — Add Provider & ServerModel

**Files:**
- Modify: `server/prisma/schema.prisma`

- [ ] **Step 1: Add Provider and ServerModel models to schema**

Append to `server/prisma/schema.prisma`:

```prisma
model Provider {
  id        String   @id @default(uuid())
  name      String
  baseUrl   String
  apiKey    String
  format    String   @default("auto")
  enabled   Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  models    ServerModel[]
}

model ServerModel {
  id         String   @id @default(uuid())
  providerId String
  provider   Provider @relation(fields: [providerId], references: [id], onDelete: Cascade)
  modelId    String
  name       String
  type       String
  enabled    Boolean  @default(true)
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  @@unique([providerId, modelId])
}
```

- [ ] **Step 2: Run prisma generate and db push**

```bash
cd server && npx prisma generate && npx prisma db push
```

Expected: "The database is now in sync with your Prisma schema"

- [ ] **Step 3: Commit**

```bash
git add server/prisma/schema.prisma server/prisma/dev.db
git commit -m "feat(server): add Provider and ServerModel schema"
```

---

### Task 2: Server-side Crypto Utility

**Files:**
- Create: `server/src/utils/crypto.ts`
- Create: `server/src/utils/__tests__/crypto.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/utils/__tests__/crypto.spec.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { encodeApiKey, decodeApiKey, maskApiKey } from '../crypto.js';

describe('crypto utilities', () => {
  it('encodeApiKey produces encrypted string', () => {
    const encoded = encodeApiKey('sk-test-key-12345');
    expect(encoded).toBeTruthy();
    expect(typeof encoded).toBe('string');
  });

  it('decodeApiKey reverses encodeApiKey', () => {
    const key = 'sk-test-key-12345';
    const encoded = encodeApiKey(key);
    expect(decodeApiKey(encoded)).toBe(key);
  });

  it('maskApiKey shows first 8 chars and ***', () => {
    expect(maskApiKey('sk-1234567890abcdef')).toBe('sk-12345***');
  });

  it('maskApiKey handles short keys', () => {
    expect(maskApiKey('abc')).toBe('abc***');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npx vitest run src/utils/__tests__/crypto.spec.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `server/src/utils/crypto.ts`:

```typescript
import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';
const ENCRYPTION_KEY = crypto.scryptSync(
  process.env.ENCRYPTION_SECRET || 'aieh-default-secret-change-in-prod',
  'salt',
  32
);
const IV_LENGTH = 16;

export function encodeApiKey(key: string): string {
  if (!key) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let encrypted = cipher.update(key, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decodeApiKey(encoded: string): string {
  if (!encoded) return '';
  const parts = encoded.split(':');
  if (parts.length !== 2) return encoded;
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

export function maskApiKey(key: string): string {
  if (!key) return '';
  if (key.length <= 8) return key + '***';
  return key.substring(0, 8) + '***';
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd server && npx vitest run src/utils/__tests__/crypto.spec.ts
```

Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/src/utils/crypto.ts server/src/utils/__tests__/crypto.spec.ts
git commit -m "feat(server): add crypto utility for API key encryption"
```

---

### Task 3: Provider Service — CRUD Operations

**Files:**
- Create: `server/src/services/provider.service.ts`
- Create: `server/src/services/__tests__/provider.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/services/__tests__/provider.service.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '../../utils/db.js';
import { createProvider, getProviders, updateProvider, deleteProvider } from '../provider.service.js';

describe('provider.service', () => {
  beforeEach(async () => {
    await prisma.serverModel.deleteMany();
    await prisma.provider.deleteMany();
  });

  it('createProvider creates a provider with encrypted apiKey', async () => {
    const provider = await createProvider({
      name: 'Test Provider',
      baseUrl: 'https://api.test.com',
      apiKey: 'sk-test-key-12345',
      format: 'openai',
    });
    expect(provider.id).toBeTruthy();
    expect(provider.name).toBe('Test Provider');
    expect(provider.apiKey).not.toBe('sk-test-key-12345');
  });

  it('getProviders returns all providers with models', async () => {
    await createProvider({
      name: 'P1',
      baseUrl: 'https://api.p1.com',
      apiKey: 'key1',
      format: 'openai',
    });
    const providers = await getProviders();
    expect(providers.length).toBe(1);
    expect(providers[0].models).toEqual([]);
  });

  it('updateProvider updates fields', async () => {
    const p = await createProvider({
      name: 'Old Name',
      baseUrl: 'https://api.old.com',
      apiKey: 'key',
      format: 'auto',
    });
    const updated = await updateProvider(p.id, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
  });

  it('deleteProvider removes provider', async () => {
    const p = await createProvider({
      name: 'To Delete',
      baseUrl: 'https://api.del.com',
      apiKey: 'key',
      format: 'auto',
    });
    await deleteProvider(p.id);
    const all = await getProviders();
    expect(all.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npx vitest run src/services/__tests__/provider.service.spec.ts
```

Expected: FAIL — module not found

- [ ] **Step 3: Write implementation**

Create `server/src/services/provider.service.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd server && npx vitest run src/services/__tests__/provider.service.spec.ts
```

Expected: 4 tests pass

- [ ] **Step 5: Commit**

```bash
git add server/src/services/provider.service.ts server/src/services/__tests__/provider.service.spec.ts
git commit -m "feat(server): add provider service with CRUD operations"
```

---

### Task 4: ServerModel Service

**Files:**
- Create: `server/src/services/server-model.service.ts`
- Create: `server/src/services/__tests__/server-model.service.spec.ts`

- [ ] **Step 1: Write the failing test**

Create `server/src/services/__tests__/server-model.service.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import prisma from '../../utils/db.js';
import { createProvider } from '../provider.service.js';
import { getServerModels, createServerModel, updateServerModel, getEnabledServerModels } from '../server-model.service.js';

describe('server-model.service', () => {
  let providerId: string;

  beforeEach(async () => {
    await prisma.serverModel.deleteMany();
    await prisma.provider.deleteMany();
    const p = await createProvider({ name: 'Test', baseUrl: 'https://api.test.com', apiKey: 'sk-test', format: 'openai' });
    providerId = p.id;
  });

  it('createServerModel creates a model', async () => {
    const model = await createServerModel({ providerId, modelId: 'gpt-4o', name: 'GPT-4o', type: 'vision' });
    expect(model.modelId).toBe('gpt-4o');
    expect(model.type).toBe('vision');
  });

  it('getServerModels returns models with provider info', async () => {
    await createServerModel({ providerId, modelId: 'gpt-4o', name: 'GPT-4o', type: 'vision' });
    const models = await getServerModels();
    expect(models.length).toBe(1);
    expect(models[0].provider.name).toBe('Test');
  });

  it('getEnabledServerModels filters by enabled', async () => {
    await createServerModel({ providerId, modelId: 'gpt-4o', name: 'GPT-4o', type: 'vision' });
    const m2 = await createServerModel({ providerId, modelId: 'gpt-3.5', name: 'GPT-3.5', type: 'chat' });
    await updateServerModel(m2.id, { enabled: false });
    const enabled = await getEnabledServerModels();
    expect(enabled.length).toBe(1);
    expect(enabled[0].modelId).toBe('gpt-4o');
  });

  it('updateServerModel updates fields', async () => {
    const m = await createServerModel({ providerId, modelId: 'gpt-4o', name: 'GPT-4o', type: 'vision' });
    const updated = await updateServerModel(m.id, { type: 'chat' });
    expect(updated.type).toBe('chat');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd server && npx vitest run src/services/__tests__/server-model.service.spec.ts
```

- [ ] **Step 3: Write implementation**

Create `server/src/services/server-model.service.ts`:

```typescript
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
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd server && npx vitest run src/services/__tests__/server-model.service.spec.ts
```

- [ ] **Step 5: Commit**

```bash
git add server/src/services/server-model.service.ts server/src/services/__tests__/server-model.service.spec.ts
git commit -m "feat(server): add server model service with CRUD operations"
```

---

### Task 5: Cache Utility

**Files:**
- Create: `server/src/utils/cache.ts`
- Create: `server/src/utils/__tests__/cache.spec.ts`

- [ ] **Step 1: Write test**

Create `server/src/utils/__tests__/cache.spec.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderCache } from '../cache.js';

describe('ProviderCache', () => {
  let cache: ProviderCache;
  beforeEach(() => { cache = new ProviderCache(1000); });

  it('set and get', () => {
    cache.set('p1', { id: 'p1', apiKey: 'key1' });
    expect(cache.get('p1')).toEqual({ id: 'p1', apiKey: 'key1' });
  });

  it('returns null for missing key', () => {
    expect(cache.get('missing')).toBeNull();
  });

  it('invalidates on delete', () => {
    cache.set('p1', { id: 'p1' });
    cache.invalidate('p1');
    expect(cache.get('p1')).toBeNull();
  });

  it('clears all entries', () => {
    cache.set('p1', { id: 'p1' });
    cache.set('p2', { id: 'p2' });
    cache.clear();
    expect(cache.get('p1')).toBeNull();
  });
});
```

- [ ] **Step 2: Write implementation**

Create `server/src/utils/cache.ts`:

```typescript
interface CacheEntry<T> { value: T; expiresAt: number; }

export class ProviderCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;
  constructor(ttlMs: number = 5 * 60 * 1000) { this.ttl = ttlMs; }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) { this.cache.delete(key); return null; }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.cache.set(key, { value, expiresAt: Date.now() + this.ttl });
  }

  invalidate(key: string): void { this.cache.delete(key); }
  clear(): void { this.cache.clear(); }
}
```

- [ ] **Step 3: Run test**

```bash
cd server && npx vitest run src/utils/__tests__/cache.spec.ts
```

- [ ] **Step 4: Commit**

```bash
git add server/src/utils/cache.ts server/src/utils/__tests__/cache.spec.ts
git commit -m "feat(server): add provider cache utility"
```

---

### Task 6: Shared Auth Middleware

**Files:**
- Create: `server/src/utils/auth.ts`

- [ ] **Step 1: Create shared auth middleware**

Create `server/src/utils/auth.ts`:

```typescript
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyAccessToken } from './jwt.js';

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
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
```

- [ ] **Step 2: Commit**

```bash
git add server/src/utils/auth.ts
git commit -m "refactor(server): extract authenticate to shared middleware"
```

---

### Task 7: Model API Utility

**Files:**
- Create: `server/src/utils/model-api.ts`

- [ ] **Step 1: Create model API utility**

Create `server/src/utils/model-api.ts`:

```typescript
export type ApiFormat = 'openai' | 'deepseek' | 'zhipu' | 'auto';

export async function detectApiFormat(baseUrl: string): Promise<ApiFormat> {
  try {
    const r = await fetch(`${baseUrl}/v1/models`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (r.ok) return 'openai';
  } catch {}
  try {
    const r = await fetch(`${baseUrl}/api/models`, { method: 'GET', headers: { 'Content-Type': 'application/json' } });
    if (r.ok) return 'deepseek';
  } catch {}
  return 'auto';
}

export async function fetchModelList(baseUrl: string, apiKey: string, format: ApiFormat) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` };
  if (format === 'openai' || format === 'auto') {
    try {
      const res = await fetch(`${baseUrl}/v1/models`, { headers });
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || []).map((m: any) => ({ id: m.id, name: m.name || m.id }));
        if (models.length > 0) return { models };
      }
    } catch {}
  }
  if (format === 'deepseek' || format === 'auto') {
    try {
      const res = await fetch(`${baseUrl}/api/models`, { headers });
      if (res.ok) {
        const data = await res.json();
        const models = (data.data || data.models || []).map((m: any) => ({ id: m.id, name: m.name || m.id }));
        if (models.length > 0) return { models };
      }
    } catch {}
  }
  return { models: [] };
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/utils/model-api.ts
git commit -m "feat(server): add model API utility for provider communication"
```

---

### Task 8: Admin Routes

**Files:**
- Create: `server/src/routes/admin.ts`

- [ ] **Step 1: Create admin routes**

Create `server/src/routes/admin.ts`:

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { createProvider, getProviders, updateProvider, deleteProvider, getProviderWithKey, toSafeProvider } from '../services/provider.service.js';
import { getServerModels, createServerModel, updateServerModel, deleteServerModel } from '../services/server-model.service.js';
import { authenticate } from '../utils/auth.js';
import { detectApiFormat, fetchModelList } from '../utils/model-api.js';
import { ProviderCache } from '../utils/cache.js';

const providerCache = new ProviderCache();

export default async function adminRoutes(app: FastifyInstance) {
  app.get('/api/admin/providers', { preHandler: [authenticate] }, async () => {
    const providers = await getProviders();
    return { providers: providers.map(toSafeProvider) };
  });

  app.post('/api/admin/providers', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { name, baseUrl, apiKey, format } = request.body as any;
    if (!name || !baseUrl || !apiKey) return reply.status(400).send({ error: 'name, baseUrl, apiKey required' });
    const provider = await createProvider({ name, baseUrl, apiKey, format });
    return toSafeProvider(provider);
  });

  app.put('/api/admin/providers/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { name, baseUrl, apiKey, format, enabled } = request.body as any;
    try {
      const updated = await updateProvider(id, { name, baseUrl, apiKey, format, enabled });
      providerCache.clear();
      return toSafeProvider(updated);
    } catch { return reply.status(404).send({ error: 'Provider not found' }); }
  });

  app.delete('/api/admin/providers/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    try { await deleteProvider(id); providerCache.clear(); return { success: true }; }
    catch { return reply.status(404).send({ error: 'Provider not found' }); }
  });

  app.post('/api/admin/providers/:id/test', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const provider = await getProviderWithKey(id);
    if (!provider) return reply.status(404).send({ error: 'Provider not found' });
    try {
      const format = provider.format === 'auto' ? await detectApiFormat(provider.baseUrl) : provider.format;
      const result = await fetchModelList(provider.baseUrl, provider.apiKey, format);
      return { success: true, message: '连接成功', models: result.models.map(m => m.id) };
    } catch (e: any) { return { success: false, message: e.message || '连接失败' }; }
  });

  app.get('/api/admin/providers/:id/models', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const provider = await getProviderWithKey(id);
    if (!provider) return reply.status(404).send({ error: 'Provider not found' });
    try {
      const format = provider.format === 'auto' ? await detectApiFormat(provider.baseUrl) : provider.format;
      return await fetchModelList(provider.baseUrl, provider.apiKey, format);
    } catch (e: any) { return reply.status(502).send({ error: e.message }); }
  });

  app.post('/api/admin/models', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { providerId, modelId, name, type } = request.body as any;
    if (!providerId || !modelId || !name || !type) return reply.status(400).send({ error: 'providerId, modelId, name, type required' });
    try { return await createServerModel({ providerId, modelId, name, type }); }
    catch (e: any) { return reply.status(400).send({ error: e.message }); }
  });

  app.put('/api/admin/models/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    const { name, type, enabled } = request.body as any;
    try { return await updateServerModel(id, { name, type, enabled }); }
    catch { return reply.status(404).send({ error: 'Model not found' }); }
  });

  app.delete('/api/admin/models/:id', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { id } = request.params as any;
    try { await deleteServerModel(id); return { success: true }; }
    catch { return reply.status(404).send({ error: 'Model not found' }); }
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/admin.ts
git commit -m "feat(server): add admin routes for provider and model management"
```

---

### Task 9: Public Models Route

**Files:**
- Create: `server/src/routes/models.ts`

- [ ] **Step 1: Create public models route**

Create `server/src/routes/models.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { getEnabledServerModels } from '../services/server-model.service.js';
import { authenticate } from '../utils/auth.js';

export default async function modelsRoutes(app: FastifyInstance) {
  app.get('/api/models/server', { preHandler: [authenticate] }, async () => {
    const models = await getEnabledServerModels();
    return {
      models: models.map(m => ({
        id: m.id, modelId: m.modelId, name: m.name, type: m.type, providerName: m.provider.name,
      })),
    };
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/models.ts
git commit -m "feat(server): add public server models endpoint"
```

---

### Task 10: Refactor Proxy Routes to Use Database

**Files:**
- Modify: `server/src/routes/proxy.ts`

- [ ] **Step 1: Rewrite proxy routes**

Replace content of `server/src/routes/proxy.ts`:

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { authenticate } from '../utils/auth.js';
import { findServerModelByModelId } from '../services/server-model.service.js';
import { getProviderWithKey } from '../services/provider.service.js';
import { ProviderCache } from '../utils/cache.js';

const providerCache = new ProviderCache();

async function getProviderForModel(modelId: string) {
  const cached = providerCache.get(modelId);
  if (cached) return cached;
  const serverModel = await findServerModelByModelId(modelId);
  if (!serverModel) return null;
  if (!serverModel.enabled || !serverModel.provider.enabled) return null;
  const provider = await getProviderWithKey(serverModel.providerId);
  if (!provider) return null;
  providerCache.set(modelId, provider);
  return provider;
}

export default async function proxyRoutes(app: FastifyInstance) {
  app.post('/api/proxy/chat', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const modelId = body.model;
    if (!modelId) return reply.status(400).send({ error: 'model field required' });
    const provider = await getProviderForModel(modelId);
    if (!provider) return reply.status(404).send({ error: `Model '${modelId}' not found or disabled` });
    const isStream = body.stream !== false;
    try {
      const response = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
        body: JSON.stringify({ model: modelId, messages: body.messages, stream: isStream, temperature: body.temperature ?? 0.7, max_tokens: body.max_tokens ?? 4096 }),
      });
      if (!response.ok) { const errText = await response.text(); return reply.status(response.status).send({ error: `AI API error: ${errText}` }); }
      if (isStream) {
        reply.raw.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) { const { done, value } = await reader.read(); if (done) break; reply.raw.write(decoder.decode(value)); }
        reply.raw.end();
      } else { return await response.json(); }
    } catch (e: any) { return reply.status(502).send({ error: e.message || 'Proxy error' }); }
  });

  app.post('/api/proxy/vision', { preHandler: [authenticate] }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const modelId = body.model || 'gpt-4o';
    const provider = await getProviderForModel(modelId);
    if (!provider) return reply.status(404).send({ error: `Model '${modelId}' not found or disabled` });
    try {
      const response = await fetch(`${provider.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${provider.apiKey}` },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      return reply.status(response.status).send(data);
    } catch (e: any) { return reply.status(502).send({ error: e.message || 'Proxy error' }); }
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add server/src/routes/proxy.ts
git commit -m "refactor(server): proxy routes read from database instead of env vars"
```

---

### Task 11: Register New Routes in App

**Files:**
- Modify: `server/src/app.ts`

- [ ] **Step 1: Import and register admin and models routes**

Add to `server/src/app.ts`:

```typescript
import adminRoutes from './routes/admin.js';
import modelsRoutes from './routes/models.js';

// After existing route registrations:
await app.register(adminRoutes);
await app.register(modelsRoutes);
```

- [ ] **Step 2: Commit**

```bash
git add server/src/app.ts
git commit -m "feat(server): register admin and models routes"
```

---

### Task 12: Frontend — Extend ServerModelConfig Type

**Files:**
- Modify: `src/types/config.ts`

- [ ] **Step 1: Add providerName to ServerModelConfig**

In `src/types/config.ts`, update `ServerModelConfig`:

```typescript
export interface ServerModelConfig {
  id: string
  name: string
  modelId: string
  description?: string
  available: boolean
  type?: string
  providerName?: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/config.ts
git commit -m "feat(frontend): extend ServerModelConfig with providerName and type"
```

---

### Task 13: Frontend — Add fetchServerModels to Config Store

**Files:**
- Modify: `src/stores/config.ts`

- [ ] **Step 1: Add fetchServerModels method and remove hardcoded defaults**

In `src/stores/config.ts`:

1. Remove the `defaultServerModels` array
2. Add `fetchServerModels` function:

```typescript
async function fetchServerModels(): Promise<ServerModelConfig[]> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001'}/api/models/server`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('aieh-access-token') || ''}`,
      },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.models || []).map((m: any) => ({
      id: m.id,
      name: m.name,
      modelId: m.modelId,
      type: m.type,
      providerName: m.providerName,
      available: true,
    }));
  } catch {
    return [];
  }
}
```

3. Update `loadConfig` default to return empty `serverModels: []`
4. Export `fetchServerModels`

- [ ] **Step 2: Commit**

```bash
git add src/stores/config.ts
git commit -m "feat(frontend): add fetchServerModels to config store"
```

---

### Task 14: Frontend — Update ServerModePanel

**Files:**
- Modify: `src/components/settings/ServerModePanel.vue`

- [ ] **Step 1: Rewrite to fetch models from server**

Replace the script section of `ServerModePanel.vue`:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { ServerModelConfig } from '@/types/config'

const store = useConfigStore()
const chatModels = ref<ServerModelConfig[]>([])
const visionModels = ref<ServerModelConfig[]>([])
const loading = ref(true)

onMounted(async () => {
  const models = await store.fetchServerModels()
  chatModels.value = models.filter(m => m.type === 'chat')
  visionModels.value = models.filter(m => m.type === 'vision')
  loading.value = false
})
</script>
```

Update the template to iterate over `chatModels` and `visionModels` arrays, showing each model with name, modelId, providerName, and availability status.

- [ ] **Step 2: Commit**

```bash
git add src/components/settings/ServerModePanel.vue
git commit -m "feat(frontend): ServerModePanel fetches models from server API"
```

---

### Task 15: Run All Tests and Verify

- [ ] **Step 1: Run server tests**

```bash
cd server && npx vitest run
```

Expected: All tests pass

- [ ] **Step 2: Run frontend tests**

```bash
npm test
```

Expected: All tests pass

- [ ] **Step 3: Run TypeScript check**

```bash
npx vue-tsc --noEmit
```

Expected: No errors

- [ ] **Step 4: Run lint**

```bash
npm run lint
```

Expected: No errors

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: complete server mode backend implementation"
```
