// 澎湖（獨立地圖，從台北車站搭高鐵到左營、再坐船過來）：北邊是澎湖天后宮（台灣最老的媽祖廟，可以抽籤）和中央老街的咾咕石老屋；
// 中間的廣場有四眼井，東邊是小吃攤（黑糖糕、仙人掌冰、花枝丸、鹹餅）；過了馬路是海邊的步道，
// 南邊一個小海灣，西瀛虹橋橫跨海灣（可以走過去，晚上彩虹燈、放煙火），西岸是觀音亭，東岸是馬公港的渡輪站，海裡有石滬。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { PENGHU_ITEMS as I } from './cityItems';

export const PH = {
  W: 56,
  H: 38,
  // 北邊：天后宮、中央老街的地面線
  rowLine: 10.6,
  temple: { x0: 19, x1: 31 },
  // 中間的廣場、小吃攤
  plaza: { y0: 10.6, y1: 21.2 },
  well: { x: 9, y: 16.4 },
  market: { x0: 32 },
  cartY: 15.6,
  // 馬路、海邊步道
  road: { y0: 21.4, y1: 23.4 },
  // 海灣（cove）、西瀛虹橋（橋面 y0–y1，從西岸走到東岸）、南邊的外海
  cove: { x0: 14, x1: 34, y0: 27 },
  bridge: { y0: 29.4, y1: 31.2 },
  openSea: 35.2,
  // 西岸觀音亭、東岸馬公港渡輪站、碼頭
  kuanyin: { x0: 2.6, x1: 10.6, line: 30.4 },
  terminal: { x0: 38, x1: 50, line: 31 },
  pier: { x0: 50.6, x1: 54 },
} as const;

// 座位（12 個，順序 = 座位編號 333–344，不要調換）：
// 海灣北邊步道兩張長椅（面向海灣和虹橋，各 2 位）、小吃攤兩張桌子（各 2 位）、觀音亭前兩張長椅（面向外海，各 2 位）
export const COVE_BENCHES = [19, 29];
export const COVE_BENCH_Y = 26.2;
export const MARKET_TABLES = [37.6, 48.6];
export const TABLE_Y = 19.6;
export const KUANYIN_BENCHES = [3.8, 9.6];
export const KUANYIN_BENCH_Y = 33.6;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const PENGHU_SEATS: CitySeat[] = [...pair(COVE_BENCHES, COVE_BENCH_Y, 'down'), ...pair(MARKET_TABLES, TABLE_Y - 0.7, 'down'), ...pair(KUANYIN_BENCHES, KUANYIN_BENCH_Y, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

type Text2 = { 'zh-TW': string; 'en-US': string };
export const MARKET_CARTS: { x: number; name: string; awning: string; food: string[]; shop?: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: 34, name: '黑糖糕', awning: '#5a3a22', food: ['#6a3a1a', '#8a4a22', '#6a3a1a'], shop: { name: { 'zh-TW': '黑糖糕', 'en-US': 'Brown Sugar Cake' }, call: { 'zh-TW': '澎湖黑糖糕，QQ 軟軟的！', 'en-US': 'Penghu brown sugar cake — soft and chewy!' }, items: [I.brownSugarCake] } },
  { x: 38.4, name: '仙人掌冰', awning: '#c2185b', food: ['#e8407a', '#d6306a', '#e8407a'], shop: { name: { 'zh-TW': '仙人掌冰', 'en-US': 'Cactus Ice' }, call: { 'zh-TW': '仙人掌果做的冰，紫紅色酸酸甜甜！', 'en-US': 'Ice made from cactus fruit — magenta, sweet and tangy!' }, items: [I.cactusIce] } },
  { x: 42.8, name: '花枝丸', awning: '#1f6fa8', food: ['#f4e6c0', '#e8d0a0', '#f4e6c0'], shop: { name: { 'zh-TW': '花枝丸', 'en-US': 'Cuttlefish Balls' }, call: { 'zh-TW': '現炸花枝丸，咬得到花枝塊！', 'en-US': 'Fried cuttlefish balls with real chunks!' }, items: [I.cuttlefishBall] } },
  { x: 47.2, name: '鹹餅', awning: '#d97a1a', food: ['#e8c88a', '#d9b070', '#e8c88a'], shop: { name: { 'zh-TW': '澎湖鹹餅', 'en-US': 'Penghu Salty Biscuit' }, call: { 'zh-TW': '鹹餅、冬瓜糕，伴手禮帶回去！', 'en-US': 'Salty biscuits to take home!' }, items: [I.saltyBiscuit] } },
  { x: 51.6, name: '小管麵線', awning: '#2a7a46', food: ['#f2e8d4', '#e8a07a', '#f2e8d4'] },
];

export const PENGHU_SHOPS: CityShop[] = MARKET_CARTS.flatMap((s): CityShop[] =>
  s.shop ? [{ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.3, PH.cartY, s.x + 1.3, PH.cartY + 1), label: { x: s.x, y: PH.cartY - 2.7 } }] : [],
);

// 天后宮門口抽籤的地方
export const TEMPLE_DOOR = { x: (PH.temple.x0 + PH.temple.x1) / 2, y: PH.rowLine + 0.8 };
