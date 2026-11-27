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

// 南投日月潭：玄光寺的阿婆茶葉蛋、水社的紅茶和香腸
export const SUNMOON_ITEMS = {
  teaEgg: { id: 'teaEgg', emoji: '🥚', price: 15, name: { 'zh-TW': '茶葉蛋', 'en-US': 'Tea egg' } },
  redJadeTea: { id: 'redJadeTea', emoji: '🫖', price: 60, name: { 'zh-TW': '日月潭紅茶（紅玉）', 'en-US': 'Sun Moon Lake black tea (Ruby)' } },
  boarSausage: { id: 'boarSausage', emoji: '🌭', price: 40, name: { 'zh-TW': '山豬肉香腸', 'en-US': 'Wild boar sausage' } },
} satisfies Record<string, ShopItem>;

// 花蓮七星潭：海邊攤車的扁食、柴魚、剉冰
export const HUALIEN_ITEMS = {
  wonton: { id: 'wonton', emoji: '🥟', price: 70, name: { 'zh-TW': '扁食（餛飩湯）', 'en-US': 'Bianshi wonton soup' } },
  driedBonito: { id: 'driedBonito', emoji: '🐟', price: 90, name: { 'zh-TW': '柴魚片', 'en-US': 'Bonito flakes' } },
  shavedIce: { id: 'shavedIce', emoji: '🍧', price: 50, name: { 'zh-TW': '剉冰', 'en-US': 'Shaved ice' } },
} satisfies Record<string, ShopItem>;

// 基隆正濱漁港：小卷米粉、鹹湯圓、碳烤小卷（跟士林的碳烤魷魚同一個 id）、彩色屋咖啡
export const KEELUNG_ITEMS = {
  squidVermicelli: { id: 'squidVermicelli', emoji: '🍜', price: 60, name: { 'zh-TW': '小卷米粉', 'en-US': 'Squid vermicelli soup' } },
  saltyTangyuan: { id: 'saltyTangyuan', emoji: '🍡', price: 50, name: { 'zh-TW': '鹹湯圓', 'en-US': 'Savory tangyuan soup' } },
  grilledSquid: { id: 'squid', emoji: '🦑', price: 70, name: { 'zh-TW': '碳烤小卷', 'en-US': 'Grilled baby squid' } },
  icedCoffee: TAINAN_ITEMS.icedCoffee,
  blackTea: TAINAN_ITEMS.blackTea,
} satisfies Record<string, ShopItem>;

// 新竹城隍廟口：貢丸湯、炒米粉、肉圓、潤餅
export const HSINCHU_ITEMS = {
  meatballSoup: { id: 'meatballSoup', emoji: '🍲', price: 40, name: { 'zh-TW': '貢丸湯', 'en-US': 'Pork ball soup' } },
  friedVermicelli: { id: 'friedVermicelli', emoji: '🍝', price: 40, name: { 'zh-TW': '炒米粉', 'en-US': 'Fried rice noodles' } },
  bawan: { id: 'bawan', emoji: '🥟', price: 45, name: { 'zh-TW': '肉圓（新竹蒸的）', 'en-US': 'Ba-wan (steamed, Hsinchu style)' } },
  runbing: { id: 'runbing', emoji: '🌯', price: 50, name: { 'zh-TW': '潤餅捲', 'en-US': 'Runbing spring roll' } },
} satisfies Record<string, ShopItem>;

// 嘉義：文化路夜市的火雞肉飯、沙鍋魚頭、豆花（跟士林的同一個 id）、方塊酥，檜意森活村的阿里山高山茶
export const CHIAYI_ITEMS = {
  turkeyRice: { id: 'turkeyRice', emoji: '🍚', price: 40, name: { 'zh-TW': '火雞肉飯', 'en-US': 'Turkey rice' } },
  fishHeadCasserole: { id: 'fishHeadCasserole', emoji: '🍲', price: 90, name: { 'zh-TW': '沙鍋魚頭', 'en-US': 'Fish head casserole' } },
  tofuPudding: { id: 'tofuPudding', emoji: '🍮', price: 35, name: { 'zh-TW': '花生豆花', 'en-US': 'Peanut tofu pudding' } },
  squarePastry: { id: 'squarePastry', emoji: '🍘', price: 60, name: { 'zh-TW': '方塊酥', 'en-US': 'Fangkuai square pastry' } },
  alishanTea: { id: 'alishanTea', emoji: '🍵', price: 60, name: { 'zh-TW': '阿里山高山茶', 'en-US': 'Alishan high-mountain tea' } },
} satisfies Record<string, ShopItem>;

// 宜蘭東門夜市：卜肉、三星蔥油餅、糕渣、牛舌餅、花生捲冰淇淋（跟士林的同一個 id）
export const YILAN_ITEMS = {
  buRou: { id: 'buRou', emoji: '🍖', price: 60, name: { 'zh-TW': '卜肉', 'en-US': 'Bu-rou (fried pork strips)' } },
  scallionPancake: { id: 'scallionPancake', emoji: '🥞', price: 40, name: { 'zh-TW': '三星蔥油餅', 'en-US': 'Sanxing scallion pancake' } },
  gaozha: { id: 'gaozha', emoji: '🧈', price: 60, name: { 'zh-TW': '糕渣', 'en-US': 'Gaozha (fried savory custard)' } },
  oxTonguePastry: { id: 'oxTonguePastry', emoji: '🫓', price: 50, name: { 'zh-TW': '牛舌餅', 'en-US': 'Ox-tongue pastry' } },
  icecreamRoll: { id: 'icecreamRoll', emoji: '🍦', price: 35, name: { 'zh-TW': '花生捲冰淇淋', 'en-US': 'Peanut ice cream roll' } },
} satisfies Record<string, ShopItem>;

// 台東：榕樹下米苔目、卑南豬血湯、釋迦、池上便當
export const TAITUNG_ITEMS = {
  mitaimu: { id: 'mitaimu', emoji: '🍜', price: 40, name: { 'zh-TW': '米苔目', 'en-US': 'Mi-tai-mu rice noodles' } },
  pigBloodSoup: { id: 'pigBloodSoup', emoji: '🍲', price: 45, name: { 'zh-TW': '豬血湯', 'en-US': 'Pig blood soup' } },
  custardApple: { id: 'custardApple', emoji: '🍈', price: 60, name: { 'zh-TW': '台東釋迦', 'en-US': 'Taitung sugar apple' } },
  chishangBento: { id: 'chishangBento', emoji: '🍱', price: 90, name: { 'zh-TW': '池上便當', 'en-US': 'Chishang bento' } },
} satisfies Record<string, ShopItem>;

// 墾丁大街：飛魚卵香腸、現剖椰子、碳烤魷魚（跟士林的同一個 id）、芒果冰（跟士林的同一個 id）
export const KENTING_ITEMS = {
  flyingFishSausage: { id: 'flyingFishSausage', emoji: '🌭', price: 50, name: { 'zh-TW': '飛魚卵香腸', 'en-US': 'Flying-fish roe sausage' } },
  coconut: { id: 'coconut', emoji: '🥥', price: 70, name: { 'zh-TW': '現剖椰子', 'en-US': 'Fresh coconut' } },
  grilledSquid: { id: 'squid', emoji: '🦑', price: 80, name: { 'zh-TW': '碳烤魷魚', 'en-US': 'Grilled squid' } },
  mangoIce: { id: 'mangoIce', emoji: '🍧', price: 60, name: { 'zh-TW': '芒果冰', 'en-US': 'Mango shaved ice' } },
} satisfies Record<string, ShopItem>;

// 澎湖：黑糖糕、仙人掌冰、花枝丸、鹹餅
export const PENGHU_ITEMS = {
  brownSugarCake: { id: 'brownSugarCake', emoji: '🍰', price: 50, name: { 'zh-TW': '黑糖糕', 'en-US': 'Brown sugar cake' } },
  cactusIce: { id: 'cactusIce', emoji: '🌵', price: 50, name: { 'zh-TW': '仙人掌冰', 'en-US': 'Cactus fruit ice' } },
  cuttlefishBall: { id: 'cuttlefishBall', emoji: '🍡', price: 60, name: { 'zh-TW': '花枝丸', 'en-US': 'Cuttlefish balls' } },
  saltyBiscuit: { id: 'saltyBiscuit', emoji: '🍪', price: 40, name: { 'zh-TW': '澎湖鹹餅', 'en-US': 'Penghu salty biscuit' } },
} satisfies Record<string, ShopItem>;

// 阿里山：愛玉、鄒族竹筒飯、阿里山咖啡、高山茶（跟嘉義的同一個 id）
export const ALISHAN_ITEMS = {
  aiyu: { id: 'aiyu', emoji: '🍋', price: 40, name: { 'zh-TW': '檸檬愛玉', 'en-US': 'Aiyu jelly with lemon' } },
  bambooRice: { id: 'bambooRice', emoji: '🎋', price: 80, name: { 'zh-TW': '竹筒飯', 'en-US': 'Bamboo-tube rice' } },
  alishanCoffee: { id: 'alishanCoffee', emoji: '☕', price: 90, name: { 'zh-TW': '阿里山咖啡', 'en-US': 'Alishan coffee' } },
  alishanTea: { id: 'alishanTea', emoji: '🍵', price: 60, name: { 'zh-TW': '阿里山高山茶', 'en-US': 'Alishan high-mountain tea' } },
} satisfies Record<string, ShopItem>;

// 桃園機場第一航廈：咖啡店（冰拿鐵、珍奶）、便利商店（御飯糰、茶葉蛋）、伴手禮店（鳳梨酥、飛機模型）
export const AIRPORT_ITEMS = {
  icedCoffee: TAINAN_ITEMS.icedCoffee,
  pearlMilkTea: TAICHUNG_ITEMS.pearlMilkTea,
  riceBall: { id: 'riceBall', emoji: '🍙', price: 35, name: { 'zh-TW': '御飯糰', 'en-US': 'Onigiri rice ball' } },
  teaEgg: SUNMOON_ITEMS.teaEgg,
  pineappleCake: TAINAN_ITEMS.pineappleCake,
  planeModel: { id: 'planeModel', emoji: '✈️', price: 150, name: { 'zh-TW': '飛機模型', 'en-US': 'Model airplane' } },
} satisfies Record<string, ShopItem>;

// 京都（產寧坂）：抹茶霜淇淋、生八橋、甘味處的三色糰子和抹茶
export const KYOTO_ITEMS = {
  matchaSoftServe: { id: 'matchaSoftServe', emoji: '🍦', price: 60, name: { 'zh-TW': '宇治抹茶霜淇淋', 'en-US': 'Uji matcha soft serve' } },
  yatsuhashi: { id: 'yatsuhashi', emoji: '🥟', price: 50, name: { 'zh-TW': '生八橋', 'en-US': 'Nama yatsuhashi' } },
  dango: { id: 'dango', emoji: '🍡', price: 40, name: { 'zh-TW': '三色糰子', 'en-US': 'Hanami dango' } },
  matcha: { id: 'matcha', emoji: '🍵', price: 60, name: { 'zh-TW': '抹茶（附和菓子）', 'en-US': 'Matcha with wagashi' } },
} satisfies Record<string, ShopItem>;

// 大阪（道頓堀、新世界）：章魚燒、炸串、大阪燒
export const OSAKA_ITEMS = {
  takoyaki: { id: 'takoyaki', emoji: '🐙', price: 60, name: { 'zh-TW': '章魚燒', 'en-US': 'Takoyaki' } },
  kushikatsu: { id: 'kushikatsu', emoji: '🍢', price: 50, name: { 'zh-TW': '炸串（醬汁只能沾一次！）', 'en-US': 'Kushikatsu (no double-dipping!)' } },
  okonomiyaki: { id: 'okonomiyaki', emoji: '🥞', price: 90, name: { 'zh-TW': '大阪燒', 'en-US': 'Okonomiyaki' } },
} satisfies Record<string, ShopItem>;

// 神戶（南京町、北野）：豬肉包、神戶牛、神戶布丁
export const KOBE_ITEMS = {
  butaman: { id: 'butaman', emoji: '🥟', price: 40, name: { 'zh-TW': '南京町豬肉包', 'en-US': 'Nankinmachi pork bun' } },
  kobeBeef: { id: 'kobeBeef', emoji: '🥩', price: 300, name: { 'zh-TW': '神戶牛串', 'en-US': 'Kobe beef skewer' } },
  kobePudding: { id: 'kobePudding', emoji: '🍮', price: 60, name: { 'zh-TW': '神戶布丁', 'en-US': 'Kobe pudding' } },
} satisfies Record<string, ShopItem>;

// 東京（淺草仲見世）：人形燒、雷米香、炸饅頭
export const TOKYO_ITEMS = {
  ningyoyaki: { id: 'ningyoyaki', emoji: '🎎', price: 50, name: { 'zh-TW': '人形燒', 'en-US': 'Ningyo-yaki' } },
  kaminariOkoshi: { id: 'kaminariOkoshi', emoji: '🍘', price: 40, name: { 'zh-TW': '雷米香（雷おこし）', 'en-US': 'Kaminari okoshi' } },
  ageManju: { id: 'ageManju', emoji: '🥠', price: 50, name: { 'zh-TW': '炸饅頭', 'en-US': 'Age-manju' } },
} satisfies Record<string, ShopItem>;

// 奈良（奈良公園、東大寺參道）：鹿仙貝、柿葉壽司、葛餅
export const NARA_ITEMS = {
  shikaSenbei: { id: 'shikaSenbei', emoji: '🦌', price: 20, name: { 'zh-TW': '鹿仙貝（餵鹿用）', 'en-US': 'Deer crackers (for the deer)' } },
  kakinohaSushi: { id: 'kakinohaSushi', emoji: '🍣', price: 80, name: { 'zh-TW': '柿葉壽司', 'en-US': 'Persimmon-leaf sushi' } },
  kuzumochi: { id: 'kuzumochi', emoji: '🍮', price: 60, name: { 'zh-TW': '吉野葛餅', 'en-US': 'Yoshino kuzumochi' } },
} satisfies Record<string, ShopItem>;

// 札幌（大通公園、拉麵橫丁）：味噌拉麵、烤玉米、北海道牛奶霜淇淋、成吉思汗烤肉
export const SAPPORO_ITEMS = {
  misoRamen: { id: 'misoRamen', emoji: '🍜', price: 90, name: { 'zh-TW': '札幌味噌拉麵', 'en-US': 'Sapporo miso ramen' } },
  hokkaidoCorn: { id: 'hokkaidoCorn', emoji: '🌽', price: 40, name: { 'zh-TW': '大通公園烤玉米', 'en-US': 'Odori Park grilled corn' } },
  milkSoftServe: { id: 'milkSoftServe', emoji: '🍦', price: 50, name: { 'zh-TW': '北海道牛奶霜淇淋', 'en-US': 'Hokkaido milk soft serve' } },
  jingisukan: { id: 'jingisukan', emoji: '🍖', price: 120, name: { 'zh-TW': '成吉思汗烤羊肉', 'en-US': 'Jingisukan grilled lamb' } },
} satisfies Record<string, ShopItem>;

// 廣島宮島（表參道商店街）：紅葉饅頭、烤牡蠣、星鰻飯
export const HIROSHIMA_ITEMS = {
  momijiManju: { id: 'momijiManju', emoji: '🍁', price: 30, name: { 'zh-TW': '紅葉饅頭', 'en-US': 'Momiji manju' } },
  grilledOyster: { id: 'grilledOyster', emoji: '🦪', price: 80, name: { 'zh-TW': '宮島烤牡蠣', 'en-US': 'Miyajima grilled oysters' } },
  anagoMeshi: { id: 'anagoMeshi', emoji: '🍱', price: 150, name: { 'zh-TW': '星鰻飯', 'en-US': 'Anago-meshi (conger eel rice)' } },
} satisfies Record<string, ShopItem>;

// 福岡（中洲屋台、博多）：豚骨拉麵、明太子飯糰、牛腸鍋、雞肉串
export const FUKUOKA_ITEMS = {
  hakataRamen: { id: 'hakataRamen', emoji: '🍜', price: 80, name: { 'zh-TW': '博多豚骨拉麵', 'en-US': 'Hakata tonkotsu ramen' } },
  mentaiko: { id: 'mentaiko', emoji: '🍙', price: 40, name: { 'zh-TW': '明太子飯糰', 'en-US': 'Mentaiko onigiri' } },
  motsunabe: { id: 'motsunabe', emoji: '🍲', price: 130, name: { 'zh-TW': '牛腸鍋', 'en-US': 'Motsunabe (offal hot pot)' } },
  yakitori: { id: 'yakitori', emoji: '🍢', price: 50, name: { 'zh-TW': '雞肉串燒', 'en-US': 'Yakitori skewers' } },
} satisfies Record<string, ShopItem>;

// 沖繩（那霸國際通）：沖繩麵、開口笑、紅芋冰淇淋、苦瓜炒蛋
export const OKINAWA_ITEMS = {
  okinawaSoba: { id: 'okinawaSoba', emoji: '🍜', price: 80, name: { 'zh-TW': '沖繩麵（三層肉）', 'en-US': 'Okinawa soba with pork belly' } },
  sataAndagi: { id: 'sataAndagi', emoji: '🍩', price: 30, name: { 'zh-TW': '開口笑（沙翁）', 'en-US': 'Sata andagi doughnuts' } },
  beniImoIce: { id: 'beniImoIce', emoji: '🍨', price: 50, name: { 'zh-TW': '紅芋冰淇淋', 'en-US': 'Purple sweet potato ice cream' } },
  goyaChampuru: { id: 'goyaChampuru', emoji: '🥒', price: 90, name: { 'zh-TW': '苦瓜炒蛋（Champuru）', 'en-US': 'Goya champuru' } },
} satisfies Record<string, ShopItem>;

// 首爾（明洞街頭小吃）：辣炒年糕、糖餅、雞蛋糕、魚板串
export const SEOUL_ITEMS = {
  tteokbokki: { id: 'tteokbokki', emoji: '🌶️', price: 60, name: { 'zh-TW': '辣炒年糕', 'en-US': 'Tteokbokki' } },
  hotteok: { id: 'hotteok', emoji: '🥞', price: 30, name: { 'zh-TW': '黑糖糖餅', 'en-US': 'Hotteok (sweet pancake)' } },
  gyeranppang: { id: 'gyeranppang', emoji: '🥚', price: 30, name: { 'zh-TW': '雞蛋糕（계란빵）', 'en-US': 'Gyeranppang (egg bread)' } },
  eomuk: { id: 'eomuk', emoji: '🍢', price: 30, name: { 'zh-TW': '魚板串（附熱湯）', 'en-US': 'Eomuk fishcake skewer' } },
} satisfies Record<string, ShopItem>;

// 曼谷（河邊、考山路一帶的攤販）：泰式炒河粉、芒果糯米飯、泰式奶茶、椰子冰淇淋
export const BANGKOK_ITEMS = {
  padThai: { id: 'padThai', emoji: '🍝', price: 60, name: { 'zh-TW': '泰式炒河粉', 'en-US': 'Pad thai' } },
  mangoStickyRice: { id: 'mangoStickyRice', emoji: '🥭', price: 70, name: { 'zh-TW': '芒果糯米飯', 'en-US': 'Mango sticky rice' } },
  thaiTea: { id: 'thaiTea', emoji: '🧋', price: 40, name: { 'zh-TW': '泰式奶茶', 'en-US': 'Thai iced tea' } },
  coconutIceCream: { id: 'coconutIceCream', emoji: '🍨', price: 50, name: { 'zh-TW': '椰子冰淇淋（椰殼裝）', 'en-US': 'Coconut ice cream in the shell' } },
} satisfies Record<string, ShopItem>;

// 舊金山（漁人碼頭）：麵包碗巧達湯、酸種麵包、珍寶蟹、巧克力聖代
export const SANFRANCISCO_ITEMS = {
  clamChowder: { id: 'clamChowder', emoji: '🥣', price: 120, name: { 'zh-TW': '酸種麵包碗巧達湯', 'en-US': 'Clam chowder in a sourdough bowl' } },
  sourdough: { id: 'sourdough', emoji: '🥖', price: 60, name: { 'zh-TW': '酸種麵包', 'en-US': 'Sourdough loaf' } },
  dungenessCrab: { id: 'dungenessCrab', emoji: '🦀', price: 250, name: { 'zh-TW': '珍寶蟹', 'en-US': 'Dungeness crab' } },
  chocolateSundae: { id: 'chocolateSundae', emoji: '🍨', price: 90, name: { 'zh-TW': '熱巧克力聖代', 'en-US': 'Hot fudge sundae' } },
} satisfies Record<string, ShopItem>;

// 拉斯維加斯（大道）：大杯冰沙、熱狗、自助餐、雞尾酒蝦
export const LASVEGAS_ITEMS = {
  yardSlush: { id: 'yardSlush', emoji: '🥤', price: 80, name: { 'zh-TW': '一碼長的大杯冰沙', 'en-US': 'Yard-long slushie' } },
  hotDog: { id: 'hotDog', emoji: '🌭', price: 50, name: { 'zh-TW': '熱狗', 'en-US': 'Hot dog' } },
  buffetPlate: { id: 'buffetPlate', emoji: '🍽️', price: 200, name: { 'zh-TW': '自助餐吃到飽', 'en-US': 'All-you-can-eat buffet plate' } },
  shrimpCocktail: { id: 'shrimpCocktail', emoji: '🍤', price: 90, name: { 'zh-TW': '雞尾酒蝦', 'en-US': 'Shrimp cocktail' } },
} satisfies Record<string, ShopItem>;

// 洛杉磯（聖塔莫尼卡、好萊塢）：塔可、墨西哥捲餅、起司漢堡、吉拿棒
export const LOSANGELES_ITEMS = {
  taco: { id: 'taco', emoji: '🌮', price: 50, name: { 'zh-TW': '塔可', 'en-US': 'Tacos' } },
  burrito: { id: 'burrito', emoji: '🌯', price: 80, name: { 'zh-TW': '墨西哥捲餅', 'en-US': 'Burrito' } },
  cheeseburger: { id: 'cheeseburger', emoji: '🍔', price: 80, name: { 'zh-TW': '起司漢堡', 'en-US': 'Cheeseburger' } },
  churro: { id: 'churro', emoji: '🥖', price: 40, name: { 'zh-TW': '吉拿棒', 'en-US': 'Churros' } },
} satisfies Record<string, ShopItem>;

// 紐約（時代廣場、中央公園）：一片披薩、貝果、紐約起司蛋糕、椒鹽卷餅
export const NEWYORK_ITEMS = {
  pizzaSlice: { id: 'pizzaSlice', emoji: '🍕', price: 40, name: { 'zh-TW': '紐約大片披薩', 'en-US': 'New York pizza slice' } },
  bagel: { id: 'bagel', emoji: '🥯', price: 40, name: { 'zh-TW': '貝果（奶油乳酪）', 'en-US': 'Bagel with cream cheese' } },
  nyCheesecake: { id: 'nyCheesecake', emoji: '🍰', price: 80, name: { 'zh-TW': '紐約起司蛋糕', 'en-US': 'New York cheesecake' } },
  pretzel: { id: 'pretzel', emoji: '🥨', price: 30, name: { 'zh-TW': '椒鹽卷餅', 'en-US': 'Soft pretzel' } },
} satisfies Record<string, ShopItem>;

// 吉隆坡（亞羅街、嘛嘛檔）：沙爹、椰漿飯、拉茶、榴槤
export const KUALALUMPUR_ITEMS = {
  satay: { id: 'satay', emoji: '🍢', price: 50, name: { 'zh-TW': '沙爹（花生醬）', 'en-US': 'Satay with peanut sauce' } },
  nasiLemak: { id: 'nasiLemak', emoji: '🍛', price: 50, name: { 'zh-TW': '椰漿飯', 'en-US': 'Nasi lemak' } },
  tehTarik: { id: 'tehTarik', emoji: '🥛', price: 25, name: { 'zh-TW': '拉茶', 'en-US': 'Teh tarik (pulled tea)' } },
  durian: { id: 'durian', emoji: '🍈', price: 120, name: { 'zh-TW': '貓山王榴槤', 'en-US': 'Musang King durian' } },
} satisfies Record<string, ShopItem>;

// 上海（豫園、城隍廟）：小籠包、生煎包、蔥油拌麵、排骨年糕
export const SHANGHAI_ITEMS = {
  xiaolongbao: { id: 'xiaolongbao', emoji: '🥟', price: 80, name: { 'zh-TW': '南翔小籠包', 'en-US': 'Nanxiang xiaolongbao' } },
  shengjianbao: { id: 'shengjianbao', emoji: '🥟', price: 45, name: { 'zh-TW': '生煎包', 'en-US': 'Shengjianbao (pan-fried buns)' } },
  scallionOilNoodles: { id: 'scallionOilNoodles', emoji: '🍜', price: 50, name: { 'zh-TW': '蔥油拌麵', 'en-US': 'Scallion oil noodles' } },
  porkChopRiceCake: { id: 'porkChopRiceCake', emoji: '🍖', price: 70, name: { 'zh-TW': '排骨年糕', 'en-US': 'Pork chop with rice cakes' } },
} satisfies Record<string, ShopItem>;

export const CITY_ITEMS: ShopItem[] = [...Object.values(TAINAN_ITEMS), ...Object.values(TAICHUNG_ITEMS), ...Object.values(KAOHSIUNG_ITEMS), ...Object.values(TAMSUI_ITEMS), ...Object.values(SUNMOON_ITEMS), ...Object.values(HUALIEN_ITEMS), ...Object.values(KEELUNG_ITEMS), ...Object.values(HSINCHU_ITEMS), ...Object.values(CHIAYI_ITEMS), ...Object.values(YILAN_ITEMS), ...Object.values(TAITUNG_ITEMS), ...Object.values(KENTING_ITEMS), ...Object.values(PENGHU_ITEMS), ...Object.values(ALISHAN_ITEMS), ...Object.values(AIRPORT_ITEMS), ...Object.values(KYOTO_ITEMS), ...Object.values(OSAKA_ITEMS), ...Object.values(KOBE_ITEMS), ...Object.values(TOKYO_ITEMS), ...Object.values(NARA_ITEMS), ...Object.values(SAPPORO_ITEMS), ...Object.values(HIROSHIMA_ITEMS), ...Object.values(FUKUOKA_ITEMS), ...Object.values(OKINAWA_ITEMS), ...Object.values(SEOUL_ITEMS), ...Object.values(BANGKOK_ITEMS), ...Object.values(SANFRANCISCO_ITEMS), ...Object.values(LASVEGAS_ITEMS), ...Object.values(LOSANGELES_ITEMS), ...Object.values(NEWYORK_ITEMS), ...Object.values(KUALALUMPUR_ITEMS), ...Object.values(SHANGHAI_ITEMS)];
