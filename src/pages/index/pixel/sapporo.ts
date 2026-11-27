// 札幌（日本北海道，獨立地圖；跟京阪神東京之間搭 JR）：北邊遠方是手稻山、藻岩山（雪山），前面是 JR 札幌站（玻璃大站房＋旁邊的高塔）
// 和西邊紅磚的北海道廳舊本廳舍（八角塔）；過了北一條通是白色木造的札幌市時計台，前面草地有面向時計台的長椅；
// 再過一條馬路是東西向的大通公園（花壇、噴水池、烤玉米攤車、牛奶霜淇淋、長椅），東端是紅色的札幌電視塔（大大的數字時鐘）；
// 最南邊是薄野：霓虹大樓中間的拉麵橫丁（窄巷子、紅燈籠、暖簾、吧台椅）。冬天（台灣時間 12–2 月）積雪、下雪，大通公園有雪雕。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { SAPPORO_ITEMS as I } from './cityItems';

export const SP = {
  W: 58,
  H: 46,
  // 遠景（山、天際線）到哪裡都擋住
  skyline: 13,
  // 北邊：北海道廳舊本廳舍（赤れんが）、JR 札幌站的地面線
  northLine: 15,
  akarenga: { x0: 3, x1: 19 },
  station: { x0: 32, x1: 56 },
  road1: { y0: 16.6, y1: 19 },
  // 中間：時計台、成吉思汗烤肉店、辦公大樓
  midLine: 22.4,
  clock: { x0: 26, x1: 34 },
  jingis: { x0: 2, x1: 12 },
  road2: { y0: 25.6, y1: 28 },
  // 大通公園：北邊花壇、中間步道、南邊草地；東端電視塔
  park: { y0: 28, walk0: 29.4, walk1: 33.8, y1: 35.6 },
  fountain: { x: 15, y: 31.6, r: 1.7 },
  cornX: 23,
  softX: 30,
  cartY: 30.6,
  tower: { x: 52.5, y: 33.6 },
  // 薄野：霓虹大樓、拉麵橫丁（巷子在南邊，入口在中間）
  susukinoTop: 36.4,
  alleyLine: 41.4,
  gate: { x0: 28.5, x1: 31.5 },
  neonL: { x0: 0, x1: 13 },
  neonR: { x0: 45.5, x1: 58 },
} as const;

// 拉麵橫丁的小店（左右兩排，中間是入口）；seats 有吧台椅的店、shop 是賣味噌拉麵的店
export const RAMEN_SHOPS: { x0: number; x1: number; name: string; noren: string; seats?: boolean; shop?: boolean }[] = [
  { x0: 13, x1: 17, name: '味噌', noren: '#2a3f7a', seats: true },
  { x0: 17, x1: 21, name: '札幌', noren: '#8a2a22', seats: true },
  { x0: 21, x1: 24.8, name: '醤油', noren: '#3a5a2a' },
  { x0: 24.8, x1: 28.5, name: '塩', noren: '#f4efe2' },
  { x0: 31.5, x1: 35, name: '餃子', noren: '#5a2a5a' },
  { x0: 35, x1: 38.5, name: '味噌', noren: '#c8401e', shop: true },
  { x0: 38.5, x1: 42, name: '辛味噌', noren: '#2a3a3a' },
  { x0: 42, x1: 45.5, name: 'バター', noren: '#d8a830' },
];

// 座位（12 個，順序 = 座位編號 429–440，不要調換）：
// 大通公園兩張長椅（面向步道、旁邊就是電視塔，各 2 位）、拉麵橫丁兩家店的吧台椅（背對畫面面向吧台，各 2 位）、
// 時計台前草地兩張長椅（背對畫面看時計台，各 2 位）
export const ODORI_BENCHES = [38.5, 44];
export const ODORI_BENCH_Y = 30.4;
export const RAMEN_STOOL_Y = 42.2;
export const CLOCK_BENCHES = [27.4, 32.6];
export const CLOCK_BENCH_Y = 24.6;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);
const ramenSeatX = RAMEN_SHOPS.filter((s) => s.seats).map((s) => (s.x0 + s.x1) / 2);

export const SAPPORO_SEATS: CitySeat[] = [...pair(ODORI_BENCHES, ODORI_BENCH_Y, 'down'), ...pair(ramenSeatX, RAMEN_STOOL_Y, 'up'), ...pair(CLOCK_BENCHES, CLOCK_BENCH_Y, 'up')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const ramenShop = RAMEN_SHOPS.find((s) => s.shop) ?? RAMEN_SHOPS[0];
const rx = ramenShop ? (ramenShop.x0 + ramenShop.x1) / 2 : 36.75;
const jx = (SP.jingis.x0 + SP.jingis.x1) / 2;

export const SAPPORO_SHOPS: CityShop[] = [
  { name: { 'zh-TW': '味噌拉麵', 'en-US': 'Miso Ramen' }, call: { 'zh-TW': '濃厚味噌湯頭＋奶油玉米，暖到心裡！', 'en-US': 'Rich miso broth with butter and corn — warms you right up!' }, items: [I.misoRamen], at: at(rx - 1.6, SP.alleyLine, rx + 1.6, SP.alleyLine + 1.3), label: { x: rx, y: SP.alleyLine - 4.3 } },
  { name: { 'zh-TW': '烤玉米攤', 'en-US': 'Grilled Corn Cart' }, call: { 'zh-TW': '大通公園的夏天名物，醬油烤玉米！', 'en-US': 'Odori Park’s summer classic — soy-grilled corn!' }, items: [I.hokkaidoCorn], at: at(SP.cornX - 1.3, SP.cartY, SP.cornX + 1.3, SP.cartY + 1), label: { x: SP.cornX, y: SP.cartY - 2.9 } },
  { name: { 'zh-TW': '牛奶霜淇淋', 'en-US': 'Milk Soft Serve' }, call: { 'zh-TW': '北海道牛奶做的霜淇淋，濃到不行！', 'en-US': 'Soft serve made with Hokkaido milk — super creamy!' }, items: [I.milkSoftServe], at: at(SP.softX - 1.3, SP.cartY, SP.softX + 1.3, SP.cartY + 1), label: { x: SP.softX, y: SP.cartY - 3.3 } },
  { name: { 'zh-TW': '成吉思汗烤羊肉', 'en-US': 'Jingisukan Grill' }, call: { 'zh-TW': '鐵盔鍋烤羊肉，配滿滿的蔬菜！', 'en-US': 'Lamb grilled on a dome-shaped iron pan, with plenty of veggies!' }, items: [I.jingisukan], at: at(jx - 2.6, SP.midLine, jx + 2.6, SP.midLine + 1.2), label: { x: jx, y: SP.midLine - 4.6 } },
];
