// 福岡的美術：遠景（福岡塔、巨蛋、新幹線高架）、櫛田神社（拜殿、石鳥居、大銀杏、飾山笠）、JR 博多站（玻璃大廳、站前的燈飾樹）、
// 中洲的霓虹大樓（直式招牌晚上會閃，字是自己編的）、那珂川河岸一整排屋台（木造攤車、紅燈籠、白暖簾、塑膠布簾、老闆）、
// 那珂川（霓虹倒影、遊船、橋）、對岸看河的長椅。最後組成 CityScene 用的 FUKUOKA。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { FK, FUKUOKA_SEATS, FUKUOKA_SHOPS, YATAI, YATAI_SEAT_Y, type Yatai } from './fukuoka';
import { px, seeded } from './pixelUtil';
import { AVATAR_SIZE, SEATED_ROWS, getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, drawStreetTree } from './cityArt';
import { tiledRoof, drawLantern, drawWillow, drawStoneLantern, drawStreetLamp } from './kyotoArt';
import { drawSakura } from './osakaArt';

const W = FK.W * T;

// ── 地面（畫一次）──
export function paintFukuokaGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1889);
  const hz = FK.horizon * T;
  // 天空
  const sky = c.createLinearGradient(0, 0, 0, hz);
  sky.addColorStop(0, '#79b4e4');
  sky.addColorStop(1, '#e4f0f8');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, hz);
  // 遠方的天神、百道一帶的大樓（淡藍灰的剪影）
  for (let x = 0; x < W; x += 10 + Math.floor(rand() * 14)) {
    const h = 10 + Math.floor(rand() * 26);
    const w = 10 + Math.floor(rand() * 12);
    px(c, rand() < 0.5 ? '#b9cadb' : '#a9bccf', x, hz - h, w, h);
    for (let y = hz - h + 3; y < hz - 2; y += 4) px(c, 'rgba(255,255,255,0.35)', x + 2, y, w - 4, 1);
  }
  // 櫛田神社的森（拜殿後面）
  px(c, '#3f6a3e', 0, hz, FK.shrineX1 * T, (FK.haiden.line - FK.horizon) * T);
  for (let i = 0; i < 150; i += 1) {
    c.fillStyle = ['#355e36', '#4a7a46', '#2f5530'][Math.floor(rand() * 3)] ?? '#355e36';
    c.beginPath();
    c.arc(rand() * FK.shrineX1 * T, hz + rand() * (FK.haiden.line - FK.horizon - 0.6) * T, 4 + rand() * 6, 0, Math.PI * 2);
    c.fill();
  }
  // 神社的白砂礫、參道的石板
  const gy0 = FK.haiden.line - 0.8;
  px(c, '#ddd5c2', 0, gy0 * T, FK.shrineX1 * T, (13.4 - gy0) * T);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#c9c0ab' : '#ebe4d4', Math.floor(rand() * FK.shrineX1 * T), Math.floor(gy0 * T + rand() * (13.4 - gy0) * T), 1, 1);
  tiles(c, { x0: 11.6, y0: FK.haiden.line, x1: 14.4, y1: 13.4 }, '#b8b0a0', '#a39b8a', 8);
  px(c, '#8f897d', 0, 13.3 * T, FK.shrineX1 * T, 2);
  // 神社和車站之間的小公園（樹叢、步道）
  px(c, '#6f9a58', FK.shrineX1 * T, hz, (FK.station.x0 - FK.shrineX1) * T, (10 - FK.horizon) * T);
  for (let i = 0; i < 40; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#5a8a4a' : '#7aaa62';
    c.beginPath();
    c.arc(FK.shrineX1 * T + rand() * (FK.station.x0 - FK.shrineX1) * T, hz + rand() * 4 * T, 4 + rand() * 4, 0, Math.PI * 2);
    c.fill();
  }
  tiles(c, { x0: FK.shrineX1, y0: 10, x1: FK.station.x0, y1: 13.4 }, '#d8d3c7', '#c7c1b3', 16);
  // 博多站前廣場（花崗岩地磚）
  tiles(c, { x0: FK.station.x0, y0: FK.horizon, x1: FK.W, y1: 13.4 }, '#d6d2ca', '#c4bfb4', 16);
  // 北邊人行道、馬路（中間白線、對著巷子的斑馬線）
  tiles(c, { x0: 0, y0: 13.4, x1: FK.W, y1: FK.road.y0 }, '#cfc9bd', '#bdb7aa', 16);
  road(c, { x0: 0, y0: FK.road.y0, x1: FK.W, y1: FK.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((FK.road.y0 + FK.road.y1) / 2) * T), 12, 1);
  zebra(c, FK.alley.x0 + 0.4, FK.road.y0, FK.alley.x1 - 0.4, FK.road.y1, false);
  // 中洲：大樓腳下的暗色地磚；中間的巷子（紅磚）
  px(c, '#5a5560', 0, FK.road.y1 * T, W, (FK.nakasuLine - FK.road.y1) * T);
  tiles(c, { x0: FK.alley.x0, y0: FK.road.y1, x1: FK.alley.x1, y1: FK.nakasuLine }, '#a8604a', '#8f4e3c', 8);
  // 中洲的人行道
  tiles(c, { x0: 0, y0: FK.nakasuLine, x1: FK.W, y1: 25.4 }, '#c9c3b8', '#b5afa3', 16);
  // 河岸步道（暖色石板）
  tiles(c, { x0: 0, y0: 25.4, x1: FK.W, y1: FK.riverY0 }, '#cdbfa6', '#b9ab92', 12);
  // 河岸：石砌的邊、欄杆
  const edge = (y: number) => {
    px(c, '#8f897d', 0, y, W, 5);
    px(c, '#a8a294', 0, y, W, 1);
    for (let x = 0; x < W; x += 12) px(c, '#7a756b', x, y + 1, 1, 4);
  };
  edge(FK.riverY0 * T - 5);
  for (let x = 4; x < W; x += 20) {
    if (x > FK.bridge.x0 * T - 6 && x < FK.bridge.x1 * T + 6) continue;
    px(c, '#4a4d55', x, FK.riverY0 * T - 12, 2, 8);
  }
  for (let x = 0; x < W; x += 2) {
    if (x > FK.bridge.x0 * T - 4 && x < FK.bridge.x1 * T + 4) continue;
    px(c, '#5a5d66', x, FK.riverY0 * T - 11 + Math.round(Math.abs(Math.sin(x / 20 * Math.PI)) * 2), 2, 1);
  }
  // 那珂川
  const water = c.createLinearGradient(0, FK.riverY0 * T, 0, FK.riverY1 * T);
  water.addColorStop(0, '#2f5f78');
  water.addColorStop(1, '#244c64');
  c.fillStyle = water;
  c.fillRect(0, FK.riverY0 * T, W, (FK.riverY1 - FK.riverY0) * T);
  for (let i = 0; i < 80; i += 1) px(c, 'rgba(255,255,255,0.18)', Math.floor(rand() * W), Math.floor(FK.riverY0 * T + 4 + rand() * (FK.riverY1 - FK.riverY0 - 0.5) * T), 5 + Math.floor(rand() * 8), 1);
  // 對岸的石砌邊
  px(c, '#8f897d', 0, FK.riverY1 * T, W, 6);
  px(c, '#a8a294', 0, FK.riverY1 * T + 5, W, 1);
  for (let x = 0; x < W; x += 12) px(c, '#7a756b', x, FK.riverY1 * T, 1, 5);
  // 對岸步道、草地
  tiles(c, { x0: 0, y0: FK.riverY1 + 0.4, x1: FK.W, y1: FK.lawnY }, '#d4cdbd', '#c1b9a8', 16);
  px(c, '#6f9a58', 0, FK.lawnY * T, W, (FK.H - FK.lawnY) * T);
  for (let i = 0; i < 160; i += 1) px(c, rand() < 0.5 ? '#628c4c' : '#80ac66', Math.floor(rand() * W), Math.floor(FK.lawnY * T + rand() * (FK.H - FK.lawnY) * T), 2, 1);
  // 橋：石板橋面、兩邊的欄杆
  const bx0 = FK.bridge.x0 * T;
  const bx1 = FK.bridge.x1 * T;
  const by0 = (FK.riverY0 - 0.6) * T;
  const by1 = (FK.riverY1 + 0.5) * T;
  px(c, 'rgba(0,0,0,0.25)', bx0 - 2, by0, bx1 - bx0 + 6, by1 - by0 + 3);
  tiles(c, { x0: FK.bridge.x0, y0: FK.riverY0 - 0.6, x1: FK.bridge.x1, y1: FK.riverY1 + 0.5 }, '#c4bcae', '#b0a898', 8);
  for (const x of [bx0, bx1 - 5]) {
    px(c, '#7a3a2a', x, by0, 5, by1 - by0);
    px(c, '#a85a3e', x + 1, by0, 2, by1 - by0);
    for (let y = by0; y < by1; y += 14) px(c, '#5a2a1e', x, y, 5, 3);
  }
  // 橋墩在水上的影子
  px(c, 'rgba(10,20,30,0.35)', bx0, FK.riverY1 * T - 1, bx1 - bx0, 3);
}

// ── 遠景：福岡塔（細長的三角柱，貼滿半反射玻璃，晚上點燈）、巨蛋、新幹線的高架 ──
function drawFukuokaTower(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(FK.tower.x * T);
  const base = Math.round(FK.horizon * T);
  const top = 6;
  const h = base - top;
  // 底座
  px(c, '#9aa4b0', cx - 9, base - 8, 18, 8);
  px(c, '#b8c2cc', cx - 9, base - 8, 18, 1);
  // 塔身：下寬上窄
  for (let y = top + 10; y < base - 8; y += 1) {
    const k = (y - top) / h;
    const half = Math.round(3 + k * 4);
    const lit = d.night ? ['#5ad6ff', '#ff6ad5', '#7aee6a', '#ffd23f'][Math.floor((y - d.seconds * 18) / 14) & 3] ?? '#5ad6ff' : null;
    px(c, d.night ? '#2a3448' : '#8fb2cf', cx - half, y, half, 1);
    px(c, d.night ? '#1f2838' : '#6f93b2', cx, y, half, 1);
    if (lit && y % 3 === 0) px(c, lit, cx - half + 1, y, half * 2 - 2, 1);
    if (!d.night && y % 6 === 0) px(c, 'rgba(255,255,255,0.35)', cx - half, y, half, 1);
  }
  // 展望台
  px(c, d.night ? '#ffe9a8' : '#dfe8ef', cx - 5, top + 10, 10, 4);
  px(c, '#4a5868', cx - 5, top + 12, 10, 1);
  // 天線
  px(c, '#c9ccd2', cx, top - 4, 1, 14);
  px(c, d.night && Math.floor(d.seconds * 1.5) % 2 === 0 ? '#ff4a3a' : '#c9ccd2', cx - 1, top - 5, 3, 2);
  if (d.night) glow(c, cx, top + 30, 26, '150, 200, 255', 0.35);
}
function drawDome(c: CanvasRenderingContext2D): void {
  const cx = 36 * T;
  const base = FK.horizon * T;
  c.fillStyle = '#c8d0d8';
  c.beginPath();
  c.ellipse(cx, base, 40, 16, 0, Math.PI, Math.PI * 2);
  c.fill();
  c.strokeStyle = 'rgba(120,135,150,0.6)';
  c.lineWidth = 1;
  for (const r of [14, 26]) {
    c.beginPath();
    c.ellipse(cx, base, r, 16, 0, Math.PI, Math.PI * 2);
    c.stroke();
  }
  px(c, '#e4e9ee', cx - 20, base - 13, 16, 2);
}
// 新幹線的高架（遠遠的一條），白色車身＋藍線的列車開過去
function drawShinkansen(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const y = Math.round(FK.horizon * T) - 3;
  px(c, '#9aa0a8', 0, y, W, 3);
  for (let x = 10; x < W; x += 46) px(c, '#8a909a', x, y + 3, 4, 3);
  const cycle = 24;
  const t = d.seconds % cycle;
  if (t > 9) return;
  const len = 170;
  const x = W + 20 - (t / 9) * (W + len + 40);
  c.save();
  c.beginPath();
  c.rect(0, y - 10, W, 10);
  c.clip();
  px(c, '#f4f6f8', x + 10, y - 7, len - 10, 7);
  c.fillStyle = '#f4f6f8';
  c.beginPath();
  c.moveTo(x + 12, y - 7);
  c.quadraticCurveTo(x - 2, y - 2, x, y);
  c.lineTo(x + 12, y);
  c.fill();
  px(c, '#1f5fa8', x + 4, y - 2, len - 4, 1);
  for (let k = x + 16; k < x + len - 4; k += 6) px(c, '#3a4a5a', k, y - 6, 4, 2);
  c.restore();
}

// ── 櫛田神社 ──
// 拜殿：石基座、木柱、白牆、大瓦屋頂＋正面的唐破風、注連繩、一排白燈籠
function haidenSprite(): HTMLCanvasElement {
  const w = Math.round((FK.haiden.x1 - FK.haiden.x0) * T);
  const h = 92;
  return cached('fk-haiden', w, h, (c) => {
    const cx = w / 2;
    // 基座、石階
    px(c, '#9a948a', 4, h - 8, w - 8, 8);
    px(c, '#b5ad9f', 4, h - 8, w - 8, 1);
    for (let k = 0; k < 3; k += 1) px(c, '#a8a294', cx - 18 - k * 3, h - 6 + k * 2, 36 + k * 6, 2);
    // 牆與柱
    px(c, '#efe8da', 10, 44, w - 20, h - 52);
    px(c, '#6a4428', 10, h - 24, w - 20, 16);
    for (let x = 12; x < w - 12; x += 4) px(c, '#523420', x, h - 23, 1, 14);
    for (let x = 10; x <= w - 14; x += 26) px(c, '#7a5232', x, 44, 4, h - 52);
    px(c, '#7a5232', w - 14, 44, 4, h - 52);
    px(c, '#5a3a22', 10, 44, w - 20, 3);
    // 正面中間：開著的門、賽錢箱、鈴
    px(c, '#2a1e18', cx - 22, 52, 44, h - 60);
    px(c, '#c9a24a', cx - 22, 52, 44, 1);
    px(c, '#5a3a22', cx - 14, h - 22, 28, 12);
    for (let x = cx - 12; x < cx + 12; x += 3) px(c, '#3a2618', x, h - 21, 1, 4);
    px(c, '#e8c060', cx - 3, 60, 6, 6);
    px(c, '#c8102e', cx - 1, 66, 2, 12);
    px(c, '#f4f0e6', cx, 66, 1, 12);
    // 屋頂（大瓦）、唐破風
    tiledRoof(c, 2, 8, w - 4, 34, '#4a4f58', 6);
    c.fillStyle = '#3d4249';
    c.beginPath();
    c.moveTo(cx - 34, 48);
    c.quadraticCurveTo(cx - 20, 46, cx - 12, 30);
    c.quadraticCurveTo(cx, 24, cx + 12, 30);
    c.quadraticCurveTo(cx + 20, 46, cx + 34, 48);
    c.lineTo(cx + 34, 50);
    c.lineTo(cx - 34, 50);
    c.fill();
    px(c, '#c9a24a', cx - 3, 31, 6, 4);
    px(c, '#c9a24a', cx - 34, 48, 68, 1);
    // 屋脊、鬼瓦
    px(c, '#33373e', 22, 6, w - 44, 4);
    px(c, '#33373e', 20, 3, 6, 6);
    px(c, '#33373e', w - 26, 3, 6, 6);
    // 注連繩（粗麻繩＋白色紙垂）
    c.strokeStyle = '#d8c48a';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(cx - 26, 52);
    c.quadraticCurveTo(cx, 60, cx + 26, 52);
    c.stroke();
    for (const dx of [-16, 0, 16]) {
      const yy = dx === 0 ? 58 : 55;
      px(c, '#ffffff', cx + dx - 1, yy, 3, 3);
      px(c, '#ffffff', cx + dx + 1, yy + 3, 3, 3);
      px(c, '#ffffff', cx + dx - 1, yy + 6, 3, 3);
    }
    // 屋簷下一排白燈籠（黑字的紋）
    for (let x = 18; x < w - 14; x += 14) {
      if (Math.abs(x - cx) < 28) continue;
      px(c, '#2a1a14', x - 1, 46, 2, 2);
      c.fillStyle = '#f6f1e4';
      c.beginPath();
      c.ellipse(x, 53, 4, 5, 0, 0, Math.PI * 2);
      c.fill();
      px(c, '#2a1a14', x - 3, 48, 6, 1);
      px(c, '#2a1a14', x - 3, 57, 6, 1);
      px(c, '#c8102e', x - 1, 52, 2, 2);
    }
    // 匾額
    px(c, '#2a1e18', cx - 14, 36, 28, 9);
    px(c, '#c9a24a', cx - 14, 36, 28, 1);
    text(c, '櫛田宮', cx, 41, '#e8c060', `900 6px ${SERIF_TC}`);
  });
}

// 石鳥居
function drawTorii(c: CanvasRenderingContext2D): void {
  const x0 = Math.round(FK.torii.x0 * T);
  const x1 = Math.round(FK.torii.x1 * T);
  const by = Math.round(FK.torii.line * T);
  const stone = '#aaa496';
  const dark = '#8a8476';
  for (const x of [x0, x1 - 6]) {
    px(c, 'rgba(0,0,0,0.2)', x - 2, by - 1, 10, 3);
    px(c, dark, x - 1, by - 4, 8, 4);
    px(c, stone, x, by - 56, 6, 52);
    px(c, 'rgba(255,255,255,0.25)', x, by - 56, 1, 52);
  }
  // 貫
  px(c, stone, x0 - 4, by - 46, x1 - x0 + 8, 5);
  px(c, dark, x0 - 4, by - 42, x1 - x0 + 8, 1);
  // 笠木（兩端微微翹）
  c.fillStyle = stone;
  c.beginPath();
  c.moveTo(x0 - 12, by - 62);
  c.quadraticCurveTo((x0 + x1) / 2, by - 58, x1 + 12, by - 62);
  c.lineTo(x1 + 10, by - 56);
  c.lineTo(x0 - 10, by - 56);
  c.fill();
  px(c, dark, x0 - 8, by - 57, x1 - x0 + 16, 1);
  // 額束（匾）
  const cx = Math.round((x0 + x1) / 2);
  px(c, dark, cx - 2, by - 56, 4, 10);
  px(c, '#6a645a', cx - 6, by - 54, 12, 8);
  text(c, '櫛田', cx, by - 50, '#e8e2d4', `700 5px ${SERIF_TC}`);
}

// 大銀杏（11 月正黃，繞著注連繩）
function drawGinkgo(c: CanvasRenderingContext2D): void {
  const cx = Math.round(FK.ginkgo.x * T);
  const by = Math.round(FK.ginkgo.y * T);
  px(c, 'rgba(0,0,0,0.22)', cx - 22, by - 1, 44, 4);
  for (let i = 0; i < 26; i += 1) px(c, i % 2 ? '#f2c230' : '#e8a820', cx - 24 + ((i * 37) % 48), by - 2 + ((i * 13) % 5), 2, 1);
  px(c, '#5c4632', cx - 5, by - 30, 10, 30);
  px(c, '#6e5640', cx - 5, by - 30, 3, 30);
  px(c, '#d8c48a', cx - 6, by - 18, 12, 3);
  px(c, '#ffffff', cx - 2, by - 15, 2, 4);
  px(c, '#ffffff', cx + 2, by - 15, 2, 4);
  const blobs: [number, number, number, string][] = [
    [-14, -40, 13, '#e0a21c'],
    [14, -40, 13, '#e0a21c'],
    [0, -56, 15, '#eab52a'],
    [-10, -64, 10, '#f2c640'],
    [10, -62, 11, '#f2c640'],
    [0, -42, 12, '#f6d24a'],
  ];
  for (const [dx, dy, r, col] of blobs) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#fbe27a', cx - 6, by - 70, 4, 2);
  px(c, '#fbe27a', cx + 8, by - 50, 4, 2);
}

// 飾山笠：玻璃展示屋裡十幾公尺高的山車（黑漆台座、紅白水引、層層的武者人形、城、浪、松）
function yamakasaSprite(): HTMLCanvasElement {
  const w = Math.round((FK.yamakasa.x1 - FK.yamakasa.x0) * T);
  const h = 158;
  return cached('fk-yamakasa', w, h, (c) => {
    const cx = w / 2;
    // 展示屋：深色的牆、柱、屋頂
    px(c, '#2e2622', 4, 18, w - 8, h - 22);
    px(c, '#9a948a', 0, h - 4, w, 4);
    px(c, '#5a3a22', 2, 18, 4, h - 22);
    px(c, '#5a3a22', w - 6, 18, 4, h - 22);
    tiledRoof(c, 2, 2, w - 4, 18, '#4a4f58', 4);
    // 台座：黑漆、金邊、紅白的水引幕
    const baseY = h - 34;
    px(c, '#1a1414', 10, baseY, w - 20, 26);
    px(c, '#c9a24a', 10, baseY, w - 20, 2);
    px(c, '#c9a24a', 10, baseY + 24, w - 20, 2);
    px(c, '#c8102e', 12, baseY + 4, w - 24, 8);
    for (let x = 12; x < w - 12; x += 6) px(c, '#f4f0e6', x, baseY + 6, 3, 4);
    px(c, '#2a6a4a', 12, baseY + 13, w - 24, 9);
    text(c, '博多祇園山笠', cx, baseY + 17.5, '#e8c060', `900 6px ${SERIF_TC}`);
    // 柱子（台座四角的棒）
    px(c, '#e8e2d4', 12, baseY - 6, 3, 6);
    px(c, '#e8e2d4', w - 15, baseY - 6, 3, 6);
    // 最下面：白浪、藍色的海
    for (let k = 0; k < 6; k += 1) {
      c.fillStyle = k % 2 ? '#2f6fb8' : '#3f86d0';
      c.beginPath();
      c.arc(14 + k * ((w - 28) / 5), baseY - 4, 9, Math.PI, Math.PI * 2);
      c.fill();
      px(c, '#f4f6f8', 10 + k * ((w - 28) / 5), baseY - 10, 6, 2);
    }
    // 雲（金色）
    for (const [x, y] of [[16, 70], [w - 18, 78], [20, 44], [w - 20, 50]] as const) {
      c.fillStyle = '#e8c060';
      c.beginPath();
      c.arc(x, y, 7, 0, Math.PI * 2);
      c.arc(x + 7, y + 2, 5, 0, Math.PI * 2);
      c.fill();
    }
    // 城（左上）：白牆、黑瓦
    px(c, '#f4f0e6', 12, 54, 18, 12);
    tiledRoof(c, 10, 46, 22, 8, '#2a2e34', 3);
    px(c, '#f4f0e6', 15, 40, 12, 7);
    tiledRoof(c, 13, 34, 16, 7, '#2a2e34', 2);
    for (const x of [14, 20, 26]) px(c, '#3a3a40', x, 58, 3, 3);
    // 大武者（中間）：金色鍬形的頭盔、白臉、紅色鎧甲、拿長刀
    const by = baseY - 12;
    px(c, '#c8102e', cx - 12, by - 36, 24, 36);
    for (let y = by - 34; y < by - 2; y += 4) px(c, '#e8c060', cx - 12, y, 24, 1);
    px(c, '#1f3a8a', cx - 16, by - 36, 6, 18);
    px(c, '#1f3a8a', cx + 10, by - 36, 6, 18);
    px(c, '#f4e2c8', cx - 7, by - 52, 14, 14);
    px(c, '#1a1414', cx - 5, by - 47, 4, 1);
    px(c, '#1a1414', cx + 1, by - 47, 4, 1);
    px(c, '#1a1414', cx - 4, by - 45, 2, 2);
    px(c, '#1a1414', cx + 2, by - 45, 2, 2);
    px(c, '#c8102e', cx - 2, by - 41, 4, 1);
    px(c, '#2a2a30', cx - 9, by - 58, 18, 7);
    px(c, '#e8c060', cx - 9, by - 52, 18, 1);
    c.strokeStyle = '#f2c640';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 2, by - 58);
    c.quadraticCurveTo(cx - 12, by - 66, cx - 10, by - 76);
    c.moveTo(cx + 2, by - 58);
    c.quadraticCurveTo(cx + 12, by - 66, cx + 10, by - 76);
    c.stroke();
    // 長刀（斜的）
    c.strokeStyle = '#6a4428';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 22, by - 6);
    c.lineTo(cx + 24, by - 70);
    c.stroke();
    px(c, '#d6dae2', cx + 22, by - 78, 4, 10);
    // 右邊的小武者（藍色鎧甲）、旗
    px(c, '#2f6fb8', w - 26, by - 26, 12, 24);
    px(c, '#f4e2c8', w - 24, by - 36, 8, 9);
    px(c, '#2a2a30', w - 25, by - 39, 10, 4);
    px(c, '#1a1414', w - 23, by - 32, 2, 1);
    px(c, '#1a1414', w - 19, by - 32, 2, 1);
    px(c, '#3a3a40', 18, by - 40, 2, 38);
    px(c, '#f4f0e6', 20, by - 40, 9, 16);
    px(c, '#c8102e', 22, by - 34, 5, 5);
    // 最上面：松樹和一隻白鷺
    for (const [dx, dy, r] of [[-12, 26, 8], [0, 22, 9], [12, 26, 8], [-6, 30, 6], [6, 30, 6]] as const) {
      c.fillStyle = '#2f6a3a';
      c.beginPath();
      c.arc(cx + dx, dy, r, 0, Math.PI * 2);
      c.fill();
    }
    px(c, '#4a7a46', cx - 14, 24, 28, 2);
    px(c, '#f4f6f8', cx + 6, 16, 6, 4);
    px(c, '#f4f6f8', cx + 11, 13, 2, 4);
    px(c, '#e8b830', cx + 13, 13, 2, 1);
    // 展示屋的玻璃反光
    for (const x of [8, w - 20]) {
      c.strokeStyle = 'rgba(255,255,255,0.18)';
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(x, h - 40);
      c.lineTo(x + 12, 30);
      c.stroke();
    }
    // 名牌
    px(c, '#f4f0e6', w - 14, h - 22, 8, 16);
    text(c, '飾', w - 10, h - 18, '#2a1e18', `900 6px ${SERIF_TC}`);
    text(c, '山', w - 10, h - 11, '#2a1e18', `900 6px ${SERIF_TC}`);
  });
}

// 神社的提燈（晚上會亮）：拜殿屋簷下的白燈籠
function drawShrineGlow(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!d.night) return;
  const x0 = FK.haiden.x0 * T;
  const top = FK.haiden.line * T - 92;
  const w = (FK.haiden.x1 - FK.haiden.x0) * T;
  for (let x = 18; x < w - 14; x += 14) {
    if (Math.abs(x - w / 2) < 28) continue;
    glow(c, x0 + x, top + 53, 12, '255, 220, 160', 0.55);
  }
}

// ── JR 博多站：寬大的站房、中間挑高的玻璃大廳、「博多駅」的字和大時鐘 ──
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((FK.station.x1 - FK.station.x0) * T);
  const h = 124;
  return cached('fk-station', w, h, (c) => {
    const cx = w / 2;
    // 兩翼：米白石材、橫向的窗帶
    px(c, '#d9d4c8', 0, 14, w, h - 14);
    px(c, '#ebe7dd', 0, 14, w, 2);
    for (let y = 22; y < h - 26; y += 11) {
      px(c, '#4f6f8c', 6, y, w - 12, 6);
      for (let x = 6; x < w - 6; x += 10) px(c, '#6b8ca6', x, y, 1, 6);
    }
    // 屋頂庭園（綠色的一條）
    px(c, '#6f9a58', 4, 10, cx - 84, 4);
    px(c, '#6f9a58', cx + 80, 10, w - cx - 84, 4);
    // 中間的玻璃大廳
    px(c, '#3f5a72', cx - 74, 0, 148, h - 18);
    for (let x = cx - 70; x < cx + 70; x += 8) px(c, '#5f86a6', x, 4, 6, h - 26);
    for (let y = 10; y < h - 22; y += 10) px(c, '#3f5a72', cx - 72, y, 144, 1);
    px(c, '#c9ccd2', cx - 76, 0, 152, 3);
    // 招牌、時鐘
    px(c, '#f4f6f8', cx - 46, 12, 92, 22);
    px(c, '#c8102e', cx - 44, 14, 12, 18);
    text(c, 'JR', cx - 38, 23, '#ffffff', `900 6px ${FONT_TC}`);
    text(c, '博多駅', cx + 6, 20, '#1f2a44', `900 11px ${SERIF_TC}`);
    text(c, 'HAKATA STATION', cx + 6, 30, '#1f2a44', `700 5px ${FONT_TC}`);
    c.fillStyle = '#f4f6f8';
    c.beginPath();
    c.arc(cx, 50, 10, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#1f2a44';
    c.lineWidth = 1.5;
    c.stroke();
    c.beginPath();
    c.moveTo(cx, 50);
    c.lineTo(cx, 43);
    c.moveTo(cx, 50);
    c.lineTo(cx + 5, 52);
    c.stroke();
    // 一樓：雨遮、玻璃門
    px(c, '#2a3a4a', cx - 92, h - 22, 184, 4);
    px(c, '#3a4a5a', cx - 88, h - 18, 176, 18);
    for (let x = cx - 84; x < cx + 84; x += 14) px(c, '#9fd8ff', x, h - 16, 10, 16);
    // 兩翼的商店招牌（自己編的字）
    for (const [x, word, col] of [[40, '博多みやげ', '#c8102e'], [w - 70, 'デパート', '#1f5fa8']] as const) {
      px(c, '#f4f6f8', x - 26, h - 34, 52, 10);
      text(c, word, x, h - 29, col, `900 7px ${FONT_TC}`);
    }
    for (const x of [8, w - 64]) {
      px(c, '#2a3a4a', x, h - 20, 56, 20);
      for (let k = x + 4; k < x + 52; k += 12) px(c, '#f6dfae', k, h - 17, 8, 14);
    }
  });
}

// 站前廣場的燈飾樹（冬天的博多站燈海）：白天是一般的樹，晚上纏滿金色小燈
function drawIlluminatedTree(c: CanvasRenderingContext2D, x: number, y: number, d: DrawCtx): void {
  drawStreetTree(c, x, y);
  if (!d.night) return;
  const cx = x * T;
  const by = y * T;
  for (let k = 0; k < 18; k += 1) {
    const a = k * 2.39;
    const r = 3 + (k % 6) * 1.6;
    const tw = Math.sin(d.seconds * 3 + k) > -0.3;
    px(c, tw ? '#fff1a8' : '#c9a24a', Math.round(cx + Math.cos(a) * r * 1.4), Math.round(by - 24 + Math.sin(a) * r), 1, 1);
  }
  glow(c, cx, by - 24, 20, '255, 220, 140', 0.4);
}

// ── 中洲的霓虹大樓（看板的字都是自己編的）──
interface Bldg {
  x0: number;
  x1: number;
  h: number;
  wall: string;
  signs: { dx: number; words: string; color: string; rgb: string }[];
  roof?: { words: string; color: string; rgb: string };
}
const NEON: Record<string, { color: string; rgb: string }> = {
  pink: { color: '#ff5ab4', rgb: '255, 90, 180' },
  cyan: { color: '#4ae0ff', rgb: '74, 224, 255' },
  yellow: { color: '#ffd23f', rgb: '255, 210, 63' },
  red: { color: '#ff4a3a', rgb: '255, 74, 58' },
  green: { color: '#6aee8a', rgb: '106, 238, 138' },
  violet: { color: '#b48aff', rgb: '180, 138, 255' },
};
const sign = (dx: number, words: string, n: keyof typeof NEON) => ({ dx, words, color: NEON[n]?.color ?? '#ffd23f', rgb: NEON[n]?.rgb ?? '255, 210, 63' });
const BLDGS: Bldg[] = [
  { x0: 0, x1: 5, h: 84, wall: '#4e4a58', signs: [sign(12, '居酒屋', 'red'), sign(60, 'カラオケ', 'cyan')] },
  { x0: 5, x1: 9.6, h: 92, wall: '#5a4e48', signs: [sign(10, 'スナック', 'pink'), sign(54, '焼肉', 'yellow')] },
  { x0: 9.6, x1: 15.4, h: 88, wall: '#3e4a5a', signs: [sign(8, '酒場', 'green'), sign(78, 'ラウンジ', 'violet')], roof: { words: '中洲 NAKASU', ...(NEON.pink ?? { color: '#ff5ab4', rgb: '255, 90, 180' }) } },
  { x0: 15.4, x1: 20.4, h: 80, wall: '#62564e', signs: [sign(10, '博多', 'yellow'), sign(62, 'BAR', 'cyan')] },
  { x0: 20.4, x1: 25.6, h: 90, wall: '#4a5260', signs: [sign(12, 'ホルモン', 'red'), sign(66, '寿司', 'green')] },
  { x0: 29.4, x1: 34.8, h: 86, wall: '#504858', signs: [sign(12, '餃子', 'yellow'), sign(68, 'クラブ', 'pink')] },
  { x0: 34.8, x1: 40.4, h: 92, wall: '#3e4652', signs: [sign(10, '月あかり', 'violet'), sign(74, '居酒屋', 'red')], roof: { words: '那珂川', ...(NEON.cyan ?? { color: '#4ae0ff', rgb: '74, 224, 255' }) } },
  { x0: 40.4, x1: 45.6, h: 82, wall: '#5e5250', signs: [sign(10, 'カラオケ', 'green'), sign(62, '焼鳥', 'yellow')] },
  { x0: 45.6, x1: 50.6, h: 90, wall: '#46505c', signs: [sign(12, '水炊き', 'cyan'), sign(62, 'スナック', 'pink')] },
  { x0: 50.6, x1: 56, h: 86, wall: '#544a56', signs: [sign(10, 'BAR', 'red'), sign(66, '旅館', 'violet')] },
];
const signH = (words: string) => (/^[A-Z ]+$/.test(words) ? words.length * 7 + 6 : words.length * 10 + 6);

function bldgSprite(b: Bldg, i: number): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  return cached(`fk-bldg-${i}`, w, b.h, (c) => {
    const rand = seeded(400 + i * 17);
    px(c, b.wall, 0, 0, w, b.h);
    px(c, 'rgba(255,255,255,0.12)', 0, 0, w, 2);
    px(c, 'rgba(0,0,0,0.2)', w - 2, 0, 2, b.h);
    // 窗：一格格的，有的亮有的暗
    for (let y = 8; y < b.h - 26; y += 10) {
      for (let x = 24; x < w - 22; x += 9) {
        const lit = rand() < 0.45;
        px(c, lit ? '#e8d6a0' : '#2e3644', x, y, 6, 6);
        if (!lit) px(c, 'rgba(255,255,255,0.18)', x, y, 2, 1);
      }
    }
    // 一樓的店面：雨遮、亮著的玻璃、門口的小招牌
    px(c, '#1e1a22', 0, b.h - 22, w, 22);
    px(c, ['#c8102e', '#2a3a5a', '#1f6a4a', '#7a3a8a'][i % 4] ?? '#c8102e', 0, b.h - 24, w, 4);
    for (let x = 4; x < w - 8; x += 16) px(c, rand() < 0.5 ? '#f6dfae' : '#ffd0c0', x, b.h - 18, 12, 14);
    px(c, '#3a3036', Math.round(w / 2) - 5, b.h - 18, 10, 18);
  });
}

// 直式招牌：白天是白底彩字，晚上是暗底、亮邊、亮字，偶爾閃一下
function drawNeonSign(c: CanvasRenderingContext2D, x: number, top: number, words: string, color: string, night: boolean, on: boolean): void {
  const latin = /^[A-Z ]+$/.test(words);
  const h = signH(words);
  const w = 14;
  px(c, '#3a3d45', x + w, top + 4, 2, 2);
  px(c, '#3a3d45', x + w, top + h - 6, 2, 2);
  px(c, night ? '#16121c' : '#f4f1e8', x, top, w, h);
  px(c, on || !night ? color : '#4a4450', x, top, w, 1);
  px(c, on || !night ? color : '#4a4450', x, top + h - 1, w, 1);
  px(c, on || !night ? color : '#4a4450', x, top, 1, h);
  px(c, on || !night ? color : '#4a4450', x + w - 1, top, 1, h);
  const col = night ? (on ? '#ffffff' : '#5a5060') : color;
  const step = latin ? 7 : 10;
  [...words].forEach((ch, k) => text(c, ch, x + w / 2, top + 6 + k * step, col, `900 ${latin ? 7 : 9}px ${FONT_TC}`));
  if (night && on) {
    [...words].forEach((ch, k) => text(c, ch, x + w / 2, top + 6 + k * step, color, `900 ${latin ? 7 : 9}px ${FONT_TC}`));
    c.globalAlpha = 0.55;
    [...words].forEach((ch, k) => text(c, ch, x + w / 2 - 0.5, top + 5.5 + k * step, '#ffffff', `900 ${latin ? 6 : 8}px ${FONT_TC}`));
    c.globalAlpha = 1;
  }
}

function neonOn(seconds: number, seed: number): boolean {
  return (Math.floor(seconds * 2.5 + seed * 3.7) % 11) !== 0;
}

function drawBldg(c: CanvasRenderingContext2D, b: Bldg, i: number, d: DrawCtx): void {
  const x0 = Math.round(b.x0 * T);
  const by = Math.round(FK.nakasuLine * T);
  blit(c, bldgSprite(b, i), x0, by);
  b.signs.forEach((s, k) => drawNeonSign(c, x0 + s.dx, by - b.h + 8, s.words, s.color, d.night, neonOn(d.seconds, i * 2 + k)));
  if (b.roof) {
    const w = Math.round((b.x1 - b.x0) * T);
    const top = by - b.h - 14;
    px(c, '#3a3d45', x0 + 10, top + 12, 2, 4);
    px(c, '#3a3d45', x0 + w - 12, top + 12, 2, 4);
    px(c, d.night ? '#16121c' : '#f4f1e8', x0 + 4, top, w - 8, 13);
    px(c, b.roof.color, x0 + 4, top, w - 8, 1);
    px(c, b.roof.color, x0 + 4, top + 12, w - 8, 1);
    const on = !d.night || neonOn(d.seconds * 0.7, i + 5);
    text(c, b.roof.words, x0 + w / 2, top + 6.5, d.night ? (on ? b.roof.color : '#5a5060') : b.roof.color, `900 9px ${FONT_TC}`);
  }
}

// 巷子口的霓虹拱門「中洲」
function drawAlleyArch(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(FK.alley.x0 * T) + 3;
  const x1 = Math.round(FK.alley.x1 * T) - 3;
  const by = Math.round(FK.nakasuLine * T);
  for (const x of [x0, x1 - 3]) {
    px(c, 'rgba(0,0,0,0.25)', x - 1, by - 1, 5, 2);
    px(c, '#3a3d45', x, by - 46, 3, 46);
  }
  px(c, d.night ? '#16121c' : '#2a2e36', x0 - 2, by - 56, x1 - x0 + 4, 12);
  for (let x = x0, k = 0; x < x1; x += 5, k += 1) {
    const lit = d.night ? (k + Math.floor(d.seconds * 4)) % 4 !== 0 : false;
    px(c, lit ? '#ffd23f' : '#8a8470', x, by - 44, 2, 2);
  }
  text(c, '中洲 · NAKASU', (x0 + x1) / 2, by - 50, d.night ? '#ff8ad0' : '#f4f1e8', `900 7px ${FONT_TC}`);
}

// ── 屋台：木造的攤車、屋頂板、上面的招牌、兩邊的塑膠布簾、捲起來的前簾、暖簾、紅燈籠、老闆、鍋子 ──
const YW = 80;
const YH = 82;
function yataiSprite(y: Yatai, i: number): HTMLCanvasElement {
  return cached(`fk-yatai-${i}`, YW, YH, (c) => {
    const cx = YW / 2;
    const b = YH;
    // 後面：暗暗的廚房、架子上的酒瓶、碗
    px(c, '#3a2a22', 6, b - 64, YW - 12, 50);
    px(c, '#5a4030', 8, b - 52, YW - 16, 2);
    for (let x = 10; x < YW - 10; x += 5) px(c, ['#2a6a3a', '#8a5a2a', '#f4f0e6', '#4a6a9a'][(x / 5) % 4] ?? '#f4f0e6', x, b - 58, 3, 6);
    px(c, '#5a4030', 8, b - 40, YW - 16, 2);
    for (let x = 12; x < YW - 12; x += 8) px(c, '#e8e2d4', x, b - 44, 6, 4);
    // 老闆（頭上綁白毛巾）
    const owner = getAvatarFrame(lookColors((i * 3) % 5, 2 + (i % 4), { body: i % 2 }), 'down', 'idle');
    const ox = Math.round(cx - owner.width / 2 + (i % 2 ? 10 : -10));
    const oy = b - 20 - owner.height + 6;
    c.drawImage(owner, ox, oy);
    px(c, '#f4f6f8', ox + Math.round(owner.width / 2) - 6, oy + 3, 12, 2);
    // 檯面上的料理
    const ty = b - 16;
    if (y.food === 'ramen') {
      px(c, '#c9ccd6', 8, ty - 14, 16, 14);
      px(c, '#e8ebf0', 8, ty - 14, 16, 2);
      px(c, '#9aa3b2', 6, ty - 13, 2, 3);
      for (let x = 30; x < YW - 10; x += 12) {
        px(c, '#f4f0e6', x, ty - 4, 10, 4);
        px(c, '#c8102e', x, ty - 2, 10, 1);
      }
    } else if (y.food === 'onigiri') {
      for (let x = 10; x < YW - 10; x += 9) {
        c.fillStyle = '#f8f6f0';
        c.beginPath();
        c.moveTo(x, ty);
        c.lineTo(x + 3.5, ty - 6);
        c.lineTo(x + 7, ty);
        c.fill();
        px(c, '#1a2a1a', x + 1, ty - 2, 5, 2);
        px(c, '#e8584a', x + 3, ty - 4, 1, 1);
      }
    } else if (y.food === 'nabe') {
      for (const x of [16, YW - 26]) {
        px(c, '#3a3d45', x - 2, ty - 3, 14, 3);
        c.fillStyle = '#c9a24a';
        c.beginPath();
        c.ellipse(x + 5, ty - 5, 8, 4, 0, 0, Math.PI * 2);
        c.fill();
        px(c, '#5aa04a', x, ty - 7, 10, 2);
        px(c, '#f4e8c8', x + 2, ty - 6, 3, 1);
        px(c, '#e8e2d4', x + 6, ty - 8, 3, 2);
      }
    } else if (y.food === 'yakitori') {
      px(c, '#2a2a30', 10, ty - 6, YW - 20, 6);
      px(c, '#e8584a', 12, ty - 2, YW - 24, 1);
      for (let x = 14; x < YW - 14; x += 5) {
        px(c, '#d6c4a0', x, ty - 9, 1, 4);
        px(c, '#8a4a2a', x - 1, ty - 9, 3, 3);
      }
    } else {
      px(c, '#9aa3b2', 12, ty - 8, YW - 24, 8);
      for (let x = 14; x < YW - 14; x += 10) {
        px(c, '#c9a070', x, ty - 7, 8, 6);
        px(c, '#f4f0e6', x + 1, ty - 6, 3, 3);
        px(c, '#a85a3a', x + 5, ty - 5, 2, 3);
      }
    }
    // 屋頂板、上面的招牌
    px(c, '#4a3222', -2, b - 72, YW + 4, 6);
    px(c, '#7a5638', -2, b - 72, YW + 4, 2);
    px(c, '#f4f0e6', cx - 18, b - 82, 36, 10);
    px(c, '#2a1e18', cx - 18, b - 82, 36, 1);
    text(c, y.sign, cx, b - 76.5, '#1a1414', `900 8px ${SERIF_TC}`);
    // 前面捲起來的塑膠布
    px(c, 'rgba(230,236,242,0.9)', 4, b - 66, YW - 8, 4);
    px(c, 'rgba(255,255,255,0.9)', 4, b - 66, YW - 8, 1);
    // 暖簾（四片）
    const dark = y.norenColor !== '#f4efe2';
    for (let k = 0; k < 4; k += 1) {
      const nx = 10 + k * 15;
      px(c, y.norenColor, nx, b - 62, 14, 14);
      px(c, 'rgba(0,0,0,0.15)', nx, b - 49, 14, 1);
    }
    const chars = [...y.noren];
    const spacing = 60 / chars.length;
    chars.forEach((ch, k) => text(c, ch, 10 + spacing * (k + 0.5), b - 55, dark ? '#ffffff' : '#1a1414', `900 8px ${SERIF_TC}`));
    // 兩邊的塑膠布簾（半透明、有皺摺）
    for (const sx of [0, YW - 8]) {
      px(c, 'rgba(225,232,240,0.55)', sx, b - 66, 8, 54);
      for (let k = 1; k < 8; k += 3) px(c, 'rgba(255,255,255,0.55)', sx + k, b - 64, 1, 50);
      px(c, 'rgba(190,200,212,0.7)', sx, b - 13, 8, 2);
    }
    // 檯面（木頭）、攤車前板
    px(c, '#8a5a32', 2, b - 16, YW - 4, 4);
    px(c, '#b5804a', 2, b - 16, YW - 4, 1);
    px(c, '#5a3a22', 4, b - 12, YW - 8, 10);
    for (let x = 4; x < YW - 4; x += 12) px(c, '#4a3020', x, b - 12, 1, 10);
    // 檯面上的小東西：筷子筒、杯子、面紙
    px(c, '#c8102e', 8, b - 20, 4, 4);
    px(c, '#e8e2d4', 9, b - 22, 1, 2);
    px(c, '#bfe0f0', YW - 14, b - 20, 4, 4);
    px(c, '#f4f6f8', YW - 24, b - 19, 6, 3);
    // 車輪
    for (const wx of [8, YW - 8]) {
      c.fillStyle = '#3a2a1e';
      c.beginPath();
      c.arc(wx, b - 4, 5, 0, Math.PI * 2);
      c.fill();
      px(c, '#7a5638', wx - 1, b - 8, 2, 8);
      px(c, '#7a5638', wx - 4, b - 5, 8, 2);
    }
  });
}

function drawYatai(c: CanvasRenderingContext2D, y: Yatai, i: number, d: DrawCtx): void {
  const x0 = Math.round(y.x * T - YW / 2);
  const by = Math.round(FK.yatai * T);
  px(c, 'rgba(0,0,0,0.25)', x0 - 2, by - 1, YW + 4, 4);
  blit(c, yataiSprite(y, i), x0, by);
  // 紅燈籠（兩角）
  drawLantern(c, x0 + 4, by - 64, '#d8382a', d.night);
  drawLantern(c, x0 + YW - 4, by - 64, '#d8382a', d.night);
  // 裸燈泡
  px(c, d.night ? '#fff1a8' : '#e8e2c4', x0 + YW / 2 - 1, by - 64, 3, 3);
  if (d.night) glow(c, x0 + YW / 2, by - 50, 30, '255, 210, 140', 0.35);
  // 鍋子、炭火的煙
  for (let k = 0; k < 3; k += 1) {
    const t = (d.seconds * 0.5 + k / 3 + i * 0.27) % 1;
    const sx = x0 + (y.food === 'ramen' ? 16 : YW / 2 - 10 + k * 10) + Math.sin(d.seconds * 1.6 + k + i) * 2;
    px(c, `rgba(255,255,255,${0.45 * (1 - t)})`, Math.round(sx), Math.round(by - 32 - t * 22), 3, 2);
  }
}

// 關東煮屋台前坐著的兩位客人（裝飾，不是座位）
function drawOdenGuests(c: CanvasRenderingContext2D): void {
  const y = YATAI[4];
  if (!y) return;
  drawLongBench(c, y.x, YATAI_SEAT_Y);
  [-0.6, 0.6].forEach((dx, k) => {
    const sprite = getAvatarFrame(lookColors(k + 2, k * 3 + 1, { body: k }), 'up', 'idle');
    c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SEATED_ROWS, Math.round((y.x + dx) * T - AVATAR_SIZE.w / 2), Math.round(YATAI_SEAT_Y * T) - 2 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
  });
}

// 屋台前的長凳（一張坐兩個人）
function drawLongBench(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.22)', cx - 20, by + 1, 40, 3);
  px(c, '#9a6a3a', cx - 20, by - 5, 40, 4);
  px(c, '#c08a52', cx - 20, by - 5, 40, 1);
  px(c, '#5a3a22', cx - 18, by - 1, 3, 3);
  px(c, '#5a3a22', cx + 15, by - 1, 3, 3);
}

// ── 那珂川：霓虹倒影、遊船（從橋下穿過去）──
function drawRiver(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const y0 = FK.riverY0 * T;
  const y1 = FK.riverY1 * T;
  c.save();
  c.beginPath();
  c.rect(0, y0, FK.bridge.x0 * T, y1 - y0);
  c.rect(FK.bridge.x1 * T, y0, W - FK.bridge.x1 * T, y1 - y0);
  c.clip();
  // 倒影：每塊招牌在河面上一條條晃動的光
  BLDGS.forEach((b, i) => {
    b.signs.forEach((s, k) => {
      const x = b.x0 * T + s.dx + 7;
      const on = neonOn(d.seconds, i * 2 + k);
      for (let yy = y0 + 4; yy < y1 - 4; yy += 3) {
        const wob = Math.sin(yy * 0.35 + d.seconds * 2.2 + i) * 2.5;
        const fade = 1 - (yy - y0) / (y1 - y0);
        const a = d.night ? (on ? 0.55 : 0.15) * fade + 0.05 : 0.12 * fade;
        c.fillStyle = d.night ? `rgba(${s.rgb}, ${a})` : `rgba(255,255,255,${a})`;
        c.fillRect(Math.round(x + wob - 3), yy, 6 + ((yy >> 2) % 3), 1);
      }
    });
  });
  // 屋台燈籠的倒影
  if (d.night) {
    c.fillStyle = 'rgba(255,120,80,0.25)';
    for (const y of YATAI) {
      for (let yy = y0 + 2; yy < y0 + 40; yy += 3) c.fillRect(Math.round(y.x * T - 3 + Math.sin(yy * 0.4 + d.seconds * 2) * 2), yy, 6, 1);
    }
  }
  // 遊船：屋形船（屋頂、紅燈籠）
  const span = W + 240;
  const bx = W + 120 - ((d.seconds * 9) % span);
  const by = (FK.riverY0 + 3.6) * T;
  px(c, 'rgba(0,0,0,0.25)', bx - 44, by + 2, 92, 4);
  px(c, '#6a4428', bx - 44, by - 8, 92, 10);
  px(c, '#8a5a32', bx - 44, by - 8, 92, 2);
  c.fillStyle = '#6a4428';
  c.beginPath();
  c.moveTo(bx - 44, by - 8);
  c.lineTo(bx - 54, by - 12);
  c.lineTo(bx - 44, by + 2);
  c.fill();
  px(c, '#f4f0e6', bx - 32, by - 22, 70, 14);
  for (let k = bx - 28; k < bx + 34; k += 9) px(c, d.night ? '#ffd98a' : '#c9dbe6', k, by - 19, 6, 7);
  tiledRoof(c, bx - 36, by - 30, 78, 8, '#3d4249', 3);
  for (let k = 0; k < 6; k += 1) drawLantern(c, bx - 30 + k * 13, by - 21, '#d8382a', d.night);
  c.restore();
}

// ── 對岸的長椅（背對畫面看河）：座板在人後面，椅背畫在人前面 ──
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = FUKUOKA_SEATS[i];
  if (!s) return;
  if (i < 8) {
    if (i % 2 === 0) drawLongBench(c, s.x + 0.6, s.y);
    return;
  }
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  px(c, 'rgba(0,0,0,0.2)', x - 9, y + 1, 18, 2);
  px(c, '#8a5a32', x - 9, y - 4, 18, 4);
  px(c, '#a8703f', x - 9, y - 4, 18, 1);
}
function drawSeatFront(c: CanvasRenderingContext2D, i: number): void {
  if (i < 8) return;
  const s = FUKUOKA_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  px(c, '#a8703f', x - 9, y - 7, 18, 3);
  px(c, '#8a5a32', x - 9, y - 4, 18, 1);
  if (i % 2 === 0) px(c, '#3a3d45', x - 8, y - 4, 2, 6);
  else px(c, '#3a3d45', x + 6, y - 4, 2, 6);
}

const LAMPS: [number, number][] = [[2, 14.2], [16, 14.2], [24.4, 14.2], [33, 14.2], [55, 14.2], [8.6, 25.3], [27.5, 25.3], [44.8, 25.3], [45.5, 29.6], [50.5, 29.6], [45.5, 37.8], [50.5, 37.8], [10, 38.4], [25, 38.4], [41, 38.4]];
const WILLOWS: [number, number][] = [[4, 38.2], [21, 38.2], [29, 38.2], [38, 38.2], [54, 38.2]];
const SAKURAS: [number, number][] = [[3, 44], [12, 44], [23, 44], [34, 44], [44, 44], [53, 44]];
const PLAZA_TREES: [number, number][] = [[26, 10.6], [30.6, 10.6], [37, 13.0], [51, 13.0]];
const STONE_LANTERNS: [number, number][] = [[10, 12.4], [16, 12.4]];

const props: CityProp[] = [
  { y: 0, draw: (c, d) => drawShinkansen(c, d) },
  { y: 0.1, draw: (c, d) => drawFukuokaTower(c, d) },
  { y: 0.1, draw: (c) => drawDome(c) },
  { y: FK.haiden.line, draw: (c) => blit(c, haidenSprite(), FK.haiden.x0 * T, FK.haiden.line * T) },
  { y: FK.haiden.line + 0.01, draw: (c, d) => drawShrineGlow(c, d) },
  { y: FK.yamakasa.line, draw: (c) => blit(c, yamakasaSprite(), FK.yamakasa.x0 * T, FK.yamakasa.line * T) },
  { y: FK.ginkgo.y, draw: (c) => drawGinkgo(c) },
  { y: FK.torii.line, draw: (c) => drawTorii(c) },
  ...STONE_LANTERNS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStoneLantern(c, x, y, d.night) })),
  { y: FK.station.line, draw: (c) => blit(c, stationSprite(), FK.station.x0 * T, FK.station.line * T) },
  ...PLAZA_TREES.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawIlluminatedTree(c, x, y, d) })),
  ...BLDGS.map((b, i): CityProp => ({ y: FK.nakasuLine, draw: (c, d) => drawBldg(c, b, i, d) })),
  { y: FK.nakasuLine + 0.01, draw: (c, d) => drawAlleyArch(c, d) },
  ...YATAI.map((y, i): CityProp => ({ y: FK.yatai, draw: (c, d) => drawYatai(c, y, i, d) })),
  { y: YATAI_SEAT_Y, draw: (c) => drawOdenGuests(c) },
  { y: FK.riverY0, draw: (c, d) => drawRiver(c, d) },
  ...WILLOWS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawWillow(c, x, y, d.seconds) })),
  ...SAKURAS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawSakura(c, x, y, d.seconds) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, FK.W, FK.horizon + 0.2),
  // 神社後面的森、拜殿、飾山笠、大銀杏、鳥居的柱子
  r(0, FK.horizon, FK.shrineX1, FK.haiden.line - 0.8),
  r(FK.haiden.x0 + 0.3, FK.haiden.line - 0.8, FK.haiden.x1 - 0.3, FK.haiden.line - 0.05),
  r(FK.yamakasa.x0, FK.haiden.line - 0.8, FK.yamakasa.x1, FK.yamakasa.line - 0.05),
  r(FK.ginkgo.x - 0.5, FK.ginkgo.y - 0.6, FK.ginkgo.x + 0.5, FK.ginkgo.y),
  r(FK.torii.x0, FK.torii.line - 0.4, FK.torii.x0 + 0.4, FK.torii.line),
  r(FK.torii.x1 - 0.4, FK.torii.line - 0.4, FK.torii.x1, FK.torii.line),
  ...STONE_LANTERNS.map(([x, y]) => r(x - 0.3, y - 0.3, x + 0.3, y)),
  // 小公園的樹叢、博多站
  r(FK.shrineX1, FK.horizon, FK.station.x0, 9.8),
  r(FK.station.x0, FK.horizon, FK.W, FK.station.line - 0.05),
  ...PLAZA_TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  // 中洲的大樓（巷子可以走）、拱門的柱子
  r(0, FK.road.y1, FK.alley.x0 + 0.2, FK.nakasuLine - 0.05),
  r(FK.alley.x1 - 0.2, FK.road.y1, FK.W, FK.nakasuLine - 0.05),
  // 屋台、關東煮屋台前的客人
  ...YATAI.map((y) => r(y.x - 2.5, FK.yatai - 1.1, y.x + 2.5, FK.yatai - 0.05)),
  r((YATAI[4]?.x ?? 41) - 1.3, YATAI_SEAT_Y - 0.5, (YATAI[4]?.x ?? 41) + 1.3, YATAI_SEAT_Y + 0.1),
  // 那珂川（橋可以走）
  r(0, FK.riverY0 - 0.3, FK.bridge.x0 + 0.4, FK.riverY1 + 0.3),
  r(FK.bridge.x1 - 0.4, FK.riverY0 - 0.3, FK.W, FK.riverY1 + 0.3),
  // 對岸
  r(0, FK.lawnY + 0.4, FK.W, FK.H),
  ...WILLOWS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  // 屋台：燈籠、裸燈泡
  ...YATAI.map((y) => ({ x: y.x * T, y: FK.yatai * T - 40, r: 70, color: 'rgba(255, 170, 110, 0.55)' })),
  ...YATAI.flatMap((y) => [-1, 1].map((k) => ({ x: y.x * T + k * 36, y: FK.yatai * T - 58, r: 22, color: 'rgba(255, 90, 60, 0.6)' }))),
  // 霓虹招牌
  ...BLDGS.flatMap((b) =>
    b.signs.map((s) => ({ x: b.x0 * T + s.dx + 7, y: FK.nakasuLine * T - b.h + 8 + signH(s.words) / 2, r: 30, color: `rgba(${s.rgb}, 0.5)` })),
  ),
  ...BLDGS.filter((b) => b.roof).map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: FK.nakasuLine * T - b.h - 8, r: 50, color: `rgba(${b.roof?.rgb ?? '255, 90, 180'}, 0.5)` })),
  // 大樓一樓的店面
  ...BLDGS.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: FK.nakasuLine * T - 10, r: 44, color: 'rgba(255, 210, 160, 0.35)' })),
  // 河面的倒影、遊船
  ...[6, 16, 26, 36].map((x) => ({ x: x * T, y: (FK.riverY0 + 2.5) * T, r: 70, color: 'rgba(220, 120, 220, 0.22)' })),
  { x: 27.5 * T, y: 21 * T, r: 60, color: 'rgba(255, 120, 200, 0.4)' },
  // 神社、車站、福岡塔
  { x: ((FK.haiden.x0 + FK.haiden.x1) / 2) * T, y: FK.haiden.line * T - 30, r: 80, color: 'rgba(255, 210, 150, 0.35)' },
  { x: ((FK.yamakasa.x0 + FK.yamakasa.x1) / 2) * T, y: FK.yamakasa.line * T - 70, r: 70, color: 'rgba(255, 220, 160, 0.4)' },
  { x: ((FK.station.x0 + FK.station.x1) / 2) * T, y: FK.station.line * T - 60, r: 120, color: 'rgba(200, 230, 255, 0.45)' },
  { x: FK.tower.x * T, y: 40, r: 40, color: 'rgba(150, 200, 255, 0.45)' },
  ...PLAZA_TREES.map(([x, y]) => ({ x: x * T, y: y * T - 24, r: 30, color: 'rgba(255, 220, 140, 0.45)' })),
];

const stationX = (FK.station.x0 + FK.station.x1) / 2;
const haidenX = (FK.haiden.x0 + FK.haiden.x1) / 2;

export const FUKUOKA: CityDef = {
  id: 'fukuoka',
  country: 'jp',
  line: 'jr',
  W: FK.W,
  H: FK.H,
  title: { 'zh-TW': '福岡 · 中洲屋台與博多', 'en-US': 'Fukuoka · Nakasu Yatai & Hakata' },
  stop: { 'zh-TW': '福岡（JR 博多站）', 'en-US': 'Fukuoka (JR Hakata)' },
  emoji: '🏮',
  station: {
    x: stationX,
    y: FK.station.line + 0.6,
    name: { 'zh-TW': 'JR 博多站', 'en-US': 'JR Hakata Station' },
    arrive: { x: stationX + 3, y: FK.station.line + 0.9 },
  },
  background: '#2a2a34',
  soundscape: 'market',
  paintGround: paintFukuokaGround,
  props,
  solid,
  seats: FUKUOKA_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  drawSeatFront: (c, i) => drawSeatFront(c, i),
  shops: FUKUOKA_SHOPS,
  fortune: {
    at: r(haidenX - 2.4, FK.haiden.line, haidenX + 2.4, FK.haiden.line + 1.6),
    label: { x: haidenX, y: FK.haiden.line - 6.2 },
    title: { 'zh-TW': '櫛田神社 · 御神籤', 'en-US': 'Kushida Shrine · Omikuji' },
    hint: { 'zh-TW': '向博多的總鎮守拍兩下手，抽一支籤。', 'en-US': 'Clap twice for Hakata’s guardian shrine and draw a fortune.' },
    draw: { 'zh-TW': '抽籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再抽一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great blessing' }, text: { 'zh-TW': '像扛著山笠衝刺的「追山」一樣，今天一口氣衝到終點！', 'en-US': 'Like the Oiyama race with the yamakasa on your shoulders — sprint to the finish today!' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Middle blessing' }, text: { 'zh-TW': '一碗豚骨拉麵不夠就「替玉」，專注不夠就再一顆番茄鐘。', 'en-US': 'One bowl not enough? Order kaedama. One pomodoro not enough? Do another.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small blessing' }, text: { 'zh-TW': '在屋台跟陌生人並肩坐著，也是一種一起努力。', 'en-US': 'Sitting shoulder to shoulder with strangers at a yatai is working together, too.' } },
      { rank: { 'zh-TW': '吉', 'en-US': 'Blessing' }, text: { 'zh-TW': '大銀杏活了幾百年，慢慢長也會長得很高。', 'en-US': 'The great ginkgo has stood for centuries — slow growth still grows tall.' } },
      { rank: { 'zh-TW': '末吉', 'en-US': 'Future blessing' }, text: { 'zh-TW': '好運在後面。去那珂川邊坐一下，看霓虹在水上晃。', 'en-US': 'Luck comes later. Sit by the Naka River and watch the neon ripple.' } },
    ],
  },
  infos: [
    { at: r(0, 23.8, 45, FK.yatai), title: { 'zh-TW': '中洲屋台', 'en-US': 'Nakasu Yatai' }, text: { 'zh-TW': '福岡是日本屋台最多的城市。傍晚老闆把木造攤車推到那珂川邊，掛上紅燈籠、暖簾和塑膠布簾，客人坐在長凳上跟老闆面對面吃豚骨拉麵、串燒、關東煮，跟隔壁的陌生人聊天，半夜才收攤。', 'en-US': 'Fukuoka has more yatai than any other Japanese city. At dusk the owners wheel their wooden carts to the Naka River, hang red lanterns, noren and plastic curtains, and guests sit on benches face to face with the cook — ramen, yakitori, oden and chats with strangers until late.' } },
    { at: r(0, FK.riverY0, FK.bridge.x0, FK.riverY1), title: { 'zh-TW': '那珂川', 'en-US': 'Naka River' }, text: { 'zh-TW': '流過福岡市中心的河，晚上中洲的霓虹倒映在水面上，是福岡最有名的夜景，也有屋形船遊河。（實際上那珂川是南北向，中洲是夾在那珂川和博多川中間的沙洲；這裡把它畫成橫的。）', 'en-US': 'The river through central Fukuoka; Nakasu’s neon reflected on it is the city’s classic night view, with river cruises too. (In reality it runs north–south and Nakasu is an island between the Naka and Hakata rivers — drawn horizontally here.)' } },
    { at: r(0, 17.4, FK.W, FK.nakasuLine), title: { 'zh-TW': '中洲', 'en-US': 'Nakasu' }, text: { 'zh-TW': '九州最大的夜生活街區，大約一公里長的沙洲上擠滿居酒屋、酒吧和霓虹招牌。江戶時代這裡是武士町「福岡」和商人町「博多」的交界。（招牌上的店名都是編的。）', 'en-US': 'Kyushu’s biggest nightlife district: a kilometre-long island packed with izakaya, bars and neon. In the Edo period it sat between samurai Fukuoka and merchant Hakata. (Shop names on the signs are made up.)' } },
    { at: r(FK.haiden.x0, FK.horizon, FK.haiden.x1, FK.haiden.line), title: { 'zh-TW': '櫛田神社', 'en-US': 'Kushida Shrine' }, text: { 'zh-TW': '傳說 757 年創建，博多的總鎮守，當地人叫它「お櫛田さん」。境內的大銀杏是福岡市的天然紀念物，每年 7 月的博多祇園山笠就是這裡的祭典。', 'en-US': 'Said to date from 757, the guardian shrine of Hakata, affectionately called “O-Kushida-san”. Its great ginkgo is a city natural monument, and the Hakata Gion Yamakasa festival each July belongs to this shrine.' } },
    { at: r(FK.yamakasa.x0, 2, FK.yamakasa.x1, FK.yamakasa.line), title: { 'zh-TW': '飾山笠', 'en-US': 'Kazari Yamakasa' }, text: { 'zh-TW': '博多祇園山笠有七百多年歷史。「飾山笠」是十幾公尺高、擺滿武者人形的裝飾山車，櫛田神社一年四季都展示一座；7 月 15 日清晨的「追山」，男人們扛著另一種「舁山笠」在街上衝刺。', 'en-US': 'The Hakata Gion Yamakasa festival is over 700 years old. A kazari yamakasa is a towering decorated float covered in warrior dolls; Kushida displays one all year. At dawn on July 15, teams race through the streets carrying the lighter kaki-yamakasa in the “Oiyama”.' } },
    { at: r(FK.tower.x - 1, 0, FK.tower.x + 1, FK.horizon), title: { 'zh-TW': '福岡塔', 'en-US': 'Fukuoka Tower' }, text: { 'zh-TW': '1989 年蓋的 234 公尺海濱塔，外牆貼了八千多片半反射玻璃，是日本最高的海濱塔，晚上會換燈光。旁邊圓圓的是福岡巨蛋。（實際上在西邊的百道濱海，這裡當遠景畫。）', 'en-US': 'A 234 m seaside tower from 1989, clad in over 8,000 half-mirror panels and lit in changing colours at night; the round roof beside it is the Fukuoka Dome. (Both are actually out west in Momochi — drawn as a distant view.)' } },
    { at: r(FK.station.x0, FK.station.line - 7, FK.station.x1, FK.station.line), title: { 'zh-TW': 'JR 博多站', 'en-US': 'JR Hakata Station' }, text: { 'zh-TW': '九州最大的車站，山陽新幹線的終點、九州新幹線的起點。2011 年蓋好的站房有百貨公司和屋頂庭園，冬天站前廣場會掛滿燈飾。到小倉約 15 分鐘、到廣島約 1 小時。', 'en-US': 'Kyushu’s biggest station: the end of the Sanyo Shinkansen and start of the Kyushu Shinkansen. The 2011 building has department stores and a rooftop garden, and the plaza glows with illuminations in winter. About 15 min to Kokura and 1 h to Hiroshima.' } },
  ],
  labels: [
    { x: 13, y: FK.riverY0 - 1.0, text: { 'zh-TW': '🏮 中洲屋台（長凳坐下，跟老闆面對面）', 'en-US': '🏮 Nakasu yatai (sit at the counter)' }, color: '#fca5a5' },
    { x: 25, y: FK.riverY1 + 3.6, text: { 'zh-TW': '🌉 那珂川河畔（看霓虹的長椅）', 'en-US': '🌉 Naka riverside (benches facing the neon)' }, color: '#bae6fd' },
  ],
  walkers: [
    { x0: 1, y0: 14.1, x1: 55, y1: 14.1, count: 4 },
    { x0: 1, y0: 24.4, x1: 55, y1: 24.4, count: 5 },
    { x0: 1, y0: 29.2, x1: 45, y1: 29.2, count: 3 },
    { x0: FK.alley.x0 + 1.8, y0: 17.6, x1: FK.alley.x0 + 1.8, y1: 23.8, count: 1 },
    { x0: 48, y0: 29.6, x1: 48, y1: 37.8, count: 2 },
    { x0: 1, y0: 40.4, x1: 55, y1: 40.4, count: 3 },
    { x0: 1, y0: 12.2, x1: 23, y1: 12.2, count: 2 },
  ],
  traffic: [
    { y: 15.5, dir: -1, x0: 0, x1: FK.W, count: 2 },
    { y: 16.6, dir: 1, x0: 0, x1: FK.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點屋台的長凳坐下，跟老闆面對面專注，或坐那珂川對岸的長椅看霓虹 · 走到屋台買豚骨拉麵、明太子飯糰、牛腸鍋、串燒 · 櫛田神社抽籤 · 點地標看介紹 · JR 博多站去其他日本城市或飛回台灣',
    'en-US': 'WASD / arrows to move · click a yatai bench to focus face to face with the cook, or a riverside bench facing the neon · walk up to the yatai for ramen, mentaiko onigiri, motsunabe and yakitori · draw a fortune at Kushida Shrine · click landmarks for info · JR Hakata to other Japanese cities or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點屋台長凳或河邊長椅坐下專注 · 走到屋台買東西 · 櫛田神社抽籤 · 點地標看介紹 · JR 博多站',
    'en-US': 'Tap a yatai bench or riverside bench to focus · visit the yatai · omikuji at Kushida · tap landmarks · JR Hakata',
  },
};
