// 3D 圖書館場景的碰撞與尋路（俯視平面 x/z，不含高度）。
// 純邏輯、不依賴 three，方便單獨測試。

export interface Point {
  x: number;
  z: number;
}

export interface Rect {
  x0: number;
  x1: number;
  z0: number;
  z1: number;
}

export interface Bounds {
  xMin: number;
  xMax: number;
  zMin: number;
  zMax: number;
}

const CELL = 0.2;
const NEIGHBORS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
];

export interface Navigation {
  isBlocked: (x: number, z: number) => boolean;
  nearestFree: (point: Point) => Point | null;
  findPath: (from: Point, to: Point) => Point[] | null;
}

export function createNavigation(bounds: Bounds, obstacles: Rect[], radius: number): Navigation {
  const cols = Math.ceil((bounds.xMax - bounds.xMin) / CELL) + 1;
  const rows = Math.ceil((bounds.zMax - bounds.zMin) / CELL) + 1;

  function isBlocked(x: number, z: number): boolean {
    if (x < bounds.xMin || x > bounds.xMax || z < bounds.zMin || z > bounds.zMax) return true;
    for (const r of obstacles) {
      if (x > r.x0 - radius && x < r.x1 + radius && z > r.z0 - radius && z < r.z1 + radius) return true;
    }
    return false;
  }

  const toWorld = (col: number, row: number): Point => ({
    x: bounds.xMin + col * CELL,
    z: bounds.zMin + row * CELL,
  });
  const toCell = (p: Point): [number, number] => [
    Math.round((p.x - bounds.xMin) / CELL),
    Math.round((p.z - bounds.zMin) / CELL),
  ];

  const blocked = new Uint8Array(cols * rows);
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const p = toWorld(col, row);
      blocked[row * cols + col] = isBlocked(p.x, p.z) ? 1 : 0;
    }
  }
  const cellBlocked = (col: number, row: number) =>
    col < 0 || row < 0 || col >= cols || row >= rows || blocked[row * cols + col] === 1;

  // 往外一圈圈找最近的可走格子
  function nearestFree(point: Point): Point | null {
    const [c0, r0] = toCell(point);
    for (let ring = 0; ring <= 12; ring += 1) {
      let best: Point | null = null;
      let bestDist = Infinity;
      for (let dr = -ring; dr <= ring; dr += 1) {
        for (let dc = -ring; dc <= ring; dc += 1) {
          if (Math.max(Math.abs(dr), Math.abs(dc)) !== ring) continue;
          if (cellBlocked(c0 + dc, r0 + dr)) continue;
          const p = toWorld(c0 + dc, r0 + dr);
          const d = (p.x - point.x) ** 2 + (p.z - point.z) ** 2;
          if (d < bestDist) {
            bestDist = d;
            best = p;
          }
        }
      }
      if (best) return best;
    }
    return null;
  }

  function lineClear(a: Point, b: Point): boolean {
    const dist = Math.hypot(b.x - a.x, b.z - a.z);
    const steps = Math.max(1, Math.ceil(dist / (CELL / 2)));
    for (let i = 1; i < steps; i += 1) {
      const t = i / steps;
      if (isBlocked(a.x + (b.x - a.x) * t, a.z + (b.z - a.z) * t)) return false;
    }
    return true;
  }

  // 把 A* 走出來的鋸齒路徑拉直：能直接看到的點就跳過中間的格子
  function simplify(path: Point[]): Point[] {
    if (path.length <= 2) return path;
    const result: Point[] = [path[0] as Point];
    let anchor = 0;
    for (let i = 2; i < path.length; i += 1) {
      if (!lineClear(path[anchor] as Point, path[i] as Point)) {
        result.push(path[i - 1] as Point);
        anchor = i - 1;
      }
    }
    result.push(path[path.length - 1] as Point);
    return result;
  }

  function findPath(from: Point, to: Point): Point[] | null {
    const start = nearestFree(from);
    const goal = nearestFree(to);
    if (!start || !goal) return null;

    const [sc, sr] = toCell(start);
    const [gc, gr] = toCell(goal);
    const key = (col: number, row: number) => row * cols + col;
    const gScore = new Map<number, number>([[key(sc, sr), 0]]);
    const parent = new Map<number, number>();
    const heuristic = (col: number, row: number) => {
      const dx = Math.abs(col - gc);
      const dz = Math.abs(row - gr);
      return dx + dz + (Math.SQRT2 - 2) * Math.min(dx, dz);
    };

    // 小型 binary heap：[f, key]
    const heap: [number, number][] = [[heuristic(sc, sr), key(sc, sr)]];
    const push = (item: [number, number]) => {
      heap.push(item);
      let i = heap.length - 1;
      while (i > 0) {
        const p = (i - 1) >> 1;
        if ((heap[p] as [number, number])[0] <= (heap[i] as [number, number])[0]) break;
        [heap[p], heap[i]] = [heap[i] as [number, number], heap[p] as [number, number]];
        i = p;
      }
    };
    const pop = (): [number, number] => {
      const top = heap[0] as [number, number];
      const last = heap.pop() as [number, number];
      if (heap.length > 0) {
        heap[0] = last;
        let i = 0;
        for (;;) {
          const l = i * 2 + 1;
          const r = l + 1;
          let m = i;
          if (l < heap.length && (heap[l] as [number, number])[0] < (heap[m] as [number, number])[0]) m = l;
          if (r < heap.length && (heap[r] as [number, number])[0] < (heap[m] as [number, number])[0]) m = r;
          if (m === i) break;
          [heap[m], heap[i]] = [heap[i] as [number, number], heap[m] as [number, number]];
          i = m;
        }
      }
      return top;
    };

    const closed = new Set<number>();
    while (heap.length > 0) {
      const [, current] = pop();
      if (closed.has(current)) continue;
      closed.add(current);
      const col = current % cols;
      const row = Math.floor(current / cols);

      if (col === gc && row === gr) {
        const cells: Point[] = [];
        let k: number | undefined = current;
        while (k !== undefined) {
          cells.push(toWorld(k % cols, Math.floor(k / cols)));
          k = parent.get(k);
        }
        cells.reverse();
        // 起點與終點換回實際座標，避免卡在格子中心
        cells[0] = { x: from.x, z: from.z };
        cells[cells.length - 1] = { x: goal.x, z: goal.z };
        return simplify(cells);
      }

      const currentG = gScore.get(current) ?? Infinity;
      for (const [dc, dr, cost] of NEIGHBORS) {
        const nc = col + dc;
        const nr = row + dr;
        if (cellBlocked(nc, nr)) continue;
        // 斜走時不能切過兩側的牆角
        if (dc !== 0 && dr !== 0 && (cellBlocked(col + dc, row) || cellBlocked(col, row + dr))) continue;
        const nk = key(nc, nr);
        if (closed.has(nk)) continue;
        const tentative = currentG + cost;
        if (tentative < (gScore.get(nk) ?? Infinity)) {
          gScore.set(nk, tentative);
          parent.set(nk, current);
          push([tentative + heuristic(nc, nr), nk]);
        }
      }
    }
    return null;
  }

  return { isBlocked, nearestFree, findPath };
}
