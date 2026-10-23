// 高雄（鹽埕、愛河口、駁二一帶，獨立地圖，從台北車站搭高鐵過來）：
// 北邊五福四路上有鹽埕的老店（鴨肉珍、港園牛肉麵）；中間愛河從北往南流進高雄港（愛之船來回開），兩岸是步道；
// 西岸是駁二大義區的草地和裝置藝術、環狀輕軌（鋪草皮的軌道、駁二大義站），軌道南邊一排駁二倉庫面向港邊；
// 東岸是河畔的小公園和咖啡亭，港邊是高雄流行音樂中心（白色六角形的建築群、兩座高塔）。南邊是高雄港。
// 跟其他地圖一樣，建築都畫成正面朝南。座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { KAOHSIUNG_ITEMS as I } from './cityItems';

export const KH = {
  W: 56,
  H: 38,
  northLine: 7.4,
  wufu: { y0: 8.6, y1: 11.2 },
  // 愛河（含兩邊石牆）流到 harborY 進港
  river: { x0: 24, x1: 31 },
  westWalk: { x0: 22, x1: 24 },
  eastWalk: { x0: 31, x1: 33 },
  // 環狀輕軌（草皮軌道）、駁二大義站的月台（軌道北邊）
  rail: { y0: 22.6, y1: 24.2 },
  platform: { x0: 6, x1: 16, y0: 21.2 },
  // 駁二倉庫（面向港邊）、港邊步道、高雄港
  warehouses: [
    { x0: 0.4, x1: 6.8 },
    { x0: 8, x1: 14.4 },
    { x0: 15.6, x1: 22 },
  ],
  warehouseY0: 25.2,
  shoreY: 29.4,
  harborY: 31.4,
  // 高雄流行音樂中心：六角形的小館、主館（兩座高塔）
  hexes: { x0: 34, x1: 41.4 },
  hall: { x0: 42, x1: 55.4 },
  // 東岸河畔的咖啡亭
  kiosk: { x0: 38.2, x1: 41.8, y: 15 },
  milkCart: { x: 18.4, y: 14.4 },
} as const;

export interface KaohsiungHouse {
  x0: number;
  x1: number;
  floors: number;
  seed: number;
  special?: 'duck' | 'beef';
}
export const NORTH_ROW: KaohsiungHouse[] = [
  { x0: 0, x1: 4.6, floors: 3, seed: 201 },
  { x0: 4.6, x1: 9.8, floors: 2, seed: 202, special: 'duck' },
  { x0: 9.8, x1: 14, floors: 3, seed: 203 },
  { x0: 14, x1: 19, floors: 2, seed: 204, special: 'beef' },
  { x0: 19, x1: 23.8, floors: 3, seed: 205 },
  { x0: 31.2, x1: 36, floors: 3, seed: 206 },
  { x0: 36, x1: 41, floors: 4, seed: 207 },
  { x0: 41, x1: 46, floors: 3, seed: 208 },
  { x0: 46, x1: 51, floors: 2, seed: 209 },
  { x0: 51, x1: 56, floors: 3, seed: 210 },
];

// 座位（12 個，順序 = 座位編號 213–224，不要調換）：
// 駁二草地兩張長椅各 2 位、愛河西岸 2 張／東岸 2 張長椅（面向河）、東岸咖啡亭兩張桌子各 2 張椅子
export const LAWN_BENCHES = [6, 15];
export const LAWN_BENCH_Y = 17;
export const RIVER_SEAT_YS = [14.2, 18.4];
export const CAFE_TABLES = [37.4, 41.8];
export const CAFE_Y = 18.2;

export const KAOHSIUNG_SEATS: CitySeat[] = [
  ...LAWN_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: LAWN_BENCH_Y, facing: 'down' },
    { x: x + 0.6, y: LAWN_BENCH_Y, facing: 'down' },
  ]),
  ...RIVER_SEAT_YS.map((y): CitySeat => ({ x: 22.9, y, facing: 'right' })),
  ...RIVER_SEAT_YS.map((y): CitySeat => ({ x: 32.1, y, facing: 'left' })),
  ...CAFE_TABLES.flatMap((x): CitySeat[] => [
    { x: x - 0.85, y: CAFE_Y, facing: 'right' },
    { x: x + 0.85, y: CAFE_Y, facing: 'left' },
  ]),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const KAOHSIUNG_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '鴨肉珍', 'en-US': 'Ya Rou Zhen' },
    call: { 'zh-TW': '鴨肉飯一碗，淋上鴨汁！', 'en-US': 'Duck rice with plenty of duck sauce!' },
    items: [I.duckRice],
    at: at(5.6, KH.northLine, 8.8, KH.northLine + 1.4),
    label: { x: 7.2, y: KH.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '港園牛肉麵', 'en-US': 'Kang Yuan Beef Noodles' },
    call: { 'zh-TW': '牛肉拌麵，拌一拌最香！', 'en-US': 'Beef noodles — toss them well!' },
    items: [I.beefNoodles],
    at: at(14.8, KH.northLine, 18.2, KH.northLine + 1.4),
    label: { x: 16.5, y: KH.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '木瓜牛奶', 'en-US': 'Papaya Milk' },
    call: { 'zh-TW': '高雄的木瓜牛奶，現打的！', 'en-US': 'Kaohsiung papaya milk, freshly blended!' },
    items: [I.papayaMilk],
    at: at(KH.milkCart.x - 1.2, KH.milkCart.y, KH.milkCart.x + 1.2, KH.milkCart.y + 1.6),
    label: { x: KH.milkCart.x, y: KH.milkCart.y - 2.5 },
  },
  {
    name: { 'zh-TW': '河畔咖啡', 'en-US': 'Riverside Café' },
    call: { 'zh-TW': '坐在愛河邊喝杯咖啡吧～', 'en-US': 'Grab a coffee by the Love River~' },
    items: [I.icedCoffee, I.papayaMilk],
    at: at(KH.kiosk.x0 + 0.4, KH.kiosk.y, KH.kiosk.x1 - 0.4, KH.kiosk.y + 1.4),
    label: { x: (KH.kiosk.x0 + KH.kiosk.x1) / 2, y: KH.kiosk.y + 0.1 },
  },
];
