<template>
  <nav
    class="flex items-center gap-1 overflow-x-auto rounded-xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 p-1 backdrop-blur-xl no-scrollbar"
  >
    <button
      v-for="item in floors"
      :key="item.floor"
      @click="$emit('update:currentFloor', item.floor)"
      class="group relative overflow-hidden rounded-lg px-3 py-1 transition-all duration-500"
      :class="currentFloor === item.floor ? 'bg-white shadow-lg' : 'hover:bg-slate-100 dark:hover:!bg-white/5'"
    >
      <div
        class="absolute bottom-0 left-0 w-full transition-all duration-1000 opacity-20"
        :class="item.heatClass"
        :style="{ height: `${item.percent}%` }"
      ></div>

      <div class="relative z-10 flex items-center gap-1.5">
        <span
          class="text-xs font-black tracking-tighter"
          :class="
            currentFloor === item.floor
              ? 'text-slate-900'
              : 'text-slate-400 dark:!text-white/50 group-hover:text-slate-500 dark:group-hover:text-white/75'
          "
        >
          {{ t.floorTabs.floorLabel(item.floor) }}
        </span>
        <span
          class="text-[9px] font-black tracking-tight"
          :class="currentFloor === item.floor ? 'text-slate-700' : 'text-slate-400 dark:!text-white/50'"
        >
          {{ item.occupancy }}/{{ item.capacity }}
        </span>
        <span class="text-[8px] font-black" :class="item.labelClass">
          {{ item.label }}
        </span>
      </div>
    </button>
  </nav>
</template>

<script setup lang="ts">
import { useLocale } from 'src/composables/useLocale';

const { t } = useLocale();

export interface FloorTabItem {
  floor: number;
  occupancy: number;
  capacity: number;
  percent: number;
  heatClass: string;
  label: string;
  labelClass: string;
}

defineProps<{
  floors: FloorTabItem[];
  currentFloor: number;
}>();

defineEmits<{
  'update:currentFloor': [floor: number];
}>();
</script>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
