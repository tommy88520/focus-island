// 花蓮七星潭（獨立地圖，從台北車站搭台鐵太魯閣號過來）：
// 北邊是中央山脈的山（清水斷崖那一帶的高山），山腳下一條公路；中間是七星潭的海岸公園（草地、觀景台、星星廣場、自行車道）、
// 攤車（扁食、柴魚、剉冰）、七星柴魚博物館；南邊是一片礫石灘（鵝卵石），再往外是太平洋，遠處有賞鯨船。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { HUALIEN_ITEMS as I } from './cityItems';

export const HL = {
  W: 56,
  H: 36,
  // 北邊的山、山腳公路
  mountainY1: 6.4,
  road: { y0: 6.4, y1: 9 },
  // 海岸公園（草地）、自行車道
  parkY1: 22.6,
  bike: { y0: 22.6, y1: 24.6 },
  // 礫石灘、海浪線、太平洋
  shoreY: 27.6,
  // 觀景台（木頭平台）、星星廣場
  deck: { x0: 22, x1: 34, y0: 14.6, y1: 18.6 },
  plaza: { cx: 44, cy: 16.4, r: 3.2 },
  // 七星柴魚博物館
  museum: { x0: 2, x1: 13.6, y: 15.4 },
  // 攤車
  carts: [15.8, 19.6, 41.4],
  cartY: 21.4,
  // 台鐵 花蓮站的接駁巴士站
  busStop: { x: 50.4, y: 9.8 },
} as const;

// 座位（12 個，順序 = 座位編號 249–260，不要調換）：
// 觀景台三張面海的長椅（各 2 位）、觀景台兩邊的小長椅（各 1 位）、星星廣場邊兩塊石椅、礫石灘上兩塊大石頭
export const DECK_BENCHES = [24, 28, 32];
export const DECK_BENCH_Y = 18;
export const PLAZA_STONES = [{ x: 40.2, y: 18.4 }, { x: 47.8, y: 18.4 }];
export const BEACH_ROCKS = [{ x: 12, y: 26.6 }, { x: 37, y: 26.8 }];

export const HUALIEN_SEATS: CitySeat[] = [
  ...DECK_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: DECK_BENCH_Y, facing: 'down' },
    { x: x + 0.6, y: DECK_BENCH_Y, facing: 'down' },
  ]),
  { x: 21, y: 20.4, facing: 'down' },
  { x: 35, y: 20.4, facing: 'down' },
  ...PLAZA_STONES.map((s): CitySeat => ({ x: s.x, y: s.y, facing: 'down' })),
  ...BEACH_ROCKS.map((s): CitySeat => ({ x: s.x, y: s.y, facing: 'down' })),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const CART_INFO = [
  { name: { 'zh-TW': '花蓮扁食', 'en-US': 'Hualien Wontons' }, call: { 'zh-TW': '扁食一碗，皮薄餡多！', 'en-US': 'A bowl of wontons — thin skin, plenty of filling!' }, items: [I.wonton], awning: '#c62828', food: ['#f2e8d4', '#f2e8d4', '#f2e8d4'] },
  { name: { 'zh-TW': '剉冰', 'en-US': 'Shaved Ice' }, call: { 'zh-TW': '海邊吃剉冰，最消暑！', 'en-US': 'Shaved ice by the sea — perfect on a hot day!' }, items: [I.shavedIce], awning: '#1f6fa8', food: ['#f6c27a', '#f2a6c4', '#a8e0a8'] },
  { name: { 'zh-TW': '七星柴魚', 'en-US': 'Qixing Bonito' }, call: { 'zh-TW': '柴魚片現刨的，很香喔！', 'en-US': 'Freshly shaved bonito flakes!' }, items: [I.driedBonito], awning: '#8a5a32', food: ['#c98a5a', '#d9a35a', '#c98a5a'] },
];

export const HUALIEN_SHOPS: CityShop[] = [
  ...HL.carts.map((x, i): CityShop => {
    const cart = CART_INFO[i] ?? CART_INFO[0]!;
    return { name: cart.name, call: cart.call, items: cart.items, at: at(x - 1.2, HL.cartY, x + 1.2, HL.cartY + 1.4), label: { x, y: HL.cartY - 2.5 } };
  }),
  {
    name: { 'zh-TW': '七星柴魚博物館', 'en-US': 'Qixing Bonito Museum' },
    call: { 'zh-TW': '歡迎參觀，柴魚伴手禮在這邊！', 'en-US': 'Welcome! Bonito souvenirs this way!' },
    items: [I.driedBonito],
    at: at(6.6, HL.museum.y, 9, HL.museum.y + 1.2),
    label: { x: 7.8, y: HL.museum.y + 0.1 },
  },
];
