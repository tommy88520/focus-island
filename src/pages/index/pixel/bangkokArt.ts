// 曼谷的美術：對岸的鄭王廟（白色瓷片高塔＋四座小塔，晚上打燈金黃）、昭披耶河（長尾船、快船、渡輪、觀光船、布袋蓮）、
// 塔田碼頭、河邊步道的長椅、臥佛寺（四座大佛塔、臥佛殿的層層屋頂、石雕守門像、涼亭、求籤桌）、塔田老街屋、
// 大皇宮（白色城牆、金色的舍利塔和尖塔、橘綠屋頂）、嘟嘟車、電線桿、路邊攤（大陽傘推車、塑膠桌椅）、九重葛、神屋、BTS 高架車站。
// 最後組成 CityScene 用的 BANGKOK。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { BANGKOK_SEATS, BANGKOK_SHOPS, BK, BK_CARTS, RIVER_BENCHES, RIVER_BENCH_Y, STALL_TABLES, STALL_TABLE_Y, type BkCart } from './bangkok';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, drawMarketTable, drawStool, drawStringLights, drawPalm, drawStreetTree } from './cityArt';

const W = BK.W * T;

// ── 地面（畫一次）──
export function paintBangkokGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1782);
  // 天空
  const sky = c.createLinearGradient(0, 0, 0, (BK.farBank - 4.6) * T);
  sky.addColorStop(0, '#6fb2e6');
  sky.addColorStop(0.7, '#cfe6f4');
  sky.addColorStop(1, '#f6ead2');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, (BK.farBank - 4.6) * T);
  // 雲
  for (const [x, y, w] of [[60, 18, 70], [300, 10, 90], [560, 26, 60], [800, 14, 80], [180, 46, 50], [700, 54, 70]] as const) {
    px(c, 'rgba(255,255,255,0.8)', x, y, w, 6);
    px(c, 'rgba(255,255,255,0.8)', x + 12, y - 5, w - 30, 6);
  }
  // 對岸遠處的城市（吞武里低矮的樓）
  for (let x = 0; x < W; x += 14 + Math.floor(rand() * 16)) {
    const h = 10 + Math.floor(rand() * 22);
    px(c, rand() < 0.5 ? '#b9c4cc' : '#c8ced2', x, (BK.farBank - 4.6) * T - h, 12 + Math.floor(rand() * 10), h);
  }
  // 對岸的樹林
  for (let i = 0; i < 140; i += 1) {
    c.fillStyle = ['#3f6a3e', '#4c7a46', '#5a8a50'][Math.floor(rand() * 3)] ?? '#4c7a46';
    c.beginPath();
    c.arc(rand() * W, (BK.farBank - 5) * T + rand() * 2.2 * T, 5 + rand() * 6, 0, Math.PI * 2);
    c.fill();
  }
  // 鄭王廟的寺院地面（淺色石板）、河岸的石堤
  tiles(c, { x0: 0, y0: BK.farBank - 3, x1: BK.W, y1: BK.farBank }, '#d9d0bc', '#c9bfa8', 12);
  px(c, '#9a9282', 0, BK.farBank * T - 5, W, 5);
  px(c, '#b5ad9b', 0, BK.farBank * T - 5, W, 1);
  // 昭披耶河：偏綠褐色的河水
  const water = c.createLinearGradient(0, BK.river.y0 * T, 0, BK.river.y1 * T);
  water.addColorStop(0, '#6f8a72');
  water.addColorStop(1, '#58745f');
  c.fillStyle = water;
  c.fillRect(0, BK.river.y0 * T, W, (BK.river.y1 - BK.river.y0) * T);
  for (let i = 0; i < 120; i += 1) px(c, 'rgba(230,240,220,0.18)', Math.floor(rand() * W), Math.floor(BK.river.y0 * T + 4 + rand() * (BK.river.y1 - BK.river.y0 - 0.4) * T), 5 + Math.floor(rand() * 9), 1);
  // 塔田碼頭的浮台（鐵板、黃線）＋接到岸上的跳板
  const p = BK.pier;
  px(c, '#3a4a52', p.x0 * T - 1, p.y0 * T - 1, (p.x1 - p.x0) * T + 2, (BK.river.y1 - p.y0) * T + 2);
  tiles(c, { x0: p.x0, y0: p.y0, x1: p.x1, y1: BK.river.y1 }, '#8f9a9c', '#7c8789', 8);
  px(c, '#f2c94c', p.x0 * T, p.y0 * T, (p.x1 - p.x0) * T, 2);
  px(c, '#f2c94c', p.x0 * T, p.y0 * T + 4, (p.x1 - p.x0) * T, 1);
  // 河邊步道：米色地磚、靠河的欄杆
  tiles(c, { x0: 0, y0: BK.prom.y0, x1: BK.W, y1: BK.prom.y1 }, '#e2d6bc', '#d0c3a6', 16);
  px(c, '#8a8272', 0, BK.prom.y0 * T, W, 3);
  for (let x = 0; x < W; x += 8) {
    if (x >= p.x0 * T && x < p.x1 * T) continue;
    px(c, '#f4efe2', x, BK.prom.y0 * T - 1, 2, 4);
  }
  // 寺廟後面（被建築擋住）、中間的巷子
  px(c, '#c9bfa8', 0, BK.prom.y1 * T, W, (BK.templeLine - BK.prom.y1) * T);
  tiles(c, { x0: BK.shophouses.x1, y0: BK.prom.y1, x1: BK.palace.x0, y1: BK.templeLine }, '#d6ccb6', '#c4b99f', 12);
  // 寺廟前的人行道（灰石板）
  tiles(c, { x0: 0, y0: BK.templeLine, x1: BK.W, y1: BK.road.y0 }, '#cfc9bd', '#bdb6a8', 16);
  px(c, '#9a948a', 0, BK.road.y0 * T - 3, W, 3);
  // 馬路：中間黃線、斑馬線
  road(c, { x0: 0, y0: BK.road.y0, x1: BK.W, y1: BK.road.y1 }, rand);
  const mid = Math.round(((BK.road.y0 + BK.road.y1) / 2) * T);
  px(c, '#e8c440', 0, mid - 2, W, 1);
  px(c, '#e8c440', 0, mid + 1, W, 1);
  for (let x = 0; x < W; x += 30) {
    px(c, '#e8e8e8', x, Math.round((BK.road.y0 + 0.75) * T), 14, 1);
    px(c, '#e8e8e8', x + 15, Math.round((BK.road.y1 - 0.75) * T), 14, 1);
  }
  zebra(c, 33, BK.road.y0, 37, BK.road.y1, false);
  // 南邊：人行道的紅白路緣（泰國的路緣漆成紅白相間）
  for (let x = 0; x < W; x += 16) px(c, (x / 16) % 2 === 0 ? '#d8382a' : '#f4f4f4', x, BK.road.y1 * T, 16, 3);
  // 路邊攤區：舊舊的水泥地（有補過的痕跡）
  px(c, '#bdb4a2', 0, BK.road.y1 * T + 3, 36 * T, (BK.H - BK.road.y1) * T);
  for (let i = 0; i < 40; i += 1) px(c, rand() < 0.5 ? '#b2a996' : '#c6bead', Math.floor(rand() * 36 * T), Math.floor(BK.road.y1 * T + 6 + rand() * (BK.H - BK.road.y1 - 0.5) * T), 10 + Math.floor(rand() * 20), 6 + Math.floor(rand() * 8));
  for (let y = (BK.road.y1 + 0.4) * T; y < BK.H * T; y += 24) px(c, 'rgba(0,0,0,0.06)', 0, Math.round(y), 36 * T, 1);
  // 車站前：淺色地磚
  tiles(c, { x0: 36, y0: BK.road.y1 + 0.2, x1: BK.W, y1: BK.H }, '#d6d3cb', '#c4c0b6', 16);
}

// ── 泰式建築的小零件 ──
// 層層的泰式屋頂（從長邊看）：橘色屋瓦、綠色鑲邊、金色屋脊，兩端的 chofa 往上翹
function thaiRoof(c: CanvasRenderingContext2D, x0: number, x1: number, top: number, h: number, tiers = 3, tile = '#d8742a', trim = '#2f8a5a'): void {
  const th = h / tiers;
  for (let k = 0; k < tiers; k += 1) {
    const inset = (tiers - 1 - k) * 6;
    const y = top + k * th;
    const bx0 = x0 + inset;
    const bx1 = x1 - inset;
    const slope = th * 0.9;
    c.fillStyle = tile;
    c.beginPath();
    c.moveTo(bx0 + slope, y);
    c.lineTo(bx1 - slope, y);
    c.lineTo(bx1, y + th + 1);
    c.lineTo(bx0, y + th + 1);
    c.fill();
    // 屋瓦的線、綠色鑲邊、金色的邊
    c.fillStyle = 'rgba(0,0,0,0.12)';
    for (let yy = y + 3; yy < y + th; yy += 3) c.fillRect(bx0 + slope * (1 - (yy - y) / th), Math.round(yy), bx1 - bx0 - 2 * slope * (1 - (yy - y) / th), 1);
    px(c, trim, Math.round(bx0), Math.round(y + th - 2), Math.round(bx1 - bx0), 3);
    c.strokeStyle = '#e8b830';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(bx0, y + th + 1);
    c.lineTo(bx0 + slope, y);
    c.moveTo(bx1, y + th + 1);
    c.lineTo(bx1 - slope, y);
    c.stroke();
  }
  // 屋脊、兩端的 chofa
  const rx0 = x0 + (tiers - 1) * 6 + th * 0.9;
  const rx1 = x1 - (tiers - 1) * 6 - th * 0.9;
  px(c, '#e8b830', Math.round(rx0), Math.round(top - 2), Math.round(rx1 - rx0), 2);
  for (const [x, s] of [[rx0, -1], [rx1, 1]] as const) {
    c.strokeStyle = '#e8b830';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x, top - 1);
    c.quadraticCurveTo(x + s * 3, top - 3, x + s * 2, top - 9);
    c.stroke();
  }
}

// 泰式山牆（從正面看）：三層錯開的人字屋頂、金色的山牆裝飾、尖端的 chofa
function thaiGable(c: CanvasRenderingContext2D, cx: number, base: number, w: number, h: number, tile = '#d8742a', trim = '#2f8a5a'): void {
  for (let k = 0; k < 3; k += 1) {
    const ww = w * (0.7 + k * 0.15);
    const apex = base - h + k * (h * 0.12);
    const bottom = base - k * 2 + 4;
    c.fillStyle = trim;
    c.beginPath();
    c.moveTo(cx, apex - 2);
    c.lineTo(cx + ww / 2 + 2, bottom);
    c.lineTo(cx - ww / 2 - 2, bottom);
    c.fill();
    c.fillStyle = tile;
    c.beginPath();
    c.moveTo(cx, apex + 2);
    c.lineTo(cx + ww / 2 - 2, bottom - 1);
    c.lineTo(cx - ww / 2 + 2, bottom - 1);
    c.fill();
    c.strokeStyle = '#e8b830';
    c.lineWidth = 1.5;
    c.beginPath();
    c.moveTo(cx - ww / 2 - 1, bottom);
    c.lineTo(cx, apex - 2);
    c.lineTo(cx + ww / 2 + 1, bottom);
    c.stroke();
    // 下緣往上翹的 hang hong
    px(c, '#e8b830', Math.round(cx - ww / 2 - 3), Math.round(bottom - 3), 2, 3);
    px(c, '#e8b830', Math.round(cx + ww / 2 + 1), Math.round(bottom - 3), 2, 3);
  }
  // 最前面的金色山牆（三角形，裡面有花紋）
  c.fillStyle = '#c99a2e';
  c.beginPath();
  c.moveTo(cx, base - h * 0.62);
  c.lineTo(cx + w * 0.3, base + 2);
  c.lineTo(cx - w * 0.3, base + 2);
  c.fill();
  c.fillStyle = '#f2cf5a';
  for (let y = Math.round(base - h * 0.5); y < base; y += 4) {
    const half = ((y - (base - h * 0.62)) / (h * 0.62)) * w * 0.3 - 3;
    for (let x = -half; x < half; x += 4) px(c, '#f2cf5a', Math.round(cx + x), y, 2, 2);
  }
  // chofa
  c.strokeStyle = '#e8b830';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx, base - h - 1);
  c.quadraticCurveTo(cx + 2, base - h - 6, cx - 1, base - h - 10);
  c.stroke();
}

// 鄭王廟式的高塔（prang，像玉米穗）：一圈圈的瓷片、正中間陡峭的樓梯、頂上的尖刺
function prang(c: CanvasRenderingContext2D, cx: number, base: number, w: number, h: number, night: boolean, stairs: boolean): void {
  const body = night ? '#ffe0a0' : '#ece7da';
  const shade = night ? '#e9b660' : '#cfc8b8';
  const band = night ? '#d89a40' : '#a8a092';
  const dots = night ? ['#fff0c0', '#f0a050', '#ffd070', '#e8c080'] : ['#e86a7a', '#3f7fcf', '#f2c14e', '#4fa866', '#f4f4f4'];
  const bodyH = h * 0.84;
  const hw = (t: number) => (w / 2) * Math.pow(Math.max(0, 1 - Math.pow(t, 2.6)), 0.55) * (1 - 0.18 * t);
  for (let y = 0; y < bodyH; y += 1) {
    const t = y / bodyH;
    const half = hw(t);
    if (half < 0.6) continue;
    const yy = Math.round(base - y);
    const l = Math.round(cx - half);
    const r = Math.round(cx + half);
    px(c, body, l, yy, r - l, 1);
    px(c, shade, Math.round(cx + half * 0.35), yy, Math.max(1, r - Math.round(cx + half * 0.35)), 1);
    const ring = y % 7;
    if (ring === 0) px(c, band, l, yy, r - l, 1);
    if (ring === 3) for (let x = l + 1, k = 0; x < r - 1; x += 3, k += 1) px(c, dots[(k + Math.floor(y / 7)) % dots.length] ?? '#fff', x, yy, 2, 1);
  }
  if (stairs) {
    // 正面陡峭的樓梯，到一半的高度；中段的壁龕（因陀羅騎三頭象）
    const sh = Math.round(bodyH * 0.42);
    px(c, night ? '#c98a3a' : '#9a9282', Math.round(cx - 3), Math.round(base - sh), 6, sh);
    for (let y = 0; y < sh; y += 2) px(c, night ? '#f0c070' : '#d6d0c2', Math.round(cx - 3), Math.round(base - y), 6, 1);
    const ny = Math.round(base - bodyH * 0.56);
    px(c, night ? '#b8742a' : '#5a5248', Math.round(cx - 3), ny - 7, 6, 8);
    px(c, night ? '#ffe8b0' : '#f4f4f4', Math.round(cx - 2), ny - 5, 4, 4);
  }
  // 頂上的尖刺（金屬）＋三叉戟
  const top = Math.round(base - bodyH);
  const spire = Math.round(h - bodyH);
  for (let y = 0; y < spire; y += 1) {
    const half = Math.max(0.5, 2.2 * (1 - y / spire));
    px(c, night ? '#ffe8a0' : '#b9b2a2', Math.round(cx - half), top - y, Math.max(1, Math.round(half * 2)), 1);
    if (y % 4 === 0) px(c, night ? '#f6c870' : '#8f887a', Math.round(cx - half - 1), top - y, Math.round(half * 2) + 2, 1);
  }
  px(c, night ? '#fff4c8' : '#d6cfbf', Math.round(cx - 2), top - spire - 2, 1, 2);
  px(c, night ? '#fff4c8' : '#d6cfbf', Math.round(cx + 1), top - spire - 2, 1, 2);
}

// ── 鄭王廟（Wat Arun）：三層的白色基座、中間的大塔、四個角的小塔；白天、晚上各一張 ──
const ARUN_W = 270;
const ARUN_H = 170;
function arunSprite(night: boolean): HTMLCanvasElement {
  return cached(`bk-arun-${night ? 'n' : 'd'}`, ARUN_W, ARUN_H, (c) => {
    const cx = ARUN_W / 2;
    const b = ARUN_H;
    // 三層基座：白牆、欄杆、守護的小雕像（彩色點）
    const tiers: [number, number][] = [[256, 10], [184, 10], [126, 10]];
    let y = b;
    for (const [tw, th] of tiers) {
      px(c, night ? '#f0c070' : '#ddd6c6', Math.round(cx - tw / 2), y - th, tw, th);
      px(c, night ? '#ffe2a0' : '#f4efe2', Math.round(cx - tw / 2), y - th, tw, 2);
      for (let x = cx - tw / 2 + 2; x < cx + tw / 2 - 2; x += 4) px(c, night ? '#d89a40' : '#b8b0a0', Math.round(x), y - th + 3, 1, 3);
      px(c, night ? '#c98a3a' : '#a8a092', Math.round(cx - 4), y - th, 8, th);
      y -= th;
    }
    // 四個角的小塔（在第一層上面）
    for (const dx of [-110, -80, 80, 110]) {
      const small = Math.abs(dx) === 110;
      prang(c, cx + dx, b - 10, small ? 18 : 26, small ? 56 : 80, night, false);
    }
    // 中間的大塔
    prang(c, cx, b - 30, 66, 140, night, true);
    // 塔腳的小亭（mondop）
    for (const dx of [-50, 50]) {
      px(c, night ? '#f0c070' : '#e6e0d2', cx + dx - 7, b - 42, 14, 12);
      c.fillStyle = night ? '#e0a040' : '#c9c1b0';
      c.beginPath();
      c.moveTo(cx + dx - 8, b - 42);
      c.lineTo(cx + dx, b - 58);
      c.lineTo(cx + dx + 8, b - 42);
      c.fill();
    }
  });
}
function drawWatArun(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, arunSprite(d.night), BK.arun.x * T - ARUN_W / 2, BK.farBank * T - 4);
}

// 對岸鄭王廟旁邊的戒堂（小的泰式山牆）、對岸的渡輪碼頭
function farBankSprite(): HTMLCanvasElement {
  return cached('bk-farbank', W, 64, (c) => {
    const b = 64;
    // 戒堂（西邊）
    for (const [cx, w] of [[6.5 * T, 70], [34 * T, 54], [48 * T, 76]] as const) {
      px(c, '#f4efe2', cx - w * 0.36, b - 22, w * 0.72, 18);
      for (let x = cx - w * 0.3; x < cx + w * 0.3; x += 8) px(c, '#c99a2e', Math.round(x), b - 18, 3, 12);
      thaiGable(c, cx, b - 22, w, 32);
    }
    // 對岸碼頭（渡輪靠的地方）
    px(c, '#6a5a48', 36 * T - 30, b - 6, 60, 6);
    px(c, '#d8382a', 36 * T - 26, b - 20, 2, 14);
    px(c, '#e07a1f', 36 * T - 24, b - 20, 8, 5);
  });
}

// ── 河：漣漪、漂著的布袋蓮、晚上鄭王廟的金色倒影 ──
function drawRiver(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const y0 = BK.river.y0 * T;
  const h = (BK.river.y1 - BK.river.y0) * T;
  c.save();
  c.beginPath();
  c.rect(0, y0, W, h);
  c.clip();
  for (let i = 0; i < 36; i += 1) {
    const y = y0 + 6 + (((i * 41) % 97) / 97) * (h - 10);
    const x = (((i * 151 + d.seconds * (5 + (i % 3) * 2)) % (W + 30)) - 15);
    px(c, `rgba(235,245,225,${0.22 + 0.15 * Math.sin(d.seconds * 1.3 + i)})`, Math.round(x), Math.round(y), 5 + (i % 3) * 3, 1);
  }
  // 布袋蓮：一叢叢慢慢往下游漂
  for (let i = 0; i < 7; i += 1) {
    const y = y0 + 10 + ((i * 53) % 90);
    const x = ((i * 137 + d.seconds * 3) % (W + 40)) - 20;
    px(c, '#3f7a3a', Math.round(x), Math.round(y), 9, 3);
    px(c, '#5a9a4a', Math.round(x + 2), Math.round(y - 2), 5, 2);
    if (i % 2 === 0) px(c, '#b48ad6', Math.round(x + 4), Math.round(y - 3), 2, 1);
  }
  if (d.night) {
    // 鄭王廟、對岸的燈的倒影（會晃）
    const ax = BK.arun.x * T;
    for (let y = y0 + 2; y < y0 + h - 4; y += 3) {
      const k = (y - y0) / h;
      const ww = 30 * (1 - k * 0.6) + Math.sin(d.seconds * 2 + y * 0.3) * 4;
      px(c, `rgba(255,205,110,${0.75 - k * 0.5})`, Math.round(ax - ww / 2 + Math.sin(d.seconds * 1.6 + y) * 3), y, Math.round(ww), 1);
    }
    for (const x of [6.5, 34, 48]) for (let y = y0 + 2; y < y0 + h * 0.5; y += 4) px(c, 'rgba(255,200,120,0.4)', Math.round(x * T - 6 + Math.sin(d.seconds * 2 + y) * 2), y, 12, 1);
  }
  c.restore();
}

// ── 河上的船（用時間算，超出河面就剪掉）──
function clipRiver(c: CanvasRenderingContext2D, draw: () => void): void {
  c.save();
  c.beginPath();
  c.rect(0, BK.river.y0 * T - 40, W, (BK.river.y1 - BK.river.y0) * T + 40);
  c.clip();
  draw();
  c.restore();
}
const span = W + 240;
const laneX = (seconds: number, speed: number, phase: number, dir: 1 | -1): number => {
  const k = (seconds * speed + phase) % span;
  return dir > 0 ? k - 120 : W + 120 - k;
};
// 長尾船：細長的木船、船頭綁彩色布條、船尾一根長長的螺旋槳軸，開很快
function drawLongtail(c: CanvasRenderingContext2D, d: DrawCtx, yT: number, dir: 1 | -1, speed: number, phase: number, hull: string): void {
  clipRiver(c, () => {
    const x = laneX(d.seconds, speed, phase, dir);
    const y = Math.round(yT * T);
    const s = dir;
    // 尾浪
    for (let k = 0; k < 6; k += 1) px(c, `rgba(255,255,255,${0.5 - k * 0.08})`, Math.round(x - s * (34 + k * 8)), y + 1 + (k % 2), 7, 1);
    px(c, 'rgba(0,0,0,0.2)', Math.round(x - 26), y + 1, 52, 3);
    // 船身（兩頭翹起來）
    c.fillStyle = hull;
    c.beginPath();
    c.moveTo(x - s * 26, y - 5);
    c.lineTo(x + s * 22, y - 5);
    c.lineTo(x + s * 30, y - 12);
    c.lineTo(x + s * 22, y);
    c.lineTo(x - s * 22, y);
    c.fill();
    px(c, '#e8b830', Math.round(Math.min(x - s * 24, x + s * 22)), y - 5, 46, 1);
    px(c, '#c62828', Math.round(Math.min(x - s * 24, x + s * 22)), y - 3, 46, 1);
    // 船頭的彩色布條、花環
    for (const [k, col] of [[0, '#e86a7a'], [1, '#f2c14e'], [2, '#3f7fcf']] as const) px(c, col, Math.round(x + s * (27 - k * 2)), y - 14 + k * 2, 2, 5);
    // 乘客
    for (const k of [-10, -2, 6]) {
      px(c, ['#3b82f6', '#e25a4a', '#f2f2f2'][(k + 10) % 3] ?? '#fff', Math.round(x + s * k - 2), y - 11, 5, 6);
      px(c, '#3a2a22', Math.round(x + s * k - 2), y - 14, 5, 3);
    }
    // 船尾的引擎＋長軸
    px(c, '#4a4d55', Math.round(x - s * 26 - 3), y - 12, 7, 6);
    px(c, '#7a7f88', Math.round(x - s * 26 - 1), y - 13, 3, 1);
    c.strokeStyle = '#3a3d45';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x - s * 26, y - 7);
    c.lineTo(x - s * 46, y + 1);
    c.stroke();
    px(c, `rgba(255,255,255,${0.5 + 0.3 * Math.sin(d.seconds * 20)})`, Math.round(x - s * 48 - 3), y - 1, 7, 3);
  });
}
// 昭披耶河快船：長長的白色船身、藍色線、船尾橘旗
function drawExpressBoat(c: CanvasRenderingContext2D, d: DrawCtx): void {
  clipRiver(c, () => {
    const dir = 1;
    const x = laneX(d.seconds, 26, 300, dir);
    const y = Math.round(15.5 * T);
    for (let k = 0; k < 5; k += 1) px(c, `rgba(255,255,255,${0.45 - k * 0.08})`, Math.round(x - 48 - k * 10), y + (k % 2), 9, 1);
    px(c, 'rgba(0,0,0,0.2)', Math.round(x - 44), y + 1, 92, 3);
    px(c, '#f2efe6', Math.round(x - 44), y - 9, 86, 9);
    c.fillStyle = '#f2efe6';
    c.beginPath();
    c.moveTo(x + 42, y - 9);
    c.lineTo(x + 50, y - 9);
    c.lineTo(x + 42, y);
    c.fill();
    px(c, '#2a5a9c', Math.round(x - 44), y - 4, 90, 2);
    // 船艙、窗、屋頂
    px(c, '#e6e2d6', Math.round(x - 36), y - 19, 70, 10);
    for (let k = -32; k < 30; k += 7) px(c, d.night ? '#ffe7a0' : '#3a4a5a', Math.round(x + k), y - 17, 5, 5);
    px(c, '#c8c2b2', Math.round(x - 38), y - 21, 74, 2);
    px(c, '#3a3d45', Math.round(x - 46), y - 26, 1, 17);
    px(c, '#e07a1f', Math.round(x - 45), y - 26, 8, 5);
  });
}
// 觀光船（柚木的米船改裝，彎彎的屋頂；晚上掛滿燈泡，變成晚餐遊船）
function drawCruise(c: CanvasRenderingContext2D, d: DrawCtx): void {
  clipRiver(c, () => {
    const x = laneX(d.seconds, 9, 820, -1);
    const y = Math.round(14.0 * T);
    px(c, 'rgba(0,0,0,0.2)', Math.round(x - 48), y + 1, 96, 3);
    c.fillStyle = '#6a3a1e';
    c.beginPath();
    c.moveTo(x - 52, y - 10);
    c.lineTo(x + 52, y - 10);
    c.lineTo(x + 44, y);
    c.lineTo(x - 44, y);
    c.fill();
    px(c, '#8a5028', Math.round(x - 50), y - 10, 100, 2);
    // 彎彎的屋頂
    c.fillStyle = '#7a4a26';
    c.beginPath();
    c.moveTo(x - 40, y - 12);
    c.quadraticCurveTo(x, y - 34, x + 40, y - 12);
    c.fill();
    px(c, '#c98a3c', Math.round(x - 38), y - 13, 76, 2);
    for (let k = -32; k <= 32; k += 9) {
      px(c, d.night ? '#ffe7a0' : '#f4efe2', Math.round(x + k - 2), y - 12, 3, 2);
    }
    if (d.night) {
      for (let k = -40; k <= 40; k += 6) {
        const yy = y - 12 - Math.round(22 * (1 - Math.pow(k / 40, 2)));
        px(c, ['#ff7a5a', '#ffd23f', '#5ad6ff', '#7aee6a'][((k + 40) / 6 + Math.floor(d.seconds * 2)) % 4] ?? '#ffd23f', Math.round(x + k), yy - 1, 2, 2);
      }
      glow(c, x, y - 12, 50, '255, 210, 140', 0.35);
    }
  });
}
// 過河的渡輪：在塔田碼頭和對岸之間來回（停 8 秒、開 8 秒）
function ferryY(seconds: number): number {
  const t = seconds % 32;
  const near = BK.pier.y0 - 0.2;
  const far = BK.farBank + 0.9;
  if (t < 8) return near;
  if (t < 16) return near + (far - near) * easeInOut((t - 8) / 8);
  if (t < 24) return far;
  return far + (near - far) * easeInOut((t - 24) / 8);
}
const easeInOut = (k: number): number => k * k * (3 - 2 * k);
function drawFerry(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = Math.round(36 * T);
  const y = Math.round(ferryY(d.seconds) * T);
  px(c, 'rgba(0,0,0,0.2)', x - 26, y + 1, 52, 3);
  px(c, '#2f6aa8', x - 26, y - 7, 52, 7);
  px(c, '#f4f4f4', x - 26, y - 7, 52, 2);
  px(c, '#f4efe2', x - 20, y - 18, 40, 11);
  for (let k = -17; k < 17; k += 6) px(c, d.night ? '#ffe7a0' : '#5a7a94', x + k, y - 16, 4, 4);
  px(c, '#c62828', x - 22, y - 20, 44, 2);
  px(c, '#3a3d45', x + 18, y - 26, 1, 8);
  px(c, '#e07a1f', x + 19, y - 26, 6, 4);
}

// ── 塔田碼頭：浮台上的標示、柱子、橘旗 ──
function drawPierSign(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = BK.pier.x0 * T;
  const x1 = BK.pier.x1 * T;
  const y = BK.pier.y0 * T + 2;
  for (const x of [x0 + 2, x1 - 4]) {
    px(c, '#3a3d45', x, y - 4, 3, 6);
    px(c, '#f2c94c', x, y - 4, 3, 1);
  }
  const sx = BK.pier.x1 * T - 14;
  px(c, '#3a3d45', sx, y - 34, 2, 34);
  px(c, '#1f4e9c', sx - 22, y - 42, 46, 12);
  text(c, '塔田碼頭 N8', sx + 1, y - 36, '#ffffff', `900 6px ${FONT_TC}`);
  const wave = Math.sin(d.seconds * 3) > 0 ? 1 : 0;
  px(c, '#3a3d45', x0 + 6, y - 30, 1, 30);
  px(c, '#e07a1f', x0 + 7, y - 30 + wave, 9, 6);
}

// ── 河邊步道：長椅（面向河，椅背在人的前面）、泰式路燈 ──
function drawRiverBench(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(RIVER_BENCH_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 20, by + 1, 40, 3);
  px(c, '#8a5a32', cx - 20, by - 4, 40, 4);
  px(c, '#b5804a', cx - 20, by - 4, 40, 1);
  px(c, '#3a3d45', cx - 18, by, 2, 2);
  px(c, '#3a3d45', cx + 16, by, 2, 2);
}
function drawBenchBack(c: CanvasRenderingContext2D, i: number): void {
  const s = BANGKOK_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  px(c, '#a8703f', x - 10, y - 8, 20, 3);
  px(c, '#8a5a32', x - 10, y - 5, 20, 1);
  px(c, '#3a3d45', i % 2 === 0 ? x - 9 : x + 7, y - 5, 2, 6);
}
function drawRiverLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  px(c, '#2f3a34', cx - 1, by - 30, 3, 30);
  px(c, '#c9a24a', cx - 2, by - 4, 5, 4);
  px(c, '#2f3a34', cx - 7, by - 30, 15, 2);
  for (const dx of [-7, 6]) {
    px(c, night ? '#fff1a8' : '#f4efe2', cx + dx - 1, by - 28, 4, 5);
    px(c, '#c9a24a', cx + dx - 1, by - 23, 4, 1);
  }
  px(c, '#c9a24a', cx, by - 36, 1, 6);
}

// ── 臥佛寺（Wat Pho）：白牆＋門、四座彩色大佛塔、臥佛殿的層層屋頂 ──
function chedi(c: CanvasRenderingContext2D, cx: number, base: number, w: number, h: number, main: string, accent: string): void {
  // 階梯狀的方形基座（折角）、鐘形塔身、一圈圈收尖的塔頂；表面貼滿瓷片花
  for (let k = 0; k < 4; k += 1) {
    const ww = w * (1 - k * 0.14);
    px(c, k % 2 ? accent : main, Math.round(cx - ww / 2), Math.round(base - (k + 1) * h * 0.06), Math.round(ww), Math.ceil(h * 0.06));
  }
  const bellBase = base - h * 0.24;
  const bellH = h * 0.26;
  for (let y = 0; y < bellH; y += 1) {
    const half = (w * 0.36) * Math.sqrt(1 - Math.pow(y / bellH, 2)) + w * 0.06;
    const yy = Math.round(bellBase - y);
    px(c, main, Math.round(cx - half), yy, Math.round(half * 2), 1);
    if (y % 4 === 2) for (let x = -half + 2; x < half - 2; x += 4) px(c, accent, Math.round(cx + x), yy, 2, 1);
    px(c, 'rgba(0,0,0,0.12)', Math.round(cx + half * 0.4), yy, Math.round(half * 0.6), 1);
  }
  const spireBase = bellBase - bellH;
  const sh = h - (base - spireBase);
  for (let y = 0; y < sh; y += 1) {
    const half = Math.max(0.5, w * 0.12 * (1 - y / sh));
    const yy = Math.round(spireBase - y);
    px(c, y % 4 < 2 ? main : accent, Math.round(cx - half), yy, Math.max(1, Math.round(half * 2)), 1);
  }
  px(c, '#e8b830', Math.round(cx), Math.round(base - h - 3), 1, 4);
}
const WATPHO_H = 104;
function watPhoSprite(): HTMLCanvasElement {
  const w = Math.round((BK.watPho.x1 - BK.watPho.x0) * T);
  const h = WATPHO_H;
  return cached('bk-watpho', w, h, (c) => {
    // 四座大佛塔（綠、白、黃、藍；拉瑪一世到四世）
    const cols: [string, string][] = [['#3f9a5a', '#e8d070'], ['#f0ece2', '#4f9ad6'], ['#e8c040', '#d8382a'], ['#3f6fc0', '#f0ece2']];
    cols.forEach(([m, a], k) => chedi(c, 14 + k * 26, h - 14, 22, 92 - (k % 2) * 8, m, a));
    // 臥佛殿：白牆、金色的門窗、三層屋頂
    const vx0 = 112;
    const vx1 = w - 6;
    px(c, '#f4efe2', vx0 + 8, h - 44, vx1 - vx0 - 16, 30);
    for (let x = vx0 + 14; x < vx1 - 14; x += 14) {
      px(c, '#b8862a', x, h - 38, 7, 16);
      px(c, '#e8b830', x + 1, h - 37, 5, 14);
      px(c, '#f4efe2', x + 3, h - 37, 1, 14);
    }
    thaiRoof(c, vx0, vx1, h - 74, 30, 3);
    // 屋頂後面再一座小殿的山牆
    thaiGable(c, 200, h - 74, 40, 24, '#2f6aa8', '#e8b830');
    // 白色的圍牆（上面鋸齒），中間的門（金色的門框、小尖頂）
    px(c, '#f0ebe0', 0, h - 16, w, 16);
    px(c, '#d6d0c2', 0, h - 4, w, 4);
    for (let x = 0; x < w; x += 8) px(c, '#f0ebe0', x, h - 19, 5, 3);
    const gx = Math.round((BK.watPhoGate - BK.watPho.x0) * T);
    px(c, '#f0ebe0', gx - 16, h - 34, 32, 34);
    px(c, '#c62828', gx - 9, h - 26, 18, 26);
    px(c, '#e8b830', gx - 9, h - 26, 18, 2);
    px(c, '#e8b830', gx - 1, h - 24, 2, 24);
    c.fillStyle = '#d8742a';
    c.beginPath();
    c.moveTo(gx - 18, h - 34);
    c.lineTo(gx, h - 52);
    c.lineTo(gx + 18, h - 34);
    c.fill();
    px(c, '#2f8a5a', gx - 18, h - 35, 36, 2);
    px(c, '#e8b830', gx - 1, h - 60, 2, 8);
  });
}
// 門口兩尊中國石雕守門像（從前運米到中國的壓艙石）
function drawGuardian(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by - 1, 12, 3);
  px(c, '#8a857c', cx - 6, by - 6, 12, 6);
  px(c, '#a8a296', cx - 4, by - 22, 8, 16);
  px(c, '#b8b2a6', cx - 3, by - 27, 6, 6);
  px(c, '#6a665e', cx - 4, by - 29, 8, 3);
  px(c, '#6a665e', cx - 1, by - 18, 2, 8);
}

// 臥佛寺前的涼亭（sala）：架高的木地板、四根柱子、泰式屋頂
function drawSala(c: CanvasRenderingContext2D): void {
  const cx = Math.round(BK.sala.x * T);
  const by = Math.round(BK.sala.y * T) + 4;
  const half = 32;
  px(c, 'rgba(0,0,0,0.2)', cx - half - 2, by, half * 2 + 4, 3);
  px(c, '#e8e2d4', cx - half, by - 4, half * 2, 4);
  px(c, '#8a5a32', cx - half, by - 7, half * 2, 3);
  px(c, '#a8703f', cx - half, by - 7, half * 2, 1);
  for (const x of [cx - half + 1, cx + half - 4]) {
    px(c, '#f4efe2', x, by - 40, 3, 34);
    px(c, '#c9a24a', x, by - 40, 3, 2);
  }
  // 後面的矮欄杆
  px(c, '#8a5a32', cx - half + 3, by - 18, half * 2 - 6, 2);
  thaiRoof(c, cx - half - 8, cx + half + 8, by - 62, 22, 2);
}

// 求籤桌（Siam si）：紅布、竹籤筒、香爐、蓮花、金箔
function drawSiamSi(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(BK.siamSi.x * T);
  const by = Math.round(BK.siamSi.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 13, by, 26, 3);
  px(c, '#8a3a2a', cx - 12, by - 10, 24, 10);
  px(c, '#c62828', cx - 13, by - 12, 26, 4);
  px(c, '#e8b830', cx - 13, by - 9, 26, 1);
  // 籤筒（兩個竹筒，一個在晃）
  const shake = Math.round(Math.sin(d.seconds * 6) * 1);
  for (const [dx, sh] of [[-7, 0], [-1, shake]] as const) {
    px(c, '#c9a24a', cx + dx + sh, by - 22, 5, 10);
    px(c, '#a8803a', cx + dx + sh, by - 22, 5, 1);
    for (let k = 0; k < 4; k += 1) px(c, '#e8d4a0', cx + dx + sh + k + 0.5, by - 26 + (k % 2), 1, 4);
  }
  // 香爐、香
  px(c, '#b8862a', cx + 6, by - 15, 6, 3);
  px(c, '#c62828', cx + 7, by - 21, 1, 6);
  px(c, '#c62828', cx + 9, by - 22, 1, 7);
  const t = (d.seconds * 0.4) % 1;
  px(c, `rgba(230,230,230,${0.5 * (1 - t)})`, cx + 8 + Math.round(Math.sin(d.seconds * 2) * 2), by - 24 - Math.round(t * 10), 2, 2);
  if (d.night) px(c, '#ffb040', cx + 7, by - 22, 3, 1);
  // 蓮花
  px(c, '#f2a0b4', cx - 12, by - 15, 3, 3);
}

// ── 塔田老街屋（中葡式兩層樓，拱窗、綠色百葉窗，騎樓下賣乾貨）──
function shophouseSprite(): HTMLCanvasElement {
  const w = Math.round((BK.shophouses.x1 - BK.shophouses.x0) * T);
  const h = 66;
  return cached('bk-shophouse', w, h, (c) => {
    const rand = seeded(99);
    const bay = Math.floor(w / 4);
    for (let k = 0; k < 4; k += 1) {
      const x0 = k * bay;
      const wall = ['#ecd9a8', '#e8dcc4', '#f0d2b0', '#e3d6b8'][k] ?? '#ecd9a8';
      px(c, wall, x0, 8, bay, h - 8);
      px(c, 'rgba(0,0,0,0.12)', x0 + bay - 1, 8, 1, h - 8);
      // 山牆、屋頂
      px(c, '#9a5a3a', x0, 4, bay, 5);
      px(c, wall, x0 + bay / 2 - 10, 0, 20, 6);
      px(c, 'rgba(0,0,0,0.15)', x0, 9, bay, 2);
      // 二樓：兩扇拱窗、綠色百葉窗
      for (const wx of [x0 + 6, x0 + bay - 18]) {
        px(c, '#3a6a4a', wx - 2, 16, 3, 16);
        px(c, '#3a6a4a', wx + 11, 16, 3, 16);
        px(c, '#5a4636', wx + 1, 14, 10, 18);
        c.fillStyle = wall;
        c.fillRect(wx + 1, 14, 2, 2);
        c.fillRect(wx + 9, 14, 2, 2);
        px(c, rand() < 0.5 ? '#9fc7c9' : '#c9dbe6', wx + 2, 17, 8, 14);
      }
      // 陽台上的九重葛
      for (let i = 0; i < 10; i += 1) px(c, rand() < 0.6 ? '#e0379a' : '#3f7a3a', x0 + 4 + Math.floor(rand() * (bay - 8)), 30 + Math.floor(rand() * 5), 3, 3);
      // 騎樓：店面、一簍簍的乾貨
      px(c, '#3a2e28', x0, h - 24, bay, 24);
      px(c, '#f6dfae', x0 + 3, h - 20, bay - 6, 18);
      for (let x = x0 + 5; x < x0 + bay - 6; x += 6) px(c, ['#c98a3c', '#d8382a', '#8a5a32', '#e8c070'][Math.floor(rand() * 4)] ?? '#c98a3c', x, h - 8, 5, 5);
      px(c, wall, x0, h - 24, 3, 24);
      px(c, '#2f6aa8', x0 + 3, h - 24, bay - 6, 3);
    }
  });
}

// ── 大皇宮＋玉佛寺：白色鋸齒城牆、金色的舍利塔、尖塔、橘綠屋頂 ──
const PALACE_H = 128;
function goldSpire(c: CanvasRenderingContext2D, cx: number, base: number, w: number, h: number, night: boolean): void {
  // 一層層收小的金色尖塔（prasat）
  const gold = night ? '#ffe070' : '#e2b02e';
  const dark = night ? '#d89a30' : '#a87a1a';
  const tiersH = h * 0.45;
  for (let k = 0; k < 5; k += 1) {
    const ww = w * (1 - k * 0.16);
    const y = base - (k + 1) * (tiersH / 5);
    px(c, k % 2 ? dark : gold, Math.round(cx - ww / 2), Math.round(y), Math.round(ww), Math.ceil(tiersH / 5));
  }
  const top = base - tiersH;
  for (let y = 0; y < h - tiersH; y += 1) {
    const half = Math.max(0.5, w * 0.22 * (1 - y / (h - tiersH)));
    px(c, y % 5 < 3 ? gold : dark, Math.round(cx - half), Math.round(top - y), Math.max(1, Math.round(half * 2)), 1);
  }
}
function palaceSprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((BK.palace.x1 - BK.palace.x0) * T);
  const h = PALACE_H;
  return cached(`bk-palace-${night ? 'n' : 'd'}`, w, h, (c) => {
    const gold = night ? '#ffe070' : '#e2b02e';
    const goldDark = night ? '#e0a040' : '#b8861a';
    // 金色的舍利塔（Phra Si Rattana Chedi）：圓圓的鐘形
    const sx = 36;
    const sb = h - 24;
    px(c, goldDark, sx - 22, sb - 8, 44, 8);
    px(c, gold, sx - 18, sb - 14, 36, 6);
    for (let y = 0; y < 30; y += 1) {
      const half = 16 * Math.sqrt(1 - Math.pow(y / 30, 2)) + 3;
      px(c, gold, Math.round(sx - half), sb - 14 - y, Math.round(half * 2), 1);
      px(c, goldDark, Math.round(sx + half * 0.4), sb - 14 - y, Math.round(half * 0.6), 1);
    }
    px(c, goldDark, sx - 5, sb - 50, 10, 6);
    for (let y = 0; y < 46; y += 1) {
      const half = Math.max(0.5, 4 * (1 - y / 46));
      px(c, y % 4 < 2 ? gold : goldDark, Math.round(sx - half), sb - 50 - y, Math.max(1, Math.round(half * 2)), 1);
    }
    // 玉佛寺的大殿（橘綠屋頂、金色的牆）
    px(c, night ? '#ffd890' : '#f4efe2', 70, h - 52, 100, 30);
    for (let x = 76; x < 166; x += 10) {
      px(c, goldDark, x, h - 48, 5, 22);
      px(c, gold, x + 1, h - 47, 3, 20);
    }
    thaiRoof(c, 62, 178, h - 84, 34, 3, '#d8742a', '#2f8a5a');
    // 帕瑪哈帕薩殿的尖塔（Prasat Phra Thep Bidon 一樣的 prang，金色）
    goldSpire(c, 120, h - 84, 22, 40, night);
    // 節基殿（Chakri Maha Prasat）：西式的白色殿身＋三座泰式尖塔
    const kx0 = 186;
    const kx1 = w - 6;
    px(c, night ? '#ffe8c0' : '#f4f1ea', kx0, h - 50, kx1 - kx0, 28);
    for (let x = kx0 + 6; x < kx1 - 6; x += 9) {
      px(c, '#3a4a5a', x, h - 44, 5, 8);
      px(c, '#3a4a5a', x, h - 32, 5, 8);
    }
    px(c, goldDark, kx0, h - 52, kx1 - kx0, 2);
    for (const [kx, sw, sh] of [[kx0 + 14, 14, 46], [(kx0 + kx1) / 2, 18, 62], [kx1 - 14, 14, 46]] as const) {
      thaiRoof(c, kx - sw - 6, kx + sw + 6, h - 66, 14, 2, '#2f8a5a', '#d8742a');
      goldSpire(c, kx, h - 66, sw, sh, night);
    }
    // 白色鋸齒城牆、小碉堡、城門
    px(c, night ? '#fff0d8' : '#f4f1ea', 0, h - 22, w, 22);
    px(c, '#d6d0c2', 0, h - 5, w, 5);
    for (let x = 0; x < w; x += 10) {
      px(c, night ? '#fff0d8' : '#f4f1ea', x, h - 27, 6, 5);
      px(c, 'rgba(0,0,0,0.12)', x + 5, h - 27, 1, 5);
    }
    for (const fx of [4, w - 20]) {
      px(c, night ? '#fff0d8' : '#f4f1ea', fx, h - 34, 16, 34);
      for (let x = fx; x < fx + 16; x += 5) px(c, night ? '#fff0d8' : '#f4f1ea', x, h - 38, 3, 4);
    }
    const gx = 130;
    px(c, '#8a3a2a', gx - 9, h - 18, 18, 18);
    px(c, gold, gx - 9, h - 18, 18, 2);
    c.fillStyle = night ? '#fff0d8' : '#f4f1ea';
    c.beginPath();
    c.moveTo(gx - 14, h - 22);
    c.lineTo(gx, h - 40);
    c.lineTo(gx + 14, h - 22);
    c.fill();
    px(c, gold, gx - 1, h - 48, 2, 10);
  });
}

// ── 嘟嘟車（三輪計程車）：彩色的車身、遮陽頂上的流蘇；晚上車頭燈、車底的霓虹 ──
interface Tuk {
  y: number;
  dir: 1 | -1;
  speed: number;
  phase: number;
  body: string;
  roof: string;
}
const TUKS: Tuk[] = [
  { y: 31.5, dir: -1, speed: 3.2, phase: 0.1, body: '#2f6aa8', roof: '#f2c94c' },
  { y: 31.5, dir: -1, speed: 3.2, phase: 0.6, body: '#2bb673', roof: '#d8382a' },
  { y: 32.8, dir: 1, speed: 2.8, phase: 0.35, body: '#d8382a', roof: '#2f6aa8' },
  { y: 32.8, dir: 1, speed: 2.8, phase: 0.85, body: '#e07a1f', roof: '#2bb673' },
];
const TUK_SPAN = BK.W + 8;
function tukX(t: Tuk, seconds: number): number {
  const k = ((seconds * t.speed) / TUK_SPAN + t.phase) % 1;
  return t.dir > 0 ? -4 + k * TUK_SPAN : BK.W + 4 - k * TUK_SPAN;
}
function drawTukTuk(c: CanvasRenderingContext2D, xT: number, yT: number, s: 1 | -1, body: string, roof: string, night: boolean, seconds: number): void {
  const x = Math.round(xT * T);
  const by = Math.round(yT * T) + 4;
  const bump = Math.round(Math.sin(seconds * 9 + xT) * 0.5);
  px(c, 'rgba(0,0,0,0.25)', x - 16, by - 1, 32, 3);
  // 輪子
  for (const dx of [-10, 12]) {
    px(c, '#15171f', x + s * dx - 3, by - 6, 7, 6);
    px(c, '#9aa0a8', x + s * dx - 1, by - 4, 3, 2);
  }
  // 車身（後座＋前面的車頭）
  const b = by - 6 + bump;
  px(c, body, x - 15, b - 8, 26, 8);
  c.fillStyle = body;
  c.beginPath();
  c.moveTo(x + s * 11, b - 8);
  c.lineTo(x + s * 17, b - 4);
  c.lineTo(x + s * 15, b);
  c.lineTo(x + s * 11, b);
  c.fill();
  px(c, 'rgba(255,255,255,0.35)', x - 15, b - 8, 26, 1);
  px(c, '#d6dae2', x - 15, b - 2, 30, 1);
  // 後座的人、司機
  px(c, '#3a2a22', x - s * 7 - 3, b - 18, 6, 4);
  px(c, '#f2f2f2', x - s * 7 - 3, b - 14, 6, 6);
  px(c, '#3a2a22', x + s * 6 - 2, b - 17, 5, 4);
  px(c, '#4a5a7a', x + s * 6 - 2, b - 13, 5, 5);
  // 遮陽頂（流蘇）、柱子
  px(c, '#9aa0a8', x - 14, b - 22, 1, 14);
  px(c, '#9aa0a8', x + s * 10, b - 22, 1, 14);
  px(c, roof, x - 16, b - 25, 30, 4);
  px(c, 'rgba(255,255,255,0.3)', x - 16, b - 25, 30, 1);
  for (let k = -15; k < 14; k += 3) px(c, '#f2c94c', x + k, b - 21, 1, 2);
  // 車頭燈
  px(c, night ? '#fff6c8' : '#e8e8ea', x + s * 15 - 1, b - 5, 3, 2);
  if (night) {
    glow(c, x + s * 22, b - 3, 14, '255, 240, 190', 0.5);
    px(c, ['#ff5ad5', '#5ad6ff', '#7aee6a'][Math.floor(xT * 7) % 3 & 3] ?? '#ff5ad5', x - 14, by - 3, 28, 1);
  }
}

// ── 電線桿：一大坨糾結的電線（曼谷街頭的招牌風景）──
const POLES = [2, 13, 24, 35, 46, 56];
const POLE_Y = 33.9;
function drawPowerLines(c: CanvasRenderingContext2D): void {
  const by = Math.round(POLE_Y * T);
  for (const x of POLES) {
    const cx = Math.round(x * T);
    px(c, 'rgba(0,0,0,0.2)', cx - 3, by - 1, 7, 2);
    px(c, '#9a958c', cx - 2, by - 60, 4, 60);
    px(c, '#b8b3a8', cx - 2, by - 60, 1, 60);
    px(c, '#6a665e', cx - 10, by - 56, 20, 2);
    px(c, '#4a4d55', cx + 3, by - 46, 6, 8);
    // 電線纏成一團
    c.strokeStyle = '#1f2125';
    c.lineWidth = 1;
    for (let k = 0; k < 4; k += 1) {
      c.beginPath();
      c.ellipse(cx, by - 42 + k * 2, 6 + k, 3, 0.2 * k, 0, Math.PI * 2);
      c.stroke();
    }
  }
  // 桿子之間垂下來的電線
  c.strokeStyle = 'rgba(25,27,31,0.85)';
  for (let i = 0; i < POLES.length - 1; i += 1) {
    const a = (POLES[i] ?? 0) * T;
    const b = (POLES[i + 1] ?? 0) * T;
    for (let k = 0; k < 6; k += 1) {
      const y = by - 55 + k * 3;
      c.beginPath();
      c.moveTo(a, y);
      c.quadraticCurveTo((a + b) / 2, y + 12 + k * 2, b, y + (k % 2));
      c.stroke();
    }
  }
}

// ── 九重葛：綠葉上滿滿的桃紅色花 ──
function drawBougainvillea(c: CanvasRenderingContext2D, x: number, y: number, w: number, seed: number, pot = true): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const half = Math.round((w * T) / 2);
  const rand = seeded(seed);
  if (pot) {
    px(c, 'rgba(0,0,0,0.2)', cx - half, by - 1, half * 2, 3);
    px(c, '#a8583a', cx - half, by - 8, half * 2, 8);
    px(c, '#c46a48', cx - half, by - 8, half * 2, 2);
  }
  const top = pot ? by - 8 : by;
  for (let i = 0; i < w * 6; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#3f7a3a' : '#4c8a46';
    c.beginPath();
    c.arc(cx - half + 3 + rand() * (half * 2 - 6), top - 3 - rand() * 12, 3 + rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  for (let i = 0; i < w * 16; i += 1) px(c, ['#e0379a', '#f05ab0', '#c42a84', '#ff8ac8'][Math.floor(rand() * 4)] ?? '#e0379a', Math.round(cx - half + 2 + rand() * (half * 2 - 4)), Math.round(top - 2 - rand() * 15), 2, 2);
}

// ── 路邊攤：大陽傘、推車（玻璃櫃）、後面的老闆 ──
function drawBkCart(c: CanvasRenderingContext2D, s: BkCart, i: number, d: DrawCtx): void {
  const cx = Math.round(s.x * T);
  const by = Math.round(BK.cartY * T);
  const x0 = cx - 18;
  // 老闆
  const seed = 31 + i * 7;
  const owner = getAvatarFrame(lookColors(seed % 5, 4 + (seed % 3), { body: seed % 2 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - owner.width / 2 + 8), by - 12 - owner.height + 6);
  // 大陽傘（八片，兩色交錯）
  px(c, '#5a5d66', cx - 13, by - 50, 2, 50);
  const uy = by - 50;
  const ur = 30;
  for (let k = 0; k < 8; k += 1) {
    c.fillStyle = k % 2 ? s.umbrella[1] : s.umbrella[0];
    c.beginPath();
    c.moveTo(cx - 12, uy - 10);
    c.lineTo(cx - 12 - ur + (k * ur * 2) / 8, uy + 4);
    c.lineTo(cx - 12 - ur + ((k + 1) * ur * 2) / 8, uy + 4);
    c.fill();
  }
  for (let k = 0; k < 8; k += 1) {
    c.fillStyle = k % 2 ? s.umbrella[1] : s.umbrella[0];
    c.beginPath();
    c.arc(cx - 12 - ur + ((k + 0.5) * ur * 2) / 8, uy + 4, ur / 8, 0, Math.PI);
    c.fill();
  }
  px(c, '#5a5d66', cx - 13, uy - 12, 2, 3);
  // 傘下的燈泡
  px(c, d.night ? '#fff1a8' : '#e8e8e0', cx - 4, uy + 6, 3, 3);
  // 推車：檯面、玻璃櫃、前板＋招牌、輪子
  px(c, 'rgba(0,0,0,0.22)', x0, by, 36, 3);
  px(c, '#c9ccd6', x0, by - 12, 36, 10);
  px(c, '#ffffff', x0 + 3, by - 10, 30, 6);
  text(c, s.sign, cx, by - 7, s.umbrella[0] === '#f4efe2' ? '#c62828' : s.umbrella[0], `900 6px ${FONT_TC}`);
  px(c, '#15171f', x0 + 3, by - 3, 6, 4);
  px(c, '#15171f', x0 + 27, by - 3, 6, 4);
  px(c, '#9aa3b2', x0, by - 14, 36, 2);
  px(c, 'rgba(200,230,240,0.55)', x0 + 2, by - 26, 32, 12);
  px(c, '#9aa3b2', x0 + 2, by - 27, 32, 1);
  // 櫃子裡、檯面上的東西
  if (s.kind === 'padThai') {
    px(c, '#15171f', x0 + 18, by - 17, 14, 3);
    px(c, '#e8a050', x0 + 20, by - 19, 10, 2);
    px(c, '#f4efe2', x0 + 4, by - 22, 10, 6);
    px(c, '#9ad060', x0 + 5, by - 24, 3, 2);
    px(c, '#e8c440', x0 + 10, by - 24, 3, 2);
    for (let k = 0; k < 2; k += 1) {
      const t = (d.seconds * 0.7 + k / 2) % 1;
      px(c, `rgba(255,255,255,${0.45 * (1 - t)})`, x0 + 22 + k * 5 + Math.round(Math.sin(d.seconds * 2 + k) * 2), Math.round(by - 22 - t * 14), 3, 2);
    }
  } else if (s.kind === 'mango') {
    for (let k = 0; k < 5; k += 1) px(c, k % 2 ? '#f2b830' : '#f6cc4a', x0 + 4 + k * 6, by - 20, 5, 4);
    for (let k = 0; k < 4; k += 1) px(c, '#f6cc4a', x0 + 7 + k * 6, by - 24, 5, 4);
    px(c, '#f4f4ee', x0 + 6, by - 17, 22, 2);
  } else if (s.kind === 'tea') {
    px(c, '#b8b2a6', x0 + 4, by - 26, 9, 12);
    px(c, '#d6d0c2', x0 + 4, by - 26, 9, 2);
    for (let k = 0; k < 4; k += 1) {
      px(c, '#e8e8ea', x0 + 16 + k * 5, by - 22, 4, 8);
      px(c, '#e8782a', x0 + 16 + k * 5, by - 19, 4, 5);
      px(c, '#f4efe2', x0 + 16 + k * 5, by - 21, 4, 2);
    }
  } else {
    for (let k = 0; k < 4; k += 1) {
      px(c, k % 2 ? '#8a6a3a' : '#5a8a3a', x0 + 4 + k * 8, by - 20, 7, 6);
      px(c, '#f4f4ee', x0 + 5 + k * 8, by - 22, 5, 3);
    }
  }
}

// 塑膠椅（紅、藍）＋鐵桌：用夜市共用的桌子
const STOOL_COLORS = ['#e23a2a', '#2a6ab0', '#e23a2a', '#e86aa8'];
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = BANGKOK_SEATS[i];
  if (!s) return;
  if (i >= 8) drawStool(c, s.x, s.y, STOOL_COLORS[i - 8]);
}
function drawSeatFront(c: CanvasRenderingContext2D, i: number): void {
  if (i < 6) drawBenchBack(c, i);
}

// ── 神屋（San Phra Phum）：柱子上的小金屋，供著花環、紅色汽水 ──
function drawSpiritHouse(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(BK.spiritHouse.x * T);
  const by = Math.round(BK.spiritHouse.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  px(c, '#f0ece2', cx - 3, by - 26, 6, 26);
  px(c, '#d6d0c2', cx - 6, by - 4, 12, 4);
  px(c, '#f0ece2', cx - 12, by - 28, 24, 3);
  // 小屋
  px(c, '#e8c440', cx - 8, by - 40, 16, 12);
  px(c, '#c62828', cx - 3, by - 36, 6, 8);
  thaiGable(c, cx, by - 40, 22, 16, '#c62828', '#e8b830');
  // 花環、汽水、小象
  px(c, '#f2a020', cx - 11, by - 30, 3, 3);
  px(c, '#f2f2f2', cx + 8, by - 30, 3, 3);
  px(c, '#d8202a', cx - 6, by - 32, 2, 4);
  px(c, '#d8202a', cx + 4, by - 32, 2, 4);
  px(c, '#6a665e', cx - 1, by - 31, 3, 3);
  if (d.night) px(c, '#ffe08a', cx - 1, by - 34, 2, 2);
}

// ── BTS 空鐵：高架軌道、車站（銀色弧形屋頂、樓梯），列車開過 ──
const STATION_H = 104;
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((BK.station.x1 - BK.station.x0) * T);
  const h = STATION_H;
  return cached('bk-station', w, h, (c) => {
    // 粗粗的水泥柱子
    for (let x = 20; x < w; x += 64) {
      px(c, '#b8b4aa', x, 34, 14, h - 34);
      px(c, '#cfcbc2', x, 34, 3, h - 34);
    }
    // 軌道梁
    px(c, '#c9c5bb', 0, 28, w, 10);
    px(c, '#a8a49a', 0, 36, w, 2);
    // 月台的弧形屋頂
    c.fillStyle = '#d6dae2';
    c.beginPath();
    c.moveTo(30, 8);
    c.quadraticCurveTo(w / 2, -6, w - 30, 8);
    c.lineTo(w - 30, 12);
    c.lineTo(30, 12);
    c.fill();
    px(c, '#9aa0a8', 30, 11, w - 60, 2);
    for (let x = 36; x < w - 30; x += 40) px(c, '#9aa0a8', x, 12, 2, 16);
    // 中層的大廳（售票、閘門）：玻璃窗
    px(c, '#e2e4e8', 40, 44, w - 80, 26);
    for (let x = 46; x < w - 46; x += 10) px(c, '#5a8aa8', x, 48, 7, 12);
    px(c, '#2a8a3a', 40, 62, w - 80, 3);
    // 招牌
    const cx = w / 2;
    px(c, '#f4f6f8', cx - 66, 70, 132, 13);
    px(c, '#2a8a3a', cx - 64, 71, 22, 11);
    text(c, 'BTS', cx - 53, 76.5, '#ffffff', `900 7px ${FONT_TC}`);
    text(c, '沙潘塔克辛 Saphan Taksin', cx + 10, 76.5, '#1f2a44', `900 7px ${FONT_TC}`);
    // 往下的樓梯（西邊）
    c.fillStyle = '#c9c5bb';
    c.beginPath();
    c.moveTo(4, h);
    c.lineTo(40, 66);
    c.lineTo(48, 66);
    c.lineTo(16, h);
    c.fill();
    for (let k = 0; k < 10; k += 1) px(c, '#a8a49a', Math.round(8 + k * 3.4), Math.round(h - 4 - k * 3.6), 10, 1);
    px(c, '#6a6e78', 4, 64, 2, 2);
    // 地面的入口
    px(c, '#3a3d45', cx - 24, h - 20, 48, 20);
    px(c, '#9fd8ff', cx - 20, h - 18, 40, 16);
    px(c, '#2a8a3a', cx - 26, h - 22, 52, 3);
    // 九重葛的花台（柱子旁）
    for (const fx of [w - 60, w - 30]) {
      for (let k = 0; k < 18; k += 1) px(c, k % 3 ? '#e0379a' : '#3f7a3a', fx + ((k * 7) % 20), h - 10 - ((k * 5) % 10), 3, 3);
    }
  });
}
function drawStation(c: CanvasRenderingContext2D): void {
  blit(c, stationSprite(), BK.station.x0 * T, BK.station.line * T);
}
// 高架上開過的 BTS 列車（白色車身、綠色和藍色的線），超出軌道剪掉
function drawBtsTrain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = BK.station.x0 * T;
  const w = (BK.station.x1 - BK.station.x0) * T;
  const top = BK.station.line * T - STATION_H + 12;
  const t = d.seconds % 20;
  if (t > 12) return;
  const len = 4 * 44;
  // 進站減速、停一下、再開走
  const k = t < 4 ? easeInOut(t / 4) * 0.5 : t < 7 ? 0.5 : 0.5 + easeInOut((t - 7) / 5) * 0.5;
  const x = x0 - len + k * (w + len);
  c.save();
  c.beginPath();
  c.rect(x0, top - 2, w, 20);
  c.clip();
  for (let n = 0; n < 4; n += 1) {
    const cx = x + n * 44;
    px(c, '#f2f4f6', cx, top, 42, 16);
    px(c, '#2a8a3a', cx, top + 11, 42, 2);
    px(c, '#1f4e9c', cx, top + 13, 42, 1);
    for (let wx = cx + 4; wx < cx + 38; wx += 9) px(c, d.night ? '#fff0b0' : '#3a4a5a', wx, top + 3, 6, 5);
    px(c, '#9aa0a8', cx + 18, top + 3, 5, 8);
  }
  c.restore();
}

const PROM_LAMPS: [number, number][] = [[4, 18.1], [16, 18.1], [24, 18.1], [32, 18.1], [41, 18.1], [49, 18.1], [56, 18.1]];
const YARD_LAMPS: [number, number][] = [[1.5, 30.2], [10.5, 30.2], [19.5, 30.2], [30.5, 30.2], [39.5, 30.2], [48, 30.2], [56.5, 30.2]];
const TREES: [number, number][] = [[33, 27.4], [37.5, 23.8], [38.5, 34.6], [57, 38.4]];
const PALMS: [number, number][] = [[2, BK.farBank - 0.3], [10, BK.farBank - 0.3], [31.5, BK.farBank - 0.3], [42, BK.farBank - 0.3], [54.5, BK.farBank - 0.3], [1, 21.2], [44.5, 21.3], [53, 21.3]];
const BOUGAIN: [number, number, number][] = [[1.4, 36.6, 1.8], [34.2, 37.4, 1.8], [2, 45.8, 3], [9, 45.8, 3], [17, 45.8, 3], [25, 45.8, 3], [32, 45.8, 2.4], [42, 37.4, 2.6], [47, 37.4, 2.6], [31.6, 23.4, 1.4], [38.4, 26.6, 1.2]];

const props: CityProp[] = [
  { y: BK.farBank - 0.5, draw: (c) => blit(c, farBankSprite(), 0, BK.farBank * T - 2) },
  { y: BK.farBank - 0.4, draw: (c, d) => drawWatArun(c, d) },
  ...PALMS.map(([x, y], i): CityProp => ({ y, draw: (c, d) => drawPalm(c, x, y, d.seconds + i, y < BK.prom.y0 ? 30 : 38) })),
  { y: BK.river.y0 + 0.05, draw: (c, d) => drawRiver(c, d) },
  { y: 14.0, draw: (c, d) => drawCruise(c, d) },
  { y: 14.6, draw: (c, d) => drawLongtail(c, d, 14.6, 1, 58, 500, '#3a6a8a') },
  { y: 15.1, draw: (c, d) => drawLongtail(c, d, 15.1, -1, 70, 0, '#8a5028') },
  { y: 15.5, draw: (c, d) => drawExpressBoat(c, d) },
  { y: BK.pier.y0 - 0.25, draw: (c, d) => drawFerry(c, d) },
  { y: BK.pier.y0, draw: (c, d) => drawPierSign(c, d) },
  ...RIVER_BENCHES.map((x): CityProp => ({ y: RIVER_BENCH_Y - 0.02, draw: (c) => drawRiverBench(c, x) })),
  ...PROM_LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawRiverLamp(c, x, y, d.night) })),
  { y: BK.templeLine, draw: (c) => blit(c, watPhoSprite(), BK.watPho.x0 * T, BK.templeLine * T) },
  { y: BK.templeLine, draw: (c) => blit(c, shophouseSprite(), BK.shophouses.x0 * T, BK.templeLine * T) },
  { y: BK.templeLine, draw: (c, d) => blit(c, palaceSprite(d.night), BK.palace.x0 * T, BK.templeLine * T) },
  { y: BK.templeLine + 0.6, draw: (c) => drawGuardian(c, BK.watPhoGate - 1.6, BK.templeLine + 0.6) },
  { y: BK.templeLine + 0.6, draw: (c) => drawGuardian(c, BK.watPhoGate + 1.6, BK.templeLine + 0.6) },
  { y: BK.sala.y - 0.05, draw: (c) => drawSala(c) },
  { y: BK.siamSi.y, draw: (c, d) => drawSiamSi(c, d) },
  ...YARD_LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawRiverLamp(c, x, y, d.night) })),
  ...TUKS.map((t): CityProp => ({ y: t.y, draw: (c, d) => drawTukTuk(c, tukX(t, d.seconds), t.y, t.dir, t.body, t.roof, d.night, d.seconds) })),
  // 停在車站旁等客人的嘟嘟車
  { y: 35.2, draw: (c, d) => drawTukTuk(c, 45, 35.2, -1, '#2bb673', '#f2c94c', d.night, 0) },
  { y: 35.3, draw: (c, d) => drawTukTuk(c, 48.4, 35.3, -1, '#2f6aa8', '#d8382a', d.night, 0) },
  { y: POLE_Y, draw: (c) => drawPowerLines(c) },
  { y: 34.2, draw: (c, d) => drawStringLights(c, 2, 35, 34.4, d.night, 8) },
  ...BK_CARTS.map((s, i): CityProp => ({ y: BK.cartY, draw: (c, d) => drawBkCart(c, s, i, d) })),
  ...STALL_TABLES.map((x): CityProp => ({ y: STALL_TABLE_Y, draw: (c) => drawMarketTable(c, x, STALL_TABLE_Y) })),
  { y: BK.spiritHouse.y, draw: (c, d) => drawSpiritHouse(c, d) },
  { y: BK.station.line, draw: (c) => drawStation(c) },
  { y: BK.station.line + 0.01, draw: (c, d) => drawBtsTrain(c, d) },
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...BOUGAIN.map(([x, y, w], i): CityProp => ({ y, draw: (c) => drawBougainvillea(c, x, y, w, 300 + i) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, BK.W, BK.river.y0),
  r(0, BK.river.y0, BK.pier.x0, BK.river.y1),
  r(BK.pier.x1, BK.river.y0, BK.W, BK.river.y1),
  r(BK.pier.x0, BK.river.y0, BK.pier.x1, BK.pier.y0),
  ...RIVER_BENCHES.map((x) => r(x - 1.3, RIVER_BENCH_Y - 0.4, x + 1.3, RIVER_BENCH_Y - 0.1)),
  ...PROM_LAMPS.map(([x, y]) => r(x - 0.15, y - 0.2, x + 0.2, y + 0.05)),
  ...YARD_LAMPS.map(([x, y]) => r(x - 0.15, y - 0.2, x + 0.2, y + 0.05)),
  r(0, BK.prom.y1, BK.shophouses.x1, BK.templeLine - 0.05),
  r(BK.palace.x0, BK.prom.y1, BK.W, BK.templeLine - 0.05),
  r(BK.watPhoGate - 2, BK.templeLine, BK.watPhoGate - 1.2, BK.templeLine + 0.6),
  r(BK.watPhoGate + 1.2, BK.templeLine, BK.watPhoGate + 2, BK.templeLine + 0.6),
  r(BK.sala.x - 2.1, BK.sala.y - 1.1, BK.sala.x + 2.1, BK.sala.y - 0.8),
  r(BK.sala.x - 2.1, BK.sala.y - 0.8, BK.sala.x - 1.7, BK.sala.y + 0.25),
  r(BK.sala.x + 1.7, BK.sala.y - 0.8, BK.sala.x + 2.1, BK.sala.y + 0.25),
  r(BK.siamSi.x - 0.8, BK.siamSi.y - 0.45, BK.siamSi.x + 0.8, BK.siamSi.y),
  ...POLES.map((x) => r(x - 0.15, POLE_Y - 0.2, x + 0.15, POLE_Y + 0.05)),
  ...BK_CARTS.map((s) => r(s.x - 1.15, BK.cartY - 0.9, s.x + 1.15, BK.cartY - 0.05)),
  ...STALL_TABLES.map((x) => r(x - 1.2, STALL_TABLE_Y - 0.4, x + 1.2, STALL_TABLE_Y)),
  r(BK.spiritHouse.x - 0.45, BK.spiritHouse.y - 0.35, BK.spiritHouse.x + 0.45, BK.spiritHouse.y),
  r(43.6, 34.7, 49.6, 35.4),
  r(BK.station.x0, BK.station.line - 3.4, BK.station.x1, BK.station.line - 0.05),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...PALMS.filter(([, y]) => y > BK.prom.y0).map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...BOUGAIN.map(([x, y, w]) => r(x - w / 2, y - 0.5, x + w / 2, y)),
];

const lights: CityDef['lights'] = [
  // 鄭王廟打燈：整座塔金黃色
  { x: BK.arun.x * T, y: BK.farBank * T - 40, r: 110, color: 'rgba(255, 190, 90, 0.55)' },
  { x: BK.arun.x * T, y: BK.farBank * T - 100, r: 70, color: 'rgba(255, 210, 120, 0.5)' },
  { x: BK.arun.x * T, y: BK.farBank * T - 140, r: 40, color: 'rgba(255, 220, 150, 0.45)' },
  { x: BK.arun.x * T - 70, y: BK.farBank * T - 30, r: 44, color: 'rgba(255, 190, 90, 0.4)' },
  { x: BK.arun.x * T + 70, y: BK.farBank * T - 30, r: 44, color: 'rgba(255, 190, 90, 0.4)' },
  { x: BK.arun.x * T, y: (BK.farBank + 2) * T, r: 60, color: 'rgba(255, 190, 90, 0.25)' },
  ...[6.5, 34, 48].map((x) => ({ x: x * T, y: BK.farBank * T - 18, r: 40, color: 'rgba(255, 200, 120, 0.35)' })),
  // 大皇宮、臥佛寺
  { x: (BK.palace.x0 + 9) * T, y: BK.templeLine * T - 60, r: 150, color: 'rgba(255, 200, 100, 0.4)' },
  { x: (BK.palace.x0 + 2.2) * T, y: BK.templeLine * T - 70, r: 60, color: 'rgba(255, 210, 110, 0.4)' },
  { x: 5 * T, y: BK.templeLine * T - 50, r: 80, color: 'rgba(255, 210, 150, 0.3)' },
  { x: 15 * T, y: BK.templeLine * T - 50, r: 70, color: 'rgba(255, 200, 130, 0.3)' },
  ...PROM_LAMPS.map(([x, y]) => ({ x: x * T, y: y * T - 26, r: 34 })),
  ...YARD_LAMPS.map(([x, y]) => ({ x: x * T, y: y * T - 26, r: 34 })),
  ...BK_CARTS.map((s) => ({ x: s.x * T - 4, y: BK.cartY * T - 40, r: 44, color: 'rgba(255, 200, 130, 0.5)' })),
  { x: 18 * T, y: 36 * T, r: 140, color: 'rgba(255, 170, 120, 0.2)' },
  { x: BK.siamSi.x * T, y: BK.siamSi.y * T - 16, r: 24, color: 'rgba(255, 170, 80, 0.45)' },
  { x: BK.spiritHouse.x * T, y: BK.spiritHouse.y * T - 34, r: 26, color: 'rgba(255, 210, 120, 0.5)' },
  { x: ((BK.station.x0 + BK.station.x1) / 2) * T, y: BK.station.line * T - 40, r: 130, color: 'rgba(210, 240, 220, 0.35)' },
  { x: BK.sala.x * T, y: BK.sala.y * T - 30, r: 44, color: 'rgba(255, 210, 140, 0.4)' },
  { x: 36 * T, y: BK.pier.y0 * T - 30, r: 40, color: 'rgba(200, 225, 255, 0.35)' },
];

const stationX = (BK.station.x0 + BK.station.x1) / 2;

export const BANGKOK: CityDef = {
  id: 'bangkok',
  country: 'th',
  line: 'metro',
  W: BK.W,
  H: BK.H,
  title: { 'zh-TW': '曼谷 · 鄭王廟與昭披耶河', 'en-US': 'Bangkok · Wat Arun & Chao Phraya' },
  stop: { 'zh-TW': '曼谷（BTS 空鐵）', 'en-US': 'Bangkok (BTS Skytrain)' },
  emoji: '🛕',
  station: {
    x: stationX,
    y: BK.station.line + 0.6,
    name: { 'zh-TW': '沙潘塔克辛站（BTS 往機場）', 'en-US': 'Saphan Taksin (BTS to the airport)' },
    arrive: { x: stationX - 4, y: BK.station.line + 1 },
  },
  background: '#cfc6b4',
  soundscape: 'market',
  paintGround: paintBangkokGround,
  props,
  solid,
  seats: BANGKOK_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  drawSeatFront: (c, i) => drawSeatFront(c, i),
  shops: BANGKOK_SHOPS,
  fortune: {
    at: r(BK.siamSi.x - 1.4, BK.siamSi.y, BK.siamSi.x + 1.4, BK.siamSi.y + 1.2),
    label: { x: BK.siamSi.x, y: BK.templeLine - 1.2 },
    title: { 'zh-TW': '臥佛寺 · 求籤（Siam Si）', 'en-US': 'Wat Pho · Siam Si fortune sticks' },
    hint: { 'zh-TW': '跪下來雙手搖竹籤筒，直到一支籤掉出來。', 'en-US': 'Kneel and shake the bamboo cup until one stick falls out.' },
    draw: { 'zh-TW': '搖籤', 'en-US': 'Shake' },
    again: { 'zh-TW': '再搖一支', 'en-US': 'Shake again' },
    fortunes: [
      { rank: { 'zh-TW': '上上籤', 'en-US': 'Excellent' }, text: { 'zh-TW': '像鄭王廟的黎明，今天一開始就閃閃發亮，想做的事都做得完！', 'en-US': 'Like Wat Arun at dawn — you shine from the start today. Everything gets done!' } },
      { rank: { 'zh-TW': '上籤', 'en-US': 'Very good' }, text: { 'zh-TW': '臥佛躺著也有 46 公尺長。慢慢來，累積起來就很驚人。', 'en-US': 'Even lying down, the Reclining Buddha is 46 metres long. Slow and steady adds up.' } },
      { rank: { 'zh-TW': '中籤', 'en-US': 'Good' }, text: { 'zh-TW': '像昭披耶河一樣，一直流就會到海。再專注一顆番茄鐘。', 'en-US': 'Like the Chao Phraya, keep flowing and you’ll reach the sea. One more pomodoro.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Fair' }, text: { 'zh-TW': '先喝一杯泰奶，Sabai sabai，放輕鬆再出發。', 'en-US': 'Have a Thai iced tea first. Sabai sabai — relax, then go.' } },
      { rank: { 'zh-TW': '下籤', 'en-US': 'Wait a bit' }, text: { 'zh-TW': '好運在後頭。Mai pen rai（沒關係），換個位子重新開始。', 'en-US': 'Luck comes later. Mai pen rai — never mind, change seats and start fresh.' } },
    ],
  },
  infos: [
    { at: r(BK.arun.x - 6, 0, BK.arun.x + 6, BK.farBank), title: { 'zh-TW': '鄭王廟（Wat Arun，黎明寺）', 'en-US': 'Wat Arun (Temple of Dawn)' }, text: { 'zh-TW': '在昭披耶河西岸的吞武里，中間的高塔（prang）大約 70 公尺，是高棉式的塔，19 世紀初拉瑪二世、三世時加高，表面貼滿中國商船帶來的彩色瓷片和貝殼。名字來自黎明之神阿魯納；晚上打燈變成金黃色，從對岸的塔田碼頭看最漂亮。', 'en-US': 'On the Thonburi (west) bank, its central Khmer-style prang rises about 70 m. Enlarged under Rama II and III in the early 1800s, it’s covered in coloured porcelain and seashells, much of it brought as ballast by Chinese ships. Named after Aruna, god of dawn — floodlit gold at night, best seen from Tha Tien across the river.' } },
    { at: r(0, BK.river.y0, BK.pier.x0, BK.river.y1), title: { 'zh-TW': '昭披耶河', 'en-US': 'Chao Phraya River' }, text: { 'zh-TW': '曼谷的母親河，以前曼谷被叫做「東方威尼斯」。河上有長尾船（船尾接一具引擎和長長的螺旋槳軸）、掛橘旗的昭披耶河快船、過河的渡輪，晚上還有掛滿燈的晚餐遊船；漂著的綠色植物是布袋蓮。', 'en-US': 'Bangkok’s “river of kings” — the city was once called the Venice of the East. Long-tail boats (a car engine on a long propeller shaft), orange-flag Chao Phraya Express boats, cross-river ferries and lit-up dinner cruises share the water with drifting water hyacinth.' } },
    { at: r(BK.pier.x0, BK.pier.y0, BK.pier.x1, BK.river.y1), title: { 'zh-TW': '塔田碼頭（Tha Tien）', 'en-US': 'Tha Tien Pier' }, text: { 'zh-TW': '臥佛寺旁邊的碼頭，搭幾塊泰銖的渡輪就能過河到鄭王廟，也是昭披耶河快船的一站。碼頭邊的老街屋以前賣乾貨，現在多了能看鄭王廟夕陽的屋頂酒吧。', 'en-US': 'The pier beside Wat Pho: a ferry ride of a few baht crosses to Wat Arun, and Chao Phraya Express boats stop here. The old shophouses once sold dried seafood; now rooftop bars face Wat Arun at sunset.' } },
    { at: r(BK.watPho.x0, BK.prom.y1 - 1.5, BK.watPhoGate - 2.2, BK.templeLine), title: { 'zh-TW': '臥佛寺（Wat Pho）', 'en-US': 'Wat Pho' }, text: { 'zh-TW': '曼谷最古老、最大的寺廟之一，臥佛長 46 公尺、腳底用貝殼鑲著 108 個吉祥圖案。四座彩色的大佛塔紀念拉瑪一世到四世。這裡也是泰式按摩的發源地，寺裡到現在還有按摩學校。門口的中國石像是以前運米到中國、回程壓船用的石頭。', 'en-US': 'One of Bangkok’s oldest and largest temples. The Reclining Buddha is 46 m long, with 108 auspicious symbols in mother-of-pearl on its soles. Four tiled chedis honour Rama I–IV. It’s the birthplace of Thai massage — there’s still a massage school here. The Chinese stone guardians came as ballast on rice ships returning from China.' } },
    { at: r(BK.palace.x0, BK.prom.y1 - 2, BK.palace.x1, BK.templeLine), title: { 'zh-TW': '大皇宮與玉佛寺', 'en-US': 'Grand Palace & Wat Phra Kaew' }, text: { 'zh-TW': '1782 年拉瑪一世建都曼谷時蓋的王宮，白色的城牆裡是金色的舍利塔、層層橘綠屋頂的玉佛寺，還有西式殿身配泰式尖塔的節基殿。玉佛一年換三次衣服（熱季、雨季、涼季），由國王親自主持。（實際上大皇宮在臥佛寺北邊，這裡把它們並排畫。）', 'en-US': 'Built in 1782 when Rama I made Bangkok the capital. Behind the white walls: a golden chedi, Wat Phra Kaew’s tiered orange-and-green roofs, and the Chakri Maha Prasat — a European-style hall crowned with Thai spires. The Emerald Buddha’s robes are changed three times a year by the King. (In reality the palace sits just north of Wat Pho; here they’re side by side.)' } },
    { at: r(0, BK.road.y0, BK.W, BK.road.y1), title: { 'zh-TW': '嘟嘟車（Tuk-tuk）', 'en-US': 'Tuk-tuk' }, text: { 'zh-TW': '三輪的機動計程車，因為引擎聲「嘟嘟嘟」得名。車身漆得五顏六色，晚上車底還會亮霓虹燈。上車前記得先講好價錢。', 'en-US': 'Three-wheeled motor taxis named for the putt-putt of their engines, painted in bright colours, some with neon under-glow at night. Agree on the fare before you hop in.' } },
    { at: r(BK.station.x0, BK.station.line - 6.4, BK.station.x1, BK.station.line), title: { 'zh-TW': 'BTS 空鐵 · 沙潘塔克辛站', 'en-US': 'BTS Skytrain · Saphan Taksin' }, text: { 'zh-TW': '1999 年通車的高架電車，在塞車的曼谷是最快的交通工具。沙潘塔克辛站就在河邊的沙吞碼頭旁，從這裡換船到塔田碼頭；往機場可以轉機場快線。（實際上車站在臥佛寺南邊三公里左右，這裡畫得比較近。）', 'en-US': 'The elevated railway opened in 1999 — the fastest way through Bangkok’s traffic. Saphan Taksin sits next to Sathorn Pier, where you switch to a boat for Tha Tien; for the airport, change to the Airport Rail Link. (It’s really about 3 km south of Wat Pho; drawn closer here.)' } },
    { at: r(BK.spiritHouse.x - 1, BK.spiritHouse.y - 3, BK.spiritHouse.x + 1, BK.spiritHouse.y), title: { 'zh-TW': '神屋（San Phra Phum）', 'en-US': 'Spirit House' }, text: { 'zh-TW': '泰國幾乎每棟房子、店家前面都有一座小小的神屋，供奉守護土地的神靈。每天會擺上花環、水果和紅色汽水。', 'en-US': 'Almost every Thai home and shop has a little spirit house for the guardian spirits of the land, offered garlands, fruit and red soda every day.' } },
  ],
  labels: [
    { x: 20, y: BK.prom.y1 + 0.1, text: { 'zh-TW': '🛕 河邊長椅看鄭王廟（坐下專注）', 'en-US': '🛕 Riverside benches facing Wat Arun (sit to focus)' }, color: '#fde68a' },
    { x: BK.sala.x, y: BK.road.y0 + 0.6, text: { 'zh-TW': '🪷 臥佛寺涼亭', 'en-US': '🪷 Wat Pho sala' }, color: '#fbcfe8' },
    { x: 17, y: BK.H - 0.2, text: { 'zh-TW': '🍜 路邊攤（塑膠椅坐下專注）', 'en-US': '🍜 Street food (plastic-stool seats)' }, color: '#fdba74' },
  ],
  walkers: [
    { x0: 1, y0: 18.3, x1: 57, y1: 18.3, count: 2 },
    { x0: 1, y0: 21.1, x1: 57, y1: 21.1, count: 4 },
    { x0: 35, y0: 21.5, x1: 35, y1: 29.5, count: 2 },
    { x0: 9, y0: 29.4, x1: 57, y1: 29.4, count: 3 },
    { x0: 1, y0: 38.6, x1: 35, y1: 38.6, count: 4 },
    { x0: 37, y0: 36.4, x1: 57, y1: 36.4, count: 2 },
    { x0: 1, y0: 44.2, x1: 57, y1: 44.2, count: 3 },
  ],
  traffic: [
    { y: 31.1, dir: -1, x0: 0, x1: BK.W, count: 1 },
    { y: 33.1, dir: 1, x0: 0, x1: BK.W, count: 1 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點河邊長椅（看鄭王廟）、臥佛寺涼亭或路邊攤的塑膠椅坐下專注 · 走到攤子買泰式炒河粉、芒果糯米飯、泰奶、椰子冰淇淋 · 臥佛寺門口求籤 · 點地標看介紹 · BTS 沙潘塔克辛站搭飛機回台灣',
    'en-US': 'WASD / arrows to move · click a riverside bench facing Wat Arun, the Wat Pho sala or a plastic stool to focus · walk up to the stalls for pad thai, mango sticky rice, Thai tea and coconut ice cream · shake Siam Si sticks at Wat Pho · click landmarks for info · BTS Saphan Taksin to fly home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅、涼亭或塑膠椅坐下專注 · 走到攤子買小吃 · 臥佛寺求籤 · 點地標看介紹 · BTS 車站',
    'en-US': 'Tap a bench, the sala or a stool to focus · visit the stalls · fortune sticks at Wat Pho · tap landmarks · BTS station',
  },
};
