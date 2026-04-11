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
                  樓層 {{ currentFloor }}
                </div>
                <div class="h-1 w-1 rounded-full bg-white/20"></div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  {{ currentZone?.name }} · {{ currentZone?.description }}
                </p>
              </div>
              <h3 class="text-[1.6rem] font-black tracking-tight text-white sm:text-4xl">
                {{ store.isRunning ? '深度專注中' : '挑個好位子，入座。' }}
              </h3>
            </div>

            <nav
              class="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-1.5 backdrop-blur-xl no-scrollbar"
            >
              <button
                v-for="f in floorHeatData"
                :key="f.floor"
                @click="currentFloor = f.floor"
                class="group relative overflow-hidden rounded-xl px-4 py-3 transition-all duration-500"
                :class="
                  currentFloor === f.floor ? 'bg-white shadow-2xl scale-105' : 'hover:bg-white/5'
                "
              >
                <div
                  class="absolute bottom-0 left-0 w-full transition-all duration-1000 opacity-20"
                  :class="getHeatColor(getFloorLoadPercent(f))"
                  :style="{ height: `${getFloorLoadPercent(f)}%` }"
                ></div>

                <div class="relative z-10 flex flex-col items-center">
                  <span
                    class="text-xs font-black tracking-tighter"
                    :class="
                      currentFloor === f.floor
                        ? 'text-slate-900'
                        : 'text-white/30 group-hover:text-white/60'
                    "
                  >
                    {{ f.floor }}樓
                  </span>
                  <div
                    class="mt-1 h-1 w-1 rounded-full animate-pulse"
                    :class="getHeatColor(getFloorLoadPercent(f))"
                  ></div>
                  <span
                    class="mt-1 text-[8px] font-black tracking-tight"
                    :class="currentFloor === f.floor ? 'text-slate-700' : 'text-white/35'"
                  >
                    {{ f.occupancy }}/{{ f.capacity }}
                  </span>
                  <span
                    class="text-[7px] font-black tracking-[0.2em]"
                    :class="getFloorLoadLabelClass(f)"
                  >
                    {{ getFloorLoadLabel(f) }}
                  </span>
                </div>
              </button>
            </nav>
          </header>

          <section class="relative min-h-[440px] rounded-[32px] border border-white/10 bg-slate-900/40 p-3 shadow-2xl backdrop-blur-md sm:min-h-[550px] sm:rounded-[40px] sm:p-10">
            <div
              class="mb-6 flex items-center gap-4 overflow-x-auto border-b border-white/5 no-scrollbar sm:mb-10 sm:gap-6"
            >
              <button
                v-for="zone in floorZones"
                :key="zone.id"
                @click="activeZoneId = zone.id"
                class="group flex-shrink-0 pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative sm:pb-4"
                :class="
                  activeZoneId === zone.id ? 'text-amber-400' : 'text-white/20 hover:text-white/40'
                "
              >
                <div class="flex items-center gap-2" :class="getZoneHeatTextClass(zone.occupancy)">
                  {{ zone.name }}
                  <span
                    class="rounded-full border border-white/10 bg-white/5 px-1.5 py-0.5 text-[8px] group-hover:border-amber-400/30"
                  >
                    {{ zone.occupancy }}
                  </span>
                </div>
                <div
                  v-if="activeZoneId === zone.id"
                  class="absolute bottom-0 left-0 w-full h-1 bg-amber-400 rounded-full"
                ></div>
              </button>
            </div>

            <div
              class="relative grid grid-cols-3 gap-2.5 transition-all duration-500 sm:grid-cols-4 sm:gap-6 md:grid-cols-6"
              :class="{ 'shake-error': isShake, 'opacity-0 scale-95': isLoading }"
            >
              <div v-for="seat in currentSeats" :key="seat.id" class="relative">
                <button
                  :disabled="!seat.available || store.isRunning"
                  @click="selectSeat(seat.id)"
                  class="w-full aspect-square"
                  :class="seatButtonClass(seat)"
                >
                  <div v-if="selectedSeatId === seat.id" class="flex flex-col items-center">
                    <div class="relative">
                      <div
                        class="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-slate-800 border-2 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center justify-center text-xs sm:text-sm font-black"
                      >
                        我
                      </div>
                      <div
                        class="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-slate-900 bg-amber-400 shadow-lg"
                      ></div>
                    </div>
                    <span
                      class="absolute -bottom-6 text-[8px] font-black uppercase tracking-widest text-amber-400"
                      >我</span
                    >
                  </div>

                  <div v-else-if="getMateAtSeat(seat.id)" class="flex flex-col items-center">
                    <div class="relative">
                      <div
                        class="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-slate-800 border-2 border-teal-500/30 text-teal-100 flex items-center justify-center text-xs sm:text-sm font-black"
                      >
                        {{ getMateAtSeat(seat.id)?.displayName[0] }}
                      </div>
                      <div
                        class="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-slate-900 bg-teal-400 shadow-lg"
                      ></div>
                    </div>
                    <span
                      class="absolute -bottom-6 text-[8px] font-black uppercase tracking-widest text-white/40"
                    >
                      {{ getMateAtSeat(seat.id)?.displayName }}
                    </span>
                  </div>

                  <template v-else>
                    <span class="text-xl sm:text-2xl mb-1">{{ seat.icon }}</span>
                    <span class="text-[8px] font-black opacity-30 tracking-tighter">{{
                      seat.id
                    }}</span>
                  </template>
                </button>
              </div>
            </div>

            <div
              v-if="isLoading"
              class="absolute inset-x-0 bottom-0 top-24 flex items-center justify-center px-4 pointer-events-none sm:top-32 sm:px-10"
            >
              <div class="flex flex-col items-center gap-4">
                <div
                  class="h-12 w-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"
                ></div>
                <p class="text-amber-400/60 font-black text-[10px] tracking-[0.4em] uppercase">
                  同步樓層 {{ currentFloor }}...
                </p>
              </div>
            </div>
          </section>
        </main>

        <aside class="order-1 space-y-4 lg:order-none lg:col-span-4 sm:space-y-6">
          <div
            class="relative overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/55 p-3 shadow-2xl backdrop-blur-xl sm:rounded-[36px] sm:p-6"
          >
            <div
              class="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-300/10 blur-[92px]"
            ></div>
            <div
              class="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-cyan-300/10 blur-[88px]"
            ></div>

            <div class="relative z-10 space-y-4 sm:space-y-5">
              <div
                class="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-2"
              >
                <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                  Focus Clock
                </p>
                <span
                  class="rounded-full px-2 py-1 text-[9px] font-black tracking-[0.2em]"
                  :class="
                    store.isRunning
                      ? 'bg-emerald-300/20 text-emerald-200'
                      : 'bg-white/10 text-white/60'
                  "
                >
                  {{ store.isRunning ? 'RUNNING' : 'IDLE' }}
                </span>
              </div>

              <div
                class="rounded-3xl border border-white/10 bg-slate-900/70 px-3 py-3 shadow-[inset_0_0_40px_rgba(15,23,42,0.55)] sm:px-5 sm:py-5"
              >
                <div class="mb-3 flex items-end justify-between">
                  <p class="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300/80">
                    剩餘時間
                  </p>
                  <p class="text-[10px] font-black tracking-[0.14em] text-white/45">
                    Base {{ formatTime(store.baseDuration) }}
                  </p>
                </div>

                <div
                  class="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/80 via-slate-900/70 to-slate-950/80 px-3 py-5 text-center"
                >
                  <div class="text-[3rem] font-mono font-black leading-none tracking-tight text-amber-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-6xl">
                    {{ formattedTime }}
                  </div>
                </div>

                <div class="mt-3">
                  <div
                    class="mb-1.5 flex items-center justify-between text-[10px] font-black tracking-[0.12em] text-white/45"
                  >
                    <span>進度</span>
                    <span
                      >{{
                        Math.round(
                          ((store.baseDuration - store.timeLeft) /
                            Math.max(1, store.baseDuration)) *
                            100,
                        )
                      }}%</span
                    >
                  </div>
                  <div class="h-2 rounded-full bg-white/10">
                    <div
                      class="h-full rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 transition-all duration-500"
                      :style="{
                        width: `${Math.min(100, Math.max(0, ((store.baseDuration - store.timeLeft) / Math.max(1, store.baseDuration)) * 100))}%`,
                      }"
                    ></div>
                  </div>
                </div>
              </div>

              <div class="flex flex-col gap-y-3 space-y-[5px]">
                <button
                  @click="toggleFocus"
                  class="w-full rounded-2xl py-3.5 text-sm font-black tracking-[0.14em] shadow-2xl transition-all active:scale-[0.98]"
                  :class="
                    store.isRunning
                      ? 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-400'
                      : 'bg-white text-slate-900 shadow-white/20 hover:bg-amber-50'
                  "
                >
                  {{ store.isRunning ? '結束專注' : '入座' }}
                </button>

                <button
                  @click="restartFocusTimer"
                  class="w-full rounded-xl border border-amber-300/35 bg-amber-400/10 px-3 py-2.5 text-[11px] font-black tracking-[0.08em] text-amber-200 transition-all hover:border-amber-300/60 hover:bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-45"
                >
                  重新開始
                </button>

                <button
                  v-if="!store.isRunning && resumeCandidate"
                  @click="resumePreviousFocus"
                  class="w-full rounded-2xl border border-emerald-300/50 bg-emerald-400/10 px-3 py-2.5 text-[11px] font-black tracking-[0.08em] text-emerald-200 transition-all hover:border-emerald-300/70 hover:bg-emerald-400/20"
                >
                  繼續上一段專注
                  <span class="ml-1 text-emerald-100/80">{{ resumeCandidateLabel }}</span>
                </button>
              </div>

              <button
                type="button"
                @click="showAdvancedFocusControls = !showAdvancedFocusControls"
                class="w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-black tracking-[0.1em] text-white/75 transition-all hover:border-white/30 hover:bg-white/10"
              >
                {{ showAdvancedFocusControls ? '收合進階設定' : '展開進階設定' }}
              </button>

              <div
                v-if="showAdvancedFocusControls"
                class="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-3"
              >
                <div class="space-y-2 rounded-xl border border-white/10 bg-slate-900/35 p-3">
                  <p class="text-[10px] font-black uppercase tracking-[0.22em] text-white/45">
                    專注時長
                  </p>
                  <div class="grid grid-cols-3 gap-2">
                    <button
                      v-for="minutes in focusDurationOptions"
                      :key="minutes"
                      type="button"
                      @click="handleFocusDurationSelect(minutes)"
                      class="rounded-xl border px-2 py-2 text-[11px] font-black tracking-[0.08em] transition-all"
                      :class="
                        selectedFocusDurationMinutes === minutes
                          ? 'border-amber-300/70 bg-amber-400/20 text-amber-100'
                          : 'border-white/15 bg-slate-900/45 text-white/75 hover:border-white/30 hover:text-white'
                      "
                    >
                      {{ minutes }} 分鐘
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 gap-2">
                  <button
                    @click="resetFocusTimer"
                    :disabled="store.timeLeft === store.baseDuration && !store.isRunning"
                    class="rounded-xl border border-white/15 bg-slate-900/45 px-2.5 py-2 text-[11px] font-black tracking-[0.08em] text-white/85 transition-all hover:border-white/30 hover:bg-slate-900/65 disabled:cursor-not-allowed disabled:opacity-45"
                  >
                    重置時間
                  </button>
                </div>

                <label
                  class="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900/35 px-3 py-2 text-[11px] text-white/75"
                >
                  <span class="font-bold tracking-[0.06em]">結束自動重來</span>
                  <input v-model="autoRestartOnFinish" type="checkbox" class="accent-amber-400" />
                </label>

                <div class="rounded-xl border border-white/10 bg-slate-900/35 p-3 text-left">
                  <label
                    for="display-name"
                    class="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-white/50"
                  >
                    顯示名稱
                  </label>
                  <input
                    id="display-name"
                    v-model="displayNameInput"
                    type="text"
                    maxlength="20"
                    :disabled="!isEditingDisplayName"
                    class="w-full rounded-xl border border-white/15 bg-slate-950/70 px-3 py-2 text-sm font-black text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/60 disabled:cursor-not-allowed disabled:opacity-60"
                    placeholder="輸入你想顯示的名稱"
                    @keyup.enter="applyDisplayName"
                  />
                  <div class="mt-3 flex justify-end">
                    <button
                      v-if="!isEditingDisplayName"
                      class="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:border-white/40 hover:text-white"
                      @click="startEditDisplayName"
                    >
                      編輯
                    </button>
                    <button
                      v-else
                      class="rounded-lg bg-amber-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-950 hover:bg-amber-300"
                      @click="applyDisplayName"
                    >
                      儲存
                    </button>
                  </div>
                </div>
              </div>

              <div
                class="rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-left mt-3.5"
              >
                <p class="text-[11px] font-bold tracking-[0.06em] text-white/55">
                  {{ selectedSeatLabel }}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>

  <!-- 音頻控制條 (Floating Audio Control Bar) -->
  <div
    class="fixed bottom-1 left-1 right-1 z-50 rounded-2xl border border-white/10 bg-slate-950/92 shadow-[0_10px_28px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:left-1/2 sm:right-auto sm:w-[min(100%-0.75rem,34rem)] sm:-translate-x-1/2"
    :style="{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }"
  >
    <div class="px-2.5 py-2 sm:px-3 sm:py-2.5">
      <div class="flex items-center gap-2.5">
        <button
          @click="toggleAudio"
          class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_6px_16px_rgba(251,191,36,0.22)] transition-all active:scale-95 hover:bg-amber-300"
        >
          <q-icon :name="isAudioPlaying ? 'pause' : 'play_arrow'" size="16px" />
        </button>

        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <div
              class="truncate text-[9px] font-black uppercase tracking-[0.2em] text-white/40 sm:text-[10px]"
            >
              {{ selectedAudioTrackMeta.name }}
            </div>
            <span
              class="rounded-full border border-white/10 px-1.5 py-0.5 text-[8px] font-black text-white/45"
            >
              {{ audioVolume }}%
            </span>
          </div>
          <div class="mt-1.5 flex items-center gap-1.5">
            <button
              type="button"
              @click="toggleAudioMute"
              class="flex h-5 w-5 items-center justify-center rounded text-white/60 transition-colors hover:text-white"
            >
              <q-icon :name="volumeIconName" size="13px" />
            </button>
            <input
              v-model.number="audioVolume"
              @input="updateAudioVolume"
              type="range"
              min="0"
              max="100"
              class="h-1.5 w-full cursor-pointer rounded-full bg-white/15 accent-amber-400"
            />
          </div>
        </div>

        <button
          @click="showAudioTrackPicker = !showAudioTrackPicker"
          class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition-all hover:border-white/20 hover:bg-white/10 sm:hidden"
        >
          <q-icon :name="showAudioTrackPicker ? 'expand_less' : 'queue_music'" size="16px" />
        </button>

        <div class="hidden w-[9.2rem] gap-1 overflow-x-auto pb-1 no-scrollbar sm:flex sm:w-[12rem]">
          <button
            v-for="trackKey in audioTrackOrder"
            :key="trackKey"
            @click="handleTrackSelect(trackKey)"
            class="flex h-9 min-w-[2.3rem] flex-col items-center justify-center rounded-lg border transition-all duration-200"
            :class="
              selectedAudioTrack === trackKey
                ? 'border-amber-400 bg-amber-400/10 text-amber-200'
                : 'border-white/10 bg-white/5 text-white/55 hover:border-white/20 hover:bg-white/10 hover:text-white'
            "
          >
            <q-icon :name="audioTracks[trackKey].icon" size="15px" />
          </button>
        </div>
      </div>

      <div class="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px] text-white/65">
        <label
          class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        >
          <input v-model="followFocusPlayback" type="checkbox" class="accent-amber-400" />
          跟隨專注
        </label>
        <label
          class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        >
          <input v-model="audioLoopEnabled" type="checkbox" class="accent-amber-400" />
          循環
        </label>
        <label
          class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        >
          <input v-model="audioAutoPlayOnLoad" type="checkbox" class="accent-amber-400" />
          進頁自動播
        </label>
        <label
          class="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-1"
        >
          <span class="text-white/60">預設音源</span>
          <select
            v-model="defaultAudioTrack"
            class="rounded bg-slate-900/80 px-1.5 py-0.5 text-[10px] text-white outline-none"
          >
            <option
              v-for="trackKey in audioTrackOrder"
              :key="`default-${trackKey}`"
              :value="trackKey"
            >
              {{ audioTracks[trackKey].name }}
            </option>
          </select>
        </label>
      </div>

      <div v-if="showAudioTrackPicker" class="mt-2 grid grid-cols-4 gap-1.5 sm:hidden">
        <button
          v-for="trackKey in audioTrackOrder"
          :key="`mobile-${trackKey}`"
          @click="handleTrackSelect(trackKey)"
          class="flex h-9 items-center justify-center rounded-lg border transition-all duration-200"
          :class="
            selectedAudioTrack === trackKey
              ? 'border-amber-400 bg-amber-400/10 text-amber-200'
              : 'border-white/10 bg-white/5 text-white/55'
          "
        >
          <q-icon :name="audioTracks[trackKey].icon" size="15px" />
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { usePomodoroStore } from 'src/stores/pomodoro';
import { useQuasar } from 'quasar';
import {
  clampOccupancy,
  getHeatColor as getHeatColorHelper,
  getZoneHeatTextClass as getZoneHeatTextClassHelper,
  getFloorLoadPercent as getFloorLoadPercentHelper,
  getFloorLoadLabel as getFloorLoadLabelHelper,
  getFloorLoadLabelClass as getFloorLoadLabelClassHelper,
  formatTime as formatTimeHelper,
} from 'src/pages/index/functions/uiHelpers';
import {
  fetchFloorTrafficAction,
  type FloorHeat,
  type FloorTrafficDto,
} from 'src/pages/index/actions/floorTrafficActions';
import {
  fetchSeatSnapshotAction,
  type SeatSnapshotItem,
} from 'src/pages/index/actions/seatSnapshotActions';
import { fetchWebSocketTokenAction } from 'src/pages/index/actions/webSocketTokenActions';
const $q = useQuasar();

// --- 型別與介面 ---
interface Zone {
  id: string;
  name: string;
  description: string;
  capacity: number;
  occupancy: string;
}

interface Reader {
  userId: string;
  displayName: string;
  seatId?: string;
  state: '專注' | '休息' | '待命';
}

interface Seat {
  id: string;
  icon: string;
  available: boolean;
}

type SeatSnapshotMap = Record<
  string,
  {
    status: string;
    userId?: string;
    username?: string;
  }
>;

const store = usePomodoroStore();
const DEFAULT_FLOOR_CAPACITY = 45;
const DEFAULT_ZONE_CAPACITY = 15;

const floorHeatData = ref<FloorHeat[]>([]);
const floorMetaData = ref<FloorTrafficDto[]>([]);

// --- 狀態控制 ---
const currentFloor = ref(2);
const activeZoneId = ref('A');
const isLoading = ref(false);
const selectedSeatId = ref<string | null>(null);
const isShake = ref(false);
const isSwitching = ref(false);
const showAdvancedFocusControls = ref(false);

let socket: WebSocket | null = null;
let floorHeatTimer: number | null = null;
let reconnectTimer: number | null = null;
let heartbeatTimer: number | null = null;
let connectionVersion = 0;
let socketCloseWasIntentional = false;
const FLOOR_POLL_INTERVAL_ACTIVE_MS = 8000;
const FLOOR_POLL_INTERVAL_BACKGROUND_MS = 30000;
const WS_HEARTBEAT_INTERVAL_MS = 25000;
const WS_RECONNECT_DELAY_MS = 3000;

const userId = ref(localStorage.getItem('lib_uid') || `使用者_${Math.floor(Math.random() * 1000)}`);
localStorage.setItem('lib_uid', userId.value);

const displayName = ref(
  localStorage.getItem('lib_display_name') || `讀者-${userId.value.slice(-4)}`,
);
const displayNameInput = ref(displayName.value);
const isEditingDisplayName = ref(false);
const readers = ref<Reader[]>([]);
const seatSnapshotMap = ref<SeatSnapshotMap>({});

// --- 音頻播放配置 ---
type AudioTrackKey = 'forest' | 'ocean' | 'silence' | 'lofi' | 'rain' | 'thunder';

const audioTracks: Record<
  AudioTrackKey,
  {
    name: string;
    description: string;
    icon: string;
    url: string;
    gain: number;
  }
> = {
  forest: {
    name: '靜謐森林',
    description: '柔和樹葉感',
    icon: 'park',
    url: '/music/dany_photo-forestbirds-319791.mp3',
    gain: 0.12,
  },
  ocean: {
    name: '深海艙',
    description: '低頻潮汐感',
    icon: 'waves',
    url: '/music/kokoreli777-sea-waves-169411.mp3',
    gain: 0.14,
  },
  silence: {
    name: '無聲',
    description: '關閉播放',
    icon: 'volume_off',
    url: '',
    gain: 0,
  },
  lofi: {
    name: 'Lofi',
    description: '暖色低保真',
    icon: 'music_note',
    url: '/music/deawthanapon-lofi-relax-beat-loop-bpm-88-eb-major-ii-v-i-361752.mp3',
    gain: 0.11,
  },
  rain: {
    name: '下雨聲',
    description: '細碎雨滴聲',
    icon: 'water_drop',
    url: '/music/dragon-studio-copyright-free-rain-sounds-331497.mp3',
    gain: 0.11,
  },
  thunder: {
    name: '打雷聲',
    description: '雨聲伴隨打雷',
    icon: 'cloud',
    url: '/music/237729__flathill__rain-and-thunder-4.wav',
    gain: 0.12,
  },
};

let audioElement: HTMLAudioElement | null = null;
const selectedAudioTrack = ref<AudioTrackKey>('lofi');
const audioVolume = ref(80);
const lastVolumeBeforeMute = ref(80);
const isAudioPlaying = ref(false);
const defaultAudioTrack = ref<AudioTrackKey>('lofi');
const followFocusPlayback = ref(true);
const audioLoopEnabled = ref(true);
const audioAutoPlayOnLoad = ref(false);
const autoRestartOnFinish = ref(false);
const showAudioTrackPicker = ref(false);
const focusDurationOptions = [15, 25, 50] as const;
type FocusDurationOption = (typeof focusDurationOptions)[number];

const selectedFocusDurationMinutes = computed(() => Math.round(store.baseDuration / 60));

function handleFocusDurationSelect(minutes: FocusDurationOption) {
  if (store.isRunning) {
    $q.notify({
      message: '請先結束目前專注，再切換時長',
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

const audioTrackOrder: AudioTrackKey[] = ['forest', 'ocean', 'lofi', 'rain', 'thunder', 'silence'];

const selectedAudioTrackMeta = computed(() => audioTracks[selectedAudioTrack.value]);
const volumeIconName = computed(() => {
  if (audioVolume.value <= 0) return 'volume_off';
  if (audioVolume.value < 50) return 'volume_down';
  return 'volume_up';
});
const AUDIO_PREFS_KEY = 'focus_island_audio_prefs_v1';
const FOCUS_PREFS_KEY = 'focus_island_focus_prefs_v1';
const CURRENT_ROOM_INFO_KEY = 'focus_island_current_room_info_v1';
const FADE_DURATION_MS = 220;
let fadeTaskId = 0;
const DEBUG_SEAT_ID_SYNC = import.meta.env.DEV;

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

function isSeatedByOtherTab() {
  try {
    const existing = parseSeatedPayload(localStorage.getItem(IS_SEATED_FLAG_KEY));
    if (!existing) return false;
    if (existing.userId !== userId.value) return false;
    return existing.tabId !== currentTabId;
  } catch {
    return false;
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
  return `可續接 ${formatTimeHelper(candidate.timeLeft)}（${remain}s 內）`;
});

async function resumePreviousFocus() {
  const candidate = resumeCandidate.value;
  if (!candidate) return;

  if (candidate.expiresAt <= Date.now()) {
    clearResumeCandidate();
    $q.notify({
      message: '續接已過期，請重新入座',
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

  if (getMateAtSeat(candidate.seatId)) {
    clearResumeCandidate();
    $q.notify({
      message: '座位已被占用，請重新選位',
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

type AudioPrefs = {
  selectedAudioTrack: AudioTrackKey;
  defaultAudioTrack: AudioTrackKey;
  audioVolume: number;
  followFocusPlayback: boolean;
  audioLoopEnabled: boolean;
  audioAutoPlayOnLoad: boolean;
};

const zoneDescriptionMap: Record<string, string> = {
  靜謐森林: '完全靜音深度專注',
  城市咖啡廳: '環境音輕柔交流',
  深海舱: '封閉式專注座艙',
};

const roomID = computed(() => `${currentFloor.value}-${activeZoneId.value}`);

function normalizeSeatId(seatId?: string | null) {
  if (!seatId) return '';
  const value = seatId.trim();
  const matched = value.match(/^(\d+)-?([A-Za-z])-?(\d{1,2})$/);
  if (!matched) return value;

  const [, floorRaw = '0', zoneRaw = 'A', indexRaw = '0'] = matched;
  return `${Number(floorRaw)}-${zoneRaw.toUpperCase()}-${indexRaw.padStart(2, '0')}`;
}

function buildSeatId(floor: number, zoneId: string, index: number) {
  return `${floor}-${zoneId.toUpperCase()}-${String(index).padStart(2, '0')}`;
}

function syncCurrentRoomInfo() {
  const payload = {
    roomID: roomID.value,
    roomName: currentZone.value?.name || `Zone ${activeZoneId.value}`,
    zoneDescription: currentZone.value?.description || '',
  };

  localStorage.setItem(CURRENT_ROOM_INFO_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('focus-room-updated', { detail: payload }));
}

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
}

function clearHeartbeatTimer() {
  if (heartbeatTimer !== null) {
    window.clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function stopWebSocketConnection(intentional = true) {
  socketCloseWasIntentional = intentional;
  clearReconnectTimer();
  clearHeartbeatTimer();

  if (socket) {
    const currentSocket = socket;
    socket = null;
    try {
      currentSocket.close();
    } catch {
      // ignore
    }
  }
}

function startHeartbeat() {
  clearHeartbeatTimer();
  heartbeatTimer = window.setInterval(() => {
    if (socket?.readyState !== WebSocket.OPEN) return;

    socket.send(
      JSON.stringify({
        type: 'HEARTBEAT',
        userId: userId.value,
        roomID: roomID.value,
        timestamp: Date.now(),
      }),
    );
  }, WS_HEARTBEAT_INTERVAL_MS);
}

async function requestWebSocketToken() {
  try {
    const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL as string | undefined;
    const wsBaseUrl = import.meta.env.VITE_BACKEND_WS_URL as string | undefined;
    if (import.meta.env.DEV) {
      console.log('[WS Token Request] Config:', {
        apiBaseUrl: apiBaseUrl || '(not set)',
        wsBaseUrl: wsBaseUrl || '(not set)',
        roomID: roomID.value,
        userId: userId.value,
      });
    }
    return await fetchWebSocketTokenAction({
      roomID: roomID.value,
      userId: userId.value,
      ...(apiBaseUrl ? { apiBaseUrl } : {}),
      ...(wsBaseUrl ? { wsBaseUrl } : {}),
      clientNonce: `${userId.value}-${Date.now()}`,
    });
  } catch (err) {
    console.error('[WS Token Request] Unexpected error:', err);
    return null;
  }
}

function logSeatIdNormalization(
  source: string,
  rawSeatId: string | undefined | null,
  normalizedSeatId: string,
  meta?: Record<string, unknown>,
) {
  if (!DEBUG_SEAT_ID_SYNC) return;

  console.log('[SeatSync]', {
    source,
    rawSeatId,
    normalizedSeatId,
    ...meta,
  });
}

const floorZones = computed<Zone[]>(() =>
  (floorMetaData.value.find((floor) => floor.floor === currentFloor.value)?.zones || []).map(
    (zoneMeta) => {
      const zoneId = zoneMeta.zone || 'A';
      const zoneName = zoneMeta.name || `Zone ${zoneId}`;
      const zoneCapacity =
        typeof zoneMeta.capacity === 'number' && zoneMeta.capacity > 0
          ? zoneMeta.capacity
          : DEFAULT_ZONE_CAPACITY;

      const occupiedFromApi =
        typeof zoneMeta.occupancy === 'number'
          ? clampOccupancy(zoneMeta.occupancy, zoneCapacity)
          : null;
      const occupiedFallback = getUniqueZoneOccupancy(zoneId);
      const occupied = occupiedFromApi ?? occupiedFallback;

      return {
        id: zoneId,
        name: zoneName,
        description: zoneDescriptionMap[zoneName] || '自訂分區',
        capacity: zoneCapacity,
        occupancy: `${occupied}/${zoneCapacity}`,
      };
    },
  ),
);

const currentZone = computed<Zone | undefined>(() =>
  floorZones.value.find((z) => z.id === activeZoneId.value),
);

const isMe = (id: string) => id === userId.value;
const getMateAtSeat = (seatId: string) =>
  readers.value.find(
    (r) => normalizeSeatId(r.seatId) === normalizeSeatId(seatId) && !isMe(r.userId),
  );

function getUniqueZoneOccupancy(zoneId: string) {
  const uniqueUsers = new Set<string>();
  readers.value.forEach((reader) => {
    if (!reader.userId || !reader.seatId) return;
    if (normalizeSeatId(reader.seatId).startsWith(`${currentFloor.value}-${zoneId}-`)) {
      uniqueUsers.add(reader.userId);
    }
  });
  return uniqueUsers.size;
}

// --- 核心邏輯：熱度顏色判斷 ---
function getHeatColor(percent: number) {
  return getHeatColorHelper(percent);
}

function getZoneHeatTextClass(occupancyStr: string) {
  return getZoneHeatTextClassHelper(occupancyStr);
}

// --- 座位生成與同步模擬 ---
const currentSeats = computed(() => {
  const prefix = `${currentFloor.value}-${activeZoneId.value.toUpperCase()}`;
  const currentZoneConfig = floorZones.value.find((zone) => zone.id === activeZoneId.value);
  const seatCount = currentZoneConfig?.capacity || DEFAULT_ZONE_CAPACITY;
  return Array.from({ length: seatCount }, (_, i) => ({
    id: buildSeatId(currentFloor.value, activeZoneId.value, i + 1),
    icon: i % 3 === 0 ? '📚' : i % 3 === 1 ? '💻' : '✍️',
    available: (() => {
      const seatId = `${prefix}-${String(i + 1).padStart(2, '0')}`;
      const snapshot = seatSnapshotMap.value[seatId];
      const status = snapshot?.status ?? 'AVAILABLE';
      const isMySeat = snapshot?.userId === userId.value || selectedSeatId.value === seatId;
      return status === 'AVAILABLE' || isMySeat;
    })(),
  }));
});

function normalizeSeatSnapshot(snapshot: SeatSnapshotItem[]) {
  const nextSeatMap: SeatSnapshotMap = {};
  const nextReaders: Reader[] = [];

  snapshot.forEach((seat) => {
    const normalizedSeatId = normalizeSeatId(seat.seatId);
    logSeatIdNormalization('snapshot', seat.seatId, normalizedSeatId, {
      status: seat.status,
      userId: seat.userId,
      username: seat.username,
    });
    if (!normalizedSeatId) return;

    nextSeatMap[normalizedSeatId] = {
      status: seat.status,
      ...(seat.userId ? { userId: seat.userId } : {}),
      ...(seat.username ? { username: seat.username } : {}),
    };

    if (seat.userId && seat.status !== 'AVAILABLE') {
      nextReaders.push({
        userId: seat.userId,
        displayName: seat.username || seat.userId,
        seatId: normalizedSeatId,
        state: seat.status === 'FOCUS' ? '專注' : seat.status === 'READY' ? '待命' : '休息',
      });
    }
  });

  seatSnapshotMap.value = nextSeatMap;
  readers.value = nextReaders;
}

async function fetchSeatSnapshot() {
  try {
    const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL as string | undefined;
    const wsBaseUrl = import.meta.env.VITE_BACKEND_WS_URL as string | undefined;
    const snapshot = await fetchSeatSnapshotAction({
      roomID: roomID.value,
      ...(apiBaseUrl ? { apiBaseUrl } : {}),
      ...(wsBaseUrl ? { wsBaseUrl } : {}),
    });
    if (!snapshot) return;

    normalizeSeatSnapshot(snapshot.seats);
    updateCurrentFloorHeatByReaders();
  } catch {
    // ignore seat snapshot failures and continue with websocket sync
  }
}

function getFloorLoadPercent(floor: FloorHeat) {
  return getFloorLoadPercentHelper(floor);
}

function getFloorLoadLabel(floor: FloorHeat) {
  const percent = getFloorLoadPercent(floor);
  return getFloorLoadLabelHelper(percent);
}

function getFloorLoadLabelClass(floor: FloorHeat) {
  const percent = getFloorLoadPercent(floor);
  return getFloorLoadLabelClassHelper(percent, currentFloor.value === floor.floor);
}

async function fetchFloorTraffic() {
  try {
    const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL as string | undefined;
    const wsBaseUrl = import.meta.env.VITE_BACKEND_WS_URL as string | undefined;
    const result = await fetchFloorTrafficAction({
      defaultFloorCapacity: DEFAULT_FLOOR_CAPACITY,
      ...(apiBaseUrl ? { apiBaseUrl } : {}),
      ...(wsBaseUrl ? { wsBaseUrl } : {}),
    });
    if (!result) return;

    floorHeatData.value = result.normalized.map((item) => {
      return {
        floor: item.floor,
        occupancy: item.occupancy,
        capacity: item.capacity,
      };
    });

    floorMetaData.value = result.floors;

    if (
      !floorHeatData.value.some((f) => f.floor === currentFloor.value) &&
      floorHeatData.value.length
    ) {
      currentFloor.value = floorHeatData.value[0]!.floor;
    }

    if (
      !floorZones.value.some((zone) => zone.id === activeZoneId.value) &&
      floorZones.value.length
    ) {
      activeZoneId.value = floorZones.value[0]!.id;
    }
  } catch {
    // API 端點未就緒時維持現有畫面，不中斷互動
  }
}

function updateCurrentFloorHeatByReaders() {
  const roomOccupied = getUniqueZoneOccupancy(activeZoneId.value);

  floorMetaData.value = floorMetaData.value.map((floor) => {
    if (floor.floor !== currentFloor.value) return floor;

    const zones = (floor.zones || []).map((zone) => {
      if (zone.zone !== activeZoneId.value) return zone;
      const zoneCapacity =
        typeof zone.capacity === 'number' && zone.capacity > 0
          ? zone.capacity
          : DEFAULT_ZONE_CAPACITY;
      const occupancy = clampOccupancy(roomOccupied, zoneCapacity);
      return {
        ...zone,
        occupancy,
        available: Math.max(0, zoneCapacity - occupancy),
      };
    });

    const floorCapacity =
      typeof floor.capacity === 'number' && floor.capacity > 0
        ? floor.capacity
        : DEFAULT_FLOOR_CAPACITY;
    const floorOccupancy = zones.reduce((sum, zone) => {
      const zoneOcc = typeof zone.occupancy === 'number' ? zone.occupancy : 0;
      return sum + zoneOcc;
    }, 0);

    return {
      ...floor,
      zones,
      occupancy: clampOccupancy(floorOccupancy, floorCapacity),
      available: Math.max(0, floorCapacity - floorOccupancy),
    };
  });

  floorHeatData.value = floorHeatData.value.map((item) => {
    if (item.floor !== currentFloor.value) return item;
    const floorMeta = floorMetaData.value.find((floor) => floor.floor === item.floor);
    const occupancy =
      typeof floorMeta?.occupancy === 'number'
        ? clampOccupancy(floorMeta.occupancy, item.capacity)
        : item.occupancy;
    return {
      floor: item.floor,
      occupancy,
      capacity: item.capacity,
    };
  });
}

// --- 音頻控制函數 ---
function ensureAudioElement() {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.loop = audioLoopEnabled.value;
    audioElement.preload = 'auto';
    audioElement.crossOrigin = 'anonymous';
    audioElement.addEventListener('error', handleAudioPlaybackError);
  }
  return audioElement;
}

function isTrackKey(value: unknown): value is AudioTrackKey {
  return typeof value === 'string' && value in audioTracks;
}

function normalizeVolume(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 80;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function saveAudioPreferences() {
  const payload: AudioPrefs = {
    selectedAudioTrack: selectedAudioTrack.value,
    defaultAudioTrack: defaultAudioTrack.value,
    audioVolume: audioVolume.value,
    followFocusPlayback: followFocusPlayback.value,
    audioLoopEnabled: audioLoopEnabled.value,
    audioAutoPlayOnLoad: audioAutoPlayOnLoad.value,
  };
  localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(payload));
}

function loadAudioPreferences() {
  const raw = localStorage.getItem(AUDIO_PREFS_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
    if (isTrackKey(parsed.defaultAudioTrack)) {
      defaultAudioTrack.value = parsed.defaultAudioTrack;
    }

    if (isTrackKey(parsed.selectedAudioTrack)) {
      selectedAudioTrack.value = parsed.selectedAudioTrack;
    } else {
      selectedAudioTrack.value = defaultAudioTrack.value;
    }

    audioVolume.value = normalizeVolume(parsed.audioVolume);
    followFocusPlayback.value = parsed.followFocusPlayback ?? true;
    audioLoopEnabled.value = parsed.audioLoopEnabled ?? true;
    audioAutoPlayOnLoad.value = parsed.audioAutoPlayOnLoad ?? false;
  } catch {
    // ignore invalid stored payload
  }
}

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

function getTrackVolume(trackKey = selectedAudioTrack.value) {
  return (audioVolume.value / 100) * (audioTracks[trackKey]?.gain ?? 0);
}

function fadeAudioVolume(target: number, duration = FADE_DURATION_MS) {
  const player = audioElement;
  if (!player) return Promise.resolve();

  fadeTaskId += 1;
  const taskId = fadeTaskId;
  const from = player.volume;
  const start = performance.now();

  return new Promise<void>((resolve) => {
    const tick = (now: number) => {
      if (!audioElement || taskId !== fadeTaskId) {
        resolve();
        return;
      }

      const progress = Math.min(1, (now - start) / duration);
      audioElement.volume = from + (target - from) * progress;

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });
}

function shouldAutoPlayTrack() {
  return isAudioPlaying.value || (followFocusPlayback.value && store.isRunning);
}

function handleAudioPlaybackError() {
  const fallbackOrder: AudioTrackKey[] = ['rain', 'forest', 'silence'];
  const fallback = fallbackOrder.find((key) => key !== selectedAudioTrack.value);

  if (!fallback) {
    stopAudioPlayback();
    return;
  }

  selectedAudioTrack.value = fallback;
  saveAudioPreferences();

  if (fallback === 'silence') {
    stopAudioPlayback();
  } else {
    void startAudioPlayback();
  }

  $q.notify({
    message: '音檔載入失敗，已切換到備用音源',
    color: 'warning',
    icon: 'warning',
    timeout: 1800,
    position: 'top',
  });
}

function stopAudioPlayback() {
  fadeTaskId += 1;
  if (audioElement) {
    try {
      audioElement.pause();
      audioElement.currentTime = 0;
    } catch {
      // ignore
    }
  }

  isAudioPlaying.value = false;
}

async function startAudioPlayback() {
  const track = audioTracks[selectedAudioTrack.value];
  if (!track || selectedAudioTrack.value === 'silence' || !track.url) {
    stopAudioPlayback();
    return;
  }

  const player = ensureAudioElement();
  player.loop = audioLoopEnabled.value;

  const targetVolume = getTrackVolume();
  const currentSrc = player.getAttribute('src') || '';
  const sourceChanged = currentSrc !== track.url;

  if (isAudioPlaying.value && sourceChanged) {
    await fadeAudioVolume(0);
    player.pause();
  }

  if (sourceChanged) {
    player.setAttribute('src', track.url);
    player.load();
  }

  player.volume = sourceChanged ? 0 : targetVolume;

  void player
    .play()
    .then(async () => {
      isAudioPlaying.value = true;
      if (sourceChanged) {
        await fadeAudioVolume(targetVolume);
      } else {
        player.volume = targetVolume;
      }
    })
    .catch(() => {
      isAudioPlaying.value = false;
    });
}

function switchAudioTrack() {
  if (selectedAudioTrack.value === 'silence') {
    stopAudioPlayback();
    saveAudioPreferences();
    return;
  }

  if (shouldAutoPlayTrack()) {
    void startAudioPlayback();
  }

  saveAudioPreferences();
}

function handleTrackSelect(trackKey: AudioTrackKey) {
  selectedAudioTrack.value = trackKey;
  switchAudioTrack();
  showAudioTrackPicker.value = false;
}

function toggleAudio() {
  if (isAudioPlaying.value) {
    stopAudioPlayback();
  } else {
    void startAudioPlayback();
  }

  saveAudioPreferences();
}

function updateAudioVolume() {
  if (audioVolume.value > 0) {
    lastVolumeBeforeMute.value = audioVolume.value;
  }

  if (audioElement) {
    audioElement.volume = getTrackVolume();
  }

  saveAudioPreferences();
}

function toggleAudioMute() {
  if (audioVolume.value > 0) {
    lastVolumeBeforeMute.value = audioVolume.value;
    audioVolume.value = 0;
  } else {
    audioVolume.value = Math.max(20, lastVolumeBeforeMute.value || 80);
  }

  updateAudioVolume();
}

function startEditDisplayName() {
  isEditingDisplayName.value = true;
}

function applyDisplayName() {
  const normalized = displayNameInput.value.trim().slice(0, 20) || `讀者-${userId.value.slice(-4)}`;
  displayName.value = normalized;
  displayNameInput.value = normalized;
  isEditingDisplayName.value = false;
  localStorage.setItem('lib_display_name', normalized);

  if (selectedSeatId.value && socket?.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: 'MOVE',
        userId: userId.value,
        payload: {
          seatId: selectedSeatId.value,
          state: 'READY',
          username: displayName.value,
        },
      }),
    );
  }
}

function clearFloorPollingTimer() {
  if (floorHeatTimer !== null) {
    window.clearInterval(floorHeatTimer);
    floorHeatTimer = null;
  }
}

function startFloorPollingTimer() {
  clearFloorPollingTimer();
  const interval = document.hidden
    ? FLOOR_POLL_INTERVAL_BACKGROUND_MS
    : FLOOR_POLL_INTERVAL_ACTIVE_MS;
  floorHeatTimer = window.setInterval(() => {
    void fetchFloorTraffic();
  }, interval);
}

function handleVisibilityChange() {
  startFloorPollingTimer();
}

function connectWebSocket(token: string, version: number) {
  const baseUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8080';
  const url = `${baseUrl}/api/v1/library/ws?floor=${currentFloor.value}&zone=${activeZoneId.value}&userId=${userId.value}&token=${encodeURIComponent(token)}`;

  if (import.meta.env.DEV) {
    console.log('[WS Connect] Connecting to:', url);
  }

  const currentSocket = new WebSocket(url);
  socket = currentSocket;

  currentSocket.onopen = () => {
    if (socket !== currentSocket || version !== connectionVersion) return;

    console.log('[WS Connect] Connected successfully');
    socketCloseWasIntentional = false;
    clearReconnectTimer();
    startHeartbeat();

    currentSocket.send(
      JSON.stringify({
        type: 'JOIN',
        userId: userId.value,
        payload: {
          state: 'READY',
          username: displayName.value,
          seatId: selectedSeatId.value,
        },
      }),
    );

    isLoading.value = false;
  };

  currentSocket.onmessage = (event) => {
    if (socket !== currentSocket || version !== connectionVersion) return;

    try {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'SYNC_ALL': {
          const synchronizedReaders: Reader[] = [];
          Object.keys(msg.data).forEach((uid) => {
            const payload =
              typeof msg.data[uid] === 'string' ? JSON.parse(msg.data[uid]) : msg.data[uid];
            const normalizedSeatId = normalizeSeatId(payload.seatId);
            logSeatIdNormalization('ws:SYNC_ALL', payload.seatId, normalizedSeatId, {
              userId: uid,
              username: payload.username || payload.name,
              state: payload.state,
            });
            synchronizedReaders.push({
              userId: uid,
              displayName: payload.username || payload.name || uid,
              ...(normalizedSeatId ? { seatId: normalizedSeatId } : {}),
              state: payload.state || '專注',
            });
          });
          readers.value = synchronizedReaders;
          const nextSeatMap: SeatSnapshotMap = {};
          synchronizedReaders.forEach((reader) => {
            if (!reader.seatId) return;
            nextSeatMap[normalizeSeatId(reader.seatId)] = {
              status: reader.state === '專注' ? 'FOCUS' : 'READY',
              userId: reader.userId,
              username: reader.displayName,
            };
          });
          seatSnapshotMap.value = nextSeatMap;
          updateCurrentFloorHeatByReaders();
          break;
        }

        case 'JOIN': {
          const joinIdx = readers.value.findIndex((r) => r.userId === msg.userId);
          const previousSeatId = joinIdx !== -1 ? readers.value[joinIdx]?.seatId : undefined;
          const normalizedJoinSeatId = normalizeSeatId(msg.payload?.seatId);
          logSeatIdNormalization('ws:JOIN', msg.payload?.seatId, normalizedJoinSeatId, {
            userId: msg.userId,
            username: msg.payload?.username,
            previousSeatId,
          });
          const joinReader: Reader = {
            userId: msg.userId,
            displayName: msg.payload?.username || msg.userId,
            ...(normalizedJoinSeatId ? { seatId: normalizedJoinSeatId } : {}),
            state: msg.payload?.state || '待命',
          };

          if (joinIdx !== -1) readers.value[joinIdx] = joinReader;
          else readers.value.push(joinReader);

          if (joinReader.seatId) {
            if (previousSeatId && previousSeatId !== joinReader.seatId) {
              seatSnapshotMap.value[normalizeSeatId(previousSeatId)] = { status: 'AVAILABLE' };
            }
            seatSnapshotMap.value[joinReader.seatId] = {
              status: joinReader.state === '專注' ? 'FOCUS' : 'READY',
              userId: joinReader.userId,
              username: joinReader.displayName,
            };
          }

          if (msg.userId !== userId.value) {
            $q.notify({
              message: `👋 新同學 ${joinReader.displayName} 進入了圖書館`,
              color: 'amber-9',
              icon: 'sensors',
              position: 'top-right',
              timeout: 2500,
              classes: 'font-black tracking-tighter',
            });
          }
          updateCurrentFloorHeatByReaders();
          break;
        }

        case 'MOVE': {
          const isSomeoneElse = msg.userId !== userId.value;
          const normalizedIncomingSeatId = normalizeSeatId(msg.payload?.seatId);
          logSeatIdNormalization('ws:MOVE', msg.payload?.seatId, normalizedIncomingSeatId, {
            userId: msg.userId,
            username: msg.payload?.username,
            state: msg.payload?.state,
          });
          const isTargetingMySeat =
            normalizedIncomingSeatId === normalizeSeatId(selectedSeatId.value);

          if (isSomeoneElse && isTargetingMySeat) {
            isShake.value = true;
            selectedSeatId.value = null;
            setTimeout(() => (isShake.value = false), 500);
            $q.notify({
              message: '🛑 哎呀！這個位子剛剛被搶先入座了',
              color: 'negative',
              icon: 'priority_high',
              position: 'top',
              timeout: 2000,
              classes: 'font-black',
            });
          }

          const moveIdx = readers.value.findIndex((r) => r.userId === msg.userId);
          const moveReader: Reader = {
            userId: msg.userId,
            displayName: msg.payload?.username || msg.userId,
            ...(normalizedIncomingSeatId ? { seatId: normalizedIncomingSeatId } : {}),
            state: msg.payload.state || '專注',
          };

          const previousSeatId = moveIdx !== -1 ? readers.value[moveIdx]?.seatId : undefined;
          if (moveIdx !== -1) readers.value[moveIdx] = moveReader;
          else readers.value.push(moveReader);

          if (previousSeatId && previousSeatId !== moveReader.seatId) {
            seatSnapshotMap.value[normalizeSeatId(previousSeatId)] = {
              status: 'AVAILABLE',
            };
          }

          if (moveReader.seatId) {
            seatSnapshotMap.value[moveReader.seatId] = {
              status: moveReader.state === '專注' ? 'FOCUS' : 'READY',
              userId: moveReader.userId,
              username: moveReader.displayName,
            };
          }

          updateCurrentFloorHeatByReaders();
          break;
        }

        case 'LEAVE': {
          const leavingReader = readers.value.find((r) => r.userId === msg.userId);
          logSeatIdNormalization(
            'ws:LEAVE',
            leavingReader?.seatId,
            normalizeSeatId(leavingReader?.seatId),
            {
              userId: msg.userId,
            },
          );
          if (leavingReader?.seatId) {
            seatSnapshotMap.value[leavingReader.seatId] = {
              status: 'AVAILABLE',
            };
          }
          readers.value = readers.value.filter((r) => r.userId !== msg.userId);
          updateCurrentFloorHeatByReaders();
          // 如果伺服器通知是本使用者離開，清除入座 flag 並停止本分頁的專注
          if (msg.userId === userId.value) {
            try {
              clearSeatedFlag();
              if (store.isRunning) store.stopTimer();
            } catch {
              // ignore
            }
          }
          break;
        }

        case 'ERROR': {
          if (msg.message === 'SEAT_TAKEN') {
            isShake.value = true;
            selectedSeatId.value = null;

            setTimeout(() => {
              isShake.value = false;
            }, 500);

            $q.notify({
              message: '🛑 慢了一步！這個位子剛剛被別人搶走了',
              color: 'negative',
              icon: 'block',
              position: 'top',
              timeout: 2500,
              classes: 'font-black tracking-tighter',
            });
          }
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket 訊息解析失敗:', err);
    }
  };

  currentSocket.onclose = () => {
    if (socket === currentSocket) {
      socket = null;
    }

    clearHeartbeatTimer();

    if (version !== connectionVersion) return;

    if (socketCloseWasIntentional) {
      console.log('[WS Close] Connection closed intentionally');
      socketCloseWasIntentional = false;
      try {
        clearSeatedFlag();
      } catch {
        // ignore
      }
      return;
    }

    // 清除入座 flag，避免斷線後造成鎖定
    try {
      clearSeatedFlag();
    } catch {
      // ignore
    }

    console.warn('[WS Close] Connection closed unexpectedly, scheduling reconnect...');
    isLoading.value = false;
    clearReconnectTimer();
    reconnectTimer = window.setTimeout(() => {
      if (version !== connectionVersion) return;
      isLoading.value = true;
      void reconnectRoomSession();
    }, WS_RECONNECT_DELAY_MS);
  };

  currentSocket.onerror = (error) => {
    if (socket !== currentSocket || version !== connectionVersion) return;

    console.error('[WS Error] WebSocket 發生錯誤:', {
      error,
      readyState: currentSocket.readyState,
      url: currentSocket.url,
      state: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][currentSocket.readyState],
    });
    $q.notify({
      message: '連線發生錯誤，正在嘗試重新連線',
      color: 'negative',
      icon: 'wifi_off',
      position: 'top',
      timeout: 1800,
    });
  };
}

async function reconnectRoomSession() {
  const version = ++connectionVersion;
  stopWebSocketConnection(true);
  selectedSeatId.value = null;
  seatSnapshotMap.value = {};
  syncCurrentRoomInfo();

  void fetchFloorTraffic();

  await fetchSeatSnapshot();

  if (version !== connectionVersion) return;

  const tokenPayload = await requestWebSocketToken();
  if (version !== connectionVersion) return;

  if (!tokenPayload?.token) {
    isLoading.value = false;
    console.error('[WS Connect] Token payload missing or invalid:', {
      hasPayload: !!tokenPayload,
      hasToken: !!tokenPayload?.token,
    });
    $q.notify({
      message: '無法取得安全連線權杖，請稍後再試',
      color: 'negative',
      icon: 'vpn_key_off',
      position: 'top',
      timeout: 2200,
    });
    return;
  }

  if (import.meta.env.DEV) {
    console.log('[WS Connect] Token acquired, initiating connection...');
  }
  connectWebSocket(tokenPayload.token, version);
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
    ? `${displayName.value} 已預留 ${selectedSeatId.value}`
    : '請先選擇座位';
});

function selectSeat(id: string) {
  // 如果正在切換中，直接 return
  if (getMateAtSeat(id) || store.isRunning || isSwitching.value) return;

  // 標記切換中
  isSwitching.value = true;
  selectedSeatId.value = id;

  if (store.isRunning) {
    void startAudioPlayback();
  }

  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: 'MOVE',
        userId: userId.value,
        payload: { seatId: id, state: 'READY', username: displayName.value },
      }),
    );
  }

  // 設定 500ms 後有下一次點擊
  setTimeout(() => {
    isSwitching.value = false;
  }, 500);
}

// --- 操作方法 ---
function toggleFocus() {
  if (!selectedSeatId.value && !store.isRunning) {
    $q.notify({
      message: '請先選擇一個座位才能入座',
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
    if (followFocusPlayback.value) {
      stopAudioPlayback();
    }
  } else {
    clearResumeCandidate();
    store.startTimer();
    setSeatedFlag(true);
    if (followFocusPlayback.value) {
      void startAudioPlayback();
    }
  }
}

function resetFocusTimer() {
  store.resetTimer();
  if (followFocusPlayback.value) {
    stopAudioPlayback();
  }
}

function restartFocusTimer() {
  if (!selectedSeatId.value && !store.isRunning) {
    $q.notify({
      message: '請先入座再重新開始',
      color: 'warning',
      icon: 'event_seat',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  store.resetTimer();
  store.startTimer();

  if (followFocusPlayback.value) {
    void startAudioPlayback();
  }
}

function handleFocusFinished() {
  stopAudioPlayback();

  if (autoRestartOnFinish.value) {
    store.resetTimer();
    store.startTimer();

    if (followFocusPlayback.value) {
      void startAudioPlayback();
    }

    $q.notify({
      message: '本輪專注完成，已自動開始下一輪',
      color: 'amber-9',
      icon: 'autorenew',
      timeout: 2200,
      position: 'top',
      classes: 'font-black tracking-tighter',
    });
    return;
  }

  $q.notify({
    message: '本輪專注完成，辛苦了',
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

  const otherMate = getMateAtSeat(seat.id);
  if (otherMate) return 'border-teal-500/30 bg-teal-500/5 cursor-default';

  return 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10';
}

function formatTime(seconds: number): string {
  return formatTimeHelper(seconds);
}

watch([currentFloor, activeZoneId], () => {
  isLoading.value = true;
  void reconnectRoomSession();
});

watch(
  () => store.timeLeft,
  (newTime) => {
    const status = store.isRunning ? '專注中' : '待命中';
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
  loadAudioPreferences();
  loadFocusPreferences();
  loadResumeCandidate();
  void reconnectRoomSession();
  startFloorPollingTimer();
  document.addEventListener('visibilitychange', handleVisibilityChange);

  if (audioAutoPlayOnLoad.value && selectedAudioTrack.value !== 'silence') {
    void startAudioPlayback();
  }
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
  stopWebSocketConnection(true);
}

onBeforeRouteLeave(() => {
  cleanupSessionOnPageLeave();
});

onUnmounted(() => {
  cleanupSessionOnPageLeave();
  saveAudioPreferences();
  saveFocusPreferences();
  stopAudioPlayback();
  if (audioElement) {
    audioElement.removeEventListener('error', handleAudioPlaybackError);
  }
  audioElement = null;
  clearFloorPollingTimer();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

watch(
  [
    selectedAudioTrack,
    defaultAudioTrack,
    followFocusPlayback,
    audioLoopEnabled,
    audioAutoPlayOnLoad,
  ],
  () => {
    if (audioElement) {
      audioElement.loop = audioLoopEnabled.value;
    }

    if (selectedAudioTrack.value === 'silence' && defaultAudioTrack.value !== 'silence') {
      selectedAudioTrack.value = defaultAudioTrack.value;
    }

    saveAudioPreferences();
  },
);

watch(
  () => defaultAudioTrack.value,
  () => {
    selectedAudioTrack.value = defaultAudioTrack.value;
    switchAudioTrack();
  },
);

watch(
  () => currentZone.value?.name,
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
