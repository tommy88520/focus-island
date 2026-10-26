// 新竹的美術：城隍廟（燕尾脊、剪黏、「金門保障」大匾、紅燈籠、香爐的煙）、廟口小吃的騎樓（一攤攤招牌、冒煙的湯鍋）、
// 東邊的街屋、護城河親水公園（一階階石階、踏腳石、拱橋、柳樹）、東門城迎曦門（石砌城基、拱門、二層城樓）、
// 新竹車站（巴洛克式立面、鐘樓的時鐘照台灣時間走、綠色屋頂）。最後組成 CityScene 用的 HSINCHU。
import type { CityDef, CityProp, DrawCtx, Rect } from './city';
import { CANAL_BENCHES, CANAL_BENCH_Y, FOOD_STALLS, HC, HSINCHU_SEATS, HSINCHU_SHOPS, PLAZA_BENCHES } from './hsinchu';
import { px, seeded } from './pixelUtil';
import { T, FONT_TC, SERIF_TC, text, glow, cached, blit, road, tiles, townhouseSprite, type Townhouse, drawLamp, drawBench, drawStreetTree, drawParkedScooter, SCOOTER_COLORS } from './cityArt';

const WATER = '#3f8a96';

// ── 地面（畫一次）──
export function paintHsinchuGround(c: CanvasRenderingContext2D): void {
  const rand = seeded(1893);
  const W = HC.W * T;
  // 北邊建築後面：一片城市的屋頂（女兒牆、水塔、太陽能熱水器、鐵皮加蓋）
  px(c, '#8a8580', 0, 0, W, HC.northLine * T);
  for (let x = 0; x < W; ) {
    const bw = 30 + Math.floor(rand() * 40);
    const top = Math.floor(rand() * 18);
    px(c, ['#9a948e', '#a8a29a', '#8f8984', '#b0aaa2'][Math.floor(rand() * 4)] ?? '#9a948e', x, top, bw - 2, HC.northLine * T - top);
    px(c, 'rgba(0,0,0,0.18)', x + bw - 4, top, 2, HC.northLine * T - top);
    px(c, 'rgba(255,255,255,0.25)', x, top, bw - 2, 2);
    // 後面大樓的窗戶
    for (let wy = top + 22; wy < HC.northLine * T - 8; wy += 12) {
      for (let wx = x + 4; wx < x + bw - 10; wx += 9) px(c, rand() < 0.15 ? '#ffe9a8' : '#5a6070', wx, wy, 5, 6);
    }
    const kind = rand();
    if (kind < 0.35) {
      px(c, '#4f7ab0', x + 4, top + 6, Math.min(26, bw - 10), 12);
      for (let k = x + 5; k < x + 4 + Math.min(26, bw - 10); k += 3) px(c, '#3f6a9e', k, top + 6, 1, 12);
    } else if (kind < 0.65) {
      px(c, '#c9ccd6', x + bw - 16, top + 4, 10, 8);
      px(c, '#e8ecf0', x + bw - 16, top + 4, 10, 2);
    } else {
      px(c, '#2f3a4a', x + 6, top + 6, 14, 6);
      for (let k = 0; k < 4; k += 1) px(c, '#5a7a9a', x + 7 + k * 3, top + 7, 2, 4);
      px(c, '#c9ccd6', x + 8, top + 3, 10, 3);
    }
    x += bw;
  }
  // 廟前、騎樓前的人行道、中山路
  tiles(c, { x0: 0, y0: HC.northLine, x1: HC.W, y1: HC.northRoad.y0 }, '#cfc6b4', '#bdb4a2', 8);
  road(c, { x0: 0, y0: HC.northRoad.y0, x1: HC.W, y1: HC.northRoad.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.75)', x, ((HC.northRoad.y0 + HC.northRoad.y1) / 2) * T, 10, 2);
  // 中間：公園草地
  px(c, '#7aa85a', 0, HC.northRoad.y1 * T, W, (HC.southRoad.y0 - HC.northRoad.y1) * T);
  for (let i = 0; i < 1400; i += 1) px(c, rand() < 0.5 ? '#6a9a4c' : '#8cbc6a', Math.floor(rand() * W), Math.floor(HC.northRoad.y1 * T + rand() * (HC.southRoad.y0 - HC.northRoad.y1) * T), 2, 1);
  // 公園的步道（中山路下來到護城河、沿著河）
  tiles(c, { x0: 0, y0: HC.northRoad.y1, x1: HC.canal.x1 + 1, y1: HC.northRoad.y1 + 1.2 }, '#d9cfb8', '#c9bfa8', 8);
  tiles(c, { x0: 0, y0: 17.8, x1: HC.canal.x1 + 1, y1: HC.canalStepsN }, '#d9cfb8', '#c9bfa8', 8);
  tiles(c, { x0: HC.canal.x1, y0: HC.northRoad.y1, x1: HC.canal.x1 + 1.4, y1: HC.southRoad.y0 }, '#d9cfb8', '#c9bfa8', 8);
  // 護城河：北岸、南岸一階階的石階往下到水邊
  const cv = HC.canal;
  for (let k = 0; k < 4; k += 1) {
    const y = (HC.canalStepsN + k * 0.3) * T;
    px(c, k % 2 ? '#b8b0a0' : '#c9c1b0', 0, Math.round(y), cv.x1 * T, Math.ceil(0.3 * T));
    const ys = (cv.y1 + k * 0.25) * T;
    px(c, k % 2 ? '#b8b0a0' : '#c9c1b0', 0, Math.round(ys), cv.x1 * T, Math.ceil(0.25 * T));
  }
  const g = c.createLinearGradient(0, cv.y0 * T, 0, cv.y1 * T);
  g.addColorStop(0, '#5aa0a8');
  g.addColorStop(1, WATER);
  c.fillStyle = g;
  c.fillRect(0, cv.y0 * T, cv.x1 * T, (cv.y1 - cv.y0) * T);
  // 踏腳石
  for (const sx of [4, 15.6, 20.4, 30.4]) {
    for (let k = 0; k < 3; k += 1) {
      c.fillStyle = '#a8a094';
      c.beginPath();
      c.ellipse((sx + (k % 2) * 0.5) * T, (cv.y0 + 0.5 + k * 0.9) * T, 6, 4, 0, 0, Math.PI * 2);
      c.fill();
    }
  }
  // 河的東端：一道小瀑布接到地下
  px(c, '#8a8478', cv.x1 * T - 4, cv.y0 * T - 4, 6, (cv.y1 - cv.y0) * T + 8);
  // 東門城圓環廣場：石板圓、外圈一圈草和花
  const pz = HC.plaza;
  c.fillStyle = '#5f9a4a';
  c.beginPath();
  c.arc(pz.cx * T, pz.cy * T, pz.r * T, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#d6cdbd';
  c.beginPath();
  c.arc(pz.cx * T, pz.cy * T, (pz.r - 0.7) * T, 0, Math.PI * 2);
  c.fill();
  for (let k = 0; k < 40; k += 1) {
    const a = (k / 40) * Math.PI * 2;
    px(c, ['#ff6fb5', '#ffd23f', '#ffffff'][k % 3] ?? '#ffd23f', Math.round(pz.cx * T + Math.cos(a) * (pz.r - 0.35) * T) - 1, Math.round(pz.cy * T + Math.sin(a) * (pz.r - 0.35) * T) - 1, 3, 3);
  }
  for (let r = 1; r < pz.r - 1; r += 1) {
    c.strokeStyle = 'rgba(160,150,135,0.5)';
    c.lineWidth = 1;
    c.beginPath();
    c.arc(pz.cx * T, pz.cy * T, r * T, 0, Math.PI * 2);
    c.stroke();
  }
  // 中華路、車站前廣場
  road(c, { x0: 0, y0: HC.southRoad.y0, x1: HC.W, y1: HC.southRoad.y1 }, rand);
  for (let x = 0; x < W; x += 20) px(c, 'rgba(240,240,240,0.75)', x, ((HC.southRoad.y0 + HC.southRoad.y1) / 2) * T, 10, 2);
  tiles(c, { x0: 0, y0: HC.southRoad.y1, x1: HC.W, y1: HC.H }, '#d6cfc0', '#c7bfae', 10);
  px(c, '#9a948a', HC.station.x0 * T - 8, HC.station.y * T, (HC.station.x1 - HC.station.x0) * T + 16, 6);
}

// 河面的波光
function drawCanalShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  const cv = HC.canal;
  for (let i = 0; i < 24; i += 1) {
    const x = (i * 83.7 + seconds * (8 + (i % 3) * 3)) % (cv.x1 * T);
    const y = cv.y0 * T + 4 + ((i * 29) % ((cv.y1 - cv.y0) * T - 8));
    px(c, `rgba(230, 250, 255, ${0.2 + 0.15 * Math.sin(seconds * 1.6 + i)})`, Math.round(x), Math.round(y), 6, 1);
  }
}

// ── 城隍廟：石台基、紅牆、龍柱、三川門（門神）、「城隍廟」匾、門上大匾「金門保障」、燕尾脊＋剪黏、紅燈籠 ──
function templeSprite(): HTMLCanvasElement {
  const w = Math.round((HC.temple.x1 - HC.temple.x0) * T);
  const h = 92;
  return cached('hc-temple', w, h, (c) => {
    const base = h;
    const cx = w / 2;
    px(c, '#9a948a', 0, base - 8, w, 8);
    for (let s = 0; s < 3; s += 1) px(c, s % 2 ? '#b5ad9f' : '#c9c0ae', cx - 30 + s * 3, base - 8 + s * 2, 60 - s * 6, 2);
    px(c, '#8b2a22', 6, base - 56, w - 12, 48);
    px(c, '#a33a2e', 6, base - 56, w - 12, 2);
    for (const x of [12, cx - 24, cx + 20, w - 16]) {
      px(c, '#a8a49c', x, base - 52, 4, 44);
      for (let k = 0; k < 6; k += 1) px(c, '#6e8a7a', x + (k % 2 ? 0 : 2), base - 50 + k * 7, 2, 4);
    }
    const door = (dx: number, dw: number, dh: number, gods: boolean) => {
      px(c, '#4a1a12', dx - 1, base - 8 - dh - 1, dw + 2, dh + 1);
      px(c, '#7a2a1c', dx, base - 8 - dh, dw, dh);
      for (const side of [0, 1]) {
        const gx = dx + 2 + side * (dw / 2);
        if (gods) {
          px(c, '#2f5fa8', gx, base - 8 - dh + 3, dw / 2 - 4, dh - 6);
          px(c, '#f2c27a', gx + 2, base - 8 - dh + 5, dw / 2 - 8, 4);
          px(c, '#c62828', gx + 1, base - 8 - dh + 10, dw / 2 - 6, 6);
        }
      }
    };
    door(cx - 13, 26, 30, true);
    door(18, 16, 22, false);
    door(w - 34, 16, 22, false);
    // 「金門保障」大匾（門上）、「城隍廟」匾（屋簷下）
    px(c, '#15100c', cx - 26, base - 50, 52, 11);
    px(c, '#c9a24a', cx - 26, base - 50, 52, 1);
    px(c, '#c9a24a', cx - 26, base - 40, 52, 1);
    text(c, '金門保障', cx, base - 44.5, '#f2d27a', `900 8px ${SERIF_TC}`);
    // 屋頂：橘紅瓦、燕尾脊、剪黏
    const roofY = base - 56;
    c.fillStyle = '#c0522a';
    c.beginPath();
    c.moveTo(-4, roofY + 2);
    c.lineTo(16, roofY - 16);
    c.lineTo(w - 16, roofY - 16);
    c.lineTo(w + 4, roofY + 2);
    c.closePath();
    c.fill();
    for (let k = 0; k < 16; k += 3) px(c, '#a8441f', 6 + k * 0.8, roofY - 14 + k, w - 12 - k * 1.6, 1);
    c.strokeStyle = '#e8d5a8';
    c.lineWidth = 3;
    c.beginPath();
    c.moveTo(6, roofY - 30);
    c.quadraticCurveTo(14, roofY - 16, 26, roofY - 18);
    c.lineTo(w - 26, roofY - 18);
    c.quadraticCurveTo(w - 14, roofY - 16, w - 6, roofY - 30);
    c.stroke();
    for (let k = 0; k < 10; k += 1) px(c, k % 3 === 0 ? '#2bb673' : k % 3 === 1 ? '#3a7be0' : '#f2c14e', 30 + k * ((w - 60) / 9), roofY - 23 - Math.round(Math.sin(k * 0.9) * 2), 3, 3);
    px(c, '#ff5a3a', cx - 2, roofY - 28, 4, 4);
    // 屋頂正中間的廟名匾
    px(c, '#15100c', cx - 22, roofY - 13, 44, 10);
    px(c, '#c9a24a', cx - 22, roofY - 13, 44, 1);
    px(c, '#c9a24a', cx - 22, roofY - 4, 44, 1);
    text(c, '新竹都城隍廟', cx, roofY - 8, '#f2d27a', `900 6px ${SERIF_TC}`);
    // 屋簷下一排紅燈籠
    for (let k = 0; k < 6; k += 1) {
      const lx = Math.round(14 + k * ((w - 28) / 5));
      if (Math.abs(lx - cx) < 22) continue;
      px(c, '#3a1a12', lx, roofY + 2, 1, 3);
      px(c, '#d72d2d', lx - 3, roofY + 5, 7, 8);
      px(c, '#ff6a5a', lx - 2, roofY + 6, 2, 6);
      px(c, '#f2c14e', lx - 3, roofY + 5, 7, 1);
    }
  });
}

// 廟前的香爐（一直冒煙）
function drawBurner(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const x = Math.round(((HC.temple.x0 + HC.temple.x1) / 2) * T);
  const y = Math.round((HC.northLine + 0.95) * T);
  px(c, 'rgba(0,0,0,0.3)', x - 8, y + 1, 17, 3);
  px(c, '#6b4a2a', x - 6, y - 3, 3, 4);
  px(c, '#6b4a2a', x + 4, y - 3, 3, 4);
  px(c, '#8a6a3a', x - 8, y - 11, 17, 9);
  px(c, '#c9a24a', x - 8, y - 11, 17, 2);
  for (let k = 0; k < 4; k += 1) px(c, '#e25a4a', x - 3 + k * 2, y - 16, 1, 5);
  for (let k = 0; k < 5; k += 1) {
    const t = (d.seconds * 0.35 + k / 5) % 1;
    px(c, `rgba(220,220,230,${0.45 * (1 - t)})`, Math.round(x - 2 + Math.sin(d.seconds * 1.5 + k * 2) * (2 + t * 5)), Math.round(y - 18 - t * 30), 3 + Math.round(t * 3), 2);
  }
  glow(c, x, y - 14, 10, '255, 150, 80', 0.3);
}

// 廟口小吃：一長排騎樓，屋頂上「新竹城隍廟口小吃」大招牌，騎樓下一攤攤（招牌、湯鍋冒煙、後面的老闆）
function foodHallSprite(): HTMLCanvasElement {
  const w = Math.round((HC.foodHall.x1 - HC.foodHall.x0) * T);
  const h = 72;
  return cached('hc-foodhall', w, h, (c) => {
    px(c, '#e8dcc4', 0, 16, w, h - 16);
    for (let f = 0; f < 2; f += 1) {
      for (let x = 6; x < w - 10; x += 14) {
        px(c, '#5a4636', x - 1, 22 + f * 13, 11, 9);
        px(c, '#c9dbe6', x, 23 + f * 13, 9, 7);
      }
    }
    px(c, '#c62828', 4, 2, w - 8, 14);
    px(c, '#f6c945', 4, 2, w - 8, 1);
    px(c, '#f6c945', 4, 15, w - 8, 1);
    text(c, '新竹城隍廟口小吃', w / 2, 9.5, '#ffe9a8', `900 9px ${FONT_TC}`);
    // 騎樓
    px(c, '#3a2e28', 0, h - 22, w, 22);
    px(c, '#f6dfae', 3, h - 18, w - 6, 15);
    for (let k = 0; k < w; k += Math.round(w / 4)) px(c, '#e8dcc4', k, h - 22, 3, 22);
    px(c, 'rgba(0,0,0,0.3)', 0, h - 22, w, 2);
  });
}

function drawFoodHall(c: CanvasRenderingContext2D, d: DrawCtx): void {
  blit(c, foodHallSprite(), HC.foodHall.x0 * T, HC.northLine * T);
  // 每一攤：白鐵台面、招牌、湯鍋的蒸氣
  for (const [i, s] of FOOD_STALLS.entries()) {
    const cx = Math.round(s.x * T);
    const by = Math.round(HC.northLine * T);
    px(c, '#9aa3b2', cx - 22, by - 8, 44, 6);
    px(c, '#d6dae2', cx - 22, by - 8, 44, 1);
    px(c, s.sign, cx - 16, by - 20, 32, 8);
    text(c, s.name['zh-TW'], cx, by - 16, '#ffffff', `900 6px ${FONT_TC}`);
    px(c, '#c9ccd6', cx - 12, by - 12, 10, 4);
    for (let k = 0; k < 2; k += 1) {
      const t = (d.seconds * 0.6 + k / 2 + i * 0.13) % 1;
      px(c, `rgba(255,255,255,${0.45 * (1 - t)})`, Math.round(cx - 8 + k * 5 + Math.sin(d.seconds * 2 + k) * 2), Math.round(by - 14 - t * 12), 3, 2);
    }
  }
}

// 東邊的街屋
const EAST_HOUSES: Townhouse[] = (() => {
  const out: Townhouse[] = [];
  const rand = seeded(35);
  let x = HC.temple.x1 + 0.4;
  while (x < HC.W - 0.5) {
    const w = Math.min(2.8 + Math.floor(rand() * 3) * 0.6, HC.W - x);
    out.push({ x0: x, x1: x + w, floors: 2 + Math.floor(rand() * 2), seed: Math.floor(rand() * 10000) });
    x += w;
  }
  return out;
})();
const HC_WORDS = ['米粉', '貢丸', '布行', '書局', '茶行', '眼鏡', '玻璃', '鐘錶'];

// ── 東門城（迎曦門）：石砌城基（中間一個拱門）、上面的二層城樓（紅柱白牆、雙層橘瓦屋頂） ──
function gateSprite(): HTMLCanvasElement {
  const w = Math.round(HC.gate.half * 2 * T);
  const h = 92;
  return cached('hc-gate', w, h, (c) => {
    const base = h;
    const cx = w / 2;
    // 城基（往上收窄的石牆）
    c.fillStyle = '#a8a092';
    c.beginPath();
    c.moveTo(0, base);
    c.lineTo(6, base - 34);
    c.lineTo(w - 6, base - 34);
    c.lineTo(w, base);
    c.closePath();
    c.fill();
    for (let y = base - 32; y < base; y += 5) for (let x = ((y / 5) % 2) * 6; x < w; x += 12) px(c, 'rgba(90,80,70,0.35)', x, y, 1, 5);
    for (let y = base - 32; y < base; y += 5) px(c, 'rgba(90,80,70,0.3)', 0, y, w, 1);
    // 拱門
    c.fillStyle = '#2a2420';
    c.beginPath();
    c.moveTo(cx - 9, base);
    c.lineTo(cx - 9, base - 14);
    c.arc(cx, base - 14, 9, Math.PI, 0);
    c.lineTo(cx + 9, base);
    c.closePath();
    c.fill();
    px(c, '#15100c', cx - 12, base - 32, 24, 7);
    text(c, '迎曦門', cx, base - 28.5, '#f2d27a', `900 5px ${SERIF_TC}`);
    // 城樓：白牆紅柱、四周的欄杆
    const tw = w - 24;
    const tx = 12;
    px(c, '#8a3a2e', tx - 2, base - 37, tw + 4, 3);
    px(c, '#f2ece0', tx, base - 56, tw, 19);
    for (let k = 0; k <= 4; k += 1) px(c, '#b71c1c', Math.round(tx + k * ((tw - 3) / 4)), base - 56, 3, 19);
    for (let k = 0; k < 3; k += 1) px(c, '#5a4636', Math.round(tx + 8 + k * ((tw - 20) / 2)), base - 50, 6, 9);
    // 下層屋簷
    c.fillStyle = '#d06a32';
    c.beginPath();
    c.moveTo(tx - 10, base - 54);
    c.lineTo(tx + 2, base - 62);
    c.lineTo(tx + tw - 2, base - 62);
    c.lineTo(tx + tw + 10, base - 54);
    c.closePath();
    c.fill();
    // 上層樓＋屋頂（歇山頂、翹起來的屋角）
    px(c, '#f2ece0', tx + 8, base - 72, tw - 16, 10);
    for (let k = 0; k <= 3; k += 1) px(c, '#b71c1c', Math.round(tx + 8 + k * ((tw - 19) / 3)), base - 72, 3, 10);
    c.fillStyle = '#d06a32';
    c.beginPath();
    c.moveTo(tx - 4, base - 70);
    c.lineTo(tx + 10, base - 84);
    c.lineTo(tx + tw - 10, base - 84);
    c.lineTo(tx + tw + 4, base - 70);
    c.closePath();
    c.fill();
    for (let k = 0; k < 12; k += 3) px(c, '#b0521f', tx + k * 0.8, base - 82 + k, tw - k * 1.6, 1);
    px(c, '#e8d5a8', tx + 8, base - 86, tw - 16, 2);
    px(c, '#e8d5a8', tx - 6, base - 74, 4, 2);
    px(c, '#e8d5a8', tx + tw + 2, base - 74, 4, 2);
  });
}

// ── 護城河的拱橋（石橋、兩邊欄杆） ──
function drawBridge(c: CanvasRenderingContext2D, x: number): void {
  const x0 = Math.round((x - HC.bridgeHalf) * T);
  const w = Math.round(HC.bridgeHalf * 2 * T);
  const y0 = Math.round((HC.canal.y0 - 0.4) * T);
  const y1 = Math.round((HC.canal.y1 + 0.4) * T);
  px(c, 'rgba(0,0,0,0.2)', x0 + 3, y0 + 4, w, y1 - y0);
  px(c, '#bfb6a6', x0, y0, w, y1 - y0);
  for (let y = y0; y < y1; y += 6) px(c, '#ada492', x0, y, w, 1);
  for (const sx of [x0, x0 + w - 3]) {
    px(c, '#e8e2d6', sx, y0 - 6, 3, y1 - y0 + 6);
    for (let y = y0 - 6; y < y1; y += 8) px(c, '#c9c2b4', sx - 1, y, 5, 3);
  }
}

// ── 新竹車站：巴洛克式的灰色立面、白色線腳、拱窗、中間鐘樓（綠色屋頂、時鐘照台灣時間） ──
function stationSprite(): HTMLCanvasElement {
  const w = Math.round((HC.station.x1 - HC.station.x0) * T);
  const h = 112;
  return cached('hc-station', w, h, (c) => {
    const base = h;
    const cx = w / 2;
    // 兩翼
    px(c, '#b9b6ae', 0, base - 50, w, 50);
    px(c, '#e8e4dc', 0, base - 50, w, 3);
    px(c, '#e8e4dc', 0, base - 26, w, 2);
    // 兩翼的綠色斜屋頂
    c.fillStyle = '#4f7a6a';
    c.beginPath();
    c.moveTo(-2, base - 50);
    c.lineTo(10, base - 62);
    c.lineTo(w - 10, base - 62);
    c.lineTo(w + 2, base - 50);
    c.closePath();
    c.fill();
    for (let x = 14; x < w - 14; x += 22) {
      // 屋頂的老虎窗
      px(c, '#e8e4dc', x, base - 60, 8, 8);
      px(c, '#3a4656', x + 2, base - 58, 4, 5);
    }
    for (let x = 8; x < w - 12; x += 16) {
      if (Math.abs(x + 5 - cx) < 30) continue;
      c.fillStyle = '#3a4656';
      c.beginPath();
      c.moveTo(x, base - 30);
      c.lineTo(x, base - 42);
      c.arc(x + 5, base - 42, 5, Math.PI, 0);
      c.lineTo(x + 10, base - 30);
      c.closePath();
      c.fill();
      px(c, '#e8e4dc', x - 1, base - 30, 12, 2);
      px(c, '#3a4656', x, base - 22, 10, 12);
      px(c, 'rgba(160, 210, 240, 0.4)', x + 1, base - 21, 3, 3);
    }
    // 中間鐘樓
    px(c, '#c9c6be', cx - 26, base - 78, 52, 78);
    px(c, '#e8e4dc', cx - 26, base - 78, 52, 3);
    px(c, '#e8e4dc', cx - 26, base - 78, 3, 78);
    px(c, '#e8e4dc', cx + 23, base - 78, 3, 78);
    c.fillStyle = '#4f7a6a';
    c.beginPath();
    c.moveTo(cx - 28, base - 78);
    c.quadraticCurveTo(cx, base - 108, cx + 28, base - 78);
    c.closePath();
    c.fill();
    px(c, '#c9a24a', cx - 1, base - 112, 2, 8);
    // 大門（三個拱門）
    for (const dx of [-16, 0, 16]) {
      c.fillStyle = '#2a2f3a';
      c.beginPath();
      c.moveTo(cx + dx - 6, base);
      c.lineTo(cx + dx - 6, base - 14);
      c.arc(cx + dx, base - 14, 6, Math.PI, 0);
      c.lineTo(cx + dx + 6, base);
      c.closePath();
      c.fill();
      px(c, '#ffe9b8', cx + dx - 4, base - 10, 8, 10);
    }
    px(c, '#2f4a6a', cx - 22, base - 34, 44, 9);
    text(c, '新竹車站', cx, base - 29.5, '#ffffff', `900 7px ${FONT_TC}`);
    // 鐘面（指針另外畫）
    c.fillStyle = '#f4f1e8';
    c.beginPath();
    c.arc(cx, base - 60, 9, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#3a3d45';
    c.lineWidth = 1;
    c.stroke();
  });
}

function drawStation(c: CanvasRenderingContext2D, d: DrawCtx): void {
  const s = stationSprite();
  blit(c, s, HC.station.x0 * T, HC.station.y * T);
  // 時鐘：照台灣時間走
  const cx = ((HC.station.x0 + HC.station.x1) / 2) * T;
  const cy = HC.station.y * T - 60;
  const now = new Date(Date.now() + (8 * 60 + new Date().getTimezoneOffset()) * 60000);
  const hr = ((now.getHours() % 12) + now.getMinutes() / 60) / 12;
  const mn = now.getMinutes() / 60;
  c.strokeStyle = '#2b2d33';
  c.lineWidth = 1.5;
  c.beginPath();
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.sin(hr * Math.PI * 2) * 5, cy - Math.cos(hr * Math.PI * 2) * 5);
  c.moveTo(cx, cy);
  c.lineTo(cx + Math.sin(mn * Math.PI * 2) * 7.5, cy - Math.cos(mn * Math.PI * 2) * 7.5);
  c.stroke();
  if (d.night) glow(c, cx, cy, 20, '255, 240, 200', 0.4);
}

// 柳樹（護城河邊）：垂下來的枝條會晃
function drawWillow(c: CanvasRenderingContext2D, x: number, y: number, seconds: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 10, by - 1, 20, 3);
  px(c, '#6b4a2a', cx - 2, by - 22, 4, 22);
  c.fillStyle = '#6a9a3a';
  c.beginPath();
  c.ellipse(cx, by - 26, 14, 9, 0, 0, Math.PI * 2);
  c.fill();
  for (let k = -12; k <= 12; k += 3) {
    const sway = Math.round(Math.sin(seconds * 1.2 + k) * 1.5);
    px(c, k % 2 ? '#7aae46' : '#5a8a32', cx + k + sway, by - 24, 2, 14 - Math.abs(k) / 2);
  }
}

// 沒有椅背的石椅（背對畫面坐、面向城門的那兩張）
function drawStoneBench(c: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(y * T);
  const half = Math.round(1.25 * T);
  px(c, 'rgba(0,0,0,0.2)', cx - half, by + 1, half * 2, 3);
  px(c, '#9a958c', cx - half, by - 5, half * 2, 6);
  px(c, '#b8b3a8', cx - half, by - 5, half * 2, 2);
  px(c, '#7a766e', cx - half + 3, by + 1, 4, 2);
  px(c, '#7a766e', cx + half - 7, by + 1, 4, 2);
}

// ── 組成 CityScene 用的資料 ──
const WILLOWS: [number, number][] = [[1.4, 18.4], [12.6, 18.2], [21.2, 18.4], [29.2, 18.2], [7, 25.2], [18.6, 25.4], [32, 25.2]];
const TREES: [number, number][] = [[3, 15.2], [17, 15], [27, 15.2], [36.4, 13.8], [52.4, 13.8], [2, 33.8], [12, 34], [44, 34], [53.6, 33.8]];
const LAMPS: [number, number][] = [[6.6, 17.6], [24, 17.6], [38.8, 20], [50, 20], [10, 29.2], [42, 29.2], [16, 34.8], [40, 34.8]];
const SCOOTERS: [number, number][] = [2, 3.2, 4.4, 5.6, 6.8, 46, 47.2, 48.4, 49.6, 50.8, 52].map((x): [number, number] => [x, 29]);

const props: CityProp[] = [
  { y: HC.northLine, draw: (c) => blit(c, templeSprite(), HC.temple.x0 * T, HC.northLine * T) },
  { y: HC.northLine, draw: (c, d) => drawFoodHall(c, d) },
  ...EAST_HOUSES.map((b): CityProp => ({ y: HC.northLine, draw: (c) => blit(c, townhouseSprite('hc', b, HC_WORDS), b.x0 * T, HC.northLine * T) })),
  { y: HC.northLine + 0.95, draw: (c, d) => drawBurner(c, d) },
  { y: HC.canal.y0, draw: (c, d) => drawCanalShimmer(c, d.seconds) },
  ...HC.bridges.map((x): CityProp => ({ y: HC.canal.y0 - 0.4, draw: (c) => drawBridge(c, x) })),
  { y: HC.gate.y, draw: (c) => blit(c, gateSprite(), (HC.gate.cx - HC.gate.half) * T, HC.gate.y * T) },
  ...CANAL_BENCHES.map((x): CityProp => ({ y: CANAL_BENCH_Y - 0.01, draw: (c) => drawBench(c, x, CANAL_BENCH_Y, 2.6) })),
  ...PLAZA_BENCHES.map((b): CityProp => ({ y: b.y - 0.01, draw: (c) => (b.facing === 'up' ? drawStoneBench(c, b.x, b.y) : drawBench(c, b.x, b.y, 2.6)) })),
  { y: HC.station.y, draw: (c, d) => drawStation(c, d) },
  ...WILLOWS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawWillow(c, x, y, d.seconds) })),
  ...TREES.map(([x, y]): CityProp => ({ y, draw: (c) => drawStreetTree(c, x, y) })),
  ...LAMPS.map(([x, y]): CityProp => ({ y, draw: (c, d) => drawLamp(c, x, y, d.night) })),
  ...SCOOTERS.map(([x, y], i): CityProp => ({ y, draw: (c) => drawParkedScooter(c, x, y, SCOOTER_COLORS[i % SCOOTER_COLORS.length] ?? '#f2f2f2') })),
];

const r = (x0: number, y0: number, x1: number, y1: number): Rect => ({ x0, y0, x1, y1 });
// 護城河：水和兩岸的石階都不能走（只有拱橋可以過）
function blocked(x: number, y: number): boolean {
  if (x < HC.canal.x1 && y > HC.canalStepsN + 0.5 && y < HC.canal.y1 + 0.4) return !HC.bridges.some((bx) => Math.abs(x - bx) < HC.bridgeHalf - 0.3);
  return false;
}
const solid: Rect[] = [
  r(0, 0, HC.W, HC.northLine - 0.25),
  r(HC.gate.cx - HC.gate.half + 0.3, HC.gate.y - 2.2, HC.gate.cx + HC.gate.half - 0.3, HC.gate.y),
  ...CANAL_BENCHES.map((x) => r(x - 1.3, CANAL_BENCH_Y - 0.75, x + 1.3, CANAL_BENCH_Y - 0.45)),
  ...PLAZA_BENCHES.map((b) => (b.facing === 'up' ? r(b.x - 1.3, b.y - 0.35, b.x + 1.3, b.y - 0.1) : r(b.x - 1.3, b.y - 0.75, b.x + 1.3, b.y - 0.45))),
  r(HC.station.x0, HC.station.y - 3.2, HC.station.x1, HC.station.y - 0.1),
  ...WILLOWS.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...TREES.map(([x, y]) => r(x - 0.2, y - 0.3, x + 0.2, y + 0.1)),
  ...LAMPS.map(([x, y]) => r(x - 0.1, y - 0.2, x + 0.2, y + 0.05)),
  r(1.6, 28.5, 7.2, 29.1),
  r(45.6, 28.5, 52.4, 29.1),
  r(((HC.temple.x0 + HC.temple.x1) / 2) - 0.6, HC.northLine + 0.5, ((HC.temple.x0 + HC.temple.x1) / 2) + 0.6, HC.northLine + 1),
];

const lights: CityDef['lights'] = [
  ...LAMPS.map(([x, y]) => ({ x: x * T + 4, y: y * T - 26, r: 34 })),
  { x: ((HC.temple.x0 + HC.temple.x1) / 2) * T, y: HC.northLine * T - 30, r: 70, color: 'rgba(255, 150, 90, 0.45)' },
  ...FOOD_STALLS.map((s) => ({ x: s.x * T, y: HC.northLine * T - 12, r: 34, color: 'rgba(255, 220, 150, 0.5)' })),
  ...EAST_HOUSES.map((b) => ({ x: ((b.x0 + b.x1) / 2) * T, y: HC.northLine * T - 10, r: 26, color: 'rgba(255, 215, 140, 0.4)' })),
  { x: HC.gate.cx * T, y: HC.gate.y * T - 40, r: 60, color: 'rgba(255, 210, 150, 0.4)' },
  { x: ((HC.station.x0 + HC.station.x1) / 2) * T, y: HC.station.y * T - 20, r: 70, color: 'rgba(255, 230, 180, 0.4)' },
];

const stationX = (HC.station.x0 + HC.station.x1) / 2;

export const HSINCHU: CityDef = {
  id: 'hsinchu',
  W: HC.W,
  H: HC.H,
  title: { 'zh-TW': '新竹 · 城隍廟與東門城', 'en-US': 'Hsinchu · City God Temple & East Gate' },
  stop: { 'zh-TW': '新竹', 'en-US': 'Hsinchu' },
  emoji: '🏯',
  line: 'tra',
  station: {
    x: stationX,
    y: HC.station.y + 0.7,
    name: { 'zh-TW': '台鐵新竹車站', 'en-US': 'TRA Hsinchu Station' },
    arrive: { x: stationX + 3, y: HC.station.y + 0.9 },
  },
  background: '#d6cfc0',
  soundscape: 'city',
  paintGround: paintHsinchuGround,
  props,
  solid,
  blocked,
  seats: HSINCHU_SEATS,
  drawSeat: () => undefined,
  shops: HSINCHU_SHOPS,
  fortune: {
    at: r(HC.temple.x0 + 3.4, HC.northLine, HC.temple.x1 - 3.4, HC.northLine + 1.3),
    label: { x: (HC.temple.x0 + HC.temple.x1) / 2, y: HC.northLine - 4.6 },
    title: { 'zh-TW': '新竹城隍廟 · 求籤', 'en-US': 'Hsinchu City God Temple · Fortune' },
    hint: { 'zh-TW': '跟城隍爺說說想問的事，再抽一支籤。', 'en-US': 'Tell the City God your question, then draw a stick.' },
    draw: { 'zh-TW': '求籤', 'en-US': 'Draw' },
    again: { 'zh-TW': '再求一支', 'en-US': 'Draw again' },
    fortunes: [
      { rank: { 'zh-TW': '上上籤', 'en-US': 'Supreme luck' }, text: { 'zh-TW': '風城的風幫你一把，今天做什麼都順！', 'en-US': 'The Windy City’s breeze is behind you — everything goes smoothly today!' } },
      { rank: { 'zh-TW': '大吉', 'en-US': 'Great luck' }, text: { 'zh-TW': '像新竹米粉一樣，風吹日曬過才會 Q，努力會有回報。', 'en-US': 'Like Hsinchu rice noodles, dried in sun and wind — your effort will pay off.' } },
      { rank: { 'zh-TW': '中吉', 'en-US': 'Fair luck' }, text: { 'zh-TW': '城隍爺說：誠心最重要，按部就班就好。', 'en-US': 'The City God says: be sincere and take it step by step.' } },
      { rank: { 'zh-TW': '上籤', 'en-US': 'Good luck' }, text: { 'zh-TW': '讀累了喝碗貢丸湯，再拚一顆番茄鐘。', 'en-US': 'Tired? Have some pork ball soup, then one more pomodoro.' } },
      { rank: { 'zh-TW': '小吉', 'en-US': 'Small luck' }, text: { 'zh-TW': '今天早點睡，明天頭腦更清楚。', 'en-US': 'Sleep early tonight; tomorrow your head will be clearer.' } },
    ],
  },
  infos: [
    { at: r(HC.temple.x0, 3.6, HC.temple.x1, HC.northLine - 0.2), title: { 'zh-TW': '新竹都城隍廟', 'en-US': 'Hsinchu City God Temple' }, text: { 'zh-TW': '1748 年建的城隍廟，城隍爺的位階在全台最高，門上「金門保障」大匾很有名。廟口一整排小吃，貢丸湯、炒米粉是新竹的招牌。', 'en-US': 'Built in 1748, home to the highest-ranking City God in Taiwan; the "金門保障" plaque above the door is famous. The temple square is lined with snack stalls — pork ball soup and fried rice noodles are Hsinchu classics.' } },
    { at: r(HC.gate.cx - HC.gate.half, HC.gate.y - 5.6, HC.gate.cx + HC.gate.half, HC.gate.y), title: { 'zh-TW': '東門城（迎曦門）', 'en-US': 'East Gate (Yingxi Gate)' }, text: { 'zh-TW': '清朝竹塹城留下來的唯一一座城門，1829 年用石頭蓋的，現在在圓環中間，旁邊是下沉式的廣場。', 'en-US': 'The only surviving gate of the Qing-era Zhuqian city wall, built of stone in 1829 — now in the middle of a roundabout with a sunken plaza.' } },
    { at: r(0, HC.canalStepsN, HC.canal.x1, HC.canalStepsS), title: { 'zh-TW': '護城河親水公園', 'en-US': 'Moat Riverside Park' }, text: { 'zh-TW': '以前竹塹城的護城河，整理成有石階、踏腳石和步道的公園，夏天很多人來玩水、散步。', 'en-US': 'The old city moat, turned into a park with stone steps, stepping stones and paths — popular for strolling and wading in summer.' } },
    { at: r(HC.station.x0, HC.station.y - 6.8, HC.station.x1, HC.station.y), title: { 'zh-TW': '新竹車站', 'en-US': 'Hsinchu Station' }, text: { 'zh-TW': '1913 年完工，是台灣現在還在用的最老的火車站，巴洛克式的立面和中間的鐘樓是新竹的門面。', 'en-US': 'Completed in 1913, it’s the oldest station building in Taiwan still in use — its Baroque facade and clock tower are the face of Hsinchu.' } },
  ],
  labels: [
    { x: (HC.foodHall.x0 + HC.foodHall.x1) / 2, y: HC.northLine - 4.6, text: { 'zh-TW': '🍲 城隍廟口小吃', 'en-US': '🍲 Temple-front snacks' }, color: '#fbbf24' },
    { x: 11, y: HC.canalStepsN - 1.4, text: { 'zh-TW': '🌊 護城河（長椅坐下專注）', 'en-US': '🌊 Old moat (benches to focus)' }, color: '#60a5fa' },
    { x: HC.gate.cx, y: HC.plaza.cy - HC.plaza.r - 0.2, text: { 'zh-TW': '🏯 東門城', 'en-US': '🏯 East Gate' }, color: '#f472b6' },
  ],
  walkers: [
    { x0: 1, y0: 10.1, x1: 55, y1: 10.1, count: 4 },
    { x0: 1, y0: 13.4, x1: 34, y1: 13.4, count: 2 },
    { x0: 1, y0: 18.4, x1: 34, y1: 18.4, count: 2 },
    { x0: 34.6, y0: 13.4, x1: 34.6, y1: 25.4, count: 1 },
    { x0: 1, y0: 29.8, x1: 55, y1: 29.8, count: 3 },
    { x0: 1, y0: 35.2, x1: 55, y1: 35.2, count: 2 },
  ],
  traffic: [
    { y: 11.2, dir: -1, x0: 0, x1: HC.W, count: 2 },
    { y: 12.4, dir: 1, x0: 0, x1: HC.W, count: 2 },
    { y: 26.6, dir: 1, x0: 0, x1: HC.W, count: 2 },
    { y: 27.8, dir: -1, x0: 0, x1: HC.W, count: 2 },
  ],
  lights,
  hintDesktop: {
    'zh-TW': 'WASD／方向鍵移動 · 點護城河邊或東門城廣場的長椅坐下專注 · 走到廟口小吃買貢丸湯、炒米粉 · 城隍廟前求籤 · 走拱橋過河 · 點地標看介紹 · 新竹車站回台北（台鐵）',
    'en-US': 'WASD / arrows to move · click a bench by the moat or at the East Gate to focus · walk up to the temple stalls for pork ball soup and rice noodles · draw a fortune at the temple · cross the moat on the arched bridges · click landmarks for info · Hsinchu Station back to Taipei (TRA)',
  },
  hintTouch: {
    'zh-TW': '點長椅坐下專注 · 走到廟口小吃買東西 · 城隍廟前求籤 · 走拱橋過河 · 點地標看介紹 · 新竹車站回台北',
    'en-US': 'Tap a bench to focus · walk up to the stalls · fortune at the temple · cross the bridges · tap landmarks · station back to Taipei',
  },
};
