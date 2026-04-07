<template>
    <q-layout view="lHh Lpr lFf" :class="['font-sans antialiased', layoutThemeClass]">
    
    <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <div class="absolute -left-24 -top-20 h-96 w-96 rounded-full bg-rose-500/10 blur-[120px]"></div>
      <div class="absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-amber-500/10 blur-[120px]"></div>
      <div class="absolute inset-0 bg-[linear-gradient(to_right,rgba(251,191,36,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(251,191,36,0.02)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
    </div>

    <q-header class="bg-transparent px-2 pt-2 sm:px-4 sm:pt-4" flat>
      <div
        class="mx-auto flex max-w-7xl items-center gap-2 rounded-[20px] border px-3 py-2 shadow-2xl backdrop-blur-md sm:gap-3 sm:rounded-2xl sm:px-4 sm:py-3"
        :class="headerSurfaceClass"
      >
        <q-btn 
          flat dense round icon="menu" 
          class="lg:hidden shrink-0 text-amber-200" 
          @click="toggleLeftDrawer" 
        />

        <div class="flex items-center gap-2 sm:gap-3">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-rose-300 to-amber-400 font-black text-[10px] text-amber-950 shadow-lg shadow-orange-500/20 sm:h-9 sm:w-9 sm:text-base">FI</div>
          <div class="hidden sm:block">
            <div class="text-[10px] font-black uppercase tracking-[0.2em] text-amber-200/60 leading-none mb-1">Cute Library</div>
            <div class="text-base font-black text-white leading-none">Focus Island</div>
          </div>
        </div>

        <div class="ml-auto flex items-center gap-1.5 sm:gap-3">
          <div class="hidden flex-col items-end sm:flex">
            <span class="text-[10px] font-bold uppercase tracking-widest" :class="subtleTextClass">
              {{ t.headerGoalLabel }}
            </span>
            <span class="text-xs font-black" :class="accentTextClass">6h Focused</span>
          </div>
          <div class="hidden h-8 w-[1px] bg-white/10 mx-1 sm:block"></div>
          <button
            type="button"
            class="rounded-lg border px-2 py-1 text-[10px] font-black tracking-[0.18em] transition-all sm:px-2.5"
            :class="chipClass"
            @click="toggleLanguage"
          >
            <span class="inline-flex items-center gap-1">
              <q-icon name="translate" size="12px" />
              <span class="hidden sm:inline">{{ t.languageButton }}</span>
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
              <span class="hidden sm:inline">{{ t.favoriteButton }}</span>
            </span>
          </button>
          <span class="hidden rounded-lg border px-2 py-1 text-[10px] font-mono sm:inline-flex" :class="chipClass">v{{ $q.version }}</span>
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
              {{ t.currentStatusLabel }}
            </div>
            <div class="text-lg font-black text-white sm:text-xl">{{ focusDateLabel }}</div>
            <p class="mt-2 text-[10px] leading-relaxed italic" :class="mutedTextClass">
              "{{ t.currentStatusQuote }}"
            </p>
          </div>

          <nav class="space-y-2 flex-1">
            <div class="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.3em]" :class="subtleTextClass">
              {{ t.menuLabel }}
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
              <p class="text-[10px] font-black uppercase tracking-[0.2em]" :class="subtleTextClass">{{ t.currentRoomLabel }}</p>
              <p class="mt-1 text-sm font-black" :class="mainTextClass">{{ currentRoomInfo.roomID }}</p>
              <p class="mt-1 text-[11px]" :class="accentTextClass">{{ currentRoomInfo.roomName }}</p>
              <p class="mt-1 text-[10px]" :class="mutedTextClass">{{ currentRoomInfo.zoneDescription }}</p>
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Dark, useQuasar } from 'quasar';

const leftDrawerOpen = ref(false);
const router = useRouter();
const route = useRoute();
const $q = useQuasar();
const CURRENT_ROOM_INFO_KEY = 'focus_island_current_room_info_v1';
const APP_LOCALE_KEY = 'focus_island_app_locale_v1';
const APP_THEME_KEY = 'focus_island_app_theme_v1';
const FAVORITE_ROUTE_KEY = 'focus_island_favorite_route_v1';

type LocaleKey = 'zh-TW' | 'en-US';

const locale = ref<LocaleKey>((localStorage.getItem(APP_LOCALE_KEY) as LocaleKey | null) || 'zh-TW');
const isDarkMode = ref(localStorage.getItem(APP_THEME_KEY) !== 'light');
const favoriteRoute = ref(localStorage.getItem(FAVORITE_ROUTE_KEY) || '');

const currentRoomInfo = ref({
  roomID: '--',
  roomName: '尚未選擇房間',
  zoneDescription: '請先到選位入座頁面選擇分區',
});

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

const translations = {
  'zh-TW': {
    menuLabel: '選單',
    currentStatusLabel: '目前狀態',
    currentStatusQuote: '放慢速度，坐下來，現在專注。',
    currentRoomLabel: '目前房間',
    headerGoalLabel: "Today's Goal",
    languageButton: '中 / EN',
    darkButton: '黑',
    lightButton: '白',
    favoriteButton: '最愛',
    favoriteSaved: '已設為最愛快捷',
    favoriteNone: '已將目前頁面設為最愛',
    favoriteJumped: '已前往最愛頁面',
    menuItems: {
      seat: { title: '選位入座', caption: '選擇座位並開始專注' },
      progress: { title: '今日進度', caption: '查看完成與累積時間' },
      settings: { title: '環境設定', caption: '調整音效與外觀' },
    },
  },
  'en-US': {
    menuLabel: 'Menu',
    currentStatusLabel: 'Current Status',
    currentStatusQuote: 'Slow down. Sit down. Focus now.',
    currentRoomLabel: 'Current Room',
    headerGoalLabel: "Today's Goal",
    languageButton: '中 / EN',
    darkButton: 'Dark',
    lightButton: 'Light',
    favoriteButton: 'Fav',
    favoriteSaved: 'Favorite shortcut saved',
    favoriteNone: 'This page is now your favorite',
    favoriteJumped: 'Opened favorite page',
    menuItems: {
      seat: { title: 'Seat In', caption: 'Choose a seat and start focus' },
      progress: { title: 'Progress', caption: 'Track focus sessions today' },
      settings: { title: 'Settings', caption: 'Adjust sound and appearance' },
    },
  },
} as const;

const t = computed(() => translations[locale.value]);
const localizedLinksList = computed(() =>
  linksList.map((link) => ({
    ...link,
    title: t.value.menuItems[link.key as keyof typeof t.value.menuItems].title,
    caption: t.value.menuItems[link.key as keyof typeof t.value.menuItems].caption,
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
  isDarkMode.value ? 'border-white/10 bg-white/5 text-amber-100/70' : 'border-slate-200 bg-slate-50 text-slate-700',
);
const favoriteButtonClass = computed(() =>
  favoriteRoute.value
    ? isDarkMode.value
      ? 'border-amber-300/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20'
      : 'border-amber-300/60 bg-amber-100 text-amber-900 hover:bg-amber-200'
    : chipClass.value,
);
const mainTextClass = computed(() => (isDarkMode.value ? 'text-slate-300' : 'text-slate-800'));
const mutedTextClass = computed(() => (isDarkMode.value ? 'text-amber-100/35' : 'text-slate-500'));
const subtleTextClass = computed(() => (isDarkMode.value ? 'text-amber-200/40' : 'text-slate-500'));
const accentTextClass = computed(() => (isDarkMode.value ? 'text-amber-100/65' : 'text-slate-700'));

const focusDateLabel = computed(() => {
  return new Intl.DateTimeFormat(locale.value, {
    month: 'long', day: 'numeric', weekday: 'short'
  }).format(new Date());
});

function persistLayoutPreferences() {
  localStorage.setItem(APP_LOCALE_KEY, locale.value);
  localStorage.setItem(APP_THEME_KEY, isDarkMode.value ? 'dark' : 'light');
  if (favoriteRoute.value) {
    localStorage.setItem(FAVORITE_ROUTE_KEY, favoriteRoute.value);
  } else {
    localStorage.removeItem(FAVORITE_ROUTE_KEY);
  }
}

function toggleLanguage() {
  locale.value = locale.value === 'zh-TW' ? 'en-US' : 'zh-TW';
  persistLayoutPreferences();
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
    message: isDarkMode.value ? '已切換深色模式' : '已切換淺色模式',
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
      message: t.value.favoriteNone,
      color: 'positive',
      icon: 'star',
      timeout: 1400,
      position: 'top',
    });
    return;
  }

  if (favoriteRoute.value === route.path) {
    $q.notify({
      message: t.value.favoriteSaved,
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
    message: t.value.favoriteJumped,
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
      roomID: parsed.roomID || '--',
      roomName: parsed.roomName || '尚未選擇房間',
      zoneDescription: parsed.zoneDescription || '請先到選位入座頁面選擇分區',
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
</style>