// 奈良（日本，獨立地圖；京阪神奈之間搭 JR）：北邊是若草山和春日山的森林，前面是東大寺大佛殿（金色鴟尾）和南大門（仁王像）；
// 西邊是興福寺五重塔，塔下的猿澤池倒映著塔、柳樹垂在水邊，南岸的石椅可以坐下看塔；
// 中間是奈良公園的草地，滿地的鹿（慢慢走、低頭吃草、對人鞠躬），有鹿仙貝的攤子和看鹿的長椅；
// 東邊是春日大社的石燈籠參道（朱紅的南門、一之鳥居，晚上燈籠會亮，門前抽鹿みくじ），參道旁的茶屋賣葛餅，門前紅傘緣台；
// 過了三条通是 JR 奈良站（寺廟屋頂、相輪的舊站舍），西邊的町家賣柿葉壽司。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { NARA_ITEMS as I } from './cityItems';

export const NR = {
  W: 56,
  H: 42,
  // 北邊：東大寺大佛殿（地面線）、前面的庭院到南大門
  daibutsu: { x0: 11, x1: 37, line: 10.8 },
  axis: 24,
  nandaimon: { x0: 20.5, x1: 27.5, line: 19.4 },
  // 南大門兩邊的築地塀
  walls: [
    [13, 20.5],
    [27.5, 35],
  ] as [number, number][],
  // 西邊：興福寺五重塔、猿澤池（橢圓）
  pagoda: { x: 7, line: 20.6 },
  pond: { cx: 8, cy: 26.4, rx: 7, ry: 3 },
  // 東邊：春日大社的南門、石燈籠參道（x0–x1 是石板路）、一之鳥居
  kasuga: { x0: 44, x1: 53, line: 13.2 },
  sando: { x0: 47, x1: 50, y0: 13.2, y1: 30.8 },
  forestX: 51.4,
  teahouse: { x0: 38.4, x1: 45.6, line: 22 },
  // 鹿仙貝的攤子
  cart: { x: 34.4, y: 22.6 },
  // 三条通（北邊人行道、馬路）
  walk: 30.8,
  road: { y0: 31.8, y1: 34.2 },
  // 南邊一排：町家（柿葉壽司）、JR 奈良站、町家和旅館；地面線都是 rowLine，前面是站前的人行道
  rowLine: 39.6,
  station: { x0: 20.5, x1: 33.5 },
} as const;

// 座位（12 個，順序 = 座位編號 417–428，不要調換）：
// 猿澤池南岸兩張石椅（背對畫面看池和五重塔，各 2 位）、茶屋前兩張紅傘緣台（各 2 位）、奈良公園看鹿的兩張長椅（各 2 位）
export const POND_BENCHES = [4.6, 10.6];
export const POND_BENCH_Y = 30.2;
export const TEA_BENCHES = [40.2, 43.8];
export const TEA_BENCH_Y = 24.2;
export const PARK_BENCHES = [18.4, 30];
export const PARK_BENCH_Y = 24.4;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const NARA_SEATS: CitySeat[] = [...pair(POND_BENCHES, POND_BENCH_Y, 'up'), ...pair(TEA_BENCHES, TEA_BENCH_Y, 'down'), ...pair(PARK_BENCHES, PARK_BENCH_Y, 'down')];

// 猿澤池（含石垣）裡面
export function inPond(x: number, y: number, pad = 0): boolean {
  const { cx, cy, rx, ry } = NR.pond;
  const dx = (x - cx) / (rx + pad);
  const dy = (y - cy) / (ry + pad);
  return dx * dx + dy * dy < 1;
}

// 南邊一排的房子（kind 決定畫法）
export const SOUTH_ROW: { x0: number; x1: number; kind: 'narazuke' | 'sumi' | 'kakinoha' | 'house' | 'omiyage' | 'tea' | 'ryokan' }[] = [
  { x0: 1, x1: 5.4, kind: 'narazuke' },
  { x0: 5.4, x1: 9.6, kind: 'sumi' },
  { x0: 9.6, x1: 15.4, kind: 'kakinoha' },
  { x0: 15.4, x1: 18.4, kind: 'house' },
  { x0: 36, x1: 41.4, kind: 'omiyage' },
  { x0: 41.4, x1: 46, kind: 'tea' },
  { x0: 46, x1: 55, kind: 'ryokan' },
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const kakinoha = SOUTH_ROW[2] ?? { x0: 9.6, x1: 15.4 };
const kakiX = (kakinoha.x0 + kakinoha.x1) / 2;
const teaX = (NR.teahouse.x0 + NR.teahouse.x1) / 2;

export const NARA_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '鹿仙貝', 'en-US': 'Deer Crackers' },
    call: { 'zh-TW': '鹿仙貝一疊！拿在手上，鹿會對你鞠躬喔～', 'en-US': 'Shika senbei! Hold one up and the deer will bow to you~' },
    items: [I.shikaSenbei],
    at: at(NR.cart.x - 1.3, NR.cart.y, NR.cart.x + 1.3, NR.cart.y + 1),
    label: { x: NR.cart.x, y: NR.cart.y - 2.9 },
  },
  {
    name: { 'zh-TW': '茶屋 · 吉野葛餅', 'en-US': 'Teahouse · Kuzumochi' },
    call: { 'zh-TW': '剛做好的葛餅，淋黑蜜、撒黃豆粉，坐緣台慢慢吃。', 'en-US': 'Fresh kuzumochi with black syrup and kinako — enjoy it on the red bench.' },
    items: [I.kuzumochi],
    at: at(NR.teahouse.x0 + 0.2, NR.teahouse.line, NR.teahouse.x1 - 0.2, NR.teahouse.line + 1),
    label: { x: teaX, y: NR.teahouse.line - 4.6 },
  },
  {
    name: { 'zh-TW': '柿葉壽司', 'en-US': 'Persimmon-leaf Sushi' },
    call: { 'zh-TW': '柿子葉包的鯖魚壽司，奈良的老味道！', 'en-US': 'Mackerel sushi wrapped in persimmon leaves — a Nara classic!' },
    items: [I.kakinohaSushi],
    at: at(kakinoha.x0 + 0.3, NR.rowLine, kakinoha.x1 - 0.3, NR.rowLine + 1.2),
    label: { x: kakiX, y: NR.rowLine - 4.8 },
  },
];
