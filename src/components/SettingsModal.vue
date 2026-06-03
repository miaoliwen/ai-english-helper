<template>
  <Transition name="scale">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center p-4" @click.self="close">
      <div class="absolute inset-0 bg-neutral-900/30 dark:bg-black/50 backdrop-blur-sm"></div>
      <div class="relative bg-white dark:bg-neutral-900 rounded-4xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-hidden">
        <!-- Header -->
        <div class="px-6 py-5 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-accent-50 dark:bg-accent-900/20 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.212 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.063-.374-.313-.686-.645-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-neutral-900 dark:text-neutral-100">模型设置</h3>
              <p class="text-xs text-neutral-500 dark:text-neutral-400">自定义 AI 模型配置</p>
            </div>
          </div>
          <button @click="close" class="p-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 overflow-y-auto max-h-[65vh] space-y-8">
          <!-- Chat Model Section -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-accent-50 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
                </svg>
              </div>
              <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">主力对话模型</h4>
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">模型 ID</label>
              <input v-model="form.chatModel" type="text" placeholder="例如：deepseek-chat"
                     class="input-field text-sm" />
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Base URL</label>
              <input v-model="form.chatBaseUrl" type="text" placeholder="例如：https://api.deepseek.com"
                     class="input-field text-sm" />
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">API Key</label>
              <div class="relative">
                <input v-model="form.chatApiKey" :type="showChatKey ? 'text' : 'password'" placeholder="sk-..."
                       class="input-field text-sm pr-10" />
                <button @click="showChatKey = !showChatKey" type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  <svg v-if="showChatKey" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Divider -->
          <div class="border-t border-neutral-100 dark:border-neutral-800"></div>

          <!-- Vision Model Section -->
          <div class="space-y-4">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-accent-50 dark:bg-accent-900/20 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-accent-600 dark:text-accent-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"/>
                </svg>
              </div>
              <h4 class="font-semibold text-neutral-900 dark:text-neutral-100">视觉识别模型</h4>
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">模型 ID</label>
              <input v-model="form.visionModel" type="text" placeholder="例如：mimo-v2.5"
                     class="input-field text-sm" />
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">Base URL</label>
              <input v-model="form.visionBaseUrl" type="text" placeholder="例如：https://api.mimo.ai/v2"
                     class="input-field text-sm" />
            </div>

            <div>
              <label class="block text-xs font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">API Key</label>
              <div class="relative">
                <input v-model="form.visionApiKey" :type="showVisionKey ? 'text' : 'password'" placeholder="sk-..."
                       class="input-field text-sm pr-10" />
                <button @click="showVisionKey = !showVisionKey" type="button"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300">
                  <svg v-if="showVisionKey" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
                  </svg>
                  <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <!-- Notice -->
          <div class="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/10 rounded-xl p-3.5">
            <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
            </svg>
            <div class="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
              <p class="mb-2">本应用不内置任何模型，请自行填入第三方 API 服务商的配置。支持所有兼容 OpenAI API 格式的服务商。所有配置仅保存在浏览器本地，不会上传到任何服务器。</p>
              <p class="font-semibold mb-1">配置说明：</p>
              <ul class="list-disc list-inside space-y-1">
                <li><strong>对话模型</strong>：只需填写基础 URL（如 https://api.deepseek.com），无需添加路径</li>
                <li><strong>视觉模型</strong>：需要填写完整的 API 端点 URL</li>
              </ul>
            </div>
          </div>

          <!-- Diagnostics -->
          <div class="space-y-3">
            <button @click="testDeepSeek" :disabled="testingDeepSeek"
                    class="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <svg v-if="testingDeepSeek" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              <span>{{ testingDeepSeek ? '测试中...' : '测试对话模型配置' }}</span>
            </button>

            <button @click="testMimo" :disabled="testingMimo"
                    class="btn-secondary w-full flex items-center justify-center gap-2 text-sm">
              <svg v-if="testingMimo" class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              <span>{{ testingMimo ? '测试中...' : '测试视觉模型配置' }}</span>
            </button>

            <!-- Diagnostic Results -->
            <div v-if="diagnosticResult" class="rounded-xl p-3.5"
                 :class="diagnosticResult.success ? 'bg-green-50 dark:bg-green-900/10' : 'bg-red-50 dark:bg-red-900/10'">
              <div class="flex items-start gap-2">
                <svg v-if="diagnosticResult.success" class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <svg v-else class="w-4 h-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <div class="text-xs"
                     :class="diagnosticResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'">
                  <p class="font-semibold mb-1">{{ diagnosticResult.message }}</p>
                  <p v-if="diagnosticResult.details">{{ diagnosticResult.details }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-4 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-end gap-3">
          <button @click="close" class="btn-ghost text-sm">取消</button>
          <button @click="save" class="btn-primary text-sm">保存设置</button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { useAppStore } from '@/stores/app'
import { diagnoseDeepSeekConfig, diagnoseMimoConfig } from '@/utils/diagnostics'
import type { ModelSettings } from '@/types'
import type { DiagnosticResult } from '@/utils/diagnostics'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void }>()

const store = useAppStore()
const showChatKey = ref(false)
const showVisionKey = ref(false)
const testingDeepSeek = ref(false)
const testingMimo = ref(false)
const diagnosticResult = ref<DiagnosticResult | null>(null)

const form = reactive<ModelSettings>({
  chatModel: '',
  chatBaseUrl: '',
  chatApiKey: '',
  visionModel: '',
  visionBaseUrl: '',
  visionApiKey: ''
})

function syncForm() {
  form.chatModel = store.modelSettings.chatModel
  form.chatBaseUrl = store.modelSettings.chatBaseUrl
  form.chatApiKey = store.modelSettings.chatApiKey
  form.visionModel = store.modelSettings.visionModel
  form.visionBaseUrl = store.modelSettings.visionBaseUrl
  form.visionApiKey = store.modelSettings.visionApiKey
}

watch(() => props.visible, (val) => {
  if (val) syncForm()
})

function close() {
  emit('update:visible', false)
}

function save() {
  store.updateModelSettings({ ...form })
  close()
}

async function testDeepSeek() {
  testingDeepSeek.value = true
  diagnosticResult.value = null
  try {
    diagnosticResult.value = await diagnoseDeepSeekConfig(form.chatBaseUrl, form.chatApiKey, form.chatModel)
  } catch (error) {
    diagnosticResult.value = {
      success: false,
      message: '测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }
  } finally {
    testingDeepSeek.value = false
  }
}

async function testMimo() {
  testingMimo.value = true
  diagnosticResult.value = null
  try {
    diagnosticResult.value = await diagnoseMimoConfig(form.visionBaseUrl, form.visionApiKey, form.visionModel)
  } catch (error) {
    diagnosticResult.value = {
      success: false,
      message: '测试失败',
      details: error instanceof Error ? error.message : '未知错误'
    }
  } finally {
    testingMimo.value = false
  }
}
</script>
