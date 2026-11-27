// 沖繩 · 那霸的美術：首里城（小丘上的紅色正殿、御庭的紅白條紋、弧形的石牆、守禮門）、東邊山坡上的白色水泥屋（屋頂有黑色水塔）、
// 單軌電車（高架的軌道梁、縣廳前站、兩節的電車開進站停一下再開走）、國際通（紅瓦的伴手禮店、屋頂和門口一對對風獅爺）、
// 廣場（開口笑、紅芋冰淇淋的攤子，長椅前彈三線的人，紅瓦的沖繩麵食堂和外面的桌子）、扶桑花、椰子樹、
// 波之上海灘（白沙、遮陽傘躺椅、藍綠色的海）、海邊懸崖上的波上宮。最後組成 CityScene 用的 OKINAWA。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { OK, OKINAWA_SEATS, OKINAWA_SHOPS, PLAZA_BENCHES, PLAZA_BENCH_Y, PLAZA_CARTS, SOBA_TABLES, SOBA_TABLE_Y, UMBRELLAS, LOUNGER_Y } from './okinawa';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, cached, blit, road, tiles, zebra, drawBench, drawFoodCart, drawPalm, drawSeaWaves, drawStringLights } from './cityArt';
import { drawStoneLantern, drawStreetLamp } from './kyotoArt';

const TILE = '#c4502f';
const TILE_DARK = '#9a3a22';
const MORTAR = '#f4ece0';

// ── 地面（畫一次）──
export function paintOkinawaGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1429);
  const W = OK.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 4 * T);
  sky.addColorStop(0, '#4aa8e8');
  sky.addColorStop(1, '#d4eefa');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 4 * T);
  // 積雲
  for (const [x, y, r] of [[6, 1.2, 14], [8, 1, 18], [10, 1.3, 12], [40, 0.9, 16], [43, 1.1, 20], [46, 1.2, 13]] as const) {
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.arc(x * T, y * T + 6, r, 0, Math.PI * 2);
    c.fill();
  }
  // 首里的小丘（西邊高、東邊緩緩下去）
  c.fillStyle = '#4f8a46';
  c.beginPath();
  c.moveTo(0, 13 * T);
  for (let x = 0; x <= W; x += 8) {
    const hill = 3 * T + Math.pow(Math.max(0, (x - 17 * T) / (40 * T)), 2) * 3.5 * T + Math.sin(x * 0.02) * 4;
    c.lineTo(x, hill);
  }
  c.lineTo(W, 13 * T);
  c.fill();
  for (let i = 0; i < 260; i += 1) {
    const x = rand() * W;
    const y = 3.4 * T + rand() * 9 * T;
    c.fillStyle = ['#3f7a3c', '#5a9a52', '#467f40'][Math.floor(rand() * 3)] ?? '#3f7a3c';
    c.beginPath();
    c.arc(x, y, 3 + rand() * 5, 0, Math.PI * 2);
    c.fill();
  }
  // 東邊山坡上的那霸住宅：白色水泥方盒子、屋頂的黑色水塔
  for (let k = 0; k < 46; k += 1) {
    const x = 34 * T + rand() * 21.5 * T;
    const y = 5.2 * T + rand() * 6.4 * T;
    const w = 14 + Math.floor(rand() * 12);
    const h = 9 + Math.floor(rand() * 6);
    const wall = ['#f2efe8', '#e8e4da', '#f4e2d0', '#e2ecef', '#f2e6b8'][Math.floor(rand() * 5)] ?? '#f2efe8';
    px(c, 'rgba(0,0,0,0.15)', x + 2, y + h, w, 2);
    px(c, wall, x, y, w, h);
    px(c, 'rgba(0,0,0,0.1)', x + w - 3, y, 3, h);
    for (let wx = x + 2; wx < x + w - 4; wx += 5) px(c, '#6a8aa0', Math.round(wx), y + 3, 3, 3);
    if (rand() < 0.7) {
      px(c, '#2a2d33', x + 3, y - 4, 5, 4);
      px(c, '#44484f', x + 3, y - 4, 5, 1);
    }
    if (rand() < 0.25) px(c, TILE, x - 1, y - 2, w + 2, 2);
  }
  // 首里城：御庭（紅白條紋的地磚）、弧形的琉球石灰岩城牆
  const seidenL = OK.seiden.x0 * T;
  const seidenR = OK.seiden.x1 * T;
  for (let x = seidenL - 8, k = 0; x < seidenR + 8; x += 8, k += 1) px(c, k % 2 ? '#efe6d4' : '#c66a4a', x, OK.seiden.line * T, 8, 1.2 * T);
  px(c, 'rgba(0,0,0,0.12)', seidenL - 8, OK.seiden.line * T, seidenR - seidenL + 16, 2);
  const wallTop = (x: number) => 8.1 * T - Math.sin(((x - 4 * T) / (26 * T)) * Math.PI * 3) * 3;
  for (let x = 4 * T; x < 30 * T; x += 2) {
    const y = wallTop(x);
    px(c, '#d8cba8', x, y, 2, 1.2 * T);
    px(c, '#efe4c6', x, y, 2, 2);
  }
  for (let i = 0; i < 90; i += 1) px(c, '#b8a982', 4 * T + rand() * 26 * T, 8.4 * T + rand() * 0.8 * T, 4, 1);
  // 城牆往守禮門的石坂路
  c.fillStyle = '#d6ccb4';
  c.beginPath();
  c.moveTo(27 * T, 9.2 * T);
  c.lineTo(29 * T, 9.2 * T);
  c.lineTo(OK.shureimon.x * T + 14, OK.shureimon.line * T);
  c.lineTo(OK.shureimon.x * T - 14, OK.shureimon.line * T);
  c.fill();
  // 店家後面（被屋頂擋住）
  px(c, '#6a8a5a', 0, 12.4 * T, W, 3.6 * T);
  // 國際通：北側人行道、馬路、南側的廣場（珊瑚色的地磚）
  tiles(c, { x0: 0, y0: OK.shopLine, x1: OK.W, y1: OK.road.y0 }, '#e2d6c0', '#cfc1a8', 8);
  road(c, { x0: 0, y0: OK.road.y0, x1: OK.W, y1: OK.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#f2d24a', x, Math.round(((OK.road.y0 + OK.road.y1) / 2) * T), 12, 1);
  zebra(c, 13, OK.road.y0, 16.4, OK.road.y1, false);
  zebra(c, 40, OK.road.y0, 43.4, OK.road.y1, false);
  tiles(c, { x0: 0, y0: OK.road.y1, x1: OK.W, y1: OK.plazaY1 }, '#ecd8bc', '#dcc29e', 16);
  for (let i = 0; i < 70; i += 1) px(c, '#e4c8a4', Math.floor((rand() * W) / 16) * 16 + 1, Math.floor((OK.road.y1 * T + rand() * (OK.plazaY1 - OK.road.y1) * T) / 16) * 16 + 1, 15, 15);
  // 三線表演的地方：一塊圓形的石頭舞台
  c.fillStyle = '#d6c2a0';
  c.beginPath();
  c.ellipse(OK.sanshin.x * T, OK.sanshin.y * T - 2, 30, 12, 0, 0, Math.PI * 2);
  c.fill();
  // 海邊的步道（石灰岩）
  tiles(c, { x0: 0, y0: OK.plazaY1, x1: OK.cliff.x0, y1: OK.sand }, '#e8e2d2', '#d4ccb8', 12);
  // 沙灘
  px(c, '#f4ead2', 0, OK.sand * T, OK.cliff.x0 * T, (OK.sea - OK.sand) * T);
  for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#e8dcbc' : '#fbf4e2', Math.floor(rand() * OK.cliff.x0 * T), Math.floor(OK.sand * T + rand() * (OK.sea - OK.sand) * T), 2, 1);
  px(c, '#e2d4b0', 0, OK.sea * T - 8, OK.cliff.x0 * T, 8);
  // 海：岸邊淺淺的藍綠色、遠一點深藍
  const water = c.createLinearGradient(0, OK.sea * T, 0, OK.H * T);
  water.addColorStop(0, '#7fe0d6');
  water.addColorStop(0.35, '#3fbcd0');
  water.addColorStop(1, '#1f78b0');
  c.fillStyle = water;
  c.fillRect(0, OK.sea * T, W, (OK.H - OK.sea) * T);
  for (let i = 0; i < 40; i += 1) px(c, 'rgba(40,120,110,0.25)', Math.floor(rand() * W), Math.floor((OK.sea + 0.6 + rand() * 1.6) * T), 10 + Math.floor(rand() * 14), 3);
  // 懸崖上面：草地、往波上宮的石板參道
  const cx0 = OK.cliff.x0 * T;
  px(c, '#7aa65a', cx0, OK.cliff.top * T, W - cx0, (OK.cliff.edge - OK.cliff.top) * T);
  for (let i = 0; i < 80; i += 1) px(c, rand() < 0.5 ? '#6a9a4c' : '#8ab868', cx0 + Math.floor(rand() * (W - cx0)), OK.cliff.top * T + Math.floor(rand() * (OK.cliff.edge - OK.cliff.top) * T), 3, 2);
  tiles(c, { x0: OK.cliff.x0, y0: OK.cliff.top, x1: OK.W, y1: OK.shrine.line + 1 }, '#ddd6c4', '#c8c0aa', 12);
  // 懸崖（琉球石灰岩，坑坑洞洞）：西邊對沙灘的那面、南邊對海的那面
  const rock = (x0: number, y0: number, x1: number, y1: number) => {
    px(c, '#cdbf9c', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let i = 0; i < (x1 - x0) * (y1 - y0) * 3; i += 1) {
      px(c, rand() < 0.5 ? '#a8986f' : '#e0d4b4', Math.floor(x0 * T + rand() * (x1 - x0) * T), Math.floor(y0 * T + rand() * (y1 - y0) * T), 2 + Math.floor(rand() * 4), 1 + Math.floor(rand() * 3));
    }
    for (let x = x0 * T; x < x1 * T; x += 7 + Math.floor(rand() * 6)) px(c, 'rgba(90,70,40,0.25)', Math.round(x), y0 * T + 3, 1, (y1 - y0) * T - 6);
  };
  rock(OK.cliff.x0 - 0.7, OK.sand, OK.cliff.x0, OK.sea);
  rock(OK.cliff.x0 - 0.7, OK.cliff.edge, OK.W, OK.sea + 0.6);
  px(c, '#5a8a44', (OK.cliff.x0 - 0.7) * T, OK.cliff.edge * T - 2, (OK.W - OK.cliff.x0 + 0.7) * T, 3);
  px(c, '#5a8a44', (OK.cliff.x0 - 0.7) * T, OK.sand * T, 3, (OK.cliff.edge - OK.sand) * T);
}

// ── 紅瓦屋頂（沖繩的赤瓦：四坡頂、瓦縫抹白色灰泥）：x、y 是左上，inset 是屋脊兩端往內縮多少 ──
function akagawara(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, inset: number): void {
  c.fillStyle = TILE;
  c.beginPath();
  c.moveTo(x, y + h);
  c.lineTo(x + inset, y);
  c.lineTo(x + w - inset, y);
  c.lineTo(x + w, y + h);
  c.closePath();
  c.fill();
  // 一排排瓦、白色灰泥的縫
  for (let yy = y + 3, row = 0; yy < y + h - 1; yy += 3, row += 1) {
    const f = (yy - y) / h;
    const l = x + inset * (1 - f);
    const r = x + w - inset * (1 - f);
    px(c, TILE_DARK, Math.round(l), Math.round(yy), Math.round(r - l), 1);
    for (let xx = l + 2 + (row % 2) * 2; xx < r - 2; xx += 5) px(c, MORTAR, Math.round(xx), Math.round(yy) - 2, 1, 2);
  }
  // 屋脊、垂脊的白灰泥
  px(c, MORTAR, Math.round(x + inset), y, Math.round(w - inset * 2), 2);
  c.strokeStyle = MORTAR;
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(x + inset, y + 1);
  c.lineTo(x + 1, y + h - 1);
  c.moveTo(x + w - inset, y + 1);
  c.lineTo(x + w - 1, y + h - 1);
  c.stroke();
  px(c, 'rgba(0,0,0,0.3)', x, y + h - 1, w, 2);
}

// ── 風獅爺（シーサー）：x 是中間、by 是腳底（px）；flip 朝哪邊、open 張嘴（阿）還是閉嘴（吽）──
function drawShisa(c: CanvasRenderingContext2D, x: number, by: number, flip: 1 | -1, open: boolean, body = '#c8693c', mane = '#8a3a1e'): void {
  const cx = Math.round(x);
  px(c, 'rgba(0,0,0,0.2)', cx - 5, by - 1, 10, 2);
  // 身體（坐著）、前腳
  px(c, body, cx - 4, by - 7, 8, 6);
  px(c, mane, cx - 4 + (flip > 0 ? 5 : 0), by - 3, 3, 3);
  // 捲捲的尾巴
  px(c, mane, cx - flip * 5 - 1, by - 10, 3, 4);
  px(c, mane, cx - flip * 4 - 1, by - 11, 2, 2);
  // 頭、鬃毛
  const hx = cx - 4 + flip * 2;
  px(c, mane, hx - 1, by - 15, 10, 9);
  px(c, body, hx + 1, by - 13, 6, 6);
  px(c, '#ffffff', hx + 2 + (flip > 0 ? 2 : 0), by - 12, 2, 2);
  px(c, '#15171f', hx + 2 + (flip > 0 ? 3 : 0), by - 12, 1, 1);
  if (open) {
    px(c, '#7a1a14', hx + 1 + (flip > 0 ? 2 : 0), by - 9, 4, 2);
    px(c, '#ffffff', hx + 1 + (flip > 0 ? 2 : 0), by - 9, 4, 1);
  } else px(c, '#5a2a14', hx + 1 + (flip > 0 ? 2 : 0), by - 8, 4, 1);
}

// ── 首里城正殿：紅色的兩層大殿、紅瓦屋頂、正面中間的唐破風、金色的龍柱 ──
function seidenSprite(): HTMLCanvasElement {
  const w = Math.round((OK.seiden.x1 - OK.seiden.x0) * T);
  const h = 96;
  return cached('ok-seiden', w, h, (c) => {
    const cx = w / 2;
    // 石基壇
    px(c, '#d9cfb4', 6, h - 8, w - 12, 8);
    px(c, '#efe6cc', 6, h - 8, w - 12, 2);
    // 一樓：朱紅的牆、柱子、格子門
    px(c, '#b52a22', 20, h - 38, w - 40, 30);
    for (let x = 22; x < w - 22; x += 16) px(c, '#8a1f18', x, h - 38, 3, 30);
    for (let x = 28; x < w - 28; x += 16) {
      if (Math.abs(x + 4 - cx) < 22) continue;
      px(c, '#9a241c', x, h - 32, 9, 20);
      for (let y = h - 31; y < h - 13; y += 3) px(c, '#e0b64a', x + 1, y, 7, 1);
    }
    // 一樓的屋頂
    akagawara(c, 6, h - 52, w - 12, 16, 12);
    // 二樓
    px(c, '#b52a22', 44, h - 68, w - 88, 16);
    for (let x = 48; x < w - 48; x += 10) px(c, '#e0b64a', x, h - 64, 6, 1);
    for (let x = 48; x < w - 48; x += 10) px(c, '#7a1a14', x, h - 62, 6, 7);
    // 二樓的屋頂、屋脊兩端金色的龍頭
    akagawara(c, 30, h - 90, w - 60, 24, 30);
    for (const x of [58, w - 64]) {
      px(c, '#e0b64a', x, h - 96, 6, 7);
      px(c, '#c8962a', x + (x < cx ? 0 : 3), h - 92, 3, 2);
    }
    // 正面的唐破風（弧形的山牆）
    const bx0 = cx - 40;
    const bx1 = cx + 40;
    const base = h - 38;
    c.fillStyle = TILE;
    c.beginPath();
    c.moveTo(bx0 - 4, base);
    c.bezierCurveTo(bx0 + 10, base - 4, cx - 18, base - 30, cx, base - 30);
    c.bezierCurveTo(cx + 18, base - 30, bx1 - 10, base - 4, bx1 + 4, base);
    c.lineTo(bx1 - 4, base);
    c.bezierCurveTo(bx1 - 14, base - 4, cx + 16, base - 24, cx, base - 24);
    c.bezierCurveTo(cx - 16, base - 24, bx0 + 14, base - 4, bx0 + 4, base);
    c.closePath();
    c.fill();
    c.strokeStyle = MORTAR;
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(bx0 - 2, base - 1);
    c.bezierCurveTo(bx0 + 10, base - 5, cx - 18, base - 29, cx, base - 29);
    c.bezierCurveTo(cx + 18, base - 29, bx1 - 10, base - 5, bx1 + 2, base - 1);
    c.stroke();
    // 破風裡面：紅底金色的雕刻
    c.fillStyle = '#9a241c';
    c.beginPath();
    c.moveTo(bx0 + 6, base);
    c.bezierCurveTo(bx0 + 14, base - 4, cx - 16, base - 23, cx, base - 23);
    c.bezierCurveTo(cx + 16, base - 23, bx1 - 14, base - 4, bx1 - 6, base);
    c.closePath();
    c.fill();
    c.fillStyle = '#e0b64a';
    c.beginPath();
    c.arc(cx, base - 12, 5, 0, Math.PI * 2);
    c.fill();
    px(c, '#e0b64a', cx - 22, base - 6, 44, 1);
    px(c, '#c8962a', cx - 14, base - 9, 6, 2);
    px(c, '#c8962a', cx + 8, base - 9, 6, 2);
    // 正門、石階、兩根金色的龍柱
    px(c, '#7a1a14', cx - 14, h - 34, 28, 26);
    for (let y = h - 32; y < h - 10; y += 4) px(c, '#e0b64a', cx - 12, y, 24, 1);
    px(c, '#e2dac2', cx - 18, h - 8, 36, 8);
    for (let y = h - 6; y < h; y += 2) px(c, '#c8bea4', cx - 18, y, 36, 1);
    for (const x of [cx - 24, cx + 21]) {
      px(c, '#e0b64a', x, h - 30, 3, 22);
      px(c, '#c8962a', x - 1, h - 33, 5, 4);
      px(c, '#2a7a46', x + 1, h - 32, 1, 1);
    }
  });
}

// ── 守禮門：四根紅柱、兩層紅瓦屋頂、「守禮之邦」的匾 ──
function shureimonSprite(): HTMLCanvasElement {
  return cached('ok-shureimon', 72, 54, (c) => {
    const w = 72;
    const h = 54;
    px(c, 'rgba(0,0,0,0.2)', 4, h - 2, w - 8, 2);
    for (const x of [10, 24, 45, 59]) {
      px(c, '#b52a22', x, 24, 4, h - 25);
      px(c, 'rgba(255,255,255,0.2)', x, 24, 1, h - 25);
      px(c, '#d9cfb4', x - 1, h - 4, 6, 3);
    }
    px(c, '#8a1f18', 8, 30, w - 16, 3);
    // 下層屋頂（四個開間各自一塊）
    akagawara(c, 2, 18, w - 4, 10, 6);
    // 匾額
    px(c, '#2a1a14', w / 2 - 17, 13, 34, 9);
    px(c, '#e0b64a', w / 2 - 17, 13, 34, 1);
    text(c, '守禮之邦', w / 2, 17.5, '#f2d27a', `900 6px ${SERIF_TC}`);
    // 上層屋頂
    akagawara(c, 14, 2, w - 28, 11, 8);
    px(c, '#e0b64a', w / 2 - 1, 0, 2, 3);
  });
}

// ── 高架的單軌軌道梁（橫過整張圖）＋柱子 ──
function drawGuideway(c: CanvasRenderingContext2D): void {
  const top = OK.rail * T;
  for (let x = 20; x < OK.W * T; x += 72) {
    px(c, '#a8aeb6', x, top + 6, 8, 18);
    px(c, '#c4c9d0', x, top + 6, 2, 18);
  }
  px(c, '#b8bec6', 0, top, OK.W * T, 7);
  px(c, '#d6dae0', 0, top, OK.W * T, 2);
  px(c, 'rgba(0,0,0,0.2)', 0, top + 6, OK.W * T, 1);
}

// ── 縣廳前站：高架月台（後面是玻璃牆）、下面的站房、站名 ──
const STATION_H = 104;
const RAIL_IN_STATION = STATION_H - Math.round((OK.station.line - OK.rail) * T);
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((OK.station.x1 - OK.station.x0) * T);
  const h = STATION_H;
  const rail = RAIL_IN_STATION;
  return cached('ok-station', w, h, (c) => {
    // 月台後面的玻璃牆、柱子
    px(c, '#b8dcea', 4, 6, w - 8, rail - 6);
    for (let x = 4; x < w - 4; x += 12) px(c, '#8ab8cc', x, 6, 1, rail - 6);
    for (const x of [4, w / 2 - 2, w - 8]) px(c, '#e8eaee', x, 4, 4, rail - 4);
    // 月台（軌道梁在中間）
    px(c, '#b8bec6', 0, rail, w, 7);
    px(c, '#d6dae0', 0, rail, w, 2);
    px(c, '#e2e4e8', 0, rail + 7, w, 6);
    px(c, '#f2d24a', 0, rail + 7, w, 1);
    // 站房：白色的牆、大片玻璃、兩根大柱子
    px(c, '#eef0f2', 8, rail + 13, w - 16, h - rail - 13);
    for (let y = rail + 30; y < h - 22; y += 8) for (let x = 14; x < w - 14; x += 10) px(c, '#6a9ab4', x, y, 8, 6);
    for (const x of [8, w - 16]) px(c, '#d0d4da', x, rail + 13, 8, h - rail - 13);
    // 站名板
    px(c, '#ffffff', 16, rail + 15, w - 32, 13);
    px(c, '#2aa198', 16, rail + 15, w - 32, 2);
    text(c, '県庁前  Kenchōmae', w / 2 - 8, rail + 22, '#1f2a44', `900 7px ${FONT_TC}`);
    px(c, '#d8382a', w - 30, rail + 18, 10, 8);
    text(c, '✈', w - 25, rail + 22, '#ffffff', `900 6px ${FONT_TC}`);
    // 入口、手扶梯
    const cx = w / 2;
    px(c, '#2a3a4a', cx - 26, h - 20, 52, 20);
    for (let x = cx - 22; x < cx + 22; x += 12) px(c, '#9fd8ff', x, h - 18, 9, 16);
    px(c, '#9aa0a8', 18, h - 22, 22, 22);
    for (let y = h - 20; y < h; y += 3) px(c, '#c4c9d0', 20, y, 18, 1);
  });
}
// 月台上的屋簷（畫在電車前面，電車從屋簷下開過）
function drawStationCanopy(c: CanvasRenderingContext2D): void {
  const x0 = OK.station.x0 * T;
  const w = (OK.station.x1 - OK.station.x0) * T;
  const top = OK.station.line * T - STATION_H;
  c.fillStyle = '#f4f6f8';
  c.beginPath();
  c.moveTo(x0 - 4, top + 7);
  c.quadraticCurveTo(x0 + w / 2, top - 6, x0 + w + 4, top + 7);
  c.lineTo(x0 + w + 4, top + 10);
  c.lineTo(x0 - 4, top + 10);
  c.fill();
  px(c, '#2aa198', x0 - 4, top + 8, w + 8, 2);
}

// 兩節的單軌電車：從東邊開進縣廳前站、停一下、往西開走（往那霸機場）
function drawMonorail(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cycle = 34;
  const t = d.seconds % cycle;
  if (t > 22) return;
  const stop = ((OK.station.x0 + OK.station.x1) / 2) * T;
  const start = OK.W * T + 80;
  const end = -90;
  let cx: number;
  if (t < 10) {
    const p = t / 10;
    cx = start + (stop - start) * (1 - (1 - p) * (1 - p));
  } else if (t < 15) cx = stop;
  else {
    const p = (t - 15) / 7;
    cx = stop + (end - stop) * p * p;
  }
  const top = OK.rail * T;
  c.save();
  c.beginPath();
  c.rect(0, top - 20, OK.W * T, 30);
  c.clip();
  const len = 58;
  for (let k = 0; k < 2; k += 1) {
    const x = Math.round(cx - len + k * (len + 2));
    // 車身（跨坐在梁上）
    px(c, '#f4f6f8', x, top - 15, len, 15);
    px(c, '#c9ccd2', x, top - 1, len, 5);
    px(c, '#e8eaee', x + 1, top - 16, len - 2, 1);
    // 窗、門
    px(c, '#2f3d4c', x + 3, top - 12, len - 6, 6);
    for (let wx = x + 12; wx < x + len - 4; wx += 14) px(c, '#e8eaee', wx, top - 12, 2, 6);
    for (const dx of [16, 40]) px(c, t >= 10 && t < 15 ? '#2f3d4c' : '#dde0e4', x + dx, top - 12, 8, 11);
    // 紅色和藍綠色的線條
    px(c, '#d8382a', x, top - 5, len, 2);
    px(c, '#2aa198', x, top - 3, len, 1);
    // 車頭（圓圓的）
    if (k === 0) {
      px(c, '#f4f6f8', x - 4, top - 13, 4, 12);
      px(c, '#2f3d4c', x - 4, top - 11, 3, 5);
      px(c, '#ffe08a', x - 4, top - 4, 2, 2);
    } else {
      px(c, '#f4f6f8', x + len, top - 13, 4, 12);
      px(c, '#2f3d4c', x + len + 1, top - 11, 3, 5);
      px(c, '#ff6a4a', x + len + 2, top - 4, 2, 2);
    }
  }
  c.restore();
}

// ── 國際通的伴手禮店：紅瓦屋頂或水泥樓＋紅瓦的雨庇、招牌、店門口的商品，屋頂和門口一對風獅爺 ──
interface Store {
  x0: number;
  x1: number;
  word: string;
  col: string;
  kind: 'tile' | 'flat';
  wall: string;
}
const STORES: Store[] = [
  { x0: 12.5, x1: 18, word: 'お土産', col: '#c62828', kind: 'tile', wall: '#f2ece0' },
  { x0: 18, x1: 23, word: '泡盛', col: '#1f5fa8', kind: 'flat', wall: '#e6eef2' },
  { x0: 23, x1: 28.6, word: 'シーサー', col: '#d97a1a', kind: 'tile', wall: '#f4e6cc' },
  { x0: 28.6, x1: 33, word: '紅型', col: '#8a3aa8', kind: 'flat', wall: '#f6e2dc' },
  { x0: 33, x1: 38.6, word: '黒糖', col: '#5a3a22', kind: 'tile', wall: '#efe8d6' },
  { x0: 38.6, x1: 43.6, word: 'ちんすこう', col: '#e07a1f', kind: 'flat', wall: '#f4efc8' },
  { x0: 43.6, x1: 49.4, word: 'かりゆし', col: '#2a7a46', kind: 'tile', wall: '#f2ece0' },
  { x0: 49.4, x1: 55.5, word: '三線', col: '#15171f', kind: 'flat', wall: '#e2eadf' },
];
const STORE_H = 70;
function storeSprite(s: Store, i: number): HTMLCanvasElement {
  const w = Math.round((s.x1 - s.x0) * T);
  const h = STORE_H;
  return cached(`ok-store-${i}`, w, h, (c) => {
    const rand = seeded(300 + i * 17);
    const bodyTop = s.kind === 'tile' ? 30 : 16;
    px(c, s.wall, 2, bodyTop, w - 4, h - bodyTop);
    px(c, 'rgba(0,0,0,0.1)', w - 5, bodyTop, 3, h - bodyTop);
    if (s.kind === 'tile') {
      // 紅瓦的四坡屋頂，屋脊上坐一隻風獅爺
      akagawara(c, 0, 14, w, 18, 14);
      drawShisa(c, w / 2, 16, 1, true);
    } else {
      // 水泥樓：女兒牆、兩端一對風獅爺
      px(c, s.wall, 2, 10, w - 4, 6);
      px(c, 'rgba(0,0,0,0.15)', 2, 16, w - 4, 1);
      drawShisa(c, 9, 11, 1, true, '#b8b0a0', '#7a7266');
      drawShisa(c, w - 9, 11, -1, false, '#b8b0a0', '#7a7266');
    }
    // 樓上的窗（百葉）
    for (let x = 6; x + 12 < w - 4; x += 16) {
      px(c, '#5a4636', x - 1, bodyTop + 3, 14, 10);
      px(c, '#9fc7d9', x, bodyTop + 4, 12, 8);
      for (let y = bodyTop + 5; y < bodyTop + 12; y += 2) px(c, 'rgba(255,255,255,0.5)', x, y, 12, 1);
      if (rand() < 0.4) px(c, '#3f7a3a', x + 2, bodyTop + 12, 8, 2);
    }
    // 招牌
    const signY = h - 34;
    px(c, '#ffffff', 5, signY, w - 10, 9);
    px(c, s.col, 5, signY, w - 10, 1);
    px(c, s.col, 5, signY + 8, w - 10, 1);
    text(c, s.word, w / 2, signY + 4.5, s.col, `900 7px ${FONT_TC}`);
    // 紅瓦的雨庇
    akagawara(c, -1, h - 25, w + 2, 6, 3);
    // 店面：裡面亮著燈、掛著的花襯衫和一格格的商品
    px(c, '#3a2e28', 2, h - 19, w - 4, 19);
    px(c, '#f6e6c4', 5, h - 17, w - 10, 15);
    for (let x = 7; x < w - 8; x += 6) {
      const col = ['#e8402e', '#3f86d0', '#f6c945', '#2bb673', '#ff6ad5', '#ffffff'][Math.floor(rand() * 6)] ?? '#e8402e';
      px(c, col, x, h - 16, 5, 6);
      px(c, 'rgba(255,255,255,0.4)', x + 1, h - 15, 1, 2);
    }
    for (let x = 7; x < w - 8; x += 4) px(c, ['#c98a3c', '#7a9a5a', '#b07ad0', '#d8382a'][Math.floor(rand() * 4)] ?? '#c98a3c', x, h - 8, 3, 3);
    px(c, '#8a5a32', 5, h - 5, w - 10, 2);
    // 門口左右一對風獅爺（阿吽）
    drawShisa(c, 6, h, 1, true);
    drawShisa(c, w - 6, h, -1, false);
  });
}

// ── 沖繩麵食堂：木造平房、大大的紅瓦屋頂、屋脊上的風獅爺、藍色的門簾 ──
function shokudoSprite(): HTMLCanvasElement {
  const w = Math.round((OK.shokudo.x1 - OK.shokudo.x0) * T);
  const h = 80;
  return cached('ok-shokudo', w, h, (c) => {
    const cx = w / 2;
    // 牆（木板）
    px(c, '#a8703f', 6, 40, w - 12, h - 40);
    for (let x = 8; x < w - 8; x += 5) px(c, '#8a5a32', x, 40, 1, h - 40);
    // 打開的拉門：裡面亮亮的、有客人的桌子
    px(c, '#f6e2b8', 14, 50, w - 28, h - 52);
    for (let x = 20; x < w - 24; x += 22) {
      px(c, '#8a5a32', x, h - 12, 14, 3);
      px(c, '#f4efe2', x + 3, h - 14, 3, 2);
      px(c, '#f4efe2', x + 8, h - 14, 3, 2);
    }
    for (let x = 14; x < w - 14; x += 22) px(c, '#6a4428', x, 48, 3, h - 48);
    // 屋頂
    akagawara(c, 0, 12, w, 30, 30);
    drawShisa(c, cx, 14, 1, true);
    // 屋簷下的招牌
    px(c, '#f4ecd8', cx - 30, 42, 60, 11);
    px(c, '#5a3a22', cx - 30, 42, 60, 1);
    text(c, '沖縄そば 食堂', cx, 47.5, '#5a2a14', `900 8px ${SERIF_TC}`);
    // 門簾
    px(c, '#2a3a6a', cx - 14, 54, 28, 12);
    for (let x = cx - 14 + 7; x < cx + 14; x += 7) px(c, '#1a2450', x, 58, 1, 8);
    text(c, 'そば', cx, 59, '#ffffff', `900 6px ${FONT_TC}`);
    // 兩邊的盆栽（扶桑花）
    for (const x of [8, w - 16]) {
      px(c, '#8a5a32', x, h - 6, 8, 6);
      c.fillStyle = '#3f7a3a';
      c.beginPath();
      c.arc(x + 4, h - 10, 6, 0, Math.PI * 2);
      c.fill();
      px(c, '#e8402e', x + 1, h - 13, 3, 3);
      px(c, '#e8402e', x + 5, h - 9, 3, 3);
    }
  });
}

// ── 波上宮：懸崖上的神社，朱紅的柱子＋沖繩式的紅瓦屋頂、後面的本殿、注連繩 ──
function shrineSprite(): HTMLCanvasElement {
  const w = Math.round((OK.shrine.x1 - OK.shrine.x0) * T);
  const h = 76;
  return cached('ok-shrine', w, h, (c) => {
    const cx = w / 2;
    // 後面的本殿（比較高）
    px(c, '#c8402a', cx - 22, 14, 44, 22);
    akagawara(c, cx - 30, 2, 60, 14, 12);
    // 石基壇
    px(c, '#d6ceba', 4, h - 7, w - 8, 7);
    px(c, '#ece4d0', 4, h - 7, w - 8, 2);
    // 拜殿：朱紅柱子、白牆、格子
    px(c, '#f4efe2', 14, h - 36, w - 28, 29);
    for (let x = 14; x < w - 12; x += 20) px(c, '#d24a2a', x, h - 36, 4, 29);
    px(c, '#d24a2a', 12, h - 36, w - 24, 3);
    px(c, '#5a3a22', cx - 16, h - 30, 32, 23);
    for (let x = cx - 14; x < cx + 14; x += 4) px(c, '#8a5a32', x, h - 29, 1, 21);
    // 拜殿的屋頂
    akagawara(c, 2, h - 52, w - 4, 18, 16);
    // 注連繩、白色的紙垂
    c.strokeStyle = '#d8c48a';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx - 20, h - 31);
    c.quadraticCurveTo(cx, h - 25, cx + 20, h - 31);
    c.stroke();
    for (const x of [cx - 10, cx, cx + 10]) {
      px(c, '#ffffff', x - 1, h - 27, 2, 3);
      px(c, '#ffffff', x, h - 24, 2, 3);
    }
    // 賽錢箱
    px(c, '#6a4428', cx - 8, h - 13, 16, 6);
    for (let x = cx - 7; x < cx + 7; x += 2) px(c, '#3a2614', x, h - 13, 1, 2);
    // 門口一對風獅爺（石頭的）
    drawShisa(c, 10, h - 7, 1, true, '#b8b0a0', '#7a7266');
    drawShisa(c, w - 10, h - 7, -1, false, '#b8b0a0', '#7a7266');
  });
}

// 鳥居（石造的灰色鳥居）
function drawTorii(c: CanvasRenderingContext2D): void {
  const cx = Math.round(OK.torii.x * T);
  const by = Math.round(OK.torii.line * T);
  const half = 18;
  px(c, 'rgba(0,0,0,0.2)', cx - half - 2, by - 1, half * 2 + 4, 3);
  for (const x of [cx - half + 3, cx + half - 7]) {
    px(c, '#a8a296', x, by - 40, 4, 40);
    px(c, '#c4beb2', x, by - 40, 1, 40);
  }
  px(c, '#9a948a', cx - half, by - 34, half * 2, 3);
  c.fillStyle = '#8a847a';
  c.beginPath();
  c.moveTo(cx - half - 5, by - 44);
  c.quadraticCurveTo(cx, by - 41, cx + half + 5, by - 44);
  c.lineTo(cx + half + 4, by - 40);
  c.lineTo(cx - half - 4, by - 40);
  c.fill();
  px(c, '#2a1a14', cx - 4, by - 40, 8, 6);
}

// ── 扶桑花的灌木 ──
function drawHibiscus(c: CanvasRenderingContext2D, x: number, y: number, seed: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const rand = seeded(seed);
  px(c, 'rgba(0,0,0,0.18)', cx - 11, by - 1, 22, 3);
  for (const [dx, dy, r, col] of [[-6, -6, 7, '#2f6a32'], [6, -6, 7, '#2f6a32'], [0, -10, 8, '#3f7a3a'], [0, -5, 7, '#4a8a42']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  for (let k = 0; k < 5; k += 1) {
    const fx = cx - 9 + Math.floor(rand() * 18);
    const fy = by - 15 + Math.floor(rand() * 11);
    const col = rand() < 0.75 ? '#e8302e' : '#ff8ab0';
    px(c, col, fx - 2, fy, 5, 2);
    px(c, col, fx - 1, fy - 1, 3, 4);
    px(c, '#ffd23f', fx, fy, 1, 1);
  }
}

// ── 彈三線的人：坐在小凳子上，手上的三線（黑色蛇皮的琴身、長長的琴桿），音符往上飄 ──
function drawSanshinPlayer(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(OK.sanshin.x * T);
  const by = Math.round(OK.sanshin.y * T);
  px(c, 'rgba(0,0,0,0.22)', cx - 8, by - 1, 16, 3);
  px(c, '#8a5a32', cx - 6, by - 6, 12, 3);
  px(c, '#6a4428', cx - 5, by - 3, 2, 3);
  px(c, '#6a4428', cx + 3, by - 3, 2, 3);
  const man = getAvatarFrame(lookColors(3, 2, { body: 1 }), 'down', 'idle');
  c.drawImage(man, Math.round(cx - man.width / 2), by - 4 - man.height + 2);
  // 三線：琴身在肚子前、琴桿往左上斜
  const strum = Math.sin(d.seconds * 8) > 0 ? 1 : 0;
  px(c, '#15171f', cx - 3, by - 14, 7, 6);
  px(c, '#e8e2d4', cx - 2, by - 13, 5, 4);
  c.strokeStyle = '#2a1a14';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - 1, by - 12);
  c.lineTo(cx - 13, by - 26);
  c.stroke();
  px(c, '#2a1a14', cx - 15, by - 29, 3, 4);
  px(c, '#e8b48a', cx + 3 + strum, by - 12, 3, 3);
  // 音符
  for (let k = 0; k < 3; k += 1) {
    const t = (d.seconds * 0.5 + k / 3) % 1;
    c.globalAlpha = 1 - t;
    text(c, k % 2 ? '♪' : '♫', cx + 8 + k * 4 + Math.sin(d.seconds * 2 + k) * 3, by - 30 - t * 22, d.night ? '#ffe08a' : '#2a3a6a', `900 9px ${FONT_TC}`);
    c.globalAlpha = 1;
  }
}

// ── 沖繩麵食堂外的木桌（上面兩碗沖繩麵）──
function drawSobaTable(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const half = Math.round(1.2 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 1, half * 2, 3);
  px(c, '#8a5a32', cx - half, by - 9, half * 2, 5);
  px(c, '#b5804a', cx - half, by - 9, half * 2, 1);
  px(c, '#6a4428', cx - half + 2, by - 4, 2, 5);
  px(c, '#6a4428', cx + half - 4, by - 4, 2, 5);
  for (const dx of [-10, 4]) {
    px(c, '#f4efe2', cx + dx, by - 12, 7, 3);
    px(c, '#e8c46a', cx + dx + 1, by - 12, 5, 1);
    px(c, '#a8483a', cx + dx + 2, by - 13, 3, 1);
  }
  px(c, '#e8402e', cx - 1, by - 14, 2, 4);
}
function drawWoodStool(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 5, by + 1, 10, 2);
  px(c, '#a8703f', cx - 5, by - 4, 10, 3);
  px(c, '#c48a52', cx - 5, by - 4, 10, 1);
  px(c, '#6a4428', cx - 4, by - 1, 2, 3);
  px(c, '#6a4428', cx + 2, by - 1, 2, 3);
}

// ── 海灘：遮陽傘、躺椅 ──
const UMBRELLA_COLORS = ['#e8402e', '#2aa198'];
function drawUmbrella(c: CanvasRenderingContext2D, x: number, color: string): void {
  const cx = Math.round(x * T);
  const by = Math.round(LOUNGER_Y * T);
  px(c, '#e8e2d4', cx, by - 36, 2, 36);
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
  for (let k = 0; k < 14; k += 4) px(c, '#2aa198', cx - 7 + k, by - 4, 2, 8);
  px(c, '#f2f2f2', cx - 7, by - 10, 14, 6);
  for (let k = 0; k < 14; k += 4) px(c, '#2aa198', cx - 7 + k, by - 10, 2, 6);
  px(c, '#8a8a90', cx - 6, by + 4, 2, 2);
  px(c, '#8a8a90', cx + 4, by + 4, 2, 2);
}

// 沙灘上的浴巾、游泳圈、沙堡（裝飾）
function drawBeachBits(c: CanvasRenderingContext2D): void {
  const towel = (x: number, y: number, a: string, b: string) => {
    for (let k = 0; k < 4; k += 1) px(c, k % 2 ? a : b, x * T, y * T + k * 4, 26, 4);
  };
  towel(31, 32.4, '#f6c945', '#3f86d0');
  towel(4.4, 31.6, '#ff6ad5', '#ffffff');
  c.strokeStyle = '#ff5a4a';
  c.lineWidth = 3;
  c.beginPath();
  c.arc(34.6 * T, 35.4 * T, 5, 0, Math.PI * 2);
  c.stroke();
  const sx = 17.4 * T;
  const sy = 36.4 * T;
  px(c, '#e2cf9e', sx - 8, sy - 6, 16, 6);
  px(c, '#e2cf9e', sx - 4, sy - 11, 8, 5);
  px(c, '#d2bc88', sx - 1, sy - 14, 2, 3);
  px(c, '#e8402e', sx, sy - 18, 4, 3);
}

// ── 海上：游泳的人、立槳衝浪、遠方的渡輪（往慶良間的船）──
function drawSea(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, OK.sea * T - 50, OK.W * T, (OK.H - OK.sea) * T + 50);
  c.clip();
  drawSeaWaves(c, 0, OK.cliff.x0 - 0.7, OK.sea, OK.H, d.seconds);
  // 懸崖下打上來的白浪
  for (let x = (OK.cliff.x0 - 0.7) * T; x < OK.W * T; x += 6) {
    const yy = (OK.sea + 0.6) * T + Math.sin(d.seconds * 1.2 + x * 0.07) * 2;
    px(c, 'rgba(255,255,255,0.8)', Math.round(x), Math.round(yy), 5, 2);
  }
  // 渡輪
  const span = OK.W * T + 240;
  const fx = OK.W * T + 120 - ((d.seconds * 6) % span);
  const fy = (OK.H - 1.4) * T;
  px(c, 'rgba(0,0,0,0.15)', fx - 44, fy + 2, 88, 3);
  px(c, '#f4f6f8', fx - 44, fy - 10, 88, 12);
  px(c, '#2a6ab0', fx - 44, fy - 1, 88, 3);
  px(c, '#f4f6f8', fx - 26, fy - 20, 50, 10);
  for (let k = -22; k < 22; k += 7) px(c, '#3a4a5a', fx + k, fy - 17, 4, 3);
  px(c, '#2aa198', fx + 6, fy - 26, 6, 6);
  // 立槳衝浪
  const sx = ((d.seconds * 7) % (36 * T)) + 2 * T;
  const sy = (OK.sea + 2.6) * T + Math.sin(d.seconds * 1.3) * 2;
  px(c, '#ffd23f', Math.round(sx) - 9, Math.round(sy), 18, 3);
  px(c, '#e8402e', Math.round(sx) - 2, Math.round(sy) - 10, 4, 10);
  px(c, '#e8b48a', Math.round(sx) - 1, Math.round(sy) - 13, 3, 3);
  px(c, '#2a1a14', Math.round(sx) + 3, Math.round(sy) - 14, 1, 14);
  // 游泳的人（頭在水面上浮浮的）
  for (let k = 0; k < 4; k += 1) {
    const x = (6 + k * 8.5) * T + Math.sin(d.seconds * 0.3 + k) * 10;
    const y = (OK.sea + 1.2 + (k % 2) * 1.4) * T + Math.sin(d.seconds * 2 + k) * 1.5;
    px(c, 'rgba(255,255,255,0.6)', Math.round(x) - 6, Math.round(y) + 3, 12, 1);
    px(c, ['#2a1a14', '#6a4a2a', '#15171f', '#2a1a14'][k] ?? '#2a1a14', Math.round(x) - 2, Math.round(y) - 3, 5, 3);
    px(c, '#e8b48a', Math.round(x) - 2, Math.round(y), 5, 3);
    if (k === 1) {
      c.strokeStyle = '#ff6ad5';
      c.lineWidth = 3;
      c.beginPath();
      c.ellipse(Math.round(x), Math.round(y) + 3, 7, 3, 0, 0, Math.PI * 2);
      c.stroke();
    }
  }
  c.restore();
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = OKINAWA_SEATS[i];
  if (!s) return;
  if (i < 4) drawLounger(c, s.x, s.y);
  else if (i >= 8) drawWoodStool(c, s.x, s.y);
}

const PALMS: [number, number, number][] = [[1.4, 22.2, 40], [13.2, 22.6, 44], [25.8, 22.8, 42], [42.2, 21.6, 46], [53.8, 22.4, 40], [2, 31, 44], [37.8, 31.2, 48], [55, 30.6, 38], [27.6, 30.4, 40]];
const HIBISCUS: [number, number][] = [[14.6, 28.4], [24.4, 28.4], [41.2, 28.2], [44.6, 25.4], [52.6, 26.8], [0.8, 28.4], [6.8, 28.4]];
const LAMPS: [number, number][] = [[1, 16.9], [14.4, 16.9], [27.4, 16.9], [40.6, 16.9], [53.6, 16.9], [12.6, 20.2], [26.8, 20.2], [40.6, 20.2], [55, 20.2], [8, 29.4], [20.6, 29.4], [33, 29.4]];
const BIG_SHISA: { x: number; y: number; flip: 1 | -1; open: boolean }[] = [
  { x: 47.6, y: 23.6, flip: 1, open: true },
  { x: 51.2, y: 23.6, flip: -1, open: false },
];
const SHRINE_LANTERNS: [number, number][] = [[44.6, 32.8], [54.8, 32.8]];

const props: CityProp[] = [
  { y: OK.seiden.line, draw: (c) => blit(c, seidenSprite(), OK.seiden.x0 * T, OK.seiden.line * T) },
  { y: OK.shureimon.line, draw: (c) => blit(c, shureimonSprite(), OK.shureimon.x * T - 36, OK.shureimon.line * T) },
  { y: 12, draw: (c) => drawGuideway(c) },
  ...STORES.map((s, i): CityProp => ({ y: OK.shopLine, draw: (c) => blit(c, storeSprite(s, i), s.x0 * T, OK.shopLine * T) })),
  { y: OK.station.line, draw: (c) => blit(c, stationSprite(), OK.station.x0 * T, OK.station.line * T) },
  { y: OK.station.line + 0.01, draw: (c, d) => drawMonorail(c, d) },
  { y: OK.station.line + 0.02, draw: (c) => drawStationCanopy(c) },
  ...PLAZA_CARTS.map((s, i): CityProp => ({ y: OK.cartY, draw: (c, d) => drawFoodCart(c, s.x, OK.cartY, s.name, s.awning, s.food, d.seconds + i * 0.37, 83 + i * 7) })),
  ...PLAZA_BENCHES.map((x): CityProp => ({ y: PLAZA_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, PLAZA_BENCH_Y, 2.6) })),
  { y: OK.sanshin.y, draw: (c, d) => drawSanshinPlayer(c, d) },
  { y: 21.2, draw: (c, d) => drawStringLights(c, 14.4, 25, 20.6, d.night, 4) },
  { y: OK.shokudo.line, draw: (c) => blit(c, shokudoSprite(), OK.shokudo.x0 * T, OK.shokudo.line * T) },
  ...SOBA_TABLES.map((x): CityProp => ({ y: SOBA_TABLE_Y, draw: (c) => drawSobaTable(c, x, SOBA_TABLE_Y) })),
  ...BIG_SHISA.map((s): CityProp => ({
    y: s.y,
    draw: (c) => {
      const cx = s.x * T;
      const by = s.y * T;
      px(c, '#b8ae98', cx - 9, by - 6, 18, 6);
      px(c, '#d0c6b0', cx - 9, by - 6, 18, 2);
      c.save();
      c.translate(cx, by - 6);
      c.scale(1.6, 1.6);
      drawShisa(c, 0, 0, s.flip, s.open, '#c8693c', '#8a3a1e');
      c.restore();
    },
  })),
  { y: OK.sand + 0.1, draw: (c) => drawBeachBits(c) },
  ...UMBRELLAS.map((x, i): CityProp => ({ y: LOUNGER_Y + 0.02, draw: (c) => drawUmbrella(c, x, UMBRELLA_COLORS[i] ?? '#e8402e') })),
  { y: OK.torii.line, draw: (c) => drawTorii(c) },
  { y: OK.shrine.line, draw: (c) => blit(c, shrineSprite(), OK.shrine.x0 * T, OK.shrine.line * T) },
  ...SHRINE_LANTERNS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStoneLantern(c, x, y, d.night) })),
  { y: OK.H, draw: (c, d) => drawSea(c, d) },
  ...PALMS.map(([x, y, h]): CityProp => ({ y, draw: (c, d) => drawPalm(c, x, y, d.seconds, h) })),
  ...HIBISCUS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawHibiscus(c, x, y, 40 + i * 13) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  // 小丘、店家、車站
  r(0, 0, OK.W, OK.shopLine - 0.5),
  ...PLAZA_CARTS.map((s) => r(s.x - 1.25, OK.cartY - 0.8, s.x + 1.25, OK.cartY - 0.05)),
  ...PLAZA_BENCHES.map((x) => r(x - 1.3, PLAZA_BENCH_Y - 0.75, x + 1.3, PLAZA_BENCH_Y - 0.45)),
  r(OK.sanshin.x - 0.6, OK.sanshin.y - 0.6, OK.sanshin.x + 0.6, OK.sanshin.y),
  r(OK.shokudo.x0 + 0.2, OK.shokudo.line - 2.2, OK.shokudo.x1 - 0.2, OK.shokudo.line - 0.05),
  ...SOBA_TABLES.map((x) => r(x - 1.2, SOBA_TABLE_Y - 0.4, x + 1.2, SOBA_TABLE_Y)),
  ...BIG_SHISA.map((s) => r(s.x - 0.6, s.y - 0.4, s.x + 0.6, s.y)),
  ...UMBRELLAS.map((x) => r(x - 0.2, LOUNGER_Y - 0.3, x + 0.2, LOUNGER_Y + 0.05)),
  // 懸崖（沙灘那面、海那面）、海
  r(OK.cliff.x0 - 0.7, OK.sand, OK.cliff.x0, OK.sea),
  r(OK.cliff.x0 - 0.7, OK.cliff.edge, OK.W, OK.H),
  r(0, OK.sea - 0.1, OK.W, OK.H),
  // 波上宮、鳥居的柱子、石燈籠
  r(OK.shrine.x0 + 0.3, OK.shrine.line - 1.6, OK.shrine.x1 - 0.3, OK.shrine.line - 0.05),
  r(OK.torii.x - 1.0, OK.torii.line - 0.3, OK.torii.x - 0.6, OK.torii.line),
  r(OK.torii.x + 0.6, OK.torii.line - 0.3, OK.torii.x + 1.0, OK.torii.line),
  ...SHRINE_LANTERNS.map(([x, y]) => r(x - 0.3, y - 0.3, x + 0.3, y)),
  ...PALMS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...HIBISCUS.map(([x, y]) => r(x - 0.6, y - 0.5, x + 0.6, y)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...STORES.map((s) => ({ x: ((s.x0 + s.x1) / 2) * T, y: OK.shopLine * T - 10, r: 50, color: 'rgba(255, 210, 140, 0.5)' })),
  ...PLAZA_CARTS.map((s) => ({ x: s.x * T, y: OK.cartY * T - 14, r: 40, color: 'rgba(255, 180, 120, 0.5)' })),
  { x: ((OK.shokudo.x0 + OK.shokudo.x1) / 2) * T, y: OK.shokudo.line * T - 16, r: 80, color: 'rgba(255, 190, 120, 0.5)' },
  { x: ((OK.seiden.x0 + OK.seiden.x1) / 2) * T, y: OK.seiden.line * T - 40, r: 160, color: 'rgba(255, 150, 100, 0.55)' },
  { x: OK.shureimon.x * T, y: OK.shureimon.line * T - 24, r: 50, color: 'rgba(255, 170, 110, 0.4)' },
  { x: ((OK.station.x0 + OK.station.x1) / 2) * T, y: OK.rail * T, r: 100, color: 'rgba(220, 240, 255, 0.45)' },
  { x: ((OK.shrine.x0 + OK.shrine.x1) / 2) * T, y: OK.shrine.line * T - 30, r: 80, color: 'rgba(255, 200, 130, 0.45)' },
  { x: OK.sanshin.x * T, y: OK.sanshin.y * T - 10, r: 50, color: 'rgba(255, 220, 150, 0.4)' },
];

const stationX = (OK.station.x0 + OK.station.x1) / 2;
const shrineX = (OK.shrine.x0 + OK.shrine.x1) / 2;

export const OKINAWA: CityDef = {
  id: 'okinawa',
  country: 'jp',
  line: 'flight',
  W: OK.W,
  H: OK.H,
  title: { 'zh-TW': '沖繩 · 那霸國際通', 'en-US': 'Okinawa · Naha Kokusai-dori' },
  stop: { 'zh-TW': '沖繩（那霸機場）', 'en-US': 'Okinawa (Naha Airport)' },
  emoji: '🌺',
  station: {
    x: stationX,
    y: OK.station.line + 0.6,
    name: { 'zh-TW': '縣廳前站（往那霸機場）', 'en-US': 'Kenchōmae Station (to Naha Airport)' },
    arrive: { x: stationX + 2.6, y: OK.station.line + 0.7 },
  },
  background: '#ecd8bc',
  soundscape: 'beach',
  paintGround: paintOkinawaGround,
  props,
  solid,
  seats: OKINAWA_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: OKINAWA_SHOPS,
  fortune: {
    at: r(shrineX - 2.4, OK.shrine.line, shrineX + 2.4, OK.cliff.edge),
    label: { x: shrineX, y: OK.shrine.line - 5.2 },
    title: { 'zh-TW': '波上宮 · 御神籤', 'en-US': 'Naminoue-gū · Omikuji' },
    hint: { 'zh-TW': '在海邊的懸崖上抽一支籤，聽著浪聲看看今天的運氣。', 'en-US': 'Draw a slip on the seaside cliff and let the waves tell you today’s luck.' },
    draw: { 'zh-TW': '抽籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再抽一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great blessing' }, text: { 'zh-TW': '海風順、浪也順，今天專注一路到底！', 'en-US': 'Fair wind, gentle waves — focus all the way today!' } },
      { rank: { 'zh-TW': '吉', 'en-US': 'Blessing' }, text: { 'zh-TW': 'なんくるないさ（船到橋頭自然直），一步一步來就好。', 'en-US': '“Nankuru naisa” — it’ll work out. Just take it step by step.' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Middle blessing' }, text: { 'zh-TW': '風獅爺幫你擋掉分心，先完成一顆番茄鐘。', 'en-US': 'The shisa will ward off distractions — finish one pomodoro first.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small blessing' }, text: { 'zh-TW': '先吃一顆開口笑補充體力，再回來拚。', 'en-US': 'Have a sata andagi to recharge, then come back to it.' } },
      { rank: { 'zh-TW': '凶', 'en-US': 'Bad luck' }, text: { 'zh-TW': '抽到凶別擔心，綁在神社留給神明，專注一顆番茄鐘轉運！', 'en-US': 'Bad luck? Tie it up at the shrine and leave it behind. One pomodoro will turn it around!' } },
    ],
  },
  infos: [
    { at: r(OK.seiden.x0, 1, OK.seiden.x1, 9), title: { 'zh-TW': '首里城', 'en-US': 'Shuri Castle' }, text: { 'zh-TW': '琉球王國（1429–1879）的王城，蓋在首里的小丘上，紅色的正殿融合了中國和日本的建築風格。1945 年沖繩戰被燒毀、1992 年重建，2019 年 10 月又在大火中燒掉正殿，現在正在重建中。城跡是世界遺產「琉球王國的城堡及相關遺產群」的一部分。地圖上把它畫得離國際通很近，其實在東邊約 3 公里。', 'en-US': 'Royal palace of the Ryukyu Kingdom (1429–1879) on the Shuri hill; its red Seiden mixes Chinese and Japanese styles. Burned in the 1945 Battle of Okinawa and rebuilt in 1992, the Seiden burned again in October 2019 and is being rebuilt. The castle ruins are part of a UNESCO World Heritage site. On this map it sits right behind Kokusai-dori; in reality it’s about 3 km east.' } },
    { at: r(OK.shureimon.x - 2.4, 6.6, OK.shureimon.x + 2.4, OK.shureimon.line), title: { 'zh-TW': '守禮門', 'en-US': 'Shureimon Gate' }, text: { 'zh-TW': '首里城外的牌樓式大門，匾上寫「守禮之邦」（遵守禮節的國家）。現在的門是 1958 年重建的，也印在日本的 2000 圓紙鈔上。', 'en-US': 'The ceremonial gate below Shuri Castle; its plaque reads “Land of Propriety”. Rebuilt in 1958, it appears on Japan’s 2,000-yen note.' } },
    { at: r(OK.shops.x0, 12, OK.shops.x1, OK.shopLine), title: { 'zh-TW': '國際通', 'en-US': 'Kokusai-dori' }, text: { 'zh-TW': '那霸最熱鬧的大街，大約 1.6 公里長。戰後從一片廢墟很快重新繁榮起來，被叫做「奇蹟的一英里」。兩旁都是伴手禮店、泡盛和沖繩料理，屋頂和門口常常有一對風獅爺：一隻張嘴把福氣吸進來，一隻閉嘴把福氣留住。', 'en-US': 'Naha’s liveliest street, about 1.6 km long. It boomed out of the post-war ruins so fast it was called the “Miracle Mile”. It’s lined with souvenir shops, awamori and Okinawan food; shisa pairs guard roofs and doorways — one open-mouthed to let luck in, one closed to keep it.' } },
    { at: r(OK.station.x0, OK.rail - 1.2, OK.station.x1, OK.station.line), title: { 'zh-TW': '單軌電車 縣廳前站', 'en-US': 'Yui Rail · Kenchōmae Station' }, text: { 'zh-TW': '沖繩唯一的鐵路是 2003 年通車的單軌電車，車子跨坐在高架的梁上跑，從那霸機場到縣廳前站大約 12 分鐘。縣廳前站就在國際通的西邊入口。', 'en-US': 'Okinawa’s only railway is the monorail opened in 2003; trains straddle an elevated concrete beam. Naha Airport to Kenchōmae, at the west end of Kokusai-dori, takes about 12 minutes.' } },
    { at: r(OK.shrine.x0, OK.shrine.line - 5, OK.shrine.x1, OK.shrine.line), title: { 'zh-TW': '波上宮', 'en-US': 'Naminoue-gū Shrine' }, text: { 'zh-TW': '蓋在海邊懸崖上的神社，是琉球八社之首。古時候人們在這塊崖上向海的另一邊祈求豐收和平安。屋頂是沖繩特有的紅瓦，門口守著的是風獅爺。', 'en-US': 'A shrine perched on a seaside cliff, the foremost of the Eight Shrines of Ryukyu. People once prayed here toward the sea for good harvests and safe voyages. Note the Okinawan red-tile roof and the shisa guardians.' } },
    { at: r(0, OK.sand, OK.cliff.x0 - 0.7, OK.sea), title: { 'zh-TW': '波之上海灘', 'en-US': 'Naminoue Beach' }, text: { 'zh-TW': '那霸市區唯一的海灘，就在波上宮的懸崖下面，從國際通走路約 15 分鐘。實際上海灘上方有一條高架道路（這裡沒畫），海水是沖繩特有的藍綠色。', 'en-US': 'The only beach in central Naha, right below Naminoue-gū’s cliff and about 15 minutes’ walk from Kokusai-dori. In reality an elevated highway runs above it (left out here). The water has Okinawa’s famous turquoise hue.' } },
    { at: r(OK.sanshin.x - 1.2, OK.sanshin.y - 2.4, OK.sanshin.x + 1.2, OK.sanshin.y), title: { 'zh-TW': '三線', 'en-US': 'Sanshin' }, text: { 'zh-TW': '沖繩的傳統三弦琴，琴身蒙著蛇皮，從中國的三弦傳來，後來又傳到日本本土變成三味線。國際通的店裡和街頭常常聽得到。', 'en-US': 'Okinawa’s three-stringed lute with a snakeskin body. It came from the Chinese sanxian and later travelled to mainland Japan to become the shamisen. You’ll hear it all along Kokusai-dori.' } },
  ],
  labels: [
    { x: 19.5, y: OK.sea + 0.8, text: { 'zh-TW': '🏖️ 波之上海灘（躺椅坐下專注）', 'en-US': '🏖️ Naminoue Beach (relax on a lounger)' }, color: '#bae6fd' },
    { x: 15.6, y: OK.plazaY1 - 0.2, text: { 'zh-TW': '🌺 國際通廣場（長椅聽三線）', 'en-US': '🌺 Kokusai-dori plaza (bench & sanshin)' }, color: '#fecdd3' },
    { x: (OK.shokudo.x0 + OK.shokudo.x1) / 2, y: SOBA_TABLE_Y + 1.2, text: { 'zh-TW': '🍜 食堂外的桌子（坐下專注）', 'en-US': '🍜 Soba-shop tables (sit & focus)' }, color: '#fde68a' },
  ],
  walkers: [
    { x0: 13, y0: 16.6, x1: 55, y1: 16.6, count: 4 },
    { x0: 1, y0: 21, x1: 55, y1: 21, count: 4 },
    { x0: 1, y0: 29.4, x1: 40, y1: 29.4, count: 3 },
    { x0: 1, y0: 31.4, x1: 39, y1: 31.4, count: 2 },
    { x0: 1, y0: 36.6, x1: 39, y1: 36.6, count: 2 },
    { x0: 42.5, y0: 30, x1: 55, y1: 30, count: 1 },
  ],
  traffic: [
    { y: 17.8, dir: -1, x0: 0, x1: OK.W, count: 2 },
    { y: 19, dir: 1, x0: 0, x1: OK.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點海灘的躺椅、國際通的長椅或沖繩麵食堂的桌子坐下專注 · 走到攤子、食堂買開口笑、紅芋冰淇淋、沖繩麵、苦瓜炒蛋 · 波上宮可以抽籤 · 點地標看介紹 · 縣廳前站搭單軌到那霸機場，飛去日本其他城市或回台灣',
    'en-US': 'WASD / arrows to move · click a beach lounger, a Kokusai-dori bench or a soba-shop table to focus · walk up to the stalls for sata andagi, beni-imo ice cream, Okinawa soba and goya champuru · draw a fortune at Naminoue-gū · click landmarks for info · Kenchōmae Station for Naha Airport flights to Japan or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點躺椅、長椅或桌子坐下專注 · 走到攤子買東西 · 點地標看介紹 · 縣廳前站',
    'en-US': 'Tap a lounger, bench or table to focus · visit the stalls · tap landmarks · Kenchōmae Station',
  },
};
