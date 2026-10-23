// 各城市地圖買得到的東西（只放資料，pixelWorld 也會讀來查 emoji）。
// 新增要先加進後端 allowedShopItems（位置訊息會帶手上拿的東西），不然整則位置會被丟掉
import type { ShopItem } from './pixelWorld';

// 臺南（孔廟一帶）：度小月擔仔麵、林百貨、府中街、莉莉水果店
export const TAINAN_ITEMS = {
  danzaiNoodles: { id: 'danzaiNoodles', emoji: '🍜', price: 60, name: { 'zh-TW': '擔仔麵（肉燥、蝦仁、滷蛋）', 'en-US': 'Danzai noodles (pork sauce, shrimp, egg)' } },
  shrimpRoll: { id: 'shrimpRoll', emoji: '🍤', price: 70, name: { 'zh-TW': '蝦捲', 'en-US': 'Shrimp rolls' } },
  linTote: { id: 'linTote', emoji: '👜', price: 120, name: { 'zh-TW': '林百貨帆布包', 'en-US': 'Hayashi canvas tote' } },
  pineappleCake: { id: 'pineappleCake', emoji: '🍍', price: 50, name: { 'zh-TW': '鳳梨酥', 'en-US': 'Pineapple cake' } },
  icedCoffee: { id: 'icedCoffee', emoji: '☕', price: 80, name: { 'zh-TW': '冰拿鐵', 'en-US': 'Iced latte' } },
  blackTea: { id: 'blackTea', emoji: '🥤', price: 35, name: { 'zh-TW': '古早味紅茶', 'en-US': 'Old-school black tea' } },
  fruitIce: { id: 'fruitIce', emoji: '🍧', price: 80, name: { 'zh-TW': '綜合水果冰', 'en-US': 'Mixed fruit shaved ice' } },
  tomatoPlate: { id: 'tomatoPlate', emoji: '🍅', price: 60, name: { 'zh-TW': '番茄切盤（沾薑汁醬油）', 'en-US': 'Tomato plate (ginger soy dip)' } },
} satisfies Record<string, ShopItem>;

// 臺中（臺中車站一帶）：宮原眼科、第四信用合作社、綠川旁的小吃攤車
export const TAICHUNG_ITEMS = {
  iceCreamCone: { id: 'iceCreamCone', emoji: '🍦', price: 120, name: { 'zh-TW': '冰淇淋（甜筒，加配料）', 'en-US': 'Ice cream cone with toppings' } },
  pineappleCake: TAINAN_ITEMS.pineappleCake,
  sunCake: { id: 'sunCake', emoji: '🥮', price: 35, name: { 'zh-TW': '太陽餅', 'en-US': 'Suncake' } },
  daMianGeng: { id: 'daMianGeng', emoji: '🍜', price: 40, name: { 'zh-TW': '大麵羹', 'en-US': 'Da mian geng (thick noodle soup)' } },
  pearlMilkTea: { id: 'pearlMilkTea', emoji: '🧋', price: 60, name: { 'zh-TW': '珍珠奶茶', 'en-US': 'Bubble milk tea' } },
} satisfies Record<string, ShopItem>;

// 高雄（鹽埕、愛河、駁二）：鴨肉珍、港園牛肉麵、愛河邊的木瓜牛奶和咖啡
export const KAOHSIUNG_ITEMS = {
  duckRice: { id: 'duckRice', emoji: '🍚', price: 50, name: { 'zh-TW': '鴨肉飯', 'en-US': 'Duck rice' } },
  beefNoodles: { id: 'beefNoodles', emoji: '🍜', price: 120, name: { 'zh-TW': '牛肉拌麵', 'en-US': 'Beef noodles (dry)' } },
  papayaMilk: { id: 'papayaMilk', emoji: '🥛', price: 60, name: { 'zh-TW': '木瓜牛奶', 'en-US': 'Papaya milk' } },
  icedCoffee: TAINAN_ITEMS.icedCoffee,
} satisfies Record<string, ShopItem>;

// 新北淡水（老街、河岸）：阿婆鐵蛋、可口魚丸、文化阿給、河岸咖啡的酸梅湯
export const TAMSUI_ITEMS = {
  ironEggs: { id: 'ironEggs', emoji: '🥚', price: 80, name: { 'zh-TW': '鐵蛋', 'en-US': 'Iron eggs' } },
  fishBallSoup: { id: 'fishBallSoup', emoji: '🍲', price: 40, name: { 'zh-TW': '魚丸湯', 'en-US': 'Fish ball soup' } },
  aGei: { id: 'aGei', emoji: '🍢', price: 45, name: { 'zh-TW': '阿給', 'en-US': 'A-gei (stuffed tofu)' } },
  plumJuice: { id: 'plumJuice', emoji: '🍹', price: 30, name: { 'zh-TW': '酸梅湯', 'en-US': 'Sour plum drink' } },
  icedCoffee: TAINAN_ITEMS.icedCoffee,
} satisfies Record<string, ShopItem>;

export const CITY_ITEMS: ShopItem[] = [...Object.values(TAINAN_ITEMS), ...Object.values(TAICHUNG_ITEMS), ...Object.values(KAOHSIUNG_ITEMS), ...Object.values(TAMSUI_ITEMS)];
