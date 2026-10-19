<template>
  <!-- 蓋在地圖上的過場動畫（地圖區域內，全螢幕也跟著）。至少播 MIN_MS，載入還沒好就繼續播 -->
  <Transition name="scene-tr">
    <div v-if="shown" class="scene-tr absolute inset-0 z-40 !flex flex-col items-center justify-center overflow-hidden" :class="`scene-tr--${shown.kind}`" aria-live="polite">
      <!-- 捷運：隧道、燈一盞盞往後跑，列車開進來停一下再開走 -->
      <div v-if="shown.kind === 'mrt'" class="tr-mrt">
        <div class="tr-mrt__lights"><span v-for="i in 8" :key="i" /></div>
        <div class="tr-mrt__train" :style="{ '--line': LINE_COLORS[shown.line ?? 'red'] }">
          <div v-for="car in 3" :key="car" class="tr-mrt__car">
            <span v-for="w in 4" :key="w" class="tr-mrt__window" />
            <span class="tr-mrt__stripe" />
          </div>
        </div>
        <div class="tr-mrt__rail" />
      </div>

      <!-- 電梯：門關上、樓層數字跳、門打開 -->
      <div v-else-if="shown.kind === 'elevator'" class="tr-elev">
        <div class="tr-elev__panel">
          <span class="tr-elev__arrow">{{ shown.up === false ? '▼' : '▲' }}</span>
          <span class="font-pixel tr-elev__floor">{{ shown.label }}</span>
        </div>
        <div class="tr-elev__frame">
          <div class="tr-elev__door tr-elev__door--l" />
          <div class="tr-elev__door tr-elev__door--r" />
        </div>
      </div>

      <!-- 樓梯：一階一階的腳印 -->
      <div v-else-if="shown.kind === 'stairs'" class="tr-stairs" :class="{ 'tr-stairs--down': shown.up === false }">
        <div v-for="i in 5" :key="i" class="tr-stairs__step" :style="{ '--i': i }"><span>👣</span></div>
      </div>

      <!-- 回家／出門：小房子，門打開透出暖光 -->
      <div v-else-if="shown.kind === 'home'" class="tr-home">
        <div class="tr-home__roof" />
        <div class="tr-home__body">
          <div class="tr-home__window" />
          <div class="tr-home__door"><div class="tr-home__glow" /></div>
        </div>
      </div>

      <!-- 一般載入：小島在海上晃 -->
      <div v-else class="tr-load">
        <img src="/icons/logo.svg" alt="" class="tr-load__island" width="64" height="64" />
        <div class="tr-load__waves"><span v-for="i in 3" :key="i" /></div>
      </div>

      <p class="tr-label">
        {{ text }}<span class="tr-dots"><span>.</span><span>.</span><span>.</span></span>
      </p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import { useLocale } from 'src/composables/useLocale';
import { transition, type TransitionState } from 'src/pages/index/sceneTransition';

const props = defineProps<{ loading: boolean }>();
const { t } = useLocale();

const MIN_MS = 1300;
const LINE_COLORS = { red: '#e3002c', green: '#008659', orange: '#f39800', blue: '#0070bd' } as const;
const shown = ref<TransitionState | null>(null);
let timer: number | undefined;

const text = computed(() => {
  const s = shown.value;
  if (!s) return '';
  const tr = t.value.transition;
  if (s.kind === 'mrt') return tr.mrt(s.label);
  if (s.kind === 'elevator') return tr.elevator(s.label);
  if (s.kind === 'stairs') return s.up === false ? tr.stairsDown : tr.stairsUp;
  if (s.kind === 'home') return s.label || tr.home;
  return s.label || tr.loading;
});

// 播夠久、而且載入好了才收
function tryHide(): void {
  window.clearTimeout(timer);
  const s = shown.value;
  if (!s) return;
  const left = MIN_MS - (performance.now() - s.startedAt);
  if (left > 0 || props.loading) {
    timer = window.setTimeout(tryHide, Math.max(80, left));
    return;
  }
  shown.value = null;
  transition.value = null;
}

watch(transition, (s) => {
  if (!s) return;
  shown.value = s;
  tryHide();
});

// 沒有人先叫過場、自己在載入（第一次打開、斷線重連）：放一般載入
watch(
  () => props.loading,
  (loading) => {
    if (loading && !shown.value) {
      shown.value = { kind: 'loading', label: '', startedAt: performance.now() };
      tryHide();
    } else if (!loading) tryHide();
  },
  { immediate: true },
);

onBeforeUnmount(() => window.clearTimeout(timer));
</script>

<style scoped>
.scene-tr {
  background: radial-gradient(circle at 50% 45%, #2a2d42 0%, #14151d 75%);
  color: #fff;
  border-radius: 3px;
}
.scene-tr-enter-active {
  transition: opacity 0.18s ease-out;
}
.scene-tr-leave-active {
  transition: opacity 0.35s ease-in;
}
.scene-tr-enter-from,
.scene-tr-leave-to {
  opacity: 0;
}
.tr-label {
  margin: 22px 0 0;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.12em;
  color: #fbbf24;
  text-align: center;
  padding: 0 16px;
}
.tr-dots span {
  animation: tr-dot 1.2s infinite;
  opacity: 0;
}
.tr-dots span:nth-child(2) {
  animation-delay: 0.2s;
}
.tr-dots span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes tr-dot {
  30%,
  70% {
    opacity: 1;
  }
}

/* ── 捷運 ── */
.tr-mrt {
  position: relative;
  width: min(420px, 88%);
  height: 120px;
  overflow: hidden;
  border-radius: 6px;
  background: linear-gradient(#20222c, #2c2f3b 60%, #1a1b22);
  box-shadow: inset 0 0 0 3px #0e0f14;
}
.tr-mrt__lights {
  position: absolute;
  inset: 10px 0 auto 0;
  height: 6px;
  display: flex;
  gap: 48px;
  animation: tr-lights 0.5s linear infinite;
}
.tr-mrt__lights span {
  flex: none;
  width: 14px;
  height: 5px;
  background: #ffe7a3;
  box-shadow: 0 0 10px 2px rgba(255, 220, 140, 0.6);
}
@keyframes tr-lights {
  to {
    transform: translateX(-62px);
  }
}
.tr-mrt__train {
  position: absolute;
  bottom: 22px;
  left: 0;
  display: flex;
  gap: 4px;
  animation: tr-train 1.3s cubic-bezier(0.45, 0, 0.3, 1) both;
}
@keyframes tr-train {
  0% {
    transform: translateX(110%);
  }
  45%,
  60% {
    transform: translateX(8%);
  }
  100% {
    transform: translateX(-120%);
  }
}
.tr-mrt__car {
  position: relative;
  width: 112px;
  height: 52px;
  background: linear-gradient(#f4f6f9, #d4d9e1);
  border: 3px solid #15171f;
  border-radius: 10px 10px 4px 4px;
  display: flex;
  gap: 6px;
  padding: 8px 8px 0;
}
.tr-mrt__car:first-child {
  border-radius: 22px 10px 4px 4px;
}
.tr-mrt__window {
  width: 20px;
  height: 18px;
  background: #8fc7e8;
  border: 2px solid #15171f;
  border-radius: 3px;
}
.tr-mrt__stripe {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 9px;
  height: 7px;
  background: var(--line);
}
.tr-mrt__rail {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 14px;
  height: 5px;
  background: repeating-linear-gradient(90deg, #6b6f7a 0 18px, #4a4d56 18px 22px);
}

/* ── 電梯 ── */
.tr-elev {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tr-elev__panel {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px 12px;
  margin-bottom: 8px;
  background: #0e0f14;
  border: 3px solid #3a3d45;
  border-radius: 4px;
  color: #ff9b4a;
  text-shadow: 0 0 6px rgba(255, 155, 74, 0.8);
}
.tr-elev__arrow {
  animation: tr-blink 0.6s steps(2) infinite;
}
.tr-elev__floor {
  font-size: 18px;
  font-weight: 700;
}
@keyframes tr-blink {
  50% {
    opacity: 0.2;
  }
}
.tr-elev__frame {
  position: relative;
  width: 150px;
  height: 160px;
  overflow: hidden;
  background: #fff3c4;
  border: 6px solid #8d929c;
  border-bottom-width: 3px;
  box-shadow: 0 0 40px rgba(255, 230, 160, 0.25);
}
.tr-elev__door {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50%;
  background: linear-gradient(90deg, #b9bec7, #d9dde3 50%, #a8adb6);
  border: 2px solid #6b707a;
  animation: tr-doors 1.3s ease-in-out both;
}
.tr-elev__door--l {
  left: 0;
  --from: -100%;
}
.tr-elev__door--r {
  right: 0;
  --from: 100%;
}
@keyframes tr-doors {
  0% {
    transform: translateX(var(--from));
  }
  30%,
  70% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(var(--from));
  }
}

/* ── 樓梯 ── */
.tr-stairs {
  position: relative;
  width: 220px;
  height: 150px;
}
.tr-stairs__step {
  position: absolute;
  left: calc((var(--i) - 1) * 40px);
  bottom: calc((var(--i) - 1) * 26px);
  width: 48px;
  height: 26px;
  background: #b48a5c;
  border-top: 4px solid #d6aa72;
  box-shadow: 0 4px 0 #6b4a2f;
}
.tr-stairs--down .tr-stairs__step {
  left: auto;
  right: calc((var(--i) - 1) * 40px);
}
.tr-stairs__step span {
  position: absolute;
  left: 12px;
  top: -24px;
  font-size: 18px;
  opacity: 0;
  animation: tr-step 1.3s infinite;
  animation-delay: calc(var(--i) * 0.18s);
}
@keyframes tr-step {
  0% {
    opacity: 0;
    transform: translateY(4px);
  }
  20%,
  60% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
  }
}

/* ── 回家 ── */
.tr-home {
  display: flex;
  flex-direction: column;
  align-items: center;
  animation: tr-pop 0.4s ease-out both;
}
@keyframes tr-pop {
  from {
    transform: scale(0.85);
    opacity: 0;
  }
}
.tr-home__roof {
  width: 0;
  height: 0;
  border-left: 82px solid transparent;
  border-right: 82px solid transparent;
  border-bottom: 56px solid #c4553f;
  filter: drop-shadow(0 3px 0 #8e3a2b);
}
.tr-home__body {
  position: relative;
  width: 134px;
  height: 92px;
  background: #f1e3c6;
  border: 4px solid #6b4a2f;
  border-top: none;
}
.tr-home__window {
  position: absolute;
  left: 16px;
  top: 16px;
  width: 30px;
  height: 26px;
  background: #ffd98a;
  border: 3px solid #6b4a2f;
  box-shadow: 0 0 14px rgba(255, 210, 120, 0.7);
}
.tr-home__door {
  position: absolute;
  right: 22px;
  bottom: 0;
  width: 36px;
  height: 56px;
  background: #2b1d14;
  border: 3px solid #6b4a2f;
  border-bottom: none;
  overflow: hidden;
}
.tr-home__door::after {
  content: '';
  position: absolute;
  inset: 0;
  background: #8a5c3a;
  transform-origin: left center;
  animation: tr-door 1.3s ease-in-out both;
}
.tr-home__glow {
  position: absolute;
  inset: 0;
  background: linear-gradient(#ffe9a8, #ffc96b);
}
@keyframes tr-door {
  0%,
  20% {
    transform: perspective(80px) rotateY(0deg);
  }
  70%,
  100% {
    transform: perspective(80px) rotateY(-75deg);
  }
}

/* ── 一般載入 ── */
.tr-load {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.tr-load__island {
  width: 72px;
  height: 72px;
  image-rendering: pixelated;
  animation: tr-bob 1.6s ease-in-out infinite;
}
@keyframes tr-bob {
  50% {
    transform: translateY(-8px) rotate(-3deg);
  }
}
.tr-load__waves {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}
.tr-load__waves span {
  width: 26px;
  height: 6px;
  border-radius: 6px;
  background: #5ab9e8;
  animation: tr-wave 1.2s ease-in-out infinite;
}
.tr-load__waves span:nth-child(2) {
  animation-delay: 0.2s;
}
.tr-load__waves span:nth-child(3) {
  animation-delay: 0.4s;
}
@keyframes tr-wave {
  50% {
    transform: translateY(-4px);
    opacity: 0.6;
  }
}

@media (prefers-reduced-motion: reduce) {
  .scene-tr * {
    animation-duration: 0.01s !important;
    animation-iteration-count: 1 !important;
  }
}
</style>
