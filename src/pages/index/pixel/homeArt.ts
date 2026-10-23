// 自己的家：花園擺設（可以用專注幣買、自己擺）。id 會存進帳號，只能往後加、不要改名。
// 座標都是世界座標（格 × 16px），x、y 是擺設佔的左上角那格。

import { layerCanvas, layerSize, px, spriteRes } from 'src/pages/index/pixel/pixelUtil';

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

// ── villa 花園中間的美人魚噴水池（固定的，不是花園擺設）：橢圓大理石池、中間礁石上坐著美人魚，
//    舉起的海螺噴出一道水弧落進池子；池邊四道小水柱、水面波光、池底許願硬幣，晚上水底燈亮 ──
export const MERMAID_FOUNTAIN = { cx: 10, cy: 17.4, rx: 74 / T, ry: 32 / T, face: 10 / T };

function ellipseRows(c: CanvasRenderingContext2D, color: string, cx: number, cy: number, rx: number, ry: number): void {
  c.fillStyle = color;
  for (let dy = -ry; dy <= ry; dy += 1) {
    const half = Math.round(rx * Math.sqrt(Math.max(0, 1 - (dy / ry) ** 2)));
    c.fillRect(Math.round(cx - half), Math.round(cy + dy), half * 2, 1);
  }
}

// 地面：噴水池四周鋪一圈碎石廣場，跟中間的石板步道接起來
export function paintFountainPlaza(c: CanvasRenderingContext2D): void {
  const f = MERMAID_FOUNTAIN;
  const cx = f.cx * T;
  const cy = f.cy * T + 2;
  ellipseRows(c, '#c9c1ae', cx, cy, f.rx * T + 18, f.ry * T + 14);
  ellipseRows(c, '#d9d2c3', cx, cy, f.rx * T + 16, f.ry * T + 12);
  let seed = 77;
  for (let i = 0; i < 420; i += 1) {
    seed = (seed * 16807) % 2147483647;
    const a = (seed / 2147483647) * Math.PI * 2;
    seed = (seed * 16807) % 2147483647;
    const r = Math.sqrt(seed / 2147483647);
    px(c, i % 2 ? '#c4bba8' : '#ebe5d8', Math.round(cx + Math.cos(a) * r * (f.rx * T + 15)), Math.round(cy + Math.sin(a) * r * (f.ry * T + 11)), 1, 1);
  }
  // 一圈白色石板鑲邊
  for (let i = 0; i < 28; i += 1) {
    const a = (i / 28) * Math.PI * 2;
    const x = Math.round(cx + Math.cos(a) * (f.rx * T + 13));
    const y = Math.round(cy + Math.sin(a) * (f.ry * T + 9));
    px(c, '#9a958a', x - 3, y - 1, 7, 4);
    px(c, '#f2efe8', x - 3, y - 2, 7, 3);
  }
}

export function drawMermaidFountain(c: CanvasRenderingContext2D, seconds: number, lit: boolean): void {
  const f = MERMAID_FOUNTAIN;
  const cx = Math.round(f.cx * T);
  const cy = Math.round(f.cy * T);
  const rx = Math.round(f.rx * T);
  const ry = Math.round(f.ry * T);
  const face = Math.round(f.face * T);
  // 池子：影子 → 前面的石壁 → 池緣 → 水
  ellipseRows(c, 'rgba(0,0,0,0.2)', cx + 2, cy + face + 3, rx + 2, ry);
  ellipseRows(c, '#a8a297', cx, cy + face, rx, ry);
  for (let k = -rx; k < rx; k += 8) px(c, 'rgba(0,0,0,0.12)', cx + k, cy + Math.round(ry * Math.sqrt(Math.max(0, 1 - (k / rx) ** 2))), 1, face);
  ellipseRows(c, '#e9e4da', cx, cy, rx, ry);
  ellipseRows(c, '#f8f5ef', cx, cy - 1, rx - 2, ry - 2);
  const wx = rx - 6;
  const wy = ry - 5;
  ellipseRows(c, '#3f9fb4', cx, cy + 1, wx, wy);
  ellipseRows(c, lit ? '#6fd3e6' : '#56b9cc', cx, cy + 1, wx - 3, wy - 2);
  // 池底的許願硬幣
  for (const [dx, dy] of [[-28, 6], [-18, 10], [22, 8], [31, 2], [-34, 0], [12, 12]] as const) {
    px(c, '#f6c945', cx + dx, cy + dy, 2, 1);
    px(c, '#fff3b0', cx + dx, cy + dy, 1, 1);
  }
  // 水面波光：一條條慢慢飄
  for (let i = 0; i < 14; i += 1) {
    const t = (seconds * 0.12 + i * 0.137) % 1;
    const ang = i * 2.399;
    const r = 0.25 + ((i * 0.37) % 0.65);
    const x = cx + Math.cos(ang + t * 0.6) * r * (wx - 6);
    const y = cy + 1 + Math.sin(ang + t * 0.6) * r * (wy - 3);
    const a = 0.35 + 0.35 * Math.sin(seconds * 2 + i);
    px(c, `rgba(255,255,255,${a.toFixed(2)})`, Math.round(x), Math.round(y), 3 + (i % 3), 1);
  }
  // 池邊四道小水柱往池心噴
  for (const side of [-1, 1]) {
    for (const k of [0.55, 0.85]) {
      const sx = cx + side * Math.round(wx * k);
      const sy = cy + 1 + Math.round(wy * Math.sqrt(1 - k * k)) - 1;
      for (let i = 0; i < 5; i += 1) {
        const t = (seconds * 1.4 + i / 5 + k) % 1;
        const x = sx - side * t * 12;
        const y = sy - 9 * t + 11 * t * t;
        px(c, 'rgba(225,248,252,0.9)', Math.round(x), Math.round(y), 1, 2);
      }
    }
  }
  // 中間一個巨大扇貝，兩隻美人魚坐在貝殼裡；水從貝殼頂端噴出來，往左右兩邊落進池子
  const shell = shellSprite();
  const size = layerSize(shell);
  c.drawImage(shell, cx - size.w / 2, cy + 4 - size.h, size.w, size.h);
  const lipY = cy + 1;
  drawMermaid(c, cx - 12, lipY - 3, 1, seconds, { hair: '#e0503a', hairDark: '#b23a2b', hairLight: '#ff8a66', shell: '#a86fd6', tail: '#2fb3a6', tailDark: '#1d8077', fin: '#6fe0d2' });
  drawMermaid(c, cx + 12, lipY - 3, -1, seconds + 1.7, { hair: '#f2c14e', hairDark: '#c9952a', hairLight: '#fff0a8', shell: '#f27aa6', tail: '#7a6fe0', tailDark: '#5248b0', fin: '#b3a8ff' });
  // 貝殼前緣（蓋住美人魚的腰），中間一顆珍珠
  const lip = lipSprite();
  const ls = layerSize(lip);
  c.drawImage(lip, cx - ls.w / 2, lipY - 4, ls.w, ls.h);
  drawTail(c, cx - 12, lipY - 3, 1, seconds, '#2fb3a6', '#1d8077', '#6fe0d2');
  drawTail(c, cx + 12, lipY - 3, -1, seconds + 1.7, '#7a6fe0', '#5248b0', '#b3a8ff');
  ellipseRows(c, '#d9d2e8', cx, lipY - 3, 3, 3);
  ellipseRows(c, '#ffffff', cx - 1, lipY - 4, 2, 2);
  if (lit) {
    const g = c.createRadialGradient(cx, lipY - 3, 1, cx, lipY - 3, 14);
    g.addColorStop(0, 'rgba(255,240,255,0.6)');
    g.addColorStop(1, 'rgba(255,240,255,0)');
    c.fillStyle = g;
    c.fillRect(cx - 14, lipY - 17, 28, 28);
  }
  // 貝殼頂端噴出的水柱，到頂分成左右兩道大水弧
  const crownY = cy + 4 - size.h + 2;
  const topY = crownY - 14;
  for (let i = 0; i < 10; i += 1) {
    const t = (seconds * 1.8 + i / 10) % 1;
    px(c, i % 2 ? '#ffffff' : '#d4f4ff', cx - 1 + (i % 2), Math.round(crownY - t * 14), 2, 2);
  }
  px(c, 'rgba(225,248,255,0.55)', cx - 1, topY, 3, 14);
  for (const side of [-1, 1]) {
    const landX = cx + side * 48;
    const landY = cy + 6;
    for (let i = 0; i < 22; i += 1) {
      const t = (i / 22 + seconds * 0.75 + (side > 0 ? 0.5 / 22 : 0)) % 1;
      const x = cx + side * t * 48;
      const y = topY - 6 * t + (landY - topY + 6) * t * t;
      px(c, 'rgba(70,160,200,0.45)', Math.round(x) - 1, Math.round(y) + 1, 3, 2);
      px(c, i % 3 === 0 ? '#ffffff' : '#d4f4ff', Math.round(x), Math.round(y), 2, 2);
    }
    for (let i = 0; i < 4; i += 1) {
      const t = (seconds * 2.2 + i / 4) % 1;
      px(c, 'rgba(230,250,255,0.9)', Math.round(landX + (i - 1.5) * 4 * t), Math.round(landY - 5 * t + 7 * t * t), 1, 1);
    }
    const ring = (seconds * 1.3 + (side > 0 ? 0.5 : 0)) % 1;
    c.strokeStyle = `rgba(255,255,255,${(0.85 * (1 - ring)).toFixed(2)})`;
    c.lineWidth = 1;
    c.beginPath();
    c.ellipse(landX, landY + 1, 2 + ring * 8, 1 + ring * 3, 0, 0, Math.PI * 2);
    c.stroke();
  }
  // 偶爾閃一下的亮點
  if (Math.sin(seconds * 3.1) > 0.85) {
    px(c, '#ffffff', cx - 20, cy - 2, 1, 3);
    px(c, '#ffffff', cx - 21, cy - 1, 3, 1);
  }
  if (lit) {
    const g = c.createRadialGradient(cx, cy, 2, cx, cy, rx);
    g.addColorStop(0, 'rgba(140,230,255,0.35)');
    g.addColorStop(1, 'rgba(140,230,255,0)');
    c.fillStyle = g;
    c.fillRect(cx - rx, cy - ry - 30, rx * 2, ry * 2 + 30);
  }
}

interface MermaidLook {
  hair: string;
  hairDark: string;
  hairLight: string;
  shell: string;
  tail: string;
  tailDark: string;
  fin: string;
}

// 巨大扇貝的後半片（立起來的扇形，一條條放射狀的稜）＋貝殼裡面：畫一次存起來
let shellCanvas: HTMLCanvasElement | null = null;
function shellSprite(): HTMLCanvasElement {
  if (shellCanvas) return shellCanvas;
  const R = 34;
  const w = R * 2 + 8;
  const h = R + 10;
  const { canvas, c } = layerCanvas(w, h, spriteRes());
  shellCanvas = canvas;
  if (!c) return canvas;
  const hx = w / 2;
  const hy = h - 6;
  const ribs = 11;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const dx = x + 0.5 - hx;
      const dy = hy - (y + 0.5);
      if (dy < -2) continue;
      const r = Math.hypot(dx, dy);
      const ang = Math.atan2(dy, dx);
      if (ang < -0.15 || ang > Math.PI + 0.15) continue;
      const k = (ang / Math.PI) * ribs;
      const edge = R - 2.6 * Math.abs(Math.sin(k * Math.PI));
      if (r > edge) continue;
      const frac = k - Math.floor(k);
      const groove = frac < 0.12 || frac > 0.88;
      const light = r / R;
      let col = Math.floor(k) % 2 === 0 ? '#f9dcd2' : '#f3c9bf';
      if (light > 0.85) col = Math.floor(k) % 2 === 0 ? '#fde9e2' : '#f8d8cf';
      if (groove) col = '#d9978c';
      if (r > edge - 1.2) col = '#c47f75';
      if (r < 7) col = '#e7aea4';
      // 同心的細紋
      if (!groove && Math.abs((r % 7) - 3.5) < 0.4) col = '#eab8ad';
      px(c, col, x, y, 1, 1);
    }
  }
  // 鉸鏈兩邊的小耳朵
  px(c, '#e7aea4', hx - 10, hy - 2, 6, 4);
  px(c, '#e7aea4', hx + 4, hy - 2, 6, 4);
  // 貝殼裡面（坐的地方）：深一點的粉紅
  ellipseRows(c, '#e3a197', hx, hy, 30, 6);
  ellipseRows(c, '#eeb6ac', hx, hy - 1, 27, 4);
  return canvas;
}

// 貝殼前緣：下半圈的唇邊，有一道道稜
let lipCanvas: HTMLCanvasElement | null = null;
function lipSprite(): HTMLCanvasElement {
  if (lipCanvas) return lipCanvas;
  const w = 66;
  const h = 12;
  const { canvas, c } = layerCanvas(w, h, spriteRes());
  lipCanvas = canvas;
  if (!c) return canvas;
  const hx = w / 2;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const nx = (x + 0.5 - hx) / 31;
      const ny = (y + 0.5 - 3) / 8;
      const inner = (x + 0.5 - hx) ** 2 / 27 ** 2 + (y + 0.5 - 2) ** 2 / 4 ** 2;
      if (nx * nx + ny * ny > 1 || inner < 1 || y < 3) continue;
      const rib = Math.floor((x + 3) / 6) % 2 === 0;
      let col = rib ? '#fbe3da' : '#f3c9bf';
      if ((x + 3) % 6 === 0) col = '#d9978c';
      if (nx * nx + ny * ny > 0.82) col = '#c47f75';
      px(c, col, x, y, 1, 1);
    }
  }
  return canvas;
}

// 美人魚上半身（腰以下被貝殼前緣蓋住，魚尾另外畫）：facing 1 = 面向右
function drawMermaid(c: CanvasRenderingContext2D, bx: number, by: number, facing: 1 | -1, seconds: number, look: MermaidLook): void {
  const p = (dx: number, dy: number, w: number, h: number, color: string) => px(c, color, facing > 0 ? bx + dx : bx - dx - w, by + dy, w, h);
  const skin = '#f7d2b6';
  const skinShade = '#e0ad8d';
  const hs = Math.round(Math.sin(seconds * 1.1) * 0.8);
  // 背後的長髮（先畫，被身體蓋住）
  p(-6 - hs, -19, 4, 12, look.hair);
  p(-7 - hs, -9, 4, 8, look.hair);
  p(-6 - hs, -2, 3, 3, look.hairDark);
  p(-5 - hs, -17, 1, 12, look.hairDark);
  p(-6 - hs, -8, 1, 5, look.hairLight);
  // 腰上一圈鱗片（腰以下在貝殼裡）
  p(-3, -2, 7, 3, look.tail);
  p(-2, -2, 1, 1, look.fin);
  p(1, -1, 1, 1, look.fin);
  // 身體
  p(-3, -12, 7, 10, skin);
  p(3, -12, 1, 10, skinShade);
  p(0, -5, 1, 1, skinShade);
  // 貝殼比基尼＋珍珠帶
  p(-3, -10, 3, 3, look.shell);
  p(1, -10, 3, 3, look.shell);
  p(-2, -10, 1, 1, '#ffffff');
  p(2, -10, 1, 1, '#ffffff');
  p(-3, -7, 7, 1, 'rgba(0,0,0,0.12)');
  // 手：靠外的手撐在貝殼邊，靠中間的手伸向珍珠
  p(-5, -11, 2, 8, skin);
  p(4, -10, 2, 3, skin);
  p(5, -8, 3, 2, skin);
  // 脖子、頭
  p(-1, -14, 3, 2, skin);
  p(-3, -22, 8, 8, skin);
  p(4, -21, 1, 6, skinShade);
  // 臉：大眼睛、腮紅、微笑（面向的那一邊）
  p(1, -19, 2, 2, '#2b2d33');
  p(1, -19, 1, 1, '#ffffff');
  p(-2, -19, 1, 2, '#2b2d33');
  p(2, -16, 2, 1, '#f59a9a');
  p(0, -15, 2, 1, '#c9473a');
  // 頭髮：頭頂蓬起來＋瀏海＋臉旁一撮
  p(-4, -24, 9, 3, look.hair);
  p(-3, -25, 7, 1, look.hair);
  p(-4, -22, 2, 6, look.hair);
  p(-1, -22, 5, 1, look.hair);
  p(4, -23, 2, 4, look.hair);
  p(-2, -25, 4, 1, look.hairLight);
  p(-4, -21, 1, 3, look.hairLight);
  p(3, -24, 2, 1, look.hairDark);
  // 海星髮飾
  p(4, -26, 3, 1, '#f6c945');
  p(5, -27, 1, 3, '#f6c945');
}

// 魚尾：從貝殼前緣往外側垂下來泡進水裡，尾鰭在水面上擺
function drawTail(c: CanvasRenderingContext2D, bx: number, by: number, facing: 1 | -1, seconds: number, tail: string, dark: string, fin: string): void {
  const p = (dx: number, dy: number, w: number, h: number, color: string) => px(c, color, facing > 0 ? bx + dx : bx - dx - w, by + dy, w, h);
  const sway = Math.round(Math.sin(seconds * 1.6));
  p(-6, 1, 7, 4, tail);
  p(-11, 3, 7, 4, tail);
  p(-16, 5, 7, 3, tail);
  p(-20, 6, 5, 3, tail);
  p(-11, 6, 6, 1, dark);
  p(-20, 8, 6, 1, dark);
  for (const [dx, dy] of [[-5, 2], [-3, 3], [-9, 4], [-7, 5], [-13, 6], [-15, 5], [-18, 7]] as const) p(dx, dy, 1, 1, fin);
  // 尾鰭：兩片大的往上翹
  p(-24 - sway, 2, 3, 6, fin);
  p(-27 - sway, -1, 3, 6, fin);
  p(-23 - sway, 0, 1, 3, '#ffffff');
  p(-26 - sway, -1, 1, 3, 'rgba(255,255,255,0.7)');
  p(-22, 7, 3, 2, tail);
}
