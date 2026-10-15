import { avatarColorsFor, getAvatarFrame } from 'src/pages/index/pixel/pixelArt';
import { px } from 'src/pages/index/pixel/pixelUtil';

// 環河公園的湖畔咖啡屋（參考富山環水公園那間「最美」的湖畔咖啡店）：
// 又薄又寬的白色平屋頂、深深的屋簷、整面落地窗，裡面是木頭牆、吊燈、吧台和靠窗坐著的客人。招牌是石虎。
// 全部是世界座標的像素（1 格 = 16px），由 RiverParkScene 決定擺在哪。

export interface CafeLook {
  lit: boolean;
  snow: boolean;
  seconds: number;
}

const FRAME = '#2c3036';

// ── 石虎招牌：綠色圓牌、白色內圈，中間是石虎的臉（額頭兩條白線、圓耳朵） ──
const CAT = [
  '.d......d.',
  'dcd....dcd',
  'dccddddccd',
  'dcwcwwcwcd',
  'dcdcwwcdcd',
  'dceccccecd',
  'dccwnnwccd',
  '.dcwwwwcd.',
  '..dddddd..',
];
const CAT_COLORS: Record<string, string> = { d: '#3b2a20', c: '#d39a5a', w: '#fff5e6', e: '#c9d84a', n: '#e58a8a' };

export function paintLeopardCatBadge(c: CanvasRenderingContext2D, cx: number, cy: number, size = 16): void {
  const r = size / 2;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const d = Math.hypot(x + 0.5 - r, y + 0.5 - r);
      if (d > r) continue;
      const ring = d > r - 2.6 && d < r - 1.2;
      px(c, ring ? '#ffffff' : '#0f7a4f', Math.round(cx - r) + x, Math.round(cy - r) + y);
    }
  }
  const ox = Math.round(cx - 5);
  const oy = Math.round(cy - 4);
  CAT.forEach((row, y) => {
    for (let x = 0; x < row.length; x += 1) {
      const color = CAT_COLORS[row[x] ?? '.'];
      if (color) px(c, color, ox + x, oy + y);
    }
  });
}

// ── 咖啡屋本體：x, y, w, h 是牆面的範圍（屋頂會往外多伸一點） ──
export function paintCafe(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, look: CafeLook): void {
  const { lit, snow, seconds } = look;
  const glassTop = y + 36;
  const glassBot = y + h - 8;
  const gh = glassBot - glassTop;
  const door = { x0: x + Math.round(w / 2) - 12, x1: x + Math.round(w / 2) + 12 };

  // 屋頂投在地上的影子
  px(c, 'rgba(0,0,0,0.2)', x - 10, y + h - 2, w + 24, 7);

  // 室內：木頭牆、木地板
  px(c, lit ? '#d39a5e' : '#c08a57', x, glassTop, w, 30);
  for (let sx = x + 1; sx < x + w; sx += 3) px(c, lit ? '#bd844c' : '#a87445', sx, glassTop, 1, 30);
  px(c, lit ? '#9a6a42' : '#8a5f3c', x, glassTop + 30, w, gh - 30);
  for (let fy = glassTop + 32; fy < glassBot; fy += 4) px(c, lit ? '#8b5d38' : '#7a5233', x, fy, w, 1);

  // 左邊的吧台：菜單板、咖啡機、甜點櫃，後面一位店員在做咖啡
  px(c, '#2f3a33', x + 10, glassTop + 3, 46, 8);
  for (let i = 0; i < 4; i += 1) px(c, '#e8e4d8', x + 13 + i * 11, glassTop + 5, 7, 1);
  for (let i = 0; i < 4; i += 1) px(c, '#cfc9b8', x + 13 + i * 11, glassTop + 8, 5, 1);
  const staff = getAvatarFrame({ ...avatarColorsFor('cafe-staff'), shirt: '#0f7a4f', shirtShade: '#0b5f3d' }, 'down', 'idle');
  c.drawImage(staff, 0, 0, 16, 14, x + 38, glassTop + 10, 16, 14);
  px(c, '#4b3324', x + 8, glassTop + 22, 50, 14);
  px(c, '#6e4a30', x + 8, glassTop + 22, 50, 3);
  px(c, '#c9ced6', x + 13, glassTop + 12, 12, 10);
  px(c, '#2b2d33', x + 13, glassTop + 12, 12, 2);
  px(c, '#e25a4a', x + 15, glassTop + 15, 1, 1);
  px(c, '#2b2d33', x + 16, glassTop + 18, 2, 3);
  px(c, '#2b2d33', x + 21, glassTop + 18, 2, 3);
  px(c, '#ffffff', x + 27, glassTop + 19, 2, 3);
  px(c, '#ffffff', x + 30, glassTop + 19, 2, 3);
  // 吧台上的甜點
  for (const [dx, color] of [
    [42, '#f7b6c8'],
    [46, '#f6c945'],
    [50, '#8a5a3c'],
  ] as const) {
    px(c, '#ffffff', x + dx - 1, glassTop + 21, 4, 1);
    px(c, color, x + dx, glassTop + 19, 2, 2);
  }
  // 右邊：杯子架和一大盆植物
  px(c, '#6e4a30', x + w - 48, glassTop + 8, 34, 2);
  px(c, '#6e4a30', x + w - 48, glassTop + 17, 34, 2);
  for (let i = 0; i < 6; i += 1) {
    px(c, i % 2 ? '#f4f2ea' : '#0f7a4f', x + w - 46 + i * 5, glassTop + 4, 3, 4);
    px(c, i % 3 ? '#e9dcc0' : '#f4f2ea', x + w - 45 + i * 5, glassTop + 13, 3, 4);
  }
  px(c, '#7a5236', x + w - 11, glassTop + 22, 7, 7);
  for (const [lx, ly, lw] of [
    [-14, 6, 9],
    [-9, 1, 8],
    [-16, 13, 8],
    [-7, 9, 7],
  ] as const) {
    px(c, '#2f7a45', x + w + lx, glassTop + ly, lw, 6);
    px(c, '#4c9a5c', x + w + lx + 1, glassTop + ly, lw - 3, 2);
  }

  // 吊燈：晚上整排亮起來
  for (let lx = x + 22; lx < x + w - 10; lx += 34) {
    px(c, '#3a3d45', lx, glassTop, 1, 8);
    px(c, '#2b2d33', lx - 2, glassTop + 8, 5, 3);
    px(c, lit ? '#fff1b8' : '#ffe3a1', lx - 1, glassTop + 11, 3, 1);
    if (lit) {
      c.fillStyle = 'rgba(255, 220, 140, 0.25)';
      c.fillRect(lx - 6, glassTop + 11, 13, 8);
    }
  }

  // 靠窗的長吧台＋坐在那裡看河的客人
  const barY = glassBot - 12;
  const guests = [
    { gx: x + 66, look: 'guest-a', item: 'cup' },
    { gx: x + 112, look: 'guest-b', item: 'laptop' },
    { gx: x + 133, look: 'guest-c', item: 'cup' },
    { gx: x + 158, look: 'guest-d', item: 'book' },
  ];
  for (const g of guests) {
    const sway = Math.sin(seconds * 0.7 + g.gx) > 0.85 ? 1 : 0;
    c.drawImage(getAvatarFrame(avatarColorsFor(g.look), 'down', 'idle'), 0, 0, 16, 15, g.gx - 8, barY - 13 - sway, 16, 15);
  }
  for (const [bx0, bx1] of [
    [x + 58, door.x0 - 2],
    [door.x1 + 2, x + w - 4],
  ] as const) {
    px(c, '#d8b07a', bx0, barY, bx1 - bx0, 3);
    px(c, '#b48a5c', bx0, barY + 3, bx1 - bx0, 1);
  }
  for (const g of guests) {
    if (g.item === 'cup') {
      px(c, '#ffffff', g.gx + 3, barY - 3, 3, 3);
      px(c, '#0f7a4f', g.gx + 3, barY - 2, 3, 1);
    } else if (g.item === 'laptop') {
      px(c, '#9aa3b2', g.gx - 5, barY - 5, 9, 5);
      px(c, lit ? '#cfe8ff' : '#b8c7d8', g.gx - 4, barY - 4, 7, 3);
    } else {
      px(c, '#e25a4a', g.gx - 4, barY - 2, 6, 2);
    }
  }

  // 落地窗：淡淡的玻璃色、斜斜的反光、細細的窗框
  c.fillStyle = lit ? 'rgba(255, 226, 170, 0.10)' : 'rgba(190, 228, 242, 0.20)';
  c.fillRect(x, glassTop, w, gh);
  const glare = lit ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.22)';
  for (const off of [6, 44, 96, 140]) {
    for (let i = 0; i < gh; i += 1) {
      const gx = x + off + Math.floor((gh - i) * 0.55);
      const gw = Math.min(5, x + w - gx);
      if (gw > 0) px(c, glare, gx, glassTop + i, gw, 1);
    }
  }
  for (let mx = x; mx <= x + w; mx += 22) px(c, FRAME, mx, glassTop, 1, gh);
  px(c, FRAME, x, glassTop, w, 2);
  px(c, FRAME, x, glassBot - 1, w, 1);
  // 玻璃門
  px(c, 'rgba(30, 40, 50, 0.18)', door.x0, glassTop + 4, door.x1 - door.x0, gh - 4);
  px(c, FRAME, door.x0, glassTop + 4, 1, gh - 4);
  px(c, FRAME, door.x1, glassTop + 4, 1, gh - 4);
  px(c, FRAME, door.x0, glassTop + 4, door.x1 - door.x0, 1);
  px(c, FRAME, Math.round((door.x0 + door.x1) / 2), glassTop + 4, 1, gh - 4);
  px(c, '#c9ced6', Math.round((door.x0 + door.x1) / 2) - 3, glassTop + 22, 1, 6);
  px(c, '#c9ced6', Math.round((door.x0 + door.x1) / 2) + 3, glassTop + 22, 1, 6);
  // 門邊玻璃上的石虎招牌
  paintLeopardCatBadge(c, door.x0 - 12, glassTop + 12, 14);

  // 基座
  px(c, '#d9d5cc', x - 2, glassBot, w + 4, 8);
  px(c, '#bdb8ad', x - 2, glassBot, w + 4, 1);

  // 撐住屋簷的細白柱子
  const rx = x - 12;
  const rw = w + 24;
  for (const cx of [rx + 4, rx + rw - 7]) {
    px(c, 'rgba(0,0,0,0.15)', cx + 1, glassBot + 6, 4, 2);
    px(c, '#f4f3ef', cx, y + 34, 3, glassBot + 7 - (y + 34));
    px(c, '#d4d1c9', cx + 2, y + 34, 1, glassBot + 7 - (y + 34));
  }

  // 平屋頂：從上面看是一大片淺灰白，前緣一條很薄的白色屋簷
  px(c, snow ? '#f7f9fb' : '#e8e6e0', rx, y - 4, rw, 34);
  for (let lx = rx + 8; lx < rx + rw; lx += 18) px(c, snow ? '#e6ecf2' : '#dcd9d1', lx, y - 4, 1, 34);
  px(c, snow ? '#ffffff' : '#f1efea', rx, y - 4, rw, 2);
  px(c, '#fbfaf7', rx, y + 30, rw, 3);
  px(c, '#b9b6ae', rx, y + 33, rw, 1);
  if (snow) {
    px(c, '#ffffff', rx - 1, y + 29, rw + 2, 3);
    for (let ix = rx + 6; ix < rx + rw; ix += 13) px(c, '#e3eef6', ix, y + 34, 1, 2 + (ix % 3));
  }
  // 屋簷在玻璃上方投下的影子
  c.fillStyle = 'rgba(0,0,0,0.22)';
  c.fillRect(x, glassTop, w, 5);
}

// 露台的木頭地板（畫在地上，座位、桌子、人都在它上面）
export function paintCafeDeck(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, snow: boolean): void {
  px(c, '#a7774c', x, y, w, h);
  for (let py = y; py < y + h; py += 4) px(c, '#946640', x, py, w, 1);
  for (let i = 0; i < 18; i += 1) px(c, '#946640', x + ((i * 37) % w), y + ((i * 11) % h), 1, 3);
  px(c, '#7d5535', x, y + h - 1, w, 2);
  if (snow) {
    c.fillStyle = 'rgba(255,255,255,0.55)';
    c.fillRect(x, y, w, 3);
    c.fillRect(x, y + h - 4, w, 3);
  }
}

// 門口的立式黑板菜單，上面也有石虎
export function paintMenuSign(c: CanvasRenderingContext2D, footX: number, footY: number): void {
  const x = Math.round(footX);
  const y = Math.round(footY);
  px(c, 'rgba(0,0,0,0.18)', x - 6, y, 12, 2);
  px(c, '#6e4a30', x - 6, y - 18, 12, 18);
  px(c, '#2f3a33', x - 5, y - 17, 10, 14);
  paintLeopardCatBadge(c, x, y - 13, 6);
  for (let i = 0; i < 3; i += 1) px(c, '#e8e4d8', x - 3, y - 9 + i * 2, 6 - (i % 2) * 2, 1);
}

// ── 店員：長髮綁緞帶、白襯衫綠圍裙。16×20，跟一般人物一樣大 ──
const BARISTA_ROWS = [
  '.....oooooo.....',
  '....oHHHHHHorr..',
  '...oHHhhHHHHorr.',
  '..oHHHHHHHHHHo..',
  '..oHHHHHHHHHHo..',
  '..oHHSHHHHSHHo..',
  '..oHSSSSSSSSHo..',
  '.oHSweSSSSweSHo.',
  '.oHSeeSSSSeeSHo.',
  '.oHSbSSmmSSbSHo.',
  '.oHHSSSSSSSSHHo.',
  '.oHHoSSSSSSoHHo.',
  '.oHHHooWWooHHHo.',
  '.oHoWGGGGGGWoHo.',
  '..oSoGGWWGGoSo..',
  '..oSoGGGGGGoSo..',
  '...ooggggggoo...',
  '....oLLLLLLo....',
  '....oSSooSSo....',
  '....oFFooFFo....',
];
const BARISTA_COLORS: Record<string, string> = {
  o: '#2b2135',
  H: '#5a3527',
  h: '#86533b',
  r: '#f28ab2',
  S: '#f8d8bf',
  e: '#3a2a40',
  w: '#ffffff',
  b: '#f7a6b0',
  m: '#d26b7a',
  W: '#fbf7f0',
  G: '#0f7a4f',
  g: '#0b5f3d',
  L: '#3a3d45',
  F: '#2b2135',
};

export type BaristaFrame = 'idle' | 'blink' | 'wave';
const baristaCache = new Map<BaristaFrame, HTMLCanvasElement>();

function baristaRows(frame: BaristaFrame): string[] {
  const rows = [...BARISTA_ROWS];
  if (frame === 'blink') {
    rows[7] = '.oHSSSSSSSSSSHo.';
    rows[8] = '.oHSeeSSSSeeSHo.';
  }
  if (frame === 'wave') {
    // 右手舉起來揮
    rows[9] = '.oHSbSSmmSSbSHoo';
    rows[10] = '.oHHSSSSSSSSHHoS';
    rows[11] = '.oHHoSSSSSSoHHoS';
    rows[12] = '.oHHHooWWooHHHoS';
    rows[13] = '.oHoWGGGGGGWoHoo';
    rows[14] = '..oSoGGWWGGoo...';
    rows[15] = '..oSoGGGGGGo....';
  }
  return rows;
}

export function getBaristaFrame(frame: BaristaFrame): HTMLCanvasElement {
  const cached = baristaCache.get(frame);
  if (cached) return cached;
  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 20;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    baristaRows(frame).forEach((row, y) => {
      for (let x = 0; x < row.length; x += 1) {
        const color = BARISTA_COLORS[row[x] ?? '.'];
        if (color) px(ctx, color, x, y);
      }
    });
  }
  baristaCache.set(frame, canvas);
  return canvas;
}

// ── YouBike 站（跟圖書館外面那幾站同一個樣子）：x, y 是左上角，寬 3 格 ──
export function paintBikeRack(c: CanvasRenderingContext2D, x: number, y: number, bikes: number, snow: boolean): void {
  const w = 48;
  px(c, 'rgba(0,0,0,0.15)', x + 1, y + 12, w - 2, 3);
  px(c, '#c3cad6', x, y + 11, w, 3);
  for (let i = 0; i < 3; i += 1) {
    const bx = x + i * 16 + 2;
    px(c, '#2b2d33', bx + 5, y + 8, 2, 4);
    if (i >= bikes) continue;
    px(c, '#2b2d33', bx, y + 3, 1, 9);
    px(c, '#2b2d33', bx + 11, y + 3, 1, 9);
    px(c, '#2b2d33', bx, y + 6, 12, 1);
    px(c, '#f6c945', bx + 2, y + 5, 8, 2);
    px(c, '#f6c945', bx + 4, y + 2, 2, 4);
    px(c, '#e25a4a', bx + 3, y + 1, 4, 1);
  }
  px(c, '#3a3d45', x + w - 4, y - 14, 2, 26);
  px(c, '#f6c945', x + w - 10, y - 18, 14, 7);
  px(c, '#e25a4a', x + w - 8, y - 16, 10, 3);
  if (snow) px(c, '#ffffff', x + w - 10, y - 19, 14, 1);
}
