<template>
  <div class="min-h-[100dvh] bg-neutral-50 dark:bg-neutral-950 transition-colors duration-300">
    <AppNavigation />
    <main class="pt-20">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup lang="ts">
import AppNavigation from './components/AppNavigation.vue'
import { useTheme } from './composables/useTheme'

useTheme()
</script>