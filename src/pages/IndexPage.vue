<template>
  <div class="relative min-h-[calc(100vh-80px)] px-3 py-3 pb-24 sm:px-6 sm:py-4 sm:pb-40 lg:py-8">
    <div class="relative z-10 mx-auto max-w-7xl">
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-12 sm:gap-6">
        <main class="order-2 space-y-4 lg:order-none lg:col-span-8 sm:space-y-6">
          <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="rounded-md bg-amber-400 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-950 shadow-lg shadow-amber-400/20"
                >
                  {{ t.indexPage.floorBadgePrefix }}{{ currentFloor }}
                </div>
                <div class="h-1 w-1 rounded-full bg-slate-200 dark:!bg-white/20"></div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:!text-white/55">
                  {{ librarySocket.currentZone.value?.name }} · {{ librarySocket.currentZone.value?.description }}
                </p>
              </div>
              <h3 class="text-[1.6rem] font-black tracking-tight text-slate-900 dark:!text-white sm:text-4xl">
                {{ store.isRunning ? t.indexPage.headerTitleRunning : t.indexPage.headerTitleIdle }}
              </h3>
            </div>

            <FloorTabs
              :floors="floorTabItems"
              :current-floor="currentFloor"
              @update:current-floor="currentFloor = $event"
            />
          </header>

          <section class="relative min-h-[440px] rounded-[32px] border border-slate-200 dark:!border-white/10 bg-white dark:!bg-slate-900/40 p-3 shadow-2xl backdrop-blur-md sm:min-h-[550px] sm:rounded-[40px] sm:p-10">
            <ZoneTabs
              :zones="zoneTabItems"
              :active-zone-id="activeZoneId"
              @update:active-zone-id="activeZoneId = $event"
            />

            <SeatGrid
              :seats="currentSeats"
              :selected-seat-id="selectedSeatId"
              :is-shake="isShake"
              :is-loading="isLoading"
              :current-floor="currentFloor"
              :disabled="store.isRunning"
              :seat-button-class="seatButtonClass"
              :get-mate-at-seat="librarySocket.getMateAtSeat"
              @select="selectSeat"
            />
          </section>
        </main>

        <aside class="order-1 space-y-4 lg:order-none lg:col-span-4 sm:space-y-6">
          <FocusClockPanel
            :is-running="store.isRunning"
            :base-duration="store.baseDuration"
            :time-left="store.timeLeft"
            :formatted-time="formattedTime"
            :has-resume-candidate="!!resumeCandidate"
            :resume-candidate-label="resumeCandidateLabel"
            :selected-seat-label="selectedSeatLabel"
            :focus-duration-options="focusDurationOptions"
            :selected-focus-duration-minutes="selectedFocusDurationMinutes"
            :auto-restart-on-finish="autoRestartOnFinish"
            :display-name="displayName"
            @toggle-focus="toggleFocus"
            @restart-focus-timer="restartFocusTimer"
            @resume-previous-focus="resumePreviousFocus"
            @reset-focus-timer="resetFocusTimer"
            @select-focus-duration="handleFocusDurationSelect"
            @update:auto-restart-on-finish="autoRestartOnFinish = $event"
            @apply-display-name="applyDisplayName"
          />
        </aside>
      </div>
    </div>
  </div>

  <AmbientAudioPlayer :audio="audio" />
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { usePomodoroStore } from 'src/stores/pomodoro';
import { useQuasar } from 'quasar';
import { useAmbientAudio } from 'src/pages/index/composables/useAmbientAudio';
import AmbientAudioPlayer from 'src/pages/index/components/AmbientAudioPlayer.vue';
import FloorTabs, { type FloorTabItem } from 'src/pages/index/components/FloorTabs.vue';
import ZoneTabs, { type ZoneTabItem } from 'src/pages/index/components/ZoneTabs.vue';
import SeatGrid, { type Seat } from 'src/pages/index/components/SeatGrid.vue';
import FocusClockPanel from 'src/pages/index/components/FocusClockPanel.vue';
import { useLibrarySocket, buildSeatId } from 'src/pages/index/composables/useLibrarySocket';
import {
  getHeatColor as getHeatColorHelper,
  getZoneHeatTextClass as getZoneHeatTextClassHelper,
  getFloorLoadLevel as getFloorLoadLevelHelper,
  getFloorLoadLabelClass as getFloorLoadLabelClassHelper,
  formatTime as formatTimeHelper,
} from 'src/pages/index/functions/uiHelpers';
import { useLocale } from 'src/composables/useLocale';
const $q = useQuasar();
const { t } = useLocale();

const store = usePomodoroStore();
const DEFAULT_ZONE_CAPACITY = 15;

// --- 狀態控制 ---
// 進站時如果本地記得上一次選的座位，樓層/分區直接從那裡帶入，這樣
// onMounted 的第一次 reconnectRoomSession 抓的就是正確的房間快照，不用
// 再多一次樓層切換。`loadLastSeat` 是下面定義的 function declaration，
// 因為會 hoist 所以這裡可以先用。
const initialLastSeat = loadLastSeat();
const currentFloor = ref(initialLastSeat?.floor ?? 2);
const activeZoneId = ref(initialLastSeat?.zoneId ?? 'A');
const isLoading = ref(false);
const selectedSeatId = ref<string | null>(null);
const isShake = ref(false);
const isSwitching = ref(false);

const userId = ref(localStorage.getItem('lib_uid') || createRandomId('user'));
localStorage.setItem('lib_uid', userId.value);

const displayName = ref(
  localStorage.getItem('lib_display_name') || `${t.value.indexPage.displayNameDefaultPrefix}${userId.value.slice(-4)}`,
);

// --- 背景音樂 ---
const audio = useAmbientAudio(() => store.isRunning);

const autoRestartOnFinish = ref(false);
const focusDurationOptions = [15, 25, 50] as const;
type FocusDurationOption = (typeof focusDurationOptions)[number];

const selectedFocusDurationMinutes = computed(() => Math.round(store.baseDuration / 60));

function handleFocusDurationSelect(minutes: number) {
  if (!focusDurationOptions.includes(minutes as FocusDurationOption)) return;

  if (store.isRunning) {
    $q.notify({
      message: t.value.indexPage.notifyDurationLocked,
      color: 'warning',
      icon: 'timer_off',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  if (selectedFocusDurationMinutes.value === minutes) return;
  clearResumeCandidate();
  store.setDuration(minutes);
  saveFocusPreferences();
}

const FOCUS_PREFS_KEY = 'focus_island_focus_prefs_v1';
const CURRENT_ROOM_INFO_KEY = 'focus_island_current_room_info_v1';

// --- 上次選的座位（跨次造訪記住座位偏好） ---
const LAST_SEAT_KEY = 'focus_island_last_seat_v1';

type LastSeatPayload = {
  seatId: string;
  floor: number;
  zoneId: string;
};

function loadLastSeat(): LastSeatPayload | null {
  try {
    const raw = localStorage.getItem(LAST_SEAT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LastSeatPayload>;
    const floor = Number(parsed.floor);
    const zoneId = String(parsed.zoneId || '');
    const seatId = String(parsed.seatId || '');

    if (!Number.isFinite(floor) || floor <= 0 || !zoneId || !seatId) return null;

    return { floor, zoneId, seatId };
  } catch {
    return null;
  }
}

function saveLastSeat(seatId: string, floor: number, zoneId: string) {
  try {
    const payload: LastSeatPayload = { seatId, floor, zoneId };
    localStorage.setItem(LAST_SEAT_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

// --- 入座狀態 flag ---
const IS_SEATED_FLAG_KEY = 'focus_island_is_seated_v1';
const TAB_ID_SESSION_KEY = 'focus_island_tab_id_v1';
const RESUME_CANDIDATE_KEY = 'focus_island_resume_candidate_v1';
const RESUME_CANDIDATE_TTL_MS = 20_000;

type SeatedFlagPayload = {
  tabId: string;
  userId: string;
  updatedAt: number;
};

type ResumeCandidatePayload = {
  userId: string;
  seatId: string;
  floor: number;
  zoneId: string;
  timeLeft: number;
  baseDuration: number;
  expiresAt: number;
};

const resumeCandidate = ref<ResumeCandidatePayload | null>(null);

function createRandomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function getOrCreateTabId() {
  try {
    const existing = sessionStorage.getItem(TAB_ID_SESSION_KEY);
    if (existing) return existing;
    const next = createRandomId('tab');
    sessionStorage.setItem(TAB_ID_SESSION_KEY, next);
    return next;
  } catch {
    // fallback for restricted storage environments
    return createRandomId('tab_fallback');
  }
}

const currentTabId = getOrCreateTabId();

function parseSeatedPayload(raw: string | null): SeatedFlagPayload | null {
  if (!raw) return null;

  try {
    // backward compatibility: old payload used plain '1'/'0'
    if (raw === '1') {
      return {
        tabId: 'legacy',
        userId: userId.value,
        updatedAt: Date.now(),
      };
    }

    const parsed = JSON.parse(raw) as Partial<SeatedFlagPayload>;
    if (
      typeof parsed.tabId !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null;
    }
    return {
      tabId: parsed.tabId,
      userId: parsed.userId,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

function setSeatedFlag(value: boolean) {
  try {
    if (value) {
      const payload: SeatedFlagPayload = {
        tabId: currentTabId,
        userId: userId.value,
        updatedAt: Date.now(),
      };
      localStorage.setItem(IS_SEATED_FLAG_KEY, JSON.stringify(payload));
      return;
    }

    const existing = parseSeatedPayload(localStorage.getItem(IS_SEATED_FLAG_KEY));
    if (!existing || existing.tabId === currentTabId) {
      localStorage.removeItem(IS_SEATED_FLAG_KEY);
    }
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

function clearSeatedFlag() {
  try {
    const existing = parseSeatedPayload(localStorage.getItem(IS_SEATED_FLAG_KEY));
    if (!existing || existing.tabId === currentTabId) {
      localStorage.removeItem(IS_SEATED_FLAG_KEY);
    }
  } catch {
    // ignore
  }
}

function clearResumeCandidate() {
  resumeCandidate.value = null;
  try {
    localStorage.removeItem(RESUME_CANDIDATE_KEY);
  } catch {
    // ignore
  }
}

function saveResumeCandidate() {
  if (!store.isRunning || !selectedSeatId.value) return;

  const payload: ResumeCandidatePayload = {
    userId: userId.value,
    seatId: selectedSeatId.value,
    floor: currentFloor.value,
    zoneId: activeZoneId.value,
    timeLeft: Math.max(1, Math.floor(store.timeLeft)),
    baseDuration: Math.max(60, Math.floor(store.baseDuration)),
    expiresAt: Date.now() + RESUME_CANDIDATE_TTL_MS,
  };

  resumeCandidate.value = payload;
  try {
    localStorage.setItem(RESUME_CANDIDATE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function loadResumeCandidate() {
  try {
    const raw = localStorage.getItem(RESUME_CANDIDATE_KEY);
    if (!raw) {
      resumeCandidate.value = null;
      return;
    }

    const parsed = JSON.parse(raw) as Partial<ResumeCandidatePayload>;
    const normalized: ResumeCandidatePayload = {
      userId: String(parsed.userId || ''),
      seatId: String(parsed.seatId || ''),
      floor: Number(parsed.floor || 0),
      zoneId: String(parsed.zoneId || ''),
      timeLeft: Number(parsed.timeLeft || 0),
      baseDuration: Number(parsed.baseDuration || 0),
      expiresAt: Number(parsed.expiresAt || 0),
    };

    const isValid =
      normalized.userId === userId.value &&
      normalized.seatId.length > 0 &&
      Number.isFinite(normalized.floor) &&
      normalized.floor > 0 &&
      normalized.zoneId.length > 0 &&
      Number.isFinite(normalized.timeLeft) &&
      normalized.timeLeft > 0 &&
      Number.isFinite(normalized.baseDuration) &&
      normalized.baseDuration >= 60 &&
      Number.isFinite(normalized.expiresAt) &&
      normalized.expiresAt > Date.now();

    if (!isValid) {
      clearResumeCandidate();
      return;
    }

    resumeCandidate.value = normalized;
  } catch {
    clearResumeCandidate();
  }
}

const resumeCandidateLabel = computed(() => {
  const candidate = resumeCandidate.value;
  if (!candidate) return '';
  const remain = Math.max(1, Math.floor((candidate.expiresAt - Date.now()) / 1000));
  return t.value.indexPage.resumeCandidateLabel(formatTimeHelper(candidate.timeLeft), remain);
});

async function resumePreviousFocus() {
  const candidate = resumeCandidate.value;
  if (!candidate) return;

  if (candidate.expiresAt <= Date.now()) {
    clearResumeCandidate();
    $q.notify({
      message: t.value.indexPage.notifyResumeExpired,
      color: 'warning',
      icon: 'schedule',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  if (candidate.floor !== currentFloor.value || candidate.zoneId !== activeZoneId.value) {
    currentFloor.value = candidate.floor;
    activeZoneId.value = candidate.zoneId;
    await reconnectRoomSession();
  }

  if (librarySocket.getMateAtSeat(candidate.seatId)) {
    clearResumeCandidate();
    $q.notify({
      message: t.value.indexPage.notifySeatTakenResume,
      color: 'negative',
      icon: 'event_busy',
      timeout: 1800,
      position: 'top',
    });
    return;
  }

  selectedSeatId.value = candidate.seatId;
  store.baseDuration = Math.max(60, Math.floor(candidate.baseDuration));
  store.timeLeft = Math.min(store.baseDuration, Math.max(1, Math.floor(candidate.timeLeft)));

  clearResumeCandidate();
  toggleFocus();
}

// When other tabs update resume candidate, reload it locally.
// We intentionally no longer auto-stop the timer when other tabs change seat flags,
// to allow multiple tabs to run focus concurrently.
window.addEventListener('storage', (e: StorageEvent) => {
  try {
    if (e.key === RESUME_CANDIDATE_KEY) {
      loadResumeCandidate();
    }
  } catch {
    // ignore
  }
});

function isMobileDevice() {
  try {
    return /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
  } catch {
    return false;
  }
}

// 頁面卸載或隱藏時清除 flag，避免 stale lock（mobile 尤其要處理）
window.addEventListener('beforeunload', () => {
  try {
    if (store.isRunning) clearSeatedFlag();
  } catch {
    // ignore
  }
});

window.addEventListener('pagehide', () => {
  try {
    if (store.isRunning) clearSeatedFlag();
  } catch {
    // ignore
  }
});

window.addEventListener('visibilitychange', () => {
  try {
    if (document.visibilityState === 'hidden' && isMobileDevice()) {
      if (store.isRunning) clearSeatedFlag();
    }
  } catch {
    // ignore
  }
});

function syncCurrentRoomInfo() {
  const payload = {
    roomID: librarySocket.roomID.value,
    roomName: librarySocket.currentZone.value?.name || `Zone ${activeZoneId.value}`,
    zoneDescription: librarySocket.currentZone.value?.description || '',
  };

  localStorage.setItem(CURRENT_ROOM_INFO_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('focus-room-updated', { detail: payload }));
}

function onSeatStolen() {
  isShake.value = true;
  selectedSeatId.value = null;
  setTimeout(() => {
    isShake.value = false;
  }, 500);
}

function onSelfLeave() {
  try {
    clearSeatedFlag();
    if (store.isRunning) store.stopTimer();
  } catch {
    // ignore
  }
}

const librarySocket = useLibrarySocket({
  userId,
  sessionId: currentTabId,
  displayName,
  currentFloor,
  activeZoneId,
  selectedSeatId,
  isLoading,
  quasar: $q,
  onSelfLeave,
  onSeatStolen,
  debugSeatIdSync: import.meta.env.DEV,
});

// --- 核心邏輯：熱度顏色判斷 ---
function getHeatColor(percent: number) {
  return getHeatColorHelper(percent);
}

function getZoneHeatTextClass(occupancyStr: string) {
  return getZoneHeatTextClassHelper(occupancyStr);
}

const floorLoadLabels: Record<ReturnType<typeof getFloorLoadLevelHelper>, () => string> = {
  high: () => t.value.common.loadHigh,
  medium: () => t.value.common.loadMedium,
  low: () => t.value.common.loadLow,
};

const floorTabItems = computed<FloorTabItem[]>(() =>
  librarySocket.floorHeatData.value.map((f) => {
    const percent = librarySocket.getFloorLoadPercent(f);
    return {
      floor: f.floor,
      occupancy: f.occupancy,
      capacity: f.capacity,
      percent,
      heatClass: getHeatColor(percent),
      label: floorLoadLabels[getFloorLoadLevelHelper(percent)](),
      labelClass: getFloorLoadLabelClassHelper(percent, currentFloor.value === f.floor),
    };
  }),
);

const zoneTabItems = computed<ZoneTabItem[]>(() =>
  librarySocket.floorZones.value.map((zone) => ({
    id: zone.id,
    name: zone.name,
    occupancy: zone.occupancy,
    heatTextClass: getZoneHeatTextClass(zone.occupancy),
  })),
);

// --- 座位生成與同步模擬 ---
const currentSeats = computed(() => {
  const prefix = `${currentFloor.value}-${activeZoneId.value.toUpperCase()}`;
  const currentZoneConfig = librarySocket.floorZones.value.find((zone) => zone.id === activeZoneId.value);
  const seatCount = currentZoneConfig?.capacity || DEFAULT_ZONE_CAPACITY;
  return Array.from({ length: seatCount }, (_, i) => ({
    id: buildSeatId(currentFloor.value, activeZoneId.value, i + 1),
    icon: i % 3 === 0 ? '📚' : i % 3 === 1 ? '💻' : '✍️',
    available: (() => {
      const seatId = `${prefix}-${String(i + 1).padStart(2, '0')}`;
      const snapshot = librarySocket.seatSnapshotMap.value[seatId];
      const status = snapshot?.status ?? 'AVAILABLE';
      const isMySeat = snapshot?.userId === userId.value || selectedSeatId.value === seatId;
      return status === 'AVAILABLE' || isMySeat;
    })(),
  }));
});

function saveFocusPreferences() {
  localStorage.setItem(
    FOCUS_PREFS_KEY,
    JSON.stringify({
      autoRestartOnFinish: autoRestartOnFinish.value,
      focusDurationMinutes: selectedFocusDurationMinutes.value,
    }),
  );
}

function loadFocusPreferences() {
  const raw = localStorage.getItem(FOCUS_PREFS_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as {
      autoRestartOnFinish?: boolean;
      focusDurationMinutes?: number;
    };
    autoRestartOnFinish.value = parsed.autoRestartOnFinish ?? false;

    if (
      typeof parsed.focusDurationMinutes === 'number' &&
      focusDurationOptions.includes(parsed.focusDurationMinutes as FocusDurationOption)
    ) {
      store.setDuration(parsed.focusDurationMinutes);
    }
  } catch {
    // ignore invalid stored payload
  }
}

function applyDisplayName(name: string) {
  displayName.value = name;
  localStorage.setItem('lib_display_name', name);

  if (selectedSeatId.value) {
    // 只是改名字，不代表使用者離開了專注狀態 —— 之前這裡寫死 'READY'，
    // 專注中改名會讓其他人看到你「假離座」。
    librarySocket.sendMove(selectedSeatId.value, store.isRunning ? 'FOCUS' : 'READY');
  }
}

async function reconnectRoomSession() {
  syncCurrentRoomInfo();
  await librarySocket.reconnectRoomSession();
}

const formattedTime = computed(() => {
  const m = Math.floor(store.timeLeft / 60);
  const s = store.timeLeft % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const selectedSeatLabel = computed(() => {
  if (store.isRunning && selectedSeatId.value)
    return `${displayName.value} @ ${selectedSeatId.value}`;
  return selectedSeatId.value
    ? t.value.indexPage.seatReserved(displayName.value, selectedSeatId.value)
    : t.value.indexPage.pickSeatFirst;
});

function selectSeat(id: string) {
  // 如果正在切換中，直接 return
  if (librarySocket.getMateAtSeat(id) || store.isRunning || isSwitching.value) return;

  // 標記切換中
  isSwitching.value = true;
  selectedSeatId.value = id;
  saveLastSeat(id, currentFloor.value, activeZoneId.value);

  if (store.isRunning) {
    void audio.startPlayback();
  }

  librarySocket.sendMove(id, 'READY');

  // 設定 500ms 後有下一次點擊
  setTimeout(() => {
    isSwitching.value = false;
  }, 500);
}

// 進站時的座位分配：優先坐回上次選的位置；如果那個位置現在有別人坐著（或
// 這是第一次來、沒有上次紀錄），就從目前這個分區裡隨機挑一個空位。只在
// onMounted 執行一次，手動切換樓層/分區不會觸發（那時使用者是自己在瀏覽，
// 不該幫他亂選位置）。
function autoAssignSeatOnLoad() {
  if (selectedSeatId.value || store.isRunning) return;

  const availableSeats = currentSeats.value.filter((seat) => seat.available);
  if (availableSeats.length === 0) return;

  const lastSeatId = initialLastSeat?.seatId ?? null;
  const canResumeLastSeat =
    lastSeatId !== null && availableSeats.some((seat) => seat.id === lastSeatId);

  if (canResumeLastSeat && lastSeatId) {
    selectSeat(lastSeatId);
    return;
  }

  const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
  if (!randomSeat) return;

  selectSeat(randomSeat.id);
}

// --- 操作方法 ---
function toggleFocus() {
  if (!selectedSeatId.value && !store.isRunning) {
    $q.notify({
      message: t.value.indexPage.notifyPickSeatFirst,
      color: 'warning',
      icon: 'event_seat',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  // Allow multiple tabs to run focus concurrently. Previously we blocked
  // entering focus when another tab held the seated flag; that caused
  // cross-tab issues. We no longer enforce a single-tab lock here.

  if (store.isRunning) {
    store.stopTimer();
    setSeatedFlag(false);
    clearResumeCandidate();
    if (audio.followFocusPlayback.value) {
      audio.stopPlayback();
    }
  } else {
    clearResumeCandidate();
    store.startTimer();
    setSeatedFlag(true);
    if (audio.followFocusPlayback.value) {
      void audio.startPlayback();
    }
  }
}

function resetFocusTimer() {
  store.resetTimer();
  if (audio.followFocusPlayback.value) {
    audio.stopPlayback();
  }
}

function restartFocusTimer() {
  if (!selectedSeatId.value && !store.isRunning) {
    $q.notify({
      message: t.value.indexPage.notifyPickSeatToRestart,
      color: 'warning',
      icon: 'event_seat',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  store.resetTimer();
  store.startTimer();

  if (audio.followFocusPlayback.value) {
    void audio.startPlayback();
  }
}

function handleFocusFinished() {
  audio.stopPlayback();

  if (autoRestartOnFinish.value) {
    store.resetTimer();
    store.startTimer();

    if (audio.followFocusPlayback.value) {
      void audio.startPlayback();
    }

    $q.notify({
      message: t.value.indexPage.notifyAutoRestarted,
      color: 'amber-9',
      icon: 'autorenew',
      timeout: 2200,
      position: 'top',
      classes: 'font-black tracking-tighter',
    });
    return;
  }

  $q.notify({
    message: t.value.indexPage.notifySessionComplete,
    color: 'positive',
    icon: 'task_alt',
    timeout: 2600,
    position: 'top',
    classes: 'font-black tracking-tighter',
  });
}

function seatButtonClass(seat: Seat) {
  // 我選的位子 + 切換中狀態
  if (selectedSeatId.value === seat.id) {
    return [
      'border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-105 z-10',
      isSwitching.value ? 'animate-pulse cursor-wait opacity-70' : '', // 顯示等待狀態
    ].join(' ');
  }

  if (!seat.available) return 'opacity-10 grayscale cursor-not-allowed border-transparent';

  const otherMate = librarySocket.getMateAtSeat(seat.id);
  if (otherMate) return 'border-teal-500/30 bg-teal-500/5 cursor-default';

  return 'border-slate-200 dark:!border-white/5 bg-slate-100 dark:!bg-white/5 hover:border-slate-200 dark:hover:!border-white/20 hover:bg-slate-100 dark:hover:!bg-white/10';
}

function formatTime(seconds: number): string {
  return formatTimeHelper(seconds);
}

watch([currentFloor, activeZoneId], () => {
  isLoading.value = true;
  void reconnectRoomSession();
});

watch(
  [() => store.timeLeft, () => t.value],
  ([newTime]) => {
    const status = store.isRunning ? t.value.indexPage.documentTitleFocused : t.value.indexPage.documentTitleIdle;
    document.title = `${formatTime(newTime)} | ${status}`;
  },
  { immediate: true },
);

watch(
  () => store.isRunning,
  (isRunning, wasRunning) => {
    if (wasRunning && !isRunning && store.timeLeft <= 0) {
      handleFocusFinished();
    }
  },
);

watch(
  () => autoRestartOnFinish.value,
  () => {
    saveFocusPreferences();
  },
);

onMounted(() => {
  loadFocusPreferences();
  loadResumeCandidate();
  // 等第一次 reconnectRoomSession 把座位快照抓回來（seatSnapshotMap 才會有
  // 正確的佔用狀態）才能判斷上次的座位還在不在，所以自動選位接在它後面。
  void reconnectRoomSession().then(() => {
    autoAssignSeatOnLoad();
  });
  librarySocket.startFloorPollingTimer();
  document.addEventListener('visibilitychange', librarySocket.handleVisibilityChange);
});

let hasHandledPageLeaveCleanup = false;
function cleanupSessionOnPageLeave() {
  if (hasHandledPageLeaveCleanup) return;
  hasHandledPageLeaveCleanup = true;

  // 離開座位頁時，避免出現「已離座但計時仍在跑」
  saveResumeCandidate();
  if (store.isRunning) {
    store.stopTimer();
  }
  clearSeatedFlag();
  librarySocket.stopWebSocketConnection(true);
}

onBeforeRouteLeave(() => {
  cleanupSessionOnPageLeave();
});

onUnmounted(() => {
  cleanupSessionOnPageLeave();
  saveFocusPreferences();
  librarySocket.clearFloorPollingTimer();
  document.removeEventListener('visibilitychange', librarySocket.handleVisibilityChange);
});

watch(
  () => librarySocket.currentZone.value?.name,
  () => {
    syncCurrentRoomInfo();
  },
);

// --- Watchers & Lifecycle ---
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.animate-spin-slow {
  animation: spin 12s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.shake-error {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
