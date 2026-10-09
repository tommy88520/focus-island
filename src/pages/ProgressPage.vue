<template>
  <div class="relative min-h-[calc(100vh-80px)] px-4 py-4 pb-20 sm:px-6 lg:py-8">
    <div class="mx-auto max-w-6xl space-y-6">
      <header class="pixel-panel p-5 sm:p-8">
        <p class="font-pixel text-[11px] uppercase text-[color:var(--px-accent-dark)] dark:!text-amber-300">Today</p>
        <h1 class="!mb-0 mt-2 !text-2xl !font-black sm:!text-4xl">{{ t.progressPage.title }}</h1>
        <p class="mt-2 text-sm text-[color:var(--px-muted)]">{{ t.progressPage.subtitle }}</p>
      </header>

      <section class="!grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article class="pixel-panel p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-[color:var(--px-muted)]">{{ t.progressPage.completedSessionsLabel }}</p>
          <p class="font-pixel mt-3 text-4xl font-bold text-amber-500 dark:!text-amber-300">{{ store.todayCompletedSessions }}</p>
          <p class="mt-2 text-xs text-[color:var(--px-muted)]">{{ t.progressPage.completedSessionsHint }}</p>
        </article>

        <article class="pixel-panel p-5">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-[color:var(--px-muted)]">{{ t.progressPage.focusedMinutesLabel }}</p>
          <p class="font-pixel mt-3 text-4xl font-bold text-teal-600 dark:!text-teal-300">{{ store.todayFocusedMinutes }}</p>
          <p class="mt-2 text-xs text-[color:var(--px-muted)]">{{ t.progressPage.focusedMinutesHint }}</p>
        </article>

        <article class="pixel-panel p-5 sm:col-span-2 lg:col-span-1">
          <p class="text-[10px] font-black uppercase tracking-[0.25em] text-[color:var(--px-muted)]">{{ t.progressPage.focusedHoursLabel }}</p>
          <p class="font-pixel mt-3 text-4xl font-bold text-rose-500 dark:!text-rose-300">{{ store.todayFocusedHoursText }}</p>
          <p class="mt-2 text-xs text-[color:var(--px-muted)]">{{ t.progressPage.focusedHoursHint(store.todayFocusedHoursText) }}</p>
        </article>
      </section>

      <section class="pixel-panel p-5 sm:p-6">
        <div class="flex items-center justify-between">
          <h2 class="!mb-0 !text-lg !font-black">{{ t.progressPage.last7DaysTitle }}</h2>
          <div class="pixel-btn pixel-btn--active !flex-nowrap px-3 py-1">
            <span class="text-sm">🔥</span>
            <span class="text-xs font-black">{{ t.progressPage.streakLabel(store.currentStreak) }}</span>
          </div>
        </div>

        <div class="mt-6 flex items-end justify-between gap-2 sm:gap-4" role="img" :aria-label="chartAriaLabel">
          <div v-for="day in store.last7Days" :key="day.date" class="flex flex-1 flex-col items-center gap-1.5">
            <span class="text-[10px] font-black tabular-nums text-[color:var(--px-muted)]">
              {{ Math.floor(day.focusedSeconds / 60) }}
            </span>
            <div class="flex h-24 w-full items-end justify-center">
              <div
                class="w-full max-w-8 border-2 border-b-0 border-[color:var(--px-ink)] transition-all"
                :class="
                  isToday(day.date)
                    ? 'bg-[color:var(--px-accent)]'
                    : 'bg-teal-400 dark:!bg-teal-500'
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

      <section class="pixel-panel p-5 sm:p-6">
        <h2 class="!mb-0 !text-lg !font-black">{{ t.progressPage.explanationTitle }}</h2>
        <ul class="mt-3 space-y-2 text-sm text-slate-600 dark:!text-white/75">
          <li v-for="item in t.progressPage.explanationItems" :key="item">{{ item }}</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { usePomodoroStore } from 'src/stores/pomodoro';
import { useLocale } from 'src/composables/useLocale';

const store = usePomodoroStore();
const { locale, t } = useLocale();

onMounted(() => {
  store.loadProgress();
  store.ensureTodayProgress();
});

const todayKey = new Date().toLocaleDateString('sv-SE');

function isToday(date: string) {
  return date === todayKey;
}

function formatDayLabel(date: string) {
  if (isToday(date)) return t.value.progressPage.todayLabel;
  const d = new Date(`${date}T00:00:00`);
  const weekday = t.value.progressPage.weekdayLabels[d.getDay()];
  return locale.value === 'zh-TW' ? `週${weekday}` : weekday;
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
    .map((day) => `${formatDayLabel(day.date)} ${Math.floor(day.focusedSeconds / 60)}${t.value.progressPage.minutesUnit}`)
    .join(t.value.progressPage.listSeparator),
);
</script>
