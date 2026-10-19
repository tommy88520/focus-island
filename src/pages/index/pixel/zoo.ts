// 臺北市立動物園（獨立地圖，從主地圖右邊的動物園站搭文湖線過來）。
// 上排：企鵝館、大貓熊館、無尾熊館、火鶴池；中排：臺灣動物區、亞洲熱帶雨林區、非洲動物區；
// 下面是入口廣場（大門、動物園站、腳踏車出租）。展區之間是步道，動物都是用時間算的裝飾（不送伺服器）。
// 座標單位是格（1 格 = 16px），y 往下。

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export type ExhibitId = 'penguin' | 'panda' | 'koala' | 'flamingo' | 'taiwan' | 'rainforest' | 'africa';

export const ZOO = {
  W: 60,
  H: 46,
  exhibits: {
    penguin: { x0: 2, y0: 2, x1: 14, y1: 13 },
    panda: { x0: 16, y0: 2, x1: 31, y1: 13 },
    koala: { x0: 33, y0: 2, x1: 43, y1: 13 },
    flamingo: { x0: 45, y0: 2, x1: 58, y1: 13 },
    taiwan: { x0: 2, y0: 17.5, x1: 18, y1: 29 },
    rainforest: { x0: 21, y0: 17.5, x1: 38, y1: 29 },
    africa: { x0: 41, y0: 17.5, x1: 58, y1: 29 },
  } satisfies Record<ExhibitId, Rect>,
  // 步道：上面那條、下面那條（展區前面）
  upperPath: { y0: 13, y1: 17.5 },
  lowerPath: { y0: 29, y1: 33.4 },
  // 入口大門（兩根柱子中間走過去）、動物園站、腳踏車出租
  gate: { x0: 24.5, x1: 35.5, y: 34 },
  station: { x0: 2, y0: 39.6, x1: 16, y1: 43 },
  bikeStand: { x0: 44, y0: 38.2, x1: 52, y1: 39.4 },
  // 各展區裡的東西
  penguinWaterY: 10.6,
  pandaFrame: { x0: 25.5, y0: 5.4, x1: 29.5, y1: 7.6 },
  pandaPond: { x0: 17, y0: 10, x1: 21, y1: 12.4 },
  // 尤加利樹（樹根在 y = 9；無尾熊抱在樹幹上）
  koalaTrees: [35.2, 38, 40.8],
  flamingoPond: { x0: 46, y0: 6, x1: 57.4, y1: 12.2 },
  bearDen: { x0: 3, y0: 18.2, x1: 7, y1: 20.6 },
  monkeyRocks: { x0: 12, y0: 19, x1: 17, y1: 22.6 },
  elephantPool: { x0: 30.6, y0: 24.6, x1: 37.4, y1: 28.4 },
  tigerRock: { x0: 30.6, y0: 18.6, x1: 37.4, y1: 21.6 },
  orangutanTower: { x: 23.6, y: 21 },
  hippoPond: { x0: 41.6, y0: 24.4, x1: 47.6, y1: 28.4 },
  lionRock: { x0: 52.4, y0: 18.8, x1: 57.6, y1: 21.4 },
  acacia: { x: 49.5, y: 20.6 },
} as const;

export const EXHIBIT_NAMES: Record<ExhibitId, { 'zh-TW': string; 'en-US': string; emoji: string }> = {
  penguin: { 'zh-TW': '企鵝館', 'en-US': 'Penguin House', emoji: '🐧' },
  panda: { 'zh-TW': '大貓熊館', 'en-US': 'Giant Panda House', emoji: '🐼' },
  koala: { 'zh-TW': '無尾熊館', 'en-US': 'Koala House', emoji: '🐨' },
  flamingo: { 'zh-TW': '鳥園 · 火鶴', 'en-US': 'Flamingo Pond', emoji: '🦩' },
  taiwan: { 'zh-TW': '臺灣動物區', 'en-US': 'Formosan Animals', emoji: '🐻' },
  rainforest: { 'zh-TW': '亞洲熱帶雨林區', 'en-US': 'Asian Tropical Rainforest', emoji: '🐘' },
  africa: { 'zh-TW': '非洲動物區', 'en-US': 'African Animals', emoji: '🦒' },
};

export type AnimalKind =
  | 'kingPenguin'
  | 'gentoo'
  | 'penguinSwim'
  | 'panda'
  | 'pandaCub'
  | 'pandaEat'
  | 'pandaSleep'
  | 'koala'
  | 'flamingo'
  | 'flamingoWalk'
  | 'blackBear'
  | 'macaque'
  | 'sikaDeer'
  | 'elephant'
  | 'elephantCalf'
  | 'tiger'
  | 'orangutan'
  | 'giraffe'
  | 'zebra'
  | 'hippo'
  | 'lion'
  | 'lioness';

// 動物：在 x0～x1 之間來回走（x0 = x1 就是站著不動），phase 錯開大家的步調
export interface Animal {
  kind: AnimalKind;
  x0: number;
  x1: number;
  y: number;
  speed: number;
  phase: number;
}

const a = (kind: AnimalKind, x0: number, x1: number, y: number, speed = 0.4, phase = 0): Animal => ({ kind, x0, x1, y, speed, phase });

export const ANIMALS: Animal[] = [
  // 企鵝館：國王企鵝搖搖擺擺、巴布亞企鵝跑來跑去、水裡有幾隻在游
  a('kingPenguin', 4, 9, 8.2, 0.35, 0),
  a('kingPenguin', 6.5, 12, 9.4, 0.3, 0.4),
  a('kingPenguin', 11.2, 11.2, 7.4, 0, 0),
  a('kingPenguin', 4.2, 4.2, 9.8, 0, 0.5),
  a('gentoo', 3.5, 12.5, 7.2, 0.6, 0.2),
  a('gentoo', 5, 10, 9.9, 0.55, 0.7),
  a('gentoo', 8.6, 8.6, 7.8, 0, 0.3),
  a('penguinSwim', 3, 13, 11.5, 1.6, 0),
  a('penguinSwim', 3, 13, 12.3, 1.2, 0.55),
  // 大貓熊館：一隻在散步、一隻抱竹子啃、小貓熊跑來跑去、一隻趴在木架上睡覺
  a('panda', 18, 24.5, 9.2, 0.3, 0.1),
  a('pandaEat', 22.4, 22.4, 6.6),
  a('pandaCub', 22, 29, 11.4, 0.6, 0.3),
  a('pandaSleep', 27.5, 27.5, 5.9),
  // 無尾熊抱在尤加利樹上
  a('koala', 35.2, 35.2, 9, 0, 0),
  a('koala', 38, 38, 9, 0, 0.4),
  a('koala', 40.8, 40.8, 9, 0, 0.8),
  // 火鶴：池子裡單腳站一排、岸邊有幾隻在走
  ...[47.4, 49, 50.8, 52.2, 53.8, 55.6].map((x, i) => a('flamingo', x, x, 8.4 + (i % 2) * 1.6, 0, i * 0.17)),
  a('flamingoWalk', 47, 56, 11.4, 0.4, 0.2),
  a('flamingoWalk', 48, 55, 7, 0.35, 0.6),
  // 臺灣動物區：黑熊、獼猴、梅花鹿
  a('blackBear', 3.5, 10, 22.6, 0.4, 0),
  a('macaque', 12.6, 12.6, 20.4, 0, 0),
  a('macaque', 14.6, 14.6, 19.8, 0, 0.5),
  a('macaque', 16, 16, 21.4, 0, 0.2),
  a('macaque', 11, 16.5, 23.6, 0.9, 0.4),
  a('sikaDeer', 4, 11, 26.4, 0.25, 0.3),
  a('sikaDeer', 9, 16, 27.4, 0.3, 0.8),
  a('sikaDeer', 13.5, 13.5, 25.4, 0, 0),
  // 亞洲熱帶雨林區：大象一家、老虎在岩石上踱步、紅毛猩猩在高台上
  a('elephant', 22.5, 28.5, 25.6, 0.22, 0),
  a('elephant', 24, 29, 27.6, 0.18, 0.5),
  a('elephantCalf', 22.5, 28, 27, 0.3, 0.2),
  a('tiger', 31.5, 36.6, 20.6, 0.5, 0),
  a('orangutan', 23.6, 23.6, 21, 0, 0),
  // 非洲動物區：長頸鹿、斑馬、河馬、獅子
  a('giraffe', 42.5, 48, 22.4, 0.25, 0),
  a('giraffe', 44, 51, 23.6, 0.2, 0.6),
  a('zebra', 49, 57, 25.6, 0.35, 0.1),
  a('zebra', 48.5, 56.5, 26.8, 0.3, 0.5),
  a('zebra', 50, 57.4, 27.9, 0.4, 0.8),
  a('hippo', 43, 46.4, 26.6, 0.15, 0),
  a('hippo', 44.6, 44.6, 27.8, 0, 0.5),
  a('lion', 53.6, 53.6, 20.6, 0, 0),
  a('lioness', 56, 56, 21, 0, 0.3),
];

// 座位：三張長椅，每張坐兩個人，面向展區（看熊貓、看火鶴、看大象）。順序 = 座位編號 25–30，不要調換
export const ZOO_SEATS: { x: number; y: number; facing: 'up' }[] = [
  { x: 22.9, y: 14.2, facing: 'up' },
  { x: 24.1, y: 14.2, facing: 'up' },
  { x: 50.9, y: 14.2, facing: 'up' },
  { x: 52.1, y: 14.2, facing: 'up' },
  { x: 28.9, y: 30.2, facing: 'up' },
  { x: 30.1, y: 30.2, facing: 'up' },
];
export const BENCHES = [23.5, 51.5, 29.5].map((x, i) => ({ x, y: i < 2 ? 14.2 : 30.2 }));
