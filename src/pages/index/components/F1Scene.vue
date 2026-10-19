<template>
  <!-- F1 賽車場：從 F1 月台搭過來的獨立地圖（主地圖 101 旁的 F1 站 → 月台 → 這裡），回程的車站回月台 -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#3f7a3a] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <!-- 點別人：名牌小卡（看資料、送悄悄話） -->
      <ProfileCard v-if="profilePerson" :person="profilePerson" @close="profilePerson = null" @whisper="whisperTo" />

      <!-- 圈速 -->
      <!-- 手機上縮小：不要標題、字小一點，少擋地圖 -->
      <!-- 手機上放到按鈕列下面（不然會蓋到左上角的「好友」） -->
      <div class="pixel-panel absolute right-2 top-14 px-2 py-1 text-right sm:top-2 sm:px-3 sm:py-2">
        <p class="hide-below-sm !mb-0 font-pixel text-[10px] uppercase text-[color:var(--px-accent-dark)] dark:!text-amber-300">🏁 {{ t.f1.title }}</p>
        <p class="!mb-0 font-pixel text-xs font-bold sm:mt-1 sm:text-sm">{{ t.f1.lap }} {{ formatLap(currentLap) }}</p>
        <p class="!mb-0 font-pixel text-[10px] text-[color:var(--px-muted)] sm:text-[11px]">{{ t.f1.last }} {{ formatLap(lastLap) }} · {{ t.f1.best }} {{ formatLap(bestLap) }}</p>
      </div>

      <!-- 選賽車：站在自己的車旁邊才出現 -->
      <CarPicker v-if="carPickerOpen" v-model="prefs.carLivery" @drive="getIn" />

      <!-- 回程的車站 -->
      <div v-if="stationOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center">
        <p class="!mb-2 !text-[11px] font-black">🚉 {{ t.f1Hub.backPrompt }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="emit('leave')">{{ t.f1Hub.backGo }}</button>
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
        class="pixel-panel absolute bottom-8 left-8 h-24 w-24 !rounded-full opacity-80"
        style="touch-action: none"
        @touchstart.prevent
        @touchmove.prevent
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
    <SceneHint :text="isTouch ? t.f1.hintTouch : t.f1.hintDesktop" />

    <LeaveFocusDialog v-model="leaveConfirmOpen" @confirm="confirmLeave" @hide="afterFocusEnds = null" />
  </div>
</template>

<script setup lang="ts">
import { steerCar } from 'src/pages/index/pixel/carControl';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { MyPosition, Reader, RemotePlayer, ProfilePerson, WhisperId } from 'src/pages/index/composables/useLibrarySocket';
import { createPositionSync, createRemoteView, remoteColors, remoteLabel, type ShownRemote } from 'src/pages/index/sceneRemotes';
import type { Seat } from 'src/pages/index/components/SeatGrid.vue';
import { useLocale } from 'src/composables/useLocale';
import { localPoint } from 'src/pages/index/composables/sceneFullscreen';
import SceneHint from 'src/pages/index/components/SceneHint.vue';
import LeaveFocusDialog from 'src/pages/index/components/LeaveFocusDialog.vue';
import ProfileCard from 'src/pages/index/components/ProfileCard.vue';
import CarPicker from 'src/pages/index/components/CarPicker.vue';
import { livery } from 'src/pages/index/pixel/f1Car';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { AVATAR_SIZE, getAvatarFrame, lookColors, readerColors, SEATED_ROWS } from 'src/pages/index/pixel/pixelArt';
import { px, seeded, pillTextWidth, fillPillText, canvasDpr, drawLayer, layerCanvas } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';
import { drawF1Car } from 'src/pages/index/pixel/f1Car';

// 看台的座位跟圖書館的一樣是這個分區的座位（同步給所有人），只是畫在賽車場裡
const props = defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
  // 同房間的人（只畫也在賽車場的）
  remotePlayers: Record<string, RemotePlayer>;
}>();
const emit = defineEmits<{ leave: []; select: [seatId: string]; 'end-focus': []; position: [position: MyPosition]; whisper: [to: string, phrase: WhisperId] }>();

// ── 點別人的名牌：站著的人看頭到腳那一塊，坐著的人用座位 ──
const profilePerson = ref<ProfilePerson | null>(null);
function pickPerson(x: number, y: number): boolean {
  const remote = shownRemotes.find((o) => Math.abs(x - o.x) < 0.6 && y > o.y - 1.4 && y < o.y + 0.4);
  if (remote) {
    profilePerson.value = { ...remote.remote };
    return true;
  }
  for (let i = 0; i < SEAT_SPOTS.length; i += 1) {
    const spot = SEAT_SPOTS[i];
    const seat = props.seats[i];
    const mate = seat ? props.getMateAtSeat(seat.id) : null;
    if (spot && mate && Math.abs(x - spot.x) < 0.6 && y > spot.y - 1.4 && y < spot.y + 0.6) {
      profilePerson.value = { ...mate };
      return true;
    }
  }
  return false;
}
function whisperTo(to: string, phrase: WhisperId): void {
  if (to) emit('whisper', to, phrase);
  profilePerson.value = null;
}
// 自己的位置（開車時是車子的位置和方向）送給同房間的人；別人的位置平滑地畫出來
const syncPosition = createPositionSync((pos) => emit('position', pos));
const viewRemotes = createRemoteView();
let shownRemotes: ShownRemote[] = [];
// 別人的車用不同顏色（照名字固定一種）
const RIVAL_COLORS = ['#e86a8a', '#4fa35a', '#8b5cf6', '#f97316', '#0ea5e9', '#a3a3a3'];
const { t } = useLocale();
const prefs = usePlayerPrefs();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stickRef = ref<HTMLDivElement | null>(null);
const isTouch = ref(false);
const stationOpen = ref(false);
const carPickerOpen = ref(false);
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
// 看台座位：最前面一排 6 個 VIP，後面再兩排各 8 個（順序 = 座位編號，不要調換）
const SEAT_SPOTS = [
  ...Array.from({ length: 6 }, (_, i) => ({ x: 20.5 + i * 2.2, y: 17.4 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: 19.6 + i * 1.8, y: 19.1 })),
  ...Array.from({ length: 8 }, (_, i) => ({ x: 19.6 + i * 1.8, y: 20.8 })),
];
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
  SEAT_SPOTS.some((s) => Math.abs(x - s.x) < 0.45 && Math.abs(y - s.y) < 0.45) ||
  x < 0.5 || y < 0.5 || x > W - 0.5 || y > H - 0.5 || BLOCKS.some((b) => x > b.x0 && x < b.x1 && y > b.y0 && y < b.y1) || (x > STATION.x0 && x < STATION.x1 && y > STATION.y0 && y < STATION.y1);

// ── 自己 ──
const me = { x: STATION.trigger.x + 1.5, y: STATION.trigger.y + 0.5, facing: 'down' as 'up' | 'down' | 'left' | 'right', moving: false, walkClock: 0 };
const car = { x: CAR_HOME.x, y: CAR_HOME.y, angle: CAR_HOME.angle, speed: 0 };
let stationLock = false;
// 坐在第幾個看台座位上（null = 站著）；走過去要坐的那個
let seatedIndex: number | null = null;
let walkTarget: number | null = null;
// 走向座位時卡住多久了（被看台擋住就直接坐過去）
let stuckFor = 0;
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
  carPickerOpen.value = false;
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
  const onTrack = distanceToTrack(car.x, car.y) <= TRACK_HALF + 0.3;
  const top = onTrack ? 16 : 4;
  steerCar(car, dt, keys, stick, top);
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

function seatState(i: number): 'empty' | 'me' | 'mate' | 'taken' {
  const seat = props.seats[i];
  if (!seat) return 'taken';
  if (props.selectedSeatId === seat.id) return 'me';
  if (props.getMateAtSeat(seat.id)) return 'mate';
  return seat.available ? 'empty' : 'taken';
}

function sitAt(i: number): void {
  const seat = props.seats[i];
  const spot = SEAT_SPOTS[i];
  if (!seat || !spot) return;
  seatedIndex = i;
  walkTarget = null;
  carPickerOpen.value = false;
  me.x = spot.x;
  me.y = spot.y;
  me.facing = 'up';
  if (props.selectedSeatId !== seat.id) emit('select', seat.id);
}

// 按下專注前父層來問：坐著、正走向、或就站在旁邊的看台座位 → 在那個座位專注
function seatForFocus(): string | null {
  if (driving.value) return null;
  const i = seatedIndex ?? walkTarget ?? nearestSeat();
  const seat = i === null ? undefined : props.seats[i];
  const spot = i === null ? undefined : SEAT_SPOTS[i];
  if (i === null || !seat || !spot || (seatState(i) !== 'empty' && seatState(i) !== 'me')) return null;
  seatedIndex = i;
  walkTarget = null;
  me.x = spot.x;
  me.y = spot.y;
  me.facing = 'up';
  return seat.id;
}

// 分享位置用：開車時是車子的位置
function positionForShare(): { x: number; y: number } {
  const at = driving.value ? car : me;
  return { x: at.x, y: at.y };
}

defineExpose({ seatForFocus, positionForShare });

function standUp(): void {
  const spot = seatedIndex === null ? null : SEAT_SPOTS[seatedIndex];
  seatedIndex = null;
  if (spot) {
    me.x = spot.x;
    me.y = spot.y + 1;
  }
}

function nearestSeat(): number | null {
  let best: number | null = null;
  let bestDist = 2;
  SEAT_SPOTS.forEach((spot, i) => {
    const d = Math.hypot(me.x - spot.x, me.y - (spot.y + 1));
    if (d < bestDist && seatState(i) === 'empty') {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

function updateWalk(dt: number): void {
  // 開始專注時人還沒坐好：直接坐回自己的看台座位
  if (props.disabled && seatedIndex === null) {
    const mine = props.seats.findIndex((s) => s.id === props.selectedSeatId);
    if (mine >= 0) sitAt(mine);
  }
  let { x, y } = input();
  if (seatedIndex !== null) {
    if ((x === 0 && y === 0) || props.disabled) return;
    standUp();
  }
  // 點了座位：自己走過去（場地空曠，直線走）
  if (x === 0 && y === 0 && walkTarget !== null) {
    const spot = SEAT_SPOTS[walkTarget];
    if (spot) {
      x = spot.x - me.x;
      y = spot.y + 1 - me.y;
      if (Math.hypot(x, y) < 0.2 || stuckFor > 0.5) {
        const target = walkTarget;
        walkTarget = null;
        stuckFor = 0;
        if (seatState(target) === 'empty') sitAt(target);
        return;
      }
    }
  } else if (x !== 0 || y !== 0) {
    walkTarget = null;
  }
  me.moving = x !== 0 || y !== 0;
  if (me.moving) {
    const length = Math.hypot(x, y);
    const nx = me.x + (x / length) * 4.2 * dt;
    const ny = me.y + (y / length) * 4.2 * dt;
    const beforeX = me.x;
    const beforeY = me.y;
    if (!blocked(nx, me.y)) me.x = nx;
    if (!blocked(me.x, ny)) me.y = ny;
    stuckFor = walkTarget !== null && Math.hypot(me.x - beforeX, me.y - beforeY) < 0.01 ? stuckFor + dt : 0;
    me.facing = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : y > 0 ? 'down' : 'up';
    me.walkClock += dt;
  }
  const atStation = Math.hypot(me.x - STATION.trigger.x, me.y - STATION.trigger.y) < 1.1;
  if (!atStation) stationLock = false;
  stationOpen.value = atStation && !stationLock;
  carPickerOpen.value = !props.disabled && seatedIndex === null && nearCar() && !stationOpen.value;
}

// ── 畫 ──
let ctx: CanvasRenderingContext2D | null = null;
let ground: HTMLCanvasElement | null = null;
// 底圖用幾倍畫：畫面放大倍數 × 螢幕像素（變了就重畫），招牌的字和線條才清楚
let groundRes = 1;
const view = { scale: 2, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };

function paintGround(): HTMLCanvasElement {
  const { canvas, c } = layerCanvas(W * T, H * T, groundRes);
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

// F1 賽車：共用的精緻版（pixel/f1Car.ts）；黃色車戴紅色安全帽
function drawF1(c: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, accent: string, helmet = color === '#f6c945' ? '#e25a4a' : '#f6c945', reversing = false): void {
  drawF1Car(c, x * T, y * T, angle, color, accent, performance.now() / 1000, helmet, reversing);
}

// VIP 看台座位：紅色桶型座椅；有人坐著就畫出上半身
function drawSeat(c: CanvasRenderingContext2D, i: number, seconds: number): void {
  const spot = SEAT_SPOTS[i];
  if (!spot) return;
  const x = Math.round(spot.x * T);
  const y = Math.round(spot.y * T);
  const state = seatState(i);
  const occupied = state === 'mate' || state === 'taken' || (state === 'me' && seatedIndex === i);
  px(c, 'rgba(0,0,0,0.2)', x - 7, y + 6, 14, 3);
  px(c, '#3a3d45', x - 1, y + 3, 2, 5);
  px(c, '#d72d2d', x - 6, y - 4, 12, 8);
  px(c, '#f06a5a', x - 5, y - 4, 10, 2);
  if (state === 'me' && seatedIndex !== i) {
    // 自己的位子但人不在：底下閃黃光
    c.fillStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(seconds * 3) * 0.15})`;
    c.fillRect(x - 7, y + 6, 14, 2);
  }
  if (!occupied) return;
  const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
  const colors = state === 'me' ? lookColors(prefs.value.hair, prefs.value.shirt, prefs.value) : mate ? readerColors(mate) : { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };
  const sprite = getAvatarFrame(colors, 'up', 'idle');
  c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y + 2 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
  px(c, '#d72d2d', x - 6, y - 1, 12, 5);
}

function drawMe(c: CanvasRenderingContext2D): void {
  const colors = lookColors(prefs.value.hair, prefs.value.shirt, prefs.value);
  const frame = me.moving ? (Math.floor(me.walkClock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  const sprite = getAvatarFrame(colors, me.facing, frame);
  px(c, 'rgba(0,0,0,0.18)', Math.round(me.x * T - 5), Math.round(me.y * T + 3), 10, 2);
  c.drawImage(sprite, Math.round(me.x * T - AVATAR_SIZE.w / 2), Math.round(me.y * T + 5 - AVATAR_SIZE.h));
}

function drawRemote(c: CanvasRenderingContext2D, other: ShownRemote, seconds: number): void {
  const frame = other.remote.moving ? (Math.floor(seconds / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  const sprite = getAvatarFrame(remoteColors(other.remote), other.remote.facing, frame);
  px(c, 'rgba(0,0,0,0.18)', Math.round(other.x * T - 5), Math.round(other.y * T + 3), 10, 2);
  c.drawImage(sprite, Math.round(other.x * T - AVATAR_SIZE.w / 2), Math.round(other.y * T + 5 - AVATAR_SIZE.h));
}

function pill(c: CanvasRenderingContext2D, text: string, cx: number, bottom: number, color: string): void {
  c.font = '700 12px system-ui, -apple-system, "PingFang TC", sans-serif';
  const width = pillTextWidth(c, text) + 14;
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
  fillPillText(c, text, cx, bottom - height / 2 + 0.5);
}

function render(seconds: number): void {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!ctx || !canvas || !container) return;
  const cssW = container.clientWidth;
  const cssH = container.clientHeight;
  const dpr = canvasDpr();
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const scale = cssW >= 900 ? 3 : 2;
  const focus = driving.value ? car : me;
  const follow = (size: number, world: number, at: number) => (world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - at)));
  const ox = Math.round(follow(cssW, W * T * scale, focus.x * T * scale) * dpr) / dpr;
  // 左上角有一排按鈕（全螢幕、我的家、好友）：地圖最上緣可以再往下捲一點，車站、車門才不會被蓋住
  const TOP_PAD = 52;
  const followY = (size: number, world: number, at: number) => (world <= size - TOP_PAD ? (size - world + TOP_PAD) / 2 : Math.min(TOP_PAD, Math.max(size - world, size / 2 - at)));
  const oy = Math.round(followY(cssH, H * T * scale, focus.y * T * scale) * dpr) / dpr;
  Object.assign(view, { scale, ox, oy, dpr, w: cssW, h: cssH });

  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  if (scale * dpr !== groundRes) {
    groundRes = scale * dpr;
    ground = paintGround();
  }
  if (ground) drawLayer(ctx, ground, 0, 0, W * T, H * T);

  // 依 y 排前後
  const items: { y: number; draw: () => void }[] = [];
  const c = ctx;
  BLOCKS.forEach((b, i) => items.push({ y: b.y1, draw: () => drawBuilding(c, b, i === 0 ? 'pit' : 'stand', seconds) }));
  items.push({ y: STATION.y1, draw: () => drawStation(c) });
  NPC_CARS.forEach((npc) => {
    const p = pointOnTrack(seconds * npc.speed + npc.offset * trackLength);
    items.push({ y: p.y, draw: () => drawF1(c, p.x, p.y, p.angle, npc.color, npc.accent) });
  });
  const mine = livery(prefs.value.carLivery);
  items.push({ y: car.y, draw: () => drawF1(c, car.x, car.y, car.angle, mine.body, mine.accent, mine.helmet, car.speed < -0.3) });
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y + 0.4, draw: () => drawSeat(c, i, seconds) }));
  if (!driving.value && seatedIndex === null) items.push({ y: me.y + 0.35, draw: () => drawMe(c) });
  for (const other of shownRemotes) {
    if (other.remote.car) {
      const color = RIVAL_COLORS[Math.abs([...other.remote.displayName].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7)) % RIVAL_COLORS.length] ?? '#e86a8a';
      const theirs = other.remote.livery === undefined ? null : livery(other.remote.livery);
      items.push({ y: other.y, draw: () => (theirs ? drawF1(c, other.x, other.y, other.angle, theirs.body, theirs.accent, theirs.helmet) : drawF1(c, other.x, other.y, other.angle, color, '#2b2d33')) });
    } else {
      items.push({ y: other.y + 0.35, draw: () => drawRemote(c, other, seconds) });
    }
  }
  items.sort((a, b) => a.y - b.y).forEach((item) => item.draw());

  // 名牌（螢幕座標）
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  const sp = screen((STATION.x0 + STATION.x1) / 2, STATION.y0 - 0.8);
  pill(ctx, `🚉 ${t.value.f1Hub.title}`, sp.x, sp.y, '#fbbf24');
  // 人站在車旁時，車的名牌往上疊在「我」上面，不要互相蓋住；觸控裝置寫「點車上車」
  const nearCarLabel = Math.hypot(me.x - car.x, me.y - car.y) < 1.6;
  const cp = screen(car.x, (nearCarLabel ? Math.min(me.y - 1, car.y - 0.8) : car.y - 0.8));
  if (!driving.value) pill(ctx, isTouch.value ? t.value.f1.yourCarTouch : t.value.f1.yourCar, cp.x, cp.y - (nearCarLabel ? 24 : 0), '#fbbf24');
  const mp = driving.value ? screen(car.x, car.y - 0.8) : screen(me.x, me.y - 1);
  pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
  for (const other of shownRemotes) {
    const op = screen(other.x, other.y - (other.remote.car ? 0.8 : 1));
    pill(ctx, remoteLabel(other), op.x, op.y, '#2dd4bf');
  }
  const vp = screen(26, 22.4);
  pill(ctx, t.value.f1.vipSeats, vp.x, vp.y + 22, '#2dd4bf');
  SEAT_SPOTS.forEach((spot, i) => {
    const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
    if (!mate) return;
    const p = screen(spot.x, spot.y - 1.1);
    pill(c, mate.displayName, p.x, p.y, '#2dd4bf');
  });
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
  shownRemotes = viewRemotes(props.remotePlayers, 'f1', dt);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  rememberScene('f1', positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: 'f1' }
      : driving.value
        ? { x: r2(car.x), y: r2(car.y), facing: me.facing, moving: Math.abs(car.speed) > 0.3, scene: 'f1', vehicle: 'f1', angle: r2(car.angle), livery: prefs.value.carLivery }
        : { x: r2(me.x), y: r2(me.y), facing: me.facing, moving: me.moving, scene: 'f1' },
    seconds,
  );
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
  if (!target || target === containerRef.value) return false;
  if (target.closest('textarea, select, [contenteditable="true"], [role="dialog"]')) return true;
  if (target instanceof HTMLInputElement && target.type !== 'range' && target.type !== 'checkbox') return true;
  // 點過場景外的按鈕、分頁、音量滑桿後焦點會留在那裡：空白鍵和移動鍵還給賽車場，Enter 照樣按那個按鈕
  if (!containerRef.value?.contains(target)) {
    if (event.code !== 'Space' && !KEY_MAP[event.code]) return event.code === 'Enter';
    target.blur();
    containerRef.value?.focus({ preventScroll: true });
    return false;
  }
  return target.closest('button, a') !== null && ['Space', 'Enter'].includes(event.code);
}

// ── 專注中想走動：先問要不要結束專注，確定的話專注結束後把剛剛的動作做完 ──
const leaveConfirmOpen = ref(false);
let afterFocusEnds: (() => void) | null = null;
let leaveAction: (() => void) | null = null;

function askToLeave(action: (() => void) | null): boolean {
  if (!props.disabled) return false;
  if (!leaveConfirmOpen.value) {
    afterFocusEnds = action;
    leaveConfirmOpen.value = true;
  }
  keys.clear();
  return true;
}

function confirmLeave(): void {
  leaveAction = afterFocusEnds;
  afterFocusEnds = null;
  leaveConfirmOpen.value = false;
  emit('end-focus');
}

watch(
  () => props.disabled,
  (disabled) => {
    if (disabled) return;
    leaveConfirmOpen.value = false;
    const action = leaveAction;
    leaveAction = null;
    afterFocusEnds = null;
    containerRef.value?.focus({ preventScroll: true });
    action?.();
  },
);

function onKeyDown(event: KeyboardEvent): void {
  if (ignoreKey(event) || event.metaKey || event.ctrlKey || event.altKey) return;
  if (props.disabled && (KEY_MAP[event.code] || ['KeyE', 'Space'].includes(event.code))) {
    event.preventDefault();
    if (!event.repeat) askToLeave(null);
    return;
  }
  const dir = KEY_MAP[event.code];
  if (dir) {
    event.preventDefault();
    keys.add(dir);
    return;
  }
  if (event.code === 'KeyE' || event.code === 'Space') {
    event.preventDefault();
    if (driving.value) getOut();
    else if (seatedIndex !== null) standUp();
    else if (nearCar()) getIn();
    else {
      const seat = nearestSeat();
      if (seat !== null) sitAt(seat);
    }
  }
}

function onKeyUp(event: KeyboardEvent): void {
  const dir = KEY_MAP[event.code];
  if (dir) keys.delete(dir);
}

// 點自己的車就上車
function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  const at = canvasRef.value ? localPoint(canvasRef.value, event.clientX, event.clientY) : null;
  if (!at || driving.value) return;
  const x = (at.x - view.ox) / view.scale / T;
  const y = (at.y - view.oy) / view.scale / T;
  if (pickPerson(x, y)) return;
  if (props.disabled) {
    // 點自己的座位不算要離開
    const clicked = pickSeatSpot(SEAT_SPOTS, x, y, (i) => seatState(i) === 'empty');
    if (clicked < 0 || clicked !== seatedIndex) askToLeave(() => handleClick(event));
    return;
  }
  if (Math.hypot(x - car.x, y - car.y) < 1.5 && nearCar()) {
    getIn();
    return;
  }
  // 點看台座位：走過去坐
  const seat = pickSeatSpot(SEAT_SPOTS, x, y, (i) => seatState(i) === 'empty');
  if (seat >= 0 && seatState(seat) === 'empty' && !props.disabled) {
    if (seatedIndex !== null) standUp();
    walkTarget = seat;
  }
}

function updateStick(event: PointerEvent): void {
  if (!stickRef.value) return;
  const at = localPoint(stickRef.value, event.clientX, event.clientY);
  let x = at.x - at.width / 2;
  let y = at.y - at.height / 2;
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
  if (askToLeave(null)) return;
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
  // 朋友分享的位置：站到他旁邊；不然上次就坐在看台上的話直接坐回去
  const arrival = takeArrival('f1');
  const mine = props.seats.findIndex((s) => s.id === props.selectedSeatId);
  if (arrival) {
    const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].map(([dx = 0, dy = 0]) => ({ x: arrival.x + dx, y: arrival.y + dy })).find((p) => !blocked(p.x, p.y));
    if (spot) {
      me.x = spot.x;
      me.y = spot.y;
      stationLock = false;
    }
  } else if (mine >= 0) sitAt(mine);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', clearKeys);
  containerRef.value?.focus({ preventScroll: true });
  rafId = requestAnimationFrame(frame);
});

// 座位被釋放（例如換房間）時，人還坐著就站起來
watch(
  () => props.selectedSeatId,
  (id) => {
    if (seatedIndex !== null && props.seats[seatedIndex]?.id !== id) standUp();
  },
);

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', clearKeys);
});
</script>
