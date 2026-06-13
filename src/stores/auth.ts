import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../services/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<{ id: string; email: string; nickname?: string } | null>(null)
  const loading = ref(false)

  const isLoggedIn = computed(() => !!user.value)

  async function init() {
    api.loadStoredRefreshToken()
    if (api.isLoggedIn) {
      try {
        user.value = await api.getMe()
      } catch {
        api.clearTokens()
      }
    }
  }

  async function register(email: string, password: string, nickname?: string) {
    loading.value = true
    try {
      user.value = await api.register(email, password, nickname)
    } finally {
      loading.value = false
    }
  }

  async function login(email: string, password: string) {
    loading.value = true
    try {
      user.value = await api.login(email, password)
    } finally {
      loading.value = false
    }
  }

  function logout() {
    api.logout()
    user.value = null
  }

  return { user, loading, isLoggedIn, init, register, login, logout }
})
