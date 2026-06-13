<template>
  <div class="page-shell pb-24">
    <div class="max-w-md mx-auto pt-16 md:pt-24">
      <h1 class="text-3xl font-bold tracking-tight text-center">注册</h1>
      <p class="text-neutral-500 dark:text-neutral-400 text-center mt-2 text-sm">
        创建账号以启用云端同步
      </p>

      <form class="mt-8 space-y-4" @submit.prevent="handleRegister">
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
          <label class="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">昵称（可选）</label>
          <input
            v-model="nickname"
            type="text"
            placeholder="如何称呼你"
            class="input-field w-full"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">密码</label>
          <input
            v-model="password"
            type="password"
            required
            minlength="6"
            placeholder="至少 6 位"
            class="input-field w-full"
          >
        </div>
        <div>
          <label class="block text-sm font-medium mb-1.5 text-neutral-700 dark:text-neutral-300">确认密码</label>
          <input
            v-model="confirmPassword"
            type="password"
            required
            minlength="6"
            placeholder="再次输入密码"
            class="input-field w-full"
          >
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
          {{ auth.loading ? '注册中...' : '注册' }}
        </button>
      </form>

      <p class="text-center text-sm text-neutral-500 mt-6">
        已有账号？
        <router-link
          to="/login"
          class="text-accent-600 dark:text-accent-400 hover:underline"
        >登录</router-link>
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
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const error = ref('')

async function handleRegister() {
  error.value = ''
  if (password.value !== confirmPassword.value) {
    error.value = '两次密码不一致'
    return
  }
  try {
    await auth.register(email.value, password.value, nickname.value || undefined)
    router.push('/')
  } catch (e: any) {
    error.value = e.message || '注册失败'
  }
}
</script>
