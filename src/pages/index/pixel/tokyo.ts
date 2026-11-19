// 東京（日本，獨立地圖；從桃園機場飛成田、日本城市之間搭 JR）：北邊是淺草寺（本堂、五重塔、常香爐，遠方看得到晴空塔），
// 本堂前可以抽籤；兩旁是仲見世通的小店（人形燒、雷米香、炸饅頭），南邊的雷門掛著大紅燈籠，門口有人力車；
// 過了馬路是隅田川（紅色的吾妻橋、水上巴士），河邊步道可以坐；再往南是丸之內廣場和 JR 東京站的紅磚站舍。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { TOKYO_ITEMS as I } from './cityItems';

export const TK = {
  W: 56,
  H: 47,
  hondo: { x0: 15, x1: 37, line: 10.4 },
  pagoda: { x: 44.5, line: 10.8 },
  censer: { x: 26, y: 12.8 },
  // 仲見世的小店（地面線）
  rowLine: 19.4,
  nakamise: [
    { x0: 2.6, x1: 8.6, name: '人形焼', color: '#c8102e' },
    { x0: 8.6, x1: 14.6, name: '雷おこし', color: '#e8b830' },
    { x0: 14.6, x1: 20.6, name: '揚げまんじゅう', color: '#2f5d3a' },
    { x0: 31.4, x1: 37.4, name: '扇子', color: '#1f4e9c' },
    { x0: 37.4, x1: 43.4, name: '和雑貨', color: '#7a3fb0' },
    { x0: 43.4, x1: 49.4, name: 'せんべい', color: '#b8282e' },
  ],
  kaminarimon: { x0: 20.6, x1: 31.4, line: 23.8 },
  road: { y0: 25, y1: 27.4 },
  river: { y0: 28, y1: 32 },
  azuma: { x0: 40, x1: 44.4 },
  promenade: { y1: 34.4 },
  road2: { y0: 34.4, y1: 36.6 },
  station: { x0: 12, x1: 44, line: 45.6 },
} as const;

// 座位（12 個，順序 = 座位編號 405–416，不要調換）：
// 隅田川步道兩張長椅（背對畫面看河和淺草，各 2 位）、淺草寺廣場兩張長椅（各 2 位）、丸之內廣場兩張長椅（各 2 位）
export const RIVER_BENCHES = [12, 26];
export const RIVER_BENCH_Y = 33.4;
export const TEMPLE_BENCHES = [7, 45];
export const TEMPLE_BENCH_Y = 14.8;
export const PLAZA_BENCHES = [6, 50];
export const PLAZA_BENCH_Y = 41.6;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const TOKYO_SEATS: CitySeat[] = [...pair(RIVER_BENCHES, RIVER_BENCH_Y, 'up'), ...pair(TEMPLE_BENCHES, TEMPLE_BENCH_Y, 'down'), ...pair(PLAZA_BENCHES, PLAZA_BENCH_Y, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const shopAt = (k: number): Rect => {
  const s = TK.nakamise[k] ?? TK.nakamise[0];
  return at(s.x0 + 0.6, TK.rowLine, s.x1 - 0.6, TK.rowLine + 1.2);
};
const labelAt = (k: number) => {
  const s = TK.nakamise[k] ?? TK.nakamise[0];
  return { x: (s.x0 + s.x1) / 2, y: TK.rowLine + 2.1 };
};

export const TOKYO_SHOPS: CityShop[] = [
  { name: { 'zh-TW': '人形燒', 'en-US': 'Ningyo-yaki' }, call: { 'zh-TW': '剛烤好的人形燒，紅豆餡的！', 'en-US': 'Freshly baked ningyo-yaki with red bean filling!' }, items: [I.ningyoyaki], at: shopAt(0), label: labelAt(0) },
  { name: { 'zh-TW': '雷米香', 'en-US': 'Kaminari Okoshi' }, call: { 'zh-TW': '淺草的老伴手禮，雷おこし！', 'en-US': 'Asakusa’s classic souvenir — kaminari okoshi!' }, items: [I.kaminariOkoshi], at: shopAt(1), label: labelAt(1) },
  { name: { 'zh-TW': '炸饅頭', 'en-US': 'Age-manju' }, call: { 'zh-TW': '外酥內軟的炸饅頭，有抹茶和地瓜口味。', 'en-US': 'Crispy fried manju — matcha or sweet potato?' }, items: [I.ageManju], at: shopAt(2), label: labelAt(2) },
];

// 本堂前抽籤（淺草寺的籤：凶也不少）
export const HONDO_DOOR = { x: (TK.hondo.x0 + TK.hondo.x1) / 2, y: TK.hondo.line + 0.8 };
