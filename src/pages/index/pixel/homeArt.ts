// 自己的家：花園擺設（可以用專注幣買、自己擺）。id 會存進帳號，只能往後加、不要改名。
// 座標都是世界座標（格 × 16px），x、y 是擺設佔的左上角那格。

import { px } from 'src/pages/index/pixel/pixelUtil';

const T = 16;

export interface GardenItem {
  id: string;
  emoji: string;
  price: number;
  w: number;
  h: number;
  name: { 'zh-TW': string; 'en-US': string };
}

export const GARDEN_ITEMS: GardenItem[] = [
  { id: 'tulips', emoji: '🌷', price: 20, w: 1, h: 1, name: { 'zh-TW': '鬱金香', 'en-US': 'Tulips' } },
  { id: 'rose', emoji: '🌹', price: 25, w: 1, h: 1, name: { 'zh-TW': '玫瑰', 'en-US': 'Roses' } },
  { id: 'sunflower', emoji: '🌻', price: 25, w: 1, h: 1, name: { 'zh-TW': '向日葵', 'en-US': 'Sunflower' } },
  { id: 'bush', emoji: '🌿', price: 15, w: 1, h: 1, name: { 'zh-TW': '灌木', 'en-US': 'Bush' } },
  { id: 'mushroom', emoji: '🍄', price: 10, w: 1, h: 1, name: { 'zh-TW': '香菇', 'en-US': 'Mushroom' } },
  { id: 'tree', emoji: '🌳', price: 40, w: 1, h: 1, name: { 'zh-TW': '樹', 'en-US': 'Tree' } },
  { id: 'sakura', emoji: '🌸', price: 60, w: 1, h: 1, name: { 'zh-TW': '櫻花樹', 'en-US': 'Cherry tree' } },
  { id: 'bench', emoji: '🪑', price: 30, w: 2, h: 1, name: { 'zh-TW': '長椅', 'en-US': 'Bench' } },
  { id: 'lamp', emoji: '🏮', price: 30, w: 1, h: 1, name: { 'zh-TW': '路燈', 'en-US': 'Lamp' } },
  { id: 'pond', emoji: '🪷', price: 120, w: 2, h: 2, name: { 'zh-TW': '荷花池', 'en-US': 'Lily pond' } },
  { id: 'fountain', emoji: '⛲', price: 150, w: 2, h: 2, name: { 'zh-TW': '噴水池', 'en-US': 'Fountain' } },
];

// 第一次回家送的擺設（不用錢），花園才不會空空的
export const STARTER_GARDEN = [
  { id: 'tree', x: 2, y: 12 },
  { id: 'sakura', x: 17, y: 12 },
  { id: 'tulips', x: 7, y: 13 },
  { id: 'tulips', x: 12, y: 13 },
  { id: 'bench', x: 3, y: 17 },
  { id: 'lamp', x: 8, y: 16 },
];

// villa 專屬花園：左邊一排櫻花樹、右邊一排玫瑰（不要路燈）
export const VILLA_GARDEN = [
  ...[13, 15, 17, 19, 21].map((y) => ({ id: 'sakura', x: 1, y })),
  ...[12, 13, 14, 15, 16, 17, 18, 19, 20, 21].map((y) => ({ id: 'rose', x: 18, y })),
];

export const GARDEN_ITEM_BY_ID = Object.fromEntries(GARDEN_ITEMS.map((i) => [i.id, i])) as Record<string, GardenItem | undefined>;

// 畫一個擺設（lit：晚上燈會亮）
export function drawGardenItem(c: CanvasRenderingContext2D, id: string, tx: number, ty: number, seconds: number, lit: boolean): void {
  const x = tx * T;
  const y = ty * T;
  const shadow = (w: number) => px(c, 'rgba(0,0,0,0.18)', x + (T * w - (w * 12)) / 2, y + 13, w * 12, 3);
  switch (id) {
    case 'tulips': {
      shadow(1);
      px(c, '#6b4a2f', x + 2, y + 11, 12, 4);
      const colors = ['#e25a4a', '#f6c945', '#f472b6'];
      for (let i = 0; i < 3; i += 1) {
        const fx = x + 3 + i * 4;
        px(c, '#3f8a3a', fx + 1, y + 6, 1, 6);
        px(c, colors[i] ?? '#e25a4a', fx, y + 3, 3, 3);
        px(c, '#ffffff', fx + 1, y + 3, 1, 1);
      }
      break;
    }
    case 'rose': {
      // 一枝枝的玫瑰（沒有底座）：細綠莖、莖上一兩片小葉子、頂端一朵手點的玫瑰。一格 2～3 枝、高矮和位置錯開；有的格子開粉紅
      const seed = (tx * 73 + ty * 37) % 97;
      const pink = seed % 4 === 0;
      const COL: Record<string, string> = pink ? { d: '#b0405e', m: '#e06c8c', l: '#ffa3bb' } : { d: '#8e1b33', m: '#cf3352', l: '#f26b84' };
      const BIG = ['..dmm..', '.dmllm.', 'dmlddlm', 'mldlldm', 'mlddlld', '.mlllm.', '..dmd..'];
      const SMALL = ['.mmm.', 'mllmd', 'mldld', 'dmlmd', '.ddd.'];
      const stems: { sx: number; top: number; big: boolean; leafLeft: boolean }[] =
        seed % 3 === 0
          ? [
              { sx: 4, top: -4, big: true, leafLeft: true },
              { sx: 11, top: 1, big: false, leafLeft: false },
            ]
          : [
              { sx: 3, top: 0, big: false, leafLeft: true },
              { sx: 8, top: -5, big: true, leafLeft: false },
              { sx: 13, top: 2, big: false, leafLeft: true },
            ];
      // 莖底的一點陰影
      c.fillStyle = 'rgba(0,0,0,0.16)';
      c.fillRect(x + 2, y + 13, 12, 2);
      for (const st of stems) {
        const sx = x + st.sx;
        const flowerH = st.big ? 7 : 5;
        const stemTop = y + st.top + flowerH - 1;
        // 莖
        px(c, '#2f6b3a', sx, stemTop, 1, y + 14 - stemTop);
        px(c, '#3f8a4a', sx, stemTop, 1, 2);
        // 葉子：莖中段一片，往左或往右
        const ly = Math.round((stemTop + y + 14) / 2);
        const d = st.leafLeft ? -1 : 1;
        px(c, '#3a7d45', sx + d, ly, 1, 1);
        px(c, '#3a7d45', sx + d * 2, ly - 1, 1, 2);
        px(c, '#5fae62', sx + d * 3, ly - 2, 1, 1);
        // 花
        const art = st.big ? BIG : SMALL;
        const fx = sx - Math.floor((art[0]?.length ?? 5) / 2);
        const fy = y + st.top;
        art.forEach((row, ry) => {
          for (let rx = 0; rx < row.length; rx += 1) {
            const col = COL[row[rx] ?? '.'];
            if (col) px(c, col, fx + rx, fy + ry, 1, 1);
          }
        });
        px(c, '#ffd6de', fx + 1, fy + 1, 1, 1);
        // 花托
        px(c, '#2f6b3a', sx - 1, fy + flowerH, 3, 1);
      }
      break;
    }
    case 'sunflower': {
      shadow(1);
      px(c, '#3f8a3a', x + 7, y + 4, 2, 10);
      px(c, '#3f8a3a', x + 9, y + 9, 3, 2);
      px(c, '#f6c945', x + 4, y - 2, 8, 8);
      px(c, '#e3a81f', x + 3, y + 1, 10, 2);
      px(c, '#6b4a2f', x + 6, y, 4, 4);
      break;
    }
    case 'bush': {
      shadow(1);
      px(c, '#2f6b3f', x + 1, y + 5, 14, 9);
      px(c, '#3f8a4a', x + 2, y + 3, 12, 8);
      px(c, '#5aa85e', x + 4, y + 4, 4, 2);
      px(c, '#5aa85e', x + 9, y + 6, 3, 2);
      break;
    }
    case 'mushroom': {
      shadow(1);
      px(c, '#f4eee2', x + 6, y + 8, 4, 6);
      px(c, '#d94a3a', x + 3, y + 4, 10, 5);
      px(c, '#ffffff', x + 5, y + 5, 2, 2);
      px(c, '#ffffff', x + 10, y + 6, 2, 2);
      break;
    }
    case 'tree':
    case 'sakura': {
      // 樹冠是幾團圓圓的葉子疊起來（不要一整塊方的）
      const sway = Math.round(Math.sin(seconds * 0.7 + tx) * 1);
      px(c, 'rgba(0,0,0,0.18)', x - 2, y + 12, 20, 4);
      px(c, '#5a3d2a', x + 6, y - 2, 4, 16);
      px(c, '#4a3220', x + 6, y - 2, 1, 16);
      const leaf = id === 'tree' ? ['#2f6b3f', '#3f8a4a', '#5aa85e'] : ['#d9708f', '#f4a3bf', '#fbd3e0'];
      const blob = (bx: number, by: number, r: number, color: string) => {
        c.fillStyle = color;
        c.beginPath();
        c.arc(x + 8 + bx + sway, y + by, r, 0, Math.PI * 2);
        c.fill();
      };
      blob(-6, -8, 7, leaf[0] ?? '#2f6b3f');
      blob(6, -8, 7, leaf[0] ?? '#2f6b3f');
      blob(0, -14, 8, leaf[0] ?? '#2f6b3f');
      blob(-5, -10, 5, leaf[1] ?? '#3f8a4a');
      blob(5, -10, 5, leaf[1] ?? '#3f8a4a');
      blob(0, -15, 6, leaf[1] ?? '#3f8a4a');
      blob(-2, -17, 2, leaf[2] ?? '#5aa85e');
      blob(5, -12, 2, leaf[2] ?? '#5aa85e');
      blob(-6, -9, 1.5, leaf[2] ?? '#5aa85e');
      // 櫻花：飄一兩片花瓣
      if (id === 'sakura') {
        const k = (seconds * 0.4 + tx * 0.3) % 1;
        px(c, '#fbd3e0', x + 2 + Math.round(k * 14), y - 4 + Math.round(k * 16), 2, 1);
      }
      break;
    }
    case 'bench': {
      px(c, 'rgba(0,0,0,0.18)', x + 2, y + 12, 28, 3);
      px(c, '#3a3d45', x + 3, y + 9, 2, 5);
      px(c, '#3a3d45', x + 27, y + 9, 2, 5);
      px(c, '#9c6b45', x + 1, y + 6, 30, 5);
      px(c, '#b9845a', x + 1, y + 6, 30, 1);
      px(c, '#8a5c3a', x + 1, y + 1, 30, 3);
      break;
    }
    case 'lamp': {
      shadow(1);
      px(c, '#3a3d45', x + 7, y - 8, 2, 22);
      px(c, '#2b2d33', x + 4, y - 12, 8, 5);
      px(c, lit ? '#ffe9a8' : '#c9b98a', x + 5, y - 11, 6, 3);
      px(c, '#3a3d45', x + 5, y + 12, 6, 2);
      break;
    }
    case 'pond': {
      px(c, '#8d8a83', x + 1, y + 2, 30, 28);
      px(c, '#3f9b92', x + 3, y + 4, 26, 24);
      px(c, '#5ab9ae', x + 5, y + 6, 22, 20);
      for (const [lx, ly] of [
        [8, 10],
        [18, 18],
        [20, 8],
      ] as const) {
        px(c, '#4f9a4a', x + lx, y + ly, 6, 4);
        px(c, '#f4a3bf', x + lx + 2, y + ly - 1, 2, 2);
      }
      if (Math.floor(seconds * 1.5) % 2 === 0) px(c, '#c8f0ea', x + 12, y + 14, 4, 1);
      break;
    }
    case 'fountain': {
      px(c, 'rgba(0,0,0,0.18)', x + 2, y + 26, 28, 4);
      px(c, '#a19e96', x + 2, y + 8, 28, 20);
      px(c, '#5ab9ae', x + 5, y + 11, 22, 14);
      px(c, '#8d8a83', x + 13, y + 6, 6, 14);
      px(c, '#a19e96', x + 11, y + 4, 10, 3);
      // 水柱往上噴、兩邊的水花往外落進池子
      const k = (seconds * 2) % 1;
      px(c, 'rgba(200, 240, 234, 0.9)', x + 15, y - 6, 2, 10);
      px(c, 'rgba(255, 255, 255, 0.9)', x + 15, y - 7 - Math.round(k * 2), 2, 2);
      px(c, 'rgba(200, 240, 234, 0.8)', x + 12 - Math.round(k * 3), y - 4 + Math.round(k * 12), 2, 2);
      px(c, 'rgba(200, 240, 234, 0.8)', x + 18 + Math.round(k * 3), y - 4 + Math.round(k * 12), 2, 2);
      break;
    }
    default:
      break;
  }
}
