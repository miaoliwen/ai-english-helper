<template>
  <a
    href="#upload-main"
    class="skip-link"
  >跳转到主内容</a>
  <div
    id="upload-main"
    class="page-shell py-8 pb-24"
  >
    <div class="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10">
      <!-- Upload Panel -->
      <div class="lg:col-span-2 space-y-6">
        <div>
          <p class="section-label">Image Upload</p>
          <h2 class="text-3xl font-book tracking-tighter-section text-black dark:text-white mb-2">
            图片上传
          </h2>
          <p class="page-lead">
            拖拽、点击或拍照，识别英语题目内容
          </p>
        </div>

        <div
          :class="[
            'upload-zone p-10 sm:p-12 text-center',
            isDragging ? 'upload-zone-active' : 'upload-zone-idle'
          ]"
          @dragover.prevent="isDragging = true"
          @dragleave.prevent="isDragging = false"
          @drop.prevent="handleDrop"
          @click="triggerFileInput"
        >
          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            capture="environment"
            class="hidden"
            @change="handleFileSelect"
          >
          <div
            class="w-16 h-16 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-5 transition-transform duration-300"
            :class="isDragging ? 'scale-110' : ''"
          >
            <svg
              class="w-7 h-7 text-neutral-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>
          <p class="text-neutral-700 dark:text-neutral-300 font-medium mb-2 tracking-tight-body">
            点击拍照 / 选择文件 / 拖拽图片
          </p>
          <p class="text-sm text-neutral-400 font-mono tracking-tight-tag">
            JPG, PNG · 建议 5 MB 以内
          </p>
        </div>

        <!-- Preview -->
        <div
          v-if="previewImage"
          class="surface-panel p-4"
        >
          <div class="flex items-center justify-between mb-3">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight-body">图片预览</span>
            <button
              class="w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              @click="clearImage"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div class="rounded-2xl overflow-hidden bg-neutral-100 dark:bg-neutral-800">
            <img
              :src="previewImage"
              alt="Preview"
              class="w-full max-h-72 object-contain"
            >
          </div>
        </div>

        <!-- Actions -->
        <div
          v-if="previewImage"
          class="space-y-3"
        >
          <div
            v-if="!store.isVisionModelConfigured"
            class="alert-banner-warn"
          >
            <svg
              class="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="2"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
            <p class="text-xs text-amber-700 dark:text-amber-400">
              视觉模型未配置，请在导航栏设置中填入模型信息后开始识别
            </p>
          </div>
          <div class="flex gap-3">
            <button
              :disabled="isProcessing || !store.isVisionModelConfigured"
              class="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-40"
              @click="startOCR"
            >
              <svg
                v-if="!isProcessing"
                class="w-4 h-4"
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
              <svg
                v-else
                class="w-4 h-4 animate-spin"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                stroke-width="2"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
              <span>{{ isProcessing ? '识别中...' : '开始识别' }}</span>
            </button>
            <button
              :disabled="!store.hasCurrentOCR"
              class="btn-secondary flex items-center gap-2"
              @click="goToChat"
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
                  d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                />
              </svg>
              <span>AI解析</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Results Panel -->
      <div
        ref="resultsPanel"
        class="lg:col-span-3 space-y-6"
      >
        <div class="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p class="section-label">OCR Result</p>
            <h2 class="text-3xl font-book tracking-tighter-section text-black dark:text-white">
              识别结果
            </h2>
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
            <ExportPanel
              v-if="ocrResult"
              :content="ocrResult.markdown"
              :title="'OCR识别结果'"
            />
          </div>
        </div>

        <div
          v-if="!ocrResult && !isProcessing"
          class="surface-panel p-10 sm:p-14 lg:p-16 text-center"
        >
          <div class="w-14 h-14 bg-black/5 dark:bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              class="w-7 h-7 text-neutral-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
              />
            </svg>
          </div>
          <p class="text-neutral-500 dark:text-neutral-400 tracking-tight-body">
            上传图片后将在此显示识别结果
          </p>
        </div>

        <div
          v-else-if="isProcessing"
          class="surface-panel p-12 text-center"
        >
          <div class="flex items-center justify-center gap-2 mb-4">
            <div class="w-2.5 h-2.5 bg-black dark:bg-white rounded-full animate-bounce" />
            <div class="w-2.5 h-2.5 bg-black dark:bg-white rounded-full animate-bounce animation-delay-150" />
            <div class="w-2.5 h-2.5 bg-black dark:bg-white rounded-full animate-bounce animation-delay-300" />
          </div>
          <p class="text-neutral-600 dark:text-neutral-400 tracking-tight-body">
            正在识别图片内容...
          </p>
        </div>

        <div
          v-else-if="ocrResult"
          class="surface-panel overflow-hidden"
        >
          <div class="px-6 py-4 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between">
            <span class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 tracking-tight-body">Markdown</span>
            <button
              class="flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium text-black dark:text-white border border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
              @click="addToFavorites"
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
                  d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 0111.186 0z"
                />
              </svg>
              <span>收藏</span>
            </button>
          </div>
          <div class="p-4 sm:p-6">
            <MarkdownRenderer
              reading
              :content="ocrResult.markdown"
            />
          </div>
        </div>

        <!-- History -->
        <div
          v-if="store.recentOCRs.length > 0"
          class="pt-4"
        >
          <h3 class="text-sm font-semibold text-neutral-700 dark:text-neutral-300 mb-3 tracking-tight-body">
            历史记录
          </h3>
          <div class="space-y-2">
            <div
              v-for="item in store.recentOCRs.slice(0, 5)"
              :key="item.id"
              class="group flex items-center gap-3 p-3 bg-white dark:bg-neutral-900 rounded-2xl border border-black/6 dark:border-white/6 cursor-pointer hover:border-black/20 dark:hover:border-white/20 transition-all duration-300"
              @click="loadHistory(item.id)"
            >
              <img
                :src="item.imageBase64"
                class="w-11 h-11 rounded-xl object-cover bg-neutral-100 dark:bg-neutral-800"
              >
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-black dark:text-white truncate tracking-tight-body">
                  {{ item.text.slice(0, 40) }}...
                </p>
                <p class="text-xs text-neutral-400 font-mono tracking-tight-tag">
                  {{ formatDate(item.createdAt) }}
                </p>
              </div>
              <button
                :title="'删除该记录'"
                aria-label="删除历史记录"
                class="w-8 h-8 flex items-center justify-center text-neutral-300 hover:text-red-500 hover:bg-red-50 rounded-full opacity-70 sm:opacity-0 group-hover:opacity-100 transition-all shrink-0"
                @click.stop="removeHistory(item.id)"
              >
                <svg
                  class="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  stroke-width="2"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { recognizeImage } from '@/services/mimo'
import { useToast } from '@/composables/useToast'
import { useImageUpload } from '@/composables/useImageUpload'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import ExportPanel from '@/components/ExportPanel.vue'
import ModelSwitcher from '@/components/ModelSwitcher.vue'

const store = useAppStore()
const router = useRouter()
const { showToast } = useToast()

const resultsPanel = ref<HTMLElement>()
const previewImage = ref('')
const isProcessing = ref(false)

const { fileInput, isDragging, triggerFileInput, handleFileSelect: onFileSelect, handleDrop: onDrop, processFile } = useImageUpload()
const handleFileSelect = (e: Event) => onFileSelect(e, (file) => processFile(file, (dataUrl) => { previewImage.value = dataUrl }))
const handleDrop = (e: DragEvent) => onDrop(e, (file) => processFile(file, (dataUrl) => { previewImage.value = dataUrl }))

const ocrResult = computed(() => store.currentOCR)

function openSettings() { store.openSettings() }

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

function clearImage() {
  previewImage.value = ''
  store.clearCurrentOCR()
  if (fileInput.value) fileInput.value.value = ''
}

async function startOCR() {
  if (!previewImage.value) return
  isProcessing.value = true
  try {
    const result = await recognizeImage(previewImage.value, store.modelSettings.visionModel)
    await store.createOCRResult(previewImage.value, result.text, result.markdown)
    showToast('success', '识别完成')
    nextTick(() => {
      resultsPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
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
