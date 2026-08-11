<template>
  <div class="relative">
    <div
      class="relative grid grid-cols-3 gap-2.5 transition-all duration-500 sm:grid-cols-4 sm:gap-6 md:grid-cols-6"
      :class="{ 'shake-error': isShake, 'opacity-0 scale-95': isLoading }"
    >
      <div v-for="seat in seats" :key="seat.id" class="relative">
        <button
          :disabled="!seat.available || disabled"
          @click="$emit('select', seat.id)"
          class="w-full aspect-square"
          :class="seatButtonClass(seat)"
        >
          <div v-if="selectedSeatId === seat.id" class="flex flex-col items-center">
            <div class="relative">
              <div
                class="h-9 w-9 sm:h-12 sm:w-12 rounded-full bg-slate-800 border-2 border-amber-400 text-amber-100 shadow-[0_0_15px_rgba(251,191,36,0.4)] flex items-center justify-center text-xs sm:text-sm font-black"
              >
                {{ t.common.meLabel }}
              </div>
              <div
                class="absolute -bottom-0.5 -right-0.5 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-slate-900 bg-amber-400 shadow-lg"
              ></div>
            </div>
            <span class="absolute -bottom-6 text-[8px] font-black uppercase tracking-widest text-amber-400">{{ t.common.meLabel }}</span>
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
            <span class="absolute -bottom-6 text-[8px] font-black uppercase tracking-widest text-slate-400 dark:!text-white/55">
              {{ getMateAtSeat(seat.id)?.displayName }}
            </span>
          </div>

          <template v-else>
            <span class="text-xl sm:text-2xl mb-1">{{ seat.icon }}</span>
            <span class="text-[8px] font-black opacity-30 tracking-tighter">{{ seat.id }}</span>
          </template>
        </button>
      </div>
    </div>

    <div
      v-if="isLoading"
      class="absolute inset-x-0 bottom-0 top-24 flex items-center justify-center px-4 pointer-events-none sm:top-32 sm:px-10"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="h-12 w-12 border-4 border-amber-400/20 border-t-amber-400 rounded-full animate-spin"></div>
        <p class="text-amber-400/80 font-black text-[10px] tracking-[0.4em] uppercase">{{ t.seatGrid.syncingFloor(currentFloor) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Reader } from 'src/pages/index/composables/useLibrarySocket';
import { useLocale } from 'src/composables/useLocale';

const { t } = useLocale();

export interface Seat {
  id: string;
  icon: string;
  available: boolean;
}

defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  isShake: boolean;
  isLoading: boolean;
  currentFloor: number;
  disabled: boolean;
  seatButtonClass: (seat: Seat) => string;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
}>();

defineEmits<{
  select: [seatId: string];
}>();
</script>

<style scoped>
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
