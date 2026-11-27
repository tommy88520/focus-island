// 舊金山（美國，獨立地圖；美國城市之間搭國內線飛機）：北邊是海灣——西北邊的金門大橋（霧會從海上飄進來蓋住橋塔）、海上的惡魔島，
// 東邊是 39 號碼頭的木棧板和曬太陽的海獅；海堤邊是漁人碼頭的步道（看橋的長椅、舵輪招牌），沿著 Jefferson 街是螃蟹攤、酸種麵包店、
// 巧克力聖代店和 BART 捷運站入口；過了馬路，西邊是九曲花街（Lombard Street），中間是叮噹車爬坡的 Hyde 街，
// 東邊是阿拉莫廣場：草地上的長椅看 Painted Ladies 彩色維多利亞式房子，後面遠遠的是泛美金字塔。
// 座標單位是格（1 格 = 16px），y 往下。南邊是山坡上面（地勢高），北邊是海邊（地勢低）。
import type { CitySeat, CityShop, Rect } from './city';
import { SANFRANCISCO_ITEMS as I } from './cityItems';

export const SF = {
  W: 56,
  H: 44,
  // 海灣：金門大橋（橋面、兩座塔）、惡魔島
  bridge: { deck: 6.4, towers: [7, 19] as const, top: 1.9, left: 3.6, right: 22.6, water: 8.5 },
  alcatraz: { x0: 31.5, x1: 41, y: 8.4 },
  // 海堤（西邊）、39 號碼頭的木棧板（東邊，往海裡突出）
  shore: 13,
  pier: { x0: 40, y0: 11.2 },
  // Jefferson 街北邊一排攤子、店的地面線；人行道；馬路
  row: 20,
  road: { y0: 21.4, y1: 23.8 },
  walk: 25,
  // Hyde 街（叮噹車）、九曲花街、兩邊的房子
  hyde: { x0: 24.5, x1: 28.5, tracks: [25.6, 27.4] as const },
  lombard: { x0: 6, x1: 19, y0: 25, y1: 39.6 },
  westHouses: { x0: 0, x1: 5 },
  eastHouses: { x0: 20, x1: 23.6 },
  lombardTop: { y0: 39.6, y1: 41.4 },
  // 阿拉莫廣場：Painted Ladies 的地面線、Steiner 街人行道、草地
  east: 29.5,
  ladies: { x0: 31.5, x1: 54.5, line: 33 },
  park: 34.6,
  // 攤子、店（地面線都在 row）
  crab: 6,
  bakery: { x0: 10, x1: 17 },
  chowder: 21.5,
  helm: 27,
  bart: { x0: 31.2, x1: 34.2 },
  sundae: { x0: 36, x1: 41.4 },
  pierShops: [
    { x0: 42.2, x1: 47.2 },
    { x0: 50.6, x1: 55.8 },
  ] as const,
  pierGate: { x0: 47.4, x1: 50.4 },
} as const;

// 九曲花街的彎路（折線，從北邊坡底到南邊坡頂）：8 個髮夾彎
export const LOMBARD_PATH: [number, number][] = [
  [12.5, 25.1],
  ...Array.from({ length: 9 }, (_, k): [number, number] => [k % 2 === 0 ? 7.4 : 17.6, 26.6 + k * 1.5]),
  [12.5, 39.9],
];

// 座位（12 個，順序 = 座位編號 501–512，不要調換）：
// 漁人碼頭海堤邊兩張長椅（面向海灣看金門大橋、惡魔島，各 2 位）、阿拉莫廣場草地兩張長椅（面向 Painted Ladies，各 2 位）、
// 39 號碼頭木棧板兩張長椅（面向海獅，各 2 位）
export const WHARF_BENCHES = [10, 20];
export const WHARF_BENCH_Y = 14.3;
export const ALAMO_BENCHES = [37.5, 48.5];
export const ALAMO_BENCH_Y = 37.8;
export const PIER_BENCHES = [44.6, 51.6];
export const PIER_BENCH_Y = 12.5;
export const BENCHES: { x: number; y: number }[] = [...WHARF_BENCHES.map((x) => ({ x, y: WHARF_BENCH_Y })), ...ALAMO_BENCHES.map((x) => ({ x, y: ALAMO_BENCH_Y })), ...PIER_BENCHES.map((x) => ({ x, y: PIER_BENCH_Y }))];

export const SF_SEATS: CitySeat[] = BENCHES.flatMap((b): CitySeat[] => [
  { x: b.x - 0.6, y: b.y, facing: 'up' },
  { x: b.x + 0.6, y: b.y, facing: 'up' },
]);

const at = (x: number, y0: number): Rect => ({ x0: x - 1.3, y0, x1: x + 1.3, y1: y0 + 1.2 });
const bakeryX = (SF.bakery.x0 + SF.bakery.x1) / 2;
const sundaeX = (SF.sundae.x0 + SF.sundae.x1) / 2;

export const SF_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '碼頭螃蟹攤', 'en-US': 'Wharf Crab Stand' },
    call: { 'zh-TW': '剛煮好的珍寶蟹，熱騰騰的！', 'en-US': 'Fresh-cooked Dungeness crab, piping hot!' },
    items: [I.dungenessCrab, I.clamChowder],
    at: at(SF.crab, SF.row),
    label: { x: SF.crab, y: SF.row - 4.1 },
  },
  {
    name: { 'zh-TW': '酸種麵包店', 'en-US': 'Sourdough Bakery' },
    call: { 'zh-TW': '剛出爐的酸種麵包，要不要挖成碗裝巧達湯？', 'en-US': 'Sourdough fresh from the oven — want it as a chowder bowl?' },
    items: [I.sourdough, I.clamChowder],
    at: at(bakeryX, SF.row),
    label: { x: bakeryX, y: SF.row - 4.9 },
  },
  {
    name: { 'zh-TW': '巧達湯攤', 'en-US': 'Chowder Stand' },
    call: { 'zh-TW': '麵包碗巧達湯！海風這麼冷，來一碗吧！', 'en-US': 'Chowder in a bread bowl — perfect for the chilly bay breeze!' },
    items: [I.clamChowder, I.dungenessCrab],
    at: at(SF.chowder, SF.row),
    label: { x: SF.chowder, y: SF.row - 4.1 },
  },
  {
    name: { 'zh-TW': '巧克力聖代店', 'en-US': 'Chocolate Sundae Parlor' },
    call: { 'zh-TW': '熱巧克力淋在冰淇淋上，冷冷的天最對味！', 'en-US': 'Hot fudge over ice cream — just right on a foggy day!' },
    items: [I.chocolateSundae],
    at: at(sundaeX, SF.row),
    label: { x: sundaeX, y: SF.row - 5 },
  },
];

// 九曲花街：只有彎路走得到（花圃擋路）
function distToSeg(x: number, y: number, a: [number, number], b: [number, number]): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / len));
  return Math.hypot(x - (a[0] + dx * t), y - (a[1] + dy * t));
}
export function lombardBlocked(x: number, y: number): boolean {
  const L = SF.lombard;
  if (x <= L.x0 || x >= L.x1 || y <= L.y0 + 0.1 || y >= L.y1) return false;
  for (let k = 0; k + 1 < LOMBARD_PATH.length; k += 1) {
    const a = LOMBARD_PATH[k];
    const b = LOMBARD_PATH[k + 1];
    if (a && b && distToSeg(x, y, a, b) < 0.5) return false;
  }
  return true;
}
