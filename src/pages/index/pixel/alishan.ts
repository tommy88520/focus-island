// 阿里山（獨立地圖，從台北車站搭台鐵到嘉義、轉阿里山森林鐵路上山）：北邊遠遠的是玉山群峰和雲海（清晨看得到日出）；
// 森林鐵路的紅色小火車會開進阿里山車站；車站前的廣場有小攤（愛玉、竹筒飯、阿里山咖啡、高山茶）；
// 南邊是森林：西邊姊妹潭（大潭中間的小亭子）、中間巨木群棧道、東邊阿里山神木，到處是紅檜和櫻花。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { ALISHAN_ITEMS as I } from './cityItems';

export const AL = {
  W: 56,
  H: 38,
  // 北邊的森林鐵路、月台、阿里山車站
  rail: { y0: 9.2, y1: 10.4 },
  platform: 11.2,
  station: { x0: 18, x1: 38, line: 13.6 },
  // 車站前廣場、小攤
  plaza: { y0: 13.6, y1: 21.8 },
  cartY: 18,
  // 森林：姊妹潭（姊潭、妹潭、亭子）、棧道、神木
  forest: 21.8,
  bigPond: { cx: 9.4, cy: 27.8, rx: 6.2, ry: 3.2 },
  smallPond: { cx: 17.8, cy: 25.4, rx: 2.2, ry: 1.2 },
  pavilion: { x: 9.4, y: 27.6 },
  sacredTree: { x: 46, y: 31.2 },
} as const;

// 座位（12 個，順序 = 座位編號 345–356，不要調換）：
// 姊妹潭邊兩張石椅（背對畫面看潭，各 2 位）、巨木棧道兩張長椅（面向畫面，各 2 位）、車站前廣場兩張桌子（各 2 位）
export const POND_BENCHES = [6.4, 12.4];
export const POND_BENCH_Y = 32.8;
export const WALK_BENCHES = [27.4, 34.6];
export const WALK_BENCH_Y = 27.4;
export const PLAZA_TABLES = [21.6, 34.4];
export const TABLE_Y = 21;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const ALISHAN_SEATS: CitySeat[] = [...pair(POND_BENCHES, POND_BENCH_Y, 'up'), ...pair(WALK_BENCHES, WALK_BENCH_Y, 'down'), ...pair(PLAZA_TABLES, TABLE_Y - 0.7, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

type Text2 = { 'zh-TW': string; 'en-US': string };
export const MARKET_CARTS: { x: number; name: string; awning: string; food: string[]; shop?: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: 17.4, name: '愛玉', awning: '#d9a01a', food: ['#f6e08a', '#f2d670', '#f6e08a'], shop: { name: { 'zh-TW': '阿里山愛玉', 'en-US': 'Alishan Aiyu Jelly' }, call: { 'zh-TW': '山上的野生愛玉，加檸檬！', 'en-US': 'Wild aiyu jelly from the mountain, with lemon!' }, items: [I.aiyu] } },
  { x: 21.8, name: '竹筒飯', awning: '#4f8a3c', food: ['#7ab86a', '#c9a86a', '#7ab86a'], shop: { name: { 'zh-TW': '鄒族竹筒飯', 'en-US': 'Tsou Bamboo Rice' }, call: { 'zh-TW': '竹筒飯，剖開香噴噴！', 'en-US': 'Bamboo-tube rice — crack it open, so fragrant!' }, items: [I.bambooRice] } },
  { x: 26.2, name: '烤香菇', awning: '#8a5a32', food: ['#6a4a2a', '#8a6a4a', '#6a4a2a'] },
  { x: 30.4, name: '阿里山咖啡', awning: '#5a3a22', food: ['#4a2e1c', '#f4efe2', '#4a2e1c'], shop: { name: { 'zh-TW': '阿里山咖啡', 'en-US': 'Alishan Coffee' }, call: { 'zh-TW': '高山種的咖啡，香氣很乾淨！', 'en-US': 'High-mountain coffee with a clean aroma!' }, items: [I.alishanCoffee] } },
  { x: 34.8, name: '高山茶', awning: '#2a7a46', food: ['#9ccc72', '#7ab86a', '#9ccc72'], shop: { name: { 'zh-TW': '阿里山高山茶', 'en-US': 'Alishan High-mountain Tea' }, call: { 'zh-TW': '剛泡好的高山烏龍！', 'en-US': 'Freshly brewed high-mountain oolong!' }, items: [I.alishanTea] } },
  { x: 39.2, name: '山葵', awning: '#2a9a8a', food: ['#9ad6a8', '#7ac48a', '#9ad6a8'] },
];

export const ALISHAN_SHOPS: CityShop[] = MARKET_CARTS.flatMap((s): CityShop[] =>
  s.shop ? [{ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.3, AL.cartY, s.x + 1.3, AL.cartY + 1), label: { x: s.x, y: AL.cartY - 2.7 } }] : [],
);
