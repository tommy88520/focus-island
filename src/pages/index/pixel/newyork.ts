// 紐約（美國，獨立地圖；美國城市之間搭國內線飛機）：北邊遠方是曼哈頓天際線（帝國大廈、克萊斯勒大廈），前面是中央公園
// （湖、弓橋 Bow Bridge、湖邊長椅、公園道路上的馬車）；過了中央公園南街是時代廣場（四面大樓滿滿的電子看板、中間的紅色階梯可以坐、
// 椒鹽卷餅推車、披薩店、貝果熟食店、地鐵站入口）；再過一條街，西南是褐石公寓、東南是水邊，看得到自由女神和布魯克林大橋。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { NEWYORK_ITEMS as I } from './cityItems';

export const NY = {
  W: 56,
  H: 47,
  // 天際線（遠景）的地面線
  skyline: 4.6,
  // 中央公園：湖往北伸進樹林的那段（弓橋跨在上面）、南邊寬的湖面、公園道路、南邊的矮石牆
  channel: { x0: 24.5, x1: 31.5, y0: 5.4, y1: 10.8 },
  pool: { x0: 9.5, x1: 46.5, y0: 10.8, y1: 13.2 },
  bridge: { x0: 23.4, x1: 32.6, y: 8.9 },
  drive: { y0: 13.6, y1: 14.9 },
  wall: 15.2,
  road1: { y0: 15.4, y1: 17.6 },
  // 時代廣場：北邊那排大樓的地面線、往北的兩條小街（缺口）、東西兩側大樓、紅色階梯
  north: 25,
  gaps: [
    [9, 12],
    [44, 47],
  ] as [number, number][],
  flank: { w: 8.5, line: 32 },
  steps: { x0: 24.5, x1: 31.5, y0: 26.2, y1: 30.6 },
  road2: { y0: 33.4, y1: 35.8 },
  // 褐石公寓（西南）、水邊的欄杆、水
  brown: { x1: 21, line: 39.6 },
  rail: 41.4,
  sea: 41.6,
  liberty: { x: 33.5, y: 46.0 },
  bridgeTower: { x: 50, y: 46.7 },
  subway: { x: 38.5, y: 30.6 },
  cart: { x: 17, y: 30.2 },
} as const;

// 座位（12 個，順序 = 座位編號 537–548，不要調換）：
// 時代廣場紅色階梯 4 位（兩排，面向北邊的看板）、中央公園湖邊兩張長椅（各 2 位）、水邊看自由女神的兩張長椅（各 2 位）
export const STEP_ROWS = [28.0, 29.6];
export const STEP_XS = [26.6, 29.4];
export const POND_BENCHES = [15, 41];
export const POND_BENCH_Y = 10.3;
export const HARBOR_BENCHES = [27.5, 39.5];
export const HARBOR_BENCH_Y = 41.0;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const NEWYORK_SEATS: CitySeat[] = [
  ...STEP_ROWS.flatMap((y) => STEP_XS.map((x): CitySeat => ({ x, y, facing: 'up' }))),
  ...pair(POND_BENCHES, POND_BENCH_Y, 'down'),
  ...pair(HARBOR_BENCHES, HARBOR_BENCH_Y, 'down'),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const NEWYORK_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '街角披薩店', 'en-US': 'Corner Pizza' },
    call: { 'zh-TW': '一大片起司披薩，對折著吃才道地！', 'en-US': 'A giant cheese slice — fold it like a New Yorker!' },
    items: [I.pizzaSlice],
    at: at(1.4, 32, 7.1, 33.3),
    label: { x: 4.25, y: 30.9 },
  },
  {
    name: { 'zh-TW': '貝果熟食店', 'en-US': 'Bagel Deli' },
    call: { 'zh-TW': '剛烤好的貝果抹奶油乳酪，再來一塊起司蛋糕？', 'en-US': 'Fresh bagels with schmear — and a slice of cheesecake?' },
    items: [I.bagel, I.nyCheesecake],
    at: at(48.9, 32, 54.6, 33.3),
    label: { x: 51.75, y: 30.9 },
  },
  {
    name: { 'zh-TW': '椒鹽卷餅推車', 'en-US': 'Pretzel Cart' },
    call: { 'zh-TW': '熱呼呼的椒鹽卷餅，撒粗鹽！', 'en-US': 'Hot soft pretzels with coarse salt!' },
    items: [I.pretzel],
    at: at(NY.cart.x - 1.4, NY.cart.y, NY.cart.x + 1.4, NY.cart.y + 1.1),
    label: { x: NY.cart.x, y: NY.cart.y - 3 },
  },
];
