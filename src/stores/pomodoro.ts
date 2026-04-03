// src/stores/pomodoro.ts
import { defineStore } from 'pinia';
import TimerWorker from '../workers/timer.worker?worker'; // Vite 特有的引入方式

const FOCUS_PROGRESS_STORAGE_KEY = 'focus_island_today_progress_v1';

type FocusProgressPayload = {
  todayKey: string;
  todayFocusedSeconds: number;
  todayCompletedSessions: number;
};

function getTodayKey() {
  return new Date().toLocaleDateString('sv-SE');
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
  }),

  getters: {
    todayFocusedMinutes: (state) => Math.floor(state.todayFocusedSeconds / 60),
    todayFocusedHoursText: (state) => (state.todayFocusedSeconds / 3600).toFixed(1),
  },

  actions: {
    ensureTodayProgress() {
      const currentKey = getTodayKey();
      if (this.todayKey === currentKey) return;

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

    loadProgress() {
      if (this.progressInitialized) return;

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