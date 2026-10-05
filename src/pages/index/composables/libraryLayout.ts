// 3D 圖書館的平面配置：每個座位放在哪、朝哪個方向，以及家具與分區。
// 純邏輯、不依賴 three，跟 seatNavigation.ts 一樣只處理俯視平面 x/z。
//
// 座標：x 往右、z 往鏡頭（前方），後牆在 z = BACK_Z。
// yaw 的定義跟玩家的 facing 一致：面向 (sin yaw, cos yaw)，yaw = 0 面向 +z。

export type SeatKind = 'desk' | 'counter' | 'beanbag' | 'armchair';

export interface SeatSlot {
  kind: SeatKind;
  x: number;
  z: number;
  yaw: number;
}

export type FurnitureKind = 'table' | 'counter' | 'coffeeTable' | 'roundRug' | 'rug' | 'avWall' | 'plant' | 'floorLamp';

export interface FurnitureItem {
  kind: FurnitureKind;
  x: number;
  z: number;
  // 俯視的寬（x）與深（z）；圓形家具用 w 當直徑
  w: number;
  d: number;
  // 會不會擋路（地毯不擋）
  blocks: boolean;
  color?: number;
}

export interface LibraryLayout {
  slots: SeatSlot[];
  furniture: FurnitureItem[];
  // 房間前緣（靠鏡頭那側）的 z
  frontZ: number;
}

export const BACK_Z = -3.15;
// 走得到的範圍（左右）；牆在它外側
export const ROOM_HALF_WIDTH = 7.7;
export const STAIR_X = 1.1;

const BASE_FRONT_Z = 5.3;
const TABLE_W = 1.7;
const TABLE_D = 1.0;
// 椅子中心到桌子中心的距離
const TABLE_SEAT_GAP = 0.86;

function tableSeats(cx: number, cz: number): SeatSlot[] {
  const half = 0.42;
  return [
    { kind: 'desk', x: cx - half, z: cz - TABLE_SEAT_GAP, yaw: 0 },
    { kind: 'desk', x: cx + half, z: cz - TABLE_SEAT_GAP, yaw: 0 },
    { kind: 'desk', x: cx + half, z: cz + TABLE_SEAT_GAP, yaw: Math.PI },
    { kind: 'desk', x: cx - half, z: cz + TABLE_SEAT_GAP, yaw: Math.PI },
  ];
}

function table(cx: number, cz: number): FurnitureItem {
  return { kind: 'table', x: cx, z: cz, w: TABLE_W, d: TABLE_D, blocks: true };
}

// 懶骨頭圍著咖啡桌：angle 是相對圓心的方位，懶骨頭面向圓心
function beanbag(cx: number, cz: number, angleDeg: number, radius = 1.05): SeatSlot {
  const a = (angleDeg * Math.PI) / 180;
  return { kind: 'beanbag', x: cx + Math.sin(a) * radius, z: cz + Math.cos(a) * radius, yaw: a + Math.PI };
}

// 影音區的單人沙發都轉向螢幕中心，排成淺淺的弧形
function armchair(x: number, z: number, screen: { x: number; z: number }): SeatSlot {
  return { kind: 'armchair', x, z, yaw: Math.atan2(screen.x - x, screen.z - z) };
}

export function createLibraryLayout(seatCount: number): LibraryLayout {
  const study = { a: { x: -4.4, z: 0.1 }, b: { x: -1.9, z: 2.95 } };
  const lounge = { x: 2.7, z: 2.3 };
  const screen = { x: 8.0, z: 1.0 };
  const counterX = -7.15;

  const tableA = tableSeats(study.a.x, study.a.z);
  const tableB = tableSeats(study.b.x, study.b.z);

  // 依優先順序排：座位少的分區也會先分到幾個位子，不會整區空著
  const base: SeatSlot[] = [
    ...tableA,
    beanbag(lounge.x, lounge.z, 200),
    beanbag(lounge.x, lounge.z, 320),
    beanbag(lounge.x, lounge.z, 80),
    ...tableB,
    { kind: 'counter', x: counterX, z: 1.0, yaw: -Math.PI / 2 },
    { kind: 'counter', x: counterX, z: 2.45, yaw: -Math.PI / 2 },
    armchair(6.15, 0.05, screen),
    armchair(5.95, 1.4, screen),
    // 以上 15 個是一個分區的標準座位數，再多才用下面這些
    beanbag(lounge.x, lounge.z, 140),
    { kind: 'counter', x: counterX, z: 3.9, yaw: -Math.PI / 2 },
    armchair(6.15, 2.75, screen),
  ];

  const furniture: FurnitureItem[] = [
    { kind: 'rug', x: -3.15, z: 1.5, w: 6.4, d: 5.6, blocks: false, color: 0xd9cfbd },
    table(study.a.x, study.a.z),
    table(study.b.x, study.b.z),
    { kind: 'roundRug', x: lounge.x, z: lounge.z, w: 3.5, d: 3.5, blocks: false, color: 0xb9805b },
    { kind: 'coffeeTable', x: lounge.x, z: lounge.z, w: 0.8, d: 0.8, blocks: true },
    { kind: 'rug', x: 6.35, z: 1.35, w: 2.9, d: 4.4, blocks: false, color: 0x6b7280 },
    { kind: 'avWall', x: 7.95, z: screen.z, w: 0.4, d: 3.2, blocks: true },
    { kind: 'counter', x: -7.85, z: 2.45, w: 0.5, d: 5.0, blocks: true },
    { kind: 'plant', x: -7.3, z: -2.35, w: 0.5, d: 0.5, blocks: true },
    { kind: 'plant', x: 7.3, z: -2.35, w: 0.5, d: 0.5, blocks: true },
    { kind: 'plant', x: 7.35, z: 4.4, w: 0.5, d: 0.5, blocks: true },
    { kind: 'plant', x: 0.05, z: 4.5, w: 0.5, d: 0.5, blocks: true },
    { kind: 'floorLamp', x: 1.2, z: 3.75, w: 0.3, d: 0.3, blocks: true },
    { kind: 'floorLamp', x: 4.55, z: -0.75, w: 0.3, d: 0.3, blocks: true },
  ];

  const slots = base.slice(0, seatCount);

  // 超過預設的座位數：在房間前方再加一排排四人桌，房間跟著加深
  let frontZ = BASE_FRONT_Z;
  const extraTablesNeeded = Math.ceil(Math.max(0, seatCount - base.length) / 4);
  const perRow = 5;
  for (let i = 0; i < extraTablesNeeded; i += 1) {
    const row = Math.floor(i / perRow);
    const col = i % perRow;
    const cx = -5.6 + col * 2.8;
    const cz = BASE_FRONT_Z + 1.0 + row * 3.0;
    furniture.push(table(cx, cz));
    for (const slot of tableSeats(cx, cz)) {
      if (slots.length < seatCount) slots.push(slot);
    }
    frontZ = Math.max(frontZ, cz + 2.3);
  }

  return { slots, furniture, frontZ };
}
