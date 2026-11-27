// 紐約的美術：曼哈頓天際線（帝國大廈、克萊斯勒大廈，晚上頂端打燈）、中央公園（湖、弓橋、長椅、馬車、遛狗的人、划船）、
// 時代廣場（四面大樓的電子看板會換畫面、跑馬燈、紅色玻璃階梯、椒鹽卷餅推車、披薩店、貝果熟食店、地鐵站入口）、
// 黃色計程車、褐石公寓、水邊（自由女神、布魯克林大橋、渡輪）。看板全部是自己編的通用內容，沒有品牌。最後組成 CityScene 用的 NEWYORK。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { HARBOR_BENCHES, HARBOR_BENCH_Y, NEWYORK_SEATS, NEWYORK_SHOPS, NY, POND_BENCHES, POND_BENCH_Y } from './newyork';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, drawBench } from './cityArt';
import { AVATAR_SIZE, getAvatarFrame, lookColors } from './pixelArt';

const W = NY.W * T;
const H = NY.H * T;

// ── 地面（畫一次）──
function roundRectPath(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  c.beginPath();
  c.roundRect(x, y, w, h, r);
}

function paintPond(c: CanvasRenderingContext2D, rand: () => number): void {
  const p = NY.pool;
  const ch = NY.channel;
  // 岸邊的石頭（外圈）
  c.fillStyle = '#8d8878';
  roundRectPath(c, p.x0 * T - 3, p.y0 * T - 3, (p.x1 - p.x0) * T + 6, (p.y1 - p.y0) * T + 6, 22);
  c.fill();
  roundRectPath(c, ch.x0 * T - 3, ch.y0 * T - 3, (ch.x1 - ch.x0) * T + 6, (p.y0 - ch.y0) * T + 8, 14);
  c.fill();
  for (let i = 0; i < 70; i += 1) {
    const onPool = rand() < 0.75;
    const x = onPool ? p.x0 * T + rand() * (p.x1 - p.x0) * T : ch.x0 * T - 3 + (rand() < 0.5 ? 0 : (ch.x1 - ch.x0) * T + 3);
    const y = onPool ? (rand() < 0.5 ? p.y0 * T - 3 : p.y1 * T + 1) : ch.y0 * T + rand() * (p.y0 - ch.y0) * T;
    px(c, rand() < 0.5 ? '#a19b8a' : '#76715f', Math.round(x), Math.round(y), 3, 2);
  }
  const water = c.createLinearGradient(0, ch.y0 * T, 0, p.y1 * T);
  water.addColorStop(0, '#3f7a86');
  water.addColorStop(1, '#4f909c');
  c.fillStyle = water;
  roundRectPath(c, p.x0 * T, p.y0 * T, (p.x1 - p.x0) * T, (p.y1 - p.y0) * T, 20);
  c.fill();
  roundRectPath(c, ch.x0 * T, ch.y0 * T, (ch.x1 - ch.x0) * T, (p.y0 - ch.y0) * T + 6, 12);
  c.fill();
  // 水面反光、睡蓮葉
  for (let i = 0; i < 60; i += 1) px(c, 'rgba(230,250,255,0.28)', Math.round(p.x0 * T + 10 + rand() * ((p.x1 - p.x0) * T - 20)), Math.round(p.y0 * T + 4 + rand() * ((p.y1 - p.y0) * T - 8)), 5 + Math.floor(rand() * 6), 1);
  for (let i = 0; i < 14; i += 1) {
    const x = p.x0 * T + 14 + rand() * 120;
    const y = p.y0 * T + 6 + rand() * 24;
    px(c, '#4f8a44', Math.round(x), Math.round(y), 4, 2);
  }
  // 弓橋在水裡的倒影
  px(c, 'rgba(240,235,220,0.25)', ch.x0 * T + 6, 10.25 * T, (ch.x1 - ch.x0) * T - 12, 1);
}

export function paintNewYorkGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1625);
  const sky = c.createLinearGradient(0, 0, 0, NY.skyline * T + 8);
  sky.addColorStop(0, '#7fb6e6');
  sky.addColorStop(1, '#dcedf8');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, NY.skyline * T + 8);
  // 中央公園：草地（北邊樹林底下暗一點）
  px(c, '#5c9446', 0, NY.skyline * T, W, (NY.wall - NY.skyline) * T + 4);
  px(c, '#4b7f3b', 0, NY.skyline * T, W, (7.7 - NY.skyline) * T);
  for (let i = 0; i < 1100; i += 1) px(c, rand() < 0.5 ? '#538a40' : '#69a453', Math.floor(rand() * W), Math.floor(NY.skyline * T + rand() * (NY.wall - NY.skyline) * T), 2, 1);
  // 公園步道
  const path = (x0: number, y0: number, x1: number, y1: number) => {
    px(c, '#d6c69c', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let i = 0; i < (x1 - x0) * (y1 - y0) * 4; i += 1) px(c, '#c8b88e', Math.floor(x0 * T + rand() * (x1 - x0) * T), Math.floor(y0 * T + rand() * (y1 - y0) * T), 1, 1);
  };
  path(0, 8.4, NY.channel.x0, 9.6);
  path(NY.channel.x1, 8.4, NY.W, 9.6);
  path(4, 9.6, 5.8, NY.drive.y0);
  path(50.2, 9.6, 52, NY.drive.y0);
  // 花圃
  for (const [x, y] of [[7.5, 12.4], [48.5, 12.4]] as const) {
    c.fillStyle = '#3f7a36';
    c.beginPath();
    c.ellipse(x * T, y * T, 18, 7, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 16; k += 1) px(c, ['#f2c94c', '#e2557a', '#ffffff', '#b56be0'][k % 4] ?? '#fff', Math.round(x * T - 14 + rand() * 28), Math.round(y * T - 4 + rand() * 8), 2, 2);
  }
  paintPond(c, rand);
  // 公園道路（馬車、慢跑）
  px(c, '#7b7d84', 0, NY.drive.y0 * T, W, (NY.drive.y1 - NY.drive.y0) * T);
  px(c, '#a5a39b', 0, NY.drive.y0 * T, W, 1);
  for (let x = 0; x < W; x += 20) px(c, '#e8e2c8', x, Math.round(((NY.drive.y0 + NY.drive.y1) / 2) * T), 10, 1);
  // 公園南邊的矮石牆（兩個入口）
  const wallSegs: [number, number][] = [
    [0, NY.gaps[0]?.[0] ?? 9],
    [NY.gaps[0]?.[1] ?? 12, NY.gaps[1]?.[0] ?? 44],
    [NY.gaps[1]?.[1] ?? 47, NY.W],
  ];
  px(c, '#cfc9bd', 0, NY.drive.y1 * T, W, (NY.road1.y0 - NY.drive.y1) * T);
  for (const [a, b] of wallSegs) {
    px(c, '#8f877a', a * T, NY.wall * T - 4, (b - a) * T, 6);
    px(c, '#b3ab9c', a * T, NY.wall * T - 4, (b - a) * T, 2);
    for (let x = a * T; x < b * T; x += 9) px(c, '#7a7366', x, NY.wall * T - 2, 1, 4);
  }
  // 中央公園南街
  road(c, { x0: 0, y0: NY.road1.y0, x1: NY.W, y1: NY.road1.y1 }, rand);
  const mid1 = Math.round(((NY.road1.y0 + NY.road1.y1) / 2) * T);
  px(c, '#e8c440', 0, mid1 - 1, W, 1);
  px(c, '#e8c440', 0, mid1 + 1, W, 1);
  // 人行道（水泥板）
  const sidewalk = (x0: number, y0: number, x1: number, y1: number) => tiles(c, { x0, y0, x1, y1 }, '#c9c6bf', '#b5b2aa', 16);
  sidewalk(0, NY.road1.y1, NY.W, NY.road1.y1 + 0.8);
  for (const [a, b] of NY.gaps) {
    zebra(c, a, NY.road1.y0, b, NY.road1.y1, false);
    sidewalk(a, NY.road1.y1, b, NY.north);
  }
  // 時代廣場的徒步區：深淺灰的地磚、一個個金屬圓片
  tiles(c, { x0: NY.flank.w, y0: NY.north, x1: NY.W - NY.flank.w, y1: NY.flank.line }, '#b7b4ae', '#a7a39c', 16);
  for (let i = 0; i < 70; i += 1) {
    const x = NY.flank.w * T + rand() * (NY.W - NY.flank.w * 2) * T;
    const y = NY.north * T + rand() * (NY.flank.line - NY.north) * T;
    px(c, '#d8d6d0', Math.round(x), Math.round(y), 2, 2);
    px(c, '#8f8b84', Math.round(x) + 1, Math.round(y) + 1, 1, 1);
  }
  // 紅色玻璃階梯（越往南越高）：一階一階的踏面、兩邊的玻璃欄杆
  const s = NY.steps;
  px(c, 'rgba(0,0,0,0.25)', s.x0 * T - 2, s.y0 * T - 2, (s.x1 - s.x0) * T + 4, (s.y1 - s.y0) * T + 4);
  for (let y = s.y0 * T, k = 0; y < s.y1 * T; y += 7, k += 1) {
    px(c, k % 2 ? '#d8302c' : '#e0403a', s.x0 * T, Math.round(y), (s.x1 - s.x0) * T, 7);
    px(c, '#ff7a6e', s.x0 * T, Math.round(y), (s.x1 - s.x0) * T, 1);
    px(c, '#9a1a18', s.x0 * T, Math.round(y) + 6, (s.x1 - s.x0) * T, 1);
  }
  px(c, 'rgba(220,240,255,0.7)', s.x0 * T - 2, s.y0 * T, 2, (s.y1 - s.y0) * T);
  px(c, 'rgba(220,240,255,0.7)', s.x1 * T, s.y0 * T, 2, (s.y1 - s.y0) * T);
  // 南邊的人行道、42 街
  sidewalk(0, NY.flank.line, NY.W, NY.road2.y0);
  road(c, { x0: 0, y0: NY.road2.y0, x1: NY.W, y1: NY.road2.y1 }, rand);
  const mid2 = Math.round(((NY.road2.y0 + NY.road2.y1) / 2) * T);
  px(c, '#e8c440', 0, mid2 - 1, W, 1);
  px(c, '#e8c440', 0, mid2 + 1, W, 1);
  zebra(c, 9, NY.road2.y0, 12, NY.road2.y1, false);
  zebra(c, 25, NY.road2.y0, 31, NY.road2.y1, false);
  zebra(c, 44, NY.road2.y0, 47, NY.road2.y1, false);
  // 褐石公寓那塊、前面的步道；水邊的公園（六角磚）
  px(c, '#5a4a40', 0, NY.road2.y1 * T, NY.brown.x1 * T, (NY.brown.line - NY.road2.y1) * T);
  sidewalk(NY.brown.x1, NY.road2.y1, NY.W, NY.road2.y1 + 0.8);
  tiles(c, { x0: 0, y0: NY.brown.line, x1: NY.brown.x1, y1: NY.rail }, '#bdb7ab', '#aaa498', 8);
  tiles(c, { x0: NY.brown.x1, y0: NY.road2.y1 + 0.8, x1: NY.W, y1: NY.rail }, '#a9a59c', '#97938a', 10);
  for (const [x0, x1] of [[21.6, 25.5], [35.8, 37.8], [46, 56]] as const) {
    px(c, '#6a9f4e', x0 * T, 36.9 * T, (x1 - x0) * T, 1.2 * T);
    px(c, '#4f8a3c', x0 * T, 36.9 * T, (x1 - x0) * T, 2);
  }
  px(c, '#6a9f4e', 46 * T, 40.2 * T, 10 * T, 1.2 * T);
  for (let i = 0; i < 24; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#3f7a36' : '#4f8a44';
    c.beginPath();
    c.arc(46 * T + 6 + rand() * 10 * T, 40.8 * T, 4 + rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  // 水
  const water = c.createLinearGradient(0, NY.sea * T, 0, H);
  water.addColorStop(0, '#46799c');
  water.addColorStop(1, '#2f5d80');
  c.fillStyle = water;
  c.fillRect(0, NY.sea * T, W, H - NY.sea * T);
  for (let i = 0; i < 110; i += 1) px(c, 'rgba(255,255,255,0.22)', Math.floor(rand() * W), Math.floor(NY.sea * T + 4 + rand() * (H - NY.sea * T)), 5 + Math.floor(rand() * 9), 1);
  // 水邊的欄杆
  px(c, '#4a4d55', 0, NY.rail * T - 1, W, 4);
  px(c, '#2f3238', 0, NY.rail * T - 8, W, 1);
  for (let x = 2; x < W; x += 8) px(c, '#2f3238', x, NY.rail * T - 8, 1, 8);
  // 自由女神的小島
  const lx = NY.liberty.x * T;
  const ly = NY.liberty.y * T;
  c.fillStyle = '#8a8478';
  c.beginPath();
  c.ellipse(lx, ly, 3.8 * T, 0.95 * T, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#6a9f4e';
  c.beginPath();
  c.ellipse(lx, ly - 2, 3.5 * T, 0.75 * T, 0, 0, Math.PI * 2);
  c.fill();
  for (const dx of [-46, -36, 34, 44]) {
    c.fillStyle = '#3f7a36';
    c.beginPath();
    c.arc(lx + dx, ly - 6, 5, 0, Math.PI * 2);
    c.fill();
  }
}

// ── 曼哈頓天際線（遠景）：帝國大廈、克萊斯勒大廈、其他高樓 ──
const SKY_H = 84;
const SKY_BOTTOM = NY.skyline * T + 4;
const ESB_X = 37.5 * T;
const CHRYSLER_X = 18 * T;
function skylineSprite(): HTMLCanvasElement {
  return cached('ny-skyline', W, SKY_H, (c) => {
    const rand = seeded(1931);
    // 遠的一層（淡）、近的一層
    for (let x = -10; x < W; x += 14 + Math.floor(rand() * 18)) {
      const h = 22 + rand() * 30;
      const w = 16 + rand() * 18;
      px(c, '#aebfd2', x, SKY_H - h, w, h);
    }
    for (let x = -6; x < W; x += 20 + Math.floor(rand() * 22)) {
      if (Math.abs(x - ESB_X) < 30 || Math.abs(x - CHRYSLER_X) < 24) continue;
      const h = 26 + rand() * 34;
      const w = 18 + Math.floor(rand() * 16);
      const col = ['#8a9bb0', '#7f8ea4', '#94a3b5', '#9a9589'][Math.floor(rand() * 4)] ?? '#8a9bb0';
      px(c, col, x, SKY_H - h, w, h);
      px(c, 'rgba(255,255,255,0.18)', x, SKY_H - h, 2, h);
      px(c, 'rgba(0,0,0,0.12)', x + w - 3, SKY_H - h, 3, h);
      for (let wy = SKY_H - h + 4; wy < SKY_H - 4; wy += 4) for (let wx = x + 3; wx < x + w - 3; wx += 3) px(c, 'rgba(40,52,70,0.35)', wx, wy, 1, 2);
      if (rand() < 0.3) px(c, col, x + w / 2 - 1, SKY_H - h - 6, 2, 6);
    }
    // 克萊斯勒大廈：細長的樓身、層層的拱形尖頂（三角窗）、尖針
    const cx = CHRYSLER_X;
    px(c, '#a9a6a0', cx - 15, 56, 30, 28);
    px(c, '#bab7b0', cx - 10, 30, 20, 54);
    px(c, 'rgba(0,0,0,0.15)', cx + 4, 30, 6, 54);
    for (let y = 32; y < 82; y += 3) for (let x = cx - 8; x < cx + 8; x += 3) px(c, '#5c6574', x, y, 1, 2);
    for (let k = 0; k < 5; k += 1) {
      const w = 18 - k * 3.4;
      const yb = 31 - k * 4.6;
      c.fillStyle = k % 2 ? '#cfd5dc' : '#e6ebf0';
      c.beginPath();
      c.moveTo(cx - w / 2, yb);
      c.lineTo(cx - w / 2, yb - 2);
      c.arc(cx, yb - 2, w / 2, Math.PI, 0);
      c.lineTo(cx + w / 2, yb);
      c.fill();
      for (let t = -2; t <= 2; t += 1) {
        if (Math.abs(t) * 3 > w / 2 - 1) continue;
        c.fillStyle = '#3a4250';
        c.beginPath();
        c.moveTo(cx + t * 3 - 1, yb - 1);
        c.lineTo(cx + t * 3, yb - 4);
        c.lineTo(cx + t * 3 + 1, yb - 1);
        c.fill();
      }
    }
    c.fillStyle = '#e6ebf0';
    c.beginPath();
    c.moveTo(cx - 2, 12);
    c.lineTo(cx, 0);
    c.lineTo(cx + 2, 12);
    c.fill();
    // 帝國大廈：一段段退縮的石灰岩樓身、直條紋、頂上的尖塔
    const ex = ESB_X;
    px(c, '#bdb6a6', ex - 24, 64, 48, 20);
    px(c, '#c6bfae', ex - 17, 50, 34, 14);
    px(c, '#cfc8b7', ex - 11, 20, 22, 30);
    px(c, 'rgba(0,0,0,0.13)', ex + 4, 20, 7, 44);
    px(c, 'rgba(0,0,0,0.13)', ex + 9, 50, 8, 34);
    for (let x = ex - 10; x < ex + 11; x += 3) px(c, '#9c9584', x, 21, 1, 29);
    for (let x = ex - 16; x < ex + 17; x += 3) px(c, '#a29b8a', x, 51, 1, 12);
    for (let x = ex - 22; x < ex + 23; x += 4) px(c, '#a29b8a', x, 66, 1, 16);
    px(c, '#d6cfbe', ex - 8, 15, 16, 5);
    px(c, '#ddd6c6', ex - 5, 10, 10, 5);
    px(c, '#e2dccb', ex - 3, 6, 6, 4);
    px(c, '#b8b1a0', ex - 1, 0, 2, 6);
    px(c, '#9e9888', ex, 0, 1, 6);
  });
}
// 晚上：天際線的窗戶燈、帝國大廈頂端打燈（慢慢換色）、克萊斯勒的三角窗亮白光
function skylineNightSprite(): HTMLCanvasElement {
  return cached('ny-skyline-night', W, SKY_H, (c) => {
    const rand = seeded(77);
    for (let i = 0; i < 260; i += 1) px(c, rand() < 0.7 ? '#ffe29a' : '#ffffff', Math.floor(rand() * W), Math.floor(SKY_H - 6 - rand() * 46), 1, 2);
    for (let k = 0; k < 5; k += 1) for (let t = -2; t <= 2; t += 1) if (Math.abs(t) * 3 <= 8 - k * 1.7) px(c, '#ffffff', CHRYSLER_X + t * 3, 27 - k * 4.6, 1, 3);
  });
}
function drawSkyline(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, skylineSprite(), 0, SKY_BOTTOM);
  if (!d.night) return;
  blit(c, skylineNightSprite(), 0, SKY_BOTTOM);
  const top = SKY_BOTTOM - SKY_H;
  const cols = ['#ffffff', '#ffd25a', '#ff5a5a', '#5a9aff'];
  const col = cols[Math.floor(d.seconds / 8) % cols.length] ?? '#ffffff';
  px(c, col, ESB_X - 8, top + 15, 16, 5);
  px(c, col, ESB_X - 5, top + 10, 10, 5);
  px(c, col, ESB_X - 3, top + 6, 6, 4);
  if (Math.floor(d.seconds * 1.2) % 2 === 0) px(c, '#ff4040', ESB_X - 1, top - 1, 2, 2);
}

// ── 中央公園：樹、路燈、弓橋、划船、鴨子、馬車、遛狗 ──
function drawParkTree(c: CanvasRenderingContext2D, x: number, y: number, big = 1): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - Math.round(11 * big), by - 1, Math.round(22 * big), 3);
  px(c, '#5a3d26', cx - 2, by - Math.round(16 * big), 4, Math.round(16 * big));
  const blobs: [number, number, number, string][] = [
    [-8, -22, 9, '#3a7232'],
    [8, -22, 9, '#3a7232'],
    [0, -30, 11, '#468a3c'],
    [-5, -26, 8, '#529648'],
    [6, -31, 7, '#5ea452'],
    [0, -19, 8, '#427e38'],
  ];
  for (const [dx, dy, r, col] of blobs) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx * big, by + dy * big, r * big, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#7ab86a', cx - 4, by - Math.round(36 * big), 3, 2);
  px(c, '#7ab86a', cx + 4, by - Math.round(30 * big), 2, 2);
}

// 中央公園的黑色鑄鐵路燈（圓燈罩）
function drawParkLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  px(c, '#24262b', cx - 2, by - 4, 5, 4);
  px(c, '#2f3238', cx, by - 24, 2, 22);
  px(c, '#24262b', cx - 1, by - 26, 4, 2);
  px(c, night ? '#fff4c0' : '#e9e6da', cx - 2, by - 32, 6, 6);
  px(c, night ? '#ffffff' : '#f8f6ee', cx - 1, by - 31, 2, 2);
  px(c, '#24262b', cx - 1, by - 34, 4, 2);
  if (night) glow(c, cx + 1, by - 29, 12, '255, 230, 160', 0.55);
}

// 弓橋：奶油色的鑄鐵橋，淺淺的拱、欄杆上一圈圈的花紋、兩頭的花盆
function drawBowBridge(c: CanvasRenderingContext2D): void {
  const ch = NY.channel;
  const x0 = NY.bridge.x0 * T;
  const x1 = NY.bridge.x1 * T;
  const front = Math.round(NY.bridge.y * T);
  const top = Math.round(8.05 * T);
  const spring = 10.3 * T;
  // 兩頭的石頭橋墩
  for (const [a, b] of [[x0, ch.x0 * T + 4], [ch.x1 * T - 4, x1]] as const) {
    px(c, '#9c968a', a, front, b - a, spring - front);
    for (let y = front + 3; y < spring; y += 4) px(c, '#857f72', a, y, b - a, 1);
  }
  // 橋面（木板）
  px(c, '#cbb796', x0, top, x1 - x0, front - top);
  for (let x = x0; x < x1; x += 3) px(c, '#b8a37f', x, top, 1, front - top);
  // 拱與拱肩的鐵件
  const ax0 = ch.x0 * T + 2;
  const ax1 = ch.x1 * T - 2;
  const arch = (x: number) => {
    const t = (x - ax0) / (ax1 - ax0);
    return spring - Math.sin(t * Math.PI) * (spring - front - 5);
  };
  c.strokeStyle = '#efe9d8';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(ax0, arch(ax0));
  for (let x = ax0; x <= ax1; x += 2) c.lineTo(x, arch(x));
  c.stroke();
  for (let x = ax0 + 4; x < ax1 - 2; x += 6) px(c, '#e3dcc8', Math.round(x), front + 2, 1, Math.max(0, Math.round(arch(x) - front - 2)));
  px(c, '#efe9d8', x0, front, x1 - x0, 3);
  px(c, '#c9c0a8', x0, front + 3, x1 - x0, 1);
  // 欄杆（一圈圈的花紋）
  px(c, '#f4efe0', x0, front - 9, x1 - x0, 2);
  px(c, '#f4efe0', x0, front - 2, x1 - x0, 2);
  c.strokeStyle = '#e8e1cc';
  c.lineWidth = 1;
  for (let x = x0 + 4; x < x1 - 2; x += 6) {
    c.beginPath();
    c.arc(x, front - 4.5, 2.5, 0, Math.PI * 2);
    c.stroke();
  }
  // 花盆
  for (const x of [x0 + 2, x1 - 8]) {
    px(c, '#efe9d8', x, front - 14, 6, 5);
    px(c, '#efe9d8', x + 1, front - 9, 4, 2);
    px(c, '#4f8a3c', x - 1, front - 18, 8, 4);
    px(c, '#e2557a', x + 2, front - 18, 2, 2);
  }
}

// 湖上的小船（慢慢划來划去）、鴨子
function drawPondLife(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const p = NY.pool;
  const span = (p.x1 - p.x0 - 4) * T;
  for (let k = 0; k < 2; k += 1) {
    const t = (d.seconds * 0.02 + k * 0.5) % 2;
    const f = t < 1 ? t : 2 - t;
    const x = p.x0 * T + 2 * T + f * span;
    const y = (p.y0 + 1.3 + k * 0.7) * T;
    px(c, 'rgba(0,0,0,0.18)', x - 10, y + 1, 20, 2);
    px(c, k ? '#2f6aa8' : '#c84a3a', x - 10, y - 3, 20, 4);
    px(c, 'rgba(255,255,255,0.4)', x - 10, y - 3, 20, 1);
    px(c, '#f2d2b0', x - 2, y - 9, 4, 4);
    px(c, k ? '#f2c94c' : '#ffffff', x - 3, y - 6, 6, 3);
    const oar = Math.sin(d.seconds * 2 + k) * 2;
    px(c, '#8a6a42', x - 9, y - 5 + oar, 7, 1);
    px(c, '#8a6a42', x + 2, y - 5 - oar, 7, 1);
  }
  for (let k = 0; k < 3; k += 1) {
    const x = (p.x0 + 8 + k * 9 + Math.sin(d.seconds * 0.15 + k * 2) * 3) * T;
    const y = (p.y0 + 0.8 + (k % 2) * 1.2) * T;
    px(c, '#ffffff', x, y - 3, 5, 3);
    px(c, '#ffffff', x + 4, y - 6, 2, 3);
    px(c, '#f2a33a', x + 6, y - 5, 2, 1);
  }
}

// 公園道路上的馬車（白馬或棕馬拉著黑色的車）
function drawCarriage(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
  const span = W + 120;
  const x = ((d.seconds * 12) % span) - 60;
  const by = Math.round(14.55 * T);
  const step = Math.floor(d.seconds * 4) % 2;
  // 馬
  const hx = x + 22;
  px(c, 'rgba(0,0,0,0.2)', hx - 10, by - 1, 22, 2);
  px(c, '#8a5a32', hx - 9, by - 13, 18, 7);
  for (const [lx, alt] of [[-8, 0], [-4, 1], [3, 0], [7, 1]] as const) px(c, '#6a4226', hx + lx, by - 6, 2, step === alt ? 6 : 5);
  px(c, '#8a5a32', hx + 7, by - 19, 5, 8);
  px(c, '#8a5a32', hx + 10, by - 19, 5, 4);
  px(c, '#3a2a1a', hx + 6, by - 20, 2, 8);
  px(c, '#3a2a1a', hx - 11, by - 12, 2, 6);
  px(c, '#c8102e', hx - 2, by - 14, 2, 3);
  // 車
  px(c, '#3a3d45', x + 10, by - 10, 12, 1);
  px(c, '#15171f', x - 14, by - 14, 24, 9);
  px(c, '#8a1a1a', x - 12, by - 18, 12, 5);
  px(c, '#15171f', x - 14, by - 26, 3, 12);
  c.fillStyle = '#15171f';
  c.beginPath();
  c.arc(x - 12, by - 22, 8, Math.PI, Math.PI * 1.5);
  c.lineTo(x - 12, by - 22);
  c.fill();
  // 車夫（高帽）
  px(c, '#f2d2b0', x + 3, by - 21, 4, 4);
  px(c, '#2a2a33', x + 2, by - 17, 6, 5);
  px(c, '#15171f', x + 2, by - 23, 6, 1);
  px(c, '#15171f', x + 3, by - 27, 4, 4);
  for (const wx of [x - 9, x + 6]) {
    c.strokeStyle = '#2a2a33';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(wx, by - 4, 4, 0, Math.PI * 2);
    c.stroke();
    px(c, '#c8a24a', wx - 1, by - 5, 2, 2);
  }
  c.restore();
}

// 遛狗的人：沿著湖北岸的步道來回走，小狗跑在前面
function drawDogWalker(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = 33;
  const x1 = 54;
  const span = x1 - x0;
  const t = (d.seconds * 0.6) / span % 2;
  const f = t < 1 ? t : 2 - t;
  const dir = t < 1 ? 1 : -1;
  const x = x0 + f * span;
  const y = 9.1;
  const frame = Math.floor(d.seconds / 0.16) % 2 === 0 ? 'walkA' : 'walkB';
  const look = getAvatarFrame(lookColors(2, 1, { body: 1 }), dir > 0 ? 'right' : 'left', frame);
  const pxX = Math.round(x * T);
  const pxY = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', pxX - 5, pxY + 3, 10, 2);
  c.drawImage(look, Math.round(pxX - AVATAR_SIZE.w / 2), Math.round(pxY + 5 - AVATAR_SIZE.h), AVATAR_SIZE.w, AVATAR_SIZE.h);
  const dx = pxX + dir * 16;
  const hop = Math.floor(d.seconds * 6) % 2;
  c.strokeStyle = '#c8102e';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(pxX + dir * 4, pxY - 4);
  c.lineTo(dx - dir * 3, pxY - 1);
  c.stroke();
  px(c, 'rgba(0,0,0,0.2)', dx - 5, pxY + 3, 10, 2);
  px(c, '#c8913a', dx - 5, pxY - 3 - hop, 9, 4);
  px(c, '#c8913a', dx + (dir > 0 ? 3 : -6), pxY - 6 - hop, 4, 4);
  px(c, '#7a5222', dx + (dir > 0 ? 5 : -6), pxY - 7 - hop, 2, 2);
  px(c, '#c8913a', dx + (dir > 0 ? -6 : 5), pxY - 5 - hop, 2, 2);
  px(c, '#7a5222', dx - 4, pxY + 1 - hop, 1, 2);
  px(c, '#7a5222', dx + 2, pxY + 1 - hop, 1, 2);
}

// ── 電子看板：自己編的通用內容（音樂劇、特賣、咖啡、天氣、專注計時、貓、彩色波浪、夏天、笑臉），幾秒換一次 ──
const SCENES = 9;
function drawScreen(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number, s: number): void {
  const k = (Math.floor(s / 6 + seed * 0.37) + seed) % SCENES;
  const big = Math.max(6, Math.min(h * 0.42, w / 5.2));
  const small = Math.max(4, big * 0.48);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  const cx = x + w / 2;
  const cy = y + h / 2;
  if (k === 0) {
    px(c, '#2a1450', x, y, w, h);
    c.fillStyle = 'rgba(255,230,120,0.25)';
    c.beginPath();
    c.moveTo(cx + Math.sin(s) * w * 0.2, y);
    c.lineTo(cx - w * 0.3, y + h);
    c.lineTo(cx + w * 0.3, y + h);
    c.fill();
    text(c, 'NEW MUSICAL', cx, cy - small * 0.6, '#ffd84a', `900 ${big * 0.7}px ${FONT_TC}`);
    text(c, '今晚開演 ★ TONIGHT', cx, cy + big * 0.55, '#ffffff', `700 ${small}px ${FONT_TC}`);
  } else if (k === 1) {
    px(c, '#d42a2a', x, y, w, h);
    for (let i = 0; i < w; i += 10) px(c, '#e8403a', x + i, y, 5, h);
    text(c, 'SALE', cx, cy - small * 0.4, '#ffe14a', `900 ${big}px ${FONT_TC}`);
    if (Math.floor(s * 2) % 2 === 0) text(c, '全館 50% OFF', cx, cy + big * 0.6, '#ffffff', `900 ${small}px ${FONT_TC}`);
  } else if (k === 2) {
    px(c, '#6a3e22', x, y, w, h);
    const cup = Math.min(h * 0.5, w * 0.25);
    px(c, '#ffffff', x + w * 0.18, cy - cup / 2 + 2, cup, cup);
    px(c, '#ffffff', x + w * 0.18 + cup, cy - cup / 4 + 2, cup * 0.25, cup * 0.4);
    px(c, '#c8913a', x + w * 0.18 + 2, cy - cup / 2 + 4, cup - 4, 3);
    for (let i = 0; i < 3; i += 1) px(c, 'rgba(255,255,255,0.6)', x + w * 0.18 + cup * (0.2 + i * 0.3), cy - cup / 2 - 4 - ((s * 6 + i * 3) % 8), 2, 3);
    text(c, 'COFFEE', x + w * 0.66, cy - small * 0.4, '#ffe8c8', `900 ${big * 0.7}px ${FONT_TC}`);
    text(c, '熱拿鐵 $3', x + w * 0.66, cy + big * 0.5, '#ffc870', `700 ${small}px ${FONT_TC}`);
  } else if (k === 3) {
    const g = c.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#2b7fd8');
    g.addColorStop(1, '#8fd0ff');
    c.fillStyle = g;
    c.fillRect(x, y, w, h);
    c.fillStyle = '#ffd84a';
    c.beginPath();
    c.arc(x + w * 0.2, cy, Math.min(h, w) * 0.25, 0, Math.PI * 2);
    c.fill();
    text(c, 'NYC 18°C', x + w * 0.62, cy - small * 0.4, '#ffffff', `900 ${big * 0.75}px ${FONT_TC}`);
    text(c, '晴天 SUNNY', x + w * 0.62, cy + big * 0.5, '#e8f6ff', `700 ${small}px ${FONT_TC}`);
  } else if (k === 4) {
    px(c, '#0d1018', x, y, w, h);
    const left = 1500 - (Math.floor(s) % 1500);
    const mm = String(Math.floor(left / 60)).padStart(2, '0');
    const ss = String(left % 60).padStart(2, '0');
    text(c, 'FOCUS', cx, cy - big * 0.45, '#7ae0a0', `900 ${small * 1.2}px ${FONT_TC}`);
    text(c, `${mm}:${ss}`, cx, cy + small * 0.5, '#ffffff', `900 ${big}px ${FONT_TC}`);
  } else if (k === 5) {
    px(c, '#ffb6c8', x, y, w, h);
    const r = Math.min(h, w) * 0.34;
    c.fillStyle = '#5a4a40';
    c.beginPath();
    c.moveTo(cx - r, cy - r * 0.2);
    c.lineTo(cx - r * 0.8, cy - r * 1.2);
    c.lineTo(cx - r * 0.3, cy - r * 0.7);
    c.lineTo(cx + r * 0.3, cy - r * 0.7);
    c.lineTo(cx + r * 0.8, cy - r * 1.2);
    c.lineTo(cx + r, cy - r * 0.2);
    c.arc(cx, cy, r, 0, Math.PI);
    c.fill();
    const blink = Math.floor(s * 1.5) % 6 === 0;
    px(c, '#ffe14a', cx - r * 0.5, cy - r * 0.2, r * 0.25, blink ? 1 : r * 0.25);
    px(c, '#ffe14a', cx + r * 0.25, cy - r * 0.2, r * 0.25, blink ? 1 : r * 0.25);
    px(c, '#ff7a9a', cx - 1, cy + r * 0.2, 3, 2);
    text(c, 'MEOW', x + w * 0.12, y + h * 0.2, '#ffffff', `900 ${small}px ${FONT_TC}`, 'left');
  } else if (k === 6) {
    const cols = ['#ff4d6d', '#ff9f1c', '#ffe14a', '#3ddc84', '#2bb7ff', '#9b5de5'];
    for (let i = 0; i < 12; i += 1) {
      const col = cols[(i + Math.floor(s * 3)) % cols.length] ?? '#fff';
      px(c, col, x, y + (i * h) / 12, w, h / 12 + 1);
    }
    text(c, 'HELLO NEW YORK', cx, cy, '#ffffff', `900 ${big * 0.6}px ${FONT_TC}`);
  } else if (k === 7) {
    px(c, '#19b5b0', x, y, w, h);
    for (let i = 0; i < w; i += 6) px(c, '#ffffff', x + i, y + h * 0.75 + Math.sin(i * 0.2 + s * 3) * 2, 6, 2);
    px(c, '#0e8a86', x, y + h * 0.78, w, h * 0.22);
    text(c, 'SUMMER', cx, cy - small * 0.5, '#fff6c8', `900 ${big * 0.8}px ${FONT_TC}`);
  } else {
    px(c, '#1a1a2e', x, y, w, h);
    const r = Math.min(h, w) * 0.32;
    c.fillStyle = '#ffd84a';
    c.beginPath();
    c.arc(x + w * 0.25, cy, r, 0, Math.PI * 2);
    c.fill();
    px(c, '#1a1a2e', x + w * 0.25 - r * 0.4, cy - r * 0.35, 2, 3);
    px(c, '#1a1a2e', x + w * 0.25 + r * 0.3, cy - r * 0.35, 2, 3);
    c.strokeStyle = '#1a1a2e';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(x + w * 0.25, cy, r * 0.55, 0.2, Math.PI - 0.2);
    c.stroke();
    text(c, '今天也加油', x + w * 0.64, cy - small * 0.5, '#ffffff', `900 ${small * 1.1}px ${FONT_TC}`);
    text(c, 'YOU GOT THIS', x + w * 0.64, cy + small * 0.7, '#ffd84a', `700 ${small * 0.8}px ${FONT_TC}`);
  }
  c.restore();
  // 外框
  c.strokeStyle = '#15171f';
  c.lineWidth = 1;
  c.strokeRect(x - 0.5, y - 0.5, w + 1, h + 1);
}

// 跑馬燈（LED 字）
const TICKER = '★ 今日紐約 晴 18°C  ★ FOCUS ISLAND NEWS  ★ 專注 25 分鐘、休息 5 分鐘  ★ BROADWAY TONIGHT  ★ 時代廣場歡迎你  ★ STAY FOCUSED  ';
function drawTicker(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number): void {
  px(c, '#0a0a0e', x, y, w, h);
  c.save();
  c.beginPath();
  c.rect(x, y, w, h);
  c.clip();
  c.font = `900 ${h - 2}px ${FONT_TC}`;
  const tw = c.measureText(TICKER).width;
  const off = (s * 22) % tw;
  text(c, TICKER + TICKER, x - off, y + h / 2 + 0.5, '#ff9a2a', `900 ${h - 2}px ${FONT_TC}`, 'left');
  c.restore();
}

// ── 時代廣場的大樓（快取的樓身）＋每幀畫的看板 ──
interface Screen {
  x: number;
  y: number;
  w: number;
  h: number;
  seed: number;
}
interface Tower {
  key: string;
  x0: number;
  x1: number;
  base: number;
  h: number;
  wall: string;
  screens: Screen[];
  ticker?: { x: number; y: number; w: number; h: number };
  store?: 'theater' | 'pizza' | 'deli' | 'glass';
}
const sc = (x: number, y: number, w: number, h: number, seed: number): Screen => ({ x, y, w, h, seed });
const TOWERS: Tower[] = [
  { key: 'a', x0: 0, x1: 9, base: NY.north, h: 170, wall: '#5c6170', screens: [sc(10, 14, 124, 46, 3), sc(10, 66, 60, 30, 8)], store: 'glass' },
  { key: 'b', x0: 12, x1: 24, base: NY.north, h: 152, wall: '#7a6e64', screens: [sc(14, 16, 164, 56, 1), sc(8, 82, 70, 32, 5), sc(114, 82, 70, 32, 2)], store: 'theater' },
  { key: 'one', x0: 24, x1: 32, base: NY.north, h: 178, wall: '#4a4c56', screens: [sc(10, 22, 108, 42, 6), sc(10, 68, 108, 32, 0), sc(10, 118, 108, 30, 7)], ticker: { x: 6, y: 104, w: 116, h: 10 }, store: 'glass' },
  { key: 'c', x0: 32, x1: 44, base: NY.north, h: 152, wall: '#666e7c', screens: [sc(10, 14, 148, 52, 4), sc(166, 10, 18, 104, 9), sc(10, 74, 148, 34, 6)], store: 'theater' },
  { key: 'd', x0: 47, x1: 56, base: NY.north, h: 170, wall: '#6e6258', screens: [sc(10, 14, 124, 46, 7), sc(74, 66, 60, 30, 2)], store: 'glass' },
  { key: 'w', x0: 0, x1: NY.flank.w, base: NY.flank.line, h: 150, wall: '#585d6a', screens: [sc(10, 10, 116, 50, 5), sc(10, 66, 116, 30, 1)], ticker: { x: 4, y: 100, w: 128, h: 9 }, store: 'pizza' },
  { key: 'e', x0: NY.W - NY.flank.w, x1: NY.W, base: NY.flank.line, h: 150, wall: '#6a5c56', screens: [sc(10, 10, 116, 50, 0), sc(10, 66, 116, 30, 8)], ticker: { x: 4, y: 100, w: 128, h: 9 }, store: 'deli' },
];

function towerSprite(b: Tower): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  return cached(`ny-tower-${b.key}`, w, b.h, (c) => {
    const rand = seeded(b.key.charCodeAt(0) * 31 + b.h);
    px(c, b.wall, 0, 0, w, b.h);
    px(c, 'rgba(255,255,255,0.12)', 0, 0, 3, b.h);
    px(c, 'rgba(0,0,0,0.2)', w - 4, 0, 4, b.h);
    px(c, 'rgba(0,0,0,0.3)', 0, 0, w, 3);
    // 窗戶
    for (let y = 6; y < b.h - 24; y += 6) for (let x = 5; x < w - 6; x += 6) px(c, rand() < 0.2 ? '#7a8aa4' : '#36405a', x, y, 4, 3);
    // 看板的鐵架（看板本身每幀畫）
    for (const s of b.screens) {
      px(c, '#22242a', s.x - 3, s.y - 3, s.w + 6, s.h + 6);
      px(c, '#3a3d45', s.x - 3, s.y + s.h + 3, s.w + 6, 1);
    }
    if (b.ticker) px(c, '#22242a', b.ticker.x - 2, b.ticker.y - 2, b.ticker.w + 4, b.ticker.h + 4);
    // 一樓的店面
    const g = b.h - 22;
    px(c, '#2a2c33', 0, g, w, 22);
    if (b.store === 'theater') {
      // 劇院的雨遮：一圈燈泡（燈泡每幀閃）、字
      px(c, '#1a1a22', 8, g + 2, w - 16, 9);
      px(c, '#f6c945', 8, g + 2, w - 16, 1);
      px(c, '#f6c945', 8, g + 10, w - 16, 1);
      text(c, b.key === 'b' ? 'SHOW TONIGHT · 今晚演出' : 'THEATRE · 百老匯劇院', w / 2, g + 6.5, '#ffe08a', `900 6px ${FONT_TC}`);
      for (let x = 12; x < w - 12; x += 14) px(c, '#f6dfae', x, g + 13, 10, 9);
    } else if (b.store === 'pizza') {
      for (let x = 0; x < w; x += 8) px(c, ['#c8102e', '#f4f1e8', '#2a8a3a'][(x / 8) % 3] ?? '#c8102e', x, g, 8, 6);
      px(c, 'rgba(0,0,0,0.25)', 0, g + 6, w, 1);
      px(c, '#f6dfae', 6, g + 8, w - 40, 13);
      for (let x = 10; x < w - 44; x += 14) {
        c.fillStyle = '#e8b04a';
        c.beginPath();
        c.moveTo(x, g + 18);
        c.lineTo(x + 5, g + 10);
        c.lineTo(x + 10, g + 18);
        c.fill();
        px(c, '#c8402a', x + 4, g + 14, 2, 2);
      }
      px(c, '#5a3a22', w - 30, g + 8, 20, 14);
      px(c, '#ffffff', 8, g - 14, 60, 11);
      text(c, 'PIZZA · 披薩', 38, g - 8.5, '#c8102e', `900 7px ${FONT_TC}`);
    } else if (b.store === 'deli') {
      px(c, '#1f3a6a', 0, g, w, 6);
      for (let x = 0; x < w; x += 6) px(c, '#2a4e8a', x, g + 4, 3, 2);
      px(c, '#f6dfae', 30, g + 8, w - 36, 13);
      for (let x = 34; x < w - 10; x += 10) {
        c.strokeStyle = '#c8913a';
        c.lineWidth = 2.5;
        c.beginPath();
        c.arc(x + 3, g + 15, 3, 0, Math.PI * 2);
        c.stroke();
      }
      px(c, '#5a3a22', 6, g + 8, 18, 14);
      px(c, '#ffffff', w - 72, g - 14, 64, 11);
      text(c, 'BAGELS · DELI', w - 40, g - 8.5, '#1f3a6a', `900 7px ${FONT_TC}`);
    } else {
      for (let x = 6; x < w - 6; x += 16) px(c, '#9fc7d9', x, g + 5, 12, 15);
    }
    // One Times Square：頂上的旗桿和水晶球
    if (b.key === 'one') {
      px(c, '#3a3c44', 20, 0, w - 40, 10);
      px(c, '#9aa0a8', w / 2 - 1, -0, 2, 10);
    }
  });
}

function drawTower(c: CanvasRenderingContext2D, b: Tower, d: DrawCtx): void {
  const x = b.x0 * T;
  const top = b.base * T - b.h;
  blit(c, towerSprite(b), x, b.base * T);
  for (const s of b.screens) drawScreen(c, x + s.x, top + s.y, s.w, s.h, s.seed, d.seconds);
  if (b.ticker) drawTicker(c, x + b.ticker.x, top + b.ticker.y, b.ticker.w, b.ticker.h, d.seconds + b.x0);
  if (b.store === 'theater') {
    const g = top + b.h - 22;
    const w = (b.x1 - b.x0) * T;
    for (let bx = 9, k = 0; bx < w - 9; bx += 5, k += 1) {
      const on = (k + Math.floor(d.seconds * 4)) % 3 !== 0;
      px(c, on ? '#fff3b0' : '#b08a3a', x + bx, g + 1, 2, 1);
    }
  }
  if (b.key === 'one') {
    // 跨年的水晶球
    const cx = x + ((b.x1 - b.x0) * T) / 2;
    const tw = Math.floor(d.seconds * 3) % 4;
    c.fillStyle = '#dfe8f2';
    c.beginPath();
    c.arc(cx, top - 4, 5, 0, Math.PI * 2);
    c.fill();
    px(c, ['#ff6a8a', '#ffe14a', '#6ad6ff', '#ffffff'][tw] ?? '#fff', cx - 2, top - 7, 2, 2);
    px(c, ['#6ad6ff', '#ffffff', '#ff6a8a', '#ffe14a'][tw] ?? '#fff', cx + 1, top - 4, 2, 2);
    px(c, '#ffffff', cx - 3, top - 3, 1, 1);
  }
}

// 紅色階梯南邊的售票亭正面（階梯最高的那頭）
function drawTicketBooth(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const s = NY.steps;
  const x0 = s.x0 * T;
  const w = (s.x1 - s.x0) * T;
  const y0 = s.y1 * T - 1;
  const by = 31.25 * T;
  px(c, 'rgba(0,0,0,0.25)', x0, by, w, 3);
  px(c, '#b81e1e', x0, y0, w, by - y0);
  px(c, '#ff5a50', x0, y0, w, 1);
  for (let x = x0 + 6; x < x0 + w - 6; x += 12) px(c, d.night ? '#ffe8c0' : '#3a2a30', x, y0 + 3, 8, 6);
  px(c, '#15171f', x0 + w / 2 - 22, y0 + 2, 44, 8);
  text(c, 'TICKETS 今日票', x0 + w / 2, y0 + 6, '#ffffff', `900 5px ${FONT_TC}`);
}

// 紐約的街頭推車：不鏽鋼車身、條紋大陽傘、老闆、掛著的椒鹽卷餅
function drawNyCart(c: CanvasRenderingContext2D, x: number, y: number, title: string, colA: string, colB: string, d: DrawCtx, seed: number, pretzel: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.22)', cx - 20, by, 40, 3);
  const owner = getAvatarFrame(lookColors(seed % 5, 3 + (seed % 3), { body: seed % 2 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - AVATAR_SIZE.w / 2), by - 10 - AVATAR_SIZE.h + 6, AVATAR_SIZE.w, AVATAR_SIZE.h);
  // 陽傘
  px(c, '#9aa0a8', cx - 1, by - 40, 2, 30);
  for (let k = 0; k < 8; k += 1) {
    c.fillStyle = k % 2 ? colA : colB;
    c.beginPath();
    c.moveTo(cx, by - 46);
    c.lineTo(cx - 24 + k * 6, by - 36);
    c.lineTo(cx - 18 + k * 6, by - 36);
    c.fill();
  }
  px(c, 'rgba(0,0,0,0.2)', cx - 24, by - 36, 48, 1);
  // 車身
  px(c, '#b8bec8', cx - 18, by - 14, 36, 12);
  px(c, '#e2e6ec', cx - 18, by - 14, 36, 2);
  px(c, '#8a909a', cx - 18, by - 3, 36, 1);
  px(c, '#ffffff', cx - 14, by - 11, 28, 6);
  text(c, title, cx, by - 8, colA, `900 4.5px ${FONT_TC}`);
  px(c, '#2a2c33', cx - 16, by - 2, 4, 3);
  px(c, '#2a2c33', cx + 12, by - 2, 4, 3);
  // 檯面上的東西＋冒煙
  if (pretzel) {
    for (let k = 0; k < 3; k += 1) {
      c.strokeStyle = '#a8642a';
      c.lineWidth = 2;
      c.beginPath();
      c.arc(cx - 10 + k * 10, by - 18, 3, 0, Math.PI * 2);
      c.stroke();
    }
  } else {
    for (let k = 0; k < 3; k += 1) {
      px(c, '#e8c47a', cx - 13 + k * 9, by - 17, 7, 3);
      px(c, '#b04a2a', cx - 12 + k * 9, by - 18, 5, 1);
    }
  }
  for (let k = 0; k < 2; k += 1) {
    const t = (d.seconds * 0.6 + k / 2) % 1;
    px(c, `rgba(255,255,255,${0.45 * (1 - t)})`, Math.round(cx - 6 + k * 10 + Math.sin(d.seconds * 2 + k) * 2), Math.round(by - 22 - t * 10), 3, 2);
  }
}

// 地鐵站入口：綠色鐵欄杆、往下的樓梯、兩盞綠色圓燈球、站牌
function drawSubway(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = NY.subway.x * T;
  const by = NY.subway.y * T;
  const x0 = cx - 22;
  const x1 = cx + 22;
  const top = by - 17;
  // 樓梯（越往下越暗）
  for (let k = 0; k < 6; k += 1) {
    const shade = 150 - k * 22;
    px(c, `rgb(${shade},${shade},${shade + 6})`, x0 + 4, top + 2 + k * 2.5, x1 - x0 - 8, 3);
    px(c, 'rgba(255,255,255,0.25)', x0 + 4, top + 2 + k * 2.5, x1 - x0 - 8, 1);
  }
  px(c, '#2a2c33', x0 + 4, top + 16, x1 - x0 - 8, by - top - 16);
  // 欄杆
  px(c, '#2e6a3c', x0, top - 9, x1 - x0, 2);
  px(c, '#2e6a3c', x0, top - 9, 2, by - top + 9);
  px(c, '#2e6a3c', x1 - 2, top - 9, 2, by - top + 9);
  for (let x = x0 + 4; x < x1 - 2; x += 4) px(c, '#3a7a4a', x, top - 7, 1, 7);
  for (let y = top; y < by; y += 4) {
    px(c, '#3a7a4a', x0 - 1, y, 4, 1);
    px(c, '#3a7a4a', x1 - 3, y, 4, 1);
  }
  // 綠色圓燈球
  for (const lx of [x0 - 1, x1 - 3]) {
    px(c, '#2e6a3c', lx, top - 26, 4, 18);
    c.fillStyle = d.night ? '#9dffb0' : '#4caf6a';
    c.beginPath();
    c.arc(lx + 2, top - 30, 4, 0, Math.PI * 2);
    c.fill();
    px(c, 'rgba(255,255,255,0.6)', lx, top - 32, 2, 2);
    if (d.night) glow(c, lx + 2, top - 30, 14, '120, 255, 150', 0.6);
  }
  // 站牌（黑底白字）
  px(c, '#15171f', cx - 34, top - 22, 68, 11);
  px(c, '#2e6a3c', cx - 25, top - 13, 1, 4);
  px(c, '#2e6a3c', cx + 24, top - 13, 1, 4);
  text(c, 'SUBWAY 往 JFK', cx + 4, top - 16.5, '#ffffff', `900 5px ${FONT_TC}`);
  for (let k = 0; k < 3; k += 1) px(c, ['#ee352e', '#0039a6', '#fccc0a'][k] ?? '#fff', cx - 31 + k * 3, top - 18, 2, 3);
}

// 時代廣場的紅色小桌椅
function drawBistro(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 14, by + 1, 28, 2);
  px(c, '#8a909a', cx - 6, by - 9, 12, 2);
  px(c, '#6a7080', cx - 1, by - 7, 2, 7);
  for (const dx of [-12, 8]) {
    px(c, '#d42a2a', dx + cx, by - 6, 5, 2);
    px(c, '#d42a2a', dx + cx + (dx < 0 ? 0 : 3), by - 12, 2, 6);
    px(c, '#9a1a18', dx + cx, by - 4, 1, 4);
    px(c, '#9a1a18', dx + cx + 4, by - 4, 1, 4);
  }
}

// 鋼骨路燈（時代廣場、水邊）
function drawCityLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 7, 2);
  px(c, '#3a4a40', cx, by - 30, 2, 30);
  px(c, '#3a4a40', cx - 6, by - 31, 8, 2);
  px(c, night ? '#fff1a8' : '#d8d2b8', cx - 7, by - 29, 5, 2);
  if (night) glow(c, cx - 4, by - 27, 12, '255, 230, 160', 0.5);
}

// ── 計程車、車、公車（用時間算，每條車道同速，不會撞在一起）──
interface Lane {
  y: number;
  dir: 1 | -1;
  n: number;
  speed: number;
  seed: number;
}
const LANES: Lane[] = [
  { y: 16.25, dir: -1, n: 5, speed: 3.4, seed: 3 },
  { y: 17.3, dir: 1, n: 5, speed: 3.0, seed: 11 },
  { y: 34.3, dir: -1, n: 6, speed: 2.8, seed: 19 },
  { y: 35.45, dir: 1, n: 6, speed: 3.2, seed: 27 },
];
function drawCar(c: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1, kind: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  if (kind === 2) {
    // 公車（藍白）
    px(c, 'rgba(0,0,0,0.3)', cx - 26, by - 1, 52, 3);
    px(c, '#eef0f2', cx - 26, by - 20, 52, 18);
    px(c, '#1f5fa8', cx - 26, by - 8, 52, 3);
    for (let wx = cx - 22; wx < cx + 22; wx += 8) px(c, '#3a4a5a', wx, by - 17, 6, 6);
    px(c, '#15171f', cx - 20, by - 3, 6, 3);
    px(c, '#15171f', cx + 14, by - 3, 6, 3);
    px(c, '#ffb020', cx + dir * 22 - 3, by - 19, 6, 2);
    if (night) glow(c, cx + dir * 30, by - 6, 12, '255, 240, 180', 0.35);
    return;
  }
  const body = kind === 0 ? '#f7c518' : kind === 1 ? '#15171f' : '#e8e8ea';
  px(c, 'rgba(0,0,0,0.3)', cx - 15, by - 1, 30, 3);
  px(c, body, cx - 15, by - 11, 30, 9);
  px(c, 'rgba(255,255,255,0.3)', cx - 15, by - 11, 30, 1);
  px(c, body, cx - 9, by - 16, 17, 6);
  px(c, '#9fd8ff', cx - 8, by - 15, 7, 4);
  px(c, '#9fd8ff', cx + 1, by - 15, 6, 4);
  if (kind === 0) {
    px(c, '#15171f', cx - 15, by - 6, 30, 1);
    px(c, '#ffffff', cx - 3, by - 19, 6, 3);
    px(c, '#15171f', cx - 4, by - 9, 8, 2);
  }
  px(c, '#15171f', cx - 11, by - 3, 6, 3);
  px(c, '#15171f', cx + 5, by - 3, 6, 3);
  px(c, '#fff3b0', cx + dir * 14, by - 9, 2, 3);
  px(c, '#e8402e', cx - dir * 15, by - 9, 1, 3);
  if (night) glow(c, cx + dir * 22, by - 6, 12, '255, 240, 180', 0.35);
}
function drawLane(c: CanvasRenderingContext2D, lane: Lane, d: DrawCtx): void {
  const span = NY.W + 8;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
  const r = seeded(lane.seed);
  for (let i = 0; i < lane.n; i += 1) {
    const roll = r();
    const kind = lane.y > 30 && i === 0 ? 2 : roll < 0.7 ? 0 : roll < 0.85 ? 1 : 3;
    const k = ((d.seconds * lane.speed) / span + i / lane.n + r() * 0.05) % 1;
    const x = lane.dir > 0 ? -4 + k * span : NY.W + 4 - k * span;
    drawCar(c, x, lane.y, lane.dir, kind, d.night);
  }
  c.restore();
}

// ── 褐石公寓：褐色砂岩的正面、上面的飛簷、高高的門前階梯（stoop）和鐵欄杆 ──
const BROWN_W = NY.brown.x1 / 4;
function brownstoneSprite(k: number): HTMLCanvasElement {
  const w = Math.round(BROWN_W * T);
  const h = 77;
  return cached(`ny-brown-${k}`, w, h, (c) => {
    const rand = seeded(400 + k * 13);
    const wall = ['#7a5040', '#6e4636', '#83594a', '#744a3a'][k % 4] ?? '#7a5040';
    const fb = h - 13;
    px(c, wall, 0, 4, w, fb - 4);
    for (let i = 0; i < 120; i += 1) px(c, 'rgba(0,0,0,0.08)', Math.floor(rand() * w), Math.floor(4 + rand() * (fb - 4)), 2, 1);
    px(c, 'rgba(0,0,0,0.25)', w - 1, 4, 1, fb - 4);
    // 飛簷＋托架
    px(c, '#3e2a20', 0, 0, w, 6);
    px(c, '#5a4030', 0, 6, w, 1);
    for (let x = 3; x < w; x += 9) px(c, '#3e2a20', x, 6, 3, 3);
    // 樓上的窗（白色窗框、石頭窗楣）
    const door = k % 2 === 0;
    const cols = door ? [w * 0.55, w * 0.78] : [w * 0.22, w * 0.45];
    const allCols = [w * 0.2, w * 0.5, w * 0.8];
    for (const fy of [12, 27]) {
      for (const cxw of allCols) {
        px(c, '#c9b89a', cxw - 6, fy - 2, 12, 2);
        px(c, '#f0ece2', cxw - 5, fy, 10, 11);
        px(c, rand() < 0.3 ? '#6a8aa4' : '#2c3446', cxw - 4, fy + 1, 8, 9);
        px(c, '#f0ece2', cxw - 0.5, fy + 1, 1, 9);
      }
    }
    // 會客層（parlor floor）：高窗＋門
    const doorX = door ? w * 0.22 : w * 0.78;
    for (const cxw of cols) {
      px(c, '#c9b89a', cxw - 6, 41, 12, 2);
      px(c, '#f0ece2', cxw - 5, 43, 10, 14);
      px(c, '#2c3446', cxw - 4, 44, 8, 12);
    }
    px(c, '#c9b89a', doorX - 8, 40, 16, 3);
    px(c, ['#1a2a1a', '#15171f', '#5a1a1a', '#1f2a44'][k % 4] ?? '#15171f', doorX - 5, 44, 10, 14);
    px(c, '#c9a24a', doorX + 2, 51, 1, 1);
    // 半地下層（花園層）的窗、鐵欄杆
    for (const cxw of cols) px(c, '#2c3446', cxw - 4, fb - 3, 8, 4);
    px(c, '#15171f', 0, fb + 1, w, 1);
    for (let x = 0; x < w; x += 3) px(c, '#15171f', x, fb + 1, 1, 6);
    // 門前階梯：從門口一階階往下到人行道
    const sx0 = doorX - 7;
    for (let s = 0; s < 7; s += 1) {
      const y = 58 + s * 2.7;
      px(c, '#8a6a58', sx0, y, 14, 3);
      px(c, '#a8846e', sx0, y, 14, 1);
    }
    px(c, '#15171f', sx0 - 1, 56, 1, h - 56);
    px(c, '#15171f', sx0 + 14, 56, 1, h - 56);
    c.strokeStyle = '#15171f';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(sx0 - 1, 52);
    c.lineTo(sx0 - 1, 56);
    c.moveTo(sx0 + 14, 52);
    c.lineTo(sx0 + 14, 56);
    c.stroke();
    // 階梯旁的盆栽
    px(c, '#4f8a3c', sx0 - 6, h - 6, 4, 4);
  });
}

// ── 水邊：自由女神、布魯克林大橋、渡輪、帆船 ──
function libertySprite(): HTMLCanvasElement {
  return cached('ny-liberty', 52, 100, (c) => {
    const cx = 26;
    // 星形堡壘底座
    c.fillStyle = '#b3a78f';
    c.beginPath();
    c.moveTo(2, 100);
    c.lineTo(6, 92);
    c.lineTo(14, 94);
    c.lineTo(20, 89);
    c.lineTo(32, 89);
    c.lineTo(38, 94);
    c.lineTo(46, 92);
    c.lineTo(50, 100);
    c.fill();
    px(c, '#cfc4ab', 14, 89, 24, 2);
    // 花崗岩基座
    c.fillStyle = '#cfc4ab';
    c.beginPath();
    c.moveTo(cx - 12, 90);
    c.lineTo(cx - 9, 56);
    c.lineTo(cx + 9, 56);
    c.lineTo(cx + 12, 90);
    c.fill();
    px(c, 'rgba(0,0,0,0.14)', cx + 3, 56, 7, 34);
    px(c, '#ddd3bb', cx - 11, 52, 22, 5);
    px(c, '#b2a78e', cx - 10, 74, 20, 2);
    for (let k = -1; k <= 1; k += 1) px(c, '#6a6458', cx + k * 5 - 1, 61, 3, 5);
    // 長袍
    c.fillStyle = '#6fb4a2';
    c.beginPath();
    c.moveTo(cx - 4, 22);
    c.lineTo(cx + 4, 22);
    c.lineTo(cx + 7, 52);
    c.lineTo(cx - 7, 52);
    c.fill();
    px(c, '#94d1c0', cx - 5, 26, 1, 24);
    for (const fx of [-3, 0, 3]) px(c, '#559885', cx + fx, 30, 1, 21);
    px(c, '#559885', cx - 7, 50, 14, 2);
    // 左手抱著法典
    px(c, '#4f8f80', cx + 2, 26, 4, 3);
    px(c, '#8fcbb9', cx + 3, 25, 4, 9);
    px(c, '#559885', cx + 3, 33, 4, 1);
    // 頭、冠冕的光芒
    px(c, '#6fb4a2', cx - 3, 15, 6, 7);
    px(c, '#94d1c0', cx - 2, 16, 3, 4);
    px(c, '#559885', cx - 4, 14, 8, 2);
    c.strokeStyle = '#6fb4a2';
    c.lineWidth = 1.2;
    for (let k = 0; k < 7; k += 1) {
      const a = Math.PI + 0.25 + (k / 6) * (Math.PI - 0.5);
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * 3, 14 + Math.sin(a) * 2);
      c.lineTo(cx + Math.cos(a) * 8, 14 + Math.sin(a) * 6);
      c.stroke();
    }
    // 舉起來的右手＋火炬
    c.strokeStyle = '#6fb4a2';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(cx - 4, 24);
    c.lineTo(cx - 7, 8);
    c.stroke();
    px(c, '#559885', cx - 9, 4, 4, 4);
    px(c, '#f4b63a', cx - 9, 0, 4, 4);
    px(c, '#ffe39a', cx - 8, 0, 2, 2);
  });
}
const LIBERTY_SCALE = 0.84;
function drawLiberty(c: CanvasRenderingContext2D, d: DrawCtx): void {
  // 遠景：縮小一點，整座都在水面上
  const s = LIBERTY_SCALE;
  c.drawImage(libertySprite(), Math.round(NY.liberty.x * T - 26 * s), Math.round(NY.liberty.y * T - 100 * s), 52 * s, 100 * s);
  if (d.night) {
    const tx = NY.liberty.x * T - 7 * s;
    const ty = NY.liberty.y * T - 98 * s;
    px(c, '#ffe39a', tx - 2, ty - 1, 4, 4);
    glow(c, tx, ty + 1, 16, '255, 200, 90', 0.8);
  }
}

// 布魯克林大橋：石造的哥德式橋塔（兩個尖拱）、主纜、放射狀的斜索、晚上像項鍊一樣的燈
function drawBrooklynBridge(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const tx = NY.bridgeTower.x * T;
  const base = NY.bridgeTower.y * T;
  const deck = base - 30;
  const top = base - 86;
  const west = 40.5 * T;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, H);
  c.clip();
  // 西邊的錨碇
  px(c, '#a8987e', west - 18, deck - 6, 26, base - 10 - deck + 6);
  px(c, '#bba98e', west - 18, deck - 6, 26, 2);
  px(c, 'rgba(0,0,0,0.15)', west + 2, deck - 6, 6, base - 10 - deck + 6);
  // 橋面
  px(c, 'rgba(0,0,0,0.18)', west, deck + 6, W - west, 3);
  px(c, '#4a4440', west, deck - 2, W - west, 6);
  px(c, '#6a625a', west, deck - 2, W - west, 1);
  for (let x = west; x < W; x += 5) px(c, '#3a3430', x, deck + 1, 1, 3);
  // 主纜（兩邊垂下來）＋吊索
  const cable = (x0: number, y0: number, x1: number, y1: number, sag: number) => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 24; i += 1) {
      const t = i / 24;
      pts.push([x0 + (x1 - x0) * t, y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * sag]);
    }
    c.strokeStyle = '#4a4744';
    c.lineWidth = 1.5;
    c.beginPath();
    pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.stroke();
    c.strokeStyle = 'rgba(70,68,66,0.6)';
    c.lineWidth = 1;
    for (const [x, y] of pts) {
      if (y >= deck - 2) continue;
      c.beginPath();
      c.moveTo(x, y);
      c.lineTo(x, deck - 2);
      c.stroke();
    }
    return pts;
  };
  const westPts = cable(tx - 12, top + 8, west, deck - 6, 26);
  const eastPts = cable(tx + 12, top + 8, W + 120, deck - 30, 30);
  // 斜索（從塔頂放射出去）
  c.strokeStyle = 'rgba(70,68,66,0.55)';
  c.lineWidth = 1;
  for (let k = 1; k <= 5; k += 1) {
    for (const s of [-1, 1]) {
      c.beginPath();
      c.moveTo(tx + s * 12, top + 10);
      c.lineTo(tx + s * (14 + k * 11), deck - 2);
      c.stroke();
    }
  }
  // 橋塔
  px(c, 'rgba(0,0,0,0.2)', tx - 22, base - 2, 44, 4);
  px(c, '#a8987e', tx - 21, base - 12, 42, 12);
  px(c, '#bfae92', tx - 18, top, 36, base - 12 - top);
  px(c, 'rgba(255,255,255,0.18)', tx - 18, top, 3, base - 12 - top);
  px(c, 'rgba(0,0,0,0.16)', tx + 12, top, 6, base - 12 - top);
  for (let y = top + 6; y < base - 12; y += 6) px(c, 'rgba(0,0,0,0.08)', tx - 18, y, 36, 1);
  px(c, '#a8987e', tx - 20, top - 3, 40, 5);
  px(c, '#cdbda2', tx - 20, top - 3, 40, 1);
  // 兩個哥德式尖拱
  for (const ax of [tx - 11, tx + 3]) {
    c.fillStyle = '#6f93ad';
    c.beginPath();
    c.moveTo(ax, deck + 6);
    c.lineTo(ax, top + 24);
    c.lineTo(ax + 4, top + 14);
    c.lineTo(ax + 8, top + 24);
    c.lineTo(ax + 8, deck + 6);
    c.fill();
    px(c, '#4a4440', ax, deck - 2, 8, 6);
  }
  if (d.night) {
    for (const pts of [westPts, eastPts]) for (let i = 0; i < pts.length; i += 2) {
      const p = pts[i];
      if (p) px(c, '#fff6d8', Math.round(p[0]) - 1, Math.round(p[1]) - 1, 2, 2);
    }
    glow(c, tx, top + 30, 40, '255, 220, 160', 0.35);
  }
  c.restore();
}

// 渡輪（橘色，往西開）、帆船
function drawBoats(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, NY.sea * T - 30, W, H - NY.sea * T + 30);
  c.clip();
  const span = W + 200;
  const x = W + 100 - ((d.seconds * 9) % span);
  const y = 44.0 * T;
  px(c, 'rgba(0,0,0,0.2)', x - 40, y + 1, 80, 3);
  px(c, '#e8742a', x - 40, y - 8, 80, 9);
  px(c, '#c85a1a', x - 40, y - 1, 80, 2);
  px(c, '#f4f6f8', x - 32, y - 15, 64, 7);
  for (let k = -28; k < 28; k += 6) px(c, '#3a4a5a', x + k, y - 13, 4, 3);
  px(c, '#e8742a', x - 22, y - 20, 44, 5);
  px(c, '#f4f6f8', x - 2, y - 26, 6, 6);
  const sx = ((d.seconds * 4) % span) - 60;
  const sy = 46.5 * T;
  px(c, '#f4f6f8', sx - 10, sy - 4, 20, 4);
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.moveTo(sx, sy - 5);
  c.lineTo(sx, sy - 24);
  c.lineTo(sx + 11, sy - 5);
  c.fill();
  c.restore();
}

// ── 擺設的位置 ──
const NORTH_TREES: [number, number, number][] = [];
for (let x = 0.8, k = 0; x < NY.W; x += 2.6, k += 1) {
  if (x > NY.channel.x0 - 0.8 && x < NY.channel.x1 + 0.8) continue;
  NORTH_TREES.push([x, k % 2 ? 6.6 : 6.2, 0.8]);
}
const PARK_TREES: [number, number, number][] = [
  ...NORTH_TREES,
  [2.5, 7.4, 1],
  [8.5, 7.5, 0.95],
  [14, 7.4, 1],
  [19.5, 7.5, 1],
  [23.4, 7.2, 0.9],
  [32.6, 7.2, 0.9],
  [37, 7.5, 1],
  [42.5, 7.4, 1],
  [47.5, 7.5, 0.95],
  [53.5, 7.4, 1],
  [2.2, 11.6, 1.05],
  [7.2, 10.6, 0.9],
  [53.8, 11.6, 1.05],
  [48.8, 10.6, 0.9],
];
const PARK_LAMPS: [number, number][] = [[8, 13.5], [20, 13.5], [36, 13.5], [48, 13.5], [11, 9.9], [45, 9.9]];
const CITY_LAMPS: [number, number][] = [[9.2, 31.6], [22.5, 31.6], [33.5, 31.6], [46.8, 31.6], [1, 18.3], [16, 18.3], [40, 18.3], [55, 18.3], [22.6, 40.2], [44.6, 40.2], [6, 41.2], [15, 41.2]];
const STREET_TREES: [number, number][] = [[23.5, 37.6], [30.5, 37.6], [36.8, 37.6], [49, 37.6], [53.5, 37.6]];
const BISTROS: [number, number][] = [[13.5, 27.4], [20.5, 27.2], [35.5, 27.2], [42.5, 28.2], [12.5, 30.4]];
const HOTDOG = { x: 43, y: 38.4 };

function drawSeat(): void {
  // 紅色階梯畫在地面、長椅是擺設，座位不用另外畫家具
}

const props: CityProp[] = [
  { y: 0.5, draw: (c, d) => drawSkyline(c, d) },
  ...PARK_TREES.map(([x, y, s]): CityProp => ({ y, draw: (c) => drawParkTree(c, x, y, s) })),
  { y: NY.bridge.y, draw: (c) => drawBowBridge(c) },
  { y: NY.pool.y0 + 0.5, draw: (c, d) => drawPondLife(c, d) },
  { y: 9.1, draw: (c, d) => drawDogWalker(c, d) },
  ...POND_BENCHES.map((x): CityProp => ({ y: POND_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, POND_BENCH_Y, 2.6) })),
  ...PARK_LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawParkLamp(c, x, y, d.night) })),
  { y: 14.55, draw: (c, d) => drawCarriage(c, d) },
  ...LANES.map((lane): CityProp => ({ y: lane.y, draw: (c, d) => drawLane(c, lane, d) })),
  ...TOWERS.map((b): CityProp => ({ y: b.base, draw: (c, d) => drawTower(c, b, d) })),
  { y: 31.25, draw: (c, d) => drawTicketBooth(c, d) },
  { y: NY.cart.y, draw: (c, d) => drawNyCart(c, NY.cart.x, NY.cart.y, 'PRETZELS', '#d4502a', '#f4f1e8', d, 42, true) },
  { y: HOTDOG.y, draw: (c, d) => drawNyCart(c, HOTDOG.x, HOTDOG.y, 'HOT DOGS', '#c8102e', '#f6c945', d, 17, false) },
  { y: NY.subway.y, draw: (c, d) => drawSubway(c, d) },
  ...BISTROS.map(([x, y]): CityProp => ({ y, draw: (c) => drawBistro(c, x, y) })),
  ...CITY_LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawCityLamp(c, x, y, d.night) })),
  ...[0, 1, 2, 3].map((k): CityProp => ({ y: NY.brown.line + 0.8, draw: (c) => blit(c, brownstoneSprite(k), k * BROWN_W * T, (NY.brown.line + 0.8) * T) })),
  ...STREET_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawParkTree(c, x, y, 0.8) })),
  ...HARBOR_BENCHES.map((x): CityProp => ({ y: HARBOR_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, HARBOR_BENCH_Y, 2.6) })),
  // 遠景（水上的東西）：排在水邊的人前面先畫，人走過去不會被擋住
  { y: 34.8, draw: (c, d) => drawBoats(c, d) },
  { y: 34.9, draw: (c, d) => drawLiberty(c, d) },
  { y: 35.0, draw: (c, d) => drawBrooklynBridge(c, d) },
];

// ── 擋路 ──
const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, NY.W, 7.7),
  // 公園的矮牆
  r(0, NY.wall - 0.25, NY.gaps[0]?.[0] ?? 9, NY.wall + 0.1),
  r(NY.gaps[0]?.[1] ?? 12, NY.wall - 0.25, NY.gaps[1]?.[0] ?? 44, NY.wall + 0.1),
  r(NY.gaps[1]?.[1] ?? 47, NY.wall - 0.25, NY.W, NY.wall + 0.1),
  // 時代廣場北邊那排、東西兩側的大樓
  r(0, NY.road1.y1 + 0.8, NY.gaps[0]?.[0] ?? 9, NY.north - 0.05),
  r(NY.gaps[0]?.[1] ?? 12, NY.road1.y1 + 0.8, NY.gaps[1]?.[0] ?? 44, NY.north - 0.05),
  r(NY.gaps[1]?.[1] ?? 47, NY.road1.y1 + 0.8, NY.W, NY.north - 0.05),
  r(0, NY.north - 0.1, NY.flank.w, NY.flank.line - 0.05),
  r(NY.W - NY.flank.w, NY.north - 0.1, NY.W, NY.flank.line - 0.05),
  r(NY.steps.x0, NY.steps.y1 + 0.02, NY.steps.x1, 31.25),
  r(NY.cart.x - 1.2, NY.cart.y - 0.8, NY.cart.x + 1.2, NY.cart.y - 0.05),
  r(HOTDOG.x - 1.2, HOTDOG.y - 0.8, HOTDOG.x + 1.2, HOTDOG.y - 0.05),
  r(NY.subway.x - 1.45, NY.subway.y - 1.1, NY.subway.x + 1.45, NY.subway.y - 0.05),
  ...BISTROS.map(([x, y]) => r(x - 0.5, y - 0.4, x + 0.5, y)),
  // 褐石公寓、水邊的花圃、欄杆和水
  r(0, NY.road2.y1, NY.brown.x1, NY.brown.line + 0.75),
  r(46, 40.2, NY.W, NY.rail),
  r(0, NY.rail, NY.W, NY.H),
  ...POND_BENCHES.map((x) => r(x - 1.3, POND_BENCH_Y - 0.75, x + 1.3, POND_BENCH_Y - 0.45)),
  ...HARBOR_BENCHES.map((x) => r(x - 1.3, HARBOR_BENCH_Y - 0.75, x + 1.3, HARBOR_BENCH_Y - 0.45)),
  ...PARK_TREES.filter(([, y]) => y > 7.7).map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...STREET_TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...[...PARK_LAMPS, ...CITY_LAMPS].map(([x, y]) => r(x - 0.15, y - 0.2, x + 0.2, y + 0.05)),
];

// 湖（圓角的長條＋往北伸的那段；弓橋上可以走）
function blocked(x: number, y: number): boolean {
  const p = NY.pool;
  const ch = NY.channel;
  if (x > ch.x0 && x < ch.x1 && y > ch.y0 && y <= p.y0 + 0.2) return !(y > 8.05 && y < 8.95);
  if (x > p.x0 && x < p.x1 && y > p.y0 && y < p.y1) {
    const rr = 1.25;
    const ex = x < p.x0 + rr ? p.x0 + rr - x : x > p.x1 - rr ? x - (p.x1 - rr) : 0;
    const ey = y < p.y0 + rr ? p.y0 + rr - y : y > p.y1 - rr ? y - (p.y1 - rr) : 0;
    return ex * ex + ey * ey < rr * rr;
  }
  return false;
}

// ── 晚上的燈 ──
const screenLights: CityDef['lights'] = TOWERS.flatMap((b) => {
  const top = b.base * T - b.h;
  const cols = ['rgba(255, 90, 140, 0.55)', 'rgba(90, 200, 255, 0.55)', 'rgba(255, 220, 90, 0.5)', 'rgba(160, 110, 255, 0.5)'];
  return b.screens.map((s) => ({ x: b.x0 * T + s.x + s.w / 2, y: top + s.y + s.h / 2, r: Math.max(s.w, s.h) * 0.75, color: cols[s.seed % cols.length] ?? 'rgba(255, 220, 90, 0.5)' }));
});
const rawLights: CityDef['lights'] = [
  ...screenLights,
  ...PARK_LAMPS.map(([x, y]) => ({ x: x * T + 1, y: y * T - 29, r: 30 })),
  ...CITY_LAMPS.map(([x, y]) => ({ x: x * T - 4, y: y * T - 27, r: 34 })),
  { x: ESB_X, y: 22, r: 22, color: 'rgba(255, 240, 210, 0.55)' },
  { x: CHRYSLER_X, y: 24, r: 22, color: 'rgba(230, 240, 255, 0.5)' },
  { x: W * 0.3, y: SKY_BOTTOM - 20, r: 140, color: 'rgba(255, 200, 120, 0.18)' },
  { x: W * 0.75, y: SKY_BOTTOM - 20, r: 140, color: 'rgba(255, 200, 120, 0.18)' },
  ...[27.2, 28.6, 30].map((y) => ({ x: 28 * T, y: y * T, r: 70, color: 'rgba(255, 60, 50, 0.45)' })),
  { x: NY.subway.x * T, y: NY.subway.y * T - 40, r: 40, color: 'rgba(120, 255, 150, 0.4)' },
  { x: NY.cart.x * T, y: NY.cart.y * T - 14, r: 40, color: 'rgba(255, 190, 120, 0.5)' },
  { x: HOTDOG.x * T, y: HOTDOG.y * T - 14, r: 40, color: 'rgba(255, 190, 120, 0.5)' },
  { x: 4.25 * T, y: 31.2 * T, r: 60, color: 'rgba(255, 200, 130, 0.5)' },
  { x: 51.75 * T, y: 31.2 * T, r: 60, color: 'rgba(255, 200, 130, 0.5)' },
  { x: 18 * T, y: 23.8 * T, r: 70, color: 'rgba(255, 220, 140, 0.45)' },
  { x: 38 * T, y: 23.8 * T, r: 70, color: 'rgba(255, 220, 140, 0.45)' },
  ...[0, 1, 2, 3].map((k) => ({ x: (k + 0.5) * BROWN_W * T, y: 37.4 * T, r: 40, color: 'rgba(255, 200, 120, 0.4)' })),
  { x: NY.liberty.x * T, y: NY.liberty.y * T - 42, r: 60, color: 'rgba(150, 255, 220, 0.3)' },
  { x: NY.liberty.x * T - 6, y: NY.liberty.y * T - 82, r: 30, color: 'rgba(255, 200, 90, 0.6)' },
  { x: NY.bridgeTower.x * T, y: NY.bridgeTower.y * T - 50, r: 70, color: 'rgba(255, 220, 160, 0.35)' },
];
// 光暈不要超出地圖邊緣
const lights: CityDef['lights'] = rawLights.map((l) => ({ ...l, r: Math.max(10, Math.min(l.r, l.x, W - l.x, l.y, H - l.y)) }));

export const NEWYORK: CityDef = {
  id: 'newyork',
  country: 'us',
  line: 'flight',
  W: NY.W,
  H: NY.H,
  title: { 'zh-TW': '紐約 · 時代廣場與中央公園', 'en-US': 'New York · Times Square & Central Park' },
  stop: { 'zh-TW': '紐約（JFK 機場）', 'en-US': 'New York (JFK)' },
  emoji: '🗽',
  station: {
    x: NY.subway.x,
    y: NY.subway.y + 0.6,
    name: { 'zh-TW': '地鐵 往 JFK 機場', 'en-US': 'Subway (to JFK)' },
    arrive: { x: NY.subway.x - 2.6, y: NY.subway.y + 0.9 },
  },
  background: '#b7b4ae',
  soundscape: 'city',
  paintGround: paintNewYorkGround,
  props,
  solid,
  blocked,
  seats: NEWYORK_SEATS,
  drawSeat: () => drawSeat(),
  shops: NEWYORK_SHOPS,
  infos: [
    {
      at: r(12, 17, 44, NY.north),
      title: { 'zh-TW': '時代廣場', 'en-US': 'Times Square' },
      text: {
        'zh-TW': '1904 年《紐約時報》搬到這裡，廣場就改名叫時代廣場；1907 年起每年跨年在頂樓降下水晶球。這一帶的法規要求大樓掛大型看板，所以白天晚上都亮晃晃。2009 年起百老匯大道這段改成行人徒步區。地圖上的看板內容都是自己編的。',
        'en-US': 'Renamed Times Square in 1904 when The New York Times moved here; the New Year’s Eve ball has dropped from the tower since 1907. Zoning actually requires big illuminated signs, so it glows day and night. This stretch of Broadway became a pedestrian plaza in 2009. The ads on this map are made up.',
      },
    },
    {
      at: r(NY.steps.x0, NY.steps.y0, NY.steps.x1, 31.3),
      title: { 'zh-TW': '紅色階梯（TKTS 售票亭）', 'en-US': 'The Red Steps (TKTS booth)' },
      text: {
        'zh-TW': '1973 年起這裡賣當天的百老匯折扣票。2008 年改建成發光的紅色玻璃階梯，階梯下面是售票亭，上面成了大家坐著看廣場、看看板的地方。',
        'en-US': 'Since 1973 this spot has sold same-day discount Broadway tickets. In 2008 it was rebuilt as glowing red glass steps — the booth sits underneath, and the steps became everyone’s seat for watching the square.',
      },
    },
    {
      at: r(NY.channel.x0 - 2, 6, NY.channel.x1 + 2, NY.pool.y1),
      title: { 'zh-TW': '中央公園與弓橋', 'en-US': 'Central Park & Bow Bridge' },
      text: {
        'zh-TW': '中央公園由歐姆斯德和沃克斯設計，1858 年開始對外開放，面積約 341 公頃。弓橋是 1862 年完工的鑄鐵橋，跨在公園的湖（The Lake）上，湖上可以划船。實際上湖在公園中段，這裡把它畫在公園南邊。',
        'en-US': 'Designed by Olmsted and Vaux, Central Park began opening in 1858 and covers about 341 hectares. Bow Bridge, a cast-iron span finished in 1862, crosses The Lake, where you can rent rowboats. In reality the Lake is mid-park; here it sits by the south edge.',
      },
    },
    {
      at: r(14, 0.5, 42, 4.6),
      title: { 'zh-TW': '帝國大廈與克萊斯勒大廈', 'en-US': 'Empire State & Chrysler Buildings' },
      text: {
        'zh-TW': '帝國大廈 1931 年完工，102 層、連天線約 443 公尺，頂樓的燈會配合節日換顏色。克萊斯勒大廈 1930 年完工，不鏽鋼的裝飾藝術風尖頂上有一層層三角窗。兩棟其實都在中央公園南邊的中城，這裡當成遠景畫在北邊。',
        'en-US': 'The Empire State Building (1931) has 102 floors and reaches about 443 m with its antenna; its top lights change colour for holidays. The Chrysler Building (1930) wears an Art Deco stainless-steel crown of stacked triangular windows. Both actually stand in Midtown, south of the park — here they’re a backdrop to the north.',
      },
    },
    {
      at: r(NY.liberty.x - 2.5, 38.8, NY.liberty.x + 2.5, NY.H),
      title: { 'zh-TW': '自由女神像', 'en-US': 'Statue of Liberty' },
      text: {
        'zh-TW': '法國送給美國的禮物，1886 年落成，雕塑家是巴托迪，內部鐵骨由艾菲爾設計。銅皮氧化後變成綠色，連基座約 93 公尺，站在紐約港的自由島上。實際上從曼哈頓南端看過去要小很多，這裡畫得比較近。',
        'en-US': 'A gift from France dedicated in 1886, sculpted by Bartholdi with an iron frame by Eiffel. Its copper skin turned green with patina; with the pedestal it stands about 93 m on Liberty Island in New York Harbor. From Manhattan it looks much smaller — it’s drawn closer here.',
      },
    },
    {
      at: r(40, 38.5, NY.W, NY.H),
      title: { 'zh-TW': '布魯克林大橋', 'en-US': 'Brooklyn Bridge' },
      text: {
        'zh-TW': '1883 年通車，連接曼哈頓和布魯克林。花崗岩橋塔上有哥德式尖拱，鋼索像蜘蛛網一樣放射出去，通車時是世界上最長的吊橋。這裡只畫了一座橋塔和一段橋面。',
        'en-US': 'Opened in 1883 between Manhattan and Brooklyn. Its granite towers have Gothic pointed arches and its steel cables fan out like a web; it was the world’s longest suspension bridge when it opened. Only one tower and part of the span are shown here.',
      },
    },
    {
      at: r(0, NY.road2.y1, NY.brown.x1, NY.brown.line + 0.8),
      title: { 'zh-TW': '褐石公寓', 'en-US': 'Brownstones' },
      text: {
        'zh-TW': '19 世紀紐約常見的連棟住宅，外牆貼著褐色砂岩。一樓墊高，門口有高高的階梯（stoop），夏天鄰居常坐在階梯上聊天；旁邊半地下的那層叫花園層。',
        'en-US': 'Nineteenth-century row houses faced with brown sandstone. The raised parlour floor is reached by a tall stoop — where neighbours sit and chat in summer — above a half-sunken garden level.',
      },
    },
  ],
  labels: [
    { x: 28, y: 33.2, text: { 'zh-TW': '🎭 時代廣場紅階梯（坐下專注）', 'en-US': '🎭 Times Square red steps (sit & focus)' }, color: '#fca5a5' },
    { x: 28, y: 13.55, text: { 'zh-TW': '🌳 中央公園 · 湖邊長椅', 'en-US': '🌳 Central Park · lakeside benches' }, color: '#bbf7d0' },
    { x: 33.5, y: 38.4, text: { 'zh-TW': '🗽 水邊長椅看自由女神', 'en-US': '🗽 Harbour benches · Statue of Liberty' }, color: '#bae6fd' },
  ],
  walkers: [
    { x0: 1, y0: 9.0, x1: 23, y1: 9.0, count: 2 },
    { x0: 20, y0: 8.5, x1: 36, y1: 8.5, count: 1 },
    { x0: 1, y0: 14.2, x1: 55, y1: 14.2, count: 3 },
    { x0: 1, y0: 18.0, x1: 55, y1: 18.0, count: 4 },
    { x0: 10.5, y0: 18.4, x1: 10.5, y1: 32.6, count: 2 },
    { x0: 45.5, y0: 18.4, x1: 45.5, y1: 32.6, count: 2 },
    { x0: 9, y0: 25.7, x1: 47, y1: 25.7, count: 5 },
    { x0: 14, y0: 29, x1: 23.5, y1: 29, count: 2 },
    { x0: 32.5, y0: 30.4, x1: 36, y1: 30.4, count: 1 },
    { x0: 1, y0: 32.7, x1: 55, y1: 32.7, count: 5 },
    { x0: 0.8, y0: 40.9, x1: 21, y1: 40.9, count: 2 },
    { x0: 22, y0: 39.6, x1: 45.5, y1: 39.6, count: 3 },
    { x0: 22, y0: 36.4, x1: 55, y1: 36.4, count: 2 },
  ],
  // 車流用自己畫的黃色計程車（共用的車流以機車為主，不像紐約）
  traffic: [],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點時代廣場的紅階梯、中央公園湖邊或水邊的長椅坐下專注 · 走到店前買披薩、貝果、起司蛋糕、椒鹽卷餅 · 點地標看介紹 · 地鐵站搭到 JFK 飛去其他美國城市或回台灣',
    'en-US': 'WASD / arrows to move · click the Times Square red steps or a lakeside / harbour bench to focus · walk up to shops for pizza, bagels, cheesecake and pretzels · click landmarks for info · take the subway to JFK for other US cities or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點紅階梯或長椅坐下專注 · 走到店前買東西 · 點地標看介紹 · 地鐵站往 JFK',
    'en-US': 'Tap the red steps or a bench to focus · visit the shops · tap landmarks · subway to JFK',
  },
};
