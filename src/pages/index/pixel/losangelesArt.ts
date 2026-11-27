// 洛杉磯的美術：好萊塢山丘（山坡上的白色大字招牌、山上的葛瑞菲斯天文台：白色建築＋三個圓頂）、
// 好萊塢大道（星光大道的粉紅星星、中式戲院風格的電影院、餐館、裝飾藝術風的旅館、地鐵站入口、霓虹招牌）、
// 塔可餐車、漢堡攤、野餐桌、高高的細長棕櫚樹、聖塔莫尼卡碼頭（入口拱門、66 號公路終點招牌、木棧橋、摩天輪、雲霄飛車）、
// 沙灘（救生員塔、自行車道上溜滑板和騎腳踏車的人）、太平洋的夕陽。最後組成 CityScene 用的 LOSANGELES。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { BEACH_BENCH, LA, LOSANGELES_SEATS, LOSANGELES_SHOPS, PICNIC_TABLES, PICNIC_Y, PIER_BENCH, WALK_BENCHES, WALK_BENCH_Y } from './losangeles';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra, drawBench, drawFoodCart, drawStringLights, drawSeaWaves } from './cityArt';

const W = LA.W * T;

// 五角星（星光大道、霓虹）
function star(c: CanvasRenderingContext2D, cx: number, cy: number, r: number, ri: number, fill: string): void {
  c.fillStyle = fill;
  c.beginPath();
  for (let k = 0; k < 10; k += 1) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const rr = k % 2 ? ri : r;
    if (k === 0) c.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    else c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  c.closePath();
  c.fill();
}

// 山脊的高度（px）：李山（Mount Lee，大字招牌在它的南坡）和好萊塢山（天文台）
function ridge(x: number): number {
  const base = 4.6 * T + Math.sin(x * 0.011) * 6 + Math.sin(x * 0.031) * 3;
  const lee = 2 * T + Math.abs(x - 13 * T) * 0.16;
  const hollywood = 3.2 * T + Math.abs(x - 47 * T) * 0.2;
  return Math.min(base, lee, hollywood);
}

// ── 地面（畫一次）──
export function paintLosAngelesGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1781);
  // 傍晚的天空：上面藍、靠山的地方偏橘
  const sky = c.createLinearGradient(0, 0, 0, 5 * T);
  sky.addColorStop(0, '#5f8fc6');
  sky.addColorStop(0.45, '#c9b3b8');
  sky.addColorStop(0.75, '#f6b98a');
  sky.addColorStop(1, '#f59a62');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 5 * T);
  // 西邊快下山的太陽
  glow(c, 3 * T, 3.6 * T, 60, '255, 200, 120', 0.55);
  c.fillStyle = '#ffd68a';
  c.beginPath();
  c.arc(3 * T, 3.6 * T, 11, 0, Math.PI * 2);
  c.fill();
  // 遠山（淡紫色）
  c.fillStyle = '#a58fa8';
  c.beginPath();
  c.moveTo(0, 5 * T);
  for (let x = 0; x <= W; x += 8) c.lineTo(x, 3.3 * T + Math.sin(x * 0.006 + 1) * 8 + Math.sin(x * 0.021) * 4);
  c.lineTo(W, 5 * T);
  c.fill();
  // 好萊塢山丘：乾乾的灌木叢（橄欖綠、土黃）
  const hill = c.createLinearGradient(0, 2 * T, 0, 11 * T);
  hill.addColorStop(0, '#a59a66');
  hill.addColorStop(1, '#7f8150');
  c.fillStyle = hill;
  c.beginPath();
  c.moveTo(0, LA.blvdLine * T);
  for (let x = 0; x <= W; x += 4) c.lineTo(x, ridge(x));
  c.lineTo(W, LA.blvdLine * T);
  c.fill();
  for (let i = 0; i < 520; i += 1) {
    const x = rand() * W;
    const y = ridge(x) + 4 + rand() * (10.5 * T - ridge(x));
    c.fillStyle = ['#6e6a3e', '#8a8650', '#b0a470', '#5f7a44'][Math.floor(rand() * 4)] ?? '#6e6a3e';
    c.beginPath();
    c.arc(x, y, 1.5 + rand() * 2.5, 0, Math.PI * 2);
    c.fill();
  }
  // 李山山頂的天線塔
  px(c, '#6a6a6a', 13 * T, ridge(13 * T) - 14, 2, 14);
  px(c, '#e8402e', 13 * T, ridge(13 * T) - 16, 2, 2);
  // 山腳的住宅區：綠樹、白牆紅瓦的房子
  const foot = c.createLinearGradient(0, 9.6 * T, 0, LA.blvdLine * T);
  foot.addColorStop(0, 'rgba(95,122,68,0)');
  foot.addColorStop(0.3, '#6f8a52');
  foot.addColorStop(1, '#6a8250');
  c.fillStyle = foot;
  c.fillRect(0, 9.6 * T, W, (LA.blvdLine - 9.6) * T);
  for (let i = 0; i < 70; i += 1) {
    const x = rand() * W;
    const y = 10.6 * T + rand() * 4 * T;
    px(c, ['#f4efe2', '#efe2c8', '#e8d2c0'][Math.floor(rand() * 3)] ?? '#f4efe2', Math.round(x), Math.round(y), 10, 6);
    px(c, '#b8603e', Math.round(x) - 1, Math.round(y) - 2, 12, 3);
    px(c, '#4a5a6a', Math.round(x) + 3, Math.round(y) + 2, 3, 2);
  }
  for (let i = 0; i < 90; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#4f7040' : '#5f8a4c';
    c.beginPath();
    c.arc(rand() * W, 10 * T + rand() * 5 * T, 3 + rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  paintHollywoodSign(c);
  paintObservatory(c);

  // 星光大道：淺色人行道、一格格深色水磨石＋粉紅色的星星（銅邊）
  tiles(c, { x0: 0, y0: LA.walk.y0, x1: LA.W, y1: LA.walk.y1 }, '#d4cabb', '#c4b9a8', 16);
  // 戲院前的水泥前庭（手印、腳印）
  px(c, '#bdb6aa', (LA.theatre.x0 + 1.5) * T, LA.walk.y0 * T, (LA.theatre.x1 - LA.theatre.x0 - 3) * T, 1.2 * T);
  for (let x = LA.theatre.x0 + 1.5; x < LA.theatre.x1 - 1.6; x += 1.5) {
    px(c, '#a8a196', Math.round(x * T), LA.walk.y0 * T, 1, 1.2 * T);
    px(c, '#8f887c', Math.round(x * T) + 6, LA.walk.y0 * T + 5, 3, 4);
    px(c, '#8f887c', Math.round(x * T) + 12, LA.walk.y0 * T + 9, 2, 5);
  }
  const starAt = (x: number, y: number) => {
    const cx = Math.round(x * T);
    const cy = Math.round(y * T);
    px(c, '#c9a24a', cx - 11, cy - 11, 22, 22);
    px(c, '#3a3436', cx - 10, cy - 10, 20, 20);
    star(c, cx, cy + 1, 9, 4, '#c9a24a');
    star(c, cx, cy + 1, 7.5, 3.2, '#f09aa8');
    px(c, '#c9a24a', cx - 1, cy, 3, 3);
  };
  for (let x = 1.4; x < LA.W; x += 2.6) {
    if (x < LA.theatre.x0 + 1 || x > LA.theatre.x1 - 1) starAt(x, 16.1);
    starAt(x + 1.3, 18);
  }
  // 好萊塢大道：柏油、雙黃線、白色車道線、斑馬線
  road(c, { x0: 0, y0: LA.road.y0, x1: LA.W, y1: LA.road.y1 }, rand);
  const mid = Math.round(((LA.road.y0 + LA.road.y1) / 2) * T);
  px(c, '#f2c230', 0, mid - 2, W, 1);
  px(c, '#f2c230', 0, mid + 1, W, 1);
  px(c, '#cfcabe', 0, LA.road.y0 * T, W, 2);
  px(c, '#cfcabe', 0, LA.road.y1 * T - 2, W, 2);
  zebra(c, 23.4, LA.road.y0, 26.6, LA.road.y1, false);
  zebra(c, 42.4, LA.road.y0, 45.4, LA.road.y1, false);
  tiles(c, { x0: 0, y0: LA.south.y0, x1: LA.W, y1: LA.south.y1 }, '#d6d0c4', '#c6c0b2', 16);

  // 西邊：塔可餐車的空地（柏油）、野餐區（碎石）
  px(c, '#5d6066', 0, LA.south.y1 * T, 19.4 * T, (27.6 - LA.south.y1) * T);
  for (let i = 0; i < 240; i += 1) px(c, rand() < 0.5 ? '#55585e' : '#676a70', Math.floor(rand() * 19.4 * T), Math.floor(LA.south.y1 * T + rand() * (27.6 - LA.south.y1) * T), 2, 1);
  for (let x = 1; x < 19; x += 3.2) px(c, '#e8e4da', Math.round(x * T), LA.south.y1 * T + 2, 1, 14);
  px(c, '#d2b88e', 0, 27.6 * T, 19.4 * T, (LA.bikePath.y0 - 27.6) * T);
  for (let i = 0; i < 300; i += 1) px(c, rand() < 0.5 ? '#c4a87c' : '#dcc49c', Math.floor(rand() * 19.4 * T), Math.floor(27.6 * T + rand() * (LA.bikePath.y0 - 27.6) * T), 2, 2);

  // 中間、東邊：棕櫚樹下的草地（海邊公園）、步道
  px(c, '#7fae5a', 19.4 * T, LA.south.y1 * T, (LA.W - 19.4) * T, (LA.bikePath.y0 - LA.south.y1) * T);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#6e9e4c' : '#8fbe68', Math.floor(19.4 * T + rand() * (LA.W - 19.4) * T), Math.floor(LA.south.y1 * T + rand() * (LA.bikePath.y0 - LA.south.y1) * T), 2, 1);
  tiles(c, { x0: 19.4, y0: LA.south.y1, x1: LA.W, y1: 24.4 }, '#dcd4c2', '#ccc4b2', 16);
  tiles(c, { x0: 20.4, y0: 26.8, x1: LA.deck.x0, y1: LA.bikePath.y0 }, '#dcd4c2', '#ccc4b2', 16);
  tiles(c, { x0: LA.deck.x1, y0: 26.8, x1: 41, y1: 29.4 }, '#dcd4c2', '#ccc4b2', 16);

  // 沙灘自行車道（灰色水泥、中間黃色虛線）
  px(c, '#b9b4aa', 0, LA.bikePath.y0 * T, W, (LA.bikePath.y1 - LA.bikePath.y0) * T);
  px(c, '#a49e92', 0, LA.bikePath.y0 * T, W, 1);
  for (let x = 0; x < W; x += 16) px(c, '#f2c230', x, Math.round(((LA.bikePath.y0 + LA.bikePath.y1) / 2) * T), 8, 1);
  // 沙灘
  px(c, '#eed8a6', 0, LA.bikePath.y1 * T, W, (LA.sea - LA.bikePath.y1) * T);
  for (let i = 0; i < 700; i += 1) px(c, rand() < 0.5 ? '#e2c890' : '#f6e4b8', Math.floor(rand() * W), Math.floor(LA.bikePath.y1 * T + rand() * (LA.sea - LA.bikePath.y1) * T), 1, 1);
  for (let i = 0; i < 40; i += 1) px(c, '#d8c088', Math.floor(rand() * W), Math.floor(33 * T + rand() * 4.5 * T), 2, 1);
  px(c, '#d6bc86', 0, (LA.sea - 0.5) * T, W, 0.5 * T);
  // 太平洋（夕陽染成金色）
  const water = c.createLinearGradient(0, LA.sea * T, 0, LA.H * T);
  water.addColorStop(0, '#4a96b8');
  water.addColorStop(0.5, '#3a7fa6');
  water.addColorStop(1, '#3a6a96');
  c.fillStyle = water;
  c.fillRect(0, LA.sea * T, W, (LA.H - LA.sea) * T);
  const sunPath = c.createLinearGradient(6 * T, 0, 24 * T, 0);
  sunPath.addColorStop(0, 'rgba(255,190,110,0)');
  sunPath.addColorStop(0.5, 'rgba(255,190,110,0.35)');
  sunPath.addColorStop(1, 'rgba(255,190,110,0)');
  c.fillStyle = sunPath;
  c.fillRect(6 * T, LA.sea * T, 18 * T, (LA.H - LA.sea) * T);

  paintPier(c);
}

// 好萊塢大字招牌：山坡上 9 個白色字母（後面有鐵架）
function paintHollywoodSign(c: CanvasRenderingContext2D): void {
  const letters = 'HOLLYWOOD';
  const jitter = [0, 2, -1, 1, 3, 0, 2, -1, 1];
  const x0 = 4.8 * T;
  const step = 28;
  for (let k = 0; k < letters.length; k += 1) {
    const cx = x0 + k * step;
    const top = 4.5 * T + (jitter[k] ?? 0) + k * 0.6;
    // 鐵架（細細的灰線）
    px(c, '#6a6450', cx - 6, top + 17, 1, 5);
    px(c, '#6a6450', cx + 5, top + 17, 1, 5);
    px(c, 'rgba(0,0,0,0.25)', cx - 8, top + 19, 20, 2);
    c.font = `900 21px "Helvetica Neue", Arial, ${FONT_TC}`;
    c.textAlign = 'center';
    c.textBaseline = 'top';
    c.fillStyle = 'rgba(70,64,40,0.45)';
    c.fillText(letters[k] ?? '', cx + 1, top + 1);
    c.fillStyle = '#fbfaf5';
    c.fillText(letters[k] ?? '', cx, top);
  }
}

// 葛瑞菲斯天文台：白色的裝飾藝術風建築、中間大圓頂＋兩邊小圓頂、前面的天文學家紀念碑
function paintObservatory(c: CanvasRenderingContext2D): void {
  const cx = LA.observatory.x * T;
  const by = LA.observatory.base * T;
  // 山上的平台、草坪
  c.fillStyle = '#8f8a58';
  c.beginPath();
  c.ellipse(cx, by + 2, 90, 14, 0, Math.PI, 0);
  c.fill();
  px(c, '#7fa25a', cx - 70, by - 8, 140, 8);
  px(c, '#d8d2c4', cx - 64, by - 6, 128, 6);
  // 主體
  px(c, '#f4f1ea', cx - 50, by - 24, 100, 18);
  px(c, '#ddd8cc', cx - 50, by - 8, 100, 2);
  for (let x = cx - 46; x < cx + 46; x += 6) if (Math.abs(x - cx) > 12) px(c, '#9aa4ae', x, by - 20, 2, 8);
  px(c, '#3a3a40', cx - 5, by - 18, 10, 12);
  // 兩邊的翼塔＋小圓頂
  for (const dx of [-44, 44]) {
    px(c, '#f4f1ea', cx + dx - 8, by - 32, 16, 10);
    px(c, '#ddd8cc', cx + dx - 8, by - 23, 16, 1);
    c.fillStyle = '#7f948a';
    c.beginPath();
    c.arc(cx + dx, by - 32, 8, Math.PI, 0);
    c.fill();
    px(c, 'rgba(255,255,255,0.35)', cx + dx - 4, by - 37, 2, 3);
  }
  // 中間的大圓頂
  px(c, '#f4f1ea', cx - 16, by - 34, 32, 12);
  px(c, '#ddd8cc', cx - 16, by - 34, 32, 1);
  c.fillStyle = '#7f948a';
  c.beginPath();
  c.arc(cx, by - 34, 16, Math.PI, 0);
  c.fill();
  c.strokeStyle = '#6a7f76';
  c.lineWidth = 1;
  for (const a of [0.3, 0.5, 0.7]) {
    c.beginPath();
    c.moveTo(cx + Math.cos(Math.PI * (1 + a)) * 16 * 0.2, by - 34);
    c.lineTo(cx + Math.cos(Math.PI * (1 + a)) * 16, by - 34 + Math.sin(Math.PI * (1 + a)) * 16);
    c.stroke();
  }
  px(c, 'rgba(255,255,255,0.4)', cx - 8, by - 46, 3, 5);
  px(c, '#6a7f76', cx - 1, by - 52, 2, 3);
  // 天文學家紀念碑（白色的尖碑）
  c.fillStyle = '#f4f1ea';
  c.beginPath();
  c.moveTo(cx - 30, by - 6);
  c.lineTo(cx - 27, by - 26);
  c.lineTo(cx - 24, by - 6);
  c.fill();
}

// 碼頭：木棧橋（直的）、遊樂園的平台、白色欄杆、海裡的木樁
function paintPier(c: CanvasRenderingContext2D): void {
  const planks = (x0: number, y0: number, x1: number, y1: number) => {
    px(c, '#9a7048', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
    for (let y = y0 * T; y < y1 * T; y += 4) px(c, '#86603c', x0 * T, Math.round(y), (x1 - x0) * T, 1);
    for (let y = y0 * T, row = 0; y < y1 * T; y += 4, row += 1) for (let x = x0 * T + (row % 3) * 9; x < x1 * T; x += 27) px(c, '#7a5534', Math.round(x), Math.round(y), 1, 4);
    px(c, '#f0ebe0', x0 * T, y0 * T, 2, (y1 - y0) * T);
    px(c, '#f0ebe0', x1 * T - 2, y0 * T, 2, (y1 - y0) * T);
  };
  const pilings = (x0: number, x1: number, y: number) => {
    for (let x = x0 * T + 3; x < x1 * T; x += 12) {
      px(c, '#3e2e20', Math.round(x), Math.round(y * T), 3, 7);
      px(c, 'rgba(255,255,255,0.35)', Math.round(x) - 2, Math.round(y * T) + 7, 7, 1);
    }
  };
  const p = LA.platform;
  // 橋下的陰影
  px(c, 'rgba(0,0,0,0.18)', LA.deck.x0 * T + 3, LA.bikePath.y0 * T, (LA.deck.x1 - LA.deck.x0) * T, (p.y0 - LA.bikePath.y0) * T);
  planks(LA.deck.x0, LA.south.y1, LA.deck.x1, p.y0);
  px(c, 'rgba(0,0,0,0.2)', p.x0 * T + 4, p.y0 * T + 4, (p.x1 - p.x0) * T, (p.y1 - p.y0) * T);
  planks(p.x0, p.y0, p.x1, p.y1);
  px(c, '#f0ebe0', p.x0 * T, p.y0 * T, (p.x1 - p.x0) * T, 2);
  px(c, '#f0ebe0', p.x0 * T, p.y1 * T - 2, (p.x1 - p.x0) * T, 2);
  px(c, '#f0ebe0', LA.deck.x0 * T, p.y0 * T, (LA.deck.x1 - LA.deck.x0) * T, 2);
  pilings(p.x0, p.x1, p.y1);
  planks(LA.tail.x0, p.y1, LA.tail.x1, LA.H);
  for (let y = p.y1 + 1; y < LA.H; y += 1.6) {
    px(c, '#3e2e20', LA.tail.x0 * T - 3, Math.round(y * T), 3, 6);
    px(c, '#3e2e20', LA.tail.x1 * T, Math.round(y * T), 3, 6);
  }
}

// ── 好萊塢大道的建築 ──
interface Front {
  key: string;
  x0: number;
  x1: number;
  h: number;
  wall: string;
  trim: string;
}
// 一般的店面（裝飾藝術風：階梯狀的女兒牆、條紋遮陽棚、大玻璃窗）；招牌另外畫（晚上霓虹會亮）
function frontSprite(f: Front, awning: string): HTMLCanvasElement {
  const w = Math.round((f.x1 - f.x0) * T);
  return cached(`la-front-${f.key}`, w, f.h, (c) => {
    const h = f.h;
    px(c, f.wall, 0, 10, w, h - 10);
    px(c, f.wall, 10, 4, w - 20, 8);
    px(c, f.wall, w / 2 - 10, 0, 20, 6);
    px(c, f.trim, 0, 10, w, 2);
    px(c, f.trim, 10, 4, w - 20, 1);
    for (let x = 6; x < w - 6; x += 12) px(c, 'rgba(0,0,0,0.07)', x, 14, 2, h - 40);
    // 樓上的窗
    for (let y = 18; y < h - 36; y += 14) for (let x = 8; x + 10 < w - 4; x += 14) {
      px(c, '#4a5a6a', x, y, 9, 9);
      px(c, 'rgba(255,255,255,0.3)', x + 1, y + 1, 3, 2);
    }
    // 一樓：遮陽棚、玻璃櫥窗
    for (let k = 0; k < w; k += 8) px(c, (k / 8) % 2 === 0 ? awning : '#f4f1e8', k, h - 30, 8, 7);
    px(c, 'rgba(0,0,0,0.25)', 0, h - 23, w, 1);
    px(c, '#2e3440', 2, h - 22, w - 4, 22);
    px(c, '#f6dfae', 5, h - 19, w - 10, 13);
    for (let x = 8; x < w - 8; x += 7) px(c, ['#e25a4a', '#3b82f6', '#f6c945', '#2bb673'][(x / 7) % 4 | 0] ?? '#e25a4a', x, h - 12, 4, 5);
    px(c, f.trim, 2, h - 3, w - 4, 3);
  });
}

// 中式戲院風格的電影院：銅綠色兩層寶塔屋頂、紅色大柱、金色的龍、兩邊的翼（不寫品牌）
function theatreSprite(): HTMLCanvasElement {
  const w = Math.round((LA.theatre.x1 - LA.theatre.x0) * T);
  const h = 110;
  return cached('la-theatre', w, h, (c) => {
    const cx = w / 2;
    // 兩邊的翼：米色牆、綠瓦、海報框
    for (const [x0, x1] of [[0, 50], [w - 50, w]] as const) {
      px(c, '#e9dcc0', x0, h - 48, x1 - x0, 48);
      px(c, '#3e8a76', x0, h - 54, x1 - x0, 6);
      px(c, '#2f6656', x0, h - 49, x1 - x0, 1);
      for (let x = x0 + 7; x < x1 - 10; x += 14) {
        px(c, '#c9a24a', x, h - 40, 11, 18);
        px(c, '#7a1f1a', x + 1, h - 39, 9, 16);
        px(c, ['#f6c945', '#5ad6ff', '#ff6ad5'][(x / 14) % 3 | 0] ?? '#f6c945', x + 3, h - 36, 5, 6);
      }
      px(c, '#d4c4a2', x0, h - 6, x1 - x0, 6);
    }
    // 中間的主體
    px(c, '#d9c49a', 40, h - 76, w - 80, 76);
    px(c, '#c4ad80', 40, h - 76, w - 80, 2);
    // 銅綠色寶塔屋頂（兩層、翹起來的簷）
    const roof = (y: number, half: number, hgt: number) => {
      c.fillStyle = '#3e8a76';
      c.beginPath();
      c.moveTo(cx - half - 10, y + hgt - 4);
      c.quadraticCurveTo(cx - half, y + hgt, cx - half + 8, y);
      c.lineTo(cx + half - 8, y);
      c.quadraticCurveTo(cx + half, y + hgt, cx + half + 10, y + hgt - 4);
      c.lineTo(cx + half + 4, y + hgt);
      c.lineTo(cx - half - 4, y + hgt);
      c.closePath();
      c.fill();
      for (let x = cx - half + 2; x < cx + half; x += 4) px(c, '#2f6a5a', Math.round(x), y + 2, 1, hgt - 3);
      px(c, '#c9a24a', cx - half - 4, y + hgt - 1, half * 2 + 8, 2);
    };
    roof(h - 94, 54, 20);
    px(c, '#c0392b', cx - 30, h - 104, 60, 12);
    roof(h - 110, 34, 18);
    px(c, '#c9a24a', cx - 1, 0, 2, 4);
    // 兩根紅色大柱（上面黑色的鐵面具）
    for (const x of [cx - 40, cx + 34]) {
      px(c, '#c0392b', x, h - 74, 6, 74);
      px(c, 'rgba(255,255,255,0.25)', x, h - 74, 1, 74);
      px(c, '#2a2a2a', x - 1, h - 78, 8, 5);
    }
    // 金色的龍（大門上方）
    c.strokeStyle = '#c9a24a';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(cx - 22, h - 58);
    for (let k = 0; k <= 8; k += 1) c.lineTo(cx - 22 + k * 5.5, h - 58 + (k % 2 ? -5 : 2));
    c.stroke();
    px(c, '#c9a24a', cx + 20, h - 64, 5, 5);
    // 招牌、入口
    px(c, '#1a1a1a', cx - 30, h - 46, 60, 11);
    px(c, '#c9a24a', cx - 30, h - 46, 60, 1);
    text(c, 'THEATRE', cx, h - 40, '#f6e3a0', `900 8px ${FONT_TC}`);
    px(c, '#c9a24a', cx - 24, h - 32, 48, 32);
    px(c, '#2a1a14', cx - 22, h - 30, 44, 30);
    for (let x = cx - 20; x < cx + 20; x += 10) px(c, '#5a3a22', x, h - 28, 8, 26);
  });
}

// 裝飾藝術風的旅館高樓：奶油色、階梯狀的樓頂、直立的霓虹招牌（另外畫）
function hotelSprite(): HTMLCanvasElement {
  const w = Math.round((LA.hotel.x1 - LA.hotel.x0) * T);
  const h = 128;
  return cached('la-hotel', w, h, (c) => {
    px(c, '#efe4cc', 8, 22, w - 16, h - 22);
    px(c, '#efe4cc', 20, 10, w - 40, 14);
    px(c, '#efe4cc', w / 2 - 10, 2, 20, 10);
    px(c, '#9aa0a8', w / 2 - 1, 0, 2, 4);
    for (const x of [8, 20, w / 2 - 10]) px(c, '#d8c8a8', x, x === 8 ? 22 : x === 20 ? 10 : 2, 2, h);
    for (let y = 28; y < h - 26; y += 9) for (let x = 14; x < w - 16; x += 9) px(c, '#4a5a6a', x, y, 5, 6);
    for (let x = 14; x < w - 14; x += 18) px(c, '#c9b48a', x, 24, 2, h - 50);
    px(c, '#7a2a2a', 6, h - 26, w - 12, 4);
    px(c, '#2e3440', 10, h - 22, w - 20, 22);
    px(c, '#f6dfae', 14, h - 19, w - 28, 15);
    px(c, '#c9a24a', w / 2 - 10, h - 22, 20, 22);
    px(c, '#3a2a1a', w / 2 - 8, h - 20, 16, 20);
  });
}

// 地鐵站入口：鋼骨玻璃的雨棚蓋在往下的手扶梯上、旁邊黑色的站名柱
function metroSprite(): HTMLCanvasElement {
  const w = Math.round((LA.metro.x1 - LA.metro.x0) * T);
  const h = 60;
  return cached('la-metro', w, h, (c) => {
    // 後面的廣場牆（有壁畫）
    px(c, '#c8bfae', 0, 8, w, h - 8);
    const mural = ['#e07a1f', '#2a8a8a', '#c0392b', '#f6c945', '#3b6fb6'];
    for (let k = 0; k < 10; k += 1) px(c, mural[k % 5] ?? '#e07a1f', 6 + k * 12, 14 + (k % 3) * 4, 10, 16 - (k % 3) * 4);
    // 往下的手扶梯口
    px(c, '#2a2d33', 30, h - 22, w - 48, 22);
    for (let y = h - 20; y < h; y += 3) px(c, '#4a4d55', 32, y, w - 52, 1);
    px(c, '#c9ccd2', 30, h - 22, 2, 22);
    px(c, '#c9ccd2', w - 20, h - 22, 2, 22);
    // 玻璃雨棚（弧形）
    c.fillStyle = 'rgba(170,210,230,0.75)';
    c.beginPath();
    c.moveTo(24, h - 24);
    c.quadraticCurveTo(w / 2 - 4, h - 52, w - 12, h - 24);
    c.closePath();
    c.fill();
    c.strokeStyle = '#6a7080';
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(24, h - 24);
    c.quadraticCurveTo(w / 2 - 4, h - 52, w - 12, h - 24);
    c.stroke();
    for (let x = 36; x < w - 18; x += 14) px(c, '#6a7080', x, h - 40 + Math.abs(x - w / 2) * 0.25, 1, 16 - Math.abs(x - w / 2) * 0.25);
    px(c, '#6a7080', 24, h - 24, w - 36, 2);
    // 站名柱
    px(c, '#1a1c22', 6, h - 46, 14, 46);
    px(c, '#e5721b', 6, h - 46, 14, 3);
    text(c, 'M', 13, h - 36, '#ffffff', `900 10px ${FONT_TC}`);
    c.save();
    c.translate(13, h - 16);
    c.rotate(-Math.PI / 2);
    text(c, 'METRO', 0, 0, '#ffffff', `900 7px ${FONT_TC}`);
    c.restore();
  });
}

// 霓虹招牌：白天是彩色的字，晚上會亮、偶爾閃一下
function neon(c: CanvasRenderingContext2D, s: string, x: number, y: number, col: string, rgb: string, size: number, d: DrawCtx, flick = 0): void {
  const on = !d.night || Math.sin(d.seconds * 7 + flick) > -0.92;
  if (d.night && on) glow(c, x, y, size * s.length * 0.45 + 10, rgb, 0.35);
  text(c, s, x, y, d.night ? (on ? '#ffffff' : col) : col, `900 ${size}px ${FONT_TC}`);
  if (d.night && on) {
    c.globalAlpha = 0.6;
    text(c, s, x, y, col, `900 ${size}px ${FONT_TC}`);
    c.globalAlpha = 1;
  }
}

const SOUVENIR: Front = { key: 'souvenir', x0: LA.souvenir.x0, x1: LA.souvenir.x1, h: 72, wall: '#f2d7c4', trim: '#2a8a8a' };
const DINER: Front = { key: 'diner', x0: LA.diner.x0, x1: LA.diner.x1, h: 64, wall: '#f4efe2', trim: '#c0392b' };
const RECORDS: Front = { key: 'records', x0: LA.records.x0, x1: LA.records.x1, h: 62, wall: '#9ec9d6', trim: '#3a4a7a' };

function drawBlvd(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const by = LA.blvdLine * T;
  blit(c, frontSprite(SOUVENIR, '#2a8a8a'), SOUVENIR.x0 * T, by);
  px(c, '#15171f', SOUVENIR.x0 * T + 8, by - 52, (SOUVENIR.x1 - SOUVENIR.x0) * T - 16, 12);
  neon(c, 'SOUVENIRS', ((SOUVENIR.x0 + SOUVENIR.x1) / 2) * T, by - 46, '#ffd23f', '255, 210, 63', 8, d, 1);
  blit(c, theatreSprite(), LA.theatre.x0 * T, by);
  blit(c, frontSprite(DINER, '#c0392b'), DINER.x0 * T, by);
  // 餐館的斜招牌（50 年代的 googie 風格）
  const dx = ((DINER.x0 + DINER.x1) / 2) * T;
  c.fillStyle = '#15171f';
  c.beginPath();
  c.moveTo(dx - 36, by - 56);
  c.lineTo(dx + 40, by - 64);
  c.lineTo(dx + 40, by - 48);
  c.lineTo(dx - 36, by - 42);
  c.fill();
  neon(c, 'DINER', dx + 2, by - 52, '#ff5a4a', '255, 90, 74', 11, d, 2);
  star(c, dx + 46, by - 66, 6, 2.5, d.night ? '#fff6c8' : '#f6c945');
  blit(c, hotelSprite(), LA.hotel.x0 * T, by);
  // 旅館直立的霓虹招牌
  const hx = LA.hotel.x1 * T - 14;
  px(c, '#15171f', hx - 6, by - 110, 12, 62);
  'HOTEL'.split('').forEach((ch, k) => neon(c, ch, hx, by - 102 + k * 11, '#5ad6ff', '90, 214, 255', 9, d, 3 + k * 0.2));
  blit(c, metroSprite(), LA.metro.x0 * T, by);
  blit(c, frontSprite(RECORDS, '#3a4a7a'), RECORDS.x0 * T, by);
  px(c, '#15171f', RECORDS.x0 * T + 6, by - 46, (RECORDS.x1 - RECORDS.x0) * T - 12, 11);
  neon(c, 'RECORDS', ((RECORDS.x0 + RECORDS.x1) / 2) * T, by - 40.5, '#ff6ad5', '255, 106, 213', 7, d, 4);
}

// ── 高高的細長棕櫚樹（洛杉磯的招牌風景）：細樹幹、頂上一小簇葉子、下面一圈枯葉裙 ──
function drawTallPalm(c: CanvasRenderingContext2D, x: number, y: number, h: number, seconds: number, lean = 0): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 6, by - 1, 12, 3);
  for (let k = 0; k < h; k += 2) {
    const off = Math.round(lean * (k / h) * (k / h) * 8);
    px(c, k % 4 ? '#7a6248' : '#6a5440', cx - 1 + off, by - k - 2, k < 10 ? 4 : 3, 2);
  }
  const tx = cx + Math.round(lean * 8);
  const top = by - h;
  px(c, '#8a6a40', tx - 3, top, 7, 8);
  px(c, '#6e5232', tx - 2, top + 6, 5, 3);
  const sway = Math.sin(seconds * 0.9 + x) * 1.5;
  for (const [dx, dy, col] of [[-13, 6, '#3f7a3a'], [13, 6, '#3f7a3a'], [-10, -2, '#4f8a46'], [10, -2, '#4f8a46'], [-4, -7, '#5a9a52'], [5, -7, '#5a9a52'], [-15, 11, '#356a32'], [15, 11, '#356a32']] as const) {
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(tx, top);
    c.quadraticCurveTo(tx + dx / 2 + sway, top + dy - 7, tx + dx + sway, top + dy);
    c.stroke();
  }
}

// ── 好萊塢大道的路燈（雙球形的老街燈）──
function drawBlvdLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 3, by - 1, 8, 2);
  px(c, '#2f3a34', cx, by - 30, 3, 30);
  px(c, '#2f3a34', cx - 2, by - 4, 7, 4);
  px(c, '#2f3a34', cx - 6, by - 30, 15, 2);
  for (const dx of [-6, 7]) {
    px(c, night ? '#fff6c8' : '#e8e4d4', cx + dx - 2, by - 37, 6, 7);
    px(c, 'rgba(255,255,255,0.6)', cx + dx - 1, by - 36, 2, 2);
  }
  if (night) glow(c, cx + 1, by - 33, 16, '255, 230, 160', 0.45);
}

// ── 塔可餐車：白色廂型車、開著的窗口（老闆在裡面）、條紋遮陽棚、彩色的紙雕旗（papel picado）──
function truckSprite(): HTMLCanvasElement {
  return cached('la-truck', 80, 56, (c) => {
    const h = 56;
    px(c, 'rgba(0,0,0,0.25)', 2, h - 3, 76, 3);
    // 車頭（左邊）
    px(c, '#f4f1ea', 0, h - 30, 18, 24);
    px(c, '#9fd8ff', 2, h - 27, 12, 9);
    px(c, '#d0ccc0', 0, h - 9, 18, 3);
    px(c, '#fff3b0', 1, h - 14, 3, 3);
    // 車廂
    px(c, '#f4f1ea', 16, h - 46, 64, 40);
    px(c, '#e25a4a', 16, h - 14, 64, 3);
    px(c, '#2bb673', 16, h - 11, 64, 2);
    px(c, '#d8d2c4', 16, h - 46, 64, 2);
    // 窗口（裡面暗暗的、老闆另外畫）
    px(c, '#6a5a4a', 28, h - 38, 40, 18);
    px(c, '#3a2e28', 29, h - 37, 38, 16);
    // 車頂的招牌
    px(c, '#15171f', 26, h - 56, 44, 10);
    text(c, 'TACOS', 48, h - 51, '#ffd23f', `900 8px ${FONT_TC}`);
    // 車身側面的菜單板、辣椒
    px(c, '#2a2d33', 70, h - 36, 8, 14);
    for (let y = h - 34; y < h - 24; y += 3) px(c, '#e8e4da', 71, y, 6, 1);
    px(c, '#c0392b', 20, h - 30, 5, 3);
    px(c, '#2bb673', 24, h - 31, 2, 2);
    // 輪子
    for (const x of [8, 58]) {
      px(c, '#15171f', x, h - 8, 12, 7);
      px(c, '#9aa0a8', x + 4, h - 6, 4, 3);
    }
  });
}
const TRUCK_OWNER = lookColors(2, 1, { body: 1 });
function drawTruck(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(LA.truck.x * T) - 40;
  const by = Math.round(LA.truck.y * T);
  const top = by - 56;
  blit(c, truckSprite(), x0, by);
  // 老闆（從窗口探頭）
  const owner = getAvatarFrame(TRUCK_OWNER, 'down', 'idle');
  c.save();
  c.beginPath();
  c.rect(x0 + 29, top + 19, 38, 16);
  c.clip();
  c.drawImage(owner, x0 + 40, top + 20);
  c.restore();
  // 遮陽棚、檯面、紙雕旗
  for (let k = 0; k < 44; k += 6) px(c, (k / 6) % 2 === 0 ? '#e07a1f' : '#f4f1e8', x0 + 26 + k, top + 14, 6, 5);
  px(c, '#9aa3b2', x0 + 26, top + 35, 44, 3);
  px(c, '#d6dae2', x0 + 26, top + 35, 44, 1);
  for (let k = 0; k < 5; k += 1) px(c, ['#f6c945', '#e25a4a', '#2bb673', '#c98a3c', '#f4efe2'][k] ?? '#fff', x0 + 30 + k * 8, top + 33, 5, 2);
  const pc = ['#ff5a8a', '#ffd23f', '#5ad6ff', '#7aee6a', '#ff8a3a', '#b07aff'];
  for (let k = 0; k < 9; k += 1) {
    const fx = x0 + 22 + k * 6;
    const fy = top + 10 + Math.sin(k * 0.9) + Math.sin(d.seconds * 2 + k) * 0.6;
    c.fillStyle = pc[k % pc.length] ?? '#ff5a8a';
    c.beginPath();
    c.moveTo(fx, fy);
    c.lineTo(fx + 5, fy);
    c.lineTo(fx + 2.5, fy + 5);
    c.fill();
  }
  // 冒煙（烤肉）
  for (let k = 0; k < 2; k += 1) {
    const t = (d.seconds * 0.5 + k / 2) % 1;
    px(c, `rgba(255,255,255,${0.45 * (1 - t)})`, Math.round(x0 + 40 + k * 14 + Math.sin(d.seconds * 2 + k) * 2), Math.round(top + 2 - t * 14), 3, 2);
  }
  if (d.night) glow(c, x0 + 48, top + 28, 30, '255, 200, 130', 0.4);
}

// ── 漢堡攤：50 年代的 googie 小店（斜屋頂、星星招牌柱）──
function burgerSprite(): HTMLCanvasElement {
  return cached('la-burger', 72, 76, (c) => {
    const h = 76;
    px(c, 'rgba(0,0,0,0.22)', 4, h - 3, 64, 3);
    // 招牌柱
    px(c, '#c9ccd2', 60, 8, 4, h - 8);
    px(c, '#f6c945', 40, 14, 32, 20);
    px(c, '#c0392b', 40, 14, 32, 3);
    // 小店：白牆、大玻璃、紅條
    px(c, '#f4f1ea', 6, h - 34, 54, 34);
    px(c, '#9fd8ff', 10, h - 30, 46, 14);
    for (let x = 10; x < 56; x += 9) px(c, '#c9ccd2', x, h - 30, 1, 14);
    px(c, '#c0392b', 6, h - 14, 54, 3);
    px(c, '#9aa3b2', 6, h - 16, 54, 2);
    px(c, '#e8e4da', 6, h - 11, 54, 11);
    // 斜屋頂（迴力鏢形）
    c.fillStyle = '#e25a4a';
    c.beginPath();
    c.moveTo(0, h - 32);
    c.lineTo(64, h - 44);
    c.lineTo(66, h - 40);
    c.lineTo(2, h - 28);
    c.fill();
    px(c, '#f4f1ea', 6, h - 38, 3, 6);
  });
}
const BURGER_COOK = lookColors(0, 3, { body: 0 });
function drawBurger(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(LA.burger.x * T) - 34;
  const by = Math.round(LA.burger.y * T);
  const top = by - 76;
  blit(c, burgerSprite(), x0, by);
  const cook = getAvatarFrame(BURGER_COOK, 'down', 'idle');
  c.save();
  c.beginPath();
  c.rect(x0 + 10, top + 46, 46, 14);
  c.clip();
  c.drawImage(cook, x0 + 26, top + 44);
  c.restore();
  // 招牌（晚上會亮）、星星
  neon(c, 'BURGERS', x0 + 56, top + 25, '#c0392b', '255, 90, 74', 6, d, 5);
  star(c, x0 + 62, top + 4, 7, 3, d.night ? '#fff6c8' : '#f6c945');
  if (d.night) glow(c, x0 + 33, top + 52, 30, '255, 220, 160', 0.35);
}

// ── 野餐桌（木頭桌面＋前面的長凳；後面坐的人畫在桌子之前）──
function drawPicnicTable(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const half = Math.round(1.3 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 1, half * 2, 3);
  px(c, '#7a5534', cx - half + 4, by - 6, 3, 7);
  px(c, '#7a5534', cx + half - 7, by - 6, 3, 7);
  px(c, '#a8703f', cx - half, by - 11, half * 2, 5);
  px(c, '#c48a52', cx - half, by - 11, half * 2, 1);
  for (let k = cx - half + 8; k < cx + half; k += 8) px(c, '#8a5a32', k, by - 11, 1, 5);
  px(c, '#a8703f', cx - half + 2, by - 1, half * 2 - 4, 3);
  // 桌上的塔可、汽水
  px(c, '#f0c860', cx - 12, by - 13, 7, 2);
  px(c, '#4f8a3c', cx - 11, by - 14, 5, 1);
  px(c, '#e25a4a', cx + 6, by - 15, 3, 4);
}

// ── 吉拿棒推車 ──
function drawChurroCart(c: CanvasRenderingContext2D, d: DrawCtx): void {
  drawFoodCart(c, LA.churro.x, LA.churro.y, 'Churros', '#e07a1f', ['#c98a3c', '#d99a4c', '#c98a3c', '#d99a4c'], d.seconds, 83);
}

// ── 碼頭入口的藍色拱門招牌 ──
function drawPierArch(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(LA.deck.x0 * T) + 2;
  const x1 = Math.round(LA.deck.x1 * T) - 2;
  const by = Math.round(LA.arch.y * T);
  const cx = (x0 + x1) / 2;
  for (const x of [x0, x1 - 4]) {
    px(c, 'rgba(0,0,0,0.25)', x - 1, by, 6, 2);
    px(c, '#e8e4da', x, by - 40, 4, 40);
  }
  c.fillStyle = '#1f4e9c';
  c.beginPath();
  c.moveTo(x0 - 6, by - 36);
  c.lineTo(x0 - 6, by - 50);
  c.quadraticCurveTo(cx, by - 70, x1 + 6, by - 50);
  c.lineTo(x1 + 6, by - 36);
  c.closePath();
  c.fill();
  c.strokeStyle = d.night ? '#bfe9ff' : '#f4f1ea';
  c.lineWidth = 1.5;
  c.stroke();
  neon(c, 'SANTA MONICA', cx, by - 52, '#f4f1ea', '160, 220, 255', 9, d, 6);
  neon(c, 'PIER', cx, by - 42, '#ffd23f', '255, 210, 63', 7, d, 7);
}

// ── 66 號公路終點招牌 ──
function drawRoute66(c: CanvasRenderingContext2D): void {
  const cx = Math.round(LA.route66.x * T);
  const by = Math.round(LA.route66.y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 14, by, 28, 2);
  px(c, '#6a6a6a', cx - 12, by - 22, 2, 22);
  px(c, '#6a6a6a', cx + 10, by - 22, 2, 22);
  px(c, '#4a3020', cx - 22, by - 52, 44, 32);
  px(c, '#f4efe2', cx - 21, by - 51, 42, 30);
  text(c, 'SANTA MONICA', cx, by - 46, '#2a2a2a', `900 5px ${FONT_TC}`);
  // 美國公路盾牌
  c.fillStyle = '#2a2a2a';
  c.beginPath();
  c.moveTo(cx - 8, by - 42);
  c.lineTo(cx + 8, by - 42);
  c.lineTo(cx + 8, by - 34);
  c.quadraticCurveTo(cx + 8, by - 28, cx, by - 27);
  c.quadraticCurveTo(cx - 8, by - 28, cx - 8, by - 34);
  c.closePath();
  c.fill();
  c.fillStyle = '#f4efe2';
  c.beginPath();
  c.moveTo(cx - 6.5, by - 40.5);
  c.lineTo(cx + 6.5, by - 40.5);
  c.lineTo(cx + 6.5, by - 34);
  c.quadraticCurveTo(cx + 6.5, by - 29.5, cx, by - 28.5);
  c.quadraticCurveTo(cx - 6.5, by - 29.5, cx - 6.5, by - 34);
  c.closePath();
  c.fill();
  text(c, '66', cx, by - 34, '#2a2a2a', `900 8px ${FONT_TC}`);
  text(c, 'END OF THE TRAIL', cx, by - 24.5, '#2a2a2a', `900 4.5px ${FONT_TC}`);
}

// ── 雲霄飛車（碼頭上的遊樂園）：紅色軌道、白色支架、跑來跑去的車廂 ──
const CO_W = Math.round((LA.coaster.x1 - LA.coaster.x0) * T);
const coasterTop = (u: number) => 18 + 14 * Math.abs(Math.sin(u * Math.PI * 2.2)) + (u < 0.25 ? 10 * (u / 0.25) : 10);
function coasterSprite(): HTMLCanvasElement {
  return cached('la-coaster', CO_W, 54, (c) => {
    const h = 54;
    // 回程的低軌道
    for (let x = 0; x < CO_W; x += 8) px(c, '#e8e4da', x, h - 10, 1, 10);
    px(c, '#2a8a8a', 0, h - 11, CO_W, 2);
    // 高的軌道＋支架
    for (let x = 2; x < CO_W - 2; x += 6) {
      const y = h - coasterTop(x / CO_W);
      px(c, '#f4f1ea', x, Math.round(y) + 2, 1, Math.round(h - y - 2));
    }
    c.strokeStyle = '#d8382a';
    c.lineWidth = 2;
    c.beginPath();
    for (let x = 0; x <= CO_W; x += 2) {
      const y = h - coasterTop(x / CO_W);
      if (x === 0) c.moveTo(x, y);
      else c.lineTo(x, y);
    }
    c.stroke();
    // 乘車的小站
    px(c, '#f4f1ea', 0, h - 18, 18, 18);
    px(c, '#2a8a8a', -2, h - 22, 22, 4);
  });
}
function drawCoaster(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(LA.coaster.x0 * T);
  const by = Math.round(LA.coaster.y * T);
  blit(c, coasterSprite(), x0, by);
  const h = 54;
  const t = (d.seconds / 14) % 1;
  const cols = ['#f6c945', '#3b82f6', '#f6c945'];
  for (let k = 0; k < 3; k += 1) {
    let u = t * 2 - k * 0.025;
    u = ((u % 2) + 2) % 2;
    const out = u < 1;
    const xx = out ? u * CO_W : (2 - u) * CO_W;
    const yy = out ? h - coasterTop(xx / CO_W) : h - 11;
    px(c, cols[k] ?? '#f6c945', Math.round(x0 + xx - 3), Math.round(by - h + yy - 5), 7, 4);
    px(c, '#4a2f23', Math.round(x0 + xx - 1), Math.round(by - h + yy - 7), 2, 2);
  }
  if (d.night) for (let x = 4; x < CO_W; x += 10) {
    const y = h - coasterTop(x / CO_W);
    px(c, ['#ff5a4a', '#ffd23f', '#5ad6ff'][((x / 10) | 0) % 3] ?? '#fff', x0 + x, Math.round(by - h + y - 1), 2, 2);
  }
}

// ── 摩天輪（白色骨架、彩色的車廂；晚上 LED 會變色轉圈）──
function drawWheel(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cx = LA.wheel.x * T;
  const by = LA.wheel.y * T;
  const r = 50;
  const cy = by - r - 14;
  px(c, 'rgba(0,0,0,0.22)', cx - 26, by - 1, 52, 3);
  px(c, '#e8e4da', cx - 22, by - 6, 44, 6);
  c.strokeStyle = '#f4f1ea';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(cx - 20, by - 4);
  c.lineTo(cx, cy);
  c.lineTo(cx + 20, by - 4);
  c.stroke();
  const rot = d.seconds * 0.07;
  for (let k = 0; k < 20; k += 1) {
    const a = rot + (k / 20) * Math.PI * 2;
    c.strokeStyle = d.night ? `hsla(${(k * 18 + d.seconds * 60) % 360}, 90%, 65%, 0.9)` : 'rgba(240,236,226,0.8)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(cx, cy);
    c.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    c.stroke();
  }
  // 外圈：晚上一段段變色（像實際的 LED 燈秀）
  for (let k = 0; k < 40; k += 1) {
    const a0 = (k / 40) * Math.PI * 2;
    c.strokeStyle = d.night ? `hsl(${(k * 9 + d.seconds * 90) % 360}, 95%, 62%)` : '#f4f1ea';
    c.lineWidth = 3;
    c.beginPath();
    c.arc(cx, cy, r, a0, a0 + Math.PI / 20 + 0.01);
    c.stroke();
  }
  for (let k = 0; k < 20; k += 1) {
    const a = rot + (k / 20) * Math.PI * 2;
    const gx = cx + Math.cos(a) * r;
    const gy = cy + Math.sin(a) * r;
    const col = ['#e8402e', '#f6c945', '#3b82f6', '#2bb673', '#ff6ad5'][k % 5] ?? '#fff';
    px(c, '#9aa0a8', Math.round(gx), Math.round(gy), 1, 3);
    px(c, col, Math.round(gx - 3), Math.round(gy + 3), 7, 6);
    px(c, 'rgba(255,255,255,0.5)', Math.round(gx - 2), Math.round(gy + 4), 5, 2);
  }
  px(c, '#c9ccd2', cx - 4, cy - 4, 8, 8);
  if (d.night) glow(c, cx, cy, 80, '255, 160, 230', 0.25);
}

// ── 救生員塔（高腳的淺藍色小屋、斜坡）──
function drawLifeguard(c: CanvasRenderingContext2D): void {
  const cx = Math.round(LA.lifeguard.x * T);
  const by = Math.round(LA.lifeguard.y * T);
  px(c, 'rgba(0,0,0,0.18)', cx - 16, by - 1, 34, 4);
  for (const x of [cx - 13, cx - 5, cx + 5, cx + 12]) px(c, '#c9ccd2', x, by - 20, 2, 20);
  px(c, '#c9ccd2', cx - 14, by - 12, 28, 1);
  // 斜坡
  c.strokeStyle = '#e8e4da';
  c.lineWidth = 3;
  c.beginPath();
  c.moveTo(cx + 14, by - 20);
  c.lineTo(cx + 28, by);
  c.stroke();
  px(c, '#f4f1ea', cx - 17, by - 22, 34, 3);
  px(c, '#8fd0e8', cx - 14, by - 40, 28, 18);
  px(c, '#f4f1ea', cx - 14, by - 40, 28, 2);
  px(c, '#2e3a48', cx - 10, by - 35, 20, 7);
  px(c, 'rgba(255,255,255,0.4)', cx - 9, by - 34, 6, 2);
  c.fillStyle = '#f4f1ea';
  c.beginPath();
  c.moveTo(cx - 18, by - 40);
  c.lineTo(cx, by - 48);
  c.lineTo(cx + 18, by - 40);
  c.fill();
  px(c, '#e8402e', cx - 2, by - 56, 1, 8);
  px(c, '#e8402e', cx - 1, by - 56, 6, 4);
}

// ── 海浪、夕陽的倒影（會閃）──
function drawSea(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  c.beginPath();
  c.rect(0, (LA.sea - 0.6) * T, W, (LA.H - LA.sea + 0.6) * T);
  c.clip();
  drawSeaWaves(c, 0, LA.platform.x0, LA.sea, LA.H, d.seconds);
  drawSeaWaves(c, LA.platform.x1, LA.W, LA.sea, LA.H, d.seconds);
  // 平台下面、碼頭兩邊的水光（沒有浪打上岸的白線）
  for (let i = 0; i < 18; i += 1) {
    const x = LA.deck.x1 + 0.4 + (((i * 53 + d.seconds * (4 + (i % 3))) % ((LA.platform.x1 - LA.deck.x1 - 0.8) * T)) / T);
    const y = LA.platform.y1 + 0.6 + ((i * 29) % 37) / 10;
    px(c, `rgba(235,250,255,${0.3 + 0.2 * Math.sin(d.seconds * 1.3 + i)})`, Math.round(x * T), Math.round(y * T), 6, 1);
  }
  // 夕陽灑在海上的金色光帶
  for (let i = 0; i < 26; i += 1) {
    const y = LA.sea + 0.5 + ((i * 41) % 73) / 10;
    const spread = 2 + ((y - LA.sea) / (LA.H - LA.sea)) * 5;
    const x = 15 + Math.sin(i * 2.3 + d.seconds * 0.7) * spread;
    const a = 0.35 + 0.35 * Math.sin(d.seconds * 2.1 + i * 1.7);
    px(c, d.night ? `rgba(255,240,200,${a * 0.5})` : `rgba(255,214,140,${a})`, Math.round(x * T), Math.round(y * T), 8 + (i % 3) * 4, 1);
  }
  c.restore();
}

// ── 自行車道上溜滑板、騎腳踏車的路人；大道上的敞篷車、觀光巴士（用時間算，大家看到的一樣）──
const RIDERS = [
  { kind: 'bike' as const, y: 31.55, speed: 2.2, phase: 0, dir: 1 as const, colors: lookColors(1, 2, { body: 0 }), frame: '#3b82f6' },
  { kind: 'skate' as const, y: 31.75, speed: 1.6, phase: 0.4, dir: 1 as const, colors: lookColors(3, 0, { body: 1 }), frame: '#c98a3c' },
  { kind: 'bike' as const, y: 32.2, speed: 1.9, phase: 0.7, dir: -1 as const, colors: lookColors(0, 4, { body: 1 }), frame: '#e25a4a' },
  { kind: 'skate' as const, y: 32.25, speed: 1.4, phase: 0.15, dir: -1 as const, colors: lookColors(4, 1, { body: 0 }), frame: '#2bb673' },
];
const SPAN = LA.W + 8;
function laneX(seconds: number, speed: number, phase: number, dir: 1 | -1): number {
  const k = ((seconds * speed) / SPAN + phase) % 1;
  return dir > 0 ? -4 + k * SPAN : LA.W + 4 - k * SPAN;
}
function clipMap(c: CanvasRenderingContext2D, draw: () => void): void {
  c.save();
  c.beginPath();
  c.rect(0, 0, W, LA.H * T);
  c.clip();
  draw();
  c.restore();
}
function drawRider(c: CanvasRenderingContext2D, r: (typeof RIDERS)[number], d: DrawCtx): void {
  const x = laneX(d.seconds, r.speed, r.phase, r.dir);
  const cx = Math.round(x * T);
  const by = Math.round(r.y * T);
  const facing = r.dir > 0 ? 'right' : 'left';
  if (r.kind === 'skate') {
    const av = getAvatarFrame(r.colors, facing, 'idle');
    px(c, 'rgba(0,0,0,0.25)', cx - 7, by + 1, 14, 2);
    c.drawImage(av, cx - 8, by - 3 - av.height + 2);
    px(c, r.frame, cx - 7, by - 2, 14, 2);
    px(c, '#15171f', cx - 5, by, 2, 2);
    px(c, '#15171f', cx + 3, by, 2, 2);
    return;
  }
  const av = getAvatarFrame(r.colors, facing, Math.floor(d.seconds * 4) % 2 ? 'walkA' : 'walkB');
  px(c, 'rgba(0,0,0,0.25)', cx - 10, by + 1, 20, 2);
  c.drawImage(av, 0, 0, av.width, 15, cx - 8, by - 22, av.width, 15);
  c.strokeStyle = '#15171f';
  c.lineWidth = 1.5;
  for (const dx of [-6, 6]) {
    c.beginPath();
    c.arc(cx + dx, by - 3, 4, 0, Math.PI * 2);
    c.stroke();
  }
  c.strokeStyle = r.frame;
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(cx - 6, by - 3);
  c.lineTo(cx - 1, by - 8);
  c.lineTo(cx + 6, by - 3);
  c.moveTo(cx - 1, by - 8);
  c.lineTo(cx + 4 * r.dir, by - 10);
  c.stroke();
}

const CARS = [
  { kind: 'convertible' as const, y: 20.3, speed: 3.2, phase: 0.1, dir: -1 as const, color: '#d8382a' },
  { kind: 'tour' as const, y: 21.8, speed: 2.4, phase: 0.55, dir: 1 as const, color: '#f4f1ea' },
  { kind: 'convertible' as const, y: 21.8, speed: 3, phase: 0.05, dir: 1 as const, color: '#5ad6c8' },
];
function drawCar(c: CanvasRenderingContext2D, car: (typeof CARS)[number], d: DrawCtx): void {
  const cx = Math.round(laneX(d.seconds, car.speed, car.phase, car.dir) * T);
  const by = Math.round(car.y * T);
  const dir = car.dir;
  if (car.kind === 'tour') {
    // 敞篷的觀光巴士（上層坐滿看明星住宅的遊客）
    px(c, 'rgba(0,0,0,0.3)', cx - 24, by - 1, 48, 3);
    px(c, car.color, cx - 23, by - 18, 46, 16);
    px(c, '#2a8a8a', cx - 23, by - 8, 46, 3);
    px(c, '#2e3a48', cx - 20, by - 15, 40, 5);
    for (let k = -18; k < 18; k += 6) {
      px(c, ['#4a2f23', '#e8c070', '#2a2a2a', '#a05a2a'][((k + 18) / 6) % 4] ?? '#4a2f23', cx + k, by - 23, 4, 4);
      px(c, ['#3b82f6', '#e25a4a', '#f6c945', '#2bb673'][((k + 18) / 6) % 4] ?? '#3b82f6', cx + k, by - 19, 4, 2);
    }
    px(c, '#c9ccd2', cx - 23, by - 19, 46, 1);
    text(c, 'TOURS', cx, by - 5.5, '#f4f1ea', `900 4px ${FONT_TC}`);
    for (const dx of [-15, 11]) px(c, '#15171f', cx + dx, by - 3, 6, 4);
    px(c, '#fff3b0', cx + dir * 22, by - 10, 2, 3);
    if (d.night) glow(c, cx + dir * 30, by - 8, 14, '255, 240, 180', 0.35);
    return;
  }
  // 敞篷車（兩個人、一塊衝浪板）
  px(c, 'rgba(0,0,0,0.3)', cx - 16, by - 1, 32, 3);
  px(c, car.color, cx - 15, by - 10, 30, 8);
  px(c, 'rgba(255,255,255,0.3)', cx - 15, by - 10, 30, 1);
  px(c, '#9fd8ff', cx + dir * 4 - 1, by - 14, 2, 4);
  px(c, '#4a2f23', cx - 3 - dir * 3, by - 15, 4, 5);
  px(c, '#e8c070', cx - 3 - dir * 9, by - 15, 4, 5);
  px(c, '#f6e3a0', cx - 14, by - 13, 22, 2);
  px(c, '#e25a4a', cx - 14, by - 13, 22, 1);
  px(c, '#15171f', cx - 11, by - 3, 6, 3);
  px(c, '#15171f', cx + 5, by - 3, 6, 3);
  px(c, '#fff3b0', cx + dir * 14, by - 8, 2, 2);
  if (d.night) glow(c, cx + dir * 22, by - 6, 12, '255, 240, 180', 0.3);
}

// 野餐區的燈泡串（兩根木柱）
function drawPicnicLights(c: CanvasRenderingContext2D, d: DrawCtx): void {
  for (const x of [1.4, 17.4]) {
    px(c, 'rgba(0,0,0,0.2)', Math.round(x * T) - 2, 30.6 * T, 5, 2);
    px(c, '#7a5534', Math.round(x * T), Math.round(27.2 * T), 2, Math.round(3.4 * T));
  }
  drawStringLights(c, 1.4, 17.4, 27.2, d.night, 4);
}

function drawSeat(c: CanvasRenderingContext2D, i: number): void {
  const s = LOSANGELES_SEATS[i];
  if (!s || i < 8) return;
  // 野餐桌後面的長凳
  px(c, '#8a5a32', Math.round(s.x * T) - 9, Math.round(s.y * T) - 3, 18, 3);
  px(c, '#a8703f', Math.round(s.x * T) - 9, Math.round(s.y * T) - 3, 18, 1);
}

// 星光大道、海邊步道的路燈；棕櫚樹（x、y、高度、往哪邊歪）
const LAMPS: [number, number][] = [[2.6, 18.7], [16.4, 18.7], [28, 18.7], [39.5, 18.7], [55.5, 18.7], [3, 23.3], [22, 23.3], [38.5, 23.3], [52, 23.3], [LA.deck.x0 + 0.3, 30.5], [LA.deck.x1 - 0.6, 30.5], [LA.platform.x0 + 0.3, 41.2]];
const PALMS: [number, number, number, number][] = [
  [8.2, 15.3, 74, 0.3], [24, 15.3, 84, -0.2], [43.4, 15.3, 90, 0.4], [52.6, 15.3, 70, -0.3],
  [20.6, 24.6, 96, 0.2], [26.4, 24.6, 104, -0.3], [41.6, 24.6, 100, 0.3], [46.6, 24.6, 92, -0.2], [51.6, 24.6, 106, 0.2], [56.4, 24.6, 96, -0.4],
  [43, 30.4, 78, 0.4], [49, 30.4, 86, -0.2], [54.6, 30.4, 80, 0.3], [21, 30.4, 72, -0.3],
];

const props: CityProp[] = [
  { y: LA.blvdLine, draw: (c, d) => drawBlvd(c, d) },
  ...WALK_BENCHES.map((x): CityProp => ({ y: WALK_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, WALK_BENCH_Y, 2.6) })),
  ...CARS.map((car): CityProp => ({ y: car.y, draw: (c, d) => clipMap(c, () => drawCar(c, car, d)) })),
  { y: LA.truck.y, draw: (c, d) => drawTruck(c, d) },
  { y: LA.burger.y, draw: (c, d) => drawBurger(c, d) },
  { y: LA.churro.y, draw: (c, d) => drawChurroCart(c, d) },
  ...PICNIC_TABLES.map((x): CityProp => ({ y: PICNIC_Y, draw: (c) => drawPicnicTable(c, x, PICNIC_Y) })),
  { y: 30.62, draw: (c, d) => drawPicnicLights(c, d) },
  { y: LA.arch.y, draw: (c, d) => drawPierArch(c, d) },
  { y: LA.route66.y, draw: (c) => drawRoute66(c) },
  ...RIDERS.map((r): CityProp => ({ y: r.y, draw: (c, d) => clipMap(c, () => drawRider(c, r, d)) })),
  { y: LA.lifeguard.y, draw: (c) => drawLifeguard(c) },
  { y: BEACH_BENCH.y - 0.01, draw: (c) => drawBench(c, BEACH_BENCH.x, BEACH_BENCH.y, 2.6) },
  { y: LA.coaster.y, draw: (c, d) => drawCoaster(c, d) },
  { y: LA.wheel.y, draw: (c, d) => drawWheel(c, d) },
  { y: LA.sea, draw: (c, d) => drawSea(c, d) },
  { y: PIER_BENCH.y - 0.01, draw: (c) => drawBench(c, PIER_BENCH.x, PIER_BENCH.y, 2.6) },
  ...PALMS.map(([x, y, h, lean]): CityProp => ({ y, draw: (c, d) => drawTallPalm(c, x, y, h, d.seconds, lean) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawBlvdLamp(c, x, y, d.night) })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const P = LA.platform;
const solid: Rect[] = [
  r(0, 0, LA.W, LA.blvdLine - 0.1),
  ...WALK_BENCHES.map((x) => r(x - 1.3, WALK_BENCH_Y - 0.75, x + 1.3, WALK_BENCH_Y - 0.45)),
  r(LA.truck.x - 2.5, LA.truck.y - 1.3, LA.truck.x + 2.5, LA.truck.y - 0.05),
  r(LA.burger.x - 2.1, LA.burger.y - 1.3, LA.burger.x + 2.1, LA.burger.y - 0.05),
  r(LA.churro.x - 1.25, LA.churro.y - 0.8, LA.churro.x + 1.25, LA.churro.y - 0.05),
  ...PICNIC_TABLES.map((x) => r(x - 1.3, PICNIC_Y - 0.4, x + 1.3, PICNIC_Y)),
  r(1.2, 30.3, 1.7, 30.65),
  r(17.2, 30.3, 17.7, 30.65),
  r(LA.deck.x0, LA.arch.y - 0.3, LA.deck.x0 + 0.5, LA.arch.y),
  r(LA.deck.x1 - 0.5, LA.arch.y - 0.3, LA.deck.x1, LA.arch.y),
  r(LA.route66.x - 0.9, LA.route66.y - 0.3, LA.route66.x + 0.9, LA.route66.y),
  r(LA.lifeguard.x - 1.1, LA.lifeguard.y - 0.5, LA.lifeguard.x + 1.1, LA.lifeguard.y),
  r(LA.coaster.x0, LA.coaster.y - 1.2, LA.coaster.x1, LA.coaster.y - 0.05),
  r(LA.wheel.x - 1.6, LA.wheel.y - 0.6, LA.wheel.x + 1.6, LA.wheel.y - 0.05),
  r(BEACH_BENCH.x - 1.3, BEACH_BENCH.y - 0.75, BEACH_BENCH.x + 1.3, BEACH_BENCH.y - 0.45),
  r(PIER_BENCH.x - 1.3, PIER_BENCH.y - 0.75, PIER_BENCH.x + 1.3, PIER_BENCH.y - 0.45),
  ...PALMS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.05)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.25, y + 0.05)),
];
// 海不能走：只有碼頭的平台和伸進海裡的木棧橋可以
const blocked = (x: number, y: number): boolean => {
  if (y < LA.sea - 0.2) return false;
  const onPlatform = x > P.x0 + 0.2 && x < P.x1 - 0.2 && y < P.y1 - 0.3;
  const onTail = x > LA.tail.x0 + 0.2 && x < LA.tail.x1 - 0.2;
  return !onPlatform && !onTail;
};

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 1, y: y * T - 33, r: 38 })),
  { x: ((SOUVENIR.x0 + SOUVENIR.x1) / 2) * T, y: LA.blvdLine * T - 46, r: 60, color: 'rgba(255, 210, 90, 0.4)' },
  { x: ((LA.theatre.x0 + LA.theatre.x1) / 2) * T, y: LA.blvdLine * T - 30, r: 110, color: 'rgba(255, 190, 120, 0.45)' },
  { x: ((DINER.x0 + DINER.x1) / 2) * T, y: LA.blvdLine * T - 50, r: 70, color: 'rgba(255, 90, 80, 0.45)' },
  { x: LA.hotel.x1 * T - 14, y: LA.blvdLine * T - 80, r: 70, color: 'rgba(90, 214, 255, 0.4)' },
  { x: ((LA.metro.x0 + LA.metro.x1) / 2) * T, y: LA.blvdLine * T - 20, r: 80, color: 'rgba(220, 235, 255, 0.4)' },
  { x: ((RECORDS.x0 + RECORDS.x1) / 2) * T, y: LA.blvdLine * T - 40, r: 55, color: 'rgba(255, 106, 213, 0.4)' },
  { x: LA.observatory.x * T, y: LA.observatory.base * T - 24, r: 70, color: 'rgba(255, 245, 220, 0.45)' },
  { x: LA.truck.x * T, y: LA.truck.y * T - 26, r: 60, color: 'rgba(255, 190, 120, 0.5)' },
  { x: LA.burger.x * T, y: LA.burger.y * T - 30, r: 60, color: 'rgba(255, 220, 160, 0.45)' },
  { x: LA.churro.x * T, y: LA.churro.y * T - 14, r: 40, color: 'rgba(255, 180, 120, 0.5)' },
  { x: 9.4 * T, y: 27.6 * T, r: 120, color: 'rgba(255, 210, 150, 0.35)' },
  { x: ((LA.deck.x0 + LA.deck.x1) / 2) * T, y: LA.arch.y * T - 50, r: 70, color: 'rgba(150, 210, 255, 0.5)' },
  { x: LA.wheel.x * T, y: LA.wheel.y * T - 64, r: 120, color: 'rgba(255, 140, 220, 0.4)' },
  { x: ((LA.coaster.x0 + LA.coaster.x1) / 2) * T, y: LA.coaster.y * T - 30, r: 90, color: 'rgba(255, 200, 120, 0.35)' },
  { x: 39 * T, y: 39.5 * T, r: 90, color: 'rgba(255, 220, 160, 0.3)' },
];

const stationX = (LA.metro.x0 + LA.metro.x1) / 2;

export const LOSANGELES: CityDef = {
  id: 'losangeles',
  country: 'us',
  line: 'flight',
  W: LA.W,
  H: LA.H,
  title: { 'zh-TW': '洛杉磯 · 好萊塢與聖塔莫尼卡', 'en-US': 'Los Angeles · Hollywood & Santa Monica' },
  stop: { 'zh-TW': '洛杉磯（LAX 機場）', 'en-US': 'Los Angeles (LAX)' },
  emoji: '🌴',
  station: {
    x: stationX,
    y: LA.blvdLine + 0.7,
    name: { 'zh-TW': 'Metro 往 LAX', 'en-US': 'Metro to LAX' },
    arrive: { x: stationX + 2.5, y: LA.blvdLine + 1.2 },
  },
  background: '#eed8a6',
  soundscape: 'beach',
  paintGround: paintLosAngelesGround,
  props,
  solid,
  blocked,
  seats: LOSANGELES_SEATS,
  drawSeat: (c, i) => drawSeat(c, i),
  shops: LOSANGELES_SHOPS,
  infos: [
    {
      at: r(4.5, 2.5, 21, 6.5),
      title: { 'zh-TW': '好萊塢大字招牌', 'en-US': 'Hollywood Sign' },
      text: {
        'zh-TW': '1923 年為了賣山坡上的房子立的廣告，原本寫「HOLLYWOODLAND」，1949 年拿掉「LAND」變成城市的象徵。每個字母約 14 公尺高，立在李山（Mount Lee）南坡，不能走到字旁邊，從天文台看最清楚。',
        'en-US': 'Put up in 1923 to advertise a housing development as “HOLLYWOODLAND”; “LAND” came down in 1949 and it became the city’s icon. Each letter is about 14 m (45 ft) tall on Mount Lee — you can’t walk up to it, but Griffith Observatory has a great view.',
      },
    },
    {
      at: r(LA.observatory.x - 4.5, 4.5, LA.observatory.x + 4.5, LA.observatory.base + 0.4),
      title: { 'zh-TW': '葛瑞菲斯天文台', 'en-US': 'Griffith Observatory' },
      text: {
        'zh-TW': '1935 年開放的白色裝飾藝術風天文台，蓋在好萊塢山上，土地和經費來自捐地的葛瑞菲斯。進場免費，可以用望遠鏡看星星，也是看洛杉磯夜景和大字招牌的好地方，很多電影在這裡取景。',
        'en-US': 'The white Art Deco observatory opened in 1935 on Mount Hollywood, funded by Griffith J. Griffith’s bequest. Admission is free; look through its telescopes, or take in the city lights and the Hollywood Sign. It has starred in many films.',
      },
    },
    {
      at: r(0, LA.walk.y0, LA.W, LA.walk.y1),
      title: { 'zh-TW': '星光大道', 'en-US': 'Hollywood Walk of Fame' },
      text: {
        'zh-TW': '1960 年開始，好萊塢大道和藤街的人行道上已經鑲了 2,700 多顆星星：深色水磨石方塊裡一顆粉紅色的星，銅邊上刻著名字和代表電影、電視、音樂、廣播、舞台的小圖示。這裡的星星沒有寫名字。',
        'en-US': 'Since 1960, more than 2,700 stars have been set into the sidewalks of Hollywood Boulevard and Vine Street: coral-pink terrazzo stars on charcoal squares, rimmed in brass with a name and an emblem for film, TV, music, radio or theatre. The stars here are left blank.',
      },
    },
    {
      at: r(LA.theatre.x0, 8.5, LA.theatre.x1, LA.blvdLine + 1.2),
      title: { 'zh-TW': '中式戲院風格的電影院', 'en-US': 'Chinese-style Movie Palace' },
      text: {
        'zh-TW': '照好萊塢大道上那座 1927 年開幕、外型像中國寺廟的電影院畫的：銅綠色的寶塔屋頂、紅色大柱、門口的龍。前庭的水泥地上留著兩百多位明星的手印和腳印，是很多電影首映的地方。',
        'en-US': 'Modelled on the Hollywood Boulevard movie palace from 1927 built like a Chinese temple — bronze-green pagoda roof, red columns and a dragon over the doors. Its cement forecourt holds the hand- and footprints of some 200 stars, and premieres still happen here.',
      },
    },
    {
      at: r(LA.deck.x0, 22.5, LA.platform.x1, LA.platform.y1),
      title: { 'zh-TW': '聖塔莫尼卡碼頭', 'en-US': 'Santa Monica Pier' },
      text: {
        'zh-TW': '1909 年蓋的木造碼頭，入口的藍色拱門招牌是地標。碼頭上的遊樂園有摩天輪（晚上 LED 燈會變色）和雲霄飛車，旁邊的沙灘看夕陽最美。現實中好萊塢和聖塔莫尼卡相隔 20 多公里，這張地圖把它們放在一起了。',
        'en-US': 'The wooden pier from 1909, with its landmark blue entrance arch. The amusement park on it has a Ferris wheel (its LEDs change colour at night) and a roller coaster, and the beach beside it is the spot for sunsets. In reality Hollywood and Santa Monica are 20-plus km apart — this map squeezes them together.',
      },
    },
    {
      at: r(LA.route66.x - 1.5, LA.route66.y - 3.4, LA.route66.x + 1.5, LA.route66.y + 0.3),
      title: { 'zh-TW': '66 號公路終點', 'en-US': 'Route 66 · End of the Trail' },
      text: {
        'zh-TW': '1926 年通車的 66 號公路從芝加哥一路往西約 3,900 公里，被叫做「美國的母親之路」。碼頭上這塊「End of the Trail」招牌是 2009 年立的象徵性終點（官方的終點其實在附近的路口），很多人開完全程會來這裡拍照。',
        'en-US': 'Opened in 1926, Route 66 ran about 2,400 miles (3,900 km) west from Chicago — “the Mother Road”. This “End of the Trail” sign on the pier went up in 2009 as a symbolic finish (the official end is at a nearby intersection), and road-trippers come here for the photo.',
      },
    },
    {
      at: r(LA.metro.x0, 11, LA.metro.x1, LA.blvdLine),
      title: { 'zh-TW': '地鐵站（Metro）', 'en-US': 'Metro Station' },
      text: {
        'zh-TW': '好萊塢大道上的地鐵站入口，玻璃雨棚下的手扶梯直通地下月台。洛杉磯很大、平常大多開車，但搭 Metro 轉車也能到 LAX 機場。站到入口旁邊可以搭飛機去舊金山、拉斯維加斯、紐約，或飛回台灣。',
        'en-US': 'A Metro entrance on Hollywood Boulevard — escalators under a glass canopy lead down to the platforms. LA is huge and mostly drives, but Metro with a transfer gets you to LAX. Stand by the entrance to fly to San Francisco, Las Vegas, New York or home to Taiwan.',
      },
    },
  ],
  labels: [
    { x: 22.4, y: 35.2, text: { 'zh-TW': '🌅 海灘與碼頭（看夕陽的長椅）', 'en-US': '🌅 Beach & pier (sunset benches)' }, color: '#fdba74' },
    { x: 21, y: LA.road.y0 + 0.2, text: { 'zh-TW': '⭐ 星光大道（長椅）', 'en-US': '⭐ Walk of Fame (benches)' }, color: '#f9a8d4' },
    { x: 9, y: 31.3, text: { 'zh-TW': '🌮 塔可餐車野餐桌', 'en-US': '🌮 Taco truck picnic tables' }, color: '#fde68a' },
  ],
  walkers: [
    { x0: 1, y0: 17.7, x1: 57, y1: 17.7, count: 5 },
    { x0: 1, y0: 15.6, x1: 7, y1: 15.6, count: 1 },
    { x0: 1, y0: 22.8, x1: 57, y1: 22.8, count: 3 },
    { x0: 19.5, y0: 23.9, x1: 57, y1: 23.9, count: 2 },
    { x0: 32.5, y0: 24, x1: 32.5, y1: 44.5, count: 3 },
    { x0: 30.5, y0: 39.6, x1: 49, y1: 39.6, count: 2 },
    { x0: 1, y0: 34.4, x1: 28, y1: 34.4, count: 2 },
    { x0: 36, y0: 33.2, x1: 57, y1: 33.2, count: 1 },
  ],
  traffic: [
    { y: 19.6, dir: -1, x0: 0, x1: LA.W, count: 1 },
    { y: 21.1, dir: 1, x0: 0, x1: LA.W, count: 1 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點海灘、碼頭、星光大道的長椅或野餐桌坐下專注 · 走到餐車、攤子買塔可、捲餅、漢堡、吉拿棒 · 點地標看介紹 · Metro 往 LAX 飛舊金山、拉斯維加斯、紐約或回台灣',
    'en-US': 'WASD / arrows to move · click a beach, pier or Walk of Fame bench, or a picnic table, to focus · walk up to the truck and stalls for tacos, burritos, burgers and churros · click landmarks for info · Metro to LAX to fly to SF, Las Vegas, New York or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅或野餐桌坐下專注 · 走到攤子買東西 · 點地標看介紹 · Metro 往 LAX',
    'en-US': 'Tap a bench or picnic table to focus · visit the stalls · tap landmarks · Metro to LAX',
  },
};
