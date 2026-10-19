// 士林夜市的美術：北邊街屋（滿滿的霓虹招牌；豪大大雞排、辛發亭）、一排攤位（彩色燈箱招牌、日光燈管、各攤的食物）、
// 慈諴宮（綠琉璃瓦、金色剪黏、黃燈籠）、廟埕的撈金魚和射氣球、士林市場的紅磚立面、折疊桌、
// 劍潭站（白色船形屋頂，紅線列車會進站）、基河路、基隆河和對岸的圓山大飯店。
import { SL, STALL_GAP_X, stallCenter, stallLeft, type ShilinStall } from './shilin';
import { layerCanvas, layerSize, px, seeded, spriteRes } from './pixelUtil';

const T = 16;
const FONT_TC = '"PingFang TC", "Noto Sans TC", sans-serif';

function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, font: string, align: CanvasTextAlign = 'center'): void {
  c.fillStyle = color;
  c.font = font;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(s, x, y);
}

function glow(c: CanvasRenderingContext2D, x: number, y: number, r: number, rgb: string, a: number): void {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, ${a})`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  c.fillStyle = g;
  c.fillRect(x - r, y - r, r * 2, r * 2);
}

// ── 地面（畫一次）──
export function paintShilinGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1913);
  const W = SL.W * T;
  const H = SL.H * T;
  px(c, '#22232b', 0, 0, W, H);
  for (let i = 0; i < 2400; i += 1) px(c, rand() < 0.5 ? '#292a33' : '#1c1d24', Math.floor(rand() * W), Math.floor(rand() * H), 1, 1);
  // 騎樓：灰色磁磚
  const arcadeTop = SL.shopLine * T - 12;
  const arcadeBottom = SL.stallTop * T;
  const arcadeRight = (SL.temple.x0 - 1.4) * T;
  px(c, '#5f5a58', 0, arcadeTop, arcadeRight, arcadeBottom - arcadeTop);
  for (let y = arcadeTop; y < arcadeBottom; y += 8) px(c, '#555050', 0, y, arcadeRight, 1);
  for (let x = 0; x < arcadeRight; x += 8) px(c, '#555050', x, arcadeTop, 1, arcadeBottom - arcadeTop);
  px(c, '#7a7270', 0, arcadeBottom - 2, arcadeRight, 2);
  // 夜市的走道：灰色地磚，攤位燈照得暖暖的
  const streetTop = arcadeBottom;
  const streetBottom = SL.roadY * T - 6;
  const streetRight = SL.plaza.x0 * T;
  px(c, '#4b4746', 0, streetTop, streetRight, streetBottom - streetTop);
  for (let y = streetTop; y < streetBottom; y += 10) for (let x = (y / 10) % 2 === 0 ? 0 : 10; x < streetRight; x += 20) px(c, '#433f3e', x, y, 19, 9);
  for (let i = 0; i < 320; i += 1) px(c, rand() < 0.6 ? 'rgba(255, 210, 130, 0.1)' : 'rgba(255, 110, 140, 0.07)', Math.floor(rand() * streetRight), streetTop + Math.floor(rand() * (streetBottom - streetTop)), 3 + Math.floor(rand() * 6), 1);
  // 攤位底下、排水溝蓋
  px(c, '#332e2d', stallLeft(0) * T - 4, SL.stallTop * T, (STALL_GAP_X[0] - stallLeft(0)) * T + 8, (SL.counterY - SL.stallTop) * T + 4);
  px(c, '#332e2d', STALL_GAP_X[1] * T - 4, SL.stallTop * T, (stallLeft(11) + SL.stallW - STALL_GAP_X[1]) * T + 8, (SL.counterY - SL.stallTop) * T + 4);
  for (let x = 0; x < streetRight; x += 18) px(c, '#2a2626', x, streetBottom - 4, 14, 2);
  // 折疊桌那一區：淺一點的地磚，看得出是吃東西的地方
  const dineX0 = (SL.tables[0] - 2) * T;
  const dineX1 = (SL.tables[2] + 2) * T;
  const dineY0 = (SL.tableY - 0.6) * T;
  px(c, '#565150', dineX0, dineY0, dineX1 - dineX0, 3.6 * T);
  for (let y = dineY0; y < dineY0 + 3.6 * T; y += 12) px(c, '#4d4847', dineX0, y, dineX1 - dineX0, 1);
  for (let x = dineX0; x < dineX1; x += 12) px(c, '#4d4847', x, dineY0, 1, 3.6 * T);
  px(c, '#6a6463', dineX0, dineY0, dineX1 - dineX0, 1);
  // 廟後面的紅磚牆、廟埕石板
  const t = SL.temple;
  px(c, '#2e2a33', (t.x0 - 1.4) * T, 0, (SL.W - t.x0 + 1.4) * T, t.y0 * T + 10);
  px(c, '#7a3a2c', (t.x0 - 1.4) * T, 0, 1.4 * T, (t.y1 - 0.4) * T);
  for (let y = 0; y < (t.y1 - 0.4) * T; y += 5) for (let x = (y / 5) % 2 === 0 ? 0 : 5; x < 1.4 * T; x += 10) px(c, '#6a3024', (t.x0 - 1.4) * T + x, y, 9, 4);
  const p = SL.plaza;
  px(c, '#6c6864', p.x0 * T, (t.y1 - 0.5) * T, (p.x1 - p.x0) * T, (p.y1 - t.y1 + 0.5) * T - 6);
  for (let x = p.x0 * T; x < p.x1 * T; x += 12) px(c, '#605c58', x, (t.y1 - 0.5) * T, 1, (p.y1 - t.y1 + 0.5) * T - 6);
  for (let y = (t.y1 - 0.5) * T; y < p.y1 * T - 6; y += 12) px(c, '#605c58', p.x0 * T, y, (p.x1 - p.x0) * T, 1);
  // 基河路：白色分隔線、兩條斑馬線（往夜市入口、往劍潭站）
  const ry = SL.roadY * T;
  px(c, '#2b2c34', 0, ry - 6, W, 3 * T);
  px(c, '#9a9ca6', 0, ry - 6, W, 2);
  px(c, '#9a9ca6', 0, ry + 3 * T - 8, W, 2);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8ee', x, ry + T - 1, 12, 2);
  for (const cx of [(SL.gateSign.x0 + SL.gateSign.x1) / 2, (SL.station.x0 + SL.station.x1) / 2]) {
    for (let k = -3; k <= 3; k += 1) px(c, 'rgba(235,235,240,0.75)', cx * T + k * 7 - 2, ry - 2, 4, 3 * T - 10);
  }
  // 人行道（劍潭站前、河邊）
  const sy = ry + 3 * T - 6;
  px(c, '#77746f', 0, sy, W, H - sy);
  for (let y = sy; y < H; y += 12) for (let x = (y / 12) % 2 === 0 ? 0 : 12; x < W; x += 24) px(c, '#6c6964', x, y, 23, 11);
  // 劍潭站前的小廣場
  const st = SL.station;
  px(c, '#5a5d68', (st.x0 - 0.6) * T, (st.y1 - 0.2) * T, (st.x1 - st.x0 + 1.2) * T, 1.6 * T);
  for (let x = (st.x0 - 0.6) * T; x < (st.x1 + 0.6) * T; x += 8) px(c, '#636672', x, (st.y1 - 0.2) * T, 1, 1.6 * T);
  // 基隆河：欄杆、河水（亮點每格另外畫）、對岸的山和圓山大飯店
  const rx = SL.riverX * T;
  const rvy = SL.riverY * T;
  px(c, '#0d1a2e', rx, rvy, W - rx, H - rvy);
  for (let y = rvy; y < H; y += 4) px(c, y % 8 === 0 ? '#10203a' : '#0b1728', rx, y, W - rx, 2);
  px(c, '#8d91a0', rx, rvy - 3, W - rx, 3);
  px(c, '#8d91a0', rx - 3, rvy - 3, 3, H - rvy + 3);
  for (let x = rx + 2; x < W; x += 10) px(c, '#b9bdc8', x, rvy - 10, 1, 7);
  px(c, '#b9bdc8', rx, rvy - 10, W - rx, 1);
  paintGrandHotel(c);
}

// 對岸的圓山大飯店：綠色山坡上紅柱金瓦的宮殿式大樓，窗戶亮著燈（直接畫在底圖）
function paintGrandHotel(c: CanvasRenderingContext2D): void {
  const H = SL.H * T;
  const x0 = 33 * T;
  const x1 = SL.W * T;
  c.fillStyle = '#122a1b';
  c.beginPath();
  c.moveTo(x0, H);
  c.quadraticCurveTo(x0 + 60, H - 46, (x0 + x1) / 2, H - 40);
  c.quadraticCurveTo(x1 - 50, H - 38, x1, H - 30);
  c.lineTo(x1, H);
  c.closePath();
  c.fill();
  const rand = seeded(1952);
  for (let i = 0; i < 40; i += 1) px(c, rand() < 0.5 ? '#1a3a25' : '#0e2215', Math.round(x0 + 20 + rand() * (x1 - x0 - 30)), Math.round(H - 30 + rand() * 26), 6, 4);
  // 大樓本體
  const bx = 38 * T;
  const bw = 11 * T;
  const base = H - 14;
  const floors = 7;
  const bodyTop = base - floors * 6;
  glow(c, bx + bw / 2, bodyTop, 110, '255, 120, 60', 0.18);
  px(c, '#8a2a20', bx, bodyTop, bw, base - bodyTop);
  for (let f = 0; f < floors; f += 1) {
    const fy = bodyTop + f * 6 + 2;
    for (let k = bx + 4; k < bx + bw - 4; k += 5) px(c, (k + f) % 3 === 0 ? '#ffe39a' : '#ffcf6a', k, fy, 3, 3);
  }
  for (let k = bx + 2; k < bx + bw; k += 12) px(c, '#c62828', k, bodyTop, 2, base - bodyTop);
  // 屋頂：三層金黃色琉璃瓦，兩端翹起
  const roof = (y: number, w: number, h: number) => {
    const cx = bx + bw / 2;
    c.fillStyle = '#d9a51e';
    c.beginPath();
    c.moveTo(cx - w / 2 - 6, y);
    c.lineTo(cx - w / 2 + 6, y - h);
    c.lineTo(cx + w / 2 - 6, y - h);
    c.lineTo(cx + w / 2 + 6, y);
    c.closePath();
    c.fill();
    px(c, '#ffe066', cx - w / 2 + 6, y - h, w - 12, 1);
    px(c, '#f2c14e', cx - w / 2 - 7, y - 2, 3, 3);
    px(c, '#f2c14e', cx + w / 2 + 4, y - 2, 3, 3);
  };
  roof(bodyTop, bw, 8);
  px(c, '#8a2a20', bx + bw / 2 - 30, bodyTop - 16, 60, 8);
  roof(bodyTop - 14, 64, 7);
  px(c, '#8a2a20', bx + bw / 2 - 12, bodyTop - 26, 24, 6);
  roof(bodyTop - 24, 30, 6);
  // 河面上的倒影
  for (let k = 0; k < 6; k += 1) px(c, 'rgba(255, 190, 90, 0.25)', bx + 10 + k * 28, base + 4 + (k % 2) * 3, 14, 1);
}

// ── 北邊街屋（每棟一張小圖，正面朝南）──

export interface Shophouse {
  x0: number;
  x1: number;
  floors: number;
  seed: number;
  special?: 'haodada' | 'xinfating';
}

export const SHOPHOUSES: Shophouse[] = (() => {
  const out: Shophouse[] = [];
  const rand = seeded(311);
  const end = SL.temple.x0 - 1.4;
  const specials: ['haodada' | 'xinfating', { x0: number; x1: number }][] = [
    ['haodada', SL.shopDoors[0]],
    ['xinfating', SL.shopDoors[1]],
  ];
  let x = 0;
  while (x < end - 0.01) {
    const hit = specials.find(([, d]) => Math.abs(x - d.x0) < 0.01);
    if (hit) {
      out.push({ x0: x, x1: hit[1].x1, floors: 4, seed: hit[0] === 'haodada' ? 801 : 802, special: hit[0] });
      x = hit[1].x1;
      continue;
    }
    const next = specials.map(([, d]) => d.x0).find((d) => d > x + 0.01);
    let w = 2.5 + Math.floor(rand() * 4) * 0.5;
    if (next !== undefined && x + w > next - 1.5) w = next - x;
    w = Math.min(w, end - x);
    out.push({ x0: x, x1: x + w, floors: 3 + Math.floor(rand() * 3), seed: Math.floor(rand() * 10000) });
    x += w;
  }
  return out;
})();

const WALLS = ['#6c6670', '#7a6a5c', '#5f6670', '#776a62', '#6a6272', '#5e5a55'];
const NEON = ['#ff3d6e', '#ffd23f', '#3ad1ff', '#4cff8a', '#ff8a3b', '#c77dff', '#ffffff'];
const WORDS = ['藥局', '眼鏡', '服飾', '鞋', '手機', '冰', '茶', '飾品', '遊藝場', '牛排', '包包', '卡拉OK', '按摩'];
const spriteCache = new Map<number, HTMLCanvasElement>();

function shophouseSprite(b: Shophouse): HTMLCanvasElement {
  const hit = spriteCache.get(b.seed);
  if (hit) return hit;
  const rand = seeded(b.seed);
  const w = Math.round((b.x1 - b.x0) * T);
  const floorH = 12;
  const ground = 18;
  const h = ground + b.floors * floorH + 10;
  const pad = 10;
  const cw = w + pad * 2;
  const ch = h + 10;
  const { canvas, c } = layerCanvas(cw, ch, spriteRes());
  if (!c) return canvas;
  const ox = pad;
  const top = ch - h;
  const wall = b.special === 'haodada' ? '#6e2a20' : b.special === 'xinfating' ? '#4a5a6e' : WALLS[Math.floor(rand() * WALLS.length)] ?? '#6c6670';
  // 女兒牆、水塔、鐵皮加蓋
  px(c, '#34303a', ox, top, w, 6);
  px(c, '#45404c', ox, top, w, 1);
  if (!b.special && rand() < 0.6) px(c, rand() < 0.5 ? '#3b7dd8' : '#a8b0bd', ox + 4 + Math.floor(rand() * Math.max(1, w - 16)), top - 7, 10, 7);
  if (!b.special && rand() < 0.4) px(c, '#5a7a8a', ox + 2, top - 4, Math.min(24, w - 4), 4);
  px(c, wall, ox, top + 6, w, h - 6);
  for (let y = top + 6; y < top + h - ground; y += 3) px(c, 'rgba(0,0,0,0.06)', ox, y, w, 1);
  const upperBottom = top + h - ground;
  for (let f = 0; f < b.floors; f += 1) {
    const fy = top + 8 + f * floorH;
    px(c, 'rgba(0,0,0,0.2)', ox, fy + floorH - 2, w, 1);
    for (let cx = ox + 3; cx + 9 <= ox + w - 2; cx += 12) {
      const lit = rand() < 0.55;
      px(c, '#24232c', cx - 1, fy + 1, 11, 8);
      px(c, lit ? (rand() < 0.5 ? '#ffd98a' : '#cfe8ff') : '#2e2d38', cx, fy + 2, 9, 6);
      for (let k = 0; k < 9; k += 2) px(c, 'rgba(20,20,26,0.7)', cx + k, fy + 2, 1, 6);
      // 冷氣機
      if (rand() < 0.35) px(c, '#c9ccd6', cx + 10, fy + 3, 4, 3);
    }
  }
  if (b.special === 'haodada') {
    // 豪大大雞排：黃底紅字的大招牌，上面一隻雞的商標
    px(c, '#b71c1c', ox + 2, top + 8, w - 4, 26);
    px(c, '#ffd23f', ox + 4, top + 10, w - 8, 22);
    px(c, '#ffffff', ox + 4, top + 10, w - 8, 1);
    text(c, '豪大大雞排', ox + w / 2 + 9, top + 21.5, '#c62828', `900 12px ${FONT_TC}`);
    // 雞的商標：白色圓臉、紅雞冠
    px(c, '#ffffff', ox + 10, top + 14, 12, 12);
    px(c, '#e53935', ox + 13, top + 11, 6, 4);
    px(c, '#15171f', ox + 13, top + 18, 2, 2);
    px(c, '#ff9a3b', ox + 18, top + 19, 4, 3);
    text(c, 'HOT-STAR', ox + w / 2, top + 40, 'rgba(255,230,120,0.85)', '900 7px system-ui, sans-serif');
  } else if (b.special === 'xinfating') {
    px(c, '#e8ecf3', ox + 4, top + 10, w - 8, 18);
    px(c, '#1f6fb5', ox + 4, top + 10, w - 8, 2);
    px(c, '#1f6fb5', ox + 4, top + 26, w - 8, 2);
    text(c, '辛發亭', ox + w / 2, top + 19.5, '#1f4f8f', `900 12px ${FONT_TC}`);
    px(c, '#15171f', ox + w / 2 - 16, top + 31, 32, 10);
    text(c, '雪片冰', ox + w / 2, top + 36, '#bfe6ff', `700 8px ${FONT_TC}`);
  } else {
    // 一般街屋：直式霓虹招牌，有些還多一塊橫的
    const word = WORDS[Math.floor(rand() * WORDS.length)] ?? '冰';
    const neon = NEON[Math.floor(rand() * NEON.length)] ?? '#ff3d6e';
    const sx = rand() < 0.5 ? ox + 2 : ox + w - 12;
    const sh = 10 + Math.min(4, word.length) * 9;
    c.save();
    c.shadowColor = neon;
    c.shadowBlur = 8;
    px(c, '#121218', sx - 1, top + 9, 12, sh + 2);
    c.strokeStyle = neon;
    c.lineWidth = 1;
    c.strokeRect(sx + 0.5, top + 10.5, 9, sh - 1);
    [...word].slice(0, 4).forEach((ch, i) => text(c, ch, sx + 5, top + 17 + i * 9, neon, `700 8px ${FONT_TC}`));
    c.restore();
    if (rand() < 0.5 && w > 44) {
      const hn = NEON[Math.floor(rand() * NEON.length)] ?? '#ffd23f';
      const hw = Math.min(w - 26, 40);
      const hx = sx < ox + w / 2 ? ox + 16 : ox + 4;
      px(c, hn, hx, top + 8 + floorH * 2, hw, 9);
      px(c, 'rgba(255,255,255,0.4)', hx, top + 8 + floorH * 2, hw, 1);
      text(c, WORDS[Math.floor(rand() * WORDS.length)] ?? '茶', hx + hw / 2, top + 13 + floorH * 2, '#15171f', `900 7px ${FONT_TC}`);
    }
  }
  // 一樓店面
  px(c, '#121117', ox, upperBottom, w, ground);
  const shopLight = b.special === 'haodada' ? '#ffd27a' : b.special === 'xinfating' ? '#dff2ff' : ['#ffd27a', '#ff9a8a', '#9fe0ff', '#ffe9b8', '#d9b8ff'][Math.floor(rand() * 5)] ?? '#ffd27a';
  px(c, shopLight, ox + 4, upperBottom + 4, w - 8, ground - 6);
  if (b.special === 'haodada') {
    // 炸鍋＋一片片比臉大的雞排
    px(c, '#9aa3b2', ox + 8, upperBottom + 9, w - 16, 7);
    px(c, '#d6dae2', ox + 8, upperBottom + 9, w - 16, 1);
    for (let k = ox + 12; k < ox + w - 14; k += 12) {
      px(c, '#b8742e', k, upperBottom + 5, 10, 5);
      px(c, '#d99a4e', k + 1, upperBottom + 5, 8, 2);
    }
  } else if (b.special === 'xinfating') {
    for (let k = ox + 8; k < ox + w - 8; k += 8) {
      px(c, '#ffffff', k, upperBottom + 9, 6, 5);
      px(c, k % 16 === 0 ? '#f6c27a' : '#ffe066', k, upperBottom + 7, 6, 3);
    }
  } else {
    // 掛滿衣服、包包的店面
    for (let k = ox + 7; k < ox + w - 7; k += 5) px(c, ['#e25a4a', '#3b82f6', '#f2f2f2', '#2bb673', '#f6c945'][Math.floor(rand() * 5)] ?? '#e25a4a', k, upperBottom + 6, 3, 5 + Math.floor(rand() * 4));
  }
  for (let k = ox; k < ox + w; k += 15) px(c, wall, k, upperBottom, 3, ground);
  px(c, 'rgba(0,0,0,0.3)', ox, upperBottom, w, 2);
  px(c, 'rgba(255,255,255,0.08)', ox, top + 6, 1, h - 6);
  px(c, 'rgba(0,0,0,0.3)', ox + w - 2, top + 6, 2, h - 6);
  spriteCache.set(b.seed, canvas);
  return canvas;
}

export function drawShophouse(c: CanvasRenderingContext2D, b: Shophouse): void {
  const s = shophouseSprite(b);
  const size = layerSize(s);
  c.drawImage(s, Math.round(b.x0 * T) - 10, Math.round(SL.shopLine * T) - size.h, size.w, size.h);
}

// ── 攤位：日光燈管照亮的不鏽鋼攤車，老闆在後面，上面是彩色燈箱招牌 ──
function food(c: CanvasRenderingContext2D, kind: ShilinStall['food'], x: number, y: number, seconds: number): void {
  const steam = (sx: number, sy: number) => {
    for (let k = 0; k < 3; k += 1) {
      const t = (seconds * 0.6 + k / 3) % 1;
      px(c, `rgba(255,255,255,${0.35 * (1 - t)})`, Math.round(sx + Math.sin(seconds * 2 + k) * 2), Math.round(sy - t * 14), 3, 2);
    }
  };
  const smoke = (sx: number, sy: number) => {
    for (let k = 0; k < 2; k += 1) {
      const t = (seconds * 0.5 + k / 2) % 1;
      px(c, `rgba(200,200,210,${0.3 * (1 - t)})`, Math.round(sx + k * 8 + Math.sin(seconds + k) * 3), Math.round(sy - t * 16), 4, 3);
    }
  };
  const flick = Math.floor(seconds * 6) % 2;
  switch (kind) {
    case 'sausage':
      px(c, '#2b2d33', x + 3, y - 4, 26, 4);
      px(c, flick ? '#ff6a2b' : '#ffa531', x + 4, y - 3, 24, 1);
      for (let k = 0; k < 5; k += 1) {
        px(c, '#9a3b2f', x + 5 + k * 5, y - 7, 4, 3);
        px(c, '#c0574a', x + 5 + k * 5, y - 7, 4, 1);
      }
      smoke(x + 10, y - 9);
      px(c, '#f4eee2', x + 32, y - 3, 3, 3);
      break;
    case 'pancake':
      // 一大疊潤餅皮＋擀好的酥餅
      px(c, '#f4eee2', x + 3, y - 4, 12, 4);
      px(c, '#e3dccb', x + 3, y - 2, 12, 1);
      for (let k = 0; k < 3; k += 1) {
        px(c, '#d9a35a', x + 18 + k * 7, y - 5, 6, 5);
        px(c, '#f2c27a', x + 18 + k * 7, y - 5, 6, 1);
      }
      break;
    case 'bun':
      // 大平底鍋煎一圈生煎包，撒蔥花芝麻
      px(c, '#2b2d33', x + 3, y - 6, 30, 6);
      px(c, '#55596a', x + 3, y - 6, 30, 1);
      for (let k = 0; k < 5; k += 1) {
        px(c, '#f4eee2', x + 5 + k * 5, y - 8, 4, 4);
        px(c, '#7ac46a', x + 6 + k * 5, y - 8, 1, 1);
      }
      steam(x + 16, y - 10);
      break;
    case 'frog':
      // 一桶粉圓（黑黑的「蛙蛋」）＋杯子
      px(c, '#c9ccd6', x + 3, y - 10, 12, 10);
      px(c, '#2a2a2a', x + 4, y - 8, 10, 6);
      for (let k = 0; k < 6; k += 1) px(c, '#555', x + 5 + (k % 3) * 3, y - 7 + Math.floor(k / 3) * 2, 1, 1);
      for (let k = 0; k < 3; k += 1) {
        px(c, '#e8f6d8', x + 19 + k * 6, y - 8, 4, 8);
        px(c, '#2a2a2a', x + 19 + k * 6, y - 3, 4, 3);
        px(c, '#2bb673', x + 20 + k * 6, y - 10, 1, 3);
      }
      break;
    case 'taroIce':
      // 冰桶＋一球球紫色芋頭冰
      px(c, '#9aa3b2', x + 3, y - 9, 14, 9);
      px(c, '#b48ad9', x + 4, y - 10, 12, 3);
      for (let k = 0; k < 3; k += 1) {
        px(c, '#f2e2b8', x + 21 + k * 6, y - 5, 4, 5);
        px(c, '#b48ad9', x + 21 + k * 6, y - 8, 4, 3);
      }
      break;
    case 'oyster':
      px(c, '#2b2d33', x + 3, y - 4, 30, 4);
      for (let k = 0; k < 3; k += 1) {
        px(c, '#f2e2b8', x + 5 + k * 9, y - 6, 8, 3);
        px(c, '#e25a4a', x + 7 + k * 9, y - 6, 3, 1);
        px(c, '#7ac46a', x + 6 + k * 9, y - 5, 2, 1);
      }
      steam(x + 16, y - 8);
      break;
    case 'tofu':
      px(c, '#3a3d48', x + 3, y - 6, 16, 6);
      px(c, '#c98a2c', x + 4, y - 5, 14, 3);
      for (let k = 0; k < 4; k += 1) px(c, '#e8b860', x + 5 + k * 3, y - 6 + (k % 2), 2, 2);
      steam(x + 10, y - 8);
      px(c, '#7ac46a', x + 22, y - 4, 10, 3);
      px(c, '#e25a4a', x + 24, y - 3, 4, 1);
      break;
    case 'fried':
      // 一格格生的料（自己夾）＋油鍋
      for (let k = 0; k < 4; k += 1) {
        px(c, '#d6dae2', x + 3 + k * 6, y - 5, 5, 5);
        px(c, ['#f2c27a', '#7ac46a', '#e25a4a', '#c98a3c'][k] ?? '#f2c27a', x + 4 + k * 6, y - 4, 3, 3);
      }
      px(c, '#3a3d48', x + 28, y - 7, 8, 7);
      px(c, '#c98a2c', x + 29, y - 6, 6, 3);
      steam(x + 31, y - 9);
      break;
    case 'tea':
      for (let k = 0; k < 5; k += 1) {
        px(c, '#e9dcc4', x + 3 + k * 6, y - 8, 4, 8);
        px(c, '#3b2a20', x + 3 + k * 6, y - 3, 4, 3);
        px(c, '#e25a4a', x + 5 + k * 6, y - 10, 1, 3);
      }
      break;
    case 'icecream':
      px(c, '#c98a3c', x + 3, y - 6, 12, 6);
      px(c, '#e3ad5e', x + 4, y - 5, 10, 2);
      px(c, '#c3cad6', x + 15, y - 8, 2, 6);
      ['#f4eee2', '#f59ab3', '#ffe39a'].forEach((col, i) => px(c, col, x + 20 + i * 5, y - 5, 4, 3));
      px(c, '#57a862', x + 34, y - 6, 3, 2);
      break;
    case 'taroBall':
      px(c, '#55596a', x + 3, y - 8, 18, 8);
      px(c, '#c9a06b', x + 4, y - 7, 16, 3);
      ['#8a5ec4', '#f2a541', '#f6c945', '#8a5ec4', '#f2a541', '#f6c945'].forEach((col, i) => px(c, col, x + 5 + i * 2, y - 7 + (i % 2), 2, 2));
      steam(x + 11, y - 10);
      for (let k = 0; k < 2; k += 1) px(c, '#f4eee2', x + 25 + k * 6, y - 4, 5, 4);
      break;
    case 'squid':
      px(c, '#2b2d33', x + 3, y - 4, 30, 4);
      px(c, flick ? '#ff6a2b' : '#ffa531', x + 4, y - 3, 28, 1);
      for (let k = 0; k < 3; k += 1) {
        const sx = x + 6 + k * 9;
        px(c, '#d97a3a', sx, y - 10, 5, 7);
        px(c, '#f2a56a', sx + 1, y - 10, 3, 2);
        px(c, '#b8542e', sx, y - 3, 1, 2);
        px(c, '#b8542e', sx + 2, y - 3, 1, 2);
        px(c, '#b8542e', sx + 4, y - 3, 1, 2);
      }
      smoke(x + 12, y - 12);
      break;
  }
}

export function drawStall(c: CanvasRenderingContext2D, i: number, stall: ShilinStall, seconds: number, owner: HTMLCanvasElement | null): void {
  const cx = stallCenter(i) * T;
  const w = SL.stallW * T - 4;
  const x = Math.round(cx - w / 2);
  const counterY = Math.round(SL.counterY * T);
  const backY = Math.round(SL.stallTop * T) + 6;
  // 架子、帆布棚（每攤顏色不同）
  px(c, '#2b2e3a', x + 2, backY - 22, 2, counterY - backY + 22);
  px(c, '#2b2e3a', x + w - 4, backY - 22, 2, counterY - backY + 22);
  px(c, stall.sign[0] === '#ffffff' ? '#c9ccd6' : stall.sign[0], x - 1, backY - 24, w + 2, 4);
  px(c, 'rgba(255,255,255,0.3)', x - 1, backY - 24, w + 2, 1);
  // 日光燈管
  px(c, '#f4fbff', x + 6, backY - 19, w - 12, 2);
  glow(c, cx, backY - 14, w * 0.6, '230, 245, 255', 0.25);
  if (owner) c.drawImage(owner, Math.round(cx - owner.width / 2), counterY - 6 - owner.height);
  // 不鏽鋼台面、前板上貼著價目表
  px(c, '#8d93a3', x, counterY - 6, w, 6);
  px(c, '#d6dae2', x, counterY - 6, w, 2);
  px(c, '#b9bec9', x, counterY, w, 10);
  px(c, '#e3e6ec', x + 2, counterY + 1, w - 4, 1);
  px(c, '#fff8e1', x + w - 14, counterY + 3, 10, 6);
  for (let k = 0; k < 3; k += 1) px(c, '#c62828', x + w - 12, counterY + 4 + k * 2, 6, 1);
  px(c, 'rgba(0,0,0,0.25)', x, counterY + 10, w, 3);
  food(c, stall.food, x, counterY - 6, seconds);
  // 燈箱招牌
  const sy = backY - 46;
  const [bg, fg] = stall.sign;
  px(c, '#3b3f4c', x + 4, sy + 16, 2, 8);
  px(c, '#3b3f4c', x + w - 6, sy + 16, 2, 8);
  glow(c, cx, sy + 8, w * 0.75, '255, 240, 200', 0.22);
  px(c, '#15171f', x - 1, sy - 1, w + 2, 18);
  px(c, bg, x, sy, w, 16);
  px(c, 'rgba(255,255,255,0.35)', x, sy, w, 2);
  const name = stall.name['zh-TW'];
  const size = Math.max(5, Math.min(8, Math.floor((w - 4) / name.length)));
  text(c, name, cx, sy + 8.5, fg, `900 ${size}px ${FONT_TC}`);
}

// ── 慈諴宮：石台基、紅牆、龍柱、綠琉璃瓦＋金色剪黏、屋簷下一排黃燈籠 ──
export function drawTemple(c: CanvasRenderingContext2D, seconds: number): void {
  const t = SL.temple;
  const x = t.x0 * T;
  const w = (t.x1 - t.x0) * T;
  const y1 = t.y1 * T;
  const cx = x + w / 2;
  px(c, 'rgba(0,0,0,0.35)', x + 4, y1 - 2, w, 6);
  px(c, '#9a948a', x, y1 - 10, w, 10);
  for (let s = 0; s < 3; s += 1) px(c, s % 2 ? '#b5ad9f' : '#c9c0ae', cx - 32 + s * 3, y1 - 10 + s * 3, 64 - s * 6, 3);
  const bodyTop = y1 - 62;
  px(c, '#9c2f22', x + 8, bodyTop, w - 16, 52);
  px(c, '#b53e2e', x + 8, bodyTop, w - 16, 2);
  // 龍柱（石雕，盤著一條龍）
  for (const colX of [x + 14, cx - 22, cx + 18, x + w - 18]) {
    px(c, '#a8a49c', colX, bodyTop + 6, 5, 46);
    for (let k = 0; k < 6; k += 1) px(c, '#6e8a7a', colX + (k % 2 ? 0 : 3), bodyTop + 8 + k * 7, 2, 4);
    px(c, '#c9a24a', colX - 1, bodyTop + 4, 7, 2);
  }
  // 三個門，中門畫門神
  const door = (dx: number, dw: number, dh: number, gods: boolean) => {
    px(c, '#4a1a12', dx - 1, y1 - 10 - dh - 1, dw + 2, dh + 1);
    px(c, '#7a2a1c', dx, y1 - 10 - dh, dw, dh);
    for (const side of [0, 1]) {
      const gx = dx + 2 + side * (dw / 2);
      if (gods) {
        px(c, '#2f5fa8', gx, y1 - 10 - dh + 4, dw / 2 - 4, dh - 8);
        px(c, '#f2c27a', gx + 2, y1 - 10 - dh + 6, dw / 2 - 8, 4);
        px(c, '#2bb673', gx + 1, y1 - 10 - dh + 11, dw / 2 - 6, 6);
      }
      px(c, '#c9a24a', gx, y1 - 10 - dh + 4, dw / 2 - 4, 1);
    }
    for (let k = 0; k < 4; k += 1) for (let j = 0; j < 3; j += 1) px(c, '#e8c060', dx + 3 + j * (dw / 3), y1 - 10 - dh + 8 + k * 6, 1, 1);
  };
  door(cx - 14, 28, 34, true);
  door(x + 22, 18, 24, false);
  door(x + w - 40, 18, 24, false);
  px(c, '#15100c', cx - 22, bodyTop + 2, 44, 12);
  px(c, '#c9a24a', cx - 22, bodyTop + 2, 44, 1);
  px(c, '#c9a24a', cx - 22, bodyTop + 13, 44, 1);
  text(c, '慈諴宮', cx, bodyTop + 8.5, '#f2d27a', `900 9px ${FONT_TC}`);
  // 屋頂：綠琉璃瓦、燕尾脊
  const roofY = bodyTop;
  c.fillStyle = '#2f7a5a';
  c.beginPath();
  c.moveTo(x - 6, roofY + 2);
  c.lineTo(x + 16, roofY - 18);
  c.lineTo(x + w - 16, roofY - 18);
  c.lineTo(x + w + 6, roofY + 2);
  c.closePath();
  c.fill();
  for (let k = 0; k < 18; k += 3) px(c, '#25634a', x + 6 + k * 0.8, roofY - 16 + k, w - 12 - k * 1.6, 1);
  c.strokeStyle = '#f2c14e';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x + 8, roofY - 32);
  c.quadraticCurveTo(x + 18, roofY - 18, x + 30, roofY - 20);
  c.lineTo(x + w - 30, roofY - 20);
  c.quadraticCurveTo(x + w - 18, roofY - 18, x + w - 8, roofY - 32);
  c.stroke();
  // 剪黏：脊上的雙龍、中間的寶塔
  for (let k = 0; k < 12; k += 1) {
    const dx = x + 32 + k * ((w - 64) / 11);
    px(c, k % 2 ? '#3ad1a0' : '#f2c14e', dx, roofY - 25 - Math.round(Math.sin(k * 0.8) * 2), 3, 3);
  }
  px(c, '#f2c14e', cx - 3, roofY - 32, 6, 10);
  px(c, '#ff5a3a', cx - 1, roofY - 35, 2, 3);
  glow(c, cx, roofY - 28, 12, '255, 200, 80', 0.4 + Math.sin(seconds * 2) * 0.1);
  // 屋簷下一排黃燈籠
  for (let k = 0; k < 8; k += 1) {
    const lx = Math.round(x + 12 + k * ((w - 24) / 7));
    // 中間留給匾額
    if (Math.abs(lx - cx) < 30) continue;
    const sway = Math.round(Math.sin(seconds * 1.4 + k) * 0.6);
    px(c, '#3a1a12', lx, roofY + 2, 1, 3);
    px(c, '#f6c945', lx - 3 + sway, roofY + 5, 7, 8);
    px(c, '#fff3b0', lx - 2 + sway, roofY + 6, 2, 6);
    px(c, '#c62828', lx - 3 + sway, roofY + 5, 7, 1);
    px(c, '#c62828', lx - 3 + sway, roofY + 12, 7, 1);
    glow(c, lx + sway, roofY + 9, 9, '255, 210, 90', 0.28);
  }
  glow(c, cx, y1 - 20, 64, '255, 190, 110', 0.15);
}

// 廟前的香爐
export function drawBurner(c: CanvasRenderingContext2D, seconds: number): void {
  const x = Math.round(SL.burner.x * T);
  const y = Math.round(SL.burner.y * T);
  px(c, 'rgba(0,0,0,0.3)', x - 10, y + 1, 21, 3);
  px(c, '#6b4a2a', x - 8, y - 4, 3, 5);
  px(c, '#6b4a2a', x + 6, y - 4, 3, 5);
  px(c, '#8a6a3a', x - 10, y - 14, 21, 11);
  px(c, '#c9a24a', x - 10, y - 14, 21, 2);
  px(c, '#5a3a1a', x - 7, y - 16, 15, 2);
  for (let k = 0; k < 5; k += 1) px(c, '#e25a4a', x - 4 + k * 2, y - 20, 1, 5);
  for (let k = 0; k < 6; k += 1) {
    const t = (seconds * 0.35 + k / 6) % 1;
    px(c, `rgba(220,220,230,${0.45 * (1 - t)})`, Math.round(x - 2 + Math.sin(seconds * 1.5 + k * 2) * (2 + t * 6)), Math.round(y - 22 - t * 34), 3 + Math.round(t * 3), 2);
  }
  glow(c, x, y - 18, 10, '255, 150, 80', 0.3);
}

// 撈金魚：藍色塑膠池，金魚游來游去；fishing 時中間有浮標（bite 時往下沉、冒漣漪）
export function drawFishPool(c: CanvasRenderingContext2D, seconds: number, bobber: 'none' | 'waiting' | 'bite'): void {
  const p = SL.pool;
  const x = p.x0 * T;
  const y = p.y0 * T;
  const w = (p.x1 - p.x0) * T;
  const h = (p.y1 - p.y0) * T;
  px(c, 'rgba(0,0,0,0.25)', x + 2, y + h - 1, w, 4);
  px(c, '#1f6fb5', x, y, w, h);
  px(c, '#3a8ad9', x, y, w, 2);
  px(c, '#4fc3d9', x + 3, y + 3, w - 6, h - 7);
  for (let i = 0; i < 9; i += 1) {
    const fx = x + 6 + ((i * 17 + seconds * (8 + i)) % (w - 14));
    const fy = y + 6 + ((i * 7) % (h - 14));
    px(c, i % 3 === 0 ? '#ffffff' : i % 4 === 0 ? '#15171f' : '#f2a541', Math.round(fx), fy, 4, 2);
    px(c, i % 3 === 0 ? '#e3e8f0' : '#e8572a', Math.round(fx) - 1, fy, 1, 2);
  }
  // 池邊的小板凳、紙網、塑膠袋
  for (const k of [0.25, 0.75]) {
    px(c, '#1f8f5a', Math.round(x + w * k) - 4, y + h + 3, 8, 3);
  }
  px(c, '#f4eee2', x + w - 10, y - 5, 7, 5);
  px(c, '#9fd8ff', x + 4, y - 6, 5, 6);
  if (bobber === 'none') return;
  const bite = bobber === 'bite';
  const bx = Math.round(x + w / 2);
  const by = Math.round(y + h / 2 + (bite ? 2 + Math.round(Math.sin(seconds * 30)) : Math.round(Math.sin(seconds * 3) * 0.6)));
  const ring = bite ? 5 + Math.floor((seconds * 12) % 4) : 4;
  px(c, 'rgba(255,255,255,0.6)', bx - ring, by + 3, ring * 2, 1);
  px(c, '#e8572a', bx - 2, by - 3, 4, 3);
  px(c, '#ffffff', bx - 2, by, 4, 2);
  px(c, '#3a3d45', bx, by - 7, 1, 4);
}

// 射氣球攤：後面一整面氣球牆（每隔一陣子破一顆再補上）、檯面上的飛鏢、掛著的娃娃
export function drawBalloonBooth(c: CanvasRenderingContext2D, seconds: number, owner: HTMLCanvasElement | null): void {
  const b = SL.balloon;
  const x = b.x0 * T;
  const w = (b.x1 - b.x0) * T;
  const top = b.top * T;
  const counterY = b.counterY * T;
  px(c, '#2b2e3a', x + 1, top - 20, 2, counterY - top + 20);
  px(c, '#2b2e3a', x + w - 3, top - 20, 2, counterY - top + 20);
  px(c, '#3a2f4a', x + 3, top - 16, w - 6, counterY - top + 10);
  const colors = ['#e25a4a', '#fbbf24', '#2fb3a6', '#e86a8a', '#5b6ee1', '#4fa35a', '#f2a541', '#a78bfa'];
  const popped = Math.floor(seconds / 1.7) % 40;
  for (let r = 0; r < 4; r += 1) {
    for (let k = 0; k < 9; k += 1) {
      if (r * 9 + k === popped) continue;
      const bx = x + 7 + k * 8;
      const by = top - 13 + r * 7;
      px(c, colors[(r * 3 + k) % colors.length] ?? '#e25a4a', bx, by, 5, 5);
      px(c, 'rgba(255,255,255,0.5)', bx + 1, by + 1, 1, 1);
    }
  }
  // 掛在兩側的娃娃
  for (const [dx, col] of [
    [4, '#c98a5a'],
    [w - 10, '#f2f2f2'],
  ] as const) {
    px(c, col, x + dx, top + 8, 6, 6);
    px(c, col, x + dx + 1, top + 5, 4, 4);
    px(c, '#15171f', x + dx + 2, top + 6, 1, 1);
  }
  if (owner) c.drawImage(owner, Math.round(x + w / 2 - owner.width / 2 + 18), counterY - 6 - owner.height);
  px(c, '#c62828', x, counterY - 6, w, 6);
  px(c, '#ff6a5a', x, counterY - 6, w, 1);
  px(c, '#f2f2f2', x, counterY, w, 9);
  for (let k = x; k < x + w; k += 8) px(c, '#c62828', k, counterY, 4, 9);
  px(c, 'rgba(0,0,0,0.25)', x, counterY + 9, w, 3);
  for (let k = 0; k < 4; k += 1) {
    px(c, '#c9ccd6', x + 8 + k * 6, counterY - 8, 4, 1);
    px(c, colors[k] ?? '#e25a4a', x + 7 + k * 6, counterY - 8, 1, 1);
  }
  // 招牌
  const sy = top - 34;
  px(c, '#15171f', x + 7, sy - 1, w - 14, 14);
  px(c, '#ff3d6e', x + 8, sy, w - 16, 12);
  text(c, '射氣球', x + w / 2, sy + 6.5, '#ffffff', `900 8px ${FONT_TC}`);
  glow(c, x + w / 2, sy + 6, w * 0.6, '255, 80, 130', 0.25);
}

// ── 士林市場：紅磚、白色線腳、拱形窗，中間山牆上「士林市場」，拱門通往地下美食區 ──
export function drawMarket(c: CanvasRenderingContext2D, seconds: number): void {
  const m = SL.market;
  const x = m.x0 * T;
  const w = (m.x1 - m.x0) * T;
  const y1 = m.y1 * T;
  const cx = x + w / 2;
  const top = y1 - 62;
  px(c, 'rgba(0,0,0,0.35)', x + 4, y1 - 2, w, 6);
  // 屋頂（後面的鐵皮屋頂）
  px(c, '#3a3f48', x + 4, m.y0 * T - 6, w - 8, top - m.y0 * T + 10);
  for (let k = x + 6; k < x + w - 6; k += 8) px(c, '#343840', k, m.y0 * T - 6, 1, top - m.y0 * T + 10);
  // 紅磚立面
  px(c, '#9a4a36', x, top, w, y1 - top);
  for (let y = top + 2; y < y1; y += 4) for (let k = (y / 4) % 2 === 0 ? 0 : 4; k < w; k += 8) px(c, '#8a3f2e', x + k, y, 7, 3);
  px(c, '#efe6d6', x, top, w, 3);
  px(c, '#efe6d6', x, top + 26, w, 2);
  // 中間的山牆（半圓頂）
  c.fillStyle = '#9a4a36';
  c.beginPath();
  c.moveTo(cx - 28, top + 1);
  c.lineTo(cx - 28, top - 4);
  c.arc(cx, top - 4, 28, Math.PI, 0);
  c.lineTo(cx + 28, top + 1);
  c.closePath();
  c.fill();
  c.strokeStyle = '#efe6d6';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(cx, top - 4, 28, Math.PI, 0);
  c.stroke();
  px(c, '#2f4a3a', cx - 22, top - 14, 44, 12);
  px(c, '#efe6d6', cx - 22, top - 14, 44, 1);
  text(c, '士林市場', cx, top - 7.5, '#f6e2b8', `900 10px ${FONT_TC}`);
  text(c, '1910', cx, top - 21, '#efe6d6', '700 6px system-ui, sans-serif');
  // 拱形窗（亮著燈）
  for (let k = 0; k < 7; k += 1) {
    if (k === 3) continue;
    const wx = x + 10 + k * ((w - 20) / 6) - 6;
    px(c, '#efe6d6', wx - 1, top + 6, 14, 17);
    px(c, '#ffd98a', wx + 1, top + 10, 10, 12);
    px(c, '#ffd98a', wx + 3, top + 8, 6, 2);
    px(c, 'rgba(120,70,30,0.5)', wx + 6, top + 8, 1, 14);
    px(c, '#ffd98a', wx + 1, top + 33, 10, 14);
    px(c, 'rgba(120,70,30,0.5)', wx + 1, top + 39, 10, 1);
  }
  // 拱門（入口）
  px(c, '#efe6d6', cx - 13, top + 30, 26, y1 - top - 30);
  px(c, '#2a1a12', cx - 10, top + 34, 20, y1 - top - 34);
  px(c, '#ffcf7a', cx - 8, top + 38, 16, y1 - top - 40);
  for (let k = 0; k < 4; k += 1) px(c, 'rgba(90,60,30,0.35)', cx - 8, top + 42 + k * 4, 16, 1);
  glow(c, cx, y1 - 10, 40, '255, 200, 120', 0.25 + Math.sin(seconds * 1.5) * 0.03);
  text(c, '美食區 B1 ↓', cx, top + 36.5, '#3b2a20', `900 5px ${FONT_TC}`);
}

// 吃東西的折疊桌（不鏽鋼桌腳、白色桌面，桌上擺著吃到一半的小吃）
export function drawFoldingTable(c: CanvasRenderingContext2D, cx: number, seed: number): void {
  const rand = seeded(seed);
  const x = Math.round((cx - 0.75) * T);
  const y = Math.round(SL.tableY * T);
  const w = Math.round(1.5 * T);
  const h = Math.round(2.2 * T);
  px(c, 'rgba(0,0,0,0.22)', x + 2, y + h - 2, w, 4);
  px(c, '#9aa3b2', x, y, w, h);
  px(c, '#f4eee2', x + 1, y + 1, w - 2, h - 4);
  px(c, '#ffffff', x + 1, y + 1, w - 2, 2);
  px(c, '#6b7280', x + 2, y + h - 3, 2, 3);
  px(c, '#6b7280', x + w - 4, y + h - 3, 2, 3);
  const plates = ['#c98a3c', '#e25a4a', '#8a5ec4', '#3b2a20', '#f2c27a'];
  for (let k = 0; k < 3; k += 1) {
    const py = y + 5 + k * 9;
    px(c, '#ffffff', x + 4, py, 7, 5);
    px(c, plates[Math.floor(rand() * plates.length)] ?? '#c98a3c', x + 5, py + 1, 5, 3);
    if (rand() < 0.6) {
      px(c, '#e9dcc4', x + 15, py - 1, 4, 6);
      px(c, '#3b2a20', x + 15, py + 3, 4, 2);
    }
  }
  px(c, '#f2f2f2', x + 13, y + h - 10, 6, 4);
}

// 紅色塑膠椅（側面）
export function drawPlasticStool(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.3)', cx - 5, by + 2, 11, 2);
  px(c, '#c62828', cx - 5, by - 4, 10, 3);
  px(c, '#e53935', cx - 5, by - 4, 10, 1);
  px(c, '#a32020', cx - 4, by - 1, 2, 4);
  px(c, '#a32020', cx + 2, by - 1, 2, 4);
}

// ── 劍潭站：白色船形屋頂、玻璃月台（紅線列車進站停一下再開走）、紅色站名 ──
const TRAIN_CYCLE_S = 26;
export function drawStation(c: CanvasRenderingContext2D, seconds: number): void {
  const s = SL.station;
  const x = s.x0 * T;
  const w = (s.x1 - s.x0) * T;
  const y0 = s.y0 * T;
  const y1 = s.y1 * T;
  px(c, 'rgba(0,0,0,0.35)', x + 4, y1 - 2, w, 6);
  // 高架月台的玻璃帶（裡面看得到列車）
  const bandTop = y0 - 22;
  const bandH = 22;
  px(c, '#1b2433', x, bandTop, w, bandH);
  c.save();
  c.beginPath();
  c.rect(x, bandTop, w, bandH);
  c.clip();
  // 列車：從左邊進站減速、停 5 秒、再往右開走
  const t = seconds % TRAIN_CYCLE_S;
  const trainW = w * 0.8;
  const stopX = x + (w - trainW) / 2;
  let tx: number | null = null;
  if (t < 4) tx = stopX - (1 - t / 4) ** 2 * (trainW + w);
  else if (t < 9) tx = stopX;
  else if (t < 13) tx = stopX + ((t - 9) / 4) ** 2 * (trainW + w);
  if (tx !== null) {
    const ty = bandTop + 5;
    px(c, '#e8ecf3', tx, ty, trainW, 14);
    px(c, '#e3002c', tx, ty + 9, trainW, 2);
    for (let k = tx + 6; k < tx + trainW - 6; k += 9) px(c, '#9fd8ff', k, ty + 3, 6, 5);
    for (let k = 1; k < 3; k += 1) px(c, '#9aa3b2', tx + (trainW * k) / 3, ty, 1, 14);
  }
  c.restore();
  for (let k = x; k < x + w; k += 22) px(c, 'rgba(255,255,255,0.18)', k, bandTop, 1, bandH);
  px(c, 'rgba(160,210,255,0.12)', x, bandTop, w, 5);
  // 白色船形屋頂（弧線＋一根根的肋）
  c.fillStyle = '#f4f6fa';
  c.beginPath();
  c.moveTo(x - 10, bandTop + 2);
  c.quadraticCurveTo(x + w / 2, bandTop - 26, x + w + 10, bandTop + 2);
  c.lineTo(x + w + 6, bandTop + 4);
  c.quadraticCurveTo(x + w / 2, bandTop - 18, x - 6, bandTop + 4);
  c.closePath();
  c.fill();
  c.strokeStyle = '#c9d2e0';
  c.lineWidth = 1;
  for (let k = 1; k < 14; k += 1) {
    const rx = x - 8 + ((w + 16) * k) / 14;
    const tt = (rx - (x - 10)) / (w + 20);
    const ry = bandTop + 2 - 4 * tt * (1 - tt) * 14;
    c.beginPath();
    c.moveTo(rx, ry);
    c.lineTo(rx, bandTop + 3);
    c.stroke();
  }
  // 站體
  px(c, '#e3e8f0', x, y0, w, y1 - y0);
  px(c, '#e3002c', x, y0, w, 3);
  for (let k = x + 6; k < x + w - 6; k += 14) px(c, '#c3cad6', k, y0 + 3, 2, y1 - y0 - 3);
  // 出入口（中間）
  const dx = x + w / 2 - 26;
  px(c, '#2a2f40', dx, y0 + 10, 52, y1 - y0 - 10);
  for (let k = y0 + 12; k < y1; k += 3) px(c, '#4a5068', dx, k, 52, 1);
  glow(c, x + w / 2, y1 - 8, 40, '255, 255, 255', 0.18);
  // 站名＋捷運標誌
  px(c, '#e3002c', x + w / 2 - 34, y0 - 1 + 4, 68, 10);
  text(c, '劍潭站 Jiantan', x + w / 2, y0 + 9.5, '#ffffff', `700 7px ${FONT_TC}`);
  px(c, '#ffffff', x + 6, y0 + 8, 12, 12);
  px(c, '#e3002c', x + 7, y0 + 9, 10, 10);
  text(c, 'R15', x + 12, y0 + 14.5, '#ffffff', '900 5px system-ui, sans-serif');
}

// 夜市入口的「士林觀光夜市」大招牌
export function drawGateSign(c: CanvasRenderingContext2D, seconds: number): void {
  const g = SL.gateSign;
  const x0 = Math.round(g.x0 * T);
  const x1 = Math.round(g.x1 * T);
  const by = Math.round(g.y * T);
  px(c, 'rgba(0,0,0,0.3)', x0, by - 1, x1 - x0, 3);
  px(c, '#3b3f4c', x0 + 2, by - 32, 3, 32);
  px(c, '#3b3f4c', x1 - 5, by - 32, 3, 32);
  px(c, '#15171f', x0 - 3, by - 50, x1 - x0 + 6, 20);
  px(c, '#ffd23f', x0 - 1, by - 48, x1 - x0 + 2, 16);
  // 跑馬燈（一圈小燈泡輪流亮）
  for (let k = 0; k < (x1 - x0 + 6) / 4; k += 1) {
    const on = (k + Math.floor(seconds * 6)) % 3 === 0;
    px(c, on ? '#ffffff' : '#ff8a3b', x0 - 3 + k * 4, by - 50, 2, 1);
    px(c, on ? '#ffffff' : '#ff8a3b', x0 - 3 + k * 4, by - 31, 2, 1);
  }
  text(c, '士林觀光夜市', (x0 + x1) / 2, by - 40, '#c62828', `900 8px ${FONT_TC}`);
  glow(c, (x0 + x1) / 2, by - 40, 36, '255, 210, 80', 0.25);
}

// 路邊停一整排的機車
export const PARKED_SCOOTERS = Array.from({ length: 11 }, (_, i) => ({ x: 38.4 + i * 1.2, color: ['#e25a4a', '#f2f2f2', '#3b82f6', '#15171f', '#8bd3c7', '#f6c945'][(i * 5) % 6] ?? '#f2f2f2' }));
export const SCOOTER_ROW_Y = 23.4;
export function drawParkedScooter(c: CanvasRenderingContext2D, x: number, color: string): void {
  const cx = Math.round(x * T);
  const by = Math.round(SCOOTER_ROW_Y * T);
  px(c, 'rgba(0,0,0,0.3)', cx - 4, by - 1, 9, 2);
  px(c, '#15171f', cx - 2, by - 3, 4, 3);
  px(c, '#15171f', cx - 2, by - 20, 4, 3);
  px(c, color, cx - 4, by - 17, 8, 14);
  px(c, 'rgba(255,255,255,0.35)', cx - 4, by - 17, 1, 14);
  px(c, '#2b2d33', cx - 3, by - 13, 6, 6);
  px(c, '#c9ccd6', cx - 5, by - 19, 10, 1);
}

// 人行道的路燈
export function drawStreetLamp(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  glow(c, cx, by - 24, 22, '255, 214, 140', 0.22);
  px(c, 'rgba(0,0,0,0.3)', cx - 3, by - 1, 7, 2);
  px(c, '#3d424c', cx, by - 26, 2, 26);
  px(c, '#545a66', cx, by - 26, 1, 26);
  px(c, '#2f333b', cx - 3, by - 30, 8, 4);
  px(c, '#fff1a8', cx - 2, by - 27, 6, 1);
}

// 行道樹
export function drawTree(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 8, by - 1, 16, 3);
  px(c, '#5c3d22', cx - 2, by - 12, 4, 12);
  px(c, '#1f4a2c', cx - 11, by - 30, 22, 20);
  px(c, '#2a5e38', cx - 9, by - 32, 18, 18);
  px(c, '#3d7a4c', cx - 5, by - 30, 7, 5);
}

// 河面的波光
export function drawRiverShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  const x0 = SL.riverX * T;
  const y0 = SL.riverY * T;
  const w = SL.W * T - x0;
  const h = SL.H * T - y0 - 20;
  for (let i = 0; i < 40; i += 1) {
    const fx = (i * 97.3 + seconds * (5 + (i % 4))) % w;
    const fy = (i * 37.1) % Math.max(1, h);
    const a = 0.12 + 0.12 * Math.sin(seconds * 1.5 + i);
    px(c, i % 3 === 0 ? `rgba(255, 190, 120, ${a})` : `rgba(140, 190, 255, ${a})`, Math.round(x0 + fx), Math.round(y0 + 3 + fy), 6 + (i % 4) * 2, 1);
  }
}
