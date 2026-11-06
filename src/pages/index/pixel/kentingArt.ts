// 墾丁的美術：大尖山（尖尖的山頭）、墾丁牧場的草坡和牛、海岸林；墾丁大街北邊的店（衝浪店、民宿、潛水店…，晚上霓虹招牌會亮）、
// 南邊人行道的夜市攤車和燈泡串、墾丁快線站牌；小灣沙灘（遮陽傘、躺椅、衝浪板架）、木頭觀景台；
// 海（浪會打上岸、衝浪客、香蕉船）、船帆石、東南海角上的鵝鑾鼻燈塔（晚上光束會轉）。最後組成 CityScene 用的 KENTING。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { DECK_BENCHES, DECK_BENCH_Y, KENTING_SEATS, KENTING_SHOPS, KT, LOUNGER_Y, MARKET_CARTS, MARKET_TABLES, TABLE_Y, UMBRELLAS } from './kenting';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, townhouseSprite, type Townhouse, drawLamp, drawBench, drawFoodCart, drawStringLights, drawMarketTable, drawStool, drawPalm, drawSeaWaves, drawParkedScooter, SCOOTER_COLORS } from './cityArt';

const CAPE_TOP = 26.8;
// 海角的輪廓（格）：x 越往東越高（越往北）
const capeEdge = (x: number) => (x < KT.cape.x0 ? Infinity : CAPE_TOP + Math.max(0, 49.5 - x) * 0.75 + Math.sin(x * 1.3) * 0.25);

// ── 地面（畫一次）──
export function paintKentingGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1984);
  const W = KT.W * T;
  const sl = KT.shopLine * T;
  const sky = c.createLinearGradient(0, 0, 0, 5 * T);
  sky.addColorStop(0, '#5fb4ec');
  sky.addColorStop(1, '#cfeefa');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, sl);
  for (let i = 0; i < 12; i += 1) {
    c.fillStyle = `rgba(255,255,255,${0.6 + rand() * 0.3})`;
    c.beginPath();
    c.ellipse(rand() * W, 0.6 * T + rand() * 2 * T, 18 + rand() * 22, 5 + rand() * 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  // 遠處的山稜、墾丁牧場的草坡（淺綠、圓圓的）
  c.fillStyle = '#7aa88a';
  c.beginPath();
  c.moveTo(0, 6 * T);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, 4.2 * T - Math.sin(x * 0.009 + 1) * 10 - Math.sin(x * 0.023) * 6);
  c.lineTo(W, 6 * T);
  c.fill();
  // 大尖山：平地上突然冒出來的尖山（綠色的坡、灰白的岩壁）
  const mx = 17 * T;
  const mb = 5.6 * T;
  c.fillStyle = '#3f7a4a';
  c.beginPath();
  c.moveTo(mx - 64, mb);
  c.quadraticCurveTo(mx - 30, mb - 20, mx - 12, mb - 62);
  c.quadraticCurveTo(mx - 4, mb - 74, mx + 6, mb - 66);
  c.quadraticCurveTo(mx + 24, mb - 30, mx + 70, mb);
  c.closePath();
  c.fill();
  c.fillStyle = '#9a9a8a';
  c.beginPath();
  c.moveTo(mx - 6, mb - 66);
  c.lineTo(mx + 4, mb - 64);
  c.lineTo(mx + 10, mb - 40);
  c.lineTo(mx + 2, mb - 30);
  c.lineTo(mx - 4, mb - 46);
  c.closePath();
  c.fill();
  px(c, '#b8b8a8', mx - 2, mb - 60, 3, 12);
  // 牧場的草坡
  c.fillStyle = '#9ccc72';
  c.beginPath();
  c.moveTo(0, sl);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, 5.4 * T - Math.sin(x * 0.012 + 2) * 8 - Math.sin(x * 0.031) * 4);
  c.lineTo(W, sl);
  c.fill();
  // 牛（黑白花）
  for (const [cx, cy] of [[30, 5.9], [33.4, 6.2], [40, 5.7], [44.6, 6.1]] as const) {
    const x = Math.round(cx * T);
    const y = Math.round(cy * T);
    px(c, '#f4f4f4', x, y, 9, 4);
    px(c, '#15171f', x + 2, y, 3, 2);
    px(c, '#15171f', x + 6, y + 2, 2, 2);
    px(c, '#f4f4f4', x + 8, y - 2, 3, 3);
    px(c, '#15171f', x + 1, y + 4, 1, 2);
    px(c, '#15171f', x + 7, y + 4, 1, 2);
  }
  // 海岸林（店後面）
  for (let i = 0; i < 60; i += 1) {
    c.fillStyle = ['#3d7a3c', '#4c8a46', '#5a9a52'][i % 3] ?? '#4c8a46';
    c.beginPath();
    c.arc(rand() * W, 6.6 * T + rand() * (sl - 6.8 * T), 6 + rand() * 6, 0, Math.PI * 2);
    c.fill();
  }
  // 北邊人行道、墾丁大街、南邊人行道（夜市）
  tiles(c, { x0: 0, y0: KT.shopLine, x1: KT.W, y1: KT.road.y0 }, '#d6cdbd', '#c7bfae', 8);
  road(c, { x0: 0, y0: KT.road.y0, x1: KT.W, y1: KT.road.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, '#f6c945', x, ((KT.road.y0 + KT.road.y1) / 2) * T - 1, 12, 2);
  zebra(c, 10.4, KT.road.y0 + 0.1, 13.4, KT.road.y1 - 0.1, false);
  zebra(c, 42, KT.road.y0 + 0.1, 45, KT.road.y1 - 0.1, false);
  tiles(c, { x0: 0, y0: KT.road.y1, x1: KT.W, y1: KT.sand }, '#e2d4b8', '#d2c4a6', 10);
  for (let i = 0; i < 200; i += 1) px(c, 'rgba(200,180,140,0.35)', Math.floor(rand() * W), Math.floor(KT.road.y1 * T + rand() * (KT.sand - KT.road.y1) * T), 2, 1);
  // 沙灘（越靠海越濕、顏色越深）、海
  const s0 = KT.sand * T;
  const sea0 = KT.sea * T;
  const sand = c.createLinearGradient(0, s0, 0, sea0);
  sand.addColorStop(0, '#f6e6b8');
  sand.addColorStop(0.75, '#eed8a0');
  sand.addColorStop(1, '#c9b07a');
  c.fillStyle = sand;
  c.fillRect(0, s0, W, sea0 - s0);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#e2cc94' : '#fff4d4', Math.floor(rand() * W), Math.floor(s0 + rand() * (sea0 - s0)), 1, 1);
  for (let i = 0; i < 14; i += 1) px(c, ['#ffffff', '#f4b8c8', '#f6d88a'][i % 3] ?? '#ffffff', Math.floor(rand() * W), Math.floor(s0 + 40 + rand() * (sea0 - s0 - 50)), 2, 2);
  const sea = c.createLinearGradient(0, sea0, 0, KT.H * T);
  sea.addColorStop(0, '#7ad8d4');
  sea.addColorStop(0.3, '#2aa8c4');
  sea.addColorStop(1, '#1a6aa8');
  c.fillStyle = sea;
  c.fillRect(0, sea0, W, KT.H * T - sea0);
  // 海裡的珊瑚礁（淺淺的深色斑）
  for (let i = 0; i < 20; i += 1) {
    c.fillStyle = 'rgba(30,90,110,0.25)';
    c.beginPath();
    c.ellipse(rand() * 44 * T, sea0 + 30 + rand() * (KT.H * T - sea0 - 40), 10 + rand() * 18, 3 + rand() * 4, 0, 0, Math.PI * 2);
    c.fill();
  }
  // 觀景台（木板）
  const d = KT.deck;
  px(c, '#8a5a32', d.x0 * T, d.y0 * T, (d.x1 - d.x0) * T, (d.y1 - d.y0) * T);
  for (let y = d.y0 * T; y < d.y1 * T; y += 4) px(c, y % 8 ? '#a8703f' : '#9a6436', d.x0 * T, y, (d.x1 - d.x0) * T, 3);
  px(c, '#6a4428', d.x0 * T, d.y1 * T, (d.x1 - d.x0) * T, 4);
  for (let x = d.x0 * T + 4; x < d.x1 * T; x += 24) px(c, '#5a3a22', x, d.y1 * T + 4, 4, 8);
  // 海角：礁岩（灰褐色、一格格的孔）＋上面的草
  c.fillStyle = '#9a8a72';
  c.beginPath();
  c.moveTo(KT.cape.x0 * T, KT.H * T);
  for (let x = KT.cape.x0; x <= KT.W + 0.01; x += 0.25) c.lineTo(x * T, capeEdge(x) * T);
  c.lineTo(W, KT.H * T);
  c.closePath();
  c.fill();
  for (let i = 0; i < 200; i += 1) {
    const x = KT.cape.x0 + rand() * (KT.W - KT.cape.x0);
    const y = capeEdge(x) + 0.6 + rand() * (KT.H - capeEdge(x));
    px(c, rand() < 0.5 ? '#7a6a56' : '#b0a088', Math.floor(x * T), Math.floor(y * T), 2, 2);
  }
  c.fillStyle = '#5f9a4a';
  c.beginPath();
  c.moveTo(KT.cape.x0 * T + 10, KT.H * T);
  for (let x = KT.cape.x0 + 0.6; x <= KT.W + 0.01; x += 0.25) c.lineTo(x * T, (capeEdge(x) + 0.3) * T);
  c.lineTo(W, KT.H * T);
  c.closePath();
  c.fill();
  for (let i = 0; i < 160; i += 1) {
    const x = KT.cape.x0 + 0.8 + rand() * (KT.W - KT.cape.x0 - 0.8);
    px(c, rand() < 0.5 ? '#548e40' : '#72ad5c', Math.floor(x * T), Math.floor((capeEdge(x) + 0.5 + rand() * (KT.H - capeEdge(x) - 0.5)) * T), 2, 1);
  }
}

// ── 墾丁大街北邊的店：街屋＋霓虹招牌（晚上會亮） ──
const SHOP_WORDS = ['衝浪', '民宿', '潛水', '泳衣', '冰店', '海產', '酒吧', '恆春'];
const SHOPS: Townhouse[] = (() => {
  const out: Townhouse[] = [];
  const rand = seeded(2600);
  let x = 0.2;
  while (x < KT.W - 1.6) {
    const w = Math.min(2.8 + Math.floor(rand() * 3) * 0.6, KT.W - 0.2 - x);
    out.push({ x0: x, x1: x + w, floors: 2 + Math.floor(rand() * 2), seed: Math.floor(rand() * 10000) });
    x += w;
  }
  return out;
})();
const NEON = ['#ff4aa8', '#4ae8ff', '#ffe04a', '#7aff6a', '#ff7a3a'];
function drawNeon(c: CanvasRenderingContext2D, b: Townhouse, i: number, d: DrawCtx): void {
  const cx = Math.round(((b.x0 + b.x1) / 2) * T);
  const by = Math.round(KT.shopLine * T);
  const col = NEON[i % NEON.length] ?? '#ff4aa8';
  const word = SHOP_WORDS[i % SHOP_WORDS.length] ?? '衝浪';
  // 直的霓虹燈招牌掛在騎樓柱子外面
  const sx = Math.round(b.x1 * T) - 8;
  px(c, '#15171f', sx, by - 46, 7, word.length * 7 + 4);
  const on = d.night && Math.floor(d.seconds * 1.3 + i) % 7 !== 0;
  for (const [k, ch] of [...word].entries()) text(c, ch, sx + 3.5, by - 42 + k * 7 + 1, on ? col : '#8a8a90', `900 6px ${FONT_TC}`);
  if (on) glow(c, sx + 3.5, by - 40 + word.length * 3, 16, col === '#ff4aa8' ? '255, 74, 168' : col === '#4ae8ff' ? '74, 232, 255' : col === '#ffe04a' ? '255, 224, 74' : col === '#7aff6a' ? '122, 255, 106' : '255, 122, 58', 0.45);
  if (i % 3 === 0) {
    // 店門口靠著的衝浪板
    for (const [k, sc] of [['#ff7a3a', 0], ['#4ae8ff', 1], ['#ffe04a', 2]] as const) {
      const fx = cx - 10 + sc * 6;
      px(c, k, fx, by - 24, 4, 22);
      px(c, 'rgba(255,255,255,0.5)', fx + 1, by - 22, 1, 18);
    }
  }
}

// 墾丁快線的站牌（候車亭）
function drawBusStop(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(KT.busStop.x * T);
  const by = Math.round(KT.busStop.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 34, by, 68, 3);
  for (const x of [cx - 30, cx + 26]) px(c, '#6a7080', x, by - 32, 4, 32);
  px(c, 'rgba(180,220,240,0.45)', cx - 26, by - 28, 52, 20);
  px(c, '#e8742a', cx - 36, by - 38, 72, 7);
  px(c, '#ff9a5a', cx - 36, by - 38, 72, 1);
  px(c, '#ffffff', cx - 32, by - 48, 64, 10);
  px(c, '#e8742a', cx - 32, by - 48, 64, 1);
  text(c, '墾丁快線 往左營', cx, by - 43, '#8a3a12', `900 6px ${FONT_TC}`);
  px(c, '#8a5a32', cx - 20, by - 10, 40, 3);
  px(c, '#3a3d45', cx - 18, by - 7, 2, 7);
  px(c, '#3a3d45', cx + 16, by - 7, 2, 7);
  if (d.night) glow(c, cx, by - 28, 36, '255, 220, 180', 0.4);
}

// ── 沙灘：遮陽傘（傘畫在人的上面）、躺椅（座位家具） ──
function drawUmbrella(c: CanvasRenderingContext2D, x: number, color: string): void {
  const cx = Math.round(x * T);
  const by = Math.round(LOUNGER_Y * T);
  px(c, '#e8e2d4', cx, by - 36, 2, 30);
  const top = by - 40;
  for (let k = 0; k < 8; k += 1) {
    c.fillStyle = k % 2 ? color : '#ffffff';
    c.beginPath();
    c.moveTo(cx + 1, top - 6);
    c.lineTo(cx + 1 - 26 + k * 6.5, top + 6);
    c.lineTo(cx + 1 - 26 + (k + 1) * 6.5, top + 6);
    c.closePath();
    c.fill();
  }
  px(c, '#e8e2d4', cx - 1, top - 8, 4, 3);
}
function drawLounger(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.15)', cx - 7, by + 1, 14, 3);
  px(c, '#f2f2f2', cx - 7, by - 4, 14, 8);
  for (let k = 0; k < 14; k += 4) px(c, '#3f86d0', cx - 7 + k, by - 4, 2, 8);
  px(c, '#f2f2f2', cx - 7, by - 10, 14, 6);
  for (let k = 0; k < 14; k += 4) px(c, '#3f86d0', cx - 7 + k, by - 10, 2, 6);
  px(c, '#8a8a90', cx - 6, by + 4, 2, 2);
  px(c, '#8a8a90', cx + 4, by + 4, 2, 2);
}

// 觀景台南邊的木欄杆
function drawDeckRail(c: CanvasRenderingContext2D): void {
  const d = KT.deck;
  const by = Math.round(d.y1 * T);
  for (let x = d.x0 * T; x <= d.x1 * T; x += 12) px(c, '#6a4428', Math.round(x), by - 12, 3, 12);
  px(c, '#8a5a32', d.x0 * T, by - 13, (d.x1 - d.x0) * T + 3, 3);
  px(c, '#8a5a32', d.x0 * T, by - 7, (d.x1 - d.x0) * T + 3, 2);
}

// ── 海上：衝浪客（在浪上滑來滑去）、香蕉船（被水上摩托車拖著跑） ──
function drawSeaLife(c: CanvasRenderingContext2D, d: DrawCtx): void {
  for (let k = 0; k < 3; k += 1) {
    const x = ((d.seconds * (8 + k * 3) + k * 220) % (40 * T)) + 2 * T;
    const y = (KT.sea + 1.2 + k * 0.9) * T + Math.sin(d.seconds * 1.5 + k) * 3;
    const cx = Math.round(x);
    const cy = Math.round(y);
    px(c, ['#ff7a3a', '#ffe04a', '#4ae8ff'][k] ?? '#ff7a3a', cx - 7, cy, 14, 3);
    px(c, '#15171f', cx - 2, cy - 9, 4, 9);
    px(c, '#e8b48a', cx - 1, cy - 12, 3, 3);
    px(c, '#15171f', cx - 5, cy - 7, 3, 1);
    px(c, '#15171f', cx + 2, cy - 8, 3, 1);
    px(c, 'rgba(255,255,255,0.7)', cx - 10, cy + 2, 4, 1);
  }
  // 香蕉船：水上摩托車在前、後面一條黃色的船、坐著三個人
  const t = (d.seconds * 0.04) % 1;
  const bx = Math.round((-6 + t * 54) * T);
  const by = Math.round(36.2 * T + Math.sin(d.seconds * 1.1) * 4);
  px(c, 'rgba(255,255,255,0.5)', bx - 70, by + 2, 30, 2);
  px(c, '#f6d23f', bx - 52, by - 4, 34, 6);
  px(c, '#e8b82a', bx - 52, by + 1, 34, 1);
  for (let k = 0; k < 3; k += 1) {
    px(c, ['#ff5a4a', '#3f86d0', '#2a9a5a'][k] ?? '#ff5a4a', bx - 46 + k * 10, by - 10, 4, 6);
    px(c, '#e8b48a', bx - 46 + k * 10, by - 13, 4, 3);
  }
  px(c, '#f2f2f2', bx - 18, by - 1, 16, 1);
  px(c, '#e23a2a', bx, by - 5, 14, 6);
  px(c, '#15171f', bx + 4, by - 11, 4, 6);
  px(c, '#e8b48a', bx + 4, by - 14, 4, 3);
  px(c, 'rgba(255,255,255,0.8)', bx - 4, by + 1, 6, 2);
}

// 船帆石：海裡一塊像帆的大石頭
function drawSailRock(c: CanvasRenderingContext2D): void {
  const cx = Math.round(KT.sailRock.x * T);
  const by = Math.round(KT.sailRock.y * T);
  px(c, 'rgba(255,255,255,0.6)', cx - 20, by - 2, 40, 3);
  c.fillStyle = '#7a6a56';
  c.beginPath();
  c.moveTo(cx - 16, by);
  c.lineTo(cx - 12, by - 22);
  c.quadraticCurveTo(cx - 6, by - 40, cx + 4, by - 36);
  c.quadraticCurveTo(cx + 14, by - 20, cx + 16, by);
  c.closePath();
  c.fill();
  px(c, '#9a8a72', cx - 8, by - 34, 6, 20);
  px(c, '#4f7a3a', cx - 6, by - 38, 10, 3);
}

// ── 鵝鑾鼻燈塔：白色的圓塔、黑色的燈室，晚上光束一圈圈掃過海面 ──
function lighthouseSprite(): HTMLCanvasElement {
  return cached('kt-lighthouse', 36, 92, (c) => {
    const cx = 18;
    px(c, '#e8e4dc', 6, 82, 24, 10);
    px(c, '#c9c4ba', 6, 90, 24, 2);
    c.fillStyle = '#f8f8f6';
    c.beginPath();
    c.moveTo(cx - 9, 84);
    c.lineTo(cx - 6, 26);
    c.lineTo(cx + 6, 26);
    c.lineTo(cx + 9, 84);
    c.closePath();
    c.fill();
    px(c, '#dcdad4', cx + 3, 28, 4, 56);
    for (const y of [40, 56, 70]) px(c, '#2f3a4a', cx - 1, y, 3, 5);
    px(c, '#2b2d33', cx - 10, 22, 20, 4);
    px(c, '#2b2d33', cx - 6, 10, 12, 12);
    px(c, '#f6e8a8', cx - 4, 12, 8, 8);
    c.fillStyle = '#2b2d33';
    c.beginPath();
    c.moveTo(cx - 8, 10);
    c.lineTo(cx, 2);
    c.lineTo(cx + 8, 10);
    c.closePath();
    c.fill();
    px(c, '#2b2d33', cx - 1, 0, 2, 3);
  });
}
function drawLighthouse(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = Math.round(KT.lighthouse.x * T) - 18;
  const by = Math.round(KT.lighthouse.y * T);
  blit(c, lighthouseSprite(), x, by);
  const lx = x + 18;
  const ly = by - 92 + 16;
  if (d.night) {
    glow(c, lx, ly, 26, '255, 240, 180', 0.8);
    // 光束：往海面那邊（西邊）掃過去，轉到背面的時候變短（只畫在地圖裡）
    const a = (d.seconds * 0.6) % (Math.PI * 2);
    const len = 40 + 260 * Math.max(0, Math.cos(a));
    const spread = 10 + 10 * Math.abs(Math.sin(a));
    c.save();
    c.beginPath();
    c.rect(0, 0, KT.W * T, KT.H * T);
    c.clip();
    c.fillStyle = 'rgba(255, 245, 200, 0.22)';
    c.beginPath();
    c.moveTo(lx, ly);
    c.lineTo(lx - len, ly - spread + Math.sin(a) * 20);
    c.lineTo(lx - len, ly + spread + Math.sin(a) * 20);
    c.closePath();
    c.fill();
    c.restore();
  }
}

// ── 組成 CityScene 用的資料 ──
const PALMS: [number, number][] = [[1.4, 20.6], [8, 20.8], [14.6, 20.6], [40.4, 20.8], [46, 20.6], [52.6, 20.8], [16.4, 23.2], [42.4, 24.8]];
const LAMPS: [number, number][] = [[8.6, 13.9], [18, 13.9], [27, 13.9], [36, 13.9], [44, 13.9], [52, 13.9]];
const SCOOTERS: [number, number][] = [44.8, 46, 47.2, 48.4, 49.6, 50.8, 52, 53.2, 54.4].map((x): [number, number] => [x, 17.6]);
const UMBRELLA_COLORS = ['#e23a2a', '#1f5fa8'];

const props: CityProp[] = [
  ...SHOPS.map((b): CityProp => ({ y: KT.shopLine, draw: (c) => blit(c, townhouseSprite('kt', b, SHOP_WORDS), b.x0 * T, KT.shopLine * T) })),
  ...SHOPS.map((b, i): CityProp => ({ y: KT.shopLine + 0.01, draw: (c, d) => drawNeon(c, b, i, d) })),
  { y: KT.busStop.y, draw: (c, d) => drawBusStop(c, d) },
  ...MARKET_CARTS.map((s, i): CityProp => ({ y: KT.cartY, draw: (c, d) => drawFoodCart(c, s.x, KT.cartY, s.name, s.awning, s.food, d.seconds + i * 0.37, 47 + i * 7) })),
  { y: KT.cartY + 0.02, draw: (c, d) => drawStringLights(c, KT.market.x0, KT.market.x1, KT.cartY - 2.9, d.night, 6) },
  ...MARKET_TABLES.map((x): CityProp => ({ y: TABLE_Y, draw: (c) => drawMarketTable(c, x, TABLE_Y) })),
  ...DECK_BENCHES.map((x): CityProp => ({ y: DECK_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, DECK_BENCH_Y, 2.6) })),
  { y: KT.deck.y1, draw: (c) => drawDeckRail(c) },
  ...UMBRELLAS.map((x, i): CityProp => ({ y: LOUNGER_Y + 0.02, draw: (c) => drawUmbrella(c, x, UMBRELLA_COLORS[i] ?? '#e23a2a') })),
  { y: KT.sea, draw: (c, d) => drawSeaWaves(c, 0, KT.cape.x0 + 0.5, KT.sea, KT.H, d.seconds) },
  { y: KT.sea + 0.5, draw: (c, d) => drawSeaLife(c, d) },
  { y: KT.sailRock.y, draw: (c) => drawSailRock(c) },
  { y: KT.lighthouse.y, draw: (c, d) => drawLighthouse(c, d) },
  ...PALMS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawPalm(c, x, y, d.seconds, 40) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[i % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 海（和觀景台的欄杆外）不能走；海角上去不了
function blocked(x: number, y: number): boolean {
  if (y > KT.sea + 0.3) return true;
  return y > capeEdge(x) - 0.2;
}
const solid: Rect[] = [
  r(0, 0, KT.W, KT.shopLine - 0.15),
  r(KT.busStop.x - 2.2, KT.busStop.y - 0.8, KT.busStop.x + 2.2, KT.busStop.y - 0.05),
  ...MARKET_CARTS.map((s) => r(s.x - 1.25, KT.cartY - 0.8, s.x + 1.25, KT.cartY - 0.05)),
  ...MARKET_TABLES.map((x) => r(x - 1.2, TABLE_Y - 0.4, x + 1.2, TABLE_Y)),
  ...DECK_BENCHES.map((x) => r(x - 1.3, DECK_BENCH_Y - 0.75, x + 1.3, DECK_BENCH_Y - 0.45)),
  r(KT.deck.x0, KT.deck.y1 - 0.3, KT.deck.x1, KT.deck.y1 + 0.2),
  ...UMBRELLAS.map((x) => r(x - 0.1, LOUNGER_Y - 0.2, x + 0.2, LOUNGER_Y + 0.05)),
  ...PALMS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
  r(44.4, 17.2, 54.8, 17.8),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...MARKET_CARTS.map((s) => ({ x: s.x * T, y: KT.cartY * T - 14, r: 40, color: 'rgba(255, 215, 140, 0.55)' })),
  ...SHOPS.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: KT.shopLine * T - 10, r: 30, color: 'rgba(255, 200, 220, 0.45)' })),
  { x: KT.busStop.x * T, y: KT.busStop.y * T - 28, r: 40, color: 'rgba(255, 220, 180, 0.4)' },
  { x: KT.lighthouse.x * T, y: KT.lighthouse.y * T - 76, r: 60, color: 'rgba(255, 240, 180, 0.6)' },
];

export const KENTING: CityDef = {
  id: 'kenting',
  W: KT.W,
  H: KT.H,
  title: { 'zh-TW': '墾丁 · 墾丁大街與小灣沙灘', 'en-US': 'Kenting · Kenting Street & Xiaowan Beach' },
  stop: { 'zh-TW': '墾丁（左營轉巴士）', 'en-US': 'Kenting (bus via Zuoying)' },
  emoji: '🏖️',
  station: {
    x: KT.busStop.x,
    y: KT.busStop.y + 0.7,
    name: { 'zh-TW': '墾丁快線站牌（往高鐵左營站）', 'en-US': 'Kenting Express stop (to THSR Zuoying)' },
    arrive: { x: KT.busStop.x + 3.2, y: KT.busStop.y + 0.9 },
  },
  background: '#d9d0bf',
  soundscape: 'beach',
  paintGround: paintKentingGround,
  props,
  solid,
  blocked,
  seats: KENTING_SEATS,
  drawSeat: (c, i) => {
    const s = KENTING_SEATS[i];
    if (!s) return;
    if (i >= 4 && i < 8) drawLounger(c, s.x, s.y);
    else if (i >= 8) drawStool(c, s.x, s.y, '#1f9ad6');
  },
  shops: KENTING_SHOPS,
  infos: [
    { at: r(12, 0, 24, 5.8), title: { 'zh-TW': '大尖山', 'en-US': 'Dajianshan' }, text: { 'zh-TW': '墾丁最好認的山，在平地上突然冒出一座尖尖的山頭。山腳下是墾丁牧場，常常看到牛在草坡上吃草。', 'en-US': 'Kenting’s most recognisable peak, rising suddenly from the flatland. Below it is Kenting Ranch, with cattle grazing on the slopes.' } },
    { at: r(0, 6.6, KT.W, KT.road.y1), title: { 'zh-TW': '墾丁大街', 'en-US': 'Kenting Street' }, text: { 'zh-TW': '屏鵝公路經過墾丁的那一段，兩邊都是衝浪店、民宿和餐廳；一到晚上路邊擺滿攤子，整條變成夜市。', 'en-US': 'The stretch of the Pingtung–Eluanbi road through Kenting, lined with surf shops, guesthouses and restaurants. At night stalls fill the roadside and the whole street becomes a night market.' } },
    { at: r(KT.market.x0, KT.road.y1, KT.market.x1, KT.sand), title: { 'zh-TW': '大街夜市', 'en-US': 'Street Night Market' }, text: { 'zh-TW': '飛魚卵香腸、碳烤魷魚、現剖椰子和芒果冰都是大街的招牌。恆春半島的洋蔥也很有名。', 'en-US': 'Flying-fish roe sausage, grilled squid, fresh coconuts and mango ice are the street’s signatures. Hengchun Peninsula onions are famous too.' } },
    { at: r(14, KT.sand, KT.cape.x0, KT.sea), title: { 'zh-TW': '小灣沙灘', 'en-US': 'Xiaowan Beach' }, text: { 'zh-TW': '從大街走幾步就到的白沙灘，海水很清，外面是珊瑚礁。夏天整片都是遮陽傘和玩水的人。', 'en-US': 'A white-sand beach a few steps from the main street, with clear water and coral reef offshore. In summer it’s full of umbrellas and swimmers.' } },
    { at: r(KT.sailRock.x - 1.2, KT.sailRock.y - 2.6, KT.sailRock.x + 1.2, KT.sailRock.y), title: { 'zh-TW': '船帆石', 'en-US': 'Sail Rock' }, text: { 'zh-TW': '海邊一塊十幾公尺高的珊瑚礁岩，遠看像一艘帆船，也有人說像美國總統尼克森的側臉。其實在大街往南幾公里。', 'en-US': 'A coral rock over ten metres tall that looks like a sailing ship from afar — some say it resembles Nixon’s profile. In reality it’s a few kilometres south of the main street.' } },
    { at: r(KT.cape.x0, 24, KT.W, KT.H), title: { 'zh-TW': '鵝鑾鼻燈塔', 'en-US': 'Eluanbi Lighthouse' }, text: { 'zh-TW': '台灣最南端的白色燈塔，1883 年建成，被稱為「東亞之光」。在墾丁往南大約 8 公里。', 'en-US': 'The white lighthouse at Taiwan’s southern tip, built in 1883 and called “the Light of East Asia”. It’s about 8 km south of Kenting.' } },
  ],
  labels: [
    { x: 27.4, y: 21.2, text: { 'zh-TW': '🌙 墾丁大街夜市', 'en-US': '🌙 Kenting Street Market' }, color: '#f472b6' },
    { x: 7, y: KT.deck.y0 - 0.4, text: { 'zh-TW': '🌅 觀景台（長椅坐下專注）', 'en-US': '🌅 Lookout deck (sit on a bench)' }, color: '#fbbf24' },
    { x: 36, y: 23.4, text: { 'zh-TW': '🏖️ 小灣沙灘', 'en-US': '🏖️ Xiaowan Beach' }, color: '#7dd3fc' },
  ],
  walkers: [
    { x0: 1, y0: 10.9, x1: 55, y1: 10.9, count: 4 },
    { x0: 14, y0: 18, x1: 42, y1: 18, count: 4 },
    { x0: 1, y0: 21, x1: 44, y1: 21, count: 2 },
    { x0: 15, y0: 27.6, x1: 45, y1: 27.6, count: 3 },
    { x0: 2, y0: 24, x1: 12, y1: 24, count: 1 },
  ],
  traffic: [
    { y: 11.8, dir: 1, x0: 0, x1: KT.W, count: 2 },
    { y: 13, dir: -1, x0: 0, x1: KT.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點觀景台的長椅、沙灘的躺椅或大街夜市的桌子坐下專注 · 走到攤車買飛魚卵香腸、椰子、芒果冰 · 點地標看介紹 · 墾丁快線站牌回台北（轉高鐵）',
    'en-US': 'WASD / arrows to move · click a lookout bench, a beach lounger or a night-market table to focus · walk up to the carts for flying-fish roe sausage, coconuts and mango ice · click landmarks for info · Kenting Express stop back to Taipei (via THSR)',
  },
  hintTouch: {
    'zh-TW': '點觀景台長椅、沙灘躺椅或夜市桌子坐下專注 · 走到攤車買東西 · 點地標看介紹 · 站牌回台北',
    'en-US': 'Tap a lookout bench, lounger or table to focus · walk up to the carts · tap landmarks · bus stop back to Taipei',
  },
};
