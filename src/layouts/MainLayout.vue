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
            <a 
              v-for="link in linksList" 
              :key="link.title" 
              href="#" 
              class="group flex items-center gap-4 rounded-2xl border border-transparent px-4 py-3 transition-all duration-300 hover:bg-white/5 hover:border-white/10"
            >
              <span class="text-xl group-hover:scale-125 transition-transform">{{ link.icon }}</span>
              <div class="flex-1">
                <span class="block text-sm font-bold text-slate-300 group-hover:text-white">{{ link.title }}</span>
                <span class="block text-[10px] text-slate-500">{{ link.caption }}</span>
              </div>
              <span v-if="link.badge" class="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-black text-orange-400 uppercase tracking-tighter">{{ link.badge }}</span>
            </a>
          </nav>

          <div class="mt-auto pt-6 border-t border-white/5">
            <div class="flex items-center gap-3 p-2">
               <div class="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-amber-200">TH</div>
               <div class="flex-1">
                  <p class="text-xs font-black text-white leading-none mb-1">Tommy Huang</p>
                  <p class="text-[10px] text-amber-100/40 tracking-tight">Focusing on Golang</p>
               </div>
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
import { ref, computed } from 'vue';

const leftDrawerOpen = ref(false);

const linksList = [
  { title: '選位入座', caption: 'Pick a desk', icon: '🪑', badge: 'NEW' },
  { title: '今日進度', caption: 'Flow history', icon: '📊' },
  { title: '環境設定', caption: 'Adjust sound', icon: '⚙️' },
];

const focusDateLabel = computed(() => {
  return new Intl.DateTimeFormat('zh-TW', {
    month: 'long', day: 'numeric', weekday: 'short'
  }).format(new Date());
});

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value;
}
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