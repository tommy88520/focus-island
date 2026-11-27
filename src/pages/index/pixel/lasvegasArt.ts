// 拉斯維加斯的美術：沙漠和紅色的山、遠方細高的觀景塔、金字塔飯店（晚上光束射向天空）、巴黎鐵塔複製品＋法式飯店、
// 大霓虹看板（換字的 LED＋直立的 CASINO 霓虹）、威尼斯宮殿＋鐘樓＋運河上的貢多拉、單軌電車高架站（電車開過）、
// 大道 The Strip（雙層巴士、加長禮車）、歡迎招牌（菱形、星星、跑馬燈泡）、拉霸機、噴泉湖（定時的噴泉秀）、自助餐廳。
// 招牌字都是自己編的通用字（CASINO、HOTEL、SHOW、BUFFET、777），不寫任何賭場、飯店的品牌名。最後組成 CityScene 用的 LASVEGAS。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { BUFFET_TABLES, BUFFET_TABLE_Y, LAKE_BENCHES, LAKE_BENCH_Y, LASVEGAS_SEATS, LASVEGAS_SHOPS, LV, SIGN_BENCH } from './lasvegas';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, drawBench, drawFoodCart, drawPalm, drawLamp } from './cityArt';

const NEON = ['#ff3fa4', '#3fe0ff', '#ffd23f', '#7cff6a', '#b26bff'];

// ── 地面（畫一次）──
export function paintLasVegasGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1905);
  const W = LV.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 7 * T);
  sky.addColorStop(0, '#4b93d6');
  sky.addColorStop(0.65, '#9ccbea');
  sky.addColorStop(1, '#f3dcb6');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 7 * T);
  const ridge = (col: string, base: number, a: number, b: number, amp: number, bottom: number): ((x: number) => number) => {
    const at = (x: number) => base + Math.sin(x * a) * amp + Math.sin(x * b + 1.3) * amp * 0.55;
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(0, bottom);
    for (let x = 0; x <= W; x += 6) c.lineTo(x, at(x));
    c.lineTo(W, bottom);
    c.fill();
    return at;
  };
  // 遠山（淡紫）、近一點的紅岩山（一層層的紅色岩層）
  ridge('#b79aa6', 3.4 * T, 0.009, 0.027, 10, 8 * T);
  const red = ridge('#b8573c', 4.7 * T, 0.013, 0.041, 13, 8.5 * T);
  for (let i = 0; i < 420; i += 1) {
    const x = rand() * W;
    const y = 3.6 * T + rand() * 4.6 * T;
    if (y < red(x) + 2) continue;
    px(c, rand() < 0.5 ? '#9e432c' : '#cf7650', Math.floor(x), Math.floor(y), 4 + Math.floor(rand() * 8), 1);
  }
  // 沙漠
  const sand = c.createLinearGradient(0, 6.6 * T, 0, 12.8 * T);
  sand.addColorStop(0, '#e6c79a');
  sand.addColorStop(1, '#d4ad78');
  c.fillStyle = sand;
  c.beginPath();
  c.moveTo(0, 12.8 * T);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, 6.9 * T + Math.sin(x * 0.02) * 3);
  c.lineTo(W, 12.8 * T);
  c.fill();
  for (let i = 0; i < 120; i += 1) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(7.4 * T + rand() * 5 * T);
    px(c, rand() < 0.5 ? '#8d8a58' : '#a39c66', x, y, 3, 2);
  }
  // 遠方的飯店高樓（淡淡的剪影）
  const towers: [number, number, number, string][] = [
    [0.4, 3, 5.4, '#c2c8d2'],
    [3.6, 2.4, 4.2, '#d8c79a'],
    [13.8, 2.6, 5, '#c2c8d2'],
    [25.4, 3.2, 5.8, '#d9b86a'],
    [36, 2.6, 4.6, '#c8ccd6'],
    [42.6, 3, 5.2, '#bfc6d2'],
    [55.4, 2.6, 4.4, '#d4cbb8'],
  ];
  for (const [x, w, h, col] of towers) {
    const x0 = Math.round(x * T);
    const y0 = Math.round((12.8 - h) * T);
    px(c, col, x0, y0, Math.round(w * T), Math.round(h * T));
    px(c, 'rgba(255,255,255,0.25)', x0, y0, 2, Math.round(h * T));
    for (let y = y0 + 4; y < 12.8 * T - 3; y += 4) px(c, 'rgba(60,70,90,0.22)', x0 + 3, y, Math.round(w * T) - 6, 1);
  }
  // 北側的飯店前庭
  tiles(c, { x0: 0, y0: 12.8, x1: LV.W, y1: LV.northLine }, '#d6cbb4', '#c8bca2', 16);
  // 北人行道、運河
  tiles(c, { x0: 0, y0: LV.northLine, x1: LV.W, y1: LV.road.y0 }, '#e6dcc8', '#d4c8b2', 16);
  const cn = LV.canal;
  px(c, '#e8e0d0', cn.x0 * T - 3, cn.y0 * T, (cn.x1 - cn.x0) * T + 6, (cn.y1 - cn.y0) * T + 3);
  const water = c.createLinearGradient(0, cn.y0 * T, 0, cn.y1 * T);
  water.addColorStop(0, '#2c7f98');
  water.addColorStop(1, '#3a9ab0');
  c.fillStyle = water;
  c.fillRect(cn.x0 * T, cn.y0 * T, (cn.x1 - cn.x0) * T, (cn.y1 - cn.y0) * T);
  for (let i = 0; i < 40; i += 1) px(c, 'rgba(255,255,255,0.3)', Math.floor(cn.x0 * T + rand() * (cn.x1 - cn.x0) * T - 6), Math.floor(cn.y0 * T + 3 + rand() * ((cn.y1 - cn.y0) * T - 6)), 6, 1);
  px(c, '#bfb6a4', cn.x0 * T - 3, cn.y1 * T, (cn.x1 - cn.x0) * T + 6, 3);
  // 大道：四線道，中間分隔島（黃線），兩邊的路緣
  const rd = LV.road;
  road(c, { x0: 0, y0: rd.y0, x1: LV.W, y1: rd.y1 }, rand);
  px(c, '#9a9286', 0, rd.y0 * T - 2, W, 2);
  px(c, '#9a9286', 0, rd.y1 * T, W, 2);
  for (const y of [22.75, 25.35]) for (let x = 0; x < W; x += 28) px(c, '#e8e8e8', x, Math.round(y * T), 14, 1);
  px(c, '#b8ad92', 0, 23.8 * T, W, 0.4 * T);
  px(c, '#f2c94c', 0, 23.8 * T, W, 1);
  px(c, '#f2c94c', 0, 24.2 * T - 1, W, 1);
  zebra(c, 13.6, rd.y0, 15.6, rd.y1, false);
  zebra(c, 42.8, rd.y0, 44.8, rd.y1, false);
  tiles(c, { x0: 0, y0: rd.y1, x1: LV.W, y1: LV.sidewalkS }, '#e6dcc8', '#d4c8b2', 16);
  // 歡迎招牌廣場：沙漠造景（碎石、龍舌蘭）、通往招牌的步道
  const lk = LV.lake;
  px(c, '#dcc49a', 0, LV.sidewalkS * T, lk.x0 * T, (LV.H - LV.sidewalkS) * T);
  for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#c9ae80' : '#ead6ae', Math.floor(rand() * lk.x0 * T), Math.floor(LV.sidewalkS * T + rand() * (LV.H - LV.sidewalkS) * T), 2, 1);
  tiles(c, { x0: 6.3, y0: LV.sidewalkS, x1: 8.7, y1: 33.6 }, '#eadfca', '#d8ccb4', 12);
  tiles(c, { x0: 2.6, y0: 33.6, x1: 12.4, y1: 42 }, '#eadfca', '#d8ccb4', 12);
  tiles(c, { x0: 8.7, y0: LV.sidewalkS, x1: lk.x0, y1: 33.6 }, '#eadfca', '#d8ccb4', 12);
  for (const [x, y] of [[1.4, 30.4], [13.8, 35.4], [1.6, 43], [13.4, 42.6], [4.2, 43.2]] as const) {
    for (let k = -3; k <= 3; k += 1) px(c, '#5e8a52', Math.round(x * T + k * 2), Math.round(y * T - 6 + Math.abs(k) * 1.5), 2, 6 - Math.abs(k));
  }
  // 噴泉湖前的步道、湖（石頭邊、水面的反光）
  tiles(c, { x0: lk.x0, y0: LV.sidewalkS, x1: lk.x1, y1: lk.y0 }, '#ede3d1', '#dcd0ba', 12);
  const lake = c.createLinearGradient(0, lk.y0 * T, 0, LV.H * T);
  lake.addColorStop(0, '#2f7fa8');
  lake.addColorStop(1, '#1f5c84');
  c.fillStyle = lake;
  c.fillRect(lk.x0 * T, lk.y0 * T, (lk.x1 - lk.x0) * T, (LV.H - lk.y0) * T);
  for (let i = 0; i < 110; i += 1) px(c, 'rgba(255,255,255,0.22)', Math.floor(lk.x0 * T + rand() * ((lk.x1 - lk.x0) * T - 8)), Math.floor(lk.y0 * T + 6 + rand() * (LV.H - lk.y0) * T), 5 + Math.floor(rand() * 7), 1);
  px(c, '#cfc5b2', lk.x0 * T, lk.y0 * T - 3, (lk.x1 - lk.x0) * T, 4);
  px(c, '#cfc5b2', lk.x0 * T - 3, lk.y0 * T - 3, 4, (LV.H - lk.y0) * T + 3);
  px(c, '#cfc5b2', lk.x1 * T - 1, lk.y0 * T - 3, 4, (LV.H - lk.y0) * T + 3);
  // 自助餐廳前：鋪面、門口的紅土磚露台
  tiles(c, { x0: lk.x1, y0: LV.sidewalkS, x1: LV.W, y1: LV.H }, '#e4d6ba', '#d0c09e', 12);
  tiles(c, { x0: LV.buffet.x0, y0: LV.buffet.line, x1: LV.buffet.x1, y1: LV.H }, '#d9b48c', '#c49a72', 10);
}

function star(c: CanvasRenderingContext2D, x: number, y: number, r: number, inner: number, points: number, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  for (let k = 0; k < points * 2; k += 1) {
    const a = -Math.PI / 2 + (k / (points * 2)) * Math.PI * 2;
    const rr = k % 2 === 0 ? r : inner;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}

// ── 遠方細高的觀景塔（三支腳撐著的細柱、上面的觀景台、尖針）──
function stratSprite(): HTMLCanvasElement {
  return cached('lv-strat', 44, 150, (c) => {
    const cx = 22;
    const h = 150;
    // 三支腳
    c.fillStyle = '#c4c9d2';
    for (const dx of [-12, 12]) {
      c.beginPath();
      c.moveTo(cx + dx, h);
      c.lineTo(cx + dx * 0.25, 70);
      c.lineTo(cx + dx * 0.25 + (dx > 0 ? -2 : 2), 70);
      c.lineTo(cx + dx - (dx > 0 ? 3 : -3), h);
      c.fill();
    }
    px(c, '#d6dae2', cx - 3, 42, 6, h - 42);
    px(c, '#aeb4c0', cx + 1, 42, 2, h - 42);
    // 觀景台（兩層的圓盤）
    px(c, '#b6bcc8', cx - 14, 34, 28, 4);
    px(c, '#e4e7ec', cx - 12, 22, 24, 12);
    for (let x = cx - 10; x < cx + 10; x += 4) px(c, '#5a6a80', x, 25, 3, 3);
    for (let x = cx - 10; x < cx + 10; x += 4) px(c, '#5a6a80', x, 30, 3, 2);
    px(c, '#aeb4c0', cx - 10, 18, 20, 4);
    // 尖針
    px(c, '#d6dae2', cx - 1, 0, 2, 18);
    px(c, '#e8402e', cx - 1, 0, 2, 2);
  });
}
function drawStrat(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = LV.strat.x * T;
  const by = LV.strat.y * T;
  blit(c, stratSprite(), cx - 22, by);
  if (d.night) {
    const top = by - 150;
    for (let x = -10; x < 10; x += 4) px(c, (Math.floor(d.seconds * 2) + x) % 3 === 0 ? '#ff6ad5' : '#fff1b0', cx + x, top + 25, 3, 3);
    px(c, Math.floor(d.seconds) % 2 ? '#ff3a2a' : '#7a1a10', cx - 1, top, 2, 2);
  }
}

// ── 金字塔飯店：深色玻璃的金字塔、轉角亮邊、底下的埃及式門廊 ──
const PYR_H = 150;
function pyramidSprite(): HTMLCanvasElement {
  const w = (LV.pyramid.x1 - LV.pyramid.x0) * T;
  const h = PYR_H;
  return cached('lv-pyramid', w, h, (c) => {
    const ax = w / 2;
    const ay = 4;
    const base = h - 10;
    const L = 4;
    const R = w - 4;
    const edge = w * 0.62;
    const tri = (col: string, x0: number, x1: number) => {
      c.fillStyle = col;
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(x0, base);
      c.lineTo(x1, base);
      c.closePath();
      c.fill();
    };
    tri('#3f3a4a', L, edge);
    tri('#27232f', edge, R);
    // 天空的反光（左邊一條亮帶）
    tri('rgba(150,175,215,0.22)', L, L + 40);
    // 玻璃格：橫線＋往頂點收的直線
    c.save();
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(L, base);
    c.lineTo(R, base);
    c.closePath();
    c.clip();
    for (let y = ay + 5; y < base; y += 5) px(c, 'rgba(255,255,255,0.07)', 0, y, w, 1);
    c.strokeStyle = 'rgba(0,0,0,0.2)';
    c.lineWidth = 1;
    for (let i = 1; i < 18; i += 1) {
      c.beginPath();
      c.moveTo(ax, ay);
      c.lineTo(L + ((R - L) * i) / 18, base);
      c.stroke();
    }
    c.restore();
    c.strokeStyle = 'rgba(225,225,240,0.45)';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(ax, ay);
    c.lineTo(edge, base);
    c.stroke();
    // 頂端的燈座
    px(c, '#e8e2d0', ax - 3, ay - 3, 6, 4);
    // 底座、門廊
    px(c, '#dccca4', 0, base, w, 10);
    px(c, '#c2b08a', 0, base, w, 2);
    const ex = (L + edge) / 2;
    px(c, '#e6d6ae', ex - 22, base - 26, 44, 26);
    px(c, '#c9b48a', ex - 24, base - 30, 48, 5);
    for (const x of [ex - 20, ex - 11, ex + 7, ex + 16]) {
      px(c, '#d2be92', x, base - 25, 4, 25);
      px(c, '#3a8fa0', x, base - 25, 4, 2);
    }
    px(c, '#2a2018', ex - 6, base - 20, 12, 20);
    px(c, '#f6d48a', ex - 4, base - 18, 8, 6);
    text(c, 'CASINO', ex, base - 27.5, '#8a5a12', `900 4px ${FONT_TC}`);
    // 門口兩邊的方尖碑
    for (const x of [ex - 34, ex + 30]) {
      c.fillStyle = '#d8c49a';
      c.beginPath();
      c.moveTo(x, base);
      c.lineTo(x + 1, base - 30);
      c.lineTo(x + 2, base - 34);
      c.lineTo(x + 3, base - 30);
      c.lineTo(x + 4, base);
      c.fill();
    }
  });
}
// 晚上：頂端射向天空的光束
function drawPyramidBeam(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!d.night) return;
  const cx = ((LV.pyramid.x0 + LV.pyramid.x1) / 2) * T;
  const top = LV.northLine * T - PYR_H + 2;
  const g = c.createLinearGradient(0, 0, 0, top);
  g.addColorStop(0, 'rgba(255,255,255,0.35)');
  g.addColorStop(1, 'rgba(255,255,255,0.95)');
  px(c, 'rgba(210,225,255,0.35)', cx - 5, 0, 10, top);
  c.fillStyle = g;
  c.fillRect(cx - 2, 0, 4, top);
  glow(c, cx, top, 18, '255, 255, 255', 0.8);
}

// ── 巴黎鐵塔複製品＋後面的法式飯店（奶油色石牆、藍灰色的馬薩式屋頂）──
function parisHotelSprite(): HTMLCanvasElement {
  const w = Math.round((LV.paris.x1 - LV.paris.x0) * T);
  const h = 86;
  return cached('lv-paris-hotel', w, h, (c) => {
    px(c, '#eadab8', 0, 24, w, h - 24);
    // 馬薩式屋頂＋老虎窗
    c.fillStyle = '#5b6a80';
    c.beginPath();
    c.moveTo(0, 26);
    c.lineTo(8, 8);
    c.lineTo(w - 8, 8);
    c.lineTo(w, 26);
    c.fill();
    px(c, '#c9a24a', 8, 7, w - 16, 2);
    for (let x = 12; x < w - 14; x += 16) {
      px(c, '#eadab8', x, 12, 9, 11);
      c.fillStyle = '#eadab8';
      c.beginPath();
      c.arc(x + 4.5, 12, 4.5, Math.PI, 0);
      c.fill();
      px(c, '#3a4a60', x + 2, 13, 5, 8);
    }
    // 窗（每層有黑色的小陽台）
    for (const y of [32, 46, 60]) {
      for (let x = 6; x < w - 8; x += 12) {
        px(c, '#d4c098', x - 1, y - 1, 9, 12);
        px(c, '#4a5a72', x, y, 7, 10);
        px(c, 'rgba(255,255,255,0.3)', x + 1, y + 1, 2, 3);
        px(c, '#2a2a30', x - 1, y + 8, 9, 2);
      }
      px(c, '#d8c6a0', 0, y + 11, w, 1);
    }
    // 一樓的拱廊
    px(c, '#ddc9a2', 0, h - 16, w, 16);
    for (let x = 4; x < w - 10; x += 16) {
      px(c, '#3a3028', x, h - 12, 12, 12);
      c.fillStyle = '#3a3028';
      c.beginPath();
      c.arc(x + 6, h - 12, 6, Math.PI, 0);
      c.fill();
      px(c, '#f2cf86', x + 2, h - 8, 8, 4);
    }
    px(c, '#1f3f8a', 6, 18, 30, 8);
    text(c, 'HOTEL', 21, 22, '#ffffff', `900 5px ${FONT_TC}`);
    px(c, '#7a1a2a', w - 38, 18, 32, 8);
    text(c, 'CASINO', w - 22, 22, '#f6d36a', `900 5px ${FONT_TC}`);
  });
}

const EIFFEL_W = 88;
const EIFFEL_H = 200;
function eiffelSprite(): HTMLCanvasElement {
  return cached('lv-eiffel', EIFFEL_W, EIFFEL_H, (c) => {
    const w = EIFFEL_W;
    const h = EIFFEL_H;
    const cx = w / 2;
    const p1 = h - 60;
    const p2 = h - 118;
    const shape = new Path2D();
    // 四支腳＋拱
    shape.moveTo(2, h);
    shape.quadraticCurveTo(12, p1 + 30, 18, p1);
    shape.lineTo(w - 18, p1);
    shape.quadraticCurveTo(w - 12, p1 + 30, w - 2, h);
    shape.lineTo(w - 16, h);
    shape.quadraticCurveTo(cx + 18, p1 + 14, cx, p1 + 14);
    shape.quadraticCurveTo(cx - 18, p1 + 14, 16, h);
    shape.closePath();
    // 第二段
    shape.moveTo(24, p1 - 5);
    shape.quadraticCurveTo(30, p1 - 30, 32, p2);
    shape.lineTo(w - 32, p2);
    shape.quadraticCurveTo(w - 30, p1 - 30, w - 24, p1 - 5);
    shape.closePath();
    // 尖頂
    shape.moveTo(34, p2 - 4);
    shape.quadraticCurveTo(cx - 3, p2 - 40, cx - 2, 22);
    shape.lineTo(cx + 2, 22);
    shape.quadraticCurveTo(cx + 3, p2 - 40, w - 34, p2 - 4);
    shape.closePath();
    c.fillStyle = '#8c6040';
    c.fill(shape);
    // 鐵格子（交叉的斜線）
    c.save();
    c.clip(shape);
    c.strokeStyle = 'rgba(70,42,22,0.75)';
    c.lineWidth = 1;
    for (let k = -h; k < w + h; k += 5) {
      c.beginPath();
      c.moveTo(k, 0);
      c.lineTo(k + h, h);
      c.stroke();
      c.beginPath();
      c.moveTo(k, h);
      c.lineTo(k + h, 0);
      c.stroke();
    }
    px(c, 'rgba(255,220,170,0.18)', 0, 0, cx - 4, h);
    c.restore();
    // 兩層觀景台
    px(c, '#6a4428', 14, p1 - 6, w - 28, 7);
    px(c, '#b08458', 14, p1 - 6, w - 28, 1);
    for (let x = 16; x < w - 16; x += 4) px(c, '#4a2e18', x, p1 - 3, 2, 2);
    px(c, '#6a4428', 28, p2 - 5, w - 56, 6);
    px(c, '#b08458', 28, p2 - 5, w - 56, 1);
    // 頂端的小屋、天線
    px(c, '#6a4428', cx - 4, 14, 8, 9);
    px(c, '#b08458', cx - 4, 14, 8, 1);
    px(c, '#8a8f99', cx - 1, 0, 2, 14);
  });
}
// 晚上：鐵塔上的金色燈一閃一閃
function drawEiffelSparkle(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!d.night) return;
  const x0 = LV.paris.tower * T - EIFFEL_W / 2;
  const by = LV.northLine * T + 0.2 * T;
  const sparkle = Math.floor(d.seconds * 0.5) % 4 === 0;
  for (let k = 0; k < 46; k += 1) {
    const ty = 20 + ((k * 37) % 170);
    const half = ty > EIFFEL_H - 60 ? 12 + ((ty - (EIFFEL_H - 60)) / 60) * 30 : ty > EIFFEL_H - 118 ? 6 + ((ty - (EIFFEL_H - 118)) / 58) * 14 : 2 + (ty / (EIFFEL_H - 118)) * 6;
    const tx = EIFFEL_W / 2 + (((k * 53) % 100) / 50 - 1) * half;
    const on = sparkle ? (k + Math.floor(d.seconds * 8)) % 3 === 0 : k % 2 === 0;
    px(c, on ? '#fff6c8' : '#e8b860', Math.round(x0 + tx), Math.round(by - EIFFEL_H + ty), 1, 1);
  }
}

// ── 大霓虹看板：柱子、換字的 LED 看板、直立的 CASINO、頂上的星星 ──
const BOARD_WORDS = ['SHOW', 'BUFFET', '777', 'HOTEL'];
function drawPylon(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(LV.pylon.x * T);
  const by = Math.round(LV.pylon.y * T);
  const s = d.seconds;
  px(c, 'rgba(0,0,0,0.25)', cx - 8, by - 1, 16, 3);
  px(c, '#7a808a', cx - 4, by - 42, 8, 42);
  px(c, '#9aa0aa', cx - 4, by - 42, 2, 42);
  // LED 看板（每 2.5 秒換一個字）
  const bx0 = cx - 28;
  const bTop = by - 80;
  px(c, '#c9a24a', bx0 - 2, bTop - 2, 60, 42);
  px(c, '#140f1e', bx0, bTop, 56, 38);
  const wi = Math.floor(s / 2.5) % BOARD_WORDS.length;
  const col = NEON[wi % NEON.length] ?? '#ff3fa4';
  for (let k = 0; k < 8; k += 1) px(c, `rgba(255,255,255,${0.05 + 0.05 * ((k + Math.floor(s * 6)) % 2)})`, bx0, bTop + k * 5, 56, 1);
  text(c, BOARD_WORDS[wi] ?? 'SHOW', cx, bTop + 17, col, `900 ${wi === 1 ? 11 : 13}px ${FONT_TC}`);
  for (let k = 0; k < 6; k += 1) px(c, NEON[(k + Math.floor(s * 3)) % NEON.length] ?? '#fff', bx0 + 6 + k * 8, bTop + 31, 4, 2);
  // 直立的 CASINO（晚上一個字一個字亮起來）
  const cTop = by - 160;
  px(c, '#7a0f2a', cx - 12, cTop, 24, 80);
  px(c, '#b3123a', cx - 10, cTop + 2, 20, 76);
  const lit = Math.floor(s * 4) % 9;
  'CASINO'.split('').forEach((ch, k) => {
    const on = !d.night || lit > k;
    text(c, ch, cx, cTop + 9 + k * 12, on ? '#fff3a8' : '#a86a3a', `900 10px ${FONT_TC}`);
  });
  // 跑馬燈泡（框邊一圈）
  const bulbs: [number, number][] = [];
  for (let y = cTop + 2; y < by - 80; y += 5) bulbs.push([cx - 12, y], [cx + 11, y]);
  for (let x = bx0 - 2; x < bx0 + 58; x += 5) bulbs.push([x, bTop - 3], [x, bTop + 39]);
  bulbs.forEach(([x, y], k) => px(c, (k + Math.floor(s * 6)) % 3 === 0 ? '#fffbe0' : d.night ? '#e8a02a' : '#d8c090', x, y, 1.5, 1.5));
  star(c, cx, cTop - 8, 10, 4, 5, '#ffd23f');
  star(c, cx, cTop - 8, 6, 2.5, 5, d.night && Math.floor(s * 2) % 2 ? '#ffffff' : '#ff8a3f');
}

// ── 威尼斯：宮殿（白色拱廊、粉紅色菱格紋的牆）、鐘樓、運河上的貢多拉、條紋的繫船柱 ──
function veniceSprite(): HTMLCanvasElement {
  const w = (LV.venice.x1 - LV.venice.x0) * T;
  const h = 96;
  return cached('lv-venice', w, h, (c) => {
    // 屋頂的白色雉堞
    for (let x = 0; x < w; x += 6) px(c, '#f2ede2', x, 0, 4, 5);
    // 上層：粉紅色的菱格紋牆、尖拱大窗
    px(c, '#e9b8a2', 0, 5, w, 41);
    c.save();
    c.beginPath();
    c.rect(0, 5, w, 41);
    c.clip();
    c.strokeStyle = 'rgba(250,228,214,0.7)';
    c.lineWidth = 1;
    for (let k = -60; k < w + 60; k += 8) {
      c.beginPath();
      c.moveTo(k, 5);
      c.lineTo(k + 41, 46);
      c.stroke();
      c.beginPath();
      c.moveTo(k + 41, 5);
      c.lineTo(k, 46);
      c.stroke();
    }
    c.restore();
    for (let x = 14; x < w - 14; x += 32) {
      px(c, '#f4efe4', x - 2, 14, 14, 22);
      c.fillStyle = '#f4efe4';
      c.beginPath();
      c.moveTo(x - 2, 14);
      c.lineTo(x + 5, 6);
      c.lineTo(x + 12, 14);
      c.fill();
      px(c, '#3a4a5a', x + 1, 16, 8, 18);
      c.fillStyle = '#3a4a5a';
      c.beginPath();
      c.moveTo(x + 1, 16);
      c.lineTo(x + 5, 11);
      c.lineTo(x + 9, 16);
      c.fill();
    }
    // 中間的陽台＋小牌子
    px(c, '#f4efe4', w / 2 - 16, 36, 32, 4);
    px(c, '#1f3f6a', w / 2 - 18, 28, 36, 8);
    text(c, 'HOTEL', w / 2, 32, '#f6d36a', `900 5px ${FONT_TC}`);
    // 中層：白色的尖拱迴廊、四葉飾
    px(c, '#f1ece2', 0, 46, w, 22);
    for (let x = 2; x < w - 4; x += 8) {
      px(c, '#5a5048', x + 1, 52, 5, 12);
      c.fillStyle = '#5a5048';
      c.beginPath();
      c.moveTo(x + 1, 52);
      c.lineTo(x + 3.5, 48);
      c.lineTo(x + 6, 52);
      c.fill();
    }
    px(c, '#ddd5c6', 0, 64, w, 4);
    for (let x = 2; x < w; x += 4) px(c, '#c8bfae', x, 64, 2, 4);
    // 一樓：大拱廊（裡面暖暖的燈）
    px(c, '#f4efe4', 0, 68, w, h - 68);
    for (let x = 4; x < w - 12; x += 16) {
      px(c, '#3a3430', x + 1, 76, 12, h - 76);
      c.fillStyle = '#3a3430';
      c.beginPath();
      c.arc(x + 7, 76, 6, Math.PI, 0);
      c.fill();
      px(c, '#f2cf86', x + 3, 84, 8, 6);
    }
    px(c, '#ddd5c6', 0, h - 3, w, 3);
  });
}
function campanileSprite(): HTMLCanvasElement {
  return cached('lv-campanile', 30, 176, (c) => {
    const h = 176;
    // 紅磚塔身
    px(c, '#b8533a', 7, 64, 16, h - 64);
    for (const x of [9, 14, 19]) px(c, '#9c4430', x, 66, 1, h - 70);
    for (let y = 68; y < h; y += 4) px(c, 'rgba(0,0,0,0.08)', 7, y, 16, 1);
    px(c, '#e8e0d0', 5, h - 6, 20, 6);
    // 鐘樓（白色拱窗）
    px(c, '#f1ece2', 5, 42, 20, 22);
    for (const x of [7, 13, 19]) px(c, '#4a4038', x, 46, 4, 13);
    px(c, '#ddd5c6', 4, 40, 22, 3);
    // 上面的方塊、綠色的尖頂、金色的天使
    px(c, '#e6dcc8', 6, 28, 18, 12);
    px(c, '#c9a24a', 10, 31, 10, 5);
    c.fillStyle = '#4f8a6e';
    c.beginPath();
    c.moveTo(5, 28);
    c.lineTo(15, 6);
    c.lineTo(25, 28);
    c.fill();
    c.fillStyle = '#3a6e56';
    c.beginPath();
    c.moveTo(15, 6);
    c.lineTo(25, 28);
    c.lineTo(17, 28);
    c.fill();
    px(c, '#e8c24a', 14, 0, 3, 6);
    px(c, '#e8c24a', 12, 2, 7, 1);
  });
}
function drawMooringPoles(c: CanvasRenderingContext2D): void {
  for (const x of [29.4, 30.1, 36.2, 42.2, 42.8]) {
    const cx = Math.round(x * T);
    const by = Math.round(LV.canal.y1 * T - 2);
    for (let k = 0; k < 24; k += 4) px(c, k % 8 ? '#f4f4f4' : '#2a5aa8', cx, by - 24 + k, 2, 4);
    px(c, '#c9a24a', cx - 1, by - 26, 4, 2);
  }
}
function drawGondolas(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cn = LV.canal;
  c.save();
  c.beginPath();
  c.rect(cn.x0 * T, cn.y0 * T - 30, (cn.x1 - cn.x0) * T, (cn.y1 - cn.y0) * T + 30);
  c.clip();
  const span = (cn.x1 - cn.x0) * T + 40;
  for (let k = 0; k < 2; k += 1) {
    const tt = ((d.seconds * 7 + k * span * 0.9) % (span * 2)) / span;
    const dir = tt < 1 ? 1 : -1;
    const x = cn.x0 * T - 20 + (tt < 1 ? tt : 2 - tt) * span;
    const y = Math.round((cn.y0 + 0.9 + k * 0.85) * T);
    drawGondola(c, Math.round(x), y, dir, k, d.seconds);
  }
  c.restore();
}
function drawGondola(c: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, k: number, s: number): void {
  px(c, 'rgba(0,0,0,0.25)', x - 18, y + 1, 36, 2);
  px(c, '#15151a', x - 16, y - 4, 32, 5);
  // 翹起來的船頭、船尾
  px(c, '#15151a', x + dir * 15, y - 8, 3, 5);
  px(c, '#d6dae2', x + dir * 16, y - 12, 2, 5);
  px(c, '#15151a', x - dir * 17, y - 7, 3, 4);
  px(c, '#7a1a2a', x - 6, y - 6, 12, 2);
  // 乘客
  px(c, k ? '#3b82f6' : '#e25a4a', x - 4, y - 11, 5, 6);
  px(c, '#f0c8a0', x - 4, y - 15, 5, 4);
  px(c, '#3a2a1a', x - 4, y - 16, 5, 2);
  // 船夫：條紋衫、草帽、長槳
  const gx = x - dir * 11;
  for (let r = 0; r < 8; r += 2) px(c, r % 4 ? '#f4f4f4' : '#c8102e', gx - 2, y - 13 + r, 5, 2);
  px(c, '#15151a', gx - 2, y - 5, 5, 2);
  px(c, '#f0c8a0', gx - 2, y - 17, 5, 4);
  px(c, '#e8d08a', gx - 4, y - 18, 9, 2);
  px(c, '#c8102e', gx - 2, y - 19, 5, 1);
  const sway = Math.sin(s * 1.6 + k) * 2;
  c.strokeStyle = '#8a6a42';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(gx + dir * 2, y - 14);
  c.lineTo(gx - dir * (6 + sway), y + 2);
  c.stroke();
}

// ── 單軌電車高架站：柱子、軌道梁、玻璃月台、樓梯、地面的入口 ──
const STATION_H = 100;
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((LV.station.x1 - LV.station.x0) * T);
  const h = STATION_H;
  return cached('lv-station', w, h, (c) => {
    for (const x of [12, 64, 120, 176]) {
      px(c, '#c8ccd2', x, 48, 8, h - 48);
      px(c, '#e0e3e8', x, 48, 2, h - 48);
    }
    // 月台的玻璃牆、弧形的屋頂
    px(c, '#9fc3d8', 30, 14, w - 60, 26);
    for (let x = 32; x < w - 30; x += 10) px(c, '#7aa0b8', x, 14, 1, 26);
    px(c, 'rgba(255,255,255,0.35)', 30, 16, w - 60, 2);
    c.fillStyle = '#eef1f4';
    c.beginPath();
    c.moveTo(24, 16);
    c.quadraticCurveTo(w / 2, -2, w - 24, 16);
    c.lineTo(w - 24, 18);
    c.lineTo(24, 18);
    c.fill();
    px(c, '#2a64b0', 24, 16, w - 48, 2);
    // 軌道梁
    px(c, '#d6d9de', 0, 40, w, 8);
    px(c, '#f0f2f4', 0, 40, w, 1);
    px(c, '#a8aeb8', 0, 47, w, 2);
    // 樓梯（右邊往下到地面）
    c.strokeStyle = '#8a909a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w - 44, 49);
    c.lineTo(w - 8, h - 2);
    c.stroke();
    for (let k = 0; k < 12; k += 1) px(c, '#b8bec8', w - 44 + k * 3, 50 + k * 4, 6, 1);
    // 地面的入口（玻璃盒子）＋招牌
    px(c, '#2a64b0', 64, 56, 84, 10);
    text(c, 'MONORAIL', 106, 61, '#ffffff', `900 7px ${FONT_TC}`);
    px(c, '#e2e6ea', 70, 66, 72, h - 66);
    for (let x = 74; x < 138; x += 10) px(c, '#8fd0f0', x, 70, 7, h - 72);
    px(c, '#3a4a5a', 98, 76, 16, h - 76);
  });
}
// 單軌電車：白色車身、深色車窗、藍色的線，每 22 秒開過一班
function drawMonorail(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = LV.station.x0 * T;
  const w = (LV.station.x1 - LV.station.x0) * T;
  const beamTop = LV.station.line * T - STATION_H + 40;
  const t = d.seconds % 22;
  if (t > 11) return;
  const len = 4 * 50;
  const dir = Math.floor(d.seconds / 22) % 2 === 0 ? 1 : -1;
  const k = t / 11;
  const x = dir > 0 ? x0 - len + k * (w + len) : x0 + w - k * (w + len);
  c.save();
  c.beginPath();
  c.rect(x0, beamTop - 20, w, 22);
  c.clip();
  for (let i = 0; i < 4; i += 1) {
    const cx = x + i * 50;
    px(c, '#f4f6f8', cx, beamTop - 16, 48, 15);
    px(c, '#2a64b0', cx, beamTop - 4, 48, 3);
    px(c, '#1f2a3a', cx + 3, beamTop - 13, 42, 5);
    for (let wx = cx + 6; wx < cx + 44; wx += 9) px(c, d.night ? '#fff1c0' : '#5a7a94', wx, beamTop - 12, 6, 3);
  }
  // 車頭（圓圓的）
  const nose = dir > 0 ? x + len - 2 : x - 2;
  px(c, '#f4f6f8', nose, beamTop - 13, 4, 11);
  c.restore();
}

// ── 自助餐廳：奶油色的牆、大大的 BUFFET 霓虹招牌、暖暖的落地窗、紅金條紋的雨棚 ──
const BUFFET_H = 100;
function buffetSprite(): HTMLCanvasElement {
  const w = Math.round((LV.buffet.x1 - LV.buffet.x0) * T);
  const h = BUFFET_H;
  const door = (LV.buffet.door - LV.buffet.x0) * T;
  return cached('lv-buffet', w, h, (c) => {
    px(c, '#efe0c4', 0, 30, w, h - 30);
    px(c, '#c8754a', 0, 30, w, 4);
    px(c, '#f6ead2', 0, 34, w, 1);
    // 屋頂上的大招牌
    px(c, '#8a8f99', 30, 22, 3, 8);
    px(c, '#8a8f99', w - 33, 22, 3, 8);
    px(c, '#c9a24a', 14, 0, w - 28, 24);
    px(c, '#2a1430', 16, 2, w - 32, 20);
    text(c, 'BUFFET', w / 2, 12.5, '#ffd23f', `900 15px ${FONT_TC}`);
    text(c, 'ALL YOU CAN EAT', w / 2, 40, '#8a3a1a', `900 5px ${FONT_TC}`);
    // 落地窗（裡面是一排排的菜）
    for (const [x0, x1] of [[8, door - 22], [door + 22, w - 8]] as const) {
      px(c, '#7a5a3a', x0 - 2, 48, x1 - x0 + 4, 36);
      px(c, '#f6d89a', x0, 50, x1 - x0, 32);
      for (let x = x0 + 2; x < x1 - 4; x += 7) {
        px(c, '#c9ccd6', x, 70, 6, 3);
        px(c, ['#e25a4a', '#7ab84a', '#f2c14e', '#ff9a7a'][Math.floor(x / 7) % 4] ?? '#e25a4a', x + 1, 68, 4, 2);
      }
      for (let x = x0; x < x1; x += 14) px(c, '#7a5a3a', x, 50, 1, 32);
      px(c, 'rgba(255,255,255,0.35)', x0 + 2, 52, 8, 2);
    }
    // 門＋紅金條紋雨棚
    for (let k = 0; k < 44; k += 4) px(c, (k / 4) % 2 ? '#f2c14e' : '#c8102e', door - 22 + k, 52, 4, 8);
    px(c, 'rgba(0,0,0,0.2)', door - 22, 60, 44, 1);
    px(c, '#c9a24a', door - 16, 62, 32, h - 62);
    px(c, '#9fd0e8', door - 14, 64, 13, h - 64);
    px(c, '#9fd0e8', door + 1, 64, 13, h - 64);
    px(c, 'rgba(255,255,255,0.4)', door - 12, 66, 2, 14);
    px(c, '#d8c8a8', 0, h - 3, w, 3);
  });
}
function drawBuffetBulbs(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = LV.buffet.x0 * T + 14;
  const w = (LV.buffet.x1 - LV.buffet.x0) * T - 28;
  const top = LV.buffet.line * T - BUFFET_H;
  const pts: [number, number][] = [];
  for (let x = x0 + 2; x < x0 + w - 2; x += 5) pts.push([x, top + 1], [x, top + 21]);
  pts.forEach(([x, y], k) => px(c, (k + Math.floor(d.seconds * 5)) % 4 < 2 ? '#fffbe0' : d.night ? '#e88a2a' : '#d8b870', Math.round(x), Math.round(y), 2, 2));
}

// ── 歡迎招牌：白色菱形、銀幣上的 WELCOME、藍色的 TO FABULOUS、紅色的 LAS VEGAS、頂上的紅星、跑馬燈泡 ──
const SIGN_W = 136;
const SIGN_H = 116;
const DIA = { top: 18, mid: 52, bottom: 86, left: 3, right: 133 };
function welcomeSprite(): HTMLCanvasElement {
  return cached('lv-welcome', SIGN_W, SIGN_H, (c) => {
    const cx = SIGN_W / 2;
    // 兩支柱子、水泥底座
    for (const x of [50, 80]) {
      px(c, '#cfd4dc', x, 78, 6, SIGN_H - 84);
      px(c, '#eef1f4', x, 78, 2, SIGN_H - 84);
    }
    px(c, '#a8a49a', 44, SIGN_H - 6, 48, 6);
    px(c, '#c2beb4', 44, SIGN_H - 6, 48, 1);
    // 菱形
    const dia = new Path2D();
    dia.moveTo(cx, DIA.top);
    dia.lineTo(DIA.right, DIA.mid);
    dia.lineTo(cx, DIA.bottom);
    dia.lineTo(DIA.left, DIA.mid);
    dia.closePath();
    c.fillStyle = '#c9c2ae';
    c.fill(dia);
    c.save();
    c.translate(cx, DIA.mid);
    c.scale(0.92, 0.88);
    c.translate(-cx, -DIA.mid);
    c.fillStyle = '#fbf9f1';
    c.fill(dia);
    c.restore();
    // WELCOME：一個字一個銀幣
    'WELCOME'.split('').forEach((ch, k) => {
      const x = cx + (k - 3) * 10;
      c.fillStyle = '#ffffff';
      c.strokeStyle = '#b8bcc4';
      c.lineWidth = 1;
      c.beginPath();
      c.arc(x, 41, 4.4, 0, Math.PI * 2);
      c.fill();
      c.stroke();
      text(c, ch, x, 41.5, '#d62828', `900 6px ${FONT_TC}`);
    });
    text(c, 'TO FABULOUS', cx, 50, '#1f4fa8', `italic 900 7px ${FONT_TC}`);
    text(c, 'LAS VEGAS', cx, 60, '#d62828', `900 12px ${FONT_TC}`);
    text(c, 'NEVADA', cx, 71, '#1f4fa8', `900 5px ${FONT_TC}`);
    // 頂上的紅星（黃邊）
    star(c, cx, 12, 12, 5, 8, '#f2c94c');
    star(c, cx, 12, 9.5, 3.8, 8, '#d62828');
  });
}
function welcomeBulbs(): [number, number][] {
  const cx = SIGN_W / 2;
  const corners: [number, number][] = [
    [cx, DIA.top + 3],
    [DIA.right - 5, DIA.mid],
    [cx, DIA.bottom - 3],
    [DIA.left + 5, DIA.mid],
  ];
  const out: [number, number][] = [];
  corners.forEach(([ax, ay], k) => {
    const [bx, by] = corners[(k + 1) % 4] ?? corners[0] ?? [0, 0];
    for (let i = 0; i < 10; i += 1) out.push([ax + ((bx - ax) * i) / 10, ay + ((by - ay) * i) / 10]);
  });
  return out;
}
const SIGN_BULBS = welcomeBulbs();
function drawWelcomeSign(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(LV.sign.x * T - SIGN_W / 2);
  const by = Math.round(LV.sign.y * T);
  px(c, 'rgba(0,0,0,0.2)', x0 + 38, by - 1, 60, 3);
  blit(c, welcomeSprite(), x0, by);
  const top = by - SIGN_H;
  const step = Math.floor(d.seconds * 6);
  SIGN_BULBS.forEach(([x, y], k) => {
    const on = (k + step) % 4 < 2;
    px(c, on ? '#fff6b0' : d.night ? '#c98a2a' : '#e8d08a', Math.round(x0 + x - 1), Math.round(top + y - 1), 2, 2);
  });
}

// ── 拉霸機（抽籤）：紅色機台、777 的燈箱、三個轉輪、拉桿 ──
const REEL_FACES = [
  ['7', '7', '7'],
  ['c', 'c', 'c'],
  ['b', '7', 'c'],
  ['7', 'b', '7'],
  ['b', 'b', 'b'],
];
function drawReelFace(c: CanvasRenderingContext2D, face: string, x: number, y: number): void {
  if (face === '7') text(c, '7', x + 3, y + 4.5, '#d62828', `900 8px ${FONT_TC}`);
  else if (face === 'c') {
    px(c, '#3f8a3a', x + 3, y + 1, 1, 3);
    px(c, '#d62828', x + 1, y + 4, 2, 3);
    px(c, '#d62828', x + 4, y + 4, 2, 3);
  } else {
    px(c, '#15171f', x + 0.5, y + 3, 5, 3);
    px(c, '#f2c94c', x + 1, y + 4, 4, 1);
  }
}
function drawSlotMachine(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(LV.slot.x * T);
  const by = Math.round(LV.slot.y * T);
  const s = d.seconds;
  px(c, 'rgba(0,0,0,0.25)', cx - 16, by - 1, 32, 3);
  px(c, '#3a3040', cx - 14, by - 8, 28, 8);
  px(c, '#c81e3a', cx - 13, by - 40, 26, 32);
  px(c, '#e8405a', cx - 13, by - 40, 2, 32);
  px(c, '#c9a24a', cx - 14, by - 41, 28, 2);
  // 燈箱
  px(c, '#c9a24a', cx - 13, by - 52, 26, 11);
  px(c, '#1a1424', cx - 11, by - 50, 22, 7);
  text(c, '777', cx, by - 46.5, Math.floor(s * 2) % 2 ? '#ffd23f' : '#ff5a7a', `900 7px ${FONT_TC}`);
  for (let k = 0; k < 6; k += 1) px(c, (k + Math.floor(s * 4)) % 2 ? '#fffbe0' : '#e8a02a', cx - 12 + k * 5, by - 53, 1.5, 1.5);
  // 轉輪：每 7 秒轉一次
  const cyc = s % 7;
  const spinning = cyc < 1.4;
  const face = REEL_FACES[Math.floor(s / 7) % REEL_FACES.length] ?? REEL_FACES[0] ?? [];
  px(c, '#c9a24a', cx - 11, by - 35, 22, 13);
  for (let k = 0; k < 3; k += 1) {
    const rx = cx - 10 + k * 7;
    px(c, '#ffffff', rx, by - 34, 6, 11);
    if (spinning && cyc < 0.6 + k * 0.35) {
      for (let r = 0; r < 11; r += 3) px(c, ['#d62828', '#3f8a3a', '#15171f'][(r + Math.floor(s * 20) + k) % 3] ?? '#d62828', rx + 1, by - 34 + ((r + Math.floor(s * 30)) % 11), 4, 1);
    } else drawReelFace(c, face[k] ?? '7', rx, by - 32);
  }
  // 出幣口、拉桿（轉的時候拉下來）
  px(c, '#9aa3b2', cx - 9, by - 18, 18, 4);
  px(c, '#5a5d66', cx - 7, by - 17, 14, 2);
  const pulled = spinning && cyc < 0.5;
  px(c, '#9aa3b2', cx + 13, by - 30, 3, 4);
  px(c, '#c9ccd6', cx + 14, pulled ? by - 30 : by - 42, 2, pulled ? 8 : 12);
  px(c, '#e8402e', cx + 13, pulled ? by - 24 : by - 45, 4, 4);
  if (d.night) glow(c, cx, by - 30, 22, '255, 120, 160', 0.35);
}

// ── 噴泉秀：每 40 秒一場（24 秒），水柱跟著節奏升起；平常只有小小的水花 ──
const JETS = 25;
const SHOW_CYCLE = 40;
const SHOW_LEN = 24;
const JET_MAX = 104;
const jetX = (i: number): number => (LV.lake.x0 + 1.4 + (i * (LV.lake.x1 - LV.lake.x0 - 2.8)) / (JETS - 1)) * T;
function jetHeight(i: number, s: number): number {
  const t = s % SHOW_CYCLE;
  if (t >= SHOW_LEN) return 0;
  const env = Math.max(0, Math.min(1, t / 1.2, (SHOW_LEN - t) / 0.8));
  const mid = (JETS - 1) / 2;
  const u = Math.abs(i - mid) / mid;
  const part = Math.floor(t / 6);
  let h: number;
  if (part === 0) h = 0.2 + 0.8 * Math.max(0, Math.sin(t * 2.6 - i * 0.45));
  else if (part === 1) h = 0.15 + 0.85 * Math.max(0, Math.sin((t * 1.6 - u * 1.4) * Math.PI)) * (1 - u * 0.35);
  else if (part === 2) h = (i + Math.floor(t * 2)) % 2 === 0 ? 0.95 : 0.2;
  else h = Math.min(1, 0.45 + (t - 18) * 0.25) * (0.88 + 0.12 * Math.sin(t * 9 + i));
  return Math.max(0, Math.min(1, h)) * env;
}
function drawFountains(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const base = Math.round(LV.jetY * T);
  const s = d.seconds;
  const on = s % SHOW_CYCLE < SHOW_LEN;
  for (let i = 0; i < JETS; i += 1) {
    const x = Math.round(jetX(i));
    const h = jetHeight(i, s);
    if (h < 0.04) {
      // 沒有表演：小小的水花
      px(c, `rgba(235,248,255,${0.35 + 0.2 * Math.sin(s * 3 + i)})`, x - 1, base - 2, 3, 2);
      continue;
    }
    const H = Math.round(JET_MAX * h);
    px(c, 'rgba(220,238,255,0.4)', x - 3, base - H + 4, 7, H - 4);
    px(c, 'rgba(255,255,255,0.9)', x - 1, base - H, 3, H);
    for (let k = 0; k < 9; k += 1) {
      const a = (k / 9) * Math.PI * 2 + s * 2.4 + i;
      const rr = 3 + ((k * 7 + i * 3) % 5);
      px(c, 'rgba(255,255,255,0.75)', Math.round(x + Math.cos(a) * rr), Math.round(base - H + 3 + Math.abs(Math.sin(a)) * rr), 2, 2);
    }
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath();
    c.ellipse(x + 0.5, base, 8, 2.5, 0, 0, Math.PI * 2);
    c.fill();
  }
  // 大結局的水霧
  const t = s % SHOW_CYCLE;
  if (on && t > 18) glow(c, ((LV.lake.x0 + LV.lake.x1) / 2) * T, base - 60, 200, '255, 255, 255', 0.25 * Math.min(1, (t - 18) / 2) * Math.min(1, (SHOW_LEN - t) / 0.8));
}

// ── 湖邊：白色欄杆、復古路燈（兩顆燈球）──
function drawRailing(c: CanvasRenderingContext2D): void {
  const x0 = LV.lake.x0 * T;
  const x1 = LV.lake.x1 * T;
  const y = Math.round(LV.lake.y0 * T - 3);
  px(c, '#f2ede2', x0, y - 9, x1 - x0, 2);
  px(c, '#d8d0c0', x0, y - 7, x1 - x0, 1);
  px(c, '#e8e2d4', x0, y - 3, x1 - x0, 1);
  for (let x = x0; x <= x1 - 2; x += 6) px(c, '#e8e2d4', Math.round(x), y - 7, 2, 7);
  for (let x = x0; x <= x1 - 3; x += 48) px(c, '#f6f2ea', Math.round(x), y - 11, 4, 11);
}
function drawGlobeLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  px(c, '#2a3a34', cx - 1, by - 30, 3, 30);
  px(c, '#2a3a34', cx - 3, by - 4, 7, 4);
  px(c, '#2a3a34', cx - 7, by - 30, 15, 2);
  for (const dx of [-6, 6]) {
    px(c, night ? '#fff6d0' : '#eef0f2', cx + dx - 2, by - 36, 5, 6);
    px(c, 'rgba(255,255,255,0.6)', cx + dx - 1, by - 35, 1, 2);
  }
  px(c, night ? '#fff6d0' : '#eef0f2', cx - 2, by - 40, 5, 6);
}

// ── 自助餐廳露台的桌子：白桌巾、盤子、雞尾酒蝦、條紋的陽傘 ──
function drawBuffetTable(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 16, by, 32, 3);
  px(c, '#e6e0d4', cx - 15, by - 8, 30, 7);
  px(c, '#f8f5ee', cx - 16, by - 12, 32, 5);
  px(c, '#ffffff', cx - 16, by - 12, 32, 1);
  px(c, '#5a4a3a', cx - 1, by - 2, 3, 2);
  // 盤子、雞尾酒蝦的杯子
  for (const dx of [-10, 5]) {
    px(c, '#ffffff', cx + dx, by - 12, 7, 2);
    px(c, dx < 0 ? '#e25a4a' : '#7ab84a', cx + dx + 2, by - 13, 3, 1);
  }
  px(c, '#cfe8f0', cx - 2, by - 17, 5, 4);
  px(c, '#ff8a6a', cx - 3, by - 18, 2, 2);
  px(c, '#ff8a6a', cx + 2, by - 18, 2, 2);
  px(c, '#cfe8f0', cx, by - 13, 1, 2);
  // 陽傘
  px(c, '#8a8f99', cx + 11, by - 46, 2, 36);
  for (let k = 0; k < 48; k += 6) {
    c.fillStyle = (k / 6) % 2 ? '#f4f1e8' : '#c8102e';
    c.beginPath();
    c.moveTo(cx + 12, by - 52);
    c.lineTo(cx - 12 + k, by - 42);
    c.lineTo(cx - 6 + k, by - 42);
    c.closePath();
    c.fill();
  }
  px(c, '#c9a24a', cx + 11, by - 54, 2, 2);
}
function drawChair(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, '#6a3e22', cx - 5, by - 16, 10, 2);
  px(c, '#6a3e22', cx - 5, by - 16, 2, 14);
  px(c, '#6a3e22', cx + 3, by - 16, 2, 14);
  px(c, '#8a5a32', cx - 5, by - 5, 10, 3);
  px(c, '#4a2a16', cx - 5, by - 2, 2, 3);
  px(c, '#4a2a16', cx + 3, by - 2, 2, 3);
}

// ── 大道上的雙層巴士、加長禮車 ──
const BIG_CARS: { kind: 'bus' | 'limo'; y: number; dir: 1 | -1; speed: number; phase: number }[] = [
  { kind: 'bus', y: 25.9, dir: 1, speed: 1.9, phase: 0.2 },
  { kind: 'limo', y: 22.1, dir: -1, speed: 2.6, phase: 0.6 },
  { kind: 'limo', y: 24.7, dir: 1, speed: 2.2, phase: 0.75 },
];
function drawBigCar(c: CanvasRenderingContext2D, car: (typeof BIG_CARS)[number], d: DrawCtx): void {
  const span = LV.W + 10;
  const k = ((d.seconds * car.speed) / span + car.phase) % 1;
  const x = Math.round((car.dir > 0 ? -5 + k * span : LV.W + 5 - k * span) * T);
  const by = Math.round(car.y * T);
  const dir = car.dir;
  c.save();
  c.beginPath();
  c.rect(0, 0, LV.W * T, LV.H * T);
  c.clip();
  drawBigCarBody(c, car.kind, x, by, dir, d);
  c.restore();
}
function drawBigCarBody(c: CanvasRenderingContext2D, kind: 'bus' | 'limo', x: number, by: number, dir: 1 | -1, d: DrawCtx): void {
  if (kind === 'bus') {
    px(c, 'rgba(0,0,0,0.3)', x - 32, by - 1, 64, 3);
    px(c, '#c8102e', x - 31, by - 14, 62, 12);
    px(c, '#f2c14e', x - 31, by - 30, 62, 16);
    px(c, '#f6d36a', x - 31, by - 30, 62, 2);
    for (let wx = x - 28; wx < x + 26; wx += 9) {
      px(c, d.night ? '#fff1c0' : '#2b3550', wx, by - 27, 7, 6);
      px(c, d.night ? '#fff1c0' : '#2b3550', wx, by - 12, 7, 5);
    }
    px(c, '#15171f', x - 24, by - 3, 8, 4);
    px(c, '#15171f', x + 16, by - 3, 8, 4);
    px(c, '#fff3b0', x + dir * 30, by - 8, 2, 3);
    if (d.night) glow(c, x + dir * 40, by - 6, 14, '255, 240, 180', 0.4);
    return;
  }
  px(c, 'rgba(0,0,0,0.3)', x - 28, by - 1, 56, 3);
  px(c, '#f4f6f8', x - 27, by - 11, 54, 9);
  px(c, '#ffffff', x - 27, by - 11, 54, 1);
  px(c, '#f4f6f8', x - 20, by - 15, 38, 4);
  px(c, '#1f2430', x - 18, by - 14, 34, 3);
  px(c, '#15171f', x - 22, by - 3, 6, 3);
  px(c, '#15171f', x + 16, by - 3, 6, 3);
  px(c, '#fff3b0', x + dir * 27, by - 8, 2, 2);
  if (d.night) glow(c, x + dir * 36, by - 6, 12, '255, 240, 180', 0.35);
}

// ── 晚上會變的燈（霓虹閃、噴泉打光）：每一幀改 lights 裡的顏色 ──
type Light = CityDef['lights'][number];
const FX: Record<'pylon' | 'board' | 'buffet' | 'slot' | 'lakeNeon', Light> = {
  pylon: { x: LV.pylon.x * T, y: LV.pylon.y * T - 120, r: 100 },
  board: { x: LV.pylon.x * T, y: LV.pylon.y * T - 61, r: 60 },
  buffet: { x: ((LV.buffet.x0 + LV.buffet.x1) / 2) * T, y: LV.buffet.line * T - 88, r: 120 },
  slot: { x: LV.slot.x * T, y: LV.slot.y * T - 30, r: 40 },
  lakeNeon: { x: 27.4 * T, y: 33.4 * T, r: 70 },
};
const JET_LIGHTS: Light[] = Array.from({ length: 9 }, (_, k) => ({ x: jetX(k * 3), y: LV.jetY * T, r: 40, color: 'rgba(0,0,0,0)' }));
function updateFx(d: DrawCtx): void {
  if (!d.night) return;
  const s = d.seconds;
  const neon = (k: number, a: number) => {
    const hex = NEON[k % NEON.length] ?? '#ff3fa4';
    return `rgba(${parseInt(hex.slice(1, 3), 16)}, ${parseInt(hex.slice(3, 5), 16)}, ${parseInt(hex.slice(5, 7), 16)}, ${a})`;
  };
  FX.pylon.color = neon(0, 0.6 + 0.15 * Math.sin(s * 5));
  FX.board.color = neon(Math.floor(s / 2.5) % 4, 0.65);
  FX.buffet.color = `rgba(255, 200, 90, ${0.6 + 0.12 * Math.sin(s * 3)})`;
  FX.slot.color = neon(Math.floor(s * 2), 0.45);
  FX.lakeNeon.color = neon(Math.floor(s / 2.5) % 4, 0.16);
  JET_LIGHTS.forEach((l, k) => {
    const h = Math.max(jetHeight(k * 3, s), jetHeight(Math.min(JETS - 1, k * 3 + 1), s));
    l.y = LV.jetY * T - (JET_MAX * h) / 2;
    l.r = 26 + h * 40;
    l.color = h < 0.04 ? 'rgba(0,0,0,0)' : `rgba(235, 245, 255, ${0.6 * h})`;
  });
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = LASVEGAS_SEATS[i];
  if (s && i >= 8) drawChair(c, s.x, s.y);
}

const PALMS: [number, number][] = [[1.6, 21.1], [8.4, 21.1], [16.9, 21.1], [24.4, 21.1], [33.6, 21.1], [40.4, 21.1], [46.6, 21.1], [55.2, 21.1], [2, 27.1], [10.6, 27.1], [19, 27.1], [26.6, 27.1], [35.2, 27.1], [41.8, 27.1], [49.4, 27.1], [56.4, 27.1], [1.4, 36.6], [13.6, 38.4], [45.2, 43.4], [57.2, 41.2]];
const LAMPS: [number, number][] = [[5, 21.2], [20.6, 21.2], [37, 21.2], [51, 21.2], [6, 27.2], [23, 27.2], [38.6, 27.2], [53, 27.2]];
const GLOBE_LAMPS = [15.8, 24.85, 33.35, 42.4];

const props: CityProp[] = [
  { y: -10, draw: (_c, d) => updateFx(d) },
  { y: LV.strat.y, draw: (c, d) => drawStrat(c, d) },
  { y: LV.northLine - 0.5, draw: (c, d) => drawPyramidBeam(c, d) },
  { y: LV.northLine, draw: (c) => blit(c, pyramidSprite(), LV.pyramid.x0 * T, LV.northLine * T) },
  { y: LV.northLine - 0.2, draw: (c) => blit(c, parisHotelSprite(), LV.paris.x0 * T, LV.northLine * T - 0.2 * T) },
  { y: LV.northLine + 0.2, draw: (c) => blit(c, eiffelSprite(), LV.paris.tower * T - EIFFEL_W / 2, LV.northLine * T + 0.2 * T) },
  { y: LV.northLine + 0.21, draw: (c, d) => drawEiffelSparkle(c, d) },
  { y: LV.venice.line - 0.3, draw: (c) => blit(c, campanileSprite(), LV.campanile.x * T - 15, LV.venice.line * T - 0.3 * T) },
  { y: LV.venice.line, draw: (c) => blit(c, veniceSprite(), LV.venice.x0 * T, LV.venice.line * T) },
  { y: LV.canal.y1 - 0.1, draw: (c, d) => drawGondolas(c, d) },
  { y: LV.canal.y1, draw: (c) => drawMooringPoles(c) },
  { y: LV.station.line, draw: (c) => blit(c, stationSprite(), LV.station.x0 * T, LV.station.line * T) },
  { y: LV.station.line + 0.01, draw: (c, d) => drawMonorail(c, d) },
  { y: LV.pylon.y, draw: (c, d) => drawPylon(c, d) },
  { y: LV.slush.y, draw: (c, d) => drawFoodCart(c, LV.slush.x, LV.slush.y, 'SLUSH', '#2a8ad8', ['#ff4fa0', '#3fd0ff', '#a6f04a'], d.seconds, 83) },
  { y: LV.hotdog.y, draw: (c, d) => drawFoodCart(c, LV.hotdog.x, LV.hotdog.y, 'HOT DOG', '#d62828', ['#c8643a', '#f2c94c', '#c8643a'], d.seconds + 0.4, 91) },
  ...BIG_CARS.map((car): CityProp => ({ y: car.y, draw: (c, d) => drawBigCar(c, car, d) })),
  { y: LV.sign.y, draw: (c, d) => drawWelcomeSign(c, d) },
  { y: SIGN_BENCH.y - 0.01, draw: (c) => drawBench(c, SIGN_BENCH.x, SIGN_BENCH.y, 2.6) },
  { y: LV.slot.y, draw: (c, d) => drawSlotMachine(c, d) },
  ...LAKE_BENCHES.map((x): CityProp => ({ y: LAKE_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, LAKE_BENCH_Y, 2.6) })),
  { y: LV.lake.y0 - 0.05, draw: (c) => drawRailing(c) },
  ...GLOBE_LAMPS.map((x): CityProp => ({ y: LV.lake.y0 - 0.04, draw: (c, d) => drawGlobeLamp(c, x, LV.lake.y0 - 0.1, d.night) })),
  { y: LV.jetY, draw: (c, d) => drawFountains(c, d) },
  { y: LV.buffet.line, draw: (c) => blit(c, buffetSprite(), LV.buffet.x0 * T, LV.buffet.line * T) },
  { y: LV.buffet.line + 0.01, draw: (c, d) => drawBuffetBulbs(c, d) },
  ...BUFFET_TABLES.map((x): CityProp => ({ y: BUFFET_TABLE_Y, draw: (c) => drawBuffetTable(c, x, BUFFET_TABLE_Y) })),
  ...PALMS.map(([x, y], i): CityProp => ({ y, draw: (c, d) => drawPalm(c, x, y, d.seconds + i, 38) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, LV.W, LV.northLine - 0.1),
  r(LV.canal.x0, LV.canal.y0, LV.canal.x1, LV.canal.y1 + 0.1),
  r(LV.station.x0, LV.station.line - 0.6, LV.station.x1, LV.station.line - 0.05),
  r(LV.pylon.x - 0.35, LV.pylon.y - 0.3, LV.pylon.x + 0.35, LV.pylon.y),
  ...[LV.slush, LV.hotdog].map((s) => r(s.x - 1.25, s.y - 0.8, s.x + 1.25, s.y - 0.05)),
  r(LV.slot.x - 0.9, LV.slot.y - 0.6, LV.slot.x + 1.1, LV.slot.y),
  r(LV.sign.x - 2, LV.sign.y - 0.5, LV.sign.x + 2, LV.sign.y),
  r(SIGN_BENCH.x - 1.3, SIGN_BENCH.y - 0.75, SIGN_BENCH.x + 1.3, SIGN_BENCH.y - 0.45),
  ...LAKE_BENCHES.map((x) => r(x - 1.3, LAKE_BENCH_Y - 0.75, x + 1.3, LAKE_BENCH_Y - 0.45)),
  r(LV.lake.x0 - 0.1, LV.lake.y0 - 0.3, LV.lake.x1 + 0.1, LV.H),
  r(LV.buffet.x0, LV.buffet.line - 3.4, LV.buffet.x1, LV.buffet.line - 0.05),
  ...BUFFET_TABLES.map((x) => r(x - 1, BUFFET_TABLE_Y - 0.35, x + 1, BUFFET_TABLE_Y)),
  ...PALMS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const pyrX = ((LV.pyramid.x0 + LV.pyramid.x1) / 2) * T;
const pyrTop = LV.northLine * T - PYR_H + 2;
const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...GLOBE_LAMPS.map((x) => ({ x: x * T, y: LV.lake.y0 * T - 36, r: 36, color: 'rgba(255, 236, 190, 0.5)' })),
  // 金字塔的光束：一顆顆疊上去
  ...Array.from({ length: Math.floor((pyrTop - 14) / 14) }, (_, k) => ({ x: pyrX, y: pyrTop - k * 14, r: 14, color: 'rgba(225, 235, 255, 0.55)' })),
  { x: pyrX, y: pyrTop + 30, r: 70, color: 'rgba(160, 190, 255, 0.25)' },
  { x: LV.paris.tower * T, y: LV.northLine * T - 90, r: 90, color: 'rgba(255, 200, 110, 0.4)' },
  { x: LV.paris.tower * T, y: LV.northLine * T - 170, r: 30, color: 'rgba(255, 220, 150, 0.4)' },
  { x: ((LV.paris.x0 + LV.paris.x1) / 2) * T, y: LV.northLine * T - 20, r: 80, color: 'rgba(255, 210, 140, 0.35)' },
  { x: ((LV.venice.x0 + LV.venice.x1) / 2) * T, y: LV.venice.line * T - 30, r: 130, color: 'rgba(255, 200, 150, 0.4)' },
  { x: LV.campanile.x * T, y: LV.venice.line * T - 130, r: 40, color: 'rgba(255, 220, 170, 0.4)' },
  { x: ((LV.canal.x0 + LV.canal.x1) / 2) * T, y: LV.canal.y1 * T - 10, r: 110, color: 'rgba(120, 220, 255, 0.25)' },
  { x: ((LV.station.x0 + LV.station.x1) / 2) * T, y: LV.station.line * T - 70, r: 110, color: 'rgba(200, 225, 255, 0.4)' },
  { x: LV.strat.x * T, y: LV.strat.y * T - 125, r: 34, color: 'rgba(255, 140, 220, 0.5)' },
  { x: LV.sign.x * T, y: LV.sign.y * T - 64, r: 80, color: 'rgba(255, 240, 190, 0.4)' },
  { x: LV.sign.x * T, y: LV.sign.y * T - 104, r: 26, color: 'rgba(255, 80, 70, 0.5)' },
  { x: LV.slush.x * T, y: LV.slush.y * T - 14, r: 40, color: 'rgba(120, 220, 255, 0.45)' },
  { x: LV.hotdog.x * T, y: LV.hotdog.y * T - 14, r: 40, color: 'rgba(255, 180, 120, 0.5)' },
  ...BUFFET_TABLES.map((x) => ({ x: x * T, y: BUFFET_TABLE_Y * T - 20, r: 44, color: 'rgba(255, 210, 140, 0.45)' })),
  { x: LV.buffet.door * T, y: LV.buffet.line * T - 30, r: 90, color: 'rgba(255, 210, 140, 0.45)' },
  // 飯店一樓拱廊、門口的暖光
  ...[3, 6.5, 10, 13.5].map((x) => ({ x: x * T, y: LV.northLine * T - 12, r: 34, color: 'rgba(255, 200, 120, 0.4)' })),
  ...[30.5, 34, 37.5, 41].map((x) => ({ x: x * T, y: LV.venice.line * T - 14, r: 40, color: 'rgba(255, 205, 130, 0.45)' })),
  // 大道上的車燈、霓虹映在路面
  ...[4, 12, 20, 28, 36, 44, 52].map((x, k) => ({ x: x * T, y: (k % 2 ? 22.4 : 25.4) * T, r: 70, color: k % 3 === 0 ? 'rgba(255, 90, 190, 0.2)' : k % 3 === 1 ? 'rgba(90, 210, 255, 0.2)' : 'rgba(255, 210, 90, 0.2)' })),
  { x: 14 * T, y: 24 * T, r: 120, color: 'rgba(255, 120, 200, 0.18)' },
  { x: 44 * T, y: 24 * T, r: 120, color: 'rgba(120, 200, 255, 0.18)' },
  ...Object.values(FX),
  ...JET_LIGHTS,
];

const stationX = (LV.station.x0 + LV.station.x1) / 2 - 0.6;

export const LASVEGAS: CityDef = {
  id: 'lasvegas',
  country: 'us',
  line: 'flight',
  W: LV.W,
  H: LV.H,
  title: { 'zh-TW': '拉斯維加斯 · 大道', 'en-US': 'Las Vegas · The Strip' },
  stop: { 'zh-TW': '拉斯維加斯（哈利·瑞德機場）', 'en-US': 'Las Vegas (Harry Reid Airport)' },
  emoji: '🎰',
  station: {
    x: stationX,
    y: LV.station.line + 0.7,
    name: { 'zh-TW': 'Monorail 往機場', 'en-US': 'Monorail to Airport' },
    arrive: { x: stationX - 3, y: LV.station.line + 1 },
  },
  background: '#e6dcc8',
  soundscape: 'city',
  paintGround: paintLasVegasGround,
  props,
  solid,
  seats: LASVEGAS_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: LASVEGAS_SHOPS,
  fortune: {
    at: r(LV.slot.x - 1.4, LV.slot.y, LV.slot.x + 1.4, LV.slot.y + 1.3),
    label: { x: LV.slot.x, y: LV.slot.y - 3.6 },
    title: { 'zh-TW': '拉霸機', 'en-US': 'Slot Machine' },
    hint: { 'zh-TW': '不用錢的拉霸機：拉一下，看看今天的專注運勢。', 'en-US': 'A free slot machine — pull the lever and see how your focus will go today.' },
    draw: { 'zh-TW': '拉一下', 'en-US': 'Pull' },
    again: { 'zh-TW': '再拉一次', 'en-US': 'Pull again' },
    fortunes: [
      { rank: { 'zh-TW': '7️⃣7️⃣7️⃣ 頭獎！', 'en-US': '7️⃣7️⃣7️⃣ Jackpot!' }, text: { 'zh-TW': '今天專注一定很順，番茄鐘一顆接一顆！', 'en-US': 'Focus will flow today — one pomodoro after another!' } },
      { rank: { 'zh-TW': '💎💎💎 大獎', 'en-US': '💎💎💎 Big win' }, text: { 'zh-TW': '專注的時間就是你的籌碼，今天多存一點。', 'en-US': 'Focused minutes are your chips — stack a few more today.' } },
      { rank: { 'zh-TW': '🔔🔔🔔 中獎', 'en-US': '🔔🔔🔔 Winner' }, text: { 'zh-TW': '鈴聲響了：先把通知關掉，專心 25 分鐘。', 'en-US': 'The bell rings: silence notifications and focus for 25 minutes.' } },
      { rank: { 'zh-TW': '🍒🍒🍒 小獎', 'en-US': '🍒🍒🍒 Small win' }, text: { 'zh-TW': '休息 5 分鐘：喝口水、伸個懶腰，看一場噴泉秀。', 'en-US': 'Take a 5-minute break: drink some water, stretch, watch a fountain show.' } },
      { rank: { 'zh-TW': '🍋🍋🍋 酸酸的', 'en-US': '🍋🍋🍋 A bit sour' }, text: { 'zh-TW': '開頭有點難沒關係，先做最小的那一件事。', 'en-US': 'A slow start is fine — begin with the smallest task.' } },
      { rank: { 'zh-TW': '🍒🍋🔔 差一點', 'en-US': '🍒🍋🔔 So close' }, text: { 'zh-TW': '再拉一次之前，先完成一個小目標吧！', 'en-US': 'Before you pull again, finish one small goal!' } },
    ],
  },
  infos: [
    { at: r(0, 21.4, LV.W, 26.6), title: { 'zh-TW': '大道 The Strip', 'en-US': 'The Strip' }, text: { 'zh-TW': '拉斯維加斯大道南段約 6.8 公里，兩旁是一間間主題飯店和賭場，晚上霓虹全亮、車水馬龍。大道其實大多在市界外的 Paradise 和 Winchester。單軌電車 2004 年通車，沿大道東側約 6 公里、7 個站；它其實沒有開到機場（機場在大道南端旁邊，多半搭計程車），這裡的「往機場」是地圖上的簡化。', 'en-US': 'About 6.8 km of Las Vegas Boulevard lined with themed hotels and casinos, ablaze with neon at night — mostly outside city limits, in Paradise and Winchester. The Monorail (2004) runs about 6 km with 7 stations along the east side; it doesn’t actually reach the airport (just south of the Strip, usually a taxi ride) — “to Airport” is a simplification on this map.' } },
    { at: r(LV.lake.x0, LV.lake.y0, LV.lake.x1, LV.H), title: { 'zh-TW': '噴泉湖 · 噴泉秀', 'en-US': 'Fountain Lake' }, text: { 'zh-TW': '大道中段一家飯店前的人工湖（約 3.2 公頃），1998 年開始表演：上千個噴嘴配合音樂噴水，最高超過 140 公尺，下午每 30 分鐘、晚上每 15 分鐘一場，免費。這裡大約每 40 秒一場，坐長椅就看得到。', 'en-US': 'An 8-acre man-made lake in front of a mid-Strip hotel. Since 1998 over a thousand nozzles dance to music, shooting water up to 140 m — free shows every 30 minutes in the afternoon and every 15 at night. Here a show starts about every 40 seconds.' } },
    { at: r(LV.paris.x0, 7, LV.paris.x1, LV.northLine), title: { 'zh-TW': '巴黎鐵塔複製品', 'en-US': 'Eiffel Tower Replica' }, text: { 'zh-TW': '1999 年蓋的半比例巴黎鐵塔（約 165 公尺），塔腳穿進後面的法式飯店裡，上面有觀景台。它就在噴泉湖對面，從觀景台可以俯看噴泉秀。', 'en-US': 'A half-scale Eiffel Tower (about 165 m) built in 1999, its legs running right into the French-style hotel behind it. It stands across from the fountain lake — the observation deck looks down on the shows.' } },
    { at: r(LV.pyramid.x0, 9, LV.pyramid.x1, LV.northLine), title: { 'zh-TW': '金字塔飯店與光束', 'en-US': 'Pyramid Hotel & Sky Beam' }, text: { 'zh-TW': '1993 年開幕的 30 層黑色玻璃金字塔，電梯沿著斜邊斜斜地爬。晚上頂端射出號稱世界最亮的光束，天氣好時從很遠的飛機上都看得到。', 'en-US': 'A 30-storey black-glass pyramid opened in 1993, with “inclinator” elevators riding up its slanted corners. At night its tip fires what’s billed as the world’s brightest beam of light, visible from aircraft far away.' } },
    { at: r(LV.canal.x0, 6, LV.canal.x1, LV.canal.y1), title: { 'zh-TW': '威尼斯運河與貢多拉', 'en-US': 'Venetian Canal & Gondolas' }, text: { 'zh-TW': '仿照威尼斯的飯店（1999 年），外面有聖馬可鐘樓和總督宮的複製品，運河上的船夫划著貢多拉、還會唱歌。', 'en-US': 'A Venice-themed resort (1999) with replicas of St Mark’s Campanile and the Doge’s Palace; gondoliers pole along the canal — and sing.' } },
    { at: r(LV.strat.x - 1.2, 0.5, LV.strat.x + 1.2, LV.strat.y), title: { 'zh-TW': '觀景高塔', 'en-US': 'Observation Tower' }, text: { 'zh-TW': '大道北端 350 公尺高的觀景塔（1996 年），是美國最高的獨立觀景塔，塔頂還有懸在半空的刺激遊樂設施。實際上離這裡好幾公里遠，地圖把它拉近畫在遠方。', 'en-US': 'The 350 m observation tower at the north end of the Strip (1996), the tallest freestanding observation tower in the US, with thrill rides hanging off the top. It’s actually several km away — the map pulls it into the background.' } },
    { at: r(LV.sign.x - 3.5, LV.sign.y - 7, LV.sign.x + 3.5, LV.sign.y), title: { 'zh-TW': '歡迎招牌', 'en-US': '“Welcome to Fabulous Las Vegas” Sign' }, text: { 'zh-TW': '1959 年由 Betty Willis 設計，WELCOME 每個字母放在一枚銀幣上，頂上是紅色的星星。她沒申請版權，說是送給城市的禮物；2009 年列入美國國家史蹟名錄。實際上在大道最南端的分隔島上，這裡畫在大道旁邊的廣場。', 'en-US': 'Designed by Betty Willis in 1959: each letter of WELCOME sits on a silver dollar, topped by a red star. She never copyrighted it, calling it a gift to the city; it joined the National Register of Historic Places in 2009. In reality it stands on the median at the Strip’s south end — here it sits on a plaza beside the road.' } },
  ],
  labels: [
    { x: 29.1, y: 33.2, text: { 'zh-TW': '⛲ 噴泉湖畔（長椅坐下看噴泉秀）', 'en-US': '⛲ Fountain Lake (sit and watch the show)' }, color: '#bae6fd' },
    { x: SIGN_BENCH.x, y: SIGN_BENCH.y + 1.8, text: { 'zh-TW': '🌟 歡迎招牌', 'en-US': '🌟 Welcome Sign' }, color: '#fde68a' },
    { x: LV.buffet.door, y: LV.H - 1.2, text: { 'zh-TW': '🍽️ 自助餐廳露台', 'en-US': '🍽️ Buffet Patio' }, color: '#fca5a5' },
  ],
  walkers: [
    { x0: 0.5, y0: 21, x1: 57.5, y1: 21, count: 5 },
    { x0: 0.5, y0: 27.8, x1: 57.5, y1: 27.8, count: 5 },
    { x0: 16, y0: 29.4, x1: 42.4, y1: 29.4, count: 3 },
    { x0: 10.4, y0: 29.4, x1: 10.4, y1: 43, count: 1 },
    { x0: 44.4, y0: 37.4, x1: 57, y1: 37.4, count: 2 },
    { x0: 43.6, y0: 29.4, x1: 43.6, y1: 43, count: 1 },
  ],
  traffic: [
    { y: 22.1, dir: -1, x0: 0, x1: LV.W, count: 3 },
    { y: 23.3, dir: -1, x0: 0, x1: LV.W, count: 3 },
    { y: 24.7, dir: 1, x0: 0, x1: LV.W, count: 3 },
    { y: 25.9, dir: 1, x0: 0, x1: LV.W, count: 2 },
  ],
  lights,
  nightTint: '#8a93c4',
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點噴泉湖邊、歡迎招牌的長椅或自助餐廳的桌子坐下專注 · 走到攤子買一碼冰沙、熱狗、自助餐、雞尾酒蝦 · 拉霸機拉一下 · 點地標看介紹 · Monorail 去洛杉磯、舊金山、紐約或飛回台灣',
    'en-US': 'WASD / arrows to move · click a lakeside or Welcome-sign bench, or a buffet table, to focus · walk up to the stands for yard slushies, hot dogs, the buffet and shrimp cocktail · pull the slot machine · click landmarks for info · Monorail to LA, San Francisco, New York or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或桌子坐下專注 · 走到攤子買東西 · 拉霸機 · 點地標看介紹 · Monorail',
    'en-US': 'Tap a bench or table to focus · visit the stands · slot machine · tap landmarks · Monorail',
  },
};
