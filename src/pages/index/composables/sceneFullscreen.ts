import { computed, ref } from 'vue';

// 地圖全螢幕：整塊地圖蓋滿畫面（能用瀏覽器全螢幕就順便用，藏掉網址列）。
// 手機一律橫的看：能鎖方向就鎖（Android），鎖不了（iPhone）而且手機是直拿的，就把地圖整塊轉 90 度。
export const sceneFullscreen = ref(false);
const portraitTouch = ref(false);
export const sceneRotated = computed(() => sceneFullscreen.value && portraitTouch.value);

let shell: HTMLElement | null = null;

function updatePortrait(): void {
  const touch = window.matchMedia('(pointer: coarse)').matches;
  portraitTouch.value = touch && window.innerHeight > window.innerWidth;
}

function onFullscreenChange(): void {
  // 使用者用返回鍵／Esc 離開瀏覽器全螢幕：地圖也跟著退出
  if (!document.fullscreenElement && sceneFullscreen.value) void exitSceneFullscreen();
}

export async function enterSceneFullscreen(el: HTMLElement): Promise<void> {
  shell = el;
  sceneFullscreen.value = true;
  updatePortrait();
  window.addEventListener('resize', updatePortrait);
  try {
    if (el.requestFullscreen && !document.fullscreenElement) {
      await el.requestFullscreen({ navigationUI: 'hide' });
      document.addEventListener('fullscreenchange', onFullscreenChange);
    }
  } catch {
    // iPhone 不支援元素全螢幕：照樣用蓋滿畫面的版本
  }
  if (window.matchMedia('(pointer: coarse)').matches) {
    try {
      await (screen.orientation as ScreenOrientation & { lock?: (o: string) => Promise<void> }).lock?.('landscape');
    } catch {
      // 鎖不了方向：直拿時靠 sceneRotated 把地圖轉過來
    }
  }
  updatePortrait();
}

export async function exitSceneFullscreen(): Promise<void> {
  sceneFullscreen.value = false;
  window.removeEventListener('resize', updatePortrait);
  document.removeEventListener('fullscreenchange', onFullscreenChange);
  try {
    screen.orientation?.unlock?.();
  } catch {
    // ignore
  }
  if (document.fullscreenElement && document.fullscreenElement === shell) {
    try {
      await document.exitFullscreen();
    } catch {
      // ignore
    }
  }
  shell = null;
}

// 手指／滑鼠在畫面上的位置換成元件自己的座標（轉了 90 度時也對）。只給地圖裡的元件用。
export function localPoint(el: Element, clientX: number, clientY: number): { x: number; y: number; width: number; height: number } {
  const r = el.getBoundingClientRect();
  if (!sceneRotated.value) return { x: clientX - r.left, y: clientY - r.top, width: r.width, height: r.height };
  return { x: clientY - r.top, y: r.right - clientX, width: r.height, height: r.width };
}
