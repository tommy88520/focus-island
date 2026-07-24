<template>
  <nav
    class="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 p-1.5 backdrop-blur-xl no-scrollbar"
  >
    <button
      v-for="item in floors"
      :key="item.floor"
      @click="$emit('update:currentFloor', item.floor)"
      class="group relative overflow-hidden rounded-xl px-4 py-3 transition-all duration-500"
      :class="currentFloor === item.floor ? 'bg-white shadow-2xl scale-105' : 'hover:bg-slate-100 dark:hover:!bg-white/5'"
    >
      <div
        class="absolute bottom-0 left-0 w-full transition-all duration-1000 opacity-20"
        :class="item.heatClass"
        :style="{ height: `${item.percent}%` }"
      ></div>

      <div class="relative z-10 flex flex-col items-center">
        <span
          class="text-xs font-black tracking-tighter"
          :class="
            currentFloor === item.floor
              ? 'text-slate-900'
              : 'text-slate-400 dark:!text-white/50 group-hover:text-slate-500 dark:group-hover:text-white/75'
          "
        >
          {{ item.floor }}樓
        </span>
        <div class="mt-1 h-1 w-1 rounded-full animate-pulse" :class="item.heatClass"></div>
        <span
          class="mt-1 text-[8px] font-black tracking-tight"
          :class="currentFloor === item.floor ? 'text-slate-700' : 'text-slate-400 dark:!text-white/50'"
        >
          {{ item.occupancy }}/{{ item.capacity }}
        </span>
        <span class="text-[7px] font-black tracking-[0.2em]" :class="item.labelClass">
          {{ item.label }}
        </span>
      </div>
    </button>
  </nav>
</template>

<script setup lang="ts">
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
