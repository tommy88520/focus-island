// 拉斯維加斯（美國，獨立地圖；美國城市之間搭國內線飛機）：北邊遠方是沙漠和紅色的山、細高的觀景塔；
// 大道北側由西到東是金字塔飯店（晚上光束射向天空）、巴黎鐵塔複製品、大霓虹看板、威尼斯運河（貢多拉）、單軌電車高架站；
// 中間是寬大的大道 The Strip（滿滿的車）；南側西邊是「Welcome to Fabulous Las Vegas」歡迎招牌和拉霸機，
// 中間是噴泉湖（定時的噴泉秀，湖邊欄杆前有長椅），東邊是自助餐廳（門口露台有桌子）。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { LASVEGAS_ITEMS as I } from './cityItems';

export const LV = {
  W: 58,
  H: 44,
  // 遠景：沙漠的地平線、觀景塔
  desertLine: 10.4,
  strat: { x: 52.5, y: 10.2 },
  // 大道北側：金字塔、巴黎鐵塔＋後面的飯店、霓虹看板、威尼斯（宮殿＋鐘樓、前面的運河）、單軌電車站
  northLine: 18.6,
  pyramid: { x0: 1, x1: 15 },
  paris: { x0: 16.4, x1: 26, tower: 21.2 },
  pylon: { x: 27.4, y: 20.2 },
  venice: { x0: 29, x1: 43, line: 16.6 },
  canal: { x0: 28.6, x1: 43.4, y0: 16.6, y1: 18.8 },
  campanile: { x: 31.2 },
  station: { x0: 44.4, x1: 57.6, line: 18.8 },
  // 大道：北人行道 → 四線道（中間分隔島）→ 南人行道
  road: { y0: 21.4, y1: 26.6 },
  sidewalkS: 28.8,
  // 南側：歡迎招牌廣場、噴泉湖、自助餐廳
  sign: { x: 7.5, y: 35.6 },
  lake: { x0: 15.2, x1: 43, y0: 31.4 },
  jetY: 39.6,
  buffet: { x0: 44.6, x1: 57.4, line: 36, door: 51 },
  slot: { x: 12.6, y: 31.8 },
  hotdog: { x: 3.6, y: 31.6 },
  slush: { x: 15.4, y: 20.4 },
} as const;

// 座位（12 個，順序 = 座位編號 513–524，不要調換）：
// 噴泉湖邊欄杆前三張長椅（面向湖，各 2 位）、歡迎招牌前一張長椅（2 位）、自助餐廳露台兩張桌子（各 2 位）
export const LAKE_BENCHES = [20.6, 29.1, 37.6];
export const LAKE_BENCH_Y = 30.5;
export const SIGN_BENCH = { x: LV.sign.x, y: 39 };
export const BUFFET_TABLES = [47.8, 54.2];
export const BUFFET_TABLE_Y = 40.4;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const LASVEGAS_SEATS: CitySeat[] = [...pair(LAKE_BENCHES, LAKE_BENCH_Y, 'down'), ...pair([SIGN_BENCH.x], SIGN_BENCH.y, 'down'), ...pair(BUFFET_TABLES, BUFFET_TABLE_Y - 0.7, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const LASVEGAS_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '一碼冰沙', 'en-US': 'Yard Slush' },
    call: { 'zh-TW': '一碼長的大杯冰沙，邊走大道邊喝！', 'en-US': 'A yard-long slushie — sip it all the way down the Strip!' },
    items: [I.yardSlush],
    at: at(LV.slush.x - 1.3, LV.slush.y, LV.slush.x + 1.3, LV.slush.y + 1),
    label: { x: LV.slush.x, y: LV.slush.y - 2.9 },
  },
  {
    name: { 'zh-TW': '熱狗攤', 'en-US': 'Hot Dog Cart' },
    call: { 'zh-TW': '熱狗！拍完歡迎招牌來一根！', 'en-US': 'Hot dogs! Grab one after your photo at the sign!' },
    items: [I.hotDog],
    at: at(LV.hotdog.x - 1.3, LV.hotdog.y, LV.hotdog.x + 1.3, LV.hotdog.y + 1),
    label: { x: LV.hotdog.x, y: LV.hotdog.y - 2.9 },
  },
  {
    name: { 'zh-TW': '自助餐廳', 'en-US': 'Buffet' },
    call: { 'zh-TW': '吃到飽！還有冰涼的雞尾酒蝦！', 'en-US': 'All you can eat — and chilled shrimp cocktail!' },
    items: [I.buffetPlate, I.shrimpCocktail],
    at: at(LV.buffet.door - 1.6, LV.buffet.line, LV.buffet.door + 1.6, LV.buffet.line + 1.3),
    label: { x: LV.buffet.door, y: LV.buffet.line - 6.4 },
  },
];
