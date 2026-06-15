import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // 后端代码使用 node:crypto / @prisma/client 等 Node 专属模块，
    // 必须在 node 环境下运行，不能用 jsdom（默认 vite 配置继承会导致 ERR_UNKNOWN_BUILTIN_MODULE）。
    environment: 'node',
    globals: true,
    // 所有 spec 共享同一 SQLite 文件，必须串行运行避免外键冲突与数据竞争。
    fileParallelism: false,
    include: ['src/**/__tests__/*.spec.ts'],
  },
});
