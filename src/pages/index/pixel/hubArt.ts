// F1 月台的美術：拋光石材地板、月台門（上面有 LED 目的地牌）、F1 塗裝的列車、柱子上的燈箱廣告、
// 發車資訊看板、販賣機、盆栽、下面牆上各賽道的海報、右下角往下的手扶梯和樓梯。
import type { CircuitDef } from './circuits';
import { px, seeded } from './pixelUtil';

const T = 16;

export interface HubGate {
  x: number;
  color: string;
  label: string;
  circuit: CircuitDef | null;
}

export interface HubLayout {
  W: number;
  H: number;
  trainY0: number;
  platformY: number;
  wallY: number;
  exit: { x0: number; y0: number; x1: number; y1: number };
  gates: HubGate[];
  title: string;
}

function text(c: CanvasRenderingContext2D, s: string, x: number, y: number, color: string, font: string, align: CanvasTextAlign = 'center'): void {
  c.fillStyle = color;
  c.font = font;
  c.textAlign = align;
  c.textBaseline = 'middle';
  c.fillText(s, x, y);
}

// 把賽道中心線縮進框框裡畫成霓虹線（海報、燈箱、看板用）
export function miniCircuit(c: CanvasRenderingContext2D, circuit: CircuitDef | null, x: number, y: number, w: number, h: number, color: string, width = 2): void {
  c.save();
  c.strokeStyle = color;
  c.lineWidth = width;
  c.lineJoin = 'round';
  c.shadowColor = color;
  c.shadowBlur = 4;
  c.beginPath();
  if (!circuit) {
    // 原本的 F1 賽車場：圓角的長方形跑道
    c.roundRect(x + 3, y + 3, w - 6, h - 6, Math.min(w, h) / 3);
  } else {
    const xs = circuit.track.map((p) => p[0]);
    const ys = circuit.track.map((p) => p[1]);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const k = Math.min((w - 6) / (Math.max(...xs) - minX), (h - 6) / (Math.max(...ys) - minY));
    const ox = x + (w - (Math.max(...xs) - minX) * k) / 2;
    const oy = y + (h - (Math.max(...ys) - minY) * k) / 2;
    circuit.track.forEach(([tx, ty], i) => {
      const sx = ox + (tx - minX) * k;
      const sy = oy + (ty - minY) * k;
      if (i === 0) c.moveTo(sx, sy);
      else c.lineTo(sx, sy);
    });
    c.closePath();
  }
  c.stroke();
  c.restore();
}

// ── 地面（畫一次）：軌道、地板、導盲磚、排隊標線、牆上的海報、出口 ──
export function paintHubGround(c: CanvasRenderingContext2D, L: HubLayout): void {
  const rand = seeded(17);
  const W = L.W * T;
  const py = L.platformY * T;
  const wy = L.wallY * T;
  // 軌道：碎石、枕木、鐵軌（大多被列車擋住）
  px(c, '#25252c', 0, 0, W, py);
  for (let i = 0; i < 700; i += 1) px(c, rand() < 0.5 ? '#34343c' : '#1e1e24', Math.floor(rand() * W), Math.floor(rand() * py), 2, 2);
  // 地板：暖白色石材，2×2 格一塊，天花板燈照下來的反光
  px(c, '#d8d2c6', 0, py, W, wy - py);
  for (let x = 0; x < W; x += 2 * T) px(c, '#c8c1b4', x, py, 1, wy - py);
  for (let y = py + T; y < wy; y += 2 * T) px(c, '#c8c1b4', 0, y, W, 1);
  for (let i = 0; i < 900; i += 1) px(c, rand() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(120,110,95,0.12)', Math.floor(rand() * W), py + Math.floor(rand() * (wy - py)), 1, 1);
  for (let lx = 2.5 * T; lx < W; lx += 5 * T) {
    const g = c.createLinearGradient(lx - 14, 0, lx + 14, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(0.5, 'rgba(255,255,255,0.35)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g;
    c.fillRect(lx - 14, py + 2.4 * T, 28, wy - py - 3 * T);
  }
  // 月台邊緣：水泥邊、黃色導盲磚（凸點）
  px(c, '#b5ae9f', 0, py, W, 4);
  px(c, '#f2c230', 0, py + 0.55 * T, W, 0.42 * T);
  for (let x = 1; x < W; x += 4) for (let k = 0; k < 2; k += 1) px(c, '#d6a71e', x + (k % 2) * 2, py + 0.6 * T + 2 + k * 3, 2, 2);
  // 往出口的導盲線
  const guideY = (L.exit.y0 + 0.6) * T;
  px(c, '#f2c230', 2 * T, guideY, L.exit.x0 * T - 2 * T, 0.32 * T);
  for (let x = 2 * T; x < L.exit.x0 * T; x += 6) px(c, '#d6a71e', x, guideY + 1, 4, 1);
  // 車門前：排隊的箭頭（往兩邊讓開）、目的地顏色的地貼
  for (const gate of L.gates) {
    const gx = gate.x * T;
    px(c, gate.color, gx - 1.2 * T, py + 1.25 * T, 2.4 * T, 3);
    for (const side of [-1, 1]) {
      const ax = gx + side * 1.9 * T;
      for (let k = 0; k < 3; k += 1) px(c, '#3bb36b', ax - 1, py + 1.6 * T + k * 5, 3, 3);
      px(c, '#3bb36b', ax - 3, py + 1.6 * T, 7, 2);
    }
    for (let k = 0; k < 3; k += 1) px(c, 'rgba(40,40,46,0.35)', gx - 1, py + 1.8 * T + k * 6, 3, 4);
  }
  // 下面的牆：白色磁磚、上緣不鏽鋼收邊
  px(c, '#e7e2d8', 0, wy, W, L.H * T - wy);
  for (let x = 0; x < W; x += 8) px(c, '#d7d1c4', x, wy, 1, L.H * T - wy);
  for (let y = wy; y < L.H * T; y += 8) px(c, '#d7d1c4', 0, y, W, 1);
  px(c, '#9aa3b2', 0, wy, W, 3);
  px(c, '#c9d0db', 0, wy, W, 1);
  // 各賽道的燈箱海報：深色底、霓虹賽道、名字
  for (const gate of L.gates) {
    const bw = 8 * T;
    const bx = gate.x * T - bw / 2;
    const by = wy + 7;
    const bh = L.H * T - wy - 12;
    px(c, '#8d95a3', bx - 2, by - 2, bw + 4, bh + 4);
    const g = c.createLinearGradient(bx, by, bx, by + bh);
    g.addColorStop(0, '#141a2e');
    g.addColorStop(1, '#0b0e19');
    c.fillStyle = g;
    c.fillRect(bx, by, bw, bh);
    px(c, gate.color, bx, by, bw, 3);
    // 城市天際線剪影
    const sr = seeded(Math.round(gate.x * 13));
    for (let k = bx + 2; k < bx + bw - 4; k += 5) {
      const hh = 4 + Math.floor(sr() * 12);
      px(c, '#1f2742', k, by + bh - hh, 4, hh);
      if (sr() < 0.6) px(c, '#ffd98a', k + 1, by + bh - hh + 2, 1, 1);
    }
    miniCircuit(c, gate.circuit, bx + 4, by + 8, bw * 0.48, bh - 14, gate.color, 2);
    text(c, gate.label, bx + bw * 0.74, by + bh * 0.42, '#ffffff', '700 9px "PingFang TC", "Noto Sans TC", sans-serif');
    text(c, gate.circuit ? 'GRAND PRIX' : 'F1 CIRCUIT', bx + bw * 0.74, by + bh * 0.42 + 11, gate.color, '700 6px system-ui, sans-serif');
  }
  // 出口：地板上的開口，左半樓梯、右半手扶梯（台階在 drawEscalator 動），周圍玻璃欄杆
  const ex = L.exit.x0 * T;
  const ey = L.exit.y0 * T;
  const ew = (L.exit.x1 - L.exit.x0) * T;
  const eh = (L.exit.y1 - L.exit.y0) * T;
  px(c, '#1a1b22', ex, ey, ew, eh);
  for (let k = 0; k < 8; k += 1) {
    const yy = ey + 4 + k * ((eh - 6) / 8);
    const shade = 80 + k * 12;
    px(c, `rgb(${shade}, ${shade + 4}, ${shade + 14})`, ex + 3, Math.round(yy), ew / 2 - 5, 3);
    px(c, '#f2c230', ex + 3, Math.round(yy), ew / 2 - 5, 1);
  }
  px(c, '#2b2e3a', ex + ew / 2 - 2, ey, 4, eh);
  px(c, '#9aa3b2', ex, ey - 2, ew, 2);
  px(c, 'rgba(180, 220, 255, 0.35)', ex, ey - 8, ew, 6);
  px(c, '#c9d0db', ex, ey - 8, ew, 1);
  px(c, 'rgba(180, 220, 255, 0.35)', ex - 2, ey - 8, 2, eh + 8);
}

// 手扶梯的台階一直往下走
export function drawEscalator(c: CanvasRenderingContext2D, L: HubLayout, seconds: number): void {
  const ex = L.exit.x0 * T;
  const ey = L.exit.y0 * T;
  const ew = (L.exit.x1 - L.exit.x0) * T;
  const eh = (L.exit.y1 - L.exit.y0) * T;
  const x = ex + ew / 2 + 3;
  const w = ew / 2 - 6;
  px(c, '#2f323e', x, ey, w, eh);
  const step = 6;
  const off = (seconds * 10) % step;
  for (let y = ey + off; y < ey + eh - 1; y += step) {
    const k = (y - ey) / eh;
    const shade = Math.round(150 - k * 70);
    px(c, `rgb(${shade}, ${shade + 6}, ${shade + 18})`, x + 1, Math.round(y), w - 2, 2);
  }
  px(c, '#15171f', x - 2, ey, 2, eh);
  px(c, '#15171f', x + w, ey, 2, eh);
  px(c, '#3bb36b', x + w / 2 - 2, ey + 2, 4, 3);
}

// 出口的綠色指示牌（掛在開口上方）
export function drawExitSign(c: CanvasRenderingContext2D, L: HubLayout): void {
  const cx = ((L.exit.x0 + L.exit.x1) / 2) * T;
  const y = L.exit.y0 * T - 34;
  px(c, '#5a5f70', cx - 1, y + 10, 2, 16);
  px(c, '#0f6b3a', cx - 26, y, 52, 12);
  px(c, '#1f9e5a', cx - 26, y, 52, 1);
  text(c, '出口 EXIT ↓', cx, y + 6.5, '#ffffff', '700 7px "PingFang TC", "Noto Sans TC", sans-serif');
}

// ── 列車：銀白車身、F1 紅色腰帶＋格子旗、亮著的車窗（有乘客）、對著四個月台門的車門（站在前面就開）──
export function drawHubTrain(c: CanvasRenderingContext2D, L: HubLayout, openGate: number | null, seconds: number): void {
  const W = L.W * T;
  const y0 = L.trainY0 * T;
  const y1 = L.platformY * T - 2;
  const h = y1 - y0;
  // 車頂、車身漸層
  px(c, '#9aa3b2', 0, y0, W, 6);
  px(c, '#c9d0db', 0, y0, W, 1);
  for (let x = 30; x < W; x += 90) px(c, '#6c7487', x, y0 + 1, 22, 4);
  const g = c.createLinearGradient(0, y0 + 6, 0, y1);
  g.addColorStop(0, '#f4f6f9');
  g.addColorStop(0.7, '#dfe4ec');
  g.addColorStop(1, '#b9c1cd');
  c.fillStyle = g;
  c.fillRect(0, y0 + 6, W, h - 6);
  // 車窗：一長條深色玻璃，裡面暖色燈、坐著的乘客
  const winY = y0 + 12;
  const winH = 18;
  const rand = seeded(7);
  const doorAt = (x: number) => L.gates.some((gate) => Math.abs(x - gate.x * T) < 1.5 * T);
  for (let x = 6; x < W - 6; x += 22) {
    if (doorAt(x + 9)) continue;
    px(c, '#1c2433', x, winY, 18, winH);
    px(c, '#f6e2b0', x + 1, winY + 1, 16, winH - 2);
    px(c, 'rgba(255,255,255,0.45)', x + 2, winY + 2, 4, winH - 4);
    for (let k = 0; k < 2; k += 1) {
      if (rand() < 0.45) continue;
      const hx = x + 4 + k * 8;
      const hair = ['#2b2d33', '#5c3a24', '#8a5a3a', '#d9c27a'][Math.floor(rand() * 4)] ?? '#2b2d33';
      px(c, hair, hx, winY + 7, 5, 3);
      px(c, '#f2c9a6', hx, winY + 9, 5, 3);
      px(c, ['#e25a4a', '#3b82f6', '#2fb3a6', '#f6c945'][Math.floor(rand() * 4)] ?? '#3b82f6', hx - 1, winY + 12, 7, 5);
    }
  }
  // F1 紅色腰帶＋黑白格子
  px(c, '#e10600', 0, winY + winH + 6, W, 4);
  px(c, '#15171f', 0, winY + winH + 10, W, 1);
  for (let x = 0; x < W; x += 4) {
    px(c, (x / 4) % 2 === 0 ? '#15171f' : '#ffffff', x, winY + winH + 11, 4, 2);
    px(c, (x / 4) % 2 === 1 ? '#15171f' : '#ffffff', x, winY + winH + 13, 4, 2);
  }
  // 車廂接縫
  for (let x = 0; x < W; x += 11 * T) {
    px(c, '#2b2e3a', x - 2, y0, 4, h);
    px(c, '#4a4f60', x - 2, y0, 1, h);
  }
  // 車門（雙開），站在月台門前時打開、看得到車廂裡的燈
  L.gates.forEach((gate, i) => {
    const dx = gate.x * T;
    const open = openGate === i ? 9 : 0;
    const dw = 1.1 * T;
    const dy = y0 + 8;
    const dh = h - 8;
    px(c, '#ffe7b0', dx - dw, dy, dw * 2, dh);
    px(c, '#c9b07a', dx - dw, dy + dh - 4, dw * 2, 4);
    for (const side of [-1, 1]) {
      const leaf = side < 0 ? dx - dw - open : dx + open;
      px(c, '#e3e8ef', leaf, dy, dw, dh);
      px(c, '#9aa3b2', leaf, dy, dw, 1);
      px(c, '#1c2433', leaf + 3, dy + 4, dw - 6, 12);
      px(c, '#3a4766', leaf + 3, dy + 4, dw - 6, 2);
      px(c, gate.color, leaf, dy + dh - 10, dw, 2);
    }
    px(c, '#6c7487', dx - dw - 2, dy, 2, dh);
    px(c, '#6c7487', dx + dw, dy, 2, dh);
  });
  // 下緣陰影
  px(c, 'rgba(0,0,0,0.3)', 0, y1 - 2, W, 2);
  void seconds;
}

// ── 月台門：一整排玻璃（看得到後面的列車），對著車門的地方是滑門，上方是 LED 目的地牌 ──
export function drawScreenDoors(c: CanvasRenderingContext2D, L: HubLayout, openGate: number | null, seconds: number): void {
  const W = L.W * T;
  const base = L.platformY * T + 2;
  const top = base - 32;
  // 上方橫樑：車門之間印著站名
  px(c, '#2b2f3c', 0, top - 8, W, 8);
  px(c, '#4a4f60', 0, top - 8, W, 1);
  for (let k = 0; k + 1 < L.gates.length; k += 1) {
    const mx = (((L.gates[k]?.x ?? 0) + (L.gates[k + 1]?.x ?? 0)) / 2) * T;
    px(c, '#1e4fa0', mx - 30, top - 8, 60, 8);
    text(c, L.title, mx, top - 3.5, '#ffffff', '700 5px "PingFang TC", "Noto Sans TC", sans-serif');
  }
  // 玻璃＋直柱
  px(c, 'rgba(170, 215, 255, 0.16)', 0, top, W, base - top);
  for (let x = 0; x < W; x += 2.5 * T) {
    px(c, '#9aa3b2', x, top, 2, base - top);
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath();
    c.moveTo(x + 8, top);
    c.lineTo(x + 14, top);
    c.lineTo(x + 6, base);
    c.lineTo(x, base);
    c.closePath();
    c.fill();
  }
  px(c, '#9aa3b2', 0, base - 2, W, 2);
  L.gates.forEach((gate, i) => {
    const dx = gate.x * T;
    const dw = 1.15 * T;
    const open = openGate === i ? 13 : 0;
    // 滑門：黃黑警示邊
    px(c, 'rgba(0,0,0,0.25)', dx - dw - 2, top, dw * 2 + 4, base - top);
    for (const side of [-1, 1]) {
      const leaf = side < 0 ? dx - dw - open : dx + open;
      px(c, 'rgba(190, 230, 255, 0.28)', leaf, top + 1, dw, base - top - 1);
      px(c, '#c9d0db', leaf, top, dw, 1);
      const edge = side < 0 ? leaf + dw - 2 : leaf;
      for (let y = top; y < base; y += 4) px(c, (y / 4) % 2 === 0 ? '#f2c230' : '#15171f', edge, y, 2, 4);
    }
    // LED 目的地牌：黑底、琥珀色字、目的地顏色的圓點
    const sw = 4.4 * T;
    const sx = dx - sw / 2;
    const sy = top - 22;
    px(c, '#3b3f4c', dx - 1, sy + 12, 2, 10);
    px(c, '#0b0c10', sx, sy, sw, 13);
    px(c, '#2b2e3a', sx, sy, sw, 1);
    c.fillStyle = gate.color;
    c.beginPath();
    c.arc(sx + 7, sy + 6.5, 3, 0, Math.PI * 2);
    c.fill();
    const blink = openGate === i && Math.floor(seconds * 2) % 2 === 0;
    text(c, gate.label, sx + 13, sy + 7, blink ? '#ffffff' : '#ffb84d', '700 8px "PingFang TC", "Noto Sans TC", sans-serif', 'left');
  });
}

// 柱子：方柱、南面一個燈箱廣告（輪流放各賽道）
export function drawHubPillar(c: CanvasRenderingContext2D, x: number, baseY: number, gate: HubGate | undefined): void {
  const cx = Math.round(x * T);
  const by = Math.round(baseY * T);
  const h = 46;
  px(c, 'rgba(0,0,0,0.2)', cx - 9, by - 1, 20, 4);
  px(c, '#bdb6a8', cx - 8, by - h, 16, h);
  px(c, '#d3cdc1', cx - 8, by - h, 4, h);
  px(c, '#a59e90', cx + 6, by - h, 2, h);
  px(c, '#9aa3b2', cx - 8, by - 3, 16, 3);
  if (!gate) return;
  // 燈箱
  const lx = cx - 6;
  const ly = by - 36;
  px(c, '#6c7487', lx - 1, ly - 1, 14, 26);
  px(c, '#0f1424', lx, ly, 12, 24);
  px(c, gate.color, lx, ly, 12, 2);
  miniCircuit(c, gate.circuit, lx + 1, ly + 3, 10, 12, gate.color, 1);
  px(c, '#ffffff', lx + 2, ly + 17, 8, 1);
  px(c, 'rgba(255,255,255,0.5)', lx + 2, ly + 20, 6, 1);
}

// 長椅：不鏽鋼椅腳、木頭椅面＋椅背（人坐在上面面向畫面下方）
export function drawHubBenchBack(c: CanvasRenderingContext2D, x: number, y: number): void {
  const bx = Math.round((x - 1.55) * T);
  const by = Math.round(y * T);
  const w = Math.round(3.1 * T);
  px(c, '#7a8292', bx + 2, by - 14, 2, 10);
  px(c, '#7a8292', bx + w - 4, by - 14, 2, 10);
  px(c, '#8a5a34', bx, by - 15, w, 3);
  px(c, '#b07a4a', bx, by - 15, w, 1);
  px(c, '#8a5a34', bx, by - 10, w, 3);
  px(c, '#b07a4a', bx, by - 10, w, 1);
}

export function drawHubBenchSeat(c: CanvasRenderingContext2D, x: number, y: number): void {
  const bx = Math.round((x - 1.55) * T);
  const by = Math.round(y * T);
  const w = Math.round(3.1 * T);
  px(c, 'rgba(0,0,0,0.2)', bx + 2, by + 4, w, 3);
  px(c, '#9a6a40', bx, by - 3, w, 5);
  px(c, '#c48a55', bx, by - 3, w, 1);
  for (let k = bx + 6; k < bx + w; k += 8) px(c, '#8a5a34', k, by - 3, 1, 5);
  px(c, '#7a8292', bx + 3, by + 2, 2, 4);
  px(c, '#7a8292', bx + w - 5, by + 2, 2, 4);
}

// 發車資訊看板：兩支腳撐著的 LED 螢幕，列出四個目的地
export function drawDepartureBoard(c: CanvasRenderingContext2D, x0: number, x1: number, baseY: number, gates: HubGate[], header: string, status: string, seconds: number): void {
  const bx = Math.round(x0 * T);
  const w = Math.round((x1 - x0) * T);
  const by = Math.round(baseY * T);
  const h = 70;
  px(c, 'rgba(0,0,0,0.25)', bx + 4, by - 1, w - 4, 4);
  px(c, '#3b3f4c', bx + 8, by - 16, 3, 16);
  px(c, '#3b3f4c', bx + w - 11, by - 16, 3, 16);
  px(c, '#2b2e3a', bx, by - 16 - h, w, h);
  px(c, '#4a4f60', bx, by - 16 - h, w, 1);
  px(c, '#06070a', bx + 3, by - 13 - h, w - 6, h - 6);
  text(c, header, bx + w / 2, by - 16 - h + 9, '#9fd8ff', '700 6px "PingFang TC", "Noto Sans TC", sans-serif');
  px(c, '#2a3550', bx + 5, by - 16 - h + 13, w - 10, 1);
  gates.forEach((gate, i) => {
    const ry = by - 16 - h + 20 + i * 12;
    c.fillStyle = gate.color;
    c.beginPath();
    c.arc(bx + 10, ry, 2.5, 0, Math.PI * 2);
    c.fill();
    text(c, gate.label, bx + 16, ry + 0.5, '#ffb84d', '700 6px "PingFang TC", "Noto Sans TC", sans-serif', 'left');
    const on = (Math.floor(seconds * 1.5) + i) % 4 !== 0;
    if (on) text(c, status, bx + w - 7, ry + 0.5, '#7dff9a', '700 5px "PingFang TC", "Noto Sans TC", sans-serif', 'right');
    if (i < gates.length - 1) px(c, '#141a26', bx + 5, ry + 6, w - 10, 1);
  });
}

// 販賣機：亮著的正面、一格格飲料
export function drawVending(c: CanvasRenderingContext2D, x: number, baseY: number, body: string): void {
  const bx = Math.round(x * T);
  const by = Math.round(baseY * T);
  const w = 22;
  const h = 40;
  px(c, 'rgba(0,0,0,0.25)', bx + 2, by - 1, w, 4);
  px(c, body, bx, by - h, w, h);
  px(c, 'rgba(255,255,255,0.25)', bx, by - h, w, 1);
  px(c, '#e8f4ff', bx + 2, by - h + 3, w - 9, 22);
  const drinks = ['#e25a4a', '#3b82f6', '#2bb673', '#f6c945', '#f2a541', '#ffffff'];
  for (let r = 0; r < 4; r += 1) for (let k = 0; k < 3; k += 1) px(c, drinks[(r * 3 + k + Math.round(x)) % drinks.length] ?? '#fff', bx + 4 + k * 4, by - h + 5 + r * 5, 2, 4);
  px(c, '#15171f', bx + w - 6, by - h + 6, 3, 8);
  px(c, '#9aa3b2', bx + w - 6, by - h + 18, 3, 2);
  px(c, '#15171f', bx + 3, by - 12, w - 6, 6);
  glowRect(c, bx - 4, by - h - 2, w + 8, h + 6, 'rgba(220, 240, 255, 0.10)');
}

function glowRect(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, color: string): void {
  c.fillStyle = color;
  c.fillRect(x, y, w, h);
}

// 盆栽：灰色水泥盆、大葉子
export function drawPlant(c: CanvasRenderingContext2D, x: number, baseY: number): void {
  const cx = Math.round(x * T);
  const by = Math.round(baseY * T);
  px(c, 'rgba(0,0,0,0.2)', cx - 8, by - 1, 17, 3);
  px(c, '#7a7f8c', cx - 7, by - 10, 14, 10);
  px(c, '#9aa0ad', cx - 7, by - 10, 14, 2);
  px(c, '#2f6b3a', cx - 10, by - 26, 20, 16);
  px(c, '#3d8748', cx - 8, by - 29, 16, 16);
  px(c, '#57a862', cx - 5, by - 27, 6, 5);
  px(c, '#57a862', cx + 2, by - 22, 5, 4);
}

// 垃圾桶（一般、回收）
export function drawBins(c: CanvasRenderingContext2D, x: number, baseY: number): void {
  const bx = Math.round(x * T);
  const by = Math.round(baseY * T);
  px(c, 'rgba(0,0,0,0.2)', bx - 1, by - 1, 20, 3);
  px(c, '#6c7487', bx, by - 14, 8, 14);
  px(c, '#3b82f6', bx + 10, by - 14, 8, 14);
  px(c, '#9aa3b2', bx, by - 14, 8, 2);
  px(c, '#6aa5f0', bx + 10, by - 14, 8, 2);
  px(c, '#15171f', bx + 2, by - 11, 4, 1);
  px(c, '#15171f', bx + 12, by - 11, 4, 1);
}
