import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import authRoutes from './routes/auth.js';
import proxyRoutes from './routes/proxy.js';
import syncRoutes from './routes/sync.js';
import adminRoutes from './routes/admin.js';
import modelsRoutes from './routes/models.js';

const app = Fastify({ logger: true });

// 容忍空 JSON body：客户端（axios/fetch 统一带 Content-Type: application/json 的 header）
// 对 DELETE / 无 body 的请求会触发默认 parser 抛 FST_ERR_CTP_EMPTY_JSON_BODY。
// 这里移除默认 JSON parser 并替换为对空 body 友好的实现。
app.removeContentTypeParser('application/json');
app.addContentTypeParser(
  'application/json',
  { parseAs: 'string' },
  (_req: any, body: any, done: (err: Error | null, body?: any) => void) => {
    // 空 body（DELETE 等无 body 请求却带了 Content-Type: application/json）当作空对象
    if (!body || !body.length) return done(null, {});
    try {
      done(null, JSON.parse(body));
    } catch (err: any) {
      // 畸形 JSON 属于客户端错误（400），而非服务端 500
      err.statusCode = 400;
      done(err, undefined);
    }
  },
);

await app.register(cors, {
  origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
  credentials: true,
});

// 全局速率限制：每 IP 每分钟 120 次（覆盖所有未单独配置的端点）
await app.register(rateLimit, {
  global: true,
  max: 120,
  timeWindow: '1 minute',
  // 仅对匿名（未登录）失败认证请求更严格由各路由自行覆盖
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
