<template>
  <!-- 手機往下拉重新整理：瀏覽器內建的常常被地圖吃掉、加到主畫面後也沒有，所以自己做一個 -->
  <div
    v-if="pull > 0"
    class="pixel-panel pointer-events-none fixed left-1/2 z-[9999] !flex !flex-nowrap items-center gap-1.5 px-3 py-1.5 text-xs font-black"
    :style="{ top: `${Math.min(pull, MAX) - 34}px`, transform: 'translateX(-50%)', opacity: Math.min(1, pull / TRIGGER) }"
  >
    <q-icon name="refresh" size="16px" :class="{ 'animate-spin': reloading }" :style="{ transform: reloading ? undefined : `rotate(${pull * 3}deg)` }" />
    {{ reloading ? t.pullToRefresh.loading : pull >= TRIGGER ? t.pullToRefresh.release : t.pullToRefresh.pull }}
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useLocale } from 'src/composables/useLocale';

const { t } = useLocale();
// 拉多遠（px，已經打過折）才算數；最多顯示到多下面
const TRIGGER = 70;
const MAX = 110;
const pull = ref(0);
const reloading = ref(false);
let startY: number | null = null;

// 這些地方的滑動有自己的用途：對話框、全螢幕地圖、搖桿（touchmove 會被 preventDefault）
function blocked(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  if (target.closest('.q-dialog, .q-menu, .scene-shell--fs, input, textarea, select, [data-no-pull-refresh]')) return true;
  // 在自己會捲動、而且沒捲到頂的區塊裡：那是在捲那一塊
  for (let el: Element | null = target; el && el !== document.body; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

function onStart(event: TouchEvent): void {
  startY = null;
  if (reloading.value || event.defaultPrevented || event.touches.length !== 1 || window.scrollY > 0 || blocked(event.target)) return;
  startY = event.touches[0]?.clientY ?? null;
}

function onMove(event: TouchEvent): void {
  if (startY === null) return;
  if (event.defaultPrevented || window.scrollY > 0) {
    startY = null;
    pull.value = 0;
    return;
  }
  const dy = (event.touches[0]?.clientY ?? startY) - startY;
  // 越拉越緊，像真的橡皮筋
  pull.value = dy > 0 ? dy * 0.5 : 0;
}

function onEnd(): void {
  if (startY === null) return;
  startY = null;
  if (pull.value >= TRIGGER) {
    reloading.value = true;
    pull.value = TRIGGER;
    window.location.reload();
    return;
  }
  pull.value = 0;
}

onMounted(() => {
  if (!window.matchMedia('(pointer: coarse)').matches) return;
  window.addEventListener('touchstart', onStart, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });
  window.addEventListener('touchend', onEnd, { passive: true });
  window.addEventListener('touchcancel', onEnd, { passive: true });
});

onBeforeUnmount(() => {
  window.removeEventListener('touchstart', onStart);
  window.removeEventListener('touchmove', onMove);
  window.removeEventListener('touchend', onEnd);
  window.removeEventListener('touchcancel', onEnd);
});
</script>
