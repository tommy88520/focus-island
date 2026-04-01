<template>
  <div class="relative min-h-[calc(100vh-80px)] px-4 py-4 sm:px-6 lg:py-8">
    <div class="relative z-10 mx-auto max-w-7xl">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <main class="lg:col-span-8 space-y-6">
          <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div
                  class="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-black tracking-widest uppercase shadow-lg shadow-amber-400/20"
                >
                  Floor {{ currentFloor }}
                </div>
                <div class="h-1 w-1 rounded-full bg-white/20"></div>
                <p class="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                  {{ currentZone?.name }} · {{ currentZone?.description }}
                </p>
              </div>
              <h1 class="text-3xl font-black tracking-tight text-white sm:text-4xl">
                {{ store.isRunning ? '深度專注中' : '挑個好位子，入座。' }}
              </h1>
            </div>

            <nav
              class="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar"
            >
              <button
                v-for="f in floorHeatData"
                :key="f.floor"
                @click="currentFloor = f.floor"
                class="relative px-4 py-3 rounded-xl transition-all duration-500 group overflow-hidden"
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
                    {{ f.floor }}F
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

          <section
            class="rounded-[40px] border border-white/10 bg-slate-900/40 p-4 sm:p-10 backdrop-blur-md shadow-2xl relative min-h-[550px]"
          >
            <div
              class="flex items-center gap-6 mb-10 border-b border-white/5 overflow-x-auto no-scrollbar"
            >
              <button
                v-for="zone in floorZones"
                :key="zone.id"
                @click="activeZoneId = zone.id"
                class="pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group flex-shrink-0"
                :class="
                  activeZoneId === zone.id ? 'text-amber-400' : 'text-white/20 hover:text-white/40'
                "
              >
                <div class="flex items-center gap-2" :class="getZoneHeatTextClass(zone.occupancy)">
                  {{ zone.name }}
                  <span
                    class="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 group-hover:border-amber-400/30"
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
              class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-6 relative transition-all duration-500"
              :class="{ 'shake-error': isShake, 'opacity-0 scale-95': isLoading }"
            >
              <div v-for="seat in currentSeats" :key="seat.id" class="relative">
                <button
                  :disabled="!seat.available || store.isRunning"
                  @click="selectSeat(seat.id)"
                  class="w-full aspect-square ..."
                  :class="seatButtonClass(seat)"
                >
                  <div v-if="selectedSeatId === seat.id" class="flex flex-col items-center">
                    <div class="relative">
                      <div
                        class="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-slate-800 border-2 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center justify-center text-xs sm:text-sm font-black"
                      >
                        ME
                      </div>
                      <div
                        class="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-slate-900 bg-amber-400 shadow-lg"
                      ></div>
                    </div>
                    <span
                      class="absolute -bottom-6 text-[8px] font-black uppercase tracking-widest text-amber-400"
                      >YOU</span
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
              class="absolute inset-x-0 bottom-0 top-32 px-4 sm:px-10 flex items-center justify-center pointer-events-none"
            >
              <div class="flex flex-col items-center gap-4">
                <div
                  class="h-12 w-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"
                ></div>
                <p class="text-amber-400/60 font-black text-[10px] tracking-[0.4em] uppercase">
                  Syncing Floor {{ currentFloor }}...
                </p>
              </div>
            </div>
          </section>
        </main>

        <aside class="lg:col-span-4 space-y-6">
          <div
            class="rounded-[40px] border border-white/10 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden"
          >
            <div
              class="absolute -top-24 -right-24 h-48 w-48 bg-amber-400/5 blur-[80px] rounded-full"
            ></div>

            <div
              class="mb-10 h-56 w-56 mx-auto rounded-full border-[12px] border-white/5 flex flex-col items-center justify-center relative shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]"
            >
              <div
                class="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-amber-400 animate-spin-slow"
                v-if="store.isRunning"
              ></div>
              <div class="text-[10px] font-black text-amber-200/40 tracking-[0.5em] mb-2 uppercase">
                Remaining
              </div>
              <div class="text-6xl font-mono font-black text-white tracking-tighter">
                {{ formattedTime }}
              </div>
            </div>

            <div class="space-y-4 relative z-10">
              <div class="rounded-2xl bg-white/5 border border-white/10 px-4 py-3 text-left">
                <label
                  for="display-name"
                  class="block text-[10px] font-black uppercase tracking-[0.2em] text-white/50 mb-2"
                >
                  Username
                </label>
                <input
                  id="display-name"
                  v-model="displayNameInput"
                  type="text"
                  maxlength="20"
                  :disabled="!isEditingDisplayName"
                  class="w-full rounded-xl bg-slate-950/70 border border-white/15 px-3 py-2 text-sm font-black text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-amber-400/60 disabled:opacity-60 disabled:cursor-not-allowed"
                  placeholder="輸入你想顯示的名稱"
                  @keyup.enter="applyDisplayName"
                />
                <div class="mt-3 flex justify-end">
                  <button
                    v-if="!isEditingDisplayName"
                    class="rounded-lg border border-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-white/70 hover:text-white hover:border-white/40"
                    @click="startEditDisplayName"
                  >
                    Edit
                  </button>
                  <button
                    v-else
                    class="rounded-lg bg-amber-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-950 hover:bg-amber-300"
                    @click="applyDisplayName"
                  >
                    Save
                  </button>
                </div>
              </div>
              <button
                @click="toggleFocus"
                :disabled="!selectedSeatId && !store.isRunning"
                class="w-full py-5 rounded-3xl font-black tracking-[0.2em] transition-all active:scale-95 shadow-2xl"
                :class="
                  store.isRunning
                    ? 'bg-rose-500 text-white shadow-rose-500/20'
                    : 'bg-white text-slate-900 shadow-white/10 hover:bg-amber-50'
                "
              >
                {{ store.isRunning ? 'LEAVE SESSION' : 'CLAIM YOUR SEAT' }}
              </button>
              <div class="py-3 px-4 rounded-2xl bg-white/5 border border-white/10">
                <p class="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                  {{ selectedSeatLabel }}
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { usePomodoroStore } from 'src/stores/pomodoro';
import { useQuasar } from 'quasar';
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
  state: 'FOCUS' | 'BREAK' | 'READY';
}

interface Seat {
  id: string;
  icon: string;
  available: boolean;
}

interface FloorHeat {
  floor: number;
  occupancy: number;
  capacity: number;
}

interface FloorTrafficDto {
  floor: number;
  name?: string;
  occupancy?: number;
  available?: number;
  capacity?: number;
  zones?: Array<{
    zone?: string;
    roomId?: string;
    name?: string;
    occupancy?: number;
    available?: number;
    capacity?: number;
  }>;
}

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

let socket: WebSocket | null = null;
let floorHeatTimer: number | null = null;
const FLOOR_POLL_INTERVAL_ACTIVE_MS = 8000;
const FLOOR_POLL_INTERVAL_BACKGROUND_MS = 30000;

const userId = ref(localStorage.getItem('lib_uid') || `user_${Math.floor(Math.random() * 1000)}`);
localStorage.setItem('lib_uid', userId.value);

const displayName = ref(
  localStorage.getItem('lib_display_name') || `Reader-${userId.value.slice(-4)}`,
);
const displayNameInput = ref(displayName.value);
const isEditingDisplayName = ref(false);
const readers = ref<Reader[]>([]);

const zoneDescriptionMap: Record<string, string> = {
  'Silent Forest': '完全靜音深度專注',
  'Urban Cafe': '環境音輕柔交流',
  'Deep Sea': '封閉式專注座艙',
};

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
  readers.value.find((r) => r.seatId === seatId && !isMe(r.userId));

function getUniqueZoneOccupancy(zoneId: string) {
  const uniqueUsers = new Set<string>();
  readers.value.forEach((reader) => {
    if (!reader.userId || !reader.seatId) return;
    if (reader.seatId.startsWith(`${currentFloor.value}${zoneId}-`)) {
      uniqueUsers.add(reader.userId);
    }
  });
  return uniqueUsers.size;
}

// --- 核心邏輯：熱度顏色判斷 ---
function getHeatColor(percent: number) {
  if (percent > 80) return 'bg-rose-500';
  if (percent > 50) return 'bg-orange-400';
  if (percent > 20) return 'bg-teal-400';
  return 'bg-slate-500';
}

function getZoneHeatTextClass(occupancyStr: string) {
  const [currentRaw = '0', totalRaw = '1'] = (occupancyStr ?? '0/1').split('/');
  const current = Number(currentRaw);
  const total = Number(totalRaw);

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return 'text-white/20';
  }

  const ratio = current / total;
  if (ratio > 0.7) return 'text-rose-400';
  if (ratio > 0.3) return 'text-teal-400';
  return 'text-white/20';
}

// --- 座位生成與同步模擬 ---
const currentSeats = computed(() => {
  const prefix = `${currentFloor.value}${activeZoneId.value}`;
  const currentZoneConfig = floorZones.value.find((zone) => zone.id === activeZoneId.value);
  const seatCount = currentZoneConfig?.capacity || DEFAULT_ZONE_CAPACITY;
  return Array.from({ length: seatCount }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    icon: i % 3 === 0 ? '📚' : i % 3 === 1 ? '💻' : '✍️',
    available: i !== 11,
  }));
});

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampOccupancy(value: number, capacity = DEFAULT_FLOOR_CAPACITY) {
  return Math.max(0, Math.min(capacity, Math.round(value)));
}

function getFloorLoadPercent(floor: FloorHeat) {
  if (!floor.capacity) return 0;
  return clampPercent((floor.occupancy / floor.capacity) * 100);
}

function getFloorLoadLabel(floor: FloorHeat) {
  const percent = getFloorLoadPercent(floor);
  if (percent >= 80) return 'HIGH';
  if (percent >= 40) return 'MEDIUM';
  return 'LOW';
}

function getFloorLoadLabelClass(floor: FloorHeat) {
  const percent = getFloorLoadPercent(floor);
  if (percent >= 80) return currentFloor.value === floor.floor ? 'text-rose-600' : 'text-rose-300';
  if (percent >= 40) {
    return currentFloor.value === floor.floor ? 'text-orange-700' : 'text-orange-300';
  }
  return currentFloor.value === floor.floor ? 'text-teal-700' : 'text-teal-300';
}

function getHttpBaseUrl() {
  const configured = import.meta.env.VITE_BACKEND_API_URL as string | undefined;
  if (configured) return configured.replace(/\/$/, '');

  const wsBase =
    (import.meta.env.VITE_BACKEND_WS_URL as string | undefined) || 'ws://localhost:8080';
  return wsBase.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/$/, '');
}

async function fetchFloorTraffic() {
  const endpoint = `${getHttpBaseUrl()}/api/v1/library/floors`;

  try {
    const response = await fetch(endpoint, { method: 'GET' });
    if (!response.ok) return;

    const payload = (await response.json()) as FloorTrafficDto[] | { data?: FloorTrafficDto[] };
    const floors = Array.isArray(payload)
      ? payload
      : Array.isArray(payload.data)
        ? payload.data
        : [];
    if (!floors.length) return;

    const normalized = floors
      .map((item) => {
        if (typeof item.floor !== 'number') return null;

        const zoneCapacitySum = (item.zones || []).reduce((sum, zone) => {
          const zoneCapacity =
            typeof zone.capacity === 'number' && zone.capacity > 0 ? zone.capacity : 0;
          return sum + zoneCapacity;
        }, 0);

        const capacity =
          typeof item.capacity === 'number' && item.capacity > 0
            ? item.capacity
            : zoneCapacitySum > 0
              ? zoneCapacitySum
              : DEFAULT_FLOOR_CAPACITY;
        const occupancyFromApi =
          typeof item.occupancy === 'number' ? clampOccupancy(item.occupancy, capacity) : null;
        const existing = floorHeatData.value.find((f) => f.floor === item.floor);
        return {
          floor: item.floor,
          occupancy: occupancyFromApi ?? clampOccupancy(existing?.occupancy ?? 0, capacity),
          capacity,
        };
      })
      .filter((item): item is FloorHeat => item !== null);

    if (!normalized.length) return;

    const occupancyByFloor = new Map(normalized.map((item) => [item.floor, item]));
    floorHeatData.value = normalized.map((item) => ({
      floor: item.floor,
      occupancy: occupancyByFloor.get(item.floor)?.occupancy ?? item.occupancy,
      capacity: occupancyByFloor.get(item.floor)?.capacity ?? item.capacity,
    }));

    floorMetaData.value = floors;

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
    // endpoint 未就緒時維持現有畫面，不中斷互動
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

function startEditDisplayName() {
  isEditingDisplayName.value = true;
}

function applyDisplayName() {
  const normalized =
    displayNameInput.value.trim().slice(0, 20) || `Reader-${userId.value.slice(-4)}`;
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

const initWebSocket = () => {
  if (socket) {
    socket.close();
  }
  const baseUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8080';
  const url = `${baseUrl}/api/v1/library/ws?floor=${currentFloor.value}&zone=${activeZoneId.value}&userId=${userId.value}`;
  socket = new WebSocket(url);

  // --- 1. 連線成功：發送進場訊號 (JOIN) ---
  socket.onopen = () => {
    socket?.send(
      JSON.stringify({
        type: 'JOIN',
        userId: userId.value,
        payload: {
          state: 'READY',
          username: displayName.value,
          seatId: selectedSeatId.value, // 如果重整前有選位，帶入原本的位置
        },
      }),
    );
  };

  // --- 2. 收到訊息：數據更新與廣播邏輯 ---
  socket.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);

      switch (msg.type) {
        case 'SYNC_ALL': {
          // 初始同步：把目前房間裡所有人的狀態拿回來
          const synchronizedReaders: Reader[] = [];
          Object.keys(msg.data).forEach((uid) => {
            const payload =
              typeof msg.data[uid] === 'string' ? JSON.parse(msg.data[uid]) : msg.data[uid];
            synchronizedReaders.push({
              userId: uid,
              displayName: payload.username || payload.name || uid,
              seatId: payload.seatId,
              state: payload.state || 'FOCUS',
            });
          });
          readers.value = synchronizedReaders;
          updateCurrentFloorHeatByReaders();
          break;
        }

        case 'JOIN': {
          // 🟢 有人進場邏輯
          const joinIdx = readers.value.findIndex((r) => r.userId === msg.userId);
          const joinReader: Reader = {
            userId: msg.userId,
            displayName: msg.payload?.username || msg.userId,
            seatId: msg.payload?.seatId,
            state: msg.payload?.state || 'READY',
          };

          // 更新數據
          if (joinIdx !== -1) readers.value[joinIdx] = joinReader;
          else readers.value.push(joinReader);
          // 廣播通知：只有別人的 JOIN 才跳 Toast
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
          const isTargetingMySeat = msg.payload.seatId === selectedSeatId.value;

          // 🔴 核心邏輯：如果別人搶了我的位子
          if (isSomeoneElse && isTargetingMySeat) {
            isShake.value = true; // 觸發震動
            selectedSeatId.value = null;
            setTimeout(() => (isShake.value = false), 500); // 結束震動
            $q.notify({
              message: '🛑 哎呀！這個位子剛剛被搶先入座了',
              color: 'negative',
              icon: 'priority_high',
              position: 'top',
              timeout: 2000,
              classes: 'font-black',
            });
          }

          // 原有的 readers 更新邏輯保持不變...
          const moveIdx = readers.value.findIndex((r) => r.userId === msg.userId);
          const moveReader: Reader = {
            userId: msg.userId,
            displayName: msg.payload?.username || msg.userId,
            seatId: msg.payload.seatId,
            state: msg.payload.state || 'FOCUS',
          };
          if (moveIdx !== -1) readers.value[moveIdx] = moveReader;
          else readers.value.push(moveReader);
          updateCurrentFloorHeatByReaders();
          break;
        }

        case 'LEAVE':
          // 🔴 有人離座邏輯
          readers.value = readers.value.filter((r) => r.userId !== msg.userId);
          updateCurrentFloorHeatByReaders();
          // 如果你希望有人離開也有通知，可以在這補 $q.notify
          break;

        case 'ERROR': {
          // 1. 判斷是否為搶位失敗
          if (msg.message === 'SEAT_TAKEN') {
            // 2. 啟動震動效果 (這是在 grid 上的 class)
            isShake.value = true;

            // 3. 重置本地選擇 (這會讓 UI 自動回到空位或原本的位置)
            selectedSeatId.value = null;

            // 4. 500ms 後移除震動狀態
            setTimeout(() => {
              isShake.value = false;
            }, 500);

            // 5. 噴出提示讓使用者知道原因
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
      console.error('❌ 解析 WebSocket 訊息失敗:', err);
    }
  };

  socket.onclose = () => {
    console.log('🚪 WebSocket 連線已斷開');
  };

  socket.onerror = (error) => {
    console.error('💥 WebSocket 發生錯誤:', error);
  };
};

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
  // 增加條件：如果正在切換中，直接 return
  if (getMateAtSeat(id) || store.isRunning || isSwitching.value) return;

  // 2. 開鎖
  isSwitching.value = true;
  selectedSeatId.value = id;

  if (socket?.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: 'MOVE',
        userId: userId.value,
        payload: { seatId: id, state: 'READY', username: displayName.value },
      }),
    );
  }

  // 3. 設定 500ms 後才能再次點擊 (或是等 WS 回應後再解鎖)
  setTimeout(() => {
    isSwitching.value = false;
  }, 500);
}

// --- 動作方法 ---
function toggleFocus() {
  if (store.isRunning) {
    store.stopTimer();
  } else {
    store.startTimer();
  }
}

function seatButtonClass(seat: Seat) {
  if (!seat.available) return 'opacity-10 grayscale cursor-not-allowed border-transparent';

  // 🟢 我選的位子 + 切換中狀態
  if (selectedSeatId.value === seat.id) {
    return [
      'border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-105 z-10',
      isSwitching.value ? 'animate-pulse cursor-wait opacity-70' : '', // 增加等待感
    ].join(' ');
  }

  const otherMate = getMateAtSeat(seat.id);
  if (otherMate) return 'border-teal-500/30 bg-teal-500/5 cursor-default';

  return 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10';
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

watch([currentFloor, activeZoneId], () => {
  isLoading.value = true;
  selectedSeatId.value = null;
  initWebSocket();
  void fetchFloorTraffic();
  setTimeout(() => {
    isLoading.value = false;
  }, 500);
});

watch(
  () => store.timeLeft,
  (newTime) => {
    const status = store.isRunning ? '專注中' : '待命中';
    document.title = `${formatTime(newTime)} | ${status}`;
  },
  { immediate: true },
);

onMounted(() => {
  initWebSocket();
  void fetchFloorTraffic();
  startFloorPollingTimer();
  document.addEventListener('visibilitychange', handleVisibilityChange);
});

onUnmounted(() => {
  socket?.close();
  clearFloorPollingTimer();
  document.removeEventListener('visibilitychange', handleVisibilityChange);
});

// --- 監聽器 ---
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
