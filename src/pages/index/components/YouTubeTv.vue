<template>
  <!-- 圖書館牆上的 YouTube 電視：看得到電視就疊在電視上，看不到就退到角落小視窗，也可以放大。
       掛在 body 底下：頁面外層有 transform，fixed 會跟著跑掉 -->
  <Teleport to="body">
    <div v-show="active" class="youtube-tv" :class="`youtube-tv--${mode}`" :style="frameStyle">
      <div v-if="mode !== 'tv'" class="youtube-tv__bar">
        <q-icon name="smart_display" size="14px" class="shrink-0 text-red-400" />
        <span class="min-w-0 flex-1 truncate">{{ youtube.title.value || 'YouTube' }}</span>
        <button
          type="button"
          class="youtube-tv__btn"
          :aria-label="youtube.expanded.value ? 'shrink' : 'expand'"
          @click="toggleExpanded"
        >
          <q-icon
            :name="youtube.expanded.value ? 'close_fullscreen' : 'open_in_full'"
            size="14px"
          />
        </button>
        <button type="button" class="youtube-tv__btn" aria-label="close" @click="close">
          <q-icon name="close" size="14px" />
        </button>
      </div>
      <div ref="hostRef" class="youtube-tv__screen" />
      <button
        v-if="mode === 'tv'"
        type="button"
        class="youtube-tv__btn youtube-tv__expand"
        aria-label="expand"
        @click="toggleExpanded"
      >
        <q-icon name="open_in_full" size="12px" />
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import type { AmbientAudio } from '../composables/useAmbientAudio';

const props = defineProps<{
  audio: AmbientAudio;
}>();

const youtube = props.audio.youtube;
const hostRef = ref<HTMLDivElement | null>(null);

const active = computed(
  () => props.audio.selectedAudioTrack.value === 'youtube' && youtube.started.value,
);
const mode = computed<'tv' | 'mini' | 'expanded'>(() => {
  if (youtube.expanded.value) return 'expanded';
  return youtube.tvScreen.visible ? 'tv' : 'mini';
});
const frameStyle = computed(() => {
  if (mode.value !== 'tv') return {};
  const { x, y, w, h } = youtube.tvScreen;
  return { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` };
});

function toggleExpanded() {
  youtube.expanded.value = !youtube.expanded.value;
}

// 關掉 = 停止播放，回到「沒在播」；選的還是 YouTube，按播放會再出現
function close() {
  youtube.expanded.value = false;
  props.audio.stopPlayback();
  youtube.started.value = false;
}

// 點了影片之後鍵盤會被 iframe 拿走，WASD 就走不動了：點完馬上把焦點還給地圖（點擊本身照樣有效）
function handleWindowBlur() {
  window.setTimeout(() => {
    const focused = document.activeElement;
    if (focused instanceof HTMLIFrameElement && hostRef.value?.contains(focused)) focused.blur();
  }, 0);
}

onMounted(() => {
  youtube.attachHost(hostRef.value);
  window.addEventListener('blur', handleWindowBlur);
});

onBeforeUnmount(() => {
  window.removeEventListener('blur', handleWindowBlur);
  youtube.attachHost(null);
});
</script>

<style scoped>
.youtube-tv {
  position: fixed;
  display: flex;
  flex-direction: column;
  background: #0b0d14;
}
.youtube-tv--tv {
  /* 地圖那一層是 z-10，要疊在它上面 */
  z-index: 15;
  box-shadow: 0 0 0 2px #15171f;
}
.youtube-tv--mini,
.youtube-tv--expanded {
  /* 底部工具列是 z-50 */
  z-index: 60;
  border: 3px solid #15171f;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.45);
}
.youtube-tv--mini {
  right: 16px;
  /* 疊在底部工具列上面（手機的工具列是兩排，比較高） */
  bottom: 128px;
  width: min(260px, calc(100vw - 32px));
}
@media (min-width: 640px) {
  .youtube-tv--mini {
    bottom: 104px;
    width: 320px;
  }
}
.youtube-tv--expanded {
  left: 50%;
  top: 50%;
  width: min(960px, calc(100vw - 32px));
  transform: translate(-50%, -50%);
}
.youtube-tv__screen {
  position: relative;
  flex: 1;
  min-height: 0;
}
.youtube-tv--mini .youtube-tv__screen,
.youtube-tv--expanded .youtube-tv__screen {
  flex: none;
  aspect-ratio: 16 / 9;
}
.youtube-tv__screen :deep(iframe) {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
}
.youtube-tv__bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 6px;
  background: #1c2030;
  color: #e5e7eb;
  font-size: 11px;
  font-weight: 700;
}
.youtube-tv__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  flex-shrink: 0;
  background: #2b3145;
  color: #e5e7eb;
  border: 2px solid #15171f;
}
.youtube-tv__btn:hover {
  background: #3b4360;
}
.youtube-tv__expand {
  position: absolute;
  top: -12px;
  right: -12px;
}
</style>
