// 廣島 · 宮島（日本，獨立地圖；從 JR 宮島口搭渡輪過來）：北邊是彌山，西邊小山丘上是五重塔和千疊閣，
// 中間是表參道商店街（紅葉饅頭、茶屋、星鰻飯、烤牡蠣、巨大的木杓子），東邊是宮島棧橋（白色渡輪會開進來、開走）；
// 往南是海邊的御笠濱（石燈籠、看大鳥居的長椅），海上西邊是嚴島神社（朱紅的迴廊蓋在海上），正南方是海裡的大鳥居。
// 潮汐：用時間算漲潮／退潮（大約 12 小時 25 分一輪），退潮時鳥居周圍露出沙灘、可以走到鳥居下。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { HIROSHIMA_ITEMS as I } from './cityItems';

export const HS = {
  W: 56,
  H: 44,
  // 彌山的森林到這裡；西邊小山丘（五重塔、千疊閣）的石牆
  hillX1: 22,
  hillLine: 17.6,
  pagoda: { x: 12.5, line: 12.6 },
  senjokaku: { x0: 2, x1: 8.6, line: 13.4 },
  // 表參道：北邊一排町家的地面線、街到哪裡
  street: { x0: 22, x1: 45, line: 14.5 },
  // 町家（x0、x1）：紅葉饅頭、茶屋、星鰻飯、烤牡蠣
  momiji: { x0: 22, x1: 27 },
  tea: { x0: 27, x1: 33 },
  anago: { x0: 33, x1: 38.5 },
  oyster: { x0: 38.5, x1: 45 },
  grillY: 15.1,
  shamoji: { x0: 35.4, x1: 41.6, y: 19.2 },
  // 宮島棧橋（JR 渡輪）：站房、浮動碼頭、渡輪停的地方
  pier: { x0: 45, x1: 56, line: 19.6 },
  jetty: { x0: 45.6, x1: 54.6, y0: 23.4, y1: 25.2 },
  ferryLine: 27.3,
  // 海邊的步道（御笠濱）、海
  prom: 19.5,
  sea: 23.4,
  // 大鳥居（立在海裡）
  torii: { x: 32, line: 36.5 },
  // 嚴島神社（蓋在海上）：拜殿、迴廊、平舞台、火燒前
  hall: { x0: 6.4, x1: 16.6, line: 28.6 },
  westCorridor: { x0: 1.6, x1: 3.6 },
  eastCorridor: { x0: 19.4, x1: 21.4 },
  front: { y0: 30, y1: 32 },
  haraiden: { x0: 8.2, x1: 14.8 },
  stage: { x0: 9.5, x1: 13.5, y1: 35 },
  tip: { x0: 10.8, x1: 12.2, y1: 37 },
} as const;

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

// 蓋在海上、可以走的木板地（迴廊、拜殿前、平舞台、火燒前）、浮動碼頭
export const FLOORS: Rect[] = [
  at(HS.westCorridor.x0, HS.sea - 0.2, HS.westCorridor.x1, HS.front.y1),
  at(HS.eastCorridor.x0, HS.sea - 0.2, HS.eastCorridor.x1, HS.front.y1),
  at(HS.westCorridor.x0, HS.front.y0, HS.eastCorridor.x1, HS.front.y1),
  at(HS.haraiden.x0, HS.hall.line, HS.haraiden.x1, HS.front.y0 + 0.1),
  at(HS.stage.x0, HS.front.y1 - 0.1, HS.stage.x1, HS.stage.y1),
  at(HS.tip.x0, HS.stage.y1 - 0.1, HS.tip.x1, HS.tip.y1),
  at(HS.jetty.x0, HS.sea - 0.2, HS.jetty.x1, HS.jetty.y1),
];

// 座位（12 個，順序 = 座位編號 441–452，不要調換）：
// 御笠濱看大鳥居的兩張長椅（各 2 位）、表參道茶屋的紅毛氈長凳（各 2 位）、嚴島神社前迴廊邊（兩邊各 2 位，面向大海）
export const SHORE_BENCHES = [27.4, 36.6];
export const SHORE_BENCH_Y = 22.6;
export const TEA_BENCHES = [28.4, 31.8];
export const TEA_BENCH_Y = 17.3;
export const CORRIDOR_SEATS = [5, 6.2, 16.8, 18];
export const CORRIDOR_SEAT_Y = 31.5;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const HIROSHIMA_SEATS: CitySeat[] = [
  ...pair(SHORE_BENCHES, SHORE_BENCH_Y, 'down'),
  ...pair(TEA_BENCHES, TEA_BENCH_Y, 'down'),
  ...CORRIDOR_SEATS.map((x): CitySeat => ({ x, y: CORRIDOR_SEAT_Y, facing: 'down' })),
];

const mid = (r: { x0: number; x1: number }) => (r.x0 + r.x1) / 2;
export const HIROSHIMA_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '紅葉饅頭', 'en-US': 'Momiji Manju' },
    call: { 'zh-TW': '剛從烤模出來的紅葉饅頭，熱熱的！', 'en-US': 'Maple-leaf cakes fresh off the mould — still warm!' },
    items: [I.momijiManju],
    at: at(HS.momiji.x0 + 0.6, HS.street.line + 0.1, HS.momiji.x1 - 0.6, HS.street.line + 1.4),
    label: { x: mid(HS.momiji), y: HS.street.line - 5.2 },
  },
  {
    name: { 'zh-TW': '星鰻飯食堂', 'en-US': 'Anago-meshi Diner' },
    call: { 'zh-TW': '宮島名物星鰻飯，醬汁烤得香香的！', 'en-US': 'Miyajima’s famous conger-eel rice, glazed and grilled!' },
    items: [I.anagoMeshi],
    at: at(HS.anago.x0 + 0.6, HS.street.line + 0.1, HS.anago.x1 - 0.6, HS.street.line + 1.4),
    label: { x: mid(HS.anago), y: HS.street.line - 5.2 },
  },
  {
    name: { 'zh-TW': '炭烤牡蠣', 'en-US': 'Charcoal Oysters' },
    call: { 'zh-TW': '廣島的牡蠣，炭火烤到開口最好吃！', 'en-US': 'Hiroshima oysters, grilled over charcoal till they pop open!' },
    items: [I.grilledOyster],
    at: at(HS.oyster.x0 + 0.8, HS.grillY + 0.05, HS.oyster.x1 - 0.8, HS.grillY + 1.3),
    label: { x: mid(HS.oyster), y: HS.street.line - 5.2 },
  },
];
