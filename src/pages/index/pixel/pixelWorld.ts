// 圖書館外面的世界：左邊 101 一帶、右邊動物園站（搭去動物園）、上面夜市捷運站（搭去士林夜市、基隆廟口夜市；下面的海灘在 pixelMap 裡）。
// 座標跟圖書館同一套（格，1 格 = 16px），圖書館在 (0,0)～(32, libraryHeight)，戶外區用到負的座標。
// 這裡放資料（家具、會動的人車動物）和畫法；碰撞照樣交給 mapObstacles。

import { MIAOKOU_ITEMS } from './miaokou';
import { SHILIN_ITEMS } from './shilin';
import { TILE } from './pixelMap';
import { px, seeded } from './pixelUtil';

export const WORLD_LEFT = 16;
export const WORLD_RIGHT = 16;
export const WORLD_TOP = 12;

export type OutdoorAreaId = 'taipei101' | 'zoo' | 'nightmarket';

export type OutdoorKind =
  | 'tower101'
  | 'office'
  | 'mrt'
  | 'marketMrt'
  | 'zooMrt'
  | 'f1station'
  | 'streetTree'
  | 'youbike'
  | 'bench'
  | 'lanternPole'
  | 'lanternString'
  | 'streetLamp'
  | 'zooTree';

export interface OutdoorProp {
  kind: OutdoorKind;
  tx: number;
  ty: number;
  w: number;
  h: number;
  blocks: boolean;
  variant?: number;
}

export type WalkerKind = 'person' | 'taxi';

// 會動的東西：在兩個點之間來回（taxi 是單向一直開，到頭從另一端再出現）
export interface Walker {
  kind: WalkerKind;
  from: { x: number; y: number };
  to: { x: number; y: number };
  speed: number;
  phase: number;
  look: number;
  loop?: boolean;
}

export interface OutdoorWorld {
  // 整個世界的範圍（格）
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  props: OutdoorProp[];
  walkers: Walker[];
  // 在畫面上用名牌標出來的地點
  signs: { x: number; y: number; text: { 'zh-TW': string; 'en-US': string } }[];
  // 捷運站入口：走到這裡會跳出選分區的面板
  mrtTrigger: { x: number; y: number };
  // 夜市捷運站入口：走到這裡選要去士林夜市還是基隆廟口夜市
  marketMrtTrigger: { x: number; y: number };
  // 動物園站入口：走到這裡搭文湖線去動物園
  zooMrtTrigger: { x: number; y: number };
  // F1 站入口：走到這裡可以去 F1 賽車場
  f1Trigger: { x: number; y: number };
  // 圖書館後牆的門（通往夜市捷運站），x 範圍
  backDoor: [number, number];
}

export const BACK_DOOR: [number, number] = [29, 31];

// 夜市買得到的東西（士林 shilin.ts、廟口 miaokou.ts、撈金魚）。新增要先加進後端 allowedShopItems（位置訊息會帶手上拿的東西），不然整則位置會被丟掉
export type ShopItemId =
  | 'icecreamRoll'
  | 'mangoIce'
  | 'sausage'
  | 'bigSausage'
  | 'corn'
  | 'taroBall'
  | 'tofuPudding'
  | 'chicken'
  | 'saltyChicken'
  | 'sweetPotatoBall'
  | 'boba'
  | 'papayaMilk'
  | 'lemonTea'
  | 'tofu'
  | 'luwei'
  | 'plush'
  | 'balloon'
  | 'oyster'
  | 'misua'
  | 'goldfish'
  | 'tropicalFish'
  | 'pufferfish'
  // 基隆廟口夜市（miaokou.ts）
  | 'nutritionSandwich'
  | 'tempura'
  | 'dingBianCuo'
  | 'bubbleIce'
  | 'miniSausage'
  | 'eelSoup'
  | 'douqianSoup'
  | 'braisedPorkRice'
  | 'curryRice'
  | 'butterCrab'
  | 'mungBeanCake'
  | 'pineappleCake'
  | 'taroMochi'
  // 士林夜市（shilin.ts）
  | 'bigPancake'
  | 'shengjianbao'
  | 'frogEggs'
  | 'taroIce'
  | 'squid'
  | 'snowIce'
  | 'coldNoodles';

export interface ShopItem {
  id: ShopItemId;
  emoji: string;
  price: number;
  name: { 'zh-TW': string; 'en-US': string };
}

// 士林夜市的金魚池可以釣魚：釣一次 FISHING_PRICE，釣到的魚裝袋拿在手上（跟小吃一樣，id 也要在後端 allowedShopItems 裡）
export const FISHING_PRICE = 20;
export const FISH: { id: ShopItemId; emoji: string; chance: number; name: { 'zh-TW': string; 'en-US': string } }[] = [
  { id: 'goldfish', emoji: '🐟', chance: 0.7, name: { 'zh-TW': '一條小金魚', 'en-US': 'a little goldfish' } },
  { id: 'tropicalFish', emoji: '🐠', chance: 0.25, name: { 'zh-TW': '一條熱帶魚', 'en-US': 'a tropical fish' } },
  { id: 'pufferfish', emoji: '🐡', chance: 0.05, name: { 'zh-TW': '超稀有的河豚！', 'en-US': 'a rare pufferfish!' } },
];

export const SHOP_ITEM_EMOJI: Record<ShopItemId, string> = Object.fromEntries([
  ...MIAOKOU_ITEMS.map((item) => [item.id, item.emoji]),
  ...SHILIN_ITEMS.map((item) => [item.id, item.emoji]),
  ...FISH.map((fish) => [fish.id, fish.emoji]),
]) as Record<ShopItemId, string>;

export function createOutdoorWorld(libraryWidth: number, libraryHeight: number, worldBottom: number): OutdoorWorld {
  const x0 = -WORLD_LEFT;
  const x1 = libraryWidth + WORLD_RIGHT;
  const y0 = -WORLD_TOP;
  const R = libraryWidth;
  const prop = (kind: OutdoorKind, tx: number, ty: number, w = 1, h = 1, blocks = true, variant?: number): OutdoorProp => ({
    kind,
    tx,
    ty,
    w,
    h,
    blocks,
    ...(variant === undefined ? {} : { variant }),
  });

  const props: OutdoorProp[] = [
    // ── 101 一帶 ──
    prop('tower101', -15, 6, 4, 3),
    prop('office', -16, -12, 5, 4, true, 0),
    prop('office', -16, -6, 4, 4, true, 1),
    prop('mrt', -6, 0, 3, 2),
    // F1 站：搭車到另一張獨立的 F1 賽車場地圖
    prop('f1station', -16, 13, 4, 2),
    // YouBike 站：圖書館裡、101、夜市、動物園各一個，可以借車、還車
    prop('youbike', -5, 12, 3, 1),
    prop('youbike', 19, 15, 3, 1),
    prop('youbike', 26, -2, 3, 1),
    prop('youbike', R + 1, 7, 3, 1),
    ...[-10, -5, 4, 9, 14].map((y) => prop('streetTree', -2, y)),
    ...[-10, -2, 4].map((y) => prop('streetTree', -13, y)),
    // ── 夜市捷運站（以前的士林夜市；士林夜市搬成獨立地圖）──
    // 中間是捷運站出入口（走到前面選士林或廟口），兩邊留著燈籠串、行道樹和長椅
    prop('marketMrt', 12, -10, 8, 4),
    ...[0, 8, 24, 31].map((x) => prop('lanternPole', x, -3, 1, 1, true)),
    // 燈柱之間拉一串燈籠橫過走道（不擋路）；w = 到下一根燈柱的格數
    ...[
      [0, 8],
      [24, 7],
    ].map(([x, w]) => prop('lanternString', x as number, -3, w as number, 1, false)),
    ...[2, 7, 25, 30].map((x) => prop('streetTree', x, -10)),
    prop('bench', 4, -7, 2, 1),
    prop('bench', 26, -7, 2, 1),
    ...[10, 21].map((x) => prop('streetLamp', x, -6)),
    // ── 路燈：101 的人行道、動物園步道、海灘木棧道（晚上會亮） ──
    ...[-8, 0, 7, 12].map((y) => prop('streetLamp', -2, y)),
    ...[-7, 2].map((y) => prop('streetLamp', -13, y)),
    ...[-3, 8].map((y) => prop('streetLamp', R + 5, y)),
    prop('streetLamp', 1, libraryHeight),
    prop('streetLamp', R - 2, libraryHeight),
    // ── 動物園站（動物園搬成獨立地圖；這裡是搭文湖線過去的車站，旁邊留著樹）──
    prop('zooMrt', R + 5, 1, 8, 4),
    prop('zooTree', R + 2, 2),
    prop('zooTree', R + 3, 15),
    prop('zooTree', R + 14, 7),
    ...[-9, -4, 12].map((y) => prop('zooTree', R + 13, y)),
    ...[-10, -6].map((y) => prop('zooTree', R + 7, y)),
    prop('bench', R + 8, 9, 2, 1),
  ];

  const walkers: Walker[] = [
    // 101 前面的路：計程車上下開，行人走人行道
    { kind: 'taxi', from: { x: -8.5, y: y0 - 1 }, to: { x: -8.5, y: libraryHeight + 1 }, speed: 3.2, phase: 0, look: 0, loop: true },
    { kind: 'taxi', from: { x: -10.2, y: libraryHeight + 1 }, to: { x: -10.2, y: y0 - 1 }, speed: 2.6, phase: 0.5, look: 1, loop: true },
    { kind: 'person', from: { x: -3.5, y: -11 }, to: { x: -3.5, y: 11 }, speed: 1.1, phase: 0, look: 2 },
    { kind: 'person', from: { x: -6.5, y: 4 }, to: { x: -1, y: 4 }, speed: 0.9, phase: 0.3, look: 5 },
    // 進出夜市捷運站的人
    { kind: 'person', from: { x: 1, y: -4.6 }, to: { x: 30, y: -4.6 }, speed: 1, phase: 0, look: 1 },
    { kind: 'person', from: { x: 28, y: -1.6 }, to: { x: 3, y: -1.6 }, speed: 0.8, phase: 0.4, look: 3 },
    { kind: 'person', from: { x: 14.5, y: -5.4 }, to: { x: 14.5, y: -0.8 }, speed: 0.7, phase: 0.7, look: 6 },
    { kind: 'person', from: { x: 17.6, y: -0.8 }, to: { x: 17.6, y: -5.4 }, speed: 0.9, phase: 0.2, look: 4 },
    // 往動物園站的人
    { kind: 'person', from: { x: R + 3, y: -3 }, to: { x: R + 3, y: 13 }, speed: 0.9, phase: 0.1, look: 6 },
  ];

  return {
    x0,
    y0,
    x1,
    y1: worldBottom,
    props,
    walkers,
    signs: [
      { x: -13, y: -1.6, text: { 'zh-TW': '台北 101', 'en-US': 'Taipei 101' } },
      { x: -4.5, y: -0.4, text: { 'zh-TW': '捷運 台北101/世貿站', 'en-US': 'MRT Taipei 101' } },
      { x: -14, y: 12.4, text: { 'zh-TW': '🏁 F1 站', 'en-US': '🏁 F1 Station' } },
      { x: 16, y: -11.6, text: { 'zh-TW': '🏮 夜市捷運站（士林／廟口）', 'en-US': '🏮 Night Market MRT (Shilin / Miaokou)' } },
      { x: R + 9, y: -0.6, text: { 'zh-TW': '🐼 捷運 動物園站（文湖線）', 'en-US': '🐼 MRT Taipei Zoo (Brown Line)' } },
    ],
    mrtTrigger: { x: -4.5, y: 2.5 },
    marketMrtTrigger: { x: 16, y: -5.3 },
    zooMrtTrigger: { x: R + 9, y: 5.7 },
    f1Trigger: { x: -14, y: 15.6 },
    backDoor: BACK_DOOR,
  };
}

export function outdoorAreaAt(world: OutdoorWorld, libraryWidth: number, libraryHeight: number, x: number, y: number): OutdoorAreaId | null {
  if (y >= libraryHeight - 0.5) return null;
  if (x < 0) return 'taipei101';
  if (x >= libraryWidth) return 'zoo';
  if (y < 0) return 'nightmarket';
  return null;
}

// 走動的東西此刻在哪
export function walkerPose(walker: Walker, seconds: number): { x: number; y: number; dx: number; dy: number } {
  const dx = walker.to.x - walker.from.x;
  const dy = walker.to.y - walker.from.y;
  const length = Math.hypot(dx, dy) || 1;
  const lap = length / walker.speed;
  if (walker.loop) {
    const t = ((seconds / lap + walker.phase) % 1 + 1) % 1;
    return { x: walker.from.x + dx * t, y: walker.from.y + dy * t, dx, dy };
  }
  const t = ((seconds / (lap * 2) + walker.phase) % 1 + 1) % 1;
  const forward = t < 0.5;
  const f = forward ? t * 2 : 2 - t * 2;
  return { x: walker.from.x + dx * f, y: walker.from.y + dy * f, dx: forward ? dx : -dx, dy: forward ? dy : -dy };
}

// ── 地面：101 是人行道和馬路、夜市是紅磚、動物園是草地，海灘往兩側延伸 ──

export function paintOutdoorGround(ctx: CanvasRenderingContext2D, world: OutdoorWorld, libraryWidth: number, libraryHeight: number, seaTop: number): void {
  const rand = seeded(523);
  const T = TILE;
  const left = world.x0 * T;
  const right = world.x1 * T;
  const top = world.y0 * T;
  const libW = libraryWidth * T;
  const libH = libraryHeight * T;

  // 101：淺灰人行道方磚
  px(ctx, '#c9c6bf', left, top, -left, libH - top);
  for (let y = top; y < libH; y += 16) {
    for (let x = left; x < 0; x += 16) {
      px(ctx, '#b9b5ad', x, y, 16, 1);
      px(ctx, '#b9b5ad', x, y, 1, 16);
    }
  }
  // 馬路（直的）+ 斑馬線
  const roadL = -11 * T;
  const roadW = 4 * T;
  px(ctx, '#4a4d55', roadL, top, roadW, libH - top);
  px(ctx, '#e3e0d6', roadL - 2, top, 2, libH - top);
  px(ctx, '#e3e0d6', roadL + roadW, top, 2, libH - top);
  for (let y = top; y < libH; y += 24) px(ctx, '#f2d36b', roadL + roadW / 2 - 1, y, 2, 12);
  for (let x = roadL + 2; x < roadL + roadW - 2; x += 8) px(ctx, '#f4f2ea', x, 6 * T, 5, 2 * T);

  // 夜市捷運站前：紅磚
  px(ctx, '#8f4a3c', 0, top, libW, -top);
  for (let y = top; y < 0; y += 8) {
    const offset = (y / 8) % 2 === 0 ? 0 : 8;
    px(ctx, '#7a3d31', 0, y + 7, libW, 1);
    for (let x = offset; x < libW; x += 16) px(ctx, '#7a3d31', x, y, 1, 7);
  }

  // 動物園：草地 + 泥土步道
  px(ctx, '#7fb35f', libW, top, right - libW, libH - top);
  for (let i = 0; i < 900; i += 1) {
    px(ctx, rand() < 0.5 ? '#8fc46e' : '#6c9e50', libW + Math.floor(rand() * (right - libW)), top + Math.floor(rand() * (libH - top)), 2, 1);
  }
  px(ctx, '#c9a66b', libW, 10 * T, 6 * T, 2 * T);
  px(ctx, '#c9a66b', libW + 4 * T, top, 2 * T, libH - top);

  // 海灘往兩側延伸：沙灘到海
  for (const [x, w] of [
    [left, -left],
    [libW, right - libW],
  ] as const) {
    px(ctx, '#efd6a1', x, libH, w, seaTop * T - libH);
    for (let i = 0; i < 260; i += 1) px(ctx, rand() < 0.5 ? '#f7e4b8' : '#dcbf86', x + Math.floor(rand() * w), libH + Math.floor(rand() * (seaTop * T - libH)), 1, 1);
    const seaY = seaTop * T;
    const seaH = world.y1 * T - seaY;
    px(ctx, '#d9b97f', x, seaY - 5, w, 5);
    px(ctx, '#4fc3d9', x, seaY, w, 10);
    px(ctx, '#2b9cc4', x, seaY + 10, w, 18);
    px(ctx, '#1f7fa6', x, seaY + 28, w, seaH - 28);
  }
}

// 圖書館的後牆開一道門通往夜市（畫在圖書館底圖上面）
export function paintBackDoor(ctx: CanvasRenderingContext2D, door: [number, number]): void {
  const x = door[0] * TILE;
  const w = (door[1] - door[0]) * TILE;
  px(ctx, '#2a2f3a', x - 2, 0, w + 4, 3 * TILE);
  px(ctx, '#6b4428', x, 0, w, 3 * TILE);
  px(ctx, '#9a6a43', x + 3, 2, w - 6, 3 * TILE - 4);
  for (let y = 6; y < 3 * TILE - 4; y += 5) px(ctx, '#8a5e36', x + 4, y, w - 8, 1);
}

// ── 戶外的東西（跟人物一起排前後） ──

function paintTower101(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, seconds: number, night: boolean): void {
  // 底座（佔地那幾格）往上疊八節，越上面越窄，最上面是尖塔
  const cx = x + w / 2;
  const base = y + 3 * TILE;
  px(ctx, 'rgba(0,0,0,0.2)', x - 4, base - 6, w + 8, 8);
  px(ctx, '#3e6f6a', x, base - 3 * TILE, w, 3 * TILE);
  px(ctx, '#5e928b', x + 2, base - 3 * TILE + 2, w - 4, 3 * TILE - 4);
  for (let i = 0; i < 8; i += 1) {
    const segBottom = base - 3 * TILE - i * 22;
    const segW = w - 10 - i * 3;
    // 每節下窄上寬（101 的竹節造型）
    for (let row = 0; row < 22; row += 1) {
      const widen = Math.round((row / 22) * 8);
      const rowW = segW - 8 + widen;
      px(ctx, row % 4 === 0 ? '#2e5a56' : '#4f8a82', cx - rowW / 2, segBottom - row, rowW, 1);
      if (row % 4 === 2) px(ctx, night ? '#cde8ff' : '#9ed1d6', cx - rowW / 2 + 3, segBottom - row, rowW - 6, 1);
    }
  }
  const topY = base - 3 * TILE - 8 * 22;
  px(ctx, '#2e5a56', cx - 8, topY - 10, 16, 10);
  px(ctx, '#7fb3ad', cx - 2, topY - 34, 4, 24);
  px(ctx, '#d9d4c8', cx - 1, topY - 46, 2, 12);
  if (night) {
    const blink = Math.floor(seconds * 2) % 2 === 0;
    if (blink) px(ctx, '#ff6b5e', cx - 1, topY - 48, 2, 2);
  }
}

export function paintOutdoorProp(ctx: CanvasRenderingContext2D, prop: OutdoorProp, seconds: number, night: boolean): void {
  const x = prop.tx * TILE;
  const y = prop.ty * TILE;
  const w = prop.w * TILE;
  const h = prop.h * TILE;
  const variant = prop.variant ?? 0;
  switch (prop.kind) {
    case 'tower101':
      paintTower101(ctx, x, y, w, seconds, night);
      break;
    case 'office': {
      // 俯視的辦公大樓：屋頂 + 一格格窗戶
      px(ctx, 'rgba(0,0,0,0.25)', x + 4, y + h - 2, w, 6);
      px(ctx, variant === 0 ? '#59606e' : '#6e6559', x, y, w, h);
      px(ctx, variant === 0 ? '#7a8394' : '#958a7a', x + 3, y + 3, w - 6, h - 6);
      for (let wy = y + 6; wy < y + h - 6; wy += 6) {
        for (let wx = x + 6; wx < x + w - 6; wx += 7) px(ctx, night && (wx + wy) % 3 === 0 ? '#ffe39a' : '#3e4655', wx, wy, 4, 3);
      }
      break;
    }
    case 'mrt': {
      // 捷運站出入口：白色雨遮 + 紅色 M 標誌，下樓梯
      px(ctx, 'rgba(0,0,0,0.2)', x + 2, y + h - 2, w, 4);
      px(ctx, '#e3e8f0', x, y, w, h - 6);
      px(ctx, '#c3cad6', x, y + h - 10, w, 4);
      px(ctx, '#3a3d45', x + 8, y + 6, w - 16, h - 14);
      for (let sy = y + 8; sy < y + h - 8; sy += 4) px(ctx, '#55596a', x + 8, sy, w - 16, 1);
      px(ctx, '#e25a4a', x + w / 2 - 6, y - 12, 12, 12);
      px(ctx, '#ffffff', x + w / 2 - 4, y - 9, 2, 6);
      px(ctx, '#ffffff', x + w / 2 + 2, y - 9, 2, 6);
      px(ctx, '#ffffff', x + w / 2 - 2, y - 8, 1, 2);
      px(ctx, '#ffffff', x + w / 2 + 1, y - 8, 1, 2);
      px(ctx, '#ffffff', x + w / 2 - 1, y - 7, 2, 2);
      break;
    }
    case 'marketMrt':
    case 'zooMrt': {
      // 捷運站出入口：玻璃雨遮下兩座往下的電扶梯。夜市站：招牌兩邊紅線（士林）藍線（廟口），屋簷掛燈籠；動物園站：文湖線咖啡色
      const zoo = prop.kind === 'zooMrt';
      px(ctx, 'rgba(0,0,0,0.22)', x + 3, y + h - 2, w, 5);
      px(ctx, '#d9dee8', x, y + 10, w, h - 14);
      px(ctx, '#b9c0cc', x, y + h - 6, w, 4);
      // 兩座電扶梯的入口
      for (const ex of [x + 10, x + w / 2 + 6]) {
        px(ctx, '#2f3340', ex, y + 18, w / 2 - 16, h - 24);
        for (let sy = y + 20; sy < y + h - 6; sy += 4) px(ctx, '#4a5068', ex + 2, sy, w / 2 - 20, 1);
        px(ctx, '#9aa3b2', ex, y + 18, 2, h - 24);
        px(ctx, '#9aa3b2', ex + w / 2 - 18, y + 18, 2, h - 24);
      }
      // 玻璃雨遮（弧形）
      px(ctx, '#8fb7d9', x - 4, y + 4, w + 8, 8);
      px(ctx, '#c9e2f5', x - 4, y + 4, w + 8, 2);
      for (let i = 0; i < w + 8; i += 12) px(ctx, '#5f7f9c', x - 4 + i, y + 4, 1, 8);
      // 招牌：白底、紅藍兩條線
      px(ctx, '#15171f', x + w / 2 - 34, y - 12, 68, 16);
      px(ctx, '#ffffff', x + w / 2 - 33, y - 11, 66, 14);
      px(ctx, zoo ? '#c48c31' : '#e3002c', x + w / 2 - 33, y - 11, 4, 14);
      px(ctx, zoo ? '#c48c31' : '#0070bd', x + w / 2 + 29, y - 11, 4, 14);
      ctx.fillStyle = '#1f2937';
      ctx.font = '900 8px "PingFang TC", "Noto Sans TC", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(zoo ? '動物園站' : '夜市站', x + w / 2, y - 3.5);
      // 捷運標誌
      px(ctx, '#e25a4a', x + 2, y - 10, 10, 10);
      px(ctx, '#ffffff', x + 4, y - 8, 1, 6);
      px(ctx, '#ffffff', x + 9, y - 8, 1, 6);
      px(ctx, '#ffffff', x + 5, y - 7, 1, 2);
      px(ctx, '#ffffff', x + 8, y - 7, 1, 2);
      px(ctx, '#ffffff', x + 6, y - 6, 2, 2);
      // 屋簷下一排燈籠（動物園站換成一排小熊貓吊飾）
      for (let i = 0; i < 7; i += 1) {
        if (zoo) {
          const lx = x + 8 + i * ((w - 16) / 6);
          px(ctx, '#3a3d45', lx, y + 12, 1, 2);
          px(ctx, '#f8f6f0', lx - 2, y + 14, 5, 4);
          px(ctx, '#2b2d33', lx - 2, y + 13, 1, 1);
          px(ctx, '#2b2d33', lx + 2, y + 13, 1, 1);
          px(ctx, '#2b2d33', lx - 1, y + 15, 1, 1);
          px(ctx, '#2b2d33', lx + 1, y + 15, 1, 1);
          continue;
        }
        const lx = x + 8 + i * ((w - 16) / 6);
        const sway = Math.round(Math.sin(seconds * 1.4 + i) * 0.6);
        px(ctx, '#3a3d45', lx, y + 12, 1, 2);
        px(ctx, i % 2 ? '#e8a33d' : '#d9534f', lx - 2 + sway, y + 14, 5, 6);
        px(ctx, night ? '#ffe9a8' : '#f6c76b', lx - 1 + sway, y + 15, 3, 3);
      }
      break;
    }
    case 'f1station': {
      // F1 站：白色站房 + 格子旗屋簷 + 紅色招牌
      px(ctx, 'rgba(0,0,0,0.2)', x + 2, y + h - 2, w, 4);
      px(ctx, '#e3e8f0', x, y, w, h - 4);
      px(ctx, '#3a3d45', x + 12, y + 8, w - 24, h - 12);
      for (let i = 0; i < w; i += 4) {
        px(ctx, (i / 4) % 2 === 0 ? '#ffffff' : '#15171f', x + i, y - 8, 4, 4);
        px(ctx, (i / 4) % 2 === 1 ? '#ffffff' : '#15171f', x + i, y - 4, 4, 4);
      }
      px(ctx, '#d72d2d', x + 4, y + 2, 14, 5);
      px(ctx, '#ffffff', x + 6, y + 3, 10, 1);
      break;
    }
    case 'streetTree':
    case 'zooTree': {
      px(ctx, 'rgba(0,0,0,0.18)', x + 1, y + 12, 14, 3);
      px(ctx, '#5c3d22', x + 6, y + 4, 4, 10);
      const leaf = prop.kind === 'zooTree' ? ['#2f6b3a', '#3d8748', '#57a862'] : ['#3d7a4c', '#4f9a5c', '#6fbf72'];
      px(ctx, leaf[0] ?? '#2f6b3a', x - 2, y - 14, 20, 18);
      px(ctx, leaf[1] ?? '#3d8748', x, y - 16, 16, 16);
      px(ctx, leaf[2] ?? '#57a862', x + 3, y - 14, 7, 5);
      break;
    }
    case 'youbike':
      // YouBike 站：停車柱 + 停好的黃色腳踏車 + 站牌
      px(ctx, 'rgba(0,0,0,0.15)', x + 1, y + 12, w - 2, 3);
      px(ctx, '#c3cad6', x, y + 11, w, 3);
      for (let i = 0; i < 3; i += 1) {
        const bx = x + i * 16 + 2;
        px(ctx, '#2b2d33', bx, y + 3, 1, 9);
        px(ctx, '#2b2d33', bx + 11, y + 3, 1, 9);
        px(ctx, '#2b2d33', bx, y + 6, 12, 1);
        px(ctx, '#f6c945', bx + 2, y + 5, 8, 2);
        px(ctx, '#f6c945', bx + 4, y + 2, 2, 4);
        px(ctx, '#e25a4a', bx + 3, y + 1, 4, 1);
        px(ctx, '#55596a', bx + 5, y + 8, 2, 4);
      }
      px(ctx, '#3a3d45', x + w - 4, y - 14, 2, 26);
      px(ctx, '#f6c945', x + w - 10, y - 18, 14, 7);
      px(ctx, '#e25a4a', x + w - 8, y - 16, 10, 3);
      break;
    case 'bench':
      px(ctx, 'rgba(0,0,0,0.15)', x + 1, y + 12, w - 2, 2);
      px(ctx, '#6b4428', x, y + 4, w, 3);
      px(ctx, '#9a6a43', x, y + 8, w, 4);
      px(ctx, '#3a3d45', x + 2, y + 12, 2, 3);
      px(ctx, '#3a3d45', x + w - 4, y + 12, 2, 3);
      break;
    case 'lanternPole': {
      // 燈柱 + 往兩邊拉的燈籠串
      px(ctx, '#3a3d45', x + 7, y - 20, 2, 34);
      for (let i = -3; i <= 3; i += 1) {
        if (i === 0) continue;
        const lx = x + 7 + i * 10;
        const ly = y - 18 + Math.abs(i) * 2;
        const sway = Math.round(Math.sin(seconds * 1.6 + i) * 0.6);
        px(ctx, '#3a3d45', lx, ly - 2, 1, 2);
        px(ctx, '#d9534f', lx - 2 + sway, ly, 5, 5);
        px(ctx, night ? '#ffd27a' : '#f2a541', lx - 1 + sway, ly + 1, 3, 2);
      }
      break;
    }
    case 'lanternString': {
      // 兩根燈柱頂端之間垂下來的一串燈籠，紅黃相間；晚上點亮
      const from = x + 8;
      const span = w;
      const top = y - 19;
      const count = Math.max(3, Math.round(span / 14));
      for (let i = 0; i <= span; i += 2) {
        const t = i / span;
        px(ctx, '#3a3d45', from + i, Math.round(top + Math.sin(Math.PI * t) * 7), 2, 1);
      }
      for (let i = 1; i < count; i += 1) {
        const t = i / count;
        const lx = Math.round(from + span * t);
        const ly = Math.round(top + Math.sin(Math.PI * t) * 7) + 1;
        const sway = Math.round(Math.sin(seconds * 1.4 + i + x) * 0.6);
        const red = i % 2 === 1;
        px(ctx, '#3a3d45', lx, ly, 1, 2);
        px(ctx, red ? '#d9534f' : '#e8a33d', lx - 2 + sway, ly + 2, 5, 6);
        px(ctx, red ? '#b23c39' : '#c7832a', lx - 2 + sway, ly + 7, 5, 1);
        px(ctx, night ? '#ffe9a8' : red ? '#ef7a6f' : '#f6c76b', lx - 1 + sway, ly + 3, 3, 3);
        px(ctx, '#f2c14e', lx + sway, ly + 8, 1, 2);
      }
      break;
    }
    case 'streetLamp': {
      // 深灰燈柱＋往前彎的燈頭；晚上燈泡亮起來（光暈在 drawNightLighting）
      px(ctx, 'rgba(0,0,0,0.2)', x + 4, y + 12, 8, 2);
      px(ctx, '#2f333b', x + 5, y + 10, 6, 3);
      px(ctx, '#3d424c', x + 7, y - 24, 2, 35);
      px(ctx, '#545a66', x + 7, y - 24, 1, 35);
      px(ctx, '#3d424c', x + 7, y - 26, 6, 2);
      px(ctx, '#2f333b', x + 10, y - 25, 6, 3);
      px(ctx, night ? '#fff1a8' : '#cfd5de', x + 11, y - 22, 4, 2);
      break;
    }
  }
}

// ── 會動的：路人、計程車 ──

export function paintWalker(
  ctx: CanvasRenderingContext2D,
  walker: Walker,
  x: number,
  y: number,
  dx: number,
  seconds: number,
  drawPerson: (footX: number, footY: number, facing: 'up' | 'down' | 'left' | 'right', look: number) => void,
): void {
  const fx = x * TILE;
  const fy = y * TILE;
  switch (walker.kind) {
    case 'person': {
      const facing = Math.abs(dx) > 0.01 ? (dx > 0 ? 'right' : 'left') : walker.to.y > walker.from.y ? 'down' : 'up';
      drawPerson(fx, fy, facing, walker.look);
      break;
    }
    case 'taxi': {
      const down = walker.to.y > walker.from.y;
      px(ctx, 'rgba(0,0,0,0.25)', fx - 9, fy - 14, 20, 30);
      px(ctx, '#f2c230', fx - 10, fy - 16, 20, 30);
      px(ctx, '#d9a91f', fx - 10, fy + 10, 20, 4);
      px(ctx, '#3e4655', fx - 7, down ? fy + 2 : fy - 12, 14, 7);
      px(ctx, '#3e4655', fx - 7, down ? fy - 12 : fy + 4, 14, 5);
      px(ctx, '#ffffff', fx - 4, fy - 3, 8, 3);
      px(ctx, down ? '#fff4d6' : '#e25a4a', fx - 9, down ? fy + 12 : fy - 16, 4, 2);
      px(ctx, down ? '#fff4d6' : '#e25a4a', fx + 5, down ? fy + 12 : fy - 16, 4, 2);
      break;
    }

  }
}
