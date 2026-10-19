// 大獎賽地圖的地標與賽道設施（夜景）：每個地標畫在自己的格子範圍裡，高的部分往上長（照 y1 排前後）。
// 都是用程式畫的像素圖，顏色照實景的夜間燈光：101 依星期幾換顏色、大巨蛋紫色燈帶、85 大樓白色輪廓…
import type { Landmark, Rect } from './circuits';
import { px, seeded } from './pixelUtil';
import { drawF1Car } from './f1Car';

const T = 16;
const TEAM = [
  { body: '#d72d2d', accent: '#f6c945' },
  { body: '#2fb3a6', accent: '#2b2d33' },
  { body: '#f2a541', accent: '#5b6ee1' },
  { body: '#3b4fbf', accent: '#e25a4a' },
  { body: '#e8e8ee', accent: '#2fb3a6' },
  { body: '#4fa35a', accent: '#f6c945' },
  { body: '#8b5cf6', accent: '#f4f4f4' },
  { body: '#f06292', accent: '#2b2d33' },
];

// 101 每天晚上的燈色：星期日紫、一紅、二橙、三黃、四綠、五藍、六靛
const DAY_COLORS = ['#b77bff', '#ff4d5e', '#ff9a3d', '#ffe14d', '#4dff88', '#4dc3ff', '#7b7bff'];

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, alpha: number): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color.replace('ALPHA', String(alpha)));
  g.addColorStop(1, color.replace('ALPHA', '0'));
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

function litWindows(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, colors: string[], dark: string, cw = 2, ch = 3, gx = 4, gy = 5, chance = 0.62): void {
  const rand = seeded(seed);
  for (let wy = y + 2; wy + ch <= y + h - 1; wy += gy) {
    for (let wx = x + 2; wx + cw <= x + w - 1; wx += gx) {
      px(c, rand() < chance ? (colors[Math.floor(rand() * colors.length)] ?? '#ffe6a3') : dark, wx, wy, cw, ch);
    }
  }
}

function shadow(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  px(c, 'rgba(0,0,0,0.35)', x + 3, y - 2, w, 5);
}

// 101：底下購物中心、台座、八節「竹節」（每節下窄上寬）、頂上的塔尖；每節轉角的燈依星期幾換色
function tower101(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const base = l.y1 * T;
  const cx = Math.round(x + w / 2);
  const day = DAY_COLORS[new Date().getDay()] ?? '#4dc3ff';
  shadow(c, x, base, w);
  // 購物中心：三層玻璃，暖色燈
  px(c, '#1f2a40', x + 2, base - 30, w - 4, 30);
  px(c, '#33405e', x + 2, base - 30, w - 4, 2);
  litWindows(c, x + 2, base - 27, w - 4, 20, 101, ['#ffe2a0', '#ffd27a', '#fff0c8'], '#26324c', 3, 3, 5, 6, 0.8);
  px(c, '#ffd98a', cx - 10, base - 9, 20, 9);
  px(c, '#2a3550', cx - 1, base - 9, 2, 9);
  px(c, '#3a4766', cx - 14, base - 11, 28, 2);
  // 台座：梯形、四個如意裝飾
  for (let row = 0; row < 26; row += 1) {
    const rw = 46 - Math.round(row * 0.35);
    px(c, row % 5 === 0 ? '#215057' : '#2c6870', cx - rw / 2, base - 30 - row, rw, 1);
  }
  for (const dx of [-16, -6, 4, 14]) {
    px(c, '#c9a24a', cx + dx, base - 46, 3, 3);
    px(c, '#f2d27a', cx + dx + 1, base - 46, 1, 1);
  }
  px(c, day, cx - 23, base - 56, 2, 26);
  px(c, day, cx + 21, base - 56, 2, 26);
  // 八節竹節
  const segH = 18;
  for (let i = 0; i < 8; i += 1) {
    const bottom = base - 56 - i * segH;
    for (let row = 0; row < segH; row += 1) {
      const rw = 30 + Math.round((row / segH) * 9);
      const yy = bottom - row;
      px(c, '#2b6b72', cx - rw / 2, yy, rw, 1);
      px(c, '#3d8c92', cx - rw / 2, yy, Math.round(rw * 0.4), 1);
      px(c, '#1e4d53', cx + rw / 2 - 5, yy, 5, 1);
      if (row % 3 === 1) px(c, 'rgba(160, 230, 230, 0.35)', cx - rw / 2 + 3, yy, rw - 6, 1);
      // 轉角的燈
      px(c, day, cx - rw / 2, yy, 1, 1);
      px(c, day, cx + rw / 2 - 1, yy, 1, 1);
    }
    px(c, '#c9a24a', cx - 20, bottom - segH, 40, 1);
    // 窗戶裡零星的燈
    const rand = seeded(i * 11 + 3);
    for (let k = 0; k < 5; k += 1) px(c, '#e8fbff', cx - 12 + Math.floor(rand() * 24), bottom - 3 - Math.floor(rand() * 12), 2, 1);
  }
  // 頂部、塔尖
  const top = base - 56 - 8 * segH;
  px(c, '#2b6b72', cx - 10, top - 8, 20, 8);
  px(c, day, cx - 10, top - 8, 20, 1);
  px(c, '#2b6b72', cx - 6, top - 16, 12, 8);
  px(c, '#2b6b72', cx - 3, top - 22, 6, 6);
  px(c, '#cfd8dc', cx - 1, top - 50, 2, 28);
  px(c, '#ffffff', cx - 1, top - 50, 1, 28);
  if (Math.sin(seconds * 3) > 0) {
    px(c, '#ff4d4d', cx - 2, top - 53, 4, 3);
    glow(c, cx, top - 52, 8, 'rgba(255, 77, 77, ALPHA)', 0.5);
  }
}

// 台北大巨蛋：圓柱基座＋橢圓蛋殼、經緯格線，紫色燈帶慢慢流動
function dome(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const cx = x + w / 2;
  shadow(c, x, y1, w);
  // 前廣場
  px(c, '#3a3d4a', x, y1 - 10, w, 10);
  for (let k = x; k < x + w; k += 8) px(c, '#444857', k, y1 - 10, 1, 10);
  // 基座（一圈玻璃、亮著）
  const baseTop = y1 - 26;
  px(c, '#2a2340', x + 6, baseTop, w - 12, 16);
  litWindows(c, x + 6, baseTop + 2, w - 12, 12, 7, ['#e9d8ff', '#c4a0ff'], '#332a4d', 3, 4, 5, 6, 0.7);
  for (let k = 0; k < w - 12; k += 1) {
    const on = Math.sin(k * 0.2 - seconds * 3) > 0.2;
    px(c, on ? '#d4b4ff' : '#6b4fa8', x + 6 + k, baseTop - 2, 1, 2);
  }
  // 蛋殼：上亮下暗，畫一列一列的橢圓
  const rx = (w - 10) / 2;
  const ry = (l.y1 - l.y0) * T * 0.62;
  for (let row = 0; row < ry; row += 1) {
    const t = row / ry;
    const half = Math.round(rx * Math.sqrt(1 - t * t));
    const shade = t > 0.7 ? '#a99ccc' : t > 0.4 ? '#8a7cb8' : '#6c5d9e';
    px(c, shade, cx - half, baseTop - 2 - row, half * 2, 1);
    px(c, 'rgba(255,255,255,0.18)', cx - half, baseTop - 2 - row, Math.round(half * 0.5), 1);
  }
  // 經線
  c.lineWidth = 1;
  for (let k = -3; k <= 3; k += 1) {
    const a = k * 0.4;
    const flow = 0.35 + 0.35 * Math.sin(seconds * 2 + k);
    c.strokeStyle = `rgba(210, 180, 255, ${flow})`;
    c.beginPath();
    c.ellipse(cx, baseTop - 2, Math.abs(Math.sin(a)) * rx + 0.5, ry, 0, Math.PI, Math.PI * 2);
    c.stroke();
  }
  // 緯線
  for (let k = 1; k <= 3; k += 1) {
    const t = k / 4;
    const half = rx * Math.sqrt(1 - t * t);
    px(c, 'rgba(230, 210, 255, 0.55)', cx - half, baseTop - 2 - ry * t, half * 2, 1);
  }
  px(c, '#f0e6ff', cx - 4, baseTop - 2 - Math.round(ry) - 1, 8, 2);
  glow(c, cx, baseTop - ry * 0.5, rx, 'rgba(180, 120, 255, ALPHA)', 0.12);
}

// 國父紀念館：廣場、階梯、紅柱白牆、黃色琉璃瓦雙層屋頂、兩端飛簷翹起
function memorialHall(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const cx = x + w / 2;
  shadow(c, x, y1, w);
  // 廣場、階梯
  px(c, '#8a8478', x, y1 - 16, w, 16);
  for (let k = x; k < x + w; k += 8) px(c, '#7c766b', k, y1 - 16, 1, 16);
  for (let s = 0; s < 4; s += 1) {
    px(c, s % 2 === 0 ? '#c9c0ae' : '#b5ac9a', x + 22 + s * 4, y1 - 16 - s * 3, w - 44 - s * 8, 3);
  }
  // 台基
  const bodyBottom = y1 - 28;
  px(c, '#b5ac9a', x + 12, bodyBottom, w - 24, 4);
  // 牆與紅柱（被投光燈照得暖暖的）
  const bodyH = 30;
  px(c, '#efe2c4', x + 18, bodyBottom - bodyH, w - 36, bodyH);
  px(c, '#6b4b33', x + 26, bodyBottom - bodyH + 8, w - 52, bodyH - 8);
  for (let k = 0; k < 3; k += 1) px(c, '#ffcf7a', cx - 14 + k * 11, bodyBottom - 14, 6, 14);
  const cols = 10;
  for (let i = 0; i < cols; i += 1) {
    const colX = Math.round(x + 22 + i * ((w - 48) / (cols - 1)));
    px(c, '#a8322a', colX, bodyBottom - bodyH + 4, 4, bodyH - 4);
    px(c, '#d0544a', colX, bodyBottom - bodyH + 4, 1, bodyH - 4);
  }
  // 下層屋頂：黃色琉璃瓦、兩端翹起
  const roof1 = bodyBottom - bodyH;
  const roofShape = (left: number, right: number, yBase: number, height: number, lift: number) => {
    c.fillStyle = '#c98f1e';
    c.beginPath();
    c.moveTo(left - 6, yBase - lift);
    c.quadraticCurveTo(left + 10, yBase + 2, left + 18, yBase - height * 0.55);
    c.lineTo(right - 18, yBase - height * 0.55);
    c.quadraticCurveTo(right - 10, yBase + 2, right + 6, yBase - lift);
    c.lineTo(right - 14, yBase - height);
    c.lineTo(left + 14, yBase - height);
    c.closePath();
    c.fill();
    // 瓦片的橫紋
    for (let k = 2; k < height; k += 3) px(c, '#e5a72a', left + 14 + k * 0.4, yBase - height + k, right - left - 28 - k * 0.8, 1);
    px(c, '#f2c14e', left + 14, yBase - height, right - left - 28, 2);
  };
  roofShape(x + 6, x + w - 6, roof1, 14, 6);
  // 上層屋頂
  const roof2 = roof1 - 14;
  px(c, '#efe2c4', cx - 34, roof2 - 8, 68, 8);
  for (let i = 0; i < 6; i += 1) px(c, '#a8322a', cx - 30 + i * 12, roof2 - 8, 2, 8);
  roofShape(cx - 46, cx + 46, roof2 - 8, 12, 5);
  px(c, '#f2c14e', cx - 30, roof2 - 21, 60, 2);
  // 前面的投光
  glow(c, cx, bodyBottom, 60, 'rgba(255, 210, 140, ALPHA)', 0.18);
}

// 市政府：寬大的石材建築、中間門廊、兩排旗桿
function cityHall(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const cx = x + w / 2;
  const h = 64;
  shadow(c, x, y1, w);
  px(c, '#5d6170', x, y1 - 8, w, 8);
  // 兩翼、中間高起來
  px(c, '#9aa0ae', x + 4, y1 - h + 10, w - 8, h - 18);
  px(c, '#b8bdc9', x + 4, y1 - h + 10, w - 8, 2);
  px(c, '#a7adba', cx - 22, y1 - h, 44, h - 8);
  px(c, '#c8cdd8', cx - 22, y1 - h, 44, 2);
  litWindows(c, x + 6, y1 - h + 14, w - 12, h - 30, Math.floor(l.x0 * 13), ['#ffe7a8', '#fff4d6'], '#6d7383', 3, 4, 6, 7, 0.7);
  litWindows(c, cx - 20, y1 - h + 4, 40, 18, 7, ['#ffe7a8', '#fff4d6'], '#7d8394', 3, 4, 6, 7, 0.75);
  // 門廊
  px(c, '#3a4256', cx - 14, y1 - 22, 28, 14);
  px(c, '#ffe0a0', cx - 12, y1 - 20, 24, 10);
  for (let k = 0; k < 4; k += 1) px(c, '#c8cdd8', cx - 14 + k * 9, y1 - 22, 3, 14);
  // 旗桿
  for (const dx of [-36, -28, 26, 34]) {
    px(c, '#c8cdd8', cx + dx, y1 - 30, 1, 22);
    px(c, dx < 0 ? '#e25a4a' : '#3b82f6', cx + dx + 1, y1 - 30, 5, 3);
  }
  glow(c, cx, y1 - 10, 50, 'rgba(255, 220, 160, ALPHA)', 0.14);
}

// 百貨商圈：幾棟百貨，外牆大螢幕（會換顏色）、霓虹燈帶
function mall(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const rand = seeded(Math.floor(l.x0 * 7 + l.y0));
  const parts = 3;
  for (let i = 0; i < parts; i += 1) {
    const bw = Math.floor(w / parts) - 3;
    const bx = Math.round(x + i * (w / parts));
    const bh = 54 + Math.floor(rand() * 34);
    shadow(c, bx, y1, bw);
    px(c, ['#262b40', '#2e2540', '#20323f'][i] ?? '#262b40', bx, y1 - bh, bw, bh);
    px(c, 'rgba(255,255,255,0.08)', bx, y1 - bh, bw, 2);
    litWindows(c, bx, y1 - bh + 4, bw, bh - 30, i * 17 + 3, ['#ffe2a0', '#ffd27a', '#bfe3ff'], '#2c3248', 2, 3, 4, 5, 0.55);
    // 大螢幕：顏色慢慢換
    const sw = bw - 8;
    const sy = y1 - bh + 10;
    const hue = Math.round((seconds * 30 + i * 120) % 360);
    const grad = c.createLinearGradient(bx + 4, sy, bx + 4 + sw, sy + 18);
    grad.addColorStop(0, `hsl(${hue}, 85%, 58%)`);
    grad.addColorStop(1, `hsl(${(hue + 60) % 360}, 85%, 50%)`);
    c.fillStyle = grad;
    c.fillRect(bx + 4, sy, sw, 18);
    px(c, 'rgba(255,255,255,0.85)', bx + 7, sy + 7, Math.max(4, sw - 14), 2);
    px(c, '#111', bx + 3, sy - 1, sw + 2, 1);
    // 霓虹燈帶、一樓櫥窗
    const neon = ['#ff4fa0', '#4fd1ff', '#ffd34f'][i] ?? '#ff4fa0';
    px(c, Math.sin(seconds * 2.5 + i * 2) > -0.7 ? neon : '#3a3a4a', bx, y1 - 18, bw, 3);
    px(c, '#ffe9b8', bx + 3, y1 - 13, bw - 6, 10);
    for (let k = bx + 8; k < bx + bw - 4; k += 9) px(c, '#c9a35a', k, y1 - 13, 1, 10);
  }
}

// 臺中國家歌劇院：白色曲牆、像山洞一樣的大開口（裡面暖黃燈）、前面的水池倒影
function opera(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const h = 62;
  shadow(c, x, y1, w);
  px(c, 'rgba(120, 180, 255, 0.25)', x, y1 - 6, w, 6);
  // 曲線屋頂輪廓
  c.fillStyle = '#ece8df';
  c.beginPath();
  c.moveTo(x, y1 - 6);
  c.lineTo(x, y1 - h + 10);
  c.quadraticCurveTo(x + w * 0.25, y1 - h - 4, x + w * 0.5, y1 - h + 6);
  c.quadraticCurveTo(x + w * 0.75, y1 - h + 16, x + w, y1 - h + 2);
  c.lineTo(x + w, y1 - 6);
  c.closePath();
  c.fill();
  px(c, '#ffffff', x, y1 - h + 10, 2, h - 16);
  // 開口：上下左右彎曲的大洞
  const holes: [number, number, number, number][] = [
    [0.18, 0.55, 11, 18],
    [0.42, 0.5, 13, 21],
    [0.68, 0.58, 12, 17],
    [0.88, 0.45, 7, 12],
    [0.3, 0.22, 7, 7],
    [0.58, 0.2, 8, 7],
  ];
  for (const [fx, fy, rx, ry] of holes) {
    const hx = x + w * fx;
    const hy = y1 - h * fy;
    const g = c.createRadialGradient(hx, hy, 1, hx, hy, ry);
    g.addColorStop(0, '#fff2cc');
    g.addColorStop(0.6, '#ffc86a');
    g.addColorStop(1, '#c9822f');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(hx, hy, rx, ry, 0, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#d6d0c4';
    c.lineWidth = 1;
    c.stroke();
  }
  // 一樓玻璃
  px(c, '#ffdf9e', x + 4, y1 - 14, w - 8, 7);
  for (let k = x + 8; k < x + w - 4; k += 7) px(c, '#c9a35a', k, y1 - 14, 1, 7);
  // 水池裡的倒影
  for (let k = 0; k < 6; k += 1) px(c, 'rgba(255, 210, 140, 0.35)', x + 10 + k * 18, y1 - 4, 8, 1);
}

// 台中之鑽：兩棟玻璃塔，頂上鑽石造型的燈
function twinTowers(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  for (let i = 0; i < 2; i += 1) {
    const bw = Math.round(w / 2) - 14;
    const bx = Math.round(x + 7 + i * (w / 2));
    const bh = 128 + i * 12;
    shadow(c, bx, y1, bw);
    px(c, '#1b2b46', bx, y1 - bh, bw, bh);
    px(c, '#2a4066', bx, y1 - bh, Math.round(bw * 0.35), bh);
    for (let k = bx; k < bx + bw; k += 4) px(c, 'rgba(120, 170, 230, 0.25)', k, y1 - bh, 1, bh);
    litWindows(c, bx, y1 - bh + 4, bw, bh - 10, 31 + i, ['#a8d8ff', '#e2f2ff'], '#22355a', 2, 2, 4, 5, 0.45);
    const glowA = 0.6 + Math.sin(seconds * 2 + i) * 0.4;
    c.fillStyle = `rgba(255, 110, 210, ${glowA})`;
    c.beginPath();
    c.moveTo(bx + bw / 2, y1 - bh - 22);
    c.lineTo(bx + bw + 2, y1 - bh);
    c.lineTo(bx + bw / 2, y1 - bh + 8);
    c.lineTo(bx - 2, y1 - bh);
    c.closePath();
    c.fill();
    c.strokeStyle = '#ffd6f2';
    c.lineWidth = 1;
    c.stroke();
    glow(c, bx + bw / 2, y1 - bh - 6, 24, 'rgba(255, 110, 210, ALPHA)', 0.25 * glowA);
  }
}

// 85 大樓：兩條腿、中間鏤空（「高」字造型），上半合起來越往上越細，白色輪廓燈
function tower85(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const cx = x + w / 2;
  shadow(c, x, y1, w);
  const legW = 26;
  const legH = 96;
  const body = (bx: number, by: number, bw: number, bh: number, seed: number) => {
    px(c, '#1c2236', bx, by, bw, bh);
    px(c, '#2a3352', bx, by, Math.round(bw * 0.35), bh);
    litWindows(c, bx, by + 2, bw, bh - 2, seed, ['#fff1c4', '#ffe0a0', '#dbe8ff'], '#242c44', 2, 2, 3, 4, 0.5);
    c.strokeStyle = 'rgba(255,255,255,0.85)';
    c.lineWidth = 1;
    c.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  };
  body(x + 4, y1 - legH, legW, legH, 85);
  body(x + w - 4 - legW, y1 - legH, legW, legH, 86);
  // 中間鏤空的地方看得到後面的夜空
  px(c, 'rgba(255, 220, 160, 0.12)', x + 4 + legW, y1 - legH + 10, w - 8 - legW * 2, legH - 10);
  body(x + 4, y1 - legH - 66, w - 8, 66, 87);
  body(cx - 18, y1 - legH - 66 - 44, 36, 44, 88);
  body(cx - 10, y1 - legH - 66 - 44 - 22, 20, 22, 89);
  px(c, '#e8ecf3', cx - 1, y1 - legH - 66 - 44 - 22 - 26, 2, 26);
  if (Math.sin(seconds * 3 + 1) > 0) {
    px(c, '#ff4d4d', cx - 2, y1 - legH - 66 - 44 - 22 - 29, 4, 3);
    glow(c, cx, y1 - legH - 66 - 44 - 22 - 28, 8, 'rgba(255, 77, 77, ALPHA)', 0.5);
  }
}

// 高雄流行音樂中心：六角形格子的「鯨魚」長條建築＋一座六角塔，藍紫色燈光輪流亮
function musicCenter(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  shadow(c, x, y1, w);
  // 鯨魚身體：低低長長的弧形，上面六角格
  c.fillStyle = '#1d2140';
  c.beginPath();
  c.moveTo(x, y1 - 4);
  c.quadraticCurveTo(x + w * 0.3, y1 - 40, x + w * 0.62, y1 - 30);
  c.quadraticCurveTo(x + w * 0.85, y1 - 22, x + w, y1 - 6);
  c.lineTo(x + w, y1);
  c.lineTo(x, y1);
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  for (let hy = y1 - 44; hy < y1; hy += 6) {
    for (let hx = x + ((hy / 6) % 2 === 0 ? 0 : 4); hx < x + w; hx += 8) {
      const on = Math.sin(hx * 0.08 + hy * 0.1 + seconds * 2) > 0.3;
      px(c, on ? '#7fd6ff' : '#3a3f7a', hx, hy, 4, 1);
      px(c, on ? '#c9a0ff' : '#2e3366', hx + 1, hy + 3, 2, 1);
    }
  }
  c.restore();
  // 六角塔
  const tx = x + w * 0.78;
  for (let k = 0; k < 64; k += 8) {
    const r = 9 - k / 16;
    const on = Math.sin(seconds * 2 - k * 0.15) > -0.2;
    c.strokeStyle = on ? 'rgba(170, 220, 255, 0.95)' : 'rgba(110, 120, 200, 0.6)';
    c.lineWidth = 1.5;
    c.beginPath();
    for (let a = 0; a <= 6; a += 1) {
      const ang = (a / 6) * Math.PI * 2;
      const hx = tx + Math.cos(ang) * r;
      const hy = y1 - 24 - k + Math.sin(ang) * r * 0.45;
      if (a === 0) c.moveTo(hx, hy);
      else c.lineTo(hx, hy);
    }
    c.stroke();
  }
  glow(c, tx, y1 - 56, 28, 'rgba(150, 190, 255, ALPHA)', 0.2);
  // 岸邊的光帶
  px(c, '#9fd8ff', x + 4, y1 - 3, w - 8, 1);
}

// 高雄港旅運中心：白色波浪屋頂的長條建築＋一座玻璃塔
function portTerminal(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  shadow(c, x, y1, w);
  // 玻璃塔
  const tw = 30;
  const tx = x + w - tw - 10;
  px(c, '#1b2b46', tx, y1 - 110, tw, 110);
  px(c, '#2a4066', tx, y1 - 110, 10, 110);
  litWindows(c, tx, y1 - 106, tw, 96, 41, ['#bfe7ff', '#e7f6ff', '#ffe7a8'], '#22355a', 2, 2, 3, 4, 0.5);
  px(c, '#9fd8ff', tx, y1 - 112, tw, 2);
  // 低層：波浪屋頂
  px(c, '#e3e9f2', x, y1 - 32, w - 6, 32);
  litWindows(c, x, y1 - 28, w - 6, 22, 42, ['#bfe7ff', '#e7f6ff'], '#9aa6b8', 3, 3, 5, 5, 0.75);
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(x - 4, y1 - 32);
  for (let i = 0; i <= 10; i += 1) c.lineTo(x - 4 + ((w + 2) / 10) * i, y1 - 32 - (i % 2 === 0 ? 10 : 3));
  c.lineTo(x + w - 2, y1 - 30);
  c.closePath();
  c.fill();
  px(c, '#6fc3ff', x - 4, y1 - 33, w + 2, 1);
}

// 高雄展覽館：兩層玻璃大廳（暖黃燈）＋往外伸出去的白色波浪大屋頂（像海浪）
function exhibition(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  shadow(c, x, y1, w);
  const h = 56;
  px(c, '#1d2a42', x, y1 - h, w, h);
  px(c, '#2a3a5a', x, y1 - h, Math.round(w * 0.3), h);
  // 兩層玻璃帷幕：直的鋁框、亮燈
  for (let k = x + 2; k < x + w; k += 6) px(c, '#3a4d72', k, y1 - h + 4, 1, h - 6);
  litWindows(c, x, y1 - h + 6, w, 20, 51, ['#a9e1ff', '#e1f4ff'], '#2a3a56', 4, 5, 6, 8, 0.75);
  px(c, '#3a4d72', x, y1 - 28, w, 2);
  px(c, '#ffe7b0', x + 4, y1 - 24, w - 8, 18);
  for (let k = x + 10; k < x + w - 6; k += 14) px(c, '#c9a35a', k, y1 - 24, 1, 18);
  px(c, '#1d2a42', x + w / 2 - 10, y1 - 16, 20, 16);
  px(c, '#ffd27a', x + w / 2 - 8, y1 - 14, 16, 14);
  // 白色波浪大屋頂：上下兩條曲線包起來，邊緣一條藍光
  const top = y1 - h;
  c.fillStyle = '#f4f6fa';
  c.beginPath();
  c.moveTo(x - 18, top + 6);
  c.quadraticCurveTo(x + w * 0.25, top - 30, x + w * 0.5, top - 8);
  c.quadraticCurveTo(x + w * 0.75, top + 12, x + w + 18, top - 14);
  c.lineTo(x + w + 18, top - 4);
  c.quadraticCurveTo(x + w * 0.75, top + 22, x + w * 0.5, top + 4);
  c.quadraticCurveTo(x + w * 0.25, top - 16, x - 18, top + 16);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(120, 200, 255, 0.85)';
  c.lineWidth = 1;
  c.stroke();
  // 屋頂下緣的陰影
  c.fillStyle = 'rgba(0, 0, 0, 0.25)';
  c.fillRect(x, top + 6, w, 4);
}

// 夢時代：購物中心＋屋頂上會轉的彩色摩天輪（有車廂）
function ferris(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  shadow(c, x, y1, w);
  px(c, '#2e2546', x, y1 - 38, w, 38);
  px(c, '#3e3460', x, y1 - 38, w, 2);
  litWindows(c, x, y1 - 34, w, 22, 61, ['#ffd98a', '#ffb3d9', '#bfe3ff'], '#352c52', 3, 3, 5, 5, 0.6);
  px(c, '#ff4fa0', x, y1 - 14, w, 3);
  px(c, '#ffe9b8', x + 4, y1 - 10, w - 8, 8);
  const cx = x + w / 2;
  const cy = y1 - 38 - 44;
  const r = 38;
  // 支架
  c.strokeStyle = '#c9ccd6';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - 14, y1 - 38);
  c.lineTo(cx, cy);
  c.lineTo(cx + 14, y1 - 38);
  c.stroke();
  const colors = ['#ff4d6d', '#ffb84d', '#ffe94d', '#5dff8a', '#4dd2ff', '#9b6bff', '#ff6be0'];
  c.lineWidth = 1;
  for (let i = 0; i < 36; i += 1) {
    const a = (i / 36) * Math.PI * 2 + seconds * 0.2;
    const col = colors[(i + Math.floor(seconds * 3)) % colors.length] ?? '#ffffff';
    px(c, col, Math.round(cx + Math.cos(a) * r) - 1, Math.round(cy + Math.sin(a) * r) - 1, 2, 2);
    if (i % 3 === 0) {
      c.strokeStyle = 'rgba(220, 225, 235, 0.35)';
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      c.stroke();
      // 車廂（一直朝下）
      const gx = Math.round(cx + Math.cos(a) * r);
      const gy = Math.round(cy + Math.sin(a) * r);
      px(c, '#e8ecf3', gx - 2, gy + 1, 5, 4);
      px(c, col, gx - 2, gy + 1, 5, 1);
    }
  }
  px(c, '#ffffff', cx - 2, cy - 2, 4, 4);
  glow(c, cx, cy, r + 10, 'rgba(255, 140, 220, ALPHA)', 0.12);
}

// 郵輪：停在港裡，三層甲板的舷窗亮著，跟著浪輕輕晃
function cruise(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const bob = Math.round(Math.sin(seconds * 0.8));
  for (let k = 0; k < 8; k += 1) px(c, 'rgba(255, 230, 170, 0.25)', x + 14 + k * 22, y1 + 2 + bob, 10, 1);
  c.fillStyle = '#f4f6fa';
  c.beginPath();
  c.moveTo(x, y1 - 22 + bob);
  c.lineTo(x + w, y1 - 22 + bob);
  c.lineTo(x + w - 14, y1 - 4 + bob);
  c.lineTo(x + 10, y1 - 4 + bob);
  c.closePath();
  c.fill();
  px(c, '#1e3a6b', x + 12, y1 - 10 + bob, w - 28, 3);
  litWindows(c, x + 10, y1 - 20 + bob, w - 30, 8, 70, ['#ffe7a8', '#fff3cf'], '#c3cad6', 2, 2, 4, 3, 0.8);
  for (let i = 0; i < 3; i += 1) {
    const dx = x + 22 + i * 10;
    const dw = w - 56 - i * 20;
    px(c, '#e3e8f0', dx, y1 - 32 - i * 8 + bob, dw, 10);
    litWindows(c, dx, y1 - 32 - i * 8 + bob, dw, 10, 71 + i, ['#ffe7a8', '#fff3cf'], '#aab3c2', 2, 2, 4, 4, 0.8);
  }
  px(c, '#d72d2d', x + w - 50, y1 - 58 + bob, 9, 12);
  px(c, '#1e3a6b', x + w - 50, y1 - 58 + bob, 9, 2);
}

export function drawLandmark(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  switch (l.kind) {
    case 'tower101':
      return tower101(c, l, seconds);
    case 'dome':
      return dome(c, l, seconds);
    case 'memorialHall':
      return memorialHall(c, l);
    case 'cityHall':
      return cityHall(c, l);
    case 'mall':
      return mall(c, l, seconds);
    case 'opera':
      return opera(c, l);
    case 'twinTowers':
      return twinTowers(c, l, seconds);
    case 'tower85':
      return tower85(c, l, seconds);
    case 'musicCenter':
      return musicCenter(c, l, seconds);
    case 'portTerminal':
      return portTerminal(c, l);
    case 'exhibition':
      return exhibition(c, l);
    case 'ferris':
      return ferris(c, l, seconds);
    case 'cruise':
      return cruise(c, l, seconds);
  }
}

// ── 賽道設施 ──

// 看台的後半部：座位後面一階階坐滿觀眾（會揮手）、最上面的鋼構屋頂＋贊助商燈箱
export function drawStandBack(c: CanvasRenderingContext2D, s: Rect, neon: string, title: string, seconds: number): void {
  const x = s.x0 * T;
  const w = (s.x1 - s.x0) * T;
  const y0 = s.y0 * T;
  const y1 = s.y1 * T;
  // 座位區的水泥階梯（兩排焦點座位坐在這裡）
  px(c, '#3a3e4c', x, y0, w, y1 - y0);
  for (let k = y0 + 8; k < y1; k += 27) px(c, '#4a4f60', x, k, w, 3);
  // 後面一階階的觀眾
  const rows = 5;
  const rowH = 7;
  const top = y0 - rows * rowH;
  px(c, '#2c303c', x, top, w, rows * rowH);
  const rand = seeded(Math.floor(s.x0 * 31 + s.y0));
  const shirts = ['#e25a4a', '#f6c945', '#2fb3a6', '#f4f4f4', '#5b6ee1', '#f2a541', '#ff6fb5', neon];
  for (let r = 0; r < rows; r += 1) {
    const ry = top + r * rowH;
    px(c, '#363a48', x, ry + rowH - 1, w, 1);
    for (let cx = x + 2; cx < x + w - 3; cx += 4) {
      if (rand() < 0.12) continue;
      const shirt = shirts[Math.floor(rand() * shirts.length)] ?? '#f4f4f4';
      const skin = rand() < 0.5 ? '#f6d1b0' : '#d9a57e';
      const wave = Math.sin(seconds * 5 + cx * 0.4 + r * 1.3) > 0.82 ? 1 : 0;
      px(c, skin, cx, ry + 1 - wave, 3, 2);
      px(c, shirt, cx, ry + 3 - wave, 3, 3);
      if (wave && rand() < 0.5) px(c, skin, cx + 3, ry - 1, 1, 2);
    }
  }
  // 側牆
  px(c, '#1f222c', x - 3, top - 4, 3, y1 - top + 4);
  px(c, '#1f222c', x + w, top - 4, 3, y1 - top + 4);
  // 屋頂：深色鋼構、底下一條霓虹、贊助商燈箱
  px(c, '#1b1d26', x - 6, top - 14, w + 12, 12);
  px(c, '#2e3240', x - 6, top - 14, w + 12, 2);
  px(c, neon, x - 6, top - 3, w + 12, 1);
  c.save();
  c.shadowColor = neon;
  c.shadowBlur = 6;
  px(c, neon, x - 6, top - 3, w + 12, 1);
  c.restore();
  px(c, '#0f1118', x + w / 2 - 44, top - 12, 88, 8);
  c.fillStyle = '#ffffff';
  c.font = '700 7px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(title, x + w / 2, top - 8);
}

// 看台最前面的廣告欄杆（擋在座位前面）
export function drawStandFront(c: CanvasRenderingContext2D, s: Rect, neon: string, seconds: number): void {
  const x = s.x0 * T;
  const w = (s.x1 - s.x0) * T;
  const y1 = s.y1 * T;
  px(c, '#15171f', x, y1 - 3, w, 5);
  const boards = Math.floor(w / 28);
  for (let i = 0; i < boards; i += 1) {
    const bx = x + i * 28 + 2;
    const on = (Math.floor(seconds * 0.5) + i) % 3;
    px(c, on === 0 ? neon : on === 1 ? '#f6c945' : '#4fd1ff', bx, y1 - 2, 24, 3);
    px(c, 'rgba(255,255,255,0.6)', bx + 4, y1 - 1, 14, 1);
  }
}

// 看台的焦點座位：紅色桶型椅（人坐著面向賽道，椅背在後面）
export function drawStandSeat(c: CanvasRenderingContext2D, sx: number, sy: number, mine: boolean, seconds: number, color: [string, string, string] = ['#8c1c1c', '#d72d2d', '#f06a5a']): void {
  const x = Math.round(sx * T);
  const y = Math.round(sy * T);
  const [dark, mid, light] = color;
  // 桶型椅：圓弧椅背（中間凹下去比較暗）、椅墊、底下的支架
  px(c, 'rgba(0,0,0,0.3)', x - 5, y + 1, 11, 2);
  px(c, '#3b3f4c', x - 1, y - 1, 2, 3);
  px(c, dark, x - 4, y - 12, 8, 1);
  px(c, dark, x - 5, y - 11, 10, 7);
  px(c, mid, x - 4, y - 11, 8, 6);
  px(c, dark, x - 2, y - 9, 4, 3);
  px(c, light, x - 4, y - 11, 8, 1);
  px(c, mid, x - 5, y - 4, 10, 3);
  px(c, light, x - 5, y - 4, 10, 1);
  px(c, dark, x - 5, y - 2, 10, 1);
  if (mine) {
    c.fillStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(seconds * 3) * 0.15})`;
    c.fillRect(x - 7, y + 2, 14, 2);
  }
}

// 車隊車庫：一排面向維修道的車庫（亮著的車隊顏色、停著車頭朝外的賽車），後面是車隊辦公室
export function drawPitGarages(c: CanvasRenderingContext2D, p: Rect, seconds: number): void {
  const x = p.x0 * T;
  const w = (p.x1 - p.x0) * T;
  const y0 = p.y0 * T;
  const y1 = p.y1 * T;
  const h = y1 - y0;
  // 屋頂（從上面看）
  px(c, '#c9ccd6', x, y0, w, h - 10);
  px(c, '#e2e5ec', x, y0, w, 2);
  for (let k = x + 6; k < x + w; k += 24) px(c, '#9aa0ae', k, y0 + 6, 10, 5);
  // 後面（南邊）的立面：車隊辦公室的窗戶
  px(c, '#2a2e3c', x, y1 - 10, w, 10);
  litWindows(c, x, y1 - 10, w, 10, 77, ['#ffe7a8', '#bfe3ff'], '#363b4c', 3, 3, 5, 5, 0.65);
  // 面向維修道的車庫門：車隊顏色的燈、停在裡面的車
  const garages = Math.floor(w / 36);
  for (let i = 0; i < garages; i += 1) {
    const team = TEAM[i % TEAM.length] ?? TEAM[0];
    if (!team) continue;
    const gx = x + 4 + i * (w / garages);
    const gw = w / garages - 8;
    px(c, '#15171f', gx, y0 - 2, gw, 8);
    px(c, team.body, gx + 1, y0 - 1, gw - 2, 2);
    px(c, 'rgba(255,255,255,0.9)', gx + 2, y0 + 2, gw - 4, 3);
    // 車頭朝北、半截停在車庫外
    const cx = Math.round(gx + gw / 2);
    drawF1Car(c, cx, y0 - 5, -Math.PI / 2, team.body, team.accent, seconds + i * 0.37);
    // 技師：站在車子旁邊，偶爾走兩步
    const side = i % 2 === 0 ? -1 : 1;
    const mx = Math.round(cx + side * (12 + Math.sin(seconds * 0.7 + i * 2) * 2));
    px(c, 'rgba(0,0,0,0.3)', mx - 1, y0 - 3, 5, 2);
    px(c, team.body, mx, y0 - 8, 3, 5);
    px(c, '#f6d1b0', mx, y0 - 10, 3, 2);
    px(c, team.accent, mx, y0 - 11, 3, 1);
  }
}

// 起跑燈門架：橫跨起終點線的鋼構桁架，中間掛一排五顆紅燈：依序亮起、全滅＝起跑（每 10 秒一次）
export function drawStartGantry(c: CanvasRenderingContext2D, sx: number, sy: number, angle: number, half: number, title: string, seconds: number): void {
  const nx = -Math.sin(angle);
  const ny = Math.cos(angle);
  const a = { x: Math.round((sx + nx * (half + 0.9)) * T), y: Math.round((sy + ny * (half + 0.9)) * T) };
  const b = { x: Math.round((sx - nx * (half + 0.9)) * T), y: Math.round((sy - ny * (half + 0.9)) * T) };
  const lift = 30;
  // 兩根柱子
  for (const p of [a, b]) {
    px(c, 'rgba(0,0,0,0.35)', p.x - 4, p.y - 1, 9, 3);
    px(c, '#3b3f4c', p.x - 3, p.y - lift, 6, lift);
    px(c, '#5a5f70', p.x - 3, p.y - lift, 2, lift);
    for (let k = p.y - lift + 4; k < p.y; k += 6) px(c, '#2a2d38', p.x - 3, k, 6, 1);
  }
  // 桁架：兩條邊、中間斜撐
  const top = { x: a.x, y: a.y - lift };
  const bot = { x: b.x, y: b.y - lift };
  const len = Math.hypot(bot.x - top.x, bot.y - top.y);
  c.save();
  c.translate(top.x, top.y);
  c.rotate(Math.atan2(bot.y - top.y, bot.x - top.x));
  px(c, '#2b2e3a', 0, -5, len, 10);
  px(c, '#5a5f70', 0, -5, len, 2);
  px(c, '#5a5f70', 0, 3, len, 2);
  for (let k = 0; k < len; k += 8) {
    c.strokeStyle = '#454a5a';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(k, -3);
    c.lineTo(k + 8, 3);
    c.stroke();
  }
  c.restore();
  // 燈箱（掛在桁架中間）：五顆燈排一排
  const phase = seconds % 10;
  const lit = phase < 5 ? Math.floor(phase) + 1 : phase < 5.6 ? 5 : 0;
  const mx = Math.round((top.x + bot.x) / 2);
  const my = Math.round((top.y + bot.y) / 2);
  px(c, '#0f1118', mx - 21, my - 7, 42, 14);
  px(c, '#2b2e3a', mx - 21, my - 7, 42, 1);
  for (let i = 0; i < 5; i += 1) {
    const lx = mx - 16 + i * 8;
    px(c, '#1a1c24', lx - 3, my - 4, 6, 8);
    px(c, i < lit ? '#ff3030' : '#4a1a1a', lx - 2, my - 3, 4, 3);
    px(c, i < lit ? '#ff3030' : '#4a1a1a', lx - 2, my + 1, 4, 2);
    if (i < lit) glow(c, lx, my, 8, 'rgba(255, 48, 48, ALPHA)', 0.4);
  }
  // 賽事名稱燈箱（靠看台那一端）
  const tx = Math.round(top.x + (bot.x - top.x) * 0.18);
  const ty = Math.round(top.y + (bot.y - top.y) * 0.18);
  px(c, '#0f1118', tx - 30, ty - 6, 60, 12);
  px(c, '#e10600', tx - 30, ty - 6, 3, 12);
  c.fillStyle = '#ffffff';
  c.font = '700 6px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(title, tx + 1, ty);
}

// 回 F1 月台的車站：玻璃亭、紅色屋頂上 F1 字樣、往下的手扶梯
export function drawStation(c: CanvasRenderingContext2D, s: Rect, seconds: number): void {
  const x = s.x0 * T;
  const w = (s.x1 - s.x0) * T;
  const y0 = s.y0 * T;
  const y1 = s.y1 * T;
  const h = y1 - y0;
  px(c, 'rgba(0,0,0,0.35)', x + 3, y1 - 2, w, 5);
  // 玻璃亭
  px(c, '#bfe3ff', x + 2, y0 + 8, w - 4, h - 8);
  px(c, 'rgba(255,255,255,0.55)', x + 4, y0 + 10, 3, h - 12);
  px(c, '#2a2f40', x + 10, y0 + 14, w - 20, h - 14);
  for (let k = y0 + 16; k < y1; k += 3) px(c, '#4a5068', x + 10, k, w - 20, 1);
  px(c, '#ffd98a', x + 10, y0 + 14, w - 20, 2);
  // 屋頂
  px(c, '#b71c1c', x - 2, y0, w + 4, 9);
  px(c, '#e53935', x - 2, y0, w + 4, 2);
  for (let i = 0; i < w + 4; i += 4) px(c, (i / 4) % 2 === 0 ? '#ffffff' : '#15171f', x - 2 + i, y0 + 9, 4, 2);
  c.fillStyle = '#ffffff';
  c.font = 'italic 900 8px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('F1', x + w / 2, y0 + 5);
  glow(c, x + w / 2, y0 + 20, 30, 'rgba(255, 220, 160, ALPHA)', 0.15 + Math.sin(seconds * 2) * 0.03);
}

// DRS 牌：賽道外側一根柱子上的綠色牌子
export function drawDrsBoard(c: CanvasRenderingContext2D, x: number, y: number): void {
  const bx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.3)', bx - 2, by, 5, 2);
  px(c, '#3b3f4c', bx, by - 18, 2, 18);
  px(c, '#0f1118', bx - 11, by - 26, 24, 10);
  px(c, '#3dff8a', bx - 10, by - 25, 22, 8);
  c.fillStyle = '#0f1118';
  c.font = '900 7px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('DRS', bx + 1, by - 21);
}
