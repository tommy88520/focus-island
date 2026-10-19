// F1 賽車場、環河公園、北投溫泉這些獨立地圖共用：送自己的位置、把別人收到的位置平滑地畫出來。
// 位置訊息帶 scene（'f1'／'park'／'beitou'），主地圖只畫沒有 scene 的人，獨立地圖各自只畫自己那張的人。
import type { MyPosition, RemotePlayer } from 'src/pages/index/composables/useLibrarySocket';
import { readerColors, type AvatarColors } from 'src/pages/index/pixel/pixelArt';

// 獨立地圖的 scene（跟後端 allowedScenes 對好）：f1hub＝F1 月台，gptpe／gptxg／gpkhh＝台北／台中／高雄大獎賽
export const MAP_SCENES = ['f1', 'park', 'beitou', 'home', 'f1hub', 'gptpe', 'gptxg', 'gpkhh', 'miaokou'] as const;
export type SceneId = (typeof MAP_SCENES)[number];
export type GpSceneId = 'gptpe' | 'gptxg' | 'gpkhh';
export function isSceneId(value: unknown): value is SceneId {
  return typeof value === 'string' && (MAP_SCENES as readonly string[]).includes(value);
}

// 走動時最多每 0.15 秒送一次、停下來那則一定送、站著不動每 20 秒補一次（跟主地圖一樣）
export function createPositionSync(send: (pos: MyPosition) => void) {
  let lastKey = '';
  let lastAt = -Infinity;
  return (pos: MyPosition, seconds: number): void => {
    const key = pos.hidden ? 'hidden' : JSON.stringify(pos);
    const due = key !== lastKey && (!pos.moving || seconds - lastAt >= 0.15);
    const keepalive = !pos.hidden && seconds - lastAt > 20;
    if (!due && !keepalive) return;
    lastAt = seconds;
    lastKey = key;
    send(pos);
  };
}

// 超過這麼久沒消息名牌加 💤；10 分鐘才當作不在（離開會有 LEAVE）
const AWAY_MS = 60_000;
const STALE_MS = 10 * 60_000;

export interface ShownRemote {
  remote: RemotePlayer;
  x: number;
  y: number;
  angle: number;
  away: boolean;
}

// 畫面上的位置每格往收到的位置追一點，看起來是走過去而不是跳過去
export function createRemoteView() {
  const shown = new Map<string, { x: number; y: number; angle: number }>();
  return (remotes: Record<string, RemotePlayer>, scene: SceneId, dt: number): ShownRemote[] => {
    const now = Date.now();
    const list: ShownRemote[] = [];
    for (const remote of Object.values(remotes)) {
      if (remote.scene !== scene || now - remote.at > STALE_MS) continue;
      const target = { x: remote.x, y: remote.y, angle: remote.angle ?? 0 };
      const prev = shown.get(remote.key);
      const k = Math.min(1, dt * 10);
      const next =
        !prev || Math.hypot(prev.x - target.x, prev.y - target.y) > 6
          ? target
          : { x: prev.x + (target.x - prev.x) * k, y: prev.y + (target.y - prev.y) * k, angle: target.angle };
      shown.set(remote.key, next);
      list.push({ remote, ...next, away: now - remote.at > AWAY_MS });
    }
    for (const key of shown.keys()) if (!remotes[key] || remotes[key]?.scene !== scene) shown.delete(key);
    return list;
  };
}

export function remoteColors(remote: RemotePlayer): AvatarColors {
  return readerColors(remote);
}

export function remoteLabel(shown: ShownRemote): string {
  return `${shown.away ? '💤 ' : ''}${shown.remote.dnd ? '🔕 ' : ''}${shown.remote.displayName}`;
}
