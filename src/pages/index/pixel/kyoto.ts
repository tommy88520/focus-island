// 京都（日本，獨立地圖；從桃園機場飛關西、日本城市之間搭 JR）：北邊東山的山坡上是清水寺（木造舞台、三重塔、紅葉），
// 山腳下的仁王門可以抽籤；產寧坂的石板路兩旁是町家小店（抹茶霜淇淋、生八橋、甘味處的紅傘長凳），東邊是八坂塔；
// 下面一排是祇園的町家（一力亭的紅牆、燈籠），東邊山裡有一條伏見稻荷的千本鳥居（走到最上面的奧社有長椅）；
// 南邊是鴨川（四條大橋、烏龜跳石，河岸等間隔坐下）、馬路、JR 京都車站和京都塔。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { KYOTO_ITEMS as I } from './cityItems';

export const KY = {
  W: 56,
  H: 40,
  // 東山的山坡（清水寺在上面），山腳的石垣
  hillLine: 10.6,
  kiyomizu: { x0: 2, x1: 24, line: 9.8 },
  niomon: { x0: 11.5, x1: 17.5, line: 11.2 },
  // 產寧坂：北邊一排町家、東邊八坂塔；石板路到 sannen.y1
  sannen: { y1: 16.6 },
  machiya: [
    { x0: 18.2, x1: 23.6, kind: 'matcha' as const },
    { x0: 23.6, x1: 29, kind: 'yatsuhashi' as const },
    { x0: 29, x1: 35, kind: 'kanmi' as const },
  ],
  rowLine: 11.2,
  yasaka: { x: 39, line: 11.4 },
  // 祇園：一排町家（面向北邊的石板路）
  gion: { x0: 1, x1: 31, line: 19.6 },
  // 伏見稻荷的千本鳥居：東邊山裡，隧道從 inari.y1 往北走到奧社
  inari: { x0: 44, x1: 56, tx0: 48.3, tx1: 50.7, y0: 11.2, top: 13.6, y1: 25.2 },
  // 鴨川（北岸 y0、南岸 y1）、四條大橋、跳石
  river: { y0: 26.2, y1: 30.2 },
  bridge: { x0: 7.4, x1: 11.6 },
  stones: { x: 35.5 },
  road: { y0: 32.2, y1: 34.4 },
  station: { x0: 13, x1: 41, line: 38.6 },
  tower: { x: 50.5, line: 39.6 },
} as const;

// 座位（12 個，順序 = 座位編號 369–380，不要調換）：
// 甘味處前兩張紅傘長凳（各 2 位）、鴨川河岸三對（背對畫面看河，等間隔）、千本鳥居上面奧社前的長椅（2 位）
export const TEA_BENCHES = [30.6, 33.6];
export const TEA_BENCH_Y = 14.4;
export const BANK_PAIRS = [16, 27, 38];
export const BANK_Y = 30.9;
export const OKUSHA_BENCH = { x: 52.4, y: 13.2 };

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const KYOTO_SEATS: CitySeat[] = [...pair(TEA_BENCHES, TEA_BENCH_Y, 'down'), ...pair(BANK_PAIRS, BANK_Y, 'up'), ...pair([OKUSHA_BENCH.x], OKUSHA_BENCH.y, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const mid = (m: { x0: number; x1: number }) => (m.x0 + m.x1) / 2;
const [M0, M1, M2] = KY.machiya;

export const KYOTO_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '抹茶霜淇淋', 'en-US': 'Matcha Soft Serve' },
    call: { 'zh-TW': 'いらっしゃいませ！宇治抹茶的霜淇淋～', 'en-US': 'Irasshaimase! Uji matcha soft serve~' },
    items: [I.matchaSoftServe],
    at: at(M0.x0 + 0.3, KY.rowLine, M0.x1 - 0.3, KY.rowLine + 1.2),
    label: { x: mid(M0), y: KY.rowLine - 5.6 },
  },
  {
    name: { 'zh-TW': '生八橋', 'en-US': 'Nama Yatsuhashi' },
    call: { 'zh-TW': '試吃看看！肉桂和抹茶口味的生八橋。', 'en-US': 'Try a sample! Cinnamon and matcha yatsuhashi.' },
    items: [I.yatsuhashi],
    at: at(M1.x0 + 0.3, KY.rowLine, M1.x1 - 0.3, KY.rowLine + 1.2),
    label: { x: mid(M1), y: KY.rowLine - 5.6 },
  },
  {
    name: { 'zh-TW': '甘味處', 'en-US': 'Kanmi Teahouse' },
    call: { 'zh-TW': '坐一下吧，來份糰子配抹茶。', 'en-US': 'Have a seat — dango with matcha?' },
    items: [I.dango, I.matcha],
    at: at(M2.x0 + 0.3, KY.rowLine, M2.x1 - 0.3, KY.rowLine + 1.2),
    label: { x: mid(M2), y: KY.rowLine - 5.6 },
  },
];

// 仁王門前抽籤（清水寺的御神籤）
export const NIOMON_DOOR = { x: (KY.niomon.x0 + KY.niomon.x1) / 2, y: KY.niomon.line + 0.8 };
