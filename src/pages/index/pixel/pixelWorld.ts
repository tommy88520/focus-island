// 圖書館外面的世界：左邊 101 一帶（台北101/世貿站）、上面台北車站（所有路線都從這裡搭）、右邊四四南村（下面的海灘在 pixelMap 裡）。
// 座標跟圖書館同一套（格，1 格 = 16px），圖書館在 (0,0)～(32, libraryHeight)，戶外區用到負的座標。
// 這裡放資料（家具、會動的人車動物）和畫法；碰撞照樣交給 mapObstacles。

import { MIAOKOU_ITEMS } from './miaokou';
import { isMarketDay, XY } from './xinyi';
import {
  drawBambooFence,
  drawBanyan,
  drawChessTable,
  drawGoodCho,
  drawLaundry,
  drawMailboxes,
  drawMarketTent,
  drawOldBike,
  drawPicnicTable,
  drawStationGates,
  drawStationNight,
  drawVillageHouseC,
  paintStationGround,
  paintTaipeiStation,
  paintVillageGround,
  paintVillageNorthRow,
} from './xinyiArt';
import { SHILIN_ITEMS } from './shilin';
import { CITY_ITEMS } from './cityItems';
import { TILE } from './pixelMap';
import { px, seeded } from './pixelUtil';

export const WORLD_LEFT = 16;
export const WORLD_RIGHT = 16;
export const WORLD_TOP = 15;

export type OutdoorAreaId = 'taipei101' | 'village' | 'station';

export type OutdoorKind =
  | 'tower101'
  | 'office'
  | 'mrt'
  | 'streetTree'
  | 'youbike'
  | 'streetLamp'
  // 看不到、只擋路（車站、老平房這種畫在底圖裡的建築）
  | 'solid'
  // 台北車站大廳的出發看板＋閘門、晚上亮起來的窗
  | 'stationGates'
  | 'stationNight'
  // 四四南村
  | 'goodCho'
  | 'houseC'
  | 'banyan'
  | 'bambooFence'
  | 'chessTable'
  | 'picnicTable'
  | 'mailbox'
  | 'oldBike'
  | 'laundry'
  | 'marketTent';

export interface OutdoorProp {
  kind: OutdoorKind;
  tx: number;
  ty: number;
  w: number;
  h: number;
  blocks: boolean;
  variant?: number;
}

export type WalkerKind = 'person' | 'taxi' | 'traveler';

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
  // 搭車的地方：台北車站大廳的閘門、101 旁的捷運站口；走到這裡跳出同一張路線圖（每一站都去得到）
  mrtTriggers: MrtTrigger[];
  // 圖書館後牆的門（通往台北車站），x 範圍
  backDoor: [number, number];
}

export interface MrtTrigger {
  station: 'main' | 'taipei101';
  x: number;
  y: number;
  r: number;
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
  | 'coldNoodles'
  // 各城市的指標地圖（cityItems.ts）
  | 'danzaiNoodles'
  | 'shrimpRoll'
  | 'linTote'
  | 'icedCoffee'
  | 'blackTea'
  | 'fruitIce'
  | 'tomatoPlate'
  | 'iceCreamCone'
  | 'sunCake'
  | 'daMianGeng'
  | 'pearlMilkTea'
  | 'duckRice'
  | 'beefNoodles'
  | 'ironEggs'
  | 'fishBallSoup'
  | 'aGei'
  | 'plumJuice'
  | 'teaEgg'
  | 'redJadeTea'
  | 'boarSausage'
  | 'wonton'
  | 'driedBonito'
  | 'shavedIce'
  // 基隆正濱漁港（cityItems.ts）
  | 'squidVermicelli'
  | 'saltyTangyuan'
  // 新竹城隍廟口（cityItems.ts）
  | 'meatballSoup'
  | 'friedVermicelli'
  | 'bawan'
  | 'runbing';

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
  ...CITY_ITEMS.map((item) => [item.id, item.emoji]),
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
    // 以前 F1 站的位置（F1 改從台北車站搭）：種兩棵樹
    prop('streetTree', -15, 14),
    prop('streetTree', -12, 15),
    // YouBike 站：圖書館裡、101、台北車站前、四四南村各一個，可以借車、還車
    prop('youbike', -5, 12, 3, 1),
    prop('youbike', 19, 15, 3, 1),
    prop('youbike', 0, -2, 3, 1),
    prop('youbike', 33, 8, 3, 1),
    ...[-10, -5, 4, 9, 14].map((y) => prop('streetTree', -2, y)),
    ...[-10, -2, 4].map((y) => prop('streetTree', -13, y)),
    // ── 路燈：101 的人行道、海灘木棧道（晚上會亮） ──
    ...[-8, 0, 7, 12].map((y) => prop('streetLamp', -2, y)),
    ...[-7, 2].map((y) => prop('streetLamp', -13, y)),
    prop('streetLamp', 1, libraryHeight),
    prop('streetLamp', R - 2, libraryHeight),
    // ── 台北車站（建築畫在底圖裡；這裡只放擋路的範圍、大廳的閘門、站前廣場）──
    prop('solid', XY.station.x0, XY.station.y0, XY.hall.x0 - XY.station.x0, XY.station.y1 - XY.station.y0),
    prop('solid', XY.hall.x1, XY.station.y0, XY.station.x1 - XY.hall.x1, XY.station.y1 - XY.station.y0),
    prop('solid', XY.hall.x0, XY.station.y0, XY.hall.x1 - XY.hall.x0, XY.hall.y0 - XY.station.y0),
    prop('stationNight', XY.station.x0, XY.station.y0, XY.station.x1 - XY.station.x0, 0.1, false),
    prop('stationGates', XY.hall.x0, XY.hall.y0 - 0.6, XY.hall.x1 - XY.hall.x0, 0.6, false),
    ...[4, 10, 22, 28].map((x) => prop('streetTree', x, -4)),
    prop('streetLamp', 10, -5),
    prop('streetLamp', 21, -5),
    // 車站跟村子中間的小空地
    prop('streetTree', 29, -12),
    prop('streetTree', 30, -9),
    prop('streetTree', 29, -6),
    prop('streetLamp', 31, -3),
    // ── 四四南村 ──
    prop('solid', XY.villageX0, XY.station.y0, libraryWidth + WORLD_RIGHT - XY.villageX0, XY.villageRowBottom - XY.station.y0),
    prop('mailbox', 33, -9),
    prop('oldBike', 46, -9, 2, 1, false),
    prop('streetLamp', 40, -9),
    prop('goodCho', XY.goodCho.x0, XY.goodCho.y0, XY.goodCho.x1 - XY.goodCho.x0, XY.goodCho.y1 - XY.goodCho.y0),
    prop('picnicTable', 39, 0, 2, 1),
    prop('picnicTable', 44, 0, 2, 1),
    prop('banyan', 35, -5),
    prop('chessTable', 34, -1),
    prop('bambooFence', 32, 2.6, 4, 0.4),
    prop('laundry', 34, 6.4, 4, 1, false),
    prop('houseC', XY.houseC.x0, XY.houseC.y0, XY.houseC.x1 - XY.houseC.x0, XY.houseC.y1 - XY.houseC.y0),
    prop('streetLamp', 39, 9),
    prop('banyan', 45, 13),
    ...[34, 38, 42].map((x, i) => prop('marketTent', x, 15.6, 3, 1, false, i)),
  ];

  const walkers: Walker[] = [
    // 101 前面的路：計程車上下開，行人走人行道
    { kind: 'taxi', from: { x: -8.5, y: y0 - 1 }, to: { x: -8.5, y: libraryHeight + 1 }, speed: 3.2, phase: 0, look: 0, loop: true },
    { kind: 'taxi', from: { x: -10.2, y: libraryHeight + 1 }, to: { x: -10.2, y: y0 - 1 }, speed: 2.6, phase: 0.5, look: 1, loop: true },
    { kind: 'person', from: { x: -3.5, y: -11 }, to: { x: -3.5, y: 11 }, speed: 1.1, phase: 0, look: 2 },
    { kind: 'person', from: { x: -6.5, y: 4 }, to: { x: -1, y: 4 }, speed: 0.9, phase: 0.3, look: 5 },
    // 進出台北車站的人（有的拖著行李箱）
    { kind: 'traveler', from: { x: 14.6, y: -6.2 }, to: { x: 14.6, y: -0.6 }, speed: 0.8, phase: 0.1, look: 1 },
    { kind: 'person', from: { x: 17.4, y: -0.6 }, to: { x: 17.4, y: -6.2 }, speed: 0.9, phase: 0.5, look: 4 },
    { kind: 'traveler', from: { x: 1.5, y: -4.5 }, to: { x: 30.5, y: -4.5 }, speed: 1, phase: 0.3, look: 3 },
    { kind: 'person', from: { x: 30, y: -0.5 }, to: { x: 12, y: -0.5 }, speed: 0.8, phase: 0.7, look: 6 },
    // 四四南村逛街的人
    { kind: 'person', from: { x: 33, y: -7.5 }, to: { x: 47, y: -7.5 }, speed: 0.6, phase: 0.2, look: 7 },
    { kind: 'person', from: { x: 46, y: 11 }, to: { x: 33, y: 11 }, speed: 0.7, phase: 0.6, look: 2 },
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
      { x: 16, y: -2.4, text: { 'zh-TW': '🚉 台北車站 · 進大廳搭車', 'en-US': '🚉 Taipei Main Station · trains inside' } },
      { x: 40, y: 9.4, text: { 'zh-TW': '🏘️ 四四南村', 'en-US': '🏘️ Four Four South Village' } },
      { x: 43, y: -6.8, text: { 'zh-TW': "☕ 好丘 good cho's", 'en-US': "☕ Good Cho's" } },
    ],
    mrtTriggers: [
      { station: 'main', x: XY.gates.x, y: XY.gates.y, r: 1.1 },
      { station: 'taipei101', x: -4.5, y: 2.5, r: 0.9 },
    ],
    backDoor: BACK_DOOR,
  };
}

export function outdoorAreaAt(world: OutdoorWorld, libraryWidth: number, libraryHeight: number, x: number, y: number): OutdoorAreaId | null {
  if (y >= libraryHeight - 0.5) return null;
  if (x < 0) return 'taipei101';
  if (x >= libraryWidth) return 'village';
  if (y < 0) return 'station';
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

  // 台北車站前的廣場、四四南村（再把車站和村子北邊的老平房畫上去：後面都進不去，直接畫進底圖）
  paintStationGround(ctx, world.y0);
  paintVillageGround(ctx, world.y0, libraryHeight, world.x1);
  paintTaipeiStation(ctx);
  paintVillageNorthRow(ctx);

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
    case 'streetTree': {
      px(ctx, 'rgba(0,0,0,0.18)', x + 1, y + 12, 14, 3);
      px(ctx, '#5c3d22', x + 6, y + 4, 4, 10);
      const leaf = ['#3d7a4c', '#4f9a5c', '#6fbf72'];
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
    case 'stationGates':
      drawStationGates(ctx, seconds, night);
      break;
    case 'stationNight':
      if (night) drawStationNight(ctx, seconds);
      break;
    case 'goodCho':
      drawGoodCho(ctx);
      break;
    case 'houseC':
      drawVillageHouseC(ctx);
      break;
    case 'banyan':
      drawBanyan(ctx, prop.tx, prop.ty, seconds);
      break;
    case 'bambooFence':
      drawBambooFence(ctx, prop.tx, prop.ty, prop.w);
      break;
    case 'chessTable':
      drawChessTable(ctx, prop.tx, prop.ty);
      break;
    case 'picnicTable':
      drawPicnicTable(ctx, prop.tx, prop.ty, prop.w);
      break;
    case 'mailbox':
      drawMailboxes(ctx, prop.tx, prop.ty);
      break;
    case 'oldBike':
      drawOldBike(ctx, prop.tx, prop.ty);
      break;
    case 'laundry':
      drawLaundry(ctx, prop.tx, prop.ty, prop.w, seconds);
      break;
    case 'marketTent':
      if (isMarketDay()) drawMarketTent(ctx, prop.tx, prop.ty, variant, seconds);
      break;
    case 'solid':
      break;
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
    case 'traveler': {
      // 拖著行李箱走的旅客：箱子在身後
      const facing = Math.abs(dx) > 0.01 ? (dx > 0 ? 'right' : 'left') : walker.to.y > walker.from.y ? 'down' : 'up';
      const back = facing === 'right' ? -9 : facing === 'left' ? 4 : 5;
      const suitcase = ['#3b82c4', '#e25a4a', '#6b7280', '#f2a541'][walker.look % 4] ?? '#3b82c4';
      if (facing === 'up') drawPerson(fx, fy, facing, walker.look);
      px(ctx, 'rgba(0,0,0,0.2)', fx + back, fy + 2, 6, 2);
      px(ctx, suitcase, fx + back, fy - 6, 6, 8);
      px(ctx, 'rgba(255,255,255,0.25)', fx + back + 1, fy - 5, 1, 6);
      px(ctx, '#2b2d33', fx + back + 2, fy - 9, 2, 3);
      if (facing !== 'up') drawPerson(fx, fy, facing, walker.look);
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
