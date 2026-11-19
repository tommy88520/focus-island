// 大阪的美術：大阪城（白牆綠瓦金鯱的天守閣、石垣、護城河、松樹）、城前公園（櫻花、長椅）、
// 新世界（通天閣、炸串店、比利肯、拱門）、道頓堀的店（立體大招牌：章魚、螃蟹、龍、霓虹）、戎橋旁的電子看板、
// 道頓堀運河（遊船）、木棧道、馬路、JR 大阪站。最後組成 CityScene 用的 OSAKA。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { BILLBOARD, DOTON_SHOPS, KUSHI_TABLES, KUSHI_TABLE_Y, OS, OSAKA_SEATS, OSAKA_SHOPS, PARK_BENCHES, PARK_BENCH_Y } from './osaka';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra } from './cityArt';
import { drawLantern, drawStreetLamp, tiledRoof } from './kyotoArt';

const CASTLE_ROOF = '#3f8a72';
const GOLD = '#e8b830';

// ── 地面（畫一次）──
export function paintOsakaGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1583);
  const W = OS.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 4 * T);
  sky.addColorStop(0, '#78b8e6');
  sky.addColorStop(1, '#dff0f9');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 4 * T);
  // 城的周圍：樹林
  px(c, '#4f7a46', 0, 3.6 * T, W, (OS.moat.y0 - 3.6) * T);
  for (let i = 0; i < 200; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#3f6a3a' : '#5a8a4e';
    c.beginPath();
    c.arc(rand() * W, 3.8 * T + rand() * (OS.moat.y0 - 4.2) * T, 5 + rand() * 6, 0, Math.PI * 2);
    c.fill();
  }
  // 護城河（石垣倒影）
  const my0 = OS.moat.y0 * T;
  const my1 = OS.moat.y1 * T;
  px(c, '#4a7f8f', 0, my0, OS.park.x1 * T, my1 - my0);
  for (let i = 0; i < 60; i += 1) px(c, 'rgba(255,255,255,0.25)', Math.floor(rand() * OS.park.x1 * T), Math.floor(my0 + 3 + rand() * (my1 - my0 - 5)), 6 + Math.floor(rand() * 6), 1);
  px(c, '#8f897d', 0, my1 - 2, OS.park.x1 * T, 2);
  // 公園的草地、碎石步道
  px(c, '#7aa65a', 0, my1, OS.park.x1 * T, (OS.park.y1 - OS.moat.y1) * T);
  for (let i = 0; i < 400; i += 1) px(c, rand() < 0.5 ? '#6c9850' : '#8ab468', Math.floor(rand() * OS.park.x1 * T), Math.floor(my1 + rand() * (OS.park.y1 - OS.moat.y1) * T), 2, 1);
  px(c, '#d8cdb5', 0, 15.6 * T, OS.park.x1 * T, T);
  // 新世界後面：一排老商店街的樓（霓虹招牌）
  const sx0 = OS.shinsekai.x0 * T;
  for (let x = sx0, k = 0; x < W; k += 1) {
    const bw = 34 + Math.floor(rand() * 20);
    const top = 4.2 * T + Math.floor(rand() * 30);
    px(c, ['#c9b8a0', '#a8b4c0', '#d6c2a8', '#b0a090'][k % 4] ?? '#c9b8a0', x, top, bw, OS.moat.y0 * T - top);
    for (let y = top + 6; y < OS.moat.y0 * T - 8; y += 10) for (let wx = x + 4; wx < x + bw - 6; wx += 9) px(c, '#5a6a7a', wx, y, 5, 5);
    px(c, ['#e8402e', '#f6c945', '#2bb673', '#7a3fb0'][k % 4] ?? '#e8402e', x + 4, top + 4, 8, Math.min(40, OS.moat.y0 * T - top - 10));
    x += bw + 2;
  }
  tiles(c, { x0: OS.shinsekai.x0, y0: OS.moat.y0, x1: OS.W, y1: OS.street.y1 }, '#b5ada0', '#a39b8d', 12);
  // 道頓堀那排店的地面、前面的街
  tiles(c, { x0: 0, y0: OS.park.y1, x1: OS.shinsekai.x0, y1: OS.street.y1 }, '#bdb6aa', '#aaa395', 12);
  // 道頓堀運河
  const cy0 = OS.canal.y0 * T;
  const cy1 = OS.canal.y1 * T;
  px(c, '#8f897d', 0, cy0 - 3, W, 3);
  const water = c.createLinearGradient(0, cy0, 0, cy1);
  water.addColorStop(0, '#3d6f86');
  water.addColorStop(1, '#2f5a70');
  c.fillStyle = water;
  c.fillRect(0, cy0, W, cy1 - cy0);
  for (let i = 0; i < 90; i += 1) px(c, 'rgba(255,255,255,0.2)', Math.floor(rand() * W), Math.floor(cy0 + 3 + rand() * (cy1 - cy0 - 6)), 6 + Math.floor(rand() * 8), 1);
  // 戎橋（石橋）
  const bx0 = OS.ebisu.x0 * T;
  const bx1 = OS.ebisu.x1 * T;
  px(c, 'rgba(0,0,0,0.3)', bx0 + 3, cy0, bx1 - bx0, cy1 - cy0 + 3);
  px(c, '#c9c2b4', bx0, cy0 - 4, bx1 - bx0, cy1 - cy0 + 8);
  for (let y = cy0; y < cy1; y += 6) px(c, '#b8b0a0', bx0 + 4, y, bx1 - bx0 - 8, 1);
  for (const x of [bx0, bx1 - 4]) {
    px(c, '#8a847a', x, cy0 - 6, 4, cy1 - cy0 + 12);
    for (let y = cy0 - 2; y < cy1 + 2; y += 12) px(c, '#e0dbd0', x - 1, y, 6, 3);
  }
  // 木棧道
  const wy0 = OS.boardwalk.y0 * T;
  const wy1 = OS.boardwalk.y1 * T;
  px(c, '#a07a52', 0, wy0, W, wy1 - wy0);
  for (let x = 0; x < W; x += 6) px(c, '#8a6642', x, wy0, 1, wy1 - wy0);
  px(c, '#6b4a2f', 0, wy0, W, 2);
  // 人行道、馬路、站前廣場
  tiles(c, { x0: 0, y0: OS.boardwalk.y1, x1: OS.W, y1: OS.road.y0 }, '#cfc9bd', '#bfb8aa', 12);
  road(c, { x0: 0, y0: OS.road.y0, x1: OS.W, y1: OS.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((OS.road.y0 + OS.road.y1) / 2) * T), 12, 1);
  zebra(c, 26, OS.road.y0, 30, OS.road.y1, false);
  tiles(c, { x0: 0, y0: OS.road.y1, x1: OS.W, y1: OS.H }, '#d8d3c7', '#c7c1b3', 16);
}

// ── 大阪城天守閣：石垣、白牆、綠瓦、金色的裝飾和鯱 ──
function castleSprite(): HTMLCanvasElement {
  const w = Math.round((OS.castle.x1 - OS.castle.x0) * T);
  const h = 168;
  return cached('os-castle', w, h, (c) => {
    const cx = w / 2;
    // 石垣（往上收）
    c.fillStyle = '#8f897d';
    c.beginPath();
    c.moveTo(4, h);
    c.lineTo(28, h - 42);
    c.lineTo(w - 28, h - 42);
    c.lineTo(w - 4, h);
    c.fill();
    for (let y = h - 40; y < h; y += 5) for (let x = (y % 10 ? 0 : 6) + 10; x < w - 10; x += 12) px(c, '#a39d90', x, y, 10, 4);
    // 五層：白牆＋綠瓦，每層往上收
    let y = h - 42;
    const floors = [176, 150, 126, 102, 80];
    floors.forEach((fw, k) => {
      const wallH = k === 4 ? 18 : 16;
      y -= wallH;
      px(c, '#f4f2ec', cx - fw / 2, y, fw, wallH);
      for (let x = cx - fw / 2 + 8; x < cx + fw / 2 - 8; x += 14) px(c, '#2a2d33', x, y + 5, 6, 6);
      if (k === 4) {
        // 最上層的金色裝飾（虎、鶴的浮雕）
        px(c, '#1f2a24', cx - fw / 2, y, fw, wallH);
        for (let x = cx - fw / 2 + 6; x < cx + fw / 2 - 6; x += 16) px(c, GOLD, x, y + 4, 10, 8);
      }
      const rw = fw + 24;
      y -= 10;
      tiledRoof(c, cx - rw / 2, y, rw, 10, CASTLE_ROOF, 5);
      px(c, GOLD, cx - rw / 2 - 5, y + 8, 3, 2);
      px(c, GOLD, cx + rw / 2 + 2, y + 8, 3, 2);
      // 千鳥破風（三角形的屋頂）
      if (k === 1 || k === 3) {
        c.fillStyle = CASTLE_ROOF;
        c.beginPath();
        c.moveTo(cx - 18, y + 2);
        c.lineTo(cx, y - 10);
        c.lineTo(cx + 18, y + 2);
        c.fill();
        px(c, '#f4f2ec', cx - 6, y - 4, 12, 5);
        px(c, GOLD, cx - 1, y - 9, 2, 2);
      }
    });
    // 屋脊兩端的金鯱
    for (const x of [cx - 46, cx + 40]) {
      px(c, GOLD, x, y - 8, 6, 8);
      px(c, '#fff0a8', x + 1, y - 8, 2, 2);
    }
    px(c, CASTLE_ROOF, cx - 40, y - 3, 80, 3);
  });
}

// 松樹（城邊）
function drawPine(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 10, by - 1, 20, 3);
  px(c, '#5c3d22', cx - 2, by - 20, 4, 20);
  for (const [dx, dy, w] of [[-12, -22, 18], [2, -28, 16], [-8, -34, 16], [-2, -40, 10]] as const) {
    px(c, '#2f5a32', cx + dx, by + dy, w, 6);
    px(c, '#3f6a3a', cx + dx, by + dy, w, 2);
  }
}

// 櫻花樹
export function drawSakura(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 11, by - 1, 22, 3);
  px(c, '#5c3d22', cx - 2, by - 16, 4, 16);
  for (const [dx, dy, r, col] of [[-8, -22, 9, '#f6b7c9'], [8, -22, 9, '#f6b7c9'], [0, -30, 10, '#f9c9d6'], [0, -20, 7, '#fbdde5']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
  // 飄下來的花瓣
  for (let k = 0; k < 3; k += 1) {
    const t = (seconds * 0.25 + k / 3 + x * 0.1) % 1;
    px(c, `rgba(249, 201, 214, ${1 - t})`, Math.round(cx - 10 + k * 9 + Math.sin(seconds + k) * 4), Math.round(by - 20 + t * 22), 2, 2);
  }
}

// 公園長椅（背對畫面看城）：沒椅背的木椅
function drawParkBench(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(PARK_BENCH_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 21, by + 1, 42, 3);
  px(c, '#8a5a32', cx - 21, by - 4, 42, 4);
  px(c, '#a8703f', cx - 21, by - 4, 42, 1);
  px(c, '#3a3d45', cx - 18, by, 3, 2);
  px(c, '#3a3d45', cx + 15, by, 3, 2);
}

// ── 通天閣：鐵塔、上面的展望台、霓虹的燈（會換顏色） ──
function tsutenkakuSprite(): HTMLCanvasElement {
  return cached('os-tsutenkaku', 72, 184, (c) => {
    const cx = 36;
    // 四隻腳（拱門）
    c.fillStyle = '#9aa0a8';
    c.beginPath();
    c.moveTo(2, 184);
    c.lineTo(26, 120);
    c.lineTo(46, 120);
    c.lineTo(70, 184);
    c.lineTo(58, 184);
    c.quadraticCurveTo(cx, 146, 14, 184);
    c.fill();
    for (let y = 126; y < 182; y += 8) px(c, 'rgba(0,0,0,0.12)', 6 + (184 - y) * 0.35, y, 60 - (184 - y) * 0.7, 1);
    // 塔身
    px(c, '#b5bbc4', cx - 9, 40, 18, 82);
    for (let y = 44; y < 120; y += 6) {
      px(c, '#8a909a', cx - 9, y, 18, 1);
      px(c, '#8a909a', cx - 9 + ((y / 6) % 2) * 9, y, 9, 6);
    }
    // 展望台
    px(c, '#f4f2ec', cx - 16, 30, 32, 12);
    px(c, '#2a3a4a', cx - 14, 33, 28, 5);
    px(c, '#d0d4da', cx - 12, 14, 24, 16);
    px(c, '#c8102e', cx - 12, 20, 24, 6);
    text(c, '通天閣', cx, 23, '#ffffff', `900 5px ${FONT_TC}`);
    px(c, '#9aa0a8', cx - 2, 0, 4, 14);
  });
}
function drawTsutenkaku(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = OS.shinsekai.tower * T - 36;
  const by = OS.shinsekai.towerLine * T;
  blit(c, tsutenkakuSprite(), x, by);
  // 塔頂的天氣燈：白天看不出來，晚上換顏色
  const col = ['#ff6060', '#60a0ff', '#ffffff', '#ffd060'][Math.floor(d.seconds / 3) % 4] ?? '#ffffff';
  px(c, d.night ? col : '#d0d4da', x + 30, by - 184 + 4, 12, 6);
  if (d.night) {
    glow(c, x + 36, by - 176, 30, '255, 220, 200', 0.4);
    for (let y = by - 140; y < by - 62; y += 10) px(c, '#ffe08a', x + 26, y, 2, 2);
  }
}

// 新世界的炸串店（大大的招牌、燈籠）
function kushiSprite(): HTMLCanvasElement {
  return cached('os-kushi', 96, 64, (c) => {
    px(c, '#3a2a20', 0, 14, 96, 50);
    px(c, '#f6c945', 0, 0, 96, 18);
    px(c, '#c8102e', 0, 16, 96, 3);
    text(c, '串かつ', 48, 9, '#c8102e', `900 11px ${FONT_TC}`);
    px(c, '#2a1a14', 30, 30, 36, 34);
    px(c, '#f4efe2', 30, 30, 36, 12);
    text(c, '元祖', 48, 36, '#2a1a14', `900 6px ${FONT_TC}`);
    for (const x of [6, 74]) {
      px(c, '#f4efe2', x, 30, 16, 20);
      for (let k = 0; k < 4; k += 1) px(c, '#9a7a52', x, 30 + k * 5, 16, 1);
    }
  });
}

// 比利肯（摸腳底許願的福神）
function drawBilliken(c: CanvasRenderingContext2D): void {
  const cx = Math.round(OS.shinsekai.billiken.x * T);
  const by = Math.round(OS.shinsekai.billiken.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 10, by - 1, 20, 3);
  px(c, '#6b4428', cx - 10, by - 8, 20, 8);
  px(c, '#c9a24a', cx - 7, by - 22, 14, 14);
  px(c, '#e0bc5c', cx - 8, by - 34, 16, 13);
  px(c, '#e0bc5c', cx - 3, by - 38, 6, 4);
  px(c, '#3a2a20', cx - 5, by - 29, 3, 1);
  px(c, '#3a2a20', cx + 2, by - 29, 3, 1);
  px(c, '#3a2a20', cx - 3, by - 25, 6, 1);
  px(c, '#f0d88a', cx - 7, by - 10, 5, 3);
  px(c, '#f0d88a', cx + 2, by - 10, 5, 3);
}

// 新世界的拱門
function drawShinsekaiArch(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round((OS.shinsekai.x0 + 0.8) * T);
  const x1 = Math.round((OS.W - 0.8) * T);
  const by = Math.round(OS.shinsekai.archY * T);
  for (const x of [x0, x1 - 4]) {
    px(c, 'rgba(0,0,0,0.25)', x - 1, by, 6, 2);
    px(c, '#6b7280', x, by - 46, 4, 46);
  }
  px(c, '#1f2a44', x0 - 4, by - 58, x1 - x0 + 8, 14);
  px(c, '#e8402e', x0 - 4, by - 58, x1 - x0 + 8, 2);
  text(c, '新世界  SHINSEKAI', (x0 + x1) / 2, by - 51, d.night ? '#ffe08a' : '#f6c945', `900 8px ${FONT_TC}`);
  for (let x = x0, k = 0; x < x1; x += 8, k += 1) px(c, d.night && (k + Math.floor(d.seconds * 4)) % 3 === 0 ? '#fff6c8' : '#e8c86a', x, by - 43, 3, 2);
}

// 炸串店外的桌子
function drawKushiTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(KUSHI_TABLE_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 16, by + 1, 32, 3);
  px(c, '#8a5a32', cx - 16, by - 10, 32, 6);
  px(c, '#a8703f', cx - 16, by - 10, 32, 1);
  px(c, '#5a3a22', cx - 14, by - 4, 3, 5);
  px(c, '#5a3a22', cx + 11, by - 4, 3, 5);
  // 炸串＋醬汁鐵盒
  px(c, '#9aa3b2', cx - 4, by - 14, 10, 4);
  px(c, '#3a2414', cx - 3, by - 13, 8, 2);
  for (let k = 0; k < 3; k += 1) px(c, '#d9a040', cx - 12 + k * 3, by - 16, 2, 6);
}

// ── 道頓堀的店：二到三層樓的建築、正面的立體大招牌 ──
function dotonSprite(i: number): HTMLCanvasElement {
  const s = DOTON_SHOPS[i] ?? { x0: 0, x1: 6, name: '', color: '#c8102e' };
  const w = Math.round((s.x1 - s.x0) * T);
  const h = 72;
  return cached(`os-doton-${i}`, w, h, (c) => {
    const rand = seeded(800 + i);
    const wall = ['#e8dcc4', '#d6dde6', '#f0d2c0', '#e3d6b8', '#2a2d3a'][i % 5] ?? '#e8dcc4';
    px(c, wall, 0, 8, w, h - 8);
    for (let y = 14; y < h - 24; y += 12) for (let x = 6; x < w - 6; x += 12) px(c, rand() < 0.5 ? '#9fc7d9' : '#c9dbe6', x, y, 8, 7);
    // 一樓的店面：暖簾、燈籠
    px(c, '#2a1a14', 4, h - 22, w - 8, 22);
    px(c, s.color, 4, h - 22, w - 8, 8);
    text(c, s.name, w / 2, h - 18, '#ffffff', `900 6px ${FONT_TC}`);
    px(c, '#f4efe2', w / 2 - 12, h - 12, 24, 12);
  });
}
function drawDotonSign(c: CanvasRenderingContext2D, i: number, d: DrawCtx): void {
  const s = DOTON_SHOPS[i];
  if (!s) return;
  const x0 = Math.round(s.x0 * T);
  const w = Math.round((s.x1 - s.x0) * T);
  const by = Math.round(OS.rowLine * T);
  const cx = x0 + w / 2;
  const sy = by - 50;
  const wave = Math.sin(d.seconds * 1.6 + i) * 2;
  if (s.sign === 'crab') {
    // 大螃蟹：腳會動
    c.fillStyle = '#d9382a';
    c.beginPath();
    c.ellipse(cx, sy, 20, 10, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = -3; k <= 3; k += 2) {
      px(c, '#c42e22', cx + k * 7 - 1, sy + 6 + Math.abs(k), 3, 8 + (k % 3 === 0 ? wave : -wave));
    }
    px(c, '#d9382a', cx - 30, sy - 10 + wave, 12, 6);
    px(c, '#d9382a', cx + 18, sy - 10 - wave, 12, 6);
    px(c, '#ffffff', cx - 6, sy - 9, 4, 4);
    px(c, '#ffffff', cx + 3, sy - 9, 4, 4);
    px(c, '#15171f', cx - 5, sy - 8, 2, 2);
    px(c, '#15171f', cx + 4, sy - 8, 2, 2);
  } else if (s.sign === 'octopus') {
    // 大章魚
    c.fillStyle = '#e8584a';
    c.beginPath();
    c.ellipse(cx, sy - 6, 15, 13, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = -3; k <= 3; k += 1) px(c, '#d8483a', cx + k * 5 - 2, sy + 4, 4, 10 + Math.sin(d.seconds * 2 + k) * 2);
    px(c, '#f4f4f4', cx - 7, sy - 8, 5, 5);
    px(c, '#f4f4f4', cx + 3, sy - 8, 5, 5);
    px(c, '#15171f', cx - 5, sy - 6, 2, 2);
    px(c, '#15171f', cx + 5, sy - 6, 2, 2);
    px(c, '#ffffff', cx - 18, sy - 22, 36, 2);
    px(c, '#f4efe2', cx - 14, sy - 24, 28, 3);
  } else if (s.sign === 'dragon') {
    // 龍（綠色，從招牌爬出來）
    c.strokeStyle = '#2bb673';
    c.lineWidth = 7;
    c.beginPath();
    c.moveTo(x0 + 6, sy + 6);
    for (let k = 0; k <= 8; k += 1) c.lineTo(x0 + 6 + k * (w - 20) / 8, sy - 4 + Math.sin(k * 1.2 + d.seconds) * 6);
    c.stroke();
    px(c, '#1f9a5a', x0 + w - 18, sy - 14, 14, 12);
    px(c, '#f6c945', x0 + w - 10, sy - 11, 3, 3);
    px(c, '#e8402e', x0 + w - 6, sy - 6, 6, 2);
  } else if (s.sign === 'okonomi') {
    // 一大塊大阪燒（醬汁＋美乃滋格子）
    c.fillStyle = '#c47a3a';
    c.beginPath();
    c.ellipse(cx, sy, 22, 9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#6a3a1a';
    c.beginPath();
    c.ellipse(cx, sy - 1, 19, 7, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = -15; k <= 15; k += 6) px(c, '#fff6d8', cx + k, sy - 6, 1, 10);
    px(c, '#3a7a3a', cx - 6, sy - 3, 3, 2);
    px(c, '#f0b8c8', cx + 4, sy - 2, 4, 2);
  } else {
    // 霓虹「道頓堀」直式招牌
    px(c, '#1f1a2a', cx - 10, sy - 30, 20, 52);
    const on = d.night || Math.floor(d.seconds * 2) % 2 === 0;
    for (const [k, ch] of ['道', '頓', '堀'].entries()) text(c, ch, cx, sy - 22 + k * 15, on ? '#ff6ad5' : '#a8508a', `900 11px ${FONT_TC}`);
    if (d.night) glow(c, cx, sy - 4, 34, '255, 100, 210', 0.35);
  }
  if (d.night) for (let x = x0 + 6; x < x0 + w - 6; x += 10) drawLantern(c, x, by - 26, '#e8402e', true);
}

// 戎橋旁邊的大型電子看板：輪流播放的畫面（白天也亮）
function drawBillboard(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(BILLBOARD.x0 * T);
  const w = Math.round((BILLBOARD.x1 - BILLBOARD.x0) * T);
  const by = Math.round(OS.rowLine * T);
  px(c, '#2a2d33', x0, by - 70, w, 70);
  px(c, '#15171f', x0 + 4, by - 66, w - 8, 44);
  const scene = Math.floor(d.seconds / 4) % 3;
  if (scene === 0) {
    text(c, 'OSAKA', x0 + w / 2, by - 50, '#ffd23f', `900 13px ${FONT_TC}`);
    text(c, 'おおきに!', x0 + w / 2, by - 34, '#ffffff', `900 7px ${FONT_TC}`);
  } else if (scene === 1) {
    for (let k = 0; k < 6; k += 1) px(c, ['#ff5a4a', '#ffd23f', '#5ad6ff', '#7aee6a', '#ff6ad5', '#ffffff'][k] ?? '#fff', x0 + 8 + k * 14, by - 60 + ((k + Math.floor(d.seconds * 4)) % 4) * 6, 10, 10);
  } else {
    text(c, '食い倒れ', x0 + w / 2, by - 48, '#ff6a6a', `900 11px ${FONT_TC}`);
    text(c, '吃到倒為止', x0 + w / 2, by - 34, '#ffffff', `700 6px ${FONT_TC}`);
  }
  glow(c, x0 + w / 2, by - 44, 50, '255, 230, 180', d.night ? 0.4 : 0.12);
  px(c, '#6b7280', x0 + 8, by - 22, 4, 22);
  px(c, '#6b7280', x0 + w - 12, by - 22, 4, 22);
}

// 運河上的遊船（來回開）
function drawCruise(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, OS.canal.y0 * T - 30, OS.W * T, (OS.canal.y1 - OS.canal.y0) * T + 40);
  c.clip();
  drawCruiseBoat(c, d);
  c.restore();
}
function drawCruiseBoat(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const span = OS.W * T + 120;
  const k = (d.seconds * 14) % (span * 2);
  const forward = k < span;
  const x = forward ? k - 60 : span * 2 - k - 60;
  const y = ((OS.canal.y0 + OS.canal.y1) / 2) * T + 6;
  // 穿過戎橋時被橋擋住（橋是地面，船畫在上面）：在橋那段就不畫
  if (x > OS.ebisu.x0 * T - 26 && x < OS.ebisu.x1 * T + 26) return;
  px(c, 'rgba(0,0,0,0.25)', x - 30, y + 2, 60, 3);
  px(c, '#f4f6f8', x - 30, y - 8, 60, 10);
  px(c, '#1f6fa8', x - 30, y - 2, 60, 3);
  px(c, '#9fd8ff', x - 22, y - 16, 44, 8);
  px(c, '#e8eef6', x - 24, y - 18, 48, 2);
  for (let i = -18; i < 18; i += 9) px(c, '#3a4256', x + i, y - 14, 4, 4);
  for (let i = 0; i < 3; i += 1) px(c, 'rgba(255,255,255,0.5)', Math.round(x + (forward ? -34 - i * 6 : 34 + i * 6)), y + Math.round(Math.sin(d.seconds * 3 + i)), 4, 1);
}

// JR 大阪站：玻璃大屋頂（弧形）、站名
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((OS.station.x1 - OS.station.x0) * T);
  const h = 64;
  return cached('os-station', w, h, (c) => {
    c.fillStyle = '#c9d6e2';
    c.beginPath();
    c.moveTo(0, 26);
    c.quadraticCurveTo(w / 2, -6, w, 26);
    c.lineTo(w, 30);
    c.lineTo(0, 30);
    c.fill();
    for (let x = 8; x < w - 8; x += 12) px(c, 'rgba(255,255,255,0.4)', x, 10, 1, 18);
    px(c, '#d6d9de', 0, 28, w, h - 28);
    for (let y = 34; y < h - 18; y += 7) for (let x = 6; x < w - 6; x += 9) px(c, '#5a7a94', x, y, 7, 5);
    const cx = w / 2;
    px(c, '#2a3a4a', cx - 60, h - 16, 120, 16);
    for (let x = cx - 52; x < cx + 52; x += 18) px(c, '#9fd8ff', x, h - 14, 12, 12);
    px(c, '#f4f6f8', cx - 56, 30, 112, 12);
    px(c, '#1a8c3a', cx - 54, 31, 14, 10);
    text(c, 'JR', cx - 47, 36, '#ffffff', `900 6px ${FONT_TC}`);
    text(c, '大阪駅  OSAKA STATION', cx + 8, 36, '#1f2a44', `900 7px ${FONT_TC}`);
  });
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = OSAKA_SEATS[i];
  if (!s || i < 8) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  // 炸串店的小板凳
  px(c, 'rgba(0,0,0,0.2)', x - 5, y + 1, 10, 2);
  px(c, '#e23a2a', x - 5, y - 4, 10, 3);
  px(c, 'rgba(0,0,0,0.35)', x - 4, y - 1, 2, 3);
  px(c, 'rgba(0,0,0,0.35)', x + 2, y - 1, 2, 3);
}

const PINES: [number, number][] = [[3, 9.8], [9, 9.6], [14.5, 9.8], [37.5, 9.8], [41, 9.6]];
const SAKURAS: [number, number][] = [[2.5, 13.6], [6.5, 16.8], [17, 13.4], [21, 16.8], [25, 13.4], [36.5, 13.6], [40, 16.8]];
const LAMPS: [number, number][] = [[3, 30.8], [16, 30.8], [34, 30.8], [48, 30.8], [8, 37.6], [47, 37.6]];

const props: CityProp[] = [
  ...PINES.map(([x, y]): CityProp => ({ y, draw: (c) => drawPine(c, x, y) })),
  { y: OS.castle.line, draw: (c) => blit(c, castleSprite(), OS.castle.x0 * T, OS.castle.line * T) },
  ...SAKURAS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawSakura(c, x, y, d.seconds) })),
  ...PARK_BENCHES.map((x): CityProp => ({ y: PARK_BENCH_Y - 0.02, draw: (c) => drawParkBench(c, x) })),
  { y: OS.shinsekai.towerLine, draw: (c, d) => drawTsutenkaku(c, d) },
  { y: 20.4, draw: (c, d) => {
    blit(c, kushiSprite(), 42.6 * T, 20.4 * T);
    drawLantern(c, 43.4 * T, 20.4 * T - 30, '#e8402e', d.night);
    drawLantern(c, 48.2 * T, 20.4 * T - 30, '#e8402e', d.night);
  } },
  { y: OS.shinsekai.billiken.y, draw: (c) => drawBilliken(c) },
  ...KUSHI_TABLES.map((x): CityProp => ({ y: KUSHI_TABLE_Y, draw: (c) => drawKushiTable(c, x) })),
  { y: OS.shinsekai.archY, draw: (c, d) => drawShinsekaiArch(c, d) },
  ...DOTON_SHOPS.map((s, i): CityProp => ({ y: OS.rowLine, draw: (c, d) => {
    blit(c, dotonSprite(i), s.x0 * T, OS.rowLine * T);
    drawDotonSign(c, i, d);
  } })),
  { y: OS.rowLine, draw: (c, d) => drawBillboard(c, d) },
  { y: OS.canal.y1 - 0.4, draw: (c, d) => drawCruise(c, d) },
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
  { y: OS.station.line, draw: (c) => blit(c, stationSprite(), OS.station.x0 * T, OS.station.line * T) },
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 運河只有戎橋能過
function blocked(x: number, y: number): boolean {
  if (y > OS.canal.y0 - 0.1 && y < OS.canal.y1 + 0.3) return !(x > OS.ebisu.x0 + 0.4 && x < OS.ebisu.x1 - 0.4);
  return false;
}
const solid: Rect[] = [
  r(0, 0, OS.shinsekai.x0, OS.moat.y1 + 0.1),
  r(OS.shinsekai.x0, 0, OS.W, 10.4),
  r(0, OS.park.y1 - 0.4, OS.shinsekai.x0 - 0.5, OS.rowLine - 0.05),
  r(OS.shinsekai.tower - 2.2, OS.shinsekai.towerLine - 1.2, OS.shinsekai.tower + 2.2, OS.shinsekai.towerLine - 0.05),
  r(42.6, 17.6, 48.6, 20.35),
  r(OS.shinsekai.billiken.x - 0.6, OS.shinsekai.billiken.y - 0.5, OS.shinsekai.billiken.x + 0.6, OS.shinsekai.billiken.y),
  ...KUSHI_TABLES.map((x) => r(x - 1, KUSHI_TABLE_Y - 0.4, x + 1, KUSHI_TABLE_Y)),
  ...PARK_BENCHES.map((x) => r(x - 1.3, PARK_BENCH_Y - 0.35, x + 1.3, PARK_BENCH_Y - 0.1)),
  ...[OS.shinsekai.x0 + 0.8, OS.W - 1].map((x) => r(x, OS.shinsekai.archY - 0.3, x + 0.3, OS.shinsekai.archY)),
  ...SAKURAS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
  r(OS.station.x0, OS.station.line - 2.2, OS.station.x1, OS.station.line - 0.05),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...DOTON_SHOPS.map((s) => ({ x: ((s.x0 + s.x1) / 2) * T, y: OS.rowLine * T - 40, r: 70, color: 'rgba(255, 120, 200, 0.35)' })),
  { x: ((BILLBOARD.x0 + BILLBOARD.x1) / 2) * T, y: OS.rowLine * T - 44, r: 80, color: 'rgba(255, 230, 160, 0.45)' },
  { x: OS.shinsekai.tower * T, y: OS.shinsekai.towerLine * T - 100, r: 90, color: 'rgba(255, 200, 150, 0.35)' },
  { x: 48 * T, y: OS.shinsekai.archY * T - 40, r: 80, color: 'rgba(255, 210, 130, 0.4)' },
  { x: ((OS.castle.x0 + OS.castle.x1) / 2) * T, y: OS.castle.line * T - 90, r: 120, color: 'rgba(255, 245, 220, 0.3)' },
  { x: ((OS.station.x0 + OS.station.x1) / 2) * T, y: OS.station.line * T - 20, r: 110, color: 'rgba(220, 235, 255, 0.4)' },
];

const stationX = (OS.station.x0 + OS.station.x1) / 2;

export const OSAKA: CityDef = {
  id: 'osaka',
  country: 'jp',
  line: 'jr',
  W: OS.W,
  H: OS.H,
  title: { 'zh-TW': '大阪 · 大阪城與道頓堀', 'en-US': 'Osaka · Osaka Castle & Dotonbori' },
  stop: { 'zh-TW': '大阪（JR 大阪站）', 'en-US': 'Osaka (JR Osaka Sta.)' },
  emoji: '🏯',
  station: {
    x: stationX,
    y: OS.station.line + 0.6,
    name: { 'zh-TW': 'JR 大阪站', 'en-US': 'JR Osaka Station' },
    arrive: { x: stationX + 3, y: OS.station.line + 0.8 },
  },
  background: '#d8d3c7',
  soundscape: 'market',
  paintGround: paintOsakaGround,
  props,
  solid,
  blocked,
  seats: OSAKA_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: OSAKA_SHOPS,
  fortune: {
    at: r(OS.shinsekai.billiken.x - 1.6, OS.shinsekai.billiken.y, OS.shinsekai.billiken.x + 1.2, OS.shinsekai.billiken.y + 1.4),
    label: { x: OS.shinsekai.billiken.x - 0.6, y: OS.shinsekai.billiken.y - 3 },
    title: { 'zh-TW': '比利肯 · 摸腳底許願', 'en-US': 'Billiken · Rub his feet' },
    hint: { 'zh-TW': '摸摸比利肯的腳底，聽說願望會實現。', 'en-US': 'Rub Billiken’s soles — they say wishes come true.' },
    draw: { 'zh-TW': '摸腳底', 'en-US': 'Rub' },
    again: { 'zh-TW': '再摸一次', 'en-US': 'Rub again' },
    fortunes: [
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great luck' }, text: { 'zh-TW': '比利肯笑了！今天的專注一定會成功。', 'en-US': 'Billiken is smiling! Today’s focus will be a hit.' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Good luck' }, text: { 'zh-TW': '「食い倒れ」之前，先把今天的進度吃完。', 'en-US': 'Before you eat till you drop, finish today’s work first.' } },
      { rank: { 'zh-TW': '吉', 'en-US': 'Luck' }, text: { 'zh-TW': '炸串醬汁只能沾一次，機會也是，好好把握。', 'en-US': 'Like kushikatsu sauce, you only dip once — seize the chance.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small luck' }, text: { 'zh-TW': 'まいど！一點一點來，大阪城也不是一天蓋好的。', 'en-US': 'Maido! Step by step — Osaka Castle wasn’t built in a day.' } },
    ],
  },
  infos: [
    { at: r(OS.castle.x0, 0, OS.castle.x1, OS.moat.y0), title: { 'zh-TW': '大阪城', 'en-US': 'Osaka Castle' }, text: { 'zh-TW': '1583 年豐臣秀吉蓋的城，現在的天守閣是 1931 年重建的，白牆綠瓦，最上層有金色的虎和鶴。公園春天有三千棵櫻花。', 'en-US': 'Built by Toyotomi Hideyoshi in 1583; today’s keep was rebuilt in 1931 with white walls, green tiles and golden tigers and cranes on the top floor. The park has 3,000 cherry trees in spring.' } },
    { at: r(OS.shinsekai.tower - 2.2, 6, OS.shinsekai.tower + 2.2, OS.shinsekai.towerLine), title: { 'zh-TW': '通天閣', 'en-US': 'Tsutenkaku Tower' }, text: { 'zh-TW': '新世界的地標，高 103 公尺。塔頂的燈會照隔天的天氣變顏色，展望台上有幸運之神比利肯。', 'en-US': 'Shinsekai’s 103-metre landmark. The neon on top changes colour with tomorrow’s weather forecast, and the lucky god Billiken sits on the observation deck.' } },
    { at: r(0, OS.park.y1 - 2, OS.shinsekai.x0, OS.rowLine), title: { 'zh-TW': '道頓堀', 'en-US': 'Dotonbori' }, text: { 'zh-TW': '大阪最熱鬧的美食街，店家掛著會動的大螃蟹、大章魚、龍的立體招牌。大阪人說「食い倒れ」——吃到倒為止。', 'en-US': 'Osaka’s liveliest food street, with giant moving signs — crabs, octopus, dragons. Osakans call it kuidaore: eat till you drop.' } },
    { at: r(OS.ebisu.x0, OS.canal.y0, OS.ebisu.x1, OS.canal.y1), title: { 'zh-TW': '戎橋', 'en-US': 'Ebisu Bridge' }, text: { 'zh-TW': '跨過道頓堀運河的橋，旁邊的大型電子看板是大阪最有名的拍照點。運河上有觀光遊船。', 'en-US': 'The bridge over the Dotonbori canal; the giant screens beside it are Osaka’s most famous photo spot. Tour boats cruise below.' } },
    { at: r(OS.station.x0, OS.station.line - 4, OS.station.x1, OS.station.line), title: { 'zh-TW': 'JR 大阪站', 'en-US': 'JR Osaka Station' }, text: { 'zh-TW': '在梅田，玻璃大屋頂蓋住整個月台。搭 JR 新快速到京都約 30 分鐘、到神戶三之宮約 20 分鐘。', 'en-US': 'In Umeda, with a giant glass roof over the platforms. JR Special Rapid: about 30 min to Kyoto and 20 min to Kobe Sannomiya.' } },
  ],
  labels: [
    { x: 21, y: OS.moat.y1 + 0.6, text: { 'zh-TW': '🌸 大阪城公園（長椅坐下專注）', 'en-US': '🌸 Castle Park (sit on a bench)' }, color: '#fbcfe8' },
    { x: 24.5, y: OS.boardwalk.y1 + 0.6, text: { 'zh-TW': '🌃 道頓堀木棧道（坐下看霓虹）', 'en-US': '🌃 Riverside boardwalk (sit to focus)' }, color: '#f0abfc' },
  ],
  walkers: [
    { x0: 1, y0: 16.2, x1: 41, y1: 16.2, count: 3 },
    { x0: 1, y0: 23.6, x1: 41, y1: 23.6, count: 5 },
    { x0: 43, y0: 23.6, x1: 55, y1: 23.6, count: 2 },
    { x0: 1, y0: 30.6, x1: 55, y1: 30.6, count: 3 },
    { x0: 1, y0: 35.8, x1: 55, y1: 35.8, count: 3 },
  ],
  traffic: [
    { y: 32.2, dir: -1, x0: 0, x1: OS.W, count: 2 },
    { y: 33.6, dir: 1, x0: 0, x1: OS.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點大阪城公園的長椅、道頓堀木棧道或新世界炸串店的桌子坐下專注 · 走到店門口買章魚燒、大阪燒、炸串 · 摸比利肯的腳底許願 · 走戎橋過運河 · JR 大阪站去京都、神戶、東京或飛回台灣',
    'en-US': 'WASD / arrows to move · click a castle-park bench, the canal boardwalk or a kushikatsu table to focus · walk up to shops for takoyaki, okonomiyaki and kushikatsu · rub Billiken’s feet · cross the canal on Ebisu Bridge · JR Osaka to Kyoto, Kobe, Tokyo or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅、木棧道或炸串店桌子坐下專注 · 走到店門口買東西 · 摸比利肯許願 · 戎橋過河 · JR 大阪站',
    'en-US': 'Tap a bench, the boardwalk or a table to focus · visit the shops · rub Billiken’s feet · cross Ebisu Bridge · JR Osaka',
  },
};
