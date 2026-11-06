// 宜蘭（獨立地圖，從台北車站搭台鐵過來）：北邊遠遠的是雪山山脈和蘭陽平原的稻田，往東的海上有龜山島；
// 稻田前面是宜蘭河，河堤上的自行車道有石椅可以坐著看河；河堤下西半部是宜蘭酒廠（紅磚老廠房、甲子蘭酒文物館、大煙囪），
// 東半部是東門夜市（卜肉、三星蔥油餅、糕渣、牛舌餅、花生捲冰淇淋）；過了馬路，西南是丟丟噹森林（鋼構大樹上掛著一節火車），東南是宜蘭車站。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { YILAN_ITEMS as I } from './cityItems';

export const YL = {
  W: 56,
  H: 38,
  // 北邊：山、稻田（paddy）、宜蘭河（river）、河堤上的自行車道（levee），堤防的草坡到 slope
  paddy: { y0: 4.4, y1: 6.2 },
  river: { y0: 6.2, y1: 8.8 },
  levee: { y0: 8.8, y1: 11.2 },
  slope: 12,
  // 河上的橋（裝飾，走不過去）
  bridge: { x0: 25.6, x1: 29.4 },
  // 宜蘭酒廠：紅磚廠房的地面線、前面的紅磚廣場
  brewery: { x0: 0.6, x1: 23.4, line: 17.4 },
  // 東門夜市：攤車排在北邊、桌子在中間，往南出牌樓
  market: { x0: 24.4, y0: 12, y1: 22.4 },
  cartY: 15.6,
  arch: { x0: 38.6, x1: 43.2 },
  // 中間的馬路
  road: { y0: 22.6, y1: 24.8 },
  // 丟丟噹森林（西南）、宜蘭車站（東南）
  forest: { x1: 30.6 },
  station: { x0: 33.4, x1: 53.4, y: 35.6 },
} as const;

// 座位（12 個，順序 = 座位編號 297–308，不要調換）：
// 宜蘭河堤的兩張石椅（背對畫面看河和稻田，各 2 位）、丟丟噹森林兩張長椅（面向畫面，各 2 位）、東門夜市兩張桌子（各 2 位）
export const RIVER_BENCHES = [10.4, 45.6];
export const RIVER_BENCH_Y = 9.9;
export const FOREST_BENCHES = [9, 21];
export const FOREST_BENCH_Y = 33.2;
export const MARKET_TABLES = [34.6, 47.8];
export const TABLE_Y = 19.6;

export const YILAN_SEATS: CitySeat[] = [
  ...RIVER_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: RIVER_BENCH_Y, facing: 'up' },
    { x: x + 0.6, y: RIVER_BENCH_Y, facing: 'up' },
  ]),
  ...FOREST_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: FOREST_BENCH_Y, facing: 'down' },
    { x: x + 0.6, y: FOREST_BENCH_Y, facing: 'down' },
  ]),
  ...MARKET_TABLES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: TABLE_Y - 0.7, facing: 'down' },
    { x: x + 0.6, y: TABLE_Y - 0.7, facing: 'down' },
  ]),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

type CartShop = { name: { 'zh-TW': string; 'en-US': string }; call: { 'zh-TW': string; 'en-US': string }; items: (typeof I)[keyof typeof I][] };
// 夜市的攤車（x 是檯面中間）：有 shop 的可以買，其他是裝飾
export const MARKET_CARTS: { x: number; name: string; awning: string; food: string[]; shop?: CartShop }[] = [
  { x: 27.4, name: '卜肉', awning: '#d97a1a', food: ['#d9a04a', '#c98a3c', '#d9a04a'], shop: { name: { 'zh-TW': '卜肉', 'en-US': 'Bu-rou' }, call: { 'zh-TW': '宜蘭卜肉，現炸的里肌肉條！', 'en-US': 'Yilan bu-rou — pork strips fried to order!' }, items: [I.buRou] } },
  { x: 31.8, name: '三星蔥油餅', awning: '#2a7a46', food: ['#e8c88a', '#7ab86a', '#e8c88a'], shop: { name: { 'zh-TW': '三星蔥油餅', 'en-US': 'Sanxing Scallion Pancake' }, call: { 'zh-TW': '三星的青蔥，蔥比餅還多！', 'en-US': 'Sanxing scallions — more scallion than pancake!' }, items: [I.scallionPancake] } },
  { x: 36.2, name: '鴨賞', awning: '#8a3a2a', food: ['#8a4a2a', '#b5704a', '#8a4a2a'] },
  { x: 45.4, name: '糕渣', awning: '#c62828', food: ['#f2d68a', '#e8c070', '#f2d68a'], shop: { name: { 'zh-TW': '糕渣', 'en-US': 'Gaozha' }, call: { 'zh-TW': '外酥內嫩的糕渣，小心燙！', 'en-US': 'Crispy outside, molten inside — careful, it’s hot!' }, items: [I.gaozha] } },
  { x: 49.8, name: '牛舌餅', awning: '#1f5fa8', food: ['#e8c88a', '#d9b070', '#e8c88a'], shop: { name: { 'zh-TW': '牛舌餅', 'en-US': 'Ox-tongue Pastry' }, call: { 'zh-TW': '宜蘭薄脆牛舌餅，帶一盒回去！', 'en-US': 'Thin, crisp Yilan ox-tongue pastry — take a box home!' }, items: [I.oxTonguePastry] } },
  { x: 54.2, name: '花生捲冰淇淋', awning: '#8a3aa8', food: ['#f4f1e8', '#d6a86a', '#f4f1e8'], shop: { name: { 'zh-TW': '花生捲冰淇淋', 'en-US': 'Peanut Ice Cream Roll' }, call: { 'zh-TW': '花生糖粉加芋頭冰淇淋，要不要香菜？', 'en-US': 'Peanut brittle and taro ice cream — coriander?' }, items: [I.icecreamRoll] } },
];

export const YILAN_SHOPS: CityShop[] = MARKET_CARTS.flatMap((s): CityShop[] =>
  s.shop
    ? [
        {
          name: s.shop.name,
          call: s.shop.call,
          items: s.shop.items,
          at: at(s.x - 1.3, YL.cartY, s.x + 1.3, YL.cartY + 1),
          label: { x: s.x, y: YL.cartY - 2.7 },
        },
      ]
    : [],
);
