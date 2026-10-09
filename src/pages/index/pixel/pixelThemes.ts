// 各分區的主題美術：座位與碰撞跟圖書館共用同一張地圖，這裡只換地板、牆面、後牆裝飾、
// 影音牆、盆栽與桌面小物，還有每格重畫的小動態（螢火蟲、氣泡、咖啡機的蒸氣）。
// 圖書館（library）是原本的樣子，畫法留在 pixelArt；這裡的函式回傳 false 代表「這個主題沒有特別版」。

import { TILE, WALL_ROWS, type MapRug, type PixelMap, type ThemeId } from './pixelMap';
import { disc, px, seeded } from './pixelUtil';

export interface WallColors {
  cap: string;
  capLight: string;
  face: string;
  faceShade: string;
  base: string;
}

export const WALLS: Record<ThemeId, WallColors> = {
  library: { cap: '#3b3f4c', capLight: '#4c5262', face: '#d6d0c4', faceShade: '#c7c0b2', base: '#8a6a4a' },
  // 樹籬 + 原木柵欄
  forest: { cap: '#2f5d3a', capLight: '#3f7a4c', face: '#7a5a38', faceShade: '#63472b', base: '#4a3320' },
  // 深色木頂 + 紅磚
  cafe: { cap: '#4a2f23', capLight: '#6b4636', face: '#a5533c', faceShade: '#8a4230', base: '#5c3d22' },
  // 鋼板艙壁
  deepsea: { cap: '#1c2a3a', capLight: '#2f4458', face: '#5a7389', faceShade: '#4a6076', base: '#2a3b4d' },
};

type RugColors = { fill: string; border: string; dot: string };

export const RUGS: Record<ThemeId, Record<MapRug['color'], RugColors>> = {
  library: {
    oat: { fill: '#ece2cf', border: '#cdb994', dot: '#ddcfb4' },
    terracotta: { fill: '#c97b57', border: '#9f5a3d', dot: '#d89270' },
    slate: { fill: '#7b8596', border: '#5d6676', dot: '#8a94a5' },
  },
  // 泥土空地、野餐墊、木平台
  forest: {
    oat: { fill: '#c9a66b', border: '#a98850', dot: '#b8955c' },
    terracotta: { fill: '#d9534f', border: '#f4eee2', dot: '#f4eee2' },
    slate: { fill: '#b9a17a', border: '#8f7a57', dot: '#a58f69' },
  },
  cafe: {
    oat: { fill: '#3f5d52', border: '#2c443b', dot: '#4f7265' },
    terracotta: { fill: '#c97b57', border: '#9f5a3d', dot: '#d89270' },
    slate: { fill: '#7a4a3a', border: '#5a3327', dot: '#8d5a48' },
  },
  deepsea: {
    oat: { fill: '#2f6f8f', border: '#1f506b', dot: '#3f86a8' },
    terracotta: { fill: '#e0a03a', border: '#a8721f', dot: '#f0b85a' },
    slate: { fill: '#27394d', border: '#1a2836', dot: '#34495f' },
  },
};

const SKY = { glass: '#bfe3f2', shine: '#e6f5fb', bar: '#9cc9dc' };
export const WINDOW_GLASS: Record<ThemeId, { glass: string; shine: string; bar: string }> = {
  library: SKY,
  forest: { glass: '#cfeeb0', shine: '#e9f8d4', bar: '#a8d488' },
  cafe: SKY,
  deepsea: { glass: '#1f6a9a', shine: '#3f8fc0', bar: '#17507a' },
};

// 夜間整張圖乘上去的色調、影音牆發出的光
export const NIGHT_TINT: Record<ThemeId, string> = { library: '#b4a9cf', forest: '#9fb0c9', cafe: '#c4a890', deepsea: '#8f9fd0' };
export const TV_GLOW: Record<ThemeId, string> = {
  library: '90, 150, 230',
  forest: '90, 190, 220',
  cafe: '255, 200, 130',
  deepsea: '61, 220, 151',
};

function indoor(map: PixelMap): { top: number; bottom: number; width: number } {
  return { top: WALL_ROWS * TILE, bottom: map.libraryHeight * TILE, width: map.width * TILE };
}

// ── 地板 ──

export function paintThemedFloor(ctx: CanvasRenderingContext2D, map: PixelMap): boolean {
  const { top, bottom, width } = indoor(map);
  const height = bottom - top;
  if (map.theme === 'forest') {
    const rand = seeded(53);
    px(ctx, '#86b86b', 0, top, width, height);
    for (let i = 0; i < 2000; i += 1) {
      px(ctx, rand() < 0.5 ? '#9ccc7e' : '#6fa158', Math.floor(rand() * width), top + Math.floor(rand() * height), 2, 1);
    }
    for (let i = 0; i < 140; i += 1) {
      const x = Math.floor(rand() * width);
      const y = top + Math.floor(rand() * (height - 3));
      px(ctx, '#5c8f4a', x, y, 1, 3);
      px(ctx, '#5c8f4a', x + 2, y + 1, 1, 2);
    }
    const petals = ['#fff4e6', '#ffd166', '#f4a3c0'];
    for (let i = 0; i < 46; i += 1) {
      const x = Math.floor(rand() * width);
      const y = top + Math.floor(rand() * (height - 3));
      px(ctx, petals[i % petals.length] ?? '#fff4e6', x, y, 2, 2);
      px(ctx, '#e0a03a', x, y + 1, 1, 1);
    }
    return true;
  }
  if (map.theme === 'cafe') {
    // 米色與焦糖色的小方磚
    for (let y = top; y < bottom; y += 8) {
      for (let x = 0; x < width; x += 8) px(ctx, ((x + y - top) / 8) % 2 === 0 ? '#eadfc8' : '#cdb48c', x, y, 8, 8);
    }
    return true;
  }
  if (map.theme === 'deepsea') {
    const rand = seeded(29);
    px(ctx, '#44596e', 0, top, width, height);
    for (let i = 0; i < 160; i += 1) px(ctx, '#3c5064', Math.floor(rand() * width), top + Math.floor(rand() * height), 3, 1);
    // 一塊塊鋼板：接縫 + 四角鉚釘
    for (let y = top; y < bottom; y += 32) {
      px(ctx, '#2f4152', 0, y, width, 1);
      px(ctx, '#52697f', 0, y + 1, width, 1);
    }
    for (let x = 0; x < width; x += 32) {
      px(ctx, '#2f4152', x, top, 1, height);
      px(ctx, '#52697f', x + 1, top, 1, height);
      for (let y = top; y < bottom; y += 32) {
        for (const [dx, dy] of [[4, 4], [28, 4], [4, 28], [28, 28]] as const) px(ctx, '#8fa6ba', x + dx, y + dy, 1, 1);
      }
    }
    return true;
  }
  return false;
}

// ── 後牆的牆面紋理（底色已經鋪好） ──

export function paintWallFace(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const width = map.width * TILE;
  const wall = WALLS[map.theme];
  const faceH = TILE * 2 - 2;
  if (map.theme === 'forest') {
    // 一根根直立的原木
    for (let x = 0; x < width; x += 8) {
      px(ctx, wall.faceShade, x, TILE, 1, faceH);
      px(ctx, '#8f6a43', x + 3, TILE, 1, faceH);
    }
  } else if (map.theme === 'cafe') {
    const mortar = '#c98f78';
    for (let row = 0, y = TILE; y < TILE + faceH; row += 1, y += 5) {
      px(ctx, mortar, 0, y + 4, width, 1);
      for (let x = row % 2 === 0 ? 0 : 5; x < width; x += 10) px(ctx, mortar, x, y, 1, 4);
    }
  } else if (map.theme === 'deepsea') {
    for (let x = 0; x < width; x += 32) px(ctx, wall.faceShade, x, TILE, 1, faceH);
    for (let x = 4; x < width; x += 8) {
      px(ctx, '#8fa6ba', x, TILE + 2, 1, 1);
      px(ctx, '#8fa6ba', x, TILE + faceH - 3, 1, 1);
    }
  }
}

// ── 後牆上取代書櫃的裝飾 ──

// 深海艙的舷窗圓心（每格重畫魚和氣泡時也會用到）
export function portholes(map: PixelMap): { cx: number; cy: number }[] {
  const list: { cx: number; cy: number }[] = [];
  for (const [x0, x1] of map.shelves) {
    const left = x0 * TILE;
    const width = (x1 - x0) * TILE;
    const count = Math.max(1, Math.floor(width / (TILE * 2.5)));
    for (let i = 0; i < count; i += 1) list.push({ cx: Math.round(left + (width * (i + 0.5)) / count), cy: TILE + 16 });
  }
  return list;
}

function paintTreeline(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const bottom = TILE * 3 - 2;
  for (const [x0, x1] of map.shelves) {
    const left = x0 * TILE;
    const width = (x1 - x0) * TILE;
    const rand = seeded(77 + x0);
    ctx.save();
    ctx.beginPath();
    ctx.rect(left, 0, width, TILE * 3);
    ctx.clip();
    px(ctx, '#1f4428', left, TILE, width, bottom - TILE);
    for (let cx = left + 6; cx < left + width; cx += 9 + Math.floor(rand() * 5)) {
      const r = 8 + Math.floor(rand() * 4);
      const cy = TILE + 11 + Math.floor(rand() * 5);
      px(ctx, '#4a3320', cx - 1, cy + r - 3, 3, bottom - (cy + r - 3));
      disc(ctx, '#24552e', cx, cy, r);
      disc(ctx, '#3d8748', cx - 1, cy - 1, r - 2);
      disc(ctx, '#57a862', cx - 2, cy - 3, Math.max(2, r - 6));
    }
    ctx.restore();
  }
}

function paintCafeShelves(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  const jars = ['#e3b04b', '#c46a55', '#7f9a83', '#f4eee2', '#6f7f9e'];
  for (const [x0, x1] of map.shelves) {
    const left = x0 * TILE;
    const width = (x1 - x0) * TILE;
    const rand = seeded(211 + x0);
    for (const boardY of [TILE + 13, TILE + 27]) {
      px(ctx, '#5c3d22', left + 3, boardY, width - 6, 2);
      px(ctx, '#8a5e36', left + 3, boardY, width - 6, 1);
      let x = left + 5;
      while (x < left + width - 9) {
        const pick = rand();
        if (pick < 0.3) {
          // 杯子
          px(ctx, '#ffffff', x, boardY - 3, 3, 3);
          px(ctx, '#d9d4c8', x + 3, boardY - 2, 1, 1);
          x += 5;
        } else if (pick < 0.6) {
          // 玻璃罐
          px(ctx, jars[Math.floor(rand() * jars.length)] ?? '#e3b04b', x, boardY - 5, 3, 5);
          px(ctx, '#3d2b22', x, boardY - 6, 3, 1);
          x += 5;
        } else if (pick < 0.78) {
          // 咖啡豆袋
          px(ctx, '#6b4428', x, boardY - 6, 4, 6);
          px(ctx, '#f4eee2', x + 1, boardY - 4, 2, 2);
          x += 6;
        } else if (pick < 0.9) {
          // 小盆栽
          px(ctx, '#4fa35a', x, boardY - 6, 3, 3);
          px(ctx, '#c97b57', x, boardY - 3, 3, 3);
          x += 5;
        } else {
          x += 4;
        }
      }
    }
  }
}

function paintPortholes(ctx: CanvasRenderingContext2D, map: PixelMap): void {
  for (const { cx, cy } of portholes(map)) {
    disc(ctx, '#1c2a3a', cx, cy, 12);
    disc(ctx, '#a9bccb', cx, cy, 11);
    disc(ctx, '#6f879b', cx, cy, 9);
    // 玻璃後面的海：越下面越亮
    for (let row = -8; row <= 8; row += 1) {
      const half = Math.floor(Math.sqrt(64 - row * row));
      px(ctx, row < -3 ? '#0f3352' : row < 3 ? '#17507a' : '#1f6a9a', cx - half, cy + row, half * 2 + 1, 1);
    }
    for (const [dx, dy] of [[-7, -7], [7, -7], [-7, 7], [7, 7]] as const) px(ctx, '#e3e8f0', cx + dx, cy + dy, 1, 1);
    px(ctx, 'rgba(255,255,255,0.35)', cx - 5, cy - 6, 3, 1);
    px(ctx, 'rgba(255,255,255,0.35)', cx - 6, cy - 5, 1, 2);
  }
}

export function paintBackWall(ctx: CanvasRenderingContext2D, map: PixelMap): boolean {
  if (map.theme === 'forest') paintTreeline(ctx, map);
  else if (map.theme === 'cafe') paintCafeShelves(ctx, map);
  else if (map.theme === 'deepsea') paintPortholes(ctx, map);
  else return false;
  return true;
}

// ── 影音牆的位置：森林是小瀑布、咖啡店是黑板菜單、深海艙是控制台 ──

export function paintThemedTv(ctx: CanvasRenderingContext2D, map: PixelMap): boolean {
  const left = map.tv.tx * TILE;
  const width = map.tv.w * TILE;
  if (map.theme === 'forest') {
    px(ctx, '#55595f', left + 3, TILE + 1, width - 6, TILE * 2 - 3);
    px(ctx, '#7c8088', left + 3, TILE + 1, width - 6, 3);
    px(ctx, '#3f9fc4', left + 8, TILE + 4, width - 16, TILE * 2 - 6);
    px(ctx, '#58b8d8', left + 10, TILE + 4, width - 22, TILE * 2 - 6);
    // 兩側的石頭與青苔
    for (const x of [left + 3, left + width - 9]) {
      px(ctx, '#6b6f76', x, TILE + 8, 6, 8);
      px(ctx, '#868b93', x + 1, TILE + 8, 3, 2);
      px(ctx, '#4fa35a', x, TILE + 18, 6, 3);
    }
    return true;
  }
  if (map.theme === 'cafe') {
    px(ctx, '#5c3d22', left + 4, TILE + 2, width - 8, 27);
    px(ctx, '#2b3a34', left + 6, TILE + 4, width - 12, 23);
    px(ctx, '#f4eee2', left + 10, TILE + 7, 22, 2);
    for (let i = 0; i < 4; i += 1) {
      const y = TILE + 12 + i * 4;
      px(ctx, '#cfd8cf', left + 10, y, 14 + ((i * 7) % 13), 1);
      px(ctx, '#fbbf24', left + width - 20, y, 6, 1);
    }
    // 粉筆畫的咖啡杯
    px(ctx, '#f4eee2', left + width - 22, TILE + 6, 8, 1);
    px(ctx, '#f4eee2', left + width - 21, TILE + 7, 6, 3);
    px(ctx, '#2b3a34', left + width - 20, TILE + 7, 4, 2);
    return true;
  }
  if (map.theme === 'deepsea') {
    px(ctx, '#1c2a3a', left + 2, TILE + 1, width - 4, TILE * 2 - 3);
    px(ctx, '#0e1a24', left + 5, TILE + 3, width - 10, 19);
    const cx = left + 17;
    const cy = TILE + 12;
    for (let i = 0; i < 28; i += 1) {
      const a = (i / 28) * Math.PI * 2;
      px(ctx, '#2a9d6e', Math.round(cx + Math.cos(a) * 7), Math.round(cy + Math.sin(a) * 7), 1, 1);
      if (i % 2 === 0) px(ctx, '#1f7552', Math.round(cx + Math.cos(a) * 4), Math.round(cy + Math.sin(a) * 4), 1, 1);
    }
    px(ctx, '#1f7552', cx - 7, cy, 15, 1);
    px(ctx, '#1f7552', cx, cy - 7, 1, 15);
    // 右側的數值長條
    [9, 5, 12, 7, 10].forEach((h, i) => px(ctx, i % 2 === 0 ? '#4fc3d9' : '#3ddc97', left + 34 + i * 6, TILE + 19 - h, 4, h));
    // 下面一排按鈕
    ['#e25a4a', '#fbbf24', '#3ddc97', '#4fc3d9', '#e3e8f0', '#fbbf24', '#e25a4a'].forEach((color, i) =>
      px(ctx, color, left + 8 + i * 9, TILE + 25, 3, 2),
    );
    return true;
  }
  return false;
}

// ── 會跟人物排前後的小東西 ──

// 盆栽的主題版：森林是灌木／蘑菇，深海艙是珊瑚缸
export function paintThemedPlant(ctx: CanvasRenderingContext2D, theme: ThemeId, x: number, y: number, variant: number): boolean {
  if (theme === 'forest') {
    px(ctx, 'rgba(0,0,0,0.14)', x + 2, y + 13, 12, 2);
    if (variant === 1) {
      px(ctx, '#f4eee2', x + 6, y + 8, 4, 6);
      px(ctx, '#d9d4c8', x + 9, y + 8, 1, 6);
      [[4, 8], [2, 12], [1, 14], [1, 14], [2, 12]].forEach(([offset = 0, w = 0], i) => px(ctx, '#d9534f', x + offset, y + 3 + i, w, 1));
      px(ctx, '#fff4e6', x + 4, y + 5, 2, 2);
      px(ctx, '#fff4e6', x + 9, y + 4, 2, 2);
      px(ctx, '#fff4e6', x + 12, y + 6, 1, 1);
    } else {
      disc(ctx, '#24552e', x + 8, y + 8, 6);
      disc(ctx, '#3d8748', x + 7, y + 7, 4);
      disc(ctx, '#57a862', x + 6, y + 5, 2);
      px(ctx, '#e25a4a', x + 10, y + 8, 2, 2);
      px(ctx, '#e25a4a', x + 5, y + 10, 2, 2);
    }
    return true;
  }
  if (theme === 'deepsea') {
    const [body, tip] = variant === 1 ? ['#2fb3a6', '#7fe0d4'] : ['#ff7f9f', '#ffb3c6'];
    px(ctx, 'rgba(0,0,0,0.18)', x + 3, y + 14, 10, 1);
    px(ctx, '#3a4d60', x + 4, y + 11, 8, 4);
    px(ctx, '#8fa6ba', x + 4, y + 11, 8, 1);
    px(ctx, body, x + 7, y + 3, 2, 8);
    px(ctx, body, x + 4, y + 5, 2, 5);
    px(ctx, body, x + 4, y + 9, 4, 2);
    px(ctx, body, x + 10, y + 4, 2, 6);
    px(ctx, body, x + 9, y + 8, 2, 2);
    px(ctx, tip, x + 7, y + 2, 2, 1);
    px(ctx, tip, x + 4, y + 4, 2, 1);
    px(ctx, tip, x + 10, y + 3, 2, 1);
    return true;
  }
  return false;
}

// 森林裡的高腳椅換成樹樁
export function paintStump(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, 'rgba(0,0,0,0.16)', x + 3, y + 14, 11, 1);
  px(ctx, '#5c3d22', x + 3, y + 7, 10, 7);
  px(ctx, '#7a5236', x + 5, y + 8, 1, 6);
  px(ctx, '#7a5236', x + 9, y + 9, 1, 5);
  px(ctx, '#6b4428', x + 3, y + 3, 10, 5);
  px(ctx, '#6b4428', x + 4, y + 2, 8, 7);
  px(ctx, '#d9b07a', x + 4, y + 3, 8, 5);
  px(ctx, '#b48a5c', x + 6, y + 4, 4, 3);
  px(ctx, '#d9b07a', x + 7, y + 5, 2, 1);
}

// 森林裡的懶骨頭是紅蘑菇：在紅色的懶骨頭上補白點
export const MUSHROOM_POUF = '#d9534f';
export function paintMushroomDots(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, '#fff4e6', x + 4, y + 6, 2, 2);
  px(ctx, '#fff4e6', x + 9, y + 4, 2, 2);
  px(ctx, '#fff4e6', x + 12, y + 8, 2, 1);
  px(ctx, '#fff4e6', x + 2, y + 9, 1, 1);
}

// 咖啡店的桌上放咖啡與可頌（其他主題沿用書本 + 檯燈）
export function paintThemedTableTop(ctx: CanvasRenderingContext2D, theme: ThemeId, x: number, y: number): boolean {
  if (theme !== 'cafe') return false;
  px(ctx, '#e9e4da', x + 5, y + 12, 8, 2);
  px(ctx, '#ffffff', x + 6, y + 8, 6, 5);
  px(ctx, '#6b4428', x + 7, y + 9, 4, 1);
  px(ctx, '#d9d4c8', x + 12, y + 10, 1, 2);
  px(ctx, '#e9e4da', x + 20, y + 8, 8, 5);
  px(ctx, '#d99a4e', x + 21, y + 9, 6, 3);
  px(ctx, '#b87a34', x + 23, y + 9, 1, 3);
  return true;
}

// 咖啡店的吧台上有義式咖啡機、一疊杯子和點心
export function paintCounterTop(ctx: CanvasRenderingContext2D, theme: ThemeId, x: number, y: number, h: number): void {
  if (theme !== 'cafe') return;
  px(ctx, '#2a2f3a', x + 3, y + 3, 10, 10);
  px(ctx, '#c3cad6', x + 4, y + 4, 8, 3);
  px(ctx, '#fbbf24', x + 5, y + 9, 1, 1);
  px(ctx, '#e25a4a', x + 10, y + 9, 1, 1);
  px(ctx, '#15171f', x + 6, y + 10, 4, 2);
  for (let i = 0; i < 3; i += 1) px(ctx, '#ffffff', x + 5 + (i % 2) * 4, y + 20 + i * 5, 3, 3);
  px(ctx, '#e9e4da', x + 3, y + h - 22, 10, 6);
  px(ctx, '#d99a4e', x + 5, y + h - 21, 3, 2);
  px(ctx, '#c46a55', x + 9, y + h - 20, 3, 2);
}

// ── 每格重畫的小動態 ──

// under：畫在家具與人物底下（牆上的東西）；over：畫在最上面、夜間打光之後
export function paintAmbient(ctx: CanvasRenderingContext2D, map: PixelMap, seconds: number, dark: boolean, layer: 'under' | 'over'): void {
  if (map.theme === 'forest') {
    if (layer === 'under') {
      // 瀑布的水流
      const left = map.tv.tx * TILE + 10;
      const span = map.tv.w * TILE - 22;
      for (let i = 0; i < 9; i += 1) {
        const y = TILE + 4 + ((seconds * 22 + i * 7) % (TILE * 2 - 9));
        px(ctx, 'rgba(255,255,255,0.6)', left + ((i * 11) % span), Math.floor(y), 1, 3);
      }
      px(ctx, '#e9fbff', map.tv.tx * TILE + 8, TILE * 3 - 4, map.tv.w * TILE - 16, 2);
    } else if (dark) {
      // 螢火蟲：慢慢飄、一閃一閃
      const { top, bottom, width } = indoor(map);
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 14; i += 1) {
        const glow = (Math.sin(seconds * 1.7 + i * 2.1) + 1) / 2;
        if (glow < 0.25) continue;
        const x = TILE * 2 + ((i * 97) % (width - TILE * 4)) + Math.sin(seconds * 0.4 + i) * 10;
        const y = top + 12 + ((i * 53) % (bottom - top - TILE * 3)) + Math.cos(seconds * 0.3 + i * 1.3) * 8;
        px(ctx, `rgba(255, 240, 140, ${glow * 0.35})`, Math.round(x) - 1, Math.round(y) - 1, 3, 3);
        px(ctx, `rgba(255, 250, 190, ${glow})`, Math.round(x), Math.round(y), 1, 1);
      }
      ctx.restore();
    }
  } else if (map.theme === 'deepsea' && layer === 'under') {
    // 舷窗外游過的魚和往上冒的氣泡
    portholes(map).forEach(({ cx, cy }, i) => {
      const swim = (seconds * 3 + i * 5) % 26;
      if (swim < 11) {
        const x = Math.round(cx - 6 + swim);
        const y = cy + ((i % 3) - 1) * 3;
        px(ctx, i % 2 === 0 ? '#f2a541' : '#ff7f9f', x, y, 3, 2);
        px(ctx, i % 2 === 0 ? '#f2a541' : '#ff7f9f', x - 1, y - (Math.floor(seconds * 4) % 2), 1, 2);
      }
      const rise = (seconds * 5 + i * 3) % 12;
      px(ctx, 'rgba(255,255,255,0.7)', cx - 3 + (i % 3) * 3, Math.round(cy + 6 - rise), 1, 1);
    });
    // 雷達上閃爍的光點
    if (Math.floor(seconds * 2) % 2 === 0) px(ctx, '#b6ffd9', map.tv.tx * TILE + 20, TILE + 9, 2, 2);
  } else if (map.theme === 'cafe' && layer === 'over') {
    // 咖啡機冒出來的蒸氣
    const counter = map.props.find((prop) => prop.kind === 'counter');
    if (!counter) return;
    for (let i = 0; i < 3; i += 1) {
      const rise = (seconds * 5 + i * 3.3) % 10;
      const x = counter.tx * TILE + 6 + i * 2 + Math.round(Math.sin(seconds * 2 + i) * 1);
      px(ctx, `rgba(255,255,255,${0.55 - rise * 0.05})`, x, Math.round(counter.ty * TILE + 2 - rise), 1, 2);
    }
  }
}
