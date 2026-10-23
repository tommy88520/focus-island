// 台灣各城市的指標地圖（獨立地圖，從台北車站搭高鐵／台鐵過去）：每個城市一張，共用 CityScene.vue。
// 這裡只放型別和城市的順序（pixelMap 也會讀，所以不要 import 美術）；各城市的資料、美術在 cities.ts 註冊。
// 座標單位是格（1 格 = 16px），y 往下。
import type { ShopItem } from './pixelWorld';
import type { SoundscapeKind } from 'src/pages/index/composables/synthAmbience';

// 城市的順序 = 座位編號的順序（每個城市 CITY_SEAT_COUNT 位，接在主地圖四四南村 188 號後面）：只能加在最後面，不能調換
// 也是獨立地圖的 scene id（跟後端 allowedScenes 對好）
export const CITY_ORDER = ['tainan'] as const;
export type CityId = (typeof CITY_ORDER)[number];
export const CITY_SEAT_COUNT = 12;

export function isCityId(value: unknown): value is CityId {
  return typeof value === 'string' && (CITY_ORDER as readonly string[]).includes(value);
}

export type Facing = 'up' | 'down' | 'left' | 'right';
export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}
export interface Text2 {
  'zh-TW': string;
  'en-US': string;
}

export interface DrawCtx {
  seconds: number;
  // 晚上（台灣時間 18 點到清晨 5 點）：燈會亮
  night: boolean;
}

// 跟著 y 排序畫的東西（建築、樹、攤車…）：y 是它的地面線，人走到它後面就會被擋住
export interface CityProp {
  y: number;
  draw: (c: CanvasRenderingContext2D, d: DrawCtx) => void;
}

export interface CitySeat {
  x: number;
  y: number;
  facing: Facing;
}

// 站進 at 這塊就跳出買東西的面板
export interface CityShop {
  name: Text2;
  call: Text2;
  items: ShopItem[];
  at: Rect;
  // 名牌畫在哪（預設 at 的中間上方）
  label?: { x: number; y: number };
}

// 走到 at 這塊按 E／點名牌：抽籤（廟、孔廟）
export interface CityFortune {
  at: Rect;
  label: { x: number; y: number };
  title: Text2;
  hint: Text2;
  draw: Text2;
  again: Text2;
  fortunes: { rank: Text2; text: Text2 }[];
}

// 地標介紹：點地標（at）或站在旁邊按 E，跳出一張小卡
export interface CityInfo {
  at: Rect;
  title: Text2;
  text: Text2;
}

export interface CityLabel {
  x: number;
  y: number;
  text: Text2;
  color: string;
}

// 路人：沿著線段來回走（用時間算的裝飾，每個人看到的一樣）
export interface CityWalkLane {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  count: number;
}

// 馬路上的車（裝飾）：橫的車道，dir 1 往東、-1 往西
export interface CityTraffic {
  y: number;
  dir: 1 | -1;
  x0: number;
  x1: number;
  count: number;
}

export interface CityDef {
  id: CityId;
  W: number;
  H: number;
  // 過場、地圖名稱：「臺南 · 孔廟」；台北車站路線圖上的站名、圖示
  title: Text2;
  stop: Text2;
  emoji: string;
  // 搭車的地方：站到這點旁邊跳出「要去哪裡」；剛到的人站在 arrive
  station: { x: number; y: number; name: Text2; arrive: { x: number; y: number } };
  background: string;
  soundscape: SoundscapeKind;
  paintGround: (c: CanvasRenderingContext2D) => void;
  props: CityProp[];
  // 擋路的格子（建築、牆、水池…）；複雜的形狀另外用 blocked
  solid: Rect[];
  blocked?: (x: number, y: number) => boolean;
  // 剛好 CITY_SEAT_COUNT 個，順序 = 座位編號
  seats: CitySeat[];
  // 座位的家具：人畫在 back 之後、front 之前（背對畫面坐的椅背畫在 front）
  drawSeat: (c: CanvasRenderingContext2D, i: number, d: DrawCtx) => void;
  drawSeatFront?: (c: CanvasRenderingContext2D, i: number, d: DrawCtx) => void;
  shops: CityShop[];
  fortune?: CityFortune;
  infos: CityInfo[];
  labels: CityLabel[];
  walkers: CityWalkLane[];
  traffic: CityTraffic[];
  // 晚上會亮的燈（世界座標 px）
  lights: { x: number; y: number; r: number; color?: string }[];
  hintDesktop: Text2;
  hintTouch: Text2;
}
