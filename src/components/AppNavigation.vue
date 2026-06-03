<template>
  <nav class="fixed top-4 left-4 right-4 z-50">
    <div class="max-w-7xl mx-auto">
      <div class="liquid-glass rounded-3xl px-5 py-3">
        <div class="flex items-center justify-between">
          <router-link to="/" class="flex items-center gap-2.5 group">
            <div class="w-8 h-8 bg-gradient-to-br from-accent-500 to-accent-600 rounded-xl flex items-center justify-center shadow-glow transition-transform duration-300 group-hover:scale-105">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <span class="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100">AIEH</span>
          </router-link>

          <div class="hidden md:flex items-center gap-1">
            <router-link
              v-for="item in navItems"
              :key="item.path"
              :to="item.path"
              class="px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300"
              :class="$route.path === item.path ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400' : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800'"
            >
              {{ item.name }}
            </router-link>

            <button
              @click="toggleTheme"
              class="ml-1 p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
              <svg v-if="isDark" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
              </svg>
              <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
              </svg>
            </button>
          </div>

          <div class="flex items-center gap-2 md:hidden">
            <button
              @click="toggleTheme"
              class="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-neutral-800 transition-all duration-300"
              :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
            >
              <svg v-if="isDark" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
              </svg>
              <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
              </svg>
            </button>
            <button
              @click="isMobileMenuOpen = !isMobileMenuOpen"
              class="p-2 rounded-xl text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800 transition-colors"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path v-if="!isMobileMenuOpen" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
                <path v-else stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <transition name="slide-up">
      <div v-if="isMobileMenuOpen" class="md:hidden mt-2 max-w-7xl mx-auto">
        <div class="liquid-glass rounded-3xl p-2">
          <router-link
            v-for="item in navItems"
            :key="item.path"
            :to="item.path"
            @click="isMobileMenuOpen = false"
            class="block px-4 py-3 rounded-2xl text-sm font-medium transition-all"
            :class="$route.path === item.path ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400' : 'text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800'"
          >
            {{ item.name }}
          </router-link>
        </div>
      </div>
    </transition>
  </nav>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTheme } from '@/composables/useTheme'

const isMobileMenuOpen = ref(false)
const { isDark, toggleTheme } = useTheme()

const navItems = [
  { name: '首页', path: '/' },
  { name: '上传识别', path: '/upload' },
  { name: 'AI解析', path: '/chat' },
  { name: '收藏夹', path: '/favorites' },
]
</script>
