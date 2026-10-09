<template>
  <nav
    class="pixel-field flex !flex-nowrap items-center gap-1 overflow-x-auto p-1 no-scrollbar"
  >
    <button
      v-for="item in floors"
      :key="item.floor"
      @click="$emit('update:currentFloor', item.floor)"
      class="group relative overflow-hidden rounded-[3px] px-3 py-1 transition-all"
      :class="currentFloor === item.floor ? 'bg-[color:var(--px-accent)] outline outline-2 outline-[color:var(--px-ink)]' : 'hover:bg-[color:var(--px-panel)]'"
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
              ? 'font-pixel text-[#3b2a20]'
              : 'text-slate-400 dark:!text-white/50 group-hover:text-slate-500 dark:group-hover:text-white/75'
          "
        >
          {{ t.floorTabs.floorLabel(item.floor) }}
        </span>
        <span
          class="text-[9px] font-black tracking-tight"
          :class="currentFloor === item.floor ? 'text-[#3b2a20]' : 'text-slate-400 dark:!text-white/50'"
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
