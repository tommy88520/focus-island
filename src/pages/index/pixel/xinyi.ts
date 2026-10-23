// 主地圖北邊的台北車站、東邊的四四南村：位置（格，1 格 = 16px），美術在 xinyiArt.ts。
// 圖書館在 (0,0)～(32,18)；車站在圖書館後面（y < 0），村子在圖書館右邊（x ≥ 32）。

export interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export const XY = {
  // 車站整棟（含屋頂，一直到地圖上緣）；y1 是立面的地面線
  station: { x0: 3, y0: -15, x1: 29, y1: -5 },
  // 中間開著的大廳（可以走進去）：y0 是後牆（閘門），y1 是門口
  hall: { x0: 11, y0: -8, x1: 21, y1: -5 },
  // 走到閘門前跳出路線圖
  gates: { x: 16, y: -7.35 },
  lawns: [
    { x0: 4, y0: -3.8, x1: 10.5, y1: -1.2 },
    { x0: 21.5, y0: -3.8, x1: 28, y1: -1.2 },
  ],
  // 四四南村從這裡往右
  villageX0: 32,
  // 北邊那排老平房（信義公民會館、眷村文物館）的地面線；後面進不去
  villageRowBottom: -9,
  goodCho: { x0: 38, y0: -6, x1: 48, y1: -3 },
  deck: { x0: 38, y0: -3, x1: 48, y1: 3.5 },
  chessGarden: { x0: 32, y0: -6, x1: 38, y1: 2.6 },
  houseC: { x0: 40, y0: 5, x1: 48, y1: 8 },
  yard: { x0: 33, y0: 3.4, x1: 39, y1: 8 },
  path: { x0: 32, y0: 9.5, x1: 48, y1: 12.5 },
  villageLawn: { x0: 32, y0: 12.5, x1: 48, y1: 18 },
} as const;

// 簡單市集只有週末擺（台灣時間星期六、日）
export function isMarketDay(now = new Date()): boolean {
  const day = new Date(now.getTime() + (now.getTimezoneOffset() + 480) * 60_000).getDay();
  return day === 0 || day === 6;
}
