// 福岡（日本，獨立地圖；從京阪神、東京搭 JR／新幹線過來）：北邊遠景是福岡塔和巨蛋，
// 西北是櫛田神社（拜殿、石鳥居、大銀杏、高高的飾山笠），東北是 JR 博多站；過了馬路是中洲的霓虹大樓，
// 大樓前、那珂川河岸一整排屋台（主角：坐在長凳上跟老闆面對面吃），河上有橋、遊船，對岸有看河的長椅。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { FUKUOKA_ITEMS as I } from './cityItems';

export const FK = {
  W: 56,
  H: 44,
  // 天空、遠景（福岡塔、巨蛋、新幹線高架）
  horizon: 5.4,
  tower: { x: 27.6 },
  // 櫛田神社：拜殿、石鳥居、飾山笠、大銀杏
  haiden: { x0: 7.5, x1: 18.5, line: 10.6 },
  torii: { x0: 10.8, x1: 15.2, line: 12.9 },
  yamakasa: { x0: 19.4, x1: 24.4, line: 11.6 },
  ginkgo: { x: 3.6, y: 11.8 },
  shrineX1: 24.6,
  // JR 博多站
  station: { x0: 32, x1: 56, line: 13.2 },
  // 北邊人行道、馬路
  road: { y0: 14.8, y1: 17.2 },
  // 中洲：霓虹大樓（中間留一條巷子過馬路）
  nakasuLine: 23.4,
  alley: { x0: 25.6, x1: 29.4 },
  // 屋台：櫃台的地面線、河岸步道、那珂川、橋
  yatai: 26.8,
  riverY0: 30.4,
  riverY1: 36.8,
  bridge: { x0: 46, x1: 50 },
  // 對岸：長椅、柳樹、草地
  lawnY: 42.4,
} as const;

// 屋台：x 是中心；有 shop 的前面有長凳（2 位）
type Text2 = { 'zh-TW': string; 'en-US': string };
export interface Yatai {
  x: number;
  noren: string;
  norenColor: string;
  sign: string;
  food: 'ramen' | 'onigiri' | 'nabe' | 'yakitori' | 'oden';
  shop?: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] };
}
export const YATAI: Yatai[] = [
  { x: 5, noren: 'らあめん', norenColor: '#f4efe2', sign: '豚骨', food: 'ramen', shop: { name: { 'zh-TW': '豚骨拉麵', 'en-US': 'Tonkotsu Ramen' }, call: { 'zh-TW': '濃濃的豚骨湯、細麵，要不要「替玉」加麵？', 'en-US': 'Rich pork-bone broth, thin noodles — want a kaedama refill?' }, items: [I.hakataRamen] } },
  { x: 12.5, noren: '明太子', norenColor: '#e8402e', sign: '明太', food: 'onigiri', shop: { name: { 'zh-TW': '明太子飯糰', 'en-US': 'Mentaiko Onigiri' }, call: { 'zh-TW': '博多名產辣明太子，包成飯糰剛剛好！', 'en-US': 'Hakata’s spicy cod roe, wrapped in a rice ball!' }, items: [I.mentaiko] } },
  { x: 20, noren: 'もつ鍋', norenColor: '#2a3a5a', sign: '牛腸', food: 'nabe', shop: { name: { 'zh-TW': '牛腸鍋', 'en-US': 'Motsunabe' }, call: { 'zh-TW': '韭菜、高麗菜、牛腸，滾一鍋暖暖的！', 'en-US': 'Chives, cabbage and beef offal — a warm pot coming up!' }, items: [I.motsunabe] } },
  { x: 34, noren: 'やきとり', norenColor: '#f4efe2', sign: '串焼', food: 'yakitori', shop: { name: { 'zh-TW': '串燒', 'en-US': 'Yakitori' }, call: { 'zh-TW': '炭火現烤的雞肉串，配一杯烏龍茶！', 'en-US': 'Charcoal-grilled chicken skewers, fresh off the fire!' }, items: [I.yakitori] } },
  { x: 41.2, noren: 'おでん', norenColor: '#f4efe2', sign: '関東煮', food: 'oden' },
];

// 座位（12 個，順序 = 座位編號 453–464，不要調換）：
// 四座屋台前的長凳吧台（各 2 位，面向攤子跟老闆面對面）、那珂川對岸兩張長椅（各 2 位，背對畫面看河和中洲的霓虹）
export const YATAI_SEAT_Y = FK.yatai + 0.5;
export const RIVER_BENCHES = [17, 33];
export const RIVER_BENCH_Y = 38.7;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const FUKUOKA_SEATS: CitySeat[] = [
  ...pair(
    YATAI.filter((y) => y.shop).map((y) => y.x),
    YATAI_SEAT_Y,
    'up',
  ),
  ...pair(RIVER_BENCHES, RIVER_BENCH_Y, 'up'),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
export const FUKUOKA_SHOPS: CityShop[] = YATAI.flatMap((s): CityShop[] =>
  s.shop ? [{ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 2.4, FK.yatai, s.x + 2.4, FK.yatai + 1.9), label: { x: s.x, y: FK.yatai - 5.7 } }] : [],
);
