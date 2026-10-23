// 南投日月潭的美術：湖（湖水、波光、遠山）、水社的店（日月潭紅茶、山豬肉香腸）、遊客中心、巴士站、水社碼頭、
// 向山自行車道和水上步道、拉魯島、玄光寺（小山丘、石階）、玄光寺碼頭、阿婆茶葉蛋、慈恩塔、來回開的遊艇。最後組成 CityScene 用的 SUNMOON。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { NORTH_BENCHES, NORTH_BENCH_Y, NORTH_ROW, SM, SUNMOON_SEATS, SUNMOON_SHOPS, TEA_TABLE, type SunMoonHouse } from './sunmoon';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, tiles, townhouseSprite, drawLamp, drawFoodCart, drawBench } from './cityArt';

const WORDS = ['民宿', '飯店', '紀念品', '茶行', '餐廳'];
const LAKE = '#3f8fa0';
const LAKE_DEEP = '#2f7a8c';
const GRASS = '#7fa65a';

// ── 地面（畫一次）──
export function paintSunMoonGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1313);
  const W = SM.W * T;
  const H = SM.H * T;
  px(c, GRASS, 0, 0, W, H);
  for (let i = 0; i < 2200; i += 1) px(c, rand() < 0.5 ? '#6c9149' : '#93b86a', Math.floor(rand() * W), Math.floor(rand() * H), 2, 1);
  // 西邊向山的山坡：深綠的樹林
  px(c, '#4f7a3c', 0, 0, SM.hillX1 * T, H);
  for (let i = 0; i < 600; i += 1) px(c, rand() < 0.5 ? '#3f6a32' : '#5f8a48', Math.floor(rand() * SM.hillX1 * T), Math.floor(rand() * H), 4, 3);
  // 北岸後面的遠山
  c.fillStyle = '#5a8a48';
  c.beginPath();
  c.moveTo(SM.hillX1 * T, 0);
  c.lineTo(W, 0);
  c.lineTo(W, 30);
  for (let x = W; x >= SM.hillX1 * T; x -= 40) c.lineTo(x, 22 + Math.sin(x * 0.03) * 10);
  c.closePath();
  c.fill();
  // 自行車道（紅褐色、白色中線）
  const b = SM.bike;
  px(c, '#a8665a', b.x0 * T, 0, (b.x1 - b.x0) * T, H);
  for (let y = 0; y < H; y += 16) px(c, 'rgba(255,255,255,0.75)', ((b.x0 + b.x1) / 2) * T - 1, y, 2, 8);
  px(c, '#8f5248', b.x0 * T, 0, 2, H);
  // 北岸湖邊步道
  tiles(c, { x0: b.x1, y0: SM.northLine - 0.4, x1: SM.W, y1: SM.shoreN }, '#d9d2c3', '#c4bcad', 10);
  // 湖
  const lk = SM.lake;
  px(c, LAKE, lk.x0 * T, lk.y0 * T, W - lk.x0 * T, (lk.y1 - lk.y0) * T);
  for (let y = lk.y0 * T + 6; y < lk.y1 * T; y += 8) px(c, LAKE_DEEP, lk.x0 * T, y, W - lk.x0 * T, 2);
  px(c, '#9a948a', lk.x0 * T, lk.y0 * T - 2, W - lk.x0 * T, 3);
  px(c, '#9a948a', lk.x0 * T, lk.y1 * T - 1, W - lk.x0 * T, 3);
  // 東邊湖對岸的山（遠遠的）
  c.fillStyle = '#6a9a58';
  c.beginPath();
  c.moveTo(W, lk.y0 * T + 10);
  c.quadraticCurveTo(W - 40, (lk.y0 + lk.y1) * 0.5 * T, W, lk.y1 * T - 10);
  c.closePath();
  c.fill();
  // 拉魯島
  const la = SM.lalu;
  c.fillStyle = '#c9b88a';
  c.beginPath();
  c.ellipse(la.cx * T, la.cy * T, (la.rx + 0.3) * T, (la.ry + 0.3) * T, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#5f9a4a';
  c.beginPath();
  c.ellipse(la.cx * T, la.cy * T - 2, la.rx * T, la.ry * T, 0, 0, Math.PI * 2);
  c.fill();
  // 水上自行車道（木棧板架在湖面）
  const fb = SM.floatBike;
  px(c, '#a8825a', fb.x0 * T, fb.y0 * T, (fb.x1 - fb.x0) * T, (fb.y1 - fb.y0) * T);
  for (let y = fb.y0 * T; y < fb.y1 * T; y += 5) px(c, '#93704a', fb.x0 * T, Math.round(y), (fb.x1 - fb.x0) * T, 1);
  // 兩座碼頭
  for (const [x0, y0, x1, y1] of [[SM.pierN.x0, SM.shoreN, SM.pierN.x1, SM.pierN.y1], [SM.pierS.x0, SM.pierS.y0, SM.pierS.x1, SM.lake.y1]] as const) {
    px(c, '#8a6a46', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let y = y0 * T; y < y1 * T; y += 5) px(c, '#755a3a', x0 * T, Math.round(y), (x1 - x0) * T, 1);
    for (const x of [x0, x1 - 0.2]) for (let y = y0 + 0.5; y < y1; y += 1.2) px(c, '#4a3a28', x * T, y * T, 3, 5);
  }
  // 南岸：湖邊步道、玄光寺的小山丘＋石階
  tiles(c, { x0: b.x1, y0: SM.lake.y1, x1: SM.W, y1: SM.lake.y1 + 2.2 }, '#d9d2c3', '#c4bcad', 10);
  const tp = SM.temple;
  c.fillStyle = '#6c9149';
  c.beginPath();
  c.ellipse(((tp.x0 + tp.x1) / 2) * T, (tp.y - 1.6) * T, ((tp.x1 - tp.x0) / 2 + 2.4) * T, 3.6 * T, 0, 0, Math.PI * 2);
  c.fill();
  for (let k = 0; k < 6; k += 1) px(c, k % 2 ? '#c9c2b4' : '#ddd6c8', ((tp.x0 + tp.x1) / 2 - 1.2) * T, (tp.y + 0.2) * T + k * 5, 2.4 * T, 5);
  // 慈恩塔的山
  c.fillStyle = '#5f8a48';
  c.beginPath();
  c.ellipse(SM.pagoda.x * T, (SM.pagoda.y + 1) * T, 7 * T, 3.4 * T, 0, Math.PI, 0);
  c.fill();
  px(c, '#5f8a48', (SM.pagoda.x - 7) * T, (SM.pagoda.y + 1) * T, 14 * T, (SM.H - SM.pagoda.y - 1) * T);
}

function drawLakeShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  const lk = SM.lake;
  const x0 = (lk.x0 + 0.6) * T;
  const w = SM.W * T - x0;
  for (let i = 0; i < 60; i += 1) {
    const x = x0 + ((i * 97 + seconds * (5 + (i % 4))) % w);
    const y = (lk.y0 + 0.4) * T + ((i * 37) % ((lk.y1 - lk.y0 - 0.8) * T));
    const la = SM.lalu;
    if (((x / T - la.cx) / (la.rx + 0.5)) ** 2 + ((y / T - la.cy) / (la.ry + 0.5)) ** 2 < 1) continue;
    px(c, `rgba(230, 245, 245, ${0.2 + 0.18 * Math.sin(seconds * 1.2 + i)})`, Math.round(x), Math.round(y), 6, 1);
  }
}

// 針葉樹（向山的山坡、湖邊）
function drawPine(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 3);
  px(c, '#5c3d22', cx - 1, by - 8, 3, 8);
  for (let k = 0; k < 3; k += 1) {
    const w = 18 - k * 5;
    c.fillStyle = k % 2 ? '#3f7a3c' : '#2f6a32';
    c.beginPath();
    c.moveTo(cx - w / 2, by - 6 - k * 8);
    c.lineTo(cx, by - 18 - k * 8);
    c.lineTo(cx + w / 2, by - 6 - k * 8);
    c.closePath();
    c.fill();
  }
}

// ── 北岸：店、遊客中心、巴士站 ──
function shopSprite(b: SunMoonHouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 54;
  return cached(`sm-shop-${b.special}`, w, h, (c) => {
    const base = h;
    const tea = b.special === 'tea';
    px(c, '#6b4a2f', 0, 2, w, 6);
    for (let x = 0; x < w; x += 4) px(c, '#7a5638', x, 2, 2, 6);
    px(c, tea ? '#e8dcc4' : '#d9c7a8', 0, 8, w, base - 8);
    for (let cx = 5; cx + 10 <= w - 4; cx += 14) {
      px(c, '#5a4636', cx - 1, 11, 12, 9);
      px(c, '#b8d6d8', cx, 12, 10, 7);
    }
    px(c, tea ? '#7a1a14' : '#2a4a2a', 2, 23, w - 4, 10);
    text(c, tea ? '日月潭紅茶' : '山豬肉香腸', w / 2, 28, '#f6e2a8', `900 7px ${SERIF_TC}`);
    px(c, '#3a2e28', 0, base - 20, w, 20);
    px(c, '#f6e2b8', 3, base - 16, w - 6, 12);
    if (tea) for (let k = 0; k < 5; k += 1) px(c, '#8a3a2a', 6 + k * 7, base - 11, 5, 6);
    else {
      px(c, '#2b2d33', 6, base - 8, 28, 3);
      px(c, '#ff6a2b', 7, base - 7, 26, 1);
      for (let k = 0; k < 6; k += 1) px(c, '#b8442e', 8 + k * 4, base - 10, 3, 3);
    }
  });
}

function drawNorthHouse(c: CanvasRenderingContext2D, b: SunMoonHouse, d: DrawCtx): void {
  const bottom = SM.northLine * T;
  if (b.special) {
    blit(c, shopSprite(b), b.x0 * T, bottom);
    if (b.special === 'sausage') {
      for (let k = 0; k < 2; k += 1) {
        const t = (d.seconds * 0.5 + k / 2) % 1;
        px(c, `rgba(210,210,220,${0.3 * (1 - t)})`, Math.round(b.x0 * T + 18 + k * 8 + Math.sin(d.seconds + k) * 3), Math.round(bottom - 12 - t * 16), 4, 3);
      }
    }
  } else blit(c, townhouseSprite('sm', b, WORDS), b.x0 * T, bottom);
}

function visitorSprite(): HTMLCanvasElement {
  const w = Math.round((SM.visitor.x1 - SM.visitor.x0) * T);
  const h = 44;
  return cached('sm-visitor', w, h, (c) => {
    const base = h;
    px(c, '#f2efe8', 0, 10, w, base - 10);
    px(c, '#c9c4ba', 0, 10, w, 2);
    for (let x = 0; x < w; x += 5) px(c, '#b08a5e', x, 12, 3, 10);
    px(c, '#5a7a90', 4, 24, w - 8, base - 28);
    for (let x = 6; x < w - 6; x += 9) px(c, '#8fb2c6', x, 25, 1, base - 30);
    px(c, '#2f3a42', w / 2 - 10, base - 14, 20, 14);
    px(c, '#5e6572', -4, 4, w + 8, 7);
    px(c, '#2f6a4a', 8, 14, 56, 8);
    text(c, '日月潭遊客中心', 36, 18, '#ffffff', `800 5px ${FONT_TC}`);
  });
}

function drawBusStop(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = Math.round(SM.busStop.x * T);
  const y = Math.round(SM.busStop.y * T);
  px(c, 'rgba(0,0,0,0.2)', x - 18, y + 1, 32, 3);
  px(c, '#9fc3d6', x - 16, y - 22, 26, 20);
  px(c, '#2a7a46', x - 18, y - 26, 30, 4);
  px(c, '#3a3d45', x - 17, y - 22, 2, 22);
  px(c, '#3a3d45', x + 9, y - 22, 2, 22);
  px(c, '#8a5a32', x - 13, y - 8, 20, 3);
  px(c, '#3a3d45', x + 14, y - 30, 2, 30);
  c.fillStyle = '#2a7a46';
  c.beginPath();
  c.arc(x + 15, y - 32, 6, 0, Math.PI * 2);
  c.fill();
  text(c, '巴士', x + 15, y - 32, '#ffffff', `900 4px ${FONT_TC}`);
  if (d.night) glow(c, x - 3, y - 14, 20, '200, 230, 255', 0.3);
}

// ── 南岸：玄光寺（紅柱、黃瓦、匾額）、慈恩塔（九層、八角）──
function templeSprite(): HTMLCanvasElement {
  const w = Math.round((SM.temple.x1 - SM.temple.x0) * T);
  const h = 62;
  return cached('sm-temple', w, h, (c) => {
    const base = h;
    px(c, '#9a948a', 0, base - 6, w, 6);
    px(c, '#c9b48a', 6, base - 36, w - 12, 30);
    for (let i = 0; i < 4; i += 1) px(c, '#b71c1c', Math.round(10 + i * ((w - 26) / 3)), base - 34, 4, 28);
    px(c, '#4a1a12', w / 2 - 10, base - 28, 20, 22);
    for (let k = 0; k < 4; k += 1) px(c, '#8a5032', w / 2 - 8 + k * 5, base - 26, 1, 18);
    // 兩側的格窗
    for (const wx of [14, w - 30]) {
      px(c, '#4a1a12', wx, base - 28, 16, 12);
      for (let k = 2; k < 16; k += 3) px(c, '#c98a52', wx + k, base - 27, 1, 10);
      px(c, '#c98a52', wx + 1, base - 22, 14, 1);
    }
    c.fillStyle = '#d9a23a';
    c.beginPath();
    c.moveTo(-4, base - 34);
    c.lineTo(10, base - 50);
    c.lineTo(w - 10, base - 50);
    c.lineTo(w + 4, base - 34);
    c.closePath();
    c.fill();
    for (let k = 0; k < 14; k += 3) px(c, '#b8862a', 4 + k * 0.6, base - 48 + k, w - 8 - k * 1.2, 1);
    c.strokeStyle = '#8a5a1a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(4, base - 58);
    c.quadraticCurveTo(10, base - 50, 20, base - 52);
    c.lineTo(w - 20, base - 52);
    c.quadraticCurveTo(w - 10, base - 50, w - 4, base - 58);
    c.stroke();
    // 匾額（掛在屋簷前面）、兩顆紅燈籠
    px(c, '#15100c', w / 2 - 16, base - 40, 32, 9);
    px(c, '#c9a24a', w / 2 - 16, base - 40, 32, 1);
    px(c, '#c9a24a', w / 2 - 16, base - 32, 32, 1);
    text(c, '玄光寺', w / 2, base - 35.5, '#f2d27a', `900 7px ${SERIF_TC}`);
    for (const lx of [w / 2 - 24, w / 2 + 20]) {
      px(c, '#d72d2d', lx, base - 32, 6, 8);
      px(c, '#f2c14e', lx, base - 32, 6, 1);
      px(c, '#f2c14e', lx, base - 25, 6, 1);
    }
  });
}

function pagodaSprite(): HTMLCanvasElement {
  const w = 44;
  const h = 132;
  return cached('sm-pagoda', w, h, (c) => {
    const base = h;
    let y = base;
    for (let k = 0; k < 9; k += 1) {
      const bw = 28 - k * 2;
      const fh = 11;
      px(c, '#efe6d6', w / 2 - bw / 2, y - fh, bw, fh);
      px(c, '#d6cdbd', w / 2 + bw / 2 - 4, y - fh, 4, fh);
      px(c, '#3a3d45', w / 2 - 2, y - fh + 3, 4, 5);
      // 每層的屋簷（翹角）
      c.fillStyle = '#5e6572';
      c.beginPath();
      c.moveTo(w / 2 - bw / 2 - 6, y - fh + 1);
      c.lineTo(w / 2 - bw / 2, y - fh - 3);
      c.lineTo(w / 2 + bw / 2, y - fh - 3);
      c.lineTo(w / 2 + bw / 2 + 6, y - fh + 1);
      c.closePath();
      c.fill();
      y -= fh + 3;
    }
    px(c, '#c9a24a', w / 2 - 1, y - 10, 2, 10);
    px(c, '#c9a24a', w / 2 - 3, y - 6, 6, 2);
  });
}

// 遊艇：在水社碼頭和玄光寺碼頭之間來回
const BOATS = [0, 0.5];
function drawBoat(c: CanvasRenderingContext2D, phase: number, d: DrawCtx): void {
  const a = { x: (SM.pierN.x0 + SM.pierN.x1) / 2 + 1.6, y: SM.pierN.y1 + 1 };
  const b = { x: (SM.pierS.x0 + SM.pierS.x1) / 2 + 1.6, y: SM.pierS.y0 - 1 };
  const cycle = 60;
  const t = ((d.seconds / cycle + phase) % 1) * 4;
  // 0–1 停在水社、1–2 開往玄光寺、2–3 停在玄光寺、3–4 開回來
  const k = t < 1 ? 0 : t < 2 ? (t - 1) ** 2 * (3 - 2 * (t - 1)) : t < 3 ? 1 : 1 - (t - 3) ** 2 * (3 - 2 * (t - 3));
  const x = (a.x + (b.x - a.x) * k + (phase > 0.2 ? 6 : 0)) * T;
  const y = (a.y + (b.y - a.y) * k) * T + Math.sin(d.seconds * 2 + phase * 7) * 1.2;
  px(c, 'rgba(0,0,0,0.2)', Math.round(x - 20), Math.round(y) + 1, 40, 3);
  c.fillStyle = '#f4f6f8';
  c.beginPath();
  c.roundRect(Math.round(x - 20), Math.round(y) - 10, 40, 10, 4);
  c.fill();
  px(c, phase > 0.2 ? '#c62828' : '#2f7ac8', Math.round(x - 20), Math.round(y) - 3, 40, 2);
  px(c, '#f4f6f8', Math.round(x - 12), Math.round(y) - 17, 22, 7);
  for (let i = 0; i < 3; i += 1) px(c, '#2f3a42', Math.round(x - 10 + i * 7), Math.round(y) - 15, 5, 3);
  if (d.night) glow(c, x, y - 10, 18, '255, 230, 160', 0.35);
}

// 水上步道的欄杆
function drawFloatRails(c: CanvasRenderingContext2D): void {
  const fb = SM.floatBike;
  for (let y = fb.y0 * T; y < fb.y1 * T; y += 6) px(c, '#e8ecf0', fb.x1 * T - 2, Math.round(y), 2, 6);
  px(c, '#f4f6f8', fb.x1 * T - 3, fb.y0 * T, 1, (fb.y1 - fb.y0) * T);
}

// 紅茶店門口的小木桌
function drawTeaTable(c: CanvasRenderingContext2D): void {
  const cx = Math.round(TEA_TABLE.x * T);
  const y = Math.round(TEA_TABLE.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 7, y + 2, 14, 2);
  px(c, '#8a5a32', cx - 7, y - 7, 14, 3);
  px(c, '#6b4a2f', cx - 6, y - 4, 2, 6);
  px(c, '#6b4a2f', cx + 4, y - 4, 2, 6);
  px(c, '#f2efe8', cx - 4, y - 10, 4, 3);
  px(c, '#8a3a2a', cx - 3, y - 10, 2, 1);
  px(c, '#f2efe8', cx + 1, y - 10, 4, 3);
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = SUNMOON_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  if (i === 4 || i === 5) {
    // 自行車道邊的木頭休息座（側面）
    px(c, 'rgba(0,0,0,0.2)', x - 6, y + 1, 12, 2);
    px(c, '#8a5a32', x - 6, y - 4, 12, 4);
    px(c, '#6b4a2f', x - 6, y - 13, 2, 13);
    return;
  }
  if (i >= 6 && i <= 9) {
    // 玄光寺前背對畫面的長椅：椅背畫在人前面（drawSeatFront）
    px(c, 'rgba(0,0,0,0.2)', x - 7, y + 1, 14, 2);
    px(c, '#8a5a32', x - 7, y - 4, 14, 4);
    return;
  }
  if (i >= 10) {
    px(c, 'rgba(0,0,0,0.2)', x - 5, y + 1, 10, 2);
    px(c, '#8a5a32', x - 5, y - 3, 10, 3);
    px(c, '#6b4a2f', s.facing === 'right' ? x - 5 : x + 3, y - 12, 2, 12);
  }
}

function drawSeatFront(c: CanvasRenderingContext2D, i: number): void {
  if (i < 6 || i > 9) return;
  const s = SUNMOON_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  px(c, '#a8703f', x - 7, y - 6, 14, 3);
  px(c, '#8a5a32', x - 7, y - 3, 14, 1);
  px(c, '#3a3d45', x - 6, y - 3, 2, 5);
  px(c, '#3a3d45', x + 4, y - 3, 2, 5);
}

// ── 組成 CityScene 用的資料 ──
const PINES: [number, number][] = [
  [1.4, 3], [4.6, 5.2], [2.2, 9], [5.6, 12.4], [1.6, 15.6], [4.4, 19], [2, 23], [5.4, 26.4], [1.8, 30], [4.8, 33.4], [2.6, 37.4],
  [14.2, 32.6], [13.4, 37.6], [26.4, 38.2], [36, 38.4], [41, 33.2], [54.2, 32.8], [54.6, 38.6],
];
const ISLAND_TREES: [number, number][] = [[37, 20.8], [38.8, 20.4], [38, 21.6]];
const LAMPS: [number, number][] = [[14, 9.8], [22, 9.8], [30, 9.8], [41, 9.8], [49, 9.8], [15, 31.6], [24, 31.6], [38, 31.6], [10.4, 20], [10.4, 34]];

const props: CityProp[] = [
  ...PINES.map(([x, y]): CityProp => ({ y, draw: (c) => drawPine(c, x, y) })),
  ...NORTH_ROW.map((b): CityProp => ({ y: SM.northLine, draw: (c, d) => drawNorthHouse(c, b, d) })),
  { y: SM.northLine, draw: (c) => blit(c, visitorSprite(), SM.visitor.x0 * T, SM.northLine * T) },
  { y: SM.busStop.y, draw: (c, d) => drawBusStop(c, d) },
  { y: TEA_TABLE.y, draw: (c) => drawTeaTable(c) },
  ...NORTH_BENCHES.map((x): CityProp => ({ y: NORTH_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, NORTH_BENCH_Y, 2.6) })),
  { y: SM.lake.y0 + 0.1, draw: (c, d) => drawLakeShimmer(c, d.seconds) },
  { y: SM.floatBike.y0, draw: (c) => drawFloatRails(c) },
  ...ISLAND_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawPine(c, x, y) })),
  ...BOATS.map((phase): CityProp => ({ y: SM.lake.y0 + 3, draw: (c, d) => drawBoat(c, phase, d) })),
  { y: SM.temple.y, draw: (c) => blit(c, templeSprite(), SM.temple.x0 * T, SM.temple.y * T) },
  { y: SM.eggStall.y, draw: (c, d) => drawFoodCart(c, SM.eggStall.x, SM.eggStall.y, '阿婆茶葉蛋', '#8a5a32', ['#6b4a2f', '#7a5638', '#6b4a2f', '#7a5638'], d.seconds, 21) },
  { y: SM.pagoda.y, draw: (c) => blit(c, pagodaSprite(), SM.pagoda.x * T - 22, SM.pagoda.y * T) },
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const lk = SM.lake;
const la = SM.lalu;
const solid: Rect[] = [
  // 西邊山坡樹林、北岸的店和遠山
  r(0, 0, SM.hillX1, SM.H),
  r(SM.bike.x1, 0, SM.W, SM.northLine - 0.3),
  // 湖（兩座碼頭、水上步道可以走）
  r(SM.floatBike.x0, lk.y0, SM.floatBike.x1, SM.floatBike.y0),
  r(SM.floatBike.x0, SM.floatBike.y1, SM.floatBike.x1, lk.y1),
  r(SM.floatBike.x1, lk.y0, SM.pierS.x0, lk.y1),
  r(SM.pierS.x0, lk.y0, SM.pierS.x1, SM.pierS.y0),
  r(SM.pierS.x1, lk.y0, SM.pierN.x0, lk.y1),
  r(SM.pierN.x0, SM.pierN.y1, SM.pierN.x1, lk.y1),
  r(SM.pierN.x1, lk.y0, SM.W, lk.y1),
  // 玄光寺、慈恩塔的山、攤車、長椅、遊客中心
  r(SM.temple.x0, SM.temple.y - 3, SM.temple.x1, SM.temple.y - 0.2),
  r(SM.pagoda.x - 6.6, SM.pagoda.y - 2, SM.pagoda.x + 6.6, SM.H),
  r(SM.eggStall.x - 1.3, SM.eggStall.y - 1.6, SM.eggStall.x + 1.3, SM.eggStall.y - 0.1),
  ...NORTH_BENCHES.map((x) => r(x - 1.3, NORTH_BENCH_Y - 0.75, x + 1.3, NORTH_BENCH_Y - 0.45)),
  r(TEA_TABLE.x - 0.45, TEA_TABLE.y - 0.4, TEA_TABLE.x + 0.45, TEA_TABLE.y + 0.2),
  ...PINES.filter(([x]) => x > SM.hillX1).map(([x, y]) => r(x - 0.25, y - 0.3, x + 0.25, y + 0.1)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...NORTH_ROW.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: SM.northLine * T - 10, r: 28, color: 'rgba(255, 214, 150, 0.45)' })),
  { x: ((SM.visitor.x0 + SM.visitor.x1) / 2) * T, y: SM.northLine * T - 10, r: 50, color: 'rgba(255, 230, 180, 0.45)' },
  { x: ((SM.temple.x0 + SM.temple.x1) / 2) * T, y: SM.temple.y * T - 20, r: 44, color: 'rgba(255, 200, 120, 0.4)' },
  { x: SM.pagoda.x * T, y: SM.pagoda.y * T - 60, r: 50, color: 'rgba(255, 230, 180, 0.35)' },
  { x: SM.eggStall.x * T, y: SM.eggStall.y * T - 20, r: 30, color: 'rgba(255, 220, 150, 0.5)' },
];

export const SUNMOON: CityDef = {
  id: 'sunmoon',
  W: SM.W,
  H: SM.H,
  title: { 'zh-TW': '南投 · 日月潭', 'en-US': 'Nantou · Sun Moon Lake' },
  stop: { 'zh-TW': '日月潭（台中轉巴士）', 'en-US': 'Sun Moon Lake (bus via Taichung)' },
  emoji: '🛶',
  station: {
    x: SM.busStop.x,
    y: SM.busStop.y + 0.6,
    name: { 'zh-TW': '水社巴士站（往高鐵台中站）', 'en-US': 'Shuishe bus stop (to THSR Taichung)' },
    arrive: { x: SM.busStop.x - 2.4, y: SM.busStop.y + 0.4 },
  },
  background: GRASS,
  soundscape: 'beach',
  paintGround: paintSunMoonGround,
  props,
  solid,
  blocked: (x, y) => ((x - la.cx) / (la.rx + 0.3)) ** 2 + ((y - la.cy) / (la.ry + 0.3)) ** 2 < 1,
  seats: SUNMOON_SEATS,
  drawSeat,
  drawSeatFront,
  shops: SUNMOON_SHOPS,
  infos: [
    { at: r(lk.x0 + 3, lk.y0 + 1, SM.W, lk.y1 - 1), title: { 'zh-TW': '日月潭', 'en-US': 'Sun Moon Lake' }, text: { 'zh-TW': '臺灣最大的淡水湖，拉魯島東邊的湖形像太陽、西邊像月亮，所以叫日月潭。可以搭遊艇、騎自行車環湖。', 'en-US': 'Taiwan’s largest freshwater lake — one side is shaped like a sun and the other like a moon. Cruise by boat or cycle around it.' } },
    { at: r(la.cx - la.rx, la.cy - la.ry - 2, la.cx + la.rx, la.cy + la.ry), title: { 'zh-TW': '拉魯島', 'en-US': 'Lalu Island' }, text: { 'zh-TW': '湖中間的小島，是邵族的聖地，不能上島。', 'en-US': 'The small island in the middle of the lake, sacred to the Thao people — visitors can’t land.' } },
    { at: r(SM.temple.x0, SM.temple.y - 4, SM.temple.x1, SM.temple.y), title: { 'zh-TW': '玄光寺', 'en-US': 'Xuanguang Temple' }, text: { 'zh-TW': '湖南岸小山丘上的寺廟，前面就是玄光寺碼頭，碼頭邊的阿婆茶葉蛋很有名。', 'en-US': 'A temple on a knoll by the south shore, right above Xuanguang Pier — famous for Grandma’s tea eggs.' } },
    { at: r(SM.pagoda.x - 2, SM.pagoda.y - 8, SM.pagoda.x + 2, SM.pagoda.y), title: { 'zh-TW': '慈恩塔', 'en-US': 'Ci’en Pagoda' }, text: { 'zh-TW': '蓋在湖邊山頂上的九層八角塔，可以爬上去看整個日月潭。', 'en-US': 'A nine-storey octagonal pagoda on a hilltop with a view over the whole lake.' } },
    { at: r(SM.floatBike.x0, SM.floatBike.y0, SM.floatBike.x1, SM.floatBike.y1), title: { 'zh-TW': '向山自行車道', 'en-US': 'Xiangshan Bikeway' }, text: { 'zh-TW': '沿著湖邊的自行車道，有一段架在湖面上，好像騎在水上。', 'en-US': 'A lakeside bikeway with a section built out over the water — like riding on the lake.' } },
    { at: r(SM.pierN.x0, SM.shoreN, SM.pierN.x1, SM.pierN.y1), title: { 'zh-TW': '水社碼頭', 'en-US': 'Shuishe Pier' }, text: { 'zh-TW': '日月潭最熱鬧的碼頭，搭遊艇可以到玄光寺、伊達邵。', 'en-US': 'The lake’s busiest pier — boats run to Xuanguang Temple and Ita Thao.' } },
  ],
  labels: [
    { x: 30, y: 21.6, text: { 'zh-TW': '🛶 日月潭', 'en-US': '🛶 Sun Moon Lake' }, color: '#60a5fa' },
    { x: (SM.pierN.x0 + SM.pierN.x1) / 2, y: SM.pierN.y1 - 0.1, text: { 'zh-TW': '⛴️ 水社碼頭', 'en-US': '⛴️ Shuishe Pier' }, color: '#e2e8f0' },
    { x: (SM.pierS.x0 + SM.pierS.x1) / 2, y: SM.pierS.y0 + 0.6, text: { 'zh-TW': '⛴️ 玄光寺碼頭', 'en-US': '⛴️ Xuanguang Pier' }, color: '#e2e8f0' },
    { x: 9.7, y: 14.4, text: { 'zh-TW': '🚲 向山自行車道', 'en-US': '🚲 Xiangshan Bikeway' }, color: '#fbbf24' },
  ],
  walkers: [
    { x0: 9.7, y0: 1, x1: 9.7, y1: 39, count: 4 },
    { x0: 12, y0: 8.4, x1: 55, y1: 8.4, count: 4 },
    { x0: 12, y0: 31.2, x1: 44, y1: 31.2, count: 3 },
    { x0: 12.5, y0: 15.4, x1: 12.5, y1: 24.6, count: 1 },
  ],
  traffic: [],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點水社碼頭、玄光寺前的長椅、自行車道的休息座或紅茶店的位子坐下專注 · 走到紅茶店、香腸攤、阿婆茶葉蛋買東西 · 點地標看介紹 · 水社巴士站回台北',
    'en-US': 'WASD / arrows to move · click a lakeside bench, a bikeway rest seat or the tea shop table to focus · walk up to the tea shop, sausage stall or tea-egg stall to buy · click landmarks for info · Shuishe bus stop back to Taipei',
  },
  hintTouch: {
    'zh-TW': '點湖邊長椅、休息座坐下專注 · 走到店門口、攤車買東西 · 點地標看介紹 · 水社巴士站回台北',
    'en-US': 'Tap a lakeside bench or rest seat to focus · walk up to shops to buy · tap landmarks · bus back to Taipei',
  },
};
