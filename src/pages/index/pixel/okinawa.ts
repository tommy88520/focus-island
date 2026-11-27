// 沖繩 · 那霸（日本，獨立地圖；跟日本其他城市之間搭國內線飛機）：北邊小丘上是首里城（紅色的正殿、下面的守禮門），
// 西北角是單軌電車（Yui Rail）的高架車站「縣廳前站」，高架軌道橫過紅瓦屋頂後面；
// 中間是國際通（北側一排紅瓦伴手禮店，屋頂和門口都有風獅爺），過了馬路是廣場：開口笑、紅芋冰淇淋的攤子、
// 長椅前有彈三線的人、東邊是紅瓦的沖繩麵食堂（外面擺桌子）；
// 南邊是波之上海灘（白沙、遮陽傘躺椅、藍綠色的海），東南的海邊懸崖上是波上宮。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { OKINAWA_ITEMS as I } from './cityItems';

export const OK = {
  W: 56,
  H: 44,
  // 首里城的小丘：正殿的地面線、守禮門
  seiden: { x0: 9, x1: 25, line: 6.8 },
  shureimon: { x: 32, line: 10.2 },
  // 單軌電車：高架軌道（梁的上緣）、縣廳前站
  rail: 11.2,
  station: { x0: 0.5, x1: 12, line: 16 },
  // 國際通：北側紅瓦店面的地面線、馬路
  shopLine: 16,
  shops: { x0: 12.5, x1: 55.5 },
  road: { y0: 17.2, y1: 19.6 },
  // 廣場：攤子、長椅、三線、沖繩麵食堂
  cartY: 23.2,
  carts: [4, 9.4],
  sanshin: { x: 19.5, y: 26.4 },
  shokudo: { x0: 28.6, x1: 39.4, line: 23.4 },
  plazaY1: 28.8,
  // 波之上海灘、海；東南的懸崖和波上宮
  sand: 30,
  sea: 37.4,
  cliff: { x0: 41.5, top: 28.8, edge: 33.4 },
  shrine: { x0: 45, x1: 54.5, line: 31.8 },
  torii: { x: 43.4, line: 31.2 },
} as const;

// 座位（12 個，順序 = 座位編號 465–476，不要調換）：
// 波之上海灘兩支遮陽傘下的躺椅（各 2 位，面向大海）、國際通廣場兩張長椅（各 2 位，看三線表演）、沖繩麵食堂外的兩張桌子（各 2 位）
export const UMBRELLAS = [11, 24];
export const LOUNGER_Y = 34.6;
export const PLAZA_BENCHES = [16.4, 22.6];
export const PLAZA_BENCH_Y = 24.4;
export const SOBA_TABLES = [30.4, 37.6];
export const SOBA_TABLE_Y = 26.6;

const pair = (xs: number[], y: number, facing: CitySeat['facing'], gap = 0.6): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - gap, y, facing },
    { x: x + gap, y, facing },
  ]);

export const OKINAWA_SEATS: CitySeat[] = [...pair(UMBRELLAS, LOUNGER_Y, 'down', 1), ...pair(PLAZA_BENCHES, PLAZA_BENCH_Y, 'down'), ...pair(SOBA_TABLES, SOBA_TABLE_Y - 0.7, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
type Text2 = { 'zh-TW': string; 'en-US': string };

// 廣場上的攤子（開口笑、紅芋冰淇淋）
export const PLAZA_CARTS: { x: number; name: string; awning: string; food: string[]; shop: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: OK.carts[0], name: 'アンダギー', awning: '#e07a1f', food: ['#c9822e', '#d9963a', '#c9822e'], shop: { name: { 'zh-TW': '開口笑（沙翁）', 'en-US': 'Sata Andagi' }, call: { 'zh-TW': '剛炸好的開口笑，外酥內鬆！', 'en-US': 'Fresh-fried sata andagi — crunchy outside, fluffy inside!' }, items: [I.sataAndagi] } },
  { x: OK.carts[1], name: '紅いも', awning: '#8a3aa8', food: ['#b07ad0', '#f4efe2', '#b07ad0'], shop: { name: { 'zh-TW': '紅芋冰淇淋', 'en-US': 'Beni-imo Ice Cream' }, call: { 'zh-TW': '紫色的紅芋冰淇淋，沖繩限定！', 'en-US': 'Purple sweet-potato soft serve — only in Okinawa!' }, items: [I.beniImoIce] } },
];

const SOBA_DOOR = (OK.shokudo.x0 + OK.shokudo.x1) / 2;

export const OKINAWA_SHOPS: CityShop[] = [
  ...PLAZA_CARTS.map((s): CityShop => ({ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.3, OK.cartY, s.x + 1.3, OK.cartY + 1), label: { x: s.x, y: OK.cartY - 2.9 } })),
  {
    name: { 'zh-TW': '沖繩麵食堂', 'en-US': 'Okinawa Soba Shokudō' },
    call: { 'zh-TW': '三層肉沖繩麵、苦瓜炒蛋，坐外面吃吹海風！', 'en-US': 'Pork-belly soba and goya champuru — eat outside in the sea breeze!' },
    items: [I.okinawaSoba, I.goyaChampuru],
    at: at(SOBA_DOOR - 1.6, OK.shokudo.line, SOBA_DOOR + 1.6, OK.shokudo.line + 1.2),
    label: { x: SOBA_DOOR, y: OK.shokudo.line - 4.6 },
  },
];
