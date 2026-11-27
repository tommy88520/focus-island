// 廣島 · 宮島的美術：彌山（綠色的山、山頂的花崗岩）、五重塔和千疊閣（小山丘上）、表參道（町家、暖簾、紅葉饅頭的烤模、
// 茶屋的紅毛氈長凳和紅傘、星鰻飯食堂、炭烤牡蠣、巨大的木杓子）、宮島棧橋（白色渡輪開進來、停一下、開走）、
// 御笠濱（石燈籠、松樹、看大鳥居的長椅、宮島的鹿）、嚴島神社（朱紅迴廊蓋在海上、拜殿、平舞台、火燒前的燈籠）、
// 海裡的大鳥居（漲潮時倒影、退潮時露出沙灘可以走過去）。最後組成 CityScene 用的 HIROSHIMA。
import type { CityDef, CityLabel, CityProp, DrawCtx, Rect, Text2 } from './city';
import { FLOORS, HIROSHIMA_SEATS, HIROSHIMA_SHOPS, HS, SHORE_BENCHES, SHORE_BENCH_Y, TEA_BENCHES, TEA_BENCH_Y } from './hiroshima';
import { layerSize, px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, drawBench } from './cityArt';
import { tiledRoof, drawMaple } from './kyotoArt';

const VERMILION = '#d8452c';
const VERMILION_LIGHT = '#ec6a4c';
const VERMILION_DARK = '#a8321f';
const BARK = '#6b584a';
const TILE_ROOF = '#4a4f58';

// ── 潮汐：大約 12 小時 25 分一輪（用時間算，每個人看到的一樣；不是真的潮汐表）──
const TIDE_PERIOD = 12.42 * 3600;
const TIDE_EPOCH = Date.UTC(2026, 0, 1, 3, 0, 0) / 1000;
// 1 = 滿潮、0 = 乾潮
export function tideLevel(): number {
  return 0.5 + 0.5 * Math.cos(((Date.now() / 1000 - TIDE_EPOCH) / TIDE_PERIOD) * Math.PI * 2);
}
// 沙灘露出來多少（0 全是海、1 退到鳥居外面）
function exposure(level = tideLevel()): number {
  return Math.min(1, Math.max(0, (0.6 - level) / 0.48));
}
// 鳥居前的淺灘：嚴島神社和棧橋那邊一直是海
const flatShape = (x: number) => Math.pow(Math.max(0, 1 - ((x - 33) / 12.4) ** 2), 0.3);
// 這個 x 的水邊在哪（格）
export function sandEdge(x: number, e = exposure()): number {
  return HS.sea + e * (17.6 + Math.sin(x * 0.55) * 0.5 + Math.sin(x * 0.21 + 1.3) * 0.7) * flatShape(x);
}

const inRect = (x: number, y: number, r: Rect) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;
function blocked(x: number, y: number): boolean {
  if (y <= HS.sea) return false;
  if (FLOORS.some((f) => inRect(x, y, f))) return false;
  return y > sandEdge(x) - 0.35;
}

// ── 地面（畫一次）：天空、彌山、森林、小山丘、表參道、御笠濱、海 ──
export function paintHiroshimaGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1168);
  const W = HS.W * T;
  const sky = c.createLinearGradient(0, 0, 0, 5 * T);
  sky.addColorStop(0, '#78b6e4');
  sky.addColorStop(1, '#dff0f8');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 6 * T);
  // 遠一點的山（淡）
  c.fillStyle = '#9dbbb0';
  c.beginPath();
  c.moveTo(0, 6 * T);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, 2.6 * T + Math.sin(x * 0.012 + 1) * 10 + Math.sin(x * 0.031) * 4);
  c.lineTo(W, 6 * T);
  c.fill();
  // 彌山：山頂在中間偏東（535 公尺）
  const peak = 33 * T;
  c.fillStyle = '#4f7a4a';
  c.beginPath();
  c.moveTo(0, 15 * T);
  for (let x = 0; x <= W; x += 6) {
    const dist = Math.abs(x - peak) / W;
    c.lineTo(x, 0.9 * T + dist * 7 * T + Math.sin(x * 0.05) * 3 + Math.sin(x * 0.017) * 6);
  }
  c.lineTo(W, 15 * T);
  c.fill();
  // 山上的森林（一團一團）
  for (let i = 0; i < 260; i += 1) {
    const x = rand() * W;
    const top = 0.9 * T + (Math.abs(x - peak) / W) * 7 * T + 8;
    const y = top + rand() * (14.6 * T - top);
    c.fillStyle = ['#3f6a3e', '#4c7a48', '#5a8a52', '#36603a'][Math.floor(rand() * 4)] ?? '#3f6a3e';
    c.beginPath();
    c.arc(x, y, 4 + rand() * 6, 0, Math.PI * 2);
    c.fill();
  }
  // 秋天的楓葉（紅葉谷）點綴
  for (let i = 0; i < 50; i += 1) {
    const x = rand() * W;
    const y = 4 * T + rand() * 8 * T;
    c.fillStyle = rand() < 0.5 ? '#c8502e' : '#e08a3a';
    c.beginPath();
    c.arc(x, y, 2 + rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  // 山頂的花崗岩（巨石）
  for (const [dx, dy, rw, rh] of [[-14, 18, 12, 8], [-2, 14, 14, 10], [12, 19, 10, 7], [4, 24, 8, 6]] as const) {
    c.fillStyle = '#b8b2a6';
    c.beginPath();
    c.ellipse(peak + dx, dy, rw, rh, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#d6d0c4', peak + dx - rw / 2, dy - rh / 2, rw / 2, 2);
  }
  // 西邊的小山丘（五重塔、千疊閣）：草地＋石牆
  c.fillStyle = '#6f9a5a';
  c.beginPath();
  c.moveTo(0, 10.5 * T);
  c.quadraticCurveTo(HS.pagoda.x * T, 9.2 * T, HS.hillX1 * T + 10, 12.5 * T);
  c.lineTo(HS.hillX1 * T, HS.hillLine * T);
  c.lineTo(0, HS.hillLine * T);
  c.fill();
  for (let i = 0; i < 120; i += 1) px(c, rand() < 0.5 ? '#628c4e' : '#80aa68', Math.floor(rand() * HS.hillX1 * T), Math.floor(11 * T + rand() * 5.6 * T), 2, 1);
  // 石牆
  px(c, '#8f897d', 0, (HS.hillLine - 0.7) * T, HS.hillX1 * T, 0.7 * T);
  for (let y = (HS.hillLine - 0.7) * T, row = 0; y < HS.hillLine * T; y += 4, row += 1) {
    px(c, '#77726a', 0, Math.round(y) + 3, HS.hillX1 * T, 1);
    for (let x = (row % 2) * 5; x < HS.hillX1 * T; x += 10) px(c, '#77726a', x, Math.round(y), 1, 3);
  }
  px(c, '#a8a296', 0, (HS.hillLine - 0.7) * T, HS.hillX1 * T, 1);
  // 上五重塔的石階
  const sx = HS.pagoda.x * T;
  px(c, '#b8b2a6', sx - 14, HS.pagoda.line * T, 28, (HS.hillLine - HS.pagoda.line) * T);
  for (let y = HS.pagoda.line * T + 3; y < HS.hillLine * T; y += 4) px(c, '#8f897d', sx - 14, y, 28, 1);
  px(c, '#77726a', sx - 15, HS.pagoda.line * T, 1, (HS.hillLine - HS.pagoda.line) * T);
  px(c, '#77726a', sx + 14, HS.pagoda.line * T, 1, (HS.hillLine - HS.pagoda.line) * T);
  // 表參道：淺色的石板
  const paveTop = (x: number) => (x < HS.hillX1 * T ? HS.hillLine * T : HS.street.line * T);
  for (let x = 0; x < W; x += 16) {
    const top = paveTop(x);
    px(c, '#d4cdbd', x, top, 16, HS.prom * T - top);
  }
  for (let y = HS.street.line * T; y < HS.prom * T; y += 10) {
    for (let x = (Math.floor(y / 10) % 2) * 9; x < W; x += 18) if (y >= paveTop(x)) px(c, '#c2baa8', x, y, 1, 10);
    px(c, '#c2baa8', HS.hillX1 * T, y, W - HS.hillX1 * T, 1);
  }
  for (let y = HS.hillLine * T; y < HS.prom * T; y += 10) px(c, '#c2baa8', 0, y, HS.hillX1 * T, 1);
  // 御笠濱：大塊石板、海堤
  px(c, '#ddd6c6', 0, HS.prom * T, W, (HS.sea - HS.prom) * T);
  for (let y = HS.prom * T; y < HS.sea * T; y += 16) {
    px(c, '#cbc3b1', 0, y, W, 1);
    for (let x = (Math.floor(y / 16) % 2) * 12; x < W; x += 24) px(c, '#cbc3b1', x, y, 1, 16);
  }
  px(c, '#a59d8e', 0, HS.sea * T - 6, W, 6);
  px(c, '#bdb5a5', 0, HS.sea * T - 6, W, 1);
  // 海
  const water = c.createLinearGradient(0, HS.sea * T, 0, HS.H * T);
  water.addColorStop(0, '#5aa6c8');
  water.addColorStop(1, '#2c6f9c');
  c.fillStyle = water;
  c.fillRect(0, HS.sea * T, W, (HS.H - HS.sea) * T);
  px(c, '#7f786c', 0, HS.sea * T, W, 3);
  for (let i = 0; i < 70; i += 1) px(c, 'rgba(255,255,255,0.16)', Math.floor(rand() * W), Math.floor(HS.sea * T + 6 + rand() * (HS.H - HS.sea) * T), 6 + Math.floor(rand() * 8), 1);
}

// ── 海面（每幀）：波光、退潮的沙灘、蓋在海上的木板地 ──
const PUDDLES: [number, number, number][] = [
  [26.5, 29.5, 1.2],
  [37.5, 31.8, 1.6],
  [29, 34, 1],
  [35.5, 38.4, 1.4],
  [24.5, 33, 0.8],
];
function drawSea(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const e = exposure();
  const W = HS.W * T;
  // 波光（沙灘上不畫）
  for (let i = 0; i < 70; i += 1) {
    const y = HS.sea + 0.6 + (((i * 53) % 101) / 101) * (HS.H - HS.sea - 0.8);
    const x = (((i * 137 + d.seconds * (3 + (i % 4))) % (HS.W + 4)) - 2);
    if (y < sandEdge(x, e) + 0.3) continue;
    px(c, `rgba(240,252,255,${0.25 + 0.2 * Math.sin(d.seconds * 1.6 + i)})`, Math.round(x * T), Math.round(y * T), 5 + (i % 3) * 3, 1);
  }
  if (e > 0.005) {
    const x0 = 19.5;
    const x1 = 46;
    const fill = (k: number, color: string) => {
      c.fillStyle = color;
      c.beginPath();
      c.moveTo(x0 * T, HS.sea * T + 3);
      for (let x = x0; x <= x1; x += 0.25) c.lineTo(x * T, (HS.sea + (sandEdge(x, e) - HS.sea) * k) * T + 3);
      c.lineTo(x1 * T, HS.sea * T + 3);
      c.closePath();
      c.fill();
    };
    // 淺水（比較亮的水）→ 濕沙 → 乾沙
    c.fillStyle = 'rgba(150, 210, 220, 0.45)';
    c.beginPath();
    c.moveTo(x0 * T, HS.sea * T + 3);
    for (let x = x0; x <= x1; x += 0.25) c.lineTo(x * T, (sandEdge(x, e) + 0.9 * flatShape(x)) * T);
    c.lineTo(x1 * T, HS.sea * T + 3);
    c.fill();
    fill(1, '#b49a72');
    fill(0.72, '#ccb489');
    fill(0.4, '#dcc79c');
    // 沙上的小石頭、貝殼、海藻
    const rand = seeded(441);
    for (let i = 0; i < 160; i += 1) {
      const x = x0 + rand() * (x1 - x0);
      const y = HS.sea + 0.3 + rand() * 18;
      const col = rand() < 0.6 ? 'rgba(120,96,64,0.5)' : rand() < 0.5 ? '#f2ece0' : '#5a7a4a';
      if (y < sandEdge(x, e) - 0.3) px(c, col, Math.round(x * T), Math.round(y * T), 2, 1);
    }
    // 潮池
    for (const [px0, py, r] of PUDDLES) {
      if (py > sandEdge(px0, e) - 0.8) continue;
      c.fillStyle = '#7fb6c8';
      c.beginPath();
      c.ellipse(px0 * T, py * T, r * T, r * T * 0.4, 0, 0, Math.PI * 2);
      c.fill();
      px(c, 'rgba(255,255,255,0.5)', Math.round(px0 * T - r * 6), Math.round(py * T - 1), Math.round(r * 5), 1);
    }
    // 水邊的白浪（前後推）
    const push = Math.sin(d.seconds * 0.9) * 2;
    for (let x = x0; x < x1; x += 0.375) {
      const f = flatShape(x);
      if (f < 0.05) continue;
      const yy = sandEdge(x, e) * T + push * f + Math.sin(x * 2 + d.seconds) * 1.2;
      px(c, `rgba(255,255,255,${0.75 * f})`, Math.round(x * T), Math.round(yy), 6, 2);
      px(c, `rgba(255,255,255,${0.3 * f})`, Math.round(x * T), Math.round(yy + 4), 6, 1);
    }
  }
  drawFloors(c);
  void W;
}

// 蓋在海上的木板地：迴廊（朱紅的邊）、浮動碼頭（水泥）
function drawFloors(c: CanvasRenderingContext2D): void {
  FLOORS.forEach((f, i) => {
    const jetty = i === FLOORS.length - 1;
    const x = Math.round(f.x0 * T);
    const y = Math.round(Math.max(f.y0, HS.sea) * T);
    const w = Math.round((f.x1 - f.x0) * T);
    const h = Math.round(f.y1 * T) - y;
    // 水面上的影子、柱腳
    px(c, 'rgba(0,30,50,0.3)', x + 2, y + h, w, 5);
    for (let k = x + 3; k < x + w - 2; k += 12) px(c, jetty ? '#6a6e74' : '#4a3424', k, y + h, 2, 6);
    if (jetty) {
      px(c, '#a9adb3', x, y, w, h);
      for (let k = x; k < x + w; k += 16) px(c, '#9a9ea4', k, y, 1, h);
      px(c, '#7a7e84', x, y + h - 3, w, 3);
      for (let k = x + 6; k < x + w; k += 34) px(c, '#3a3d45', k, y + h - 6, 4, 4);
      return;
    }
    px(c, '#c4925f', x, y, w, h);
    const across = w > h;
    if (across) for (let k = x; k < x + w; k += 4) px(c, '#b07e4e', k, y, 1, h);
    else for (let k = y; k < y + h; k += 4) px(c, '#b07e4e', x, k, w, 1);
    px(c, VERMILION_DARK, x, y + h - 3, w, 3);
  });
}

// ── 大鳥居（主角）：朱紅的主柱＋四根袖柱（兩部鳥居）、黑色的笠木、島木、扁額 ──
const TORII_W = 184;
const TORII_H = 136;
function toriiSprite(): HTMLCanvasElement {
  return cached('hs-torii', TORII_W, TORII_H, (c) => {
    const cx = TORII_W / 2;
    const by = TORII_H;
    const pillar = (x: number, top: number, wd: number) => {
      px(c, VERMILION, x, top, wd, by - top);
      px(c, VERMILION_LIGHT, x, top, 2, by - top);
      px(c, VERMILION_DARK, x + wd - 2, top, 2, by - top);
      // 根部：海水泡過的黑色
      px(c, '#2a2422', x, by - 8, wd, 8);
    };
    for (const s of [-1, 1]) {
      const mx = cx + s * 42;
      // 袖柱（前後各一根，畫在兩旁）＋袖貫＋小屋頂
      for (const o of [-13, 13]) {
        pillar(mx + o - 3, by - 58, 6);
        px(c, '#2a201d', mx + o - 6, by - 62, 12, 4);
        px(c, '#4a3a34', mx + o - 6, by - 62, 12, 1);
      }
      px(c, VERMILION, mx - 17, by - 48, 34, 4);
      px(c, VERMILION_DARK, mx - 17, by - 45, 34, 1);
      px(c, VERMILION, mx - 17, by - 24, 34, 3);
    }
    // 主柱
    for (const s of [-1, 1]) pillar(cx + s * 42 - 5, by - 116, 10);
    // 貫（下面的橫木，兩端穿出來）
    px(c, VERMILION, cx - 64, by - 86, 128, 7);
    px(c, VERMILION_LIGHT, cx - 64, by - 86, 128, 1);
    px(c, VERMILION_DARK, cx - 64, by - 80, 128, 1);
    // 島木
    px(c, VERMILION, cx - 74, by - 116, 148, 7);
    px(c, VERMILION_DARK, cx - 74, by - 110, 148, 1);
    // 笠木：黑色、兩端往上翹
    c.fillStyle = '#2a201d';
    c.beginPath();
    c.moveTo(cx - 92, by - 132);
    c.quadraticCurveTo(cx - 66, by - 123, cx - 40, by - 123);
    c.lineTo(cx + 40, by - 123);
    c.quadraticCurveTo(cx + 66, by - 123, cx + 92, by - 132);
    c.lineTo(cx + 88, by - 124);
    c.quadraticCurveTo(cx + 64, by - 116, cx + 40, by - 116);
    c.lineTo(cx - 40, by - 116);
    c.quadraticCurveTo(cx - 64, by - 116, cx - 88, by - 124);
    c.closePath();
    c.fill();
    c.strokeStyle = '#4e3e38';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx - 90, by - 131);
    c.quadraticCurveTo(cx - 66, by - 122.5, cx - 40, by - 122.5);
    c.lineTo(cx + 40, by - 122.5);
    c.quadraticCurveTo(cx + 66, by - 122.5, cx + 90, by - 131);
    c.stroke();
    // 扁額（深藍底金字：嚴島神社）
    px(c, VERMILION, cx - 3, by - 110, 6, 26);
    px(c, '#c9a24a', cx - 10, by - 109, 20, 24);
    px(c, '#1d2433', cx - 8, by - 107, 16, 20);
    ['嚴', '島', '神', '社'].forEach((ch, k) => text(c, ch, cx, by - 104.5 + k * 5, '#e8c56a', `900 4.6px ${SERIF_TC}`));
  });
}
function drawTorii(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = HS.torii.x * T;
  const by = HS.torii.line * T;
  const sprite = toriiSprite();
  const x0 = cx - TORII_W / 2;
  const e = exposure();
  const wet = sandEdge(HS.torii.x, e) < HS.torii.line + 0.2;
  if (wet) {
    // 倒影：一條一條橫的，會晃
    const size = layerSize(sprite);
    const ratio = sprite.width / size.w;
    c.save();
    c.globalAlpha = d.night ? 0.45 : 0.3;
    for (let row = 0; row < TORII_H; row += 2) {
      const wob = Math.round(Math.sin(row * 0.25 + d.seconds * 2) * (1 + row / 60));
      const sy = (TORII_H - row - 2) * ratio;
      c.drawImage(sprite, 0, sy, sprite.width, 2 * ratio, x0 + wob, by + row, TORII_W, 2);
    }
    c.restore();
    // 柱腳的漣漪
    for (const s of [-55, -42, -29, 29, 42, 55]) {
      // s 有負的，% 會留下負號：先 +1 再取餘數，t 才會在 0～1
      const t = (((d.seconds * 0.5 + s * 0.013) % 1) + 1) % 1;
      c.strokeStyle = `rgba(255,255,255,${0.55 * (1 - t)})`;
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(cx + s, by - 1, 5 + t * 8, 1.5 + t * 2.5, 0, 0, Math.PI * 2);
      c.stroke();
    }
  } else {
    // 退潮：沙上的影子、柱腳一圈積水
    c.fillStyle = 'rgba(60,40,20,0.25)';
    c.beginPath();
    c.ellipse(cx + 10, by + 3, TORII_W / 2, 6, 0, 0, Math.PI * 2);
    c.fill();
    for (const s of [-55, -42, -29, 29, 42, 55]) {
      c.fillStyle = 'rgba(120,170,190,0.6)';
      c.beginPath();
      c.ellipse(cx + s, by, 6, 2, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  blit(c, sprite, x0, by);
  if (d.night) {
    glow(c, cx, by - 70, 110, '255, 140, 90', 0.32);
    glow(c, cx - 42, by - 50, 30, '255, 190, 140', 0.35);
    glow(c, cx + 42, by - 50, 30, '255, 190, 140', 0.35);
  }
}

// 漲潮時穿過鳥居的小遊覽船
function drawTideBoat(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (exposure() > 0.25) return;
  const span = HS.W * T + 160;
  const x = ((d.seconds * 10) % span) - 80;
  const by = 40.2 * T + Math.sin(d.seconds * 1.4) * 1;
  c.save();
  c.beginPath();
  c.rect(0, HS.sea * T, HS.W * T, (HS.H - HS.sea) * T);
  c.clip();
  px(c, 'rgba(255,255,255,0.5)', x - 40, by + 1, 16, 1);
  px(c, 'rgba(0,30,50,0.3)', x - 24, by + 1, 50, 3);
  c.fillStyle = '#7a5233';
  c.beginPath();
  c.moveTo(x - 24, by - 8);
  c.lineTo(x + 28, by - 8);
  c.lineTo(x + 20, by);
  c.lineTo(x - 22, by);
  c.fill();
  px(c, '#a8703f', x - 24, by - 8, 52, 2);
  px(c, '#f4efe2', x - 14, by - 18, 28, 10);
  for (let k = -12; k < 12; k += 6) px(c, '#3a4a5a', x + k, by - 16, 4, 4);
  px(c, VERMILION, x - 17, by - 21, 34, 3);
  c.restore();
}

// ── 嚴島神社 ──
// 拜殿（朱紅柱子、白牆、檜皮葺的屋頂、注連繩）＋後面本殿的屋頂
function hallSprite(): HTMLCanvasElement {
  const w = Math.round((HS.hall.x1 - HS.hall.x0) * T);
  const h = 92;
  return cached('hs-hall', w, h, (c) => {
    // 本殿（後面、比較高）
    tiledRoof(c, 22, 6, w - 44, 20, BARK, 6);
    px(c, '#f3ead8', 30, 26, w - 60, 12);
    for (let x = 30; x < w - 30; x += 14) px(c, VERMILION, x, 26, 3, 12);
    // 拜殿
    px(c, '#f3ead8', 6, 48, w - 12, h - 54);
    px(c, VERMILION_DARK, 6, 48, w - 12, 6);
    for (let x = 12; x < w - 12; x += 7) px(c, '#f3ead8', x, 50, 3, 3);
    // 裡面暗暗的、掛著燈籠
    px(c, '#3a2418', 12, 60, w - 24, h - 66);
    px(c, '#5a3a24', 12, h - 10, w - 24, 4);
    px(c, '#c9a24a', w / 2 - 5, 66, 10, 10);
    px(c, '#f4e6b0', w / 2 - 3, 68, 6, 6);
    for (let x = 6; x <= w - 10; x += 19) {
      px(c, VERMILION, x, 48, 4, h - 54);
      px(c, VERMILION_LIGHT, x, 48, 1, h - 54);
    }
    // 注連繩＋紙垂
    c.strokeStyle = '#d9c48a';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(w / 2 - 34, 58);
    c.quadraticCurveTo(w / 2, 66, w / 2 + 34, 58);
    c.stroke();
    for (const dx of [-22, -8, 8, 22]) {
      px(c, '#ffffff', w / 2 + dx - 1, 61 + (Math.abs(dx) < 10 ? 2 : 0), 3, 3);
      px(c, '#ffffff', w / 2 + dx, 64 + (Math.abs(dx) < 10 ? 2 : 0), 3, 3);
    }
    // 拜殿的屋頂（檜皮葺：深褐色、厚厚的）
    tiledRoof(c, 0, 30, w, 20, BARK, 8);
    px(c, '#8a7462', 2, 32, w - 4, 1);
    // 地板
    px(c, '#8a6038', 0, h - 6, w, 6);
    px(c, VERMILION_DARK, 0, h - 6, w, 2);
  });
}

// 前面的迴廊：屋頂、後面一排柱子、掛著的銅燈籠（拜殿前空出來）
const CORRIDOR_LANTERNS = [3.6, 5.6, 7.4, 15.6, 17.4, 19.4];
function drawFrontCorridor(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const by = HS.front.y0 * T;
  const segs: [number, number][] = [
    [HS.westCorridor.x0 - 0.3, HS.haraiden.x0 - 0.1],
    [HS.haraiden.x1 + 0.1, HS.eastCorridor.x1 + 0.3],
  ];
  for (const [a, b] of segs) {
    const x0 = Math.round(a * T);
    const x1 = Math.round(b * T);
    for (let x = x0 + 3; x < x1 - 2; x += 16) {
      px(c, VERMILION, x, by - 26, 3, 26);
      px(c, VERMILION_LIGHT, x, by - 26, 1, 26);
    }
    px(c, VERMILION, x0, by - 28, x1 - x0, 3);
    px(c, VERMILION_DARK, x0, by - 26, x1 - x0, 1);
    // 檜皮葺的屋頂
    px(c, '#3a2a22', x0 - 3, by - 31, x1 - x0 + 6, 3);
    px(c, BARK, x0 - 3, by - 40, x1 - x0 + 6, 10);
    px(c, '#8a7462', x0 - 3, by - 40, x1 - x0 + 6, 1);
    for (let x = x0; x < x1 + 3; x += 3) px(c, 'rgba(255,255,255,0.06)', x, by - 39, 1, 8);
  }
  for (const lx of CORRIDOR_LANTERNS) drawBronzeLantern(c, lx * T, by - 25, d.night);
}
function drawBronzeLantern(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  px(c, '#2a2422', x, y, 1, 3);
  px(c, '#5a4a32', x - 3, y + 3, 7, 2);
  px(c, night ? '#ffd88a' : '#7a6a4a', x - 2, y + 5, 5, 5);
  px(c, '#5a4a32', x - 2, y + 7, 5, 1);
  px(c, '#5a4a32', x - 3, y + 10, 7, 1);
  if (night) glow(c, x, y + 7, 12, '255, 200, 120', 0.55);
}

// 左右兩條通到岸上的迴廊：一排排朱紅柱子＋橫樑＋薄薄的屋頂
const SIDE_ROWS = [24.6, 26.2, 27.8, 29.4];
function drawSideCorridorRow(c: CanvasRenderingContext2D, x0t: number, x1t: number, y: number): void {
  const x0 = Math.round(x0t * T);
  const x1 = Math.round(x1t * T);
  const by = Math.round(y * T);
  for (const x of [x0, x1 - 3]) {
    px(c, VERMILION, x, by - 26, 3, 26);
    px(c, VERMILION_LIGHT, x, by - 26, 1, 26);
  }
  px(c, VERMILION, x0 - 1, by - 28, x1 - x0 + 2, 3);
  px(c, VERMILION_DARK, x0 - 1, by - 26, x1 - x0 + 2, 1);
  px(c, '#3a2a22', x0 - 3, by - 31, x1 - x0 + 6, 3);
  // 兩邊低低的欄杆
  px(c, VERMILION, x0, by - 8, 2, 8);
  px(c, VERMILION, x1 - 2, by - 8, 2, 8);
}
// 側邊欄杆（直的，畫在地板兩側）
function drawSideRails(c: CanvasRenderingContext2D, x0t: number, x1t: number): void {
  const y0 = Math.round(HS.sea * T);
  const y1 = Math.round(HS.front.y0 * T);
  for (const x of [Math.round(x0t * T), Math.round(x1t * T) - 2]) {
    px(c, VERMILION, x, y0, 2, y1 - y0);
    px(c, VERMILION_DARK, x + 1, y0, 1, y1 - y0);
  }
}

// 前迴廊外側的矮欄杆（平舞台的地方空出來）、平舞台的欄杆、火燒前的燈籠
function drawFrontRail(c: CanvasRenderingContext2D): void {
  const by = HS.front.y1 * T;
  const rail = (a: number, b: number, y: number) => {
    const x0 = Math.round(a * T);
    const x1 = Math.round(b * T);
    px(c, VERMILION, x0, y - 8, x1 - x0, 2);
    px(c, VERMILION, x0, y - 4, x1 - x0, 1);
    for (let x = x0; x <= x1 - 2; x += 8) px(c, VERMILION_DARK, x, y - 8, 2, 8);
  };
  rail(HS.westCorridor.x0, HS.stage.x0, by);
  rail(HS.stage.x1, HS.eastCorridor.x1, by);
  // 兩邊的外牆欄杆（直的）
  for (const x of [HS.westCorridor.x0 * T, HS.eastCorridor.x1 * T - 2]) px(c, VERMILION, Math.round(x), HS.front.y0 * T, 2, 2 * T);
}
function drawStageRail(c: CanvasRenderingContext2D): void {
  const y0 = HS.front.y1 * T;
  const y1 = HS.stage.y1 * T;
  for (const x of [HS.stage.x0 * T, HS.stage.x1 * T - 2]) {
    px(c, VERMILION, Math.round(x), y0, 2, y1 - y0);
    for (let y = y0; y < y1; y += 8) px(c, VERMILION_DARK, Math.round(x), y, 2, 2);
  }
  const x0 = Math.round(HS.stage.x0 * T);
  const x1 = Math.round(HS.stage.x1 * T);
  px(c, VERMILION, x0, y1 - 8, Math.round(HS.tip.x0 * T) - x0, 2);
  px(c, VERMILION, Math.round(HS.tip.x1 * T), y1 - 8, x1 - Math.round(HS.tip.x1 * T), 2);
}
// 高舞台（舞樂的舞台：朱紅欄杆、黑漆的台）
function drawTakabutai(c: CanvasRenderingContext2D): void {
  const cx = Math.round(((HS.stage.x0 + HS.stage.x1) / 2) * T);
  const by = Math.round(33.8 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 15, by, 30, 3);
  px(c, '#2a201d', cx - 14, by - 6, 28, 6);
  px(c, '#c4925f', cx - 14, by - 10, 28, 4);
  px(c, VERMILION, cx - 15, by - 16, 30, 2);
  for (let x = cx - 15; x <= cx + 13; x += 7) px(c, VERMILION, x, by - 16, 2, 6);
  px(c, VERMILION, cx - 4, by - 4, 8, 4);
}
// 火燒前的銅燈籠（平舞台最前面）
function drawTipLantern(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(((HS.tip.x0 + HS.tip.x1) / 2) * T);
  const by = Math.round((HS.tip.y1 - 0.3) * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by, 12, 2);
  px(c, '#4a4234', cx - 5, by - 3, 10, 3);
  px(c, '#5a5040', cx - 1, by - 16, 3, 13);
  px(c, '#6a5e48', cx - 5, by - 24, 11, 8);
  px(c, d.night ? '#ffd88a' : '#3a3428', cx - 3, by - 22, 6, 4);
  px(c, '#4a4234', cx - 7, by - 27, 15, 3);
  px(c, '#4a4234', cx - 1, by - 30, 3, 3);
  if (d.night) glow(c, cx, by - 20, 18, '255, 200, 120', 0.6);
}

// ── 五重塔（1407 年）、千疊閣（豐國神社）──
function pagodaSprite(): HTMLCanvasElement {
  const w = 72;
  const h = 150;
  return cached('hs-pagoda', w, h, (c) => {
    const cx = w / 2;
    px(c, '#9a948a', cx - 22, h - 6, 44, 6);
    px(c, '#b5ad9f', cx - 22, h - 6, 44, 1);
    let y = h - 6;
    for (let k = 0; k < 5; k += 1) {
      const bw = 26 - k * 2;
      const bh = 12;
      y -= bh;
      px(c, VERMILION, cx - bw / 2, y, bw, bh);
      px(c, '#f4efe2', cx - bw / 2 + 3, y + 3, 4, bh - 4);
      px(c, '#f4efe2', cx + bw / 2 - 7, y + 3, 4, bh - 4);
      px(c, k === 0 ? '#3a2418' : VERMILION_DARK, cx - 3, y + 3, 6, bh - 3);
      px(c, '#f4efe2', cx - bw / 2, y, bw, 2);
      const rw = 58 - k * 5;
      y -= 8;
      tiledRoof(c, cx - rw / 2, y, rw, 9, '#4e4038', 4);
    }
    // 相輪（九輪）＋寶珠
    px(c, '#8a6a32', cx - 1, y - 30, 3, 31);
    for (let k = 0; k < 9; k += 1) px(c, '#b8923a', cx - 4, y - 6 - k * 2.6, 9, 1);
    px(c, '#b8923a', cx - 3, y - 4, 7, 4);
    px(c, '#c9a24a', cx - 2, y - 34, 5, 5);
  });
}
function senjokakuSprite(): HTMLCanvasElement {
  const w = Math.round((HS.senjokaku.x1 - HS.senjokaku.x0) * T);
  const h = 64;
  return cached('hs-senjokaku', w, h, (c) => {
    px(c, '#9a948a', 0, h - 6, w, 6);
    px(c, '#5a3e28', 4, 30, w - 8, h - 38);
    px(c, '#2a1e16', 6, 34, w - 12, h - 42);
    for (let x = 4; x < w - 4; x += 10) {
      px(c, '#9a7650', x, 30, 3, h - 36);
      px(c, '#b8926a', x, 30, 1, h - 36);
    }
    px(c, '#8a6a48', 2, h - 10, w - 4, 4);
    tiledRoof(c, 2, 6, w - 4, 26, TILE_ROOF, 6);
  });
}

// ── 表參道的町家：格子窗、瓦屋頂、暖簾、招牌 ──
type MachiyaKind = 'momiji' | 'tea' | 'anago' | 'oyster';
const MACHIYA: Record<MachiyaKind, { sign: string; noren: string; mark: string; markColor: string }> = {
  momiji: { sign: '紅葉堂', noren: '#b8322a', mark: '紅葉', markColor: '#ffffff' },
  tea: { sign: '茶屋', noren: '#2f5d3a', mark: '茶', markColor: '#ffffff' },
  anago: { sign: 'あなごめし', noren: '#1f2a44', mark: 'あなご', markColor: '#ffffff' },
  oyster: { sign: '焼がき', noren: '#f2ece0', mark: 'かき', markColor: '#1f2a44' },
};
function machiyaSprite(kind: MachiyaKind, w: number): HTMLCanvasElement {
  const h = 84;
  return cached(`hs-machiya-${kind}`, w, h, (c) => {
    const m = MACHIYA[kind];
    const rand = seeded(kind.length * 31 + w);
    // 二樓：白牆、蟲籠窗（直的細格子）
    px(c, '#ece3cf', 4, 20, w - 8, 28);
    for (let x = 10; x + 16 < w - 6; x += 26) {
      px(c, '#3a2a1e', x, 24, 16, 10);
      for (let k = 1; k < 16; k += 3) px(c, '#ece3cf', x + k, 25, 1, 8);
    }
    // 招牌（木板、黑字）
    const sw = Math.min(w - 16, m.sign.length * 9 + 10);
    px(c, '#3a2a1e', w / 2 - sw / 2 - 1, 35, sw + 2, 12);
    px(c, '#d9b27a', w / 2 - sw / 2, 36, sw, 10);
    text(c, m.sign, w / 2, 41.5, '#2a1a14', `900 8px ${SERIF_TC}`);
    // 屋頂、一樓的屋簷
    tiledRoof(c, 3, 6, w - 6, 15, TILE_ROOF, 4);
    // 一樓：木頭的門面、裡面亮著
    px(c, '#7a5233', 0, 52, w, h - 52);
    px(c, '#3a281c', 6, 58, w - 12, h - 58);
    px(c, 'rgba(255,214,150,0.35)', 6, h - 10, w - 12, 10);
    for (const x of [0, w - 5]) px(c, '#5a3a24', x, 50, 5, h - 50);
    tiledRoof(c, 0, 45, w, 9, TILE_ROOF, 3);
    // 店裡的東西
    if (kind === 'momiji') {
      // 烤模機（鐵板上一排紅葉形狀）＋盒裝伴手禮
      px(c, '#2a2d33', 10, h - 18, 26, 10);
      px(c, '#4a4f58', 10, h - 18, 26, 2);
      for (let x = 13; x < 34; x += 6) drawLeaf(c, x, h - 13, '#d9a04a');
      for (let x = w - 30; x < w - 10; x += 7) {
        px(c, rand() < 0.5 ? '#c8402a' : '#e07a2a', x, h - 16, 6, 8);
        px(c, '#f4efe2', x + 1, h - 13, 4, 1);
      }
    } else if (kind === 'tea') {
      for (let x = 12; x < w - 12; x += 8) {
        px(c, '#2f5d3a', x, h - 20, 5, 7);
        px(c, '#c9a24a', x, h - 18, 5, 1);
      }
      px(c, '#9a7650', 10, h - 12, w - 20, 2);
    } else if (kind === 'anago') {
      // 食物模型的櫥窗
      px(c, '#f4f6f8', 10, h - 20, 30, 14);
      px(c, '#cfd8e0', 10, h - 20, 30, 1);
      for (let x = 13; x < 38; x += 9) {
        px(c, '#2a1a14', x, h - 14, 7, 5);
        px(c, '#a8643a', x + 1, h - 15, 5, 2);
      }
    } else {
      // 裝牡蠣的竹簍、水槽
      px(c, '#9fc7d9', w - 34, h - 18, 24, 10);
      px(c, '#7aa8be', w - 34, h - 18, 24, 2);
      for (let x = 10; x < 34; x += 8) {
        px(c, '#c9a873', x, h - 14, 7, 6);
        px(c, '#8f897d', x + 1, h - 15, 5, 2);
      }
    }
    // 暖簾（分成幾片，中間印字）
    const nw = Math.min(w - 20, 44);
    const nx = w / 2 - nw / 2;
    px(c, m.noren, nx, 54, nw, 13);
    for (let x = nx + 11; x < nx + nw - 2; x += 11) px(c, 'rgba(0,0,0,0.35)', x, 57, 1, 10);
    px(c, '#3a2a1e', nx - 2, 53, nw + 4, 2);
    text(c, m.mark, w / 2, 61, m.markColor, `900 ${m.mark.length > 2 ? 6 : 7}px ${SERIF_TC}`);
  });
}
function drawLeaf(c: CanvasRenderingContext2D, x: number, y: number, col: string): void {
  px(c, col, x - 1, y - 2, 3, 4);
  px(c, col, x - 2, y - 1, 5, 2);
  px(c, col, x, y - 3, 1, 1);
  px(c, col, x - 3, y - 2, 1, 1);
  px(c, col, x + 2, y - 2, 1, 1);
}
function drawMachiya(c: CanvasRenderingContext2D, kind: MachiyaKind, r: { x0: number; x1: number }, d: DrawCtx): void {
  const w = Math.round((r.x1 - r.x0) * T);
  const x0 = Math.round(r.x0 * T);
  const by = Math.round(HS.street.line * T);
  blit(c, machiyaSprite(kind, w), x0, by);
  px(c, 'rgba(0,0,0,0.15)', x0, by, w, 2);
  // 提燈（晚上亮）
  for (const x of [x0 + 7, x0 + w - 7]) {
    px(c, '#2a1a14', x - 1, by - 34, 2, 2);
    c.fillStyle = kind === 'tea' ? '#d8382a' : '#f2e6c8';
    c.beginPath();
    c.ellipse(x, by - 27, 3.5, 5, 0, 0, Math.PI * 2);
    c.fill();
    px(c, '#2a1a14', x - 3, by - 32, 6, 1);
    px(c, '#2a1a14', x - 3, by - 22, 6, 1);
    if (d.night) glow(c, x, by - 27, 14, '255, 200, 120', 0.5);
  }
  // 紅葉饅頭剛烤好冒煙
  if (kind === 'momiji') {
    for (let k = 0; k < 3; k += 1) {
      const t = (d.seconds * 0.5 + k / 3) % 1;
      px(c, `rgba(255,255,255,${0.45 * (1 - t)})`, Math.round(x0 + 16 + k * 6 + Math.sin(d.seconds * 2 + k) * 2), Math.round(by - 20 - t * 14), 3, 2);
    }
  }
}

// 炭烤牡蠣的攤子（店門口的炭爐）＋老闆
function drawOysterGrill(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = Math.round(((HS.oyster.x0 + HS.oyster.x1) / 2) * T);
  const by = Math.round(HS.grillY * T);
  const owner = getAvatarFrame(lookColors(2, 5, { body: 1 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - owner.width / 2), by - 8 - owner.height + 2);
  px(c, 'rgba(0,0,0,0.22)', cx - 30, by, 60, 3);
  // 木頭的台子、鐵網、炭火
  px(c, '#7a5233', cx - 30, by - 10, 60, 10);
  px(c, '#9a7650', cx - 30, by - 10, 60, 1);
  px(c, '#2a2d33', cx - 28, by - 13, 56, 4);
  const ember = d.night ? '#ff8a3a' : '#e0602a';
  for (let x = cx - 26; x < cx + 26; x += 5) px(c, (x + Math.floor(d.seconds * 4)) % 3 ? ember : '#ffb85a', x, by - 11, 3, 1);
  // 牡蠣（殼開開的）
  for (let x = cx - 24; x < cx + 22; x += 8) {
    px(c, '#9a948a', x, by - 16, 7, 3);
    px(c, '#e8e2d4', x + 1, by - 16, 5, 1);
    px(c, '#c9a873', x + 2, by - 15, 3, 1);
  }
  px(c, '#f4efe2', cx - 30, by - 8, 26, 6);
  text(c, '焼がき', cx - 17, by - 5, '#1f2a44', `900 5px ${FONT_TC}`);
  for (let k = 0; k < 4; k += 1) {
    const t = (d.seconds * 0.45 + k / 4) % 1;
    px(c, `rgba(240,240,240,${0.5 * (1 - t)})`, Math.round(cx - 18 + k * 11 + Math.sin(d.seconds * 1.7 + k) * 3), Math.round(by - 20 - t * 18), 4, 3);
  }
  if (d.night) glow(c, cx, by - 12, 30, '255, 140, 60', 0.4);
}

// 巨大的木杓子（大杓子）：躺在木架上
function drawShamoji(c: CanvasRenderingContext2D): void {
  const x0 = Math.round(HS.shamoji.x0 * T);
  const x1 = Math.round(HS.shamoji.x1 * T);
  const by = Math.round(HS.shamoji.y * T);
  px(c, 'rgba(0,0,0,0.22)', x0, by - 1, x1 - x0, 3);
  // 木架
  for (const x of [x0 + 16, x0 + 50, x1 - 14]) {
    px(c, '#5a3a24', x - 6, by - 12, 12, 3);
    px(c, '#5a3a24', x - 5, by - 10, 2, 10);
    px(c, '#5a3a24', x + 3, by - 10, 2, 10);
  }
  // 杓子頭＋柄（欅木）
  const hy = by - 19;
  c.fillStyle = '#b88a52';
  c.beginPath();
  c.ellipse(x0 + 20, hy, 21, 11, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#e0bb82';
  c.beginPath();
  c.ellipse(x0 + 20, hy - 1, 19, 9, 0, 0, Math.PI * 2);
  c.fill();
  px(c, '#b88a52', x0 + 38, hy - 4, x1 - x0 - 42, 8);
  px(c, '#e0bb82', x0 + 38, hy - 4, x1 - x0 - 42, 6);
  px(c, '#e0bb82', x1 - 6, hy - 5, 4, 9);
  for (let x = x0 + 42; x < x1 - 8; x += 9) px(c, 'rgba(140,100,60,0.4)', x, hy - 2, 6, 1);
  text(c, '必勝', x0 + 20, hy - 1, '#5a3a24', `900 8px ${SERIF_TC}`);
  // 說明牌
  px(c, '#3a2a1e', x1 - 26, by - 9, 20, 8);
  text(c, '大杓子', x1 - 16, by - 5, '#f4efe2', `900 4.5px ${FONT_TC}`);
}

// ── 宮島棧橋（JR 渡輪的碼頭）──
function pierSprite(): HTMLCanvasElement {
  const w = Math.round((HS.pier.x1 - HS.pier.x0) * T);
  const h = 76;
  return cached('hs-pier', w, h, (c) => {
    px(c, '#9a948a', 0, h - 4, w, 4);
    // 木格柵的外牆＋玻璃
    px(c, '#e8e2d4', 4, 26, w - 8, h - 30);
    for (let x = 8; x < w - 8; x += 4) px(c, '#a07a50', x, 28, 2, 18);
    px(c, '#3f5a72', 10, 48, w - 20, h - 52);
    for (let x = 14; x < w - 14; x += 12) px(c, '#9fd0e8', x, 50, 9, h - 56);
    px(c, '#2a3a4a', w / 2 - 14, h - 22, 28, 18);
    px(c, '#9fd8ff', w / 2 - 12, h - 20, 11, 16);
    px(c, '#9fd8ff', w / 2 + 1, h - 20, 11, 16);
    // 深深的屋簷
    c.fillStyle = '#3d424a';
    c.beginPath();
    c.moveTo(-2, 28);
    c.lineTo(14, 6);
    c.lineTo(w - 14, 6);
    c.lineTo(w + 2, 28);
    c.closePath();
    c.fill();
    px(c, '#565c66', 14, 6, w - 28, 2);
    px(c, '#2a2d33', -2, 26, w + 4, 3);
    // 站名
    px(c, '#f4f6f8', w / 2 - 54, 34, 108, 12);
    px(c, '#1f4e9c', w / 2 - 54, 34, 3, 12);
    text(c, '宮島桟橋  MIYAJIMA PIER', w / 2 + 2, 40, '#1f2a44', `900 6.5px ${FONT_TC}`);
  });
}

// 白色的渡輪：開進來、停一下、開走（用時間算）
function drawFerry(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cycle = 64;
  const t = d.seconds % cycle;
  const dock = 50 * T;
  const away = HS.W * T + 90;
  let x: number;
  let dir: 1 | -1;
  let moving = true;
  if (t < 14) {
    const p = t / 14;
    x = away + (dock - away) * (1 - (1 - p) * (1 - p));
    dir = -1;
  } else if (t < 40) {
    x = dock;
    dir = -1;
    moving = false;
  } else if (t < 54) {
    const p = (t - 40) / 14;
    x = dock + (away - dock) * p * p;
    dir = 1;
  } else return;
  const by = Math.round(HS.ferryLine * T + Math.sin(d.seconds * 1.3));
  c.save();
  c.beginPath();
  c.rect(0, HS.sea * T, HS.W * T, (HS.H - HS.sea) * T);
  c.clip();
  // 航跡
  if (moving) for (let k = 0; k < 5; k += 1) px(c, `rgba(255,255,255,${0.6 - k * 0.1})`, Math.round(x - dir * (64 + k * 10)), by - 2 + (k % 2), 10, 2);
  px(c, 'rgba(0,30,50,0.3)', Math.round(x - 60), by, 120, 4);
  // 船身（船頭朝 dir）
  const bow = x + dir * 62;
  const stern = x - dir * 58;
  c.fillStyle = '#f4f6f8';
  c.beginPath();
  c.moveTo(stern, by - 16);
  c.lineTo(bow, by - 16);
  c.lineTo(bow - dir * 10, by);
  c.lineTo(stern, by);
  c.closePath();
  c.fill();
  c.fillStyle = '#1f3a5f';
  c.beginPath();
  c.moveTo(stern, by - 5);
  c.lineTo(bow - dir * 7, by - 5);
  c.lineTo(bow - dir * 10, by);
  c.lineTo(stern, by);
  c.closePath();
  c.fill();
  px(c, '#d8402a', Math.round(Math.min(stern, bow - dir * 6)), by - 9, Math.round(Math.abs(bow - dir * 6 - stern)), 2);
  // 客艙（兩層）＋駕駛台
  const cab0 = Math.round(x - 44);
  px(c, '#f4f6f8', cab0, by - 28, 86, 12);
  px(c, '#d6dae2', cab0, by - 28, 86, 1);
  for (let k = cab0 + 4; k < cab0 + 82; k += 8) px(c, '#2f4a66', k, by - 25, 6, 5);
  const top0 = Math.round(x - 20 + dir * 10);
  px(c, '#f4f6f8', top0, by - 38, 40, 10);
  px(c, '#2f4a66', top0 + 3, by - 36, 34, 4);
  px(c, '#1f3a5f', top0 + (dir > 0 ? 30 : 4), by - 46, 6, 8);
  px(c, '#9aa0a8', Math.round(x - dir * 6), by - 52, 1, 14);
  c.restore();
}

// ── 御笠濱：石燈籠、松樹、宮島的鹿 ──
function drawShoreLantern(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 7, by - 1, 14, 3);
  px(c, '#8f897d', cx - 6, by - 4, 12, 4);
  px(c, '#a59d8e', cx - 4, by - 7, 8, 3);
  px(c, '#9a948a', cx - 2, by - 20, 5, 13);
  px(c, '#b5ad9f', cx - 2, by - 20, 1, 13);
  px(c, '#a59d8e', cx - 5, by - 22, 11, 2);
  px(c, '#b5ad9f', cx - 4, by - 30, 9, 8);
  px(c, night ? '#ffe08a' : '#4a463e', cx - 2, by - 28, 5, 4);
  c.fillStyle = '#8f897d';
  c.beginPath();
  c.moveTo(cx - 8, by - 29);
  c.quadraticCurveTo(cx, by - 33, cx + 8, by - 29);
  c.lineTo(cx + 5, by - 35);
  c.lineTo(cx - 5, by - 35);
  c.closePath();
  c.fill();
  px(c, '#a59d8e', cx - 1, by - 38, 3, 3);
  if (night) glow(c, cx, by - 26, 16, '255, 210, 130', 0.55);
}
// 黑松（枝往海那邊伸）
function drawPine(c: CanvasRenderingContext2D, x: number, y: number, lean: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 10, by - 1, 20, 3);
  for (let k = 0; k < 30; k += 2) px(c, k % 4 ? '#6a4a32' : '#5a3d28', Math.round(cx - 2 + (k / 30) * lean * 10), by - k - 2, 4, 3);
  const top = by - 32;
  const tx = cx + lean * 10;
  for (const [dx, dy, rw] of [[-10, 8, 11], [9, 4, 12], [0, -2, 10], [-4, 14, 8], [14, 12, 8]] as const) {
    c.fillStyle = '#2f5a34';
    c.beginPath();
    c.ellipse(tx + dx, top + dy, rw, 4.5, 0, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = '#41744a';
    c.beginPath();
    c.ellipse(tx + dx, top + dy - 1.5, rw - 3, 2.5, 0, 0, Math.PI * 2);
    c.fill();
  }
}

// 宮島的鹿：走一走、停下來低頭吃草（用時間算）
interface DeerLane {
  x0: number;
  x1: number;
  y: number;
  phase: number;
  buck: boolean;
}
const DEER: DeerLane[] = [
  { x0: 6.5, x1: 14.5, y: 21, phase: 0, buck: true },
  { x0: 23.5, x1: 26.5, y: 19, phase: 17, buck: false },
  { x0: 15.5, x1: 20, y: 16.6, phase: 29, buck: false },
];
function drawDeer(c: CanvasRenderingContext2D, lane: DeerLane, seconds: number): void {
  const u = (seconds + lane.phase) % 40;
  let k: number;
  let dir: 1 | -1;
  let grazing = false;
  if (u < 10) {
    k = u / 10;
    dir = 1;
  } else if (u < 20) {
    k = 1;
    dir = 1;
    grazing = true;
  } else if (u < 30) {
    k = 1 - (u - 20) / 10;
    dir = -1;
  } else {
    k = 0;
    dir = -1;
    grazing = true;
  }
  const cx = Math.round((lane.x0 + (lane.x1 - lane.x0) * k) * T);
  const by = Math.round(lane.y * T);
  const step = grazing ? 0 : Math.floor(seconds * 6) % 2;
  const body = '#a8703f';
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 16, 2);
  for (const [lx, alt] of [[-5, 0], [-3, 1], [3, 0], [5, 1]] as const) px(c, '#6a4428', cx + lx * dir, by - 7 + (alt === step ? 1 : 0), 1, 7 - (alt === step ? 1 : 0));
  px(c, body, cx - 7, by - 12, 14, 6);
  px(c, '#d9b48a', cx - 6, by - 7, 12, 1);
  px(c, '#f4efe2', cx - 7 * dir - (dir > 0 ? 0 : 2), by - 12, 3, 4);
  for (const sx of [-3, 0, 3]) px(c, '#e8d2b0', cx + sx * dir, by - 11, 1, 1);
  // 脖子、頭
  const hx = cx + dir * 7;
  if (grazing) {
    px(c, body, hx - (dir > 0 ? 0 : 3), by - 10, 3, 6);
    px(c, body, hx + (dir > 0 ? 1 : -5), by - 5, 4, 4);
  } else {
    px(c, body, hx - (dir > 0 ? 1 : 2), by - 17, 3, 7);
    px(c, body, hx + (dir > 0 ? 0 : -4), by - 19, 5, 4);
    px(c, '#2a1a14', hx + (dir > 0 ? 4 : -4), by - 18, 1, 1);
    px(c, body, hx - dir * 2, by - 21, 1, 2);
    if (lane.buck) {
      px(c, '#d9c4a0', hx, by - 25, 1, 6);
      px(c, '#d9c4a0', hx - dir * 2, by - 24, 1, 2);
      px(c, '#d9c4a0', hx + dir, by - 26, 1, 2);
    }
  }
}

// 座位的家具：茶屋的紅毛氈長凳（緋毛氈）、迴廊上的坐墊
function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = HIROSHIMA_SEATS[i];
  if (!s) return;
  if (i >= 4 && i < 8) {
    if (i % 2 === 1) return;
    const cx = Math.round((s.x + 0.6) * T);
    const by = Math.round(s.y * T);
    px(c, 'rgba(0,0,0,0.2)', cx - 19, by + 1, 38, 3);
    px(c, '#6b4428', cx - 17, by - 2, 2, 4);
    px(c, '#6b4428', cx + 15, by - 2, 2, 4);
    px(c, '#c8302a', cx - 19, by - 6, 38, 5);
    px(c, '#e04a3a', cx - 19, by - 6, 38, 1);
    px(c, '#a8241f', cx - 19, by - 2, 38, 1);
  } else if (i >= 8) {
    const cx = Math.round(s.x * T);
    const by = Math.round(s.y * T);
    px(c, '#6a2a4a', cx - 6, by - 4, 12, 5);
    px(c, '#8a3a62', cx - 6, by - 4, 12, 1);
  }
}
// 茶屋的紅傘（野點傘）
function drawUmbrella(c: CanvasRenderingContext2D, x: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(TEA_BENCH_Y * T);
  px(c, '#6b4428', cx - 1, by - 46, 2, 46);
  c.fillStyle = '#d23a2a';
  c.beginPath();
  c.moveTo(cx - 27, by - 38);
  c.quadraticCurveTo(cx, by - 58, cx + 27, by - 38);
  c.closePath();
  c.fill();
  c.strokeStyle = 'rgba(0,0,0,0.25)';
  c.lineWidth = 1;
  for (let k = -2; k <= 2; k += 1) {
    c.beginPath();
    c.moveTo(cx, by - 51);
    c.lineTo(cx + k * 12, by - 38);
    c.stroke();
  }
  px(c, '#2a1a14', cx - 1, by - 53, 2, 3);
}

const SHORE_LANTERNS = [5.5, 9.4, 13.4, 17.2, 23.6, 30.2, 33.8, 40.6, 43.8];
const LANTERN_Y = 23.1;
const PINES: [number, number, number][] = [
  [0.9, 19.4, 0.6],
  [21.6, 22.9, 0.8],
  [44.6, 22.6, -0.4],
  [3.6, 16.9, 0.3],
  [19.6, 16.2, -0.3],
];
const MAPLES: [number, number][] = [
  [15.6, 15],
  [9.2, 16.2],
  [17.6, 13.2],
  [1.2, 14.6],
];

const midX = (r: { x0: number; x1: number }) => (r.x0 + r.x1) / 2;
const props: CityProp[] = [
  { y: -10, draw: (c, d) => drawSea(c, d) },
  { y: HS.senjokaku.line, draw: (c) => blit(c, senjokakuSprite(), HS.senjokaku.x0 * T, HS.senjokaku.line * T) },
  { y: HS.pagoda.line, draw: (c) => blit(c, pagodaSprite(), HS.pagoda.x * T - 36, HS.pagoda.line * T) },
  ...MAPLES.map(([x, y]): CityProp => ({ y, draw: (c) => drawMaple(c, x, y) })),
  ...PINES.map(([x, y, lean]): CityProp => ({ y, draw: (c) => drawPine(c, x, y, lean) })),
  { y: HS.street.line, draw: (c, d) => drawMachiya(c, 'momiji', HS.momiji, d) },
  { y: HS.street.line, draw: (c, d) => drawMachiya(c, 'tea', HS.tea, d) },
  { y: HS.street.line, draw: (c, d) => drawMachiya(c, 'anago', HS.anago, d) },
  { y: HS.street.line, draw: (c, d) => drawMachiya(c, 'oyster', HS.oyster, d) },
  { y: HS.grillY, draw: (c, d) => drawOysterGrill(c, d) },
  ...TEA_BENCHES.map((x): CityProp => ({ y: TEA_BENCH_Y - 0.5, draw: (c) => drawUmbrella(c, x) })),
  { y: HS.shamoji.y, draw: (c) => drawShamoji(c) },
  { y: HS.pier.line, draw: (c) => blit(c, pierSprite(), HS.pier.x0 * T, HS.pier.line * T) },
  { y: HS.ferryLine, draw: (c, d) => drawFerry(c, d) },
  ...SHORE_BENCHES.map((x): CityProp => ({ y: SHORE_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, SHORE_BENCH_Y, 2.6) })),
  ...SHORE_LANTERNS.map((x): CityProp => ({ y: LANTERN_Y, draw: (c, d) => drawShoreLantern(c, x, LANTERN_Y, d.night) })),
  ...DEER.map((lane): CityProp => ({ y: lane.y, draw: (c, d) => drawDeer(c, lane, d.seconds) })),
  // 嚴島神社
  { y: HS.sea, draw: (c) => drawSideRails(c, HS.westCorridor.x0, HS.westCorridor.x1) },
  { y: HS.sea, draw: (c) => drawSideRails(c, HS.eastCorridor.x0, HS.eastCorridor.x1) },
  ...SIDE_ROWS.flatMap((y): CityProp[] => [
    { y, draw: (c) => drawSideCorridorRow(c, HS.westCorridor.x0, HS.westCorridor.x1, y) },
    { y, draw: (c) => drawSideCorridorRow(c, HS.eastCorridor.x0, HS.eastCorridor.x1, y) },
  ]),
  { y: HS.hall.line, draw: (c) => blit(c, hallSprite(), HS.hall.x0 * T, HS.hall.line * T) },
  { y: HS.front.y0, draw: (c, d) => drawFrontCorridor(c, d) },
  { y: HS.front.y1, draw: (c) => drawFrontRail(c) },
  { y: 33.8, draw: (c) => drawTakabutai(c) },
  { y: HS.stage.y1, draw: (c) => drawStageRail(c) },
  { y: HS.tip.y1 - 0.3, draw: (c, d) => drawTipLantern(c, d) },
  { y: HS.torii.line, draw: (c, d) => drawTorii(c, d) },
  { y: 40.2, draw: (c, d) => drawTideBoat(c, d) },
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, HS.W, 12),
  r(0, 0, HS.hillX1, HS.hillLine),
  r(HS.street.x0 - 0.1, 0, HS.street.x1, HS.street.line + 0.05),
  r(HS.pier.x0, 0, HS.W, HS.pier.line - 0.05),
  r(HS.oyster.x0 + 0.5, HS.grillY - 0.7, HS.oyster.x1 - 0.5, HS.grillY - 0.05),
  ...TEA_BENCHES.map((x) => r(x - 0.3, TEA_BENCH_Y - 0.3, x + 0.3, TEA_BENCH_Y + 0.1)),
  r(HS.shamoji.x0, HS.shamoji.y - 0.7, HS.shamoji.x1, HS.shamoji.y),
  ...SHORE_BENCHES.map((x) => r(x - 1.3, SHORE_BENCH_Y - 0.75, x + 1.3, SHORE_BENCH_Y - 0.45)),
  ...SHORE_LANTERNS.map((x) => r(x - 0.35, LANTERN_Y - 0.4, x + 0.35, LANTERN_Y + 0.05)),
  ...PINES.filter(([, y]) => y > HS.hillLine).map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  r(10.6, 33.2, 12.4, 33.85),
  r(11.2, HS.tip.y1 - 0.7, 11.8, HS.tip.y1 - 0.2),
  // 大鳥居的柱子（退潮時走得到）
  r(HS.torii.x - 3.6, HS.torii.line - 0.4, HS.torii.x - 1.6, HS.torii.line + 0.05),
  r(HS.torii.x + 1.6, HS.torii.line - 0.4, HS.torii.x + 3.6, HS.torii.line + 0.05),
];

const lights: CityDef['lights'] = [
  ...SHORE_LANTERNS.map((x) => ({ x: x * T, y: LANTERN_Y * T - 26, r: 30 })),
  ...CORRIDOR_LANTERNS.map((x) => ({ x: x * T, y: HS.front.y0 * T - 18, r: 26 })),
  { x: HS.torii.x * T, y: HS.torii.line * T - 70, r: 150, color: 'rgba(255, 130, 80, 0.5)' },
  { x: HS.torii.x * T, y: HS.torii.line * T + 50, r: 90, color: 'rgba(255, 130, 80, 0.3)' },
  { x: midX(HS.hall) * T, y: HS.hall.line * T - 30, r: 110, color: 'rgba(255, 170, 110, 0.45)' },
  { x: midX(HS.haraiden) * T, y: HS.front.y1 * T, r: 80, color: 'rgba(255, 170, 110, 0.35)' },
  { x: HS.pagoda.x * T, y: HS.pagoda.line * T - 70, r: 90, color: 'rgba(255, 150, 100, 0.4)' },
  ...[HS.momiji, HS.tea, HS.anago, HS.oyster].map((m) => ({ x: midX(m) * T, y: HS.street.line * T - 10, r: 56, color: 'rgba(255, 200, 130, 0.5)' })),
  { x: midX(HS.pier) * T, y: HS.pier.line * T - 24, r: 100, color: 'rgba(220, 235, 255, 0.45)' },
  { x: midX(HS.jetty) * T, y: HS.jetty.y1 * T, r: 70, color: 'rgba(220, 235, 255, 0.3)' },
  { x: (HS.tip.x0 + 0.7) * T, y: HS.tip.y1 * T - 20, r: 40 },
];

// 潮汐的名牌（每幀讀，會跟著時間變）
const tideLabel: CityLabel = {
  x: HS.torii.x,
  y: 42.6,
  color: '#bae6fd',
  get text(): Text2 {
    const e = exposure();
    if (e > 0.8) return { 'zh-TW': '🏖️ 退潮：可以走到大鳥居下', 'en-US': '🏖️ Low tide: walk out to the torii' };
    if (e > 0.05) return { 'zh-TW': '🌊 潮水正在變化中', 'en-US': '🌊 The tide is turning' };
    return { 'zh-TW': '🌊 漲潮：大鳥居浮在海上', 'en-US': '🌊 High tide: the torii floats on the sea' };
  },
};

const stationX = 50.5;
const FORTUNE_X = midX(HS.haraiden);

export const HIROSHIMA: CityDef = {
  id: 'hiroshima',
  country: 'jp',
  line: 'jr',
  W: HS.W,
  H: HS.H,
  title: { 'zh-TW': '廣島 · 宮島嚴島神社', 'en-US': 'Hiroshima · Miyajima Itsukushima' },
  stop: { 'zh-TW': '廣島（JR 宮島口轉渡輪）', 'en-US': 'Hiroshima (JR Miyajimaguchi + ferry)' },
  emoji: '⛩️',
  station: {
    x: stationX,
    y: HS.pier.line + 0.7,
    name: { 'zh-TW': '宮島棧橋（JR 渡輪）', 'en-US': 'Miyajima Pier (JR Ferry)' },
    arrive: { x: stationX - 3, y: HS.pier.line + 1.4 },
  },
  background: '#3f8ab6',
  soundscape: 'beach',
  paintGround: paintHiroshimaGround,
  props,
  solid,
  blocked,
  seats: HIROSHIMA_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: HIROSHIMA_SHOPS,
  fortune: {
    at: r(HS.haraiden.x0 + 0.4, HS.hall.line + 0.05, HS.haraiden.x1 - 0.4, HS.front.y0 + 0.4),
    label: { x: FORTUNE_X, y: HS.sea + 0.2 },
    title: { 'zh-TW': '嚴島神社 · 御神籤', 'en-US': 'Itsukushima Shrine · Omikuji' },
    hint: { 'zh-TW': '在拜殿前合掌，搖一搖籤筒。', 'en-US': 'Bow before the hall and shake the box.' },
    draw: { 'zh-TW': '抽籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再抽一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great blessing' }, text: { 'zh-TW': '像大鳥居一樣，不用埋進地底也站得穩。今天專注到底！', 'en-US': 'Like the great torii, you stand firm without being buried. Focus all the way today!' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Middle blessing' }, text: { 'zh-TW': '潮水會退的。等一下，路就會出現在你腳下。', 'en-US': 'The tide always ebbs. Wait a little, and the path will appear at your feet.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small blessing' }, text: { 'zh-TW': '用大杓子「舀起」勝利：一顆番茄鐘一顆番茄鐘來。', 'en-US': 'Scoop up victory with the giant shamoji — one pomodoro at a time.' } },
      { rank: { 'zh-TW': '吉', 'en-US': 'Blessing' }, text: { 'zh-TW': '吃一個紅葉饅頭，再專注二十五分鐘。', 'en-US': 'One momiji manju, then twenty-five more minutes of focus.' } },
      { rank: { 'zh-TW': '末吉', 'en-US': 'Future blessing' }, text: { 'zh-TW': '彌山的火燒了一千兩百年沒熄，你的努力也會慢慢累積。', 'en-US': 'Misen’s flame has burned for 1,200 years — your effort adds up the same way.' } },
    ],
  },
  infos: [
    {
      at: r(HS.torii.x - 5.6, HS.torii.line - 8.4, HS.torii.x + 5.6, HS.torii.line + 0.4),
      title: { 'zh-TW': '嚴島神社大鳥居', 'en-US': 'Grand Torii of Itsukushima' },
      text: {
        'zh-TW': '現在的大鳥居是 1875 年立的第八代，高約 16 公尺，主柱是天然的楠木。它沒有埋進海底，是靠自己的重量（笠木裡塞滿石頭）站在海裡。漲潮時浮在海上，退潮時可以走到鳥居下（這張地圖的潮汐大約 12 小時 25 分一輪，用時間模擬，不是真的潮汐表）。面海的扁額寫「嚴島神社」。2019～2022 年做過大整修。',
        'en-US': 'Today’s torii, the eighth, was raised in 1875: about 16 m tall, with main pillars of natural camphor. It isn’t buried in the seabed — it stands by its own weight, the top beam packed with stones. At high tide it seems to float; at low tide you can walk right up to it. (Tides here run on a simulated ~12 h 25 min cycle, not a real tide table.) The seaward plaque reads “Itsukushima Shrine”. Major restoration ran 2019–2022.',
      },
    },
    {
      at: r(HS.hall.x0, HS.sea + 0.2, HS.hall.x1, HS.hall.line),
      title: { 'zh-TW': '嚴島神社', 'en-US': 'Itsukushima Shrine' },
      text: {
        'zh-TW': '傳說創建於 593 年，1168 年平清盛把社殿蓋成現在這樣：朱紅的社殿和迴廊整個蓋在海上，漲潮時像浮在水面。迴廊的地板留有縫隙，讓大浪的力量散掉。1996 年登錄世界遺產。（地圖上把迴廊和拜殿簡化了，實際的規模大很多。）',
        'en-US': 'Said to date from 593; in 1168 Taira no Kiyomori rebuilt it in its present form, with vermilion halls and corridors standing over the sea so they seem to float at high tide. Gaps between the floorboards let storm waves through. A World Heritage Site since 1996. (The corridors and halls are simplified here — the real complex is far larger.)',
      },
    },
    {
      at: r(HS.pagoda.x - 2.2, 3.4, HS.pagoda.x + 2.2, HS.pagoda.line),
      title: { 'zh-TW': '五重塔與千疊閣', 'en-US': 'Five-storey Pagoda & Senjōkaku' },
      text: {
        'zh-TW': '1407 年建的五重塔，高約 27.6 公尺，朱紅色，融合日本和中國（禪宗）的建築風格。旁邊的大殿是豐國神社「千疊閣」，1587 年豐臣秀吉下令興建，因為他過世一直沒蓋完，所以沒有牆、也沒上漆。',
        'en-US': 'The vermilion five-storey pagoda (1407, about 27.6 m) blends Japanese and Chinese Zen styles. The great hall beside it is Senjōkaku of Toyokuni Shrine, ordered by Toyotomi Hideyoshi in 1587 — left unfinished at his death, so it still has no walls or lacquer.',
      },
    },
    {
      at: r(24, 0, 44, 6),
      title: { 'zh-TW': '彌山', 'en-US': 'Mount Misen' },
      text: {
        'zh-TW': '宮島最高的山（535 公尺），整座島被當成神明來崇拜，山上是原始林和巨大的花崗岩。806 年弘法大師空海在山上修行，靈火堂的「不滅之火」燒了一千兩百年，廣島和平紀念公園的「和平之火」也是從這裡取火的。可以搭纜車上山。',
        'en-US': 'Miyajima’s highest peak (535 m); the whole island is revered as sacred, with primeval forest and huge granite boulders. Kūkai trained here in 806, and the “Eternal Flame” at Reikadō has burned for 1,200 years — it also lit the Flame of Peace in Hiroshima’s Peace Memorial Park. A ropeway runs up the mountain.',
      },
    },
    {
      at: r(HS.street.x0, HS.street.line - 4, HS.shamoji.x1, HS.shamoji.y),
      title: { 'zh-TW': '表參道商店街與大杓子', 'en-US': 'Omotesandō Shopping Street & Giant Shamoji' },
      text: {
        'zh-TW': '從棧橋走到嚴島神社的老街，兩旁是木造町家：現烤的紅葉饅頭（1906 年左右在宮島誕生）、炭烤牡蠣、星鰻飯。宮島是飯杓（杓子）的發源地，街上展示一支長 7.7 公尺、重 2.5 噸的巨大木杓子，用樹齡 270 年的欅木做的；「舀起勝利」所以考生和運動員都愛買杓子。（實際上商店街兩邊都有店，這裡只畫了一邊。）',
        'en-US': 'The old street from the pier to the shrine, lined with wooden machiya: fresh momiji manju (born on Miyajima around 1906), charcoal-grilled oysters and anago-meshi. Miyajima is the birthplace of the rice scoop (shamoji); a 7.7 m, 2.5-tonne giant shamoji carved from 270-year-old zelkova is on display. Shamoji “scoop up” victory, so students and athletes love them. (Real shops line both sides; only one side is drawn here.)',
      },
    },
    {
      at: r(HS.pier.x0, 13, HS.W, HS.pier.line),
      title: { 'zh-TW': '宮島棧橋', 'en-US': 'Miyajima Pier' },
      text: {
        'zh-TW': '從 JR 宮島口搭渡輪大約 10 分鐘到這裡，JR 的渡輪有些班次會特別繞到大鳥居前面。從廣島市區搭 JR 山陽本線到宮島口大約 30 分鐘；市區裡有原爆圓頂館和和平紀念公園（這張地圖沒有畫）。島上的鹿是神明的使者，不能餵食。',
        'en-US': 'About 10 minutes by ferry from JR Miyajimaguchi; some JR ferry runs swing past the great torii. From central Hiroshima it’s about 30 min on the JR Sanyō Line to Miyajimaguchi — the city itself holds the Atomic Bomb Dome and Peace Memorial Park (not drawn on this map). The island’s deer are considered sacred messengers; please don’t feed them.',
      },
    },
  ],
  labels: [
    { x: HS.torii.x, y: HS.sea + 0.7, text: { 'zh-TW': '⛩️ 御笠濱（長椅看大鳥居）', 'en-US': '⛩️ Mikasa beach (benches facing the torii)' }, color: '#fde68a' },
    { x: midX(HS.tea), y: TEA_BENCH_Y + 1.1, text: { 'zh-TW': '🍵 茶屋（紅毛氈長凳）', 'en-US': '🍵 Teahouse (red-felt benches)' }, color: '#fca5a5' },
    { x: midX(HS.stage), y: HS.tip.y1 + 1, text: { 'zh-TW': '🏮 嚴島神社迴廊（坐在迴廊邊）', 'en-US': '🏮 Shrine corridor (sit by the sea)' }, color: '#fdba74' },
    tideLabel,
  ],
  walkers: [
    { x0: 1, y0: 20.3, x1: 44, y1: 20.3, count: 4 },
    { x0: 1, y0: 21.3, x1: 22, y1: 21.3, count: 1 },
    { x0: 22.5, y0: 16, x1: 44.5, y1: 16, count: 3 },
    { x0: 1, y0: 18.5, x1: 34.5, y1: 18.5, count: 2 },
    { x0: 2.4, y0: 30.6, x1: 20.6, y1: 30.6, count: 2 },
    { x0: 2.6, y0: 23.8, x1: 2.6, y1: 30.4, count: 1 },
  ],
  traffic: [],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點海邊長椅、茶屋的紅毛氈長凳或嚴島神社迴廊坐下專注 · 走到表參道買紅葉饅頭、烤牡蠣、星鰻飯 · 拜殿前抽籤 · 退潮時可以走到大鳥居下 · 點地標看介紹 · 宮島棧橋搭渡輪去別的城市或飛回台灣',
    'en-US': 'WASD / arrows to move · click a seaside bench, a red teahouse bench or the shrine corridor to focus · walk up to the shops for momiji manju, oysters and anago-meshi · draw omikuji at the hall · walk out to the torii at low tide · click landmarks for info · Miyajima Pier to other cities or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或迴廊坐下專注 · 走到店門口買東西 · 拜殿前抽籤 · 退潮走到鳥居下 · 點地標看介紹 · 宮島棧橋',
    'en-US': 'Tap a bench or the corridor to focus · visit the shops · omikuji at the hall · walk to the torii at low tide · tap landmarks · Miyajima Pier',
  },
};
