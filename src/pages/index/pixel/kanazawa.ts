// 金澤（日本石川縣，獨立地圖；跟其他日本城市之間搭 JR）：
// 西北是金澤城的石川門（白色海鼠壁、鉛瓦屋頂、石垣）；下面是兼六園：霞之池、一腳踩在池裡的徽軫燈籠、虹橋、
// 曲水小溪和雁行橋、雪吊的唐崎松、苔地，池南岸的石椅看池和燈籠，旁邊的茶屋有紅傘緣台；
// 東北是東茶屋街（兩層木造茶屋、紅褐色的細格子、石板路、金箔霜淇淋的店），前面有緣台可以坐；
// 茶屋街南邊是淺野川和梅之橋，過了橋是近江町市場（有屋頂的市場、螃蟹和魚的攤子、海鮮丼的吧台）；
// 最南邊過了馬路是 JR 金澤站：鼓門（兩根螺旋的鼓形木柱）和後面的玻璃穹頂「もてなしドーム」，旁邊有金澤咖哩的店。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { KANAZAWA_ITEMS as I } from './cityItems';

export const KZ = {
  W: 56,
  H: 46,
  // 北邊：金澤城的石垣和石川門（地面線）
  castle: { x0: 0, x1: 26.4, line: 9.2, gateX: 13 },
  // 兼六園（西半邊）
  garden: { x1: 26.4, y0: 9.2, y1: 29.2 },
  pond: { cx: 12.4, cy: 17.6, rx: 8.2, ry: 3.4 },
  // 徽軫燈籠（池的東北岸，長腳踩在水裡）、虹橋（跨過曲水流進池子的地方）
  kotoji: { x: 19.1, y: 15.5 },
  niji: { x0: 20.3, x1: 22.5, y: 15.6 },
  // 雁行橋（曲水上游的踏石）
  ganko: { x: 24.7, y: 12.3 },
  // 唐崎松（池的西岸，枝伸到水上）
  karasaki: { x: 3.4, line: 18.8 },
  teahouse: { x0: 18, x1: 25.6, line: 26.8 },
  // 兼六園和茶屋街之間的小路
  lane: { x0: 26.4, x1: 28.4 },
  // 東茶屋街：一排茶屋（地面線）、前面的石板路
  chaya: { x0: 28.4, x1: 55.6, line: 13, street: 17.2 },
  // 淺野川、梅之橋
  river: { x0: 28.4, y0: 18, y1: 20.8 },
  bridge: { x0: 40.4, x1: 42.8 },
  // 近江町市場（地面線）
  market: { x0: 28.4, x1: 55.6, line: 28.8 },
  // 人行道、馬路
  walk: 29.2,
  road: { y0: 31, y1: 33.4 },
  // 最南邊一排：站房、穹頂、鼓門
  rowLine: 39.6,
  station: { x0: 18, x1: 38 },
  dome: { x0: 16.4, x1: 39.6, front: 42.6 },
  gate: { cx: 28, line: 43.6, half: 3.5 },
  westRow: { x0: 0.6, x1: 14.6 },
  curry: { x0: 40.8, x1: 46.6 },
  mall: { x0: 46.6, x1: 55.6 },
} as const;

// 曲水（從東北流進霞之池）：折線的點
export const STREAM: [number, number][] = [
  [26.2, 9.4],
  [25.4, 10.6],
  [24.4, 11.4],
  [24.8, 12.6],
  [23.6, 13.6],
  [22.2, 14.4],
  [21.4, 15.4],
  [20.4, 16.6],
];

// 東茶屋街的房子（kind 決定畫法）
export type ChayaKind = 'tea' | 'kanmi' | 'kinpaku' | 'bocha' | 'kogei' | 'sake';
export const CHAYA_ROW: { x0: number; x1: number; kind: ChayaKind }[] = [
  { x0: 28.4, x1: 33, kind: 'tea' },
  { x0: 33, x1: 37.4, kind: 'kanmi' },
  { x0: 37.4, x1: 41.8, kind: 'kinpaku' },
  { x0: 41.8, x1: 46.4, kind: 'bocha' },
  { x0: 46.4, x1: 51, kind: 'kogei' },
  { x0: 51, x1: 55.6, kind: 'sake' },
];

// 座位（12 個，順序 = 座位編號 573–584，不要調換）：
// 霞之池南岸兩張石椅（背對畫面看池和徽軫燈籠，各 2 位）、兼六園茶屋的紅傘緣台（2 位）、
// 東茶屋街門前兩張緣台（各 2 位）、近江町市場海鮮丼店的吧台（2 位，背對畫面）
export const POND_BENCHES = [8.6, 15.2];
export const POND_BENCH_Y = 23;
export const TEA_BENCH = 21.8;
export const TEA_BENCH_Y = 28.2;
export const CHAYA_BENCHES = [30.7, 48.7];
export const CHAYA_BENCH_Y = 14.7;
export const COUNTER_X = [43.7, 45.1];
export const COUNTER_Y = 29.8;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const KANAZAWA_SEATS: CitySeat[] = [
  ...pair(POND_BENCHES, POND_BENCH_Y, 'up'),
  ...pair([TEA_BENCH], TEA_BENCH_Y, 'down'),
  ...pair(CHAYA_BENCHES, CHAYA_BENCH_Y, 'down'),
  ...COUNTER_X.map((x): CitySeat => ({ x, y: COUNTER_Y, facing: 'up' })),
];

// 霞之池裡面
export function inPond(x: number, y: number, pad = 0): boolean {
  const { cx, cy, rx, ry } = KZ.pond;
  const dx = (x - cx) / (rx + pad);
  const dy = (y - cy) / (ry + pad);
  return dx * dx + dy * dy < 1;
}

// 點到曲水的距離
export function streamDist(x: number, y: number): number {
  let best = Infinity;
  for (let i = 0; i < STREAM.length - 1; i += 1) {
    const [ax, ay] = STREAM[i] ?? [0, 0];
    const [bx, by] = STREAM[i + 1] ?? [0, 0];
    const vx = bx - ax;
    const vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    best = Math.min(best, Math.hypot(x - (ax + vx * t), y - (ay + vy * t)));
  }
  return best;
}

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const kinpaku = CHAYA_ROW[2] ?? { x0: 37.4, x1: 41.8 };
const kinX = (kinpaku.x0 + kinpaku.x1) / 2;
const curryX = (KZ.curry.x0 + KZ.curry.x1) / 2;

export const KANAZAWA_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '金箔屋 · 金箔霜淇淋', 'en-US': 'Gold-leaf Shop · Soft Serve' },
    call: { 'zh-TW': '整片金箔貼在霜淇淋上！金澤的金箔佔全日本九成九喔～', 'en-US': 'A whole sheet of gold leaf on soft serve! Kanazawa makes 99% of Japan’s gold leaf~' },
    items: [I.goldLeafSoftServe],
    at: at(kinpaku.x0 + 0.4, KZ.chaya.line, kinpaku.x1 - 0.4, KZ.chaya.line + 1.2),
    label: { x: kinX, y: KZ.chaya.line - 5.4 },
  },
  {
    name: { 'zh-TW': '近江町 · 海鮮丼', 'en-US': 'Omicho · Seafood Bowl' },
    call: { 'zh-TW': '今天早上剛進的甜蝦、海膽、鮭魚卵，滿滿一碗！坐吧台吃～', 'en-US': 'Sweet shrimp, uni and ikura in this morning — piled high! Grab a counter seat~' },
    items: [I.kaisendon],
    at: at(45.9, KZ.market.line, 48.2, KZ.market.line + 1.3),
    label: { x: 45.4, y: KZ.market.line - 5.2 },
  },
  {
    name: { 'zh-TW': '金澤咖哩', 'en-US': 'Kanazawa Curry' },
    call: { 'zh-TW': '濃稠的黑咖哩、炸豬排、高麗菜絲，裝在不鏽鋼盤用叉子吃！', 'en-US': 'Thick dark curry, a katsu and shredded cabbage on a steel plate — eaten with a fork!' },
    items: [I.kanazawaCurry],
    at: at(KZ.curry.x0 + 0.4, KZ.rowLine, KZ.curry.x1 - 0.4, KZ.rowLine + 1.2),
    label: { x: curryX, y: KZ.rowLine - 5 },
  },
];
