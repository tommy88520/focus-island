// 上海的美術：浦東天際線（東方明珠的粉紅球、金茂大廈的塔、環球金融中心的開瓶器、上海中心大廈的扭轉造型；晚上燈光秀）、
// 黃浦江（觀光船、砂石貨船來回）、外灘（防汛牆、江邊步道、歐式路燈、長椅）、萬國建築博覽群（匯豐銀行的圓頂、海關大樓的鐘樓、
// 和平飯店的綠色金字塔屋頂；晚上金黃打燈）、地鐵站、豫園一帶（城隍廟、龍牆、荷花池、九曲橋、湖心亭茶樓、小吃街、紅燈籠）。
// 最後組成 CityScene 用的 SHANGHAI。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { BRIDGES, BUND, BUND_BENCHES, BUND_BENCH_Y, FOOD_SHOPS, SH, SHANGHAI_SEATS, SHANGHAI_SHOPS, STONE_TABLE, TEA_TABLES, TEA_TABLE_Y, type BundKind } from './shanghai';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, drawStreetTree } from './cityArt';
import { drawWillow } from './kyotoArt';
import { getAvatarFrame, lookColors } from './pixelArt';

const W = SH.W * T;
const BANK = Math.round(SH.bank * T);
const inside = (x: number, y: number, r: Rect) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;

// ── 地面（畫一次）──
export function paintShanghaiGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1843);
  // 天空（上面還會蓋天際線，這裡只是底色）
  px(c, '#cfe3ee', 0, 0, W, BANK);
  // 黃浦江：偏黃綠的江水
  const ry0 = SH.river.y0 * T;
  const ry1 = SH.river.y1 * T;
  px(c, '#7d8f86', 0, BANK, W, ry0 - BANK);
  const water = c.createLinearGradient(0, ry0, 0, ry1);
  water.addColorStop(0, '#6f8f8e');
  water.addColorStop(1, '#55767a');
  c.fillStyle = water;
  c.fillRect(0, ry0, W, ry1 - ry0);
  for (let i = 0; i < 120; i += 1) px(c, rand() < 0.6 ? 'rgba(255,255,255,0.16)' : 'rgba(40,60,60,0.25)', Math.floor(rand() * W), Math.floor(ry0 + 3 + rand() * (ry1 - ry0 - 6)), 5 + Math.floor(rand() * 9), 1);
  // 外灘防汛牆：花崗岩的牆＋上面的欄杆
  px(c, '#8f8a80', 0, ry1, W, 4);
  px(c, '#b8b2a6', 0, ry1 + 4, W, SH.wall * T - ry1 - 4);
  px(c, '#a39d90', 0, SH.wall * T - 1, W, 1);
  // 江邊步道：淺色的花崗岩地磚（斜鋪）
  tiles(c, { x0: 0, y0: SH.wall, x1: SH.W, y1: SH.road.y0 - 0.25 }, '#dcd6ca', '#cbc4b6', 16);
  for (let x = 0; x < W; x += 32) px(c, 'rgba(255,255,255,0.18)', x + 4, SH.wall * T + 4, 24, 1);
  px(c, '#a8a296', 0, (SH.road.y0 - 0.25) * T, W, 4);
  // 中山東一路
  road(c, { x0: 0, y0: SH.road.y0, x1: SH.W, y1: SH.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((SH.road.y0 + SH.road.y1) / 2) * T), 12, 1);
  for (const [x0, x1] of SH.gaps) zebra(c, x0 + 0.3, SH.road.y0, x1 - 0.3, SH.road.y1, false);
  zebra(c, 50.2, SH.road.y0, 53.4, SH.road.y1, false);
  // 萬國建築那排的底（被大樓蓋住，路口露出來的是人行道）、南邊的人行道、地鐵站廣場
  tiles(c, { x0: 0, y0: SH.road.y1, x1: SH.W, y1: SH.walk }, '#d2ccc0', '#c0b9ab', 12);
  px(c, '#b0a99b', 0, SH.road.y1 * T, W, 2);
  // 豫園一帶：青石板
  tiles(c, { x0: 0, y0: SH.walk, x1: SH.W, y1: SH.H }, '#bdb7aa', '#aaa496', 12);
  for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)', Math.floor(rand() * W), Math.floor(SH.walk * T + rand() * (SH.H - SH.walk) * T), 6, 5);
  // 城隍廟前的廣場：深一點的方磚
  tiles(c, { x0: 2.5, y0: SH.yuLine, x1: 15.5, y1: 42.5 }, '#b3ab9b', '#9f978a', 16);
  // 荷花池
  const L = SH.lake;
  px(c, '#8a857a', L.x0 * T - 3, L.y0 * T - 3, (L.x1 - L.x0) * T + 6, (L.y1 - L.y0) * T + 6);
  const pond = c.createLinearGradient(0, L.y0 * T, 0, L.y1 * T);
  pond.addColorStop(0, '#5f8f80');
  pond.addColorStop(1, '#4a7a6c');
  c.fillStyle = pond;
  c.fillRect(L.x0 * T, L.y0 * T, (L.x1 - L.x0) * T, (L.y1 - L.y0) * T);
  px(c, 'rgba(0,0,0,0.18)', L.x0 * T, L.y0 * T, (L.x1 - L.x0) * T, 3);
  for (let i = 0; i < 70; i += 1) px(c, 'rgba(255,255,255,0.14)', Math.floor(L.x0 * T + rand() * (L.x1 - L.x0) * T), Math.floor(L.y0 * T + 4 + rand() * (L.y1 - L.y0 - 0.4) * T), 4 + Math.floor(rand() * 6), 1);
  // 荷葉、荷花（避開橋和湖心亭）
  for (let i = 0; i < 70; i += 1) {
    const x = L.x0 + 0.3 + rand() * (L.x1 - L.x0 - 0.6);
    const y = L.y0 + 0.4 + rand() * (L.y1 - L.y0 - 0.6);
    const near = (r: Rect) => x > r.x0 - 0.5 && x < r.x1 + 0.5 && y > r.y0 - 0.5 && y < r.y1 + 0.5;
    if (near(SH.island) || BRIDGES.some(near)) continue;
    c.fillStyle = rand() < 0.5 ? '#5f9a4a' : '#4f8a3e';
    c.beginPath();
    c.ellipse(x * T, y * T, 4 + rand() * 2, 3, 0, 0, Math.PI * 2);
    c.fill();
    px(c, 'rgba(30,60,30,0.5)', Math.round(x * T), Math.round(y * T - 2), 1, 3);
    if (rand() < 0.3) {
      px(c, '#f0a0c0', Math.round(x * T + 2), Math.round(y * T - 5), 3, 3);
      px(c, '#fbe0ea', Math.round(x * T + 3), Math.round(y * T - 5), 1, 1);
    }
  }
  // 湖心亭的島（石頭台基）
  const I = SH.island;
  px(c, '#7f7a70', I.x0 * T - 2, I.y0 * T, (I.x1 - I.x0) * T + 4, (I.y1 - I.y0) * T + 3);
  tiles(c, I, '#cfc7b6', '#bcb4a2', 8);
  px(c, 'rgba(0,0,0,0.12)', I.x0 * T, I.y1 * T - 2, (I.x1 - I.x0) * T, 2);
  // 九曲橋：先畫外框（石欄杆），再填橋面，接起來的地方就不會有線
  for (const b of BRIDGES) px(c, '#8a8476', b.x0 * T - 1, b.y0 * T - 1, (b.x1 - b.x0) * T + 2, (b.y1 - b.y0) * T + 4);
  for (const b of BRIDGES) px(c, '#e6e0d2', b.x0 * T, b.y0 * T, (b.x1 - b.x0) * T, (b.y1 - b.y0) * T);
  for (const b of BRIDGES) for (let x = b.x0 * T; x < b.x1 * T; x += 6) px(c, 'rgba(0,0,0,0.06)', Math.round(x), b.y0 * T, 1, (b.y1 - b.y0) * T);
  for (const b of BRIDGES) px(c, 'rgba(0,0,0,0.25)', b.x0 * T - 1, b.y1 * T + 1, (b.x1 - b.x0) * T + 2, 2);
}

// ── 浦東天際線 ──
interface Tower {
  x: number;
  w: number;
  h: number;
  col: string;
  top: number;
  near: boolean;
  led: boolean;
  seed: number;
}
const PEARL = 14 * T;
const JINMAO = 29.4 * T;
const SWFC = 33.8 * T;
const STOWER = 38.4 * T;
const TOWERS: Tower[] = (() => {
  const rand = seeded(1990);
  const list: Tower[] = [];
  const far = ['#a9b8c4', '#b4c0c8', '#9fb0bc', '#bcc4c6'];
  const near = ['#8a98a6', '#9aa6ae', '#7f93a0', '#a6a29a', '#8fa3a8', '#b2aea4'];
  for (let x = -8; x < W; x += 9 + rand() * 14) list.push({ x, w: 12 + rand() * 12, h: 26 + rand() * 40, col: far[Math.floor(rand() * far.length)] ?? '#a9b8c4', top: Math.floor(rand() * 4), near: false, led: false, seed: Math.floor(rand() * 9999) });
  for (let x = 0; x < W; x += 16 + rand() * 22) {
    const busy = Math.abs(x - (JINMAO + STOWER) / 2) < 120;
    list.push({ x, w: 14 + rand() * 16, h: 22 + rand() * (busy ? 46 : 58), col: near[Math.floor(rand() * near.length)] ?? '#8a98a6', top: Math.floor(rand() * 4), near: true, led: rand() < 0.28, seed: Math.floor(rand() * 9999) });
  }
  return list;
})();

// 天空：白天藍天，晚上深藍紫（城市的光把地平線照亮）
function paintSky(c: CanvasRenderingContext2D, night: boolean): void {
  const g = c.createLinearGradient(0, 0, 0, BANK);
  if (night) {
    g.addColorStop(0, '#0c1030');
    g.addColorStop(0.6, '#26224e');
    g.addColorStop(1, '#4a3462');
  } else {
    g.addColorStop(0, '#7fb6e0');
    g.addColorStop(0.7, '#c6dfec');
    g.addColorStop(1, '#e2ebec');
  }
  c.fillStyle = g;
  c.fillRect(0, 0, W, BANK);
  const rand = seeded(night ? 88 : 77);
  if (night) {
    for (let i = 0; i < 50; i += 1) px(c, `rgba(255,255,255,${0.3 + rand() * 0.5})`, Math.floor(rand() * W), Math.floor(rand() * 70), 1, 1);
  } else {
    // 幾朵雲
    for (let i = 0; i < 7; i += 1) {
      const cx = rand() * W;
      const cy = 14 + rand() * 50;
      c.fillStyle = 'rgba(255,255,255,0.75)';
      for (let k = 0; k < 4; k += 1) {
        c.beginPath();
        c.ellipse(cx + k * 9 - 14, cy - (k % 2) * 3, 10, 5, 0, 0, Math.PI * 2);
        c.fill();
      }
    }
  }
}

function skyAt(y: number, night: boolean): string {
  const k = Math.max(0, Math.min(1, y / BANK));
  if (night) return k < 0.6 ? '#1c1a42' : '#3a2c58';
  return k < 0.7 ? '#a9cde6' : '#d8e6ec';
}

function paintTower(c: CanvasRenderingContext2D, t: Tower, night: boolean): void {
  const x = Math.round(t.x);
  const w = Math.round(t.w);
  const top = BANK - 6 - Math.round(t.h);
  const rand = seeded(t.seed);
  const body = night ? (t.near ? '#232a3c' : '#2a3048') : t.col;
  px(c, body, x, top, w, BANK - top);
  px(c, night ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.22)', x, top, 2, BANK - top);
  px(c, 'rgba(0,0,0,0.14)', x + w - 3, top, 3, BANK - top);
  // 屋頂：平頂、天線、斜頂、圓頂
  if (t.top === 1) px(c, night ? '#3a4058' : '#6a7480', x + Math.floor(w / 2), top - 8, 1, 8);
  if (t.top === 2) {
    c.fillStyle = body;
    c.beginPath();
    c.moveTo(x, top);
    c.lineTo(x + w, top - 6);
    c.lineTo(x + w, top);
    c.fill();
  }
  if (t.top === 3) {
    c.fillStyle = body;
    c.beginPath();
    c.ellipse(x + w / 2, top, w / 2, 5, 0, Math.PI, 0);
    c.fill();
  }
  // 窗戶：白天玻璃的橫條，晚上一格格亮
  for (let y = top + 3; y < BANK - 4; y += 4) {
    if (night) {
      for (let wx = x + 2; wx < x + w - 2; wx += 3) if (rand() < 0.45) px(c, rand() < 0.75 ? '#ffe7a8' : '#cfe8ff', wx, y, 2, 2);
    } else {
      px(c, t.near ? 'rgba(40,60,80,0.22)' : 'rgba(60,80,100,0.15)', x + 1, y, w - 2, 1);
    }
  }
}

// 東方明珠的球（粉紅色玻璃）
function sphere(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, col: string, hi: string, shade: string): void {
  c.fillStyle = col;
  c.beginPath();
  c.arc(cx, cy, r, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = shade;
  c.beginPath();
  c.arc(cx, cy, r, -0.2, Math.PI * 0.75);
  c.arc(cx - r * 0.25, cy - r * 0.15, r * 0.85, Math.PI * 0.75, -0.2, true);
  c.fill();
  c.fillStyle = hi;
  c.beginPath();
  c.ellipse(cx - r * 0.38, cy - r * 0.4, r * 0.32, r * 0.2, -0.6, 0, Math.PI * 2);
  c.fill();
  px(c, 'rgba(0,0,0,0.25)', Math.round(cx - r), Math.round(cy), Math.round(r * 2), 1);
}

const PEARL_BALLS = { low: { y: 40, r: 14 }, up: { y: 84, r: 9 }, top: { y: 100, r: 4 }, small: [56, 62, 68, 74] } as const;
function paintPearl(c: CanvasRenderingContext2D, night: boolean): void {
  const cx = PEARL;
  const base = BANK - 4;
  const steel = night ? '#5a5470' : '#c9ccd4';
  const steelHi = night ? '#7a7090' : '#e8eaee';
  // 三根斜撐腳
  c.strokeStyle = steel;
  c.lineWidth = 3;
  for (const s of [-1, 1]) {
    c.beginPath();
    c.moveTo(cx + s * 18, base);
    c.lineTo(cx + s * 5, base - 28);
    c.stroke();
  }
  // 三根直柱（中間那根一路到上球）
  px(c, steel, cx - 7, base - PEARL_BALLS.up.y, 3, PEARL_BALLS.up.y - 2);
  px(c, steel, cx + 4, base - PEARL_BALLS.up.y, 3, PEARL_BALLS.up.y - 2);
  px(c, steelHi, cx - 2, base - PEARL_BALLS.top.y, 4, PEARL_BALLS.top.y);
  px(c, steel, cx + 1, base - PEARL_BALLS.top.y, 1, PEARL_BALLS.top.y);
  // 球
  const col = night ? '#7a2a66' : '#c8467e';
  const hi = night ? '#a8508a' : '#f0a0c4';
  const shade = night ? '#4a1a44' : '#8e2a5c';
  sphere(c, cx, base - PEARL_BALLS.low.y, PEARL_BALLS.low.r, col, hi, shade);
  PEARL_BALLS.small.forEach((y, k) => sphere(c, cx + (k % 2 ? 4 : -4), base - y, 3, col, hi, shade));
  sphere(c, cx, base - PEARL_BALLS.up.y, PEARL_BALLS.up.r, col, hi, shade);
  sphere(c, cx, base - PEARL_BALLS.top.y, PEARL_BALLS.top.r, col, hi, shade);
  // 天線（紅白相間）
  for (let y = base - 118; y < base - PEARL_BALLS.top.y - 3; y += 4) px(c, (y / 4) % 2 ? steelHi : night ? '#8a3a4a' : '#d8483a', cx - 1, y, 2, 4);
  // 底座的建築
  px(c, night ? '#2a2840' : '#d6d2c8', cx - 22, base - 6, 44, 6);
}

// 金茂大廈：像塔一樣一節一節往上收（越上面越短），頂上尖塔
function paintJinmao(c: CanvasRenderingContext2D, night: boolean): void {
  const cx = JINMAO;
  const base = BANK - 4;
  const body = night ? '#3a3a40' : '#7d8796';
  const ledge = night ? '#c99a4a' : '#b6c0cc';
  let y = base;
  let hw = 13;
  for (let k = 0; y > base - 80; k += 1) {
    const segH = Math.max(3, 15 - k * 1.3);
    const nhw = hw - 0.7;
    c.fillStyle = body;
    c.beginPath();
    c.moveTo(cx - hw, y);
    c.lineTo(cx - nhw, y - segH);
    c.lineTo(cx + nhw, y - segH);
    c.lineTo(cx + hw, y);
    c.fill();
    for (let wx = cx - hw + 3; wx < cx + hw - 2; wx += 3) px(c, night ? 'rgba(255,210,120,0.35)' : 'rgba(40,50,60,0.25)', Math.round(wx), Math.round(y - segH + 1), 1, Math.max(1, Math.round(segH - 2)));
    px(c, ledge, Math.round(cx - nhw - 1), Math.round(y - segH), Math.round(nhw * 2 + 2), 1);
    px(c, 'rgba(0,0,0,0.18)', Math.round(cx + hw * 0.4), Math.round(y - segH), Math.round(hw * 0.6), Math.round(segH));
    y -= segH;
    hw = nhw - 0.3;
  }
  // 冠頂：階梯狀的尖頂
  for (const [w, h] of [[16, 4], [12, 4], [9, 4], [6, 4], [4, 4]] as const) {
    px(c, body, Math.round(cx - w / 2), Math.round(y - h), w, h);
    px(c, ledge, Math.round(cx - w / 2), Math.round(y - h), w, 1);
    y -= h;
  }
  px(c, night ? '#e8c070' : '#c9ced6', Math.round(cx - 1), Math.round(y - 10), 2, 10);
}

// 環球金融中心：往上收的板狀大樓，頂端有梯形的開口（開瓶器）
const SWFC_H = 124;
function paintSwfc(c: CanvasRenderingContext2D, night: boolean): void {
  const cx = SWFC;
  const base = BANK - 4;
  const top = base - SWFC_H;
  c.fillStyle = night ? '#2c3448' : '#93afc4';
  c.beginPath();
  c.moveTo(cx - 14, base);
  c.lineTo(cx - 8, top);
  c.lineTo(cx + 8, top);
  c.lineTo(cx + 14, base);
  c.fill();
  // 右半邊陰影、玻璃的直線
  c.fillStyle = night ? 'rgba(0,0,0,0.25)' : 'rgba(40,70,100,0.22)';
  c.beginPath();
  c.moveTo(cx + 1, base);
  c.lineTo(cx + 1, top);
  c.lineTo(cx + 8, top);
  c.lineTo(cx + 14, base);
  c.fill();
  for (let k = -5; k <= 5; k += 2.5) {
    c.strokeStyle = night ? 'rgba(160,200,255,0.25)' : 'rgba(255,255,255,0.3)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx + k * 2.4, base);
    c.lineTo(cx + k * 1.4, top + 2);
    c.stroke();
  }
  // 開口（梯形，上寬下窄），露出後面的天空
  c.fillStyle = skyAt(top + 8, night);
  c.beginPath();
  c.moveTo(cx - 6, top + 4);
  c.lineTo(cx + 6, top + 4);
  c.lineTo(cx + 4, top + 16);
  c.lineTo(cx - 4, top + 16);
  c.fill();
}

// 上海中心大廈：往上收、扭轉的玻璃塔，頂端斜斜的；一圈圈的分區線、斜斜往上繞的凹槽
const ST_H = 158;
function stPath(c: CanvasRenderingContext2D): void {
  const cx = STOWER;
  const base = BANK - 4;
  c.beginPath();
  c.moveTo(cx - 17, base);
  c.quadraticCurveTo(cx - 16, base - 80, cx - 7, base - ST_H + 9);
  c.lineTo(cx + 7, base - ST_H);
  c.quadraticCurveTo(cx + 16, base - 70, cx + 17, base);
  c.closePath();
}
function paintShanghaiTower(c: CanvasRenderingContext2D, night: boolean): void {
  const cx = STOWER;
  const base = BANK - 4;
  c.save();
  stPath(c);
  c.fillStyle = night ? '#24304a' : '#88b0bc';
  c.fill();
  c.clip();
  // 扭轉的光影：左亮右暗
  const g = c.createLinearGradient(cx - 17, 0, cx + 17, 0);
  g.addColorStop(0, night ? 'rgba(120,160,220,0.15)' : 'rgba(255,255,255,0.35)');
  g.addColorStop(0.55, 'rgba(255,255,255,0)');
  g.addColorStop(1, 'rgba(20,50,70,0.3)');
  c.fillStyle = g;
  c.fillRect(cx - 18, base - ST_H, 36, ST_H);
  // 分區（9 區）
  for (let y = base - 16; y > base - ST_H; y -= 16) px(c, night ? 'rgba(160,220,255,0.35)' : 'rgba(255,255,255,0.45)', cx - 18, y, 36, 1);
  // 繞上去的凹槽
  c.strokeStyle = night ? 'rgba(160,220,255,0.3)' : 'rgba(40,80,100,0.35)';
  c.lineWidth = 1.5;
  c.beginPath();
  for (let y = base; y > base - ST_H; y -= 2) {
    const k = (base - y) / ST_H;
    const x = cx + 15 * (1 - k * 0.55) * Math.cos(k * Math.PI * 1.2 + 0.4);
    if (y === base) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.stroke();
  c.restore();
  // 頂上的冠（鏤空的骨架）
  for (let k = -5; k <= 5; k += 3) px(c, night ? '#5a6a8a' : '#b8ccd4', Math.round(cx + k), Math.round(base - ST_H + 3 - k * 0.6), 1, 5);
}

// 對岸的江邊：綠帶、矮房子
function paintPudongBank(c: CanvasRenderingContext2D, night: boolean): void {
  const rand = seeded(1994);
  px(c, night ? '#1e2a2a' : '#5f8a56', 0, BANK - 7, W, 7);
  for (let x = 0; x < W; x += 6 + rand() * 6) {
    c.fillStyle = night ? '#1a2626' : rand() < 0.5 ? '#4f7a48' : '#6a9a5a';
    c.beginPath();
    c.arc(x, BANK - 7, 3 + rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  px(c, night ? '#3a3a44' : '#a8a296', 0, BANK - 2, W, 2);
  if (night) for (let x = 4; x < W; x += 14) px(c, '#ffe0a0', x, BANK - 4, 1, 1);
}

function pudongSprite(night: boolean): HTMLCanvasElement {
  return cached(night ? 'sh-pudong-night' : 'sh-pudong-day', W, BANK, (c) => {
    paintSky(c, night);
    for (const t of TOWERS) if (!t.near) paintTower(c, t, night);
    // 遠處淡淡的霧
    if (!night) px(c, 'rgba(220,232,236,0.35)', 0, BANK - 70, W, 70);
    for (const t of TOWERS) if (t.near) paintTower(c, t, night);
    paintJinmao(c, night);
    paintSwfc(c, night);
    paintShanghaiTower(c, night);
    paintPearl(c, night);
    paintPudongBank(c, night);
  });
}

// 晚上的燈光秀：明珠的球換顏色、上海中心的光沿著凹槽往上爬、環球金融中心的開口亮藍光、幾棟樓的 LED 外牆跑彩色的波
function drawLightShow(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, pudongSprite(d.night), 0, BANK);
  if (!d.night) return;
  const s = d.seconds;
  const base = BANK - 4;
  // LED 外牆
  for (const t of TOWERS) {
    if (!t.led) continue;
    const x = Math.round(t.x);
    const w = Math.round(t.w);
    const top = BANK - 6 - Math.round(t.h);
    for (let y = top + 2; y < BANK - 8; y += 3) {
      const hue = (s * 50 + y * 4 + t.seed) % 360;
      const a = 0.55 + 0.35 * Math.sin(s * 2 + y * 0.2 + t.seed);
      c.fillStyle = `hsla(${hue}, 90%, 65%, ${a})`;
      c.fillRect(x + 2, y, w - 4, 2);
    }
  }
  // 金茂大廈：金色的光
  glow(c, JINMAO, base - 60, 26, '255, 200, 110', 0.35);
  px(c, '#ffd88a', Math.round(JINMAO - 1), base - 108, 2, 10);
  // 環球金融中心：邊線和開口
  const sTop = base - SWFC_H;
  const blink = 0.6 + 0.4 * Math.sin(s * 1.6);
  c.strokeStyle = `rgba(140, 200, 255, ${0.7 * blink})`;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(SWFC - 14, base);
  c.lineTo(SWFC - 8, sTop);
  c.lineTo(SWFC + 8, sTop);
  c.lineTo(SWFC + 14, base);
  c.stroke();
  c.strokeStyle = '#bfe4ff';
  c.beginPath();
  c.moveTo(SWFC - 6, sTop + 4);
  c.lineTo(SWFC + 6, sTop + 4);
  c.lineTo(SWFC + 4, sTop + 16);
  c.lineTo(SWFC - 4, sTop + 16);
  c.closePath();
  c.stroke();
  // 上海中心：顏色慢慢變，光點沿凹槽往上爬
  c.save();
  stPath(c);
  c.clip();
  const stHue = 180 + 40 * Math.sin(s * 0.3);
  c.fillStyle = `hsla(${stHue}, 80%, 55%, 0.22)`;
  c.fillRect(STOWER - 18, base - ST_H, 36, ST_H);
  for (let k = 0; k < 6; k += 1) {
    const p = (s * 0.08 + k / 6) % 1;
    const y = base - p * ST_H;
    const x = STOWER + 15 * (1 - p * 0.55) * Math.cos(p * Math.PI * 1.2 + 0.4);
    px(c, '#e8fbff', Math.round(x - 1), Math.round(y - 1), 3, 3);
  }
  c.restore();
  // 東方明珠：球輪流換顏色（粉紅 → 紫 → 藍 → 金）
  const palette = [
    ['#ff4fae', '#ffc0e4', '#c02a7a'],
    ['#b05aff', '#e0c0ff', '#7a2ad0'],
    ['#4f9aff', '#c0e0ff', '#2a5ad0'],
    ['#ffb84f', '#fff0c0', '#d07a2a'],
  ] as const;
  const phase = Math.floor(s / 3) % palette.length;
  const [col, hi, shade] = palette[phase] ?? palette[0];
  const balls = [PEARL_BALLS.low, PEARL_BALLS.up, PEARL_BALLS.top];
  for (const b of balls) sphere(c, PEARL, base - b.y, b.r, col, hi, shade);
  PEARL_BALLS.small.forEach((y, k) => sphere(c, PEARL + (k % 2 ? 4 : -4), base - y, 3, col, hi, shade));
  // 跑馬燈：球上的一圈亮點
  for (const b of balls.slice(0, 2)) {
    for (let k = 0; k < 10; k += 1) {
      const a = s * 1.5 + (k / 10) * Math.PI * 2;
      px(c, '#ffffff', Math.round(PEARL + Math.cos(a) * b.r) - 1, Math.round(base - b.y + Math.sin(a) * 2), 2, 1);
    }
  }
  // 塔尖的紅燈閃
  if (Math.floor(s * 1.2) % 2 === 0) px(c, '#ff4a3a', PEARL - 1, base - 119, 3, 2);
  if (Math.floor(s * 1.2 + 1) % 2 === 0) px(c, '#ff4a3a', Math.round(STOWER + 6), base - ST_H - 1, 2, 2);
}

// ── 黃浦江：水面的波光、晚上的倒影、觀光船和貨船 ──
const REFLECT: [number, string][] = [
  [PEARL, '255, 110, 190'],
  [JINMAO, '255, 200, 110'],
  [SWFC, '150, 200, 255'],
  [STOWER, '120, 230, 240'],
  [7 * T, '255, 220, 150'],
  [22 * T, '255, 220, 150'],
  [46 * T, '255, 210, 160'],
  [52 * T, '200, 160, 255'],
];
function drawRiver(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const y0 = SH.river.y0 * T;
  const y1 = SH.river.y1 * T;
  const s = d.seconds;
  c.save();
  c.beginPath();
  c.rect(0, y0 - 50, W, y1 - y0 + 50);
  c.clip();
  // 波光（會漂）
  for (let i = 0; i < 46; i += 1) {
    const y = y0 + 4 + (((i * 41) % 97) / 97) * (y1 - y0 - 8);
    const x = ((i * 157 + s * (5 + (i % 3) * 2)) % (W + 30)) - 15;
    px(c, `rgba(235,245,240,${0.18 + 0.15 * Math.sin(s * 1.3 + i)})`, Math.round(x), Math.round(y), 5 + (i % 3) * 3, 1);
  }
  // 晚上：天際線的彩色倒影（一條條會晃）
  if (d.night) {
    for (const [x, rgb] of REFLECT) {
      for (let y = y0 + 2; y < y1 - 4; y += 3) {
        const k = (y - y0) / (y1 - y0);
        const wob = Math.sin(s * 2 + y * 0.3 + x) * (2 + k * 4);
        px(c, `rgba(${rgb}, ${0.55 * (1 - k)})`, Math.round(x + wob - 4), y, 8 - Math.round(k * 4), 1);
      }
    }
  }
  drawShips(c, d);
  c.restore();
}

function drawShips(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const s = d.seconds;
  const span = W + 260;
  // 觀光船（往西，兩層、晚上一圈彩燈）
  const tx = W + 130 - ((s * 11) % span);
  const ty = 12.9 * T;
  px(c, 'rgba(0,0,0,0.25)', tx - 52, ty + 1, 104, 3);
  px(c, '#f4f1e8', tx - 52, ty - 10, 104, 11);
  px(c, '#c8282a', tx - 52, ty - 3, 104, 2);
  px(c, '#f4f1e8', tx - 40, ty - 20, 76, 10);
  px(c, '#e8e4d8', tx - 28, ty - 27, 48, 7);
  for (let k = -36; k < 32; k += 7) px(c, d.night ? '#ffe9a8' : '#3a4a5a', tx + k, ty - 17, 5, 4);
  for (let k = -48; k < 48; k += 7) px(c, d.night ? '#ffe9a8' : '#3a4a5a', tx + k, ty - 8, 5, 3);
  px(c, '#c8282a', tx - 30, ty - 29, 52, 2);
  if (d.night) {
    for (let k = -52; k < 52; k += 4) {
      const col = ['#ff5a8a', '#ffd23f', '#5ad6ff', '#7aee6a'][(Math.floor(k / 4) + Math.floor(s * 4)) & 3] ?? '#fff';
      px(c, col, tx + k, ty - 11, 2, 1);
      if (k > -40 && k < 36) px(c, col, tx + k, ty - 21, 2, 1);
    }
  }
  // 砂石貨船（往東，又長又低，後面有駕駛艙）
  const bx = ((s * 6) % span) - 130;
  const by = 15.3 * T;
  px(c, 'rgba(0,0,0,0.25)', bx - 64, by + 1, 128, 3);
  px(c, '#3a2a24', bx - 64, by - 7, 128, 8);
  px(c, '#8a3a2a', bx - 64, by - 7, 128, 2);
  c.fillStyle = '#b89a6a';
  c.beginPath();
  c.moveTo(bx - 52, by - 7);
  c.quadraticCurveTo(bx - 20, by - 18, bx + 30, by - 7);
  c.fill();
  px(c, '#e8e4d8', bx - 64, by - 17, 14, 10);
  px(c, d.night ? '#ffe0a0' : '#3a4a5a', bx - 62, by - 14, 10, 3);
  px(c, '#3a3d45', bx - 58, by - 22, 2, 5);
  if (d.night) px(c, '#7aee6a', bx + 63, by - 9, 2, 2);
  // 小渡輪（往東，慢一點、晚一點出發）
  const fx = ((s * 9 + 600) % span) - 130;
  const fy = 11.6 * T;
  px(c, '#2a5a7a', fx - 24, fy - 6, 48, 6);
  px(c, '#f4f1e8', fx - 16, fy - 13, 32, 7);
  for (let k = -12; k < 14; k += 6) px(c, d.night ? '#ffe9a8' : '#3a4a5a', fx + k, fy - 11, 4, 3);
}

// ── 外灘：欄杆、歐式路燈、長椅 ──
function drawBundRailing(c: CanvasRenderingContext2D): void {
  const y = SH.wall * T;
  px(c, '#6a6458', 0, y - 9, W, 2);
  px(c, '#8a8478', 0, y - 7, W, 1);
  for (let x = 2; x < W; x += 6) px(c, '#6a6458', x, y - 7, 1, 6);
  for (let x = 0; x < W; x += 48) px(c, '#5a5448', x, y - 11, 3, 11);
}

function drawBundLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 4, by - 1, 9, 2);
  px(c, '#24302c', cx - 3, by - 6, 7, 6);
  px(c, '#2c3a34', cx, by - 34, 2, 30);
  px(c, '#24302c', cx - 8, by - 32, 18, 2);
  for (const dx of [-8, 0, 8]) {
    px(c, night ? '#fff4c8' : '#eeeae0', cx + dx - 2, by - (dx === 0 ? 41 : 38), 6, 6);
    px(c, '#24302c', cx + dx - 1, by - (dx === 0 ? 42 : 39), 4, 1);
  }
}

const BENCH_HALF = 21;
// 長椅（從後面看：人背對畫面看浦東）：座板畫在人後面、椅背畫在人前面
function drawBundBenchSeat(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(BUND_BENCH_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - BENCH_HALF, by + 1, BENCH_HALF * 2, 3);
  px(c, '#8a5a32', cx - BENCH_HALF, by - 9, BENCH_HALF * 2, 4);
  px(c, '#b5804a', cx - BENCH_HALF, by - 9, BENCH_HALF * 2, 1);
}
function drawBundBenchBack(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(BUND_BENCH_Y * T);
  px(c, '#2c3a34', cx - BENCH_HALF + 1, by - 9, 2, 11);
  px(c, '#2c3a34', cx + BENCH_HALF - 3, by - 9, 2, 11);
  px(c, '#8a5a32', cx - BENCH_HALF, by - 6, BENCH_HALF * 2, 3);
  px(c, '#a8703f', cx - BENCH_HALF, by - 6, BENCH_HALF * 2, 1);
  px(c, '#8a5a32', cx - BENCH_HALF, by - 2, BENCH_HALF * 2, 3);
  px(c, '#a8703f', cx - BENCH_HALF, by - 2, BENCH_HALF * 2, 1);
}

// ── 萬國建築博覽群（白天花崗岩色，晚上金黃打燈）──
function stone(night: boolean): { wall: string; shade: string; line: string; win: string; trim: string } {
  return night
    ? { wall: '#f2c878', shade: '#d6a456', line: '#b88a44', win: '#fff0c0', trim: '#ffe6a8' }
    : { wall: '#d9ccb0', shade: '#c2b396', line: '#a89a7c', win: '#4a5664', trim: '#ece4d2' };
}

function facade(c: CanvasRenderingContext2D, w: number, h: number, top: number, night: boolean, rand: () => number, arches = true): void {
  const s = stone(night);
  px(c, s.wall, 0, top, w, h - top);
  px(c, 'rgba(0,0,0,0.12)', w - 3, top, 3, h - top);
  // 簷口（厚厚的一條＋齒飾）
  px(c, s.trim, -1, top, w + 2, 3);
  px(c, s.line, -1, top + 3, w + 2, 1);
  for (let x = 1; x < w; x += 3) px(c, s.shade, x, top + 4, 1, 2);
  // 一樓：粗石牆、拱門
  const base = h - 20;
  px(c, s.shade, 0, base, w, 20);
  for (let y = base + 4; y < h; y += 4) px(c, s.line, 0, y, w, 1);
  if (arches) {
    for (let x = 6; x + 8 < w - 2; x += 13) {
      c.fillStyle = night ? '#ffe2a0' : '#3a3f48';
      c.beginPath();
      c.moveTo(x, h);
      c.lineTo(x, base + 8);
      c.arc(x + 4, base + 8, 4, Math.PI, 0);
      c.lineTo(x + 8, h);
      c.fill();
    }
  }
  // 樓上的窗
  for (let y = top + 9; y < base - 6; y += 11) {
    for (let x = 5; x + 4 < w - 4; x += 8) {
      px(c, s.trim, x - 1, y - 1, 6, 9);
      px(c, night && rand() < 0.8 ? s.win : night ? '#8a6a3a' : s.win, x, y, 4, 7);
    }
    px(c, s.line, 0, y + 9, w, 1);
  }
}

function bundSprite(b: (typeof BUND)[number], night: boolean): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const tall: Record<BundKind, number> = { plain: 0, hsbc: 34, customs: 46, peace: 38 };
  const fac = b.kind === 'plain' ? 70 + (b.seed % 3) * 4 : b.kind === 'peace' ? 80 : 72;
  const h = fac + tall[b.kind] + 6;
  return cached(`sh-bund-${b.seed}-${night ? 'n' : 'd'}`, w, h, (c) => {
    const rand = seeded(b.seed);
    const s = stone(night);
    const top = h - fac;
    if (b.kind === 'plain') {
      facade(c, w, h, top, night, rand);
      // 小山牆或屋頂上的小亭子
      if (b.seed % 2) {
        c.fillStyle = s.trim;
        c.beginPath();
        c.moveTo(w / 2 - 20, top);
        c.lineTo(w / 2, top - 9);
        c.lineTo(w / 2 + 20, top);
        c.fill();
        px(c, s.line, w / 2 - 20, top - 1, 40, 1);
      } else {
        px(c, s.shade, w / 2 - 9, top - 12, 18, 12);
        c.fillStyle = night ? '#c8a050' : '#8a948a';
        c.beginPath();
        c.ellipse(w / 2, top - 12, 10, 6, 0, Math.PI, 0);
        c.fill();
      }
      // 直的壁柱
      for (const x of [3, w - 6]) px(c, s.trim, x, top + 4, 3, fac - 24);
    } else if (b.kind === 'hsbc') {
      facade(c, w, h, top, night, rand);
      // 中間的柱廊＋山牆
      const cx = w / 2;
      px(c, s.trim, cx - 26, top + 8, 52, 2);
      for (let k = 0; k < 6; k += 1) px(c, s.trim, Math.round(cx - 24 + k * 9.4), top + 10, 4, fac - 32);
      px(c, 'rgba(0,0,0,0.18)', cx - 22, top + 10, 44, fac - 32);
      for (let k = 0; k < 6; k += 1) px(c, s.trim, Math.round(cx - 24 + k * 9.4), top + 10, 4, fac - 32);
      c.fillStyle = s.trim;
      c.beginPath();
      c.moveTo(cx - 28, top + 8);
      c.lineTo(cx, top - 2);
      c.lineTo(cx + 28, top + 8);
      c.fill();
      // 鼓座＋圓頂＋頂上的小亭
      px(c, s.shade, cx - 18, top - 12, 36, 12);
      for (let x = cx - 16; x < cx + 16; x += 5) px(c, night ? s.win : s.line, x, top - 9, 2, 6);
      px(c, s.trim, cx - 20, top - 13, 40, 2);
      c.fillStyle = night ? '#d8b060' : '#9aa49a';
      c.beginPath();
      c.ellipse(cx, top - 13, 18, 17, 0, Math.PI, 0);
      c.fill();
      c.fillStyle = night ? 'rgba(255,240,200,0.4)' : 'rgba(255,255,255,0.3)';
      c.beginPath();
      c.ellipse(cx - 7, top - 22, 5, 7, 0.3, 0, Math.PI * 2);
      c.fill();
      for (let k = -12; k <= 12; k += 6) px(c, 'rgba(0,0,0,0.12)', cx + k, top - 28 + Math.abs(k) * 0.6, 1, 14 - Math.abs(k) * 0.6);
      px(c, s.trim, cx - 3, top - 34, 6, 5);
      px(c, s.line, cx - 1, top - 38, 2, 4);
    } else if (b.kind === 'customs') {
      facade(c, w, h, top, night, rand);
      const cx = w / 2;
      // 正面的多立克柱廊
      for (let k = 0; k < 4; k += 1) px(c, s.trim, Math.round(cx - 16 + k * 10), top + 18, 4, fac - 38);
      px(c, s.trim, cx - 20, top + 15, 40, 3);
      // 鐘樓：方塔、四面鐘（鐘面另外畫指針）、上面一層層收、頂上旗桿
      const tt = top - 32;
      px(c, s.wall, cx - 14, tt, 28, 32);
      px(c, 'rgba(0,0,0,0.12)', cx + 11, tt, 3, 32);
      px(c, s.trim, cx - 15, tt, 30, 2);
      for (const x of [cx - 14, cx + 11]) px(c, s.trim, x, tt + 2, 3, 30);
      c.fillStyle = night ? '#fffbe8' : '#f4f1e8';
      c.beginPath();
      c.arc(cx, tt + 13, 8, 0, Math.PI * 2);
      c.fill();
      c.strokeStyle = '#2a2a2a';
      c.lineWidth = 1;
      c.stroke();
      px(c, s.shade, cx - 10, tt - 6, 20, 6);
      px(c, s.trim, cx - 11, tt - 7, 22, 1);
      px(c, s.shade, cx - 6, tt - 11, 12, 4);
      c.fillStyle = s.line;
      c.beginPath();
      c.moveTo(cx - 6, tt - 11);
      c.lineTo(cx, tt - 14);
      c.lineTo(cx + 6, tt - 11);
      c.fill();
      px(c, '#5a5448', cx, tt - 22, 1, 9);
      px(c, '#c8282a', cx + 1, tt - 22, 5, 3);
    } else {
      // 和平飯店：裝飾藝術風的直線條，轉角的塔頂是綠色的金字塔
      facade(c, w, h, top, night, rand, false);
      for (let x = 4; x < w - 4; x += 8) px(c, s.trim, x + 4, top + 6, 1, fac - 26);
      px(c, night ? '#ffe2a0' : '#3a3f48', w / 2 - 6, h - 14, 12, 14);
      const tx0 = w - 30;
      px(c, s.wall, tx0, top - 16, 28, 16);
      for (let x = tx0 + 3; x < tx0 + 26; x += 6) px(c, s.win, x, top - 13, 3, 9);
      px(c, s.trim, tx0 - 1, top - 17, 30, 2);
      c.fillStyle = night ? '#6ac8a8' : '#3f8f7a';
      c.beginPath();
      c.moveTo(tx0 - 1, top - 17);
      c.lineTo(tx0 + 14, top - 38);
      c.lineTo(tx0 + 29, top - 17);
      c.fill();
      c.fillStyle = 'rgba(0,0,0,0.18)';
      c.beginPath();
      c.moveTo(tx0 + 14, top - 38);
      c.lineTo(tx0 + 29, top - 17);
      c.lineTo(tx0 + 14, top - 17);
      c.fill();
      for (let k = 1; k < 4; k += 1) px(c, 'rgba(255,255,255,0.2)', tx0 + k * 4, top - 17 - k * 5, 30 - k * 8, 1);
    }
  });
}

// 海關大樓的鐘：照上海時間（UTC+8）走
function drawCustomsClock(c: CanvasRenderingContext2D, b: (typeof BUND)[number]): void {
  const cx = Math.round(((b.x0 + b.x1) / 2) * T);
  const cy = Math.round(SH.bundLine * T) - 72 - 32 + 13;
  const now = Date.now() / 1000 + 8 * 3600;
  const hr = ((now / 3600) % 12) / 12;
  const mn = ((now / 60) % 60) / 60;
  c.strokeStyle = '#1a1a1a';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.sin(hr * Math.PI * 2) * 4, cy - Math.cos(hr * Math.PI * 2) * 4);
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.sin(mn * Math.PI * 2) * 6, cy - Math.cos(mn * Math.PI * 2) * 6);
  c.stroke();
}

// ── 地鐵站（南京東路站的出入口：玻璃雨棚、往下的樓梯、2 號線的綠色站牌）──
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((SH.station.x1 - SH.station.x0) * T);
  const h = 54;
  return cached('sh-station', w, h, (c) => {
    px(c, '#9a948a', 0, h - 4, w, 4);
    // 玻璃雨棚
    px(c, '#3a3f48', 4, 14, w - 8, h - 18);
    px(c, '#9fc4d8', 6, 16, w - 12, h - 22);
    for (let x = 6; x < w - 6; x += 12) px(c, '#3a3f48', x, 16, 1, h - 22);
    px(c, 'rgba(255,255,255,0.35)', 8, 18, 10, 3);
    // 入口：往下的樓梯
    const cx = w / 2;
    px(c, '#2a2d34', cx - 18, h - 26, 36, 22);
    for (let y = h - 24; y < h - 4; y += 3) px(c, '#4a4e58', cx - 16, y, 32, 1);
    px(c, '#c9ccd2', cx - 18, h - 26, 2, 22);
    px(c, '#c9ccd2', cx + 16, h - 26, 2, 22);
    // 屋頂＋招牌
    px(c, '#5a606a', 0, 6, w, 9);
    px(c, '#2a2d34', 2, 7, w - 4, 7);
    text(c, '南京東路站  East Nanjing Rd.', cx + 6, 10.5, '#f4f6f8', `700 5px ${FONT_TC}`);
    // 2 號線的綠色圓牌
    c.fillStyle = '#7ac143';
    c.beginPath();
    c.arc(9, 10.5, 4, 0, Math.PI * 2);
    c.fill();
    text(c, '2', 9, 10.8, '#ffffff', `900 6px ${FONT_TC}`);
    // 旁邊的立牌
    px(c, '#3a3f48', w - 6, 0, 3, h - 4);
    px(c, '#c8282a', w - 12, 0, 14, 8);
    text(c, '地鐵', w - 5, 4.2, '#ffffff', `900 5px ${FONT_TC}`);
  });
}

// ── 豫園一帶的屋頂：黑瓦、飛簷（兩端高高翹起）──
const ROOF = '#34373e';
const ROOF_EDGE = '#8a8e96';
function chineseRoof(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, lift = 6, sweep = 7, color = ROOF): void {
  c.save();
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x - lift, y + h - sweep);
  c.quadraticCurveTo(x + w * 0.06, y + h + 1, x + w * 0.2, y + h);
  c.lineTo(x + w * 0.8, y + h);
  c.quadraticCurveTo(x + w * 0.94, y + h + 1, x + w + lift, y + h - sweep);
  c.lineTo(x + w * 0.86, y + 2);
  c.lineTo(x + w * 0.14, y + 2);
  c.closePath();
  c.fill();
  c.clip();
  for (let k = x - lift; k < x + w + lift; k += 3) px(c, 'rgba(255,255,255,0.08)', Math.round(k), y + 3, 1, h);
  c.restore();
  // 簷口的白邊、屋脊（兩端有翹起的脊獸）
  c.strokeStyle = ROOF_EDGE;
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x - lift, y + h - sweep);
  c.quadraticCurveTo(x + w * 0.06, y + h + 1, x + w * 0.2, y + h);
  c.lineTo(x + w * 0.8, y + h);
  c.quadraticCurveTo(x + w * 0.94, y + h + 1, x + w + lift, y + h - sweep);
  c.stroke();
  px(c, '#25272c', Math.round(x + w * 0.12), y, Math.round(w * 0.76), 3);
  for (const ex of [x + w * 0.12, x + w * 0.88 - 3]) {
    px(c, '#25272c', Math.round(ex), y - 3, 3, 3);
    px(c, '#25272c', Math.round(ex + (ex < x + w / 2 ? -2 : 3)), y - 5, 2, 3);
  }
}

// 紅燈籠（大一點的，有金色的頂和流蘇）
function redLantern(c: CanvasRenderingContext2D, x: number, y: number, night: boolean, s = 1): void {
  px(c, '#2a1a14', Math.round(x), Math.round(y - 3 * s), 1, Math.round(3 * s));
  c.fillStyle = night ? '#ff4a2a' : '#d8282a';
  c.beginPath();
  c.ellipse(x + 0.5, y + 5 * s, 5 * s, 5.5 * s, 0, 0, Math.PI * 2);
  c.fill();
  px(c, night ? '#ffd88a' : '#e8b830', Math.round(x - 3 * s), Math.round(y - 0.5), Math.round(7 * s), 2);
  px(c, night ? '#ffd88a' : '#e8b830', Math.round(x - 3 * s), Math.round(y + 10 * s - 1.5), Math.round(7 * s), 2);
  px(c, 'rgba(0,0,0,0.18)', Math.round(x - 4 * s), Math.round(y + 5 * s), Math.round(9 * s), 1);
  px(c, night ? '#ffd88a' : '#e8b830', Math.round(x), Math.round(y + 10 * s), 1, Math.round(4 * s));
}

// 城隍廟：重簷的大殿、紅柱、格子門、「城隍廟」匾額、一排紅燈籠
function templeSprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((SH.temple.x1 - SH.temple.x0) * T);
  const h = 66;
  return cached(`sh-temple-${night ? 'n' : 'd'}`, w, h, (c) => {
    px(c, '#a8a294', 2, h - 5, w - 4, 5);
    px(c, '#c4bead', 2, h - 5, w - 4, 1);
    px(c, '#9a9486', w / 2 - 24, h - 3, 48, 3);
    // 大殿
    px(c, '#8a2a20', 14, 32, w - 28, h - 37);
    for (let x = 16; x < w - 16; x += 26) {
      px(c, night ? '#7a3a22' : '#6a2a18', x + 5, 36, 16, h - 42);
      for (let gy = 38; gy < h - 8; gy += 4) for (let gx = x + 6; gx < x + 20; gx += 4) px(c, night ? '#ffcf7a' : '#c99a4a', gx, gy, 2, 2);
    }
    // 中間的大門（裡面暗暗的，有點金色）
    px(c, '#2a1510', w / 2 - 12, 38, 24, h - 43);
    px(c, night ? '#ffcf6a' : '#a8803a', w / 2 - 5, 44, 10, 10);
    px(c, '#c8302a', w / 2 - 14, 36, 2, h - 41);
    px(c, '#c8302a', w / 2 + 12, 36, 2, h - 41);
    for (let x = 14; x <= w - 18; x += 26) {
      px(c, '#c8302a', x, 32, 4, h - 37);
      px(c, 'rgba(255,255,255,0.2)', x, 32, 1, h - 37);
    }
    px(c, '#c8302a', w - 18, 32, 4, h - 37);
    // 下層屋簷
    chineseRoof(c, 6, 20, w - 12, 13, 8, 8);
    // 上層：紅牆＋匾額
    px(c, '#8a2a20', 46, 10, w - 92, 12);
    for (let x = 50; x < w - 50; x += 12) px(c, night ? '#ffcf7a' : '#c99a4a', x, 13, 6, 6);
    px(c, '#1a1a1a', w / 2 - 22, 11, 44, 11);
    px(c, '#e8b830', w / 2 - 22, 11, 44, 1);
    px(c, '#e8b830', w / 2 - 22, 21, 44, 1);
    text(c, '城隍廟', w / 2, 16.8, night ? '#ffe08a' : '#e8b830', `900 8px ${SERIF_TC}`);
    chineseRoof(c, 36, 0, w - 72, 11, 7, 7);
    // 屋簷下的紅燈籠
    for (let x = 22; x < w - 16; x += 26) redLantern(c, x, 35, night, 0.9);
  });
}

// 豫園的龍牆：白牆、黑瓦頂，牆頭是起伏的龍身（東邊有龍頭）、圓形的月洞門、漏窗，後面露出亭子的飛簷和樹
function gardenSprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((SH.garden.x1 - SH.garden.x0) * T);
  const h = 58;
  return cached(`sh-garden-${night ? 'n' : 'd'}`, w, h, (c) => {
    const rand = seeded(1559);
    const wallTop = h - 34;
    // 牆後的樹和亭子
    for (let i = 0; i < 26; i += 1) {
      c.fillStyle = rand() < 0.5 ? '#3d6a3c' : '#4f7f46';
      c.beginPath();
      c.arc(rand() * w, wallTop - 2 - rand() * 12, 6 + rand() * 6, 0, Math.PI * 2);
      c.fill();
    }
    for (const x of [44, 196, 300]) {
      px(c, '#8a2a20', x + 4, wallTop - 10, 2, 10);
      px(c, '#8a2a20', x + 30, wallTop - 10, 2, 10);
      chineseRoof(c, x, wallTop - 22, 36, 12, 6, 7);
    }
    // 白牆＋石頭牆腳
    px(c, '#ecebe4', 0, wallTop, w, h - wallTop);
    px(c, 'rgba(0,0,0,0.05)', 0, wallTop + 4, w, 1);
    px(c, '#8f8a80', 0, h - 5, w, 5);
    // 漏窗
    for (const x of [24, 84, 150, 236, 268, 330]) {
      px(c, '#5a5a5a', x, wallTop + 9, 14, 14);
      px(c, '#ecebe4', x + 2, wallTop + 11, 10, 10);
      for (let k = 0; k < 10; k += 3) {
        px(c, '#5a5a5a', x + 2 + k, wallTop + 11, 1, 10);
        px(c, '#5a5a5a', x + 2, wallTop + 11 + k, 10, 1);
      }
    }
    // 月洞門
    const mx = 120;
    c.fillStyle = '#8f8a80';
    c.beginPath();
    c.arc(mx, wallTop + 17, 15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3a4a38';
    c.beginPath();
    c.arc(mx, wallTop + 17, 13, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#5f8a4f';
    c.beginPath();
    c.arc(mx - 3, wallTop + 22, 7, 0, Math.PI * 2);
    c.fill();
    px(c, '#bdb7aa', mx - 13, h - 5, 26, 5);
    // 牆頂的黑瓦
    px(c, ROOF, -2, wallTop - 3, w + 4, 4);
    px(c, ROOF_EDGE, -2, wallTop + 1, w + 4, 1);
    px(c, '#1a1a1a', mx - 12, wallTop - 6, 24, 9);
    px(c, '#e8b830', mx - 12, wallTop - 6, 24, 1);
    text(c, '豫園', mx, wallTop - 1.4, '#e8b830', `900 6px ${SERIF_TC}`);
    // 龍身（起伏的灰色龍背、鱗片）＋東邊的龍頭
    const dx0 = 190;
    const dx1 = w - 30;
    const yAt = (x: number) => wallTop - 4 - Math.abs(Math.sin((x - dx0) * 0.045)) * 7;
    for (let x = dx0; x < dx1; x += 1) {
      const y = yAt(x);
      px(c, '#4a4e56', x, Math.round(y - 4), 1, Math.round(wallTop - y + 2));
      if (x % 4 === 0) px(c, '#7a808a', x, Math.round(y - 3), 2, 1);
      if (x % 6 === 0) px(c, '#3a3d44', x, Math.round(y - 6), 1, 2);
    }
    const hx = dx1;
    const hy = yAt(dx1) - 4;
    px(c, '#4a4e56', hx, hy - 4, 14, 9);
    px(c, '#4a4e56', hx + 12, hy - 1, 8, 5);
    px(c, '#c8302a', hx + 14, hy + 3, 6, 2);
    px(c, '#f4f1e8', hx + 6, hy - 2, 2, 2);
    px(c, '#3a3d44', hx + 2, hy - 9, 2, 5);
    px(c, '#3a3d44', hx + 6, hy - 8, 2, 4);
    px(c, '#7a808a', hx + 18, hy - 3, 6, 1);
    px(c, '#7a808a', hx + 18, hy + 6, 5, 1);
    // 牆前的紅燈籠
    for (let x = 14; x < w; x += 40) if (Math.abs(x - mx) > 20) redLantern(c, x, wallTop + 2, night, 0.8);
  });
}

// 湖心亭：兩層的茶樓，很多翹起的飛簷
function teahouseSprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((SH.tea.x1 - SH.tea.x0) * T);
  const h = 70;
  return cached(`sh-tea-${night ? 'n' : 'd'}`, w, h, (c) => {
    px(c, '#8a8476', 4, h - 4, w - 8, 4);
    // 一樓：木頭的牆、格子窗
    px(c, '#7a3020', 10, 40, w - 20, h - 44);
    for (let x = 14; x < w - 14; x += 14) {
      px(c, night ? '#ffdc94' : '#ead8b0', x, 44, 10, 14);
      for (let k = 0; k < 10; k += 3) px(c, '#7a3020', x + k, 44, 1, 14);
      px(c, '#7a3020', x, 50, 10, 1);
    }
    px(c, '#2a1510', w / 2 - 6, h - 16, 12, 12);
    for (const x of [10, w - 14, w / 2 - 9, w / 2 + 6]) px(c, '#a8281e', x, 40, 3, h - 44);
    chineseRoof(c, 2, 28, w - 4, 13, 9, 10);
    // 二樓
    px(c, '#7a3020', 22, 18, w - 44, 12);
    for (let x = 26; x < w - 26; x += 10) px(c, night ? '#ffdc94' : '#ead8b0', x, 20, 7, 8);
    px(c, '#1a1a1a', w / 2 - 14, 20, 28, 8);
    text(c, '湖心亭', w / 2, 24.3, night ? '#ffe08a' : '#e8b830', `900 6px ${SERIF_TC}`);
    // 上層兩片屋頂交錯（湖心亭的屋頂有很多角）
    chineseRoof(c, 12, 6, 44, 13, 7, 9);
    chineseRoof(c, w - 56, 6, 44, 13, 7, 9);
    chineseRoof(c, w / 2 - 20, 0, 40, 12, 6, 8);
    px(c, '#e8b830', w / 2 - 1, -1, 2, 3);
    for (const x of [6, w - 7]) redLantern(c, x, 40, night, 0.8);
  });
}

// 小吃街的店：兩層的木樓、黑瓦飛簷、黑底金字的招牌、布幌子
function shopSprite(i: number, night: boolean): HTMLCanvasElement {
  const s = FOOD_SHOPS[i] ?? FOOD_SHOPS[0];
  const w = Math.round(((s?.x1 ?? 1) - (s?.x0 ?? 0)) * T);
  const h = 64;
  return cached(`sh-shop-${i}-${night ? 'n' : 'd'}`, w, h, (c) => {
    if (!s) return;
    px(c, '#a8a294', 0, h - 3, w, 3);
    // 二樓：白牆＋木格窗
    px(c, '#e8e2d4', 4, 8, w - 8, 14);
    for (let x = 8; x < w - 10; x += 14) {
      px(c, '#5a2a1a', x, 10, 10, 10);
      px(c, night ? '#ffd88a' : '#d8c8a0', x + 1, 11, 8, 8);
      for (let k = 2; k < 8; k += 3) px(c, '#5a2a1a', x + 1 + k, 11, 1, 8);
    }
    chineseRoof(c, 3, 0, w - 6, 9, 5, 6);
    // 一樓的屋簷、招牌
    chineseRoof(c, 0, 20, w, 10, 5, 6);
    px(c, '#1a1a1a', 8, 31, w - 16, 9);
    px(c, '#e8b830', 8, 31, w - 16, 1);
    text(c, s.sign, w / 2, 35.8, night ? '#ffe08a' : '#e8b830', `900 ${s.sign.length > 4 ? 6 : 7}px ${SERIF_TC}`);
    // 店面：暖黃的店裡、紅柱、櫃台
    px(c, night ? '#ffe0a0' : '#f0d8a8', 4, 40, w - 8, h - 43);
    px(c, 'rgba(120,60,20,0.25)', 4, 40, w - 8, 3);
    for (const x of [2, w - 6]) px(c, '#b02a20', x, 30, 4, h - 33);
    // 牆上的菜單木牌
    for (let k = 0; k < 4; k += 1) px(c, '#8a5a32', 10 + k * 8, 42, 6, 9);
    px(c, '#7a3a22', 4, h - 13, w - 8, 10);
    px(c, '#9a5a32', 4, h - 13, w - 8, 2);
    // 布幌子
    px(c, '#3a2a20', w - 15, 30, 1, 3);
    px(c, s.cloth, w - 19, 33, 9, 18);
    text(c, ['包', '煎', '麵'][i] ?? '', w - 14.5, 41, '#fff6e0', `900 6px ${SERIF_TC}`);
    redLantern(c, 10, 30, night, 0.7);
  });
}

// 店的櫃台上：蒸籠（會冒煙）、煎鍋、麵碗
function drawShopCounter(c: CanvasRenderingContext2D, i: number, d: DrawCtx): void {
  const s = FOOD_SHOPS[i];
  if (!s) return;
  const x0 = Math.round(s.x0 * T);
  const by = Math.round(SH.yuLine * T);
  const top = by - 13;
  if (i === 0) {
    // 疊高的竹蒸籠
    for (const [dx, n] of [[14, 2], [27, 1], [40, 2], [53, 1]] as const) {
      for (let k = 0; k < n; k += 1) {
        px(c, '#c9a66a', x0 + dx - 6, top - 4 - k * 4, 12, 4);
        px(c, '#a8844a', x0 + dx - 6, top - 1 - k * 4, 12, 1);
      }
      px(c, '#b8955a', x0 + dx - 5, top - 6 - n * 4 + 4, 10, 2);
    }
  } else if (i === 1) {
    // 大平底鍋
    c.fillStyle = '#3a3a40';
    c.beginPath();
    c.ellipse(x0 + 38, top - 1, 19, 4, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1f1f22';
    c.beginPath();
    c.ellipse(x0 + 38, top - 1, 17, 3, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = -14; k <= 14; k += 6) {
      px(c, '#f0e6d0', x0 + 37 + k, top - 3, 4, 3);
      px(c, '#3a7a3a', x0 + 38 + k, top - 5, 1, 1);
    }
  } else {
    for (let k = 0; k < 4; k += 1) {
      px(c, '#f4f1e8', x0 + 12 + k * 15, top - 4, 10, 4);
      px(c, k % 2 ? '#c8783a' : '#e8d098', x0 + 13 + k * 15, top - 5, 8, 2);
      px(c, '#2a6a2a', x0 + 15 + k * 15, top - 6, 2, 1);
    }
  }
  // 冒煙
  for (let k = 0; k < 3; k += 1) {
    const t = (d.seconds * 0.5 + k / 3) % 1;
    px(c, `rgba(255,255,255,${0.55 * (1 - t)})`, Math.round(x0 + 18 + k * 18 + Math.sin(d.seconds * 2 + k) * 2), Math.round(top - 12 - t * 16), 4, 3);
  }
}

// 排隊買小籠包的人（面向店）
const QUEUE: [number, number][] = [
  [41.9, 36.3],
  [41.9, 37.2],
  [42, 38.1],
  [41.8, 39],
];
function drawQueuer(c: CanvasRenderingContext2D, k: number, x: number, y: number): void {
  const sprite = getAvatarFrame(lookColors((k * 3) % 5, (k * 2 + 1) % 6), 'up', 'idle');
  px(c, 'rgba(0,0,0,0.25)', Math.round(x * T - 5), Math.round(y * T + 3), 10, 2);
  c.drawImage(sprite, Math.round(x * T - sprite.width / 2), Math.round(y * T + 5 - sprite.height));
}

// 香爐（銅鼎，冒香煙）
function drawCenser(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = 9 * T;
  const by = Math.round(38.2 * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 14, by - 1, 28, 3);
  px(c, '#5a4a2a', cx - 10, by - 4, 3, 4);
  px(c, '#5a4a2a', cx + 7, by - 4, 3, 4);
  c.fillStyle = '#7a5a2a';
  c.beginPath();
  c.ellipse(cx, by - 10, 12, 8, 0, 0, Math.PI);
  c.fill();
  px(c, '#8a6a32', cx - 13, by - 12, 26, 3);
  px(c, '#b08a4a', cx - 13, by - 12, 26, 1);
  px(c, '#6a4a22', cx - 15, by - 15, 3, 4);
  px(c, '#6a4a22', cx + 12, by - 15, 3, 4);
  // 上面的小屋頂
  px(c, '#6a4a22', cx - 2, by - 26, 4, 14);
  chineseRoof(c, cx - 8, by - 32, 16, 6, 3, 4, '#6a4a22');
  for (let k = 0; k < 4; k += 1) {
    const t = (d.seconds * 0.35 + k / 4) % 1;
    px(c, `rgba(230,230,230,${0.6 * (1 - t)})`, Math.round(cx - 4 + k * 3 + Math.sin(d.seconds + k * 1.7) * 4 * t), Math.round(by - 16 - t * 30), 2, 3);
  }
}

// 太湖石（假山），有洞
function drawRock(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 10, by - 1, 20, 3);
  c.fillStyle = '#9a9a94';
  c.beginPath();
  c.moveTo(cx - 9, by);
  c.quadraticCurveTo(cx - 13, by - 18, cx - 4, by - 30);
  c.quadraticCurveTo(cx + 6, by - 36, cx + 8, by - 22);
  c.quadraticCurveTo(cx + 12, by - 10, cx + 9, by);
  c.fill();
  px(c, 'rgba(255,255,255,0.2)', cx - 6, by - 26, 3, 10);
  for (const [dx, dy, r] of [[-2, -22, 3], [3, -13, 2], [-4, -8, 2]] as const) {
    c.fillStyle = '#5a5a56';
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
}

// 茶桌（深色木桌、茶壺、茶杯）
function drawTeaTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(TEA_TABLE_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 16, by + 1, 32, 3);
  px(c, '#5a2a18', cx - 16, by - 9, 32, 5);
  px(c, '#7a3a22', cx - 16, by - 9, 32, 1);
  px(c, '#4a2012', cx - 14, by - 4, 3, 5);
  px(c, '#4a2012', cx + 11, by - 4, 3, 5);
  // 紫砂壺、兩個杯子、一碟點心
  px(c, '#8a4a2a', cx - 3, by - 13, 7, 4);
  px(c, '#8a4a2a', cx - 1, by - 14, 3, 1);
  px(c, '#8a4a2a', cx + 4, by - 12, 2, 1);
  px(c, '#f4f1e8', cx - 11, by - 11, 4, 2);
  px(c, '#f4f1e8', cx + 8, by - 11, 4, 2);
  px(c, '#f4f1e8', cx - 7, by - 10, 6, 1);
  px(c, '#e8c070', cx - 6, by - 11, 2, 1);
}

// 茶樓的木椅（椅背在人後面）
function drawTeaChair(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by + 1, 12, 2);
  px(c, '#5a2a18', cx - 6, by - 14, 2, 14);
  px(c, '#5a2a18', cx + 4, by - 14, 2, 14);
  px(c, '#7a3a22', cx - 7, by - 15, 14, 2);
  px(c, '#6a3020', cx - 1, by - 13, 2, 8);
  px(c, '#6a3020', cx - 6, by - 5, 12, 3);
}

// 石桌、石鼓凳
function drawStoneTable(c: CanvasRenderingContext2D): void {
  const cx = Math.round(STONE_TABLE.x * T);
  const by = Math.round(STONE_TABLE.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 12, by + 1, 24, 3);
  px(c, '#8f8a80', cx - 4, by - 8, 8, 9);
  c.fillStyle = '#b5afa3';
  c.beginPath();
  c.ellipse(cx, by - 10, 12, 4, 0, 0, Math.PI * 2);
  c.fill();
  px(c, 'rgba(255,255,255,0.25)', cx - 8, by - 12, 8, 1);
  // 棋盤
  px(c, 'rgba(60,50,40,0.4)', cx - 4, by - 11, 8, 1);
  px(c, '#1a1a1a', cx - 2, by - 12, 1, 1);
  px(c, '#f4f4f4', cx + 2, by - 12, 1, 1);
}
function drawDrumStool(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by + 1, 12, 2);
  c.fillStyle = '#a39d91';
  c.beginPath();
  c.ellipse(cx, by - 3, 5, 4, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#bdb7aa', cx - 4, by - 7, 8, 2);
  px(c, '#8a8478', cx - 5, by - 2, 10, 1);
}

// 錦鯉（池裡繞圈）
const KOI: [number, number, number, number][] = [
  [21, 36.6, 1.1, 0.5],
  [37.6, 37, 1.3, -0.4],
  [30, 43, 2.2, 0.3],
  [24, 43, 1.2, -0.6],
];
function drawKoi(c: CanvasRenderingContext2D, d: DrawCtx): void {
  KOI.forEach(([x, y, r, sp], k) => {
    const a = d.seconds * sp + k;
    const fx = (x + Math.cos(a) * r) * T;
    const fy = (y + Math.sin(a) * r * 0.4) * T;
    px(c, k % 2 ? '#f08a3a' : '#f4f1e8', Math.round(fx - 2), Math.round(fy), 4, 2);
    px(c, '#e8402e', Math.round(fx - 1), Math.round(fy), 2, 1);
  });
}

// ── 組起來 ──
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = SHANGHAI_SEATS[i];
  if (!s) return;
  if (i < 6) {
    if (i % 2 === 0) drawBundBenchSeat(c, BUND_BENCHES[i / 2] ?? 0);
  } else if (i < 10) drawTeaChair(c, s.x, s.y);
  else drawDrumStool(c, s.x, s.y);
}
function drawSeatFront(c: CanvasRenderingContext2D, i: number): void {
  if (i < 6 && i % 2 === 1) drawBundBenchBack(c, BUND_BENCHES[(i - 1) / 2] ?? 0);
}

const BUND_LAMPS: [number, number][] = [[3, 17.3], [15.5, 17.3], [32.5, 17.3], [48, 17.3], [54, 17.3], [17, 20.1], [33.4, 20.1]];
const BUND_TREES: [number, number][] = [[2, 20.2], [29, 20.2], [47, 20.2], [53, 20.2]];
const WILLOWS: [number, number][] = [[17, 36.6], [16.8, 43.1], [23.6, 35], [36.4, 35], [41.4, 43]];

const props: CityProp[] = [
  { y: 0, draw: (c, d) => drawLightShow(c, d) },
  { y: SH.river.y1 - 0.1, draw: (c, d) => drawRiver(c, d) },
  { y: SH.wall, draw: (c) => drawBundRailing(c) },
  ...BUND_LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawBundLamp(c, x, y, d.night) })),
  ...BUND_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...BUND.map((b): CityProp => ({ y: SH.bundLine, draw: (c, d) => blit(c, bundSprite(b, d.night), b.x0 * T, SH.bundLine * T) })),
  ...BUND.filter((b) => b.kind === 'customs').map((b): CityProp => ({ y: SH.bundLine + 0.01, draw: (c) => drawCustomsClock(c, b) })),
  { y: SH.station.line, draw: (c) => blit(c, stationSprite(), SH.station.x0 * T, SH.station.line * T) },
  { y: SH.yuLine, draw: (c, d) => blit(c, templeSprite(d.night), SH.temple.x0 * T, SH.yuLine * T) },
  { y: SH.garden.line, draw: (c, d) => blit(c, gardenSprite(d.night), SH.garden.x0 * T, SH.garden.line * T) },
  ...FOOD_SHOPS.map((s, i): CityProp => ({ y: SH.yuLine, draw: (c, d) => blit(c, shopSprite(i, d.night), s.x0 * T, SH.yuLine * T) })),
  ...FOOD_SHOPS.map((_, i): CityProp => ({ y: SH.yuLine + 0.01, draw: (c, d) => drawShopCounter(c, i, d) })),
  ...QUEUE.map(([x, y], k): CityProp => ({ y, draw: (c) => drawQueuer(c, k, x, y) })),
  { y: 38.2, draw: (c, d) => drawCenser(c, d) },
  { y: SH.lake.y0, draw: (c, d) => drawKoi(c, d) },
  { y: SH.tea.line, draw: (c, d) => blit(c, teahouseSprite(d.night), SH.tea.x0 * T, SH.tea.line * T) },
  ...TEA_TABLES.map((x): CityProp => ({ y: TEA_TABLE_Y, draw: (c) => drawTeaTable(c, x) })),
  { y: STONE_TABLE.y, draw: (c) => drawStoneTable(c) },
  { y: 40.9, draw: (c) => drawRock(c, 49.6, 40.9) },
  ...WILLOWS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawWillow(c, x, y, d.seconds) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, SH.W, SH.wall),
  ...BUND_BENCHES.map((x) => r(x - 1.35, BUND_BENCH_Y - 0.45, x + 1.35, BUND_BENCH_Y + 0.1)),
  ...BUND.map((b) => r(b.x0, SH.road.y1, b.x1, SH.bundLine)),
  r(SH.station.x0, SH.road.y1, SH.station.x1, SH.station.line),
  r(0, SH.walk, SH.temple.x1, SH.yuLine),
  r(SH.garden.x0, SH.walk, 40, SH.garden.line),
  r(FOOD_SHOPS[0]?.x0 ?? 41.2, SH.walk, SH.W, SH.yuLine),
  r(SH.tea.x0, 35.6, SH.tea.x1, SH.tea.line + 0.1),
  ...TEA_TABLES.map((x) => r(x - 1.05, TEA_TABLE_Y - 0.4, x + 1.05, TEA_TABLE_Y)),
  r(STONE_TABLE.x - 0.7, STONE_TABLE.y - 0.45, STONE_TABLE.x + 0.7, STONE_TABLE.y + 0.05),
  r(8.1, 37.7, 9.9, 38.3),
  r(48.9, 40.4, 50.3, 41),
  ...QUEUE.map(([x, y]) => r(x - 0.3, y - 0.3, x + 0.3, y + 0.1)),
  ...BUND_LAMPS.map(([x, y]) => r(x - 0.15, y - 0.25, x + 0.25, y + 0.05)),
  ...BUND_TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...WILLOWS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
];

// 荷花池不能走，九曲橋和湖心亭的島可以
const blocked = (x: number, y: number): boolean => inside(x, y, SH.lake) && !inside(x, y, SH.island) && !BRIDGES.some((b) => inside(x, y, b));

const lights: CityDef['lights'] = [
  // 浦東：每棟樓的窗光、地標的彩光
  ...TOWERS.filter((t) => t.near && t.x > 8 && t.x + t.w < W - 8).map((t) => ({ x: t.x + t.w / 2, y: BANK - 10 - t.h / 2, r: Math.max(18, t.h * 0.55), color: t.led ? 'rgba(200, 160, 255, 0.3)' : 'rgba(255, 215, 150, 0.28)' })),
  { x: PEARL, y: BANK - 4 - 40, r: 30, color: 'rgba(255, 90, 180, 0.6)' },
  { x: PEARL, y: BANK - 4 - 84, r: 22, color: 'rgba(255, 90, 180, 0.55)' },
  { x: PEARL, y: BANK - 4 - 60, r: 40, color: 'rgba(255, 120, 200, 0.25)' },
  { x: JINMAO, y: BANK - 50, r: 40, color: 'rgba(255, 200, 110, 0.45)' },
  { x: JINMAO, y: BANK - 95, r: 18, color: 'rgba(255, 220, 140, 0.5)' },
  { x: SWFC, y: BANK - 70, r: 42, color: 'rgba(130, 190, 255, 0.4)' },
  { x: SWFC, y: BANK - 4 - SWFC_H + 10, r: 16, color: 'rgba(180, 225, 255, 0.6)' },
  { x: STOWER, y: BANK - 60, r: 44, color: 'rgba(100, 230, 240, 0.4)' },
  { x: STOWER, y: BANK - 130, r: 30, color: 'rgba(130, 230, 255, 0.4)' },
  // 江面的倒影
  ...REFLECT.map(([x, rgb]) => ({ x, y: (SH.river.y0 + 1.6) * T, r: 34, color: `rgba(${rgb}, 0.25)` })),
  // 外灘：路燈、萬國建築的金黃打燈
  ...BUND_LAMPS.map(([x, y]) => ({ x: x * T + 1, y: y * T - 38, r: 34, color: 'rgba(255, 230, 170, 0.5)' })),
  ...BUND.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: SH.bundLine * T - 40, r: Math.max(64, (b.x1 - b.x0) * T * 0.75), color: 'rgba(255, 200, 110, 0.5)' })),
  ...BUND.filter((b) => b.kind !== 'plain').map((b) => ({ x: ((b.x0 + b.x1) / 2) * T + (b.kind === 'peace' ? 26 : 0), y: SH.bundLine * T - 96, r: 40, color: b.kind === 'peace' ? 'rgba(120, 255, 200, 0.4)' : 'rgba(255, 220, 140, 0.5)' })),
  { x: ((SH.station.x0 + SH.station.x1) / 2) * T, y: SH.station.line * T - 24, r: 70, color: 'rgba(220, 240, 255, 0.45)' },
  // 豫園：紅燈籠、店裡的燈、湖心亭
  { x: ((SH.temple.x0 + SH.temple.x1) / 2) * T, y: SH.yuLine * T - 26, r: 120, color: 'rgba(255, 140, 80, 0.45)' },
  ...[22, 30, 38].map((x) => ({ x: x * T, y: SH.garden.line * T - 26, r: 50, color: 'rgba(255, 120, 80, 0.35)' })),
  ...FOOD_SHOPS.map((s) => ({ x: ((s.x0 + s.x1) / 2) * T, y: SH.yuLine * T - 14, r: 60, color: 'rgba(255, 190, 110, 0.5)' })),
  { x: ((SH.tea.x0 + SH.tea.x1) / 2) * T, y: SH.tea.line * T - 30, r: 90, color: 'rgba(255, 180, 100, 0.5)' },
  { x: ((SH.tea.x0 + SH.tea.x1) / 2) * T, y: (SH.tea.line + 1.6) * T, r: 60, color: 'rgba(255, 200, 130, 0.35)' },
  { x: 9 * T, y: 37.4 * T, r: 40, color: 'rgba(255, 170, 90, 0.4)' },
];

const stationX = (SH.station.x0 + SH.station.x1) / 2;

export const SHANGHAI: CityDef = {
  id: 'shanghai',
  country: 'cn',
  line: 'metro',
  W: SH.W,
  H: SH.H,
  title: { 'zh-TW': '上海 · 外灘與豫園', 'en-US': 'Shanghai · The Bund & Yuyuan' },
  stop: { 'zh-TW': '上海（地鐵往浦東機場）', 'en-US': 'Shanghai (Metro to Pudong Airport)' },
  emoji: '🌃',
  station: {
    x: stationX,
    y: SH.station.line + 0.6,
    name: { 'zh-TW': '地鐵 2 號線 往浦東機場', 'en-US': 'Metro Line 2 to Pudong Airport' },
    arrive: { x: stationX, y: SH.station.line + 2 },
  },
  background: '#bdb7aa',
  soundscape: 'city',
  paintGround: paintShanghaiGround,
  props,
  solid,
  blocked,
  seats: SHANGHAI_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  drawSeatFront: (c, i) => drawSeatFront(c, i),
  shops: SHANGHAI_SHOPS,
  fortune: {
    at: r(7.2, SH.yuLine, 10.8, SH.yuLine + 1.4),
    label: { x: 9, y: SH.yuLine + 2.2 },
    title: { 'zh-TW': '城隍廟 · 求籤', 'en-US': 'City God Temple · Fortune' },
    hint: { 'zh-TW': '上一炷香，搖一搖籤筒。', 'en-US': 'Light some incense and shake the fortune sticks.' },
    draw: { 'zh-TW': '抽籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再抽一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '上上籤', 'en-US': 'Supreme fortune' }, text: { 'zh-TW': '像浦東的燈一樣一盞盞亮起來，今天的進度會一路往上！', 'en-US': 'Like Pudong lighting up tower by tower — your progress climbs all day!' } },
      { rank: { 'zh-TW': '上籤', 'en-US': 'Good fortune' }, text: { 'zh-TW': '九曲橋走得慢，但每一彎都有新的風景。慢慢來，比較快。', 'en-US': 'The zigzag bridge is slow, but every turn shows a new view. Slow is smooth, smooth is fast.' } },
      { rank: { 'zh-TW': '中籤', 'en-US': 'Fair fortune' }, text: { 'zh-TW': '排隊買小籠包也要等，專注也是。再一顆番茄鐘就輪到你。', 'en-US': 'Even xiaolongbao take a queue — so does focus. One more pomodoro and it’s your turn.' } },
      { rank: { 'zh-TW': '中籤', 'en-US': 'Fair fortune' }, text: { 'zh-TW': '累了就去外灘吹江風，看船來來去去，再回來繼續。', 'en-US': 'Tired? Take the river breeze on the Bund, watch the boats, then come back to it.' } },
      { rank: { 'zh-TW': '下籤', 'en-US': 'Low fortune' }, text: { 'zh-TW': '海關大樓的鐘每十五分鐘響一次——該休息就休息，不要硬撐。', 'en-US': 'The Customs House clock chimes every quarter hour — rest when it’s time, don’t push through.' } },
    ],
  },
  infos: [
    { at: r(11.6, 2, 16.4, SH.bank), title: { 'zh-TW': '東方明珠廣播電視塔', 'en-US': 'Oriental Pearl Tower' }, text: { 'zh-TW': '1994 年完工，高 468 公尺，曾是亞洲最高的塔。大大小小 11 顆粉紅色的球，取自白居易〈琵琶行〉的「大珠小珠落玉盤」。晚上球會變換顏色。', 'en-US': 'Completed in 1994, 468 m tall and once Asia’s tallest tower. Its 11 pink spheres evoke a Tang poem: “pearls large and small falling on a jade plate”. The spheres change colour at night.' } },
    { at: r(26.8, 0.5, 40, SH.bank), title: { 'zh-TW': '陸家嘴三座摩天樓', 'en-US': 'Lujiazui’s Three Skyscrapers' }, text: { 'zh-TW': '左起金茂大廈（1999 年，420 公尺，造型參考中國的塔，一節節往上收）、上海環球金融中心（2008 年，492 公尺，頂端梯形開口，被叫「開瓶器」）、上海中心大廈（2015 年，632 公尺，中國最高樓，整棟扭轉約 120 度來減少風阻）。地圖上把樓的距離壓縮了。', 'en-US': 'From left: Jin Mao Tower (1999, 420 m, tiered like a Chinese pagoda), Shanghai World Financial Center (2008, 492 m, nicknamed “the bottle opener” for its trapezoid hole) and Shanghai Tower (2015, 632 m, China’s tallest, twisting about 120° to cut wind loads). Distances are compressed on this map.' } },
    { at: r(0, SH.river.y0, SH.W, SH.river.y1), title: { 'zh-TW': '黃浦江', 'en-US': 'Huangpu River' }, text: { 'zh-TW': '上海的母親河，把城市分成浦西和浦東。江上一直有觀光船、渡輪和運砂石的貨船來來往往；晚上兩岸一起點燈，是上海最有名的夜景。', 'en-US': 'Shanghai’s “mother river”, dividing Puxi from Pudong. Tour boats, ferries and sand barges pass all day; at night both banks light up for the city’s most famous view.' } },
    { at: r(0.4, SH.road.y0, 48.4, SH.bundLine), title: { 'zh-TW': '外灘 · 萬國建築博覽群', 'en-US': 'The Bund' }, text: { 'zh-TW': '1843 年上海開埠後，各國銀行、洋行沿著黃浦江蓋起一排歐式大樓，被稱為「萬國建築博覽群」。有圓頂的是 1923 年的匯豐銀行大樓；有鐘樓的是 1927 年的海關大樓，鐘聲仿照倫敦大笨鐘；綠色金字塔屋頂的是 1929 年的沙遜大廈（今和平飯店）。實際上大樓沿江南北排開、彼此的順序和距離有簡化。', 'en-US': 'After Shanghai opened as a treaty port in 1843, foreign banks and trading houses built a row of European-style buildings along the river. The dome is the 1923 HSBC Building; the clock tower is the 1927 Custom House, whose chimes copy Big Ben; the green pyramid crowns the 1929 Sassoon House, now the Peace Hotel. The real row runs north–south along the river; order and spacing are simplified here.' } },
    { at: r(SH.temple.x0, SH.walk - 0.6, SH.temple.x1, SH.yuLine - 0.2), title: { 'zh-TW': '上海城隍廟', 'en-US': 'Shanghai City God Temple' }, text: { 'zh-TW': '明朝永樂年間（約 1403 年）改建成城隍廟，供奉漢朝的霍光、明初的秦裕伯等守護上海的神明。廟前的老城廂一帶發展成熱鬧的商場和小吃街。站到廟門口可以抽籤。', 'en-US': 'Rebuilt as the City God Temple in the Yongle era of the Ming dynasty (around 1403), honouring Shanghai’s guardian deities such as Huo Guang and Qin Yubo. The old town around it grew into a busy bazaar of shops and snacks. Stand at the door to draw a fortune.' } },
    { at: r(SH.garden.x0, SH.walk - 0.6, 40, SH.garden.line), title: { 'zh-TW': '豫園', 'en-US': 'Yu Garden' }, text: { 'zh-TW': '明朝潘允端從 1559 年開始蓋的江南園林，「豫」是平安、愉悅的意思，原本是給父母養老的。園裡有牆頭做成龍身的龍牆、玲瓏剔透的太湖石「玉玲瓏」。地圖上把外灘和豫園畫得很近，實際上走路大約 20 分鐘。', 'en-US': 'A classical Jiangnan garden begun in 1559 by Ming official Pan Yunduan for his parents’ retirement — “Yu” means peace and contentment. Look for walls topped with undulating dragons and the porous Jade Rock. On this map it sits right behind the Bund; in reality it’s about a 20-minute walk.' } },
    { at: r(SH.island.x0, 35.4, SH.island.x1, SH.tea.line), title: { 'zh-TW': '湖心亭 · 九曲橋', 'en-US': 'Huxinting Teahouse & Zigzag Bridge' }, text: { 'zh-TW': '湖心亭建於清朝乾隆年間（1784 年），1855 年起改成茶樓，是上海最老的茶樓之一，屋頂有很多翹起的飛簷。通過去的九曲橋彎來彎去，傳說是因為鬼只會走直線。', 'en-US': 'Built in 1784 during the Qianlong era and a teahouse since 1855 — one of Shanghai’s oldest, with a roof full of upturned eaves. The zigzag bridge leading to it is said to keep out evil spirits, which can only travel in straight lines.' } },
  ],
  labels: [
    { x: 24.5, y: SH.road.y0 - 0.15, text: { 'zh-TW': '🌃 外灘江邊長椅（看浦東夜景專注）', 'en-US': '🌃 Bund riverside benches (focus with a skyline view)' }, color: '#fde68a' },
    { x: (SH.island.x0 + SH.island.x1) / 2, y: SH.island.y1 + 1.1, text: { 'zh-TW': '🍵 湖心亭茶樓（茶桌坐下專注）', 'en-US': '🍵 Huxinting Teahouse (sit at a tea table)' }, color: '#fca5a5' },
    { x: STONE_TABLE.x, y: STONE_TABLE.y + 1.5, text: { 'zh-TW': '🪨 豫園石凳', 'en-US': '🪨 Yuyuan stone seats' }, color: '#d9f99d' },
  ],
  walkers: [
    { x0: 1, y0: 17.6, x1: 55, y1: 17.6, count: 4 },
    { x0: 1, y0: 19.8, x1: 47, y1: 19.8, count: 3 },
    { x0: 1, y0: 29.3, x1: 55, y1: 29.3, count: 4 },
    { x0: 34.5, y0: 19.8, x1: 34.5, y1: 29.3, count: 1 },
    { x0: 1, y0: 36.4, x1: 16.4, y1: 36.4, count: 2 },
    { x0: 18.4, y0: 34.3, x1: 40.4, y1: 34.3, count: 2 },
    { x0: 43.4, y0: 37.6, x1: 55, y1: 37.6, count: 2 },
  ],
  traffic: [
    { y: 21.1, dir: -1, x0: 0, x1: SH.W, count: 3 },
    { y: 22.4, dir: 1, x0: 0, x1: SH.W, count: 3 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點外灘江邊長椅、湖心亭的茶桌或豫園石凳坐下專注 · 走到店門口買小籠包、生煎包、蔥油拌麵、排骨年糕 · 城隍廟門口可以抽籤 · 點地標看介紹 · 地鐵 2 號線往浦東機場飛回台灣',
    'en-US': 'WASD / arrows to move · click a Bund bench, a Huxinting tea table or the Yuyuan stone seats to focus · walk up to the shops for xiaolongbao, shengjian buns, scallion noodles and pork chop rice cakes · draw a fortune at the City God Temple · click landmarks for info · Metro Line 2 to Pudong Airport to fly home',
  },
  hintTouch: {
    'zh-TW': '點長椅、茶桌或石凳坐下專注 · 走到店門口買小吃 · 城隍廟抽籤 · 點地標看介紹 · 地鐵往浦東機場',
    'en-US': 'Tap a bench, tea table or stone seat to focus · visit the shops · fortune at the temple · tap landmarks · Metro to Pudong Airport',
  },
};
