// 大阪（日本，獨立地圖；京阪神之間搭 JR）：北邊是大阪城（天守閣、石垣、護城河），城前的公園有櫻花和長椅；
// 東邊是新世界（通天閣、比利肯可以摸腳許願、炸串店的桌子）；中間一排道頓堀的店（大螃蟹、大章魚、霓虹燈招牌），
// 前面是道頓堀運河（戎橋、遊船），河邊的木棧道可以坐；南邊是馬路和 JR 大阪站。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { OSAKA_ITEMS as I } from './cityItems';

export const OS = {
  W: 56,
  H: 40,
  castle: { x0: 17, x1: 35, line: 10.2 },
  moat: { y0: 10.2, y1: 12 },
  park: { x1: 42, y1: 17.6 },
  // 道頓堀的店（地面線）、前面的街
  rowLine: 22,
  street: { y1: 24.8 },
  // 新世界：通天閣、比利肯、拱門
  shinsekai: { x0: 42, tower: 49, towerLine: 17.2, billiken: { x: 54, y: 19.6 }, archY: 24.6 },
  canal: { y0: 25, y1: 28.4 },
  ebisu: { x0: 22, x1: 27 },
  boardwalk: { y0: 28.4, y1: 29.8 },
  road: { y0: 31.6, y1: 34 },
  station: { x0: 14, x1: 42, line: 38.6 },
} as const;

// 道頓堀那一排：大招牌的種類（crab 螃蟹、octopus 章魚、dragon 龍、neon 霓虹、gyoza 餃子）
export const DOTON_SHOPS: { x0: number; x1: number; sign: 'crab' | 'octopus' | 'dragon' | 'neon' | 'okonomi'; name: string; color: string }[] = [
  { x0: 1, x1: 8.5, sign: 'octopus', name: 'たこ焼', color: '#c8102e' },
  { x0: 8.5, x1: 15, sign: 'crab', name: 'かに料理', color: '#b8282e' },
  { x0: 15, x1: 21.5, sign: 'okonomi', name: 'お好み焼', color: '#e07a1f' },
  { x0: 27.5, x1: 34, sign: 'dragon', name: 'ラーメン', color: '#1f6fa8' },
  { x0: 34, x1: 41.5, sign: 'neon', name: '道頓堀', color: '#7a3fb0' },
];
// 戎橋旁邊的大型電子看板（站在橋上看得到）
export const BILLBOARD = { x0: 21.5, x1: 27.5 };

// 座位（12 個，順序 = 座位編號 381–392，不要調換）：
// 大阪城前公園兩張長椅（背對畫面看城，各 2 位）、道頓堀木棧道兩對（背對畫面看霓虹）、新世界炸串店外的兩張桌子（各 2 位）
export const PARK_BENCHES = [11, 31];
export const PARK_BENCH_Y = 14.8;
export const WALK_PAIRS = [9, 40];
export const WALK_Y = 29.3;
export const KUSHI_TABLES = [45.4, 50.8];
export const KUSHI_TABLE_Y = 22.6;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const OSAKA_SEATS: CitySeat[] = [...pair(PARK_BENCHES, PARK_BENCH_Y, 'up'), ...pair(WALK_PAIRS, WALK_Y, 'up'), ...pair(KUSHI_TABLES, KUSHI_TABLE_Y - 0.7, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const D0 = DOTON_SHOPS[0] ?? { x0: 1, x1: 8.5 };
const D2 = DOTON_SHOPS[2] ?? { x0: 15, x1: 21.5 };

export const OSAKA_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '章魚燒', 'en-US': 'Takoyaki' },
    call: { 'zh-TW': 'まいど！剛烤好的章魚燒，小心燙！', 'en-US': 'Maido! Fresh takoyaki — careful, it’s hot!' },
    items: [I.takoyaki],
    at: at(D0.x0 + 1, OS.rowLine, D0.x1 - 1, OS.rowLine + 1.2),
    label: { x: (D0.x0 + D0.x1) / 2, y: OS.rowLine + 2.2 },
  },
  {
    name: { 'zh-TW': '大阪燒', 'en-US': 'Okonomiyaki' },
    call: { 'zh-TW': '鐵板上現煎的大阪燒，美乃滋畫格子！', 'en-US': 'Okonomiyaki right off the griddle, with a mayo lattice!' },
    items: [I.okonomiyaki],
    at: at(D2.x0 + 1, OS.rowLine, D2.x1 - 1, OS.rowLine + 1.2),
    label: { x: (D2.x0 + D2.x1) / 2, y: OS.rowLine + 2.2 },
  },
  {
    name: { 'zh-TW': '新世界 炸串', 'en-US': 'Shinsekai Kushikatsu' },
    call: { 'zh-TW': '醬汁只能沾一次喔！', 'en-US': 'No double-dipping in the sauce!' },
    items: [I.kushikatsu],
    at: at(43.4, 20.4, 48.6, 21.4),
    label: { x: 45.4, y: 16 },
  },
];
