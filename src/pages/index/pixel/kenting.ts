// 墾丁（獨立地圖，從台北車站搭高鐵到左營、轉墾丁快線過來）：北邊遠遠的是大尖山和墾丁牧場；
// 中間是墾丁大街（北邊一排衝浪店、民宿，南邊人行道晚上變夜市：飛魚卵香腸、椰子水、碳烤魷魚、芒果冰）；
// 南邊是小灣沙灘（遮陽傘躺椅、木頭觀景台）、海上的衝浪客和香蕉船，東南的海角上是鵝鑾鼻燈塔，海裡是船帆石。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { KENTING_ITEMS as I } from './cityItems';

export const KT = {
  W: 56,
  H: 38,
  // 北邊大街店面的地面線、墾丁大街（屏鵝公路）
  shopLine: 10.6,
  road: { y0: 11.2, y1: 13.4 },
  // 南邊人行道上的夜市
  market: { x0: 13.6, x1: 41 },
  cartY: 16.4,
  // 沙灘、海
  sand: 21.2,
  sea: 29.4,
  // 西邊的木頭觀景台
  deck: { x0: 1, x1: 13, y0: 22.4, y1: 28 },
  // 東南的海角（礁岩＋草）和鵝鑾鼻燈塔、海裡的船帆石
  cape: { x0: 46.5 },
  lighthouse: { x: 51.6, y: 30.6 },
  sailRock: { x: 35.4, y: 33.2 },
  // 墾丁快線的站牌（就是這張地圖的車站）
  busStop: { x: 5.4, y: 16.4 },
} as const;

// 座位（12 個，順序 = 座位編號 321–332，不要調換）：
// 觀景台兩張長椅（面向大海，各 2 位）、沙灘兩支遮陽傘下的躺椅（各 2 位，面向大海）、大街夜市兩張桌子（各 2 位）
export const DECK_BENCHES = [4.4, 9.6];
export const DECK_BENCH_Y = 25.6;
export const UMBRELLAS = [21.4, 29.4];
export const LOUNGER_Y = 25.8;
export const MARKET_TABLES = [21.4, 33.4];
export const TABLE_Y = 19.8;

const pair = (xs: number[], y: number, facing: CitySeat['facing'], gap = 0.6): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - gap, y, facing },
    { x: x + gap, y, facing },
  ]);

export const KENTING_SEATS: CitySeat[] = [...pair(DECK_BENCHES, DECK_BENCH_Y, 'down'), ...pair(UMBRELLAS, LOUNGER_Y, 'down', 1), ...pair(MARKET_TABLES, TABLE_Y - 0.7, 'down')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });

type Text2 = { 'zh-TW': string; 'en-US': string };
export const MARKET_CARTS: { x: number; name: string; awning: string; food: string[]; shop?: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: 15.6, name: '飛魚卵香腸', awning: '#c62828', food: ['#b5553f', '#f6c945', '#b5553f'], shop: { name: { 'zh-TW': '飛魚卵香腸', 'en-US': 'Flying-fish Roe Sausage' }, call: { 'zh-TW': '飛魚卵香腸，一咬卵就爆開！', 'en-US': 'Flying-fish roe sausage — the roe pops when you bite!' }, items: [I.flyingFishSausage] } },
  { x: 20, name: '椰子水', awning: '#2a9a5a', food: ['#6aa84a', '#6aa84a', '#6aa84a'], shop: { name: { 'zh-TW': '現剖椰子', 'en-US': 'Fresh Coconut' }, call: { 'zh-TW': '冰椰子，現剖插吸管！', 'en-US': 'Iced coconuts, cracked open on the spot!' }, items: [I.coconut] } },
  { x: 24.4, name: '烤玉米', awning: '#d97a1a', food: ['#f6c945', '#c98a3c', '#f6c945'] },
  { x: 28.8, name: '碳烤魷魚', awning: '#e8641c', food: ['#d97a3a', '#d97a3a', '#d97a3a'], shop: { name: { 'zh-TW': '碳烤魷魚', 'en-US': 'Grilled Squid' }, call: { 'zh-TW': '整隻魷魚碳烤，刷醬！', 'en-US': 'Whole squid on the charcoal, glazed!' }, items: [I.grilledSquid] } },
  { x: 33.2, name: '芒果冰', awning: '#f6a21a', food: ['#f6c945', '#ff9a3a', '#f6c945'], shop: { name: { 'zh-TW': '芒果冰', 'en-US': 'Mango Ice' }, call: { 'zh-TW': '屏東芒果，滿滿一大碗！', 'en-US': 'Pingtung mangoes, a heaping bowl!' }, items: [I.mangoIce] } },
  { x: 37.6, name: '恆春洋蔥', awning: '#8a3aa8', food: ['#e8d0e8', '#c9a8d6', '#e8d0e8'] },
];

export const KENTING_SHOPS: CityShop[] = MARKET_CARTS.flatMap((s): CityShop[] =>
  s.shop ? [{ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.3, KT.cartY, s.x + 1.3, KT.cartY + 1), label: { x: s.x, y: KT.cartY - 2.7 } }] : [],
);
