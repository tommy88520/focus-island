<template>
  <!-- 台北／台中／高雄大獎賽（夜間街道賽）：從 F1 月台搭過來的獨立地圖，賽道、地標、看台都照 circuits.ts。
       開車、計圈、看台座位跟 F1 賽車場一樣；同房間的人也在這張地圖的話看得到彼此 -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#141726] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
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
        <p class="hide-below-sm !mb-0 text-[11px] font-black text-[color:var(--px-accent-dark)] dark:!text-amber-300">🏁 {{ circuit.title[locale] }}</p>
        <p class="!mb-0 font-pixel text-xs font-bold sm:mt-1 sm:text-sm">{{ t.f1.lap }} {{ formatLap(currentLap) }}</p>
        <p class="!mb-0 font-pixel text-[10px] text-[color:var(--px-muted)] sm:text-[11px]">{{ t.f1.last }} {{ formatLap(lastLap) }} · {{ t.f1.best }} {{ formatLap(bestLap) }}</p>
        <p v-if="driving && drsOn" class="!mb-0 mt-0.5 font-pixel text-[11px] font-bold text-[#3dff8a]">DRS OPEN</p>
      </div>

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
    <SceneHint :text="isTouch ? t.f1Hub.gpHintTouch : t.f1Hub.gpHintDesktop" />

    <LeaveFocusDialog v-model="leaveConfirmOpen" @confirm="confirmLeave" @hide="afterFocusEnds = null" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { MyPosition, Reader, RemotePlayer, ProfilePerson, WhisperId } from 'src/pages/index/composables/useLibrarySocket';
import { createPositionSync, createRemoteView, remoteColors, remoteLabel, type ShownRemote } from 'src/pages/index/sceneRemotes';
import type { Seat } from 'src/pages/index/components/SeatGrid.vue';
import { useLocale } from 'src/composables/useLocale';
import { localPoint } from 'src/pages/index/composables/sceneFullscreen';
import SceneHint from 'src/pages/index/components/SceneHint.vue';
import LeaveFocusDialog from 'src/pages/index/components/LeaveFocusDialog.vue';
import ProfileCard from 'src/pages/index/components/ProfileCard.vue';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { AVATAR_SIZE, getAvatarFrame, lookColors, readerColors, SEATED_ROWS } from 'src/pages/index/pixel/pixelArt';
import { px, seeded, pillTextWidth, fillPillText } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';
import { cornerPoints, standSeats, TRACK_HALF, type CircuitDef, type Rect } from 'src/pages/index/pixel/circuits';
import { drawCityBlock, drawLandmark } from 'src/pages/index/pixel/gpArt';

// 看台的座位跟圖書館的一樣是這個分區的座位（同步給所有人），只是畫在賽車場裡
const props = defineProps<{
  circuit: CircuitDef;
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
const { t, locale } = useLocale();
const prefs = usePlayerPrefs();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stickRef = ref<HTMLDivElement | null>(null);
const isTouch = ref(false);
const stationOpen = ref(false);
const driving = ref(false);
const drsOn = ref(false);
const currentLap = ref<number | null>(null);
const lastLap = ref<number | null>(null);
const bestLap = ref<number | null>(readBest());

// ── 場地（格，1 格 = 16px）：全部照賽道設定 ──
const T = 16;
const C = props.circuit;
const W = C.W;
const H = C.H;
const TRACK = C.track;
const STATION = { ...C.station, trigger: { x: (C.station.x0 + C.station.x1) / 2, y: C.station.y1 + 1 } };
const CAR_HOME = C.carHome;
// 看台座位：前排 6、後排 6（順序 = 座位編號，不要調換）
const SEAT_SPOTS = standSeats(C.stand);
const CORNERS = cornerPoints(TRACK);
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
// 起終點線：第 0 段上的 startAt 那一點（離起點跑了多遠）
const START_DIST = (segments[0]?.length ?? 0) * C.startAt;
const startPoint = pointOnTrack(START_DIST);

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

// 離賽道中心線多遠、最近的是第幾段、從起點算跑了多遠（計圈、DRS 用）
function nearestOnTrack(x: number, y: number): { dist: number; segment: number; along: number } {
  let best = { dist: Infinity, segment: 0, along: 0 };
  let before = 0;
  segments.forEach((s, i) => {
    const dx = s.to[0] - s.from[0];
    const dy = s.to[1] - s.from[1];
    const k = Math.max(0, Math.min(1, ((x - s.from[0]) * dx + (y - s.from[1]) * dy) / (dx * dx + dy * dy)));
    const dist = Math.hypot(x - (s.from[0] + dx * k), y - (s.from[1] + dy * k));
    if (dist < best.dist) best = { dist, segment: i, along: before + k * s.length };
    before += s.length;
  });
  return best;
}

function distanceToTrack(x: number, y: number): number {
  return nearestOnTrack(x, y).dist;
}

const inside = (r: Rect, x: number, y: number, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && y > r.y0 - pad && y < r.y1 + pad;

// 城市街廓：照格子切，碰到賽道、地標、看台、車站、維修道、水、公園的格子就不蓋
const CITY_BLOCKS: Rect[] = (() => {
  const out: Rect[] = [];
  for (let gy = 1; gy < H - 4; gy += 6) {
    for (let gx = 1; gx < W - 5; gx += 7) {
      const r = { x0: gx + 0.8, y0: gy + 0.8, x1: gx + 6, y1: gy + 5 };
      const corners = [[r.x0, r.y0], [r.x1, r.y0], [r.x0, r.y1], [r.x1, r.y1], [(r.x0 + r.x1) / 2, (r.y0 + r.y1) / 2], [(r.x0 + r.x1) / 2, r.y0], [(r.x0 + r.x1) / 2, r.y1], [r.x0, (r.y0 + r.y1) / 2], [r.x1, (r.y0 + r.y1) / 2]];
      if (corners.some(([x = 0, y = 0]) => distanceToTrack(x, y) < TRACK_HALF + 1.8)) continue;
      const overlaps = (o: Rect, pad: number) => r.x0 < o.x1 + pad && o.x0 - pad < r.x1 && r.y0 < o.y1 + pad && o.y0 - pad < r.y1;
      if ([...C.landmarks, C.stand, C.station, C.pitLane].some((o) => overlaps(o, 1)) || [...C.water, ...C.parks].some((o) => overlaps(o, 0))) continue;
      out.push(r);
    }
  }
  return out;
})();
const SOLID: Rect[] = [...C.landmarks.filter((l) => l.kind !== 'cruise'), ...CITY_BLOCKS, ...C.water, { ...C.station }];

const blocked = (x: number, y: number) =>
  SEAT_SPOTS.some((s) => Math.abs(x - s.x) < 0.45 && Math.abs(y - s.y) < 0.45) ||
  x < 0.5 || y < 0.5 || x > W - 0.5 || y > H - 0.5 || SOLID.some((b) => inside(b, x, y));

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
// 上一格車子在賽道上的位置（從起終點線算跑了多遠）；跨過起終點線往前就算一圈
let lastAlong: number | null = null;

const keys = new Set<string>();
const stick = { x: 0, y: 0 };
const knob = ref({ x: 0, y: 0 });
let stickPointer: number | null = null;

function readBest(): number | null {
  try {
    const v = Number(localStorage.getItem(`focus_island_gp_best_${props.circuit.id}`));
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
  const near = nearestOnTrack(car.x, car.y);
  const onTrack = near.dist <= TRACK_HALF + 0.3;
  // DRS 區的直線極速比較高
  drsOn.value = onTrack && C.drs.includes(near.segment);
  const top = onTrack ? (drsOn.value ? 20 : 16) : 4;
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
    car.x = nx;
    car.y = ny;
  }
  // 照賽道方向往前越過起終點線（在賽道上）就算一圈：從線前一小段跑到線後一小段
  const rel = (((near.along - START_DIST) % trackLength) + trackLength) % trackLength;
  const crossed = onTrack && lastAlong !== null && lastAlong > trackLength - 8 && rel < 8;
  lastAlong = onTrack ? rel : null;
  if (crossed) {
    if (lapStart !== null) {
      const lap = now - lapStart;
      lastLap.value = lap;
      if (bestLap.value === null || lap < bestLap.value) {
        bestLap.value = lap;
        try {
          localStorage.setItem(`focus_island_gp_best_${props.circuit.id}`, String(lap));
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
}

// ── 畫 ──
let ctx: CanvasRenderingContext2D | null = null;
let ground: HTMLCanvasElement | null = null;
const view = { scale: 2, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };

function trackPath(c: CanvasRenderingContext2D, points: [number, number][] = TRACK, closed = true): void {
  c.beginPath();
  points.forEach(([x, y], i) => (i === 0 ? c.moveTo(x * T, y * T) : c.lineTo(x * T, y * T)));
  if (closed) c.closePath();
}

function paintGround(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W * T;
  canvas.height = H * T;
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  const rand = seeded(C.seed);
  // 夜裡的城市：深色柏油路面、淡淡的車道線
  px(c, '#1b1e2b', 0, 0, W * T, H * T);
  for (let i = 0; i < 1800; i += 1) px(c, rand() < 0.5 ? '#202436' : '#181a26', Math.floor(rand() * W * T), Math.floor(rand() * H * T), 2, 1);
  for (let gy = 1; gy < H; gy += 6) px(c, 'rgba(255, 214, 120, 0.08)', 0, gy * T - 6, W * T, 1);
  for (let gx = 1; gx < W; gx += 7) px(c, 'rgba(255, 214, 120, 0.08)', gx * T - 6, 0, 1, H * T);
  // 水（港口、秋紅谷）：深藍、有一點點城市燈的倒影
  for (const w of C.water) {
    px(c, '#0d2440', w.x0 * T, w.y0 * T, (w.x1 - w.x0) * T, (w.y1 - w.y0) * T);
    for (let i = 0; i < ((w.x1 - w.x0) * (w.y1 - w.y0)) / 2; i += 1) {
      px(c, rand() < 0.5 ? 'rgba(120, 180, 255, 0.18)' : 'rgba(255, 180, 120, 0.14)', w.x0 * T + Math.floor(rand() * (w.x1 - w.x0) * T), w.y0 * T + Math.floor(rand() * (w.y1 - w.y0) * T), 4 + Math.floor(rand() * 6), 1);
    }
    px(c, '#5d6578', w.x0 * T, w.y1 * T - 2, (w.x1 - w.x0) * T, 2);
  }
  // 公園：深綠草地＋一叢叢樹
  for (const p of C.parks) {
    px(c, '#1f3b2a', p.x0 * T, p.y0 * T, (p.x1 - p.x0) * T, (p.y1 - p.y0) * T);
    for (let i = 0; i < ((p.x1 - p.x0) * (p.y1 - p.y0)) / 6; i += 1) {
      const tx = p.x0 * T + 6 + Math.floor(rand() * ((p.x1 - p.x0) * T - 12));
      const ty = p.y0 * T + 6 + Math.floor(rand() * ((p.y1 - p.y0) * T - 12));
      if (distanceToTrack(tx / T, ty / T) < TRACK_HALF + 1 || C.water.some((w) => inside(w, tx / T, ty / T, 0.5)) || C.landmarks.some((l) => inside(l, tx / T, ty / T, 0.5))) continue;
      px(c, '#173022', tx - 5, ty - 4, 11, 9);
      px(c, '#2d5a3c', tx - 4, ty - 5, 9, 7);
      px(c, '#3f7a52', tx - 2, ty - 5, 4, 3);
    }
  }
  CITY_BLOCKS.forEach((b, i) => drawCityBlock(c, b.x0 * T, b.y0 * T, (b.x1 - b.x0) * T, (b.y1 - b.y0) * T, C.seed * 31 + i));
  // 賽道：外面一圈霓虹光暈 → 護欄（白底紅條，DRS 段是綠色）→ 柏油 → 白邊線
  const stroke = (width: number, color: string, points?: [number, number][], closed = true) => {
    c.strokeStyle = color;
    c.lineWidth = width;
    c.lineJoin = 'round';
    c.lineCap = 'round';
    trackPath(c, points, closed);
    c.stroke();
  };
  c.save();
  c.shadowColor = C.neon;
  c.shadowBlur = 10;
  stroke((TRACK_HALF * 2 + 0.9) * T, C.neon);
  c.restore();
  stroke((TRACK_HALF * 2 + 0.8) * T, '#e8e8ee');
  c.setLineDash([6, 6]);
  stroke((TRACK_HALF * 2 + 0.8) * T, C.neon);
  c.setLineDash([]);
  for (const i of C.drs) {
    const a = TRACK[i];
    const b = TRACK[(i + 1) % TRACK.length];
    if (!a || !b) continue;
    c.save();
    c.shadowColor = '#3dff8a';
    c.shadowBlur = 8;
    stroke((TRACK_HALF * 2 + 0.8) * T, '#3dff8a', [a, b], false);
    c.restore();
  }
  stroke(TRACK_HALF * 2 * T, '#f2f2f2');
  stroke((TRACK_HALF * 2 - 0.3) * T, '#353844');
  // 起終點：垂直賽道的黑白格子
  c.save();
  c.translate(startPoint.x * T, startPoint.y * T);
  c.rotate(startPoint.angle);
  const cell = (TRACK_HALF * 2 * T) / 8;
  for (let row = 0; row < 8; row += 1) for (let col = 0; col < 2; col += 1) px(c, (row + col) % 2 === 0 ? '#ffffff' : '#15171f', col * 4 - 4, -TRACK_HALF * T + row * cell, 4, cell);
  // 起跑格（線後面兩排白色括號）
  for (let k = 1; k <= 6; k += 1) {
    const gx = -k * 22;
    const gy = k % 2 === 0 ? -TRACK_HALF * T * 0.5 : TRACK_HALF * T * 0.5;
    px(c, '#f2f2f2', gx, gy - 6, 2, 12);
    px(c, '#f2f2f2', gx, gy - 6, 8, 2);
    px(c, '#f2f2f2', gx, gy + 4, 8, 2);
  }
  c.restore();
  // 維修道：藍色車道＋白線
  const pl = C.pitLane;
  px(c, '#1d4f9e', pl.x0 * T, pl.y0 * T, (pl.x1 - pl.x0) * T, (pl.y1 - pl.y0) * T);
  px(c, '#4f8fff', pl.x0 * T, pl.y0 * T, (pl.x1 - pl.x0) * T, 2);
  px(c, '#4f8fff', pl.x0 * T, pl.y1 * T - 2, (pl.x1 - pl.x0) * T, 2);
  for (let x = pl.x0 + 1; x < pl.x1 - 1; x += 2) px(c, 'rgba(255,255,255,0.5)', x * T, (pl.y0 + pl.y1) * 0.5 * T, 10, 1);
  // 看台的底座（兩層階梯）
  const st = C.stand;
  px(c, 'rgba(0,0,0,0.35)', st.x0 * T + 4, st.y1 * T, (st.x1 - st.x0) * T, 5);
  px(c, '#3b3f52', st.x0 * T, st.y0 * T, (st.x1 - st.x0) * T, (st.y1 - st.y0) * T);
  px(c, '#4a4f66', st.x0 * T, st.y0 * T + ((st.y1 - st.y0) * T) / 2, (st.x1 - st.x0) * T, 3);
  px(c, '#c9ccd6', st.x0 * T, st.y1 * T - 2, (st.x1 - st.x0) * T, 2);
  // 彎道編號牌：放在彎的外側
  for (const corner of CORNERS) {
    const i = TRACK.findIndex(([x, y]) => x === corner.x && y === corner.y);
    const prev = TRACK[(i - 1 + TRACK.length) % TRACK.length];
    const next = TRACK[(i + 1) % TRACK.length];
    if (!prev || !next) continue;
    const ilen = Math.hypot(corner.x - prev[0], corner.y - prev[1]) || 1;
    const olen = Math.hypot(next[0] - corner.x, next[1] - corner.y) || 1;
    let ox = -((next[0] - corner.x) / olen - (corner.x - prev[0]) / ilen);
    let oy = -((next[1] - corner.y) / olen - (corner.y - prev[1]) / ilen);
    const ol = Math.hypot(ox, oy) || 1;
    ox /= ol;
    oy /= ol;
    const sx = (corner.x + ox * (TRACK_HALF + 1.5)) * T;
    const sy = (corner.y + oy * (TRACK_HALF + 1.5)) * T;
    c.fillStyle = '#15171f';
    c.beginPath();
    c.arc(sx, sy, 8, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = '#ffffff';
    c.lineWidth = 1.5;
    c.stroke();
    c.fillStyle = '#ffffff';
    c.font = '700 9px system-ui, sans-serif';
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.fillText(String(corner.n), sx, sy + 0.5);
  }
  // 路燈：沿著賽道兩側，每隔幾格一盞
  for (const seg of segments) {
    const nx = -(seg.to[1] - seg.from[1]) / seg.length;
    const ny = (seg.to[0] - seg.from[0]) / seg.length;
    for (let d = 2; d < seg.length - 1; d += 4) {
      for (const side of [-1, 1]) {
        const lx = seg.from[0] + ((seg.to[0] - seg.from[0]) * d) / seg.length + nx * side * (TRACK_HALF + 0.9);
        const ly = seg.from[1] + ((seg.to[1] - seg.from[1]) * d) / seg.length + ny * side * (TRACK_HALF + 0.9);
        if (distanceToTrack(lx, ly) < TRACK_HALF + 0.6 || SOLID.some((b) => inside(b, lx, ly)) || inside(C.pitLane, lx, ly, 0.3) || inside(C.stand, lx, ly, 0.3)) continue;
        c.fillStyle = 'rgba(255, 220, 140, 0.16)';
        c.beginPath();
        c.arc(lx * T, ly * T, 9, 0, Math.PI * 2);
        c.fill();
        px(c, '#ffe7a8', Math.round(lx * T) - 1, Math.round(ly * T) - 1, 3, 3);
      }
    }
  }
  return canvas;
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
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  // 街道賽地圖大、開車要看得遠：一律 2 倍（超大螢幕才 3 倍）
  const scale = cssW >= 2000 ? 3 : 2;
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
  if (ground) ctx.drawImage(ground, 0, 0);

  // 依 y 排前後
  const items: { y: number; draw: () => void }[] = [];
  const c = ctx;
  C.landmarks.forEach((l) => items.push({ y: l.y1, draw: () => drawLandmark(c, l, seconds) }));
  items.push({ y: STATION.y1, draw: () => drawStation(c) });
  NPC_CARS.forEach((npc) => {
    const p = pointOnTrack(seconds * npc.speed + npc.offset * trackLength);
    items.push({ y: p.y, draw: () => drawF1(c, p.x, p.y, p.angle, npc.color, npc.accent) });
  });
  items.push({ y: car.y, draw: () => drawF1(c, car.x, car.y, car.angle, '#f6c945', '#2b2d33') });
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y + 0.4, draw: () => drawSeat(c, i, seconds) }));
  if (!driving.value && seatedIndex === null) items.push({ y: me.y + 0.35, draw: () => drawMe(c) });
  for (const other of shownRemotes) {
    if (other.remote.car) {
      const color = RIVAL_COLORS[Math.abs([...other.remote.displayName].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7)) % RIVAL_COLORS.length] ?? '#e86a8a';
      items.push({ y: other.y, draw: () => drawF1(c, other.x, other.y, other.angle, color, '#2b2d33') });
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
  // 地標的名字（放在建築下緣）
  for (const l of C.landmarks) {
    const name = l.name[locale.value];
    if (!name) continue;
    const lp = screen((l.x0 + l.x1) / 2, l.y1 + 1.3);
    pill(ctx, name, lp.x, lp.y, '#94a3b8');
  }
  // DRS 區的牌子
  for (const i of C.drs) {
    const a = TRACK[i];
    const b = TRACK[(i + 1) % TRACK.length];
    if (!a || !b) continue;
    const dp = screen((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 0.4);
    pill(ctx, 'DRS', dp.x, dp.y, '#3dff8a');
  }
  const pp = screen((C.pitLane.x0 + C.pitLane.x1) / 2, C.pitLane.y1 + 0.2);
  pill(ctx, 'PIT LANE', pp.x, pp.y, '#4f8fff');
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
  const vp = screen((C.stand.x0 + C.stand.x1) / 2, C.stand.y0 - 0.2);
  pill(ctx, t.value.f1.vipSeats, vp.x, vp.y, '#2dd4bf');
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
  shownRemotes = viewRemotes(props.remotePlayers, C.id, dt);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  rememberScene(C.id, positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: C.id }
      : driving.value
        ? { x: r2(car.x), y: r2(car.y), facing: me.facing, moving: Math.abs(car.speed) > 0.3, scene: C.id, vehicle: 'f1', angle: r2(car.angle) }
        : { x: r2(me.x), y: r2(me.y), facing: me.facing, moving: me.moving, scene: C.id },
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
  const arrival = takeArrival(C.id);
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
