import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import authRoutes from './routes/auth.js';
import proxyRoutes from './routes/proxy.js';
import syncRoutes from './routes/sync.js';
import adminRoutes from './routes/admin.js';
import modelsRoutes from './routes/models.js';

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: true,
});

app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
}));

await app.register(authRoutes);
await app.register(proxyRoutes);
await app.register(syncRoutes);
await app.register(adminRoutes);
await app.register(modelsRoutes);

const port = parseInt(process.env.PORT || '3001', 10);
await app.listen({ port, host: '0.0.0.0' });
