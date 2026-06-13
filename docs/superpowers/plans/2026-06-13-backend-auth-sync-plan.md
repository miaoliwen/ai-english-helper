# 后端认证与同步系统 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task.

**Goal:** 为 AI 英语解题助手增加 Node.js 后端，提供邮箱注册登录、数据云同步和 AI API 代理

**Architecture:** Fastify + Prisma + SQLite 单体后端，三大模块（auth/sync/proxy）通过路由组织

**Tech Stack:** Fastify 5, Prisma 6, SQLite, TypeScript, bcrypt, JWT

---

### Task 1: 初始化后端项目结构

**Files:**
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/.env.example`
- Create: `server/.env`
- Create: `server/src/app.ts`

- [ ] **Step 1: Create server/package.json**

```json
{
  "name": "ai-english-helper-server",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/app.ts",
    "build": "tsc",
    "start": "node dist/app.js",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio"
  },
  "dependencies": {
    "@prisma/client": "^6.5.0",
    "bcrypt": "^5.1.1",
    "fastify": "^5.2.0",
    "@fastify/cors": "^11.0.0",
    "@fastify/rate-limit": "^10.2.0",
    "jsonwebtoken": "^9.0.2",
    "dotenv": "^16.4.7"
  },
  "devDependencies": {
    "prisma": "^6.5.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "@types/node": "^22.10.0",
    "@types/bcrypt": "^5.0.2",
    "@types/jsonwebtoken": "^9.0.7"
  }
}
```

- [ ] **Step 2: Create server/tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 3: Create server/.env.example**

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-this-to-a-random-secret"
JWT_REFRESH_SECRET="change-this-to-another-random-secret"
PORT=3001
CORS_ORIGIN=http://localhost:3000
AI_CHAT_API_KEY=
AI_VISION_API_KEY=
AI_CHAT_BASE_URL=https://api.deepseek.com
AI_VISION_BASE_URL=https://api.openai.com
```

- [ ] **Step 4: Create server/.env** (copy from .env.example with dev defaults)

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="dev-jwt-secret-key-change-in-production"
JWT_REFRESH_SECRET="dev-jwt-refresh-secret-key-change-in-production"
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

- [ ] **Step 5: Create server/src/app.ts**

```typescript
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

const port = parseInt(process.env.PORT || '3001', 10);
await app.listen({ port, host: '0.0.0.0' });
```

- [ ] **Step 6: Install dependencies and verify**

```bash
cd server
npm install
npx tsx src/app.ts
```

---

### Task 2: Prisma 数据库模型

**Files:**
- Create: `server/prisma/schema.prisma`
- Create: `server/src/utils/db.ts`

- [ ] **Step 1: Create Prisma schema**

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  nickname  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  sessions   ChatSession[]
  favorites  Favorite[]
  ocrResults OCRResult[]
}

model ChatSession {
  id        String   @id @default(uuid())
  userId    String
  title     String?
  messages  String
  ocrId     String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model Favorite {
  id        String   @id @default(uuid())
  userId    String
  title     String
  type      String
  content   String
  ocrId     String?
  chatId    String?
  tags      String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model OCRResult {
  id          String   @id @default(uuid())
  userId      String
  text        String
  markdown    String
  imageBase64 String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

- [ ] **Step 2: Create db.ts**

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default prisma;
```

- [ ] **Step 3: Generate Prisma client and push schema**

```bash
cd server
npx prisma generate
npx prisma db push
```

---

### Task 3: 密码工具函数

**Files:**
- Create: `server/src/utils/password.ts`

- [ ] **Step 1: Create password.ts**

```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

---

### Task 4: JWT 工具函数

**Files:**
- Create: `server/src/utils/jwt.ts`

- [ ] **Step 1: Create jwt.ts**

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret';

export interface TokenPayload {
  userId: string;
  email: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_REFRESH_SECRET) as TokenPayload;
}
```

---

### Task 5: 认证路由

**Files:**
- Create: `server/src/services/auth.service.ts`
- Create: `server/src/routes/auth.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create auth.service.ts**

```typescript
import prisma from '../utils/db.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signAccessToken, signRefreshToken, TokenPayload } from '../utils/jwt.js';

export async function register(email: string, password: string, nickname?: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new Error('EMAIL_EXISTS');
  }
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
  if (!user) {
    throw new Error('INVALID_CREDENTIALS');
  }
  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new Error('INVALID_CREDENTIALS');
  }
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
  if (!user) {
    throw new Error('USER_NOT_FOUND');
  }
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
```

- [ ] **Step 2: Create routes/auth.ts**

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as authService from '../services/auth.service.js';

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

  app.get('/api/auth/me', {
    preHandler: [(request: FastifyRequest, reply: FastifyReply, done: () => void) => {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      try {
        const { verifyAccessToken } = require('../utils/jwt.js');
        (request as any).user = verifyAccessToken(authHeader.substring(7));
        done();
      } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }
    }],
  }, async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return authService.getUser(userId);
  });

  app.put('/api/auth/me', {
    preHandler: [(request: FastifyRequest, reply: FastifyReply, done: () => void) => {
      const authHeader = request.headers.authorization;
      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({ error: 'Unauthorized' });
      }
      try {
        const { verifyAccessToken } = require('../utils/jwt.js');
        (request as any).user = verifyAccessToken(authHeader.substring(7));
        done();
      } catch {
        return reply.status(401).send({ error: 'Invalid token' });
      }
    }],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { nickname, password } = request.body as any;
    return authService.updateUser(userId, { nickname, password });
  });
}
```

- [ ] **Step 3: Update app.ts to register routes**

```typescript
import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import authRoutes from './routes/auth.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});

await app.register(rateLimit, {
  max: 100,
  timeWindow: '1 minute',
});

app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

await app.register(authRoutes);

const port = parseInt(process.env.PORT || '3001', 10);
await app.listen({ port, host: '0.0.0.0' });
```

---

### Task 6: AI API 代理路由

**Files:**
- Create: `server/src/routes/proxy.ts`

- [ ] **Step 1: Create routes/proxy.ts**

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  try {
    const { verifyAccessToken } = await import('../utils/jwt.js');
    (request as any).user = verifyAccessToken(authHeader.substring(7));
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export default async function proxyRoutes(app: FastifyInstance) {
  app.post('/api/proxy/chat', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const apiKey = process.env.AI_CHAT_API_KEY || body.apiKey;
    const baseUrl = process.env.AI_CHAT_BASE_URL || 'https://api.deepseek.com';

    if (!apiKey) {
      return reply.status(400).send({ error: 'AI API key not configured on server. Provide in request or set AI_CHAT_API_KEY env.' });
    }

    const isStream = body.stream !== false;

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: body.model,
          messages: body.messages,
          stream: isStream,
          temperature: body.temperature ?? 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        return reply.status(response.status).send({ error: `AI API error: ${errText}` });
      }

      if (isStream) {
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          reply.raw.write(decoder.decode(value));
        }
        reply.raw.end();
      } else {
        const data = await response.json();
        return data;
      }
    } catch (e: any) {
      return reply.status(502).send({ error: e.message || 'Proxy error' });
    }
  });

  app.post('/api/proxy/vision', {
    preHandler: [authenticate],
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    const body = request.body as any;
    const apiKey = process.env.AI_VISION_API_KEY || body.apiKey;
    const baseUrl = process.env.AI_VISION_BASE_URL || 'https://api.openai.com';

    if (!apiKey) {
      return reply.status(400).send({ error: 'Vision API key not configured on server' });
    }

    try {
      const response = await fetch(`${baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return reply.status(response.status).send(data);
    } catch (e: any) {
      return reply.status(502).send({ error: e.message || 'Proxy error' });
    }
  });
}
```

- [ ] **Step 2: Update app.ts to register proxy routes**

Add: `import proxyRoutes from './routes/proxy.js';` and `await app.register(proxyRoutes);`

---

### Task 7: 数据同步路由

**Files:**
- Create: `server/src/services/sync.service.ts`
- Create: `server/src/routes/sync.ts`
- Modify: `server/src/app.ts`

- [ ] **Step 1: Create sync.service.ts**

```typescript
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
  return prisma.chatSession.create({ data: { ...payload, id: undefined } });
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
  return prisma.oCRResult.create({ data: { userId, ...data } });
}

export async function deleteOCRResult(userId: string, id: string) {
  const ocr = await prisma.oCRResult.findFirst({ where: { id, userId } });
  if (!ocr) throw new Error('NOT_FOUND');
  return prisma.oCRResult.delete({ where: { id } });
}
```

- [ ] **Step 2: Create routes/sync.ts**

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import * as syncService from '../services/sync.service.js';

async function authenticate(request: FastifyRequest, reply: FastifyReply) {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return reply.status(401).send({ error: 'Unauthorized' });
  }
  try {
    const { verifyAccessToken } = await import('../utils/jwt.js');
    (request as any).user = verifyAccessToken(authHeader.substring(7));
  } catch {
    return reply.status(401).send({ error: 'Invalid token' });
  }
}

export default async function syncRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate);

  // Sessions
  app.get('/api/sync/sessions', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.getSessions(userId);
  });

  app.get('/api/sync/sessions/:id', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    return syncService.getSession(userId, id);
  });

  app.post('/api/sync/sessions', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.upsertSession(userId, request.body as any);
  });

  app.put('/api/sync/sessions/:id', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    return syncService.upsertSession(userId, { id, ...(request.body as any) });
  });

  app.delete('/api/sync/sessions/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    await syncService.deleteSession(userId, id);
    return reply.status(204).send();
  });

  // Favorites
  app.get('/api/sync/favorites', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.getFavorites(userId);
  });

  app.post('/api/sync/favorites', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.addFavorite(userId, request.body as any);
  });

  app.delete('/api/sync/favorites/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    await syncService.deleteFavorite(userId, id);
    return reply.status(204).send();
  });

  // OCR Results
  app.get('/api/sync/ocr-results', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.getOCRResults(userId);
  });

  app.post('/api/sync/ocr-results', async (request: FastifyRequest) => {
    const { userId } = (request as any).user;
    return syncService.createOCRResult(userId, request.body as any);
  });

  app.delete('/api/sync/ocr-results/:id', async (request: FastifyRequest, reply: FastifyReply) => {
    const { userId } = (request as any).user;
    const { id } = request.params as any;
    await syncService.deleteOCRResult(userId, id);
    return reply.status(204).send();
  });
}
```

- [ ] **Step 3: Update app.ts**

Add: `import syncRoutes from './routes/sync.js';` and `await app.register(syncRoutes);`

---

### Task 8: 前端 API 客户端

**Files:**
- Create: `src/services/api.ts`

See plan for implementation — full API client class with auto-refresh token logic.

---

### Task 9: 前端认证 Pinia Store

**Files:**
- Create: `src/stores/auth.ts`

Pinia store wrapping the API client with user state management.

---

### Task 10: 前端登录/注册页面

**Files:**
- Create: `src/views/LoginView.vue`
- Create: `src/views/RegisterView.vue`
- Modify: `src/router/index.ts`
- Modify: `src/App.vue`

Simple Vue 3 + Tailwind auth pages.

---

### Task 11: Docker 部署配置

**Files:**
- Create: `server/Dockerfile`
- Create: `docker-compose.yml`

Standard Node.js Dockerfile and docker-compose with SQLite volume.

---

### Task 12: 验证与健康检查

Full curl-based API smoke tests.
