<template>
  <div class="relative min-h-[calc(100vh-80px)] px-4 py-4 pb-20 sm:px-6 lg:py-8">
    <div class="mx-auto max-w-6xl space-y-6">
      <header class="rounded-3xl border border-slate-200 dark:!border-white/10 bg-white dark:!bg-slate-900/50 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <p class="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 dark:!text-amber-300/80">Today</p>
        <h1 class="mt-2 text-2xl font-black text-slate-900 dark:!text-white sm:text-4xl">今日進度</h1>
        <p class="mt-2 text-sm text-slate-500 dark:!text-white/65">追蹤今天專注完成輪數與累積專注時間。</p>
      </header>

      <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article class="rounded-3xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 p-5 shadow-xl backdrop-blur">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:!text-white/60">完成輪數</p>
          <p class="mt-3 text-4xl font-black text-amber-500 dark:!text-amber-300">{{ store.todayCompletedSessions }}</p>
          <p class="mt-2 text-xs text-slate-500 dark:!text-white/60">每完成一輪 25 分鐘即 +1</p>
        </article>

        <article class="rounded-3xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 p-5 shadow-xl backdrop-blur">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:!text-white/60">累積分鐘</p>
          <p class="mt-3 text-4xl font-black text-teal-600 dark:!text-teal-300">{{ store.todayFocusedMinutes }}</p>
          <p class="mt-2 text-xs text-slate-500 dark:!text-white/60">由每秒 TICK 累積，較接近真實專注時長</p>
        </article>

        <article class="rounded-3xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 p-5 shadow-xl backdrop-blur sm:col-span-2 lg:col-span-1">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500 dark:!text-white/60">累積小時</p>
          <p class="mt-3 text-4xl font-black text-rose-500 dark:!text-rose-300">{{ store.todayFocusedHoursText }}</p>
          <p class="mt-2 text-xs text-slate-500 dark:!text-white/60">今天已專注 {{ store.todayFocusedHoursText }} 小時</p>
        </article>
      </section>

      <section class="rounded-3xl border border-slate-200 dark:!border-white/10 bg-white dark:!bg-slate-900/45 p-5 shadow-xl backdrop-blur sm:p-6">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-black text-slate-900 dark:!text-white">近 7 天</h2>
          <div class="flex items-center gap-1.5 rounded-full border border-amber-300 dark:!border-amber-300/40 bg-amber-50 dark:!bg-amber-400/10 px-3 py-1">
            <span class="text-sm">🔥</span>
            <span class="text-xs font-black text-amber-700 dark:!text-amber-200">連續 {{ store.currentStreak }} 天</span>
          </div>
        </div>

        <div class="mt-6 flex items-end justify-between gap-2 sm:gap-4" role="img" :aria-label="chartAriaLabel">
          <div v-for="day in store.last7Days" :key="day.date" class="flex flex-1 flex-col items-center gap-1.5">
            <span class="text-[10px] font-black tabular-nums text-slate-500 dark:!text-white/60">
              {{ Math.floor(day.focusedSeconds / 60) }}
            </span>
            <div class="flex h-24 w-full items-end justify-center">
              <div
                class="w-full max-w-8 rounded-t-md transition-all"
                :class="
                  isToday(day.date)
                    ? 'bg-teal-500 dark:!bg-teal-400 ring-2 ring-amber-400 ring-offset-1 ring-offset-white dark:!ring-offset-slate-900'
                    : 'bg-teal-300 dark:!bg-teal-600'
                "
                :style="{ height: barHeight(day.focusedSeconds) }"
              ></div>
            </div>
            <span
              class="text-[10px] font-bold"
              :class="isToday(day.date) ? 'text-amber-600 dark:!text-amber-300' : 'text-slate-400 dark:!text-white/45'"
            >
              {{ formatDayLabel(day.date) }}
            </span>
          </div>
        </div>
      </section>

      <section class="rounded-3xl border border-slate-200 dark:!border-white/10 bg-white dark:!bg-slate-900/45 p-5 shadow-xl backdrop-blur sm:p-6">
        <h2 class="text-lg font-black text-slate-900 dark:!text-white">說明</h2>
        <ul class="mt-3 space-y-2 text-sm text-slate-600 dark:!text-white/75">
          <li>計時完成會自動計入完成輪數。</li>
          <li>累積分鐘使用秒級累加，重整後會保留。</li>
          <li>跨日會自動歸零，開始新的統計。</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { usePomodoroStore } from 'src/stores/pomodoro';

const store = usePomodoroStore();

onMounted(() => {
  store.loadProgress();
  store.ensureTodayProgress();
});

const todayKey = new Date().toLocaleDateString('sv-SE');
const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六'];

function isToday(date: string) {
  return date === todayKey;
}

function formatDayLabel(date: string) {
  if (isToday(date)) return '今天';
  const d = new Date(`${date}T00:00:00`);
  return `週${weekdayLabels[d.getDay()]}`;
}

function barHeight(focusedSeconds: number) {
  const maxSeconds = Math.max(1, ...store.last7Days.map((d) => d.focusedSeconds));
  const ratio = focusedSeconds / maxSeconds;
  // Even a 0-minute day gets a sliver, so the 7-day rhythm stays visible
  // instead of looking like a missing bar.
  const percent = focusedSeconds > 0 ? Math.max(6, Math.round(ratio * 100)) : 3;
  return `${percent}%`;
}

const chartAriaLabel = computed(() =>
  store.last7Days
    .map((day) => `${formatDayLabel(day.date)} ${Math.floor(day.focusedSeconds / 60)} 分鐘`)
    .join('，'),
);
</script>
