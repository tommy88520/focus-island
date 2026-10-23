// 新北淡水的美術：山坡上的紅毛城（紅色城堡、城垛）和前清英國領事官邸（紅磚拱廊）、淡水禮拜堂（紅磚尖塔）、
// 中正路老街的店（文化阿給、可口魚丸、阿婆鐵蛋）、福佑宮（媽祖廟）、捷運淡水站、馬偕像、河岸咖啡、
// 金色水岸步道和欄杆、渡船頭和往漁人碼頭的渡輪、淡水河和對岸的觀音山。最後組成 CityScene 用的 TAMSUI。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CAFE_TABLES, CAFE_Y, DS, FORT_BENCH, NORTH_ROW, RIVER_BENCHES, RIVER_BENCH_Y, RIVER_ROW, TAMSUI_SEATS, TAMSUI_SHOPS, type TamsuiHouse } from './tamsui';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, townhouseSprite, drawParkedScooter, SCOOTER_COLORS, drawStreetTree, drawLamp, drawBench } from './cityArt';

const WORDS = ['餅舖', '茶行', '雜貨', '布莊', '老街', '古早味', '冰店'];
const BRICK = '#b5553f';
const BRICK_DARK = '#9a4532';
const WATER = '#4a8aa6';
const WATER_DEEP = '#3a7490';

// ── 地面（畫一次）──
export function paintTamsuiGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(909);
  const W = DS.W * T;
  tiles(c, { x0: 0, y0: 0, x1: DS.W, y1: DS.H }, '#d6cfc2', '#c4bcae', 12);
  // 山坡：草地、石頭擋土牆、中間石階
  const h = DS.hill;
  px(c, '#7fa65a', 0, 0, h.x1 * T, (h.y1 - 0.6) * T);
  for (let i = 0; i < 900; i += 1) px(c, rand() < 0.5 ? '#6c9149' : '#93b86a', Math.floor(rand() * h.x1 * T), Math.floor(rand() * (h.y1 - 0.6) * T), 2, 1);
  tiles(c, { x0: 1, y0: 9.4, x1: 19.6, y1: 10.9 }, '#d9cfb8', '#c9bfa8', 8);
  px(c, '#8f887b', 0, (h.y1 - 0.6) * T, h.x1 * T, 0.6 * T + 2);
  for (let x = 0; x < h.x1 * T; x += 10) px(c, '#7a746a', x, (h.y1 - 0.6) * T, 1, 0.6 * T);
  const st = DS.stairs;
  for (let k = 0; k < 4; k += 1) px(c, k % 2 ? '#c9c2b4' : '#ddd6c8', st.x0 * T, (h.y1 - 1.6) * T + k * 6, (st.x1 - st.x0) * T, 6);
  // 老街後面一片高高低低的屋頂（紅瓦、灰色平頂、水塔），一路往山上
  for (let i = 0; i < 70; i += 1) {
    const rx = h.x1 * T + rand() * (W - h.x1 * T);
    const ry = rand() * (DS.northLine - 3.6) * T;
    const rw = 26 + Math.floor(rand() * 40);
    const rh = 14 + Math.floor(rand() * 14);
    const tile = rand() < 0.5;
    px(c, tile ? '#b5552e' : '#8f8a80', Math.round(rx), Math.round(ry), rw, rh);
    for (let y = 2; y < rh; y += 3) px(c, tile ? '#9a4424' : '#7c776d', Math.round(rx), Math.round(ry) + y, rw, 1);
    px(c, 'rgba(0,0,0,0.18)', Math.round(rx), Math.round(ry) + rh - 2, rw, 2);
    if (!tile && rand() < 0.5) px(c, rand() < 0.5 ? '#3b7dd8' : '#c9ccd6', Math.round(rx + 4), Math.round(ry - 4), 8, 6);
  }
  // 北邊騎樓、中正路、南邊人行道
  tiles(c, { x0: h.x1, y0: DS.northLine - 0.4, x1: DS.W, y1: DS.road.y0 }, '#b98f72', '#a87f63', 8);
  road(c, { x0: 0, y0: DS.road.y0, x1: DS.W, y1: DS.road.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.8)', x, ((DS.road.y0 + DS.road.y1) / 2) * T, 10, 2);
  // 馬偕像的小圓環（花圃）
  const m = DS.mackay;
  c.fillStyle = '#8f887b';
  c.beginPath();
  c.ellipse(m.x * T, m.y * T, 26, 12, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#7fa65a';
  c.beginPath();
  c.ellipse(m.x * T, m.y * T, 23, 10, 0, 0, Math.PI * 2);
  c.fill();
  for (let k = 0; k < 14; k += 1) {
    const a = (k / 14) * Math.PI * 2;
    px(c, ['#e25a7a', '#f6c945', '#f2f2f2'][k % 3] ?? '#e25a7a', Math.round(m.x * T + Math.cos(a) * 18), Math.round(m.y * T + Math.sin(a) * 7), 3, 2);
  }
  // 金色水岸步道：木棧板
  const py0 = DS.riverRowY1;
  px(c, '#b8925e', 0, py0 * T, W, (DS.promenadeY1 - py0) * T);
  for (let x = 0; x < W; x += 6) px(c, '#a37e4e', x, py0 * T, 1, (DS.promenadeY1 - py0) * T);
  for (let i = 0; i < 300; i += 1) px(c, '#c9a36e', Math.floor(rand() * W), Math.floor(py0 * T + rand() * (DS.promenadeY1 - py0) * T), 3, 1);
  // 淡水河
  px(c, WATER, 0, DS.promenadeY1 * T, W, (DS.farBankY - DS.promenadeY1) * T);
  for (let y = DS.promenadeY1 * T + 6; y < DS.farBankY * T; y += 7) px(c, WATER_DEEP, 0, y, W, 2);
  // 渡船頭（木頭碼頭伸到河裡）
  const pr = DS.pier;
  px(c, '#8a6a46', pr.x0 * T, DS.promenadeY1 * T, (pr.x1 - pr.x0) * T, (pr.y1 - DS.promenadeY1) * T);
  for (let y = DS.promenadeY1 * T; y < pr.y1 * T; y += 5) px(c, '#755a3a', pr.x0 * T, Math.round(y), (pr.x1 - pr.x0) * T, 1);
  for (const x of [pr.x0, pr.x1 - 0.2]) for (let y = DS.promenadeY1 + 0.5; y < pr.y1; y += 1.2) px(c, '#4a3a28', x * T, y * T, 3, 5);
  // 對岸：八里的岸邊、觀音山（一層層的綠）
  const fy = DS.farBankY * T;
  px(c, '#6f9a52', 0, fy, W, (DS.H - DS.farBankY) * T);
  c.fillStyle = '#5a8a48';
  c.beginPath();
  c.moveTo(0, DS.H * T);
  c.lineTo(0, fy + 30);
  c.quadraticCurveTo(W * 0.2, fy + 6, W * 0.38, fy + 14);
  c.quadraticCurveTo(W * 0.5, fy - 18, W * 0.62, fy + 8);
  c.quadraticCurveTo(W * 0.8, fy + 20, W, fy + 26);
  c.lineTo(W, DS.H * T);
  c.closePath();
  c.fill();
  c.fillStyle = '#4c7a3c';
  c.beginPath();
  c.moveTo(W * 0.3, DS.H * T);
  c.quadraticCurveTo(W * 0.5, fy - 6, W * 0.7, DS.H * T);
  c.closePath();
  c.fill();
  for (let i = 0; i < 160; i += 1) px(c, rand() < 0.5 ? '#3f6a32' : '#6aa05a', Math.floor(rand() * W), Math.floor(fy + 14 + rand() * ((DS.H - DS.farBankY) * T - 16)), 4, 3);
  px(c, '#9aa39a', 0, fy - 2, W, 3);
}

function drawRiverShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  const y0 = DS.promenadeY1 * T + 4;
  const span = (DS.farBankY - DS.promenadeY1) * T - 8;
  for (let i = 0; i < 46; i += 1) {
    const x = (i * 89 + seconds * (6 + (i % 5))) % (DS.W * T);
    const y = y0 + ((i * 31) % span);
    px(c, `rgba(235, 245, 250, ${0.18 + 0.16 * Math.sin(seconds * 1.3 + i)})`, Math.round(x), Math.round(y), 6, 1);
  }
}

// ── 山坡上：紅毛城（紅色城堡、城垛、白色窗框、旗桿）、前清英國領事官邸（紅磚、白色拱廊）──
function fortSprite(): HTMLCanvasElement {
  const w = Math.round((DS.fort.x1 - DS.fort.x0) * T);
  const h = 84;
  return cached('ds-fort', w, h, (c) => {
    const base = h;
    const red = '#b8402f';
    const dark = '#963425';
    // 下層（寬）＋上層（窄）
    px(c, red, 0, base - 46, w, 46);
    px(c, dark, 0, base - 2, w, 2);
    for (let x = 0; x < w; x += 8) px(c, (x / 8) % 2 === 0 ? red : dark, x, base - 50, 5, 4);
    const ux0 = 18;
    px(c, red, ux0, base - 72, w - ux0 * 2, 26);
    for (let x = ux0; x < w - ux0; x += 8) px(c, (x / 8) % 2 === 0 ? red : dark, x, base - 76, 5, 4);
    // 窗：白框拱窗
    for (const [x, y] of [[10, base - 36], [w - 20, base - 36], [ux0 + 8, base - 64], [w - ux0 - 18, base - 64]] as const) {
      px(c, '#f2efe8', x - 1, y - 1, 12, 14);
      px(c, '#2a1a12', x, y + 2, 10, 11);
      c.fillStyle = '#2a1a12';
      c.beginPath();
      c.arc(x + 5, y + 3, 5, Math.PI, 0);
      c.fill();
    }
    // 拱門
    px(c, '#f2efe8', w / 2 - 9, base - 22, 18, 22);
    px(c, '#2a1a12', w / 2 - 7, base - 18, 14, 18);
    c.fillStyle = '#2a1a12';
    c.beginPath();
    c.arc(w / 2, base - 18, 7, Math.PI, 0);
    c.fill();
    // 旗桿
    px(c, '#e8e2d6', w / 2 - 1, base - 84, 2, 10);
    px(c, '#f2efe8', w / 2 + 1, base - 84, 7, 4);
  });
}

function consulateSprite(): HTMLCanvasElement {
  const w = Math.round((DS.consulate.x1 - DS.consulate.x0) * T);
  const h = 62;
  return cached('ds-consulate', w, h, (c) => {
    const base = h;
    // 屋頂（灰瓦、煙囪）
    c.fillStyle = '#5e6572';
    c.beginPath();
    c.moveTo(-2, 18);
    c.lineTo(10, 4);
    c.lineTo(w - 10, 4);
    c.lineTo(w + 2, 18);
    c.closePath();
    c.fill();
    for (let y = 6; y < 18; y += 3) px(c, '#6e7582', 6, y, w - 12, 1);
    px(c, BRICK, w - 22, 0, 6, 8);
    // 紅磚牆
    px(c, BRICK, 0, 18, w, base - 18);
    for (let y = 20; y < base; y += 4) px(c, BRICK_DARK, 0, y, w, 1);
    // 兩層拱廊（白色拱）
    for (const top of [22, 42]) {
      for (let x = 4; x + 14 <= w - 2; x += 17) {
        px(c, '#2a1a12', x, top + 6, 14, 14);
        c.fillStyle = '#2a1a12';
        c.beginPath();
        c.arc(x + 7, top + 6, 7, Math.PI, 0);
        c.fill();
        c.strokeStyle = '#f2efe8';
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(x + 7, top + 6, 7, Math.PI, 0);
        c.stroke();
        px(c, '#f2efe8', x - 1, top + 6, 2, 14);
      }
      px(c, '#f2efe8', 0, top + 19, w, 2);
    }
  });
}

// ── 北邊老街的店 ──
// 淡水禮拜堂：紅磚、尖拱窗、高高的鐘樓＋尖頂
function churchSprite(b: TamsuiHouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 104;
  return cached('ds-church', w, h, (c) => {
    const base = h;
    // 主堂
    c.fillStyle = '#6e5a4c';
    c.beginPath();
    c.moveTo(0, base - 40);
    c.lineTo(w * 0.35, base - 58);
    c.lineTo(w * 0.35, base - 40);
    c.closePath();
    c.fill();
    px(c, BRICK, 0, base - 40, w, 40);
    for (let y = base - 38; y < base; y += 4) px(c, BRICK_DARK, 0, y, w, 1);
    for (const x of [6, 22]) {
      px(c, '#f2efe8', x - 1, base - 34, 10, 20);
      px(c, '#3a5a8a', x, base - 30, 8, 16);
      c.fillStyle = '#3a5a8a';
      c.beginPath();
      c.moveTo(x, base - 30);
      c.lineTo(x + 4, base - 36);
      c.lineTo(x + 8, base - 30);
      c.fill();
    }
    // 鐘樓（右邊）
    const tx = w - 30;
    px(c, BRICK, tx, base - 84, 26, 84);
    for (let y = base - 82; y < base; y += 4) px(c, BRICK_DARK, tx, y, 26, 1);
    px(c, '#f2efe8', tx - 1, base - 86, 28, 3);
    px(c, '#2a1a12', tx + 7, base - 74, 12, 16);
    c.fillStyle = '#2a1a12';
    c.beginPath();
    c.moveTo(tx + 7, base - 74);
    c.lineTo(tx + 13, base - 82);
    c.lineTo(tx + 19, base - 74);
    c.fill();
    px(c, '#2a1a12', tx + 8, base - 22, 10, 22);
    c.fillStyle = '#5e6572';
    c.beginPath();
    c.moveTo(tx - 2, base - 86);
    c.lineTo(tx + 13, base - 100);
    c.lineTo(tx + 28, base - 86);
    c.closePath();
    c.fill();
    px(c, '#e8e2d6', tx + 12, base - 104, 2, 6);
    px(c, '#e8e2d6', tx + 10, base - 102, 6, 2);
  });
}

function shopSprite(b: TamsuiHouse): HTMLCanvasElement {
  const w = Math.round((b.x1 - b.x0) * T);
  const h = 54;
  return cached(`ds-shop-${b.special}`, w, h, (c) => {
    const base = h;
    const look = { agei: ['#e8dcc4', '#8a5a32', '#f6e2b8', '文化阿給'], fishball: ['#f0d2c0', '#c62828', '#ffffff', '可口魚丸'], irongg: ['#e3d6b8', '#f6c945', '#3a2a1a', '阿婆鐵蛋'], cafe: ['#f2efe6', '#2a6a7a', '#ffffff', '河岸咖啡'] } as const;
    const [wall, signBg, signFg, name] = look[b.special as 'agei' | 'fishball' | 'irongg' | 'cafe'];
    px(c, '#5c4a3e', 0, 2, w, 5);
    for (let x = 0; x < w; x += 4) px(c, '#6e5a4c', x, 2, 2, 5);
    px(c, wall, 0, 7, w, base - 7);
    for (let cx = 5; cx + 10 <= w - 4; cx += 14) {
      px(c, '#5a4636', cx - 1, 10, 12, 9);
      px(c, '#b8d6d8', cx, 11, 10, 7);
    }
    px(c, signBg, 2, 22, w - 4, 10);
    px(c, 'rgba(255,255,255,0.3)', 2, 22, w - 4, 1);
    text(c, name, w / 2, 27, signFg, `900 7px ${b.special === 'cafe' ? FONT_TC : SERIF_TC}`);
    px(c, '#3a2e28', 0, base - 20, w, 20);
    px(c, b.special === 'cafe' ? '#f6e2b8' : '#f4ecd8', 3, base - 16, w - 6, 12);
    if (b.special === 'irongg') for (let k = 0; k < 6; k += 1) px(c, '#2a1a12', 6 + k * 6, base - 10, 4, 4);
    if (b.special === 'fishball') for (let k = 0; k < 2; k += 1) px(c, '#9aa3b2', 6 + k * 16, base - 11, 12, 7);
    if (b.special === 'agei') for (let k = 0; k < 4; k += 1) px(c, '#d9a35a', 6 + k * 8, base - 10, 6, 4);
  });
}

// 福佑宮：媽祖廟，紅柱、門神、黑底金字匾、燕尾脊、紅燈籠
function templeSprite(): HTMLCanvasElement {
  const w = Math.round((DS.temple.x1 - DS.temple.x0) * T);
  const h = 70;
  return cached('ds-temple', w, h, (c) => {
    const base = h;
    px(c, '#9a948a', 0, base - 6, w, 6);
    px(c, '#8b2a22', 6, base - 40, w - 12, 34);
    for (let i = 0; i < 4; i += 1) {
      const x = Math.round(10 + i * ((w - 26) / 3));
      px(c, '#c62828', x, base - 38, 4, 32);
    }
    px(c, '#4a1a12', w / 2 - 12, base - 32, 24, 26);
    px(c, '#2f5fa8', w / 2 - 10, base - 28, 9, 20);
    px(c, '#2f5fa8', w / 2 + 1, base - 28, 9, 20);
    px(c, '#f2c27a', w / 2 - 9, base - 26, 7, 3);
    px(c, '#f2c27a', w / 2 + 2, base - 26, 7, 3);
    px(c, '#15100c', w / 2 - 16, base - 48, 32, 10);
    px(c, '#c9a24a', w / 2 - 16, base - 48, 32, 1);
    text(c, '福佑宮', w / 2, base - 43, '#f2d27a', `900 7px ${SERIF_TC}`);
    c.fillStyle = '#c0522a';
    c.beginPath();
    c.moveTo(-4, base - 38);
    c.lineTo(10, base - 54);
    c.lineTo(w - 10, base - 54);
    c.lineTo(w + 4, base - 38);
    c.closePath();
    c.fill();
    for (let k = 0; k < 14; k += 3) px(c, '#a8441f', 4 + k * 0.6, base - 52 + k, w - 8 - k * 1.2, 1);
    c.strokeStyle = '#e8d5a8';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(4, base - 66);
    c.quadraticCurveTo(10, base - 54, 20, base - 56);
    c.lineTo(w - 20, base - 56);
    c.quadraticCurveTo(w - 10, base - 54, w - 4, base - 66);
    c.stroke();
    for (let k = 0; k < 8; k += 1) px(c, k % 3 === 0 ? '#2bb673' : k % 3 === 1 ? '#3a7be0' : '#f2c14e', 24 + k * ((w - 48) / 7), base - 60, 3, 3);
  });
}

function drawNorthHouse(c: CanvasRenderingContext2D, b: TamsuiHouse, d: DrawCtx): void {
  const bottom = DS.northLine * T;
  if (b.special === 'church') blit(c, churchSprite(b), b.x0 * T, bottom);
  else if (b.special === 'temple') {
    blit(c, templeSprite(), b.x0 * T, bottom);
    // 屋簷下的紅燈籠、香煙
    const w = (b.x1 - b.x0) * T;
    for (let k = 0; k < 5; k += 1) {
      const lx = Math.round(b.x0 * T + 12 + k * ((w - 24) / 4));
      const sway = Math.round(Math.sin(d.seconds * 1.4 + k) * 0.6);
      px(c, '#d72d2d', lx - 3 + sway, bottom - 38, 6, 7);
      px(c, '#f2c14e', lx - 3 + sway, bottom - 38, 6, 1);
      if (d.night) glow(c, lx + sway, bottom - 34, 9, '255, 90, 60', 0.3);
    }
  } else if (b.special) blit(c, shopSprite(b), b.x0 * T, bottom);
  else blit(c, townhouseSprite('ds', b, WORDS), b.x0 * T, bottom);
}

function drawRiverHouse(c: CanvasRenderingContext2D, b: TamsuiHouse): void {
  const bottom = DS.riverRowY1 * T;
  if (b.special === 'cafe') blit(c, shopSprite(b), b.x0 * T, bottom);
  else blit(c, townhouseSprite('ds', b, WORDS), b.x0 * T, bottom);
}

// ── 捷運淡水站：白牆、紅磚腰帶、傳統紅瓦屋頂、紅線站名牌 R28 ──
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((DS.station.x1 - DS.station.x0) * T);
  const h = 92;
  return cached('ds-station', w, h, (c) => {
    const base = h;
    px(c, '#f2efe8', 0, base - 52, w, 52);
    px(c, BRICK, 0, base - 18, w, 18);
    for (let y = base - 16; y < base; y += 4) px(c, BRICK_DARK, 0, y, w, 1);
    // 大片玻璃、入口
    for (let x = 8; x + 16 <= w - 8; x += 22) {
      px(c, '#3a4a58', x, base - 46, 16, 22);
      px(c, '#6a8090', x + 1, base - 45, 4, 8);
    }
    px(c, '#2a1e16', w / 2 - 14, base - 18, 28, 18);
    px(c, '#f6e2a8', w / 2 - 12, base - 16, 24, 16);
    // 紅瓦屋頂（兩層）
    const roof = (y: number, inset: number, depth: number) => {
      c.fillStyle = '#b5552e';
      c.beginPath();
      c.moveTo(inset - 6, y + depth);
      c.lineTo(inset + 10, y);
      c.lineTo(w - inset - 10, y);
      c.lineTo(w - inset + 6, y + depth);
      c.closePath();
      c.fill();
      for (let k = 2; k < depth; k += 3) px(c, '#9a4424', inset + 4, y + k, w - inset * 2 - 8, 1);
      px(c, '#5a2a18', inset - 6, y + depth - 1, w - (inset - 6) * 2, 2);
    };
    roof(base - 66, 0, 14);
    roof(base - 86, 30, 16);
    // 站名牌：紅線
    px(c, '#e3002c', 10, base - 62, 52, 10);
    text(c, '淡水 Tamsui', 36, base - 57, '#ffffff', `800 6px ${FONT_TC}`);
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.arc(w - 24, base - 57, 6, 0, Math.PI * 2);
    c.fill();
    text(c, 'R28', w - 24, base - 57, '#e3002c', '800 5px system-ui, sans-serif');
  });
}

// 馬偕像：銅像＋石頭底座
function drawMackay(c: CanvasRenderingContext2D): void {
  const x = Math.round(DS.mackay.x * T);
  const y = Math.round(DS.mackay.y * T);
  px(c, 'rgba(0,0,0,0.2)', x - 8, y + 1, 16, 3);
  px(c, '#9a948a', x - 7, y - 12, 14, 13);
  px(c, '#b9b2a6', x - 7, y - 12, 14, 2);
  px(c, '#5a4a32', x - 5, y - 26, 10, 14);
  px(c, '#6e5a3e', x - 3, y - 32, 6, 6);
  px(c, '#4a3a26', x - 3, y - 27, 6, 3);
}

// 河邊的欄杆（白色鐵欄杆，渡船頭留空）
function drawPromenadeRail(c: CanvasRenderingContext2D): void {
  const y = Math.round(DS.promenadeY1 * T);
  for (let x = 0; x < DS.W * T; x += 6) {
    if (x > DS.pier.x0 * T - 2 && x < DS.pier.x1 * T + 2) continue;
    px(c, '#e8ecf0', x, y - 10, 2, 10);
  }
  px(c, '#f4f6f8', 0, y - 11, DS.pier.x0 * T, 2);
  px(c, '#f4f6f8', DS.pier.x1 * T, y - 11, DS.W * T - DS.pier.x1 * T, 2);
}

// 渡輪：往漁人碼頭、八里（白色船身、藍色頂）
const FERRIES = [0, 0.55];
function drawFerry(c: CanvasRenderingContext2D, phase: number, d: DrawCtx): void {
  const cycle = 50;
  const t = ((d.seconds / cycle + phase) % 1) * 3;
  const dockX = (DS.pier.x0 - 2.2) * T;
  // 0–1 從西邊開進來、1–2 靠在碼頭、2–3 開往西邊
  const x = t < 1 ? -80 + (dockX + 80) * (1 - (1 - t) * (1 - t)) : t < 2 ? dockX : dockX - (dockX + 80) * (t - 2) * (t - 2);
  const y = (phase > 0.3 ? DS.pier.y1 + 1.4 : DS.pier.y1 - 1) * T;
  px(c, 'rgba(0,0,0,0.2)', Math.round(x - 26), Math.round(y) + 1, 52, 3);
  px(c, '#f4f6f8', Math.round(x - 26), Math.round(y) - 10, 52, 10);
  px(c, '#2f7ac8', Math.round(x - 26), Math.round(y) - 3, 52, 3);
  px(c, '#f4f6f8', Math.round(x - 14), Math.round(y) - 18, 30, 8);
  px(c, '#2f7ac8', Math.round(x - 16), Math.round(y) - 20, 34, 2);
  for (let k = 0; k < 4; k += 1) px(c, '#2f3a42', Math.round(x - 12 + k * 7), Math.round(y) - 16, 5, 4);
  if (d.night) glow(c, x, y - 12, 20, '255, 230, 160', 0.35);
}

function drawCafeTable(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const y = Math.round(CAFE_Y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, y + 2, 12, 2);
  px(c, '#3a3d45', cx - 1, y - 6, 2, 8);
  c.fillStyle = '#f2efe6';
  c.beginPath();
  c.ellipse(cx, y - 7, 7, 3, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#c62828', cx - 2, y - 9, 2, 2);
  px(c, '#7a4a2a', cx + 1, y - 9, 2, 2);
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = TAMSUI_SEATS[i];
  if (!s || i < 8) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  const back = s.facing === 'right' ? x - 5 : x + 3;
  px(c, 'rgba(0,0,0,0.2)', x - 5, y + 1, 10, 2);
  px(c, '#8a5a32', x - 5, y - 3, 10, 3);
  px(c, '#6b4a2f', back, y - 12, 2, 12);
}

// ── 組成 CityScene 用的資料 ──
const HILL_TREES: [number, number][] = [[1.4, 3.6], [1.4, 8.6], [10.4, 3.2], [19.2, 3.6], [19.2, 7.4]];
const TREES: [number, number][] = [[2.6, 17.6], [10, 17.6], [31, 17.6], [47, 17.6], [54, 17.6]];
const LAMPS: [number, number][] = [
  [22, 11.8], [33, 11.8], [44, 11.8],
  [6, 16.2], [18, 16.2], [26, 16.2], [38, 16.2], [52, 16.2],
  [4, 25.6], [14, 25.6], [26, 25.6], [42, 25.6], [53, 25.6],
];
const SCOOTERS: [number, number][] = [21, 22.2, 30.4, 31.6, 41.6, 42.8].map((x): [number, number] => [x, 12.3]);

const props: CityProp[] = [
  ...HILL_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  { y: DS.fort.y, draw: (c) => blit(c, fortSprite(), DS.fort.x0 * T, DS.fort.y * T) },
  { y: DS.consulate.y, draw: (c) => blit(c, consulateSprite(), DS.consulate.x0 * T, DS.consulate.y * T) },
  { y: FORT_BENCH.y - 0.01, draw: (c) => drawBench(c, FORT_BENCH.x, FORT_BENCH.y, 2.6) },
  ...NORTH_ROW.map((b): CityProp => ({ y: DS.northLine, draw: (c, d) => drawNorthHouse(c, b, d) })),
  { y: DS.northLine, draw: (c) => blit(c, stationSprite(), DS.station.x0 * T, DS.northLine * T) },
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[(i * 5) % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
  { y: DS.mackay.y, draw: (c) => drawMackay(c) },
  ...RIVER_ROW.map((b): CityProp => ({ y: DS.riverRowY1, draw: (c) => drawRiverHouse(c, b) })),
  ...RIVER_BENCHES.map((x): CityProp => ({ y: RIVER_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, RIVER_BENCH_Y, 2.6) })),
  ...CAFE_TABLES.map((x): CityProp => ({ y: CAFE_Y, draw: (c) => drawCafeTable(c, x) })),
  { y: DS.promenadeY1, draw: (c) => drawPromenadeRail(c) },
  { y: DS.promenadeY1 + 0.1, draw: (c, d) => drawRiverShimmer(c, d.seconds) },
  ...FERRIES.map((phase): CityProp => ({ y: DS.pier.y1 + 1.5, draw: (c, d) => drawFerry(c, phase, d) })),
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  // 山坡上的建築、擋土牆（石階那段可以走）
  r(DS.fort.x0, DS.fort.y - 2.8, DS.fort.x1, DS.fort.y - 0.2),
  r(DS.consulate.x0, DS.consulate.y - 2.4, DS.consulate.x1, DS.consulate.y - 0.2),
  r(0, DS.hill.y1 - 0.7, DS.stairs.x0, DS.hill.y1 - 0.2),
  r(DS.stairs.x1, DS.hill.y1 - 0.7, DS.hill.x1, DS.hill.y1 - 0.2),
  r(0, 0, DS.hill.x1, 0.6),
  // 北邊一排、捷運站
  r(DS.hill.x1, 0, DS.W, DS.northLine - 0.3),
  // 南邊靠河的一排（巷子可以走）
  ...RIVER_ROW.map((b) => r(b.x0, DS.riverRowY0, b.x1, DS.riverRowY1 - 0.2)),
  // 河（渡船頭可以走）
  r(0, DS.promenadeY1 - 0.15, DS.pier.x0, DS.H),
  r(DS.pier.x1, DS.promenadeY1 - 0.15, DS.W, DS.H),
  r(DS.pier.x0, DS.pier.y1, DS.pier.x1, DS.H),
  // 馬偕像、長椅背、咖啡桌、樹
  r(DS.mackay.x - 1.4, DS.mackay.y - 0.6, DS.mackay.x + 1.4, DS.mackay.y + 0.6),
  r(FORT_BENCH.x - 1.3, FORT_BENCH.y - 0.75, FORT_BENCH.x + 1.3, FORT_BENCH.y - 0.45),
  ...RIVER_BENCHES.map((x) => r(x - 1.3, RIVER_BENCH_Y - 0.75, x + 1.3, RIVER_BENCH_Y - 0.45)),
  ...CAFE_TABLES.map((x) => r(x - 0.4, CAFE_Y - 0.35, x + 0.4, CAFE_Y + 0.2)),
  ...[...HILL_TREES, ...TREES].map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...[...NORTH_ROW, ...RIVER_ROW].map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: (NORTH_ROW.includes(b) ? DS.northLine : DS.riverRowY1) * T - 10, r: 28, color: 'rgba(255, 214, 150, 0.42)' })),
  { x: ((DS.station.x0 + DS.station.x1) / 2) * T, y: DS.northLine * T - 14, r: 50, color: 'rgba(255, 230, 180, 0.5)' },
  { x: ((DS.fort.x0 + DS.fort.x1) / 2) * T, y: DS.fort.y * T - 30, r: 50, color: 'rgba(255, 190, 120, 0.35)' },
  { x: 16 * T, y: 36.6 * T, r: 14, color: 'rgba(255, 220, 160, 0.6)' },
  { x: 24 * T, y: 35.6 * T, r: 12, color: 'rgba(255, 220, 160, 0.6)' },
  { x: 40 * T, y: 36.2 * T, r: 12, color: 'rgba(255, 220, 160, 0.6)' },
];

export const TAMSUI: CityDef = {
  id: 'tamsui',
  W: DS.W,
  H: DS.H,
  title: { 'zh-TW': '淡水 · 老街與紅毛城', 'en-US': 'Tamsui · Old Street & Fort San Domingo' },
  stop: { 'zh-TW': '淡水（紅毛城）', 'en-US': 'Tamsui (Fort San Domingo)' },
  emoji: '🌅',
  line: 'red',
  station: {
    x: (DS.station.x0 + DS.station.x1) / 2,
    y: DS.northLine + 0.5,
    name: { 'zh-TW': '捷運淡水站', 'en-US': 'MRT Tamsui Station' },
    arrive: { x: (DS.station.x0 + DS.station.x1) / 2 - 1.6, y: DS.northLine + 0.7 },
  },
  background: '#d6cfc2',
  soundscape: 'beach',
  paintGround: paintTamsuiGround,
  props,
  solid,
  seats: TAMSUI_SEATS,
  drawSeat,
  shops: TAMSUI_SHOPS,
  fortune: {
    at: r(DS.temple.x0 + 1.2, DS.northLine, DS.temple.x1 - 1.2, DS.northLine + 1),
    label: { x: (DS.temple.x0 + DS.temple.x1) / 2, y: DS.northLine + 0.15 },
    title: { 'zh-TW': '福佑宮 · 求籤', 'en-US': 'Fuyou Temple · Fortune' },
    hint: { 'zh-TW': '跟媽祖說說想問的事，再抽一支籤。', 'en-US': 'Tell Mazu your question, then draw a stick.' },
    draw: { 'zh-TW': '求籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再求一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '上上籤', 'en-US': 'Supreme luck' }, text: { 'zh-TW': '順風順水，今天的進度會超前！', 'en-US': 'Fair winds — you’ll get ahead today!' } },
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great luck' }, text: { 'zh-TW': '像淡水的夕陽一樣，努力會有漂亮的結果。', 'en-US': 'Like a Tamsui sunset, your effort will end beautifully.' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Fair luck' }, text: { 'zh-TW': '慢慢來，船到橋頭自然直。', 'en-US': 'Take it slow — things will work out.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small luck' }, text: { 'zh-TW': '休息一下，吃顆鐵蛋再繼續。', 'en-US': 'Take a break, have an iron egg, then carry on.' } },
      { rank: { 'zh-TW': '上籤', 'en-US': 'Good luck' }, text: { 'zh-TW': '跟朋友一起讀，比一個人更有動力。', 'en-US': 'Studying with friends keeps you going.' } },
    ],
  },
  infos: [
    { at: r(DS.fort.x0, DS.fort.y - 5, DS.fort.x1, DS.fort.y), title: { 'zh-TW': '紅毛城', 'en-US': 'Fort San Domingo' }, text: { 'zh-TW': '1628 年西班牙人建的城堡，後來荷蘭人用石頭重建，臺灣人叫荷蘭人「紅毛」，所以叫紅毛城，是國定古蹟。', 'en-US': 'Built by the Spanish in 1628 and rebuilt in stone by the Dutch — locals called the Dutch "red-haired", hence the name. A national monument.' } },
    { at: r(DS.consulate.x0, DS.consulate.y - 4, DS.consulate.x1, DS.consulate.y), title: { 'zh-TW': '前清英國領事官邸', 'en-US': 'Former British Consular Residence' }, text: { 'zh-TW': '1891 年蓋的紅磚洋樓，有一圈白色拱廊，就在紅毛城旁邊。', 'en-US': 'A red-brick residence from 1891 with white arcades, right next to the fort.' } },
    { at: r(20, 4.8, 25.6, DS.northLine), title: { 'zh-TW': '淡水禮拜堂', 'en-US': 'Tamsui Church' }, text: { 'zh-TW': '馬偕創立的教會，現在的紅磚禮拜堂是 1933 年重建的，尖尖的鐘樓是淡水的地標。', 'en-US': 'Founded by George Leslie Mackay; the red-brick church was rebuilt in 1933 and its spire is a Tamsui landmark.' } },
    { at: r(DS.mackay.x - 1.4, DS.mackay.y - 2.2, DS.mackay.x + 1.4, DS.mackay.y + 0.6), title: { 'zh-TW': '馬偕像', 'en-US': 'Mackay Statue' }, text: { 'zh-TW': '馬偕 1872 年從加拿大來到淡水，傳教、行醫、辦學校，還幫人拔了很多牙。', 'en-US': 'Mackay came to Tamsui from Canada in 1872 — preaching, practising medicine, founding schools and pulling a great many teeth.' } },
    { at: r(DS.temple.x0, 6.2, DS.temple.x1, DS.northLine), title: { 'zh-TW': '福佑宮', 'en-US': 'Fuyou Temple' }, text: { 'zh-TW': '淡水最老的廟，供奉媽祖，保佑以前在淡水河進出的船。', 'en-US': 'Tamsui’s oldest temple, dedicated to Mazu, who watched over the ships on the river.' } },
    { at: r(DS.station.x0, 2, DS.station.x1, DS.northLine), title: { 'zh-TW': '捷運淡水站', 'en-US': 'MRT Tamsui Station' }, text: { 'zh-TW': '捷運紅線的終點站，紅瓦屋頂的站體。', 'en-US': 'The terminus of the MRT Red Line, with a red-tiled roof.' } },
    { at: r(DS.pier.x0, DS.promenadeY1, DS.pier.x1, DS.pier.y1), title: { 'zh-TW': '淡水渡船頭', 'en-US': 'Tamsui Ferry Pier' }, text: { 'zh-TW': '從這裡搭渡輪可以到漁人碼頭、對岸的八里。', 'en-US': 'Ferries leave here for Fisherman’s Wharf and Bali across the river.' } },
    { at: r(0, DS.farBankY, DS.W, DS.H), title: { 'zh-TW': '觀音山', 'en-US': 'Mount Guanyin' }, text: { 'zh-TW': '淡水河對岸的山，傍晚夕陽從這一帶落下，金色水岸就是看夕陽的地方。', 'en-US': 'The mountain across the river; at dusk the sun sets over here — the Golden Riverside is where people watch it.' } },
  ],
  labels: [
    { x: 9, y: 0.6, text: { 'zh-TW': '🏰 紅毛城', 'en-US': '🏰 Fort San Domingo' }, color: '#f87171' },
    { x: 24, y: DS.riverRowY1 + 2.2, text: { 'zh-TW': '🌅 金色水岸（長椅看河專注）', 'en-US': '🌅 Golden Riverside (benches to focus)' }, color: '#fbbf24' },
    { x: (DS.pier.x0 + DS.pier.x1) / 2, y: DS.pier.y1 - 0.2, text: { 'zh-TW': '⛴️ 渡船頭', 'en-US': '⛴️ Ferry pier' }, color: '#60a5fa' },
  ],
  walkers: [
    { x0: 21, y0: 11.9, x1: 45, y1: 11.9, count: 3 },
    { x0: 1, y0: 16.1, x1: 55, y1: 16.1, count: 5 },
    { x0: 1, y0: 23.2, x1: 55, y1: 23.2, count: 4 },
    { x0: 1, y0: 10.2, x1: 19, y1: 10.2, count: 2 },
  ],
  traffic: [
    { y: 13.6, dir: -1, x0: 0, x1: DS.W, count: 2 },
    { y: 14.9, dir: 1, x0: 0, x1: DS.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點紅毛城前或金色水岸的長椅、河岸咖啡的位子坐下專注 · 走到阿給、魚丸、鐵蛋店門口買東西 · 福佑宮前求籤 · 點地標看介紹 · 捷運淡水站回台北',
    'en-US': 'WASD / arrows to move · click a bench by the fort or the river, or a café seat, to focus · walk up to shops to buy · draw a fortune at Fuyou Temple · click landmarks for info · MRT Tamsui back to Taipei',
  },
  hintTouch: {
    'zh-TW': '點長椅、咖啡位子坐下專注 · 走到店門口買東西 · 福佑宮求籤 · 點地標看介紹 · 捷運淡水站回台北',
    'en-US': 'Tap a bench or café seat to focus · walk up to shops · draw a fortune at the temple · tap landmarks · MRT back to Taipei',
  },
};
