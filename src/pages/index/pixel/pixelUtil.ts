// 像素畫共用的小工具

export function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

export function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// 畫布用幾倍的螢幕像素：iPhone 是 3 倍，只畫 2 倍的話瀏覽器會把整張圖再放大 1.5 倍，看起來糊
export function canvasDpr(): number {
  return Math.min(window.devicePixelRatio || 1, 3);
}

// 預先畫好的圖（地圖底圖、有字的建築）：照螢幕上實際放大的倍數畫，招牌的字、霓虹線、圓弧才清楚；
// 方塊照樣是方塊，像素風不變。以前用 1 倍畫再放大 4～6 倍，字和斜線會糊成一塊塊的。
// 圖太大就把倍數除以整數（6 → 3、2），貼上去剛好放大整數倍，方塊還是一樣大。手機單張畫布有上限（iPhone 約 1,600 萬像素）
function maxLayerPixels(): number {
  return window.matchMedia('(pointer: coarse)').matches ? 12_000_000 : 40_000_000;
}

// 開一張 w×h（世界座標 px）的圖，照 target 倍畫：回傳的 c 已經縮放好，照世界座標畫就好
export function layerCanvas(w: number, h: number, target: number): { canvas: HTMLCanvasElement; c: CanvasRenderingContext2D | null } {
  const limit = Math.sqrt(maxLayerPixels() / (w * h));
  let res = Math.max(1, target);
  for (let k = 2; res > limit && target / k >= 1; k += 1) res = target / k;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * res);
  canvas.height = Math.round(h * res);
  const c = canvas.getContext('2d');
  c?.scale(canvas.width / w, canvas.height / h);
  layerSizes.set(canvas, { w, h });
  return { canvas, c };
}

// layerCanvas 開的圖原本（世界座標）多大；不是它開的就是畫布本身的大小
const layerSizes = new WeakMap<HTMLCanvasElement, { w: number; h: number }>();
export function layerSize(canvas: HTMLCanvasElement): { w: number; h: number } {
  return layerSizes.get(canvas) ?? { w: canvas.width, h: canvas.height };
}

// 貼回世界座標 (x, y)、原本的大小 w×h
export function drawLayer(ctx: CanvasRenderingContext2D, layer: HTMLCanvasElement, x: number, y: number, w: number, h: number): void {
  ctx.drawImage(layer, x, y, w, h);
}

// 有字的小圖（建築招牌）用幾倍畫：最常見的放大倍數（畫面 2～3 倍 × 螢幕 2～3 倍），最多 6
export function spriteRes(): number {
  return Math.min(6, Math.ceil(canvasDpr() * 3));
}

// 像素圓：一列一列填，邊緣是鋸齒而不是糊邊
export function disc(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number): void {
  for (let row = -r; row <= r; row += 1) {
    const half = Math.floor(Math.sqrt(r * r - row * row));
    px(ctx, color, cx - half, cy + row, half * 2 + 1, 1);
  }
}

// 名牌（canvas 上的膠囊）裡的字：自己排版。iPhone 畫 emoji（🛏️ ♨️ 🚇…）比 measureText 量到的寬，
// 交給 textAlign: center 排的話字會被擠出框。所以 emoji 給固定寬度的格子、一般字照量到的寬，從左邊一段段畫。
const EMOJI_RUN = /(\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic})*\uFE0F?)/u;
const IS_EMOJI = /\p{Extended_Pictographic}/u;

function pillSegments(c: CanvasRenderingContext2D, text: string): { s: string; emoji: boolean; w: number }[] {
  const size = Number(/(\d+)px/.exec(c.font)?.[1] ?? 12);
  return text
    .split(EMOJI_RUN)
    .filter(Boolean)
    .map((s) => {
      const emoji = IS_EMOJI.test(s);
      return { s, emoji, w: emoji ? Math.round(size * 1.35) : c.measureText(s).width };
    });
}

export function pillTextWidth(c: CanvasRenderingContext2D, text: string): number {
  return Math.ceil(pillSegments(c, text).reduce((sum, seg) => sum + seg.w, 0));
}

// 把字畫在 (cx, midY) 正中間（呼叫前先設好 font、fillStyle）
export function fillPillText(c: CanvasRenderingContext2D, text: string, cx: number, midY: number): void {
  const segs = pillSegments(c, text);
  let x = cx - segs.reduce((sum, seg) => sum + seg.w, 0) / 2;
  c.textBaseline = 'middle';
  for (const seg of segs) {
    c.textAlign = seg.emoji ? 'center' : 'left';
    c.fillText(seg.s, seg.emoji ? x + seg.w / 2 : x, midY);
    x += seg.w;
  }
  c.textAlign = 'left';
}
