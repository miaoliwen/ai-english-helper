<template>
  <div class="relative min-h-[100vh] min-h-[100dvh] bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
    <div class="app-grain" aria-hidden="true"></div>
    <AppNavigation />
    <main :class="isChatRoute ? 'max-lg:pt-0 pt-nav' : 'pt-nav'">
      <router-view v-slot="{ Component, route }">
        <keep-alive>
          <component :is="Component" :key="route.path" />
        </keep-alive>
      </router-view>
    </main>
    <ToastContainer />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppNavigation from './components/AppNavigation.vue'
import ToastContainer from './components/ToastContainer.vue'
import { useTheme } from './composables/useTheme'

useTheme()

const route = useRoute()
const isChatRoute = computed(() => route.path.startsWith('/chat'))
</script>