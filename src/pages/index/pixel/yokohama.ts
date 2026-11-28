// 橫濱（日本神奈川縣，獨立地圖；跟其他日本城市之間搭 JR）：
// 北邊隔著橫濱港是港未來 21 的天際線：橫濱地標大廈（往上收窄的高樓）、皇后廣場的三棟樓、Cosmo Clock 21 大摩天輪（中間是數字時鐘，會轉）、
// 帆船形的洲際飯店、遠方的橫濱海灣大橋；港裡有遊覽船和水上巴士開過。
// 港邊：西邊是兩棟紅磚倉庫（鐵陽台），前面的廣場有餐車和長椅；東邊是山下公園，海邊的石椅看港未來（重點座位），
// 公園旁停著冰川丸（黑色船身、白色上層、紅黑煙囪），草地上有「水之守護神」噴水池和玫瑰花圃。
// 過了山下公園通（銀杏行道樹）：西邊是 JR 櫻木町站（高架上有水藍色的根岸線電車開過）、老飯店風格的西式建築（拿坡里義大利麵、門前露台）；
// 中間的小路穿過善鄰門牌樓進到橫濱中華街：紅色的街屋、一串串燈籠、冒煙的肉包蒸籠攤、關帝廟、賣三碼麵的中華料理店。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { YOKOHAMA_ITEMS as I } from './cityItems';

export const YH = {
  W: 58,
  H: 42,
  // 對岸（港未來）的地面線、港的水面（南邊到山下公園的岸邊）
  shore: 9.8,
  sea: 16.6,
  // 港未來的地標（對岸，只是背景）
  landmark: { x: 9.6 },
  wheel: { x: 25.2, r: 66 },
  sail: { x: 36.4 },
  // 冰川丸（停在山下公園旁的水上；line 是吃水線）
  hikawa: { x0: 41, x1: 57.4, line: 16.3 },
  // 紅磚倉庫：2 號館（長）、1 號館（短），地面線
  brick: { line: 22.4, no2: { x0: 0.8, x1: 11.2 }, no1: { x0: 13.2, x1: 21.4 } },
  // 山下公園：海邊步道、草地、噴水池
  park: { x0: 21.4, promenade: 19.8, lawn: 25.2 },
  fountain: { x: 31.4, y: 23 },
  // 山下公園通
  road: { y0: 26.2, y1: 28.6 },
  walk: 29.4,
  // 南邊一排（地面線 rowLine）：JR 櫻木町站、西式老飯店、善鄰門的小路、中華街的街屋、關帝廟、三碼麵的店
  rowLine: 34.4,
  station: { x0: 0.6, x1: 13.4 },
  hotel: { x0: 14.4, x1: 27.6 },
  lane: { x0: 27.6, x1: 35.4 },
  gate: { x0: 28.5, x1: 34.5, line: 30.6 },
  temple: { x0: 44.6, x1: 52.4 },
  // 中華街的大街（往南到地圖邊的人行道）
  street: { y1: 40.4 },
} as const;

// 中華街的街屋（kind 決定畫法）
export type ChinaKind = 'nikuman' | 'tea' | 'sanma';
export const CHINA_ROW: { x0: number; x1: number; kind: ChinaKind }[] = [
  { x0: 35.4, x1: 40.2, kind: 'nikuman' },
  { x0: 40.2, x1: 44.6, kind: 'tea' },
  { x0: 52.4, x1: 57.6, kind: 'sanma' },
];

// 座位（12 個，順序 = 座位編號 585–596，不要調換）：
// 山下公園海邊三張石椅（背對畫面看港未來和摩天輪，各 2 位）、紅磚倉庫廣場的長椅（2 位）、
// 老飯店門前露台的小圓桌（面對面 2 位）、中華街肉包攤旁的桌子（2 位）
export const SEA_BENCHES = [25.4, 31.2, 37];
export const SEA_BENCH_Y = 18.4;
export const BRICK_BENCH = 17.3;
export const BRICK_BENCH_Y = 24.7;
export const CAFE_TABLE = { x: 17.2, y: 36.8 };
export const CHINA_TABLE = { x: 43.4, y: 38.6 };

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const YOKOHAMA_SEATS: CitySeat[] = [
  ...pair(SEA_BENCHES, SEA_BENCH_Y, 'up'),
  ...pair([BRICK_BENCH], BRICK_BENCH_Y, 'down'),
  { x: CAFE_TABLE.x - 0.8, y: CAFE_TABLE.y, facing: 'right' },
  { x: CAFE_TABLE.x + 0.8, y: CAFE_TABLE.y, facing: 'left' },
  ...pair([CHINA_TABLE.x], CHINA_TABLE.y - 0.7, 'down'),
];

// 攤子：中華街的肉包蒸籠攤（街屋門口）、紅磚倉庫廣場的餐車
export const STEAMER = { x: 37.8, y: 35.7 };
export const BRICK_CART = { x: 6, y: 24.2 };

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const sanma = CHINA_ROW[2] ?? { x0: 52.4, x1: 57.6 };
const sanmaX = (sanma.x0 + sanma.x1) / 2;
const hotelDoor = 21;

export const YOKOHAMA_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '中華街 · 肉包蒸籠', 'en-US': 'Chinatown · Steamed Buns' },
    call: { 'zh-TW': '蒸籠一掀開熱氣直冒！手掌大的肉包，邊走邊吃最好吃～', 'en-US': 'Lift the lid and the steam pours out! Palm-sized pork buns — best eaten on the go~' },
    items: [I.nikuman, I.sanmaMen],
    at: at(STEAMER.x - 1.4, STEAMER.y, STEAMER.x + 1.4, STEAMER.y + 1.1),
    label: { x: STEAMER.x, y: YH.rowLine - 4.6 },
  },
  {
    name: { 'zh-TW': '港之丘飯店 · 拿坡里義大利麵', 'en-US': 'Minato-no-Oka Hotel · Napolitan' },
    call: { 'zh-TW': '橫濱的老飯店是拿坡里義大利麵的老家，番茄醬汁、火腿、洋菇、青椒，坐露台慢慢吃。', 'en-US': 'Spaghetti Napolitan was born in a Yokohama hotel — tomato sauce, ham, mushrooms and green pepper. Take a terrace seat~' },
    items: [I.napolitan],
    at: at(hotelDoor - 1.6, YH.rowLine, hotelDoor + 1.6, YH.rowLine + 1.2),
    label: { x: hotelDoor, y: YH.rowLine - 5.3 },
  },
  {
    name: { 'zh-TW': '中華料理 · 三碼麵', 'en-US': 'Chinese Diner · Sanma-men' },
    call: { 'zh-TW': '醬油湯頭上面蓋一大匙勾芡炒豆芽，橫濱人從小吃到大的三碼麵！', 'en-US': 'Soy broth topped with glossy stir-fried bean sprouts — Yokohama’s own sanma-men!' },
    items: [I.sanmaMen, I.nikuman],
    at: at(sanma.x0 + 0.5, YH.rowLine, sanma.x1 - 0.5, YH.rowLine + 1.2),
    label: { x: sanmaX, y: YH.rowLine - 5.4 },
  },
  {
    name: { 'zh-TW': '紅磚倉庫 · 餐車', 'en-US': 'Red Brick · Food Truck' },
    call: { 'zh-TW': '紅磚倉庫前的餐車！拿坡里麵和肉包，坐旁邊的長椅看海吃～', 'en-US': 'The food truck by the Red Brick Warehouses! Napolitan and pork buns — eat on a bench by the sea~' },
    items: [I.napolitan, I.nikuman],
    at: at(BRICK_CART.x - 1.3, BRICK_CART.y, BRICK_CART.x + 1.3, BRICK_CART.y + 1),
    label: { x: BRICK_CART.x, y: BRICK_CART.y - 2.9 },
  },
];

