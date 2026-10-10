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
        <p class="!mb-0 mt-1 text-xs font-bold text-[color:var(--px-accent-dark)] dark:!text-amber-300">{{ t.settingsPage.sessionsSoFar(store.lifetimeSessions) }}</p>
        <div class="mt-4 !flex !flex-nowrap items-center gap-5">
          <div class="pixel-field shrink-0 p-3">
            <canvas ref="previewRef" class="block [image-rendering:pixelated]" :width="AVATAR_SIZE.w" :height="AVATAR_SIZE.h" :style="previewStyle" />
          </div>
          <div class="min-w-0 flex-1 space-y-3">
            <div>
              <p class="!mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">{{ t.settingsPage.hairLabel }}</p>
              <div class="!flex flex-wrap gap-2">
                <button
                  v-for="([color], i) in LOOK_HAIRS"
                  :key="color"
                  type="button"
                  class="pixel-btn h-8 w-8 text-xs"
                  :class="{ 'outline outline-2 outline-offset-2 outline-[color:var(--px-accent)]': prefs.hair === i }"
                  :style="{ background: locked(HAIR_UNLOCK, i) ? undefined : color }"
                  :disabled="locked(HAIR_UNLOCK, i)"
                  :title="locked(HAIR_UNLOCK, i) ? t.settingsPage.unlockAt(HAIR_UNLOCK[i] ?? 0) : undefined"
                  :aria-label="locked(HAIR_UNLOCK, i) ? t.settingsPage.unlockAt(HAIR_UNLOCK[i] ?? 0) : `${t.settingsPage.hairLabel} ${i + 1}`"
                  :aria-pressed="prefs.hair === i"
                  @click="prefs.hair = i"
                >
                  <template v-if="locked(HAIR_UNLOCK, i)">🔒</template>
                </button>
              </div>
            </div>
            <div>
              <p class="!mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">{{ t.settingsPage.shirtLabel }}</p>
              <div class="!flex flex-wrap gap-2">
                <button
                  v-for="([color], i) in LOOK_SHIRTS"
                  :key="color"
                  type="button"
                  class="pixel-btn h-8 w-8 text-xs"
                  :class="{ 'outline outline-2 outline-offset-2 outline-[color:var(--px-accent)]': prefs.shirt === i }"
                  :style="{ background: locked(SHIRT_UNLOCK, i) ? undefined : color }"
                  :disabled="locked(SHIRT_UNLOCK, i)"
                  :title="locked(SHIRT_UNLOCK, i) ? t.settingsPage.unlockAt(SHIRT_UNLOCK[i] ?? 0) : undefined"
                  :aria-label="locked(SHIRT_UNLOCK, i) ? t.settingsPage.unlockAt(SHIRT_UNLOCK[i] ?? 0) : `${t.settingsPage.shirtLabel} ${i + 1}`"
                  :aria-pressed="prefs.shirt === i"
                  @click="prefs.shirt = i"
                >
                  <template v-if="locked(SHIRT_UNLOCK, i)">🔒</template>
                </button>
              </div>
            </div>
          </div>
        </div>
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
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { GOOGLE_CLIENT_ID, useAccount } from 'src/composables/useAccount';
import { renderGoogleButton } from 'src/composables/googleIdentity';
import { useLocale } from 'src/composables/useLocale';
import { DAILY_GOAL_OPTIONS, usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { AVATAR_SIZE, HAIR_UNLOCK, LOOK_HAIRS, LOOK_SHIRTS, SHIRT_UNLOCK, getAvatarFrame, lookColors } from 'src/pages/index/pixel/pixelArt';
import { usePomodoroStore } from 'src/stores/pomodoro';

const { t, locale } = useLocale();
const $q = useQuasar();
const account = useAccount();
const googleButtonRef = ref<HTMLDivElement | null>(null);
const loginError = ref('');
const prefs = usePlayerPrefs();
const store = usePomodoroStore();
store.loadProgress();

// 累計完成輪數還不夠的顏色先鎖著
const locked = (thresholds: number[], i: number) => store.lifetimeSessions < (thresholds[i] ?? 0);
const previewRef = ref<HTMLCanvasElement | null>(null);
const PREVIEW_SCALE = 4;
const previewStyle = { width: `${AVATAR_SIZE.w * PREVIEW_SCALE}px`, height: `${AVATAR_SIZE.h * PREVIEW_SCALE}px` };

// 預覽：畫在原尺寸的 canvas 上，再用 CSS 整數倍放大
function drawPreview(): void {
  const ctx = previewRef.value?.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, AVATAR_SIZE.w, AVATAR_SIZE.h);
  ctx.drawImage(getAvatarFrame(lookColors(prefs.value.hair, prefs.value.shirt), 'down', 'idle'), 0, 0);
}

onMounted(() => {
  drawPreview();
  if (!account.session.value && googleButtonRef.value) {
    renderGoogleButton(
      googleButtonRef.value,
      GOOGLE_CLIENT_ID,
      (credential) => {
        loginError.value = '';
        void account.loginWithGoogle(credential).then((ok) => {
          if (!ok) loginError.value = t.value.settingsPage.accountLoginFailed;
        });
      },
      { dark: $q.dark.isActive, locale: locale.value },
    ).catch(() => {
      loginError.value = t.value.settingsPage.accountLoadFailed;
    });
  }
});

function confirmDelete(): void {
  if (window.confirm(t.value.settingsPage.accountDeleteConfirm)) void account.deleteAccount();
}
watch(() => [prefs.value.hair, prefs.value.shirt], drawPreview);
</script>
