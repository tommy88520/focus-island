<template>
  <div class="relative min-h-[calc(100vh-80px)] px-4 py-4 pb-20 sm:px-6 lg:py-8">
    <div class="mx-auto max-w-6xl space-y-6">
      <header class="rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-amber-300/60">Today</p>
        <h1 class="mt-2 text-2xl font-black text-white sm:text-4xl">今日進度</h1>
        <p class="mt-2 text-sm text-white/50">追蹤今天專注完成輪數與累積專注時間。</p>
      </header>

      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-white/45">完成輪數</p>
          <p class="mt-3 text-4xl font-black text-amber-300">{{ store.todayCompletedSessions }}</p>
          <p class="mt-2 text-xs text-white/45">每完成一輪 25 分鐘即 +1</p>
        </article>

        <article class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-white/45">累積分鐘</p>
          <p class="mt-3 text-4xl font-black text-teal-300">{{ store.todayFocusedMinutes }}</p>
          <p class="mt-2 text-xs text-white/45">由每秒 TICK 累積，較接近真實專注時長</p>
        </article>

        <article class="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-xl backdrop-blur sm:col-span-2 lg:col-span-1">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-white/45">累積小時</p>
          <p class="mt-3 text-4xl font-black text-rose-300">{{ store.todayFocusedHoursText }}</p>
          <p class="mt-2 text-xs text-white/45">今天已專注 {{ store.todayFocusedHoursText }} 小時</p>
        </article>
      </section>

      <section class="rounded-3xl border border-white/10 bg-slate-900/45 p-5 shadow-xl backdrop-blur sm:p-6">
        <h2 class="text-lg font-black text-white">說明</h2>
        <ul class="mt-3 space-y-2 text-sm text-white/60">
          <li>計時完成會自動計入完成輪數。</li>
          <li>累積分鐘使用秒級累加，重整後會保留。</li>
          <li>跨日會自動歸零，開始新的統計。</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { usePomodoroStore } from 'src/stores/pomodoro';

const store = usePomodoroStore();

onMounted(() => {
  store.loadProgress();
  store.ensureTodayProgress();
});
</script>
