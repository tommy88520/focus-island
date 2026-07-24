// src/stores/pomodoro.ts
import { defineStore } from 'pinia';
import TimerWorker from '../workers/timer.worker?worker'; // Vite 特有的引入方式

const FOCUS_PROGRESS_STORAGE_KEY = 'focus_island_today_progress_v1';
const HISTORY_STORAGE_KEY = 'focus_island_history_v1';
const HISTORY_MAX_DAYS = 30;

type FocusProgressPayload = {
  todayKey: string;
  todayFocusedSeconds: number;
  todayCompletedSessions: number;
};

export type DailyHistoryEntry = {
  date: string; // 'YYYY-MM-DD', local date
  focusedSeconds: number;
  completedSessions: number;
};

function getTodayKey() {
  return new Date().toLocaleDateString('sv-SE');
}

function isValidHistoryEntry(value: unknown): value is DailyHistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<DailyHistoryEntry>;
  return (
    typeof entry.date === 'string' &&
    typeof entry.focusedSeconds === 'number' &&
    typeof entry.completedSessions === 'number'
  );
}

export const usePomodoroStore = defineStore('pomodoro', {
  state: () => ({
    baseDuration: 25 * 60, // 預設 25 分鐘
    timeLeft: 25 * 60,
    isRunning: false,
    worker: null as Worker | null,
    todayKey: getTodayKey(),
    todayFocusedSeconds: 0,
    todayCompletedSessions: 0,
    progressInitialized: false,
    history: [] as DailyHistoryEntry[],
  }),

  getters: {
    todayFocusedMinutes: (state) => Math.floor(state.todayFocusedSeconds / 60),
    todayFocusedHoursText: (state) => (state.todayFocusedSeconds / 3600).toFixed(1),

    // Last 7 days including today, oldest first. Days with no recorded
    // activity (never visited, or a day that hasn't happened yet) show as 0.
    last7Days(state): DailyHistoryEntry[] {
      const byDate = new Map(state.history.map((entry) => [entry.date, entry]));
      byDate.set(state.todayKey, {
        date: state.todayKey,
        focusedSeconds: state.todayFocusedSeconds,
        completedSessions: state.todayCompletedSessions,
      });

      const days: DailyHistoryEntry[] = [];
      const cursor = new Date();
      for (let i = 6; i >= 0; i--) {
        const d = new Date(cursor);
        d.setDate(cursor.getDate() - i);
        const dateKey = d.toLocaleDateString('sv-SE');
        days.push(byDate.get(dateKey) ?? { date: dateKey, focusedSeconds: 0, completedSessions: 0 });
      }
      return days;
    },

    // Consecutive days (counting back from today) with any focused time at all.
    currentStreak(state): number {
      const byDate = new Map(state.history.map((entry) => [entry.date, entry.focusedSeconds]));
      byDate.set(state.todayKey, state.todayFocusedSeconds);

      let streak = 0;
      const cursor = new Date();
      // Today not having any focus time yet shouldn't zero out an existing
      // streak from previous days, so only today is allowed to be "skipped".
      for (let i = 0; ; i++) {
        const d = new Date(cursor);
        d.setDate(cursor.getDate() - i);
        const dateKey = d.toLocaleDateString('sv-SE');
        const seconds = byDate.get(dateKey) ?? 0;
        if (seconds > 0) {
          streak++;
        } else if (i > 0) {
          break;
        }
        if (i > HISTORY_MAX_DAYS) break;
      }
      return streak;
    },
  },

  actions: {
    ensureTodayProgress() {
      const currentKey = getTodayKey();
      if (this.todayKey === currentKey) return;

      if (this.todayFocusedSeconds > 0 || this.todayCompletedSessions > 0) {
        this.history.push({
          date: this.todayKey,
          focusedSeconds: this.todayFocusedSeconds,
          completedSessions: this.todayCompletedSessions,
        });
        this.history = this.history.slice(-HISTORY_MAX_DAYS);
        this.saveHistory();
      }

      this.todayKey = currentKey;
      this.todayFocusedSeconds = 0;
      this.todayCompletedSessions = 0;
      this.saveProgress();
    },

    saveProgress() {
      const payload: FocusProgressPayload = {
        todayKey: this.todayKey,
        todayFocusedSeconds: this.todayFocusedSeconds,
        todayCompletedSessions: this.todayCompletedSessions,
      };
      localStorage.setItem(FOCUS_PROGRESS_STORAGE_KEY, JSON.stringify(payload));
    },

    saveHistory() {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(this.history));
    },

    loadHistory() {
      const raw = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (!raw) return;

      try {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          this.history = parsed.filter(isValidHistoryEntry).slice(-HISTORY_MAX_DAYS);
        }
      } catch {
        // ignore invalid cache payload
      }
    },

    loadProgress() {
      if (this.progressInitialized) return;

      this.loadHistory();

      const raw = localStorage.getItem(FOCUS_PROGRESS_STORAGE_KEY);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Partial<FocusProgressPayload>;
          if (typeof parsed.todayKey === 'string') {
            this.todayKey = parsed.todayKey;
          }
          if (typeof parsed.todayFocusedSeconds === 'number') {
            this.todayFocusedSeconds = Math.max(0, Math.floor(parsed.todayFocusedSeconds));
          }
          if (typeof parsed.todayCompletedSessions === 'number') {
            this.todayCompletedSessions = Math.max(0, Math.floor(parsed.todayCompletedSessions));
          }
        } catch {
          // ignore invalid cache payload
        }
      }

      this.progressInitialized = true;
      this.ensureTodayProgress();
    },

    addFocusedSeconds(delta: number) {
      this.ensureTodayProgress();
      if (!Number.isFinite(delta) || delta <= 0) return;

      this.todayFocusedSeconds += Math.floor(delta);
      this.saveProgress();
    },

    markSessionCompleted() {
      this.ensureTodayProgress();
      this.todayCompletedSessions += 1;
      this.saveProgress();
    },

    initWorker() {
      this.loadProgress();

      if (!this.worker) {
        this.worker = new TimerWorker();
        
        // 監聽來自 Worker 的消息
        this.worker.onmessage = (e) => {
          if (e.data.type === 'TICK') {
            const delta = this.timeLeft - e.data.remainingTime;
            if (this.isRunning && delta > 0) {
              this.addFocusedSeconds(delta);
            }
            this.timeLeft = e.data.remainingTime;
          } else if (e.data.type === 'FINISHED') {
            if (this.isRunning) {
              this.markSessionCompleted();
            }
            this.isRunning = false;
            // 這裡之後可以串接 WebSocket 發送「完成專注」給 Golang
          }
        };
      }
    },

    startTimer() {
      if (this.isRunning) return;
      this.loadProgress();
      this.ensureTodayProgress();
      this.initWorker();
      this.isRunning = true;
      this.worker?.postMessage({ command: 'start', payload: this.timeLeft });
    },

    stopTimer() {
      this.isRunning = false;
      this.worker?.postMessage({ command: 'stop' });
    },

    setDuration(minutes: number) {
      if (this.isRunning) return;
      this.baseDuration = minutes * 60;
      this.timeLeft = this.baseDuration;
    },

    resetTimer() {
      this.stopTimer();
      this.timeLeft = this.baseDuration;
    },
  }
});