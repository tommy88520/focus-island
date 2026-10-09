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
                  class="pixel-btn h-8 w-8"
                  :class="{ 'outline outline-2 outline-offset-2 outline-[color:var(--px-accent)]': prefs.hair === i }"
                  :style="{ background: color }"
                  :aria-label="`${t.settingsPage.hairLabel} ${i + 1}`"
                  :aria-pressed="prefs.hair === i"
                  @click="prefs.hair = i"
                />
              </div>
            </div>
            <div>
              <p class="!mb-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">{{ t.settingsPage.shirtLabel }}</p>
              <div class="!flex flex-wrap gap-2">
                <button
                  v-for="([color], i) in LOOK_SHIRTS"
                  :key="color"
                  type="button"
                  class="pixel-btn h-8 w-8"
                  :class="{ 'outline outline-2 outline-offset-2 outline-[color:var(--px-accent)]': prefs.shirt === i }"
                  :style="{ background: color }"
                  :aria-label="`${t.settingsPage.shirtLabel} ${i + 1}`"
                  :aria-pressed="prefs.shirt === i"
                  @click="prefs.shirt = i"
                />
              </div>
            </div>
          </div>
        </div>
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
import { useLocale } from 'src/composables/useLocale';
import { DAILY_GOAL_OPTIONS, usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { AVATAR_SIZE, LOOK_HAIRS, LOOK_SHIRTS, getAvatarFrame, lookColors } from 'src/pages/index/pixel/pixelArt';

const { t } = useLocale();
const prefs = usePlayerPrefs();
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

onMounted(drawPreview);
watch(() => [prefs.value.hair, prefs.value.shirt], drawPreview);
</script>
