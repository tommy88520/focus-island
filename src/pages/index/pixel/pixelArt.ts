// 像素圖書館的美術：Kenney Roguelike Indoors（CC0）提供桌椅、沙發、盆栽，
// 素材包沒有的（地板、牆、書櫃、樓梯、電視、地毯、懶骨頭、人物）在這裡用程式一格一格畫。
// 所有座標都是「世界像素」（1 格 = 16px），呼叫端負責整數倍放大。

import { px, seeded } from './pixelUtil';
import { RUGS, WALLS, WINDOW_GLASS, paintBackWall, paintThemedFloor, paintThemedTv, paintWallFace } from './pixelThemes';
import { TILE, WALL_ROWS, type Facing, type MapRug, type Outfit, type PixelMap, type ThemeId, type VehicleKind } from './pixelMap';

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

// ── 靜態底圖：地板、牆、窗、書櫃、樓梯口、電視、地毯 ──

const WOOD = { base: '#dcbf93', light: '#e6cda6', seam: '#c3a172', knot: '#b8925f' };
const SHELF = { frame: '#9a6a43', frameDark: '#6b4428', back: '#4a3326', board: '#b98652' };
const BOOK_COLORS = ['#7d2e2e', '#2f4a6b', '#35604f', '#c79a45', '#4b3a63', '#e3dccb', '#a35a3b', '#3b6f86', '#c46a55', '#5d7a3a'];

function paintFloor(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  if (paintThemedFloor(ctx, map)) return;
  const rand = seeded(17);
  const top = WALL_ROWS * TILE;
  const width = map.width * TILE;
  const height = map.libraryHeight * TILE;
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
  const height = map.libraryHeight * TILE;
  const wall = WALLS[map.theme];
  const glass = WINDOW_GLASS[map.theme];
  // 後牆：上緣是牆頂，下面兩格是牆面（清水模感：淡灰 + 模板分割線）
  px(ctx, wall.cap, 0, 0, width, TILE);
  px(ctx, wall.capLight, 0, TILE - 2, width, 1);
  px(ctx, wall.face, 0, TILE, width, TILE * 2);
  if (map.theme === 'library') {
    for (let x = 0; x < width; x += 48) px(ctx, wall.faceShade, x, TILE, 1, TILE * 2);
    px(ctx, wall.faceShade, 0, TILE * 2, width, 1);
    for (let x = 12; x < width; x += 24) {
      px(ctx, wall.faceShade, x, TILE + 8, 1, 1);
      px(ctx, wall.faceShade, x, TILE * 2 + 8, 1, 1);
    }
  } else {
    paintWallFace(ctx, map);
  }
  px(ctx, wall.base, 0, TILE * 3 - 2, width, 2);

  // 左右牆與前緣：俯視只看得到牆頂
  px(ctx, wall.cap, 0, 0, TILE, height);
  px(ctx, wall.capLight, TILE - 2, TILE, 1, height - TILE * 2);
  px(ctx, wall.cap, width - TILE, 0, TILE, height);
  px(ctx, wall.capLight, width - TILE + 1, TILE, 1, height - TILE * 2);
  // 通往隔壁分區的出口：牆上開兩格，鋪一塊地墊、兩側門框
  const sides: [number, { y0: number; y1: number } | null][] = [
    [0, map.sideExits.left],
    [width - TILE, map.sideExits.right],
  ];
  for (const [x, exit] of sides) {
    if (!exit) continue;
    const top = exit.y0 * TILE;
    const h = (exit.y1 - exit.y0) * TILE;
    px(ctx, '#6b4428', x, top, TILE, h);
    px(ctx, '#9a6a43', x + 2, top + 2, TILE - 4, h - 4);
    for (let y = top + 5; y < top + h - 4; y += 4) px(ctx, '#8a5e36', x + 3, y, TILE - 6, 1);
    px(ctx, '#2a2f3a', x, top - 2, TILE, 2);
    px(ctx, '#2a2f3a', x, top + h, TILE, 2);
  }
  // 前牆：中間開一道雙開玻璃門通往海灘
  const doorLeft = map.beach.door[0] * TILE;
  const doorRight = map.beach.door[1] * TILE;
  px(ctx, wall.cap, 0, height - TILE, doorLeft, TILE);
  px(ctx, wall.cap, doorRight, height - TILE, width - doorRight, TILE);
  px(ctx, wall.capLight, TILE, height - TILE + 1, doorLeft - TILE, 1);
  px(ctx, wall.capLight, doorRight, height - TILE + 1, width - doorRight - TILE, 1);
  px(ctx, '#2a2f3a', doorLeft - 2, height - TILE, 2, TILE);
  px(ctx, '#2a2f3a', doorRight, height - TILE, 2, TILE);
  if (map.beach.escalator) {
    paintEscalatorFrame(ctx, map);
  } else {
    // 門檻 + 打開的兩扇玻璃門（貼在門框邊）
    px(ctx, '#a9a49a', doorLeft, height - 3, doorRight - doorLeft, 3);
    px(ctx, '#2a2f3a', doorLeft, height - TILE, 3, 12);
    px(ctx, '#bfe3f2', doorLeft + 1, height - TILE + 1, 1, 10);
    px(ctx, '#2a2f3a', doorRight - 3, height - TILE, 3, 12);
    px(ctx, '#bfe3f2', doorRight - 2, height - TILE + 1, 1, 10);
  }
  // 門口地墊
  px(ctx, '#6b4428', doorLeft + 6, height - TILE - 9, doorRight - doorLeft - 12, 7);
  px(ctx, '#9a6a43', doorLeft + 7, height - TILE - 8, doorRight - doorLeft - 14, 5);

  // 左牆的落地窗
  for (const [y0, y1] of map.windows) {
    const top = y0 * TILE;
    const h = (y1 - y0) * TILE;
    px(ctx, '#2a2f3a', 2, top - 1, 12, h + 2);
    px(ctx, glass.glass, 4, top + 1, 8, h - 2);
    px(ctx, glass.shine, 5, top + 2, 2, h - 4);
    px(ctx, glass.bar, 4, top + Math.floor(h / 2), 8, 1);
  }
}

function paintShelves(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  if (paintBackWall(ctx, map)) return;
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

// 電梯：不鏽鋼門框 + 上方的樓層顯示；兩扇門每格重畫（有人靠近會打開）
function paintElevatorFrame(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const left = map.elevator.tx * TILE;
  const width = TILE * 2;
  px(ctx, '#5d6676', left, TILE, width, TILE * 2);
  px(ctx, '#8a94a5', left + 1, TILE + 1, width - 2, TILE * 2 - 1);
  // 樓層顯示
  px(ctx, '#15171f', left + 10, TILE + 2, 12, 5);
  px(ctx, '#fbbf24', left + 14, TILE + 3, 1, 3);
  px(ctx, '#fbbf24', left + 13, TILE + 4, 3, 1);
  px(ctx, '#fbbf24', left + 17, TILE + 3, 2, 3);
  // 車廂內部（門打開才看得到）
  px(ctx, '#3a3d45', left + 3, TILE + 9, width - 6, TILE * 2 - 9);
  px(ctx, '#f6e2b8', left + 5, TILE + 10, width - 10, 2);
  px(ctx, '#55596a', left + 3, TILE * 3 - 4, width - 6, 4);
  // 門邊的按鈕
  px(ctx, '#2a2f3a', left + width - 3, TILE + 16, 2, 6);
  px(ctx, '#fbbf24', left + width - 3, TILE + 17, 2, 1);
}

// open：0 關著、1 全開
export function paintElevatorDoors(ctx: CanvasRenderingContext2D, map: PixelMap, open: number): void {
  const left = map.elevator.tx * TILE + 3;
  const top = TILE + 9;
  const height = TILE * 2 - 9;
  const half = 13;
  const leaf = Math.max(2, Math.round(half * (1 - open)));
  for (const x of [left, left + half * 2 - leaf]) {
    px(ctx, '#c3cad6', x, top, leaf, height);
    px(ctx, '#e3e8f0', x + (x === left ? 1 : leaf - 2), top, 1, height);
  }
  if (open < 0.05) px(ctx, '#5d6676', left + half - 1, top, 2, height);
}

function paintTv(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  if (paintThemedTv(ctx, map)) return;
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

function paintRug(ctx: CanvasRenderingContext2D, rug: MapRug, theme: ThemeId): void {
  const colors = RUGS[theme][rug.color];
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

// ── 手扶梯（樓上通往海灘的出口）：外框畫在底圖，會動的梯級每格重畫 ──

const ESCALATOR = { frame: '#2a2f3a', rail: '#15171f', railLight: '#4c5262', step: '#6f7787', stepDark: '#4a5160', comb: '#fbbf24' };
const ESCALATOR_RAIL = 3;

function escalatorRect(map: PixelMap): { left: number; top: number; width: number; height: number } {
  const left = map.beach.door[0] * TILE;
  const top = map.beach.wallRow * TILE;
  return { left, top, width: map.beach.door[1] * TILE - left, height: map.beach.sandTop * TILE - top };
}

function paintEscalatorFrame(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const { left, top, width, height } = escalatorRect(map);
  px(ctx, 'rgba(0,0,0,0.16)', left + 2, top + height, width, 2);
  px(ctx, ESCALATOR.frame, left - 1, top, width + 2, height);
  px(ctx, ESCALATOR.stepDark, left + ESCALATOR_RAIL, top, width - ESCALATOR_RAIL * 2, height);
  // 兩側的橡膠扶手
  for (const x of [left, left + width - ESCALATOR_RAIL]) {
    px(ctx, ESCALATOR.rail, x, top, ESCALATOR_RAIL, height);
    px(ctx, ESCALATOR.railLight, x + 1, top + 2, 1, height - 4);
  }
}

// 梯級往海灘的方向（畫面下方）一直流動，頭尾是黃色的梳齒板
export function paintEscalatorSteps(ctx: CanvasRenderingContext2D, map: PixelMap, seconds: number): void {
  if (!map.beach.escalator) return;
  const { left, top, width, height } = escalatorRect(map);
  const x = left + ESCALATOR_RAIL;
  const w = width - ESCALATOR_RAIL * 2;
  const pitch = 6;
  const shift = Math.floor(seconds * 14) % pitch;
  for (let y = top + 3 + shift - pitch; y < top + height - 3; y += pitch) {
    const y0 = Math.max(top + 3, y);
    const y1 = Math.min(top + height - 3, y + pitch - 1);
    if (y1 > y0) px(ctx, ESCALATOR.step, x, y0, w, y1 - y0);
  }
  for (let gx = x + 2; gx < x + w; gx += 4) px(ctx, 'rgba(0,0,0,0.12)', gx, top + 3, 1, height - 6);
  px(ctx, ESCALATOR.comb, x, top, w, 3);
  px(ctx, ESCALATOR.comb, x, top + height - 3, w, 3);
}

// ── 海灘：木棧道、沙灘、海（浪花另外每格畫，才會動） ──

export const SEA = { deep: '#1f7fa6', mid: '#2b9cc4', shallow: '#4fc3d9', foam: '#e9fbff', wet: '#d9b97f' };
const SAND = { base: '#efd6a1', light: '#f7e4b8', dark: '#dcbf86', shell: '#f4c6b6' };

function paintBeach(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const rand = seeded(311);
  const width = map.width * TILE;
  const { deckTop, sandTop, seaTop } = map.beach;
  const doorLeft = map.beach.door[0] * TILE;
  const doorRight = map.beach.door[1] * TILE;

  // 沙灘鋪滿整片，再在上面疊木棧道與海
  px(ctx, SAND.base, 0, deckTop * TILE, width, (seaTop - deckTop) * TILE);
  for (let i = 0; i < 900; i += 1) {
    const x = Math.floor(rand() * width);
    const y = deckTop * TILE + Math.floor(rand() * (seaTop - deckTop) * TILE);
    px(ctx, rand() < 0.5 ? SAND.light : SAND.dark, x, y, 1, 1);
  }
  for (let i = 0; i < 14; i += 1) {
    px(ctx, SAND.shell, Math.floor(rand() * width), sandTop * TILE + Math.floor(rand() * (seaTop - sandTop) * TILE), 2, 1);
  }

  // 木棧道：門口往外一整排，再從門口往海邊延伸一條步道
  const deckY = deckTop * TILE;
  const deckH = (sandTop - deckTop) * TILE;
  const plank = (x: number, y: number, w: number, h: number, vertical: boolean) => {
    px(ctx, '#b48a5c', x, y, w, h);
    if (vertical) {
      for (let dx = 0; dx < w; dx += 4) px(ctx, '#8f6a43', x + dx, y, 1, h);
      for (let dy = 6; dy < h; dy += 16) px(ctx, '#8f6a43', x, y + dy, w, 1);
    } else {
      for (let dy = 0; dy < h; dy += 4) px(ctx, '#8f6a43', x, y + dy + 3, w, 1);
      for (let dx = 10; dx < w; dx += 24) px(ctx, '#8f6a43', x + dx, y, 1, h);
    }
  };
  plank(TILE * 3, deckY, width - TILE * 6, deckH - 4, false);
  px(ctx, '#7a5a38', TILE * 3, deckY + deckH - 4, width - TILE * 6, 2);
  plank(doorLeft, deckY + deckH - 4, doorRight - doorLeft, (seaTop - sandTop) * TILE - 18, true);

  // 海：越遠越深，邊緣是濕沙
  const seaY = seaTop * TILE;
  const seaH = map.height * TILE - seaY;
  px(ctx, SEA.wet, 0, seaY - 5, width, 5);
  px(ctx, SEA.shallow, 0, seaY, width, 10);
  px(ctx, SEA.mid, 0, seaY + 10, width, 18);
  px(ctx, SEA.deep, 0, seaY + 28, width, seaH - 28);
  for (let i = 0; i < 70; i += 1) {
    const y = seaY + 12 + Math.floor(rand() * (seaH - 14));
    px(ctx, 'rgba(255,255,255,0.18)', Math.floor(rand() * width), y, 3 + Math.floor(rand() * 4), 1);
  }
}

// 每一格都重畫的浪：沿著岸邊一條會前後推的白浪，海面上幾點閃光
export function paintWaves(ctx: CanvasRenderingContext2D, map: PixelMap, seconds: number): void {
  // 海從世界最左邊延伸到最右邊
  const left = map.world.x0 * TILE;
  const width = map.world.x1 * TILE;
  const seaY = map.beach.seaTop * TILE;
  const reach = Math.round(Math.sin(seconds * 0.9) * 3);
  for (let x = left; x < width; x += 2) {
    const wobble = Math.round(Math.sin(x * 0.09 + seconds * 1.6) * 1.5);
    const y = seaY - 2 - reach + wobble;
    px(ctx, SEA.foam, x, y, 2, 2);
    if ((x / 2) % 3 !== 0) px(ctx, 'rgba(233,251,255,0.55)', x, y + 3, 2, 1);
  }
  // 第二道浪，往外一點、慢一點
  for (let x = left; x < width; x += 3) {
    const y = seaY + 14 + Math.round(Math.sin(x * 0.05 - seconds * 1.1) * 2);
    px(ctx, 'rgba(233,251,255,0.5)', x, y, 2, 1);
  }
  for (let i = 0; i < 9; i += 1) {
    const phase = (seconds * 0.7 + i * 0.37) % 1;
    if (phase > 0.4) continue;
    const x = left + ((i * 157 + Math.floor(seconds / 2.7) * 61) % (width - left - 8)) + 4;
    const y = seaY + 24 + ((i * 29) % Math.max(8, map.height * TILE - seaY - 30));
    px(ctx, '#ffffff', x, y, 2, 1);
  }
}

export function paintStaticLayer(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  paintBeach(ctx, map);
  paintFloor(ctx, map);
  for (const rug of map.rugs) paintRug(ctx, rug, map.theme);
  paintWalls(ctx, map);
  paintShelves(ctx, map);
  paintStairs(ctx, map);
  paintElevatorFrame(ctx, map);
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

// ── 海灘道具 ──

// 椰子樹：樹幹在自己那格，樹冠往上長兩格多
export function paintPalm(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  const lean = variant === 1 ? -1 : 1;
  px(ctx, 'rgba(0,0,0,0.16)', x + 1, y + 12, 14, 3);
  for (let i = 0; i < 9; i += 1) {
    const tx = x + 6 + Math.round((i * lean) / 3);
    const ty = y + 13 - i * 4;
    px(ctx, '#5c3d22', tx, ty, 5, 4);
    px(ctx, '#8a5e36', tx + 1, ty, 3, 3);
    px(ctx, '#6e4a2a', tx, ty + 3, 5, 1);
  }
  const cx = x + 8 + lean * 3;
  const cy = y - 22;
  const leaf = (dx: number, dy: number, len: number, droop: number) => {
    for (let i = 0; i < len; i += 1) {
      const lx = cx + Math.round(dx * i);
      const ly = cy + Math.round(dy * i + (droop * i * i) / (len * len));
      px(ctx, '#2f6b3a', lx, ly, 3, 3);
      px(ctx, '#4fa35a', lx, ly, 2, 2);
    }
  };
  leaf(-1.2, -0.3, 10, 6);
  leaf(1.2, -0.3, 10, 6);
  leaf(-0.9, 0.4, 9, 5);
  leaf(0.9, 0.4, 9, 5);
  leaf(0.1, -0.9, 7, 2);
  px(ctx, '#6b4a2a', cx - 2, cy + 1, 3, 3);
  px(ctx, '#6b4a2a', cx + 1, cy + 2, 3, 3);
}

const UMBRELLA_STRIPES: [string, string][] = [
  ['#f25f5c', '#fff4e6'],
  ['#2fb3a6', '#fff4e6'],
];

export function paintUmbrella(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  const [a, b] = UMBRELLA_STRIPES[variant % UMBRELLA_STRIPES.length] ?? ['#f25f5c', '#fff4e6'];
  // 影子落在地上
  px(ctx, 'rgba(0,0,0,0.14)', x - 10, y + 6, 36, 8);
  px(ctx, '#e8e2d6', x + 7, y - 14, 2, 28);
  // 圓頂：一列列畫，色帶放射狀交替
  const cx = x + 8;
  const top = y - 26;
  const widths = [6, 14, 22, 28, 32, 34, 36];
  widths.forEach((w, row) => {
    const left = cx - w / 2;
    for (let i = 0; i < w; i += 1) {
      const slice = Math.floor(((left + i - cx) / (w / 2) + 1) * 3);
      px(ctx, slice % 2 === 0 ? a : b, left + i, top + row * 2, 1, 2);
    }
  });
  for (let i = 0; i < 36; i += 2) px(ctx, i % 4 === 0 ? a : b, cx - 18 + i, top + 14, 2, 2);
  px(ctx, 'rgba(255,255,255,0.35)', cx - 6, top + 3, 6, 1);
}

const LOUNGER_COLORS = ['#3e8fd9', '#f2a541', '#e86a8a'];

// 躺椅：一格寬兩格長，頭朝牆、腳朝海
export function paintLounger(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  const color = LOUNGER_COLORS[variant % LOUNGER_COLORS.length] ?? '#3e8fd9';
  px(ctx, 'rgba(0,0,0,0.14)', x + 2, y + 3, 13, 28);
  px(ctx, '#e9e4da', x + 2, y + 1, 12, 28);
  px(ctx, color, x + 3, y + 2, 10, 26);
  for (let dy = 4; dy < 26; dy += 4) px(ctx, 'rgba(255,255,255,0.45)', x + 3, y + 2 + dy, 10, 1);
  // 椅背比較高一點
  px(ctx, 'rgba(0,0,0,0.12)', x + 3, y + 9, 10, 1);
  px(ctx, '#f7f2e8', x + 5, y + 3, 6, 4);
}

// 營火：石頭圍一圈，火焰每格跳動
export function paintCampfire(ctx: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const stones: [number, number][] = [
    [2, 9],
    [5, 12],
    [9, 13],
    [12, 10],
    [11, 6],
    [3, 5],
    [7, 4],
  ];
  for (const [sx, sy] of stones) {
    px(ctx, '#7c7a75', x + sx, y + sy, 3, 2);
    px(ctx, '#a19e97', x + sx, y + sy, 2, 1);
  }
  px(ctx, '#5a3a22', x + 4, y + 9, 8, 2);
  px(ctx, '#6e4a2a', x + 5, y + 7, 6, 2);
  const flicker = Math.sin(seconds * 13) > 0 ? 1 : 0;
  const tall = Math.round(Math.sin(seconds * 7) * 1.5);
  px(ctx, '#e8572a', x + 5, y + 2 - tall, 6, 8 + tall);
  px(ctx, '#f6a531', x + 6, y + 4 - tall + flicker, 4, 5 + tall);
  px(ctx, '#ffe08a', x + 7, y + 6 - flicker, 2, 3);
  if (Math.sin(seconds * 3.1) > 0.6) px(ctx, '#f6a531', x + 9, y - 3 - tall, 1, 1);
}

export function paintLog(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, 'rgba(0,0,0,0.15)', x + 1, y + 11, 14, 2);
  px(ctx, '#5c3d22', x + 1, y + 5, 14, 7);
  px(ctx, '#8a5e36', x + 2, y + 6, 12, 4);
  px(ctx, '#a97b4c', x + 2, y + 6, 12, 1);
  px(ctx, '#d9b07a', x + 13, y + 6, 2, 5);
  px(ctx, '#b48a5c', x + 13, y + 8, 1, 1);
}

const SURF_COLORS: [string, string][] = [
  ['#2fb3a6', '#fff4e6'],
  ['#f25f5c', '#ffd166'],
];

// 插在沙裡的衝浪板
export function paintSurfboard(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  const [body, stripe] = SURF_COLORS[variant % SURF_COLORS.length] ?? ['#2fb3a6', '#fff4e6'];
  px(ctx, 'rgba(0,0,0,0.14)', x + 4, y + 12, 9, 3);
  const rows = [2, 4, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 4];
  rows.forEach((w, i) => {
    const left = x + 8 - w / 2;
    px(ctx, '#2b2135', left - 1, y - 12 + i * 2, w + 2, 2);
    px(ctx, body, left, y - 12 + i * 2, w, 2);
  });
  px(ctx, stripe, x + 7, y - 9, 2, 20);
  px(ctx, SAND.dark, x + 4, y + 13, 8, 2);
}

export function paintSandcastle(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, 'rgba(0,0,0,0.12)', x + 1, y + 12, 14, 2);
  px(ctx, '#d7b36f', x + 2, y + 6, 12, 7);
  px(ctx, '#e6c587', x + 3, y + 7, 10, 2);
  px(ctx, '#d7b36f', x + 2, y + 2, 4, 5);
  px(ctx, '#d7b36f', x + 10, y + 2, 4, 5);
  px(ctx, '#e6c587', x + 2, y + 2, 1, 1);
  px(ctx, '#e6c587', x + 4, y + 2, 1, 1);
  px(ctx, '#e6c587', x + 10, y + 2, 1, 1);
  px(ctx, '#e6c587', x + 12, y + 2, 1, 1);
  px(ctx, '#8a5e36', x + 7, y + 9, 2, 4);
  px(ctx, '#7c5a32', x + 12, y - 4, 1, 6);
  px(ctx, '#f25f5c', x + 13, y - 4, 3, 2);
}

const TOWEL_COLORS: [string, string][] = [
  ['#f2a541', '#fff4e6'],
  ['#5b6ee1', '#9fd3ff'],
];

export function paintTowel(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number): void {
  const [a, b] = TOWEL_COLORS[variant % TOWEL_COLORS.length] ?? ['#f2a541', '#fff4e6'];
  for (let i = 0; i < 4; i += 1) px(ctx, i % 2 === 0 ? a : b, x + i * 4 - 4, y + 2, 4, 24);
  px(ctx, 'rgba(0,0,0,0.12)', x - 4, y + 26, 16, 1);
}

// ── 載具：腳踏車、海灘車、小船。footX／footY 是車子貼地（或水面）的中心點 ──
// back 畫在人物後面，front 畫在人物前面（擋住腿或船身遮住下半身）

export function paintVehicle(
  ctx: CanvasRenderingContext2D,
  kind: VehicleKind,
  facing: Facing,
  footX: number,
  footY: number,
  layer: 'back' | 'front',
  seconds: number,
  moving: boolean,
): void {
  const x = Math.round(footX);
  const y = Math.round(footY);
  const side = facing === 'left' || facing === 'right';
  ctx.save();
  if (facing === 'left') {
    // 面向左：以中心水平翻轉面向右的圖
    ctx.translate(x * 2, 0);
    ctx.scale(-1, 1);
  }
  if (kind === 'bike') paintBike(ctx, x, y, side, layer, seconds, moving);
  else if (kind === 'cart') paintCart(ctx, x, y, side, layer);
  else paintBoat(ctx, x, y, side, layer, seconds, moving);
  ctx.restore();
}

function wheel(ctx: CanvasRenderingContext2D, cx: number, cy: number, spin: number): void {
  px(ctx, '#2b2d33', cx - 2, cy - 4, 5, 1);
  px(ctx, '#2b2d33', cx - 2, cy + 4, 5, 1);
  px(ctx, '#2b2d33', cx - 4, cy - 2, 1, 5);
  px(ctx, '#2b2d33', cx + 4, cy - 2, 1, 5);
  px(ctx, '#2b2d33', cx - 3, cy - 3, 1, 1);
  px(ctx, '#2b2d33', cx + 3, cy - 3, 1, 1);
  px(ctx, '#2b2d33', cx - 3, cy + 3, 1, 1);
  px(ctx, '#2b2d33', cx + 3, cy + 3, 1, 1);
  // 輪輻：騎的時候會轉
  const a = spin % 2 === 0;
  px(ctx, '#9aa3b2', cx - (a ? 2 : 0), cy - (a ? 0 : 2), a ? 5 : 1, a ? 1 : 5);
  px(ctx, '#e3e8f0', cx, cy, 1, 1);
}

function paintBike(ctx: CanvasRenderingContext2D, x: number, y: number, side: boolean, layer: 'back' | 'front', seconds: number, moving: boolean): void {
  // YouBike 的黃色車身
  const red = '#f6c945';
  const spin = moving ? Math.floor(seconds * 12) : 0;
  if (!side) {
    // 正面／背面：只看得到前輪和把手
    if (layer === 'back') {
      px(ctx, 'rgba(0,0,0,0.18)', x - 4, y - 1, 8, 2);
      px(ctx, '#2b2d33', x - 1, y - 8, 2, 8);
      px(ctx, red, x - 1, y - 12, 2, 4);
    } else {
      px(ctx, '#2b2d33', x - 6, y - 13, 12, 1);
      px(ctx, '#3a3d45', x - 7, y - 13, 2, 2);
      px(ctx, '#3a3d45', x + 5, y - 13, 2, 2);
    }
    return;
  }
  if (layer === 'front') {
    // 把手在人前面
    px(ctx, '#3a3d45', x + 5, y - 15, 3, 1);
    return;
  }
  px(ctx, 'rgba(0,0,0,0.18)', x - 11, y - 1, 22, 2);
  wheel(ctx, x - 7, y - 5, spin);
  wheel(ctx, x + 7, y - 5, spin + 1);
  // 車架：後輪 → 座墊 → 把手 → 前輪
  for (let i = 0; i <= 6; i += 1) px(ctx, red, x - 7 + i, y - 5 - Math.round(i * 0.8), 1, 1);
  for (let i = 0; i <= 8; i += 1) px(ctx, red, x - 1 + i, y - 10 + Math.round(i * 0.2), 1, 1);
  for (let i = 0; i <= 6; i += 1) px(ctx, red, x + 7 - Math.round(i * 0.3), y - 5 - i, 1, 1);
  px(ctx, red, x - 1, y - 9, 1, 4);
  px(ctx, '#2b2135', x - 3, y - 11, 4, 1);
  px(ctx, '#2b2d33', x + 5, y - 14, 1, 3);
}

function paintCart(ctx: CanvasRenderingContext2D, x: number, y: number, side: boolean, layer: 'back' | 'front'): void {
  const body = '#f2a541';
  const dark = '#c47a1f';
  if (!side) {
    if (layer === 'back') {
      px(ctx, 'rgba(0,0,0,0.16)', x - 10, y - 2, 20, 3);
      for (const wx of [x - 10, x + 7]) {
        px(ctx, '#2b2d33', wx, y - 7, 3, 6);
        px(ctx, '#2b2d33', wx, y - 17, 3, 6);
      }
      px(ctx, '#3a3d45', x - 8, y - 22, 16, 2);
      px(ctx, '#3a3d45', x - 8, y - 22, 1, 6);
      px(ctx, '#3a3d45', x + 7, y - 22, 1, 6);
      px(ctx, dark, x - 8, y - 17, 16, 13);
      px(ctx, body, x - 7, y - 16, 14, 11);
    } else {
      px(ctx, dark, x - 8, y - 7, 16, 4);
      px(ctx, body, x - 7, y - 7, 14, 2);
      px(ctx, '#fff4d6', x - 6, y - 5, 2, 1);
      px(ctx, '#fff4d6', x + 4, y - 5, 2, 1);
    }
    return;
  }
  if (layer === 'front') {
    // 車門擋住腿
    px(ctx, dark, x - 9, y - 9, 18, 5);
    px(ctx, body, x - 8, y - 9, 16, 3);
    px(ctx, '#fff4d6', x + 10, y - 9, 2, 2);
    return;
  }
  px(ctx, 'rgba(0,0,0,0.16)', x - 13, y - 2, 26, 3);
  // 防滾架
  px(ctx, '#3a3d45', x - 7, y - 22, 12, 2);
  px(ctx, '#3a3d45', x - 7, y - 22, 2, 12);
  px(ctx, '#3a3d45', x + 3, y - 22, 2, 12);
  px(ctx, dark, x - 12, y - 11, 24, 7);
  px(ctx, body, x - 11, y - 11, 22, 4);
  px(ctx, dark, x + 6, y - 14, 6, 4);
  px(ctx, '#bfe3f2', x + 7, y - 15, 2, 4);
  for (const wx of [x - 9, x + 7]) {
    px(ctx, '#2b2d33', wx - 3, y - 6, 7, 6);
    px(ctx, '#7c8088', wx - 1, y - 4, 3, 2);
  }
}

function paintBoat(ctx: CanvasRenderingContext2D, x: number, y: number, side: boolean, layer: 'back' | 'front', seconds: number, moving: boolean): void {
  const hull = '#8a5e36';
  const hullDark = '#5c3d22';
  const inside = '#c9a06b';
  const row = moving ? Math.sin(seconds * 6) : 0;
  if (!side) {
    if (layer === 'back') {
      px(ctx, 'rgba(255,255,255,0.45)', x - 8, y + 1, 16, 1);
      [6, 10, 12, 12, 12, 12, 12, 12, 12, 12, 10, 6].forEach((w, i) => px(ctx, hullDark, x - w / 2 - 1, y - 22 + i * 2, w + 2, 2));
      [4, 8, 10, 10, 10, 10, 10, 10, 10, 8, 4].forEach((w, i) => px(ctx, inside, x - w / 2, y - 20 + i * 2, w, 2));
      // 槳
      const reach = Math.round(row * 3);
      px(ctx, '#d9b07a', x - 14, y - 11 + reach, 8, 1);
      px(ctx, '#d9b07a', x + 6, y - 11 - reach, 8, 1);
    } else {
      px(ctx, hull, x - 6, y - 6, 12, 3);
      px(ctx, hullDark, x - 6, y - 3, 12, 1);
    }
    return;
  }
  if (layer === 'front') {
    // 船舷擋住下半身
    px(ctx, hull, x - 13, y - 7, 26, 4);
    px(ctx, hullDark, x - 13, y - 3, 26, 1);
    px(ctx, '#f4eee2', x - 9, y - 6, 18, 1);
    return;
  }
  // 船底的水波
  px(ctx, 'rgba(255,255,255,0.5)', x - 15, y, 30, 1);
  if (moving) {
    const trail = Math.floor(seconds * 8) % 3;
    px(ctx, 'rgba(255,255,255,0.6)', x - 18 - trail * 2, y - 1, 3, 1);
    px(ctx, 'rgba(255,255,255,0.4)', x - 22 - trail * 2, y + 1, 2, 1);
  }
  [22, 26, 28, 28, 26].forEach((w, i) => px(ctx, hullDark, x - w / 2, y - 12 + i * 2, w, 2));
  px(ctx, inside, x - 11, y - 11, 22, 4);
  // 槳：划的時候前後擺
  const sweep = Math.round(row * 4);
  for (let i = 0; i < 10; i += 1) px(ctx, '#d9b07a', x - 2 + sweep + i - 5, y - 9 + Math.round(i * 0.7), 1, 1);
  px(ctx, '#b48a5c', x - 2 + sweep + 4, y - 3, 3, 2);
}

// ── 人物：16×20 的 Q 版像素小人，四個方向 × 走路兩格，髮色與衣服可換 ──

export interface AvatarColors {
  hair: string;
  hairLight: string;
  shirt: string;
  shirtShade: string;
  // 海灘上換泳裝：顏色沿用 shirt
  outfit?: Outfit;
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

// 泳裝直接從原本的身體與腿改色：比基尼留胸前一條 + 泳褲，海灘褲只留褲子；一律打赤腳
function swimwear(body: string[], legs: string[], outfit: Outfit): string[] {
  if (outfit === 'bikini') {
    return [
      ...body.map((row, i) => (i === 1 ? row : row.replace(/[Tt]/g, 'S'))),
      ...legs.map((row, i) => row.replace(/P/g, i === 0 ? 'T' : 'S').replace(/F/g, 'S')),
    ];
  }
  return [...body.map((row) => row.replace(/[Tt]/g, 'S')), ...legs.map((row) => row.replace(/P/g, 'T').replace(/F/g, 'S'))];
}

function avatarRows(facing: Facing, frame: Frame, outfit?: Outfit): string[] {
  const head = facing === 'down' ? HEAD_DOWN : facing === 'up' ? HEAD_UP : HEAD_RIGHT;
  const front = facing === 'down' || facing === 'up';
  const body = front ? BODY_FRONT : BODY_SIDE;
  const legs = front ? LEGS_FRONT[frame] : LEGS_SIDE[frame];
  return [...head, ...(outfit ? swimwear(body, legs, outfit) : [...body, ...legs])];
}

const avatarCache = new Map<string, HTMLCanvasElement>();

export function getAvatarFrame(colors: AvatarColors, facing: Facing, frame: Frame): HTMLCanvasElement {
  const key = `${colors.hair}|${colors.shirt}|${colors.outfit ?? ''}|${facing}|${frame}`;
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
    const rows = avatarRows(facing, frame, colors.outfit);
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

// 設定頁可以挑的顏色：髮色沿用 HAIR_PALETTE，衣服多一個預設的琥珀色放在最前面
// 後面幾個要累計完成幾輪番茄鐘才解鎖（*_UNLOCK 跟顏色一一對應）
export const LOOK_HAIRS: [string, string][] = [...HAIR_PALETTE, ['#5b8adf', '#86a8ec'], ['#e86a8a', '#f59ab3'], ['#e3e8f0', '#ffffff']];
export const HAIR_UNLOCK = [0, 0, 0, 0, 0, 8, 16, 30];
export const LOOK_SHIRTS: [string, string][] = [
  ['#fbbf24', '#d99a0b'],
  ...SHIRT_PALETTE,
  ['#f4eee2', '#d9d4c8'],
  ['#2b2d33', '#15171f'],
  ['#e25a4a', '#b8402f'],
  ['#f6c945', '#c99a1f'],
];
export const SHIRT_UNLOCK = [0, 0, 0, 0, 2, 4, 6, 3, 10, 20, 40];

export function lookColors(hair: number, shirt: number): AvatarColors {
  const [h, hl] = LOOK_HAIRS[hair] ?? LOOK_HAIRS[0] ?? ['#4a2f23', '#6b4636'];
  const [s, ss] = LOOK_SHIRTS[shirt] ?? LOOK_SHIRTS[0] ?? ['#fbbf24', '#d99a0b'];
  return { hair: h, hairLight: hl, shirt: s, shirtShade: ss };
}

// 沒自己挑過顏色的人，外觀依名字決定，同一個人每次看到都一樣
export function avatarColorsFor(seed: string): AvatarColors {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const [hair, hairLight] = HAIR_PALETTE[hash % HAIR_PALETTE.length] ?? HAIR_PALETTE[0] ?? ['#4a2f23', '#6b4636'];
  const [shirt, shirtShade] = SHIRT_PALETTE[(hash >>> 4) % SHIRT_PALETTE.length] ?? SHIRT_PALETTE[0] ?? ['#2dd4bf', '#14a594'];
  return { hair, hairLight, shirt, shirtShade };
}

const SWIM_PALETTE: [string, string][] = [
  ['#f25f5c', '#c9413f'],
  ['#2fb3a6', '#1f8a80'],
  ['#ffd166', '#d9a93a'],
  ['#e86a8a', '#c04a6b'],
  ['#5b6ee1', '#4152b8'],
];

export function beachAvatar(look: number, outfit: Outfit): AvatarColors {
  const [hair, hairLight] = HAIR_PALETTE[look % HAIR_PALETTE.length] ?? ['#4a2f23', '#6b4636'];
  const [shirt, shirtShade] = SWIM_PALETTE[look % SWIM_PALETTE.length] ?? ['#f25f5c', '#c9413f'];
  return { hair, hairLight, shirt, shirtShade, outfit };
}

// 躺著曬太陽的人戴的墨鏡，畫在正面頭像的眼睛上（sx/sy 是人物圖的左上角）
export function paintSunglasses(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
  px(ctx, '#1b1d26', sx + 4, sy + 8, 8, 1);
  px(ctx, '#1b1d26', sx + 4, sy + 8, 3, 2);
  px(ctx, '#1b1d26', sx + 9, sy + 8, 3, 2);
}

