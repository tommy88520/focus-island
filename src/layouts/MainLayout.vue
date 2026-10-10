<template>
    <q-layout view="lHh Lpr lFf" :class="['font-sans antialiased', layoutThemeClass]">
    
    <div class="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
      <!-- 淡淡的 16px 格線，跟地圖的格子對齊感一致 -->
      <div class="absolute inset-0 pixel-grid"></div>
      <div class="hidden dark:!block absolute inset-0 starfield-far"></div>
      <div class="hidden dark:!block absolute inset-0 starfield-near"></div>
    </div>

    <q-header class="bg-transparent px-2 pt-2 sm:px-4 sm:pt-4" flat>
      <div
        class="pixel-panel mx-auto flex max-w-[1500px] !flex-nowrap items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4"
      >
        <button
          type="button"
          aria-label="menu"
          class="pixel-btn h-8 w-8 shrink-0 md:!hidden"
          @click="toggleLeftDrawer"
        >
          <q-icon name="menu" size="20px" />
        </button>

        <div class="flex items-center gap-2 sm:gap-3">
          <img src="/icons/logo.svg" alt="Focus Island" width="36" height="36" class="h-8 w-8 shrink-0 rounded-[4px] [image-rendering:pixelated] sm:h-9 sm:w-9" />
          <div class="hide-below-sm sm:block">
            <div class="font-pixel mb-1 text-[10px] uppercase leading-none text-[color:var(--px-accent-dark)] dark:!text-amber-300">Cute Library</div>
            <div class="font-pixel text-base font-bold leading-none">Focus Island</div>
          </div>
        </div>

        <nav class="ml-1 flex items-center gap-1 max-md:!hidden">
          <button
            v-for="link in localizedLinksList"
            :key="link.key"
            type="button"
            :disabled="!link.enabled"
            :title="link.caption"
            class="flex items-center gap-1.5 rounded-[4px] border-2 px-2.5 py-1 text-xs font-bold transition-all"
            :class="[
              link.enabled
                ? 'border-transparent hover:bg-[color:var(--px-panel-2)]'
                : 'cursor-not-allowed border-transparent opacity-45',
              link.enabled && isRouteActive(link.to) ? '!border-[color:var(--px-ink)] !bg-[color:var(--px-accent)] !text-[#3b2a20]' : '',
            ]"
            @click="handleMenuClick(link)"
          >
            <span class="text-sm leading-none">{{ link.icon }}</span>
            <span>{{ link.title }}</span>
            <span
              v-if="!link.enabled && link.badge"
              class="rounded-full bg-orange-500/20 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-tighter text-orange-400"
            >
              {{ link.badge }}
            </span>
          </button>
        </nav>

        <div class="ml-auto flex items-center gap-1.5 sm:gap-3">
          <div
            v-if="currentRoomInfo.roomID"
            class="pixel-field flex !flex-nowrap items-center gap-1.5 px-2 py-1 text-[10px] font-black tracking-[0.12em] max-lg:!hidden"
            :title="displayedRoomInfo.zoneDescription"
          >
            <span>{{ displayedRoomInfo.roomID }}</span>
            <span class="font-bold opacity-70">{{ displayedRoomInfo.roomName }}</span>
          </div>
          <div class="flex flex-col items-end max-xl:!hidden">
            <span class="text-[10px] font-bold uppercase tracking-widest text-[color:var(--px-muted)]">
              {{ t.layout.headerGoalLabel }}
            </span>
            <span class="font-pixel text-xs font-bold">{{ store.todayFocusedHoursText }} / {{ playerPrefs.dailyGoalHours }}h</span>
            <div class="pixel-track mt-1 w-24 !h-2 !p-0"><div :style="{ width: `${goalPercent}%` }"></div></div>
          </div>
          <div class="mx-1 h-8 w-[2px] bg-[color:var(--px-ink)] opacity-20 max-xl:!hidden"></div>
          <button
            type="button"
            class="pixel-btn h-8 min-w-8 px-2 text-[10px] tracking-[0.18em] sm:px-2.5"
            @click="toggleLanguage"
          >
            <span class="inline-flex items-center gap-1">
              <q-icon name="translate" size="12px" />
              <span class="hide-below-sm sm:inline">{{ t.layout.languageButton }}</span>
            </span>
          </button>
          <button
            type="button"
            class="pixel-btn h-8 min-w-8 px-2 text-[10px] tracking-[0.18em] sm:px-2.5"
            @click="toggleTheme"
          >
            <span class="inline-flex items-center gap-1">
              <q-icon :name="isDarkMode ? 'dark_mode' : 'light_mode'" size="12px" />
              <span class="hide-below-sm sm:inline">{{ isDarkMode ? t.layout.darkButton : t.layout.lightButton }}</span>
            </span>
          </button>
          <button
            type="button"
            class="pixel-btn h-8 min-w-8 px-2 text-[10px] tracking-[0.18em] sm:px-2.5"
            :class="{ 'pixel-btn--active': favoriteRoute }"
            @click="handleFavoriteShortcut"
          >
            <span class="inline-flex items-center gap-1">
              <q-icon name="star" size="12px" />
              <span class="hide-below-sm sm:inline">{{ t.layout.favoriteButton }}</span>
            </span>
          </button>
          <span class="font-pixel hide-below-sm text-[10px] text-[color:var(--px-muted)] sm:inline-flex">v{{ $q.version }}</span>
        </div>
      </div>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      behavior="mobile"
      :width="$q.screen.lt.sm ? 320 : 280"
      class="bg-transparent"
    >
      <div class="flex h-full flex-col p-3 sm:p-4 lg:pl-4 lg:pr-0 lg:py-8">
        <aside class="pixel-panel flex h-full flex-col p-4 sm:p-6">
          <div class="pixel-field mb-6 p-3 sm:mb-8 sm:p-4">
            <div class="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">
              {{ t.layout.currentStatusLabel }}
            </div>
            <div class="text-lg font-black sm:text-xl">{{ focusDateLabel }}</div>
            <p class="mt-2 text-[10px] leading-relaxed italic text-[color:var(--px-muted)]">
              "{{ t.layout.currentStatusQuote }}"
            </p>
          </div>

          <nav class="space-y-2 flex-1">
            <div class="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.3em] text-[color:var(--px-muted)]">
              {{ t.layout.menuLabel }}
            </div>
            <button
              v-for="link in localizedLinksList"
              :key="link.key"
              type="button"
              :disabled="!link.enabled"
              class="group flex w-full !flex-nowrap items-center gap-3 rounded-[4px] border-2 px-3 py-3 text-left transition-all sm:gap-4 sm:px-4"
              :class="[
                link.enabled ? 'border-transparent hover:bg-[color:var(--px-panel-2)]' : 'cursor-not-allowed border-transparent opacity-55',
                link.enabled && isRouteActive(link.to) ? '!border-[color:var(--px-ink)] !bg-[color:var(--px-accent)] !text-[#3b2a20]' : '',
              ]"
              @click="handleMenuClick(link)"
            >
              <span class="text-lg transition-transform group-hover:scale-125 sm:text-xl">{{ link.icon }}</span>
              <div class="flex-1">
                <span class="block text-sm font-bold">{{ link.title }}</span>
                <span class="block text-[10px] leading-tight opacity-70">{{ link.caption }}</span>
              </div>
              <span
                v-if="link.badge"
                class="rounded-full bg-orange-500/20 px-2 py-0.5 text-[9px] font-black text-orange-400 uppercase tracking-tighter"
              >
                {{ link.badge }}
              </span>
            </button>
          </nav>

          <div class="mt-auto pt-5 sm:pt-6">
            <div class="pixel-field p-3">
              <p class="text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">{{ t.layout.currentRoomLabel }}</p>
              <p class="font-pixel mt-1 text-sm font-bold">{{ displayedRoomInfo.roomID }}</p>
              <p class="mt-1 text-[11px]">{{ displayedRoomInfo.roomName }}</p>
              <p class="mt-1 text-[10px] text-[color:var(--px-muted)]">{{ displayedRoomInfo.zoneDescription }}</p>
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
import { useLocale } from 'src/composables/useLocale';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { usePomodoroStore } from 'src/stores/pomodoro';
import { HAIR_UNLOCK, SHIRT_UNLOCK } from 'src/pages/index/pixel/pixelArt';

const leftDrawerOpen = ref(false);
const store = usePomodoroStore();
const playerPrefs = usePlayerPrefs();
// 完成一輪剛好跨過解鎖門檻：跳個通知
const unlockedCount = (sessions: number) => [...HAIR_UNLOCK, ...SHIRT_UNLOCK].filter((n) => n > 0 && n <= sessions).length;
// 只看這次開頁面後真的完成的那一輪，載入舊紀錄時不跳
watch(
  () => store.sessionsThisVisit,
  () => {
    const now = store.lifetimeSessions;
    if (unlockedCount(now) <= unlockedCount(now - 1)) return;
    $q.notify({ message: t.value.settingsPage.unlockedToast, icon: 'lock_open', color: 'amber-9', position: 'top', timeout: 3500 });
  },
);
const goalPercent = computed(() =>
  Math.min(100, Math.round((store.todayFocusedSeconds / 3600 / Math.max(1, playerPrefs.value.dailyGoalHours)) * 100)),
);
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
    to: '/settings',
    enabled: true,
  },
];

const localizedLinksList = computed(() =>
  linksList.map((link) => ({
    ...link,
    title: t.value.layout.menuItems[link.key as keyof typeof t.value.layout.menuItems].title,
    caption: t.value.layout.menuItems[link.key as keyof typeof t.value.layout.menuItems].caption,
  })),
);
const layoutThemeClass = computed(() => (isDarkMode.value ? 'bg-[#14111f] text-[#f4eee2]' : 'bg-[#efe3c8] text-[#3b2a20]'));

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
  store.loadProgress();
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
.pixel-grid {
  background-image:
    linear-gradient(to right, rgba(59, 42, 32, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(59, 42, 32, 0.05) 1px, transparent 1px);
  background-size: 16px 16px;
}
.body--dark .pixel-grid {
  background-image:
    linear-gradient(to right, rgba(169, 159, 201, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(169, 159, 201, 0.05) 1px, transparent 1px);
}

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