<template>
    <q-layout view="lHh Lpr lFf" :class="['font-sans antialiased', layoutThemeClass]">
    
    <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -left-24 -top-20 h-96 w-96 rounded-full bg-rose-500/10 blur-[120px]"></div>
      <div class="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      <div class="hidden dark:!block absolute inset-0 starfield-far"></div>
      <div class="hidden dark:!block absolute inset-0 starfield-near"></div>
    </div>

    <q-header class="bg-transparent px-2 pt-2 sm:px-4 sm:pt-4" flat>
      <div
        class="mx-auto flex max-w-7xl items-center gap-2 rounded-[20px] border px-3 py-2 shadow-2xl backdrop-blur-md sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
        :class="headerSurfaceClass"
      >
        <q-btn 
          flat dense round icon="menu" 
          class="lg:hidden shrink-0 text-amber-600 dark:!text-amber-200"
          @click="toggleLeftDrawer" 
        />

        <div class="flex items-center gap-2 sm:gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-300 to-amber-400 font-black text-[10px] text-amber-950 shadow-lg shadow-orange-500/20 sm:h-9 sm:w-9 sm:text-base">FI</div>
          <div class="hide-below-sm sm:block">
            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-700 dark:!text-amber-200/80 leading-none mb-1">Cute Library</div>
            <div class="text-base font-black text-white leading-none">Focus Island</div>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-1.5 sm:gap-3">
          <div class="hide-below-sm flex-col items-end sm:flex">
            <span class="text-[10px] font-bold uppercase tracking-widest" :class="subtleTextClass">
              {{ t.layout.headerGoalLabel }}
            </span>
            <span class="text-xs font-black" :class="accentTextClass">6h Focused</span>
          </div>
          <div class="hide-below-sm h-8 w-[1px] bg-white/10 mx-1 sm:block"></div>
          <button
            type="button"
            class="rounded-lg border px-2 py-1 text-[10px] font-black tracking-[0.18em] transition-all sm:px-2.5"
            :class="chipClass"
            @click="toggleLanguage"
          >
            <span class="inline-flex items-center gap-1">
              <q-icon name="translate" size="12px" />
              <span class="hide-below-sm sm:inline">{{ t.layout.languageButton }}</span>
            </span>
          </button>
          <button
            type="button"
            class="rounded-lg border px-2 py-1 text-[10px] font-black tracking-[0.18em] transition-all sm:px-2.5"
            :class="chipClass"
            @click="toggleTheme"
          >
            <span class="inline-flex items-center gap-1">
              <q-icon :name="isDarkMode ? 'dark_mode' : 'light_mode'" size="12px" />
              <span class="hide-below-sm sm:inline">{{ isDarkMode ? t.layout.darkButton : t.layout.lightButton }}</span>
            </span>
          </button>
          <button
            type="button"
            class="rounded-lg border px-2 py-1 text-[10px] font-black tracking-[0.18em] transition-all sm:px-2.5"
            :class="favoriteButtonClass"
            @click="handleFavoriteShortcut"
          >
            <span class="inline-flex items-center gap-1">
              <q-icon name="star" size="12px" />
              <span class="hide-below-sm sm:inline">{{ t.layout.favoriteButton }}</span>
            </span>
          </button>
          <span class="hide-below-sm rounded-lg border px-2 py-1 text-[10px] font-mono sm:inline-flex" :class="chipClass">v{{ $q.version }}</span>
        </div>
      </div>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      :width="$q.screen.lt.sm ? 320 : 280"
      class="bg-transparent"
    >
      <div class="flex h-full flex-col p-3 sm:p-4 lg:pl-4 lg:pr-0 lg:py-8">
        <aside class="flex h-full flex-col rounded-[28px] border p-4 shadow-2xl backdrop-blur-xl sm:rounded-[32px] sm:p-6" :class="drawerSurfaceClass">
          <div class="mb-6 rounded-2xl border p-3 sm:mb-8 sm:p-4" :class="drawerCardClass">
            <div class="mb-2 text-[10px] font-black uppercase tracking-[0.2em]" :class="subtleTextClass">
              {{ t.layout.currentStatusLabel }}
            </div>
            <div class="text-lg font-black text-white sm:text-xl">{{ focusDateLabel }}</div>
            <p class="mt-2 text-[10px] leading-relaxed italic" :class="mutedTextClass">
              "{{ t.layout.currentStatusQuote }}"
            </p>
          </div>

          <nav class="space-y-2 flex-1">
            <div class="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.3em]" :class="subtleTextClass">
              {{ t.layout.menuLabel }}
            </div>
            <button
              v-for="link in localizedLinksList"
              :key="link.key"
              type="button"
              :disabled="!link.enabled"
              class="group flex w-full items-center gap-3 rounded-2xl border px-3 py-3 text-left transition-all duration-300 sm:gap-4 sm:px-4"
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
              <span class="text-lg transition-transform group-hover:scale-125 sm:text-xl">{{ link.icon }}</span>
              <div class="flex-1">
                <span class="block text-sm font-bold group-hover:text-white sm:text-sm" :class="mainTextClass">{{ link.title }}</span>
                <span class="block text-[10px] leading-tight" :class="mutedTextClass">{{ link.caption }}</span>
              </div>
              <span
                v-if="link.badge"
                class="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-black text-orange-400 uppercase tracking-tighter"
              >
                {{ link.badge }}
              </span>
            </button>
          </nav>

          <div class="mt-auto pt-5 border-t border-white/5 sm:pt-6">
            <div class="rounded-2xl border p-3" :class="drawerCardClass">
              <p class="text-[10px] font-black uppercase tracking-[0.2em]" :class="subtleTextClass">{{ t.layout.currentRoomLabel }}</p>
              <p class="mt-1 text-sm font-black" :class="mainTextClass">{{ displayedRoomInfo.roomID }}</p>
              <p class="mt-1 text-[11px]" :class="accentTextClass">{{ displayedRoomInfo.roomName }}</p>
              <p class="mt-1 text-[10px]" :class="mutedTextClass">{{ displayedRoomInfo.zoneDescription }}</p>
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
import { Dark, useQuasar } from 'quasar';
import { useLocale } from 'src/composables/useLocale';

const leftDrawerOpen = ref(false);
const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const CURRENT_ROOM_INFO_KEY = 'focus_island_current_room_info_v1';
const APP_THEME_KEY = 'focus_island_app_theme_v1';
const FAVORITE_ROUTE_KEY = 'focus_island_favorite_route_v1';

const { locale, t, toggleLocale } = useLocale();
const isDarkMode = ref(localStorage.getItem(APP_THEME_KEY) !== 'light');
const favoriteRoute = ref(localStorage.getItem(FAVORITE_ROUTE_KEY) || '');

const currentRoomInfo = ref({
  roomID: '',
  roomName: '',
  zoneDescription: '',
});

const displayedRoomInfo = computed(() => ({
  roomID: currentRoomInfo.value.roomID || '--',
  roomName: currentRoomInfo.value.roomName || t.value.layout.defaultRoomName,
  zoneDescription: currentRoomInfo.value.zoneDescription || t.value.layout.defaultRoomHint,
}));

const linksList = [
  { key: 'seat', icon: '🪑', badge: 'LIVE', to: '/', enabled: true },
  {
    key: 'progress',
    icon: '📊',
    badge: 'LIVE',
    to: '/progress',
    enabled: true,
  },
  {
    key: 'settings',
    icon: '⚙️',
    badge: 'SOON',
    to: '/settings',
    enabled: false,
  },
];

const localizedLinksList = computed(() =>
  linksList.map((link) => ({
    ...link,
    title: t.value.layout.menuItems[link.key as keyof typeof t.value.layout.menuItems].title,
    caption: t.value.layout.menuItems[link.key as keyof typeof t.value.layout.menuItems].caption,
  })),
);
const layoutThemeClass = computed(() =>
  isDarkMode.value ? 'bg-slate-950 text-amber-50' : 'bg-zinc-50 text-slate-900',
);
const headerSurfaceClass = computed(() =>
  isDarkMode.value
    ? 'border-white/10 bg-white/5 text-amber-50'
    : 'border-slate-200 bg-white text-slate-900',
);
const drawerSurfaceClass = computed(() =>
  isDarkMode.value
    ? 'border-white/10 bg-slate-900/50 text-amber-50'
    : 'border-slate-200 bg-white text-slate-900',
);
const drawerCardClass = computed(() =>
  isDarkMode.value ? 'border-white/5 bg-white/5' : 'border-slate-200 bg-slate-50',
);
const chipClass = computed(() =>
  isDarkMode.value ? 'border-white/10 bg-white/5 text-amber-100/85' : 'border-slate-200 bg-slate-50 text-slate-700',
);
const favoriteButtonClass = computed(() =>
  favoriteRoute.value
    ? isDarkMode.value
      ? 'border-amber-300/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
      : 'border-amber-300/60 bg-amber-100 text-amber-900 hover:bg-amber-200'
    : chipClass.value,
);
const mainTextClass = computed(() => (isDarkMode.value ? 'text-slate-300' : 'text-slate-800'));
const mutedTextClass = computed(() => (isDarkMode.value ? 'text-amber-100/55' : 'text-slate-500'));
const subtleTextClass = computed(() => (isDarkMode.value ? 'text-amber-200/60' : 'text-slate-500'));
const accentTextClass = computed(() => (isDarkMode.value ? 'text-amber-100/80' : 'text-slate-700'));

const focusDateLabel = computed(() => {
  return new Intl.DateTimeFormat(locale.value, {
    month: 'long', day: 'numeric', weekday: 'short'
  }).format(new Date());
});

function persistLayoutPreferences() {
  localStorage.setItem(APP_THEME_KEY, isDarkMode.value ? 'dark' : 'light');
  if (favoriteRoute.value) {
    localStorage.setItem(FAVORITE_ROUTE_KEY, favoriteRoute.value);
  } else {
    localStorage.removeItem(FAVORITE_ROUTE_KEY);
  }
}

function toggleLanguage() {
  toggleLocale();
  $q.notify({
    message: locale.value === 'zh-TW' ? '已切換為繁體中文' : 'Language switched to English',
    color: 'primary',
    icon: 'translate',
    timeout: 1400,
    position: 'top',
  });
}

function toggleTheme() {
  isDarkMode.value = !isDarkMode.value;
  Dark.set(isDarkMode.value);
  persistLayoutPreferences();
  $q.notify({
    message: isDarkMode.value ? t.value.layout.darkModeOn : t.value.layout.lightModeOn,
    color: 'primary',
    icon: isDarkMode.value ? 'dark_mode' : 'light_mode',
    timeout: 1400,
    position: 'top',
  });
}

function handleFavoriteShortcut() {
  if (!favoriteRoute.value) {
    favoriteRoute.value = route.path;
    persistLayoutPreferences();
    $q.notify({
      message: t.value.layout.favoriteNone,
      color: 'positive',
      icon: 'star',
      timeout: 1400,
      position: 'top',
    });
    return;
  }

  if (favoriteRoute.value === route.path) {
    $q.notify({
      message: t.value.layout.favoriteSaved,
      color: 'positive',
      icon: 'star',
      timeout: 1200,
      position: 'top',
    });
    return;
  }

  void router.push(favoriteRoute.value);
  leftDrawerOpen.value = false;
  $q.notify({
    message: t.value.layout.favoriteJumped,
    color: 'positive',
    icon: 'star',
    timeout: 1200,
    position: 'top',
  });
}

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
      roomID: parsed.roomID || '',
      roomName: parsed.roomName || '',
      zoneDescription: parsed.zoneDescription || '',
    };
  } catch {
    // ignore malformed room payload
  }
}

onMounted(() => {
  Dark.set(isDarkMode.value);
  persistLayoutPreferences();
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

/* 星空背景（僅深色模式）：兩層不同大小/密度的星點，加上緩慢閃爍 */
.starfield-far,
.starfield-near {
  background-repeat: repeat;
  animation: starfield-twinkle 6s ease-in-out infinite;
}
.starfield-far {
  background-image:
    radial-gradient(1px 1px at 20px 30px, rgba(255, 255, 255, 0.5), transparent),
    radial-gradient(1px 1px at 90px 90px, rgba(255, 255, 255, 0.4), transparent),
    radial-gradient(1px 1px at 150px 50px, rgba(255, 255, 255, 0.35), transparent),
    radial-gradient(1px 1px at 60px 140px, rgba(255, 255, 255, 0.45), transparent),
    radial-gradient(1px 1px at 170px 160px, rgba(255, 255, 255, 0.3), transparent);
  background-size: 200px 200px;
  opacity: 0.5;
  animation-delay: 0s;
}
.starfield-near {
  background-image:
    radial-gradient(1.5px 1.5px at 40px 80px, rgba(251, 191, 36, 0.6), transparent),
    radial-gradient(1.5px 1.5px at 130px 20px, rgba(255, 255, 255, 0.6), transparent),
    radial-gradient(2px 2px at 190px 110px, rgba(255, 255, 255, 0.55), transparent),
    radial-gradient(1.5px 1.5px at 100px 170px, rgba(251, 191, 36, 0.5), transparent);
  background-size: 260px 260px;
  opacity: 0.6;
  animation-delay: 3s;
}
@keyframes starfield-twinkle {
  0%, 100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}
</style>