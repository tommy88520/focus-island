// 吉隆坡的美術：熱帶的天空和遠方的天際線、武吉納納斯山丘上的吉隆坡塔、雙子星塔（八角星造型的層層收尖、空中天橋、尖頂，晚上整座亮白光）、
// KLCC 公園（湖、會跳舞的噴水池、雨樹、椰子樹、面向雙子星塔的長椅）、吉隆坡中央車站（機場快線從上面開過）、佳密清真寺（紅磚白帶、洋蔥圓頂、宣禮塔）、
// 獨立廣場（蘇丹阿都沙末大廈：摩爾式紅磚拱廊、銅色圓頂、鐘樓；草地上的超高旗桿和國旗）、亞羅街（彩色店屋、紅燈籠、沙爹煙、拉茶、榴槤山、塑膠桌椅）。
// 最後組成 CityScene 用的 KUALALUMPUR。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { ALOR_DECOR_TABLES, ALOR_STALLS, ALOR_TABLES, ALOR_TABLE_Y, KL, KL_SEATS, KL_SHOPS, PARK_BENCHES, PARK_BENCH_Y } from './kualalumpur';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, drawStool, drawPalm } from './cityArt';
import { drawLantern, drawStreetLamp } from './kyotoArt';

// ── 遠方的天際線（地面畫一次；晚上的窗戶另外畫）──
interface SkyBldg {
  x: number;
  w: number;
  h: number;
  col: string;
}
const SKYLINE: SkyBldg[] = (() => {
  const rand = seeded(1957);
  const out: SkyBldg[] = [];
  const cols = ['#9fb3c4', '#8ea4b8', '#b4c4d2', '#a6b8c8', '#93a9bd'];
  for (const [a, b] of [[0, 21], [35, 56]] as const) {
    for (let x = a * T; x < b * T; ) {
      const w = Math.min(18 + Math.floor(rand() * 22), b * T - x);
      out.push({ x, w, h: 40 + Math.floor(rand() * (x > 40 * T ? 110 : 70)), col: cols[Math.floor(rand() * cols.length)] ?? '#9fb3c4' });
      x += Math.max(4, w + Math.floor(rand() * 6) - 2);
    }
  }
  return out;
})();

export function paintKlGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1857);
  const W = KL.W * T;
  const top = KL.parkY0 * T;
  // 熱帶的天空、積雲
  const sky = c.createLinearGradient(0, 0, 0, top);
  sky.addColorStop(0, '#5aa8e6');
  sky.addColorStop(1, '#d8eef8');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, top);
  for (const [cx, cy, s] of [[60, 34, 1], [300, 22, 0.8], [640, 40, 1.2], [820, 18, 0.9]] as const) {
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (const [dx, dy, r] of [[0, 0, 14], [14, -6, 12], [28, 0, 13], [12, 6, 12], [-12, 5, 9], [40, 6, 8]] as const) {
      c.beginPath();
      c.arc(cx + dx * s, cy + dy * s, r * s, 0, Math.PI * 2);
      c.fill();
    }
  }
  // 天際線（遠一點的偏藍灰）
  for (const b of SKYLINE) {
    px(c, b.col, b.x, top - b.h, b.w, b.h);
    px(c, 'rgba(255,255,255,0.25)', b.x, top - b.h, 2, b.h);
    px(c, 'rgba(0,0,0,0.12)', b.x + b.w - 2, top - b.h, 2, b.h);
    for (let y = top - b.h + 5; y < top - 4; y += 5) for (let x = b.x + 3; x < b.x + b.w - 3; x += 5) px(c, 'rgba(70,90,115,0.35)', x, y, 3, 2);
  }
  // 武吉納納斯山丘（森林保護區）
  c.fillStyle = '#4f8a46';
  c.beginPath();
  c.moveTo(0, top);
  for (let x = 0; x <= 19 * T; x += 6) c.lineTo(x, top - 30 * Math.sin((x / (19 * T)) * Math.PI) - 4 * Math.sin(x * 0.07));
  c.lineTo(19 * T, top);
  c.fill();
  for (let i = 0; i < 70; i += 1) {
    const x = rand() * 19 * T;
    const y = top - rand() * 26 * Math.sin((x / (19 * T)) * Math.PI);
    c.fillStyle = rand() < 0.5 ? '#3f7a3c' : '#62a052';
    c.beginPath();
    c.arc(x, y, 3 + rand() * 4, 0, Math.PI * 2);
    c.fill();
  }
  // KLCC 公園：草地、湖邊的步道
  px(c, '#6eae4e', 0, top, W, (KL.road.y0 - KL.parkY0) * T);
  for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#62a246' : '#7cbc5a', Math.floor(rand() * W), Math.floor(top + rand() * (KL.road.y0 - KL.parkY0) * T), 2, 1);
  tiles(c, { x0: 12.6, y0: KL.parkY0, x1: 42.4, y1: 16.4 }, '#e4dccb', '#d2c8b4', 8);
  tiles(c, { x0: 12.6, y0: 20.8, x1: 42.4, y1: KL.road.y0 }, '#e4dccb', '#d2c8b4', 8);
  tiles(c, { x0: 0, y0: 22.4, x1: 12.6, y1: KL.road.y0 }, '#d6d8dc', '#c2c5cb', 16);
  tiles(c, { x0: 42.4, y0: 22.8, x1: KL.W, y1: KL.road.y0 }, '#e8e2d4', '#d6cdb8', 12);
  // 湖（噴水池）：石頭池邊、藍綠色的水
  const L = KL.lake;
  px(c, '#bdb4a2', L.x0 * T - 4, L.y0 * T - 4, (L.x1 - L.x0) * T + 8, (L.y1 - L.y0) * T + 8);
  const water = c.createLinearGradient(0, L.y0 * T, 0, L.y1 * T);
  water.addColorStop(0, '#4aa0c8');
  water.addColorStop(1, '#2f7ea8');
  c.fillStyle = water;
  c.fillRect(L.x0 * T, L.y0 * T, (L.x1 - L.x0) * T, (L.y1 - L.y0) * T);
  for (let i = 0; i < 40; i += 1) px(c, 'rgba(255,255,255,0.3)', Math.floor(L.x0 * T + rand() * (L.x1 - L.x0) * T - 6), Math.floor(L.y0 * T + 3 + rand() * ((L.y1 - L.y0) * T - 6)), 6, 1);
  // 噴嘴的一排小圓
  for (let x = L.x0 + 1.5; x < L.x1 - 1; x += 1.5) px(c, '#9aa6ae', Math.round(x * T) - 1, Math.round(18.7 * T), 3, 2);
  // 馬路
  road(c, { x0: 0, y0: KL.road.y0, x1: KL.W, y1: KL.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#f0d050', x, Math.round(((KL.road.y0 + KL.road.y1) / 2) * T), 12, 1);
  zebra(c, 22.4, KL.road.y0, 25, KL.road.y1, false);
  zebra(c, 12.8, KL.road.y0, 15.2, KL.road.y1, false);
  px(c, '#c9c4b8', 0, KL.road.y1 * T, W, 10);
  // 獨立廣場：大樓前的地磚、草地（板球場那樣的條紋）
  tiles(c, { x0: 0, y0: 27.8, x1: 22.4, y1: KL.padangY0 }, '#e0d6c2', '#cfc3aa', 12);
  for (let y = KL.padangY0 * T, k = 0; y < KL.southY * T; y += 12, k += 1) px(c, k % 2 ? '#5e9e44' : '#6aac4e', 0, y, 22.4 * T, 12);
  px(c, '#f2f0e8', 1 * T, Math.round(KL.padangY0 * T) + 6, 20.4 * T, 1);
  // 中間的人行道
  tiles(c, { x0: 22.4, y0: 27.8, x1: 25, y1: KL.southY }, '#d6d0c4', '#c4bcae', 8);
  // 亞羅街：騎樓（五腳基）、路面、水溝
  tiles(c, { x0: 25, y0: 27.8, x1: KL.W, y1: 32.6 }, '#c9b9a0', '#b4a48a', 8);
  px(c, '#5a5650', 25 * T, 32.6 * T, (KL.W - 25) * T, (KL.southY - 32.6) * T);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#524e48' : '#66625a', Math.floor(25 * T + rand() * (KL.W - 25) * T), Math.floor(32.6 * T + rand() * (KL.southY - 32.6) * T), 2, 1);
  px(c, '#3a3834', 25 * T, 32.6 * T, (KL.W - 25) * T, 2);
  for (let x = 25 * T; x < W; x += 6) px(c, '#6a665e', x, 32.6 * T, 3, 2);
  // 南邊的花台（擋住）
  px(c, '#4c8a3e', 0, KL.southY * T, W, (KL.H - KL.southY) * T);
  px(c, '#a8583a', 0, KL.southY * T, W, 4);
  px(c, '#c8785a', 0, KL.southY * T, W, 1);
  for (let i = 0; i < 90; i += 1) {
    c.fillStyle = rand() < 0.3 ? '#e8508a' : rand() < 0.5 ? '#3f7a34' : '#5e9e4a';
    c.beginPath();
    c.arc(rand() * W, KL.southY * T + 8 + rand() * 20, 2 + rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
}

// 天際線晚上亮的窗戶
function drawSkylineNight(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!d.night) return;
  const top = KL.parkY0 * T;
  SKYLINE.forEach((b, i) => {
    const rand = seeded(400 + i);
    for (let y = top - b.h + 5; y < top - 4; y += 5) for (let x = b.x + 3; x < b.x + b.w - 3; x += 5) if (rand() < 0.45) px(c, rand() < 0.7 ? '#ffe9a8' : '#cfe6ff', x, y, 3, 2);
    px(c, '#ff4a3a', b.x + Math.floor(b.w / 2), top - b.h - 2, 2, 2);
  });
}

// ── 吉隆坡塔：細長的混凝土塔身、頂端球形的觀景台、天線 ──
function klTowerSprite(night: boolean): HTMLCanvasElement {
  const w = 64;
  const h = 200;
  return cached(`kl-kltower-${night ? 'n' : 'd'}`, w, h, (c) => {
    const cx = w / 2;
    const row = (hgt: number, hw: number, left: string, right: string) => {
      const y = h - hgt;
      const a = Math.round(hw);
      px(c, left, cx - a, y, a, 1);
      px(c, right, cx, y, a, 1);
    };
    // 底下的大廳
    px(c, '#cfc8bc', cx - 16, h - 12, 32, 12);
    px(c, '#e4ded2', cx - 16, h - 12, 32, 2);
    px(c, night ? '#ffe2a0' : '#5a7a94', cx - 12, h - 8, 24, 6);
    // 塔身（往上慢慢變細）
    for (let hgt = 12; hgt < 140; hgt += 1) row(hgt, 5 - ((hgt - 12) / 128) * 1.6, '#ebe6dc', '#bdb5a8');
    for (const hgt of [40, 80, 118]) row(hgt, 6, '#d6cfc2', '#a8a092');
    // 觀景台：下面的碗、玻璃帶、白色的屋頂
    for (let hgt = 140; hgt < 152; hgt += 1) row(hgt, 4 + ((hgt - 140) / 12) * 15, '#e4ded2', '#b4ac9e');
    for (let hgt = 152; hgt < 163; hgt += 1) {
      const y = h - hgt;
      px(c, night ? '#ffe7a6' : '#4a6a8a', cx - 20, y, 40, 1);
      if (hgt % 4 === 0) px(c, night ? '#e8c070' : '#3a5670', cx - 20, y, 40, 1);
    }
    for (let x = cx - 18; x < cx + 20; x += 5) px(c, night ? '#c89a50' : '#2f4a64', x, h - 162, 1, 10);
    px(c, '#f4f1ea', cx - 21, h - 165, 42, 3);
    for (let hgt = 165; hgt < 172; hgt += 1) row(hgt, 20 - (hgt - 165) * 1.8, '#f4f1ea', '#cfc8bc');
    px(c, '#d6cfc2', cx - 6, h - 176, 12, 4);
    // 天線（紅白相間）
    for (let hgt = 176; hgt < 198; hgt += 1) px(c, Math.floor(hgt / 4) % 2 ? '#e8e4dc' : '#d8382a', cx - (hgt < 186 ? 1 : 0), h - hgt, hgt < 186 ? 3 : 2, 1);
  });
}
function drawKlTower(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = KL.klTower.x * T;
  const by = KL.klTower.line * T;
  blit(c, klTowerSprite(d.night), x - 32, by);
  if (d.night) {
    // 晚上塔身打彩色的燈（慢慢換顏色）、天線頂端的紅燈閃
    const hue = ['120, 180, 255', '200, 140, 255', '120, 230, 200'][Math.floor(d.seconds / 6) % 3] ?? '120, 180, 255';
    for (let k = 0; k < 6; k += 1) glow(c, x, by - 20 - k * 22, 12, hue, 0.35);
    if (Math.floor(d.seconds * 1.5) % 2 === 0) px(c, '#ff3a2a', x - 1, by - 200, 3, 3);
  }
}

// ── 雙子星塔：八角星的平面（每一面有折角）、六段收尖、尖頂；兩座之間的空中天橋（倒 V 的支架）、下面的購物中心 ──
const PT_W = 208;
const PT_H = 240;
const PT_X = [56, 152];
const PT_SECTIONS: [number, number, number][] = [
  [0, 128, 26],
  [128, 146, 23],
  [146, 161, 20],
  [161, 174, 17],
  [174, 186, 14],
  [186, 196, 11],
  [196, 204, 8],
];
function petronasSprite(night: boolean): HTMLCanvasElement {
  return cached(`kl-petronas-${night ? 'n' : 'd'}`, PT_W, PT_H, (c) => {
    const H = PT_H;
    // 每一面的顏色（左邊受光，右邊背光；折角一亮一暗）
    const facets = night ? ['#ffffff', '#e6eeff', '#f8fbff', '#d6e2f8', '#e8effc', '#c6d4ee', '#d8e2f6', '#b8c8e6'] : ['#f2f5f8', '#ccd6e0', '#e4eaf0', '#b6c2d0', '#cfd8e2', '#a2b0c0', '#b8c4d2', '#8e9cae'];
    for (const cx of PT_X) {
      for (const [h0, h1, hw] of PT_SECTIONS) {
        const y0 = H - h1;
        const hh = h1 - h0;
        for (let dx = -hw; dx < hw; dx += 1) {
          const t = (dx + hw) / (hw * 2);
          const f = Math.min(facets.length - 1, Math.floor(t * facets.length));
          px(c, facets[f] ?? '#ccd6e0', cx + dx, y0, 1, hh);
        }
        // 一層層的玻璃帶＋不鏽鋼遮陽板
        for (let y = y0 + 2; y < y0 + hh - 1; y += 4) px(c, night ? 'rgba(255,244,210,0.55)' : 'rgba(52,74,104,0.38)', cx - hw, y, hw * 2, 2);
        // 收尖的平台：亮亮的邊、一圈尖角
        px(c, night ? '#ffffff' : '#f6f8fa', cx - hw - 1, y0, hw * 2 + 2, 1);
        for (let dx = -hw; dx < hw; dx += 4) px(c, night ? '#ffffff' : '#dfe6ee', cx + dx + 1, y0 - 1, 2, 1);
        px(c, 'rgba(0,0,0,0.12)', cx + hw - 1, y0, 1, hh);
      }
      // 尖頂：一圈圈的環、球、細針
      for (let hgt = 204; hgt < 214; hgt += 1) {
        const r = hgt < 208 ? 5 : 4;
        px(c, hgt % 2 ? (night ? '#ffffff' : '#e6ecf2') : night ? '#dfe8fa' : '#a8b4c4', cx - r, H - hgt, r * 2, 1);
      }
      c.fillStyle = night ? '#ffffff' : '#dfe6ee';
      c.beginPath();
      c.arc(cx, H - 216, 3, 0, Math.PI * 2);
      c.fill();
      for (let hgt = 218; hgt < 238; hgt += 1) px(c, night ? '#ffffff' : '#c8d0da', cx - (hgt < 226 ? 1 : 0), H - hgt, hgt < 226 ? 2 : 1, 1);
    }
    // 空中天橋（41、42 樓）：兩層的橋、倒 V 的支架
    const l = (PT_X[0] ?? 56) + 26;
    const r = (PT_X[1] ?? 152) - 26;
    const mid = (l + r) / 2;
    c.strokeStyle = night ? '#f4f8ff' : '#b4bfcc';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(l, H - 68);
    c.lineTo(mid, H - 98);
    c.lineTo(r, H - 68);
    c.stroke();
    px(c, night ? '#f8fbff' : '#d6dde6', l, H - 104, r - l, 7);
    px(c, night ? '#ffe9a8' : '#4a6480', l, H - 102, r - l, 2);
    px(c, night ? '#ffe9a8' : '#4a6480', l, H - 99, r - l, 1);
    px(c, night ? '#ffffff' : '#eef2f6', l, H - 104, r - l, 1);
    // 底下的購物中心（弧形的玻璃）
    px(c, '#d4d9e0', 6, H - 18, PT_W - 12, 18);
    px(c, '#eef1f4', 6, H - 18, PT_W - 12, 2);
    for (let x = 10; x < PT_W - 10; x += 6) px(c, night ? '#ffd890' : '#7088a2', x, H - 14, 4, 9);
    px(c, '#b8bec8', 6, H - 4, PT_W - 12, 4);
    c.fillStyle = night ? '#fff4d8' : '#9fb8cf';
    c.beginPath();
    c.ellipse(PT_W / 2, H - 18, 16, 8, 0, Math.PI, Math.PI * 2);
    c.fill();
  });
}
function drawPetronas(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const by = KL.towers.line * T;
  const x0 = KL.towers.x * T - PT_W / 2;
  if (d.night) for (const cx of PT_X) glow(c, x0 + cx, by - 120, 90, '220, 235, 255', 0.25);
  blit(c, petronasSprite(d.night), x0, by);
  // 尖頂的航空警示燈
  if (d.night && Math.floor(d.seconds) % 2 === 0) for (const cx of PT_X) px(c, '#ff4030', x0 + cx - 1, by - PT_H + 1, 2, 2);
}

// ── KLCC 公園：音樂噴泉（一排水柱跳舞，晚上變色）──
function drawFountain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const L = KL.lake;
  const by = Math.round(18.7 * T);
  let k = 0;
  for (let x = L.x0 + 1.5; x < L.x1 - 1; x += 1.5, k += 1) {
    const cx = Math.round(x * T);
    const hgt = 8 + 16 * Math.abs(Math.sin(d.seconds * 1.1 + k * 0.55)) * (0.6 + 0.4 * Math.sin(d.seconds * 0.3));
    const col = d.night ? (['255, 120, 200', '120, 200, 255', '255, 220, 120', '140, 255, 180'][(k + Math.floor(d.seconds / 3)) % 4] ?? '255, 255, 255') : '240, 250, 255';
    c.fillStyle = `rgba(${col}, 0.75)`;
    c.fillRect(cx - 1, by - hgt, 2, hgt);
    c.fillStyle = `rgba(${col}, 0.5)`;
    c.fillRect(cx - 2, by - hgt - 2, 4, 3);
    for (let s = 0; s < 3; s += 1) {
      const t = (d.seconds * 1.5 + s / 3 + k * 0.2) % 1;
      c.fillRect(Math.round(cx + (s - 1) * (2 + t * 4)), Math.round(by - hgt + t * hgt * 0.8), 1, 1);
    }
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.fillRect(cx - 4, by, 8, 1);
  }
}

// 雨樹：熱帶的大樹，樹冠像一把扁扁的大傘
function drawRainTree(c: CanvasRenderingContext2D, x: number, y: number, s = 1): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 22 * s, by - 1, 44 * s, 4);
  px(c, '#5a4030', cx - 3, by - 22 * s, 6, 22 * s);
  c.strokeStyle = '#5a4030';
  c.lineWidth = 2;
  for (const dx of [-14, -6, 6, 14]) {
    c.beginPath();
    c.moveTo(cx, by - 18 * s);
    c.quadraticCurveTo(cx + dx * 0.4 * s, by - 26 * s, cx + dx * s, by - 30 * s);
    c.stroke();
  }
  const blobs: [number, number, number, string][] = [
    [-20, -32, 10, '#3a7034'],
    [20, -32, 10, '#3a7034'],
    [-10, -36, 12, '#447c3c'],
    [10, -36, 12, '#447c3c'],
    [0, -40, 12, '#4e8a44'],
    [-14, -40, 8, '#5a9a4c'],
    [14, -40, 8, '#5a9a4c'],
    [0, -44, 8, '#68a858'],
  ];
  for (const [dx, dy, r, col] of blobs) {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(cx + dx * s, by + dy * s, r * s * 1.2, r * s * 0.7, 0, 0, Math.PI * 2);
    c.fill();
  }
}

// 湖邊的長椅（面向雙子星塔，背對畫面）：座板畫在人後面，椅背畫在人前面
function drawParkBenchBase(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(PARK_BENCH_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 20, by + 1, 40, 3);
  px(c, '#8a5a32', cx - 20, by - 5, 40, 4);
  px(c, '#b5804a', cx - 20, by - 5, 40, 1);
}
function drawParkBenchBack(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(PARK_BENCH_Y * T);
  px(c, '#a8703f', cx - 20, by - 8, 40, 3);
  px(c, '#8a5a32', cx - 20, by - 4, 40, 2);
  px(c, '#3a3d45', cx - 18, by - 5, 2, 7);
  px(c, '#3a3d45', cx + 16, by - 5, 2, 7);
}

// ── 吉隆坡中央車站：白色的大樓、藍色玻璃、弧形屋頂；機場快線從上面的高架開過 ──
const ST_H = 72;
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((KL.station.x1 - KL.station.x0) * T);
  return cached('kl-station', w, ST_H, (c) => {
    const h = ST_H;
    // 高架
    px(c, '#9aa0a8', 0, 14, w, 4);
    px(c, '#c9ccd2', 0, 14, w, 1);
    for (let x = 10; x < w; x += 44) px(c, '#8a909a', x, 18, 5, 10);
    // 弧形屋頂
    c.fillStyle = '#f4f6f8';
    c.beginPath();
    c.moveTo(-2, 30);
    c.quadraticCurveTo(w / 2, 18, w + 2, 30);
    c.lineTo(w + 2, 34);
    c.lineTo(-2, 34);
    c.fill();
    px(c, '#dfe3e8', 0, 32, w, 2);
    // 大樓：玻璃格子
    px(c, '#e8eaee', 2, 34, w - 4, h - 34);
    for (let y = 38; y < h - 18; y += 6) for (let x = 6; x < w - 6; x += 8) px(c, (x + y) % 3 ? '#4f7aa0' : '#5f8ab0', x, y, 6, 4);
    // 站名牌
    const cx = w / 2;
    px(c, '#1f3a6a', cx - 42, 37, 84, 10);
    px(c, '#e8c040', cx - 42, 46, 84, 1);
    text(c, 'KL SENTRAL', cx, 42, '#ffffff', `900 8px ${FONT_TC}`);
    // 入口
    px(c, '#2a3a4a', cx - 34, h - 16, 68, 16);
    for (let x = cx - 30; x < cx + 30; x += 12) px(c, '#9fd8ff', x, h - 14, 9, 14);
    px(c, '#f4f6f8', cx - 38, h - 18, 76, 2);
    px(c, '#c9ccd2', 0, h - 3, w, 3);
  });
}
function drawStation(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = KL.station.x0 * T;
  const by = KL.station.line * T;
  blit(c, stationSprite(), x0, by);
  // 機場快線（紫色和銀色的車身）
  const w = (KL.station.x1 - KL.station.x0) * T;
  const top = by - ST_H + 4;
  const t = d.seconds % 16;
  if (t < 8) {
    const len = 130;
    const x = x0 + w - (t / 8) * (w + len);
    c.save();
    c.beginPath();
    c.rect(x0, top - 4, w, 16);
    c.clip();
    for (let k = 0; k < 3; k += 1) {
      const cx = x + k * 44;
      px(c, '#e6e8ec', cx, top, 42, 10);
      px(c, '#6a3a9a', cx, top + 6, 42, 3);
      for (let wx = cx + 4; wx < cx + 38; wx += 7) px(c, d.night ? '#ffe9a8' : '#3a4a5a', wx, top + 2, 4, 3);
    }
    c.restore();
  }
}

// 洋蔥圓頂：底寬 rx、高 hgt，右邊塗一點陰影
function onionDome(c: CanvasRenderingContext2D, cx: number, baseY: number, rx: number, hgt: number, col: string, shade: string, finial: string): void {
  const path = () => {
    c.beginPath();
    c.moveTo(cx - rx * 0.62, baseY);
    c.bezierCurveTo(cx - rx * 1.18, baseY - hgt * 0.2, cx - rx * 1.12, baseY - hgt * 0.6, cx - rx * 0.22, baseY - hgt * 0.84);
    c.quadraticCurveTo(cx, baseY - hgt * 0.9, cx, baseY - hgt);
    c.quadraticCurveTo(cx, baseY - hgt * 0.9, cx + rx * 0.22, baseY - hgt * 0.84);
    c.bezierCurveTo(cx + rx * 1.12, baseY - hgt * 0.6, cx + rx * 1.18, baseY - hgt * 0.2, cx + rx * 0.62, baseY);
    c.closePath();
  };
  c.fillStyle = col;
  path();
  c.fill();
  c.save();
  path();
  c.clip();
  c.fillStyle = shade;
  c.fillRect(cx + rx * 0.25, baseY - hgt, rx, hgt);
  c.fillStyle = 'rgba(255,255,255,0.35)';
  c.fillRect(cx - rx * 0.6, baseY - hgt * 0.65, 2, hgt * 0.4);
  c.restore();
  px(c, finial, Math.round(cx) - 1, Math.round(baseY - hgt - 5), 2, 6);
  px(c, finial, Math.round(cx) - 2, Math.round(baseY - hgt - 3), 4, 1);
}

// 一排馬蹄形的拱（紅磚上的白框）：x0 到 x1，拱頂 y0、拱腳 y1
function arches(c: CanvasRenderingContext2D, x0: number, x1: number, y0: number, y1: number, step: number, frame: string, inside: string): void {
  for (let x = x0; x + step - 2 <= x1; x += step) {
    const aw = step - 4;
    const r = aw / 2;
    c.fillStyle = frame;
    c.beginPath();
    c.arc(x + 2 + r, y0 + r + 1, r + 1, Math.PI, 0);
    c.fill();
    px(c, frame, x + 1, y0 + r + 1, aw + 2, y1 - y0 - r - 1);
    c.fillStyle = inside;
    c.beginPath();
    c.arc(x + 2 + r, y0 + r + 2, r - 0.5, Math.PI, 0);
    c.fill();
    px(c, inside, x + 2.5, y0 + r + 2, aw - 1, y1 - y0 - r - 2);
  }
}

// ── 佳密清真寺：紅磚白帶的拱廊、三個白色洋蔥圓頂、兩根宣禮塔 ──
const MQ_H = 128;
function mosqueSprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((KL.mosque.x1 - KL.mosque.x0) * T);
  return cached(`kl-mosque-${night ? 'n' : 'd'}`, w, MQ_H, (c) => {
    const h = MQ_H;
    const brick = '#b8583e';
    const white = '#f4efe2';
    const inside = night ? '#ffd890' : '#4a3028';
    const banded = (x: number, y: number, bw: number, bh: number) => {
      px(c, brick, x, y, bw, bh);
      for (let yy = y + 3; yy < y + bh; yy += 7) px(c, white, x, yy, bw, 2);
    };
    // 宣禮塔（紅白相間，上面一個小亭子）
    for (const mx of [12, w - 12]) {
      banded(mx - 5, h - 108, 10, 66);
      px(c, white, mx - 8, h - 94, 16, 3);
      px(c, white, mx - 7, h - 110, 14, 3);
      for (const dx of [-6, -1, 4]) px(c, white, mx + dx, h - 118, 2, 8);
      onionDome(c, mx, h - 118, 8, 10, white, '#d8d0c0', '#e8c040');
    }
    // 下面的拱廊
    banded(20, h - 42, w - 40, 42);
    px(c, white, 18, h - 44, w - 36, 3);
    arches(c, 24, w - 24, h - 36, h - 4, 16, white, inside);
    px(c, '#d8cfbf', 18, h - 4, w - 36, 4);
    // 上面的禮拜殿
    banded(44, h - 66, w - 88, 22);
    px(c, white, 42, h - 68, w - 84, 3);
    arches(c, 50, w - 50, h - 62, h - 46, 12, white, inside);
    // 屋頂邊上的小亭子（chhatri）
    for (const px0 of [28, w - 28, 48, w - 48]) {
      px(c, white, px0 - 4, h - 52, 2, 8);
      px(c, white, px0 + 2, h - 52, 2, 8);
      onionDome(c, px0, h - 52, 6, 8, white, '#d8d0c0', '#e8c040');
    }
    // 三個洋蔥圓頂（中間最大）
    for (const [dx, rx, hgt] of [[-34, 13, 26], [34, 13, 26], [0, 22, 42]] as const) {
      const cx = w / 2 + dx;
      px(c, brick, cx - rx * 0.75, h - 74, rx * 1.5, 8);
      px(c, white, cx - rx * 0.75, h - 72, rx * 1.5, 2);
      onionDome(c, cx, h - 74, rx, hgt, night ? '#fffaf0' : white, night ? '#e8dcc4' : '#d6cdbc', '#e8c040');
    }
  });
}

// ── 獨立廣場：蘇丹阿都沙末大廈（摩爾式紅磚、兩層馬蹄拱廊、中間鐘樓＋銅色圓頂）──
const SAS_H = 116;
function sasSprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((KL.sas.x1 - KL.sas.x0) * T);
  return cached(`kl-sas-${night ? 'n' : 'd'}`, w, SAS_H, (c) => {
    const h = SAS_H;
    const brick = '#b5553f';
    const white = '#f2ece0';
    const inside = night ? '#ffcf7a' : '#3e2a24';
    const copper = '#b8743a';
    const copperShade = '#8a5426';
    // 主樓
    px(c, brick, 0, h - 54, w, 54);
    for (let y = h - 50; y < h; y += 6) px(c, 'rgba(0,0,0,0.06)', 0, y, w, 1);
    px(c, white, 0, h - 56, w, 3);
    px(c, white, 0, h - 31, w, 2);
    arches(c, 4, w - 4, h - 50, h - 33, 16, white, inside);
    arches(c, 4, w - 4, h - 28, h - 4, 16, white, inside);
    px(c, '#d8cfbf', 0, h - 4, w, 4);
    // 女兒牆的小尖柱
    for (let x = 6; x < w; x += 16) {
      px(c, white, x, h - 60, 3, 4);
      px(c, white, x + 1, h - 62, 1, 2);
    }
    // 兩側的塔＋銅頂
    for (const tx of [64, w - 64]) {
      px(c, brick, tx - 11, h - 74, 22, 20);
      px(c, white, tx - 12, h - 76, 24, 2);
      for (const dx of [-7, 3]) {
        px(c, inside, tx + dx, h - 70, 4, 10);
        px(c, white, tx + dx - 1, h - 71, 6, 1);
      }
      onionDome(c, tx, h - 76, 11, 18, copper, copperShade, '#e8c040');
    }
    // 兩端的小亭子
    for (const tx of [10, w - 10]) {
      px(c, white, tx - 6, h - 64, 2, 8);
      px(c, white, tx + 4, h - 64, 2, 8);
      onionDome(c, tx, h - 64, 7, 10, copper, copperShade, '#e8c040');
    }
    // 中間的鐘樓
    const cx = w / 2;
    px(c, brick, cx - 16, h - 86, 32, 32);
    for (let y = h - 82; y < h - 54; y += 7) px(c, white, cx - 16, y, 32, 2);
    px(c, white, cx - 18, h - 88, 36, 3);
    c.fillStyle = '#f8f4ea';
    c.beginPath();
    c.arc(cx, h - 72, 8, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#c9a24a';
    c.lineWidth = 1;
    c.stroke();
    px(c, '#2a2a2a', cx - 0.5, h - 78, 1, 6);
    px(c, '#2a2a2a', cx, h - 72.5, 4, 1);
    px(c, brick, cx - 10, h - 94, 20, 6);
    for (const dx of [-8, -3, 2, 7]) px(c, inside, cx + dx, h - 93, 2, 4);
    onionDome(c, cx, h - 94, 15, 18, copper, copperShade, '#e8c040');
  });
}

// 獨立廣場的旗桿和國旗（紅白條紋、藍底黃色的月亮和星星，會飄）
function drawFlagpole(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(KL.flag.x * T);
  const by = Math.round(KL.flag.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  px(c, '#cfc8bc', cx - 6, by - 4, 12, 4);
  px(c, '#e4ded2', cx - 4, by - 7, 8, 3);
  px(c, '#d6dae2', cx - 1, by - 150, 2, 143);
  px(c, '#f4f6f8', cx - 1, by - 150, 1, 143);
  px(c, '#e8c040', cx - 2, by - 153, 4, 3);
  const top = by - 148;
  const fw = 32;
  for (let x = 0; x < fw; x += 1) {
    const dy = Math.round(Math.sin(d.seconds * 3 - x * 0.25) * (x / fw) * 2.5);
    for (let s = 0; s < 7; s += 1) px(c, s % 2 ? '#f4f4f4' : '#d8202a', cx + 1 + x, top + s * 2 + dy, 1, 2);
    if (x < 15) px(c, '#1a2e7a', cx + 1 + x, top + dy, 1, 8);
  }
  const dy0 = Math.round(Math.sin(d.seconds * 3 - 8 * 0.25) * 0.6);
  c.fillStyle = '#f6c945';
  c.beginPath();
  c.arc(cx + 6, top + 4 + dy0, 3, 0, Math.PI * 2);
  c.fill();
  px(c, '#1a2e7a', cx + 7, top + 2 + dy0, 3, 4);
  px(c, '#f6c945', cx + 10, top + 3 + dy0, 3, 3);
}

// ── 亞羅街的店屋：彩色的牆、拱形木百葉窗、招牌、五腳基（騎樓）──
const HOUSES: { w: number; col: string; word: string; shutter: string }[] = [
  { w: 4.5, col: '#f2d27a', word: '海鮮', shutter: '#3f7a5a' },
  { w: 4.5, col: '#9fd0e6', word: '茶室', shutter: '#7a4a2a' },
  { w: 4, col: '#f4b4b0', word: '燒烤', shutter: '#3f7a5a' },
  { w: 5, col: '#bfe4c8', word: '肉骨茶', shutter: '#7a4a2a' },
  { w: 4.5, col: '#f1e3c6', word: '炒粿條', shutter: '#2f6a8a' },
  { w: 4, col: '#ffcf9a', word: '點心', shutter: '#3f7a5a' },
  { w: 4.5, col: '#d4c0e0', word: '飯店', shutter: '#7a4a2a' },
];
const HOUSE_H = 66;
function houseSprite(i: number): HTMLCanvasElement {
  const b = HOUSES[i] ?? HOUSES[0];
  const w = Math.round((b?.w ?? 4) * T);
  return cached(`kl-house-${i}`, w, HOUSE_H, (c) => {
    if (!b) return;
    const h = HOUSE_H;
    px(c, b.col, 0, 8, w, h - 8);
    // 山牆（三種：弧形、階梯、平的）
    c.fillStyle = b.col;
    if (i % 3 === 0) {
      c.beginPath();
      c.moveTo(w / 2 - 20, 9);
      c.quadraticCurveTo(w / 2, -6, w / 2 + 20, 9);
      c.fill();
    } else if (i % 3 === 1) {
      px(c, b.col, w / 2 - 14, 4, 28, 5);
      px(c, b.col, w / 2 - 8, 0, 16, 5);
    }
    px(c, '#ffffff', w / 2 - 7, 3, 14, 4);
    text(c, `19${20 + i * 3}`, w / 2, 5, '#8a6a4a', `700 4px ${FONT_TC}`);
    px(c, 'rgba(255,255,255,0.5)', 0, 8, w, 2);
    px(c, 'rgba(0,0,0,0.15)', 0, 10, w, 1);
    // 兩層樓的拱形百葉窗、窗間的壁柱
    for (const fy of [13, 29]) {
      const n = Math.max(2, Math.floor(w / 20));
      const gap = w / n;
      for (let k = 0; k < n; k += 1) {
        const x = Math.round(k * gap + gap / 2 - 5);
        c.fillStyle = '#f8f4ea';
        c.beginPath();
        c.arc(x + 5, fy + 4, 6, Math.PI, 0);
        c.fill();
        px(c, '#f8f4ea', x - 1, fy + 4, 12, 11);
        c.fillStyle = b.shutter;
        c.beginPath();
        c.arc(x + 5, fy + 4, 4.5, Math.PI, 0);
        c.fill();
        px(c, b.shutter, x + 0.5, fy + 4, 9, 10);
        for (let yy = fy + 5; yy < fy + 14; yy += 2) px(c, 'rgba(0,0,0,0.25)', x + 0.5, yy, 9, 1);
        px(c, '#f8f4ea', x + 5, fy, 1, 14);
      }
      px(c, 'rgba(0,0,0,0.12)', 0, fy + 15, w, 1);
    }
    px(c, 'rgba(255,255,255,0.35)', 1, 10, 2, 34);
    px(c, 'rgba(255,255,255,0.35)', w - 3, 10, 2, 34);
    // 招牌（黑底金字）
    px(c, '#1a1a1a', 3, 45, w - 6, 8);
    px(c, '#e8c040', 3, 45, w - 6, 1);
    px(c, '#e8c040', 3, 52, w - 6, 1);
    text(c, b.word, w / 2, 49, '#f6d56a', `900 7px ${FONT_TC}`);
    // 五腳基：柱子、裡面亮燈的店
    px(c, '#3a2a22', 0, 54, w, h - 54);
    px(c, '#f6dfae', 5, 57, w - 10, h - 59);
    px(c, '#ffffff', 8, 56, w - 16, 1);
    for (let x = 8; x < w - 8; x += 7) px(c, ['#c94a3a', '#e8b040', '#5a8a4a'][(x + i) % 3] ?? '#c94a3a', x, 60, 4, 3);
    px(c, '#9aa3b2', 6, h - 5, w - 12, 2);
    px(c, b.col, 0, 54, 4, h - 54);
    px(c, b.col, w - 4, 54, 4, h - 54);
    px(c, 'rgba(0,0,0,0.3)', 0, 54, w, 2);
  });
}
const HOUSE_X: number[] = (() => {
  let x: number = KL.alor.x0;
  return HOUSES.map((b) => {
    const at = x;
    x += b.w;
    return at;
  });
})();

// ── 亞羅街的攤子：條紋棚、招牌、老闆、檯面；沙爹冒煙、拉茶拉得高高的、榴槤堆成小山 ──
function drawStall(c: CanvasRenderingContext2D, s: (typeof ALOR_STALLS)[number], i: number, d: DrawCtx): void {
  const cx = Math.round(s.x * T);
  const by = Math.round(KL.stallY * T);
  const w = 46;
  const x0 = cx - w / 2;
  px(c, 'rgba(0,0,0,0.22)', x0, by, w, 3);
  // 老闆
  const owner = getAvatarFrame(lookColors((i * 3 + 1) % 5, 4 + (i % 3), { body: (i + 1) % 3 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - owner.width / 2 + (s.kind === 'tarik' ? 4 : 0)), by - 10 - owner.height + 6);
  // 柱子、條紋棚、招牌
  px(c, '#5a5d66', x0 + 2, by - 36, 2, 36);
  px(c, '#5a5d66', x0 + w - 4, by - 36, 2, 36);
  for (let k = 0; k < w + 4; k += 6) px(c, (k / 6) % 2 === 0 ? s.awning : '#f4f1e8', x0 - 2 + k, by - 42, 6, 6);
  px(c, 'rgba(0,0,0,0.2)', x0 - 2, by - 36, w + 4, 1);
  px(c, '#fff6d8', x0 + 4, by - 35, w - 8, 7);
  text(c, s.sign, cx, by - 31.5, s.awning, `900 6px ${FONT_TC}`);
  if (d.night) for (let k = 0; k < 3; k += 1) px(c, '#fff6c8', x0 + 8 + k * 14, by - 27, 3, 2);
  // 檯面（白鐵）
  px(c, '#9aa3b2', x0, by - 12, w, 4);
  px(c, '#d6dae2', x0, by - 12, w, 1);
  px(c, '#c9ccd6', x0, by - 8, w, 8);
  px(c, s.awning, x0, by - 3, w, 1);
  if (s.kind === 'satay') drawSatayGrill(c, cx, by, d);
  else if (s.kind === 'nasi') drawNasiLemak(c, cx, by);
  else if (s.kind === 'tarik') drawTehTarik(c, cx, by, d);
  else drawDurianPile(c, cx, by);
}

// 沙爹：長長的炭爐、一排竹籤、紅紅的炭，一直冒煙
function drawSatayGrill(c: CanvasRenderingContext2D, cx: number, by: number, d: DrawCtx): void {
  px(c, '#2a2a2e', cx - 20, by - 16, 30, 5);
  for (let x = cx - 19; x < cx + 9; x += 3) px(c, Math.floor(d.seconds * 4 + x) % 3 ? '#e8502a' : '#ffb040', x, by - 15, 2, 1);
  for (let x = cx - 18; x < cx + 8; x += 3) {
    px(c, '#8a3a1a', x, by - 19, 2, 3);
    px(c, '#d8c090', x + 0.5, by - 22, 1, 3);
  }
  px(c, '#c8902a', cx + 12, by - 15, 7, 3);
  for (let k = 0; k < 6; k += 1) {
    const t = (d.seconds * 0.35 + k / 6) % 1;
    const r = 2 + t * 7;
    c.fillStyle = `rgba(240,240,240,${0.75 * (1 - t)})`;
    c.beginPath();
    c.arc(cx - 14 + (k % 3) * 9 + Math.sin(d.seconds * 1.2 + k) * 3 + t * 10, by - 20 - t * 40, r, 0, Math.PI * 2);
    c.fill();
  }
  if (d.night) glow(c, cx - 5, by - 15, 18, '255, 120, 60', 0.45);
}

// 椰漿飯：香蕉葉包的三角包、一鍋飯、參巴辣醬、水煮蛋
function drawNasiLemak(c: CanvasRenderingContext2D, cx: number, by: number): void {
  for (let k = 0; k < 4; k += 1) {
    const x = cx - 19 + k * 6;
    c.fillStyle = k % 2 ? '#3f8a3a' : '#4f9a44';
    c.beginPath();
    c.moveTo(x, by - 12);
    c.lineTo(x + 3, by - 18);
    c.lineTo(x + 6, by - 12);
    c.fill();
  }
  px(c, '#5a5d66', cx + 3, by - 18, 12, 6);
  px(c, '#f8f6f0', cx + 4, by - 20, 10, 3);
  px(c, '#c8202a', cx + 16, by - 15, 5, 3);
  px(c, '#f8f6f0', cx - 2, by - 15, 4, 3);
  px(c, '#f6c945', cx - 1, by - 14, 2, 1);
}

// 拉茶：一手杯子放低、一手拿高，奶茶從高處拉下來（高度一直變）
function drawTehTarik(c: CanvasRenderingContext2D, cx: number, by: number, d: DrawCtx): void {
  const pull = 2 + 8 * (0.5 + 0.5 * Math.sin(d.seconds * 2.2));
  const lowX = cx - 6;
  const lowY = by - 16;
  const highX = cx + 10;
  const highY = by - 18 - pull;
  // 高的杯子（傾斜）、低的杯子
  px(c, '#c9ccd6', highX - 2, highY - 4, 5, 5);
  px(c, '#e6e8ee', highX - 2, highY - 4, 1, 5);
  px(c, '#c9ccd6', lowX - 3, lowY, 6, 5);
  px(c, '#f4e8d0', lowX - 3, lowY - 1, 6, 1);
  // 茶柱
  c.strokeStyle = '#c8945a';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(highX - 2, highY + 1);
  c.quadraticCurveTo(lowX + 3, highY + 2, lowX, lowY - 1);
  c.stroke();
  // 檯面上一排倒好的拉茶
  for (let k = 0; k < 4; k += 1) {
    px(c, '#e8dcc4', cx - 20 + k * 4, by - 15, 3, 3);
    px(c, '#c8945a', cx - 20 + k * 4, by - 13, 3, 1);
  }
}

// 榴槤：一堆刺刺的綠色榴槤，前面一顆剖開露出金黃色的果肉
function durian(c: CanvasRenderingContext2D, x: number, y: number): void {
  c.fillStyle = '#7a9a2a';
  c.beginPath();
  c.ellipse(x, y, 4, 3.5, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#5a7a1a', x + 1, y, 3, 3);
  for (const [dx, dy] of [[-3, -3], [0, -4], [3, -3], [-4, 0], [4, 0], [-2, 3], [2, 3]] as const) px(c, '#4a6a14', x + dx, y + dy, 1, 1);
}
function drawDurianPile(c: CanvasRenderingContext2D, cx: number, by: number): void {
  const rows: [number, number][] = [[5, -15], [4, -20], [2, -25]];
  rows.forEach(([n, dy]) => {
    for (let k = 0; k < n; k += 1) durian(c, cx - 4 - (n - 1) * 4 + k * 8, by + dy);
  });
  // 剖開的一顆、價錢牌
  px(c, '#7a9a2a', cx + 13, by - 16, 9, 4);
  px(c, '#f6d050', cx + 14, by - 18, 3, 3);
  px(c, '#f6d050', cx + 18, by - 18, 3, 3);
  px(c, '#ffffff', cx - 21, by - 22, 9, 6);
  text(c, 'RM', cx - 16.5, by - 19, '#c8202a', `900 4px ${FONT_TC}`);
}

// 塑膠桌（紅色）＋桌上的拉茶和一盤沙爹
function drawPlasticTable(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 18, by + 1, 36, 3);
  px(c, '#b81e22', cx - 18, by - 9, 36, 5);
  px(c, '#e8403a', cx - 18, by - 9, 36, 1);
  px(c, '#9a1a1e', cx - 16, by - 4, 3, 5);
  px(c, '#9a1a1e', cx + 13, by - 4, 3, 5);
  px(c, '#e8dcc4', cx - 12, by - 12, 3, 3);
  px(c, '#c8945a', cx - 12, by - 10, 3, 1);
  px(c, '#e8dcc4', cx + 9, by - 12, 3, 3);
  px(c, '#f4f1e8', cx - 5, by - 11, 10, 2);
  for (let k = 0; k < 4; k += 1) px(c, '#8a3a1a', cx - 4 + k * 2, by - 12, 1, 2);
}

// 亞羅街上空的紅燈籠（一串串掛過去）
function drawLanternRow(c: CanvasRenderingContext2D, y: number, d: DrawCtx): void {
  const yy = y * T - 36;
  const x0 = KL.alor.x0 * T + 4;
  const x1 = KL.alor.x1 * T - 2;
  c.strokeStyle = '#2a2a2e';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0, yy);
  for (let x = x0; x <= x1; x += 4) c.lineTo(x, yy + Math.abs(Math.sin(((x - x0) / (x1 - x0)) * 5 * Math.PI)) * 6);
  c.stroke();
  for (let x = x0 + 10; x < x1; x += 22) drawLantern(c, x, yy + Math.abs(Math.sin(((x - x0) / (x1 - x0)) * 5 * Math.PI)) * 6 + 2, '#d8282a', d.night);
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = KL_SEATS[i];
  if (!s) return;
  if (i < 6) drawStool(c, s.x, s.y, i % 2 ? '#2a6fd8' : '#e23a2a');
  else if (i % 2 === 0) drawParkBenchBase(c, s.x + 0.6);
}
function drawSeatFront(c: CanvasRenderingContext2D, i: number): void {
  const s = KL_SEATS[i];
  if (s && i >= 6 && i % 2 === 1) drawParkBenchBack(c, s.x - 0.6);
}

const LAMPS: [number, number][] = [[13.6, 24.3], [41.6, 24.3], [22.6, 30], [22.6, 43.8], [25.4, 37.2], [55.4, 37.2], [3, 43.8], [13, 34.9]];
const RAIN_TREES: [number, number, number][] = [[6.5, 18, 1.1], [15, 19.4, 1], [41, 18.6, 0.9], [2.5, 45.6, 1.1], [12, 45.8, 1.1], [21, 45.6, 0.9]];
const PALMS: [number, number][] = [[1.6, 18.1], [11.6, 18.1], [24.5, 21.8], [31.5, 21.8], [13.2, 17.6], [27.5, 45.6], [35, 45.6], [42.5, 45.6], [50, 45.6], [55, 45.6], [0.8, 37.5], [21.6, 37.5]];

const props: CityProp[] = [
  { y: 0.5, draw: (c, d) => drawSkylineNight(c, d) },
  { y: KL.klTower.line, draw: (c, d) => drawKlTower(c, d) },
  { y: KL.towers.line, draw: (c, d) => drawPetronas(c, d) },
  { y: KL.lake.y0 + 1, draw: (c, d) => drawFountain(c, d) },
  { y: KL.station.line, draw: (c, d) => drawStation(c, d) },
  { y: KL.mosque.line, draw: (c, d) => blit(c, mosqueSprite(d.night), KL.mosque.x0 * T, KL.mosque.line * T) },
  { y: KL.sas.line, draw: (c, d) => blit(c, sasSprite(d.night), KL.sas.x0 * T, KL.sas.line * T) },
  { y: KL.flag.y, draw: (c, d) => drawFlagpole(c, d) },
  ...HOUSES.map((_, i): CityProp => ({ y: KL.houseLine, draw: (c) => blit(c, houseSprite(i), (HOUSE_X[i] ?? 25) * T, KL.houseLine * T) })),
  ...ALOR_STALLS.map((s, i): CityProp => ({ y: KL.stallY, draw: (c, d) => drawStall(c, s, i, d) })),
  ...ALOR_TABLES.map((x): CityProp => ({ y: ALOR_TABLE_Y, draw: (c) => drawPlasticTable(c, x, ALOR_TABLE_Y) })),
  ...ALOR_DECOR_TABLES.map((x): CityProp => ({ y: ALOR_TABLE_Y, draw: (c) => drawPlasticTable(c, x, ALOR_TABLE_Y) })),
  ...ALOR_DECOR_TABLES.flatMap((x, k): CityProp[] =>
    [-0.7, 0.7].flatMap((dx, j) => [ALOR_TABLE_Y - 0.55, ALOR_TABLE_Y + 0.8].map((sy, m) => ({ y: sy, draw: (c: CanvasRenderingContext2D) => drawStool(c, x + dx, sy, (k + j + m) % 2 ? '#2a6fd8' : '#e23a2a') }))),
  ),
  // 桌子前面（南邊）多擺幾張空的塑膠椅
  ...ALOR_TABLES.flatMap((x, k): CityProp[] => [-0.7, 0.7].map((dx, j) => ({ y: ALOR_TABLE_Y + 0.8, draw: (c: CanvasRenderingContext2D) => drawStool(c, x + dx, ALOR_TABLE_Y + 0.8, (k + j) % 2 ? '#2a6fd8' : '#e23a2a') }))),
  { y: 36.4, draw: (c, d) => drawLanternRow(c, 36.4, d) },
  { y: 44, draw: (c, d) => drawLanternRow(c, 44, d) },
  ...RAIN_TREES.map(([x, y, s]): CityProp => ({ y, draw: (c) => drawRainTree(c, x, y, s) })),
  ...PALMS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawPalm(c, x, y, d.seconds, 40) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, KL.W, KL.parkY0 + 0.2),
  r(KL.lake.x0 - 0.2, KL.lake.y0 - 0.2, KL.lake.x1 + 0.2, KL.lake.y1 + 0.1),
  r(0, KL.station.line - 4, KL.station.x1 + 0.1, KL.station.line - 0.05),
  r(KL.mosque.x0, KL.parkY0, KL.W, KL.mosque.line - 0.05),
  r(0, KL.road.y1 + 0.2, KL.sas.x1 + 0.4, KL.sas.line - 0.05),
  r(KL.alor.x0, KL.road.y1 + 0.2, KL.W, KL.houseLine - 0.05),
  r(KL.flag.x - 0.4, KL.flag.y - 0.3, KL.flag.x + 0.4, KL.flag.y),
  ...PARK_BENCHES.map((x) => r(x - 1.3, PARK_BENCH_Y - 0.35, x + 1.3, PARK_BENCH_Y - 0.1)),
  ...ALOR_STALLS.map((s) => r(s.x - 1.45, KL.stallY - 0.9, s.x + 1.45, KL.stallY - 0.05)),
  ...[...ALOR_TABLES, ...ALOR_DECOR_TABLES].map((x) => r(x - 1.1, ALOR_TABLE_Y - 0.4, x + 1.1, ALOR_TABLE_Y)),
  r(0, KL.southY + 0.4, KL.W, KL.H),
  ...RAIN_TREES.map(([x, y]) => r(x - 0.25, y - 0.3, x + 0.25, y + 0.1)),
  ...PALMS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

// 晚上的燈：雙子星塔整座亮白光（沿著塔身一串）、吉隆坡塔、清真寺、蘇丹阿都沙末大廈、亞羅街的燈籠和攤子
const towerLights: CityDef['lights'] = PT_X.flatMap((cx) => {
  const x = KL.towers.x * T - PT_W / 2 + cx;
  const by = KL.towers.line * T;
  return Array.from({ length: 9 }, (_, k) => ({ x, y: by - 16 - k * 24, r: 30 - k, color: 'rgba(235, 242, 255, 0.55)' }));
});
const lights: CityDef['lights'] = [
  ...towerLights,
  { x: KL.towers.x * T, y: KL.towers.line * T - 100, r: 34, color: 'rgba(255, 240, 200, 0.5)' },
  { x: KL.towers.x * T, y: KL.towers.line * T - 10, r: 110, color: 'rgba(255, 220, 160, 0.3)' },
  { x: KL.klTower.x * T, y: KL.klTower.line * T - 158, r: 34, color: 'rgba(255, 230, 160, 0.55)' },
  { x: KL.klTower.x * T, y: KL.klTower.line * T - 80, r: 40, color: 'rgba(160, 140, 255, 0.35)' },
  { x: ((KL.lake.x0 + KL.lake.x1) / 2) * T, y: 18.6 * T, r: 170, color: 'rgba(160, 200, 255, 0.3)' },
  ...[-34, 0, 34].map((dx) => ({ x: ((KL.mosque.x0 + KL.mosque.x1) / 2) * T + dx, y: KL.mosque.line * T - 90, r: 34, color: 'rgba(255, 250, 230, 0.5)' })),
  { x: ((KL.mosque.x0 + KL.mosque.x1) / 2) * T, y: KL.mosque.line * T - 20, r: 100, color: 'rgba(255, 220, 150, 0.35)' },
  ...[3, 8, 11.5, 15, 20].map((x) => ({ x: x * T, y: KL.sas.line * T - 30, r: 50, color: 'rgba(255, 200, 120, 0.4)' })),
  { x: 11.5 * T, y: KL.sas.line * T - 100, r: 40, color: 'rgba(255, 210, 140, 0.45)' },
  { x: KL.flag.x * T + 16, y: KL.flag.y * T - 142, r: 30, color: 'rgba(255, 240, 220, 0.4)' },
  { x: ((KL.station.x0 + KL.station.x1) / 2) * T, y: KL.station.line * T - 20, r: 100, color: 'rgba(210, 230, 255, 0.4)' },
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...HOUSES.map((b, i) => ({ x: ((HOUSE_X[i] ?? 25) + b.w / 2) * T, y: KL.houseLine * T - 10, r: 44, color: 'rgba(255, 210, 140, 0.4)' })),
  ...ALOR_STALLS.map((s) => ({ x: s.x * T, y: KL.stallY * T - 20, r: 46, color: 'rgba(255, 180, 120, 0.5)' })),
  ...[29, 35, 41, 47, 53].flatMap((x) => [36.4, 44].map((y) => ({ x: x * T, y: y * T - 32, r: 46, color: 'rgba(255, 90, 70, 0.35)' }))),
];

const stationX = (KL.station.x0 + KL.station.x1) / 2;

export const KUALALUMPUR: CityDef = {
  id: 'kualalumpur',
  country: 'my',
  line: 'metro',
  W: KL.W,
  H: KL.H,
  title: { 'zh-TW': '吉隆坡 · 雙子星塔與亞羅街', 'en-US': 'Kuala Lumpur · Twin Towers & Jalan Alor' },
  stop: { 'zh-TW': '吉隆坡（KL Sentral）', 'en-US': 'Kuala Lumpur (KL Sentral)' },
  emoji: '🕌',
  station: {
    x: stationX,
    y: KL.station.line + 0.6,
    name: { 'zh-TW': '吉隆坡中央車站', 'en-US': 'KL Sentral' },
    arrive: { x: stationX + 3.2, y: KL.station.line + 1 },
  },
  background: '#6eae4e',
  soundscape: 'market',
  paintGround: paintKlGround,
  props,
  solid,
  seats: KL_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  drawSeatFront: (c, i) => drawSeatFront(c, i),
  shops: KL_SHOPS,
  infos: [
    {
      at: r(KL.towers.x - 6.5, 0, KL.towers.x + 6.5, KL.parkY0),
      title: { 'zh-TW': '雙子星塔（國油雙峰塔）', 'en-US': 'Petronas Twin Towers' },
      text: {
        'zh-TW': '高 452 公尺、地上 88 層，1998 年完工，到 2004 年都是世界最高的大樓，現在還是世界最高的雙塔。建築師西薩·佩里把平面設計成伊斯蘭的八角星，外牆是不鏽鋼和玻璃，往上一段段收尖。41、42 樓之間的空中天橋離地 170 公尺，下面用倒 V 的支架撐著。晚上整座打白光。',
        'en-US': '452 m tall with 88 floors, completed in 1998 and the world’s tallest building until 2004 — still the tallest twin towers. Architect César Pelli based the floor plan on an eight-pointed Islamic star; the steel-and-glass towers step back as they rise. The skybridge on floors 41–42 hangs 170 m up on an inverted-V brace. At night both towers glow white.',
      },
    },
    {
      at: r(KL.lake.x0, KL.lake.y0, KL.lake.x1, KL.lake.y1),
      title: { 'zh-TW': 'KLCC 公園與音樂噴泉', 'en-US': 'KLCC Park & Lake Symphony' },
      text: {
        'zh-TW': '雙子星塔腳下約 20 公頃的城市公園，由巴西景觀設計師布雷·馬克斯設計，種了很多原生的熱帶樹。塔前的湖叫「交響湖」，晚上有燈光音樂噴泉表演，湖邊是看雙子星塔最好的位置。',
        'en-US': 'A 20-hectare city park at the foot of the towers, designed by Brazilian landscape architect Roberto Burle Marx and planted with native tropical trees. Lake Symphony in front puts on evening light-and-music fountain shows — the lakeside is the best spot to look up at the towers.',
      },
    },
    {
      at: r(KL.klTower.x - 1.5, 0, KL.klTower.x + 1.5, KL.klTower.line),
      title: { 'zh-TW': '吉隆坡塔', 'en-US': 'KL Tower (Menara KL)' },
      text: {
        'zh-TW': '1996 年啟用的電視塔，高 421 公尺，蓋在市中心的武吉納納斯森林保護區小山上。頂端的球形觀景台可以看整個吉隆坡，也是穆斯林觀察新月、決定齋戒月開始的地方。地圖上把它和雙子星塔畫得比實際近。',
        'en-US': 'A 421 m telecom tower opened in 1996, standing on Bukit Nanas, a forest reserve hill downtown. Its bulb-shaped observation pod looks over the whole city and is also used to sight the new moon for Ramadan. The map draws it closer to the Twin Towers than it really is.',
      },
    },
    {
      at: r(KL.sas.x0, 27, KL.sas.x1, KL.sas.line),
      title: { 'zh-TW': '蘇丹阿都沙末大廈', 'en-US': 'Sultan Abdul Samad Building' },
      text: {
        'zh-TW': '1897 年完工的英國殖民時期政府大樓，用紅磚和白色石帶、馬蹄形拱廊和銅色洋蔥圓頂，混合了摩爾式和蒙兀兒風格，中間的鐘樓高約 41 公尺。現在是馬來西亞的文化、藝術部門使用。',
        'en-US': 'A colonial government building finished in 1897: red brick with white bands, horseshoe arcades and copper onion domes in a Moorish–Mughal style, with a 41 m clock tower in the middle. It now houses Malaysia’s culture and arts ministry offices.',
      },
    },
    {
      at: r(0, KL.padangY0, 22.4, KL.southY),
      title: { 'zh-TW': '獨立廣場', 'en-US': 'Merdeka Square' },
      text: {
        'zh-TW': '以前是英國人打板球的草地。1957 年 8 月 31 日午夜，馬來亞在這裡降下英國國旗、升起自己的國旗宣布獨立。南邊的旗桿高 95 公尺，是世界上最高的旗桿之一（地圖上縮短了）。',
        'en-US': 'Once the colonial cricket green. At midnight on 31 August 1957 the Union Jack was lowered here and Malaya’s own flag raised for independence. The flagpole is 95 m tall, one of the world’s tallest (shortened on the map).',
      },
    },
    {
      at: r(KL.mosque.x0, 14, KL.mosque.x1, KL.mosque.line),
      title: { 'zh-TW': '佳密清真寺', 'en-US': 'Masjid Jamek' },
      text: {
        'zh-TW': '1909 年完工，是吉隆坡最老的清真寺之一，紅磚白帶、白色洋蔥圓頂和宣禮塔都是摩爾式的設計。它蓋在巴生河和鵝麥河交會的地方——「吉隆坡」在馬來語就是「泥濘的河口」。實際上離雙子星塔有段距離，河也沒畫出來。',
        'en-US': 'Completed in 1909, one of KL’s oldest mosques, with Moorish red-and-white bands, white onion domes and minarets. It stands where the Klang and Gombak rivers meet — “Kuala Lumpur” means “muddy confluence” in Malay. In reality it’s a few kilometres from the towers, and the rivers aren’t drawn.',
      },
    },
    {
      at: r(KL.alor.x0, KL.houseLine, KL.alor.x1, KL.southY),
      title: { 'zh-TW': '亞羅街夜市', 'en-US': 'Jalan Alor' },
      text: {
        'zh-TW': '武吉免登區的美食街。傍晚以後老店屋前擺滿紅色、藍色的塑膠桌椅，頭上掛著紅燈籠，空氣裡都是炭烤沙爹的煙。旁邊的嘛嘛檔（印度穆斯林開的茶檔）把拉茶拉得高高的，季節到了還有整車的貓山王榴槤。',
        'en-US': 'The food street of Bukit Bintang. After dark the old shophouses spill red and blue plastic tables onto the road under red lanterns, with charcoal satay smoke everywhere. Mamak (Indian-Muslim) stalls pull teh tarik from a height, and in season Musang King durians come by the truckload.',
      },
    },
  ],
  labels: [
    { x: 28, y: PARK_BENCH_Y + 1.6, text: { 'zh-TW': '🌳 KLCC 公園（湖邊長椅看雙子星塔）', 'en-US': '🌳 KLCC Park (benches facing the towers)' }, color: '#bbf7d0' },
    { x: 39, y: 43.5, text: { 'zh-TW': '🏮 亞羅街（塑膠桌椅坐下專注）', 'en-US': '🏮 Jalan Alor (sit at a street table)' }, color: '#fecaca' },
  ],
  walkers: [
    { x0: 13, y0: 16.1, x1: 42, y1: 16.1, count: 3 },
    { x0: 13, y0: 23.9, x1: 42, y1: 23.9, count: 3 },
    { x0: 23.7, y0: 27.6, x1: 23.7, y1: 43.6, count: 2 },
    { x0: 1, y0: 36.4, x1: 21, y1: 36.4, count: 2 },
    { x0: 1, y0: 43.2, x1: 21, y1: 43.2, count: 2 },
    { x0: 26, y0: 36.2, x1: 55, y1: 36.2, count: 4 },
    { x0: 26, y0: 42, x1: 55, y1: 42, count: 3 },
  ],
  traffic: [
    { y: 25.3, dir: -1, x0: 0, x1: KL.W, count: 3 },
    { y: 26.6, dir: 1, x0: 0, x1: KL.W, count: 3 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點 KLCC 公園湖邊的長椅或亞羅街的塑膠桌坐下專注 · 走到攤子買沙爹、椰漿飯、拉茶、貓山王榴槤 · 點地標看介紹 · 吉隆坡中央車站搭機場快線飛回台灣',
    'en-US': 'WASD / arrows to move · click a KLCC Park lakeside bench or a Jalan Alor table to focus · walk up to the stalls for satay, nasi lemak, teh tarik and durian · click landmarks for info · KL Sentral for the airport train home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或桌子坐下專注 · 走到攤子買東西 · 點地標看介紹 · 吉隆坡中央車站',
    'en-US': 'Tap a bench or table to focus · visit the stalls · tap landmarks · KL Sentral',
  },
};
