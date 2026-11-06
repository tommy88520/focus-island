// 嘉義（獨立地圖，從台北車站搭台鐵過來）：北邊遠遠的是阿里山的山和雲海，山腳下是檜意森活村（日式木造宿舍，緣側可以坐）、
// 阿里山森林鐵路的北門驛和一片檜木林；森林鐵路橫過地圖，紅色的小火車會開進北門驛（平交道會響、會放柵欄）；
// 中間西半部是文化路夜市（雞肉飯、沙鍋魚頭、豆花、方塊酥），東半部是噴水圓環（KANO 投手像）；南邊中山路過去是嘉義車站。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { CHIAYI_ITEMS as I } from './cityItems';

export const CY = {
  W: 56,
  H: 38,
  // 北邊：檜意森活村、北門驛的地面線；前面一條走道，再來是森林鐵路
  northLine: 9.2,
  houses: [
    { x0: 1, x1: 7.4 },
    { x0: 7.8, x1: 14.2 },
    { x0: 20.6, x1: 27 },
    { x0: 27.4, x1: 33.4 },
  ],
  beimen: { x0: 34.4, x1: 41.4 },
  rail: { y0: 11.2, y1: 12.4 },
  // 平交道（只有這裡可以過鐵軌）
  crossings: [17.4, 46.4],
  crossingHalf: 1.1,
  // 文化路夜市：橫的那段（攤車排在北邊），往南接文化路
  market: { x1: 34.4, y0: 12.4, y1: 20.4 },
  cartY: 15.2,
  bunka: { x0: 14.9, x1: 19.9 },
  // 噴水圓環：水池、廣場
  fountain: { cx: 45.6, cy: 18.6, pool: 2.3, r: 5.4 },
  // 中山路北邊的街屋地面線、中山路、嘉義車站
  rowLine: 25.4,
  southRoad: { y0: 25.8, y1: 28 },
  station: { x0: 17, x1: 39, y: 35.4 },
} as const;

// 座位（12 個，順序 = 座位編號 285–296，不要調換）：
// 檜意森活村兩棟的緣側（各 2 位，面向鐵路）、夜市兩張桌子（各 2 位，面向桌子）、噴水圓環四張長椅（北邊兩張面向水池、南邊兩張背對畫面看水池，各 2 位）
export const VERANDA_HOUSES = [0, 2];
export const VERANDA_Y = 9.8;
export const MARKET_TABLES = [8.4, 26.4];
export const TABLE_Y = 18.6;
export const FOUNTAIN_BENCHES: { x: number; y: number; facing: 'down' | 'up' }[] = [
  { x: 42.4, y: 14.8, facing: 'down' },
  { x: 48.8, y: 14.8, facing: 'down' },
  { x: 42.4, y: 23.2, facing: 'up' },
  { x: 48.8, y: 23.2, facing: 'up' },
];

const houseMid = (i: number) => {
  const h = CY.houses[i] ?? CY.houses[0];
  return (h.x0 + h.x1) / 2;
};

export const CHIAYI_SEATS: CitySeat[] = [
  ...VERANDA_HOUSES.flatMap((i): CitySeat[] => [
    { x: houseMid(i) - 1.6, y: VERANDA_Y, facing: 'down' },
    { x: houseMid(i) + 1.6, y: VERANDA_Y, facing: 'down' },
  ]),
  ...MARKET_TABLES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: TABLE_Y - 0.7, facing: 'down' },
    { x: x + 0.6, y: TABLE_Y - 0.7, facing: 'down' },
  ]),
  ...FOUNTAIN_BENCHES.flatMap((b): CitySeat[] => [
    { x: b.x - 0.6, y: b.y, facing: b.facing },
    { x: b.x + 0.6, y: b.y, facing: b.facing },
  ]),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

// 夜市的攤車（x 是檯面中間）：有 items 的可以買，其他是裝飾
export const MARKET_CARTS: { x: number; name: string; awning: string; food: string[]; shop?: { name: { 'zh-TW': string; 'en-US': string }; call: { 'zh-TW': string; 'en-US': string }; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: 2.4, name: '雞肉飯', awning: '#d97a1a', food: ['#f4ead2', '#e8c88a', '#f4ead2'], shop: { name: { 'zh-TW': '火雞肉飯', 'en-US': 'Turkey Rice' }, call: { 'zh-TW': '嘉義火雞肉飯，淋雞油跟紅蔥頭！', 'en-US': 'Chiayi turkey rice with shallot oil!' }, items: [I.turkeyRice] } },
  { x: 6.6, name: '沙鍋魚頭', awning: '#c62828', food: ['#8a4a2a', '#e8d5a8', '#8a4a2a'], shop: { name: { 'zh-TW': '沙鍋魚頭', 'en-US': 'Fish Head Casserole' }, call: { 'zh-TW': '大鍋沙茶魚頭，白菜燉到軟！', 'en-US': 'Fish head stewed with cabbage in satay broth!' }, items: [I.fishHeadCasserole] } },
  { x: 10.8, name: '烤玉米', awning: '#2a7a46', food: ['#f6c945', '#c98a3c', '#f6c945'] },
  { x: 23, name: '豆花', awning: '#1f5fa8', food: ['#f4f1e8', '#d6a86a', '#f4f1e8'], shop: { name: { 'zh-TW': '豆花', 'en-US': 'Tofu Pudding' }, call: { 'zh-TW': '豆花加花生、粉圓！', 'en-US': 'Tofu pudding with peanuts and tapioca!' }, items: [I.tofuPudding] } },
  { x: 27.2, name: '雞蛋糕', awning: '#8a3aa8', food: ['#e8b85a', '#e8b85a', '#e8b85a'] },
  { x: 31.4, name: '方塊酥', awning: '#b5553f', food: ['#e8c88a', '#d9b070', '#e8c88a'], shop: { name: { 'zh-TW': '方塊酥', 'en-US': 'Fangkuai Pastry' }, call: { 'zh-TW': '嘉義方塊酥，一層一層酥酥的！', 'en-US': 'Chiayi square pastry — flaky layer after layer!' }, items: [I.squarePastry] } },
];

// 檜意森活村第四棟是茶屋：站到緣側前面買阿里山高山茶
export const TEA_HOUSE = 3;

export const CHIAYI_SHOPS: CityShop[] = [
  ...MARKET_CARTS.flatMap((s): CityShop[] =>
    s.shop
      ? [
          {
            name: s.shop.name,
            call: s.shop.call,
            items: s.shop.items,
            at: at(s.x - 1.3, CY.cartY, s.x + 1.3, CY.cartY + 1),
            label: { x: s.x, y: CY.cartY - 2.7 },
          },
        ]
      : [],
  ),
  {
    name: { 'zh-TW': '檜町茶屋', 'en-US': 'Hinoki Tea House' },
    call: { 'zh-TW': '阿里山高山茶，剛泡好的！', 'en-US': 'Alishan high-mountain tea, freshly brewed!' },
    items: [I.alishanTea],
    at: at(houseMid(TEA_HOUSE) - 2, CY.northLine, houseMid(TEA_HOUSE) + 2, CY.northLine + 1.4),
    label: { x: houseMid(TEA_HOUSE), y: CY.northLine - 3.6 },
  },
];
