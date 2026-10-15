// 後端網址：在正式網址上一律連 focus-api（不管 build 時的環境變數），
// 這樣不管拿到哪一份前端（換主機的過渡期，有人的瀏覽器還在用舊主機那份），大家都連同一個後端、進同一個房間。
const OFFICIAL_HOSTS = ['focus-island.huangyanming.com', 'focus-island-home.huangyanming.com'];
const OFFICIAL_API = 'https://focus-api.huangyanming.com';
const OFFICIAL_WS = 'wss://focus-api.huangyanming.com';

function onOfficialHost(): boolean {
  return typeof window !== 'undefined' && OFFICIAL_HOSTS.includes(window.location.hostname);
}

export function backendApiUrl(): string | undefined {
  return onOfficialHost() ? OFFICIAL_API : (import.meta.env.VITE_BACKEND_API_URL as string | undefined);
}

export function backendWsUrl(): string | undefined {
  return onOfficialHost() ? OFFICIAL_WS : (import.meta.env.VITE_BACKEND_WS_URL as string | undefined);
}
