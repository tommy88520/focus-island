<template>
  <!-- 換裝：髮色、衣服、性別、配件（設定頁和家裡的衣櫃共用）。改的是 look（v-model），存不存由外面決定；買配件是當下扣幣 -->
  <div>
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
            :class="{ 'outline outline-2 outline-offset-2 outline-[color:var(--px-accent)]': look.hair === i }"
            :style="{ background: locked(HAIR_UNLOCK, i) ? undefined : color }"
            :disabled="locked(HAIR_UNLOCK, i)"
            :title="locked(HAIR_UNLOCK, i) ? t.settingsPage.unlockAt(HAIR_UNLOCK[i] ?? 0) : undefined"
            :aria-label="locked(HAIR_UNLOCK, i) ? t.settingsPage.unlockAt(HAIR_UNLOCK[i] ?? 0) : `${t.settingsPage.hairLabel} ${i + 1}`"
            :aria-pressed="look.hair === i"
            @click="set({ hair: i })"
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
            :class="{ 'outline outline-2 outline-offset-2 outline-[color:var(--px-accent)]': look.shirt === i }"
            :style="{ background: locked(SHIRT_UNLOCK, i) ? undefined : color }"
            :disabled="locked(SHIRT_UNLOCK, i)"
            :title="locked(SHIRT_UNLOCK, i) ? t.settingsPage.unlockAt(SHIRT_UNLOCK[i] ?? 0) : undefined"
            :aria-label="locked(SHIRT_UNLOCK, i) ? t.settingsPage.unlockAt(SHIRT_UNLOCK[i] ?? 0) : `${t.settingsPage.shirtLabel} ${i + 1}`"
            :aria-pressed="look.shirt === i"
            @click="set({ shirt: i })"
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
            :class="{ 'pixel-btn--active': look.body === i }"
            :aria-pressed="look.body === i"
            @click="set({ body: i })"
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
        :class="{ 'pixel-btn--active': !look.acc }"
        :aria-pressed="!look.acc"
        @click="set({ acc: 0 })"
      >
        <span class="text-lg leading-none">🚫</span>
        <span class="font-black">{{ t.settingsPage.accNone }}</span>
      </button>
      <button
        v-for="item in ACCESSORIES"
        :key="item.id"
        type="button"
        class="pixel-btn !flex h-auto min-h-16 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[11px]"
        :class="{ 'pixel-btn--active': look.acc === item.id }"
        :aria-pressed="look.acc === item.id"
        @click="pickAccessory(item.id)"
      >
        <span class="text-lg leading-none">{{ item.emoji }}</span>
        <span class="font-black leading-tight">{{ item.name[locale] }}</span>
        <span class="text-[10px]" :class="look.acc === item.id ? 'font-black' : 'text-[color:var(--px-muted)]'">
          {{ look.acc === item.id ? t.settingsPage.accWearing : prefs.ownedAcc.includes(item.id) ? t.settingsPage.accOwned : `🪙 ${item.price}` }}
        </span>
      </button>
    </div>
  </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { usePlayerPrefs, type Look } from 'src/composables/usePlayerPrefs';
import { ACCESSORIES, AVATAR_SIZE, HAIR_UNLOCK, LOOK_HAIRS, LOOK_SHIRTS, SHIRT_UNLOCK, getAvatarFrame, lookColors } from 'src/pages/index/pixel/pixelArt';
import { usePomodoroStore } from 'src/stores/pomodoro';

const props = defineProps<{ modelValue: Look }>();
const emit = defineEmits<{ 'update:modelValue': [look: Look] }>();
const look = computed(() => props.modelValue);
const set = (patch: Partial<Look>) => emit('update:modelValue', { ...props.modelValue, ...patch });

const { t, locale } = useLocale();
const $q = useQuasar();
const prefs = usePlayerPrefs();
const store = usePomodoroStore();

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
    set({ acc: look.value.acc === id ? 0 : id });
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
  set({ acc: id });
  $q.notify({ message: t.value.settingsPage.accBought(name), color: 'positive', icon: 'celebration', position: 'top', timeout: 2200 });
}

// 預覽：畫在原尺寸的 canvas 上，再用 CSS 整數倍放大
function drawPreview(): void {
  const ctx = previewRef.value?.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, AVATAR_SIZE.w, AVATAR_SIZE.h);
  ctx.drawImage(getAvatarFrame(lookColors(look.value.hair, look.value.shirt, look.value), 'down', 'idle'), 0, 0);
}

onMounted(drawPreview);
watch(() => [look.value.hair, look.value.shirt, look.value.body, look.value.acc], drawPreview);
</script>
