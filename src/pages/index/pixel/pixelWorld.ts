// 圖書館外面的世界：左邊 101 一帶、右邊動物園、上面士林夜市（下面的海灘在 pixelMap 裡）。
// 座標跟圖書館同一套（格，1 格 = 16px），圖書館在 (0,0)～(32, libraryHeight)，戶外區用到負的座標。
// 這裡放資料（家具、會動的人車動物）和畫法；碰撞照樣交給 mapObstacles。

import { TILE } from './pixelMap';
import { disc, px, seeded } from './pixelUtil';

export const WORLD_LEFT = 16;
export const WORLD_RIGHT = 16;
export const WORLD_TOP = 12;

export type OutdoorAreaId = 'taipei101' | 'zoo' | 'nightmarket';

export type OutdoorKind =
  | 'tower101'
  | 'office'
  | 'mrt'
  | 'f1station'
  | 'streetTree'
  | 'youbike'
  | 'bench'
  | 'stall'
  | 'tableSet'
  | 'goldfish'
  | 'lanternPole'
  | 'enclosure'
  | 'pool'
  | 'bamboo'
  | 'zooTree'
  | 'rock';

export interface OutdoorProp {
  kind: OutdoorKind;
  tx: number;
  ty: number;
  w: number;
  h: number;
  blocks: boolean;
  variant?: number;
}

export type WalkerKind = 'person' | 'taxi' | 'panda' | 'pandaEat' | 'pandaCub' | 'penguin' | 'giraffe' | 'elephant';

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
  // F1 站入口：走到這裡可以去 F1 賽車場
  f1Trigger: { x: number; y: number };
  // 圖書館後牆的門（通往夜市），x 範圍
  backDoor: [number, number];
}

export const BACK_DOOR: [number, number] = [29, 31];

// 夜市北邊八個攤位的招牌與老闆的叫賣（順序跟 stall 的 variant 一樣）
export const STALLS: { name: { 'zh-TW': string; 'en-US': string }; call: { 'zh-TW': string; 'en-US': string } }[] = [
  { name: { 'zh-TW': '花生捲冰淇淋', 'en-US': 'Peanut ice cream roll' }, call: { 'zh-TW': '花生捲冰淇淋，加香菜嗎？', 'en-US': 'Ice cream roll! Cilantro?' } },
  { name: { 'zh-TW': '烤香腸', 'en-US': 'Grilled sausage' }, call: { 'zh-TW': '香腸剛烤好！配大蒜！', 'en-US': 'Fresh sausages! With garlic!' } },
  { name: { 'zh-TW': '芋圓王', 'en-US': 'Taro ball king' }, call: { 'zh-TW': '芋圓王，冰的熱的都有～', 'en-US': 'Taro balls, hot or iced~' } },
  { name: { 'zh-TW': '豪大雞排', 'en-US': 'Fried chicken' }, call: { 'zh-TW': '雞排要切不要辣？', 'en-US': 'Chicken cutlet, sliced?' } },
  { name: { 'zh-TW': '珍珠奶茶', 'en-US': 'Bubble tea' }, call: { 'zh-TW': '珍奶半糖少冰！', 'en-US': 'Bubble tea, half sugar!' } },
  { name: { 'zh-TW': '臭豆腐', 'en-US': 'Stinky tofu' }, call: { 'zh-TW': '臭豆腐，泡菜加多一點！', 'en-US': 'Stinky tofu, extra kimchi!' } },
  { name: { 'zh-TW': '射氣球', 'en-US': 'Balloon darts' }, call: { 'zh-TW': '射中三個送娃娃喔！', 'en-US': 'Pop three, win a plushie!' } },
  { name: { 'zh-TW': '蚵仔煎', 'en-US': 'Oyster omelette' }, call: { 'zh-TW': '蚵仔煎，現煎的！', 'en-US': 'Oyster omelette, made fresh!' } },
];

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
    prop('bench', -4, -9, 2, 1, true),
    prop('bench', -4, 15, 2, 1, true),
    ...[-10, -5, 4, 9, 14].map((y) => prop('streetTree', -2, y)),
    ...[-10, -2, 4].map((y) => prop('streetTree', -13, y)),
    // ── 士林夜市 ──
    // 北邊一排八個攤位（各有一個老闆），南邊是吃東西的桌椅和撈金魚
    ...[1, 5, 9, 13, 17, 21, 25, 29].map((x, i) => prop('stall', x, -10, 3, 2, true, i)),
    ...[2, 8, 14].map((x) => prop('tableSet', x, -4, 3, 2, true)),
    prop('goldfish', 20, -4, 4, 2, true),
    ...[0, 8, 16, 24, 31].map((x) => prop('lanternPole', x, -7, 1, 1, true)),
    // ── 動物園 ──
    prop('enclosure', R + 6, -11, 9, 7, true, 0),
    prop('enclosure', R + 6, -2, 9, 7, true, 1),
    prop('enclosure', R + 6, 11, 9, 6, true, 2),
    prop('pool', R + 1, -11, 4, 4),
    ...[-10, -8, -6].map((y, i) => prop('bamboo', R + 13, y, 1, 1, false, i)),
    prop('zooTree', R + 2, 2),
    prop('zooTree', R + 3, 15),
    prop('zooTree', R + 14, 7),
    prop('rock', R + 9, 1, 2, 1, false),
    prop('bench', R + 2, -4, 2, 1, true),
  ];

  const walkers: Walker[] = [
    // 101 前面的路：計程車上下開，行人走人行道
    { kind: 'taxi', from: { x: -8.5, y: y0 - 1 }, to: { x: -8.5, y: libraryHeight + 1 }, speed: 3.2, phase: 0, look: 0, loop: true },
    { kind: 'taxi', from: { x: -10.2, y: libraryHeight + 1 }, to: { x: -10.2, y: y0 - 1 }, speed: 2.6, phase: 0.5, look: 1, loop: true },
    { kind: 'person', from: { x: -3.5, y: -11 }, to: { x: -3.5, y: 11 }, speed: 1.1, phase: 0, look: 2 },
    { kind: 'person', from: { x: -6.5, y: 4 }, to: { x: -1, y: 4 }, speed: 0.9, phase: 0.3, look: 5 },
    // 夜市逛街的人
    { kind: 'person', from: { x: 1, y: -6.5 }, to: { x: 30, y: -6.5 }, speed: 1, phase: 0, look: 1 },
    { kind: 'person', from: { x: 28, y: -5.6 }, to: { x: 3, y: -5.6 }, speed: 0.8, phase: 0.4, look: 3 },
    { kind: 'person', from: { x: 6, y: -7.3 }, to: { x: 20, y: -7.3 }, speed: 0.7, phase: 0.7, look: 6 },
    { kind: 'person', from: { x: 12, y: -5 }, to: { x: 26, y: -5 }, speed: 0.9, phase: 0.2, look: 4 },
    // 動物園裡的動物
    { kind: 'panda', from: { x: R + 8, y: -7 }, to: { x: R + 12, y: -7.5 }, speed: 0.35, phase: 0, look: 0 },
    { kind: 'panda', from: { x: R + 11, y: -9 }, to: { x: R + 9, y: -6 }, speed: 0.25, phase: 0.5, look: 1 },
    // 坐著啃竹子的熊貓，和跟在旁邊跑的小熊貓（圓仔）
    { kind: 'pandaEat', from: { x: R + 12, y: -8.6 }, to: { x: R + 12, y: -8.6 }, speed: 1, phase: 0, look: 0 },
    { kind: 'pandaCub', from: { x: R + 8, y: -5.4 }, to: { x: R + 11.5, y: -5.2 }, speed: 0.7, phase: 0.3, look: 0 },
    { kind: 'giraffe', from: { x: R + 8, y: 2 }, to: { x: R + 13, y: 2.5 }, speed: 0.45, phase: 0.2, look: 0 },
    { kind: 'elephant', from: { x: R + 8, y: 15 }, to: { x: R + 13, y: 15.5 }, speed: 0.3, phase: 0.6, look: 0 },
    { kind: 'penguin', from: { x: R + 1.6, y: -6.5 }, to: { x: R + 4.4, y: -6.5 }, speed: 0.6, phase: 0, look: 0 },
    { kind: 'penguin', from: { x: R + 4.2, y: -6.8 }, to: { x: R + 2, y: -6.8 }, speed: 0.5, phase: 0.5, look: 1 },
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
      { x: 16, y: -11.4, text: { 'zh-TW': '士林夜市', 'en-US': 'Shilin Night Market' } },
      { x: R + 8, y: 8.6, text: { 'zh-TW': '台北市立動物園', 'en-US': 'Taipei Zoo' } },
      { x: R + 10.5, y: -11.4, text: { 'zh-TW': '🐼 熊貓館', 'en-US': '🐼 Panda House' } },
    ],
    mrtTrigger: { x: -4.5, y: 2.5 },
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

  // 夜市：紅磚
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

const STALL_COLORS: [string, string][] = [
  ['#e25a4a', '#fff4e6'],
  ['#2fb3a6', '#fff4e6'],
  ['#f2a541', '#fff4e6'],
  ['#5b6ee1', '#fff4e6'],
  ['#e86a8a', '#fff4e6'],
  ['#4fa35a', '#fff4e6'],
  ['#c46a55', '#f6e2b8'],
  ['#3b6f86', '#f6e2b8'],
];

// 攤位檯面上的食物（variant 跟 STALLS 一樣）；seconds 用來做烤架的火光、冒煙
function paintStallFood(ctx: CanvasRenderingContext2D, x: number, y: number, variant: number, seconds: number): void {
  const flick = Math.floor(seconds * 6) % 2;
  switch (variant % 8) {
    case 0: {
      // 花生捲冰淇淋：一大塊花生糖 + 刨刀、三球冰淇淋、一疊潤餅皮
      px(ctx, '#c98a3c', x, y, 12, 6);
      px(ctx, '#e3ad5e', x + 1, y + 1, 10, 2);
      for (let i = 0; i < 4; i += 1) px(ctx, '#8a5e36', x + 2 + i * 3, y + 3, 1, 1);
      px(ctx, '#c3cad6', x + 12, y - 2, 2, 6);
      ['#f4eee2', '#f59ab3', '#ffe39a'].forEach((c, i) => {
        px(ctx, c, x + 16 + i * 5, y + 1, 4, 3);
        px(ctx, '#ffffff', x + 17 + i * 5, y + 1, 1, 1);
      });
      px(ctx, '#f4eee2', x + 31, y + 2, 8, 4);
      px(ctx, '#e3dccb', x + 31, y + 4, 8, 1);
      px(ctx, '#57a862', x + 34, y, 3, 2);
      break;
    }
    case 1: {
      // 烤香腸：炭火烤架（會閃）+ 一排香腸 + 冒煙 + 大蒜
      px(ctx, '#2b2d33', x, y + 1, 30, 6);
      px(ctx, flick ? '#e8572a' : '#f6a531', x + 1, y + 4, 28, 2);
      for (let i = 0; i < 5; i += 1) {
        px(ctx, '#8a3b2f', x + 2 + i * 6, y + 1, 4, 3);
        px(ctx, '#b0574a', x + 2 + i * 6, y + 1, 4, 1);
      }
      for (let i = 0; i < 3; i += 1) {
        const rise = (seconds * 6 + i * 4) % 12;
        px(ctx, `rgba(240,240,240,${0.55 - rise * 0.04})`, x + 6 + i * 9, Math.round(y - 2 - rise), 2, 2);
      }
      px(ctx, '#f4eee2', x + 33, y + 3, 3, 3);
      px(ctx, '#f4eee2', x + 37, y + 3, 3, 3);
      break;
    }
    case 2: {
      // 芋圓王：大鍋芋圓（紫、橘、黃）+ 冒煙 + 一疊碗
      px(ctx, '#55596a', x, y - 1, 18, 8);
      px(ctx, '#c9a06b', x + 1, y, 16, 3);
      ['#8a5ec4', '#f2a541', '#f6c945', '#8a5ec4', '#f2a541', '#f6c945', '#8a5ec4'].forEach((c, i) => px(ctx, c, x + 2 + i * 2, y + (i % 2), 2, 2));
      for (let i = 0; i < 2; i += 1) {
        const rise = (seconds * 5 + i * 5) % 10;
        px(ctx, `rgba(255,255,255,${0.5 - rise * 0.05})`, x + 5 + i * 6, Math.round(y - 3 - rise), 2, 2);
      }
      for (let i = 0; i < 3; i += 1) px(ctx, '#f4eee2', x + 22 + i * 6, y + 2, 5, 3);
      px(ctx, '#8a5ec4', x + 23, y + 2, 1, 1);
      px(ctx, '#f2a541', x + 29, y + 2, 1, 1);
      break;
    }
    case 3: // 雞排
      for (const dx of [0, 13, 26]) {
        px(ctx, '#b87a34', x + dx, y, 11, 6);
        px(ctx, '#d99a4e', x + dx + 1, y + 1, 9, 2);
      }
      break;
    case 4: // 珍奶
      for (const dx of [0, 7, 14, 21, 28]) {
        px(ctx, '#e9dcc4', x + dx + 2, y - 2, 4, 7);
        px(ctx, '#3b2a20', x + dx + 2, y + 3, 4, 2);
        px(ctx, '#e25a4a', x + dx + 4, y - 4, 1, 3);
      }
      break;
    case 5: // 臭豆腐
      for (const dx of [0, 6, 12, 18]) {
        px(ctx, '#c98a3c', x + dx, y + 1, 5, 4);
        px(ctx, '#e3ad5e', x + dx, y + 1, 5, 1);
      }
      px(ctx, '#57a862', x + 26, y + 2, 10, 3);
      px(ctx, '#e25a4a', x + 28, y + 3, 4, 1);
      break;
    case 6: // 射氣球：後面一整面氣球牆
      ['#e25a4a', '#fbbf24', '#2fb3a6', '#e86a8a', '#5b6ee1', '#4fa35a', '#f2a541', '#a78bfa'].forEach((c, i) =>
        px(ctx, c, x + (i % 4) * 9 + 2, y - 8 + Math.floor(i / 4) * 6, 5, 5),
      );
      break;
    default: // 蚵仔煎
      for (const dx of [0, 14]) {
        px(ctx, '#f4eee2', x + dx, y + 1, 12, 5);
        px(ctx, '#e8d29c', x + dx + 1, y + 2, 10, 3);
        px(ctx, '#e25a4a', x + dx + 3, y + 2, 5, 1);
      }
      px(ctx, '#2b2d33', x + 30, y + 1, 10, 5);
  }
}

// 攤位分兩層畫，中間夾著老闆：後面是背板和柱子，前面是屋頂和檯面（擋住老闆的下半身）
export function paintStall(ctx: CanvasRenderingContext2D, prop: OutdoorProp, layer: 'back' | 'front', seconds: number, night: boolean): void {
  const x = prop.tx * TILE;
  const y = prop.ty * TILE;
  const w = prop.w * TILE;
  const h = prop.h * TILE;
  const variant = prop.variant ?? 0;
  const [awning, stripe] = STALL_COLORS[variant % STALL_COLORS.length] ?? ['#e25a4a', '#fff4e6'];
  if (layer === 'back') {
    px(ctx, 'rgba(0,0,0,0.25)', x + 2, y + h - 2, w, 4);
    px(ctx, '#4a3326', x + 2, y - 8, w - 4, 20);
    px(ctx, '#5c3d22', x + 3, y - 7, w - 6, 18);
    px(ctx, '#3a3d45', x + 1, y - 14, 2, h + 14);
    px(ctx, '#3a3d45', x + w - 3, y - 14, 2, h + 14);
    return;
  }
  // 檯面
  px(ctx, '#6b4428', x + 2, y + 16, w - 4, h - 16);
  px(ctx, '#9a6a43', x + 3, y + 17, w - 6, 4);
  px(ctx, '#c3cad6', x + 2, y + 14, w - 4, 3);
  paintStallFood(ctx, x + 4, y + 9, variant, seconds);
  // 條紋屋頂 + 一排小燈
  for (let i = 0; i < w; i += 6) px(ctx, (i / 6) % 2 === 0 ? awning : stripe, x + i, y - 20, Math.min(6, w - i), 8);
  for (let i = 0; i < w; i += 6) px(ctx, (i / 6) % 2 === 0 ? awning : stripe, x + i + 3, y - 12, 3, 2);
  px(ctx, 'rgba(0,0,0,0.2)', x, y - 12, w, 1);
  const glow = night ? '#fff1a8' : '#fbd27a';
  for (let i = 5; i < w - 2; i += 9) px(ctx, glow, x + i, y - 10, 3, 3);
}

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
    case 'tableSet': {
      // 夜市吃東西的折疊桌 + 四張塑膠椅
      px(ctx, 'rgba(0,0,0,0.18)', x + 8, y + 22, 32, 4);
      for (const [sx, sy] of [[2, 4], [38, 4], [2, 20], [38, 20]] as const) {
        px(ctx, '#e25a4a', x + sx, y + sy, 8, 6);
        px(ctx, '#f07a6a', x + sx + 1, y + sy, 6, 2);
      }
      px(ctx, '#d9d4c8', x + 10, y + 6, 28, 16);
      px(ctx, '#f4eee2', x + 11, y + 7, 26, 4);
      px(ctx, '#ffffff', x + 14, y + 12, 6, 4);
      px(ctx, '#c98a3c', x + 15, y + 13, 4, 2);
      px(ctx, '#e9dcc4', x + 26, y + 10, 4, 7);
      px(ctx, '#3b2a20', x + 26, y + 15, 4, 2);
      break;
    }
    case 'goldfish': {
      // 撈金魚：藍色淺池，金魚游來游去
      px(ctx, 'rgba(0,0,0,0.18)', x + 2, y + h - 2, w - 2, 4);
      px(ctx, '#e3e8f0', x, y + 2, w, h - 4);
      px(ctx, '#4fc3d9', x + 3, y + 5, w - 6, h - 10);
      for (let i = 0; i < 7; i += 1) {
        const fx = x + 6 + ((i * 17 + seconds * (8 + i)) % (w - 14));
        const fy = y + 8 + ((i * 7) % (h - 18));
        px(ctx, i % 3 === 0 ? '#ffffff' : '#f2a541', Math.round(fx), fy, 4, 2);
        px(ctx, i % 3 === 0 ? '#e3e8f0' : '#e8572a', Math.round(fx) - 1, fy, 1, 2);
      }
      px(ctx, '#f4eee2', x + w - 10, y - 4, 6, 6);
      break;
    }
    case 'stall': {
      paintStall(ctx, prop, 'back', seconds, night);
      paintStall(ctx, prop, 'front', seconds, night);
      break;
    }
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
    case 'enclosure': {
      // 木頭圍欄圍起來的展區：裡面依動物不同鋪不同地面
      const ground = variant === 0 ? '#6fa158' : variant === 1 ? '#c9a66b' : '#b9a17a';
      px(ctx, ground, x + 2, y + 2, w - 4, h - 4);
      if (variant === 2) {
        px(ctx, '#4fc3d9', x + w - 3 * TILE, y + h - 2 * TILE, 2 * TILE, TILE);
        px(ctx, '#2b9cc4', x + w - 3 * TILE + 2, y + h - 2 * TILE + 2, 2 * TILE - 4, TILE - 4);
      }
      for (let fx = x; fx < x + w; fx += 6) {
        px(ctx, '#8a5e36', fx, y, 2, 6);
        px(ctx, '#8a5e36', fx, y + h - 6, 2, 6);
      }
      for (let fy = y; fy < y + h; fy += 6) {
        px(ctx, '#8a5e36', x, fy, 2, 6);
        px(ctx, '#8a5e36', x + w - 2, fy, 2, 6);
      }
      px(ctx, '#b48a5c', x, y + 2, w, 1);
      px(ctx, '#b48a5c', x, y + h - 4, w, 1);
      break;
    }
    case 'pool':
      px(ctx, '#e3e8f0', x, y, w, h);
      px(ctx, '#4fc3d9', x + 3, y + 3, w - 6, h - 6);
      px(ctx, '#7fd8e6', x + 6, y + 6, w - 20, 2);
      px(ctx, '#ffffff', x + 3, y + h - 14, w - 6, 11);
      break;
    case 'bamboo':
      for (const dx of [0, 5, 10]) {
        px(ctx, '#4f9a5c', x + dx, y - 14 + variant * 2, 2, 28);
        px(ctx, '#2f6b3a', x + dx, y - 6, 2, 1);
        px(ctx, '#6fbf72', x + dx + 2, y - 12, 4, 2);
      }
      break;
    case 'rock':
      px(ctx, '#7c7a75', x + 2, y + 6, w - 4, 9);
      px(ctx, '#a19e97', x + 4, y + 6, w - 12, 3);
      break;
  }
}

// ── 會動的：路人、計程車、動物 ──

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
  const step = Math.floor(seconds * 4) % 2;
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
    case 'panda':
    case 'pandaCub': {
      // 圓滾滾的熊貓：大頭、圓耳朵、八字形黑眼圈、黑手腳；小熊貓整隻縮小
      const k = walker.kind === 'pandaCub' ? 0.6 : 1;
      const flip = dx < 0 ? -1 : 1;
      const r = (v: number) => Math.round(v * k);
      px(ctx, 'rgba(0,0,0,0.15)', fx - r(10), fy - 2, r(20), 3);
      // 身體（白）+ 黑色的手腳和肩帶
      disc(ctx, '#2b2d33', fx, fy - r(8), r(8));
      disc(ctx, '#f6f4ee', fx - flip * r(1), fy - r(8), r(7));
      px(ctx, '#2b2d33', fx - r(7), fy - r(11), r(14), r(4));
      px(ctx, '#2b2d33', fx - r(8), fy - r(3), r(5), r(3) + step);
      px(ctx, '#2b2d33', fx + r(3), fy - r(3), r(5), r(4) - step);
      // 頭
      const hx = fx + flip * r(7);
      const hy = fy - r(15);
      disc(ctx, '#2b2d33', hx - r(5), hy - r(5), r(3));
      disc(ctx, '#2b2d33', hx + r(5), hy - r(5), r(3));
      disc(ctx, '#2b2d33', hx, hy, r(7));
      disc(ctx, '#ffffff', hx, hy, r(6));
      px(ctx, '#2b2d33', hx - r(4), hy - r(1), r(3), r(3));
      px(ctx, '#2b2d33', hx + r(1), hy - r(1), r(3), r(3));
      px(ctx, '#ffffff', hx - r(3), hy - r(1), 1, 1);
      px(ctx, '#ffffff', hx + r(2), hy - r(1), 1, 1);
      px(ctx, '#2b2d33', hx - 1, hy + r(3), 2, 1);
      px(ctx, '#f4a3a3', hx - r(5), hy + r(2), r(2), 1);
      px(ctx, '#f4a3a3', hx + r(4), hy + r(2), r(2), 1);
      break;
    }
    case 'pandaEat': {
      // 坐著抱竹子啃：圓身體、腳往前伸，竹子一上一下
      const chew = Math.floor(seconds * 3) % 2;
      px(ctx, 'rgba(0,0,0,0.15)', fx - 12, fy - 2, 24, 3);
      disc(ctx, '#2b2d33', fx, fy - 9, 10);
      disc(ctx, '#f6f4ee', fx, fy - 9, 9);
      disc(ctx, '#2b2d33', fx - 7, fy - 2, 3);
      disc(ctx, '#2b2d33', fx + 7, fy - 2, 3);
      disc(ctx, '#f4a3a3', fx - 7, fy - 2, 1);
      disc(ctx, '#f4a3a3', fx + 7, fy - 2, 1);
      const hy = fy - 23;
      disc(ctx, '#2b2d33', fx - 6, hy - 6, 3);
      disc(ctx, '#2b2d33', fx + 6, hy - 6, 3);
      disc(ctx, '#2b2d33', fx, hy, 8);
      disc(ctx, '#ffffff', fx, hy, 7);
      px(ctx, '#2b2d33', fx - 5, hy - 1, 3, 4);
      px(ctx, '#2b2d33', fx + 2, hy - 1, 3, 4);
      px(ctx, '#ffffff', fx - 4, hy, 1, 1);
      px(ctx, '#ffffff', fx + 3, hy, 1, 1);
      px(ctx, '#2b2d33', fx - 1, hy + 3, 2, 1 + chew);
      px(ctx, '#f4a3a3', fx - 6, hy + 3, 2, 1);
      px(ctx, '#f4a3a3', fx + 5, hy + 3, 2, 1);
      // 竹子 + 抱著竹子的兩隻黑手
      px(ctx, '#57a862', fx + 4, hy + 1 - chew * 2, 3, 20);
      px(ctx, '#2f6b3a', fx + 4, hy + 8 - chew * 2, 3, 1);
      px(ctx, '#6fbf72', fx + 7, hy - 1 - chew * 2, 5, 3);
      px(ctx, '#2b2d33', fx - 2, fy - 16, 10, 5);
      break;
    }
    case 'penguin': {
      px(ctx, 'rgba(0,0,0,0.15)', fx - 4, fy - 1, 8, 2);
      px(ctx, '#2b2d33', fx - 4, fy - 13, 8, 12);
      px(ctx, '#f4f2ea', fx - 2, fy - 10, 4, 8);
      px(ctx, '#f2a541', fx - 1, fy - 11, 2, 1);
      px(ctx, '#f2a541', fx - 3 + step, fy - 1, 2, 1);
      px(ctx, '#f2a541', fx + 1 - step, fy - 1, 2, 1);
      break;
    }
    case 'giraffe': {
      const flip = dx < 0 ? -1 : 1;
      px(ctx, 'rgba(0,0,0,0.15)', fx - 10, fy - 2, 20, 3);
      px(ctx, '#e3b04b', fx - 9, fy - 14, 18, 8);
      for (const [sx, sy] of [[-6, -12], [0, -10], [4, -13]] as const) px(ctx, '#a8722f', fx + sx, fy + sy, 3, 3);
      for (const lx of [-8, -4, 3, 7]) px(ctx, '#c99a3c', fx + lx, fy - 6, 2, 6 + (lx % 2 === 0 ? step : 0));
      // 長脖子往上
      px(ctx, '#e3b04b', fx + flip * 6 - 2, fy - 34, 5, 22);
      px(ctx, '#a8722f', fx + flip * 6 - 1, fy - 28, 2, 2);
      px(ctx, '#e3b04b', fx + flip * 6 - 3 + flip * 3, fy - 38, 8, 5);
      px(ctx, '#5c3d22', fx + flip * 6, fy - 41, 1, 3);
      px(ctx, '#5c3d22', fx + flip * 6 + 3, fy - 41, 1, 3);
      break;
    }
    case 'elephant': {
      const flip = dx < 0 ? -1 : 1;
      px(ctx, 'rgba(0,0,0,0.18)', fx - 13, fy - 2, 26, 4);
      px(ctx, '#8f949e', fx - 12, fy - 18, 24, 14);
      px(ctx, '#a9aeb7', fx - 10, fy - 17, 14, 3);
      for (const lx of [-11, -5, 3, 8]) px(ctx, '#7a7f89', fx + lx, fy - 5, 4, 5 + (lx < 0 ? step : 1 - step));
      const hx = fx + flip * 11;
      px(ctx, '#8f949e', hx - 5, fy - 20, 10, 12);
      px(ctx, '#7a7f89', hx - flip * 6 - 2, fy - 19, 5, 9);
      px(ctx, '#8f949e', hx + flip * 3 - 1, fy - 10, 3, 9);
      px(ctx, '#f4f2ea', hx + flip * 2, fy - 11, 2, 3);
      px(ctx, '#2b2d33', hx + flip * 1, fy - 16, 1, 1);
      break;
    }
  }
}
