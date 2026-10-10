<template>
  <!-- F1 賽車場：從 101 旁的 F1 站過來的獨立地圖，不跟圖書館那張相連；只有自己看得到（不同步給別人） -->
  <div class="relative">
    <div
      ref="containerRef"
      class="relative h-[calc(100dvh-350px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#3f7a3a] outline-none lg:h-[calc(100vh-300px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <!-- 圈速 -->
      <div class="pixel-panel absolute right-2 top-2 px-3 py-2 text-right">
        <p class="!mb-0 font-pixel text-[10px] uppercase text-[color:var(--px-accent-dark)] dark:!text-amber-300">🏁 {{ t.f1.title }}</p>
        <p class="!mb-0 mt-1 font-pixel text-sm font-bold">{{ t.f1.lap }} {{ formatLap(currentLap) }}</p>
        <p class="!mb-0 font-pixel text-[11px] text-[color:var(--px-muted)]">{{ t.f1.last }} {{ formatLap(lastLap) }} · {{ t.f1.best }} {{ formatLap(bestLap) }}</p>
      </div>

      <!-- 回程的車站 -->
      <div v-if="stationOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center">
        <p class="!mb-2 !text-[11px] font-black">🚉 {{ t.f1.stationPrompt }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="emit('leave')">{{ t.f1.goBack }}</button>
      </div>

      <button
        v-if="driving"
        type="button"
        class="pixel-btn pixel-btn--primary absolute right-2 h-9 px-3 text-xs"
        :class="isTouch ? 'bottom-28' : 'bottom-2'"
        @click="getOut"
      >
        {{ t.f1.getOut }}
      </button>

      <!-- 手機搖桿 -->
      <div
        v-if="isTouch"
        ref="stickRef"
        class="pixel-panel absolute bottom-2 right-2 h-24 w-24 !rounded-full opacity-80"
        style="touch-action: none"
        @pointerdown="stickDown"
        @pointermove="stickMove"
        @pointerup="stickUp"
        @pointercancel="stickUp"
      >
        <div
          class="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 rounded-full border-2 border-[color:var(--px-ink)] bg-[color:var(--px-accent)]"
          :style="{ transform: `translate(calc(-50% + ${knob.x}px), calc(-50% + ${knob.y}px))` }"
        ></div>
      </div>
    </div>
    <p class="mt-1.5 px-2 text-center text-[10px] font-bold leading-snug tracking-wide text-slate-500 dark:!text-white/55">
      {{ isTouch ? t.f1.hintTouch : t.f1.hintDesktop }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useLocale } from 'src/composables/useLocale';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { AVATAR_SIZE, getAvatarFrame, lookColors } from 'src/pages/index/pixel/pixelArt';
import { px, seeded } from 'src/pages/index/pixel/pixelUtil';

const emit = defineEmits<{ leave: [] }>();
const { t } = useLocale();
const prefs = usePlayerPrefs();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stickRef = ref<HTMLDivElement | null>(null);
const isTouch = ref(false);
const stationOpen = ref(false);
const driving = ref(false);
const currentLap = ref<number | null>(null);
const lastLap = ref<number | null>(null);
const bestLap = ref<number | null>(readBest());

// ── 場地（格，1 格 = 16px） ──
const T = 16;
const W = 64;
const H = 40;
const TRACK_HALF = 2.2;
// 賽道中心線（逆時針一圈）
const TRACK: [number, number][] = [
  [10, 8],
  [40, 8],
  [51, 10],
  [56, 16],
  [54, 24],
  [46, 28],
  [38, 25],
  [30, 30],
  [16, 32],
  [8, 26],
  [6, 16],
];
const START_X = 20;
const BLOCKS = [
  { x0: 14, y0: 1.5, x1: 32, y1: 4.5 }, // 維修站大樓
  { x0: 34, y0: 1, x1: 50, y1: 4 }, // 北看台
  { x0: 18, y0: 13, x1: 34, y1: 16 }, // 內場看台
];
const STATION = { x0: 2, y0: 1.5, x1: 6, y1: 4, trigger: { x: 4, y: 5 } };
const CAR_HOME = { x: 23, y: 5.7, angle: 0 };
const NPC_CARS = [
  { color: '#d72d2d', accent: '#f6c945', speed: 10.5, offset: 0 },
  { color: '#2fb3a6', accent: '#2b2d33', speed: 11.2, offset: 0.25 },
  { color: '#f2a541', accent: '#5b6ee1', speed: 9.8, offset: 0.5 },
  { color: '#3b4fbf', accent: '#e25a4a', speed: 10.8, offset: 0.75 },
];

// 賽道每一段的長度，用來把「跑了多遠」換成座標
const segments = TRACK.map((p, i) => {
  const q = TRACK[(i + 1) % TRACK.length] ?? p;
  return { from: p, to: q, length: Math.hypot(q[0] - p[0], q[1] - p[1]) };
});
const trackLength = segments.reduce((sum, s) => sum + s.length, 0);

function pointOnTrack(distance: number): { x: number; y: number; angle: number } {
  let d = ((distance % trackLength) + trackLength) % trackLength;
  for (const s of segments) {
    if (d <= s.length) {
      const k = d / s.length;
      return { x: s.from[0] + (s.to[0] - s.from[0]) * k, y: s.from[1] + (s.to[1] - s.from[1]) * k, angle: Math.atan2(s.to[1] - s.from[1], s.to[0] - s.from[0]) };
    }
    d -= s.length;
  }
  return { x: TRACK[0]?.[0] ?? 0, y: TRACK[0]?.[1] ?? 0, angle: 0 };
}

function distanceToTrack(x: number, y: number): number {
  let best = Infinity;
  for (const s of segments) {
    const dx = s.to[0] - s.from[0];
    const dy = s.to[1] - s.from[1];
    const k = Math.max(0, Math.min(1, ((x - s.from[0]) * dx + (y - s.from[1]) * dy) / (dx * dx + dy * dy)));
    best = Math.min(best, Math.hypot(x - (s.from[0] + dx * k), y - (s.from[1] + dy * k)));
  }
  return best;
}

const blocked = (x: number, y: number) =>
  x < 0.5 || y < 0.5 || x > W - 0.5 || y > H - 0.5 || BLOCKS.some((b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) || (x > STATION.x0 && x < STATION.x1 && y > STATION.y0 && y < STATION.y1);

// ── 自己 ──
const me = { x: STATION.trigger.x + 1.5, y: STATION.trigger.y + 0.5, facing: 'down' as 'up' | 'down' | 'left' | 'right', moving: false, walkClock: 0 };
const car = { x: CAR_HOME.x, y: CAR_HOME.y, angle: CAR_HOME.angle, speed: 0 };
let stationLock = false;
let lapStart: number | null = null;
let lastX = car.x;

const keys = new Set<string>();
const stick = { x: 0, y: 0 };
const knob = ref({ x: 0, y: 0 });
let stickPointer: number | null = null;

function readBest(): number | null {
  try {
    const v = Number(localStorage.getItem('focus_island_f1_best_v1'));
    return Number.isFinite(v) && v > 0 ? v : null;
  } catch {
    return null;
  }
}

function formatLap(seconds: number | null): string {
  if (seconds === null) return '--:--.-';
  const m = Math.floor(seconds / 60);
  const s = seconds - m * 60;
  return `${m}:${s.toFixed(1).padStart(4, '0')}`;
}

function input(): { x: number; y: number } {
  const x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0) || stick.x;
  const y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0) || stick.y;
  return { x, y };
}

function nearCar(): boolean {
  return Math.hypot(car.x - me.x, car.y - me.y) < 1.8;
}

function getIn(): void {
  driving.value = true;
  stationOpen.value = false;
  lapStart = null;
  currentLap.value = null;
}

function getOut(): void {
  driving.value = false;
  car.speed = 0;
  me.x = car.x;
  me.y = car.y + 1.2;
  if (blocked(me.x, me.y)) me.y = car.y - 1.2;
  containerRef.value?.focus({ preventScroll: true });
}

// 開車：方向鍵（或搖桿）指哪個方向，車頭就轉過去並加速；在賽道外面會慢很多
function updateCar(dt: number, now: number): void {
  const { x, y } = input();
  const pushing = x !== 0 || y !== 0;
  const onTrack = distanceToTrack(car.x, car.y) <= TRACK_HALF + 0.3;
  const top = onTrack ? 16 : 4;
  if (pushing) {
    const target = Math.atan2(y, x);
    let diff = target - car.angle;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    car.angle += Math.sign(diff) * Math.min(Math.abs(diff), dt * 3.2);
    // 方向差太多先減速轉彎
    const want = Math.abs(diff) > 1.6 ? top * 0.3 : top;
    car.speed += (want - car.speed) * Math.min(1, dt * 1.6);
  } else {
    car.speed -= car.speed * Math.min(1, dt * 1.2);
  }
  if (!onTrack && car.speed > top) car.speed -= (car.speed - top) * Math.min(1, dt * 4);
  const nx = car.x + Math.cos(car.angle) * car.speed * dt;
  const ny = car.y + Math.sin(car.angle) * car.speed * dt;
  if (blocked(nx, ny)) {
    car.speed *= -0.25;
  } else {
    lastX = car.x;
    car.x = nx;
    car.y = ny;
  }
  // 由左往右越過起終點線（在賽道上）就算一圈
  if (lastX < START_X && car.x >= START_X && Math.abs(car.y - 8) < TRACK_HALF + 0.5) {
    if (lapStart !== null) {
      const lap = now - lapStart;
      lastLap.value = lap;
      if (bestLap.value === null || lap < bestLap.value) {
        bestLap.value = lap;
        try {
          localStorage.setItem('focus_island_f1_best_v1', String(lap));
        } catch {
          // ignore storage errors
        }
      }
    }
    lapStart = now;
  }
  currentLap.value = lapStart === null ? null : now - lapStart;
}

function updateWalk(dt: number): void {
  const { x, y } = input();
  me.moving = x !== 0 || y !== 0;
  if (me.moving) {
    const length = Math.hypot(x, y);
    const nx = me.x + (x / length) * 4.2 * dt;
    const ny = me.y + (y / length) * 4.2 * dt;
    if (!blocked(nx, me.y)) me.x = nx;
    if (!blocked(me.x, ny)) me.y = ny;
    me.facing = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : y > 0 ? 'down' : 'up';
    me.walkClock += dt;
  }
  const atStation = Math.hypot(me.x - STATION.trigger.x, me.y - STATION.trigger.y) < 1.1;
  if (!atStation) stationLock = false;
  stationOpen.value = atStation && !stationLock;
}

// ── 畫 ──
let ctx: CanvasRenderingContext2D | null = null;
let ground: HTMLCanvasElement | null = null;
const view = { scale: 2, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };

function paintGround(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W * T;
  canvas.height = H * T;
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  const rand = seeded(91);
  px(c, '#4f9a4a', 0, 0, W * T, H * T);
  for (let i = 0; i < 2600; i += 1) px(c, rand() < 0.5 ? '#5aa955' : '#468a42', Math.floor(rand() * W * T), Math.floor(rand() * H * T), 2, 1);
  // 草地上割草的條紋
  for (let y = 0; y < H * T; y += 32) px(c, 'rgba(255,255,255,0.04)', 0, y, W * T, 16);
  // 賽道：每一段畫成粗線，接頭補圓
  const stroke = (width: number, color: string) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    c.beginPath();
    TRACK.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * T, y * T) : c.lineTo(x * T, y * T)));
    c.closePath();
    c.stroke();
  };
  stroke((TRACK_HALF * 2 + 1.2) * T, '#c3b28a'); // 碎石緩衝區
  stroke((TRACK_HALF * 2 + 0.5) * T, '#e25a4a'); // 紅白路緣石（下面再蓋白點）
  stroke(TRACK_HALF * 2 * T, '#4a4d55');
  c.setLineDash([8, 8]);
  stroke((TRACK_HALF * 2 + 0.5) * T, 'rgba(255,255,255,0.9)');
  c.setLineDash([]);
  stroke(TRACK_HALF * 2 * T, '#4a4d55');
  c.setLineDash([12, 14]);
  stroke(2, 'rgba(255,255,255,0.35)');
  c.setLineDash([]);
  // 起終點格子線
  for (let row = 0; row < 8; row += 1) {
    for (let col = 0; col < 2; col += 1) px(c, (row + col) % 2 === 0 ? '#ffffff' : '#15171f', START_X * T + col * 4, (8 - TRACK_HALF) * T + row * ((TRACK_HALF * 2 * T) / 8), 4, (TRACK_HALF * 2 * T) / 8);
  }
  // 維修道（大樓前面）
  px(c, '#5f636c', 13 * T, 4.5 * T, 20 * T, 1.6 * T);
  for (let x = 14; x < 32; x += 2) px(c, '#f4eee2', x * T, 4.5 * T, 2, 1.6 * T);
  return canvas;
}

function drawBuilding(c: CanvasRenderingContext2D, b: { x0: number; y0: number; x1: number; y1: number }, kind: 'pit' | 'stand', seconds: number): void {
  const x = b.x0 * T;
  const y = b.y0 * T;
  const w = (b.x1 - b.x0) * T;
  const h = (b.y1 - b.y0) * T;
  px(c, 'rgba(0,0,0,0.25)', x + 4, y + h - 2, w, 6);
  if (kind === 'pit') {
    px(c, '#d9d4c8', x, y, w, h);
    px(c, '#2b2d33', x, y, w, 8);
    for (let i = 0; i < 6; i += 1) {
      const gx = x + 8 + i * ((w - 16) / 6);
      px(c, '#3a3d45', gx, y + 16, (w - 16) / 6 - 4, h - 18);
      px(c, ['#d72d2d', '#2fb3a6', '#f2a541', '#3b4fbf', '#4fa35a', '#e86a8a'][i] ?? '#d72d2d', gx, y + 12, (w - 16) / 6 - 4, 4);
    }
    return;
  }
  // 看台：一排排觀眾，會跟著搖
  px(c, '#8f949e', x, y, w, h);
  const rand = seeded(Math.floor(b.x0 * 7 + b.y0));
  for (let row = 0; row < Math.floor(h / 8); row += 1) {
    px(c, '#6e737d', x, y + row * 8 + 7, w, 1);
    for (let cx = x + 3; cx < x + w - 3; cx += 5) {
      const color = ['#e25a4a', '#f6c945', '#2fb3a6', '#f4eee2', '#5b6ee1', '#f2a541'][Math.floor(rand() * 6)] ?? '#f4eee2';
      const jump = Math.sin(seconds * 6 + cx * 0.3 + row) > 0.85 ? 1 : 0;
      px(c, '#f6d1b0', cx, y + row * 8 + 1 - jump, 3, 3);
      px(c, color, cx, y + row * 8 + 4 - jump, 3, 3);
    }
  }
}

function drawStation(c: CanvasRenderingContext2D): void {
  const x = STATION.x0 * T;
  const y = STATION.y0 * T;
  const w = (STATION.x1 - STATION.x0) * T;
  const h = (STATION.y1 - STATION.y0) * T;
  px(c, 'rgba(0,0,0,0.2)', x + 2, y + h - 2, w, 4);
  px(c, '#e3e8f0', x, y, w, h - 6);
  px(c, '#3a3d45', x + 10, y + 8, w - 20, h - 16);
  for (let i = 0; i < 6; i += 1) px(c, i % 2 === 0 ? '#ffffff' : '#15171f', x + 4 + i * 4, y - 10, 4, 4);
  for (let i = 0; i < 6; i += 1) px(c, i % 2 === 1 ? '#ffffff' : '#15171f', x + 4 + i * 4, y - 6, 4, 4);
}

function drawF1(c: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, accent: string): void {
  c.save();
  c.translate(Math.round(x * T), Math.round(y * T));
  c.rotate(angle);
  px(c, 'rgba(0,0,0,0.25)', -15, -5, 32, 12);
  // 四個輪子
  for (const [wx, wy] of [[-11, -8], [-11, 5], [7, -8], [7, 5]] as const) px(c, '#15171f', wx, wy, 6, 3);
  // 車身：細長、鼻翼、尾翼
  px(c, color, -12, -3, 26, 6);
  px(c, color, 12, -2, 5, 4);
  px(c, accent, 15, -7, 3, 14); // 前翼
  px(c, accent, -15, -7, 3, 14); // 尾翼
  px(c, '#2b2d33', -3, -2, 6, 4); // 駕駛艙
  px(c, '#f6c945', -2, -1, 2, 2); // 安全帽
  px(c, 'rgba(255,255,255,0.35)', -10, -3, 20, 1);
  c.restore();
}

function drawMe(c: CanvasRenderingContext2D): void {
  const colors = lookColors(prefs.value.hair, prefs.value.shirt);
  const frame = me.moving ? (Math.floor(me.walkClock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  const sprite = getAvatarFrame(colors, me.facing, frame);
  px(c, 'rgba(0,0,0,0.18)', Math.round(me.x * T - 5), Math.round(me.y * T + 3), 10, 2);
  c.drawImage(sprite, Math.round(me.x * T - AVATAR_SIZE.w / 2), Math.round(me.y * T + 5 - AVATAR_SIZE.h));
}

function pill(c: CanvasRenderingContext2D, text: string, cx: number, bottom: number, color: string): void {
  c.font = '700 12px system-ui, -apple-system, "PingFang TC", sans-serif';
  const width = Math.ceil(c.measureText(text).width) + 14;
  const height = 20;
  c.fillStyle = 'rgba(15, 23, 42, 0.86)';
  c.beginPath();
  c.roundRect(Math.round(cx - width / 2), Math.round(bottom - height), width, height, height / 2);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = '#ffffff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, cx, bottom - height / 2 + 0.5);
}

function render(seconds: number): void {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!ctx || !canvas || !container) return;
  const cssW = container.clientWidth;
  const cssH = container.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const scale = cssW >= 900 ? 3 : 2;
  const focus = driving.value ? car : me;
  const follow = (size: number, world: number, at: number) => (world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - at)));
  const ox = Math.round(follow(cssW, W * T * scale, focus.x * T * scale) * dpr) / dpr;
  const oy = Math.round(follow(cssH, H * T * scale, focus.y * T * scale) * dpr) / dpr;
  Object.assign(view, { scale, ox, oy, dpr, w: cssW, h: cssH });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  if (ground) ctx.drawImage(ground, 0, 0);

  // 依 y 排前後
  const items: { y: number; draw: () => void }[] = [];
  const c = ctx;
  BLOCKS.forEach((b, i) => items.push({ y: b.y1, draw: () => drawBuilding(c, b, i === 0 ? 'pit' : 'stand', seconds) }));
  items.push({ y: STATION.y1, draw: () => drawStation(c) });
  NPC_CARS.forEach((npc) => {
    const p = pointOnTrack(seconds * npc.speed + npc.offset * trackLength);
    items.push({ y: p.y, draw: () => drawF1(c, p.x, p.y, p.angle, npc.color, npc.accent) });
  });
  items.push({ y: car.y, draw: () => drawF1(c, car.x, car.y, car.angle, '#f6c945', '#2b2d33') });
  if (!driving.value) items.push({ y: me.y + 0.35, draw: () => drawMe(c) });
  items.sort((a, b) => a.y - b.y).forEach((item) => item.draw());

  // 名牌（螢幕座標）
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  const sp = screen((STATION.x0 + STATION.x1) / 2, STATION.y0 - 0.8);
  pill(ctx, t.value.f1.stationName, sp.x, sp.y, '#fbbf24');
  const cp = screen(car.x, car.y - 0.8);
  if (!driving.value) pill(ctx, t.value.f1.yourCar, cp.x, cp.y, '#fbbf24');
  const mp = driving.value ? screen(car.x, car.y - 0.8) : screen(me.x, me.y - 1);
  pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
}

let rafId = 0;
let last = 0;
function frame(time: number): void {
  rafId = requestAnimationFrame(frame);
  const seconds = time / 1000;
  const dt = last ? Math.min(0.05, seconds - last) : 0;
  last = seconds;
  if (driving.value) updateCar(dt, seconds);
  else updateWalk(dt);
  render(seconds);
}

// ── 輸入 ──
const KEY_MAP: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  KeyW: 'up',
  ArrowUp: 'up',
  KeyS: 'down',
  ArrowDown: 'down',
  KeyA: 'left',
  ArrowLeft: 'left',
  KeyD: 'right',
  ArrowRight: 'right',
};

function ignoreKey(event: KeyboardEvent): boolean {
  const target = event.target instanceof HTMLElement ? event.target : null;
  return !!target?.closest('input, textarea, select, [role="dialog"]');
}

function onKeyDown(event: KeyboardEvent): void {
  if (ignoreKey(event) || event.metaKey || event.ctrlKey || event.altKey) return;
  const dir = KEY_MAP[event.code];
  if (dir) {
    event.preventDefault();
    keys.add(dir);
    return;
  }
  if (event.code === 'KeyE' || event.code === 'Space') {
    event.preventDefault();
    if (driving.value) getOut();
    else if (nearCar()) getIn();
  }
}

function onKeyUp(event: KeyboardEvent): void {
  const dir = KEY_MAP[event.code];
  if (dir) keys.delete(dir);
}

// 點自己的車就上車
function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect || driving.value) return;
  const x = (event.clientX - rect.left - view.ox) / view.scale / T;
  const y = (event.clientY - rect.top - view.oy) / view.scale / T;
  if (Math.hypot(x - car.x, y - car.y) < 1.5 && nearCar()) getIn();
}

function updateStick(event: PointerEvent): void {
  const rect = stickRef.value?.getBoundingClientRect();
  if (!rect) return;
  let x = event.clientX - (rect.left + rect.width / 2);
  let y = event.clientY - (rect.top + rect.height / 2);
  const len = Math.hypot(x, y);
  if (len > 30) {
    x = (x / len) * 30;
    y = (y / len) * 30;
  }
  knob.value = { x, y };
  stick.x = len > 6 ? x / 30 : 0;
  stick.y = len > 6 ? y / 30 : 0;
}

function stickDown(event: PointerEvent): void {
  stickPointer = event.pointerId;
  updateStick(event);
}

function stickMove(event: PointerEvent): void {
  if (event.pointerId === stickPointer) updateStick(event);
}

function stickUp(): void {
  stickPointer = null;
  stick.x = 0;
  stick.y = 0;
  knob.value = { x: 0, y: 0 };
}

function clearKeys(): void {
  keys.clear();
}

onMounted(() => {
  ctx = canvasRef.value?.getContext('2d') ?? null;
  isTouch.value = window.matchMedia('(pointer: coarse)').matches;
  ground = paintGround();
  // 一抵達就站在車站旁：先走開才會再跳出回程面板
  stationLock = true;
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', clearKeys);
  containerRef.value?.focus({ preventScroll: true });
  rafId = requestAnimationFrame(frame);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', clearKeys);
});
</script>
