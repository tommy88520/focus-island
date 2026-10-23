// 臺南（孔廟文化園區一帶，獨立地圖，從台北車站搭高鐵過來）：
// 北邊中正路上有林百貨、度小月擔仔麵；左邊是臺南孔廟（大成殿、明倫堂、泮池、老榕樹、南牆上「全臺首學」的大門）；
// 中間南門路；右邊是臺南市美術館二館、府中街（泮宮坊、咖啡店、紅茶攤）、莉莉水果店；南邊府前路有高鐵接駁車的站牌。
// 跟其他地圖一樣，建築都畫成正面朝南。座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { TAINAN_ITEMS as I } from './cityItems';

export const TN = {
  W: 52,
  H: 36,
  // 北邊一排街屋的地面線（騎樓在下面），中正路
  northLine: 7.4,
  zhongzheng: { y0: 8.6, y1: 11.2 },
  // 孔廟：外牆（東牆中間開一個側門往南門路），南牆上「全臺首學」大門
  temple: { x0: 0.8, y0: 12.2, x1: 29.4, y1: 31.2 },
  wall: 0.5,
  eastGate: { y0: 22.6, y1: 25 },
  southGate: { x0: 22.4, x1: 26.4 },
  // 大成殿（坐北朝南，前面石頭月台＋階梯）、明倫堂（東邊，以前讀書的地方）
  dacheng: { x0: 8, y0: 14.2, x1: 18, y1: 18.4 },
  platform: { x0: 6.8, y0: 18.4, x1: 19.2, y1: 20.8 },
  minglun: { x0: 20.6, y0: 14.4, x1: 28.2, y1: 17.8 },
  // 泮池：半月形的水池（直邊在北、圓弧在南）
  panchi: { cx: 13, y0: 26, rx: 3.8, ry: 2.8 },
  banyans: [
    { tx: 3, ty: 22 },
    { tx: 19, ty: 27 },
  ],
  // 南門路（直的）、府前路（南邊）
  nanmen: { x0: 30.6, x1: 33.4 },
  fuqian: { y0: 32.4, y1: 35.4 },
  // 臺南市美術館二館、前面的廣場
  museum: { x0: 35, y0: 12.6, x1: 51.4, y1: 17.2 },
  // 府中街：北邊一排小店、中間的巷子、巷口的泮宮坊
  fuzhongShops: { x0: 38.6, y0: 19.8, x1: 52, y1: 22.2 },
  fuzhong: { y0: 22.2, y1: 25.6 },
  panGong: { x0: 34.6, x1: 38.2, y: 21.6 },
  // 莉莉水果店那一排（府中街的南邊、府前路的北邊）
  lily: { x0: 38.2, y0: 25.6, x1: 44.2, y1: 29.6 },
  southShops: { x0: 44.2, y0: 25.6, x1: 52, y1: 29.6 },
  // 高鐵接駁車站牌（府前路北邊的人行道）
  busStop: { x: 17.2, y: 31.9 },
} as const;

// 北邊中正路的街屋（每棟一張小圖）：度小月、林百貨是特別的
export interface TainanShophouse {
  x0: number;
  x1: number;
  floors: number;
  seed: number;
  special?: 'duxiaoyue' | 'hayashi';
}
export const NORTH_ROW: TainanShophouse[] = [
  { x0: 0, x1: 4.6, floors: 2, seed: 11 },
  { x0: 4.6, x1: 9.4, floors: 3, seed: 12 },
  { x0: 9.4, x1: 14, floors: 2, seed: 13 },
  { x0: 14, x1: 18.6, floors: 2, seed: 14, special: 'duxiaoyue' },
  { x0: 18.6, x1: 22.4, floors: 3, seed: 15 },
  { x0: 22.4, x1: 26.4, floors: 3, seed: 16 },
  { x0: 26.4, x1: 40.4, floors: 5, seed: 17, special: 'hayashi' },
  { x0: 40.4, x1: 44.6, floors: 3, seed: 18 },
  { x0: 44.6, x1: 48.4, floors: 2, seed: 19 },
  { x0: 48.4, x1: 52, floors: 3, seed: 20 },
];

// 府中街北邊的小店：咖啡、文創、紅茶攤…（2 樓的老屋）
export interface FuzhongShop {
  x0: number;
  x1: number;
  kind: 'cafe' | 'craft' | 'tea' | 'ice' | 'cat';
}
export const FUZHONG_ROW: FuzhongShop[] = [
  { x0: 38.6, x1: 41.4, kind: 'craft' },
  { x0: 41.4, x1: 44.8, kind: 'cafe' },
  { x0: 44.8, x1: 47.6, kind: 'cat' },
  { x0: 47.6, x1: 50.2, kind: 'tea' },
  { x0: 50.2, x1: 52, kind: 'ice' },
];

// 座位（12 個，順序 = 座位編號 189–200，不要調換）：
// 明倫堂前 4 張書桌（面向明倫堂讀書）、老榕樹下石桌 2 張石凳、府中街咖啡店門口 2 張桌子各 2 張椅子、莉莉水果店門口 2 張小桌
export const MINGLUN_DESKS = [21.6, 23.4, 25.2, 27];
export const DESK_Y = 20.7;
export const STONE_TABLE = { x: 6.6, y: 25.1 };
export const CAFE_TABLES = [41.6, 46.4];
export const CAFE_Y = 24.2;
export const LILY_TABLES = [39.6, 42.6];
export const LILY_SEAT_Y = 30.9;

export const TAINAN_SEATS: CitySeat[] = [
  ...MINGLUN_DESKS.map((x): CitySeat => ({ x, y: DESK_Y, facing: 'up' })),
  { x: STONE_TABLE.x - 0.9, y: STONE_TABLE.y, facing: 'right' },
  { x: STONE_TABLE.x + 0.9, y: STONE_TABLE.y, facing: 'left' },
  ...CAFE_TABLES.flatMap((x): CitySeat[] => [
    { x: x - 0.85, y: CAFE_Y, facing: 'right' },
    { x: x + 0.85, y: CAFE_Y, facing: 'left' },
  ]),
  ...LILY_TABLES.map((x): CitySeat => ({ x, y: LILY_SEAT_Y, facing: 'up' })),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const TAINAN_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '度小月擔仔麵', 'en-US': 'Du Hsiao Yueh Danzai Noodles' },
    call: { 'zh-TW': '擔仔麵一碗，肉燥香香的！', 'en-US': 'A bowl of danzai noodles, rich pork sauce!' },
    items: [I.danzaiNoodles, I.shrimpRoll],
    at: at(14.6, TN.northLine, 18, TN.northLine + 1.4),
    label: { x: 16.3, y: TN.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '林百貨', 'en-US': 'Hayashi Department Store' },
    call: { 'zh-TW': '歡迎光臨，林百貨！', 'en-US': 'Welcome to Hayashi!' },
    items: [I.linTote, I.pineappleCake],
    at: at(31.4, TN.northLine, 35.4, TN.northLine + 1.4),
    label: { x: 33.4, y: TN.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '府中街咖啡', 'en-US': 'Fuzhong St. Café' },
    call: { 'zh-TW': '來杯冰拿鐵，坐外面曬太陽～', 'en-US': 'Iced latte? Sit outside in the sun~' },
    items: [I.icedCoffee],
    at: at(41.6, TN.fuzhong.y0, 44.6, TN.fuzhong.y0 + 1.2),
    label: { x: 43.1, y: TN.fuzhong.y0 + 0.1 },
  },
  {
    name: { 'zh-TW': '古早味紅茶', 'en-US': 'Old-school Black Tea' },
    call: { 'zh-TW': '紅茶冰冰涼涼，一杯 35！', 'en-US': 'Ice-cold black tea, just 35!' },
    items: [I.blackTea],
    at: at(47.8, TN.fuzhong.y0, 50, TN.fuzhong.y0 + 1.2),
    label: { x: 48.9, y: TN.fuzhong.y0 + 0.1 },
  },
  {
    name: { 'zh-TW': '莉莉水果店', 'en-US': 'Lily Fruit Shop' },
    call: { 'zh-TW': '水果冰、番茄切盤，都是當季的！', 'en-US': 'Fruit ice and tomato plates, all in season!' },
    items: [I.fruitIce, I.tomatoPlate],
    at: at(40.5, TN.lily.y1, 41.7, TN.lily.y1 + 1.8),
    label: { x: 41.1, y: TN.lily.y1 + 0.1 },
  },
];
