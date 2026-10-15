// 「分享我的位置」連結：?meet=2-A&scene=library&x=12.4&y=5.1&n=名字
// 朋友打開就到同一層、同一分區、同一張地圖，站在分享的人旁邊。

export type ShareScene = 'library' | 'f1' | 'park';

export interface SharedLocation {
  floor: number;
  zoneId: string;
  scene: ShareScene;
  x: number;
  y: number;
  name: string;
}

const SHARE_PARAMS = ['meet', 'scene', 'x', 'y', 'n'];
// 抵達 F1／環河公園時要站的位置：那兩張地圖掛載時各自讀一次就清掉
let pendingArrival: { scene: ShareScene; x: number; y: number } | null = null;

export function buildShareLink(location: SharedLocation): string {
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('meet', `${location.floor}-${location.zoneId}`);
  url.searchParams.set('scene', location.scene);
  url.searchParams.set('x', location.x.toFixed(1));
  url.searchParams.set('y', location.y.toFixed(1));
  if (location.name) url.searchParams.set('n', location.name.slice(0, 40));
  return url.toString();
}

// 讀網址上的分享位置，讀完就從網址拿掉（重新整理不會一直被拉回去）
export function takeSharedLocation(): SharedLocation | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const meet = params.get('meet');
  if (!meet) return null;
  const sceneRaw = params.get('scene');
  const x = Number(params.get('x'));
  const y = Number(params.get('y'));
  const name = (params.get('n') ?? '').slice(0, 40);
  for (const key of SHARE_PARAMS) params.delete(key);
  const rest = params.toString();
  window.history.replaceState(window.history.state, '', window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash);

  const matched = meet.match(/^(\d{1,2})-([A-Za-z])$/);
  if (!matched || !Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 100 || Math.abs(y) > 100) return null;
  const scene: ShareScene = sceneRaw === 'f1' || sceneRaw === 'park' ? sceneRaw : 'library';
  const location = { floor: Number(matched[1]), zoneId: (matched[2] ?? 'A').toUpperCase(), scene, x, y, name };
  if (scene !== 'library') pendingArrival = { scene, x, y };
  return location;
}

// F1／環河公園掛載時來拿：是分享連結帶過來的就站到那裡（只拿一次）
export function takeArrival(scene: ShareScene): { x: number; y: number } | null {
  if (!pendingArrival || pendingArrival.scene !== scene) return null;
  const { x, y } = pendingArrival;
  pendingArrival = null;
  return { x, y };
}
