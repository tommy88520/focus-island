// 橫濱的美術：港未來 21 的天際線（橫濱地標大廈、皇后廣場、帆船形的洲際飯店、橫濱海灣大橋；晚上窗戶亮起來）、
// Cosmo Clock 21 大摩天輪（中間是數字時鐘、慢慢轉，晚上整圈 LED 會變色）、橫濱港（遊覽船、水上巴士、水波、晚上的倒影）、
// 紅磚倉庫（1 號館、2 號館：紅磚、拱窗、鐵陽台，晚上打燈）、山下公園（海邊石椅、水之守護神噴水池、玫瑰花圃、銀杏）、
// 冰川丸（黑色船身、白色上層、黑底紅白帶的煙囪，晚上桅杆的燈串會亮）、JR 櫻木町站（高架上有根岸線的水藍色電車）、
// 西式老飯店（拿坡里義大利麵）、善鄰門牌樓、中華街（紅色街屋、燈籠、肉包蒸籠攤、三碼麵的店）、關帝廟。
// 最後組成 CityScene 用的 YOKOHAMA。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import {
  BRICK_BENCH,
  BRICK_BENCH_Y,
  BRICK_CART,
  CAFE_TABLE,
  CHINA_ROW,
  CHINA_TABLE,
  SEA_BENCHES,
  SEA_BENCH_Y,
  STEAMER,
  YH,
  YOKOHAMA_SEATS,
  YOKOHAMA_SHOPS,
  type ChinaKind,
} from './yokohama';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, cached, blit, road, tiles, zebra, drawBench, drawFoodCart, drawStoneBench, drawStool, drawStringLights } from './cityArt';
import { drawLantern } from './kyotoArt';

const MW = YH.W * T;
const MH = YH.H * T;
const SHORE = YH.shore * T;
const SEA = YH.sea * T;
const BRICK = '#b0503a';
const BRICK_DARK = '#93402e';
const VERMILION = '#c8242a';
const JADE = '#2a7a62';
const JADE_DARK = '#1d5a48';
const GOLD = '#e0b03a';
const GOLD_LIGHT = '#f8dc78';

// ── 月份（日本時間）：11、12 月銀杏變黃 ──
let monthAt = -Infinity;
let monthVal = 1;
function yhMonth(): number {
  const now = Date.now();
  if (now - monthAt > 60000) {
    monthAt = now;
    monthVal = Number(new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: 'Asia/Tokyo' }).format(new Date(now)));
  }
  return monthVal;
}

// ── Cosmo Clock 21 中間的時鐘：日本時間 ──
let clockAt = -Infinity;
let clockText = '12:00';
function jstClock(): string {
  const now = Date.now();
  if (now - clockAt > 5000) {
    clockAt = now;
    clockText = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'Asia/Tokyo' }).format(new Date(now));
  }
  return clockText;
}

// 中式屋頂（正面看）：屋脊窄、屋簷寬，兩端往上翹
function cnRoof(c: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number, tile = JADE, edge = JADE_DARK, tip = 5): void {
  const l = cx - w / 2;
  const r = cx + w / 2;
  c.fillStyle = tile;
  c.beginPath();
  c.moveTo(l - tip, top + h - tip * 1.6);
  c.quadraticCurveTo(l + 2, top + h, l + 10, top + h);
  c.lineTo(r - 10, top + h);
  c.quadraticCurveTo(r - 2, top + h, r + tip, top + h - tip * 1.6);
  c.lineTo(r - w * 0.2, top);
  c.lineTo(l + w * 0.2, top);
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  for (let x = Math.round(l - tip); x < r + tip; x += 3) px(c, 'rgba(255,255,255,0.12)', x, top, 1, h);
  c.restore();
  px(c, edge, Math.round(l + 4), Math.round(top + h - 2), Math.round(w - 8), 2);
  px(c, edge, Math.round(l + w * 0.2 - 2), Math.round(top - 2), Math.round(w * 0.6 + 4), 3);
  px(c, GOLD, Math.round(l + w * 0.2 - 4), Math.round(top - 4), 3, 4);
  px(c, GOLD, Math.round(r - w * 0.2 + 1), Math.round(top - 4), 3, 4);
}

// 一格磚牆（灰縫錯開）
function brickWall(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base = BRICK, joint = BRICK_DARK): void {
  px(c, base, x, y, w, h);
  for (let yy = 0, row = 0; yy < h; yy += 3, row += 1) {
    px(c, joint, x, y + yy + 2, w, 1);
    for (let xx = (row % 2) * 3; xx < w; xx += 6) px(c, joint, x + xx, y + yy, 1, 2);
  }
}

// 豎的招牌字
function vtext(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, size: number): void {
  [...s].forEach((ch, k) => text(c, ch, x, y + k * (size + 1), color, `900 ${size}px ${FONT_TC}`));
}

// ── 地面（畫一次）──
export function paintYokohamaGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1859);
  const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
  px(c, '#cfe6f4', 0, 0, MW, SHORE);
  // 港的水面
  const water = c.createLinearGradient(0, SHORE, 0, SEA);
  water.addColorStop(0, '#5a9cc8');
  water.addColorStop(1, '#2f6e9c');
  c.fillStyle = water;
  c.fillRect(0, SHORE, MW, SEA - SHORE);
  for (let i = 0; i < 140; i += 1) px(c, 'rgba(255,255,255,0.2)', Math.floor(rand() * MW), Math.floor(SHORE + 4 + rand() * (SEA - SHORE - 6)), 4 + Math.floor(rand() * 8), 1);
  // 對岸的岸壁
  px(c, '#7d838c', 0, SHORE - 2, MW, 3);
  px(c, 'rgba(255,255,255,0.25)', 0, SHORE + 1, MW, 1);
  // 山下公園、紅磚倉庫的岸壁（花崗岩）
  px(c, '#8e8a82', 0, SEA - 3, MW, 6);
  px(c, '#cfcabf', 0, SEA - 3, MW, 2);
  // 紅磚倉庫的廣場：石塊鋪面（錯開的小方石）
  const cob = r(0, YH.sea + 0.2, YH.park.x0, YH.road.y0);
  px(c, '#c7bca8', cob.x0 * T, cob.y0 * T, (cob.x1 - cob.x0) * T, (cob.y1 - cob.y0) * T);
  for (let y = cob.y0 * T, row = 0; y < cob.y1 * T; y += 5, row += 1) {
    for (let x = cob.x0 * T + (row % 2) * 4; x < cob.x1 * T; x += 8) {
      px(c, rand() < 0.5 ? '#bdb29d' : '#d2c8b5', Math.round(x), Math.round(y), 7, 4);
    }
  }
  // 廣場上紅磚色的線（倉庫的軌道遺跡）
  for (const yy of [23.2, 25.6]) px(c, '#a85a44', 0, Math.round(yy * T), YH.park.x0 * T, 2);
  // 山下公園：海邊步道（米色磁磚）、草地、玫瑰花圃
  tiles(c, r(YH.park.x0, YH.sea + 0.2, YH.W, YH.park.promenade), '#e4dccb', '#d3c9b5', 12);
  px(c, '#b9ad96', YH.park.x0 * T, YH.park.promenade * T - 1, MW, 2);
  const lawn = r(YH.park.x0, YH.park.promenade + 0.1, YH.W, YH.park.lawn);
  px(c, '#6c9f50', lawn.x0 * T, lawn.y0 * T, (lawn.x1 - lawn.x0) * T, (lawn.y1 - lawn.y0) * T);
  for (let i = 0; i < 900; i += 1) {
    px(c, ['#5f9246', '#7aac5c', '#68994c', '#86b866'][Math.floor(rand() * 4)] ?? '#5f9246', Math.floor(lawn.x0 * T + rand() * (lawn.x1 - lawn.x0) * T), Math.floor(lawn.y0 * T + rand() * (lawn.y1 - lawn.y0) * T), 2, 1);
  }
  // 噴水池前的圓形廣場、往步道的小路
  const { x: fx, y: fy } = YH.fountain;
  c.fillStyle = '#ddd4c2';
  c.beginPath();
  c.ellipse(fx * T, (fy - 0.3) * T, 3.6 * T, 2.2 * T, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#c4b9a3';
  c.lineWidth = 1;
  c.stroke();
  for (const px0 of [fx - 0.6, 46.4]) px(c, '#ddd4c2', px0 * T, YH.park.promenade * T, 1.2 * T, (YH.park.lawn - YH.park.promenade) * T);
  // 玫瑰花圃
  for (const [bx, by, bw] of [[24.4, 22.2, 3.4], [36.6, 22.2, 3.4], [41.4, 22.6, 3.2], [51.6, 22.4, 4.4]] as const) {
    c.fillStyle = '#4f7f3a';
    c.beginPath();
    c.ellipse(bx * T, by * T, (bw / 2) * T, 0.9 * T, 0, 0, Math.PI * 2);
    c.fill();
    for (let i = 0; i < 40; i += 1) {
      const a = rand() * Math.PI * 2;
      const rr = Math.sqrt(rand());
      px(c, ['#e8486a', '#f4a0b8', '#d8283a', '#fff2f2', '#f6c945'][Math.floor(rand() * 5)] ?? '#e8486a', Math.round(bx * T + Math.cos(a) * rr * (bw / 2 - 0.2) * T), Math.round(by * T + Math.sin(a) * rr * 0.7 * T), 2, 2);
    }
  }
  // 公園南邊的人行道
  tiles(c, r(0, YH.park.lawn, YH.W, YH.road.y0), '#d8d1c4', '#c6bfb1', 10);
  // 山下公園通
  road(c, r(0, YH.road.y0, YH.W, YH.road.y1), rand);
  for (let x = 0; x < MW; x += 24) px(c, '#f2d45a', x, Math.round(((YH.road.y0 + YH.road.y1) / 2) * T), 12, 1);
  px(c, '#9a948a', 0, YH.road.y0 * T, MW, 2);
  px(c, '#9a948a', 0, YH.road.y1 * T - 2, MW, 2);
  zebra(c, 5.4, YH.road.y0 + 0.15, 8.6, YH.road.y1 - 0.15, false);
  zebra(c, 29.8, YH.road.y0 + 0.15, 33.2, YH.road.y1 - 0.15, false);
  // 南邊的人行道、房子底下
  tiles(c, r(0, YH.road.y1, YH.W, YH.walk), '#d8d1c4', '#c6bfb1', 10);
  px(c, '#cfc8bb', 0, YH.walk * T, MW, (YH.rowLine - YH.walk) * T);
  // 善鄰門的小路：中華街的紅色地磚
  tiles(c, r(YH.lane.x0, YH.walk, YH.lane.x1, YH.rowLine), '#d4ab92', '#bd8f76', 8);
  // 南邊的大街：西段是馬車道風格的紅磚路、東段是中華街的石板
  const sy = YH.rowLine;
  const sy1 = YH.street.y1;
  px(c, '#a25a44', 0, sy * T, YH.lane.x0 * T, (sy1 - sy) * T);
  for (let y = sy * T, row = 0; y < sy1 * T; y += 4, row += 1) {
    px(c, '#8a4834', 0, Math.round(y) + 3, YH.lane.x0 * T, 1);
    for (let x = (row % 2) * 4; x < YH.lane.x0 * T; x += 8) px(c, '#8a4834', Math.round(x), Math.round(y), 1, 3);
  }
  tiles(c, r(YH.lane.x0, sy, YH.W, sy1), '#d9c6ae', '#c4ae94', 12);
  // 中華街石板上的紅色花紋
  for (let x = YH.lane.x0 * T + 18; x < MW; x += 48) {
    px(c, '#c46a52', x, Math.round(((sy + sy1) / 2) * T) - 4, 8, 8);
    px(c, '#d9c6ae', x + 2, Math.round(((sy + sy1) / 2) * T) - 2, 4, 4);
  }
  // 最南邊的人行道
  px(c, '#9a948a', 0, sy1 * T, MW, 2);
  tiles(c, r(0, sy1 + 0.12, YH.W, YH.H), '#d6cfc2', '#c3bcae', 10);
}

// ── 港未來的天際線（對岸；白天／晚上兩張）──
interface Tower {
  x: number;
  w: number;
  h: number;
  face: string;
  shade: string;
  glass: string;
}
// 對岸的一般大樓（從西到東）
const TOWERS: Tower[] = [
  { x: 6, w: 26, h: 56, face: '#c4ccd4', shade: '#a2adb8', glass: '#7e93a8' },
  { x: 36, w: 22, h: 74, face: '#d4d0c8', shade: '#b3aea4', glass: '#8a96a2' },
  { x: 64, w: 30, h: 48, face: '#b8c6d2', shade: '#96a6b4', glass: '#6f8aa2' },
  { x: 100, w: 18, h: 62, face: '#cdd2d8', shade: '#aab2bc', glass: '#7e93a8' },
  { x: 470, w: 26, h: 66, face: '#c8d0d8', shade: '#a6b0ba', glass: '#7890a8' },
  { x: 502, w: 30, h: 54, face: '#d6d2ca', shade: '#b4aea4', glass: '#8494a4' },
  { x: 536, w: 16, h: 44, face: '#bcc8d4', shade: '#9aa8b6', glass: '#6f8aa2' },
];
// 皇后廣場的三棟（往海邊一棟比一棟矮，屋頂斜的）
const QUEENS: [number, number, number][] = [
  [196, 30, 122],
  [230, 28, 102],
  [262, 26, 84],
];
const LM_X = YH.landmark.x * T;
const LM_TOP = 8;
const SAIL_X = YH.sail.x * T;

function landmarkPath(c: CanvasRenderingContext2D, h: number): void {
  // 地標大廈：方形平面、往上收窄（正面看是兩個面，左亮右暗）
  c.beginPath();
  c.moveTo(LM_X - 34, h - 14);
  c.lineTo(LM_X - 29, h * 0.45);
  c.quadraticCurveTo(LM_X - 24, LM_TOP + 20, LM_X - 20, LM_TOP + 12);
  c.lineTo(LM_X + 20, LM_TOP + 12);
  c.quadraticCurveTo(LM_X + 24, LM_TOP + 20, LM_X + 29, h * 0.45);
  c.lineTo(LM_X + 34, h - 14);
  c.closePath();
}

function skylineSprite(night: boolean): HTMLCanvasElement {
  const w = MW;
  const h = Math.round(SHORE);
  return cached(`yh-sky-${night ? 'n' : 'd'}`, w, h, (c) => {
    const rand = seeded(1989);
    const lit = seeded(2002);
    const win = (day: string) => (night ? (lit() < 0.62 ? (lit() < 0.75 ? '#ffe2a0' : '#f4f6ff') : '#2a3048') : day);
    // 天空
    const sky = c.createLinearGradient(0, 0, 0, h);
    if (night) {
      sky.addColorStop(0, '#08102a');
      sky.addColorStop(0.65, '#1c2858');
      sky.addColorStop(1, '#3c3a6c');
    } else {
      sky.addColorStop(0, '#68aade');
      sky.addColorStop(1, '#dcedf7');
    }
    c.fillStyle = sky;
    c.fillRect(0, 0, w, h);
    if (night) {
      for (let i = 0; i < 90; i += 1) px(c, `rgba(255,255,255,${0.35 + lit() * 0.5})`, Math.floor(lit() * w), Math.floor(lit() * h * 0.55), 1, 1);
      // 月亮
      c.fillStyle = '#fff6d8';
      c.beginPath();
      c.arc(w - 60, 22, 9, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = '#08102a';
      c.beginPath();
      c.arc(w - 55, 19, 8, 0, Math.PI * 2);
      c.fill();
    } else {
      for (const [cx, cy, s] of [[120, 20, 1], [430, 34, 0.8], [700, 16, 1.2], [860, 40, 0.7]] as const) {
        c.fillStyle = 'rgba(255,255,255,0.85)';
        for (const [dx, dy, rr] of [[0, 0, 10], [12, -4, 12], [26, 0, 9], [12, 4, 10]] as const) {
          c.beginPath();
          c.arc(cx + dx * s, cy + dy * s, rr * s, 0, Math.PI * 2);
          c.fill();
        }
      }
    }
    // 遠方的低樓
    for (let x = 0; x < w; ) {
      const bw = 10 + Math.floor(rand() * 14);
      const bh = 8 + Math.floor(rand() * 22);
      px(c, night ? '#1a2038' : rand() < 0.5 ? '#aebccb' : '#b9c4d0', x, h - bh, bw - 1, bh);
      for (let yy = h - bh + 3; yy < h - 3; yy += 4) for (let xx = x + 2; xx < x + bw - 3; xx += 4) px(c, night ? (lit() < 0.35 ? '#ffd88a' : '#1a2038') : '#9aaabb', xx, yy, 2, 2);
      x += bw;
    }
    // 一般的大樓
    for (const t of TOWERS) {
      const top = h - t.h;
      px(c, night ? '#232a44' : t.face, t.x, top, t.w, t.h);
      px(c, night ? '#1a2036' : t.shade, t.x + Math.round(t.w * 0.6), top, Math.round(t.w * 0.4), t.h);
      for (let yy = top + 4; yy < h - 4; yy += 4) for (let xx = t.x + 2; xx < t.x + t.w - 2; xx += 3) px(c, win(t.glass), xx, yy, 2, 2);
      px(c, night ? '#3a4260' : 'rgba(255,255,255,0.4)', t.x, top, t.w, 1);
    }
    // 皇后廣場
    QUEENS.forEach(([x, bw, bh]) => {
      const top = h - bh;
      c.fillStyle = night ? '#1f2a48' : '#88a2b8';
      c.beginPath();
      c.moveTo(x, h);
      c.lineTo(x, top);
      c.lineTo(x + bw, top + 12);
      c.lineTo(x + bw, h);
      c.closePath();
      c.fill();
      c.save();
      c.clip();
      px(c, night ? '#18213c' : '#7590a8', x + Math.round(bw * 0.62), top, Math.round(bw * 0.38), bh);
      for (let yy = top + 2; yy < h - 3; yy += 3) for (let xx = x + 2; xx < x + bw - 1; xx += 3) px(c, night ? (lit() < 0.55 ? '#cfe2ff' : '#1a2440') : '#a8c0d4', xx, yy, 2, 1);
      c.restore();
      c.strokeStyle = night ? '#9fc2ff' : '#e8f0f6';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, top);
      c.lineTo(x + bw, top + 12);
      c.stroke();
    });
    // 弧形的白色飯店
    c.fillStyle = night ? '#2a3050' : '#e6e8ea';
    c.beginPath();
    c.moveTo(296, h);
    c.lineTo(296, h - 70);
    c.quadraticCurveTo(326, h - 66, 334, h - 40);
    c.lineTo(334, h);
    c.closePath();
    c.fill();
    for (let yy = h - 66; yy < h - 4; yy += 4) px(c, win('#9fb2c2'), 299, yy, 22, 2);
    // 地標廣場（底下的裙樓）
    px(c, night ? '#262c44' : '#cfc6b6', LM_X - 58, h - 18, 116, 18);
    px(c, night ? '#30374f' : '#ddd5c6', LM_X - 46, h - 24, 92, 8);
    for (let xx = LM_X - 54; xx < LM_X + 54; xx += 5) px(c, win('#8f9aa4'), xx, h - 13, 3, 4);
    // 地標大廈
    c.save();
    landmarkPath(c, h);
    c.fillStyle = night ? '#2c3250' : '#dcd6cb';
    c.fill();
    c.clip();
    px(c, night ? '#20263e' : '#b9b2a6', LM_X, 0, 40, h);
    // 窗：橫的細條＋直的線
    for (let yy = LM_TOP + 14; yy < h - 14; yy += 3) {
      for (let xx = LM_X - 34; xx < LM_X + 34; xx += 3) {
        const col = night ? (lit() < 0.5 ? (xx < LM_X ? '#ffe6b0' : '#e8c88a') : '#232a44') : xx < LM_X ? '#a8b4bc' : '#8e98a0';
        px(c, col, xx, yy, 2, 1);
      }
    }
    // 四個角的直線（稜線）
    px(c, night ? '#4a5272' : '#efe9de', LM_X - 1, LM_TOP + 12, 2, h);
    c.restore();
    // 頂端：中間挖空的皇冠
    px(c, night ? '#3a4262' : '#cfc8bb', LM_X - 20, LM_TOP, 40, 13);
    px(c, night ? '#ffe9b8' : '#89a8c2', LM_X - 12, LM_TOP + 3, 24, 7);
    px(c, night ? '#3a4262' : '#cfc8bb', LM_X - 2, LM_TOP + 3, 4, 7);
    px(c, night ? '#5a6280' : '#f2ede4', LM_X - 20, LM_TOP, 40, 1);
    px(c, night ? '#ff4a4a' : '#d8d2c8', LM_X - 19, LM_TOP - 2, 2, 2);
    px(c, night ? '#ff4a4a' : '#d8d2c8', LM_X + 17, LM_TOP - 2, 2, 2);
    // 摩天輪後面的低樓（購物中心）
    px(c, night ? '#252b46' : '#cdbfae', 356, h - 20, 120, 20);
    px(c, night ? '#2e3654' : '#e2d6c4', 356, h - 22, 120, 3);
    for (let xx = 360; xx < 472; xx += 6) px(c, win('#8f9aa4'), xx, h - 15, 4, 5);
    // 帆船飯店（洲際）：帆的形狀
    c.save();
    c.beginPath();
    c.moveTo(SAIL_X - 34, h);
    c.lineTo(SAIL_X - 34, h - 36);
    c.quadraticCurveTo(SAIL_X - 12, h - 98, SAIL_X + 22, h - 104);
    c.quadraticCurveTo(SAIL_X + 32, h - 56, SAIL_X + 30, h);
    c.closePath();
    c.fillStyle = night ? '#28305a' : '#eef2f6';
    c.fill();
    c.clip();
    px(c, night ? '#1e2648' : '#d4dce4', SAIL_X + 8, h - 110, 30, 110);
    for (let yy = h - 100; yy < h - 2; yy += 3) px(c, night ? (lit() < 0.6 ? '#bcd4ff' : '#28305a') : '#a9bccc', SAIL_X - 34, yy, 66, 1);
    c.restore();
    c.strokeStyle = night ? '#a8c8ff' : '#ffffff';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(SAIL_X - 34, h - 36);
    c.quadraticCurveTo(SAIL_X - 12, h - 98, SAIL_X + 22, h - 104);
    c.stroke();
    // 國際會議場（波浪屋頂）
    px(c, night ? '#232a46' : '#d8dce2', 618, h - 20, 64, 20);
    c.fillStyle = night ? '#3a4466' : '#f2f4f6';
    c.beginPath();
    c.moveTo(616, h - 20);
    for (let x = 616; x <= 684; x += 4) c.lineTo(x, h - 22 - Math.sin((x - 616) * 0.09) * 4);
    c.lineTo(684, h - 18);
    c.lineTo(616, h - 18);
    c.fill();
    for (let xx = 622; xx < 678; xx += 5) px(c, win('#8fa4b8'), xx, h - 13, 3, 6);
    // 遠方的貨櫃碼頭起重機
    for (const cx of [706, 738]) {
      const col = night ? '#3a3040' : '#d8483a';
      px(c, col, cx, h - 30, 2, 30);
      px(c, col, cx + 12, h - 30, 2, 30);
      px(c, col, cx - 6, h - 32, 30, 3);
      px(c, col, cx + 20, h - 40, 2, 10);
    }
    // 橫濱海灣大橋：兩座 H 形的白色橋塔、斜張索
    const deck = h - 30;
    const bridgeCol = night ? '#7e8cb8' : '#f4f6f8';
    for (const tx of [772, 884]) {
      px(c, bridgeCol, tx - 8, deck - 34, 3, 64);
      px(c, bridgeCol, tx + 6, deck - 34, 3, 64);
      px(c, bridgeCol, tx - 8, deck - 34, 17, 3);
      px(c, bridgeCol, tx - 8, deck - 12, 17, 2);
      c.strokeStyle = night ? 'rgba(160,180,230,0.7)' : 'rgba(240,244,248,0.9)';
      c.lineWidth = 1;
      for (let k = 1; k <= 6; k += 1) {
        c.beginPath();
        c.moveTo(tx, deck - 32);
        c.lineTo(tx - k * 9, deck);
        c.moveTo(tx, deck - 32);
        c.lineTo(tx + k * 9, deck);
        c.stroke();
      }
    }
    px(c, bridgeCol, 690, deck, w - 690, 4);
    px(c, night ? '#5a6890' : '#c9ced6', 690, deck + 4, w - 690, 3);
    for (let x = 700; x < w; x += 30) px(c, night ? '#5a6890' : '#c9ced6', x, deck + 7, 4, h - deck - 7);
  });
}

// ── Cosmo Clock 21：會轉的大摩天輪，中間是數字時鐘；晚上 LED 變色 ──
const WHEEL_CX = YH.wheel.x * T;
const WHEEL_R = YH.wheel.r;
const WHEEL_CY = SHORE - WHEEL_R - 12;
const WHEEL_LIGHTS: CityDef['lights'] = Array.from({ length: 12 }, () => ({ x: WHEEL_CX, y: WHEEL_CY, r: 18, color: 'rgba(255,255,255,0.4)' }));
const WHEEL_REFLECT: CityDef['lights'] = [0, 1, 2].map((k) => ({ x: WHEEL_CX, y: SHORE + 16 + k * 22, r: 26 - k * 4, color: 'rgba(255,255,255,0.2)' }));
const hue = (k: number, seconds: number) => (k * 6 + seconds * 36) % 360;

function drawWheel(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = WHEEL_CX;
  const cy = WHEEL_CY;
  const R = WHEEL_R;
  const by = SHORE;
  const rot = d.seconds * ((Math.PI * 2) / 180);
  // 底座的站房、兩組 A 字形的腳
  px(c, d.night ? '#3a4060' : '#d8dce2', cx - 30, by - 10, 60, 10);
  px(c, d.night ? '#ffe2a0' : '#7e93a8', cx - 26, by - 7, 52, 3);
  c.strokeStyle = d.night ? '#8a94b8' : '#e6eaee';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(cx - 24, by - 8);
  c.lineTo(cx, cy);
  c.lineTo(cx + 24, by - 8);
  c.stroke();
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx - 14, by - 30);
  c.lineTo(cx + 14, by - 30);
  c.stroke();
  // 輻條
  for (let k = 0; k < 30; k += 1) {
    const a = rot + (k / 30) * Math.PI * 2;
    c.strokeStyle = d.night ? `hsla(${hue(k * 2, d.seconds)}, 95%, 65%, 0.75)` : 'rgba(230,234,238,0.75)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18);
    c.lineTo(cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4));
    c.stroke();
  }
  // 內圈、外圈（晚上一段段變色的 LED）
  c.lineWidth = 1;
  c.strokeStyle = d.night ? 'rgba(200,210,255,0.6)' : '#d8dde2';
  c.beginPath();
  c.arc(cx, cy, R - 5, 0, Math.PI * 2);
  c.stroke();
  if (d.night) {
    c.lineWidth = 3;
    for (let k = 0; k < 60; k += 1) {
      const a0 = rot + (k / 60) * Math.PI * 2;
      c.strokeStyle = `hsl(${hue(k, d.seconds)}, 100%, 62%)`;
      c.beginPath();
      c.arc(cx, cy, R, a0, a0 + (Math.PI * 2) / 60 + 0.01);
      c.stroke();
    }
  } else {
    c.lineWidth = 3;
    c.strokeStyle = '#f2f4f6';
    c.beginPath();
    c.arc(cx, cy, R, 0, Math.PI * 2);
    c.stroke();
    c.lineWidth = 1;
    c.strokeStyle = '#b8c0c8';
    c.beginPath();
    c.arc(cx, cy, R + 2, 0, Math.PI * 2);
    c.stroke();
  }
  // 60 個車廂
  const cols = ['#e8402e', '#f6c945', '#3b82f6', '#2bb673', '#f4f6f8', '#ec6aa8'];
  for (let k = 0; k < 60; k += 1) {
    const a = rot + (k / 60) * Math.PI * 2;
    const gx = cx + Math.cos(a) * (R + 3);
    const gy = cy + Math.sin(a) * (R + 3);
    px(c, d.night ? '#fff3c8' : (cols[k % cols.length] ?? '#fff'), Math.round(gx - 1), Math.round(gy), 3, 3);
  }
  // 中間的時鐘
  c.fillStyle = '#e6eaee';
  c.beginPath();
  c.arc(cx, cy, 19, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#161c28';
  c.beginPath();
  c.arc(cx, cy, 17, 0, Math.PI * 2);
  c.fill();
  text(c, jstClock(), cx, cy + 0.5, d.night ? '#9dffc4' : '#56d68c', `900 10px ${FONT_TC}`);
  text(c, 'COSMO CLOCK 21', cx, cy + 9, d.night ? '#ffffff' : '#c9d4e0', `700 3px ${FONT_TC}`);
  // 晚上：光跟著 LED 轉
  WHEEL_LIGHTS.forEach((l, k) => {
    const a = rot + (k / WHEEL_LIGHTS.length) * Math.PI * 2;
    l.x = cx + Math.cos(a) * R;
    l.y = cy + Math.sin(a) * R;
    l.color = `hsla(${hue(k * 5, d.seconds)}, 100%, 60%, 0.5)`;
  });
  WHEEL_REFLECT.forEach((l, k) => {
    l.color = `hsla(${hue(k * 12 + 20, d.seconds)}, 100%, 60%, 0.22)`;
  });
}

// ── 港：水波、晚上的倒影、遊覽船和水上巴士 ──
const BOAT_LIGHTS: CityDef['lights'] = [
  { x: -100, y: 13.4 * T, r: 34, color: 'rgba(255, 220, 150, 0.45)' },
  { x: -100, y: 11.6 * T, r: 20, color: 'rgba(200, 230, 255, 0.4)' },
];
const REFLECTIONS: [number, string][] = [
  [LM_X, '255, 220, 150'],
  [211, '190, 215, 255'],
  [WHEEL_CX, '255, 160, 230'],
  [SAIL_X, '170, 200, 255'],
  [828, '170, 190, 255'],
];
function drawHarbor(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, SHORE + 1, MW, SEA - SHORE - 3);
  c.clip();
  // 水波（會動）
  for (let i = 0; i < 70; i += 1) {
    const y = SHORE + 4 + (((i * 37) % 97) / 97) * (SEA - SHORE - 8);
    const x = ((i * 131 + d.seconds * (5 + (i % 4) * 2)) % (MW + 20)) - 10;
    px(c, `rgba(235,250,255,${0.25 + 0.2 * Math.sin(d.seconds * 1.4 + i)})`, Math.round(x), Math.round(y), 5 + (i % 3) * 3, 1);
  }
  // 晚上：對岸的燈映在水上（一條條晃動的光）
  if (d.night) {
    for (const [rx, rgb] of REFLECTIONS) {
      for (let k = 0; k < 14; k += 1) {
        const yy = SHORE + 3 + k * 6;
        const wob = Math.sin(d.seconds * 2 + k * 1.3 + rx) * 3;
        const ww = 14 - k * 0.6;
        const col = rx === WHEEL_CX ? `hsla(${hue(k * 4, d.seconds)}, 100%, 65%, ${0.55 - k * 0.03})` : `rgba(${rgb}, ${0.55 - k * 0.03})`;
        px(c, col, Math.round(rx - ww / 2 + wob), Math.round(yy), Math.round(ww), 2);
      }
    }
  }
  // 水上巴士（小，往東開）
  const span = MW + 240;
  const sx = ((d.seconds * 13 + 300) % span) - 120;
  const sy = 11.7 * T;
  px(c, 'rgba(255,255,255,0.5)', Math.round(sx - 34), sy + 1, 14, 1);
  px(c, '#f4f6f8', Math.round(sx - 18), sy - 6, 36, 7);
  px(c, '#1f6fd0', Math.round(sx - 18), sy - 2, 36, 2);
  px(c, '#2a6fb0', Math.round(sx - 10), sy - 11, 22, 5);
  for (let k = 0; k < 4; k += 1) px(c, d.night ? '#ffe8a8' : '#bfe0f4', Math.round(sx - 8 + k * 5), sy - 10, 3, 3);
  // 遊覽船（紅白、兩層，往西開）
  const bx = MW + 120 - ((d.seconds * 8) % span);
  const byy = 14.2 * T;
  px(c, 'rgba(255,255,255,0.45)', Math.round(bx + 52), byy, 20, 1);
  px(c, 'rgba(0,0,0,0.2)', Math.round(bx - 50), byy + 1, 100, 3);
  c.fillStyle = '#f6f4f0';
  c.beginPath();
  c.moveTo(bx - 56, byy - 13);
  c.lineTo(bx + 50, byy - 13);
  c.lineTo(bx + 48, byy);
  c.lineTo(bx - 44, byy);
  c.closePath();
  c.fill();
  px(c, '#c8242a', Math.round(bx - 52), byy - 6, 100, 3);
  px(c, '#f6f4f0', Math.round(bx - 36), byy - 24, 74, 11);
  px(c, '#c8242a', Math.round(bx - 36), byy - 24, 74, 2);
  px(c, '#f6f4f0', Math.round(bx - 20), byy - 31, 34, 7);
  for (let k = -32; k < 34; k += 7) px(c, d.night ? '#ffdc8a' : '#3a4a5a', Math.round(bx + k), byy - 20, 5, 4);
  for (let k = -16; k < 12; k += 6) px(c, d.night ? '#ffdc8a' : '#3a4a5a', Math.round(bx + k), byy - 29, 4, 3);
  px(c, '#2a2a2e', Math.round(bx + 4), byy - 37, 2, 6);
  c.restore();
  const b0 = BOAT_LIGHTS[0];
  const b1 = BOAT_LIGHTS[1];
  if (b0) b0.x = bx;
  if (b1) b1.x = sx;
}

// ── 冰川丸：黑色船身、白色上層、黑底紅白帶的煙囪、兩根桅杆（晚上燈串會亮）──
const HK = YH.hikawa;
const HK_W = Math.round((HK.x1 - HK.x0) * T);
const HK_H = 100;
const HK_X0 = HK.x0 * T;
const HK_TOP = HK.line * T - HK_H;
// 燈串（滿船飾）：船頭 → 前桅頂 → 後桅頂 → 船尾（sprite 座標）
const DRESS: [number, number][] = [
  [3, 66],
  [44, 4],
  [222, 6],
  [259, 72],
];
function dressPoints(step: number): [number, number][] {
  const out: [number, number][] = [];
  for (let i = 0; i < DRESS.length - 1; i += 1) {
    const [ax, ay] = DRESS[i] ?? [0, 0];
    const [bx, by] = DRESS[i + 1] ?? [0, 0];
    const len = Math.hypot(bx - ax, by - ay);
    const n = Math.floor(len / step);
    for (let k = 0; k < n; k += 1) {
      const t = k / n;
      // 中間那段（兩根桅杆之間）垂下來一點
      const sag = i === 1 ? Math.sin(t * Math.PI) * 10 : 0;
      out.push([ax + (bx - ax) * t, ay + (by - ay) * t + sag]);
    }
  }
  return out;
}
function hikawaSprite(night: boolean): HTMLCanvasElement {
  const w = HK_W;
  const h = HK_H;
  return cached(`yh-hikawa-${night ? 'n' : 'd'}`, w, h, (c) => {
    // 桅杆、吊桿
    for (const [mx, top] of [[44, 4], [222, 6]] as const) {
      px(c, '#3a3330', mx - 1, top, 2, 70 - top);
      px(c, '#3a3330', mx - 8, top + 12, 16, 1);
      c.strokeStyle = '#4a423c';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(mx, top + 22);
      c.lineTo(mx + (mx < 100 ? 18 : -18), 62);
      c.stroke();
    }
    // 燈串（滿船飾）：白天是小旗子、晚上是燈泡
    c.strokeStyle = 'rgba(40,36,34,0.7)';
    c.lineWidth = 1;
    c.beginPath();
    dressPoints(4).forEach(([x, y], k) => (k === 0 ? c.moveTo(x, y) : c.lineTo(x, y)));
    c.stroke();
    const flags = ['#e8402e', '#f6c945', '#1f5fa8', '#f4f6f8', '#2a8a4a'];
    dressPoints(6).forEach(([x, y], k) => {
      if (night) px(c, '#fff4c0', Math.round(x), Math.round(y), 2, 2);
      else px(c, flags[k % flags.length] ?? '#e8402e', Math.round(x), Math.round(y) + 1, 2, 3);
    });
    // 煙囪：黑色，中間白帶夾兩條紅線（日本郵船的「二引」）
    const fx = 124;
    px(c, '#1a1a1c', fx, 22, 22, 36);
    px(c, '#f4f2ec', fx, 30, 22, 10);
    px(c, '#c8202a', fx, 32, 22, 2);
    px(c, '#c8202a', fx, 36, 22, 2);
    px(c, 'rgba(255,255,255,0.18)', fx + 2, 22, 2, 36);
    px(c, '#2a2a2e', fx - 1, 20, 24, 3);
    // 上層建築（白色，三層）
    px(c, '#f2f0ea', 64, 44, 44, 12);
    px(c, '#f2f0ea', 56, 56, 154, 10);
    px(c, '#f2f0ea', 40, 66, 190, 10);
    px(c, '#d8d4ca', 40, 75, 190, 1);
    for (let x = 68; x < 104; x += 6) px(c, night ? '#ffe2a0' : '#2e3a46', x, 47, 4, 3);
    for (let x = 60; x < 206; x += 6) px(c, night ? '#ffdc8a' : '#3a4654', x, 59, 3, 3);
    for (let x = 44; x < 226; x += 5) px(c, night ? '#ffdc8a' : '#3a4654', x, 69, 3, 3);
    // 救生艇
    for (const bx of [108, 152, 172, 192]) {
      px(c, '#3a3330', bx - 1, 50, 1, 6);
      px(c, '#f6f4ee', bx, 52, 14, 4);
      px(c, '#c8b48a', bx, 55, 14, 1);
    }
    // 通風管
    for (const vx of [112, 164, 200]) {
      px(c, '#f2f0ea', vx, 48, 3, 8);
      px(c, '#c8202a', vx - 1, 46, 5, 3);
    }
    // 船身（黑色、船頭在西邊）
    c.fillStyle = '#1a1a1c';
    c.beginPath();
    c.moveTo(2, 66);
    c.quadraticCurveTo(110, 78, 258, 72);
    c.lineTo(262, 80);
    c.quadraticCurveTo(258, 92, 246, 96);
    c.lineTo(28, 96);
    c.quadraticCurveTo(12, 84, 2, 66);
    c.closePath();
    c.fill();
    c.strokeStyle = '#e8e4da';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(3, 67);
    c.quadraticCurveTo(110, 79, 258, 73);
    c.stroke();
    // 舷窗
    for (let x = 30; x < 244; x += 7) px(c, night ? '#ffd88a' : '#9a968c', x, 82, 2, 2);
    // 吃水線的紅
    px(c, '#a8302a', 30, 95, 214, 3);
    px(c, 'rgba(255,255,255,0.15)', 30, 98, 214, 2);
    // 船名、錨
    text(c, '氷川丸', 32, 78.5, '#f4f2ec', `700 5px ${SERIF_TC}`);
    text(c, 'HIKAWA MARU', 230, 80, '#f4f2ec', `700 4px ${FONT_TC}`);
    px(c, '#8a8680', 16, 74, 3, 5);
  });
}
function drawHikawa(c: CanvasRenderingContext2D, d: DrawCtx): void {
  // 船身在水上一點點上下晃
  const bob = Math.round(Math.sin(d.seconds * 0.7) * 0.8);
  blit(c, hikawaSprite(d.night), HK_X0, HK.line * T + bob);
  // 舷梯（從船上斜斜接到岸邊）
  const gx = HK_X0 + 150;
  const gy = HK_TOP + 70;
  c.fillStyle = '#d8d4ca';
  c.beginPath();
  c.moveTo(gx, gy);
  c.lineTo(gx + 6, gy);
  c.lineTo(gx + 22, SEA + 2);
  c.lineTo(gx + 14, SEA + 2);
  c.closePath();
  c.fill();
  c.strokeStyle = '#6a6660';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(gx, gy - 4);
  c.lineTo(gx + 14, SEA - 4);
  c.stroke();
}

// ── 岸邊的欄杆：石柱＋垂下來的鐵鍊 ──
function drawRailing(c: CanvasRenderingContext2D): void {
  const y = SEA + 1;
  const gap0 = HK_X0 + 160;
  const gap1 = HK_X0 + 180;
  const runs: [number, number][] = [
    [11.2 * T, 13.2 * T],
    [YH.park.x0 * T, gap0],
    [gap1, MW],
  ];
  for (const [a, b] of runs) {
    for (let x = a + 2; x < b - 2; x += 24) {
      const nx = Math.min(x + 24, b - 2);
      c.strokeStyle = '#3a3d45';
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x + 2, y - 8);
      c.quadraticCurveTo((x + nx) / 2 + 1, y - 3, nx, y - 8);
      c.stroke();
    }
    for (let x = a + 2; x < b - 1; x += 24) {
      px(c, '#a8a296', x, y - 10, 4, 10);
      px(c, '#cfc9bd', x, y - 10, 4, 2);
    }
  }
}

// ── 紅磚倉庫：紅磚、白色的石帶、拱窗、鐵陽台、樓梯間的山牆 ──
const BRICK_H = 88;
function brickSprite(which: 'no1' | 'no2', night: boolean): HTMLCanvasElement {
  const b = YH.brick[which];
  const w = Math.round((b.x1 - b.x0) * T);
  const h = BRICK_H;
  return cached(`yh-brick-${which}-${night ? 'n' : 'd'}`, w, h, (c) => {
    const roofY = 12;
    // 屋頂（灰色）
    c.fillStyle = '#5b6068';
    c.beginPath();
    c.moveTo(0, roofY + 3);
    c.lineTo(8, 4);
    c.lineTo(w - 8, 4);
    c.lineTo(w, roofY + 3);
    c.closePath();
    c.fill();
    for (let y = 6; y < roofY + 2; y += 2) px(c, 'rgba(255,255,255,0.08)', 4, y, w - 8, 1);
    // 磚牆
    brickWall(c, 0, roofY + 2, w, h - roofY - 8);
    // 白色的簷口、石帶
    px(c, '#e2d8c6', 0, roofY + 2, w, 3);
    px(c, '#c9bea9', 0, roofY + 5, w, 1);
    for (const y of [38, 60]) {
      px(c, '#ddd2bd', 0, y, w, 2);
      px(c, 'rgba(0,0,0,0.15)', 0, y + 2, w, 1);
    }
    // 樓梯間（凸出來、上面有三角山牆）
    const towers = which === 'no2' ? [w * 0.2, w * 0.5, w * 0.8] : [w * 0.25, w * 0.75];
    for (const tx0 of towers) {
      const tx = Math.round(tx0 - 9);
      brickWall(c, tx, roofY - 2, 18, h - roofY - 4, '#a84a36', '#8c3c2a');
      c.fillStyle = '#a84a36';
      c.beginPath();
      c.moveTo(tx - 1, roofY - 1);
      c.lineTo(tx + 9, 0);
      c.lineTo(tx + 19, roofY - 1);
      c.closePath();
      c.fill();
      c.strokeStyle = '#e2d8c6';
      c.lineWidth = 1;
      c.stroke();
      px(c, '#e2d8c6', tx + 7, 5, 4, 4);
      // 樓梯間的窄窗
      for (const y of [20, 42, 64]) {
        px(c, '#e2d8c6', tx + 6, y - 1, 6, 12);
        px(c, night ? '#ffd27a' : '#2e3a46', tx + 7, y, 4, 10);
      }
    }
    const inTower = (x: number) => towers.some((t) => Math.abs(x + 4 - t) < 14);
    // 拱窗（樓上兩層）
    for (const y of [20, 42]) {
      for (let x = 5; x < w - 10; x += 13) {
        if (inTower(x)) continue;
        px(c, '#e8e0d0', x - 1, y - 1, 10, 14);
        px(c, night ? '#ffcf78' : '#2e3a46', x, y + 1, 8, 12);
        px(c, night ? '#ffcf78' : '#2e3a46', x + 1, y, 6, 1);
        px(c, '#e8e0d0', x + 3, y - 2, 2, 2);
        px(c, night ? '#e8a850' : '#46525e', x + 4, y + 1, 1, 12);
      }
    }
    // 鐵陽台（深綠的鐵欄杆、三角托架）：每層在樓梯間之間
    const spans: [number, number][] = [];
    const edges = [8, ...towers, w - 8];
    for (let i = 0; i < edges.length - 1; i += 1) {
      const a = (edges[i] ?? 0) + (i === 0 ? 0 : 12);
      const bb = (edges[i + 1] ?? w) - (i === edges.length - 2 ? 0 : 12);
      const mid = (a + bb) / 2;
      spans.push([mid - Math.min(26, (bb - a) / 2), mid + Math.min(26, (bb - a) / 2)]);
    }
    for (const y of [36, 58]) {
      for (const [a, bb] of spans) {
        px(c, '#2c3532', Math.round(a), y - 8, Math.round(bb - a), 1);
        px(c, '#2c3532', Math.round(a), y - 1, Math.round(bb - a), 2);
        for (let x = a; x < bb; x += 3) px(c, '#2c3532', Math.round(x), y - 7, 1, 6);
        for (let x = a + 4; x < bb; x += 16) {
          px(c, '#2c3532', Math.round(x), y + 1, 2, 3);
          px(c, '#2c3532', Math.round(x) + 2, y + 1, 1, 1);
        }
      }
    }
    // 一樓：拱門的店面
    const gy = 64;
    for (let x = 6; x < w - 12; x += 15) {
      if (inTower(x)) continue;
      px(c, '#e8e0d0', x - 1, gy - 1, 12, h - gy - 5);
      px(c, night ? '#ffd890' : '#3a4450', x, gy + 1, 10, h - gy - 7);
      px(c, night ? '#fff0c0' : '#6a8aa0', x + 1, gy + 3, 8, 6);
      px(c, '#e8e0d0', x + 4, gy - 2, 2, 2);
    }
    // 招牌
    const sx = Math.round(w / 2);
    px(c, '#2a2624', sx - 26, 62, 52, 9);
    text(c, `赤レンガ倉庫 ${which === 'no1' ? '1' : '2'}号館`, sx, 66.5, '#f2ece0', `700 5px ${FONT_TC}`, 'center', 48);
    // 花崗岩的基座
    px(c, '#9a948a', 0, h - 6, w, 6);
    px(c, '#b5afa4', 0, h - 6, w, 1);
  });
}

// 紅磚倉庫前的燈串（杆子＋燈泡）
const BRICK_POLES = [1.2, 11.4, 20.8];
function drawBrickLights(c: CanvasRenderingContext2D, d: DrawCtx): void {
  for (const x of BRICK_POLES) {
    const cx = Math.round(x * T);
    const by = Math.round(25.6 * T);
    px(c, 'rgba(0,0,0,0.2)', cx - 2, by - 1, 5, 2);
    px(c, '#3a3d45', cx, by - 40, 2, 40);
  }
  for (let i = 0; i < BRICK_POLES.length - 1; i += 1) drawStringLights(c, (BRICK_POLES[i] ?? 0) + 0.1, (BRICK_POLES[i + 1] ?? 0) + 0.1, 25.6 - 40 / T, d.night, 3);
}

// ── 山下公園：水之守護神（噴水池）、銀杏、瓦斯燈 ──
function drawFountain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(YH.fountain.x * T);
  const by = Math.round(YH.fountain.y * T);
  // 水池
  c.fillStyle = '#b9b2a4';
  c.beginPath();
  c.ellipse(cx, by - 5, 28, 10, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#5f9cc4';
  c.beginPath();
  c.ellipse(cx, by - 6, 25, 8, 0, 0, Math.PI * 2);
  c.fill();
  for (let k = 0; k < 3; k += 1) {
    const t = (d.seconds * 0.5 + k / 3) % 1;
    c.strokeStyle = `rgba(255,255,255,${0.5 * (1 - t)})`;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(cx, by - 6, 6 + t * 18, 2 + t * 6, 0, 0, Math.PI * 2);
    c.stroke();
  }
  // 台座
  px(c, '#cfc8ba', cx - 6, by - 26, 12, 20);
  px(c, '#e2dccf', cx - 7, by - 27, 14, 3);
  px(c, '#a8a194', cx + 2, by - 24, 4, 18);
  // 銅像（綠色的女神：長裙、左手扛著水瓶）
  const bronze = '#5e8a78';
  const dark = '#46705f';
  c.fillStyle = bronze;
  c.beginPath();
  c.moveTo(cx - 2, by - 44);
  c.lineTo(cx + 2, by - 44);
  c.lineTo(cx + 5, by - 27);
  c.lineTo(cx - 5, by - 27);
  c.closePath();
  c.fill();
  px(c, dark, cx + 1, by - 40, 2, 13);
  px(c, bronze, cx - 2, by - 48, 4, 4);
  px(c, dark, cx - 2, by - 49, 4, 2);
  px(c, bronze, cx - 4, by - 43, 2, 7);
  px(c, bronze, cx + 2, by - 49, 2, 6);
  px(c, bronze, cx + 2, by - 54, 6, 5);
  px(c, dark, cx + 6, by - 53, 2, 2);
  // 水從瓶口流下來
  for (let k = 0; k < 6; k += 1) {
    const t = (d.seconds * 1.2 + k / 6) % 1;
    const x = cx + 8 + t * 10;
    const y = by - 52 + t * t * 46;
    px(c, 'rgba(225,245,255,0.85)', Math.round(x), Math.round(y), 2, 2);
  }
}

function drawGinkgo(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const m = yhMonth();
  const yellow = m === 11 || m === 12;
  const cols = yellow ? ['#e8b830', '#f2cc4a', '#d9a020', '#f8de70'] : ['#4f8a3c', '#5e9a48', '#447a34', '#76b05a'];
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  px(c, '#5c3d22', cx - 1, by - 16, 3, 16);
  // 銀杏是尖尖的樹形（下寬上窄）
  for (const [dx, dy, r, k] of [[-6, -18, 7, 0], [6, -18, 7, 1], [0, -24, 8, 2], [-3, -32, 6, 3], [3, -30, 6, 1], [0, -38, 4, 0]] as const) {
    c.fillStyle = cols[k] ?? '#4f8a3c';
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  if (yellow) for (const [dx, dy] of [[-9, 1], [6, 2], [11, -1], [-4, 3]] as const) px(c, '#f2cc4a', cx + dx, by + dy - 1, 2, 1);
}

// 瓦斯燈（馬車道是日本第一盞瓦斯路燈的地方）
function drawGasLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  px(c, '#23262c', cx - 2, by - 4, 5, 4);
  px(c, '#2c3038', cx, by - 30, 2, 27);
  px(c, '#23262c', cx - 2, by - 31, 6, 2);
  px(c, '#23262c', cx - 3, by - 40, 8, 9);
  px(c, night ? '#ffe7a0' : '#efe8cf', cx - 2, by - 39, 6, 7);
  px(c, night ? '#fff6d0' : '#ffffff', cx - 1, by - 38, 1, 3);
  c.fillStyle = '#23262c';
  c.beginPath();
  c.moveTo(cx - 4, by - 40);
  c.lineTo(cx + 1, by - 44);
  c.lineTo(cx + 6, by - 40);
  c.fill();
  px(c, '#23262c', cx, by - 46, 2, 2);
}

// ── JR 櫻木町站：高架的月台、玻璃站房、裡面展示的蒸汽火車頭 ──
const ST_W = Math.round((YH.station.x1 - YH.station.x0) * T);
const ST_H = 80;
function stationSprite(night: boolean): HTMLCanvasElement {
  const w = ST_W;
  const h = ST_H;
  return cached(`yh-station-${night ? 'n' : 'd'}`, w, h, (c) => {
    // 高架橋
    px(c, '#5a5048', 0, 12, w, 2);
    px(c, '#a9adb3', 0, 14, w, 9);
    px(c, '#c9ccd2', 0, 14, w, 2);
    for (let x = 8; x < w; x += 56) px(c, '#9aa0a8', x, 23, 10, 10);
    // 站房（白框＋玻璃）
    px(c, '#eceef0', 0, 28, w, h - 28);
    px(c, '#ffffff', 0, 28, w, 2);
    for (let y = 48; y < h - 22; y += 7) for (let x = 4; x < w - 4; x += 9) px(c, night ? '#cfe4ff' : (x + y) % 3 ? '#6f8ea8' : '#81a0b8', x, y, 7, 5);
    // 站名的牌子
    px(c, '#f8f9fa', w / 2 - 54, 32, 108, 13);
    px(c, '#2a9a4a', w / 2 - 52, 34, 13, 9);
    text(c, 'JR', w / 2 - 45.5, 38.5, '#ffffff', `900 6px ${FONT_TC}`);
    text(c, '桜木町', w / 2 - 16, 38.5, '#1f2a44', `900 8px ${FONT_TC}`);
    text(c, 'Sakuragichō', w / 2 + 28, 38.5, '#1f2a44', `700 6px ${FONT_TC}`);
    // 入口
    px(c, '#e8eaee', 30, h - 26, w - 60, 4);
    px(c, '#2a3a4a', 34, h - 22, w - 68, 22);
    for (let x = 40; x < w - 40; x += 16) px(c, night ? '#fff2c8' : '#9fd8ff', x, h - 20, 11, 18);
    // 驗票閘門
    for (let x = 56; x < w - 56; x += 12) px(c, '#c9ccd2', x, h - 8, 6, 8);
    // 左邊玻璃裡展示的蒸汽火車頭（日本第一條鐵路）
    px(c, night ? '#f6e6c0' : '#cfe0ec', 4, h - 26, 26, 22);
    px(c, '#1a1a1c', 7, h - 15, 18, 6);
    px(c, '#1a1a1c', 20, h - 20, 6, 11);
    px(c, '#1a1a1c', 9, h - 19, 3, 4);
    px(c, '#c8242a', 7, h - 9, 18, 2);
    px(c, '#3a3a3e', 9, h - 7, 4, 3);
    px(c, '#3a3a3e', 17, h - 7, 4, 3);
    px(c, '#e0b03a', 7, h - 13, 2, 2);
    // 右邊的商店
    px(c, night ? '#ffe2a0' : '#f4e6c8', w - 30, h - 26, 26, 22);
    px(c, '#2a9a4a', w - 30, h - 28, 26, 3);
  });
}
// 高架上開過去的根岸線電車（銀色車身、水藍色的線）
function drawTrain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = YH.station.x0 * T;
  const top = YH.rowLine * T - ST_H;
  const cycle = 16;
  const t = d.seconds % cycle;
  if (t > 8) return;
  const len = 160;
  const x = x0 + ST_W - (t / 8) * (ST_W + len);
  c.save();
  c.beginPath();
  c.rect(x0, top - 2, ST_W, 15);
  c.clip();
  for (let k = 0; k < 3; k += 1) {
    const cx = x + k * 52;
    px(c, '#d6dbe0', cx, top + 1, 50, 11);
    px(c, '#2bb6e6', cx, top + 7, 50, 2);
    for (let wx = cx + 4; wx < cx + 46; wx += 7) px(c, d.night ? '#fff2c8' : '#3a4a5a', wx, top + 3, 5, 3);
    px(c, '#3a3d45', cx + 6, top - 1, 8, 2);
  }
  c.restore();
}

// ── 西式老飯店：米色的外牆、拱窗、中央的玄關（拿坡里義大利麵的店）──
const HT_W = Math.round((YH.hotel.x1 - YH.hotel.x0) * T);
const HT_H = 80;
function hotelSprite(night: boolean): HTMLCanvasElement {
  const w = HT_W;
  const h = HT_H;
  return cached(`yh-hotel-${night ? 'n' : 'd'}`, w, h, (c) => {
    const wall = '#e8dabb';
    const cx = Math.round(w / 2);
    px(c, wall, 0, 6, w, h - 6);
    // 屋頂的欄杆、簷口（齒飾）
    px(c, '#d4c49c', 0, 6, w, 4);
    for (let x = 1; x < w; x += 3) px(c, '#b8a67c', x, 9, 1, 1);
    px(c, '#e8dabb', 2, 1, w - 4, 5);
    for (let x = 4; x < w - 4; x += 4) px(c, '#c8b88e', x, 2, 2, 4);
    px(c, '#c8b88e', 2, 0, w - 4, 1);
    // 中央凸出的部分（顏色淺一點、上面一塊三角山牆）
    px(c, '#f0e4c8', cx - 24, 10, 48, h - 10);
    c.fillStyle = '#f0e4c8';
    c.beginPath();
    c.moveTo(cx - 26, 10);
    c.lineTo(cx, 0);
    c.lineTo(cx + 26, 10);
    c.fill();
    c.strokeStyle = '#c8b88e';
    c.lineWidth = 1;
    c.stroke();
    px(c, '#c8a040', cx - 3, 4, 6, 4);
    // 樓上三層的窗（最上面一層是拱窗）
    const winCol = (k: number) => (night ? (k % 5 === 2 ? '#3a4050' : '#ffd98a') : '#3b4a5a');
    let k = 0;
    for (const [y, arch] of [[14, true], [27, false], [40, false]] as const) {
      for (let x = 6; x < w - 8; x += 12) {
        k += 1;
        px(c, '#fbf4e2', x - 1, y - 1, 9, 12);
        px(c, winCol(k), x, y + (arch ? 1 : 0), 7, arch ? 10 : 10);
        if (arch) px(c, winCol(k), x + 1, y, 5, 1);
        px(c, 'rgba(255,255,255,0.35)', x + 1, y + 2, 2, 2);
        px(c, '#c8b88e', x - 1, y + 11, 9, 1);
      }
      px(c, 'rgba(0,0,0,0.08)', 0, y + 12, w, 1);
    }
    // 一樓：石砌的橫紋
    px(c, '#ddcca6', 0, 54, w, h - 54);
    for (let y = 56; y < h; y += 4) px(c, '#c9b78e', 0, y, w, 1);
    // 一樓的拱窗（餐廳）
    for (let x = 6; x < w - 10; x += 16) {
      if (Math.abs(x + 6 - cx) < 22) continue;
      px(c, '#fbf4e2', x - 1, 59, 13, 19);
      px(c, night ? '#ffd890' : '#3a4450', x, 61, 11, 17);
      px(c, night ? '#ffd890' : '#3a4450', x + 2, 60, 7, 1);
      px(c, night ? '#e8a850' : '#5a6878', x + 5, 61, 1, 17);
    }
    // 餐廳的遮陽棚（綠白條紋）
    for (let x = 4; x < cx - 26; x += 6) px(c, (x / 6) % 2 < 1 ? '#2f5d46' : '#f4f1e8', x, 55, 6, 4);
    for (let x = cx + 26; x < w - 4; x += 6) px(c, (x / 6) % 2 < 1 ? '#2f5d46' : '#f4f1e8', x, 55, 6, 4);
    // 招牌（自己編的名字）
    px(c, '#2f3a32', cx - 44, 46, 88, 8);
    px(c, '#c8a040', cx - 44, 46, 88, 1);
    text(c, 'HOTEL MINATO-NO-OKA', cx, 50.5, '#f0d27a', `700 5px ${SERIF_TC}`, 'center', 84);
    // 玄關：拱門、深綠的雨棚、金色的燈
    px(c, '#fbf4e2', cx - 13, 58, 26, 22);
    px(c, night ? '#ffd27a' : '#6a4a2a', cx - 10, 62, 20, 18);
    px(c, night ? '#fff0c0' : '#e8c88a', cx - 8, 64, 7, 14);
    px(c, night ? '#fff0c0' : '#e8c88a', cx + 1, 64, 7, 14);
    px(c, '#2f5d46', cx - 16, 56, 32, 4);
    px(c, '#c8a040', cx - 16, 59, 32, 1);
    text(c, 'ホテル', cx, 57.8, '#f0d27a', `700 3px ${FONT_TC}`);
    // 旗子
    for (const [fx, col] of [[cx - 34, '#c8242a'], [cx + 34, '#1f4e9c']] as const) {
      px(c, '#6a6a6e', fx, 26, 1, 16);
      px(c, col, fx + 1, 27, 6, 4);
    }
  });
}

// 露台的小圓桌＋陽傘
function drawCafeTable(c: CanvasRenderingContext2D): void {
  const cx = Math.round(CAFE_TABLE.x * T);
  const by = Math.round(CAFE_TABLE.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 7, by, 14, 3);
  px(c, '#3a3d45', cx - 1, by - 8, 2, 8);
  px(c, '#3a3d45', cx - 4, by - 1, 8, 1);
  px(c, '#f6f4ee', cx - 7, by - 11, 14, 3);
  px(c, '#e0dccf', cx - 7, by - 8, 14, 1);
  // 一盤拿坡里義大利麵、咖啡杯
  px(c, '#ffffff', cx - 5, by - 13, 6, 2);
  px(c, '#e0602a', cx - 4, by - 14, 4, 2);
  px(c, '#5a9a3a', cx - 2, by - 14, 1, 1);
  px(c, '#f4f1e8', cx + 2, by - 14, 3, 3);
  // 陽傘
  px(c, '#e8e4da', cx, by - 46, 1, 35);
  c.fillStyle = '#2f5d46';
  c.beginPath();
  c.moveTo(cx - 24, by - 36);
  c.quadraticCurveTo(cx, by - 54, cx + 24, by - 36);
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  for (let k = -24; k < 24; k += 8) px(c, '#f4f1e8', cx + k, by - 56, 4, 22);
  c.restore();
  px(c, '#c8a040', cx - 1, by - 49, 3, 2);
}
// 拿坡里麵的黑板菜單
function drawMenuBoard(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by - 1, 12, 2);
  px(c, '#6a4a2a', cx - 6, by - 18, 12, 16);
  px(c, '#2a3a30', cx - 5, by - 17, 10, 13);
  text(c, 'ナポリ', cx, by - 13, '#f4f1e8', `700 3px ${FONT_TC}`);
  text(c, 'タン', cx, by - 9.5, '#f4f1e8', `700 3px ${FONT_TC}`);
  px(c, '#e0602a', cx - 2, by - 7, 4, 2);
  px(c, '#6a4a2a', cx - 6, by - 2, 2, 2);
  px(c, '#6a4a2a', cx + 4, by - 2, 2, 2);
}

// ── 善鄰門：四根紅柱、綠瓦的三座屋頂、金字匾額 ──
function drawGate(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const G = YH.gate;
  const by = Math.round(G.line * T);
  const sideL = Math.round(G.x0 * T);
  const sideR = Math.round(G.x1 * T) - 4;
  const cx = Math.round(((G.x0 + G.x1) / 2) * T);
  const mainL = cx - 26;
  const mainR = cx + 22;
  // 柱子（石頭的基座）
  for (const [x, hgt] of [[sideL, 40], [sideR, 40], [mainL, 58], [mainR, 58]] as const) {
    px(c, 'rgba(0,0,0,0.25)', x - 2, by, 8, 2);
    px(c, VERMILION, x, by - hgt, 4, hgt);
    px(c, 'rgba(255,255,255,0.25)', x, by - hgt, 1, hgt);
    px(c, '#b8b2a6', x - 1, by - 5, 6, 5);
    px(c, '#d4cec2', x - 1, by - 5, 6, 1);
  }
  // 兩邊的小屋頂、橫樑
  for (const [a, b] of [[sideL, mainL + 4], [mainR, sideR + 4]] as const) {
    px(c, VERMILION, a, by - 38, b - a, 3);
    px(c, '#2a5aa8', a, by - 35, b - a, 2);
    px(c, GOLD, a, by - 33, b - a, 1);
    cnRoof(c, (a + b) / 2, by - 50, b - a + 10, 9, JADE, JADE_DARK, 4);
  }
  // 中間：彩繪的斗栱、匾額、大屋頂
  px(c, VERMILION, mainL, by - 56, mainR + 4 - mainL, 4);
  for (let x = mainL; x < mainR + 4; x += 4) px(c, ['#2a5aa8', JADE, GOLD, '#e8402e'][(x / 4) % 4 | 0] ?? GOLD, x, by - 64, 3, 7);
  px(c, VERMILION, mainL - 2, by - 66, mainR + 8 - mainL, 2);
  cnRoof(c, cx, by - 82, mainR - mainL + 22, 14, JADE, JADE_DARK, 6);
  // 屋脊上的金色裝飾
  px(c, GOLD, cx - 3, by - 88, 6, 4);
  px(c, GOLD_LIGHT, cx - 1, by - 90, 2, 2);
  // 匾額（藍底金字）
  px(c, GOLD, cx - 15, by - 54, 30, 13);
  px(c, '#1f3a7a', cx - 14, by - 53, 28, 11);
  text(c, '中華街', cx, by - 47.5, d.night ? '#fff0a8' : GOLD_LIGHT, `900 8px ${SERIF_TC}`);
  // 小匾「親仁善鄰」
  px(c, '#1f3a7a', cx - 11, by - 79, 22, 6);
  text(c, '親仁善鄰', cx, by - 76, GOLD_LIGHT, `700 4px ${SERIF_TC}`);
  // 掛在樑下的燈籠
  for (const x of [mainL + 8, cx, mainR - 6]) drawLantern(c, x, by - 40, VERMILION, d.night);
  // 石獅子
  for (const x of [mainL - 8, mainR + 8]) {
    px(c, '#b8b2a6', x - 3, by - 4, 8, 4);
    px(c, '#9a948a', x - 2, by - 11, 6, 7);
    px(c, '#9a948a', x - 2, by - 14, 4, 4);
  }
}

// ── 中華街的街屋：紅色的牆、綠瓦、豎的招牌、橫的招牌、一樓的店面 ──
const CN_H = 78;
const CN_STYLE: Record<ChinaKind, { wall: string; trim: string; sign: string; signBg: string; v: string; vBg: string }> = {
  nikuman: { wall: '#c8342a', trim: GOLD, sign: '點心 · 肉包', signBg: '#1f1a18', v: '肉まん', vBg: '#f6d23a' },
  tea: { wall: '#e8c46a', trim: JADE, sign: '中國茶 · 雜貨', signBg: '#7a1a1a', v: '茶藝館', vBg: '#c8242a' },
  sanma: { wall: '#a8242a', trim: GOLD, sign: '中華料理', signBg: '#1f3a7a', v: '生碼麵', vBg: '#f6d23a' },
};
function chinaSprite(kind: ChinaKind, w: number, night: boolean): HTMLCanvasElement {
  const h = CN_H;
  return cached(`yh-cn-${kind}-${night ? 'n' : 'd'}`, w, h, (c) => {
    const s = CN_STYLE[kind];
    px(c, s.wall, 0, 12, w, h - 12);
    px(c, 'rgba(0,0,0,0.12)', w - 4, 12, 4, h - 12);
    cnRoof(c, w / 2, 3, w - 10, 10, JADE, JADE_DARK, 4);
    // 三樓、二樓的窗（紅框、格子）、綠色的欄杆
    for (const y of [16, 32]) {
      for (let x = 5; x < w - 16; x += 13) {
        px(c, s.trim, x - 1, y - 1, 10, 12);
        px(c, night ? '#ffcf80' : '#3a2a28', x, y, 8, 10);
        px(c, night ? '#e8a050' : '#6a4a3a', x + 3, y, 1, 10);
        px(c, night ? '#e8a050' : '#6a4a3a', x, y + 4, 8, 1);
      }
      px(c, JADE, 2, y + 11, w - 16, 1);
      for (let x = 2; x < w - 14; x += 3) px(c, JADE, x, y + 11, 1, 3);
      px(c, JADE, 2, y + 14, w - 16, 1);
    }
    // 豎的招牌
    px(c, s.vBg, w - 12, 14, 9, 30);
    px(c, s.trim, w - 12, 14, 9, 1);
    vtext(c, s.v, w - 7.5, 20, s.vBg === '#c8242a' ? '#fff2c8' : '#a8141a', 6);
    // 橫的大招牌
    px(c, s.trim, 3, 46, w - 18, 9);
    px(c, s.signBg, 4, 47, w - 20, 7);
    text(c, s.sign, (w - 14) / 2 + 1, 50.8, GOLD_LIGHT, `900 6px ${FONT_TC}`, 'center', w - 24);
    // 一樓的店面
    px(c, '#2a1a16', 2, 56, w - 4, h - 56);
    px(c, night ? '#ffdc98' : '#f4dcaa', 5, 59, w - 10, h - 61);
    if (kind === 'sanma') {
      // 藍色的暖簾、菜單
      for (let x = 8; x < w - 8; x += 8) px(c, '#1f3a7a', x, 58, 7, 9);
      text(c, 'サンマーメン', w / 2, 62.5, '#ffffff', `700 4px ${FONT_TC}`, 'center', w - 18);
      px(c, '#7a4a2a', 8, 69, 22, 7);
      px(c, '#f4f1e8', 9, 70, 20, 5);
      text(c, '生碼麵 ¥', 19, 72.6, '#a8141a', `700 3px ${FONT_TC}`);
      for (let x = 36; x < w - 8; x += 9) {
        px(c, '#d8b47a', x, 70, 7, 3);
        px(c, '#f0e0a0', x + 1, 69, 5, 1);
      }
    } else if (kind === 'tea') {
      // 茶罐、茶壺的架子
      for (let y = 61; y < h - 4; y += 6) {
        px(c, '#8a5a32', 6, y + 4, w - 12, 1);
        for (let x = 8; x < w - 10; x += 6) px(c, ['#c8242a', '#2a7a62', '#e0b03a', '#6a3a1a'][(x + y) % 4] ?? '#c8242a', x, y, 4, 4);
      }
    } else {
      // 玻璃櫃裡一排排的包子
      px(c, '#c9ccd6', 6, 68, w - 12, 8);
      for (let x = 9; x < w - 9; x += 6) px(c, '#f6f0e2', x, 70, 5, 4);
    }
  });
}

// ── 關帝廟：石階、紅柱、金色的斗栱、兩層華麗的屋頂（屋脊上的龍和彩色的剪黏）──
const TP_W = Math.round((YH.temple.x1 - YH.temple.x0) * T);
const TP_H = 86;
function templeSprite(night: boolean): HTMLCanvasElement {
  const w = TP_W;
  const h = TP_H;
  return cached(`yh-temple-${night ? 'n' : 'd'}`, w, h, (c) => {
    const cx = w / 2;
    // 兩邊的石牆
    px(c, '#c9c2b4', 0, 40, w, h - 46);
    for (let y = 44; y < h - 6; y += 6) px(c, '#b3ab9c', 0, y, w, 1);
    // 後面的正殿：紅牆、上層屋頂
    px(c, VERMILION, cx - 40, 22, 80, 22);
    for (let x = cx - 36; x < cx + 36; x += 10) px(c, night ? '#ffd27a' : '#6a1a14', x, 28, 6, 10);
    cnRoof(c, cx, 6, 104, 16, '#2a6a8a', '#1a4a64', 7);
    // 屋脊上的雙龍、中間的寶珠（金色）、彩色的剪黏
    for (const dir of [-1, 1]) {
      const x0 = cx + dir * 20;
      c.strokeStyle = GOLD;
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(x0, 4);
      c.quadraticCurveTo(x0 + dir * 8, -2, x0 + dir * 14, 3);
      c.quadraticCurveTo(x0 + dir * 18, 6, x0 + dir * 22, 1);
      c.stroke();
      px(c, GOLD_LIGHT, x0 + dir * 22 - 1, 0, 3, 3);
    }
    px(c, '#e8402e', cx - 3, 0, 6, 5);
    px(c, GOLD_LIGHT, cx - 2, 1, 4, 3);
    for (let x = cx - 30; x < cx + 30; x += 4) px(c, ['#e8402e', '#3ab0e0', GOLD, '#4ac06a'][(x / 4) % 4 | 0] ?? GOLD, Math.round(x), 4, 2, 2);
    // 簷下的斗栱（藍綠金）
    for (let x = cx - 46; x < cx + 46; x += 4) px(c, ['#2a5aa8', JADE, GOLD][(x / 4) % 3 | 0] ?? GOLD, Math.round(x), 22, 3, 3);
    // 匾額
    px(c, GOLD, cx - 17, 26, 34, 14);
    px(c, '#1f3a7a', cx - 16, 27, 32, 12);
    text(c, '關帝廟', cx, 33.5, night ? '#fff0a8' : GOLD_LIGHT, `900 8px ${SERIF_TC}`);
    // 前面的山門：下層屋頂（翹得更高）
    cnRoof(c, cx, 40, w - 6, 12, '#2a6a8a', '#1a4a64', 8);
    for (let x = 10; x < w - 10; x += 5) px(c, ['#e8402e', GOLD, '#3ab0e0'][(x / 5) % 3 | 0] ?? GOLD, x, 38, 2, 2);
    for (let x = 8; x < w - 8; x += 4) px(c, ['#2a5aa8', JADE, GOLD, '#e8402e'][(x / 4) % 4 | 0] ?? GOLD, x, 52, 3, 4);
    px(c, GOLD, 8, 56, w - 16, 1);
    // 山門：紅柱、金柱頭、紅門＋金釘
    px(c, '#7a1a14', 14, 57, w - 28, 19);
    for (const x of [14, 34, w - 38, w - 18]) {
      px(c, VERMILION, x, 57, 4, 19);
      px(c, GOLD, x - 1, 57, 6, 2);
    }
    for (const [a, b] of [[38, cx - 2], [cx + 2, w - 38]] as const) {
      px(c, VERMILION, a, 59, b - a, 17);
      for (let y = 62; y < 74; y += 4) for (let x = a + 3; x < b - 2; x += 4) px(c, GOLD, x, y, 1, 1);
    }
    px(c, night ? '#ffd890' : '#3a1a14', cx - 2, 59, 4, 17);
    // 門神的彩繪（兩邊）
    for (const x of [19, w - 32]) {
      px(c, '#f4e6c8', x, 60, 13, 14);
      px(c, '#2a5aa8', x + 3, 63, 7, 9);
      px(c, '#e8402e', x + 4, 61, 5, 3);
    }
    // 石階、白色的欄杆
    for (let k = 0; k < 4; k += 1) {
      px(c, k % 2 ? '#c9c2b4' : '#ddd6c8', 20 - k * 3, 76 + k * 2.5, w - 40 + k * 6, 3);
    }
    for (const x of [8, w - 14]) {
      px(c, '#efece4', x, 70, 6, 16);
      for (let y = 72; y < 84; y += 3) px(c, '#c9c2b4', x + 1, y, 4, 1);
    }
  });
}
// 關帝廟前的香爐（冒煙）
function drawCenser(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(((YH.temple.x0 + YH.temple.x1) / 2) * T);
  const by = Math.round((YH.rowLine + 0.9) * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  px(c, '#8a6a2a', cx - 7, by - 10, 14, 8);
  px(c, GOLD, cx - 8, by - 11, 16, 2);
  px(c, '#6a4a1a', cx - 6, by - 3, 3, 3);
  px(c, '#6a4a1a', cx + 3, by - 3, 3, 3);
  for (let k = 0; k < 4; k += 1) {
    const t = (d.seconds * 0.35 + k / 4) % 1;
    px(c, `rgba(235,235,235,${0.5 * (1 - t)})`, Math.round(cx - 2 + Math.sin(d.seconds + k * 2) * 3), Math.round(by - 14 - t * 22), 3, 2);
  }
}

// ── 肉包的蒸籠攤：紅色的櫃台、疊起來的竹蒸籠、白煙 ──
function drawSteamer(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(STEAMER.x * T);
  const by = Math.round(STEAMER.y * T);
  // 老闆
  const owner = getAvatarFrame(lookColors(2, 5, { body: 1 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx + 10 - owner.width / 2), by - 14 - owner.height + 6);
  px(c, 'rgba(0,0,0,0.22)', cx - 23, by, 46, 3);
  px(c, VERMILION, cx - 22, by - 12, 44, 12);
  px(c, '#9aa3b2', cx - 23, by - 14, 46, 3);
  px(c, '#d6dae2', cx - 23, by - 14, 46, 1);
  px(c, '#f6d23a', cx - 18, by - 10, 36, 7);
  text(c, '肉まん · 肉包', cx, by - 6.5, '#a8141a', `900 5px ${FONT_TC}`);
  // 三疊蒸籠
  for (const [sx, n] of [[cx - 15, 3], [cx - 3, 4], [cx + 9, 2]] as const) {
    for (let k = 0; k < n; k += 1) {
      const y = by - 18 - k * 4;
      px(c, '#d8b47a', sx - 5, y, 11, 4);
      px(c, '#b08a52', sx - 5, y + 3, 11, 1);
    }
    const top = by - 18 - n * 4 + 3;
    px(c, '#c8a46a', sx - 4, top - 1, 9, 2);
    for (let k = 0; k < 3; k += 1) {
      const t = (d.seconds * 0.55 + k / 3 + sx * 0.01) % 1;
      px(c, `rgba(255,255,255,${0.75 * (1 - t)})`, Math.round(sx - 2 + Math.sin(d.seconds * 2 + k + sx) * 2.5), Math.round(top - 4 - t * 20), 4 + Math.round(t * 3), 3);
    }
  }
}

// ── 燈籠：中華街的街屋前、善鄰門的小路、最南邊的燈籠杆 ──
function lanternLine(c: CanvasRenderingContext2D, x0: number, x1: number, y: number, night: boolean, step = 20, sag = 4): void {
  c.strokeStyle = '#3a2a24';
  c.lineWidth = 1;
  c.beginPath();
  for (let x = x0; x <= x1; x += 2) {
    const t = ((x - x0) % step) / step;
    const yy = y + Math.sin(t * Math.PI) * sag;
    if (x === x0) c.moveTo(x, yy);
    else c.lineTo(x, yy);
  }
  c.stroke();
  for (let x = x0 + step / 2; x < x1; x += step) drawLantern(c, Math.round(x), Math.round(y + sag), VERMILION, night);
}
const ROW_LANTERN_Y = YH.rowLine * T - 58;
const LANE_LANTERNS = [33.2];
const POLES = [28.4, 35.6, 42.8, 50, 57.2];
const POLE_Y = YH.H - 0.6;
function drawRowLanterns(c: CanvasRenderingContext2D, d: DrawCtx): void {
  lanternLine(c, YH.lane.x1 * T, YH.temple.x0 * T, ROW_LANTERN_Y, d.night, 18, 3);
  lanternLine(c, YH.temple.x1 * T, MW, ROW_LANTERN_Y, d.night, 18, 3);
}
function drawPoleLanterns(c: CanvasRenderingContext2D, d: DrawCtx): void {
  for (const x of POLES) {
    const cx = Math.round(x * T);
    const by = Math.round(POLE_Y * T);
    px(c, 'rgba(0,0,0,0.2)', cx - 3, by - 1, 7, 2);
    px(c, VERMILION, cx - 1, by - 42, 3, 42);
    px(c, GOLD, cx - 2, by - 44, 5, 3);
  }
  for (let i = 0; i < POLES.length - 1; i += 1) lanternLine(c, (POLES[i] ?? 0) * T + 1, (POLES[i + 1] ?? 0) * T + 1, POLE_Y * T - 42, d.night, 23, 7);
}

// ── 座位 ──
function drawChair(c: CanvasRenderingContext2D, x: number, y: number, back: 'left' | 'right'): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 5, by + 1, 10, 2);
  px(c, '#2f3a32', cx - 5, by - 4, 10, 2);
  px(c, '#2f3a32', cx - 4, by - 2, 1, 3);
  px(c, '#2f3a32', cx + 3, by - 2, 1, 3);
  const bx = back === 'left' ? cx - 6 : cx + 4;
  px(c, '#2f3a32', bx, by - 15, 2, 13);
  px(c, '#4a5a4e', bx, by - 15, 2, 1);
}
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = YOKOHAMA_SEATS[i];
  if (!s) return;
  if (i === 8) drawChair(c, s.x, s.y, 'left');
  if (i === 9) drawChair(c, s.x, s.y, 'right');
  if (i >= 10) drawStool(c, s.x, s.y, '#c8242a');
}
// 中華街的圓桌（紅桌巾、蒸籠、茶壺）
function drawChinaTable(c: CanvasRenderingContext2D): void {
  const cx = Math.round(CHINA_TABLE.x * T);
  const by = Math.round(CHINA_TABLE.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 15, by + 1, 30, 3);
  px(c, '#a8141a', cx - 13, by - 6, 26, 6);
  px(c, VERMILION, cx - 15, by - 10, 30, 5);
  px(c, '#e8584a', cx - 15, by - 10, 30, 1);
  px(c, GOLD, cx - 13, by - 3, 26, 1);
  px(c, '#d8b47a', cx - 6, by - 14, 9, 4);
  px(c, '#b08a52', cx - 6, by - 11, 9, 1);
  px(c, '#f4f1e8', cx + 6, by - 13, 5, 3);
  px(c, '#f4f1e8', cx + 10, by - 12, 2, 1);
}

// ── 擺設的位置 ──
const PARK_LAMPS: [number, number][] = [[22.6, 19.9], [28.3, 19.9], [34.1, 19.9], [39.8, 19.9], [45.2, 19.9], [53.6, 19.9]];
const WALK_LAMPS: [number, number][] = [[2.4, 29.2], [12.8, 29.2], [26.6, 29.2], [36.4, 29.2], [47.6, 29.2], [56.2, 29.2]];
const STREET_LAMPS: [number, number][] = [[2.2, 40.2], [12.4, 40.2], [20.8, 40.2], [26.6, 40.2]];
const GINKGOS: [number, number][] = [[23.6, 25.8], [27.6, 25.8], [35.4, 25.8], [39.4, 25.8], [44, 25.8], [48.8, 25.8], [53.4, 25.8], [57, 25.8], [3.6, 29.3], [9.8, 29.3], [16, 29.3], [21.6, 29.3]];
const MENU = { x: 24.4, y: 35.4 };

const props: CityProp[] = [
  { y: 0.05, draw: (c, d) => blit(c, skylineSprite(d.night), 0, SHORE) },
  { y: YH.shore, draw: (c, d) => drawWheel(c, d) },
  { y: 12, draw: (c, d) => drawHarbor(c, d) },
  { y: HK.line, draw: (c, d) => drawHikawa(c, d) },
  { y: YH.sea + 0.1, draw: (c) => drawRailing(c) },
  { y: YH.brick.line, draw: (c, d) => blit(c, brickSprite('no2', d.night), YH.brick.no2.x0 * T, YH.brick.line * T) },
  { y: YH.brick.line, draw: (c, d) => blit(c, brickSprite('no1', d.night), YH.brick.no1.x0 * T, YH.brick.line * T) },
  { y: 25.6, draw: (c, d) => drawBrickLights(c, d) },
  { y: BRICK_CART.y, draw: (c, d) => drawFoodCart(c, BRICK_CART.x, BRICK_CART.y, '赤レンガ', '#b5553f', ['#e0602a', '#f4efe2', '#e0602a'], d.seconds, 87) },
  ...SEA_BENCHES.map((x): CityProp => ({ y: SEA_BENCH_Y - 0.01, draw: (c) => drawStoneBench(c, x, SEA_BENCH_Y, 2.6) })),
  { y: BRICK_BENCH_Y - 0.01, draw: (c) => drawBench(c, BRICK_BENCH, BRICK_BENCH_Y, 2.6) },
  { y: YH.fountain.y, draw: (c, d) => drawFountain(c, d) },
  { y: YH.rowLine, draw: (c, d) => blit(c, stationSprite(d.night), YH.station.x0 * T, YH.rowLine * T) },
  { y: YH.rowLine + 0.01, draw: (c, d) => drawTrain(c, d) },
  { y: YH.rowLine, draw: (c, d) => blit(c, hotelSprite(d.night), YH.hotel.x0 * T, YH.rowLine * T) },
  { y: CAFE_TABLE.y + 0.05, draw: (c) => drawCafeTable(c) },
  { y: MENU.y, draw: (c) => drawMenuBoard(c, MENU.x, MENU.y) },
  { y: YH.gate.line, draw: (c, d) => drawGate(c, d) },
  ...LANE_LANTERNS.map((y): CityProp => ({ y, draw: (c, d) => lanternLine(c, YH.lane.x0 * T, YH.lane.x1 * T, y * T - 46, d.night, 19, 4) })),
  ...CHINA_ROW.map((b): CityProp => ({ y: YH.rowLine, draw: (c, d) => blit(c, chinaSprite(b.kind, Math.round((b.x1 - b.x0) * T), d.night), b.x0 * T, YH.rowLine * T) })),
  { y: YH.rowLine, draw: (c, d) => blit(c, templeSprite(d.night), YH.temple.x0 * T, YH.rowLine * T) },
  { y: YH.rowLine + 0.02, draw: (c, d) => drawRowLanterns(c, d) },
  { y: YH.rowLine + 0.9, draw: (c, d) => drawCenser(c, d) },
  { y: STEAMER.y, draw: (c, d) => drawSteamer(c, d) },
  { y: CHINA_TABLE.y, draw: (c) => drawChinaTable(c) },
  { y: POLE_Y, draw: (c, d) => drawPoleLanterns(c, d) },
  ...GINKGOS.map(([x, y]): CityProp => ({ y, draw: (c) => drawGinkgo(c, x, y) })),
  ...[...PARK_LAMPS, ...WALK_LAMPS, ...STREET_LAMPS].map(([x, y]): CityProp => ({ y, draw: (c, d) => drawGasLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const G = YH.gate;
const gateCx = (G.x0 + G.x1) / 2;
const ALL_LAMPS = [...PARK_LAMPS, ...WALK_LAMPS, ...STREET_LAMPS];
const solid: Rect[] = [
  r(0, 0, YH.W, YH.sea),
  r(0, YH.sea, YH.brick.no2.x1, YH.brick.line),
  r(YH.brick.no1.x0, YH.sea, YH.brick.no1.x1, YH.brick.line),
  r(YH.fountain.x - 1.7, YH.fountain.y - 0.95, YH.fountain.x + 1.7, YH.fountain.y + 0.2),
  ...SEA_BENCHES.map((x) => r(x - 1.3, SEA_BENCH_Y - 0.3, x + 1.3, SEA_BENCH_Y + 0.05)),
  r(BRICK_BENCH - 1.3, BRICK_BENCH_Y - 0.75, BRICK_BENCH + 1.3, BRICK_BENCH_Y - 0.45),
  r(BRICK_CART.x - 1.25, BRICK_CART.y - 0.8, BRICK_CART.x + 1.25, BRICK_CART.y - 0.05),
  ...BRICK_POLES.map((x) => r(x - 0.1, 25.35, x + 0.2, 25.65)),
  r(0, YH.walk + 0.1, YH.lane.x0, YH.rowLine),
  r(YH.lane.x1, YH.walk + 0.1, YH.W, YH.rowLine),
  ...[G.x0, G.x1 - 0.25, gateCx - 26 / T, gateCx + 22 / T].map((x) => r(x - 0.1, G.line - 0.3, x + 0.35, G.line)),
  r(STEAMER.x - 1.45, YH.rowLine, STEAMER.x + 1.45, STEAMER.y - 0.05),
  r(CAFE_TABLE.x - 0.3, CAFE_TABLE.y - 0.3, CAFE_TABLE.x + 0.3, CAFE_TABLE.y + 0.05),
  r(CHINA_TABLE.x - 1.0, CHINA_TABLE.y - 0.4, CHINA_TABLE.x + 1.0, CHINA_TABLE.y),
  r(MENU.x - 0.4, MENU.y - 0.3, MENU.x + 0.4, MENU.y),
  r((YH.temple.x0 + YH.temple.x1) / 2 - 0.5, YH.rowLine + 0.5, (YH.temple.x0 + YH.temple.x1) / 2 + 0.5, YH.rowLine + 0.9),
  ...POLES.map((x) => r(x - 0.12, POLE_Y - 0.25, x + 0.2, POLE_Y + 0.05)),
  ...GINKGOS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...ALL_LAMPS.map(([x, y]) => r(x - 0.15, y - 0.25, x + 0.2, y + 0.05)),
];

// ── 晚上的燈 ──
const skyLight = (x: number, y: number, rr: number, color: string) => ({ x, y, r: rr, color });
const litRand = seeded(2017);
// 對岸大樓的窗光：每棟一團，再撒一些亮點
const towerLights: CityDef['lights'] = [
  ...TOWERS.map((t) => skyLight(t.x + t.w / 2, SHORE - t.h / 2, Math.max(16, t.h * 0.5), 'rgba(255, 215, 150, 0.22)')),
  ...QUEENS.map(([x, w, h]) => skyLight(x + w / 2, SHORE - h / 2, h * 0.5, 'rgba(170, 205, 255, 0.28)')),
  ...Array.from({ length: 36 }, () => {
    const pick = TOWERS[Math.floor(litRand() * TOWERS.length)] ?? TOWERS[0]!;
    return skyLight(pick.x + 2 + litRand() * (pick.w - 4), SHORE - 4 - litRand() * (pick.h - 8), 3, 'rgba(255, 230, 170, 0.8)');
  }),
  ...Array.from({ length: 30 }, () => skyLight(LM_X - 28 + litRand() * 56, LM_TOP + 20 + litRand() * (SHORE - LM_TOP - 40), 3, 'rgba(255, 235, 190, 0.8)')),
];
const rawLights: CityDef['lights'] = [
  ...towerLights,
  // 地標大廈：整棟的光、頂端的皇冠
  skyLight(LM_X, SHORE * 0.55, 60, 'rgba(255, 220, 160, 0.3)'),
  skyLight(LM_X, LM_TOP + 6, 18, 'rgba(255, 240, 200, 0.7)'),
  skyLight(LM_X - 18, LM_TOP - 1, 4, 'rgba(255, 60, 60, 0.9)'),
  skyLight(LM_X + 18, LM_TOP - 1, 4, 'rgba(255, 60, 60, 0.9)'),
  skyLight(315, SHORE - 36, 22, 'rgba(255, 225, 170, 0.3)'),
  // 帆船飯店的藍光、會議場
  skyLight(SAIL_X, SHORE - 52, 44, 'rgba(150, 190, 255, 0.4)'),
  skyLight(SAIL_X + 10, SHORE - 96, 14, 'rgba(200, 225, 255, 0.6)'),
  skyLight(650, SHORE - 12, 30, 'rgba(255, 220, 160, 0.3)'),
  // 摩天輪的中心、底下的購物中心
  skyLight(WHEEL_CX, WHEEL_CY, 26, 'rgba(160, 255, 200, 0.5)'),
  skyLight(416, SHORE - 10, 40, 'rgba(255, 220, 160, 0.3)'),
  // 海灣大橋的燈
  ...Array.from({ length: 8 }, (_, k) => skyLight(704 + k * 30, SHORE - 29, 7, 'rgba(190, 210, 255, 0.7)')),
  skyLight(772, SHORE - 64, 6, 'rgba(255, 80, 80, 0.8)'),
  skyLight(884, SHORE - 64, 6, 'rgba(255, 80, 80, 0.8)'),
  // 水面的倒影
  ...REFLECTIONS.filter(([x]) => x !== WHEEL_CX).map(([x, rgb]) => skyLight(x, SHORE + 34, 34, `rgba(${rgb}, 0.22)`)),
  // 冰川丸：燈串、舷窗
  ...dressPoints(12).map(([x, y]) => skyLight(HK_X0 + x + 1, HK_TOP + y + 1, 6, 'rgba(255, 240, 180, 0.8)')),
  skyLight(HK_X0 + HK_W / 2, HK_TOP + 70, 120, 'rgba(255, 210, 140, 0.25)'),
  skyLight(HK_X0 + 135, HK_TOP + 34, 26, 'rgba(255, 120, 110, 0.3)'),
  skyLight(HK_X0 + HK_W / 2, SEA + 1, 60, 'rgba(255, 210, 140, 0.18)'),
  // 紅磚倉庫的打燈、窗光
  ...[YH.brick.no2, YH.brick.no1].flatMap((b) => {
    const n = Math.max(2, Math.round((b.x1 - b.x0) / 4));
    return Array.from({ length: n }, (_, k) => skyLight((b.x0 + ((k + 0.5) * (b.x1 - b.x0)) / n) * T, YH.brick.line * T - 40, 56, 'rgba(255, 150, 80, 0.6)'));
  }),
  ...[YH.brick.no2, YH.brick.no1].map((b) => skyLight(((b.x0 + b.x1) / 2) * T, YH.brick.line * T + 10, 90, 'rgba(255, 190, 120, 0.25)')),
  ...BRICK_POLES.slice(0, -1).map((x, k) => skyLight(((x + (BRICK_POLES[k + 1] ?? x)) / 2) * T, 25.6 * T - 34, 60, 'rgba(255, 220, 150, 0.3)')),
  skyLight(BRICK_CART.x * T, BRICK_CART.y * T - 16, 40, 'rgba(255, 190, 120, 0.5)'),
  // 山下公園：瓦斯燈、噴水池
  ...ALL_LAMPS.map(([x, y]) => skyLight(x * T + 1, y * T - 36, 32, 'rgba(255, 215, 140, 0.55)')),
  skyLight(YH.fountain.x * T, YH.fountain.y * T - 20, 44, 'rgba(160, 210, 255, 0.4)'),
  // 車站、飯店
  skyLight(((YH.station.x0 + YH.station.x1) / 2) * T, YH.rowLine * T - 20, 100, 'rgba(220, 235, 255, 0.4)'),
  skyLight(((YH.hotel.x0 + YH.hotel.x1) / 2) * T, YH.rowLine * T - 44, 110, 'rgba(255, 210, 140, 0.35)'),
  skyLight(21 * T, YH.rowLine * T - 10, 34, 'rgba(255, 210, 120, 0.55)'),
  skyLight(CAFE_TABLE.x * T, CAFE_TABLE.y * T - 14, 30, 'rgba(255, 210, 140, 0.4)'),
  // 善鄰門、中華街的燈籠、店裡的燈
  skyLight(gateCx * T, G.line * T - 50, 70, 'rgba(255, 120, 80, 0.45)'),
  ...[gateCx * T - 18, gateCx * T, gateCx * T + 16].map((x) => skyLight(x, G.line * T - 36, 14, 'rgba(255, 150, 90, 0.7)')),
  ...LANE_LANTERNS.flatMap((y) => {
    const out: CityDef['lights'] = [];
    for (let x = YH.lane.x0 * T + 9.5; x < YH.lane.x1 * T; x += 19) out.push(skyLight(x, y * T - 38, 14, 'rgba(255, 130, 80, 0.65)'));
    return out;
  }),
  ...(() => {
    const out: CityDef['lights'] = [];
    for (const [a, b] of [[YH.lane.x1 * T, YH.temple.x0 * T], [YH.temple.x1 * T, MW]] as const) for (let x = a + 9; x < b; x += 18) out.push(skyLight(x, ROW_LANTERN_Y + 7, 14, 'rgba(255, 130, 80, 0.65)'));
    for (let i = 0; i < POLES.length - 1; i += 1) for (let x = (POLES[i] ?? 0) * T + 12.5; x < (POLES[i + 1] ?? 0) * T; x += 23) out.push(skyLight(x, POLE_Y * T - 31, 15, 'rgba(255, 130, 80, 0.65)'));
    return out;
  })(),
  ...CHINA_ROW.map((b) => skyLight(((b.x0 + b.x1) / 2) * T, YH.rowLine * T - 10, 46, 'rgba(255, 200, 120, 0.5)')),
  skyLight(((YH.lane.x0 + YH.W) / 2) * T, ((YH.rowLine + YH.street.y1) / 2) * T, 220, 'rgba(255, 110, 70, 0.22)'),
  skyLight(STEAMER.x * T, STEAMER.y * T - 16, 36, 'rgba(255, 210, 140, 0.5)'),
  // 關帝廟：金色的打燈
  skyLight(((YH.temple.x0 + YH.temple.x1) / 2) * T, YH.rowLine * T - 50, 80, 'rgba(255, 200, 90, 0.5)'),
  skyLight(((YH.temple.x0 + YH.temple.x1) / 2) * T, YH.rowLine * T - 78, 40, 'rgba(255, 220, 120, 0.45)'),
];
// 光暈不要超出地圖（晚上 lighter 會畫到地圖外面）；摩天輪和船的燈每幀會動，另外接在後面
const lights: CityDef['lights'] = [
  ...rawLights.map((l) => ({ ...l, r: Math.max(3, Math.min(l.r, l.x, MW - l.x, l.y, MH - l.y)) })),
  ...WHEEL_LIGHTS,
  ...WHEEL_REFLECT,
  ...BOAT_LIGHTS,
];

const stationX = (YH.station.x0 + YH.station.x1) / 2;

export const YOKOHAMA: CityDef = {
  id: 'yokohama',
  country: 'jp',
  line: 'jr',
  W: YH.W,
  H: YH.H,
  title: { 'zh-TW': '橫濱', 'en-US': 'Yokohama' },
  stop: { 'zh-TW': '橫濱', 'en-US': 'Yokohama' },
  emoji: '🎡',
  station: {
    x: stationX,
    y: YH.rowLine + 0.6,
    name: { 'zh-TW': 'JR 櫻木町站', 'en-US': 'JR Sakuragicho Station' },
    arrive: { x: stationX, y: YH.rowLine + 3.2 },
  },
  background: '#d8d1c4',
  soundscape: 'beach',
  paintGround: paintYokohamaGround,
  props,
  solid,
  seats: YOKOHAMA_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: YOKOHAMA_SHOPS,
  infos: [
    {
      at: r(0.5, 0.4, 20.6, YH.shore),
      title: { 'zh-TW': '港未來 21 · 橫濱地標大廈', 'en-US': 'Minato Mirai 21 · Landmark Tower' },
      text: {
        'zh-TW': '港未來 21 是 1983 年開始在三菱重工橫濱造船廠和舊貨運鐵路的土地上開發的新市區。地標大廈 1993 年完成，高 296 公尺、70 層，往上慢慢收窄，到 2014 年大阪阿倍野 HARUKAS 出現前都是日本最高的大樓；69 樓的展望台「Sky Garden」從一樓上去只要 40 秒左右，當年是世界最快的電梯。大樓腳下保留了 1896 年的石造船塢（Dockyard Garden）。旁邊斜屋頂、一棟比一棟矮的是皇后廣場，海邊白色帆形的是 1991 年的洲際飯店，最右邊遠處是 1989 年通車的橫濱海灣大橋。（地圖上把港未來畫在山下公園的正對岸，實際上在西北邊、隔著新港碼頭。）',
        'en-US': 'Minato Mirai 21 is a new district built from 1983 on the site of the Mitsubishi Heavy Industries shipyard and old freight rail yards. Landmark Tower (1993) is 296 m tall with 70 floors, tapering as it rises; it was Japan’s tallest building until Osaka’s Abeno Harukas in 2014, and the elevator to the 69th-floor Sky Garden — about 40 seconds — was then the world’s fastest. A stone dry dock from 1896 survives at its foot as Dockyard Garden. The stepped, slant-roofed towers beside it are Queen’s Square; the white sail by the water is the InterContinental (1991), and far right is the Yokohama Bay Bridge (1989). (Here Minato Mirai sits straight across from Yamashita Park; in reality it lies to the northwest, past the Shinko pier.)',
      },
    },
    {
      at: r(YH.wheel.x - 4.6, 0.4, YH.wheel.x + 4.6, YH.shore),
      title: { 'zh-TW': 'Cosmo Clock 21', 'en-US': 'Cosmo Clock 21' },
      text: {
        'zh-TW': '1989 年為了「橫濱博覽會（YES’89）」蓋的大摩天輪，當時是世界最高的摩天輪；1997 年搬到現在的位置，高 112.5 公尺、有 60 個車廂，轉一圈大約 15 分鐘。中間是巨大的數字時鐘，所以叫 Clock——它也被稱為世界最大的時鐘。晚上整圈和輻條上的 LED 會變換顏色和圖案，是港未來夜景的主角。（地圖上的時鐘顯示日本時間；轉得比真的快一點。）',
        'en-US': 'Built for the 1989 Yokohama Exotic Showcase (YES’89), it was then the world’s tallest Ferris wheel; it moved to its current spot in 1997. It stands 112.5 m tall with 60 gondolas and takes about 15 minutes per turn. The giant digital clock at its hub gives it the name — it’s billed as the world’s largest clock. At night LEDs on the rim and spokes change colours and patterns, the star of the Minato Mirai night view. (The clock here shows Japan time; the wheel turns a little faster than the real one.)',
      },
    },
    {
      at: r(0.8, 17, YH.brick.no1.x1, YH.brick.line),
      title: { 'zh-TW': '橫濱紅磚倉庫', 'en-US': 'Yokohama Red Brick Warehouse' },
      text: {
        'zh-TW': '明治政府蓋的國營保稅倉庫，由妻木賴黃設計，2 號館 1911 年、1 號館 1913 年完成。磚牆裡加了鐵條補強，還裝了當時少見的貨物電梯和防火鐵門；1923 年關東大地震時 1 號館倒了一半，2 號館撐了下來。1989 年停用，修復後在 2002 年以商店、餐廳和展演空間重新開放，前面的廣場一年到頭有啤酒節、聖誕市集等活動，晚上會打燈。',
        'en-US': 'State bonded warehouses designed by Tsumaki Yorinaka for the Meiji government: No. 2 was finished in 1911 and No. 1 in 1913. The brick walls were reinforced with iron, and they had freight elevators and fire doors that were rare at the time. In the 1923 Great Kantō Earthquake half of No. 1 collapsed while No. 2 survived. Retired in 1989, they reopened in 2002 as shops, restaurants and event halls; the plaza in front hosts beer festivals and Christmas markets, and the buildings are lit up at night.',
      },
    },
    {
      at: r(HK.x0, 10.2, HK.x1, YH.sea),
      title: { 'zh-TW': '山下公園 · 冰川丸', 'en-US': 'Yamashita Park · Hikawa Maru' },
      text: {
        'zh-TW': '山下公園 1930 年開園，是用 1923 年關東大地震的瓦礫填海造出來的海濱公園，沿著海邊是長長的步道和長椅，草地上的「水之守護神」銅像是姊妹市聖地牙哥送的。停在公園旁的冰川丸是 1930 年由橫濱船渠建造的日本郵船遠洋客輪，跑橫濱—西雅圖航線，卓別林也搭過；戰爭時當醫院船倖存下來，1961 年起永久停泊在這裡，2016 年被指定為國家重要文化財，現在可以上船參觀。黑色的船身、白色的上層、日本郵船黑底白帶兩條紅線的煙囪，晚上桅杆的燈串會亮起來。',
        'en-US': 'Yamashita Park opened in 1930 on land reclaimed with rubble from the 1923 Great Kantō Earthquake, with a long seaside promenade and benches; the “Guardian of Water” statue was a gift from sister city San Diego. Moored beside it is the Hikawa Maru, an NYK ocean liner built in 1930 by Yokohama Dock for the Yokohama–Seattle route — Charlie Chaplin sailed on her. She survived the war as a hospital ship, has been moored here since 1961, became an Important Cultural Property in 2016 and can be toured today. Black hull, white superstructure, and NYK’s black funnel with a white band and two red stripes; at night the lights strung along her masts come on.',
      },
    },
    {
      at: r(G.x0 - 0.6, 25.4, G.x1 + 0.6, G.line),
      title: { 'zh-TW': '橫濱中華街 · 善鄰門', 'en-US': 'Yokohama Chinatown · Zenrin-mon' },
      text: {
        'zh-TW': '1859 年橫濱開港後，跟著西方商人來的華人在這一帶落腳，慢慢形成日本最大的中華街：大約 500 公尺見方的街區裡有 500 多家店，四周立著十座牌樓。善鄰門是中華街大通的入口，1955 年蓋的時候寫著「中華街」，1989 年重建時取「親仁善鄰（親近仁德、和鄰居友好）」的意思改名。邊走邊吃的肉包、小籠包，和中華料理店的醬油湯麵上蓋勾芡炒豆芽的「三碼麵（生碼麵）」都是這裡的味道。（真的善鄰門前不是山下公園通，地圖上把距離壓縮了。）',
        'en-US': 'After Yokohama opened its port in 1859, Chinese who came with Western traders settled here, growing into Japan’s largest Chinatown: over 500 shops in an area about 500 m square, ringed by ten gates. Zenrin-mon marks the entrance to the main street; built in 1955 reading “Chinatown”, it was renamed when rebuilt in 1989 after the phrase “cherish benevolence and be good neighbours”. Pork buns eaten on the go, xiaolongbao and sanma-men — soy-broth noodles under glossy stir-fried bean sprouts, a Yokohama original — are the tastes of this street. (Distances are compressed: the real gate isn’t right off Yamashita-kōen-dōri.)',
      },
    },
    {
      at: r(YH.temple.x0, 29.2, YH.temple.x1, YH.rowLine),
      title: { 'zh-TW': '橫濱關帝廟', 'en-US': 'Yokohama Kanteibyō' },
      text: {
        'zh-TW': '供奉三國時代的關羽（關聖帝君）——講義氣、守信用，被華人當成生意之神。開港後不久華僑就在這裡供起了小小的關帝像，之後廟在 1923 年關東大地震、1945 年空襲和 1986 年的火災中三次被毀，每次都由華僑集資重建；現在的是 1990 年完成的第四代。藍綠的琉璃瓦、屋脊上的金龍和彩色剪黏、金色的斗栱，是中華街裡最華麗的建築。',
        'en-US': 'Dedicated to Guan Yu (Guan Di), the Three Kingdoms general revered for loyalty and keeping his word — and so worshipped by Chinese communities as a god of business. Soon after the port opened, residents enshrined a small statue of him here; the temple was then destroyed three times — in the 1923 earthquake, the 1945 air raids and a 1986 fire — and rebuilt each time with community donations. Today’s fourth building was completed in 1990: blue-green glazed tiles, golden dragons and colourful ceramic figures on the ridges, gilded brackets — the most ornate building in Chinatown.',
      },
    },
    {
      at: r(YH.hotel.x0, 29.4, YH.hotel.x1, YH.rowLine),
      title: { 'zh-TW': '老飯店 · 拿坡里義大利麵', 'en-US': 'The Old Hotel · Spaghetti Napolitan' },
      text: {
        'zh-TW': '拿坡里義大利麵（ナポリタン）不是義大利菜，是橫濱發明的。二戰後美軍接收了山下公園前的老飯店 Hotel New Grand（1927 年開業），第二代總料理長入江茂忠看到美軍把義大利麵拌番茄醬吃，就用新鮮番茄、番茄糊、火腿、洋菇和青椒做成更講究的版本，取名「拿坡里」。後來各地的喫茶店改用番茄醬做，成了日本人的國民洋食。（地圖上的「港之丘飯店」是虛構的。）',
        'en-US': 'Spaghetti Napolitan isn’t Italian — it was invented in Yokohama. After WWII the US military requisitioned Hotel New Grand (opened 1927) facing Yamashita Park; its second head chef, Irie Shigetada, saw soldiers eating spaghetti with ketchup and created a finer version with fresh tomatoes, tomato paste, ham, mushrooms and green pepper, naming it after Naples. Coffee shops across Japan later made it with ketchup, and it became a national comfort food. (The “Minato-no-Oka Hotel” on this map is fictional.)',
      },
    },
  ],
  labels: [
    { x: SEA_BENCHES[1]!, y: SEA_BENCH_Y + 2, text: { 'zh-TW': '🎡 山下公園（海邊石椅看港未來）', 'en-US': '🎡 Yamashita Park (seaside benches)' }, color: '#bae6fd' },
    { x: BRICK_BENCH, y: BRICK_BENCH_Y + 1.3, text: { 'zh-TW': '🧱 紅磚倉庫廣場', 'en-US': '🧱 Red Brick plaza' }, color: '#fecaca' },
    { x: CAFE_TABLE.x, y: CAFE_TABLE.y + 1.5, text: { 'zh-TW': '🍝 飯店露台', 'en-US': '🍝 Hotel terrace' }, color: '#fde68a' },
    { x: CHINA_TABLE.x, y: CHINA_TABLE.y + 1.3, text: { 'zh-TW': '🏮 中華街圓桌', 'en-US': '🏮 Chinatown table' }, color: '#fca5a5' },
  ],
  walkers: [
    { x0: YH.park.x0 + 0.6, y0: 19.3, x1: YH.W - 0.6, y1: 19.3, count: 4 },
    { x0: 0.8, y0: 25.3, x1: YH.W - 0.8, y1: 25.3, count: 4 },
    { x0: 0.8, y0: 28.95, x1: YH.W - 0.8, y1: 28.95, count: 4 },
    { x0: 0.8, y0: 39.5, x1: YH.W - 0.8, y1: 39.5, count: 5 },
    { x0: 0.8, y0: 37.6, x1: YH.lane.x0, y1: 37.6, count: 2 },
    { x0: gateCx - 0.2, y0: 29.2, x1: gateCx - 0.2, y1: 39.4, count: 2 },
    { x0: 12.2, y0: 17.2, x1: 12.2, y1: 24.8, count: 1 },
  ],
  traffic: [
    { y: 26.85, dir: -1, x0: 0, x1: YH.W, count: 3 },
    { y: 27.95, dir: 1, x0: 0, x1: YH.W, count: 3 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點山下公園海邊的石椅、紅磚倉庫的長椅、飯店露台或中華街的圓桌坐下專注 · 走到攤子買肉包、拿坡里義大利麵、三碼麵 · 點地標看介紹 · JR 櫻木町站去其他日本城市或飛回台灣',
    'en-US': 'WASD / arrows to move · click a seaside bench in Yamashita Park, the Red Brick bench, the hotel terrace or a Chinatown table to focus · walk up to the stalls for pork buns, Napolitan and sanma-men · click landmarks for info · JR Sakuragicho to other Japanese cities or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或桌子坐下專注 · 走到攤子買東西 · 點地標看介紹 · JR 櫻木町站',
    'en-US': 'Tap a bench or table to focus · visit the stalls · tap landmarks · JR Sakuragicho',
  },
};
