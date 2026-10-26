// 新竹（獨立地圖，從台北車站搭台鐵過來）：北邊中山路上是城隍廟（可以求籤）和廟口小吃（貢丸湯、炒米粉、肉圓、潤餅），
// 東邊一排街屋；中間西半部是護城河親水公園（一階階的石階、踏腳石、兩座拱橋），東半部是東門城（迎曦門）圓環廣場；
// 南邊中華路過去就是新竹車站（巴洛克式的老車站，鐘樓的時鐘照台灣時間走）。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { HSINCHU_ITEMS as I } from './cityItems';

export const HC = {
  W: 56,
  H: 36,
  // 北邊：城隍廟、廟口小吃（騎樓），地面線 northLine；中山路
  northLine: 9.4,
  temple: { x0: 21, x1: 33.4 },
  foodHall: { x0: 2.6, x1: 19.4 },
  northRoad: { y0: 10.6, y1: 12.8 },
  // 護城河：水、北岸石階、南岸石階；兩座拱橋（可以走）
  canal: { x1: 34, y0: 20.6, y1: 23.4 },
  canalStepsN: 19.4,
  canalStepsS: 24.4,
  bridges: [9.4, 25.2],
  bridgeHalf: 1.1,
  // 東門城圓環廣場、迎曦門（城門的地面線）
  plaza: { cx: 44.4, cy: 19.4, r: 5.6 },
  gate: { cx: 44.4, y: 21.4, half: 3.4 },
  // 中華路、新竹車站
  southRoad: { y0: 26, y1: 28.2 },
  station: { x0: 18, x1: 38, y: 33.6 },
} as const;

// 座位（12 個，順序 = 座位編號 273–284，不要調換）：
// 護城河北岸兩張面向河的長椅（各 2 位）、東門城廣場四張長椅（北邊兩張面向城門下方、南邊兩張面向城門，各 2 位）
export const CANAL_BENCHES = [4.6, 16.6];
export const CANAL_BENCH_Y = 19.1;
export const PLAZA_BENCHES: { x: number; y: number; facing: 'down' | 'up' }[] = [
  { x: 39.6, y: 15.6, facing: 'down' },
  { x: 49.2, y: 15.6, facing: 'down' },
  { x: 39.6, y: 24.2, facing: 'up' },
  { x: 49.2, y: 24.2, facing: 'up' },
];

export const HSINCHU_SEATS: CitySeat[] = [
  ...CANAL_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: CANAL_BENCH_Y, facing: 'down' },
    { x: x + 0.6, y: CANAL_BENCH_Y, facing: 'down' },
  ]),
  ...PLAZA_BENCHES.flatMap((b): CitySeat[] => [
    { x: b.x - 0.6, y: b.y, facing: b.facing },
    { x: b.x + 0.6, y: b.y, facing: b.facing },
  ]),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

// 廟口小吃：騎樓下一攤攤（x 是攤位中間）
export const FOOD_STALLS = [
  { x: 4.8, name: { 'zh-TW': '貢丸湯', 'en-US': 'Pork Ball Soup' }, call: { 'zh-TW': '新竹貢丸，咬下去會噴汁喔！', 'en-US': 'Hsinchu pork balls — juicy and springy!' }, items: [I.meatballSoup], sign: '#c62828' },
  { x: 8.9, name: { 'zh-TW': '炒米粉', 'en-US': 'Fried Rice Noodles' }, call: { 'zh-TW': '新竹米粉，風吹日曬的才 Q！', 'en-US': 'Hsinchu rice noodles, dried by the wind!' }, items: [I.friedVermicelli], sign: '#d97a1a' },
  { x: 13, name: { 'zh-TW': '肉圓', 'en-US': 'Ba-wan' }, call: { 'zh-TW': '新竹肉圓，用蒸的！', 'en-US': 'Steamed Hsinchu-style ba-wan!' }, items: [I.bawan], sign: '#2a7a46' },
  { x: 17.1, name: { 'zh-TW': '潤餅', 'en-US': 'Spring Roll' }, call: { 'zh-TW': '潤餅捲，花生粉多一點！', 'en-US': 'Fresh spring rolls, extra peanut powder!' }, items: [I.runbing], sign: '#1f5fa8' },
];

export const HSINCHU_SHOPS: CityShop[] = FOOD_STALLS.map((s): CityShop => ({
  name: s.name,
  call: s.call,
  items: s.items,
  at: at(s.x - 1.6, HC.northLine, s.x + 1.6, HC.northLine + 1),
  label: { x: s.x, y: HC.northLine + 0.15 },
}));
