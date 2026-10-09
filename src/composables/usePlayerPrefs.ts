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
}

const DEFAULTS: PlayerPrefs = { dailyGoalHours: 6, hair: 0, shirt: 0, doNotDisturb: false };

function load(): PlayerPrefs {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<PlayerPrefs>;
    const int = (v: unknown, fallback: number) => (Number.isInteger(v) && (v as number) >= 0 ? (v as number) : fallback);
    return {
      dailyGoalHours: int(parsed.dailyGoalHours, DEFAULTS.dailyGoalHours) || DEFAULTS.dailyGoalHours,
      hair: int(parsed.hair, DEFAULTS.hair),
      shirt: int(parsed.shirt, DEFAULTS.shirt),
      doNotDisturb: parsed.doNotDisturb === true,
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
