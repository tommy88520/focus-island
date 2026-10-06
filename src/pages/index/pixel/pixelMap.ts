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
  | 'painting';

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

export interface PixelMap {
  width: number;
  height: number;
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
}

export const TILE = 16;
export const WALL_ROWS = 3;
const BASE_HEIGHT = 18;
export const MAP_WIDTH = 32;

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

export function createPixelMap(seatCount: number): PixelMap {
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

  // 超過預設座位數：在右下角往下加一張張 2×2 方桌，地圖跟著變高
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

  return {
    width: MAP_WIDTH,
    height,
    seats,
    props,
    rugs,
    tv: TV,
    shelves: [
      [1, DOWN_STAIR_X],
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
  };
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

// 尋路用的障礙物（seatNavigation 的 Rect 是 x/z，這裡的 y 填進 z）
export function mapObstacles(map: PixelMap): Rect[] {
  const rects: Rect[] = [];
  for (const prop of map.props) {
    if (!prop.blocks) continue;
    const inset = prop.kind === 'plant' || prop.kind === 'tallPlant' || prop.kind === 'floorLamp' ? 0.2 : 0.04;
    rects.push({ x0: prop.tx + inset, x1: prop.tx + prop.w - inset, z0: prop.ty + inset, z1: prop.ty + prop.h - inset });
  }
  for (const seat of map.seats) {
    const inset = seat.kind === 'armchair' ? 0.06 : 0.16;
    rects.push({ x0: seat.tx + inset, x1: seat.tx + 1 - inset, z0: seat.ty + inset, z1: seat.ty + 1 - inset });
  }
  return rects;
}

export function walkBounds(map: PixelMap): { xMin: number; xMax: number; zMin: number; zMax: number } {
  return { xMin: 1.3, xMax: map.width - 1.3, zMin: WALL_ROWS + 0.25, zMax: map.height - 1.3 };
}
