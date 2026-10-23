// 臺南（孔廟一帶）的美術：中正路的老街屋（度小月擔仔麵、林百貨）、臺南孔廟（紅牆、大成殿重簷＋燕尾＋通天筒、明倫堂、泮池、老榕樹、「全臺首學」大門）、
// 南門路、臺南市美術館二館（白色方塊＋五角形屋頂）、府中街（泮宮坊、小店、串燈）、莉莉水果店、高鐵接駁車站牌。
// 最後組成 CityScene 用的 TAINAN。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CAFE_TABLES, CAFE_Y, DESK_Y, FUZHONG_ROW, LILY_SEAT_Y, LILY_TABLES, MINGLUN_DESKS, NORTH_ROW, STONE_TABLE, TAINAN_SEATS, TAINAN_SHOPS, TN, type FuzhongShop, type TainanShophouse } from './tainan';
import { drawBanyan } from './xinyiArt';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, brickPath, zebra, townhouseSprite, drawParkedScooter, SCOOTER_COLORS, drawStreetTree, drawLamp } from './cityArt';

// ── 地面（畫一次）──
const C = {
  asphalt: '#4a4d55',
  asphaltDark: '#42454c',
  sidewalk: '#cfc7ba',
  sidewalkLine: '#bdb4a6',
  arcade: '#b98f72',
  arcadeDark: '#a87f63',
  brick: '#b5553f',
  brickDark: '#9d4634',
  grass: '#7fa65a',
  grassDark: '#6c9149',
  grassLight: '#93b86a',
  stone: '#c9c2b4',
  stoneDark: '#b2ab9c',
  wall: '#b8432f',
  wallDark: '#963425',
  wallCap: '#6f6a64',
  wallCapLight: '#8a857e',
  water: '#4f8fb3',
  waterDeep: '#3f7899',
};

export function paintTainanGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(706);
  const W = TN.W * T;
  const H = TN.H * T;
  // 整片人行道
  tiles(c, { x0: 0, y0: 0, x1: TN.W, y1: TN.H }, C.sidewalk, C.sidewalkLine, 12);
  // 北邊騎樓（暗紅色地磚）
  tiles(c, { x0: 0, y0: TN.northLine - 0.4, x1: TN.W, y1: TN.zhongzheng.y0 }, C.arcade, C.arcadeDark, 8);
  // 中正路、南門路、府前路（柏油、標線、斑馬線）
  const zz = TN.zhongzheng;
  road(c, { x0: 0, y0: zz.y0, x1: TN.W, y1: zz.y1 }, rand);
  road(c, { x0: TN.nanmen.x0, y0: zz.y1, x1: TN.nanmen.x1, y1: TN.fuqian.y0 }, rand);
  road(c, { x0: 0, y0: TN.fuqian.y0, x1: TN.W, y1: TN.fuqian.y1 }, rand);
  const zMid = ((zz.y0 + zz.y1) / 2) * T;
  px(c, '#e0b93a', 0, zMid - 2, W, 1);
  px(c, '#e0b93a', 0, zMid + 1, W, 1);
  const fMid = ((TN.fuqian.y0 + TN.fuqian.y1) / 2) * T;
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.8)', x, fMid, 10, 2);
  const nMid = ((TN.nanmen.x0 + TN.nanmen.x1) / 2) * T;
  for (let y = zz.y1 * T + 6; y < TN.fuqian.y0 * T - 6; y += 20) px(c, 'rgba(240,240,240,0.8)', nMid - 1, y, 2, 10);
  // 路口：中正路跟府前路上的斑馬線、南門路上往府中街的斑馬線
  zebra(c, TN.nanmen.x0 - 0.2, zz.y0 + 0.2, TN.nanmen.x0 + 0.1, zz.y1 - 0.2, false);
  zebra(c, TN.nanmen.x1 + 0.6, zz.y0 + 0.2, TN.nanmen.x1 + 2, zz.y1 - 0.2, false);
  zebra(c, TN.nanmen.x0 + 0.2, TN.eastGate.y0 + 0.1, TN.nanmen.x1 - 0.2, TN.eastGate.y1 - 0.1, true);
  zebra(c, TN.southGate.x0 + 0.4, TN.fuqian.y0 + 0.2, TN.southGate.x1 - 0.4, TN.fuqian.y1 - 0.2, false);
  zebra(c, TN.nanmen.x1 + 0.6, TN.fuqian.y0 + 0.2, TN.nanmen.x1 + 2, TN.fuqian.y1 - 0.2, false);
  // 下緣（府前路南邊的人行道）
  tiles(c, { x0: 0, y0: TN.fuqian.y1, x1: TN.W, y1: TN.H }, C.sidewalk, C.sidewalkLine, 12);

  // ── 孔廟裡面：草地、紅磚步道、大成殿前的石板廣場 ──
  const tp = TN.temple;
  const inner = { x0: tp.x0 + TN.wall, y0: tp.y0 + TN.wall, x1: tp.x1 - TN.wall, y1: tp.y1 };
  px(c, C.grass, inner.x0 * T, inner.y0 * T, (inner.x1 - inner.x0) * T, (inner.y1 - inner.y0) * T);
  for (let i = 0; i < 1400; i += 1) px(c, rand() < 0.5 ? C.grassDark : C.grassLight, Math.floor(inner.x0 * T + rand() * (inner.x1 - inner.x0) * T), Math.floor(inner.y0 * T + rand() * (inner.y1 - inner.y0) * T), 2, 1);
  // 大成殿後面、明倫堂後面的地（石板）
  tiles(c, { x0: inner.x0, y0: inner.y0, x1: inner.x1, y1: TN.dacheng.y0 + 0.6 }, C.stone, C.stoneDark, 10);
  // 大成殿前面的丹墀（石板廣場）
  tiles(c, { x0: TN.platform.x0 - 0.6, y0: TN.platform.y1, x1: TN.platform.x1 + 0.6, y1: 23.2 }, C.stone, C.stoneDark, 10);
  // 紅磚步道：東邊側門進來一路往西、南邊大門往北到明倫堂、往泮池
  brickPath(c, { x0: 4, y0: 23.2, x1: inner.x1, y1: 24.6 });
  brickPath(c, { x0: TN.southGate.x0 + 0.9, y0: 24.6, x1: TN.southGate.x1 - 0.9, y1: inner.y1 });
  brickPath(c, { x0: TN.minglun.x0, y0: TN.minglun.y1, x1: TN.minglun.x1, y1: 23.2 });
  brickPath(c, { x0: 11.8, y0: 24.6, x1: 14.2, y1: TN.panchi.y0 });
  // 大成殿的月台：石頭台基、正面一道邊、中間階梯
  const pf = TN.platform;
  tiles(c, { x0: pf.x0, y0: pf.y0 - 0.4, x1: pf.x1, y1: pf.y1 - 0.5 }, '#d8d1c3', '#c4bcad', 10);
  px(c, '#a59d8f', pf.x0 * T, (pf.y1 - 0.5) * T, (pf.x1 - pf.x0) * T, 8);
  px(c, '#8f887b', pf.x0 * T, (pf.y1 - 0.5) * T + 7, (pf.x1 - pf.x0) * T, 1);
  for (let k = 0; k < (pf.x1 - pf.x0) * T; k += 12) px(c, '#e3ddd1', pf.x0 * T + k, (pf.y0 - 0.4) * T, 10, 1);
  const stepX = ((pf.x0 + pf.x1) / 2 - 1.6) * T;
  for (let s = 0; s < 3; s += 1) px(c, s % 2 ? '#cfc8ba' : '#e2dccf', stepX, (pf.y1 - 0.5) * T + s * 3, 3.2 * T, 3);
  // 明倫堂前的石板地
  tiles(c, { x0: TN.minglun.x0 - 0.2, y0: TN.minglun.y1, x1: TN.minglun.x1 + 0.2, y1: DESK_Y + 0.7 }, C.stone, C.stoneDark, 10);
  // 泮池：半月形（直邊在北），石頭池邊＋欄杆座
  paintPanchi(c);

  // ── 孔廟的紅牆（北牆看得到牆面；東、西牆從上面看是一條；南牆另外跟人排前後）──
  const wTop = tp.y0 * T;
  px(c, C.wallCap, tp.x0 * T, wTop, (tp.x1 - tp.x0) * T, 4);
  px(c, C.wallCapLight, tp.x0 * T, wTop, (tp.x1 - tp.x0) * T, 1);
  px(c, C.wall, tp.x0 * T, wTop + 4, (tp.x1 - tp.x0) * T, 10);
  px(c, C.wallDark, tp.x0 * T, wTop + 13, (tp.x1 - tp.x0) * T, 1);
  for (let x = tp.x0 * T + 10; x < tp.x1 * T; x += 22) px(c, '#c9573f', x, wTop + 6, 8, 5);
  const sideWall = (x0: number, y0: number, y1: number) => {
    px(c, C.wall, x0 * T, y0 * T, TN.wall * T, (y1 - y0) * T);
    px(c, C.wallCap, x0 * T + 1, y0 * T, TN.wall * T - 2, (y1 - y0) * T);
    px(c, C.wallCapLight, x0 * T + 2, y0 * T, 1, (y1 - y0) * T);
  };
  sideWall(tp.x0, tp.y0 + 0.9, tp.y1);
  sideWall(tp.x1 - TN.wall, tp.y0 + 0.9, TN.eastGate.y0);
  sideWall(tp.x1 - TN.wall, TN.eastGate.y1, tp.y1);
  // 東側門：門口兩根小石柱、一塊門檻
  px(c, '#8f887b', (tp.x1 - TN.wall) * T, TN.eastGate.y0 * T, TN.wall * T, (TN.eastGate.y1 - TN.eastGate.y0) * T);
  brickPath(c, { x0: tp.x1 - TN.wall, y0: TN.eastGate.y0 + 0.15, x1: tp.x1, y1: TN.eastGate.y1 - 0.15 });

  // ── 美術館前的白色廣場、府中街的石板巷子 ──
  tiles(c, { x0: TN.nanmen.x1, y0: TN.museum.y1, x1: TN.W, y1: TN.fuzhongShops.y0 }, '#e6e2da', '#d6d1c6', 16);
  tiles(c, { x0: TN.nanmen.x1, y0: TN.fuzhongShops.y0, x1: TN.fuzhongShops.x0, y1: TN.fuzhong.y1 }, '#e6e2da', '#d6d1c6', 16);
  px(c, '#bab2a4', TN.nanmen.x1 * T, TN.fuzhong.y0 * T, (TN.W - TN.nanmen.x1) * T, (TN.fuzhong.y1 - TN.fuzhong.y0) * T);
  for (let y = TN.fuzhong.y0 * T, row = 0; y < TN.fuzhong.y1 * T; y += 6, row += 1) {
    for (let x = TN.nanmen.x1 * T + (row % 2) * 6; x < W; x += 12) px(c, '#a9a193', Math.round(x), Math.round(y), 11, 5);
  }
  // 莉莉水果店前面的騎樓
  tiles(c, { x0: TN.lily.x0, y0: TN.lily.y1, x1: TN.W, y1: TN.fuqian.y0 }, C.arcade, C.arcadeDark, 8);
  void H;
}

function paintPanchi(c: CanvasRenderingContext2D): void {
  const p = TN.panchi;
  const cx = p.cx * T;
  const y0 = p.y0 * T;
  // 石頭池邊
  c.fillStyle = '#b9b1a2';
  c.beginPath();
  c.ellipse(cx, y0, (p.rx + 0.45) * T, (p.ry + 0.45) * T, 0, 0, Math.PI);
  c.closePath();
  c.fill();
  px(c, '#b9b1a2', (p.cx - p.rx - 0.45) * T, y0 - 6, (p.rx + 0.45) * 2 * T, 6);
  // 水
  c.fillStyle = C.waterDeep;
  c.beginPath();
  c.ellipse(cx, y0, p.rx * T, p.ry * T, 0, 0, Math.PI);
  c.closePath();
  c.fill();
  c.fillStyle = C.water;
  c.beginPath();
  c.ellipse(cx, y0 + 2, (p.rx - 0.5) * T, (p.ry - 0.6) * T, 0, 0, Math.PI);
  c.closePath();
  c.fill();
  // 北邊直直的池邊：石欄杆
  px(c, '#d8d1c3', (p.cx - p.rx - 0.45) * T, y0 - 7, (p.rx + 0.45) * 2 * T, 3);
  for (let x = (p.cx - p.rx - 0.3) * T; x < (p.cx + p.rx + 0.4) * T; x += 9) px(c, '#e8e2d6', Math.round(x), y0 - 12, 3, 6);
  px(c, '#d8d1c3', (p.cx - p.rx - 0.45) * T, y0 - 13, (p.rx + 0.45) * 2 * T, 2);
  // 荷葉
  for (const [dx, dy] of [[-2.6, 1.2], [-1.8, 2], [2.2, 1], [3, 1.8], [0.4, 2.6]] as const) {
    c.fillStyle = '#4f8a3c';
    c.beginPath();
    c.ellipse(cx + dx * T, y0 + dy * T, 5, 3, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#6fae52', Math.round(cx + dx * T - 2), Math.round(y0 + dy * T - 1), 3, 1);
  }
  px(c, '#f2a6c4', Math.round(cx + 2.2 * T - 1), Math.round(y0 + 1 * T - 3), 3, 3);
}

// 泮池擋路（半個橢圓＋北邊欄杆）
export function inPanchi(x: number, y: number): boolean {
  const p = TN.panchi;
  if (y < p.y0 - 0.5) return false;
  const dy = Math.max(0, y - p.y0);
  return ((x - p.cx) / (p.rx + 0.4)) ** 2 + (dy / (p.ry + 0.4)) ** 2 < 1;
}

// 水面的波光（每格動）
function drawPanchiShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  const p = TN.panchi;
  for (let i = 0; i < 14; i += 1) {
    const ang = ((i * 37) % 180) * (Math.PI / 180);
    const rr = 0.3 + ((i * 53) % 60) / 100;
    const x = p.cx * T + Math.cos(ang) * p.rx * T * rr + Math.sin(seconds * 0.8 + i) * 3;
    const y = p.y0 * T + Math.sin(ang) * p.ry * T * rr;
    const a = 0.25 + 0.2 * Math.sin(seconds * 1.6 + i * 1.3);
    px(c, `rgba(220, 240, 255, ${a})`, Math.round(x), Math.round(y), 4, 1);
  }
}

// ── 中正路的老街屋 ──
// 度小月擔仔麵：木造老店、黑底金字招牌、兩顆紅燈籠，門口一個師傅坐矮凳煮麵（擔仔＋湯鍋冒煙）
function duxiaoyueSprite(b: TainanShophouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 66;
  return cached('tn-duxiaoyue', w, h, (c) => {
    // 屋頂瓦片、出簷
    px(c, '#4a3a30', 0, 6, w, 6);
    for (let x = 0; x < w; x += 4) px(c, '#5c4a3e', x, 6, 2, 6);
    px(c, '#2e241e', 0, 12, w, 2);
    // 二樓木格窗
    px(c, '#7a4a2a', 0, 14, w, 26);
    for (let k = 4; k < w - 4; k += 10) {
      px(c, '#3a2416', k, 17, 8, 12);
      for (let j = 0; j < 8; j += 2) px(c, '#b58a52', k + j, 17, 1, 12);
    }
    // 招牌：黑底金字
    px(c, '#15100c', 3, 30, w - 6, 10);
    px(c, '#c9a24a', 3, 30, w - 6, 1);
    px(c, '#c9a24a', 3, 39, w - 6, 1);
    text(c, '度小月擔仔麵', w / 2, 35.5, '#f2d27a', `900 7px ${SERIF_TC}`);
    // 一樓：暗暗的店裡、木頭櫃台
    px(c, '#2a1a12', 0, 40, w, 26);
    px(c, '#f4d9a0', 4, 44, w - 8, 14);
    px(c, '#8a5a32', 4, 54, w - 8, 4);
    for (let k = 8; k < w - 8; k += 8) px(c, '#e8e0cc', k, 48, 5, 3);
    px(c, '#7a4a2a', 0, 40, 3, 26);
    px(c, '#7a4a2a', w - 3, 40, 3, 26);
  });
}

function drawDuxiaoyue(c: CanvasRenderingContext2D, b: TainanShophouse, d: DrawCtx): void {
  const x = b.x0 * T;
  const bottom = TN.northLine * T;
  const s = duxiaoyueSprite(b);
  blit(c, s, x, bottom);
  const w = (b.x1 - b.x0) * T;
  // 兩顆紅燈籠（寫著「度小月」）
  for (const lx of [x + 10, x + w - 10]) {
    const sway = Math.round(Math.sin(d.seconds * 1.3 + lx) * 0.6);
    px(c, '#2e241e', lx, bottom - 66 + 14, 1, 4);
    px(c, '#c62828', lx - 4 + sway, bottom - 66 + 18, 9, 11);
    px(c, '#e53935', lx - 3 + sway, bottom - 66 + 19, 2, 9);
    px(c, '#f2c14e', lx - 4 + sway, bottom - 66 + 18, 9, 1);
    px(c, '#f2c14e', lx - 4 + sway, bottom - 66 + 28, 9, 1);
    text(c, '度', lx + 0.5 + sway, bottom - 66 + 23.5, '#1a0d08', `900 5px ${SERIF_TC}`);
    if (d.night) glow(c, lx + sway, bottom - 66 + 23, 12, '255, 90, 60', 0.35);
  }
  // 門口的擔仔：師傅坐矮凳、前面一口湯鍋
  const cx = x + w / 2 - 10;
  const cook = getAvatarFrame(lookColors(1, 4, { body: 0 }), 'down', 'idle');
  c.drawImage(cook, 0, 0, cook.width, 17, cx - cook.width / 2, bottom - 2 - 17, cook.width, 17);
  px(c, '#8a5a32', cx - 6, bottom - 3, 12, 3);
  px(c, '#3a3d45', cx + 7, bottom - 10, 12, 9);
  px(c, '#9aa3b2', cx + 7, bottom - 11, 12, 2);
  px(c, '#c98a3c', cx + 8, bottom - 10, 10, 1);
  px(c, '#e25a2a', cx + 9, bottom - 2, 8, 2);
  for (let k = 0; k < 3; k += 1) {
    const t = (d.seconds * 0.6 + k / 3) % 1;
    px(c, `rgba(255,255,255,${0.45 * (1 - t)})`, Math.round(cx + 12 + Math.sin(d.seconds * 2 + k) * 2), Math.round(bottom - 13 - t * 14), 3, 2);
  }
}

// 林百貨：五層樓、黃褐色溝面磚、一排排窗、右邊轉角是圓的；頂樓有末廣社（小神社＋鳥居）；樓頂大大的「林百貨」、HAYASHI
function hayashiSprite(b: TainanShophouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const ground = 20;
  const floorH = 13;
  const body = ground + 4 * floorH + 12;
  const roof = 26;
  const h = body + roof;
  return cached('tn-hayashi', w, h, (c) => {
    const top = roof;
    const tile = '#c8aa7c';
    const tileDark = '#b39466';
    // 頂樓：末廣社（灰瓦小神社）、白色鳥居、女兒牆
    px(c, '#9a8a70', 10, top - 4, w - 20, 4);
    const sx = w * 0.62;
    px(c, '#e8e2d6', sx - 2, top - 18, 2, 14);
    px(c, '#e8e2d6', sx + 14, top - 18, 2, 14);
    px(c, '#e8e2d6', sx - 5, top - 20, 24, 2);
    px(c, '#d8d1c3', sx - 3, top - 16, 20, 2);
    px(c, '#5a5a62', sx + 24, top - 16, 22, 4);
    px(c, '#6e6e78', sx + 22, top - 18, 26, 3);
    px(c, '#d8c9a8', sx + 27, top - 12, 16, 8);
    px(c, '#8a5a32', sx + 32, top - 10, 6, 6);
    // 樓頂的「林百貨」招牌（白底紅字的直立大字）＋ HAYASHI
    px(c, '#f4efe4', 14, top - 22, 40, 18);
    px(c, '#c62828', 14, top - 22, 40, 2);
    text(c, '林百貨', 34, top - 12, '#b71c1c', `900 11px ${SERIF_TC}`);
    // 立面：溝面磚（細細的直紋）
    px(c, tile, 0, top, w, body);
    for (let x = 0; x < w; x += 3) px(c, tileDark, x, top, 1, body - ground);
    // 頂上一圈裝飾線（五樓窗戶小一點、上緣一排齒狀裝飾）
    px(c, '#e3cfa6', 0, top, w, 3);
    px(c, '#8f7550', 0, top + 3, w, 1);
    for (let x = 2; x < w - 16; x += 6) px(c, '#e8d6b0', x, top + 5, 3, 2);
    // 每層樓：成對的直長窗，中間淺色壁柱，樓層之間一條橫帶
    const bay = 26;
    for (let f = 0; f < 4; f += 1) {
      const fy = top + 9 + f * floorH;
      const winH = f === 0 ? 7 : 9;
      const wy = f === 0 ? fy + 2 : fy;
      for (let bx = 4; bx + bay <= w - 16; bx += bay) {
        for (const off of [3, 13]) {
          px(c, '#4a3a2a', bx + off - 1, wy - 1, 9, winH + 2);
          px(c, '#a9c8d6', bx + off, wy, 7, winH);
          px(c, '#d9ecf4', bx + off + 1, wy + 1, 2, 3);
          px(c, '#4a3a2a', bx + off, wy + Math.floor(winH / 2), 7, 1);
        }
        px(c, '#dcc396', bx + bay - 2, fy - 2, 3, floorH);
      }
      px(c, '#e3cfa6', 0, fy + floorH - 3, w - 16, 2);
      px(c, '#9a7f56', 0, fy + floorH - 1, w - 16, 1);
    }
    // 右邊轉角：圓弧（漸層表現圓柱面）＋直條窗
    const cw = 16;
    const g = c.createLinearGradient(w - cw, 0, w, 0);
    g.addColorStop(0, '#d6ba8c');
    g.addColorStop(0.5, '#e8d2a6');
    g.addColorStop(1, '#a88a5c');
    c.fillStyle = g;
    c.fillRect(w - cw, top, cw, body - ground);
    for (let f = 0; f < 4; f += 1) px(c, '#4a3a2a', w - cw + 5, top + 9 + f * floorH, 6, 10);
    for (let f = 0; f < 4; f += 1) px(c, '#a9c8d6', w - cw + 6, top + 10 + f * floorH, 4, 8);
    // 一樓上面的店名橫帶：深色底、金色「林百貨 HAYASHI」
    const gy0 = top + body - ground;
    px(c, '#3a2a1c', 0, gy0 - 9, w - cw, 7);
    px(c, '#c9a24a', 0, gy0 - 9, w - cw, 1);
    text(c, '林 百 貨', w * 0.28, gy0 - 5.5, '#f2d27a', `900 5px ${SERIF_TC}`);
    text(c, 'HAYASHI DEPARTMENT STORE', w * 0.66, gy0 - 5.5, '#f2d27a', '700 4px system-ui, sans-serif');
    // 一樓：拱形騎樓、櫥窗、大門上方的指針式電梯樓層表
    const gy = top + body - ground;
    px(c, '#e3cfa6', 0, gy - 2, w, 2);
    px(c, '#3a2e24', 0, gy, w, ground);
    for (let ax = 2; ax + 18 <= w; ax += 20) {
      px(c, '#f4e3c0', ax + 2, gy + 6, 14, ground - 6);
      c.fillStyle = '#f4e3c0';
      c.beginPath();
      c.arc(ax + 9, gy + 7, 7, Math.PI, 0);
      c.fill();
      for (let k = 0; k < 3; k += 1) px(c, ['#c62828', '#2a7a46', '#c9a24a'][k] ?? '#c62828', ax + 4 + k * 4, gy + 14, 3, 4);
      px(c, tile, ax, gy, 2, ground);
    }
    px(c, tile, w - 2, gy, 2, ground);
    // 大門（在左邊三分之一）
    const dx = Math.round(w * 0.42);
    px(c, '#1a120c', dx - 10, gy + 4, 20, ground - 4);
    px(c, '#f6e2a8', dx - 8, gy + 6, 16, ground - 6);
    px(c, '#c9a24a', dx - 10, gy - 6, 20, 5);
    c.fillStyle = '#f4efe4';
    c.beginPath();
    c.arc(dx, gy - 4, 3, Math.PI, 0);
    c.fill();
    px(c, '#c62828', dx, gy - 6, 1, 3);
  });
}

function drawHayashi(c: CanvasRenderingContext2D, b: TainanShophouse, d: DrawCtx): void {
  blit(c, hayashiSprite(b), b.x0 * T, TN.northLine * T);
  if (d.night) {
    const w = (b.x1 - b.x0) * T;
    glow(c, b.x0 * T + w * 0.42, TN.northLine * T - 12, 40, '255, 220, 150', 0.35);
    glow(c, b.x0 * T + 34, TN.northLine * T - 118, 26, '255, 120, 110', 0.35);
  }
}

function drawNorthHouse(c: CanvasRenderingContext2D, b: TainanShophouse, d: DrawCtx): void {
  if (b.special === 'duxiaoyue') drawDuxiaoyue(c, b, d);
  else if (b.special === 'hayashi') drawHayashi(c, b, d);
  else blit(c, townhouseSprite('tn', b), b.x0 * T, TN.northLine * T);
}

// ── 孔廟 ──

// 大成殿：重簷（上下兩層屋頂）、橘紅瓦、燕尾脊、正中間的通天筒；紅柱、木格門、白色柱珠；兩層屋頂中間直的「大成殿」匾
function dachengSprite(): HTMLCanvasElement {
  const d = TN.dacheng;
  const w = Math.round((d.x1 - d.x0) * T);
  const pad = 14;
  const cw = w + pad * 2;
  const h = 96;
  return cached('tn-dacheng', cw, h, (c) => {
    const ox = pad;
    const base = h;
    // 牆＋柱子＋格門
    const wallTop = base - 34;
    px(c, '#8b2a22', ox + 6, wallTop, w - 12, 34);
    const bays = 5;
    const bw = (w - 12) / bays;
    for (let i = 0; i < bays; i += 1) {
      const bx = ox + 6 + i * bw;
      px(c, '#5a1a12', bx + 4, wallTop + 6, bw - 8, 26);
      for (let k = bx + 6; k < bx + bw - 5; k += 3) px(c, '#a8643a', Math.round(k), wallTop + 8, 1, 14);
      for (let k = wallTop + 8; k < wallTop + 22; k += 3) px(c, '#a8643a', Math.round(bx + 5), k, Math.round(bw - 10), 1);
      px(c, '#c9a24a', bx + 5, wallTop + 24, bw - 10, 1);
    }
    for (let i = 0; i <= bays; i += 1) {
      const colX = Math.round(ox + 6 + i * bw) - 2;
      px(c, '#c62828', colX, wallTop + 2, 4, 32);
      px(c, '#e53935', colX, wallTop + 2, 1, 32);
      px(c, '#e8e2d6', colX - 1, base - 3, 6, 3);
    }
    // 下層屋簷：寬寬的、兩端微微翹起
    const roof = (y: number, inset: number, depth: number) => {
      c.fillStyle = '#b5552e';
      c.beginPath();
      c.moveTo(inset - 6, y + depth);
      c.quadraticCurveTo(inset + 4, y + depth - 3, inset + 14, y);
      c.lineTo(cw - inset - 14, y);
      c.quadraticCurveTo(cw - inset - 4, y + depth - 3, cw - inset + 6, y + depth);
      c.closePath();
      c.fill();
      for (let k = 2; k < depth; k += 3) px(c, '#9a4424', inset + 6 + k * 0.4, y + k, cw - (inset + 6 + k * 0.4) * 2, 1);
      px(c, '#d77a4a', inset + 12, y, cw - (inset + 12) * 2, 2);
      px(c, '#5a2a18', inset - 6, y + depth - 1, cw - (inset - 6) * 2, 2);
    };
    roof(wallTop - 12, 0, 14);
    // 兩層屋頂中間的木牆
    px(c, '#6b2a1c', ox + 14, wallTop - 24, w - 28, 12);
    // 上層屋頂（歇山）
    roof(wallTop - 46, 22, 18);
    // 「大成殿」直匾：掛在上層屋簷下（蓋在屋簷前面）
    px(c, '#15100c', cw / 2 - 6, wallTop - 30, 12, 20);
    px(c, '#c9a24a', cw / 2 - 6, wallTop - 30, 12, 1);
    px(c, '#c9a24a', cw / 2 - 6, wallTop - 11, 12, 1);
    text(c, '大', cw / 2, wallTop - 26, '#f2d27a', `900 5px ${SERIF_TC}`);
    text(c, '成', cw / 2, wallTop - 20.5, '#f2d27a', `900 5px ${SERIF_TC}`);
    text(c, '殿', cw / 2, wallTop - 15, '#f2d27a', `900 5px ${SERIF_TC}`);
    // 正脊：燕尾兩端高高翹起、中間通天筒
    const ry = wallTop - 48;
    c.strokeStyle = '#7a3220';
    c.lineWidth = 4;
    c.beginPath();
    c.moveTo(36, ry - 10);
    c.quadraticCurveTo(44, ry + 1, 54, ry);
    c.lineTo(cw - 54, ry);
    c.quadraticCurveTo(cw - 44, ry + 1, cw - 36, ry - 10);
    c.stroke();
    c.strokeStyle = '#c98a5a';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(37, ry - 11);
    c.quadraticCurveTo(44, ry - 1, 54, ry - 2);
    c.lineTo(cw - 54, ry - 2);
    c.quadraticCurveTo(cw - 44, ry - 1, cw - 37, ry - 11);
    c.stroke();
    // 通天筒（脊正中間的圓筒，孔廟才有）
    px(c, '#7a3220', cw / 2 - 3, ry - 14, 6, 14);
    px(c, '#9a4a2e', cw / 2 - 2, ry - 14, 2, 14);
    px(c, '#5a2a18', cw / 2 - 4, ry - 15, 8, 2);
    px(c, '#c9a24a', cw / 2 - 1, ry - 18, 2, 3);
  });
}

function drawDacheng(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const s = dachengSprite();
  blit(c, s, TN.dacheng.x0 * T - 14, TN.dacheng.y1 * T);
  if (d.night) glow(c, ((TN.dacheng.x0 + TN.dacheng.x1) / 2) * T, TN.dacheng.y1 * T - 20, 60, '255, 190, 120', 0.25);
}

// 明倫堂：一層的長屋、紅牆、木格窗、白色門楣上的「明倫堂」匾
function minglunSprite(): HTMLCanvasElement {
  const m = TN.minglun;
  const w = Math.round((m.x1 - m.x0) * T);
  const pad = 8;
  const cw = w + pad * 2;
  const h = 60;
  return cached('tn-minglun', cw, h, (c) => {
    const ox = pad;
    const base = h;
    const wallTop = base - 30;
    px(c, '#9a3324', ox + 4, wallTop, w - 8, 30);
    px(c, '#b84a36', ox + 4, wallTop, w - 8, 2);
    // 中間的門＋兩邊的格窗
    const doorW = 26;
    px(c, '#4a1a12', cw / 2 - doorW / 2, wallTop + 13, doorW, 17);
    for (let k = 0; k < doorW; k += 4) px(c, '#8a5032', cw / 2 - doorW / 2 + k + 1, wallTop + 15, 1, 13);
    px(c, '#f2e8d4', cw / 2 - doorW / 2 + 2, wallTop + 22, doorW - 4, 1);
    for (const wx of [ox + 12, cw / 2 - doorW / 2 - 26, cw / 2 + doorW / 2 + 8, ox + w - 30]) {
      px(c, '#4a1a12', wx, wallTop + 8, 18, 13);
      for (let k = 2; k < 18; k += 3) px(c, '#c98a52', wx + k, wallTop + 9, 1, 11);
      px(c, '#c98a52', wx + 1, wallTop + 14, 16, 1);
    }
    for (let i = 0; i <= 4; i += 1) {
      const colX = Math.round(ox + 4 + i * ((w - 12) / 4));
      px(c, '#c62828', colX, wallTop + 2, 4, 28);
      px(c, '#e8e2d6', colX - 1, base - 3, 6, 3);
    }
    // 匾額
    px(c, '#15100c', cw / 2 - 18, wallTop + 3, 36, 9);
    px(c, '#c9a24a', cw / 2 - 18, wallTop + 3, 36, 1);
    px(c, '#c9a24a', cw / 2 - 18, wallTop + 11, 36, 1);
    text(c, '明倫堂', cw / 2, wallTop + 7.5, '#f2d27a', `900 6px ${SERIF_TC}`);
    // 屋頂（硬山、燕尾）
    c.fillStyle = '#a94e2b';
    c.beginPath();
    c.moveTo(0, wallTop + 2);
    c.lineTo(10, wallTop - 18);
    c.lineTo(cw - 10, wallTop - 18);
    c.lineTo(cw, wallTop + 2);
    c.closePath();
    c.fill();
    for (let k = 0; k < 18; k += 3) px(c, '#8f3f22', 4 + k * 0.5, wallTop - 16 + k, cw - 8 - k, 1);
    px(c, '#4a1e10', 0, wallTop + 1, cw, 2);
    c.strokeStyle = '#7a3220';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(6, wallTop - 26);
    c.quadraticCurveTo(12, wallTop - 18, 20, wallTop - 19);
    c.lineTo(cw - 20, wallTop - 19);
    c.quadraticCurveTo(cw - 12, wallTop - 18, cw - 6, wallTop - 26);
    c.stroke();
  });
}

// 南牆（跟人排前後：在牆後面的人會被擋住）＋「全臺首學」大門
function drawSouthWall(c: CanvasRenderingContext2D): void {
  const tp = TN.temple;
  const y = tp.y1 * T;
  const seg = (x0: number, x1: number) => {
    px(c, 'rgba(0,0,0,0.2)', x0 * T, y, (x1 - x0) * T, 3);
    px(c, C.wall, x0 * T, y - 14, (x1 - x0) * T, 14);
    px(c, C.wallDark, x0 * T, y - 1, (x1 - x0) * T, 1);
    for (let x = x0 * T + 8; x < x1 * T - 8; x += 22) px(c, '#c9573f', x, y - 11, 8, 5);
    px(c, C.wallCap, x0 * T, y - 18, (x1 - x0) * T, 4);
    px(c, C.wallCapLight, x0 * T, y - 18, (x1 - x0) * T, 1);
  };
  seg(tp.x0, TN.southGate.x0);
  seg(TN.southGate.x1, tp.x1);
}

function gateSprite(): HTMLCanvasElement {
  const g = TN.southGate;
  const w = Math.round((g.x1 - g.x0) * T);
  const pad = 8;
  const cw = w + pad * 2;
  const h = 62;
  return cached('tn-gate', cw, h, (c) => {
    const ox = pad;
    const base = h;
    // 兩邊的紅牆柱、中間的門洞（暗的，人從這裡穿過去）
    px(c, '#9a3324', ox, base - 34, w, 34);
    px(c, '#2a120c', ox + 14, base - 26, w - 28, 26);
    px(c, '#3a1a10', ox + 16, base - 24, w - 32, 24);
    px(c, '#c62828', ox + 10, base - 32, 4, 32);
    px(c, '#c62828', ox + w - 14, base - 32, 4, 32);
    px(c, '#e8e2d6', ox + 9, base - 3, 6, 3);
    px(c, '#e8e2d6', ox + w - 15, base - 3, 6, 3);
    // 「全臺首學」匾：黑底金字
    px(c, '#15100c', ox + 8, base - 44, w - 16, 11);
    px(c, '#c9a24a', ox + 8, base - 44, w - 16, 1);
    px(c, '#c9a24a', ox + 8, base - 34, w - 16, 1);
    text(c, '全臺首學', cw / 2, base - 38.5, '#f2d27a', `900 7px ${SERIF_TC}`);
    // 屋頂＋燕尾
    c.fillStyle = '#b5552e';
    c.beginPath();
    c.moveTo(0, base - 42);
    c.lineTo(10, base - 56);
    c.lineTo(cw - 10, base - 56);
    c.lineTo(cw, base - 42);
    c.closePath();
    c.fill();
    for (let k = 0; k < 14; k += 3) px(c, '#9a4424', 4 + k * 0.6, base - 55 + k, cw - 8 - k * 1.2, 1);
    px(c, '#5a2a18', 0, base - 43, cw, 2);
    c.strokeStyle = '#7a3220';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(6, base - 62);
    c.quadraticCurveTo(12, base - 56, 20, base - 57);
    c.lineTo(cw - 20, base - 57);
    c.quadraticCurveTo(cw - 12, base - 56, cw - 6, base - 62);
    c.stroke();
  });
}

function drawGate(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, gateSprite(), TN.southGate.x0 * T - 8, TN.temple.y1 * T);
  if (d.night) glow(c, ((TN.southGate.x0 + TN.southGate.x1) / 2) * T, TN.temple.y1 * T - 38, 26, '255, 200, 120', 0.35);
}

// 石桌（老榕樹下）
function drawStoneTable(c: CanvasRenderingContext2D): void {
  const x = Math.round(STONE_TABLE.x * T);
  const y = Math.round(STONE_TABLE.y * T);
  px(c, 'rgba(0,0,0,0.2)', x - 8, y + 2, 16, 3);
  px(c, '#9a948a', x - 2, y - 4, 4, 6);
  c.fillStyle = '#b9b2a6';
  c.beginPath();
  c.ellipse(x, y - 6, 9, 4, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#cfc8bc';
  c.beginPath();
  c.ellipse(x, y - 7, 8, 3, 0, 0, Math.PI * 2);
  c.fill();
}

// ── 臺南市美術館二館：白色方塊一個個疊起來、上面一大片白色五角形的屋頂格架 ──
function museumSprite(): HTMLCanvasElement {
  const m = TN.museum;
  const w = Math.round((m.x1 - m.x0) * T);
  const h = 96;
  return cached('tn-museum', w, h, (c) => {
    const base = h;
    // 方塊們（不同高度，錯開）
    const boxes: [number, number, number][] = [
      [0, 0.22, 52],
      [0.18, 0.46, 64],
      [0.42, 0.7, 58],
      [0.66, 1, 48],
    ];
    for (const [a, b, bh] of boxes) {
      const x0 = Math.round(a * w);
      const x1 = Math.round(b * w);
      px(c, '#f4f4f2', x0, base - bh, x1 - x0, bh);
      px(c, '#ffffff', x0, base - bh, x1 - x0, 2);
      px(c, '#dcdcd8', x1 - 3, base - bh, 3, bh);
      // 細長的窗
      for (let k = x0 + 8; k < x1 - 8; k += 14) px(c, '#9fb8c6', k, base - bh + 10, 3, bh - 30);
    }
    // 一樓：整片玻璃、入口
    px(c, '#7f98a6', 0, base - 18, w, 18);
    for (let k = 0; k < w; k += 10) px(c, '#e8eef2', k, base - 18, 1, 18);
    px(c, '#b9d2de', 2, base - 16, w - 4, 3);
    px(c, '#2f3a42', w * 0.4, base - 14, 22, 14);
    // 屋頂的五角形格架（白色細框，在方塊上面浮著）
    const roofY = base - 74;
    px(c, 'rgba(255,255,255,0.0)', 0, roofY, w, 10);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.2;
    const pent = (cx: number, cy: number, r: number) => {
      c.beginPath();
      for (let k = 0; k < 5; k += 1) {
        const ang = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
        const x = cx + Math.cos(ang) * r;
        const y = cy + Math.sin(ang) * r * 0.55;
        if (k === 0) c.moveTo(x, y);
        else c.lineTo(x, y);
      }
      c.closePath();
      c.stroke();
    };
    for (let row = 0; row < 2; row += 1) {
      for (let cx = 8 + row * 9; cx < w - 4; cx += 18) pent(cx, roofY + 6 + row * 7, 9);
    }
    c.strokeStyle = '#d6d6d2';
    c.beginPath();
    c.moveTo(0, roofY + 16);
    c.lineTo(w, roofY + 16);
    c.stroke();
    // 細細的柱子撐著屋頂
    for (let k = 6; k < w; k += 46) px(c, '#e8e8e4', k, roofY + 16, 2, 10);
    // 招牌
    px(c, '#2f3a42', 8, base - 30, 70, 10);
    text(c, '臺南市美術館 2館', 43, base - 25, '#ffffff', `800 6px ${FONT_TC}`);
  });
}

function drawMuseum(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, museumSprite(), TN.museum.x0 * T, TN.museum.y1 * T);
  if (d.night) {
    const w = (TN.museum.x1 - TN.museum.x0) * T;
    for (let k = 0; k < 4; k += 1) glow(c, TN.museum.x0 * T + w * (0.15 + k * 0.23), TN.museum.y1 * T - 10, 34, '200, 230, 255', 0.3);
  }
}

// ── 府中街 ──

// 泮宮坊：花崗石的石坊（兩根方柱、橫樑、中間「泮宮」匾、上面石頭屋頂）
function panGongSprite(): HTMLCanvasElement {
  const p = TN.panGong;
  const w = Math.round((p.x1 - p.x0) * T);
  const h = 52;
  return cached('tn-pangong', w, h, (c) => {
    const base = h;
    const stone = '#b9b4aa';
    const dark = '#9a958b';
    for (const x of [4, w - 12]) {
      px(c, stone, x, base - 38, 8, 38);
      px(c, '#d2cdc3', x, base - 38, 2, 38);
      px(c, dark, x + 6, base - 38, 2, 38);
      px(c, dark, x - 2, base - 6, 12, 6);
    }
    px(c, stone, 0, base - 44, w, 8);
    px(c, dark, 0, base - 37, w, 1);
    px(c, '#8a857b', w / 2 - 12, base - 43, 24, 7);
    text(c, '泮宮', w / 2, base - 39.5, '#f2efe8', `900 6px ${SERIF_TC}`);
    // 石頭屋頂：兩端微翹
    c.fillStyle = '#a9a398';
    c.beginPath();
    c.moveTo(-1, base - 44);
    c.lineTo(6, base - 50);
    c.lineTo(w - 6, base - 50);
    c.lineTo(w + 1, base - 44);
    c.closePath();
    c.fill();
    px(c, '#cfcac0', 6, base - 50, w - 12, 1);
    // 柱子之間的小橫樑
    px(c, stone, 12, base - 30, w - 24, 3);
  });
}

function fuzhongSprite(s: FuzhongShop, i: number): HTMLCanvasElement {
  const w = Math.round((s.x1 - s.x0) * T);
  const h = 50;
  return cached(`tn-fz-${i}`, w, h, (c) => {
    const base = h;
    const walls: Record<FuzhongShop['kind'], string> = { craft: '#d9c7a8', cafe: '#f2efe6', cat: '#f2c9c9', tea: '#e8d8b0', ice: '#cfe3ef' };
    const wall = walls[s.kind];
    px(c, wall, 0, 6, w, base - 6);
    px(c, 'rgba(0,0,0,0.12)', 0, 6, w, 1);
    // 屋頂瓦片
    px(c, '#5c4a3e', 0, 2, w, 5);
    for (let x = 0; x < w; x += 4) px(c, '#6e5a4c', x, 2, 2, 5);
    // 二樓窗
    for (let cx = 5; cx + 9 <= w - 4; cx += 14) {
      px(c, '#6b4a2f', cx - 1, 9, 11, 9);
      px(c, '#b8d6d8', cx, 10, 9, 7);
      px(c, '#6b4a2f', cx + 4, 10, 1, 7);
    }
    // 招牌、門面
    const gy = base - 22;
    if (s.kind === 'cafe') {
      // 招牌板＋綠白條紋遮陽棚
      px(c, '#2a6a4a', 4, gy - 10, w - 8, 7);
      text(c, 'COFFEE', w / 2, gy - 6.5, '#f2efe6', '800 5px system-ui, sans-serif');
      px(c, '#2a6a4a', 1, gy - 2, w - 2, 5);
      for (let k = 1; k < w - 1; k += 6) px(c, '#f2efe6', k, gy - 2, 3, 5);
      px(c, 'rgba(0,0,0,0.2)', 1, gy + 3, w - 2, 1);
    } else if (s.kind === 'tea') {
      px(c, '#c62828', 2, gy - 10, w - 4, 8);
      text(c, '古早味紅茶', w / 2, gy - 6, '#ffffff', `900 6px ${FONT_TC}`);
    } else if (s.kind === 'cat') {
      px(c, '#ffffff', 4, gy - 10, w - 8, 8);
      text(c, '🐈', w / 2, gy - 6, '#3a2e28', '7px system-ui, "Apple Color Emoji", sans-serif');
    } else if (s.kind === 'ice') {
      px(c, '#1f5fa8', 2, gy - 10, w - 4, 8);
      text(c, '冰', w / 2, gy - 6, '#ffffff', `900 7px ${FONT_TC}`);
    } else {
      px(c, '#8a5a32', 2, gy - 10, w - 4, 8);
      text(c, '手作', w / 2, gy - 6, '#f6e2b8', `900 6px ${FONT_TC}`);
    }
    // 一樓：門、櫥窗
    px(c, '#3a2e28', 2, gy + 2, w - 4, 20);
    px(c, s.kind === 'cafe' ? '#f6e2b8' : s.kind === 'tea' ? '#ffd27a' : '#f4ecd8', 4, gy + 4, w - 8, 14);
    if (s.kind === 'tea') {
      px(c, '#b8682e', 6, gy + 8, 10, 10);
      px(c, '#d98a4a', 7, gy + 9, 8, 2);
    }
    if (s.kind === 'craft') for (let k = 6; k < w - 6; k += 6) px(c, ['#c62828', '#2a6a9a', '#f2c14e'][k % 3] ?? '#c62828', k, gy + 6, 4, 8);
    if (s.kind === 'cat') for (let k = 6; k < w - 8; k += 8) px(c, '#3a2e28', k, gy + 10, 4, 4);
    // 門口的盆栽
    px(c, '#b8402f', 1, base - 6, 5, 6);
    px(c, '#3f8a4a', 0, base - 11, 7, 6);
  });
}

// 巷子上空的串燈（晚上會亮；亮光另外放在 lights，才不會被夜色壓暗）
const STRING_Y = TN.fuzhong.y0 * T + 4;
const STRING_BULBS: { x: number; y: number }[] = [];
for (let x = TN.fuzhongShops.x0 * T; x < TN.W * T; x += 48) {
  for (let k = 1; k < 6; k += 1) {
    const t = k / 6;
    STRING_BULBS.push({ x: x + 48 * t, y: STRING_Y + 10 * 2 * t * (1 - t) * 2 });
  }
}
function drawStringLights(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.strokeStyle = 'rgba(40,40,40,0.6)';
  c.lineWidth = 1;
  for (let x = TN.fuzhongShops.x0 * T; x < TN.W * T; x += 48) {
    c.beginPath();
    c.moveTo(x, STRING_Y);
    c.quadraticCurveTo(x + 24, STRING_Y + 10, x + 48, STRING_Y);
    c.stroke();
  }
  for (const b of STRING_BULBS) px(c, d.night ? '#fff0b0' : 'rgba(255, 214, 120, 0.6)', Math.round(b.x), Math.round(b.y), 2, 2);
}

// 咖啡店門口的小圓桌
function drawCafeTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const y = Math.round(CAFE_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, y + 2, 12, 2);
  px(c, '#3a3d45', cx - 1, y - 6, 2, 8);
  px(c, '#3a3d45', cx - 4, y + 1, 8, 1);
  c.fillStyle = '#f2efe6';
  c.beginPath();
  c.ellipse(cx, y - 7, 7, 3, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#ffffff', cx - 3, y - 9, 3, 2);
  px(c, '#7a4a2a', cx + 1, y - 9, 2, 2);
}

// ── 莉莉水果店：二樓招牌、門口一攤攤當季水果（西瓜、木瓜、芒果、鳳梨、香蕉）──
function lilySprite(): HTMLCanvasElement {
  const l = TN.lily;
  const w = Math.round((l.x1 - l.x0) * T);
  const h = 58;
  return cached('tn-lily', w, h, (c) => {
    const base = h;
    px(c, '#f4f1e8', 0, 6, w, base - 6);
    px(c, '#5c4a3e', 0, 2, w, 5);
    for (let x = 0; x < w; x += 4) px(c, '#6e5a4c', x, 2, 2, 5);
    for (let cx = 6; cx + 10 <= w - 4; cx += 15) {
      px(c, '#6b4a2f', cx - 1, 11, 12, 10);
      px(c, '#b8d6d8', cx, 12, 10, 8);
    }
    // 招牌：綠底白字
    px(c, '#1f7a4a', 3, 24, w - 6, 11);
    px(c, '#ffffff', 3, 24, w - 6, 1);
    text(c, '莉莉水果店', w / 2, 29.5, '#ffffff', `900 8px ${FONT_TC}`);
    // 一樓：店裡（亮的）、冰櫃
    px(c, '#3a2e28', 0, base - 22, w, 22);
    px(c, '#fff4d6', 3, base - 20, w - 6, 12);
    px(c, '#cfe3ef', 6, base - 18, 18, 8);
    px(c, '#e8f2f8', 7, base - 17, 16, 2);
    // 水果攤：一格格的水果
    px(c, '#8a5a32', 2, base - 8, w - 4, 8);
    px(c, '#a8703f', 2, base - 8, w - 4, 1);
    const fruits: [string, string][] = [
      ['#e2453a', '#2f8a3c'],
      ['#f29a3a', '#f6c27a'],
      ['#f6c945', '#e8a83a'],
      ['#c9a23a', '#6f8a2e'],
      ['#f2e27a', '#d9c24a'],
      ['#e85a7a', '#f7a6b8'],
    ];
    fruits.forEach(([a, b], k) => {
      const fx = 5 + k * Math.floor((w - 10) / fruits.length);
      px(c, a, fx, base - 13, 8, 5);
      px(c, b, fx + 1, base - 13, 3, 2);
      px(c, a, fx + 2, base - 15, 4, 2);
    });
  });
}

function simpleShopSprite(w: number, seed: number): HTMLCanvasElement {
  return townhouseSprite('tn', { x0: 0, x1: w / T, floors: 2, seed });
}

// 莉莉門口的小桌（不鏽鋼）
function drawLilyTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const y = Math.round((LILY_SEAT_Y - 0.7) * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 7, y + 2, 14, 2);
  px(c, '#9aa3b2', cx - 6, y - 6, 12, 2);
  px(c, '#c9ccd6', cx - 6, y - 7, 12, 1);
  px(c, '#7a8290', cx - 5, y - 4, 1, 6);
  px(c, '#7a8290', cx + 4, y - 4, 1, 6);
  // 一盤水果冰
  px(c, '#ffffff', cx - 3, y - 10, 6, 3);
  px(c, '#f2a6c4', cx - 2, y - 12, 4, 2);
  px(c, '#f6c945', cx - 1, y - 13, 2, 1);
}

// ── 路邊：行道樹、路燈、公車站牌 ──
function drawBusStop(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = Math.round(TN.busStop.x * T);
  const y = Math.round(TN.busStop.y * T);
  // 候車亭：藍色頂棚、玻璃背板
  px(c, 'rgba(0,0,0,0.2)', x - 22, y + 1, 40, 3);
  px(c, '#9fc3d6', x - 20, y - 22, 34, 20);
  px(c, 'rgba(255,255,255,0.4)', x - 18, y - 20, 6, 16);
  px(c, '#1f5fa8', x - 22, y - 26, 38, 4);
  px(c, '#2f7ac8', x - 22, y - 26, 38, 1);
  px(c, '#3a3d45', x - 21, y - 22, 2, 22);
  px(c, '#3a3d45', x + 13, y - 22, 2, 22);
  px(c, '#8a5a32', x - 16, y - 8, 24, 3);
  // 站牌：圓牌「高鐵接駁」
  px(c, '#3a3d45', x + 18, y - 30, 2, 30);
  c.fillStyle = '#e8641c';
  c.beginPath();
  c.arc(x + 19, y - 32, 6, 0, Math.PI * 2);
  c.fill();
  text(c, '高鐵', x + 19, y - 32, '#ffffff', `900 4px ${FONT_TC}`);
  px(c, '#ffffff', x + 14, y - 24, 10, 6);
  text(c, 'THSR', x + 19, y - 21, '#e8641c', '800 3px system-ui, sans-serif');
  if (d.night) glow(c, x - 4, y - 14, 22, '200, 230, 255', 0.3);
}

// ── 組成 CityScene 用的資料 ──
const STREET_TREES: [number, number][] = [
  [2, 32.3], [7, 32.3], [12, 32.3], [28, 32.3],
  [34.6, 13.2], [34.6, 18.4], [34.6, 27], [34.6, 31],
];
const LAMPS: [number, number][] = [
  [5, 11.4], [13, 11.4], [21, 11.4], [37, 11.4], [45, 11.4],
  [3, 8.5], [19, 8.5], [42, 8.5], [50, 8.5],
  [30.2, 16], [30.2, 28], [33.8, 22], [33.8, 30],
  [9, 32.2], [21, 32.2], [37, 32.2], [47, 32.2],
];
const SCOOTERS: [number, number][] = [
  ...[1.2, 2.4, 3.6, 6, 7.2, 10.2, 11.4, 12.6, 19.6, 20.8, 23.2, 24.4, 41.4, 42.6, 45.6, 46.8, 49.4, 50.6].map((x): [number, number] => [x, 8.5]),
];

const props: CityProp[] = [
  ...NORTH_ROW.map((b): CityProp => ({ y: TN.northLine, draw: (c, d) => drawNorthHouse(c, b, d) })),
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[(i * 5) % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
  { y: TN.dacheng.y1, draw: (c, d) => drawDacheng(c, d) },
  { y: TN.minglun.y1, draw: (c) => blit(c, minglunSprite(), TN.minglun.x0 * T - 8, TN.minglun.y1 * T) },
  { y: TN.panchi.y0 - 0.6, draw: (c, d) => drawPanchiShimmer(c, d.seconds) },
  ...TN.banyans.map((b): CityProp => ({ y: b.ty + 0.9, draw: (c, d) => drawBanyan(c, b.tx, b.ty, d.seconds) })),
  { y: STONE_TABLE.y, draw: (c) => drawStoneTable(c) },
  { y: TN.temple.y1, draw: (c) => drawSouthWall(c) },
  { y: TN.temple.y1 + 0.01, draw: (c, d) => drawGate(c, d) },
  { y: TN.museum.y1, draw: (c, d) => drawMuseum(c, d) },
  { y: TN.panGong.y, draw: (c) => blit(c, panGongSprite(), TN.panGong.x0 * T, TN.panGong.y * T) },
  ...FUZHONG_ROW.map((s, i): CityProp => ({ y: TN.fuzhongShops.y1, draw: (c) => blit(c, fuzhongSprite(s, i), s.x0 * T, TN.fuzhongShops.y1 * T) })),
  { y: TN.fuzhong.y0 + 0.05, draw: (c, d) => drawStringLights(c, d) },
  ...CAFE_TABLES.map((x): CityProp => ({ y: CAFE_Y, draw: (c) => drawCafeTable(c, x) })),
  { y: TN.lily.y1, draw: (c) => blit(c, lilySprite(), TN.lily.x0 * T, TN.lily.y1 * T) },
  { y: TN.southShops.y1, draw: (c) => blit(c, simpleShopSprite(Math.round((TN.southShops.x1 - TN.southShops.x0) * T / 2), 31), TN.southShops.x0 * T, TN.southShops.y1 * T) },
  { y: TN.southShops.y1, draw: (c) => blit(c, simpleShopSprite(Math.round((TN.southShops.x1 - TN.southShops.x0) * T / 2), 32), ((TN.southShops.x0 + TN.southShops.x1) / 2) * T, TN.southShops.y1 * T) },
  ...LILY_TABLES.map((x): CityProp => ({ y: LILY_SEAT_Y - 0.7, draw: (c) => drawLilyTable(c, x) })),
  { y: TN.busStop.y, draw: (c, d) => drawBusStop(c, d) },
  ...STREET_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

// 座位的家具：明倫堂前的書桌＋木凳、榕樹下的石凳、咖啡店的木椅、莉莉的鐵凳
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = TAINAN_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  if (i < 4) {
    // 書桌在人前面（北邊），背對畫面坐著讀書
    const dy = y - 12;
    px(c, 'rgba(0,0,0,0.2)', x - 8, dy + 4, 16, 2);
    px(c, '#7a4a2a', x - 8, dy - 4, 16, 6);
    px(c, '#9a6a3a', x - 8, dy - 4, 16, 2);
    px(c, '#5a3a22', x - 7, dy + 2, 2, 3);
    px(c, '#5a3a22', x + 5, dy + 2, 2, 3);
    px(c, '#f4efe4', x - 4, dy - 5, 7, 3);
    px(c, '#c62828', x + 4, dy - 5, 2, 3);
    px(c, '#6b4a2f', x - 5, y - 3, 10, 4);
    px(c, '#8a5c3a', x - 5, y - 3, 10, 1);
    return;
  }
  if (i < 6) {
    // 圓石凳
    px(c, 'rgba(0,0,0,0.2)', x - 5, y + 1, 10, 2);
    px(c, '#a59f94', x - 4, y - 3, 8, 5);
    px(c, '#c2bcb0', x - 4, y - 4, 8, 2);
    return;
  }
  if (i < 10) {
    // 咖啡店的木椅（側面）：椅背在背對桌子那邊
    const back = s.facing === 'right' ? x - 5 : x + 3;
    px(c, 'rgba(0,0,0,0.2)', x - 5, y + 1, 10, 2);
    px(c, '#8a5a32', x - 5, y - 3, 10, 3);
    px(c, '#6b4a2f', back, y - 12, 2, 12);
    px(c, '#6b4a2f', x - 4, y, 1, 3);
    px(c, '#6b4a2f', x + 3, y, 1, 3);
    return;
  }
  // 莉莉的鐵凳
  px(c, 'rgba(0,0,0,0.2)', x - 4, y + 1, 9, 2);
  px(c, '#c9ccd6', x - 4, y - 3, 8, 3);
  px(c, '#7a8290', x - 3, y, 1, 3);
  px(c, '#7a8290', x + 2, y, 1, 3);
}

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const tp = TN.temple;
const solid: Rect[] = [
  // 北邊街屋
  r(0, 0, TN.W, TN.northLine - 0.3),
  // 孔廟外牆（東牆側門、南牆大門留空）
  r(tp.x0, tp.y0, tp.x1, tp.y0 + 0.9),
  r(tp.x0, tp.y0, tp.x0 + TN.wall + 0.1, tp.y1 + 0.2),
  r(tp.x1 - TN.wall - 0.1, tp.y0, tp.x1, TN.eastGate.y0),
  r(tp.x1 - TN.wall - 0.1, TN.eastGate.y1, tp.x1, tp.y1 + 0.2),
  r(tp.x0, tp.y1 - 0.5, TN.southGate.x0 + 1, tp.y1 + 0.2),
  r(TN.southGate.x1 - 1, tp.y1 - 0.5, tp.x1, tp.y1 + 0.2),
  // 大成殿＋月台（階梯那段可以走上去）、明倫堂
  r(TN.dacheng.x0, tp.y0, TN.dacheng.x1, TN.dacheng.y1 - 0.2),
  r(TN.platform.x0, TN.platform.y0 - 0.2, TN.platform.x1, TN.platform.y1 - 0.6),
  r(TN.minglun.x0, tp.y0, TN.minglun.x1, TN.minglun.y1 - 0.2),
  // 榕樹幹、石桌
  ...TN.banyans.map((b) => r(b.tx + 0.1, b.ty + 0.3, b.tx + 0.9, b.ty + 1)),
  r(STONE_TABLE.x - 0.5, STONE_TABLE.y - 0.4, STONE_TABLE.x + 0.5, STONE_TABLE.y + 0.2),
  // 美術館、府中街的店、泮宮坊的兩根柱子、莉莉那一排
  r(TN.museum.x0, TN.museum.y0, TN.museum.x1, TN.museum.y1 - 0.2),
  r(TN.fuzhongShops.x0, TN.fuzhongShops.y0, TN.fuzhongShops.x1, TN.fuzhongShops.y1 - 0.2),
  r(TN.panGong.x0 + 0.2, TN.panGong.y - 0.4, TN.panGong.x0 + 0.8, TN.panGong.y),
  r(TN.panGong.x1 - 0.8, TN.panGong.y - 0.4, TN.panGong.x1 - 0.2, TN.panGong.y),
  r(TN.lily.x0, TN.lily.y0, TN.southShops.x1, TN.lily.y1 - 0.2),
  // 咖啡桌、莉莉的小桌
  ...CAFE_TABLES.map((x) => r(x - 0.4, CAFE_Y - 0.35, x + 0.4, CAFE_Y + 0.2)),
  ...LILY_TABLES.map((x) => r(x - 0.45, LILY_SEAT_Y - 1, x + 0.45, LILY_SEAT_Y - 0.45)),
  // 候車亭、行道樹幹、路燈
  r(TN.busStop.x - 1.4, TN.busStop.y - 0.5, TN.busStop.x + 0.9, TN.busStop.y + 0.1),
  ...STREET_TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...MINGLUN_DESKS.map((x) => r(x - 0.5, DESK_Y - 1, x + 0.5, DESK_Y - 0.5)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...NORTH_ROW.filter((b) => !b.special).map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: TN.northLine * T - 10, r: 26, color: 'rgba(255, 214, 150, 0.4)' })),
  ...FUZHONG_ROW.map((s) => ({ x: ((s.x0 + s.x1) / 2) * T, y: TN.fuzhongShops.y1 * T - 10, r: 24, color: 'rgba(255, 214, 150, 0.45)' })),
  { x: ((TN.lily.x0 + TN.lily.x1) / 2) * T, y: TN.lily.y1 * T - 12, r: 46, color: 'rgba(255, 240, 200, 0.5)' },
  ...STRING_BULBS.map((b) => ({ x: b.x + 1, y: b.y + 1, r: 7, color: 'rgba(255, 220, 130, 0.75)' })),
  { x: ((TN.minglun.x0 + TN.minglun.x1) / 2) * T, y: TN.minglun.y1 * T - 12, r: 40, color: 'rgba(255, 200, 130, 0.35)' },
];

export const TAINAN: CityDef = {
  id: 'tainan',
  W: TN.W,
  H: TN.H,
  title: { 'zh-TW': '臺南 · 孔廟', 'en-US': 'Tainan · Confucius Temple' },
  stop: { 'zh-TW': '臺南（孔廟）', 'en-US': 'Tainan (Confucius Temple)' },
  emoji: '🏯',
  station: {
    x: TN.busStop.x + 1.4,
    y: TN.busStop.y + 0.1,
    name: { 'zh-TW': '高鐵接駁車', 'en-US': 'THSR shuttle' },
    arrive: { x: TN.busStop.x + 2.6, y: TN.busStop.y + 0.1 },
  },
  background: '#cfc7ba',
  soundscape: 'zoo',
  paintGround: paintTainanGround,
  props,
  solid,
  blocked: inPanchi,
  seats: TAINAN_SEATS,
  drawSeat,
  shops: TAINAN_SHOPS,
  fortune: {
    at: r(10.6, TN.platform.y1 - 0.4, 15.4, TN.platform.y1 + 1.6),
    label: { x: 13, y: TN.platform.y1 - 0.3 },
    title: { 'zh-TW': '孔子保佑', 'en-US': 'Blessing of Confucius' },
    hint: { 'zh-TW': '在大成殿前掛一張祈福卡，祈求考運順利。', 'en-US': 'Hang a wish card in front of Dacheng Hall for exam luck.' },
    draw: { 'zh-TW': '掛一張祈福卡', 'en-US': 'Hang a wish card' },
    again: { 'zh-TW': '再掛一張', 'en-US': 'Hang another' },
    fortunes: [
      { rank: { 'zh-TW': '金榜題名', 'en-US': 'Top of the list' }, text: { 'zh-TW': '讀過的都會考，寫過的都會對！', 'en-US': 'Everything you studied will be on the test!' } },
      { rank: { 'zh-TW': '學業進步', 'en-US': 'Steady progress' }, text: { 'zh-TW': '每天一顆番茄鐘，積少成多。', 'en-US': 'One pomodoro a day adds up.' } },
      { rank: { 'zh-TW': '思路清晰', 'en-US': 'Clear mind' }, text: { 'zh-TW': '卡關的題目，睡一覺起來就通了。', 'en-US': 'The problem you are stuck on will click after a good sleep.' } },
      { rank: { 'zh-TW': '溫故知新', 'en-US': 'Review and learn' }, text: { 'zh-TW': '「溫故而知新」——今天先複習昨天的。', 'en-US': '"Review the old to learn the new" — review yesterday first.' } },
      { rank: { 'zh-TW': '有朋自遠方來', 'en-US': 'Friends from afar' }, text: { 'zh-TW': '找朋友一起讀，效率加倍。', 'en-US': 'Study with a friend and double your pace.' } },
      { rank: { 'zh-TW': '學而時習之', 'en-US': 'Learn and practice' }, text: { 'zh-TW': '學了要常常練習，才不會忘。', 'en-US': 'Practice what you learn so it sticks.' } },
    ],
  },
  infos: [
    { at: r(TN.dacheng.x0, TN.dacheng.y0 - 1.6, TN.dacheng.x1, TN.dacheng.y1), title: { 'zh-TW': '臺南孔廟 · 大成殿', 'en-US': 'Tainan Confucius Temple · Dacheng Hall' }, text: { 'zh-TW': '1665 年明鄭時期建成，是臺灣第一座孔廟，所以叫「全臺首學」。大成殿供奉孔子，屋脊正中間的圓筒叫「通天筒」。', 'en-US': 'Built in 1665, it is the first Confucius temple in Taiwan — hence "the first school of all Taiwan". Dacheng Hall honours Confucius; the cylinder on the ridge is the "tongtian tube".' } },
    { at: r(TN.minglun.x0, TN.minglun.y0 - 1.2, TN.minglun.x1, TN.minglun.y1), title: { 'zh-TW': '明倫堂', 'en-US': 'Minglun Hall' }, text: { 'zh-TW': '以前府城的學生在這裡上課讀書。坐在前面的書桌就能專注。', 'en-US': 'Where students of the old prefecture city studied. Sit at a desk in front to focus.' } },
    { at: r(TN.panchi.cx - TN.panchi.rx, TN.panchi.y0 - 0.6, TN.panchi.cx + TN.panchi.rx, TN.panchi.y0 + TN.panchi.ry), title: { 'zh-TW': '泮池', 'en-US': 'Pan Pond' }, text: { 'zh-TW': '孔廟才有的半月形水池。古時候考上秀才叫「入泮」，就是從這裡來的。', 'en-US': 'A half-moon pond found only at Confucius temples. Passing the first imperial exam was called "entering the Pan".' } },
    { at: r(26.4, 1, 40.4, TN.northLine), title: { 'zh-TW': '林百貨', 'en-US': 'Hayashi Department Store' }, text: { 'zh-TW': '1932 年開幕，是臺南第一家百貨公司，有當時南臺灣少見的電梯，頂樓還有一座神社（末廣社）。', 'en-US': 'Opened in 1932 as Tainan’s first department store, with a rare elevator for its time and a rooftop shrine.' } },
    { at: r(14, 3, 18.6, TN.northLine), title: { 'zh-TW': '度小月擔仔麵', 'en-US': 'Du Hsiao Yueh' }, text: { 'zh-TW': '1895 年洪芋頭挑著擔子賣麵，漁夫在淡季（小月）靠賣麵度日，所以叫「度小月」。', 'en-US': 'In 1895 a fisherman sold noodles from a shoulder pole to get through the off-season ("small months") — hence the name.' } },
    { at: r(TN.museum.x0, TN.museum.y0 - 3, TN.museum.x1, TN.museum.y1), title: { 'zh-TW': '臺南市美術館 2館', 'en-US': 'Tainan Art Museum Building 2' }, text: { 'zh-TW': '2019 年開館，屋頂是一片白色五角形格架，由日本建築師坂茂設計。', 'en-US': 'Opened in 2019; its roof is a canopy of white pentagons, designed by Shigeru Ban.' } },
    { at: r(TN.panGong.x0, TN.panGong.y - 3, TN.panGong.x1, TN.panGong.y), title: { 'zh-TW': '泮宮坊', 'en-US': 'Pangong Archway' }, text: { 'zh-TW': '清朝乾隆年間立的石坊，在府中街口，以前是進孔廟（泮宮）的入口。', 'en-US': 'A Qing-dynasty stone archway at the mouth of Fuzhong Street, once the way into the temple school.' } },
    { at: r(TN.southGate.x0, TN.temple.y1 - 3.4, TN.southGate.x1, TN.temple.y1), title: { 'zh-TW': '全臺首學', 'en-US': 'First School of Taiwan' }, text: { 'zh-TW': '孔廟是清朝臺灣最早的官方學校，所以掛著「全臺首學」的匾。', 'en-US': 'The temple was Taiwan’s earliest official school, hence the plaque "First School of All Taiwan".' } },
  ],
  labels: [
    { x: 13, y: TN.dacheng.y0 - 1.8, text: { 'zh-TW': '大成殿', 'en-US': 'Dacheng Hall' }, color: '#f87171' },
    { x: (TN.minglun.x0 + TN.minglun.x1) / 2, y: DESK_Y - 1.35, text: { 'zh-TW': '📖 明倫堂（坐書桌專注）', 'en-US': '📖 Minglun Hall (sit to focus)' }, color: '#4ade80' },
    { x: (TN.museum.x0 + TN.museum.x1) / 2, y: TN.museum.y0 - 3.2, text: { 'zh-TW': '🏛️ 臺南市美術館 2館', 'en-US': '🏛️ Tainan Art Museum' }, color: '#e2e8f0' },
    { x: 44, y: TN.fuzhong.y1 + 0.05, text: { 'zh-TW': '府中街', 'en-US': 'Fuzhong St.' }, color: '#fbbf24' },
  ],
  walkers: [
    { x0: 1, y0: 8.05, x1: 51, y1: 8.05, count: 5 },
    { x0: 1, y0: 11.7, x1: 51, y1: 11.7, count: 3 },
    { x0: 34.1, y0: 12.4, x1: 34.1, y1: 32, count: 2 },
    { x0: 34.5, y0: 23.2, x1: 51, y1: 23.2, count: 4 },
    { x0: 4.5, y0: 23.9, x1: 28, y1: 23.9, count: 3 },
    { x0: 1, y0: 31.85, x1: 51, y1: 31.85, count: 3 },
  ],
  traffic: [
    { y: 9.6, dir: -1, x0: 0, x1: TN.W, count: 3 },
    { y: 10.9, dir: 1, x0: 0, x1: TN.W, count: 3 },
    { y: 33.6, dir: -1, x0: 0, x1: TN.W, count: 2 },
    { y: 35.1, dir: 1, x0: 0, x1: TN.W, count: 3 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點明倫堂前的書桌、榕樹下石凳、咖啡店或莉莉的位子坐下專注 · 走到店門口買小吃 · 大成殿前掛祈福卡 · 點地標看介紹 · 府前路的高鐵接駁車回台北',
    'en-US': 'WASD / arrows to move · click a desk at Minglun Hall, a stone stool, a café or Lily seat to focus · walk up to a shop to buy food · hang a wish card at Dacheng Hall · click landmarks for info · THSR shuttle (south) back to Taipei',
  },
  hintTouch: {
    'zh-TW': '點書桌、石凳、咖啡店或莉莉的位子坐下專注 · 走到店門口買小吃 · 點地標看介紹 · 南邊高鐵接駁車回台北',
    'en-US': 'Tap a desk or seat to focus · walk up to shops to buy food · tap landmarks for info · THSR shuttle (south) back to Taipei',
  },
};
