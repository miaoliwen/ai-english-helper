<!-- src/components/settings/ModelConfig.vue -->
<template>
  <div class="space-y-6">
    <!-- 模式切换 -->
    <div>
      <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-2">
        配置模式
      </label>
      <div class="flex gap-2">
        <button
          class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="mode === 'custom' 
            ? 'bg-accent-600 text-white' 
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
          @click="setMode('custom')"
        >
          自定义配置
        </button>
        <button
          class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
          :class="mode === 'server' 
            ? 'bg-accent-600 text-white' 
            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700'"
          @click="setMode('server')"
        >
          服务端模式
        </button>
      </div>
    </div>

    <!-- 根据模式显示不同内容 -->
    <CustomModePanel
      v-if="mode === 'custom'"
      :model-type="modelType"
    />
    <ServerModePanel v-else />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { ModelType } from '@/types/config'
import CustomModePanel from './CustomModePanel.vue'
import ServerModePanel from './ServerModePanel.vue'

defineProps<{
  modelType: ModelType
}>()

const store = useConfigStore()

const mode = computed(() => store.mode)

function setMode(newMode: 'custom' | 'server') {
  store.setMode(newMode)
}
</script>