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
