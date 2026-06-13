# Phase 3: 性能与构建优化 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reduce build size, optimize loading performance, and improve runtime experience.

**Architecture:** Route-level code splitting lazily loads heavy views; heavy libraries (markdown-it, katex, dompurify) are deferred via route splitting; vendor chunk separates Vue/Vue Router/Pinia from app code; logo compressed to <50KB; file-saver dynamically imported on click; dead dependency (prismjs) removed.

**Tech Stack:** Vite 5, Vue 3, TypeScript

**Design doc:** `docs/superpowers/specs/2026-06-13-project-optimization-design.md`

---

### Task 1: Logo Optimization

**Files:**
- Modify: `public/logo.png` (replace with compressed version)
- Remove: `logo.png` (project root copy)

Current logo is 1.22MB PNG. Replace with a compressed version <50KB.

- [ ] **Step 1: Generate compressed logo**

Use sharp to resize and compress the logo to 32x32 (matching the nav bar usage) or a reasonable max dimension:

```bash
npm install -D sharp
```

```typescript
// tmp-resize.mjs
import sharp from 'sharp'
sharp('public/logo.png')
  .resize(64, 64, { fit: 'inside' })
  .png({ compressionLevel: 9, palette: true })
  .toFile('public/logo-small.png')
  .then(() => console.log('done'))
```

Then rename `logo-small.png` → `logo.png` and check size.

- [ ] **Step 2: Remove root-level logo copy**

```bash
git rm logo.png
```

- [ ] **Step 3: Run build and verify**

```bash
npm run build
```
Expected: logo asset <50KB

---

### Task 2: Route-Level Code Splitting

**Files:**
- Modify: `src/router/index.ts`

Change all non-home route components from static imports to dynamic imports.

- [ ] **Step 1: Update router/index.ts**

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/upload',
      name: 'upload',
      component: () => import('@/views/UploadView.vue')
    },
    {
      path: '/chat/:id?',
      name: 'chat',
      component: () => import('@/views/ChatView.vue')
    },
    {
      path: '/favorites',
      name: 'favorites',
      component: () => import('@/views/FavoritesView.vue')
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue')
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
```

- [ ] **Step 2: Verify build**

```bash
npm run build
```
Expected: separate chunk files generated for each lazy route (check dist folder for multiple .js files)

---

### Task 3: Dynamic Import for file-saver

**Files:**
- Modify: `src/components/ExportPanel.vue`
- Modify: `src/views/FavoritesView.vue`

Change `import FileSaver from 'file-saver'` to dynamic import inside the click handler.

- [ ] **Step 1: Update ExportPanel.vue**

```typescript
function exportMarkdown() {
  import('file-saver').then(({ default: FileSaver }) => {
    const blob = new Blob([props.content], { type: 'text/markdown;charset=utf-8' })
    FileSaver.saveAs(blob, `${props.title || 'export'}.md`)
  })
}
```

Remove the static import line `import FileSaver from 'file-saver'`.

- [ ] **Step 2: Update FavoritesView.vue**

Find the export function and replace similarly. Remove the static `import FileSaver from 'file-saver'` at top of script.

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: file-saver no longer in initial vendor chunk (check chunks)

---

### Task 4: Vite Config Optimization

**Files:**
- Modify: `vite.config.ts`

Add manualChunks for vendor separation to split Vue/Pinia/Vue Router into a stable vendor chunk, and add rollup-plugin-visualizer for bundle analysis.

- [ ] **Step 1: Install rollup-plugin-visualizer**

```bash
npm install -D rollup-plugin-visualizer
```

- [ ] **Step 2: Update vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  base: process.env.BASE_URL || '/',
  plugins: [
    vue(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    })
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
        }
      }
    },
    chunkSizeWarningLimit: 300,
  },
  server: {
    port: 3000,
    open: true
  }
})
```

- [ ] **Step 3: Run build and check stats**

```bash
npm run build
```
Open `dist/stats.html` to verify chunk sizes.

Expected: vendor chunk <200KB gzip, app code properly split

---

### Task 5: Remove Dead Dependency (prismjs)

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Remove prismjs from dependencies**

In package.json, remove `"prismjs"` and `"@types/prismjs"` from dependencies.

- [ ] **Step 2: Uninstall**

```bash
npm uninstall prismjs @types/prismjs
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```
Expected: no errors (prismjs was unused)

---

### Task 6: Final Verification

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: 139/139 pass

- [ ] **Step 2: Run lint**

```bash
npm run lint
```
Expected: 0 errors, acceptable warnings

- [ ] **Step 3: Run build**

```bash
npm run build
```
Expected: exit 0

- [ ] **Step 4: Check build output sizes**

```bash
Get-ChildItem -Recurse dist/assets/*.js | Select-Object Name, @{N="SizeKB";E={[math]::Round($_.Length/1KB,1)}}
```
Expected: vendor chunk properly split, lazy-loaded chunks present, logo <100KB
