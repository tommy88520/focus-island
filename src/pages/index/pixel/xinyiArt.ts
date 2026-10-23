// 主地圖北邊的台北車站、東邊的四四南村（美術）。座標跟主地圖同一套（格，1 格 = 16px），位置在 xinyi.ts。
// 台北車站：米色立面、兩層的傳統大屋頂、「臺北車站」匾額；中間的大廳是開的，黑白格子地板、出發看板、閘門（走到閘門前搭車）。
// 四四南村：信義公民會館、眷村文物館的老平房（黑瓦、紅磚、綠窗、春聯）、好丘、竹籬笆、阿伯下象棋的榕樹下、大草坪和週末簡單市集。
import { XY } from './xinyi';
import { layerCanvas, layerSize, px, seeded, spriteRes } from './pixelUtil';

const T = 16;

function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, font: string, align: CanvasTextAlign = 'center'): void {
  c.fillStyle = color;
  c.font = font;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(s, x, y);
}

const ZH = '"PingFang TC", "Noto Sans TC", sans-serif';

// ── 地面（畫一次）──

// 站前廣場：淺灰花崗岩方磚、中間一條往大廳的步道（導盲磚）、左右兩塊草坪（杜鵑花圃）
export function paintStationGround(c: CanvasRenderingContext2D, top: number): void {
  const rand = seeded(919);
  const x0 = 0;
  const x1 = XY.villageX0 * T;
  const y0 = top * T;
  const y1 = 0;
  px(c, '#cfcbc3', x0, y0, x1 - x0, y1 - y0);
  for (let y = y0; y < y1; y += 16) {
    for (let x = x0; x < x1; x += 16) {
      px(c, '#bdb8af', x, y, 16, 1);
      px(c, '#bdb8af', x, y, 1, 16);
      if (rand() < 0.25) px(c, '#d8d4cd', x + 2 + Math.floor(rand() * 10), y + 2 + Math.floor(rand() * 10), 3, 2);
    }
  }
  // 車站和村子中間那條小路的樹下：深一點的地磚
  // 往大廳的步道：深灰鑲邊＋中間一條黃色導盲磚
  const wx0 = (XY.hall.x0 + 2) * T;
  const wx1 = (XY.hall.x1 - 2) * T;
  const wTop = XY.hall.y1 * T;
  px(c, '#b3aea4', wx0 - 3, wTop, 3, -wTop);
  px(c, '#b3aea4', wx1, wTop, 3, -wTop);
  px(c, '#d9d5ce', wx0, wTop, wx1 - wx0, -wTop);
  for (let y = wTop; y < 0; y += 8) for (let x = wx0; x < wx1; x += 8) if (((x - wx0) / 8 + (y - wTop) / 8) % 2 === 0) px(c, '#cdc8bf', x, y, 8, 8);
  const tx = 16 * T - 4;
  px(c, '#e8c13a', tx, wTop + 2, 8, -wTop - 2);
  for (let y = wTop + 3; y < -1; y += 3) {
    px(c, '#c9a225', tx + 1, y, 2, 1);
    px(c, '#c9a225', tx + 5, y, 2, 1);
  }
  // 大廳門口三階台階
  for (let i = 0; i < 3; i += 1) {
    px(c, i % 2 ? '#e3dfd8' : '#d2cdc5', XY.hall.x0 * T - 6 + i * 2, XY.hall.y1 * T + i * 3, (XY.hall.x1 - XY.hall.x0) * T + 12 - i * 4, 3);
  }
  // 草坪：矮矮的黃楊綠籬圍一圈、四個角落種杜鵑
  for (const lawn of XY.lawns) {
    const lx = lawn.x0 * T;
    const ly = lawn.y0 * T;
    const lw = (lawn.x1 - lawn.x0) * T;
    const lh = (lawn.y1 - lawn.y0) * T;
    px(c, '#4f7d3a', lx - 3, ly - 3, lw + 6, lh + 6);
    px(c, '#6a9c47', lx - 2, ly - 2, lw + 4, lh + 4);
    px(c, '#82b35b', lx, ly, lw, lh);
    for (let i = 0; i < 160; i += 1) px(c, rand() < 0.5 ? '#8fc066' : '#74a64f', lx + Math.floor(rand() * lw), ly + Math.floor(rand() * lh), 2, 1);
    for (let x = lx - 3; x < lx + lw + 3; x += 4) {
      px(c, '#3f6b2e', x, ly - 3, 2, 1);
      px(c, '#3f6b2e', x + 2, ly + lh + 2, 2, 1);
    }
    for (const [cx, cy] of [
      [lx + 6, ly + 5],
      [lx + lw - 14, ly + 5],
      [lx + 6, ly + lh - 10],
      [lx + lw - 14, ly + lh - 10],
    ] as const) {
      px(c, '#3d6b2f', cx - 1, cy, 11, 6);
      for (let k = 0; k < 9; k += 1) px(c, k % 3 === 0 ? '#ffd1e3' : '#ef5f97', cx + Math.floor(rand() * 9), cy + Math.floor(rand() * 5), 2, 2);
    }
  }
}

// 四四南村：水泥巷弄、好丘前的木平台、竹籬笆裡的小菜園、往草坪的石板步道、大草坪
export function paintVillageGround(c: CanvasRenderingContext2D, top: number, libraryHeight: number, right: number): void {
  const rand = seeded(4444);
  const x0 = XY.villageX0 * T;
  const x1 = right * T;
  const y0 = top * T;
  const y1 = libraryHeight * T;
  // 灰灰舊舊的水泥地，有裂縫跟補過的痕跡
  px(c, '#b9b4aa', x0, y0, x1 - x0, y1 - y0);
  for (let i = 0; i < 700; i += 1) px(c, rand() < 0.5 ? '#aca69b' : '#c6c1b7', x0 + Math.floor(rand() * (x1 - x0)), y0 + Math.floor(rand() * (y1 - y0)), 2, 1);
  for (let i = 0; i < 14; i += 1) {
    let cx = x0 + Math.floor(rand() * (x1 - x0));
    let cy = y0 + Math.floor(rand() * (y1 - y0));
    for (let k = 0; k < 8; k += 1) {
      px(c, '#9a948a', cx, cy, 1, 1);
      cx += Math.round(rand() * 2 - 0.5);
      cy += 1;
    }
  }
  // 好丘前面的木平台
  const d = XY.deck;
  px(c, '#7a5232', d.x0 * T, d.y0 * T, (d.x1 - d.x0) * T, (d.y1 - d.y0) * T);
  for (let y = d.y0 * T; y < d.y1 * T; y += 5) {
    px(c, '#a87a4c', d.x0 * T, y, (d.x1 - d.x0) * T, 4);
    px(c, '#b98b5a', d.x0 * T, y, (d.x1 - d.x0) * T, 1);
    for (let x = d.x0 * T + ((y / 5) % 2 ? 10 : 30); x < d.x1 * T; x += 40) px(c, '#7a5232', x, y, 1, 4);
  }
  // 榕樹下：泥土地＋落葉
  const g = XY.chessGarden;
  px(c, '#a58a64', g.x0 * T, g.y0 * T, (g.x1 - g.x0) * T, (g.y1 - g.y0) * T);
  for (let i = 0; i < 160; i += 1) px(c, rand() < 0.4 ? '#8c7350' : rand() < 0.5 ? '#6f8f3e' : '#b89c74', g.x0 * T + Math.floor(rand() * (g.x1 - g.x0) * T), g.y0 * T + Math.floor(rand() * (g.y1 - g.y0) * T), 2, 1);
  // 曬衣服的小院子：菜圃兩畦
  const yard = XY.yard;
  px(c, '#93a35a', yard.x0 * T, yard.y0 * T, (yard.x1 - yard.x0) * T, (yard.y1 - yard.y0) * T);
  for (let row = 0; row < 2; row += 1) {
    const ry = yard.y0 * T + 6 + row * 18;
    px(c, '#7a5a3a', yard.x0 * T + 6, ry, (yard.x1 - yard.x0) * T - 12, 10);
    for (let x = yard.x0 * T + 9; x < yard.x1 * T - 8; x += 6) {
      px(c, '#4f8a35', x, ry + 1, 3, 4);
      px(c, '#6fb04a', x + 1, ry, 1, 2);
    }
  }
  // 往草坪的石板步道
  const p = XY.path;
  px(c, '#a8a296', p.x0 * T, p.y0 * T, (p.x1 - p.x0) * T, (p.y1 - p.y0) * T);
  for (let x = p.x0 * T; x < p.x1 * T; x += 18) {
    for (let row = 0; row < 3; row += 1) {
      const sx = x + (row % 2 ? 9 : 0);
      const sy = p.y0 * T + 3 + row * 15;
      px(c, '#8e887d', sx + 1, sy + 1, 15, 12);
      px(c, '#d4cfc4', sx, sy, 15, 12);
      px(c, '#e4e0d7', sx + 1, sy + 1, 6, 1);
    }
  }
  // 大草坪（往南接到海灘）
  const l = XY.villageLawn;
  px(c, '#76a852', l.x0 * T, l.y0 * T, (l.x1 - l.x0) * T, (l.y1 - l.y0) * T);
  for (let i = 0; i < 600; i += 1) px(c, rand() < 0.5 ? '#84b65d' : '#6a9a48', l.x0 * T + Math.floor(rand() * (l.x1 - l.x0) * T), l.y0 * T + Math.floor(rand() * (l.y1 - l.y0) * T), 2, 1);
  for (let i = 0; i < 26; i += 1) {
    const fx = l.x0 * T + Math.floor(rand() * (l.x1 - l.x0) * T);
    const fy = l.y0 * T + Math.floor(rand() * (l.y1 - l.y0) * T);
    px(c, rand() < 0.5 ? '#fff6c2' : '#ffffff', fx, fy, 1, 1);
  }
}

// ── 台北車站（底圖：後面一直到地圖上緣都進不去，所以直接畫進底圖）──

function windowCell(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
  px(c, '#6b4f33', x - 1, y - 1, w + 2, h + 2);
  px(c, '#36404e', x, y, w, h);
  px(c, '#4a5668', x, y, w, 2);
  for (let k = y + 6; k < y + h; k += 7) px(c, '#6b4f33', x, k, w, 1);
  if (w > 6) px(c, '#6b4f33', x + Math.floor(w / 2), y, 1, h);
  px(c, 'rgba(255,255,255,0.18)', x + 1, y + 2, 1, h - 3);
}

// 正面看的屋頂（瓦片一排排，兩端的簷角往上翹）：bottom 寬、top 窄
function roofSlope(c: CanvasRenderingContext2D, bx0: number, bx1: number, by: number, tx0: number, tx1: number, ty: number, tile: string, tileDark: string, tileLight: string): void {
  const h = by - ty;
  for (let i = 0; i < h; i += 1) {
    const t = i / h;
    const l = Math.round(bx0 + (tx0 - bx0) * t);
    const r = Math.round(bx1 + (tx1 - bx1) * t);
    px(c, i % 4 === 0 ? tileDark : tile, l, by - i, r - l, 1);
  }
  // 筒瓦一條條（直的）
  for (let x = tx0 + 3; x < tx1 - 2; x += 5) {
    const t0 = (x - tx0) / (tx1 - tx0);
    const bx = Math.round(bx0 + (bx1 - bx0) * t0);
    for (let i = 0; i < h; i += 1) {
      const t = i / h;
      px(c, tileLight, Math.round(bx + (x - bx) * t), by - i, 1, 1);
    }
  }
  // 簷口一條深色＋白色瓦當
  px(c, tileDark, bx0, by - 1, bx1 - bx0, 3);
  for (let x = bx0 + 2; x < bx1 - 2; x += 5) px(c, '#e9dfc6', x, by, 2, 2);
  // 簷角上翹
  for (const [x, dir] of [
    [bx0, -1],
    [bx1, 1],
  ] as const) {
    px(c, tileDark, x + (dir < 0 ? -6 : 0), by - 3, 6, 3);
    px(c, tileDark, x + (dir < 0 ? -9 : 6), by - 6, 3, 4);
    px(c, '#c9a24a', x + (dir < 0 ? -10 : 8), by - 8, 2, 2);
  }
}

// 立面高度、大廳後牆露出來的高度（上面掛看板、下面一排閘門）
const FACADE_H = 84;
const BACK_WALL_H = 24;

export function paintTaipeiStation(c: CanvasRenderingContext2D): void {
  const s = XY.station;
  const X0 = s.x0 * T;
  const X1 = s.x1 * T;
  const G = s.y1 * T;
  const FT = G - FACADE_H;
  const HX0 = XY.hall.x0 * T;
  const HX1 = XY.hall.x1 * T;
  const HY = XY.hall.y0 * T;
  const OPEN_TOP = HY - BACK_WALL_H;
  const wall = '#ddcca6';
  const wallShade = '#c8b58c';
  const tile = '#6e5a3e';
  const tileDark = '#4a3b28';
  const tileLight = '#8a7452';
  // 地上的影子
  px(c, 'rgba(0,0,0,0.18)', X0 + 4, G - 2, X1 - X0, 6);
  // ── 屋頂（先畫上面那層）──
  const midX = (X0 + X1) / 2;
  const clX0 = X0 + 40;
  const clX1 = X1 - 40;
  const roofTop = FT - 60;
  // 上層屋頂
  roofSlope(c, clX0 - 18, clX1 + 18, FT - 36, clX0 + 46, clX1 - 46, roofTop + 7, tile, tileDark, tileLight);
  // 正脊＋兩端鴟吻
  px(c, tileDark, clX0 + 40, roofTop + 2, clX1 - clX0 - 80, 6);
  px(c, '#8a7452', clX0 + 40, roofTop + 2, clX1 - clX0 - 80, 1);
  for (const [x, dir] of [
    [clX0 + 40, -1],
    [clX1 - 40, 1],
  ] as const) {
    px(c, tileDark, x - 4, roofTop - 6, 8, 12);
    px(c, tileDark, x + dir * 4 - (dir < 0 ? 4 : 0), roofTop - 10, 4, 6);
    px(c, '#c9a24a', x - 1, roofTop - 4, 2, 2);
  }
  // 兩層屋頂中間那一圈牆（高窗）＋「臺北車站」匾額
  px(c, wall, clX0, FT - 36, clX1 - clX0, 18);
  px(c, wallShade, clX0, FT - 20, clX1 - clX0, 2);
  for (let x = clX0 + 8; x < clX1 - 8; x += 14) {
    if (Math.abs(x + 3 - midX) < 70) continue;
    windowCell(c, x, FT - 32, 6, 9);
  }
  px(c, '#2a160e', midX - 62, FT - 37, 124, 20);
  px(c, '#5a2a1c', midX - 61, FT - 36, 122, 18);
  px(c, '#c9a24a', midX - 61, FT - 36, 122, 1);
  px(c, '#c9a24a', midX - 61, FT - 19, 122, 1);
  text(c, '臺 北 車 站', midX, FT - 27, '#f6d77a', `900 12px ${ZH}`);
  // 下層屋頂（整排）
  roofSlope(c, X0 - 12, X1 + 12, FT, X0 + 14, X1 - 14, FT - 18, tile, tileDark, tileLight);
  // ── 立面 ──
  px(c, wall, X0, FT, X1 - X0, G - FT);
  for (let y = FT + 3; y < G; y += 4) px(c, 'rgba(0,0,0,0.035)', X0, y, X1 - X0, 1);
  px(c, tileDark, X0, FT, X1 - X0, 3);
  // 壁柱＋窗：兩層，中間大廳的門洞跳過
  for (let x = X0; x < X1; x += 24) {
    px(c, wallShade, x, FT + 3, 4, G - FT - 9);
    px(c, '#e8d9b8', x, FT + 3, 1, G - FT - 9);
    const wx = x + 8;
    if (wx + 10 > HX0 - 6 && wx < HX1 + 6) continue;
    if (wx + 10 > X1 - 2) continue;
    windowCell(c, wx, FT + 8, 10, 12);
    windowCell(c, wx, FT + 28, 10, 40);
  }
  // 兩端的側門（也有亮燈的玻璃門）
  for (const x of [X0 + 10, X1 - 34]) {
    px(c, '#9a8a6a', x - 2, G - 30, 28, 30);
    px(c, '#3a4553', x, G - 28, 24, 28);
    px(c, '#56657a', x, G - 28, 24, 3);
    px(c, '#9a8a6a', x + 11, G - 28, 2, 28);
  }
  // 花崗岩底座
  px(c, '#9a958d', X0, G - 6, X1 - X0, 6);
  px(c, '#b5b0a7', X0, G - 6, X1 - X0, 1);
  // ── 大廳門洞：石框、裡面的後牆、黑白格子地板 ──
  px(c, '#b9a682', HX0 - 6, OPEN_TOP - 6, HX1 - HX0 + 12, G - OPEN_TOP + 6);
  px(c, '#cdbb95', HX0 - 5, OPEN_TOP - 5, HX1 - HX0 + 10, 2);
  // 門楣上的英文站名
  px(c, '#3a2a1c', HX0 + 20, OPEN_TOP - 12, HX1 - HX0 - 40, 9);
  text(c, 'TAIPEI MAIN STATION', (HX0 + HX1) / 2, OPEN_TOP - 7.5, '#f2d27a', `700 6px ${ZH}`);
  // 後牆（奶油色，上面掛看板、下面是閘門：都是會動的，另外畫）
  px(c, '#efe8d8', HX0, OPEN_TOP, HX1 - HX0, HY - OPEN_TOP);
  px(c, '#d9d0bd', HX0, HY - 3, HX1 - HX0, 3);
  // 天花板的燈
  for (let x = HX0 + 10; x < HX1 - 6; x += 20) px(c, '#fff8e0', x, OPEN_TOP + 1, 8, 1);
  // 黑白格子地板（台北車站大廳的招牌）
  for (let y = HY; y < G; y += 16) {
    for (let x = HX0; x < HX1; x += 16) {
      const dark = ((x - HX0) / 16 + (y - HY) / 16) % 2 === 0;
      px(c, dark ? '#2c2c33' : '#ebe7df', x, y, 16, 16);
      px(c, dark ? '#3a3a42' : '#f7f4ee', x + 1, y + 1, 5, 1);
    }
  }
  // 門洞兩側的內牆陰影
  px(c, 'rgba(0,0,0,0.22)', HX0, OPEN_TOP, 4, G - OPEN_TOP);
  px(c, 'rgba(0,0,0,0.12)', HX1 - 3, OPEN_TOP, 3, G - OPEN_TOP);
  px(c, 'rgba(0,0,0,0.15)', HX0, OPEN_TOP, HX1 - HX0, 3);
}

// 大廳後牆的出發看板（橘色 LED 跑馬燈）＋一排閘門：人站在閘門前就要蓋過它們，所以另外排前後
const BOARD = ['F1 月台 F1 Platform', '北投 Beitou', '劍潭 Jiantan', '基隆 Keelung', '動物園 Taipei Zoo', '環河公園 Riverside Park'];
export function drawStationGates(c: CanvasRenderingContext2D, seconds: number, night: boolean): void {
  const HX0 = XY.hall.x0 * T;
  const HX1 = XY.hall.x1 * T;
  const HY = XY.hall.y0 * T;
  const top = HY - BACK_WALL_H + 2;
  // 看板
  const bx0 = HX0 + 18;
  const bw = HX1 - HX0 - 36;
  px(c, '#15161c', bx0 - 2, top - 1, bw + 4, 12);
  px(c, '#08090c', bx0, top, bw, 10);
  c.save();
  c.beginPath();
  c.rect(bx0, top, bw, 10);
  c.clip();
  const line = BOARD.map((s, i) => `${s}  ${String(18 + Math.floor(i / 3)).padStart(2, '0')}:${String((i * 7 + 5) % 60).padStart(2, '0')}  準點`).join('   ·   ');
  c.font = `700 7px ${ZH}`;
  const w = c.measureText(line).width + 40;
  const off = (seconds * 18) % w;
  text(c, line, bx0 + bw - off, top + 5.5, '#ffb347', `700 7px ${ZH}`, 'left');
  text(c, line, bx0 + bw - off + w, top + 5.5, '#ffb347', `700 7px ${ZH}`, 'left');
  c.restore();
  // 看板兩邊的路線色條（紅、綠、藍、棕、橘）
  ['#e3002c', '#008659', '#0070bd', '#c48c31', '#f39800'].forEach((col, i) => {
    px(c, col, bx0 - 12, top + i * 2, 8, 2);
    px(c, col, bx0 + bw + 4, top + i * 2, 8, 2);
  });
  // 閘門：灰色機台，中間綠色箭頭亮著
  const gy = HY - 1;
  for (let k = 0; k < 7; k += 1) {
    const gx = HX0 + 22 + k * 19;
    px(c, 'rgba(0,0,0,0.2)', gx, gy, 7, 2);
    px(c, '#9aa0aa', gx, gy - 11, 7, 11);
    px(c, '#d9dce2', gx, gy - 11, 7, 3);
    px(c, k % 3 === 1 ? '#e25a4a' : '#3dd68c', gx + 2, gy - 7, 3, 2);
    if (k < 6) {
      const open = Math.sin(seconds * 1.3 + k * 1.7) > 0.6;
      px(c, '#e8eaee', gx + 7, gy - 7, open ? 2 : 6, 2);
      px(c, '#e8eaee', gx + (open ? 17 : 13), gy - 7, open ? 2 : 6, 2);
    }
  }
  if (night) {
    const g = c.createRadialGradient((HX0 + HX1) / 2, HY + 10, 4, (HX0 + HX1) / 2, HY + 10, 90);
    g.addColorStop(0, 'rgba(255,248,220,0.22)');
    g.addColorStop(1, 'rgba(255,248,220,0)');
    c.fillStyle = g;
    c.fillRect(HX0, top, HX1 - HX0, XY.station.y1 * T - top);
  }
}

// 晚上立面的窗都亮起來（底圖的窗是暗的）
export function drawStationNight(c: CanvasRenderingContext2D, seconds: number): void {
  const s = XY.station;
  const X0 = s.x0 * T;
  const X1 = s.x1 * T;
  const G = s.y1 * T;
  const FT = G - FACADE_H;
  const HX0 = XY.hall.x0 * T;
  const HX1 = XY.hall.x1 * T;
  for (let x = X0; x < X1; x += 24) {
    const wx = x + 8;
    if (wx + 10 > HX0 - 6 && wx < HX1 + 6) continue;
    if (wx + 10 > X1 - 2) continue;
    const flick = Math.sin(seconds * 0.3 + x) > -0.8;
    if (flick) px(c, 'rgba(255,214,130,0.75)', wx, FT + 8, 10, 12);
    px(c, 'rgba(255,224,150,0.8)', wx, FT + 28, 10, 40);
  }
  px(c, 'rgba(255,215,120,0.35)', (X0 + X1) / 2 - 62, FT - 37, 124, 20);
}

// ── 四四南村的老平房 ──

interface HouseOpts {
  plaque?: string;
  address?: string;
  seed: number;
  ac?: boolean;
}

// 眷村平房（正面）：黑瓦屋頂、下半紅磚上半白牆、綠色木窗、紅門貼春聯
function paintVillageHouse(c: CanvasRenderingContext2D, x0: number, x1: number, bottom: number, o: HouseOpts): void {
  const rand = seeded(o.seed);
  const w = x1 - x0;
  const wallH = 32;
  const roofH = 24;
  const wallTop = bottom - wallH;
  px(c, 'rgba(0,0,0,0.18)', x0 + 3, bottom - 2, w, 5);
  // 屋頂：深灰水泥瓦，兩端的山牆露出來
  roofSlope(c, x0 - 6, x1 + 6, wallTop, x0 + 10, x1 - 10, wallTop - roofH, '#4a4d55', '#2f3238', '#5e626b', );
  px(c, '#2f3238', x0 + 8, wallTop - roofH - 2, w - 16, 3);
  // 牆：上半白（有點舊的水漬）、下半紅磚
  px(c, '#e6e0d2', x0, wallTop, w, wallH);
  for (let i = 0; i < 6; i += 1) px(c, 'rgba(120,110,90,0.12)', x0 + Math.floor(rand() * (w - 10)), wallTop + 2, 6 + Math.floor(rand() * 8), 8 + Math.floor(rand() * 8));
  const brickTop = bottom - 14;
  px(c, '#a5523c', x0, brickTop, w, 14);
  for (let y = brickTop; y < bottom; y += 4) {
    px(c, '#c9bfae', x0, y, w, 1);
    for (let x = x0 + ((y - brickTop) / 4 % 2 ? 4 : 0); x < x1; x += 8) px(c, '#c9bfae', x, y, 1, 4);
  }
  // 門：紅色木門＋春聯、門上一塊匾
  const door = x0 + Math.round(w * 0.36);
  px(c, '#6b2a1e', door - 1, bottom - 22, 16, 22);
  px(c, '#b8402f', door, bottom - 21, 14, 21);
  px(c, '#9a3324', door + 7, bottom - 21, 1, 21);
  px(c, '#f2c14e', door + 5, bottom - 11, 1, 2);
  px(c, '#f2c14e', door + 9, bottom - 11, 1, 2);
  px(c, '#d82e2e', door - 4, bottom - 20, 3, 14);
  px(c, '#d82e2e', door + 15, bottom - 20, 3, 14);
  px(c, '#d82e2e', door + 2, bottom - 25, 10, 3);
  text(c, '福', door + 7, bottom - 15, '#2b1a14', `900 5px ${ZH}`);
  // 綠色木窗（白框、鐵窗花）
  const windows = [x0 + 8, x0 + w - 24].filter((wx) => wx + 16 < door - 2 || wx > door + 18);
  for (const wx of windows) {
    px(c, '#f4efe6', wx - 1, wallTop + 5, 18, 14);
    px(c, '#3f8f8a', wx, wallTop + 6, 16, 12);
    px(c, '#2f6f6a', wx + 7, wallTop + 6, 2, 12);
    px(c, '#bfe3e0', wx + 2, wallTop + 8, 4, 3);
    for (let k = 0; k < 16; k += 4) px(c, 'rgba(30,40,40,0.5)', wx + k, wallTop + 6, 1, 12);
    if (o.ac && wx === windows[0]) {
      px(c, '#cfd3d8', wx + 2, wallTop + 18, 12, 6);
      px(c, '#9aa0aa', wx + 3, wallTop + 20, 10, 1);
      px(c, '#9aa0aa', wx + 3, wallTop + 22, 10, 1);
    }
  }
  // 匾額（木頭底、黑字）或藍色門牌
  if (o.plaque) {
    const pw = o.plaque.length * 8 + 8;
    const pxl = x0 + w / 2 - pw / 2;
    px(c, '#3a2414', pxl - 1, wallTop - 1, pw + 2, 11);
    px(c, '#c69a62', pxl, wallTop, pw, 9);
    text(c, o.plaque, x0 + w / 2, wallTop + 5, '#2a1a10', `900 7px ${ZH}`);
  }
  if (o.address) {
    px(c, '#2f5fa8', door + 18, bottom - 21, 22, 6);
    text(c, o.address, door + 29, bottom - 18, '#ffffff', `700 4px ${ZH}`);
  }
  // 電表箱、牆角的盆栽
  px(c, '#8a8f98', x1 - 10, wallTop + 10, 5, 7);
  px(c, '#2f3238', x1 - 9, wallTop + 12, 3, 2);
  px(c, '#7a4a32', x0 + 2, bottom - 6, 6, 6);
  px(c, '#4f8a35', x0 + 1, bottom - 11, 8, 6);
  px(c, '#6fb04a', x0 + 3, bottom - 12, 3, 3);
}

export function paintVillageNorthRow(c: CanvasRenderingContext2D): void {
  const bottom = XY.villageRowBottom * T;
  paintVillageHouse(c, 32.5 * T, 40 * T, bottom, { plaque: '信義公民會館', seed: 41, ac: true });
  paintVillageHouse(c, 40.5 * T, 47.6 * T, bottom, { plaque: '眷村文物館', seed: 77 });
}

// 好丘：老房子改的咖啡館（大片玻璃窗裡亮著暖光、黑底白字招牌、黑板菜單、貝果）
let goodChoSprite: HTMLCanvasElement | null = null;
function goodChoCanvas(): HTMLCanvasElement {
  if (goodChoSprite) return goodChoSprite;
  const g = XY.goodCho;
  const w = (g.x1 - g.x0) * T;
  const pad = 10;
  const wallH = 38;
  const roofH = 26;
  const ch = wallH + roofH + 10;
  const { canvas, c } = layerCanvas(w + pad * 2, ch, spriteRes());
  goodChoSprite = canvas;
  if (!c) return canvas;
  const x0 = pad;
  const x1 = pad + w;
  const bottom = ch - 4;
  const wallTop = bottom - wallH;
  px(c, 'rgba(0,0,0,0.2)', x0 + 3, bottom - 2, w, 6);
  roofSlope(c, x0 - 6, x1 + 6, wallTop, x0 + 12, x1 - 12, wallTop - roofH + 2, '#3e4148', '#26282d', '#555962');
  px(c, '#26282d', x0 + 10, wallTop - roofH, w - 20, 3);
  // 白牆＋深木色腰板
  px(c, '#f1ece2', x0, wallTop, w, wallH);
  px(c, '#4a3322', x0, bottom - 8, w, 8);
  px(c, '#5e432e', x0, bottom - 8, w, 1);
  // 大玻璃窗：裡面暖暖的燈、吧台、吊燈
  for (const [wx, ww] of [
    [x0 + 6, 46],
    [x1 - 70, 64],
  ] as const) {
    px(c, '#2b1d14', wx - 2, wallTop + 7, ww + 4, 25);
    px(c, '#ffd99a', wx, wallTop + 9, ww, 21);
    px(c, '#ffe9c2', wx, wallTop + 9, ww, 6);
    for (let k = wx + 8; k < wx + ww - 4; k += 14) {
      px(c, '#2b1d14', k, wallTop + 9, 1, 4);
      px(c, '#f6b04a', k - 2, wallTop + 13, 5, 3);
    }
    px(c, '#8a5a36', wx, wallTop + 24, ww, 6);
    for (let k = wx + 3; k < wx + ww - 6; k += 9) {
      px(c, '#d9a35a', k, wallTop + 21, 5, 3);
      px(c, '#f2d9a8', k + 2, wallTop + 22, 1, 1);
    }
    for (let k = wx + Math.floor(ww / 3); k < wx + ww; k += Math.floor(ww / 3)) px(c, '#2b1d14', k, wallTop + 9, 1, 21);
    px(c, 'rgba(255,255,255,0.35)', wx + 2, wallTop + 10, 2, 12);
  }
  // 門
  const door = x0 + 60;
  px(c, '#2b1d14', door - 1, bottom - 30, 20, 30);
  px(c, '#6b4a30', door, bottom - 29, 18, 29);
  px(c, '#ffd99a', door + 3, bottom - 26, 12, 14);
  px(c, '#2b1d14', door + 9, bottom - 26, 1, 14);
  px(c, '#f2c14e', door + 14, bottom - 13, 1, 2);
  // 招牌：黑底白字「好丘」＋ good cho's
  px(c, '#15110e', door - 20, wallTop - 4, 62, 11);
  px(c, '#f1ece2', door - 19, wallTop - 3, 60, 1);
  text(c, '好丘', door - 6, wallTop + 2, '#ffffff', `900 8px ${ZH}`);
  text(c, "good cho's", door + 22, wallTop + 2.5, '#d9cbb0', `700 5px ${ZH}`);
  // 門邊的黑板菜單
  px(c, '#5e432e', x1 - 4, bottom - 18, 1, 18);
  px(c, '#2c3a33', x1 - 14, bottom - 22, 12, 13);
  px(c, '#8a6a48', x1 - 14, bottom - 22, 12, 1);
  text(c, 'BAGEL', x1 - 8, bottom - 18, '#f4efe6', `700 3.5px ${ZH}`);
  px(c, '#f4efe6', x1 - 12, bottom - 15, 8, 1);
  px(c, '#f4efe6', x1 - 12, bottom - 13, 6, 1);
  goodChoSprite = canvas;
  return canvas;
}

export function drawGoodCho(c: CanvasRenderingContext2D): void {
  const s = goodChoCanvas();
  const size = layerSize(s);
  c.drawImage(s, XY.goodCho.x0 * T - 10, XY.goodCho.y1 * T - size.h + 4, size.w, size.h);
}

// 中間那排的小平房（松勤街 50 號的門牌）
let houseCSprite: HTMLCanvasElement | null = null;
export function drawVillageHouseC(c: CanvasRenderingContext2D): void {
  const h = XY.houseC;
  const w = (h.x1 - h.x0) * T;
  if (!houseCSprite) {
    const { canvas, c: hc } = layerCanvas(w + 20, 72, spriteRes());
    houseCSprite = canvas;
    if (hc) paintVillageHouse(hc, 10, 10 + w, 68, { address: '松勤街50號', seed: 9, ac: true });
  }
  const size = layerSize(houseCSprite);
  c.drawImage(houseCSprite, h.x0 * T - 10, h.y1 * T - 68, size.w, size.h);
}

// ── 會跟人物排前後的小東西 ──

// 老榕樹：大大的樹冠、垂下來的氣根、粗樹幹
export function drawBanyan(c: CanvasRenderingContext2D, tx: number, ty: number, seconds: number): void {
  const x = tx * T + 8;
  const y = ty * T + 14;
  px(c, 'rgba(0,0,0,0.16)', x - 34, y - 2, 68, 8);
  px(c, '#5c4128', x - 5, y - 26, 10, 26);
  px(c, '#6f5033', x - 3, y - 26, 3, 26);
  px(c, '#5c4128', x - 9, y - 4, 4, 4);
  px(c, '#5c4128', x + 5, y - 4, 4, 4);
  // 氣根
  for (const [dx, len] of [[-22, 22], [-15, 28], [-9, 18], [12, 24], [19, 30], [25, 16]] as const) {
    const sway = Math.round(Math.sin(seconds * 0.9 + dx) * 0.6);
    px(c, '#7a5a3a', x + dx + sway, y - 46, 1, len);
  }
  const blobs: [number, number, number, string][] = [
    [-22, -50, 16, '#2f6b35'],
    [20, -52, 17, '#2f6b35'],
    [0, -62, 20, '#357a3c'],
    [-12, -44, 14, '#3d8748'],
    [12, -44, 14, '#3d8748'],
    [-28, -40, 10, '#2f6b35'],
    [28, -42, 11, '#2f6b35'],
    [-4, -54, 13, '#4c9a52'],
    [10, -64, 9, '#5aa860'],
    [-14, -64, 8, '#5aa860'],
  ];
  for (const [dx, dy, r, col] of blobs) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(x + dx, y + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  for (let i = 0; i < 18; i += 1) px(c, '#6cbf6a', x - 26 + ((i * 37) % 52), y - 70 + ((i * 23) % 34), 2, 2);
}

// 竹籬笆：一根根竹子＋兩條橫綁
export function drawBambooFence(c: CanvasRenderingContext2D, tx: number, ty: number, w: number): void {
  const x0 = tx * T;
  const y = ty * T + 6;
  px(c, 'rgba(0,0,0,0.15)', x0, y + 1, w * T, 2);
  for (let x = x0; x < x0 + w * T; x += 3) {
    const h = 14 + ((x * 7) % 3);
    px(c, '#c9b458', x, y - h, 2, h);
    px(c, '#e0d07a', x, y - h, 1, h);
    px(c, '#9a8a3a', x, y - h + 5, 2, 1);
  }
  px(c, '#8a6a3a', x0, y - 11, w * T, 2);
  px(c, '#8a6a3a', x0, y - 5, w * T, 2);
}

// 下象棋的小方桌（棋盤、紅黑棋子、一壺茶）
export function drawChessTable(c: CanvasRenderingContext2D, tx: number, ty: number): void {
  const x = tx * T;
  const y = ty * T;
  px(c, 'rgba(0,0,0,0.18)', x + 1, y + 13, 14, 3);
  px(c, '#6b4a2f', x + 2, y + 8, 2, 7);
  px(c, '#6b4a2f', x + 12, y + 8, 2, 7);
  px(c, '#8a5c3a', x, y + 2, 16, 7);
  px(c, '#e9d2a0', x + 1, y + 2, 14, 6);
  for (let k = 1; k < 14; k += 3) px(c, '#b89a64', x + 1 + k, y + 2, 1, 6);
  px(c, '#b89a64', x + 1, y + 5, 14, 1);
  for (const [dx, dy, red] of [[2, 3, true], [5, 3, false], [9, 6, true], [12, 3, false], [7, 6, false], [3, 6, true]] as const) {
    px(c, '#f4ead6', dx + x, dy + y, 2, 2);
    px(c, red ? '#c62828' : '#2b2d33', dx + x, dy + y, 1, 1);
  }
  px(c, '#6f8f8a', x + 12, y - 1, 3, 3);
  px(c, '#8fb3ad', x + 12, y - 1, 1, 1);
}

// 藤椅（座位）：蜂蜜色編織的扶手椅，面向左或右
export function paintRattanChair(c: CanvasRenderingContext2D, x: number, y: number, facing: 'left' | 'right' | 'up' | 'down'): void {
  const back = facing === 'right' ? x + 1 : x + 11;
  px(c, 'rgba(0,0,0,0.15)', x + 1, y + 13, 14, 2);
  px(c, '#9a6a32', x + 3, y + 10, 2, 5);
  px(c, '#9a6a32', x + 11, y + 10, 2, 5);
  px(c, '#c99a52', x + 2, y + 7, 12, 4);
  for (let k = 0; k < 12; k += 2) px(c, '#e0b870', x + 2 + k, y + 7, 1, 4);
  px(c, '#c99a52', back, y - 2, 4, 10);
  for (let k = 0; k < 10; k += 2) px(c, '#e0b870', back, y - 2 + k, 4, 1);
  px(c, '#9a6a32', back, y - 3, 4, 1);
}

// 坐在大廳地板（座位）：空的時候地上一張攤開的報紙，看得出來可以坐
export function paintFloorSeat(c: CanvasRenderingContext2D, x: number, y: number): void {
  px(c, 'rgba(0,0,0,0.12)', x + 3, y + 9, 11, 6);
  px(c, '#ece8de', x + 2, y + 8, 11, 6);
  px(c, '#b8b2a6', x + 3, y + 9, 4, 1);
  px(c, '#b8b2a6', x + 3, y + 11, 8, 1);
  px(c, '#b8b2a6', x + 8, y + 9, 4, 1);
  px(c, '#d0cabd', x + 7, y + 8, 1, 6);
}

// 好丘平台上的木桌（兩格寬）：桌上有貝果和咖啡
export function drawPicnicTable(c: CanvasRenderingContext2D, tx: number, ty: number, w: number): void {
  const x = tx * T;
  const y = ty * T;
  const width = w * T;
  px(c, 'rgba(0,0,0,0.18)', x + 2, y + 13, width - 2, 3);
  px(c, '#5e3f26', x + 3, y + 8, 3, 7);
  px(c, '#5e3f26', x + width - 6, y + 8, 3, 7);
  px(c, '#8a5c3a', x, y + 1, width, 9);
  px(c, '#a8754a', x, y + 1, width, 7);
  for (let k = x + 7; k < x + width; k += 8) px(c, '#8a5c3a', k, y + 1, 1, 7);
  // 貝果、咖啡杯
  for (const dx of [5, width - 12]) {
    px(c, '#c98a3c', x + dx, y + 3, 6, 3);
    px(c, '#e8b46a', x + dx + 1, y + 3, 4, 1);
    px(c, '#7a4a20', x + dx + 2, y + 4, 2, 1);
  }
  for (const dx of [width / 2 - 7, width / 2 + 3]) {
    px(c, '#f4efe6', x + dx, y + 2, 4, 4);
    px(c, '#6b4428', x + dx + 1, y + 2, 2, 1);
  }
}

// 綠色郵筒＋紅色郵筒（台灣的招牌）
export function drawMailboxes(c: CanvasRenderingContext2D, tx: number, ty: number): void {
  const x = tx * T;
  const y = ty * T;
  for (const [dx, body, dark] of [
    [0, '#2f8f4e', '#1f6b38'],
    [8, '#c8402f', '#9a2f22'],
  ] as const) {
    px(c, 'rgba(0,0,0,0.18)', x + dx, y + 14, 7, 2);
    px(c, dark, x + dx + 2, y + 10, 3, 5);
    px(c, body, x + dx, y - 2, 7, 12);
    px(c, dark, x + dx, y - 3, 7, 2);
    px(c, '#15171f', x + dx + 1, y + 2, 5, 1);
    px(c, 'rgba(255,255,255,0.3)', x + dx + 1, y - 1, 1, 9);
  }
}

// 老鐵馬（黑色腳踏車，側面）
export function drawOldBike(c: CanvasRenderingContext2D, tx: number, ty: number): void {
  const x = tx * T;
  const y = ty * T + 12;
  px(c, 'rgba(0,0,0,0.15)', x + 1, y + 2, 24, 2);
  for (const wx of [x + 5, x + 20]) {
    c.strokeStyle = '#1f2026';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(wx, y - 4, 5, 0, Math.PI * 2);
    c.stroke();
    px(c, '#9aa0aa', wx, y - 4, 1, 1);
  }
  px(c, '#1f2026', x + 6, y - 6, 13, 1);
  px(c, '#1f2026', x + 11, y - 10, 1, 6);
  px(c, '#1f2026', x + 9, y - 11, 5, 2);
  px(c, '#1f2026', x + 19, y - 11, 1, 6);
  px(c, '#9aa0aa', x + 17, y - 12, 5, 1);
  px(c, '#8a6a3a', x + 2, y - 9, 6, 2);
}

// 曬衣竿：兩根竹竿中間一條繩子，衣服被風吹著晃
export function drawLaundry(c: CanvasRenderingContext2D, tx: number, ty: number, w: number, seconds: number): void {
  const x0 = tx * T;
  const x1 = (tx + w) * T;
  const y = ty * T + 12;
  for (const x of [x0 + 1, x1 - 2]) {
    px(c, '#c9b458', x, y - 26, 2, 27);
    px(c, 'rgba(0,0,0,0.15)', x - 1, y, 4, 2);
  }
  px(c, '#e8e2d4', x0 + 2, y - 24, x1 - x0 - 4, 1);
  const clothes = ['#4f8fd9', '#f4efe6', '#e25a4a', '#f6c945', '#7ac77a', '#f4efe6'];
  let x = x0 + 5;
  clothes.forEach((col, i) => {
    if (x > x1 - 10) return;
    const sway = Math.round(Math.sin(seconds * 1.8 + i * 0.9));
    if (i % 2 === 0) {
      px(c, col, x + sway, y - 23, 8, 9);
      px(c, col, x - 2 + sway, y - 23, 12, 3);
    } else {
      px(c, col, x + sway, y - 23, 5, 11);
      px(c, 'rgba(0,0,0,0.12)', x + 2 + sway, y - 23, 1, 11);
    }
    px(c, '#d9a35a', x + 1, y - 25, 1, 2);
    x += i % 2 === 0 ? 11 : 8;
  });
}

// 週末的簡單市集：白色帳篷、攤子上的手作小物和盆栽
export function drawMarketTent(c: CanvasRenderingContext2D, tx: number, ty: number, variant: number, seconds: number): void {
  const x = tx * T;
  const y = ty * T + 14;
  const w = 3 * T - 4;
  px(c, 'rgba(0,0,0,0.15)', x + 1, y, w, 3);
  px(c, '#9aa0aa', x + 1, y - 26, 1, 26);
  px(c, '#9aa0aa', x + w - 2, y - 26, 1, 26);
  // 桌子＋桌布
  px(c, '#f4efe6', x + 2, y - 10, w - 4, 8);
  px(c, ['#e8a33d', '#5aa8a0', '#d9534f'][variant % 3] ?? '#e8a33d', x + 2, y - 4, w - 4, 2);
  const goods = [
    ['#4f8a35', '#7a4a32'],
    ['#f6c945', '#e25a4a'],
    ['#b48ad9', '#f4c7a5'],
  ][variant % 3] ?? ['#4f8a35', '#7a4a32'];
  for (let k = x + 5; k < x + w - 5; k += 6) {
    px(c, goods[1] ?? '#7a4a32', k, y - 13, 4, 3);
    px(c, goods[0] ?? '#4f8a35', k, y - 16, 4, 3);
  }
  // 白色帳篷頂，邊緣一片片垂下來被風吹
  px(c, '#e9e6de', x - 2, y - 32, w + 4, 6);
  px(c, '#ffffff', x - 2, y - 32, w + 4, 2);
  for (let k = 0; k < w + 4; k += 6) {
    const sway = Math.round(Math.sin(seconds * 2 + k) * 0.6);
    px(c, '#d9d5cc', x - 2 + k, y - 26 + sway, 5, 3);
  }
}
