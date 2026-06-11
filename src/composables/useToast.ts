import { ref } from 'vue'

export interface ToastState {
  type: 'success' | 'error'
  message: string
}

// Module-level singleton — shared across all components
const toast = ref<ToastState | null>(null)
let timer: ReturnType<typeof setTimeout> | null = null

const DEFAULT_DURATION = 2400

export function useToast() {
  function showToast(type: 'success' | 'error', message: string, duration = DEFAULT_DURATION) {
    toast.value = { type, message }
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => { toast.value = null }, duration)
  }

  function dismissToast() {
    toast.value = null
    if (timer) {
      clearTimeout(timer)
      timer = null
    }
  }

  return { toast, showToast, dismissToast }
}
