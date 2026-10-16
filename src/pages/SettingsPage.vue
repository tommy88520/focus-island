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
            <div>
              <p class="!mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">{{ t.settingsPage.bodyLabel }}</p>
              <div class="!flex !flex-nowrap gap-2">
                <button
                  v-for="(label, i) in t.settingsPage.bodyOptions"
                  :key="label"
                  type="button"
                  class="pixel-btn h-9 px-3 text-xs"
                  :class="{ 'pixel-btn--active': prefs.body === i }"
                  :aria-pressed="prefs.body === i"
                  @click="prefs.body = i"
                >
                  {{ label }}
                </button>
              </div>
            </div>
          </div>
        </div>
        <!-- 配件：用專注幣買，手機一排三個 -->
        <div class="mt-5">
          <div class="!flex !flex-nowrap items-baseline justify-between gap-2">
            <p class="!mb-0 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">{{ t.settingsPage.accLabel }}</p>
            <span class="text-xs font-black">🪙 {{ prefs.coins }}</span>
          </div>
          <p class="!mb-2 mt-0.5 text-[11px] text-[color:var(--px-muted)]">{{ t.settingsPage.accHint }}</p>
          <div class="grid grid-cols-3 gap-2 sm:grid-cols-7">
            <button
              type="button"
              class="pixel-btn !flex h-auto min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px]"
              :class="{ 'pixel-btn--active': !prefs.acc }"
              :aria-pressed="!prefs.acc"
              @click="prefs.acc = 0"
            >
              <span class="text-lg leading-none">🚫</span>
              <span class="font-black">{{ t.settingsPage.accNone }}</span>
            </button>
            <button
              v-for="item in ACCESSORIES"
              :key="item.id"
              type="button"
              class="pixel-btn !flex h-auto min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px]"
              :class="{ 'pixel-btn--active': prefs.acc === item.id }"
              :aria-pressed="prefs.acc === item.id"
              @click="pickAccessory(item.id)"
            >
              <span class="text-lg leading-none">{{ item.emoji }}</span>
              <span class="font-black leading-tight">{{ item.name[locale] }}</span>
              <span class="text-[10px]" :class="prefs.acc === item.id ? 'font-black' : 'text-[color:var(--px-muted)]'">
                {{ prefs.acc === item.id ? t.settingsPage.accWearing : prefs.ownedAcc.includes(item.id) ? t.settingsPage.accOwned : `🪙 ${item.price}` }}
              </span>
            </button>
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
        <label class="pixel-field !flex items-center justify-between px-3 py-2.5 text-sm font-bold">
          🤫 {{ t.settingsPage.whispersLabel }}
          <input :checked="!prefs.whispersOff" type="checkbox" class="h-4 w-4 accent-amber-400" @change="prefs.whispersOff = !($event.target as HTMLInputElement).checked" />
        </label>
        <p v-if="prefs.blocked.length" class="!mb-0 text-[11px] text-[color:var(--px-muted)]">
          {{ t.settingsPage.blockedCount(prefs.blocked.length) }}
          <button type="button" class="ml-1 underline" @click="prefs.blocked = []">{{ t.settingsPage.unblockAll }}</button>
        </p>
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
import { ACCESSORIES, AVATAR_SIZE, HAIR_UNLOCK, LOOK_HAIRS, LOOK_SHIRTS, SHIRT_UNLOCK, getAvatarFrame, lookColors } from 'src/pages/index/pixel/pixelArt';
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

// 點配件：買過就戴上（再點一次拿下），沒買過就問要不要用專注幣買
function pickAccessory(id: number): void {
  const item = ACCESSORIES.find((a) => a.id === id);
  if (!item) return;
  if (prefs.value.ownedAcc.includes(id)) {
    prefs.value.acc = prefs.value.acc === id ? 0 : id;
    return;
  }
  const name = item.name[locale.value];
  if (prefs.value.coins < item.price) {
    $q.notify({ message: t.value.settingsPage.accNotEnough(item.price, prefs.value.coins), color: 'warning', icon: 'savings', position: 'top', timeout: 2500 });
    return;
  }
  if (!window.confirm(t.value.settingsPage.accBuyConfirm(name, item.price))) return;
  prefs.value.coins -= item.price;
  prefs.value.ownedAcc = [...prefs.value.ownedAcc, id];
  prefs.value.acc = id;
  $q.notify({ message: t.value.settingsPage.accBought(name), color: 'positive', icon: 'celebration', position: 'top', timeout: 2200 });
}

// 預覽：畫在原尺寸的 canvas 上，再用 CSS 整數倍放大
function drawPreview(): void {
  const ctx = previewRef.value?.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, AVATAR_SIZE.w, AVATAR_SIZE.h);
  ctx.drawImage(getAvatarFrame(lookColors(prefs.value.hair, prefs.value.shirt, prefs.value), 'down', 'idle'), 0, 0);
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
watch(() => [prefs.value.hair, prefs.value.shirt, prefs.value.body, prefs.value.acc], drawPreview);
</script>
