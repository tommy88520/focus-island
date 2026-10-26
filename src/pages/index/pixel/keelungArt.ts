// 基隆正濱漁港的美術：北岸一整排彩色屋（騎樓的鐵捲門、浮球和漁網、陽台晒的衣服、頂樓加蓋）、水面上彩色屋的倒影、
// 停在港邊的漁船（白藍船身、駕駛艙、大漁旗、一串集魚燈）、開過去的小船、和平橋、和平島的豆腐岩、山上的中正公園大佛、
// 南邊的阿根納造船廠遺構（沒有屋頂的水泥牆、長出植物的窗洞）、正濱漁會、小吃攤車、公車站。最後組成 CityScene 用的 KEELUNG。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CAFE, CART_INFO, COLOR_HOUSES, KEELUNG_SEATS, KEELUNG_SHOPS, KL, NORTH_BENCHES, NORTH_BENCH_Y, SOUTH_BENCHES, SOUTH_BENCH_Y, type ColorHouse } from './keelung';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, drawLamp, drawFoodCart, drawBench, drawStreetTree, drawParkedScooter, SCOOTER_COLORS } from './cityArt';

const WATER = '#2f7a8a';
const WATER_DEEP = '#235f6e';

// ── 地面（畫一次）──
export function paintKeelungGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1626);
  const W = KL.W * T;
  const H = KL.H * T;
  // 北邊山坡：深淺綠的樹叢
  px(c, '#4f8a4a', 0, 0, W, KL.houseY * T);
  for (let i = 0; i < 900; i += 1) {
    c.fillStyle = ['#3f7a3e', '#5f9a52', '#467f42', '#6aa85a'][Math.floor(rand() * 4)] ?? '#4f8a4a';
    c.beginPath();
    c.arc(rand() * W, rand() * KL.houseY * T, 3 + rand() * 6, 0, Math.PI * 2);
    c.fill();
  }
  // 和平島（東北角）：海、黃褐色的砂岩海岸、一格格的豆腐岩
  const ix = KL.island.x0 * T;
  px(c, '#2f86b0', ix, 0, W - ix, 2.2 * T);
  for (let y = 4; y < 2.2 * T; y += 6) px(c, 'rgba(255,255,255,0.25)', ix + ((y * 7) % 20), y, 18, 1);
  px(c, '#c9b48a', ix, 2.2 * T, W - ix, KL.island.y1 * T - 2.2 * T);
  for (let y = 2.4 * T; y < 5 * T; y += 7) {
    for (let x = ix + ((y / 7) % 2) * 4; x < W; x += 9) {
      px(c, '#b59d72', Math.round(x), Math.round(y), 8, 6);
      px(c, '#d9c69c', Math.round(x), Math.round(y), 8, 1);
    }
  }
  for (let i = 0; i < 120; i += 1) px(c, rand() < 0.5 ? '#7a9a5a' : '#8aaa62', Math.round(ix + rand() * (W - ix)), Math.round(5.2 * T + rand() * (KL.island.y1 - 5.2) * T), 3, 2);
  // 中正路、港邊步道
  road(c, { x0: 0, y0: KL.northRoad.y0, x1: KL.W, y1: KL.northRoad.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.75)', x, ((KL.northRoad.y0 + KL.northRoad.y1) / 2) * T, 10, 2);
  px(c, '#c9ccd0', 0, KL.northRoad.y0 * T, W, 2);
  tiles(c, { x0: 0, y0: KL.northRoad.y1, x1: KL.W, y1: KL.northEdge }, '#bfb6a6', '#ada492', 10);
  // 漁港：水（越中間越深），兩岸的堤防邊
  const g = c.createLinearGradient(0, KL.northEdge * T, 0, KL.southEdge * T);
  g.addColorStop(0, '#3a8898');
  g.addColorStop(0.5, WATER_DEEP);
  g.addColorStop(1, WATER);
  c.fillStyle = g;
  c.fillRect(0, KL.northEdge * T, W, (KL.southEdge - KL.northEdge) * T);
  px(c, '#8f8a80', 0, KL.northEdge * T, W, 3);
  px(c, '#8f8a80', 0, KL.southEdge * T - 3, W, 3);
  // 和平橋：水泥橋面、兩邊白欄杆
  const bx0 = KL.bridge.x0 * T;
  const bw = (KL.bridge.x1 - KL.bridge.x0) * T;
  px(c, 'rgba(0,0,0,0.25)', bx0 + 4, KL.northEdge * T, bw, (KL.southEdge - KL.northEdge) * T);
  px(c, '#b9b4aa', bx0, KL.northEdge * T, bw, (KL.southEdge - KL.northEdge) * T);
  for (let y = KL.northEdge * T; y < KL.southEdge * T; y += 8) px(c, '#a8a398', bx0, y, bw, 1);
  for (const x of [bx0, bx0 + bw - 3]) {
    px(c, '#e8ecf0', x, KL.northEdge * T, 3, (KL.southEdge - KL.northEdge) * T);
    for (let y = KL.northEdge * T; y < KL.southEdge * T; y += 10) px(c, '#9aa3b2', x, y, 3, 2);
  }
  // 南岸步道（石板）、正濱路、南邊的廣場
  tiles(c, { x0: 0, y0: KL.southEdge, x1: KL.W, y1: KL.southRoad.y0 }, '#c9c0ae', '#b8af9c', 12);
  road(c, { x0: 0, y0: KL.southRoad.y0, x1: KL.W, y1: KL.southRoad.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.75)', x, ((KL.southRoad.y0 + KL.southRoad.y1) / 2) * T, 10, 2);
  tiles(c, { x0: 0, y0: KL.southRoad.y1, x1: KL.W, y1: KL.H }, '#d6cfc0', '#c7bfae', 10);
  // 遺構前面的草地
  px(c, '#6f9a52', KL.argo.x0 * T - 6, KL.argo.y * T, (KL.argo.x1 - KL.argo.x0) * T + 12, H - KL.argo.y * T);
  for (let i = 0; i < 200; i += 1) px(c, rand() < 0.5 ? '#5f8a46' : '#82ae62', Math.round(KL.argo.x0 * T + rand() * (KL.argo.x1 - KL.argo.x0) * T), Math.round(KL.argo.y * T + rand() * (H - KL.argo.y * T)), 2, 1);
}

// ── 水：彩色屋的倒影、波光（每格動）──
function drawWater(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const top = KL.northEdge * T + 3;
  // 倒影：每棟房子在水面上一條條晃動的色塊
  for (const h of COLOR_HOUSES) {
    const x0 = h.x0 * T;
    const w = (h.x1 - h.x0) * T;
    const len = 18 + h.floors * 8;
    for (let y = 0; y < len; y += 3) {
      const wob = Math.round(Math.sin(d.seconds * 1.6 + y * 0.5 + h.x0) * 2);
      c.fillStyle = h.color;
      c.globalAlpha = 0.32 * (1 - y / len);
      c.fillRect(x0 + wob + 1, top + y, w - 2, 2);
    }
    c.globalAlpha = 1;
    if (d.night) {
      // 晚上：窗戶的燈也倒映在水上
      for (let k = 0; k < 3; k += 1) px(c, `rgba(255, 220, 140, ${0.35 + 0.15 * Math.sin(d.seconds * 2 + k + h.x0)})`, Math.round(x0 + w * 0.3 + Math.sin(d.seconds + k) * 2), top + 6 + k * 9, Math.round(w * 0.4), 1);
    }
  }
  // 波光
  const W = KL.W * T;
  const span = (KL.southEdge - KL.northEdge) * T - 10;
  for (let i = 0; i < 60; i += 1) {
    const x = (i * 97.3 + d.seconds * (5 + (i % 4))) % W;
    const y = top + 4 + ((i * 37.1) % span);
    px(c, `rgba(220, 245, 255, ${0.12 + 0.12 * Math.sin(d.seconds * 1.4 + i)})`, Math.round(x), Math.round(y), 5 + (i % 3) * 2, 1);
  }
}

// ── 彩色屋 ──
function houseSprite(b: ColorHouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const floorH = 13;
  const ground = 18;
  const h = ground + b.floors * floorH + 10;
  const cafe = b === CAFE;
  return cached(`kl-house-${b.seed}`, w, h, (c) => {
    const rand = seeded(b.seed);
    // 頂樓：女兒牆，有的有藍色鐵皮加蓋或水塔
    const roofKind = Math.floor(rand() * 3);
    if (roofKind === 0) {
      px(c, '#4f7ab0', 2, 0, w - 4, 8);
      for (let x = 3; x < w - 3; x += 3) px(c, '#3f6a9e', x, 0, 1, 8);
    } else if (roofKind === 1) {
      px(c, '#c9ccd6', w - 12, 0, 9, 7);
      px(c, '#e8ecf0', w - 12, 0, 9, 2);
    }
    px(c, b.color, 0, 8, w, h - 8);
    px(c, 'rgba(255,255,255,0.25)', 0, 8, w, 2);
    px(c, 'rgba(0,0,0,0.12)', w - 2, 8, 2, h - 8);
    // 彩色屋的特色：有的牆上畫一條條對比色的帶子
    if (rand() < 0.45) {
      const band = ['#ffffff', '#f6c945', '#4f8ad9', '#e25a4a'][Math.floor(rand() * 4)] ?? '#ffffff';
      for (let f = 0; f < b.floors; f += 1) px(c, band, 0, 10 + f * floorH + floorH - 3, w, 2);
    }
    const upperBottom = h - ground;
    for (let f = 0; f < b.floors; f += 1) {
      const fy = 11 + f * floorH;
      // 鋁窗＋鐵窗，有的有小陽台、冷氣、晒衣服
      const cols = Math.max(1, Math.floor((w - 4) / 14));
      for (let k = 0; k < cols; k += 1) {
        const wx = Math.round(4 + k * ((w - 8) / cols) + ((w - 8) / cols - 10) / 2);
        px(c, '#e8ecf0', wx - 1, fy, 12, 9);
        px(c, '#3a4656', wx, fy + 1, 10, 7);
        px(c, 'rgba(160, 210, 240, 0.5)', wx + 1, fy + 2, 3, 2);
        for (let j = 1; j < 10; j += 3) px(c, 'rgba(30,30,35,0.55)', wx + j, fy + 1, 1, 7);
        if (rand() < 0.3) px(c, '#e8e8ea', wx + 1, fy + 9, 8, 3);
      }
      if (rand() < 0.35) {
        // 晒衣服：一根竿子上幾件衣服
        px(c, '#9aa3b2', 2, fy - 1, w - 4, 1);
        for (let k = 4; k < w - 6; k += 6) px(c, ['#e25a4a', '#ffffff', '#3b82f6', '#f6c945'][Math.floor(rand() * 4)] ?? '#ffffff', k, fy, 4, 5);
      }
    }
    // 一樓：鐵捲門、漁具（橘色浮球、綠色漁網）或咖啡店的玻璃門
    px(c, 'rgba(0,0,0,0.25)', 0, upperBottom, w, 2);
    if (cafe) {
      px(c, '#3a2a20', 2, upperBottom + 2, w - 4, ground - 2);
      px(c, '#ffd98a', 5, upperBottom + 5, w - 10, ground - 5);
      for (let k = 7; k < w - 8; k += 7) px(c, '#8a5a32', k, upperBottom + 11, 4, 3);
      px(c, '#ffffff', 3, upperBottom - 9, w - 6, 8);
      text(c, '彩色屋咖啡', w / 2, upperBottom - 5, '#c46a3a', `900 6px ${FONT_TC}`);
      return;
    }
    if (rand() < 0.5) {
      px(c, '#9aa0aa', 2, upperBottom + 2, w - 4, ground - 2);
      for (let y = upperBottom + 4; y < h; y += 3) px(c, '#858b96', 2, y, w - 4, 1);
    } else {
      px(c, '#2f3036', 2, upperBottom + 2, w - 4, ground - 2);
      for (let k = 4; k < w - 6; k += 7) {
        c.fillStyle = '#f39a4a';
        c.beginPath();
        c.arc(k + 3, h - 4, 3, 0, Math.PI * 2);
        c.fill();
      }
      px(c, '#3f7a5a', 5, upperBottom + 4, w - 10, 6);
      for (let k = 6; k < w - 6; k += 3) px(c, '#2f6a4a', k, upperBottom + 4, 1, 6);
    }
  });
}

function drawHouse(c: CanvasRenderingContext2D, b: ColorHouse): void {
  blit(c, houseSprite(b), b.x0 * T, KL.houseY * T);
}

// ── 漁船：白色船身＋藍或紅的船底、駕駛艙、桅桿上的大漁旗、一串集魚燈（晚上亮） ──
const BOAT_HULLS = ['#2f6fb5', '#c62828', '#2a8a5a', '#2f6fb5', '#e8641c'];
function drawFishingBoat(c: CanvasRenderingContext2D, x: number, y: number, hull: string, flip: boolean, d: DrawCtx, seed: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T + Math.sin(d.seconds * 1.1 + seed) * 1.2);
  const f = flip ? -1 : 1;
  const P = (col: string, dx: number, dy: number, w: number, h: number) => px(c, col, flip ? cx - dx - w : cx + dx, by + dy, w, h);
  P('rgba(0,0,0,0.25)', -22, 0, 44, 3);
  // 船身：船頭（右）翹起來
  P('#f4f6f8', -22, -10, 40, 8);
  P('#f4f6f8', 18, -13, 6, 11);
  P(hull, -22, -4, 42, 4);
  P(hull, 20, -6, 4, 3);
  P('rgba(0,0,0,0.15)', -22, -10, 40, 1);
  // 駕駛艙（船尾）
  P('#e8ecf0', -18, -20, 14, 10);
  P('#3a4656', -16, -18, 4, 4);
  P('#3a4656', -10, -18, 4, 4);
  P(hull, -19, -22, 16, 2);
  // 桅桿＋大漁旗
  P('#5a5d66', 2, -32, 1, 22);
  const wave = Math.round(Math.sin(d.seconds * 3 + seed) * 1);
  P('#e25a4a', 3, -32 + wave, 7, 3);
  P('#f6c945', 3, -29 + wave, 7, 2);
  P('#2f6fb5', 3, -27 + wave, 7, 2);
  // 集魚燈：從桅桿拉到船頭的一串燈泡
  for (let k = 0; k < 6; k += 1) {
    const lx = 3 + k * 3;
    const ly = -26 + k * 2;
    P(d.night ? '#f4fff0' : '#d6dae2', lx, ly, 2, 2);
  }
  if (d.night) glow(c, cx + f * 10, by - 20, 26, '230, 255, 220', 0.35);
}

const NORTH_BOATS = [4, 12.4, 21, 34, 40.4];
const SOUTH_BOATS = [10.6, 20.4, 30, 41.2];

// 開過去的小船（往返東西，從橋下穿過）
function drawPassingBoat(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const W = KL.W * T;
  const cycle = 46;
  const t = (d.seconds % cycle) / cycle;
  const east = t < 0.5;
  const k = east ? t * 2 : (1 - t) * 2;
  const x = -40 + k * (W + 80);
  const y = (KL.northEdge + 5.4) * T;
  // 船尾的白浪
  for (let i = 0; i < 4; i += 1) px(c, `rgba(255,255,255,${0.45 - i * 0.1})`, Math.round(x + (east ? -26 - i * 7 : 22 + i * 7)), Math.round(y) - 1, 6, 1);
  drawFishingBoat(c, x / T, y / T, '#2a8a5a', !east, d, 9);
}

// 港邊欄杆（白色鐵欄杆）、繫船柱
function drawRail(c: CanvasRenderingContext2D, y: number, x0: number, x1: number): void {
  const yy = Math.round(y * T);
  px(c, '#e8ecf0', Math.round(x0 * T), yy - 9, Math.round((x1 - x0) * T), 2);
  for (let x = x0 * T; x < x1 * T; x += 10) px(c, '#c9ccd6', Math.round(x), yy - 9, 2, 9);
}
function drawBollard(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 3, by, 7, 2);
  px(c, '#2f3036', cx - 3, by - 6, 6, 6);
  px(c, '#4a4b52', cx - 4, by - 7, 8, 2);
}

// 中正公園的大佛（白色觀音坐像，在東邊山上）
function drawBuddha(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(46.8 * T);
  const by = Math.round(6.8 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 16, by, 32, 3);
  px(c, '#c9c2b0', cx - 16, by - 6, 32, 6);
  px(c, '#e8e2d2', cx - 16, by - 6, 32, 1);
  c.fillStyle = '#f4f1e8';
  c.beginPath();
  c.ellipse(cx, by - 14, 13, 9, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#f4f1e8', cx - 7, by - 32, 14, 18);
  px(c, '#e3ddcc', cx - 7, by - 32, 3, 18);
  c.fillStyle = '#f4f1e8';
  c.beginPath();
  c.arc(cx, by - 36, 6, 0, Math.PI * 2);
  c.fill();
  px(c, '#f4f1e8', cx - 3, by - 45, 6, 5);
  px(c, '#d9d2c0', cx - 2, by - 26, 4, 6);
  if (d.night) glow(c, cx, by - 24, 30, '255, 240, 200', 0.3);
}

// 阿根納造船廠遺構：沒有屋頂的水泥牆，一排排方窗洞、中間一個大拱門，牆頂長出植物
function argoSprite(): HTMLCanvasElement {
  const w = Math.round((KL.argo.x1 - KL.argo.x0) * T);
  const h = 74;
  return cached('kl-argo', w, h, (c) => {
    const rand = seeded(1919);
    px(c, '#9a978f', 0, 10, w, h - 10);
    for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#8a877f' : '#aaa79e', Math.floor(rand() * w), 10 + Math.floor(rand() * (h - 10)), 2 + Math.floor(rand() * 3), 1);
    // 牆頂破破的、長出草和小樹
    for (let x = 0; x < w; x += 4) {
      const dip = Math.floor(rand() * 6);
      c.clearRect(x, 10, 4, dip);
      if (rand() < 0.6) px(c, rand() < 0.5 ? '#4f8a4a' : '#6aa85a', x, 6 + dip, 4, 5);
    }
    // 兩排窗洞：看得到裡面長的樹
    for (let row = 0; row < 2; row += 1) {
      for (let x = 8; x < w - 12; x += 16) {
        if (row === 1 && Math.abs(x + 5 - w / 2) < 20) continue;
        const wy = 20 + row * 24;
        px(c, '#3a4a38', x, wy, 10, 14);
        px(c, '#5a8a4a', x + 1, wy + 6, 8, 8);
        px(c, 'rgba(0,0,0,0.25)', x, wy, 10, 2);
      }
    }
    // 中間的大拱門
    c.fillStyle = '#2f3a2e';
    c.beginPath();
    c.moveTo(w / 2 - 16, h);
    c.lineTo(w / 2 - 16, h - 26);
    c.arc(w / 2, h - 26, 16, Math.PI, 0);
    c.lineTo(w / 2 + 16, h);
    c.closePath();
    c.fill();
    px(c, '#5a8a4a', w / 2 - 12, h - 12, 24, 12);
    px(c, 'rgba(0,0,0,0.3)', 0, h - 3, w, 3);
  });
}

// 正濱漁會：灰白的三層樓，頂樓一排拱窗，正面的招牌
function guildSprite(): HTMLCanvasElement {
  const w = Math.round((KL.guild.x1 - KL.guild.x0) * T);
  const h = 66;
  return cached('kl-guild', w, h, (c) => {
    px(c, '#d8d2c4', 0, 6, w, h - 6);
    px(c, '#c4bdae', 0, 6, w, 4);
    px(c, 'rgba(0,0,0,0.12)', w - 3, 6, 3, h - 6);
    for (let x = 6; x < w - 10; x += 14) {
      // 三樓的拱窗
      c.fillStyle = '#3a4656';
      c.beginPath();
      c.moveTo(x, 26);
      c.lineTo(x, 18);
      c.arc(x + 5, 18, 5, Math.PI, 0);
      c.lineTo(x + 10, 26);
      c.closePath();
      c.fill();
      px(c, '#3a4656', x, 32, 10, 9);
      px(c, 'rgba(160, 210, 240, 0.45)', x + 1, 33, 3, 3);
    }
    px(c, '#2f4a6a', w / 2 - 26, 44, 52, 9);
    text(c, '正濱漁會', w / 2, 48.5, '#ffffff', `900 7px ${FONT_TC}`);
    px(c, '#3a2e28', w / 2 - 10, h - 13, 20, 13);
    px(c, '#f6dfae', w / 2 - 8, h - 11, 16, 11);
  });
}

// 漁具倉庫：鐵皮屋頂的矮房子，門口堆著橘色浮球、綠色漁網、藍色魚箱
const WAREHOUSES = [
  { x0: 42, x1: 46.6, color: '#4f7ab0' },
  { x0: 46.6, x1: 51.2, color: '#c46a3a' },
  { x0: 51.2, x1: 55.4, color: '#4f8a5a' },
];
const WAREHOUSE_Y = 35.2;
function warehouseSprite(i: number): HTMLCanvasElement {
  const b = WAREHOUSES[i] ?? WAREHOUSES[0]!;
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 44;
  return cached(`kl-ware-${i}`, w, h, (c) => {
    px(c, b.color, 0, 0, w, 12);
    for (let x = 2; x < w; x += 4) px(c, 'rgba(0,0,0,0.15)', x, 0, 1, 12);
    px(c, '#e8e2d6', 0, 12, w, h - 12);
    px(c, 'rgba(0,0,0,0.15)', 0, 12, w, 2);
    px(c, '#3a3d45', 6, 18, w - 12, h - 18);
    for (let y = 20; y < h; y += 3) px(c, '#4a4d55', 6, y, w - 12, 1);
    // 門口的浮球、漁網、魚箱
    for (let k = 0; k < 4; k += 1) {
      c.fillStyle = '#f39a4a';
      c.beginPath();
      c.arc(4 + k * 5, h - 4, 3, 0, Math.PI * 2);
      c.fill();
    }
    px(c, '#3f7a5a', w - 22, h - 10, 16, 10);
    for (let k = w - 21; k < w - 6; k += 3) px(c, '#2f6a4a', k, h - 10, 1, 10);
    px(c, '#2f7ac8', w / 2 - 6, h - 8, 12, 8);
    px(c, '#5a9ad8', w / 2 - 6, h - 8, 12, 2);
  });
}

// 南岸的石椅（沒有椅背，坐著看對岸的彩色屋）
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

// 公車站牌（往台鐵基隆站）
function drawBusStop(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = Math.round(KL.busStop.x * T);
  const y = Math.round(KL.busStop.y * T);
  px(c, 'rgba(0,0,0,0.2)', x - 18, y + 1, 32, 3);
  px(c, '#9fc3d6', x - 16, y - 22, 26, 20);
  px(c, '#2f4a6a', x - 18, y - 26, 30, 4);
  px(c, '#3a3d45', x - 17, y - 22, 2, 22);
  px(c, '#3a3d45', x + 9, y - 22, 2, 22);
  px(c, '#8a5a32', x - 13, y - 8, 20, 3);
  px(c, '#3a3d45', x + 14, y - 30, 2, 30);
  c.fillStyle = '#0070bd';
  c.beginPath();
  c.arc(x + 15, y - 32, 6, 0, Math.PI * 2);
  c.fill();
  text(c, '台鐵', x + 15, y - 32, '#ffffff', `900 4px ${FONT_TC}`);
  if (d.night) glow(c, x - 3, y - 14, 20, '200, 230, 255', 0.3);
}

// 和平橋的橋頭（兩根白柱子＋橋名）
function drawBridgeHead(c: CanvasRenderingContext2D, y: number, name: boolean): void {
  const x0 = Math.round(KL.bridge.x0 * T);
  const x1 = Math.round(KL.bridge.x1 * T);
  const by = Math.round(y * T);
  for (const x of [x0, x1 - 4]) {
    px(c, 'rgba(0,0,0,0.2)', x - 1, by, 6, 2);
    px(c, '#e8ecf0', x, by - 16, 4, 16);
    px(c, '#c9ccd6', x, by - 18, 4, 2);
  }
  if (name) {
    px(c, '#2f4a6a', x0 + 6, by - 15, x1 - x0 - 12, 8);
    text(c, '和平橋', (x0 + x1) / 2, by - 11, '#ffffff', `900 5px ${FONT_TC}`);
  }
}

// 長椅、石椅都在 props 裡畫（跟著 y 排序），座位這裡不用另外畫
function drawSeat(): void {
  // 沒有東西要畫
}

// ── 組成 CityScene 用的資料 ──
const TREES: [number, number][] = [[3, 34.6], [16.2, 34.6], [27.6, 34.4], [40.2, 34.6], [51.4, 6.8], [54.6, 7]];
const LAMPS: [number, number][] = [
  [10.6, 11.9], [20.8, 11.9], [30.8, 11.9], [41.4, 11.9], [52, 11.9],
  [2, 24.6], [11, 24.6], [20, 24.6], [29.4, 24.6], [39, 24.6], [44.4, 24.6], [53, 24.6],
];
const BOLLARDS = [5, 18, 24, 36, 43.4].map((x): [number, number] => [x, 22.9]);
const SCOOTERS: [number, number][] = [2, 3.2, 4.4, 17.6, 18.8, 20, 21.2, 27.6, 28.8, 40.6, 41.8].map((x): [number, number] => [x, 28.1]);

const props: CityProp[] = [
  { y: KL.northEdge + 0.01, draw: (c, d) => drawWater(c, d) },
  ...COLOR_HOUSES.map((b): CityProp => ({ y: KL.houseY, draw: (c) => drawHouse(c, b) })),
  { y: 6.8, draw: (c, d) => drawBuddha(c, d) },
  { y: KL.northEdge, draw: (c) => drawRail(c, KL.northEdge, 0, KL.bridge.x0) },
  { y: KL.northEdge, draw: (c) => drawRail(c, KL.northEdge, KL.bridge.x1, KL.W) },
  ...NORTH_BOATS.map((x, i): CityProp => ({ y: KL.northEdge + 1.4, draw: (c, d) => drawFishingBoat(c, x, KL.northEdge + 1.4, BOAT_HULLS[i % BOAT_HULLS.length] ?? '#2f6fb5', i % 2 === 1, d, i) })),
  { y: KL.northEdge + 5.4, draw: (c, d) => drawPassingBoat(c, d) },
  ...SOUTH_BOATS.map((x, i): CityProp => ({ y: KL.southEdge - 0.4, draw: (c, d) => drawFishingBoat(c, x, KL.southEdge - 0.4, BOAT_HULLS[(i + 2) % BOAT_HULLS.length] ?? '#c62828', i % 2 === 0, d, i + 5) })),
  { y: KL.southEdge, draw: (c) => drawRail(c, KL.southEdge, 0, KL.bridge.x0) },
  { y: KL.southEdge, draw: (c) => drawRail(c, KL.southEdge, KL.bridge.x1, KL.W) },
  { y: KL.northEdge, draw: (c) => drawBridgeHead(c, KL.northEdge, false) },
  { y: KL.southEdge + 0.6, draw: (c) => drawBridgeHead(c, KL.southEdge + 0.6, true) },
  ...NORTH_BENCHES.map((x): CityProp => ({ y: NORTH_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, NORTH_BENCH_Y, 2.6) })),
  ...SOUTH_BENCHES.map((x): CityProp => ({ y: SOUTH_BENCH_Y - 0.01, draw: (c) => drawStoneBench(c, x, SOUTH_BENCH_Y) })),
  { y: KL.argo.y, draw: (c) => blit(c, argoSprite(), KL.argo.x0 * T, KL.argo.y * T) },
  { y: KL.guild.y, draw: (c) => blit(c, guildSprite(), KL.guild.x0 * T, KL.guild.y * T) },
  ...KL.carts.map((x, i): CityProp => {
    const cart = CART_INFO[i] ?? CART_INFO[0]!;
    return { y: KL.cartY, draw: (c, d) => drawFoodCart(c, x, KL.cartY, cart.name['zh-TW'], cart.awning, cart.food, d.seconds, i * 7 + 11) };
  }),
  { y: KL.busStop.y, draw: (c, d) => drawBusStop(c, d) },
  ...BOLLARDS.map(([x, y]): CityProp => ({ y, draw: (c) => drawBollard(c, x, y) })),
  ...WAREHOUSES.map((b, i): CityProp => ({ y: WAREHOUSE_Y, draw: (c) => blit(c, warehouseSprite(i), b.x0 * T, WAREHOUSE_Y * T) })),
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[i % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  // 北岸的房子、山、和平島（只走得到中正路以南）
  r(0, 0, KL.W, KL.northRoad.y0 - 0.25),
  // 漁港：兩岸之間都是水，只有和平橋可以走
  r(0, KL.northEdge - 0.2, KL.bridge.x0 + 0.35, KL.southEdge + 0.35),
  r(KL.bridge.x1 - 0.35, KL.northEdge - 0.2, KL.W, KL.southEdge + 0.35),
  ...NORTH_BENCHES.map((x) => r(x - 1.3, NORTH_BENCH_Y - 0.75, x + 1.3, NORTH_BENCH_Y - 0.45)),
  ...SOUTH_BENCHES.map((x) => r(x - 1.3, SOUTH_BENCH_Y - 0.35, x + 1.3, SOUTH_BENCH_Y - 0.1)),
  r(KL.argo.x0, KL.argo.y - 4.4, KL.argo.x1, KL.argo.y - 0.1),
  r(KL.guild.x0, KL.guild.y - 3.9, KL.guild.x1, KL.guild.y - 0.1),
  ...KL.carts.map((x) => r(x - 1.3, KL.cartY - 1.6, x + 1.3, KL.cartY - 0.1)),
  r(KL.busStop.x - 1.2, KL.busStop.y - 0.4, KL.busStop.x + 0.8, KL.busStop.y + 0.1),
  ...BOLLARDS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...WAREHOUSES.map((b) => r(b.x0, WAREHOUSE_Y - 2.6, b.x1, WAREHOUSE_Y)),
  r(1.6, 27.6, 4.8, 28.2),
  r(17.2, 27.6, 21.6, 28.2),
  r(27.2, 27.6, 29.2, 28.2),
  r(40.2, 27.6, 42.2, 28.2),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...COLOR_HOUSES.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: KL.houseY * T - 30, r: 34, color: 'rgba(255, 215, 140, 0.4)' })),
  { x: ((CAFE.x0 + CAFE.x1) / 2) * T, y: KL.houseY * T - 8, r: 36, color: 'rgba(255, 210, 130, 0.55)' },
  ...KL.carts.map((x) => ({ x: x * T, y: KL.cartY * T - 20, r: 30, color: 'rgba(255, 220, 150, 0.5)' })),
  { x: ((KL.guild.x0 + KL.guild.x1) / 2) * T, y: KL.guild.y * T - 10, r: 40, color: 'rgba(255, 220, 160, 0.4)' },
];

export const KEELUNG: CityDef = {
  id: 'keelung',
  W: KL.W,
  H: KL.H,
  title: { 'zh-TW': '基隆 · 正濱漁港', 'en-US': 'Keelung · Zhengbin Harbor' },
  stop: { 'zh-TW': '基隆（正濱漁港）', 'en-US': 'Keelung (Zhengbin Harbor)' },
  emoji: '🌈',
  line: 'tra',
  station: {
    x: KL.busStop.x,
    y: KL.busStop.y + 0.6,
    name: { 'zh-TW': '往台鐵基隆站的公車', 'en-US': 'Bus to TRA Keelung Station' },
    arrive: { x: KL.busStop.x - 2.4, y: KL.busStop.y + 0.6 },
  },
  background: '#d6cfc0',
  soundscape: 'beach',
  paintGround: paintKeelungGround,
  props,
  solid,
  seats: KEELUNG_SEATS,
  drawSeat,
  shops: KEELUNG_SHOPS,
  infos: [
    { at: r(1, 3, KL.housesX1, KL.houseY), title: { 'zh-TW': '正濱漁港彩色屋', 'en-US': 'Zhengbin Rainbow Houses' }, text: { 'zh-TW': '漁港邊一整排漆成粉紅、黃、藍、綠的老房子，倒映在水面上像調色盤，是基隆最有名的拍照地點。過和平橋到對岸看最漂亮。', 'en-US': 'A row of old harbor houses painted pink, yellow, blue and green — mirrored in the water like a palette. Keelung’s most famous photo spot; best seen from across the harbor over Heping Bridge.' } },
    { at: r(KL.bridge.x0, KL.northEdge, KL.bridge.x1, KL.southEdge), title: { 'zh-TW': '和平橋', 'en-US': 'Heping Bridge' }, text: { 'zh-TW': '連接正濱和和平島的橋，橋上可以看到整個正濱漁港和停滿的漁船。', 'en-US': 'The bridge linking Zhengbin and Heping Island, with a view over the whole harbor full of fishing boats.' } },
    { at: r(KL.island.x0, 0, KL.W, KL.island.y1), title: { 'zh-TW': '和平島', 'en-US': 'Heping Island' }, text: { 'zh-TW': '基隆港口旁的小島，海邊有被海浪侵蝕成一格一格的「豆腐岩」，還有海蝕平台和海水游泳池。', 'en-US': 'A small island by Keelung harbor, known for its "tofu rocks" eroded into neat blocks by the waves, sea platforms and an ocean pool.' } },
    { at: r(45, 3.6, 48.6, 7), title: { 'zh-TW': '中正公園大佛', 'en-US': 'Zhongzheng Park Guanyin' }, text: { 'zh-TW': '基隆港邊山上的白色觀音像，從港口很多地方都看得到，晚上會點燈。', 'en-US': 'The white Guanyin statue on the hill above Keelung harbor — visible from all around the port and lit up at night.' } },
    { at: r(KL.argo.x0, KL.argo.y - 4.6, KL.argo.x1, KL.argo.y), title: { 'zh-TW': '阿根納造船廠遺構', 'en-US': 'Argo Shipyard Ruins' }, text: { 'zh-TW': '1960 年代美國公司在這裡造遊艇，工廠關掉後只剩水泥牆和窗洞，樹從裡面長出來，像一座廢墟城堡。', 'en-US': 'An American company built yachts here in the 1960s. After it closed only the concrete walls and window holes remained, with trees growing inside — like a ruined castle.' } },
    { at: r(KL.guild.x0, KL.guild.y - 4, KL.guild.x1, KL.guild.y), title: { 'zh-TW': '正濱漁會', 'en-US': 'Zhengbin Fishermen’s Association' }, text: { 'zh-TW': '日治時代留下來的漁會大樓，以前是港口最熱鬧的地方，現在整修成可以參觀的老建築。', 'en-US': 'A fishermen’s association building from the Japanese era, once the busiest spot on the harbor and now restored for visitors.' } },
  ],
  labels: [
    { x: 22, y: 3.4, text: { 'zh-TW': '🌈 正濱漁港彩色屋', 'en-US': '🌈 Zhengbin Rainbow Houses' }, color: '#f472b6' },
    { x: 20.8, y: KL.northRoad.y1 - 0.05, text: { 'zh-TW': '🪑 港邊長椅：坐下專注', 'en-US': '🪑 Harborside benches: sit to focus' }, color: '#60a5fa' },
    { x: (KL.bridge.x0 + KL.bridge.x1) / 2, y: (KL.northEdge + KL.southEdge) / 2, text: { 'zh-TW': '🌉 和平橋', 'en-US': '🌉 Heping Bridge' }, color: '#e2e8f0' },
    { x: 52.8, y: 2.6, text: { 'zh-TW': '🏝️ 和平島', 'en-US': '🏝️ Heping Island' }, color: '#fbbf24' },
    { x: (KL.argo.x0 + KL.argo.x1) / 2, y: KL.argo.y - 4.8, text: { 'zh-TW': '阿根納造船廠遺構', 'en-US': 'Argo Shipyard Ruins' }, color: '#94a3b8' },
  ],
  walkers: [
    { x0: 1, y0: 10.8, x1: 45, y1: 10.8, count: 3 },
    { x0: 1, y0: 23.2, x1: 45, y1: 23.2, count: 3 },
    { x0: 47.3, y0: 12.6, x1: 47.3, y1: 22.2, count: 1 },
    { x0: 1, y0: 29.4, x1: 55, y1: 29.4, count: 3 },
    { x0: 27, y0: 32.6, x1: 41, y1: 32.6, count: 2 },
  ],
  traffic: [
    { y: 9.1, dir: -1, x0: 0, x1: KL.W, count: 2 },
    { y: 10.2, dir: 1, x0: 0, x1: KL.W, count: 2 },
    { y: 25.6, dir: 1, x0: 0, x1: KL.W, count: 2 },
    { y: 26.8, dir: -1, x0: 0, x1: KL.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點南岸的石椅或北岸的長椅坐下專注 · 走到攤車、彩色屋咖啡買東西 · 走和平橋過港 · 點地標看介紹 · 公車站回台北（台鐵）',
    'en-US': 'WASD / arrows to move · click a stone bench or a harborside bench to focus · walk up to a cart or the café to buy · cross the harbor on Heping Bridge · click landmarks for info · bus stop back to Taipei (TRA)',
  },
  hintTouch: {
    'zh-TW': '點石椅、長椅坐下專注 · 走到攤車買東西 · 走和平橋過港 · 點地標看介紹 · 公車站回台北',
    'en-US': 'Tap a bench to focus · walk up to carts · cross Heping Bridge · tap landmarks · bus back to Taipei',
  },
};
