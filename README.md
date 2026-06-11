# AI 英语解题助手（AIEH）

上传英语题目图片，AI 自动 OCR 识别并对话解析。数据保存在本机浏览器，支持 PWA 与移动端沉浸式聊天体验。

## 功能特性

- **图片识别**：上传或拍照识别英语题目，输出 Markdown 结构化文本
- **AI 对话解题**：基于识别结果或直接提问，流式获取详细解答
- **多套模型预设**：对话模型与视觉模型独立配置，可快速切换
- **本地存储**：识别记录、对话历史、收藏夹均保存在 IndexedDB
- **加密配置**：API Key 经 AES-GCM 加密后写入 `localStorage`，不上传服务器
- **导出与收藏**：支持导出 Markdown，收藏重要解析结果
- **移动端优化**：ChatGPT 风格全屏聊天、侧栏历史、阅读排版优化
- **深色模式**：跟随系统或手动切换

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + TypeScript + Vite 5 |
| 状态 | Pinia |
| 路由 | Vue Router 4 |
| 样式 | Tailwind CSS 3 |
| 本地数据库 | Dexie（IndexedDB） |
| Markdown | markdown-it + KaTeX + Prism.js |
| 移动端 | PWA（可添加到主屏幕）|
| 部署 | Vercel / GitHub Pages |

## 快速开始

### 环境要求

- Node.js 18+
- npm 9+

### 安装与运行

```bash
# 克隆项目
git clone <your-repo-url>
cd ai-english-helper

# 安装依赖
npm install

# 启动开发服务器（默认 http://localhost:3000）
npm run dev
```

### 构建与预览

```bash
npm run build
npm run preview
```

## 配置 API Key

应用兼容任意 **OpenAI API 格式** 的服务（DeepSeek、OpenAI、自建代理等）。

### 推荐方式：页面设置

1. 打开应用，点击右上角 **齿轮图标**
2. 在 **对话模型** / **视觉模型** 标签下分别填写：
   - **预设昵称**（可选）
   - **模型 ID**（如 `deepseek-chat`、`gpt-4o`）
   - **Base URL**（如 `https://api.deepseek.com`）
   - **API Key**
3. 点击 **测试当前预设** 验证连接
4. 填写后自动保存到本设备，刷新页面仍有效

### 环境变量（可选）

复制 `.env.example` 为 `.env`，仅用于设置表单**默认值**：

```bash
cp .env.example .env
```

```env
# 仅作初始展示，不要写入真实 API Key
VITE_DEFAULT_CHAT_BASE_URL=https://api.deepseek.com
VITE_DEFAULT_CHAT_MODEL=deepseek-chat
VITE_DEFAULT_VISION_BASE_URL=https://api.openai.com
VITE_DEFAULT_VISION_MODEL=gpt-4o-mini
```

> **安全提示**：`VITE_*` 变量会打包进前端代码，**切勿**在其中写入真实密钥。生产环境建议使用 Serverless 代理，将密钥保存在服务端。

## 使用流程

```
上传题目图片 → OCR 识别 → 跳转 AI 解析 → 追问 / 收藏 / 导出
                    ↘
              直接提问（无需上传）
```

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `/` | 最近记录、API 配置引导 |
| 上传识别 | `/upload` | 图片上传与 OCR |
| AI 解析 | `/chat` | 对话解题（支持 `/chat/:id`） |
| 收藏夹 | `/favorites` | 搜索与管理收藏 |

## 项目结构

```
├── public/              # 静态资源、PWA manifest
├── src/
│   ├── components/      # 通用组件（导航、设置弹窗、Markdown 渲染等）
│   ├── composables/     # 组合式函数（主题、滚动锁等）
│   ├── db/              # IndexedDB 数据层
│   ├── router/          # 路由配置
│   ├── services/        # API 调用、配置解析、Prompt
│   ├── stores/          # Pinia 状态
│   ├── types/           # TypeScript 类型
│   ├── utils/           # 加密、Markdown、诊断工具
│   └── views/           # 页面视图
├── vite.config.ts
└── vercel.json          # Vercel 部署与安全头
```

## 部署

### Vercel

1. 导入 Git 仓库
2. 构建命令：`npm run build`
3. 输出目录：`dist`
4. 已配置 SPA 路由重写与安全响应头

### GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`，推送到 `master` 分支自动部署。

子路径部署时需指定 `BASE_URL`：

```bash
BASE_URL=/ai-english-helper/ npm run build
```

> **SPA 深链说明**：GitHub Pages 不支持 `vercel.json` 的 `rewrites`，本项目通过
> `public/404.html` + `src/main.ts` 入口的 `sessionStorage` 桥接实现 SPA fallback：
> 1. 访问深链时 GitHub Pages 返回 `404.html`
> 2. 脚本把原始路径暂存到 `sessionStorage` 后跳回 `index.html`
> 3. `main.ts` 在路由初始化前 `history.replaceState` 恢复路径，交给 Vue Router 处理

## 移动端 / PWA

- 支持添加到主屏幕（`manifest.json`）
- 聊天页在移动端自动隐藏顶栏，全屏沉浸式体验

## 隐私与安全

- OCR 图片、对话记录仅存于本机 IndexedDB
- API Key 使用 AES-GCM 加密存储，设备密钥保存在 `localStorage`
- 上传图片时自动剥离 EXIF 元数据（GPS、设备信息等）
- 用户输入经 sanitize 处理，降低 Prompt 注入风险
- API 请求强制 HTTPS（`localhost` 除外）

## 开发脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 类型检查 + 生产构建 |
| `npm run preview` | 预览构建产物 |
| `npm run lint` | ESLint 检查并修复 |

## 常见问题

**Q: 刷新后 API Key 丢失？**  
A: 请通过页面设置重新填写。密钥加密依赖本设备存储，清除浏览器数据后需重新配置。

**Q: 识别或对话报错 401？**  
A: 检查 API Key 是否有效、Base URL 是否正确、模型 ID 是否存在。

**Q: 支持哪些 API 服务？**  
A: 任何兼容 OpenAI Chat Completions 格式的服务均可，视觉识别需支持图片输入的多模态接口。

## License

Private — 仅供个人学习使用。
