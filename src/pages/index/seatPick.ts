// F1、環河公園、北投共用：點到座位附近就算點座位（以前只有座位正上方窄窄一條）。
// 範圍左右各約 1 格、上到頭頂、下到腳下；幾個重疊時選最近的，有空位的優先。
export function pickSeatSpot(spots: readonly { x: number; y: number }[], x: number, y: number, isEmpty?: (i: number) => boolean): number {
  let best = -1;
  let bestScore = Infinity;
  spots.forEach((s, i) => {
    const dx = x - s.x;
    const dy = y - s.y;
    if (Math.abs(dx) > 0.95 || dy < -1.7 || dy > 0.95) return;
    const score = Math.hypot(dx, dy + 0.4) - (isEmpty?.(i) ? 10 : 0);
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}
