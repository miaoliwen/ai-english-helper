import { ref, computed, onMounted } from 'vue'

type Theme = 'light' | 'dark'

const STORAGE_KEY = 'aieh-theme'

const currentTheme = ref<Theme>('light')

export function useTheme() {
  const isDark = computed(() => currentTheme.value === 'dark')

  function applyTheme(theme: Theme) {
    currentTheme.value = theme
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
    localStorage.setItem(STORAGE_KEY, theme)
  }

  function toggleTheme() {
    applyTheme(currentTheme.value === 'light' ? 'dark' : 'light')
  }

  onMounted(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved) {
      applyTheme(saved)
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      applyTheme('dark')
    }
  })

  return {
    currentTheme,
    isDark,
    toggleTheme,
    applyTheme
  }
}
