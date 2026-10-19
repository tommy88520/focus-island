<template>
  <!-- 站在自己的賽車旁邊：選塗裝（存在帳號、同房間的人看得到）、上車。F1 賽車場和三條大獎賽共用 -->
  <div class="pixel-panel absolute bottom-36 left-1/2 z-10 w-[min(30rem,calc(100%-1.5rem))] -translate-x-1/2 p-3 sm:bottom-3" @click.stop @pointerdown.stop>
    <div class="!flex !flex-nowrap items-center justify-between gap-2">
      <p class="!mb-0 text-xs font-black">🏎️ {{ t.f1.pickCar }}</p>
      <p class="!mb-0 truncate text-[11px] font-black text-[color:var(--px-accent-dark)] dark:!text-amber-300">{{ current.name[locale] }}</p>
    </div>
    <div class="mt-2 grid grid-cols-9 gap-1">
      <button
        v-for="(l, i) in LIVERIES"
        :key="i"
        type="button"
        class="pixel-btn !flex h-auto flex-col items-center gap-0.5 px-0.5 py-1"
        :class="{ 'pixel-btn--active': modelValue === i }"
        :aria-label="l.name[locale]"
        :aria-pressed="modelValue === i"
        @click="emit('update:modelValue', i)"
      >
        <img :src="previews[i]" alt="" class="h-11 w-[22px] [image-rendering:pixelated] sm:h-12 sm:w-6" />
        <span class="hide-below-sm line-clamp-1 w-full text-center text-[9px] font-black leading-tight">{{ l.name[locale] }}</span>
      </button>
    </div>
    <button type="button" class="pixel-btn pixel-btn--primary mt-2 h-10 w-full text-sm" @click="emit('drive')">{{ t.f1.getIn }}</button>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from 'src/composables/useLocale';
import { LIVERIES, livery, liveryPreview } from 'src/pages/index/pixel/f1Car';

const props = defineProps<{ modelValue: number }>();
const emit = defineEmits<{ 'update:modelValue': [value: number]; drive: [] }>();
const { t, locale } = useLocale();
const previews = LIVERIES.map((_, i) => liveryPreview(i));
const current = computed(() => livery(props.modelValue));
</script>
