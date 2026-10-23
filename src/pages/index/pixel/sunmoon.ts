// 南投日月潭（獨立地圖，搭高鐵到台中再轉接駁巴士到水社）：
// 北岸是水社（湖邊一排店：日月潭紅茶、山豬肉香腸；遊客中心、巴士站、水社碼頭）；
// 西岸是向山自行車道（有一段架在水上的步道）；湖中間是拉魯島；南岸是小山丘上的玄光寺、玄光寺碼頭和阿婆茶葉蛋；東南的山上是慈恩塔。
// 遊艇在水社碼頭和玄光寺碼頭之間來回。座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { SUNMOON_ITEMS as I } from './cityItems';

export const SM = {
  W: 56,
  H: 40,
  // 西邊向山的山坡、山坡邊的自行車道（北岸到南岸）
  hillX1: 8,
  bike: { x0: 8, x1: 11.4 },
  // 水上自行車道（架在湖面上的一段步道）
  floatBike: { x0: 11.4, x1: 13.6, y0: 15, y1: 25 },
  // 北岸：店的地面線、湖邊步道、水社碼頭
  northLine: 6.6,
  shoreN: 10.4,
  pierN: { x0: 30, x1: 34, y1: 15 },
  // 湖、拉魯島
  lake: { x0: 11.4, y0: 10.4, y1: 30 },
  lalu: { cx: 38, cy: 20.4, rx: 2.6, ry: 1.8 },
  // 南岸：玄光寺（小山丘上）、玄光寺碼頭、阿婆茶葉蛋攤
  temple: { x0: 15.4, x1: 23.4, y: 35.4 },
  pierS: { x0: 25, x1: 29, y0: 26 },
  eggStall: { x: 31.4, y: 32.4 },
  // 慈恩塔（東南的山上，裝飾）
  pagoda: { x: 48, y: 36.6 },
  // 北岸東邊：遊客中心、巴士站
  visitor: { x0: 38, x1: 50 },
  busStop: { x: 53, y: 9.4 },
} as const;

export interface SunMoonHouse {
  x0: number;
  x1: number;
  floors: number;
  seed: number;
  special?: 'tea' | 'sausage';
}
export const NORTH_ROW: SunMoonHouse[] = [
  { x0: 13, x1: 17.4, floors: 3, seed: 401 },
  { x0: 17.4, x1: 22.4, floors: 2, seed: 402, special: 'tea' },
  { x0: 22.4, x1: 26.4, floors: 2, seed: 403, special: 'sausage' },
  { x0: 26.4, x1: 31, floors: 3, seed: 404 },
  { x0: 31, x1: 36.6, floors: 4, seed: 405 },
];

// 座位（12 個，順序 = 座位編號 237–248，不要調換）：
// 水社碼頭邊兩張長椅（面向湖）、向山自行車道兩個休息座（面向湖）、玄光寺前兩張長椅（背對我們看湖）、紅茶店門口一張小桌兩張椅子
export const NORTH_BENCHES = [26, 37.4];
export const NORTH_BENCH_Y = 9.6;
export const BIKE_REST_YS = [12.4, 28];
export const BIKE_REST_X = 10.6;
export const SOUTH_BENCHES = [19.4, 34.6];
export const SOUTH_BENCH_Y = 31.2;
export const TEA_TABLE = { x: 19.9, y: 8.2 };

export const SUNMOON_SEATS: CitySeat[] = [
  ...NORTH_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: NORTH_BENCH_Y, facing: 'down' },
    { x: x + 0.6, y: NORTH_BENCH_Y, facing: 'down' },
  ]),
  ...BIKE_REST_YS.map((y): CitySeat => ({ x: BIKE_REST_X, y, facing: 'right' })),
  ...SOUTH_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: SOUTH_BENCH_Y, facing: 'up' },
    { x: x + 0.6, y: SOUTH_BENCH_Y, facing: 'up' },
  ]),
  { x: TEA_TABLE.x - 0.85, y: TEA_TABLE.y, facing: 'right' },
  { x: TEA_TABLE.x + 0.85, y: TEA_TABLE.y, facing: 'left' },
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const SUNMOON_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '日月潭紅茶', 'en-US': 'Sun Moon Lake Black Tea' },
    call: { 'zh-TW': '紅玉紅茶，有淡淡的肉桂和薄荷香！', 'en-US': 'Ruby black tea — hints of cinnamon and mint!' },
    items: [I.redJadeTea],
    at: at(21, SM.northLine, 22.2, SM.northLine + 1.2),
    label: { x: 21.4, y: SM.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '山豬肉香腸', 'en-US': 'Wild Boar Sausage' },
    call: { 'zh-TW': '香腸剛烤好，配一瓣蒜頭！', 'en-US': 'Fresh off the grill — with a clove of garlic!' },
    items: [I.boarSausage],
    at: at(23, SM.northLine, 25.8, SM.northLine + 1.2),
    label: { x: 24.4, y: SM.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '阿婆茶葉蛋', 'en-US': 'Grandma’s Tea Eggs' },
    call: { 'zh-TW': '香菇茶葉蛋，一顆十五！', 'en-US': 'Mushroom tea eggs, fifteen each!' },
    items: [I.teaEgg],
    at: at(SM.eggStall.x - 1.2, SM.eggStall.y, SM.eggStall.x + 1.2, SM.eggStall.y + 1.6),
    label: { x: SM.eggStall.x, y: SM.eggStall.y - 2.5 },
  },
];
