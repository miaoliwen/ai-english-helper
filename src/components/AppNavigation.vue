<template>
  <nav class="fixed top-safe inset-x-safe z-50">
    <div class="max-w-7xl mx-auto">
      <div class="liquid-glass px-5 py-2.5">
        <div class="flex items-center justify-between">
          <router-link
            to="/"
            class="flex items-center gap-2.5 group"
          >
            <div class="w-8 h-8 rounded-full overflow-hidden transition-transform duration-300 group-hover:scale-105">
              <img
                src="/logo.png"
                alt="Logo"
                class="w-full h-full object-cover"
              >
            </div>
          </router-link>

          <div class="hidden md:flex items-center gap-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-4 py-2 rounded-pill text-sm font-medium tracking-tight-body transition-all duration-300"
              :class="isActiveRoute(item.path)
                ? 'bg-black text-white dark:bg-white dark:text-black'
                : 'text-neutral-500 hover:text-black hover:bg-black/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10'"
            >
              {{ item.name }}
            </router-link>

            <button
              class="ml-1 w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-black/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-300"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
              :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
              @click="toggleTheme"
            >
              <svg
                v-if="isDark"
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
              <svg
                v-else
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
            </button>

            <router-link
              v-if="!auth.isLoggedIn"
              to="/login"
              class="px-3 py-1.5 rounded-pill text-sm font-medium text-neutral-500 hover:text-black hover:bg-black/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-300"
            >登录</router-link>

            <div
              v-else
              class="relative"
            >
              <button
                class="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-black/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-300"
                :title="auth.user?.email"
                @click="showUserMenu = !showUserMenu"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </button>
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-48 liquid-glass p-2 rounded-xl shadow-lg z-50"
                @click="showUserMenu = false"
              >
                <p class="px-3 py-1.5 text-xs text-neutral-500 truncate">{{ auth.user?.email }}</p>
                <hr class="my-1 border-neutral-200 dark:border-neutral-700">
                <button
                  class="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  @click="auth.logout(); showUserMenu = false"
                >退出登录</button>
              </div>
            </div>

            <button
              class="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-black/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-300"
              title="模型设置"
              aria-label="模型设置"
              @click="store.openSettings()"
            >
              <svg
                class="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87l.22.127c.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992v.255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124l-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87l-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992v-.255c-.007.378-.138.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124l.22-.128c.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-2 md:hidden">
            <button
              class="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-black/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-all duration-300"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
              :aria-label="isDark ? '切换到浅色模式' : '切换到深色模式'"
              @click="toggleTheme"
            >
              <svg
                v-if="isDark"
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                />
              </svg>
              <svg
                v-else
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                />
              </svg>
            </button>
            <button
              class="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10 transition-colors"
              :aria-label="isMobileMenuOpen ? '关闭菜单' : '打开菜单'"
              :aria-expanded="isMobileMenuOpen"
              @click="isMobileMenuOpen = !isMobileMenuOpen"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  v-if="!isMobileMenuOpen"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M4 6h16M4 12h16M4 18h16"
                />
                <path
                  v-else
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <button
              class="w-9 h-9 flex items-center justify-center rounded-full text-neutral-500 hover:text-black hover:bg-black/5 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
              title="模型设置"
              aria-label="模型设置"
              @click="store.openSettings()"
            >
              <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87l.22.127c.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992v.255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124l-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87l-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992v-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124l.22-.128c.332-.183.582-.495.644-.869l.214-1.281z"
                />
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="slide-up">
      <div
        v-if="isMobileMenuOpen"
        class="md:hidden mt-2 max-w-7xl mx-auto"
      >
        <div class="liquid-glass p-2">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            class="block px-4 py-3 rounded-pill text-sm font-medium tracking-tight-body transition-all"
            :class="isActiveRoute(item.path)
              ? 'bg-black text-white dark:bg-white dark:text-black'
              : 'text-neutral-600 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10'"
            @click="isMobileMenuOpen = false"
          >
            {{ item.name }}
          </router-link>
          <hr class="my-2 border-neutral-200 dark:border-neutral-700">
          <template v-if="auth.isLoggedIn">
            <p class="px-4 py-2 text-xs text-neutral-500 truncate">{{ auth.user?.email }}</p>
            <button
              class="w-full text-left px-4 py-3 rounded-pill text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              @click="auth.logout(); isMobileMenuOpen = false"
            >退出登录</button>
          </template>
          <template v-else>
            <router-link
              v-for="item in authItems"
              :key="item.path"
              :to="item.path"
              class="block px-4 py-3 rounded-pill text-sm font-medium text-neutral-600 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/10 transition-all"
              @click="isMobileMenuOpen = false"
            >{{ item.name }}</router-link>
          </template>
        </div>
      </div>
    </transition>
    <SettingsModal v-model:visible="store.settingsModalOpen" />
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import { useAppStore } from '@/stores/app'
import { useAuthStore } from '@/stores/auth'
import SettingsModal from '@/components/SettingsModal.vue'

const isMobileMenuOpen = ref(false)
const showUserMenu = ref(false)
const store = useAppStore()
const auth = useAuthStore()
const route = useRoute()
const { isDark, toggleTheme } = useTheme()

function isActiveRoute(path: string) {
  if (path === '/') return route.path === '/'
  return route.path === path || route.path.startsWith(path + '/')
}

const navItems = [
  { name: '首页', path: '/' },
  { name: '上传识别', path: '/upload' },
  { name: 'AI解析', path: '/chat' },
  { name: '收藏夹', path: '/favorites' },
]

const authItems = [
  { name: '登录', path: '/login' },
  { name: '注册', path: '/register' },
]
</script>
