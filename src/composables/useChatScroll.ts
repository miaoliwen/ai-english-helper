import { ref, nextTick, onBeforeUnmount, type Ref } from 'vue'

export function useChatScroll(containerRef: Ref<HTMLElement | undefined>) {
  const isAutoScrollEnabled = ref(true)
  let sentinelObserver: IntersectionObserver | null = null

  async function scrollToBottom() {
    await nextTick()
    if (containerRef.value) {
      containerRef.value.scrollTop = containerRef.value.scrollHeight
    }
  }

  function enableAutoScroll() {
    isAutoScrollEnabled.value = true
  }

  function disableAutoScroll() {
    isAutoScrollEnabled.value = false
  }

  /** Call this during streaming to auto-scroll only when user is at bottom */
  async function onStreamChunk() {
    if (isAutoScrollEnabled.value) {
      await scrollToBottom()
    }
  }

  /** Attach IntersectionObserver to a sentinel element at the end of the list */
  function observeSentinel(el: HTMLElement) {
    unobserveSentinel()
    sentinelObserver = new IntersectionObserver(
      (entries) => {
        // When sentinel is visible, user is at bottom
        isAutoScrollEnabled.value = entries[0]?.isIntersecting ?? false
      },
      { root: containerRef.value, threshold: 0.1 }
    )
    sentinelObserver.observe(el)
  }

  function unobserveSentinel() {
    if (sentinelObserver) {
      sentinelObserver.disconnect()
      sentinelObserver = null
    }
  }

  onBeforeUnmount(() => unobserveSentinel())

  return {
    isAutoScrollEnabled,
    scrollToBottom,
    enableAutoScroll,
    disableAutoScroll,
    onStreamChunk,
    observeSentinel,
    unobserveSentinel
  }
}
