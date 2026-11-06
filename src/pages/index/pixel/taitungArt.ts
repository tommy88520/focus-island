// 台東的美術：中央山脈和天上的熱氣球（會慢慢飄）、舊台東車站（鐵道藝術村：白色站房、月台雨棚、長滿草的舊鐵軌、藍皮列車）、
// 鐵花村（草地、木頭小舞台和唱歌的人、大樹之間掛滿熱氣球燈籠，晚上會亮）、夜市、新生路、海濱公園（椰子樹、白色鋼構的國際地標、
// 晚上打燈）、沙灘和太平洋（浪會打上來）、台東轉運站的候車亭。最後組成 CityScene 用的 TAITUNG。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { BEACH_BENCHES, BEACH_BENCH_Y, MARKET_CARTS, PLATFORM_BENCHES, PLATFORM_Y, STAGE_BENCHES, STAGE_BENCH_Y, TAITUNG_SEATS, TAITUNG_SHOPS, TD } from './taitung';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, zebra, drawLamp, drawBench, drawStreetTree, drawFoodCart, drawStringLights, drawStoneBench, drawPalm, drawSeaWaves } from './cityArt';

// ── 地面（畫一次）──
export function paintTaitungGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1922);
  const W = TD.W * T;
  const sl = TD.stationLine * T;
  const sky = c.createLinearGradient(0, 0, 0, 4.6 * T);
  sky.addColorStop(0, '#7fb8e6');
  sky.addColorStop(1, '#d4ecf6');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, sl);
  // 中央山脈：又高又陡，三層
  const ridge = (base: number, amp: number, color: string, seed: number) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, sl);
    for (let x = 0; x <= W; x += 6) {
      const y = base - amp * (0.55 + 0.45 * Math.sin(x * 0.014 + seed) * Math.sin(x * 0.033 + seed * 1.7)) - Math.abs(Math.sin(x * 0.06 + seed)) * amp * 0.3;
      c.lineTo(x, y);
    }
    c.lineTo(W, sl);
    c.closePath();
    c.fill();
  };
  ridge(3.2 * T, 34, '#8aa6c4', 2.1);
  ridge(4.2 * T, 26, '#6a9a7a', 5.3);
  ridge(5.2 * T, 16, '#4f8a5a', 8.8);
  // 山腳的樹林（鯉魚山那一帶）
  px(c, '#4c8a50', 0, 5.4 * T, W, sl - 5.4 * T);
  for (let i = 0; i < 70; i += 1) {
    c.fillStyle = ['#3d7a3c', '#4c8a46', '#5a9a52'][i % 3] ?? '#4c8a46';
    c.beginPath();
    c.arc(rand() * W, 5.6 * T + rand() * (sl - 5.8 * T), 6 + rand() * 6, 0, Math.PI * 2);
    c.fill();
  }
  // 月台（水泥＋黃線）、長草的舊鐵軌、南邊的月台
  const r0 = TD.rail.y0 * T;
  const r1 = TD.rail.y1 * T;
  tiles(c, { x0: 0, y0: TD.stationLine, x1: TD.W, y1: TD.rail.y0 }, '#c9c4b8', '#b8b3a6', 10);
  px(c, '#e8d85a', 0, r0 - 3, W, 2);
  px(c, '#7a8a5a', 0, r0, W, r1 - r0);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#6a9a4a' : '#8a7a5a', Math.floor(rand() * W), Math.floor(r0 + rand() * (r1 - r0)), 2, 1);
  for (let x = 2; x < W; x += 7) px(c, '#5a3e2a', x, r0 + 3, 4, r1 - r0 - 6);
  for (const ry of [r0 + 6, r1 - 8]) {
    px(c, '#8a6a52', 0, ry, W, 1);
    px(c, '#5a4a3e', 0, ry + 1, W, 1);
  }
  for (let i = 0; i < 80; i += 1) px(c, '#6aaa4a', Math.floor(rand() * W), Math.floor(r0 + rand() * (r1 - r0)) - 3, 1, 4);
  tiles(c, { x0: 0, y0: TD.rail.y1, x1: TD.W, y1: TD.village.y0 }, '#c9c4b8', '#b8b3a6', 10);
  // 鐵花村：草地＋舞台前的碎石地
  const v = TD.village;
  px(c, '#6fa85a', 0, v.y0 * T, v.x1 * T, (v.y1 - v.y0) * T);
  for (let i = 0; i < 600; i += 1) px(c, rand() < 0.5 ? '#62994e' : '#7cb866', Math.floor(rand() * v.x1 * T), Math.floor(v.y0 * T + rand() * (v.y1 - v.y0) * T), 2, 1);
  c.fillStyle = '#d6cdb4';
  c.beginPath();
  c.ellipse(((TD.stage.x0 + TD.stage.x1) / 2) * T, 17.4 * T, 9 * T, 3 * T, 0, 0, Math.PI * 2);
  c.fill();
  for (let i = 0; i < 260; i += 1) {
    const a = rand() * Math.PI * 2;
    const rr = Math.sqrt(rand());
    px(c, rand() < 0.5 ? '#c4b99e' : '#e2dac4', Math.round(12 * T + Math.cos(a) * rr * 9 * T), Math.round(17.4 * T + Math.sin(a) * rr * 3 * T), 2, 1);
  }
  // 夜市地磚、人行道、新生路
  tiles(c, { x0: TD.market.x0, y0: v.y0, x1: TD.W, y1: v.y1 }, '#b9a99a', '#a89888', 8);
  px(c, '#c9c0ae', 0, v.y1 * T, W, (TD.road.y0 - v.y1) * T);
  road(c, { x0: 0, y0: TD.road.y0, x1: TD.W, y1: TD.road.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.75)', x, ((TD.road.y0 + TD.road.y1) / 2) * T, 10, 2);
  zebra(c, 12, TD.road.y0 + 0.1, 15.6, TD.road.y1 - 0.1, false);
  zebra(c, 39.2, TD.road.y0 + 0.1, 42.8, TD.road.y1 - 0.1, false);
  px(c, '#c9c0ae', 0, TD.road.y1 * T, W, 6);
  // 海濱公園的草地、步道、沙灘、海
  const g0 = TD.road.y1 * T + 6;
  const s0 = TD.sand * T;
  px(c, '#72ad5c', 0, g0, W, s0 - g0);
  for (let i = 0; i < 600; i += 1) px(c, rand() < 0.5 ? '#64a050' : '#80bc68', Math.floor(rand() * W), Math.floor(g0 + rand() * (s0 - g0)), 2, 1);
  px(c, '#d6cdb4', 0, 29 * T, W, T);
  for (let x = 0; x < W; x += 8) px(c, '#c4b99e', x, 29 * T, 1, T);
  const sea0 = TD.sea * T;
  const sand = c.createLinearGradient(0, s0, 0, sea0);
  sand.addColorStop(0, '#ecdcae');
  sand.addColorStop(1, '#d9c48e');
  c.fillStyle = sand;
  c.fillRect(0, s0, W, sea0 - s0);
  for (let i = 0; i < 300; i += 1) px(c, rand() < 0.5 ? '#d2bd88' : '#f4e6c0', Math.floor(rand() * W), Math.floor(s0 + rand() * (sea0 - s0)), 1, 1);
  const sea = c.createLinearGradient(0, sea0, 0, TD.H * T);
  sea.addColorStop(0, '#4aa8c4');
  sea.addColorStop(0.35, '#2a7aa8');
  sea.addColorStop(1, '#1a4f86');
  c.fillStyle = sea;
  c.fillRect(0, sea0, W, TD.H * T - sea0);
  px(c, 'rgba(255,255,255,0.15)', 0, sea0, W, 6);
}

// ── 天上的熱氣球（鹿野高台每年夏天的熱氣球嘉年華） ──
const BALLOONS: { x: number; y: number; colors: [string, string]; speed: number }[] = [
  { x: 6, y: 1.6, colors: ['#e23a2a', '#f6c945'], speed: 0.9 },
  { x: 19, y: 0.9, colors: ['#1f5fa8', '#f2f2f2'], speed: 0.6 },
  { x: 33, y: 2.0, colors: ['#ff8a3a', '#7a3aa8'], speed: 0.75 },
  { x: 47, y: 1.1, colors: ['#2a9a5a', '#f6c945'], speed: 0.5 },
];
function balloon(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, colors: [string, string], lit: boolean): void {
  // 球（上面圓、下面收窄）、直條紋、吊籃
  for (let k = 0; k < 6; k += 1) {
    c.fillStyle = colors[k % 2] ?? '#e23a2a';
    c.beginPath();
    const a0 = Math.PI + (k / 6) * Math.PI;
    const a1 = Math.PI + ((k + 1) / 6) * Math.PI;
    c.moveTo(cx, cy + r * 1.35);
    c.arc(cx, cy, r, a0, a1);
    c.closePath();
    c.fill();
  }
  c.fillStyle = colors[0];
  c.beginPath();
  c.moveTo(cx - r, cy);
  c.quadraticCurveTo(cx - r * 0.8, cy + r * 0.9, cx - r * 0.3, cy + r * 1.3);
  c.lineTo(cx + r * 0.3, cy + r * 1.3);
  c.quadraticCurveTo(cx + r * 0.8, cy + r * 0.9, cx + r, cy);
  c.closePath();
  c.fill();
  for (const k of [-0.5, 0, 0.5]) px(c, colors[1], Math.round(cx + k * r * 1.2 - 1), Math.round(cy), 2, Math.round(r * 0.9));
  px(c, 'rgba(255,255,255,0.3)', Math.round(cx - r * 0.6), Math.round(cy - r * 0.6), Math.max(2, Math.round(r * 0.3)), Math.max(2, Math.round(r * 0.3)));
  px(c, '#5a3e2a', Math.round(cx - r * 0.3), Math.round(cy + r * 1.3), 1, Math.round(r * 0.4));
  px(c, '#5a3e2a', Math.round(cx + r * 0.3), Math.round(cy + r * 1.3), 1, Math.round(r * 0.4));
  px(c, '#8a5a32', Math.round(cx - r * 0.35), Math.round(cy + r * 1.7), Math.max(3, Math.round(r * 0.7)), Math.max(2, Math.round(r * 0.35)));
  if (lit) glow(c, cx, cy + r * 1.2, r * 2.2, '255, 190, 100', 0.5);
}
function drawBalloons(c: CanvasRenderingContext2D, d: DrawCtx): void {
  for (const [i, b] of BALLOONS.entries()) {
    const x = ((b.x * T + d.seconds * b.speed * 3) % (TD.W * T + 60)) - 30;
    const y = b.y * T + Math.sin(d.seconds * 0.25 + i * 1.7) * 8;
    // 晚上噴火的時候會亮一下
    balloon(c, x, y, 10 + (i % 2) * 2, b.colors, d.night && Math.floor(d.seconds * 0.7 + i) % 3 === 0);
  }
}

// ── 舊台東車站（鐵道藝術村）：白色的站房、灰色斜屋頂、站名牌，前面月台的雨棚 ──
function oldStationSprite(): HTMLCanvasElement {
  const w = Math.round((TD.oldStation.x1 - TD.oldStation.x0) * T);
  const h = 70;
  return cached('td-station', w, h, (c) => {
    const cx = w / 2;
    const wallTop = 26;
    px(c, '#f2eee4', 4, wallTop, w - 8, h - wallTop);
    px(c, '#d9d2c2', 4, h - 8, w - 8, 8);
    for (let x = 12; x < w - 16; x += 18) {
      if (Math.abs(x + 6 - cx) < 22) continue;
      px(c, '#6a7080', x - 1, wallTop + 8, 14, 20);
      px(c, '#9cc0d6', x, wallTop + 9, 12, 18);
      px(c, '#6a7080', x + 6, wallTop + 9, 1, 18);
    }
    px(c, '#4a3a2a', cx - 16, h - 30, 32, 30);
    px(c, '#f6dfae', cx - 14, h - 28, 28, 28);
    px(c, '#4a3a2a', cx, h - 28, 1, 28);
    // 屋頂
    c.fillStyle = '#6a707a';
    c.beginPath();
    c.moveTo(-2, wallTop + 2);
    c.lineTo(14, 8);
    c.lineTo(w - 14, 8);
    c.lineTo(w + 2, wallTop + 2);
    c.closePath();
    c.fill();
    for (let y = 10; y < wallTop; y += 3) px(c, '#5a6068', 4, y, w - 8, 1);
    px(c, '#4a4f58', -2, wallTop, w + 4, 3);
    // 站名牌（白底黑字、藍邊）
    px(c, '#1f3a60', cx - 28, wallTop + 4, 56, 13);
    px(c, '#ffffff', cx - 27, wallTop + 5, 54, 11);
    text(c, '舊臺東車站', cx, wallTop + 10.5, '#15171f', `900 8px ${SERIF_TC}`);
  });
}

// 月台雨棚（綠色鐵柱、波浪板），畫在站房前面
function drawCanopy(c: CanvasRenderingContext2D): void {
  const x0 = Math.round((TD.oldStation.x0 - 3) * T);
  const x1 = Math.round((TD.oldStation.x1 + 3) * T);
  const by = Math.round((TD.rail.y0 - 0.3) * T);
  // 柱子避開月台長椅
  for (const xt of [27.3, 30.8, 36, 41.2, 44.7]) {
    const x = Math.round(xt * T);
    px(c, 'rgba(0,0,0,0.2)', x - 1, by, 5, 2);
    px(c, '#3f6a4a', x, by - 30, 3, 30);
  }
  px(c, '#3f6a4a', x0 + 4, by - 32, x1 - x0 - 8, 3);
  px(c, '#8a9aa0', x0, by - 40, x1 - x0, 8);
  for (let x = x0; x < x1; x += 4) px(c, '#a8b4b8', x, by - 40, 2, 8);
  px(c, '#5a6a70', x0, by - 33, x1 - x0, 1);
  // 吊牌：往月台
  px(c, '#1f3a60', x0 + 30, by - 30, 30, 8);
  text(c, '1 月台', x0 + 45, by - 26, '#ffffff', `900 5px ${FONT_TC}`);
}

// 停在舊鐵軌上的藍皮列車（藍色客車、黃色窗帶）＋橘色的柴電機車頭
function drawParkedTrain(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const by = Math.round(TD.rail.y1 * T - 4);
  const x0 = Math.round(TD.parked.x0 * T);
  const x1 = Math.round(TD.parked.x1 * T);
  const locoW = 64;
  const carW = Math.floor((x1 - x0 - locoW - 6) / 3);
  for (let k = 0; k < 3; k += 1) {
    const cx0 = x0 + k * (carW + 2);
    px(c, 'rgba(0,0,0,0.25)', cx0, by + 1, carW, 3);
    px(c, '#15171f', cx0 + 2, by - 4, carW - 4, 3);
    for (const wx of [cx0 + 6, cx0 + 14, cx0 + carW - 20, cx0 + carW - 12]) px(c, '#2b2d33', wx, by - 2, 5, 3);
    px(c, '#1f4a8a', cx0, by - 24, carW, 20);
    px(c, '#2a5aa0', cx0, by - 24, carW, 2);
    px(c, '#3a3e46', cx0 - 1, by - 26, carW + 2, 3);
    px(c, '#e8c84a', cx0, by - 12, carW, 2);
    for (let wx = cx0 + 4; wx + 7 <= cx0 + carW - 3; wx += 10) px(c, d.night ? '#ffe9a8' : '#c9dbe6', wx, by - 21, 7, 7);
    px(c, '#f2f2f2', cx0 + carW / 2 - 12, by - 9, 24, 4);
  }
  text(c, '藍皮解憂號', x0 + carW * 1.5 + 2, by - 7, '#1f4a8a', `900 4px ${FONT_TC}`);
  const lx = x1 - locoW;
  px(c, 'rgba(0,0,0,0.25)', lx, by + 1, locoW, 3);
  px(c, '#15171f', lx + 2, by - 4, locoW - 4, 3);
  for (const wx of [lx + 6, lx + 14, lx + locoW - 20, lx + locoW - 12]) px(c, '#2b2d33', wx, by - 2, 5, 3);
  px(c, '#e8742a', lx, by - 18, locoW, 14);
  px(c, '#e8742a', lx + locoW - 22, by - 28, 20, 10);
  px(c, '#f2f2f2', lx, by - 10, locoW, 2);
  px(c, '#2f3a42', lx + locoW - 18, by - 26, 6, 5);
  px(c, '#2f3a42', lx + locoW - 10, by - 26, 6, 5);
  for (let k = 0; k < 5; k += 1) px(c, '#c95a1a', lx + 4 + k * 7, by - 16, 4, 5);
  px(c, d.night ? '#fff6c8' : '#f2e2b8', x1 - 2, by - 14, 2, 3);
}

// ── 鐵花村：木頭小舞台（鐵皮屋頂、木牌）、唱歌的人、音符；大樹之間掛的熱氣球燈籠 ──
function drawStage(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(TD.stage.x0 * T);
  const x1 = Math.round(TD.stage.x1 * T);
  const by = Math.round(TD.stage.line * T);
  const w = x1 - x0;
  // 後牆（漂流木拼的）、屋頂
  px(c, '#8a6a4a', x0 + 4, by - 50, w - 8, 40);
  for (let x = x0 + 4; x < x1 - 4; x += 6) px(c, x % 12 ? '#7a5a3a' : '#9a7a5a', x, by - 50, 5, 40);
  px(c, '#b5b8be', x0 - 4, by - 58, w + 8, 8);
  for (let x = x0 - 4; x < x1 + 4; x += 4) px(c, '#9aa0a8', x, by - 58, 2, 8);
  for (const x of [x0 + 2, x1 - 6]) px(c, '#5a3e2a', x, by - 50, 4, 50);
  // 舞台（木板）
  px(c, '#a8784a', x0, by - 12, w, 12);
  for (let x = x0; x < x1; x += 8) px(c, '#946640', x, by - 12, 1, 12);
  px(c, '#c99a62', x0, by - 12, w, 2);
  // 招牌
  px(c, '#f4efe2', x0 + w / 2 - 22, by - 48, 44, 12);
  text(c, '鐵花村', x0 + w / 2, by - 42, '#3a2414', `900 8px ${SERIF_TC}`);
  // 歌手＋麥克風架、旁邊的音箱
  const singer = getAvatarFrame(lookColors(3, 2, { body: 1 }), 'down', 'idle');
  c.drawImage(singer, Math.round(x0 + w / 2 - singer.width / 2), by - 12 - singer.height + 4);
  px(c, '#2b2d33', x0 + w / 2 + 8, by - 30, 1, 18);
  px(c, '#15171f', x0 + w / 2 + 7, by - 31, 3, 2);
  for (const x of [x0 + 12, x1 - 22]) {
    px(c, '#2b2d33', x, by - 26, 10, 14);
    c.fillStyle = '#4a4f58';
    c.beginPath();
    c.arc(x + 5, by - 18, 3, 0, Math.PI * 2);
    c.fill();
  }
  // 音符往上飄
  for (let k = 0; k < 3; k += 1) {
    const t = (d.seconds * 0.4 + k / 3) % 1;
    const nx = x0 + w / 2 + Math.sin(t * 6 + k) * 10 + (k - 1) * 14;
    const ny = by - 30 - t * 26;
    c.globalAlpha = 1 - t;
    text(c, k % 2 ? '♪' : '♫', nx, ny, '#3a2414', `900 8px ${FONT_TC}`);
    c.globalAlpha = 1;
  }
  if (d.night) {
    c.fillStyle = 'rgba(255, 240, 180, 0.18)';
    c.beginPath();
    c.moveTo(x0 + w / 2 - 6, by - 50);
    c.lineTo(x0 + w / 2 - 22, by);
    c.lineTo(x0 + w / 2 + 22, by);
    c.lineTo(x0 + w / 2 + 6, by - 50);
    c.closePath();
    c.fill();
  }
}

// 大樹（茄苳）：鐵花村的燈籠就掛在這些樹上
function drawBigTree(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 16, by - 2, 32, 4);
  px(c, '#5c3d22', cx - 3, by - 26, 6, 26);
  px(c, '#5c3d22', cx - 10, by - 30, 8, 3);
  px(c, '#5c3d22', cx + 3, by - 32, 8, 3);
  for (const [dx, dy, r, col] of [[-12, -36, 12, '#3d7a3c'], [12, -36, 12, '#3d7a3c'], [0, -46, 14, '#4c8a46'], [-4, -32, 10, '#5a9a52'], [8, -44, 9, '#5a9a52']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
}

// 熱氣球燈籠：從 (ax, ay) 拉一條線到 (bx, by)（格、樹冠的高度，px 往上），線上掛著一顆顆小熱氣球
const LANTERN_COLORS: [string, string][] = [['#e23a2a', '#f6c945'], ['#1f5fa8', '#f2f2f2'], ['#ff8a3a', '#7a3aa8'], ['#2a9a5a', '#f6c945'], ['#f2f2f2', '#e23a2a']];
function drawLanternLine(c: CanvasRenderingContext2D, ax: number, ay: number, bx: number, by: number, d: DrawCtx, seed: number): void {
  const x0 = ax * T;
  const y0 = ay * T;
  const x1 = bx * T;
  const y1 = by * T;
  const sag = 10;
  const pt = (t: number) => ({ x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag });
  c.strokeStyle = '#3a3d45';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(x0, y0);
  for (let t = 0.05; t <= 1.001; t += 0.05) {
    const p = pt(t);
    c.lineTo(p.x, p.y);
  }
  c.stroke();
  const n = Math.max(3, Math.round(Math.hypot(x1 - x0, y1 - y0) / 26));
  for (let k = 1; k < n; k += 1) {
    const p = pt(k / n);
    const sway = Math.sin(d.seconds * 1.2 + k + seed) * 1;
    const colors = LANTERN_COLORS[(k + seed) % LANTERN_COLORS.length] ?? ['#e23a2a', '#f6c945'];
    px(c, '#3a3d45', Math.round(p.x), Math.round(p.y), 1, 3);
    balloon(c, p.x + sway, p.y + 8, 4, colors, false);
    if (d.night) glow(c, p.x + sway, p.y + 9, 12, '255, 200, 120', 0.55);
  }
}

// ── 國際地標：海濱公園白色的鋼構大拱（一圈圈的框架），晚上打燈換顏色 ──
function drawLandmark(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(TD.landmark.cx * T);
  const by = Math.round(TD.landmark.line * T);
  const rx = 4.2 * T;
  const ry = 70;
  const hue = d.night ? ['#9ad6ff', '#c9a8ff', '#ffb0d6', '#a8ffd6'][Math.floor(d.seconds / 3) % 4] ?? '#ffffff' : '#f2f4f6';
  px(c, 'rgba(0,0,0,0.18)', cx - rx - 4, by - 1, rx * 2 + 8, 4);
  c.lineWidth = 3;
  for (const k of [1, 0.78]) {
    c.strokeStyle = k === 1 ? hue : 'rgba(220,226,232,0.9)';
    c.beginPath();
    c.ellipse(cx, by, rx * k, ry * k, 0, Math.PI, 0);
    c.stroke();
  }
  // 兩圈之間的斜撐
  c.lineWidth = 2;
  c.strokeStyle = d.night ? hue : '#d6dce2';
  for (let k = 0; k <= 14; k += 1) {
    const a = Math.PI + (k / 14) * Math.PI;
    const b = Math.PI + ((k + 0.5) / 14) * Math.PI;
    c.beginPath();
    c.moveTo(cx + Math.cos(a) * rx, by + Math.sin(a) * ry);
    c.lineTo(cx + Math.cos(b) * rx * 0.78, by + Math.sin(b) * ry * 0.78);
    c.stroke();
  }
  for (const x of [cx - rx, cx + rx * 0.78 - 4, cx - rx * 0.78, cx + rx - 4]) px(c, '#9a9488', Math.round(x - 2), by - 3, 8, 4);
  if (d.night) glow(c, cx, by - 40, 70, '170, 200, 255', 0.35);
}

// 台東轉運站：候車亭（藍色屋頂、站牌）
function drawBusStop(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(TD.busStop.x * T);
  const by = Math.round(TD.busStop.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 36, by, 72, 3);
  for (const x of [cx - 32, cx + 28]) px(c, '#6a7080', x, by - 34, 4, 34);
  px(c, 'rgba(180,220,240,0.45)', cx - 28, by - 30, 56, 22);
  px(c, '#1f5fa8', cx - 38, by - 40, 76, 7);
  px(c, '#3f86d0', cx - 38, by - 40, 76, 1);
  px(c, '#ffffff', cx - 30, by - 50, 60, 10);
  px(c, '#1f5fa8', cx - 30, by - 50, 60, 1);
  text(c, '台東轉運站', cx, by - 45, '#1f3a60', `900 7px ${FONT_TC}`);
  px(c, '#8a5a32', cx - 22, by - 10, 44, 3);
  px(c, '#3a3d45', cx - 20, by - 7, 2, 7);
  px(c, '#3a3d45', cx + 18, by - 7, 2, 7);
  if (d.night) glow(c, cx, by - 30, 40, '200, 230, 255', 0.4);
}

// ── 組成 CityScene 用的資料 ──
const BIG_TREES: [number, number][] = [[2.6, 13.4], [24.4, 13.4], [2.6, 21.8], [24.4, 21.8]];
const LANTERN_LINES: [number, number, number, number][] = [
  [2.6, 10.8, 24.4, 10.8],
  [2.6, 10.8, 24.4, 19.2],
  [24.4, 10.8, 2.6, 19.2],
];
const PALMS: [number, number][] = [[2, 28.6], [9.6, 28.4], [17, 28.6], [34, 28.4], [48.4, 28.6], [54.4, 28.4], [52, 30.6]];
const TREES: [number, number][] = [[28.4, 21.8], [54.8, 21.8]];
const LAMPS: [number, number][] = [[27, 9.4], [44, 9.4], [8, 22.2], [20, 22.2], [36.2, 22.2], [46.4, 22.2], [21, 28.2], [27.6, 28.2], [44.6, 28.2]];

const props: CityProp[] = [
  { y: 0.1, draw: (c, d) => drawBalloons(c, d) },
  { y: TD.stationLine, draw: (c) => blit(c, oldStationSprite(), TD.oldStation.x0 * T, TD.stationLine * T) },
  ...PLATFORM_BENCHES.map((x): CityProp => ({ y: PLATFORM_Y - 0.01, draw: (c) => drawBench(c, x, PLATFORM_Y, 2.6) })),
  { y: TD.rail.y0 - 0.3, draw: (c) => drawCanopy(c) },
  { y: TD.rail.y1 - 0.01, draw: (c, d) => drawParkedTrain(c, d) },
  { y: TD.stage.line, draw: (c, d) => drawStage(c, d) },
  ...BIG_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawBigTree(c, x, y) })),
  ...LANTERN_LINES.map(([ax, ay, bx, by], i): CityProp => ({ y: Math.max(ay, by) + 2.7, draw: (c, d) => drawLanternLine(c, ax, ay, bx, by, d, i * 3) })),
  ...STAGE_BENCHES.map((x): CityProp => ({ y: STAGE_BENCH_Y - 0.01, draw: (c) => drawStoneBench(c, x, STAGE_BENCH_Y) })),
  ...MARKET_CARTS.map((s, i): CityProp => ({ y: TD.cartY, draw: (c, d) => drawFoodCart(c, s.x, TD.cartY, s.name, s.awning, s.food, d.seconds + i * 0.37, 31 + i * 7) })),
  { y: TD.cartY + 0.02, draw: (c, d) => drawStringLights(c, TD.market.x0 + 0.2, TD.W - 0.2, TD.cartY - 2.9, d.night, 7) },
  { y: TD.busStop.y, draw: (c, d) => drawBusStop(c, d) },
  { y: TD.landmark.line, draw: (c, d) => drawLandmark(c, d) },
  ...BEACH_BENCHES.map((x): CityProp => ({ y: BEACH_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, BEACH_BENCH_Y, 2.6) })),
  { y: TD.sea, draw: (c, d) => drawSeaWaves(c, 0, TD.W, TD.sea, TD.H, d.seconds) },
  ...PALMS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawPalm(c, x, y, d.seconds, 40) })),
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, TD.W, TD.stationLine - 0.2),
  r(TD.oldStation.x0, TD.stationLine - 0.4, TD.oldStation.x1, TD.stationLine + 0.1),
  r(TD.parked.x0, TD.rail.y0 + 0.1, TD.parked.x1, TD.rail.y1 - 0.1),
  ...PLATFORM_BENCHES.map((x) => r(x - 1.3, PLATFORM_Y - 0.75, x + 1.3, PLATFORM_Y - 0.45)),
  r(TD.stage.x0, TD.stage.line - 1.6, TD.stage.x1, TD.stage.line - 0.05),
  ...BIG_TREES.map(([x, y]) => r(x - 0.4, y - 0.4, x + 0.4, y + 0.05)),
  ...STAGE_BENCHES.map((x) => r(x - 1.3, STAGE_BENCH_Y - 0.35, x + 1.3, STAGE_BENCH_Y - 0.1)),
  ...MARKET_CARTS.map((s) => r(s.x - 1.25, TD.cartY - 0.8, s.x + 1.25, TD.cartY - 0.05)),
  r(TD.busStop.x - 2.3, TD.busStop.y - 0.8, TD.busStop.x + 2.3, TD.busStop.y - 0.05),
  ...[-4.2, -3.3, 3.1, 4].map((dx) => r(TD.landmark.cx + dx - 0.3, TD.landmark.line - 0.3, TD.landmark.cx + dx + 0.3, TD.landmark.line + 0.05)),
  ...BEACH_BENCHES.map((x) => r(x - 1.3, BEACH_BENCH_Y - 0.75, x + 1.3, BEACH_BENCH_Y - 0.45)),
  r(0, TD.sea + 0.2, TD.W, TD.H),
  ...PALMS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...MARKET_CARTS.map((s) => ({ x: s.x * T, y: TD.cartY * T - 14, r: 40, color: 'rgba(255, 215, 140, 0.55)' })),
  { x: ((TD.stage.x0 + TD.stage.x1) / 2) * T, y: TD.stage.line * T - 20, r: 70, color: 'rgba(255, 220, 150, 0.5)' },
  { x: 13.5 * T, y: 15 * T, r: 120, color: 'rgba(255, 190, 110, 0.35)' },
  { x: ((TD.oldStation.x0 + TD.oldStation.x1) / 2) * T, y: TD.stationLine * T - 14, r: 60, color: 'rgba(255, 220, 150, 0.45)' },
  { x: 13 * T, y: TD.rail.y1 * T - 14, r: 70, color: 'rgba(255, 220, 150, 0.3)' },
  { x: TD.landmark.cx * T, y: TD.landmark.line * T - 40, r: 80, color: 'rgba(170, 200, 255, 0.4)' },
  { x: TD.busStop.x * T, y: TD.busStop.y * T - 30, r: 40, color: 'rgba(200, 230, 255, 0.4)' },
];

export const TAITUNG: CityDef = {
  id: 'taitung',
  W: TD.W,
  H: TD.H,
  title: { 'zh-TW': '台東 · 鐵花村與海濱公園', 'en-US': 'Taitung · Tiehua Village & Seaside Park' },
  stop: { 'zh-TW': '台東', 'en-US': 'Taitung' },
  emoji: '🎈',
  line: 'tra',
  station: {
    x: TD.busStop.x,
    y: TD.busStop.y + 0.7,
    name: { 'zh-TW': '台東轉運站（往台鐵台東站）', 'en-US': 'Taitung Bus Station (to TRA Taitung)' },
    arrive: { x: TD.busStop.x + 3.4, y: TD.busStop.y + 0.8 },
  },
  background: '#d9d0bf',
  soundscape: 'beach',
  paintGround: paintTaitungGround,
  props,
  solid,
  seats: TAITUNG_SEATS,
  drawSeat: () => {},
  shops: TAITUNG_SHOPS,
  infos: [
    { at: r(0, 0, TD.W, 4.4), title: { 'zh-TW': '熱氣球', 'en-US': 'Hot-air Balloons' }, text: { 'zh-TW': '每年夏天鹿野高台會辦熱氣球嘉年華，一大早幾十顆熱氣球一起升空。後面那排是中央山脈。', 'en-US': 'Every summer Luye Highland holds a hot-air balloon festival — dozens of balloons lift off at dawn. Behind them is the Central Mountain Range.' } },
    { at: r(TD.oldStation.x0, 3, TD.oldStation.x1, TD.stationLine), title: { 'zh-TW': '舊台東車站（鐵道藝術村）', 'en-US': 'Old Taitung Station (Railway Art Village)' }, text: { 'zh-TW': '台東市區的老車站，新台東站啟用後停用，站房、月台和舊鐵軌改成鐵道藝術村，可以散步、看展。', 'en-US': 'The old downtown station. After the new Taitung Station opened it closed, and the building, platforms and tracks became a railway art village.' } },
    { at: r(TD.parked.x0, TD.rail.y0 - 1.5, TD.parked.x1, TD.rail.y1), title: { 'zh-TW': '藍皮列車', 'en-US': 'Blue Train' }, text: { 'zh-TW': '沒有冷氣、可以開窗吹風的老普通車，南迴線最後跑到 2020 年才退休，後來改成觀光列車「藍皮解憂號」。', 'en-US': 'Old blue ordinary trains with no air-con and windows you can open. They ran on the South-Link Line until 2020, then returned as the “Blue Train” tourist service.' } },
    { at: r(0, TD.village.y0, TD.village.x1, TD.village.y1), title: { 'zh-TW': '鐵花村', 'en-US': 'Tiehua Music Village' }, text: { 'zh-TW': '舊台東車站旁的音樂聚落，晚上常有原住民歌手現場演唱；樹上掛滿的熱氣球燈籠一到晚上就全部亮起來。', 'en-US': 'A music village beside the old station, with live sets by Indigenous singers most evenings. The hot-air-balloon lanterns in the trees all light up after dark.' } },
    { at: r(TD.market.x0, TD.village.y0, TD.W, TD.village.y1), title: { 'zh-TW': '台東小吃', 'en-US': 'Taitung Street Food' }, text: { 'zh-TW': '榕樹下米苔目、卑南豬血湯是台東人的老味道；台東是釋迦的故鄉，往北一點的池上米做的便當也很有名。', 'en-US': 'Rice noodles under the banyan and Beinan pig blood soup are old local favourites. Taitung is home of the sugar apple, and bento made with Chishang rice from up north is famous too.' } },
    { at: r(TD.landmark.cx - 4.4, TD.landmark.line - 4.6, TD.landmark.cx + 4.4, TD.landmark.line), title: { 'zh-TW': '國際地標', 'en-US': 'International Landmark' }, text: { 'zh-TW': '海濱公園裡的白色鋼構地標，面對太平洋，晚上會打上會變色的燈。', 'en-US': 'A white steel-frame landmark in Seaside Park facing the Pacific, lit in changing colours at night.' } },
    { at: r(0, TD.sea, TD.W, TD.H), title: { 'zh-TW': '太平洋', 'en-US': 'Pacific Ocean' }, text: { 'zh-TW': '台東市區出門就是太平洋。天氣好的時候往東南看得到綠島，台灣最早看到日出的地方之一也在台東。', 'en-US': 'The Pacific is right on Taitung’s doorstep. On clear days Green Island shows to the south-east, and Taitung is one of the first places in Taiwan to see the sunrise.' } },
  ],
  labels: [
    { x: 36, y: TD.stationLine - 4.8, text: { 'zh-TW': '🚃 舊台東車站（月台長椅坐下專注）', 'en-US': '🚃 Old Taitung Station (sit on a platform bench)' }, color: '#fbbf24' },
    { x: 12, y: TD.village.y0 + 0.2, text: { 'zh-TW': '🎈 鐵花村', 'en-US': '🎈 Tiehua Village' }, color: '#f472b6' },
    { x: TD.landmark.cx, y: TD.landmark.line - 5, text: { 'zh-TW': '🌊 海濱公園', 'en-US': '🌊 Seaside Park' }, color: '#7dd3fc' },
  ],
  walkers: [
    { x0: 1, y0: 8.6, x1: 29, y1: 8.6, count: 2 },
    { x0: 1, y0: 10.8, x1: 55, y1: 10.8, count: 3 },
    { x0: 3, y0: 16.8, x1: 22, y1: 16.8, count: 3 },
    { x0: 28, y0: 17.6, x1: 55, y1: 17.6, count: 4 },
    { x0: 28, y0: 21, x1: 55, y1: 21, count: 2 },
    { x0: 1, y0: 29.5, x1: 55, y1: 29.5, count: 4 },
    { x0: 2, y0: 32.2, x1: 54, y1: 32.2, count: 3 },
  ],
  traffic: [
    { y: 23.2, dir: 1, x0: 0, x1: TD.W, count: 2 },
    { y: 24.4, dir: -1, x0: 0, x1: TD.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點舊台東車站月台、鐵花村舞台前或海邊的長椅坐下專注 · 走到攤車買米苔目、豬血湯、釋迦 · 點地標看介紹 · 台東轉運站回台北（台鐵）',
    'en-US': 'WASD / arrows to move · click a bench on the old station platform, in front of the Tiehua stage or by the sea to focus · walk up to the carts for rice noodles, pig blood soup and sugar apples · click landmarks for info · Taitung Bus Station back to Taipei (TRA)',
  },
  hintTouch: {
    'zh-TW': '點月台、舞台前或海邊的長椅坐下專注 · 走到攤車買東西 · 點地標看介紹 · 轉運站回台北',
    'en-US': 'Tap a platform, stage or seaside bench to focus · walk up to the carts · tap landmarks · bus station back to Taipei',
  },
};
