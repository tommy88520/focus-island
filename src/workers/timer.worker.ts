// src/workers/timer.worker.ts

let timerInterval: ReturnType<typeof setInterval> | null = null;

self.onmessage = (e: MessageEvent) => {
  const { command, payload } = e.data;

  if (command === 'start') {
    if (timerInterval) clearInterval(timerInterval);
    
    let remainingTime = payload; // 初始秒數

    timerInterval = setInterval(() => {
      remainingTime--;
      
      // 每一秒把最新的時間傳回給主執行緒
      self.postMessage({ type: 'TICK', remainingTime });

      if (remainingTime <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        self.postMessage({ type: 'FINISHED' });
      }
    }, 1000);
  }

  if (command === 'stop') {
    if (timerInterval) clearInterval(timerInterval);
  }
};