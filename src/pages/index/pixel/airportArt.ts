// 桃園機場第一航廈的美術：窗外的跑道（飛機起飛）、滑行道（飛機滑行）、停機坪（三架飛機靠空橋、行李拖車）、塔台；
// 玻璃帷幕、木地板候機區的候機椅、航班資訊看板、出境口（國際線規劃中）、咖啡店／便利商店／伴手禮店、報到櫃台（排隊的旅客）、
// 南邊的玻璃門、出境車道（計程車、機場巴士）、機場捷運站。最後組成 CityScene 用的 AIRPORT。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { AIRPORT_SEATS, AIRPORT_SHOPS, AP, CAFE_TABLES, FLIGHTS, PLAZA_BENCH, STOREFRONTS, TABLE_Y, WINDOW_BENCHES, WINDOW_Y } from './airport';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, drawLamp, drawBench, drawStreetTree } from './cityArt';
import { drawRoadVehicle } from './miaokouArt';

// ── 地面（畫一次）──
export function paintAirportGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(2026);
  const W = AP.W * T;
  // 天空、遠方的林口台地
  const sky = c.createLinearGradient(0, 0, 0, AP.runway.y0 * T);
  sky.addColorStop(0, '#79bde9');
  sky.addColorStop(1, '#d6eef9');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, AP.runway.y0 * T);
  for (let i = 0; i < 8; i += 1) {
    c.fillStyle = 'rgba(255,255,255,0.8)';
    c.beginPath();
    c.ellipse(rand() * W, 0.4 * T + rand() * 0.8 * T, 16 + rand() * 18, 3 + rand() * 2, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#7d9d7a';
  c.beginPath();
  c.moveTo(0, AP.runway.y0 * T);
  for (let x = 0; x <= W; x += 16) c.lineTo(x, AP.runway.y0 * T - 6 - Math.sin(x * 0.011) * 5 - Math.sin(x * 0.037) * 2);
  c.lineTo(W, AP.runway.y0 * T);
  c.fill();
  // 草地（跑道、滑行道之間）
  px(c, '#86ad5e', 0, AP.runway.y0 * T - 2, W, (AP.glass - AP.runway.y0) * T);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#7aa055' : '#94b96a', Math.floor(rand() * W), Math.floor(AP.runway.y0 * T + rand() * (AP.taxiway.y1 - AP.runway.y0) * T), 2, 1);
  // 跑道：邊線、中心虛線、跑道頭的斑馬線和號碼
  const ry0 = AP.runway.y0 * T;
  const ry1 = AP.runway.y1 * T;
  px(c, '#4f5259', 0, ry0, W, ry1 - ry0);
  for (let i = 0; i < 400; i += 1) px(c, rand() < 0.5 ? '#474a51' : '#585b63', Math.floor(rand() * W), Math.floor(ry0 + rand() * (ry1 - ry0)), 2, 1);
  px(c, '#e8e8e8', 0, ry0 + 1, W, 1);
  px(c, '#e8e8e8', 0, ry1 - 2, W, 1);
  for (let x = 60; x < W - 40; x += 28) px(c, '#f2f2f2', x, Math.round((ry0 + ry1) / 2), 14, 1);
  for (let k = 0; k < 6; k += 1) px(c, '#f2f2f2', 8, ry0 + 3 + k * 4, 22, 2);
  text(c, '05L', 42, (ry0 + ry1) / 2, '#f2f2f2', `900 8px ${FONT_TC}`);
  // 滑行道：黃色中心線、藍色邊燈的底座
  const ty0 = AP.taxiway.y0 * T;
  const ty1 = AP.taxiway.y1 * T;
  px(c, '#5d6068', 0, ty0, W, ty1 - ty0);
  px(c, '#e7c23a', 0, Math.round((ty0 + ty1) / 2), W, 1);
  // 停機坪：水泥板、黃色引導線（每個機位一條）、機位號碼
  const ay0 = ty1;
  const ay1 = AP.glass * T;
  px(c, '#a3a6ab', 0, ay0, W, ay1 - ay0);
  for (let x = 0; x < W; x += 32) px(c, 'rgba(0,0,0,0.08)', x, ay0, 1, ay1 - ay0);
  for (let y = ay0; y < ay1; y += 24) px(c, 'rgba(0,0,0,0.08)', 0, Math.round(y), W, 1);
  for (let i = 0; i < 300; i += 1) px(c, 'rgba(60,60,60,0.12)', Math.floor(rand() * W), Math.floor(ay0 + rand() * (ay1 - ay0)), 3, 1);
  AP.gates.forEach((g, k) => {
    px(c, '#e7c23a', Math.round(g * T), Math.round((ty0 + ty1) / 2), 1, ay1 - (ty0 + ty1) / 2);
    px(c, '#e7c23a', Math.round(g * T) - 10, ay1 - 6, 21, 1);
    text(c, `A${k + 1}`, g * T + 14, ay1 - 10, '#e7c23a', `900 7px ${FONT_TC}`);
  });
  // 外面整片透過玻璃看：淡淡的藍
  px(c, 'rgba(150, 200, 235, 0.12)', 0, 0, W, ay1);
  // 航廈地板：亮面地磚，窗邊候機區是木地板
  const fy0 = AP.glass * T;
  const fy1 = AP.frontWall * T;
  tiles(c, { x0: 0, y0: AP.glass, x1: AP.W, y1: AP.frontWall }, '#e6e8ec', '#d6d9df', 16);
  for (let i = 0; i < 26; i += 1) px(c, 'rgba(255,255,255,0.55)', Math.round(i * 34 + 6), fy0 + 4, 6, Math.round(fy1 - fy0 - 8));
  const lx0 = AP.lounge.x0 * T;
  const lx1 = AP.lounge.x1 * T;
  px(c, '#c9a275', lx0, fy0, lx1 - lx0, AP.lounge.y1 * T - fy0);
  for (let y = fy0; y < AP.lounge.y1 * T; y += 5) {
    px(c, '#b48d61', lx0, Math.round(y), lx1 - lx0, 1);
    for (let x = lx0 + ((y / 5) % 2) * 20; x < lx1; x += 40) px(c, '#b48d61', Math.round(x), Math.round(y), 1, 5);
  }
  // 報到區前面的藍色地毯（排隊的地方）
  for (const cx of AP.checkin) px(c, '#3d5a8c', Math.round((cx - 3.3) * T), Math.round(AP.checkinLine * T + 2), Math.round(6.6 * T), Math.round(2.4 * T));
  // 玻璃牆的影子
  px(c, 'rgba(0,0,0,0.12)', 0, fy0, W, 3);
  // 外面：人行道、路緣、車道（分隔虛線）、斑馬線、廣場
  tiles(c, { x0: 0, y0: AP.frontWall, x1: AP.W, y1: AP.curb }, '#cfc9bd', '#bfb8aa', 12);
  px(c, '#8f8a80', 0, AP.curb * T - 3, W, 3);
  road(c, { x0: 0, y0: AP.road.y0, x1: AP.W, y1: AP.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((AP.road.y0 + AP.road.y1) / 2) * T), 12, 1);
  zebra(c, 26.5, AP.road.y0, 29.5, AP.road.y1, false);
  tiles(c, { x0: 0, y0: AP.road.y1, x1: AP.W, y1: AP.H }, '#d9d4c8', '#c9c3b5', 16);
  px(c, '#8f8a80', 0, AP.road.y1 * T, W, 2);
  // 廣場的花圃
  for (const [x0, y0, x1, y1] of [
    [1, 33.4, 12, 34.8],
    [44, 33.4, 55, 34.8],
    [14, 37.6, 20, 39.4],
    [36, 37.6, 40, 39.4],
  ] as const) {
    px(c, '#6e9a4c', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let i = 0; i < 40; i += 1) px(c, ['#f28ab0', '#ffd54f', '#ffffff', '#e05a5a'][i % 4] ?? '#fff', Math.floor(x0 * T + rand() * (x1 - x0) * T), Math.floor(y0 * T + rand() * (y1 - y0) * T), 2, 2);
  }
}

// ── 飛機（從上面看）：機鼻朝 +x，再旋轉；s 是大小 ──
function drawPlaneTop(c: CanvasRenderingContext2D, x: number, y: number, angle: number, s: number, tail: string, night: boolean, seconds: number): void {
  c.save();
  c.translate(x, y);
  c.rotate(angle);
  c.scale(s, s);
  const L = 56;
  // 主翼（後掠）、引擎
  c.fillStyle = '#d9dde3';
  c.beginPath();
  c.moveTo(6, -4);
  c.lineTo(-10, -27);
  c.lineTo(-15, -27);
  c.lineTo(-6, -4);
  c.lineTo(-6, 4);
  c.lineTo(-15, 27);
  c.lineTo(-10, 27);
  c.lineTo(6, 4);
  c.fill();
  c.fillStyle = '#5a5f6a';
  c.fillRect(-2, -15, 8, 4);
  c.fillRect(-2, 11, 8, 4);
  // 水平尾翼
  c.fillStyle = '#d9dde3';
  c.beginPath();
  c.moveTo(-L / 2 + 8, -3);
  c.lineTo(-L / 2, -12);
  c.lineTo(-L / 2 - 3, -12);
  c.lineTo(-L / 2 + 1, -3);
  c.lineTo(-L / 2 + 1, 3);
  c.lineTo(-L / 2 - 3, 12);
  c.lineTo(-L / 2, 12);
  c.lineTo(-L / 2 + 8, 3);
  c.fill();
  // 機身
  c.fillStyle = '#f6f7f9';
  c.beginPath();
  c.moveTo(L / 2, 0);
  c.quadraticCurveTo(L / 2 - 2, -4, L / 2 - 8, -4);
  c.lineTo(-L / 2 + 2, -4);
  c.quadraticCurveTo(-L / 2 - 2, 0, -L / 2 + 2, 4);
  c.lineTo(L / 2 - 8, 4);
  c.quadraticCurveTo(L / 2 - 2, 4, L / 2, 0);
  c.fill();
  c.fillStyle = 'rgba(0,0,0,0.1)';
  c.fillRect(-L / 2 + 2, 1.5, L - 10, 2.5);
  // 垂直尾翼（從上面看是一條有顏色的線）、駕駛艙窗
  c.fillStyle = tail;
  c.fillRect(-L / 2 - 1, -1.5, 12, 3);
  c.fillRect(L / 2 - 24, -4, 8, 8);
  c.fillStyle = '#2b3550';
  c.fillRect(L / 2 - 6, -2.5, 2, 5);
  // 航行燈：左紅右綠、機頂紅色閃燈
  if (night || Math.floor(seconds * 1.4) % 2 === 0) {
    c.fillStyle = '#ff3b3b';
    c.fillRect(-12, -28, 2, 2);
    c.fillStyle = '#3bff6a';
    c.fillRect(-12, 26, 2, 2);
  }
  if (Math.floor(seconds * 1.1) % 2 === 0) {
    c.fillStyle = '#ff5050';
    c.fillRect(-2, -1, 2, 2);
  }
  c.restore();
}

// 停在登機門的飛機（機鼻朝南）＋空橋
const GATE_TAILS = ['#2e7d6b', '#1f4e9c', '#c8102e'];
function drawGatePlane(c: CanvasRenderingContext2D, gx: number, i: number, d: DrawCtx): void {
  const cx = gx * T;
  const nose = AP.glass * T - 10;
  px(c, 'rgba(0,0,0,0.18)', cx - 26, nose - 30, 52, 6);
  drawPlaneTop(c, cx, nose - 28, Math.PI / 2, 1, GATE_TAILS[i] ?? '#1f4e9c', d.night, d.seconds + i);
  // 空橋：從航廈伸到前門
  const bx0 = cx - 40;
  const by = nose - 16;
  px(c, '#5a5f6a', bx0 - 4, by - 2, 8, AP.glass * T - by + 2);
  px(c, '#c9ccd2', bx0, by - 4, 36, 8);
  px(c, '#e6e8ec', bx0, by - 4, 36, 2);
  for (let k = bx0 + 4; k < bx0 + 34; k += 6) px(c, '#7aa6c9', k, by - 1, 3, 2);
  px(c, '#3a3d45', bx0 + 32, by - 5, 6, 10);
}

// 停機坪上跑來跑去的行李拖車（在滑行道邊的服務道路）
function drawBaggageTug(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const span = AP.W * T + 120;
  const x = ((d.seconds * 22) % span) - 60;
  const y = AP.taxiway.y1 * T + 6;
  px(c, 'rgba(0,0,0,0.2)', x - 2, y + 4, 60, 2);
  px(c, '#f2c230', x + 44, y - 4, 14, 8);
  px(c, '#2b3550', x + 50, y - 3, 4, 5);
  for (let k = 0; k < 3; k += 1) {
    px(c, '#6c7380', x + k * 14, y - 3, 12, 7);
    px(c, ['#e25a4a', '#3b82f6', '#2bb673'][k] ?? '#3b82f6', x + k * 14 + 2, y - 5, 8, 4);
    px(c, '#2b2d33', x + k * 14 + 1, y + 3, 2, 2);
  }
  if (d.night) glow(c, x + 60, y, 12, '255, 200, 80', 0.4);
}

// 跑道上起飛的飛機：從西邊滑跑、加速、抬頭離地，越飛越高往東北方飛走；滑行道上一架慢慢滑過去
const TAKEOFF_CYCLE = 46;
// 飛機會滑出地圖兩邊：只畫在地圖裡
function clipped(c: CanvasRenderingContext2D, draw: () => void): void {
  c.save();
  c.beginPath();
  c.rect(0, 0, AP.W * T, AP.glass * T);
  c.clip();
  draw();
  c.restore();
}
function drawRunway(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const ry = ((AP.runway.y0 + AP.runway.y1) / 2) * T;
  if (d.night) {
    for (let x = 4; x < AP.W * T; x += 24) {
      px(c, '#fff6d0', x, AP.runway.y0 * T, 2, 2);
      px(c, '#fff6d0', x, AP.runway.y1 * T - 2, 2, 2);
      glow(c, x + 1, AP.runway.y0 * T + 1, 4, '255, 240, 200', 0.5);
    }
    for (let x = 10; x < AP.W * T; x += 32) px(c, '#5a8cff', x, AP.taxiway.y0 * T, 2, 2);
  }
  const t = d.seconds % TAKEOFF_CYCLE;
  if (t < 30) {
    const u = t / 30;
    const x = -40 + u * u * (AP.W * T * 0.62);
    const lift = Math.max(0, (u - 0.72) / 0.28);
    const alt = lift * lift * 18;
    px(c, `rgba(0,0,0,${0.22 * (1 - lift * 0.6)})`, Math.round(x - 24), Math.round(ry + 4), 50, 4);
    drawPlaneTop(c, x, ry - alt, -lift * 0.12, 1 + lift * 0.1, '#7a3fb0', d.night, d.seconds);
  } else if (t < 38) {
    const u = (t - 30) / 8;
    const x = AP.W * T * 0.62 - 40 + u * AP.W * T * 0.6;
    drawPlaneTop(c, x, ry - 18 - u * 40, -0.12 - u * 0.1, 1.1 + u * 0.2, '#7a3fb0', d.night, d.seconds);
  }
}
function drawTaxiing(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const span = AP.W * T + 160;
  const x = AP.W * T + 80 - ((d.seconds * 9) % span);
  const y = ((AP.taxiway.y0 + AP.taxiway.y1) / 2) * T;
  px(c, 'rgba(0,0,0,0.2)', Math.round(x - 26), Math.round(y + 3), 52, 4);
  drawPlaneTop(c, x, y, Math.PI, 0.9, '#e07a1f', d.night, d.seconds + 3);
}

// 塔台
function towerSprite(): HTMLCanvasElement {
  return cached('ap-tower', 40, 96, (c) => {
    px(c, 'rgba(0,0,0,0.2)', 6, 92, 28, 4);
    px(c, '#d8dbe0', 14, 30, 12, 64);
    px(c, '#eef0f3', 14, 30, 3, 64);
    for (let y = 40; y < 90; y += 10) px(c, '#9fb3c6', 18, y, 4, 3);
    px(c, '#b9bdc4', 8, 26, 24, 5);
    px(c, '#2f5d55', 6, 12, 28, 14);
    px(c, '#6fb3a6', 8, 14, 24, 4);
    for (let x = 10; x < 32; x += 6) px(c, '#244a44', x, 12, 1, 14);
    px(c, '#cfd3d9', 4, 8, 32, 5);
    px(c, '#9aa0a8', 19, 0, 2, 9);
  });
}
function drawTower(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = AP.tower.x * T - 20;
  blit(c, towerSprite(), x, AP.tower.y * T);
  if (Math.floor(d.seconds * 1.2) % 2 === 0) {
    px(c, '#ff4040', x + 19, AP.tower.y * T - 97, 2, 2);
    if (d.night) glow(c, x + 20, AP.tower.y * T - 96, 8, '255, 60, 60', 0.6);
  }
}

// 玻璃帷幕：直的鋁框（看得到外面）、窗台
function drawGlassWall(c: CanvasRenderingContext2D): void {
  const y1 = AP.glass * T;
  const y0 = AP.taxiway.y1 * T + 14;
  for (let x = 0; x <= AP.W * T; x += 48) px(c, 'rgba(70, 80, 95, 0.55)', x, y0, 2, y1 - y0);
  px(c, 'rgba(70, 80, 95, 0.4)', 0, y0 + Math.round((y1 - y0) * 0.45), AP.W * T, 1);
  px(c, '#6b7280', 0, y1 - 3, AP.W * T, 3);
  px(c, '#9ca3af', 0, y1 - 3, AP.W * T, 1);
}

// 窗邊候機椅：一排兩位，鋁框＋藍色坐墊；人背對畫面坐，椅背畫在人前面
function drawLoungeBeam(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(WINDOW_Y * T);
  px(c, 'rgba(0,0,0,0.18)', cx - 20, by + 1, 40, 2);
  px(c, '#7c828c', cx - 20, by - 1, 40, 2);
  px(c, '#4b505a', cx - 18, by + 1, 2, 2);
  px(c, '#4b505a', cx + 16, by + 1, 2, 2);
}
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = AIRPORT_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  if (i < 6) {
    px(c, '#2f5d8a', x - 7, y - 4, 14, 4);
    px(c, '#3f78b0', x - 7, y - 4, 14, 1);
    return;
  }
  if (i < 10) {
    // 咖啡座的木椅
    px(c, 'rgba(0,0,0,0.2)', x - 5, y + 1, 10, 2);
    px(c, '#7a5232', x - 5, y - 13, 10, 3);
    px(c, '#9a6a40', x - 5, y - 4, 10, 3);
    px(c, '#5a3a22', x - 4, y - 1, 2, 3);
    px(c, '#5a3a22', x + 2, y - 1, 2, 3);
  }
}
function drawSeatFront(c: CanvasRenderingContext2D, i: number): void {
  if (i >= 6) return;
  const s = AIRPORT_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  px(c, '#3f78b0', x - 7, y - 8, 14, 6);
  px(c, '#2f5d8a', x - 7, y - 3, 14, 1);
  px(c, '#9ca3af', x - 8, y - 9, 1, 9);
  px(c, '#9ca3af', x + 7, y - 9, 1, 9);
}

// 盆栽
function drawPlant(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by - 1, 12, 2);
  px(c, '#e6e1d6', cx - 5, by - 9, 10, 9);
  px(c, '#cfc8b8', cx - 5, by - 9, 10, 1);
  for (const [dx, dy, r, col] of [[-4, -14, 5, '#3f7a3a'], [4, -14, 5, '#3f7a3a'], [0, -19, 6, '#4f8a46'], [0, -12, 4, '#5a9a52']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
}

// 航班資訊看板：兩根柱子撐著，黑底、黃字，國際線狀態「規劃中」一閃一閃
function fidsSprite(): HTMLCanvasElement {
  const w = Math.round((AP.fids.x1 - AP.fids.x0) * T);
  return cached('ap-fids', w, 70, (c) => {
    px(c, 'rgba(0,0,0,0.2)', 6, 67, w - 12, 3);
    px(c, '#6b7280', 10, 50, 4, 20);
    px(c, '#6b7280', w - 14, 50, 4, 20);
    px(c, '#3a3f4a', 0, 0, w, 52);
    px(c, '#0f1420', 2, 2, w - 4, 48);
    px(c, '#1f3a6e', 2, 2, w - 4, 9);
    text(c, '出發  DEPARTURES', 8, 6.5, '#ffffff', `900 6px ${FONT_TC}`, 'left');
    text(c, '國際線', w - 8, 6.5, '#ffd54f', `900 6px ${FONT_TC}`, 'right');
    const cols = { time: 8, dest: 34, code: 92 };
    FLIGHTS.forEach((f, k) => {
      const y = 16 + k * 6;
      if (k % 2) px(c, 'rgba(255,255,255,0.04)', 2, y - 3, w - 4, 6);
      text(c, f.time, cols.time, y, '#ffd54f', `700 5px ${FONT_TC}`, 'left');
      text(c, f.dest, cols.dest, y, '#ffffff', `700 5px ${FONT_TC}`, 'left');
      text(c, f.code, cols.code, y, '#9fd8ff', `700 5px ${FONT_TC}`, 'left');
    });
  });
}
function drawFids(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = AP.fids.x0 * T;
  const by = AP.fids.line * T;
  blit(c, fidsSprite(), x0, by);
  const w = (AP.fids.x1 - AP.fids.x0) * T;
  const top = by - 70;
  FLIGHTS.forEach((_, k) => {
    const y = top + 16 + k * 6;
    const on = (Math.floor(d.seconds * 0.8) + k) % 4 !== 0;
    text(c, on ? '規劃中' : 'PLANNED', x0 + w - 8, y, on ? '#ffb020' : '#ffd54f', `900 5px ${FONT_TC}`, 'right');
  });
  if (d.night) glow(c, x0 + w / 2, top + 26, 90, '120, 170, 255', 0.15);
}

// 出境口：上面「出境 DEPARTURES」大招牌，護照查驗的門拉下一半，前面立牌「國際航線規劃中」
function departureSprite(): HTMLCanvasElement {
  const w = Math.round((AP.departure.x1 - AP.departure.x0) * T);
  const h = 78;
  return cached('ap-departure', w, h, (c) => {
    px(c, '#e9ebef', 0, 8, w, h - 8);
    // 兩邊的木格柵
    for (let x = 4; x < 46; x += 5) px(c, '#b48d61', x, 22, 3, h - 24);
    for (let x = w - 46; x < w - 4; x += 5) px(c, '#b48d61', x, 22, 3, h - 24);
    px(c, '#1f2a44', 0, 0, w, 20);
    px(c, '#ffd54f', 0, 19, w, 1);
    text(c, '✈ 出境  DEPARTURES', w / 2, 10, '#ffffff', `900 9px ${FONT_TC}`);
    // 入口：裡面暗暗的、鐵捲門拉下一半
    const dx0 = 52;
    const dx1 = w - 52;
    px(c, '#3a4256', dx0, 26, dx1 - dx0, h - 26);
    px(c, '#56607a', dx0 + 6, 40, 14, 10);
    px(c, '#56607a', dx1 - 20, 40, 14, 10);
    for (let y = 26; y < 52; y += 3) px(c, y % 6 ? '#aeb4bf' : '#8f96a3', dx0, y, dx1 - dx0, 2);
    px(c, '#6b7280', dx0, 52, dx1 - dx0, 2);
    px(c, '#9aa0a8', dx0 - 3, 24, 3, h - 24);
    px(c, '#9aa0a8', dx1, 24, 3, h - 24);
    text(c, '護照查驗 Passport Control', w / 2, 30.5, '#ffffff', `700 5px ${FONT_TC}`);
  });
}
function drawDeparture(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = AP.departure.x0 * T;
  const by = AP.departure.line * T;
  blit(c, departureSprite(), x0, by);
  const w = (AP.departure.x1 - AP.departure.x0) * T;
  // 立牌
  const sx = x0 + w / 2;
  px(c, 'rgba(0,0,0,0.2)', sx - 30, by + 1, 60, 3);
  px(c, '#4b505a', sx - 24, by - 6, 2, 8);
  px(c, '#4b505a', sx + 22, by - 6, 2, 8);
  px(c, '#ffd54f', sx - 30, by - 26, 60, 21);
  px(c, '#e0a800', sx - 30, by - 26, 60, 1);
  text(c, '國際航線規劃中', sx, by - 20, '#1f2a44', `900 6px ${FONT_TC}`);
  text(c, '敬請期待 Coming soon', sx, by - 11, '#1f2a44', `700 4.5px ${FONT_TC}`);
  if (d.night) glow(c, sx, by - 60, 70, '255, 220, 140', 0.2);
}

// 西邊的店：咖啡店、便利商店、伴手禮店（後面的牆和貨架；店員；前面的櫃台）
function storefrontSprite(kind: 'cafe' | 'store' | 'gift', w: number): HTMLCanvasElement {
  const h = 48;
  return cached(`ap-shop-${kind}`, w, h, (c) => {
    const wall = kind === 'cafe' ? '#5a3e2b' : kind === 'store' ? '#f4f6f8' : '#f6ead2';
    px(c, wall, 0, 0, w, h);
    const band = kind === 'cafe' ? '#2f5d3a' : kind === 'store' ? '#ffffff' : '#b8282e';
    px(c, band, 0, 0, w, 12);
    if (kind === 'store') {
      px(c, '#2bb673', 0, 9, w, 1);
      px(c, '#f39800', 0, 10, w, 1);
      px(c, '#e3002c', 0, 11, w, 1);
    }
    const name = kind === 'cafe' ? '機場咖啡 CAFÉ' : kind === 'store' ? '便利商店' : '台灣伴手禮';
    text(c, name, w / 2, 5.5, kind === 'store' ? '#2a7a46' : '#ffffff', `900 7px ${FONT_TC}`);
    if (kind === 'cafe') {
      // 黑板菜單、咖啡機、架上的豆子
      px(c, '#1f2a24', 6, 16, 30, 16);
      text(c, 'MENU', 21, 20, '#ffffff', `700 5px ${FONT_TC}`);
      for (let k = 0; k < 3; k += 1) px(c, 'rgba(255,255,255,0.6)', 9, 24 + k * 3, 20, 1);
      px(c, '#c9ccd6', 44, 20, 22, 14);
      px(c, '#2b2d33', 48, 24, 14, 4);
      for (let x = 74; x < w - 6; x += 8) px(c, '#8a5a32', x, 18, 6, 8);
      px(c, '#7a5232', 70, 26, w - 74, 2);
    } else if (kind === 'store') {
      // 貨架、冰箱
      for (let r = 0; r < 3; r += 1) {
        px(c, '#c9ccd6', 4, 16 + r * 9, w - 40, 1);
        for (let x = 6; x < w - 40; x += 5) px(c, ['#e25a4a', '#3b82f6', '#f6c945', '#2bb673', '#ffffff'][(x + r) % 5] ?? '#fff', x, 12 + r * 9, 4, 4);
      }
      px(c, '#9fc7d9', w - 32, 14, 28, 30);
      for (let r = 0; r < 4; r += 1) for (let x = w - 30; x < w - 6; x += 4) px(c, ['#e25a4a', '#2bb673', '#f39800'][(x + r) % 3] ?? '#fff', x, 16 + r * 7, 2, 5);
    } else {
      // 鳳梨酥禮盒、飛機模型
      for (let r = 0; r < 3; r += 1) {
        px(c, '#c9a275', 4, 20 + r * 9, w - 8, 1);
        for (let x = 6; x < w - 8; x += 9) px(c, r === 1 ? '#f6c945' : '#b8282e', x, 14 + r * 9, 7, 6);
      }
      px(c, '#ffffff', w / 2 - 10, 13, 20, 2);
      px(c, '#ffffff', w / 2 - 2, 10, 4, 8);
    }
  });
}
function drawStorefront(c: CanvasRenderingContext2D, s: (typeof STOREFRONTS)[number], i: number, d: DrawCtx): void {
  const x0 = Math.round(s.x0 * T);
  const w = Math.round((s.x1 - s.x0) * T);
  const by = AP.shopLine * T;
  blit(c, storefrontSprite(s.kind, w), x0, by);
  const clerk = getAvatarFrame(lookColors((i * 2 + 1) % 5, 2 + i, { body: i % 2 }), 'down', 'idle');
  c.drawImage(clerk, Math.round(x0 + w / 2 - clerk.width / 2), by - 8 - clerk.height + 4);
  // 櫃台
  const counter = s.kind === 'cafe' ? '#8a5a32' : s.kind === 'store' ? '#dfe3ea' : '#c9a275';
  px(c, 'rgba(0,0,0,0.2)', x0, by, w, 3);
  px(c, counter, x0 + 2, by - 11, w - 4, 11);
  px(c, 'rgba(255,255,255,0.35)', x0 + 2, by - 11, w - 4, 1);
  if (s.kind === 'cafe') {
    px(c, '#f4f1e8', x0 + 10, by - 14, 4, 3);
    px(c, '#f4f1e8', x0 + 18, by - 14, 4, 3);
    for (let k = 0; k < 2; k += 1) {
      const t = (d.seconds * 0.5 + k / 2) % 1;
      px(c, `rgba(255,255,255,${0.5 * (1 - t)})`, x0 + 11 + k * 8, Math.round(by - 16 - t * 8), 2, 2);
    }
  } else if (s.kind === 'store') {
    px(c, '#2b2d33', x0 + w - 18, by - 16, 10, 5);
    px(c, '#9fd8ff', x0 + w - 17, by - 15, 8, 3);
  } else {
    px(c, '#ffffff', x0 + 8, by - 15, 14, 2);
    px(c, '#ffffff', x0 + 13, by - 18, 3, 7);
  }
}

// 咖啡座的小圓桌
function drawCafeTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(TABLE_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 14, by + 1, 28, 3);
  px(c, '#a8703f', cx - 14, by - 9, 28, 5);
  px(c, '#c48a52', cx - 14, by - 9, 28, 1);
  px(c, '#5a3a22', cx - 1, by - 4, 3, 5);
  px(c, '#f4f1e8', cx - 8, by - 12, 5, 3);
  px(c, '#f4f1e8', cx + 4, by - 12, 5, 3);
}

// 報到櫃台：後面的看板（航空公司顏色＋排別字母）、三個櫃位、地勤、行李輸送帶
const ISLAND_COLORS = ['#1f4e9c', '#2e7d6b', '#c8102e'];
function drawCheckin(c: CanvasRenderingContext2D, cx0: number, k: number): void {
  const cx = Math.round(cx0 * T);
  const by = Math.round(AP.checkinLine * T);
  const half = Math.round(3.3 * T);
  const col = ISLAND_COLORS[k] ?? '#1f4e9c';
  // 看板＋字母
  px(c, '#e9ebef', cx - half, by - 34, half * 2, 22);
  px(c, col, cx - half, by - 34, half * 2, 6);
  px(c, '#6b7280', cx - 1, by - 52, 2, 18);
  px(c, '#1f2a44', cx - 9, by - 62, 18, 12);
  text(c, String.fromCharCode(65 + k), cx, by - 56, '#ffd54f', `900 9px ${FONT_TC}`);
  for (let j = 0; j < 3; j += 1) {
    const dx = cx - half + 8 + j * 34;
    px(c, '#1f2a44', dx + 6, by - 26, 14, 8);
    px(c, '#9fd8ff', dx + 7, by - 25, 12, 5);
    text(c, `${k * 10 + j + 1}`, dx + 13, by - 30.5, col, `900 5px ${FONT_TC}`);
  }
  // 地勤（面向旅客）
  for (let j = 0; j < 3; j += 1) {
    const staff = getAvatarFrame(lookColors((k + j) % 5, 1, { body: (k + j) % 2 }), 'down', 'idle');
    c.drawImage(staff, Math.round(cx - half + 21 + j * 34 - staff.width / 2), by - 10 - staff.height + 4);
  }
  // 櫃台、輸送帶
  px(c, 'rgba(0,0,0,0.2)', cx - half, by, half * 2, 3);
  px(c, '#dfe3ea', cx - half, by - 12, half * 2, 12);
  px(c, '#ffffff', cx - half, by - 12, half * 2, 1);
  px(c, col, cx - half, by - 4, half * 2, 1);
  for (let j = 0; j < 3; j += 1) px(c, '#4b505a', cx - half + 2 + j * 34, by - 7, 6, 7);
}

// 排隊的旅客（背對畫面）＋行李箱
const TRAVELERS = AP.checkin.flatMap((cx, k) => [
  { x: cx - 1.6, seed: k * 3 + 1, bag: '#e25a4a' },
  { x: cx + 1.2, seed: k * 3 + 2, bag: '#3b82f6' },
]);
const QUEUE_Y = AP.checkinLine + 1.6;
function drawTraveler(c: CanvasRenderingContext2D, tr: (typeof TRAVELERS)[number], d: DrawCtx): void {
  const cx = Math.round(tr.x * T);
  const by = Math.round(QUEUE_Y * T);
  const p = getAvatarFrame(lookColors(tr.seed % 5, (tr.seed * 3) % 6, { body: tr.seed % 2 }), 'up', 'idle');
  const bob = Math.floor(d.seconds * 0.5 + tr.seed) % 6 === 0 ? 1 : 0;
  c.drawImage(p, Math.round(cx - p.width / 2), by - p.height + 4 - bob);
  px(c, 'rgba(0,0,0,0.2)', cx + 6, by + 1, 10, 2);
  px(c, tr.bag, cx + 6, by - 12, 9, 13);
  px(c, 'rgba(255,255,255,0.3)', cx + 6, by - 12, 9, 1);
  px(c, '#2b2d33', cx + 9, by - 16, 3, 4);
}

// 排隊的紅龍（不鏽鋼柱＋藍帶）
function drawStanchions(c: CanvasRenderingContext2D, cx0: number): void {
  const y = Math.round((AP.checkinLine + 2.6) * T);
  const x0 = Math.round((cx0 - 3.2) * T);
  const x1 = Math.round((cx0 + 3.2) * T);
  px(c, '#2f5d8a', x0, y - 9, x1 - x0, 2);
  for (let x = x0; x <= x1; x += Math.round((x1 - x0) / 4)) {
    px(c, 'rgba(0,0,0,0.2)', x - 2, y, 6, 2);
    px(c, '#c9ccd6', x, y - 11, 2, 11);
    px(c, '#eef0f3', x - 1, y - 12, 4, 2);
  }
}

// 南邊的玻璃牆＋自動門
function drawFrontWall(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const by = AP.frontWall * T;
  const W = AP.W * T;
  let x = 0;
  const segs: [number, number][] = [];
  for (const [a, b] of AP.doors) {
    segs.push([x, a * T]);
    x = b * T;
  }
  segs.push([x, W]);
  for (const [a, b] of segs) {
    px(c, 'rgba(160, 205, 235, 0.55)', a, by - 16, b - a, 16);
    for (let k = a; k < b; k += 16) px(c, '#6b7280', Math.round(k), by - 16, 1, 16);
    px(c, '#6b7280', a, by - 2, b - a, 2);
  }
  px(c, '#4b5260', 0, by - 22, W, 6);
  for (const [a, b] of AP.doors) {
    px(c, '#9aa0a8', a * T - 2, by - 22, 2, 22);
    px(c, '#9aa0a8', b * T, by - 22, 2, 22);
    px(c, '#2bb673', ((a + b) / 2) * T - 8, by - 21, 16, 4);
    text(c, '出入口', ((a + b) / 2) * T, by - 19, '#ffffff', `900 4px ${FONT_TC}`);
    if (d.night) glow(c, ((a + b) / 2) * T, by - 8, 26, '255, 240, 200', 0.35);
  }
}

// 出境車道：機場巴士、排班計程車、行李推車、計程車招牌
function drawBus(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = 46 * T;
  const by = 29.1 * T;
  const w = 92;
  px(c, 'rgba(0,0,0,0.3)', x0, by - 1, w, 4);
  px(c, '#f4f6f8', x0, by - 26, w, 24);
  px(c, '#1f4e9c', x0, by - 12, w, 4);
  for (let x = x0 + 4; x < x0 + w - 14; x += 12) px(c, '#2b3550', x, by - 23, 9, 8);
  px(c, '#2b3550', x0 + w - 12, by - 23, 9, 13);
  text(c, '機場巴士 Airport Bus', x0 + w / 2 - 6, by - 5.5, '#1f4e9c', `900 5px ${FONT_TC}`);
  for (const x of [x0 + 12, x0 + w - 20]) px(c, '#15171f', x, by - 3, 9, 4);
  px(c, d.night ? '#fff3b0' : '#e8e2c4', x0 + w - 2, by - 8, 2, 3);
}
function drawLuggageCarts(c: CanvasRenderingContext2D): void {
  for (let k = 0; k < 4; k += 1) {
    const x = 15 * T + k * 5;
    const by = 27.7 * T;
    px(c, '#9aa0a8', x, by - 12, 2, 12);
    px(c, '#c9ccd6', x, by - 4, 14, 2);
    px(c, '#c9ccd6', x + 12, by - 10, 2, 8);
    px(c, '#15171f', x + 2, by - 1, 3, 2);
    px(c, '#15171f', x + 10, by - 1, 3, 2);
  }
}
function drawTaxiSign(c: CanvasRenderingContext2D): void {
  const x = 33 * T;
  const by = 28.2 * T;
  px(c, 'rgba(0,0,0,0.2)', x - 3, by - 1, 8, 2);
  px(c, '#4b505a', x, by - 30, 2, 30);
  px(c, '#f6c945', x - 14, by - 38, 30, 10);
  text(c, '計程車 TAXI', x + 1, by - 33, '#15171f', `900 5px ${FONT_TC}`);
}

// 機場捷運站入口：紫色招牌、玻璃盒子、往下的手扶梯
function mrtSprite(): HTMLCanvasElement {
  const w = Math.round((AP.mrt.x1 - AP.mrt.x0) * T);
  const h = 58;
  return cached('ap-mrt', w, h, (c) => {
    px(c, 'rgba(0,0,0,0.2)', 2, h - 3, w - 4, 3);
    px(c, '#8246af', 0, 0, w, 16);
    px(c, '#a26fd1', 0, 0, w, 2);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(12, 8, 5, 0, Math.PI * 2);
    c.fill();
    px(c, '#8246af', 10, 5, 4, 6);
    text(c, '機場捷運  Airport MRT', w / 2 + 6, 8, '#ffffff', `900 8px ${FONT_TC}`);
    px(c, '#bcd9ea', 6, 16, w - 12, h - 19);
    for (let x = 6; x < w - 6; x += 24) px(c, '#8a909a', x, 16, 2, h - 19);
    // 手扶梯（斜的）
    for (let k = 0; k < 9; k += 1) px(c, '#6b7280', Math.round(w / 2 - 30 + k * 6), 24 + k * 3, 6, 2);
    px(c, '#3a3d45', w / 2 - 32, 22, 2, 34);
    px(c, '#f4f6f8', w - 78, 20, 70, 10);
    px(c, '#8246af', w - 78, 20, 12, 10);
    text(c, 'A12', w - 72, 25, '#ffffff', `900 5px ${FONT_TC}`);
    text(c, '機場第一航廈', w - 37, 25, '#8246af', `900 6px ${FONT_TC}`);
    px(c, '#8a909a', 0, 16, 6, h - 19);
    px(c, '#8a909a', w - 6, 16, 6, h - 19);
  });
}
function drawMrt(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, mrtSprite(), AP.mrt.x0 * T, AP.mrt.line * T);
  if (d.night) glow(c, ((AP.mrt.x0 + AP.mrt.x1) / 2) * T, AP.mrt.line * T - 30, 70, '200, 160, 255', 0.3);
}

const PLANTS: [number, number][] = [[1.6, 13.2], [8.25, 13.2], [14.75, 13.2], [21.4, 13.2], [23, 24.6], [42, 24.6]];
const LAMPS: [number, number][] = [[3, 28.2], [12, 28.2], [22, 28.2], [44, 28.2], [54, 28.2], [10, 36], [35, 36], [50, 38.8]];
const TREES: [number, number][] = [[2.5, 36.6], [6.5, 39.2], [12.5, 36.6], [20.5, 36.4], [37.5, 39.4], [47, 39.2], [53.5, 36.6]];
const TAXIS = [36.5, 39.8];

const props: CityProp[] = [
  { y: AP.runway.y1, draw: (c, d) => clipped(c, () => drawRunway(c, d)) },
  { y: AP.taxiway.y0 + 0.4, draw: (c, d) => clipped(c, () => drawTaxiing(c, d)) },
  { y: AP.tower.y, draw: (c, d) => drawTower(c, d) },
  { y: AP.taxiway.y1 + 0.3, draw: (c, d) => clipped(c, () => drawBaggageTug(c, d)) },
  ...AP.gates.map((g, i): CityProp => ({ y: AP.glass - 0.3, draw: (c, d) => drawGatePlane(c, g, i, d) })),
  { y: AP.glass + 0.02, draw: (c) => drawGlassWall(c) },
  ...WINDOW_BENCHES.map((x): CityProp => ({ y: WINDOW_Y - 0.02, draw: (c) => drawLoungeBeam(c, x) })),
  ...PLANTS.map(([x, y]): CityProp => ({ y, draw: (c) => drawPlant(c, x, y) })),
  { y: AP.fids.line, draw: (c, d) => drawFids(c, d) },
  { y: AP.departure.line, draw: (c, d) => drawDeparture(c, d) },
  ...STOREFRONTS.map((s, i): CityProp => ({ y: AP.shopLine, draw: (c, d) => drawStorefront(c, s, i, d) })),
  ...CAFE_TABLES.map((x): CityProp => ({ y: TABLE_Y, draw: (c) => drawCafeTable(c, x) })),
  ...AP.checkin.map((x, k): CityProp => ({ y: AP.checkinLine, draw: (c) => drawCheckin(c, x, k) })),
  ...TRAVELERS.map((tr): CityProp => ({ y: QUEUE_Y, draw: (c, d) => drawTraveler(c, tr, d) })),
  ...AP.checkin.map((x): CityProp => ({ y: AP.checkinLine + 2.6, draw: (c) => drawStanchions(c, x) })),
  { y: AP.frontWall, draw: (c, d) => drawFrontWall(c, d) },
  { y: 27.7, draw: (c) => drawLuggageCarts(c) },
  { y: 28.2, draw: (c) => drawTaxiSign(c) },
  { y: 29.1, draw: (c, d) => drawBus(c, d) },
  ...TAXIS.map((x): CityProp => ({ y: 29.1, draw: (c) => drawRoadVehicle(c, 'taxi', x, 29.1, -1, '#f6c945', '#f6c945') })),
  { y: AP.mrt.line, draw: (c, d) => drawMrt(c, d) },
  { y: PLAZA_BENCH.y - 0.01, draw: (c) => drawBench(c, PLAZA_BENCH.x, PLAZA_BENCH.y, 2.6) },
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const wallSolids: Rect[] = (() => {
  const out: Rect[] = [];
  let x = 0;
  for (const [a, b] of AP.doors) {
    out.push(r(x, AP.frontWall - 0.45, a, AP.frontWall - 0.05));
    x = b;
  }
  out.push(r(x, AP.frontWall - 0.45, AP.W, AP.frontWall - 0.05));
  return out;
})();
const solid: Rect[] = [
  r(0, 0, AP.W, AP.glass + 0.15),
  r(AP.departure.x0, AP.glass, AP.departure.x1 + 1, AP.departure.line - 0.05),
  r(AP.fids.x0 + 0.5, AP.fids.line - 0.35, AP.fids.x0 + 1, AP.fids.line - 0.05),
  r(AP.fids.x1 - 1, AP.fids.line - 0.35, AP.fids.x1 - 0.5, AP.fids.line - 0.05),
  r(0, AP.shopLine - 3, 21.6, AP.shopLine - 0.05),
  ...CAFE_TABLES.map((x) => r(x - 0.9, TABLE_Y - 0.4, x + 0.9, TABLE_Y)),
  ...WINDOW_BENCHES.map((x) => r(x - 1.3, WINDOW_Y - 0.35, x + 1.3, WINDOW_Y - 0.1)),
  ...PLANTS.map(([x, y]) => r(x - 0.35, y - 0.4, x + 0.35, y)),
  ...AP.checkin.map((x) => r(x - 3.3, AP.checkinLine - 1.2, x + 3.3, AP.checkinLine - 0.05)),
  ...AP.checkin.map((x) => r(x - 3.25, AP.checkinLine + 2.3, x + 3.25, AP.checkinLine + 2.6)),
  ...TRAVELERS.map((tr) => r(tr.x - 0.3, QUEUE_Y - 0.3, tr.x + 1, QUEUE_Y)),
  ...wallSolids,
  r(14.9, 27.2, 16.6, 27.7),
  r(46, 28.5, 51.8, 29.1),
  ...TAXIS.map((x) => r(x - 0.95, 28.5, x + 0.95, 29.1)),
  r(AP.mrt.x0, AP.mrt.line - 2.2, AP.mrt.x1, AP.mrt.line - 0.05),
  r(PLAZA_BENCH.x - 1.3, PLAZA_BENCH.y - 0.75, PLAZA_BENCH.x + 1.3, PLAZA_BENCH.y - 0.45),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  // 航廈裡的天花板燈
  ...Array.from({ length: 7 }, (_, k) => ({ x: (4 + k * 8) * T, y: 17 * T, r: 90, color: 'rgba(255, 240, 210, 0.4)' })),
  ...Array.from({ length: 7 }, (_, k) => ({ x: (4 + k * 8) * T, y: 23.5 * T, r: 80, color: 'rgba(255, 240, 210, 0.35)' })),
  // 停機坪的投光燈
  ...AP.gates.map((g) => ({ x: g * T, y: 8 * T, r: 70, color: 'rgba(255, 220, 160, 0.35)' })),
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...STOREFRONTS.map((s) => ({ x: ((s.x0 + s.x1) / 2) * T, y: AP.shopLine * T - 24, r: 50, color: 'rgba(255, 225, 160, 0.5)' })),
  { x: ((AP.mrt.x0 + AP.mrt.x1) / 2) * T, y: AP.mrt.line * T - 26, r: 70, color: 'rgba(210, 180, 255, 0.45)' },
];

const mrtX = (AP.mrt.x0 + AP.mrt.x1) / 2;

export const AIRPORT: CityDef = {
  id: 'airport',
  W: AP.W,
  H: AP.H,
  title: { 'zh-TW': '桃園國際機場 · 第一航廈', 'en-US': 'Taoyuan International Airport · Terminal 1' },
  stop: { 'zh-TW': '桃園機場（第一航廈）', 'en-US': 'Taoyuan Airport (Terminal 1)' },
  emoji: '✈️',
  line: 'airport',
  station: {
    x: mrtX,
    y: AP.mrt.line + 0.7,
    name: { 'zh-TW': '機場捷運 A12 機場第一航廈站', 'en-US': 'Airport MRT A12 · Airport Terminal 1' },
    arrive: { x: mrtX + 3, y: AP.mrt.line + 0.9 },
  },
  background: '#e6e8ec',
  soundscape: 'city',
  paintGround: paintAirportGround,
  props,
  solid,
  seats: AIRPORT_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  drawSeatFront: (c, i) => drawSeatFront(c, i),
  shops: AIRPORT_SHOPS,
  infos: [
    { at: r(AP.fids.x0, AP.fids.line - 4.4, AP.fids.x1, AP.fids.line - 0.4), title: { 'zh-TW': '航班資訊看板 · 國際線', 'en-US': 'Departures Board · International' }, text: { 'zh-TW': '東京、大阪、首爾、曼谷、新加坡、香港的航線都在規劃中。之後會一條一條開航，從這裡出國，到國外的城市專注。', 'en-US': 'Routes to Tokyo, Osaka, Seoul, Bangkok, Singapore and Hong Kong are being planned. They’ll open one by one — fly from here to focus in cities abroad.' } },
    { at: r(AP.departure.x0, AP.glass, AP.departure.x1, AP.departure.line), title: { 'zh-TW': '出境大廳', 'en-US': 'Departures' }, text: { 'zh-TW': '過了這裡就是護照查驗和登機門。國際航線還在規劃中，敬請期待！', 'en-US': 'Beyond here are passport control and the boarding gates. International routes are coming soon — stay tuned!' } },
    { at: r(0, AP.runway.y0, 50, AP.glass), title: { 'zh-TW': '桃園國際機場', 'en-US': 'Taoyuan International Airport' }, text: { 'zh-TW': '台灣最大的國際機場，1979 年啟用（當時叫中正國際機場），第一航廈是建築師林同棪設計的。坐在窗邊可以看飛機起降。', 'en-US': 'Taiwan’s largest international airport, opened in 1979 (then called CKS International). Terminal 1 was designed by T.Y. Lin. Sit by the windows to watch planes take off.' } },
    { at: r(50, 0, AP.W, AP.taxiway.y1), title: { 'zh-TW': '塔台', 'en-US': 'Control Tower' }, text: { 'zh-TW': '塔台裡的管制員指揮每一架飛機滑行、起飛和降落。', 'en-US': 'Controllers in the tower direct every plane as it taxis, takes off and lands.' } },
    { at: r(AP.checkin[0] - 3.3, AP.checkinLine - 4, AP.checkin[2] + 3.3, AP.checkinLine), title: { 'zh-TW': '報到櫃台', 'en-US': 'Check-in Counters' }, text: { 'zh-TW': '出國前先在這裡報到、托運行李、拿登機證。建議起飛前兩到三小時到機場。', 'en-US': 'Check in, drop your bags and get your boarding pass here. Arrive two to three hours before an international flight.' } },
    { at: r(AP.mrt.x0, AP.mrt.line - 3.6, AP.mrt.x1, AP.mrt.line), title: { 'zh-TW': '桃園機場捷運', 'en-US': 'Taoyuan Airport MRT' }, text: { 'zh-TW': '2017 年通車，紫色的線。直達車從台北車站到第一航廈大約 35 分鐘。', 'en-US': 'Opened in 2017, the purple line. Express trains reach Terminal 1 from Taipei Main Station in about 35 minutes.' } },
  ],
  labels: [
    { x: 11.5, y: AP.lounge.y1 - 0.5, text: { 'zh-TW': '🛫 窗邊看飛機（坐下專注）', 'en-US': '🛫 Plane-watching seats (sit to focus)' }, color: '#bae6fd' },
    { x: 36.5, y: AP.checkinLine - 4.4, text: { 'zh-TW': '🧳 報到櫃台', 'en-US': '🧳 Check-in' }, color: '#fde68a' },
    { x: 28, y: AP.road.y1 + 0.6, text: { 'zh-TW': '🚕 出境車道', 'en-US': '🚕 Departures curb' }, color: '#e5e7eb' },
  ],
  walkers: [
    { x0: 1, y0: 15.6, x1: 43, y1: 15.6, count: 4 },
    { x0: 23, y0: 17.6, x1: 55, y1: 17.6, count: 3 },
    { x0: 1, y0: 24.6, x1: 55, y1: 24.6, count: 5 },
    { x0: 1, y0: 27.1, x1: 55, y1: 27.1, count: 3 },
    { x0: 1, y0: 33, x1: 55, y1: 33, count: 3 },
  ],
  traffic: [
    { y: 30.1, dir: -1, x0: 0, x1: AP.W, count: 3 },
    { y: 31.3, dir: 1, x0: 0, x1: AP.W, count: 3 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點窗邊的候機椅看飛機、或咖啡座坐下專注 · 走到店門口買咖啡、飯糰、伴手禮 · 點航班看板看國際線 · 機場捷運站搭車回台北',
    'en-US': 'WASD / arrows to move · click a window seat to watch planes, or a café table, to focus · walk up to the shops for coffee, rice balls and souvenirs · click the departures board for international routes · Airport MRT back to Taipei',
  },
  hintTouch: {
    'zh-TW': '點窗邊候機椅或咖啡座坐下專注 · 走到店門口買東西 · 點航班看板 · 機場捷運回台北',
    'en-US': 'Tap a window seat or café table to focus · walk up to the shops · tap the departures board · Airport MRT back to Taipei',
  },
};
