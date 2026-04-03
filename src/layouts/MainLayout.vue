<template>
  <q-layout view="lHh Lpr lFf" class="bg-slate-950 font-sans antialiased text-amber-50">
    
    <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -left-24 -top-20 h-96 w-96 rounded-full bg-rose-500/10 blur-[120px]"></div>
      <div class="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>

    <q-header class="bg-transparent pt-4 px-4" flat>
      <div class="mx-auto max-w-7xl flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 shadow-2xl backdrop-blur-md">
        <q-btn 
          flat dense round icon="menu" 
          class="lg:hidden text-amber-200" 
          @click="toggleLeftDrawer" 
        />

        <div class="flex items-center gap-3">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-rose-300 to-amber-400 font-black text-amber-950 shadow-lg shadow-orange-500/20">FI</div>
          <div class="hidden sm:block">
            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/60 leading-none mb-1">Cute Library</div>
            <div class="text-base font-black text-white leading-none">Focus Island</div>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-3">
          <div class="flex flex-col items-end hidden xs:block">
             <span class="text-[10px] font-bold text-amber-200/40 uppercase tracking-widest">Today's Goal</span>
             <span class="text-xs font-black text-orange-400">6h Focused</span>
          </div>
          <div class="h-8 w-[1px] bg-white/10 mx-1"></div>
          <span class="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-[10px] font-mono text-amber-100/50">v{{ $q.version }}</span>
        </div>
      </div>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="280"
      class="bg-transparent"
    >
      <div class="flex flex-col h-full p-4 lg:pl-4 lg:pr-0 lg:py-8">
        <aside class="flex flex-col h-full rounded-[32px] border border-white/10 bg-slate-900/50 backdrop-blur-xl p-6 shadow-2xl">
          <div class="mb-8 p-4 rounded-2xl bg-white/5 border border-white/5">
            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/50 mb-2">Current Status</div>
            <div class="text-xl font-black text-white">{{ focusDateLabel }}</div>
            <p class="mt-2 text-[10px] text-amber-100/40 leading-relaxed italic">
              "Slow down. Sit down. Focus now."
            </p>
          </div>

          <nav class="space-y-2 flex-1">
            <div class="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-amber-200/30">Menu</div>
            <button
              v-for="link in linksList"
              :key="link.title"
              type="button"
              :disabled="!link.enabled"
              class="group flex w-full items-center gap-4 rounded-2xl border px-4 py-3 text-left transition-all duration-300"
              :class="[
                link.enabled
                  ? 'border-transparent hover:bg-white/5 hover:border-white/10'
                  : 'cursor-not-allowed border-white/5 bg-white/[0.02] opacity-55',
                link.enabled && isRouteActive(link.to)
                  ? 'border-amber-300/35 bg-amber-400/10'
                  : '',
              ]"
              @click="handleMenuClick(link)"
            >
              <span class="text-xl group-hover:scale-125 transition-transform">{{ link.icon }}</span>
              <div class="flex-1">
                <span class="block text-sm font-bold text-slate-300 group-hover:text-white">{{ link.title }}</span>
                <span class="block text-[10px] text-slate-500">{{ link.caption }}</span>
              </div>
              <span
                v-if="link.badge"
                class="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-black text-orange-400 uppercase tracking-tighter"
              >
                {{ link.badge }}
              </span>
            </button>
          </nav>

          <div class="mt-auto pt-6 border-t border-white/5">
            <div class="rounded-2xl border border-white/10 bg-white/5 p-3">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/50">目前房間</p>
              <p class="mt-1 text-sm font-black text-white">{{ currentRoomInfo.roomID }}</p>
              <p class="mt-1 text-[11px] text-amber-100/65">{{ currentRoomInfo.roomName }}</p>
              <p class="mt-1 text-[10px] text-amber-100/35">{{ currentRoomInfo.zoneDescription }}</p>
            </div>
          </div>
        </aside>
      </div>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>

  </q-layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const leftDrawerOpen = ref(false);
const router = useRouter();
const route = useRoute();
const CURRENT_ROOM_INFO_KEY = 'focus_island_current_room_info_v1';

const currentRoomInfo = ref({
  roomID: '--',
  roomName: '尚未選擇房間',
  zoneDescription: '請先到選位入座頁面選擇分區',
});

const linksList = [
  { title: '選位入座', caption: 'Pick a desk', icon: '🪑', badge: 'LIVE', to: '/', enabled: true },
  {
    title: '今日進度',
    caption: 'Flow history',
    icon: '📊',
    badge: 'LIVE',
    to: '/progress',
    enabled: true,
  },
  {
    title: '環境設定',
    caption: 'Adjust sound',
    icon: '⚙️',
    badge: 'SOON',
    to: '/settings',
    enabled: false,
  },
];

const focusDateLabel = computed(() => {
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'long', day: 'numeric', weekday: 'short'
  }).format(new Date());
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}

function isRouteActive(targetPath?: string) {
  if (!targetPath) return false;
  return route.path === targetPath;
}

function handleMenuClick(link: (typeof linksList)[number]) {
  if (!link.enabled || !link.to) return;
  if (route.path !== link.to) {
    void router.push(link.to);
  }
  leftDrawerOpen.value = false;
}

function refreshCurrentRoomInfo() {
  const raw = localStorage.getItem(CURRENT_ROOM_INFO_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as {
      roomID?: string;
      roomName?: string;
      zoneDescription?: string;
    };

    currentRoomInfo.value = {
      roomID: parsed.roomID || '--',
      roomName: parsed.roomName || '尚未選擇房間',
      zoneDescription: parsed.zoneDescription || '請先到選位入座頁面選擇分區',
    };
  } catch {
    // ignore malformed room payload
  }
}

onMounted(() => {
  refreshCurrentRoomInfo();
  window.addEventListener('focus-room-updated', refreshCurrentRoomInfo as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('focus-room-updated', refreshCurrentRoomInfo as EventListener);
});
</script>

<style lang="scss">
/* 移除 Quasar 側邊欄預設的背景色與陰影 */
.q-drawer {
  background: transparent !important;
}
.q-layout {
  min-height: 100vh;
}
</style>