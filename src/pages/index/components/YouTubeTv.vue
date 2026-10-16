<template>
  <!-- 影音牆上的 YouTube：看得到電視就疊在電視上，看不到就跳到右下角小視窗（可以再縮成一條標題列），也可以放大；
       切樓層／分區載入中藏起來（聲音照樣播）。掛在 body 底下：頁面外層有 transform，fixed 會跟著跑掉 -->
  <Teleport to="body">
    <div v-show="active" class="youtube-tv" :class="`youtube-tv--${mode}`" :style="frameStyle">
      <div
        v-if="mode === 'mini' || mode === 'minimized' || mode === 'expanded'"
        class="youtube-tv__bar"
      >
        <q-icon name="smart_display" size="14px" class="shrink-0 text-red-400" />
        <span class="min-w-0 flex-1 truncate">{{ youtube.title.value || 'YouTube' }}</span>
        <button
          v-if="mode !== 'expanded'"
          type="button"
          class="youtube-tv__btn"
          :aria-label="mode === 'minimized' ? 'restore' : 'minimize'"
          @click="youtube.minimized.value = mode !== 'minimized'"
        >
          <q-icon :name="mode === 'minimized' ? 'expand_less' : 'remove'" size="14px" />
        </button>
        <button
          type="button"
          class="youtube-tv__btn"
          :aria-label="mode === 'expanded' ? 'shrink' : 'expand'"
          @click="toggleExpanded"
        >
          <q-icon :name="mode === 'expanded' ? 'close_fullscreen' : 'open_in_full'" size="14px" />
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
        :class="{ 'youtube-tv__expand--inside': compact }"
        aria-label="expand"
        @click="toggleExpanded"
      >
        <q-icon name="open_in_full" size="12px" />
      </button>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue';
import type { AmbientAudio } from '../composables/useAmbientAudio';

const props = defineProps<{
  audio: AmbientAudio;
}>();

const youtube = props.audio.youtube;
const hostRef = ref<HTMLDivElement | null>(null);

const active = computed(
  () => props.audio.selectedAudioTrack.value === 'youtube' && youtube.started.value,
);
watchEffect(() => {
  youtube.showing.value = active.value;
});
// 手機（或很窄的畫面）：螢幕已經很小，看不到電視也不跳角落小視窗——影片一直貼在電視牆上跟著地圖動，
// 超出地圖的部分裁掉；電視整個不在畫面裡、開小地圖、去 F1／公園就藏起來，聲音照樣播
const compactQuery = typeof window !== 'undefined' ? window.matchMedia('(pointer: coarse), (max-width: 767px)') : null;
const compact = ref(compactQuery?.matches ?? false);
function onCompactChange(event: MediaQueryListEvent) {
  compact.value = event.matches;
}

const mode = computed<'tv' | 'mini' | 'minimized' | 'expanded' | 'hidden'>(() => {
  if (youtube.expanded.value) return 'expanded';
  // 切樓層／分區時地圖淡出顯示載入中，影片不要懸浮在上面
  if (youtube.tvScreen.loading) return 'hidden';
  if (youtube.tvScreen.visible) return 'tv';
  if (compact.value) return youtube.tvScreen.onMap ? 'tv' : 'hidden';
  return youtube.minimized.value ? 'minimized' : 'mini';
});
const frameStyle = computed(() => {
  // 角落小視窗／放大：明確把電視牆那時的 left/top/裁切清掉，不然會殘留、整個被推到畫面外（10-16 截圖）
  if (mode.value !== 'tv' && mode.value !== 'hidden') return { left: mode.value === 'expanded' ? '50%' : 'auto', top: mode.value === 'expanded' ? '50%' : 'auto', clipPath: 'none' };
  const { x, y, w, h, clipL, clipT, clipR, clipB } = youtube.tvScreen;
  const style: Record<string, string> = { left: `${x}px`, top: `${y}px`, width: `${w}px`, height: `${h}px` };
  // 電視有一部分在地圖外面（只有手機版會這樣顯示）：只露出地圖裡的那塊
  if (mode.value === 'tv' && !youtube.tvScreen.visible) {
    style.clipPath = `inset(${Math.max(0, clipT - y)}px ${Math.max(0, x + w - clipR)}px ${Math.max(0, y + h - clipB)}px ${Math.max(0, clipL - x)}px)`;
  }
  return style;
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
  compactQuery?.addEventListener('change', onCompactChange);
  youtube.attachHost(hostRef.value);
  window.addEventListener('blur', handleWindowBlur);
});

onBeforeUnmount(() => {
  compactQuery?.removeEventListener('change', onCompactChange);
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
  /* 地圖那一層是 z-10，要疊在它上面；跟地圖一樣淡入（切分區載入完時地圖是 0.5 秒淡入） */
  z-index: 15;
  transition: opacity 0.5s;
  box-shadow: 0 0 0 2px #15171f;
}
/* 疊在電視牆上的影片不接收點擊：點擊穿過去打到地圖或地圖上的按鈕（手機上影片常常蓋到右上角的小地圖鈕）；
   要操作影片用放大鈕或工具列 */
.youtube-tv--tv {
  pointer-events: none;
}
.youtube-tv--tv .youtube-tv__btn {
  pointer-events: auto;
}
/* 藏起來時 iframe 不能拿掉（會重新載入），只把它裁掉 */
.youtube-tv--hidden {
  z-index: 15;
  opacity: 0;
  clip-path: inset(50%);
  pointer-events: none;
}
.youtube-tv--mini,
.youtube-tv--minimized,
.youtube-tv--expanded {
  /* 底部工具列是 z-50 */
  z-index: 60;
  border: 3px solid #15171f;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.45);
}
.youtube-tv--mini,
.youtube-tv--minimized {
  right: 16px;
  /* 疊在底部工具列上面（手機的工具列是兩排，比較高） */
  bottom: 128px;
  width: min(260px, calc(100vw - 32px));
}
@media (min-width: 640px) {
  .youtube-tv--mini,
  .youtube-tv--minimized {
    bottom: 104px;
    width: 320px;
  }
}
.youtube-tv--minimized {
  width: min(240px, calc(100vw - 32px));
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
/* 縮小：只剩標題列，影片縮成 0 高（聲音照樣播） */
.youtube-tv--minimized .youtube-tv__screen {
  flex: none;
  height: 0;
  overflow: hidden;
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
/* 手機版影片可能被裁掉一部分：放大鈕放在影片左上角裡面，才不會跟著被裁掉 */
.youtube-tv__expand--inside {
  top: 4px;
  right: auto;
  left: 4px;
}
</style>
