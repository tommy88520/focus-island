// 金澤的美術：遠方的白山連峰、卯辰山、金澤城石川門（石垣、白色海鼠壁、灰白的鉛瓦、多聞櫓）、
// 兼六園（苔地、霞之池和蓬萊島、曲水和雁行橋、虹橋、徽軫燈籠、雪吊的唐崎松、小松、楓樹、石燈籠、茶屋和紅傘緣台）、
// 東茶屋街（兩層的木造茶屋、紅殼色的木蟲籠格子、黑瓦、石板路、門前的燈籠、金箔霜淇淋的店）、淺野川和梅之橋、
// 近江町市場（拱頂的市場屋頂、螃蟹和鮮魚的攤子、海鮮丼的吧台）、JR 金澤站（站房、玻璃穹頂もてなしドーム、鼓門）、金澤咖哩的店。
// 冬天（台灣時間 12–2 月）地上積雪、天上下雪；雪吊一整年都掛著（真的兼六園是 11 月到 3 月中）。最後組成 CityScene 用的 KANAZAWA。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import {
  CHAYA_BENCHES,
  CHAYA_BENCH_Y,
  CHAYA_ROW,
  COUNTER_X,
  COUNTER_Y,
  KANAZAWA_SEATS,
  KANAZAWA_SHOPS,
  KZ,
  POND_BENCHES,
  POND_BENCH_Y,
  STREAM,
  TEA_BENCH,
  TEA_BENCH_Y,
  inPond,
  streamDist,
  type ChayaKind,
} from './kanazawa';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, drawStoneBench, drawStool, drawStreetTree } from './cityArt';
import { drawLantern, drawMaple, drawStoneLantern, drawStreetLamp } from './kyotoArt';

const TILE = '#3a3c42';
const TILE_DARK = '#25272c';
const KAWARA = '#2c2e33'; // 金澤的黑色釉瓦
const LEAD = '#b8c0c4'; // 鉛瓦（灰白）
const LEAD_DARK = '#8f999f';
const PLASTER = '#f2eee4';
const BENGARA = '#9a3f26'; // 紅殼色（茶屋街的格子）
const WOOD = '#5e3a26';
const GOLD = '#d9a62a';
const GOLD_LIGHT = '#f6dc7a';
const SNOW = '#f4f7fb';
const SNOW_SH = '#dbe3ec';

// ── 季節：台灣時間 12、1、2 月是冬天（積雪、下雪）──
let monthAt = -Infinity;
let monthVal = 1;
function kzWinter(): boolean {
  const now = Date.now();
  if (now - monthAt > 60000) {
    monthAt = now;
    monthVal = Number(new Intl.DateTimeFormat('en-US', { month: 'numeric', timeZone: 'Asia/Taipei' }).format(new Date(now)));
  }
  return monthVal === 12 || monthVal <= 2;
}

// ── 日式屋頂（正面看）：兩端的屋簷翹起、往屋脊凹進去；ridge 是屋脊寬占幾成 ──
function eave(c: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number, color = TILE, ridge = 0.36, tip = 3, edge = TILE_DARK): void {
  const l = cx - w / 2;
  const r = cx + w / 2;
  const rl = cx - (w * ridge) / 2;
  const rr = cx + (w * ridge) / 2;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(l - tip, top + h - tip - 1);
  c.quadraticCurveTo(l + (rl - l) * 0.45, top + h + 1, rl, top);
  c.lineTo(rr, top);
  c.quadraticCurveTo(r - (r - rr) * 0.45, top + h + 1, r + tip, top + h - tip - 1);
  c.lineTo(r, top + h);
  c.lineTo(l, top + h);
  c.closePath();
  c.fill();
  c.save();
  c.clip();
  for (let x = Math.round(l); x < r; x += 3) px(c, 'rgba(255,255,255,0.09)', x, top, 1, h);
  px(c, 'rgba(255,255,255,0.14)', Math.round(rl), Math.round(top), Math.round(rr - rl), 1);
  c.restore();
  px(c, edge, Math.round(l), Math.round(top + h - 2), Math.round(w), 2);
  px(c, '#a88a62', Math.round(l + 2), Math.round(top + h), Math.round(w - 4), 1);
  px(c, '#6e5238', Math.round(l + 3), Math.round(top + h + 1), Math.round(w - 6), 1);
}

// 海鼠壁：深灰的方瓦斜斜排、白色灰泥的接縫（斜格子）
function namako(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  px(c, '#43474e', x, y, w, h);
  for (let yy = 0; yy < h; yy += 1) {
    for (let xx = 0; xx < w; xx += 1) {
      if ((xx + yy) % 7 === 0 || (xx - yy + 700) % 7 === 0) px(c, '#eceae4', x + xx, y + yy, 1, 1);
    }
  }
  px(c, '#2e3136', x, y, w, 1);
}

// ── 地面（畫一次）──
export function paintKanazawaGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(573);
  const winter = kzWinter();
  const W = KZ.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 6 * T);
  sky.addColorStop(0, winter ? '#a7b9cc' : '#82b8e2');
  sky.addColorStop(1, winter ? '#e8eef4' : '#e4f0f6');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 9 * T);
  // 白山連峰（遠山，山頂有雪）
  for (let x = 0; x < W; x += 2) {
    const top = 2.6 * T + Math.sin(x * 0.011 + 0.6) * 12 + Math.sin(x * 0.031) * 5 - Math.max(0, 30 - Math.abs(x - 15 * T) * 0.12);
    px(c, '#8ea2b8', x, Math.round(top), 2, 7 * T - Math.round(top));
    const cap = 7 + Math.sin(x * 0.3) * 2 + (winter ? 10 : 0);
    px(c, '#f2f6fa', x, Math.round(top), 2, Math.round(cap));
  }
  // 卯辰山（東邊，綠色的丘陵）
  c.fillStyle = winter ? '#9aa8a6' : '#4f7a4e';
  c.beginPath();
  c.moveTo(24 * T, 10 * T);
  for (let x = 24 * T; x <= W; x += 8) c.lineTo(x, 4.4 * T + Math.sin(x * 0.009 + 2) * 16 + Math.sin(x * 0.04) * 4);
  c.lineTo(W, 10 * T);
  c.fill();
  // 森林（城和茶屋後面）
  for (let i = 0; i < 260; i += 1) {
    const x = rand() * W;
    const y = 5 * T + rand() * 5 * T;
    c.fillStyle = (winter ? ['#5a6a5e', '#6b7a6c', '#d8e0e6', '#4e5e52'] : ['#355e3a', '#3f6c42', '#4a7a4a', '#2e5232'])[Math.floor(rand() * 4)] ?? '#3f6c42';
    c.beginPath();
    c.arc(x, y, 5 + rand() * 7, 0, Math.PI * 2);
    c.fill();
  }
  // 兼六園的苔地
  const g = KZ.garden;
  px(c, winter ? SNOW : '#5e8a48', 0, g.y0 * T, g.x1 * T, (g.y1 - g.y0) * T);
  for (let i = 0; i < 1400; i += 1) {
    const col = winter ? (rand() < 0.8 ? SNOW_SH : '#7a9a6a') : ['#527c3e', '#6d9a54', '#4a7238', '#7aa860'][Math.floor(rand() * 4)] ?? '#527c3e';
    px(c, col, Math.floor(rand() * g.x1 * T), Math.floor(g.y0 * T + rand() * (g.y1 - g.y0) * T), 2 + Math.floor(rand() * 2), 1);
  }
  // 砂石小路：繞著池子、往茶屋、北邊
  const gravel = (r: Rect) => {
    px(c, winter ? '#e4e6e6' : '#d8cfb8', r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T);
    const n = Math.floor((r.x1 - r.x0) * (r.y1 - r.y0) * 5);
    for (let i = 0; i < n; i += 1) px(c, rand() < 0.5 ? '#c4baa2' : '#ebe4d2', Math.floor(r.x0 * T + rand() * (r.x1 - r.x0) * T), Math.floor(r.y0 * T + rand() * (r.y1 - r.y0) * T), 1, 1);
  };
  const { cx, cy, rx, ry } = KZ.pond;
  // 池邊一圈的砂石路（橢圓環）
  for (let y = Math.floor((cy - ry - 1.6) * T); y < (cy + ry + 1.6) * T; y += 1) {
    for (let x = Math.floor((cx - rx - 1.6) * T); x < (cx + rx + 1.6) * T; x += 1) {
      const dx = (x / T - cx) / (rx + 1.4);
      const dy = (y / T - cy) / (ry + 1.4);
      const e = dx * dx + dy * dy;
      if (e < 1 && !inPond(x / T, y / T, 0.35)) px(c, rand() < 0.15 ? '#c4baa2' : winter ? '#e6e8e8' : '#d8cfb8', x, y, 1, 1);
    }
  }
  gravel({ x0: 0, y0: 23.6, x1: g.x1, y1: 24.8 });
  gravel({ x0: 0, y0: 11.6, x1: 23.6, y1: 12.8 });
  gravel({ x0: 20.6, y0: 27, x1: 23, y1: g.y1 });
  gravel({ x0: 1.2, y0: 12.8, x1: 2.4, y1: 23.6 });
  // 小路：兼六園和茶屋街之間
  gravel({ x0: KZ.lane.x0, y0: g.y0, x1: KZ.lane.x1, y1: KZ.walk });
  // 苔上的石頭
  for (const [x, y, w] of [[2.4, 21.2, 10], [6.4, 23.0, 7], [17.4, 22.6, 8], [23.4, 18.6, 9], [5, 10.4, 8], [19.6, 10.4, 7], [24.4, 26.2, 7], [1.2, 27.4, 9], [11, 26.6, 6], [14.2, 27.8, 8]] as const) {
    c.fillStyle = '#8a8478';
    c.beginPath();
    c.ellipse(x * T, y * T, w, w * 0.55, 0, 0, Math.PI * 2);
    c.fill();
    px(c, winter ? SNOW : '#a8a294', Math.round(x * T - w * 0.5), Math.round(y * T - w * 0.5), Math.round(w), 2);
  }
  // 霞之池：石組、水
  for (let a = 0; a < Math.PI * 2; a += 0.05) {
    const s = 4 + Math.floor(rand() * 4);
    px(c, rand() < 0.5 ? '#8a857a' : '#9e988a', Math.round((cx + Math.cos(a) * (rx + 0.18)) * T - s / 2), Math.round((cy + Math.sin(a) * (ry + 0.18)) * T - s / 2), s, s - 1);
  }
  const water = c.createLinearGradient(0, (cy - ry) * T, 0, (cy + ry) * T);
  water.addColorStop(0, '#2f5e62');
  water.addColorStop(1, '#41797a');
  c.fillStyle = water;
  c.beginPath();
  c.ellipse(cx * T, cy * T, rx * T, ry * T, 0, 0, Math.PI * 2);
  c.fill();
  // 蓬萊島（龜甲島）
  c.fillStyle = '#7a7466';
  c.beginPath();
  c.ellipse(10.2 * T, 18.4 * T, 22, 9, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = winter ? SNOW : '#4f7a3e';
  c.beginPath();
  c.ellipse(10.2 * T, 18.1 * T, 18, 6, 0, 0, Math.PI * 2);
  c.fill();
  // 曲水：石頭的邊、水
  const streamPath = (w: number, col: string) => {
    c.strokeStyle = col;
    c.lineWidth = w;
    c.lineCap = 'round';
    c.lineJoin = 'round';
    c.beginPath();
    STREAM.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * T, y * T) : c.lineTo(x * T, y * T)));
    c.stroke();
  };
  streamPath(15, '#8f897c');
  streamPath(10, '#4b8a8a');
  streamPath(3, 'rgba(200,235,235,0.35)');
  // 雁行橋：龜甲形的踏石，一塊塊斜斜排（像雁飛的隊形）
  for (let k = 0; k < 5; k += 1) {
    const x = (KZ.ganko.x - 1 + k * 0.5) * T;
    const y = (KZ.ganko.y - 0.5 + k * 0.25) * T;
    c.fillStyle = '#a8a08e';
    c.beginPath();
    c.moveTo(x - 5, y);
    c.lineTo(x - 2, y - 3);
    c.lineTo(x + 3, y - 3);
    c.lineTo(x + 5, y);
    c.lineTo(x + 3, y + 3);
    c.lineTo(x - 2, y + 3);
    c.closePath();
    c.fill();
    px(c, '#c8c0ac', Math.round(x - 2), Math.round(y - 3), 5, 1);
  }
  // 虹橋（一塊微微拱起的石板橋，跨在曲水流進池子的地方）
  {
    const { x0, x1, y } = KZ.niji;
    const by = y * T;
    for (let x = x0 * T; x < x1 * T; x += 1) {
      const t = (x - x0 * T) / ((x1 - x0) * T);
      const lift = Math.round(Math.sin(t * Math.PI) * 2);
      px(c, '#6e685c', Math.round(x), Math.round(by - lift + 2), 1, 3);
      px(c, '#b3ab98', Math.round(x), Math.round(by - lift - 5), 1, 7);
      px(c, '#cfc8b4', Math.round(x), Math.round(by - lift - 5), 1, 1);
    }
  }
  // 茶屋街後面、石板路
  const slabs = (r: Rect, base: string, joint: string) => {
    px(c, base, r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T);
    for (let y = r.y0 * T, row = 0; y < r.y1 * T; y += 10, row += 1) {
      px(c, joint, r.x0 * T, Math.round(y), (r.x1 - r.x0) * T, 1);
      for (let x = r.x0 * T + (row % 2) * 9; x < r.x1 * T; x += 18) px(c, joint, Math.round(x), Math.round(y), 1, 10);
    }
  };
  const ch = KZ.chaya;
  px(c, '#4a3a2e', ch.x0 * T, 8 * T, (ch.x1 - ch.x0 + 1) * T, (ch.line - 8) * T);
  slabs({ x0: ch.x0, y0: ch.line, x1: KZ.W, y1: ch.street }, winter ? '#d6d8da' : '#b8b2a4', winter ? '#c2c6ca' : '#9c9688');
  px(c, 'rgba(0,0,0,0.15)', ch.x0 * T, ch.line * T, (KZ.W - ch.x0) * T, 2);
  // 淺野川：石岸、水、對岸的步道
  const rv = KZ.river;
  px(c, '#9a948a', rv.x0 * T, ch.street * T, W - rv.x0 * T, (rv.y0 - ch.street) * T);
  for (let x = rv.x0 * T; x < W; x += 9) px(c, '#827c72', x, ch.street * T, 1, (rv.y0 - ch.street) * T);
  const rw = c.createLinearGradient(0, rv.y0 * T, 0, rv.y1 * T);
  rw.addColorStop(0, '#3e6f7e');
  rw.addColorStop(1, '#5a8e98');
  c.fillStyle = rw;
  c.fillRect(rv.x0 * T, rv.y0 * T, W - rv.x0 * T, (rv.y1 - rv.y0) * T);
  for (let i = 0; i < 40; i += 1) px(c, 'rgba(255,255,255,0.18)', Math.round(rv.x0 * T + rand() * (W - rv.x0 * T)), Math.round(rv.y0 * T + 3 + rand() * ((rv.y1 - rv.y0) * T - 6)), 3 + Math.floor(rand() * 6), 1);
  px(c, '#9a948a', rv.x0 * T, rv.y1 * T, W - rv.x0 * T, 6);
  px(c, '#827c72', rv.x0 * T, rv.y1 * T + 5, W - rv.x0 * T, 1);
  // 河岸步道（草邊）
  px(c, winter ? SNOW : '#7aa058', rv.x0 * T, rv.y1 * T + 6, W - rv.x0 * T, 8);
  gravel({ x0: rv.x0, y0: rv.y1 + 0.875, x1: KZ.W, y1: 24 });
  // 小路跨過河的地方：石頭的小橋、橋下的涵洞
  px(c, '#2a3a40', rv.x0 * T - 2, rv.y0 * T + 4, 4, (rv.y1 - rv.y0) * T - 8);
  px(c, '#8f897c', KZ.lane.x0 * T, rv.y0 * T - 2, (KZ.lane.x1 - KZ.lane.x0) * T, 2);
  px(c, '#8f897c', KZ.lane.x0 * T, rv.y1 * T, (KZ.lane.x1 - KZ.lane.x0) * T, 2);
  // 梅之橋：木頭的橋面、欄杆
  const br = KZ.bridge;
  px(c, '#8a6440', br.x0 * T, ch.street * T, (br.x1 - br.x0) * T, (rv.y1 - ch.street + 0.4) * T);
  for (let y = ch.street * T; y < (rv.y1 + 0.4) * T; y += 3) px(c, '#6e4c2e', br.x0 * T, y, (br.x1 - br.x0) * T, 1);
  for (const x of [br.x0 * T, br.x1 * T - 3]) {
    px(c, '#4e3420', x, ch.street * T - 2, 3, (rv.y1 - ch.street + 0.6) * T);
    for (let y = ch.street * T; y < (rv.y1 + 0.4) * T; y += 10) px(c, '#3a2616', x - 1, y, 5, 3);
  }
  // 人行道
  tiles(c, { x0: 0, y0: KZ.walk, x1: KZ.W, y1: KZ.road.y0 }, winter ? '#e2e6ea' : '#d4cfc4', winter ? '#cfd5dc' : '#c2bcb0', 16);
  tiles(c, { x0: KZ.lane.x1, y0: KZ.market.line, x1: KZ.W, y1: KZ.walk }, winter ? '#e2e6ea' : '#d4cfc4', winter ? '#cfd5dc' : '#c2bcb0', 16);
  // 百萬石通（馬路）
  road(c, { x0: 0, y0: KZ.road.y0, x1: KZ.W, y1: KZ.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((KZ.road.y0 + KZ.road.y1) / 2) * T), 12, 1);
  zebra(c, KZ.lane.x0, KZ.road.y0, KZ.lane.x1 + 0.4, KZ.road.y1, false);
  zebra(c, 15, KZ.road.y0, 17.6, KZ.road.y1, false);
  zebra(c, 38.4, KZ.road.y0, 40.6, KZ.road.y1, false);
  // 站前廣場（花崗岩地磚）、穹頂下
  tiles(c, { x0: 0, y0: KZ.road.y1, x1: KZ.W, y1: KZ.H }, winter ? '#e6e9ec' : '#d8d3c7', winter ? '#d3d9df' : '#c7c1b3', 16);
  px(c, '#bdb6a8', 0, KZ.road.y1 * T, W, 2);
  tiles(c, { x0: KZ.dome.x0, y0: KZ.rowLine, x1: KZ.dome.x1, y1: KZ.H }, '#e6e2d8', '#d4cfc2', 16);
}

// ── 金澤城：石垣、多聞櫓、石川門（白色的海鼠壁、灰白的鉛瓦）──
const CS_W = Math.round((KZ.castle.x1 - KZ.castle.x0) * T);
const CS_H = 122;
function castleSprite(): HTMLCanvasElement {
  const w = CS_W;
  const h = CS_H;
  return cached(`kz-castle-${kzWinter() ? 'w' : 's'}`, w, h, (c) => {
    const rand = seeded(1788);
    const winter = kzWinter();
    const gx = Math.round(KZ.castle.gateX * T);
    // 石垣：微微往上收、一塊塊戶室石（帶點紅褐、青灰）
    const wallTop = h - 44;
    for (let y = wallTop; y < h; y += 1) {
      const inset = Math.round(((h - y) / 44) * 5);
      px(c, '#a59a84', inset, y, w - inset * 2, 1);
    }
    for (let y = wallTop + 1, row = 0; y < h; y += 6, row += 1) {
      for (let x = (row % 2) * 7; x < w; x += 12 + Math.floor(rand() * 5)) {
        const bw = 10 + Math.floor(rand() * 5);
        px(c, ['#b0a48c', '#9c917c', '#ad9a88', '#a3a296'][Math.floor(rand() * 4)] ?? '#b0a48c', x, y, bw, 5);
        px(c, 'rgba(255,255,255,0.15)', x, y, bw, 1);
      }
      px(c, '#7e7564', 0, y + 5, w, 1);
    }
    // 城門的通道（櫓門下面）、厚木門
    px(c, '#1c1612', gx - 20, h - 30, 40, 30);
    px(c, '#4a3020', gx - 20, h - 30, 9, 30);
    px(c, '#4a3020', gx + 11, h - 30, 9, 30);
    for (let y = h - 26; y < h; y += 6) {
      px(c, '#2a2a2e', gx - 20, y, 9, 1);
      px(c, '#2a2a2e', gx + 11, y, 9, 1);
    }
    px(c, '#3a2a1e', gx - 22, h - 32, 44, 3);
    // 多聞櫓：石垣上一長排，下半海鼠壁、上半白壁和小窗、鉛瓦
    const tamon = (x0: number, x1: number) => {
      px(c, PLASTER, x0, wallTop - 24, x1 - x0, 24);
      namako(c, x0, wallTop - 12, x1 - x0, 12);
      for (let x = x0 + 8; x < x1 - 12; x += 22) {
        px(c, '#3a3a3e', x, wallTop - 21, 8, 6);
        for (let k = 1; k < 8; k += 2) px(c, '#c9c2b4', x + k, wallTop - 21, 1, 6);
      }
      px(c, LEAD, x0 - 3, wallTop - 32, x1 - x0 + 6, 9);
      for (let x = x0 - 2; x < x1 + 3; x += 3) px(c, LEAD_DARK, x, wallTop - 31, 1, 7);
      px(c, '#d8dee0', x0 - 3, wallTop - 32, x1 - x0 + 6, 2);
      px(c, LEAD_DARK, x0 - 3, wallTop - 24, x1 - x0 + 6, 1);
      if (winter) px(c, SNOW, x0 - 3, wallTop - 34, x1 - x0 + 6, 3);
    };
    tamon(10, gx - 64);
    tamon(gx + 64, w - 10);
    // 兩端的轉角小櫓
    for (const x of [6, w - 34]) {
      px(c, PLASTER, x, wallTop - 40, 28, 40);
      namako(c, x, wallTop - 16, 28, 16);
      px(c, '#3a3a3e', x + 9, wallTop - 34, 10, 7);
      for (let k = 1; k < 10; k += 2) px(c, '#c9c2b4', x + 9 + k, wallTop - 34, 1, 7);
      eave(c, x + 14, wallTop - 52, 40, 13, LEAD, 0.35, 3, LEAD_DARK);
      if (winter) px(c, SNOW, x + 2, wallTop - 53, 24, 3);
    }
    // 石川門的櫓門：兩層、正面的唐破風出窗
    const bw = 124;
    px(c, PLASTER, gx - bw / 2, wallTop - 36, bw, 36);
    namako(c, gx - bw / 2, wallTop - 16, bw, 16);
    px(c, '#d0ccc2', gx - bw / 2, wallTop - 36, bw, 1);
    for (const dx of [-48, -30, 22, 40]) {
      px(c, '#3a3a3e', gx + dx, wallTop - 31, 10, 9);
      for (let k = 1; k < 10; k += 2) px(c, '#c9c2b4', gx + dx + k, wallTop - 31, 1, 9);
    }
    // 出窗（石落とし）＋唐破風
    px(c, PLASTER, gx - 14, wallTop - 34, 28, 22);
    namako(c, gx - 14, wallTop - 14, 28, 6);
    px(c, '#3a3a3e', gx - 8, wallTop - 28, 16, 9);
    for (let k = 1; k < 16; k += 2) px(c, '#c9c2b4', gx - 8 + k, wallTop - 28, 1, 9);
    c.fillStyle = LEAD;
    c.beginPath();
    c.moveTo(gx - 20, wallTop - 34);
    c.bezierCurveTo(gx - 12, wallTop - 36, gx - 8, wallTop - 46, gx, wallTop - 46);
    c.bezierCurveTo(gx + 8, wallTop - 46, gx + 12, wallTop - 36, gx + 20, wallTop - 34);
    c.closePath();
    c.fill();
    px(c, LEAD_DARK, gx - 20, wallTop - 35, 40, 1);
    // 大屋頂（入母屋，鉛瓦），山牆是白的、有懸魚
    eave(c, gx, wallTop - 66, bw + 26, 22, LEAD, 0.6, 5, LEAD_DARK);
    c.fillStyle = PLASTER;
    c.beginPath();
    c.moveTo(gx - 22, wallTop - 58);
    c.lineTo(gx, wallTop - 76);
    c.lineTo(gx + 22, wallTop - 58);
    c.closePath();
    c.fill();
    c.strokeStyle = LEAD_DARK;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(gx - 26, wallTop - 56);
    c.lineTo(gx, wallTop - 78);
    c.lineTo(gx + 26, wallTop - 56);
    c.stroke();
    px(c, GOLD, gx - 2, wallTop - 66, 4, 4);
    px(c, LEAD_DARK, Math.round(gx - (bw + 26) * 0.3), wallTop - 68, Math.round((bw + 26) * 0.6), 3);
    // 屋脊兩端的鬼瓦
    for (const s of [-1, 1]) px(c, '#6e777d', Math.round(gx + s * (bw + 26) * 0.3) - 3, wallTop - 72, 6, 6);
    if (winter) {
      px(c, SNOW, Math.round(gx - (bw + 26) * 0.3), wallTop - 70, Math.round((bw + 26) * 0.6), 3);
      px(c, SNOW, gx - bw / 2 - 10, wallTop - 66 + 14, bw + 20, 2);
    }
  });
}

// ── 徽軫燈籠：兩隻腳一長一短（長腳踩在池裡、短腳踩在岸邊石頭上），上面是很寬的笠 ──
function drawKotoji(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(KZ.kotoji.x * T);
  const by = Math.round(KZ.kotoji.y * T);
  const STONE = '#9a958a';
  const STONE_L = '#b8b2a4';
  const STONE_D = '#77726a';
  // 水裡的倒影
  px(c, 'rgba(30,60,64,0.35)', cx - 10, by + 6, 3, 9);
  // 短腳下的岸石
  c.fillStyle = '#857f72';
  c.beginPath();
  c.ellipse(cx + 8, by + 1, 7, 3, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#a39d90', cx + 3, by - 2, 10, 1);
  // 長腳（斜斜伸到水裡）
  for (let k = 0; k < 22; k += 1) px(c, k % 5 === 0 ? STONE_D : STONE, Math.round(cx - 4 - (k / 22) * 6), by - 16 + k, 3, 1);
  px(c, 'rgba(255,255,255,0.4)', cx - 11, by + 5, 5, 1);
  // 短腳
  for (let k = 0; k < 15; k += 1) px(c, k % 5 === 0 ? STONE_D : STONE, Math.round(cx + 3 + (k / 15) * 4), by - 16 + k, 3, 1);
  // 中台
  px(c, STONE, cx - 9, by - 19, 18, 3);
  px(c, STONE_L, cx - 9, by - 19, 18, 1);
  // 火袋
  px(c, STONE, cx - 5, by - 27, 10, 8);
  px(c, d.night ? '#ffd27a' : '#3e3a34', cx - 3, by - 26, 6, 5);
  px(c, STONE_D, cx - 5, by - 27, 1, 8);
  // 笠：很寬、邊緣微翹
  c.fillStyle = STONE_D;
  c.beginPath();
  c.moveTo(cx - 17, by - 27);
  c.quadraticCurveTo(cx - 8, by - 30, cx - 3, by - 35);
  c.lineTo(cx + 3, by - 35);
  c.quadraticCurveTo(cx + 8, by - 30, cx + 17, by - 27);
  c.lineTo(cx + 15, by - 26);
  c.lineTo(cx - 15, by - 26);
  c.closePath();
  c.fill();
  px(c, STONE_L, cx - 10, by - 30, 20, 1);
  // 寶珠
  px(c, STONE, cx - 2, by - 38, 4, 3);
  px(c, STONE_L, cx - 1, by - 40, 2, 2);
  // 青苔
  for (const [mx, my] of [[-12, -28], [7, -29], [-6, -18], [4, -18], [-7, -8]] as const) px(c, 'rgba(96,140,72,0.8)', cx + mx, by + my, 2, 1);
  if (kzWinter()) {
    c.fillStyle = SNOW;
    c.beginPath();
    c.moveTo(cx - 15, by - 28);
    c.quadraticCurveTo(cx - 8, by - 32, cx - 3, by - 37);
    c.lineTo(cx + 3, by - 37);
    c.quadraticCurveTo(cx + 8, by - 32, cx + 15, by - 28);
    c.closePath();
    c.fill();
    px(c, SNOW, cx - 9, by - 20, 18, 1);
  }
  if (d.night) glow(c, cx, by - 23, 18, '255, 205, 120', 0.6);
}

// ── 唐崎松＋雪吊：枝一層層往池子伸、撐著的支柱、中間的柱子拉下一圈繩子成圓錐 ──
const KARASAKI_PADS: [number, number, number, number][] = [
  [-16, -24, 14, 5],
  [-4, -34, 14, 5],
  [12, -28, 18, 6],
  [30, -22, 20, 5],
  [52, -18, 18, 5],
  [72, -12, 14, 4],
  [22, -42, 14, 5],
  [40, -34, 13, 4],
  [6, -50, 10, 4],
];
function drawKarasaki(c: CanvasRenderingContext2D): void {
  const cx = Math.round(KZ.karasaki.x * T);
  const by = Math.round(KZ.karasaki.line * T);
  const winter = kzWinter();
  px(c, 'rgba(0,0,0,0.22)', cx - 14, by - 1, 30, 3);
  // 支柱（撐住伸到水上的長枝）
  for (const [dx, top, len] of [[50, -16, 30], [70, -10, 28], [28, -20, 26]] as const) {
    px(c, '#8a6a46', cx + dx, by + top, 2, len);
    px(c, '#6a4e32', cx + dx - 2, by + top, 6, 1);
  }
  // 樹幹：往右斜、分出長枝
  c.strokeStyle = '#5e4430';
  c.lineCap = 'round';
  c.lineWidth = 6;
  c.beginPath();
  c.moveTo(cx, by);
  c.quadraticCurveTo(cx + 2, by - 14, cx + 8, by - 26);
  c.stroke();
  c.lineWidth = 3;
  for (const [ex, ey] of [[-16, -24], [30, -22], [52, -18], [72, -12], [22, -42], [6, -50], [40, -34]] as const) {
    c.beginPath();
    c.moveTo(cx + 6, by - 22);
    c.quadraticCurveTo(cx + (ex + 6) / 2, by + Math.min(ey, -22) - 4, cx + ex, by + ey);
    c.stroke();
  }
  c.lineWidth = 1;
  // 枝葉（雲朵一樣扁扁的）
  for (const [dx, dy, rw, rh] of KARASAKI_PADS) {
    c.fillStyle = '#244a2c';
    c.beginPath();
    c.ellipse(cx + dx, by + dy, rw, rh, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#356838';
    c.beginPath();
    c.ellipse(cx + dx, by + dy - 1, rw - 2, rh - 2, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = -rw + 3; k < rw - 3; k += 4) px(c, '#4a8048', cx + dx + k, by + dy - rh + 2, 2, 1);
    if (winter) {
      c.fillStyle = SNOW;
      c.beginPath();
      c.ellipse(cx + dx, by + dy - rh + 1, rw - 2, 2, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  // 雪吊：中間的帆柱、頂上的稻草帽、一圈繩子
  const topX = cx + 22;
  const topY = by - 96;
  px(c, '#a8865a', topX - 1, topY, 2, 70);
  c.strokeStyle = 'rgba(236, 226, 196, 0.85)';
  c.beginPath();
  for (const [dx, dy, rw, rh] of KARASAKI_PADS) {
    for (const f of [-0.85, -0.3, 0.3, 0.85]) {
      c.moveTo(topX, topY + 2);
      c.lineTo(cx + dx + rw * f, by + dy - rh * 0.4);
    }
  }
  c.stroke();
  // 稻草帽（わら帽子）
  c.fillStyle = '#d8b46a';
  c.beginPath();
  c.moveTo(topX - 5, topY + 4);
  c.lineTo(topX, topY - 6);
  c.lineTo(topX + 5, topY + 4);
  c.closePath();
  c.fill();
  px(c, '#b08a46', topX - 5, topY + 3, 10, 1);
}

// 小松＋圓錐形的雪吊（兼六園各處）
function drawYukiPine(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const winter = kzWinter();
  px(c, 'rgba(0,0,0,0.2)', cx - 12, by - 1, 24, 3);
  px(c, '#5e4430', cx - 2, by - 14, 4, 14);
  for (const [dx, dy, rw, rh] of [[0, -16, 13, 5], [-4, -24, 10, 4], [4, -30, 8, 4], [0, -36, 5, 3]] as const) {
    c.fillStyle = '#2a5230';
    c.beginPath();
    c.ellipse(cx + dx, by + dy, rw, rh, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3c6e40';
    c.beginPath();
    c.ellipse(cx + dx, by + dy - 1, rw - 2, Math.max(1, rh - 2), 0, 0, Math.PI * 2);
    c.fill();
    if (winter) px(c, SNOW, cx + dx - rw + 3, by + dy - rh, rw * 2 - 6, 2);
  }
  const topY = by - 52;
  px(c, '#a8865a', cx - 1, topY, 2, 40);
  c.strokeStyle = 'rgba(236, 226, 196, 0.85)';
  c.lineWidth = 1;
  c.beginPath();
  for (let k = -6; k <= 6; k += 1) {
    c.moveTo(cx, topY + 2);
    c.lineTo(cx + k * 2.3, by - 13);
  }
  c.stroke();
  c.fillStyle = '#d8b46a';
  c.beginPath();
  c.moveTo(cx - 4, topY + 3);
  c.lineTo(cx, topY - 4);
  c.lineTo(cx + 4, topY + 3);
  c.closePath();
  c.fill();
}

// 池子的水波、鯉魚、晚上燈籠的倒影
function drawPondWater(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const { cx, cy, rx, ry } = KZ.pond;
  c.save();
  c.beginPath();
  c.ellipse(cx * T, cy * T, rx * T - 1, ry * T - 1, 0, 0, Math.PI * 2);
  c.clip();
  for (let i = 0; i < 30; i += 1) {
    const yy = (cy - ry) * T + 3 + (((i * 29) % 89) / 89) * (ry * 2 * T - 6);
    const xx = (cx - rx) * T + ((i * 97 + d.seconds * (4 + (i % 3) * 2)) % (rx * 2 * T + 20)) - 10;
    px(c, `rgba(220,240,235,${0.22 + 0.15 * Math.sin(d.seconds * 1.2 + i)})`, Math.round(xx), Math.round(yy), 6 + (i % 3) * 3, 1);
  }
  // 鯉魚（慢慢繞圈）
  for (let k = 0; k < 4; k += 1) {
    const a = d.seconds * (0.12 + k * 0.03) + k * 1.7;
    const fx = (cx + Math.cos(a) * (rx - 1.6 - k * 0.6)) * T;
    const fy = (cy + 0.4 + Math.sin(a) * (ry - 1.2)) * T;
    const col = ['#f08a3a', '#f4efe2', '#e04a2a', '#f2c84a'][k] ?? '#f08a3a';
    px(c, col, Math.round(fx) - 3, Math.round(fy), 6, 2);
    px(c, k === 1 ? '#e04a2a' : col, Math.round(fx + (Math.sin(a) > 0 ? -5 : 3)), Math.round(fy), 2, 2);
  }
  if (d.night) {
    // 徽軫燈籠的倒影
    glow(c, KZ.kotoji.x * T - 4, (KZ.kotoji.y + 1.2) * T, 14, '255, 210, 130', 0.45);
    px(c, 'rgba(255,220,150,0.7)', Math.round(KZ.kotoji.x * T - 7), Math.round((KZ.kotoji.y + 1.1) * T), 6, 1);
    // 月亮的倒影
    glow(c, 8 * T, (cy + 1.2) * T, 14, '255, 245, 200', 0.45);
    px(c, 'rgba(255,248,210,0.8)', 8 * T - 4, Math.round((cy + 1.2) * T), 8, 2);
  }
  c.restore();
  // 曲水的流動
  for (let i = 0; i < STREAM.length - 1; i += 1) {
    const [ax, ay] = STREAM[i] ?? [0, 0];
    const [bx, by] = STREAM[i + 1] ?? [0, 0];
    const t = (d.seconds * 0.5 + i * 0.37) % 1;
    px(c, 'rgba(230,250,250,0.55)', Math.round((ax + (bx - ax) * t) * T) - 1, Math.round((ay + (by - ay) * t) * T), 3, 1);
  }
}

// ── 兼六園的茶屋：瓦屋頂、白壁、障子、暖簾 ──
const TH_W = Math.round((KZ.teahouse.x1 - KZ.teahouse.x0) * T);
function teahouseSprite(): HTMLCanvasElement {
  const w = TH_W;
  const h = 64;
  return cached(`kz-teahouse-${kzWinter() ? 'w' : 's'}`, w, h, (c) => {
    eave(c, w / 2, 2, w - 6, 16, TILE, 0.7, 3);
    if (kzWinter()) px(c, SNOW, Math.round(w * 0.15), 1, Math.round(w * 0.7), 3);
    px(c, PLASTER, 4, 18, w - 8, 14);
    px(c, WOOD, 4, 18, w - 8, 2);
    for (let x = 4; x <= w - 8; x += 29) px(c, WOOD, x, 18, 4, h - 18);
    px(c, '#c99a62', w / 2 - 26, 20, 52, 10);
    px(c, '#8a5a32', w / 2 - 26, 20, 52, 1);
    text(c, '兼六園 茶店', w / 2, 25.5, '#3a2414', `900 6px ${SERIF_TC}`);
    px(c, TILE, 0, 32, w, 4);
    px(c, TILE_DARK, 0, 35, w, 1);
    // 障子
    px(c, '#4a3222', 6, 36, w - 12, h - 39);
    for (const x0 of [8, w - 38]) {
      px(c, '#f4eedc', x0, 38, 30, h - 44);
      for (let x = x0; x < x0 + 30; x += 6) px(c, '#8a6a4a', x, 38, 1, h - 44);
      for (let y = 38; y < h - 6; y += 6) px(c, '#8a6a4a', x0, y, 30, 1);
    }
    // 暖簾、店裡的抹茶
    px(c, '#2a1a14', w / 2 - 18, 36, 36, h - 39);
    px(c, '#e8d8b0', w / 2 - 14, 48, 28, 6);
    px(c, '#4f8a3c', w / 2 - 8, 46, 4, 2);
    px(c, '#4f8a3c', w / 2 + 4, 46, 4, 2);
    px(c, '#2f5d3a', w / 2 - 18, 36, 36, 10);
    for (let k = w / 2 - 12; k < w / 2 + 18; k += 6) px(c, 'rgba(0,0,0,0.3)', k, 38, 1, 8);
    text(c, '抹茶', w / 2, 41, '#f4efe2', `900 6px ${SERIF_TC}`);
    px(c, '#9a948a', 2, h - 3, w - 4, 3);
  });
}
function drawTeahouse(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = KZ.teahouse.x0 * T;
  const by = KZ.teahouse.line * T;
  blit(c, teahouseSprite(), x0, by);
  drawLantern(c, x0 + 10, by - 30, '#f4efe2', d.night);
  drawLantern(c, x0 + TH_W - 10, by - 30, '#f4efe2', d.night);
}

// 野點傘（紅傘）：撐在緣台後面
function drawUmbrella(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, '#6b4428', cx - 1, by - 44, 2, 44);
  c.fillStyle = '#d23a2a';
  c.beginPath();
  c.moveTo(cx - 28, by - 36);
  c.quadraticCurveTo(cx, by - 56, cx + 28, by - 36);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.22)';
  c.lineWidth = 1;
  for (let k = -2; k <= 2; k += 1) {
    c.beginPath();
    c.moveTo(cx, by - 49);
    c.lineTo(cx + k * 13, by - 36);
    c.stroke();
  }
  px(c, '#2a1a14', cx - 1, by - 51, 2, 3);
  if (kzWinter()) {
    c.fillStyle = SNOW;
    c.beginPath();
    c.moveTo(cx - 20, by - 41);
    c.quadraticCurveTo(cx, by - 57, cx + 20, by - 41);
    c.quadraticCurveTo(cx, by - 51, cx - 20, by - 41);
    c.fill();
  }
}

// ── 東茶屋街的茶屋：黑瓦、二樓高高的格子窗或簾子、一樓紅殼色的木蟲籠格子、暖簾 ──
const CHAYA_H = 84;
function chayaSprite(kind: ChayaKind, w: number): HTMLCanvasElement {
  const h = CHAYA_H;
  return cached(`kz-chaya-${kind}-${kzWinter() ? 'w' : 's'}`, w, h, (c) => {
    const kin = kind === 'kinpaku';
    const dark = kind === 'bocha' || kind === 'sake';
    const frame = dark ? '#4a2a1c' : '#6a3420';
    const slat = dark ? '#7a4a2e' : BENGARA;
    // 屋頂（黑色釉瓦，亮亮的）
    eave(c, w / 2, 2, w - 2, 13, KAWARA, 0.86, 2, '#1a1b1e');
    px(c, 'rgba(255,255,255,0.22)', 4, 6, w - 8, 1);
    if (kzWinter()) px(c, SNOW, 3, 1, w - 6, 3);
    // 二樓
    px(c, frame, 2, 15, w - 4, 30);
    px(c, PLASTER, 3, 15, w - 6, 3);
    const sudare = kind === 'tea' || kind === 'kogei';
    if (sudare) {
      // 簾子（すだれ）
      px(c, '#c9a86a', 7, 20, w - 14, 21);
      for (let y = 21; y < 41; y += 2) px(c, '#a8864a', 7, y, w - 14, 1);
      px(c, 'rgba(255,220,150,0.25)', 7, 34, w - 14, 7);
    } else {
      // 二樓的格子窗
      px(c, '#2a1810', 7, 20, w - 14, 21);
      for (let x = 7; x < w - 7; x += 2) px(c, slat, x, 20, 1, 21);
      px(c, frame, 7, 30, w - 14, 1);
    }
    px(c, frame, 2, 41, w - 4, 3);
    // 一樓的庇（小屋頂）
    px(c, KAWARA, 0, 44, w, 5);
    px(c, 'rgba(255,255,255,0.18)', 0, 44, w, 1);
    px(c, '#1a1b1e', 0, 48, w, 1);
    if (kzWinter()) px(c, SNOW, 0, 43, w, 2);
    // 一樓：木蟲籠格子（細細的紅殼色直條）
    px(c, '#2a1810', 2, 49, w - 4, h - 52);
    for (let x = 3; x < w - 3; x += 2) px(c, slat, x, 50, 1, h - 54);
    px(c, frame, 2, 49, w - 4, 2);
    px(c, frame, 2, h - 6, w - 4, 3);
    for (const x of [2, w - 5]) px(c, frame, x, 15, 3, h - 18);
    // 入口、暖簾
    const dw = 22;
    const dx = Math.round(w / 2 - dw / 2 + (kin ? 6 : 0));
    px(c, '#1c120c', dx, 51, dw, h - 54);
    px(c, kin ? '#fbe6a0' : '#f2dcae', dx + 3, 64, dw - 6, h - 68);
    const noren = { tea: '#3a3a5a', kanmi: '#2f5d3a', kinpaku: '#1f1a16', bocha: '#7a3a22', kogei: '#2a4a6a', sake: '#3a2a1e' }[kind];
    const mark = { tea: '茶屋', kanmi: '甘味', kinpaku: '金箔', bocha: '棒茶', kogei: '九谷', sake: '酒' }[kind];
    px(c, noren, dx, 51, dw, 12);
    for (let k = dx + 5; k < dx + dw; k += 5) px(c, 'rgba(0,0,0,0.3)', k, 53, 1, 10);
    text(c, mark, dx + dw / 2, 57, kin ? GOLD_LIGHT : '#f4efe2', `900 6px ${SERIF_TC}`);
    // 掛在二樓的木招牌
    const sign = { tea: 'お茶屋', kanmi: '甘味処', kinpaku: '金箔屋', bocha: '加賀棒茶', kogei: '九谷焼', sake: '地酒' }[kind];
    const sw = sign.length * 7 + 8;
    px(c, kin ? '#1f1a16' : '#c99a62', w / 2 - sw / 2, 32, sw, 9);
    px(c, kin ? GOLD : '#8a5a32', w / 2 - sw / 2, 32, sw, 1);
    text(c, sign, w / 2, 36.5, kin ? GOLD_LIGHT : '#3a2414', `900 6px ${SERIF_TC}`);
    if (kin) {
      // 金箔霜淇淋的大模型（整片金箔包住）
      const mx = 9;
      px(c, '#b07a3e', mx - 2, h - 18, 6, 12);
      for (let k = 0; k < 6; k += 1) px(c, '#8a5a2a', mx - 2 + (k % 2) * 3, h - 18 + k * 2, 3, 1);
      c.fillStyle = GOLD;
      c.beginPath();
      c.moveTo(mx - 5, h - 18);
      c.quadraticCurveTo(mx - 6, h - 26, mx + 1, h - 30);
      c.quadraticCurveTo(mx + 2, h - 34, mx + 1, h - 36);
      c.quadraticCurveTo(mx + 7, h - 28, mx + 8, h - 18);
      c.closePath();
      c.fill();
      px(c, GOLD_LIGHT, mx - 3, h - 26, 2, 7);
      px(c, GOLD_LIGHT, mx, h - 32, 2, 3);
      px(c, '#b8861a', mx - 4, h - 21, 11, 1);
      px(c, '#b8861a', mx - 3, h - 27, 9, 1);
    }
    if (kind === 'sake') {
      // 杉玉（新酒的杉葉球）
      px(c, '#3a2a1e', w - 13, 49, 1, 3);
      c.fillStyle = '#5a6a32';
      c.beginPath();
      c.arc(w - 13, 57, 6, 0, Math.PI * 2);
      c.fill();
      px(c, '#6e7e40', w - 16, 54, 3, 2);
    }
    px(c, '#8f897c', 0, h - 3, w, 3);
  });
}
function drawChaya(c: CanvasRenderingContext2D, b: (typeof CHAYA_ROW)[number], d: DrawCtx): void {
  const w = Math.round((b.x1 - b.x0) * T);
  const by = Math.round(KZ.chaya.line * T);
  const x0 = Math.round(b.x0 * T);
  blit(c, chayaSprite(b.kind, w), x0, by);
  if (d.night) {
    // 格子後面透出來的燈（二樓的窗、一樓的木蟲籠）
    px(c, 'rgba(255, 196, 110, 0.5)', x0 + 7, by - CHAYA_H + 20, w - 14, 21);
    px(c, 'rgba(255, 186, 100, 0.35)', x0 + 3, by - CHAYA_H + 50, w - 6, CHAYA_H - 54);
  }
  px(c, 'rgba(0,0,0,0.15)', x0, by, w, 2);
}

// ── 近江町市場：拱頂的屋頂、中間的入口招牌、攤子（螃蟹、鮮魚、海鮮丼、青果、乾貨）──
const MK_W = Math.round((KZ.market.x1 - KZ.market.x0) * T);
const MK_H = 80;
const mkX = (x: number): number => Math.round((x - KZ.market.x0) * T);
function crab(c: CanvasRenderingContext2D, x: number, y: number, col = '#d8402a'): void {
  for (let k = -2; k <= 2; k += 1) {
    px(c, col, x + k * 2 - 1, y + 2, 1, 2);
  }
  px(c, col, x - 6, y + 1, 2, 1);
  px(c, col, x + 5, y + 1, 2, 1);
  px(c, col, x - 7, y - 1, 2, 2);
  px(c, col, x + 6, y - 1, 2, 2);
  px(c, col, x - 4, y - 1, 9, 3);
  px(c, 'rgba(255,255,255,0.35)', x - 3, y - 1, 5, 1);
}
function marketSprite(): HTMLCanvasElement {
  const w = MK_W;
  const h = MK_H;
  return cached(`kz-market-${kzWinter() ? 'w' : 's'}`, w, h, (c) => {
    const rand = seeded(1721);
    // 拱頂的採光屋頂（半透明）、鐵骨
    c.fillStyle = '#9fb4b0';
    c.beginPath();
    c.moveTo(0, 22);
    c.quadraticCurveTo(w / 2, -6, w, 22);
    c.closePath();
    c.fill();
    c.fillStyle = 'rgba(220,235,232,0.6)';
    c.beginPath();
    c.moveTo(4, 20);
    c.quadraticCurveTo(w / 2, -2, w - 4, 20);
    c.lineTo(w - 4, 22);
    c.lineTo(4, 22);
    c.closePath();
    c.fill();
    for (let x = 6; x < w; x += 14) px(c, '#6e7e7c', x, 4 + Math.round(Math.abs(x - w / 2) / (w / 2)) * 12, 1, 18);
    if (kzWinter()) {
      c.strokeStyle = SNOW;
      c.lineWidth = 3;
      c.beginPath();
      c.moveTo(4, 20);
      c.quadraticCurveTo(w / 2, -6, w - 4, 20);
      c.stroke();
      c.lineWidth = 1;
    }
    // 招牌帶
    px(c, '#3a4048', 0, 22, w, 10);
    px(c, '#5a626c', 0, 22, w, 1);
    // 攤子
    const stall = (x0t: number, x1t: number, sign: string, signCol: string, awning: string) => {
      const x0 = mkX(x0t);
      const x1 = mkX(x1t);
      px(c, '#2a2622', x0, 32, x1 - x0, h - 32);
      px(c, signCol, x0 + 3, 23, x1 - x0 - 6, 8);
      text(c, sign, (x0 + x1) / 2, 27.5, '#ffffff', `900 6px ${FONT_TC}`, 'center', x1 - x0 - 10);
      for (let x = x0; x < x1; x += 6) px(c, (x - x0) % 12 === 0 ? awning : '#f4f1e8', x, 32, Math.min(6, x1 - x), 5);
      px(c, 'rgba(0,0,0,0.25)', x0, 37, x1 - x0, 1);
      for (let x = x0 + 8; x < x1 - 4; x += 18) {
        px(c, '#3a3a3a', x, 37, 1, 3);
        px(c, '#fff2c0', x - 1, 40, 3, 3);
      }
      return { x0, x1 };
    };
    // 螃蟹（香箱蟹、松葉蟹）
    {
      const { x0, x1 } = stall(28.4, 33.4, 'かに 蟹', '#c8402a', '#c8402a');
      px(c, '#f2f4f6', x0 + 2, h - 24, x1 - x0 - 4, 21);
      for (let k = 0; k < 4; k += 1) {
        const bx = x0 + 4 + k * 19;
        px(c, '#ffffff', bx, h - 22, 16, 10);
        px(c, '#cfd6dc', bx, h - 13, 16, 1);
        crab(c, bx + 8, h - 18, k % 2 ? '#e0562e' : '#c8402a');
      }
      for (let k = 0; k < 5; k += 1) crab(c, x0 + 8 + k * 15, h - 7, '#d8482a');
      px(c, '#f6e27a', x0 + 6, h - 30, 14, 5);
      text(c, '香箱', x0 + 13, h - 27.5, '#c8402a', `900 4px ${FONT_TC}`);
    }
    // 鮮魚（冰上的魚、鮪魚塊、甜蝦）
    {
      const { x0, x1 } = stall(33.4, 37.8, '鮮魚', '#1f5fa8', '#1f5fa8');
      px(c, '#e8f2f6', x0 + 2, h - 20, x1 - x0 - 4, 17);
      for (let k = 0; k < 6; k += 1) {
        const fx = x0 + 5 + k * 11;
        px(c, '#9aa8b4', fx, h - 17, 9, 3);
        px(c, '#c8d2da', fx, h - 17, 9, 1);
        px(c, '#6a7884', fx + 8, h - 18, 2, 5);
      }
      px(c, '#b8283a', x0 + 6, h - 11, 14, 6);
      px(c, '#e05a6a', x0 + 6, h - 11, 14, 1);
      for (let k = 0; k < 8; k += 1) px(c, '#f08a7a', x0 + 26 + k * 4, h - 9, 3, 2);
      for (let k = 0; k < 3; k += 1) px(c, '#3a7ad8', x0 + 4 + k * 22, h - 28, 12, 7);
    }
    // 中間的入口（市場裡面的通道，吊著招牌）
    {
      const x0 = mkX(37.8);
      const x1 = mkX(42.2);
      const mx = (x0 + x1) / 2;
      px(c, '#1e1c1a', x0, 22, x1 - x0, h - 22);
      for (let k = 0; k < 4; k += 1) {
        const y = 34 + k * 9;
        const inset = k * 6;
        px(c, '#3a3632', x0 + inset, y, x1 - x0 - inset * 2, 1);
        px(c, ['#c8402a', '#1f5fa8', '#e8b02a', '#2a7a46'][k] ?? '#c8402a', x0 + 6 + inset, y + 1, 8, 4);
        px(c, ['#2a7a46', '#c8402a', '#1f5fa8', '#e8b02a'][k] ?? '#2a7a46', x1 - 14 - inset, y + 1, 8, 4);
      }
      px(c, '#fff2c0', mx - 2, 58, 4, 3);
      // 大招牌
      px(c, '#1f2a44', x0 - 6, 10, x1 - x0 + 12, 16);
      px(c, GOLD, x0 - 6, 10, x1 - x0 + 12, 1);
      px(c, GOLD, x0 - 6, 25, x1 - x0 + 12, 1);
      text(c, '近江町市場', mx, 18, '#ffffff', `900 9px ${SERIF_TC}`, 'center', x1 - x0 + 8);
      px(c, '#9a948a', x0, h - 3, x1 - x0, 3);
    }
    // 海鮮丼的店（深藍暖簾、照片菜單、吧台）
    {
      const { x0, x1 } = stall(42.2, 48.4, '海鮮丼', '#1f2a44', '#1f2a44');
      px(c, '#4a3222', x0 + 2, 43, x1 - x0 - 4, h - 46);
      px(c, '#f2e6c8', x0 + 6, 45, x1 - x0 - 12, 12);
      for (let k = 0; k < 5; k += 1) {
        const mx2 = x0 + 9 + k * 17;
        px(c, '#f4efe2', mx2, 47, 13, 8);
        px(c, ['#e8582a', '#f2c84a', '#d82a3a', '#e8902a', '#c8402a'][k] ?? '#e8582a', mx2 + 2, 48, 9, 3);
        px(c, '#f4efe2', mx2 + 3, 51, 7, 2);
      }
      // 師傅
      px(c, '#f4f4f4', x0 + 60, 58, 10, 8);
      px(c, '#f2c8a0', x0 + 62, 53, 6, 5);
      px(c, '#f4f4f4', x0 + 61, 51, 8, 2);
      // 吧台
      px(c, '#c99a62', x0, h - 15, x1 - x0, 4);
      px(c, '#e0b884', x0, h - 15, x1 - x0, 1);
      px(c, '#8a5a32', x0, h - 11, x1 - x0, 8);
      for (let k = 0; k < 5; k += 1) {
        const bx = x0 + 8 + k * 18;
        px(c, '#1f1a16', bx, h - 19, 9, 4);
        px(c, '#e8582a', bx + 1, h - 20, 3, 1);
        px(c, '#f2c84a', bx + 4, h - 20, 2, 1);
        px(c, '#d82a3a', bx + 6, h - 20, 2, 1);
      }
      text(c, '丼', x1 - 8, h - 7, '#f4efe2', `900 6px ${SERIF_TC}`);
    }
    // 青果
    {
      const { x0 } = stall(48.4, 52, '青果', '#2a7a46', '#2a7a46');
      for (let k = 0; k < 6; k += 1) {
        const bx = x0 + 3 + (k % 3) * 18;
        const by2 = h - 22 + Math.floor(k / 3) * 9;
        px(c, '#8a6a42', bx, by2, 16, 8);
        for (let j = 0; j < 5; j += 1) px(c, ['#e8902a', '#7aaa3a', '#d83a2a', '#f2d24a', '#5a8a2a', '#e86a2a'][k] ?? '#e8902a', bx + 1 + j * 3, by2 - 2 + (j % 2), 3, 3);
      }
    }
    // 乾貨（一夜干、のどぐろ）
    {
      const { x0, x1 } = stall(52, 55.6, '干物', '#8a5a2a', '#8a5a2a');
      px(c, '#4a3a2e', x0 + 2, 44, x1 - x0 - 4, 1);
      for (let k = 0; k < 5; k += 1) {
        const fx = x0 + 4 + k * 10;
        px(c, '#c88a5a', fx, 45, 7, 12);
        px(c, '#e0a878', fx + 1, 46, 5, 9);
      }
      px(c, '#c99a62', x0 + 2, h - 14, x1 - x0 - 4, 11);
      for (let k = 0; k < 6; k += 1) px(c, rand() < 0.5 ? '#d8402a' : '#e8a050', x0 + 5 + k * 8, h - 16, 6, 3);
    }
    px(c, '#9a948a', 0, h - 3, w, 3);
  });
}

// ── JR 金澤站：站房（玻璃帷幕）＋玻璃穹頂もてなしドーム＋鼓門 ──
const ST_W = Math.round((KZ.station.x1 - KZ.station.x0) * T);
const ST_H = 70;
function stationSprite(): HTMLCanvasElement {
  const w = ST_W;
  const h = ST_H;
  return cached('kz-station', w, h, (c) => {
    px(c, '#d6dade', 0, 0, w, h);
    px(c, '#eef0f2', 0, 0, w, 3);
    for (let y = 8; y < h - 20; y += 8) for (let x = 6; x < w - 6; x += 10) px(c, (x + y) % 3 ? '#5f7e98' : '#7192ac', x, y, 8, 6);
    px(c, '#2a3a4a', 0, h - 18, w, 18);
    for (let x = 6; x < w - 8; x += 14) px(c, '#9fd8ff', x, h - 16, 10, 14);
    // 站名
    px(c, '#f4f6f8', w / 2 - 50, 6, 100, 13);
    px(c, '#1f6fd0', w / 2 - 48, 8, 12, 9);
    text(c, 'JR', w / 2 - 42, 12.5, '#ffffff', `900 6px ${FONT_TC}`);
    text(c, '金沢駅', w / 2 - 14, 12.5, '#1f2a44', `900 8px ${SERIF_TC}`);
    text(c, 'KANAZAWA', w / 2 + 28, 12.5, '#1f2a44', `700 6px ${FONT_TC}`);
  });
}

// 穹頂：鋁框＋玻璃，三角形的格子；畫在站房前面、人走在它下面
const DOME_H = 132;
function drawDome(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = KZ.dome.x0 * T;
  const x1 = KZ.dome.x1 * T;
  const base = KZ.dome.front * T;
  const mid = (x0 + x1) / 2;
  const half = (x1 - x0) / 2;
  const arch = (k: number) => {
    c.beginPath();
    c.moveTo(x0, base);
    c.bezierCurveTo(x0, base - DOME_H * 1.05 * k, mid - half * 0.55, base - DOME_H * k * 1.33, mid, base - DOME_H * k * 1.33);
    c.bezierCurveTo(mid + half * 0.55, base - DOME_H * k * 1.33, x1, base - DOME_H * 1.05 * k, x1, base);
  };
  c.save();
  arch(0.75);
  c.closePath();
  c.fillStyle = d.night ? 'rgba(200, 220, 255, 0.28)' : 'rgba(190, 222, 238, 0.32)';
  c.fill();
  c.clip();
  // 三角形格子：斜線兩個方向＋橫的弧
  c.strokeStyle = d.night ? 'rgba(235, 240, 255, 0.75)' : 'rgba(236, 242, 246, 0.85)';
  c.lineWidth = 1;
  c.beginPath();
  for (let x = x0 - DOME_H; x < x1 + DOME_H; x += 14) {
    c.moveTo(x, base);
    c.lineTo(x + DOME_H, base - DOME_H);
    c.moveTo(x, base);
    c.lineTo(x - DOME_H, base - DOME_H);
  }
  c.stroke();
  for (let k = 0.2; k < 0.75; k += 0.11) {
    arch(k);
    c.stroke();
  }
  if (d.night) glow(c, mid, base - 50, 160, '190, 210, 255', 0.35);
  c.restore();
  // 外框（粗的鋁框）
  c.strokeStyle = '#eef2f4';
  c.lineWidth = 3;
  arch(0.75);
  c.stroke();
  c.strokeStyle = '#9aa6ae';
  c.lineWidth = 1;
  arch(0.73);
  c.stroke();
  // 兩端的腳
  for (const x of [x0, x1 - 6]) {
    px(c, '#c8d0d6', x, base - 10, 6, 10);
    px(c, '#7e8a92', x, base - 1, 6, 2);
  }
}

// 鼓門：兩根用木條扭成螺旋的鼓形柱子，上面撐著木頭的屋頂
const GT_HALF = KZ.gate.half * T;
const GT_W = Math.round(GT_HALF * 2 + 60);
const GT_H = 126;
function gateSprite(): HTMLCanvasElement {
  const w = GT_W;
  const h = GT_H;
  return cached('kz-gate', w, h, (c) => {
    const cx = w / 2;
    const pilH = 92;
    const woods = ['#c08a52', '#a8743e', '#d4a066', '#8e5e30'];
    for (const s of [-1, 1]) {
      const px0 = cx + s * GT_HALF;
      for (let y = 0; y < pilH; y += 1) {
        const t = y / pilH;
        // 鼓的形狀：上下寬、中間細
        const half = 7 + 8 * Math.pow(Math.abs(t * 2 - 1), 1.6);
        for (let x = -half; x < half; x += 1) {
          // 螺旋：斜條紋，左右兩根方向相反
          const band = Math.floor((x * s + y * 0.9 + 400) / 3) % 4;
          let col = woods[band] ?? '#a8743e';
          if (x < -half + 2) col = '#6e4624';
          else if (x > half - 3) col = '#7e5228';
          px(c, col, Math.round(px0 + x), h - pilH + y, 1, 1);
        }
      }
      // 石的底座
      px(c, '#8a857c', px0 - 17, h - 5, 34, 5);
      px(c, '#a8a296', px0 - 17, h - 5, 34, 1);
    }
    // 屋頂：木頭的大梁＋低低的切妻，木條的格子
    const top = h - pilH - 26;
    px(c, '#7e5228', 4, h - pilH - 6, w - 8, 7);
    px(c, '#a8743e', 4, h - pilH - 6, w - 8, 1);
    c.fillStyle = '#9a6a3a';
    c.beginPath();
    c.moveTo(0, h - pilH - 4);
    c.lineTo(cx, top);
    c.lineTo(w, h - pilH - 4);
    c.lineTo(w - 6, h - pilH - 4);
    c.lineTo(cx, top + 8);
    c.lineTo(6, h - pilH - 4);
    c.closePath();
    c.fill();
    c.fillStyle = '#c08a52';
    c.beginPath();
    c.moveTo(6, h - pilH - 5);
    c.lineTo(cx, top + 8);
    c.lineTo(w - 6, h - pilH - 5);
    c.closePath();
    c.fill();
    c.strokeStyle = '#8e5e30';
    c.lineWidth = 1;
    c.beginPath();
    for (let x = 10; x < w - 6; x += 5) {
      const yTop = top + 8 + (Math.abs(x - cx) / cx) * (h - pilH - 13 - top - 8);
      c.moveTo(x + 0.5, yTop);
      c.lineTo(x + 0.5, h - pilH - 5);
    }
    c.stroke();
    px(c, '#6e4624', cx - 2, top - 1, 4, 3);
  });
}
function drawGate(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = KZ.gate.cx * T;
  const by = KZ.gate.line * T;
  if (d.night) {
    for (const s of [-1, 1]) glow(c, cx + s * GT_HALF, by - 50, 46, '255, 190, 110', 0.4);
    glow(c, cx, by - 104, 70, '255, 200, 130', 0.3);
  }
  blit(c, gateSprite(), cx - GT_W / 2, by);
}

// ── 站前的其他房子：飯店、金澤咖哩、商場 ──
function buildingSprite(key: string, w: number, h: number, wall: string, glass: string, sign?: { word: string; color: string }): HTMLCanvasElement {
  return cached(`kz-bld-${key}`, w, h, (c) => {
    px(c, wall, 0, 0, w, h);
    px(c, 'rgba(255,255,255,0.3)', 0, 0, w, 2);
    for (let y = 8; y < h - 22; y += 9) for (let x = 6; x < w - 8; x += 11) px(c, glass, x, y, 7, 6);
    px(c, '#2a3a4a', 4, h - 18, w - 8, 18);
    for (let x = 8; x < w - 12; x += 12) px(c, '#9fd8ff', x, h - 16, 8, 14);
    if (sign) {
      px(c, sign.color, 4, h - 26, w - 8, 8);
      text(c, sign.word, w / 2, h - 22, '#ffffff', `900 6px ${FONT_TC}`, 'center', w - 12);
    }
  });
}
function currySprite(): HTMLCanvasElement {
  const w = Math.round((KZ.curry.x1 - KZ.curry.x0) * T);
  const h = 62;
  return cached('kz-curry', w, h, (c) => {
    px(c, '#ece6d6', 0, 6, w, h - 6);
    px(c, '#c8a020', 0, 0, w, 8);
    px(c, '#2a2a2e', 0, 8, w, 14);
    text(c, '金沢カレー', w / 2, 15, '#f6d23a', `900 8px ${FONT_TC}`, 'center', w - 8);
    // 不鏽鋼盤的招牌圖：黑咖哩、豬排、高麗菜絲
    c.fillStyle = '#c8ccd2';
    c.beginPath();
    c.ellipse(w / 2, 32, 22, 7, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#3a2416';
    c.beginPath();
    c.ellipse(w / 2 - 4, 32, 14, 5, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#d89a4a', w / 2 - 12, 29, 14, 4);
    for (let k = 0; k < 4; k += 1) px(c, '#3a2416', w / 2 - 10 + k * 4, 29, 1, 4);
    px(c, '#b8e07a', w / 2 + 8, 29, 8, 5);
    px(c, '#f4f4f4', w / 2 - 2, 30, 6, 2);
    // 門口
    px(c, '#2a3a4a', 6, h - 22, w - 12, 22);
    px(c, '#f6dfae', 10, h - 18, w - 20, 16);
    px(c, '#c8a020', 6, h - 24, w - 12, 4);
    for (let x = 6; x < w - 6; x += 8) px(c, (x / 8) % 2 ? '#f4f1e8' : '#c8a020', x, h - 24, 8, 4);
    px(c, '#3a2416', w / 2 - 8, h - 12, 16, 3);
  });
}

// ── 座位：茶屋的緣台、茶屋街的緣台、市場吧台的椅子 ──
function drawEndai(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 10, by + 1, 20, 2);
  px(c, '#d23a2a', cx - 10, by - 5, 20, 4);
  px(c, '#e8584a', cx - 10, by - 5, 20, 1);
  px(c, '#6b4428', cx - 9, by - 1, 2, 3);
  px(c, '#6b4428', cx + 7, by - 1, 2, 3);
}
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = KANAZAWA_SEATS[i];
  if (!s) return;
  if (i >= 4 && i < 10) drawEndai(c, s.x, s.y);
  if (i >= 10) drawStool(c, s.x, s.y, '#8a5a32');
}

// 海鮮丼店門口的吧台（坐在椅子上面向吧台）
function drawCounter(c: CanvasRenderingContext2D): void {
  const x0 = Math.round((COUNTER_X[0]! - 0.9) * T);
  const x1 = Math.round((COUNTER_X[1]! + 0.9) * T);
  const by = Math.round((COUNTER_Y - 0.35) * T);
  px(c, 'rgba(0,0,0,0.2)', x0, by, x1 - x0, 3);
  px(c, '#8a5a32', x0 + 2, by - 10, x1 - x0 - 4, 10);
  for (let x = x0 + 4; x < x1 - 4; x += 5) px(c, '#7a4e2a', x, by - 9, 1, 9);
  px(c, '#c99a62', x0, by - 13, x1 - x0, 3);
  px(c, '#e0b884', x0, by - 13, x1 - x0, 1);
  // 吧台上的丼和茶杯
  for (const sx of COUNTER_X) {
    const bx = Math.round(sx * T);
    px(c, '#1f1a16', bx - 5, by - 17, 10, 4);
    px(c, '#e8582a', bx - 4, by - 18, 3, 1);
    px(c, '#f2c84a', bx - 1, by - 18, 2, 1);
    px(c, '#d82a3a', bx + 1, by - 18, 3, 1);
    px(c, '#e8e2d2', bx + 6, by - 16, 3, 3);
  }
}

// 下雪（冬天）
function drawSnowfall(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!kzWinter()) return;
  const W = KZ.W * T + 20;
  const H = KZ.H * T + 10;
  for (let i = 0; i < 240; i += 1) {
    const fall = 14 + (i % 5) * 5;
    const y = ((i * 89.3 + d.seconds * fall) % H) - 5;
    const x = ((((i * 131.7 + d.seconds * (4 + (i % 3) * 3) + Math.sin(d.seconds * 0.8 + i) * 8) % W) + W) % W) - 10;
    const big = i % 4 === 0;
    px(c, `rgba(255,255,255,${big ? 0.95 : 0.75})`, Math.round(x), Math.round(y), big ? 2 : 1, big ? 2 : 1);
  }
}

// 淺野川的水流
function drawRiver(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const rv = KZ.river;
  const x0 = rv.x0 * T;
  const w = KZ.W * T - x0;
  c.save();
  c.beginPath();
  c.rect(x0, rv.y0 * T, w, (rv.y1 - rv.y0) * T);
  c.clip();
  for (let i = 0; i < 34; i += 1) {
    const yy = rv.y0 * T + 4 + (((i * 37) % 97) / 97) * ((rv.y1 - rv.y0) * T - 8);
    const xx = x0 + ((i * 113 + d.seconds * (10 + (i % 4) * 4)) % (w + 30)) - 15;
    px(c, `rgba(230,245,250,${0.25 + 0.15 * Math.sin(d.seconds + i)})`, Math.round(xx), Math.round(yy), 5 + (i % 3) * 3, 1);
  }
  c.restore();
}

// 柳樹（河邊）
function drawRiverWillow(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const winter = kzWinter();
  px(c, 'rgba(0,0,0,0.2)', cx - 10, by - 1, 20, 3);
  px(c, '#5c4632', cx - 2, by - 26, 4, 26);
  c.fillStyle = winter ? '#a8b090' : '#7ab05a';
  c.beginPath();
  c.ellipse(cx, by - 30, 14, 8, 0, 0, Math.PI * 2);
  c.fill();
  const sway = Math.sin(seconds * 0.9 + x) * 1.5;
  for (let k = -12; k <= 12; k += 3) {
    const len = 14 + (((k * 7) % 5) + 5);
    px(c, winter ? (k % 2 ? '#b8c0a0' : '#98a080') : k % 2 ? '#8cc46a' : '#6aa04e', Math.round(cx + k + sway), by - 30, 2, len);
  }
}

const CHAYA_LANTERNS = CHAYA_ROW.flatMap((b) => [b.x0 + 0.5, b.x1 - 0.5]);
const STONE_LANTERNS: [number, number][] = [[6.2, 12.4], [21.2, 23.4], [2.8, 24.6], [17.6, 12.4]];
const YUKI_PINES: [number, number][] = [[3.4, 11.6], [14.4, 11.2], [25.2, 21.2], [0.9, 28.4], [12.6, 28.2], [24.6, 15.4]];
const MAPLES: [number, number][] = [[9.6, 11.4], [22.6, 11.0], [5.2, 26.6], [17, 26.8], [25.4, 25.2], [21.2, 19.8]];
const WILLOWS: [number, number][] = [[31.2, 21.6], [37.4, 21.6], [46, 21.6], [52.6, 21.6]];
const LAMPS: [number, number][] = [[2.4, 31], [14.6, 31], [26.2, 31], [35.6, 31], [49.6, 31], [53.4, 31], [2.6, 45.4], [15.4, 45.4], [40.4, 45.4], [53.2, 45.4], [29, 23.8], [53.6, 23.8]];
const STREET_TREES: [number, number][] = [[3, 35], [8.6, 35], [20, 35], [26, 35], [32, 35], [37.4, 35], [52, 35]];
const westW = Math.round((KZ.westRow.x1 - KZ.westRow.x0) * T);
const mallW = Math.round((KZ.mall.x1 - KZ.mall.x0) * T);

const props: CityProp[] = [
  { y: 0.1, draw: (c, d) => drawPondWater(c, d) },
  { y: 0.2, draw: (c, d) => drawRiver(c, d) },
  { y: KZ.castle.line, draw: (c) => blit(c, castleSprite(), KZ.castle.x0 * T, KZ.castle.line * T) },
  { y: KZ.kotoji.y, draw: (c, d) => drawKotoji(c, d) },
  { y: KZ.karasaki.line, draw: (c) => drawKarasaki(c) },
  { y: KZ.teahouse.line, draw: (c, d) => drawTeahouse(c, d) },
  { y: TEA_BENCH_Y + 0.05, draw: (c) => drawUmbrella(c, TEA_BENCH, TEA_BENCH_Y) },
  ...POND_BENCHES.map((x): CityProp => ({ y: POND_BENCH_Y - 0.01, draw: (c) => drawStoneBench(c, x, POND_BENCH_Y, 2.6) })),
  ...CHAYA_ROW.map((b): CityProp => ({ y: KZ.chaya.line, draw: (c, d) => drawChaya(c, b, d) })),
  ...CHAYA_LANTERNS.map((x): CityProp => ({ y: KZ.chaya.line + 0.01, draw: (c, d) => drawLantern(c, Math.round(x * T), KZ.chaya.line * T - 34, '#f4efe2', d.night) })),
  ...CHAYA_BENCHES.map((x): CityProp => ({ y: CHAYA_BENCH_Y + 0.05, draw: (c) => drawUmbrella(c, x, CHAYA_BENCH_Y) })),
  { y: KZ.market.line, draw: (c) => blit(c, marketSprite(), KZ.market.x0 * T, KZ.market.line * T) },
  { y: COUNTER_Y - 0.35, draw: (c) => drawCounter(c) },
  { y: KZ.rowLine, draw: (c) => blit(c, stationSprite(), KZ.station.x0 * T, KZ.rowLine * T) },
  { y: KZ.rowLine, draw: (c) => blit(c, buildingSprite('hotel', westW, 84, '#e6e2da', '#6b8ca6', { word: 'HOTEL 金沢', color: '#3a4a6a' }), KZ.westRow.x0 * T, KZ.rowLine * T) },
  { y: KZ.rowLine, draw: (c) => blit(c, currySprite(), KZ.curry.x0 * T, KZ.rowLine * T) },
  { y: KZ.rowLine, draw: (c) => blit(c, buildingSprite('mall', mallW, 80, '#c9cfd6', '#4f657c', { word: 'おみやげ 金沢百番', color: '#8a2a2a' }), KZ.mall.x0 * T, KZ.rowLine * T) },
  { y: KZ.rowLine + 0.05, draw: (c, d) => drawDome(c, d) },
  { y: KZ.gate.line, draw: (c, d) => drawGate(c, d) },
  ...STONE_LANTERNS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStoneLantern(c, x, y, d.night) })),
  ...YUKI_PINES.map(([x, y]): CityProp => ({ y, draw: (c) => drawYukiPine(c, x, y) })),
  ...MAPLES.map(([x, y]): CityProp => ({ y, draw: (c) => drawMaple(c, x, y) })),
  ...WILLOWS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawRiverWillow(c, x, y, d.seconds) })),
  ...STREET_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
  { y: KZ.H + 10, draw: (c, d) => drawSnowfall(c, d) },
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const G = KZ.gate;
const solid: Rect[] = [
  r(0, 0, KZ.castle.x1, KZ.castle.line),
  r(KZ.lane.x0, 0, KZ.lane.x1, KZ.castle.line + 0.2),
  r(KZ.chaya.x0, 0, KZ.W, KZ.chaya.line),
  r(KZ.kotoji.x - 0.5, KZ.kotoji.y - 0.4, KZ.kotoji.x + 0.6, KZ.kotoji.y + 0.1),
  r(KZ.karasaki.x - 0.5, KZ.karasaki.line - 0.5, KZ.karasaki.x + 0.5, KZ.karasaki.line),
  r(KZ.teahouse.x0, KZ.teahouse.line - 2.4, KZ.teahouse.x1, KZ.teahouse.line),
  r(KZ.river.x0, KZ.river.y0, KZ.bridge.x0, KZ.river.y1),
  r(KZ.bridge.x1, KZ.river.y0, KZ.W, KZ.river.y1),
  r(KZ.bridge.x0, KZ.chaya.street + 0.2, KZ.bridge.x0 + 0.25, KZ.river.y1 + 0.2),
  r(KZ.bridge.x1 - 0.25, KZ.chaya.street + 0.2, KZ.bridge.x1, KZ.river.y1 + 0.2),
  r(KZ.market.x0, 24, KZ.market.x1, KZ.market.line),
  r(COUNTER_X[0]! - 0.9, COUNTER_Y - 0.6, COUNTER_X[1]! + 0.9, COUNTER_Y - 0.35),
  r(KZ.westRow.x0, KZ.rowLine - 2.8, KZ.westRow.x1, KZ.rowLine),
  r(KZ.station.x0, KZ.rowLine - 2.8, KZ.station.x1, KZ.rowLine),
  r(KZ.curry.x0, KZ.rowLine - 2.8, KZ.mall.x1, KZ.rowLine),
  r(KZ.dome.x0, KZ.dome.front - 0.4, KZ.dome.x0 + 0.4, KZ.dome.front),
  r(KZ.dome.x1 - 0.4, KZ.dome.front - 0.4, KZ.dome.x1, KZ.dome.front),
  r(G.cx - G.half - 0.7, G.line - 0.4, G.cx - G.half + 0.7, G.line),
  r(G.cx + G.half - 0.7, G.line - 0.4, G.cx + G.half + 0.7, G.line),
  r(TEA_BENCH - 0.1, TEA_BENCH_Y - 0.3, TEA_BENCH + 0.1, TEA_BENCH_Y),
  ...CHAYA_BENCHES.map((x) => r(x - 0.1, CHAYA_BENCH_Y - 0.3, x + 0.1, CHAYA_BENCH_Y)),
  ...STONE_LANTERNS.map(([x, y]) => r(x - 0.3, y - 0.25, x + 0.3, y)),
  ...YUKI_PINES.map(([x, y]) => r(x - 0.25, y - 0.3, x + 0.25, y + 0.05)),
  ...MAPLES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...WILLOWS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...STREET_TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

// 曲水：只有虹橋和雁行橋走得過去
function blockedStream(x: number, y: number): boolean {
  if (y < KZ.castle.line) return false;
  if (streamDist(x, y) > 0.42) return false;
  const { x0, x1, y: ny } = KZ.niji;
  if (x > x0 && x < x1 && Math.abs(y - ny) < 0.45) return false;
  if (Math.abs(x - KZ.ganko.x) < 1.1 && Math.abs(y - KZ.ganko.y) < 0.7) return false;
  return true;
}

const rawLights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...STONE_LANTERNS.map(([x, y]) => ({ x: x * T, y: y * T - 17, r: 22, color: 'rgba(255, 190, 100, 0.5)' })),
  { x: KZ.kotoji.x * T, y: KZ.kotoji.y * T - 23, r: 34, color: 'rgba(255, 200, 120, 0.6)' },
  ...CHAYA_LANTERNS.map((x) => ({ x: x * T, y: KZ.chaya.line * T - 30, r: 26, color: 'rgba(255, 190, 110, 0.6)' })),
  ...CHAYA_ROW.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: KZ.chaya.line * T - 40, r: 56, color: 'rgba(255, 180, 100, 0.45)' })),
  // 茶屋街的燈映在淺野川上
  ...CHAYA_ROW.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: ((KZ.river.y0 + KZ.river.y1) / 2) * T, r: 30, color: 'rgba(255, 190, 110, 0.25)' })),
  { x: ((KZ.teahouse.x0 + KZ.teahouse.x1) / 2) * T, y: KZ.teahouse.line * T - 16, r: 64, color: 'rgba(255, 180, 120, 0.45)' },
  { x: 13 * T, y: KZ.castle.line * T - 56, r: 80, color: 'rgba(230, 235, 255, 0.35)' },
  { x: ((KZ.market.x0 + KZ.market.x1) / 2) * T, y: KZ.market.line * T - 20, r: 140, color: 'rgba(255, 220, 160, 0.4)' },
  { x: 45.4 * T, y: KZ.market.line * T - 14, r: 50, color: 'rgba(255, 210, 140, 0.5)' },
  { x: KZ.gate.cx * T, y: KZ.rowLine * T - 10, r: 180, color: 'rgba(190, 210, 255, 0.4)' },
  { x: (KZ.gate.cx - KZ.gate.half) * T, y: KZ.gate.line * T - 40, r: 50, color: 'rgba(255, 190, 110, 0.55)' },
  { x: (KZ.gate.cx + KZ.gate.half) * T, y: KZ.gate.line * T - 40, r: 50, color: 'rgba(255, 190, 110, 0.55)' },
  { x: KZ.gate.cx * T, y: KZ.gate.line * T - 104, r: 60, color: 'rgba(255, 200, 130, 0.4)' },
  { x: ((KZ.curry.x0 + KZ.curry.x1) / 2) * T, y: KZ.rowLine * T - 14, r: 46, color: 'rgba(255, 220, 120, 0.45)' },
  { x: ((KZ.westRow.x0 + KZ.westRow.x1) / 2) * T, y: KZ.rowLine * T - 12, r: 60, color: 'rgba(220, 235, 255, 0.35)' },
  { x: ((KZ.mall.x0 + KZ.mall.x1) / 2) * T, y: KZ.rowLine * T - 12, r: 60, color: 'rgba(220, 235, 255, 0.35)' },
];

// 光暈不要超出地圖（晚上 lighter 會畫到地圖外面）
const lights: CityDef['lights'] = rawLights.map((l) => ({ ...l, r: Math.max(8, Math.min(l.r, l.x, KZ.W * T - l.x, l.y, KZ.H * T - l.y)) }));

const stationX = KZ.gate.cx;
const pondLabelX = (POND_BENCHES[0]! + POND_BENCHES[1]!) / 2;

export const KANAZAWA: CityDef = {
  id: 'kanazawa',
  country: 'jp',
  line: 'jr',
  W: KZ.W,
  H: KZ.H,
  title: { 'zh-TW': '金澤', 'en-US': 'Kanazawa' },
  stop: { 'zh-TW': '金澤', 'en-US': 'Kanazawa' },
  emoji: '✨',
  station: {
    x: stationX,
    y: KZ.rowLine + 2.6,
    name: { 'zh-TW': 'JR 金澤站', 'en-US': 'JR Kanazawa Station' },
    arrive: { x: stationX, y: KZ.H - 1 },
  },
  background: '#d8d3c7',
  soundscape: 'zoo',
  paintGround: paintKanazawaGround,
  props,
  solid,
  blocked: (x, y) => inPond(x, y, 0.3) || blockedStream(x, y),
  seats: KANAZAWA_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: KANAZAWA_SHOPS,
  infos: [
    {
      at: r(KZ.pond.cx - KZ.pond.rx, KZ.pond.cy - KZ.pond.ry, KZ.pond.cx + KZ.pond.rx, KZ.pond.cy + KZ.pond.ry),
      title: { 'zh-TW': '兼六園 · 霞之池', 'en-US': 'Kenroku-en · Kasumiga-ike Pond' },
      text: {
        'zh-TW': '日本三名園之一（另外兩個是水戶偕樂園、岡山後樂園）。加賀藩主前田家從 1676 年起花了約 180 年慢慢造成，1822 年由松平定信依宋朝《洛陽名園記》取名：「宏大、幽邃、人力、蒼古、水泉、眺望」六種很難並存的景致都兼備，所以叫「兼六」。霞之池是園裡最大的池子，水是 1632 年挖的辰巳用水從 10 公里外的犀川引來的，池中是象徵長壽的蓬萊島。1874 年開放給一般人進園。',
        'en-US': 'One of Japan’s Three Great Gardens (with Kairaku-en in Mito and Kōraku-en in Okayama). The Maeda lords of Kaga shaped it over about 180 years from 1676; in 1822 Matsudaira Sadanobu named it after a Song-dynasty text: it “combines six” qualities rarely found together — spaciousness, seclusion, artifice, antiquity, water and views. Kasumiga-ike is its largest pond, fed by the Tatsumi Canal (dug in 1632) from the Sai River about 10 km away, with the “Hōrai” island of longevity in the middle. The garden opened to the public in 1874.',
      },
    },
    {
      at: r(KZ.kotoji.x - 1.2, KZ.kotoji.y - 2.6, KZ.niji.x1, KZ.kotoji.y + 0.6),
      title: { 'zh-TW': '徽軫燈籠 · 虹橋', 'en-US': 'Kotoji Lantern · Niji-bashi' },
      text: {
        'zh-TW': '兼六園的象徵，高約 2.7 公尺。兩隻腳一長一短，長的踩在霞之池裡、短的踩在岸邊的石頭上，樣子像古箏（琴）撐弦的「琴柱（ことじ）」，所以叫徽軫燈籠。一般說法是本來兩腳一樣長，後來一隻斷了才墊在石頭上。前面跨過曲水的一塊石板橋叫「虹橋」，因為微微拱起像彩虹；站在橋邊拍燈籠是金澤最經典的照片。',
        'en-US': 'The symbol of Kenroku-en, about 2.7 m tall. Its two legs differ in length — the long one stands in the pond, the short one on a rock on the shore — so it resembles the bridge (kotoji) that holds up a koto string. The popular story is that the legs were once equal until one broke. The single stone slab across the stream in front, gently arched like a rainbow, is Niji-bashi; this is Kanazawa’s classic photo spot.',
      },
    },
    {
      at: r(0.4, KZ.karasaki.line - 6, 8.6, KZ.karasaki.line + 0.4),
      title: { 'zh-TW': '唐崎松 · 雪吊', 'en-US': 'Karasaki Pine · Yukitsuri' },
      text: {
        'zh-TW': '十三代藩主前田齊泰從琵琶湖畔唐崎取松子種的黑松，枝幹往霞之池上低低伸展，長枝下面用木柱撐著。北陸的雪又濕又重，每年 11 月 1 日從唐崎松開始掛「雪吊」：在樹中間立一根柱子，從頂端拉下幾百條繩子綁住枝條，像一把撐開的傘，是金澤冬天的風景詩，3 月中才拆。（地圖上一整年都掛著；台灣時間 12–2 月還會積雪、下雪。）',
        'en-US': 'A black pine grown by the 13th lord, Maeda Nariyasu, from seed of the famous pine at Karasaki on Lake Biwa; its branches reach low over the pond on wooden props. Hokuriku snow is wet and heavy, so every 1 November the gardeners begin hanging yukitsuri — starting with this tree: a pole rises from the trunk and hundreds of ropes fan down to hold up the branches like an open umbrella, Kanazawa’s signature winter sight, taken down in mid-March. (Here it stays up all year; in Dec–Feb, Taiwan time, the map also gets snow.)',
      },
    },
    {
      at: r(KZ.castle.gateX - 5, 1.8, KZ.castle.gateX + 5, KZ.castle.line),
      title: { 'zh-TW': '金澤城 · 石川門', 'en-US': 'Kanazawa Castle · Ishikawa Gate' },
      text: {
        'zh-TW': '前田家加賀百萬石的居城的後門，隔著馬路就是兼六園。現在的門是 1759 年大火後、1788 年重建的，國家重要文化財。牆的下半部是黑底白格的「海鼠壁」，屋頂鋪的是木頭外包鉛板的「鉛瓦」，看起來灰白色；據說萬一被包圍，可以把屋瓦熔掉做子彈。石垣左右用了不同的砌法，也是看點。（真的石川門前面還有一座高麗門，這裡簡化了。）',
        'en-US': 'The rear gate of the castle of the Maeda clan, lords of the “one-million-koku” Kaga domain — just across the road from Kenroku-en. Rebuilt in 1788 after the great fire of 1759, it is an Important Cultural Property. The lower walls are namako-kabe (dark tiles with raised white plaster joints), and the roof is covered with lead-sheathed wooden tiles that look pale grey — said to be meltable into bullets in a siege. The stone walls on either side are laid in different styles. (The real gate also has an outer Kōrai-mon gate, simplified away here.)',
      },
    },
    {
      at: r(KZ.chaya.x0, KZ.chaya.line - 5, KZ.chaya.x1, KZ.chaya.line),
      title: { 'zh-TW': '東茶屋街 · 金箔', 'en-US': 'Higashi Chaya District · Gold Leaf' },
      text: {
        'zh-TW': '1820 年加賀藩把城下零散的茶屋集中到淺野川東岸形成的花街，現在是國家「重要傳統的建造物群保存地區」，有些茶屋晚上還有藝妓表演。兩層木造的茶屋一樓是紅殼色的細格子「木蟲籠（きむすこ）」，從裡面看得到外面、外面看不進去。金澤生產全日本九成九以上的金箔，金子打到萬分之一公釐薄，茶屋街到處是金箔工藝店，整片金箔包住的霜淇淋最有名。前面的淺野川上是木造的梅之橋。（真的茶屋街離兼六園約 1.5 公里，這裡畫得很近。）',
        'en-US': 'In 1820 the Kaga domain gathered the town’s scattered teahouses on the east bank of the Asano River into this entertainment quarter, now a nationally protected historic district; geiko still perform in some teahouses at night. The two-storey wooden houses have fine red-ochre kimusuko lattices you can see out of but not into. Kanazawa makes over 99% of Japan’s gold leaf — beaten to about a ten-thousandth of a millimetre — and the street is full of gold-leaf craft shops; soft serve wrapped in a whole sheet of gold is the famous treat. The wooden Ume-no-hashi bridge crosses the river in front. (The real district is about 1.5 km from Kenroku-en; it’s drawn much closer here.)',
      },
    },
    {
      at: r(KZ.market.x0, 24, KZ.market.x1, KZ.market.line),
      title: { 'zh-TW': '近江町市場', 'en-US': 'Ōmichō Market' },
      text: {
        'zh-TW': '「金澤市民的廚房」，從 18 世紀初（約 1721 年）就在這裡，大約有 170 家店，有屋頂的通道裡賣日本海的魚、蔬果和乾貨。11 月 6 日螃蟹解禁後最熱鬧：公的松葉蟹（加能蟹）、小小的母蟹「香箱蟹」。早上到海鮮丼的店坐吧台，甜蝦、海膽、鮭魚卵、喉黑（のどぐろ）都放在一碗。',
        'en-US': '“Kanazawa’s kitchen”, here since the early 18th century (around 1721), with about 170 shops under covered arcades selling Sea of Japan seafood, produce and dried goods. It’s busiest after the crab season opens on 6 November — big male snow crabs (Kanō-gani) and small female kōbako crabs. Grab a counter seat for a morning kaisendon of sweet shrimp, uni, ikura and nodoguro.',
      },
    },
    {
      at: r(KZ.dome.x0, KZ.rowLine - 4, KZ.dome.x1, KZ.gate.line),
      title: { 'zh-TW': 'JR 金澤站 · 鼓門', 'en-US': 'JR Kanazawa Station · Tsuzumi Gate' },
      text: {
        'zh-TW': '東口的鼓門高約 13.7 公尺，兩根柱子用木條扭成螺旋，造型來自能樂用的「鼓」（加賀寶生流的能樂在金澤很興盛）。後面的玻璃穹頂叫「もてなしドーム（款待穹頂）」，用了三千多片玻璃，意思是替下車的旅客撐一把傘——金澤多雨，俗話說「忘了帶便當也別忘了帶傘」。2005 年完成，2011 年被美國旅遊雜誌選為世界最美車站之一；2015 年北陸新幹線通到金澤。（真的鼓門在穹頂外面的站前廣場，這裡把站房、穹頂、鼓門疊在一起畫。）',
        'en-US': 'The 13.7 m Tsuzumi Gate at the east exit has two pillars of twisted timber shaped like the hand drums of Noh theatre, an art that flourished in Kanazawa under the Kaga Hōshō school. Behind it the glass “Motenashi (hospitality) Dome”, with over 3,000 panes, is an umbrella offered to arriving visitors — Kanazawa is so rainy that locals say “forget your lunch, but never your umbrella.” Completed in 2005 and named one of the world’s most beautiful stations by a US travel magazine in 2011; the Hokuriku Shinkansen reached Kanazawa in 2015. (Station building, dome and gate are stacked closer here than in reality.)',
      },
    },
  ],
  labels: [
    { x: pondLabelX, y: POND_BENCH_Y + 1.3, text: { 'zh-TW': '🏯 霞之池（石椅看徽軫燈籠）', 'en-US': '🏯 Kasumiga-ike (bench facing the lantern)' }, color: '#bae6fd' },
    { x: TEA_BENCH, y: TEA_BENCH_Y + 1.3, text: { 'zh-TW': '🍵 兼六園茶店緣台', 'en-US': '🍵 Garden teahouse bench' }, color: '#bbf7d0' },
    { x: (CHAYA_BENCHES[0]! + CHAYA_BENCHES[1]!) / 2, y: CHAYA_BENCH_Y + 1.6, text: { 'zh-TW': '🏮 東茶屋街（門前緣台）', 'en-US': '🏮 Higashi Chaya (teahouse benches)' }, color: '#fecaca' },
    { x: COUNTER_X[0]! - 4.6, y: COUNTER_Y + 0.2, text: { 'zh-TW': '🦀 近江町市場（海鮮丼吧台）', 'en-US': '🦀 Omicho Market (seafood counter)' }, color: '#fde68a' },
  ],
  walkers: [
    { x0: KZ.chaya.x0 + 0.4, y0: 16.2, x1: KZ.W - 0.4, y1: 16.2, count: 4 },
    { x0: KZ.river.x0 + 0.4, y0: 22.6, x1: KZ.W - 0.4, y1: 22.6, count: 2 },
    { x0: (KZ.bridge.x0 + KZ.bridge.x1) / 2, y0: 16.4, x1: (KZ.bridge.x0 + KZ.bridge.x1) / 2, y1: 23, count: 1 },
    { x0: 0.6, y0: 30.5, x1: KZ.W - 0.6, y1: 30.5, count: 4 },
    { x0: 0.6, y0: 45.1, x1: KZ.W - 0.6, y1: 45.1, count: 3 },
    { x0: 0.6, y0: 34.2, x1: KZ.W - 0.6, y1: 34.2, count: 2 },
    { x0: 1, y0: 24.2, x1: 25.6, y1: 24.2, count: 2 },
    { x0: 2.6, y0: 12.2, x1: 22, y1: 12.2, count: 1 },
    { x0: (KZ.lane.x0 + KZ.lane.x1) / 2, y0: 9.8, x1: (KZ.lane.x0 + KZ.lane.x1) / 2, y1: 28.8, count: 2 },
  ],
  traffic: [
    { y: 31.6, dir: -1, x0: 0, x1: KZ.W, count: 2 },
    { y: 32.8, dir: 1, x0: 0, x1: KZ.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點霞之池的石椅、兼六園茶店或茶屋街的緣台、市場的吧台坐下專注 · 走到店前買金箔霜淇淋、海鮮丼、金澤咖哩 · 點地標看介紹 · JR 金澤站去其他日本城市或飛回台灣',
    'en-US': 'WASD / arrows to move · click a pond bench, a teahouse bench or the market counter to focus · walk up to shops for gold-leaf soft serve, kaisendon and Kanazawa curry · click landmarks for info · JR Kanazawa to other Japanese cities or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅、緣台或吧台坐下專注 · 走到店前買東西 · 點地標看介紹 · JR 金澤站',
    'en-US': 'Tap a bench or counter to focus · visit the shops · tap landmarks · JR Kanazawa',
  },
};
