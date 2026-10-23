// 臺中（臺中車站一帶，獨立地圖，從台北車站搭高鐵過來）：
// 北邊中山路上有宮原眼科、第四信用合作社；中間綠川從北往南流，中山路過河的地方是中山綠橋，兩岸是步道（座位在岸邊）；
// 西岸有小吃攤車（大麵羹、太陽餅、珍珠奶茶），東岸是河畔的小公園；南邊是紅磚的臺中車站舊站和站前廣場、臺灣大道。
// 跟其他地圖一樣，建築都畫成正面朝南。座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { TAICHUNG_ITEMS as I } from './cityItems';

export const TC = {
  W: 52,
  H: 36,
  // 北邊一排的地面線、中山路
  northLine: 7.4,
  zhongshan: { y0: 8.6, y1: 11.2 },
  // 綠川：河道（含兩邊石牆）、水面、兩岸步道；中山路過河的地方是中山綠橋
  river: { x0: 21.6, x1: 26.4, y1: 24.6 },
  westWalk: { x0: 18.8, x1: 21.6 },
  eastWalk: { x0: 26.4, x1: 29.2 },
  // 臺中車站舊站（紅磚、白色飾帶、正中間鐘塔）、站前廣場、臺灣大道
  station: { x0: 10, y0: 25.2, x1: 42, y1: 29.6 },
  plazaY: 33,
  avenue: { y0: 33, y1: 35.6 },
  // 西岸小吃攤車（檯面前緣）
  carts: [5, 10, 15],
  cartY: 15,
} as const;

export interface TaichungHouse {
  x0: number;
  x1: number;
  floors: number;
  seed: number;
  special?: 'miyahara' | 'fourth';
}
// 北邊中山路的一排（中間空出綠川）
export const NORTH_ROW: TaichungHouse[] = [
  { x0: 0, x1: 4.8, floors: 3, seed: 101 },
  { x0: 4.8, x1: 9.4, floors: 2, seed: 102 },
  { x0: 9.4, x1: 17.4, floors: 3, seed: 103, special: 'fourth' },
  { x0: 17.4, x1: 21.4, floors: 3, seed: 104 },
  { x0: 26.6, x1: 38.2, floors: 2, seed: 105, special: 'miyahara' },
  { x0: 38.2, x1: 42.6, floors: 3, seed: 106 },
  { x0: 42.6, x1: 47, floors: 2, seed: 107 },
  { x0: 47, x1: 52, floors: 3, seed: 108 },
];
// 車站兩邊的街屋
export const SOUTH_ROW: TaichungHouse[] = [
  { x0: 0, x1: 5, floors: 3, seed: 111 },
  { x0: 5, x1: 10, floors: 2, seed: 112 },
  { x0: 42, x1: 47, floors: 2, seed: 113 },
  { x0: 47, x1: 52, floors: 3, seed: 114 },
];

// 座位（12 個，順序 = 座位編號 201–212，不要調換）：
// 綠川西岸 4 個（面向河）、東岸 4 個（面向河）、站前廣場兩張長椅各 2 位
export const RIVER_SEAT_YS = [13.6, 16.2, 18.8, 21.4];
export const WEST_SEAT_X = 20.7;
export const EAST_SEAT_X = 27.3;
export const PLAZA_BENCHES = [17.2, 34.8];
export const BENCH_Y = 31.6;

export const TAICHUNG_SEATS: CitySeat[] = [
  ...RIVER_SEAT_YS.map((y): CitySeat => ({ x: WEST_SEAT_X, y, facing: 'right' })),
  ...RIVER_SEAT_YS.map((y): CitySeat => ({ x: EAST_SEAT_X, y, facing: 'left' })),
  ...PLAZA_BENCHES.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y: BENCH_Y, facing: 'down' },
    { x: x + 0.6, y: BENCH_Y, facing: 'down' },
  ]),
];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const CART_INFO = [
  { name: { 'zh-TW': '大麵羹', 'en-US': 'Da Mian Geng' }, call: { 'zh-TW': '大麵羹，臺中人的早餐！', 'en-US': 'Da mian geng, a Taichung breakfast!' }, items: [I.daMianGeng], awning: '#c62828', food: ['#d9a35a', '#8a5a32', '#d9a35a'] },
  { name: { 'zh-TW': '太陽餅', 'en-US': 'Suncakes' }, call: { 'zh-TW': '太陽餅剛出爐，酥到掉屑！', 'en-US': 'Fresh suncakes, flaky!' }, items: [I.sunCake], awning: '#d97a1a', food: ['#f2d27a', '#f2d27a', '#e8c060', '#f2d27a'] },
  { name: { 'zh-TW': '珍珠奶茶', 'en-US': 'Bubble Tea' }, call: { 'zh-TW': '珍珠奶茶，半糖少冰？', 'en-US': 'Bubble tea, half sugar, less ice?' }, items: [I.pearlMilkTea], awning: '#2a7a46', food: ['#c9a27a', '#c9a27a', '#c9a27a'] },
];

export const TAICHUNG_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '宮原眼科', 'en-US': 'Miyahara' },
    call: { 'zh-TW': '冰淇淋口味任你挑，還可以加鳳梨酥！', 'en-US': 'Pick your flavours — add pineapple cake on top!' },
    items: [I.iceCreamCone, I.pineappleCake, I.sunCake],
    at: at(29.4, TC.northLine, 34.2, TC.northLine + 1.4),
    label: { x: 31.8, y: TC.northLine + 0.15 },
  },
  {
    name: { 'zh-TW': '第四信用合作社', 'en-US': 'The Fourth Credit Union' },
    call: { 'zh-TW': '歡迎光臨，今天想吃什麼口味？', 'en-US': 'Welcome! Which flavour today?' },
    items: [I.iceCreamCone],
    at: at(11.6, TC.northLine, 15.2, TC.northLine + 1.4),
    label: { x: 13.4, y: TC.northLine + 0.15 },
  },
  ...TC.carts.map((x, i): CityShop => {
    const cart = CART_INFO[i] ?? CART_INFO[0]!;
    return { name: cart.name, call: cart.call, items: cart.items, at: at(x - 1.2, TC.cartY, x + 1.2, TC.cartY + 1.6), label: { x, y: TC.cartY - 2.5 } };
  }),
];
