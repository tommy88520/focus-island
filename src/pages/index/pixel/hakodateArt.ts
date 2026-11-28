// 函館的美術：函館山（山頂展望台、電視塔，纜車上下山；晚上山上的路燈、纜車燈、山頂打燈）、
// 函館山纜車山麓站、函館東正教會（白牆、綠色洋蔥頂、鐘樓）、舊函館區公會堂（藍灰色牆、黃色窗框、中間的陽台）、
// 天主教元町教會（哥德式尖塔、頂上的公雞風向計）、八幡坂（筆直的石板坡道、行道樹、復古路燈；冬天晚上樹上掛燈）、
// 坡道兩旁和洋折衷的老房子（鹽味拉麵店）、市電的馬路（復古的箱型電車和一般電車開過，架空線）、
// JR 函館站、函館朝市（活烏賊水槽、帝王蟹、鮭魚卵丼的吧台）、金森紅磚倉庫（晚上打燈）、函館港（摩周丸、亮著集魚燈的烏賊船、水面倒影）。
// 冬天（台灣時間 12–2 月）屋頂、坡道、樹上積雪，天上下雪。最後組成 CityScene 用的 HAKODATE。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import {
  BAY_BENCHES,
  BAY_BENCH_Y,
  BAY_CART,
  COUNTER,
  DON_DOOR,
  HAKODATE_SEATS,
  HAKODATE_SHOPS,
  HALL_BENCH,
  HD,
  HOUSES,
  RAMEN_DOOR,
  SQUID_TANK,
  TOP_BENCHES,
  TOP_BENCH_Y,
  WAREHOUSES,
  type HouseKind,
} from './hakodate';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, cached, blit, tiles, zebra, drawBench, drawFoodCart, drawStool } from './cityArt';

const MW = HD.W * T;
const MH = HD.H * T;
const FOOT = HD.foot * T;
const SEA = HD.sea * T;
const BRICK = '#a8472f';
const BRICK_DARK = '#8a3826';
const SNOW = '#f4f7fb';
const SNOW_SH = '#d9e3ee';
const COPPER = '#5fa58a';
const COPPER_DARK = '#3f8068';

// ── 季節：台灣時間 12–2 月是冬天（積雪、下雪）──
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
export function hakodateWinter(): boolean {
  const m = taipeiMonth();
  return m === 12 || m <= 2;
}
const ssn = (): string => (hakodateWinter() ? 'w' : 's');

function poly(c: CanvasRenderingContext2D, color: string, pts: [number, number][]): void {
  c.fillStyle = color;
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
  c.closePath();
  c.fill();
}

// 一片磚牆（灰縫錯開）
function brickWall(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base = BRICK, joint = BRICK_DARK): void {
  px(c, base, x, y, w, h);
  for (let yy = 0, row = 0; yy < h; yy += 3, row += 1) {
    px(c, joint, x, y + yy + 2, w, 1);
    for (let xx = (row % 2) * 3; xx < w; xx += 6) px(c, joint, x + xx, y + yy, 1, 2);
  }
}

// 洋蔥頂（東正教會）：cx 中間、base 是圓頂底部、w 寬
function onionDome(c: CanvasRenderingContext2D, cx: number, base: number, w: number, winter: boolean): void {
  const h = w * 1.15;
  c.fillStyle = COPPER;
  c.beginPath();
  c.moveTo(cx - w * 0.36, base);
  c.bezierCurveTo(cx - w * 0.62, base - h * 0.35, cx - w * 0.5, base - h * 0.7, cx, base - h);
  c.bezierCurveTo(cx + w * 0.5, base - h * 0.7, cx + w * 0.62, base - h * 0.35, cx + w * 0.36, base);
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  px(c, COPPER_DARK, Math.round(cx + w * 0.08), Math.round(base - h), Math.ceil(w * 0.6), Math.ceil(h));
  px(c, 'rgba(255,255,255,0.35)', Math.round(cx - w * 0.3), Math.round(base - h * 0.6), 2, Math.round(h * 0.35));
  if (winter) {
    c.fillStyle = SNOW;
    c.beginPath();
    c.ellipse(cx, base - h * 0.62, w * 0.42, h * 0.22, 0, Math.PI, Math.PI * 2);
    c.fill();
  }
  c.restore();
  // 十字架（東正教的八端十字）
  const top = Math.round(base - h);
  px(c, '#e8c860', Math.round(cx) - 1, top - 2, 2, 2);
  px(c, '#e8c860', Math.round(cx), top - 11, 1, 10);
  px(c, '#e8c860', Math.round(cx) - 2, top - 10, 5, 1);
  px(c, '#e8c860', Math.round(cx) - 3, top - 8, 7, 1);
  px(c, '#e8c860', Math.round(cx) - 2, top - 5, 5, 1);
}

// ── 地面（畫一次）──
export function paintHakodateGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1859);
  const winter = hakodateWinter();
  const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
  const S = HD.slope;
  // 山腳的草地（大多被房子蓋住）
  px(c, '#5d8a4c', 0, FOOT, MW, (HD.rowB - HD.foot) * T);
  // 元町的廣場：米色石板
  tiles(c, r(0, HD.rowB - 0.4, HD.W, HD.plaza.y1), '#d9d0bf', '#c4b9a5', 12);
  px(c, '#b3a891', 0, HD.plaza.y1 * T - 1, MW, 2);
  // 房子底下
  px(c, '#a8a092', 0, HD.plaza.y1 * T + 1, MW, (HD.rowB2 - HD.plaza.y1) * T);
  // 八幡坂：中間是花崗岩石板（橫的接縫，往下延伸到海）、兩邊人行道是紅磚
  const cobble = (x0: number, y0: number, x1: number, y1: number) => {
    px(c, '#9a968e', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let y = y0 * T, row = 0; y < y1 * T; y += 4, row += 1) {
      for (let x = x0 * T + (row % 2) * 5; x < x1 * T; x += 10) px(c, rand() < 0.5 ? '#8c887f' : '#a8a49b', Math.round(x), Math.round(y), 9, 3);
    }
  };
  cobble(S.x0, HD.foot, S.x1, HD.rowB2);
  for (const [a, b] of [[S.walk0, S.x0], [S.x1, S.walk1]] as const) {
    px(c, '#b5604a', a * T, HD.foot * T, (b - a) * T, (HD.rowB2 - HD.foot) * T);
    for (let y = HD.foot * T, row = 0; y < HD.rowB2 * T; y += 4, row += 1) {
      px(c, '#9a4c38', a * T, Math.round(y) + 3, (b - a) * T, 1);
      for (let x = a * T + (row % 2) * 4; x < b * T; x += 8) px(c, '#9a4c38', Math.round(x), Math.round(y), 1, 3);
    }
    px(c, '#d8d2c6', (a === S.walk0 ? b : a) * T - 1, HD.foot * T, 2, (HD.rowB2 - HD.foot) * T);
  }
  // 北邊的人行道
  tiles(c, r(0, HD.rowB2, HD.W, HD.road.y0), '#cfc8bb', '#bbb3a5', 10);
  // 市電的馬路：柏油＋兩條軌道（石板鋪在軌道之間）
  const R = HD.road;
  px(c, '#4c4f57', 0, R.y0 * T, MW, (R.y1 - R.y0) * T);
  for (let i = 0; i < 900; i += 1) px(c, rand() < 0.5 ? '#45484f' : '#565961', Math.floor(rand() * MW), Math.floor(R.y0 * T + rand() * (R.y1 - R.y0) * T), 2, 1);
  for (const ty of [HD.tram.west, HD.tram.east]) {
    const y = Math.round(ty * T);
    px(c, '#77756e', 0, y - 6, MW, 8);
    for (let x = 0; x < MW; x += 6) px(c, '#6a6862', x, y - 6, 1, 8);
    px(c, '#c4c6ca', 0, y - 6, MW, 1);
    px(c, '#c4c6ca', 0, y + 1, MW, 1);
  }
  px(c, '#f2f2ee', 0, Math.round(R.y0 * T + 9), MW, 1);
  for (let x = 0; x < MW; x += 20) px(c, '#f2f2ee', x, Math.round(R.y1 * T - 10), 10, 1);
  px(c, '#9a948a', 0, R.y0 * T, MW, 2);
  px(c, '#9a948a', 0, R.y1 * T - 2, MW, 2);
  zebra(c, S.x0 + 0.2, R.y0 + 0.15, S.x1 - 0.2, R.y1 - 0.15, false);
  // 南邊的人行道、港邊房子底下
  tiles(c, r(0, R.y1, HD.W, HD.walkS), '#cfc8bb', '#bbb3a5', 10);
  px(c, '#b9b2a4', 0, HD.walkS * T, MW, (HD.rowC - HD.walkS) * T);
  // 八幡坂下的廣場：石板一路到海
  cobble(HD.market.x1, HD.walkS, HD.kanemori.x0, HD.sea);
  // 港邊：車站前的磁磚、朝市前的水泥地、金森倉庫前的石板
  tiles(c, r(0, HD.rowC, HD.market.x0, HD.sea), '#d8d3c8', '#c4bdb0', 12);
  px(c, '#b8b6b0', HD.market.x0 * T, HD.rowC * T, (HD.market.x1 - HD.market.x0) * T, (HD.sea - HD.rowC) * T);
  for (let i = 0; i < 160; i += 1) px(c, rand() < 0.5 ? '#aeaca6' : '#c4c2bc', Math.floor(HD.market.x0 * T + rand() * (HD.market.x1 - HD.market.x0) * T), Math.floor(HD.rowC * T + rand() * (HD.sea - HD.rowC) * T), 3, 1);
  // 朝市前灑水的濕地面
  for (let i = 0; i < 6; i += 1) {
    c.fillStyle = 'rgba(90,110,130,0.18)';
    c.beginPath();
    c.ellipse((HD.market.x0 + 1.5 + i * 1.7) * T, (HD.rowC + 0.8 + (i % 2) * 0.9) * T, 14, 4, 0, 0, Math.PI * 2);
    c.fill();
  }
  const K = HD.kanemori;
  px(c, '#c9b9a2', K.x0 * T, HD.rowC * T, (K.x1 - K.x0) * T, (HD.sea - HD.rowC) * T);
  for (let y = HD.rowC * T, row = 0; y < SEA; y += 5, row += 1) {
    for (let x = K.x0 * T + (row % 2) * 4; x < K.x1 * T; x += 8) px(c, rand() < 0.5 ? '#bba98f' : '#d4c6b0', Math.round(x), Math.round(y), 7, 4);
  }
  // 港：水面
  const water = c.createLinearGradient(0, SEA, 0, MH);
  water.addColorStop(0, '#3f80ae');
  water.addColorStop(1, '#2a5e8a');
  c.fillStyle = water;
  c.fillRect(0, SEA, MW, MH - SEA);
  for (let i = 0; i < 160; i += 1) px(c, 'rgba(255,255,255,0.18)', Math.floor(rand() * MW), Math.floor(SEA + 6 + rand() * (MH - SEA - 8)), 4 + Math.floor(rand() * 8), 1);
  // 岸壁（花崗岩）
  px(c, '#8e8a82', 0, SEA - 3, MW, 6);
  px(c, '#cfcabf', 0, SEA - 3, MW, 2);
  px(c, 'rgba(0,0,0,0.25)', 0, SEA + 3, MW, 2);
  // 冬天：走的地方積雪，馬路中間被車壓過、只剩路邊的雪堆
  if (winter) {
    const snowOver = (x0: number, y0: number, x1: number, y1: number, a = 0.82) => {
      px(c, `rgba(244,247,251,${a})`, x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
      for (let i = 0; i < (x1 - x0) * (y1 - y0) * 3; i += 1) px(c, SNOW_SH, Math.floor(x0 * T + rand() * (x1 - x0) * T), Math.floor(y0 * T + rand() * (y1 - y0) * T), 3, 1);
    };
    snowOver(0, HD.rowB - 0.4, HD.W, HD.plaza.y1);
    snowOver(S.walk0, HD.foot, S.x0, HD.rowB2);
    snowOver(S.x1, HD.foot, S.walk1, HD.rowB2);
    snowOver(S.x0, HD.foot, S.x1, HD.rowB2, 0.7);
    // 坡道上的車輪痕
    for (const tx of [S.x0 + 1.4, S.x0 + 2, S.x1 - 2, S.x1 - 1.4]) px(c, 'rgba(120,118,112,0.55)', Math.round(tx * T), HD.foot * T, 3, (HD.rowB2 - HD.foot) * T);
    snowOver(0, HD.rowB2, HD.W, HD.road.y0);
    snowOver(0, R.y1, HD.W, HD.walkS);
    snowOver(HD.market.x1, HD.walkS, K.x0, HD.sea, 0.7);
    snowOver(0, HD.rowC, HD.W, HD.sea - 0.25, 0.75);
    for (let x = 0; x < MW; x += 3) {
      px(c, SNOW, x, Math.round(R.y0 * T), 3, 3 + Math.round(Math.abs(Math.sin(x * 0.11)) * 3));
      px(c, SNOW, x, Math.round(R.y1 * T) - 3 - Math.round(Math.abs(Math.sin(x * 0.07)) * 3), 3, 4);
    }
  }
}

// ── 函館山（背景）：山、山頂展望台、電視塔、山上的路；白天／晚上、夏／冬 ──
const SUM_X = 21.5 * T;
function ridgeY(x: number): number {
  const main = 134 * Math.exp(-(((x - SUM_X) / 300) ** 2));
  const east = 26 * Math.exp(-(((x - 650) / 110) ** 2));
  const west = 12 * Math.exp(-(((x - 90) / 80) ** 2));
  return FOOT - 12 - main - east - west;
}
const SUM_Y = Math.round(ridgeY(SUM_X));
const ANTENNAS = [SUM_X - 58, SUM_X + 66, SUM_X + 80];
// 山上的開車道（之字形，晚上路燈連成一條光）
const DRIVE: [number, number][] = [
  [560, 168],
  [452, 146],
  [540, 120],
  [430, 98],
  [486, 76],
  [396, 58],
  [SUM_X + 22, SUM_Y + 14],
];
function drivePoints(step: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < DRIVE.length - 1; i += 1) {
    const [ax, ay] = DRIVE[i] ?? [0, 0];
    const [bx, by] = DRIVE[i + 1] ?? [0, 0];
    const n = Math.max(1, Math.floor(Math.hypot(bx - ax, by - ay) / step));
    for (let k = 0; k < n; k += 1) out.push([ax + ((bx - ax) * k) / n, ay + ((by - ay) * k) / n]);
  }
  return out;
}
function mountainSprite(night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  const w = MW;
  const h = Math.round(HD.rowB * T);
  return cached(`hk-mt-${night ? 'n' : 'd'}-${ssn()}`, w, h, (c) => {
    const rand = seeded(334);
    const lit = seeded(1958);
    // 天空
    const sky = c.createLinearGradient(0, 0, 0, FOOT);
    if (night) {
      sky.addColorStop(0, '#060b20');
      sky.addColorStop(0.7, '#18224c');
      sky.addColorStop(1, '#2c2f5e');
    } else if (winter) {
      sky.addColorStop(0, '#9fb6cf');
      sky.addColorStop(1, '#e4ebf2');
    } else {
      sky.addColorStop(0, '#6aaee2');
      sky.addColorStop(1, '#dcecf6');
    }
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    if (night) {
      for (let i = 0; i < 110; i += 1) px(c, `rgba(255,255,255,${0.3 + lit() * 0.55})`, Math.floor(lit() * w), Math.floor(lit() * h * 0.7), 1, 1);
      c.fillStyle = '#fff4d4';
      c.beginPath();
      c.arc(w - 70, 26, 9, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#0a1028';
      c.beginPath();
      c.arc(w - 65, 23, 8, 0, Math.PI * 2);
      c.fill();
    } else {
      for (const [cx, cy, s] of [[90, 26, 1], [640, 22, 1.1], [820, 50, 0.8]] as const) {
        c.fillStyle = 'rgba(255,255,255,0.85)';
        for (const [dx, dy, rr] of [[0, 0, 10], [12, -4, 12], [26, 0, 9], [12, 4, 10]] as const) {
          c.beginPath();
          c.arc(cx + dx * s, cy + dy * s, rr * s, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    // 遠方的山（右邊，淡藍）
    c.fillStyle = night ? '#1a2244' : winter ? '#c3cfdc' : '#9fb4c8';
    c.beginPath();
    c.moveTo(560, h);
    for (let x = 560; x <= w; x += 4) c.lineTo(x, 112 - Math.sin((x - 560) * 0.012) * 26 - Math.sin(x * 0.05) * 3);
    c.lineTo(w, h);
    c.closePath();
    c.fill();
    if (winter && !night) for (let x = 600; x < w; x += 2) px(c, '#f0f4f8', x, Math.round(112 - Math.sin((x - 560) * 0.012) * 26 - Math.sin(x * 0.05) * 3), 2, 6);
    // 函館山
    for (let x = 0; x < w; x += 2) {
      const top = Math.round(ridgeY(x));
      const base = night ? '#121a2a' : winter ? '#e6ecf2' : '#4a7a46';
      px(c, base, x, top, 2, h - top);
      // 稜線的光
      px(c, night ? '#1e2a40' : winter ? '#ffffff' : '#6a9a58', x, top, 2, 2);
    }
    // 樹林的質感（冬天是雪地裡的針葉樹）
    for (let i = 0; i < 2600; i += 1) {
      const x = Math.floor(rand() * w);
      const top = ridgeY(x);
      const y = Math.floor(top + 3 + rand() * (h - top));
      if (y >= h) continue;
      const col = night
        ? rand() < 0.5 ? '#0e1522' : '#18223a'
        : winter
          ? rand() < 0.6 ? '#7c8f86' : '#a9b8b4'
          : ['#3d6a3c', '#5a8a4c', '#36603a', '#6a9a56'][Math.floor(rand() * 4)] ?? '#3d6a3c';
      if (winter && !night && rand() < 0.45) continue;
      px(c, col, x, y, 3, 2);
    }
    // 山腰的岩壁（立待岬那側的斷崖感）
    if (!night) {
      for (let k = 0; k < 6; k += 1) {
        const x = 150 + k * 24;
        const top = ridgeY(x) + 18;
        px(c, winter ? '#c9d2dc' : '#7a7a66', x, Math.round(top), 10, 4);
      }
    }
    // 山上的開車道
    const pts = drivePoints(3);
    for (const [x, y] of pts) px(c, night ? '#2a3448' : winter ? '#b9c4ce' : '#8a8a72', Math.round(x), Math.round(y), 2, 1);
    if (night) for (const [x, y] of drivePoints(9)) px(c, '#ffd98a', Math.round(x), Math.round(y) - 1, 2, 2);
    // 山腳的房子燈（晚上）
    if (night) {
      for (let i = 0; i < 320; i += 1) {
        const x = Math.floor(lit() * w);
        const top = ridgeY(x);
        const y = Math.floor(Math.max(top + 10, FOOT - 70 + Math.pow(lit(), 0.6) * 80));
        px(c, lit() < 0.7 ? '#ffd88a' : '#e8f0ff', x, y, 1 + Math.floor(lit() * 2), 1);
      }
    }
    // 山腳的樹叢
    for (let i = 0; i < 70; i += 1) {
      const x = rand() * w;
      const y = FOOT + 6 + rand() * (h - FOOT - 6);
      const rr = 5 + rand() * 6;
      c.fillStyle = night ? (rand() < 0.5 ? '#0c1220' : '#141c30') : winter ? (rand() < 0.5 ? '#e8eef4' : '#c9d4dc') : rand() < 0.5 ? '#3a6a38' : '#4e8044';
      c.beginPath();
      c.arc(x, y, rr, 0, Math.PI * 2);
      c.fill();
      if (winter && !night) px(c, SNOW, Math.round(x - rr / 2), Math.round(y - rr), Math.round(rr), 2);
    }
    // 八幡坂的坡道穿過山腳（挖空，讓地面畫的石板露出來）：越往上越窄，看起來是往山上延伸、不是一座牆
    {
      const full0 = HD.slope.walk0 * T;
      const full1 = HD.slope.walk1 * T;
      const mid = (full0 + full1) / 2;
      const taper = Math.round((h - FOOT) * 0.75);
      for (let y = FOOT; y < h; y += 2) {
        const k = Math.min(1, (y - FOOT) / taper);
        const half = ((full1 - full0) / 2) * (0.35 + 0.65 * k);
        c.clearRect(Math.round(mid - half), y, Math.round(half * 2), 2);
      }
    }
    // 電視塔（紅白的鐵塔）
    for (const ax of ANTENNAS) {
      const base = Math.round(ridgeY(ax)) + 2;
      const ht = ax === ANTENNAS[0] ? 40 : 30;
      for (let k = 0; k < ht; k += 1) {
        const half = Math.max(1, Math.round(5 - (k / ht) * 4));
        const band = Math.floor(k / 5) % 2 === 0;
        const col = night ? '#2a2f44' : band ? '#e04a3a' : '#f2f2ee';
        px(c, col, ax - half, base - k, 1, 1);
        px(c, col, ax + half, base - k, 1, 1);
        if (k % 5 === 0) px(c, col, ax - half, base - k, half * 2 + 1, 1);
      }
      px(c, night ? '#2a2f44' : '#e04a3a', ax, base - ht - 6, 1, 6);
    }
    // 山頂展望台（兩層的玻璃樓＋頂樓的觀景台）
    const sx = SUM_X;
    const sy = SUM_Y + 4;
    px(c, night ? '#2c3450' : '#d8dade', sx - 36, sy - 4, 72, 16);
    px(c, night ? '#ffe2a0' : '#7f9ab0', sx - 33, sy, 66, 6);
    for (let x = sx - 33; x < sx + 33; x += 6) px(c, night ? '#ffc870' : '#6a8498', x, sy, 1, 6);
    px(c, night ? '#3a4262' : '#eceef0', sx - 24, sy - 12, 48, 9);
    px(c, night ? '#fff0c4' : '#9ab4c8', sx - 21, sy - 10, 42, 4);
    px(c, night ? '#4a5272' : '#ffffff', sx - 38, sy - 5, 76, 2);
    px(c, night ? '#4a5272' : '#ffffff', sx - 26, sy - 13, 52, 2);
    for (let x = sx - 26; x < sx + 26; x += 3) px(c, night ? '#6a7292' : '#9aa0a8', x, sy - 16, 1, 3);
    px(c, night ? '#6a7292' : '#9aa0a8', sx - 26, sy - 16, 52, 1);
    if (winter && !night) {
      px(c, SNOW, sx - 37, sy - 7, 74, 2);
      px(c, SNOW, sx - 25, sy - 15, 50, 2);
    }
    // 纜車山頂站
    const tx = SUM_X + 34;
    const ty = Math.round(ridgeY(tx)) + 10;
    px(c, night ? '#283048' : '#c9ccd2', tx - 4, ty - 10, 26, 14);
    px(c, night ? '#ffd890' : '#5a6878', tx, ty - 6, 18, 4);
    px(c, night ? '#3a4262' : '#e8eaee', tx - 5, ty - 12, 28, 3);
  });
}

// ── 函館山纜車：兩條纜索、兩台車廂一上一下（用時間算）──
const RW = HD.ropeway;
const CABLE_A: [number, number] = [RW.x0 * T + 104, HD.rowB * T - 70];
const CABLE_B: [number, number] = [SUM_X + 36, Math.round(ridgeY(SUM_X + 36)) + 2];
const GONDOLA_LIGHTS: CityDef['lights'] = [0, 1].map(() => ({ x: -200, y: -200, r: 22, color: 'rgba(255, 225, 160, 0.7)' }));
const BEACONS: CityDef['lights'] = ANTENNAS.map((ax, k) => ({ x: ax, y: Math.round(ridgeY(ax)) + 2 - (k === 0 ? 46 : 36), r: 7, color: 'rgba(255, 60, 60, 0.9)' }));
function cablePoint(t: number, off: number): [number, number] {
  const [ax, ay] = CABLE_A;
  const [bx, by] = CABLE_B;
  const mx = (ax + bx) / 2;
  const my = (ay + by) / 2 + 10;
  const u = 1 - t;
  return [u * u * ax + 2 * u * t * mx + t * t * bx + off, u * u * ay + 2 * u * t * my + t * t * by + off * 0.6];
}
function drawRopeway(c: CanvasRenderingContext2D, d: DrawCtx): void {
  // 纜索
  for (const off of [-3, 3]) {
    c.strokeStyle = d.night ? 'rgba(150,160,190,0.55)' : 'rgba(60,64,72,0.8)';
    c.lineWidth = 1;
    c.beginPath();
    for (let k = 0; k <= 30; k += 1) {
      const [x, y] = cablePoint(k / 30, off);
      if (k === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
  }
  // 中間的支柱
  const [px0, py0] = cablePoint(0.42, 0);
  const pole = d.night ? '#3a4058' : '#8a9098';
  px(c, pole, Math.round(px0) - 1, Math.round(py0) - 2, 3, 44);
  px(c, pole, Math.round(px0) - 7, Math.round(py0) - 4, 15, 2);
  px(c, pole, Math.round(px0) - 4, Math.round(py0) + 40, 9, 2);
  // 車廂：一台往上、一台往下（大約 40 秒單程，在兩端停一下）
  const cycle = 96;
  const ph = (d.seconds % cycle) / cycle;
  const leg = ph < 0.5 ? ph * 2 : 2 - ph * 2;
  const e = Math.min(1, Math.max(0, (leg - 0.08) / 0.84));
  const p = e * e * (3 - 2 * e);
  [p, 1 - p].forEach((t, k) => {
    const off = k === 0 ? -3 : 3;
    const [gx0, gy0] = cablePoint(t, off);
    const gx = Math.round(gx0);
    const gy = Math.round(gy0);
    // 吊臂
    px(c, '#3a3d45', gx - 2, gy - 1, 5, 2);
    px(c, '#3a3d45', gx, gy, 1, 6);
    // 車廂（紅色、白色帶、大窗）
    px(c, '#c8302a', gx - 8, gy + 6, 16, 11);
    px(c, '#f4f2ec', gx - 8, gy + 13, 16, 2);
    px(c, d.night ? '#ffe8a8' : '#bcd8ea', gx - 7, gy + 8, 14, 4);
    px(c, '#8a201c', gx - 8, gy + 16, 16, 1);
    px(c, 'rgba(255,255,255,0.35)', gx - 8, gy + 6, 16, 1);
    const l = GONDOLA_LIGHTS[k];
    if (l) {
      l.x = gx;
      l.y = gy + 11;
    }
  });
  // 電視塔頂的紅燈（閃）
  if (d.night) {
    const on = Math.floor(d.seconds * 1.2) % 2 === 0;
    BEACONS.forEach((b) => {
      if (on) px(c, '#ff5a4a', Math.round(b.x) - 1, Math.round(b.y) - 1, 3, 3);
      b.color = on ? 'rgba(255, 60, 60, 0.9)' : 'rgba(255, 60, 60, 0.15)';
    });
  }
}

// ── 纜車山麓站 ──
const RW_W = Math.round((RW.x1 - RW.x0) * T);
const RW_H = 80;
function ropewaySprite(night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-rw-${night ? 'n' : 'd'}-${ssn()}`, RW_W, RW_H, (c) => {
    const w = RW_W;
    const h = RW_H;
    // 斜屋頂的機房（纜索從右上進來）
    poly(c, '#7a828c', [[56, 16], [w - 6, 4], [w - 6, 24], [56, 24]]);
    px(c, '#2a2e36', w - 30, 8, 18, 12);
    px(c, '#c8302a', w - 28, 12, 14, 7);
    px(c, night ? '#ffe2a0' : '#bcd8ea', w - 27, 13, 12, 3);
    if (winter) poly(c, SNOW, [[56, 14], [w - 6, 2], [w - 6, 6], [56, 18]]);
    // 主樓
    px(c, '#e6e2d8', 0, 24, w, h - 24);
    px(c, '#ffffff', 0, 24, w, 2);
    px(c, '#c9c3b6', 0, 44, w, 2);
    for (let x = 6; x < w - 6; x += 10) px(c, night ? '#ffe2a0' : '#5d7688', x, 30, 8, 11);
    // 招牌
    px(c, '#c8302a', 6, 48, w - 12, 11);
    text(c, '函館山ロープウェイ', w / 2, 53.5, '#ffffff', `900 7px ${FONT_TC}`, 'center', w - 18);
    text(c, '山麓駅 · ROPEWAY', w / 2, 63, '#3a3d45', `700 4px ${FONT_TC}`);
    // 入口（玻璃門）
    px(c, '#2a3a4a', 28, h - 14, w - 56, 14);
    for (let x = 30; x < w - 30; x += 12) px(c, night ? '#fff2c8' : '#9fd0ee', x, h - 12, 10, 12);
    px(c, '#3a3d45', 24, h - 16, w - 48, 2);
    // 左邊的售票窗、往山頂的海報
    px(c, night ? '#ffe2a0' : '#f4e6c8', 6, h - 14, 16, 10);
    px(c, '#18224c', w - 22, h - 15, 14, 11);
    for (const [x, y] of [[w - 20, h - 12], [w - 16, h - 10], [w - 12, h - 12], [w - 18, h - 8]] as const) px(c, '#ffd98a', x, y, 1, 1);
    if (winter) px(c, SNOW, 0, 22, 56, 3);
  });
}

// ── 函館東正教會：白牆、綠色銅板屋頂、鐘樓上的大洋蔥頂、屋頂上的小洋蔥頂 ──
const OR_W = Math.round((HD.orthodox.x1 - HD.orthodox.x0) * T);
const OR_H = 146;
function orthodoxSprite(night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-orth-${night ? 'n' : 'd'}-${ssn()}`, OR_W, OR_H, (c) => {
    const w = OR_W;
    const h = OR_H;
    const wall = '#f6f4ee';
    const shade = '#dcd8ce';
    const win = night ? '#ffd890' : '#3a4a52';
    // 本堂（右邊）：白牆、綠色的屋頂
    const n0 = 54;
    const n1 = w - 6;
    poly(c, COPPER, [[n0 - 2, h - 48], [n0 + 8, h - 62], [n1 - 8, h - 62], [n1 + 2, h - 48]]);
    px(c, COPPER_DARK, n0 - 2, h - 49, n1 - n0 + 4, 2);
    for (let x = n0 + 10; x < n1 - 8; x += 4) px(c, 'rgba(255,255,255,0.14)', x, h - 61, 1, 12);
    if (winter) poly(c, SNOW, [[n0 + 6, h - 58], [n0 + 8, h - 63], [n1 - 8, h - 63], [n1 - 6, h - 58]]);
    px(c, wall, n0, h - 48, n1 - n0, 44);
    px(c, shade, n1 - 30, h - 48, 30, 44);
    px(c, COPPER_DARK, n0, h - 47, n1 - n0, 2);
    // 本堂的拱窗
    for (let x = n0 + 8; x < n1 - 8; x += 15) {
      px(c, '#e8e2d4', x - 1, h - 40, 9, 22);
      px(c, win, x, h - 38, 7, 19);
      px(c, win, x + 1, h - 39, 5, 1);
      px(c, night ? '#ffeab8' : '#5a6a72', x + 3, h - 38, 1, 19);
    }
    // 屋頂上的兩個小洋蔥頂（鼓座是白的）
    for (const [dx, dw] of [[0.42, 16], [0.8, 20]] as const) {
      const cx = Math.round(n0 + (n1 - n0) * dx);
      const dh = dw === 20 ? 18 : 14;
      px(c, wall, cx - dw / 2 + 3, h - 62 - dh, dw - 6, dh);
      px(c, shade, cx + 1, h - 62 - dh, dw / 2 - 3, dh);
      for (let k = -1; k <= 1; k += 1) px(c, win, cx + k * 4 - 1, h - 62 - dh + 4, 2, 6);
      px(c, COPPER_DARK, cx - dw / 2 + 2, h - 62 - dh - 2, dw - 4, 2);
      onionDome(c, cx, h - 62 - dh - 2, dw, winter);
    }
    // 鐘樓（左邊）：方形的基座、鐘的那層、八角形的鼓座、大洋蔥頂
    const t0 = 8;
    const t1 = 56;
    const tc = (t0 + t1) / 2;
    px(c, wall, t0, h - 72, t1 - t0, 72);
    px(c, shade, t1 - 12, h - 72, 12, 72);
    px(c, COPPER_DARK, t0 - 2, h - 74, t1 - t0 + 4, 3);
    // 入口：拱門、綠色的門
    px(c, '#e8e2d4', tc - 9, h - 28, 18, 26);
    px(c, '#3f7a62', tc - 7, h - 25, 14, 23);
    px(c, '#3f7a62', tc - 5, h - 27, 10, 2);
    px(c, '#2f5e4a', tc, h - 25, 1, 23);
    px(c, '#c9c3b6', tc - 12, h - 3, 24, 3);
    // 基座的窗、上面的小三角山牆
    px(c, '#e8e2d4', tc - 4, h - 54, 8, 16);
    px(c, win, tc - 3, h - 52, 6, 13);
    poly(c, COPPER, [[tc - 10, h - 58], [tc, h - 64], [tc + 10, h - 58]]);
    // 鐘的那層（窄一點、拱形開口裡看得到鐘）
    const b0 = t0 + 6;
    const b1 = t1 - 6;
    poly(c, COPPER, [[t0 - 2, h - 74], [b0, h - 80], [b1, h - 80], [t1 + 2, h - 74]]);
    if (winter) poly(c, SNOW, [[t0, h - 75], [b0, h - 80], [b1, h - 80], [t1, h - 75]]);
    px(c, wall, b0, h - 100, b1 - b0, 20);
    px(c, shade, b1 - 8, h - 100, 8, 20);
    for (const x of [b0 + 5, tc - 3, b1 - 11]) {
      px(c, '#2a2e36', x, h - 96, 6, 12);
      px(c, '#c8a040', x + 1, h - 92, 4, 4);
      px(c, '#2a2e36', x + 1, h - 97, 4, 1);
    }
    px(c, COPPER_DARK, b0 - 2, h - 102, b1 - b0 + 4, 3);
    poly(c, COPPER, [[b0 - 2, h - 102], [b0 + 4, h - 108], [b1 - 4, h - 108], [b1 + 2, h - 102]]);
    // 八角鼓座＋大洋蔥頂
    px(c, wall, tc - 7, h - 116, 14, 9);
    px(c, shade, tc + 2, h - 116, 5, 9);
    px(c, win, tc - 4, h - 114, 2, 5);
    px(c, win, tc + 2, h - 114, 2, 5);
    onionDome(c, tc, h - 116, 20, winter);
    // 前面的白色圍牆＋綠色鐵門
    px(c, wall, 0, h - 6, w, 6);
    px(c, COPPER_DARK, 0, h - 7, w, 1);
    for (let x = 4; x < w; x += 10) px(c, '#d8d4ca', x, h - 6, 1, 6);
  });
}

// ── 舊函館區公會堂：藍灰色的牆、黃色的窗框和柱子、中間的陽台、灰色的屋頂和老虎窗 ──
const HL_W = Math.round((HD.hall.x1 - HD.hall.x0) * T);
const HL_H = 104;
function hallSprite(night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-hall-${night ? 'n' : 'd'}-${ssn()}`, HL_W, HL_H, (c) => {
    const w = HL_W;
    const h = HL_H;
    const blue = '#8ea6c2';
    const blueDark = '#7389a6';
    const yellow = '#ecc64e';
    const yellowDark = '#c9a23a';
    const cx = Math.round(w / 2);
    const win = night ? '#ffd890' : '#34424e';
    // 屋頂（灰色的斜屋頂）＋老虎窗
    poly(c, '#5f6670', [[0, 34], [12, 16], [w - 12, 16], [w, 34]]);
    for (let y = 18; y < 34; y += 3) px(c, 'rgba(255,255,255,0.08)', 6, y, w - 12, 1);
    if (winter) poly(c, SNOW, [[6, 26], [12, 15], [w - 12, 15], [w - 6, 26]]);
    for (const x of [26, 58, w - 66, w - 34]) {
      px(c, blue, x, 20, 10, 10);
      poly(c, '#5f6670', [[x - 2, 21], [x + 5, 15], [x + 12, 21]]);
      px(c, win, x + 2, 23, 6, 6);
      px(c, yellow, x + 1, 22, 8, 1);
      if (winter) poly(c, SNOW, [[x - 1, 20], [x + 5, 15], [x + 11, 20]]);
    }
    // 牆
    px(c, blue, 0, 34, w, h - 34);
    px(c, blueDark, 0, 34, w, 2);
    // 黃色的柱子（壁柱）、樓層之間的帶
    for (let x = 0; x < w; x += 28) px(c, yellow, Math.min(x, w - 4), 34, 4, h - 40);
    px(c, yellow, 0, 34, w, 3);
    px(c, yellow, 0, 64, w, 3);
    px(c, yellowDark, 0, 67, w, 1);
    // 窗（黃色窗框、上下推的窗）
    const winAt = (x: number, y: number, hh: number) => {
      px(c, yellow, x - 2, y - 2, 12, hh + 4);
      px(c, win, x, y, 8, hh);
      px(c, yellow, x, y + Math.floor(hh / 2), 8, 1);
      px(c, yellow, x + 4, y, 1, hh);
      px(c, yellowDark, x - 3, y + hh + 2, 14, 1);
    };
    for (let x = 10; x < w - 10; x += 28) {
      if (Math.abs(x + 4 - cx) < 30) continue;
      winAt(x, 42, 16);
      winAt(x, 74, 18);
    }
    // 中間凸出來的玄關：上面三角山牆、二樓陽台、一樓列柱
    const p0 = cx - 30;
    const p1 = cx + 30;
    px(c, '#9ab2cc', p0, 30, p1 - p0, h - 30);
    poly(c, '#9ab2cc', [[p0 - 4, 30], [cx, 8], [p1 + 4, 30]]);
    c.strokeStyle = yellow;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(p0 - 4, 30);
    c.lineTo(cx, 8);
    c.lineTo(p1 + 4, 30);
    c.closePath();
    c.stroke();
    if (winter) poly(c, SNOW, [[p0 - 5, 29], [cx, 6], [p1 + 5, 29], [cx, 10]]);
    // 山牆裡的圓窗（裝飾）
    c.fillStyle = yellow;
    c.beginPath();
    c.arc(cx, 22, 5, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = win;
    c.beginPath();
    c.arc(cx, 22, 3, 0, Math.PI * 2);
    c.fill();
    // 二樓：三扇高的窗＋陽台
    for (const x of [p0 + 8, cx - 4, p1 - 16]) winAt(x, 40, 18);
    px(c, yellow, p0 - 4, 60, p1 - p0 + 8, 4);
    px(c, '#f6f4ee', p0 - 4, 52, p1 - p0 + 8, 1);
    for (let x = p0 - 3; x < p1 + 4; x += 3) px(c, '#f6f4ee', x, 52, 1, 8);
    px(c, '#f6f4ee', p0 - 4, 59, p1 - p0 + 8, 1);
    // 一樓：四根柱子（黃色、柱頭白）、中間的門
    px(c, night ? '#5a4a3a' : '#6c7f96', p0, 68, p1 - p0, h - 76);
    for (const x of [p0 + 2, p0 + 18, p1 - 22, p1 - 6]) {
      px(c, yellow, x, 66, 4, h - 74);
      px(c, '#f6f4ee', x - 1, 65, 6, 2);
      px(c, yellowDark, x + 3, 67, 1, h - 75);
    }
    px(c, night ? '#ffd27a' : '#4a3a2a', cx - 8, 74, 16, h - 82);
    px(c, night ? '#fff0c0' : '#c8a46a', cx - 6, 76, 5, h - 86);
    px(c, night ? '#fff0c0' : '#c8a46a', cx + 1, 76, 5, h - 86);
    // 正面的石階
    for (let k = 0; k < 4; k += 1) px(c, k % 2 ? '#c9c3b6' : '#ddd8cc', p0 - 6 - k * 2, h - 8 + k * 2, p1 - p0 + 12 + k * 4, 2);
    // 基座
    px(c, '#b9b2a4', 0, h - 8, p0 - 6, 8);
    px(c, '#b9b2a4', p1 + 6, h - 8, w - p1 - 6, 8);
    px(c, '#d4cec2', 0, h - 8, w, 1);
  });
}

// ── 天主教元町教會：哥德式、米白的牆、尖塔頂上有公雞風向計 ──
const CA_W = Math.round((HD.catholic.x1 - HD.catholic.x0) * T);
const CA_H = 132;
function catholicSprite(night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-cath-${night ? 'n' : 'd'}-${ssn()}`, CA_W, CA_H, (c) => {
    const w = CA_W;
    const h = CA_H;
    const wall = '#ece4d2';
    const shade = '#d6ccb6';
    const roof = '#5a6c74';
    const cx = Math.round(w / 2);
    // 兩邊的本堂（灰綠屋頂）
    poly(c, roof, [[4, h - 56], [14, h - 70], [w - 14, h - 70], [w - 4, h - 56]]);
    if (winter) poly(c, SNOW, [[10, h - 64], [14, h - 71], [w - 14, h - 71], [w - 10, h - 64]]);
    px(c, wall, 6, h - 56, w - 12, 56);
    px(c, shade, w - 30, h - 56, 24, 56);
    // 尖拱窗（彩色玻璃）
    const glass = ['#c8402a', '#2a5aa8', '#e8b030', '#3a8a5a'];
    for (let x = 12, k = 0; x < w - 14; x += 14, k += 1) {
      if (Math.abs(x + 3 - cx) < 22) continue;
      poly(c, '#d8ceb8', [[x - 1, h - 22], [x - 1, h - 42], [x + 3.5, h - 48], [x + 8, h - 42], [x + 8, h - 22]]);
      poly(c, night ? '#ffcf80' : glass[k % 4] ?? '#2a5aa8', [[x, h - 23], [x, h - 41], [x + 3.5, h - 46], [x + 7, h - 41], [x + 7, h - 23]]);
      px(c, night ? '#fff0c0' : 'rgba(255,255,255,0.3)', x + 3, h - 42, 1, 19);
    }
    // 扶壁
    for (const x of [6, w - 10]) px(c, shade, x, h - 50, 4, 50);
    // 鐘樓：方形、三層，上面八角形的尖塔
    const t0 = cx - 18;
    const t1 = cx + 18;
    px(c, wall, t0, h - 92, t1 - t0, 92);
    px(c, shade, t1 - 8, h - 92, 8, 92);
    px(c, '#c9bea6', t0 - 2, h - 62, t1 - t0 + 4, 2);
    px(c, '#c9bea6', t0 - 2, h - 92, t1 - t0 + 4, 3);
    // 入口（尖拱的大門）
    poly(c, '#d8ceb8', [[cx - 10, h], [cx - 10, h - 22], [cx, h - 34], [cx + 10, h - 22], [cx + 10, h]]);
    poly(c, '#5a3a2a', [[cx - 8, h], [cx - 8, h - 21], [cx, h - 31], [cx + 8, h - 21], [cx + 8, h]]);
    px(c, '#3a2418', cx, h - 30, 1, 30);
    // 玫瑰窗、鐘樓的窗
    c.fillStyle = '#d8ceb8';
    c.beginPath();
    c.arc(cx, h - 48, 7, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = night ? '#ffcf80' : '#2a5aa8';
    c.beginPath();
    c.arc(cx, h - 48, 5, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 6; k += 1) px(c, night ? '#fff0c0' : '#e8b030', Math.round(cx + Math.cos(k) * 3), Math.round(h - 48 + Math.sin(k) * 3), 1, 1);
    for (const x of [cx - 9, cx + 4]) {
      poly(c, '#2a2e36', [[x, h - 66], [x, h - 82], [x + 2.5, h - 86], [x + 5, h - 82], [x + 5, h - 66]]);
    }
    // 角上的小尖塔
    for (const x of [t0 - 2, t1 - 2]) {
      poly(c, roof, [[x - 1, h - 92], [x + 2, h - 104], [x + 5, h - 92]]);
      if (winter) poly(c, SNOW, [[x, h - 97], [x + 2, h - 104], [x + 4, h - 97]]);
    }
    // 主尖塔
    poly(c, roof, [[t0 + 2, h - 92], [cx, 8], [t1 - 2, h - 92]]);
    poly(c, '#4a5a62', [[cx, 8], [t1 - 2, h - 92], [cx + 4, h - 92]]);
    for (let y = 20; y < h - 92; y += 6) {
      const half = ((y - 8) / (h - 100)) * 16;
      px(c, 'rgba(255,255,255,0.12)', Math.round(cx - half), y, Math.round(half * 2), 1);
    }
    if (winter) poly(c, SNOW, [[cx - 3, 24], [cx, 8], [cx + 3, 24], [cx, 20]]);
    // 頂端：十字架＋公雞風向計
    px(c, '#c8a040', cx, 0, 1, 9);
    px(c, '#c8a040', cx - 2, 3, 5, 1);
    px(c, '#c8a040', cx + 1, 0, 3, 2);
    px(c, '#c8a040', cx + 3, 1, 1, 2);
  });
}

// ── 和洋折衷的老房子：一樓和式（格子門）、二樓洋式（雨淋板、上下推的窗）──
const HOUSE_H = 76;
const HOUSE_WALL: Record<HouseKind, string> = {
  green: '#a9cfb0',
  pink: '#ecbcb4',
  yellow: '#efd890',
  blue: '#a9c4dc',
  cream: '#efe4c8',
  ramen: '#c8dcc4',
};
function houseSprite(kind: HouseKind, w: number, night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-house-${kind}-${w}-${night ? 'n' : 'd'}-${ssn()}`, w, HOUSE_H, (c) => {
    const h = HOUSE_H;
    const wall = HOUSE_WALL[kind];
    // 屋頂（灰藍的瓦）
    poly(c, '#56606c', [[0, 20], [6, 6], [w - 6, 6], [w, 20]]);
    for (let y = 8; y < 20; y += 3) px(c, 'rgba(255,255,255,0.1)', 3, y, w - 6, 1);
    px(c, '#3e4650', 4, 5, w - 8, 2);
    if (winter) {
      poly(c, SNOW, [[2, 15], [6, 4], [w - 6, 4], [w - 2, 15]]);
      for (let x = 4; x < w - 4; x += 5) px(c, SNOW_SH, x, 14, 3, 2);
    }
    // 二樓：雨淋板
    px(c, wall, 2, 20, w - 4, 26);
    for (let y = 22; y < 46; y += 3) px(c, 'rgba(0,0,0,0.08)', 2, y, w - 4, 1);
    px(c, '#f6f4ee', 2, 20, 2, 26);
    px(c, '#f6f4ee', w - 4, 20, 2, 26);
    const n = Math.max(2, Math.floor((w - 8) / 22));
    for (let k = 0; k < n; k += 1) {
      const x = Math.round(4 + ((k + 0.5) * (w - 8)) / n - 5);
      px(c, '#f6f4ee', x - 1, 24, 12, 17);
      px(c, night ? (k % 3 === 1 ? '#3a4050' : '#ffd98a') : '#3a4a5a', x, 25, 10, 15);
      px(c, '#f6f4ee', x, 32, 10, 1);
      px(c, '#f6f4ee', x + 5, 25, 1, 15);
    }
    // 一樓上面的小屋簷
    px(c, '#4a525c', 0, 46, w, 4);
    px(c, 'rgba(255,255,255,0.15)', 0, 46, w, 1);
    if (winter) px(c, SNOW, 0, 45, w, 2);
    // 一樓：深色木頭、格子
    px(c, '#5a3e2a', 2, 50, w - 4, h - 52);
    for (let x = 4; x < w - 4; x += 3) px(c, '#76563c', x, 52, 1, h - 56);
    px(c, '#4a3220', 2, 50, w - 4, 2);
    // 石頭的基座
    px(c, '#9a948a', 0, h - 3, w, 3);
    if (kind === 'ramen') {
      // 拉麵店：玻璃拉門、藍色的暖簾、二樓的招牌
      const dx = Math.round(w / 2);
      px(c, night ? '#ffd890' : '#e8dcc0', dx - 14, 54, 28, h - 57);
      px(c, '#5a3e2a', dx, 54, 1, h - 57);
      px(c, '#1f3e6e', dx - 15, 52, 30, 10);
      for (let x = dx - 15; x < dx + 15; x += 6) px(c, '#16305a', x + 5, 52, 1, 10);
      text(c, '塩', dx - 7, 57, '#ffffff', `900 6px ${SERIF_TC}`);
      text(c, 'ら', dx + 1, 57, '#ffffff', `900 6px ${SERIF_TC}`);
      text(c, '〜', dx + 9, 57, '#ffffff', `900 5px ${SERIF_TC}`);
      px(c, '#2a2624', dx - 24, 41, 48, 10);
      px(c, '#c8a040', dx - 24, 41, 48, 1);
      text(c, '函館 塩らーめん', dx, 46.5, '#f4ecd8', `900 6px ${SERIF_TC}`, 'center', 44);
      // 門口的紅燈籠
      for (const lx of [dx - 20, dx + 18]) {
        px(c, '#c8302a', lx, 54, 4, 7);
        px(c, night ? '#ffb070' : '#e85a4a', lx + 1, 55, 2, 5);
      }
    } else {
      // 一般的老房子：格子拉門、門口的盆栽
      const dx = Math.round(w * 0.3);
      px(c, night ? '#e8b870' : '#3a2a1c', dx, 54, 14, h - 57);
      for (let x = dx + 2; x < dx + 14; x += 3) px(c, night ? '#c89048' : '#6a4a30', x, 54, 1, h - 57);
      px(c, night ? '#ffd890' : '#c8c0a8', Math.round(w * 0.62), 55, 12, 9);
      px(c, '#5a3e2a', Math.round(w * 0.62) + 6, 55, 1, 9);
      px(c, '#3f7a3a', Math.round(w * 0.62) + 14, h - 10, 6, 6);
      px(c, '#8a5a3a', Math.round(w * 0.62) + 15, h - 5, 4, 3);
    }
  });
}

// ── 八幡坂的行道樹（冬天積雪；冬天晚上掛燈泡：はこだてイルミネーション）──
function drawSlopeTree(c: CanvasRenderingContext2D, x: number, y: number, d: DrawCtx): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const winter = hakodateWinter();
  px(c, 'rgba(0,0,0,0.2)', cx - 7, by - 1, 14, 3);
  px(c, '#5c3d22', cx - 1, by - 18, 3, 18);
  if (winter) {
    // 落葉的枝條＋雪
    c.strokeStyle = '#5c3d22';
    c.lineWidth = 1;
    for (const [dx, dy] of [[-8, -30], [8, -30], [-4, -36], [4, -36], [0, -38], [-10, -24], [10, -24]] as const) {
      c.beginPath();
      c.moveTo(cx, by - 16);
      c.lineTo(cx + dx, by + dy);
      c.stroke();
    }
    for (const [dx, dy] of [[-8, -30], [8, -30], [-4, -36], [4, -36], [0, -38], [-10, -24], [10, -24]] as const) px(c, SNOW, cx + dx - 1, by + dy - 1, 3, 2);
    // 晚上的燈飾（金色的燈泡沿著枝條）
    if (d.night) {
      for (let k = 0; k < 16; k += 1) {
        const a = (k / 16) * Math.PI * 2;
        const rr = 6 + (k % 3) * 3;
        const tw = (Math.floor(d.seconds * 2) + k) % 5 === 0;
        px(c, tw ? '#ffffff' : '#ffd86a', Math.round(cx + Math.cos(a) * rr), Math.round(by - 28 + Math.sin(a) * rr * 0.8), 1, 1);
      }
    }
    return;
  }
  const cols = ['#3f7a3c', '#4e8a46', '#5c9a52', '#356a34'];
  for (const [dx, dy, r, k] of [[-5, -22, 7, 0], [5, -22, 7, 3], [0, -28, 8, 1], [0, -20, 6, 2]] as const) {
    c.fillStyle = cols[k] ?? '#3f7a3c';
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#7ab86a', cx - 3, by - 33, 3, 2);
}

// 復古的路燈（黑色的柱子、燈籠形的燈罩）
function drawHkLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  px(c, '#23262c', cx - 2, by - 4, 5, 4);
  px(c, '#2c3038', cx, by - 32, 2, 29);
  px(c, '#23262c', cx - 2, by - 33, 6, 2);
  px(c, '#23262c', cx - 3, by - 42, 8, 9);
  px(c, night ? '#ffe7a0' : '#efe8cf', cx - 2, by - 41, 6, 7);
  px(c, night ? '#fff6d0' : '#ffffff', cx - 1, by - 40, 1, 3);
  poly(c, '#23262c', [[cx - 4, by - 42], [cx + 1, by - 46], [cx + 6, by - 42]]);
  if (hakodateWinter()) px(c, SNOW, cx - 3, by - 45, 8, 2);
}

// 八幡坂的石碑
function drawSlopeMarker(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 5, by - 1, 10, 2);
  px(c, '#8a867e', cx - 4, by - 22, 8, 22);
  px(c, '#a8a49a', cx - 4, by - 22, 8, 2);
  px(c, '#6a665e', cx + 2, by - 20, 2, 20);
  ['八', '幡', '坂'].forEach((ch, k) => text(c, ch, cx - 1, by - 17 + k * 6, '#2a2624', `900 5px ${SERIF_TC}`));
}

// ── 市電：復古的箱型電車（往東）、一般的電車（往西），架空線 ──
const TRAM_LIGHTS: CityDef['lights'] = [0, 1].map(() => ({ x: -300, y: -300, r: 30, color: 'rgba(255, 225, 160, 0.5)' }));
function tramX(seconds: number, dir: 1 | -1, speed: number, offset: number): number {
  const span = MW + 900;
  const k = (seconds * speed + offset) % span;
  return dir > 0 ? k - 200 : MW + 200 - k;
}
function drawTram(c: CanvasRenderingContext2D, d: DrawCtx, retro: boolean): void {
  const y = Math.round((retro ? HD.tram.east : HD.tram.west) * T);
  const dir: 1 | -1 = retro ? 1 : -1;
  const x = Math.round(tramX(d.seconds, dir, retro ? 18 : 24, retro ? 0 : 520));
  const len = retro ? 58 : 66;
  const x0 = x - len / 2;
  const light = TRAM_LIGHTS[retro ? 0 : 1];
  if (light) {
    light.x = x + (dir * len) / 2;
    light.y = y - 8;
  }
  if (x0 > MW + 10 || x0 + len < -10) return;
  c.save();
  c.beginPath();
  c.rect(0, 0, MW, MH);
  c.clip();
  px(c, 'rgba(0,0,0,0.3)', x0 + 2, y, len - 4, 2);
  if (retro) {
    // 箱型的復古電車（深綠的車身、奶油色的窗帶、兩端開放的乘降台、頂上的集電桿）
    px(c, '#2f5a3e', x0 + 6, y - 22, len - 12, 20);
    px(c, '#efe2c0', x0 + 6, y - 19, len - 12, 8);
    for (let wx = x0 + 9; wx < x0 + len - 10; wx += 7) px(c, d.night ? '#ffe2a0' : '#4a5a62', wx, y - 18, 5, 6);
    px(c, '#c8a040', x0 + 6, y - 10, len - 12, 1);
    // 屋頂（圓弧）＋天窗
    px(c, '#3a2e26', x0 + 4, y - 26, len - 8, 4);
    px(c, '#4a3a30', x0 + 12, y - 28, len - 24, 2);
    // 乘降台
    for (const ex of [x0, x0 + len - 6]) {
      px(c, '#2f5a3e', ex, y - 10, 6, 8);
      px(c, '#3a2e26', ex, y - 23, 1, 13);
      px(c, '#3a2e26', ex + 5, y - 23, 1, 13);
    }
    // 集電桿（斜的）
    c.strokeStyle = '#2a2a2e';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - dir * 8, y - 28);
    c.lineTo(x - dir * 22, y - 38);
    c.stroke();
    px(c, d.night ? '#fff2c0' : '#e8e0c8', x0 + (dir > 0 ? len - 3 : 0), y - 8, 3, 3);
  } else {
    // 一般的電車（白色、綠色和黃色的帶、菱形的集電弓）
    px(c, '#f2f0ea', x0, y - 22, len, 20);
    px(c, '#2f8a5a', x0, y - 8, len, 4);
    px(c, '#e8b830', x0, y - 10, len, 2);
    for (let wx = x0 + 4; wx < x0 + len - 6; wx += 8) px(c, d.night ? '#ffe8b0' : '#3a4a5a', wx, y - 19, 6, 7);
    px(c, '#d8d6d0', x0, y - 24, len, 2);
    px(c, '#2a2a2e', x0 + 8, y - 3, 8, 2);
    px(c, '#2a2a2e', x0 + len - 16, y - 3, 8, 2);
    c.strokeStyle = '#2a2a2e';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - 6, y - 24);
    c.lineTo(x, y - 32);
    c.lineTo(x + 6, y - 24);
    c.stroke();
    px(c, '#2a2a2e', x - 5, y - 33, 10, 1);
    px(c, '#1f2a44', x0 + (dir > 0 ? len - 10 : 2), y - 21, 8, 3);
    text(c, '湯の川', x0 + (dir > 0 ? len - 6 : 6), y - 19.5, '#ffd86a', `700 3px ${FONT_TC}`);
    px(c, d.night ? '#fff2c0' : '#e8e0c8', x0 + (dir > 0 ? len - 3 : 0), y - 7, 3, 3);
  }
  c.restore();
}
// 架空線：南邊人行道上的電線桿伸出橫桿，掛著兩條電車線
const WIRE_POLES = [2, 11, 20, 35.4, 44.6, 54];
const WIRE_POLE_Y = HD.road.y1 + 0.7;
function drawWires(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const wy = [HD.tram.west * T - 33, HD.tram.east * T - 33];
  c.strokeStyle = d.night ? 'rgba(120,130,160,0.6)' : 'rgba(40,42,48,0.7)';
  c.lineWidth = 1;
  for (const y of wy) {
    c.beginPath();
    c.moveTo(0, Math.round(y) + 0.5);
    c.lineTo(MW, Math.round(y) + 0.5);
    c.stroke();
  }
  for (const x of WIRE_POLES) {
    const cx = Math.round(x * T);
    const by = Math.round(WIRE_POLE_Y * T);
    px(c, 'rgba(0,0,0,0.2)', cx - 2, by - 1, 6, 2);
    px(c, '#6a6e76', cx, Math.round(wy[0] ?? 0) - 4, 3, by - Math.round(wy[0] ?? 0) + 4);
    px(c, '#6a6e76', cx - 40, Math.round(wy[0] ?? 0) - 4, 43, 1);
    c.beginPath();
    c.moveTo(cx, Math.round(wy[0] ?? 0) + 4);
    c.lineTo(cx - 30, Math.round(wy[0] ?? 0) - 3);
    c.stroke();
  }
}

// ── JR 函館站：大片玻璃的站房、三角屋頂 ──
const ST_W = Math.round((HD.station.x1 - HD.station.x0) * T);
const ST_H = 92;
function stationSprite(night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-station-${night ? 'n' : 'd'}-${ssn()}`, ST_W, ST_H, (c) => {
    const w = ST_W;
    const h = ST_H;
    const cx = Math.round(w / 2);
    // 兩翼
    px(c, '#e6e4de', 0, 30, w, h - 30);
    px(c, '#ffffff', 0, 30, w, 2);
    for (let y = 40; y < h - 24; y += 9) for (let x = 6; x < w - 6; x += 10) if (Math.abs(x + 4 - cx) > 40) px(c, night ? '#cfe4ff' : '#7f98ac', x, y, 8, 5);
    if (winter) px(c, SNOW, 0, 28, w, 3);
    // 中間的玻璃大廳（三角屋頂）
    poly(c, '#b8bec6', [[cx - 44, 14], [cx, 2], [cx + 44, 14]]);
    if (winter) poly(c, SNOW, [[cx - 42, 13], [cx, 1], [cx + 42, 13], [cx, 5]]);
    px(c, night ? '#ffe9b8' : '#8fb0c8', cx - 40, 14, 80, h - 14);
    for (let x = cx - 40; x <= cx + 40; x += 10) px(c, '#d8dde2', x, 14, 1, h - 14);
    for (let y = 22; y < h; y += 12) px(c, '#d8dde2', cx - 40, y, 80, 1);
    px(c, '#ffffff', cx - 42, 13, 84, 2);
    // 站名的牌子
    px(c, '#f8f9fa', cx - 36, 32, 72, 14);
    px(c, '#3aa84a', cx - 33, 34, 12, 10);
    text(c, 'JR', cx - 27, 39, '#ffffff', `900 6px ${FONT_TC}`);
    text(c, '函館駅', cx + 6, 38, '#1f2a44', `900 9px ${FONT_TC}`);
    text(c, 'HAKODATE', cx + 6, 44, '#1f2a44', `700 3px ${FONT_TC}`);
    // 時鐘
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(22, 48, 7, 0, Math.PI * 2);
    c.fill();
    px(c, '#2a2e36', 22, 43, 1, 5);
    px(c, '#2a2e36', 22, 48, 4, 1);
    // 入口
    px(c, '#2a3a4a', cx - 30, h - 18, 60, 18);
    for (let x = cx - 28; x < cx + 28; x += 11) px(c, night ? '#fff2c8' : '#a8d8f4', x, h - 16, 9, 16);
    px(c, '#3aa84a', cx - 32, h - 20, 64, 2);
    // 兩翼的店
    px(c, night ? '#ffe2a0' : '#f4e6c8', 8, h - 18, 30, 14);
    px(c, '#c8302a', 8, h - 20, 30, 3);
    px(c, night ? '#ffe2a0' : '#f4e6c8', w - 38, h - 18, 30, 14);
    px(c, '#1f5fa8', w - 38, h - 20, 30, 3);
  });
}

// ── 函館朝市：長長的市場棚、招牌、攤子裡的帝王蟹和海鮮、東邊是丼飯屋 ──
const MK_W = Math.round((HD.market.x1 - HD.market.x0) * T);
const MK_H = 72;
function marketSprite(night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-market-${night ? 'n' : 'd'}-${ssn()}`, MK_W, MK_H, (c) => {
    const w = MK_W;
    const h = MK_H;
    const rand = seeded(1945);
    // 屋頂、招牌
    px(c, '#6a5a4a', 0, 8, w, 14);
    px(c, '#f6f2e8', 6, 2, w - 12, 16);
    px(c, '#c8302a', 6, 2, w - 12, 2);
    px(c, '#c8302a', 6, 16, w - 12, 2);
    text(c, '函館朝市', w / 2 - 14, 10, '#c8302a', `900 11px ${SERIF_TC}`);
    text(c, 'MORNING MARKET', w / 2 + 50, 10, '#3a3d45', `700 4px ${FONT_TC}`);
    if (winter) px(c, SNOW, 4, 0, w - 8, 3);
    // 屋簷
    px(c, '#4a3e32', 0, 22, w, 4);
    // 裡面
    px(c, night ? '#5a4632' : '#3a3430', 0, 26, w, h - 26);
    // 攤子的遮陽棚（西邊兩攤：藍白、紅白；東邊丼飯屋：深藍的暖簾）
    const split = Math.round(w * 0.56);
    for (let x = 0; x < split; x += 6) px(c, (x / 6) % 2 < 1 ? (x < split / 2 ? '#1f5fa8' : '#c8302a') : '#f4f1e8', x, 26, 6, 6);
    px(c, 'rgba(0,0,0,0.2)', 0, 32, split, 1);
    px(c, '#1f2a4a', split, 26, w - split, 12);
    for (let x = split + 6; x < w; x += 10) px(c, '#16203a', x, 26, 1, 12);
    text(c, '朝市食堂', split + (w - split) / 2, 31.5, '#ffffff', `900 6px ${SERIF_TC}`);
    // 掛著的燈泡
    for (let x = 8; x < w; x += 16) {
      px(c, '#2a2a2e', x, 33, 1, 3);
      px(c, night ? '#fff0b0' : '#e8e4d0', x - 1, 36, 3, 3);
    }
    // 西邊：保麗龍箱裡的帝王蟹、毛蟹、鮭魚、干貝
    px(c, '#9aa3b2', 4, h - 22, split - 8, 4);
    px(c, '#d6dae2', 4, h - 22, split - 8, 1);
    px(c, '#c9ccd6', 4, h - 18, split - 8, 18);
    for (let x = 6; x < split - 14; x += 14) {
      px(c, '#f4f6f8', x, h - 28, 12, 6);
      const kind = Math.floor(rand() * 4);
      if (kind === 0) {
        // 帝王蟹（紅、長腳）
        px(c, '#d8402a', x + 3, h - 30, 6, 3);
        for (let k = 0; k < 3; k += 1) {
          px(c, '#d8402a', x + 1 - k, h - 29 + k, 2, 1);
          px(c, '#d8402a', x + 9 + k, h - 29 + k, 2, 1);
        }
      } else if (kind === 1) {
        // 毛蟹（褐色、圓）
        px(c, '#a8603a', x + 3, h - 30, 6, 4);
        px(c, '#8a4a2a', x + 2, h - 28, 8, 1);
      } else if (kind === 2) {
        // 鮭魚
        px(c, '#e87a52', x + 1, h - 28, 10, 2);
        px(c, '#f4a07a', x + 1, h - 28, 10, 1);
      } else {
        // 干貝
        for (let k = 0; k < 3; k += 1) px(c, '#e8dcc0', x + 2 + k * 3, h - 28, 2, 2);
      }
    }
    // 價錢的黃色牌子
    for (let x = 10; x < split - 10; x += 22) {
      px(c, '#f6d23a', x, h - 16, 10, 6);
      px(c, '#c8302a', x + 2, h - 14, 6, 1);
    }
    // 東邊：丼飯屋的門口（照片菜單、玻璃門）
    px(c, night ? '#ffd890' : '#e8dcc0', split + 6, 40, w - split - 12, h - 44);
    for (let x = split + 8; x < w - 8; x += 12) {
      px(c, '#ffffff', x, 42, 10, 8);
      px(c, '#e8622a', x + 2, 44, 6, 3);
      px(c, '#ffffff', x + 3, 47, 4, 1);
    }
    px(c, '#2a2624', split + 6, 52, w - split - 12, 1);
    px(c, '#1f2a4a', split + (w - split) / 2 - 8, 53, 16, 6);
    text(c, '丼', split + (w - split) / 2, 56, '#ffffff', `900 5px ${SERIF_TC}`);
    // 柱子
    for (const x of [0, split - 2, w - 3]) px(c, '#4a3e32', x, 22, 3, h - 22);
  });
}

// 活烏賊的水槽（烏賊在裡面游）＋老闆
function drawSquidTank(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(SQUID_TANK.x * T);
  const by = Math.round(HD.rowC * T);
  const owner = getAvatarFrame(lookColors(2, 5, { body: 1 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx + 10 - owner.width / 2), by - 18 - owner.height + 8);
  const w = 40;
  const x0 = cx - w / 2;
  px(c, 'rgba(0,0,0,0.22)', x0, by, w, 3);
  px(c, '#9aa3b2', x0 - 1, by - 20, w + 2, 20);
  px(c, d.night ? '#3a7ab0' : '#4a9ac8', x0 + 1, by - 18, w - 2, 15);
  px(c, 'rgba(255,255,255,0.35)', x0 + 1, by - 18, w - 2, 1);
  // 烏賊：半透明的身體、會游來游去
  for (let k = 0; k < 4; k += 1) {
    const t = d.seconds * (0.25 + k * 0.07) + k * 1.7;
    const sx = x0 + 6 + ((Math.sin(t) + 1) / 2) * (w - 14);
    const sy = by - 15 + (k % 2) * 5 + Math.sin(t * 2.3) * 1.5;
    const face = Math.cos(t) > 0 ? 1 : -1;
    px(c, 'rgba(240,236,228,0.85)', Math.round(sx), Math.round(sy), 5, 2);
    px(c, 'rgba(240,236,228,0.6)', Math.round(sx + (face > 0 ? -3 : 5)), Math.round(sy), 3, 1);
    px(c, 'rgba(240,236,228,0.6)', Math.round(sx + (face > 0 ? -3 : 5)), Math.round(sy + 1), 3, 1);
    px(c, '#2a2a2e', Math.round(sx + (face > 0 ? 3 : 1)), Math.round(sy), 1, 1);
  }
  // 冒泡
  for (let k = 0; k < 3; k += 1) {
    const t = (d.seconds * 0.7 + k / 3) % 1;
    px(c, 'rgba(255,255,255,0.7)', x0 + 4 + k * 13, Math.round(by - 4 - t * 13), 1, 1);
  }
  // 旁邊冰上的帝王蟹
  px(c, '#f4f6f8', x0 + w + 2, by - 8, 14, 8);
  px(c, '#d8402a', x0 + w + 6, by - 11, 6, 3);
  for (let k = 0; k < 3; k += 1) {
    px(c, '#d8402a', x0 + w + 4 - k, by - 10 + k, 2, 1);
    px(c, '#d8402a', x0 + w + 12 + k, by - 10 + k, 2, 1);
  }
}

// 丼飯屋門口的吧台（鮭魚卵丼、味噌湯）＋老闆
function drawCounter(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(COUNTER.x * T);
  const by = Math.round(COUNTER.y * T);
  const owner = getAvatarFrame(lookColors(4, 1, { body: 0 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - owner.width / 2), by - 10 - owner.height + 4);
  px(c, 'rgba(0,0,0,0.2)', cx - 21, by, 42, 3);
  px(c, '#8a5a32', cx - 21, by - 10, 42, 4);
  px(c, '#b5804a', cx - 21, by - 10, 42, 1);
  px(c, '#6e4626', cx - 20, by - 6, 40, 6);
  // 兩碗鮭魚卵丼
  for (const dx of [-10, 6]) {
    px(c, '#2a2624', cx + dx, by - 13, 8, 3);
    px(c, '#e8622a', cx + dx + 1, by - 14, 6, 2);
    px(c, '#ffb070', cx + dx + 2, by - 14, 1, 1);
    px(c, '#ffb070', cx + dx + 4, by - 14, 1, 1);
  }
  // 小暖簾的竿子
  px(c, '#5a3e2a', cx - 21, by - 32, 2, 22);
  px(c, '#5a3e2a', cx + 19, by - 32, 2, 22);
  px(c, '#1f2a4a', cx - 21, by - 34, 42, 7);
  text(c, 'いくら丼', cx, by - 30.5, '#ffffff', `900 5px ${SERIF_TC}`);
  for (let k = 0; k < 2; k += 1) {
    const t = (d.seconds * 0.6 + k / 2) % 1;
    px(c, `rgba(255,255,255,${0.4 * (1 - t)})`, Math.round(cx - 6 + k * 16), Math.round(by - 16 - t * 10), 2, 2);
  }
}

// ── 金森紅磚倉庫：紅磚、鐵門、鐵窗板、灰色屋頂；中間那棟山牆朝前 ──
const WH_H = 86;
function warehouseSprite(w: number, gable: boolean, night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-wh-${w}-${gable ? 'g' : 's'}-${night ? 'n' : 'd'}-${ssn()}`, w, WH_H, (c) => {
    const h = WH_H;
    const wallTop = 24;
    if (gable) {
      // 山牆朝前：三角的磚牆、白色的收邊
      poly(c, '#5d6168', [[-2, wallTop + 2], [w / 2, 0], [w + 2, wallTop + 2]]);
      c.save();
      poly(c, BRICK, [[2, wallTop + 1], [w / 2, 4], [w - 2, wallTop + 1]]);
      c.clip();
      brickWall(c, 0, 0, w, wallTop + 2);
      c.restore();
      if (winter) poly(c, SNOW, [[-2, wallTop + 1], [w / 2, -1], [w + 2, wallTop + 1], [w / 2, 3]]);
      c.fillStyle = '#e2d8c6';
      c.beginPath();
      c.arc(w / 2, 14, 4, 0, Math.PI * 2);
      c.fill();
      px(c, '#2a2624', Math.round(w / 2) - 2, 12, 4, 4);
    } else {
      // 側面：灰色的斜屋頂
      poly(c, '#5d6168', [[0, wallTop + 2], [8, 8], [w - 8, 8], [w, wallTop + 2]]);
      for (let y = 10; y < wallTop; y += 3) px(c, 'rgba(255,255,255,0.08)', 6, y, w - 12, 1);
      if (winter) poly(c, SNOW, [[4, 18], [8, 7], [w - 8, 7], [w - 4, 18]]);
    }
    brickWall(c, 0, wallTop, w, h - wallTop - 4);
    px(c, '#e2d8c6', 0, wallTop, w, 2);
    px(c, 'rgba(0,0,0,0.18)', 0, wallTop + 2, w, 1);
    // 樓上的窗：黑色的鐵窗板往兩邊打開
    const n = Math.max(3, Math.floor(w / 22));
    for (let k = 0; k < n; k += 1) {
      const x = Math.round(((k + 0.5) * w) / n) - 4;
      px(c, '#e2d8c6', x - 1, 31, 10, 1);
      px(c, night ? '#ffc870' : '#2e3438', x, 32, 8, 10);
      px(c, '#1e1c1c', x - 4, 32, 3, 10);
      px(c, '#1e1c1c', x + 9, 32, 3, 10);
    }
    px(c, '#e2d8c6', 0, 47, w, 2);
    // 一樓：拱形的大鐵門（開著，裡面是店）
    const m = Math.max(2, Math.floor(w / 40));
    for (let k = 0; k < m; k += 1) {
      const x = Math.round(((k + 0.5) * w) / m) - 11;
      px(c, '#e2d8c6', x - 1, 53, 24, h - 57);
      px(c, night ? '#ffd890' : '#3a3430', x, 56, 22, h - 60);
      px(c, night ? '#ffd890' : '#3a3430', x + 2, 54, 18, 2);
      if (!night) {
        px(c, '#8a6a4a', x + 3, h - 14, 16, 8);
        px(c, '#c8b48a', x + 4, h - 13, 4, 3);
        px(c, '#d8603a', x + 10, h - 13, 4, 3);
      } else {
        px(c, '#fff2c8', x + 6, 60, 10, 4);
      }
      // 打開的鐵門板（黑色、鉚釘）
      for (const dx of [-7, 23]) {
        px(c, '#1e1c1c', x + dx, 55, 6, h - 59);
        for (let y = 58; y < h - 6; y += 6) px(c, '#4a4646', x + dx + 2, y, 2, 1);
      }
    }
    // 招牌
    const sx = Math.round(w / 2);
    px(c, '#1e1c1c', sx - 22, 49.5, 44, 5);
    text(c, gable ? '金森倉庫' : 'RED BRICK', sx, 52, '#f2ece0', `700 4px ${FONT_TC}`, 'center', 40);
    if (gable) text(c, 'KANEMORI', sx, 21, '#f2ece0', `700 4px ${FONT_TC}`);
    // 石頭的基座
    px(c, '#9a948a', 0, h - 4, w, 4);
    px(c, '#b5afa4', 0, h - 4, w, 1);
  });
}

// ── 港：水波、晚上的倒影、烏賊船（集魚燈）──
const SQUID_BOATS = [{ x: 38, y: 43.6, sp: 0.05 }, { x: 51, y: 45.2, sp: 0.04 }];
const SQUID_LIGHTS: CityDef['lights'] = SQUID_BOATS.flatMap(() => [0, 1, 2].map(() => ({ x: -200, y: -200, r: 22, color: 'rgba(210, 255, 220, 0.6)' })));
const REFLECTIONS: [number, string][] = [
  ...WAREHOUSES.map((b): [number, string] => [((b.x0 + b.x1) / 2) * T, '255, 170, 100']),
  [((HD.station.x0 + HD.station.x1) / 2) * T, '220, 235, 255'],
  [((HD.market.x0 + HD.market.x1) / 2) * T, '255, 220, 150'],
];
function drawHarbor(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, SEA + 3, MW, MH - SEA - 3);
  c.clip();
  for (let i = 0; i < 70; i += 1) {
    const y = SEA + 6 + (((i * 37) % 97) / 97) * (MH - SEA - 8);
    const x = ((i * 131 + d.seconds * (5 + (i % 4) * 2)) % (MW + 20)) - 10;
    px(c, `rgba(235,250,255,${0.25 + 0.2 * Math.sin(d.seconds * 1.4 + i)})`, Math.round(x), Math.round(y), 5 + (i % 3) * 3, 1);
  }
  if (d.night) {
    for (const [rx, rgb] of REFLECTIONS) {
      for (let k = 0; k < 14; k += 1) {
        const yy = SEA + 5 + k * 6;
        const wob = Math.sin(d.seconds * 2 + k * 1.3 + rx) * 3;
        const ww = 20 - k * 0.9;
        px(c, `rgba(${rgb}, ${0.5 - k * 0.03})`, Math.round(rx - ww / 2 + wob), Math.round(yy), Math.round(ww), 2);
      }
    }
  }
  // 烏賊船：白色船身、藍色的船艙，一整排集魚燈（晚上很亮）
  SQUID_BOATS.forEach((b, i) => {
    const bx = Math.round((b.x + Math.sin(d.seconds * b.sp + i * 2) * 2.2) * T);
    const by = Math.round(b.y * T + Math.sin(d.seconds * 0.9 + i) * 0.8);
    px(c, 'rgba(0,0,0,0.2)', bx - 22, by + 1, 44, 2);
    poly(c, '#f2f0ea', [[bx - 22, by - 7], [bx + 24, by - 9], [bx + 18, by], [bx - 18, by]]);
    px(c, '#2a5aa8', bx - 20, by - 3, 38, 2);
    px(c, '#2a5aa8', bx - 4, by - 15, 12, 8);
    px(c, d.night ? '#ffe2a0' : '#bcd8ea', bx - 2, by - 13, 8, 3);
    px(c, '#3a3d45', bx + 2, by - 24, 1, 9);
    // 燈的電線＋燈泡
    c.strokeStyle = '#3a3d45';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(bx - 20, by - 14);
    c.lineTo(bx + 2, by - 24);
    c.lineTo(bx + 22, by - 15);
    c.stroke();
    for (let k = 0; k < 9; k += 1) {
      const t = k / 8;
      const lx = bx - 18 + t * 38;
      const ly = t < 0.53 ? by - 14 - (t / 0.53) * 9 : by - 23 + ((t - 0.53) / 0.47) * 8;
      px(c, d.night ? '#f4fff0' : '#e8e8e0', Math.round(lx), Math.round(ly) + 1, 2, 3);
    }
    [-12, 2, 16].forEach((dx, k) => {
      const l = SQUID_LIGHTS[i * 3 + k];
      if (l) {
        l.x = bx + dx;
        l.y = by - 16;
      }
    });
  });
  c.restore();
}

// ── 摩周丸（舊青函連絡船）：白色的船身、奶油色的煙囪、一排排的窗 ──
const MS = HD.mashu;
const MS_W = Math.round((MS.x1 - MS.x0) * T);
const MS_H = 84;
function mashuSprite(night: boolean): HTMLCanvasElement {
  const winter = hakodateWinter();
  return cached(`hk-mashu-${night ? 'n' : 'd'}-${ssn()}`, MS_W, MS_H, (c) => {
    const w = MS_W;
    const h = MS_H;
    const white = '#f4f2ec';
    const shade = '#d8d4ca';
    const win = (k: number) => (night ? (k % 4 === 1 ? '#3a4050' : '#ffdc8a') : '#34424e');
    // 桅杆、雷達
    for (const [mx, top] of [[56, 6], [w - 70, 0]] as const) {
      px(c, '#3a3330', mx, top, 2, 34 - top);
      px(c, '#3a3330', mx - 7, top + 8, 16, 1);
    }
    c.strokeStyle = 'rgba(40,36,34,0.6)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(4, 48);
    c.lineTo(57, 6);
    c.lineTo(w - 69, 0);
    c.lineTo(w - 4, 46);
    c.stroke();
    // 煙囪（奶油色、紅色的帶、黑色的頂）
    const fx = Math.round(w * 0.42);
    poly(c, '#efe0a8', [[fx, 34], [fx + 4, 8], [fx + 30, 8], [fx + 32, 34]]);
    px(c, '#c8302a', fx + 3, 14, 28, 4);
    px(c, '#1a1a1c', fx + 4, 6, 26, 3);
    px(c, 'rgba(255,255,255,0.3)', fx + 6, 10, 2, 24);
    // 上層建築（白色，三層；船橋在東邊船頭那側）
    px(c, white, 40, 40, w - 70, 10);
    px(c, white, 64, 30, w - 130, 10);
    px(c, white, w - 108, 20, 46, 10);
    px(c, shade, 40, 49, w - 70, 1);
    let k = 0;
    for (let x = 44; x < w - 34; x += 6) px(c, win((k += 1)), x, 43, 4, 3);
    for (let x = 68; x < w - 70; x += 6) px(c, win((k += 1)), x, 33, 4, 3);
    for (let x = w - 104; x < w - 66; x += 5) px(c, night ? '#ffe9b8' : '#2a3a48', x, 23, 3, 4);
    if (winter) {
      px(c, SNOW, 64, 29, w - 130, 2);
      px(c, SNOW, w - 108, 19, 46, 2);
      px(c, SNOW, 40, 39, 24, 2);
    }
    // 救生艇（橘色）
    for (const bx of [80, 110, w - 150, w - 120]) {
      px(c, '#3a3330', bx - 1, 26, 1, 5);
      px(c, '#e8702a', bx, 27, 16, 4);
      px(c, '#c85a1a', bx, 30, 16, 1);
    }
    // 船身：白色，船頭（東邊）往前斜
    c.fillStyle = white;
    c.beginPath();
    c.moveTo(2, 50);
    c.lineTo(w - 2, 46);
    c.lineTo(w - 22, h - 4);
    c.lineTo(14, h - 4);
    c.lineTo(6, h - 14);
    c.closePath();
    c.fill();
    px(c, '#2a6aa8', 6, 58, w - 18, 2);
    px(c, shade, 6, 70, w - 28, 1);
    for (let x = 18; x < w - 34; x += 7) px(c, night ? '#ffd88a' : '#5a6672', x, 63, 2, 2);
    // 吃水線（紅色的船底）
    px(c, '#a8302a', 14, h - 6, w - 36, 6);
    px(c, '#1f2a44', 14, h - 8, w - 36, 2);
    // 船名
    text(c, '摩周丸', w - 46, 64, '#1f2a44', `900 7px ${SERIF_TC}`);
    text(c, 'MASHU MARU', 46, 66, '#1f2a44', `700 4px ${FONT_TC}`);
  });
}
function drawMashu(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const bob = Math.round(Math.sin(d.seconds * 0.6) * 0.8);
  blit(c, mashuSprite(d.night), MS.x0 * T, MS.line * T + bob);
}

// 岸邊的繫纜樁和鐵鍊
function drawQuay(c: CanvasRenderingContext2D): void {
  const y = SEA + 1;
  for (let x = 6; x < MW; x += 32) {
    px(c, '#3a3d45', x, y - 6, 5, 6);
    px(c, '#5a5d66', x - 1, y - 7, 7, 2);
  }
}

// ── 下雪（冬天，整張地圖）──
function drawSnowfall(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!hakodateWinter()) return;
  const W = MW + 20;
  const H = MH + 10;
  for (let i = 0; i < 260; i += 1) {
    const fall = 14 + (i % 5) * 5;
    const y = ((i * 89.3 + d.seconds * fall) % H) - 5;
    const x = ((((i * 131.7 + d.seconds * (4 + (i % 3) * 3) + Math.sin(d.seconds * 0.8 + i) * 8) % W) + W) % W) - 10;
    const big = i % 4 === 0;
    px(c, `rgba(255,255,255,${big ? 0.95 : 0.75})`, Math.round(x), Math.round(y), big ? 2 : 1, big ? 2 : 1);
  }
}

// ── 座位 ──
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = HAKODATE_SEATS[i];
  if (s && i >= 10) drawStool(c, s.x, s.y, '#8a5a32');
}
// 長椅（冬天座板上有一點雪）
function drawHkBench(c: CanvasRenderingContext2D, x: number, y: number): void {
  drawBench(c, x, y, 2.6);
  if (hakodateWinter()) {
    const cx = Math.round(x * T);
    const by = Math.round(y * T);
    px(c, SNOW, cx - 20, by - 13, 40, 1);
  }
}

// ── 擺設的位置 ──
const S = HD.slope;
const SLOPE_TREES: [number, number][] = [[24.1, 22.4], [30.9, 22.4], [24.1, 25.4], [30.9, 25.4], [24.6, 33.2], [31.2, 33.2]];
const PLAZA_TREES: [number, number][] = [[22.9, 17.4], [32, 17.4]];
const LAMPS: [number, number][] = [
  [24.1, 23.9], [30.9, 23.9],
  [3, 21], [9.5, 21], [16, 21], [45.6, 21], [51.4, 21], [56.6, 21],
  [24.4, 35.4], [31.4, 35.4],
  [1.6, 39.6], [13.6, 39.6], [24.9, 39.6], [31, 39.6], [34.2, 39.6], [47, 39.6], [56.4, 39.6],
];
const MARKER = { x: 23.95, y: 19.2 };

const props: CityProp[] = [
  { y: 0.01, draw: (c, d) => blit(c, mountainSprite(d.night), 0, HD.rowB * T) },
  { y: 0.02, draw: (c, d) => drawRopeway(c, d) },
  { y: HD.rowB, draw: (c, d) => blit(c, ropewaySprite(d.night), RW.x0 * T, HD.rowB * T) },
  { y: HD.rowB, draw: (c, d) => blit(c, orthodoxSprite(d.night), HD.orthodox.x0 * T, HD.rowB * T) },
  { y: HD.rowB, draw: (c, d) => blit(c, hallSprite(d.night), HD.hall.x0 * T, HD.rowB * T) },
  { y: HD.rowB, draw: (c, d) => blit(c, catholicSprite(d.night), HD.catholic.x0 * T, HD.rowB * T) },
  ...PLAZA_TREES.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawSlopeTree(c, x, y, d) })),
  { y: MARKER.y, draw: (c) => drawSlopeMarker(c, MARKER.x, MARKER.y) },
  ...TOP_BENCHES.map((x): CityProp => ({ y: TOP_BENCH_Y - 0.01, draw: (c) => drawHkBench(c, x, TOP_BENCH_Y) })),
  { y: TOP_BENCH_Y - 0.01, draw: (c) => drawHkBench(c, HALL_BENCH, TOP_BENCH_Y) },
  ...HOUSES.map((b): CityProp => ({ y: HD.rowB2, draw: (c, d) => blit(c, houseSprite(b.kind, Math.round((b.x1 - b.x0) * T), d.night), b.x0 * T, HD.rowB2 * T) })),
  ...SLOPE_TREES.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawSlopeTree(c, x, y, d) })),
  { y: HD.tram.west, draw: (c, d) => drawTram(c, d, false) },
  { y: HD.tram.east, draw: (c, d) => drawTram(c, d, true) },
  { y: WIRE_POLE_Y, draw: (c, d) => drawWires(c, d) },
  { y: HD.rowC, draw: (c, d) => blit(c, stationSprite(d.night), HD.station.x0 * T, HD.rowC * T) },
  { y: HD.rowC, draw: (c, d) => blit(c, marketSprite(d.night), HD.market.x0 * T, HD.rowC * T) },
  ...WAREHOUSES.map((b): CityProp => ({ y: HD.rowC, draw: (c, d) => blit(c, warehouseSprite(Math.round((b.x1 - b.x0) * T), b.gable, d.night), b.x0 * T, HD.rowC * T) })),
  { y: HD.rowC + 0.01, draw: (c, d) => drawSquidTank(c, d) },
  { y: COUNTER.y, draw: (c, d) => drawCounter(c, d) },
  { y: BAY_CART.y, draw: (c, d) => drawFoodCart(c, BAY_CART.x, BAY_CART.y, 'いかめし', '#2a4a7a', ['#6a3a2a', '#f4efe2', '#6a3a2a'], d.seconds, 41) },
  ...BAY_BENCHES.map((x): CityProp => ({ y: BAY_BENCH_Y - 0.01, draw: (c) => drawHkBench(c, x, BAY_BENCH_Y) })),
  { y: HD.sea + 0.05, draw: (c) => drawQuay(c) },
  { y: HD.sea + 0.1, draw: (c, d) => drawHarbor(c, d) },
  { y: MS.line, draw: (c, d) => drawMashu(c, d) },
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawHkLamp(c, x, y, d.night) })),
  { y: HD.H + 1, draw: (c, d) => drawSnowfall(c, d) },
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, HD.W, HD.foot + 0.3),
  r(0, HD.foot, S.walk0, HD.rowB),
  r(S.walk1, HD.foot, HD.W, HD.rowB),
  r(0, HD.plaza.y1 + 0.4, S.walk0, HD.rowB2),
  r(S.walk1, HD.plaza.y1 + 0.4, HD.W, HD.rowB2),
  ...[...TOP_BENCHES, HALL_BENCH].map((x) => r(x - 1.3, TOP_BENCH_Y - 0.75, x + 1.3, TOP_BENCH_Y - 0.45)),
  ...BAY_BENCHES.map((x) => r(x - 1.3, BAY_BENCH_Y - 0.75, x + 1.3, BAY_BENCH_Y - 0.45)),
  ...[...SLOPE_TREES, ...PLAZA_TREES].map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...LAMPS.map(([x, y]) => r(x - 0.15, y - 0.25, x + 0.2, y + 0.05)),
  r(MARKER.x - 0.3, MARKER.y - 0.3, MARKER.x + 0.3, MARKER.y + 0.05),
  ...WIRE_POLES.map((x) => r(x - 0.1, WIRE_POLE_Y - 0.25, x + 0.25, WIRE_POLE_Y + 0.05)),
  r(0, HD.walkS, HD.market.x1, HD.rowC),
  r(HD.kanemori.x0, HD.walkS, HD.W, HD.rowC),
  r(SQUID_TANK.x - 1.3, HD.rowC, SQUID_TANK.x + 2.3, HD.rowC + 0.15),
  r(COUNTER.x - 1.3, COUNTER.y - 0.45, COUNTER.x + 1.3, COUNTER.y + 0.05),
  r(BAY_CART.x - 1.25, BAY_CART.y - 0.8, BAY_CART.x + 1.25, BAY_CART.y - 0.05),
  r(0, HD.sea, HD.W, HD.H),
];

// ── 晚上的燈 ──
const L = (x: number, y: number, rr: number, color: string) => ({ x, y, r: rr, color });
const winterAtLoad = hakodateWinter();
const rawLights: CityDef['lights'] = [
  // 函館山：山頂展望台、山上開車道的路燈、纜車站
  L(SUM_X, SUM_Y, 70, 'rgba(255, 220, 160, 0.4)'),
  L(SUM_X, SUM_Y + 2, 22, 'rgba(255, 240, 200, 0.8)'),
  L(CABLE_B[0], CABLE_B[1] - 2, 18, 'rgba(255, 220, 150, 0.6)'),
  ...drivePoints(36).map(([x, y]) => L(x, y, 9, 'rgba(255, 215, 140, 0.55)')),
  // 纜車山麓站
  L(RW.x0 * T + 64, HD.rowB * T - 46, 60, 'rgba(255, 210, 150, 0.4)'),
  L(RW.x0 * T + 64, HD.rowB * T - 8, 34, 'rgba(255, 230, 180, 0.5)'),
  // 教會打燈：東正教會（白色的光）、公會堂（暖光）、天主教會（尖塔往上打）
  L(HD.orthodox.x0 * T + 32, HD.rowB * T - 70, 70, 'rgba(230, 240, 255, 0.45)'),
  L(HD.orthodox.x0 * T + 32, HD.rowB * T - 118, 26, 'rgba(180, 255, 220, 0.5)'),
  L(((HD.orthodox.x0 + HD.orthodox.x1) / 2) * T + 30, HD.rowB * T - 40, 90, 'rgba(230, 240, 255, 0.35)'),
  ...[0.42, 0.8].map((k) => L((HD.orthodox.x0 * T + 54 + (HD.orthodox.x1 * T - 60 - HD.orthodox.x0 * T) * k), HD.rowB * T - 90, 20, 'rgba(180, 255, 220, 0.45)')),
  L(((HD.hall.x0 + HD.hall.x1) / 2) * T, HD.rowB * T - 50, 120, 'rgba(255, 220, 150, 0.4)'),
  L(((HD.hall.x0 + HD.hall.x1) / 2) * T, HD.rowB * T - 30, 40, 'rgba(255, 230, 170, 0.6)'),
  L(((HD.catholic.x0 + HD.catholic.x1) / 2) * T, HD.rowB * T - 60, 80, 'rgba(255, 235, 200, 0.4)'),
  L(((HD.catholic.x0 + HD.catholic.x1) / 2) * T, HD.rowB * T - 110, 30, 'rgba(255, 235, 200, 0.5)'),
  L(((HD.catholic.x0 + HD.catholic.x1) / 2) * T, HD.rowB * T - 40, 24, 'rgba(255, 190, 120, 0.6)'),
  // 老房子的窗
  ...HOUSES.map((b) => L(((b.x0 + b.x1) / 2) * T, HD.rowB2 * T - 44, 40, 'rgba(255, 210, 140, 0.35)')),
  L(RAMEN_DOOR * T, HD.rowB2 * T - 14, 38, 'rgba(255, 200, 120, 0.6)'),
  // 路燈
  ...LAMPS.map(([x, y]) => L(x * T + 1, y * T - 38, 34, 'rgba(255, 215, 140, 0.6)')),
  ...LAMPS.map(([x, y]) => L(x * T + 1, y * T, 22, 'rgba(255, 215, 140, 0.25)')),
  // 八幡坂冬天的燈飾（はこだてイルミネーション）
  ...(winterAtLoad ? SLOPE_TREES.slice(0, 4).map(([x, y]) => L(x * T, y * T - 28, 30, 'rgba(255, 220, 120, 0.55)')) : []),
  // 車站、朝市
  L(((HD.station.x0 + HD.station.x1) / 2) * T, HD.rowC * T - 46, 100, 'rgba(255, 230, 180, 0.4)'),
  L(((HD.station.x0 + HD.station.x1) / 2) * T, HD.rowC * T, 50, 'rgba(220, 235, 255, 0.4)'),
  L(((HD.market.x0 + HD.market.x1) / 2) * T, HD.rowC * T - 30, 100, 'rgba(255, 210, 140, 0.4)'),
  L(((HD.market.x0 + HD.market.x1) / 2) * T, HD.rowC * T - 62, 40, 'rgba(255, 240, 220, 0.4)'),
  L(SQUID_TANK.x * T, HD.rowC * T - 10, 26, 'rgba(120, 200, 255, 0.5)'),
  L(COUNTER.x * T, COUNTER.y * T - 16, 34, 'rgba(255, 210, 140, 0.5)'),
  L(DON_DOOR * T, HD.rowC * T - 20, 36, 'rgba(255, 220, 160, 0.5)'),
  // 金森紅磚倉庫：橘色的打燈、門裡的光、廣場
  ...WAREHOUSES.flatMap((b) => {
    const n = 3;
    return Array.from({ length: n }, (_, k) => L((b.x0 + ((k + 0.5) * (b.x1 - b.x0)) / n) * T, HD.rowC * T - 46, 50, 'rgba(255, 150, 80, 0.6)'));
  }),
  ...WAREHOUSES.map((b) => L(((b.x0 + b.x1) / 2) * T, HD.rowC * T + 12, 90, 'rgba(255, 190, 120, 0.3)')),
  L(BAY_CART.x * T, BAY_CART.y * T - 16, 40, 'rgba(255, 190, 120, 0.5)'),
  // 水面的倒影
  ...REFLECTIONS.map(([x, rgb]) => L(x, SEA + 34, 40, `rgba(${rgb}, 0.22)`)),
  // 摩周丸：窗、船名
  L(MS.x0 * T + MS_W / 2, MS.line * T - 44, 140, 'rgba(255, 210, 140, 0.28)'),
  L(MS.x1 * T - 80, MS.line * T - 60, 30, 'rgba(255, 235, 190, 0.5)'),
  L(MS.x0 * T + MS_W * 0.42 + 16, MS.line * T - 66, 26, 'rgba(255, 120, 100, 0.35)'),
];
// 光暈不要超出地圖；會動的燈（纜車、電車、烏賊船、電視塔）另外接在後面
const lights: CityDef['lights'] = [
  ...rawLights.map((l) => ({ ...l, r: Math.max(3, Math.min(l.r, l.x, MW - l.x, l.y, MH - l.y)) })),
  ...GONDOLA_LIGHTS,
  ...BEACONS,
  ...TRAM_LIGHTS,
  ...SQUID_LIGHTS,
];

const stationX = (HD.station.x0 + HD.station.x1) / 2;

export const HAKODATE: CityDef = {
  id: 'hakodate',
  country: 'jp',
  line: 'jr',
  W: HD.W,
  H: HD.H,
  title: { 'zh-TW': '函館', 'en-US': 'Hakodate' },
  stop: { 'zh-TW': '函館', 'en-US': 'Hakodate' },
  emoji: '🚡',
  station: {
    x: stationX,
    y: HD.rowC + 0.6,
    name: { 'zh-TW': 'JR 函館站', 'en-US': 'JR Hakodate Station' },
    arrive: { x: stationX, y: HD.rowC + 2.2 },
  },
  background: '#cfc8bb',
  nightTint: '#68729f',
  soundscape: 'beach',
  paintGround: paintHakodateGround,
  props,
  solid,
  seats: HAKODATE_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: HAKODATE_SHOPS,
  infos: [
    {
      at: r(10, 0.4, 44, 9.4),
      title: { 'zh-TW': '函館山 · 百萬夜景', 'en-US': 'Mt. Hakodate · The Million-Dollar Night View' },
      text: {
        'zh-TW': '函館山高 334 公尺，從海上看像一頭趴著的牛，所以又叫「臥牛山」。它原本是海上的火山島，後來被沙洲連上陸地，函館市區就蓋在這條細細的沙洲上——從山頂往下看，兩邊都是海、中間的街道像腰身一樣收窄，晚上的燈光就成了有名的「百萬夜景」，米其林綠色指南給了三顆星。明治到二戰結束前山上是軍事要塞、禁止進入，1946 年才開放。函館山纜車 1958 年通車，最多可載 125 人的大車廂大約 3 分鐘就到山頂展望台。（地圖上的車廂和纜索畫得比較小，纜車也開得比真的慢。）',
        'en-US': 'Mt. Hakodate, 334 m high, looks like a lying ox from the sea — hence its old name Gagyūzan. Once a volcanic island, it was tied to the mainland by a sandbar, and downtown Hakodate is built on that narrow neck: from the summit you see sea on both sides and the city pinched into a waist, and at night its lights become the famous “million-dollar night view”, rated three stars by the Michelin Green Guide. From the Meiji era until 1945 the mountain was a closed military fortress, opening to the public in 1946. The ropeway opened in 1958; its 125-person cabins reach the summit observatory in about 3 minutes. (The cabins and cables here are drawn smaller, and run slower than the real thing.)',
      },
    },
    {
      at: r(S.walk0, HD.foot, S.walk1, HD.rowB2),
      title: { 'zh-TW': '八幡坂', 'en-US': 'Hachimanzaka' },
      text: {
        'zh-TW': '元町一帶有十九條坂道，八幡坂是最有名的一條：長約 270 公尺，筆直的石板坡道從函館山腳一路往下通到港邊，坡底就是函館港和摩周丸，常出現在電影、廣告和明信片裡。名字來自從前蓋在坡頂的函館八幡宮（1880 年遷走）。每年 12 月到 2 月的「はこだてイルミネーション」，坡道兩旁的行道樹會掛滿燈泡，雪地上一片金黃。坡底橫過的是函館市電：1897 年從馬車鐵道開始，1913 年電氣化，是北海道最早的路面電車，夏天還會開復古的箱型電車「函館ハイカラ號」。（地圖上把八幡坂畫得比較短，坡下的市電、港和車站都壓縮在同一張圖裡。）',
        'en-US': 'Motomachi has nineteen slopes, and Hachimanzaka is the most famous: about 270 m of straight, stone-paved road running from the foot of Mt. Hakodate down to the harbour, with the port and the Mashu Maru at the bottom — a favourite of films, ads and postcards. It is named after Hakodate Hachimangu shrine, which stood at the top until it moved in 1880. From December to February, during the Hakodate Illumination, the trees along it are strung with lights that glow gold on the snow. The tram crossing at the bottom is the Hakodate City Tram: begun as a horse-drawn line in 1897 and electrified in 1913, it is Hokkaido’s oldest, and in summer a restored retro car, the Hakodate Haikara-gō, runs on it. (Here the slope is shorter, and the tram, port and station are squeezed onto one map.)',
      },
    },
    {
      at: r(HD.orthodox.x0, 10.4, HD.orthodox.x1, HD.rowB),
      title: { 'zh-TW': '函館東正教會 · 元町教會群', 'en-US': 'Hakodate Orthodox Church · Motomachi’s Churches' },
      text: {
        'zh-TW': '1859 年函館開港，俄羅斯領事館在這裡蓋了附屬的聖堂，是日本第一座東正教會；1861 年來到函館的尼古拉神父，後來把東正教傳遍日本（東京的尼古拉堂就是他蓋的）。舊聖堂在 1907 年的函館大火中燒毀，現在的「主之復活聖堂」是 1916 年依俄羅斯拜占庭式重建的：白色的牆、綠色銅板屋頂和洋蔥頂，鐘聲叮噹作響，函館人叫它「噹噹寺（ガンガン寺）」，1983 年指定為國家重要文化財。東邊有尖塔、頂上有公雞風向計的是天主教元町教會，法國傳教士 1859 年就來到函館，現在的哥德式聖堂是 1921 年大火後重建的。不同宗派的教會就排在同一條坡上，是開港城市函館才有的風景。',
        'en-US': 'When Hakodate opened its port in 1859, the Russian consulate built a chapel here — Japan’s first Orthodox church. Father Nikolai, who arrived in 1861, went on to spread Orthodoxy across Japan (Tokyo’s Nikolai-dō is his). The old chapel burned in the great Hakodate fire of 1907; today’s Church of the Resurrection was rebuilt in 1916 in Russo-Byzantine style — white walls, green copper roofs and onion domes. Locals nicknamed it “Gangan-dera” after its clanging bells; it became an Important Cultural Property in 1983. The spired church to the east, topped with a rooster weathervane, is the Catholic Motomachi Church: French missionaries arrived in 1859, and its Gothic building was rebuilt after a 1921 fire. Churches of different faiths side by side on one hillside are a sight only an old treaty port like Hakodate has.',
      },
    },
    {
      at: r(HD.hall.x0, 11.4, HD.hall.x1, HD.rowB),
      title: { 'zh-TW': '舊函館區公會堂', 'en-US': 'Old Public Hall of Hakodate Ward' },
      text: {
        'zh-TW': '1907 年的大火燒掉了原本的町會所，函館的富商相馬哲平捐出大部分的建設費，1910 年完成了這棟殖民地風格的木造洋館：藍灰色的牆配上黃色的窗框和柱子，中間的玄關上面是可以眺望函館港的陽台。隔年還是皇太子的大正天皇來函館時就住在這裡。1974 年指定為國家重要文化財，經過大規模修復後 2021 年重新開放，二樓的大廳可以租借明治時代的禮服拍照，從陽台看出去就是坡道和港。',
        'en-US': 'After the 1907 fire destroyed the old town hall, the wealthy merchant Sōma Teppei paid most of the cost of this colonial-style wooden Western building, finished in 1910: blue-grey walls with yellow window frames and pilasters, and a balcony above the central entrance looking out over the harbour. The following year the crown prince — later Emperor Taishō — stayed here. It became an Important Cultural Property in 1974 and reopened in 2021 after a major restoration; you can rent Meiji-era costumes for photos in the second-floor hall, and the balcony looks straight down the slopes to the port.',
      },
    },
    {
      at: r(HD.kanemori.x0, 30.8, HD.kanemori.x1, HD.rowC),
      title: { 'zh-TW': '金森紅磚倉庫', 'en-US': 'Kanemori Red Brick Warehouses' },
      text: {
        'zh-TW': '1869 年，從長崎來的渡邊熊四郎在函館開了舶來品店「金森洋物店」，1887 年開始做倉庫生意。1907 年大火後改用不怕火的紅磚，1909 年蓋好了這排倉庫，見證了函館作為北方貿易港最繁榮的年代。1988 年改裝成商店、餐廳和展演空間重新開放，紅磚牆、黑色鐵門和鐵窗板都保留了下來；倉庫面對港灣，晚上打燈後倒映在水面上，是函館夜景的另一個主角。（地圖上的倉庫數量比實際少，前面的運河也簡化成港邊的步道。）',
        'en-US': 'In 1869 Watanabe Kumashirō, who came from Nagasaki, opened an imported-goods shop in Hakodate, Kanemori Yōbutsuten, and began a warehouse business in 1887. After the 1907 fire the warehouses were rebuilt in fireproof red brick in 1909, witnesses to Hakodate’s heyday as a northern trading port. They reopened in 1988 as shops, restaurants and event spaces, keeping their brick walls and black iron doors and shutters. Facing the bay and lit up at night, they glow on the water — another star of the Hakodate night view. (There are fewer warehouses here than in reality, and the canal in front is simplified into a harbour-side promenade.)',
      },
    },
    {
      at: r(HD.market.x0, 31.6, HD.market.x1, HD.rowC),
      title: { 'zh-TW': '函館朝市', 'en-US': 'Hakodate Morning Market' },
      text: {
        'zh-TW': '二戰剛結束的 1945 年左右，附近的農家和漁民在函館站前擺攤賣東西，慢慢發展成今天大約 250 家店的朝市。帝王蟹、毛蟹、鮭魚卵、海膽、干貝排滿攤位；烏賊是函館的「市魚」，水槽裡活烏賊游來游去，可以自己釣上來、當場做成透明的烏賊生魚片。早上來一碗鮭魚卵堆得滿出來的海鮮丼最經典。這裡也賣烏賊飯——把糯米塞進整隻烏賊用甜鹹醬汁燉，1941 年起是附近森町車站的鐵路便當；清湯的鹽味拉麵則是函館拉麵的招牌。',
        'en-US': 'Around 1945, just after WWII, farmers and fishermen began selling in front of Hakodate Station, and it grew into today’s morning market of about 250 shops. King crab, hairy crab, salmon roe, sea urchin and scallops fill the stalls; squid is Hakodate’s city fish, and in the tanks live squid swim about — you can catch one yourself and have it served as glassy-clear sashimi on the spot. A seafood bowl heaped with spilling ikura is the classic breakfast. Ikameshi is sold here too — whole squid stuffed with sticky rice and simmered in sweet soy, a station bento from nearby Mori since 1941 — while clear, salty shio ramen is Hakodate’s signature noodle.',
      },
    },
    {
      at: r(MS.x0, 40.2, MS.x1, 45.6),
      title: { 'zh-TW': '摩周丸 · 青函連絡船', 'en-US': 'Mashu Maru · The Seikan Ferry' },
      text: {
        'zh-TW': '1908 年到 1988 年，青函連絡船載著旅客和整列火車橫渡津輕海峽，往返青森和函館，是本州和北海道之間的大動脈。1954 年颱風中洞爺丸沉沒、上千人罹難，促成了青函隧道的興建；1988 年隧道通車，連絡船在同一年走入歷史。摩周丸是 1964 年下水的第二代連絡船，退役後從 1991 年起停在函館站旁的舊第二棧橋，改成紀念館，可以進到船橋和無線電室參觀。（地圖上把船畫得比較小。）',
        'en-US': 'From 1908 to 1988, the Seikan ferries carried passengers — and entire trains — across the Tsugaru Strait between Aomori and Hakodate, the lifeline between Honshu and Hokkaido. The loss of the Tōya Maru in a 1954 typhoon, with over a thousand lives, spurred the building of the Seikan Tunnel; when it opened in 1988 the ferries were retired that same year. The Mashu Maru, launched in 1964, has been a museum ship since 1991 at the old No. 2 pier beside Hakodate Station — you can visit her bridge and radio room. (The ship is drawn smaller than life.)',
      },
    },
  ],
  labels: [
    { x: (S.x0 + S.x1) / 2, y: 16.4, text: { 'zh-TW': '⛪ 八幡坂坡頂（看港長椅）', 'en-US': '⛪ Top of Hachimanzaka (harbour view)' }, color: '#bae6fd' },
    { x: HALL_BENCH, y: TOP_BENCH_Y + 1.5, text: { 'zh-TW': '🏛️ 公會堂前', 'en-US': '🏛️ Public Hall' }, color: '#fde68a' },
    { x: (BAY_BENCHES[0]! + BAY_BENCHES[1]!) / 2, y: BAY_BENCH_Y + 1.6, text: { 'zh-TW': '🧱 金森倉庫海邊長椅', 'en-US': '🧱 Red Brick bayside benches' }, color: '#fecaca' },
    { x: COUNTER.x, y: COUNTER.y + 2.1, text: { 'zh-TW': '🍚 朝市吧台', 'en-US': '🍚 Market counter' }, color: '#fdba74' },
  ],
  walkers: [
    { x0: 0.8, y0: 19.6, x1: HD.W - 0.8, y1: 19.6, count: 4 },
    { x0: (S.x0 + S.x1) / 2 - 0.8, y0: HD.foot + 1, x1: (S.x0 + S.x1) / 2 - 0.8, y1: HD.rowB2 + 0.4, count: 2 },
    { x0: (S.x0 + S.x1) / 2 + 0.8, y0: HD.foot + 1.6, x1: (S.x0 + S.x1) / 2 + 0.8, y1: HD.rowB2 + 0.4, count: 1 },
    { x0: 0.8, y0: 26.8, x1: HD.W - 0.8, y1: 26.8, count: 3 },
    { x0: 0.8, y0: 31, x1: HD.W - 0.8, y1: 31, count: 3 },
    { x0: 0.8, y0: 37.3, x1: HD.W - 0.8, y1: 37.3, count: 4 },
    { x0: 27.6, y0: 31.2, x1: 27.6, y1: 39.2, count: 1 },
  ],
  traffic: [
    { y: 27.85, dir: -1, x0: 0, x1: HD.W, count: 2 },
    { y: 30.0, dir: 1, x0: 0, x1: HD.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點八幡坂坡頂、公會堂前、金森倉庫海邊的長椅或朝市的吧台坐下專注 · 走到攤子買鹽味拉麵、鮭魚卵丼、烏賊飯 · 點地標看介紹 · JR 函館站去其他日本城市或飛回台灣',
    'en-US': 'WASD / arrows to move · click a bench at the top of Hachimanzaka, by the Public Hall or along the Red Brick bay, or the market counter, to focus · walk up to the stalls for shio ramen, ikura bowls and ikameshi · click landmarks for info · JR Hakodate to other Japanese cities or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或吧台坐下專注 · 走到攤子買東西 · 點地標看介紹 · JR 函館站',
    'en-US': 'Tap a bench or the counter to focus · visit the stalls · tap landmarks · JR Hakodate',
  },
};
