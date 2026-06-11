import { watch, onBeforeUnmount, type Ref } from 'vue'

/**
 * 当某个 ref 变为 true 时锁住 body 滚动（解决移动端
 * 模态/抽屉打开后背景仍可滚动的问题）。
 *
 * 用法：
 *   const isOpen = ref(false)
 *   useScrollLock(isOpen)
 *
 * 实现要点：
 * - 记录进入锁时的 scrollY，再通过 `position: fixed; top: -y` 抵消位移，
 *   关闭时还原。这样既禁止滚动又不会让内容跳动。
 * - 同一时间多次调用会自动叠加计数（引用计数），避免冲突。
 */
export function useScrollLock(active: Ref<boolean>) {
  let lockedCount = 0
  let savedScrollY = 0
  let savedOverflow = ''
  let savedPosition = ''
  let savedTop = ''
  let savedWidth = ''

  function lock() {
    if (typeof window === 'undefined') return
    if (lockedCount === 0) {
      savedScrollY = window.scrollY
      savedOverflow = document.body.style.overflow
      savedPosition = document.body.style.position
      savedTop = document.body.style.top
      savedWidth = document.body.style.width
      document.body.style.overflow = 'hidden'
      document.body.style.position = 'fixed'
      document.body.style.top = `-${savedScrollY}px`
      document.body.style.width = '100%'
    }
    lockedCount++
  }

  function unlock() {
    if (typeof window === 'undefined') return
    if (lockedCount === 0) return
    lockedCount--
    if (lockedCount === 0) {
      document.body.style.overflow = savedOverflow
      document.body.style.position = savedPosition
      document.body.style.top = savedTop
      document.body.style.width = savedWidth
      window.scrollTo(0, savedScrollY)
    }
  }

  watch(active, (val) => {
    if (val) lock()
    else unlock()
  }, { immediate: true })

  // 组件卸载时释放滚动锁，避免切换路由后 body 仍处于
  // overflow:hidden + position:fixed 导致页面卡死。
  onBeforeUnmount(() => {
    if (lockedCount > 0) unlock()
  })
}
