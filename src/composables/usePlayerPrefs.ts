// 玩家自己的偏好：每日目標、角色外觀、勿擾。存在這個瀏覽器，整個 App 共用同一份。

import { ref, watch } from 'vue';

const STORAGE_KEY = 'focus_island_player_prefs_v1';

export const DAILY_GOAL_OPTIONS = [2, 4, 6, 8, 10] as const;

export interface PlayerPrefs {
  dailyGoalHours: number;
  // 調色盤編號（pixelArt 的 LOOK_HAIRS／LOOK_SHIRTS）
  hair: number;
  shirt: number;
  // 勿擾：別人的招呼不會出現在你的畫面上，你的名牌旁會有 🔕
  doNotDisturb: boolean;
  // 一起專注：番茄鐘跟著時鐘走（整點、半點開始）
  groupFocus: boolean;
  // 番茄鐘結束、一起專注開始時跳瀏覽器通知（頁面在背景時）
  notifications: boolean;
  // 場景的光線跟著真實時間（白天、黃昏、夜晚）；關掉就跟著網站的深淺色
  sceneClock: boolean;
}

const DEFAULTS: PlayerPrefs = { dailyGoalHours: 6, hair: 0, shirt: 0, doNotDisturb: false, groupFocus: false, notifications: false, sceneClock: true };

function load(): PlayerPrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<PlayerPrefs>;
    const int = (v: unknown, fallback: number) => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : fallback);
    return {
      dailyGoalHours: int(parsed.dailyGoalHours, DEFAULTS.dailyGoalHours) || DEFAULTS.dailyGoalHours,
      hair: int(parsed.hair, DEFAULTS.hair),
      shirt: int(parsed.shirt, DEFAULTS.shirt),
      doNotDisturb: parsed.doNotDisturb === true,
      groupFocus: parsed.groupFocus === true,
      notifications: parsed.notifications === true,
      sceneClock: parsed.sceneClock !== false,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

const prefs = ref<PlayerPrefs>(load());

watch(
  prefs,
  (value) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    } catch {
      // ignore storage errors (e.g. private mode)
    }
  },
  { deep: true },
);

export function usePlayerPrefs() {
  return prefs;
}
