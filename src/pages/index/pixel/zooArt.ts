// 臺北市立動物園的美術：各展區的地面（冰原、竹林草地、尤加利林、火鶴池、臺灣山林、熱帶雨林、非洲草原）、
// 場館建築、圍欄、所有動物（側面像素畫，會走路、會擺動）、入口大門、文湖線動物園站、腳踏車出租。
import { ZOO, type Animal, type ExhibitId, type Rect } from './zoo';
import { px, seeded } from './pixelUtil';

const T = 16;
const FONT_TC = '"PingFang TC", "Noto Sans TC", sans-serif';

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

const R = (r: Rect) => ({ x: r.x0 * T, y: r.y0 * T, w: (r.x1 - r.x0) * T, h: (r.y1 - r.y0) * T });

function blob(c: CanvasRenderingContext2D, color: string, r: Rect, inset = 0): void {
  const b = R(r);
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(b.x + b.w / 2, b.y + b.h / 2, b.w / 2 - inset, b.h / 2 - inset, 0, 0, Math.PI * 2);
  c.fill();
}

function water(c: CanvasRenderingContext2D, r: Rect, deep: string, light: string, rim: string): void {
  blob(c, rim, r);
  blob(c, deep, r, 3);
  const b = R(r);
  for (let k = 0; k < 6; k += 1) px(c, light, Math.round(b.x + b.w * (0.2 + (k % 3) * 0.22)), Math.round(b.y + b.h * (0.3 + Math.floor(k / 3) * 0.3)), 6, 1);
}

function rocks(c: CanvasRenderingContext2D, r: Rect, base: string, light: string, seed: number): void {
  const rand = seeded(seed);
  const b = R(r);
  for (let k = 0; k < 7; k += 1) {
    const w = 14 + rand() * 18;
    const h = 8 + rand() * 10;
    const x = b.x + rand() * (b.w - w);
    const y = b.y + rand() * (b.h - h);
    c.fillStyle = base;
    c.beginPath();
    c.ellipse(x + w / 2, y + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    c.fill();
    px(c, light, Math.round(x + w * 0.25), Math.round(y + 2), Math.round(w * 0.4), 2);
  }
}

// ── 地面（畫一次）──
export function paintZooGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1914);
  const W = ZOO.W * T;
  const H = ZOO.H * T;
  // 整片草地
  px(c, '#6ea552', 0, 0, W, H);
  for (let i = 0; i < 4200; i += 1) px(c, rand() < 0.5 ? '#7db35f' : '#5f9446', Math.floor(rand() * W), Math.floor(rand() * H), 2, 1);
  // 步道：米色地磚（上、下兩條橫的，展區之間、兩側直的）
  const path = (x0: number, y0: number, x1: number, y1: number) => {
    px(c, '#d9c9a3', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let y = y0 * T; y < y1 * T; y += 8) for (let x = x0 * T + ((y / 8) % 2) * 4; x < x1 * T; x += 8) px(c, '#cdbb93', x, y, 7, 7);
  };
  path(0, ZOO.upperPath.y0, ZOO.W, ZOO.upperPath.y1);
  path(0, ZOO.lowerPath.y0, ZOO.W, ZOO.lowerPath.y1);
  path(0, 0, 2, ZOO.H);
  path(ZOO.W - 2, 0, ZOO.W, ZOO.H);
  path(18, ZOO.upperPath.y1, 21, ZOO.lowerPath.y0);
  path(38, ZOO.upperPath.y1, 41, ZOO.lowerPath.y0);
  path(14, 0, 16, ZOO.upperPath.y0);
  path(31, 0, 33, ZOO.upperPath.y0);
  path(43, 0, 45, ZOO.upperPath.y0);
  // 入口廣場：紅磚
  const py = ZOO.lowerPath.y1;
  px(c, '#b8664a', 0, py * T, W, H - py * T);
  for (let y = py * T; y < H; y += 6) for (let x = (y / 6) % 2 === 0 ? 0 : 6; x < W; x += 12) px(c, '#a85a40', x, y, 11, 5);
  // 花圃
  for (const [fx, fy] of [
    [19, 36.2],
    [37, 36.2],
    [27, 41.4],
  ] as const) {
    c.fillStyle = '#4f8a3c';
    c.beginPath();
    c.ellipse(fx * T, fy * T, 34, 14, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 26; k += 1) px(c, ['#ff6fb5', '#ffd23f', '#ff8a3b', '#ffffff'][k % 4] ?? '#ff6fb5', Math.round(fx * T - 28 + rand() * 56), Math.round(fy * T - 10 + rand() * 20), 2, 2);
  }
  // 動物園站前的廣場
  const st = ZOO.station;
  px(c, '#8f8a86', (st.x0 - 0.6) * T, (st.y1 - 0.2) * T, (st.x1 - st.x0 + 1.2) * T, 2.4 * T);
  for (let x = (st.x0 - 0.6) * T; x < (st.x1 + 0.6) * T; x += 8) px(c, '#9a9590', x, (st.y1 - 0.2) * T, 1, 2.4 * T);

  const e = ZOO.exhibits;
  // 企鵝館：冰原、雪堆、前面一池冷冷的水
  {
    const b = R(e.penguin);
    px(c, '#e3f1f8', b.x, b.y, b.w, b.h);
    for (let i = 0; i < 160; i += 1) px(c, rand() < 0.5 ? '#f4fbff' : '#cfe4ef', Math.round(b.x + rand() * b.w), Math.round(b.y + rand() * b.h), 3, 1);
    const wy = ZOO.penguinWaterY * T;
    px(c, '#2f7fc2', b.x, wy, b.w, b.y + b.h - wy);
    for (let y = wy + 3; y < b.y + b.h; y += 4) px(c, y % 8 === 0 ? '#3a8fd0' : '#2a74b2', b.x, y, b.w, 1);
    px(c, '#ffffff', b.x, wy - 2, b.w, 3);
    rocks(c, { x0: 2.4, y0: 5.4, x1: 6, y1: 7 }, '#c9dbe6', '#ffffff', 11);
    rocks(c, { x0: 9.8, y0: 5.4, x1: 13.6, y1: 6.8 }, '#c9dbe6', '#ffffff', 12);
  }
  // 大貓熊館：深綠草地、小水池、竹子在動態那邊畫
  {
    const b = R(e.panda);
    px(c, '#5c9a48', b.x, b.y, b.w, b.h);
    for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#6aab55' : '#4f8a3c', Math.round(b.x + rand() * b.w), Math.round(b.y + rand() * b.h), 2, 1);
    water(c, ZOO.pandaPond, '#3a9ad0', '#9fd8ff', '#8a7a6a');
    rocks(c, { x0: 17, y0: 5.4, x1: 20, y1: 7 }, '#8a8680', '#a8a49c', 13);
  }
  // 無尾熊館：落葉地＋木屑
  {
    const b = R(e.koala);
    px(c, '#9a8a5a', b.x, b.y, b.w, b.h);
    for (let i = 0; i < 200; i += 1) px(c, rand() < 0.5 ? '#a89868' : '#8a7a4c', Math.round(b.x + rand() * b.w), Math.round(b.y + rand() * b.h), 2, 2);
  }
  // 火鶴池
  {
    const b = R(e.flamingo);
    px(c, '#7aa85a', b.x, b.y, b.w, b.h);
    water(c, ZOO.flamingoPond, '#4aa8c8', '#bfeaff', '#c9b88a');
    for (let k = 0; k < 14; k += 1) {
      const rx = b.x + 4 + rand() * (b.w - 8);
      const ry = b.y + 4 + rand() * 18;
      for (let j = 0; j < 3; j += 1) px(c, '#4f8a3c', Math.round(rx + j * 2), Math.round(ry - j), 1, 6);
    }
  }
  // 臺灣動物區：山林落葉、黑熊的洞、獼猴的岩石堆
  {
    const b = R(e.taiwan);
    px(c, '#5a7a3a', b.x, b.y, b.w, b.h);
    for (let i = 0; i < 300; i += 1) px(c, ['#6b8a45', '#4a6a30', '#8a7a4a'][Math.floor(rand() * 3)] ?? '#6b8a45', Math.round(b.x + rand() * b.w), Math.round(b.y + rand() * b.h), 2, 2);
    const d = R(ZOO.bearDen);
    c.fillStyle = '#6e6a62';
    c.beginPath();
    c.ellipse(d.x + d.w / 2, d.y + d.h / 2, d.w / 2, d.h / 2, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#1e1c1a';
    c.beginPath();
    c.ellipse(d.x + d.w / 2, d.y + d.h * 0.62, d.w * 0.22, d.h * 0.3, 0, 0, Math.PI * 2);
    c.fill();
    rocks(c, ZOO.monkeyRocks, '#8a8680', '#b5b0a6', 21);
  }
  // 亞洲熱帶雨林區：泥地、大象的水池、老虎的岩石
  {
    const b = R(e.rainforest);
    px(c, '#7a6a48', b.x, b.y, b.w, b.h);
    for (let i = 0; i < 300; i += 1) px(c, rand() < 0.5 ? '#8a7a55' : '#6a5a3a', Math.round(b.x + rand() * b.w), Math.round(b.y + rand() * b.h), 2, 2);
    water(c, ZOO.elephantPool, '#4a8ab0', '#a8d8f0', '#5a4a30');
    rocks(c, ZOO.tigerRock, '#8a7e6e', '#a89c8a', 31);
  }
  // 非洲動物區：乾草原、河馬池、獅子的岩石
  {
    const b = R(e.africa);
    px(c, '#c9b06a', b.x, b.y, b.w, b.h);
    for (let i = 0; i < 360; i += 1) px(c, rand() < 0.5 ? '#d9c07a' : '#b89c58', Math.round(b.x + rand() * b.w), Math.round(b.y + rand() * b.h), 1, 3);
    water(c, ZOO.hippoPond, '#5a7a6a', '#9ab8a8', '#7a6a4a');
    rocks(c, ZOO.lionRock, '#a89070', '#c9b08a', 41);
  }
}

// ── 展區後面的場館、圍欄 ──

// 場館建築（在展區最上面那一排），name 寫在招牌上
function house(c: CanvasRenderingContext2D, r: Rect, wall: string, roof: string, trim: string, name: string, sub: string): void {
  const b = R(r);
  const top = b.y + 4;
  const h = 2.6 * T;
  px(c, 'rgba(0,0,0,0.25)', b.x + 2, top + h, b.w - 2, 4);
  px(c, wall, b.x, top, b.w, h);
  for (let x = b.x + 8; x < b.x + b.w - 8; x += 18) {
    px(c, '#2a3040', x, top + 14, 10, 18);
    px(c, 'rgba(160,210,255,0.35)', x + 1, top + 15, 4, 16);
  }
  px(c, roof, b.x - 4, top - 10, b.w + 8, 12);
  px(c, trim, b.x - 4, top - 10, b.w + 8, 2);
  px(c, 'rgba(0,0,0,0.25)', b.x - 4, top + 1, b.w + 8, 1);
  const sw = Math.min(b.w - 20, 76);
  px(c, '#15171f', b.x + b.w / 2 - sw / 2 - 1, top - 4, sw + 2, 14);
  px(c, trim, b.x + b.w / 2 - sw / 2, top - 3, sw, 12);
  text(c, name, b.x + b.w / 2, top + 2.5, '#ffffff', `900 8px ${FONT_TC}`);
  text(c, sub, b.x + b.w / 2, top + 20, 'rgba(255,255,255,0.85)', '700 5px system-ui, sans-serif');
}

export function drawExhibitHouse(c: CanvasRenderingContext2D, id: ExhibitId): void {
  const e = ZOO.exhibits;
  if (id === 'penguin') {
    // 企鵝館：冰山壁畫的室內牆
    const b = R(e.penguin);
    px(c, '#9fd0ea', b.x, b.y, b.w, 3 * T);
    c.fillStyle = '#ffffff';
    for (const [ix, iw, ih] of [
      [0.08, 40, 26],
      [0.42, 56, 34],
      [0.78, 36, 22],
    ] as const) {
      const x = b.x + b.w * ix;
      c.beginPath();
      c.moveTo(x, b.y + 3 * T);
      c.lineTo(x + iw * 0.4, b.y + 3 * T - ih);
      c.lineTo(x + iw * 0.6, b.y + 3 * T - ih + 6);
      c.lineTo(x + iw, b.y + 3 * T);
      c.fill();
    }
    px(c, '#2f6fb5', b.x, b.y - 8, b.w, 9);
    px(c, '#9fd8ff', b.x, b.y - 8, b.w, 1);
    px(c, '#15171f', b.x + b.w / 2 - 34, b.y - 14, 68, 14);
    px(c, '#ffffff', b.x + b.w / 2 - 33, b.y - 13, 66, 12);
    text(c, '企鵝館 PENGUIN', b.x + b.w / 2, b.y - 6.5, '#1f4f8f', `900 7px ${FONT_TC}`);
    return;
  }
  if (id === 'panda') return house(c, { x0: 17, y0: 2, x1: 30, y1: 4.6 }, '#e8e0d0', '#2f7a5a', '#c62828', '大貓熊館', 'GIANT PANDA HOUSE');
  if (id === 'koala') return house(c, { x0: 33.6, y0: 2, x1: 42.4, y1: 4.6 }, '#d9c9a0', '#6a8a4a', '#4a7a3a', '無尾熊館', 'KOALA HOUSE');
  if (id === 'flamingo') return house(c, { x0: 46, y0: 2, x1: 52, y1: 4.4 }, '#e8e4dc', '#c46a8a', '#e86a8a', '鳥園', 'BIRD WORLD');
}

// 展區前面的欄杆（木柱＋橫桿，前面一排矮灌木）
export function drawFence(c: CanvasRenderingContext2D, r: Rect): void {
  const x0 = r.x0 * T;
  const x1 = r.x1 * T;
  const y = r.y1 * T;
  px(c, 'rgba(0,0,0,0.2)', x0, y, x1 - x0, 2);
  for (let x = x0; x <= x1 - 2; x += 10) px(c, '#7a5236', x, y - 10, 2, 10);
  px(c, '#9a6a43', x0, y - 9, x1 - x0, 2);
  px(c, '#9a6a43', x0, y - 4, x1 - x0, 2);
  px(c, '#b48a5c', x0, y - 9, x1 - x0, 1);
}

// 展區左右兩側和後面：一圈矮樹叢
export function paintExhibitHedges(c: CanvasRenderingContext2D): void {
  const rand = seeded(77);
  for (const r of Object.values(ZOO.exhibits)) {
    const b = R(r);
    for (const x of [b.x - 4, b.x + b.w - 4]) {
      for (let y = b.y; y < b.y + b.h - 6; y += 7) {
        px(c, '#3d7a3c', x, y, 8, 8);
        px(c, rand() < 0.5 ? '#4f9a4c' : '#357036', x + 1, y + 1, 5, 4);
      }
    }
  }
}

// 竹子（大貓熊館）、尤加利樹（無尾熊館）、熱帶雨林的大樹、非洲的金合歡
export function drawBamboo(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  for (let k = 0; k < 5; k += 1) {
    const sway = Math.round(Math.sin(seconds * 0.8 + k + x) * 1.2);
    const bx = cx - 8 + k * 4;
    const hgt = 30 + ((k * 7) % 12);
    px(c, k % 2 ? '#5aa85a' : '#4a9a4c', bx, by - hgt, 2, hgt);
    for (let j = 6; j < hgt; j += 8) px(c, '#2f6b3a', bx, by - j, 2, 1);
    px(c, '#7ac46a', bx + 1 + sway, by - hgt - 2, 5, 2);
    px(c, '#6fbf72', bx - 4 + sway, by - hgt + 4, 5, 2);
  }
}

export function drawEucalyptus(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 10, by - 1, 20, 3);
  px(c, '#c9c2b0', cx - 2, by - 52, 5, 52);
  px(c, '#e8e2d2', cx - 2, by - 52, 2, 52);
  px(c, '#b5ad98', cx + 2, by - 40, 6, 2);
  px(c, '#6a9a7a', cx - 14, by - 72, 30, 22);
  px(c, '#7aae8a', cx - 10, by - 76, 22, 10);
  px(c, '#58886a', cx - 14, by - 54, 12, 5);
  px(c, '#58886a', cx + 6, by - 56, 10, 5);
}

export function drawJungleTree(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 12, by - 1, 24, 3);
  px(c, '#5c3d22', cx - 3, by - 28, 6, 28);
  px(c, '#1f5a2c', cx - 18, by - 52, 36, 26);
  px(c, '#2a6e38', cx - 14, by - 58, 28, 14);
  px(c, '#3d8a48', cx - 8, by - 54, 10, 6);
  for (let k = 0; k < 3; k += 1) px(c, '#2f6b3a', cx - 12 + k * 10, by - 28, 1, 10 + k * 3);
}

export function drawAcacia(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 22, by - 1, 44, 3);
  px(c, '#6b4a2a', cx - 2, by - 34, 4, 34);
  px(c, '#6b4a2a', cx - 10, by - 36, 10, 2);
  px(c, '#6b4a2a', cx + 2, by - 38, 12, 2);
  px(c, '#5a7a2a', cx - 30, by - 46, 60, 9);
  px(c, '#6e8e34', cx - 26, by - 49, 52, 4);
}

export function drawTaiwanTree(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 9, by - 1, 18, 3);
  px(c, '#5c3d22', cx - 2, by - 18, 4, 18);
  px(c, '#2f5a2c', cx - 12, by - 38, 24, 22);
  px(c, '#3d7038', cx - 8, by - 42, 16, 8);
}

// 熊貓的木頭攀爬架
export function drawPandaFrame(c: CanvasRenderingContext2D): void {
  const b = R(ZOO.pandaFrame);
  px(c, 'rgba(0,0,0,0.2)', b.x + 2, b.y + b.h - 1, b.w, 3);
  for (const x of [b.x, b.x + b.w - 4]) px(c, '#7a5236', x, b.y - 4, 4, b.h + 4);
  px(c, '#9a6a43', b.x - 2, b.y + 6, b.w + 4, 6);
  px(c, '#b48a5c', b.x - 2, b.y + 6, b.w + 4, 1);
  for (let x = b.x + 6; x < b.x + b.w - 6; x += 8) px(c, '#7a5236', x, b.y + 6, 1, 6);
}

// 紅毛猩猩的高台：木柱、平台、垂下來的繩子
export function drawOrangutanTower(c: CanvasRenderingContext2D, seconds: number): void {
  const cx = Math.round(ZOO.orangutanTower.x * T);
  const by = Math.round(ZOO.orangutanTower.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 14, by - 1, 28, 3);
  px(c, '#6b4a2a', cx - 12, by - 40, 3, 40);
  px(c, '#6b4a2a', cx + 9, by - 40, 3, 40);
  px(c, '#8a6a43', cx - 15, by - 42, 30, 4);
  const sway = Math.sin(seconds * 1.2) * 4;
  c.strokeStyle = '#c9a66b';
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(cx + 12, by - 40);
  c.quadraticCurveTo(cx + 22 + sway, by - 24, cx + 20 + sway * 1.5, by - 10);
  c.stroke();
}

// ── 動物 ──
// 一律側面像素畫，(fx, fy) 是腳底中心（世界 px），dir 往右 1 往左 -1。p() 會依方向左右鏡像
type P = (color: string, dx: number, dy: number, w: number, h: number) => void;
function mirror(c: CanvasRenderingContext2D, fx: number, fy: number, dir: 1 | -1): P {
  return (color, dx, dy, w, h) => px(c, color, dir > 0 ? fx + dx : fx - dx - w, fy + dy, w, h);
}

function shadow(c: CanvasRenderingContext2D, fx: number, fy: number, w: number): void {
  px(c, 'rgba(0,0,0,0.2)', Math.round(fx - w / 2), fy - 1, w, 3);
}

// 熊貓（正面，大頭、八字眼圈、腮紅）
const PANDA_ROWS = [
  '....kkk......kkk....',
  '...kkkkk....kkkkk...',
  '...kkkwwwwwwwwkkk...',
  '...wwwwwwwwwwwwww...',
  '..wwwwwwwwwwwwwwww..',
  '..wwkkkwwwwwwkkkww..',
  '..wkkekkwwwwkkekkw..',
  '..wkkkkkwwwwkkkkkw..',
  '..wwkkkwwkkwwkkkww..',
  '..wpwwwwwwwwwwwwpw..',
  '...wwwwwwkkwwwwww...',
  '....wwwwwwwwwwww....',
  '...kkkwwwwwwwwkkk...',
  '..kkkkkwwwwwwkkkkk..',
  '..kkkkwwwwwwwwkkkk..',
  '...kkwwwwwwwwwwkk...',
  '...wwwwwwwwwwwwww...',
  '...gwwwwwwwwwwwwg...',
  '..kkkkwwwwwwwwkkkk..',
  '..kkpkkwwwwwwkkpkk..',
  '...kkk........kkk...',
];
const CUB_ROWS = [
  '.kk.....kk.',
  'kkkwwwwwkkk',
  '.wwwwwwwww.',
  'wwkkwwwkkww',
  'wkekwwwkekw',
  'wwkkwkwkkww',
  'wpwwwwwwwpw',
  '.wwwwwwwww.',
  '.kkwwwwwkk.',
  'kkkwwwwwkkk',
  '.wwwwwwwww.',
  '.kk.....kk.',
];
const PANDA_PALETTE: Record<string, string> = { k: '#2b2d33', w: '#f8f6f0', g: '#dcd8cf', p: '#f4a3a3', e: '#ffffff' };
const pandaCache = new Map<string, HTMLCanvasElement>();
function pandaSprite(kind: 'adult' | 'cub'): HTMLCanvasElement {
  const cached = pandaCache.get(kind);
  if (cached) return cached;
  const rows = kind === 'cub' ? CUB_ROWS : PANDA_ROWS;
  const canvas = document.createElement('canvas');
  canvas.width = rows[0]?.length ?? 0;
  canvas.height = rows.length;
  const c = canvas.getContext('2d');
  if (c) {
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        const color = PANDA_PALETTE[row[x] ?? '.'];
        if (color) px(c, color, x, y);
      }
    });
  }
  pandaCache.set(kind, canvas);
  return canvas;
}

export function drawAnimal(c: CanvasRenderingContext2D, an: Animal, x: number, y: number, dir: 1 | -1, moving: boolean, seconds: number): void {
  const fx = Math.round(x * T);
  const fy = Math.round(y * T);
  const p = mirror(c, fx, fy, dir);
  const t = seconds + an.phase * 10;
  const step = moving ? Math.floor(t * 4) % 2 : 0;
  const breathe = Math.floor(t * 1.2) % 2;
  switch (an.kind) {
    case 'kingPenguin': {
      // 國王企鵝：黑背、白肚、脖子一圈金黃、耳朵後面橘色、細長的嘴（下嘴有橘色）
      const tilt = moving ? (step ? 1 : -1) : 0;
      const q = mirror(c, fx + tilt, fy, dir);
      shadow(c, fx, fy, 10);
      q('#1d2230', -4, -17, 8, 16);
      q('#262c3c', -4, -17, 2, 14);
      q('#f4f1e8', 1, -13, 3, 11);
      q('#ffd27a', 1, -14, 3, 2);
      q('#f6a531', 2, -13, 2, 1);
      q('#1d2230', -3, -21, 7, 5);
      q('#f6a531', -1, -19, 2, 2);
      q('#ffd27a', 0, -18, 1, 1);
      q('#ffffff', 2, -20, 1, 1);
      q('#2b2d33', 4, -19, 4, 1);
      q('#f28a2e', 4, -18, 3, 1);
      q('#2b2d33', -3, -12, 2, 7 - (moving ? step : 0));
      q('#2b2d33', -2 + step, -1, 3, 1);
      q('#2b2d33', 1 - step, -1, 3, 1);
      break;
    }
    case 'gentoo': {
      // 巴布亞企鵝：比較矮、眼睛上方一塊白、橘紅色的嘴和腳
      const tilt = moving ? (step ? 1 : -1) : 0;
      const q = mirror(c, fx + tilt, fy, dir);
      shadow(c, fx, fy, 8);
      q('#22262f', -3, -12, 7, 11);
      q('#f4f1e8', 1, -9, 3, 8);
      q('#22262f', -3, -15, 6, 4);
      q('#ffffff', -1, -15, 3, 1);
      q('#2b2d33', 1, -14, 1, 1);
      q('#ff6a2b', 3, -13, 3, 1);
      q('#22262f', -3, -9, 2, 5);
      q('#ff8a3b', -2 + step, -1, 2, 1);
      q('#ff8a3b', 1 - step, -1, 2, 1);
      break;
    }
    case 'penguinSwim': {
      // 在水裡游：只看得到背和頭，後面拖一道水花
      p('rgba(255,255,255,0.55)', -12, -1, 5, 1);
      p('rgba(255,255,255,0.35)', -18, 0, 4, 1);
      p('#1d2230', -5, -3, 10, 3);
      p('#1d2230', 3, -5, 4, 3);
      p('#f28a2e', 7, -4, 2, 1);
      p('#ffffff', 5, -5, 1, 1);
      break;
    }
    case 'panda':
    case 'pandaCub': {
      const sprite = pandaSprite(an.kind === 'pandaCub' ? 'cub' : 'adult');
      const hop = moving ? Math.floor(t * 4) % 2 : 0;
      shadow(c, fx, fy, sprite.width - 2);
      c.drawImage(sprite, Math.round(fx - sprite.width / 2 + (moving ? (step ? 1 : -1) : 0)), fy - sprite.height - hop);
      break;
    }
    case 'pandaEat': {
      const sprite = pandaSprite('adult');
      const chew = Math.floor(t * 3) % 2;
      const left = fx - sprite.width / 2;
      const top = fy - sprite.height;
      shadow(c, fx, fy, sprite.width - 2);
      c.drawImage(sprite, left, top);
      px(c, '#57a862', left + 14, top + 6 - chew, 2, 15);
      px(c, '#2f6b3a', left + 14, top + 11 - chew, 2, 1);
      px(c, '#6fbf72', left + 16, top + 4 - chew, 3, 2);
      px(c, '#6fbf72', left + 11, top + 5 - chew, 3, 1);
      px(c, '#2b2d33', left + 12, top + 14, 5, 3);
      break;
    }
    case 'pandaSleep': {
      // 趴在木架上睡覺：白肚、黑手腳垂下來，頭上冒 Zzz
      p('#f8f6f0', -10, -9 + breathe, 20, 8 - breathe);
      p('#2b2d33', -4, -9 + breathe, 7, 4);
      p('#2b2d33', -10, -3, 4, 5);
      p('#2b2d33', 5, -3, 4, 5);
      p('#f8f6f0', 8, -11, 9, 8);
      p('#2b2d33', 8, -13, 3, 2);
      p('#2b2d33', 14, -13, 3, 2);
      p('#2b2d33', 9, -8, 3, 1);
      p('#2b2d33', 13, -8, 3, 1);
      p('#2b2d33', 12, -6, 1, 1);
      const z = (t * 0.5) % 1;
      text(c, 'z', fx + 14 + z * 6, fy - 16 - z * 10, `rgba(255,255,255,${1 - z})`, '700 6px system-ui, sans-serif');
      break;
    }
    case 'koala': {
      // 抱在樹幹上的無尾熊（臉朝外）：灰色圓身體、大毛耳朵、大黑鼻子
      // 每隻抱在不同高度
      const by = fy - 22 - Math.round(an.phase * 12) + breathe;
      px(c, '#8f949e', fx - 5, by - 10, 10, 11);
      px(c, '#a3a8b2', fx - 3, by - 8, 6, 7);
      px(c, '#7a7f89', fx - 7, by - 8, 3, 6);
      px(c, '#7a7f89', fx + 4, by - 8, 3, 6);
      px(c, '#9aa0aa', fx - 5, by - 18, 10, 8);
      px(c, '#b5bac3', fx - 8, by - 20, 4, 4);
      px(c, '#b5bac3', fx + 4, by - 20, 4, 4);
      px(c, '#f4f4f4', fx - 7, by - 19, 2, 2);
      px(c, '#f4f4f4', fx + 5, by - 19, 2, 2);
      px(c, '#2b2d33', fx - 1, by - 15, 3, 3);
      px(c, '#2b2d33', fx - 3, by - 16, 1, 1);
      px(c, '#2b2d33', fx + 3, by - 16, 1, 1);
      if (Math.floor(t * 0.4) % 3 === 0) px(c, '#58886a', fx + 2, by - 12, 4, 2);
      break;
    }
    case 'flamingo':
    case 'flamingoWalk': {
      // 火鶴：粉紅身體、S 形脖子、黑嘴尖；站著的時候縮一隻腳
      const standing = an.kind === 'flamingo';
      const nod = standing ? Math.round(Math.sin(t * 0.7)) : 0;
      if (standing) p('rgba(255,170,190,0.25)', -5, 1, 10, 2);
      p('#e86a8a', 0, -14, 1, 14);
      if (standing) {
        p('#e86a8a', -2, -16, 1, 4);
        p('#e86a8a', -2, -12, 3, 1);
      } else {
        p('#e86a8a', -3 + step * 2, -14, 1, 14);
      }
      p('#ff9ab5', -6, -21, 12, 7);
      p('#f2668b', -4, -20, 7, 3);
      p('#2b2d33', -7, -19, 2, 2);
      p('#ff9ab5', 4, -28 + nod, 2, 8);
      p('#ff9ab5', 5, -30 + nod, 3, 3);
      p('#2b2d33', 7, -29 + nod, 1, 1);
      p('#ffe0e8', 8, -29 + nod, 2, 1);
      p('#2b2d33', 9, -28 + nod, 1, 2);
      break;
    }
    case 'blackBear': {
      // 臺灣黑熊：全黑、胸前白色 V 字、咖啡色的嘴
      shadow(c, fx, fy, 20);
      p('#1b1b20', -9, -13, 17, 10);
      p('#26262c', -8, -13, 12, 2);
      p('#1b1b20', 6, -16, 8, 8);
      p('#1b1b20', 6, -18, 3, 3);
      p('#7a5c44', 12, -12, 4, 3);
      p('#2b2d33', 15, -12, 1, 1);
      p('#ffffff', 11, -14, 1, 1);
      p('#f4f1e8', 5, -9, 4, 1);
      p('#f4f1e8', 6, -8, 2, 1);
      for (const [lx, s] of [
        [-8, step],
        [-4, 1 - step],
        [2, 1 - step],
        [5, step],
      ] as const) p('#141418', lx, -4, 3, 4 - s);
      break;
    }
    case 'macaque': {
      if (!moving) {
        // 坐著的臺灣獼猴：咖啡色、紅臉、偶爾抓抓頭
        const scratch = Math.floor(t * 0.8) % 4 === 0;
        p('#8a6a48', -4, -9, 8, 8);
        p('#a8865c', -2, -7, 4, 5);
        p('#8a6a48', -3, -14, 7, 6);
        p('#e8968a', -1, -12, 4, 3);
        p('#2b2d33', 0, -12, 1, 1);
        p('#2b2d33', 2, -12, 1, 1);
        p('#6b4f34', -7, -3, 4, 1);
        if (scratch) p('#8a6a48', 3, -16, 2, 4);
      } else {
        shadow(c, fx, fy, 10);
        p('#8a6a48', -5, -8, 10, 5);
        p('#8a6a48', 4, -11, 5, 5);
        p('#e8968a', 7, -10, 2, 2);
        p('#6b4f34', -7, -9, 3, 1);
        for (const [lx, s] of [
          [-4, step],
          [-1, 1 - step],
          [2, step],
          [4, 1 - step],
        ] as const) p('#6b4f34', lx, -3, 1, 3 - s);
      }
      break;
    }
    case 'sikaDeer': {
      // 梅花鹿：栗色身體、白點、白屁股；站著的時候低頭吃草
      const graze = !moving && Math.floor(t * 0.5) % 3 !== 0;
      shadow(c, fx, fy, 16);
      p('#b8742e', -8, -13, 15, 7);
      p('#e8c89a', -6, -7, 11, 1);
      for (const [sx, sy] of [
        [-5, -12],
        [-1, -11],
        [3, -12],
        [-3, -9],
        [1, -9],
      ] as const) p('#f4ecd8', sx, sy, 1, 1);
      p('#ffffff', -9, -12, 2, 3);
      for (const [lx, s] of [
        [-7, step],
        [-4, 1 - step],
        [3, 1 - step],
        [5, step],
      ] as const) p('#7a4a20', lx, -6, 1, 6 - s);
      if (graze) {
        p('#b8742e', 6, -11, 3, 5);
        p('#b8742e', 7, -7, 4, 3);
        p('#2b2d33', 10, -5, 1, 1);
      } else {
        p('#b8742e', 5, -17, 3, 6);
        p('#b8742e', 6, -19, 6, 3);
        p('#2b2d33', 11, -18, 1, 1);
        p('#2b2d33', 8, -18, 1, 1);
        p('#d9c9a0', 6, -24, 1, 5);
        p('#d9c9a0', 8, -23, 1, 4);
        p('#d9c9a0', 5, -23, 1, 1);
      }
      break;
    }
    case 'elephant':
    case 'elephantCalf': {
      // 亞洲象：灰色、大耳朵、長鼻子會晃；小象是縮小版
      const s = an.kind === 'elephantCalf' ? 0.6 : 1;
      const k = (v: number) => Math.round(v * s);
      const trunk = Math.round(Math.sin(t * 1.5) * 2);
      shadow(c, fx, fy, k(28));
      p('#8f949e', k(-14), k(-22), k(26), k(16));
      p('#a3a8b2', k(-12), k(-22), k(18), k(3));
      p('#5c616b', k(-15), k(-19), 1, k(8));
      p('#8f949e', k(8), k(-25), k(10), k(13));
      p('#7a7f89', k(6), k(-23), k(6), k(11));
      p('#2b2d33', k(14), k(-20), 1, 1);
      p('#8f949e', k(15), k(-13), k(3), k(9));
      p('#8f949e', k(16) + (trunk > 0 ? 1 : 0), k(-4), k(3), k(3));
      if (s === 1) p('#f4f1e8', 14, -14, 2, 2);
      for (const [lx, st] of [
        [-12, step],
        [-7, 1 - step],
        [2, 1 - step],
        [7, step],
      ] as const) p('#7a7f89', k(lx), k(-7), k(4), k(7) - st);
      break;
    }
    case 'tiger': {
      // 馬來虎：橘色、黑條紋、白臉頰，尾巴一甩一甩
      const tail = Math.round(Math.sin(t * 2) * 2);
      shadow(c, fx, fy, 22);
      p('#f08a24', -11, -11, 20, 7);
      p('#f8e6c8', -9, -5, 15, 1);
      for (const sx of [-9, -6, -3, 0, 3]) p('#2b2d33', sx, -11, 1, 5);
      p('#f08a24', 7, -14, 7, 7);
      p('#f8e6c8', 10, -10, 4, 2);
      p('#f08a24', 7, -16, 2, 2);
      p('#2b2d33', 9, -13, 1, 2);
      p('#2b2d33', 11, -12, 1, 1);
      p('#2b2d33', 13, -9, 1, 1);
      p('#f08a24', -15, -11 + tail, 4, 1);
      p('#2b2d33', -16, -11 + tail, 1, 1);
      for (const [lx, st] of [
        [-10, step],
        [-6, 1 - step],
        [3, 1 - step],
        [6, step],
      ] as const) p('#d97a1e', lx, -4, 2, 4 - st);
      break;
    }
    case 'orangutan': {
      // 紅毛猩猩：蹲在高台上，長手臂拉著繩子
      const by = fy - 42;
      const swing = Math.round(Math.sin(t * 1.2) * 1);
      px(c, '#b5531f', fx - 6, by - 12, 12, 11);
      px(c, '#c96a2c', fx - 4, by - 11, 8, 4);
      px(c, '#b5531f', fx - 4, by - 18, 8, 7);
      px(c, '#6b3a28', fx - 3, by - 16, 6, 5);
      px(c, '#2b2d33', fx - 2, by - 15, 1, 1);
      px(c, '#2b2d33', fx + 1, by - 15, 1, 1);
      px(c, '#9a4418', fx + 5, by - 11 + swing, 7, 2);
      px(c, '#9a4418', fx - 9, by - 8, 3, 8);
      break;
    }
    case 'giraffe': {
      // 長頸鹿：長腿、長脖子一路斜上去、咖啡色網紋、頭上兩支角
      shadow(c, fx, fy, 22);
      for (const [lx, st] of [
        [-9, step],
        [-6, 1 - step],
        [4, 1 - step],
        [7, step],
      ] as const) p('#d9a040', lx, -16, 2, 16 - st);
      p('#e8b450', -11, -24, 21, 9);
      for (const [sx, sy] of [
        [-9, -23],
        [-4, -22],
        [1, -23],
        [5, -21],
        [-7, -19],
        [-1, -19],
      ] as const) p('#a8662a', sx, sy, 3, 2);
      p('#5c3d22', -12, -23, 1, 6);
      for (let k = 0; k < 6; k += 1) {
        p('#e8b450', 6 + k, -27 - k * 4, 4, 5);
        if (k % 2 === 0) p('#a8662a', 7 + k, -26 - k * 4, 2, 2);
      }
      p('#8a5a2a', 5, -44, 1, 16);
      p('#e8b450', 10, -51, 8, 5);
      p('#d9a040', 16, -49, 3, 3);
      p('#2b2d33', 13, -50, 1, 1);
      p('#6b4a2a', 11, -54, 1, 3);
      p('#6b4a2a', 13, -54, 1, 3);
      p('#e8b450', 9, -52, 2, 1);
      break;
    }
    case 'zebra': {
      // 斑馬：白底黑條紋、黑鬃毛、黑鼻子
      shadow(c, fx, fy, 18);
      p('#f4f4f0', -9, -14, 17, 8);
      for (let sx = -8; sx < 7; sx += 3) p('#2b2d33', sx, -14, 1, 7);
      for (const [lx, st] of [
        [-8, step],
        [-5, 1 - step],
        [3, 1 - step],
        [5, step],
      ] as const) {
        p('#f4f4f0', lx, -6, 2, 6 - st);
        p('#2b2d33', lx, -4, 2, 1);
      }
      p('#f4f4f0', 6, -19, 4, 8);
      p('#2b2d33', 7, -17, 3, 1);
      p('#2b2d33', 7, -14, 3, 1);
      p('#f4f4f0', 8, -20, 6, 4);
      p('#2b2d33', 13, -18, 2, 2);
      p('#2b2d33', 6, -21, 3, 2);
      p('#2b2d33', 10, -19, 1, 1);
      p('#2b2d33', -11, -13, 2, 6);
      break;
    }
    case 'hippo': {
      // 河馬泡在水裡：只露出背、頭、耳朵和眼睛；偶爾張大嘴打哈欠
      const yawn = Math.floor(t / 6) % 3 === 0 && t % 6 < 1.6;
      p('rgba(255,255,255,0.4)', -11, 0, 24, 1);
      p('#8a6a78', -9, -5, 17, 5);
      p('#9a7a88', -7, -5, 10, 1);
      if (yawn) {
        p('#8a6a78', 6, -12, 9, 4);
        p('#e88a9a', 7, -9, 8, 4);
        p('#ffffff', 8, -9, 1, 2);
        p('#ffffff', 13, -9, 1, 2);
        p('#8a6a78', 6, -5, 9, 3);
      } else {
        p('#8a6a78', 6, -7, 9, 6);
        p('#6e5260', 7, -9, 2, 2);
        p('#6e5260', 11, -9, 2, 2);
        p('#2b2d33', 8, -7, 1, 1);
        p('#5a4250', 13, -5, 1, 1);
      }
      break;
    }
    case 'lion':
    case 'lioness': {
      // 躺在岩石上的獅子：公獅有一圈深色鬃毛；尾巴末端一撮黑毛
      const male = an.kind === 'lion';
      const tail = Math.round(Math.sin(t * 1.4) * 1.5);
      shadow(c, fx, fy, 20);
      p('#d9a54a', -10, -7 + breathe, 17, 6 - breathe);
      p('#e8bc6a', -8, -7 + breathe, 10, 1);
      p('#c9943a', 5, -3, 8, 2);
      p('#d9a54a', -14, -3 + tail, 5, 1);
      p('#5a3a1a', -15, -4 + tail, 2, 2);
      if (male) {
        p('#8a4a1f', 4, -15, 11, 12);
        p('#a85a24', 5, -14, 9, 1);
      }
      p('#e0b060', 6, -12, 7, 7);
      p('#f4e0b0', 9, -8, 4, 2);
      p('#5a3a2a', 12, -9, 2, 1);
      p('#2b2d33', 9, -11, 1, 1);
      if (!male) p('#e0b060', 6, -14, 2, 2);
      break;
    }
  }
}

// ── 入口廣場 ──

// 動物園大門：兩根柱子撐著一塊招牌，上面一隻熊貓
export function drawGate(c: CanvasRenderingContext2D, seconds: number): void {
  const g = ZOO.gate;
  const x0 = Math.round(g.x0 * T);
  const x1 = Math.round(g.x1 * T);
  const by = Math.round(g.y * T);
  for (const x of [x0, x1 - 10]) {
    px(c, 'rgba(0,0,0,0.25)', x - 1, by - 1, 12, 3);
    px(c, '#e8e0d0', x, by - 44, 10, 44);
    px(c, '#f6f0e4', x, by - 44, 3, 44);
    px(c, '#2f7a5a', x - 2, by - 48, 14, 4);
  }
  px(c, '#2f7a5a', x0 - 6, by - 62, x1 - x0 + 12, 18);
  px(c, '#3d9a6e', x0 - 6, by - 62, x1 - x0 + 12, 2);
  px(c, '#f6c945', x0 - 6, by - 46, x1 - x0 + 12, 2);
  text(c, '臺北市立動物園', (x0 + x1) / 2, by - 55.5, '#ffffff', `900 10px ${FONT_TC}`);
  text(c, 'TAIPEI ZOO', (x0 + x1) / 2, by - 40, '#2f7a5a', '900 6px system-ui, sans-serif');
  // 招牌上的熊貓
  const sprite = pandaSprite('cub');
  const bob = Math.floor(seconds * 1.5) % 2;
  c.drawImage(sprite, Math.round((x0 + x1) / 2 - sprite.width / 2), by - 62 - sprite.height + 2 - bob);
}

// 動物園站（文湖線高架，咖啡色；列車進站停一下再開走）
const TRAIN_CYCLE_S = 24;
export function drawZooStation(c: CanvasRenderingContext2D, seconds: number): void {
  const s = ZOO.station;
  const x = s.x0 * T;
  const w = (s.x1 - s.x0) * T;
  const y0 = s.y0 * T;
  const y1 = s.y1 * T;
  px(c, 'rgba(0,0,0,0.35)', x + 4, y1 - 2, w, 6);
  const bandTop = y0 - 20;
  px(c, '#1b2433', x, bandTop, w, 20);
  c.save();
  c.beginPath();
  c.rect(x, bandTop, w, 20);
  c.clip();
  const t = seconds % TRAIN_CYCLE_S;
  const trainW = w * 0.6;
  const stopX = x + (w - trainW) / 2;
  let tx: number | null = null;
  if (t < 3.5) tx = stopX - (1 - t / 3.5) ** 2 * (trainW + w);
  else if (t < 8.5) tx = stopX;
  else if (t < 12) tx = stopX + ((t - 8.5) / 3.5) ** 2 * (trainW + w);
  if (tx !== null) {
    const ty = bandTop + 5;
    px(c, '#f4f4f0', tx, ty, trainW, 13);
    px(c, '#c48c31', tx, ty + 9, trainW, 2);
    for (let k = tx + 5; k < tx + trainW - 5; k += 8) px(c, '#9fd8ff', k, ty + 3, 5, 4);
    px(c, '#9aa3b2', tx + trainW / 2, ty, 1, 13);
  }
  c.restore();
  for (let k = x; k < x + w; k += 20) px(c, 'rgba(255,255,255,0.18)', k, bandTop, 1, 20);
  px(c, '#c48c31', x - 4, bandTop - 6, w + 8, 6);
  px(c, '#d9a24a', x - 4, bandTop - 6, w + 8, 1);
  px(c, '#e8e4dc', x, y0, w, y1 - y0);
  px(c, '#c48c31', x, y0, w, 3);
  for (let k = x + 6; k < x + w - 6; k += 14) px(c, '#cfc9bd', k, y0 + 3, 2, y1 - y0 - 3);
  const dx = x + w / 2 - 22;
  px(c, '#2a2f40', dx, y0 + 12, 44, y1 - y0 - 12);
  for (let k = y0 + 14; k < y1; k += 3) px(c, '#4a5068', dx, k, 44, 1);
  glow(c, x + w / 2, y1 - 8, 36, '255, 255, 255', 0.16);
  px(c, '#c48c31', x + w / 2 - 36, y0 + 3, 72, 10);
  text(c, '動物園站 Taipei Zoo', x + w / 2, y0 + 8.5, '#ffffff', `700 7px ${FONT_TC}`);
  px(c, '#ffffff', x + 6, y0 + 8, 13, 12);
  px(c, '#c48c31', x + 7, y0 + 9, 11, 10);
  text(c, 'BR01', x + 12.5, y0 + 14.5, '#ffffff', '900 4px system-ui, sans-serif');
}

// 腳踏車出租：遮雨棚、一排停好的腳踏車、招牌
export function drawBikeStand(c: CanvasRenderingContext2D): void {
  const s = ZOO.bikeStand;
  const x = s.x0 * T;
  const w = (s.x1 - s.x0) * T;
  const y1 = s.y1 * T;
  px(c, 'rgba(0,0,0,0.2)', x, y1 - 1, w, 3);
  px(c, '#3a3d45', x + 2, y1 - 30, 2, 30);
  px(c, '#3a3d45', x + w - 4, y1 - 30, 2, 30);
  for (let i = 0; i < w; i += 8) px(c, i % 16 === 0 ? '#2f7a5a' : '#f4f1e8', x + i, y1 - 34, 8, 6);
  for (let i = 0; i < 6; i += 1) {
    const bx = x + 8 + i * 20;
    px(c, '#2b2d33', bx, y1 - 9, 6, 6);
    px(c, '#2b2d33', bx + 10, y1 - 9, 6, 6);
    px(c, '#c9ccd6', bx + 2, y1 - 7, 2, 2);
    px(c, '#c9ccd6', bx + 12, y1 - 7, 2, 2);
    px(c, ['#2f7a5a', '#e25a4a', '#3b82f6'][i % 3] ?? '#2f7a5a', bx + 3, y1 - 12, 10, 2);
    px(c, '#2b2d33', bx + 4, y1 - 15, 4, 1);
    px(c, '#2b2d33', bx + 11, y1 - 15, 2, 4);
  }
  px(c, '#15171f', x + w / 2 - 30, y1 - 48, 60, 13);
  px(c, '#2f7a5a', x + w / 2 - 29, y1 - 47, 58, 11);
  text(c, '🚲 腳踏車出租', x + w / 2, y1 - 41, '#ffffff', `900 7px ${FONT_TC}`);
}

// 長椅（面向展區）
export function drawBench(c: CanvasRenderingContext2D, x: number, y: number): void {
  const bx = Math.round((x - 1.2) * T);
  const by = Math.round(y * T);
  const w = Math.round(2.4 * T);
  px(c, 'rgba(0,0,0,0.25)', bx + 2, by + 2, w, 3);
  px(c, '#6b4428', bx, by - 4, w, 5);
  px(c, '#9a6a43', bx, by - 4, w, 1);
  px(c, '#3a2a20', bx + 2, by + 1, 2, 3);
  px(c, '#3a2a20', bx + w - 4, by + 1, 2, 3);
}

// 廣場的行道樹、路燈
export function drawPlazaTree(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 9, by - 1, 18, 3);
  px(c, '#5c3d22', cx - 2, by - 14, 4, 14);
  px(c, '#2f6b3a', cx - 12, by - 34, 24, 22);
  px(c, '#3d8748', cx - 10, by - 36, 20, 18);
  px(c, '#57a862', cx - 6, by - 34, 7, 5);
}

export function drawLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  if (night) glow(c, cx, by - 24, 22, '255, 214, 140', 0.25);
  px(c, 'rgba(0,0,0,0.3)', cx - 3, by - 1, 7, 2);
  px(c, '#3d424c', cx, by - 26, 2, 26);
  px(c, '#2f333b', cx - 3, by - 30, 8, 4);
  px(c, night ? '#fff1a8' : '#c9ccd6', cx - 2, by - 27, 6, 1);
}
