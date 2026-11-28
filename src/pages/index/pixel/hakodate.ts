// 函館（日本北海道，獨立地圖；跟其他日本城市之間搭 JR）：
// 北邊是函館山（纜車從山腳的站上下山，山頂有展望台和電視塔，晚上纜車和山頂亮燈）；
// 山腳的元町一排洋館：函館山纜車山麓站、函館東正教會（白牆、綠色洋蔥頂）、八幡坂的坡頂、舊函館區公會堂（藍灰色牆、黃色窗框、陽台）、天主教元町教會（尖塔）；
// 教會前面是元町的石板廣場（坡頂的長椅看港），八幡坂筆直往南一路下到海邊，兩旁行道樹和和洋折衷的老房子（一間是鹽味拉麵店）；
// 坡底橫過市電的馬路（路面電車開來開去），過了馬路是港邊：JR 函館站、函館朝市（活烏賊水槽、帝王蟹、鮭魚卵丼的吧台）、八幡坂下的廣場、金森紅磚倉庫；
// 最南邊是函館港：摩周丸（舊青函連絡船）停在岸邊，遠處有亮著集魚燈的烏賊船。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { HAKODATE_ITEMS as I } from './cityItems';

export const HD = {
  W: 58,
  H: 46,
  // 山腳（再往北都是山，不能走）
  foot: 11.2,
  // 元町一排（地面線 rowB）：纜車山麓站、東正教會、八幡坂（坡道）、公會堂、天主教會
  rowB: 17.8,
  ropeway: { x0: 0.6, x1: 8.6 },
  orthodox: { x0: 9.4, x1: 22.2 },
  slope: { x0: 24.6, x1: 30.4, walk0: 23.6, walk1: 31.4 },
  hall: { x0: 32.6, x1: 46.6 },
  catholic: { x0: 47.6, x1: 57.4 },
  // 元町的廣場（教會前面）
  plaza: { y1: 21.2 },
  // 坡道兩旁的老房子（地面線）、北邊的人行道、市電的馬路、南邊的人行道
  rowB2: 26.4,
  road: { y0: 27.2, y1: 30.4 },
  // 市電的兩條軌道（往西、往東）、汽車道
  tram: { west: 28.55, east: 29.3 },
  walkS: 31.4,
  // 港邊一排（地面線 rowC）：JR 函館站、朝市、八幡坂下的廣場、金森紅磚倉庫
  rowC: 36.4,
  station: { x0: 0.4, x1: 12.4 },
  market: { x0: 12.8, x1: 23.8 },
  kanemori: { x0: 32, x1: 57.6 },
  // 海（岸壁）
  sea: 39.8,
  // 摩周丸（line 是吃水線）
  mashu: { x0: 8.4, x1: 28.4, line: 45.4 },
} as const;

// 和洋折衷的老房子（一樓和式、二樓洋式）：坡道兩旁；ramen 是鹽味拉麵店
export type HouseKind = 'green' | 'pink' | 'yellow' | 'blue' | 'cream' | 'ramen';
export const HOUSES: { x0: number; x1: number; kind: HouseKind }[] = [
  { x0: 0.4, x1: 5, kind: 'yellow' },
  { x0: 5, x1: 9.6, kind: 'green' },
  { x0: 9.6, x1: 14.2, kind: 'pink' },
  { x0: 14.2, x1: 18.6, kind: 'blue' },
  { x0: 18.6, x1: 23.4, kind: 'ramen' },
  { x0: 31.6, x1: 36.4, kind: 'cream' },
  { x0: 36.4, x1: 41.2, kind: 'green' },
  { x0: 41.2, x1: 46, kind: 'pink' },
  { x0: 46, x1: 51.2, kind: 'yellow' },
  { x0: 51.2, x1: 57.6, kind: 'blue' },
];

// 金森紅磚倉庫（三棟；gable 是山牆朝前的那棟）
export const WAREHOUSES: { x0: number; x1: number; gable: boolean }[] = [
  { x0: 32, x1: 40.4, gable: false },
  { x0: 40.4, x1: 48.8, gable: true },
  { x0: 48.8, x1: 57.6, gable: false },
];

// 座位（12 個，順序 = 座位編號 597–608，不要調換）：
// 八幡坂坡頂兩張長椅（面向南邊看坡道和港，各 2 位）、公會堂前的長椅（2 位）、
// 金森紅磚倉庫前海邊兩張長椅（看港，各 2 位）、朝市鮭魚卵丼的吧台（背對畫面的高腳椅 2 位）
export const TOP_BENCHES = [21.2, 33.8];
export const TOP_BENCH_Y = 20.8;
export const HALL_BENCH = 39.6;
export const BAY_BENCHES = [36.6, 52.6];
export const BAY_BENCH_Y = 38.9;
export const COUNTER = { x: 21.2, y: 38.1 };
export const COUNTER_STOOL_Y = 38.9;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const HAKODATE_SEATS: CitySeat[] = [
  ...pair(TOP_BENCHES, TOP_BENCH_Y, 'down'),
  ...pair([HALL_BENCH], TOP_BENCH_Y, 'down'),
  ...pair(BAY_BENCHES, BAY_BENCH_Y, 'down'),
  ...pair([COUNTER.x], COUNTER_STOOL_Y, 'up'),
];

// 攤子：朝市的活烏賊／海鮮攤、朝市食堂（鮭魚卵丼）、坡下的鹽味拉麵店、金森倉庫前的烏賊飯餐車
export const SQUID_TANK = { x: 15.4 };
export const BAY_CART = { x: 44.6, y: 38.3 };
const ramen = HOUSES.find((h) => h.kind === 'ramen') ?? { x0: 18.6, x1: 23.4 };
export const RAMEN_DOOR = (ramen.x0 + ramen.x1) / 2;
export const DON_DOOR = 21.2;

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

export const HAKODATE_SHOPS: CityShop[] = [
  {
    name: { 'zh-TW': '朝市 · 活烏賊', 'en-US': 'Market · Live Squid' },
    call: { 'zh-TW': '水槽裡的烏賊還在游！帝王蟹、毛蟹都有，來一份烏賊飯配鮭魚卵丼吧～', 'en-US': 'The squid are still swimming! King crab and hairy crab too — grab some ikameshi and an ikura bowl~' },
    items: [I.ikameshi, I.ikuraDon, I.shioRamen],
    at: at(SQUID_TANK.x - 2, HD.rowC, SQUID_TANK.x + 2, HD.rowC + 1),
    label: { x: SQUID_TANK.x, y: HD.rowC - 4.6 },
  },
  {
    name: { 'zh-TW': '朝市食堂', 'en-US': 'Market Diner' },
    call: { 'zh-TW': '剛醃好的鮭魚卵滿到快掉出來！坐吧台吃，還有鹽味拉麵和烏賊飯。', 'en-US': 'Fresh-cured ikura heaped till it spills over! Take a counter seat — shio ramen and ikameshi too.' },
    items: [I.ikuraDon, I.shioRamen, I.ikameshi],
    at: at(DON_DOOR - 1.6, HD.rowC, DON_DOOR + 1.6, HD.rowC + 1),
    label: { x: DON_DOOR, y: HD.rowC - 4.6 },
  },
  {
    name: { 'zh-TW': '坂下 · 鹽味拉麵', 'en-US': 'Sakashita · Shio Ramen' },
    call: { 'zh-TW': '清澈的鹽味湯頭是函館拉麵的招牌！爬完八幡坂來一碗最暖。', 'en-US': 'Clear, salty broth — Hakodate’s signature ramen! Best after climbing Hachimanzaka.' },
    items: [I.shioRamen, I.ikameshi, I.ikuraDon],
    at: at(RAMEN_DOOR - 1.6, HD.rowB2, RAMEN_DOOR + 1.6, HD.road.y0 + 0.4),
    label: { x: RAMEN_DOOR - 1.2, y: HD.rowB2 - 3.4 },
  },
  {
    name: { 'zh-TW': '紅磚倉庫 · 烏賊飯餐車', 'en-US': 'Red Brick · Ikameshi Cart' },
    call: { 'zh-TW': '整隻烏賊塞滿糯米，用甜鹹的醬汁燉！坐海邊的長椅慢慢吃～', 'en-US': 'Whole squid stuffed with sticky rice, simmered in sweet soy! Eat it on a seaside bench~' },
    items: [I.ikameshi, I.shioRamen, I.ikuraDon],
    at: at(BAY_CART.x - 1.3, BAY_CART.y, BAY_CART.x + 1.3, BAY_CART.y + 1),
    label: { x: BAY_CART.x, y: BAY_CART.y - 2.9 },
  },
];
