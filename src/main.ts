import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import './style.css'

// GitHub Pages SPA fallback: 恢复 404.html 暂存的原始路径,
// 必须在 router 初始化之前, 否则 Vue Router 会读到错误的 URL。
try {
  const ghPath = sessionStorage.getItem('gh-404-path')
  if (ghPath) {
    sessionStorage.removeItem('gh-404-path')
    history.replaceState(null, '', ghPath)
  }
} catch { /* sessionStorage 不可用时跳过 */ }

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.mount('#app')