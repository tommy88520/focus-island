<template>
  <div
    class="mb-6 flex items-center gap-4 overflow-x-auto border-b border-slate-200 dark:!border-white/5 no-scrollbar sm:mb-10 sm:gap-6"
  >
    <button
      v-for="zone in zones"
      :key="zone.id"
      @click="$emit('update:activeZoneId', zone.id)"
      class="group flex-shrink-0 pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative sm:pb-4"
      :class="
        activeZoneId === zone.id ? 'text-amber-400' : 'text-slate-300 dark:!text-white/45 hover:text-slate-400 dark:hover:!text-white/55'
      "
    >
      <div class="flex items-center gap-2" :class="zone.heatTextClass">
        {{ zone.name }}
        <span
          class="rounded-full border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 px-1.5 py-0.5 text-[8px] group-hover:border-amber-400/30"
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
</template>

<script setup lang="ts">
export interface ZoneTabItem {
  id: string;
  name: string;
  occupancy: string;
  heatTextClass: string;
}

defineProps<{
  zones: ZoneTabItem[];
  activeZoneId: string;
}>();

defineEmits<{
  'update:activeZoneId': [zoneId: string];
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
