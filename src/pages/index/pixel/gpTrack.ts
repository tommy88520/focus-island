// 大獎賽的賽道幾何與路面：把 circuits.ts 的折線中心線每個轉角換成圓弧（真的賽道沒有尖角），
// 開車、NPC、計圈、DRS 都用圓弧化之後的線；路面（護牆、霓虹、路緣石、白線、起跑格）畫在地面那層。
import { px, seeded } from './pixelUtil';

const T = 16;

export interface Corner {
  n: number;
  // 這個彎圓弧的中點、往彎外面的方向（放彎道編號牌）
  mx: number;
  my: number;
  ox: number;
  oy: number;
}

export interface TrackGeometry {
  pts: [number, number][];
  segs: { from: [number, number]; to: [number, number]; length: number; origin: number }[];
  length: number;
  corners: Corner[];
  pointAt(distance: number): { x: number; y: number; angle: number };
  nearest(x: number, y: number): { dist: number; segment: number; along: number; origin: number };
}

const sub = (a: [number, number], b: [number, number]): [number, number] => [a[0] - b[0], a[1] - b[1]];
const norm = (v: [number, number]): [number, number] => {
  const l = Math.hypot(v[0], v[1]) || 1;
  return [v[0] / l, v[1] / l];
};

// 每個轉角用半徑 radius 的圓弧接起來（直線太短就縮小半徑）；起點是第 0 個轉角的圓弧結束處，所以第一段一定是第 0 段直線
export function buildTrack(track: [number, number][], radius = 3.4): TrackGeometry {
  const n = track.length;
  const arcs: { a: [number, number]; b: [number, number]; pts: [number, number][]; turn: number; mid: [number, number]; out: [number, number] }[] = [];
  for (let i = 0; i < n; i += 1) {
    const p0 = track[(i - 1 + n) % n] ?? [0, 0];
    const p1 = track[i] ?? [0, 0];
    const p2 = track[(i + 1) % n] ?? [0, 0];
    const d1 = norm(sub(p1, p0));
    const d2 = norm(sub(p2, p1));
    const l1 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
    const l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
    const turn = Math.acos(Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1])));
    if (turn < 0.04) {
      arcs.push({ a: p1, b: p1, pts: [], turn: 0, mid: p1, out: [0, 0] });
      continue;
    }
    let t = radius * Math.tan(turn / 2);
    t = Math.min(t, 0.45 * Math.min(l1, l2));
    const r = t / Math.tan(turn / 2);
    const a: [number, number] = [p1[0] - d1[0] * t, p1[1] - d1[1] * t];
    const b: [number, number] = [p1[0] + d2[0] * t, p1[1] + d2[1] * t];
    const side = d1[0] * d2[1] - d1[1] * d2[0] > 0 ? 1 : -1;
    // 圓心在彎的內側（y 往下的座標裡，side > 0 是右轉）
    const nrm: [number, number] = side > 0 ? [-d1[1], d1[0]] : [d1[1], -d1[0]];
    const cx = a[0] + nrm[0] * r;
    const cy = a[1] + nrm[1] * r;
    const a0 = Math.atan2(a[1] - cy, a[0] - cx);
    const steps = Math.max(2, Math.ceil((r * turn) / 0.45));
    const pts: [number, number][] = [];
    for (let k = 1; k < steps; k += 1) {
      const ang = a0 + side * turn * (k / steps);
      pts.push([cx + Math.cos(ang) * r, cy + Math.sin(ang) * r]);
    }
    const midAng = a0 + side * turn * 0.5;
    const mid: [number, number] = [cx + Math.cos(midAng) * r, cy + Math.sin(midAng) * r];
    arcs.push({ a, b, pts, turn, mid, out: [Math.cos(midAng), Math.sin(midAng)] });
  }
  // 從第 0 個轉角的圓弧結束處開始：直線（第 i 段）→ 下一個轉角的圓弧 → …
  const pts: [number, number][] = [];
  const origin: number[] = [];
  for (let k = 0; k < n; k += 1) {
    const here = arcs[k];
    const next = arcs[(k + 1) % n];
    if (!here || !next) continue;
    pts.push(here.b);
    origin.push(k);
    if (next.turn > 0) {
      pts.push(next.a);
      origin.push(-1);
      for (const p of next.pts) {
        pts.push(p);
        origin.push(-1);
      }
    }
  }
  const segs = pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length] ?? p;
    return { from: p, to: q, length: Math.hypot(q[0] - p[0], q[1] - p[1]), origin: origin[i] ?? -1 };
  });
  const length = segs.reduce((s, g) => s + g.length, 0);
  // 轉角夠大的才算一個彎、才編號；T1 是起點之後的第一個彎
  const corners: Corner[] = [];
  for (let k = 1; k <= n; k += 1) {
    const arc = arcs[k % n];
    if (!arc || arc.turn < 0.3) continue;
    corners.push({ n: corners.length + 1, mx: arc.mid[0], my: arc.mid[1], ox: arc.out[0], oy: arc.out[1] });
  }

  function pointAt(distance: number): { x: number; y: number; angle: number } {
    let d = ((distance % length) + length) % length;
    for (const s of segs) {
      if (d <= s.length) {
        const k = s.length ? d / s.length : 0;
        return { x: s.from[0] + (s.to[0] - s.from[0]) * k, y: s.from[1] + (s.to[1] - s.from[1]) * k, angle: Math.atan2(s.to[1] - s.from[1], s.to[0] - s.from[0]) };
      }
      d -= s.length;
    }
    return { x: pts[0]?.[0] ?? 0, y: pts[0]?.[1] ?? 0, angle: 0 };
  }

  function nearest(x: number, y: number): { dist: number; segment: number; along: number; origin: number } {
    let best = { dist: Infinity, segment: 0, along: 0, origin: -1 };
    let before = 0;
    segs.forEach((s, i) => {
      const dx = s.to[0] - s.from[0];
      const dy = s.to[1] - s.from[1];
      const len2 = dx * dx + dy * dy || 1;
      const k = Math.max(0, Math.min(1, ((x - s.from[0]) * dx + (y - s.from[1]) * dy) / len2));
      const dist = Math.hypot(x - (s.from[0] + dx * k), y - (s.from[1] + dy * k));
      if (dist < best.dist) best = { dist, segment: i, along: before + k * s.length, origin: s.origin };
      before += s.length;
    });
    return best;
  }

  return { pts, segs, length, corners, pointAt, nearest };
}

function polyline(c: CanvasRenderingContext2D, pts: [number, number][], closed: boolean): void {
  c.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * T, y * T) : c.lineTo(x * T, y * T)));
  if (closed) c.closePath();
}

export interface TrackPaint {
  half: number;
  neon: string;
  drs: number[];
  startDist: number;
  seed: number;
}

// 路面：人行道底 → 柏油 → 白邊線 → 彎道的紅白路緣石 → 護牆＋霓虹燈管 → DRS 綠燈 → 起終點線、起跑格
export function paintTrack(c: CanvasRenderingContext2D, geo: TrackGeometry, o: TrackPaint): void {
  const stroke = (width: number, color: string, pts: [number, number][] = geo.pts, closed = true) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    polyline(c, pts, closed);
    c.stroke();
  };
  // 全部用「沿中心線、不同粗細」的描邊一圈圈疊出來（急彎內側也不會折回來）：
  // 人行道 → 霓虹燈管（牆頂外緣）→ 水泥牆 → 牆腳的緩衝帶 → 白邊線 → 柏油
  const W2 = o.half * 2;
  stroke((W2 + 2.4) * T, '#2c2f3b');
  c.save();
  c.shadowColor = o.neon;
  c.shadowBlur = 6;
  stroke((W2 + 1.52) * T, o.neon);
  c.restore();
  // DRS 段：牆頂的燈管換成綠色
  geo.segs.forEach((s) => {
    if (!o.drs.includes(s.origin)) return;
    c.save();
    c.lineCap = 'butt';
    c.shadowColor = '#3dff8a';
    c.shadowBlur = 6;
    c.strokeStyle = '#3dff8a';
    c.lineWidth = (W2 + 1.52) * T;
    polyline(c, [s.from, s.to], false);
    c.stroke();
    c.restore();
  });
  stroke((W2 + 1.38) * T, '#c9ccd4');
  stroke((W2 + 1.12) * T, '#8d919c');
  stroke((W2 + 0.85) * T, '#2f323c');
  stroke(W2 * T, '#e9e9ee');
  stroke((W2 - 0.28) * T, '#3a3d48');
  // 柏油上撒一點點碎石的亮點
  const rand = seeded(o.seed + 7);
  for (let i = 0; i < geo.length * 14; i += 1) {
    const p = geo.pointAt(rand() * geo.length);
    const nx = -Math.sin(p.angle);
    const ny = Math.cos(p.angle);
    const off = (rand() * 2 - 1) * (o.half - 0.3);
    px(c, rand() < 0.5 ? '#42454f' : '#33363f', Math.round((p.x + nx * off) * T), Math.round((p.y + ny * off) * T), 1, 1);
  }
  // 行車線（輪胎磨出來的比較深的一條）
  stroke(o.half * 0.9 * T, 'rgba(20, 20, 26, 0.16)');
  // 彎道的紅白路緣石：只畫在圓弧那幾段的兩側邊緣（跑進路中間的就不畫）
  for (let i = 0; i < geo.segs.length; i += 1) {
    const s = geo.segs[i];
    if (!s || s.origin !== -1 || !s.length) continue;
    const nx = -(s.to[1] - s.from[1]) / s.length;
    const ny = (s.to[0] - s.from[0]) / s.length;
    const ang = Math.atan2(s.to[1] - s.from[1], s.to[0] - s.from[0]);
    for (const side of [-1, 1]) {
      const steps = Math.max(1, Math.round(s.length / 0.45));
      for (let k = 0; k < steps; k += 1) {
        const t0 = k / steps;
        const x = s.from[0] + (s.to[0] - s.from[0]) * t0 + nx * side * (o.half - 0.2);
        const y = s.from[1] + (s.to[1] - s.from[1]) * t0 + ny * side * (o.half - 0.2);
        if (geo.nearest(x, y).dist < o.half - 0.4) continue;
        c.fillStyle = (i * 3 + k) % 2 === 0 ? '#e23b3b' : '#f4f4f4';
        c.save();
        c.translate(x * T, y * T);
        c.rotate(ang);
        c.fillRect(-4, -2.5, 8, 5);
        c.restore();
      }
    }
  }
  // 起終點：垂直賽道的黑白格子線
  const start = geo.pointAt(o.startDist);
  c.save();
  c.translate(start.x * T, start.y * T);
  c.rotate(start.angle);
  const width = o.half * 2 * T;
  const cell = width / 10;
  for (let row = 0; row < 10; row += 1) for (let col = 0; col < 3; col += 1) px(c, (row + col) % 2 === 0 ? '#ffffff' : '#15171f', col * 3 - 4, -width / 2 + row * cell, 3, cell);
  // 起跑格：線後面左右交錯的白色框＋格位號碼
  c.font = '700 6px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  for (let k = 1; k <= 8; k += 1) {
    const gx = -12 - k * 20;
    const gy = k % 2 === 1 ? -width * 0.24 : width * 0.24;
    px(c, '#f2f2f2', gx, gy - 7, 2, 14);
    px(c, '#f2f2f2', gx, gy - 7, 9, 2);
    px(c, '#f2f2f2', gx, gy + 5, 9, 2);
    c.fillStyle = 'rgba(255,255,255,0.7)';
    c.fillText(String(k), gx - 5, gy);
  }
  c.restore();
  // DRS 偵測線：每段 DRS 直線開頭一條白線
  geo.segs.forEach((s, i) => {
    const prev = geo.segs[(i - 1 + geo.segs.length) % geo.segs.length];
    if (!o.drs.includes(s.origin) || prev?.origin === s.origin) return;
    const ang = Math.atan2(s.to[1] - s.from[1], s.to[0] - s.from[0]);
    c.save();
    c.translate((s.from[0] + Math.cos(ang) * 1.5) * T, (s.from[1] + Math.sin(ang) * 1.5) * T);
    c.rotate(ang);
    px(c, 'rgba(255,255,255,0.85)', -1, -width / 2 + 2, 2, width - 4);
    c.restore();
  });
}

// 小地圖：把賽道縮到 w×h 的框裡（右上角的圈速框、月台的路線看板都用）
export function miniTrackTransform(geo: TrackGeometry, w: number, h: number, pad: number): (x: number, y: number) => [number, number] {
  const xs = geo.pts.map((p) => p[0]);
  const ys = geo.pts.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const k = Math.min((w - pad * 2) / (Math.max(...xs) - minX), (h - pad * 2) / (Math.max(...ys) - minY));
  const ox = (w - (Math.max(...xs) - minX) * k) / 2;
  const oy = (h - (Math.max(...ys) - minY) * k) / 2;
  return (x, y) => [ox + (x - minX) * k, oy + (y - minY) * k];
}
