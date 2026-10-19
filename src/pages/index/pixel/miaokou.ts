// 基隆廟口夜市（獨立地圖，搭捷運過來）：仁三路中間一整排攤位（上面掛著一排黃色燈籠招牌），
// 北邊是老街屋（李鵠餅店、連珍糕餅可以進去買），東邊盡頭是奠濟宮（可以求籤），南邊是基隆港。
// 座標單位是格（1 格 = 16px），y 往下。
// 新增小吃要先加進後端 allowedShopItems（位置訊息會帶手上拿的東西），不然整則位置會被丟掉
import type { ShopItem } from './pixelWorld';

export type StallFood = 'sandwich' | 'fry' | 'soup' | 'ice' | 'grill' | 'rice' | 'griddle' | 'crab';

export interface MiaokouStall {
  // 黃色燈籠上的攤號（只寫有把握的）
  no?: string;
  name: { 'zh-TW': string; 'en-US': string };
  call: { 'zh-TW': string; 'en-US': string };
  food: StallFood;
  items: ShopItem[];
}

export const MIAOKOU_STALLS: MiaokouStall[] = [
  {
    no: '58',
    name: { 'zh-TW': '營養三明治', 'en-US': 'Nutrition Sandwich' },
    call: { 'zh-TW': '營養三明治，剛炸好的麵包！', 'en-US': 'Fresh fried sandwich buns!' },
    food: 'sandwich',
    items: [{ id: 'nutritionSandwich', emoji: '🥪', price: 60, name: { 'zh-TW': '營養三明治（炸麵包夾滷蛋、火腿、番茄）', 'en-US': 'Nutrition sandwich (fried bun, egg, ham, tomato)' } }],
  },
  {
    no: '16',
    name: { 'zh-TW': '天婦羅', 'en-US': 'Tempura' },
    call: { 'zh-TW': '天婦羅現炸，配小黃瓜！', 'en-US': 'Fresh tempura with cucumber!' },
    food: 'fry',
    items: [{ id: 'tempura', emoji: '🍥', price: 50, name: { 'zh-TW': '天婦羅（甜辣醬、小黃瓜）', 'en-US': 'Keelung tempura (sweet chili, cucumber)' } }],
  },
  {
    no: '27-1',
    name: { 'zh-TW': '鼎邊趖', 'en-US': 'Ding Bian Cuo' },
    call: { 'zh-TW': '鼎邊趖，湯頭熬了一整天！', 'en-US': 'Ding bian cuo, broth simmered all day!' },
    food: 'soup',
    items: [{ id: 'dingBianCuo', emoji: '🍜', price: 65, name: { 'zh-TW': '鼎邊趖', 'en-US': 'Ding bian cuo (rice noodle soup)' } }],
  },
  {
    no: '41',
    name: { 'zh-TW': '泡泡冰', 'en-US': 'Bubble Ice' },
    call: { 'zh-TW': '花生泡泡冰，綿綿的！', 'en-US': 'Fluffy peanut bubble ice!' },
    food: 'ice',
    items: [{ id: 'bubbleIce', emoji: '🍨', price: 45, name: { 'zh-TW': '花生泡泡冰', 'en-US': 'Peanut bubble ice' } }],
  },
  {
    name: { 'zh-TW': '一口吃香腸', 'en-US': 'Bite-size Sausage' },
    call: { 'zh-TW': '一口吃香腸，一口一個剛剛好！', 'en-US': 'Bite-size sausages, one per bite!' },
    food: 'grill',
    items: [{ id: 'miniSausage', emoji: '🌭', price: 40, name: { 'zh-TW': '一口吃香腸', 'en-US': 'Bite-size sausages' } }],
  },
  {
    name: { 'zh-TW': '紅燒鰻羹', 'en-US': 'Braised Eel Soup' },
    call: { 'zh-TW': '紅燒鰻羹，酸酸甜甜！', 'en-US': 'Sweet and sour eel soup!' },
    food: 'soup',
    items: [{ id: 'eelSoup', emoji: '🥣', price: 65, name: { 'zh-TW': '紅燒鰻羹', 'en-US': 'Braised eel thick soup' } }],
  },
  {
    name: { 'zh-TW': '豆簽羹', 'en-US': 'Douqian Soup' },
    call: { 'zh-TW': '豆簽羹，加蝦仁！', 'en-US': 'Bean noodle soup with shrimp!' },
    food: 'soup',
    items: [{ id: 'douqianSoup', emoji: '🍲', price: 60, name: { 'zh-TW': '豆簽羹', 'en-US': 'Bean noodle thick soup' } }],
  },
  {
    name: { 'zh-TW': '滷肉飯', 'en-US': 'Braised Pork Rice' },
    call: { 'zh-TW': '滷肉飯，肥瘦剛好！', 'en-US': 'Braised pork rice, perfect fat ratio!' },
    food: 'rice',
    items: [{ id: 'braisedPorkRice', emoji: '🍚', price: 40, name: { 'zh-TW': '滷肉飯', 'en-US': 'Braised pork rice' } }],
  },
  {
    name: { 'zh-TW': '蚵仔煎', 'en-US': 'Oyster Omelette' },
    call: { 'zh-TW': '蚵仔煎，蚵仔超大顆！', 'en-US': 'Oyster omelette, huge oysters!' },
    food: 'griddle',
    items: [{ id: 'oyster', emoji: '🍳', price: 55, name: { 'zh-TW': '蚵仔煎', 'en-US': 'Oyster omelette' } }],
  },
  {
    name: { 'zh-TW': '咖哩飯', 'en-US': 'Curry Rice' },
    call: { 'zh-TW': '咖哩飯，老味道！', 'en-US': 'Old-school curry rice!' },
    food: 'rice',
    items: [{ id: 'curryRice', emoji: '🍛', price: 70, name: { 'zh-TW': '咖哩飯', 'en-US': 'Curry rice' } }],
  },
  {
    name: { 'zh-TW': '奶油螃蟹', 'en-US': 'Butter Crab' },
    call: { 'zh-TW': '奶油螃蟹，基隆港新鮮直送！', 'en-US': 'Butter crab, fresh from the harbor!' },
    food: 'crab',
    items: [{ id: 'butterCrab', emoji: '🦀', price: 120, name: { 'zh-TW': '奶油螃蟹', 'en-US': 'Butter crab' } }],
  },
  {
    name: { 'zh-TW': '臭豆腐', 'en-US': 'Stinky Tofu' },
    call: { 'zh-TW': '酥炸臭豆腐，泡菜免費加！', 'en-US': 'Crispy stinky tofu, free kimchi!' },
    food: 'fry',
    items: [{ id: 'tofu', emoji: '🍢', price: 35, name: { 'zh-TW': '酥炸臭豆腐', 'en-US': 'Crispy stinky tofu' } }],
  },
];

// 北邊老街屋裡可以進去買的店
export const MIAOKOU_SHOPS: { name: { 'zh-TW': string; 'en-US': string }; call: { 'zh-TW': string; 'en-US': string }; sign: string; items: ShopItem[] }[] = [
  {
    name: { 'zh-TW': '李鵠餅店', 'en-US': 'Li Hu Bakery' },
    call: { 'zh-TW': '綠豆椪、鳳梨酥，伴手禮首選！', 'en-US': 'Mung bean cakes and pineapple cakes!' },
    sign: '李鵠餅店',
    items: [
      { id: 'mungBeanCake', emoji: '🥮', price: 55, name: { 'zh-TW': '綠豆椪', 'en-US': 'Mung bean cake' } },
      { id: 'pineappleCake', emoji: '🍍', price: 50, name: { 'zh-TW': '鳳梨酥', 'en-US': 'Pineapple cake' } },
    ],
  },
  {
    name: { 'zh-TW': '連珍糕餅', 'en-US': 'Lian Zhen Bakery' },
    call: { 'zh-TW': '芋泥球，Q 彈綿密！', 'en-US': 'Taro mochi balls, chewy and smooth!' },
    sign: '連珍',
    items: [{ id: 'taroMochi', emoji: '🍡', price: 45, name: { 'zh-TW': '芋泥球', 'en-US': 'Taro mochi ball' } }],
  },
];

export const MIAOKOU_ITEMS: ShopItem[] = [...MIAOKOU_STALLS.flatMap((s) => s.items), ...MIAOKOU_SHOPS.flatMap((s) => s.items)];

// ── 場地 ──
export const MK = {
  W: 48,
  H: 30,
  // 北邊老街屋的地面線（騎樓在下面），南邊是攤位那一排的上緣
  shopLine: 7,
  stallTop: 9.8,
  counterY: 12.2,
  // 攤位：x 起點、每攤寬度
  stallX0: 2.6,
  stallW: 2.7,
  // 東邊的奠濟宮（正面朝南）、廟埕、香爐
  temple: { x0: 37, y0: 3, x1: 47, y1: 10.5 },
  plaza: { x0: 35.6, y0: 10.5, x1: 48, y1: 17.3 },
  burner: { x: 42, y: 13.2 },
  // 南邊：愛三路、港邊步道、海（基隆港）、KEELUNG 山
  roadY: 17.8,
  promenadeY: 20.6,
  waterY: 24.6,
  hill: { x0: 34, y0: 23.6, x1: 48, y1: 30 },
  station: { x0: 1.5, y0: 20.8, x1: 5.9, y1: 22.8 },
  // 街口的「基隆廟口」大招牌、廟埕的石獅和金爐、拿香拜拜的人
  gateSign: { x0: 0.8, x1: 4.6, y: 17.2 },
  lions: [38.6, 45.4],
  furnace: { x: 46.6, y: 13.6 },
  worshippers: [
    { x: 40.6, y: 12.6 },
    { x: 43.5, y: 12.4 },
  ],
  // 北邊兩間店的門口（x 範圍）
  shopDoors: [
    { x0: 5, x1: 10.5 },
    { x0: 13.5, x1: 18.5 },
  ],
} as const;

export function stallCenter(i: number): number {
  return MK.stallX0 + MK.stallW * i + MK.stallW / 2;
}

// 座位：前六攤前面各兩張小板凳（面向攤位吃東西）＋廟埕兩張長椅（面向廟）。順序 = 座位編號，不要調換
export const MIAOKOU_SEATS: { x: number; y: number; facing: 'up' | 'down' }[] = [
  ...[0, 1, 2, 3, 4, 5].flatMap((i) => [
    { x: stallCenter(i) - 0.6, y: MK.counterY + 1.15, facing: 'up' as const },
    { x: stallCenter(i) + 0.6, y: MK.counterY + 1.15, facing: 'up' as const },
  ]),
  { x: 38.9, y: 16.6, facing: 'up' },
  { x: 40.1, y: 16.6, facing: 'up' },
  { x: 43.9, y: 16.6, facing: 'up' },
  { x: 45.1, y: 16.6, facing: 'up' },
];
