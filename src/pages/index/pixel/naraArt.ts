// 奈良的美術：若草山（三層的草山）和春日山的森林、東大寺大佛殿（雙層大屋頂、金色鴟尾、唐破風、觀相窗）、八角燈籠、
// 南大門（大佛樣的木門、兩邊的仁王像、築地塀）、興福寺五重塔（倒映在猿澤池裡）、猿澤池（石垣、柳樹、烏龜）、
// 春日大社（朱紅的南門和迴廊、釣燈籠、一整排長青苔的石燈籠參道、一之鳥居、杉林、鹿みくじ）、參道旁的茶屋（紅傘緣台）、
// 奈良公園的鹿（用時間算：慢慢走、低頭吃草、對人鞠躬）、鹿仙貝的攤子、三条通、JR 奈良站（寺廟屋頂＋相輪的舊站舍、高架上的電車）、
// 南邊的町家（柿葉壽司、奈良漬、墨）。最後組成 CityScene 用的 NARA。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { NARA_SEATS, NARA_SHOPS, NR, PARK_BENCHES, PARK_BENCH_Y, POND_BENCHES, POND_BENCH_Y, SOUTH_ROW, TEA_BENCHES, TEA_BENCH_Y, inPond } from './nara';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, drawBench, drawStoneBench } from './cityArt';
import { drawLantern, drawMaple, drawStreetLamp, drawWillow } from './kyotoArt';

const TILE = '#3c3f46';
const TILE_DARK = '#2a2c31';
const WOOD = '#5e3a26';
const WOOD_DARK = '#3e2618';
const PLASTER = '#f0ebe0';
const VERMILION = '#d2452e';
const VERMILION_DARK = '#a8321f';
const GOLD = '#d9a62a';
const GOLD_LIGHT = '#f4d36a';

// ── 日式屋頂（正面看）：兩端的屋簷翹起、往屋脊凹進去；ridge 是屋脊寬占幾成 ──
function eave(c: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number, color = TILE, ridge = 0.36, tip = 3): void {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const rl = cx - (w * ridge) / 2;
  const rr = cx + (w * ridge) / 2;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(l - tip, top + h - tip - 1);
  c.quadraticCurveTo(l + (rl - l) * 0.45, top + h + 1, rl, top);
  c.lineTo(rr, top);
  c.quadraticCurveTo(r - (r - rr) * 0.45, top + h + 1, r + tip, top + h - tip - 1);
  c.lineTo(r, top + h);
  c.lineTo(l, top + h);
  c.closePath();
  c.fill();
  // 瓦的直線
  c.save();
  c.clip();
  for (let x = Math.round(l); x < r; x += 3) px(c, 'rgba(255,255,255,0.08)', x, top, 1, h);
  px(c, 'rgba(255,255,255,0.12)', Math.round(rl), Math.round(top), Math.round(rr - rl), 1);
  c.restore();
  // 屋簷的邊、下面的椽子
  px(c, TILE_DARK, Math.round(l), Math.round(top + h - 2), Math.round(w), 2);
  px(c, '#a88a62', Math.round(l + 2), Math.round(top + h), Math.round(w - 4), 1);
  px(c, '#6e5238', Math.round(l + 3), Math.round(top + h + 1), Math.round(w - 6), 1);
}

// ── 地面（畫一次）──
export function paintNaraGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(752);
  const W = NR.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 5 * T);
  sky.addColorStop(0, '#86bfe6');
  sky.addColorStop(1, '#e6f2f6');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 5 * T);
  // 春日山（遠山）
  c.fillStyle = '#5a8a62';
  c.beginPath();
  c.moveTo(0, 8 * T);
  for (let x = 0; x <= W; x += 10) c.lineTo(x, 3 * T + Math.sin(x * 0.006 + 1) * 14 + Math.sin(x * 0.021) * 5);
  c.lineTo(W, 8 * T);
  c.fill();
  // 若草山：三層圓圓的草山
  const wk = 47 * T;
  for (const [rx, top, col] of [
    [10.5, 2.9, '#9cbf5a'],
    [7.4, 2.1, '#aac866'],
    [4.4, 1.4, '#b6d274'],
  ] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(wk, 7 * T, rx * T, (7 - top) * T, 0, Math.PI, Math.PI * 2);
    c.fill();
  }
  for (let i = 0; i < 40; i += 1) px(c, 'rgba(255,255,255,0.16)', Math.round(wk - 8 * T + rand() * 16 * T), Math.round(2.6 * T + rand() * 3 * T), 4, 1);
  // 森林（大佛殿後面）
  for (let i = 0; i < 260; i += 1) {
    const x = rand() * W;
    const y = 4.8 * T + rand() * 6 * T;
    if (x > 38 * T && y < 6.4 * T) continue;
    c.fillStyle = ['#355e3a', '#3f6c42', '#4a7a4a', '#2e5232'][Math.floor(rand() * 4)] ?? '#3f6c42';
    c.beginPath();
    c.arc(x, y, 5 + rand() * 7, 0, Math.PI * 2);
    c.fill();
  }
  // 草地（奈良公園）
  px(c, '#8db35c', 0, 10.4 * T, W, (NR.walk - 10.4) * T);
  for (let i = 0; i < 900; i += 1) px(c, rand() < 0.5 ? '#7fa650' : '#9bc068', Math.floor(rand() * W), Math.floor(10.4 * T + rand() * (NR.walk - 10.4) * T), 2, 1);
  for (let i = 0; i < 60; i += 1) px(c, rand() < 0.5 ? '#f4efe2' : '#f2d66a', Math.floor(rand() * W), Math.floor(17.5 * T + rand() * 12 * T), 1, 1);
  // 春日山的杉林底下（東邊，比較暗）
  px(c, '#4f7444', NR.forestX * T, 10.4 * T, W - NR.forestX * T, (NR.walk - 10.4) * T);
  for (let i = 0; i < 120; i += 1) px(c, rand() < 0.5 ? '#44683c' : '#5d8450', Math.floor(NR.forestX * T + rand() * (W - NR.forestX * T)), Math.floor(10.4 * T + rand() * (NR.walk - 10.4) * T), 3, 1);
  // 砂石：大佛殿前的庭院、興福寺的境內
  const gravel = (r: Rect) => {
    px(c, '#ddd5c2', r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T);
    const n = Math.floor((r.x1 - r.x0) * (r.y1 - r.y0) * 4);
    for (let i = 0; i < n; i += 1) px(c, rand() < 0.5 ? '#cbc2ad' : '#ebe5d6', Math.floor(r.x0 * T + rand() * (r.x1 - r.x0) * T), Math.floor(r.y0 * T + rand() * (r.y1 - r.y0) * T), 1, 1);
  };
  gravel({ x0: 10.4, y0: 10.4, x1: 37.6, y1: 19 });
  gravel({ x0: 0, y0: 10.4, x1: 12.4, y1: 21.6 });
  // 石板參道：中軸（大佛殿 → 南大門 → 三条通）、春日大社的參道
  const slabs = (r: Rect, base: string, joint: string, moss = false) => {
    px(c, base, r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T);
    for (let y = r.y0 * T, row = 0; y < r.y1 * T; y += 8, row += 1) {
      px(c, joint, r.x0 * T, Math.round(y), (r.x1 - r.x0) * T, 1);
      for (let x = r.x0 * T + (row % 2) * 8; x < r.x1 * T; x += 16) px(c, joint, Math.round(x), Math.round(y), 1, 8);
    }
    px(c, 'rgba(0,0,0,0.12)', r.x0 * T, r.y0 * T, 1, (r.y1 - r.y0) * T);
    px(c, 'rgba(0,0,0,0.12)', r.x1 * T - 1, r.y0 * T, 1, (r.y1 - r.y0) * T);
    if (moss) for (let i = 0; i < (r.y1 - r.y0) * 6; i += 1) px(c, 'rgba(90,130,70,0.45)', Math.round(r.x0 * T + (rand() < 0.5 ? rand() * 6 : (r.x1 - r.x0) * T - rand() * 6)), Math.round(r.y0 * T + rand() * (r.y1 - r.y0) * T), 2, 1);
  };
  slabs({ x0: NR.axis - 1.5, y0: 10.4, x1: NR.axis + 1.5, y1: NR.walk }, '#c9c2b2', '#b0a894');
  slabs({ x0: NR.sando.x0, y0: 10.4, x1: NR.sando.x1, y1: NR.walk }, '#b9b4a6', '#9e9888', true);
  // 猿澤池：石垣、水
  const { cx, cy, rx, ry } = NR.pond;
  c.fillStyle = '#a8a296';
  c.beginPath();
  c.ellipse(cx * T, cy * T, (rx + 0.4) * T, (ry + 0.4) * T, 0, 0, Math.PI * 2);
  c.fill();
  for (let a = 0; a < Math.PI * 2; a += 0.09) px(c, '#8a857a', Math.round((cx + Math.cos(a) * (rx + 0.2)) * T), Math.round((cy + Math.sin(a) * (ry + 0.2)) * T), 2, 2);
  const water = c.createLinearGradient(0, (cy - ry) * T, 0, (cy + ry) * T);
  water.addColorStop(0, '#2f6264');
  water.addColorStop(1, '#3f7a76');
  c.fillStyle = water;
  c.beginPath();
  c.ellipse(cx * T, cy * T, rx * T, ry * T, 0, 0, Math.PI * 2);
  c.fill();
  // 池裡的小石頭（烏龜曬太陽的地方）
  c.fillStyle = '#8a857a';
  c.beginPath();
  c.ellipse(12.4 * T, 27.6 * T, 9, 4, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#4a5a3a', 12.4 * T - 6, 27.6 * T - 4, 5, 3);
  px(c, '#3a4a2e', 12.4 * T - 7, 27.6 * T - 3, 1, 1);
  px(c, '#4a5a3a', 12.4 * T + 2, 27.6 * T - 3, 4, 2);
  // 人行道、三条通
  tiles(c, { x0: 0, y0: NR.walk, x1: NR.W, y1: NR.road.y0 }, '#d4cfc4', '#c2bcb0', 16);
  road(c, { x0: 0, y0: NR.road.y0, x1: NR.W, y1: NR.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((NR.road.y0 + NR.road.y1) / 2) * T), 12, 1);
  zebra(c, NR.axis - 1.5, NR.road.y0, NR.axis + 1.5, NR.road.y1, false);
  zebra(c, NR.sando.x0, NR.road.y0, NR.sando.x1, NR.road.y1, false);
  tiles(c, { x0: 0, y0: NR.road.y1, x1: NR.W, y1: NR.H }, '#d8d3c7', '#c7c1b3', 16);
  px(c, '#bdb6a8', 0, NR.road.y1 * T, W, 2);
}

// ── 東大寺大佛殿 ──
// 鴟尾（屋脊兩端的金色魚尾）
function shibi(c: CanvasRenderingContext2D, x: number, y: number, f: 1 | -1): void {
  const m = (dx: number, dy: number, w: number, h: number, col: string) => px(c, col, f > 0 ? x + dx : x - dx - w, y + dy, w, h);
  m(-3, -4, 7, 4, GOLD);
  m(-2, -10, 5, 6, GOLD);
  m(0, -15, 4, 5, GOLD);
  m(2, -19, 3, 4, GOLD);
  m(4, -21, 2, 3, GOLD);
  m(-2, -10, 1, 6, GOLD_LIGHT);
  m(0, -15, 1, 5, GOLD_LIGHT);
  for (let k = 0; k < 4; k += 1) m(-3 + k, -6 - k * 3, 1, 1, '#a87a1a');
}

const DB_W = (NR.daibutsu.x1 - NR.daibutsu.x0) * T;
const DB_H = 166;
function daibutsuSprite(): HTMLCanvasElement {
  const w = DB_W;
  const h = DB_H;
  return cached('nr-daibutsu', w, h, (c) => {
    const cx = w / 2;
    // 基壇、中間的石階
    px(c, '#b8b2a4', 6, h - 10, w - 12, 10);
    px(c, '#d0cabc', 6, h - 10, w - 12, 2);
    for (let x = 10; x < w - 10; x += 14) px(c, '#a49e90', x, h - 7, 1, 7);
    px(c, '#c9c2b2', cx - 34, h - 8, 68, 8);
    for (let y = h - 7; y < h; y += 2) px(c, '#aaa294', cx - 34, y, 68, 1);
    // 一樓：白牆、木柱、大門
    const b0 = 30;
    px(c, PLASTER, b0, h - 48, w - b0 * 2, 38);
    px(c, WOOD, b0, h - 48, w - b0 * 2, 4);
    px(c, WOOD, b0, h - 28, w - b0 * 2, 2);
    for (let x = b0; x <= w - b0 - 5; x += 29) px(c, WOOD, Math.round(x), h - 48, 5, 38);
    // 側邊的格子窗
    for (let x = b0 + 8; x < w - b0 - 20; x += 29) {
      if (Math.abs(x + 8 - cx) < 50) continue;
      px(c, '#3a2a20', Math.round(x), h - 42, 16, 12);
      for (let k = 1; k < 16; k += 3) px(c, '#8a6a4a', Math.round(x) + k, h - 42, 1, 12);
    }
    // 中間的大門（開著，裡面暗暗的、大佛的光）
    px(c, WOOD_DARK, cx - 30, h - 44, 60, 34);
    px(c, '#1e140e', cx - 24, h - 40, 48, 30);
    px(c, 'rgba(217,166,42,0.35)', cx - 10, h - 36, 20, 26);
    px(c, GOLD, cx - 30, h - 44, 60, 2);
    // 裳階（一樓的屋頂）
    eave(c, cx, h - 66, w - 18, 20, TILE, 0.82, 4);
    // 唐破風（正面中間的弧形屋頂），上面金色的裝飾
    c.fillStyle = TILE;
    c.beginPath();
    c.moveTo(cx - 52, h - 47);
    c.bezierCurveTo(cx - 40, h - 50, cx - 26, h - 78, cx, h - 78);
    c.bezierCurveTo(cx + 26, h - 78, cx + 40, h - 50, cx + 52, h - 47);
    c.lineTo(cx + 46, h - 45);
    c.bezierCurveTo(cx + 30, h - 50, cx + 22, h - 70, cx, h - 70);
    c.bezierCurveTo(cx - 22, h - 70, cx - 30, h - 50, cx - 46, h - 45);
    c.closePath();
    c.fill();
    c.strokeStyle = PLASTER;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 44, h - 47);
    c.bezierCurveTo(cx - 30, h - 52, cx - 22, h - 69, cx, h - 69);
    c.bezierCurveTo(cx + 22, h - 69, cx + 30, h - 52, cx + 44, h - 47);
    c.stroke();
    px(c, GOLD, cx - 4, h - 72, 8, 4);
    px(c, GOLD_LIGHT, cx - 2, h - 71, 4, 2);
    for (const k of [-30, 30]) px(c, GOLD, cx + k - 2, h - 58, 4, 3);
    // 二樓：白牆、木柱、觀相窗（初一十五打開，看得到大佛的臉）
    const u0 = 68;
    px(c, PLASTER, u0, h - 104, w - u0 * 2, 40);
    px(c, WOOD, u0, h - 104, w - u0 * 2, 3);
    for (let x = u0; x <= w - u0 - 5; x += 31) px(c, WOOD, Math.round(x), h - 104, 5, 40);
    for (let x = u0 + 9; x < w - u0 - 16; x += 31) {
      if (Math.abs(x + 8 - cx) < 40) continue;
      px(c, '#3a2a20', Math.round(x), h - 98, 16, 14);
      for (let k = 1; k < 16; k += 3) px(c, '#8a6a4a', Math.round(x) + k, h - 98, 1, 14);
    }
    px(c, WOOD_DARK, cx - 26, h - 100, 52, 26);
    px(c, '#c9a86a', cx - 23, h - 97, 46, 20);
    for (let k = 2; k < 46; k += 4) px(c, '#7a5a3a', cx - 23 + k, h - 97, 1, 20);
    px(c, '#7a5a3a', cx - 23, h - 88, 46, 1);
    // 斗栱
    for (let x = u0; x < w - u0; x += 6) px(c, (x / 6) % 2 ? '#8a6a4a' : WOOD_DARK, x, h - 108, 4, 4);
    // 大屋頂（寄棟造），屋脊、鴟尾
    eave(c, cx, h - 142, w - 30, 36, TILE, 0.42, 6);
    px(c, TILE_DARK, Math.round(cx - (w - 30) * 0.21) - 2, h - 146, Math.round((w - 30) * 0.42) + 4, 5);
    px(c, '#55585f', Math.round(cx - (w - 30) * 0.21), h - 146, Math.round((w - 30) * 0.42), 1);
    shibi(c, Math.round(cx - (w - 30) * 0.21) + 2, h - 145, -1);
    shibi(c, Math.round(cx + (w - 30) * 0.21) - 2, h - 145, 1);
  });
}
function drawDaibutsuden(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = NR.daibutsu.x0 * T;
  const by = NR.daibutsu.line * T;
  if (d.night) glow(c, x0 + DB_W / 2, by - 60, 150, '255, 210, 140', 0.2);
  blit(c, daibutsuSprite(), x0, by);
  // 鴟尾在晚上被燈打亮、白天反光一閃一閃
  const shine = 0.25 + 0.25 * Math.sin(d.seconds * 1.3);
  for (const sx of [-1, 1]) glow(c, x0 + DB_W / 2 + sx * (DB_W - 30) * 0.21 + sx * 3, by - DB_H + 10, 12, '255, 225, 140', d.night ? 0.6 : shine);
}

// 八角燈籠（大佛殿前，奈良時代的青銅燈籠）
function drawOctLantern(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(NR.axis * T);
  const by = Math.round(11.6 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 9, by - 1, 18, 3);
  px(c, '#9a948a', cx - 9, by - 5, 18, 5);
  px(c, '#b5ad9f', cx - 9, by - 5, 18, 1);
  px(c, '#4a5a4a', cx - 2, by - 18, 4, 13);
  px(c, '#5a6e58', cx - 6, by - 20, 12, 3);
  px(c, '#4a5a4a', cx - 5, by - 32, 10, 12);
  px(c, d.night ? '#ffe08a' : '#2e3a30', cx - 3, by - 30, 6, 8);
  px(c, '#6a8a66', cx - 5, by - 32, 1, 12);
  px(c, '#6a8a66', cx + 4, by - 32, 1, 12);
  c.fillStyle = '#4a5a4a';
  c.beginPath();
  c.moveTo(cx - 9, by - 32);
  c.lineTo(cx, by - 39);
  c.lineTo(cx + 9, by - 32);
  c.fill();
  px(c, '#5a6e58', cx - 1, by - 42, 3, 3);
  if (d.night) glow(c, cx, by - 26, 18, '255, 210, 130', 0.55);
}

// ── 南大門：五間的木門、上下兩層屋頂、兩邊的仁王像、匾額 ──
const NM_PAD = 12;
function nandaimonSprite(): HTMLCanvasElement {
  const inner = (NR.nandaimon.x1 - NR.nandaimon.x0) * T;
  const w = inner + NM_PAD * 2;
  const h = 124;
  return cached('nr-nandaimon', w, h, (c) => {
    const bay = inner / 5;
    const pil = (k: number) => Math.round(NM_PAD + k * bay);
    // 兩邊的仁王像（阿形、吽形）：格子後面的木雕
    for (const [k, open] of [
      [0, true],
      [4, false],
    ] as const) {
      const x0 = pil(k);
      px(c, '#2a1e16', x0, h - 56, Math.round(bay), 52);
      const fx = x0 + Math.round(bay / 2);
      px(c, '#7a5236', fx - 5, h - 50, 10, 4);
      px(c, '#8a5e3e', fx - 4, h - 48, 8, 8);
      px(c, '#2a1e16', fx - 2, h - 45, 4, open ? 3 : 1);
      px(c, '#8a5e3e', fx - 7, h - 40, 14, 18);
      px(c, '#6a4630', fx - 1, h - 38, 2, 14);
      px(c, '#8a5e3e', open ? fx - 11 : fx + 7, h - 50, 4, 16);
      px(c, '#8a5e3e', open ? fx + 7 : fx - 11, h - 38, 4, 12);
      px(c, '#b8a080', fx - 9, h - 22, 18, 3);
      px(c, '#8a5e3e', fx - 6, h - 19, 4, 13);
      px(c, '#8a5e3e', fx + 2, h - 19, 4, 13);
      for (let x = x0 + 1; x < x0 + bay - 1; x += 3) px(c, 'rgba(40,28,20,0.85)', x, h - 56, 1, 50);
    }
    // 柱子（沒有上漆的木頭）、門檻
    for (let k = 0; k <= 5; k += 1) {
      px(c, '#6a5040', pil(k) - 3, h - 58, 6, 54);
      px(c, '#8a6a52', pil(k) - 3, h - 58, 1, 54);
      px(c, '#9a948a', pil(k) - 5, h - 5, 10, 5);
    }
    // 貫（大佛樣一層層的橫木）、插肘木
    px(c, '#5a4232', NM_PAD - 4, h - 62, inner + 8, 5);
    for (let y = h - 70; y < h - 62; y += 3) for (let k = 0; k <= 5; k += 1) px(c, '#7a5a42', pil(k) - 6, y, 12, 2);
    // 下層屋頂
    eave(c, w / 2, h - 86, w - 6, 18, TILE, 0.86, 4);
    // 上層：木牆、斗栱、匾額「大華嚴寺」
    px(c, '#5a4232', NM_PAD + 8, h - 98, inner - 16, 14);
    for (let k = 1; k < 5; k += 1) px(c, '#6a5040', pil(k) - 2, h - 98, 4, 14);
    px(c, '#1e1a16', w / 2 - 12, h - 97, 24, 11);
    px(c, GOLD, w / 2 - 12, h - 97, 24, 1);
    text(c, '大華嚴寺', w / 2, h - 91, GOLD_LIGHT, `900 5px ${SERIF_TC}`);
    for (let x = NM_PAD + 6; x < w - NM_PAD - 6; x += 5) px(c, (x / 5) % 2 ? '#7a5a42' : '#4a3426', x, h - 102, 3, 4);
    // 上層屋頂
    eave(c, w / 2, h - 122, w - 4, 22, TILE, 0.5, 5);
    px(c, TILE_DARK, Math.round(w * 0.25) - 2, h - 124, Math.round(w * 0.5) + 4, 3);
  });
}

// 築地塀（土黃色的牆、白色的定規筋、瓦）
function drawEarthWall(c: CanvasRenderingContext2D, x0t: number, x1t: number, y: number): void {
  const x0 = Math.round(x0t * T);
  const x1 = Math.round(x1t * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.18)', x0, by, x1 - x0, 3);
  px(c, '#9a948a', x0, by - 4, x1 - x0, 4);
  px(c, '#d8b878', x0, by - 24, x1 - x0, 20);
  for (let k = 0; k < 5; k += 1) px(c, '#f4efe2', x0, by - 21 + k * 3, x1 - x0, 1);
  px(c, TILE, x0 - 2, by - 29, x1 - x0 + 4, 5);
  px(c, TILE_DARK, x0 - 2, by - 25, x1 - x0 + 4, 1);
  px(c, '#55585f', x0 - 1, by - 29, x1 - x0 + 2, 1);
}

// ── 興福寺五重塔 ──
const PG_W = 76;
const PG_H = 178;
function pagodaSprite(): HTMLCanvasElement {
  return cached('nr-pagoda', PG_W, PG_H, (c) => {
    const cx = PG_W / 2;
    px(c, '#a8a294', cx - 26, PG_H - 8, 52, 8);
    px(c, '#c0baac', cx - 26, PG_H - 8, 52, 1);
    let y = PG_H - 8;
    const tiers: [number, number, number][] = [
      [38, 18, 70],
      [35, 15, 64],
      [32, 14, 59],
      [29, 13, 54],
      [26, 13, 49],
    ];
    for (const [bw, bh, rw] of tiers) {
      const top = y - bh;
      // 塔身：木框、白壁、中間的門
      px(c, '#6a3e28', cx - bw / 2, top, bw, bh);
      px(c, PLASTER, cx - bw / 2 + 3, top + 3, bw / 2 - 7, bh - 4);
      px(c, PLASTER, cx + 4, top + 3, bw / 2 - 7, bh - 4);
      px(c, '#3a2418', cx - 3, top + 3, 6, bh - 3);
      px(c, '#8a5a3a', cx - bw / 2, top, bw, 2);
      // 斗栱、屋頂
      for (let x = cx - bw / 2 - 2; x < cx + bw / 2 + 2; x += 4) px(c, (x / 4) % 2 ? '#8a6a4a' : '#4a3020', Math.round(x), top - 3, 3, 3);
      eave(c, cx, top - 11, rw, 9, '#45403c', 0.5, 3);
      y = top - 11;
    }
    // 相輪（九輪、水煙）
    px(c, '#45403c', cx - 5, y - 4, 10, 4);
    px(c, '#6a5a3a', cx - 1, y - 40, 3, 36);
    for (let k = 0; k < 9; k += 1) px(c, '#8a7a4a', cx - 4, y - 10 - k * 3, 9, 1);
    px(c, '#8a7a4a', cx - 4, y - 44, 9, 4);
    px(c, '#a8964e', cx - 1, y - 48, 3, 4);
  });
}
function drawPagoda(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = NR.pagoda.x * T - PG_W / 2;
  const by = NR.pagoda.line * T;
  if (d.night) glow(c, NR.pagoda.x * T, by - 80, 80, '255, 200, 130', 0.3);
  blit(c, pagodaSprite(), x, by);
}
// 池裡倒映的五重塔（會跟著水波晃）
function drawReflection(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const { cx, cy, rx, ry } = NR.pond;
  c.save();
  c.beginPath();
  c.ellipse(cx * T, cy * T, rx * T - 1, ry * T - 1, 0, 0, Math.PI * 2);
  c.clip();
  const top = (cy - ry) * T;
  c.globalAlpha = d.night ? 0.45 : 0.32;
  c.translate(0, top);
  c.scale(1, -0.62);
  blit(c, pagodaSprite(), NR.pagoda.x * T - PG_W / 2 + 6, 0);
  c.restore();
  c.save();
  c.beginPath();
  c.ellipse(cx * T, cy * T, rx * T - 1, ry * T - 1, 0, 0, Math.PI * 2);
  c.clip();
  // 水波
  for (let i = 0; i < 26; i += 1) {
    const yy = (cy - ry) * T + 3 + ((i * 29) % 89) / 89 * (ry * 2 * T - 6);
    const xx = (cx - rx) * T + ((i * 97 + d.seconds * (4 + (i % 3) * 2)) % (rx * 2 * T + 20)) - 10;
    px(c, `rgba(220,240,235,${0.22 + 0.15 * Math.sin(d.seconds * 1.2 + i)})`, Math.round(xx), Math.round(yy), 6 + (i % 3) * 3, 1);
  }
  if (d.night) {
    // 月亮的倒影（猿澤池月是南都八景之一）
    glow(c, 4 * T, (cy + 0.6) * T, 14, '255, 245, 200', 0.5);
    px(c, 'rgba(255,248,210,0.8)', 4 * T - 4, Math.round((cy + 0.6) * T), 8, 2);
  }
  c.restore();
}

// 池邊的烏龜（偶爾伸頭）
function drawTurtles(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = Math.round(12.4 * T);
  const y = Math.round(27.6 * T);
  if (Math.sin(d.seconds * 0.7) > 0.3) px(c, '#5a6a42', x - 8, y - 4, 2, 1);
  if (Math.sin(d.seconds * 0.5 + 2) > 0.2) px(c, '#5a6a42', x + 6, y - 3, 2, 1);
}

// ── 春日大社：朱紅的南門（樓門）、兩邊的迴廊（白牆、綠色連子窗、釣燈籠）──
const KS_W = (NR.kasuga.x1 - NR.kasuga.x0) * T;
const KS_H = 92;
function kasugaSprite(): HTMLCanvasElement {
  const w = KS_W;
  const h = KS_H;
  return cached('nr-kasuga', w, h, (c) => {
    const cx = w / 2;
    // 迴廊
    for (const [x0, x1] of [
      [0, cx - 32],
      [cx + 32, w],
    ] as const) {
      px(c, '#9a948a', x0, h - 4, x1 - x0, 4);
      px(c, PLASTER, x0, h - 30, x1 - x0, 26);
      for (let x = x0 + 4; x < x1 - 8; x += 18) {
        px(c, '#2f7a5a', x + 3, h - 24, 10, 10);
        for (let k = 1; k < 10; k += 2) px(c, '#5aa47a', x + 3 + k, h - 24, 1, 10);
      }
      for (let x = x0; x <= x1 - 3; x += 18) px(c, VERMILION, x, h - 32, 3, 28);
      px(c, VERMILION, x0, h - 32, x1 - x0, 3);
      px(c, VERMILION_DARK, x0, h - 14, x1 - x0, 2);
      // 檜皮葺的屋頂
      px(c, '#6a5a4a', x0, h - 40, x1 - x0, 8);
      px(c, '#82705c', x0, h - 40, x1 - x0, 2);
      px(c, '#4a3e32', x0, h - 33, x1 - x0, 1);
    }
    // 樓門：兩層、朱紅
    px(c, '#9a948a', cx - 34, h - 5, 68, 5);
    px(c, VERMILION, cx - 28, h - 44, 56, 39);
    px(c, '#1e140e', cx - 12, h - 40, 24, 35);
    px(c, PLASTER, cx - 24, h - 38, 8, 20);
    px(c, PLASTER, cx + 16, h - 38, 8, 20);
    for (const x of [cx - 28, cx - 15, cx + 12, cx + 25]) px(c, VERMILION_DARK, x, h - 44, 3, 39);
    eave(c, cx, h - 58, 76, 14, '#6a5a4a', 0.8, 4);
    px(c, VERMILION, cx - 22, h - 72, 44, 14);
    px(c, PLASTER, cx - 18, h - 69, 36, 8);
    for (let x = cx - 18; x < cx + 18; x += 4) px(c, VERMILION_DARK, x, h - 69, 1, 8);
    eave(c, cx, h - 90, 82, 20, '#6a5a4a', 0.45, 5);
    px(c, '#4a3e32', cx - 19, h - 92, 38, 3);
    px(c, '#1e1a16', cx - 7, h - 56, 14, 8);
    text(c, '春日', cx, h - 52, GOLD_LIGHT, `900 5px ${SERIF_TC}`);
  });
}
// 迴廊屋簷下的釣燈籠（青銅、晚上亮）
function drawKasuga(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = NR.kasuga.x0 * T;
  const by = NR.kasuga.line * T;
  blit(c, kasugaSprite(), x0, by);
  const cx = x0 + KS_W / 2;
  for (const dx of [-62, -44, 44, 62]) {
    const x = Math.round(cx + dx);
    const y = by - 31;
    px(c, '#3a3a2a', x, y, 1, 3);
    px(c, '#7a7a4a', x - 3, y + 3, 7, 2);
    px(c, d.night ? '#ffe08a' : '#5a6a46', x - 2, y + 5, 5, 6);
    px(c, '#7a7a4a', x - 3, y + 11, 7, 1);
    if (d.night) glow(c, x, y + 8, 10, '255, 210, 130', 0.5);
  }
}

// 鹿みくじ的台子：木頭的小鹿嘴裡叼著籤
function drawOmikujiStand(c: CanvasRenderingContext2D): void {
  const cx = Math.round(45.4 * T);
  const by = Math.round(14.3 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 12, by, 24, 2);
  px(c, '#8a5a32', cx - 12, by - 10, 24, 3);
  px(c, '#6b4428', cx - 11, by - 7, 2, 7);
  px(c, '#6b4428', cx + 9, by - 7, 2, 7);
  for (let k = 0; k < 4; k += 1) {
    const x = cx - 10 + k * 6;
    px(c, '#c98a4a', x, by - 15, 4, 5);
    px(c, '#c98a4a', x + 3, by - 18, 2, 3);
    px(c, '#f4efe2', x + 4, by - 16, 2, 1);
    px(c, '#2a1a14', x + 3, by - 17, 1, 1);
  }
  px(c, VERMILION, cx - 14, by - 26, 28, 7);
  text(c, '鹿みくじ', cx, by - 22.5, '#ffffff', `900 5px ${FONT_TC}`);
}

// 春日大社的石燈籠（長青苔，晚上點燈）
function drawKasugaLantern(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const r = seeded(Math.round(x * 31 + y * 7));
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by - 1, 12, 3);
  px(c, '#8f8a7e', cx - 6, by - 4, 12, 4);
  px(c, '#a8a294', cx - 2, by - 18, 4, 14);
  px(c, '#8f8a7e', cx - 3, by - 12, 6, 1);
  px(c, '#a8a294', cx - 6, by - 21, 12, 3);
  px(c, '#9a958a', cx - 4, by - 28, 8, 7);
  px(c, night ? '#ffd27a' : '#3e3a34', cx - 2, by - 27, 4, 4);
  c.fillStyle = '#8a857a';
  c.beginPath();
  c.moveTo(cx - 9, by - 27);
  c.quadraticCurveTo(cx - 3, by - 30, cx, by - 34);
  c.quadraticCurveTo(cx + 3, by - 30, cx + 9, by - 27);
  c.closePath();
  c.fill();
  px(c, '#9a958a', cx - 1, by - 37, 3, 3);
  for (let k = 0; k < 5; k += 1) px(c, 'rgba(96,140,72,0.75)', Math.round(cx - 7 + r() * 13), Math.round(by - 33 + r() * 30), 2, 1);
  if (night) glow(c, cx, by - 25, 16, '255, 200, 110', 0.6);
}

// 一之鳥居（朱紅）
function drawTorii(c: CanvasRenderingContext2D, x0t: number, x1t: number, y: number): void {
  const x0 = Math.round(x0t * T);
  const x1 = Math.round(x1t * T);
  const by = Math.round(y * T);
  const hgt = 56;
  for (const x of [x0, x1 - 5]) {
    px(c, 'rgba(0,0,0,0.25)', x - 1, by, 7, 2);
    px(c, VERMILION, x, by - hgt, 5, hgt);
    px(c, 'rgba(255,255,255,0.2)', x, by - hgt, 1, hgt);
    px(c, '#1f1a18', x - 1, by - 5, 7, 5);
  }
  px(c, VERMILION, x0 - 3, by - hgt + 8, x1 - x0 + 6, 4);
  px(c, '#2a1a18', x0 - 7, by - hgt - 3, x1 - x0 + 14, 4);
  px(c, VERMILION, x0 - 5, by - hgt + 1, x1 - x0 + 10, 3);
  px(c, '#1f1a18', (x0 + x1) / 2 - 6, by - hgt + 1, 12, 8);
  px(c, GOLD, (x0 + x1) / 2 - 5, by - hgt + 2, 10, 6);
}

// 杉樹（春日山的原始林）
function drawCedar(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  px(c, '#5a3a24', cx - 2, by - 12, 4, 12);
  for (const [w, top, col] of [
    [22, 40, '#2e5232'],
    [18, 50, '#355e3a'],
    [13, 58, '#3f6c42'],
  ] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(cx - w / 2, by - 10 - (top - 40) * 0.6);
    c.lineTo(cx, by - top - 4);
    c.lineTo(cx + w / 2, by - 10 - (top - 40) * 0.6);
    c.closePath();
    c.fill();
  }
}

// 松樹（雲朵一樣一層層的枝葉）
function drawPine(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 12, by - 1, 24, 3);
  px(c, '#6a4a30', cx - 2, by - 22, 4, 22);
  px(c, '#6a4a30', cx + 1, by - 30, 3, 9);
  px(c, '#6a4a30', cx - 6, by - 20, 5, 2);
  for (const [dx, dy, rw, rh] of [
    [-8, -22, 9, 4],
    [7, -27, 10, 4],
    [-2, -34, 9, 4],
    [4, -18, 7, 3],
  ] as const) {
    c.fillStyle = '#2f5a34';
    c.beginPath();
    c.ellipse(cx + dx, by + dy, rw, rh, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3f7044';
    c.beginPath();
    c.ellipse(cx + dx, by + dy - 1, rw - 2, rh - 2, 0, 0, Math.PI * 2);
    c.fill();
  }
}

// ── 茶屋（參道旁）：瓦屋頂、白暖簾、「葛餅」的旗子、紅燈籠 ──
const TH_W = (NR.teahouse.x1 - NR.teahouse.x0) * T;
function teahouseSprite(): HTMLCanvasElement {
  const w = TH_W;
  const h = 66;
  return cached('nr-teahouse', w, h, (c) => {
    eave(c, w / 2, 2, w - 6, 16, TILE, 0.7, 3);
    px(c, PLASTER, 4, 18, w - 8, 14);
    px(c, WOOD, 4, 18, w - 8, 2);
    for (let x = 4; x <= w - 8; x += 28) px(c, WOOD, x, 18, 4, h - 18);
    // 招牌
    px(c, '#c99a62', w / 2 - 22, 20, 44, 10);
    px(c, '#8a5a32', w / 2 - 22, 20, 44, 1);
    text(c, '茶屋', w / 2, 25.5, '#3a2414', `900 7px ${SERIF_TC}`);
    // 小屋簷、店裡（開著）
    px(c, TILE, 0, 32, w, 4);
    px(c, TILE_DARK, 0, 35, w, 1);
    px(c, '#4a3222', 6, 36, w - 12, h - 36);
    px(c, '#e8d8b0', 10, 46, w - 20, 8);
    px(c, '#c98a4a', 14, 44, 10, 2);
    px(c, '#f4efe2', 28, 43, 6, 3);
    px(c, '#8a9a5a', w - 34, 44, 8, 2);
    px(c, '#d23a2a', 10, h - 8, w - 20, 3);
    // 白暖簾
    px(c, '#f4efe2', w / 2 - 20, 36, 40, 11);
    for (let k = w / 2 - 12; k < w / 2 + 20; k += 8) px(c, 'rgba(0,0,0,0.18)', k, 38, 1, 9);
    text(c, 'くず餅', w / 2, 41.5, '#2a3a5a', `900 6px ${SERIF_TC}`);
    px(c, '#9a948a', 2, h - 3, w - 4, 3);
  });
}
function drawTeahouse(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = NR.teahouse.x0 * T;
  const by = NR.teahouse.line * T;
  blit(c, teahouseSprite(), x0, by);
  drawLantern(c, x0 + 10, by - 30, '#e8402e', d.night);
  drawLantern(c, x0 + TH_W - 10, by - 30, '#e8402e', d.night);
  // 葛餅的のぼり旗（會隨風飄）
  const fx = Math.round(x0 - 8);
  px(c, '#6b4428', fx, by - 44, 2, 44);
  const sway = Math.round(Math.sin(d.seconds * 1.6) * 1);
  px(c, '#f4efe2', fx + 2 + sway, by - 42, 9, 30);
  px(c, '#c8282e', fx + 2 + sway, by - 42, 9, 3);
  px(c, '#c8282e', fx + 2 + sway, by - 15, 9, 3);
  for (const [k, ch] of ['葛', '餅'].entries()) text(c, ch, fx + 6.5 + sway, by - 33 + k * 9, '#c8282e', `900 7px ${SERIF_TC}`);
}

// 野點傘（紅傘）：撐在緣台後面
function drawUmbrella(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(TEA_BENCH_Y * T);
  px(c, '#6b4428', cx - 1, by - 44, 2, 44);
  c.fillStyle = '#d23a2a';
  c.beginPath();
  c.moveTo(cx - 28, by - 36);
  c.quadraticCurveTo(cx, by - 56, cx + 28, by - 36);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.22)';
  c.lineWidth = 1;
  for (let k = -2; k <= 2; k += 1) {
    c.beginPath();
    c.moveTo(cx, by - 49);
    c.lineTo(cx + k * 13, by - 36);
    c.stroke();
  }
  px(c, '#2a1a14', cx - 1, by - 51, 2, 3);
}

// ── 鹿仙貝的攤子：木頭台子上一疊疊用紙帶綁好的仙貝 ──
function drawSenbeiStall(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(NR.cart.x * T);
  const by = Math.round(NR.cart.y * T);
  const w = 40;
  const x0 = cx - w / 2;
  px(c, 'rgba(0,0,0,0.22)', x0, by, w, 3);
  const owner = getAvatarFrame(lookColors(2, 6, { body: 1 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - owner.width / 2), by - 10 - owner.height + 6);
  // 綠色的小屋頂
  px(c, '#6b4428', x0 + 2, by - 32, 2, 32);
  px(c, '#6b4428', x0 + w - 4, by - 32, 2, 32);
  px(c, '#2f6a4a', x0 - 3, by - 37, w + 6, 6);
  px(c, '#3f8a5e', x0 - 3, by - 37, w + 6, 1);
  px(c, '#f4efe2', x0 + 6, by - 30, w - 12, 7);
  text(c, '鹿せんべい', cx, by - 26.5, '#2f6a4a', `900 5px ${FONT_TC}`);
  // 台子、仙貝
  px(c, '#8a5a32', x0, by - 12, w, 4);
  px(c, '#a8703f', x0, by - 12, w, 1);
  px(c, '#6b4428', x0, by - 8, w, 8);
  for (let k = 0; k < 5; k += 1) {
    const sx = x0 + 4 + k * 7;
    for (let j = 0; j < 3; j += 1) px(c, j % 2 ? '#c99a52' : '#d9b070', sx, by - 15 - j * 2, 6, 2);
    px(c, '#f4efe2', sx + 2, by - 19, 2, 6);
  }
  // 「鹿せんべい 200 円」的小牌子會晃
  const sw = Math.round(Math.sin(d.seconds * 1.1) * 1);
  px(c, '#f4efe2', x0 + 10 + sw, by - 6, 20, 5);
  text(c, '200円', x0 + 20 + sw, by - 3.5, '#6b4428', `900 4px ${FONT_TC}`);
}

// ── 鹿：用時間算位置（每個人看到的一樣）。慢慢走 → 低頭吃草 → 有的抬頭對人鞠躬 ──
interface DeerDef {
  x: number;
  y: number;
  rx: number;
  ry: number;
  kind: 'buck' | 'doe' | 'fawn';
  bow: number;
}
const DEER: DeerDef[] = [
  // 大佛殿前
  { x: 15.5, y: 13.2, rx: 2.4, ry: 0.6, kind: 'doe', bow: 0.3 },
  { x: 19.4, y: 15, rx: 1.8, ry: 0.4, kind: 'buck', bow: 0.3 },
  { x: 30.5, y: 13.4, rx: 2.4, ry: 0.6, kind: 'doe', bow: 0.3 },
  { x: 34, y: 15.2, rx: 1.6, ry: 0.4, kind: 'fawn', bow: 0.2 },
  // 興福寺
  { x: 3, y: 14, rx: 2, ry: 1, kind: 'doe', bow: 0.3 },
  { x: 10.4, y: 17.6, rx: 1.4, ry: 0.8, kind: 'buck', bow: 0.3 },
  { x: 4.5, y: 17.8, rx: 1.6, ry: 0.5, kind: 'fawn', bow: 0.2 },
  // 奈良公園（攤子旁邊的最愛鞠躬）
  { x: 17, y: 21.4, rx: 1.8, ry: 0.6, kind: 'doe', bow: 0.4 },
  { x: 20.6, y: 27.4, rx: 2.2, ry: 0.8, kind: 'buck', bow: 0.5 },
  { x: 27.8, y: 21.6, rx: 1.4, ry: 0.6, kind: 'doe', bow: 0.5 },
  { x: 28.6, y: 27.6, rx: 2.4, ry: 0.8, kind: 'doe', bow: 0.5 },
  { x: 32.8, y: 22.4, rx: 0.6, ry: 0.4, kind: 'doe', bow: 0.85 },
  { x: 36.6, y: 23.4, rx: 0.8, ry: 0.4, kind: 'buck', bow: 0.85 },
  { x: 31.6, y: 17.6, rx: 1.4, ry: 0.4, kind: 'fawn', bow: 0.4 },
  { x: 35.8, y: 28, rx: 1.6, ry: 0.8, kind: 'doe', bow: 0.4 },
  { x: 17.4, y: 29.3, rx: 1, ry: 0.4, kind: 'fawn', bow: 0.3 },
  // 春日大社這邊
  { x: 40.4, y: 17.4, rx: 1.8, ry: 1.2, kind: 'buck', bow: 0.3 },
  { x: 43.4, y: 28, rx: 2.2, ry: 0.8, kind: 'doe', bow: 0.5 },
  { x: 39.4, y: 13.4, rx: 1.4, ry: 0.6, kind: 'fawn', bow: 0.3 },
];

const hash = (a: number, b: number): number => {
  const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return v - Math.floor(v);
};

function deerAt(i: number, def: DeerDef, seconds: number): { x: number; y: number; face: 1 | -1; step: number; moving: boolean; dip: number } {
  const P = 13 + (i % 5) * 2.3;
  const t = seconds + i * 7.31;
  const k = Math.floor(t / P);
  const f = t / P - k;
  const wp = (n: number) => ({ x: def.x + (hash(i, n) * 2 - 1) * def.rx, y: def.y + (hash(i + 50, n) * 2 - 1) * def.ry });
  const a = wp(k);
  const b = wp(k + 1);
  const face: 1 | -1 = b.x >= a.x ? 1 : -1;
  if (f < 0.3) {
    const e = f / 0.3;
    const s = e * e * (3 - 2 * e);
    return { x: a.x + (b.x - a.x) * s, y: a.y + (b.y - a.y) * s, face, step: Math.floor(t * 5) % 2, moving: true, dip: 0.1 };
  }
  const rest = (f - 0.3) / 0.7;
  if (rest < 0.55) return { x: b.x, y: b.y, face, step: 0, moving: false, dip: 0.9 + 0.1 * Math.sin(t * 5) };
  if (hash(i + 99, k) < def.bow) {
    // 鞠躬：點頭三下（轉過來面向畫面左右其中一邊）
    const q = (rest - 0.55) / 0.45;
    const bowFace: 1 | -1 = hash(i + 7, k) < 0.5 ? 1 : -1;
    return { x: b.x, y: b.y, face: bowFace, step: 0, moving: false, dip: 0.5 * Math.max(0, Math.sin(q * Math.PI * 3)) };
  }
  return { x: b.x, y: b.y, face, step: 0, moving: false, dip: Math.sin(t * 0.9) > 0.85 ? 0.1 : 0 };
}

function drawDeer(c: CanvasRenderingContext2D, x: number, y: number, face: 1 | -1, kind: DeerDef['kind'], step: number, moving: boolean, dip: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T + 4);
  const s = kind === 'fawn' ? 0.72 : 1;
  const m = (dx: number, dy: number, w: number, h: number, col: string) => {
    const w2 = Math.max(1, Math.round(w * s));
    const h2 = Math.max(1, Math.round(h * s));
    const X = Math.round(dx * s);
    px(c, col, face > 0 ? cx + X : cx - X - w2, by + Math.round(dy * s), w2, h2);
  };
  const BODY = kind === 'buck' ? '#9a6436' : '#a8743e';
  const BACK = kind === 'buck' ? '#7a4a26' : '#8a5a2e';
  const BELLY = '#d8b080';
  const LEG = '#7a4e2a';
  m(-8, -1, 17, 2, 'rgba(0,0,0,0.2)');
  // 腳（走路時前後交替）
  const a = moving ? (step ? 1 : -1) : 0;
  for (const [lx, off] of [
    [-6, a],
    [-4, -a],
    [4, -a],
    [6, a],
  ] as const) {
    m(lx + off, -7, 1, 6, LEG);
    m(lx + off, -1, 1, 1, '#2a1a14');
  }
  // 身體、背、肚子、白屁股、尾巴
  m(-7, -13, 14, 6, BODY);
  m(-6, -14, 12, 1, BACK);
  m(-6, -8, 11, 1, BELLY);
  m(-8, -13, 2, 4, '#f4efe2');
  m(-9, -14, 1, 3, '#f4efe2');
  m(-9, -14, 1, 1, '#2a1a14');
  if (kind === 'fawn') for (const [sx, sy] of [[-4, -12], [-1, -11], [2, -12], [-2, -13], [4, -11]] as const) m(sx, sy, 1, 1, '#f4efe2');
  // 脖子、頭（dip 0 = 抬頭、1 = 低頭吃草）
  const hx = 6 + dip * 3;
  const hy = -20 + dip * 15;
  for (let k = 0; k <= 3; k += 1) {
    const t = k / 3;
    m(4 + (hx - 4) * t, -13 + (hy + 2 + 13) * t, 3, 3, BODY);
  }
  m(hx, hy, 4, 4, BODY);
  m(hx + 4, hy + 1, 2, 3, BELLY);
  m(hx + 5, hy + 1, 1, 1, '#2a1a14');
  m(hx + 2, hy + 1, 1, 1, '#1a1410');
  m(hx - 2, hy - 1, 2, 2, BODY);
  m(hx - 2, hy - 1, 1, 1, '#f4d6b0');
  if (kind === 'buck') {
    m(hx, hy - 5, 1, 5, '#e0d0a8');
    m(hx - 2, hy - 6, 3, 1, '#e0d0a8');
    m(hx + 2, hy - 4, 1, 4, '#e0d0a8');
    m(hx + 3, hy - 6, 1, 2, '#e0d0a8');
  }
}

// ── 南邊的町家（柿葉壽司、奈良漬、墨、伴手禮、茶、旅館）──
type RowKind = (typeof SOUTH_ROW)[number]['kind'];
function machiyaSprite(kind: RowKind, w: number): HTMLCanvasElement {
  const h = kind === 'ryokan' ? 76 : 64;
  return cached(`nr-machiya-${kind}`, w, h, (c) => {
    const wall = kind === 'ryokan' ? '#ece4d2' : PLASTER;
    eave(c, w / 2, 2, w - 4, 12, TILE, 0.7, 2);
    const upper = kind === 'ryokan' ? 26 : 16;
    px(c, wall, 2, 14, w - 4, upper);
    if (kind === 'ryokan') {
      for (let x = 8; x + 14 <= w - 6; x += 20) {
        px(c, '#5a4636', x - 1, 17, 14, 10);
        px(c, '#f4e6c0', x, 18, 12, 8);
        px(c, '#5a4636', x + 6, 18, 1, 8);
      }
    } else {
      for (let x = 8; x + 16 <= w - 6; x += 22) {
        px(c, '#3a2a20', x, 18, 16, 7);
        for (let k = 1; k < 16; k += 3) px(c, wall, x + k, 18, 1, 7);
      }
    }
    const eaveY = 14 + upper;
    px(c, TILE, 0, eaveY, w, 5);
    px(c, TILE_DARK, 0, eaveY + 4, w, 1);
    px(c, WOOD, 2, eaveY + 5, w - 4, h - eaveY - 5);
    for (let x = 4; x < w - 4; x += 3) px(c, '#7a5032', x, eaveY + 7, 1, h - eaveY - 11);
    // 店門口、暖簾
    const dw = Math.min(26, w - 16);
    const dx = Math.round(w / 2 - dw / 2);
    if (kind !== 'house') {
      const noren = { narazuke: '#5a3a22', sumi: '#1f2a44', kakinoha: '#2f5d3a', omiyage: '#8a2a2a', tea: '#2f5d3a', ryokan: '#3a3a5a' }[kind];
      const mark = { narazuke: '奈良漬', sumi: '墨', kakinoha: '柿の葉', omiyage: '鹿', tea: '茶', ryokan: '宿' }[kind];
      px(c, '#2a1a14', dx, eaveY + 7, dw, h - eaveY - 9);
      px(c, '#f6dfae', dx + 3, eaveY + 18, dw - 6, h - eaveY - 22);
      px(c, noren, dx, eaveY + 7, dw, 11);
      for (let k = dx + 6; k < dx + dw; k += 6) px(c, 'rgba(0,0,0,0.3)', k, eaveY + 9, 1, 9);
      text(c, mark, w / 2, eaveY + 12.5, '#f4efe2', `900 ${mark.length > 2 ? 5 : 6}px ${SERIF_TC}`);
      const sign = { narazuke: '奈良漬', sumi: '奈良墨・筆', kakinoha: '柿の葉すし', omiyage: '鹿みやげ', tea: '大和茶', ryokan: '旅館' }[kind];
      const sw = sign.length * 7 + 8;
      px(c, '#c99a62', w / 2 - sw / 2, eaveY - 11, sw, 9);
      px(c, '#8a5a32', w / 2 - sw / 2, eaveY - 11, sw, 1);
      text(c, sign, w / 2, eaveY - 6.5, '#3a2414', `900 6px ${SERIF_TC}`);
    }
    if (kind === 'kakinoha') {
      // 門口的柿子葉樣品、木牌
      px(c, '#6b4428', 4, h - 20, 12, 16);
      for (let k = 0; k < 3; k += 1) px(c, k % 2 ? '#4f8a3c' : '#6aa04e', 6 + k * 3, h - 17, 3, 5);
      px(c, '#f4efe2', w - 16, h - 22, 10, 18);
      text(c, '鯖', w - 11, h - 13, '#2f5d3a', `900 6px ${SERIF_TC}`);
    }
    if (kind === 'omiyage') {
      // 門口的小鹿玩偶
      for (let k = 0; k < 2; k += 1) {
        px(c, '#c98a4a', 5 + k * 6, h - 12, 5, 4);
        px(c, '#c98a4a', 8 + k * 6, h - 15, 2, 3);
      }
    }
    px(c, '#9a948a', 2, h - 3, w - 4, 3);
  });
}

// ── JR 奈良站：舊站舍（1934 年，寺廟式的寶形造屋頂＋相輪），兩邊是現在的站房，後面是高架月台 ──
const ST_W = (NR.station.x1 - NR.station.x0) * T;
const ST_H = 104;
function stationSprite(): HTMLCanvasElement {
  const w = ST_W;
  const h = ST_H;
  return cached('nr-station', w, h, (c) => {
    const cx = w / 2;
    // 兩邊現在的站房（白色、玻璃）
    for (const [x0, x1] of [
      [0, cx - 54],
      [cx + 54, w],
    ] as const) {
      px(c, '#e6e8ec', x0, h - 50, x1 - x0, 50);
      px(c, '#c9ccd2', x0, h - 50, x1 - x0, 3);
      for (let y = h - 44; y < h - 18; y += 8) for (let x = x0 + 4; x < x1 - 6; x += 9) px(c, '#6b8ca6', x, y, 7, 5);
      px(c, '#2a3a4a', x0 + 4, h - 16, x1 - x0 - 8, 16);
      for (let x = x0 + 6; x < x1 - 10; x += 12) px(c, '#9fd8ff', x, h - 14, 9, 13);
    }
    // 舊站舍：奶油色牆、咖啡色木框、直長的窗
    px(c, '#efe4c8', cx - 50, h - 46, 100, 46);
    px(c, '#7a5032', cx - 50, h - 46, 100, 3);
    px(c, '#7a5032', cx - 50, h - 24, 100, 2);
    for (const x of [cx - 50, cx - 26, cx + 23, cx + 47]) px(c, '#7a5032', x, h - 46, 3, 46);
    for (const x of [cx - 44, cx - 36, cx + 30, cx + 38]) {
      px(c, '#3a4a5a', x, h - 40, 5, 12);
      px(c, '#9fc0d0', x + 1, h - 39, 3, 10);
      px(c, '#3a4a5a', x, h - 20, 5, 14);
      px(c, '#9fc0d0', x + 1, h - 19, 3, 12);
    }
    // 正面入口的小屋簷、玻璃門
    px(c, '#2a3a4a', cx - 18, h - 20, 36, 20);
    for (let x = cx - 16; x < cx + 16; x += 8) px(c, '#9fd8ff', x, h - 18, 6, 18);
    eave(c, cx, h - 28, 48, 8, TILE, 0.8, 3);
    // 站名
    px(c, '#f4f6f8', cx - 22, h - 42, 44, 10);
    px(c, '#1a8c3a', cx - 21, h - 41, 10, 8);
    text(c, 'JR', cx - 16, h - 37, '#ffffff', `900 5px ${FONT_TC}`);
    text(c, '奈良駅', cx + 5, h - 37, '#1f2a44', `900 7px ${SERIF_TC}`);
    // 寶形造的大屋頂（四邊往中間收）＋相輪
    eave(c, cx, h - 84, 120, 40, TILE, 0.1, 5);
    px(c, TILE_DARK, cx - 4, h - 86, 8, 3);
    px(c, '#45403c', cx - 4, h - 89, 8, 3);
    px(c, '#6a5a3a', cx - 1, h - 104, 3, 16);
    for (let k = 0; k < 5; k += 1) px(c, '#8a7a4a', cx - 3, h - 92 - k * 3, 7, 1);
    px(c, '#a8964e', cx - 2, h - 104, 5, 3);
    // 屋頂上的老虎窗
    px(c, '#efe4c8', cx - 7, h - 62, 14, 8);
    px(c, '#3a4a5a', cx - 4, h - 60, 8, 6);
  });
}
// 後面的高架月台、開過去的電車
function drawViaduct(c: CanvasRenderingContext2D): void {
  const x0 = NR.station.x0 * T - 24;
  const w = ST_W + 48;
  const by = NR.rowLine * T;
  px(c, '#9aa0a8', x0, by - 70, w, 6);
  px(c, '#c9ccd2', x0, by - 70, w, 1);
  for (let x = x0 + 6; x < x0 + w; x += 36) px(c, '#8a909a', x, by - 64, 6, 20);
}
function drawJrTrain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = NR.station.x0 * T - 24;
  const w = ST_W + 48;
  const top = NR.rowLine * T - 86;
  const cycle = 20;
  const t = d.seconds % cycle;
  if (t > 11) return;
  const len = 156;
  const dir = Math.floor(d.seconds / cycle) % 2 ? 1 : -1;
  const p = (t / 11) * (w + len);
  const x = dir > 0 ? x0 - len + p : x0 + w - p;
  c.save();
  c.beginPath();
  c.rect(x0, top, w, 18);
  c.clip();
  for (let k = 0; k < 3; k += 1) {
    const cx = x + k * 52;
    px(c, '#d6d9de', cx, top + 3, 48, 13);
    px(c, '#c8702a', cx, top + 11, 48, 2);
    for (let wx = cx + 4; wx < cx + 44; wx += 8) px(c, d.night ? '#ffe9a8' : '#3a4a5a', wx, top + 5, 5, 4);
  }
  c.restore();
}

// ── 座位 ──
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = NARA_SEATS[i];
  if (!s) return;
  if (i >= 4 && i < 8) {
    // 緣台（紅毛氈的長凳）
    const x = Math.round(s.x * T);
    const y = Math.round(s.y * T);
    px(c, 'rgba(0,0,0,0.2)', x - 10, y + 1, 20, 2);
    px(c, '#d23a2a', x - 10, y - 5, 20, 4);
    px(c, '#e8584a', x - 10, y - 5, 20, 1);
    px(c, '#6b4428', x - 9, y - 1, 2, 3);
    px(c, '#6b4428', x + 7, y - 1, 2, 3);
  }
}

const LAMPS: [number, number][] = [[1.6, 31.2], [17.6, 31.2], [30, 31.2], [41.4, 31.2], [53.6, 31.2], [3, 41.6], [19.4, 41.4], [34.8, 41.4], [53.6, 41.6]];
const PINES: [number, number][] = [[13.6, 12.4], [35.4, 12.6], [38.8, 15.6], [14.4, 21.2], [37.6, 19.6], [37.2, 29.6], [21.6, 30.2], [27.2, 30.2]];
const WILLOWS: [number, number][] = [[1.8, 22.8], [15.6, 24.2], [16, 29.4]];
const MAPLES: [number, number][] = [[11.4, 21.4], [1.4, 11.8], [9.4, 11.6]];
const CEDARS: [number, number][] = [];
for (let y = 12.4; y < 30.6; y += 1.5) {
  CEDARS.push([52.2 + ((y * 10) % 3 > 1.5 ? 0.4 : 0), y]);
  CEDARS.push([54.6 - ((y * 10) % 3 > 1.5 ? 0.4 : 0), y + 0.7]);
}
// 參道兩邊的石燈籠
const SANDO_LANTERNS: [number, number][] = [];
for (let y = 15.8; y < 29.8; y += 1.3) {
  SANDO_LANTERNS.push([NR.sando.x0 - 0.35, y]);
  SANDO_LANTERNS.push([NR.sando.x1 + 0.35, y]);
}

const props: CityProp[] = [
  { y: 0.1, draw: (c, d) => drawReflection(c, d) },
  { y: NR.daibutsu.line, draw: (c, d) => drawDaibutsuden(c, d) },
  { y: 11.6, draw: (c, d) => drawOctLantern(c, d) },
  { y: NR.nandaimon.line, draw: (c) => blit(c, nandaimonSprite(), NR.nandaimon.x0 * T - NM_PAD, NR.nandaimon.line * T) },
  ...NR.walls.map(([x0, x1]): CityProp => ({ y: NR.nandaimon.line - 0.02, draw: (c) => drawEarthWall(c, x0, x1, NR.nandaimon.line - 0.1) })),
  { y: NR.pagoda.line, draw: (c, d) => drawPagoda(c, d) },
  { y: 27.6, draw: (c, d) => drawTurtles(c, d) },
  { y: NR.kasuga.line, draw: (c, d) => drawKasuga(c, d) },
  { y: 14.3, draw: (c) => drawOmikujiStand(c) },
  ...SANDO_LANTERNS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawKasugaLantern(c, x, y, d.night) })),
  { y: NR.walk - 0.2, draw: (c) => drawTorii(c, NR.sando.x0 - 0.9, NR.sando.x1 + 0.9, NR.walk - 0.2) },
  { y: NR.teahouse.line, draw: (c, d) => drawTeahouse(c, d) },
  ...TEA_BENCHES.map((x): CityProp => ({ y: TEA_BENCH_Y + 0.05, draw: (c) => drawUmbrella(c, x) })),
  { y: NR.cart.y, draw: (c, d) => drawSenbeiStall(c, d) },
  ...PARK_BENCHES.map((x): CityProp => ({ y: PARK_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, PARK_BENCH_Y, 2.6) })),
  ...POND_BENCHES.map((x): CityProp => ({ y: POND_BENCH_Y - 0.01, draw: (c) => drawStoneBench(c, x, POND_BENCH_Y, 2.6) })),
  ...DEER.map((def, i): CityProp => ({
    y: def.y + 0.3,
    draw: (c, d) => {
      const st = deerAt(i, def, d.seconds);
      drawDeer(c, st.x, st.y, st.face, def.kind, st.step, st.moving, st.dip);
    },
  })),
  ...SOUTH_ROW.map((b): CityProp => ({ y: NR.rowLine, draw: (c) => blit(c, machiyaSprite(b.kind, Math.round((b.x1 - b.x0) * T)), b.x0 * T, NR.rowLine * T) })),
  ...SOUTH_ROW.filter((b) => b.kind !== 'house' && b.kind !== 'ryokan').map((b): CityProp => ({ y: NR.rowLine + 0.01, draw: (c, d) => {
    drawLantern(c, b.x0 * T + 7, NR.rowLine * T - 30, '#f4efe2', d.night);
  } })),
  { y: NR.rowLine - 0.03, draw: (c) => drawViaduct(c) },
  { y: NR.rowLine - 0.02, draw: (c, d) => drawJrTrain(c, d) },
  { y: NR.rowLine, draw: (c) => blit(c, stationSprite(), NR.station.x0 * T, NR.rowLine * T) },
  ...PINES.map(([x, y]): CityProp => ({ y, draw: (c) => drawPine(c, x, y) })),
  ...WILLOWS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawWillow(c, x, y, d.seconds) })),
  ...MAPLES.map(([x, y]): CityProp => ({ y, draw: (c) => drawMaple(c, x, y) })),
  ...CEDARS.map(([x, y]): CityProp => ({ y, draw: (c) => drawCedar(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const NM = NR.nandaimon;
const solid: Rect[] = [
  r(0, 0, NR.W, 10.7),
  r(NR.axis - 0.55, 11.1, NR.axis + 0.55, 11.65),
  // 南大門：兩邊的仁王像那兩間擋住，中間三間走得過
  r(NM.x0 - 0.2, NM.line - 0.4, NM.x0 + 1.55, NM.line),
  r(NM.x1 - 1.55, NM.line - 0.4, NM.x1 + 0.2, NM.line),
  ...NR.walls.map(([x0, x1]) => r(x0, NM.line - 0.45, x1, NM.line)),
  r(NR.pagoda.x - 1.7, NR.pagoda.line - 0.7, NR.pagoda.x + 1.7, NR.pagoda.line),
  r(NR.kasuga.x0, 10.6, NR.kasuga.x1, NR.kasuga.line - 0.1),
  r(44.6, 13.8, 46.2, 14.3),
  ...SANDO_LANTERNS.map(([x, y]) => r(x - 0.35, y - 0.25, x + 0.35, y)),
  r(NR.sando.x0 - 1, NR.walk - 0.5, NR.sando.x0 - 0.5, NR.walk - 0.2),
  r(NR.sando.x1 + 0.5, NR.walk - 0.5, NR.sando.x1 + 1, NR.walk - 0.2),
  r(NR.forestX, 10.6, NR.W, NR.walk - 0.1),
  r(NR.teahouse.x0, NR.teahouse.line - 2.4, NR.teahouse.x1, NR.teahouse.line),
  r(NR.teahouse.x0 - 0.6, NR.teahouse.line - 0.3, NR.teahouse.x0 - 0.4, NR.teahouse.line),
  ...TEA_BENCHES.map((x) => r(x - 0.1, TEA_BENCH_Y - 0.3, x + 0.1, TEA_BENCH_Y)),
  r(NR.cart.x - 1.25, NR.cart.y - 0.8, NR.cart.x + 1.25, NR.cart.y - 0.05),
  ...PARK_BENCHES.map((x) => r(x - 1.3, PARK_BENCH_Y - 0.75, x + 1.3, PARK_BENCH_Y - 0.45)),
  ...SOUTH_ROW.map((b) => r(b.x0, NR.rowLine - 3, b.x1, NR.rowLine)),
  r(NR.station.x0, NR.rowLine - 3, NR.station.x1, NR.rowLine),
  ...PINES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...WILLOWS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...MAPLES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const stationX = 27;
const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...SANDO_LANTERNS.map(([x, y]) => ({ x: x * T, y: y * T - 25, r: 22, color: 'rgba(255, 190, 100, 0.55)' })),
  { x: NR.axis * T, y: 11.6 * T - 26, r: 30, color: 'rgba(255, 200, 120, 0.5)' },
  { x: NR.axis * T, y: NR.daibutsu.line * T - 50, r: 120, color: 'rgba(255, 200, 130, 0.3)' },
  { x: NR.axis * T, y: NR.daibutsu.line * T - 22, r: 40, color: 'rgba(255, 210, 120, 0.5)' },
  { x: NR.pagoda.x * T, y: NR.pagoda.line * T - 80, r: 90, color: 'rgba(255, 190, 120, 0.4)' },
  { x: NR.pagoda.x * T + 6, y: (NR.pond.cy - 0.6) * T, r: 60, color: 'rgba(255, 190, 120, 0.2)' },
  { x: ((NR.kasuga.x0 + NR.kasuga.x1) / 2) * T, y: NR.kasuga.line * T - 30, r: 110, color: 'rgba(255, 170, 110, 0.4)' },
  { x: ((NR.teahouse.x0 + NR.teahouse.x1) / 2) * T, y: NR.teahouse.line * T - 16, r: 70, color: 'rgba(255, 180, 120, 0.45)' },
  { x: NR.cart.x * T, y: NR.cart.y * T - 14, r: 36, color: 'rgba(255, 200, 140, 0.4)' },
  { x: ((NR.station.x0 + NR.station.x1) / 2) * T, y: NR.rowLine * T - 30, r: 70, color: 'rgba(220, 235, 255, 0.4)' },
  ...SOUTH_ROW.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: NR.rowLine * T - 12, r: 46, color: 'rgba(255, 200, 130, 0.4)' })),
];

export const NARA: CityDef = {
  id: 'nara',
  country: 'jp',
  line: 'jr',
  W: NR.W,
  H: NR.H,
  title: { 'zh-TW': '奈良 · 東大寺與奈良公園', 'en-US': 'Nara · Todai-ji & Nara Park' },
  stop: { 'zh-TW': '奈良（JR 奈良站）', 'en-US': 'Nara (JR Nara)' },
  emoji: '🦌',
  station: {
    x: stationX,
    y: NR.rowLine + 0.7,
    name: { 'zh-TW': 'JR 奈良站', 'en-US': 'JR Nara Station' },
    arrive: { x: stationX + 2.5, y: NR.rowLine + 0.9 },
  },
  background: '#d8d3c7',
  soundscape: 'zoo',
  paintGround: paintNaraGround,
  props,
  solid,
  blocked: (x, y) => inPond(x, y, 0.3),
  seats: NARA_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: NARA_SHOPS,
  fortune: {
    at: r(NR.sando.x0 - 1.4, NR.kasuga.line - 0.1, NR.sando.x1 + 1, NR.kasuga.line + 1.8),
    label: { x: (NR.sando.x0 + NR.sando.x1) / 2, y: NR.kasuga.line - 5.8 },
    title: { 'zh-TW': '春日大社 · 鹿みくじ', 'en-US': 'Kasuga Taisha · Deer Omikuji' },
    hint: { 'zh-TW': '投一枚硬幣，從木頭小鹿嘴裡抽一張籤。', 'en-US': 'Drop a coin and take a fortune from the little wooden deer’s mouth.' },
    draw: { 'zh-TW': '抽籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再抽一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great blessing' }, text: { 'zh-TW': '像大佛一樣穩穩坐著，今天的進度會大大的！', 'en-US': 'Sit as steady as the Great Buddha — today’s progress will be huge!' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Middle blessing' }, text: { 'zh-TW': '一盞一盞石燈籠走過去，總會走到神殿。一題一題做就好。', 'en-US': 'One stone lantern at a time and you reach the shrine. One task at a time.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small blessing' }, text: { 'zh-TW': '鹿對你鞠躬了！記得也鞠躬回去，然後回座位專注。', 'en-US': 'A deer bowed to you! Bow back, then return to your seat and focus.' } },
      { rank: { 'zh-TW': '吉', 'en-US': 'Blessing' }, text: { 'zh-TW': '一塊葛餅、一杯茶，再專注一顆番茄鐘。', 'en-US': 'A piece of kuzumochi, a cup of tea, then one more pomodoro.' } },
      { rank: { 'zh-TW': '末吉', 'en-US': 'Future blessing' }, text: { 'zh-TW': '仙貝要收好，不然會被鹿搶走。專注力也一樣，手機收起來。', 'en-US': 'Guard your crackers or the deer will grab them. Same with your focus — put the phone away.' } },
      { rank: { 'zh-TW': '凶', 'en-US': 'Bad luck' }, text: { 'zh-TW': '被鹿頂了一下。沒關係，坐到猿澤池邊看看五重塔，重新開始。', 'en-US': 'A deer head-butted you. It’s fine — sit by Sarusawa Pond, look at the pagoda, start again.' } },
    ],
  },
  infos: [
    { at: r(NR.daibutsu.x0, 0.5, NR.daibutsu.x1, NR.daibutsu.line), title: { 'zh-TW': '東大寺 · 大佛殿', 'en-US': 'Todai-ji · Great Buddha Hall' }, text: { 'zh-TW': '聖武天皇發願建造，752 年大佛開眼，裡面是高約 15 公尺的銅造盧舍那佛。現在的大佛殿是 1709 年重建的，寬約 57 公尺、高約 49 公尺，比最早的窄了三分之一，仍是世界最大級的木造建築。屋脊兩端是金色的鴟尾，正面唐破風上的「觀相窗」在特定日子打開，從外面就看得到大佛的臉。', 'en-US': 'Commissioned by Emperor Shōmu, the Great Buddha — a bronze Vairocana about 15 m tall — was consecrated in 752. Today’s hall, rebuilt in 1709, is about 57 m wide and 49 m tall (a third narrower than the original), still one of the largest wooden buildings in the world. Golden shibi crown the ridge, and the window under the curved front gable opens on special days to reveal the Buddha’s face.' } },
    { at: r(NM.x0 - 0.8, NM.line - 7.6, NM.x1 + 0.8, NM.line), title: { 'zh-TW': '南大門 · 金剛力士像', 'en-US': 'Nandaimon · Niō Guardians' }, text: { 'zh-TW': '東大寺的正門，1199 年用宋朝傳來的「大佛樣」重建，高約 25 公尺。兩邊是運慶、快慶等人 1203 年只花約 70 天雕好的金剛力士像，高約 8.4 公尺，左邊張嘴的阿形、右邊閉嘴的吽形（真的是面對面站在門裡；這裡簡化成格子後面的剪影）。', 'en-US': 'Todai-ji’s great gate, rebuilt in 1199 in the Song-influenced “Daibutsu style”, about 25 m tall. Inside stand the 8.4 m Niō guardians carved by Unkei, Kaikei and their team in about 70 days in 1203 — open-mouthed Agyō and closed-mouthed Ungyō. (They actually face each other inside the gate; simplified here as figures behind the lattice.)' } },
    { at: r(NR.pagoda.x - 2.4, NR.pagoda.line - 10.5, NR.pagoda.x + 2.4, NR.pagoda.line), title: { 'zh-TW': '興福寺 · 五重塔', 'en-US': 'Kōfuku-ji · Five-storey Pagoda' }, text: { 'zh-TW': '藤原氏的氏寺。五重塔高約 50 公尺，是日本第二高的木造塔（僅次於京都東寺），現在的塔是 1426 年重建的，國寶。2023 年起進行約 120 年一次的大修理，外面包著鷹架，這裡畫的是修理前的樣子。', 'en-US': 'The Fujiwara clan’s temple. Its five-storey pagoda, about 50 m tall, is Japan’s second-tallest wooden pagoda after Tō-ji in Kyoto; the current one dates from 1426 and is a National Treasure. A once-in-120-years restoration began in 2023, so it’s wrapped in scaffolding for now — drawn here as it looked before.' } },
    { at: r(NR.pond.cx - NR.pond.rx, NR.pond.cy - NR.pond.ry, NR.pond.cx + NR.pond.rx, NR.pond.cy + NR.pond.ry), title: { 'zh-TW': '猿澤池', 'en-US': 'Sarusawa Pond' }, text: { 'zh-TW': '749 年挖的放生池，倒映著興福寺五重塔的景色是奈良最經典的明信片。「猿澤池月」是南都八景之一。池邊有采女傳說的「衣掛柳」，池裡的烏龜常常爬到石頭上曬太陽。', 'en-US': 'A pond dug in 749 for releasing captive animals; the Kōfuku-ji pagoda reflected in it is Nara’s classic postcard, and “the moon on Sarusawa Pond” is one of the Eight Views of Nara. The willow on the bank recalls the legend of a court lady, and turtles sun themselves on the rocks.' } },
    { at: r(NR.sando.x0 - 1, NR.kasuga.line, NR.sando.x1 + 1, NR.walk), title: { 'zh-TW': '春日大社 · 石燈籠參道', 'en-US': 'Kasuga Taisha · Lantern Path' }, text: { 'zh-TW': '768 年創建，世界遺產。參道兩旁和迴廊上大約有 3,000 座石燈籠和釣燈籠，全是一千多年來信徒捐的。平常不點燈，只有 2 月節分和 8 月中元的「萬燈籠」全部點亮（這張圖每晚都點）。傳說春日的神騎著白鹿從鹿島來，所以鹿被當成神的使者。', 'en-US': 'Founded in 768, a World Heritage Site. About 3,000 stone and hanging bronze lanterns, donated by worshippers over a thousand years, line the paths and corridors. They’re all lit only at the Mantōrō festivals in February and August (lit every night on this map). Legend says the deity arrived riding a white deer, so deer are the gods’ messengers.' } },
    { at: r(14, 20, 38, NR.walk - 0.6), title: { 'zh-TW': '奈良公園的鹿', 'en-US': 'The Deer of Nara Park' }, text: { 'zh-TW': '公園裡住著一千多頭野生的鹿，是日本的天然紀念物。拿著鹿仙貝（米糠和麵粉做的，不加糖）的時候，鹿會對你點頭鞠躬。只能餵鹿仙貝；秋天公鹿的角會被鋸掉（角切り），免得傷人。', 'en-US': 'Over a thousand wild deer live in the park, a protected Natural Monument. Hold up a shika senbei (rice bran and flour, no sugar) and they bow to you. Feed them only deer crackers; in autumn the bucks’ antlers are sawn off so nobody gets hurt.' } },
    { at: r(38, 1, NR.W, 7.4), title: { 'zh-TW': '若草山', 'en-US': 'Mt. Wakakusa' }, text: { 'zh-TW': '高 342 公尺、三層圓圓的草山（又叫三笠山），從山頂可以俯瞰整個奈良盆地。每年 1 月第四個週六「山燒」，整座山燒成一片火。', 'en-US': 'A 342 m grassy hill in three rounded tiers (also called Mikasa-yama), with views over the whole Nara basin. On the fourth Saturday of January the whole slope is set ablaze for Yamayaki.' } },
    { at: r(NR.station.x0, NR.rowLine - 6.4, NR.station.x1, NR.rowLine), title: { 'zh-TW': 'JR 奈良站', 'en-US': 'JR Nara Station' }, text: { 'zh-TW': '1934 年的舊站舍，屋頂像寺廟、最上面還有塔一樣的相輪。2003 年車站高架化時整棟往旁邊移了 18 公尺保存下來，現在是觀光案內所（這裡畫成還在當車站入口）。搭大和路快速到大阪約 50 分鐘、到京都搭奈良線約 45 分鐘。', 'en-US': 'The 1934 station building has a temple-style roof topped with a pagoda finial. When the tracks were elevated in 2003 it was moved 18 m and preserved, now a tourist information centre (drawn here as the entrance). About 50 min to Osaka on the Yamatoji Rapid, and about 45 min to Kyoto on the Nara Line.' } },
  ],
  labels: [
    { x: NR.pond.cx, y: NR.pond.cy - NR.pond.ry - 0.2, text: { 'zh-TW': '🏯 猿澤池（南岸石椅看五重塔）', 'en-US': '🏯 Sarusawa Pond (sit and view the pagoda)' }, color: '#bae6fd' },
    { x: NR.axis, y: PARK_BENCH_Y + 1.3, text: { 'zh-TW': '🦌 奈良公園（長椅看鹿）', 'en-US': '🦌 Nara Park (bench with deer)' }, color: '#bbf7d0' },
    { x: (TEA_BENCHES[0]! + TEA_BENCHES[1]!) / 2, y: TEA_BENCH_Y + 1.3, text: { 'zh-TW': '🍡 茶屋緣台', 'en-US': '🍡 Teahouse bench' }, color: '#fecaca' },
  ],
  walkers: [
    { x0: 11.5, y0: 15.4, x1: 36.5, y1: 15.4, count: 3 },
    { x0: NR.axis - 0.9, y0: 14.6, x1: NR.axis - 0.9, y1: NR.walk - 0.4, count: 2 },
    { x0: NR.axis + 0.9, y0: 11.4, x1: NR.axis + 0.9, y1: NR.walk - 0.4, count: 2 },
    { x0: 0.8, y0: 31.3, x1: 55.2, y1: 31.3, count: 4 },
    { x0: 0.8, y0: 41, x1: 55.2, y1: 41, count: 3 },
    { x0: (NR.sando.x0 + NR.sando.x1) / 2, y0: 15, x1: (NR.sando.x0 + NR.sando.x1) / 2, y1: NR.walk - 0.6, count: 3 },
    { x0: 0.8, y0: 22, x1: 12, y1: 22, count: 1 },
  ],
  traffic: [
    { y: 32.4, dir: -1, x0: 0, x1: NR.W, count: 2 },
    { y: 33.6, dir: 1, x0: 0, x1: NR.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點猿澤池的石椅、茶屋的緣台或公園的長椅坐下專注 · 走到攤子買鹿仙貝、葛餅、柿葉壽司 · 春日大社門前抽鹿みくじ · 點地標看介紹 · JR 奈良站去京都、大阪、神戶、東京或飛回台灣',
    'en-US': 'WASD / arrows to move · click a pond bench, the teahouse bench or a park bench to focus · walk up to the stalls for deer crackers, kuzumochi and kakinoha sushi · draw a deer omikuji at Kasuga Taisha · click landmarks for info · JR Nara to Kyoto, Osaka, Kobe, Tokyo or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或緣台坐下專注 · 走到攤子買東西 · 春日大社抽籤 · 點地標看介紹 · JR 奈良站',
    'en-US': 'Tap a bench to focus · visit the stalls · deer omikuji at Kasuga · tap landmarks · JR Nara',
  },
};
