// 曼谷（泰國，獨立地圖；泰國只有這一個城市，車站只能搭飛機回台灣）：
// 北邊是昭披耶河對岸的鄭王廟（白色帶彩色瓷片的高塔，晚上打燈金黃），河上有長尾船、昭披耶河快船、渡輪、觀光船；
// 河這邊是碼頭步道（看鄭王廟的長椅）、塔田碼頭（Tha Tien），後面是臥佛寺（四座大佛塔、涼亭 sala、求籤）、塔田老街屋、大皇宮（金色尖塔）；
// 過了馬路（嘟嘟車跑來跑去）是路邊攤（大陽傘、推車、塑膠桌椅），東南角是 BTS 空鐵高架車站。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { BANGKOK_ITEMS as I } from './cityItems';

export const BK = {
  W: 58,
  H: 46,
  // 對岸（吞武里）：鄭王廟的地面線、河
  farBank: 13.4,
  arun: { x: 21 },
  river: { y0: 13.4, y1: 17.6 },
  // 塔田碼頭的浮台（可以走上去）、渡輪停的地方
  pier: { x0: 33.5, x1: 38.5, y0: 15.6 },
  // 河邊步道
  prom: { y0: 17.6, y1: 21.6 },
  // 臥佛寺、塔田老街屋、大皇宮（前緣 templeLine）
  templeLine: 27.6,
  watPho: { x0: 0.5, x1: 21.5 },
  watPhoGate: 15,
  shophouses: { x0: 21.5, x1: 31 },
  palace: { x0: 39, x1: 57.6 },
  // 臥佛寺前的涼亭（sala）、求籤桌
  sala: { x: 6, y: 29.6 },
  siamSi: { x: 15, y: 28.6 },
  road: { y0: 30.4, y1: 33.4 },
  // 路邊攤（推車的檯面前緣）、塑膠桌
  cartY: 37,
  carts: [5, 12.5, 20, 27.5],
  // 土地公（泰國的神屋 San Phra Phum）
  spiritHouse: { x: 52, y: 36.6 },
  // BTS 車站（前緣 line）
  station: { x0: 38, x1: 57, line: 43.2 },
} as const;

// 座位（12 個，順序 = 座位編號 489–500，不要調換）：
// 河邊三張長椅（面向北邊的鄭王廟，各 2 位）、臥佛寺的涼亭（2 位）、路邊攤兩張塑膠桌（各 2 位）
export const RIVER_BENCHES = [12, 20, 28];
export const RIVER_BENCH_Y = 19;
export const STALL_TABLES = [12, 22];
export const STALL_TABLE_Y = 41.4;

const pair = (xs: readonly number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const BANGKOK_SEATS: CitySeat[] = [...pair(RIVER_BENCHES, RIVER_BENCH_Y, 'up'), ...pair([BK.sala.x], BK.sala.y, 'down'), ...pair(STALL_TABLES, STALL_TABLE_Y - 0.7, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
type Text2 = { 'zh-TW': string; 'en-US': string };
export interface BkCart {
  x: number;
  sign: string;
  umbrella: [string, string];
  kind: 'padThai' | 'mango' | 'tea' | 'coconut';
  shop: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] };
}
export const BK_CARTS: BkCart[] = [
  { x: BK.carts[0], sign: '炒河粉', umbrella: ['#d8382a', '#f4efe2'], kind: 'padThai', shop: { name: { 'zh-TW': '泰式炒河粉', 'en-US': 'Pad Thai' }, call: { 'zh-TW': '大火快炒，加花生、檸檬、豆芽！', 'en-US': 'Wok-fried on high heat — with peanuts, lime and bean sprouts!' }, items: [I.padThai] } },
  { x: BK.carts[1], sign: '芒果飯', umbrella: ['#2f8a4a', '#f6d24a'], kind: 'mango', shop: { name: { 'zh-TW': '芒果糯米飯', 'en-US': 'Mango Sticky Rice' }, call: { 'zh-TW': '當季的金黃芒果，淋上椰奶！', 'en-US': 'Ripe golden mango with coconut cream on top!' }, items: [I.mangoStickyRice] } },
  { x: BK.carts[2], sign: '泰奶', umbrella: ['#e07a1f', '#f4efe2'], kind: 'tea', shop: { name: { 'zh-TW': '泰式奶茶', 'en-US': 'Thai Iced Tea' }, call: { 'zh-TW': '橘色的泰奶，加滿冰塊最消暑！', 'en-US': 'Bright orange Thai tea over crushed ice — so refreshing!' }, items: [I.thaiTea] } },
  { x: BK.carts[3], sign: '椰子冰', umbrella: ['#2a6ab0', '#f4efe2'], kind: 'coconut', shop: { name: { 'zh-TW': '椰子冰淇淋', 'en-US': 'Coconut Ice Cream' }, call: { 'zh-TW': '用椰殼裝的椰子冰淇淋，撒花生！', 'en-US': 'Coconut ice cream served in the shell, sprinkled with peanuts!' }, items: [I.coconutIceCream] } },
];

export const BANGKOK_SHOPS: CityShop[] = BK_CARTS.map((s, i): CityShop => ({ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.4, BK.cartY, s.x + 1.4, BK.cartY + 1.1), label: { x: s.x, y: BK.cartY - 3.6 - (i % 2) * 0.9 } }));
