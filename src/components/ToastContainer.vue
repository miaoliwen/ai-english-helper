<template>
  <Transition name="scale">
    <div v-if="toast"
         class="fixed left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-lg text-sm font-medium top-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] lg:top-[max(5.5rem,calc(env(safe-area-inset-top,0px)+1rem))]"
         :class="toast.type === 'success' ? 'bg-neutral-900 text-white' : 'bg-red-600 text-white'">
      {{ toast.message }}
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { useToast } from '@/composables/useToast'

const { toast } = useToast()
</script>
