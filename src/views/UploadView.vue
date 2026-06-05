<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-20">
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <!-- Upload Panel -->
      <div class="lg:col-span-2 space-y-6">
        <div>
          <div class="section-label">Image Upload</div>
          <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight mb-2">图片上传</h2>
          <p class="text-neutral-500 dark:text-neutral-400">支持拖拽或点击上传英语题目图片</p>
        </div>

        <div
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
          :class="[
            'relative border-2 border-dashed rounded-4xl p-12 text-center cursor-pointer transition-all duration-500',
            isDragging ? 'border-accent-400 bg-accent-50/50' : 'border-neutral-200 dark:border-neutral-700 hover:border-accent-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/50'
          ]"
        >
          <input ref="fileInput" type="file" accept="image/*" class="hidden" @change="handleFileSelect" />
          <div class="w-16 h-16 bg-accent-50 rounded-2xl flex items-center justify-center mx-auto mb-5 transition-transform duration-300" :class="isDragging ? 'scale-110' : ''">
            <svg class="w-7 h-7 text-accent-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
            </svg>
          </div>
          <p class="text-neutral-700 dark:text-neutral-300 font-medium mb-2">点击或拖拽图片到此处</p>
          <p class="text-sm text-neutral-400 font-mono">JPG, PNG, GIF</p>
        </div>

        <!-- Preview -->
        <div v-if="previewImage" class="card-surface p-4">
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">图片预览</span>
            <button @click="clearImage" class="p-1.5 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div class="rounded-3xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <img :src="previewImage" alt="Preview" class="w-full max-h-72 object-contain"/>
          </div>
        </div>

        <!-- Actions -->
        <div v-if="previewImage" class="space-y-3">
          <div v-if="!store.isVisionModelConfigured" class="flex items-center gap-2.5 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
            <svg class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <p class="text-xs text-amber-700 dark:text-amber-400">视觉模型未配置，请在导航栏设置中填入模型信息后开始识别</p>
          </div>
          <div class="flex gap-3">
            <button @click="startOCR" :disabled="isProcessing || !store.isVisionModelConfigured" class="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40">
              <svg v-if="!isProcessing" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"/>
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              <svg v-else class="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"/>
              </svg>
              <span>{{ isProcessing ? '识别中...' : '开始识别' }}</span>
            </button>
            <button @click="goToChat" :disabled="!store.hasCurrentOCR" class="btn-secondary flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
              </svg>
              <span>AI解析</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Results Panel -->
      <div class="lg:col-span-3 space-y-6">
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div class="section-label">OCR Result</div>
            <h2 class="text-2xl font-bold text-neutral-900 dark:text-neutral-100 tracking-tight">识别结果</h2>
          </div>
          <div class="flex items-center gap-2">
            <ModelSwitcher
              kind="vision"
              :presets="store.modelPresets.vision"
              :active-id="store.modelPresets.activeVisionId"
              :disabled="isProcessing"
              @select="onSelectVision"
              @manage="openSettings"
            />
            <ExportPanel v-if="ocrResult" :content="ocrResult.markdown" :title="'OCR识别结果'" />
          </div>
        </div>

        <div v-if="!ocrResult && !isProcessing" class="card-surface p-16 text-center">
          <div class="w-14 h-14 bg-neutral-100 dark:bg-neutral-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg class="w-7 h-7 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
            </svg>
          </div>
          <p class="text-neutral-500 dark:text-neutral-400">上传图片后将在此显示识别结果</p>
        </div>

        <div v-else-if="isProcessing" class="card-surface p-12 text-center">
          <div class="flex items-center justify-center gap-2 mb-4">
            <div class="w-2.5 h-2.5 bg-accent-500 rounded-full animate-bounce"></div>
            <div class="w-2.5 h-2.5 bg-accent-500 rounded-full animate-bounce animation-delay-150"></div>
            <div class="w-2.5 h-2.5 bg-accent-500 rounded-full animate-bounce animation-delay-300"></div>
          </div>
          <p class="text-neutral-600 dark:text-neutral-400">正在识别图片内容...</p>
        </div>

        <div v-else-if="ocrResult" class="card-surface overflow-hidden">
          <div class="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-100 flex items-center justify-between">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300">Markdown</span>
            <button @click="addToFavorites" class="flex items-center gap-1.5 text-sm text-accent-600 hover:text-accent-700 font-medium transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z"/>
              </svg>
              <span>收藏</span>
            </button>
          </div>
          <div class="p-6">
            <MarkdownRenderer :content="ocrResult.markdown" />
          </div>
        </div>

        <!-- History -->
        <div v-if="store.recentOCRs.length > 0" class="pt-4">
          <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3">历史记录</h3>
          <div class="space-y-2">
            <div v-for="item in store.recentOCRs.slice(0, 5)" :key="item.id"
                 class="group flex items-center gap-3 p-3 bg-white rounded-2xl border border-neutral-100 cursor-pointer hover:border-accent-200 transition-all duration-300"
                 @click="loadHistory(item.id)">
              <img :src="item.imageBase64" class="w-11 h-11 rounded-xl object-cover bg-neutral-100"/>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-neutral-900 dark:text-neutral-100 truncate">{{ item.text.slice(0, 40) }}...</p>
                <p class="text-xs text-neutral-400 font-mono">{{ formatDate(item.createdAt) }}</p>
              </div>
              <button @click.stop="removeHistory(item.id)" :title="'删除该记录'"
                      class="p-1.5 text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Toast -->
    <Transition name="scale">
      <div v-if="toast" class="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl shadow-lg text-sm font-medium"
           :class="toast.type === 'success' ? 'bg-neutral-900 text-white' : 'bg-red-600 text-white'">
        {{ toast.message }}
      </div>
    </Transition>

    <SettingsModal v-model:visible="isSettingsOpen" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { recognizeImage, mockRecognizeImage } from '@/services/mimo'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import ModelSwitcher from '@/components/ModelSwitcher.vue'
import SettingsModal from '@/components/SettingsModal.vue'

const USE_REAL_API = true

const store = useAppStore()
const router = useRouter()

const fileInput = ref<HTMLInputElement>()
const isDragging = ref(false)
const previewImage = ref('')
const isProcessing = ref(false)
const toast = ref<{ type: 'success' | 'error'; message: string } | null>(null)
let toastTimer: ReturnType<typeof setTimeout> | null = null

function showToast(type: 'success' | 'error', message: string) {
  toast.value = { type, message }
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toast.value = null }, 2400)
}

const ocrResult = computed(() => store.currentOCR)

const isSettingsOpen = ref(false)
function openSettings() { isSettingsOpen.value = true }

async function onSelectVision(id: string) {
  await store.setActiveVisionPreset(id)
  showToast('success', '已切换视觉模型')
}

onMounted(() => {
  store.loadRecents()
  if (store.currentOCR) {
    previewImage.value = store.currentOCR.imageBase64
  }
})

function triggerFileInput() {
  fileInput.value?.click()
}

function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (files && files[0]) processFile(files[0])
}

function handleDrop(e: DragEvent) {
  isDragging.value = false
  const files = e.dataTransfer?.files
  if (files && files[0] && files[0].type.startsWith('image/')) processFile(files[0])
}

function processFile(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => { previewImage.value = e.target?.result as string }
  reader.readAsDataURL(file)
}

function clearImage() {
  previewImage.value = ''
  store.clearCurrentOCR()
  if (fileInput.value) fileInput.value.value = ''
}

async function startOCR() {
  if (!previewImage.value) return
  isProcessing.value = true
  try {
    const result = USE_REAL_API
      ? await recognizeImage(previewImage.value, {
          baseUrl: store.modelSettings.visionBaseUrl,
          apiKey: store.modelSettings.visionApiKey,
          modelId: store.modelSettings.visionModel
        })
      : await mockRecognizeImage(previewImage.value)
    await store.createOCRResult(previewImage.value, result.text, result.markdown)
    showToast('success', '识别完成')
  } catch (error) {
    const message = error instanceof Error ? error.message : '识别失败'
    showToast('error', message)
  } finally {
    isProcessing.value = false
  }
}

function goToChat() {
  if (store.currentOCR) router.push('/chat')
}

async function loadHistory(id: string) {
  await store.loadOCR(id)
  if (store.currentOCR) previewImage.value = store.currentOCR.imageBase64
}

async function removeHistory(id: string) {
  if (!confirm('确定要删除这条历史记录吗？')) return
  await store.deleteOCR(id)
  if (previewImage.value && store.currentOCR === null) {
    previewImage.value = ''
  }
  showToast('success', '已删除')
}

async function addToFavorites() {
  if (!store.currentOCR) return
  await store.addToFavorites({
    title: 'OCR识别 ' + formatDate(store.currentOCR.createdAt),
    type: 'ocr',
    content: store.currentOCR.markdown,
    ocrResultId: store.currentOCR.id,
    tags: ['OCR', '识别']
  })
  showToast('success', '已添加到收藏')
}

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>
