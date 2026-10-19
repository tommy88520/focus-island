// 大獎賽地圖的夜景城市：棋盤狀的馬路（人行道、車道線、斑馬線）＋一塊塊街廓上的建築。
// 建築用「正面立面」的畫法（跟北投、主地圖一樣）：底下是一樓，往上疊樓層，最上面露出一點屋頂；
// 每棟先畫成一張小圖存起來（每格只要 drawImage），照底部的 y 排前後。
import type { CircuitDef, Rect } from './circuits';
import { layerCanvas, layerSize, px, seeded, spriteRes } from './pixelUtil';

const T = 16;
const PAD = 6;

export type BuildingKind = 'tower' | 'apartment' | 'shops' | 'hotel';

export interface Building {
  kind: BuildingKind;
  // 佔地（格）：x0–x1 是寬，y1 是一樓的地面線
  x0: number;
  x1: number;
  y0: number;
  y1: number;
  floors: number;
  seed: number;
  sprite?: HTMLCanvasElement;
  // 屋頂的航空警示燈（高樓才有，閃的那顆另外畫）
  beacon?: { x: number; y: number };
}

export interface Block extends Rect {
  buildings: Building[];
}

export interface City {
  blocks: Block[];
  trees: { x: number; y: number; seed: number }[];
  lamps: { x: number; y: number }[];
  scooters: { x: number; y: number; color: string; flip: boolean }[];
  // 蓋不了大樓的小空地：口袋公園（草地＋樹）、停車場、小廣場（噴水池）
  pockets: (Rect & { kind: 'park' | 'parking' | 'plaza'; seed: number })[];
  roadsH: number[];
  roadsV: number[];
}

const CELL_W = 7;
const CELL_H = 6;
const ROAD_W = 1.8;

const overlaps = (a: Rect, b: Rect, pad = 0) => a.x0 < b.x1 + pad && b.x0 - pad < a.x1 && a.y0 < b.y1 + pad && b.y0 - pad < a.y1;

export function buildCity(c: CircuitDef, trackDist: (x: number, y: number) => number, half: number, keepOut: Rect[]): City {
  const rand = seeded(c.seed * 13 + 1);
  const blocks: Block[] = [];
  const trees: City['trees'] = [];
  const lamps: City['lamps'] = [];
  const scooters: City['scooters'] = [];
  const pockets: City['pockets'] = [];
  const nearTrack = (r: Rect, margin: number) => {
    for (let x = r.x0; x <= r.x1 + 0.01; x += 0.5) for (let y = r.y0; y <= r.y1 + 0.01; y += 0.5) if (trackDist(x, y) < half + margin) return true;
    return false;
  };
  const free = (r: Rect, margin = 1.6) => !nearTrack(r, margin) && !keepOut.some((o) => overlaps(r, o, 0.6)) && !c.water.some((w) => overlaps(r, w, 0.2)) && !c.parks.some((p) => overlaps(r, p, 0));
  // 一塊街廓（或四分之一塊）蓋上 1–3 棟建築，前面人行道放行道樹、路燈、機車
  const addBlock = (block: Rect, small: boolean): boolean => {
    // 往上（北邊）還有多少空間：高樓的立面會往上長，不能蓋到賽道
    // 地標、公園、看台、車庫也不能被蓋住（不然 101 前面會擋一棟大樓）
    const blocksView = (r: Rect) => nearTrack(r, 1.2) || keepOut.some((o) => overlaps(r, o, 0.2)) || c.parks.some((p) => overlaps(r, p, 0));
    let clearance = 0;
    while (clearance < 14 && !blocksView({ x0: block.x0, y0: block.y0 - clearance - 1, x1: block.x1, y1: block.y0 - clearance }) && block.y0 - clearance - 1 > 0) clearance += 1;
    const maxRisePx = (block.y1 - block.y0 - 0.5) * T + clearance * T - 6;
    if (maxRisePx < 40) return false;
    const roll = rand();
    const kind: BuildingKind = roll < 0.3 ? 'tower' : roll < 0.62 ? 'apartment' : roll < 0.9 ? 'shops' : 'hotel';
    const pieces = small ? 1 : kind === 'shops' ? 2 + Math.floor(rand() * 2) : kind === 'apartment' ? 1 + Math.floor(rand() * 2) : 1;
    const inner = { x0: block.x0 + 0.35, x1: block.x1 - 0.35, y0: block.y0 + 0.35, y1: block.y1 - 0.45 };
    const widths: number[] = [];
    for (let i = 0; i < pieces; i += 1) widths.push(0.7 + rand() * 0.6);
    const total = widths.reduce((sum, w) => sum + w, 0);
    let x = inner.x0;
    const buildings: Building[] = widths.map((wRatio, i) => {
      const w = ((inner.x1 - inner.x0) * wRatio) / total;
      const floorsWanted = kind === 'tower' ? 9 + Math.floor(rand() * 8) : kind === 'hotel' ? 7 + Math.floor(rand() * 3) : kind === 'apartment' ? 5 + Math.floor(rand() * 4) : 3 + Math.floor(rand() * 2);
      const floorPx = kind === 'apartment' ? 9 : 10;
      const fixed = kind === 'shops' ? 16 : 14;
      const floors = Math.max(2, Math.min(floorsWanted, Math.floor((maxRisePx - fixed - 12) / floorPx)));
      const b: Building = { kind: floors < 3 && kind !== 'shops' ? 'shops' : kind, x0: x, x1: x + w, y0: inner.y0, y1: inner.y1, floors, seed: c.seed * 977 + blocks.length * 31 + i };
      x += w;
      return b;
    });
    blocks.push({ ...block, buildings });
    for (let tx = block.x0 + 0.9; tx < block.x1 - 0.5; tx += 2.6) {
      const spot = { x: tx, y: block.y1 + 0.25 };
      if (trackDist(spot.x, spot.y) < half + 1.4) continue;
      trees.push({ ...spot, seed: Math.floor(rand() * 1000) });
    }
    const lampX = block.x0 + Math.min(2.2, (block.x1 - block.x0) / 2);
    if (trackDist(lampX, block.y1 + 0.2) > half + 1.4) lamps.push({ x: lampX, y: block.y1 + 0.2 });
    if (!small && buildings.some((b) => b.kind === 'shops') && rand() < 0.8) {
      const sx = block.x0 + 3.1 + rand() * 0.8;
      for (let k = 0; k < 4; k += 1) {
        const p = { x: sx + k * 0.42, y: block.y1 + 0.18 };
        if (trackDist(p.x, p.y) < half + 1.4 || p.x > block.x1 - 0.3) continue;
        scooters.push({ ...p, color: ['#e25a4a', '#f2f2f2', '#3b82f6', '#f6c945', '#2b2d33', '#8bd3c7'][Math.floor(rand() * 6)] ?? '#f2f2f2', flip: rand() < 0.5 });
      }
    }
    return true;
  };
  // 小空地：輪流當口袋公園、停車場、小廣場
  const addPocket = (r: Rect) => {
    const roll = rand();
    const kind = roll < 0.36 ? 'park' : roll < 0.7 ? 'parking' : 'plaza';
    pockets.push({ ...r, kind, seed: Math.floor(rand() * 10000) });
    const spots: [number, number][] = kind === 'park' ? [[0.28, 0.5], [0.72, 0.62]] : kind === 'plaza' ? [[0.15, 0.85], [0.85, 0.85]] : [];
    for (const [fx, fy] of spots) {
      const p = { x: r.x0 + (r.x1 - r.x0) * fx, y: r.y0 + (r.y1 - r.y0) * fy };
      if (trackDist(p.x, p.y) > half + 1.3) trees.push({ ...p, seed: Math.floor(rand() * 1000) });
    }
  };
  for (let gy = 1; gy + CELL_H - ROAD_W <= c.H - 1; gy += CELL_H) {
    for (let gx = 1; gx + CELL_W - ROAD_W <= c.W - 1; gx += CELL_W) {
      const block: Rect = { x0: gx, y0: gy, x1: gx + CELL_W - ROAD_W, y1: gy + CELL_H - ROAD_W };
      if (free(block) && addBlock(block, false)) continue;
      // 整塊放不下（旁邊就是賽道、地標）：切成四小塊，放得下的那幾塊各蓋一棟
      const hw = (block.x1 - block.x0 - 0.6) / 2;
      const hh = (block.y1 - block.y0 - 0.6) / 2;
      for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [1, 1]] as const) {
        const sub: Rect = { x0: block.x0 + dx * (hw + 0.6), y0: block.y0 + dy * (hh + 0.6), x1: block.x0 + dx * (hw + 0.6) + hw, y1: block.y0 + dy * (hh + 0.6) + hh };
        if (free(sub, 1.2) && addBlock(sub, true)) continue;
        if (free(sub, 0.9)) addPocket(sub);
      }
    }
  }
  // 公園裡的樹：避開地標、水池、中間的十字步道和賽道
  for (const park of c.parks) {
    const midX = (park.x0 + park.x1) / 2;
    const midY = (park.y0 + park.y1) / 2;
    for (let ty = park.y0 + 1; ty < park.y1 - 0.3; ty += 2.1) {
      for (let tx = park.x0 + 0.9; tx < park.x1 - 0.5; tx += 2.3) {
        const p = { x: tx + (rand() - 0.5) * 0.8, y: ty + (rand() - 0.5) * 0.6 };
        if (Math.abs(p.x - midX) < 0.9 || Math.abs(p.y - midY) < 0.8) continue;
        if (keepOut.some((o) => p.x > o.x0 - 0.8 && p.x < o.x1 + 0.8 && p.y > o.y0 - 0.4 && p.y < o.y1 + 1.2)) continue;
        if (c.water.some((w) => p.x > w.x0 - 0.8 && p.x < w.x1 + 0.8 && p.y > w.y0 - 0.6 && p.y < w.y1 + 0.9)) continue;
        if (trackDist(p.x, p.y) < half + 1.4) continue;
        trees.push({ ...p, seed: Math.floor(rand() * 1000) });
      }
    }
    // 步道上的路燈
    for (let ly = park.y0 + 1.5; ly < park.y1; ly += 4) if (trackDist(midX + 0.7, ly) > half + 1.4) lamps.push({ x: midX + 0.7, y: ly });
  }
  const roadsH: number[] = [];
  const roadsV: number[] = [];
  for (let gy = 1 + CELL_H - ROAD_W; gy < c.H; gy += CELL_H) roadsH.push(gy + ROAD_W / 2);
  for (let gx = 1 + CELL_W - ROAD_W; gx < c.W; gx += CELL_W) roadsV.push(gx + ROAD_W / 2);
  return { blocks, trees, lamps, scooters, pockets, roadsH, roadsV };
}

// ── 地面：馬路、車道線、斑馬線、人行道、公園、水 ──
export function paintCityGround(g: CanvasRenderingContext2D, c: CircuitDef, city: City): void {
  const rand = seeded(c.seed + 3);
  // 整片先是柏油路
  px(g, '#24262f', 0, 0, c.W * T, c.H * T);
  for (let i = 0; i < c.W * c.H * 3; i += 1) px(g, rand() < 0.5 ? '#2a2c36' : '#1f212a', Math.floor(rand() * c.W * T), Math.floor(rand() * c.H * T), 1, 1);
  // 車道線：橫的馬路中間雙黃線、直的白色虛線
  for (const y of city.roadsH) {
    px(g, '#c9a43a', 0, Math.round(y * T) - 2, c.W * T, 1);
    px(g, '#c9a43a', 0, Math.round(y * T) + 1, c.W * T, 1);
  }
  for (const x of city.roadsV) for (let y = 0; y < c.H * T; y += 12) px(g, 'rgba(230, 230, 236, 0.55)', Math.round(x * T), y, 1, 6);
  // 街廓：人行道（磚）＋路緣、轉角的斑馬線
  for (const b of city.blocks) {
    const x = b.x0 * T;
    const y = b.y0 * T;
    const w = (b.x1 - b.x0) * T;
    const h = (b.y1 - b.y0) * T;
    px(g, '#4a4d59', x - 3, y - 3, w + 6, h + 6);
    px(g, '#5a5d6a', x - 2, y - 2, w + 4, h + 4);
    for (let tx = x - 2; tx < x + w + 2; tx += 6) px(g, '#525562', tx, y - 2, 1, h + 4);
    for (let ty = y - 2; ty < y + h + 2; ty += 6) px(g, '#525562', x - 2, ty, w + 4, 1);
    px(g, '#7a7e8c', x - 3, y + h + 2, w + 6, 1);
    // 斑馬線：街廓右下角往右、往下各一組
    for (let k = 0; k < 5; k += 1) {
      px(g, 'rgba(235,235,240,0.75)', x + w + 6, y + h - 22 + k * 5, ROAD_W * T - 12, 3);
      px(g, 'rgba(235,235,240,0.75)', x + w - 22 + k * 5, y + h + 6, 3, ROAD_W * T - 12);
    }
  }
  // 小空地：口袋公園（草地）、停車場（白線、停好的車）、小廣場（石板、圓形噴水池）
  for (const r of city.pockets) {
    const x = Math.round(r.x0 * T);
    const y = Math.round(r.y0 * T);
    const w = Math.round((r.x1 - r.x0) * T);
    const h = Math.round((r.y1 - r.y0) * T);
    const pr = seeded(r.seed);
    px(g, '#5a5d6a', x - 2, y - 2, w + 4, h + 4);
    if (r.kind === 'park') {
      px(g, '#203a29', x, y, w, h);
      for (let i = 0; i < (w * h) / 16; i += 1) px(g, pr() < 0.5 ? '#264632' : '#1b3324', x + Math.floor(pr() * w), y + Math.floor(pr() * h), 2, 1);
      px(g, '#1a2f22', x, y, w, 2);
      for (let i = 0; i < 5; i += 1) px(g, ['#f2a6c4', '#f6e27a', '#ffffff'][i % 3] ?? '#ffffff', x + 3 + Math.floor(pr() * (w - 6)), y + 3 + Math.floor(pr() * (h - 6)), 1, 1);
    } else if (r.kind === 'parking') {
      px(g, '#30323d', x, y, w, h);
      const stall = 9;
      for (let k = x + 2; k < x + w - 2; k += stall) px(g, 'rgba(230,230,236,0.6)', k, y + 2, 1, 12);
      for (let k = x + 2; k + stall <= x + w - 2; k += stall) {
        if (pr() < 0.3) continue;
        const col = ['#e25a4a', '#f2f2f2', '#3b82f6', '#2b2d33', '#9aa3b2', '#f6c945', '#8bd3c7'][Math.floor(pr() * 7)] ?? '#f2f2f2';
        px(g, 'rgba(0,0,0,0.35)', k + 2, y + 4, 6, 11);
        px(g, col, k + 2, y + 3, 6, 11);
        px(g, '#1d2230', k + 3, y + 5, 4, 3);
        px(g, 'rgba(255,255,255,0.25)', k + 2, y + 3, 6, 1);
      }
      if (h > 22) {
        px(g, 'rgba(230,230,236,0.6)', x + 2, y + 16, w - 4, 1);
        g.fillStyle = 'rgba(255,255,255,0.55)';
        g.font = '900 9px system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('P', x + w / 2, y + h - 7);
      }
    } else {
      px(g, '#4a4d5a', x, y, w, h);
      for (let k = x; k < x + w; k += 6) px(g, '#535664', k, y, 1, h);
      for (let k = y; k < y + h; k += 6) px(g, '#535664', x, k, w, 1);
      const cx = x + w / 2;
      const cy = y + h / 2;
      const rr = Math.min(10, Math.floor(Math.min(w, h) / 2) - 3);
      g.fillStyle = '#8d91a0';
      g.beginPath();
      g.arc(cx, cy, rr, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#16304f';
      g.beginPath();
      g.arc(cx, cy, rr - 2, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = 'rgba(140, 200, 255, 0.55)';
      g.beginPath();
      g.arc(cx, cy, Math.max(2, rr - 6), 0, Math.PI * 2);
      g.fill();
      px(g, '#dff1ff', cx - 1, cy - 2, 2, 4);
    }
  }
  // 地標、車站底下的廣場：淺色石板、四周路緣
  for (const l of [...c.landmarks.filter((m) => m.kind !== 'cruise'), c.station]) {
    const x = (l.x0 - 0.7) * T;
    const y = (l.y0 - 0.5) * T;
    const w = (l.x1 - l.x0 + 1.4) * T;
    const h = (l.y1 - l.y0 + 1.3) * T;
    if (c.water.some((wtr) => l.y0 < wtr.y1 && l.y1 > wtr.y0)) continue;
    px(g, '#5c606e', x - 2, y - 2, w + 4, h + 4);
    px(g, '#4a4d5a', x, y, w, h);
    for (let tx = x; tx < x + w; tx += 8) px(g, '#535664', tx, y, 1, h);
    for (let ty = y; ty < y + h; ty += 8) px(g, '#535664', x, ty, w, 1);
  }
  // 公園：草地、步道、草地上的光斑
  for (const p of c.parks) {
    const x = p.x0 * T;
    const y = p.y0 * T;
    const w = (p.x1 - p.x0) * T;
    const h = (p.y1 - p.y0) * T;
    px(g, '#5a5d6a', x - 3, y - 3, w + 6, h + 6);
    px(g, '#203a29', x, y, w, h);
    for (let i = 0; i < (w * h) / 18; i += 1) px(g, rand() < 0.5 ? '#264632' : '#1b3324', x + Math.floor(rand() * w), y + Math.floor(rand() * h), 2, 1);
    px(g, '#4f5160', x + Math.round(w / 2) - 5, y, 10, h);
    px(g, '#4f5160', x, y + Math.round(h / 2) - 5, w, 10);
    for (let k = y; k < y + h; k += 6) px(g, '#5a5d6a', x + Math.round(w / 2) - 5, k, 10, 1);
    for (let k = x; k < x + w; k += 6) px(g, '#5a5d6a', k, y + Math.round(h / 2) - 5, 1, 10);
  }
  // 水：港口、秋紅谷的池子（亮點另外每格動態畫）
  for (const wtr of c.water) {
    const x = wtr.x0 * T;
    const y = wtr.y0 * T;
    const w = (wtr.x1 - wtr.x0) * T;
    const h = (wtr.y1 - wtr.y0) * T;
    // 城市裡的池子（不碰到地圖邊）：橢圓形、石頭池岸、彩色燈的倒影（秋紅谷）
    if (wtr.x0 > 0.5 && wtr.y0 > 0.5 && wtr.x1 < c.W - 0.5 && wtr.y1 < c.H - 0.5) {
      const cx = x + w / 2;
      const cy = y + h / 2;
      g.fillStyle = '#7a7e8c';
      g.beginPath();
      g.ellipse(cx, cy, w / 2 + 3, h / 2 + 3, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#5a5e6c';
      g.beginPath();
      g.ellipse(cx, cy + 1, w / 2 + 1, h / 2 + 1, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = '#0b1d33';
      g.beginPath();
      g.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
      const lights = ['rgba(255, 90, 160, 0.45)', 'rgba(90, 200, 255, 0.45)', 'rgba(255, 210, 90, 0.45)', 'rgba(150, 110, 255, 0.45)'];
      for (let i = 0; i < 18; i += 1) {
        const a = rand() * Math.PI * 2;
        const r = Math.sqrt(rand()) * 0.8;
        px(g, lights[i % lights.length] ?? lights[0] ?? '#fff', Math.round(cx + Math.cos(a) * r * (w / 2) - 3), Math.round(cy + Math.sin(a) * r * (h / 2)), 6, 1);
      }
      continue;
    }
    px(g, '#0b1d33', x, y, w, h);
    for (let ry = y; ry < y + h; ry += 4) px(g, ry % 8 === 0 ? '#0e2440' : '#0a1a2e', x, ry, w, 2);
    // 岸邊：石頭堤岸＋欄杆
    const touchesBottom = wtr.y1 < c.H - 0.5;
    const touchesTop = wtr.y0 > 0.5;
    if (touchesBottom) {
      px(g, '#6c7080', x, y + h - 4, w, 4);
      px(g, '#8d91a0', x, y + h - 4, w, 1);
      for (let k = x + 4; k < x + w; k += 10) px(g, '#b9bdc8', k, y + h - 8, 1, 4);
      px(g, '#b9bdc8', x, y + h - 8, w, 1);
    }
    if (touchesTop) {
      px(g, '#6c7080', x, y, w, 4);
      px(g, '#8d91a0', x, y + 3, w, 1);
    }
  }
}

// 路燈打在地上的光暈（畫在地面那層）
export function paintLampGlow(g: CanvasRenderingContext2D, lamps: { x: number; y: number }[]): void {
  for (const l of lamps) {
    const grad = g.createRadialGradient(l.x * T + 6, l.y * T + 2, 1, l.x * T + 6, l.y * T + 2, 26);
    grad.addColorStop(0, 'rgba(255, 214, 140, 0.32)');
    grad.addColorStop(1, 'rgba(255, 214, 140, 0)');
    g.fillStyle = grad;
    g.fillRect(l.x * T - 22, l.y * T - 26, 56, 56);
  }
}

// ── 建築（每棟畫成一張小圖）──

const TOWER_GLASS = [
  { base: '#18223a', grid: '#24314f', edge: '#34446a' },
  { base: '#1c2531', grid: '#2a3646', edge: '#3d4c60' },
  { base: '#211c33', grid: '#2f2847', edge: '#463c66' },
];
const CROWN = ['#4fd1ff', '#ff4fa0', '#ffd34f', '#7cff9a', '#c18bff'];
const LIT = ['#ffe6a3', '#fff3cf', '#bfe3ff', '#ffd27a'];
const TILE_FACADE = ['#5e574e', '#655d53', '#535a63', '#5d5566', '#4d5560'];
const SIGN_COLORS = ['#e03a3a', '#f2c14e', '#3a7be0', '#2bb673', '#ff6fb5'];
const SIGN_WORDS = ['茶', '麵', '冰', '飯', '藥', '咖啡', '書', '髮', '粥', '鍋'];

function windowsGrid(c: CanvasRenderingContext2D, x: number, y: number, w: number, rows: number, rowH: number, colW: number, cell: [number, number], rand: () => number, litChance: number, unlit: string): void {
  for (let r = 0; r < rows; r += 1) {
    for (let cx = x + 2; cx + cell[0] <= x + w - 1; cx += colW) {
      const lit = rand() < litChance;
      px(c, lit ? (LIT[Math.floor(rand() * LIT.length)] ?? '#ffe6a3') : unlit, cx, y + r * rowH + 2, cell[0], cell[1]);
      if (lit && rand() < 0.3) px(c, 'rgba(0,0,0,0.25)', cx, y + r * rowH + 2, Math.ceil(cell[0] / 2), cell[1]);
    }
  }
}

function waterTank(c: CanvasRenderingContext2D, x: number, y: number, blue: boolean): void {
  px(c, '#2b2d33', x + 1, y + 7, 9, 2);
  px(c, blue ? '#3b7dd8' : '#9aa3b2', x, y, 11, 7);
  px(c, blue ? '#6aa5f0' : '#c3cad6', x + 1, y, 3, 7);
  px(c, blue ? '#2a5ea8' : '#79808e', x, y + 6, 11, 1);
  px(c, '#5e6370', x + 4, y - 2, 3, 2);
}

export function buildingSprite(b: Building): HTMLCanvasElement {
  const rand = seeded(b.seed);
  const w = Math.round((b.x1 - b.x0) * T);
  const floorPx = b.kind === 'apartment' ? 9 : 10;
  const ground = b.kind === 'shops' ? 16 : 14;
  const facadeH = ground + b.floors * floorPx;
  const roofD = Math.max(8, Math.min(18, Math.round((b.y1 - b.y0) * T * 0.35)));
  const cw = w + PAD * 2;
  const ch = facadeH + roofD + 24;
  // 城市的大樓很多，最多 3 倍就好（手機記憶體）
  const { canvas, c } = layerCanvas(cw, ch, Math.min(3, spriteRes()));
  if (!c) return canvas;
  const ox = PAD;
  const top = ch - facadeH - roofD;
  const fy = top + roofD;
  // 影子
  px(c, 'rgba(0,0,0,0.35)', ox + 2, ch - 3, w, 3);
  if (b.kind === 'tower' || b.kind === 'hotel') {
    const pal = TOWER_GLASS[Math.floor(rand() * TOWER_GLASS.length)] ?? TOWER_GLASS[0];
    if (!pal) return canvas;
    // 屋頂：深色、女兒牆、空調箱或直升機坪
    px(c, '#2a3046', ox, top, w, roofD);
    px(c, '#3b4360', ox, top, w, 1);
    px(c, '#454d6a', ox, top + roofD - 2, w, 2);
    if (w >= 40 && rand() < 0.5) {
      c.strokeStyle = '#c9ccd6';
      c.lineWidth = 1;
      c.beginPath();
      c.ellipse(ox + w / 2, top + roofD / 2, Math.min(9, w / 4), roofD / 2 - 2, 0, 0, Math.PI * 2);
      c.stroke();
      px(c, '#c9ccd6', ox + w / 2 - 3, top + roofD / 2 - 2, 1, 4);
      px(c, '#c9ccd6', ox + w / 2 + 2, top + roofD / 2 - 2, 1, 4);
      px(c, '#c9ccd6', ox + w / 2 - 2, top + roofD / 2, 4, 1);
    } else {
      for (let k = 0; k < 2; k += 1) {
        const ux = ox + 3 + Math.floor(rand() * Math.max(1, w - 12));
        px(c, '#565e78', ux, top + 3, 8, 5);
        px(c, '#6c7592', ux, top + 3, 8, 1);
      }
    }
    // 立面：玻璃＋直的鋁框＋每層樓的橫線
    px(c, pal.base, ox, fy, w, facadeH);
    for (let gx = ox + 1; gx < ox + w; gx += 5) px(c, pal.grid, gx, fy, 1, facadeH - ground);
    windowsGrid(c, ox, fy, w, b.floors, floorPx, 5, [3, 6], rand, b.kind === 'hotel' ? 0.6 : 0.42, pal.grid);
    for (let r = 0; r <= b.floors; r += 1) px(c, pal.edge, ox, fy + r * floorPx, w, 1);
    // 樓頂的 LED 燈帶
    const crown = CROWN[Math.floor(rand() * CROWN.length)] ?? '#4fd1ff';
    px(c, crown, ox, fy, w, 2);
    px(c, 'rgba(255,255,255,0.6)', ox, fy, w, 1);
    // 左邊受光、右邊陰影
    px(c, pal.edge, ox, fy, 1, facadeH);
    px(c, 'rgba(0,0,0,0.35)', ox + w - 2, fy, 2, facadeH);
    if (b.kind === 'hotel') {
      // 外牆大螢幕
      const sw = Math.min(w - 8, 30);
      const sx = ox + Math.round((w - sw) / 2);
      const sy = fy + 6;
      const grad = c.createLinearGradient(sx, sy, sx + sw, sy + 22);
      grad.addColorStop(0, '#ff4fa0');
      grad.addColorStop(0.5, '#7b5cff');
      grad.addColorStop(1, '#3ad6ff');
      c.fillStyle = grad;
      c.fillRect(sx, sy, sw, 22);
      px(c, 'rgba(255,255,255,0.8)', sx + 3, sy + 8, sw - 10, 2);
      px(c, 'rgba(255,255,255,0.55)', sx + 3, sy + 12, sw - 16, 2);
      px(c, '#15171f', sx - 1, sy - 1, sw + 2, 1);
    }
    // 一樓大廳：暖光、玻璃門、雨遮
    const gy = fy + facadeH - ground;
    px(c, '#2a2f40', ox, gy, w, ground);
    px(c, '#ffd98a', ox + 3, gy + 4, w - 6, ground - 6);
    for (let k = ox + 6; k < ox + w - 4; k += 7) px(c, '#c9a35a', k, gy + 4, 1, ground - 6);
    px(c, '#2a2f40', ox + w / 2 - 4, gy + 6, 8, ground - 6);
    px(c, '#454d6a', ox - 1, gy + 2, w + 2, 2);
    if (b.floors >= 12) b.beacon = { x: (b.x0 + b.x1) / 2, y: b.y1 - (facadeH + roofD) / T };
  } else if (b.kind === 'apartment') {
    const tile = TILE_FACADE[Math.floor(rand() * TILE_FACADE.length)] ?? '#5e574e';
    // 屋頂：水泥、水塔、鐵皮加蓋
    px(c, '#4a4650', ox, top, w, roofD);
    px(c, '#5a5662', ox, top, w, 1);
    if (rand() < 0.6) {
      px(c, '#5e6b7a', ox + w - 18, top + 2, 16, roofD - 4);
      for (let k = 0; k < 16; k += 3) px(c, '#73808f', ox + w - 18 + k, top + 2, 1, roofD - 4);
    }
    waterTank(c, ox + 3, top + 1, rand() < 0.5);
    if (w > 34) waterTank(c, ox + 16, top + 2, rand() < 0.5);
    px(c, '#3b3842', ox, top + roofD - 2, w, 2);
    // 立面：磁磚、窗戶（亮燈、窗簾）、陽台欄杆、冷氣
    px(c, tile, ox, fy, w, facadeH);
    for (let ty = fy; ty < fy + facadeH; ty += 3) px(c, 'rgba(0,0,0,0.06)', ox, ty, w, 1);
    for (let r = 0; r < b.floors; r += 1) {
      const ry = fy + r * floorPx;
      px(c, 'rgba(0,0,0,0.18)', ox, ry + floorPx - 1, w, 1);
      for (let cx = ox + 3; cx + 6 <= ox + w - 2; cx += 9) {
        const lit = rand() < 0.55;
        px(c, '#2b2a33', cx - 1, ry + 1, 8, 7);
        px(c, lit ? (rand() < 0.5 ? '#ffcf8a' : '#ffe1a8') : '#33323d', cx, ry + 2, 6, 5);
        if (lit && rand() < 0.5) px(c, rand() < 0.5 ? '#d98c5f' : '#8fb3d9', cx, ry + 2, 2, 5);
        // 鐵窗
        if (rand() < 0.4) for (let k = 0; k < 6; k += 2) px(c, 'rgba(30,30,36,0.7)', cx + k, ry + 2, 1, 5);
        if (rand() < 0.35) {
          px(c, '#b9bdc8', cx + 7, ry + 4, 3, 3);
          px(c, '#8d91a0', cx + 7, ry + 6, 3, 1);
        }
      }
      if (r % 2 === 1) px(c, 'rgba(200,200,210,0.35)', ox + 1, ry + floorPx - 3, w - 2, 1);
    }
    px(c, 'rgba(255,255,255,0.08)', ox, fy, 1, facadeH);
    px(c, 'rgba(0,0,0,0.3)', ox + w - 2, fy, 2, facadeH);
    // 一樓：鐵捲門或便利商店
    const gy = fy + facadeH - ground;
    if (rand() < 0.5) {
      px(c, '#2b2d36', ox, gy, w, ground);
      px(c, '#e8f4ff', ox + 2, gy + 3, w - 4, ground - 4);
      px(c, '#2bb673', ox + 2, gy + 1, w - 4, 3);
      px(c, '#f2c14e', ox + 2, gy + 3, w - 4, 1);
    } else {
      px(c, '#6c6f7c', ox, gy, w, ground);
      for (let k = gy + 2; k < gy + ground; k += 2) px(c, '#5a5d69', ox + 2, k, w - 4, 1);
    }
  } else {
    // 騎樓店面：上面幾層住家（鐵窗）、一樓是有柱子的騎樓、外面掛直式霓虹招牌
    const wall = ['#6a5a52', '#5b6470', '#706457', '#5f5a6e', '#68625a'][Math.floor(rand() * 5)] ?? '#6a5a52';
    px(c, '#3d3a44', ox, top, w, roofD);
    px(c, '#4c4954', ox, top, w, 1);
    waterTank(c, ox + 2 + Math.floor(rand() * Math.max(1, w - 14)), top + 1, rand() < 0.6);
    px(c, wall, ox, fy, w, facadeH);
    const upper = facadeH - ground;
    for (let r = 0; r < b.floors; r += 1) {
      const ry = fy + r * floorPx;
      for (let cx = ox + 3; cx + 8 <= ox + w - 2; cx += 11) {
        const lit = rand() < 0.6;
        px(c, '#2b2a33', cx - 1, ry + 1, 10, 8);
        px(c, lit ? (LIT[Math.floor(rand() * LIT.length)] ?? '#ffe6a3') : '#34333e', cx, ry + 2, 8, 6);
        for (let k = 0; k < 8; k += 2) px(c, 'rgba(25,25,30,0.65)', cx + k, ry + 2, 1, 6);
        px(c, 'rgba(25,25,30,0.65)', cx, ry + 5, 8, 1);
      }
    }
    // 橫招牌（一樓上緣）
    const band = SIGN_COLORS[Math.floor(rand() * SIGN_COLORS.length)] ?? '#e03a3a';
    px(c, band, ox, fy + upper - 4, w, 5);
    px(c, 'rgba(255,255,255,0.75)', ox + 3, fy + upper - 2, Math.max(4, w - 10), 1);
    // 騎樓：柱子、暗暗的走廊、裡面亮亮的店
    const gy = fy + upper + 1;
    px(c, '#16141c', ox, gy, w, ground - 1);
    px(c, ['#ffd27a', '#ff9a6a', '#9fe0ff', '#ffe9b8'][Math.floor(rand() * 4)] ?? '#ffd27a', ox + 3, gy + 4, w - 6, ground - 6);
    for (let k = ox; k < ox + w; k += 12) px(c, wall, k, gy, 3, ground - 1);
    px(c, 'rgba(0,0,0,0.3)', ox, gy, w, 2);
    // 直式霓虹招牌：從牆面伸出來，上面寫一兩個字
    const word = SIGN_WORDS[Math.floor(rand() * SIGN_WORDS.length)] ?? '茶';
    const sc = SIGN_COLORS[Math.floor(rand() * SIGN_COLORS.length)] ?? '#e03a3a';
    const sx = rand() < 0.5 ? ox + 1 : ox + w - 9;
    const sh = 10 + word.length * 9;
    const sy = fy + Math.max(2, upper - sh - 6);
    c.fillStyle = sc;
    c.globalAlpha = 0.28;
    c.fillRect(sx - 3, sy - 3, 14, sh + 6);
    c.globalAlpha = 1;
    px(c, '#15171f', sx - 1, sy - 1, 10, sh + 2);
    px(c, sc, sx, sy, 8, sh);
    px(c, 'rgba(255,255,255,0.35)', sx, sy, 1, sh);
    c.fillStyle = '#ffffff';
    c.font = '700 8px "PingFang TC", "Noto Sans TC", sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'top';
    [...word].forEach((ch, i) => c.fillText(ch, sx + 4, sy + 3 + i * 9));
    px(c, 'rgba(255,255,255,0.08)', ox, fy, 1, upper);
    px(c, 'rgba(0,0,0,0.3)', ox + w - 2, fy, 2, facadeH);
  }
  return canvas;
}

export function drawBuilding(ctx: CanvasRenderingContext2D, b: Building): void {
  b.sprite ??= buildingSprite(b);
  const size = layerSize(b.sprite);
  ctx.drawImage(b.sprite, Math.round(b.x0 * T) - PAD, Math.round(b.y1 * T) - size.h + 3, size.w, size.h);
}

// 行道樹：樹穴＋圓圓的樹冠（夜裡偏藍綠，被路燈照到的那側亮一點）
export function drawTree(ctx: CanvasRenderingContext2D, t: { x: number; y: number; seed: number }): void {
  const x = Math.round(t.x * T);
  const y = Math.round(t.y * T);
  const big = t.seed % 3 === 0;
  px(ctx, 'rgba(0,0,0,0.3)', x - 7, y + 1, 14, 3);
  px(ctx, '#3b3f4a', x - 4, y - 1, 8, 3);
  px(ctx, '#4a3426', x - 1, y - 8, 3, 8);
  const r = big ? 9 : 7;
  px(ctx, '#173528', x - r, y - 8 - r * 2 + 2, r * 2, r * 2 - 2);
  px(ctx, '#1f4634', x - r + 2, y - 8 - r * 2, r * 2 - 4, r * 2 - 2);
  px(ctx, '#2b5c43', x - r + 3, y - 8 - r * 2 + 1, r - 1, r - 2);
  px(ctx, '#3d7a57', x - r + 4, y - 8 - r * 2 + 2, 3, 2);
}

// 路燈：細燈柱、往外彎的燈頭、暖色燈泡
export function drawLamp(ctx: CanvasRenderingContext2D, l: { x: number; y: number }): void {
  const x = Math.round(l.x * T);
  const y = Math.round(l.y * T);
  px(ctx, 'rgba(0,0,0,0.3)', x - 2, y + 1, 6, 2);
  px(ctx, '#3d424c', x, y - 26, 2, 27);
  px(ctx, '#545a66', x, y - 26, 1, 27);
  px(ctx, '#3d424c', x, y - 27, 7, 2);
  px(ctx, '#2f333b', x + 4, y - 27, 6, 3);
  px(ctx, '#fff1a8', x + 5, y - 24, 4, 1);
}

// 停在人行道上的機車（台灣街景）
export function drawScooter(ctx: CanvasRenderingContext2D, s: { x: number; y: number; color: string; flip: boolean }): void {
  const x = Math.round(s.x * T);
  const y = Math.round(s.y * T);
  px(ctx, 'rgba(0,0,0,0.3)', x - 1, y + 1, 7, 2);
  px(ctx, '#1d1e24', x, y - 1, 2, 2);
  px(ctx, '#1d1e24', x + 4, y - 1, 2, 2);
  px(ctx, s.color, x, y - 5, 6, 4);
  px(ctx, 'rgba(255,255,255,0.35)', x, y - 5, 6, 1);
  px(ctx, '#2b2d33', s.flip ? x + 4 : x, y - 8, 2, 3);
  px(ctx, '#2b2d33', x + 1, y - 6, 3, 1);
}
