// 嘉義的美術：遠方阿里山的稜線和雲海、檜木林、檜意森活村的日式木造宿舍（黑瓦、雨淋板、緣側、茶屋的暖簾）、
// 北門驛（檜木的小車站）、阿里山森林鐵路（窄軌、紅色小火車，會開進北門驛停一下；平交道的紅燈會閃、柵欄會放下）、
// 文化路夜市（攤車、燈泡串、牌樓）、噴水圓環（水池、KANO 投手像、噴泉）、中山路的街屋、嘉義車站（1933 年的老車站）。
// 最後組成 CityScene 用的 CHIAYI。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CHIAYI_SEATS, CHIAYI_SHOPS, CY, FOUNTAIN_BENCHES, MARKET_CARTS, MARKET_TABLES, TABLE_Y, TEA_HOUSE, VERANDA_HOUSES } from './chiayi';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, townhouseSprite, type Townhouse, drawLamp, drawBench, drawStreetTree, drawParkedScooter, drawFoodCart, SCOOTER_COLORS } from './cityArt';

// 紅檜（尖尖的深綠色，一層層的枝）：底圖和地圖上都會用到
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

// ── 地面（畫一次）──
export function paintChiayiGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1912);
  const W = CY.W * T;
  const nl = CY.northLine * T;
  // 天空
  const sky = c.createLinearGradient(0, 0, 0, 3.4 * T);
  sky.addColorStop(0, '#9cc8e4');
  sky.addColorStop(1, '#d8ecf2');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, nl);
  // 遠的山（阿里山山脈，藍藍的）、近一點的山（綠的）
  const ridge = (base: number, amp: number, color: string, seed: number) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, nl);
    for (let x = 0; x <= W; x += 8) {
      const y = base - amp * (0.55 + 0.45 * Math.sin(x * 0.011 + seed) * Math.sin(x * 0.027 + seed * 2)) - Math.abs(Math.sin(x * 0.05 + seed)) * amp * 0.25;
      c.lineTo(x, y);
    }
    c.lineTo(W, nl);
    c.closePath();
    c.fill();
  };
  ridge(3.4 * T, 30, '#8aa6bf', 1.3);
  // 雲海：山谷裡一條白白的雲
  for (let i = 0; i < 60; i += 1) {
    const x = rand() * W;
    const y = 3.1 * T + rand() * 14;
    c.fillStyle = `rgba(255,255,255,${0.5 + rand() * 0.4})`;
    c.beginPath();
    c.ellipse(x, y, 14 + rand() * 22, 3 + rand() * 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  ridge(5 * T, 22, '#5f8a74', 4.1);
  ridge(6.2 * T, 14, '#4c7a5e', 7.7);
  // 山腳下的檜木林
  px(c, '#3f6a4c', 0, 6.6 * T, W, nl - 6.6 * T);
  for (let i = 0; i < 70; i += 1) {
    const x = rand() * W;
    cypress(c, x, 6.8 * T + rand() * 24, 18 + rand() * 12, '#2f5a3e', '#3d6e4a');
  }
  for (let x = 4; x < W; x += 9 + rand() * 8) cypress(c, x, nl - 2 - rand() * 8, 22 + rand() * 14, '#2a5238', '#386a46');
  // 檜意森活村前面的走道（碎石＋木棧板）、北門驛的月台
  px(c, '#cbbf9e', 0, nl, W, (CY.rail.y0 - CY.northLine) * T);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#b8ab88' : '#ddd2b4', Math.floor(rand() * W), Math.floor(nl + rand() * (CY.rail.y0 - CY.northLine) * T), 2, 1);
  tiles(c, { x0: CY.beimen.x0 - 0.6, y0: CY.northLine, x1: CY.beimen.x1 + 0.6, y1: CY.rail.y0 }, '#c2b8a6', '#aea492', 8);
  px(c, '#e8d85a', (CY.beimen.x0 - 0.6) * T, CY.rail.y0 * T - 3, (CY.beimen.x1 - CY.beimen.x0 + 1.2) * T, 2);
  // 森林鐵路：碎石道床、枕木、兩條窄窄的鐵軌
  const ry0 = CY.rail.y0 * T;
  const ry1 = CY.rail.y1 * T;
  px(c, '#8a8478', 0, ry0, W, ry1 - ry0);
  for (let i = 0; i < 600; i += 1) px(c, rand() < 0.5 ? '#7a746a' : '#9a948a', Math.floor(rand() * W), Math.floor(ry0 + rand() * (ry1 - ry0)), 2, 1);
  for (let x = 2; x < W; x += 6) px(c, '#5a3e2a', x, ry0 + 3, 3, ry1 - ry0 - 6);
  const railA = Math.round(ry0 + 6);
  const railB = Math.round(ry1 - 7);
  px(c, '#9aa0aa', 0, railA, W, 1);
  px(c, '#5a5e66', 0, railA + 1, W, 1);
  px(c, '#9aa0aa', 0, railB, W, 1);
  px(c, '#5a5e66', 0, railB + 1, W, 1);
  // 平交道：路面鋪過鐵軌、黃黑的邊
  for (const x of CY.crossings) {
    const x0 = (x - CY.crossingHalf) * T;
    const w = CY.crossingHalf * 2 * T;
    px(c, '#5a5d66', x0, ry0, w, ry1 - ry0);
    px(c, '#9aa0aa', x0, railA, w, 1);
    px(c, '#9aa0aa', x0, railB, w, 1);
    for (let k = 0; k < w; k += 6) {
      px(c, k % 12 ? '#15171f' : '#f6c945', x0 + k, ry0, 6, 2);
      px(c, k % 12 ? '#15171f' : '#f6c945', x0 + k, ry1 - 2, 6, 2);
    }
  }
  // 文化路夜市：一塊塊的地磚（攤車那排）、往南的文化路
  const m = CY.market;
  tiles(c, { x0: 0, y0: m.y0, x1: m.x1, y1: m.y1 }, '#b9a99a', '#a89888', 8);
  for (let i = 0; i < 300; i += 1) px(c, 'rgba(80,60,40,0.12)', Math.floor(rand() * m.x1 * T), Math.floor(m.y0 * T + rand() * (m.y1 - m.y0) * T), 3, 2);
  tiles(c, { x0: 0, y0: m.y1, x1: m.x1, y1: CY.rowLine }, '#cfc6b4', '#bdb4a2', 8);
  road(c, { x0: CY.bunka.x0, y0: m.y1, x1: CY.bunka.x1, y1: CY.southRoad.y0 }, rand);
  for (let y = m.y1 * T + 4; y < CY.southRoad.y0 * T - 4; y += 18) px(c, 'rgba(240,240,240,0.7)', ((CY.bunka.x0 + CY.bunka.x1) / 2) * T - 1, y, 2, 9);
  // 噴水圓環：外圈的草和花、石板廣場、水池
  const f = CY.fountain;
  tiles(c, { x0: m.x1, y0: CY.rail.y1, x1: CY.W, y1: CY.southRoad.y0 }, '#d6cdbd', '#c7bfae', 10);
  c.fillStyle = '#5f9a4a';
  c.beginPath();
  c.arc(f.cx * T, f.cy * T, f.r * T, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ddd4c2';
  c.beginPath();
  c.arc(f.cx * T, f.cy * T, (f.r - 0.6) * T, 0, Math.PI * 2);
  c.fill();
  for (let k = 0; k < 44; k += 1) {
    const a = (k / 44) * Math.PI * 2;
    px(c, ['#ff6fb5', '#ffd23f', '#ffffff', '#ff8a3a'][k % 4] ?? '#ffd23f', Math.round(f.cx * T + Math.cos(a) * (f.r - 0.3) * T) - 1, Math.round(f.cy * T + Math.sin(a) * (f.r - 0.3) * T) - 1, 3, 3);
  }
  for (let r = 1.2; r < f.r - 0.8; r += 0.9) {
    c.strokeStyle = 'rgba(160,150,135,0.45)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(f.cx * T, f.cy * T, r * T, 0, Math.PI * 2);
    c.stroke();
  }
  c.fillStyle = '#c9c1b0';
  c.beginPath();
  c.arc(f.cx * T, f.cy * T, (f.pool + 0.25) * T, 0, Math.PI * 2);
  c.fill();
  const pg = c.createRadialGradient(f.cx * T, f.cy * T, 4, f.cx * T, f.cy * T, f.pool * T);
  pg.addColorStop(0, '#7ac4d4');
  pg.addColorStop(1, '#3f8aa0');
  c.fillStyle = pg;
  c.beginPath();
  c.arc(f.cx * T, f.cy * T, f.pool * T, 0, Math.PI * 2);
  c.fill();
  // 中山路、斑馬線、車站前廣場
  road(c, { x0: 0, y0: CY.southRoad.y0, x1: CY.W, y1: CY.southRoad.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.75)', x, ((CY.southRoad.y0 + CY.southRoad.y1) / 2) * T, 10, 2);
  zebra(c, CY.bunka.x0 + 0.3, CY.southRoad.y0 + 0.1, CY.bunka.x1 - 0.3, CY.southRoad.y1 - 0.1, false);
  zebra(c, CY.fountain.cx - 2, CY.southRoad.y0 + 0.1, CY.fountain.cx + 2, CY.southRoad.y1 - 0.1, false);
  tiles(c, { x0: 0, y0: CY.southRoad.y1, x1: CY.W, y1: CY.H }, '#d9d0bf', '#c9c0ae', 10);
  for (let x = 2; x < CY.W; x += 4) px(c, '#c2b8a4', x * T, (CY.southRoad.y1 + 0.2) * T, T * 2, 3);
  px(c, '#9a948a', CY.station.x0 * T - 8, CY.station.y * T, (CY.station.x1 - CY.station.x0) * T + 16, 6);
}

// ── 檜意森活村：日式木造宿舍（黑瓦屋頂、白灰泥、深色雨淋板、玻璃格子窗、紙拉門） ──
function hinokiSprite(i: number): HTMLCanvasElement {
  const h0 = CY.houses[i] ?? CY.houses[0];
  const w = Math.round((h0.x1 - h0.x0) * T);
  const h = 72;
  return cached(`cy-hinoki-${i}`, w, h, (c) => {
    const rand = seeded(400 + i * 17);
    const cx = w / 2;
    const wallTop = 32;
    // 牆：上面一條白灰泥，下面深色的雨淋板（一條條橫的木板）
    px(c, '#efe8d8', 4, wallTop, w - 8, 8);
    px(c, '#6b4428', 4, wallTop + 8, w - 8, h - wallTop - 14);
    for (let y = wallTop + 10; y < h - 6; y += 4) px(c, '#5a3820', 4, y, w - 8, 1);
    for (const x of [4, w - 7]) px(c, '#4a2e1c', x, wallTop, 3, h - wallTop - 6);
    // 窗（玻璃＋木格子）
    for (const wx of [8, w - 26]) {
      px(c, '#4a2e1c', wx - 1, wallTop + 11, 20, 15);
      px(c, '#cfe0e4', wx, wallTop + 12, 18, 13);
      for (let k = 0; k <= 18; k += 6) px(c, '#6b4428', wx + k, wallTop + 12, 1, 13);
      px(c, '#6b4428', wx, wallTop + 18, 18, 1);
      px(c, 'rgba(255,255,255,0.5)', wx + 1, wallTop + 13, 3, 3);
    }
    // 中間的紙拉門（茶屋掛暖簾）
    px(c, '#4a2e1c', cx - 13, wallTop + 9, 26, h - wallTop - 15);
    px(c, '#f4efe2', cx - 12, wallTop + 10, 24, h - wallTop - 16);
    for (let k = 0; k <= 24; k += 6) px(c, '#9a7a52', cx - 12 + k, wallTop + 10, 1, h - wallTop - 16);
    for (let y = wallTop + 14; y < h - 6; y += 6) px(c, '#9a7a52', cx - 12, y, 24, 1);
    if (i === TEA_HOUSE) {
      px(c, '#2f4a7a', cx - 13, wallTop + 9, 26, 12);
      px(c, '#24395f', cx, wallTop + 9, 1, 12);
      text(c, '茶', cx - 6, wallTop + 15, '#f4efe2', `900 7px ${SERIF_TC}`);
      text(c, '屋', cx + 7, wallTop + 15, '#f4efe2', `900 7px ${SERIF_TC}`);
      // 直的木招牌
      px(c, '#c99a62', w - 12, wallTop - 2, 7, 26);
      px(c, '#8a5a32', w - 12, wallTop - 2, 7, 1);
      for (const [k, ch] of ['檜', '町', '茶'].entries()) text(c, ch, w - 8.5, wallTop + 3 + k * 7, '#3a2414', `900 6px ${SERIF_TC}`);
    } else if (rand() < 0.6) {
      // 門邊的盆栽
      px(c, '#9a5a3a', cx + 15, h - 12, 6, 6);
      px(c, '#4f8a3c', cx + 14, h - 18, 8, 6);
    }
    // 石頭基座
    px(c, '#9a948a', 2, h - 6, w - 4, 6);
    px(c, '#b5ad9f', 2, h - 6, w - 4, 1);
    // 黑瓦屋頂（入母屋造：下面寬的瓦、上面三角形的山牆、屋脊兩端的鬼瓦）
    c.fillStyle = '#4a4f58';
    c.beginPath();
    c.moveTo(-2, wallTop + 2);
    c.lineTo(10, 10);
    c.lineTo(w - 10, 10);
    c.lineTo(w + 2, wallTop + 2);
    c.closePath();
    c.fill();
    for (let y = 12; y < wallTop; y += 3) {
      const k = (y - 10) / (wallTop - 8);
      px(c, '#3a3e46', Math.round(10 - k * 12), y, Math.round(w - 20 + k * 24), 1);
    }
    for (let x = 6; x < w - 4; x += 4) px(c, 'rgba(255,255,255,0.08)', x, 12, 1, wallTop - 12);
    px(c, '#2a2d33', -2, wallTop + 1, w + 4, 2);
    c.fillStyle = '#5a6070';
    c.beginPath();
    c.moveTo(cx - 12, 11);
    c.lineTo(cx, 1);
    c.lineTo(cx + 12, 11);
    c.closePath();
    c.fill();
    px(c, '#efe8d8', cx - 5, 6, 10, 5);
    px(c, '#2a2d33', 8, 8, w - 16, 3);
    px(c, '#2a2d33', 6, 5, 4, 5);
    px(c, '#2a2d33', w - 10, 5, 4, 5);
  });
}

// 緣側（木頭走廊，坐在上面看火車）：畫在房子前面、地面線下面
function drawHinoki(c: CanvasRenderingContext2D, i: number, d: DrawCtx): void {
  const h0 = CY.houses[i] ?? CY.houses[0];
  const x0 = Math.round(h0.x0 * T);
  const w = Math.round((h0.x1 - h0.x0) * T);
  const by = Math.round(CY.northLine * T);
  blit(c, hinokiSprite(i), x0, by);
  px(c, '#8a5a32', x0 + 2, by - 3, w - 4, 3);
  px(c, '#c99a62', x0 + 2, by, w - 4, 7);
  for (let x = x0 + 2; x < x0 + w - 2; x += 5) px(c, '#b5844e', x, by, 1, 7);
  px(c, '#e0b47a', x0 + 2, by, w - 4, 1);
  px(c, '#6b4428', x0 + 2, by + 7, w - 4, 2);
  for (const x of [x0 + 4, x0 + w - 7]) px(c, '#4a2e1c', x, by + 7, 3, 3);
  // 踏石
  px(c, '#a8a094', x0 + w / 2 - 5, by + 9, 10, 3);
  if (d.night) {
    for (const wx of [8, w - 26]) px(c, 'rgba(255, 214, 140, 0.55)', x0 + wx, by - 72 + 32 + 12, 18, 13);
  }
}

// 檜意森活村的入口：木頭的門框、上面一塊「檜意森活村」大木牌，後面一棵黑松、石燈籠
function drawVillageGate(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(15.2 * T);
  const x1 = Math.round(19.6 * T);
  const by = Math.round(CY.northLine * T + 2);
  // 黑松（歪歪的枝）
  px(c, '#5a3a22', x0 + 46, by - 30, 3, 28);
  for (const [dx, dy, rw] of [[-6, -34, 14], [8, -38, 16], [0, -44, 12], [12, -28, 10]] as const) {
    c.fillStyle = '#2f5a38';
    c.beginPath();
    c.ellipse(x0 + 47 + dx, by + dy, rw / 2, 4, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#3f6e46', x0 + 47 + dx - rw / 4, by + dy - 3, rw / 2, 2);
  }
  // 石燈籠
  const lx = x0 + 16;
  px(c, '#9a948a', lx - 2, by - 12, 5, 12);
  px(c, '#b5ad9f', lx - 5, by - 18, 11, 6);
  px(c, d.night ? '#ffe08a' : '#4a4640', lx - 2, by - 17, 5, 4);
  px(c, '#8a847a', lx - 7, by - 21, 15, 3);
  px(c, '#8a847a', lx - 1, by - 24, 3, 3);
  if (d.night) glow(c, lx, by - 15, 12, '255, 210, 120', 0.5);
  // 門框＋木牌
  for (const x of [x0, x1 - 4]) {
    px(c, 'rgba(0,0,0,0.2)', x - 1, by, 6, 2);
    px(c, '#7a4e2c', x, by - 40, 4, 40);
    px(c, '#946038', x, by - 40, 1, 40);
  }
  px(c, '#5a3820', x0 - 6, by - 44, x1 - x0 + 12, 4);
  px(c, '#c99a62', x0 + 4, by - 39, x1 - x0 - 8, 11);
  px(c, '#8a5a32', x0 + 4, by - 39, x1 - x0 - 8, 1);
  text(c, '檜意森活村', (x0 + x1) / 2, by - 33.5, '#3a2414', `900 8px ${SERIF_TC}`);
}

// ── 北門驛：檜木蓋的小車站（原木色的牆、直的木板、灰瓦山牆、白底黑字的站名牌） ──
function beimenSprite(): HTMLCanvasElement {
  const w = Math.round((CY.beimen.x1 - CY.beimen.x0) * T);
  const h = 74;
  return cached('cy-beimen', w, h, (c) => {
    const cx = w / 2;
    const wallTop = 30;
    px(c, '#c58a52', 4, wallTop, w - 8, h - wallTop - 4);
    for (let x = 6; x < w - 4; x += 4) px(c, '#a86a3a', x, wallTop, 1, h - wallTop - 4);
    px(c, '#8a5a32', 4, wallTop, w - 8, 2);
    px(c, '#8a5a32', 4, h - 22, w - 8, 2);
    // 窗、站房的門（裡面有售票口的燈）
    for (const wx of [10, w - 26]) {
      px(c, '#6b4428', wx - 1, wallTop + 7, 18, 14);
      px(c, '#d8e4e6', wx, wallTop + 8, 16, 12);
      px(c, '#6b4428', wx + 8, wallTop + 8, 1, 12);
      px(c, '#6b4428', wx, wallTop + 14, 16, 1);
    }
    px(c, '#4a2e1c', cx - 11, h - 30, 22, 26);
    px(c, '#f6dfae', cx - 10, h - 29, 20, 25);
    px(c, '#8a5a32', cx, h - 29, 1, 25);
    px(c, '#9a948a', 0, h - 4, w, 4);
    // 前面的雨庇
    px(c, '#5a6070', 0, wallTop + 22, w, 3);
    px(c, '#3a3e46', 0, wallTop + 25, w, 1);
    for (const x of [4, w - 7, cx - 14, cx + 11]) px(c, '#8a5a32', x, wallTop + 26, 3, h - wallTop - 30);
    // 屋頂（灰瓦、前面一個山牆）
    c.fillStyle = '#5a6070';
    c.beginPath();
    c.moveTo(-3, wallTop + 2);
    c.lineTo(8, 12);
    c.lineTo(w - 8, 12);
    c.lineTo(w + 3, wallTop + 2);
    c.closePath();
    c.fill();
    for (let y = 14; y < wallTop; y += 3) px(c, '#4a4f58', 4, y, w - 8, 1);
    c.fillStyle = '#c58a52';
    c.beginPath();
    c.moveTo(cx - 20, wallTop + 1);
    c.lineTo(cx, 2);
    c.lineTo(cx + 20, wallTop + 1);
    c.closePath();
    c.fill();
    c.strokeStyle = '#4a4f58';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx - 22, wallTop + 2);
    c.lineTo(cx, 1);
    c.lineTo(cx + 22, wallTop + 2);
    c.stroke();
    px(c, '#ffffff', cx - 13, 17, 26, 10);
    px(c, '#3a3d45', cx - 13, 17, 26, 1);
    text(c, '北門驛', cx, 22.5, '#15171f', `900 7px ${SERIF_TC}`);
  });
}

// ── 森林鐵路的小火車：紅色柴油機車頭＋三節紅色客車（白色窗帶），往東開進北門驛、停一下、再往東開走 ──
const TRAIN_CYCLE = 110;
const LOCO = 2.4;
const CAR = 2.9;
const TRAIN_LEN = LOCO + CAR * 3 + 0.3;
const TRAIN_STOP = CY.beimen.x1 - 0.6;
function trainFront(seconds: number): number | null {
  const t = seconds % TRAIN_CYCLE;
  if (t < 22) {
    const k = t / 22;
    return -1 + (TRAIN_STOP + 1) * (1 - (1 - k) * (1 - k));
  }
  if (t < 36) return TRAIN_STOP;
  if (t < 60) {
    const k = (t - 36) / 24;
    return TRAIN_STOP + (CY.W + TRAIN_LEN + 1 - TRAIN_STOP) * k * k;
  }
  return null;
}

function drawTrain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const front = trainFront(d.seconds);
  if (front === null) return;
  const by = Math.round(CY.rail.y1 * T - 4);
  const fx = Math.round(front * T);
  const wheels = (x0: number, w: number) => {
    px(c, '#15171f', x0 + 2, by - 4, w - 4, 3);
    for (const wx of [x0 + 4, x0 + 10, x0 + w - 14, x0 + w - 8]) px(c, '#2b2d33', wx, by - 2, 4, 3);
  };
  // 機車頭：前面矮的引擎蓋、後面高的駕駛室
  const lw = Math.round(LOCO * T);
  const lx = fx - lw;
  px(c, 'rgba(0,0,0,0.25)', lx, by + 1, lw, 3);
  wheels(lx, lw);
  px(c, '#c8102e', lx + 2, by - 14, lw - 4, 10);
  px(c, '#c8102e', lx + 2, by - 22, 14, 8);
  px(c, '#e8344a', lx + 2, by - 22, 14, 1);
  px(c, '#2f3a42', lx + 4, by - 20, 4, 4);
  px(c, '#2f3a42', lx + 10, by - 20, 4, 4);
  px(c, '#f2e2b8', lx + 2, by - 9, lw - 4, 2);
  px(c, '#9a1a24', lx + 18, by - 16, lw - 20, 2);
  px(c, '#3a3d45', lx + 26, by - 18, 3, 3);
  px(c, d.night ? '#fff6c8' : '#f2e2b8', fx - 3, by - 13, 2, 3);
  if (d.night) glow(c, fx + 4, by - 11, 20, '255, 245, 200', 0.5);
  // 客車
  const cw = Math.round(CAR * T);
  for (let k = 0; k < 3; k += 1) {
    const x1 = lx - 2 - k * (cw + 2);
    const x0 = x1 - cw;
    px(c, 'rgba(0,0,0,0.25)', x0, by + 1, cw, 3);
    px(c, '#3a3d45', x1, by - 8, 2, 2);
    wheels(x0, cw);
    px(c, '#a8222a', x0, by - 21, cw, 17);
    px(c, '#5a5d66', x0 - 1, by - 23, cw + 2, 3);
    px(c, '#f2e2b8', x0, by - 18, cw, 8);
    for (let wx = x0 + 3; wx + 5 <= x1 - 2; wx += 7) px(c, d.night ? '#ffe9a8' : '#3a4656', wx, by - 17, 5, 6);
    px(c, '#8a1a20', x0, by - 9, cw, 1);
    px(c, '#f2e2b8', x0 + cw / 2 - 6, by - 7, 12, 2);
  }
}

// 平交道：兩邊各一支警示燈（火車快到時兩顆紅燈輪流閃）＋柵欄（火車快到時放下來）
function trainNear(x: number, seconds: number): boolean {
  const front = trainFront(seconds);
  if (front === null) return false;
  return front > x - 6 && front - TRAIN_LEN < x + 3;
}
function drawCrossingSignal(c: CanvasRenderingContext2D, x: number, y: number, armDir: 1 | -1, cross: number, d: DrawCtx): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const near = trainNear(cross, d.seconds);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  for (let k = 0; k < 26; k += 4) px(c, k % 8 ? '#15171f' : '#f2f2f2', cx, by - 26 + k, 2, 4);
  // ✕ 牌
  px(c, '#f6c945', cx - 5, by - 30, 12, 2);
  px(c, '#f6c945', cx, by - 34, 2, 8);
  const blink = Math.floor(d.seconds * 2.5) % 2;
  px(c, '#15171f', cx - 6, by - 26, 14, 6);
  for (const [k, ox] of [[0, -5], [1, 3]] as const) {
    const on = near && blink === k;
    px(c, on ? '#ff3a2a' : '#5a1a1a', cx + ox, by - 25, 4, 4);
    if (on) glow(c, cx + ox + 2, by - 23, 9, '255, 70, 50', 0.6);
  }
  // 柵欄：平常直直立起來，火車來了放下來擋住路
  px(c, '#3a3d45', cx + armDir * 3, by - 8, 3, 8);
  const len = Math.round(CY.crossingHalf * 1.8 * T);
  if (near) {
    for (let k = 0; k < len; k += 4) px(c, k % 8 ? '#f2f2f2' : '#e23a2a', armDir > 0 ? cx + 4 + k : cx + 2 - k - 4, by - 8, 4, 2);
  } else {
    for (let k = 0; k < len * 0.6; k += 4) px(c, k % 8 ? '#f2f2f2' : '#e23a2a', cx + armDir * 3 + 1, by - 10 - k, 2, 4);
  }
}

// ── 夜市：燈泡串（白天也掛著，晚上亮）、文化路口的牌樓 ──
function drawStringLights(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const y0 = (CY.cartY - 2.9) * T;
  for (const [a, b] of [[0.2, CY.bunka.x0], [CY.bunka.x1, CY.market.x1]] as const) {
    c.strokeStyle = '#3a3d45';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = a * T; x <= b * T; x += 4) {
      const t = ((x - a * T) / ((b - a) * T)) * 6;
      const y = y0 + Math.abs(Math.sin(t * Math.PI)) * 5;
      if (x === a * T) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    for (let x = a * T + 6, k = 0; x < b * T; x += 12, k += 1) {
      const t = ((x - a * T) / ((b - a) * T)) * 6;
      const y = y0 + Math.abs(Math.sin(t * Math.PI)) * 5 + 1;
      const col = ['#ff5a4a', '#ffd23f', '#5ad6ff', '#7aee6a'][k % 4] ?? '#ffd23f';
      px(c, d.night ? col : 'rgba(240,240,240,0.8)', Math.round(x), Math.round(y), 2, 3);
      if (d.night && k % 2 === 0) glow(c, x + 1, y + 1, 7, '255, 220, 150', 0.35);
    }
  }
}

function drawMarketArch(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round((CY.bunka.x0 + 0.1) * T);
  const x1 = Math.round((CY.bunka.x1 - 0.1) * T);
  const by = Math.round((CY.market.y1 + 0.2) * T);
  for (const x of [x0, x1 - 4]) {
    px(c, 'rgba(0,0,0,0.25)', x - 1, by, 6, 2);
    px(c, '#b71c1c', x, by - 44, 4, 44);
    px(c, '#e8443a', x, by - 44, 1, 44);
  }
  px(c, '#15171f', x0 - 4, by - 52, x1 - x0 + 8, 13);
  px(c, '#f6c945', x0 - 4, by - 52, x1 - x0 + 8, 1);
  px(c, '#f6c945', x0 - 4, by - 40, x1 - x0 + 8, 1);
  text(c, '文化路夜市', (x0 + x1) / 2, by - 45.5, d.night ? '#ffe08a' : '#f6c945', `900 9px ${FONT_TC}`);
  for (let x = x0 - 2, k = 0; x < x1 + 4; x += 6, k += 1) {
    px(c, d.night && (k + Math.floor(d.seconds * 3)) % 3 === 0 ? '#fff6c8' : '#e8c86a', x, by - 38, 2, 2);
  }
}

// 夜市的桌子（白鐵桌面）；座位的紅色塑膠椅在 drawSeat
function drawTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(TABLE_Y * T);
  const half = Math.round(1.2 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 1, half * 2, 3);
  px(c, '#9aa3b2', cx - half, by - 9, half * 2, 5);
  px(c, '#d6dae2', cx - half, by - 9, half * 2, 1);
  px(c, '#6a7080', cx - half + 2, by - 4, 2, 5);
  px(c, '#6a7080', cx + half - 4, by - 4, 2, 5);
  // 桌上的碗、筷筒
  px(c, '#f4f1e8', cx - 10, by - 11, 6, 2);
  px(c, '#f4f1e8', cx + 4, by - 11, 6, 2);
  px(c, '#c62828', cx - 1, by - 14, 3, 5);
}

function drawStool(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 5, by + 1, 10, 2);
  px(c, '#e23a2a', cx - 5, by - 4, 10, 3);
  px(c, '#ff6a5a', cx - 5, by - 4, 10, 1);
  px(c, '#b71c1c', cx - 4, by - 1, 2, 3);
  px(c, '#b71c1c', cx + 2, by - 1, 2, 3);
}

// ── 噴水圓環：中間的台座、KANO 投手像（抬腿要投球）、四周的噴泉、水面的波光 ──
function drawFountain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const f = CY.fountain;
  const cx = Math.round(f.cx * T);
  const cy = Math.round(f.cy * T);
  // 水面波光
  for (let i = 0; i < 14; i += 1) {
    const a = i * 2.4 + d.seconds * 0.3;
    const r = (0.6 + ((i * 37) % 10) / 10 * (f.pool - 0.8)) * T;
    px(c, `rgba(230,250,255,${0.25 + 0.2 * Math.sin(d.seconds * 2 + i)})`, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.9), 4, 1);
  }
  // 噴泉：八道水柱往外噴
  for (let k = 0; k < 8; k += 1) {
    const a = (k / 8) * Math.PI * 2;
    for (let s = 0; s < 6; s += 1) {
      const t = (d.seconds * 0.9 + s / 6 + k * 0.05) % 1;
      const r = 6 + t * (f.pool * T - 12);
      const lift = Math.sin(t * Math.PI) * 14;
      px(c, `rgba(220,245,255,${0.8 * (1 - t * 0.6)})`, Math.round(cx + Math.cos(a) * r), Math.round(cy + Math.sin(a) * r * 0.8 - lift), 2, 2);
    }
  }
  // 台座（三層）
  px(c, 'rgba(0,0,0,0.2)', cx - 9, cy + 1, 18, 3);
  px(c, '#b5ad9f', cx - 8, cy - 6, 16, 7);
  px(c, '#d6cdbd', cx - 8, cy - 6, 16, 1);
  px(c, '#a8a092', cx - 6, cy - 14, 12, 8);
  px(c, '#c9c1b0', cx - 6, cy - 14, 12, 1);
  px(c, '#9a9284', cx - 4, cy - 20, 8, 6);
  // KANO 投手：青銅色、抬起左腳、右手往後要投出去
  const bronze = '#7a5a32';
  const hi = '#a8804a';
  const sy = cy - 20;
  px(c, bronze, cx - 1, sy - 6, 2, 6);
  px(c, bronze, cx + 1, sy - 9, 4, 2);
  px(c, bronze, cx + 4, sy - 9, 2, 3);
  px(c, bronze, cx - 3, sy - 14, 6, 8);
  px(c, hi, cx - 3, sy - 14, 1, 8);
  px(c, bronze, cx - 2, sy - 18, 4, 4);
  px(c, '#5a4024', cx - 3, sy - 19, 6, 2);
  px(c, bronze, cx - 8, sy - 16, 5, 2);
  px(c, bronze, cx - 9, sy - 18, 2, 3);
  px(c, bronze, cx + 3, sy - 13, 4, 2);
  px(c, '#5a4024', cx + 6, sy - 14, 3, 3);
}

// 沒有椅背的石椅（背對畫面坐、面向噴水池的那兩張）
function drawStoneBench(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const half = Math.round(1.25 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 1, half * 2, 3);
  px(c, '#9a958c', cx - half, by - 5, half * 2, 6);
  px(c, '#b8b3a8', cx - half, by - 5, half * 2, 2);
  px(c, '#7a766e', cx - half + 3, by + 1, 4, 2);
  px(c, '#7a766e', cx + half - 7, by + 1, 4, 2);
}

// 中山路北邊的街屋（招牌：雞肉飯、方塊酥、木材行…）
const ROW_HOUSES: Townhouse[] = (() => {
  const out: Townhouse[] = [];
  const rand = seeded(1933);
  for (const [a, b] of [[0.3, CY.bunka.x0], [CY.bunka.x1, CY.market.x1 - 0.2]] as const) {
    let x = a;
    while (x < b - 0.5) {
      const w = Math.min(2.8 + Math.floor(rand() * 3) * 0.6, b - x);
      out.push({ x0: x, x1: x + w, floors: 2 + Math.floor(rand() * 2), seed: Math.floor(rand() * 10000) });
      x += w;
    }
  }
  return out;
})();
const CY_WORDS = ['雞肉飯', '方塊酥', '木材行', '茶行', '書局', '鐘錶', '眼鏡', '布莊', '漆器'];

// ── 嘉義車站：1933 年的米白色老車站（兩翼、中間高起來的站房、直條長窗、平屋頂、門口的雨庇） ──
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((CY.station.x1 - CY.station.x0) * T);
  const h = 96;
  return cached('cy-station', w, h, (c) => {
    const base = h;
    const cx = w / 2;
    // 兩翼
    px(c, '#efe6cf', 0, base - 46, w, 46);
    px(c, '#d9ccae', 0, base - 50, w, 5);
    px(c, '#c9bc9e', 0, base - 46, w, 1);
    px(c, '#d9ccae', 0, base - 8, w, 8);
    for (let x = 10; x < w - 14; x += 18) {
      if (Math.abs(x + 5 - cx) < 62) continue;
      px(c, '#ffffff', x - 1, base - 40, 12, 26);
      px(c, '#3a4656', x, base - 39, 10, 24);
      px(c, '#ffffff', x, base - 28, 10, 1);
      px(c, 'rgba(160,210,240,0.35)', x + 1, base - 38, 3, 4);
    }
    // 中間的站房：高起來、上面一圈線腳、五條直的長窗
    px(c, '#f4ecd8', cx - 56, base - 78, 112, 78);
    px(c, '#d9ccae', cx - 58, base - 82, 116, 5);
    px(c, '#c9bc9e', cx - 56, base - 77, 112, 1);
    for (const x of [cx - 56, cx + 52]) px(c, '#e2d6ba', x, base - 78, 4, 78);
    for (let k = 0; k < 5; k += 1) {
      const x = Math.round(cx - 40 + k * 17);
      px(c, '#ffffff', x - 1, base - 66, 12, 34);
      px(c, '#3a4656', x, base - 65, 10, 32);
      for (let y = base - 58; y < base - 33; y += 8) px(c, '#ffffff', x, y, 10, 1);
    }
    px(c, '#f4ecd8', cx - 28, base - 92, 56, 12);
    px(c, '#d9ccae', cx - 30, base - 94, 60, 3);
    text(c, '嘉義車站', cx, base - 86, '#2f3a4a', `900 9px ${SERIF_TC}`);
    // 門口的雨庇、大門
    px(c, '#d9ccae', cx - 46, base - 26, 92, 4);
    px(c, 'rgba(0,0,0,0.18)', cx - 46, base - 22, 92, 2);
    for (const x of [cx - 44, cx + 40]) px(c, '#e2d6ba', x, base - 22, 4, 22);
    for (const dx of [-30, -10, 10]) {
      px(c, '#2a2f3a', cx + dx, base - 20, 20, 20);
      px(c, '#ffe9b8', cx + dx + 2, base - 18, 16, 18);
      px(c, '#2a2f3a', cx + dx + 10, base - 18, 1, 18);
    }
    // 右邊：阿里山森林鐵路的牌子
    px(c, '#a8222a', w - 70, base - 20, 56, 9);
    text(c, '阿里山森林鐵路', w - 42, base - 15.5, '#f2e2b8', `900 6px ${FONT_TC}`);
  });
}

// 車站前廣場的椰子樹（嘉義車站前有一排）
function drawPalm(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  for (let k = 0; k < 34; k += 3) px(c, k % 6 ? '#8a6a42' : '#6e5232', cx - 1 + Math.round(Math.sin(k * 0.08) * 2), by - k - 3, 3, 3);
  const top = by - 36;
  const sway = Math.sin(seconds * 0.8 + x) * 1.5;
  for (const [dx, dy] of [[-12, 4], [12, 4], [-9, -3], [9, -3], [0, -6], [-14, 9], [14, 9]] as const) {
    c.strokeStyle = '#3f7a3a';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx + 1, top);
    c.quadraticCurveTo(cx + 1 + dx / 2 + sway, top + dy - 6, cx + 1 + dx + sway, top + dy);
    c.stroke();
  }
}

// ── 組成 CityScene 用的資料 ──
const SIGNALS: { x: number; y: number; dir: 1 | -1; cross: number }[] = CY.crossings.flatMap((x) => [
  { x: x + CY.crossingHalf + 0.3, y: CY.rail.y0 - 0.1, dir: -1 as const, cross: x },
  { x: x - CY.crossingHalf - 0.45, y: CY.rail.y1 + 0.5, dir: 1 as const, cross: x },
]);
const GROVE: [number, number][] = [[43.2, 8.6], [45.4, 9.0], [47.8, 8.4], [50.2, 8.9], [52.6, 8.5], [54.8, 9.0]];
const TREES: [number, number][] = [[36.6, 14.4], [54.4, 14.4], [36.6, 24.4], [54.4, 24.4], [1.4, 21.6], [33.4, 21.6]];
const PALMS: [number, number][] = [[3, 31], [9, 31], [47, 31], [53, 31], [3, 36], [53, 36]];
const LAMPS: [number, number][] = [[13.6, 20.2], [21.2, 20.2], [38.6, 19], [52.6, 19], [12, 29], [44, 29], [15.4, 36.6], [40.6, 36.6]];
const SCOOTERS: [number, number][] = [1.6, 2.8, 4, 5.2, 6.4, 7.6, 22, 23.2, 24.4, 25.6, 26.8, 28, 29.2].map((x): [number, number] => [x, 29]);

const props: CityProp[] = [
  ...CY.houses.map((_, i): CityProp => ({ y: CY.northLine, draw: (c, d) => drawHinoki(c, i, d) })),
  { y: CY.northLine + 0.1, draw: (c, d) => drawVillageGate(c, d) },
  { y: CY.northLine, draw: (c) => blit(c, beimenSprite(), CY.beimen.x0 * T, CY.northLine * T) },
  ...GROVE.map(([x, y]): CityProp => ({ y, draw: (c) => cypress(c, x * T, y * T, 46, '#24503a', '#2f6446') })),
  { y: CY.rail.y1 - 0.01, draw: (c, d) => drawTrain(c, d) },
  ...SIGNALS.map((s): CityProp => ({ y: s.y, draw: (c, d) => drawCrossingSignal(c, s.x, s.y, s.dir, s.cross, d) })),
  ...MARKET_CARTS.map((s, i): CityProp => ({ y: CY.cartY, draw: (c, d) => drawFoodCart(c, s.x, CY.cartY, s.name, s.awning, s.food, d.seconds + i * 0.37, 11 + i * 7) })),
  { y: CY.cartY + 0.02, draw: (c, d) => drawStringLights(c, d) },
  ...MARKET_TABLES.map((x): CityProp => ({ y: TABLE_Y, draw: (c) => drawTable(c, x) })),
  { y: CY.market.y1 + 0.2, draw: (c, d) => drawMarketArch(c, d) },
  ...ROW_HOUSES.map((b): CityProp => ({ y: CY.rowLine, draw: (c) => blit(c, townhouseSprite('cy', b, CY_WORDS), b.x0 * T, CY.rowLine * T) })),
  { y: CY.fountain.cy, draw: (c, d) => drawFountain(c, d) },
  ...FOUNTAIN_BENCHES.map((b): CityProp => ({ y: b.y - 0.01, draw: (c) => (b.facing === 'up' ? drawStoneBench(c, b.x, b.y) : drawBench(c, b.x, b.y, 2.6)) })),
  { y: CY.station.y, draw: (c) => blit(c, stationSprite(), CY.station.x0 * T, CY.station.y * T) },
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...PALMS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawPalm(c, x, y, d.seconds) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[i % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 鐵軌只有平交道能過；噴水池的水不能走
function blocked(x: number, y: number): boolean {
  if (y > CY.rail.y0 - 0.1 && y < CY.rail.y1 + 0.2) return !CY.crossings.some((cx) => Math.abs(x - cx) < CY.crossingHalf - 0.25);
  return Math.hypot(x - CY.fountain.cx, y - CY.fountain.cy) < CY.fountain.pool + 0.35;
}
const solid: Rect[] = [
  r(0, 0, CY.W, CY.northLine - 0.25),
  ...MARKET_CARTS.map((s) => r(s.x - 1.25, CY.cartY - 0.8, s.x + 1.25, CY.cartY - 0.05)),
  ...MARKET_TABLES.map((x) => r(x - 1.2, TABLE_Y - 0.4, x + 1.2, TABLE_Y)),
  r(0, CY.rowLine - 3.2, CY.bunka.x0, CY.rowLine - 0.1),
  r(CY.bunka.x1, CY.rowLine - 3.2, CY.market.x1 - 0.2, CY.rowLine - 0.1),
  ...[CY.bunka.x0 + 0.2, CY.bunka.x1 - 0.2].map((x) => r(x - 0.15, CY.market.y1, x + 0.15, CY.market.y1 + 0.25)),
  ...FOUNTAIN_BENCHES.map((b) => (b.facing === 'up' ? r(b.x - 1.3, b.y - 0.35, b.x + 1.3, b.y - 0.1) : r(b.x - 1.3, b.y - 0.75, b.x + 1.3, b.y - 0.45))),
  r(CY.station.x0, CY.station.y - 2.8, CY.station.x1, CY.station.y - 0.1),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...PALMS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
  ...SIGNALS.map((s) => r(s.x - 0.15, s.y - 0.2, s.x + 0.25, s.y + 0.05)),
  r(1.2, 28.5, 8, 29.1),
  r(21.6, 28.5, 29.6, 29.1),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...MARKET_CARTS.map((s) => ({ x: s.x * T, y: CY.cartY * T - 14, r: 40, color: 'rgba(255, 215, 140, 0.55)' })),
  ...CY.houses.map((h) => ({ x: ((h.x0 + h.x1) / 2) * T, y: CY.northLine * T - 22, r: 36, color: 'rgba(255, 200, 120, 0.4)' })),
  { x: ((CY.beimen.x0 + CY.beimen.x1) / 2) * T, y: CY.northLine * T - 14, r: 46, color: 'rgba(255, 220, 150, 0.45)' },
  { x: ((CY.bunka.x0 + CY.bunka.x1) / 2) * T, y: CY.market.y1 * T - 40, r: 50, color: 'rgba(255, 200, 90, 0.45)' },
  { x: CY.fountain.cx * T, y: CY.fountain.cy * T - 10, r: 56, color: 'rgba(150, 210, 255, 0.4)' },
  ...ROW_HOUSES.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: CY.rowLine * T - 10, r: 26, color: 'rgba(255, 215, 140, 0.4)' })),
  { x: ((CY.station.x0 + CY.station.x1) / 2) * T, y: CY.station.y * T - 30, r: 90, color: 'rgba(255, 230, 180, 0.45)' },
];

const stationX = (CY.station.x0 + CY.station.x1) / 2;
const houseX = (i: number) => {
  const h = CY.houses[i] ?? CY.houses[0];
  return (h.x0 + h.x1) / 2;
};

export const CHIAYI: CityDef = {
  id: 'chiayi',
  W: CY.W,
  H: CY.H,
  title: { 'zh-TW': '嘉義 · 森林鐵路與文化路夜市', 'en-US': 'Chiayi · Forest Railway & Wenhua Road Night Market' },
  stop: { 'zh-TW': '嘉義', 'en-US': 'Chiayi' },
  emoji: '🚂',
  line: 'tra',
  station: {
    x: stationX,
    y: CY.station.y + 0.7,
    name: { 'zh-TW': '台鐵嘉義車站', 'en-US': 'TRA Chiayi Station' },
    arrive: { x: stationX + 3, y: CY.station.y + 0.9 },
  },
  background: '#d9d0bf',
  soundscape: 'market',
  paintGround: paintChiayiGround,
  props,
  solid,
  blocked,
  seats: CHIAYI_SEATS,
  drawSeat: (c, i) => {
    const s = CHIAYI_SEATS[i];
    if (s && i >= VERANDA_HOUSES.length * 2 && i < (VERANDA_HOUSES.length + MARKET_TABLES.length) * 2) drawStool(c, s.x, s.y);
  },
  shops: CHIAYI_SHOPS,
  infos: [
    { at: r(0, 0, CY.W, 6.2), title: { 'zh-TW': '阿里山', 'en-US': 'Alishan' }, text: { 'zh-TW': '遠遠那排山就是阿里山山脈。從嘉義搭森林鐵路上山，可以看神木、日出、雲海，春天還有櫻花。', 'en-US': 'Those far-off ridges are the Alishan range. Take the forest railway up from Chiayi for giant trees, sunrise, the sea of clouds — and cherry blossoms in spring.' } },
    { at: r(CY.houses[0].x0, 6.2, CY.houses[3].x1, CY.northLine), title: { 'zh-TW': '檜意森活村', 'en-US': 'Hinoki Village' }, text: { 'zh-TW': '日治時期阿里山林業員工的宿舍，用阿里山的檜木蓋的，將近 30 棟日式木屋整修後開放，可以在緣側坐著喝茶。', 'en-US': 'Japanese-era dormitories for Alishan forestry staff, built of Alishan cypress — nearly 30 wooden houses restored and opened to visitors. Sit on a veranda with some tea.' } },
    { at: r(CY.beimen.x0, 6.2, CY.beimen.x1, CY.northLine), title: { 'zh-TW': '北門驛', 'en-US': 'Beimen Station' }, text: { 'zh-TW': '阿里山森林鐵路的老車站，1910 年代用檜木蓋的，整棟都是原木。以前阿里山的木材就是從這裡運下山。', 'en-US': 'An old Alishan Forest Railway station from the 1910s, built entirely of cypress. Timber from Alishan used to come down through here.' } },
    { at: r(0, CY.rail.y0, CY.W, CY.rail.y1), title: { 'zh-TW': '阿里山森林鐵路', 'en-US': 'Alishan Forest Railway' }, text: { 'zh-TW': '1912 年通車的窄軌登山鐵路，從嘉義到阿里山 70 多公里，從平地一路爬到海拔 2,000 多公尺，中間有螺旋線和之字形折返。', 'en-US': 'A narrow-gauge mountain railway opened in 1912 — over 70 km from Chiayi to Alishan, climbing from the plains to more than 2,000 m with a spiral and switchbacks.' } },
    { at: r(0, CY.market.y0, CY.market.x1, CY.market.y1), title: { 'zh-TW': '文化路夜市', 'en-US': 'Wenhua Road Night Market' }, text: { 'zh-TW': '嘉義市中心的夜市，晚上文化路變成一整條小吃街。火雞肉飯是嘉義的招牌，還有沙鍋魚頭、豆花和伴手禮方塊酥。', 'en-US': 'Chiayi’s downtown night market — at night Wenhua Road turns into one long food street. Turkey rice is the city’s signature, plus fish head casserole, tofu pudding and square pastries to take home.' } },
    { at: r(CY.fountain.cx - CY.fountain.pool, CY.fountain.cy - CY.fountain.pool - 1.5, CY.fountain.cx + CY.fountain.pool, CY.fountain.cy + CY.fountain.pool), title: { 'zh-TW': '噴水圓環', 'en-US': 'Fountain Roundabout' }, text: { 'zh-TW': '嘉義市中心的圓環，水池中間站著 KANO 嘉農棒球隊投手的雕像——1931 年嘉農打進日本甲子園拿下亞軍。旁邊就是有名的雞肉飯老店。', 'en-US': 'The roundabout at the heart of Chiayi, topped by a statue of the KANO baseball team’s pitcher — in 1931 the Chiayi agricultural school reached the Koshien final in Japan. Famous turkey-rice shops sit right beside it.' } },
    { at: r(CY.station.x0, CY.station.y - 6, CY.station.x1, CY.station.y), title: { 'zh-TW': '嘉義車站', 'en-US': 'Chiayi Station' }, text: { 'zh-TW': '1933 年完工的老車站，到現在還在用。阿里山森林鐵路的小火車也從這裡出發。', 'en-US': 'Completed in 1933 and still in service — the Alishan Forest Railway trains also start here.' } },
  ],
  labels: [
    { x: houseX(0) + 3.4, y: CY.northLine - 5.2, text: { 'zh-TW': '🌲 檜意森活村（緣側坐下專注）', 'en-US': '🌲 Hinoki Village (sit on a veranda)' }, color: '#86efac' },
    { x: (CY.beimen.x0 + CY.beimen.x1) / 2, y: CY.northLine - 5.2, text: { 'zh-TW': '🚂 北門驛', 'en-US': '🚂 Beimen Station' }, color: '#fbbf24' },
    { x: (CY.bunka.x0 + CY.bunka.x1) / 2, y: CY.market.y1 - 3.8, text: { 'zh-TW': '🌙 文化路夜市', 'en-US': '🌙 Wenhua Rd Night Market' }, color: '#f472b6' },
    { x: CY.fountain.cx, y: CY.fountain.cy - CY.fountain.r - 0.1, text: { 'zh-TW': '⛲ 噴水圓環', 'en-US': '⛲ Fountain Roundabout' }, color: '#60a5fa' },
  ],
  walkers: [
    { x0: 1, y0: 10.5, x1: 41, y1: 10.5, count: 3 },
    { x0: 1, y0: 16.6, x1: 34, y1: 16.6, count: 4 },
    { x0: 1, y0: 19.8, x1: 34, y1: 19.8, count: 2 },
    { x0: 17.4, y0: 13, x1: 17.4, y1: 25, count: 2 },
    { x0: 35, y0: 13.4, x1: 55, y1: 13.4, count: 1 },
    { x0: 35, y0: 24.4, x1: 55, y1: 24.4, count: 2 },
    { x0: 1, y0: 28.8, x1: 55, y1: 28.8, count: 3 },
    { x0: 1, y0: 37.2, x1: 55, y1: 37.2, count: 2 },
  ],
  traffic: [
    { y: 26.4, dir: 1, x0: 0, x1: CY.W, count: 2 },
    { y: 27.6, dir: -1, x0: 0, x1: CY.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點檜意森活村的緣側、夜市的桌子或噴水圓環的長椅坐下專注 · 走到攤車買火雞肉飯、豆花 · 茶屋買阿里山茶 · 走平交道過鐵軌（火車來了會閃燈） · 點地標看介紹 · 嘉義車站回台北（台鐵）',
    'en-US': 'WASD / arrows to move · click a veranda at Hinoki Village, a night-market table or a bench at the fountain to focus · walk up to the carts for turkey rice and tofu pudding · Alishan tea at the tea house · cross the tracks at the level crossings (lights flash when a train comes) · click landmarks for info · Chiayi Station back to Taipei (TRA)',
  },
  hintTouch: {
    'zh-TW': '點緣側、夜市桌子或長椅坐下專注 · 走到攤車買東西 · 茶屋買阿里山茶 · 走平交道過鐵軌 · 點地標看介紹 · 嘉義車站回台北',
    'en-US': 'Tap a veranda, table or bench to focus · walk up to the carts · tea at the tea house · cross at the level crossings · tap landmarks · station back to Taipei',
  },
};
