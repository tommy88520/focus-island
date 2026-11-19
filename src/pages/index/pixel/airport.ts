// 桃園國際機場第一航廈（獨立地圖，從台北車站搭機場捷運過來；之後出國從這裡出發）：
// 北邊一整片落地玻璃，外面是停機坪（三架飛機靠空橋、行李拖車）、滑行道、跑道（飛機會起飛）、塔台；
// 航廈裡面：窗邊看飛機的候機椅、航班資訊看板（國際線都還在規劃中）、東邊的出境口（還沒開）、
// 西邊一排店（咖啡店、便利商店、伴手禮店）和咖啡座、報到櫃台；南邊玻璃門出去是出境車道（計程車、機場巴士），過馬路是機場捷運站。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { AIRPORT_ITEMS as I } from './cityItems';

export const AP = {
  W: 56,
  H: 40,
  // 外面：天空、跑道、滑行道、停機坪；玻璃帷幕在 glass
  runway: { y0: 2.3, y1: 3.9 },
  taxiway: { y0: 4.9, y1: 6.1 },
  glass: 10.6,
  // 停機坪上靠空橋的飛機（機鼻朝航廈）
  gates: [9, 23.5, 37.5],
  tower: { x: 52.5, y: 5 },
  // 航廈裡：窗邊的木地板候機區、航班看板、出境口
  lounge: { x0: 0.5, x1: 22.5, y1: 14.6 },
  fids: { x0: 24, x1: 36, line: 14.4 },
  departure: { x0: 44, x1: 55.5, line: 15 },
  // 西邊一排店（地面線）、東邊報到櫃台
  shopLine: 19,
  checkinLine: 20.6,
  checkin: [27, 36.5, 46],
  // 南邊的玻璃牆（門在 doors）、人行道、車道、廣場
  frontWall: 26,
  doors: [
    [7, 10],
    [26.5, 29.5],
    [46, 49],
  ] as const,
  curb: 28.4,
  road: { y0: 28.4, y1: 31.6 },
  mrt: { x0: 22, x1: 34, line: 37.4 },
} as const;

// 西邊的三間店
export const STOREFRONTS = [
  { kind: 'cafe' as const, x0: 1, x1: 8 },
  { kind: 'store' as const, x0: 8.6, x1: 14.4 },
  { kind: 'gift' as const, x0: 15, x1: 21.5 },
];

// 座位（12 個，順序 = 座位編號 357–368，不要調換）：
// 窗邊三排候機椅（背對畫面看飛機，各 2 位）、咖啡座兩張桌子（各 2 位）、捷運站旁的長椅（2 位）
export const WINDOW_BENCHES = [5, 11.5, 18];
export const WINDOW_Y = 12.8;
export const CAFE_TABLES = [3.4, 7.4];
export const TABLE_Y = 22.8;
export const PLAZA_BENCH = { x: 42, y: 36.2 };

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const AIRPORT_SEATS: CitySeat[] = [...pair(WINDOW_BENCHES, WINDOW_Y, 'up'), ...pair(CAFE_TABLES, TABLE_Y - 0.7, 'down'), ...pair([PLAZA_BENCH.x], PLAZA_BENCH.y, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const AIRPORT_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '機場咖啡', 'en-US': 'Airport Café' },
    call: { 'zh-TW': '登機前來杯咖啡吧！', 'en-US': 'A coffee before you board?' },
    items: [I.icedCoffee, I.pearlMilkTea],
    at: at(1.2, AP.shopLine, 7.8, AP.shopLine + 1.2),
    label: { x: 4.5, y: AP.shopLine - 3.4 },
  },
  {
    name: { 'zh-TW': '便利商店', 'en-US': 'Convenience Store' },
    call: { 'zh-TW': '歡迎光臨！飯糰、茶葉蛋都有喔。', 'en-US': 'Welcome! Rice balls and tea eggs here.' },
    items: [I.riceBall, I.teaEgg],
    at: at(8.8, AP.shopLine, 14.2, AP.shopLine + 1.2),
    label: { x: 11.5, y: AP.shopLine - 3.4 },
  },
  {
    name: { 'zh-TW': '台灣伴手禮', 'en-US': 'Taiwan Souvenirs' },
    call: { 'zh-TW': '鳳梨酥帶出國送朋友最適合！', 'en-US': 'Pineapple cakes make the perfect gift abroad!' },
    items: [I.pineappleCake, I.planeModel],
    at: at(15.2, AP.shopLine, 21.3, AP.shopLine + 1.2),
    label: { x: 18.25, y: AP.shopLine - 3.4 },
  },
];

// 出境口前面站這裡就跳出「要飛去哪裡」
export const GATE_SPOT = { x: 49.75, y: 16.7 };

// 航班看板上的國際線：日本已經開航（open），其他還在規劃中
export const FLIGHTS: { time: string; dest: string; code: string; open?: boolean }[] = [
  { time: '08:50', dest: '東京 成田', code: 'FI 101', open: true },
  { time: '10:20', dest: '大阪 關西', code: 'FI 121', open: true },
  { time: '11:35', dest: '首爾 仁川', code: 'FI 160' },
  { time: '13:05', dest: '曼谷', code: 'FI 207' },
  { time: '14:40', dest: '新加坡', code: 'FI 231' },
  { time: '16:55', dest: '香港', code: 'FI 303' },
];
