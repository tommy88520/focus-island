// 東京的美術：遠方的晴空塔、淺草寺本堂（大屋頂、朱紅柱子、大燈籠）、五重塔、常香爐（煙）、仲見世通的小店、
// 雷門（風神雷神、大紅燈籠）、人力車、隅田川（吾妻橋、水上巴士）、JR 東京站丸之內站舍（紅磚、白色線條、兩邊的圓頂）。
// 最後組成 CityScene 用的 TOKYO。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { HONDO_DOOR, PLAZA_BENCHES, PLAZA_BENCH_Y, RIVER_BENCHES, RIVER_BENCH_Y, TEMPLE_BENCHES, TEMPLE_BENCH_Y, TK, TOKYO_SEATS, TOKYO_SHOPS } from './tokyo';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, cached, blit, road, tiles, zebra, drawBench, drawStreetTree } from './cityArt';
import { drawLantern, drawStreetLamp, tiledRoof, drawWillow } from './kyotoArt';
import { drawSakura } from './osakaArt';

const VERMILION = '#d2452e';
const VERMILION_DARK = '#a8321f';
const ROOF = '#4a4f58';

// ── 地面（畫一次）──
export function paintTokyoGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1603);
  const W = TK.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 6 * T);
  sky.addColorStop(0, '#6fb2e6');
  sky.addColorStop(1, '#dcefF8');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 6 * T);
  // 遠方的大樓
  for (let x = 0; x < W; ) {
    const bw = 18 + Math.floor(rand() * 26);
    const bh = 20 + Math.floor(rand() * 36);
    px(c, rand() < 0.5 ? '#b8c4d0' : '#c9d2dc', x, 6 * T - bh, bw, bh + T);
    for (let y = 6 * T - bh + 4; y < 6 * T; y += 6) for (let wx = x + 3; wx < x + bw - 3; wx += 6) px(c, '#9aaab9', wx, y, 3, 3);
    x += bw + 1;
  }
  // 晴空塔（遠景，藍白色的鐵塔）
  const sx = 52 * T;
  c.fillStyle = '#dfe8f0';
  c.beginPath();
  c.moveTo(sx - 14, 7 * T);
  c.lineTo(sx - 4, 0.6 * T);
  c.lineTo(sx + 4, 0.6 * T);
  c.lineTo(sx + 14, 7 * T);
  c.fill();
  for (let y = 1 * T; y < 7 * T; y += 6) px(c, 'rgba(120,150,180,0.35)', sx - 4 - ((y - T) / (6 * T)) * 10, y, 8 + ((y - T) / (6 * T)) * 20, 1);
  px(c, '#9fb3c6', sx - 7, 2.6 * T, 14, 5);
  px(c, '#9fb3c6', sx - 5, 1.5 * T, 10, 3);
  px(c, '#dfe8f0', sx - 1, 0, 2, 0.6 * T);
  // 寺院後面的樹
  px(c, '#5a8a4e', 0, 6 * T, W, (TK.hondo.line - 6) * T);
  for (let i = 0; i < 120; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#4a7a42' : '#6a9a5a';
    c.beginPath();
    c.arc(rand() * W, 6.4 * T + rand() * 3.4 * T, 5 + rand() * 5, 0, Math.PI * 2);
    c.fill();
  }
  // 淺草寺的石板廣場、仲見世的石板路
  tiles(c, { x0: 0, y0: TK.hondo.line, x1: TK.W, y1: TK.road.y0 }, '#c9c1b2', '#b5ad9d', 16);
  px(c, '#d8d0c0', 21 * T, TK.hondo.line * T, 10 * T, (TK.road.y0 - TK.hondo.line) * T);
  for (let y = TK.hondo.line * T; y < TK.road.y0 * T; y += 10) px(c, '#c4bcab', 21 * T, y, 10 * T, 1);
  // 馬路
  px(c, '#cfc9bd', 0, (TK.road.y0 - 0.3) * T, W, 0.3 * T);
  road(c, { x0: 0, y0: TK.road.y0, x1: TK.W, y1: TK.road.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((TK.road.y0 + TK.road.y1) / 2) * T), 12, 1);
  zebra(c, 24, TK.road.y0, 28, TK.road.y1, false);
  zebra(c, 40.6, TK.road.y0, 43.8, TK.road.y1, false);
  // 隅田川
  px(c, '#8f897d', 0, TK.river.y0 * T - 9, W, 9);
  px(c, '#cfc9bd', 0, TK.road.y1 * T, W, (TK.river.y0 * T - 9) - TK.road.y1 * T);
  const ry0 = TK.river.y0 * T;
  const ry1 = TK.river.y1 * T;
  const water = c.createLinearGradient(0, ry0, 0, ry1);
  water.addColorStop(0, '#4a8aa8');
  water.addColorStop(1, '#3a7090');
  c.fillStyle = water;
  c.fillRect(0, ry0, W, ry1 - ry0);
  for (let i = 0; i < 100; i += 1) px(c, 'rgba(255,255,255,0.22)', Math.floor(rand() * W), Math.floor(ry0 + 3 + rand() * (ry1 - ry0 - 6)), 6 + Math.floor(rand() * 8), 1);
  // 吾妻橋（紅色鐵橋）
  const bx0 = TK.azuma.x0 * T;
  const bx1 = TK.azuma.x1 * T;
  px(c, 'rgba(0,0,0,0.3)', bx0 + 3, ry0, bx1 - bx0, ry1 - ry0 + 3);
  px(c, '#9a958c', bx0, ry0 - 6, bx1 - bx0, ry1 - ry0 + 12);
  for (const x of [bx0, bx1 - 5]) {
    px(c, '#c8382a', x, ry0 - 8, 5, ry1 - ry0 + 16);
    for (let y = ry0 - 6; y < ry1 + 6; y += 8) px(c, '#e8584a', x, y, 5, 2);
  }
  // 河邊步道（木頭）、第二條馬路、丸之內廣場
  px(c, '#8f897d', 0, ry1, W, 3);
  px(c, '#b08a62', 0, ry1 + 3, W, TK.promenade.y1 * T - ry1 - 3);
  for (let x = 0; x < W; x += 6) px(c, '#9a764e', x, ry1 + 3, 1, TK.promenade.y1 * T - ry1 - 3);
  road(c, { x0: 0, y0: TK.road2.y0, x1: TK.W, y1: TK.road2.y1 }, rand);
  for (let x = 0; x < W; x += 24) px(c, '#e8e8e8', x, Math.round(((TK.road2.y0 + TK.road2.y1) / 2) * T), 12, 1);
  zebra(c, 26, TK.road2.y0, 30, TK.road2.y1, false);
  tiles(c, { x0: 0, y0: TK.road2.y1, x1: TK.W, y1: TK.H }, '#d6d0c2', '#c4beb0', 16);
  for (const [x0, x1] of [[2, 10], [46, 54]] as const) px(c, '#6e9a4c', x0 * T, 38 * T, (x1 - x0) * T, 2 * T);
}

// 淺草寺本堂：大大的瓦屋頂、朱紅柱子、正面的大燈籠
function hondoSprite(): HTMLCanvasElement {
  const w = Math.round((TK.hondo.x1 - TK.hondo.x0) * T);
  const h = 128;
  return cached('tk-hondo', w, h, (c) => {
    const cx = w / 2;
    px(c, '#9a948a', 6, h - 10, w - 12, 10);
    px(c, '#b5ad9f', 6, h - 10, w - 12, 1);
    // 柱子、牆
    px(c, '#3a2420', 22, 70, w - 44, h - 80);
    for (let x = 22; x < w - 22; x += 18) px(c, VERMILION, x, 70, 6, h - 80);
    px(c, VERMILION, 22, 70, w - 44, 6);
    // 正面的大燈籠（小舟町）
    px(c, '#2a1a14', cx - 1, 76, 2, 4);
    c.fillStyle = '#d8382a';
    c.beginPath();
    c.ellipse(cx, 96, 14, 16, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#2a1a14', cx - 12, 80, 24, 2);
    px(c, '#2a1a14', cx - 12, 110, 24, 2);
    text(c, '志', cx, 96, '#1f1a18', `900 10px ${SERIF_TC}`);
    // 大屋頂（反翹）
    c.fillStyle = '#4f5560';
    c.beginPath();
    c.moveTo(-2, 74);
    c.quadraticCurveTo(30, 66, 50, 18);
    c.lineTo(w - 50, 18);
    c.quadraticCurveTo(w - 30, 66, w + 2, 74);
    c.lineTo(w + 2, 70);
    c.lineTo(-2, 70);
    c.fill();
    for (let x = 30; x < w - 30; x += 4) px(c, 'rgba(255,255,255,0.07)', x, 22, 1, 46);
    px(c, '#3a3e46', -2, 70, w + 4, 4);
    px(c, '#3a3e46', 46, 14, w - 92, 6);
    // 屋脊兩端的鴟尾
    px(c, '#3a3e46', 44, 6, 8, 10);
    px(c, '#3a3e46', w - 52, 6, 8, 10);
    // 正面的唐破風＋匾
    c.fillStyle = '#4f5560';
    c.beginPath();
    c.moveTo(cx - 34, 58);
    c.quadraticCurveTo(cx, 30, cx + 34, 58);
    c.fill();
    px(c, '#1f1a18', cx - 16, 44, 32, 10);
    text(c, '施無畏', cx, 49, '#e8b830', `900 6px ${SERIF_TC}`);
  });
}

// 五重塔（朱紅）
function pagodaSprite(): HTMLCanvasElement {
  return cached('tk-pagoda', 84, 168, (c) => {
    const cx = 42;
    let y = 160;
    px(c, '#9a948a', cx - 26, y, 52, 8);
    for (let k = 0; k < 5; k += 1) {
      const bw = 34 - k * 3;
      y -= 14;
      px(c, VERMILION, cx - bw / 2, y, bw, 14);
      px(c, '#f4efe2', cx - bw / 2 + 4, y + 3, bw - 8, 3);
      px(c, VERMILION_DARK, cx - 1, y + 6, 2, 8);
      const rw = 76 - k * 7;
      y -= 8;
      tiledRoof(c, cx - rw / 2, y, rw, 9, '#3d4048', 4);
    }
    px(c, '#c9a24a', cx - 1, y - 32, 3, 32);
    for (let k = 0; k < 9; k += 1) px(c, '#c9a24a', cx - 4, y - 28 + k * 3, 9, 1);
  });
}

// 常香爐（冒煙）
function drawCenser(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(TK.censer.x * T);
  const by = Math.round(TK.censer.y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 16, by - 1, 32, 3);
  px(c, '#4a4440', cx - 12, by - 6, 24, 6);
  px(c, '#5a5450', cx - 14, by - 16, 28, 10);
  px(c, '#6a6460', cx - 14, by - 16, 28, 2);
  tiledRoof(c, cx - 14, by - 26, 28, 9, '#4a4440', 3);
  for (let k = 0; k < 5; k += 1) {
    const t = (d.seconds * 0.35 + k / 5) % 1;
    c.fillStyle = `rgba(235,235,235,${0.5 * (1 - t)})`;
    c.beginPath();
    c.arc(cx + Math.sin(d.seconds * 0.8 + k * 1.7) * 6 * t, by - 30 - t * 34, 3 + t * 5, 0, Math.PI * 2);
    c.fill();
  }
}

// 仲見世的小店：朱紅色的屋頂、白牆、店名、架上的東西、老闆
function nakamiseSprite(i: number): HTMLCanvasElement {
  const s = TK.nakamise[i] ?? TK.nakamise[0];
  const w = Math.round((s.x1 - s.x0) * T);
  const h = 50;
  return cached(`tk-nakamise-${i}`, w, h, (c) => {
    const rand = seeded(900 + i);
    px(c, '#f4efe2', 2, 14, w - 4, h - 14);
    px(c, '#3a2a20', 6, 22, w - 12, h - 30);
    for (let r = 0; r < 2; r += 1) for (let x = 8; x < w - 8; x += 6) px(c, ['#e8b830', '#c8102e', '#f4efe2', '#2f5d3a', '#e07a1f'][Math.floor(rand() * 5)] ?? '#fff', x, 25 + r * 8, 4, 5);
    tiledRoof(c, 0, 2, w, 12, VERMILION, 2);
    px(c, s.color, 4, 14, w - 8, 7);
    text(c, s.name, w / 2, 17.5, '#ffffff', `900 ${s.name.length > 5 ? 4.5 : 6}px ${FONT_TC}`);
  });
}
function drawNakamise(c: CanvasRenderingContext2D, i: number, d: DrawCtx): void {
  const s = TK.nakamise[i];
  if (!s) return;
  const x0 = Math.round(s.x0 * T);
  const w = Math.round((s.x1 - s.x0) * T);
  const by = Math.round(TK.rowLine * T);
  blit(c, nakamiseSprite(i), x0, by);
  const owner = getAvatarFrame(lookColors((i * 3) % 5, 1 + (i % 4), { body: i % 2 }), 'down', 'idle');
  c.drawImage(owner, Math.round(x0 + w / 2 - owner.width / 2), by - 9 - owner.height + 4);
  px(c, 'rgba(0,0,0,0.2)', x0, by, w, 2);
  px(c, '#8a5a32', x0 + 4, by - 9, w - 8, 9);
  px(c, '#a8703f', x0 + 4, by - 9, w - 8, 1);
  for (let x = x0 + 8; x < x0 + w - 8; x += 7) px(c, ['#f0c860', '#e8a07a', '#f4efe2'][(x / 7) % 3 | 0] ?? '#f0c860', x, by - 12, 5, 3);
  drawLantern(c, x0 + 6, by - 30, '#e8402e', d.night);
}

// 雷門：朱紅色的門、兩邊的風神雷神、正中間的大紅燈籠「雷門」
function kaminarimonSprite(): HTMLCanvasElement {
  const w = Math.round((TK.kaminarimon.x1 - TK.kaminarimon.x0) * T);
  const h = 100;
  return cached('tk-kaminarimon', w, h, (c) => {
    const cx = w / 2;
    px(c, '#9a948a', 0, h - 6, w, 6);
    // 兩邊的房間（風神、雷神）
    for (const [x0, god] of [[4, '風神'], [w - 50, '雷神']] as const) {
      px(c, VERMILION, x0, 42, 46, h - 48);
      px(c, '#2a1a14', x0 + 6, 52, 34, h - 62);
      px(c, god === '風神' ? '#3f8a5a' : '#c8382a', x0 + 14, 58, 18, 22);
      px(c, '#f4efe2', x0 + 18, 60, 10, 6);
      px(c, '#f4efe2', x0 + 8, 44, 30, 6);
      text(c, god, x0 + 23, 47, '#1f1a18', `900 5px ${SERIF_TC}`);
    }
    // 中間的門洞
    px(c, VERMILION, 50, 42, w - 100, 8);
    for (const x of [50, w - 56]) px(c, VERMILION_DARK, x, 42, 6, h - 48);
    // 屋頂
    tiledRoof(c, -4, 18, w + 8, 24, ROOF, 6);
    px(c, '#3a3e46', 20, 14, w - 40, 5);
    // 大燈籠
    c.fillStyle = '#d23020';
    c.beginPath();
    c.ellipse(cx, 66, 22, 24, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#1f1a18', cx - 18, 42, 36, 4);
    px(c, '#1f1a18', cx - 18, 87, 36, 4);
    for (let k = -16; k <= 16; k += 4) px(c, 'rgba(0,0,0,0.12)', cx + k, 46, 1, 41);
    text(c, '雷門', cx, 66, '#1f1a18', `900 15px ${SERIF_TC}`);
    // 匾
    px(c, '#1f1a18', cx - 18, 26, 36, 12);
    text(c, '金龍山', cx, 32, '#e8b830', `900 6px ${SERIF_TC}`);
  });
}

// 人力車：車伕拉著，在雷門前慢慢來回
function drawRickshaw(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const span = 30 * T;
  const k = (d.seconds * 18) % (span * 2);
  const forward = k < span;
  const x = 8 * T + (forward ? k : span * 2 - k);
  const dir = forward ? 1 : -1;
  const by = 24.6 * T;
  px(c, 'rgba(0,0,0,0.25)', x - 18, by - 1, 36, 3);
  // 車
  px(c, '#2a1a14', x - 10 * dir - 10, by - 20, 20, 14);
  px(c, '#c8382a', x - 10 * dir - 8, by - 18, 16, 6);
  c.strokeStyle = '#2a1a14';
  c.lineWidth = 2;
  c.beginPath();
  c.arc(x - 10 * dir, by - 7, 7, 0, Math.PI * 2);
  c.stroke();
  px(c, '#2a1a14', x - 10 * dir, by - 14, 20 * dir, 2);
  // 車伕
  const puller = getAvatarFrame(lookColors(1, 4, { body: 0 }), dir > 0 ? 'right' : 'left', Math.floor(d.seconds * 6) % 2 ? 'walkA' : 'walkB');
  c.drawImage(puller, Math.round(x + 12 * dir - puller.width / 2), by - puller.height + 4);
}

// 水上巴士（像太空船的流線型）
function drawWaterBus(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, TK.river.y0 * T - 20, TK.W * T, (TK.river.y1 - TK.river.y0) * T + 20);
  c.clip();
  const span = TK.W * T + 160;
  const x = TK.W * T + 80 - ((d.seconds * 12) % span);
  const y = ((TK.river.y0 + TK.river.y1) / 2) * T + 4;
  if (!(x > TK.azuma.x0 * T - 40 && x < TK.azuma.x1 * T + 40)) {
    px(c, 'rgba(0,0,0,0.25)', x - 34, y + 3, 68, 3);
    c.fillStyle = '#d6dde6';
    c.beginPath();
    c.ellipse(x, y - 4, 34, 9, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#7ab0d0';
    c.beginPath();
    c.ellipse(x - 4, y - 8, 22, 6, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#f4f6f8', x - 20, y - 12, 18, 2);
    for (let k = 0; k < 3; k += 1) px(c, 'rgba(255,255,255,0.5)', Math.round(x + 38 + k * 6), y + Math.round(Math.sin(d.seconds * 3 + k)), 4, 1);
  }
  c.restore();
}

// JR 東京站丸之內站舍：紅磚、白色的橫線、兩端的圓頂、中央的屋頂
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((TK.station.x1 - TK.station.x0) * T);
  const h = 92;
  return cached('tk-station', w, h, (c) => {
    const body = 30;
    px(c, '#b5583e', 0, body, w, h - body);
    for (let y = body + 2; y < h; y += 4) for (let x = ((y / 4) % 2) * 4; x < w; x += 8) px(c, '#9d4634', x, y, 1, 3);
    for (const y of [body + 18, body + 40]) px(c, '#efe8d8', 0, y, w, 3);
    for (let x = 8; x < w - 8; x += 14) for (const y of [body + 6, body + 26, body + 46]) {
      px(c, '#efe8d8', x - 1, y - 1, 9, 12);
      px(c, '#3a4a5a', x, y, 7, 10);
    }
    // 屋頂（深灰）
    px(c, '#4a4f58', 0, body - 6, w, 6);
    // 兩端的圓頂（南口、北口）
    for (const cx of [44, w - 44]) {
      px(c, '#b5583e', cx - 30, body - 6, 60, h - body + 6);
      c.fillStyle = '#4a5a58';
      c.beginPath();
      c.moveTo(cx - 32, body - 4);
      c.quadraticCurveTo(cx - 30, 6, cx, 2);
      c.quadraticCurveTo(cx + 30, 6, cx + 32, body - 4);
      c.fill();
      px(c, '#efe8d8', cx - 32, body - 6, 64, 3);
      px(c, '#c9a24a', cx - 1, 0, 3, 4);
    }
    // 中央：三角屋頂、入口、站名
    const cx = w / 2;
    c.fillStyle = '#4a4f58';
    c.beginPath();
    c.moveTo(cx - 44, body - 4);
    c.lineTo(cx, 8);
    c.lineTo(cx + 44, body - 4);
    c.fill();
    px(c, '#2a1a14', cx - 22, h - 26, 44, 26);
    px(c, '#f4f6f8', cx - 60, body + 22, 120, 12);
    px(c, '#1a8c3a', cx - 58, body + 23, 14, 10);
    text(c, 'JR', cx - 51, body + 28, '#ffffff', `900 6px ${FONT_TC}`);
    text(c, '東京駅  TOKYO STATION', cx + 8, body + 28, '#1f2a44', `900 7px ${FONT_TC}`);
  });
}

const SAKURAS: [number, number][] = [[2.5, 12.6], [12.5, 12.2], [40, 12.2], [50.5, 12.6], [3, 23.6], [52, 23.6]];
const WILLOWS: [number, number][] = [[5, 27.6], [20, 27.6], [33, 27.6], [50, 27.6]];
const LAMPS: [number, number][] = [[2, 24.8], [16, 24.8], [36, 24.8], [52, 24.8], [3, 34.2], [18, 34.2], [36, 34.2], [53, 34.2], [10, 40.8], [46, 40.8]];
const TREES: [number, number][] = [[3, 39.6], [8.5, 39.6], [47.5, 39.6], [53, 39.6]];

const props: CityProp[] = [
  { y: TK.hondo.line, draw: (c) => blit(c, hondoSprite(), TK.hondo.x0 * T, TK.hondo.line * T) },
  { y: TK.pagoda.line, draw: (c) => blit(c, pagodaSprite(), TK.pagoda.x * T - 42, TK.pagoda.line * T) },
  { y: TK.censer.y, draw: (c, d) => drawCenser(c, d) },
  ...TEMPLE_BENCHES.map((x): CityProp => ({ y: TEMPLE_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, TEMPLE_BENCH_Y, 2.6) })),
  ...TK.nakamise.map((_, i): CityProp => ({ y: TK.rowLine, draw: (c, d) => drawNakamise(c, i, d) })),
  { y: TK.kaminarimon.line, draw: (c) => blit(c, kaminarimonSprite(), TK.kaminarimon.x0 * T, TK.kaminarimon.line * T) },
  { y: 24.6, draw: (c, d) => drawRickshaw(c, d) },
  ...SAKURAS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawSakura(c, x, y, d.seconds) })),
  ...WILLOWS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawWillow(c, x, y, d.seconds) })),
  { y: TK.river.y1 - 0.3, draw: (c, d) => drawWaterBus(c, d) },
  ...RIVER_BENCHES.map((x): CityProp => ({ y: RIVER_BENCH_Y - 0.02, draw: (c) => {
    const cx = Math.round(x * T);
    const by = Math.round(RIVER_BENCH_Y * T);
    px(c, 'rgba(0,0,0,0.2)', cx - 21, by + 1, 42, 3);
    px(c, '#8a5a32', cx - 21, by - 4, 42, 4);
    px(c, '#a8703f', cx - 21, by - 4, 42, 1);
    px(c, '#3a3d45', cx - 18, by, 3, 2);
    px(c, '#3a3d45', cx + 15, by, 3, 2);
  } })),
  ...PLAZA_BENCHES.map((x): CityProp => ({ y: PLAZA_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, PLAZA_BENCH_Y, 2.6) })),
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawStreetLamp(c, x, y, d.night) })),
  { y: TK.station.line, draw: (c) => blit(c, stationSprite(), TK.station.x0 * T, TK.station.line * T) },
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 隅田川只有吾妻橋能過
function blocked(x: number, y: number): boolean {
  if (y > TK.river.y0 - 0.6 && y < TK.river.y1 + 0.2) return !(x > TK.azuma.x0 + 0.4 && x < TK.azuma.x1 - 0.4);
  return false;
}
const solid: Rect[] = [
  r(0, 0, TK.W, TK.hondo.line - 0.1),
  r(TK.hondo.x0, TK.hondo.line - 1, TK.hondo.x1, TK.hondo.line + 0.05),
  r(TK.pagoda.x - 1.6, TK.pagoda.line - 1, TK.pagoda.x + 1.6, TK.pagoda.line + 0.05),
  r(TK.censer.x - 1, TK.censer.y - 0.5, TK.censer.x + 1, TK.censer.y),
  ...TEMPLE_BENCHES.map((x) => r(x - 1.3, TEMPLE_BENCH_Y - 0.75, x + 1.3, TEMPLE_BENCH_Y - 0.45)),
  r(TK.nakamise[0].x0, TK.rowLine - 2.4, TK.nakamise[2].x1, TK.rowLine - 0.05),
  r(TK.nakamise[3].x0, TK.rowLine - 2.4, TK.nakamise[5].x1, TK.rowLine - 0.05),
  r(TK.kaminarimon.x0, TK.kaminarimon.line - 1.4, TK.kaminarimon.x0 + 3.1, TK.kaminarimon.line - 0.05),
  r(TK.kaminarimon.x1 - 3.1, TK.kaminarimon.line - 1.4, TK.kaminarimon.x1, TK.kaminarimon.line - 0.05),
  ...RIVER_BENCHES.map((x) => r(x - 1.3, RIVER_BENCH_Y - 0.35, x + 1.3, RIVER_BENCH_Y - 0.1)),
  ...PLAZA_BENCHES.map((x) => r(x - 1.3, PLAZA_BENCH_Y - 0.75, x + 1.3, PLAZA_BENCH_Y - 0.45)),
  ...SAKURAS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...WILLOWS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
  r(TK.station.x0, TK.station.line - 3, TK.station.x1, TK.station.line - 0.05),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  ...TK.nakamise.map((s) => ({ x: ((s.x0 + s.x1) / 2) * T, y: TK.rowLine * T - 20, r: 46, color: 'rgba(255, 200, 120, 0.45)' })),
  { x: ((TK.kaminarimon.x0 + TK.kaminarimon.x1) / 2) * T, y: TK.kaminarimon.line * T - 40, r: 90, color: 'rgba(255, 150, 100, 0.45)' },
  { x: HONDO_DOOR.x * T, y: TK.hondo.line * T - 40, r: 120, color: 'rgba(255, 190, 120, 0.4)' },
  { x: TK.pagoda.x * T, y: TK.pagoda.line * T - 80, r: 70, color: 'rgba(255, 170, 120, 0.35)' },
  { x: 52 * T, y: 3 * T, r: 60, color: 'rgba(150, 200, 255, 0.4)' },
  { x: ((TK.station.x0 + TK.station.x1) / 2) * T, y: TK.station.line * T - 40, r: 160, color: 'rgba(255, 220, 160, 0.4)' },
];

const stationX = (TK.station.x0 + TK.station.x1) / 2;

export const TOKYO: CityDef = {
  id: 'tokyo',
  country: 'jp',
  line: 'jr',
  W: TK.W,
  H: TK.H,
  title: { 'zh-TW': '東京 · 淺草寺與東京站', 'en-US': 'Tokyo · Sensō-ji & Tokyo Station' },
  stop: { 'zh-TW': '東京（JR 東京站）', 'en-US': 'Tokyo (JR Tokyo Sta.)' },
  emoji: '🗼',
  station: {
    x: stationX,
    y: TK.station.line + 0.6,
    name: { 'zh-TW': 'JR 東京站', 'en-US': 'JR Tokyo Station' },
    arrive: { x: stationX + 3, y: TK.station.line + 0.8 },
  },
  background: '#d6d0c2',
  soundscape: 'city',
  paintGround: paintTokyoGround,
  props,
  solid,
  blocked,
  seats: TOKYO_SEATS,
  drawSeat: () => undefined,
  shops: TOKYO_SHOPS,
  fortune: {
    at: r(HONDO_DOOR.x - 2.4, TK.hondo.line, HONDO_DOOR.x + 2.4, TK.hondo.line + 1.6),
    label: { x: HONDO_DOOR.x, y: TK.hondo.line - 8.4 },
    title: { 'zh-TW': '淺草寺 · 御神籤', 'en-US': 'Sensō-ji · Omikuji' },
    hint: { 'zh-TW': '搖一搖籤筒，照籤號去抽屜拿籤。淺草寺的籤凶比較多，抽到別難過。', 'en-US': 'Shake the box and take the slip from the numbered drawer. Sensō-ji is known for lots of “bad luck” slips — don’t worry!' },
    draw: { 'zh-TW': '抽籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再抽一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great blessing' }, text: { 'zh-TW': '雷門的大燈籠為你照路，今天專注一路順！', 'en-US': 'The great lantern of Kaminarimon lights your way — smooth focus today!' } },
      { rank: { 'zh-TW': '吉', 'en-US': 'Blessing' }, text: { 'zh-TW': '像隅田川一樣慢慢流，不急，但一直往前。', 'en-US': 'Flow like the Sumida — unhurried, but always forward.' } },
      { rank: { 'zh-TW': '半吉', 'en-US': 'Half blessing' }, text: { 'zh-TW': '先吃個人形燒補充體力，再回來拚。', 'en-US': 'Have a ningyo-yaki to recharge, then come back to it.' } },
      { rank: { 'zh-TW': '凶', 'en-US': 'Bad luck' }, text: { 'zh-TW': '抽到凶？綁在旁邊的架子上留給觀音，壞運就不跟著你了。專注一顆番茄鐘轉運！', 'en-US': 'Bad luck? Tie it to the rack and leave it with Kannon. One pomodoro will turn it around!' } },
      { rank: { 'zh-TW': '末小吉', 'en-US': 'Small blessing later' }, text: { 'zh-TW': '好運晚點才來，先把小事做完。', 'en-US': 'Luck arrives later — finish the small things first.' } },
    ],
  },
  infos: [
    { at: r(TK.hondo.x0, 2, TK.hondo.x1, TK.hondo.line - 1), title: { 'zh-TW': '淺草寺', 'en-US': 'Sensō-ji' }, text: { 'zh-TW': '東京最古老的寺廟，西元 628 年創建，供奉觀音。本堂前的常香爐，大家會把煙往身上撥，祈求身體健康。', 'en-US': 'Tokyo’s oldest temple, founded in 628 and dedicated to Kannon. Visitors waft smoke from the great incense burner over themselves for good health.' } },
    { at: r(TK.kaminarimon.x0, TK.kaminarimon.line - 6, TK.kaminarimon.x1, TK.kaminarimon.line), title: { 'zh-TW': '雷門', 'en-US': 'Kaminarimon' }, text: { 'zh-TW': '淺草寺的大門，正中間掛著約 700 公斤的大紅燈籠，左右是風神和雷神。穿過雷門就是仲見世通。', 'en-US': 'Sensō-ji’s outer gate, with a 700 kg red lantern in the middle and the wind and thunder gods on either side. Nakamise-dōri starts right behind it.' } },
    { at: r(TK.nakamise[0].x0, TK.rowLine - 3, TK.nakamise[5].x1, TK.rowLine), title: { 'zh-TW': '仲見世通', 'en-US': 'Nakamise-dōri' }, text: { 'zh-TW': '日本最古老的商店街之一，從雷門一路到寶藏門，兩旁將近 90 家小店賣人形燒、雷米香、扇子和紀念品。', 'en-US': 'One of Japan’s oldest shopping streets, running from Kaminarimon to the temple with nearly 90 shops selling ningyo-yaki, okoshi, fans and souvenirs.' } },
    { at: r(46, 0, TK.W, 7), title: { 'zh-TW': '東京晴空塔', 'en-US': 'Tokyo Skytree' }, text: { 'zh-TW': '634 公尺，世界最高的電波塔，就在隅田川對岸。高度 634 的讀音「むさし」是東京一帶的古地名。', 'en-US': 'At 634 m, the world’s tallest broadcasting tower, just across the Sumida River. 634 reads “mu-sa-shi”, the old name of the region.' } },
    { at: r(0, TK.river.y0, TK.W, TK.river.y1), title: { 'zh-TW': '隅田川', 'en-US': 'Sumida River' }, text: { 'zh-TW': '流過淺草的河，紅色的吾妻橋旁邊有水上巴士的碼頭。每年七月的隅田川花火大會是東京最大的煙火。', 'en-US': 'The river past Asakusa; water buses dock beside the red Azuma Bridge. The Sumida River Fireworks every July are Tokyo’s biggest.' } },
    { at: r(TK.station.x0, TK.station.line - 5.6, TK.station.x1, TK.station.line), title: { 'zh-TW': 'JR 東京站', 'en-US': 'JR Tokyo Station' }, text: { 'zh-TW': '1914 年完工的紅磚丸之內站舍，2012 年修復了兩邊的圓頂。東海道新幹線從這裡出發，到京都大約兩小時十五分。', 'en-US': 'The red-brick Marunouchi building from 1914, with its domes restored in 2012. The Tokaido Shinkansen starts here — about 2 h 15 min to Kyoto.' } },
  ],
  labels: [
    { x: 19, y: TK.promenade.y1 - 0.2, text: { 'zh-TW': '🌊 隅田川步道（長椅坐下專注）', 'en-US': '🌊 Sumida riverwalk (sit to focus)' }, color: '#bae6fd' },
    { x: 26, y: TK.road.y0 - 0.3, text: { 'zh-TW': '🏮 雷門', 'en-US': '🏮 Kaminarimon' }, color: '#fca5a5' },
  ],
  walkers: [
    { x0: 1, y0: 15.8, x1: 55, y1: 15.8, count: 4 },
    { x0: 26, y0: 16, x1: 26, y1: 24.2, count: 4 },
    { x0: 1, y0: 21.6, x1: 20, y1: 21.6, count: 2 },
    { x0: 32, y0: 21.6, x1: 55, y1: 21.6, count: 2 },
    { x0: 1, y0: 33.9, x1: 55, y1: 33.9, count: 3 },
    { x0: 1, y0: 38.4, x1: 55, y1: 38.4, count: 4 },
  ],
  traffic: [
    { y: 25.6, dir: -1, x0: 0, x1: TK.W, count: 2 },
    { y: 26.9, dir: 1, x0: 0, x1: TK.W, count: 2 },
    { y: 35, dir: 1, x0: 0, x1: TK.W, count: 2 },
    { y: 36.2, dir: -1, x0: 0, x1: TK.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點淺草寺廣場、隅田川步道或丸之內廣場的長椅坐下專注 · 走到仲見世的店買人形燒、雷米香、炸饅頭 · 本堂前抽籤 · 穿過雷門、走吾妻橋過河 · JR 東京站去京都、大阪、神戶或飛回台灣',
    'en-US': 'WASD / arrows to move · click a bench at Sensō-ji, the Sumida riverwalk or Marunouchi plaza to focus · walk up to Nakamise shops for ningyo-yaki, okoshi and age-manju · draw omikuji at the main hall · pass through Kaminarimon and cross Azuma Bridge · JR Tokyo to Kyoto, Osaka, Kobe or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅坐下專注 · 走到仲見世買東西 · 本堂前抽籤 · 穿過雷門 · 吾妻橋過河 · JR 東京站',
    'en-US': 'Tap a bench to focus · visit Nakamise · omikuji at the hall · through Kaminarimon · Azuma Bridge · JR Tokyo',
  },
};
