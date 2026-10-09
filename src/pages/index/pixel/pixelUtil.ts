// 像素畫共用的小工具

export function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

export function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

// 像素圓：一列一列填，邊緣是鋸齒而不是糊邊
export function disc(ctx: CanvasRenderingContext2D, color: string, cx: number, cy: number, r: number): void {
  for (let row = -r; row <= r; row += 1) {
    const half = Math.floor(Math.sqrt(r * r - row * row));
    px(ctx, color, cx - half, cy + row, half * 2 + 1, 1);
  }
}
