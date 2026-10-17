<template>
  <!-- 好友清單裡的小頭像（照對方的外觀畫） -->
  <canvas ref="canvasRef" class="block shrink-0 [image-rendering:pixelated]" :width="AVATAR_SIZE.w" :height="AVATAR_SIZE.h" :style="{ width: `${AVATAR_SIZE.w * 1.5}px`, height: `${AVATAR_SIZE.h * 1.5}px` }" />
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import type { Look } from 'src/composables/usePlayerPrefs';
import { AVATAR_SIZE, getAvatarFrame, lookColors } from 'src/pages/index/pixel/pixelArt';

const props = defineProps<{ look: Look }>();
const canvasRef = ref<HTMLCanvasElement | null>(null);

function draw(): void {
  const ctx = canvasRef.value?.getContext('2d');
  if (!ctx) return;
  ctx.clearRect(0, 0, AVATAR_SIZE.w, AVATAR_SIZE.h);
  ctx.drawImage(getAvatarFrame(lookColors(props.look.hair, props.look.shirt, props.look), 'down', 'idle'), 0, 0);
}

onMounted(draw);
watch(() => props.look, draw, { deep: true });
</script>
