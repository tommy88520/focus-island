// 首爾（韓國，獨立地圖；韓國只有這一個城市，車站只能搭飛機回台灣）：
// 北邊是北岳山和景福宮（光化門、門前的守門將換崗儀式），東北邊是北村韓屋村（黑瓦白牆、石坡道、木頭平台 평상 可以坐）；
// 中間一條大馬路，過了馬路是往下沉的清溪川（石頭踏腳石、溪邊石階可以坐，西邊是清溪廣場）；
// 南邊是明洞（霓虹看板、一排小吃攤車、小桌），東南邊是舊首爾驛（紅磚、綠色圓頂）。遠方山上是 N 首爾塔。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { SEOUL_ITEMS as I } from './cityItems';

export const SE = {
  W: 56,
  H: 44,
  // 景福宮：宮牆／光化門的地面線，光化門左右
  palaceLine: 11,
  palaceX1: 31.4,
  gate: { x0: 11, x1: 21 },
  // 北村：兩排韓屋（地面線）、中間的石坡道
  bukchonX0: 32,
  rowA: 7.4,
  rowB: 11.4,
  stair: { x0: 43, x1: 46 },
  // 馬路
  road: { y0: 16.4, y1: 19.4 },
  // 清溪川：北邊的石牆、北岸步道、水、南岸步道、南邊的石牆；西邊是清溪廣場（x0 以西）
  stream: { x0: 7.5, wall: 20.4, walk0: 21.4, water0: 23, water1: 25, walk1: 26.2, top: 27 },
  // 下到溪邊的石階、踏腳石、南岸上去明洞的石階
  stairsDown: [{ x0: 12, x1: 14.5 }, { x0: 49, x1: 51.5 }],
  stones: [{ x0: 24, x1: 25.4 }, { x0: 41.5, x1: 42.9 }],
  stairsUp: { x0: 38.6, x1: 40.4 },
  // 明洞：北邊一排店（地面線）、攤車、桌子；東邊是首爾站
  mdLine: 33.4,
  mdX0: 7.5,
  mdX1: 38.6,
  cartY: 37.4,
  carts: [10, 16, 22, 28, 34],
  station: { x0: 40.4, x1: 55.6 },
  bottom: 43.2,
} as const;

// 座位（12 個，順序 = 座位編號 477–488，不要調換）：
// 清溪川北岸兩塊石階（面向溪水，各 2 位）、北村韓屋前兩張木頭平台 평상（各 2 位）、明洞兩張小桌（各 2 位）
export const STREAM_STEPS = [19, 33];
export const STREAM_STEP_Y = 22.7;
export const PYEONGSANG = [37.6, 52];
export const PYEONGSANG_Y = 14.4;
export const MD_TABLES = [15, 27];
export const MD_TABLE_Y = 41.4;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const SEOUL_SEATS: CitySeat[] = [...pair(STREAM_STEPS, STREAM_STEP_Y, 'down'), ...pair(PYEONGSANG, PYEONGSANG_Y, 'down'), ...pair(MD_TABLES, MD_TABLE_Y - 0.7, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
type Text2 = { 'zh-TW': string; 'en-US': string };
// 明洞的攤車（韓文招牌）：有 shop 的才賣東西
export const MD_CARTS: { x: number; name: string; awning: string; food: string[]; shop?: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: SE.carts[0], name: '떡볶이', awning: '#d8262a', food: ['#e0402a', '#f4efe2', '#e0402a'], shop: { name: { 'zh-TW': '辣炒年糕', 'en-US': 'Tteokbokki' }, call: { 'zh-TW': '紅通通的辣炒年糕，又Q又辣！', 'en-US': 'Chewy, fiery tteokbokki — come try!' }, items: [I.tteokbokki] } },
  { x: SE.carts[1], name: '호떡', awning: '#e07a1f', food: ['#c98a3c', '#b5763a', '#c98a3c'], shop: { name: { 'zh-TW': '黑糖糖餅', 'en-US': 'Hotteok' }, call: { 'zh-TW': '剛煎好的糖餅，小心黑糖燙口！', 'en-US': 'Hot off the griddle — mind the molten sugar!' }, items: [I.hotteok] } },
  { x: SE.carts[2], name: '회오리감자', awning: '#2f6fb0', food: ['#e8b830', '#e8b830', '#e8b830'] },
  { x: SE.carts[3], name: '계란빵', awning: '#e8b830', food: ['#f0c860', '#f8e8a8', '#f0c860'], shop: { name: { 'zh-TW': '雞蛋糕', 'en-US': 'Gyeranppang' }, call: { 'zh-TW': '整顆蛋烤進麵包裡，熱呼呼的雞蛋糕！', 'en-US': 'A whole egg baked into sweet bread — piping hot!' }, items: [I.gyeranppang] } },
  { x: SE.carts[4], name: '어묵', awning: '#2a8a6a', food: ['#e8c88a', '#d8b070', '#e8c88a'], shop: { name: { 'zh-TW': '魚板串', 'en-US': 'Eomuk' }, call: { 'zh-TW': '魚板串配熱湯，冬天最暖！', 'en-US': 'Fishcake skewers with hot broth — perfect for winter!' }, items: [I.eomuk] } },
];

export const SEOUL_SHOPS: CityShop[] = MD_CARTS.flatMap((s): CityShop[] =>
  s.shop ? [{ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.3, SE.cartY, s.x + 1.3, SE.cartY + 1), label: { x: s.x, y: SE.cartY - 2.9 } }] : [],
);
