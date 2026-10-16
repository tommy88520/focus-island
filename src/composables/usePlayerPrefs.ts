// 玩家自己的偏好：每日目標、角色外觀、勿擾。存在這個瀏覽器，整個 App 共用同一份。

import { ref, watch } from 'vue';

const STORAGE_KEY = 'focus_island_player_prefs_v1';

export const DAILY_GOAL_OPTIONS = [2, 4, 6, 8, 10] as const;

export interface GardenPlacement {
  id: string;
  x: number;
  y: number;
}

function isPlacement(v: unknown): v is GardenPlacement {
  const p = v as GardenPlacement | null;
  return !!p && typeof p.id === 'string' && Number.isInteger(p.x) && Number.isInteger(p.y);
}

// 外觀四個欄位（家裡衣櫃的草稿用）
export type Look = Pick<PlayerPrefs, 'hair' | 'shirt' | 'body' | 'acc'>;

export interface PlayerPrefs {
  dailyGoalHours: number;
  // 調色盤編號（pixelArt 的 LOOK_HAIRS／LOOK_SHIRTS）
  hair: number;
  shirt: number;
  // 0 男生、1 女生（長髮、裙子、海灘穿比基尼）
  body: number;
  // 戴著的配件（pixelArt 的 ACCESSORIES，0 = 不戴）、買過的配件
  acc: number;
  ownedAcc: number[];
  // 悄悄話：關掉就收不到；blocked 是不想再收到的人（userId，也會擋之後的一起看 YouTube 邀請）
  whispersOff: boolean;
  blocked: string[];
  // 自己的家：花園裡擺的東西（GARDEN_ITEMS 的 id＋格子座標）。存在帳號裡（雲端同步），之後好友互訪再搬到後端
  garden: GardenPlacement[];
  // 回過家了（第一次回家送花園擺設，只送一次）
  homeVisited: boolean;
  // 勿擾：別人的招呼不會出現在你的畫面上，你的名牌旁會有 🔕
  doNotDisturb: boolean;
  // 一起專注：番茄鐘跟著時鐘走（整點、半點開始）
  groupFocus: boolean;
  // 番茄鐘結束、一起專注開始時跳瀏覽器通知（頁面在背景時）
  notifications: boolean;
  // 場景的光線跟著真實時間（白天、黃昏、夜晚）；關掉就跟著網站的深淺色
  sceneClock: boolean;
  // 專注幣：每專注 1 分鐘 +1，可以在夜市買東西
  coins: number;
  // 2026-10-16 起基礎專注幣改成 300：舊的人第一次載入時補到 300（補過就記著，之後花掉不會再補）
  coinFloor300: boolean;
}

const COIN_FLOOR = 300;

// 還沒補過的補到 300。雲端同步合併完也要再跑一次（雲端那份可能是補之前的）
export function applyCoinFloor(p: PlayerPrefs): PlayerPrefs {
  return p.coinFloor300 ? p : { ...p, coins: Math.max(p.coins, COIN_FLOOR), coinFloor300: true };
}

const DEFAULTS: PlayerPrefs = { dailyGoalHours: 6, hair: 0, shirt: 0, body: 0, acc: 0, ownedAcc: [], whispersOff: false, blocked: [], garden: [], homeVisited: false, doNotDisturb: false, groupFocus: false, notifications: false, sceneClock: true, coins: COIN_FLOOR, coinFloor300: true };

function load(): PlayerPrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<PlayerPrefs>;
    const int = (v: unknown, fallback: number) => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : fallback);
    return {
      dailyGoalHours: int(parsed.dailyGoalHours, DEFAULTS.dailyGoalHours) || DEFAULTS.dailyGoalHours,
      hair: int(parsed.hair, DEFAULTS.hair),
      shirt: int(parsed.shirt, DEFAULTS.shirt),
      body: parsed.body === 1 ? 1 : 0,
      acc: int(parsed.acc, 0),
      whispersOff: parsed.whispersOff === true,
      homeVisited: parsed.homeVisited === true,
      garden: Array.isArray(parsed.garden) ? parsed.garden.filter(isPlacement).slice(0, 300) : [],
      blocked: Array.isArray(parsed.blocked) ? parsed.blocked.filter((v): v is string => typeof v === 'string').slice(0, 200) : [],
      ownedAcc: Array.isArray(parsed.ownedAcc) ? parsed.ownedAcc.filter((v): v is number => Number.isInteger(v) && v > 0) : [],
      doNotDisturb: parsed.doNotDisturb === true,
      groupFocus: parsed.groupFocus === true,
      notifications: parsed.notifications === true,
      sceneClock: parsed.sceneClock !== false,
      coins: Number.isInteger(parsed.coins) && (parsed.coins as number) >= 0 ? (parsed.coins as number) : DEFAULTS.coins,
      coinFloor300: parsed.coinFloor300 === true,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

const prefs = ref<PlayerPrefs>(applyCoinFloor(load()));

watch(
  prefs,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  },
  // immediate：載入時補到 300 的結果馬上存起來
  { deep: true, immediate: true },
);

export function usePlayerPrefs() {
  return prefs;
}
