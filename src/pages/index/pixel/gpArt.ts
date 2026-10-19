// 大獎賽地圖的地標（夜景）：每個地標畫在自己的格子範圍裡，高的部分往上長（照 y1 排前後）。
// 都是用程式畫的像素圖，顏色照實景的夜間燈光（101 的藍綠、大巨蛋的紫、85 大樓的白色輪廓…）。
import type { Landmark } from './circuits';
import { px, seeded } from './pixelUtil';

const T = 16;

// 一排排亮著的窗戶（有些暗著，隨時間偶爾換一格）
function windows(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, lit = '#ffd98a', gapX = 4, gapY = 5): void {
  const rand = seeded(seed);
  for (let wy = y + 2; wy < y + h - 2; wy += gapY) {
    for (let wx = x + 2; wx < x + w - 2; wx += gapX) {
      if (rand() < 0.68) px(c, lit, wx, wy, 2, 2);
    }
  }
}

function shadow(c: CanvasRenderingContext2D, x: number, y: number, w: number): void {
  px(c, 'rgba(0,0,0,0.35)', x + 3, y - 2, w, 5);
}

function tower101(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const cx = ((l.x0 + l.x1) / 2) * T;
  const base = l.y1 * T;
  const w = (l.x1 - l.x0) * T;
  shadow(c, cx - w / 2, base, w);
  // 底下的購物中心
  px(c, '#2a3550', cx - w / 2, base - 26, w, 26);
  windows(c, cx - w / 2, base - 26, w, 26, 11, '#9fe6ff', 5, 6);
  // 八節塔身，每節上面往外翻
  const segH = 15;
  for (let i = 0; i < 8; i += 1) {
    const top = base - 26 - (i + 1) * segH;
    const sw = 22 - i * 0.6;
    px(c, '#1f5f6a', cx - sw / 2, top, sw, segH);
    px(c, '#36a3a8', cx - sw / 2 - 2, top, sw + 4, 3);
    px(c, '#7ff0e6', cx - sw / 2, top + 4, 2, segH - 5);
    px(c, '#7ff0e6', cx + sw / 2 - 2, top + 4, 2, segH - 5);
    for (let k = 0; k < 3; k += 1) px(c, '#5ad6cf', cx - 5 + k * 4, top + 6, 2, 6);
  }
  const top = base - 26 - 8 * segH;
  px(c, '#2a7f86', cx - 7, top - 12, 14, 12);
  px(c, '#7ff0e6', cx - 7, top - 12, 14, 2);
  px(c, '#d7f7f5', cx - 1, top - 34, 2, 22);
  // 塔尖的燈一閃一閃
  if (Math.sin(seconds * 3) > 0) px(c, '#ff4d4d', cx - 2, top - 37, 4, 3);
}

function dome(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const cx = x + w / 2;
  shadow(c, x, y1, w);
  px(c, '#2b2342', x + 4, y1 - 22, w - 8, 22);
  c.fillStyle = '#5b3fa8';
  c.beginPath();
  c.ellipse(cx, y1 - 22, w / 2, (y1 - l.y0 * T) * 0.75, 0, Math.PI, 0);
  c.fill();
  // 屋頂的格子燈帶，紫色慢慢流動
  for (let i = 1; i < 8; i += 1) {
    const glow = 0.45 + Math.sin(seconds * 2 + i) * 0.3;
    c.strokeStyle = `rgba(196, 160, 255, ${glow})`;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(cx, y1 - 22, (w / 2) * (i / 8), (y1 - l.y0 * T) * 0.75 * (i / 8), 0, Math.PI, 0);
    c.stroke();
  }
  px(c, '#c4a0ff', x + 4, y1 - 23, w - 8, 2);
  windows(c, x + 4, y1 - 20, w - 8, 18, 7, '#e9d8ff', 6, 6);
}

function memorialHall(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  shadow(c, x, y1, w);
  // 前面的廣場和階梯
  px(c, '#cfc6b4', x, y1 - 14, w, 14);
  for (let i = 0; i < 4; i += 1) px(c, '#b8ae9b', x + 10 + i * 3, y1 - 14 + i * 3, w - 20 - i * 6, 1);
  // 紅柱白牆
  px(c, '#f2ead8', x + 14, y1 - 40, w - 28, 26);
  for (let i = 0; i < 8; i += 1) px(c, '#b2342a', x + 18 + i * ((w - 40) / 7), y1 - 38, 3, 24);
  // 黃色屋頂、兩端翹起
  c.fillStyle = '#f2b632';
  c.beginPath();
  c.moveTo(x + 2, y1 - 40);
  c.lineTo(x + 16, y1 - 54);
  c.lineTo(x + w - 16, y1 - 54);
  c.lineTo(x + w - 2, y1 - 40);
  c.lineTo(x + w - 8, y1 - 44);
  c.lineTo(x + 8, y1 - 44);
  c.closePath();
  c.fill();
  px(c, '#ffd56a', x + 16, y1 - 54, w - 32, 2);
  px(c, '#ffe9a0', x + 14, y1 - 40, w - 28, 1);
}

function cityHall(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const h = (l.y1 - l.y0) * T + 12;
  shadow(c, x, y1, w);
  px(c, '#d9dde4', x, y1 - h, w, h);
  px(c, '#eef1f5', x, y1 - h, w, 4);
  windows(c, x, y1 - h + 4, w, h - 10, Math.floor(l.x0 * 13), '#ffe7a8', 5, 6);
  // 中間的大門、旗桿
  px(c, '#3a4256', x + w / 2 - 10, y1 - 14, 20, 14);
  px(c, '#ffe7a8', x + w / 2 - 8, y1 - 12, 16, 2);
}

function mall(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const parts = 3;
  const rand = seeded(Math.floor(l.x0 * 7 + l.y0));
  for (let i = 0; i < parts; i += 1) {
    const bw = w / parts - 3;
    const bx = x + i * (w / parts);
    const bh = 40 + Math.floor(rand() * 40);
    shadow(c, bx, y1, bw);
    px(c, ['#2b2f45', '#33284a', '#24384a'][i] ?? '#2b2f45', bx, y1 - bh, bw, bh);
    windows(c, bx, y1 - bh, bw, bh - 12, i * 17 + 3, '#ffd98a', 5, 5);
    // 招牌霓虹
    const neon = ['#ff4fa0', '#4fd1ff', '#ffd34f'][i] ?? '#ff4fa0';
    const on = Math.sin(seconds * 2.5 + i * 2) > -0.6;
    px(c, on ? neon : '#3a3a4a', bx + 4, y1 - 12, bw - 8, 5);
  }
}

function opera(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const h = 46;
  shadow(c, x, y1, w);
  px(c, '#f4f1ea', x, y1 - h, w, h);
  px(c, '#ffffff', x, y1 - h, w, 3);
  // 曲牆上的大洞：裡面亮暖黃燈
  for (let i = 0; i < 4; i += 1) {
    c.fillStyle = '#ffcf7a';
    c.beginPath();
    c.ellipse(x + 14 + i * ((w - 28) / 3), y1 - 20, 8, 14, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#ffe9b8';
    c.beginPath();
    c.ellipse(x + 14 + i * ((w - 28) / 3), y1 - 22, 4, 8, 0, 0, Math.PI * 2);
    c.fill();
  }
  // 前面的水池倒影
  px(c, 'rgba(120, 190, 255, 0.35)', x + 4, y1 - 2, w - 8, 3);
}

function twinTowers(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  for (let i = 0; i < 2; i += 1) {
    const bx = x + 8 + i * (w / 2);
    const bw = w / 2 - 16;
    const bh = 120;
    shadow(c, bx, y1, bw);
    px(c, '#1d2f4a', bx, y1 - bh, bw, bh);
    windows(c, bx, y1 - bh, bw, bh, 31 + i, '#a8d8ff', 4, 5);
    // 頂上的鑽石燈
    const glow = 0.6 + Math.sin(seconds * 2 + i) * 0.4;
    c.fillStyle = `rgba(255, 120, 220, ${glow})`;
    c.beginPath();
    c.moveTo(bx + bw / 2, y1 - bh - 18);
    c.lineTo(bx + bw, y1 - bh);
    c.lineTo(bx + bw / 2, y1 - bh + 6);
    c.lineTo(bx, y1 - bh);
    c.closePath();
    c.fill();
  }
}

function tower85(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const cx = x + w / 2;
  shadow(c, x, y1, w);
  // 兩條腿，中間鏤空（85 大樓的「高」字造型）
  px(c, '#20263a', x + 4, y1 - 90, 22, 90);
  px(c, '#20263a', x + w - 26, y1 - 90, 22, 90);
  windows(c, x + 4, y1 - 90, 22, 90, 85, '#fff1c4', 4, 5);
  windows(c, x + w - 26, y1 - 90, 22, 90, 86, '#fff1c4', 4, 5);
  // 上半合起來、越往上越細
  px(c, '#20263a', x + 4, y1 - 150, w - 8, 60);
  windows(c, x + 4, y1 - 150, w - 8, 60, 87, '#fff1c4', 4, 5);
  px(c, '#20263a', cx - 16, y1 - 190, 32, 40);
  windows(c, cx - 16, y1 - 190, 32, 40, 88, '#fff1c4', 4, 5);
  // 白色輪廓燈
  c.strokeStyle = 'rgba(255,255,255,0.75)';
  c.lineWidth = 1;
  c.strokeRect(x + 4.5, y1 - 150.5, w - 9, 60);
  c.strokeRect(cx - 15.5, y1 - 190.5, 31, 40);
  px(c, '#e8ecf3', cx - 1, y1 - 214, 2, 24);
  if (Math.sin(seconds * 3 + 1) > 0) px(c, '#ff4d4d', cx - 2, y1 - 217, 4, 3);
}

function musicCenter(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  shadow(c, x, y1, w);
  // 一叢六角形的塔，紫藍色燈光輪流亮
  const towers = [
    { dx: 0.15, h: 70, s: 12 },
    { dx: 0.35, h: 96, s: 15 },
    { dx: 0.55, h: 80, s: 13 },
    { dx: 0.75, h: 58, s: 11 },
  ];
  towers.forEach((tw, i) => {
    const cx = x + w * tw.dx;
    const glow = 0.5 + Math.sin(seconds * 2 + i * 1.3) * 0.4;
    for (let k = 0; k < tw.h; k += tw.s) {
      c.strokeStyle = `rgba(${i % 2 ? '120, 200, 255' : '210, 140, 255'}, ${glow})`;
      c.lineWidth = 1.5;
      c.beginPath();
      for (let a = 0; a <= 6; a += 1) {
        const ang = (a / 6) * Math.PI * 2;
        const hx = cx + Math.cos(ang) * (tw.s - k / 14);
        const hy = y1 - 8 - k + Math.sin(ang) * (tw.s - k / 14) * 0.45;
        if (a === 0) c.moveTo(hx, hy);
        else c.lineTo(hx, hy);
      }
      c.stroke();
    }
  });
  // 底下的長條建築
  px(c, '#2b2f45', x, y1 - 10, w, 10);
  px(c, '#9fd8ff', x + 4, y1 - 7, w - 8, 2);
}

function portTerminal(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  shadow(c, x, y1, w);
  px(c, '#e9eef5', x, y1 - 36, w, 36);
  windows(c, x, y1 - 30, w, 26, 41, '#bfe7ff', 4, 5);
  // 波浪狀屋頂
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(x, y1 - 36);
  for (let i = 0; i <= 8; i += 1) c.lineTo(x + (w / 8) * i, y1 - 36 - (i % 2 === 0 ? 10 : 2));
  c.lineTo(x + w, y1 - 36);
  c.closePath();
  c.fill();
  px(c, '#6fc3ff', x, y1 - 37, w, 1);
}

function exhibition(c: CanvasRenderingContext2D, l: Landmark): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  shadow(c, x, y1, w);
  px(c, '#2a3550', x, y1 - 30, w, 30);
  windows(c, x, y1 - 26, w, 22, 51, '#a9e1ff', 3, 4);
  // 白色波浪大屋頂，往外伸出去
  c.fillStyle = '#f4f6fa';
  c.beginPath();
  c.moveTo(x - 10, y1 - 30);
  c.quadraticCurveTo(x + w * 0.3, y1 - 56, x + w * 0.55, y1 - 38);
  c.quadraticCurveTo(x + w * 0.8, y1 - 24, x + w + 10, y1 - 40);
  c.lineTo(x + w + 10, y1 - 34);
  c.quadraticCurveTo(x + w * 0.8, y1 - 18, x + w * 0.55, y1 - 32);
  c.quadraticCurveTo(x + w * 0.3, y1 - 48, x - 10, y1 - 24);
  c.closePath();
  c.fill();
}

function ferris(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  // 夢時代的商場在下面，摩天輪在屋頂上轉
  shadow(c, x, y1, w);
  px(c, '#33284a', x, y1 - 34, w, 34);
  windows(c, x, y1 - 30, w, 24, 61, '#ffd98a', 5, 5);
  const cx = x + w / 2;
  const cy = y1 - 34 - 40;
  const r = 34;
  px(c, '#d6d9e0', cx - 1, cy, 2, 40);
  px(c, '#d6d9e0', cx - 12, y1 - 36, 24, 2);
  const colors = ['#ff4d6d', '#ffb84d', '#ffe94d', '#5dff8a', '#4dd2ff', '#9b6bff', '#ff6be0'];
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2 + seconds * 0.25;
    const col = colors[(i + Math.floor(seconds * 2)) % colors.length] ?? '#ffffff';
    px(c, col, Math.round(cx + Math.cos(a) * r) - 1, Math.round(cy + Math.sin(a) * r) - 1, 3, 3);
    if (i % 4 === 0) {
      c.strokeStyle = 'rgba(220, 225, 235, 0.5)';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(cx, cy);
      c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
      c.stroke();
    }
  }
}

function cruise(c: CanvasRenderingContext2D, l: Landmark, seconds: number): void {
  const x = l.x0 * T;
  const w = (l.x1 - l.x0) * T;
  const y1 = l.y1 * T;
  const bob = Math.round(Math.sin(seconds * 0.8));
  px(c, 'rgba(0,0,0,0.3)', x + 6, y1 - 4 + bob, w - 6, 5);
  // 船身、三層甲板、亮著的舷窗
  c.fillStyle = '#f4f6fa';
  c.beginPath();
  c.moveTo(x, y1 - 20 + bob);
  c.lineTo(x + w, y1 - 20 + bob);
  c.lineTo(x + w - 12, y1 - 4 + bob);
  c.lineTo(x + 8, y1 - 4 + bob);
  c.closePath();
  c.fill();
  px(c, '#1e3a6b', x + 10, y1 - 9 + bob, w - 24, 3);
  for (let i = 0; i < 3; i += 1) {
    px(c, '#e3e8f0', x + 20 + i * 8, y1 - 30 - i * 7 + bob, w - 50 - i * 16, 10);
    windows(c, x + 20 + i * 8, y1 - 30 - i * 7 + bob, w - 50 - i * 16, 10, 71 + i, '#ffe7a8', 4, 4);
  }
  px(c, '#d72d2d', x + w - 44, y1 - 46 + bob, 8, 10);
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

// 一般的城市街廓：屋頂＋前面一排亮窗（畫在地面那層，不會擋人）
export function drawCityBlock(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number): void {
  const rand = seeded(seed);
  const roof = ['#2a2e40', '#2f2a3e', '#263443', '#30303a'][Math.floor(rand() * 4)] ?? '#2a2e40';
  px(c, roof, x, y, w, h);
  px(c, 'rgba(255,255,255,0.06)', x, y, w, 2);
  // 屋頂上的冷氣、水塔
  for (let i = 0; i < 3; i += 1) if (rand() < 0.6) px(c, '#454a5c', x + 3 + Math.floor(rand() * (w - 8)), y + 3 + Math.floor(rand() * (h - 12)), 4, 3);
  const face = Math.min(10, Math.floor(h / 3));
  px(c, '#1a1d2a', x, y + h - face, w, face);
  windows(c, x, y + h - face, w, face + 2, seed + 1, rand() < 0.5 ? '#ffd98a' : '#bfe7ff', 4, 4);
}
