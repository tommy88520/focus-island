// 京都的美術：東山的山坡和紅葉、清水寺（本堂、懸造的木造舞台、三重塔）、仁王門、產寧坂的石板路和町家（格子、虫籠窗、暖簾、犬矢來）、
// 八坂塔（五重塔）、甘味處的紅傘長凳、祇園的町家（一力亭的紅牆、燈籠）、伏見稻荷的千本鳥居和狐狸、奧社、
// 鴨川（四條大橋、烏龜跳石、柳樹）、馬路、JR 京都車站、京都塔。最後組成 CityScene 用的 KYOTO。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { KY, KYOTO_SEATS, KYOTO_SHOPS, NIOMON_DOOR, OKUSHA_BENCH, TEA_BENCHES, TEA_BENCH_Y } from './kyoto';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, drawBench } from './cityArt';

const VERMILION = '#d2452e';
const VERMILION_DARK = '#a8321f';
const ROOF = '#4a4f58';
const ROOF_DARK = '#33373e';
const WOOD = '#4a2e1c';

// ── 地面（畫一次）──
export function paintKyotoGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1194);
  const W = KY.W * T;
  // 天空、遠山
  const sky = c.createLinearGradient(0, 0, 0, 3 * T);
  sky.addColorStop(0, '#8cc4ea');
  sky.addColorStop(1, '#e4f1f8');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 3 * T);
  c.fillStyle = '#8fa8a0';
  c.beginPath();
  c.moveTo(0, 2.4 * T);
  for (let x = 0; x <= W; x += 12) c.lineTo(x, 1.4 * T - Math.sin(x * 0.009) * 10 - Math.sin(x * 0.031) * 4);
  c.lineTo(W, 3 * T);
  c.lineTo(0, 3 * T);
  c.fill();
  // 東山的山坡：綠色＋一叢叢的樹＋紅葉
  const hy0 = 2.2 * T;
  const hy1 = (KY.hillLine - 1) * T;
  c.fillStyle = '#4f7a46';
  c.beginPath();
  c.moveTo(0, hy1);
  c.lineTo(0, 3.2 * T);
  for (let x = 0; x <= W; x += 16) c.lineTo(x, hy0 + 8 + Math.sin(x * 0.012) * 8);
  c.lineTo(W, hy1);
  c.fill();
  px(c, '#4f7a46', 0, 3.2 * T, W, hy1 - 3.2 * T);
  for (let i = 0; i < 260; i += 1) {
    const x = rand() * W;
    const y = hy0 + 14 + rand() * (hy1 - hy0 - 10);
    const r = 4 + rand() * 6;
    const maple = rand() < 0.35;
    c.fillStyle = maple ? (['#d9482b', '#e8792b', '#f0b03a', '#c23a2a'][Math.floor(rand() * 4)] ?? '#d9482b') : rand() < 0.5 ? '#3f6a3a' : '#5a8a4e';
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fill();
  }
  // 山腳的石垣
  const sy0 = (KY.hillLine - 1) * T;
  px(c, '#8f897d', 0, sy0, W, T);
  for (let y = sy0; y < KY.hillLine * T; y += 5) for (let x = (y / 5) % 2 ? 0 : 6; x < W; x += 12) px(c, '#a39d90', x, y, 10, 4);
  // 產寧坂、祇園的石板路
  const stones = (y0: number, y1: number, x1: number, base: string, joint: string) => {
    px(c, base, 0, y0 * T, x1 * T, (y1 - y0) * T);
    for (let y = y0 * T, row = 0; y < y1 * T; y += 9, row += 1) {
      px(c, joint, 0, Math.round(y), x1 * T, 1);
      for (let x = (row % 2) * 9 + rand() * 4; x < x1 * T; x += 14 + rand() * 8) px(c, joint, Math.round(x), Math.round(y), 1, 9);
    }
  };
  stones(KY.hillLine, KY.sannen.y1, KY.inari.x0, '#bdb4a4', '#a59c8b');
  px(c, '#3a2e28', 0, KY.sannen.y1 * T, KY.gion.x1 * T, (KY.gion.line - KY.sannen.y1) * T);
  stones(KY.sannen.y1, KY.river.y0 - 1, KY.inari.x0, '#c4bcae', '#aca393');
  stones(KY.gion.line, KY.river.y0 - 1, KY.inari.x0, '#c4bcae', '#aca393');
  // 稻荷山：密密的杉樹林，中間一條碎石參道、上面一塊空地
  const ix0 = KY.inari.x0 * T;
  px(c, '#2f5a32', ix0, KY.hillLine * T - 4, W - ix0, (KY.inari.y1 - KY.hillLine) * T + 4);
  for (let i = 0; i < 220; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#3a6a3a' : '#27502c';
    c.beginPath();
    c.arc(ix0 + rand() * (W - ix0), KY.hillLine * T + rand() * (KY.inari.y1 - KY.hillLine) * T, 4 + rand() * 5, 0, Math.PI * 2);
    c.fill();
  }
  const gravel = (x0: number, y0: number, x1: number, y1: number) => {
    px(c, '#cbbfa6', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let i = 0; i < (x1 - x0) * (y1 - y0) * 6; i += 1) px(c, rand() < 0.5 ? '#b8ab90' : '#ddd2bb', Math.floor(x0 * T + rand() * (x1 - x0) * T), Math.floor(y0 * T + rand() * (y1 - y0) * T), 1, 1);
  };
  gravel(KY.inari.tx0, KY.inari.top - 0.2, KY.inari.tx1, KY.inari.y1 + 0.4);
  gravel(45, KY.inari.y0, 55.4, KY.inari.top);
  // 北岸：草地、石頭河岸
  const by0 = (KY.river.y0 - 1) * T;
  px(c, '#7aa05a', 0, by0, W, T);
  for (let i = 0; i < 160; i += 1) px(c, rand() < 0.5 ? '#6c9450' : '#8ab068', Math.floor(rand() * W), Math.floor(by0 + rand() * T), 2, 1);
  px(c, '#8f897d', 0, KY.river.y0 * T - 3, W, 3);
  // 鴨川：淺淺的水、水波
  const ry0 = KY.river.y0 * T;
  const ry1 = KY.river.y1 * T;
  const water = c.createLinearGradient(0, ry0, 0, ry1);
  water.addColorStop(0, '#5f9fbe');
  water.addColorStop(1, '#4a86a8');
  c.fillStyle = water;
  c.fillRect(0, ry0, W, ry1 - ry0);
  for (let i = 0; i < 120; i += 1) px(c, 'rgba(255,255,255,0.25)', Math.floor(rand() * W), Math.floor(ry0 + 3 + rand() * (ry1 - ry0 - 6)), 6 + Math.floor(rand() * 8), 1);
  // 四條大橋：水泥橋面＋欄杆
  const bx0 = KY.bridge.x0 * T;
  const bx1 = KY.bridge.x1 * T;
  px(c, 'rgba(0,0,0,0.25)', bx0 + 3, ry0, bx1 - bx0, ry1 - ry0 + 3);
  px(c, '#b9b5ad', bx0, ry0 - 4, bx1 - bx0, ry1 - ry0 + 8);
  for (let y = ry0; y < ry1; y += 8) px(c, '#a9a59c', bx0 + 4, y, bx1 - bx0 - 8, 1);
  for (const x of [bx0, bx1 - 4]) {
    px(c, '#8a8f98', x, ry0 - 6, 4, ry1 - ry0 + 12);
    for (let y = ry0 - 4; y < ry1 + 4; y += 10) px(c, '#d6d9de', x, y, 4, 2);
  }
  // 跳石（有幾顆是烏龜的形狀）
  for (let k = 0, y = KY.river.y0 + 0.35; y < KY.river.y1 - 0.2; y += 0.72, k += 1) {
    const cx = KY.stones.x * T + (k % 2 ? 3 : -3);
    const cy = y * T + 5;
    px(c, 'rgba(0,0,0,0.25)', cx - 9, cy + 3, 19, 4);
    px(c, '#9a958a', cx - 9, cy - 4, 18, 9);
    px(c, '#b9b4a8', cx - 9, cy - 4, 18, 2);
    if (k % 3 === 1) {
      // 烏龜：頭和四隻腳
      px(c, '#7e786d', cx - 4, cy - 2, 8, 5);
      px(c, '#9a958a', cx - 2, cy - 8, 4, 4);
      for (const [dx, dy] of [[-12, -4], [9, -4], [-12, 3], [9, 3]] as const) px(c, '#9a958a', cx + dx, cy + dy, 4, 3);
    }
  }
  // 南岸：石頭護岸＋草地（等間隔坐著的河岸）
  px(c, '#8f897d', 0, ry1, W, 4);
  px(c, '#a39d90', 0, ry1, W, 1);
  px(c, '#7aa05a', 0, ry1 + 4, W, (KY.road.y0 - 0.6) * T - ry1 - 4);
  for (let i = 0; i < 200; i += 1) px(c, rand() < 0.5 ? '#6c9450' : '#8ab068', Math.floor(rand() * W), Math.floor(ry1 + 4 + rand() * ((KY.road.y0 - 0.6) * T - ry1 - 4)), 2, 1);
  // 人行道、馬路、斑馬線、車站前廣場
  tiles(c, { x0: 0, y0: KY.road.y0 - 0.6, x1: KY.W, y1: KY.road.y0 }, '#cfc9bd', '#bfb8aa', 10);
  road(c, { x0: 0, y0: KY.road.y0, x1: KY.W, y1: KY.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((KY.road.y0 + KY.road.y1) / 2) * T), 12, 1);
  zebra(c, 24, KY.road.y0, 28, KY.road.y1, false);
  tiles(c, { x0: 0, y0: KY.road.y1, x1: KY.W, y1: KY.H }, '#d8d3c7', '#c7c1b3', 16);
}

// ── 屋頂（日式瓦，兩端翹起）：x、y 是左上，w 寬、h 高 ──
export function tiledRoof(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color = ROOF, lift = 3): void {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - lift, y + h);
  c.quadraticCurveTo(x + w * 0.15, y + h - 1, x + w * 0.2, y);
  c.lineTo(x + w * 0.8, y);
  c.quadraticCurveTo(x + w * 0.85, y + h - 1, x + w + lift, y + h);
  c.lineTo(x + w + lift, y + h - 2);
  c.lineTo(x + w * 0.5, y + h - 1);
  c.lineTo(x - lift, y + h - 2);
  c.closePath();
  c.fill();
  for (let k = x + 2; k < x + w; k += 3) px(c, 'rgba(255,255,255,0.07)', Math.round(k), y + 1, 1, h - 2);
  px(c, ROOF_DARK, Math.round(x - lift), Math.round(y + h - 2), Math.round(w + lift * 2), 2);
}

// ── 清水寺：三重塔、本堂、懸造的舞台（下面一大片木柱）──
function kiyomizuSprite(): HTMLCanvasElement {
  const w = Math.round((KY.kiyomizu.x1 - KY.kiyomizu.x0) * T);
  const h = 150;
  return cached('ky-kiyomizu', w, h, (c) => {
    const rand = seeded(77);
    // 三重塔（朱紅色）
    const pcx = 52;
    let y = h - 34;
    px(c, '#9a948a', pcx - 20, y, 40, 6);
    const tiers: [number, number][] = [
      [28, 14],
      [24, 12],
      [20, 12],
    ];
    tiers.forEach(([bw, bh], k) => {
      y -= bh;
      px(c, VERMILION, pcx - bw / 2, y, bw, bh);
      px(c, '#f4efe2', pcx - bw / 2 + 3, y + 3, bw - 6, 3);
      px(c, VERMILION_DARK, pcx - 1, y + 6, 2, bh - 6);
      const rw = bw + 22 - k * 2;
      y -= 6;
      tiledRoof(c, pcx - rw / 2, y, rw, 7, ROOF_DARK, 3);
    });
    px(c, '#c9a24a', pcx - 1, y - 22, 2, 22);
    for (let k = 0; k < 6; k += 1) px(c, '#c9a24a', pcx - 3, y - 20 + k * 3, 6, 1);
    // 紅葉（後面）
    for (let i = 0; i < 40; i += 1) {
      c.fillStyle = ['#d9482b', '#e8792b', '#f0b03a', '#c23a2a', '#4f7a46'][Math.floor(rand() * 5)] ?? '#d9482b';
      c.beginPath();
      c.arc(90 + rand() * (w - 90), 50 + rand() * 40, 5 + rand() * 6, 0, Math.PI * 2);
      c.fill();
    }
    // 本堂：檜皮葺的大屋頂、朱紅柱子
    const hx0 = 140;
    const hx1 = w - 8;
    px(c, '#3a2a20', hx0 + 10, 60, hx1 - hx0 - 20, 24);
    for (let x = hx0 + 14; x < hx1 - 12; x += 14) px(c, VERMILION, x, 60, 4, 24);
    for (let x = hx0 + 20; x < hx1 - 14; x += 14) px(c, '#f4efe2', x, 64, 6, 8);
    c.fillStyle = '#6a5446';
    c.beginPath();
    c.moveTo(hx0 - 8, 64);
    c.quadraticCurveTo(hx0 + 20, 58, hx0 + 40, 22);
    c.lineTo(hx1 - 40, 22);
    c.quadraticCurveTo(hx1 - 20, 58, hx1 + 8, 64);
    c.closePath();
    c.fill();
    for (let x = hx0 + 8; x < hx1; x += 4) px(c, 'rgba(0,0,0,0.08)', x, 26, 1, 36);
    px(c, '#4a3a30', hx0 + 40, 18, hx1 - hx0 - 80, 5);
    px(c, '#4a3a30', hx0 - 8, 62, hx1 - hx0 + 16, 3);
    // 舞台：木地板往前伸出去，前緣有欄杆
    const sx0 = 110;
    const sx1 = w - 20;
    px(c, '#c9a271', sx0, 84, sx1 - sx0, 7);
    px(c, '#ddb886', sx0, 84, sx1 - sx0, 1);
    for (let x = sx0; x < sx1; x += 6) px(c, '#b48d61', x, 85, 1, 6);
    px(c, '#7a5232', sx0, 78, sx1 - sx0, 2);
    for (let x = sx0; x <= sx1; x += 12) px(c, '#7a5232', x, 78, 2, 6);
    // 懸造：一整片木柱＋橫的貫
    for (let x = sx0 + 2; x < sx1; x += 9) {
      px(c, '#7a5232', x, 91, 4, h - 91);
      px(c, '#9a6a40', x, 91, 1, h - 91);
    }
    for (const yy of [104, 120, 136]) px(c, '#5a3a22', sx0, yy, sx1 - sx0, 3);
    // 前面的紅葉（遮住柱子下緣）
    for (let i = 0; i < 26; i += 1) {
      c.fillStyle = ['#d9482b', '#e8792b', '#f0b03a', '#c23a2a'][Math.floor(rand() * 4)] ?? '#d9482b';
      c.beginPath();
      c.arc(100 + rand() * (w - 100), h - 6 - rand() * 14, 6 + rand() * 6, 0, Math.PI * 2);
      c.fill();
    }
  });
}

// 仁王門（朱紅色的兩層樓門）
function niomonSprite(): HTMLCanvasElement {
  const w = Math.round((KY.niomon.x1 - KY.niomon.x0) * T);
  const h = 78;
  return cached('ky-niomon', w, h, (c) => {
    const cx = w / 2;
    px(c, '#9a948a', 4, h - 6, w - 8, 6);
    px(c, '#b5ad9f', 4, h - 6, w - 8, 1);
    // 下層：柱子、中間的門洞、兩邊的金剛力士（暗暗的）
    px(c, VERMILION, 10, 44, w - 20, h - 50);
    px(c, '#2a1a14', cx - 10, 48, 20, h - 54);
    px(c, '#3a2420', 14, 50, 14, h - 56);
    px(c, '#3a2420', w - 28, 50, 14, h - 56);
    for (const x of [10, cx - 12, cx + 10, w - 12]) px(c, VERMILION_DARK, x, 44, 2, h - 50);
    tiledRoof(c, 0, 34, w, 10, ROOF, 4);
    // 上層
    px(c, VERMILION, 18, 20, w - 36, 14);
    px(c, '#f4efe2', 22, 23, w - 44, 4);
    tiledRoof(c, 2, 4, w - 4, 16, ROOF, 5);
    px(c, ROOF_DARK, cx - 20, 3, 40, 2);
  });
}

// 八坂塔（法觀寺五重塔）：深色木頭、一層層的瓦頂
function yasakaSprite(): HTMLCanvasElement {
  const w = 92;
  const h = 178;
  return cached('ky-yasaka', w, h, (c) => {
    const cx = w / 2;
    let y = h - 8;
    px(c, '#9a948a', cx - 30, y, 60, 8);
    px(c, '#b5ad9f', cx - 30, y, 60, 1);
    for (let k = 0; k < 5; k += 1) {
      const bw = 40 - k * 4;
      const bh = 15;
      y -= bh;
      px(c, '#4a3226', cx - bw / 2, y, bw, bh);
      px(c, '#f4efe2', cx - bw / 2 + 4, y + 3, bw - 8, 4);
      for (let x = cx - bw / 2 + 4; x < cx + bw / 2 - 4; x += 6) px(c, '#4a3226', x, y + 3, 1, 4);
      px(c, VERMILION_DARK, cx - bw / 2, y + bh - 2, bw, 2);
      const rw = 84 - k * 8;
      y -= 9;
      tiledRoof(c, cx - rw / 2, y, rw, 10, '#3d4048', 4);
    }
    // 相輪
    px(c, '#8a7a4a', cx - 1, y - 34, 3, 34);
    for (let k = 0; k < 9; k += 1) px(c, '#a8945a', cx - 4, y - 30 + k * 3, 9, 1);
    px(c, '#a8945a', cx - 2, y - 38, 5, 4);
  });
}

// 町家：二樓白牆＋虫籠窗、一樓深色格子、暖簾、犬矢來；kind 決定招牌和暖簾
type MachiyaKind = 'matcha' | 'yatsuhashi' | 'kanmi' | 'house' | 'ichiriki' | 'gion';
function machiyaSprite(key: string, w: number, kind: MachiyaKind, seed: number): HTMLCanvasElement {
  const h = 68;
  return cached(`ky-machiya-${key}`, w, h, (c) => {
    const rand = seeded(seed);
    const bengara = kind === 'ichiriki';
    const wall = bengara ? '#a8362a' : '#efe8d8';
    // 屋頂
    tiledRoof(c, 1, 2, w - 2, 12, ROOF, 2);
    // 二樓：白牆（一力亭是紅牆）、虫籠窗
    px(c, wall, 2, 14, w - 4, 16);
    for (let x = 8; x + 18 <= w - 6; x += 24) {
      px(c, '#3a2a20', x, 18, 18, 8);
      for (let k = 1; k < 18; k += 3) px(c, bengara ? '#c95040' : '#efe8d8', x + k, 18, 1, 8);
    }
    // 一樓的小屋簷
    px(c, ROOF, 0, 30, w, 5);
    px(c, ROOF_DARK, 0, 34, w, 1);
    // 一樓：格子
    px(c, bengara ? '#8a2a20' : WOOD, 2, 35, w - 4, h - 35);
    for (let x = 4; x < w - 4; x += 3) px(c, bengara ? '#b04030' : '#6b4428', x, 37, 1, h - 41);
    // 店門口（暖簾）
    const dw = 22;
    const dx = Math.round(w / 2 - dw / 2);
    if (kind !== 'house') {
      px(c, '#2a1a14', dx, 37, dw, h - 39);
      const noren = { matcha: '#2f5d3a', yatsuhashi: '#5a3a7a', kanmi: '#b8282e', ichiriki: '#1f2a44', gion: rand() < 0.5 ? '#1f2a44' : '#5a3a22', house: '#1f2a44' }[kind];
      px(c, noren, dx, 37, dw, 12);
      for (let k = dx + 5; k < dx + dw; k += 6) px(c, 'rgba(0,0,0,0.3)', k, 40, 1, 9);
      const mark = { matcha: '茶', yatsuhashi: '八', kanmi: '甘', ichiriki: '一力', gion: rand() < 0.5 ? '京' : '祇', house: '' }[kind];
      text(c, mark, w / 2, 43, '#f4efe2', `900 6px ${SERIF_TC}`);
    }
    // 犬矢來（竹子彎彎的圍籬）
    for (const x0 of [2, w - 16]) {
      c.fillStyle = '#c9a46a';
      c.beginPath();
      c.moveTo(x0, h);
      c.quadraticCurveTo(x0, h - 10, x0 + 14, h - 12);
      c.lineTo(x0 + 14, h);
      c.closePath();
      c.fill();
      for (let k = x0 + 2; k < x0 + 14; k += 3) px(c, '#a8834a', k, h - 10, 1, 10);
    }
    // 店的招牌（木板，放在屋簷上）
    const sign = { matcha: '宇治抹茶', yatsuhashi: '生八ッ橋', kanmi: '甘味處', ichiriki: '一力亭', gion: '', house: '' }[kind];
    if (sign) {
      px(c, '#c99a62', w / 2 - 22, 24, 44, 9);
      px(c, '#8a5a32', w / 2 - 22, 24, 44, 1);
      text(c, sign, w / 2, 28.5, '#3a2414', `900 6px ${SERIF_TC}`);
    }
    if (kind === 'matcha') {
      // 門口的霜淇淋立牌
      px(c, '#2f5d3a', w - 22, h - 22, 10, 18);
      px(c, '#9fd38a', w - 20, h - 20, 6, 6);
      px(c, '#e8c88a', w - 19, h - 14, 4, 6);
    }
  });
}

// 燈籠（提燈）：晚上會亮
export function drawLantern(c: CanvasRenderingContext2D, x: number, y: number, color: string, night: boolean): void {
  px(c, '#2a1a14', x - 1, y - 2, 2, 2);
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y + 4, 4, 5, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#2a1a14', x - 3, y - 1, 6, 1);
  px(c, '#2a1a14', x - 3, y + 8, 6, 1);
  if (night) glow(c, x, y + 4, 16, '255, 200, 120', 0.5);
}

function drawMachiya(c: CanvasRenderingContext2D, key: string, x0: number, x1: number, line: number, kind: MachiyaKind, seed: number, night: boolean): void {
  const w = Math.round((x1 - x0) * T);
  const by = Math.round(line * T);
  blit(c, machiyaSprite(key, w, kind, seed), x0 * T, by);
  px(c, 'rgba(0,0,0,0.15)', x0 * T, by, w, 2);
  if (kind === 'gion' || kind === 'ichiriki' || kind === 'kanmi') {
    drawLantern(c, x0 * T + 8, by - 34, kind === 'ichiriki' ? '#f4efe2' : '#e8402e', night);
    drawLantern(c, x0 * T + w - 8, by - 34, kind === 'ichiriki' ? '#f4efe2' : '#e8402e', night);
  }
}

// 甘味處前的紅傘長凳：紅毛氈的長凳在座位下面（drawSeat），紅傘撐在上面（畫在人後面一點）
function drawUmbrella(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(TEA_BENCH_Y * T);
  px(c, '#6b4428', cx - 1, by - 44, 2, 44);
  c.fillStyle = '#d23a2a';
  c.beginPath();
  c.moveTo(cx - 26, by - 36);
  c.quadraticCurveTo(cx, by - 54, cx + 26, by - 36);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.lineWidth = 1;
  for (let k = -2; k <= 2; k += 1) {
    c.beginPath();
    c.moveTo(cx, by - 48);
    c.lineTo(cx + k * 12, by - 36);
    c.stroke();
  }
  px(c, '#2a1a14', cx - 1, by - 50, 2, 3);
}

// 伏見稻荷：一座鳥居（從正面看）；大的放在入口
function drawTorii(c: CanvasRenderingContext2D, x0t: number, x1t: number, y: number, big = false): void {
  const x0 = Math.round(x0t * T);
  const x1 = Math.round(x1t * T);
  const by = Math.round(y * T);
  const hgt = big ? 48 : 38;
  for (const x of [x0, x1 - 4]) {
    px(c, VERMILION, x, by - hgt, 4, hgt);
    px(c, 'rgba(255,255,255,0.2)', x, by - hgt, 1, hgt);
    px(c, '#1f1a18', x, by - 4, 4, 4);
  }
  px(c, VERMILION, x0 - 2, by - hgt + 6, x1 - x0 + 4, 3);
  px(c, '#2a1a18', x0 - 5, by - hgt - 2, x1 - x0 + 10, 3);
  px(c, VERMILION, x0 - 3, by - hgt + 1, x1 - x0 + 6, 2);
  if (big) {
    px(c, '#1f1a18', (x0 + x1) / 2 - 6, by - hgt + 1, 12, 7);
    px(c, '#c9a24a', (x0 + x1) / 2 - 5, by - hgt + 2, 10, 5);
  }
}

// 狐狸（稻荷的使者，戴紅色圍兜）
function drawFox(c: CanvasRenderingContext2D, x: number, y: number, flip: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, '#9a948a', cx - 7, by - 6, 14, 6);
  px(c, '#e8e4dc', cx - 4, by - 20, 8, 14);
  px(c, '#e8e4dc', cx - 3, by - 26, 6, 6);
  px(c, '#e8e4dc', cx - 3, by - 29, 2, 3);
  px(c, '#e8e4dc', cx + 1, by - 29, 2, 3);
  px(c, '#d23a2a', cx - 4, by - 20, 8, 4);
  px(c, '#e8e4dc', flip ? cx - 8 : cx + 4, by - 16, 4, 10);
}

// 奧社（小小的朱紅神社）＋石燈籠
function drawOkusha(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(((KY.inari.tx0 + KY.inari.tx1) / 2) * T);
  const by = Math.round((KY.inari.y0 + 0.2) * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 22, by, 44, 3);
  px(c, VERMILION, cx - 16, by - 16, 32, 16);
  px(c, '#2a1a14', cx - 8, by - 12, 16, 12);
  px(c, '#c9a24a', cx - 2, by - 11, 4, 3);
  tiledRoof(c, cx - 22, by - 26, 44, 10, ROOF, 3);
  for (const x of [cx - 30, cx + 26]) {
    px(c, '#9a948a', x, by - 14, 4, 14);
    px(c, '#b5ad9f', x - 2, by - 18, 8, 4);
    px(c, d.night ? '#ffe08a' : '#e0dbd0', x, by - 14, 4, 3);
    if (d.night) glow(c, x + 2, by - 12, 12, '255, 210, 130', 0.5);
  }
}

// 柳樹（鴨川邊）
export function drawWillow(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 10, by - 1, 20, 3);
  px(c, '#5c4632', cx - 2, by - 26, 4, 26);
  c.fillStyle = '#7ab05a';
  c.beginPath();
  c.ellipse(cx, by - 30, 14, 8, 0, 0, Math.PI * 2);
  c.fill();
  const sway = Math.sin(seconds * 0.9 + x) * 1.5;
  for (let k = -12; k <= 12; k += 3) {
    const len = 14 + ((k * 7) % 5 + 5);
    px(c, k % 2 ? '#8cc46a' : '#6aa04e', Math.round(cx + k + sway), by - 30, 2, len);
  }
}

// 楓樹（街上）
export function drawMaple(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 9, by - 1, 18, 3);
  px(c, '#5c3d22', cx - 2, by - 14, 4, 14);
  for (const [dx, dy, r, col] of [[-6, -20, 8, '#c23a2a'], [6, -20, 8, '#d9482b'], [0, -27, 9, '#e8792b'], [0, -18, 6, '#f0b03a']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
}

// 石燈籠
export function drawStoneLantern(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 5, by - 1, 10, 2);
  px(c, '#9a948a', cx - 4, by - 4, 8, 4);
  px(c, '#9a948a', cx - 1, by - 14, 3, 10);
  px(c, '#b5ad9f', cx - 5, by - 20, 10, 6);
  px(c, night ? '#ffe08a' : '#5a564e', cx - 2, by - 18, 4, 3);
  px(c, '#8a847a', cx - 6, by - 23, 12, 3);
  if (night) glow(c, cx, by - 17, 14, '255, 210, 130', 0.5);
}

// 路燈（現代的）
export function drawStreetLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  px(c, '#3d424c', cx, by - 28, 2, 28);
  px(c, '#2f333b', cx - 1, by - 30, 8, 3);
  px(c, night ? '#fff1a8' : '#d8d2b8', cx + 3, by - 27, 4, 1);
}

// JR 京都車站：灰色的現代大樓、玻璃格子、站名
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((KY.station.x1 - KY.station.x0) * T);
  const h = 66;
  return cached('ky-station', w, h, (c) => {
    px(c, '#c9ccd2', 0, 0, w, h);
    px(c, '#e2e4e8', 0, 0, w, 2);
    // 玻璃格子
    for (let y = 6; y < h - 22; y += 7) for (let x = 6; x < w - 6; x += 9) px(c, (x + y) % 3 ? '#5a7a94' : '#6b8ca6', x, y, 7, 5);
    // 中央大廳（拱形的玻璃）
    const cx = w / 2;
    px(c, '#3f5a72', cx - 70, 20, 140, h - 20);
    for (let x = cx - 66; x < cx + 66; x += 8) px(c, '#5a7a94', x, 24, 6, h - 30);
    px(c, '#2a3a4a', cx - 70, h - 14, 140, 14);
    for (let x = cx - 60; x < cx + 60; x += 20) px(c, '#9fd8ff', x, h - 12, 14, 10);
    // 站名
    px(c, '#f4f6f8', cx - 60, 6, 120, 12);
    text(c, '京都駅  KYOTO STATION', cx + 8, 12, '#1f2a44', `900 7px ${FONT_TC}`);
    px(c, '#1a8c3a', cx - 58, 7, 14, 10);
    text(c, 'JR', cx - 51, 12, '#ffffff', `900 6px ${FONT_TC}`);
  });
}

// 京都塔：下面的大樓、白色的塔、紅白的展望台
function towerSprite(): HTMLCanvasElement {
  return cached('ky-tower', 72, 92, (c) => {
    px(c, '#d6d9de', 0, 60, 72, 32);
    px(c, '#eceef1', 0, 60, 72, 2);
    for (let y = 65; y < 88; y += 6) for (let x = 4; x < 68; x += 8) px(c, '#7a9ab4', x, y, 6, 3);
    c.fillStyle = '#f4f6f8';
    c.beginPath();
    c.moveTo(27, 60);
    c.lineTo(31, 24);
    c.lineTo(41, 24);
    c.lineTo(45, 60);
    c.fill();
    px(c, 'rgba(0,0,0,0.07)', 36, 24, 9, 36);
    px(c, '#f4f6f8', 22, 12, 28, 12);
    px(c, '#d23a2a', 22, 13, 28, 3);
    px(c, '#2a3a4a', 24, 17, 24, 4);
    px(c, '#d23a2a', 27, 6, 18, 6);
    px(c, '#f4f6f8', 34, 0, 4, 6);
  });
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = KYOTO_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  if (i < 4) {
    // 紅毛氈的長凳（縁台）
    px(c, 'rgba(0,0,0,0.2)', x - 9, y + 1, 18, 2);
    px(c, '#d23a2a', x - 9, y - 5, 18, 4);
    px(c, '#e8584a', x - 9, y - 5, 18, 1);
    px(c, '#6b4428', x - 8, y - 1, 2, 3);
    px(c, '#6b4428', x + 6, y - 1, 2, 3);
    return;
  }
  if (i < 10) {
    // 河岸的草地上鋪一塊小墊子
    px(c, 'rgba(0,0,0,0.12)', x - 6, y - 3, 12, 4);
  }
}

const UMBRELLAS = TEA_BENCHES;
const WILLOWS: [number, number][] = [[3, 25.6], [14.5, 25.6], [22, 25.6], [31, 25.6], [41, 25.6]];
const MAPLES: [number, number][] = [[1.6, 16.2], [42.6, 16], [33, 25.4], [5, 31.9], [48, 31.9]];
const STONE_LANTERNS: [number, number][] = [[10.6, 12.2], [18.4, 12.2], [35.6, 12.2], [42.6, 12.2], [46.6, 13.2], [53.4, 11.8]];
const LAMPS: [number, number][] = [[3, 32], [20, 32], [34, 32], [46, 32], [8, 37.6], [44, 37.6]];

// 祇園那一排町家（一力亭在東邊轉角）
const GION_HOUSES: { x0: number; x1: number; kind: MachiyaKind }[] = [
  { x0: 1, x1: 6.4, kind: 'gion' },
  { x0: 6.4, x1: 11.4, kind: 'house' },
  { x0: 11.4, x1: 16.8, kind: 'gion' },
  { x0: 16.8, x1: 21.4, kind: 'house' },
  { x0: 21.4, x1: 25.6, kind: 'gion' },
  { x0: 25.6, x1: 31, kind: 'ichiriki' },
];

const INARI_TORII: number[] = [];
for (let y = KY.inari.top + 0.5; y < KY.inari.y1 - 0.4; y += 0.85) INARI_TORII.push(Math.round(y * 100) / 100);

const props: CityProp[] = [
  { y: KY.kiyomizu.line, draw: (c) => blit(c, kiyomizuSprite(), KY.kiyomizu.x0 * T, KY.kiyomizu.line * T) },
  { y: KY.niomon.line, draw: (c) => blit(c, niomonSprite(), KY.niomon.x0 * T, KY.niomon.line * T) },
  ...KY.machiya.map((m, i): CityProp => ({ y: KY.rowLine, draw: (c, d) => drawMachiya(c, `row${i}`, m.x0, m.x1, KY.rowLine, m.kind, 300 + i, d.night) })),
  { y: KY.yasaka.line, draw: (c) => blit(c, yasakaSprite(), KY.yasaka.x * T - 46, KY.yasaka.line * T) },
  ...UMBRELLAS.map((x): CityProp => ({ y: TEA_BENCH_Y + 0.05, draw: (c) => drawUmbrella(c, x) })),
  ...GION_HOUSES.map((g, i): CityProp => ({ y: KY.gion.line, draw: (c, d) => drawMachiya(c, `gion${i}`, g.x0, g.x1, KY.gion.line, g.kind, 500 + i, d.night) })),
  { y: KY.inari.y0 + 0.2, draw: (c, d) => drawOkusha(c, d) },
  { y: OKUSHA_BENCH.y - 0.01, draw: (c) => drawBench(c, OKUSHA_BENCH.x, OKUSHA_BENCH.y, 2.6) },
  ...INARI_TORII.map((y): CityProp => ({ y, draw: (c) => drawTorii(c, KY.inari.tx0 - 0.1, KY.inari.tx1 + 0.1, y) })),
  { y: KY.inari.y1 + 0.3, draw: (c) => drawTorii(c, KY.inari.tx0 - 0.9, KY.inari.tx1 + 0.9, KY.inari.y1 + 0.3, true) },
  { y: KY.inari.y1 + 0.3, draw: (c) => drawFox(c, KY.inari.tx0 - 1.6, KY.inari.y1 + 0.3, false) },
  { y: KY.inari.y1 + 0.3, draw: (c) => drawFox(c, KY.inari.tx1 + 1.6, KY.inari.y1 + 0.3, true) },
  ...WILLOWS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawWillow(c, x, y, d.seconds) })),
  ...MAPLES.map(([x, y]): CityProp => ({ y, draw: (c) => drawMaple(c, x, y) })),
  ...STONE_LANTERNS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStoneLantern(c, x, y, d.night) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
  { y: KY.station.line, draw: (c) => blit(c, stationSprite(), KY.station.x0 * T, KY.station.line * T) },
  { y: KY.tower.line, draw: (c, d) => {
    blit(c, towerSprite(), KY.tower.x * T - 36, KY.tower.line * T);
    if (d.night) glow(c, KY.tower.x * T, KY.tower.line * T - 78, 34, '255, 120, 100', 0.35);
  } },
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 稻荷山只有參道和上面的空地能走；鴨川只有橋和跳石能過
function blocked(x: number, y: number): boolean {
  if (x > KY.inari.x0 && y < KY.inari.y1 + 0.2 && y > KY.hillLine - 0.4) {
    const tunnel = x > KY.inari.tx0 + 0.3 && x < KY.inari.tx1 - 0.3 && y > KY.inari.top - 0.4;
    const clearing = y > KY.inari.y0 + 0.4 && y < KY.inari.top + 0.1 && x > 45.2 && x < 55.2;
    return !(tunnel || clearing);
  }
  if (y > KY.river.y0 - 0.1 && y < KY.river.y1 + 0.35) {
    const onBridge = x > KY.bridge.x0 + 0.4 && x < KY.bridge.x1 - 0.4;
    const onStones = Math.abs(x - KY.stones.x) < 0.6;
    return !(onBridge || onStones);
  }
  return false;
}
const solid: Rect[] = [
  r(0, 0, KY.W, KY.hillLine - 0.1),
  r(KY.niomon.x0, KY.hillLine - 0.2, KY.niomon.x1, KY.niomon.line - 0.05),
  r(KY.machiya[0].x0, KY.hillLine - 0.2, KY.machiya[2].x1, KY.rowLine - 0.05),
  r(KY.yasaka.x - 2.6, KY.hillLine - 0.2, KY.yasaka.x + 2.6, KY.yasaka.line - 0.05),
  r(KY.gion.x0, KY.sannen.y1, KY.gion.x1, KY.gion.line - 0.05),
  ...TEA_BENCHES.map((x) => r(x - 0.1, TEA_BENCH_Y - 0.3, x + 0.1, TEA_BENCH_Y)),
  r(OKUSHA_BENCH.x - 1.3, OKUSHA_BENCH.y - 0.75, OKUSHA_BENCH.x + 1.3, OKUSHA_BENCH.y - 0.45),
  ...WILLOWS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...MAPLES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...STONE_LANTERNS.map(([x, y]) => r(x - 0.3, y - 0.3, x + 0.3, y)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
  r(KY.station.x0, KY.station.line - 2.4, KY.station.x1, KY.station.line - 0.05),
  r(KY.tower.x - 2.3, KY.tower.line - 1.6, KY.tower.x + 2.3, KY.tower.line - 0.05),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...GION_HOUSES.map((g) => ({ x: ((g.x0 + g.x1) / 2) * T, y: KY.gion.line * T - 20, r: 46, color: 'rgba(255, 190, 110, 0.45)' })),
  ...KY.machiya.map((m) => ({ x: ((m.x0 + m.x1) / 2) * T, y: KY.rowLine * T - 18, r: 44, color: 'rgba(255, 200, 120, 0.45)' })),
  { x: ((KY.inari.tx0 + KY.inari.tx1) / 2) * T, y: ((KY.inari.top + KY.inari.y1) / 2) * T, r: 90, color: 'rgba(255, 150, 90, 0.35)' },
  { x: ((KY.station.x0 + KY.station.x1) / 2) * T, y: KY.station.line * T - 20, r: 110, color: 'rgba(220, 235, 255, 0.4)' },
  { x: 14 * T, y: 6 * T, r: 120, color: 'rgba(255, 210, 150, 0.25)' },
];

const stationX = (KY.station.x0 + KY.station.x1) / 2;

export const KYOTO: CityDef = {
  id: 'kyoto',
  country: 'jp',
  line: 'jr',
  W: KY.W,
  H: KY.H,
  title: { 'zh-TW': '京都 · 清水寺與祇園', 'en-US': 'Kyoto · Kiyomizu-dera & Gion' },
  stop: { 'zh-TW': '京都（JR 京都站）', 'en-US': 'Kyoto (JR Kyoto Sta.)' },
  emoji: '⛩️',
  station: {
    x: stationX,
    y: KY.station.line + 0.6,
    name: { 'zh-TW': 'JR 京都站', 'en-US': 'JR Kyoto Station' },
    arrive: { x: stationX + 3, y: KY.station.line + 0.8 },
  },
  background: '#d8d3c7',
  soundscape: 'zoo',
  paintGround: paintKyotoGround,
  props,
  solid,
  blocked,
  seats: KYOTO_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: KYOTO_SHOPS,
  fortune: {
    at: r(NIOMON_DOOR.x - 2.2, KY.niomon.line, NIOMON_DOOR.x + 2.2, KY.niomon.line + 1.4),
    label: { x: NIOMON_DOOR.x, y: KY.niomon.line - 5.6 },
    title: { 'zh-TW': '清水寺 · 御神籤', 'en-US': 'Kiyomizu-dera · Omikuji' },
    hint: { 'zh-TW': '投一枚硬幣，搖一搖籤筒。', 'en-US': 'Drop a coin and shake the box.' },
    draw: { 'zh-TW': '抽籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再抽一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great blessing' }, text: { 'zh-TW': '從清水的舞台跳下去也不怕的決心，今天什麼都做得完！', 'en-US': 'With the resolve to leap from Kiyomizu’s stage, you’ll finish everything today!' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Middle blessing' }, text: { 'zh-TW': '像千本鳥居一樣，一座一座走，總會走到山頂。', 'en-US': 'Like the thousand torii — one gate at a time, and you’ll reach the top.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small blessing' }, text: { 'zh-TW': '累了就去鴨川邊坐一下，跟大家保持等間隔。', 'en-US': 'Tired? Sit by the Kamo River — evenly spaced, like everyone else.' } },
      { rank: { 'zh-TW': '吉', 'en-US': 'Blessing' }, text: { 'zh-TW': '一份糰子、一杯抹茶，再專注一顆番茄鐘。', 'en-US': 'Dango, a cup of matcha, then one more pomodoro.' } },
      { rank: { 'zh-TW': '末吉', 'en-US': 'Future blessing' }, text: { 'zh-TW': '好運在後面。抽到不好的籤，綁在架子上就好。', 'en-US': 'Luck is coming later. If the fortune’s bad, tie it to the rack and let it go.' } },
    ],
  },
  infos: [
    { at: r(KY.kiyomizu.x0 + 6, 1, KY.kiyomizu.x1, KY.hillLine - 1), title: { 'zh-TW': '清水寺', 'en-US': 'Kiyomizu-dera' }, text: { 'zh-TW': '西元 778 年創建，世界遺產。本堂前的「清水舞台」是懸造，用 18 根大櫸木柱撐起來、沒用一根釘子。日本人說「從清水舞台跳下去」，意思是下定決心。', 'en-US': 'Founded in 778, a World Heritage Site. The famous stage in front of the main hall rests on 18 giant zelkova pillars without a single nail. “Jumping off Kiyomizu’s stage” means taking a bold leap.' } },
    { at: r(KY.yasaka.x - 2.8, 2, KY.yasaka.x + 2.8, KY.yasaka.line), title: { 'zh-TW': '八坂塔（法觀寺）', 'en-US': 'Yasaka Pagoda (Hōkan-ji)' }, text: { 'zh-TW': '高 46 公尺的五重塔，從產寧坂、二年坂的石板路抬頭就看得到，是東山最有名的風景。', 'en-US': 'A 46-metre five-storey pagoda that rises over the stone lanes of Sannenzaka and Ninenzaka — Higashiyama’s classic view.' } },
    { at: r(0, KY.hillLine, KY.niomon.x0, KY.sannen.y1), title: { 'zh-TW': '產寧坂（三年坂）', 'en-US': 'Sannenzaka' }, text: { 'zh-TW': '通往清水寺的石板坡道，兩旁是老町家改成的小店。傳說在這裡跌倒會倒楣三年，走路要小心。', 'en-US': 'The stone-paved slope up to Kiyomizu, lined with shops in old machiya. Legend says a fall here brings three years of bad luck — watch your step.' } },
    { at: r(KY.gion.x0, KY.sannen.y1 - 2, KY.gion.x1, KY.gion.line), title: { 'zh-TW': '祇園', 'en-US': 'Gion' }, text: { 'zh-TW': '京都最有名的花街。花見小路兩旁是格子窗的茶屋，轉角紅牆的一力亭有三百多年歷史。傍晚有機會看到舞妓。', 'en-US': 'Kyoto’s famous geisha district. Hanamikoji is lined with latticed teahouses; Ichiriki-tei with its red walls on the corner is over 300 years old. You may spot a maiko at dusk.' } },
    { at: r(KY.inari.x0, KY.inari.top, KY.inari.x1, KY.inari.y1), title: { 'zh-TW': '伏見稻荷大社 · 千本鳥居', 'en-US': 'Fushimi Inari · Senbon Torii' }, text: { 'zh-TW': '全日本稻荷神社的總本宮，上萬座朱紅色鳥居連成隧道一路到山頂，狐狸是稻荷神的使者。（實際上在京都南邊，從京都站搭 JR 奈良線兩站就到。）', 'en-US': 'Head shrine of all Inari shrines, with thousands of vermilion torii forming tunnels up the mountain; foxes are Inari’s messengers. (It’s actually south of central Kyoto — two stops from Kyoto Station on the JR Nara Line.)' } },
    { at: r(0, KY.river.y0, KY.W, KY.river.y1), title: { 'zh-TW': '鴨川', 'en-US': 'Kamo River' }, text: { 'zh-TW': '流過京都市中心的河。傍晚河岸上的情侶會自動坐得一樣遠，叫「鴨川等間隔」。跳石有的做成烏龜的樣子。', 'en-US': 'The river through central Kyoto. Couples on the banks famously sit at equal distances — the “Kamo River spacing”. Some stepping stones are shaped like turtles.' } },
    { at: r(KY.station.x0, KY.station.line - 4, KY.station.x1, KY.station.line), title: { 'zh-TW': 'JR 京都站', 'en-US': 'JR Kyoto Station' }, text: { 'zh-TW': '1997 年蓋好的大車站，玻璃和鋼構的大廳很有未來感。新幹線、JR 京都線都在這裡，到大阪搭新快速大約 30 分鐘。', 'en-US': 'The huge glass-and-steel station opened in 1997. Shinkansen and the JR Kyoto Line stop here — about 30 minutes to Osaka by Special Rapid.' } },
    { at: r(KY.tower.x - 1.8, KY.tower.line - 8, KY.tower.x + 1.8, KY.tower.line), title: { 'zh-TW': '京都塔', 'en-US': 'Kyoto Tower' }, text: { 'zh-TW': '車站對面 131 公尺的白色塔，造型參考燈塔，晚上點燈。', 'en-US': 'A 131-metre white tower across from the station, styled after a lighthouse and lit up at night.' } },
  ],
  labels: [
    { x: 15, y: KY.gion.line + 0.6, text: { 'zh-TW': '🏮 祇園', 'en-US': '🏮 Gion' }, color: '#fca5a5' },
    { x: (KY.inari.tx0 + KY.inari.tx1) / 2, y: KY.inari.y1 + 1.1, text: { 'zh-TW': '⛩️ 千本鳥居（上面有長椅）', 'en-US': '⛩️ Senbon Torii (bench at the top)' }, color: '#fdba74' },
    { x: 27, y: KY.river.y0 + 0.6, text: { 'zh-TW': '🌊 鴨川等間隔（河岸坐下專注）', 'en-US': '🌊 Kamo riverbank (sit to focus)' }, color: '#bae6fd' },
  ],
  walkers: [
    { x0: 1, y0: 13.2, x1: 43, y1: 13.2, count: 4 },
    { x0: 1, y0: 15.8, x1: 43, y1: 15.8, count: 3 },
    { x0: 1, y0: 21.2, x1: 43, y1: 21.2, count: 3 },
    { x0: 1, y0: 23.8, x1: 43, y1: 23.8, count: 3 },
    { x0: 1, y0: 31.8, x1: 55, y1: 31.8, count: 2 },
    { x0: 1, y0: 35.8, x1: 55, y1: 35.8, count: 3 },
  ],
  traffic: [
    { y: 32.9, dir: -1, x0: 0, x1: KY.W, count: 2 },
    { y: 34, dir: 1, x0: 0, x1: KY.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點紅傘長凳、鴨川河岸或千本鳥居上面的長椅坐下專注 · 走到町家門口買抹茶霜淇淋、生八橋、糰子 · 仁王門前抽籤 · 走過千本鳥居 · 點地標看介紹 · JR 京都站搭車去別的城市或飛回台灣',
    'en-US': 'WASD / arrows to move · click a red-umbrella bench, the Kamo riverbank or the bench atop the torii path to focus · walk up to the machiya for matcha soft serve, yatsuhashi and dango · draw omikuji at the Niomon gate · walk the Senbon Torii · click landmarks for info · JR Kyoto Station to other cities or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點紅傘長凳或鴨川河岸坐下專注 · 走到町家買抹茶 · 仁王門抽籤 · 走千本鳥居 · 點地標看介紹 · JR 京都站',
    'en-US': 'Tap a bench or the riverbank to focus · visit the machiya shops · omikuji at the gate · walk the torii · tap landmarks · JR Kyoto Station',
  },
};
