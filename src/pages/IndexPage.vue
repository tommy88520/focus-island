<template>
  <div class="relative min-h-[calc(100vh-80px)] px-4 py-4 sm:px-6 lg:py-8">
    <div class="relative z-10 mx-auto max-w-7xl">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        
        <main class="lg:col-span-8 space-y-6">
          <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <div class="px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 text-[10px] font-black tracking-widest uppercase shadow-lg shadow-amber-400/20">
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

            <nav class="flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar">
              <button 
                v-for="f in floorHeatData" :key="f.floor"
                @click="currentFloor = f.floor"
                class="relative px-4 py-3 rounded-xl transition-all duration-500 group overflow-hidden"
                :class="currentFloor === f.floor ? 'bg-white shadow-2xl scale-105' : 'hover:bg-white/5'"
              >
                <div 
                  class="absolute bottom-0 left-0 w-full transition-all duration-1000 opacity-20"
                  :class="getHeatColor(f.occupancy)"
                  :style="{ height: `${f.occupancy}%` }"
                ></div>

                <div class="relative z-10 flex flex-col items-center">
                  <span 
                    class="text-xs font-black tracking-tighter"
                    :class="currentFloor === f.floor ? 'text-slate-900' : 'text-white/30 group-hover:text-white/60'"
                  >
                    {{ f.floor }}F
                  </span>
                  <div class="mt-1 h-1 w-1 rounded-full animate-pulse" :class="getHeatColor(f.occupancy)"></div>
                </div>
              </button>
            </nav>
          </header>

          <section class="rounded-[40px] border border-white/10 bg-slate-900/40 p-4 sm:p-10 backdrop-blur-md shadow-2xl relative min-h-[550px]">
            
            <div class="flex items-center gap-6 mb-10 border-b border-white/5 overflow-x-auto no-scrollbar">
              <button 
                v-for="zone in floorZones" :key="zone.id"
                @click="activeZoneId = zone.id"
                class="pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative group flex-shrink-0"
                :class="activeZoneId === zone.id ? 'text-amber-400' : 'text-white/20 hover:text-white/40'"
              >
                <div class="flex items-center gap-2" :class="getZoneHeatTextClass(zone.occupancy)">
                  {{ zone.name }}
                  <span class="text-[8px] px-1.5 py-0.5 rounded-full bg-white/5 border border-white/10 group-hover:border-amber-400/30">
                    {{ zone.occupancy }}
                  </span>
                </div>
                <div v-if="activeZoneId === zone.id" class="absolute bottom-0 left-0 w-full h-1 bg-amber-400 rounded-full"></div>
              </button>
            </div>

            <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 sm:gap-6 relative transition-all duration-500" :class="{ 'opacity-0 scale-95': isLoading }">
              <div v-for="seat in currentSeats" :key="seat.id" class="relative">
                <button
                  :disabled="!seat.available || store.isRunning"
                  @click="selectSeat(seat.id)"
                  class="w-full aspect-square rounded-2xl sm:rounded-3xl border-2 flex flex-col items-center justify-center transition-all duration-500 relative overflow-hidden group"
                  :class="seatButtonClass(seat)"
                >
                  <template v-if="!getMateAtSeat(seat.id)">
                    <span class="text-xl sm:text-2xl mb-1 group-hover:scale-110 transition-transform">{{ seat.icon }}</span>
                    <span class="text-[8px] font-black opacity-30 tracking-tighter">{{ seat.id }}</span>
                  </template>

                  <div v-else class="flex flex-col items-center">
                    <div class="relative">
                      <div class="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-slate-800 border-2 border-teal-500/30 flex items-center justify-center text-xs sm:text-sm font-black text-teal-100 shadow-inner">
                        {{ getMateAtSeat(seat.id)?.name[0] }}
                      </div>
                      <div class="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-slate-900 bg-teal-400 shadow-[0_0_8px_rgba(45,212,191,0.6)]"></div>
                    </div>
                  </div>

                  <div v-if="selectedSeatId === seat.id" class="absolute inset-0 border-2 border-amber-400 bg-amber-400/10 animate-pulse pointer-events-none"></div>
                </button>
              </div>
            </div>

            <div v-if="isLoading" class="absolute inset-x-0 bottom-0 top-32 px-4 sm:px-10 flex items-center justify-center pointer-events-none">
               <div class="flex flex-col items-center gap-4">
                  <div class="h-12 w-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
                  <p class="text-amber-400/60 font-black text-[10px] tracking-[0.4em] uppercase">Syncing Floor {{ currentFloor }}...</p>
               </div>
            </div>
          </section>
        </main>

        <aside class="lg:col-span-4 space-y-6">
          <div class="rounded-[40px] border border-white/10 bg-slate-900/60 p-8 text-center shadow-2xl backdrop-blur-xl relative overflow-hidden">
             <div class="absolute -top-24 -right-24 h-48 w-48 bg-amber-400/5 blur-[80px] rounded-full"></div>

             <div class="mb-10 h-56 w-56 mx-auto rounded-full border-[12px] border-white/5 flex flex-col items-center justify-center relative shadow-[inset_0_0_40px_rgba(0,0,0,0.3)]">
                <div class="absolute inset-[-12px] rounded-full border-[12px] border-transparent border-t-amber-400 animate-spin-slow" v-if="store.isRunning"></div>
                <div class="text-[10px] font-black text-amber-200/40 tracking-[0.5em] mb-2 uppercase">Remaining</div>
                <div class="text-6xl font-mono font-black text-white tracking-tighter">{{ formattedTime }}</div>
             </div>

             <div class="space-y-4 relative z-10">
                <button 
                  @click="toggleFocus" 
                  :disabled="!selectedSeatId && !store.isRunning" 
                  class="w-full py-5 rounded-3xl font-black tracking-[0.2em] transition-all active:scale-95 shadow-2xl"
                  :class="store.isRunning ? 'bg-rose-500 text-white shadow-rose-500/20' : 'bg-white text-slate-900 shadow-white/10 hover:bg-amber-50'"
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
import { ref, computed, watch } from 'vue';
import { usePomodoroStore } from 'src/stores/pomodoro';

// --- 型別與介面 ---
interface Zone {
  id: string;
  name: string;
  description: string;
  occupancy: string;
}

interface Reader {
  name: string;
  seatId: string;
  state: 'FOCUS' | 'BREAK' | 'READY';
}

interface Seat {
  id: string;
  icon: string;
  available: boolean;
}

interface FloorHeat {
  floor: number;
  occupancy: number; // 0-100
}

const store = usePomodoroStore();

// --- 樓層熱度數據 (未來由 API 定時更新) ---
const floorHeatData = ref<FloorHeat[]>([
  { floor: 1, occupancy: 88 },
  { floor: 2, occupancy: 35 },
  { floor: 3, occupancy: 12 },
  { floor: 4, occupancy: 55 },
  { floor: 5, occupancy: 95 },
]);

// --- 狀態控制 ---
const currentFloor = ref(2);
const activeZoneId = ref('A');
const isLoading = ref(false);
const selectedSeatId = ref<string | null>(null);

const floorZones: Zone[] = [
  { id: 'A', name: 'Silent Forest', description: '完全靜音深度專注', occupancy: '12/24' },
  { id: 'B', name: 'Urban Cafe', description: '環境音輕柔交流', occupancy: '18/24' },
  { id: 'C', name: 'Deep Sea', description: '封閉式專注座艙', occupancy: '4/24' },
  { id: 'D', name: 'Sky Lounge', description: '開放式景觀座位', occupancy: '0/24' },
];

const currentZone = computed<Zone | undefined>(() => 
  floorZones.find(z => z.id === activeZoneId.value)
);

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
  return Array.from({ length: 24 }, (_, i) => ({
    id: `${prefix}-${i + 1}`,
    icon: i % 3 === 0 ? '📚' : i % 3 === 1 ? '💻' : '✍️',
    available: i !== 11,
  }));
});

const readers = ref<Reader[]>([
  { name: 'Lead_Viberse', seatId: '2A-3', state: 'FOCUS' },
  { name: 'Alex', seatId: '2A-8', state: 'BREAK' },
  { name: 'Sarah', seatId: '2B-1', state: 'FOCUS' },
]);

const getMateAtSeat = (seatId: string) => readers.value.find(r => r.seatId === seatId);

const formattedTime = computed(() => {
  const m = Math.floor(store.timeLeft / 60);
  const s = store.timeLeft % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const selectedSeatLabel = computed(() => {
  if (store.isRunning && selectedSeatId.value) return `Currently Sitting At ${selectedSeatId.value}`;
  return selectedSeatId.value ? `Reserved Seat ${selectedSeatId.value}` : 'Please Select a Seat';
});

// --- 動作方法 ---
function selectSeat(id: string) {
  if (getMateAtSeat(id)) return;
  selectedSeatId.value = id;
}

function toggleFocus() {
  if (store.isRunning) {
    store.stopTimer();
  } else {
    store.startTimer();
  }
}

function seatButtonClass(seat: Seat) {
  const isTaken = getMateAtSeat(seat.id);
  if (!seat.available) return 'opacity-10 grayscale cursor-not-allowed border-transparent';
  if (isTaken) return 'border-teal-500/30 bg-teal-500/5 cursor-default';
  if (selectedSeatId.value === seat.id) return 'border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-105 z-10';
  return 'border-white/5 bg-white/5 hover:border-white/20 hover:bg-white/10';
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// --- 監聽器 ---
watch([currentFloor, activeZoneId], () => {
  isLoading.value = true;
  selectedSeatId.value = null; 
  setTimeout(() => { isLoading.value = false; }, 500);
});

watch(
  () => store.timeLeft,
  (newTime) => {
    const status = store.isRunning ? '專注中' : '待命中';
    document.title = `${formatTime(newTime)} | ${status}`;
  },
  { immediate: true },
);
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
.animate-spin-slow { animation: spin 12s linear infinite; }
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
</style>