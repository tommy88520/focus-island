import { isSceneId, type SceneId } from 'src/pages/index/sceneRemotes';
// 「分享我的位置」連結：?meet=2-A&scene=library&x=12.4&y=5.1&n=名字
// 朋友打開就到同一層、同一分區、同一張地圖，站在分享的人旁邊。

// home 不能分享（只用在重整後回到自己家）
export type ShareScene = 'library' | SceneId;

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
  const scene: ShareScene = isSceneId(sceneRaw) && sceneRaw !== 'home' ? sceneRaw : 'library';
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

// ── 重新整理後回到原本那張獨立地圖（F1／環河公園／北投）、原本站的地方 ──
type SeparateScene = Exclude<ShareScene, 'library'>;
const SCENE_KEY = 'focus_island_scene_v1';
const SCENE_TTL_MS = 12 * 60 * 60_000;
let lastRemembered = -Infinity;

// 獨立地圖每格叫一次，最多每秒寫一次；坐著就不記位置（重整後那張地圖會自己坐回座位）
export function rememberScene(scene: SeparateScene, at: { x: number; y: number }, seated: boolean, seconds: number): void {
  if (seconds - lastRemembered < 1) return;
  lastRemembered = seconds;
  try {
    localStorage.setItem(SCENE_KEY, JSON.stringify({ scene, x: Math.round(at.x * 10) / 10, y: Math.round(at.y * 10) / 10, seated, at: Date.now() }));
  } catch {
    // 無痕模式等：記不住就算了
  }
}

export function forgetScene(): void {
  lastRemembered = -Infinity;
  try {
    localStorage.removeItem(SCENE_KEY);
  } catch {
    // 同上
  }
}

// 載入時讀一次：上次人在獨立地圖就回那張，站著的話站回原地
export function takeSavedScene(): SeparateScene | null {
  try {
    const saved = JSON.parse(localStorage.getItem(SCENE_KEY) ?? 'null') as { scene?: unknown; x?: unknown; y?: unknown; seated?: unknown; at?: unknown } | null;
    if (!saved || typeof saved.at !== 'number' || Date.now() - saved.at > SCENE_TTL_MS) return null;
    if (!isSceneId(saved.scene)) return null;
    // 抵達時 placeNear 會先往右站一格（分享連結是站在朋友旁邊），這裡先減掉，站回自己原本的位置
    // 分享連結帶來的抵達點優先
    if (!pendingArrival && !saved.seated && typeof saved.x === 'number' && typeof saved.y === 'number') pendingArrival = { scene: saved.scene, x: saved.x - 1, y: saved.y };
    return saved.scene;
  } catch {
    return null;
  }
}
