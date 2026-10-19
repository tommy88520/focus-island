// 台北、台中、高雄大獎賽（夜間街道賽）：每條賽道一張獨立地圖，共用 GrandPrixScene 的開車、計圈、看台。
// 座標單位是格（1 格 = 16px），y 往下。賽道是一條封閉的中心線（順時針），起終點在第 0 段上；
// 中心線的每個轉折點就是一個彎（轉角夠大的才編號，T1 從起點之後第一個彎開始數）。
import type { GpSceneId } from 'src/pages/index/sceneRemotes';

export type LandmarkKind =
  | 'tower101'
  | 'dome'
  | 'memorialHall'
  | 'cityHall'
  | 'mall'
  | 'opera'
  | 'twinTowers'
  | 'tower85'
  | 'musicCenter'
  | 'portTerminal'
  | 'exhibition'
  | 'ferris'
  | 'cruise';

export interface Rect {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

export interface Landmark extends Rect {
  kind: LandmarkKind;
  name: { 'zh-TW': string; 'en-US': string };
}

export interface CircuitDef {
  id: GpSceneId;
  title: { 'zh-TW': string; 'en-US': string };
  W: number;
  H: number;
  track: [number, number][];
  // 起終點線在第 0 段的哪裡（0–1）
  startAt: number;
  // DRS 區：第幾段（開啟時極速比較高）
  drs: number[];
  landmarks: Landmark[];
  parks: Rect[];
  water: Rect[];
  // 看台（12 個座位，兩排各 6，順序 = 座位編號）
  stand: Rect;
  // 回 F1 月台的車站
  station: Rect;
  // 自己的車停在維修道上
  carHome: { x: number; y: number; angle: number };
  // 維修道：起終點直線旁的藍色車道
  pitLane: Rect;
  // 霓虹的顏色、城市的底色
  neon: string;
  seed: number;
}

export const GP_ORDER: GpSceneId[] = ['gptpe', 'gptxg', 'gpkhh'];
export const TRACK_HALF = 2;

const TAIPEI: CircuitDef = {
  id: 'gptpe',
  title: { 'zh-TW': '台北大獎賽', 'en-US': 'Taipei Grand Prix' },
  W: 80,
  H: 50,
  // 市府路起跑往東 → 大巨蛋右轉往南（松仁路）→ 信義路往西長直線（DRS 2）→ 國父紀念館一帶的連續 S 彎 → 回市府路
  track: [
    [14, 10],
    [60, 10],
    [65, 13],
    [66, 19],
    [61, 24],
    [65, 30],
    [66, 38],
    [61, 42],
    [46, 42],
    [40, 36],
    [34, 42],
    [13, 42],
    [8, 38],
    [11, 32],
    [6, 27],
    [10, 21],
    [6, 16],
    [9, 11],
  ],
  startAt: 0.55,
  drs: [0, 10],
  landmarks: [
    { kind: 'tower101', x0: 34, y0: 22, x1: 40, y1: 30, name: { 'zh-TW': '台北 101', 'en-US': 'Taipei 101' } },
    { kind: 'cityHall', x0: 44, y0: 18, x1: 56, y1: 23, name: { 'zh-TW': '台北市政府', 'en-US': 'Taipei City Hall' } },
    { kind: 'dome', x0: 68, y0: 2, x1: 78, y1: 9, name: { 'zh-TW': '台北大巨蛋', 'en-US': 'Taipei Dome' } },
    { kind: 'memorialHall', x0: 16, y0: 17, x1: 27, y1: 24, name: { 'zh-TW': '國父紀念館', 'en-US': 'Sun Yat-sen Memorial Hall' } },
    { kind: 'mall', x0: 46, y0: 29, x1: 57, y1: 36, name: { 'zh-TW': '信義商圈', 'en-US': 'Xinyi District' } },
  ],
  parks: [{ x0: 14, y0: 15, x1: 30, y1: 36 }],
  water: [],
  stand: { x0: 22, y0: 2.5, x1: 36, y1: 6.5 },
  station: { x0: 1.5, y0: 45, x1: 5.5, y1: 47.5 },
  carHome: { x: 40, y: 13.3, angle: 0 },
  pitLane: { x0: 24, y0: 12.4, x1: 56, y1: 14.2 },
  neon: '#ff3b5c',
  seed: 101,
};

const TAICHUNG: CircuitDef = {
  id: 'gptxg',
  title: { 'zh-TW': '台中大獎賽', 'en-US': 'Taichung Grand Prix' },
  W: 80,
  H: 50,
  // 台灣大道起跑往東 → 新光三越轉彎 → 惠中路往北長直線（DRS 2）→ 市政府前直角彎 → 秋紅谷 → 歌劇院 → 惠來公園繞一圈 → 回台灣大道
  track: [
    [16, 40],
    [48, 40],
    [55, 44],
    [62, 43],
    [66, 37],
    [66, 12],
    [62, 7],
    [48, 7],
    [42, 11],
    [34, 6],
    [26, 8],
    [27, 16],
    [32, 22],
    [24, 26],
    [15, 21],
    [8, 25],
    [8, 34],
  ],
  startAt: 0.5,
  drs: [0, 4],
  landmarks: [
    { kind: 'opera', x0: 37, y0: 23, x1: 45, y1: 30, name: { 'zh-TW': '臺中國家歌劇院', 'en-US': 'National Taichung Theater' } },
    { kind: 'cityHall', x0: 49, y0: 12, x1: 61, y1: 19, name: { 'zh-TW': '臺中市政府', 'en-US': 'Taichung City Hall' } },
    { kind: 'mall', x0: 47, y0: 27, x1: 60, y1: 35, name: { 'zh-TW': '新光三越', 'en-US': 'Shin Kong Mitsukoshi' } },
    { kind: 'twinTowers', x0: 22, y0: 44, x1: 34, y1: 49, name: { 'zh-TW': '台中之鑽', 'en-US': 'The Diamond Towers' } },
  ],
  parks: [
    { x0: 31, y0: 10, x1: 41, y1: 19 },
    { x0: 12, y0: 27, x1: 22, y1: 37 },
  ],
  water: [{ x0: 34, y0: 14, x1: 39, y1: 18 }],
  stand: { x0: 22, y0: 32, x1: 36, y1: 36 },
  station: { x0: 3, y0: 44, x1: 7, y1: 46.5 },
  carHome: { x: 42, y: 37.2, angle: 0 },
  pitLane: { x0: 20, y0: 36.4, x1: 46, y1: 38.1 },
  neon: '#ff4d6d',
  seed: 404,
};

const KAOHSIUNG: CircuitDef = {
  id: 'gpkhh',
  title: { 'zh-TW': '高雄大獎賽', 'en-US': 'Kaohsiung Grand Prix' },
  W: 80,
  H: 52,
  // 沿著港邊起跑往東（DRS 1）→ 85 大樓一帶的連續彎 → 夢時代 → 沿海邊往西長直線（DRS 2）→ 流行音樂中心外的髮夾彎 → 回港邊
  track: [
    [18, 16],
    [52, 16],
    [58, 14],
    [64, 18],
    [65, 25],
    [60, 30],
    [65, 36],
    [60, 42],
    [46, 41],
    [38, 44],
    [12, 44],
    [6, 40],
    [8, 32],
    [4, 26],
    [8, 20],
  ],
  startAt: 0.4,
  drs: [0, 9],
  landmarks: [
    { kind: 'tower85', x0: 69, y0: 16, x1: 75, y1: 26, name: { 'zh-TW': '85 大樓', 'en-US': '85 Sky Tower' } },
    { kind: 'musicCenter', x0: 3, y0: 5, x1: 15, y1: 11, name: { 'zh-TW': '高雄流行音樂中心', 'en-US': 'Kaohsiung Music Center' } },
    { kind: 'portTerminal', x0: 36, y0: 5.5, x1: 50, y1: 10.5, name: { 'zh-TW': '高雄港旅運中心', 'en-US': 'Kaohsiung Port Terminal' } },
    { kind: 'exhibition', x0: 16, y0: 25, x1: 30, y1: 33, name: { 'zh-TW': '高雄展覽館', 'en-US': 'Kaohsiung Exhibition Center' } },
    { kind: 'ferris', x0: 46, y0: 27, x1: 54, y1: 36, name: { 'zh-TW': '夢時代', 'en-US': 'Dream Mall' } },
    { kind: 'cruise', x0: 52, y0: 2, x1: 66, y1: 7, name: { 'zh-TW': '', 'en-US': '' } },
  ],
  parks: [],
  water: [
    { x0: 0, y0: 0, x1: 80, y1: 10.5 },
    { x0: 0, y0: 48, x1: 80, y1: 52 },
  ],
  stand: { x0: 24, y0: 19, x1: 38, y1: 23 },
  station: { x0: 72, y0: 44, x1: 76, y1: 46.5 },
  carHome: { x: 44, y: 19.2, angle: 0 },
  pitLane: { x0: 22, y0: 18.4, x1: 50, y1: 20.1 },
  neon: '#ff3b8a',
  seed: 85,
};

export const CIRCUITS: Record<GpSceneId, CircuitDef> = { gptpe: TAIPEI, gptxg: TAICHUNG, gpkhh: KAOHSIUNG };

// 看台 12 個座位：前排 6、後排 6（順序 = 座位編號）
export function standSeats(stand: Rect): { x: number; y: number }[] {
  const w = stand.x1 - stand.x0;
  const gap = (w - 2) / 5;
  return [0, 1].flatMap((row) => Array.from({ length: 6 }, (_, i) => ({ x: stand.x0 + 1 + i * gap, y: stand.y1 - 0.6 - row * 1.7 })));
}

// 轉角夠大的轉折點才算一個彎；T1 是起點之後第一個彎
export function cornerPoints(track: [number, number][]): { x: number; y: number; n: number }[] {
  const out: { x: number; y: number; n: number }[] = [];
  const count = track.length;
  for (let k = 1; k <= count; k += 1) {
    const i = k % count;
    const prev = track[(i - 1 + count) % count];
    const cur = track[i];
    const next = track[(i + 1) % count];
    if (!prev || !cur || !next) continue;
    const a = Math.atan2(cur[1] - prev[1], cur[0] - prev[0]);
    const b = Math.atan2(next[1] - cur[1], next[0] - cur[0]);
    let d = Math.abs(b - a);
    if (d > Math.PI) d = Math.PI * 2 - d;
    if (d > 0.3) out.push({ x: cur[0], y: cur[1], n: out.length + 1 });
  }
  return out;
}
