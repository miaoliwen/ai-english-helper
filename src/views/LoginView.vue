<template>
  <div class="page-shell pb-24">
    <div class="max-w-md mx-auto pt-16 md:pt-24">
      <h1 class="text-3xl font-bold tracking-tight text-center">登录</h1>
      <p class="text-neutral-500 dark:text-neutral-400 text-center mt-2 text-sm">
        登录后可将数据同步到云端
      </p>

      <form class="mt-8 space-y-4" @submit.prevent="handleLogin">
        <div>
          <label class="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">邮箱</label>
          <input
            v-model="email"
            type="email"
            required
            placeholder="your@email.com"
            class="input-field w-full"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">密码</label>
          <div class="relative">
            <input
              v-model="password"
              :type="showPassword ? 'text' : 'password'"
              required
              minlength="6"
              placeholder="至少 6 位"
              class="input-field w-full pr-12"
            >
            <button
              type="button"
              class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
              @click="showPassword = !showPassword"
            >
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                <line x1="1" y1="1" x2="23" y2="23"/>
              </svg>
            </button>
          </div>
        </div>

        <p
          v-if="error"
          class="text-red-500 text-sm"
        >{{ error }}</p>

        <button
          type="submit"
          class="btn-primary w-full"
          :disabled="auth.loading"
        >
          {{ auth.loading ? '登录中...' : '登录' }}
        </button>
      </form>

      <p class="text-center text-sm text-neutral-500 mt-6">
        还没有账号？
        <router-link
          to="/register"
          class="text-accent-600 dark:text-accent-400 hover:underline"
        >注册</router-link>
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()
const email = ref('')
const password = ref('')
const error = ref('')
const showPassword = ref(false)

async function handleLogin() {
  error.value = ''
  
  if (!email.value) {
    error.value = '请输入邮箱'
    return
  }
  
  if (!password.value) {
    error.value = '请输入密码'
    return
  }
  
  if (password.value.length < 6) {
    error.value = '密码至少需要6位'
    return
  }
  
  try {
    await auth.login(email.value, password.value)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '登录失败'
  }
}
</script>
