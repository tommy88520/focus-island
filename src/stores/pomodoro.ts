// src/stores/pomodoro.ts
import { defineStore } from 'pinia';
import TimerWorker from '../workers/timer.worker?worker'; // Vite 特有的引入方式

export const usePomodoroStore = defineStore('pomodoro', {
  state: () => ({
    baseDuration: 25 * 60, // 預設 25 分鐘
    timeLeft: 25 * 60,
    isRunning: false,
    worker: null as Worker | null,
  }),

  actions: {
    initWorker() {
      if (!this.worker) {
        this.worker = new TimerWorker();
        
        // 監聽來自 Worker 的消息
        this.worker.onmessage = (e) => {
          if (e.data.type === 'TICK') {
            this.timeLeft = e.data.remainingTime;
          } else if (e.data.type === 'FINISHED') {
            this.isRunning = false;
            // 這裡之後可以串接 WebSocket 發送「完成專注」給 Golang
          }
        };
      }
    },

    startTimer() {
      if (this.isRunning) return;
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
    }
  }
});