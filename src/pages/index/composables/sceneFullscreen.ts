import { computed, nextTick, ref } from 'vue';

// 地圖全螢幕：整塊地圖蓋滿畫面（能用瀏覽器全螢幕就順便用，藏掉網址列）。
// 手機一律橫的看：能鎖方向就鎖（Android），鎖不了（iPhone）而且手機是直拿的，就把地圖整塊轉 90 度。
export const sceneFullscreen = ref(false);
const portraitTouch = ref(false);
export const sceneRotated = computed(() => sceneFullscreen.value && portraitTouch.value);
// 手機上沒拿到瀏覽器全螢幕（iPhone）：Safari 的網址列浮在畫面最下面，要讓出一條，不然搖桿、按鈕會被它蓋住
const realFullscreen = ref(false);
// 從主畫面書籤開的（App 模式）沒有網址列，不用讓
export const sceneNeedsBarGap = computed(() => sceneFullscreen.value && touchDevice() && !realFullscreen.value && !standaloneApp());

function standaloneApp(): boolean {
  return (navigator as Navigator & { standalone?: boolean }).standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

function touchDevice(): boolean {
  return window.matchMedia('(pointer: coarse)').matches;
}

let shell: HTMLElement | null = null;

// 全螢幕時後面的整頁不能捲：iPhone Safari 不認 touch-action: none，手指在地圖上一拖它就去捲頁面，搖桿的觸控就被取消了
function blockPageScroll(event: TouchEvent): void {
  // 展開的計時／音樂列（音量滑桿）照常
  if (event.target instanceof Element && event.target.closest('.fs-dock, input')) return;
  if (event.cancelable) event.preventDefault();
}

// 從主畫面的書籤（App 模式）開、手機轉橫時，iPhone 會把整頁往下推一截（scrollY 變負的），
// 畫面上看到的搖桿跟手指實際按到的位置就差了幾十點，按不到。全螢幕時把整頁釘在最上面，轉向時再歸零一次
let savedScrollY = 0;
function resetScroll(): void {
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

function lockPage(lock: boolean): void {
  const html = document.documentElement.style;
  const body = document.body.style;
  if (lock) {
    savedScrollY = window.scrollY;
    resetScroll();
  }
  html.overflow = lock ? 'hidden' : '';
  html.overscrollBehavior = lock ? 'none' : '';
  body.overflow = lock ? 'hidden' : '';
  body.position = lock ? 'fixed' : '';
  body.top = lock ? '0' : '';
  body.left = lock ? '0' : '';
  body.width = lock ? '100%' : '';
  if (!lock) window.scrollTo(0, savedScrollY);
}

function updatePortrait(): void {
  portraitTouch.value = touchDevice() && window.innerHeight > window.innerWidth;
  realFullscreen.value = !!document.fullscreenElement;
  if (sceneFullscreen.value) {
    resetScroll();
    // iPhone 轉向的動畫跑完才會把頁面推下去：等一下再歸零一次
    window.setTimeout(resetScroll, 400);
  }
}

function onFullscreenChange(): void {
  // 使用者用返回鍵／Esc 離開瀏覽器全螢幕：地圖也跟著退出
  if (!document.fullscreenElement && sceneFullscreen.value) void exitSceneFullscreen();
}

export async function enterSceneFullscreen(el: HTMLElement): Promise<void> {
  shell = el;
  sceneFullscreen.value = true;
  lockPage(true);
  el.addEventListener('touchmove', blockPageScroll, { passive: false });
  updatePortrait();
  window.addEventListener('resize', updatePortrait);
  // 先等地圖搬到 body 底下再要瀏覽器全螢幕（全螢幕中的元素被搬動會直接退出）
  await nextTick();
  try {
    if (el.requestFullscreen && !document.fullscreenElement) {
      await el.requestFullscreen({ navigationUI: 'hide' });
      document.addEventListener('fullscreenchange', onFullscreenChange);
    }
  } catch {
    // iPhone 不支援元素全螢幕：照樣用蓋滿畫面的版本
  }
  if (touchDevice()) {
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
  realFullscreen.value = false;
  lockPage(false);
  shell?.removeEventListener('touchmove', blockPageScroll);
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
