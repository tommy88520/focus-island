// 神戶的美術：六甲山（山上的錨和市章，晚上會亮）、北野異人館（風見雞館：紅磚、尖塔、會轉的風向雞；萌黃館：淺綠木屋）、
// 南京町（長安門、紅燈籠、攤子、桌椅）、JR 三之宮站（高架月台上有 JR 電車開過）、美利堅公園（神戶塔、海洋博物館、BE KOBE、摩天輪）、
// 神戶港（船）。最後組成 CityScene 用的 KOBE。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CHINA_CARTS, CHINA_TABLES, CHINA_TABLE_Y, HARBOR_BENCHES, HARBOR_BENCH_Y, KB, KITANO_BENCHES, KITANO_BENCH_Y, KOBE_SEATS, KOBE_SHOPS } from './kobe';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, drawBench, drawFoodCart, drawMarketTable, drawStool, drawArch, drawStreetTree } from './cityArt';
import { drawLantern, drawStreetLamp } from './kyotoArt';

// ── 地面（畫一次）──
export function paintKobeGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1868);
  const W = KB.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 3 * T);
  sky.addColorStop(0, '#7cbbe8');
  sky.addColorStop(1, '#e2f1f9');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 3 * T);
  // 六甲山
  c.fillStyle = '#4a7448';
  c.beginPath();
  c.moveTo(0, 7 * T);
  for (let x = 0; x <= W; x += 12) c.lineTo(x, 1.6 * T + Math.sin(x * 0.008) * 10 + Math.sin(x * 0.027) * 5);
  c.lineTo(W, 7 * T);
  c.fill();
  for (let i = 0; i < 160; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#3f6a3e' : '#56825a';
    c.beginPath();
    c.arc(rand() * W, 2.6 * T + rand() * 4.4 * T, 4 + rand() * 5, 0, Math.PI * 2);
    c.fill();
  }
  // 山坡上的住宅
  px(c, '#6c8a5a', 0, 6.6 * T, W, (KB.kitanoLine - 6.6) * T);
  for (let x = 0; x < W; x += 22 + Math.floor(rand() * 10)) {
    const y = 6.6 * T + rand() * 3 * T;
    px(c, ['#e8dcc4', '#d6dde6', '#f0d2c0'][Math.floor(rand() * 3)] ?? '#e8dcc4', x, y, 18, 12);
    px(c, ['#8a3a2a', '#4a4f58', '#3a6a8a'][Math.floor(rand() * 3)] ?? '#4a4f58', x - 2, y - 3, 22, 4);
  }
  // 北野坂：紅磚路
  const brick = (y0: number, y1: number, x0: number, x1: number, base: string, joint: string) => {
    px(c, base, x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let y = y0 * T, row = 0; y < y1 * T; y += 5, row += 1) {
      px(c, joint, x0 * T, Math.round(y) + 4, (x1 - x0) * T, 1);
      for (let x = x0 * T + (row % 2) * 6; x < x1 * T; x += 12) px(c, joint, Math.round(x), Math.round(y), 1, 4);
    }
  };
  brick(KB.kitanoLine, 17.4, 0, KB.W, '#b8705a', '#9d5a46');
  // 南京町：紅色系的地磚；車站前廣場
  tiles(c, { x0: 0, y0: 17.4, x1: 36, y1: KB.chinaY1 }, '#d8b8a0', '#c4a088', 12);
  tiles(c, { x0: 36, y0: 17.4, x1: KB.W, y1: KB.chinaY1 }, '#d4cfc4', '#c2bcb0', 16);
  px(c, '#cfc9bd', 0, KB.chinaY1 * T, W, (KB.road.y0 - KB.chinaY1) * T);
  road(c, { x0: 0, y0: KB.road.y0, x1: KB.W, y1: KB.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((KB.road.y0 + KB.road.y1) / 2) * T), 12, 1);
  zebra(c, 17, KB.road.y0, 21, KB.road.y1, false);
  zebra(c, 44, KB.road.y0, 48, KB.road.y1, false);
  // 美利堅公園：淺色的廣場、草地
  tiles(c, { x0: 0, y0: KB.road.y1, x1: KB.W, y1: KB.sea }, '#e2ded4', '#d0cbbe', 16);
  for (const [x0, x1] of [[1, 6], [30, 38], [51, 55]] as const) px(c, '#7aa65a', x0 * T, (KB.road.y1 + 0.6) * T, (x1 - x0) * T, 1.6 * T);
  // 岸邊、海
  px(c, '#8f897d', 0, KB.sea * T - 4, W, 4);
  const water = c.createLinearGradient(0, KB.sea * T, 0, KB.H * T);
  water.addColorStop(0, '#3f86b0');
  water.addColorStop(1, '#2a6890');
  c.fillStyle = water;
  c.fillRect(0, KB.sea * T, W, (KB.H - KB.sea) * T);
  for (let i = 0; i < 90; i += 1) px(c, 'rgba(255,255,255,0.25)', Math.floor(rand() * W), Math.floor(KB.sea * T + 4 + rand() * (KB.H - KB.sea) * T), 6 + Math.floor(rand() * 8), 1);
}

// 六甲山上的錨和神戶市章（晚上會亮）
function drawAnchor(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const col = d.night ? '#ffe08a' : 'rgba(240,240,230,0.85)';
  const ax = 14 * T;
  const ay = 3.2 * T;
  px(c, col, ax - 1, ay, 3, 18);
  px(c, col, ax - 6, ay + 3, 13, 2);
  px(c, col, ax - 9, ay + 14, 3, 4);
  px(c, col, ax + 7, ay + 14, 3, 4);
  px(c, col, ax - 7, ay + 17, 15, 2);
  // 市章（兩個弧）
  const mx = 40 * T;
  const my = 3.6 * T;
  c.strokeStyle = col;
  c.lineWidth = 3;
  c.beginPath();
  c.arc(mx, my + 6, 9, Math.PI * 0.9, Math.PI * 2.1);
  c.stroke();
  c.beginPath();
  c.arc(mx + 4, my + 10, 6, Math.PI * 1.1, Math.PI * 2.3);
  c.stroke();
  if (d.night) {
    glow(c, ax, ay + 10, 26, '255, 220, 120', 0.4);
    glow(c, mx, my + 8, 26, '255, 220, 120', 0.4);
  }
}

// 風見雞館：紅磚、深色尖屋頂、中間的尖塔
function kazamidoriSprite(): HTMLCanvasElement {
  const w = Math.round((KB.kazamidori.x1 - KB.kazamidori.x0) * T);
  const h = 104;
  return cached('kb-kazamidori', w, h, (c) => {
    const cx = w / 2;
    px(c, '#9a948a', 2, h - 6, w - 4, 6);
    px(c, '#b5583e', 6, 46, w - 12, h - 52);
    for (let y = 48; y < h - 6; y += 4) for (let x = 6 + ((y / 4) % 2) * 4; x < w - 6; x += 8) px(c, '#9d4634', x, y, 1, 3);
    for (let y = 50; y < h - 6; y += 4) px(c, '#9d4634', 6, y, w - 12, 1);
    // 窗（白框、上面半圓）
    for (const x of [16, 44, w - 58, w - 30]) {
      px(c, '#f4efe2', x - 1, 58, 16, 22);
      px(c, '#3a4a5a', x + 1, 61, 12, 17);
      px(c, '#f4efe2', x + 6, 61, 1, 17);
    }
    // 門
    px(c, '#f4efe2', cx - 11, h - 30, 22, 24);
    px(c, '#5a3a22', cx - 8, h - 27, 16, 21);
    // 兩邊的屋頂
    c.fillStyle = '#3d4a5a';
    for (const [x0, x1] of [[2, cx - 10], [cx + 10, w - 2]] as const) {
      c.beginPath();
      c.moveTo(x0, 48);
      c.lineTo((x0 + x1) / 2, 18);
      c.lineTo(x1, 48);
      c.fill();
    }
    // 中間的塔＋尖頂
    px(c, '#b5583e', cx - 12, 22, 24, 30);
    px(c, '#f4efe2', cx - 5, 28, 10, 14);
    px(c, '#3a4a5a', cx - 3, 30, 6, 10);
    c.fillStyle = '#2f3a48';
    c.beginPath();
    c.moveTo(cx - 14, 24);
    c.lineTo(cx, 2);
    c.lineTo(cx + 14, 24);
    c.fill();
  });
}
// 風向雞（會隨風轉一下）
function drawWeathercock(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = ((KB.kazamidori.x0 + KB.kazamidori.x1) / 2) * T;
  const top = KB.kitanoLine * T - 104;
  const flip = Math.sin(d.seconds * 0.4) > 0 ? 1 : -1;
  px(c, '#c9a24a', cx - 1, top - 8, 2, 10);
  px(c, '#c9a24a', cx - 6, top - 4, 12, 1);
  px(c, '#e8b830', cx - 4 * flip - 3, top - 14, 8, 6);
  px(c, '#e8b830', cx + 4 * flip - 1, top - 17, 3, 4);
  px(c, '#e8402e', cx + 4 * flip - 1, top - 19, 2, 2);
  px(c, '#e8b830', cx - 7 * flip - 2, top - 18, 3, 6);
}

// 萌黃館：淺綠色的木造洋館、白色的陽台
function moegiSprite(): HTMLCanvasElement {
  const w = Math.round((KB.moegi.x1 - KB.moegi.x0) * T);
  const h = 88;
  return cached('kb-moegi', w, h, (c) => {
    px(c, '#9a948a', 2, h - 6, w - 4, 6);
    px(c, '#b8d8b0', 6, 26, w - 12, h - 32);
    for (let y = 28; y < h - 6; y += 3) px(c, '#a2c49a', 6, y, w - 12, 1);
    // 兩層的白色陽台（凸窗）
    for (const y of [32, 58]) {
      px(c, '#f4f6f8', 10, y, w - 20, 20);
      for (let x = 14; x < w - 14; x += 10) px(c, '#9fc7d9', x, y + 3, 7, 13);
      px(c, '#e2e6ea', 10, y + 18, w - 20, 2);
    }
    // 屋頂、煙囪
    c.fillStyle = '#5a6070';
    c.beginPath();
    c.moveTo(0, 28);
    c.lineTo(18, 8);
    c.lineTo(w - 18, 8);
    c.lineTo(w, 28);
    c.fill();
    px(c, '#b5583e', 24, 0, 8, 12);
    px(c, '#b5583e', w - 32, 2, 8, 10);
  });
}

// 南京町的長安門：紅柱子＋綠瓦的屋頂（用夜市牌樓加上屋頂）
function drawChanganGate(c: CanvasRenderingContext2D, d: DrawCtx): void {
  drawArch(c, KB.gate.x0, KB.gate.x1, KB.gate.y, '南京町', '#c8102e', d.night, d.seconds);
  const x0 = KB.gate.x0 * T - 10;
  const x1 = KB.gate.x1 * T + 10;
  const by = KB.gate.y * T;
  c.fillStyle = '#2f7a5a';
  c.beginPath();
  c.moveTo(x0, by - 52);
  c.quadraticCurveTo(x0 + 10, by - 56, x0 + 18, by - 64);
  c.lineTo(x1 - 18, by - 64);
  c.quadraticCurveTo(x1 - 10, by - 56, x1, by - 52);
  c.fill();
  px(c, '#e8b830', x0 + 18, by - 66, x1 - x0 - 36, 2);
}

// 南京町上空一排紅燈籠
function drawLanternLine(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const y = 17.6 * T;
  c.strokeStyle = '#3a3d45';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, y);
  c.lineTo(35 * T, y);
  c.stroke();
  for (let x = 12; x < 35 * T; x += 26) drawLantern(c, x, y + 1, '#d8382a', d.night);
}

// JR 三之宮站：高架的月台（上面有電車開過）、下面的站房
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((KB.station.x1 - KB.station.x0) * T);
  const h = 78;
  return cached('kb-station', w, h, (c) => {
    // 高架橋
    px(c, '#9aa0a8', 0, 18, w, 8);
    px(c, '#c9ccd2', 0, 18, w, 2);
    for (let x = 6; x < w; x += 40) px(c, '#8a909a', x, 26, 8, h - 26);
    // 站房
    px(c, '#e2e4e8', 0, 32, w, h - 32);
    for (let y = 38; y < h - 20; y += 7) for (let x = 6; x < w - 6; x += 9) px(c, '#5a7a94', x, y, 7, 5);
    const cx = w / 2;
    px(c, '#2a3a4a', cx - 50, h - 16, 100, 16);
    for (let x = cx - 44; x < cx + 44; x += 18) px(c, '#9fd8ff', x, h - 14, 12, 12);
    px(c, '#f4f6f8', cx - 58, 34, 116, 12);
    px(c, '#1a8c3a', cx - 56, 35, 14, 10);
    text(c, 'JR', cx - 49, 40, '#ffffff', `900 6px ${FONT_TC}`);
    text(c, '三ノ宮  SANNOMIYA', cx + 8, 40, '#1f2a44', `900 7px ${FONT_TC}`);
  });
}
// 高架上開過去的 JR 電車（銀色車身、藍色線條）
function drawStation(c: CanvasRenderingContext2D): void {
  blit(c, stationSprite(), KB.station.x0 * T, KB.station.line * T);
}
function drawJrTrain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = KB.station.x0 * T;
  const w = (KB.station.x1 - KB.station.x0) * T;
  const top = KB.station.line * T - 78;
  const cycle = 18;
  const t = d.seconds % cycle;
  if (t > 10) return;
  const len = 150;
  const x = x0 - len + (t / 10) * (w + len);
  c.save();
  c.beginPath();
  c.rect(x0, top, w, 20);
  c.clip();
  for (let k = 0; k < 3; k += 1) {
    const cx = x + k * 52;
    px(c, '#d6d9de', cx, top + 4, 48, 14);
    px(c, '#1f6fa8', cx, top + 12, 48, 2);
    for (let wx = cx + 4; wx < cx + 44; wx += 8) px(c, '#3a4a5a', wx, top + 6, 5, 4);
  }
  c.restore();
}

// 神戶塔：紅色的鼓形（中間細）鐵塔、上面的展望台
function portTowerSprite(): HTMLCanvasElement {
  return cached('kb-tower', 64, 172, (c) => {
    const cx = 32;
    const bottom = 160;
    const top = 30;
    c.strokeStyle = '#d8382a';
    c.lineWidth = 2;
    for (let k = 0; k < 12; k += 1) {
      const a = (k / 12) * Math.PI;
      const bx = cx + Math.cos(a) * 20;
      const tx = cx + Math.cos(a + 1.2) * 18;
      c.beginPath();
      c.moveTo(bx, bottom);
      c.quadraticCurveTo(cx + (bx + tx - cx * 2) * 0.12, (bottom + top) / 2, tx, top);
      c.stroke();
    }
    for (const y of [60, 95, 130]) px(c, '#b02a1e', cx - 10 - (Math.abs(y - 95) / 6), y, 20 + Math.abs(y - 95) / 3, 2);
    px(c, '#f4f6f8', cx - 20, 18, 40, 12);
    px(c, '#2a3a4a', cx - 18, 21, 36, 5);
    px(c, '#d8382a', cx - 16, 10, 32, 8);
    px(c, '#9aa0a8', cx - 1, 0, 2, 10);
    px(c, '#9a948a', cx - 22, bottom, 44, 12);
  });
}

// 海洋博物館：白色鋼構的帆（像波浪）蓋在低矮的建築上
function museumSprite(): HTMLCanvasElement {
  const w = Math.round((KB.museum.x1 - KB.museum.x0) * T);
  const h = 82;
  return cached('kb-museum', w, h, (c) => {
    px(c, '#c9d6e2', 4, h - 26, w - 8, 26);
    for (let x = 10; x < w - 10; x += 12) px(c, '#7a9ab4', x, h - 20, 8, 12);
    c.strokeStyle = '#f4f6f8';
    c.lineWidth = 2;
    for (let k = 0; k < 7; k += 1) {
      c.beginPath();
      c.moveTo(8 + k * 6, h - 26);
      c.quadraticCurveTo(w * 0.35, 4 + k * 3, w - 10 - k * 6, h - 26);
      c.stroke();
    }
    for (let x = 14; x < w - 14; x += 10) {
      c.beginPath();
      c.moveTo(x, h - 26);
      c.lineTo(w * 0.35 + (x - w / 2) * 0.3, 14 + Math.abs(x - w * 0.35) * 0.3);
      c.stroke();
    }
  });
}

// BE KOBE 的白色字
function drawBeKobe(c: CanvasRenderingContext2D): void {
  const cx = Math.round(KB.beKobe.x * T);
  const by = Math.round(KB.beKobe.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 36, by - 1, 72, 3);
  px(c, '#9a948a', cx - 36, by - 4, 72, 4);
  text(c, 'BE KOBE', cx, by - 13, '#f4f6f8', `900 15px ${FONT_TC}`);
  c.strokeStyle = 'rgba(40,50,60,0.7)';
  c.lineWidth = 1.5;
  c.strokeText('BE KOBE', cx, by - 13);
}

// 摩天輪（會轉，晚上彩色的燈）
function drawWheel(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = KB.wheel.x * T;
  const by = KB.parkLine * T;
  const r = 52;
  const cy = by - r - 12;
  px(c, 'rgba(0,0,0,0.2)', cx - 26, by - 1, 52, 3);
  px(c, '#9aa0a8', cx - 20, by - 12, 4, 12);
  px(c, '#9aa0a8', cx + 16, by - 12, 4, 12);
  c.strokeStyle = '#d0d4da';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - 18, by - 10);
  c.lineTo(cx, cy);
  c.lineTo(cx + 18, by - 10);
  c.stroke();
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.stroke();
  const rot = d.seconds * 0.08;
  for (let k = 0; k < 16; k += 1) {
    const a = rot + (k / 16) * Math.PI * 2;
    const gx = cx + Math.cos(a) * r;
    const gy = cy + Math.sin(a) * r;
    c.strokeStyle = 'rgba(208,212,218,0.7)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(gx, gy);
    c.stroke();
    const col = d.night ? (['#ff5a4a', '#ffd23f', '#5ad6ff', '#7aee6a', '#ff6ad5'][(k + Math.floor(d.seconds * 2)) % 5] ?? '#fff') : (['#e8402e', '#f6c945', '#3b82f6', '#2bb673'][k % 4] ?? '#fff');
    px(c, col, Math.round(gx - 3), Math.round(gy), 6, 6);
  }
  px(c, '#9aa0a8', cx - 3, cy - 3, 6, 6);
  if (d.night) glow(c, cx, cy, 70, '255, 200, 240', 0.25);
}

// 港裡的船：一艘遊覽船慢慢開、一艘小漁船
function drawShips(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, KB.sea * T - 40, KB.W * T, (KB.H - KB.sea) * T + 40);
  c.clip();
  drawShipsInner(c, d);
  c.restore();
}
function drawShipsInner(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const span = KB.W * T + 200;
  const x = ((d.seconds * 8) % span) - 100;
  const y = (KB.sea + 3.2) * T;
  px(c, 'rgba(0,0,0,0.2)', x - 50, y + 2, 100, 4);
  px(c, '#f4f6f8', x - 50, y - 12, 100, 14);
  px(c, '#1f4e9c', x - 50, y - 2, 100, 3);
  px(c, '#f4f6f8', x - 34, y - 24, 64, 12);
  for (let k = -30; k < 28; k += 8) px(c, '#3a4a5a', x + k, y - 21, 5, 4);
  px(c, '#e8402e', x + 10, y - 32, 8, 8);
  const fx = KB.W * T - ((d.seconds * 5) % span) + 60;
  const fy = (KB.sea + 5.4) * T;
  px(c, '#2a6a8a', fx - 16, fy - 6, 32, 7);
  px(c, '#f4f6f8', fx - 4, fy - 14, 10, 8);
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = KOBE_SEATS[i];
  if (s && i >= 4 && i < 8) drawStool(c, s.x, s.y);
}

const LAMPS: [number, number][] = [[3, 24.6], [27, 24.6], [36, 24.6], [54, 24.6], [4, 27.8], [16, 27.8], [38, 27.8], [53, 27.8], [3, 16.8], [45, 16.8]];
const TREES: [number, number][] = [[2.5, 30.6], [33, 30.4], [53, 30.6], [17, 36.4], [30, 36.4], [6, 16.6], [32, 16.6], [50, 16.6]];

const props: CityProp[] = [
  { y: 4, draw: (c, d) => drawAnchor(c, d) },
  { y: KB.kitanoLine, draw: (c) => blit(c, kazamidoriSprite(), KB.kazamidori.x0 * T, KB.kitanoLine * T) },
  { y: KB.kitanoLine + 0.01, draw: (c, d) => drawWeathercock(c, d) },
  { y: KB.kitanoLine, draw: (c) => blit(c, moegiSprite(), KB.moegi.x0 * T, KB.kitanoLine * T) },
  ...KITANO_BENCHES.map((x): CityProp => ({ y: KITANO_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, KITANO_BENCH_Y, 2.6) })),
  { y: KB.gate.y, draw: (c, d) => drawChanganGate(c, d) },
  { y: 17.5, draw: (c, d) => drawLanternLine(c, d) },
  ...CHINA_CARTS.map((s, i): CityProp => ({ y: KB.cartY, draw: (c, d) => drawFoodCart(c, s.x, KB.cartY, s.name, s.awning, s.food, d.seconds + i * 0.41, 71 + i * 5) })),
  ...CHINA_TABLES.map((x): CityProp => ({ y: CHINA_TABLE_Y, draw: (c) => drawMarketTable(c, x, CHINA_TABLE_Y) })),
  { y: KB.station.line, draw: (c) => drawStation(c) },
  { y: KB.station.line + 0.01, draw: (c, d) => drawJrTrain(c, d) },
  { y: KB.parkLine, draw: (c) => blit(c, portTowerSprite(), KB.tower.x * T - 32, KB.parkLine * T) },
  { y: KB.parkLine, draw: (c) => blit(c, museumSprite(), KB.museum.x0 * T, KB.parkLine * T) },
  { y: KB.beKobe.y, draw: (c) => drawBeKobe(c) },
  { y: KB.parkLine, draw: (c, d) => drawWheel(c, d) },
  ...HARBOR_BENCHES.map((x): CityProp => ({ y: HARBOR_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, HARBOR_BENCH_Y, 2.6) })),
  { y: KB.H, draw: (c, d) => drawShips(c, d) },
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, KB.W, KB.kitanoLine - 0.1),
  r(KB.kazamidori.x0, KB.kitanoLine - 1, KB.kazamidori.x1, KB.kitanoLine + 0.05),
  r(KB.moegi.x0, KB.kitanoLine - 1, KB.moegi.x1, KB.kitanoLine + 0.05),
  ...KITANO_BENCHES.map((x) => r(x - 1.3, KITANO_BENCH_Y - 0.75, x + 1.3, KITANO_BENCH_Y - 0.45)),
  ...[KB.gate.x0, KB.gate.x1 - 0.3].map((x) => r(x, KB.gate.y - 0.3, x + 0.3, KB.gate.y)),
  ...CHINA_CARTS.map((s) => r(s.x - 1.25, KB.cartY - 0.8, s.x + 1.25, KB.cartY - 0.05)),
  ...CHINA_TABLES.map((x) => r(x - 1.2, CHINA_TABLE_Y - 0.4, x + 1.2, CHINA_TABLE_Y)),
  r(KB.station.x0, KB.station.line - 2.6, KB.station.x1, KB.station.line - 0.05),
  r(KB.tower.x - 1.4, KB.parkLine - 0.8, KB.tower.x + 1.4, KB.parkLine - 0.05),
  r(KB.museum.x0 + 0.3, KB.parkLine - 1.6, KB.museum.x1 - 0.3, KB.parkLine - 0.05),
  r(KB.beKobe.x - 2.2, KB.beKobe.y - 0.4, KB.beKobe.x + 2.2, KB.beKobe.y),
  r(KB.wheel.x - 1.5, KB.parkLine - 0.8, KB.wheel.x + 1.5, KB.parkLine - 0.05),
  ...HARBOR_BENCHES.map((x) => r(x - 1.3, HARBOR_BENCH_Y - 0.75, x + 1.3, HARBOR_BENCH_Y - 0.45)),
  r(0, KB.sea - 0.1, KB.W, KB.H),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...CHINA_CARTS.map((s) => ({ x: s.x * T, y: KB.cartY * T - 14, r: 40, color: 'rgba(255, 180, 120, 0.5)' })),
  { x: 18 * T, y: 18 * T, r: 120, color: 'rgba(255, 120, 90, 0.35)' },
  { x: KB.tower.x * T, y: KB.parkLine * T - 90, r: 90, color: 'rgba(255, 110, 90, 0.4)' },
  { x: ((KB.museum.x0 + KB.museum.x1) / 2) * T, y: KB.parkLine * T - 40, r: 90, color: 'rgba(200, 230, 255, 0.4)' },
  { x: ((KB.station.x0 + KB.station.x1) / 2) * T, y: KB.station.line * T - 20, r: 100, color: 'rgba(220, 235, 255, 0.4)' },
  { x: ((KB.kazamidori.x0 + KB.kazamidori.x1) / 2) * T, y: KB.kitanoLine * T - 30, r: 70, color: 'rgba(255, 210, 140, 0.35)' },
];

const stationX = (KB.station.x0 + KB.station.x1) / 2;

export const KOBE: CityDef = {
  id: 'kobe',
  country: 'jp',
  line: 'jr',
  W: KB.W,
  H: KB.H,
  title: { 'zh-TW': '神戶 · 港灣與北野異人館', 'en-US': 'Kobe · Harbour & Kitano' },
  stop: { 'zh-TW': '神戶（JR 三之宮站）', 'en-US': 'Kobe (JR Sannomiya)' },
  emoji: '⚓',
  station: {
    x: stationX,
    y: KB.station.line + 0.6,
    name: { 'zh-TW': 'JR 三之宮站', 'en-US': 'JR Sannomiya Station' },
    arrive: { x: stationX + 3, y: KB.station.line + 0.8 },
  },
  background: '#e2ded4',
  soundscape: 'beach',
  paintGround: paintKobeGround,
  props,
  solid,
  seats: KOBE_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: KOBE_SHOPS,
  infos: [
    { at: r(KB.kazamidori.x0, 4, KB.kazamidori.x1, KB.kitanoLine), title: { 'zh-TW': '風見雞館', 'en-US': 'Weathercock House' }, text: { 'zh-TW': '1909 年德國貿易商蓋的紅磚洋館，尖塔上的風向雞是北野的象徵。神戶 1868 年開港後，外國人住在山坡上的北野，留下很多「異人館」。', 'en-US': 'A red-brick house built by a German merchant in 1909; the weathercock on its spire is Kitano’s symbol. After Kobe opened its port in 1868, foreigners settled on these slopes, leaving many “ijinkan” houses.' } },
    { at: r(KB.moegi.x0, 5, KB.moegi.x1, KB.kitanoLine), title: { 'zh-TW': '萌黃館', 'en-US': 'Moegi House' }, text: { 'zh-TW': '淺綠色的木造洋館，原本是美國總領事的家，二樓的陽台可以看到神戶港。', 'en-US': 'A pale-green wooden mansion, once the home of the US Consul General, with harbour views from the upstairs verandas.' } },
    { at: r(0, 17.4, 36, KB.chinaY1), title: { 'zh-TW': '南京町', 'en-US': 'Nankinmachi' }, text: { 'zh-TW': '日本三大中華街之一，東西兩個牌樓之間擠滿小吃攤。最有名的是豚饅（豬肉包），也吃得到神戶牛串。', 'en-US': 'One of Japan’s three great Chinatowns, packed with food stalls between its gates. Famous for butaman pork buns — and Kobe beef skewers too.' } },
    { at: r(KB.tower.x - 1.6, 20, KB.tower.x + 1.6, KB.parkLine), title: { 'zh-TW': '神戶塔', 'en-US': 'Kobe Port Tower' }, text: { 'zh-TW': '1963 年蓋的紅色鐵塔，形狀像日本的鼓，被叫做「鐵塔美人」。旁邊白色波浪鋼構的是海洋博物館。', 'en-US': 'The red tower from 1963, shaped like a Japanese tsuzumi drum and nicknamed the “beauty of steel towers”. The white wave-like frame next to it is the Maritime Museum.' } },
    { at: r(KB.wheel.x - 3.5, 22, KB.wheel.x + 3.5, KB.parkLine), title: { 'zh-TW': '摩天輪（Harborland）', 'en-US': 'Ferris Wheel (Harborland)' }, text: { 'zh-TW': '港邊購物區的摩天輪，晚上會變換燈光，跟神戶塔一起是神戶的夜景。', 'en-US': 'The Ferris wheel at the harbourside mall; its changing lights and the Port Tower make Kobe’s classic night view.' } },
    { at: r(KB.station.x0, KB.station.line - 4.8, KB.station.x1, KB.station.line), title: { 'zh-TW': 'JR 三之宮站', 'en-US': 'JR Sannomiya Station' }, text: { 'zh-TW': '神戶市中心的車站，高架月台上 JR 神戶線的電車來來往往。搭新快速到大阪約 20 分鐘、到京都約 50 分鐘。', 'en-US': 'Kobe’s central station, with JR Kobe Line trains on the elevated platforms. Special Rapid: about 20 min to Osaka and 50 min to Kyoto.' } },
  ],
  labels: [
    { x: 24, y: KB.sea + 0.6, text: { 'zh-TW': '⚓ 美利堅公園（海邊長椅坐下專注）', 'en-US': '⚓ Meriken Park (sit on a seaside bench)' }, color: '#bae6fd' },
    { x: 31.5, y: KITANO_BENCH_Y + 0.9, text: { 'zh-TW': '🏠 北野異人館街', 'en-US': '🏠 Kitano Ijinkan' }, color: '#fde68a' },
  ],
  walkers: [
    { x0: 1, y0: 15.2, x1: 55, y1: 15.2, count: 4 },
    { x0: 1, y0: 21.6, x1: 35, y1: 21.6, count: 4 },
    { x0: 37, y0: 24.4, x1: 55, y1: 24.4, count: 2 },
    { x0: 1, y0: 28.4, x1: 55, y1: 28.4, count: 3 },
    { x0: 1, y0: 31.6, x1: 55, y1: 31.6, count: 3 },
    { x0: 1, y0: 35.8, x1: 55, y1: 35.8, count: 2 },
  ],
  traffic: [
    { y: 25.6, dir: -1, x0: 0, x1: KB.W, count: 2 },
    { y: 26.9, dir: 1, x0: 0, x1: KB.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點港邊、北野的長椅或南京町的桌子坐下專注 · 走到攤子買豬肉包、神戶牛串、神戶布丁 · 點地標看介紹 · JR 三之宮站去京都、大阪、東京或飛回台灣',
    'en-US': 'WASD / arrows to move · click a harbour or Kitano bench, or a Nankinmachi table, to focus · walk up to the stalls for pork buns, Kobe beef and pudding · click landmarks for info · JR Sannomiya to Kyoto, Osaka, Tokyo or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或桌子坐下專注 · 走到攤子買東西 · 點地標看介紹 · JR 三之宮站',
    'en-US': 'Tap a bench or table to focus · visit the stalls · tap landmarks · JR Sannomiya',
  },
};
