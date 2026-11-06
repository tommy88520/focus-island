// 宜蘭的美術：遠方的雪山山脈、往東的海和龜山島、蘭陽平原的稻田（白鷺鷥會飛過去）、宜蘭河（水波、河堤欄杆、橋）、
// 河堤自行車道、宜蘭酒廠（紅磚廠房、甲子蘭酒文物館、酒甕堆）、東門夜市（攤車、燈泡串、牌樓、桌子）、
// 丟丟噹森林（銀色鋼構的大樹、樹冠的鋼網和藤蔓、掛在半空的一節火車，晚上樹上的小燈會亮）、宜蘭車站。
// 最後組成 CityScene 用的 YILAN。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { FOREST_BENCHES, FOREST_BENCH_Y, MARKET_CARTS, MARKET_TABLES, RIVER_BENCHES, RIVER_BENCH_Y, TABLE_Y, YILAN_SEATS, YILAN_SHOPS, YL } from './yilan';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, brickPath, drawLamp, drawBench, drawStreetTree, drawParkedScooter, drawFoodCart, SCOOTER_COLORS } from './cityArt';

// ── 地面（畫一次）──
export function paintYilanGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1919);
  const W = YL.W * T;
  const py0 = YL.paddy.y0 * T;
  // 天空
  const sky = c.createLinearGradient(0, 0, 0, py0);
  sky.addColorStop(0, '#94c4e6');
  sky.addColorStop(1, '#dcecf2');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, py0);
  // 東邊的海（地平線）和龜山島：山脈往東慢慢變低，最後是海
  const seaX = 38 * T;
  const seaY = py0 - 9;
  px(c, '#6f9cc0', seaX, seaY, W - seaX, py0 - seaY);
  px(c, '#9cc0dc', seaX, seaY, W - seaX, 1);
  for (let i = 0; i < 40; i += 1) px(c, 'rgba(255,255,255,0.35)', Math.floor(seaX + rand() * (W - seaX)), Math.floor(seaY + 2 + rand() * (py0 - seaY - 3)), 4, 1);
  const turtle = (cx: number, by: number) => {
    // 背殼（高的那座山）、往右伸出去的龜首
    c.save();
    c.translate(cx, by);
    c.scale(1.6, 1.5);
    c.translate(-cx, -by);
    c.fillStyle = '#4f7488';
    c.beginPath();
    c.moveTo(cx - 34, by);
    c.quadraticCurveTo(cx - 24, by - 6, cx - 14, by - 18);
    c.quadraticCurveTo(cx - 8, by - 24, cx - 2, by - 17);
    c.quadraticCurveTo(cx + 6, by - 8, cx + 16, by - 6);
    c.quadraticCurveTo(cx + 24, by - 8, cx + 28, by - 4);
    c.lineTo(cx + 34, by);
    c.closePath();
    c.fill();
    px(c, 'rgba(255,255,255,0.18)', cx - 12, by - 19, 6, 2);
    c.restore();
  };
  turtle(49.6 * T, py0 - 1);
  // 雪山山脈：西邊高、往東變低（三層，越近越綠）
  const ridge = (base: number, amp: number, color: string, seed: number, fade: number) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, py0);
    for (let x = 0; x <= W; x += 8) {
      const k = Math.max(0, 1 - x / fade);
      const y = base + (1 - k) * 18 - k * amp * (0.6 + 0.4 * Math.sin(x * 0.012 + seed) * Math.sin(x * 0.031 + seed * 2)) - Math.abs(Math.sin(x * 0.045 + seed)) * amp * 0.2 * k;
      c.lineTo(x, Math.min(py0, y));
    }
    c.lineTo(W, py0);
    c.closePath();
    c.fill();
  };
  ridge(2.6 * T, 30, '#8aa2bc', 0.7, 42 * T);
  // 山頂一點點雲
  for (let i = 0; i < 18; i += 1) {
    c.fillStyle = `rgba(255,255,255,${0.45 + rand() * 0.35})`;
    c.beginPath();
    c.ellipse(rand() * 30 * T, 0.9 * T + rand() * 20, 16 + rand() * 20, 3 + rand() * 2, 0, 0, Math.PI * 2);
    c.fill();
  }
  ridge(3.4 * T, 22, '#6a8f7c', 3.3, 36 * T);
  ridge(4.1 * T, 10, '#557f62', 6.1, 30 * T);
  // 蘭陽平原的稻田：一塊塊的田（深淺不同的綠）、田埂、遠遠的三合院和樹
  const p0 = YL.paddy.y0 * T;
  const p1 = YL.paddy.y1 * T;
  px(c, '#7fb860', 0, p0, W, p1 - p0);
  for (let x = 0; x < W; ) {
    const w = 40 + Math.floor(rand() * 50);
    const col = ['#7fb860', '#8cc46a', '#74ad58', '#9ccc72'][Math.floor(rand() * 4)] ?? '#7fb860';
    px(c, col, x, p0, w, p1 - p0);
    for (let y = p0 + 2; y < p1; y += 3) px(c, 'rgba(60,110,40,0.25)', x + 1, y, w - 2, 1);
    px(c, '#c9b98a', x + w - 1, p0, 1, p1 - p0);
    x += w;
  }
  px(c, '#c9b98a', 0, Math.round((p0 + p1) / 2), W, 1);
  for (const fx of [3, 13, 21, 34, 46]) {
    const hx = fx * T;
    // 三合院：紅瓦、白牆
    px(c, '#efe6d2', hx, p0 + 2, 18, 6);
    px(c, '#b5553f', hx - 1, p0, 20, 3);
    px(c, '#efe6d2', hx - 6, p0 + 4, 5, 4);
    px(c, '#b5553f', hx - 7, p0 + 3, 7, 2);
    px(c, '#efe6d2', hx + 19, p0 + 4, 5, 4);
    px(c, '#b5553f', hx + 18, p0 + 3, 7, 2);
    for (let k = 0; k < 3; k += 1) {
      c.fillStyle = '#4f7f42';
      c.beginPath();
      c.arc(hx + 30 + k * 6, p0 + 2, 4, 0, Math.PI * 2);
      c.fill();
    }
  }
  // 宜蘭河：水、兩邊的石頭護岸、北岸的蘆葦
  const r0 = YL.river.y0 * T;
  const r1 = YL.river.y1 * T;
  const water = c.createLinearGradient(0, r0, 0, r1);
  water.addColorStop(0, '#5f9cb0');
  water.addColorStop(1, '#4a8aa2');
  c.fillStyle = water;
  c.fillRect(0, r0, W, r1 - r0);
  px(c, '#9a958a', 0, r0, W, 3);
  for (let x = 0; x < W; x += 5) px(c, rand() < 0.5 ? '#8a857a' : '#b0aa9e', x, r0 + 1, 4, 2);
  for (let i = 0; i < 90; i += 1) {
    const x = Math.floor(rand() * W);
    px(c, rand() < 0.5 ? '#9ab86a' : '#c9c08a', x, r0 - 4 + Math.floor(rand() * 3), 1, 5);
  }
  // 河上的橋（車道往北過河、兩邊的欄杆）
  const bx0 = YL.bridge.x0 * T;
  const bx1 = YL.bridge.x1 * T;
  px(c, 'rgba(0,0,0,0.25)', bx0 + 4, r0, bx1 - bx0, r1 - r0);
  px(c, '#6a6d75', bx0, p0, bx1 - bx0, r1 - p0);
  px(c, 'rgba(240,240,240,0.7)', (bx0 + bx1) / 2 - 1, p0, 2, r1 - p0);
  for (const x of [bx0, bx1 - 3]) {
    px(c, '#d6d2c8', x, p0, 3, r1 - p0);
    for (let y = r0 + 2; y < r1; y += 8) px(c, '#a8a49a', x, y, 3, 2);
  }
  // 河堤：靠河的欄杆、自行車道（中間一條綠線）、草坡
  const l0 = YL.levee.y0 * T;
  const l1 = YL.levee.y1 * T;
  px(c, '#b5b0a4', 0, r1, W, l0 + 3 - r1);
  px(c, '#6a6d75', 0, l0 + 3, W, l1 - l0 - 9);
  for (let i = 0; i < 400; i += 1) px(c, rand() < 0.5 ? '#62656d' : '#74777f', Math.floor(rand() * W), Math.floor(l0 + 4 + rand() * (l1 - l0 - 11)), 2, 1);
  for (let x = 4; x < W; x += 20) px(c, '#7ac46a', x, Math.round((l0 + l1) / 2 - 2), 11, 2);
  for (let x = 6; x < W; x += 40) {
    px(c, 'rgba(240,240,240,0.8)', x, l0 + 8, 6, 4);
    px(c, 'rgba(240,240,240,0.8)', x + 1, l0 + 6, 4, 2);
  }
  px(c, '#6fa85a', 0, l1 - 6, W, 6);
  const s0 = l1;
  const s1 = YL.slope * T;
  px(c, '#5f9a4a', 0, s0, W, s1 - s0);
  for (let i = 0; i < 200; i += 1) px(c, rand() < 0.5 ? '#548e40' : '#6aa856', Math.floor(rand() * W), Math.floor(s0 + rand() * (s1 - s0)), 2, 1);
  // 下河堤的階梯（夜市那頭、酒廠那頭）
  for (const sx of [24.6, 52]) {
    for (let y = s0; y < s1; y += 3) px(c, y % 6 ? '#c9c2b4' : '#b0a998', sx * T, y, 2 * T, 3);
  }
  // 宜蘭酒廠的紅磚廣場、東門夜市的地磚
  brickPath(c, { x0: 0, y0: YL.slope, x1: YL.market.x0, y1: YL.market.y1 });
  tiles(c, { x0: YL.market.x0, y0: YL.slope, x1: YL.W, y1: YL.market.y1 }, '#b9a99a', '#a89888', 8);
  for (let i = 0; i < 300; i += 1) px(c, 'rgba(80,60,40,0.12)', Math.floor(YL.market.x0 * T + rand() * (W - YL.market.x0 * T)), Math.floor(YL.slope * T + rand() * (YL.market.y1 - YL.slope) * T), 3, 2);
  // 人行道、馬路、斑馬線
  px(c, '#c9c0ae', 0, YL.market.y1 * T, W, (YL.road.y0 - YL.market.y1) * T);
  road(c, { x0: 0, y0: YL.road.y0, x1: YL.W, y1: YL.road.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.75)', x, ((YL.road.y0 + YL.road.y1) / 2) * T, 10, 2);
  zebra(c, YL.arch.x0 + 0.4, YL.road.y0 + 0.1, YL.arch.x1 - 0.4, YL.road.y1 - 0.1, false);
  zebra(c, 13.4, YL.road.y0 + 0.1, 17, YL.road.y1 - 0.1, false);
  px(c, '#c9c0ae', 0, YL.road.y1 * T, W, 6);
  // 丟丟噹森林：草地、彎彎的碎石步道、長椅那裡鋪的石板
  const f1 = YL.forest.x1 * T;
  const g0 = YL.road.y1 * T + 6;
  const H = YL.H * T;
  px(c, '#6fa85a', 0, g0, f1, H - g0);
  for (let i = 0; i < 700; i += 1) px(c, rand() < 0.5 ? '#62994e' : '#7cb866', Math.floor(rand() * f1), Math.floor(g0 + rand() * (H - g0)), 2, 1);
  c.strokeStyle = '#d6cdb4';
  c.lineWidth = 18;
  c.lineCap = 'round';
  c.beginPath();
  c.moveTo(15.2 * T, g0);
  c.bezierCurveTo(15 * T, 28.6 * T, 9 * T, 29.4 * T, 9 * T, 32 * T);
  c.moveTo(15.2 * T, g0);
  c.bezierCurveTo(15.4 * T, 28.6 * T, 21 * T, 29.4 * T, 21 * T, 32 * T);
  c.moveTo(0, 34.6 * T);
  c.bezierCurveTo(10 * T, 34 * T, 20 * T, 35.4 * T, f1, 34.4 * T);
  c.stroke();
  for (const bx of FOREST_BENCHES) tiles(c, { x0: bx - 2, y0: FOREST_BENCH_Y - 1.2, x1: bx + 2, y1: FOREST_BENCH_Y + 1 }, '#c9c2b4', '#b5ad9f', 8);
  // 宜蘭車站前的廣場
  tiles(c, { x0: YL.forest.x1, y0: YL.road.y1 + 0.38, x1: YL.W, y1: YL.H }, '#d9d0bf', '#c9c0ae', 10);
  px(c, '#9a948a', YL.station.x0 * T - 8, YL.station.y * T, (YL.station.x1 - YL.station.x0) * T + 16, 6);
  for (const [fx, fy] of FLOWER_BEDS) {
    c.fillStyle = '#b5ad9f';
    c.beginPath();
    c.ellipse(fx * T, fy * T, 2.2 * T, 1.1 * T, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5f9a4a';
    c.beginPath();
    c.ellipse(fx * T, fy * T, 2 * T - 2, 1.1 * T - 3, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 26; k += 1) {
      const a = k * 2.4;
      const rr = ((k * 7) % 10) / 10;
      px(c, ['#ff6fb5', '#ffd23f', '#ffffff', '#ff8a3a'][k % 4] ?? '#ffd23f', Math.round(fx * T + Math.cos(a) * rr * (2 * T - 6)), Math.round(fy * T + Math.sin(a) * rr * (1.1 * T - 5)), 2, 2);
    }
  }
}

// 車站前廣場的花圃（中心點，格）
const FLOWER_BEDS: [number, number][] = [[37.4, 28.4], [49.4, 28.4]];

// ── 會動的：河面的水波、飛過稻田的白鷺鷥 ──
function drawRiverLife(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const r0 = YL.river.y0 * T + 4;
  const h = (YL.river.y1 - YL.river.y0) * T - 6;
  for (let i = 0; i < 46; i += 1) {
    const y = r0 + ((i * 37) % 97) / 97 * h;
    const x = ((i * 131 + d.seconds * (10 + (i % 4) * 3)) % (YL.W * T + 20)) - 10;
    if (x > YL.bridge.x0 * T - 6 && x < YL.bridge.x1 * T) continue;
    px(c, `rgba(225,245,255,${0.25 + 0.2 * Math.sin(d.seconds * 1.6 + i)})`, Math.round(x), Math.round(y), 6 + (i % 3) * 2, 1);
  }
  // 白鷺鷥：三隻慢慢往東飛，翅膀一上一下
  for (let k = 0; k < 3; k += 1) {
    const x = ((d.seconds * 9 + k * 260) % (YL.W * T + 80)) - 40;
    const y = YL.paddy.y0 * T - 6 + Math.sin(d.seconds * 0.7 + k * 2) * 4 + k * 5;
    const up = Math.floor(d.seconds * 4 + k) % 2 === 0;
    px(c, '#ffffff', Math.round(x), Math.round(y), 5, 2);
    px(c, '#ffffff', Math.round(x + 5), Math.round(y - 1), 2, 1);
    px(c, '#f6c945', Math.round(x + 7), Math.round(y - 1), 2, 1);
    px(c, '#f4f4f4', Math.round(x - 1), Math.round(y + (up ? -3 : 1)), 4, 2);
    px(c, '#2b2d33', Math.round(x - 2), Math.round(y + 1), 2, 1);
  }
  // 田裡站著的白鷺鷥（低頭找東西吃）
  for (const [ex, ey] of [[8.4, 5.6], [17.2, 5.2], [30.6, 5.8], [38.2, 5.3]] as const) {
    const peck = Math.floor(d.seconds * 0.8 + ex) % 4 === 0;
    const x = Math.round(ex * T);
    const y = Math.round(ey * T);
    px(c, '#ffffff', x, y - 4, 4, 3);
    px(c, '#ffffff', x + 3, y - (peck ? 4 : 7), 1, peck ? 2 : 4);
    px(c, '#ffffff', x + 3, y - (peck ? 3 : 8), 2, 1);
    px(c, '#2b2d33', x + 1, y - 1, 1, 2);
    px(c, '#2b2d33', x + 3, y - 1, 1, 2);
  }
}

// 河堤上的石椅（沒有椅背，坐著看河、看稻田和山）
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

// ── 宜蘭酒廠：紅磚的廠房（灰瓦斜屋頂、屋脊上的通風氣樓、大木門）、甲子蘭酒文物館（兩層紅磚樓、拱窗） ──
function brickWall(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  px(c, '#a8452e', x, y, w, h);
  for (let yy = y, row = 0; yy < y + h; yy += 3, row += 1) {
    px(c, '#8a3624', x, yy + 2, w, 1);
    for (let xx = x + (row % 2) * 3; xx < x + w; xx += 6) px(c, '#8a3624', xx, yy, 1, 2);
  }
  for (let i = 0; i < (w * h) / 40; i += 1) px(c, 'rgba(255,190,150,0.18)', x + ((i * 53) % w), y + ((i * 29) % h), 2, 1);
}

function warehouseSprite(key: string, w: number, sign: string): HTMLCanvasElement {
  const h = 74;
  return cached(`yl-${key}`, w, h, (c) => {
    const cx = w / 2;
    const wallTop = 30;
    brickWall(c, 2, wallTop, w - 4, h - wallTop);
    // 窗：上面一排小的鐵窗
    for (let x = 10; x < w - 14; x += 16) {
      if (Math.abs(x + 4 - cx) < 22) continue;
      px(c, '#efe6d2', x - 1, wallTop + 6, 10, 11);
      px(c, '#3a4656', x, wallTop + 7, 8, 9);
      for (let k = 2; k < 8; k += 3) px(c, '#6a7080', x + k, wallTop + 7, 1, 9);
    }
    // 大木門（拱形）＋白底招牌
    const doorTop = wallTop + 28;
    px(c, '#efe6d2', cx - 16, doorTop, 32, h - doorTop);
    c.fillStyle = '#efe6d2';
    c.beginPath();
    c.arc(cx, doorTop + 1, 16, Math.PI, 0);
    c.fill();
    px(c, '#5a3820', cx - 13, doorTop + 2, 26, h - doorTop - 2);
    c.fillStyle = '#5a3820';
    c.beginPath();
    c.arc(cx, doorTop + 2, 13, Math.PI, 0);
    c.fill();
    for (let k = -10; k <= 10; k += 5) px(c, '#4a2e1c', cx + k, doorTop - 6, 1, h - doorTop + 6);
    px(c, '#3a2414', cx, doorTop - 10, 1, h - doorTop + 10);
    // 灰瓦屋頂＋屋脊上面的氣樓（小屋頂）
    c.fillStyle = '#5a5f68';
    c.beginPath();
    c.moveTo(-1, wallTop + 1);
    c.lineTo(10, 12);
    c.lineTo(w - 10, 12);
    c.lineTo(w + 1, wallTop + 1);
    c.closePath();
    c.fill();
    for (let y = 14; y < wallTop; y += 3) px(c, '#4a4f58', 6, y, w - 12, 1);
    px(c, '#3a3e46', -1, wallTop, w + 2, 2);
    px(c, '#efe6d2', 16, 6, w - 32, 6);
    for (let x = 18; x < w - 18; x += 5) px(c, '#3a4656', x, 7, 3, 4);
    px(c, '#4a4f58', 13, 3, w - 26, 3);
    // 屋簷下的白底招牌
    px(c, '#f4efe2', cx - 22, wallTop + 3, 44, 10);
    px(c, '#8a3624', cx - 22, wallTop + 12, 44, 1);
    text(c, sign, cx, wallTop + 8, '#8a2a1a', `900 7px ${SERIF_TC}`);
  });
}

function museumSprite(w: number): HTMLCanvasElement {
  const h = 88;
  return cached('yl-museum', w, h, (c) => {
    const cx = w / 2;
    const top = 14;
    brickWall(c, 2, top, w - 4, h - top);
    // 女兒牆、白色的線腳、中間的牌匾
    px(c, '#efe6d2', 0, top - 2, w, 4);
    px(c, '#efe6d2', 0, top + 34, w, 3);
    px(c, '#a8452e', cx - 30, 2, 60, 12);
    px(c, '#efe6d2', cx - 28, 4, 56, 9);
    text(c, '甲子蘭酒文物館', cx, 8.5, '#8a2a1a', `900 7px ${SERIF_TC}`);
    // 兩層的拱窗（白框）
    for (const row of [top + 8, top + 42]) {
      for (let k = 0; k < 4; k += 1) {
        const x = Math.round(12 + k * ((w - 34) / 3));
        if (row > top + 30 && (k === 1 || k === 2)) continue;
        px(c, '#efe6d2', x - 1, row, 12, 20);
        c.fillStyle = '#efe6d2';
        c.beginPath();
        c.arc(x + 5, row + 1, 6, Math.PI, 0);
        c.fill();
        px(c, '#2f3a4a', x, row + 1, 10, 18);
        c.fillStyle = '#2f3a4a';
        c.beginPath();
        c.arc(x + 5, row + 2, 5, Math.PI, 0);
        c.fill();
        px(c, '#efe6d2', x + 5, row - 2, 1, 21);
        px(c, 'rgba(160,210,240,0.35)', x + 1, row + 2, 2, 4);
      }
    }
    // 門口：拱門、兩邊的酒甕
    px(c, '#efe6d2', cx - 14, h - 28, 28, 28);
    px(c, '#3a2414', cx - 11, h - 25, 22, 25);
    px(c, '#f6dfae', cx - 9, h - 22, 18, 22);
    px(c, '#8a5a32', cx, h - 22, 1, 22);
    px(c, '#9a948a', 0, h - 3, w, 3);
  });
}

// 酒甕（深褐色的陶甕，紅紙封口）：一個
function jar(c: CanvasRenderingContext2D, x: number, by: number): void {
  c.fillStyle = '#5a3a24';
  c.beginPath();
  c.ellipse(x, by - 6, 6, 6, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#7a5232', x - 4, by - 10, 2, 5);
  px(c, '#4a2e1c', x - 3, by - 13, 6, 2);
  px(c, '#c62828', x - 3, by - 15, 6, 3);
  px(c, '#f6c945', x - 1, by - 8, 2, 3);
}
// 酒廠門口的酒甕堆（金字塔）
function drawJarStack(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 26, by - 1, 52, 3);
  for (let row = 0; row < 3; row += 1) {
    const n = 4 - row;
    for (let k = 0; k < n; k += 1) jar(c, cx - (n - 1) * 6.5 + k * 13, by - row * 10);
  }
}

// ── 東門夜市：燈泡串、出口的牌樓、桌子、紅色塑膠椅 ──
function drawStringLights(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const y0 = (YL.cartY - 2.9) * T;
  const a = YL.market.x0 + 0.2;
  const b = YL.W - 0.2;
  c.strokeStyle = '#3a3d45';
  c.lineWidth = 1;
  c.beginPath();
  for (let x = a * T; x <= b * T; x += 4) {
    const t = ((x - a * T) / ((b - a) * T)) * 7;
    const y = y0 + Math.abs(Math.sin(t * Math.PI)) * 5;
    if (x === a * T) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  for (let x = a * T + 6, k = 0; x < b * T; x += 12, k += 1) {
    const t = ((x - a * T) / ((b - a) * T)) * 7;
    const y = y0 + Math.abs(Math.sin(t * Math.PI)) * 5 + 1;
    const col = ['#ff5a4a', '#ffd23f', '#5ad6ff', '#7aee6a'][k % 4] ?? '#ffd23f';
    px(c, d.night ? col : 'rgba(240,240,240,0.8)', Math.round(x), Math.round(y), 2, 3);
    if (d.night && k % 2 === 0) glow(c, x + 1, y + 1, 7, '255, 220, 150', 0.35);
  }
}

function drawMarketArch(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(YL.arch.x0 * T);
  const x1 = Math.round(YL.arch.x1 * T);
  const by = Math.round((YL.market.y1 + 0.2) * T);
  for (const x of [x0, x1 - 4]) {
    px(c, 'rgba(0,0,0,0.25)', x - 1, by, 6, 2);
    px(c, '#1f5fa8', x, by - 44, 4, 44);
    px(c, '#3f86d0', x, by - 44, 1, 44);
  }
  px(c, '#15171f', x0 - 4, by - 52, x1 - x0 + 8, 13);
  px(c, '#f6c945', x0 - 4, by - 52, x1 - x0 + 8, 1);
  px(c, '#f6c945', x0 - 4, by - 40, x1 - x0 + 8, 1);
  text(c, '東門夜市', (x0 + x1) / 2, by - 45.5, d.night ? '#ffe08a' : '#f6c945', `900 9px ${FONT_TC}`);
  for (let x = x0 - 2, k = 0; x < x1 + 4; x += 6, k += 1) {
    px(c, d.night && (k + Math.floor(d.seconds * 3)) % 3 === 0 ? '#fff6c8' : '#e8c86a', x, by - 38, 2, 2);
  }
}

function drawTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(TABLE_Y * T);
  const half = Math.round(1.2 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 1, half * 2, 3);
  px(c, '#9aa3b2', cx - half, by - 9, half * 2, 5);
  px(c, '#d6dae2', cx - half, by - 9, half * 2, 1);
  px(c, '#6a7080', cx - half + 2, by - 4, 2, 5);
  px(c, '#6a7080', cx + half - 4, by - 4, 2, 5);
  // 一盤卜肉、一碗、筷筒
  px(c, '#f4f1e8', cx - 11, by - 11, 8, 2);
  px(c, '#d9a04a', cx - 10, by - 12, 6, 1);
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

// ── 丟丟噹森林：銀灰色的鋼構大樹（細細的樹幹往上分岔，撐起一片鋼網樹冠，網上爬滿綠藤），晚上樹冠的小燈會亮 ──
const STEEL = '#b8c0c8';
const STEEL_DARK = '#7a828c';
function drawSteelTree(c: CanvasRenderingContext2D, x: number, y: number, h: number, spread: number, d: DrawCtx, seed: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const fork = by - Math.round(h * 0.5);
  const crownY = by - h + 12;
  const half = Math.round(spread * T);
  px(c, 'rgba(0,0,0,0.22)', cx - 10, by - 1, 20, 3);
  px(c, STEEL_DARK, cx - 4, by - 3, 8, 3);
  // 樹幹（兩根鋼管並在一起）
  px(c, STEEL, cx - 2, fork, 2, by - fork - 2);
  px(c, STEEL_DARK, cx, fork, 2, by - fork - 2);
  // 分岔：五根斜斜的鋼管撐到樹冠
  c.lineWidth = 2;
  for (const k of [-1, -0.5, 0, 0.5, 1]) {
    c.strokeStyle = k < 0 ? STEEL : STEEL_DARK;
    c.beginPath();
    c.moveTo(cx, fork);
    c.quadraticCurveTo(cx + k * half * 0.3, fork - 14, cx + k * half * 0.85, crownY + 8 + Math.abs(k) * 4);
    c.stroke();
  }
  // 樹冠：扁扁的一片，先鋪藤蔓的綠，再畫鋼網
  const rand = seeded(seed);
  c.fillStyle = 'rgba(0,0,0,0.12)';
  c.beginPath();
  c.ellipse(cx, crownY + 6, half, 9, 0, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 46; i += 1) {
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand());
    const lx = cx + Math.cos(a) * rr * (half - 4);
    const ly = crownY - 2 + Math.sin(a) * rr * 10;
    c.fillStyle = ['#2f6a34', '#3d7a3c', '#4c8a46', '#5a9a52', '#6aaa5a', '#7ab866'][Math.min(5, Math.floor(((ly - crownY + 12) / 24) * -6 + 6 + rand() * 1.5))] ?? '#4c8a46';
    c.beginPath();
    c.ellipse(lx, ly, 7 + rand() * 7, 4 + rand() * 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.save();
  c.beginPath();
  c.ellipse(cx, crownY, half, 13, 0, 0, Math.PI * 2);
  c.clip();
  c.strokeStyle = 'rgba(214,222,230,0.4)';
  c.lineWidth = 1;
  for (let k = -half; k <= half; k += 9) {
    c.beginPath();
    c.moveTo(cx + k - 13, crownY - 13);
    c.lineTo(cx + k + 13, crownY + 13);
    c.moveTo(cx + k + 13, crownY - 13);
    c.lineTo(cx + k - 13, crownY + 13);
    c.stroke();
  }
  c.restore();
  c.strokeStyle = STEEL;
  c.lineWidth = 2;
  c.beginPath();
  c.ellipse(cx, crownY, half, 13, 0, 0, Math.PI * 2);
  c.stroke();
  // 爬到鋼網外面的藤蔓（一叢叢蓋在網上、垂下來）
  for (let i = 0; i < 22; i += 1) {
    const a = rand() * Math.PI * 2;
    const rr = 0.35 + rand() * 0.75;
    const lx = cx + Math.cos(a) * rr * half;
    const ly = crownY + Math.sin(a) * rr * 12;
    c.fillStyle = ['#3d7a3c', '#4c8a46', '#5a9a52', '#6aaa5a', '#7ab866'][i % 5] ?? '#4c8a46';
    c.beginPath();
    c.ellipse(lx, ly, 4 + rand() * 5, 3 + rand() * 2, 0, 0, Math.PI * 2);
    c.fill();
    if (i % 3 === 0 && ly > crownY) px(c, '#4c8a46', Math.round(lx), Math.round(ly), 1, 4 + Math.round(rand() * 6));
  }
  // 掛在樹冠下的小燈（晚上一閃一閃）
  for (let k = 0; k < 7; k += 1) {
    const lx = cx - half + 8 + (k * (half * 2 - 16)) / 6;
    const ly = crownY + 9 + Math.sin(k * 1.7) * 3;
    const on = d.night && (k + Math.floor(d.seconds * 1.5 + seed)) % 4 !== 0;
    px(c, on ? '#fff1b0' : 'rgba(230,230,220,0.7)', Math.round(lx), Math.round(ly), 2, 2);
    if (on) glow(c, lx + 1, ly + 1, 8, '255, 230, 160', 0.45);
  }
}

// 掛在半空中的一節火車（藍色車身、白色窗帶），用鋼索吊在後排的樹冠下面；晚上車窗亮燈
function drawHangingTrain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(10.4 * T);
  const w = Math.round(7.4 * T);
  const by = Math.round(27.9 * T);
  const sway = Math.round(Math.sin(d.seconds * 0.5) * 0.6);
  // 地上的影子（火車是吊在半空中的）
  c.fillStyle = 'rgba(0,0,0,0.16)';
  c.beginPath();
  c.ellipse(x0 + w / 2, Math.round(30.6 * T), w / 2 + 4, 5, 0, 0, Math.PI * 2);
  c.fill();
  // 鋼索
  for (const x of [x0 + 10, x0 + w - 12]) {
    px(c, '#5a5f68', x, by - 50, 1, 26);
  }
  const top = by - 26 + sway;
  px(c, '#2a4a7a', x0, top, w, 22);
  px(c, '#3a64a0', x0, top, w, 2);
  px(c, '#1f3a60', x0, top + 18, w, 4);
  px(c, '#f2ead6', x0, top + 7, w, 8);
  for (let wx = x0 + 6; wx + 7 <= x0 + w - 6; wx += 10) px(c, d.night ? '#ffe9a8' : '#3a4656', wx, top + 8, 7, 6);
  px(c, '#5a5f68', x0 - 2, top - 3, w + 4, 3);
  // 底下的轉向架
  for (const x of [x0 + 8, x0 + w - 22]) {
    px(c, '#2b2d33', x, top + 22, 14, 3);
    px(c, '#15171f', x + 1, top + 25, 4, 3);
    px(c, '#15171f', x + 9, top + 25, 4, 3);
  }
  if (d.night) glow(c, x0 + w / 2, top + 11, 60, '255, 230, 160', 0.3);
}

// ── 宜蘭車站：米白色的站房（中間兩層、深灰的瓦屋頂、正中一個山牆和站名），兩邊一層的翼樓 ──
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((YL.station.x1 - YL.station.x0) * T);
  const h = 92;
  return cached('yl-station', w, h, (c) => {
    const base = h;
    const cx = w / 2;
    // 兩翼（一層）
    px(c, '#f2ead6', 0, base - 34, w, 34);
    px(c, '#4a4f58', -2, base - 42, w + 4, 8);
    for (let y = base - 41; y < base - 34; y += 2) px(c, '#3a3e46', 0, y, w, 1);
    px(c, '#d9ccae', 0, base - 8, w, 8);
    for (let x = 10; x < w - 14; x += 18) {
      if (Math.abs(x + 5 - cx) < 50 || x > w - 50) continue;
      px(c, '#ffffff', x - 1, base - 30, 12, 18);
      px(c, '#3a4656', x, base - 29, 10, 16);
      px(c, '#ffffff', x + 5, base - 29, 1, 16);
      px(c, 'rgba(160,210,240,0.35)', x + 1, base - 28, 2, 4);
    }
    // 中間（兩層）：瓦屋頂、山牆、站名
    px(c, '#f6efdc', cx - 44, base - 66, 88, 66);
    px(c, '#e2d6ba', cx - 44, base - 66, 3, 66);
    px(c, '#e2d6ba', cx + 41, base - 66, 3, 66);
    c.fillStyle = '#4a4f58';
    c.beginPath();
    c.moveTo(cx - 52, base - 64);
    c.lineTo(cx - 40, base - 80);
    c.lineTo(cx + 40, base - 80);
    c.lineTo(cx + 52, base - 64);
    c.closePath();
    c.fill();
    for (let y = base - 78; y < base - 64; y += 2) px(c, '#3a3e46', cx - 46, y, 92, 1);
    c.fillStyle = '#f6efdc';
    c.beginPath();
    c.moveTo(cx - 20, base - 64);
    c.lineTo(cx, base - 90);
    c.lineTo(cx + 20, base - 64);
    c.closePath();
    c.fill();
    c.strokeStyle = '#3a3e46';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx - 23, base - 63);
    c.lineTo(cx, base - 91);
    c.lineTo(cx + 23, base - 63);
    c.stroke();
    // 山牆裡的圓窗
    c.fillStyle = '#3a4656';
    c.beginPath();
    c.arc(cx, base - 74, 4, 0, Math.PI * 2);
    c.fill();
    // 二樓的窗
    for (let k = 0; k < 4; k += 1) {
      const x = Math.round(cx - 36 + k * 20);
      px(c, '#ffffff', x - 1, base - 47, 14, 16);
      px(c, '#3a4656', x, base - 46, 12, 14);
      px(c, '#ffffff', x + 6, base - 46, 1, 14);
    }
    // 站名牌（屋簷下面，名牌擋不到）
    px(c, '#1f3a60', cx - 34, base - 63, 68, 13);
    px(c, '#ffffff', cx - 34, base - 63, 68, 1);
    text(c, '宜蘭車站', cx, base - 56.5, '#ffffff', `900 9px ${SERIF_TC}`);
    // 雨庇、大門
    px(c, '#d9ccae', cx - 40, base - 26, 80, 4);
    px(c, 'rgba(0,0,0,0.18)', cx - 40, base - 22, 80, 2);
    for (const dx of [-30, -10, 10]) {
      px(c, '#2a2f3a', cx + dx, base - 20, 20, 20);
      px(c, '#ffe9b8', cx + dx + 2, base - 18, 16, 18);
      px(c, '#2a2f3a', cx + dx + 10, base - 18, 1, 18);
    }
    // 右邊：台鐵的牌子
    px(c, '#ffffff', w - 46, base - 26, 34, 9);
    px(c, '#1f5fa8', w - 46, base - 26, 34, 1);
    text(c, '臺鐵 宜蘭', w - 29, base - 21.5, '#1f3a60', `900 6px ${FONT_TC}`);
  });
}

// ── 組成 CityScene 用的資料 ──
const BACK_TREES: [number, number][] = [[2.6, 30.4], [8.6, 30.2], [19.6, 30.3], [26.8, 30.4]];
const FRONT_TREES: [number, number][] = [[2.8, 36.6], [15, 36.4], [27.2, 36.6]];
const TREES: [number, number][] = [[1.6, 21.6], [8.6, 21.8], [16.6, 21.6], [22.8, 21.8], [54.6, 33.2], [32.2, 36.8]];
const LAMPS: [number, number][] = [[12, 21.9], [26.4, 21.9], [37.6, 22.2], [44.6, 22.2], [5.2, 10.9], [24.2, 10.9], [36, 10.9], [52, 10.9], [31.4, 30.6], [54.4, 30.6]];
const SCOOTERS: [number, number][] = [44, 45.2, 46.4, 47.6, 48.8, 50, 51.2, 52.4].map((x): [number, number] => [x, 25.9]);

const props: CityProp[] = [
  { y: YL.river.y0, draw: (c, d) => drawRiverLife(c, d) },
  ...RIVER_BENCHES.map((x): CityProp => ({ y: RIVER_BENCH_Y - 0.01, draw: (c) => drawStoneBench(c, x, RIVER_BENCH_Y) })),
  { y: YL.brewery.line, draw: (c) => blit(c, warehouseSprite('wh-a', Math.round(7.8 * T), '宜蘭酒廠'), 0.6 * T, YL.brewery.line * T) },
  { y: YL.brewery.line, draw: (c) => blit(c, museumSprite(Math.round(7.6 * T)), 8.6 * T, YL.brewery.line * T) },
  { y: YL.brewery.line, draw: (c) => blit(c, warehouseSprite('wh-b', Math.round(7.2 * T), '紅露酒'), 16.2 * T, YL.brewery.line * T) },
  { y: YL.brewery.line + 1.4, draw: (c) => drawJarStack(c, 5, YL.brewery.line + 1.4) },
  { y: YL.brewery.line + 1.4, draw: (c) => drawJarStack(c, 19.8, YL.brewery.line + 1.4) },
  ...MARKET_CARTS.map((s, i): CityProp => ({ y: YL.cartY, draw: (c, d) => drawFoodCart(c, s.x, YL.cartY, s.name, s.awning, s.food, d.seconds + i * 0.37, 23 + i * 7) })),
  { y: YL.cartY + 0.02, draw: (c, d) => drawStringLights(c, d) },
  ...MARKET_TABLES.map((x): CityProp => ({ y: TABLE_Y, draw: (c) => drawTable(c, x) })),
  { y: YL.market.y1 + 0.2, draw: (c, d) => drawMarketArch(c, d) },
  ...BACK_TREES.map(([x, y], i): CityProp => ({ y, draw: (c, d) => drawSteelTree(c, x, y, 92, 3.5, d, 70 + i) })),
  { y: 30.65, draw: (c, d) => drawHangingTrain(c, d) },
  ...FRONT_TREES.map(([x, y], i): CityProp => ({ y, draw: (c, d) => drawSteelTree(c, x, y, 92, 3, d, 90 + i) })),
  ...FOREST_BENCHES.map((x): CityProp => ({ y: FOREST_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, FOREST_BENCH_Y, 2.6) })),
  { y: YL.station.y, draw: (c) => blit(c, stationSprite(), YL.station.x0 * T, YL.station.y * T) },
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[i % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  // 河和河北邊（稻田、山）都不能走
  r(0, 0, YL.W, YL.levee.y0 + 0.15),
  ...RIVER_BENCHES.map((x) => r(x - 1.3, RIVER_BENCH_Y - 0.35, x + 1.3, RIVER_BENCH_Y - 0.1)),
  // 酒廠的廠房、酒甕堆
  r(YL.brewery.x0, YL.slope + 0.2, YL.brewery.x1, YL.brewery.line - 0.1),
  r(3.4, YL.brewery.line + 0.6, 6.6, YL.brewery.line + 1.4),
  r(18.2, YL.brewery.line + 0.6, 21.4, YL.brewery.line + 1.4),
  ...MARKET_CARTS.map((s) => r(s.x - 1.25, YL.cartY - 0.8, s.x + 1.25, YL.cartY - 0.05)),
  ...MARKET_TABLES.map((x) => r(x - 1.2, TABLE_Y - 0.4, x + 1.2, TABLE_Y)),
  ...[YL.arch.x0 + 0.15, YL.arch.x1 - 0.15].map((x) => r(x - 0.15, YL.market.y1, x + 0.15, YL.market.y1 + 0.25)),
  ...[...BACK_TREES, ...FRONT_TREES].map(([x, y]) => r(x - 0.3, y - 0.25, x + 0.3, y + 0.05)),
  ...FOREST_BENCHES.map((x) => r(x - 1.3, FOREST_BENCH_Y - 0.75, x + 1.3, FOREST_BENCH_Y - 0.45)),
  ...FLOWER_BEDS.map(([x, y]) => r(x - 2, y - 0.9, x + 2, y + 0.9)),
  r(YL.station.x0, YL.station.y - 2.8, YL.station.x1, YL.station.y - 0.1),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
  r(43.6, 25.4, 52.8, 26),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...MARKET_CARTS.map((s) => ({ x: s.x * T, y: YL.cartY * T - 14, r: 40, color: 'rgba(255, 215, 140, 0.55)' })),
  { x: ((YL.arch.x0 + YL.arch.x1) / 2) * T, y: YL.market.y1 * T - 40, r: 50, color: 'rgba(255, 200, 90, 0.45)' },
  ...[...BACK_TREES, ...FRONT_TREES].map(([x, y]) => ({ x: x * T, y: y * T - 80, r: 60, color: 'rgba(255, 230, 160, 0.4)' })),
  { x: 14 * T, y: 26.6 * T, r: 60, color: 'rgba(255, 230, 160, 0.35)' },
  { x: 12.4 * T, y: YL.brewery.line * T - 20, r: 44, color: 'rgba(255, 210, 140, 0.4)' },
  { x: ((YL.station.x0 + YL.station.x1) / 2) * T, y: YL.station.y * T - 30, r: 90, color: 'rgba(255, 230, 180, 0.45)' },
];

const stationX = (YL.station.x0 + YL.station.x1) / 2;
const SEAT_STOOLS_FROM = (RIVER_BENCHES.length + FOREST_BENCHES.length) * 2;

export const YILAN: CityDef = {
  id: 'yilan',
  W: YL.W,
  H: YL.H,
  title: { 'zh-TW': '宜蘭 · 宜蘭河與丟丟噹森林', 'en-US': 'Yilan · Yilan River & Diu Diu Dang Forest' },
  stop: { 'zh-TW': '宜蘭', 'en-US': 'Yilan' },
  emoji: '🌾',
  line: 'tra',
  station: {
    x: stationX,
    y: YL.station.y + 0.7,
    name: { 'zh-TW': '台鐵宜蘭車站', 'en-US': 'TRA Yilan Station' },
    arrive: { x: stationX + 3, y: YL.station.y + 0.9 },
  },
  background: '#d9d0bf',
  soundscape: 'market',
  paintGround: paintYilanGround,
  props,
  solid,
  seats: YILAN_SEATS,
  drawSeat: (c, i) => {
    const s = YILAN_SEATS[i];
    if (s && i >= SEAT_STOOLS_FROM) drawStool(c, s.x, s.y);
  },
  shops: YILAN_SHOPS,
  infos: [
    { at: r(0, 0, 40, YL.paddy.y0), title: { 'zh-TW': '雪山山脈', 'en-US': 'Xueshan Range' }, text: { 'zh-TW': '蘭陽平原西北邊的山，最高的雪山是台灣第二高峰。冬天東北季風一來，山上常常雲霧繚繞，宜蘭也跟著下雨。', 'en-US': 'The mountains north-west of the Lanyang Plain — Xueshan is Taiwan’s second-highest peak. When the winter monsoon arrives the range is wrapped in cloud and Yilan gets its famous rain.' } },
    { at: r(44, 1.5, YL.W, YL.paddy.y0), title: { 'zh-TW': '龜山島', 'en-US': 'Guishan Island' }, text: { 'zh-TW': '頭城外海的火山島，長得像一隻浮在海上的烏龜，是宜蘭人的地標。天氣好的時候，從平原往東就看得到。', 'en-US': 'A volcanic island off Toucheng shaped like a turtle floating on the sea — Yilan’s signature view. On clear days you can see it from the plain.' } },
    { at: r(0, YL.paddy.y0, YL.W, YL.paddy.y1), title: { 'zh-TW': '蘭陽平原的稻田', 'en-US': 'Lanyang Plain Rice Fields' }, text: { 'zh-TW': '宜蘭雨水多、水源乾淨，整片平原都是稻田，田中間散著農舍。白鷺鷥常常站在田裡找東西吃。', 'en-US': 'Plenty of rain and clean water make the whole plain a sea of rice paddies dotted with farmhouses. Egrets stand in the fields looking for food.' } },
    { at: r(0, YL.river.y0, YL.W, YL.river.y1), title: { 'zh-TW': '宜蘭河', 'en-US': 'Yilan River' }, text: { 'zh-TW': '繞過宜蘭市北邊的河，兩岸的河堤是自行車道和散步的地方，傍晚很多人來騎車、慢跑。', 'en-US': 'The river curving past the north of Yilan City. Its levees carry bike paths and walking trails, busy with cyclists and joggers in the evening.' } },
    { at: r(YL.brewery.x0, YL.slope, YL.brewery.x1, YL.brewery.line), title: { 'zh-TW': '宜蘭酒廠', 'en-US': 'Yilan Distillery' }, text: { 'zh-TW': '日治時期就開始釀酒的老酒廠，紅磚廠房還留著。甲子蘭酒文物館展示釀酒的歷史，招牌是用紅麴釀的紅露酒。', 'en-US': 'A distillery dating back to the Japanese era, its red-brick halls still standing. The Jiazilan Wine Museum tells the brewing story; the signature is Honglu, a wine made with red yeast rice.' } },
    { at: r(YL.market.x0, YL.slope, YL.W, YL.market.y1), title: { 'zh-TW': '東門夜市', 'en-US': 'Dongmen Night Market' }, text: { 'zh-TW': '宜蘭市東邊的夜市。宜蘭小吃這裡都有：現炸的卜肉、外酥內軟的糕渣、三星蔥做的蔥油餅，伴手禮帶牛舌餅。', 'en-US': 'The night market on Yilan City’s east side, with all the local snacks: freshly fried bu-rou, crispy-soft gaozha, pancakes stuffed with Sanxing scallions — and ox-tongue pastry to take home.' } },
    { at: r(0, YL.road.y1, YL.forest.x1, YL.H), title: { 'zh-TW': '丟丟噹森林', 'en-US': 'Diu Diu Dang Forest' }, text: { 'zh-TW': '宜蘭車站旁的鋼構大樹，樹冠上爬滿藤蔓，半空中還掛著一節火車。名字來自宜蘭民謠〈丟丟銅仔〉，唱的就是火車過山洞。', 'en-US': 'Giant steel trees beside Yilan Station, their crowns covered in vines, with a train car hanging in mid-air. The name comes from the Yilan folk song “Diu Diu Tang-a”, about a train passing through a tunnel.' } },
    { at: r(YL.station.x0, YL.station.y - 6, YL.station.x1, YL.station.y), title: { 'zh-TW': '宜蘭車站', 'en-US': 'Yilan Station' }, text: { 'zh-TW': '台鐵宜蘭線的大站，從台北搭火車大約一個多小時。出站就是丟丟噹森林，走幾分鐘就到市區和夜市。', 'en-US': 'A main stop on the TRA Yilan Line, a little over an hour from Taipei. Diu Diu Dang Forest is right outside, and downtown and the night market are a short walk away.' } },
  ],
  labels: [
    { x: (RIVER_BENCHES[0] ?? 10) + 4, y: YL.levee.y0 - 0.6, text: { 'zh-TW': '🌊 宜蘭河堤（石椅坐下專注）', 'en-US': '🌊 Yilan River levee (sit on a bench)' }, color: '#7dd3fc' },
    { x: 12, y: YL.brewery.line - 5.8, text: { 'zh-TW': '🏭 宜蘭酒廠', 'en-US': '🏭 Yilan Distillery' }, color: '#fca5a5' },
    { x: (YL.arch.x0 + YL.arch.x1) / 2, y: YL.market.y1 - 3.8, text: { 'zh-TW': '🌙 東門夜市', 'en-US': '🌙 Dongmen Night Market' }, color: '#f472b6' },
    { x: 24, y: YL.road.y1 + 1.1, text: { 'zh-TW': '🌳 丟丟噹森林', 'en-US': '🌳 Diu Diu Dang Forest' }, color: '#86efac' },
  ],
  walkers: [
    { x0: 1, y0: 10.4, x1: 55, y1: 10.4, count: 4 },
    { x0: 1, y0: 20.8, x1: 23, y1: 20.8, count: 2 },
    { x0: 25, y0: 17.2, x1: 55, y1: 17.2, count: 4 },
    { x0: 25, y0: 21.4, x1: 55, y1: 21.4, count: 2 },
    { x0: 15.2, y0: 25.4, x1: 15.2, y1: 34.4, count: 2 },
    { x0: 1, y0: 34.8, x1: 30, y1: 34.8, count: 2 },
    { x0: 31, y0: 31.6, x1: 55, y1: 31.6, count: 3 },
    { x0: 31, y0: 37.2, x1: 55, y1: 37.2, count: 2 },
  ],
  traffic: [
    { y: 23.2, dir: 1, x0: 0, x1: YL.W, count: 2 },
    { y: 24.4, dir: -1, x0: 0, x1: YL.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點河堤的石椅、丟丟噹森林的長椅或夜市的桌子坐下專注 · 走到攤車買卜肉、三星蔥油餅、糕渣 · 點地標看介紹 · 宜蘭車站回台北（台鐵）',
    'en-US': 'WASD / arrows to move · click a levee bench, a bench in Diu Diu Dang Forest or a night-market table to focus · walk up to the carts for bu-rou, scallion pancakes and gaozha · click landmarks for info · Yilan Station back to Taipei (TRA)',
  },
  hintTouch: {
    'zh-TW': '點河堤石椅、森林長椅或夜市桌子坐下專注 · 走到攤車買東西 · 點地標看介紹 · 宜蘭車站回台北',
    'en-US': 'Tap a levee bench, forest bench or table to focus · walk up to the carts · tap landmarks · station back to Taipei',
  },
};
