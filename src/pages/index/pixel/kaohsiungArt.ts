// 高雄（鹽埕、愛河口、駁二一帶）的美術：五福四路的老店（鴨肉珍、港園牛肉麵）、愛河（石砌河岸、愛之船）、
// 駁二大義區的草地和裝置藝術、環狀輕軌（草皮軌道、會進站停一下的電車、駁二大義站）、駁二倉庫（彩色壁畫）、
// 東岸咖啡亭、高雄流行音樂中心（白色六角形的小館、主館兩座高塔）、高雄港（渡輪、貨輪）。最後組成 CityScene 用的 KAOHSIUNG。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CAFE_TABLES, CAFE_Y, KAOHSIUNG_SEATS, KAOHSIUNG_SHOPS, KH, LAWN_BENCHES, LAWN_BENCH_Y, NORTH_ROW, type KaohsiungHouse } from './kaohsiung';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, townhouseSprite, drawParkedScooter, SCOOTER_COLORS, drawStreetTree, drawLamp, drawFoodCart, drawBench } from './cityArt';

const WORDS = ['銀樓', '布行', '鐘錶', '西服', '冰果室', '書局', '眼鏡', '五金'];
const WATER = '#3f86a8';
const WATER_DEEP = '#2f6f92';

// ── 地面（畫一次）──
export function paintKaohsiungGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(707);
  const W = KH.W * T;
  tiles(c, { x0: 0, y0: 0, x1: KH.W, y1: KH.H }, '#d4cdc0', '#c2baac', 12);
  tiles(c, { x0: 0, y0: KH.northLine - 0.4, x1: KH.W, y1: KH.wufu.y0 }, '#b98f72', '#a87f63', 8);
  const wf = KH.wufu;
  road(c, { x0: 0, y0: wf.y0, x1: KH.W, y1: wf.y1 }, rand);
  const mid = ((wf.y0 + wf.y1) / 2) * T;
  px(c, '#e0b93a', 0, mid - 2, W, 1);
  px(c, '#e0b93a', 0, mid + 1, W, 1);
  zebra(c, 19.6, wf.y0 + 0.2, 21.2, wf.y1 - 0.2, false);
  zebra(c, 33.8, wf.y0 + 0.2, 35.4, wf.y1 - 0.2, false);
  // 西岸：駁二大義區的草地（中間一條小路）
  px(c, '#86ad5e', 0, 12.2 * T, KH.westWalk.x0 * T, (KH.platform.y0 - 12.2) * T);
  // 東岸河畔小公園
  px(c, '#86ad5e', KH.eastWalk.x1 * T, 12.2 * T, (KH.W - KH.eastWalk.x1) * T, (KH.rail.y0 - 12.2) * T);
  for (let i = 0; i < 1100; i += 1) {
    const gx = rand() * KH.W;
    const gy = 12.2 + rand() * (KH.rail.y0 - 12.2);
    if (gx > KH.westWalk.x0 - 0.1 && gx < KH.eastWalk.x1 + 0.1) continue;
    px(c, rand() < 0.5 ? '#76a050' : '#98bd6e', Math.floor(gx * T), Math.floor(gy * T), 2, 1);
  }
  tiles(c, { x0: 0, y0: 19.4, x1: KH.westWalk.x0, y1: 20.4 }, '#d9cfb8', '#c9bfa8', 8);
  tiles(c, { x0: 10.6, y0: 12.2, x1: 11.8, y1: 19.4 }, '#d9cfb8', '#c9bfa8', 8);
  tiles(c, { x0: KH.eastWalk.x1, y0: 19.6, x1: KH.W, y1: 20.6 }, '#d9cfb8', '#c9bfa8', 8);
  tiles(c, { x0: 36, y0: 15.6, x1: 43.2, y1: 19.6 }, '#e6ddcb', '#d6ccb8', 8);
  // 愛河兩岸步道（淺色石板＋欄杆另外畫）
  for (const wk of [KH.westWalk, KH.eastWalk]) tiles(c, { x0: wk.x0, y0: wf.y1, x1: wk.x1, y1: KH.rail.y0 }, '#e2dccf', '#cfc8b8', 8);
  // 月台前的廣場
  tiles(c, { x0: 0, y0: KH.platform.y0, x1: KH.westWalk.x0, y1: KH.rail.y0 }, '#d4cdc0', '#c2baac', 12);
  // 環狀輕軌：草皮軌道＋兩條鋼軌（過河那段是橋）
  const ry0 = KH.rail.y0 * T;
  const ry1 = KH.rail.y1 * T;
  px(c, '#7fb05a', 0, ry0, W, ry1 - ry0);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#6f9e4c' : '#92c26a', Math.floor(rand() * W), Math.floor(ry0 + rand() * (ry1 - ry0)), 2, 1);
  // 倉庫那一帶、音樂中心前的鋪面
  tiles(c, { x0: 0, y0: KH.rail.y1, x1: KH.W, y1: KH.shoreY }, '#cfc6b6', '#bdb4a3', 12);
  // 港邊木棧步道
  px(c, '#a8825a', 0, KH.shoreY * T, W, (KH.harborY - KH.shoreY) * T);
  for (let x = 0; x < W; x += 6) px(c, '#93704a', x, KH.shoreY * T, 1, (KH.harborY - KH.shoreY) * T);
  // 愛河：石砌河岸＋水（北段從街屋中間流出來）、出海口接到高雄港
  const rv = KH.river;
  const river = (y0: number, y1: number) => {
    px(c, '#8f8a80', rv.x0 * T, y0 * T, (rv.x1 - rv.x0) * T, (y1 - y0) * T);
    px(c, WATER, (rv.x0 + 0.4) * T, y0 * T, (rv.x1 - rv.x0 - 0.8) * T, (y1 - y0) * T);
    px(c, WATER_DEEP, (rv.x0 + 0.4) * T, y0 * T, 3, (y1 - y0) * T);
    px(c, WATER_DEEP, (rv.x1 - 0.4) * T - 3, y0 * T, 3, (y1 - y0) * T);
  };
  river(0, wf.y0);
  river(wf.y1, KH.rail.y0);
  river(KH.rail.y1, KH.shoreY);
  // 高雄港
  px(c, WATER, 0, KH.harborY * T, W, (KH.H - KH.harborY) * T);
  for (let y = KH.harborY * T + 6; y < KH.H * T; y += 7) px(c, WATER_DEEP, 0, y, W, 2);
  px(c, '#8f8a80', 0, KH.harborY * T - 2, W, 3);
  // 輕軌過河的橋面、港邊步道過河的木橋（畫在河上）
  px(c, '#a9a59c', rv.x0 * T, ry0, (rv.x1 - rv.x0) * T, ry1 - ry0);
  px(c, '#a8825a', rv.x0 * T, KH.shoreY * T, (rv.x1 - rv.x0) * T, (KH.harborY - KH.shoreY) * T);
  for (let x = rv.x0 * T; x < rv.x1 * T; x += 6) px(c, '#93704a', x, KH.shoreY * T, 1, (KH.harborY - KH.shoreY) * T);
  for (const y of [ry0 + 8, ry1 - 8]) {
    px(c, '#9aa0aa', 0, y - 1, W, 2);
    px(c, '#c9ccd4', 0, y - 1, W, 1);
  }
  for (let x = 0; x < W; x += 6) px(c, 'rgba(80, 70, 60, 0.35)', x, ry0 + 6, 3, ry1 - ry0 - 12);
}

// 河面、港面的波光
function drawShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  const rv = KH.river;
  for (let i = 0; i < 22; i += 1) {
    const y = KH.wufu.y1 * T + ((i * 53 + seconds * 9) % ((KH.rail.y0 - KH.wufu.y1) * T));
    const x = (rv.x0 + 0.6) * T + ((i * 41) % ((rv.x1 - rv.x0 - 1.2) * T));
    px(c, `rgba(225, 240, 250, ${0.25 + 0.2 * Math.sin(seconds * 1.4 + i)})`, Math.round(x), Math.round(y), 5, 1);
  }
  for (let i = 0; i < 40; i += 1) {
    const x = (i * 97 + seconds * (8 + (i % 4))) % (KH.W * T);
    const y = KH.harborY * T + 6 + ((i * 29) % ((KH.H - KH.harborY) * T - 8));
    px(c, `rgba(225, 240, 250, ${0.18 + 0.15 * Math.sin(seconds + i)})`, Math.round(x), Math.round(y), 6, 1);
  }
}

// ── 北邊：鹽埕的老店 ──
function duckSprite(b: KaohsiungHouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 54;
  return cached('kh-duck', w, h, (c) => {
    px(c, '#e8dcc4', 0, 4, w, h - 4);
    for (let cx = 5; cx + 10 <= w - 4; cx += 14) {
      px(c, '#5a4636', cx - 1, 10, 12, 10);
      px(c, '#c9dbe6', cx, 11, 10, 8);
    }
    // 黃底紅字的大招牌
    px(c, '#f6c945', 2, 22, w - 4, 11);
    px(c, '#c62828', 2, 22, w - 4, 1);
    text(c, '鴨肉珍', w / 2, 27.5, '#c62828', `900 8px ${FONT_TC}`);
    px(c, '#3a2e28', 0, h - 20, w, 20);
    px(c, '#f6dfae', 3, h - 16, w - 6, 12);
    // 店門口的切肉台、一盤盤鴨肉
    px(c, '#c9ccd6', 4, h - 8, 22, 4);
    for (let k = 0; k < 3; k += 1) px(c, '#c98a5a', 6 + k * 6, h - 10, 4, 2);
  });
}

function beefSprite(b: KaohsiungHouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 54;
  return cached('kh-beef', w, h, (c) => {
    px(c, '#d9e4d6', 0, 4, w, h - 4);
    for (let cx = 5; cx + 10 <= w - 4; cx += 14) {
      px(c, '#5a4636', cx - 1, 10, 12, 10);
      px(c, '#9fc7c9', cx, 11, 10, 8);
    }
    px(c, '#7a1a14', 2, 22, w - 4, 11);
    px(c, '#c9a24a', 2, 22, w - 4, 1);
    text(c, '港園牛肉麵', w / 2, 27.5, '#f6e2a8', `900 7px ${SERIF_TC}`);
    px(c, '#3a2e28', 0, h - 20, w, 20);
    px(c, '#f4ecd8', 3, h - 16, w - 6, 12);
    // 煮麵的大鍋（冒煙在 drawNorthHouse）
    px(c, '#9aa3b2', w - 22, h - 10, 14, 6);
  });
}

function drawNorthHouse(c: CanvasRenderingContext2D, b: KaohsiungHouse, d: DrawCtx): void {
  const bottom = KH.northLine * T;
  if (b.special === 'duck') blit(c, duckSprite(b), b.x0 * T, bottom);
  else if (b.special === 'beef') {
    blit(c, beefSprite(b), b.x0 * T, bottom);
    const sx = b.x1 * T - 15;
    for (let k = 0; k < 3; k += 1) {
      const t = (d.seconds * 0.6 + k / 3) % 1;
      px(c, `rgba(255,255,255,${0.45 * (1 - t)})`, Math.round(sx + Math.sin(d.seconds * 2 + k) * 2), Math.round(bottom - 12 - t * 14), 3, 2);
    }
  } else blit(c, townhouseSprite('kh', b, WORDS), b.x0 * T, bottom);
}

// ── 駁二大義區：草地上的裝置藝術（紅色大圓環、彩色方塊堆）──
function drawSculptures(c: CanvasRenderingContext2D): void {
  // 紅色大圓環
  const rx = 3 * T;
  const ry = 14.6 * T;
  px(c, 'rgba(0,0,0,0.18)', rx - 14, ry + 1, 28, 3);
  c.strokeStyle = '#d6402c';
  c.lineWidth = 5;
  c.beginPath();
  c.arc(rx, ry - 16, 13, 0, Math.PI * 2);
  c.stroke();
  c.strokeStyle = '#f06a4a';
  c.lineWidth = 1;
  c.beginPath();
  c.arc(rx, ry - 16, 15, Math.PI * 1.1, Math.PI * 1.6);
  c.stroke();
  px(c, '#6b6f7a', rx - 2, ry - 3, 4, 4);
  // 彩色方塊堆
  const bx = 18.6 * T;
  const by = 19 * T;
  px(c, 'rgba(0,0,0,0.18)', bx - 14, by + 1, 28, 3);
  const cubes: [number, number, string][] = [
    [-12, -10, '#f6c945'], [-2, -10, '#3b82f6'], [8, -10, '#2bb673'],
    [-7, -20, '#e25a7a'], [3, -20, '#f29a3a'], [-2, -30, '#8a5ad9'],
  ];
  for (const [dx, dy, col] of cubes) {
    px(c, col, bx + dx, by + dy, 10, 10);
    px(c, 'rgba(255,255,255,0.35)', bx + dx, by + dy, 10, 2);
    px(c, 'rgba(0,0,0,0.18)', bx + dx + 8, by + dy, 2, 10);
  }
}

// ── 環狀輕軌：駁二大義站（月台、白色雨棚）、電車（照時間進站、停一下、開走）──
function drawPlatform(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const p = KH.platform;
  const x0 = p.x0 * T;
  const w = (p.x1 - p.x0) * T;
  const y = KH.rail.y0 * T;
  px(c, '#b9b4aa', x0, y - 8, w, 8);
  px(c, '#e6e2da', x0, y - 8, w, 2);
  px(c, '#f6c945', x0, y - 2, w, 2);
  // 雨棚（白色波浪頂）＋柱子
  for (let k = 0; k < 3; k += 1) px(c, '#9aa0aa', x0 + 16 + k * ((w - 32) / 2), y - 38, 3, 30);
  c.fillStyle = '#f4f6f8';
  c.beginPath();
  c.moveTo(x0 + 4, y - 36);
  for (let x = 0; x <= w - 8; x += 16) c.quadraticCurveTo(x0 + 4 + x + 8, y - 44, x0 + 4 + x + 16, y - 36);
  c.lineTo(x0 + w - 4, y - 32);
  c.lineTo(x0 + 4, y - 32);
  c.closePath();
  c.fill();
  px(c, '#cfd4da', x0 + 4, y - 33, w - 8, 1);
  // 站名牌
  px(c, '#1f6fa8', x0 + w / 2 - 30, y - 30, 60, 10);
  text(c, '駁二大義站 C12', x0 + w / 2, y - 25, '#ffffff', `800 5px ${FONT_TC}`);
  if (d.night) glow(c, x0 + w / 2, y - 22, 50, '220, 235, 255', 0.35);
}

const TRAM_CYCLE = 72;
function tramFront(seconds: number): number | null {
  const t = seconds % TRAM_CYCLE;
  const stop = (KH.platform.x0 + KH.platform.x1) / 2 + 4.8;
  if (t < 14) {
    const k = t / 14;
    return -12 + (stop + 12) * (1 - (1 - k) * (1 - k));
  }
  if (t < 26) return stop;
  if (t < 48) {
    const k = (t - 26) / 22;
    return stop + (KH.W + 14 - stop) * k * k;
  }
  return null;
}

// 電車：三節白色車廂、藍綠色飾條、車頭圓圓的（往東開）
function drawTram(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const front = tramFront(d.seconds);
  if (front === null) return;
  const by = Math.round(((KH.rail.y0 + KH.rail.y1) / 2) * T + 7);
  const carW = 50;
  for (let k = 0; k < 3; k += 1) {
    const x1 = Math.round(front * T - k * (carW + 2));
    const x0 = x1 - carW;
    px(c, 'rgba(0,0,0,0.25)', x0, by, carW, 3);
    c.fillStyle = '#f4f6f8';
    c.beginPath();
    if (k === 0) c.roundRect(x0, by - 22, carW, 22, [3, 9, 3, 3]);
    else c.roundRect(x0, by - 22, carW, 22, 3);
    c.fill();
    px(c, '#1fa3a3', x0, by - 7, carW, 3);
    px(c, '#1f6fa8', x0, by - 4, carW, 1);
    for (let wx = x0 + 4; wx + 8 <= x1 - 4; wx += 11) {
      px(c, '#2f3a42', wx, by - 18, 8, 8);
      px(c, d.night ? '#ffe9a8' : '#5a6a78', wx + 1, by - 17, 3, 3);
    }
    px(c, '#3a3d45', x0 + 6, by - 1, 6, 2);
    px(c, '#3a3d45', x1 - 12, by - 1, 6, 2);
  }
  // 車頂的集電弓
  const fx = Math.round(front * T - 25);
  px(c, '#3a3d45', fx - 4, by - 28, 8, 2);
  px(c, '#3a3d45', fx, by - 26, 1, 4);
  if (d.night) glow(c, front * T + 4, by - 10, 18, '255, 245, 210', 0.4);
}

// ── 駁二倉庫：紅磚／灰色的長倉庫、圓弧屋頂、外牆的彩色壁畫，中間那棟掛 PIER-2 的招牌 ──
function warehouseSprite(i: number): HTMLCanvasElement {
  const wh = KH.warehouses[i] ?? KH.warehouses[0];
  const w = Math.round((wh.x1 - wh.x0) * T);
  const h = 78;
  return cached(`kh-warehouse-${i}`, w, h, (c) => {
    const rand = seeded(500 + i);
    const base = h;
    const wall = i === 1 ? '#a8432e' : i === 0 ? '#7a7f88' : '#9a5a3a';
    // 圓弧屋頂（浪板）
    c.fillStyle = '#5e6572';
    c.beginPath();
    c.moveTo(0, 26);
    c.quadraticCurveTo(w / 2, -2, w, 26);
    c.closePath();
    c.fill();
    // 浪板線：只畫在弧線底下
    for (let x = 4; x < w; x += 6) {
      const t = x / w;
      const top = Math.ceil(26 - 56 * t * (1 - t)) + 2;
      if (top < 25) px(c, '#6e7582', x, top, 1, 26 - top);
    }
    px(c, wall, 0, 26, w, base - 26);
    for (let y = 28; y < base; y += 4) px(c, 'rgba(0,0,0,0.08)', 0, y, w, 1);
    // 壁畫：一大片彩色色塊（每棟不同）
    const colors = ['#f6c945', '#3b82f6', '#2bb673', '#e25a7a', '#f29a3a', '#8a5ad9', '#1fa3a3'];
    for (let k = 0; k < 7; k += 1) {
      const col = colors[Math.floor(rand() * colors.length)] ?? '#f6c945';
      const mx = Math.floor(rand() * (w - 30)) + 4;
      const my = 30 + Math.floor(rand() * 18);
      c.fillStyle = col;
      c.beginPath();
      c.ellipse(mx + 12, my + 6, 10 + rand() * 8, 5 + rand() * 4, rand(), 0, Math.PI * 2);
      c.fill();
    }
    // 大鐵門（拉門）＋小窗
    for (let k = 0; k < 2; k += 1) {
      const dx = Math.round(w * (0.22 + k * 0.42));
      px(c, '#3a3d45', dx, base - 26, 24, 26);
      for (let y = base - 24; y < base; y += 3) px(c, '#4a4e58', dx + 1, y, 22, 1);
      px(c, '#f6e2a8', dx + 4, base - 20, 16, 20);
    }
    if (i === 1) {
      px(c, '#15171f', w / 2 - 30, 30, 60, 14);
      text(c, 'PIER-2 駁二', w / 2, 37, '#ffffff', `900 8px ${FONT_TC}`);
    } else {
      px(c, '#ffffff', 6, 30, 26, 9);
      text(c, i === 0 ? '大義倉庫' : '大勇倉庫', 19, 34.5, '#3a3d45', `800 5px ${FONT_TC}`);
    }
  });
}

// ── 高雄流行音樂中心：港邊的白色六角形小館（三座）、主館（波浪屋頂＋兩座高塔）──
function hexSprite(): HTMLCanvasElement {
  const w = Math.round((KH.hexes.x1 - KH.hexes.x0) * T);
  const h = 60;
  return cached('kh-hexes', w, h, (c) => {
    const base = h;
    const unit = w / 3;
    for (let k = 0; k < 3; k += 1) {
      const cx = unit * k + unit / 2;
      const hh = 34 + (k % 2) * 12;
      const top = base - hh;
      // 六角柱：正面梯形＋兩側斜面
      c.fillStyle = '#f4f6f8';
      c.beginPath();
      c.moveTo(cx - unit / 2 + 3, base);
      c.lineTo(cx - unit / 2 + 3, top + 6);
      c.lineTo(cx - unit / 4, top);
      c.lineTo(cx + unit / 4, top);
      c.lineTo(cx + unit / 2 - 3, top + 6);
      c.lineTo(cx + unit / 2 - 3, base);
      c.closePath();
      c.fill();
      px(c, '#d6dbe2', Math.round(cx + unit / 4), top + 1, Math.round(unit / 4 - 3), hh - 1);
      // 六角形的格紋
      c.strokeStyle = '#c9d1da';
      c.lineWidth = 1;
      for (let gy = top + 8; gy < base - 8; gy += 9) {
        for (let gx = cx - unit / 2 + 8 + ((gy / 9) % 2) * 4; gx < cx + unit / 2 - 8; gx += 9) {
          c.beginPath();
          for (let s = 0; s < 6; s += 1) {
            const a = (s / 6) * Math.PI * 2;
            const x = gx + Math.cos(a) * 3.5;
            const y = gy + Math.sin(a) * 3.5;
            if (s === 0) c.moveTo(x, y);
            else c.lineTo(x, y);
          }
          c.closePath();
          c.stroke();
        }
      }
      px(c, '#2f3a42', Math.round(cx - 6), base - 12, 12, 12);
      px(c, '#9fc7d6', Math.round(cx - 5), base - 11, 10, 6);
    }
  });
}

function hallSprite(): HTMLCanvasElement {
  const w = Math.round((KH.hall.x1 - KH.hall.x0) * T);
  const h = 122;
  return cached('kh-hall', w, h, (c) => {
    const base = h;
    // 兩座高塔（白色、上面細細的格子）
    for (const tx of [w * 0.62, w * 0.8]) {
      const tw = 20;
      const tTop = tx === w * 0.62 ? 4 : 18;
      px(c, '#f4f6f8', Math.round(tx - tw / 2), tTop, tw, base - tTop);
      px(c, '#d6dbe2', Math.round(tx + tw / 2 - 5), tTop, 5, base - tTop);
      for (let y = tTop + 6; y < base - 40; y += 6) px(c, '#c9d1da', Math.round(tx - tw / 2 + 2), y, tw - 7, 1);
      px(c, '#e8ecf0', Math.round(tx - tw / 2 - 2), tTop - 3, tw + 4, 4);
    }
    // 主館：波浪的白色屋頂、整面玻璃
    const top = base - 46;
    px(c, '#e8ecf0', 0, top + 10, w, base - top - 10);
    c.fillStyle = '#f8fafb';
    c.beginPath();
    c.moveTo(0, top + 14);
    for (let x = 0; x <= w; x += 30) c.quadraticCurveTo(x + 15, top - 6, x + 30, top + 14);
    c.lineTo(w, top + 18);
    c.lineTo(0, top + 18);
    c.closePath();
    c.fill();
    px(c, '#cfd6de', 0, top + 18, w, 2);
    px(c, '#5a7a90', 4, top + 24, w - 8, base - top - 30);
    for (let x = 6; x < w - 6; x += 8) px(c, '#8fb2c6', x, top + 25, 1, base - top - 32);
    px(c, '#9fc7d6', 6, top + 26, w - 12, 3);
    px(c, '#2f3a42', w * 0.3, base - 14, 30, 14);
    px(c, '#15171f', 10, top + 28, 74, 10);
    text(c, '高雄流行音樂中心', 47, top + 33, '#ffffff', `800 6px ${FONT_TC}`);
  });
}

function drawMusicCenter(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, hexSprite(), KH.hexes.x0 * T, KH.shoreY * T);
  blit(c, hallSprite(), KH.hall.x0 * T, KH.shoreY * T);
  if (d.night) {
    const w = (KH.hall.x1 - KH.hall.x0) * T;
    glow(c, KH.hall.x0 * T + w * 0.4, KH.shoreY * T - 20, 70, '120, 190, 255', 0.35);
    glow(c, KH.hall.x0 * T + w * 0.62, KH.shoreY * T - 110, 22, '180, 120, 255', 0.45);
    glow(c, KH.hall.x0 * T + w * 0.8, KH.shoreY * T - 96, 22, '255, 120, 200', 0.45);
  }
}

// ── 愛之船：在兩座橋中間來回開的小遊船（白色船身、藍色頂棚）──
const BOATS = [0, 0.5];
function drawLoveBoat(c: CanvasRenderingContext2D, phase: number, d: DrawCtx): void {
  const y0 = KH.wufu.y1 + 1.8;
  const y1 = KH.rail.y0 - 1.2;
  const span = y1 - y0;
  const t = ((d.seconds * 0.35) / span + phase) % 2;
  const y = t < 1 ? y0 + t * span : y1 - (t - 1) * span;
  const x = ((KH.river.x0 + KH.river.x1) / 2 + (phase > 0.2 ? 0.9 : -0.9)) * T;
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', Math.round(x - 9), by + 1, 18, 3);
  c.fillStyle = '#f4f6f8';
  c.beginPath();
  c.roundRect(Math.round(x - 9), by - 26, 18, 28, 8);
  c.fill();
  px(c, '#d6dbe2', Math.round(x - 9), by - 4, 18, 4);
  c.fillStyle = '#2f7ac8';
  c.beginPath();
  c.roundRect(Math.round(x - 7), by - 22, 14, 14, 3);
  c.fill();
  px(c, '#f6c945', Math.round(x - 7), by - 9, 14, 1);
  if (d.night) {
    px(c, '#ffe9a8', Math.round(x - 1), by - 25, 2, 2);
    glow(c, x, by - 14, 16, '255, 230, 160', 0.35);
  }
}

// 港裡的船：旗津渡輪（往返）、遠遠的貨輪
function drawHarborBoats(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const W = KH.W * T;
  // 渡輪
  const fx = ((d.seconds * 14) % (W + 160)) - 80;
  const fy = (KH.harborY + 3) * T;
  px(c, 'rgba(0,0,0,0.2)', Math.round(fx - 30), Math.round(fy) + 1, 60, 3);
  px(c, '#f4f6f8', Math.round(fx - 30), Math.round(fy) - 10, 60, 10);
  px(c, '#e8641c', Math.round(fx - 30), Math.round(fy) - 3, 60, 3);
  px(c, '#f4f6f8', Math.round(fx - 18), Math.round(fy) - 18, 34, 8);
  for (let k = 0; k < 5; k += 1) px(c, '#2f3a42', Math.round(fx - 16 + k * 6), Math.round(fy) - 16, 4, 4);
  // 貨輪（慢慢往西）
  const sx = W + 120 - ((d.seconds * 5) % (W + 360));
  const sy = (KH.H - 0.6) * T;
  px(c, '#2f4a6a', Math.round(sx - 70), Math.round(sy) - 12, 140, 12);
  px(c, '#c62828', Math.round(sx - 70), Math.round(sy) - 3, 140, 3);
  const boxes = ['#e25a4a', '#3b82f6', '#2bb673', '#f6c945', '#8a5ad9'];
  for (let k = 0; k < 9; k += 1) px(c, boxes[k % boxes.length] ?? '#e25a4a', Math.round(sx - 60 + k * 12), Math.round(sy) - 22, 11, 10);
  px(c, '#f4f6f8', Math.round(sx + 52), Math.round(sy) - 30, 14, 18);
}

// 河岸、港邊的欄杆（白色鐵欄杆）
function drawRiverRails(c: CanvasRenderingContext2D): void {
  const rv = KH.river;
  for (const x of [rv.x0, rv.x1 - 0.12]) {
    const xx = Math.round(x * T);
    px(c, '#e8ecf0', xx, KH.wufu.y1 * T, 2, (KH.rail.y0 - KH.wufu.y1) * T);
  }
}

// 咖啡亭（東岸）：木頭小亭子、綠色遮陽棚
function drawKiosk(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const k = KH.kiosk;
  const x0 = k.x0 * T;
  const w = (k.x1 - k.x0) * T;
  const by = k.y * T;
  px(c, 'rgba(0,0,0,0.2)', x0, by, w, 3);
  px(c, '#b08a5e', x0 + 4, by - 26, w - 8, 26);
  px(c, '#2f3a42', x0 + 10, by - 20, w - 20, 12);
  px(c, '#f6e2a8', x0 + 12, by - 18, w - 24, 8);
  px(c, '#8a5a32', x0 + 4, by - 8, w - 8, 3);
  for (let x = 0; x < w + 4; x += 6) px(c, (x / 6) % 2 === 0 ? '#2a7a46' : '#f4f1e8', x0 - 2 + x, by - 32, 6, 6);
  px(c, '#15171f', x0 + w / 2 - 18, by - 40, 36, 8);
  text(c, 'RIVER CAFÉ', x0 + w / 2, by - 36, '#f6e2a8', '800 5px system-ui, sans-serif');
  if (d.night) glow(c, x0 + w / 2, by - 14, 30, '255, 220, 150', 0.4);
}

function drawCafeTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const y = Math.round(CAFE_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, y + 2, 12, 2);
  px(c, '#3a3d45', cx - 1, y - 6, 2, 8);
  c.fillStyle = '#f2efe6';
  c.beginPath();
  c.ellipse(cx, y - 7, 7, 3, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#7a4a2a', cx - 2, y - 9, 2, 2);
  px(c, '#f2a65a', cx + 1, y - 9, 2, 2);
}

// 座位：草地長椅（另外畫）、河邊長椅（側面，椅背在背對河那邊）、咖啡椅
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = KAOHSIUNG_SEATS[i];
  if (!s || i < 4) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  const back = s.facing === 'right' ? x - 6 : x + 4;
  px(c, 'rgba(0,0,0,0.2)', x - 6, y + 1, 12, 2);
  px(c, '#8a5a32', x - 6, y - 4, 12, 4);
  px(c, '#b5804a', x - 6, y - 4, 12, 1);
  px(c, '#6b4a2f', back, y - 13, 2, 13);
  px(c, '#3a3d45', x - 5, y, 2, 2);
  px(c, '#3a3d45', x + 3, y, 2, 2);
}

// ── 組成 CityScene 用的資料 ──
const TREES: [number, number][] = [[1.6, 21], [8.4, 13.4], [14, 13.4], [20.6, 21], [35, 13.6], [44.6, 13.6], [50.4, 13.6], [47, 21.6], [53.6, 21.6]];
const LAMPS: [number, number][] = [
  [3, 11.6], [12, 11.6], [21, 11.6], [34, 11.6], [43, 11.6], [52, 11.6],
  [22.4, 16.2], [22.4, 21.2], [32.6, 16.2], [32.6, 21.2],
  [4, 30.6], [12, 30.6], [20, 30.6], [36, 30.6], [46, 30.6], [54, 30.6],
];
const SCOOTERS: [number, number][] = [1.2, 2.4, 3.6, 10.8, 12, 20, 21.2, 32.4, 33.6, 42.4, 43.6, 47.4, 48.6, 52.6, 53.8].map((x): [number, number] => [x, 8.5]);

const props: CityProp[] = [
  ...NORTH_ROW.map((b): CityProp => ({ y: KH.northLine, draw: (c, d) => drawNorthHouse(c, b, d) })),
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[(i * 5) % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
  { y: 0.1, draw: (c, d) => drawShimmer(c, d.seconds) },
  { y: KH.wufu.y1 + 0.05, draw: (c) => drawRiverRails(c) },
  ...BOATS.map((phase): CityProp => ({ y: KH.wufu.y1 + 0.1, draw: (c, d) => drawLoveBoat(c, phase, d) })),
  { y: 19, draw: (c) => drawSculptures(c) },
  { y: KH.milkCart.y, draw: (c, d) => drawFoodCart(c, KH.milkCart.x, KH.milkCart.y, '木瓜牛奶', '#f29a3a', ['#f29a3a', '#f6c27a', '#f29a3a'], d.seconds, 11) },
  ...LAWN_BENCHES.map((x): CityProp => ({ y: LAWN_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, LAWN_BENCH_Y, 2.6) })),
  { y: KH.kiosk.y, draw: (c, d) => drawKiosk(c, d) },
  ...CAFE_TABLES.map((x): CityProp => ({ y: CAFE_Y, draw: (c) => drawCafeTable(c, x) })),
  { y: KH.rail.y0, draw: (c, d) => drawPlatform(c, d) },
  { y: KH.rail.y1 - 0.1, draw: (c, d) => drawTram(c, d) },
  ...KH.warehouses.map((wh, i): CityProp => ({ y: KH.shoreY, draw: (c) => blit(c, warehouseSprite(i), wh.x0 * T, KH.shoreY * T) })),
  { y: KH.shoreY, draw: (c, d) => drawMusicCenter(c, d) },
  { y: KH.H, draw: (c, d) => drawHarborBoats(c, d) },
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const rv = KH.river;
const solid: Rect[] = [
  r(0, 0, rv.x0, KH.northLine - 0.3),
  r(rv.x1, 0, KH.W, KH.northLine - 0.3),
  // 愛河（五福四路的橋、輕軌的橋、港邊步道的木橋可以走）
  r(rv.x0, 0, rv.x1, KH.wufu.y0 + 0.2),
  r(rv.x0 + 0.05, KH.wufu.y1 - 0.15, rv.x1 - 0.05, KH.rail.y0),
  r(rv.x0, KH.rail.y1, rv.x1, KH.shoreY),
  // 港
  r(0, KH.harborY - 0.2, KH.W, KH.H),
  // 倉庫、音樂中心
  ...KH.warehouses.map((wh) => r(wh.x0, KH.warehouseY0, wh.x1, KH.shoreY - 0.2)),
  r(KH.hexes.x0, KH.shoreY - 2.6, KH.hexes.x1, KH.shoreY - 0.2),
  r(KH.hall.x0, KH.shoreY - 2.8, KH.hall.x1, KH.shoreY - 0.2),
  // 月台、攤車、咖啡亭、桌子、長椅背、裝置藝術
  r(KH.platform.x0, KH.rail.y0 - 0.6, KH.platform.x1, KH.rail.y0 - 0.05),
  r(KH.milkCart.x - 1.3, KH.milkCart.y - 1.6, KH.milkCart.x + 1.3, KH.milkCart.y - 0.1),
  r(KH.kiosk.x0, KH.kiosk.y - 1.8, KH.kiosk.x1, KH.kiosk.y - 0.1),
  ...CAFE_TABLES.map((x) => r(x - 0.4, CAFE_Y - 0.35, x + 0.4, CAFE_Y + 0.2)),
  ...LAWN_BENCHES.map((x) => r(x - 1.3, LAWN_BENCH_Y - 0.75, x + 1.3, LAWN_BENCH_Y - 0.45)),
  r(2.2, 14.1, 3.8, 14.7),
  r(17.8, 18.4, 19.6, 19.1),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...NORTH_ROW.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: KH.northLine * T - 10, r: 28, color: 'rgba(255, 214, 150, 0.42)' })),
  ...KH.warehouses.map((wh) => ({ x: ((wh.x0 + wh.x1) / 2) * T, y: KH.shoreY * T - 12, r: 46, color: 'rgba(255, 210, 150, 0.4)' })),
  { x: KH.milkCart.x * T, y: KH.milkCart.y * T - 20, r: 30, color: 'rgba(255, 220, 150, 0.5)' },
  // 愛河兩岸的燈帶
  ...[13, 15.5, 18, 20.5].flatMap((y) => [
    { x: rv.x0 * T + 2, y: y * T, r: 14, color: 'rgba(255, 150, 220, 0.5)' },
    { x: rv.x1 * T - 2, y: y * T, r: 14, color: 'rgba(150, 210, 255, 0.5)' },
  ]),
];

export const KAOHSIUNG: CityDef = {
  id: 'kaohsiung',
  W: KH.W,
  H: KH.H,
  title: { 'zh-TW': '高雄 · 駁二與愛河', 'en-US': 'Kaohsiung · Pier-2 & Love River' },
  stop: { 'zh-TW': '高雄（駁二）', 'en-US': 'Kaohsiung (Pier-2)' },
  emoji: '⚓',
  station: {
    x: (KH.platform.x0 + KH.platform.x1) / 2,
    y: KH.platform.y0 - 0.5,
    name: { 'zh-TW': '輕軌駁二大義站', 'en-US': 'Light Rail · Pier-2 Dayi' },
    arrive: { x: (KH.platform.x0 + KH.platform.x1) / 2 + 1.6, y: KH.platform.y0 - 0.9 },
  },
  background: '#d4cdc0',
  soundscape: 'beach',
  paintGround: paintKaohsiungGround,
  props,
  solid,
  seats: KAOHSIUNG_SEATS,
  drawSeat,
  shops: KAOHSIUNG_SHOPS,
  infos: [
    { at: r(KH.warehouses[0].x0, KH.warehouseY0 - 2, KH.warehouses[2].x1, KH.shoreY), title: { 'zh-TW': '駁二藝術特區', 'en-US': 'Pier-2 Art Center' }, text: { 'zh-TW': '原本是高雄港「第二號接駁碼頭」的倉庫，2002 年起改成藝術特區，倉庫外牆畫滿壁畫，草地上有很多大型裝置藝術。', 'en-US': 'Warehouses of the harbour’s "Second Pier", turned into an art district from 2002 — murals on the walls and big installations on the lawns.' } },
    { at: r(rv.x0, KH.wufu.y1, rv.x1, KH.rail.y0), title: { 'zh-TW': '愛河', 'en-US': 'Love River' }, text: { 'zh-TW': '流過高雄市中心、在這裡流進高雄港。晚上兩岸燈光很漂亮，可以搭愛之船遊河。', 'en-US': 'Flows through downtown Kaohsiung into the harbour here. Lovely lights at night — take a Love Boat cruise.' } },
    { at: r(KH.hexes.x0, KH.shoreY - 7, KH.hall.x1, KH.shoreY), title: { 'zh-TW': '高雄流行音樂中心', 'en-US': 'Kaohsiung Music Center' }, text: { 'zh-TW': '2021 年全區開幕，港邊白色六角形的小館和兩座高塔，是高雄港的新地標。', 'en-US': 'Fully opened in 2021 — white hexagonal pavilions and two towers on the waterfront, a new harbour landmark.' } },
    { at: r(KH.platform.x0, KH.platform.y0 - 1.8, KH.platform.x1, KH.rail.y1), title: { 'zh-TW': '環狀輕軌', 'en-US': 'Circular Light Rail' }, text: { 'zh-TW': '沿著港邊繞一圈的輕軌，軌道上鋪著草皮，駁二大義站就在倉庫旁邊。', 'en-US': 'A light rail looping along the harbour on grassy tracks; Pier-2 Dayi station is right by the warehouses.' } },
    { at: r(4.6, 3, 9.8, KH.northLine), title: { 'zh-TW': '鴨肉珍', 'en-US': 'Ya Rou Zhen' }, text: { 'zh-TW': '鹽埕的老店，招牌是淋上鴨汁的鴨肉飯。', 'en-US': 'An old Yancheng shop famous for duck rice with duck sauce.' } },
    { at: r(14, 3, 19, KH.northLine), title: { 'zh-TW': '港園牛肉麵', 'en-US': 'Kang Yuan Beef Noodles' }, text: { 'zh-TW': '鹽埕的老店，牛肉拌麵很有名。', 'en-US': 'An old Yancheng shop known for its dry beef noodles.' } },
  ],
  labels: [
    { x: (rv.x0 + rv.x1) / 2, y: 17.2, text: { 'zh-TW': '💞 愛河（河邊長椅專注）', 'en-US': '💞 Love River (benches to focus)' }, color: '#f472b6' },
    { x: 11, y: 12.9, text: { 'zh-TW': '🎨 駁二大義區', 'en-US': '🎨 Pier-2 Dayi' }, color: '#fbbf24' },
    { x: 46, y: KH.shoreY - 7.4, text: { 'zh-TW': '🎵 高雄流行音樂中心', 'en-US': '🎵 Kaohsiung Music Center' }, color: '#60a5fa' },
    { x: 28, y: KH.H - 2.6, text: { 'zh-TW': '⚓ 高雄港', 'en-US': '⚓ Kaohsiung Harbour' }, color: '#e2e8f0' },
  ],
  walkers: [
    { x0: 1, y0: 8.05, x1: 23, y1: 8.05, count: 2 },
    { x0: 32, y0: 8.05, x1: 55, y1: 8.05, count: 2 },
    { x0: 1, y0: 11.75, x1: 55, y1: 11.75, count: 4 },
    { x0: 23.4, y0: 12.4, x1: 23.4, y1: 22, count: 1 },
    { x0: 31.6, y0: 12.4, x1: 31.6, y1: 22, count: 1 },
    { x0: 1, y0: 19.9, x1: 21.5, y1: 19.9, count: 2 },
    { x0: 34, y0: 20.1, x1: 55, y1: 20.1, count: 2 },
    { x0: 1, y0: 30.4, x1: 55, y1: 30.4, count: 5 },
    { x0: 1, y0: 24.7, x1: 55, y1: 24.7, count: 2 },
  ],
  traffic: [
    { y: 9.6, dir: -1, x0: 0, x1: KH.W, count: 3 },
    { y: 10.9, dir: 1, x0: 0, x1: KH.W, count: 3 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點駁二草地、愛河邊的長椅或河畔咖啡的位子坐下專注 · 走到鴨肉珍、港園、攤車、咖啡亭買東西 · 點地標看介紹 · 輕軌駁二大義站搭車回台北',
    'en-US': 'WASD / arrows to move · click a lawn or riverside bench or a café seat to focus · walk up to shops, the cart or the café to buy · click landmarks for info · Pier-2 Dayi light rail station back to Taipei',
  },
  hintTouch: {
    'zh-TW': '點長椅、咖啡位子坐下專注 · 走到店門口、攤車買東西 · 點地標看介紹 · 輕軌站回台北',
    'en-US': 'Tap a bench or café seat to focus · walk up to shops to buy · tap landmarks for info · light rail back to Taipei',
  },
};
