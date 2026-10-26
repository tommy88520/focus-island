// 基隆正濱漁港（獨立地圖，從台北車站搭台鐵到基隆，再轉公車過來）：
// 北岸是一整排彩色屋（後面山上是中正公園的大佛），屋前中正路、港邊步道；中間是漁港，停滿漁船，水面倒映彩色屋；
// 東邊和平橋跨過港口，橋的北邊是和平島（豆腐岩）；南岸是看彩色屋的港邊步道（石椅），再往南是正濱路、
// 阿根納造船廠遺構、正濱漁會、小吃攤車、往台鐵基隆站的公車站。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { KEELUNG_ITEMS as I } from './cityItems';

export const KL = {
  W: 56,
  H: 36,
  // 北岸：山坡、彩色屋（地面線 houseY）、中正路、港邊步道（水邊欄杆在 northEdge）
  hillY1: 3.6,
  housesX1: 44,
  houseY: 8.4,
  northRoad: { y0: 8.4, y1: 10.6 },
  northEdge: 12.2,
  // 漁港（水）、南岸步道（水邊欄杆在 southEdge）、正濱路
  southEdge: 22.4,
  southRoad: { y0: 25, y1: 27.2 },
  // 和平橋（跨過港口，可以走）、和平島（東北角）
  bridge: { x0: 45.8, x1: 48.8 },
  island: { x0: 49.6, y1: 8.4 },
  // 南邊的建築：阿根納造船廠遺構、正濱漁會（地面線 y）
  argo: { x0: 2, x1: 15, y: 33.4 },
  guild: { x0: 17, x1: 26, y: 33.2 },
  // 小吃攤車、公車站
  carts: [30.4, 34.8, 39.2],
  cartY: 31.2,
  busStop: { x: 51.2, y: 28.2 },
  // 彩色屋裡的咖啡店（第幾棟）
  cafeHouse: 9,
} as const;

// 座位（12 個，順序 = 座位編號 261–272，不要調換）：
// 北岸港邊四張面向漁港的長椅（各 2 位；背後就是彩色屋，畫面裡兩個都看得到）、南岸步道兩張石椅（各 2 位，看對岸）
export const NORTH_BENCHES = [6, 16, 25.6, 36];
export const NORTH_BENCH_Y = 11.7;
export const SOUTH_BENCHES = [12, 30];
export const SOUTH_BENCH_Y = 24.1;

export const KEELUNG_SEATS: CitySeat[] = [
  ...NORTH_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: NORTH_BENCH_Y, facing: 'down' },
    { x: x + 0.6, y: NORTH_BENCH_Y, facing: 'down' },
  ]),
  ...SOUTH_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: SOUTH_BENCH_Y, facing: 'up' },
    { x: x + 0.6, y: SOUTH_BENCH_Y, facing: 'up' },
  ]),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

// 彩色屋：一棟棟窄窄的透天厝，每棟一個顏色（x 範圍、樓層、顏色），從 x = 1 排到 housesX1
export const HOUSE_COLORS = ['#f08ab0', '#f6c945', '#6ec6e8', '#f39a4a', '#7fd1b0', '#b08ad9', '#e25a4a', '#f4f1e8', '#9ad86a', '#4f8ad9'];
export interface ColorHouse {
  x0: number;
  x1: number;
  floors: number;
  color: string;
  seed: number;
}
export const COLOR_HOUSES: ColorHouse[] = (() => {
  const widths = [3, 2.6, 3.2, 2.8, 3, 3.4, 2.6, 3, 3.2, 3.6, 2.8, 3, 3.2, 2.6, 3];
  const out: ColorHouse[] = [];
  let x = 1;
  widths.forEach((w, i) => {
    if (x >= KL.housesX1 - 0.5) return;
    const x1 = Math.min(x + w, KL.housesX1);
    out.push({ x0: x, x1, floors: 3 + ((i * 7) % 3), color: HOUSE_COLORS[(i * 3) % HOUSE_COLORS.length] ?? '#f6c945', seed: 300 + i * 17 });
    x = x1;
  });
  return out;
})();
export const CAFE = COLOR_HOUSES[KL.cafeHouse]!;

export const CART_INFO = [
  { name: { 'zh-TW': '小卷米粉', 'en-US': 'Squid Vermicelli' }, call: { 'zh-TW': '小卷米粉，小卷今天早上剛上岸！', 'en-US': 'Squid vermicelli — the squid landed this morning!' }, items: [I.squidVermicelli], awning: '#1f6fa8', food: ['#f2e8d4', '#e8a07a', '#f2e8d4'] },
  { name: { 'zh-TW': '鹹湯圓', 'en-US': 'Savory Tangyuan' }, call: { 'zh-TW': '鹹湯圓，加芹菜跟油蔥！', 'en-US': 'Savory rice balls with celery and fried shallots!' }, items: [I.saltyTangyuan], awning: '#c62828', food: ['#f4f1e8', '#f4f1e8', '#7ac46a'] },
  { name: { 'zh-TW': '碳烤小卷', 'en-US': 'Grilled Squid' }, call: { 'zh-TW': '碳烤小卷，刷醬現烤！', 'en-US': 'Charcoal-grilled squid, glazed to order!' }, items: [I.grilledSquid], awning: '#e8641c', food: ['#d97a3a', '#d97a3a', '#d97a3a'] },
];

export const KEELUNG_SHOPS: CityShop[] = [
  ...KL.carts.map((x, i): CityShop => {
    const cart = CART_INFO[i] ?? CART_INFO[0]!;
    return { name: cart.name, call: cart.call, items: cart.items, at: at(x - 1.2, KL.cartY, x + 1.2, KL.cartY + 1.4), label: { x, y: KL.cartY - 2.5 } };
  }),
  {
    name: { 'zh-TW': '彩色屋咖啡', 'en-US': 'Rainbow House Café' },
    call: { 'zh-TW': '坐在漁港邊喝咖啡，看船進進出出！', 'en-US': 'Coffee by the harbor, watching the boats come and go!' },
    items: [I.icedCoffee, I.blackTea],
    at: at(CAFE.x0 + 0.4, KL.houseY, CAFE.x1 - 0.4, KL.houseY + 1),
    label: { x: (CAFE.x0 + CAFE.x1) / 2, y: KL.houseY + 0.1 },
  },
];
