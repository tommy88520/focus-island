// 基隆廟口夜市的美術：老街屋（騎樓、鐵窗、直式招牌；李鵠餅店、連珍糕餅）、仁三路中間的不鏽鋼攤車和一整排黃色燈籠招牌、
// 東邊的奠濟宮（燕尾脊、剪黏、門神、紅燈籠、香爐的煙）、南邊的基隆港和 KEELUNG 山，還有雨都的雨。
import { MK, stallCenter, type MiaokouStall } from './miaokou';
import { px, seeded } from './pixelUtil';

const T = 16;

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
export function paintMiaokouGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(2024);
  const W = MK.W * T;
  // 整片先是濕濕的柏油路（基隆常下雨，路面有燈的倒影）
  px(c, '#23242c', 0, 0, W, MK.H * T);
  for (let i = 0; i < 2600; i += 1) px(c, rand() < 0.5 ? '#2a2b34' : '#1d1e25', Math.floor(rand() * W), Math.floor(rand() * MK.H * T), 1, 1);
  // 北邊騎樓的地磚（街屋底下）
  const arcadeY = MK.shopLine * T;
  px(c, '#6b5e55', 0, arcadeY - 14, MK.temple.x0 * T - 18, 14);
  for (let x = 0; x < MK.temple.x0 * T - 18; x += 8) px(c, '#5e524a', x, arcadeY - 14, 1, 14);
  px(c, '#8a7d72', 0, arcadeY, MK.temple.x0 * T - 18, 2);
  // 仁三路：攤位兩邊的走道，紅磚＋濕亮的反光
  const streetY0 = arcadeY + 2;
  const streetY1 = MK.roadY * T - 6;
  px(c, '#5b3a35', 0, streetY0, MK.plaza.x0 * T, streetY1 - streetY0);
  for (let y = streetY0; y < streetY1; y += 6) for (let x = (y / 6) % 2 === 0 ? 0 : 6; x < MK.plaza.x0 * T; x += 12) px(c, '#4f322e', x, y, 11, 5);
  for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? 'rgba(255, 210, 120, 0.12)' : 'rgba(255, 120, 90, 0.08)', Math.floor(rand() * MK.plaza.x0 * T), streetY0 + Math.floor(rand() * (streetY1 - streetY0)), 3 + Math.floor(rand() * 6), 1);
  // 攤位底下（地上有排水溝蓋）
  px(c, '#3a2f2d', MK.stallX0 * T - 6, MK.stallTop * T, MK.stallW * 12 * T + 12, (MK.counterY - MK.stallTop) * T + 4);
  for (let x = MK.stallX0 * T; x < (MK.stallX0 + MK.stallW * 12) * T; x += 16) px(c, '#2c2422', x, MK.counterY * T + 2, 12, 2);
  // 廟後面一片廟宇屋頂（橘紅瓦）、廟和街屋中間的紅磚牆
  const t = MK.temple;
  px(c, '#4a2a22', (t.x0 - 1.4) * T, 0, (MK.W - t.x0 + 1.4) * T, t.y0 * T + 8);
  for (let y = 2; y < t.y0 * T + 8; y += 5) px(c, '#5c3428', (t.x0 - 1.4) * T, y, (MK.W - t.x0 + 1.4) * T, 2);
  px(c, '#7a3a2c', (t.x0 - 1.4) * T, 0, 1.4 * T, (t.y1 - 0.6) * T);
  for (let y = 0; y < (t.y1 - 0.6) * T; y += 5) for (let x = (y / 5) % 2 === 0 ? 0 : 5; x < 1.4 * T; x += 10) px(c, '#6a3024', (t.x0 - 1.4) * T + x, y, 9, 4);
  // 廟埕：灰色石板＋紅磚邊
  const p = MK.plaza;
  px(c, '#6e6a66', p.x0 * T, (MK.temple.y1 - 0.6) * T, (p.x1 - p.x0) * T, (p.y1 - MK.temple.y1 + 0.6) * T);
  for (let x = p.x0 * T; x < p.x1 * T; x += 12) px(c, '#625e5a', x, (MK.temple.y1 - 0.6) * T, 1, (p.y1 - MK.temple.y1 + 0.6) * T);
  for (let y = (MK.temple.y1 - 0.6) * T; y < p.y1 * T; y += 12) px(c, '#625e5a', p.x0 * T, y, (p.x1 - p.x0) * T, 1);
  px(c, '#8b3a2e', p.x0 * T, p.y1 * T - 4, (p.x1 - p.x0) * T, 4);
  // 愛三路：雙黃線、斑馬線
  const ry = MK.roadY * T;
  px(c, '#2a2b33', 0, ry - 6, W, 3 * T);
  px(c, '#c9a43a', 0, ry + T - 1, W, 1);
  px(c, '#c9a43a', 0, ry + T + 2, W, 1);
  for (let k = 0; k < 6; k += 1) px(c, 'rgba(235,235,240,0.7)', 30 * T + k * 7, ry - 4, 4, 3 * T - 4);
  // 港邊步道：木棧道＋欄杆
  const py = MK.promenadeY * T;
  px(c, '#6b5444', 0, py, MK.hill.x0 * T, (MK.waterY - MK.promenadeY) * T);
  for (let x = 0; x < MK.hill.x0 * T; x += 6) px(c, '#5c4738', x, py, 1, (MK.waterY - MK.promenadeY) * T);
  // 海：基隆港（亮點另外每格動態畫）
  const wy = MK.waterY * T;
  px(c, '#0b1d33', 0, wy, W, MK.H * T - wy);
  for (let y = wy; y < MK.H * T; y += 4) px(c, y % 8 === 0 ? '#0e2440' : '#0a1a2e', 0, y, W, 2);
  px(c, '#8d91a0', 0, wy - 3, MK.hill.x0 * T, 3);
  for (let x = 2; x < MK.hill.x0 * T; x += 10) px(c, '#b9bdc8', x, wy - 9, 1, 6);
  px(c, '#b9bdc8', 0, wy - 9, MK.hill.x0 * T, 1);
  // KEELUNG 山：深綠色的山丘，上面一排白色大字（晚上打燈）
  const h = MK.hill;
  c.fillStyle = '#16301f';
  c.beginPath();
  c.moveTo(h.x0 * T, h.y1 * T);
  c.quadraticCurveTo(h.x0 * T + 40, h.y0 * T - 10, (h.x0 + h.x1) * 0.5 * T, h.y0 * T + 6);
  c.quadraticCurveTo(h.x1 * T - 40, h.y0 * T + 14, h.x1 * T, h.y0 * T + 30);
  c.lineTo(h.x1 * T, h.y1 * T);
  c.closePath();
  c.fill();
  for (let i = 0; i < 80; i += 1) {
    const tx = h.x0 * T + 20 + rand() * ((h.x1 - h.x0) * T - 30);
    const ty = h.y0 * T + 26 + rand() * ((h.y1 - h.y0) * T - 34);
    px(c, rand() < 0.5 ? '#1f4029' : '#122718', Math.round(tx), Math.round(ty), 6, 4);
  }
  c.save();
  c.shadowColor = '#ffffff';
  c.shadowBlur = 6;
  text(c, 'KEELUNG', (h.x0 + h.x1) * 0.5 * T, (h.y0 + 2.8) * T, '#ffffff', '900 16px system-ui, sans-serif');
  c.restore();
  // 車站前的小廣場
  const st = MK.station;
  px(c, '#4a4d5a', (st.x0 - 0.6) * T, (st.y0 - 0.4) * T, (st.x1 - st.x0 + 1.2) * T, (st.y1 - st.y0 + 1.2) * T);
  for (let x = (st.x0 - 0.6) * T; x < (st.x1 + 0.6) * T; x += 8) px(c, '#535664', x, (st.y0 - 0.4) * T, 1, (st.y1 - st.y0 + 1.2) * T);
}

// ── 北邊老街屋（每棟一張小圖，正面朝南）──

export interface Shophouse {
  x0: number;
  x1: number;
  floors: number;
  seed: number;
  special?: 'lihu' | 'lianzhen';
}

export const SHOPHOUSES: Shophouse[] = (() => {
  const out: Shophouse[] = [];
  const rand = seeded(77);
  let x = 0;
  while (x < MK.temple.x0 - 1.4) {
    if (Math.abs(x - MK.shopDoors[0].x0) < 0.01) {
      out.push({ x0: x, x1: MK.shopDoors[0].x1, floors: 3, seed: 901, special: 'lihu' });
      x = MK.shopDoors[0].x1;
      continue;
    }
    if (Math.abs(x - MK.shopDoors[1].x0) < 0.01) {
      out.push({ x0: x, x1: MK.shopDoors[1].x1, floors: 3, seed: 902, special: 'lianzhen' });
      x = MK.shopDoors[1].x1;
      continue;
    }
    const next = [MK.shopDoors[0].x0, MK.shopDoors[1].x0].find((d) => d > x + 0.01);
    let w = 2.6 + Math.floor(rand() * 3) * 0.5;
    if (next !== undefined && x + w > next - 1.5) w = next - x;
    w = Math.min(w, MK.temple.x0 - 1.4 - x);
    out.push({ x0: x, x1: x + w, floors: 3 + Math.floor(rand() * 2), seed: Math.floor(rand() * 10000) });
    x += w;
  }
  return out;
})();

const WALLS = ['#7a6a5c', '#6c7078', '#7d6758', '#6a6070', '#77705e', '#6e5e58'];
const SIGNS = ['#e03a3a', '#f2c14e', '#3a7be0', '#2bb673', '#ff6fb5', '#ff8a3b'];
const WORDS = ['冰', '粥', '茶', '麵', '藥房', '鐘錶', '布行', '眼鏡', '金飾', '五金', '小吃'];
const spriteCache = new Map<number, HTMLCanvasElement>();

function shophouseSprite(b: Shophouse): HTMLCanvasElement {
  const hit = spriteCache.get(b.seed);
  if (hit) return hit;
  const rand = seeded(b.seed);
  const w = Math.round((b.x1 - b.x0) * T);
  const floorH = 13;
  const ground = 18;
  const h = ground + b.floors * floorH + 10;
  const pad = 8;
  const canvas = document.createElement('canvas');
  canvas.width = w + pad * 2;
  canvas.height = h + 4;
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  const ox = pad;
  const top = canvas.height - h;
  const wall = b.special === 'lihu' ? '#7a3a2c' : b.special === 'lianzhen' ? '#7a6248' : WALLS[Math.floor(rand() * WALLS.length)] ?? '#7a6a5c';
  // 屋頂女兒牆、水塔
  px(c, '#3b3640', ox, top, w, 6);
  px(c, '#4c4652', ox, top, w, 1);
  if (!b.special) {
    px(c, rand() < 0.5 ? '#3b7dd8' : '#9aa3b2', ox + 4 + Math.floor(rand() * Math.max(1, w - 16)), top - 6, 10, 6);
  }
  // 立面
  px(c, wall, ox, top + 6, w, h - 6);
  for (let y = top + 6; y < top + h - ground; y += 3) px(c, 'rgba(0,0,0,0.06)', ox, y, w, 1);
  const upperBottom = top + h - ground;
  for (let f = 0; f < b.floors; f += 1) {
    const fy = top + 8 + f * floorH;
    px(c, 'rgba(0,0,0,0.18)', ox, fy + floorH - 2, w, 1);
    for (let cx = ox + 3; cx + 9 <= ox + w - 2; cx += 12) {
      const lit = rand() < 0.62;
      px(c, '#2b2a33', cx - 1, fy + 1, 11, 9);
      px(c, lit ? (rand() < 0.5 ? '#ffd27a' : '#ffe6a3') : '#33323d', cx, fy + 2, 9, 7);
      // 鐵窗
      for (let k = 0; k < 9; k += 2) px(c, 'rgba(25,25,30,0.7)', cx + k, fy + 2, 1, 7);
      px(c, 'rgba(25,25,30,0.7)', cx, fy + 5, 9, 1);
      if (rand() < 0.3) px(c, '#b9bdc8', cx + 10, fy + 4, 3, 3);
    }
  }
  if (b.special === 'lihu') {
    // 李鵠餅店：黑底金字的大招牌、紅磚立面、玻璃櫥窗裡擺滿糕餅
    px(c, '#15100c', ox + 4, top + 10, w - 8, 18);
    px(c, '#c9a24a', ox + 4, top + 10, w - 8, 1);
    px(c, '#c9a24a', ox + 4, top + 27, w - 8, 1);
    text(c, '李鵠餅店', ox + w / 2, top + 19.5, '#f2d27a', '900 12px "PingFang TC", "Noto Sans TC", serif');
    text(c, '創立百年', ox + w - 14, top + 34, 'rgba(242,210,122,0.8)', '700 6px "PingFang TC", "Noto Sans TC", sans-serif');
  } else if (b.special === 'lianzhen') {
    px(c, '#b71c1c', ox + 4, top + 10, w - 8, 16);
    px(c, '#ffd27a', ox + 4, top + 10, w - 8, 1);
    text(c, '連珍糕餅', ox + w / 2, top + 18.5, '#fff3cf', '900 11px "PingFang TC", "Noto Sans TC", serif');
  } else {
    // 一般街屋：直式霓虹招牌
    const word = WORDS[Math.floor(rand() * WORDS.length)] ?? '冰';
    const sc = SIGNS[Math.floor(rand() * SIGNS.length)] ?? '#e03a3a';
    const sx = rand() < 0.5 ? ox + 2 : ox + w - 11;
    const sh = 10 + word.length * 10;
    c.fillStyle = sc;
    c.globalAlpha = 0.3;
    c.fillRect(sx - 4, top + 8, 17, sh + 6);
    c.globalAlpha = 1;
    px(c, '#15171f', sx - 1, top + 10, 11, sh + 2);
    px(c, sc, sx, top + 11, 9, sh);
    px(c, 'rgba(255,255,255,0.35)', sx, top + 11, 1, sh);
    [...word].forEach((ch, i) => text(c, ch, sx + 4.5, top + 18 + i * 10, '#ffffff', '700 8px "PingFang TC", "Noto Sans TC", sans-serif'));
  }
  // 騎樓：柱子、暗暗的走廊、裡面的店面亮著燈
  px(c, '#15131a', ox, upperBottom, w, ground);
  const shopLight = b.special === 'lihu' ? '#ffe2a8' : b.special === 'lianzhen' ? '#fff0c8' : ['#ffd27a', '#ff9a6a', '#9fe0ff', '#ffe9b8'][Math.floor(rand() * 4)] ?? '#ffd27a';
  px(c, shopLight, ox + 4, upperBottom + 4, w - 8, ground - 6);
  if (b.special === 'lihu') {
    // 櫥窗：一排排糕餅
    for (let k = ox + 7; k < ox + w - 8; k += 6) {
      px(c, '#c98a3c', k, upperBottom + 8, 4, 3);
      px(c, '#f2e2b8', k, upperBottom + 13, 4, 2);
    }
  } else if (b.special === 'lianzhen') {
    for (let k = ox + 7; k < ox + w - 8; k += 5) {
      px(c, '#b48ad9', k, upperBottom + 9, 3, 3);
      px(c, '#f2e2b8', k + 1, upperBottom + 13, 3, 2);
    }
  }
  for (let k = ox; k < ox + w; k += 14) px(c, wall, k, upperBottom, 3, ground);
  px(c, 'rgba(0,0,0,0.3)', ox, upperBottom, w, 2);
  px(c, 'rgba(255,255,255,0.08)', ox, top + 6, 1, h - 6);
  px(c, 'rgba(0,0,0,0.3)', ox + w - 2, top + 6, 2, h - 6);
  spriteCache.set(b.seed, canvas);
  return canvas;
}

export function drawShophouse(c: CanvasRenderingContext2D, b: Shophouse): void {
  const s = shophouseSprite(b);
  c.drawImage(s, Math.round(b.x0 * T) - 8, Math.round(MK.shopLine * T) - s.height);
}

// ── 攤車：不鏽鋼台面、後面的老闆、依攤位不同的食物（湯鍋冒煙、炭烤冒煙、剉冰機…），上面掛黃色燈籠招牌 ──
function food(c: CanvasRenderingContext2D, kind: MiaokouStall['food'], x: number, y: number, w: number, seconds: number, seed: number): void {
  const rand = seeded(seed);
  const steam = (sx: number, sy: number) => {
    for (let k = 0; k < 3; k += 1) {
      const t = (seconds * 0.6 + k / 3) % 1;
      px(c, `rgba(255,255,255,${0.35 * (1 - t)})`, Math.round(sx + Math.sin(seconds * 2 + k) * 2), Math.round(sy - t * 14), 3, 2);
    }
  };
  switch (kind) {
    case 'sandwich':
      for (let k = 0; k < 4; k += 1) {
        const fx = x + 3 + k * 9;
        px(c, '#d9a35a', fx, y - 5, 7, 4);
        px(c, '#f2c27a', fx, y - 5, 7, 1);
        px(c, '#e25a4a', fx + 1, y - 3, 5, 1);
        px(c, '#f6e27a', fx + 1, y - 2, 5, 1);
      }
      break;
    case 'fry':
      px(c, '#3a3d48', x + 4, y - 6, 18, 6);
      px(c, '#c98a2c', x + 5, y - 5, 16, 3);
      for (let k = 0; k < 5; k += 1) px(c, '#e8b860', x + 6 + k * 3, y - 6 + (k % 2), 2, 2);
      steam(x + 12, y - 8);
      px(c, '#7ac46a', x + 26, y - 4, 8, 3);
      break;
    case 'soup':
      for (let k = 0; k < 2; k += 1) {
        const px0 = x + 4 + k * 18;
        px(c, '#9aa3b2', px0, y - 8, 14, 8);
        px(c, '#c9ccd6', px0, y - 8, 14, 1);
        px(c, k === 0 ? '#b8682e' : '#d9b27a', px0 + 1, y - 7, 12, 2);
        steam(px0 + 6, y - 10);
      }
      for (let k = 0; k < 3; k += 1) px(c, '#f2f2f2', x + 40 - k * 4, y - 3, 3, 3);
      break;
    case 'ice':
      // 剉冰機＋一杯杯泡泡冰
      px(c, '#c9ccd6', x + 4, y - 14, 8, 14);
      px(c, '#e8ecf3', x + 5, y - 14, 3, 14);
      px(c, '#3b82f6', x + 4, y - 16, 8, 3);
      for (let k = 0; k < 4; k += 1) {
        const fx = x + 16 + k * 7;
        px(c, '#ffffff', fx, y - 6, 5, 6);
        px(c, ['#f6c27a', '#f2a6c4', '#a8e0a8', '#f6e27a'][k] ?? '#ffffff', fx, y - 8, 5, 3);
      }
      break;
    case 'grill':
      px(c, '#2b2d33', x + 4, y - 4, 28, 4);
      px(c, '#ff6a2b', x + 5, y - 3, 26, 1);
      for (let k = 0; k < 6; k += 1) px(c, '#b8442e', x + 6 + k * 4, y - 6, 3, 3);
      for (let k = 0; k < 2; k += 1) {
        const t = (seconds * 0.5 + k / 2) % 1;
        px(c, `rgba(200,200,210,${0.3 * (1 - t)})`, Math.round(x + 14 + k * 8 + Math.sin(seconds + k) * 3), Math.round(y - 8 - t * 16), 4, 3);
      }
      break;
    case 'rice':
      px(c, '#c9ccd6', x + 4, y - 9, 12, 9);
      px(c, '#e8ecf3', x + 4, y - 9, 12, 2);
      steam(x + 10, y - 11);
      for (let k = 0; k < 4; k += 1) {
        px(c, '#f4f4f4', x + 20 + k * 6, y - 4, 5, 4);
        px(c, kind === 'rice' && seed % 2 ? '#c98a2c' : '#7a4a2a', x + 21 + k * 6, y - 5, 3, 2);
      }
      break;
    case 'griddle':
      px(c, '#2b2d33', x + 4, y - 4, 30, 4);
      for (let k = 0; k < 3; k += 1) {
        px(c, '#f2e2b8', x + 6 + k * 10, y - 6, 8, 3);
        px(c, '#e25a4a', x + 8 + k * 10, y - 6, 3, 1);
        px(c, '#7ac46a', x + 7 + k * 10, y - 5, 2, 1);
      }
      steam(x + 18, y - 8);
      break;
    case 'crab':
      for (let k = 0; k < 4; k += 1) {
        const fx = x + 4 + k * 9;
        px(c, '#e2552e', fx, y - 5, 7, 4);
        px(c, '#ff8a5a', fx + 1, y - 5, 5, 1);
        px(c, '#e2552e', fx - 1, y - 6, 2, 2);
        px(c, '#e2552e', fx + 6, y - 6, 2, 2);
      }
      steam(x + 20, y - 8);
      break;
  }
  void rand;
}

export function drawStall(c: CanvasRenderingContext2D, i: number, stall: MiaokouStall, seconds: number, ownerColors: (i: number) => HTMLCanvasElement | null): void {
  const cx = stallCenter(i) * T;
  const w = MK.stallW * T - 4;
  const x = Math.round(cx - w / 2);
  const counterY = Math.round(MK.counterY * T);
  const backY = Math.round(MK.stallTop * T) + 6;
  // 攤車後面的架子、塑膠布棚
  px(c, '#2b2e3a', x + 2, backY - 18, 2, counterY - backY + 18);
  px(c, '#2b2e3a', x + w - 4, backY - 18, 2, counterY - backY + 18);
  px(c, '#c9ccd6', x, backY - 20, w, 4);
  px(c, '#e8ecf3', x, backY - 20, w, 1);
  // 老闆（站在台面後面，面向客人）
  const owner = ownerColors(i);
  if (owner) c.drawImage(owner, Math.round(cx - owner.width / 2), counterY - 6 - owner.height);
  // 不鏽鋼台面＋前板
  px(c, '#8d93a3', x, counterY - 6, w, 6);
  px(c, '#d6dae2', x, counterY - 6, w, 2);
  px(c, '#b9bec9', x, counterY, w, 10);
  px(c, '#e3e6ec', x + 2, counterY + 1, w - 4, 1);
  px(c, 'rgba(0,0,0,0.25)', x, counterY + 10, w, 3);
  // 食物
  food(c, stall.food, x, counterY - 6, w, seconds, i * 7 + 3);
  // 黃色燈籠招牌（廟口夜市的招牌造型）：一格格亮黃色燈箱、紅字攤號＋店名
  const sy = backY - 44;
  px(c, '#3b3f4c', x + 4, sy + 16, 2, 10);
  px(c, '#3b3f4c', x + w - 6, sy + 16, 2, 10);
  glow(c, cx, sy + 8, w * 0.7, '255, 220, 100', 0.25);
  px(c, '#d9a51e', x - 1, sy - 1, w + 2, 18);
  px(c, '#ffe066', x, sy, w, 16);
  px(c, '#fff3b0', x, sy, w, 2);
  for (let k = x + 6; k < x + w; k += 7) px(c, 'rgba(200,140,20,0.35)', k, sy + 2, 1, 14);
  if (stall.no) {
    px(c, '#c62828', x + 2, sy + 2, 12, 12);
    text(c, stall.no, x + 8, sy + 8.5, '#ffffff', `900 ${stall.no.length > 2 ? 5 : 7}px system-ui, sans-serif`);
  }
  // 店名照可用的寬度縮字（攤號佔掉左邊一格）
  const name = stall.name['zh-TW'];
  const room = stall.no ? w - 16 : w - 4;
  const size = Math.max(5, Math.min(8, Math.floor(room / name.length)));
  text(c, name, stall.no ? x + 15 + room / 2 : cx, sy + 8.5, '#c62828', `900 ${size}px "PingFang TC", "Noto Sans TC", sans-serif`);
}

// ── 奠濟宮：石台基、紅柱、彩繪門神的大門、黑底金字匾額、燕尾脊（兩端翹起）＋剪黏、屋簷下一排紅燈籠 ──
export function drawTemple(c: CanvasRenderingContext2D, seconds: number): void {
  const t = MK.temple;
  const x = t.x0 * T;
  const w = (t.x1 - t.x0) * T;
  const y1 = t.y1 * T;
  const cx = x + w / 2;
  px(c, 'rgba(0,0,0,0.35)', x + 4, y1 - 2, w, 6);
  // 台基、階梯
  px(c, '#9a948a', x, y1 - 10, w, 10);
  for (let s = 0; s < 3; s += 1) px(c, s % 2 ? '#b5ad9f' : '#c9c0ae', cx - 30 + s * 3, y1 - 10 + s * 3, 60 - s * 6, 3);
  // 牆、柱子
  const bodyTop = y1 - 64;
  px(c, '#8b2a22', x + 8, bodyTop, w - 16, 54);
  px(c, '#a33a2e', x + 8, bodyTop, w - 16, 2);
  for (let i = 0; i < 6; i += 1) {
    const colX = Math.round(x + 12 + i * ((w - 28) / 5));
    px(c, '#b71c1c', colX, bodyTop + 6, 5, 48);
    px(c, '#e53935', colX, bodyTop + 6, 1, 48);
    px(c, '#c9a24a', colX - 1, bodyTop + 4, 7, 2);
  }
  // 三川門：中門最大，門上彩繪門神
  const door = (dx: number, dw: number, dh: number) => {
    px(c, '#4a1a12', dx - 1, y1 - 10 - dh - 1, dw + 2, dh + 1);
    px(c, '#7a2a1c', dx, y1 - 10 - dh, dw, dh);
    for (const side of [0, 1]) {
      const gx = dx + 2 + side * (dw / 2);
      px(c, '#2f5fa8', gx, y1 - 10 - dh + 4, dw / 2 - 4, dh - 8);
      px(c, '#f2c27a', gx + 2, y1 - 10 - dh + 6, dw / 2 - 8, 4);
      px(c, '#e25a4a', gx + 1, y1 - 10 - dh + 11, dw / 2 - 6, 6);
      px(c, '#c9a24a', gx, y1 - 10 - dh + 4, dw / 2 - 4, 1);
    }
    for (let k = 0; k < 4; k += 1) for (let j = 0; j < 3; j += 1) px(c, '#e8c060', dx + 3 + j * (dw / 3), y1 - 10 - dh + 8 + k * 6, 1, 1);
  };
  door(cx - 14, 28, 34);
  door(x + 18, 20, 26);
  door(x + w - 38, 20, 26);
  // 匾額
  px(c, '#15100c', cx - 22, bodyTop + 2, 44, 12);
  px(c, '#c9a24a', cx - 22, bodyTop + 2, 44, 1);
  px(c, '#c9a24a', cx - 22, bodyTop + 13, 44, 1);
  text(c, '奠濟宮', cx, bodyTop + 8.5, '#f2d27a', '900 9px "PingFang TC", "Noto Sans TC", serif');
  // 屋頂：橘紅琉璃瓦、燕尾脊兩端高高翹起
  const roofY = bodyTop;
  c.fillStyle = '#c0522a';
  c.beginPath();
  c.moveTo(x - 6, roofY + 2);
  c.lineTo(x + 18, roofY - 18);
  c.lineTo(x + w - 18, roofY - 18);
  c.lineTo(x + w + 6, roofY + 2);
  c.closePath();
  c.fill();
  for (let k = 0; k < 18; k += 3) px(c, '#a8441f', x + 6 + k * 0.8, roofY - 16 + k, w - 12 - k * 1.6, 1);
  // 正脊（燕尾）
  c.strokeStyle = '#e8d5a8';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(x + 10, roofY - 30);
  c.quadraticCurveTo(x + 20, roofY - 18, x + 30, roofY - 20);
  c.lineTo(x + w - 30, roofY - 20);
  c.quadraticCurveTo(x + w - 20, roofY - 18, x + w - 10, roofY - 30);
  c.stroke();
  px(c, '#c0522a', x + 30, roofY - 20, w - 60, 3);
  // 剪黏：脊上的雙龍搶珠（綠色、藍色、金色的小碎片）
  for (let k = 0; k < 10; k += 1) {
    const dx = x + 34 + k * ((w - 68) / 9);
    px(c, k % 3 === 0 ? '#2bb673' : k % 3 === 1 ? '#3a7be0' : '#f2c14e', dx, roofY - 24 - Math.round(Math.sin(k * 0.9) * 2), 3, 3);
  }
  px(c, '#ff5a3a', cx - 2, roofY - 28, 4, 4);
  glow(c, cx, roofY - 26, 10, '255, 120, 60', 0.4 + Math.sin(seconds * 2) * 0.1);
  // 屋簷下一排紅燈籠
  for (let k = 0; k < 7; k += 1) {
    const lx = Math.round(x + 14 + k * ((w - 28) / 6));
    const sway = Math.round(Math.sin(seconds * 1.4 + k) * 0.6);
    px(c, '#3a1a12', lx, roofY + 2, 1, 3);
    px(c, '#d72d2d', lx - 3 + sway, roofY + 5, 7, 8);
    px(c, '#ff6a5a', lx - 2 + sway, roofY + 6, 2, 6);
    px(c, '#f2c14e', lx - 3 + sway, roofY + 5, 7, 1);
    px(c, '#f2c14e', lx - 3 + sway, roofY + 12, 7, 1);
    glow(c, lx + sway, roofY + 9, 9, '255, 90, 60', 0.25);
  }
  glow(c, cx, y1 - 20, 60, '255, 180, 100', 0.15);
}

// 香爐：銅色三腳爐、一直冒的香煙
export function drawBurner(c: CanvasRenderingContext2D, seconds: number): void {
  const x = Math.round(MK.burner.x * T);
  const y = Math.round(MK.burner.y * T);
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

// 廟埕的木頭長椅
export function drawTempleBench(c: CanvasRenderingContext2D, x: number, y: number): void {
  const bx = Math.round((x - 1.1) * T);
  const by = Math.round(y * T);
  const w = Math.round(2.2 * T);
  px(c, 'rgba(0,0,0,0.25)', bx + 2, by + 3, w, 3);
  px(c, '#6b4428', bx, by - 4, w, 5);
  px(c, '#9a6a43', bx, by - 4, w, 1);
  px(c, '#3a2a20', bx + 2, by + 1, 2, 4);
  px(c, '#3a2a20', bx + w - 4, by + 1, 2, 4);
}

// 橫過走道的紅燈籠串（兩根柱子之間）
export function drawLanternString(c: CanvasRenderingContext2D, x0: number, x1: number, y: number, seconds: number): void {
  const a = x0 * T;
  const b = x1 * T;
  const top = y * T - 30;
  for (let i = 0; i <= b - a; i += 2) {
    const t = i / (b - a);
    px(c, '#2a2d38', a + i, Math.round(top + Math.sin(Math.PI * t) * 8), 2, 1);
  }
  const n = Math.max(3, Math.round((b - a) / 16));
  for (let i = 1; i < n; i += 1) {
    const t = i / n;
    const lx = Math.round(a + (b - a) * t);
    const ly = Math.round(top + Math.sin(Math.PI * t) * 8) + 1;
    const sway = Math.round(Math.sin(seconds * 1.4 + i + x0) * 0.6);
    px(c, '#d72d2d', lx - 2 + sway, ly + 2, 5, 6);
    px(c, '#ffe9a8', lx - 1 + sway, ly + 3, 3, 3);
  }
}

// 港裡的船：漁船（燈亮著）＋一艘停在遠處的郵輪
export function drawHarbor(c: CanvasRenderingContext2D, seconds: number): void {
  const wy = MK.waterY * T;
  const bob = Math.round(Math.sin(seconds * 0.9));
  // 漁船
  for (const [bx, by, col] of [
    [6, 2.6, '#3a7be0'],
    [14, 3.6, '#e25a4a'],
    [24, 2.8, '#2bb673'],
  ] as const) {
    const x = bx * T;
    const y = wy + by * T + bob;
    px(c, 'rgba(0,0,0,0.3)', x + 2, y + 2, 30, 3);
    px(c, '#e8ecf3', x, y - 8, 30, 8);
    px(c, col, x, y - 3, 30, 3);
    px(c, '#c9ccd6', x + 8, y - 16, 12, 8);
    px(c, '#ffe7a8', x + 10, y - 14, 3, 3);
    px(c, '#ffe7a8', x + 15, y - 14, 3, 3);
    px(c, '#3b3f4c', x + 24, y - 24, 1, 16);
    if (Math.sin(seconds * 2 + bx) > 0) px(c, '#ff4040', x + 23, y - 25, 3, 2);
  }
}

// 雨：螢幕座標的雨絲＋地上的水花
export function drawRain(c: CanvasRenderingContext2D, w: number, h: number, seconds: number, strength: number): void {
  if (strength <= 0.02) return;
  const n = Math.round(160 * strength);
  c.strokeStyle = `rgba(180, 200, 230, ${0.35 * strength})`;
  c.lineWidth = 1;
  c.beginPath();
  for (let i = 0; i < n; i += 1) {
    const sx = ((i * 97.13 + seconds * 40) % (w + 40)) - 20;
    const sy = ((i * 53.7 + seconds * 520) % (h + 40)) - 20;
    c.moveTo(sx, sy);
    c.lineTo(sx - 3, sy + 12);
  }
  c.stroke();
  for (let i = 0; i < n / 4; i += 1) {
    const sx = (i * 131.7) % w;
    const sy = (i * 71.3 + Math.floor(seconds * 6) * 37) % h;
    c.fillStyle = `rgba(200, 215, 240, ${0.3 * strength})`;
    c.fillRect(Math.round(sx), Math.round(sy), 3, 1);
  }
  c.fillStyle = `rgba(10, 14, 30, ${0.12 * strength})`;
  c.fillRect(0, 0, w, h);
}

// 撐傘的路人用的傘（畫在頭上）
export function drawUmbrella(c: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, 9, 5, 0, Math.PI, 0);
  c.fill();
  px(c, 'rgba(255,255,255,0.3)', x - 6, y - 4, 4, 1);
  px(c, '#2b2d33', x, y, 1, 9);
}

// 車站：基隆站（往回搭）的入口
export function drawMiaokouStation(c: CanvasRenderingContext2D): void {
  const s = MK.station;
  const x = s.x0 * T;
  const w = (s.x1 - s.x0) * T;
  const y0 = s.y0 * T;
  const y1 = s.y1 * T;
  px(c, 'rgba(0,0,0,0.35)', x + 3, y1 - 2, w, 5);
  px(c, '#e3e8f0', x, y0, w, y1 - y0);
  px(c, '#2a2f40', x + 12, y0 + 10, w - 24, y1 - y0 - 10);
  for (let k = y0 + 12; k < y1; k += 3) px(c, '#4a5068', x + 12, k, w - 24, 1);
  px(c, '#0070bd', x - 2, y0 - 6, w + 4, 8);
  text(c, '基隆站', x + w / 2, y0 - 2, '#ffffff', '700 7px "PingFang TC", "Noto Sans TC", sans-serif');
}

// 廟前的石獅（左公右母）
export function drawStoneLion(c: CanvasRenderingContext2D, x: number, y: number, flip: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const f = flip ? -1 : 1;
  px(c, 'rgba(0,0,0,0.3)', cx - 9, by - 1, 18, 3);
  px(c, '#8d8a84', cx - 8, by - 6, 16, 6);
  px(c, '#a8a49c', cx - 8, by - 6, 16, 1);
  px(c, '#9a968e', cx - 6, by - 20, 12, 14);
  px(c, '#b5b0a6', cx - 5 + f, by - 26, 10, 9);
  px(c, '#c9c4b8', cx - 4 + f, by - 26, 4, 2);
  px(c, '#6e6a62', cx - 2 + f * 3, by - 22, 2, 2);
  px(c, '#7a766e', cx - 6 + (flip ? 0 : 10), by - 24, 3, 8);
  px(c, '#b5b0a6', cx + f * 6 - 2, by - 12, 4, 4);
}

// 金爐：燒金紙的磚爐，裡面火光一閃一閃
export function drawGoldFurnace(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.3)', cx - 10, by - 1, 21, 3);
  px(c, '#8b2a22', cx - 9, by - 26, 18, 26);
  px(c, '#a33a2e', cx - 9, by - 26, 18, 2);
  for (let k = by - 22; k < by; k += 5) px(c, '#7a2018', cx - 9, k, 18, 1);
  px(c, '#c0522a', cx - 11, by - 32, 22, 6);
  px(c, '#e8d5a8', cx - 11, by - 32, 22, 1);
  const flicker = 0.6 + Math.sin(seconds * 9) * 0.2 + Math.sin(seconds * 13) * 0.1;
  px(c, '#2a0e08', cx - 5, by - 16, 10, 9);
  px(c, `rgba(255, ${140 + Math.round(flicker * 60)}, 40, 1)`, cx - 4, by - 13, 8, 5);
  px(c, '#ffe9a8', cx - 2, by - 12, 3, 2);
  glow(c, cx, by - 12, 14, '255, 150, 60', 0.35 * flicker);
  for (let k = 0; k < 3; k += 1) {
    const t = (seconds * 0.5 + k / 3) % 1;
    px(c, `rgba(120,120,130,${0.4 * (1 - t)})`, Math.round(cx - 1 + Math.sin(seconds + k) * 3), Math.round(by - 34 - t * 18), 3, 2);
  }
}

// 拿著香的手（畫在拜拜的人前面）：三支香、香頭紅紅的
export function drawIncense(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  for (let k = -1; k <= 1; k += 1) {
    px(c, '#c9a24a', cx + k * 2, by - 26, 1, 9);
    px(c, Math.sin(seconds * 6 + k) > 0 ? '#ff5a3a' : '#ff8a5a', cx + k * 2, by - 27, 1, 1);
  }
}

// 街口的「基隆廟口」大招牌（兩根柱子撐著，紅底黃字）
export function drawGateSign(c: CanvasRenderingContext2D): void {
  const g = MK.gateSign;
  const x0 = Math.round(g.x0 * T);
  const x1 = Math.round(g.x1 * T);
  const by = Math.round(g.y * T);
  px(c, 'rgba(0,0,0,0.3)', x0, by - 1, x1 - x0, 3);
  px(c, '#3b3f4c', x0 + 2, by - 30, 3, 30);
  px(c, '#3b3f4c', x1 - 5, by - 30, 3, 30);
  px(c, '#9a1f1a', x0 - 2, by - 46, x1 - x0 + 4, 18);
  px(c, '#c62828', x0, by - 44, x1 - x0, 14);
  px(c, '#f2c14e', x0, by - 44, x1 - x0, 1);
  px(c, '#f2c14e', x0, by - 31, x1 - x0, 1);
  text(c, '基隆廟口', (x0 + x1) / 2, by - 37, '#ffe066', '900 9px "PingFang TC", "Noto Sans TC", serif');
  glow(c, (x0 + x1) / 2, by - 37, 30, '255, 90, 60', 0.2);
}

// 港邊的路燈
export function drawHarborLamp(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  glow(c, cx, by - 24, 22, '255, 214, 140', 0.22);
  px(c, 'rgba(0,0,0,0.3)', cx - 3, by - 1, 7, 2);
  px(c, '#3d424c', cx, by - 26, 2, 26);
  px(c, '#545a66', cx, by - 26, 1, 26);
  px(c, '#2f333b', cx - 3, by - 30, 8, 4);
  px(c, '#fff1a8', cx - 2, by - 27, 6, 1);
}

// 馬路上騎過去的機車（載人、有大燈）、計程車
export function drawRoadVehicle(c: CanvasRenderingContext2D, kind: 'scooter' | 'taxi', x: number, y: number, dir: 1 | -1, color: string, rider: string): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  if (kind === 'taxi') {
    px(c, 'rgba(0,0,0,0.3)', cx - 15, by - 1, 30, 3);
    px(c, '#f6c945', cx - 14, by - 12, 28, 11);
    px(c, '#ffe066', cx - 14, by - 12, 28, 2);
    px(c, '#2b3550', cx - 8, by - 17, 16, 6);
    px(c, '#9fd8ff', cx - 7, by - 16, 6, 4);
    px(c, '#9fd8ff', cx + 1, by - 16, 6, 4);
    px(c, '#15171f', cx - 11, by - 2, 6, 3);
    px(c, '#15171f', cx + 5, by - 2, 6, 3);
    px(c, '#ffffff', cx - 3, by - 20, 6, 3);
    px(c, '#fff3b0', cx + dir * 14, by - 9, 2, 3);
    glow(c, cx + dir * 22, by - 6, 12, '255, 240, 180', 0.3);
    return;
  }
  px(c, 'rgba(0,0,0,0.3)', cx - 8, by - 1, 16, 2);
  px(c, '#15171f', cx - 7, by - 3, 4, 3);
  px(c, '#15171f', cx + 3, by - 3, 4, 3);
  px(c, color, cx - 6, by - 8, 12, 5);
  px(c, 'rgba(255,255,255,0.35)', cx - 6, by - 8, 12, 1);
  // 騎士：安全帽、雨衣
  px(c, rider, cx - 3, by - 15, 6, 7);
  px(c, '#f4f4f4', cx - 3, by - 19, 6, 4);
  px(c, '#2b2d33', cx - 1 + dir, by - 18, 3, 2);
  px(c, '#fff3b0', cx + dir * 7, by - 7, 2, 2);
  glow(c, cx + dir * 14, by - 5, 9, '255, 240, 180', 0.3);
}
