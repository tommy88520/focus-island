import { ref, computed } from 'vue';

export type LocaleKey = 'zh-TW' | 'en-US';

const APP_LOCALE_KEY = 'focus_island_app_locale_v1';

function readStoredLocale(): LocaleKey {
  if (typeof localStorage === 'undefined') return 'en-US';
  const stored = localStorage.getItem(APP_LOCALE_KEY);
  return stored === 'zh-TW' ? 'zh-TW' : 'en-US';
}

// Module-scoped singleton so every component/composable shares one locale.
const locale = ref<LocaleKey>(readStoredLocale());

const translations = {
  'zh-TW': {
    common: {
      meLabel: '我',
      loadHigh: '高',
      loadMedium: '中',
      loadLow: '低',
      customZone: '自訂分區',
    },
    layout: {
      menuLabel: '選單',
      currentStatusLabel: '目前狀態',
      currentStatusQuote: '放慢速度，坐下來，現在專注。',
      currentRoomLabel: '目前房間',
      headerGoalLabel: "Today's Goal",
      languageButton: '中 / EN',
      darkButton: '黑',
      lightButton: '白',
      favoriteButton: '最愛',
      favoriteSaved: '已設為最愛快捷',
      favoriteNone: '已將目前頁面設為最愛',
      favoriteJumped: '已前往最愛頁面',
      darkModeOn: '已切換深色模式',
      lightModeOn: '已切換淺色模式',
      defaultRoomName: '尚未選擇房間',
      defaultRoomHint: '請先到選位入座頁面選擇分區',
      menuItems: {
        seat: { title: '選位入座', caption: '選擇座位並開始專注' },
        progress: { title: '今日進度', caption: '查看完成與累積時間' },
        settings: { title: '環境設定', caption: '調整音效與外觀' },
      },
    },
    indexPage: {
      floorBadgePrefix: '樓層 ',
      headerTitleRunning: '深度專注中',
      headerTitleIdle: '挑個好位子，入座。',
      displayNameDefaultPrefix: '讀者-',
      pickSeatFirst: '請先選擇座位',
      seatReserved: (name: string, seatId: string) => `${name} 已預留 ${seatId}`,
      resumeCandidateLabel: (time: string, remain: number) => `可續接 ${time}（${remain}s 內）`,
      documentTitleFocused: '專注中',
      documentTitleIdle: '待命中',
      notifyDurationLocked: '請先結束目前專注，再切換時長',
      notifyResumeExpired: '續接已過期，請重新入座',
      notifySeatTakenResume: '座位已被占用，請重新選位',
      notifyPickSeatFirst: '請先選擇一個座位才能入座',
      notifyPickSeatToRestart: '請先入座再重新開始',
      notifyAutoRestarted: '本輪專注完成，已自動開始下一輪',
      notifySessionComplete: '本輪專注完成，辛苦了',
    },
    focusClockPanel: {
      remainingTimeLabel: '剩餘時間',
      progressLabel: '進度',
      endFocusButton: '結束專注',
      startFocusButton: '入座',
      restartButton: '重新開始',
      resumeButton: '繼續上一段專注',
      showAdvancedButton: '展開進階設定',
      hideAdvancedButton: '收合進階設定',
      focusDurationLabel: '專注時長',
      minutesSuffix: '分鐘',
      resetTimeButton: '重置時間',
      autoRestartLabel: '結束自動重來',
      displayNameLabel: '顯示名稱',
      displayNamePlaceholder: '輸入你想顯示的名稱',
      editButton: '編輯',
      saveButton: '儲存',
    },
    ambientAudioPlayer: {
      audioSettingsTitle: '音源設定',
      followFocusLabel: '跟隨專注自動播放',
      loopLabel: '循環播放',
      autoplayOnLoadLabel: '進頁自動播放',
      defaultTrackLabel: '預設音源',
    },
    seatGrid: {
      syncingFloor: (floor: number) => `同步樓層 ${floor}...`,
    },
    floorTabs: {
      floorLabel: (floor: number) => `${floor}樓`,
    },
    progressPage: {
      title: '今日進度',
      subtitle: '追蹤今天專注完成輪數與累積專注時間。',
      completedSessionsLabel: '完成輪數',
      completedSessionsHint: '每完成一輪 25 分鐘即 +1',
      focusedMinutesLabel: '累積分鐘',
      focusedMinutesHint: '由每秒 TICK 累積，較接近真實專注時長',
      focusedHoursLabel: '累積小時',
      focusedHoursHint: (hours: string) => `今天已專注 ${hours} 小時`,
      last7DaysTitle: '近 7 天',
      streakLabel: (days: number) => `連續 ${days} 天`,
      explanationTitle: '說明',
      explanationItems: [
        '計時完成會自動計入完成輪數。',
        '累積分鐘使用秒級累加，重整後會保留。',
        '跨日會自動歸零，開始新的統計。',
      ],
      todayLabel: '今天',
      weekdayLabels: ['日', '一', '二', '三', '四', '五', '六'],
      minutesUnit: ' 分鐘',
      listSeparator: '，',
    },
    librarySocket: {
      newReaderJoined: (name: string) => `👋 新同學 ${name} 進入了圖書館`,
      seatTakenBySomeoneWhileYouWereAway: '🛑 哎呀！這個位子剛剛被搶先入座了',
      seatTakenBySomeoneElse: '🛑 慢了一步！這個位子剛剛被別人搶走了',
      connectionError: '連線發生錯誤，正在嘗試重新連線',
      tokenFetchFailed: '無法取得安全連線權杖，請稍後再試',
    },
  },
  'en-US': {
    common: {
      meLabel: 'Me',
      loadHigh: 'High',
      loadMedium: 'Medium',
      loadLow: 'Low',
      customZone: 'Custom Zone',
    },
    layout: {
      menuLabel: 'Menu',
      currentStatusLabel: 'Current Status',
      currentStatusQuote: 'Slow down. Sit down. Focus now.',
      currentRoomLabel: 'Current Room',
      headerGoalLabel: "Today's Goal",
      languageButton: '中 / EN',
      darkButton: 'Dark',
      lightButton: 'Light',
      favoriteButton: 'Fav',
      favoriteSaved: 'Favorite shortcut saved',
      favoriteNone: 'This page is now your favorite',
      favoriteJumped: 'Opened favorite page',
      darkModeOn: 'Switched to dark mode',
      lightModeOn: 'Switched to light mode',
      defaultRoomName: 'No room selected',
      defaultRoomHint: 'Pick a zone on the Seat In page first',
      menuItems: {
        seat: { title: 'Seat In', caption: 'Choose a seat and start focus' },
        progress: { title: 'Progress', caption: 'Track focus sessions today' },
        settings: { title: 'Settings', caption: 'Adjust sound and appearance' },
      },
    },
    indexPage: {
      floorBadgePrefix: 'Floor ',
      headerTitleRunning: 'Deep Focus',
      headerTitleIdle: 'Pick a seat and get started.',
      displayNameDefaultPrefix: 'Reader-',
      pickSeatFirst: 'Please select a seat first',
      seatReserved: (name: string, seatId: string) => `${name} reserved ${seatId}`,
      resumeCandidateLabel: (time: string, remain: number) => `Resume ${time} (${remain}s left)`,
      documentTitleFocused: 'Focused',
      documentTitleIdle: 'Idle',
      notifyDurationLocked: 'Finish your current session before changing duration',
      notifyResumeExpired: 'Resume window expired, please pick a seat again',
      notifySeatTakenResume: 'That seat is taken, please pick another one',
      notifyPickSeatFirst: 'Please pick a seat before starting focus',
      notifyPickSeatToRestart: 'Please take a seat before restarting',
      notifyAutoRestarted: 'Session complete — next round started automatically',
      notifySessionComplete: 'Session complete — great work',
    },
    focusClockPanel: {
      remainingTimeLabel: 'Time Left',
      progressLabel: 'Progress',
      endFocusButton: 'End Focus',
      startFocusButton: 'Start Focus',
      restartButton: 'Restart',
      resumeButton: 'Resume Previous Session',
      showAdvancedButton: 'Show Advanced Settings',
      hideAdvancedButton: 'Hide Advanced Settings',
      focusDurationLabel: 'Focus Duration',
      minutesSuffix: 'min',
      resetTimeButton: 'Reset Timer',
      autoRestartLabel: 'Auto-restart on finish',
      displayNameLabel: 'Display Name',
      displayNamePlaceholder: 'Enter your display name',
      editButton: 'Edit',
      saveButton: 'Save',
    },
    ambientAudioPlayer: {
      audioSettingsTitle: 'Sound Settings',
      followFocusLabel: 'Auto-play with focus session',
      loopLabel: 'Loop playback',
      autoplayOnLoadLabel: 'Autoplay on page load',
      defaultTrackLabel: 'Default track',
    },
    seatGrid: {
      syncingFloor: (floor: number) => `Syncing floor ${floor}...`,
    },
    floorTabs: {
      floorLabel: (floor: number) => `F${floor}`,
    },
    progressPage: {
      title: "Today's Progress",
      subtitle: "Track how many sessions you've completed and how long you've focused today.",
      completedSessionsLabel: 'Completed Sessions',
      completedSessionsHint: 'Each completed 25-min round adds +1',
      focusedMinutesLabel: 'Total Minutes',
      focusedMinutesHint: 'Accumulated per-second, closely tracks real focus time',
      focusedHoursLabel: 'Total Hours',
      focusedHoursHint: (hours: string) => `You've focused ${hours} hours today`,
      last7DaysTitle: 'Last 7 Days',
      streakLabel: (days: number) => `${days}-day streak`,
      explanationTitle: 'Notes',
      explanationItems: [
        'Completed timers automatically count toward your session total.',
        'Total minutes accumulate by the second and persist across refreshes.',
        'Stats reset automatically at the start of a new day.',
      ],
      todayLabel: 'Today',
      weekdayLabels: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
      minutesUnit: ' min',
      listSeparator: ', ',
    },
    librarySocket: {
      newReaderJoined: (name: string) => `👋 ${name} just joined the library`,
      seatTakenBySomeoneWhileYouWereAway: '🛑 Oops! Someone just took this seat',
      seatTakenBySomeoneElse: '🛑 Too slow! Someone else grabbed this seat',
      connectionError: 'Connection error, attempting to reconnect',
      tokenFetchFailed: 'Could not get a secure connection token, please try again later',
    },
  },
} as const;

function persistLocale() {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(APP_LOCALE_KEY, locale.value);
}

function setLocale(next: LocaleKey) {
  locale.value = next;
  persistLocale();
}

function toggleLocale() {
  setLocale(locale.value === 'zh-TW' ? 'en-US' : 'zh-TW');
}

const t = computed(() => translations[locale.value]);

/**
 * Shared app-wide locale. `locale`/`t` are a module-scoped singleton (not a
 * per-call factory) so every component reads and drives the same language
 * switch — mirrors the localStorage-backed toggle that used to live only in
 * MainLayout.vue.
 */
export function useLocale() {
  return { locale, t, setLocale, toggleLocale };
}
