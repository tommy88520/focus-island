<template>
  <div class="relative min-h-[calc(100vh-80px)] px-4 py-4 pb-20 sm:px-6 lg:py-8">
    <div class="mx-auto max-w-[48rem] space-y-4">
      <header class="pixel-panel p-5 sm:p-6">
        <p class="font-pixel text-[11px] uppercase text-[color:var(--px-accent-dark)] dark:!text-amber-300">Settings</p>
        <h1 class="!mb-0 mt-2 !text-2xl !font-black sm:!text-3xl">{{ t.settingsPage.title }}</h1>
        <p class="!mb-0 mt-2 text-sm text-[color:var(--px-muted)]">{{ t.settingsPage.subtitle }}</p>
      </header>

      <section class="pixel-panel space-y-3 p-5 sm:p-6">
        <div>
          <h2 class="!mb-0 !text-lg !font-black">☁️ {{ t.settingsPage.accountTitle }}</h2>
          <p class="!mb-0 mt-1 text-xs text-[color:var(--px-muted)]">
            {{ account.session.value ? t.settingsPage.accountSignedInHint : t.settingsPage.accountHint }}
          </p>
        </div>
        <template v-if="account.session.value">
          <p class="!mb-0 text-sm font-bold">✅ {{ t.settingsPage.accountSignedIn }}</p>
          <div class="!flex flex-wrap gap-2">
            <button type="button" class="pixel-btn px-3 py-2 text-xs" @click="account.logout()">{{ t.settingsPage.accountLogout }}</button>
            <button type="button" class="pixel-btn pixel-btn--danger px-3 py-2 text-xs" @click="confirmDelete">{{ t.settingsPage.accountDelete }}</button>
          </div>
        </template>
        <template v-else>
          <div ref="googleButtonRef" class="min-h-[44px]"></div>
          <p v-if="loginError" class="!mb-0 text-xs font-bold text-[#e25a4a]">{{ loginError }}</p>
        </template>
      </section>

      <section class="pixel-panel space-y-3 p-5 sm:p-6">
        <div>
          <h2 class="!mb-0 !text-lg !font-black">{{ t.settingsPage.goalTitle }}</h2>
          <p class="!mb-0 mt-1 text-xs text-[color:var(--px-muted)]">{{ t.settingsPage.goalHint }}</p>
        </div>
        <div class="!grid grid-cols-3 gap-2 sm:grid-cols-5">
          <button
            v-for="hours in DAILY_GOAL_OPTIONS"
            :key="hours"
            type="button"
            class="pixel-btn py-2 text-xs"
            :class="{ 'pixel-btn--active': prefs.dailyGoalHours === hours }"
            @click="prefs.dailyGoalHours = hours"
          >
            {{ t.settingsPage.hours(hours) }}
          </button>
        </div>
      </section>

      <section class="pixel-panel p-5 sm:p-6">
        <h2 class="!mb-0 !text-lg !font-black">{{ t.settingsPage.avatarTitle }}</h2>
        <p class="!mb-0 mt-1 text-xs text-[color:var(--px-muted)]">{{ t.settingsPage.avatarHint }}</p>
        <!-- 設定頁改了就直接存（家裡的衣櫃才有「儲存」） -->
        <LookEditor class="mt-1" :model-value="prefs" @update:model-value="Object.assign(prefs, $event)" />
      </section>

      <section class="pixel-panel space-y-3 p-5 sm:p-6">
        <div>
          <h2 class="!mb-0 !text-lg !font-black">🌇 {{ t.settingsPage.sceneClockTitle }}</h2>
          <p class="!mb-0 mt-1 text-xs text-[color:var(--px-muted)]">{{ t.settingsPage.sceneClockHint }}</p>
        </div>
        <label class="pixel-field !flex items-center justify-between px-3 py-2.5 text-sm font-bold">
          {{ t.settingsPage.sceneClockLabel }}
          <input v-model="prefs.sceneClock" type="checkbox" class="h-4 w-4 accent-amber-400" />
        </label>
      </section>

      <section class="pixel-panel space-y-3 p-5 sm:p-6">
        <div>
          <h2 class="!mb-0 !text-lg !font-black">🔕 {{ t.settingsPage.dndTitle }}</h2>
          <p class="!mb-0 mt-1 text-xs text-[color:var(--px-muted)]">{{ t.settingsPage.dndHint }}</p>
        </div>
        <label class="pixel-field !flex items-center justify-between px-3 py-2.5 text-sm font-bold">
          {{ t.settingsPage.dndLabel }}
          <input v-model="prefs.doNotDisturb" type="checkbox" class="h-4 w-4 accent-amber-400" />
        </label>
        <label class="pixel-field !flex items-center justify-between px-3 py-2.5 text-sm font-bold">
          🤫 {{ t.settingsPage.whispersLabel }}
          <input :checked="!prefs.whispersOff" type="checkbox" class="h-4 w-4 accent-amber-400" @change="prefs.whispersOff = !($event.target as HTMLInputElement).checked" />
        </label>
        <label class="pixel-field !flex items-center justify-between px-3 py-2.5 text-sm font-bold">
          📺 {{ t.settingsPage.watchInvitesLabel }}
          <input :checked="!prefs.watchInvitesOff" type="checkbox" class="h-4 w-4 accent-amber-400" @change="prefs.watchInvitesOff = !($event.target as HTMLInputElement).checked" />
        </label>
        <p v-if="prefs.blocked.length" class="!mb-0 text-[11px] text-[color:var(--px-muted)]">
          {{ t.settingsPage.blockedCount(prefs.blocked.length) }}
          <button type="button" class="ml-1 underline" @click="prefs.blocked = []">{{ t.settingsPage.unblockAll }}</button>
        </p>
      </section>

      <section class="pixel-panel p-5 text-center sm:p-6">
        <p class="!mb-3 text-xs text-[color:var(--px-muted)]">{{ t.settingsPage.coffeeHint }}</p>
        <a href="https://ko-fi.com/tommy88520" target="_blank" rel="noreferrer" class="pixel-btn pixel-btn--primary inline-flex h-10 items-center px-5 text-sm no-underline">
          ☕ {{ t.layout.coffee }}
        </a>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { GOOGLE_CLIENT_ID, useAccount } from 'src/composables/useAccount';
import { renderGoogleButton } from 'src/composables/googleIdentity';
import { useLocale } from 'src/composables/useLocale';
import { DAILY_GOAL_OPTIONS, usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import LookEditor from 'src/pages/index/components/LookEditor.vue';
import { usePomodoroStore } from 'src/stores/pomodoro';

const { t, locale } = useLocale();
const $q = useQuasar();
const account = useAccount();
const googleButtonRef = ref<HTMLDivElement | null>(null);
const loginError = ref('');
const prefs = usePlayerPrefs();
// 換裝的解鎖要看累計輪數
usePomodoroStore().loadProgress();

// 畫 Google 登入鈕。登入失敗、或跳去 Google 沒登入就回來，按鈕會卡住：重畫
function renderLogin(): void {
  if (account.session.value || !googleButtonRef.value) return;
  googleButtonRef.value.innerHTML = '';
  renderGoogleButton(
    googleButtonRef.value,
    GOOGLE_CLIENT_ID,
    (credential) => {
      loginError.value = '';
      void account.loginWithGoogle(credential).then((ok) => {
        if (!ok) {
          loginError.value = t.value.settingsPage.accountLoginFailed;
          renderLogin();
        }
      });
    },
    { dark: $q.dark.isActive, locale: locale.value },
  ).catch(() => {
    loginError.value = t.value.settingsPage.accountLoadFailed;
  });
}

function onReturn(): void {
  if (document.visibilityState === 'visible') renderLogin();
}

onMounted(() => {
  renderLogin();
  window.addEventListener('focus', onReturn);
  document.addEventListener('visibilitychange', onReturn);
});

onBeforeUnmount(() => {
  window.removeEventListener('focus', onReturn);
  document.removeEventListener('visibilitychange', onReturn);
});

function confirmDelete(): void {
  if (window.confirm(t.value.settingsPage.accountDeleteConfirm)) void account.deleteAccount();
}
</script>
