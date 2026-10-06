// 像素圖書館的美術：Kenney Roguelike Indoors（CC0）提供桌椅、沙發、盆栽，
// 素材包沒有的（地板、牆、書櫃、樓梯、電視、地毯、懶骨頭、人物）在這裡用程式一格一格畫。
// 所有座標都是「世界像素」（1 格 = 16px），呼叫端負責整數倍放大。

import { TILE, WALL_ROWS, type Facing, type MapRug, type PixelMap } from './pixelMap';

export const KENNEY_SHEET_URL = '/pixel/kenney-roguelike-indoor.png';
const KENNEY_STRIDE = 17;

// 素材表上的格子位置 [col, row]
export const KENNEY = {
  chairDown: [0, 2],
  chairUp: [1, 2],
  chairRight: [2, 2],
  chairLeft: [3, 2],
  tableTopLeft: [0, 0],
  tableTopRight: [2, 0],
  tableBottomLeft: [0, 1],
  tableBottomRight: [2, 1],
  roundTable: [7, 0],
  plantA: [16, 0],
  plantB: [17, 0],
} as const satisfies Record<string, readonly [number, number]>;

export type KenneyTile = keyof typeof KENNEY;

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`無法載入 ${url}`));
    image.src = url;
  });
}

export function drawKenney(ctx: CanvasRenderingContext2D, sheet: HTMLImageElement, tile: KenneyTile, dx: number, dy: number): void {
  const [col, row] = KENNEY[tile];
  ctx.drawImage(sheet, col * KENNEY_STRIDE, row * KENNEY_STRIDE, TILE, TILE, dx, dy, TILE, TILE);
}

function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// ── 靜態底圖：地板、牆、窗、書櫃、樓梯口、電視、地毯 ──

const WOOD = { base: '#dcbf93', light: '#e6cda6', seam: '#c3a172', knot: '#b8925f' };
const WALL = { cap: '#3b3f4c', capLight: '#4c5262', face: '#d6d0c4', faceShade: '#c7c0b2', base: '#8a6a4a' };
const SHELF = { frame: '#9a6a43', frameDark: '#6b4428', back: '#4a3326', board: '#b98652' };
const BOOK_COLORS = ['#7d2e2e', '#2f4a6b', '#35604f', '#c79a45', '#4b3a63', '#e3dccb', '#a35a3b', '#3b6f86', '#c46a55', '#5d7a3a'];

function paintFloor(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const rand = seeded(17);
  const top = WALL_ROWS * TILE;
  const width = map.width * TILE;
  const height = map.height * TILE;
  px(ctx, WOOD.base, 0, top, width, height - top);
  // 橫向木地板：每條 4px 高，接縫錯開
  for (let y = top; y < height; y += 4) {
    px(ctx, WOOD.seam, 0, y + 3, width, 1);
    let x = -Math.floor(rand() * 40);
    while (x < width) {
      const length = 28 + Math.floor(rand() * 36);
      px(ctx, WOOD.seam, x + length, y, 1, 3);
      if (rand() < 0.35) px(ctx, WOOD.light, x + 2, y, length - 4, 1);
      if (rand() < 0.12) px(ctx, WOOD.knot, x + 6 + Math.floor(rand() * (length - 12)), y + 1, 2, 1);
      x += length + 1;
    }
  }
}

function paintWalls(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const width = map.width * TILE;
  const height = map.height * TILE;
  // 後牆：上緣是牆頂，下面兩格是牆面（清水模感：淡灰 + 模板分割線）
  px(ctx, WALL.cap, 0, 0, width, TILE);
  px(ctx, WALL.capLight, 0, TILE - 2, width, 1);
  px(ctx, WALL.face, 0, TILE, width, TILE * 2);
  for (let x = 0; x < width; x += 48) px(ctx, WALL.faceShade, x, TILE, 1, TILE * 2);
  px(ctx, WALL.faceShade, 0, TILE * 2, width, 1);
  for (let x = 12; x < width; x += 24) {
    px(ctx, WALL.faceShade, x, TILE + 8, 1, 1);
    px(ctx, WALL.faceShade, x, TILE * 2 + 8, 1, 1);
  }
  px(ctx, WALL.base, 0, TILE * 3 - 2, width, 2);

  // 左右牆與前緣：俯視只看得到牆頂
  px(ctx, WALL.cap, 0, 0, TILE, height);
  px(ctx, WALL.capLight, TILE - 2, TILE, 1, height - TILE * 2);
  px(ctx, WALL.cap, width - TILE, 0, TILE, height);
  px(ctx, WALL.capLight, width - TILE + 1, TILE, 1, height - TILE * 2);
  px(ctx, WALL.cap, 0, height - TILE, width, TILE);
  px(ctx, WALL.capLight, TILE, height - TILE + 1, width - TILE * 2, 1);

  // 左牆的落地窗
  for (const [y0, y1] of map.windows) {
    const top = y0 * TILE;
    const h = (y1 - y0) * TILE;
    px(ctx, '#2a2f3a', 2, top - 1, 12, h + 2);
    px(ctx, '#bfe3f2', 4, top + 1, 8, h - 2);
    px(ctx, '#e6f5fb', 5, top + 2, 2, h - 4);
    px(ctx, '#9cc9dc', 4, top + Math.floor(h / 2), 8, 1);
  }
}

function paintShelves(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const rand = seeded(101);
  const top = TILE + 1;
  const bottom = TILE * 3 - 2;
  for (const [x0, x1] of map.shelves) {
    const left = x0 * TILE;
    const width = (x1 - x0) * TILE;
    px(ctx, SHELF.frameDark, left, top - 1, width, bottom - top + 1);
    px(ctx, SHELF.frame, left + 1, top, width - 2, bottom - top - 1);
    // 三層，每層 9px：深色背板 + 書背
    for (let level = 0; level < 3; level += 1) {
      const y = top + 2 + level * 10;
      px(ctx, SHELF.back, left + 2, y, width - 4, 8);
      let x = left + 3;
      while (x < left + width - 4) {
        if (rand() < 0.08) {
          x += 2 + Math.floor(rand() * 3);
          continue;
        }
        const thick = 1 + Math.floor(rand() * 2) + (rand() < 0.2 ? 1 : 0);
        const tall = 5 + Math.floor(rand() * 3);
        const color = BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)] ?? '#e3dccb';
        const w = Math.min(thick, left + width - 4 - x);
        px(ctx, color, x, y + 8 - tall, w, tall);
        if (tall > 5 && w > 1) px(ctx, 'rgba(255,255,255,0.25)', x, y + 8 - tall + 1, 1, 1);
        x += w;
      }
      px(ctx, SHELF.board, left + 1, y + 8, width - 2, 2);
    }
    // 每 3 格一根直立隔板
    for (let x = left; x <= left + width; x += TILE * 3) {
      px(ctx, SHELF.frame, Math.min(x, left + width - 2), top, 2, bottom - top - 1);
    }
  }
}

function paintStairs(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  for (const stair of [map.stairs.down, map.stairs.up]) {
    const up = stair.direction === 1;
    const left = stair.tx * TILE;
    const width = TILE * 2;
    const accent = up ? '#fbbf24' : '#2dd4bf';
    px(ctx, '#1d1f27', left, TILE, width, TILE * 2);
    // 台階：上樓往上變亮、下樓往下變暗
    for (let i = 0; i < 6; i += 1) {
      const y = TILE + 3 + i * 5;
      const tone = up ? 120 + i * 18 : 210 - i * 22;
      px(ctx, `rgb(${tone},${tone - 6},${tone - 14})`, left + 3, y, width - 6, 4);
      px(ctx, `rgb(${tone - 30},${tone - 36},${tone - 44})`, left + 3, y + 4, width - 6, 1);
    }
    px(ctx, accent, left + 3, TILE * 3 - 3, width - 6, 1);
    px(ctx, SHELF.frameDark, left, TILE, 2, TILE * 2);
    px(ctx, SHELF.frameDark, left + width - 2, TILE, 2, TILE * 2);
  }
}

function paintTv(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const left = map.tv.tx * TILE;
  const width = map.tv.w * TILE;
  // 牆面木格柵 + 大螢幕
  for (let x = left; x < left + width; x += 3) px(ctx, '#7a5236', x, TILE, 2, TILE * 2 - 2);
  px(ctx, '#15171f', left + 6, TILE + 3, width - 12, 24);
  px(ctx, '#2f5f96', left + 8, TILE + 5, width - 16, 20);
  px(ctx, '#3f7dbf', left + 8, TILE + 5, width - 16, 9);
  px(ctx, '#7fb4e6', left + 10, TILE + 7, 10, 2);
  px(ctx, '#15171f', left + width / 2 - 6, TILE + 27, 12, 2);
}

const RUG_COLORS: Record<MapRug['color'], { fill: string; border: string; dot: string }> = {
  oat: { fill: '#ece2cf', border: '#cdb994', dot: '#ddcfb4' },
  terracotta: { fill: '#c97b57', border: '#9f5a3d', dot: '#d89270' },
  slate: { fill: '#7b8596', border: '#5d6676', dot: '#8a94a5' },
};

function paintRug(ctx: CanvasRenderingContext2D, rug: MapRug): void {
  const colors = RUG_COLORS[rug.color];
  const x = rug.tx * TILE;
  const y = rug.ty * TILE;
  const w = rug.w * TILE;
  const h = rug.h * TILE;
  if (rug.round) {
    const cx = x + w / 2;
    const cy = y + h / 2;
    const r = w / 2 - 1;
    // 像素圓：一列一列填，邊緣才是鋸齒而不是糊邊
    for (let row = -r; row <= r; row += 1) {
      const half = Math.floor(Math.sqrt(r * r - row * row));
      px(ctx, colors.border, cx - half, cy + row, half * 2, 1);
      if (Math.abs(row) < r - 2) {
        const inner = Math.max(0, half - 3);
        px(ctx, colors.fill, cx - inner, cy + row, inner * 2, 1);
      }
    }
    for (let ring = 0; ring < 40; ring += 1) {
      const a = (ring / 40) * Math.PI * 2;
      px(ctx, colors.dot, Math.round(cx + Math.cos(a) * (r - 8)), Math.round(cy + Math.sin(a) * (r - 8)), 2, 1);
    }
    return;
  }
  px(ctx, colors.border, x + 2, y + 2, w - 4, h - 4);
  px(ctx, colors.fill, x + 5, y + 5, w - 10, h - 10);
  for (let dy = 9; dy < h - 9; dy += 6) {
    for (let dx = 9 + ((dy / 6) % 2) * 3; dx < w - 9; dx += 6) px(ctx, colors.dot, x + dx, y + dy, 1, 1);
  }
}

export function paintStaticLayer(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  paintFloor(ctx, map);
  for (const rug of map.rugs) paintRug(ctx, rug);
  paintWalls(ctx, map);
  paintShelves(ctx, map);
  paintStairs(ctx, map);
  paintTv(ctx, map);
}

// ── 會跟人物一起排前後的家具（Kenney 沒有的部分） ──

export function paintCounter(ctx: CanvasRenderingContext2D, x: number, y: number, h: number): void {
  px(ctx, '#7a5236', x + 1, y, 14, h);
  px(ctx, '#c99a63', x + 2, y + 1, 12, h - 3);
  px(ctx, '#ddb27c', x + 3, y + 1, 2, h - 3);
  px(ctx, '#a9a49a', x + 2, y + h - 3, 12, 2);
}

export const POUF_COLORS = ['#c9774f', '#7f9a83', '#d8b56a', '#6f7f9e'];

// 用一列列的寬度描出一個有外框的形狀：[左邊縮排, 寬度]
function blob(ctx: CanvasRenderingContext2D, x: number, y: number, rows: [number, number][], fill: string, outline: string): void {
  rows.forEach(([offset, width], i) => {
    px(ctx, outline, x + offset, y + i, width, 1);
    const top = i === 0 || i === rows.length - 1;
    if (!top) px(ctx, fill, x + offset + 1, y + i, width - 2, 1);
  });
}

// 懶骨頭：蓬蓬的一團，後面比較高
export function paintPouf(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  blob(
    ctx,
    x,
    y + 2,
    [
      [4, 8],
      [2, 12],
      [1, 14],
      [0, 16],
      [0, 16],
      [0, 16],
      [0, 16],
      [0, 16],
      [1, 14],
      [1, 14],
      [2, 12],
      [4, 8],
    ],
    color,
    '#4a3a30',
  );
  px(ctx, 'rgba(255,255,255,0.3)', x + 4, y + 4, 5, 1);
  px(ctx, 'rgba(255,255,255,0.18)', x + 3, y + 5, 2, 2);
  // 被坐出來的凹陷
  px(ctx, 'rgba(0,0,0,0.16)', x + 4, y + 9, 8, 3);
  px(ctx, 'rgba(0,0,0,0.12)', x + 2, y + 12, 12, 1);
}

// 吧台高腳椅：圓座面 + 細腳
export function paintStool(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, '#2b2d33', x + 4, y + 13, 8, 1);
  px(ctx, '#3a3d45', x + 7, y + 8, 2, 6);
  blob(ctx, x + 3, y + 3, [[2, 6], [0, 10], [0, 10], [0, 10], [2, 6]], '#c99a63', '#6b4428');
  px(ctx, '#ddb27c', x + 5, y + 5, 3, 1);
}

export const ARMCHAIR_COLORS = ['#b0603f', '#5b8a6c', '#c49a45'];

// 背對鏡頭的單人沙發（面向上方的電視）：看得到椅背與兩側扶手
export function paintArmchairBack(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  const outline = '#3d2b22';
  // 座墊（在椅背後面、比較上面）
  px(ctx, outline, x + 2, y + 1, 12, 6);
  px(ctx, color, x + 3, y + 2, 10, 4);
  px(ctx, 'rgba(255,255,255,0.22)', x + 4, y + 2, 6, 1);
  // 兩側扶手
  for (const ax of [x, x + 12]) {
    px(ctx, outline, ax, y + 3, 4, 12);
    px(ctx, color, ax + 1, y + 4, 2, 10);
    px(ctx, 'rgba(0,0,0,0.18)', ax + 1, y + 11, 2, 3);
  }
  // 椅背（離鏡頭最近，最大塊）
  px(ctx, outline, x + 2, y + 6, 12, 9);
  px(ctx, color, x + 3, y + 7, 10, 7);
  px(ctx, 'rgba(0,0,0,0.2)', x + 3, y + 11, 10, 3);
  px(ctx, 'rgba(255,255,255,0.18)', x + 4, y + 7, 8, 1);
  // 椅腳
  px(ctx, outline, x + 2, y + 15, 2, 1);
  px(ctx, outline, x + 12, y + 15, 2, 1);
}

export function paintFloorLamp(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, '#2b2d33', x + 5, y + 13, 6, 2);
  px(ctx, '#3a3d45', x + 7, y - 6, 2, 19);
  px(ctx, '#6b4428', x + 3, y - 12, 10, 7);
  px(ctx, '#f6e2b8', x + 4, y - 11, 8, 5);
  px(ctx, '#fff4d6', x + 5, y - 10, 3, 2);
}

// ── 人物：16×20 的 Q 版像素小人，四個方向 × 走路兩格，髮色與衣服可換 ──

export interface AvatarColors {
  hair: string;
  hairLight: string;
  shirt: string;
  shirtShade: string;
}

const AVATAR_W = 16;
const AVATAR_H = 20;
// 坐著時只畫到第 17 列（腿被桌子或椅子擋住）
export const SEATED_ROWS = 17;

const HEAD_DOWN = [
  '................',
  '.....oooooo.....',
  '....oHHHHHHo....',
  '...oHHhhHHHHo...',
  '...oHHHHHHHHo...',
  '..oHHHHHHHHHHo..',
  '..oHHSSSSSSHHo..',
  '..oHSSSSSSSSHo..',
  '..oSSeSSSSeSSo..',
  '..oSSeSSSSeSSo..',
  '..oSbSSSSSSbSo..',
  '...oSSSSSSSSo...',
  '....oooooooo....',
];
const HEAD_UP = [
  '................',
  '.....oooooo.....',
  '....oHHHHHHo....',
  '...oHHHHHHHHo...',
  '...oHHHhhHHHo...',
  '..oHHHHHHHHHHo..',
  '..oHHHHHHHHHHo..',
  '..oHHHHHHHHHHo..',
  '..oHHHhHHHHHHo..',
  '..oHHHHHHHHHHo..',
  '..okHHHHHHHHko..',
  '...oHHHHHHHHo...',
  '....oooooooo....',
];
const HEAD_RIGHT = [
  '................',
  '.....oooooo.....',
  '....oHHHHHHo....',
  '...oHHHHHhHHo...',
  '...oHHHHHHHHo...',
  '..oHHHHHHHHHHo..',
  '..oHHHHHSSSSHo..',
  '..oHHHHSSSSSSo..',
  '..oHHHSSSSSeSo..',
  '..oHHHSSSSSeSo..',
  '..oHHHSSSSbSSo..',
  '...oHHSSSSSSo...',
  '....oooooooo....',
];
const BODY_FRONT = ['...oTTTTTTTTo...', '..oSoTTTTTToSo..', '..oSoTTTTTToSo..', '...ootttttoo....'];
const BODY_SIDE = ['....oTTTTTTo....', '....oTTTSTTo....', '....oTTTSTTo....', '....otttttto....'];
const LEGS_FRONT = {
  idle: ['....oPPPPPPo....', '....oPPooPPo....', '....oFFooFFo....'],
  walkA: ['....oPPPPPPo....', '....oPPooFFo....', '....oFFo.oo.....'],
  walkB: ['....oPPPPPPo....', '....oFFooPPo....', '.....oo.oFFo....'],
};
const LEGS_SIDE = {
  idle: ['.....oPPPPo.....', '.....oPPPPo.....', '.....oFFFFFo....'],
  walkA: ['....oPPooPPo....', '....oPo..oPo....', '....oFFo.oFFo...'],
  walkB: ['.....oPPPPo.....', '.....oPPPPo.....', '.....oFFFFFo....'],
};

type Frame = 'idle' | 'walkA' | 'walkB';

function avatarRows(facing: Facing, frame: Frame): string[] {
  if (facing === 'down') return [...HEAD_DOWN, ...BODY_FRONT, ...LEGS_FRONT[frame]];
  if (facing === 'up') return [...HEAD_UP, ...BODY_FRONT, ...LEGS_FRONT[frame]];
  return [...HEAD_RIGHT, ...BODY_SIDE, ...LEGS_SIDE[frame]];
}

const avatarCache = new Map<string, HTMLCanvasElement>();

export function getAvatarFrame(colors: AvatarColors, facing: Facing, frame: Frame): HTMLCanvasElement {
  const key = `${colors.hair}|${colors.shirt}|${facing}|${frame}`;
  const cached = avatarCache.get(key);
  if (cached) return cached;
  const palette: Record<string, string> = {
    o: '#2b2135',
    H: colors.hair,
    h: colors.hairLight,
    S: '#f6d1b0',
    k: '#e0ad8a',
    e: '#2b2135',
    b: '#f4a3a3',
    T: colors.shirt,
    t: colors.shirtShade,
    P: '#3d4a63',
    F: '#2b2135',
  };
  const canvas = document.createElement('canvas');
  canvas.width = AVATAR_W;
  canvas.height = AVATAR_H;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const rows = avatarRows(facing, frame);
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        const ch = row[x] ?? '.';
        const color = palette[ch];
        if (!color) continue;
        // 面向左：水平翻轉面向右的圖
        const dx = facing === 'left' ? AVATAR_W - 1 - x : x;
        px(ctx, color, dx, y);
      }
    });
  }
  avatarCache.set(key, canvas);
  return canvas;
}

export const AVATAR_SIZE = { w: AVATAR_W, h: AVATAR_H };

const HAIR_PALETTE: [string, string][] = [
  ['#4a2f23', '#6b4636'],
  ['#2b2b36', '#474760'],
  ['#c98a3c', '#e3ad5e'],
  ['#8a3b2f', '#b0574a'],
  ['#e9d8a6', '#fff1c9'],
];
const SHIRT_PALETTE: [string, string][] = [
  ['#2dd4bf', '#14a594'],
  ['#60a5fa', '#3b82d6'],
  ['#f472b6', '#d14f93'],
  ['#a78bfa', '#7d5fd6'],
  ['#4ade80', '#2bb35f'],
  ['#fb923c', '#d9701d'],
];

// 別人的外觀依名字決定，同一個人每次看到都一樣
export function avatarColorsFor(seed: string): AvatarColors {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const [hair, hairLight] = HAIR_PALETTE[hash % HAIR_PALETTE.length] ?? HAIR_PALETTE[0] ?? ['#4a2f23', '#6b4636'];
  const [shirt, shirtShade] = SHIRT_PALETTE[(hash >>> 4) % SHIRT_PALETTE.length] ?? SHIRT_PALETTE[0] ?? ['#2dd4bf', '#14a594'];
  return { hair, hairLight, shirt, shirtShade };
}

export const MY_AVATAR: AvatarColors = { hair: '#4a2f23', hairLight: '#6b4636', shirt: '#fbbf24', shirtShade: '#d99a0b' };
