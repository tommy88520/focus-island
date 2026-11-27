// 吉隆坡（馬來西亞，獨立地圖；馬來西亞只有這一站，車站只能搭飛機回台灣）：
// 北邊天際線是雙子星塔（主角，晚上整座亮白光）和山丘上的吉隆坡塔；塔前是 KLCC 公園的湖和噴水池，湖邊長椅面向雙子星塔；
// 公園西邊是吉隆坡中央車站（KL Sentral），東邊是佳密清真寺（紅磚白帶、白色洋蔥圓頂、宣禮塔）；
// 過了馬路，西南是獨立廣場（蘇丹阿都沙末大廈的紅磚和銅色圓頂、鐘樓，草地上的超高旗桿），東南是亞羅街夜市（紅燈籠、沙爹、椰漿飯、拉茶、榴槤、塑膠桌椅）。
// 座標單位是格（1 格 = 16px），y 往下。
import type { CitySeat, CityShop, Rect } from './city';
import { KUALALUMPUR_ITEMS as I } from './cityItems';

export const KL = {
  W: 56,
  H: 46,
  // 北邊：吉隆坡塔（武吉納納斯山丘上）、雙子星塔
  klTower: { x: 9.5, line: 14.2 },
  towers: { x: 28, line: 15.2 },
  // KLCC 公園：湖（噴水池）、湖邊長椅
  parkY0: 15.2,
  lake: { x0: 17, y0: 17, x1: 39, y1: 20.4 },
  // 吉隆坡中央車站、佳密清真寺
  station: { x0: 1, x1: 12.5, line: 22.6 },
  mosque: { x0: 42.5, x1: 55.5, line: 23 },
  road: { y0: 24.6, y1: 27.2 },
  // 獨立廣場：蘇丹阿都沙末大廈、草地、旗桿
  sas: { x0: 1, x1: 22, line: 34 },
  padangY0: 34.6,
  flag: { x: 18.6, y: 41.2 },
  // 亞羅街：店屋、攤子、桌子
  alor: { x0: 25, x1: 56 },
  houseLine: 31.4,
  stallY: 33.6,
  stalls: [29, 36, 43, 50.5],
  southY: 44.2,
} as const;

// 座位（12 個，順序 = 座位編號 549–560，不要調換）：
// 亞羅街三張塑膠桌（各 2 位，面向下）、KLCC 公園湖邊三張長椅（各 2 位，面向上看雙子星塔）
export const ALOR_TABLES = [31.5, 39, 46.5];
export const ALOR_TABLE_Y = 39.4;
// 只是裝飾的桌椅（不是座位）：亞羅街晚上整條街都擺滿塑膠桌椅
export const ALOR_DECOR_TABLES = [27.5, 35.25, 42.75, 50.5];
export const PARK_BENCHES = [21, 28, 35];
export const PARK_BENCH_Y = 22.4;

const pair = (xs: number[], y: number, facing: CitySeat['facing']): CitySeat[] =>
  xs.flatMap((x): CitySeat[] => [
    { x: x - 0.6, y, facing },
    { x: x + 0.6, y, facing },
  ]);

export const KL_SEATS: CitySeat[] = [...pair(ALOR_TABLES, ALOR_TABLE_Y - 0.7, 'down'), ...pair(PARK_BENCHES, PARK_BENCH_Y, 'up')];

const at = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
type Text2 = { 'zh-TW': string; 'en-US': string };
export type StallKind = 'satay' | 'nasi' | 'tarik' | 'durian';
export const ALOR_STALLS: { x: number; kind: StallKind; sign: string; awning: string; shop: { name: Text2; call: Text2; items: (typeof I)[keyof typeof I][] } }[] = [
  { x: KL.stalls[0], kind: 'satay', sign: 'SATAY 沙爹', awning: '#c8102e', shop: { name: { 'zh-TW': '炭烤沙爹', 'en-US': 'Charcoal Satay' }, call: { 'zh-TW': '雞肉、牛肉沙爹，沾花生醬最對味！', 'en-US': 'Chicken and beef satay — dip it in peanut sauce!' }, items: [I.satay] } },
  { x: KL.stalls[1], kind: 'nasi', sign: 'NASI LEMAK', awning: '#2a8a4a', shop: { name: { 'zh-TW': '椰漿飯', 'en-US': 'Nasi Lemak' }, call: { 'zh-TW': '椰奶香飯配參巴辣醬、江魚仔、花生和蛋！', 'en-US': 'Coconut rice with sambal, anchovies, peanuts and egg!' }, items: [I.nasiLemak] } },
  { x: KL.stalls[2], kind: 'tarik', sign: 'TEH TARIK', awning: '#e0a020', shop: { name: { 'zh-TW': '嘛嘛檔拉茶', 'en-US': 'Mamak Teh Tarik' }, call: { 'zh-TW': '拉得越高，泡泡越綿！來一杯拉茶？', 'en-US': 'The higher the pull, the frothier the tea! One teh tarik?' }, items: [I.tehTarik] } },
  { x: KL.stalls[3], kind: 'durian', sign: 'DURIAN 榴槤', awning: '#6a8a1a', shop: { name: { 'zh-TW': '榴槤攤', 'en-US': 'Durian Stall' }, call: { 'zh-TW': '貓山王！果肉金黃又綿密，聞了就停不下來！', 'en-US': 'Musang King! Golden, creamy — you can smell it from here!' }, items: [I.durian] } },
];

export const KL_SHOPS: CityShop[] = ALOR_STALLS.map((s, i): CityShop => ({ name: s.shop.name, call: s.shop.call, items: s.shop.items, at: at(s.x - 1.5, KL.stallY, s.x + 1.5, KL.stallY + 1.1), label: { x: s.x, y: KL.stallY + (i % 2 ? 2.5 : 1.4) } }));
