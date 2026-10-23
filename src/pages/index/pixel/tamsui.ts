// 新北淡水（老街、河岸，獨立地圖，從台北車站搭捷運紅線到底）：
// 西北是小山坡上的紅毛城和前清英國領事官邸；中正路（老街）北邊一排有淡水禮拜堂、文化阿給、可口魚丸、福佑宮、阿婆鐵蛋，東邊是捷運淡水站；
// 老街南邊一排靠河的店（河岸咖啡），再往南是金色水岸步道、渡船頭（往漁人碼頭的渡輪），淡水河對岸是觀音山。
// 跟其他地圖一樣，建築都畫成正面朝南。座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { TAMSUI_ITEMS as I } from './cityItems';

export const DS = {
  W: 56,
  H: 38,
  // 西北的山坡（紅毛城、領事官邸），坡底一道擋土牆，中間有石階下到老街
  hill: { x1: 20, y1: 11.4 },
  stairs: { x0: 15.6, x1: 17.6 },
  fort: { x0: 2.4, x1: 9.6, y: 8.2 },
  consulate: { x0: 10.6, x1: 19.4, y: 8.6 },
  // 中正路（老街）：北邊一排的地面線、馬路、南邊的人行道
  northLine: 11.4,
  road: { y0: 12.4, y1: 15.2 },
  southWalk: 16.6,
  // 南邊靠河的一排店（中間留巷子走到河邊）
  riverRowY0: 19.6,
  riverRowY1: 22.6,
  alleys: [
    { x0: 12.4, x1: 14.4 },
    { x0: 27, x1: 29 },
    { x0: 43, x1: 45 },
  ],
  // 金色水岸步道、渡船頭、淡水河、對岸觀音山
  promenadeY1: 26,
  pier: { x0: 30, x1: 35, y1: 30 },
  farBankY: 33.4,
  // 馬偕像（老街南邊的小圓環）
  mackay: { x: 21.4, y: 17.7 },
  // 福佑宮（正面朝南，前面可以求籤）
  temple: { x0: 35, x1: 41 },
  // 捷運淡水站
  station: { x0: 46, x1: 56 },
} as const;

export interface TamsuiHouse {
  x0: number;
  x1: number;
  floors: number;
  seed: number;
  special?: 'church' | 'agei' | 'fishball' | 'temple' | 'irongg' | 'cafe';
}
export const NORTH_ROW: TamsuiHouse[] = [
  { x0: 20, x1: 25.6, floors: 2, seed: 301, special: 'church' },
  { x0: 25.6, x1: 29.6, floors: 2, seed: 302, special: 'agei' },
  { x0: 29.6, x1: 35, floors: 2, seed: 303, special: 'fishball' },
  { x0: 35, x1: 41, floors: 1, seed: 304, special: 'temple' },
  { x0: 41, x1: 46, floors: 2, seed: 305, special: 'irongg' },
];
// 南邊靠河的一排（巷子空出來）
export const RIVER_ROW: TamsuiHouse[] = [
  { x0: 0, x1: 4.4, floors: 2, seed: 311 },
  { x0: 4.4, x1: 8.6, floors: 3, seed: 312 },
  { x0: 8.6, x1: 12.4, floors: 2, seed: 313 },
  { x0: 14.4, x1: 18.8, floors: 2, seed: 314 },
  { x0: 18.8, x1: 23, floors: 2, seed: 315 },
  { x0: 23, x1: 27, floors: 2, seed: 316 },
  { x0: 29, x1: 34, floors: 2, seed: 317 },
  { x0: 34, x1: 43, floors: 2, seed: 318, special: 'cafe' },
  { x0: 45, x1: 50.4, floors: 3, seed: 319 },
  { x0: 50.4, x1: 56, floors: 2, seed: 320 },
];

// 座位（12 個，順序 = 座位編號 225–236，不要調換）：
// 紅毛城前草地一張長椅 2 位、金色水岸三張長椅各 2 位（面向河）、河岸咖啡兩張桌子各 2 張椅子
export const FORT_BENCH = { x: 7.4, y: 10.4 };
export const RIVER_BENCHES = [8, 20, 48.6];
export const RIVER_BENCH_Y = 25.2;
export const CAFE_TABLES = [36.6, 40.6];
export const CAFE_Y = 23.8;

export const TAMSUI_SEATS: CitySeat[] = [
  { x: FORT_BENCH.x - 0.6, y: FORT_BENCH.y, facing: 'down' },
  { x: FORT_BENCH.x + 0.6, y: FORT_BENCH.y, facing: 'down' },
  ...RIVER_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: RIVER_BENCH_Y, facing: 'down' },
    { x: x + 0.6, y: RIVER_BENCH_Y, facing: 'down' },
  ]),
  ...CAFE_TABLES.flatMap((x): CitySeat[] => [
    { x: x - 0.85, y: CAFE_Y, facing: 'right' },
    { x: x + 0.85, y: CAFE_Y, facing: 'left' },
  ]),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const door = (x0: number, x1: number) => at(x0 + 0.6, DS.northLine, x1 - 0.6, DS.northLine + 1);

export const TAMSUI_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '文化阿給', 'en-US': 'Wenhua A-gei' },
    call: { 'zh-TW': '阿給淋上甜辣醬，配一碗魚丸湯！', 'en-US': 'A-gei with sweet chilli sauce and fish ball soup!' },
    items: [I.aGei, I.fishBallSoup],
    at: door(25.6, 29.6),
    label: { x: 27.6, y: DS.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '可口魚丸', 'en-US': 'Kekou Fish Balls' },
    call: { 'zh-TW': '魚丸湯，咬下去有肉汁！', 'en-US': 'Fish ball soup — juicy filling inside!' },
    items: [I.fishBallSoup],
    at: door(29.6, 35),
    label: { x: 32.3, y: DS.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '阿婆鐵蛋', 'en-US': 'Grandma’s Iron Eggs' },
    call: { 'zh-TW': '淡水名產鐵蛋，越嚼越香！', 'en-US': 'Tamsui iron eggs — the more you chew, the better!' },
    items: [I.ironEggs],
    at: door(41, 46),
    label: { x: 43.5, y: DS.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '河岸咖啡', 'en-US': 'Riverside Café' },
    call: { 'zh-TW': '坐在河邊等夕陽吧～', 'en-US': 'Sit by the river and wait for the sunset~' },
    items: [I.icedCoffee, I.plumJuice],
    at: at(38, DS.riverRowY1, 39.4, DS.riverRowY1 + 1.6),
    label: { x: 38.7, y: DS.riverRowY1 + 0.1 },
  },
];
