import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import App from './App.vue'
import { useAuthStore } from '@/stores/auth'
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
const pinia = createPinia()
app.use(pinia)
app.use(router)

// 初始化认证状态（检查本地 refresh token）
const auth = useAuthStore()
auth.init()

app.mount('#app')