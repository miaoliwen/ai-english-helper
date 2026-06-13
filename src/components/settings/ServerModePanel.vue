<!-- src/components/settings/ServerModePanel.vue -->
<template>
  <div class="p-5 space-y-6">
    <div class="rounded-xl bg-accent-50 dark:bg-accent-900/20 p-4">
      <div class="flex items-start gap-3">
        <svg
          class="w-5 h-5 text-accent-600 dark:text-accent-400 mt-0.5 shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          stroke-width="2"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <div>
          <p class="text-sm font-medium text-accent-800 dark:text-accent-200">
            服务端模式
          </p>
          <p class="text-xs text-accent-600 dark:text-accent-400 mt-1">
            所有请求将通过服务器代理处理，无需配置API Key
          </p>
        </div>
      </div>
    </div>

    <!-- 对话模型 -->
    <div>
      <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        对话模型
      </h4>
      <div
        v-if="chatModel"
        class="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
            <svg
              class="w-5 h-5 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {{ chatModel.name }}
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              {{ chatModel.modelId }}
            </p>
          </div>
          <span
            class="text-xs font-semibold px-2 py-1 rounded-full"
            :class="chatModel.available 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'"
          >
            {{ chatModel.available ? '可用' : '不可用' }}
          </span>
        </div>
      </div>
      <div v-else class="text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
        暂无可用的对话模型
      </div>
    </div>

    <!-- 视觉模型 -->
    <div>
      <h4 class="text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-3">
        视觉模型
      </h4>
      <div
        v-if="visionModel"
        class="border border-neutral-200 dark:border-neutral-700 rounded-xl p-4"
      >
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
            <svg
              class="w-5 h-5 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
              />
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm font-medium text-neutral-800 dark:text-neutral-200">
              {{ visionModel.name }}
            </p>
            <p class="text-xs text-neutral-500 dark:text-neutral-400 font-mono mt-0.5">
              {{ visionModel.modelId }}
            </p>
          </div>
          <span
            class="text-xs font-semibold px-2 py-1 rounded-full"
            :class="visionModel.available 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'"
          >
            {{ visionModel.available ? '可用' : '不可用' }}
          </span>
        </div>
      </div>
      <div v-else class="text-sm text-neutral-400 dark:text-neutral-500 py-4 text-center">
        暂无可用的视觉模型
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'

const store = useConfigStore()

const chatModel = computed(() => {
  return store.serverModels.find(m => 
    m.modelId === 'deepseek-chat' && m.available
  ) || store.serverModels[0]
})

const visionModel = computed(() => {
  return store.serverModels.find(m => 
    m.modelId === 'gpt-4o' && m.available
  ) || store.serverModels.find(m => m.modelId !== 'deepseek-chat')
})
</script>