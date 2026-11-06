// 澎湖的美術：澎湖天后宮（石台基、深色木構三川門、門神、「天后宮」匾、燕尾脊、香爐的煙）、中央老街的咾咕石老屋（珊瑚石砌的牆、紅瓦）、
// 四眼井、小吃攤、海邊步道；海灣與外海（浪、漁船、渡輪）、西瀛虹橋（白色大拱，晚上彩虹燈＋煙火）、觀音亭、馬公港渡輪站、石滬。
// 最後組成 CityScene 用的 PENGHU。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { COVE_BENCHES, COVE_BENCH_Y, KUANYIN_BENCHES, KUANYIN_BENCH_Y, MARKET_CARTS, MARKET_TABLES, PENGHU_SEATS, PENGHU_SHOPS, PH, TABLE_Y, TEMPLE_DOOR } from './penghu';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, drawLamp, drawBench, drawFoodCart, drawArch, drawStringLights, drawMarketTable, drawStool, drawSeaWaves, drawParkedScooter, SCOOTER_COLORS } from './cityArt';

const inCove = (x: number, y: number) => x > PH.cove.x0 && x < PH.cove.x1 && y > PH.cove.y0;

// ── 地面（畫一次）──
export function paintPenghuGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1604);
  const W = PH.W * T;
  const H = PH.H * T;
  // 北邊老屋後面：天空、遠遠一排低低的屋頂
  const sky = c.createLinearGradient(0, 0, 0, 5 * T);
  sky.addColorStop(0, '#6ab4e8');
  sky.addColorStop(1, '#d4eef8');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, PH.rowLine * T);
  for (let i = 0; i < 10; i += 1) {
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath();
    c.ellipse(rand() * W, 0.8 * T + rand() * 2 * T, 18 + rand() * 20, 4 + rand() * 3, 0, 0, Math.PI * 2);
    c.fill();
  }
  for (let x = 0; x < W; ) {
    const w = 30 + Math.floor(rand() * 40);
    const h = 18 + Math.floor(rand() * 20);
    px(c, rand() < 0.5 ? '#c9bfa8' : '#d8d0bc', x, 6.4 * T - h, w, h + 2 * T);
    px(c, rand() < 0.5 ? '#b5553f' : '#8a8a8a', x, 6.4 * T - h - 3, w, 3);
    x += w + 2;
  }
  px(c, '#b8ae98', 0, 6.4 * T, W, (PH.rowLine - 6.4) * T);
  // 廣場（石板）、四眼井旁邊一圈
  tiles(c, { x0: 0, y0: PH.plaza.y0, x1: PH.W, y1: PH.plaza.y1 }, '#d6cdbd', '#c4bba9', 12);
  for (let i = 0; i < 300; i += 1) px(c, 'rgba(120,100,70,0.12)', Math.floor(rand() * W), Math.floor(PH.plaza.y0 * T + rand() * (PH.plaza.y1 - PH.plaza.y0) * T), 3, 2);
  c.fillStyle = '#c4bba9';
  c.beginPath();
  c.arc(PH.well.x * T, PH.well.y * T - 6, 2.4 * T, 0, Math.PI * 2);
  c.fill();
  tiles(c, { x0: PH.market.x0, y0: PH.plaza.y0 + 2, x1: PH.W, y1: PH.plaza.y1 }, '#b9a99a', '#a89888', 8);
  // 馬路
  px(c, '#c9c0ae', 0, PH.plaza.y1 * T, W, (PH.road.y0 - PH.plaza.y1) * T);
  road(c, { x0: 0, y0: PH.road.y0, x1: PH.W, y1: PH.road.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.75)', x, ((PH.road.y0 + PH.road.y1) / 2) * T, 10, 2);
  zebra(c, 23, PH.road.y0 + 0.1, 27, PH.road.y1 - 0.1, false);
  zebra(c, 42, PH.road.y0 + 0.1, 46, PH.road.y1 - 0.1, false);
  // 海邊的步道、兩岸（觀音亭公園的草、馬公港的水泥地）
  tiles(c, { x0: 0, y0: PH.road.y1, x1: PH.W, y1: PH.openSea }, '#e2d8c4', '#d0c6b0', 10);
  c.fillStyle = '#6fa85a';
  c.fillRect(0, 28.4 * T, PH.cove.x0 * T, (PH.openSea - 28.4) * T);
  for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#62994e' : '#7cb866', Math.floor(rand() * PH.cove.x0 * T), Math.floor(28.4 * T + rand() * (PH.openSea - 28.4) * T), 2, 1);
  tiles(c, { x0: 0.4, y0: 32.4, x1: PH.cove.x0 - 0.4, y1: 35 }, '#e2d8c4', '#d0c6b0', 10);
  tiles(c, { x0: PH.cove.x1, y0: 27.6, x1: PH.W, y1: PH.openSea }, '#c9c4b8', '#b8b3a6', 12);
  // 海：海灣＋外海（淺的地方綠綠的）
  const sea = c.createLinearGradient(0, PH.cove.y0 * T, 0, H);
  sea.addColorStop(0, '#5ac8c8');
  sea.addColorStop(0.4, '#2a98b8');
  sea.addColorStop(1, '#1a6a9a');
  c.fillStyle = sea;
  c.fillRect(PH.cove.x0 * T, PH.cove.y0 * T, (PH.cove.x1 - PH.cove.x0) * T, H - PH.cove.y0 * T);
  c.fillRect(0, PH.openSea * T, W, H - PH.openSea * T);
  // 岸邊的石頭護岸
  const edge = (x0: number, y0: number, w: number, h: number) => {
    px(c, '#9a948a', x0, y0, w, h);
    for (let k = 0; k < Math.max(w, h); k += 5) px(c, k % 10 ? '#8a847a' : '#b0aa9e', w > h ? x0 + k : x0, w > h ? y0 : y0 + k, w > h ? 4 : w, w > h ? h : 4);
  };
  edge(PH.cove.x0 * T, PH.cove.y0 * T - 3, (PH.cove.x1 - PH.cove.x0) * T, 3);
  edge(PH.cove.x0 * T - 3, PH.cove.y0 * T, 3, (PH.openSea - PH.cove.y0) * T);
  edge(PH.cove.x1 * T, PH.cove.y0 * T, 3, (PH.openSea - PH.cove.y0) * T);
  edge(0, PH.openSea * T - 3, PH.cove.x0 * T, 3);
  edge(PH.cove.x1 * T, PH.openSea * T - 3, W - PH.cove.x1 * T, 3);
  // 西瀛虹橋的橋面（木板＋白欄杆），從西岸接到東岸
  const b0 = PH.bridge.y0 * T;
  const b1 = PH.bridge.y1 * T;
  px(c, 'rgba(0,0,0,0.2)', PH.cove.x0 * T, b1, (PH.cove.x1 - PH.cove.x0) * T, 4);
  px(c, '#c9b08a', PH.cove.x0 * T - 3, b0, (PH.cove.x1 - PH.cove.x0) * T + 6, b1 - b0);
  for (let x = PH.cove.x0 * T; x < PH.cove.x1 * T; x += 4) px(c, '#b59a74', x, b0, 1, b1 - b0);
  // 碼頭（伸進外海）
  px(c, '#a8a296', PH.pier.x0 * T, PH.openSea * T - 3, (PH.pier.x1 - PH.pier.x0) * T, H - PH.openSea * T + 3);
  for (let y = PH.openSea * T; y < H; y += 10) px(c, '#8a847a', PH.pier.x0 * T, y, (PH.pier.x1 - PH.pier.x0) * T, 1);
  // 石滬：外海西邊淺水裡用石頭疊的雙心形（退潮時魚會被困在裡面）
  c.strokeStyle = '#8a8478';
  c.lineWidth = 3;
  const heart = (cx: number, cy: number, s: number) => {
    c.beginPath();
    c.moveTo(cx, cy + s * 0.9);
    c.bezierCurveTo(cx - s * 1.4, cy, cx - s * 0.8, cy - s * 0.9, cx, cy - s * 0.3);
    c.bezierCurveTo(cx + s * 0.8, cy - s * 0.9, cx + s * 1.4, cy, cx, cy + s * 0.9);
    c.stroke();
  };
  heart(6 * T, 36.6 * T, 22);
  heart(6 * T, 36.8 * T, 13);
}

// ── 天后宮：石台基、深色木構的三川門（門神、石獅）、「天后宮」匾、灰紅瓦屋頂、燕尾脊、屋脊上的剪黏 ──
function templeSprite(): HTMLCanvasElement {
  const w = Math.round((PH.temple.x1 - PH.temple.x0) * T);
  const h = 96;
  return cached('ph-temple', w, h, (c) => {
    const cx = w / 2;
    // 台基、石階
    px(c, '#a8a296', 0, h - 8, w, 8);
    px(c, '#c4beb2', 0, h - 8, w, 1);
    px(c, '#b8b2a6', cx - 20, h - 4, 40, 4);
    // 牆（兩邊咾咕石＋中間木構）
    for (const x0 of [4, w - 40]) {
      px(c, '#b5a88e', x0, h - 52, 36, 44);
      for (let i = 0; i < 40; i += 1) px(c, i % 2 ? '#a0927a' : '#c9bea4', x0 + ((i * 13) % 34), h - 50 + ((i * 7) % 40), 4, 3);
      px(c, '#3a2a1e', x0 + 10, h - 40, 16, 16);
      for (let k = 0; k < 16; k += 4) px(c, '#8a6a4a', x0 + 10 + k, h - 40, 1, 16);
    }
    px(c, '#6a3e26', 40, h - 56, w - 80, 48);
    for (let x = 42; x < w - 42; x += 6) px(c, '#5a3220', x, h - 56, 1, 48);
    // 三扇門＋門神（彩色的人像）
    for (const [dx, dw] of [[-30, 18], [-11, 22], [13, 18]] as const) {
      px(c, '#2a1a12', cx + dx, h - 40, dw, 32);
      px(c, '#7a2a1a', cx + dx + 1, h - 39, dw - 2, 30);
      px(c, '#2a1a12', cx + dx + Math.floor(dw / 2), h - 39, 1, 30);
      if (dw > 20) {
        for (const ox of [3, 13]) {
          px(c, '#f6c945', cx + dx + ox, h - 34, 6, 4);
          px(c, '#e8b48a', cx + dx + ox + 1, h - 30, 4, 3);
          px(c, '#2a7a46', cx + dx + ox, h - 27, 6, 10);
          px(c, '#c62828', cx + dx + ox + 1, h - 25, 4, 2);
        }
      }
    }
    // 匾
    px(c, '#2a1a12', cx - 20, h - 54, 40, 11);
    px(c, '#f6c945', cx - 20, h - 54, 40, 1);
    text(c, '天后宮', cx, h - 48.5, '#f6c945', `900 8px ${SERIF_TC}`);
    // 石獅
    for (const x of [cx - 40, cx + 34]) {
      px(c, '#8a8478', x, h - 18, 7, 10);
      px(c, '#a8a296', x, h - 22, 7, 5);
    }
    // 屋頂：三段（中間高），燕尾往上翹、屋脊上的剪黏
    const roof = (x0: number, x1: number, top: number, base: number) => {
      c.fillStyle = '#9a5a3e';
      c.beginPath();
      c.moveTo(x0 - 6, base);
      c.lineTo(x0 + 6, top);
      c.lineTo(x1 - 6, top);
      c.lineTo(x1 + 6, base);
      c.closePath();
      c.fill();
      for (let y = top + 2; y < base; y += 3) px(c, '#844a32', x0 + 2, y, x1 - x0 - 4, 1);
      px(c, '#5a3a2a', x0 - 6, base, x1 - x0 + 12, 2);
      px(c, '#6a6a6a', x0 + 4, top - 3, x1 - x0 - 8, 4);
      // 燕尾
      c.fillStyle = '#6a6a6a';
      for (const [sx, dir] of [[x0 + 4, -1], [x1 - 4, 1]] as const) {
        c.beginPath();
        c.moveTo(sx, top + 1);
        c.quadraticCurveTo(sx + dir * 6, top - 1, sx + dir * 10, top - 10);
        c.lineTo(sx + dir * 7, top - 9);
        c.quadraticCurveTo(sx + dir * 4, top - 3, sx, top - 3);
        c.closePath();
        c.fill();
      }
    };
    roof(2, 42, 30, h - 54);
    roof(w - 42, w - 2, 30, h - 54);
    roof(36, w - 36, 18, h - 56);
    // 剪黏：中脊上的雙龍搶珠（綠藍黃的小碎片）
    for (let k = 0; k < 9; k += 1) px(c, ['#2a9a5a', '#3f86d0', '#f6c945'][k % 3] ?? '#2a9a5a', 48 + k * ((w - 96) / 8), 12 + (k % 2) * 2, 4, 3);
    px(c, '#e23a2a', cx - 3, 8, 6, 6);
    px(c, '#f6c945', cx - 1, 6, 2, 2);
  });
}

// 廟前的香爐（煙往上飄）
function drawCenser(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(TEMPLE_DOOR.x * T) - 50;
  const by = Math.round((PH.rowLine + 2.2) * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 9, by, 18, 3);
  px(c, '#7a5a2a', cx - 8, by - 10, 16, 10);
  px(c, '#a8803a', cx - 8, by - 10, 16, 2);
  px(c, '#5a4024', cx - 6, by - 14, 12, 4);
  for (let k = 0; k < 4; k += 1) {
    const t = (d.seconds * 0.35 + k / 4) % 1;
    px(c, `rgba(230,230,230,${0.5 * (1 - t)})`, Math.round(cx - 2 + Math.sin(t * 6 + k) * 4), Math.round(by - 16 - t * 40), 4, 3);
  }
}

// ── 中央老街的咾咕石老屋：珊瑚石砌的牆（灰白色、一塊塊有孔的石頭）、木門窗、紅瓦屋頂 ──
interface Coral {
  x0: number;
  x1: number;
  seed: number;
}
const CORAL_WORDS = ['鹹餅', '冬瓜糕', '海產', '民宿', '咾咕石', '老街'];
function coralSprite(b: Coral): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 62;
  return cached(`ph-coral-${b.seed}`, w, h, (c) => {
    const rand = seeded(b.seed);
    const two = rand() < 0.5;
    const top = two ? 14 : 28;
    px(c, '#c9bea4', 2, top, w - 4, h - top);
    for (let i = 0; i < (w * (h - top)) / 18; i += 1) {
      px(c, rand() < 0.5 ? '#b5a88e' : '#ddd3bc', 3 + Math.floor(rand() * (w - 8)), top + 1 + Math.floor(rand() * (h - top - 3)), 3 + Math.floor(rand() * 3), 2);
      if (rand() < 0.3) px(c, '#8a7e68', 3 + Math.floor(rand() * (w - 6)), top + 1 + Math.floor(rand() * (h - top - 3)), 1, 1);
    }
    // 門、窗
    px(c, '#3a2a1e', w / 2 - 7, h - 22, 14, 22);
    px(c, '#6a3e26', w / 2 - 6, h - 21, 12, 21);
    px(c, '#3a2a1e', w / 2, h - 21, 1, 21);
    for (const wx of [5, w - 15]) {
      if (wx < w / 2 - 8 || wx > w / 2 + 8) {
        px(c, '#3a2a1e', wx, h - 32, 10, 10);
        px(c, '#5a8a9a', wx + 1, h - 31, 8, 8);
        px(c, '#3a2a1e', wx + 5, h - 31, 1, 8);
      }
    }
    if (two) {
      px(c, '#a89a80', 2, 28, w - 4, 2);
      for (let wx = 6; wx + 8 < w - 4; wx += 14) {
        px(c, '#3a2a1e', wx, 17, 8, 8);
        px(c, '#5a8a9a', wx + 1, 18, 6, 6);
      }
    }
    // 招牌（直的木牌）
    const word = CORAL_WORDS[Math.floor(rand() * CORAL_WORDS.length)] ?? '鹹餅';
    if (rand() < 0.7) {
      px(c, '#f4efe2', w - 9, h - 44, 7, word.length * 7 + 3);
      for (const [k, ch] of [...word].entries()) text(c, ch, w - 5.5, h - 40 + k * 7, '#8a2a1a', `900 6px ${SERIF_TC}`);
    }
    // 紅瓦（硬山、兩端翹一點）
    c.fillStyle = '#b5553f';
    c.beginPath();
    c.moveTo(-1, top + 1);
    c.lineTo(4, top - 8);
    c.lineTo(w - 4, top - 8);
    c.lineTo(w + 1, top + 1);
    c.closePath();
    c.fill();
    for (let y = top - 6; y < top; y += 2) px(c, '#9d4634', 2, y, w - 4, 1);
    px(c, '#8a8a8a', 2, top - 10, w - 4, 3);
  });
}
const CORAL_HOUSES: Coral[] = (() => {
  const out: Coral[] = [];
  const rand = seeded(1887);
  for (const [a, b] of [[0.2, PH.temple.x0 - 0.2], [PH.temple.x1 + 0.2, PH.W - 0.2]] as const) {
    let x = a;
    while (x < b - 1.5) {
      const w = Math.min(2.8 + Math.floor(rand() * 3) * 0.6, b - x);
      out.push({ x0: x, x1: x + w, seed: Math.floor(rand() * 10000) });
      x += w;
    }
  }
  return out;
})();

// ── 四眼井：一塊石板上開四個井口，旁邊吊桶 ──
function drawWell(c: CanvasRenderingContext2D): void {
  const cx = Math.round(PH.well.x * T);
  const by = Math.round(PH.well.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 22, by, 44, 3);
  px(c, '#a8a296', cx - 22, by - 14, 44, 14);
  px(c, '#c4beb2', cx - 22, by - 14, 44, 2);
  for (const [dx, dy] of [[-12, -10], [4, -10], [-12, -5], [4, -5]] as const) {
    px(c, '#3a4a52', cx + dx, by + dy, 8, 4);
    px(c, '#5a8a9a', cx + dx + 1, by + dy + 1, 6, 2);
  }
  px(c, '#8a5a32', cx + 16, by - 6, 6, 5);
  px(c, '#5a3a22', cx + 18, by - 9, 2, 3);
}

// ── 西瀛虹橋：白色的大拱、吊索；晚上拱上的燈一段段變成彩虹色 ──
function drawRainbowArch(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = (PH.cove.x0 + 1.2) * T;
  const x1 = (PH.cove.x1 - 1.2) * T;
  const by = PH.bridge.y0 * T + 2;
  const cx = (x0 + x1) / 2;
  const rx = (x1 - x0) / 2;
  const ry = 78;
  // 拱腳的橋墩
  for (const x of [x0, x1]) {
    px(c, '#d6dce2', Math.round(x) - 5, by - 8, 10, 10);
    px(c, '#b8c0c8', Math.round(x) - 5, by - 8, 10, 2);
  }
  // 吊索
  for (let k = 1; k < 16; k += 1) {
    const x = x0 + (k / 16) * (x1 - x0);
    const y = by - Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)) * ry;
    px(c, 'rgba(230,236,240,0.8)', Math.round(x), Math.round(y), 1, Math.round(by - y));
  }
  const rainbow = ['#ff4a4a', '#ff9a3a', '#ffe04a', '#5ad66a', '#4ac0ff', '#5a6aff', '#b06aff'];
  const segs = 28;
  for (let k = 0; k < segs; k += 1) {
    const a0 = Math.PI + (k / segs) * Math.PI;
    const a1 = Math.PI + ((k + 1) / segs) * Math.PI;
    c.strokeStyle = d.night ? rainbow[(k + Math.floor(d.seconds * 4)) % rainbow.length] ?? '#ffffff' : '#f4f6f8';
    c.lineWidth = 6;
    c.beginPath();
    c.ellipse(cx, by, rx, ry, 0, a0, a1);
    c.stroke();
  }
  c.strokeStyle = 'rgba(140,150,160,0.7)';
  c.lineWidth = 1;
  c.beginPath();
  c.ellipse(cx, by, rx + 3, ry + 3, 0, Math.PI, 0);
  c.stroke();
  // 橋面兩邊的白欄杆
  for (const y of [PH.bridge.y0 * T, PH.bridge.y1 * T - 2]) {
    px(c, '#f4f6f8', PH.cove.x0 * T, Math.round(y) - 4, (PH.cove.x1 - PH.cove.x0) * T, 2);
    for (let x = PH.cove.x0 * T; x < PH.cove.x1 * T; x += 8) px(c, '#e2e6ea', x, Math.round(y) - 4, 1, 5);
  }
  if (d.night) glow(c, cx, by - 30, 120, '200, 180, 255', 0.25);
}

// 煙火（晚上，海灣上空一顆一顆炸開）
function drawFireworks(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!d.night) return;
  const colors = ['255, 90, 90', '255, 220, 90', '120, 220, 255', '200, 120, 255', '120, 255, 160'];
  for (let k = 0; k < 3; k += 1) {
    const cycle = 4.2 + k * 1.3;
    const t = ((d.seconds + k * 1.7) % cycle) / cycle;
    const n = Math.floor((d.seconds + k * 1.7) / cycle);
    const x = (PH.cove.x0 + 3 + ((n * 7 + k * 5) % 14)) * T;
    const y = (27.2 + ((n * 3 + k) % 3)) * T - 40;
    const col = colors[(n + k) % colors.length] ?? '255, 220, 90';
    if (t < 0.25) {
      // 往上衝的火花
      const yy = y + 60 * (1 - t / 0.25);
      px(c, `rgba(${col}, 0.9)`, Math.round(x), Math.round(yy), 2, 4);
    } else {
      const k2 = (t - 0.25) / 0.75;
      const rad = 6 + k2 * 30;
      for (let s = 0; s < 14; s += 1) {
        const a = (s / 14) * Math.PI * 2;
        px(c, `rgba(${col}, ${1 - k2})`, Math.round(x + Math.cos(a) * rad), Math.round(y + Math.sin(a) * rad + k2 * 8), 2, 2);
      }
      if (k2 < 0.3) glow(c, x, y, 40, col, 0.4 * (1 - k2 / 0.3));
    }
  }
}

// ── 觀音亭：小小的廟（紅柱、燕尾），前面一片草地 ──
function kuanyinSprite(): HTMLCanvasElement {
  const w = Math.round((PH.kuanyin.x1 - PH.kuanyin.x0) * T);
  const h = 60;
  return cached('ph-kuanyin', w, h, (c) => {
    const cx = w / 2;
    px(c, '#a8a296', 0, h - 6, w, 6);
    px(c, '#efe6d2', 8, h - 36, w - 16, 30);
    for (const x of [10, w - 14, cx - 12, cx + 8]) px(c, '#b71c1c', x, h - 36, 4, 30);
    px(c, '#7a2a1a', cx - 8, h - 28, 16, 22);
    px(c, '#2a1a12', cx - 14, h - 40, 28, 8);
    text(c, '觀音亭', cx, h - 36, '#f6c945', `900 6px ${SERIF_TC}`);
    c.fillStyle = '#c95a3a';
    c.beginPath();
    c.moveTo(0, h - 36);
    c.lineTo(10, 14);
    c.lineTo(w - 10, 14);
    c.lineTo(w, h - 36);
    c.closePath();
    c.fill();
    for (let y = 16; y < h - 36; y += 3) px(c, '#b04a2e', 6, y, w - 12, 1);
    px(c, '#6a6a6a', 8, 10, w - 16, 4);
    c.fillStyle = '#6a6a6a';
    for (const [sx, dir] of [[8, -1], [w - 8, 1]] as const) {
      c.beginPath();
      c.moveTo(sx, 14);
      c.quadraticCurveTo(sx + dir * 5, 12, sx + dir * 8, 3);
      c.lineTo(sx + dir * 5, 4);
      c.quadraticCurveTo(sx + dir * 3, 9, sx, 10);
      c.closePath();
      c.fill();
    }
  });
}

// ── 馬公港渡輪站：白色的候船室、「馬公港」字、旁邊停著往高雄的大渡輪 ──
function terminalSprite(): HTMLCanvasElement {
  const w = Math.round((PH.terminal.x1 - PH.terminal.x0) * T);
  const h = 64;
  return cached('ph-terminal', w, h, (c) => {
    const cx = w / 2;
    px(c, '#f2f4f6', 0, 16, w, h - 16);
    px(c, '#1f5fa8', 0, 12, w, 5);
    px(c, '#3f86d0', 0, 12, w, 1);
    for (let x = 6; x < w - 10; x += 14) {
      px(c, '#5a8aaa', x, 24, 10, 16);
      px(c, 'rgba(255,255,255,0.4)', x + 1, 25, 2, 6);
    }
    px(c, '#2a3a4a', cx - 16, h - 22, 32, 22);
    px(c, '#bfe0f0', cx - 14, h - 20, 28, 20);
    px(c, '#2a3a4a', cx, h - 20, 1, 20);
    px(c, '#ffffff', cx - 34, 0, 68, 12);
    px(c, '#1f5fa8', cx - 34, 11, 68, 1);
    text(c, '馬公港 渡輪站', cx, 6, '#1f3a60', `900 7px ${FONT_TC}`);
  });
}
function drawFerry(c: CanvasRenderingContext2D, d: DrawCtx): void {
  // 停在碼頭西邊
  const w = Math.round(9.4 * T);
  const x0 = Math.round((PH.pier.x0 - 0.2) * T) - w;
  const by = Math.round(37.7 * T + Math.sin(d.seconds * 0.8) * 1);
  px(c, 'rgba(0,0,0,0.25)', x0, by + 1, w, 3);
  px(c, '#1f3a60', x0, by - 12, w, 12);
  px(c, '#f2f4f6', x0 + 4, by - 30, w - 4, 18);
  px(c, '#f2f4f6', x0 + 12, by - 42, w - 20, 12);
  for (let x = x0 + 8; x < x0 + w - 4; x += 8) px(c, d.night ? '#ffe9a8' : '#3a5a7a', x, by - 26, 5, 4);
  px(c, '#e23a2a', x0 + 20, by - 52, 8, 10);
  px(c, '#e23a2a', x0, by - 6, w, 2);
}

// 外海的漁船（慢慢開過去）
function drawBoats(c: CanvasRenderingContext2D, d: DrawCtx): void {
  for (let k = 0; k < 2; k += 1) {
    const x = ((d.seconds * (5 + k * 2) + k * 400) % (50 * T)) - 2 * T;
    const y = (36.4 + k * 1) * T + Math.sin(d.seconds + k) * 2;
    const cx = Math.round(x);
    const cy = Math.round(y);
    px(c, 'rgba(255,255,255,0.5)', cx - 20, cy + 2, 12, 1);
    px(c, '#f2f2f2', cx - 14, cy - 6, 28, 6);
    px(c, '#2a7aa8', cx - 14, cy - 1, 28, 2);
    px(c, '#3a3d45', cx - 4, cy - 14, 10, 8);
    px(c, '#c9dbe6', cx - 2, cy - 12, 6, 3);
    px(c, '#e23a2a', cx + 8, cy - 18, 6, 4);
  }
}

// ── 組成 CityScene 用的資料 ──
const TREES: [number, number][] = [[1.6, 26.6], [12.4, 27.6], [1.6, 31.6]];
// 廣場上的老榕樹（樹下有石椅的那種）
const BANYANS: [number, number][] = [[3.4, 20.4], [16.4, 20.4], [27.4, 20.4]];
function drawBanyan(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 22, by - 2, 44, 4);
  px(c, '#6a4a2a', cx - 4, by - 22, 8, 22);
  for (const dx of [-12, -7, 7, 12]) px(c, '#7a5a3a', cx + dx, by - 26, 1, 22);
  for (const [dx, dy, r, col] of [[-14, -30, 13, '#2f6a34'], [14, -30, 13, '#2f6a34'], [0, -40, 15, '#3d7a3c'], [-6, -28, 10, '#4c8a46'], [9, -38, 9, '#4c8a46']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
}
const LAMPS: [number, number][] = [[3, 21], [14, 21], [30.6, 21], [53, 21], [16.4, 26.6], [24, 26.6], [33.4, 26.6], [36.4, 28], [52, 28]];
const SCOOTERS: [number, number][] = [36, 37.2, 38.4, 39.6, 40.8, 50.4, 51.6, 52.8, 54].map((x): [number, number] => [x, 25.4]);

function drawCasuarina(c: CanvasRenderingContext2D, x: number, y: number): void {
  // 木麻黃（澎湖擋風的樹，細細尖尖的）
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  px(c, '#5c3d22', cx - 1, by - 14, 3, 14);
  for (let k = 0; k < 5; k += 1) {
    c.fillStyle = k % 2 ? '#4f7a4a' : '#3f6a3c';
    c.beginPath();
    c.moveTo(cx - 9 + k, by - 10 - k * 7);
    c.lineTo(cx + 1, by - 22 - k * 7);
    c.lineTo(cx + 11 - k, by - 10 - k * 7);
    c.closePath();
    c.fill();
  }
}

const props: CityProp[] = [
  ...CORAL_HOUSES.map((b): CityProp => ({ y: PH.rowLine, draw: (c) => blit(c, coralSprite(b), b.x0 * T, PH.rowLine * T) })),
  { y: PH.rowLine, draw: (c) => blit(c, templeSprite(), PH.temple.x0 * T, PH.rowLine * T) },
  { y: PH.rowLine + 2.2, draw: (c, d) => drawCenser(c, d) },
  { y: PH.well.y, draw: (c) => drawWell(c) },
  ...MARKET_CARTS.map((s, i): CityProp => ({ y: PH.cartY, draw: (c, d) => drawFoodCart(c, s.x, PH.cartY, s.name, s.awning, s.food, d.seconds + i * 0.37, 59 + i * 7) })),
  { y: PH.cartY + 0.02, draw: (c, d) => drawStringLights(c, PH.market.x0, PH.W - 0.2, PH.cartY - 2.9, d.night, 6) },
  ...MARKET_TABLES.map((x): CityProp => ({ y: TABLE_Y, draw: (c) => drawMarketTable(c, x, TABLE_Y) })),
  ...COVE_BENCHES.map((x): CityProp => ({ y: COVE_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, COVE_BENCH_Y, 2.6) })),
  { y: PH.bridge.y1, draw: (c, d) => drawRainbowArch(c, d) },
  { y: PH.bridge.y1 + 0.01, draw: (c, d) => drawFireworks(c, d) },
  { y: PH.kuanyin.line, draw: (c) => blit(c, kuanyinSprite(), PH.kuanyin.x0 * T, PH.kuanyin.line * T) },
  ...KUANYIN_BENCHES.map((x): CityProp => ({ y: KUANYIN_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, KUANYIN_BENCH_Y, 2.6) })),
  { y: PH.terminal.line, draw: (c) => blit(c, terminalSprite(), PH.terminal.x0 * T, PH.terminal.line * T) },
  { y: PH.openSea, draw: (c, d) => drawSeaWaves(c, 0, PH.W, PH.openSea, PH.H, d.seconds) },
  { y: PH.openSea + 0.5, draw: (c, d) => drawBoats(c, d) },
  { y: 37.6, draw: (c, d) => drawFerry(c, d) },
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawCasuarina(c, x, y) })),
  ...BANYANS.map(([x, y]): CityProp => ({ y, draw: (c) => drawBanyan(c, x, y) })),
  { y: 13.6, draw: (c, d) => drawArch(c, 4.6, 13.4, 13.6, '中央老街', '#8a2a1a', d.night, d.seconds) },
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[i % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 海不能走：海灣只有橋上能過；外海只有碼頭能走
function blocked(x: number, y: number): boolean {
  if (inCove(x, y - 0.1)) return !(y > PH.bridge.y0 + 0.05 && y < PH.bridge.y1 + 0.05);
  if (y > PH.openSea - 0.1) return !(x > PH.pier.x0 + 0.2 && x < PH.pier.x1 - 0.2 && y < PH.H - 0.3);
  return false;
}
const solid: Rect[] = [
  r(0, 0, PH.W, PH.rowLine - 0.2),
  r(TEMPLE_DOOR.x - 3.6, PH.rowLine + 1.7, TEMPLE_DOOR.x - 2.6, PH.rowLine + 2.2),
  r(PH.well.x - 1.4, PH.well.y - 0.9, PH.well.x + 1.4, PH.well.y),
  ...MARKET_CARTS.map((s) => r(s.x - 1.25, PH.cartY - 0.8, s.x + 1.25, PH.cartY - 0.05)),
  ...MARKET_TABLES.map((x) => r(x - 1.2, TABLE_Y - 0.4, x + 1.2, TABLE_Y)),
  ...COVE_BENCHES.map((x) => r(x - 1.3, COVE_BENCH_Y - 0.75, x + 1.3, COVE_BENCH_Y - 0.45)),
  r(PH.kuanyin.x0, PH.kuanyin.line - 2.2, PH.kuanyin.x1, PH.kuanyin.line - 0.05),
  ...KUANYIN_BENCHES.map((x) => r(x - 1.3, KUANYIN_BENCH_Y - 0.75, x + 1.3, KUANYIN_BENCH_Y - 0.45)),
  r(PH.terminal.x0, PH.terminal.line - 2.6, PH.terminal.x1, PH.terminal.line - 0.05),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...BANYANS.map(([x, y]) => r(x - 0.4, y - 0.4, x + 0.4, y + 0.05)),
  ...[4.75, 13.25].map((x) => r(x - 0.15, 13.3, x + 0.15, 13.6)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
  r(35.6, 25, 41.2, 25.6),
  r(50, 25, 54.4, 25.6),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...MARKET_CARTS.map((s) => ({ x: s.x * T, y: PH.cartY * T - 14, r: 40, color: 'rgba(255, 215, 140, 0.55)' })),
  { x: TEMPLE_DOOR.x * T, y: PH.rowLine * T - 30, r: 80, color: 'rgba(255, 190, 110, 0.5)' },
  ...CORAL_HOUSES.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: PH.rowLine * T - 14, r: 24, color: 'rgba(255, 215, 140, 0.35)' })),
  { x: ((PH.cove.x0 + PH.cove.x1) / 2) * T, y: PH.bridge.y0 * T - 30, r: 130, color: 'rgba(210, 190, 255, 0.35)' },
  { x: ((PH.kuanyin.x0 + PH.kuanyin.x1) / 2) * T, y: PH.kuanyin.line * T - 24, r: 46, color: 'rgba(255, 200, 120, 0.45)' },
  { x: ((PH.terminal.x0 + PH.terminal.x1) / 2) * T, y: PH.terminal.line * T - 24, r: 70, color: 'rgba(220, 240, 255, 0.45)' },
];

const terminalX = (PH.terminal.x0 + PH.terminal.x1) / 2;

export const PENGHU: CityDef = {
  id: 'penghu',
  W: PH.W,
  H: PH.H,
  title: { 'zh-TW': '澎湖 · 天后宮與西瀛虹橋', 'en-US': 'Penghu · Mazu Temple & Xiying Rainbow Bridge' },
  stop: { 'zh-TW': '澎湖（左營轉船）', 'en-US': 'Penghu (ferry via Zuoying)' },
  emoji: '⛵',
  station: {
    x: terminalX,
    y: PH.terminal.line + 0.7,
    name: { 'zh-TW': '馬公港渡輪站（往高雄、轉高鐵）', 'en-US': 'Magong Ferry Terminal (to Kaohsiung & THSR)' },
    arrive: { x: terminalX + 3, y: PH.terminal.line + 0.9 },
  },
  background: '#d9d0bf',
  soundscape: 'beach',
  paintGround: paintPenghuGround,
  props,
  solid,
  blocked,
  seats: PENGHU_SEATS,
  drawSeat: (c, i) => {
    const s = PENGHU_SEATS[i];
    if (s && i >= 4 && i < 8) drawStool(c, s.x, s.y);
  },
  shops: PENGHU_SHOPS,
  fortune: {
    at: r(TEMPLE_DOOR.x - 2.2, PH.rowLine, TEMPLE_DOOR.x + 2.2, PH.rowLine + 1.4),
    label: { x: TEMPLE_DOOR.x, y: PH.rowLine - 6.6 },
    title: { 'zh-TW': '澎湖天后宮 · 求籤', 'en-US': 'Penghu Mazu Temple · Fortune' },
    hint: { 'zh-TW': '跟媽祖說說想問的事，再抽一支籤。', 'en-US': 'Tell Mazu your question, then draw a stick.' },
    draw: { 'zh-TW': '求籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再求一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '上上籤', 'en-US': 'Supreme luck' }, text: { 'zh-TW': '媽祖保佑，順風順水，今天的進度一路到底！', 'en-US': 'Mazu watches over you — fair winds, and today’s work sails all the way through!' } },
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great luck' }, text: { 'zh-TW': '像石滬一樣，一塊一塊疊起來，魚自然會游進來。', 'en-US': 'Like a stone fish weir — stack it stone by stone and the fish will come.' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Fair luck' }, text: { 'zh-TW': '澎湖的風很大，站穩腳步就不怕。', 'en-US': 'Penghu’s winds are strong — keep your footing and you’ll be fine.' } },
      { rank: { 'zh-TW': '上籤', 'en-US': 'Good luck' }, text: { 'zh-TW': '累了吃一塊黑糖糕，再拚一顆番茄鐘。', 'en-US': 'Tired? Have some brown sugar cake, then one more pomodoro.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small luck' }, text: { 'zh-TW': '退潮的時候別急，等漲潮再出海。', 'en-US': 'Don’t rush at low tide — set sail when the tide comes in.' } },
    ],
  },
  infos: [
    { at: r(PH.temple.x0, 4, PH.temple.x1, PH.rowLine - 0.2), title: { 'zh-TW': '澎湖天后宮', 'en-US': 'Penghu Tianhou Temple' }, text: { 'zh-TW': '台灣最古老的媽祖廟，四百多年前就有了，是國定古蹟。現在的廟是 1920 年代請潮州師傅重修的，木雕和屋脊都很精緻。', 'en-US': 'Taiwan’s oldest Mazu temple, over 400 years old and a national monument. The current building was restored by Chaozhou craftsmen in the 1920s — note the fine woodcarving and roof ridges.' } },
    { at: r(0, 4, PH.temple.x0, PH.rowLine - 0.2), title: { 'zh-TW': '中央老街', 'en-US': 'Central Old Street' }, text: { 'zh-TW': '馬公最老的街，很多房子是用咾咕石（珊瑚礁石）砌的牆。街上的四眼井是一口井開四個井口，讓很多人可以同時打水。', 'en-US': 'Magong’s oldest street, with many walls built of coral stone. Its Four-Eyed Well has four openings so several people could draw water at once.' } },
    { at: r(PH.market.x0, PH.plaza.y0, PH.W, PH.plaza.y1), title: { 'zh-TW': '澎湖小吃', 'en-US': 'Penghu Snacks' }, text: { 'zh-TW': '黑糖糕、鹹餅是澎湖的伴手禮；仙人掌冰用野生仙人掌的果實做，紫紅色的；花枝丸、小管麵線是澎湖的海味。', 'en-US': 'Brown sugar cake and salty biscuits are the classic souvenirs; cactus ice is made from wild cactus fruit and is bright magenta; cuttlefish balls and squid noodles are the taste of the sea.' } },
    { at: r(PH.cove.x0, PH.bridge.y0 - 3.5, PH.cove.x1, PH.bridge.y1), title: { 'zh-TW': '西瀛虹橋', 'en-US': 'Xiying Rainbow Bridge' }, text: { 'zh-TW': '觀音亭旁邊的拱橋，晚上會打上彩虹色的燈。每年夏天的澎湖國際海上花火節就在這一帶放煙火。', 'en-US': 'An arched footbridge beside Guanyin Pavilion, lit in rainbow colours at night. The Penghu International Fireworks Festival lights up the bay here every summer.' } },
    { at: r(PH.kuanyin.x0, PH.kuanyin.line - 3.8, PH.kuanyin.x1, PH.kuanyin.line), title: { 'zh-TW': '觀音亭', 'en-US': 'Guanyin Pavilion' }, text: { 'zh-TW': '馬公的老廟，前面是海濱公園，傍晚很多人來看夕陽。', 'en-US': 'An old temple in Magong fronted by a seaside park — a favourite spot for watching the sunset.' } },
    { at: r(0, PH.openSea, 12, PH.H), title: { 'zh-TW': '石滬', 'en-US': 'Stone Fish Weir' }, text: { 'zh-TW': '用玄武岩和珊瑚石在淺海疊的石牆，漲潮時魚游進來、退潮就被困住。最有名的是七美的雙心石滬。', 'en-US': 'Stone walls of basalt and coral built in the shallows — fish swim in at high tide and are trapped as it ebbs. The most famous is the Twin-Hearts Weir on Qimei.' } },
    { at: r(PH.terminal.x0, PH.terminal.line - 4, PH.terminal.x1, PH.terminal.line), title: { 'zh-TW': '馬公港', 'en-US': 'Magong Harbour' }, text: { 'zh-TW': '澎湖的大門，有渡輪往高雄、嘉義布袋。也可以搭飛機，從台北大約一個小時。', 'en-US': 'Penghu’s gateway, with ferries to Kaohsiung and Budai in Chiayi. You can also fly — about an hour from Taipei.' } },
  ],
  labels: [
    { x: 8, y: PH.rowLine - 4.8, text: { 'zh-TW': '🏘️ 中央老街', 'en-US': '🏘️ Central Old Street' }, color: '#fde68a' },
    { x: PH.well.x, y: PH.well.y - 2.4, text: { 'zh-TW': '四眼井', 'en-US': 'Four-Eyed Well' }, color: '#e5e7eb' },
    { x: 24, y: PH.road.y1 + 0.5, text: { 'zh-TW': '🌈 西瀛虹橋（長椅坐下專注）', 'en-US': '🌈 Rainbow Bridge (sit on a bench)' }, color: '#c4b5fd' },
  ],
  walkers: [
    { x0: 1, y0: 12, x1: 55, y1: 12, count: 4 },
    { x0: 2, y0: 19, x1: 31, y1: 19, count: 2 },
    { x0: 32, y0: 17.6, x1: 55, y1: 17.6, count: 3 },
    { x0: 1, y0: 24.4, x1: 55, y1: 24.4, count: 3 },
    { x0: 1, y0: 30.4, x1: 40, y1: 30.4, count: 3 },
    { x0: 35, y0: 33.6, x1: 50, y1: 33.6, count: 2 },
  ],
  traffic: [
    { y: 21.9, dir: 1, x0: 0, x1: PH.W, count: 2 },
    { y: 22.9, dir: -1, x0: 0, x1: PH.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點海灣步道、觀音亭前的長椅或小吃攤的桌子坐下專注 · 走到攤車買黑糖糕、仙人掌冰 · 天后宮門口求籤 · 走西瀛虹橋過海灣 · 點地標看介紹 · 馬公港坐船回台北',
    'en-US': 'WASD / arrows to move · click a bench by the cove or at Guanyin Pavilion, or a snack table, to focus · walk up to the carts for brown sugar cake and cactus ice · draw a fortune at the temple · cross the cove on the Rainbow Bridge · click landmarks for info · Magong Harbour back to Taipei',
  },
  hintTouch: {
    'zh-TW': '點長椅或桌子坐下專注 · 走到攤車買東西 · 天后宮求籤 · 走虹橋過海灣 · 點地標看介紹 · 馬公港回台北',
    'en-US': 'Tap a bench or table to focus · walk up to the carts · fortune at the temple · cross the Rainbow Bridge · tap landmarks · harbour back to Taipei',
  },
};
