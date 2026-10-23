// 臺中（臺中車站一帶）的美術：中山路的宮原眼科（紅磚拱廊、金字招牌、門口排隊的人）、第四信用合作社（老銀行）、
// 綠川（石砌河道、柳樹、木棧步道）和中山綠橋（白色欄杆、燈柱）、西岸小吃攤車、紅磚白帶的臺中車站舊站（鐘塔的指針照台灣時間走）、站前廣場。
// 最後組成 CityScene 用的 TAICHUNG。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { BENCH_Y, CART_INFO, NORTH_ROW, PLAZA_BENCHES, SOUTH_ROW, TAICHUNG_SEATS, TAICHUNG_SHOPS, TC, type TaichungHouse } from './taichung';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, townhouseSprite, drawParkedScooter, SCOOTER_COLORS, drawStreetTree, drawLamp, drawFoodCart, drawBench } from './cityArt';

const WORDS = ['布行', '茶行', '鐘錶', '眼鏡', '書局', '餅舖', '五金', '西藥房'];
const BRICK = '#b14a32';
const BRICK_DARK = '#8f3a26';
const STONE = '#efe6d6';
const WATER = '#4f8f84';

// ── 地面（畫一次）──
export function paintTaichungGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(424);
  const W = TC.W * T;
  tiles(c, { x0: 0, y0: 0, x1: TC.W, y1: TC.H }, '#d2cbbf', '#c0b8aa', 12);
  // 北邊騎樓
  tiles(c, { x0: 0, y0: TC.northLine - 0.4, x1: TC.W, y1: TC.zhongshan.y0 }, '#b98f72', '#a87f63', 8);
  // 中山路（過河那段就是中山綠橋的橋面）、臺灣大道
  const zs = TC.zhongshan;
  road(c, { x0: 0, y0: zs.y0, x1: TC.W, y1: zs.y1 }, rand);
  const zMid = ((zs.y0 + zs.y1) / 2) * T;
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.8)', x, zMid, 10, 2);
  zebra(c, 31, zs.y0 + 0.2, 32.6, zs.y1 - 0.2, false);
  zebra(c, 15.4, zs.y0 + 0.2, 17, zs.y1 - 0.2, false);
  const av = TC.avenue;
  road(c, { x0: 0, y0: av.y0, x1: TC.W, y1: av.y1 }, rand);
  px(c, '#e0b93a', 0, ((av.y0 + av.y1) / 2) * T - 2, W, 1);
  px(c, '#e0b93a', 0, ((av.y0 + av.y1) / 2) * T + 1, W, 1);
  zebra(c, 24, av.y0 + 0.2, 28, av.y1 - 0.2, false);
  tiles(c, { x0: 0, y0: av.y1, x1: TC.W, y1: TC.H }, '#d2cbbf', '#c0b8aa', 12);

  // 綠川兩岸：西邊攤車廣場＋草地、東邊河畔小公園
  const midY0 = zs.y1 + 0.8;
  const r = TC.river;
  px(c, '#86ad5e', 0, midY0 * T + 6 * T, TC.westWalk.x0 * T, (r.y1 - midY0 - 6) * T);
  px(c, '#86ad5e', TC.eastWalk.x1 * T, midY0 * T + 2 * T, (TC.W - TC.eastWalk.x1) * T, (r.y1 - midY0 - 2) * T);
  for (let i = 0; i < 900; i += 1) {
    const gx = rand() < 0.4 ? rand() * TC.westWalk.x0 : TC.eastWalk.x1 + rand() * (TC.W - TC.eastWalk.x1);
    const gy = midY0 + (gx < TC.westWalk.x0 ? 6 : 2) + rand() * (r.y1 - midY0 - 6);
    px(c, rand() < 0.5 ? '#76a050' : '#98bd6e', Math.floor(gx * T), Math.floor(gy * T), 2, 1);
  }
  // 東岸公園的小路、花圃
  tiles(c, { x0: TC.eastWalk.x1, y0: 17.6, x1: TC.W, y1: 18.8 }, '#d9cfb8', '#c9bfa8', 8);
  for (const fx of [33, 40, 47]) {
    px(c, '#6b4a2f', fx * T, 21 * T, 3 * T, T);
    for (let k = 0; k < 10; k += 1) px(c, ['#e25a7a', '#f6c945', '#f2f2f2'][k % 3] ?? '#e25a7a', fx * T + 3 + ((k * 13) % (3 * T - 6)), 21 * T + 3 + ((k * 7) % 10), 3, 3);
  }
  // 兩岸木棧步道
  for (const wk of [TC.westWalk, TC.eastWalk]) {
    px(c, '#b08a5e', wk.x0 * T, zs.y1 * T, (wk.x1 - wk.x0) * T, (r.y1 - zs.y1) * T);
    for (let y = zs.y1 * T; y < r.y1 * T; y += 5) px(c, '#9a764c', wk.x0 * T, Math.round(y), (wk.x1 - wk.x0) * T, 1);
    for (let i = 0; i < 120; i += 1) px(c, '#c49a6a', Math.floor(wk.x0 * T + rand() * (wk.x1 - wk.x0) * T), Math.floor(zs.y1 * T + rand() * (r.y1 - zs.y1) * T), 3, 1);
  }
  // 河道：石砌的牆＋綠綠的水（北段從街屋中間流出來，南段流到車站前的涵洞）
  const river = (y0: number, y1: number) => {
    px(c, '#8f8a80', r.x0 * T, y0 * T, (r.x1 - r.x0) * T, (y1 - y0) * T);
    for (let y = y0 * T; y < y1 * T; y += 6) {
      px(c, '#7c776d', r.x0 * T, Math.round(y), 6, 1);
      px(c, '#7c776d', r.x1 * T - 6, Math.round(y), 6, 1);
    }
    px(c, WATER, (r.x0 + 0.4) * T, y0 * T, (r.x1 - r.x0 - 0.8) * T, (y1 - y0) * T);
    px(c, '#447e74', (r.x0 + 0.4) * T, y0 * T, 3, (y1 - y0) * T);
    px(c, '#447e74', (r.x1 - 0.4) * T - 3, y0 * T, 3, (y1 - y0) * T);
  };
  river(0, zs.y0);
  river(zs.y1, r.y1);
  // 涵洞口
  px(c, '#5a5650', (r.x0 + 0.4) * T, r.y1 * T - 4, (r.x1 - r.x0 - 0.8) * T, 4);
  for (let x = (r.x0 + 0.6) * T; x < (r.x1 - 0.4) * T; x += 4) px(c, '#3a3834', Math.round(x), r.y1 * T - 4, 1, 4);
  // 車站前：一條人行道、站前廣場（花崗石鋪面＋圖案）
  tiles(c, { x0: 0, y0: r.y1, x1: TC.W, y1: TC.station.y0 + 0.4 }, '#d2cbbf', '#c0b8aa', 12);
  const st = TC.station;
  tiles(c, { x0: 0, y0: st.y1, x1: TC.W, y1: TC.plazaY }, '#cfc9be', '#bcb5a8', 16);
  for (let x = st.x0 * T; x < st.x1 * T; x += 32) px(c, '#b9a98e', x + 8, st.y1 * T + 18, 16, 16);
}

// 河水往南流的波光（每格動）
function drawRiverShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  const r = TC.river;
  const x0 = (r.x0 + 0.5) * T;
  const w = (r.x1 - r.x0 - 1) * T;
  for (let i = 0; i < 26; i += 1) {
    const span = r.y1 * T;
    const y = (i * 61 + seconds * 10) % span;
    if (y > TC.zhongshan.y0 * T - 2 && y < TC.zhongshan.y1 * T + 2) continue;
    const x = x0 + ((i * 37) % Math.max(1, w - 6));
    const a = 0.25 + 0.2 * Math.sin(seconds * 1.4 + i);
    px(c, `rgba(220, 245, 235, ${a})`, Math.round(x), Math.round(y), 5, 1);
  }
}

// 柳樹：細細的枝條垂下來、會隨風晃
function drawWillow(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.18)', cx - 12, by - 1, 24, 3);
  px(c, '#5c4128', cx - 2, by - 22, 4, 22);
  c.fillStyle = '#5f9a4a';
  c.beginPath();
  c.ellipse(cx, by - 30, 15, 10, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#76b25c';
  c.beginPath();
  c.ellipse(cx - 3, by - 33, 9, 6, 0, 0, Math.PI * 2);
  c.fill();
  for (let k = -12; k <= 12; k += 3) {
    const sway = Math.round(Math.sin(seconds * 1.1 + k * 0.4) * 1.5);
    const len = 14 + ((k * 7 + 30) % 9);
    px(c, k % 2 === 0 ? '#6aa852' : '#5a9446', cx + k + sway, by - 28, 1, len);
  }
}

// ── 北邊：街屋、宮原眼科、第四信用合作社 ──

// 宮原眼科：兩層紅磚、白色飾帶、一樓一排拱廊（白色拱心石）、二樓白框窗、頂上大大的金字招牌
function miyaharaSprite(b: TaichungHouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 70;
  return cached('tc-miyahara', w, h, (c) => {
    // 女兒牆＋招牌
    px(c, BRICK, 0, 6, w, h - 6);
    for (let y = 8; y < h; y += 4) px(c, BRICK_DARK, 0, y, w, 1);
    for (let y = 8, row = 0; y < h; y += 4, row += 1) for (let x = (row % 2) * 4; x < w; x += 8) px(c, BRICK_DARK, x, y - 3, 1, 3);
    px(c, STONE, 0, 4, w, 3);
    px(c, '#15100c', w / 2 - 44, 0, 88, 13);
    px(c, '#c9a24a', w / 2 - 44, 0, 88, 1);
    px(c, '#c9a24a', w / 2 - 44, 12, 88, 1);
    text(c, '宮 原 眼 科', w / 2, 6.5, '#f2d27a', `900 9px ${SERIF_TC}`);
    // 二樓：白框窗、窗台
    px(c, STONE, 0, 15, w, 2);
    for (let x = 6; x + 12 <= w - 4; x += 19) {
      px(c, STONE, x - 2, 19, 16, 18);
      px(c, '#2f3a42', x, 21, 12, 14);
      px(c, '#5a6a78', x + 1, 22, 4, 5);
      px(c, STONE, x + 5, 21, 1, 14);
      px(c, STONE, x, 27, 12, 1);
      px(c, STONE, x - 3, 36, 18, 2);
    }
    px(c, STONE, 0, 40, w, 3);
    // 一樓：拱廊（白色拱心石）、裡面暖暖的燈光（金色的櫃子）
    const gy = 43;
    for (let x = 2; x + 16 <= w; x += 19) {
      c.fillStyle = '#2a1a12';
      c.beginPath();
      c.moveTo(x, h);
      c.lineTo(x, gy + 8);
      c.arc(x + 8, gy + 8, 8, Math.PI, 0);
      c.lineTo(x + 16, h);
      c.closePath();
      c.fill();
      px(c, '#f6d78a', x + 2, gy + 9, 12, h - gy - 9);
      for (let k = 0; k < 3; k += 1) px(c, '#8a5a32', x + 3, gy + 12 + k * 6, 10, 1);
      for (let k = 0; k < 4; k += 1) px(c, ['#c62828', '#2a5a9a', '#2a7a46', '#c9a24a'][k] ?? '#c62828', x + 3 + k * 3, gy + 13, 2, 4);
      px(c, STONE, x + 6, gy - 1, 4, 3);
    }
  });
}

// 第四信用合作社：老銀行，灰白石材立面、四根大柱子、大片玻璃、上面「第四信用合作社」
function fourthSprite(b: TaichungHouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 74;
  return cached('tc-fourth', w, h, (c) => {
    px(c, '#e4e0d8', 0, 8, w, h - 8);
    px(c, '#f4f1ea', 0, 8, w, 2);
    px(c, '#c9c4ba', 0, 8, 2, h - 8);
    px(c, '#c9c4ba', w - 2, 8, 2, h - 8);
    // 招牌
    px(c, '#7a1a14', 4, 12, w - 8, 12);
    px(c, '#c9a24a', 4, 12, w - 8, 1);
    text(c, '第四信用合作社', w / 2, 18.5, '#f6e2a8', `900 8px ${SERIF_TC}`);
    // 大柱子＋中間的玻璃
    for (let k = 0; k < 4; k += 1) {
      const x = Math.round(8 + k * ((w - 22) / 3));
      px(c, '#f4f1ea', x, 28, 6, h - 28);
      px(c, '#d6d1c6', x + 4, 28, 2, h - 28);
      px(c, '#c9c4ba', x - 1, 26, 8, 2);
    }
    for (let k = 0; k < 3; k += 1) {
      const x = Math.round(14 + k * ((w - 22) / 3));
      const gw = Math.round((w - 22) / 3) - 6;
      px(c, '#3a4a58', x, 30, gw, 20);
      px(c, '#6a8090', x + 1, 31, 3, 6);
      px(c, '#2a1e16', x, 54, gw, h - 54);
      px(c, '#f6d78a', x + 2, 56, gw - 4, h - 58);
    }
    // 冰淇淋小招牌
    px(c, '#ffffff', w - 18, 50, 12, 10);
    text(c, '🍦', w - 12, 55, '#000', '7px system-ui, "Apple Color Emoji", sans-serif');
  });
}

function drawNorthHouse(c: CanvasRenderingContext2D, b: TaichungHouse, d: DrawCtx): void {
  const bottom = TC.northLine * T;
  if (b.special === 'miyahara') {
    blit(c, miyaharaSprite(b), b.x0 * T, bottom);
    if (d.night) glow(c, ((b.x0 + b.x1) / 2) * T, bottom - 14, 80, '255, 200, 110', 0.35);
  } else if (b.special === 'fourth') {
    blit(c, fourthSprite(b), b.x0 * T, bottom);
  } else blit(c, townhouseSprite('tc', b, WORDS), b.x0 * T, bottom);
}

// 宮原眼科門口排隊的人（裝飾）
const QUEUE = [35, 35.9, 36.8, 37.7].map((x, i) => ({ x, colors: lookColors((i * 3) % 5, (i * 2 + 1) % 4, { body: i % 2 }) }));
function drawQueue(c: CanvasRenderingContext2D): void {
  for (const q of QUEUE) {
    const sprite = getAvatarFrame(q.colors, 'left', 'idle');
    px(c, 'rgba(0,0,0,0.25)', Math.round(q.x * T - 5), Math.round(8.1 * T + 3), 10, 2);
    c.drawImage(sprite, Math.round(q.x * T - sprite.width / 2), Math.round(8.1 * T + 5 - sprite.height));
  }
}

// 中山綠橋：白色的欄杆（一格格花瓶柱）、四個角的燈柱；north＝北邊那道（在橋面後面）
function drawBridgeRail(c: CanvasRenderingContext2D, north: boolean, d: DrawCtx): void {
  const x0 = (TC.river.x0 - 0.3) * T;
  const x1 = (TC.river.x1 + 0.3) * T;
  const by = Math.round((north ? TC.zhongshan.y0 + 0.1 : TC.zhongshan.y1) * T);
  px(c, 'rgba(0,0,0,0.2)', x0, by, x1 - x0, 2);
  px(c, '#f2efe8', x0, by - 10, x1 - x0, 2);
  px(c, '#d9d4c8', x0, by - 1, x1 - x0, 2);
  for (let x = x0 + 3; x < x1 - 3; x += 5) {
    px(c, '#f2efe8', Math.round(x), by - 8, 2, 7);
    px(c, '#d9d4c8', Math.round(x) + 1, by - 6, 1, 3);
  }
  for (const lx of [x0, x1 - 4]) {
    px(c, '#e8e2d6', lx, by - 14, 4, 14);
    px(c, '#3a3d45', lx + 1, by - 26, 2, 12);
    px(c, '#3a3d45', lx - 2, by - 28, 8, 2);
    px(c, d.night ? '#fff1a8' : '#f2ead0', lx - 1, by - 32, 6, 4);
    px(c, '#3a3d45', lx, by - 34, 4, 2);
  }
}

// ── 臺中車站舊站：紅磚＋白色飾帶（辰野風格）、兩翼的灰色馬薩屋頂＋老虎窗、中間入口的大拱門、鐘塔＋尖頂 ──
const ST_W = (TC.station.x1 - TC.station.x0) * T;
const ST_H = 120;
function stationSprite(): HTMLCanvasElement {
  return cached('tc-station', ST_W, ST_H, (c) => {
    const base = ST_H;
    const midX0 = ST_W / 2 - 56;
    const midX1 = ST_W / 2 + 56;
    // 兩翼
    const wing = (x0: number, x1: number) => {
      const top = base - 62;
      // 馬薩屋頂（灰色石板瓦）＋老虎窗
      c.fillStyle = '#4a505c';
      c.beginPath();
      c.moveTo(x0 - 2, top + 4);
      c.lineTo(x0 + 8, top - 14);
      c.lineTo(x1 - 8, top - 14);
      c.lineTo(x1 + 2, top + 4);
      c.closePath();
      c.fill();
      for (let y = top - 12; y < top + 4; y += 3) px(c, '#5e6572', x0 + 6, y, x1 - x0 - 12, 1);
      for (let x = x0 + 18; x < x1 - 18; x += 34) {
        px(c, STONE, x, top - 12, 10, 10);
        px(c, '#2f3a42', x + 2, top - 9, 6, 6);
        c.fillStyle = '#4a505c';
        c.beginPath();
        c.moveTo(x - 1, top - 12);
        c.lineTo(x + 5, top - 17);
        c.lineTo(x + 11, top - 12);
        c.fill();
      }
      // 紅磚牆＋白色飾帶
      px(c, BRICK, x0, top + 4, x1 - x0, base - top - 4);
      for (let y = top + 6; y < base; y += 4) px(c, BRICK_DARK, x0, y, x1 - x0, 1);
      px(c, STONE, x0, top + 4, x1 - x0, 3);
      px(c, STONE, x0, top + 28, x1 - x0, 3);
      px(c, STONE, x0, base - 4, x1 - x0, 4);
      // 窗：二樓長窗、一樓拱窗（白色窗框）
      for (let x = x0 + 8; x + 12 <= x1 - 6; x += 20) {
        px(c, STONE, x - 2, top + 10, 16, 16);
        px(c, '#2f3a42', x, top + 12, 12, 12);
        px(c, STONE, x + 5, top + 12, 1, 12);
        px(c, '#5a6a78', x + 1, top + 13, 3, 4);
        c.fillStyle = STONE;
        c.beginPath();
        c.arc(x + 6, top + 40, 8, Math.PI, 0);
        c.fill();
        px(c, STONE, x - 2, top + 40, 16, 16);
        c.fillStyle = '#2f3a42';
        c.beginPath();
        c.arc(x + 6, top + 41, 6, Math.PI, 0);
        c.fill();
        px(c, '#2f3a42', x, top + 41, 12, 14);
        px(c, STONE, x + 5, top + 36, 1, 19);
      }
    };
    wing(0, midX0);
    wing(midX1, ST_W);
    // 中間：比兩翼高的入口樓
    const top = base - 70;
    px(c, BRICK, midX0, top, midX1 - midX0, base - top);
    for (let y = top + 2; y < base; y += 4) px(c, BRICK_DARK, midX0, y, midX1 - midX0, 1);
    px(c, STONE, midX0 - 2, top, midX1 - midX0 + 4, 4);
    px(c, STONE, midX0, top + 17, midX1 - midX0, 3);
    px(c, STONE, midX0, base - 4, midX1 - midX0, 4);
    // 白色角柱（石頭隅石）
    for (let y = top + 4; y < base; y += 8) {
      px(c, STONE, midX0, y, 6, 4);
      px(c, STONE, midX1 - 6, y, 6, 4);
    }
    // 二樓三扇窗
    for (let k = 0; k < 3; k += 1) {
      const x = midX0 + 18 + k * 28;
      px(c, STONE, x - 2, top + 2, 20, 14);
      px(c, '#2f3a42', x, top + 4, 16, 10);
      px(c, STONE, x + 7, top + 4, 1, 10);
    }
    // 入口大拱門＋上面的招牌
    const ax = ST_W / 2;
    c.fillStyle = STONE;
    c.beginPath();
    c.arc(ax, base - 26, 18, Math.PI, 0);
    c.fill();
    px(c, STONE, ax - 18, base - 26, 36, 26);
    c.fillStyle = '#2a1e16';
    c.beginPath();
    c.arc(ax, base - 25, 15, Math.PI, 0);
    c.fill();
    px(c, '#2a1e16', ax - 15, base - 25, 30, 25);
    px(c, '#f6e2a8', ax - 12, base - 21, 24, 17);
    px(c, '#2a1e16', ax - 1, base - 21, 2, 17);
    px(c, '#1f3a2a', ax - 24, top + 20, 48, 9);
    px(c, '#c9a24a', ax - 24, top + 20, 48, 1);
    text(c, '臺中車站', ax, top + 24.5, '#f2efe8', `900 6px ${SERIF_TC}`);
    // 鐘塔：磚身、白色飾帶、鐘面（指針另外畫）、尖頂
    const tx0 = ax - 18;
    const tTop = top - 26;
    px(c, BRICK, tx0, tTop, 36, 28);
    for (let y = tTop + 2; y < top; y += 4) px(c, BRICK_DARK, tx0, y, 36, 1);
    px(c, STONE, tx0 - 2, tTop, 40, 3);
    px(c, STONE, tx0 - 2, top - 3, 40, 3);
    c.fillStyle = STONE;
    c.beginPath();
    c.arc(ax, tTop + 13, 10, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#fbf8f0';
    c.beginPath();
    c.arc(ax, tTop + 13, 8, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 12; k += 1) {
      const a = (k / 12) * Math.PI * 2;
      px(c, '#3a3d45', Math.round(ax + Math.cos(a) * 6.5), Math.round(tTop + 13 + Math.sin(a) * 6.5), 1, 1);
    }
    c.fillStyle = '#4a505c';
    c.beginPath();
    c.moveTo(tx0 - 4, tTop);
    c.lineTo(ax, tTop - 18);
    c.lineTo(tx0 + 40, tTop);
    c.closePath();
    c.fill();
    px(c, '#5e6572', ax - 1, tTop - 16, 2, 16);
    px(c, '#c9a24a', ax - 1, tTop - 23, 2, 6);
  });
}

// 鐘的指針：照台灣時間
function drawStationClock(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = ((TC.station.x0 + TC.station.x1) / 2) * T;
  const cy = TC.station.y1 * T - 70 - 26 + 13;
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Taipei' }));
  const min = now.getMinutes() + now.getSeconds() / 60;
  const hr = (now.getHours() % 12) + min / 60;
  c.strokeStyle = '#1a1c22';
  c.lineCap = 'round';
  const hand = (frac: number, len: number, width: number) => {
    const a = frac * Math.PI * 2 - Math.PI / 2;
    c.lineWidth = width;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len);
    c.stroke();
  };
  hand(hr / 12, 4, 1.4);
  hand(min / 60, 5.8, 1);
  c.lineCap = 'butt';
  if (d.night) glow(c, cx, cy, 18, '255, 245, 210', 0.4);
}

function drawStation(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, stationSprite(), TC.station.x0 * T, TC.station.y1 * T);
  drawStationClock(c, d);
}

// 綠川岸邊的木長椅（側面）：椅背在背對河的那一邊
function drawRiverBench(c: CanvasRenderingContext2D, x: number, y: number, facing: 'left' | 'right'): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const back = facing === 'right' ? cx - 6 : cx + 4;
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by + 1, 12, 2);
  px(c, '#8a5a32', cx - 6, by - 4, 12, 4);
  px(c, '#b5804a', cx - 6, by - 4, 12, 1);
  px(c, '#6b4a2f', back, by - 13, 2, 13);
  px(c, '#3a3d45', cx - 5, by, 2, 2);
  px(c, '#3a3d45', cx + 3, by, 2, 2);
}

// ── 組成 CityScene 用的資料 ──
const WILLOWS: [number, number][] = [
  [18.3, 13], [18.3, 18.2], [18.3, 23.4],
  [29.8, 13], [29.8, 18.2], [29.8, 23.4],
];
const TREES: [number, number][] = [
  [2.5, 21.6], [8, 23], [13.6, 21.6], [34, 15.4], [41, 15.4], [48, 15.4], [36, 24], [44, 24], [50.5, 23.6],
];
const LAMPS: [number, number][] = [
  [4, 11.6], [12, 11.6], [34, 11.6], [42, 11.6], [50, 11.6],
  [19, 15.6], [19, 20.4], [29, 15.6], [29, 20.4],
  [6, 32.6], [14, 32.6], [38, 32.6], [46, 32.6],
];
const SCOOTERS: [number, number][] = [
  ...[1.2, 2.4, 3.6, 6.2, 7.4, 18.6, 19.8, 39.4, 40.6, 43.6, 44.8, 48.4, 49.6, 50.8].map((x): [number, number] => [x, 8.5]),
];

const props: CityProp[] = [
  ...NORTH_ROW.map((b): CityProp => ({ y: TC.northLine, draw: (c, d) => drawNorthHouse(c, b, d) })),
  { y: 8.15, draw: (c) => drawQueue(c) },
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[(i * 5) % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
  { y: 0.1, draw: (c, d) => drawRiverShimmer(c, d.seconds) },
  { y: TC.zhongshan.y0 + 0.1, draw: (c, d) => drawBridgeRail(c, true, d) },
  { y: TC.zhongshan.y1, draw: (c, d) => drawBridgeRail(c, false, d) },
  ...WILLOWS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawWillow(c, x, y, d.seconds) })),
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...TC.carts.map((x, i): CityProp => {
    const cart = CART_INFO[i] ?? CART_INFO[0]!;
    return { y: TC.cartY, draw: (c, d) => drawFoodCart(c, x, TC.cartY, cart.name['zh-TW'], cart.awning, cart.food, d.seconds, i * 7 + 3) };
  }),
  { y: TC.station.y1, draw: (c, d) => drawStation(c, d) },
  ...SOUTH_ROW.map((b): CityProp => ({ y: TC.station.y1, draw: (c) => blit(c, townhouseSprite('tc', b, WORDS), b.x0 * T, TC.station.y1 * T) })),
  ...PLAZA_BENCHES.map((x): CityProp => ({ y: BENCH_Y - 0.01, draw: (c) => drawBench(c, x, BENCH_Y, 2.6) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = TAICHUNG_SEATS[i];
  if (!s || i >= 8) return;
  drawRiverBench(c, s.x, s.y, s.facing === 'left' ? 'left' : 'right');
}

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, TC.river.x0, TC.northLine - 0.3),
  r(TC.river.x1, 0, TC.W, TC.northLine - 0.3),
  // 綠川（中山綠橋那段可以走）
  r(TC.river.x0, 0, TC.river.x1, TC.zhongshan.y0 + 0.2),
  r(TC.river.x0, TC.zhongshan.y1 - 0.15, TC.river.x1, TC.river.y1),
  // 攤車、車站、兩邊的街屋
  ...TC.carts.map((x) => r(x - 1.3, TC.cartY - 1.6, x + 1.3, TC.cartY - 0.1)),
  r(TC.station.x0, TC.station.y0, TC.station.x1, TC.station.y1 - 0.2),
  r(0, TC.station.y0 + 0.6, TC.station.x0, TC.station.y1 - 0.2),
  r(TC.station.x1, TC.station.y0 + 0.6, TC.W, TC.station.y1 - 0.2),
  // 長椅的椅背、柳樹幹、行道樹幹
  ...PLAZA_BENCHES.map((x) => r(x - 1.3, BENCH_Y - 0.75, x + 1.3, BENCH_Y - 0.45)),
  ...WILLOWS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...NORTH_ROW.filter((b) => !b.special).map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: TC.northLine * T - 10, r: 26, color: 'rgba(255, 214, 150, 0.4)' })),
  { x: 13.4 * T, y: TC.northLine * T - 12, r: 46, color: 'rgba(255, 230, 170, 0.5)' },
  ...TC.carts.map((x) => ({ x: x * T, y: TC.cartY * T - 20, r: 30, color: 'rgba(255, 220, 150, 0.5)' })),
  ...[0.12, 0.27, 0.73, 0.88].map((k) => ({ x: TC.station.x0 * T + ST_W * k, y: TC.station.y1 * T - 22, r: 40, color: 'rgba(255, 210, 140, 0.4)' })),
  { x: ((TC.station.x0 + TC.station.x1) / 2) * T, y: TC.station.y1 * T - 14, r: 50, color: 'rgba(255, 220, 160, 0.5)' },
  ...[[20, 8.6], [28, 8.6], [20, 11.2], [28, 11.2]].map(([x = 0, y = 0]) => ({ x: x * T - 8, y: y * T - 30, r: 20, color: 'rgba(255, 240, 180, 0.6)' })),
];

export const TAICHUNG: CityDef = {
  id: 'taichung',
  W: TC.W,
  H: TC.H,
  title: { 'zh-TW': '臺中 · 綠川', 'en-US': 'Taichung · Green River' },
  stop: { 'zh-TW': '臺中（宮原眼科）', 'en-US': 'Taichung (Miyahara)' },
  emoji: '🍦',
  station: {
    x: (TC.station.x0 + TC.station.x1) / 2,
    y: TC.station.y1 + 0.6,
    name: { 'zh-TW': '臺中車站', 'en-US': 'Taichung Station' },
    arrive: { x: (TC.station.x0 + TC.station.x1) / 2 + 1.6, y: TC.station.y1 + 0.8 },
  },
  background: '#d2cbbf',
  soundscape: 'city',
  paintGround: paintTaichungGround,
  props,
  solid,
  seats: TAICHUNG_SEATS,
  drawSeat,
  shops: TAICHUNG_SHOPS,
  infos: [
    { at: r(TC.station.x0, TC.station.y0 - 4, TC.station.x1, TC.station.y1), title: { 'zh-TW': '臺中車站（舊站）', 'en-US': 'Old Taichung Station' }, text: { 'zh-TW': '1917 年落成的紅磚車站，正中間有鐘塔，是國定古蹟。2016 年高架的新站啟用後，舊站保留下來當作文化園區。', 'en-US': 'A red-brick station from 1917 with a central clock tower, now a national monument. Kept as a cultural park after the elevated new station opened in 2016.' } },
    { at: r(26.6, 2.6, 38.2, TC.northLine), title: { 'zh-TW': '宮原眼科', 'en-US': 'Miyahara' }, text: { 'zh-TW': '日治時期日本醫師宮原武熊開的眼科診所，紅磚老建築，現在是賣冰淇淋和伴手禮的店，店裡像圖書館一樣的櫃子很有名。', 'en-US': 'Once the eye clinic of Dr. Miyahara Takekuma in the Japanese era; the red-brick building is now an ice cream and gift shop with library-like shelves.' } },
    { at: r(9.4, 2.6, 17.4, TC.northLine), title: { 'zh-TW': '第四信用合作社', 'en-US': 'The Fourth Credit Union' }, text: { 'zh-TW': '老銀行建築改成的冰淇淋店，保留了銀行的櫃台和金庫的樣子。', 'en-US': 'An old bank building turned ice cream shop, keeping the bank counters and vault.' } },
    { at: r(TC.river.x0, TC.zhongshan.y1, TC.river.x1, TC.river.y1), title: { 'zh-TW': '綠川', 'en-US': 'Green River' }, text: { 'zh-TW': '流過臺中車站前的河，名字來自兩岸的綠意；近年整治後，兩岸有木棧步道、柳樹和可以坐下來的長椅。', 'en-US': 'The river in front of Taichung Station, named for its green banks; after recent renewal it has boardwalks, willows and benches.' } },
    { at: r(TC.river.x0 - 0.4, TC.zhongshan.y0, TC.river.x1 + 0.4, TC.zhongshan.y1), title: { 'zh-TW': '中山綠橋', 'en-US': 'Zhongshan Green Bridge' }, text: { 'zh-TW': '日治時期的老橋（以前叫新盛橋），白色的欄杆和燈柱很好認。', 'en-US': 'A Japanese-era bridge (once Xinsheng Bridge) known for its white balustrades and lamp posts.' } },
  ],
  labels: [
    { x: (TC.river.x0 + TC.river.x1) / 2, y: 17.6, text: { 'zh-TW': '🌿 綠川（岸邊長椅專注）', 'en-US': '🌿 Green River (benches to focus)' }, color: '#4ade80' },
    { x: (TC.river.x0 + TC.river.x1) / 2, y: TC.zhongshan.y0 - 0.1, text: { 'zh-TW': '中山綠橋', 'en-US': 'Zhongshan Green Bridge' }, color: '#e2e8f0' },
  ],
  walkers: [
    { x0: 1, y0: 8.05, x1: 21, y1: 8.05, count: 2 },
    { x0: 27, y0: 8.05, x1: 51, y1: 8.05, count: 2 },
    { x0: 1, y0: 11.75, x1: 51, y1: 11.75, count: 4 },
    { x0: 19.5, y0: 12.2, x1: 19.5, y1: 24, count: 2 },
    { x0: 28.4, y0: 12.2, x1: 28.4, y1: 24, count: 2 },
    { x0: 30, y0: 18.2, x1: 51, y1: 18.2, count: 2 },
    { x0: 1, y0: 32.4, x1: 51, y1: 32.4, count: 4 },
    { x0: 1, y0: 24.9, x1: 51, y1: 24.9, count: 2 },
  ],
  traffic: [
    { y: 9.6, dir: -1, x0: 0, x1: TC.W, count: 3 },
    { y: 10.9, dir: 1, x0: 0, x1: TC.W, count: 3 },
    { y: 34.1, dir: -1, x0: 0, x1: TC.W, count: 3 },
    { y: 35.4, dir: 1, x0: 0, x1: TC.W, count: 3 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點綠川岸邊或站前廣場的長椅坐下專注 · 走到宮原眼科、第四信用合作社、攤車前面買東西 · 點地標看介紹 · 臺中車站搭車回台北',
    'en-US': 'WASD / arrows to move · click a riverside or plaza bench to focus · walk up to Miyahara, the Fourth Credit Union or a cart to buy · click landmarks for info · Taichung Station back to Taipei',
  },
  hintTouch: {
    'zh-TW': '點綠川岸邊或站前的長椅坐下專注 · 走到店門口、攤車買東西 · 點地標看介紹 · 臺中車站回台北',
    'en-US': 'Tap a bench to focus · walk up to shops and carts · tap landmarks for info · Taichung Station back to Taipei',
  },
};
