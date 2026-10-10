// 像素圖書館的地圖配置：以「格」為單位（1 格 = 16px），x 往右、y 往下。
// 純邏輯、不碰 canvas，碰撞與尋路直接沿用 seatNavigation（它的 z 就是這裡的 y）。

import type { Rect } from 'src/pages/index/composables/seatNavigation';

export type Facing = 'up' | 'down' | 'left' | 'right';
export type SeatKind = 'chair' | 'stool' | 'pouf' | 'armchair';

export interface SeatSlot {
  kind: SeatKind;
  // 座位所在的格子（左上角）
  tx: number;
  ty: number;
  facing: Facing;
}

export type PropKind =
  | 'table'
  | 'roundTable'
  | 'counter'
  | 'plant'
  | 'tallPlant'
  | 'floorLamp'
  | 'painting'
  // 懶骨頭區：可以窩進去的懶骨頭（不是座位）
  | 'beanbag'
  // 海灘
  | 'palm'
  | 'umbrella'
  | 'lounger'
  | 'campfire'
  | 'log'
  | 'surfboard'
  | 'sandcastle'
  | 'towel';

export interface MapProp {
  kind: PropKind;
  tx: number;
  ty: number;
  w: number;
  h: number;
  variant?: number;
  blocks: boolean;
}

export interface MapRug {
  tx: number;
  ty: number;
  w: number;
  h: number;
  color: 'oat' | 'terracotta' | 'slate';
  round?: boolean;
}

export interface StairSpot {
  direction: 1 | -1;
  // 樓梯口佔兩格寬，tx 是左邊那格
  tx: number;
}

// 圖書館南邊的海灘：前牆開一道門出去，先是木棧道、再來是沙灘，最下面是海
export interface Beach {
  // 圖書館前牆所在的那一列；海灘從下一列開始
  wallRow: number;
  door: [number, number];
  // 樓上的出口不是門，而是一座往下到海灘的手扶梯（從前牆一路到木棧道尾端）
  escalator: boolean;
  deckTop: number;
  sandTop: number;
  seaTop: number;
}

export type Outfit = 'bikini' | 'trunks';

export interface Beachgoer {
  // lie：躺在躺椅或海灘巾上；sit：坐在木頭上；stroll：沿著岸邊來回走
  pose: 'lie' | 'sit' | 'stand' | 'stroll';
  x: number;
  y: number;
  facing: Facing;
  outfit: Outfit;
  // 髮色與泳裝顏色的編號
  look: number;
  strollTo?: number;
}

// 分區主題：只換美術，座位與碰撞共用同一張地圖
export type ThemeId = 'library' | 'forest' | 'cafe' | 'deepsea';

const ZONE_THEMES: Record<string, ThemeId> = { A: 'forest', B: 'cafe', C: 'deepsea', D: 'library' };

export function themeForZone(zoneId: string): ThemeId {
  return ZONE_THEMES[zoneId.toUpperCase()] ?? 'library';
}

// 可以騎的載具：室內腳踏車、海灘車、海上的小船（x/y 是車停的位置，以格為單位）
export type VehicleKind = 'bike' | 'cart' | 'boat';

export interface VehicleSpot {
  kind: VehicleKind;
  x: number;
  y: number;
  facing: Facing;
}

export interface PixelMap {
  theme: ThemeId;
  width: number;
  height: number;
  // 圖書館（含前牆）的高度，以下是海灘
  libraryHeight: number;
  beach: Beach;
  beachgoers: Beachgoer[];
  vehicles: VehicleSpot[];
  seats: SeatSlot[];
  props: MapProp[];
  rugs: MapRug[];
  // 後牆上的電視（影音區）
  tv: { tx: number; w: number };
  // 後牆上的書櫃範圍（每段左右邊界，避開樓梯口與電視）
  shelves: [number, number][];
  // 左牆的窗戶（y 範圍）
  windows: [number, number][];
  stairs: { down: StairSpot; up: StairSpot };
  // 後牆上的電梯（兩格寬，tx 是左邊那格）：可以直接到任何一層
  elevator: { tx: number };
}

export const TILE = 16;
export const WALL_ROWS = 3;
const BASE_HEIGHT = 18;
const DECK_ROWS = 2;
const SAND_ROWS = 8;
const SEA_ROWS = 4;
export const DOOR_X = 15;
export const MAP_WIDTH = 32;

const ELEVATOR_X = 7;
const DOWN_STAIR_X = 12;
const UP_STAIR_X = 18;
const TV = { tx: 24, w: 5 };

function tableSeats(tx: number, ty: number): SeatSlot[] {
  // 2×2 的方桌：上面兩張椅子面向下、下面兩張面向上
  return [
    { kind: 'chair', tx, ty: ty - 1, facing: 'down' },
    { kind: 'chair', tx: tx + 1, ty: ty - 1, facing: 'down' },
    { kind: 'chair', tx: tx + 1, ty: ty + 2, facing: 'up' },
    { kind: 'chair', tx, ty: ty + 2, facing: 'up' },
  ];
}

function table(tx: number, ty: number): MapProp {
  return { kind: 'table', tx, ty, w: 2, h: 2, blocks: true };
}

export function createPixelMap(seatCount: number, escalator = false, theme: ThemeId = 'library'): PixelMap {
  const lounge = { tx: 16, ty: 10 };
  const base: SeatSlot[] = [
    ...tableSeats(5, 6),
    { kind: 'pouf', tx: lounge.tx - 1, ty: lounge.ty, facing: 'right' },
    { kind: 'pouf', tx: lounge.tx + 1, ty: lounge.ty, facing: 'left' },
    { kind: 'pouf', tx: lounge.tx, ty: lounge.ty + 1, facing: 'up' },
    ...tableSeats(9, 11),
    { kind: 'stool', tx: 2, ty: 7, facing: 'left' },
    { kind: 'stool', tx: 2, ty: 9, facing: 'left' },
    { kind: 'armchair', tx: 25, ty: 6, facing: 'up' },
    { kind: 'armchair', tx: 27, ty: 6, facing: 'up' },
    // 以上 15 個是一個分區的標準座位數，再多才用下面這些
    { kind: 'pouf', tx: lounge.tx, ty: lounge.ty - 1, facing: 'down' },
    { kind: 'stool', tx: 2, ty: 11, facing: 'left' },
    { kind: 'armchair', tx: 26, ty: 8, facing: 'up' },
  ];

  const props: MapProp[] = [
    table(5, 6),
    table(9, 11),
    { kind: 'roundTable', tx: lounge.tx, ty: lounge.ty, w: 1, h: 1, blocks: true },
    { kind: 'counter', tx: 1, ty: 6, w: 1, h: 7, blocks: true },
    { kind: 'tallPlant', tx: 1, ty: 3, w: 1, h: 1, variant: 0, blocks: true },
    { kind: 'tallPlant', tx: 30, ty: 3, w: 1, h: 1, variant: 1, blocks: true },
    { kind: 'plant', tx: 11, ty: 3, w: 1, h: 1, variant: 0, blocks: true },
    { kind: 'plant', tx: 20, ty: 3, w: 1, h: 1, variant: 1, blocks: true },
    { kind: 'plant', tx: 30, ty: 15, w: 1, h: 1, variant: 0, blocks: true },
    { kind: 'tallPlant', tx: 1, ty: 15, w: 1, h: 1, variant: 1, blocks: true },
    { kind: 'floorLamp', tx: 19, ty: 9, w: 1, h: 1, blocks: true },
    { kind: 'floorLamp', tx: 23, ty: 4, w: 1, h: 1, blocks: true },
    { kind: 'plant', tx: 13, ty: 15, w: 1, h: 1, variant: 1, blocks: true },
  ];

  const rugs: MapRug[] = [
    { tx: 4, ty: 4, w: 8, h: 11, color: 'oat' },
    { tx: 14, ty: 8, w: 5, h: 5, color: 'terracotta', round: true },
    { tx: 23, ty: 5, w: 7, h: 5, color: 'slate' },
  ];

  const seats = base.slice(0, seatCount);

  // 超過預設座位數：在右下角往下加一張張 2×2 方桌，圖書館跟著變高
  let height = BASE_HEIGHT;
  const extraTables = Math.ceil(Math.max(0, seatCount - base.length) / 4);
  const columns = [22, 26];
  for (let i = 0; i < extraTables; i += 1) {
    const tx = columns[i % columns.length] ?? 22;
    const ty = 12 + Math.floor(i / columns.length) * 5;
    props.push(table(tx, ty));
    for (const slot of tableSeats(tx, ty)) {
      if (seats.length < seatCount) seats.push(slot);
    }
    height = Math.max(height, ty + 6);
  }

  const libraryHeight = height;
  const beach: Beach = {
    wallRow: libraryHeight - 1,
    door: [DOOR_X, DOOR_X + 2],
    escalator,
    deckTop: libraryHeight,
    sandTop: libraryHeight + DECK_ROWS,
    seaTop: libraryHeight + DECK_ROWS + SAND_ROWS,
  };
  // 懶骨頭區：右下角空地，一塊地毯、四顆懶骨頭圍一張小圓桌。
  // 座位多到要往右下角加桌子時那裡會被佔掉，就不擺了
  if (extraTables === 0) {
    const bx = 22;
    const by = 11;
    rugs.push({ tx: bx, ty: by, w: 7, h: 5, color: 'slate' });
    props.push(
      { kind: 'beanbag', tx: bx + 1, ty: by + 1, w: 1, h: 1, variant: 0, blocks: true },
      { kind: 'beanbag', tx: bx + 5, ty: by + 1, w: 1, h: 1, variant: 1, blocks: true },
      { kind: 'beanbag', tx: bx + 1, ty: by + 3, w: 1, h: 1, variant: 2, blocks: true },
      { kind: 'beanbag', tx: bx + 5, ty: by + 3, w: 1, h: 1, variant: 3, blocks: true },
      { kind: 'roundTable', tx: bx + 3, ty: by + 2, w: 1, h: 1, blocks: true },
      { kind: 'plant', tx: bx + 6, ty: by, w: 1, h: 1, variant: 0, blocks: true },
    );
  }

  props.push(...beachProps(beach));

  return {
    theme,
    width: MAP_WIDTH,
    height: beach.seaTop + SEA_ROWS,
    libraryHeight,
    beach,
    beachgoers: beachgoers(beach),
    vehicles: [
      { kind: 'bike', x: 20.5, y: 15.6, facing: 'right' },
      { kind: 'cart', x: 8.5, y: beach.sandTop + 1.4, facing: 'right' },
      { kind: 'boat', x: 24.5, y: beach.seaTop + 1.1, facing: 'left' },
    ],
    seats,
    props,
    rugs,
    tv: TV,
    shelves: [
      [1, ELEVATOR_X],
      [ELEVATOR_X + 2, DOWN_STAIR_X],
      [DOWN_STAIR_X + 2, UP_STAIR_X],
      [UP_STAIR_X + 2, TV.tx],
      [TV.tx + TV.w, MAP_WIDTH - 1],
    ],
    windows: [
      [4, 6],
      [8, 10],
      [12, 14],
    ],
    stairs: { down: { direction: -1, tx: DOWN_STAIR_X }, up: { direction: 1, tx: UP_STAIR_X } },
    elevator: { tx: ELEVATOR_X },
  };
}

function beachProps(beach: Beach): MapProp[] {
  const s = beach.sandTop;
  const prop = (kind: PropKind, tx: number, ty: number, blocks = true, variant?: number, h = 1): MapProp => ({
    kind,
    tx,
    ty,
    w: 1,
    h,
    blocks,
    ...(variant === undefined ? {} : { variant }),
  });
  return [
    // 木棧道兩側的盆栽
    prop('plant', DOOR_X - 2, beach.deckTop, true, 0),
    prop('plant', DOOR_X + 3, beach.deckTop, true, 1),
    // 椰子樹（只擋樹幹那一格）
    prop('palm', 3, s + 1, true, 0),
    prop('palm', 12, s, true, 1),
    prop('palm', 25, s, true, 0),
    prop('palm', 29, s + 2, true, 1),
    // 兩組海灘傘 + 躺椅（躺椅一格寬兩格長）
    prop('umbrella', 6, s + 3),
    prop('lounger', 5, s + 3, true, 0, 2),
    prop('lounger', 7, s + 3, true, 1, 2),
    prop('umbrella', 21, s + 2),
    prop('lounger', 20, s + 2, true, 2, 2),
    prop('lounger', 22, s + 2, true, 0, 2),
    // 營火 + 三根木頭長凳（避開中間通往海邊的步道）
    prop('campfire', 11, s + 4),
    prop('log', 9, s + 4),
    prop('log', 13, s + 4),
    prop('log', 11, s + 6),
    prop('surfboard', 27, s + 4, true, 0),
    prop('surfboard', 28, s + 4, true, 1),
    prop('sandcastle', 19, s + 6),
    prop('towel', 24, s + 5, false, 0),
    prop('towel', 2, s + 5, false, 1),
  ];
}

// 海灘上的路人（純裝飾，不是真的使用者）：x/y 是腳的位置
function beachgoers(beach: Beach): Beachgoer[] {
  const s = beach.sandTop;
  return [
    { pose: 'lie', x: 5.5, y: s + 4.5, facing: 'down', outfit: 'bikini', look: 0 },
    { pose: 'lie', x: 22.5, y: s + 3.5, facing: 'down', outfit: 'trunks', look: 1 },
    { pose: 'lie', x: 24.25, y: s + 6.4, facing: 'down', outfit: 'bikini', look: 2 },
    { pose: 'sit', x: 13.5, y: s + 4.7, facing: 'left', outfit: 'bikini', look: 3 },
    { pose: 'sit', x: 9.5, y: s + 4.7, facing: 'right', outfit: 'trunks', look: 7 },
    { pose: 'stand', x: 19.5, y: beach.seaTop + 0.2, facing: 'down', outfit: 'trunks', look: 5 },
    { pose: 'stroll', x: 3, y: beach.seaTop - 0.6, facing: 'right', outfit: 'bikini', look: 6, strollTo: 9 },
  ];
}

// 每種載具能去的範圍：腳踏車只在室內、海灘車在木棧道和沙灘、小船只在海上
export function vehicleArea(map: PixelMap, kind: VehicleKind): { xMin: number; xMax: number; yMin: number; yMax: number } {
  if (kind === 'bike') return { xMin: 1.3, xMax: map.width - 1.3, yMin: WALL_ROWS + 0.3, yMax: map.libraryHeight - 1.3 };
  if (kind === 'cart') return { xMin: 0.5, xMax: map.width - 0.5, yMin: map.libraryHeight + 0.4, yMax: map.beach.seaTop + 0.3 };
  return { xMin: 0.9, xMax: map.width - 0.9, yMin: map.beach.seaTop + 0.75, yMax: map.height - 0.5 };
}

export type Area = 'library' | 'beach';

export function areaAt(map: PixelMap, y: number): Area {
  return y >= map.libraryHeight - 0.5 ? 'beach' : 'library';
}

// 坐下後人在畫面上的位置：格子中心（以格為單位的連續座標）
export function seatCenter(slot: SeatSlot): { x: number; y: number } {
  return { x: slot.tx + 0.5, y: slot.ty + 0.5 };
}

const FACING_VECTOR: Record<Facing, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export function facingVector(facing: Facing): { x: number; y: number } {
  return FACING_VECTOR[facing];
}

// 走過去坐下的起點：座位正後方一格
export function seatApproach(slot: SeatSlot): { x: number; y: number } {
  const v = FACING_VECTOR[slot.facing];
  const c = seatCenter(slot);
  return { x: c.x - v.x, y: c.y - v.y };
}

export function stairTrigger(stair: StairSpot): { x: number; y: number } {
  return { x: stair.tx + 1, y: WALL_ROWS + 0.45 };
}

export function elevatorTrigger(map: PixelMap): { x: number; y: number } {
  return { x: map.elevator.tx + 1, y: WALL_ROWS + 0.45 };
}

// 尋路用的障礙物（seatNavigation 的 Rect 是 x/z，這裡的 y 填進 z）
export function mapObstacles(map: PixelMap): Rect[] {
  const rects: Rect[] = [];
  // 圖書館的左右牆，以及前牆門口以外的部分（海灘那段走得到地圖最左右兩邊）
  const wallBottom = map.libraryHeight;
  rects.push({ x0: 0, x1: 1, z0: 0, z1: wallBottom });
  rects.push({ x0: map.width - 1, x1: map.width, z0: 0, z1: wallBottom });
  rects.push({ x0: 0, x1: map.beach.door[0], z0: map.beach.wallRow, z1: wallBottom });
  rects.push({ x0: map.beach.door[1], x1: map.width, z0: map.beach.wallRow, z1: wallBottom });
  if (map.beach.escalator) {
    // 手扶梯兩側的扶手：只能從頭尾上下
    for (const x of map.beach.door) rects.push({ x0: x - 0.1, x1: x + 0.1, z0: wallBottom, z1: map.beach.sandTop });
  }
  for (const prop of map.props) {
    if (!prop.blocks) continue;
    const thin: PropKind[] = ['plant', 'tallPlant', 'floorLamp', 'palm', 'umbrella', 'surfboard'];
    const inset = thin.includes(prop.kind) ? 0.25 : 0.04;
    rects.push({ x0: prop.tx + inset, x1: prop.tx + prop.w - inset, z0: prop.ty + inset, z1: prop.ty + prop.h - inset });
  }
  for (const seat of map.seats) {
    const inset = seat.kind === 'armchair' ? 0.06 : 0.16;
    rects.push({ x0: seat.tx + inset, x1: seat.tx + 1 - inset, z0: seat.ty + inset, z1: seat.ty + 1 - inset });
  }
  return rects;
}

export function walkBounds(map: PixelMap): { xMin: number; xMax: number; zMin: number; zMax: number } {
  // 可以走到海邊踩水，但不會走進海裡
  return { xMin: 0.35, xMax: map.width - 0.35, zMin: WALL_ROWS + 0.25, zMax: map.beach.seaTop + 0.55 };
}
