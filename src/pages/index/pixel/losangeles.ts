// 洛杉磯（美國，獨立地圖；美國城市之間搭飛機）：把好萊塢和聖塔莫尼卡放在同一張（實際上相隔 20 多公里）。
// 北邊是好萊塢山丘（山坡上的白色大字招牌、山上的葛瑞菲斯天文台）；中間是好萊塢大道和星光大道（人行道上一顆顆粉紅色的星星、
// 中式戲院風格的電影院、地鐵站入口），星光大道旁有長椅；過了馬路西邊是塔可餐車和漢堡攤（野餐桌可以坐），
// 中間是棕櫚樹的草地和聖塔莫尼卡碼頭的入口（66 號公路終點招牌）；南邊是沙灘、自行車道、碼頭上的摩天輪和雲霄飛車，
// 沙灘和碼頭上有看夕陽的長椅，海是太平洋。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { LOSANGELES_ITEMS as I } from './cityItems';

export const LA = {
  W: 58,
  H: 46,
  // 好萊塢大道：北邊建築的地面線、星光大道（人行道）、馬路、南邊的人行道
  blvdLine: 15.2,
  walk: { y0: 15.2, y1: 18.8 },
  road: { y0: 18.8, y1: 22.2 },
  south: { y0: 22.2, y1: 23.4 },
  // 大道北邊的建築（x0、x1）
  souvenir: { x0: 0, x1: 7.2 },
  theatre: { x0: 11, x1: 23 },
  diner: { x0: 25, x1: 31 },
  hotel: { x0: 35, x1: 42 },
  metro: { x0: 44, x1: 52 },
  records: { x0: 53.2, x1: 58 },
  // 天文台（山上）
  observatory: { x: 48, base: 8.6 },
  // 塔可餐車、漢堡攤、吉拿棒推車
  truck: { x: 6, y: 26.6 },
  burger: { x: 14.6, y: 26.6 },
  churro: { x: 25.2, y: 28.2 },
  // 碼頭：入口的拱門、木棧橋（窄的）、遊樂園的平台、66 號公路終點招牌
  deck: { x0: 29.5, x1: 35.5 },
  arch: { y: 25.4 },
  route66: { x: 38, y: 28 },
  platform: { x0: 29.5, y0: 34, x1: 50, y1: 41.4 },
  tail: { x0: 31, x1: 35 },
  coaster: { x0: 30.4, x1: 40.4, y: 36.4 },
  wheel: { x: 45.4, y: 37.4 },
  // 沙灘：自行車道、沙、海、救生員塔
  bikePath: { y0: 31, y1: 32.4 },
  sea: 38.4,
  lifeguard: { x: 6.5, y: 36.2 },
} as const;

// 座位（12 個，順序 = 座位編號 525–536，不要調換）：
// 碼頭平台上看海的長椅、沙灘上看夕陽的長椅（各 2 位）、星光大道旁兩張長椅（各 2 位）、塔可餐車旁兩張野餐桌（各 2 位）
export const PIER_BENCH = { x: 38.4, y: 40.6 };
export const BEACH_BENCH = { x: 16, y: 36.6 };
export const WALK_BENCHES = [9, 33];
export const WALK_BENCH_Y = 16.9;
export const PICNIC_TABLES = [5, 12.6];
export const PICNIC_Y = 29.8;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const LOSANGELES_SEATS: CitySeat[] = [
  ...pair([PIER_BENCH.x], PIER_BENCH.y, 'down'),
  ...pair([BEACH_BENCH.x], BEACH_BENCH.y, 'down'),
  ...pair(WALK_BENCHES, WALK_BENCH_Y, 'down'),
  ...pair(PICNIC_TABLES, PICNIC_Y - 0.7, 'down'),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const LOSANGELES_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '塔可餐車', 'en-US': 'Taco Truck' },
    call: { 'zh-TW': '剛烤好的塔可和大捲餅，莎莎醬自己加！', 'en-US': 'Fresh tacos and big burritos — help yourself to salsa!' },
    items: [I.taco, I.burrito],
    at: at(LA.truck.x - 2.2, LA.truck.y, LA.truck.x + 2.2, LA.truck.y + 1),
    label: { x: LA.truck.x, y: LA.truck.y - 3.6 },
  },
  {
    name: { 'zh-TW': '漢堡攤', 'en-US': 'Burger Stand' },
    call: { 'zh-TW': '加州風的起司漢堡，現煎的！', 'en-US': 'California-style cheeseburgers, fresh off the grill!' },
    items: [I.cheeseburger],
    at: at(LA.burger.x - 2, LA.burger.y, LA.burger.x + 2, LA.burger.y + 1),
    label: { x: LA.burger.x - 0.6, y: LA.burger.y - 5.3 },
  },
  {
    name: { 'zh-TW': '吉拿棒', 'en-US': 'Churros' },
    call: { 'zh-TW': '外脆內軟，沾滿肉桂糖的吉拿棒！', 'en-US': 'Crispy churros rolled in cinnamon sugar!' },
    items: [I.churro],
    at: at(LA.churro.x - 1.3, LA.churro.y, LA.churro.x + 1.3, LA.churro.y + 1),
    label: { x: LA.churro.x, y: LA.churro.y - 2.9 },
  },
];
