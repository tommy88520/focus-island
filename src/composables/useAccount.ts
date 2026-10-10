// Google 登入與雲端同步。
// 登入是選擇性的：沒登入就跟以前一樣只存在這個瀏覽器；登入後進度、紀錄、外觀與偏好
// 會存一份到後端，換裝置登入同一個帳號就會合併回來。不存 email，只存 Google 的使用者編號。

import { ref, watch } from 'vue';
import { usePlayerPrefs, type PlayerPrefs } from 'src/composables/usePlayerPrefs';
import { usePomodoroStore, type DailyHistoryEntry, type SyncedProgress } from 'src/stores/pomodoro';

// 公開的 OAuth Client ID（本來就會出現在網頁裡，不是密碼）
export const GOOGLE_CLIENT_ID = '1052714665565-oc9po12vftshf3psrhd32jktoq61d00v.apps.googleusercontent.com';

const SESSION_KEY = 'focus_island_session_v1';
const USER_ID_KEY = 'lib_uid';
const DISPLAY_NAME_KEY = 'lib_display_name';
const SYNC_DEBOUNCE_MS = 15_000;

interface CloudData {
  v: 1;
  prefs: PlayerPrefs;
  progress: SyncedProgress;
  displayName?: string;
}

function apiBase(): string {
  const api = import.meta.env.VITE_BACKEND_API_URL as string | undefined;
  if (api) return api.replace(/\/$/, '');
  const ws = (import.meta.env.VITE_BACKEND_WS_URL as string | undefined) || 'ws://localhost:8080';
  return ws.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/$/, '');
}

function readSession(): string {
  try {
    return localStorage.getItem(SESSION_KEY) ?? '';
  } catch {
    return '';
  }
}

const session = ref(readSession());
const syncing = ref(false);
let started = false;
let syncTimer: number | undefined;

// 兩邊的紀錄合併：同一天取比較多的那筆，總數取大的；偏好以雲端為準（那是「這個帳號」的設定）
function mergeHistory(a: DailyHistoryEntry[], b: DailyHistoryEntry[]): DailyHistoryEntry[] {
  const byDate = new Map<string, DailyHistoryEntry>();
  for (const entry of [...a, ...b]) {
    const prev = byDate.get(entry.date);
    byDate.set(entry.date, {
      date: entry.date,
      focusedSeconds: Math.max(prev?.focusedSeconds ?? 0, entry.focusedSeconds),
      completedSessions: Math.max(prev?.completedSessions ?? 0, entry.completedSessions),
    });
  }
  return [...byDate.values()].sort((x, y) => x.date.localeCompare(y.date));
}

function mergeProgress(local: SyncedProgress, cloud: SyncedProgress | undefined): SyncedProgress {
  if (!cloud) return local;
  const sameDay = local.todayKey === cloud.todayKey;
  // 雲端的「今天」如果是更早的日子，就當作歷史紀錄
  const cloudHistory = sameDay
    ? cloud.history
    : [...cloud.history, { date: cloud.todayKey, focusedSeconds: cloud.todayFocusedSeconds, completedSessions: cloud.todayCompletedSessions }];
  return {
    todayKey: local.todayKey,
    todayFocusedSeconds: sameDay ? Math.max(local.todayFocusedSeconds, cloud.todayFocusedSeconds) : local.todayFocusedSeconds,
    todayCompletedSessions: sameDay ? Math.max(local.todayCompletedSessions, cloud.todayCompletedSessions) : local.todayCompletedSessions,
    history: mergeHistory(local.history, cloudHistory).filter((e) => e.date !== local.todayKey),
    lifetimeSessions: Math.max(local.lifetimeSessions, cloud.lifetimeSessions),
  };
}

function isCloudData(value: unknown): value is CloudData {
  return !!value && typeof value === 'object' && (value as CloudData).v === 1 && typeof (value as CloudData).progress === 'object';
}

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(session.value ? { Authorization: `Bearer ${session.value}` } : {}), ...init.headers },
  });
}

export function useAccount() {
  const prefs = usePlayerPrefs();
  const store = usePomodoroStore();

  function localData(): CloudData {
    let displayName: string | undefined;
    try {
      displayName = localStorage.getItem(DISPLAY_NAME_KEY) ?? undefined;
    } catch {
      displayName = undefined;
    }
    return { v: 1, prefs: { ...prefs.value }, progress: store.syncSnapshot(), ...(displayName ? { displayName } : {}) };
  }

  // 把雲端那份合併進來、套用在這台裝置，回傳合併後要再上傳的那份
  function mergeIn(cloud: unknown): CloudData {
    const local = localData();
    if (!isCloudData(cloud)) return local;
    const merged: CloudData = {
      v: 1,
      prefs: { ...local.prefs, ...cloud.prefs },
      progress: mergeProgress(local.progress, cloud.progress),
      ...(cloud.displayName || local.displayName ? { displayName: cloud.displayName || local.displayName } : {}),
    };
    prefs.value = merged.prefs;
    store.applySynced(merged.progress);
    if (merged.displayName) {
      try {
        localStorage.setItem(DISPLAY_NAME_KEY, merged.displayName);
      } catch {
        // ignore storage errors
      }
    }
    return merged;
  }

  async function upload(data: CloudData = localData()): Promise<void> {
    if (!session.value) return;
    const res = await request('/api/v1/me/data', { method: 'PUT', body: JSON.stringify(data) });
    if (res.status === 401) forgetSession();
  }

  function forgetSession(): void {
    session.value = '';
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore storage errors
    }
  }

  // 登入成功：合併、上傳，換成帳號的身分後重新整理（座位歸屬跟著身分走）
  async function loginWithGoogle(credential: string): Promise<boolean> {
    const res = await request('/api/v1/auth/google', { method: 'POST', body: JSON.stringify({ credential }) });
    if (!res.ok) return false;
    const body = (await res.json()) as { token: string; userId: string; data: unknown };
    session.value = body.token;
    localStorage.setItem(SESSION_KEY, body.token);
    await upload(mergeIn(body.data));
    localStorage.setItem(USER_ID_KEY, body.userId);
    window.location.reload();
    return true;
  }

  // 登出：這台裝置換回匿名身分，資料留在本機
  function logout(): void {
    forgetSession();
    localStorage.setItem(USER_ID_KEY, `user_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`);
    window.location.reload();
  }

  async function deleteAccount(): Promise<boolean> {
    const res = await request('/api/v1/me', { method: 'DELETE' });
    if (!res.ok) return false;
    logout();
    return true;
  }

  // 開頁面時：已登入就把雲端最新的合併進來，之後本機有變動就（節流後）上傳
  async function startSync(): Promise<void> {
    if (started || !session.value) return;
    started = true;
    syncing.value = true;
    try {
      const res = await request('/api/v1/me');
      if (res.status === 401) {
        forgetSession();
        return;
      }
      if (res.ok) {
        const body = (await res.json()) as { data: unknown };
        await upload(mergeIn(body.data));
      }
    } catch {
      // 連不上就先用本機的，下次再同步
    } finally {
      syncing.value = false;
    }
    watch(
      () => [JSON.stringify(prefs.value), store.todayCompletedSessions, store.lifetimeSessions, Math.floor(store.todayFocusedSeconds / 60)],
      () => {
        window.clearTimeout(syncTimer);
        syncTimer = window.setTimeout(() => void upload(), SYNC_DEBOUNCE_MS);
      },
    );
    window.addEventListener('pagehide', () => {
      if (!session.value) return;
      // 關頁面時盡量送最後一次（keepalive 讓請求在頁面關掉後還能送完）
      void fetch(`${apiBase()}/api/v1/me/data`, {
        method: 'PUT',
        keepalive: true,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.value}` },
        body: JSON.stringify(localData()),
      });
    });
  }

  return { session, syncing, loginWithGoogle, logout, deleteAccount, startSync };
}
