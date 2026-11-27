// 舊金山的美術：海灣（馬林岬角的山、金門大橋：國際橘的兩座塔和懸索，霧會從太平洋那邊飄進來蓋住橋塔；惡魔島：監獄和燈塔、
// 晚上燈塔會轉）、帆船和渡輪、海鷗、39 號碼頭（浮台上的海獅會叫、會翻身）、漁人碼頭（舵輪招牌、螃蟹攤、酸種麵包店、聖代店、
// BART 入口）、Hyde 街（叮噹車爬坡、轉車台）、九曲花街（紅磚彎路和繡球花）、阿拉莫廣場（Painted Ladies、遠方的泛美金字塔）。
// 最後組成 CityScene 用的 SANFRANCISCO。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { ALAMO_BENCH_Y, BENCHES, LOMBARD_PATH, SF, SF_SEATS, SF_SHOPS, lombardBlocked } from './sanfrancisco';
import { px, seeded } from './pixelUtil';
import { getAvatarFrame, lookColors } from './pixelArt';
import { T, FONT_TC, text, glow, cached, blit, road, tiles, zebra } from './cityArt';

const W = SF.W * T;
const ORANGE = '#c4402c';
const ORANGE_HI = '#e0583e';
const ORANGE_DK = '#8e2c20';

// ── 地面（畫一次）──
export function paintSfGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1849);
  // 天空
  const sky = c.createLinearGradient(0, 0, 0, 4 * T);
  sky.addColorStop(0, '#8fc2e6');
  sky.addColorStop(1, '#e4eef2');
  c.fillStyle = sky;
  c.fillRect(0, 0, W, 4 * T);
  // 海灣
  const water = c.createLinearGradient(0, 3 * T, 0, SF.shore * T);
  water.addColorStop(0, '#7aa6c0');
  water.addColorStop(0.4, '#4f88aa');
  water.addColorStop(1, '#2f6c92');
  c.fillStyle = water;
  c.fillRect(0, 3 * T, W, (SF.shore - 3) * T);
  for (let i = 0; i < 150; i += 1) {
    const y = 3.4 * T + rand() * (SF.shore - 3.4) * T;
    const len = 3 + ((y - 3 * T) / ((SF.shore - 3) * T)) * 9;
    px(c, 'rgba(255,255,255,0.22)', Math.floor(rand() * W), Math.floor(y), Math.round(len), 1);
  }
  paintHills(c, rand);
  paintBridge(c);
  paintAlcatraz(c, rand);
  paintWaterfront(c, rand);
  paintHyde(c);
  paintLombard(c, rand);
  paintSkyline(c, rand);
  paintPark(c, rand);
}

// 遠方的山：天使島（右邊淡淡的）、馬林岬角（金門大橋北端的山，乾草的金綠色）、左邊的要塞（Presidio）
function paintHills(c: CanvasRenderingContext2D, rand: () => number): void {
  const ridge = (pts: [number, number][], color: string) => {
    c.fillStyle = color;
    c.beginPath();
    const first = pts[0];
    if (!first) return;
    c.moveTo(first[0] * T, first[1] * T);
    for (const [x, y] of pts.slice(1)) c.lineTo(x * T, y * T);
    c.closePath();
    c.fill();
  };
  // 天使島、Tiburon
  ridge([[36, 4.2], [39, 3.0], [42, 2.4], [45, 2.7], [48, 2.2], [52, 2.9], [56, 3.1], [56, 4.2]], '#9fb4ae');
  ridge([[44, 4.2], [47, 3.4], [50, 3.6], [53, 3.2], [56, 3.6], [56, 4.2]], '#8ea79c');
  // 馬林岬角：從橋的北端往上，到右邊慢慢低下去
  ridge([[SF.bridge.right - 0.8, SF.bridge.water], [SF.bridge.right - 0.4, 6.6], [23.6, 4.6], [25.5, 2.4], [27.4, 1.6], [29.6, 2.2], [31.6, 1.8], [34.4, 2.6], [37, 3.6], [39, 4.3], [39, 4.6], [30, 5.6], [26, SF.bridge.water]], '#93955e');
  ridge([[SF.bridge.right - 0.4, 6.6], [23.6, 4.6], [25.5, 2.4], [27.4, 1.6], [26.6, 3.8], [25, 6.2], [24.4, SF.bridge.water], [SF.bridge.right - 0.8, SF.bridge.water]], '#7f8650');
  for (let i = 0; i < 60; i += 1) {
    const x = 22 + rand() * 16;
    const y = 2.4 + rand() * 3.6;
    px(c, rand() < 0.5 ? '#6f7a46' : '#a9a46a', Math.round(x * T), Math.round(y * T), 3 + Math.round(rand() * 4), 2);
  }
  // 山腳的海浪
  px(c, 'rgba(255,255,255,0.4)', Math.round((SF.bridge.right - 0.8) * T), Math.round(SF.bridge.water * T) - 1, Math.round(3.8 * T), 1);
  // 左邊：Presidio 的綠色崖、柏樹，崖下紅磚的 Fort Point
  ridge([[0, 4.6], [1.6, 4.9], [3.2, 5.8], [4.2, 7.2], [4.6, SF.bridge.water], [0, SF.bridge.water]], '#5f8a4e');
  for (let i = 0; i < 26; i += 1) {
    c.fillStyle = rand() < 0.5 ? '#3f6a3a' : '#4d7a44';
    c.beginPath();
    c.arc(rand() * 3.4 * T, (4.9 + rand() * 1.6) * T, 3 + rand() * 3, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#9a5a3e', Math.round(2.4 * T), Math.round(7.6 * T), 18, 10);
  px(c, '#b56a48', Math.round(2.4 * T), Math.round(7.6 * T), 18, 2);
  for (let k = 0; k < 4; k += 1) px(c, '#5a3424', Math.round(2.4 * T) + 2 + k * 4, Math.round(7.6 * T) + 4, 2, 3);
}

// 金門大橋（側面）：兩座塔（兩根腿、橫樑）、主纜、吊索、橋面和下面的桁架
function paintBridge(c: CanvasRenderingContext2D): void {
  const B = SF.bridge;
  const deck = Math.round(B.deck * T);
  const top = Math.round(B.top * T);
  const water = Math.round(B.water * T);
  const [t1, t2] = B.towers.map((x) => Math.round(x * T)) as [number, number];
  const left = Math.round(B.left * T);
  const right = Math.round(B.right * T);
  // 主纜：錨碇 → 塔頂 → 中間垂到橋面上 → 塔頂 → 錨碇
  const cableY = (x: number): number => {
    if (x <= t1) return deck - 2 - ((x - left) / (t1 - left)) ** 1.6 * (deck - 2 - top - 4);
    if (x >= t2) return deck - 2 - ((right - x) / (right - t2)) ** 1.6 * (deck - 2 - top - 4);
    const k = (x - (t1 + t2) / 2) / ((t2 - t1) / 2);
    return deck - 4 - k * k * (deck - top - 8);
  };
  // 吊索
  for (let x = left + 3; x < right; x += 3) {
    if (Math.abs(x - t1) < 4 || Math.abs(x - t2) < 4) continue;
    const y = Math.round(cableY(x));
    px(c, 'rgba(196,64,44,0.55)', x, y, 1, deck - y);
  }
  c.strokeStyle = ORANGE;
  c.lineWidth = 1.6;
  c.beginPath();
  c.moveTo(left, deck - 2);
  for (let x = left; x <= right; x += 2) c.lineTo(x, cableY(x));
  c.stroke();
  // 南端的引橋（Presidio 那邊一路接到地圖外）、北端進馬林的山
  px(c, ORANGE, 0, deck - 1, right, 4);
  px(c, ORANGE_HI, 0, deck - 1, right, 1);
  px(c, ORANGE_DK, 0, deck + 3, right, 4);
  for (let x = 0; x < right; x += 6) {
    c.strokeStyle = 'rgba(90,30,20,0.7)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x, deck + 3);
    c.lineTo(x + 3, deck + 7);
    c.lineTo(x + 6, deck + 3);
    c.stroke();
  }
  // 引橋下的拱（Fort Point 上面）跟橋墩
  for (const x of [Math.round(1 * T), Math.round(2.3 * T)]) px(c, ORANGE_DK, x, deck + 7, 3, Math.round(4.8 * T) - deck - 7 + 30);
  // 塔：兩根腿（從斜側看得到兩根），往上變細，四道橫樑；水面的混凝土墩
  for (const tx of [t1, t2]) {
    px(c, '#9a948a', tx - 9, water - 6, 18, 7);
    px(c, '#b8b2a6', tx - 9, water - 6, 18, 1);
    for (const side of [-1, 1]) {
      const lx = tx + side * 4;
      px(c, ORANGE, side < 0 ? lx - 3 : lx, top, 3, water - 6 - top);
      px(c, ORANGE_HI, side < 0 ? lx - 3 : lx, top, 1, water - 6 - top);
      // 段差（越下面越粗）
      for (const [y0, extra] of [[top + 20, 1], [top + 42, 2]] as const) px(c, ORANGE, side < 0 ? lx - 3 - extra : lx, y0, 3 + extra, water - 6 - y0);
    }
    for (const y of [top + 2, top + 16, top + 30, top + 46]) {
      px(c, ORANGE, tx - 4, y, 8, 4);
      px(c, ORANGE_DK, tx - 4, y + 3, 8, 1);
      px(c, 'rgba(120,40,30,0.5)', tx - 2, y + 1, 4, 2);
    }
    px(c, ORANGE_DK, tx - 8, top - 2, 16, 3);
    // 塔在橋面下的部分（桁架後面）
    px(c, ORANGE_DK, tx - 6, deck + 4, 12, 4);
  }
}

// 惡魔島：岩石島、監獄（長長的白色建築）、燈塔、水塔、坡上的舊營房
function paintAlcatraz(c: CanvasRenderingContext2D, rand: () => number): void {
  const A = SF.alcatraz;
  const x0 = A.x0 * T;
  const x1 = A.x1 * T;
  const base = A.y * T;
  // 島的輪廓：左邊低、中間台地
  c.fillStyle = '#7d7262';
  c.beginPath();
  c.moveTo(x0, base);
  c.lineTo(x0 + 8, base - 14);
  c.lineTo(x0 + 30, base - 22);
  c.lineTo(x0 + 48, base - 30);
  c.lineTo(x1 - 34, base - 32);
  c.lineTo(x1 - 16, base - 24);
  c.lineTo(x1 - 6, base - 12);
  c.lineTo(x1, base);
  c.fill();
  c.fillStyle = '#9a8e7a';
  c.beginPath();
  c.moveTo(x0 + 8, base - 14);
  c.lineTo(x0 + 30, base - 22);
  c.lineTo(x0 + 48, base - 30);
  c.lineTo(x1 - 34, base - 32);
  c.lineTo(x1 - 16, base - 24);
  c.lineTo(x1 - 20, base - 20);
  c.lineTo(x0 + 14, base - 10);
  c.fill();
  for (let i = 0; i < 26; i += 1) px(c, rand() < 0.5 ? '#5f7a46' : '#6f8a50', Math.round(x0 + 6 + rand() * (x1 - x0 - 12)), Math.round(base - 6 - rand() * 18), 4, 2);
  // 碼頭邊的營房（Building 64）
  px(c, '#c9b48e', x0 + 6, base - 12, 30, 9);
  for (let x = x0 + 8; x < x0 + 34; x += 4) px(c, '#6a5a44', x, base - 10, 2, 2);
  px(c, '#a89470', x0 + 6, base - 12, 30, 1);
  // 監獄（cellhouse）
  const cx0 = x0 + 46;
  px(c, '#e9e4d6', cx0, base - 44, 70, 14);
  px(c, '#cfc8b6', cx0, base - 44, 70, 2);
  px(c, '#bdb5a2', cx0, base - 31, 70, 1);
  for (let x = cx0 + 3; x < cx0 + 68; x += 4) for (const y of [base - 40, base - 35]) px(c, '#5a5a5e', x, y, 2, 3);
  px(c, '#e9e4d6', cx0 + 58, base - 50, 12, 6);
  // 燈塔（左邊，白色的高塔）
  const lx = cx0 - 6;
  px(c, '#e9e4d6', lx - 6, base - 38, 14, 8);
  px(c, '#f4f2ea', lx - 2, base - 74, 6, 38);
  px(c, '#d6d2c6', lx + 2, base - 74, 2, 38);
  px(c, '#2a2d33', lx - 3, base - 80, 8, 6);
  px(c, '#fff2b0', lx - 2, base - 79, 6, 3);
  px(c, '#2a2d33', lx - 1, base - 83, 4, 3);
  // 水塔（右邊，腳架上的水槽）
  const wx = x1 - 30;
  for (const dx of [-6, -2, 2, 6]) px(c, '#7a7a7e', wx + dx, base - 44, 1, 16);
  px(c, '#d8d4c8', wx - 8, base - 54, 17, 11);
  px(c, '#bdb8aa', wx - 8, base - 44, 17, 1);
  // 浪花
  px(c, 'rgba(255,255,255,0.6)', x0 - 2, base - 1, x1 - x0 + 4, 2);
}

// 海堤、漁人碼頭步道、39 號碼頭木棧板、人行道、Jefferson 街、對面的人行道
function paintWaterfront(c: CanvasRenderingContext2D, rand: () => number): void {
  const P = SF.pier;
  // 步道（淺色的地磚）
  tiles(c, { x0: 0, y0: SF.shore, x1: P.x0, y1: SF.row }, '#ddd6c6', '#cbc3b1', 16);
  for (let x = 0; x < P.x0 * T; x += 32) px(c, '#c6b9a0', x, SF.shore * T + 18, 16, 16);
  // 海堤的邊（石頭）
  px(c, '#8f897d', 0, SF.shore * T - 3, P.x0 * T, 4);
  px(c, '#b5ae9f', 0, SF.shore * T - 3, P.x0 * T, 1);
  // 39 號碼頭：木棧板（直的木板、釘子）
  const deckY = P.y0 * T;
  px(c, '#a2825e', P.x0 * T, deckY, W - P.x0 * T, SF.row * T - deckY);
  for (let x = P.x0 * T; x < W; x += 6) {
    px(c, '#8a6c4c', x, deckY, 1, SF.row * T - deckY);
    for (let y = deckY + ((x / 6) % 3) * 9; y < SF.row * T; y += 27) px(c, '#6e5640', x + 3, y, 1, 1);
  }
  for (let i = 0; i < 120; i += 1) px(c, rand() < 0.5 ? '#b49270' : '#937352', Math.round(P.x0 * T + rand() * (W - P.x0 * T)), Math.round(deckY + rand() * (SF.row * T - deckY)), 2, 1);
  // 木棧板西邊的側面、海裡的木樁
  px(c, '#6e5640', P.x0 * T - 2, deckY, 2, SF.shore * T - deckY);
  for (let y = deckY + 4; y < SF.shore * T; y += 9) px(c, '#4a3a2a', P.x0 * T - 6, y, 4, 6);
  // 人行道（Jefferson 街北邊）
  px(c, '#cfc9bd', 0, SF.row * T, W, (SF.road.y0 - SF.row) * T);
  for (let x = 0; x < W; x += 16) px(c, '#bfb8aa', x, SF.row * T, 1, (SF.road.y0 - SF.row) * T);
  px(c, '#a8a296', 0, SF.road.y0 * T - 2, W, 2);
  // 馬路：中間雙黃線
  road(c, { x0: 0, y0: SF.road.y0, x1: SF.W, y1: SF.road.y1 }, rand);
  const mid = Math.round(((SF.road.y0 + SF.road.y1) / 2) * T);
  px(c, '#e8c23a', 0, mid - 2, W, 1);
  px(c, '#e8c23a', 0, mid + 1, W, 1);
  zebra(c, SF.hyde.x0, SF.road.y0 + 0.1, SF.hyde.x1, SF.road.y1 - 0.1, false);
  // 叮噹車的軌道穿過馬路（轉車台在南邊）
  // 南邊的人行道
  px(c, '#a8a296', 0, SF.road.y1 * T, W, 2);
  px(c, '#cfc9bd', 0, SF.road.y1 * T + 2, W, (SF.walk - SF.road.y1) * T - 2);
  for (let x = 0; x < W; x += 16) px(c, '#bfb8aa', x, SF.road.y1 * T, 1, (SF.walk - SF.road.y1) * T);
}

// Hyde 街：陡坡（一段段往南變亮、路面有防滑的橫紋）、路口是平的、兩條叮噹車軌道、北端的轉車台；兩邊的人行道有階梯
const HYDE_FLATS: [number, number][] = [
  [32.6, 34.6],
  [SF.lombardTop.y0, SF.lombardTop.y1],
];
function paintHyde(c: CanvasRenderingContext2D): void {
  const H = SF.hyde;
  const x0 = H.x0 * T;
  const w = (H.x1 - H.x0) * T;
  const y0 = SF.walk * T;
  const y1 = SF.H * T;
  px(c, '#4f525a', x0, y0, w, y1 - y0);
  // 坡段：越往南（越高）越亮，防滑橫紋
  const slopes: [number, number][] = [
    [SF.walk + 1.8, 32.6],
    [34.6, SF.lombardTop.y0],
    [SF.lombardTop.y1, SF.H],
  ];
  for (const [a, b] of slopes) {
    const g = c.createLinearGradient(0, a * T, 0, b * T);
    g.addColorStop(0, '#41444b');
    g.addColorStop(1, '#666a73');
    c.fillStyle = g;
    c.fillRect(x0, a * T, w, (b - a) * T);
    for (let y = a * T + 2; y < b * T; y += 4) px(c, 'rgba(0,0,0,0.18)', x0, Math.round(y), w, 1);
    // 坡頂的陰影線（一段坡的盡頭）
    px(c, 'rgba(255,255,255,0.25)', x0, Math.round(b * T) - 1, w, 1);
  }
  for (const [a, b] of HYDE_FLATS) {
    px(c, '#55585f', x0, a * T, w, (b - a) * T);
    zebra(c, H.x0 + 0.1, a + 0.15, H.x1 - 0.1, a + 0.55, true);
  }
  // 軌道：兩條鐵軌＋中間的纜繩槽
  for (const tx of H.tracks) {
    const cx = Math.round(tx * T);
    px(c, '#9aa0a8', cx - 7, y0, 1, y1 - y0);
    px(c, '#9aa0a8', cx + 6, y0, 1, y1 - y0);
    px(c, '#26282d', cx, y0, 1, y1 - y0);
  }
  // 北端的轉車台（木頭圓盤）
  const tcx = ((H.x0 + H.x1) / 2) * T;
  const tcy = (SF.walk + 0.9) * T;
  c.fillStyle = '#7a5a3a';
  c.beginPath();
  c.ellipse(tcx, tcy, 30, 13, 0, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#5a4028';
  c.lineWidth = 1;
  for (let k = -24; k <= 24; k += 4) {
    c.beginPath();
    c.moveTo(tcx + k, tcy - 12);
    c.lineTo(tcx + k, tcy + 12);
    c.stroke();
  }
  c.strokeStyle = '#9aa0a8';
  c.beginPath();
  c.ellipse(tcx, tcy, 30, 13, 0, 0, Math.PI * 2);
  c.stroke();
  // 兩邊人行道：階梯（一格一格的橫線＋陰影）
  for (const sx of [SF.eastHouses.x1, H.x1]) stairs(c, sx, SF.walk, sx + 0.95, SF.H);
}
function stairs(c: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  px(c, '#cfc9bd', x0 * T, y0 * T, (x1 - x0) * T, (y1 - y0) * T);
  for (let y = y0 * T; y < y1 * T; y += 5) {
    px(c, '#e4dfd4', x0 * T, Math.round(y), (x1 - x0) * T, 1);
    px(c, '#a8a296', x0 * T, Math.round(y) + 4, (x1 - x0) * T, 1);
  }
  px(c, '#9a948a', x0 * T, y0 * T, 1, (y1 - y0) * T);
}

// 九曲花街：綠籬＋繡球花圃，中間紅磚的彎路；兩邊的階梯人行道；坡頂的 Lombard 街
function paintLombard(c: CanvasRenderingContext2D, rand: () => number): void {
  const L = SF.lombard;
  // 兩排房子底下、坡頂的街、最南邊的人行道
  px(c, '#9a948a', 0, L.y0 * T, SF.hyde.x0 * T, (L.y1 - L.y0) * T);
  stairs(c, SF.westHouses.x1, L.y0, L.x0, L.y1);
  stairs(c, L.x1, L.y0, SF.eastHouses.x0, L.y1);
  // 花圃：綠籬底、修剪過的灌木、繡球花（粉紅、紫、藍）和紅花
  const g = c.createLinearGradient(0, L.y0 * T, 0, L.y1 * T);
  g.addColorStop(0, '#3d6a38');
  g.addColorStop(1, '#5a8a4a');
  c.fillStyle = g;
  c.fillRect(L.x0 * T, L.y0 * T, (L.x1 - L.x0) * T, (L.y1 - L.y0) * T);
  for (let i = 0; i < 520; i += 1) {
    const x = L.x0 * T + rand() * (L.x1 - L.x0) * T;
    const y = L.y0 * T + rand() * (L.y1 - L.y0) * T;
    const r = rand();
    const col = r < 0.35 ? (rand() < 0.5 ? '#2f5a2c' : '#4e8044') : r < 0.55 ? '#e58fb5' : r < 0.7 ? '#a07ad0' : r < 0.82 ? '#8fb0e0' : r < 0.92 ? '#e0524a' : '#f4f2ea';
    c.fillStyle = col;
    c.beginPath();
    c.arc(x, y, r < 0.35 ? 3 : 2, 0, Math.PI * 2);
    c.fill();
  }
  // 路：灰白的路緣 → 紅磚 → 磚縫
  const path = () => {
    c.beginPath();
    LOMBARD_PATH.forEach(([x, y], k) => (k === 0 ? c.moveTo(x * T, y * T) : c.lineTo(x * T, y * T)));
  };
  c.lineJoin = 'round';
  c.lineCap = 'round';
  c.strokeStyle = '#d8d0c0';
  c.lineWidth = 17;
  path();
  c.stroke();
  c.strokeStyle = '#a84a3a';
  c.lineWidth = 14;
  path();
  c.stroke();
  c.strokeStyle = '#bd5c46';
  c.lineWidth = 10;
  path();
  c.stroke();
  c.strokeStyle = 'rgba(120,50,36,0.55)';
  c.lineWidth = 9;
  c.setLineDash([1, 3]);
  path();
  c.stroke();
  c.setLineDash([]);
  c.lineJoin = 'miter';
  c.lineCap = 'butt';
  // 坡頂的 Lombard 街、最南邊的人行道
  const top = SF.lombardTop;
  road(c, { x0: 0, y0: top.y0, x1: SF.hyde.x0, y1: top.y1 }, rand);
  px(c, '#a8a296', 0, top.y0 * T, SF.hyde.x0 * T, 2);
  px(c, '#cfc9bd', 0, top.y1 * T, SF.hyde.x0 * T, (SF.H - top.y1) * T);
  px(c, '#a8a296', 0, top.y1 * T, SF.hyde.x0 * T, 2);
  for (let x = 0; x < SF.hyde.x0 * T; x += 16) px(c, '#bfb8aa', x, top.y1 * T, 1, (SF.H - top.y1) * T);
  // 坡頂的小花圃
  for (const x0 of [1, 7.5, 13.5, 19.5]) {
    px(c, '#8a7a62', x0 * T, 42.4 * T, 3 * T, 0.9 * T);
    for (let k = 0; k < 9; k += 1) px(c, ['#e58fb5', '#a07ad0', '#5a8a4a', '#8fb0e0'][k % 4] ?? '#5a8a4a', x0 * T + 3 + k * 5, 42.4 * T + 3 + (k % 2) * 4, 4, 4);
  }
}

// 阿拉莫廣場後面的遠景：坡下密密的房子、市中心的高樓、泛美金字塔
function paintSkyline(c: CanvasRenderingContext2D, rand: () => number): void {
  const x0 = SF.east * T;
  const y0 = SF.walk * T;
  const y1 = SF.ladies.line * T;
  const g = c.createLinearGradient(0, y0, 0, y1);
  g.addColorStop(0, '#c4d4de');
  g.addColorStop(1, '#a9bccb');
  c.fillStyle = g;
  c.fillRect(x0, y0, W - x0, y1 - y0);
  // 市中心的大樓（淡淡的藍灰）
  const tops: [number, number, number][] = [];
  for (let x = x0 + 4; x < W - 4; x += 10 + Math.floor(rand() * 10)) tops.push([x, 8 + Math.floor(rand() * 10), y0 + 20 + Math.floor(rand() * 26)]);
  for (const [x, w, top] of tops) {
    px(c, rand() < 0.5 ? '#9fb0bf' : '#b4c2ce', x, top, w, y1 - top);
    for (let yy = top + 3; yy < y1; yy += 4) for (let xx = x + 2; xx < x + w - 1; xx += 3) px(c, 'rgba(70,90,110,0.35)', xx, yy, 1, 2);
  }
  // 泛美金字塔：細長的白色尖塔，上面兩邊有「翅膀」（電梯井），頂上尖針
  const px0 = 43.6 * T;
  const tip = y0 + 6;
  const base = y0 + 86;
  c.fillStyle = '#e8ecef';
  c.beginPath();
  c.moveTo(px0, tip);
  c.lineTo(px0 + 13, base);
  c.lineTo(px0 - 13, base);
  c.fill();
  c.fillStyle = '#c9d0d6';
  c.beginPath();
  c.moveTo(px0, tip);
  c.lineTo(px0 + 13, base);
  c.lineTo(px0 + 2, base);
  c.fill();
  for (let yy = tip + 10; yy < base; yy += 3) {
    const half = ((yy - tip) / (base - tip)) * 13;
    px(c, 'rgba(90,100,110,0.35)', Math.round(px0 - half + 1), yy, Math.round(half * 2 - 2), 1);
  }
  px(c, '#dde2e6', px0 - 6, tip + 22, 3, 10);
  px(c, '#dde2e6', px0 + 3, tip + 22, 3, 10);
  px(c, '#b0b8bf', px0, tip - 8, 1, 8);
  // 坡下一排排的小房子（越近越大）
  for (let row = 0; row < 3; row += 1) {
    const ry = y0 + 60 + row * 14;
    const hh = 8 + row * 3;
    for (let x = x0 - 6 + row * 5; x < W; x += 9 + row * 3) {
      const col = ['#e8dcc4', '#d6dde6', '#f0d2c0', '#d9e4d6', '#ecd9a8', '#e6d0dc'][Math.floor(rand() * 6)] ?? '#e8dcc4';
      px(c, col, x, ry, 7 + row * 3, hh);
      px(c, 'rgba(0,0,0,0.12)', x, ry, 7 + row * 3, 1);
      px(c, 'rgba(60,80,100,0.45)', x + 2, ry + 3, 2, 2);
    }
    for (let k = 0; k < 8; k += 1) {
      c.fillStyle = '#5a7a4c';
      c.beginPath();
      c.arc(x0 + rand() * (W - x0), ry + hh - 2, 4 + rand() * 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  // 跟上面人行道的分界：矮石牆＋綠籬
  px(c, '#8f897d', x0, y0, W - x0, 4);
  px(c, '#b5ae9f', x0, y0, W - x0, 1);
  for (let x = x0; x < W; x += 6) {
    c.fillStyle = '#4f7a44';
    c.beginPath();
    c.arc(x + 3, y0 + 6, 4, 0, Math.PI * 2);
    c.fill();
  }
  // 東邊人行道（Hyde 街東側，接到 Steiner 街）
  stairs(c, SF.hyde.x1, SF.walk, SF.east, SF.ladies.line);
}

// Steiner 街人行道、阿拉莫廣場的草地（割草的條紋、小路）
function paintPark(c: CanvasRenderingContext2D, rand: () => number): void {
  const x0 = SF.east * T;
  px(c, '#cfc9bd', x0 - 0.95 * T, SF.ladies.line * T, W - x0 + 0.95 * T, (SF.park - SF.ladies.line) * T);
  for (let x = x0; x < W; x += 16) px(c, '#bfb8aa', x, SF.ladies.line * T, 1, (SF.park - SF.ladies.line) * T);
  px(c, '#a8a296', x0, SF.park * T - 2, W - x0, 2);
  const y0 = SF.park * T;
  for (let x = x0; x < W; x += 16) px(c, Math.floor(x / 16) % 2 ? '#7cad5c' : '#86b764', x, y0, 16, SF.H * T - y0);
  for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#6e9e50' : '#98c472', Math.round(x0 + rand() * (W - x0)), Math.round(y0 + rand() * (SF.H * T - y0)), 2, 1);
  // 小路：從 Hyde 街口斜斜穿過草地
  c.strokeStyle = '#d8ccb0';
  c.lineWidth = 12;
  c.beginPath();
  c.moveTo(x0, 40.6 * T);
  c.quadraticCurveTo(43 * T, 39.6 * T, W, 41.2 * T);
  c.stroke();
  c.beginPath();
  c.moveTo(43 * T, y0);
  c.quadraticCurveTo(42 * T, 39.8 * T, 44 * T, SF.H * T);
  c.stroke();
  // 花圃
  for (const [x, y] of [[33.5, 38.4], [53, 39.2]] as const) {
    c.fillStyle = '#5a8a4a';
    c.beginPath();
    c.ellipse(x * T, y * T, 22, 9, 0, 0, Math.PI * 2);
    c.fill();
    for (let k = 0; k < 14; k += 1) px(c, ['#f6c945', '#e0524a', '#f4f2ea', '#e58fb5'][k % 4] ?? '#f6c945', Math.round(x * T - 16 + rand() * 32), Math.round(y * T - 5 + rand() * 10), 3, 3);
  }
}

// ── 海灣上會動的：帆船、渡輪、海鷗、霧、惡魔島燈塔 ──
function clipBay(c: CanvasRenderingContext2D): void {
  c.beginPath();
  c.rect(0, 3 * T, SF.pier.x0 * T, (SF.shore - 3) * T);
  c.rect(SF.pier.x0 * T, 3 * T, W - SF.pier.x0 * T, (SF.pier.y0 - 3) * T);
  c.clip();
}
function drawBoats(c: CanvasRenderingContext2D, d: DrawCtx): void {
  c.save();
  clipBay(c);
  const span = W + 120;
  // 帆船（白帆、有的有彩色的前帆）
  const sails: [number, number, number, string][] = [
    [9.6, 7, 0, '#f4f2ea'],
    [11.2, 5, 260, '#e0524a'],
    [10.4, -6, 520, '#3b82f6'],
    [12.2, -4, 140, '#f6c945'],
  ];
  for (const [y, speed, off, jib] of sails) {
    const raw = (d.seconds * Math.abs(speed) + off) % span;
    const x = speed > 0 ? raw - 60 : W + 60 - raw;
    const by = Math.round(y * T + Math.sin(d.seconds * 1.3 + off) * 1);
    const dir = speed > 0 ? 1 : -1;
    px(c, 'rgba(0,0,0,0.18)', Math.round(x - 10), by + 1, 20, 2);
    px(c, '#f4f6f8', Math.round(x - 10), by - 4, 20, 4);
    px(c, '#1f4e7a', Math.round(x - 10), by - 1, 20, 1);
    px(c, '#3a3d45', Math.round(x), by - 26, 1, 22);
    c.fillStyle = '#fbfaf5';
    c.beginPath();
    c.moveTo(x + 1, by - 26);
    c.lineTo(x + 1, by - 6);
    c.lineTo(x + 1 - dir * 12, by - 6);
    c.fill();
    c.fillStyle = jib;
    c.beginPath();
    c.moveTo(x, by - 22);
    c.lineTo(x, by - 6);
    c.lineTo(x + dir * 9, by - 6);
    c.fill();
  }
  // 往惡魔島的渡輪（白色、兩層、藍線）
  const fx = W + 80 - ((d.seconds * 9 + 300) % span);
  const fy = Math.round(9.4 * T);
  px(c, 'rgba(0,0,0,0.2)', Math.round(fx - 26), fy + 1, 52, 3);
  px(c, '#f4f6f8', Math.round(fx - 26), fy - 9, 52, 9);
  px(c, '#1f4e9c', Math.round(fx - 26), fy - 3, 52, 2);
  px(c, '#f4f6f8', Math.round(fx - 16), fy - 16, 34, 7);
  for (let k = -14; k < 16; k += 5) px(c, '#3a4a5a', Math.round(fx + k), fy - 14, 3, 3);
  px(c, '#3a3d45', Math.round(fx + 4), fy - 21, 3, 5);
  px(c, 'rgba(255,255,255,0.7)', Math.round(fx + 26), fy - 2, 10, 1);
  c.restore();
}
function drawGulls(c: CanvasRenderingContext2D, d: DrawCtx): void {
  for (let k = 0; k < 4; k += 1) {
    const a = d.seconds * (0.18 + k * 0.03) + k * 1.7;
    const x = (14 + k * 9) * T + Math.cos(a) * (40 + k * 8);
    const y = (4.4 + (k % 2) * 3) * T + Math.sin(a) * 14;
    const flap = Math.sin(d.seconds * 8 + k) > 0 ? -2 : 1;
    c.strokeStyle = '#f4f6f8';
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(x - 5, y + flap);
    c.lineTo(x, y);
    c.lineTo(x + 5, y + flap);
    c.stroke();
  }
}
// 霧：每 4 分鐘從太平洋那邊（左邊）飄進來，慢慢蓋住橋塔，再退出去
function fogCover(seconds: number): number {
  const s = 0.5 - 0.5 * Math.cos((seconds * Math.PI * 2) / 240);
  return s * s * (3 - 2 * s);
}
function drawFog(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const cover = fogCover(d.seconds);
  if (cover < 0.02) return;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, SF.shore * T - 4);
  c.clip();
  const front = (-4 + cover * 34) * T;
  const span = front + 140;
  const rgb = d.night ? '160, 170, 196' : '244, 246, 248';
  // 海面上低低的一層
  const band = c.createLinearGradient(0, 0, front + 40, 0);
  band.addColorStop(0, `rgba(${rgb}, ${0.5 * cover})`);
  band.addColorStop(1, `rgba(${rgb}, 0)`);
  c.fillStyle = band;
  c.fillRect(0, 4.6 * T, front + 40, 4.6 * T);
  for (let k = 0; k < 22; k += 1) {
    const x = -100 + ((k * 71 + d.seconds * (4 + (k % 3))) % span);
    const y = (0.8 + ((k * 37) % 62) / 10) * T + Math.sin(d.seconds * 0.2 + k) * 4;
    const r = 26 + (k % 4) * 9;
    const fade = Math.min(1, Math.max(0, (front - x) / 70)) * Math.min(1, (x + 100) / 50);
    if (fade <= 0) continue;
    glow(c, x, y, r, rgb, 0.62 * fade * cover);
  }
  c.restore();
}
function drawBridgeLights(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const B = SF.bridge;
  const top = B.top * T;
  // 塔頂的航空警示燈（一閃一閃）
  if (Math.sin(d.seconds * 3) > 0) for (const tx of B.towers) px(c, '#ff3a2a', tx * T - 1, top - 5, 3, 3);
  if (!d.night) return;
  for (let x = 2; x < B.right * T; x += 10) px(c, '#ffd27a', x, B.deck * T - 3, 2, 2);
  for (const tx of B.towers) {
    glow(c, tx * T, top + 30, 30, '255, 120, 80', 0.35);
    glow(c, tx * T, top - 4, 8, '255, 60, 40', 0.6);
  }
}
// 惡魔島燈塔：晚上光束慢慢轉
function drawLighthouse(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!d.night) return;
  const lx = SF.alcatraz.x0 * T + 40 + 1;
  const ly = SF.alcatraz.y * T - 78;
  const a = d.seconds * 0.9;
  const facing = Math.cos(a);
  c.save();
  const len = 120;
  const dx = Math.sin(a) * len;
  c.fillStyle = `rgba(255, 240, 180, ${0.12 + 0.12 * Math.max(0, facing)})`;
  c.beginPath();
  c.moveTo(lx, ly);
  c.lineTo(lx + dx, ly - 10 + facing * 6);
  c.lineTo(lx + dx, ly + 10 + facing * 6);
  c.fill();
  c.restore();
  glow(c, lx, ly, 10 + Math.max(0, facing) * 16, '255, 240, 180', 0.7);
}

// ── 39 號碼頭：浮台上的海獅 ──
const RAFTS: [number, number, number][] = [
  [40.8, 8.5, 4.4],
  [45.8, 10.0, 4.6],
  [50.9, 8.3, 4.4],
];
function drawSeaLion(c: CanvasRenderingContext2D, x: number, y: number, k: number, seconds: number): void {
  const dir = k % 2 === 0 ? 1 : -1;
  const phase = Math.floor((seconds + k * 7.3) / 3.2) % 8;
  const cx = Math.round(x);
  const by = Math.round(y);
  const body = k % 3 === 0 ? '#5a4030' : k % 3 === 1 ? '#6e4e38' : '#4e3a2c';
  const belly = '#a5835e';
  px(c, 'rgba(0,0,0,0.25)', cx - 9, by, 18, 2);
  if (phase === 6) {
    // 翻身：肚子朝上、鰭揮一揮
    px(c, body, cx - 9, by - 5, 18, 5);
    px(c, belly, cx - 7, by - 6, 13, 3);
    const wave = Math.sin(seconds * 6 + k) > 0 ? 1 : 0;
    px(c, body, cx - 3, by - 9 - wave, 2, 4);
    px(c, body, cx + 2, by - 8 + wave, 2, 3);
    px(c, body, cx + dir * 9, by - 5, 4, 3);
    px(c, '#1a1410', cx + dir * 11, by - 4, 1, 1);
    return;
  }
  // 趴著（身體＋後鰭）
  px(c, body, cx - 8, by - 5, 16, 5);
  px(c, 'rgba(255,255,255,0.15)', cx - 6, by - 5, 10, 1);
  px(c, body, cx - dir * 11, by - 3, 4, 3);
  px(c, body, cx + dir * 2, by - 1, 3, 2);
  if (phase === 4 || phase === 5) {
    // 抬頭叫：脖子仰起來、嘴巴開開、上面一個「嗷！」
    const bob = Math.sin(seconds * 10) > 0 ? 1 : 0;
    px(c, body, cx + dir * 6 - 2, by - 11 - bob, 5, 8);
    px(c, body, cx + dir * 8 - 2, by - 13 - bob, 6, 4);
    px(c, '#2a1a14', cx + dir * 11 - 1, by - 12 - bob, 2, 2);
    px(c, '#1a1410', cx + dir * 7, by - 12 - bob, 1, 1);
    if (phase === 4) {
      c.font = `900 6px ${FONT_TC}`;
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,255,255,0.92)';
      c.fillText('ARF!', cx + dir * 12, by - 20 - bob);
    }
  } else {
    // 頭趴在台子上
    px(c, body, cx + dir * 7 - 2, by - 5, 6, 4);
    px(c, '#2a1a14', cx + dir * 10 - 1, by - 4, 2, 1);
    if (phase !== 3) px(c, '#1a1410', cx + dir * 8, by - 4, 1, 1);
  }
}
function drawSeaLions(c: CanvasRenderingContext2D, d: DrawCtx): void {
  let k = 0;
  RAFTS.forEach(([rx, ry, rw], ri) => {
    const bob = Math.round(Math.sin(d.seconds * 1.1 + ri) * 1);
    const x0 = Math.round(rx * T);
    const y0 = Math.round(ry * T) + bob;
    const w = Math.round(rw * T);
    // 浮台：深色的邊、木板
    px(c, 'rgba(255,255,255,0.45)', x0 - 2, y0 + 10, w + 4, 1);
    px(c, '#5a4636', x0, y0 + 6, w, 4);
    px(c, '#9a7e60', x0, y0, w, 7);
    for (let x = x0 + 5; x < x0 + w; x += 8) px(c, '#86694e', x, y0, 1, 7);
    const n = Math.floor(rw / 1.25);
    for (let j = 0; j < n; j += 1) {
      drawSeaLion(c, x0 + 10 + j * ((w - 20) / Math.max(1, n - 1)), y0 + 5 + (j % 2), k, d.seconds);
      k += 1;
    }
  });
  // 在水裡游的海獅（頭冒出來）
  for (let j = 0; j < 3; j += 1) {
    const t = (d.seconds * 0.05 + j * 0.37) % 1;
    const x = (40.6 + t * 15) * T;
    const y = (7.4 + j * 1.3) * T + (j === 1 ? 26 : 0);
    if (Math.sin(d.seconds * 0.8 + j * 2) < -0.3) continue;
    px(c, 'rgba(255,255,255,0.5)', Math.round(x) - 5, Math.round(y) + 2, 10, 1);
    px(c, '#4e3a2c', Math.round(x) - 2, Math.round(y) - 4, 5, 5);
    px(c, '#1a1410', Math.round(x) + 1, Math.round(y) - 3, 1, 1);
  }
}

// 木棧板北邊和西邊的欄杆
function drawPierRail(c: CanvasRenderingContext2D): void {
  const y = SF.pier.y0 * T;
  const x0 = SF.pier.x0 * T;
  px(c, '#5a4636', x0, y - 9, W - x0, 2);
  px(c, '#7a604a', x0, y - 5, W - x0, 1);
  for (let x = x0; x < W; x += 12) px(c, '#5a4636', x, y - 9, 2, 10);
  for (let yy = y; yy < SF.shore * T; yy += 10) px(c, '#5a4636', x0, yy - 9, 2, 10);
  px(c, '#5a4636', x0, y - 9, 2, SF.shore * T - y + 2);
  // 「看海獅」的小木牌
  const sx = Math.round(48.4 * T);
  px(c, '#5a4636', sx - 1, y - 18, 2, 10);
  px(c, '#f4efe2', sx - 18, y - 24, 36, 9);
  px(c, '#1f4e7a', sx - 18, y - 24, 36, 1);
  text(c, 'SEA LIONS', sx, y - 19.5, '#1f4e7a', `900 6px ${FONT_TC}`);
}
// 海堤上的鐵鍊欄杆
function drawSeawallRail(c: CanvasRenderingContext2D): void {
  const y = SF.shore * T;
  for (let x = 4; x < SF.pier.x0 * T - 4; x += 20) {
    px(c, '#2f333b', x, y - 9, 2, 9);
    c.strokeStyle = '#4a4f58';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(x + 2, y - 7);
    c.quadraticCurveTo(x + 11, y - 2, x + 20, y - 7);
    c.stroke();
  }
}

// ── 座位：面向海灣、海獅、Painted Ladies 的長椅（人背對畫面，椅背畫在前面）──
function drawBenchSeat(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 20, by + 1, 40, 3);
  px(c, '#2f333b', cx - 19, by - 4, 2, 6);
  px(c, '#2f333b', cx + 17, by - 4, 2, 6);
  px(c, '#8a5a32', cx - 20, by - 5, 40, 3);
  px(c, '#b5804a', cx - 20, by - 5, 40, 1);
}
function drawSeatFront(c: CanvasRenderingContext2D, i: number): void {
  const s = SF_SEATS[i];
  if (!s) return;
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  const left = i % 2 === 0;
  const x0 = left ? x - 10 : x - 9;
  px(c, '#8a5a32', x0, y - 9, 19, 3);
  px(c, '#a8703f', x0, y - 9, 19, 1);
  px(c, '#8a5a32', x0, y - 4, 19, 3);
  px(c, '#a8703f', x0, y - 4, 19, 1);
  // 兩端的鐵扶手
  px(c, '#2f333b', left ? x - 11 : x + 9, y - 10, 2, 11);
}

// ── 碼頭的攤子：螃蟹攤／巧達湯攤（上面一塊大招牌、玻璃櫃、冒煙的鍋子、老闆）──
function standSprite(key: string, sign: string, sub: string, color: string, kind: 'crab' | 'chowder'): HTMLCanvasElement {
  const w = 64;
  const h = 62;
  return cached(`sf-stand-${key}`, w, h, (c) => {
    // 屋頂上的大招牌（白底紅字＋圖案）
    px(c, '#2f333b', 8, 0, 2, 20);
    px(c, '#2f333b', w - 10, 0, 2, 20);
    px(c, '#f4efe2', 2, 2, w - 4, 15);
    px(c, color, 2, 2, w - 4, 2);
    px(c, color, 2, 15, w - 4, 2);
    text(c, sign, w / 2 + 7, 8, color, `900 ${sign.length > 8 ? 6 : 8}px ${FONT_TC}`);
    text(c, sub, w / 2 + 6, 13.5, '#3a3d45', `700 4px ${FONT_TC}`);
    if (kind === 'crab') {
      px(c, '#e0524a', 6, 7, 9, 5);
      px(c, '#e0524a', 4, 5, 2, 3);
      px(c, '#e0524a', 15, 5, 2, 3);
      px(c, '#1a1410', 8, 7, 1, 1);
      px(c, '#1a1410', 12, 7, 1, 1);
    } else {
      px(c, '#c98a3c', 5, 6, 12, 7);
      px(c, '#f4efe2', 7, 6, 8, 3);
    }
    // 攤子：條紋遮雨棚、後面的牆
    px(c, '#e8e2d4', 2, 20, w - 4, h - 20);
    for (let k = 0; k < w; k += 8) px(c, (k / 8) % 2 === 0 ? color : '#f4f1e8', k, 18, 8, 7);
    px(c, 'rgba(0,0,0,0.2)', 0, 25, w, 1);
    // 後面的蒸鍋（白鐵）
    for (const x of [8, w - 22]) {
      px(c, '#9aa3b2', x, 32, 14, 12);
      px(c, '#d6dae2', x, 32, 14, 2);
      px(c, '#6a7080', x - 1, 31, 16, 2);
    }
    // 前面的檯面＋玻璃冰櫃
    px(c, '#c9ccd6', 0, h - 18, w, 18);
    px(c, '#ffffff', 0, h - 18, w, 1);
    px(c, '#bfe6f2', 4, h - 16, w - 8, 9);
    px(c, 'rgba(255,255,255,0.7)', 4, h - 16, w - 8, 1);
    if (kind === 'crab') {
      for (let x = 7; x < w - 10; x += 9) {
        px(c, '#e86a3a', x, h - 13, 7, 4);
        px(c, '#c84a2a', x - 1, h - 14, 2, 2);
        px(c, '#c84a2a', x + 6, h - 14, 2, 2);
      }
    } else {
      for (let x = 7; x < w - 12; x += 11) {
        px(c, '#c98a3c', x, h - 14, 9, 6);
        px(c, '#f4efe2', x + 2, h - 14, 5, 2);
      }
    }
    px(c, '#9aa3b2', 0, h - 6, w, 6);
    px(c, color, 0, h - 6, w, 1);
  });
}
function drawStand(c: CanvasRenderingContext2D, x: number, key: string, sign: string, sub: string, color: string, kind: 'crab' | 'chowder', d: DrawCtx, seed: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(SF.row * T);
  px(c, 'rgba(0,0,0,0.22)', cx - 32, by, 64, 3);
  blit(c, standSprite(key, sign, sub, color, kind), cx - 32, by);
  // 老闆（站在檯子後面）
  const owner = getAvatarFrame(lookColors(seed % 5, 4 + (seed % 3), { body: seed % 2 }), 'down', 'idle');
  c.drawImage(owner, Math.round(cx - owner.width / 2), by - 18 - owner.height + 6, owner.width, owner.height - 6);
  // 檯子前板（蓋住老闆的腳）
  px(c, '#c9ccd6', cx - 32, by - 18, 64, 3);
  px(c, '#bfe6f2', cx - 28, by - 16, 56, 4);
  // 鍋子冒煙
  for (let k = 0; k < 4; k += 1) {
    const t = (d.seconds * 0.5 + k / 4) % 1;
    const sx = cx - 17 + (k % 2) * 40 + Math.sin(d.seconds * 2 + k) * 2;
    px(c, `rgba(255,255,255,${0.55 * (1 - t)})`, Math.round(sx), Math.round(by - 32 - t * 16), 3, 2);
  }
  if (d.night) glow(c, cx, by - 46, 14, '255, 230, 170', 0.5);
}

// 酸種麵包店：石砌的店面、大招牌、櫥窗裡的麵包（有的做成螃蟹、烏龜的形狀）
function bakerySprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((SF.bakery.x1 - SF.bakery.x0) * T);
  const h = 76;
  return cached(`sf-bakery-${night ? 'n' : 'd'}`, w, h, (c) => {
    px(c, '#d9c8a8', 0, 8, w, h - 8);
    for (let y = 10; y < h; y += 6) px(c, '#c4b28e', 0, y, w, 1);
    for (let y = 10, r = 0; y < h; y += 6, r += 1) for (let x = (r % 2) * 8; x < w; x += 16) px(c, '#c4b28e', x, y, 1, 6);
    px(c, '#8a6a4a', 0, 4, w, 6);
    px(c, '#a8845e', 0, 4, w, 1);
    // 招牌
    px(c, '#2a3a2e', 8, 12, w - 16, 14);
    px(c, '#d8b45a', 8, 12, w - 16, 1);
    px(c, '#d8b45a', 8, 25, w - 16, 1);
    text(c, 'SOURDOUGH BAKERY', w / 2, 17, '#f0d488', `900 7px ${FONT_TC}`);
    text(c, '酸種麵包 · SINCE 1849', w / 2, 22.5, '#f4efe2', `700 4px ${FONT_TC}`);
    // 二樓的窗
    for (let x = 10; x < w - 14; x += 22) {
      px(c, '#5a4636', x, 30, 14, 12);
      px(c, night ? '#ffd88a' : '#9fc7d9', x + 2, 32, 10, 8);
    }
    // 遮雨棚
    for (let k = 0; k < w; k += 8) px(c, (k / 8) % 2 === 0 ? '#2f6a4a' : '#f4f1e8', k, 44, 8, 6);
    c.fillStyle = 'rgba(0,0,0,0.18)';
    c.fillRect(0, 50, w, 1);
    // 櫥窗：麵包（長棍、圓的、螃蟹形）
    px(c, '#5a4636', 4, 52, w - 32, 22);
    px(c, night ? '#ffe2a8' : '#f6e8cc', 6, 54, w - 36, 18);
    for (let x = 9; x < w - 36; x += 10) {
      px(c, '#c98a3c', x, 64, 8, 5);
      px(c, '#e0a85a', x + 1, 64, 5, 1);
    }
    px(c, '#b8742e', 10, 57, 18, 4);
    px(c, '#c98a3c', 34, 56, 8, 5);
    px(c, '#c98a3c', 32, 55, 2, 2);
    px(c, '#c98a3c', 42, 55, 2, 2);
    px(c, '#b8742e', 50, 57, 14, 4);
    // 門
    px(c, '#5a4636', w - 26, 52, 20, 24);
    px(c, '#2f6a4a', w - 24, 54, 16, 22);
    px(c, night ? '#ffd88a' : '#9fc7d9', w - 21, 57, 10, 9);
    px(c, '#d8b45a', w - 11, 66, 2, 2);
  });
}

// 巧克力聖代店：紅磚、金字的招牌、拱窗、咖啡色條紋遮雨棚，招牌旁邊一個聖代
function sundaeSprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((SF.sundae.x1 - SF.sundae.x0) * T);
  const h = 80;
  return cached(`sf-sundae-${night ? 'n' : 'd'}`, w, h, (c) => {
    px(c, '#9a4a3a', 0, 6, w, h - 6);
    for (let y = 8, r = 0; y < h; y += 4, r += 1) {
      px(c, '#84392c', 0, y, w, 1);
      for (let x = (r % 2) * 4; x < w; x += 8) px(c, '#84392c', x, y, 1, 4);
    }
    px(c, '#e8dcc4', 0, 2, w, 6);
    px(c, '#c9b48e', 0, 7, w, 1);
    // 招牌
    px(c, '#3a2418', 6, 12, w - 12, 15);
    px(c, '#e0b84a', 6, 12, w - 12, 1);
    px(c, '#e0b84a', 6, 26, w - 12, 1);
    text(c, 'CHOCOLATE', w / 2 + 5, 17, '#f0cc6a', `900 7px ${FONT_TC}`);
    text(c, 'HOT FUDGE SUNDAES', w / 2 + 5, 23, '#f4efe2', `700 4px ${FONT_TC}`);
    // 聖代杯
    px(c, '#f4efe2', 11, 22, 6, 3);
    px(c, '#f4efe2', 13, 25, 2, 2);
    px(c, '#f8f0e0', 10, 17, 8, 5);
    px(c, '#5a2a14', 10, 17, 8, 2);
    px(c, '#e0303a', 13, 15, 2, 2);
    // 二樓拱窗
    for (let x = 8; x < w - 10; x += 20) {
      px(c, '#e8dcc4', x - 1, 31, 14, 14);
      c.fillStyle = '#e8dcc4';
      c.beginPath();
      c.arc(x + 6, 32, 7, Math.PI, 0);
      c.fill();
      px(c, night ? '#ffd88a' : '#7a9ab4', x + 1, 32, 10, 12);
    }
    // 遮雨棚
    for (let k = 0; k < w; k += 8) px(c, (k / 8) % 2 === 0 ? '#5a2a14' : '#f0e0c0', k, 48, 8, 6);
    px(c, 'rgba(0,0,0,0.2)', 0, 54, w, 1);
    // 一樓的大窗、門
    px(c, '#3a2418', 3, 56, w - 6, h - 56);
    px(c, night ? '#ffe2a8' : '#f4e0c8', 6, 58, w - 30, 16);
    for (let x = 9; x < w - 28; x += 9) {
      px(c, '#f8f0e0', x, 64, 6, 4);
      px(c, '#5a2a14', x, 64, 6, 1);
      px(c, '#c9ccd6', x + 2, 68, 2, 4);
    }
    px(c, night ? '#ffd88a' : '#9fc7d9', w - 20, 58, 14, h - 58);
    px(c, '#3a2418', w - 14, 58, 1, h - 58);
  });
}

// 39 號碼頭的木造商店（灰褐的舊木板、木瓦屋頂）
function pierShopSprite(i: number, x0: number, x1: number): HTMLCanvasElement {
  const w = Math.round((x1 - x0) * T);
  const h = 64;
  return cached(`sf-piershop-${i}`, w, h, (c) => {
    px(c, '#8f8274', 0, 18, w, h - 18);
    for (let y = 20; y < h; y += 4) px(c, '#7a6e60', 0, y, w, 1);
    // 木瓦屋頂
    c.fillStyle = '#5e5a54';
    c.beginPath();
    c.moveTo(-2, 20);
    c.lineTo(w / 2, 0);
    c.lineTo(w + 2, 20);
    c.fill();
    for (let y = 4; y < 20; y += 3) px(c, 'rgba(0,0,0,0.18)', Math.round(w / 2 - y * 2.1), y, Math.round(y * 4.2), 1);
    px(c, '#f4efe2', w / 2 - 5, 9, 10, 7);
    px(c, '#3a4a5a', w / 2 - 3, 11, 6, 4);
    // 招牌
    const word = i === 0 ? 'SEAFOOD · CANDY' : 'GIFTS · ARCADE';
    px(c, '#1f4e7a', 4, 24, w - 8, 9);
    text(c, word, w / 2, 28.5, '#f4efe2', `900 5px ${FONT_TC}`);
    // 二樓窗、一樓店面
    for (let x = 6; x < w - 10; x += 16) {
      px(c, '#f4efe2', x, 36, 10, 9);
      px(c, '#5a7a94', x + 1, 37, 8, 7);
    }
    px(c, '#3a2e28', 2, 48, w - 4, h - 48);
    px(c, '#f6dfae', 5, 51, w - 10, h - 53);
    for (let x = 8; x < w - 8; x += 6) px(c, ['#e0524a', '#f6c945', '#3b82f6', '#2bb673'][Math.floor(x / 6) % 4] ?? '#e0524a', x, 56, 4, 4);
  });
}
// 39 號碼頭的入口：兩根木柱、上面的藍色招牌
function drawPierGate(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x0 = Math.round(SF.pierGate.x0 * T);
  const x1 = Math.round(SF.pierGate.x1 * T);
  const by = Math.round(SF.row * T);
  for (const x of [x0 + 2, x1 - 6]) {
    px(c, 'rgba(0,0,0,0.22)', x - 1, by - 1, 6, 3);
    px(c, '#6e5640', x, by - 50, 4, 50);
    px(c, '#8a6c4c', x, by - 50, 1, 50);
  }
  px(c, '#1f4e7a', x0 - 2, by - 60, x1 - x0 + 4, 14);
  px(c, '#f4efe2', x0 - 2, by - 60, x1 - x0 + 4, 1);
  px(c, '#f4efe2', x0 - 2, by - 47, x1 - x0 + 4, 1);
  text(c, 'PIER 39', (x0 + x1) / 2, by - 53, d.night ? '#ffe08a' : '#f4efe2', `900 9px ${FONT_TC}`);
  // 旗子
  for (const x of [x0 + 3, x1 - 5]) {
    px(c, '#3a3d45', x, by - 72, 1, 12);
    const flap = Math.sin(d.seconds * 4 + x) > 0 ? 1 : 0;
    px(c, x < x1 - 10 ? '#e0524a' : '#3b82f6', x + 1, by - 72 + flap, 8, 5);
  }
}

// 漁人碼頭的舵輪招牌：木頭舵輪（8 根把手）、中間藍底的紅螃蟹，下面一塊名牌
function helmSprite(night: boolean): HTMLCanvasElement {
  return cached(`sf-helm-${night ? 'n' : 'd'}`, 72, 92, (c) => {
    const cx = 36;
    const cy = 34;
    // 柱子
    px(c, '#3a3d45', cx - 2, cy, 4, 92 - cy);
    // 把手＋輪輻
    c.strokeStyle = '#7a4a24';
    c.lineWidth = 3;
    for (let k = 0; k < 8; k += 1) {
      const a = (k / 8) * Math.PI * 2;
      c.beginPath();
      c.moveTo(cx + Math.cos(a) * 8, cy + Math.sin(a) * 8);
      c.lineTo(cx + Math.cos(a) * 33, cy + Math.sin(a) * 33);
      c.stroke();
      px(c, '#9a6234', Math.round(cx + Math.cos(a) * 31) - 2, Math.round(cy + Math.sin(a) * 31) - 2, 5, 5);
    }
    // 輪框（雙圈）
    c.strokeStyle = '#8a5a2e';
    c.lineWidth = 5;
    c.beginPath();
    c.arc(cx, cy, 24, 0, Math.PI * 2);
    c.stroke();
    c.strokeStyle = '#b07a3e';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(cx, cy, 25.5, 0, Math.PI * 2);
    c.stroke();
    // 中間：藍底＋紅螃蟹
    c.fillStyle = night ? '#2a6aa8' : '#1f5a94';
    c.beginPath();
    c.arc(cx, cy, 15, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = night ? '#9fe4ff' : '#f4efe2';
    c.lineWidth = 1.5;
    c.beginPath();
    c.arc(cx, cy, 15, 0, Math.PI * 2);
    c.stroke();
    px(c, '#e0402e', cx - 8, cy - 3, 16, 8);
    px(c, '#f06048', cx - 6, cy - 3, 12, 2);
    for (const s of [-1, 1]) {
      // 鉗子
      px(c, '#e0402e', cx + s * 9 - (s < 0 ? 3 : 0), cy - 8, 3, 6);
      px(c, '#e0402e', cx + s * 7 - (s < 0 ? 4 : 0), cy - 10, 4, 3);
      // 腳
      for (let k = 0; k < 3; k += 1) px(c, '#c83a28', cx + s * (9 + k) - (s < 0 ? 2 : 0), cy + 2 + k * 2, 2, 2);
    }
    px(c, '#1a1410', cx - 3, cy - 5, 2, 2);
    px(c, '#1a1410', cx + 1, cy - 5, 2, 2);
    // 名牌
    px(c, '#1f5a94', 2, 70, 68, 14);
    px(c, '#f4efe2', 2, 70, 68, 1);
    px(c, '#f4efe2', 2, 83, 68, 1);
    text(c, "FISHERMAN'S WHARF", cx, 75, night ? '#ffe08a' : '#f4efe2', `900 6px ${FONT_TC}`);
    text(c, 'SAN FRANCISCO', cx, 80.5, '#bfe6f2', `700 4px ${FONT_TC}`);
  });
}

// BART 捷運站入口：往下的樓梯、矮牆、玻璃雨棚、旁邊的站牌柱
function bartSprite(night: boolean): HTMLCanvasElement {
  const w = Math.round((SF.bart.x1 - SF.bart.x0) * T);
  const h = 64;
  return cached(`sf-bart-${night ? 'n' : 'd'}`, w, h, (c) => {
    // 站牌柱（左邊）
    px(c, '#2a3a4a', 2, 0, 10, h);
    px(c, '#3e5468', 2, 0, 2, h);
    px(c, night ? '#7ad8ff' : '#4aa8e0', 3, 4, 8, 4);
    for (const [k, ch] of ['B', 'A', 'R', 'T'].entries()) text(c, ch, 7, 14 + k * 7, '#ffffff', `900 6px ${FONT_TC}`);
    // 玻璃雨棚
    px(c, '#5a6470', 14, 22, w - 16, 2);
    px(c, night ? 'rgba(190,235,255,0.7)' : 'rgba(170,215,235,0.65)', 14, 24, w - 16, 10);
    px(c, '#5a6470', 14, 34, w - 16, 1);
    for (const x of [15, w - 4]) px(c, '#5a6470', x, 24, 2, h - 24);
    // 雨棚上的字
    px(c, '#2a3a4a', 18, 26, w - 24, 6);
    // 牌子只有 w-24 寬：柱子上已經寫了 BART，這裡只寫目的地，還放不下就壓扁
    text(c, '往 SFO 機場', 18 + (w - 24) / 2, 29, '#ffffff', `700 4px ${FONT_TC}`, 'center', w - 27);
    // 矮牆＋往下的樓梯
    px(c, '#9a958c', 14, 38, w - 16, h - 38);
    px(c, '#b8b3a8', 14, 38, w - 16, 2);
    px(c, '#3a3d45', 18, 42, w - 24, h - 42);
    for (let y = 44; y < h; y += 4) px(c, night ? '#8a8f9a' : '#6a7080', 19, y, w - 26, 1);
    px(c, night ? 'rgba(255,240,200,0.5)' : 'rgba(255,255,255,0.15)', 18, h - 6, w - 24, 6);
  });
}

// ── 叮噹車：紅褐色的車身、米色的窗帶、兩端開放的座位，掛在外面的乘客 ──
// 從上面斜看：車頂是長長的一塊，下面是朝向畫面的車頭（往南爬坡時看到車頭、往北下坡時看到車尾）
function drawCableCar(c: CanvasRenderingContext2D, x: number, y: number, seed: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const hw = 12;
  px(c, 'rgba(0,0,0,0.3)', cx - hw - 1, by - 1, hw * 2 + 2, 3);
  // 車頂（米白，兩邊深色的邊）
  px(c, '#e8dcc0', cx - hw, by - 52, hw * 2, 34);
  px(c, '#6a2a24', cx - hw, by - 52, 2, 34);
  px(c, '#6a2a24', cx + hw - 2, by - 52, 2, 34);
  px(c, '#cfc2a2', cx - 3, by - 50, 6, 30);
  px(c, '#2f333b', cx - 2, by - 38, 4, 4);
  // 兩邊掛著的乘客（頭）
  const rand = seeded(seed);
  for (let k = 0; k < 4; k += 1) {
    for (const s of [-1, 1]) {
      if (rand() < 0.35) continue;
      const hy = by - 48 + k * 8;
      px(c, ['#3a2a1e', '#e8c890', '#1a1410', '#8a5a32'][Math.floor(rand() * 4)] ?? '#3a2a1e', cx + s * (hw + 1) - (s < 0 ? 4 : 0), hy, 4, 4);
      px(c, ['#e25a4a', '#3b82f6', '#f6c945', '#2bb673'][Math.floor(rand() * 4)] ?? '#3b82f6', cx + s * (hw + 1) - (s < 0 ? 4 : 0), hy + 4, 4, 3);
    }
  }
  // 車頭（朝向畫面那一面）
  px(c, '#8a1f2a', cx - hw, by - 18, hw * 2, 16);
  px(c, '#f0e2c0', cx - hw + 1, by - 16, hw * 2 - 2, 6);
  for (let k = 0; k < 3; k += 1) px(c, night ? '#ffe2a0' : '#6a8aa4', cx - hw + 3 + k * 7, by - 15, 5, 4);
  px(c, '#1a1410', cx - 7, by - 21, 14, 4);
  text(c, 'HYDE', cx, by - 19, '#f4efe2', `900 3px ${FONT_TC}`);
  px(c, '#d8b45a', cx - hw, by - 10, hw * 2, 1);
  px(c, '#5a3a22', cx - hw, by - 9, hw * 2, 6);
  px(c, night ? '#fff4c0' : '#f4efe2', cx - 2, by - 8, 4, 3);
  px(c, '#2f333b', cx - hw + 1, by - 3, 4, 2);
  px(c, '#2f333b', cx + hw - 5, by - 3, 4, 2);
  if (night) glow(c, cx, by - 6, 22, '255, 240, 180', 0.35);
}
// 兩台車輪流：往南爬坡（西邊軌道）→ 開出地圖 → 往北下坡（東邊軌道）→ 在轉車台轉過來
const CAR_CYCLE = 64;
function cableCarPos(seconds: number, k: number): { x: number; y: number } | null {
  const t = (seconds + k * (CAR_CYCLE / 2)) % CAR_CYCLE;
  const [west, east] = SF.hyde.tracks;
  const start = SF.walk + 2.2;
  const end = SF.H + 3.6;
  if (t < 28) return { x: west, y: start + (t / 28) * (end - start) };
  if (t < 32) return null;
  if (t < 60) return { x: east, y: end - ((t - 32) / 28) * (end - start) };
  return { x: east + ((t - 60) / 4) * (west - east), y: start };
}
function drawCableCars(c: CanvasRenderingContext2D, d: DrawCtx, k: number): void {
  const p = cableCarPos(d.seconds, k);
  if (!p) return;
  c.save();
  c.beginPath();
  c.rect(0, 0, W, SF.H * T);
  c.clip();
  drawCableCar(c, p.x, p.y, 7 + k * 31 + Math.floor((d.seconds + k * 32) / CAR_CYCLE), d.night);
  c.restore();
}
// 黃色的陡坡警告牌（卡車在斜坡上）
function drawHillSign(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, '#6a7080', cx, by - 26, 2, 26);
  c.fillStyle = '#f2c230';
  c.beginPath();
  c.moveTo(cx + 1, by - 38);
  c.lineTo(cx + 11, by - 28);
  c.lineTo(cx + 1, by - 18);
  c.lineTo(cx - 9, by - 28);
  c.fill();
  c.strokeStyle = '#1a1410';
  c.lineWidth = 1;
  c.stroke();
  c.beginPath();
  c.moveTo(cx - 5, by - 25);
  c.lineTo(cx + 7, by - 31);
  c.stroke();
  px(c, '#1a1410', cx - 1, by - 31, 5, 3);
  px(c, '#1a1410', cx - 7, by - 17, 16, 6);
  text(c, '21%', cx + 1, by - 14, '#f2c230', `900 5px ${FONT_TC}`);
}
// 路名牌（綠底白字）
function drawStreetSign(c: CanvasRenderingContext2D, x: number, y: number, name: string): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, '#6a7080', cx, by - 28, 2, 28);
  px(c, '#1f6a3a', cx - 16, by - 32, 34, 7);
  text(c, name, cx + 1, by - 28.5, '#ffffff', `900 4px ${FONT_TC}`);
}

// ── 九曲花街兩邊、坡上的房子（Edwardian 公寓：凸窗、車庫、樓梯）──
const HOUSE_COLORS = ['#e8dcc4', '#d6e2ea', '#f0d2c0', '#dfe8d4', '#efe2b0', '#e6d4e0', '#cfdde6', '#f4ece0'];
function rowHouseSprite(seed: number, w: number, h: number, night: boolean): HTMLCanvasElement {
  return cached(`sf-row-${seed}-${w}-${night ? 'n' : 'd'}`, w, h, (c) => {
    const rand = seeded(seed);
    const wall = HOUSE_COLORS[Math.floor(rand() * HOUSE_COLORS.length)] ?? '#e8dcc4';
    const trim = rand() < 0.5 ? '#f8f6f0' : '#5a6a7a';
    px(c, wall, 0, 6, w, h - 6);
    // 平屋頂的簷口、托架
    px(c, trim, 0, 4, w, 5);
    for (let x = 2; x < w; x += 6) px(c, 'rgba(0,0,0,0.18)', x, 9, 2, 2);
    // 凸窗（左邊，兩層）
    const bw = Math.round(w * 0.5);
    for (const y of [12, 28]) {
      px(c, 'rgba(0,0,0,0.12)', 3, y + 13, bw, 2);
      px(c, trim, 3, y, bw, 13);
      for (let k = 0; k < 3; k += 1) px(c, night && rand() < 0.7 ? '#ffd88a' : '#8fb0c8', 5 + k * Math.floor((bw - 4) / 3), y + 2, Math.floor((bw - 4) / 3) - 2, 9);
    }
    // 右邊的窗
    for (const y of [14, 30]) {
      px(c, trim, bw + 7, y, w - bw - 10, 11);
      px(c, night && rand() < 0.6 ? '#ffd88a' : '#8fb0c8', bw + 9, y + 2, w - bw - 14, 7);
    }
    // 一樓：車庫門、往上的樓梯、門
    const gy = h - 14;
    px(c, '#bdb5a2', 0, gy, w, 14);
    px(c, '#e8e4da', 3, gy + 2, bw - 2, 12);
    for (let y = gy + 4; y < h; y += 3) px(c, '#c9c4b8', 3, y, bw - 2, 1);
    px(c, '#5a3a22', w - 12, gy - 12, 8, 12);
    for (let k = 0; k < 4; k += 1) px(c, '#d6d0c4', w - 14 - k, gy + k * 3, 12 + k, 3);
  });
}
const WEST_HOUSES = [28.6, 32.2, 35.8, 39.4];
const EAST_HOUSES = [28.6, 32.2, 35.8, 39.4];

// ── Painted Ladies：7 棟彩色的 Queen Anne 式維多利亞房子（山牆、魚鱗瓦、凸窗、白色的雕花）──
const LADY_COLORS: [string, string][] = [
  ['#8fbcd4', '#b04a3a'],
  ['#e9d38a', '#3a6a8a'],
  ['#a8c99a', '#8a3a5a'],
  ['#e2a8b6', '#2f5a7a'],
  ['#c7b9d8', '#7a3a2a'],
  ['#efc39a', '#2f6a4a'],
  ['#9ccac4', '#a8483a'],
];
function ladySprite(i: number, w: number, night: boolean): HTMLCanvasElement {
  const h = 78;
  const [wall, accent] = LADY_COLORS[i % LADY_COLORS.length] ?? ['#8fbcd4', '#b04a3a'];
  return cached(`sf-lady-${i}-${night ? 'n' : 'd'}`, w, h, (c) => {
    const rand = seeded(700 + i);
    const win = () => (night && rand() < 0.75 ? '#ffd88a' : '#4a6478');
    const gx = Math.round(w * 0.36);
    // 牆、水平的木板線
    px(c, wall, 2, 22, w - 4, h - 34);
    for (let y = 24; y < h - 12; y += 3) px(c, 'rgba(0,0,0,0.07)', 2, y, w - 4, 1);
    // 山牆：尖的三角形屋頂、裡面魚鱗瓦、圓窗
    c.fillStyle = '#3d3a44';
    c.beginPath();
    c.moveTo(gx - 22, 24);
    c.lineTo(gx, 0);
    c.lineTo(gx + 22, 24);
    c.fill();
    c.fillStyle = wall;
    c.beginPath();
    c.moveTo(gx - 17, 23);
    c.lineTo(gx, 5);
    c.lineTo(gx + 17, 23);
    c.fill();
    for (let y = 12; y < 23; y += 3) for (let x = gx - (y - 5) + 2; x < gx + (y - 5) - 2; x += 4) px(c, 'rgba(0,0,0,0.13)', x, y, 3, 1);
    c.fillStyle = '#f8f6f0';
    c.beginPath();
    c.arc(gx, 15, 4, 0, Math.PI * 2);
    c.fill();
    px(c, win(), gx - 2, 13, 4, 4);
    // 白色雕花的簷
    px(c, '#f8f6f0', gx - 20, 23, 40, 2);
    for (let x = gx - 18; x < gx + 18; x += 4) px(c, accent, x, 25, 2, 2);
    // 右邊的平頂＋小尖塔頂飾
    px(c, '#3d3a44', gx + 18, 18, w - gx - 18, 4);
    px(c, '#f8f6f0', gx + 18, 21, w - gx - 18, 2);
    px(c, accent, w - 8, 12, 3, 6);
    // 凸窗（左邊，兩層，三面）
    for (const y of [28, 46]) {
      px(c, '#f8f6f0', gx - 15, y, 30, 15);
      px(c, accent, gx - 15, y, 30, 2);
      px(c, win(), gx - 13, y + 3, 7, 10);
      px(c, win(), gx - 4, y + 3, 8, 10);
      px(c, win(), gx + 6, y + 3, 7, 10);
      px(c, 'rgba(255,255,255,0.35)', gx - 4, y + 3, 2, 10);
    }
    // 右邊：二樓的窗、一樓的門（白色的門廊、拱）
    px(c, '#f8f6f0', gx + 20, 29, w - gx - 26, 14);
    px(c, win(), gx + 22, 31, w - gx - 30, 10);
    px(c, accent, gx + 20, 29, w - gx - 26, 2);
    px(c, '#f8f6f0', gx + 19, 46, w - gx - 24, 20);
    c.fillStyle = '#f8f6f0';
    c.beginPath();
    c.arc(gx + 19 + (w - gx - 24) / 2, 47, (w - gx - 24) / 2, Math.PI, 0);
    c.fill();
    px(c, accent, gx + 23, 50, w - gx - 32, 16);
    px(c, win(), gx + 25, 52, w - gx - 36, 5);
    // 底座、往上的白色樓梯
    px(c, '#bdb5a2', 2, h - 12, w - 4, 12);
    px(c, '#9a948a', 2, h - 12, w - 4, 1);
    px(c, '#5a4a3a', gx - 10, h - 10, 20, 8);
    for (let k = 0; k < 4; k += 1) px(c, '#f0ece4', gx + 19 - k, h - 12 + k * 3, w - gx - 24 + k * 2, 3);
  });
}
function drawLadies(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const L = SF.ladies;
  const n = 7;
  const w = Math.round(((L.x1 - L.x0) * T) / n);
  for (let i = 0; i < n; i += 1) {
    const x = Math.round(L.x0 * T) + i * w;
    blit(c, ladySprite(i, w, d.night), x, L.line * T);
  }
  // 前面的小樹籬
  for (let x = L.x0 * T; x < L.x1 * T; x += 5) px(c, '#4f7a44', Math.round(x), L.line * T - 3, 4, 3);
}
// 遠方市中心的窗（晚上亮）
function drawSkylineNight(c: CanvasRenderingContext2D, d: DrawCtx): void {
  if (!d.night) return;
  const rand = seeded(77);
  for (let i = 0; i < 90; i += 1) {
    const x = SF.east * T + rand() * (W - SF.east * T);
    const y = (SF.walk + 0.6) * T + rand() * 3.4 * T;
    if (Math.sin(d.seconds * 0.3 + i) > 0.92) continue;
    px(c, rand() < 0.7 ? '#ffe2a0' : '#bfe6ff', Math.round(x), Math.round(y), 1, 2);
  }
  // 金字塔頂的燈
  glow(c, 43.6 * T, SF.walk * T + 4, 10, '255, 250, 220', 0.8);
}

// ── 路燈（黑色的柱子、白色的燈罩）、樹 ──
function drawGlobeLamp(c: CanvasRenderingContext2D, x: number, y: number, night: boolean): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.25)', cx - 4, by - 1, 8, 2);
  px(c, '#23262d', cx - 3, by - 4, 6, 4);
  px(c, '#2f333b', cx - 1, by - 30, 2, 27);
  px(c, '#23262d', cx - 2, by - 31, 4, 2);
  px(c, night ? '#fff3c4' : '#eef0f2', cx - 3, by - 37, 6, 6);
  px(c, 'rgba(255,255,255,0.8)', cx - 2, by - 36, 2, 2);
  px(c, '#23262d', cx - 1, by - 39, 2, 2);
}
// 柏樹（廣場上歪歪的大樹）
function drawCypress(c: CanvasRenderingContext2D, x: number, y: number, s: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 14, by - 1, 28, 4);
  px(c, '#5c3d22', cx - 2, by - 18, 4, 18);
  px(c, '#5c3d22', cx + 1, by - 24, 3, 8);
  const blobs: [number, number, number, string][] = [
    [-10, -26, 9, '#2f5a32'],
    [9, -30, 10, '#2f5a32'],
    [0, -36, 11, '#3a6a3a'],
    [-4, -28, 8, '#467a44'],
    [7, -38, 7, '#467a44'],
  ];
  for (const [dx, dy, r, col] of blobs) {
    c.fillStyle = col;
    c.beginPath();
    c.ellipse(cx + dx * s, by + dy * s, r * s * 1.2, r * s * 0.8, 0, 0, Math.PI * 2);
    c.fill();
  }
}
function drawRoundTree(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 9, by - 1, 18, 3);
  px(c, '#5c3d22', cx - 2, by - 12, 4, 12);
  for (const [dx, dy, r, col] of [[-6, -18, 7, '#3d7a3c'], [6, -18, 7, '#3d7a3c'], [0, -24, 8, '#4c8a46'], [0, -16, 6, '#5a9a52']] as const) {
    c.fillStyle = col;
    c.beginPath();
    c.arc(cx + dx, by + dy, r, 0, Math.PI * 2);
    c.fill();
  }
}

// ── 組合 ──
const PROMENADE_LAMPS: [number, number][] = [[4, 13.5], [15, 13.5], [25, 13.5], [33, 13.5], [38.5, 13.5]];
const STREET_LAMPS: [number, number][] = [[2, 24.9], [12, 24.9], [22, 24.9], [36, 24.9], [46, 24.9], [54.5, 24.9], [3, 41.5], [16, 41.5], [31, 38.6], [43, 42.2], [54.5, 38.6]];
const LAMPS = [...PROMENADE_LAMPS, ...STREET_LAMPS];
const CYPRESS: [number, number, number][] = [[31.6, 36.6, 0.9], [41.6, 36.4, 1], [55, 37, 0.95], [34, 43.4, 1], [50.5, 43.4, 1.05]];
const ROUND_TREES: [number, number][] = [[2.5, 43.4], [10, 43.4], [18.5, 43.4], [23, 43.4], [46, 35.8]];

const props: CityProp[] = [
  { y: 0.1, draw: (c, d) => drawBridgeLights(c, d) },
  { y: 0.2, draw: (c, d) => drawLighthouse(c, d) },
  { y: 0.3, draw: (c, d) => drawBoats(c, d) },
  { y: 0.4, draw: (c, d) => drawGulls(c, d) },
  { y: 0.5, draw: (c, d) => drawFog(c, d) },
  { y: SF.pier.y0 - 0.2, draw: (c, d) => drawSeaLions(c, d) },
  { y: SF.pier.y0, draw: (c) => drawPierRail(c) },
  { y: SF.shore, draw: (c) => drawSeawallRail(c) },
  ...BENCHES.map((b): CityProp => ({ y: b.y - 0.01, draw: (c) => drawBenchSeat(c, b.x, b.y) })),
  { y: SF.row, draw: (c, d) => drawStand(c, SF.crab, 'crab', 'FRESH CRAB', '珍寶蟹 · DUNGENESS', '#c8302a', 'crab', d, 13) },
  { y: SF.row, draw: (c, d) => drawStand(c, SF.chowder, 'chowder', 'CHOWDER', '麵包碗巧達湯', '#1f5a94', 'chowder', d, 22) },
  { y: SF.row, draw: (c, d) => blit(c, bakerySprite(d.night), SF.bakery.x0 * T, SF.row * T) },
  { y: SF.row, draw: (c, d) => blit(c, sundaeSprite(d.night), SF.sundae.x0 * T, SF.row * T) },
  ...SF.pierShops.map((s, i): CityProp => ({ y: SF.row, draw: (c) => blit(c, pierShopSprite(i, s.x0, s.x1), s.x0 * T, SF.row * T) })),
  { y: SF.row, draw: (c, d) => drawPierGate(c, d) },
  { y: SF.row - 0.4, draw: (c, d) => blit(c, helmSprite(d.night), SF.helm * T - 36, (SF.row - 0.4) * T) },
  { y: SF.row, draw: (c, d) => blit(c, bartSprite(d.night), SF.bart.x0 * T, SF.row * T) },
  ...WEST_HOUSES.map((y, k): CityProp => ({ y, draw: (c, d) => blit(c, rowHouseSprite(31 + k, Math.round((SF.westHouses.x1 - SF.westHouses.x0) * T), Math.round(3.6 * T), d.night), SF.westHouses.x0 * T, y * T) })),
  ...EAST_HOUSES.map((y, k): CityProp => ({ y, draw: (c, d) => blit(c, rowHouseSprite(51 + k, Math.round((SF.eastHouses.x1 - SF.eastHouses.x0) * T), Math.round(3.6 * T), d.night), SF.eastHouses.x0 * T, y * T) })),
  { y: SF.walk + 0.1, draw: (c, d) => drawSkylineNight(c, d) },
  { y: SF.ladies.line, draw: (c, d) => drawLadies(c, d) },
  { y: 27.4, draw: (c) => drawHillSign(c, 29.1, 27.4) },
  { y: SF.lombardTop.y1 + 0.3, draw: (c) => drawStreetSign(c, 5.5, SF.lombardTop.y1 + 0.3, 'LOMBARD ST') },
  { y: SF.lombardTop.y1 + 0.3, draw: (c) => drawStreetSign(c, 24, SF.lombardTop.y1 + 0.3, 'HYDE ST') },
  ...CYPRESS.map(([x, y, s]): CityProp => ({ y, draw: (c) => drawCypress(c, x, y, s) })),
  ...ROUND_TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawRoundTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawGlobeLamp(c, x, y, d.night) })),
];
// 叮噹車：y 跟著車子走（才會跟人正確地前後擋；CityScene 每幀讀一次 y，時間跟 d.seconds 同一個基準）
for (const k of [0, 1]) {
  props.push({
    get y() {
      return cableCarPos(performance.now() / 1000, k)?.y ?? 0;
    },
    draw: (c, d) => drawCableCars(c, d, k),
  });
}

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
const solid: Rect[] = [
  // 海灣（39 號碼頭的木棧板走得到）
  r(0, 0, SF.pier.x0, SF.shore - 0.1),
  r(SF.pier.x0 - 0.1, 0, SF.W, SF.pier.y0 + 0.1),
  // 攤子、店
  r(SF.crab - 2, SF.row - 1.6, SF.crab + 2, SF.row - 0.05),
  r(SF.chowder - 2, SF.row - 1.6, SF.chowder + 2, SF.row - 0.05),
  r(SF.bakery.x0, SF.row - 1.8, SF.bakery.x1, SF.row - 0.05),
  r(SF.sundae.x0, SF.row - 1.8, SF.sundae.x1, SF.row - 0.05),
  ...SF.pierShops.map((s) => r(s.x0, SF.row - 1.8, s.x1, SF.row - 0.05)),
  r(SF.pierGate.x0, SF.row - 0.3, SF.pierGate.x0 + 0.5, SF.row),
  r(SF.pierGate.x1 - 0.5, SF.row - 0.3, SF.pierGate.x1, SF.row),
  r(SF.helm - 0.4, SF.row - 0.8, SF.helm + 0.4, SF.row - 0.35),
  r(SF.bart.x0, SF.row - 1.6, SF.bart.x1, SF.row - 0.05),
  // 長椅
  ...BENCHES.map((b) => r(b.x - 1.3, b.y - 0.35, b.x + 1.3, b.y + 0.15)),
  // 九曲花街兩邊的房子、阿拉莫廣場後面的遠景（Painted Ladies）
  r(SF.westHouses.x0, SF.walk, SF.westHouses.x1, SF.lombard.y1),
  r(SF.eastHouses.x0, SF.walk, SF.eastHouses.x1, SF.lombard.y1),
  r(SF.east, SF.walk, SF.W, SF.ladies.line - 0.05),
  // 樹、燈、牌子
  ...CYPRESS.map(([x, y]) => r(x - 0.3, y - 0.35, x + 0.3, y + 0.1)),
  ...ROUND_TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.15, y - 0.2, x + 0.15, y + 0.05)),
  r(29, 27.2, 29.3, 27.45),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T, y: y * T - 34, r: 36 })),
  { x: SF.crab * T, y: SF.row * T - 30, r: 50, color: 'rgba(255, 190, 130, 0.45)' },
  { x: SF.chowder * T, y: SF.row * T - 30, r: 50, color: 'rgba(255, 190, 130, 0.45)' },
  { x: ((SF.bakery.x0 + SF.bakery.x1) / 2) * T, y: SF.row * T - 16, r: 70, color: 'rgba(255, 210, 150, 0.45)' },
  { x: ((SF.sundae.x0 + SF.sundae.x1) / 2) * T, y: SF.row * T - 16, r: 64, color: 'rgba(255, 200, 150, 0.45)' },
  { x: SF.helm * T, y: SF.row * T - 60, r: 46, color: 'rgba(140, 210, 255, 0.4)' },
  { x: ((SF.bart.x0 + SF.bart.x1) / 2) * T, y: SF.row * T - 30, r: 46, color: 'rgba(190, 235, 255, 0.45)' },
  { x: ((SF.pierGate.x0 + SF.pierGate.x1) / 2) * T, y: SF.row * T - 54, r: 50, color: 'rgba(255, 230, 160, 0.4)' },
  ...SF.bridge.towers.map((x) => ({ x: x * T, y: SF.bridge.deck * T - 20, r: 60, color: 'rgba(255, 120, 80, 0.35)' })),
  { x: 13 * T, y: SF.bridge.deck * T, r: 110, color: 'rgba(255, 200, 120, 0.25)' },
  { x: SF.alcatraz.x0 * T + 41, y: SF.alcatraz.y * T - 78, r: 40, color: 'rgba(255, 240, 180, 0.5)' },
  { x: 36 * T, y: SF.alcatraz.y * T - 36, r: 50, color: 'rgba(255, 220, 160, 0.25)' },
  { x: 43 * T, y: 28 * T, r: 140, color: 'rgba(255, 220, 160, 0.25)' },
  ...[0, 1, 2, 3, 4, 5, 6].map((i) => ({ x: (SF.ladies.x0 + 1.6 + i * 3.29) * T, y: (SF.ladies.line - 2) * T, r: 40, color: 'rgba(255, 210, 140, 0.35)' })),
  ...WEST_HOUSES.map((y) => ({ x: 2.5 * T, y: (y - 2) * T, r: 34, color: 'rgba(255, 210, 140, 0.3)' })),
  ...EAST_HOUSES.map((y) => ({ x: 21.8 * T, y: (y - 2) * T, r: 30, color: 'rgba(255, 210, 140, 0.3)' })),
];

const stationX = (SF.bart.x0 + SF.bart.x1) / 2;

export const SANFRANCISCO: CityDef = {
  id: 'sanfrancisco',
  country: 'us',
  line: 'flight',
  W: SF.W,
  H: SF.H,
  title: { 'zh-TW': '舊金山 · 金門大橋與漁人碼頭', 'en-US': 'San Francisco · Golden Gate & Fisherman’s Wharf' },
  stop: { 'zh-TW': '舊金山（SFO 機場）', 'en-US': 'San Francisco (SFO)' },
  emoji: '🌉',
  station: {
    x: stationX,
    y: SF.row + 0.6,
    name: { 'zh-TW': 'BART 往 SFO 機場', 'en-US': 'BART to SFO Airport' },
    arrive: { x: stationX + 1.6, y: SF.row + 0.8 },
  },
  background: '#cfc9bd',
  soundscape: 'beach',
  paintGround: paintSfGround,
  props,
  solid,
  blocked: lombardBlocked,
  seats: SF_SEATS,
  drawSeat: () => undefined,
  drawSeatFront: (c, i) => drawSeatFront(c, i),
  shops: SF_SHOPS,
  infos: [
    {
      at: r(0, 0, SF.bridge.right + 1, SF.bridge.water),
      title: { 'zh-TW': '金門大橋', 'en-US': 'Golden Gate Bridge' },
      text: {
        'zh-TW': '1937 年通車的懸索橋，主跨 1280 公尺，當年是世界最長。顏色叫「國際橘」，在霧裡也看得清楚。夏天常有太平洋的霧從海上飄進來蓋住橋塔——這裡的霧每幾分鐘會飄進來一次。（地圖把橋畫成從碼頭望過去的側面，距離縮短了。）',
        'en-US': 'Opened in 1937, its 1,280 m main span was the world’s longest. The colour, “International Orange”, stays visible in fog — and Pacific fog often rolls in to swallow the towers (here it drifts in every few minutes). The map shows it side-on as seen from the wharf, much closer than in reality.',
      },
    },
    {
      at: r(SF.alcatraz.x0, 2.6, SF.alcatraz.x1, SF.alcatraz.y),
      title: { 'zh-TW': '惡魔島', 'en-US': 'Alcatraz Island' },
      text: {
        'zh-TW': '海灣中間的小島，1934–1963 年是聯邦監獄，關過艾爾·卡彭。島上的燈塔是美國西岸第一座燈塔（1854 年，現在這座是 1909 年重建的）。現在是國家公園，從碼頭搭渡輪就能上島參觀。',
        'en-US': 'A federal prison from 1934 to 1963 that once held Al Capone. Its lighthouse was the first on the US West Coast (1854; today’s tower dates from 1909). Now a national park, reached by ferry from the wharf.',
      },
    },
    {
      at: r(SF.pier.x0, 6.8, SF.W, SF.pier.y0),
      title: { 'zh-TW': '39 號碼頭的海獅', 'en-US': 'Pier 39 Sea Lions' },
      text: {
        'zh-TW': '1989 年洛馬普列塔大地震後，加州海獅開始跑來 39 號碼頭的浮台上曬太陽，碼頭乾脆把浮台讓給牠們。多的時候有上百隻，整天叫、翻身、搶位子。',
        'en-US': 'After the 1989 Loma Prieta earthquake, California sea lions began hauling out on Pier 39’s floating docks, and the marina gave the docks to them. Hundreds may gather, barking, rolling and jostling for space all day.',
      },
    },
    {
      at: r(SF.helm - 2.2, SF.row - 5.6, SF.helm + 2.2, SF.row - 0.4),
      title: { 'zh-TW': '漁人碼頭', 'en-US': 'Fisherman’s Wharf' },
      text: {
        'zh-TW': '19 世紀義大利漁民的碼頭，現在是舊金山最熱鬧的觀光區。舵輪中間一隻螃蟹的招牌是這裡的地標；路邊的攤子現煮珍寶蟹，麵包碗裝巧達湯是必吃。（店名、招牌是自己畫的，不是真的店。）',
        'en-US': 'Once the harbour of Italian fishermen, now San Francisco’s busiest tourist strip. The ship’s-wheel sign with a crab is its landmark; stands boil Dungeness crab and serve chowder in sourdough bowls. (Shop signs here are made up.)',
      },
    },
    {
      at: r(SF.hyde.x0, SF.walk, SF.hyde.x1, SF.walk + 1.8),
      title: { 'zh-TW': '叮噹車（Cable Car）', 'en-US': 'Cable Cars' },
      text: {
        'zh-TW': '1873 年開始的纜車：路面下有一條一直在跑的鋼纜，車上的司機用夾鉗夾住纜繩就被拉上坡。Hyde 街的終點在漁人碼頭旁，車子開到底要用人力推著轉車台掉頭。舊金山的坡很陡，路口是平的、中間的坡段特別陡。',
        'en-US': 'Running since 1873: a steel cable moves constantly under the street, and the gripman clamps onto it to be hauled uphill. The Hyde line ends by the wharf, where crews push the car around on a turntable. Hills are steep, with flat intersections between the steep blocks.',
      },
    },
    {
      at: r(SF.lombard.x0, SF.lombard.y0, SF.lombard.x1, SF.lombard.y1),
      title: { 'zh-TW': '九曲花街（Lombard Street）', 'en-US': 'Lombard Street' },
      text: {
        'zh-TW': '1922 年把太陡的一段路改成 8 個髮夾彎，紅磚路兩邊種滿繡球花，號稱「世界上最彎的街」。車子只能往下開，時速 5 英里。（真的九曲花街是東西向、坡頂接 Hyde 街；地圖轉成南北向，離碼頭也近很多。）',
        'en-US': 'In 1922 this too-steep block was rebuilt with eight hairpin turns of red brick lined with hydrangeas — “the crookedest street in the world”. Cars may only drive down, at 5 mph. (The real block runs east–west from Hyde St; the map turns it north–south and much closer to the wharf.)',
      },
    },
    {
      at: r(SF.ladies.x0, SF.walk + 0.4, SF.ladies.x1, SF.ladies.line),
      title: { 'zh-TW': 'Painted Ladies 與泛美金字塔', 'en-US': 'Painted Ladies & Transamerica Pyramid' },
      text: {
        'zh-TW': 'Steiner 街上一排 1890 年代的 Queen Anne 式維多利亞房子，漆成好幾種顏色，被叫做「彩繪女士」。從阿拉莫廣場的草地看過去，後面是市中心的天際線和 1972 年蓋的泛美金字塔。（真的在市區西邊，離碼頭約 4 公里。）',
        'en-US': 'A row of 1890s Queen Anne Victorians on Steiner Street, painted in several colours. Seen from the lawn of Alamo Square, the downtown skyline and the 1972 Transamerica Pyramid rise behind. (Really about 4 km from the wharf.)',
      },
    },
  ],
  labels: [
    { x: 15, y: SF.shore - 1.6, text: { 'zh-TW': '🌉 碼頭長椅（看金門大橋、惡魔島）', 'en-US': '🌉 Wharf benches (Golden Gate & Alcatraz)' }, color: '#bae6fd' },
    { x: 48.2, y: 7.6, text: { 'zh-TW': '🦭 39 號碼頭 · 海獅', 'en-US': '🦭 Pier 39 · Sea lions' }, color: '#fde68a' },
    { x: 43, y: ALAMO_BENCH_Y + 1.5, text: { 'zh-TW': '🏠 阿拉莫廣場（看 Painted Ladies）', 'en-US': '🏠 Alamo Square (Painted Ladies view)' }, color: '#bbf7d0' },
    { x: 12.5, y: SF.lombardTop.y1 + 0.2, text: { 'zh-TW': '🌸 九曲花街', 'en-US': '🌸 Lombard Street' }, color: '#fbcfe8' },
  ],
  walkers: [
    { x0: 1, y0: 16.4, x1: 39, y1: 16.4, count: 4 },
    { x0: 1, y0: 20.7, x1: 55, y1: 20.7, count: 4 },
    { x0: 1, y0: 24.4, x1: 55, y1: 24.4, count: 4 },
    { x0: 40.6, y0: 14.2, x1: 55, y1: 14.2, count: 2 },
    { x0: 24, y0: 25.4, x1: 24, y1: 43.5, count: 2 },
    { x0: 29, y0: 25.4, x1: 29, y1: 33.6, count: 1 },
    { x0: 29.6, y0: 33.8, x1: 55.5, y1: 33.8, count: 2 },
    { x0: 30, y0: 40.8, x1: 55.5, y1: 41.4, count: 2 },
    { x0: 1, y0: 40.5, x1: 23.5, y1: 40.5, count: 2 },
  ],
  traffic: [
    { y: 22.1, dir: -1, x0: 0, x1: SF.W, count: 2 },
    { y: 23.3, dir: 1, x0: 0, x1: SF.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點碼頭、39 號碼頭或阿拉莫廣場的長椅坐下專注 · 走到攤子買珍寶蟹、巧達湯、酸種麵包、聖代 · 點地標看介紹 · BART 往 SFO 機場：飛去美國其他城市或回台灣',
    'en-US': 'WASD / arrows to move · click a bench at the wharf, Pier 39 or Alamo Square to focus · visit the stands for crab, chowder, sourdough and sundaes · click landmarks for info · BART to SFO for other US cities or home to Taiwan',
  },
  hintTouch: {
    'zh-TW': '點長椅坐下專注 · 走到攤子買東西 · 點地標看介紹 · BART 往 SFO 機場',
    'en-US': 'Tap a bench to focus · visit the stands · tap landmarks · BART to SFO',
  },
};
