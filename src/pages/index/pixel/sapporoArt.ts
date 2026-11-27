// 札幌的美術：遠方的手稻山、藻岩山（秋冬春山頂有雪）、天際線、北海道廳舊本廳舍（紅磚、八角塔、開拓使的紅星）、
// JR 札幌站（玻璃大站房＋JR 塔）、札幌市時計台（白色木造、紅屋頂、鐘樓，指針是現在的日本時間）、成吉思汗烤肉店、
// 大通公園（花壇、噴水池、榆樹、烤玉米攤車、牛奶霜淇淋）、札幌電視塔（紅色鐵塔＋數字時鐘，顯示日本時間）、
// 薄野（霓虹大樓、拉麵橫丁的小店和紅燈籠）。冬天（台灣時間 12–2 月）地上積雪、天上下雪、大通公園擺雪雕。最後組成 CityScene 用的 SAPPORO。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CLOCK_BENCHES, CLOCK_BENCH_Y, ODORI_BENCHES, ODORI_BENCH_Y, RAMEN_SHOPS, RAMEN_STOOL_Y, SAPPORO_SEATS, SAPPORO_SHOPS, SP } from './sapporo';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, drawBench, drawFoodCart, drawStool } from './cityArt';
import { drawLantern, drawStreetLamp } from './kyotoArt';

// ── 季節、時間 ──
// 台灣時間的月份（一分鐘算一次）
let monthAt = -Infinity;
let monthVal = 1;
function taipeiMonth(): number {
  const now = Date.now();
  if (now - monthAt > 60000) {
    monthAt = now;
    monthVal = Number(new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: 'Asia/Taipei' }).format(new Date(now)));
  }
  return monthVal;
}
// 冬天：台灣時間 12、1、2 月（積雪、下雪、雪雕）
export function sapporoWinter(): boolean {
  const m = taipeiMonth();
  return m === 12 || m <= 2;
}
// 遠山的山頂有雪（6–9 月沒有）
function snowCapped(): boolean {
  const m = taipeiMonth();
  return sapporoWinter() || m <= 5 || m >= 10;
}
const ssn = (): string => (sapporoWinter() ? 'w' : 's');
// 日本時間（比台灣快 1 小時）
function japanTime(): { h: number; m: number; s: number } {
  const j = new Date(Date.now() + 9 * 3600 * 1000);
  return { h: j.getUTCHours(), m: j.getUTCMinutes(), s: j.getUTCSeconds() };
}

const SNOW = '#f4f7fb';
const SNOW_SH = '#dbe4ee';

function poly(c: CanvasRenderingContext2D, color: string, pts: [number, number][]): void {
  c.fillStyle = color;
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
  c.fill();
}
// 五芒星（開拓使的「北辰」紅星）
function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  for (let k = 0; k < 10; k += 1) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? r * 0.45 : r;
    if (k === 0) c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    else c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}

// ── 地面（畫一次）──
export function paintSapporoGround(c: CanvasRenderingContext2D): void {
  const winter = sapporoWinter();
  const caps = snowCapped();
  const rand = seeded(1869);
  const W = SP.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 9 * T);
  sky.addColorStop(0, winter ? '#a9bdd2' : '#79b4e6');
  sky.addColorStop(1, winter ? '#e6edf4' : '#e2f0fa');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, SP.skyline * T);
  // 遠山：左邊高的手稻山、右邊圓圓的藻岩山（一格兩像素的柱子畫）
  const peaks: [number, number, number][] = [
    [11 * T, 3.9 * T, 9 * T],
    [22 * T, 2.4 * T, 6 * T],
    [33 * T, 3.1 * T, 6.5 * T],
    [46 * T, 2.2 * T, 8 * T],
    [1 * T, 2.2 * T, 6 * T],
  ];
  const base = 9 * T;
  const far = (x: number) => Math.max(...peaks.map(([px0, hgt, wid]) => hgt * Math.exp(-(((x - px0) / wid) ** 2)))) + Math.sin(x * 0.05) * 2;
  for (let x = 0; x < W; x += 2) {
    const top = Math.round(base - 0.6 * T - far(x));
    px(c, winter ? '#8fa3bb' : '#6f8aa8', x, top, 2, base - top);
    if (caps) {
      const peakH = far(x);
      const snowDepth = winter ? peakH * 0.75 : Math.max(0, peakH - 1.6 * T) * 0.9;
      if (snowDepth > 1) px(c, '#f2f6fa', x, top, 2, Math.round(snowDepth + Math.sin(x * 0.3) * 2));
    }
  }
  // 近一點的丘陵（森林）
  for (let x = 0; x < W; x += 2) {
    const top = Math.round(base - 0.4 * T + Math.sin(x * 0.013) * 6 + Math.sin(x * 0.041) * 3);
    px(c, winter ? '#c9d4df' : '#4f7a56', x, top, 2, base - top + 4);
  }
  // 天際線：一排大樓（屋頂冬天積雪）
  for (let x = -6; x < W; ) {
    const w = 18 + Math.floor(rand() * 26);
    const hgt = Math.floor((1.6 + rand() * 3.2) * T);
    const y = SP.skyline * T - hgt;
    const wall = ['#c9ccd2', '#d8d2c4', '#aab4c0', '#e4e0d6', '#9aa6b4'][Math.floor(rand() * 5)] ?? '#c9ccd2';
    px(c, wall, x, y, w, hgt);
    px(c, 'rgba(0,0,0,0.12)', x + w - 3, y, 3, hgt);
    for (let wy = y + 4; wy < SP.skyline * T - 4; wy += 6) for (let wx = x + 3; wx < x + w - 5; wx += 5) px(c, rand() < 0.15 ? '#f2e2a8' : '#5d7186', wx, wy, 3, 3);
    if (winter) px(c, SNOW, x, y - 2, w, 3);
    x += w + Math.floor(rand() * 4);
  }
  // 北邊：站前的廣場
  const pave = winter ? ['#e9eef4', '#d9e1ea'] : ['#d8d4cc', '#c6c0b6'];
  tiles(c, { x0: 0, y0: SP.skyline, x1: SP.W, y1: SP.road1.y0 }, pave[0] ?? '', pave[1] ?? '', 16);
  // 馬路（冬天路邊有鏟起來的雪堆）
  const paintRoad = (y0: number, y1: number) => {
    road(c, { x0: 0, y0, x1: SP.W, y1 }, rand);
    for (let x = 0; x < W; x += 24) px(c, '#e8e0a0', x, Math.round(((y0 + y1) / 2) * T), 12, 1);
    if (winter) {
      for (let x = 0; x < W; x += 2) {
        const hgt = 3 + Math.round(Math.abs(Math.sin(x * 0.11)) * 3);
        px(c, SNOW, x, y0 * T, 2, hgt);
        px(c, SNOW, x, y1 * T - hgt + 1, 2, hgt - 1);
        px(c, SNOW_SH, x, y1 * T - hgt + 1, 2, 1);
      }
      for (let i = 0; i < 120; i += 1) px(c, 'rgba(230,236,244,0.35)', Math.floor(rand() * W), Math.floor(y0 * T + 4 + rand() * ((y1 - y0) * T - 8)), 8 + Math.floor(rand() * 10), 1);
    }
  };
  paintRoad(SP.road1.y0, SP.road1.y1);
  zebra(c, 21, SP.road1.y0, 24.5, SP.road1.y1, false);
  zebra(c, 42, SP.road1.y0, 45.5, SP.road1.y1, false);
  // 中間：人行道＋時計台前的草地
  tiles(c, { x0: 0, y0: SP.road1.y1, x1: SP.W, y1: SP.road2.y0 }, pave[0] ?? '', pave[1] ?? '', 16);
  const lawn = (r: Rect) => {
    px(c, winter ? SNOW : '#77a85a', r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T);
    for (let i = 0; i < (r.x1 - r.x0) * (r.y1 - r.y0) * 4; i += 1) px(c, winter ? SNOW_SH : rand() < 0.5 ? '#6a9a4e' : '#88b866', Math.floor(r.x0 * T + rand() * (r.x1 - r.x0) * T), Math.floor(r.y0 * T + rand() * (r.y1 - r.y0) * T), 2, 1);
  };
  lawn({ x0: 24.6, y0: SP.midLine, x1: 35.4, y1: SP.road2.y0 - 0.2 });
  // 時計台前的小路
  tiles(c, { x0: 29.4, y0: SP.midLine, x1: 30.6, y1: SP.road2.y0 }, pave[0] ?? '', pave[1] ?? '', 8);
  paintRoad(SP.road2.y0, SP.road2.y1);
  zebra(c, 8, SP.road2.y0, 11.5, SP.road2.y1, false);
  zebra(c, 28.2, SP.road2.y0, 31.8, SP.road2.y1, false);
  // 大通公園：北邊花壇、中間步道、南邊草地
  const P = SP.park;
  lawn({ x0: 0, y0: P.y0, x1: 46.5, y1: P.walk0 });
  lawn({ x0: 0, y0: P.walk1, x1: 46.5, y1: P.y1 });
  if (winter) {
    px(c, '#e6ecf3', 0, P.walk0 * T, 46.5 * T, (P.walk1 - P.walk0) * T);
    // 踩出來的雪路
    for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#cfd8e2' : '#f4f7fb', Math.floor(rand() * 46.5 * T), Math.floor((P.walk0 + 0.6 + rand() * (P.walk1 - P.walk0 - 1.2)) * T), 3, 1);
    px(c, 'rgba(160,170,185,0.25)', 0, Math.round(32.2 * T), 46.5 * T, 10);
  } else {
    tiles(c, { x0: 0, y0: P.walk0, x1: 46.5, y1: P.walk1 }, '#d9cdb8', '#c8bba4', 12);
  }
  // 花壇（夏天一排排的花／冬天變成雪堆）
  const FLOWERS = ['#e8402e', '#f6c945', '#9a5ad8', '#f08ab0', '#ffffff', '#ff8a3a'];
  const bed = (x0: number, y0: number, x1: number, y1: number, k: number) => {
    if (winter) {
      c.fillStyle = SNOW;
      c.beginPath();
      c.ellipse(((x0 + x1) / 2) * T, ((y0 + y1) / 2) * T, ((x1 - x0) / 2) * T, ((y1 - y0) / 2) * T + 2, 0, 0, Math.PI * 2);
      c.fill();
      px(c, SNOW_SH, x0 * T + 4, y1 * T - 2, (x1 - x0) * T - 8, 2);
      return;
    }
    px(c, '#8a6a4a', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    px(c, '#b8b2a6', x0 * T, y1 * T - 2, (x1 - x0) * T, 2);
    for (let y = y0 * T + 2, row = 0; y < y1 * T - 3; y += 4, row += 1) {
      const col = FLOWERS[(row + k) % FLOWERS.length] ?? '#e8402e';
      for (let x = x0 * T + 2 + (row % 2) * 2; x < x1 * T - 2; x += 4) {
        px(c, '#4f8a3c', x, y + 1, 2, 2);
        px(c, col, x, y, 2, 2);
      }
    }
  };
  for (const [x0, x1] of BEDS_N) bed(x0, P.y0 + 0.25, x1, P.walk0 - 0.15, Math.round(x0));
  for (const [x0, x1] of BEDS_S) bed(x0, P.walk1 + 0.3, x1, P.y1 - 0.25, Math.round(x0) + 2);
  // 夏天：南邊草地上的花毯（冬天這裡擺雪雕）
  if (!winter) {
    const r0 = SCULPT_BIG;
    px(c, '#5f8f46', r0.x0 * T, (P.walk1 + 0.2) * T, (r0.x1 - r0.x0) * T, (P.y1 - P.walk1 - 0.4) * T);
    for (let x = r0.x0 * T + 2; x < r0.x1 * T - 2; x += 3) {
      for (let y = (P.walk1 + 0.3) * T; y < (P.y1 - 0.3) * T; y += 3) {
        const band = Math.floor((x - r0.x0 * T) / 22 + Math.sin(y * 0.2) * 0.8);
        px(c, FLOWERS[((band % 4) + 4) % 4] ?? '#e8402e', x, Math.round(y), 2, 2);
      }
    }
  }
  // 東端：電視塔下的廣場
  tiles(c, { x0: 46.5, y0: P.y0, x1: SP.W, y1: P.y1 }, pave[0] ?? '', pave[1] ?? '', 16);
  // 公園南邊的人行道
  tiles(c, { x0: 0, y0: P.y1, x1: SP.W, y1: SP.susukinoTop }, winter ? '#e2e8ef' : '#c9c4ba', winter ? '#d0d8e2' : '#b8b2a6', 16);
  // 薄野：大樓下面、拉麵橫丁的巷子（深色的石板，冬天邊邊積雪）
  px(c, '#3a3a44', 0, SP.susukinoTop * T, W, (SP.alleyLine - SP.susukinoTop) * T);
  // 拉麵店後面的舊大樓（窗、冷氣、招牌）
  for (let x = 13 * T; x < 45.5 * T; ) {
    const w = 40 + Math.floor(rand() * 30);
    const y0 = SP.susukinoTop * T + 2 + Math.floor(rand() * 6);
    px(c, ['#6a6470', '#7a6e62', '#5e6672', '#806a6a'][Math.floor(rand() * 4)] ?? '#6a6470', x, y0, w - 2, SP.alleyLine * T - y0);
    if (winter) px(c, SNOW, x, y0 - 2, w - 2, 3);
    for (let wx = x + 4; wx < x + w - 10; wx += 10) {
      px(c, rand() < 0.35 ? '#f2d89a' : '#3a4252', wx, y0 + 5, 6, 6);
      if (rand() < 0.3) px(c, '#d8dadf', wx, y0 + 13, 7, 4);
    }
    x += w;
  }
  tiles(c, { x0: SP.gate.x0, y0: SP.susukinoTop, x1: SP.gate.x1, y1: SP.alleyLine }, '#5a5550', '#4a4642', 8);
  tiles(c, { x0: 0, y0: SP.alleyLine, x1: SP.W, y1: SP.H }, '#5a5550', '#4a4642', 12);
  for (let i = 0; i < 70; i += 1) px(c, 'rgba(255,200,140,0.12)', Math.floor(rand() * W), Math.floor((SP.alleyLine + 0.4 + rand() * 4) * T), 6 + Math.floor(rand() * 10), 1);
  if (winter) {
    for (let x = 0; x < W; x += 2) px(c, SNOW, x, SP.H * T - 4 - Math.round(Math.abs(Math.sin(x * 0.09)) * 4), 2, 8);
  }
}

// 公園的花壇（北邊、南邊），南邊大雪雕／花毯的位置、貓頭鷹雪雕的位置
const BEDS_N: [number, number][] = [[1, 5], [12.5, 17.5], [25.5, 28.5], [31.5, 35], [40, 44]];
const BEDS_S: [number, number][] = [[14, 19], [20.5, 22], [27, 29], [42, 46]];
const SCULPT_BIG: Rect = { x0: 2.5, y0: 34, x1: 12.5, y1: SP.park.y1 };
const OWL = { x: 38.5, y: 35.3 };

// ── 北海道廳舊本廳舍（赤れんが）：美式新巴洛克紅磚、中間八角塔、山牆上的紅星 ──
function akarengaSprite(): HTMLCanvasElement {
  const winter = sapporoWinter();
  const w = Math.round((SP.akarenga.x1 - SP.akarenga.x0) * T);
  const h = 124;
  return cached(`sp-akarenga-${ssn()}`, w, h, (c) => {
    const cx = w / 2;
    const BR = '#b44a34';
    const BRD = '#963a28';
    const TRIM = '#efe6d6';
    const ROOF = '#4a5563';
    const ROOFD = '#38414e';
    px(c, '#8f8a80', 2, h - 6, w - 4, 6);
    // 八角塔（在山牆後面）
    px(c, BR, cx - 8, 16, 16, 26);
    px(c, BRD, cx - 14, 16, 6, 26);
    px(c, BRD, cx + 8, 16, 6, 26);
    px(c, TRIM, cx - 14, 16, 28, 2);
    px(c, TRIM, cx - 4, 22, 8, 12);
    px(c, '#3d4c5c', cx - 3, 24, 6, 10);
    for (const x of [cx - 12, cx + 10]) px(c, '#3d4c5c', x, 24, 2, 9);
    poly(c, ROOFD, [[cx - 16, 17], [cx - 11, 6], [cx + 11, 6], [cx + 16, 17]]);
    px(c, ROOF, cx - 5, 6, 3, 11);
    px(c, ROOFD, cx - 3, 1, 6, 6);
    px(c, '#c9a24a', cx - 1, 0, 2, 2);
    if (winter) {
      px(c, SNOW, cx - 11, 5, 22, 3);
      px(c, SNOW, cx - 3, 0, 6, 2);
    }
    // 主屋頂（馬薩式）＋老虎窗
    poly(c, ROOF, [[4, 57], [14, 38], [w - 14, 38], [w - 4, 57]]);
    for (let y = 42; y < 56; y += 4) px(c, ROOFD, 10, y, w - 20, 1);
    for (const x of [58, 86, w - 96, w - 68]) {
      px(c, TRIM, x, 42, 10, 10);
      px(c, '#3d4c5c', x + 2, 45, 6, 7);
      poly(c, ROOFD, [[x - 2, 43], [x + 5, 36], [x + 12, 43]]);
    }
    if (winter) {
      px(c, SNOW, 14, 36, w - 28, 4);
      for (let x = 12; x < w - 12; x += 6) px(c, SNOW, x, 40 + ((x * 7) % 5), 5, 2);
    }
    // 牆
    const top = 56;
    px(c, BR, 6, top, w - 12, h - 6 - top);
    for (let y = top; y < h - 6; y += 4) {
      px(c, BRD, 6, y + 3, w - 12, 1);
      for (let x = 6 + ((y / 4) % 2) * 4; x < w - 6; x += 8) px(c, BRD, x, y, 1, 3);
    }
    // 兩端突出的翼樓（較高的屋頂）
    for (const x0 of [6, w - 46]) {
      px(c, BR, x0, 48, 40, h - 6 - 48);
      for (let y = 48; y < h - 6; y += 4) px(c, BRD, x0, y + 3, 40, 1);
      px(c, TRIM, x0, 48, 40, 2);
      poly(c, ROOFD, [[x0 - 3, 49], [x0 + 6, 28], [x0 + 34, 28], [x0 + 43, 49]]);
      px(c, ROOF, x0 + 8, 30, 24, 2);
      if (winter) poly(c, SNOW, [[x0 + 4, 31], [x0 + 6, 26], [x0 + 34, 26], [x0 + 36, 31]]);
      px(c, 'rgba(0,0,0,0.12)', x0 + 38, 50, 2, h - 56);
    }
    px(c, TRIM, 6, top, w - 12, 2);
    px(c, TRIM, 6, 86, w - 12, 2);
    // 窗（白框、上面一道拱）
    for (const fy of [64, 94]) {
      for (let x = 12; x < w - 16; x += 15) {
        if (Math.abs(x + 4 - cx) < 38) continue;
        px(c, TRIM, x - 1, fy - 3, 10, 19);
        px(c, '#3d4c5c', x, fy, 8, 15);
        px(c, TRIM, x + 3, fy, 1, 15);
        px(c, TRIM, x, fy + 7, 8, 1);
        px(c, 'rgba(255,255,255,0.22)', x + 1, fy + 1, 2, 4);
      }
    }
    // 中間的玄關（突出）＋山牆＋紅星
    px(c, BR, cx - 32, 46, 64, h - 6 - 46);
    for (let y = 46; y < h - 6; y += 4) px(c, BRD, cx - 32, y + 3, 64, 1);
    for (const k of [-30, -16, 12, 26]) px(c, TRIM, cx + k, 52, 4, h - 6 - 52);
    poly(c, TRIM, [[cx - 35, 50], [cx, 30], [cx + 35, 50]]);
    poly(c, BR, [[cx - 28, 48], [cx, 34], [cx + 28, 48]]);
    if (winter) poly(c, SNOW, [[cx - 35, 49], [cx, 28], [cx + 35, 49], [cx, 31]]);
    star(c, cx, 42, 4.5, '#d8202a');
    for (const fy of [60, 90]) {
      px(c, TRIM, cx - 11, fy - 2, 22, 2);
      px(c, '#3d4c5c', cx - 9, fy, 8, 14);
      px(c, '#3d4c5c', cx + 1, fy, 8, 14);
    }
    px(c, TRIM, cx - 10, h - 32, 20, 26);
    px(c, '#4a2e1e', cx - 8, h - 29, 16, 23);
    px(c, '#6a4632', cx - 1, h - 29, 2, 23);
    px(c, '#8f8a80', cx - 14, h - 8, 28, 2);
  });
}

// ── JR 札幌站：玻璃大站房＋旁邊的 JR 塔（高樓）──
function stationSprite(): HTMLCanvasElement {
  const winter = sapporoWinter();
  const w = Math.round((SP.station.x1 - SP.station.x0) * T);
  const h = 184;
  return cached(`sp-station-${ssn()}`, w, h, (c) => {
    // JR 塔
    const tx0 = w - 122;
    const tw = 74;
    px(c, '#6f8499', tx0, 14, tw, h - 14);
    for (let x = tx0 + 3; x < tx0 + tw; x += 6) px(c, '#62778c', x, 14, 2, h - 14);
    for (let y = 18; y < h; y += 5) px(c, '#8aa0b4', tx0, y, tw, 1);
    px(c, 'rgba(255,255,255,0.18)', tx0 + 6, 14, 10, h - 14);
    px(c, 'rgba(0,0,0,0.15)', tx0 + tw - 10, 14, 10, h - 14);
    px(c, '#56687c', tx0 + 10, 2, tw - 20, 14);
    px(c, '#8aa0b4', tx0 + 10, 2, tw - 20, 2);
    px(c, '#3d4c5c', tx0 + 16, 7, tw - 32, 4);
    if (winter) px(c, SNOW, tx0 + 10, 0, tw - 20, 3);
    // 站房：上面的商場（白牆、橫條窗）、下面的玻璃大廳
    const body = 96;
    px(c, '#e4e0d6', 0, body, w, h - body);
    px(c, '#cfcabe', 0, body, w, 3);
    for (const y of [104, 116, 128]) {
      px(c, '#6d8398', 4, y, w - 8, 6);
      for (let x = 8; x < w - 8; x += 12) px(c, '#5a6f84', x, y, 1, 6);
    }
    if (winter) px(c, SNOW, 0, body - 3, tx0 + 2, 4);
    px(c, '#5e7a92', 0, 140, w, h - 140);
    for (let x = 0; x < w; x += 10) px(c, '#4c667c', x, 140, 1, h - 140);
    for (let y = 146; y < h; y += 8) px(c, '#7290a8', 0, y, w, 1);
    // 南口的玻璃中庭（拱形）
    const cx = 210;
    c.fillStyle = '#8fb3cc';
    c.beginPath();
    c.moveTo(cx - 64, h);
    c.lineTo(cx - 64, 118);
    c.quadraticCurveTo(cx, 86, cx + 64, 118);
    c.lineTo(cx + 64, h);
    c.fill();
    for (let x = cx - 60; x < cx + 64; x += 8) px(c, '#6f94b0', x, 106, 1, h - 106);
    for (let y = 120; y < h; y += 8) px(c, '#a8c6da', cx - 64, y, 128, 1);
    px(c, 'rgba(255,255,255,0.3)', cx - 50, 112, 6, 60);
    // 站名看板
    px(c, '#f4f6f8', cx - 62, 120, 124, 16);
    px(c, '#c9ccd2', cx - 62, 135, 124, 1);
    px(c, '#2fa84f', cx - 58, 122, 16, 12);
    text(c, 'JR', cx - 50, 128.5, '#ffffff', `900 7px ${FONT_TC}`);
    text(c, '札幌  SAPPORO', cx + 8, 128.5, '#1f2a44', `900 9px ${FONT_TC}`);
    // 遮雨棚、入口
    px(c, '#c9ccd2', 0, h - 26, w, 4);
    px(c, '#9aa0a8', 0, h - 22, w, 1);
    px(c, '#2a3a4a', cx - 46, h - 20, 92, 20);
    for (let x = cx - 42; x < cx + 42; x += 14) px(c, '#9fd8ff', x, h - 18, 10, 18);
    for (const ex of [52, w - 150]) {
      px(c, '#2a3a4a', ex - 16, h - 20, 32, 20);
      px(c, '#9fd8ff', ex - 12, h - 18, 10, 18);
      px(c, '#9fd8ff', ex + 2, h - 18, 10, 18);
    }
    if (winter) px(c, SNOW, 0, h - 28, w, 2);
  });
}

// ── 札幌市時計台：白色木造的演武場、紅屋頂、正面的鐘樓 ──
const CLOCK_W = 128;
const CLOCK_H = 140;
const CLOCK_FACE_Y = 44;
function clockTowerSprite(): HTMLCanvasElement {
  const winter = sapporoWinter();
  return cached(`sp-clock-${ssn()}`, CLOCK_W, CLOCK_H, (c) => {
    const w = CLOCK_W;
    const h = CLOCK_H;
    const cx = w / 2;
    const WH = '#f6f4ee';
    const LN = '#dcd8cf';
    const RED = '#b8382a';
    const REDD = '#962a20';
    const TRIM = '#8a9a8e';
    px(c, '#9a948a', 4, h - 5, w - 8, 5);
    // 本館：白色雨淋板
    px(c, WH, 6, 72, w - 12, h - 5 - 72);
    for (let y = 75; y < h - 5; y += 3) px(c, LN, 6, y, w - 12, 1);
    px(c, 'rgba(0,0,0,0.1)', w - 10, 72, 4, h - 77);
    for (const fy of [80, 106]) {
      for (const x of [12, 28, 90, 106]) {
        px(c, TRIM, x - 1, fy - 1, 12, 19);
        px(c, '#3d4c5c', x, fy, 10, 17);
        px(c, WH, x + 4, fy, 2, 17);
        px(c, WH, x, fy + 8, 10, 1);
      }
    }
    // 紅屋頂
    poly(c, RED, [[2, 75], [18, 54], [w - 18, 54], [w - 2, 75]]);
    for (let y = 58; y < 74; y += 4) px(c, REDD, 8, y, w - 16, 1);
    if (winter) {
      poly(c, SNOW, [[12, 62], [18, 53], [w - 18, 53], [w - 12, 62]]);
      for (let x = 10; x < w - 10; x += 5) px(c, SNOW, x, 61 + ((x * 3) % 4), 4, 2);
    }
    // 鐘樓的下段（從屋頂長出來）
    px(c, WH, cx - 14, 54, 28, 20);
    for (let y = 57; y < 74; y += 3) px(c, LN, cx - 14, y, 28, 1);
    px(c, '#3d4c5c', cx - 3, 60, 6, 9);
    // 鐘的那一層
    px(c, '#cfc9bd', cx - 18, 54, 36, 2);
    px(c, WH, cx - 16, 30, 32, 24);
    px(c, 'rgba(0,0,0,0.08)', cx + 12, 30, 4, 24);
    px(c, '#cfc9bd', cx - 18, 28, 36, 3);
    c.fillStyle = '#fbfaf5';
    c.beginPath();
    c.arc(cx, CLOCK_FACE_Y, 10, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#2a2a2a';
    c.lineWidth = 1.5;
    c.stroke();
    for (let k = 0; k < 12; k += 1) {
      const a = (k / 12) * Math.PI * 2;
      px(c, '#2a2a2a', Math.round(cx + Math.cos(a) * 8 - 0.5), Math.round(CLOCK_FACE_Y + Math.sin(a) * 8 - 0.5), 1, 1);
    }
    // 欄杆
    for (let x = cx - 16; x <= cx + 15; x += 3) px(c, '#e8e4dc', x, 25, 1, 4);
    px(c, '#e8e4dc', cx - 17, 24, 34, 1);
    // 鐘塔（拱形的開口、裡面的鐘）＋紅色尖屋頂
    px(c, WH, cx - 11, 14, 22, 12);
    px(c, '#3a3530', cx - 8, 17, 5, 9);
    px(c, '#3a3530', cx + 3, 17, 5, 9);
    px(c, '#c9a24a', cx - 7, 20, 3, 4);
    px(c, '#c9a24a', cx + 4, 20, 3, 4);
    poly(c, RED, [[cx - 14, 16], [cx, 2], [cx + 14, 16]]);
    poly(c, REDD, [[cx, 2], [cx + 14, 16], [cx + 6, 16]]);
    px(c, '#3a3530', cx - 1, 0, 2, 4);
    if (winter) poly(c, SNOW, [[cx - 6, 9], [cx, 3], [cx + 6, 9], [cx, 7]]);
    // 正面的玄關：小山牆、紅星、門
    px(c, WH, cx - 16, 96, 32, h - 5 - 96);
    for (let y = 99; y < h - 5; y += 3) px(c, LN, cx - 16, y, 32, 1);
    poly(c, RED, [[cx - 20, 99], [cx, 85], [cx + 20, 99]]);
    poly(c, WH, [[cx - 15, 98], [cx, 88], [cx + 15, 98]]);
    if (winter) poly(c, SNOW, [[cx - 20, 98], [cx, 84], [cx + 20, 98], [cx, 87]]);
    star(c, cx, 94, 3, '#d8202a');
    px(c, '#5a3a22', cx - 7, 108, 14, h - 5 - 108);
    px(c, '#9fc7d9', cx - 6, 104, 12, 3);
    px(c, '#3a2618', cx, 108, 1, h - 5 - 108);
    px(c, '#9a948a', cx - 10, h - 7, 20, 2);
  });
}
// 時計台的指針：現在的日本時間
function drawClockHands(c: CanvasRenderingContext2D): void {
  const cx = SP.clock.x0 * T + CLOCK_W / 2;
  const cy = SP.midLine * T - CLOCK_H + CLOCK_FACE_Y;
  const t = japanTime();
  const ha = (((t.h % 12) + t.m / 60) / 12) * Math.PI * 2 - Math.PI / 2;
  const ma = ((t.m + t.s / 60) / 60) * Math.PI * 2 - Math.PI / 2;
  c.strokeStyle = '#1a1a1a';
  c.lineCap = 'round';
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.cos(ha) * 5, cy + Math.sin(ha) * 5);
  c.stroke();
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.cos(ma) * 8, cy + Math.sin(ma) * 8);
  c.stroke();
  c.lineCap = 'butt';
}

// ── 成吉思汗烤肉店：木造兩層、屋頂上的大招牌（羊頭圖案）、暖簾 ──
function jingisSprite(): HTMLCanvasElement {
  const winter = sapporoWinter();
  const w = Math.round((SP.jingis.x1 - SP.jingis.x0) * T);
  const h = 82;
  return cached(`sp-jingis-${ssn()}`, w, h, (c) => {
    // 屋頂上的招牌
    px(c, '#3a3d45', w / 2 - 2, 18, 4, 6);
    px(c, '#15171f', w / 2 - 56, 2, 112, 18);
    px(c, '#e8b830', w / 2 - 56, 2, 112, 1);
    px(c, '#e8b830', w / 2 - 56, 19, 112, 1);
    for (const [dx, dy] of [[-3, -2], [3, -2], [-4, 2], [4, 2], [0, -3], [0, 3]] as const) {
      c.fillStyle = '#f4f1e8';
      c.beginPath();
      c.arc(w / 2 - 44 + dx, 11 + dy, 3.5, 0, Math.PI * 2);
      c.fill();
    }
    px(c, '#3a2a22', w / 2 - 46, 9, 5, 6);
    px(c, '#f4f1e8', w / 2 - 45, 11, 1, 1);
    text(c, 'ジンギスカン', w / 2 + 6, 11.5, '#ffffff', `900 11px ${FONT_TC}`);
    // 瓦的屋簷
    poly(c, '#3a3d45', [[0, 34], [10, 22], [w - 10, 22], [w, 34]]);
    for (let x = 4; x < w - 4; x += 5) px(c, '#2a2d34', x, 25, 2, 9);
    if (winter) poly(c, SNOW, [[6, 28], [10, 21], [w - 10, 21], [w - 6, 28]]);
    // 二樓：白牆＋格子窗
    px(c, '#e8dcc4', 6, 34, w - 12, 18);
    for (let x = 14; x < w - 20; x += 24) {
      px(c, '#5a3a22', x, 37, 18, 12);
      px(c, '#f2e2b8', x + 1, 38, 16, 10);
      for (let k = 4; k < 18; k += 4) px(c, '#5a3a22', x + k, 38, 1, 10);
    }
    // 一樓：深色木頭、窗裡看得到烤羊肉的鐵盔鍋
    px(c, '#4a3424', 4, 52, w - 8, h - 52);
    for (let x = 6; x < w - 6; x += 5) px(c, '#3e2b1d', x, 52, 1, h - 52);
    px(c, '#2f2a28', 2, 52, w - 4, 3);
    px(c, '#f3d39a', 12, 60, 64, 16);
    for (const gx of [22, 44, 64]) {
      c.fillStyle = '#2a2a2e';
      c.beginPath();
      c.arc(gx, 72, 7, Math.PI, 0);
      c.fill();
      px(c, '#b0524a', gx - 4, 67, 3, 2);
      px(c, '#7aa65a', gx + 1, 68, 3, 2);
      px(c, '#c86a5a', gx - 1, 66, 2, 2);
    }
    px(c, '#3a2a1e', 10, 58, 68, 2);
    // 門口的暖簾（藍底白字「羊」）
    const dx = w - 66;
    px(c, '#2a1a14', dx, 58, 46, h - 58);
    px(c, '#f6dfae', dx + 3, 70, 40, h - 70);
    for (let k = 0; k < 3; k += 1) px(c, '#2a3f7a', dx + 1 + k * 15, 58, 14, 14);
    text(c, '羊', dx + 23, 65, '#f4f1e8', `900 8px ${FONT_TC}`);
  });
}
// 排煙管冒出來的煙
function drawJingisSmoke(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = SP.jingis.x1 * T - 14;
  const top = SP.midLine * T - 82 + 24;
  px(c, '#6a6d75', x - 2, top - 8, 4, 10);
  for (let k = 0; k < 4; k += 1) {
    const t = (d.seconds * 0.35 + k / 4) % 1;
    const r = 2 + t * 4;
    c.fillStyle = `rgba(235,235,240,${0.55 * (1 - t)})`;
    c.beginPath();
    c.arc(x + Math.sin(d.seconds * 0.8 + k) * 3 + t * 6, top - 10 - t * 26, r, 0, Math.PI * 2);
    c.fill();
  }
}

// ── 一般的辦公大樓、土產店（中間那排）──
function officeSprite(key: string, w: number, h: number, wall: string, glass: string, shop?: { word: string; awning: string }): HTMLCanvasElement {
  const winter = sapporoWinter();
  return cached(`sp-office-${key}-${ssn()}`, w, h, (c) => {
    px(c, wall, 0, 4, w, h - 4);
    px(c, 'rgba(0,0,0,0.12)', w - 4, 4, 4, h - 4);
    px(c, 'rgba(255,255,255,0.3)', 0, 4, w, 2);
    for (let y = 12; y < h - 26; y += 11) {
      px(c, glass, 4, y, w - 12, 7);
      for (let x = 4; x < w - 8; x += 9) px(c, 'rgba(255,255,255,0.35)', x, y, 1, 7);
    }
    if (winter) px(c, SNOW, 0, 1, w, 4);
    px(c, '#2f333b', 0, h - 22, w, 22);
    if (shop) {
      for (let k = 0; k < w; k += 8) px(c, (k / 8) % 2 === 0 ? shop.awning : '#f4f1e8', k, h - 22, 8, 5);
      px(c, '#f6dfae', 4, h - 16, w - 8, 16);
      for (let x = 8; x < w - 8; x += 7) px(c, ['#e8402e', '#f6c945', '#7ab05a', '#5a8ad8'][(x / 7) % 4 | 0] ?? '#e8402e', x, h - 9, 5, 4);
      px(c, '#ffffff', w / 2 - 26, h - 32, 52, 9);
      text(c, shop.word, w / 2, h - 27.5, shop.awning, `900 7px ${FONT_TC}`);
    } else {
      for (let x = 6; x < w - 6; x += 14) px(c, '#9fc7d9', x, h - 18, 10, 18);
    }
  });
}

// ── 大通公園：榆樹、噴水池、霜淇淋亭、長椅、雪雕 ──
function drawElm(c: CanvasRenderingContext2D, x: number, y: number, winter: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.18)', cx - 12, by - 1, 24, 3);
  px(c, '#5c4632', cx - 2, by - 18, 4, 18);
  if (winter) {
    c.strokeStyle = '#6a5442';
    c.lineWidth = 1.5;
    for (const [dx, dy] of [[-12, -34], [12, -34], [-6, -40], [6, -40], [0, -42], [-14, -24], [14, -24]] as const) {
      c.beginPath();
      c.moveTo(cx, by - 16);
      c.quadraticCurveTo(cx + dx * 0.3, by + dy * 0.6, cx + dx, by + dy);
      c.stroke();
      px(c, SNOW, Math.round(cx + dx - 2), Math.round(by + dy - 1), 4, 2);
      px(c, SNOW, Math.round(cx + dx * 0.55 - 1), Math.round(by + dy * 0.75 - 1), 3, 1);
    }
    return;
  }
  for (const [dx, dy, r, col] of [[-9, -26, 10, '#3d6e3a'], [9, -26, 10, '#3d6e3a'], [0, -34, 11, '#4c8446'], [-4, -22, 8, '#5a9450'], [6, -21, 7, '#4c8446']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#7ab86a', cx - 5, by - 40, 4, 2);
  px(c, '#7ab86a', cx + 4, by - 33, 3, 2);
}

function drawFountain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const winter = sapporoWinter();
  const cx = SP.fountain.x * T;
  const cy = SP.fountain.y * T;
  const rx = SP.fountain.r * T;
  const ry = rx * 0.5;
  c.fillStyle = '#9a948a';
  c.beginPath();
  c.ellipse(cx, cy + 2, rx + 3, ry + 3, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#c8c2b6';
  c.beginPath();
  c.ellipse(cx, cy, rx + 3, ry + 3, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = winter ? SNOW : '#5a9cc8';
  c.beginPath();
  c.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#b8b2a6', cx - 3, cy - 8, 6, 8);
  if (winter) {
    px(c, SNOW, cx - 4, cy - 10, 8, 3);
    px(c, SNOW_SH, cx - rx + 6, cy + 2, rx * 2 - 12, 2);
    return;
  }
  // 漣漪、水柱（拋物線的水滴）
  for (let k = 0; k < 3; k += 1) {
    const t = (d.seconds * 0.5 + k / 3) % 1;
    c.strokeStyle = `rgba(220,240,255,${0.6 * (1 - t)})`;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(cx, cy, 4 + t * (rx - 6), 2 + t * (ry - 3), 0, 0, Math.PI * 2);
    c.stroke();
  }
  px(c, 'rgba(230,245,255,0.85)', cx - 1, cy - 30, 2, 22);
  for (let k = 0; k < 14; k += 1) {
    const t = (d.seconds * 0.9 + k / 14) % 1;
    const dir = k % 2 ? 1 : -1;
    const spread = 6 + (k % 4) * 3;
    const x = cx + dir * spread * t;
    const y = cy - 30 + (-14 * t + 40 * t * t);
    px(c, `rgba(230,245,255,${0.9 - t * 0.5})`, Math.round(x), Math.round(y), 2, 2);
  }
}

// 牛奶霜淇淋亭：藍白條紋的棚、屋頂上一支大大的霜淇淋
function drawSoftKiosk(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(SP.softX * T);
  const by = Math.round(SP.cartY * T);
  const w = 40;
  const x0 = cx - w / 2;
  px(c, 'rgba(0,0,0,0.22)', x0, by, w, 3);
  px(c, '#f4f6f8', x0 + 2, by - 30, w - 4, 20);
  const owner = getAvatarFrame(lookColors(3, 5, { body: 0 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - owner.width / 2), by - 10 - owner.height + 6);
  px(c, '#5a5d66', x0 + 1, by - 34, 2, 34);
  px(c, '#5a5d66', x0 + w - 3, by - 34, 2, 34);
  for (let k = 0; k < w + 4; k += 6) px(c, (k / 6) % 2 === 0 ? '#3a7ac8' : '#f4f1e8', x0 - 2 + k, by - 38, 6, 6);
  px(c, 'rgba(0,0,0,0.2)', x0 - 2, by - 32, w + 4, 1);
  // 屋頂上的大霜淇淋
  poly(c, '#d8a860', [[cx - 6, by - 52], [cx + 6, by - 52], [cx, by - 38]]);
  for (let k = 0; k < 4; k += 1) px(c, '#b8884a', cx - 4 + k * 2, by - 51 + k * 3, 1, 2);
  for (const [w2, y] of [[16, -56], [12, -61], [8, -65], [3, -68]] as const) {
    c.fillStyle = '#fbfaf3';
    c.beginPath();
    c.ellipse(cx, by + y, w2 / 2, 3, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#e8e4d6', cx - w2 / 2 + 2, by + y + 2, w2 - 4, 1);
  }
  // 檯面＋招牌
  px(c, '#9aa3b2', x0, by - 12, w, 4);
  px(c, '#d6dae2', x0, by - 12, w, 1);
  px(c, '#e8eef6', x0, by - 8, w, 8);
  px(c, '#ffffff', x0 + 3, by - 7, w - 6, 6);
  text(c, '牛乳ソフト', cx, by - 4, '#2a6ab0', `900 5px ${FONT_TC}`);
  for (const k of [-12, -2, 8]) {
    poly(c, '#d8a860', [[cx + k, by - 15], [cx + k + 4, by - 15], [cx + k + 2, by - 11]]);
    px(c, '#fbfaf3', cx + k, by - 18, 4, 3);
  }
  if (d.night) glow(c, cx, by - 20, 26, '200, 230, 255', 0.3);
}

// 沒有椅背的木長椅（坐的人背對畫面看時計台）
function drawBackless(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 21, by + 1, 42, 3);
  px(c, '#8a5a32', cx - 21, by - 4, 42, 4);
  px(c, '#a8703f', cx - 21, by - 4, 42, 1);
  px(c, '#3a3d45', cx - 18, by, 3, 2);
  px(c, '#3a3d45', cx + 15, by, 3, 2);
  if (sapporoWinter()) {
    px(c, SNOW, cx - 21, by - 5, 6, 2);
    px(c, SNOW, cx + 15, by - 5, 6, 2);
  }
}

// 雪雕（冬天）：雪做的西式洋館（圓頂、兩座塔），雪的貓頭鷹、雪人
function snowHallSprite(): HTMLCanvasElement {
  const w = Math.round((SCULPT_BIG.x1 - SCULPT_BIG.x0) * T);
  const h = 100;
  return cached('sp-snowhall', w, h, (c) => {
    const cx = w / 2;
    const A = '#f7fafd';
    const B = '#c9d7e6';
    const C = '#9fb2c8';
    // 外輪廓（淡淡的藍灰陰影，在雪地上才看得出形狀）
    c.fillStyle = '#b4c4d6';
    c.fillRect(12, 44, w - 24, h - 56);
    for (const tx of [9, w - 27]) c.fillRect(tx, 25, 18, h - 40);
    c.beginPath();
    c.arc(cx, 30, 19.5, Math.PI, 0);
    c.fill();
    poly(c, B, [[0, h], [6, h - 12], [w - 6, h - 12], [w, h]]);
    px(c, A, 6, h - 14, w - 12, 4);
    // 台階
    for (let k = 0; k < 4; k += 1) px(c, k % 2 ? B : A, cx - 30 + k * 2, h - 18 - k * 3, 60 - k * 4, 3);
    // 本體
    px(c, A, 14, 46, w - 28, h - 64);
    px(c, C, w - 24, 46, 10, h - 64);
    for (let x = 24; x < w - 28; x += 14) {
      px(c, B, x, 50, 4, h - 72);
      px(c, C, x + 3, 50, 1, h - 72);
    }
    for (let x = 30; x < w - 30; x += 14) {
      px(c, C, x, 56, 6, 12);
      c.fillStyle = C;
      c.beginPath();
      c.arc(x + 3, 56, 3, Math.PI, 0);
      c.fill();
    }
    px(c, B, 12, 44, w - 24, 3);
    // 兩邊的塔
    for (const tx of [10, w - 26]) {
      px(c, A, tx, 26, 16, h - 44);
      px(c, C, tx + 12, 26, 4, h - 44);
      poly(c, B, [[tx - 2, 27], [tx + 8, 10], [tx + 18, 27]]);
      px(c, C, tx + 6, 34, 4, 8);
    }
    // 中間的圓頂
    px(c, A, cx - 18, 30, 36, 16);
    c.fillStyle = A;
    c.beginPath();
    c.arc(cx, 30, 18, Math.PI, 0);
    c.fill();
    c.fillStyle = B;
    c.beginPath();
    c.arc(cx + 4, 28, 14, Math.PI * 1.5, 0);
    c.fill();
    px(c, B, cx - 2, 6, 4, 8);
    px(c, A, cx - 3, 4, 6, 3);
    px(c, C, cx - 6, 34, 12, 10);
  });
}
function drawSnowOwl(c: CanvasRenderingContext2D): void {
  const cx = Math.round(OWL.x * T);
  const by = Math.round(OWL.y * T);
  poly(c, SNOW_SH, [[cx - 20, by], [cx - 16, by - 8], [cx + 16, by - 8], [cx + 20, by]]);
  c.fillStyle = '#b4c4d6';
  c.beginPath();
  c.ellipse(cx + 1, by - 26, 16.5, 21.5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f7fafd';
  c.beginPath();
  c.ellipse(cx, by - 26, 15, 20, 0, 0, Math.PI * 2);
  c.fill();
  poly(c, '#f7fafd', [[cx - 13, by - 40], [cx - 11, by - 52], [cx - 4, by - 42]]);
  poly(c, '#f7fafd', [[cx + 13, by - 40], [cx + 11, by - 52], [cx + 4, by - 42]]);
  for (const ex of [-6, 6]) {
    c.fillStyle = '#9fb2c8';
    c.beginPath();
    c.arc(cx + ex, by - 34, 5, 0, Math.PI * 2);
    c.fill();
    px(c, '#9aaabd', cx + ex - 1, by - 35, 2, 2);
  }
  poly(c, '#c3d1e0', [[cx - 2, by - 30], [cx + 2, by - 30], [cx, by - 26]]);
  for (let k = 0; k < 4; k += 1) px(c, '#dfe8f1', cx - 8 + k * 4, by - 20 + (k % 2) * 3, 3, 2);
  px(c, '#dfe8f1', cx + 8, by - 32, 4, 20);
}
function drawSnowman(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(120,140,160,0.25)', cx - 8, by - 1, 16, 3);
  for (const [r, yy] of [[8, -8], [6, -20]] as const) {
    c.fillStyle = '#f7fafd';
    c.beginPath();
    c.arc(cx, by + yy, r, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#2a2a2e', cx - 3, by - 22, 2, 2);
  px(c, '#2a2a2e', cx + 1, by - 22, 2, 2);
  px(c, '#e8792b', cx - 1, by - 20, 3, 2);
  px(c, '#c8282a', cx - 6, by - 15, 12, 3);
  px(c, '#3a3d45', cx - 5, by - 30, 10, 4);
  px(c, '#3a3d45', cx - 7, by - 27, 14, 2);
}
// 夏天：雪雕的位置換成丁香花叢
function drawLilac(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.18)', cx - 12, by - 1, 24, 3);
  px(c, '#5c4632', cx - 1, by - 10, 3, 10);
  for (const [dx, dy, r] of [[-7, -16, 7], [7, -16, 7], [0, -22, 8]] as const) {
    c.fillStyle = '#4f8a46';
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  for (let k = 0; k < 9; k += 1) px(c, k % 2 ? '#b07ad8' : '#d0a8f0', cx - 10 + ((k * 7) % 20), by - 26 + ((k * 5) % 14), 3, 4);
}

// ── 札幌電視塔：紅色鐵塔、展望台、數字時鐘（日本時間）──
const TOWER_W = 120;
const TOWER_H = 286;
const PANEL_Y = 120;
function tvTowerSprite(): HTMLCanvasElement {
  const winter = sapporoWinter();
  return cached(`sp-tvtower-${ssn()}`, TOWER_W, TOWER_H, (c) => {
    const cx = TOWER_W / 2;
    const bot = TOWER_H;
    const R = '#d9542c';
    const RD = '#a83a1e';
    const line = (x0: number, y0: number, x1: number, y1: number, col: string, lw: number) => {
      c.strokeStyle = col;
      c.lineWidth = lw;
      c.beginPath();
      c.moveTo(x0, y0);
      c.lineTo(x1, y1);
      c.stroke();
    };
    px(c, '#9a948a', cx - 58, bot - 4, 116, 4);
    // 四隻腳（外面兩隻、裡面兩隻）＋腳之間的拱
    const legTop = bot - 96;
    line(cx - 30, bot - 3, cx - 12, legTop, RD, 3);
    line(cx + 30, bot - 3, cx + 12, legTop, RD, 3);
    line(cx - 54, bot - 3, cx - 17, legTop, R, 4);
    line(cx + 54, bot - 3, cx + 17, legTop, R, 4);
    c.strokeStyle = R;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 48, bot - 8);
    c.quadraticCurveTo(cx, bot - 70, cx + 48, bot - 8);
    c.stroke();
    for (let k = 1; k < 4; k += 1) {
      const t = k / 4;
      const y = bot - 3 - t * 93;
      const half = 54 - t * 37;
      line(cx - half, y, cx + half, y, RD, 1.5);
    }
    // 塔身：梯形＋X 形斜撐
    const deckBot = 88;
    const edge = (y: number) => 12 + ((y - deckBot) / (legTop - deckBot)) * 5;
    line(cx - 17, legTop, cx - 12, deckBot, R, 3);
    line(cx + 17, legTop, cx + 12, deckBot, R, 3);
    for (let y = legTop; y > deckBot + 4; y -= 16) {
      const y2 = Math.max(deckBot, y - 16);
      line(cx - edge(y), y, cx + edge(y2), y2, RD, 1);
      line(cx + edge(y), y, cx - edge(y2), y2, RD, 1);
      line(cx - edge(y), y, cx + edge(y), y, R, 1.5);
    }
    // 數字時鐘的框（數字每幀畫）
    px(c, '#e8e4dc', cx - 31, PANEL_Y - 2, 62, 26);
    px(c, '#1c1d22', cx - 29, PANEL_Y, 58, 22);
    // 展望台
    px(c, R, cx - 28, 62, 56, 3);
    px(c, '#f2efe8', cx - 26, 65, 52, 21);
    px(c, '#3d5068', cx - 24, 70, 48, 9);
    for (let x = cx - 24; x < cx + 24; x += 6) px(c, '#e8e4dc', x, 70, 1, 9);
    px(c, R, cx - 28, 86, 56, 3);
    if (winter) px(c, SNOW, cx - 28, 60, 56, 3);
    // 上段的鐵架、天線（紅白相間）
    line(cx - 11, 62, cx - 5, 30, R, 2);
    line(cx + 11, 62, cx + 5, 30, R, 2);
    for (let y = 62; y > 32; y -= 10) {
      const e1 = 5 + ((y - 30) / 32) * 6;
      const e2 = 5 + ((y - 10 - 30) / 32) * 6;
      line(cx - e1, y, cx + e2, y - 10, RD, 1);
      line(cx + e1, y, cx - e2, y - 10, RD, 1);
    }
    px(c, '#f2efe8', cx - 8, 30, 16, 4);
    for (let y = 2; y < 30; y += 4) px(c, (y / 4) % 2 < 1 ? R : '#f2efe8', cx - 1.5, y, 3, 4);
  });
}
// 數字時鐘、塔頂的航空燈、晚上的燈光
function drawTowerClock(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = SP.tower.x * T;
  const top = SP.tower.y * T - TOWER_H;
  const t = japanTime();
  const hh = String(t.h).padStart(2, '0');
  const mm = String(t.m).padStart(2, '0');
  const col = d.night ? '#fff6d8' : '#f2efe0';
  c.font = `900 14px Menlo, Consolas, monospace`;
  c.textBaseline = 'middle';
  c.fillStyle = col;
  c.textAlign = 'right';
  c.fillText(hh, cx - 3, top + PANEL_Y + 11.5);
  c.textAlign = 'left';
  c.fillText(mm, cx + 3, top + PANEL_Y + 11.5);
  if (t.s % 2 === 0) {
    px(c, col, cx - 1, top + PANEL_Y + 7, 2, 2);
    px(c, col, cx - 1, top + PANEL_Y + 14, 2, 2);
  }
  if (d.night) {
    glow(c, cx, top + PANEL_Y + 11, 40, '255, 240, 200', 0.35);
    if (Math.floor(d.seconds * 1.2) % 2 === 0) {
      px(c, '#ff3a2a', cx - 1, top, 3, 3);
      glow(c, cx, top + 1, 10, '255, 60, 40', 0.7);
    }
    // 塔身的燈（沿著腳往上亮）
    for (let k = 0; k < 10; k += 1) {
      const y = SP.tower.y * T - 6 - k * 20;
      if (y < top + 90) break;
      glow(c, cx, y, 22, '255, 150, 90', 0.18);
    }
  }
}

// ── 薄野：霓虹大樓（招牌都是自己編的字）──
function neonBuildingSprite(side: 'L' | 'R'): HTMLCanvasElement {
  const winter = sapporoWinter();
  const r = side === 'L' ? SP.neonL : SP.neonR;
  const w = Math.round((r.x1 - r.x0) * T);
  const h = 92;
  return cached(`sp-neon-${side}-${ssn()}`, w, h, (c) => {
    const parts = side === 'L' ? [[0, 112, 92, '#5a5d6a'], [112, w, 80, '#8a7a6a']] : [[0, 96, 84, '#7a6a72'], [96, w, 92, '#4f5562']];
    for (const [x0, x1, hgt, wall] of parts as [number, number, number, string][]) {
      const y0 = h - hgt;
      px(c, wall, x0, y0, x1 - x0, hgt);
      px(c, 'rgba(0,0,0,0.15)', x1 - 4, y0, 4, hgt);
      for (let y = y0 + 6; y < h - 22; y += 9) for (let x = x0 + 5; x < x1 - 8; x += 9) px(c, '#3a4252', x, y, 6, 5);
      if (winter) px(c, SNOW, x0, y0 - 2, x1 - x0, 3);
      px(c, '#22242c', x0, h - 18, x1 - x0, 18);
      for (let x = x0 + 6; x < x1 - 10; x += 16) px(c, '#e8c88a', x, h - 14, 10, 14);
    }
  });
}
interface Neon {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
  rgb: string;
  vertical?: boolean;
  blink?: number;
}
const NEONS: Neon[] = [
  { x: 1.2, y: 2.4, w: 18, h: 52, text: 'カラオケ', color: '#ff4fa8', rgb: '255, 80, 170', vertical: true, blink: 0 },
  { x: 2.8, y: 4.9, w: 92, h: 16, text: 'すすきの SUSUKINO', color: '#ffd23f', rgb: '255, 210, 70', blink: 1 },
  { x: 7.6, y: 2.2, w: 18, h: 40, text: '居酒屋', color: '#ff6a3a', rgb: '255, 110, 60', vertical: true },
  { x: 9.8, y: 2.6, w: 34, h: 14, text: 'BAR', color: '#5ad6ff', rgb: '90, 210, 255', blink: 2 },
  { x: 46.4, y: 2.6, w: 18, h: 40, text: '焼肉', color: '#ff5a4a', rgb: '255, 90, 70', vertical: true },
  { x: 48.6, y: 4.8, w: 70, h: 16, text: '♪ スナック', color: '#c78bff', rgb: '200, 140, 255', blink: 0 },
  { x: 54.6, y: 2.6, w: 18, h: 52, text: 'ラーメン', color: '#7aee6a', rgb: '120, 240, 110', vertical: true, blink: 1 },
];
function drawNeons(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const base = SP.alleyLine * T;
  for (const [i, n] of NEONS.entries()) {
    const x = Math.round(n.x * T);
    const y = Math.round(base - n.y * T - n.h);
    const flick = n.blink !== undefined && d.night && Math.floor(d.seconds * 1.5 + n.blink) % 4 === 0;
    const on = d.night && !flick;
    px(c, '#15171f', x - 1, y - 1, n.w + 2, n.h + 2);
    px(c, on ? 'rgba(255,255,255,0.06)' : '#1f2129', x, y, n.w, n.h);
    const col = on ? n.color : d.night ? '#4a4048' : n.color;
    c.globalAlpha = on || d.night ? 1 : 0.7;
    if (n.vertical) {
      [...n.text].forEach((ch, k) => text(c, ch, x + n.w / 2, y + 7 + k * 12, col, `900 10px ${FONT_TC}`));
    } else {
      text(c, n.text, x + n.w / 2, y + n.h / 2 + 0.5, col, `900 9px ${FONT_TC}`);
    }
    c.globalAlpha = 1;
    if (on) glow(c, x + n.w / 2, y + n.h / 2, Math.max(n.w, n.h) * 0.8, n.rgb, 0.28);
    // 招牌邊框的跑馬燈
    if (on && i % 2 === 0) {
      for (let k = 0; k < n.w; k += 4) if ((k / 4 + Math.floor(d.seconds * 4)) % 3 === 0) px(c, '#fff6c8', x + k, y - 1, 2, 1);
    }
  }
  // 大樓牆上的 LED 螢幕（彩色的條紋會動）
  const sx = Math.round(50.2 * T);
  const sy = Math.round(base - 2.2 * T - 22);
  px(c, '#15171f', sx - 1, sy - 1, 58, 24);
  for (let k = 0; k < 14; k += 1) {
    const hue = (k * 24 + d.seconds * 60) % 360;
    c.fillStyle = `hsl(${hue}, 80%, ${d.night ? 60 : 45}%)`;
    c.fillRect(sx + k * 4, sy, 4, 22);
  }
  text(c, 'WELCOME', sx + 28, sy + 11, '#ffffff', `900 8px ${FONT_TC}`);
}

// ── 拉麵橫丁：一間間的小店（木牆、屋簷、招牌、暖簾、吧台）──
function ramenShopSprite(i: number): HTMLCanvasElement {
  const s = RAMEN_SHOPS[i];
  const winter = sapporoWinter();
  const w = s ? Math.round((s.x1 - s.x0) * T) : 64;
  const h = 70;
  return cached(`sp-ramen-${i}-${ssn()}`, w, h, (c) => {
    if (!s) return;
    const rand = seeded(400 + i);
    const wood = ['#6a4a32', '#5a3e2a', '#74523a'][i % 3] ?? '#6a4a32';
    px(c, '#2a2422', 0, 4, w, 10);
    px(c, wood, 0, 12, w, h - 12);
    for (let x = 2; x < w; x += 4) px(c, 'rgba(0,0,0,0.12)', x, 12, 1, h - 12);
    px(c, 'rgba(0,0,0,0.3)', 0, 12, 1, h - 12);
    // 招牌（木板、黑字）
    px(c, '#f2e6c8', 4, 16, w - 8, 13);
    px(c, '#3a2a1e', 4, 16, w - 8, 1);
    px(c, '#3a2a1e', 4, 28, w - 8, 1);
    text(c, s.name, w / 2, 22.5, '#2a1a14', `900 ${s.name.length > 2 ? 8 : 9}px ${FONT_TC}`);
    // 屋簷（瓦）
    px(c, '#2f2a28', -1, 30, w + 2, 5);
    for (let x = 0; x < w; x += 4) px(c, '#3f3a38', x, 31, 2, 3);
    if (winter) {
      px(c, SNOW, 0, 1, w, 4);
      px(c, SNOW, 0, 28, w, 3);
    }
    // 店裡（暖色的燈、湯鍋、師傅）
    px(c, '#f3d39a', 3, 35, w - 6, h - 45);
    px(c, '#e0b878', 3, 35, w - 6, 3);
    for (let k = 0; k < 3; k += 1) px(c, '#c98a3c', 6 + k * 6, 40, 4, 3);
    px(c, '#9aa3b2', w - 22, 46, 14, 10);
    px(c, '#c9ccd6', w - 22, 46, 14, 2);
    const cook = getAvatarFrame(lookColors((i * 3) % 5, 4 + (i % 3), { body: i % 2 }), 'down', 'idle');
    c.drawImage(cook, Math.round(w / 2 - 4 - cook.width / 2), h - 10 - cook.height + 2);
    px(c, '#ffffff', Math.round(w / 2 - 9), h - 10 - cook.height + 2, 10, 3);
    // 暖簾（分成幾片，上面白字）
    const panels = Math.max(3, Math.floor((w - 6) / 14));
    const pw = Math.floor((w - 6) / panels);
    for (let k = 0; k < panels; k += 1) px(c, s.noren, 3 + k * pw, 35, pw - 1, 12);
    text(c, 'らーめん', w / 2, 41, s.noren === '#f4efe2' ? '#2a3f7a' : '#f4efe2', `900 6px ${FONT_TC}`);
    // 吧台（木頭）、碗
    px(c, '#a8703f', 0, h - 12, w, 4);
    px(c, '#c48a52', 0, h - 12, w, 1);
    px(c, '#5a3a22', 0, h - 8, w, 8);
    for (let x = 6; x < w - 8; x += 12) if (rand() < 0.8) {
      px(c, '#f4efe2', x, h - 15, 7, 3);
      px(c, '#c84a2a', x + 1, h - 15, 5, 1);
    }
  });
}
// 每間店門口兩顆紅燈籠、橫丁入口的招牌
function drawRamenLanterns(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const y = SP.alleyLine * T - 36;
  for (const s of RAMEN_SHOPS) {
    drawLantern(c, s.x0 * T + 5, y, '#d8382a', d.night);
    drawLantern(c, s.x1 * T - 5, y, '#d8382a', d.night);
  }
}
function drawYokochoGate(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(SP.gate.x0 * T);
  const x1 = Math.round(SP.gate.x1 * T);
  const by = Math.round(SP.alleyLine * T);
  px(c, '#2a1a14', x0, by - 58, 3, 58);
  px(c, '#2a1a14', x1 - 3, by - 58, 3, 58);
  px(c, '#8a1a14', x0 - 4, by - 66, x1 - x0 + 8, 15);
  px(c, '#e8b830', x0 - 4, by - 66, x1 - x0 + 8, 1);
  px(c, '#e8b830', x0 - 4, by - 52, x1 - x0 + 8, 1);
  text(c, 'ラーメン横丁', (x0 + x1) / 2, by - 58.5, d.night ? '#fff1c0' : '#f6e6b0', `900 7px ${FONT_TC}`);
  for (let x = x0 + 4; x < x1 - 2; x += 10) drawLantern(c, x, by - 50, '#e8402e', d.night);
  if (d.night) glow(c, (x0 + x1) / 2, by - 58, 30, '255, 160, 100', 0.35);
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = SAPPORO_SEATS[i];
  if (s && i >= 4 && i < 8) drawStool(c, s.x, s.y, '#c8401e');
}

// 下雪（冬天，整張地圖）：用時間算，每個人看到的一樣
function drawSnowfall(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!sapporoWinter()) return;
  const W = SP.W * T + 20;
  const H = SP.H * T + 10;
  for (let i = 0; i < 280; i += 1) {
    const fall = 14 + (i % 5) * 5;
    const y = ((i * 89.3 + d.seconds * fall) % H) - 5;
    const x = ((((i * 131.7 + d.seconds * (4 + (i % 3) * 3) + Math.sin(d.seconds * 0.8 + i) * 8) % W) + W) % W) - 10;
    const big = i % 4 === 0;
    px(c, `rgba(255,255,255,${big ? 0.95 : 0.75})`, Math.round(x), Math.round(y), big ? 2 : 1, big ? 2 : 1);
  }
}

const LAMPS: [number, number][] = [[2.6, 16.3], [20, 16.3], [31, 16.3], [55.6, 16.3], [2.6, 25.3], [24, 25.3], [36, 25.3], [55.6, 25.3], [6.5, 29.2], [21, 29.2], [36, 29.2], [11, 33.9], [24.5, 33.9], [35, 33.9], [46, 33.9], [12, 36.2], [46, 36.2]];
const ELMS_N: [number, number][] = [[8, 29.2], [19, 29.2], [30, 29.2], [46, 29.4]];
const ELMS_S: [number, number][] = [[13, 35.4], [20, 35.4], [26, 35.4], [33, 35.4], [44, 35.4]];
const PLAZA_TREES: [number, number][] = [[21, 14.8], [25, 14.8], [29, 14.8], [1.2, 14.8], [0.8, 24.8], [57, 24.8]];

const winterAtLoad = sapporoWinter();
const officeW = { x0: 12.6, x1: 25 };
const officeE1 = { x0: 35.6, x1: 45.4 };
const officeE2 = { x0: 45.4, x1: 56.6 };
const towerTop = SP.tower.y * T - TOWER_H;

const props: CityProp[] = [
  { y: SP.northLine, draw: (c) => blit(c, akarengaSprite(), SP.akarenga.x0 * T, SP.northLine * T) },
  { y: SP.northLine, draw: (c) => blit(c, stationSprite(), SP.station.x0 * T, SP.northLine * T) },
  ...PLAZA_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawElm(c, x, y, sapporoWinter()) })),
  { y: SP.midLine, draw: (c) => blit(c, jingisSprite(), SP.jingis.x0 * T, SP.midLine * T) },
  { y: SP.midLine + 0.01, draw: (c, d) => drawJingisSmoke(c, d) },
  { y: SP.midLine + 0.02, draw: (c, d) => {
    const x = SP.jingis.x1 * T - 66;
    drawLantern(c, x - 6, SP.midLine * T - 30, '#d8382a', d.night);
    drawLantern(c, x + 52, SP.midLine * T - 30, '#d8382a', d.night);
  } },
  { y: SP.midLine, draw: (c) => blit(c, officeSprite('w', Math.round((officeW.x1 - officeW.x0) * T), 92, '#d8d0c0', '#6d8398', { word: 'おみやげ 北海道', awning: '#2a7a46' }), officeW.x0 * T, SP.midLine * T) },
  { y: SP.midLine, draw: (c) => blit(c, officeSprite('e1', Math.round((officeE1.x1 - officeE1.x0) * T), 88, '#aab4c0', '#4f657c'), officeE1.x0 * T, SP.midLine * T) },
  { y: SP.midLine, draw: (c) => blit(c, officeSprite('e2', Math.round((officeE2.x1 - officeE2.x0) * T), 86, '#e4e0d6', '#6d8398', { word: 'カフェ', awning: '#8a3a2a' }), officeE2.x0 * T, SP.midLine * T) },
  { y: SP.midLine, draw: (c) => blit(c, clockTowerSprite(), SP.clock.x0 * T, SP.midLine * T) },
  { y: SP.midLine + 0.01, draw: (c) => drawClockHands(c) },
  ...CLOCK_BENCHES.map((x): CityProp => ({ y: CLOCK_BENCH_Y - 0.01, draw: (c) => drawBackless(c, x, CLOCK_BENCH_Y) })),
  ...ELMS_N.map(([x, y]): CityProp => ({ y, draw: (c) => drawElm(c, x, y, sapporoWinter()) })),
  ...ELMS_S.map(([x, y]): CityProp => ({ y, draw: (c) => drawElm(c, x, y, sapporoWinter()) })),
  ...ODORI_BENCHES.map((x): CityProp => ({ y: ODORI_BENCH_Y - 0.01, draw: (c) => {
    drawBench(c, x, ODORI_BENCH_Y, 2.6);
    if (sapporoWinter()) px(c, SNOW, Math.round(x * T - 20), Math.round(ODORI_BENCH_Y * T - 14), 40, 2);
  } })),
  { y: SP.fountain.y + 0.6, draw: (c, d) => drawFountain(c, d) },
  { y: SP.cartY, draw: (c, d) => drawFoodCart(c, SP.cornX, SP.cartY, 'とうきび', '#e8b830', ['#f2c84a', '#e8a830', '#f2c84a'], d.seconds, 88) },
  { y: SP.cartY, draw: (c, d) => drawSoftKiosk(c, d) },
  { y: SCULPT_BIG.y1 - 0.2, draw: (c) => {
    if (sapporoWinter()) blit(c, snowHallSprite(), SCULPT_BIG.x0 * T, (SCULPT_BIG.y1 - 0.2) * T);
  } },
  { y: OWL.y, draw: (c) => (sapporoWinter() ? drawSnowOwl(c) : drawLilac(c, OWL.x, OWL.y)) },
  { y: 34.8, draw: (c) => (sapporoWinter() ? drawSnowman(c, 30.6, 34.8) : drawLilac(c, 30.6, 34.8)) },
  { y: SP.tower.y, draw: (c) => blit(c, tvTowerSprite(), SP.tower.x * T - TOWER_W / 2, SP.tower.y * T) },
  { y: SP.tower.y + 0.01, draw: (c, d) => drawTowerClock(c, d) },
  { y: SP.alleyLine, draw: (c) => blit(c, neonBuildingSprite('L'), SP.neonL.x0 * T, SP.alleyLine * T) },
  { y: SP.alleyLine, draw: (c) => blit(c, neonBuildingSprite('R'), SP.neonR.x0 * T, SP.alleyLine * T) },
  { y: SP.alleyLine + 0.01, draw: (c, d) => drawNeons(c, d) },
  ...RAMEN_SHOPS.map((s, i): CityProp => ({ y: SP.alleyLine, draw: (c) => blit(c, ramenShopSprite(i), s.x0 * T, SP.alleyLine * T) })),
  { y: SP.alleyLine + 0.01, draw: (c, d) => drawRamenLanterns(c, d) },
  { y: SP.alleyLine + 0.02, draw: (c, d) => drawYokochoGate(c, d) },
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
  { y: SP.H + 10, draw: (c, d) => drawSnowfall(c, d) },
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, SP.W, SP.skyline),
  r(SP.akarenga.x0, SP.skyline, SP.akarenga.x1, SP.northLine - 0.05),
  r(SP.station.x0, SP.skyline, SP.station.x1, SP.northLine - 0.05),
  r(SP.jingis.x0, SP.road1.y1, SP.jingis.x1, SP.midLine - 0.05),
  r(officeW.x0, SP.road1.y1, officeW.x1, SP.midLine - 0.05),
  r(SP.clock.x0 + 0.3, SP.road1.y1, SP.clock.x1 - 0.3, SP.midLine - 0.05),
  r(officeE1.x0, SP.road1.y1, officeE2.x1, SP.midLine - 0.05),
  ...CLOCK_BENCHES.map((x) => r(x - 1.3, CLOCK_BENCH_Y - 0.35, x + 1.3, CLOCK_BENCH_Y - 0.1)),
  ...ODORI_BENCHES.map((x) => r(x - 1.3, ODORI_BENCH_Y - 0.75, x + 1.3, ODORI_BENCH_Y - 0.45)),
  ...BEDS_N.map(([x0, x1]) => r(x0, SP.park.y0 + 0.3, x1, SP.park.walk0 - 0.2)),
  ...BEDS_S.map(([x0, x1]) => r(x0, SP.park.walk1 + 0.3, x1, SP.park.y1 - 0.2)),
  r(SP.fountain.x - SP.fountain.r, SP.fountain.y - 0.8, SP.fountain.x + SP.fountain.r, SP.fountain.y + 0.8),
  r(SP.cornX - 1.25, SP.cartY - 0.8, SP.cornX + 1.25, SP.cartY - 0.05),
  r(SP.softX - 1.25, SP.cartY - 0.8, SP.softX + 1.25, SP.cartY - 0.05),
  r(SCULPT_BIG.x0, SCULPT_BIG.y0, SCULPT_BIG.x1, SCULPT_BIG.y1),
  r(OWL.x - 1, OWL.y - 0.6, OWL.x + 1, OWL.y),
  r(30.1, 34.3, 31.1, 34.8),
  r(SP.tower.x - 3.4, SP.tower.y - 1.4, SP.tower.x + 3.4, SP.tower.y - 0.05),
  r(0, SP.susukinoTop, SP.gate.x0, SP.alleyLine - 0.05),
  r(SP.gate.x1, SP.susukinoTop, SP.W, SP.alleyLine - 0.05),
  ...[...ELMS_N, ...ELMS_S, ...PLAZA_TREES].map(([x, y]) => r(x - 0.25, y - 0.3, x + 0.25, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  { x: 45 * T, y: SP.northLine * T - 40, r: 150, color: 'rgba(220, 235, 255, 0.45)' },
  { x: 51 * T, y: SP.northLine * T - 120, r: 80, color: 'rgba(200, 225, 255, 0.3)' },
  { x: ((SP.akarenga.x0 + SP.akarenga.x1) / 2) * T, y: SP.northLine * T - 50, r: 120, color: 'rgba(255, 200, 150, 0.35)' },
  { x: ((SP.clock.x0 + SP.clock.x1) / 2) * T, y: SP.midLine * T - 70, r: 100, color: 'rgba(255, 240, 210, 0.45)' },
  { x: ((SP.jingis.x0 + SP.jingis.x1) / 2) * T, y: SP.midLine * T - 20, r: 70, color: 'rgba(255, 180, 110, 0.45)' },
  { x: SP.tower.x * T, y: towerTop + PANEL_Y + 11, r: 60, color: 'rgba(255, 240, 200, 0.4)' },
  { x: SP.tower.x * T, y: SP.tower.y * T - 120, r: 130, color: 'rgba(255, 130, 80, 0.3)' },
  { x: SP.cornX * T, y: SP.cartY * T - 14, r: 40, color: 'rgba(255, 190, 110, 0.5)' },
  { x: SP.softX * T, y: SP.cartY * T - 14, r: 40, color: 'rgba(200, 230, 255, 0.45)' },
  ...(winterAtLoad ? [] : [{ x: SP.fountain.x * T, y: SP.fountain.y * T - 10, r: 50, color: 'rgba(150, 210, 255, 0.35)' }]),
  ...RAMEN_SHOPS.map((s) => ({ x: ((s.x0 + s.x1) / 2) * T, y: SP.alleyLine * T - 22, r: 48, color: 'rgba(255, 180, 110, 0.5)' })),
  { x: 6 * T, y: SP.alleyLine * T - 60, r: 120, color: 'rgba(255, 90, 180, 0.3)' },
  { x: 52 * T, y: SP.alleyLine * T - 60, r: 120, color: 'rgba(120, 180, 255, 0.3)' },
  { x: 30 * T, y: SP.alleyLine * T + 30, r: 120, color: 'rgba(255, 150, 90, 0.25)' },
];

const stationX = 45;

export const SAPPORO: CityDef = {
  id: 'sapporo',
  country: 'jp',
  line: 'jr',
  W: SP.W,
  H: SP.H,
  title: { 'zh-TW': '札幌 · 大通公園與時計台', 'en-US': 'Sapporo · Odori Park & Clock Tower' },
  stop: { 'zh-TW': '札幌（JR 札幌站）', 'en-US': 'Sapporo (JR Sapporo)' },
  emoji: '⛄',
  station: {
    x: stationX,
    y: SP.northLine + 0.6,
    name: { 'zh-TW': 'JR 札幌站', 'en-US': 'JR Sapporo Station' },
    arrive: { x: stationX - 3, y: SP.northLine + 0.9 },
  },
  background: '#d8d4cc',
  soundscape: 'city',
  paintGround: paintSapporoGround,
  props,
  solid,
  seats: SAPPORO_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: SAPPORO_SHOPS,
  infos: [
    { at: r(SP.clock.x0, 13.6, SP.clock.x1, SP.midLine), title: { 'zh-TW': '札幌市時計台', 'en-US': 'Sapporo Clock Tower' }, text: { 'zh-TW': '1878 年蓋的白色木造建築，原本是札幌農學校（北海道大學的前身）的演武場。1881 年裝上美國 Howard 公司的鐘，到現在還是靠重錘驅動、每個整點敲鐘，是國家重要文化財。地圖上的指針是現在的日本時間。實際上四周都是大樓、前庭很小，地圖前面的草地是簡化的。', 'en-US': 'A white wooden hall built in 1878 as the drill hall of Sapporo Agricultural College (today’s Hokkaido University). Its American Howard clock, installed in 1881, is still weight-driven and strikes every hour. The hands here show the current time in Japan. In reality it is hemmed in by office blocks with only a small forecourt — the lawn on this map is simplified.' } },
    { at: r(SP.tower.x - 3.6, 17.6, SP.tower.x + 3.6, SP.tower.y), title: { 'zh-TW': '札幌電視塔', 'en-US': 'Sapporo TV Tower' }, text: { 'zh-TW': '1957 年完工、高 147.2 公尺的鐵塔，站在大通公園的東端，90 公尺的展望台可以看整條公園和遠方的山。塔身上的大型數字時鐘從 1961 年開始報時，地圖上顯示的是現在的日本時間（比台灣快 1 小時）。', 'en-US': 'Completed in 1957, this 147.2 m tower stands at the east end of Odori Park; its 90 m observation deck looks down the whole park to the mountains. The giant digital clock on its body has kept time since 1961 — here it shows the current time in Japan (one hour ahead of Taiwan).' } },
    { at: r(SP.fountain.x - 2.5, SP.park.y0, SP.fountain.x + 2.5, SP.park.walk1), title: { 'zh-TW': '大通公園', 'en-US': 'Odori Park' }, text: { 'zh-TW': '東西長約 1.5 公里的帶狀公園，明治時代原本是把城市分成南北兩半的防火帶。夏天有花壇、噴水池和賣烤玉米的「とうきびワゴン」；每年 2 月的札幌雪祭會擺滿大型雪雕。地圖只畫了一小段，冬天（台灣時間 12–2 月）會積雪、下雪，也擺上雪雕。', 'en-US': 'A 1.5 km strip of park that began in the Meiji era as a firebreak splitting the city into north and south. Summer brings flower beds, fountains and the famous corn wagons; every February the Sapporo Snow Festival fills it with giant snow sculptures. Only a short stretch is drawn here; in winter (Dec–Feb, Taiwan time) the map gets snow, snowfall and sculptures.' } },
    { at: r(SP.akarenga.x0, 7.6, SP.akarenga.x1, SP.northLine), title: { 'zh-TW': '北海道廳舊本廳舍（赤れんが）', 'en-US': 'Former Hokkaido Government Office' }, text: { 'zh-TW': '1888 年完工的美式新巴洛克紅磚建築，大家叫它「赤れんが（紅磚）」。屋頂中間的八角塔是它的象徵，山牆上的紅色五芒星是開拓使的標誌。用了約 250 萬塊磚，是國家重要文化財。實際上在札幌站的西南邊，地圖把它跟車站排在一起。', 'en-US': 'A red-brick American neo-baroque building finished in 1888, known simply as “Akarenga” (red brick). The octagonal tower is its symbol, and the red star on the gable is the emblem of the Hokkaido Development Commission. Built from about 2.5 million bricks, it is an Important Cultural Property. In reality it lies southwest of the station; the map puts them side by side.' } },
    { at: r(SP.station.x0, 3.6, SP.station.x1, SP.northLine), title: { 'zh-TW': 'JR 札幌站', 'en-US': 'JR Sapporo Station' }, text: { 'zh-TW': '北海道最大的車站，旁邊 173 公尺高的 JR 塔上面有展望室。從這裡搭快速列車到新千歲機場約 40 分鐘、到小樽約 35 分鐘；北海道新幹線預計之後延伸到札幌。遊戲裡從這裡搭 JR 去其他日本城市（實際上要轉新幹線或搭飛機）。', 'en-US': 'Hokkaido’s biggest station, next to the 173 m JR Tower with its observation deck. Rapid trains reach New Chitose Airport in about 40 min and Otaru in about 35; the Hokkaido Shinkansen is planned to extend here. In the game you take the JR from here to other Japanese cities (in reality you’d change to the Shinkansen or fly).' } },
    { at: r(13, 37, 45.5, SP.alleyLine), title: { 'zh-TW': '拉麵橫丁', 'en-US': 'Ramen Yokocho' }, text: { 'zh-TW': '薄野的小巷子，1950 年代起拉麵攤聚在這裡，現在十幾家小店擠在窄窄的巷子兩邊，每家只有吧台幾個位子。札幌味噌拉麵就是 1950 年代在札幌誕生的，濃厚的味噌湯頭加上奶油、玉米是經典吃法。實際上在大通公園往南幾個街區，地圖把距離拉近了；旁邊霓虹招牌上的字都是自己編的。', 'en-US': 'A narrow alley in Susukino where ramen stalls gathered from the 1950s; today over a dozen tiny counter-only shops line it. Sapporo miso ramen was born here in that decade — rich miso broth topped with butter and corn is the classic. In reality it is a few blocks south of Odori Park; the map squeezes the distance, and the neon sign texts are made up.' } },
    { at: r(0, 0, 31, 6.6), title: { 'zh-TW': '手稻山、藻岩山', 'en-US': 'Mt Teine & Mt Moiwa' }, text: { 'zh-TW': '手稻山（1023 公尺）是 1972 年札幌冬季奧運的滑雪比賽場地；藻岩山（531 公尺）在市區西南，山頂的夜景是「日本新三大夜景」之一。兩座山其實都在城市的西邊，地圖把它們畫在北邊遠方。', 'en-US': 'Mt Teine (1,023 m) hosted alpine skiing at the 1972 Sapporo Winter Olympics; Mt Moiwa (531 m), southwest of downtown, offers one of Japan’s “new three great night views”. Both actually lie west of the city — the map paints them in the distance to the north.' } },
  ],
  labels: [
    { x: (ODORI_BENCHES[0]! + ODORI_BENCHES[1]!) / 2, y: ODORI_BENCH_Y + 1.1, text: { 'zh-TW': '🗼 大通公園（長椅坐下看電視塔）', 'en-US': '🗼 Odori Park (bench with a TV Tower view)' }, color: '#bbf7d0' },
    { x: 30, y: CLOCK_BENCH_Y + 0.95, text: { 'zh-TW': '🕰️ 時計台前的長椅', 'en-US': '🕰️ Benches by the Clock Tower' }, color: '#fde68a' },
    { x: 17, y: RAMEN_STOOL_Y + 1.6, text: { 'zh-TW': '🍜 拉麵橫丁（吧台坐下專注）', 'en-US': '🍜 Ramen Yokocho (sit at the counter)' }, color: '#fecaca' },
  ],
  walkers: [
    { x0: 1, y0: 15.9, x1: 57, y1: 15.9, count: 4 },
    { x0: 1, y0: 23.9, x1: 24, y1: 23.9, count: 2 },
    { x0: 36, y0: 23.6, x1: 57, y1: 23.6, count: 2 },
    { x0: 1, y0: 25.3, x1: 57, y1: 25.3, count: 2 },
    { x0: 1, y0: 33.2, x1: 47, y1: 33.2, count: 4 },
    { x0: 1, y0: 36, x1: 57, y1: 36, count: 3 },
    { x0: 1, y0: 44.6, x1: 57, y1: 44.6, count: 3 },
  ],
  traffic: [
    { y: 17.3, dir: -1, x0: 0, x1: SP.W, count: 2 },
    { y: 18.5, dir: 1, x0: 0, x1: SP.W, count: 2 },
    { y: 26.3, dir: -1, x0: 0, x1: SP.W, count: 2 },
    { y: 27.5, dir: 1, x0: 0, x1: SP.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點大通公園、時計台前的長椅或拉麵橫丁的吧台坐下專注 · 走到攤子買味噌拉麵、烤玉米、牛奶霜淇淋、成吉思汗烤羊肉 · 點地標看介紹 · JR 札幌站去京都、大阪、東京或飛回台灣',
    'en-US': 'WASD / arrows to move · click an Odori Park or Clock Tower bench, or a ramen counter, to focus · walk up to the stalls for miso ramen, grilled corn, milk soft serve and jingisukan · click landmarks for info · JR Sapporo to Kyoto, Osaka, Tokyo or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或吧台坐下專注 · 走到攤子買東西 · 點地標看介紹 · JR 札幌站',
    'en-US': 'Tap a bench or counter to focus · visit the stalls · tap landmarks · JR Sapporo',
  },
};
