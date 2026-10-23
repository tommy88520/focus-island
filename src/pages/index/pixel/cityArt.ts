// 各城市地圖共用的小美術：文字、光暈、快取小圖、路面（柏油、地磚、紅磚、斑馬線）、老街屋、停著的機車、行道樹、路燈、小吃攤車。
// 每個城市自己的地標放在自己的 xxxArt.ts。
import type { Rect } from './city';
import { layerCanvas, layerSize, px, seeded, spriteRes } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';

export const T = 16;
export const FONT_TC = '"PingFang TC", "Noto Sans TC", sans-serif';
export const SERIF_TC = '"PingFang TC", "Noto Serif TC", "Noto Sans TC", serif';

export function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, font: string, align: CanvasTextAlign = 'center'): void {
  c.fillStyle = color;
  c.font = font;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(s, x, y);
}

export function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

export function cached(key: string, w: number, h: number, paint: (c: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const hit = spriteCache.get(key);
  if (hit) return hit;
  const { canvas, c } = layerCanvas(w, h, spriteRes());
  if (c) paint(c);
  spriteCache.set(key, canvas);
  return canvas;
}
const spriteCache = new Map<string, HTMLCanvasElement>();

export function blit(c: CanvasRenderingContext2D, s: HTMLCanvasElement, x: number, bottom: number): void {
  const size = layerSize(s);
  c.drawImage(s, Math.round(x), Math.round(bottom - size.h), size.w, size.h);
}

export function road(c: CanvasRenderingContext2D, r: Rect, rand: () => number): void {
  px(c, '#4a4d55', r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T);
  const dots = Math.floor((r.x1 - r.x0) * (r.y1 - r.y0) * 3);
  for (let i = 0; i < dots; i += 1) px(c, rand() < 0.5 ? '#42454c' : '#52555e', Math.floor(r.x0 * T + rand() * (r.x1 - r.x0) * T), Math.floor(r.y0 * T + rand() * (r.y1 - r.y0) * T), 2, 1);
}

export function tiles(c: CanvasRenderingContext2D, r: Rect, base: string, line: string, size = 8): void {
  px(c, base, r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T);
  for (let x = r.x0 * T; x < r.x1 * T; x += size) px(c, line, Math.round(x), r.y0 * T, 1, (r.y1 - r.y0) * T);
  for (let y = r.y0 * T; y < r.y1 * T; y += size) px(c, line, r.x0 * T, Math.round(y), (r.x1 - r.x0) * T, 1);
}

// 紅磚步道：一塊塊錯開的紅磚
export function brickPath(c: CanvasRenderingContext2D, r: Rect): void {
  px(c, '#b5553f', r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T);
  for (let y = r.y0 * T, row = 0; y < r.y1 * T; y += 4, row += 1) {
    px(c, '#9d4634', r.x0 * T, Math.round(y) + 3, (r.x1 - r.x0) * T, 1);
    for (let x = r.x0 * T + (row % 2) * 4; x < r.x1 * T; x += 8) px(c, '#9d4634', Math.round(x), Math.round(y), 1, 3);
  }
}

export function zebra(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, vertical: boolean): void {
  if (vertical) for (let y = y0 * T; y < y1 * T; y += 7) px(c, 'rgba(240,240,240,0.85)', x0 * T, Math.round(y), (x1 - x0) * T, 4);
  else for (let x = x0 * T; x < x1 * T; x += 7) px(c, 'rgba(240,240,240,0.85)', Math.round(x), y0 * T, 4, (y1 - y0) * T);
}

export const TOWN_WALLS = ['#e8dcc4', '#d9e4d6', '#f0d2c0', '#e3d6b8', '#d6dde6', '#ecd9a8'];
export const SIGN_WORDS = ['布莊', '中藥行', '茶行', '鐘錶', '五金', '書局', '刻印', '眼鏡', '香舖'];
export const SIGN_COLORS = ['#c62828', '#1f5fa8', '#2a7a46', '#8a3aa8', '#d97a1a'];

// 一般的老街屋（2～3 樓、騎樓、鐵窗、二樓招牌）：key 前綴分開各城市的快取，words 是招牌上的字
export interface Townhouse {
  x0: number;
  x1: number;
  floors: number;
  seed: number;
}
export function townhouseSprite(prefix: string, b: Townhouse, words: string[] = SIGN_WORDS, sign = true): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const floorH = 14;
  const ground = 20;
  const h = ground + b.floors * floorH + 10;
  return cached(`${prefix}-house-${b.seed}`, w, h, (c) => {
    const rand = seeded(b.seed);
    const wall = TOWN_WALLS[Math.floor(rand() * TOWN_WALLS.length)] ?? '#e8dcc4';
    // 女兒牆：有的是巴洛克山牆（中間一塊弧形、兩邊小柱）
    const fancy = rand() < 0.5;
    px(c, wall, 0, 4, w, h - 4);
    px(c, 'rgba(0,0,0,0.12)', 0, 4, w, 1);
    if (fancy) {
      c.fillStyle = wall;
      c.beginPath();
      c.moveTo(w / 2 - 14, 6);
      c.quadraticCurveTo(w / 2, -2, w / 2 + 14, 6);
      c.fill();
      px(c, '#c9b48a', w / 2 - 4, 1, 8, 4);
      px(c, 'rgba(0,0,0,0.15)', 2, 4, 3, 8);
      px(c, 'rgba(0,0,0,0.15)', w - 5, 4, 3, 8);
    }
    px(c, 'rgba(0,0,0,0.18)', 0, 10, w, 2);
    // 樓上的窗：木框、綠色或白色的窗、鐵窗花
    const upperBottom = h - ground;
    for (let f = 0; f < b.floors; f += 1) {
      const fy = 12 + f * floorH;
      for (let cx = 4; cx + 10 <= w - 3; cx += 13) {
        px(c, '#5a4636', cx - 1, fy, 12, 10);
        px(c, rand() < 0.5 ? '#9fc7c9' : '#c9dbe6', cx, fy + 1, 10, 8);
        px(c, 'rgba(255,255,255,0.45)', cx + 1, fy + 2, 3, 2);
        for (let k = 1; k < 10; k += 3) px(c, 'rgba(40,40,45,0.55)', cx + k, fy + 1, 1, 8);
        if (rand() < 0.25) {
          // 冷氣、盆栽
          px(c, '#e8e8ea', cx + 1, fy + 10, 8, 3);
          px(c, '#4f8a3c', cx + 2, fy + 8, 3, 2);
        }
      }
      px(c, 'rgba(0,0,0,0.12)', 0, fy + floorH - 3, w, 1);
    }
    // 二樓的招牌
    if (sign) {
      const word = words[Math.floor(rand() * words.length)] ?? '布莊';
      const col = SIGN_COLORS[Math.floor(rand() * SIGN_COLORS.length)] ?? '#c62828';
      px(c, '#ffffff', 3, upperBottom - 9, w - 6, 8);
      px(c, col, 3, upperBottom - 9, w - 6, 1);
      text(c, word, w / 2, upperBottom - 4.5, col, `900 7px ${FONT_TC}`);
    }
    // 騎樓：柱子、裡面暗暗的店面、亮著燈的櫃台
    px(c, '#3a2e28', 0, upperBottom, w, ground);
    px(c, rand() < 0.5 ? '#f6dfae' : '#e9e3d1', 4, upperBottom + 5, w - 8, ground - 7);
    for (let k = 6; k < w - 6; k += 6) px(c, rand() < 0.5 ? '#c98a3c' : '#7a9a5a', k, upperBottom + 10, 4, 3);
    for (let k = 0; k < w; k += Math.max(14, Math.floor(w / 3))) px(c, wall, k, upperBottom, 3, ground);
    px(c, wall, w - 3, upperBottom, 3, ground);
    px(c, 'rgba(0,0,0,0.3)', 0, upperBottom, w, 2);
  });
}

// 騎樓前停的一排機車（臺灣街頭的日常）
export const SCOOTER_COLORS = ['#e25a4a', '#f2f2f2', '#3b82f6', '#15171f', '#8bd3c7', '#f6c945'];
export function drawParkedScooter(c: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 4, by - 1, 9, 2);
  px(c, '#15171f', cx - 2, by - 3, 4, 3);
  px(c, '#15171f', cx - 2, by - 18, 4, 3);
  px(c, color, cx - 4, by - 15, 8, 12);
  px(c, 'rgba(255,255,255,0.35)', cx - 4, by - 15, 1, 12);
  px(c, '#2b2d33', cx - 3, by - 11, 6, 5);
  px(c, '#c9ccd6', cx - 5, by - 17, 10, 1);
}

export function drawStreetTree(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 9, by - 1, 18, 3);
  px(c, '#5c3d22', cx - 2, by - 14, 4, 14);
  const blobs: [number, number, number, string][] = [
    [-6, -22, 8, '#3d7a3c'],
    [6, -22, 8, '#3d7a3c'],
    [0, -28, 9, '#4c8a46'],
    [0, -20, 7, '#5a9a52'],
  ];
  for (const [dx, dy, r, col] of blobs) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#7ab86a', cx - 3, by - 31, 3, 2);
}

export function drawLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  px(c, '#3d424c', cx, by - 28, 2, 28);
  px(c, '#545a66', cx, by - 28, 1, 28);
  px(c, '#2f333b', cx - 1, by - 30, 8, 3);
  px(c, night ? '#fff1a8' : '#d8d2b8', cx + 3, by - 27, 4, 1);
}


// 小吃攤車：遮陽棚、招牌、檯面上的食物、後面的老闆（面向客人）；x、y 是檯面前緣中間（格）
export function drawFoodCart(c: CanvasRenderingContext2D, x: number, y: number, name: string, awning: string, food: string[], seconds: number, ownerSeed: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const w = 40;
  const x0 = cx - w / 2;
  px(c, 'rgba(0,0,0,0.22)', x0, by, w, 3);
  // 老闆
  const owner = getAvatarFrame(lookColors(ownerSeed % 5, 4 + (ownerSeed % 3), { body: ownerSeed % 2 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - owner.width / 2), by - 10 - owner.height + 6);
  // 遮陽棚的柱子、條紋棚
  px(c, '#5a5d66', x0 + 2, by - 34, 2, 34);
  px(c, '#5a5d66', x0 + w - 4, by - 34, 2, 34);
  for (let k = 0; k < w + 4; k += 6) px(c, (k / 6) % 2 === 0 ? awning : '#f4f1e8', x0 - 2 + k, by - 38, 6, 6);
  px(c, 'rgba(0,0,0,0.2)', x0 - 2, by - 32, w + 4, 1);
  // 檯面、前板（白鐵）＋招牌
  px(c, '#9aa3b2', x0, by - 12, w, 4);
  px(c, '#d6dae2', x0, by - 12, w, 1);
  px(c, '#c9ccd6', x0, by - 8, w, 8);
  px(c, '#ffffff', x0 + 4, by - 7, w - 8, 6);
  text(c, name, cx, by - 4, awning, `900 ${name.length > 4 ? 4 : 5}px ${FONT_TC}`);
  // 食物（一格格）＋冒煙
  food.forEach((col, k) => px(c, col, x0 + 4 + k * Math.floor((w - 8) / Math.max(1, food.length)), by - 15, 6, 3));
  for (let k = 0; k < 2; k += 1) {
    const t = (seconds * 0.6 + k / 2) % 1;
    px(c, `rgba(255,255,255,${0.4 * (1 - t)})`, Math.round(cx - 6 + k * 10 + Math.sin(seconds * 2 + k) * 2), Math.round(by - 18 - t * 12), 3, 2);
  }
}

// 長椅（木頭座板＋鐵腳）：面向下的人坐在上面；x 是中間（格）
export function drawBench(c: CanvasRenderingContext2D, x: number, y: number, w = 1.6): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const half = Math.round((w * T) / 2);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 1, half * 2, 2);
  px(c, '#8a5a32', cx - half, by - 12, half * 2, 3);
  px(c, '#a8703f', cx - half, by - 12, half * 2, 1);
  px(c, '#8a5a32', cx - half, by - 4, half * 2, 4);
  px(c, '#b5804a', cx - half, by - 4, half * 2, 1);
  px(c, '#3a3d45', cx - half + 2, by, 2, 2);
  px(c, '#3a3d45', cx + half - 4, by, 2, 2);
  px(c, '#3a3d45', cx - half + 2, by - 9, 2, 5);
  px(c, '#3a3d45', cx + half - 4, by - 9, 2, 5);
}
