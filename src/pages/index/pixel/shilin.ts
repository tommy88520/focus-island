// 士林夜市（獨立地圖，從主地圖的夜市捷運站搭過來）：北邊一排街屋（豪大大雞排、辛發亭可以進去買）、
// 街屋前面一整排攤位（中間留一條路進騎樓）、東邊慈諴宮的廟埕有撈金魚和射氣球、南邊是士林市場和吃東西的折疊桌，
// 再往南過基河路就是劍潭站，東南邊是基隆河和對岸的圓山大飯店。
// 座標單位是格（1 格 = 16px），y 往下。
// 新增小吃要先加進後端 allowedShopItems（位置訊息會帶手上拿的東西），不然整則位置會被丟掉
import type { ShopItem } from './pixelWorld';

export type ShilinFood = 'sausage' | 'pancake' | 'bun' | 'frog' | 'taroIce' | 'oyster' | 'tofu' | 'fried' | 'tea' | 'icecream' | 'taroBall' | 'squid';

export interface ShilinStall {
  name: { 'zh-TW': string; 'en-US': string };
  call: { 'zh-TW': string; 'en-US': string };
  food: ShilinFood;
  // 燈箱招牌的底色、字色
  sign: [string, string];
  items: ShopItem[];
}

export const SHILIN_STALLS: ShilinStall[] = [
  {
    name: { 'zh-TW': '士林大香腸', 'en-US': 'Shilin Sausage' },
    call: { 'zh-TW': '大香腸剛烤好，配蒜頭！', 'en-US': 'Big sausages, fresh off the grill!' },
    food: 'sausage',
    sign: ['#d72d2d', '#ffffff'],
    items: [
      { id: 'sausage', emoji: '🌭', price: 30, name: { 'zh-TW': '烤香腸配大蒜', 'en-US': 'Grilled sausage with garlic' } },
      { id: 'bigSausage', emoji: '🥖', price: 50, name: { 'zh-TW': '大腸包小腸', 'en-US': 'Sausage in sticky-rice sausage' } },
      { id: 'corn', emoji: '🌽', price: 40, name: { 'zh-TW': '烤玉米', 'en-US': 'Grilled corn' } },
    ],
  },
  {
    name: { 'zh-TW': '大餅包小餅', 'en-US': 'Big Cake Wraps Small Cake' },
    call: { 'zh-TW': '大餅包小餅，酥酥脆脆！', 'en-US': 'Crispy cake wrapped in a soft one!' },
    food: 'pancake',
    sign: ['#ffffff', '#d72d2d'],
    items: [{ id: 'bigPancake', emoji: '🌯', price: 50, name: { 'zh-TW': '大餅包小餅（紅豆、芝麻）', 'en-US': 'Big cake wraps small cake' } }],
  },
  {
    name: { 'zh-TW': '上海生煎包', 'en-US': 'Shanghai Pan-fried Buns' },
    call: { 'zh-TW': '生煎包，小心燙口喔！', 'en-US': 'Pan-fried buns, careful, they are hot!' },
    food: 'bun',
    sign: ['#1f6fb5', '#ffffff'],
    items: [{ id: 'shengjianbao', emoji: '🥟', price: 45, name: { 'zh-TW': '生煎包（四顆）', 'en-US': 'Pan-fried buns (4)' } }],
  },
  {
    name: { 'zh-TW': '青蛙下蛋', 'en-US': 'Frog Eggs Drink' },
    call: { 'zh-TW': '青蛙下蛋，冰涼粉圓！', 'en-US': 'Frog eggs! Icy tapioca drink!' },
    food: 'frog',
    sign: ['#2bb673', '#ffffff'],
    items: [{ id: 'frogEggs', emoji: '🐸', price: 35, name: { 'zh-TW': '青蛙下蛋（粉圓檸檬）', 'en-US': 'Frog eggs (tapioca lemon)' } }],
  },
  {
    name: { 'zh-TW': '阿宗芋冰城', 'en-US': 'Ah-Zong Taro Ice' },
    call: { 'zh-TW': '芋頭冰，綿綿的！', 'en-US': 'Creamy taro ice!' },
    food: 'taroIce',
    sign: ['#7e57c2', '#ffffff'],
    items: [{ id: 'taroIce', emoji: '🍨', price: 40, name: { 'zh-TW': '芋頭冰', 'en-US': 'Taro ice cream' } }],
  },
  {
    name: { 'zh-TW': '忠誠號蚵仔煎', 'en-US': 'Oyster Omelette' },
    call: { 'zh-TW': '蚵仔煎現煎的，蚵仔超多！', 'en-US': 'Oyster omelette, loads of oysters!' },
    food: 'oyster',
    sign: ['#f6c945', '#b71c1c'],
    items: [{ id: 'oyster', emoji: '🍳', price: 65, name: { 'zh-TW': '蚵仔煎', 'en-US': 'Oyster omelette' } }],
  },
  {
    name: { 'zh-TW': '臭豆腐', 'en-US': 'Stinky Tofu' },
    call: { 'zh-TW': '臭豆腐，泡菜加多一點！', 'en-US': 'Stinky tofu, extra kimchi!' },
    food: 'tofu',
    sign: ['#ffffff', '#2f5fa8'],
    items: [
      { id: 'tofu', emoji: '🍢', price: 35, name: { 'zh-TW': '酥炸臭豆腐', 'en-US': 'Crispy stinky tofu' } },
      { id: 'luwei', emoji: '🥘', price: 60, name: { 'zh-TW': '麻辣滷味', 'en-US': 'Spicy braised snacks' } },
    ],
  },
  {
    name: { 'zh-TW': '鹽酥雞', 'en-US': 'Popcorn Chicken' },
    call: { 'zh-TW': '鹽酥雞，九層塔多一點！', 'en-US': 'Popcorn chicken, extra basil!' },
    food: 'fried',
    sign: ['#ff8a3b', '#ffffff'],
    items: [
      { id: 'saltyChicken', emoji: '🍤', price: 50, name: { 'zh-TW': '鹽酥雞加九層塔', 'en-US': 'Popcorn chicken with basil' } },
      { id: 'sweetPotatoBall', emoji: '🍠', price: 30, name: { 'zh-TW': 'QQ 地瓜球', 'en-US': 'Chewy sweet potato balls' } },
    ],
  },
  {
    name: { 'zh-TW': '珍珠奶茶', 'en-US': 'Bubble Tea' },
    call: { 'zh-TW': '珍奶半糖少冰！', 'en-US': 'Bubble tea, half sugar!' },
    food: 'tea',
    sign: ['#3b2a20', '#f6e2b8'],
    items: [
      { id: 'boba', emoji: '🧋', price: 40, name: { 'zh-TW': '珍珠奶茶（半糖少冰）', 'en-US': 'Bubble tea (half sugar)' } },
      { id: 'papayaMilk', emoji: '🥛', price: 45, name: { 'zh-TW': '木瓜牛奶', 'en-US': 'Papaya milk' } },
      { id: 'lemonTea', emoji: '🍋', price: 35, name: { 'zh-TW': '檸檬愛玉', 'en-US': 'Lemon aiyu jelly' } },
    ],
  },
  {
    name: { 'zh-TW': '花生捲冰淇淋', 'en-US': 'Peanut Ice Cream Roll' },
    call: { 'zh-TW': '花生捲冰淇淋，加香菜嗎？', 'en-US': 'Ice cream roll! Cilantro?' },
    food: 'icecream',
    sign: ['#ff6fb5', '#ffffff'],
    items: [
      { id: 'icecreamRoll', emoji: '🍦', price: 35, name: { 'zh-TW': '花生捲冰淇淋（加香菜）', 'en-US': 'Peanut ice cream roll' } },
      { id: 'mangoIce', emoji: '🍧', price: 55, name: { 'zh-TW': '芒果雪花冰', 'en-US': 'Mango shaved snow' } },
    ],
  },
  {
    name: { 'zh-TW': '芋圓王', 'en-US': 'Taro Ball King' },
    call: { 'zh-TW': '芋圓王，冰的熱的都有～', 'en-US': 'Taro balls, hot or iced~' },
    food: 'taroBall',
    sign: ['#f2a541', '#5a2a10'],
    items: [
      { id: 'taroBall', emoji: '🍡', price: 40, name: { 'zh-TW': '綜合芋圓（冰）', 'en-US': 'Mixed taro balls (iced)' } },
      { id: 'tofuPudding', emoji: '🍮', price: 35, name: { 'zh-TW': '花生豆花', 'en-US': 'Peanut tofu pudding' } },
    ],
  },
  {
    name: { 'zh-TW': '碳烤魷魚', 'en-US': 'Grilled Squid' },
    call: { 'zh-TW': '整隻魷魚碳烤，刷醬！', 'en-US': 'Whole grilled squid, extra sauce!' },
    food: 'squid',
    sign: ['#15171f', '#ffe066'],
    items: [{ id: 'squid', emoji: '🦑', price: 80, name: { 'zh-TW': '碳烤魷魚', 'en-US': 'Grilled squid' } }],
  },
];

// 可以走進去買的店：北邊街屋的豪大大雞排、辛發亭，南邊的士林市場（地下美食區）
export interface ShilinShop {
  name: { 'zh-TW': string; 'en-US': string };
  call: { 'zh-TW': string; 'en-US': string };
  items: ShopItem[];
}
export const SHILIN_SHOPS: ShilinShop[] = [
  {
    name: { 'zh-TW': '豪大大雞排', 'en-US': 'Hot-Star Fried Chicken' },
    call: { 'zh-TW': '雞排要切不要辣？比臉還大喔！', 'en-US': 'Bigger than your face! Sliced?' },
    items: [{ id: 'chicken', emoji: '🍗', price: 80, name: { 'zh-TW': '豪大大雞排（比臉大）', 'en-US': 'Giant fried chicken cutlet' } }],
  },
  {
    name: { 'zh-TW': '辛發亭', 'en-US': 'Xin Fa Ting' },
    call: { 'zh-TW': '雪片冰，像雪一樣綿！', 'en-US': 'Snowflake ice, soft as snow!' },
    items: [{ id: 'snowIce', emoji: '🍧', price: 90, name: { 'zh-TW': '雪片冰（花生、芒果）', 'en-US': 'Snowflake ice (peanut, mango)' } }],
  },
  {
    name: { 'zh-TW': '士林市場 美食區', 'en-US': 'Shilin Market Food Court' },
    call: { 'zh-TW': '涼麵配味噌湯，麵線也有喔！', 'en-US': 'Cold noodles with miso soup!' },
    items: [
      { id: 'coldNoodles', emoji: '🍝', price: 50, name: { 'zh-TW': '好朋友涼麵＋味噌湯', 'en-US': 'Cold noodles + miso soup' } },
      { id: 'misua', emoji: '🍜', price: 50, name: { 'zh-TW': '大腸蚵仔麵線', 'en-US': 'Oyster and intestine vermicelli' } },
    ],
  },
];

// 廟埕的射氣球攤（跟小吃攤一樣用買的）
export const BALLOON_GAME: ShilinShop = {
  name: { 'zh-TW': '射氣球', 'en-US': 'Balloon Darts' },
  call: { 'zh-TW': '射中三個送娃娃喔！', 'en-US': 'Pop three, win a plushie!' },
  items: [
    { id: 'plush', emoji: '🧸', price: 50, name: { 'zh-TW': '玩一次（保證送娃娃）', 'en-US': 'One round (plushie guaranteed)' } },
    { id: 'balloon', emoji: '🎈', price: 20, name: { 'zh-TW': '買一顆氣球', 'en-US': 'A balloon' } },
  ],
};

export const SHILIN_ITEMS: ShopItem[] = [...SHILIN_STALLS.flatMap((s) => s.items), ...SHILIN_SHOPS.flatMap((s) => s.items), ...BALLOON_GAME.items];

// ── 場地 ──
export const SL = {
  W: 52,
  H: 36,
  // 北邊街屋的地面線（下面是騎樓），攤位那一排的上緣、檯面
  shopLine: 6.5,
  stallTop: 11,
  counterY: 13.4,
  // 攤位：x 起點、每攤寬度；前六攤和後六攤中間空一條路進騎樓
  stallX0: 1.2,
  stallW: 2.65,
  stallGap: 2,
  // 東北邊的慈諴宮（正面朝南）、廟埕、香爐
  temple: { x0: 38, y0: 1.5, x1: 50, y1: 8.5 },
  plaza: { x0: 36.4, y0: 8.5, x1: 52, y1: 24.2 },
  burner: { x: 44, y: 10.6 },
  // 廟埕上的撈金魚池、射氣球攤（檯面在 counterY，人站在下面）
  pool: { x0: 37.2, y0: 13.4, x1: 41.4, y1: 15.6 },
  balloon: { x0: 45.6, x1: 50.6, top: 12, counterY: 14.4 },
  // 南邊：士林市場（老市場的紅磚立面，門口通往地下美食區）、折疊桌區
  market: { x0: 1.4, y0: 19.2, x1: 15.6, y1: 24 },
  tables: [19.5, 25, 30.5],
  tableY: 20.2,
  // 基河路、人行道、劍潭站、基隆河
  roadY: 24.8,
  station: { x0: 3, y0: 30.4, x1: 17, y1: 33.4 },
  riverX: 19,
  riverY: 30.6,
  // 夜市入口的「士林觀光夜市」大招牌（兩根柱子）
  gateSign: { x0: 33.4, x1: 36.6, y: 24.1 },
  // 北邊兩間店的門口（x 範圍）
  shopDoors: [
    { x0: 8.5, x1: 14 },
    { x0: 25, x1: 29.5 },
  ],
} as const;

export function stallLeft(i: number): number {
  return SL.stallX0 + SL.stallW * i + (i >= 6 ? SL.stallGap : 0);
}
export function stallCenter(i: number): number {
  return stallLeft(i) + SL.stallW / 2;
}
export const STALL_X1 = stallLeft(SHILIN_STALLS.length - 1) + SL.stallW;
// 前六攤跟後六攤中間那條路（進騎樓用）
export const STALL_GAP_X: [number, number] = [stallLeft(5) + SL.stallW, stallLeft(6)];

export const MARKET_DOOR = { x: (SL.market.x0 + SL.market.x1) / 2, y: SL.market.y1 + 0.8 };

// 座位：三張折疊桌，每桌左右各兩張紅色塑膠椅（左邊兩張面向右、右邊兩張面向左）。
// 順序 = 座位編號 31–42（以前在主地圖上的士林夜市就是這個順序），不要調換
export const SHILIN_SEATS: { x: number; y: number; facing: 'left' | 'right' }[] = SL.tables.flatMap((cx) => [
  { x: cx - 1.05, y: SL.tableY + 0.9, facing: 'right' as const },
  { x: cx - 1.05, y: SL.tableY + 1.9, facing: 'right' as const },
  { x: cx + 1.05, y: SL.tableY + 0.9, facing: 'left' as const },
  { x: cx + 1.05, y: SL.tableY + 1.9, facing: 'left' as const },
]);
