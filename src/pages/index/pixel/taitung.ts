// 台東（獨立地圖，從台北車站搭台鐵過來）：北邊遠遠的是中央山脈，天上飄著熱氣球；山腳下是舊台東車站（鐵道藝術村），
// 舊鐵軌上停著藍皮列車；中間西半部是鐵花村（小舞台、樹上掛滿熱氣球燈籠），東半部是夜市（米苔目、豬血湯、釋迦、池上便當）；
// 過了新生路，南邊是海濱公園（椰子樹、國際地標）、沙灘和太平洋。台東轉運站在鐵花村旁邊。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { TAITUNG_ITEMS as I } from './cityItems';

export const TD = {
  W: 56,
  H: 38,
  // 北邊：舊台東車站的地面線、月台、舊鐵軌
  stationLine: 7.2,
  oldStation: { x0: 30, x1: 42 },
  rail: { y0: 9, y1: 10.4 },
  // 停在西邊鐵軌上的藍皮列車（擋路）
  parked: { x0: 2, x1: 25 },
  // 鐵花村（西）、夜市（東）
  village: { x1: 27, y0: 11.2, y1: 22.4 },
  stage: { x0: 6, x1: 18, line: 14.4 },
  market: { x0: 27.6 },
  cartY: 15.4,
  // 新生路、海濱公園、沙灘、海
  road: { y0: 22.6, y1: 24.8 },
  sand: 30.8,
  sea: 33.4,
  // 國際地標（白色鋼構的大拱）
  landmark: { cx: 41, line: 30.4 },
  // 台東轉運站（公車站，就是這張地圖的車站）
  busStop: { x: 5, y: 27.6 },
} as const;

// 座位（12 個，順序 = 座位編號 309–320，不要調換）：
// 舊台東車站月台的兩張長椅（面向畫面，各 2 位）、鐵花村舞台前兩張木頭長椅（背對畫面看舞台，各 2 位）、海濱公園兩張長椅（面向大海，各 2 位）
export const PLATFORM_BENCHES = [33.4, 38.6];
export const PLATFORM_Y = 8.4;
export const STAGE_BENCHES = [9, 15];
export const STAGE_BENCH_Y = 18.4;
export const BEACH_BENCHES = [24, 31];
export const BEACH_BENCH_Y = 30.4;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const TAITUNG_SEATS: CitySeat[] = [...pair(PLATFORM_BENCHES, PLATFORM_Y, 'down'), ...pair(STAGE_BENCHES, STAGE_BENCH_Y, 'up'), ...pair(BEACH_BENCHES, BEACH_BENCH_Y, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

type Text2 = { 'zh-TW': string; 'en-US': string };
// 夜市的攤車（x 是檯面中間）：有 shop 的可以買，其他是裝飾
export const MARKET_CARTS: { x: number; name: string; awning: string; food: string[]; shop?: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: 30.6, name: '米苔目', awning: '#2a7a46', food: ['#f4ead2', '#e8d5a8', '#f4ead2'], shop: { name: { 'zh-TW': '榕樹下米苔目', 'en-US': 'Mi-tai-mu Noodles' }, call: { 'zh-TW': '米苔目湯，加一顆滷蛋！', 'en-US': 'Rice noodle soup — add a braised egg!' }, items: [I.mitaimu] } },
  { x: 35, name: '豬血湯', awning: '#c62828', food: ['#6a2a2a', '#7ab86a', '#6a2a2a'], shop: { name: { 'zh-TW': '卑南豬血湯', 'en-US': 'Beinan Pig Blood Soup' }, call: { 'zh-TW': '豬血湯，韭菜酸菜自己加！', 'en-US': 'Pig blood soup — help yourself to chives!' }, items: [I.pigBloodSoup] } },
  { x: 39.4, name: '烤玉米', awning: '#d97a1a', food: ['#f6c945', '#c98a3c', '#f6c945'] },
  { x: 43.8, name: '釋迦', awning: '#4f8a3c', food: ['#9ccc72', '#8cc46a', '#9ccc72'], shop: { name: { 'zh-TW': '台東釋迦', 'en-US': 'Taitung Sugar Apple' }, call: { 'zh-TW': '台東釋迦，熟了軟軟甜甜！', 'en-US': 'Taitung sugar apples — soft and sweet!' }, items: [I.custardApple] } },
  { x: 48.2, name: '池上便當', awning: '#8a5a32', food: ['#f4f1e8', '#c98a3c', '#7ab86a'], shop: { name: { 'zh-TW': '池上便當', 'en-US': 'Chishang Bento' }, call: { 'zh-TW': '池上米做的便當，熱騰騰的！', 'en-US': 'Bento made with Chishang rice — piping hot!' }, items: [I.chishangBento] } },
  { x: 52.6, name: '原住民烤肉', awning: '#8a3aa8', food: ['#8a4a2a', '#b5704a', '#8a4a2a'] },
];

export const TAITUNG_SHOPS: CityShop[] = MARKET_CARTS.flatMap((s): CityShop[] =>
  s.shop ? [{ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.3, TD.cartY, s.x + 1.3, TD.cartY + 1), label: { x: s.x, y: TD.cartY - 2.7 } }] : [],
);
