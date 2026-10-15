<template>
  <div class="relative min-h-[calc(100vh-80px)] px-3 py-3 pb-36 sm:px-4 sm:py-3 sm:pb-28">
    <div class="relative z-10 mx-auto max-w-[1500px]">
      <!-- 地圖佔滿整個寬度；番茄鐘和音樂收進底部的工具列 -->
      <main class="space-y-3">
        <header class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <div
              class="font-pixel shrink-0 rounded-[3px] border-2 border-[color:var(--px-ink)] bg-[color:var(--px-accent)] px-2 py-0.5 text-[11px] font-bold uppercase text-[#3b2a20]"
            >
              {{ t.indexPage.floorBadgePrefix }}{{ currentFloor }}
            </div>
            <h3 class="truncate !text-sm !leading-tight font-black !tracking-tight text-slate-900 dark:!text-white sm:!text-base">
              {{ store.isRunning ? t.indexPage.headerTitleRunning : t.indexPage.headerTitleIdle }}
            </h3>
            <p class="hide-below-sm truncate text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:!text-white/55">
              {{ librarySocket.currentZone.value?.name }} · {{ librarySocket.currentZone.value?.description }}
            </p>
            <button
              type="button"
              class="pixel-btn h-7 shrink-0 whitespace-nowrap px-2 text-[11px]"
              :title="t.indexPage.shareLocationHint"
              @click="shareMyLocation"
            >
              📍 {{ t.indexPage.shareLocation }}
            </button>
          </div>

          <FloorTabs
            :floors="floorTabItems"
            :current-floor="currentFloor"
            @update:current-floor="currentFloor = $event"
          />
        </header>

        <section class="pixel-panel relative p-2 sm:p-3">
          <ZoneTabs
            :zones="zoneTabItems"
            :active-zone-id="activeZoneId"
            @update:active-zone-id="activeZoneId = $event"
          />

          <!-- 地圖全螢幕：外層蓋滿畫面，裡層手機直拿時轉 90 度（sceneFullscreen.ts） -->
          <!-- 全螢幕時搬到 body 底下，才蓋得過上面的選單跟底部工具列（元件不會重建） -->
          <Teleport to="body" :disabled="!sceneFullscreen">
          <div ref="sceneShellRef" class="scene-shell" :class="{ 'scene-shell--fs': sceneFullscreen }">
          <div ref="sceneRotorRef" class="scene-rotor" :class="{ 'scene-rotor--rotated': sceneRotated, 'scene-rotor--bar-gap': sceneNeedsBarGap }">
          <button
            v-if="useCanvasScene"
            type="button"
            class="absolute left-2 top-2 z-20 !flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-white shadow-lg ring-1 ring-white/15 transition hover:bg-slate-800"
            :aria-label="sceneFullscreen ? t.indexPage.exitFullscreen : t.indexPage.fullscreen"
            :title="sceneFullscreen ? t.indexPage.exitFullscreen : t.indexPage.fullscreen"
            @click="toggleSceneFullscreen"
          >
            <q-icon :name="sceneFullscreen ? 'fullscreen_exit' : 'fullscreen'" size="20px" />
          </button>
          <F1Scene
            v-if="useCanvasScene && sceneLocation === 'f1'"
            ref="f1SceneRef"
            :seats="currentSeats.slice(F1_SEAT_START, F1_SEAT_START + F1_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            @select="selectSeat"
            @leave="sceneLocation = 'library'"
            @end-focus="endFocusToLeave"
          />
          <RiverParkScene
            v-else-if="useCanvasScene && sceneLocation === 'park'"
            ref="parkSceneRef"
            :seats="currentSeats.slice(PARK_SEAT_START, PARK_SEAT_START + PARK_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            @select="selectSeat"
            @leave="sceneLocation = 'library'"
            @end-focus="endFocusToLeave"
          />
          <SeatScenePixel
            v-else-if="useCanvasScene"
            ref="pixelSceneRef"
            :seats="currentSeats"
            :selected-seat-id="selectedSeatId"
            :is-shake="isShake"
            :is-loading="isLoading"
            :current-floor="currentFloor"
            :floors="floorTabItems.map((f) => f.floor)"
            :zone-name="librarySocket.currentZone.value?.name ?? ''"
            :zones="zoneTabItems.map((z) => ({ id: z.id, name: z.name }))"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            :remote-emote="librarySocket.lastEmote.value"
            :remote-players="librarySocket.remotePlayers.value"
            :peer-joined-at="librarySocket.peerJoinedAt.value"
            :raining="audio.isAudioPlaying.value && audio.selectedAudioTrack.value === 'rain'"
            @select="selectSeat"
            @emote="librarySocket.sendEmote"
            @position="librarySocket.sendPosition"
            @change-floor="currentFloor = $event"
            @change-zone="activeZoneId = $event"
            @go-f1="sceneLocation = 'f1'"
            @go-park="sceneLocation = 'park'"
            @open-tv="audioPlayerRef?.openYouTube()"
            @end-focus="endFocusToLeave"
            @area="sceneArea = $event"
            @webgl-failed="useCanvasScene = false"
          />
          <SeatGrid
            v-else
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
          </div>
          </div>
          </Teleport>
        </section>
      </main>
    </div>
  </div>

  <div
    class="fixed inset-x-1 bottom-1 z-50 sm:inset-x-auto sm:bottom-3 sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-1.5rem)] sm:-translate-x-1/2"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
  >
    <!-- 全螢幕時計時、音樂搬進地圖裡（跟著一起轉），可以收成一顆小按鈕；YouTube 播放器不搬（iframe 搬了會重新載入） -->
    <Teleport :to="sceneRotorRef ?? 'body'" :disabled="!sceneFullscreen">
    <div :class="{ 'fs-dock': sceneFullscreen }">
    <button
      v-if="sceneFullscreen"
      type="button"
      class="pixel-btn fs-dock__toggle h-8 px-3 text-xs"
      :aria-expanded="!dockCollapsed"
      @click="dockCollapsed = !dockCollapsed"
    >
      <template v-if="dockCollapsed">⏱ {{ formattedTime }} <q-icon name="expand_less" size="16px" /></template>
      <template v-else><q-icon name="expand_more" size="16px" /> {{ t.indexPage.collapseDock }}</template>
    </button>
    <div v-show="!sceneFullscreen || !dockCollapsed" class="pixel-panel flex flex-col !flex-nowrap gap-2 p-2 sm:flex-row sm:items-center sm:gap-3 sm:px-3">
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
        :group-focus-available="true"
        :group-focus="playerPrefs.groupFocus"
        :group-status="groupStatus"
        @toggle-focus="toggleFocus"
        @restart-focus-timer="restartFocusTimer"
        @resume-previous-focus="resumePreviousFocus"
        @reset-focus-timer="resetFocusTimer"
        @select-focus-duration="handleFocusDurationSelect"
        @update:auto-restart-on-finish="autoRestartOnFinish = $event"
        @apply-display-name="applyDisplayName"
        @update:group-focus="playerPrefs.groupFocus = $event"
        :notifications="playerPrefs.notifications"
        @update:notifications="handleNotificationsToggle"
      />
      <div class="hide-below-sm h-10 w-[2px] bg-[color:var(--px-ink)] opacity-30"></div>
      <AmbientAudioPlayer ref="audioPlayerRef" :audio="audio" />
    </div>
    </div>
    </Teleport>
    <YouTubeTv :audio="audio" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { usePomodoroStore } from 'src/stores/pomodoro';
import { useQuasar } from 'quasar';
import { useAmbientAudio, type SoundscapeKind } from 'src/pages/index/composables/useAmbientAudio';
import AmbientAudioPlayer from 'src/pages/index/components/AmbientAudioPlayer.vue';
import YouTubeTv from 'src/pages/index/components/YouTubeTv.vue';
import RiverParkScene from 'src/pages/index/components/RiverParkScene.vue';
import { buildShareLink, takeSharedLocation } from 'src/pages/index/shareLocation';
import FloorTabs, { type FloorTabItem } from 'src/pages/index/components/FloorTabs.vue';
import ZoneTabs, { type ZoneTabItem } from 'src/pages/index/components/ZoneTabs.vue';
import { enterSceneFullscreen, exitSceneFullscreen, sceneFullscreen, sceneNeedsBarGap, sceneRotated } from 'src/pages/index/composables/sceneFullscreen';
import SeatScenePixel from 'src/pages/index/components/SeatScenePixel.vue';
import F1Scene from 'src/pages/index/components/F1Scene.vue';
import { F1_SEAT_COUNT, F1_SEAT_START, LIBRARY_SEATS, PARK_SEAT_COUNT, PARK_SEAT_START, SEATS_PER_ZONE, type Area } from 'src/pages/index/pixel/pixelMap';
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
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { GROUP_FOCUS_S, groupPhaseAt } from 'src/composables/groupFocus';
import { requestNotifyPermission, sendFocusNotification } from 'src/composables/focusNotify';
const $q = useQuasar();
const { t, locale } = useLocale();
const playerPrefs = usePlayerPrefs();

const store = usePomodoroStore();
const DEFAULT_ZONE_CAPACITY = SEATS_PER_ZONE;

// --- 狀態控制 ---
// 進站時如果本地記得上一次選的座位，樓層/分區直接從那裡帶入，這樣
// onMounted 的第一次 reconnectRoomSession 抓的就是正確的房間快照，不用
// 再多一次樓層切換。`loadLastSeat` 是下面定義的 function declaration，
// 因為會 hoist 所以這裡可以先用。
// 最後所在的樓層／分區優先：走樓梯去別層逛、沒坐下就關掉，下次也回到那一層
// （這兩個 key 要宣告在這裡：下面馬上就要讀，宣告在後面的話讀的時候會出錯、被 try/catch 吃掉，等於永遠讀不到）
const LAST_SEAT_KEY = 'focus_island_last_seat_v1';
const LAST_LOCATION_KEY = 'focus_island_last_location_v1';
// 朋友分享的位置連結：直接到那一層、那一區、那張地圖，站在他旁邊（圖書館一帶的話把「上次站的位置」改成他旁邊，場景載入時就會站過去）
const sharedLocation = takeSharedLocation();
if (sharedLocation?.scene === 'library') {
  try {
    localStorage.setItem(
      'focus_island_player_position_v1',
      JSON.stringify({ room: `${sharedLocation.floor}-${sharedLocation.zoneId}`, x: sharedLocation.x + 1, y: sharedLocation.y, facing: 'left', seated: false }),
    );
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}
const initialLastSeat = loadLastSeat();
const initialLocation = loadLastLocation();
// 從分享連結進來的樓層／分區要馬上記住，不然重新整理會回到更早記的那一層
if (sharedLocation) saveLastLocation(sharedLocation.floor, sharedLocation.zoneId);
const currentFloor = ref(sharedLocation?.floor ?? initialLocation?.floor ?? initialLastSeat?.floor ?? 2);
const activeZoneId = ref(sharedLocation?.zoneId ?? initialLocation?.zoneId ?? initialLastSeat?.zoneId ?? 'A');
const isLoading = ref(false);
const selectedSeatId = ref<string | null>(null);
const isShake = ref(false);
// WebGL 不可用（或建立 renderer 失敗）時退回 2D 座位格子
const useCanvasScene = ref(true);
const sceneShellRef = ref<HTMLElement | null>(null);
const sceneRotorRef = ref<HTMLElement | null>(null);
// 全螢幕時底部的計時／音樂預設收起來，點一下展開
const dockCollapsed = ref(true);
function toggleSceneFullscreen() {
  if (sceneFullscreen.value) void exitSceneFullscreen();
  else if (sceneShellRef.value) void enterSceneFullscreen(sceneShellRef.value);
}
const isSwitching = ref(false);

// 很早的版本存的是「使用者_123」這種含中文的 ID，後端只收英數、底線、減號（拿不到連線權杖）：不合格就換一個新的
const storedUserId = localStorage.getItem('lib_uid');
const userId = ref(storedUserId && /^[A-Za-z0-9_-]{1,64}$/.test(storedUserId) ? storedUserId : createRandomId('user'));
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

// --- 最後所在的樓層與分區（不管有沒有坐下，換層／換區就記） ---

type LastLocationPayload = {
  floor: number;
  zoneId: string;
};

function loadLastLocation(): LastLocationPayload | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastLocationPayload>;
    const floor = Number(parsed.floor);
    const zoneId = String(parsed.zoneId || '');
    if (!Number.isFinite(floor) || floor <= 0 || !zoneId) return null;
    return { floor, zoneId };
  } catch {
    return null;
  }
}

function saveLastLocation(floor: number, zoneId: string) {
  try {
    const payload: LastLocationPayload = { floor, zoneId };
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(payload));
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
  toggleFocus('auto');
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

// 打開通知時順便要權限（一定要在點擊當下要）；被拒絕就關回去
async function handleNotificationsToggle(on: boolean) {
  if (!on) {
    playerPrefs.value.notifications = false;
    return;
  }
  const granted = await requestNotifyPermission();
  playerPrefs.value.notifications = granted;
  if (!granted) {
    $q.notify({ message: t.value.focusClockPanel.notifyDenied, color: 'warning', icon: 'notifications_off', position: 'top', timeout: 3000 });
  }
}

// 場景在哪：圖書館那張大地圖，或從 F1 站過去的 F1 賽車場（獨立地圖）
const sceneLocation = ref<'library' | 'f1' | 'park'>(sharedLocation?.scene ?? 'library');
// 人在大地圖的哪一區，決定場景環境音（海浪、車流、夜市人聲…）
const sceneArea = ref<Area>('library');
const SOUNDSCAPES: Record<Area, SoundscapeKind | null> = { library: null, beach: 'beach', taipei101: 'city', zoo: 'zoo', nightmarket: 'market' };
watch(
  [sceneLocation, sceneArea, () => useCanvasScene.value],
  ([location, , canvas], [previousLocation]) => {
    // 從 F1 回來時場景會重建，它只在區域跟預設不同時才回報，所以先歸零
    if (location === 'library' && previousLocation !== 'library') sceneArea.value = 'library';
    audio.setSoundscape(!canvas || location === 'park' ? null : location === 'f1' ? 'f1' : SOUNDSCAPES[sceneArea.value]);
  },
);
// 開始專注就回到圖書館的位子上
watch(
  () => store.isRunning,
  (running) => {
    if (running) sceneLocation.value = isF1Seat(selectedSeatId.value) ? 'f1' : isParkSeat(selectedSeatId.value) ? 'park' : 'library';
  },
);

// 座位編號落在 F1 那段的就是 F1 賽車場的看台座位
function isF1Seat(seatId: string | null): boolean {
  const n = Number(seatId?.split('-').pop());
  return Number.isFinite(n) && n > F1_SEAT_START && n <= F1_SEAT_START + F1_SEAT_COUNT;
}

// 座位編號落在最後那段的是環河公園的座位
function isParkSeat(seatId: string | null): boolean {
  const n = Number(seatId?.split('-').pop());
  return Number.isFinite(n) && n > PARK_SEAT_START && n <= PARK_SEAT_START + PARK_SEAT_COUNT;
}

// 上次坐的是 F1 看台／環河公園：一進來就回到那裡坐好
watch(
  () => selectedSeatId.value,
  (id) => {
    if (isF1Seat(id)) sceneLocation.value = 'f1';
    else if (isParkSeat(id)) sceneLocation.value = 'park';
  },
);

// ── 一起專注：每個整點、半點開始 25 分鐘，接著休息 5 分鐘 ──
const groupNow = ref(new Date());
const groupPhase = computed(() => groupPhaseAt(groupNow.value));
// 使用者在這一輪自己按了結束：這一輪就不再自動幫他開始
let groupSkippedRound = '';
let groupTimer: number | undefined;

const groupFocusCount = computed(
  () => librarySocket.readers.value.filter((r) => r.state === '專注').length + (store.isRunning ? 1 : 0),
);

const groupStatus = computed(() => {
  if (!playerPrefs.value.groupFocus) return '';
  const phase = groupPhase.value;
  const time = (d: Date) => d.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' });
  return phase.phase === 'focus'
    ? t.value.focusClockPanel.groupFocusing(groupFocusCount.value, time(new Date(phase.nextStart.getTime() - 5 * 60 * 1000)))
    : t.value.focusClockPanel.groupBreak(formatTimeHelper(phase.secondsLeft), time(phase.nextStart));
});

function tickGroupFocus() {
  groupNow.value = new Date();
  if (!playerPrefs.value.groupFocus || store.isRunning || !selectedSeatId.value) return;
  const phase = groupPhase.value;
  const round = phase.nextStart.toISOString();
  // 剩不到一分鐘就不加入了，等下一輪
  if (phase.phase !== 'focus' || phase.secondsLeft < 60 || groupSkippedRound === round) return;
  store.alignTimer(GROUP_FOCUS_S, phase.secondsLeft);
  toggleFocus('auto');
  if (playerPrefs.value.notifications) {
    sendFocusNotification(t.value.focusClockPanel.notifyGroupStartTitle, t.value.focusClockPanel.notifyGroupStartBody);
  }
}

watch(
  () => store.isRunning,
  (running, wasRunning) => {
    // 一起專注的一輪還沒結束就自己停掉：記下來，這一輪不再自動開始
    if (wasRunning && !running && store.timeLeft > 0 && playerPrefs.value.groupFocus) {
      groupSkippedRound = groupPhase.value.nextStart.toISOString();
    }
  },
);

watch(
  () => playerPrefs.value.groupFocus,
  (on) => {
    groupSkippedRound = '';
    if (on) tickGroupFocus();
  },
);

// 專注幣：每多專注 1 分鐘 +1（今天的分鐘數變多才算，換日歸零不會扣）
watch(
  () => store.todayFocusedMinutes,
  (now, before) => {
    // 只算番茄鐘跑著時多出來的那一分鐘（載入紀錄時數字跳上去不算）
    if (store.isRunning && now > before && now - before <= 2) playerPrefs.value.coins += now - before;
  },
);

// 今天專注的分鐘數變了：坐著的話重送一次，別人點你的名牌才看得到最新的數字
watch(
  () => store.todayFocusedMinutes,
  () => {
    if (selectedSeatId.value) librarySocket.sendMove(selectedSeatId.value, store.isRunning ? 'FOCUS' : 'READY');
  },
);

// 外觀或勿擾改了：坐著的話重送一次座位訊息，同房間的人才看得到
watch(
  () => [playerPrefs.value.hair, playerPrefs.value.shirt, playerPrefs.value.doNotDisturb],
  () => {
    if (selectedSeatId.value) librarySocket.sendMove(selectedSeatId.value, store.isRunning ? 'FOCUS' : 'READY');
  },
);

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
  claimSeat(id);

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

  // 一進來自動入座只挑圖書館裡的位子（戶外和 F1 的要自己走過去坐）
  const availableSeats = currentSeats.value.filter((seat, index) => seat.available && index < LIBRARY_SEATS);
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

function claimSeat(id: string) {
  selectedSeatId.value = id;
  saveLastSeat(id, currentFloor.value, activeZoneId.value);
  librarySocket.sendMove(id, 'READY');
}

// 在人現在所在的座位開始專注（場景決定是哪個；躺著就沿用原本保留的座位）
// seatForFocus 回傳座位 id、'lying'（躺著）或 null（不在座位上）
const pixelSceneRef = ref<SceneHandle | null>(null);
// 每張地圖都會回答：在哪個座位開始專注、我現在站在哪（分享位置用）
interface SceneHandle {
  seatForFocus: () => string | null;
  positionForShare: () => { x: number; y: number };
}
const f1SceneRef = ref<SceneHandle | null>(null);
const parkSceneRef = ref<SceneHandle | null>(null);
// 點牆上的電視時打開音樂設定裡的 YouTube 網址欄
const audioPlayerRef = ref<{ openYouTube: () => void } | null>(null);
// 回傳 false＝人不在座位上（走在路上、騎車、游泳），不該開始專注；2D 座位格子沒有「人在哪」，照舊用選好的座位
function claimSeatWhereIAm(): boolean {
  const scene = sceneLocation.value === 'f1' ? f1SceneRef.value : sceneLocation.value === 'park' ? parkSceneRef.value : pixelSceneRef.value;
  if (!scene) return true;
  const spot = scene.seatForFocus();
  if (spot === 'lying') return true;
  if (!spot) return false;
  if (spot !== selectedSeatId.value && !librarySocket.getMateAtSeat(spot)) claimSeat(spot);
  return true;
}

function notifyNotSeated() {
  $q.notify({ message: t.value.indexPage.notifyNotSeated, color: 'warning', icon: 'event_seat', timeout: 2200, position: 'top' });
}

// 分享我的位置：複製一條連結，朋友打開就會出現在我旁邊（手機用系統的分享選單）
async function shareMyLocation() {
  const scene = sceneLocation.value === 'f1' ? f1SceneRef.value : sceneLocation.value === 'park' ? parkSceneRef.value : pixelSceneRef.value;
  const at = scene?.positionForShare() ?? { x: 16, y: 5.2 };
  const link = buildShareLink({ floor: currentFloor.value, zoneId: activeZoneId.value, scene: sceneLocation.value, x: at.x, y: at.y, name: displayName.value });
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Focus Island', text: t.value.indexPage.shareText, url: link });
      return;
    } catch {
      // 使用者取消分享：退回複製連結
    }
  }
  try {
    await navigator.clipboard.writeText(link);
    $q.notify({ message: t.value.indexPage.shareCopied, color: 'positive', icon: 'link', timeout: 2600, position: 'top' });
  } catch {
    window.prompt(t.value.indexPage.shareManual, link);
  }
}

// --- 操作方法 ---
// how：'user' 是自己按的，人不在座位上就提示；'auto'（一起專注到點自動開始、接續上次的專注）照舊回到保留的座位
function toggleFocus(how: 'user' | 'auto' = 'user') {
  if (!store.isRunning && !claimSeatWhereIAm() && how === 'user') {
    notifyNotSeated();
    return;
  }
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

// 專注中離開座位：使用者在場景裡確認過了，結束這次專注
function endFocusToLeave() {
  if (store.isRunning) toggleFocus();
}

function resetFocusTimer() {
  store.resetTimer();
  if (audio.followFocusPlayback.value) {
    audio.stopPlayback();
  }
}

function restartFocusTimer() {
  if (!store.isRunning && !claimSeatWhereIAm()) {
    notifyNotSeated();
    return;
  }
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
  if (playerPrefs.value.notifications) {
    sendFocusNotification(
      t.value.indexPage.notifySessionComplete,
      playerPrefs.value.groupFocus ? t.value.focusClockPanel.notifyBreakBody : t.value.focusClockPanel.notifyDoneBody,
    );
  }

  // 一起專注時，下一輪由時鐘決定，不用自動重來
  if (autoRestartOnFinish.value && !playerPrefs.value.groupFocus) {
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

watch([currentFloor, activeZoneId], ([, zone], [, previousZone]) => {
  saveLastLocation(currentFloor.value, activeZoneId.value);
  // 只有真的換到別的分區才換成那一區的音樂；開站、換樓層都保留你自己選的
  if (zone !== previousZone) audio.playZoneTrack(zone);
  isLoading.value = true;
  void reconnectRoomSession();
});

watch(
  [() => store.timeLeft, () => t.value],
  ([newTime]) => {
    // 專注中分頁標題顯示倒數；沒在專注就是網站名稱
    document.title = store.isRunning ? `⏳ ${formatTime(newTime)} ${t.value.indexPage.documentTitleFocused}` : t.value.indexPage.documentTitleIdle;
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
  if (sharedLocation) {
    $q.notify({
      message: sharedLocation.name ? t.value.indexPage.arrivedNear(sharedLocation.name) : t.value.indexPage.arrivedGeneric,
      color: 'primary',
      icon: 'place',
      timeout: 3200,
      position: 'top',
    });
  }
  groupTimer = window.setInterval(tickGroupFocus, 1000);
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
  window.clearInterval(groupTimer);
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
.scene-shell,
.scene-rotor {
  position: relative;
}
/* 全螢幕：蓋滿畫面（蓋過 Quasar 的 header 2000；對話框 6000、通知 9500 還是在上面） */
.scene-shell--fs {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: #1b1d26;
}
.scene-shell--fs .scene-rotor {
  position: absolute;
  inset: 0;
}
/* 手機直拿又鎖不了方向：整塊轉 90 度（順時針），手機往左轉就是正的 */
.scene-shell--fs .scene-rotor--rotated {
  inset: auto;
  top: 0;
  left: 100%;
  width: 100dvh;
  height: 100dvw;
  transform-origin: top left;
  transform: rotate(90deg);
}
/* 讓出 Safari 浮在最下面的網址列（只有直拿、地圖轉過來時；它在地圖的右邊） */
.scene-shell--fs .scene-rotor--rotated.scene-rotor--bar-gap {
  width: calc(100dvh - 72px);
}
.scene-shell--fs .scene-rotor > :deep(div:not(.fs-dock)),
.scene-shell--fs :deep(.scene-box) {
  height: 100% !important;
  min-height: 0 !important;
}
.fs-dock {
  position: absolute;
  left: 50%;
  bottom: 8px;
  z-index: 30;
  transform: translateX(-50%);
  width: max-content;
  max-width: calc(100% - 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.fs-dock__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
/* 地圖下面那行操作說明全螢幕時不用（會露在 Safari 網址列那條） */
.scene-shell--fs :deep(.scene-box + p) {
  display: none;
}
.scene-shell--fs :deep(.scene-box) {
  border-radius: 0;
  touch-action: none !important;
}
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
