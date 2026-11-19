// 神戶（日本，獨立地圖；京阪神之間搭 JR）：北邊山坡上是北野異人館（風見雞館的紅磚和風向雞、萌黃館的淺綠木屋），前面有長椅；
// 中間西邊是南京町中華街（長安門、攤子賣豬肉包、神戶牛串、神戶布丁，涼亭旁的桌子），東邊是 JR 三之宮站；
// 過了馬路是港邊的美利堅公園（紅色的神戶塔、白色的海洋博物館、BE KOBE、摩天輪），海邊的長椅可以坐，海上有船。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { KOBE_ITEMS as I } from './cityItems';

export const KB = {
  W: 56,
  H: 44,
  // 北野：異人館的地面線、坡道的路
  kitanoLine: 11,
  kazamidori: { x0: 9, x1: 21 },
  moegi: { x0: 27, x1: 36 },
  // 南京町：牌樓（長安門）、攤子
  gate: { x0: 15.4, x1: 21.6, y: 18.4 },
  cartY: 20,
  carts: [4, 11, 26, 32.5],
  chinaY1: 24.6,
  station: { x0: 37, x1: 55, line: 23.8 },
  road: { y0: 25, y1: 27.4 },
  // 美利堅公園：神戶塔、海洋博物館、BE KOBE、摩天輪；海
  parkLine: 35.2,
  tower: { x: 21 },
  museum: { x0: 25, x1: 36 },
  beKobe: { x: 11, y: 33.4 },
  wheel: { x: 47 },
  sea: 37.4,
} as const;

// 座位（12 個，順序 = 座位編號 393–404，不要調換）：
// 港邊兩張長椅（面向海，各 2 位）、南京町兩張桌子（各 2 位）、北野異人館前兩張長椅（各 2 位）
export const HARBOR_BENCHES = [7, 41];
export const HARBOR_BENCH_Y = 36.8;
export const CHINA_TABLES = [15, 22];
export const CHINA_TABLE_Y = 23.4;
export const KITANO_BENCHES = [24, 39.5];
export const KITANO_BENCH_Y = 13.6;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const KOBE_SEATS: CitySeat[] = [...pair(HARBOR_BENCHES, HARBOR_BENCH_Y, 'down'), ...pair(CHINA_TABLES, CHINA_TABLE_Y - 0.7, 'down'), ...pair(KITANO_BENCHES, KITANO_BENCH_Y, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
type Text2 = { 'zh-TW': string; 'en-US': string };
export const CHINA_CARTS: { x: number; name: string; awning: string; food: string[]; shop?: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: KB.carts[0], name: '豚饅', awning: '#c8102e', food: ['#f4efe2', '#f4efe2', '#f4efe2'], shop: { name: { 'zh-TW': '豬肉包', 'en-US': 'Pork Buns' }, call: { 'zh-TW': '剛蒸好的豚饅，排隊也要吃！', 'en-US': 'Fresh steamed pork buns — worth the queue!' }, items: [I.butaman] } },
  { x: KB.carts[1], name: '神戸牛', awning: '#5a2a1a', food: ['#8a3a2a', '#a8483a', '#8a3a2a'], shop: { name: { 'zh-TW': '神戶牛串', 'en-US': 'Kobe Beef Skewers' }, call: { 'zh-TW': '入口即化的神戶牛，烤一串給你！', 'en-US': 'Melt-in-your-mouth Kobe beef, grilled to order!' }, items: [I.kobeBeef] } },
  { x: KB.carts[2], name: '小籠包', awning: '#e8b830', food: ['#f4efe2', '#e8dcc4', '#f4efe2'] },
  { x: KB.carts[3], name: 'プリン', awning: '#e07a1f', food: ['#f0c860', '#6a3a1a', '#f0c860'], shop: { name: { 'zh-TW': '神戶布丁', 'en-US': 'Kobe Pudding' }, call: { 'zh-TW': '神戶的伴手禮，焦糖布丁！', 'en-US': 'Kobe’s favourite souvenir — caramel pudding!' }, items: [I.kobePudding] } },
];

export const KOBE_SHOPS: CityShop[] = CHINA_CARTS.flatMap((s): CityShop[] =>
  s.shop ? [{ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.3, KB.cartY, s.x + 1.3, KB.cartY + 1), label: { x: s.x, y: KB.cartY - 2.9 } }] : [],
);
