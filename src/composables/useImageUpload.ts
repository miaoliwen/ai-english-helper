import { ref } from 'vue'

export function useImageUpload() {
  const fileInput = ref<HTMLInputElement>()
  const isDragging = ref(false)

  function triggerFileInput() {
    fileInput.value?.click()
  }

  function handleFileSelect(e: Event, onFile: (file: File) => void) {
    const files = (e.target as HTMLInputElement).files
    if (files && files[0]) onFile(files[0])
  }

  function handleDrop(e: DragEvent, onFile: (file: File) => void) {
    isDragging.value = false
    const files = e.dataTransfer?.files
    if (files && files[0] && files[0].type.startsWith('image/')) onFile(files[0])
  }

  function processFile(file: File, onResult: (dataUrl: string) => void) {
    const reader = new FileReader()
    reader.onload = (e) => { onResult(e.target?.result as string) }
    reader.readAsDataURL(file)
  }

  return { fileInput, isDragging, triggerFileInput, handleFileSelect, handleDrop, processFile }
}
