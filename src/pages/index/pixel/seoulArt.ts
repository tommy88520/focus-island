// 首爾的美術：北岳山（花崗岩的山頭、松樹）、景福宮（勤政殿的屋頂、迴廊、宮牆、光化門：石造城門三個拱門＋兩層木造樓閣、丹青彩繪、匾額）、
// 門前的獬豸石像、守門將換崗儀式（用時間算：進場、站好打鼓、退場）、穿韓服的遊客、北村韓屋村（黑瓦白牆、花牆、石坡道、木頭平台 평상）、
// 清溪川（往下沉的石牆、溪邊步道、踏腳石、青紗燈籠、源頭的瀑布）、明洞（大樓、霓虹看板、小吃攤車、小桌）、舊首爾驛（紅磚、綠色圓頂）、
// 遠方南山上的 N 首爾塔、銀杏行道樹。最後組成 CityScene 用的 SEOUL。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { MD_CARTS, MD_TABLES, MD_TABLE_Y, PYEONGSANG, PYEONGSANG_Y, SE, SEOUL_SEATS, SEOUL_SHOPS, STREAM_STEPS, STREAM_STEP_Y } from './seoul';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, drawFoodCart, drawMarketTable, drawStool } from './cityArt';
import { drawStreetLamp } from './kyotoArt';

// 韓文要用有韓文字的字型
const FONT_KR = `"Apple SD Gothic Neo", "Noto Sans KR", "Malgun Gothic", ${FONT_TC}`;
const GIWA = '#3b3e45';
const GIWA_DARK = '#25272c';
const PILLAR = '#a8322a';
const SKIN = '#f0c8a0';

// ── 地面（畫一次）──
export function paintSeoulGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1395);
  const W = SE.W * T;
  const S = SE.stream;
  const sky = c.createLinearGradient(0, 0, 0, 7 * T);
  sky.addColorStop(0, '#86bfe8');
  sky.addColorStop(1, '#e4f0f6');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 8 * T);
  // 遠方的城市（北村後面，淡淡的大樓）
  for (let x = 30 * T; x < W; x += 10 + Math.floor(rand() * 8)) {
    const h = 10 + rand() * 22;
    px(c, rand() < 0.5 ? '#b8c6d2' : '#c6d0d8', x, 4 * T - h, 9, h + 8);
  }
  // 南山（遠方淡藍綠的山，N 首爾塔另外畫）
  c.fillStyle = '#8fae9e';
  c.beginPath();
  c.moveTo(38 * T, 4.4 * T);
  c.quadraticCurveTo(46 * T, 1.6 * T, 50.5 * T, 2.6 * T);
  c.quadraticCurveTo(54 * T, 3.2 * T, W, 3.4 * T);
  c.lineTo(W, 4.6 * T);
  c.lineTo(38 * T, 4.6 * T);
  c.fill();
  for (let i = 0; i < 40; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#82a292' : '#9cb8a8';
    c.beginPath();
    c.arc(40 * T + rand() * 16 * T, 3.4 * T + rand() * 1.2 * T, 3 + rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  // 北岳山：深綠的松林、山頭露出白色的花崗岩
  const ridge = (x: number) => {
    const d = (x - 13 * T) / (21 * T);
    return 0.5 * T + d * d * 6.5 * T + Math.sin(x * 0.03) * 4 + Math.sin(x * 0.011) * 6;
  };
  c.fillStyle = '#4f7a4c';
  c.beginPath();
  c.moveTo(0, 9 * T);
  for (let x = 0; x <= 36 * T; x += 6) c.lineTo(x, Math.min(7.6 * T, ridge(x)));
  c.lineTo(36 * T, 9 * T);
  c.fill();
  for (let i = 0; i < 260; i += 1) {
    const x = rand() * 36 * T;
    const y = ridge(x) + 4 + rand() * (8 * T - ridge(x));
    if (y > 8 * T) continue;
    c.fillStyle = rand() < 0.5 ? '#416c40' : '#5a8a54';
    c.beginPath();
    c.arc(x, y, 3 + rand() * 4, 0, Math.PI * 2);
    c.fill();
  }
  // 花崗岩（山頂附近一塊塊）
  for (let i = 0; i < 26; i += 1) {
    const x = 5 * T + rand() * 18 * T;
    const y = ridge(x) + 2 + rand() * 18;
    c.fillStyle = rand() < 0.5 ? '#d8d4cc' : '#c4beb2';
    c.beginPath();
    c.ellipse(x, y, 4 + rand() * 7, 2 + rand() * 3, rand() - 0.5, 0, Math.PI * 2);
    c.fill();
  }
  // 宮裡的地（迴廊後面一點點）
  px(c, '#d6cebe', 0, 7.6 * T, SE.palaceX1 * T, (SE.palaceLine - 7.6) * T);
  // 北村：花崗岩的坡道、中間的石階
  tiles(c, { x0: SE.bukchonX0 - 0.6, y0: 3.4, x1: SE.W, y1: 15.6 }, '#c2bbae', '#b0a99c', 12);
  for (let y = 3.6 * T, k = 0; y < SE.rowB * T; y += 6, k += 1) {
    px(c, '#d4cec2', SE.stair.x0 * T, Math.round(y), (SE.stair.x1 - SE.stair.x0) * T, 4);
    px(c, '#9a9488', SE.stair.x0 * T, Math.round(y) + 4, (SE.stair.x1 - SE.stair.x0) * T, 2);
  }
  px(c, '#8a8478', SE.stair.x0 * T, 3.6 * T, 2, (SE.rowB - 3.6) * T);
  px(c, '#8a8478', SE.stair.x1 * T - 2, 3.6 * T, 2, (SE.rowB - 3.6) * T);
  // 光化門廣場：大塊的花崗岩；門前的月台（御道）
  tiles(c, { x0: 0, y0: SE.palaceLine, x1: SE.bukchonX0 - 0.6, y1: 15.6 }, '#dcd6cb', '#cbc4b7', 16);
  const g0 = SE.gate.x0 + 2.4;
  const g1 = SE.gate.x1 - 2.4;
  px(c, '#e8e2d6', g0 * T, SE.palaceLine * T, (g1 - g0) * T, 2.2 * T);
  px(c, '#b8b2a4', g0 * T, (SE.palaceLine + 2.2) * T - 3, (g1 - g0) * T, 3);
  for (let x = g0 * T; x < g1 * T; x += 8) px(c, '#a8a294', Math.round(x), (SE.palaceLine + 2.2) * T - 6, 2, 3);
  px(c, '#f0ebe0', ((g0 + g1) / 2 - 0.8) * T, SE.palaceLine * T, 1.6 * T, 2.2 * T - 3);
  // 人行道、馬路
  tiles(c, { x0: 0, y0: 15.6, x1: SE.W, y1: SE.road.y0 }, '#cfcac0', '#bdb8ad', 8);
  road(c, { x0: 0, y0: SE.road.y0, x1: SE.W, y1: SE.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8c440', x, Math.round(((SE.road.y0 + SE.road.y1) / 2) * T), 12, 1);
  zebra(c, 2, SE.road.y0, 6, SE.road.y1, false);
  zebra(c, 42.5, SE.road.y0, 46.5, SE.road.y1, false);
  tiles(c, { x0: 0, y0: SE.road.y1, x1: SE.W, y1: S.wall }, '#cfcac0', '#bdb8ad', 8);
  // 清溪廣場（西邊，跟馬路一樣高）一路接到明洞
  tiles(c, { x0: 0, y0: S.wall, x1: S.x0, y1: SE.mdLine }, '#d8d1c4', '#c6bfb1', 12);
  // 北邊的石牆（往下沉）
  const wallFace = (y0: number, y1: number) => {
    px(c, '#8e877a', S.x0 * T, y0 * T, W - S.x0 * T, (y1 - y0) * T);
    for (let y = y0 * T, row = 0; y < y1 * T; y += 5, row += 1) {
      px(c, '#7a7468', S.x0 * T, Math.round(y) + 4, W - S.x0 * T, 1);
      for (let x = S.x0 * T + (row % 2) * 7; x < W; x += 14) px(c, '#7a7468', Math.round(x), Math.round(y), 1, 4);
    }
    px(c, '#c4bcae', S.x0 * T, y0 * T, W - S.x0 * T, 3);
  };
  wallFace(S.wall, S.walk0);
  // 溪邊步道（北、南）
  tiles(c, { x0: S.x0, y0: S.walk0, x1: SE.W, y1: S.water0 }, '#c9c1b2', '#b6ae9e', 12);
  tiles(c, { x0: S.x0, y0: S.water1, x1: SE.W, y1: S.walk1 }, '#c9c1b2', '#b6ae9e', 12);
  // 溪水：清清淺淺的，兩邊是大石頭
  const water = c.createLinearGradient(0, S.water0 * T, 0, S.water1 * T);
  water.addColorStop(0, '#4a9ab0');
  water.addColorStop(1, '#3a8298');
  c.fillStyle = water;
  c.fillRect(S.x0 * T, S.water0 * T, W - S.x0 * T, (S.water1 - S.water0) * T);
  for (let i = 0; i < 60; i += 1) px(c, 'rgba(120,90,60,0.25)', S.x0 * T + rand() * (W - S.x0 * T), S.water0 * T + 6 + rand() * 18, 3, 2);
  for (const yEdge of [S.water0 * T, S.water1 * T - 4]) {
    for (let x = S.x0 * T + 14; x < W; x += 6 + Math.floor(rand() * 4)) {
      c.fillStyle = rand() < 0.5 ? '#9a948a' : '#b2aca0';
      c.beginPath();
      c.ellipse(x, yEdge + 2, 4 + rand() * 2, 2.5, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  // 踏腳石（兩排可以走過溪）
  for (const s of SE.stones) {
    for (let y = S.water0 * T + 5, k = 0; y < S.water1 * T - 2; y += 8, k += 1) {
      for (const dx of [0.3, 0.95]) {
        const x = (s.x0 + dx + (k % 2) * 0.1) * T;
        px(c, 'rgba(0,0,0,0.25)', Math.round(x - 4), Math.round(y + 2), 10, 2);
        px(c, '#d6d0c4', Math.round(x - 5), Math.round(y - 2), 10, 5);
        px(c, '#ece7dc', Math.round(x - 5), Math.round(y - 2), 10, 1);
      }
    }
  }
  // 下到溪邊的石階
  for (const st of SE.stairsDown) {
    for (let y = S.wall * T, k = 0; y < S.walk0 * T; y += 4, k += 1) {
      px(c, k % 2 ? '#b8b0a2' : '#d2cabc', st.x0 * T, Math.round(y), (st.x1 - st.x0) * T, 4);
    }
    px(c, '#6a645a', st.x0 * T - 2, S.wall * T, 2, T);
    px(c, '#6a645a', st.x1 * T, S.wall * T, 2, T);
  }
  // 南邊的石牆頂、上去明洞的石階
  px(c, '#a49c8e', S.x0 * T, S.walk1 * T, W - S.x0 * T, (S.top - S.walk1) * T);
  px(c, '#c4bcae', S.x0 * T, S.walk1 * T, W - S.x0 * T, 3);
  for (let y = S.walk1 * T, k = 0; y < SE.mdLine * T; y += 4, k += 1) {
    if (y < S.top * T) px(c, k % 2 ? '#b8b0a2' : '#d2cabc', SE.stairsUp.x0 * T, Math.round(y), (SE.stairsUp.x1 - SE.stairsUp.x0) * T, 4);
  }
  tiles(c, { x0: SE.stairsUp.x0, y0: S.top, x1: SE.stairsUp.x1, y1: SE.mdLine }, '#cbc3b6', '#b8b0a2', 8);
  // 西端的石牆（源頭）
  px(c, '#8e877a', S.x0 * T, S.wall * T, 10, (S.top - S.wall) * T);
  px(c, '#c4bcae', S.x0 * T, S.wall * T, 3, (S.top - S.wall) * T);
  // 明洞（街）、首爾站前廣場
  tiles(c, { x0: 0, y0: SE.mdLine, x1: SE.station.x0, y1: SE.bottom }, '#d8ccc0', '#c6b8aa', 8);
  for (let i = 0; i < 40; i += 1) px(c, 'rgba(160,120,90,0.12)', Math.floor(rand() * SE.station.x0) * T, Math.floor(SE.mdLine + rand() * (SE.bottom - SE.mdLine)) * T, 8, 8);
  tiles(c, { x0: SE.station.x0, y0: SE.mdLine, x1: SE.W, y1: SE.bottom }, '#d6d2ca', '#c2beb4', 16);
  // 最南邊：對面一排店的雨棚
  px(c, '#4a4d55', 0, SE.bottom * T, W, (SE.H - SE.bottom) * T);
  for (let x = 0; x < W; x += 28) {
    const col = ['#d8262a', '#2f6fb0', '#e8b830', '#2a8a6a', '#8a3aa8'][Math.floor(rand() * 5)] ?? '#d8262a';
    for (let k = 0; k < 26; k += 4) px(c, k % 8 ? col : '#f4f1e8', x + k, SE.bottom * T, 4, 6);
    px(c, 'rgba(0,0,0,0.25)', x, SE.bottom * T + 6, 26, 2);
  }
}

// ── 共用的韓式屋頂：兩端翹起來、下緣往中間垂的弧線（黑瓦） ──
function curvedRoof(c: CanvasRenderingContext2D, cx: number, top: number, w: number, h: number, lift: number, color = GIWA): void {
  const x0 = cx - w / 2;
  const x1 = cx + w / 2;
  const bottom = top + h;
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x0 - lift, bottom - lift);
  c.quadraticCurveTo(x0 + w * 0.2, bottom + 1, cx, bottom);
  c.quadraticCurveTo(x1 - w * 0.2, bottom + 1, x1 + lift, bottom - lift);
  c.lineTo(x1 - w * 0.2, top + 2);
  c.lineTo(x0 + w * 0.2, top + 2);
  c.closePath();
  c.fill();
  // 瓦溝
  for (let x = x0 + w * 0.08; x < x1 - w * 0.08; x += 3) {
    const t = Math.abs(x - cx) / (w / 2);
    const yTop = t > 0.6 ? top + 2 + (t - 0.6) * 2.5 * (h - 2) : top + 3;
    px(c, 'rgba(255,255,255,0.08)', Math.round(x), Math.round(yTop), 1, Math.max(1, Math.round(bottom - yTop - 2 - t * t * lift)));
  }
  // 屋脊（白色的線）＋兩端翹起來的脊頭
  px(c, GIWA_DARK, Math.round(x0 + w * 0.19), top, Math.round(w * 0.62), 3);
  px(c, '#e8e4da', Math.round(x0 + w * 0.19), top + 3, Math.round(w * 0.62), 1);
  px(c, GIWA_DARK, Math.round(x0 + w * 0.19) - 1, top - 2, 3, 4);
  px(c, GIWA_DARK, Math.round(x1 - w * 0.19) - 2, top - 2, 3, 4);
  // 簷口
  c.strokeStyle = GIWA_DARK;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x0 - lift, bottom - lift);
  c.quadraticCurveTo(x0 + w * 0.2, bottom + 1, cx, bottom);
  c.quadraticCurveTo(x1 - w * 0.2, bottom + 1, x1 + lift, bottom - lift);
  c.stroke();
}

// 丹青：屋簷下綠底、紅藍白的花紋
function dancheong(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  px(c, '#2f7a64', x, y, w, h);
  for (let k = x + 1; k < x + w - 2; k += 6) {
    px(c, '#c8402e', k, y + 1, 2, h - 2);
    px(c, '#3a5aa8', k + 2, y + 1, 1, h - 2);
    px(c, '#f4efe2', k + 3, y + Math.floor(h / 2), 1, 1);
  }
  px(c, '#d8a040', x, y + h - 1, w, 1);
}

// 一排紅柱子（中間暗暗的）
function pillars(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, step: number): void {
  px(c, '#3a2420', x, y, w, h);
  for (let k = x; k <= x + w - 3; k += step) {
    px(c, PILLAR, k, y, 3, h);
    px(c, 'rgba(255,255,255,0.2)', k, y, 1, h);
  }
}

// ── 景福宮：宮牆裡看得到的勤政殿、興禮門、迴廊 ──
function palaceHallsSprite(): HTMLCanvasElement {
  const w = Math.round(SE.palaceX1 * T);
  const h = 112;
  return cached('se-halls', w, h, (c) => {
    const gx = ((SE.gate.x0 + SE.gate.x1) / 2) * T;
    // 勤政殿（兩層的大屋頂）
    pillars(c, gx - 50, 30, 100, 14, 10);
    curvedRoof(c, gx, 0, 116, 20, 6);
    dancheong(c, gx - 46, 20, 92, 3);
    curvedRoof(c, gx, 38, 150, 18, 8);
    // 兩邊的殿閣
    for (const x of [gx - 150, gx + 150]) {
      pillars(c, x - 34, 60, 68, 16, 10);
      dancheong(c, x - 34, 58, 68, 2);
      curvedRoof(c, x, 44, 84, 16, 6);
    }
    // 迴廊（長長的低屋頂，一路接到兩邊）
    for (let x = 0; x < w; x += 64) {
      pillars(c, x + 2, 94, 60, 18, 8);
      dancheong(c, x + 2, 92, 60, 2);
      curvedRoof(c, x + 32, 80, 66, 13, 3);
    }
  });
}

// ── 宮牆＋光化門（石造城門、三個拱門、兩層木造樓閣、匾額） ──
const WALL_H = 30;
function palaceWallSprite(): HTMLCanvasElement {
  const w = Math.round(SE.palaceX1 * T);
  const h = 118;
  return cached('se-gwanghwamun', w, h, (c) => {
    // 宮牆：下面花崗岩、上面小石塊、黑瓦的牆頂
    const wy = h - WALL_H + 6;
    px(c, '#b9b1a2', 0, wy, w, h - wy);
    for (let y = wy, row = 0; y < h; y += 6, row += 1) {
      px(c, '#9e9688', 0, y + 5, w, 1);
      for (let x = (row % 2) * 9; x < w; x += 18) px(c, '#9e9688', x, y, 1, 5);
    }
    px(c, '#a8644a', 0, wy, w, 8);
    for (let x = 0; x < w; x += 6) px(c, '#8e523c', x, wy, 1, 8);
    for (let x = 0; x < w; x += 70) curvedRoof(c, x + 35, wy - 8, 74, 8, 2);
    // 光化門的石座
    const gx = ((SE.gate.x0 + SE.gate.x1) / 2) * T;
    const bx0 = SE.gate.x0 * T;
    const bw = (SE.gate.x1 - SE.gate.x0) * T;
    const by = h - 50;
    px(c, '#cbc3b3', bx0, by, bw, 50);
    for (let y = by, row = 0; y < h; y += 7, row += 1) {
      px(c, '#b2aa9a', bx0, y + 6, bw, 1);
      for (let x = bx0 + (row % 2) * 10; x < bx0 + bw; x += 20) px(c, '#b2aa9a', x, y, 1, 6);
    }
    px(c, '#ddd6c8', bx0, by, bw, 2);
    // 女牆
    for (let x = bx0; x < bx0 + bw; x += 8) px(c, '#bdb5a5', x, by - 4, 6, 4);
    // 三個拱門（中間大）：裡面暗、紅色的門板打開
    const arch = (cx: number, aw: number, ah: number) => {
      const top = h - ah;
      c.fillStyle = '#e4ddd0';
      c.beginPath();
      c.arc(cx, top + aw / 2, aw / 2 + 3, Math.PI, 0);
      c.lineTo(cx + aw / 2 + 3, h);
      c.lineTo(cx - aw / 2 - 3, h);
      c.fill();
      c.fillStyle = '#2a2420';
      c.beginPath();
      c.arc(cx, top + aw / 2, aw / 2, Math.PI, 0);
      c.lineTo(cx + aw / 2, h);
      c.lineTo(cx - aw / 2, h);
      c.fill();
      px(c, '#9a2a22', cx - aw / 2, top + aw / 2, 3, ah - aw / 2);
      px(c, '#9a2a22', cx + aw / 2 - 3, top + aw / 2, 3, ah - aw / 2);
      px(c, 'rgba(214,206,190,0.5)', cx - aw / 2 + 4, h - 8, aw - 8, 8);
    };
    arch(gx, 24, 36);
    arch(gx - 46, 18, 30);
    arch(gx + 46, 18, 30);
    // 一樓：紅柱、丹青、下層屋頂
    pillars(c, gx - 62, by - 22, 124, 18, 12);
    px(c, '#c8b48a', gx - 64, by - 6, 128, 2);
    dancheong(c, gx - 64, by - 26, 128, 4);
    curvedRoof(c, gx, by - 42, 166, 16, 9);
    // 二樓：門窗格子、匾額、上層屋頂
    px(c, '#7a3a2a', gx - 48, by - 58, 96, 16);
    for (let x = gx - 46; x < gx + 46; x += 6) px(c, '#c89a5a', x, by - 56, 4, 12);
    for (let x = gx - 48; x <= gx + 45; x += 16) px(c, PILLAR, x, by - 58, 3, 16);
    px(c, '#1a1a1a', gx - 17, by - 60, 34, 11);
    px(c, '#c9a24a', gx - 17, by - 60, 34, 1);
    px(c, '#c9a24a', gx - 17, by - 50, 34, 1);
    text(c, '光化門', gx, by - 54.5, '#e8c46a', `900 7px ${SERIF_TC}`);
    dancheong(c, gx - 50, by - 64, 100, 4);
    curvedRoof(c, gx, by - 84, 140, 22, 9);
  });
}

// 獬豸（海太）石像：光化門前兩邊
function drawHaechi(c: CanvasRenderingContext2D, x: number, y: number, flip: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 9, by - 1, 18, 3);
  px(c, '#a8a092', cx - 8, by - 8, 16, 8);
  px(c, '#c4bcae', cx - 8, by - 8, 16, 2);
  // 坐著的身體、頭（鬃毛捲捲的）
  px(c, '#bab2a4', cx - 5, by - 17, 10, 9);
  px(c, '#bab2a4', cx - 3 + flip * 2, by - 24, 8, 8);
  px(c, '#9e9688', cx - 4 + flip * 2, by - 25, 10, 3);
  px(c, '#4a4640', cx + flip * 3, by - 21, 1, 1);
  px(c, '#9e9688', cx - 5, by - 10, 3, 2);
  px(c, '#9e9688', cx + 2, by - 10, 3, 2);
  px(c, '#9e9688', cx - 1 - flip * 6, by - 15, 2, 5);
}

// ── 守門將（穿彩色的傳統服、戴黑色的笠、拿旗子） ──
function drawGuard(c: CanvasRenderingContext2D, cx: number, by: number, robe: string, trim: string, flag: string | null, step: number, chief = false): void {
  cx = Math.round(cx);
  by = Math.round(by);
  px(c, 'rgba(0,0,0,0.25)', cx - 5, by - 1, 10, 2);
  px(c, '#15171f', cx - 3 + step, by - 4, 2, 4);
  px(c, '#15171f', cx + 1 - step, by - 4, 2, 4);
  px(c, robe, cx - 5, by - 8, 10, 4);
  px(c, robe, cx - 4, by - 16, 8, 9);
  px(c, trim, cx - 4, by - 11, 8, 1);
  px(c, trim, cx - 1, by - 16, 2, 5);
  px(c, robe, cx - 6, by - 15, 2, 6);
  px(c, robe, cx + 4, by - 15, 2, 6);
  px(c, SKIN, cx - 6, by - 9, 2, 2);
  px(c, SKIN, cx + 4, by - 9, 2, 2);
  px(c, SKIN, cx - 2, by - 21, 5, 5);
  px(c, '#1a1a1a', cx - 1, by - 17, 3, 1);
  // 笠：寬帽簷、紅色的穗
  px(c, '#1a1a1a', cx - 5, by - 22, 11, 2);
  px(c, '#1a1a1a', cx - 2, by - 25, 5, 3);
  px(c, chief ? '#e8c44a' : '#d8262a', cx + 3, by - 24, 2, 4);
  if (chief) px(c, '#e8c44a', cx - 1, by - 27, 2, 2);
  if (flag) {
    px(c, '#6a4a2a', cx + 6, by - 36, 1, 30);
    px(c, flag, cx + 7, by - 35, 9, 7);
    px(c, '#d8262a', cx + 7, by - 35, 9, 1);
    for (let k = 0; k < 7; k += 2) px(c, '#d8262a', cx + 16, by - 35 + k, 1, 1);
    px(c, '#e8c44a', cx + 5, by - 38, 3, 2);
  }
}

// 換崗儀式：120 秒一輪。0–25 秒從西邊走進來、25–80 秒在門前站好打鼓、80–105 秒走回去；光化門口一直有兩位守門將
const CEREMONY = [
  { robe: '#2a4a9a', trim: '#d8262a', flag: '#e8c44a' },
  { robe: '#c8302a', trim: '#2a4a9a', flag: '#2a4a9a' },
  { robe: '#e0b030', trim: '#2a7a4a', flag: null },
  { robe: '#2a4a9a', trim: '#e8c44a', flag: null, chief: true },
  { robe: '#2a7a4a', trim: '#d8262a', flag: null, drum: true },
  { robe: '#c8302a', trim: '#e0b030', flag: '#2a7a4a' },
  { robe: '#e0b030', trim: '#2a4a9a', flag: '#c8302a' },
] as const;
const CEREMONY_Y = 13.9;
function drawGateGuards(c: CanvasRenderingContext2D): void {
  const gx = (SE.gate.x0 + SE.gate.x1) / 2;
  drawGuard(c, (gx - 1.9) * T, (SE.palaceLine + 0.9) * T, '#2a4a9a', '#d8262a', '#e8c44a', 0);
  drawGuard(c, (gx + 1.9) * T, (SE.palaceLine + 0.9) * T, '#c8302a', '#2a4a9a', '#2a4a9a', 0);
}
function drawCeremony(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const t = d.seconds % 120;
  if (t > 105) return;
  const gx = (SE.gate.x0 + SE.gate.x1) / 2;
  const marching = t < 25 || t > 80;
  const offset = t < 25 ? (1 - t / 25) * 24 : t > 80 ? ((t - 80) / 25) * 24 : 0;
  const step = marching ? (Math.floor(d.seconds * 4) % 2) : 0;
  c.save();
  c.beginPath();
  c.rect(0, 0, (SE.bukchonX0 - 0.6) * T, SE.H * T);
  c.clip();
  CEREMONY.forEach((g, i) => {
    const x = (gx + (i - (CEREMONY.length - 1) / 2) * 1.5 - offset) * T;
    const y = CEREMONY_Y * T;
    if ('drum' in g) {
      // 鼓（紅色的鼓身）＋鼓槌（站好時打鼓）
      const hit = !marching && Math.floor(d.seconds * 2) % 2 === 0;
      px(c, '#6a4a2a', x + 5, y - 14, 1, 14);
      px(c, '#b8302a', x + 3, y - 20, 10, 8);
      px(c, '#f4efe2', x + 3, y - 20, 2, 8);
      px(c, '#e8c44a', x + 3, y - 17, 10, 1);
      drawGuard(c, x, y, g.robe, g.trim, null, step);
      px(c, '#6a4a2a', x - 1, y - (hit ? 22 : 18), 1, 6);
    } else {
      drawGuard(c, x, y, g.robe, g.trim, g.flag, step, 'chief' in g);
    }
  });
  c.restore();
}

// ── 穿韓服的遊客（用時間算，在廣場、北村、明洞來回走） ──
const HANBOK = [
  { y: 14.9, x0: 1.5, x1: 30, speed: 0.6, phase: 0.1, top: '#f6c6d0', skirt: '#d8264a', ribbon: '#2a4a9a', male: false },
  { y: 15.2, x0: 3, x1: 29, speed: 0.5, phase: 0.55, top: '#f8e88a', skirt: '#2a6ab0', ribbon: '#d8262a', male: false },
  { y: 12.6, x0: 2, x1: 30, speed: 0.45, phase: 0.3, top: '#bfe6d0', skirt: '#8a3aa8', ribbon: '#e8c44a', male: false },
  { y: 12.5, x0: 33, x1: 55, speed: 0.4, phase: 0.2, top: '#f4f1e8', skirt: '#e86a9a', ribbon: '#2a7a4a', male: false },
  { y: 15.1, x0: 33, x1: 55, speed: 0.45, phase: 0.7, top: '#2a4a7a', skirt: '#cfd6e0', ribbon: '#e8c44a', male: true },
  { y: 39.7, x0: 2, x1: 38, speed: 0.5, phase: 0.4, top: '#ffd0a0', skirt: '#2a8a6a', ribbon: '#d8262a', male: false },
] as const;
function hanbokPos(p: (typeof HANBOK)[number], seconds: number): { x: number; dir: number } {
  const span = p.x1 - p.x0;
  const tt = ((seconds * p.speed) / span + p.phase) % 2;
  return tt < 1 ? { x: p.x0 + span * tt, dir: 1 } : { x: p.x0 + span * (2 - tt), dir: -1 };
}
function drawHanbokPerson(c: CanvasRenderingContext2D, p: (typeof HANBOK)[number], d: DrawCtx): void {
  const pos = hanbokPos(p, d.seconds);
  const cx = Math.round(pos.x * T);
  const by = Math.round(p.y * T);
  const step = Math.floor(d.seconds * 4 + p.phase * 10) % 2;
  px(c, 'rgba(0,0,0,0.25)', cx - 6, by + 2, 12, 2);
  if (p.male) {
    px(c, '#f4f1e8', cx - 3 + step, by - 2, 2, 3);
    px(c, '#f4f1e8', cx + 1 - step, by - 2, 2, 3);
    px(c, p.skirt, cx - 4, by - 9, 8, 7);
    px(c, p.top, cx - 4, by - 16, 8, 8);
    px(c, '#f4f4f4', cx - 1, by - 16, 2, 3);
    px(c, p.ribbon, cx + pos.dir, by - 13, 1, 3);
    px(c, p.top, cx - 5, by - 15, 1, 5);
    px(c, p.top, cx + 4, by - 15, 1, 5);
    px(c, SKIN, cx - 2, by - 21, 5, 5);
    // 黑色的笠（gat）
    px(c, 'rgba(20,20,24,0.9)', cx - 5, by - 22, 11, 1);
    px(c, 'rgba(20,20,24,0.75)', cx - 2, by - 26, 5, 4);
  } else {
    // 長長的裙子（chima）：往下越來越寬
    for (let k = 0; k < 12; k += 1) {
      const half = 3 + Math.floor(k / 3);
      px(c, p.skirt, cx - half, by - 12 + k, half * 2 + 1, 1);
    }
    px(c, 'rgba(0,0,0,0.15)', cx - 5, by - 6, 2, 6);
    px(c, 'rgba(255,255,255,0.25)', cx + 2, by - 10, 1, 9);
    px(c, '#f4f4f4', cx - 2 + step * 2, by, 2, 1);
    // 短上衣（jeogori）、白領、蝴蝶結
    px(c, p.top, cx - 3, by - 16, 7, 4);
    px(c, '#f4f4f4', cx - 1, by - 16, 2, 2);
    px(c, p.ribbon, cx + pos.dir, by - 14, 1, 4);
    px(c, p.top, cx - 4, by - 16, 1, 5);
    px(c, p.top, cx + 4, by - 16, 1, 5);
    px(c, SKIN, cx - 2, by - 21, 5, 5);
    px(c, '#1a1a1a', cx - 2, by - 22, 5, 2);
    px(c, '#1a1a1a', cx - 3 - pos.dir, by - 20, 2, 3);
    px(c, p.ribbon, cx - 3 - pos.dir, by - 18, 2, 1);
  }
  px(c, '#1a1a1a', cx + (pos.dir > 0 ? 1 : -1), by - 19, 1, 1);
}

// ── 北村韓屋：黑瓦、白牆木框、花牆、格子窗、木門 ──
function hanokRowSprite(key: string, x0: number, x1: number, seed: number): HTMLCanvasElement {
  const w = Math.round((x1 - x0) * T);
  const h = 66;
  return cached(`se-hanok-${key}`, w, h, (c) => {
    const rand = seeded(seed);
    let x = 0;
    while (x < w - 20) {
      const hw = Math.min(w - x, 66 + Math.floor(rand() * 4) * 8);
      const cx = x + hw / 2;
      const gate = rand() < 0.45;
      // 石座
      px(c, '#a8a296', x, h - 6, hw, 6);
      for (let k = x + 2; k < x + hw; k += 9) px(c, '#8e887c', k, h - 6, 1, 6);
      px(c, '#c4beb2', x, h - 6, hw, 1);
      // 花牆（下半部，石頭和瓦片拼的圖案）
      px(c, '#9a8670', x + 2, h - 16, hw - 4, 10);
      for (let k = x + 4; k < x + hw - 4; k += 6) {
        px(c, '#d8cbb4', k, h - 14, 4, 2);
        px(c, '#d8cbb4', k + 2, h - 10, 2, 2);
      }
      // 白牆＋木框
      px(c, '#f2ede2', x + 2, 30, hw - 4, h - 46);
      px(c, '#6a4a32', x + 2, 30, hw - 4, 2);
      px(c, '#6a4a32', x + 2, h - 18, hw - 4, 2);
      for (let k = x + 2; k < x + hw - 2; k += Math.floor((hw - 4) / 3)) px(c, '#6a4a32', k, 30, 3, h - 46);
      px(c, '#6a4a32', x + hw - 5, 30, 3, h - 46);
      if (gate) {
        // 大門：木門＋小屋頂
        px(c, '#5a3a22', cx - 10, 30, 20, h - 36);
        px(c, '#8a5a32', cx - 8, 34, 7, h - 40);
        px(c, '#8a5a32', cx + 1, 34, 7, h - 40);
        px(c, '#c9a24a', cx - 2, 46, 1, 2);
        px(c, '#c9a24a', cx + 1, 46, 1, 2);
        curvedRoof(c, cx, 22, 30, 9, 3);
      } else {
        // 格子窗（貼紙的）
        for (const wx of [cx - 18, cx + 5]) {
          px(c, '#7a5236', wx - 1, 34, 15, 12);
          px(c, '#f4ecd8', wx, 35, 13, 10);
          for (let k = 2; k < 13; k += 3) px(c, '#a07a52', wx + k, 35, 1, 10);
          for (let k = 2; k < 10; k += 3) px(c, '#a07a52', wx, 35 + k, 13, 1);
        }
      }
      // 屋簷下的椽子、屋頂
      for (let k = x + 4; k < x + hw - 4; k += 4) px(c, '#8a5a36', k, 28, 2, 2);
      curvedRoof(c, cx, 6, hw + 6, 22, 5);
      x += hw;
    }
  });
}
const HANOK_ROWS: { key: string; x0: number; x1: number; line: number; seed: number }[] = [
  { key: 'a1', x0: SE.bukchonX0, x1: SE.stair.x0, line: SE.rowA, seed: 11 },
  { key: 'a2', x0: SE.stair.x1, x1: SE.W, line: SE.rowA, seed: 23 },
  { key: 'b1', x0: SE.bukchonX0, x1: SE.stair.x0, line: SE.rowB, seed: 37 },
  { key: 'b2', x0: SE.stair.x1, x1: SE.W, line: SE.rowB, seed: 41 },
];

// 平상：韓屋前的木頭平台（坐在上面）
function drawPyeongsang(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const half = Math.round(1.45 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 3, half * 2, 3);
  px(c, '#a8703f', cx - half, by - 12, half * 2, 14);
  for (let k = cx - half; k < cx + half; k += 5) px(c, '#946034', k, by - 12, 1, 14);
  px(c, '#c48a52', cx - half, by - 12, half * 2, 1);
  px(c, '#7a4a28', cx - half, by + 2, half * 2, 2);
  px(c, '#5a3a22', cx - half + 1, by + 2, 3, 3);
  px(c, '#5a3a22', cx + half - 4, by + 2, 3, 3);
  // 小茶盤
  px(c, '#6a3a22', cx - 3, by - 11, 7, 3);
  px(c, '#f4efe2', cx - 2, by - 13, 2, 2);
  px(c, '#f4efe2', cx + 1, by - 13, 2, 2);
}

// ── 清溪川：水的波紋（會動）、源頭的瀑布、青紗燈籠、溪邊石階 ──
function drawStreamWater(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const S = SE.stream;
  c.save();
  c.beginPath();
  c.rect(S.x0 * T + 10, S.water0 * T, (SE.W - S.x0) * T - 10, (S.water1 - S.water0) * T);
  c.clip();
  for (let i = 0; i < 46; i += 1) {
    const y = S.water0 * T + 6 + (((i * 37) % 97) / 97) * ((S.water1 - S.water0) * T - 12);
    const x = S.x0 * T + (((i * 131 + d.seconds * (10 + (i % 4) * 3)) % ((SE.W - S.x0) * T + 20)) - 10);
    px(c, `rgba(225,245,255,${0.3 + 0.2 * Math.sin(d.seconds * 1.6 + i)})`, Math.round(x), Math.round(y), 5 + (i % 3) * 2, 1);
  }
  if (d.night) {
    // 晚上燈光倒映在水上
    for (let x = S.x0 * T + 20; x < SE.W * T; x += 32) px(c, `rgba(255,214,140,${0.35 + 0.15 * Math.sin(d.seconds * 2 + x)})`, x, S.water0 * T + 4, 2, 24);
  }
  c.restore();
  // 源頭：清溪廣場的瀑布
  const fx = S.x0 * T + 2;
  for (let k = 0; k < 6; k += 1) {
    const yy = S.walk0 * T + ((d.seconds * 30 + k * 9) % 28);
    px(c, 'rgba(240,250,255,0.8)', fx + (k % 3) * 3, Math.round(yy), 2, 6);
  }
  px(c, 'rgba(220,240,250,0.6)', fx, S.walk0 * T, 9, 2);
  for (let k = 0; k < 4; k += 1) px(c, `rgba(255,255,255,${0.4 + 0.3 * Math.sin(d.seconds * 5 + k)})`, fx + 8 + k * 3, S.water0 * T + 4 + k * 5, 3, 2);
}
function drawChorongLine(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const S = SE.stream;
  const y = S.wall * T + 4;
  c.strokeStyle = '#3a3d45';
  c.lineWidth = 1;
  c.beginPath();
  let from = (S.x0 + 0.8) * T;
  for (const s of SE.stairsDown) {
    c.moveTo(from, y);
    c.lineTo(s.x0 * T - 2, y);
    from = s.x1 * T + 2;
  }
  c.moveTo(from, y);
  c.lineTo(SE.W * T, y);
  c.stroke();
  for (let x = (S.x0 + 1.4) * T; x < SE.W * T - 4; x += 30) {
    if (SE.stairsDown.some((s) => x > s.x0 * T - 4 && x < s.x1 * T + 4)) continue;
    // 青紗燈籠：上面藍、下面紅、金色的蓋
    px(c, '#c9a24a', x - 3, y, 6, 2);
    px(c, '#2a4aa8', x - 3, y + 2, 6, 4);
    px(c, '#d8262a', x - 3, y + 6, 6, 5);
    px(c, '#c9a24a', x - 2, y + 11, 4, 1);
    px(c, '#d8262a', x, y + 12, 1, 3);
    if (d.night) glow(c, x, y + 6, 14, '255, 190, 140', 0.55);
  }
}
function drawStreamStep(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(STREAM_STEP_Y * T);
  const half = Math.round(1.4 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 2, half * 2, 3);
  px(c, '#b8b0a0', cx - half, by - 6, half * 2, 8);
  px(c, '#d6cebe', cx - half, by - 6, half * 2, 2);
  for (let k = cx - half + 11; k < cx + half; k += 11) px(c, '#a0988a', k, by - 4, 1, 6);
}

// ── 明洞：一排大樓（招牌另外畫，晚上會亮會閃） ──
const MD_BUILDINGS: { w: number; h: number; wall: string; glass: boolean }[] = [
  { w: 6, h: 92, wall: '#d8d2c6', glass: false },
  { w: 5, h: 78, wall: '#c4ccd6', glass: true },
  { w: 7.1, h: 100, wall: '#e8e2d6', glass: false },
  { w: 6, h: 84, wall: '#b8c2cc', glass: true },
  { w: 7, h: 96, wall: '#d6c8b6', glass: false },
];
function mdBuildingsSprite(): HTMLCanvasElement {
  const w = Math.round((SE.mdX1 - SE.mdX0) * T);
  const h = 100;
  return cached('se-md-row', w, h, (c) => {
    const rand = seeded(1898);
    let x = 0;
    for (const b of MD_BUILDINGS) {
      const bw = Math.round(b.w * T);
      const top = h - b.h;
      px(c, b.wall, x, top, bw, b.h);
      px(c, 'rgba(0,0,0,0.12)', x + bw - 2, top, 2, b.h);
      px(c, 'rgba(255,255,255,0.3)', x, top, bw, 2);
      // 屋頂的冷氣、水塔
      px(c, '#9aa0a8', x + 6, top - 5, 10, 5);
      if (rand() < 0.6) px(c, '#e8e8ea', x + bw - 18, top - 7, 8, 7);
      // 樓上的窗
      for (let y = top + 6; y < h - 30; y += 10) {
        if (b.glass) {
          px(c, '#5a7a94', x + 3, y, bw - 6, 8);
          for (let k = x + 3; k < x + bw - 3; k += 7) px(c, '#3f5a72', k, y, 1, 8);
          px(c, 'rgba(255,255,255,0.25)', x + 4, y + 1, 3, 3);
        } else {
          for (let k = x + 5; k + 8 < x + bw - 3; k += 12) {
            px(c, '#4a5a6a', k, y, 8, 7);
            px(c, 'rgba(255,255,255,0.3)', k + 1, y + 1, 2, 2);
          }
        }
      }
      // 一樓的店面：亮亮的玻璃、架子上的商品、雨棚
      px(c, '#2a2e36', x + 2, h - 26, bw - 4, 26);
      px(c, '#fff4d8', x + 5, h - 22, bw - 10, 20);
      for (let k = x + 7; k < x + bw - 7; k += 5) {
        px(c, ['#e86a9a', '#6ab0e8', '#f0c860', '#9ae0b0'][Math.floor(rand() * 4)] ?? '#e86a9a', k, h - 18, 3, 3);
        px(c, ['#e86a9a', '#6ab0e8', '#f0c860', '#9ae0b0'][Math.floor(rand() * 4)] ?? '#6ab0e8', k, h - 11, 3, 3);
      }
      px(c, '#c9ccd2', x + 5, h - 15, bw - 10, 1);
      px(c, '#2a2e36', x + Math.round(bw / 2) - 1, h - 22, 2, 22);
      px(c, 'rgba(0,0,0,0.25)', x + 2, h - 27, bw - 4, 2);
      x += bw;
    }
  });
}
// 招牌：x、y 是世界座標格（左上），v = 直的
const MD_SIGNS: { x: number; y: number; w: number; h: number; text: string; color: string; bg: string; v?: boolean; font?: number }[] = [
  { x: 8.1, y: 29.2, w: 64, h: 12, text: '화장품 美妝', color: '#ff6ab0', bg: '#2a1a2a' },
  { x: 12.4, y: 28.2, w: 12, h: 46, text: '換錢所', color: '#ffe04a', bg: '#7a1a1a', v: true },
  { x: 14.2, y: 30.2, w: 52, h: 11, text: '분식 小吃', color: '#ffffff', bg: '#d8262a' },
  { x: 18.9, y: 27.8, w: 96, h: 13, text: '명동 MYEONGDONG', color: '#5ae0ff', bg: '#10203a' },
  { x: 25.4, y: 28.4, w: 12, h: 52, text: '노래방', color: '#ff5ad6', bg: '#1a1a3a', v: true },
  { x: 26.6, y: 30.4, w: 58, h: 11, text: '韓服租借', color: '#ffffff', bg: '#2a8a6a' },
  { x: 31.8, y: 28.8, w: 44, h: 12, text: '치킨', color: '#ffd23f', bg: '#3a1a10' },
  { x: 35.9, y: 28.6, w: 12, h: 40, text: '카페', color: '#9affb0', bg: '#1a2a20', v: true },
];
function drawMdSigns(c: CanvasRenderingContext2D, d: DrawCtx): void {
  MD_SIGNS.forEach((s, i) => {
    const x = Math.round(s.x * T);
    const y = Math.round(s.y * T);
    // 晚上有的招牌偶爾閃一下
    const flicker = d.night && i % 3 === 1 && Math.sin(d.seconds * 7 + i * 3) > 0.92;
    const col = flicker ? 'rgba(255,255,255,0.25)' : s.color;
    px(c, '#15171f', x - 1, y - 1, s.w + 2, s.h + 2);
    px(c, s.bg, x, y, s.w, s.h);
    if (s.v) {
      [...s.text].forEach((ch, k) => text(c, ch, x + s.w / 2, y + 7 + k * 12, col, `900 9px ${FONT_KR}`));
    } else {
      text(c, s.text, x + s.w / 2, y + s.h / 2 + 0.5, col, `900 ${s.h > 12 ? 9 : 8}px ${FONT_KR}`);
    }
    if (d.night && !flicker) {
      const rgb = s.color === '#ffffff' ? '255, 240, 220' : `${parseInt(s.color.slice(1, 3), 16)}, ${parseInt(s.color.slice(3, 5), 16)}, ${parseInt(s.color.slice(5, 7), 16)}`;
      glow(c, x + s.w / 2, y + s.h / 2, Math.max(s.w, s.h) * 0.7, rgb, 0.35);
    }
  });
}

// ── 舊首爾驛（1925）：紅磚、白色石材的線腳、中間綠色的圓頂、兩邊小塔 ──
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((SE.station.x1 - SE.station.x0) * T);
  const h = 100;
  return cached('se-station', w, h, (c) => {
    const cx = w / 2;
    const brick = (x: number, y: number, bw: number, bh: number) => {
      px(c, '#a8483a', x, y, bw, bh);
      for (let yy = y; yy < y + bh; yy += 3) {
        px(c, '#923c30', x, yy + 2, bw, 1);
        for (let xx = x + ((yy / 3) % 2) * 3; xx < x + bw; xx += 6) px(c, '#923c30', Math.round(xx), yy, 1, 2);
      }
    };
    // 兩邊的翼：石板屋頂、紅磚牆、白色的線腳、拱窗
    px(c, '#4a5a56', 6, 36, w - 12, 8);
    px(c, '#5f706a', 6, 36, w - 12, 2);
    brick(8, 44, w - 16, h - 52);
    px(c, '#e8e0d0', 6, 44, w - 12, 3);
    px(c, '#e8e0d0', 8, 68, w - 16, 2);
    px(c, '#bdb5a5', 4, h - 8, w - 8, 8);
    for (const row of [50, 74]) {
      for (let x = 16; x < w - 16; x += 14) {
        if (Math.abs(x + 4 - cx) < 46) continue;
        px(c, '#f4efe2', x - 1, row, 10, 15);
        px(c, '#2f3d4a', x, row + 2, 8, 12);
        px(c, '#f4efe2', x + 3, row + 2, 1, 12);
      }
    }
    // 兩端的小塔（綠色尖頂）
    for (const tx of [16, w - 16]) {
      brick(tx - 9, 26, 18, 18);
      px(c, '#e8e0d0', tx - 10, 26, 20, 2);
      c.fillStyle = '#5a9a86';
      c.beginPath();
      c.moveTo(tx - 10, 26);
      c.quadraticCurveTo(tx, 18, tx, 8);
      c.quadraticCurveTo(tx, 18, tx + 10, 26);
      c.fill();
      px(c, '#3f7a68', tx - 1, 12, 2, 14);
      px(c, '#2f3d4a', tx - 3, 32, 6, 8);
    }
    // 中央：往前突出的大廳、三個大拱門、時鐘
    brick(cx - 42, 34, 84, h - 42);
    px(c, '#e8e0d0', cx - 44, 32, 88, 3);
    px(c, '#e8e0d0', cx - 42, 58, 84, 2);
    for (const ax of [cx - 26, cx, cx + 26]) {
      px(c, '#e8e0d0', ax - 10, h - 36, 20, 28);
      c.fillStyle = '#e8e0d0';
      c.beginPath();
      c.arc(ax, h - 36, 10, Math.PI, 0);
      c.fill();
      px(c, '#2a3440', ax - 7, h - 34, 14, 26);
      c.fillStyle = '#2a3440';
      c.beginPath();
      c.arc(ax, h - 34, 7, Math.PI, 0);
      c.fill();
      px(c, 'rgba(255,230,170,0.5)', ax - 6, h - 20, 12, 12);
    }
    for (let x = cx - 36; x < cx + 36; x += 12) {
      px(c, '#f4efe2', x, 40, 8, 14);
      px(c, '#2f3d4a', x + 1, 42, 6, 12);
    }
    // 圓頂：鼓座、綠色銅頂、肋、頂上的小亭
    brick(cx - 20, 22, 40, 12);
    for (let x = cx - 16; x < cx + 16; x += 8) px(c, '#2f3d4a', x, 25, 4, 6);
    px(c, '#e8e0d0', cx - 22, 20, 44, 2);
    c.fillStyle = '#5a9a86';
    c.beginPath();
    c.ellipse(cx, 20, 20, 15, 0, Math.PI, 0);
    c.fill();
    c.strokeStyle = '#3f7a68';
    c.lineWidth = 1;
    for (const dx of [-12, -5, 5, 12]) {
      c.beginPath();
      c.moveTo(cx + dx, 20);
      c.quadraticCurveTo(cx + dx * 0.7, 8, cx, 5);
      c.stroke();
    }
    px(c, 'rgba(255,255,255,0.25)', cx - 12, 10, 3, 6);
    px(c, '#5a9a86', cx - 4, 0, 8, 6);
    px(c, '#3f7a68', cx - 4, 5, 8, 1);
    px(c, '#c9a24a', cx - 1, -2, 2, 3);
    // 時鐘
    c.fillStyle = '#f4efe2';
    c.beginPath();
    c.arc(cx, 48, 5, 0, Math.PI * 2);
    c.fill();
    px(c, '#2a2a2a', cx, 45, 1, 3);
    px(c, '#2a2a2a', cx, 48, 3, 1);
    // 站名
    px(c, '#1f2a44', cx - 30, 60, 60, 9);
    text(c, '서울역  SEOUL STATION', cx, 64.5, '#f4efe2', `900 5px ${FONT_KR}`);
  });
}
// 機場快線的站牌
function drawArexSign(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(44 * T);
  const by = Math.round(35.2 * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 4, by - 1, 8, 2);
  px(c, '#5a5d66', cx - 1, by - 22, 2, 22);
  px(c, '#1f5fa8', cx - 20, by - 36, 40, 16);
  px(c, '#f4f6f8', cx - 20, by - 36, 40, 1);
  text(c, '✈ AREX', cx, by - 31.5, '#ffffff', `900 6px ${FONT_TC}`);
  text(c, '機場快線 공항철도', cx, by - 24.5, '#dbeafe', `700 4.5px ${FONT_KR}`);
  if (d.night) glow(c, cx, by - 28, 30, '140, 190, 255', 0.4);
}

// ── N 首爾塔（遠方南山上，晚上換顏色） ──
function drawNamsanTower(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(50.5 * T);
  const base = Math.round(3.4 * T);
  px(c, '#e4e8ec', cx - 3, base - 6, 6, 6);
  px(c, '#eef1f4', cx - 1, base - 30, 3, 26);
  px(c, '#c9ced6', cx + 1, base - 30, 1, 26);
  // 展望台
  const lit = d.night ? (['#6ab0ff', '#ff6ad5', '#b07aff', '#5affc8'][Math.floor(d.seconds / 4) % 4] ?? '#6ab0ff') : '#3a4a5a';
  px(c, '#eef1f4', cx - 5, base - 37, 11, 8);
  px(c, lit, cx - 5, base - 35, 11, 2);
  px(c, '#eef1f4', cx - 3, base - 41, 7, 4);
  // 天線（紅白）
  for (let k = 0; k < 4; k += 1) px(c, k % 2 ? '#f4f6f8' : '#d8382a', cx, base - 52 + k * 3, 1, 3);
  if (d.night) {
    glow(c, cx, base - 34, 18, '200, 180, 255', 0.5);
    px(c, '#ff4a4a', cx, base - 53, 1, 1);
  }
}

// ── 樹：銀杏（首爾的行道樹，秋天金黃）、宮裡的松樹 ──
function drawGinkgo(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  px(c, '#5c3d22', cx - 1, by - 14, 3, 14);
  const blobs: [number, number, number, string][] = [
    [0, -36, 6, '#e8b830'],
    [-5, -28, 7, '#d8a020'],
    [5, -28, 7, '#e8b830'],
    [0, -22, 8, '#f0c840'],
    [-6, -18, 5, '#d8a020'],
    [6, -18, 5, '#f0c840'],
  ];
  for (const [dx, dy, r, col] of blobs) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#f8e070', cx - 2, by - 38, 3, 2);
  px(c, '#e8b830', cx - 9, by - 1, 3, 1);
  px(c, '#f0c840', cx + 7, by, 2, 1);
}
function drawPine(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 9, by - 1, 18, 3);
  px(c, '#8a4a2a', cx - 1, by - 22, 3, 22);
  px(c, '#8a4a2a', cx + 1, by - 16, 5, 2);
  for (const [dx, dy, w] of [[-9, -32, 14], [-2, -38, 12], [-6, -26, 18], [2, -22, 12]] as const) {
    px(c, '#2f5a36', cx + dx, by + dy, w, 5);
    px(c, '#3f6e44', cx + dx + 1, by + dy, w - 2, 2);
  }
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = SEOUL_SEATS[i];
  if (s && i >= 8) drawStool(c, s.x, s.y, '#2f6fb0');
}

const LAMPS: [number, number][] = [[2, 15.9], [16, 15.9], [28, 15.9], [40, 15.9], [54, 15.9], [9, 20.1], [24, 20.1], [36, 20.1], [47, 20.1], [2, 34], [20, 34], [37.6, 34], [55, 34], [7, 42.8], [33, 42.8]];
const GINKGO: [number, number][] = [[10, 15.8], [22, 15.8], [34.5, 15.8], [48.5, 15.8], [3, 20.2], [16.5, 20.2], [30.5, 20.2], [42, 20.2], [54, 20.2], [4.5, 28], [1.2, 31]];
const PINES: [number, number][] = [[31.6, 12.6], [31.4, 15], [1, 12.4], [7.2, 12.3]];

const S = SE.stream;
const gx = (SE.gate.x0 + SE.gate.x1) / 2;
const props: CityProp[] = [
  { y: 1, draw: (c, d) => drawNamsanTower(c, d) },
  { y: 9.2, draw: (c) => blit(c, palaceHallsSprite(), 0, 9.2 * T) },
  { y: SE.palaceLine, draw: (c) => blit(c, palaceWallSprite(), 0, SE.palaceLine * T) },
  { y: SE.palaceLine + 0.9, draw: (c) => drawGateGuards(c) },
  { y: SE.palaceLine + 1.4, draw: (c) => drawHaechi(c, SE.gate.x0 - 1.4, SE.palaceLine + 1.4, 1) },
  { y: SE.palaceLine + 1.4, draw: (c) => drawHaechi(c, SE.gate.x1 + 1.4, SE.palaceLine + 1.4, -1) },
  { y: CEREMONY_Y, draw: (c, d) => drawCeremony(c, d) },
  ...HANBOK.map((p): CityProp => ({ y: p.y, draw: (c, d) => drawHanbokPerson(c, p, d) })),
  ...HANOK_ROWS.map((r): CityProp => ({ y: r.line, draw: (c) => blit(c, hanokRowSprite(r.key, r.x0, r.x1, r.seed), r.x0 * T, r.line * T) })),
  ...PYEONGSANG.map((x): CityProp => ({ y: PYEONGSANG_Y - 0.01, draw: (c) => drawPyeongsang(c, x, PYEONGSANG_Y) })),
  { y: S.wall + 0.05, draw: (c, d) => drawChorongLine(c, d) },
  { y: S.water0 + 0.01, draw: (c, d) => drawStreamWater(c, d) },
  ...STREAM_STEPS.map((x): CityProp => ({ y: STREAM_STEP_Y - 0.01, draw: (c) => drawStreamStep(c, x) })),
  { y: SE.mdLine, draw: (c) => blit(c, mdBuildingsSprite(), SE.mdX0 * T, SE.mdLine * T) },
  { y: SE.mdLine + 0.01, draw: (c, d) => drawMdSigns(c, d) },
  ...MD_CARTS.map((s, i): CityProp => ({ y: SE.cartY, draw: (c, d) => drawFoodCart(c, s.x, SE.cartY, s.name, s.awning, s.food, d.seconds + i * 0.37, 91 + i * 7) })),
  ...MD_TABLES.map((x): CityProp => ({ y: MD_TABLE_Y, draw: (c) => drawMarketTable(c, x, MD_TABLE_Y) })),
  { y: SE.mdLine, draw: (c) => blit(c, stationSprite(), SE.station.x0 * T, SE.mdLine * T) },
  { y: 35.2, draw: (c, d) => drawArexSign(c, d) },
  ...GINKGO.map(([x, y]): CityProp => ({ y, draw: (c) => drawGinkgo(c, x, y) })),
  ...PINES.map(([x, y]): CityProp => ({ y, draw: (c) => drawPine(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 中間留缺口的一條（石階、踏腳石）
const withGaps = (x0: number, x1: number, y0: number, y1: number, gaps: readonly { x0: number; x1: number }[]): Rect[] => {
  const out: Rect[] = [];
  let x = x0;
  for (const g of [...gaps].sort((a, b) => a.x0 - b.x0)) {
    if (g.x0 > x) out.push(r(x, y0, g.x0, y1));
    x = g.x1;
  }
  if (x < x1) out.push(r(x, y0, x1, y1));
  return out;
};
const solid: Rect[] = [
  // 景福宮、北村的韓屋（石坡道留著）
  r(0, 0, SE.palaceX1, SE.palaceLine - 0.1),
  r(SE.palaceX1, 0, SE.bukchonX0, SE.palaceLine + 0.2),
  ...withGaps(SE.bukchonX0, SE.W, 0, SE.rowB - 0.1, [SE.stair]),
  r(SE.stair.x0, 0, SE.stair.x1, 3.6),
  r(SE.gate.x0 - 2, SE.palaceLine + 0.9, SE.gate.x0 - 0.8, SE.palaceLine + 1.4),
  r(SE.gate.x1 + 0.8, SE.palaceLine + 0.9, SE.gate.x1 + 2, SE.palaceLine + 1.4),
  ...PYEONGSANG.map((x) => r(x - 1.45, PYEONGSANG_Y - 0.8, x + 1.45, PYEONGSANG_Y - 0.45)),
  // 清溪川：北邊石牆（石階留著）、水（踏腳石留著）、南邊石牆（上去明洞的石階留著）、西端
  ...withGaps(S.x0, SE.W, S.wall, S.walk0 - 0.05, SE.stairsDown),
  ...withGaps(S.x0, SE.W, S.water0 + 0.1, S.water1 - 0.1, SE.stones),
  ...withGaps(S.x0, SE.W, S.walk1 + 0.05, S.top, [SE.stairsUp]),
  r(S.x0, S.wall, S.x0 + 0.65, S.top),
  ...STREAM_STEPS.map((x) => r(x - 1.4, STREAM_STEP_Y - 0.75, x + 1.4, STREAM_STEP_Y - 0.4)),
  // 明洞的大樓、首爾站
  r(SE.mdX0, S.top, SE.mdX1, SE.mdLine - 0.1),
  r(SE.station.x0, S.top, SE.W, SE.mdLine - 0.1),
  ...MD_CARTS.map((s) => r(s.x - 1.25, SE.cartY - 0.8, s.x + 1.25, SE.cartY - 0.05)),
  ...MD_TABLES.map((x) => r(x - 1.2, MD_TABLE_Y - 0.4, x + 1.2, MD_TABLE_Y)),
  r(43.8, 34.9, 44.3, 35.2),
  r(0, SE.bottom, SE.W, SE.H),
  ...GINKGO.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...PINES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...MD_CARTS.map((s) => ({ x: s.x * T, y: SE.cartY * T - 14, r: 40, color: 'rgba(255, 180, 120, 0.5)' })),
  ...MD_SIGNS.map((s) => ({ x: s.x * T + s.w / 2, y: s.y * T + s.h / 2, r: Math.max(s.w, s.h) * 0.75, color: s.color === '#ffffff' ? 'rgba(255, 240, 220, 0.45)' : `rgba(${parseInt(s.color.slice(1, 3), 16)}, ${parseInt(s.color.slice(3, 5), 16)}, ${parseInt(s.color.slice(5, 7), 16)}, 0.5)` })),
  { x: gx * T, y: SE.palaceLine * T - 50, r: 130, color: 'rgba(255, 200, 130, 0.45)' },
  { x: gx * T, y: SE.palaceLine * T - 10, r: 70, color: 'rgba(255, 220, 160, 0.4)' },
  ...[12, 22, 32, 42, 52].map((x) => ({ x: x * T, y: S.water0 * T, r: 60, color: 'rgba(255, 200, 140, 0.35)' })),
  { x: 50.5 * T, y: 3.4 * T - 34, r: 20, color: 'rgba(200, 160, 255, 0.5)' },
  { x: ((SE.station.x0 + SE.station.x1) / 2) * T, y: SE.mdLine * T - 40, r: 110, color: 'rgba(255, 220, 170, 0.45)' },
  ...[37.6, 52].map((x) => ({ x: x * T, y: SE.rowB * T - 20, r: 50, color: 'rgba(255, 210, 150, 0.4)' })),
];

const stationX = 48;

export const SEOUL: CityDef = {
  id: 'seoul',
  country: 'kr',
  line: 'metro',
  W: SE.W,
  H: SE.H,
  title: { 'zh-TW': '首爾 · 景福宮與明洞', 'en-US': 'Seoul · Gyeongbokgung & Myeongdong' },
  stop: { 'zh-TW': '首爾（首爾站 AREX）', 'en-US': 'Seoul (Seoul Station · AREX)' },
  emoji: '🏯',
  station: {
    x: stationX,
    y: SE.mdLine + 0.6,
    name: { 'zh-TW': '首爾站（機場快線 AREX）', 'en-US': 'Seoul Station (AREX)' },
    arrive: { x: stationX + 3, y: SE.mdLine + 1.2 },
  },
  background: '#d8ccc0',
  soundscape: 'market',
  paintGround: paintSeoulGround,
  props,
  solid,
  seats: SEOUL_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: SEOUL_SHOPS,
  infos: [
    {
      at: r(SE.gate.x0, 3, SE.gate.x1, SE.palaceLine),
      title: { 'zh-TW': '景福宮・光化門', 'en-US': 'Gyeongbokgung · Gwanghwamun' },
      text: {
        'zh-TW': '景福宮是朝鮮王朝 1395 年蓋的正宮，1592 年壬辰倭亂燒毀，1867 年重建。光化門是正南門：石造城門開三個拱門，上面是木造樓閣、屋簷下畫著丹青。日治時期被移走，韓戰燒毀，2010 年才用木頭照原位復原。後面的山是北岳山。（地圖上把勤政殿畫得比較靠近城門。）',
        'en-US': 'Gyeongbokgung, the Joseon dynasty’s main palace, was built in 1395, burned in 1592 and rebuilt in 1867. Gwanghwamun is its south gate: a stone base with three arches under a wooden pavilion painted in dancheong. Moved under Japanese rule and burned in the Korean War, it was restored in wood on its original site in 2010. Behind it rises Bugaksan. (The throne hall is drawn closer to the gate than it really is.)',
      },
    },
    {
      at: r(1, 12.4, 30, 15),
      title: { 'zh-TW': '守門將換崗儀式', 'en-US': 'Royal Guard Changing Ceremony' },
      text: {
        'zh-TW': '照朝鮮時代的紀錄重現，守門將穿紅、藍、黃的傳統服，拿旗子、打鼓，在光化門前交接。實際每天 10 點和 14 點各一場（週二休息）；地圖上每兩分鐘一輪。穿韓服進古宮免門票，所以門口很多穿韓服的遊客。',
        'en-US': 'A re-enactment based on Joseon records: guards in red, blue and yellow robes, with flags and a drum, hand over the gate. In reality it runs daily at 10:00 and 14:00 (closed Tuesdays); here it loops every two minutes. Visitors in hanbok get into the palaces free — hence all the hanbok around.',
      },
    },
    {
      at: r(SE.bukchonX0, 3.4, SE.W, SE.rowB),
      title: { 'zh-TW': '北村韓屋村', 'en-US': 'Bukchon Hanok Village' },
      text: {
        'zh-TW': '景福宮和昌德宮之間的山坡，保留了幾百間黑瓦白牆的傳統韓屋，石坡道一路往上。這裡還有人住，要小聲；部分區域限制觀光時間（10–17 點）。韓屋前的木頭平台叫「平床」（평상），夏天大家坐在上面乘涼。',
        'en-US': 'On the slope between Gyeongbokgung and Changdeokgung, hundreds of traditional tile-roofed hanok line stone lanes. People still live here — keep it quiet; parts limit visiting hours to 10:00–17:00. The wooden platforms (pyeongsang) are where neighbours sit out in summer.',
      },
    },
    {
      at: r(S.x0, S.wall, SE.W, S.walk1),
      title: { 'zh-TW': '清溪川', 'en-US': 'Cheonggyecheon Stream' },
      text: {
        'zh-TW': '市中心一條往下沉的小溪：1950–70 年代被蓋成馬路和高架道路，2005 年拆掉高架復原，從清溪廣場的瀑布開始往東流約 11 公里。可以踩踏腳石過溪，晚上有燈光，11 月有燈籠節。（實際清溪川在光化門南邊一點。）',
        'en-US': 'A sunken stream through downtown: paved over and topped with an elevated highway in the 1950s–70s, it was restored in 2005 and runs about 11 km east from the waterfall at Cheonggye Plaza. Cross on stepping stones; lit up at night, with a lantern festival each November. (In reality it starts a little south of Gwanghwamun.)',
      },
    },
    {
      at: r(SE.mdX0, 27.4, SE.mdX1, SE.bottom),
      title: { 'zh-TW': '明洞', 'en-US': 'Myeongdong' },
      text: {
        'zh-TW': '首爾最熱鬧的購物街，美妝店、換錢所一間接一間。傍晚街道中間會排起一整排小吃攤車：辣炒年糕、糖餅、雞蛋糕、魚板串、旋風馬鈴薯。（招牌上的字是編的。）',
        'en-US': 'Seoul’s busiest shopping street, packed with cosmetics shops and money changers. Toward evening a line of food carts fills the middle of the street: tteokbokki, hotteok, egg bread, fishcake skewers, tornado potatoes. (Shop signs are made up.)',
      },
    },
    {
      at: r(48, 0, 53, 3),
      title: { 'zh-TW': 'N 首爾塔', 'en-US': 'N Seoul Tower' },
      text: {
        'zh-TW': '南山上的電波塔，1971 年完工、1980 年開放上去參觀，晚上塔身會換顏色。山上欄杆掛滿情侶的愛情鎖。（實際南山在明洞南邊，地圖上為了當遠景放在北邊的天際線。）',
        'en-US': 'The broadcast tower on Namsan, finished in 1971 and opened to visitors in 1980; it glows in changing colours at night, and the railings below are covered in love locks. (Namsan is really just south of Myeongdong; it’s placed on the northern skyline here as a backdrop.)',
      },
    },
    {
      at: r(SE.station.x0, 27, SE.station.x1, SE.mdLine),
      title: { 'zh-TW': '舊首爾驛', 'en-US': 'Old Seoul Station' },
      text: {
        'zh-TW': '1925 年蓋的車站（當時叫京城驛），紅磚牆配綠色的圓頂，現在是文化空間「文化站首爾 284」，旁邊是新的首爾站。從這裡搭機場快線 AREX 直達仁川機場約 45 分鐘。（實際首爾站在明洞西南邊約 1.5 公里。）',
        'en-US': 'Built in 1925 (then Keijō Station) in red brick with a green dome, it’s now the arts venue “Culture Station Seoul 284”, next to the modern station. The AREX express reaches Incheon Airport in about 45 minutes. (In reality it’s about 1.5 km southwest of Myeongdong.)',
      },
    },
  ],
  labels: [
    { x: 26, y: S.walk1 - 0.05, text: { 'zh-TW': '🌊 清溪川（溪邊石階坐下專注）', 'en-US': '🌊 Cheonggyecheon (sit on the stone steps)' }, color: '#bae6fd' },
    { x: 44.5, y: 16.3, text: { 'zh-TW': '🏡 北村韓屋村（平床坐下）', 'en-US': '🏡 Bukchon (sit on a pyeongsang)' }, color: '#fde68a' },
    { x: 21, y: SE.bottom + 0.75, text: { 'zh-TW': '🍢 明洞小吃街', 'en-US': '🍢 Myeongdong street food' }, color: '#fda4af' },
  ],
  walkers: [
    { x0: 1, y0: 13.2, x1: 30, y1: 13.2, count: 2 },
    { x0: 1, y0: 16, x1: 55, y1: 16, count: 3 },
    { x0: 1, y0: 19.9, x1: 55, y1: 19.9, count: 3 },
    { x0: 9, y0: 22.1, x1: 55, y1: 22.1, count: 2 },
    { x0: 9, y0: 25.6, x1: 55, y1: 25.6, count: 2 },
    { x0: 3.5, y0: 20.8, x1: 3.5, y1: 34, count: 2 },
    { x0: 33, y0: 13.4, x1: 55, y1: 13.4, count: 1 },
    { x0: 1, y0: 35.2, x1: 55, y1: 35.2, count: 4 },
    { x0: 1, y0: 39.2, x1: 39, y1: 39.2, count: 3 },
    { x0: 41, y0: 38, x1: 55, y1: 38, count: 2 },
  ],
  traffic: [
    { y: 17.2, dir: -1, x0: 0, x1: SE.W, count: 3 },
    { y: 18.6, dir: 1, x0: 0, x1: SE.W, count: 3 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點清溪川的石階、北村的平床或明洞的小桌坐下專注 · 走到攤車買辣炒年糕、糖餅、雞蛋糕、魚板串 · 點地標看介紹 · 首爾站搭飛機回台灣',
    'en-US': 'WASD / arrows to move · click the Cheonggyecheon steps, a Bukchon pyeongsang or a Myeongdong table to focus · walk up to the carts for tteokbokki, hotteok, egg bread and fishcakes · click landmarks for info · Seoul Station to fly home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點石階、平床或小桌坐下專注 · 走到攤車買東西 · 點地標看介紹 · 首爾站',
    'en-US': 'Tap the steps, a pyeongsang or a table to focus · visit the carts · tap landmarks · Seoul Station',
  },
};
