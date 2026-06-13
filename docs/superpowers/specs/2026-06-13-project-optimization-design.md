# AI 英语解题助手 — 三阶段优化设计

## 概述

对现有 AI 英语解题助手项目进行系统化优化，覆盖代码质量、测试覆盖、性能构建三个维度。
采用分阶段顺序执行策略，每阶段独立设计 → 实施 → 验证。

---

## Phase 1: 代码质量 + TypeScript 严格化

### 目标

在现有 `strict: true` 基础上进一步提升类型安全性，消除 `any` 类型，拆分大文件，修复 ESLint。

### 1.1 TypeScript 严格度增强

在 `tsconfig.json` 的 `compilerOptions` 中追加：

- `noUncheckedIndexedAccess: true` — 禁止未检查的索引访问，防止潜在的 `undefined` 运行时错误
- `noImplicitReturns: true` — 所有函数路径必须显式返回值
- `forceConsistentCasingInFileNames: true` — 文件引用大小写一致性检查
- `exactOptionalPropertyTypes: true` — 可选属性语义严格化

**修复策略**：逐文件修复，运行 `vue-tsc --noEmit` 验证直至零错误。

### 1.2 消除 `any` 类型

当前 5 处 `any` 使用，目标归零：

| 位置 | 当前 | 修复方案 |
|---|---|---|
| `src/services/config.ts:40` | `(...args: any[]) => any` | 保留泛型签名，用 `unknown` 替代内部 `any` |
| `src/services/config.ts:45` | `(value: any)` | 用 `unknown` + 类型断言 |
| `src/services/config.ts:46` | `(reason?: any)` | 同上 |
| `src/services/config.ts:49` | `function (this: any` | 用 `ThisParameterType` 提取 |
| `src/stores/app.ts:164` | `raw: any` | 用 `unknown` + 运行时类型守卫 |

### 1.3 大文件拆分

#### SettingsModal.vue (19.2KB)

提取以下独立单元：

- `src/components/settings/PresetForm.vue` — 单条预设编辑表单
- `src/components/settings/PresetList.vue` — 预设列表展示
- `src/components/settings/ProviderSelect.vue` — API 提供商选择器
- `src/composables/usePresets.ts` — 预设 CRUD 逻辑

#### stores/app.ts (15.5KB)

- 按领域拆分为独立 store：
  - `src/stores/model.ts` — 模型预设状态 (ModelPresets)
  - `src/stores/chat.ts` — 聊天会话状态 (ChatState)
  - `src/stores/favorites.ts` — 收藏管理 (FavoritesState)
- 保留 `src/stores/app.ts` 作为聚合入口，从子 store 重新导出

#### UploadView.vue (13.7KB)

- `src/composables/useCamera.ts` — 相机拍照逻辑
- `src/composables/useImageUpload.ts` — 图片选择和上传逻辑
- `src/composables/useOCR.ts` — OCR 识别逻辑（当前在 UploadView 内联）

### 1.4 ESLint 修复

- 安装 `eslint`、`@vue/eslint-config-typescript`、`eslint-plugin-vue`
- 创建 `eslint.config.js` (扁平配置) 或 `.eslintrc.json`
- 继承 Vue 3 推荐规则 + TypeScript 规则
- 运行 `eslint --fix` 修复现有问题

### 验收标准

- `vue-tsc --noEmit` 零错误
- `eslint` 零 warning/error
- 零 `any` 类型
- No chunk > 20KB 的源文件

---

## Phase 2: 测试覆盖 (TDD)

### 目标

建立测试基础设施，为核心模块添加单元测试和集成测试，确保代码可测性。

### 2.1 测试基础设施

- 安装 `vitest` + `@vue/test-utils` + `jsdom`
- 创建 `vitest.config.ts`
- 配置 `package.json` 的 `test` 和 `test:coverage` 脚本
- 测试文件约定：`src/**/__tests__/*.spec.ts`

### 2.2 测试优先级

按业务价值和稳定性排序：

#### P0 — 工具函数和 composables (高价值 + 无 UI 依赖)

| 模块 | 测试内容 |
|---|---|
| `src/utils/crypto.ts` | AES-GCM 加密/解密往返验证、设备密钥派生 |
| `src/utils/sanitize.ts` | Prompt 注入过滤、边界 token 检测 |
| `src/utils/uuid.ts` | UUID 格式和唯一性 |
| `src/services/prompts.ts` | Prompt 模板生成是否正确 |
| `src/services/config.ts` | 消息长度校验、debounce 行为 |

#### P1 — 核心业务逻辑

| 模块 | 测试内容 |
|---|---|
| `src/composables/useTheme.ts` | 主题切换、系统偏好跟随 |
| `src/composables/useToast.ts` | Toast 队列和自动消失 |
| `src/composables/useChatActions.ts` | 发送/重新生成/收藏流程（mock API） |
| `src/composables/useStreamHandler.ts` | SSE 流式解析、超时和重试 |

#### P2 — Store (Pinia)

- `src/stores/chat.ts` — 消息增删、会话切换、流式状态管理
- `src/stores/model.ts` — 预设 CRUD、加密存储校验
- `src/stores/favorites.ts` — 收藏增删、搜索过滤

#### P3 — Vue 组件 (可选，根据时间)

- ChatMessageBubble、ChatInput、MarkdownRenderer 等核心组件
- 使用 `@vue/test-utils` 进行挂载和交互测试

### 2.3 TDD 流程

每个模块严格遵循：红（写失败测试）→ 绿（写实现）→ 重构

### 验收标准

- `vitest run` 全部通过
- 覆盖率 >70%（语句/分支/函数/行）
- 核心工具函数 100% 覆盖

---

## Phase 3: 性能与构建优化

### 目标

减小构建体积、优化加载性能、提升运行时体验。

### 3.1 构建体积优化

#### 图片优化 (最高 ROI)

- `public/logo.png` (1.22MB) → 使用 `sharp` 或在线工具压缩至 <100KB
- 考虑转化为 WebP/AVIF 格式

#### JS 代码分割

- 对以下模块使用动态 `import()`：
  - `markdown-it` + `katex` + `prismjs` (Markdown 渲染，仅在进入 ChatView 时加载)
  - `file-saver` (仅在导出时加载)
- 使用 `manualChunks` 将 vendor 分离

#### Vite 配置优化

- 启用 `build.cssMinify: 'esbuild'` (Vite 5 默认已启用)
- 配置 `rollupOptions.output.manualChunks`
- 启用 `build.reportCompressedSize: true`

### 3.2 运行时性能

#### 虚拟滚动 (Virtual Scrolling)

- 聊天消息列表在历史消息 >50 条时启用虚拟滚动
- 使用 `vue-virtual-scroller` 或自行实现 IntersectionObserver 方案

#### 组件懒加载

- Vue Router 路由级懒加载：
  - `ChatView`、`UploadView`、`FavoritesView` 按需加载
  - `SettingsModal` 按需加载

#### 缓存策略

- 利用 IndexedDB 缓存 AI 响应
- 避免重复 OCR 识别同一图片

### 3.3 构建监控

- 在 CI 中集成 `vite-bundle-analyzer` 或 `rollup-plugin-visualizer`
- 设置构建大小阈值告警

### 验收标准

- JS 总大小（gzip）< 180KB（构建后）
- Lighthouse Performance > 85
- logo.png < 100KB
- 路由级代码分割生效

---

## 风险与缓解

| 风险 | 缓解方案 |
|---|---|
| 拆分 store 导致引入循环依赖 | 提前设计接口边界，使用 TypeScript 检测循环引用 |
| TDD 增加 Phase 2 耗时 | P0 模块必须 TDD，P2/P3 可选 |
| 构建优化后功能异常 | 每个优化步骤后运行 `npm run build` 验证 |
| ESLint 配置与现有代码冲突 | 使用 `--fix` 自动修复，剩余手动调整 |
| Store 拆分后状态一致性 | 使用 Pinia 的 `$dispose` 和 `useStore` 懒加载模式 |

---

## 时间估算

| 阶段 | 估算工作量 |
|---|---|
| Phase 1: 代码质量 + TS | 2-3 个实现会话 |
| Phase 2: 测试覆盖 | 3-5 个实现会话 |
| Phase 3: 性能构建 | 1-2 个实现会话 |
