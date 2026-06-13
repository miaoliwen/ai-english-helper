<template>
  <div class="page-shell flex flex-col items-center justify-center text-center py-24">
    <div class="w-20 h-20 rounded-full bg-black/5 dark:bg-white/10 flex items-center justify-center mb-6">
      <svg
        class="w-10 h-10 text-neutral-400"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        stroke-width="1.5"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
        />
      </svg>
    </div>
    <h1 class="text-6xl font-book tracking-tighter-display text-black dark:text-white">
      404
    </h1>
    <p class="mt-2 text-neutral-500 dark:text-neutral-400 tracking-tight-body">
      页面未找到
    </p>
    <router-link
      to="/"
      class="btn-primary mt-8"
    >
      返回首页
    </router-link>
  </div>
</template>
