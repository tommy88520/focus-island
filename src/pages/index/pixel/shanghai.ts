// 上海（中國，獨立地圖；中國只有這一個城市，地鐵 2 號線往浦東機場飛回台灣）：
// 北邊是黃浦江對岸的浦東天際線（東方明珠、金茂大廈、環球金融中心、上海中心大廈，晚上有燈光秀），江上有觀光船、貨船；
// 江邊是外灘的步道（長椅面向浦東），過了中山東一路是萬國建築博覽群（匯豐銀行的圓頂、海關大樓的鐘樓、和平飯店的綠色金字塔屋頂），東邊是地鐵站；
// 南邊是豫園一帶：西邊城隍廟（抽籤）、中間龍牆和荷花池（九曲橋通到湖心亭茶樓）、東邊小吃街（南翔小籠、生煎、麵館）。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { SHANGHAI_ITEMS as I } from './cityItems';

export const SH = {
  W: 56,
  H: 44,
  // 浦東岸（天際線的地面線）、黃浦江
  bank: 10.2,
  river: { y0: 10.4, y1: 16.4 },
  // 外灘：防汛牆（以北不能走）、江邊步道、中山東一路
  wall: 16.9,
  road: { y0: 20.4, y1: 23 },
  // 萬國建築的地面線、南邊人行道的南緣（豫園的建築從這裡開始擋）
  bundLine: 28,
  walk: 30.4,
  // 豫園一帶
  yuLine: 34.5,
  temple: { x0: 1.5, x1: 16.5 },
  garden: { x0: 18, x1: 40.6, line: 33.4 },
  lake: { x0: 18, x1: 40.6, y0: 35.2, y1: 43.4 },
  island: { x0: 25.4, x1: 33.6, y0: 37.4, y1: 42.2 },
  tea: { x0: 26, x1: 33, line: 39.8 },
  // 地鐵站（外灘東邊的小廣場）
  station: { x0: 49.4, x1: 55.4, line: 26.6 },
  // 萬國建築之間的路口（福州路、南京東路）
  gaps: [
    [14, 17],
    [32.8, 36.2],
  ] as [number, number][],
} as const;

// 外灘的大樓（由西到東；實際上是沿著江南北排開，這裡簡化成一排）
export type BundKind = 'plain' | 'hsbc' | 'customs' | 'peace';
export const BUND: { x0: number; x1: number; kind: BundKind; seed: number }[] = [
  { x0: 0.4, x1: 6.6, kind: 'plain', seed: 11 },
  { x0: 6.6, x1: 14, kind: 'hsbc', seed: 12 },
  { x0: 17, x1: 22.4, kind: 'customs', seed: 13 },
  { x0: 22.4, x1: 27.6, kind: 'plain', seed: 14 },
  { x0: 27.6, x1: 32.8, kind: 'peace', seed: 15 },
  { x0: 36.2, x1: 42.2, kind: 'plain', seed: 16 },
  { x0: 42.2, x1: 48.4, kind: 'plain', seed: 17 },
];

// 九曲橋：一段段的橋面（可以走的水面）；西邊從城隍廟廣場、東邊從小吃街接到湖心亭
export const BRIDGES: Rect[] = [
  { x0: 17.4, y0: 40.6, x1: 20.2, y1: 41.8 },
  { x0: 19, y0: 38.6, x1: 20.2, y1: 41.8 },
  { x0: 19, y0: 38.6, x1: 22.8, y1: 39.8 },
  { x0: 21.6, y0: 38.6, x1: 22.8, y1: 41.9 },
  { x0: 21.6, y0: 40.7, x1: 25.8, y1: 41.9 },
  { x0: 33.2, y0: 40.6, x1: 36, y1: 41.8 },
  { x0: 34.8, y0: 38.6, x1: 36, y1: 41.8 },
  { x0: 34.8, y0: 38.6, x1: 41, y1: 39.8 },
];

// 座位（12 個，順序 = 座位編號 561–572，不要調換）：
// 外灘江邊三張長椅（面向浦東，各 2 位）、湖心亭茶樓前兩張茶桌（各 2 位）、豫園的石桌石凳（2 位）
export const BUND_BENCHES = [9, 24.5, 41];
export const BUND_BENCH_Y = 18.6;
export const TEA_TABLES = [27.9, 31.3];
export const TEA_TABLE_Y = 41.5;
export const STONE_TABLE = { x: 46.5, y: 41.4 };

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const SHANGHAI_SEATS: CitySeat[] = [
  ...pair(BUND_BENCHES, BUND_BENCH_Y, 'up'),
  ...pair(TEA_TABLES, TEA_TABLE_Y - 0.7, 'down'),
  { x: STONE_TABLE.x - 1.25, y: STONE_TABLE.y, facing: 'right' },
  { x: STONE_TABLE.x + 1.25, y: STONE_TABLE.y, facing: 'left' },
];

// 小吃街的三間店（由西到東）
type Text2 = { 'zh-TW': string; 'en-US': string };
export const FOOD_SHOPS: { x0: number; x1: number; sign: string; cloth: string; name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] }[] = [
  {
    x0: 41.2,
    x1: 46,
    sign: '南翔小籠',
    cloth: '#c8102e',
    name: { 'zh-TW': '南翔小籠包', 'en-US': 'Nanxiang Xiaolongbao' },
    call: { 'zh-TW': '一籠剛蒸好！先咬個小口吸湯汁，小心燙～', 'en-US': 'Fresh from the steamer! Nibble a hole and sip the soup first — careful, it’s hot!' },
    items: [I.xiaolongbao],
  },
  {
    x0: 46,
    x1: 50.8,
    sign: '生煎饅頭',
    cloth: '#d97a1a',
    name: { 'zh-TW': '生煎包', 'en-US': 'Shengjian Buns' },
    call: { 'zh-TW': '底部煎得金黃酥脆，撒芝麻蔥花，一鍋剛起！', 'en-US': 'Crispy golden bottoms, sesame and scallions — a fresh pan just came off!' },
    items: [I.shengjianbao],
  },
  {
    x0: 50.8,
    x1: 55.6,
    sign: '老上海麵館',
    cloth: '#2a6a4a',
    name: { 'zh-TW': '老上海麵館', 'en-US': 'Old Shanghai Noodles' },
    call: { 'zh-TW': '蔥油拌麵、排骨年糕，老上海的味道！', 'en-US': 'Scallion oil noodles and pork chop with rice cakes — old Shanghai flavours!' },
    items: [I.scallionOilNoodles, I.porkChopRiceCake],
  },
];

export const SHANGHAI_SHOPS: CityShop[] = FOOD_SHOPS.map((s) => ({
  name: s.name,
  call: s.call,
  items: s.items,
  at: { x0: s.x0 + 0.4, y0: SH.yuLine, x1: s.x1 - 0.4, y1: SH.yuLine + 1.3 },
  label: { x: (s.x0 + s.x1) / 2 + (s.x0 < 42 ? 0.8 : 0), y: SH.yuLine + 1.9 },
}));
