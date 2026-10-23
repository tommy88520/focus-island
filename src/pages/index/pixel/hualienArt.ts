// 花蓮七星潭的美術：北邊中央山脈（一層層的高山、山頂的雲）、山腳公路、海岸公園的草地和椰子樹、觀景台、星星廣場、
// 七星柴魚博物館、攤車、自行車道、礫石灘（鵝卵石）、太平洋（一波波打上來的浪、遠方的賞鯨船）。最後組成 CityScene 用的 HUALIEN。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CART_INFO, DECK_BENCHES, DECK_BENCH_Y, HL, HUALIEN_SEATS, HUALIEN_SHOPS } from './hualien';
import { px, seeded } from './pixelUtil';
import { paintPalm } from './pixelArt';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, drawLamp, drawFoodCart, drawBench, drawStreetTree } from './cityArt';

const SEA = '#2f7fb0';
const SEA_DEEP = '#1f6a98';
const PEBBLE = '#a9a49a';

// ── 地面（畫一次）──
export function paintHualienGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(2020);
  const W = HL.W * T;
  const H = HL.H * T;
  // 中央山脈：三層山（遠的淡、近的深）＋山頂的雲
  px(c, '#9cc6e0', 0, 0, W, HL.mountainY1 * T);
  const ridge = (base: number, amp: number, freq: number, color: string, seed: number) => {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(0, HL.mountainY1 * T);
    for (let x = 0; x <= W; x += 8) c.lineTo(x, base - Math.abs(Math.sin(x * freq + seed)) * amp - Math.sin(x * freq * 2.7 + seed) * amp * 0.3);
    c.lineTo(W, HL.mountainY1 * T);
    c.closePath();
    c.fill();
  };
  ridge(HL.mountainY1 * T - 30, 40, 0.012, '#7a9eaa', 1);
  ridge(HL.mountainY1 * T - 14, 46, 0.018, '#4f7a5a', 2.4);
  ridge(HL.mountainY1 * T, 30, 0.025, '#3a6a44', 4.1);
  for (let k = 0; k < 6; k += 1) {
    c.fillStyle = 'rgba(255,255,255,0.75)';
    c.beginPath();
    c.ellipse(60 + k * 160 + rand() * 40, 12 + rand() * 14, 26 + rand() * 18, 6, 0, 0, Math.PI * 2);
    c.fill();
  }
  // 山腳公路（台 11 線往花蓮市）
  road(c, { x0: 0, y0: HL.road.y0, x1: HL.W, y1: HL.road.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.8)', x, ((HL.road.y0 + HL.road.y1) / 2) * T, 10, 2);
  // 海岸公園草地
  px(c, '#7fb05a', 0, HL.road.y1 * T, W, (HL.parkY1 - HL.road.y1) * T);
  for (let i = 0; i < 1600; i += 1) px(c, rand() < 0.5 ? '#6f9e4c' : '#92c26a', Math.floor(rand() * W), Math.floor(HL.road.y1 * T + rand() * (HL.parkY1 - HL.road.y1) * T), 2, 1);
  // 小路（公路下來到觀景台、星星廣場）
  tiles(c, { x0: 0, y0: HL.road.y1, x1: HL.W, y1: HL.road.y1 + 1.2 }, '#d9cfb8', '#c9bfa8', 8);
  tiles(c, { x0: 27, y0: HL.road.y1 + 1.2, x1: 29, y1: HL.deck.y0 }, '#d9cfb8', '#c9bfa8', 8);
  tiles(c, { x0: 43, y0: HL.road.y1 + 1.2, x1: 45, y1: HL.plaza.cy - HL.plaza.r }, '#d9cfb8', '#c9bfa8', 8);
  tiles(c, { x0: 0, y0: 20.6, x1: HL.W, y1: HL.bike.y0 }, '#d9cfb8', '#c9bfa8', 8);
  // 觀景台（木頭平台）
  const dk = HL.deck;
  px(c, '#a8825a', dk.x0 * T, dk.y0 * T, (dk.x1 - dk.x0) * T, (dk.y1 - dk.y0 + 2) * T);
  for (let x = dk.x0 * T; x < dk.x1 * T; x += 6) px(c, '#93704a', x, dk.y0 * T, 1, (dk.y1 - dk.y0 + 2) * T);
  // 星星廣場：圓形廣場上一顆大星星（七星潭的名字）
  const pz = HL.plaza;
  c.fillStyle = '#d6cdbd';
  c.beginPath();
  c.arc(pz.cx * T, pz.cy * T, pz.r * T, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#f6c945';
  c.beginPath();
  for (let k = 0; k < 10; k += 1) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 === 0 ? pz.r * T * 0.8 : pz.r * T * 0.35;
    const x = pz.cx * T + Math.cos(a) * rr;
    const y = pz.cy * T + Math.sin(a) * rr;
    if (k === 0) c.moveTo(x, y);
    else c.lineTo(x, y);
  }
  c.closePath();
  c.fill();
  for (let k = 0; k < 7; k += 1) {
    const a = (k / 7) * Math.PI * 2;
    px(c, '#f6e2a8', Math.round(pz.cx * T + Math.cos(a) * pz.r * T * 0.92) - 1, Math.round(pz.cy * T + Math.sin(a) * pz.r * T * 0.92) - 1, 3, 3);
  }
  // 自行車道
  px(c, '#a8665a', 0, HL.bike.y0 * T, W, (HL.bike.y1 - HL.bike.y0) * T);
  for (let x = 0; x < W; x += 16) px(c, 'rgba(255,255,255,0.75)', x, ((HL.bike.y0 + HL.bike.y1) / 2) * T - 1, 8, 2);
  // 礫石灘：一顆顆鵝卵石
  px(c, PEBBLE, 0, HL.bike.y1 * T, W, (HL.shoreY - HL.bike.y1) * T + 20);
  const stones = ['#bdb8ae', '#8f8a80', '#c9c4ba', '#9a948a', '#d6d1c6', '#7c776d'];
  for (let i = 0; i < 2400; i += 1) {
    const x = Math.floor(rand() * W);
    const y = Math.floor(HL.bike.y1 * T + rand() * ((HL.shoreY - HL.bike.y1) * T + 16));
    c.fillStyle = stones[Math.floor(rand() * stones.length)] ?? PEBBLE;
    c.beginPath();
    c.ellipse(x, y, 1.5 + rand() * 2, 1 + rand() * 1.2, 0, 0, Math.PI * 2);
    c.fill();
  }
  // 太平洋：越外面越深
  const sy = HL.shoreY * T + 14;
  const g = c.createLinearGradient(0, sy, 0, H);
  g.addColorStop(0, '#4fa3c9');
  g.addColorStop(0.3, SEA);
  g.addColorStop(1, SEA_DEEP);
  c.fillStyle = g;
  c.fillRect(0, sy, W, H - sy);
}

// 浪：一波波打上礫石灘、退回去（每格動）
function drawWaves(c: CanvasRenderingContext2D, seconds: number): void {
  const W = HL.W * T;
  const sy = HL.shoreY * T + 14;
  for (let k = 0; k < 3; k += 1) {
    const t = (seconds * 0.22 + k / 3) % 1;
    const y = sy - Math.sin(t * Math.PI) * 10 + k * 3;
    c.fillStyle = `rgba(255,255,255,${0.75 * (1 - t)})`;
    for (let x = 0; x < W; x += 4) {
      const wy = y + Math.sin(x * 0.04 + seconds + k) * 2;
      c.fillRect(x, Math.round(wy), 4, 2);
    }
  }
  for (let i = 0; i < 50; i += 1) {
    const x = (i * 113 + seconds * (6 + (i % 5))) % W;
    const y = sy + 20 + ((i * 41) % (HL.H * T - sy - 26));
    px(c, `rgba(230, 245, 255, ${0.18 + 0.15 * Math.sin(seconds * 1.2 + i)})`, Math.round(x), Math.round(y), 6, 1);
  }
}

// 賞鯨船（遠方慢慢開）、偶爾冒出來的海豚
function drawWhaleBoat(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const W = HL.W * T;
  const x = ((d.seconds * 7) % (W + 200)) - 100;
  const y = (HL.H - 2) * T;
  px(c, 'rgba(0,0,0,0.15)', Math.round(x - 30), Math.round(y) + 1, 60, 3);
  px(c, '#f4f6f8', Math.round(x - 30), Math.round(y) - 10, 60, 10);
  px(c, '#f6c945', Math.round(x - 30), Math.round(y) - 3, 60, 3);
  px(c, '#f4f6f8', Math.round(x - 16), Math.round(y) - 20, 32, 10);
  px(c, '#1f6fa8', Math.round(x - 18), Math.round(y) - 22, 36, 2);
  for (let k = 0; k < 4; k += 1) px(c, '#2f3a42', Math.round(x - 14 + k * 8), Math.round(y) - 18, 5, 4);
  // 海豚：每 20 秒跳一次
  const jt = d.seconds % 20;
  if (jt < 1.6) {
    const k = jt / 1.6;
    const dx = 120 + (d.seconds % 60 < 20 ? 0 : 340);
    const jx = (dx + k * 30) % W;
    const jy = (HL.shoreY + 4.6) * T - Math.sin(k * Math.PI) * 14;
    c.fillStyle = '#5a7a90';
    c.beginPath();
    c.ellipse(jx, jy, 7, 3, -0.6 + k * 1.2, 0, Math.PI * 2);
    c.fill();
    px(c, '#5a7a90', Math.round(jx - 1), Math.round(jy - 5), 2, 3);
  }
}

// 七星柴魚博物館：木造的平房、斜屋頂、門口的大招牌
function museumSprite(): HTMLCanvasElement {
  const w = Math.round((HL.museum.x1 - HL.museum.x0) * T);
  const h = 60;
  return cached('hl-museum', w, h, (c) => {
    const base = h;
    c.fillStyle = '#4a505c';
    c.beginPath();
    c.moveTo(-4, 26);
    c.lineTo(w / 2, 4);
    c.lineTo(w + 4, 26);
    c.closePath();
    c.fill();
    for (let y = 8; y < 26; y += 3) px(c, '#5e6572', w / 2 - (y - 4) * (w / 44), y, (y - 4) * (w / 22), 1);
    px(c, '#b08a5e', 0, 26, w, base - 26);
    for (let x = 0; x < w; x += 6) px(c, '#9a764c', x, 26, 1, base - 26);
    px(c, '#15100c', w / 2 - 40, 30, 80, 11);
    px(c, '#c9a24a', w / 2 - 40, 30, 80, 1);
    text(c, '七星柴魚博物館', w / 2, 35.5, '#f6e2a8', `900 7px ${FONT_TC}`);
    for (const x of [10, w - 30]) {
      px(c, '#2f3a42', x, 44, 20, 12);
      px(c, '#6a8090', x + 1, 45, 6, 4);
    }
    px(c, '#2a1e16', w / 2 - 10, base - 16, 20, 16);
    px(c, '#f6e2a8', w / 2 - 8, base - 14, 16, 14);
    // 門口晒的柴魚
    for (let k = 0; k < 5; k += 1) px(c, '#8a5a32', 6 + k * 8, base - 8, 5, 2);
  });
}

// 觀景台的木欄杆（南邊那一道，人在欄杆後面看海）
function drawDeckRail(c: CanvasRenderingContext2D): void {
  const dk = HL.deck;
  const y = Math.round((dk.y1 + 2) * T);
  px(c, '#8a6a46', dk.x0 * T, y - 9, (dk.x1 - dk.x0) * T, 2);
  for (let x = dk.x0 * T; x < dk.x1 * T; x += 8) px(c, '#755a3a', x, y - 9, 2, 9);
}

// 大石頭（礫石灘上可以坐）、石椅
function drawRock(c: CanvasRenderingContext2D, x: number, y: number, big: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const rw = big ? 12 : 9;
  px(c, 'rgba(0,0,0,0.2)', cx - rw, by + 1, rw * 2, 3);
  c.fillStyle = big ? '#8f8a80' : '#a59f94';
  c.beginPath();
  c.ellipse(cx, by - 3, rw, 5, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = big ? '#a9a49a' : '#c2bcb0';
  c.beginPath();
  c.ellipse(cx - 2, by - 5, rw - 4, 3, 0, 0, Math.PI * 2);
  c.fill();
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = HUALIEN_SEATS[i];
  if (!s || i < 6) return;
  if (i === 6 || i === 7) {
    drawBench(c, s.x, s.y, 1.2);
    return;
  }
  drawRock(c, s.x, s.y, i >= 10);
}

// 公車站牌（台鐵花蓮站接駁）
function drawBusStop(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = Math.round(HL.busStop.x * T);
  const y = Math.round(HL.busStop.y * T);
  px(c, 'rgba(0,0,0,0.2)', x - 18, y + 1, 32, 3);
  px(c, '#9fc3d6', x - 16, y - 22, 26, 20);
  px(c, '#1f6fa8', x - 18, y - 26, 30, 4);
  px(c, '#3a3d45', x - 17, y - 22, 2, 22);
  px(c, '#3a3d45', x + 9, y - 22, 2, 22);
  px(c, '#8a5a32', x - 13, y - 8, 20, 3);
  px(c, '#3a3d45', x + 14, y - 30, 2, 30);
  c.fillStyle = '#0070bd';
  c.beginPath();
  c.arc(x + 15, y - 32, 6, 0, Math.PI * 2);
  c.fill();
  text(c, '台鐵', x + 15, y - 32, '#ffffff', `900 4px ${FONT_TC}`);
  if (d.night) glow(c, x - 3, y - 14, 20, '200, 230, 255', 0.3);
}

// ── 組成 CityScene 用的資料 ──
const PALMS: [number, number, number][] = [[1.6, 13, 0], [15, 11.6, 1], [20.4, 13.4, 0], [36.2, 12.6, 1], [51.4, 13.4, 0], [54, 19.6, 1], [3.4, 20.2, 1], [48.6, 21.2, 0]];
const TREES: [number, number][] = [[39, 11.8], [30.6, 11.8], [13.8, 18.6]];
const LAMPS: [number, number][] = [[6, 10.2], [18, 10.2], [26, 10.2], [34, 10.2], [46, 10.2], [10, 20.8], [24.2, 20.8], [38, 20.8], [52, 20.8]];

const props: CityProp[] = [
  { y: HL.museum.y, draw: (c) => blit(c, museumSprite(), HL.museum.x0 * T, HL.museum.y * T) },
  ...DECK_BENCHES.map((x): CityProp => ({ y: DECK_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, DECK_BENCH_Y, 2.6) })),
  { y: HL.deck.y1 + 2, draw: (c) => drawDeckRail(c) },
  ...HL.carts.map((x, i): CityProp => {
    const cart = CART_INFO[i] ?? CART_INFO[0]!;
    return { y: HL.cartY, draw: (c, d) => drawFoodCart(c, x, HL.cartY, cart.name['zh-TW'], cart.awning, cart.food, d.seconds, i * 5 + 13) };
  }),
  { y: HL.busStop.y, draw: (c, d) => drawBusStop(c, d) },
  { y: HL.shoreY + 0.6, draw: (c, d) => drawWaves(c, d.seconds) },
  { y: HL.H, draw: (c, d) => drawWhaleBoat(c, d) },
  ...PALMS.map(([x, y, v]): CityProp => ({ y, draw: (c) => paintPalm(c, Math.round(x * T) - 8, Math.round(y * T) - 16, v) })),
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  r(0, 0, HL.W, HL.road.y0 - 0.2),
  r(HL.museum.x0, HL.museum.y - 2.6, HL.museum.x1, HL.museum.y - 0.2),
  ...DECK_BENCHES.map((x) => r(x - 1.3, DECK_BENCH_Y - 0.75, x + 1.3, DECK_BENCH_Y - 0.45)),
  r(HL.deck.x0, HL.deck.y1 + 1.4, HL.deck.x1, HL.deck.y1 + 1.8),
  ...HL.carts.map((x) => r(x - 1.3, HL.cartY - 1.6, x + 1.3, HL.cartY - 0.1)),
  r(HL.busStop.x - 1.2, HL.busStop.y - 0.4, HL.busStop.x + 0.8, HL.busStop.y + 0.1),
  // 海（浪打到的地方就不能再走）
  r(0, HL.shoreY + 0.6, HL.W, HL.H),
  ...PALMS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  { x: ((HL.museum.x0 + HL.museum.x1) / 2) * T, y: HL.museum.y * T - 12, r: 50, color: 'rgba(255, 220, 160, 0.45)' },
  ...HL.carts.map((x) => ({ x: x * T, y: HL.cartY * T - 20, r: 30, color: 'rgba(255, 220, 150, 0.5)' })),
  { x: HL.plaza.cx * T, y: HL.plaza.cy * T, r: 40, color: 'rgba(255, 230, 140, 0.35)' },
];

export const HUALIEN: CityDef = {
  id: 'hualien',
  W: HL.W,
  H: HL.H,
  title: { 'zh-TW': '花蓮 · 七星潭', 'en-US': 'Hualien · Qixingtan' },
  stop: { 'zh-TW': '花蓮（七星潭）', 'en-US': 'Hualien (Qixingtan)' },
  emoji: '🌊',
  line: 'tra',
  station: {
    x: HL.busStop.x,
    y: HL.busStop.y + 0.6,
    name: { 'zh-TW': '往台鐵花蓮站的公車', 'en-US': 'Bus to TRA Hualien Station' },
    arrive: { x: HL.busStop.x - 2.4, y: HL.busStop.y + 0.6 },
  },
  background: '#7fb05a',
  soundscape: 'beach',
  paintGround: paintHualienGround,
  props,
  solid,
  seats: HUALIEN_SEATS,
  drawSeat,
  shops: HUALIEN_SHOPS,
  infos: [
    { at: r(0, HL.bike.y1, HL.W, HL.shoreY + 0.6), title: { 'zh-TW': '七星潭', 'en-US': 'Qixingtan' }, text: { 'zh-TW': '花蓮市北邊的海灣，海灘不是沙子而是一顆顆圓圓的鵝卵石，海很藍、浪聲很好聽。名字的「潭」來自以前這裡的幾個湖。', 'en-US': 'A bay just north of Hualien city with a beach of round pebbles instead of sand, deep blue water and soothing surf. The "tan" (pond) refers to lakes that were once here.' } },
    { at: r(0, 0, HL.W, HL.road.y0), title: { 'zh-TW': '中央山脈', 'en-US': 'Central Mountain Range' }, text: { 'zh-TW': '花蓮緊靠著中央山脈，山直直落進太平洋，往北就是清水斷崖和太魯閣。', 'en-US': 'Hualien sits right against the Central Range, which drops straight into the Pacific — north of here are the Qingshui Cliffs and Taroko.' } },
    { at: r(HL.museum.x0, HL.museum.y - 3.6, HL.museum.x1, HL.museum.y), title: { 'zh-TW': '七星柴魚博物館', 'en-US': 'Qixing Bonito Museum' }, text: { 'zh-TW': '以前七星潭一帶是做柴魚的漁村，這裡介紹柴魚怎麼做、也賣柴魚伴手禮。', 'en-US': 'The area used to be a bonito-making fishing village; the museum shows how it’s made and sells bonito souvenirs.' } },
    { at: r(HL.plaza.cx - HL.plaza.r, HL.plaza.cy - HL.plaza.r, HL.plaza.cx + HL.plaza.r, HL.plaza.cy + HL.plaza.r), title: { 'zh-TW': '星星廣場', 'en-US': 'Star Plaza' }, text: { 'zh-TW': '七星潭的晚上很暗、星星很多，很多人來這裡看星星和日出。', 'en-US': 'Nights here are dark and full of stars — people come to stargaze and watch the sunrise.' } },
  ],
  labels: [
    { x: 28, y: HL.deck.y0 - 0.1, text: { 'zh-TW': '🌊 七星潭觀景台（長椅看海專注）', 'en-US': '🌊 Qixingtan viewing deck (benches to focus)' }, color: '#60a5fa' },
    { x: HL.plaza.cx, y: HL.plaza.cy - HL.plaza.r - 0.2, text: { 'zh-TW': '⭐ 星星廣場', 'en-US': '⭐ Star Plaza' }, color: '#fbbf24' },
    { x: 26, y: HL.shoreY - 0.6, text: { 'zh-TW': '礫石灘', 'en-US': 'Pebble beach' }, color: '#e2e8f0' },
  ],
  walkers: [
    { x0: 1, y0: 9.6, x1: 55, y1: 9.6, count: 3 },
    { x0: 1, y0: 21.4, x1: 55, y1: 21.4, count: 2 },
    { x0: 1, y0: 23.6, x1: 55, y1: 23.6, count: 3 },
    { x0: 2, y0: 25.6, x1: 54, y1: 25.6, count: 4 },
    { x0: 28, y0: 10.4, x1: 28, y1: 14.4, count: 1 },
  ],
  traffic: [
    { y: 7.4, dir: -1, x0: 0, x1: HL.W, count: 2 },
    { y: 8.7, dir: 1, x0: 0, x1: HL.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點觀景台的長椅、星星廣場的石椅或礫石灘的大石頭坐下專注 · 走到攤車、柴魚博物館買東西 · 點地標看介紹 · 公車站回台北（台鐵）',
    'en-US': 'WASD / arrows to move · click a deck bench, a stone seat or a big beach rock to focus · walk up to a cart or the bonito museum to buy · click landmarks for info · bus stop back to Taipei (TRA)',
  },
  hintTouch: {
    'zh-TW': '點長椅、石椅、大石頭坐下專注 · 走到攤車買東西 · 點地標看介紹 · 公車站回台北',
    'en-US': 'Tap a bench, stone seat or rock to focus · walk up to carts · tap landmarks · bus back to Taipei',
  },
};
