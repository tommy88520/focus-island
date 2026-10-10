// 番茄鐘的瀏覽器通知：只在頁面不在前景時跳（在前景已經有頁面內的提示）。
// 權限要在使用者按下按鈕時才能要，所以 requestNotifyPermission 只從點擊事件呼叫。

export function notifySupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notifyPermission(): NotificationPermission | 'unsupported' {
  return notifySupported() ? Notification.permission : 'unsupported';
}

export async function requestNotifyPermission(): Promise<boolean> {
  if (!notifySupported()) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  try {
    return (await Notification.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function sendFocusNotification(title: string, body: string): void {
  if (!notifySupported() || Notification.permission !== 'granted' || !document.hidden) return;
  try {
    const n = new Notification(title, { body, icon: '/icons/icon-192x192.png', tag: 'focus-island-timer' });
    n.onclick = () => {
      window.focus();
      n.close();
    };
  } catch {
    // 有些瀏覽器（例如 Android Chrome）只允許從 service worker 發通知，失敗就算了
  }
}
