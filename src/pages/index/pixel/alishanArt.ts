// 阿里山的美術：玉山群峰、會飄的雲海、清晨的日出（台灣時間 5～7 點）、晚上的星星；檜木林、森林鐵路（紅色小火車開進阿里山車站停一下再開走）、
// 阿里山車站（原木色、灰瓦、站名牌）、站前廣場的小攤；森林地面（青苔、蕨類）、姊妹潭（姊潭中間的小亭子和木橋、妹潭）、
// 巨木群棧道（木板步道）、香林神木（超粗的紅檜、木圍欄）、櫻花樹（花瓣會飄下來）。最後組成 CityScene 用的 ALISHAN。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { AL, ALISHAN_SEATS, ALISHAN_SHOPS, MARKET_CARTS, PLAZA_TABLES, POND_BENCHES, POND_BENCH_Y, TABLE_Y, WALK_BENCHES, WALK_BENCH_Y } from './alishan';
import { px, seeded } from './pixelUtil';
import { T, SERIF_TC, text, glow, cached, blit, tiles, drawLamp, drawBench, drawFoodCart, drawStringLights, drawMarketTable, drawStool, drawStoneBench } from './cityArt';

// 紅檜（尖尖的深綠色，一層層的枝）
function cypress(c: CanvasRenderingContext2D, cx: number, by: number, h: number, dark: string, light: string): void {
  px(c, '#4a2e1c', Math.round(cx - 1), Math.round(by - 6), 3, 6);
  const layers = Math.max(3, Math.round(h / 7));
  for (let k = 0; k < layers; k += 1) {
    const y = by - 4 - (k * (h - 6)) / layers;
    const half = Math.max(2, ((layers - k) / layers) * (h * 0.28));
    c.fillStyle = k % 2 ? light : dark;
    c.beginPath();
    c.moveTo(cx - half, y);
    c.lineTo(cx, y - (h - 6) / layers - 3);
    c.lineTo(cx + half, y);
    c.closePath();
    c.fill();
  }
}

// 森林步道（巨木群棧道）經過的點（格）
const WALK: [number, number][] = [[15, 34.4], [20, 31], [24, 28.6], [31, 28.6], [38, 28.6], [42, 30.4], [44, 33.6]];
function walkPoint(t: number): { x: number; y: number } {
  const n = WALK.length - 1;
  const f = Math.min(n - 0.0001, Math.max(0, t * n));
  const i = Math.floor(f);
  const k = f - i;
  const a = WALK[i] ?? [0, 0];
  const b = WALK[i + 1] ?? a;
  return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k };
}

// ── 地面（畫一次）──
export function paintAlishanGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1912);
  const W = AL.W * T;
  const H = AL.H * T;
  const top = AL.rail.y0 * T;
  const sky = c.createLinearGradient(0, 0, 0, 5 * T);
  sky.addColorStop(0, '#8ab8e0');
  sky.addColorStop(1, '#e6eef4');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, top);
  // 玉山群峰：遠遠的藍灰色，主峰在中間偏東
  c.fillStyle = '#7a8fae';
  c.beginPath();
  c.moveTo(0, 5 * T);
  for (let x = 0; x <= W; x += 6) {
    const peak = Math.max(0, 1 - Math.abs(x - 34 * T) / (12 * T));
    const y = 3.6 * T - Math.sin(x * 0.02 + 1) * 8 - Math.abs(Math.sin(x * 0.051)) * 10 - peak * peak * 30;
    c.lineTo(x, y);
  }
  c.lineTo(W, 5 * T);
  c.fill();
  // 山頂的岩石（灰白）
  px(c, '#b8c4d4', 33.4 * T, 1.4 * T, 14, 4);
  // 近一點的山
  c.fillStyle = '#4f7a6a';
  c.beginPath();
  c.moveTo(0, top);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, 5.6 * T - Math.sin(x * 0.015 + 3) * 10 - Math.abs(Math.sin(x * 0.04)) * 8);
  c.lineTo(W, top);
  c.fill();
  // 鐵路北邊的檜木林
  px(c, '#2f5a3e', 0, 6.6 * T, W, top - 6.6 * T);
  for (let x = 2; x < W; x += 7 + rand() * 7) cypress(c, x, top - rand() * 10, 26 + rand() * 18, '#24503a', '#2f6446');
  // 森林鐵路：碎石道床、枕木、窄軌
  const r0 = AL.rail.y0 * T;
  const r1 = AL.rail.y1 * T;
  px(c, '#8a8478', 0, r0, W, r1 - r0);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#7a746a' : '#9a948a', Math.floor(rand() * W), Math.floor(r0 + rand() * (r1 - r0)), 2, 1);
  for (let x = 2; x < W; x += 6) px(c, '#5a3e2a', x, r0 + 3, 3, r1 - r0 - 6);
  for (const ry of [r0 + 6, r1 - 7]) {
    px(c, '#9aa0aa', 0, ry, W, 1);
    px(c, '#5a5e66', 0, ry + 1, W, 1);
  }
  // 月台（水泥＋黃線）
  tiles(c, { x0: 0, y0: AL.rail.y1, x1: AL.W, y1: AL.plaza.y0 }, '#c2bcae', '#aea898', 10);
  px(c, '#e8d85a', 0, r1 + 1, W, 2);
  // 車站前廣場（石板）
  tiles(c, { x0: 0, y0: AL.plaza.y0, x1: AL.W, y1: AL.plaza.y1 }, '#cfc6b4', '#bdb4a2', 12);
  // 森林地面：深綠的青苔、蕨類、落葉
  const f0 = AL.forest * T;
  px(c, '#4f7a4a', 0, f0, W, H - f0);
  for (let i = 0; i < 1200; i += 1) px(c, ['#46704a', '#5a8a52', '#3f6a42', '#6a8a4a'][i % 4] ?? '#4f7a4a', Math.floor(rand() * W), Math.floor(f0 + rand() * (H - f0)), 2, 1);
  for (let i = 0; i < 70; i += 1) {
    // 蕨類
    const x = rand() * W;
    const y = f0 + 10 + rand() * (H - f0 - 10);
    for (let k = -2; k <= 2; k += 1) px(c, '#6aa85a', Math.round(x + k * 2), Math.round(y - 4 + Math.abs(k)), 1, 4 - Math.abs(k));
  }
  for (let i = 0; i < 30; i += 1) px(c, '#8a8478', Math.floor(rand() * W), Math.floor(f0 + rand() * (H - f0)), 4, 3);
  // 姊妹潭：姊潭（大）、妹潭（小），潭邊的石頭
  for (const p of [AL.bigPond, AL.smallPond]) {
    c.fillStyle = '#5a5a4a';
    c.beginPath();
    c.ellipse(p.cx * T, p.cy * T, p.rx * T + 4, p.ry * T + 4, 0, 0, Math.PI * 2);
    c.fill();
    const g = c.createRadialGradient(p.cx * T, p.cy * T, 4, p.cx * T, p.cy * T, p.rx * T);
    g.addColorStop(0, '#5a9a8a');
    g.addColorStop(1, '#2f6a5a');
    c.fillStyle = g;
    c.beginPath();
    c.ellipse(p.cx * T, p.cy * T, p.rx * T, p.ry * T, 0, 0, Math.PI * 2);
    c.fill();
  }
  // 倒影（樹的深綠）
  for (let i = 0; i < 12; i += 1) {
    const a = rand() * Math.PI * 2;
    c.fillStyle = 'rgba(20,60,40,0.3)';
    c.beginPath();
    c.ellipse(AL.bigPond.cx * T + Math.cos(a) * AL.bigPond.rx * T * 0.75, AL.bigPond.cy * T + Math.sin(a) * AL.bigPond.ry * T * 0.6, 8, 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  // 往亭子的木橋（從南岸走過去）
  px(c, '#8a5a32', (AL.pavilion.x - 0.5) * T, AL.pavilion.y * T, T, (AL.bigPond.cy + AL.bigPond.ry - AL.pavilion.y) * T + 4);
  for (let y = AL.pavilion.y * T; y < (AL.bigPond.cy + AL.bigPond.ry) * T + 4; y += 3) px(c, '#a8703f', (AL.pavilion.x - 0.5) * T, y, T, 2);
  // 巨木群棧道（木板步道，沿著 WALK 一塊塊鋪）
  for (let t = 0; t <= 1; t += 0.0025) {
    const p = walkPoint(t);
    px(c, '#9a6a3e', Math.round(p.x * T - 14), Math.round(p.y * T - 6), 28, 12);
  }
  for (let t = 0; t <= 1; t += 0.008) {
    const p = walkPoint(t);
    px(c, '#7a5230', Math.round(p.x * T - 14), Math.round(p.y * T - 6), 28, 1);
  }
  // 神木前的木平台
  tiles(c, { x0: AL.sacredTree.x - 4, y0: AL.sacredTree.y + 0.2, x1: AL.sacredTree.x + 4, y1: AL.sacredTree.y + 3.2 }, '#9a6a3e', '#7a5230', 6);
}

// ── 會動的天空：雲海、日出（台灣時間清晨）、晚上的星星 ──
function taiwanHour(): number {
  const parts = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Asia/Taipei' }).formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === 'hour')?.value ?? 12) % 24;
  const m = Number(parts.find((p) => p.type === 'minute')?.value ?? 0);
  return h + m / 60;
}
function drawSky(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const W = AL.W * T;
  if (d.night) {
    for (let i = 0; i < 60; i += 1) {
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(d.seconds * 0.8 + i * 1.7));
      px(c, `rgba(255,255,240,${tw})`, (i * 197) % W, (i * 53) % Math.round(3 * T), 1, 1);
    }
  }
  // 祝山日出：清晨 5～7 點，太陽從玉山後面慢慢升起
  const h = taiwanHour();
  if (h >= 5 && h < 7.5) {
    const k = (h - 5) / 2.5;
    const sx = 36 * T;
    const sy = 3.4 * T - k * 50;
    glow(c, sx, sy, 90, '255, 180, 100', 0.6 * (1 - k * 0.5));
    c.fillStyle = '#ffd27a';
    c.beginPath();
    c.arc(sx, sy, 10, 0, Math.PI * 2);
    c.fill();
  }
  // 雲海：一條白白的雲帶在山谷裡慢慢飄（每朵是幾團疊起來的，只畫在地圖範圍裡）
  c.save();
  c.beginPath();
  c.rect(0, 0, W, AL.rail.y0 * T);
  c.clip();
  for (let i = 0; i < 22; i += 1) {
    const x = ((i * 113 + d.seconds * (2 + (i % 3))) % (W + 120)) - 60;
    const y = 4.5 * T + ((i * 29) % 20) - 4;
    const w = 22 + ((i * 17) % 20);
    for (const [dx, dy, k] of [[0, 0, 1], [-w * 0.6, 3, 0.7], [w * 0.6, 2, 0.75], [-w * 0.2, -4, 0.6], [w * 0.3, -3, 0.55]] as const) {
      c.fillStyle = `rgba(255,255,255,${0.35 + ((i * 7) % 4) / 20})`;
      c.beginPath();
      c.ellipse(x + dx, y + dy, w * k, 7 * k + 2, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  c.restore();
}

// ── 森林鐵路的小火車：紅色柴油機車頭＋兩節紅色客車，從東邊開進阿里山車站，停一下再往西開走 ──
const TRAIN_CYCLE = 100;
const LOCO = 2.4;
const CAR = 2.9;
const TRAIN_LEN = LOCO + CAR * 2 + 0.2;
const STOP_HEAD = (AL.station.x0 + AL.station.x1) / 2 - TRAIN_LEN / 2;
// 回傳車頭（最西邊）的 x；不在畫面上就 null
function trainHead(seconds: number): number | null {
  const t = seconds % TRAIN_CYCLE;
  const start = AL.W + 1;
  if (t < 20) {
    const k = t / 20;
    return start - (start - STOP_HEAD) * (1 - (1 - k) * (1 - k));
  }
  if (t < 36) return STOP_HEAD;
  if (t < 58) {
    const k = (t - 36) / 22;
    return STOP_HEAD - (STOP_HEAD + TRAIN_LEN + 1) * k * k;
  }
  return null;
}
function drawTrain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const head = trainHead(d.seconds);
  if (head === null) return;
  const by = Math.round(AL.rail.y1 * T - 4);
  const hx = Math.round(head * T);
  const wheels = (x0: number, w: number) => {
    px(c, '#15171f', x0 + 2, by - 4, w - 4, 3);
    for (const wx of [x0 + 4, x0 + 10, x0 + w - 14, x0 + w - 8]) px(c, '#2b2d33', wx, by - 2, 4, 3);
  };
  const lw = Math.round(LOCO * T);
  px(c, 'rgba(0,0,0,0.25)', hx, by + 1, lw, 3);
  wheels(hx, lw);
  px(c, '#c8102e', hx + 2, by - 14, lw - 4, 10);
  px(c, '#c8102e', hx + lw - 16, by - 22, 14, 8);
  px(c, '#e8344a', hx + lw - 16, by - 22, 14, 1);
  px(c, '#2f3a42', hx + lw - 14, by - 20, 4, 4);
  px(c, '#2f3a42', hx + lw - 8, by - 20, 4, 4);
  px(c, '#f2e2b8', hx + 2, by - 9, lw - 4, 2);
  px(c, d.night ? '#fff6c8' : '#f2e2b8', hx + 1, by - 13, 2, 3);
  if (d.night) glow(c, hx - 4, by - 11, 20, '255, 245, 200', 0.5);
  const cw = Math.round(CAR * T);
  for (let k = 0; k < 2; k += 1) {
    const x0 = hx + lw + 2 + k * (cw + 2);
    px(c, 'rgba(0,0,0,0.25)', x0, by + 1, cw, 3);
    wheels(x0, cw);
    px(c, '#a8222a', x0, by - 21, cw, 17);
    px(c, '#5a5d66', x0 - 1, by - 23, cw + 2, 3);
    px(c, '#f2e2b8', x0, by - 18, cw, 8);
    for (let wx = x0 + 3; wx + 5 <= x0 + cw - 2; wx += 7) px(c, d.night ? '#ffe9a8' : '#3a4656', wx, by - 17, 5, 6);
    px(c, '#8a1a20', x0, by - 9, cw, 1);
  }
}

// ── 阿里山車站：原木色的牆、直的木板、灰瓦斜屋頂、中間的山牆和站名 ──
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((AL.station.x1 - AL.station.x0) * T);
  const h = 74;
  return cached('al-station', w, h, (c) => {
    const cx = w / 2;
    const wallTop = 30;
    px(c, '#c58a52', 4, wallTop, w - 8, h - wallTop - 4);
    for (let x = 6; x < w - 4; x += 4) px(c, '#a86a3a', x, wallTop, 1, h - wallTop - 4);
    px(c, '#8a5a32', 4, wallTop, w - 8, 2);
    for (let x = 14; x < w - 24; x += 26) {
      if (Math.abs(x + 9 - cx) < 30) continue;
      px(c, '#6b4428', x - 1, wallTop + 8, 20, 16);
      px(c, '#d8e4e6', x, wallTop + 9, 18, 14);
      px(c, '#6b4428', x + 9, wallTop + 9, 1, 14);
      px(c, '#6b4428', x, wallTop + 15, 18, 1);
    }
    px(c, '#4a2e1c', cx - 16, h - 32, 32, 28);
    px(c, '#f6dfae', cx - 14, h - 30, 28, 26);
    px(c, '#8a5a32', cx, h - 30, 1, 26);
    px(c, '#9a948a', 0, h - 4, w, 4);
    // 雨庇
    px(c, '#5a6070', cx - 28, h - 36, 56, 4);
    px(c, '#3a3e46', cx - 28, h - 32, 56, 1);
    // 屋頂＋山牆
    c.fillStyle = '#5a6070';
    c.beginPath();
    c.moveTo(-3, wallTop + 2);
    c.lineTo(10, 12);
    c.lineTo(w - 10, 12);
    c.lineTo(w + 3, wallTop + 2);
    c.closePath();
    c.fill();
    for (let y = 14; y < wallTop; y += 3) px(c, '#4a4f58', 4, y, w - 8, 1);
    c.fillStyle = '#c58a52';
    c.beginPath();
    c.moveTo(cx - 26, wallTop + 1);
    c.lineTo(cx, 2);
    c.lineTo(cx + 26, wallTop + 1);
    c.closePath();
    c.fill();
    c.strokeStyle = '#4a4f58';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx - 28, wallTop + 2);
    c.lineTo(cx, 1);
    c.lineTo(cx + 28, wallTop + 2);
    c.stroke();
    px(c, '#ffffff', cx - 18, 16, 36, 11);
    px(c, '#3a3d45', cx - 18, 16, 36, 1);
    text(c, '阿里山車站', cx, 21.5, '#15171f', `900 7px ${SERIF_TC}`);
  });
}

// ── 姊妹潭的亭子（紅柱、綠瓦的小涼亭） ──
function drawPavilion(c: CanvasRenderingContext2D): void {
  const cx = Math.round(AL.pavilion.x * T);
  const by = Math.round(AL.pavilion.y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 14, by - 1, 28, 3);
  px(c, '#a8a296', cx - 13, by - 4, 26, 4);
  for (const x of [cx - 11, cx + 8]) px(c, '#b71c1c', x, by - 22, 3, 18);
  c.fillStyle = '#3f7a5a';
  c.beginPath();
  c.moveTo(cx - 18, by - 20);
  c.quadraticCurveTo(cx - 8, by - 24, cx, by - 36);
  c.quadraticCurveTo(cx + 8, by - 24, cx + 18, by - 20);
  c.closePath();
  c.fill();
  px(c, '#2f6a4a', cx - 18, by - 21, 36, 2);
  px(c, '#f6c945', cx - 1, by - 39, 2, 4);
}

// ── 香林神木：超粗的紅檜樹幹（裂開的樹皮）、上面稀稀的樹冠，前面一圈木圍欄 ──
function drawSacredTree(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(AL.sacredTree.x * T);
  const by = Math.round(AL.sacredTree.y * T);
  px(c, 'rgba(0,0,0,0.3)', cx - 34, by - 3, 68, 6);
  // 根
  c.fillStyle = '#6a4228';
  c.beginPath();
  c.moveTo(cx - 34, by);
  c.quadraticCurveTo(cx - 22, by - 6, cx - 20, by - 30);
  c.lineTo(cx + 20, by - 30);
  c.quadraticCurveTo(cx + 22, by - 6, cx + 34, by);
  c.closePath();
  c.fill();
  // 樹幹（往上慢慢變細）
  c.fillStyle = '#7a4a2a';
  c.beginPath();
  c.moveTo(cx - 20, by - 28);
  c.lineTo(cx - 13, by - 150);
  c.lineTo(cx + 13, by - 150);
  c.lineTo(cx + 20, by - 28);
  c.closePath();
  c.fill();
  for (let k = -16; k <= 14; k += 5) px(c, '#5a3420', cx + k, by - 140, 2, 112 - Math.abs(k));
  px(c, '#9a6a42', cx - 14, by - 130, 3, 90);
  // 樹冠（稀稀的、一叢叢）
  for (const [dx, dy, rw] of [[-30, -158, 22], [26, -162, 24], [0, -176, 26], [-16, -186, 16], [18, -190, 16], [-40, -146, 14], [40, -150, 14]] as const) {
    c.fillStyle = '#2f5a3e';
    c.beginPath();
    c.ellipse(cx + dx, by + dy, rw, 9, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#3f6e4c', cx + dx - rw / 2, by + dy - 5, rw, 3);
  }
  // 木圍欄
  for (let x = cx - 40; x <= cx + 40; x += 10) px(c, '#8a5a32', x, by + 2, 3, 12);
  px(c, '#a8703f', cx - 40, by + 4, 83, 2);
  px(c, '#a8703f', cx - 40, by + 9, 83, 2);
  // 牌子
  px(c, '#5a3820', cx + 44, by - 2, 2, 16);
  px(c, '#f4efe2', cx + 34, by - 12, 22, 12);
  text(c, '香林神木', cx + 45, by - 6, '#3a2414', `900 5px ${SERIF_TC}`);
  if (d.night) glow(c, cx, by - 20, 50, '255, 220, 150', 0.3);
}

// ── 櫻花樹（粉紅色的一團，花瓣慢慢飄下來） ──
function drawCherry(c: CanvasRenderingContext2D, x: number, y: number, d: DrawCtx, seed: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 14, by - 1, 28, 3);
  px(c, '#4a2e1c', cx - 2, by - 20, 4, 20);
  px(c, '#4a2e1c', cx - 8, by - 24, 7, 2);
  px(c, '#4a2e1c', cx + 2, by - 26, 7, 2);
  for (const [dx, dy, r, col] of [[-10, -30, 10, '#f4a8c4'], [10, -30, 10, '#f4a8c4'], [0, -38, 12, '#f8bcd4'], [-4, -26, 8, '#fcd0e0'], [6, -36, 7, '#ffe0ec']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  for (let k = 0; k < 4; k += 1) {
    const t = (d.seconds * 0.12 + k / 4 + seed * 0.13) % 1;
    const px0 = cx - 12 + ((k * 9 + seed * 5) % 24) + Math.sin(t * 8 + k) * 5;
    const py0 = by - 30 + t * 34;
    px(c, `rgba(248,180,206,${1 - t * 0.6})`, Math.round(px0), Math.round(py0), 2, 1);
  }
}

// ── 組成 CityScene 用的資料 ──
const GIANTS: [number, number, number][] = [[2.4, 24.4, 70], [22.6, 23.8, 66], [29, 24.6, 76], [36.6, 24, 70], [52.4, 25, 74], [54.4, 34.8, 66], [30, 36.6, 70], [3, 37.2, 60], [40, 36.8, 62], [20.6, 37.4, 58]];
const CHERRIES: [number, number][] = [[1.6, 13.4], [11, 21], [44, 21], [54.4, 13.4], [20.6, 26.6], [49, 27.4], [24.4, 35.2], [36.4, 33.8], [13.2, 36.6]];
const LAMPS: [number, number][] = [[14, 13.4], [42, 13.4], [8, 21.6], [48, 21.6], [25, 30.6], [38.4, 30.6]];

const props: CityProp[] = [
  { y: 0.1, draw: (c, d) => drawSky(c, d) },
  { y: AL.rail.y1 - 0.01, draw: (c, d) => drawTrain(c, d) },
  { y: AL.station.line, draw: (c) => blit(c, stationSprite(), AL.station.x0 * T, AL.station.line * T) },
  ...MARKET_CARTS.map((s, i): CityProp => ({ y: AL.cartY, draw: (c, d) => drawFoodCart(c, s.x, AL.cartY, s.name, s.awning, s.food, d.seconds + i * 0.37, 71 + i * 7) })),
  { y: AL.cartY + 0.02, draw: (c, d) => drawStringLights(c, 15, 41.6, AL.cartY - 2.9, d.night, 5) },
  ...PLAZA_TABLES.map((x): CityProp => ({ y: TABLE_Y, draw: (c) => drawMarketTable(c, x, TABLE_Y) })),
  { y: AL.pavilion.y, draw: (c) => drawPavilion(c) },
  ...POND_BENCHES.map((x): CityProp => ({ y: POND_BENCH_Y - 0.01, draw: (c) => drawStoneBench(c, x, POND_BENCH_Y) })),
  ...WALK_BENCHES.map((x): CityProp => ({ y: WALK_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, WALK_BENCH_Y, 2.6) })),
  { y: AL.sacredTree.y, draw: (c, d) => drawSacredTree(c, d) },
  ...GIANTS.map(([x, y, h]): CityProp => ({ y, draw: (c) => cypress(c, x * T, y * T, h, '#24503a', '#2f6446') })),
  ...CHERRIES.map(([x, y], i): CityProp => ({ y, draw: (c, d) => drawCherry(c, x, y, d, i) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 潭水不能走（往亭子的木橋可以）
function blocked(x: number, y: number): boolean {
  const onBridge = Math.abs(x - AL.pavilion.x) < 0.45 && y > AL.pavilion.y + 0.2;
  for (const p of [AL.bigPond, AL.smallPond]) {
    if (((x - p.cx) / (p.rx + 0.2)) ** 2 + ((y - p.cy) / (p.ry + 0.2)) ** 2 < 1 && !onBridge) return true;
  }
  return false;
}
const solid: Rect[] = [
  r(0, 0, AL.W, AL.rail.y1 + 0.3),
  r(AL.station.x0, AL.station.line - 2.6, AL.station.x1, AL.station.line - 0.05),
  ...MARKET_CARTS.map((s) => r(s.x - 1.25, AL.cartY - 0.8, s.x + 1.25, AL.cartY - 0.05)),
  ...PLAZA_TABLES.map((x) => r(x - 1.2, TABLE_Y - 0.4, x + 1.2, TABLE_Y)),
  r(AL.pavilion.x - 0.9, AL.pavilion.y - 0.4, AL.pavilion.x + 0.9, AL.pavilion.y + 0.1),
  ...POND_BENCHES.map((x) => r(x - 1.3, POND_BENCH_Y - 0.35, x + 1.3, POND_BENCH_Y - 0.1)),
  ...WALK_BENCHES.map((x) => r(x - 1.3, WALK_BENCH_Y - 0.75, x + 1.3, WALK_BENCH_Y - 0.45)),
  r(AL.sacredTree.x - 2.6, AL.sacredTree.y - 0.5, AL.sacredTree.x + 2.6, AL.sacredTree.y + 0.9),
  ...GIANTS.map(([x, y]) => r(x - 0.25, y - 0.3, x + 0.25, y + 0.05)),
  ...CHERRIES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...MARKET_CARTS.map((s) => ({ x: s.x * T, y: AL.cartY * T - 14, r: 40, color: 'rgba(255, 215, 140, 0.55)' })),
  { x: ((AL.station.x0 + AL.station.x1) / 2) * T, y: AL.station.line * T - 24, r: 80, color: 'rgba(255, 220, 150, 0.45)' },
  { x: AL.pavilion.x * T, y: AL.pavilion.y * T - 16, r: 36, color: 'rgba(255, 210, 140, 0.4)' },
];

const stationX = (AL.station.x0 + AL.station.x1) / 2;

export const ALISHAN: CityDef = {
  id: 'alishan',
  W: AL.W,
  H: AL.H,
  title: { 'zh-TW': '阿里山 · 神木與姊妹潭', 'en-US': 'Alishan · Sacred Tree & Sister Ponds' },
  stop: { 'zh-TW': '阿里山（嘉義轉小火車）', 'en-US': 'Alishan (via Chiayi)' },
  emoji: '🌲',
  line: 'tra',
  station: {
    x: stationX,
    y: AL.station.line + 0.7,
    name: { 'zh-TW': '阿里山車站（森林鐵路往嘉義）', 'en-US': 'Alishan Station (forest railway to Chiayi)' },
    arrive: { x: stationX + 3, y: AL.station.line + 0.9 },
  },
  background: '#3f6a42',
  soundscape: 'zoo',
  paintGround: paintAlishanGround,
  props,
  solid,
  blocked,
  seats: ALISHAN_SEATS,
  drawSeat: (c, i) => {
    const s = ALISHAN_SEATS[i];
    if (s && i >= 8) drawStool(c, s.x, s.y, '#8a5a32');
  },
  shops: ALISHAN_SHOPS,
  infos: [
    { at: r(20, 0, 48, 5), title: { 'zh-TW': '玉山與雲海', 'en-US': 'Yushan & the Sea of Clouds' }, text: { 'zh-TW': '從阿里山往東看得到玉山，海拔 3,952 公尺，是台灣最高峰。清晨到祝山看日出，山谷裡常常是一整片雲海。', 'en-US': 'Looking east from Alishan you can see Yushan, Taiwan’s highest peak at 3,952 m. Catch the sunrise at Zhushan at dawn — the valleys are often filled with a sea of clouds.' } },
    { at: r(0, AL.rail.y0 - 0.6, AL.W, AL.rail.y1), title: { 'zh-TW': '阿里山森林鐵路', 'en-US': 'Alishan Forest Railway' }, text: { 'zh-TW': '從嘉義一路爬到海拔 2,000 多公尺的窄軌鐵路，以前用來運木材，現在載遊客上山。', 'en-US': 'A narrow-gauge line climbing from Chiayi to over 2,000 m. Built to haul timber, it now carries visitors up the mountain.' } },
    { at: r(AL.station.x0, 9, AL.station.x1, AL.station.line), title: { 'zh-TW': '阿里山車站', 'en-US': 'Alishan Station' }, text: { 'zh-TW': '森林鐵路的山上大站，從這裡可以轉往沼平、神木、祝山的支線。', 'en-US': 'The forest railway’s main mountain station, with branch lines to Zhaoping, the Sacred Tree and Zhushan.' } },
    { at: r(AL.bigPond.cx - AL.bigPond.rx, AL.smallPond.cy - AL.smallPond.ry - 1, AL.smallPond.cx + AL.smallPond.rx, AL.bigPond.cy + AL.bigPond.ry), title: { 'zh-TW': '姊妹潭', 'en-US': 'Sister Ponds' }, text: { 'zh-TW': '森林裡一大一小兩個水潭，大的叫姊潭、中間有小亭子，小的叫妹潭。傳說是兩個鄒族姊妹的故事。', 'en-US': 'Two ponds in the forest — the larger “Elder Sister” with a little pavilion, and the smaller “Younger Sister”. Legend tells of two Tsou sisters.' } },
    { at: r(22, 25, 42, 30), title: { 'zh-TW': '巨木群棧道', 'en-US': 'Giant Tree Trail' }, text: { 'zh-TW': '木棧道穿過一棵棵上千歲的紅檜和扁柏，有的大到好幾個人才抱得住。', 'en-US': 'A boardwalk winding past red cypress and Taiwan cypress over a thousand years old — some take several people to hug.' } },
    { at: r(AL.sacredTree.x - 3, AL.sacredTree.y - 12, AL.sacredTree.x + 3, AL.sacredTree.y), title: { 'zh-TW': '香林神木', 'en-US': 'Xianglin Sacred Tree' }, text: { 'zh-TW': '老阿里山神木倒下後選出的第二代神木，是一棵紅檜，樹齡大約 2,300 年。', 'en-US': 'Chosen as the new Sacred Tree after the old one fell — a red cypress about 2,300 years old.' } },
    { at: r(19.6, 24.4, 21.6, 26.6), title: { 'zh-TW': '阿里山櫻花', 'en-US': 'Alishan Cherry Blossoms' }, text: { 'zh-TW': '每年三、四月是阿里山的櫻花季，吉野櫻開滿整片山區。', 'en-US': 'March and April is cherry blossom season — Yoshino cherries cover the whole area.' } },
  ],
  labels: [
    { x: AL.bigPond.cx, y: AL.bigPond.cy - AL.bigPond.ry - 1.2, text: { 'zh-TW': '💧 姊妹潭（石椅坐下專注）', 'en-US': '💧 Sister Ponds (sit on a bench)' }, color: '#7dd3fc' },
    { x: 31, y: 24.2, text: { 'zh-TW': '🌲 巨木群棧道', 'en-US': '🌲 Giant Tree Trail' }, color: '#86efac' },
    { x: AL.sacredTree.x, y: AL.sacredTree.y - 13, text: { 'zh-TW': '🌳 香林神木', 'en-US': '🌳 Xianglin Sacred Tree' }, color: '#fbbf24' },
  ],
  walkers: [
    { x0: 1, y0: 12.2, x1: 55, y1: 12.2, count: 3 },
    { x0: 14, y0: 19.6, x1: 42, y1: 19.6, count: 3 },
    { x0: 24, y0: 28.6, x1: 38, y1: 28.6, count: 3 },
    { x0: 1, y0: 22.8, x1: 55, y1: 22.8, count: 2 },
    { x0: 4, y0: 34.6, x1: 50, y1: 34.6, count: 2 },
  ],
  traffic: [],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點姊妹潭的石椅、巨木棧道的長椅或車站前的桌子坐下專注 · 走到攤子買愛玉、竹筒飯、阿里山咖啡 · 點地標看介紹 · 阿里山車站回台北（森林鐵路轉台鐵）',
    'en-US': 'WASD / arrows to move · click a bench at the Sister Ponds, on the giant tree trail or a table by the station to focus · walk up to the stalls for aiyu jelly, bamboo rice and Alishan coffee · click landmarks for info · Alishan Station back to Taipei (forest railway + TRA)',
  },
  hintTouch: {
    'zh-TW': '點潭邊石椅、棧道長椅或桌子坐下專注 · 走到攤子買東西 · 點地標看介紹 · 車站回台北',
    'en-US': 'Tap a pond bench, trail bench or table to focus · walk up to the stalls · tap landmarks · station back to Taipei',
  },
};
