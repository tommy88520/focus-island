<template>
  <!-- 台北／台中／高雄大獎賽（夜間街道賽）：從 F1 月台搭過來的獨立地圖，賽道、地標、看台都照 circuits.ts。
       開車、計圈、看台座位跟 F1 賽車場一樣；同房間的人也在這張地圖的話看得到彼此 -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#0d0f18] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <!-- 點別人：名牌小卡（看資料、送悄悄話） -->
      <ProfileCard v-if="profilePerson" :person="profilePerson" @close="profilePerson = null" @whisper="whisperTo" />

      <!-- 圈速＋小地圖（手機上放到按鈕列下面、不畫小地圖） -->
      <div class="pixel-panel absolute right-2 top-14 px-2 py-1 text-right sm:top-2 sm:px-3 sm:py-2">
        <p class="hide-below-sm !mb-0 text-[11px] font-black text-[color:var(--px-accent-dark)] dark:!text-amber-300">🏁 {{ circuit.title[locale] }}</p>
        <div class="hide-below-sm">
          <canvas ref="miniRef" class="ml-auto mt-1 block" width="128" height="80" style="width: 128px; height: 80px" />
        </div>
        <p class="!mb-0 font-pixel text-xs font-bold sm:mt-1 sm:text-sm">{{ t.f1.lap }} {{ formatLap(currentLap) }}</p>
        <p class="!mb-0 font-pixel text-[10px] text-[color:var(--px-muted)] sm:text-[11px]">{{ t.f1.last }} {{ formatLap(lastLap) }} · {{ t.f1.best }} {{ formatLap(bestLap) }}</p>
        <p v-if="driving && drsOn" class="!mb-0 mt-0.5 font-pixel text-[11px] font-bold text-[#3dff8a]">DRS OPEN</p>
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
    <SceneHint :text="isTouch ? t.f1Hub.gpHintTouch : t.f1Hub.gpHintDesktop" />

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
import { px, pillTextWidth, fillPillText, canvasDpr, drawLayer, layerCanvas } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';
import { drawF1Car } from 'src/pages/index/pixel/f1Car';
import { landmarkSky, standSeats, TRACK_HALF, type CircuitDef, type Rect } from 'src/pages/index/pixel/circuits';
import { buildTrack, miniTrackTransform, paintTrack } from 'src/pages/index/pixel/gpTrack';
import { buildCity, drawBuilding, drawLamp, drawScooter, drawTree, paintCityGround, paintLampGlow } from 'src/pages/index/pixel/gpCity';
import { drawDrsBoard, drawLandmark, drawPitGarages, drawStandBack, drawStandFront, drawStandSeat, drawStartGantry, drawStation } from 'src/pages/index/pixel/gpArt';

// 看台的座位跟圖書館的一樣是這個分區的座位（同步給所有人），只是畫在賽道旁
const props = defineProps<{
  circuit: CircuitDef;
  seats: Seat[];
  selectedSeatId: string | null;
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
  // 同房間的人（只畫也在這條賽道的）
  remotePlayers: Record<string, RemotePlayer>;
}>();
const emit = defineEmits<{ leave: []; select: [seatId: string]; 'end-focus': []; position: [position: MyPosition]; whisper: [to: string, phrase: WhisperId] }>();

const { t, locale } = useLocale();
const prefs = usePlayerPrefs();

// ── 場地（格，1 格 = 16px）：全部照賽道設定 ──
const T = 16;
const C = props.circuit;
const W = C.W;
const H = C.H;
const GEO = buildTrack(C.track);
const STATION = { ...C.station, trigger: { x: (C.station.x0 + C.station.x1) / 2, y: C.station.y1 + 1 } };
const CAR_HOME = C.carHome;
// 看台座位：前排 6、後排 6（順序 = 座位編號，不要調換）
const SEAT_SPOTS = standSeats(C.stand);
// 起終點線：第 0 段折線上 startAt 那一點，投影到圓弧化之後的賽道上
const START_DIST = (() => {
  const a = C.track[0] ?? [0, 0];
  const b = C.track[1] ?? [0, 0];
  return GEO.nearest(a[0] + (b[0] - a[0]) * C.startAt, a[1] + (b[1] - a[1]) * C.startAt).along;
})();
const START = GEO.pointAt(START_DIST);
const NPC_CARS = [
  { color: '#d72d2d', accent: '#f6c945', speed: 10.5, offset: 0.1 },
  { color: '#2fb3a6', accent: '#2b2d33', speed: 11.2, offset: 0.35 },
  { color: '#f2a541', accent: '#5b6ee1', speed: 9.8, offset: 0.6 },
  { color: '#3b4fbf', accent: '#e25a4a', speed: 10.8, offset: 0.85 },
];
const RIVAL_COLORS = ['#e86a8a', '#4fa35a', '#8b5cf6', '#f97316', '#0ea5e9', '#a3a3a3'];
// 看台焦點座位之間的一般觀眾（裝飾，點了沒反應）：灰色座椅、大約三分之二坐了人
const CROWD = (() => {
  const out: { x: number; y: number; colors: ReturnType<typeof lookColors> | null }[] = [];
  let seed = C.seed * 7 + 3;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  const rows = [...new Set(SEAT_SPOTS.map((s) => s.y))];
  for (const y of rows) {
    for (let x = C.stand.x0 + 0.55; x < C.stand.x1 - 0.4; x += 0.85) {
      if (SEAT_SPOTS.some((s) => s.y === y && Math.abs(s.x - x) < 0.75)) continue;
      out.push({ x, y, colors: rand() < 0.68 ? lookColors(Math.floor(rand() * 5), Math.floor(rand() * 4), { body: rand() < 0.5 ? 1 : 0 }) : null });
    }
  }
  return out;
})();

const distanceToTrack = (x: number, y: number) => GEO.nearest(x, y).dist;
const inside = (r: Rect, x: number, y: number, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && y > r.y0 - pad && y < r.y1 + pad;

// 看台後面坐滿觀眾的那幾階（往北長），走不進去
const STAND_BACK: Rect = { x0: C.stand.x0, y0: C.stand.y0 - 3, x1: C.stand.x1, y1: C.stand.y0 + 0.4 };
const CITY = buildCity(C, distanceToTrack, TRACK_HALF, [...C.landmarks, ...C.landmarks.map(landmarkSky), STAND_BACK, C.stand, C.station, C.pit, C.pitLane]);
const BUILDINGS = CITY.blocks.flatMap((b) => b.buildings);
const SOLID: Rect[] = [
  ...C.landmarks.filter((l) => l.kind !== 'cruise'),
  ...BUILDINGS.map((b) => ({ x0: b.x0, y0: b.y0, x1: b.x1, y1: b.y1 - 0.15 })),
  ...C.water,
  C.station,
  C.pit,
  STAND_BACK,
];

// DRS 牌：每段 DRS 直線開頭的賽道外側
const DRS_BOARDS = GEO.segs
  .map((s, i) => ({ s, prev: GEO.segs[(i - 1 + GEO.segs.length) % GEO.segs.length] }))
  .filter(({ s, prev }) => C.drs.includes(s.origin) && prev?.origin !== s.origin && s.length > 0)
  .map(({ s }) => {
    const ang = Math.atan2(s.to[1] - s.from[1], s.to[0] - s.from[0]);
    const nx = -Math.sin(ang);
    const ny = Math.cos(ang);
    const base = { x: s.from[0] + Math.cos(ang) * 2.5, y: s.from[1] + Math.sin(ang) * 2.5 };
    const sides = [1, -1].map((side) => ({ x: base.x + nx * side * (TRACK_HALF + 1.3), y: base.y + ny * side * (TRACK_HALF + 1.3) }));
    return sides.find((p) => !SOLID.some((r) => inside(r, p.x, p.y, 0.3))) ?? sides[0] ?? base;
  });

// 彎道編號牌：立在彎的外側（柱子＋圓牌），附近的行道樹讓開
const CORNER_SIGNS = GEO.corners
  .map((corner) => ({ n: corner.n, x: corner.mx + corner.ox * (TRACK_HALF + 1.7), y: corner.my + corner.oy * (TRACK_HALF + 1.7) }))
  .filter((p) => !SOLID.some((r) => inside(r, p.x, p.y, 0.2)));
const TREES = CITY.trees.filter((tr) => !CORNER_SIGNS.some((p) => Math.hypot(tr.x - p.x, tr.y - p.y) < 1.4));

const blocked = (x: number, y: number) =>
  SEAT_SPOTS.some((s) => Math.abs(x - s.x) < 0.45 && Math.abs(y - s.y) < 0.45) || x < 0.5 || y < 0.5 || x > W - 0.5 || y > H - 0.5 || SOLID.some((b) => inside(b, x, y));

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

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const miniRef = ref<HTMLCanvasElement | null>(null);
const stickRef = ref<HTMLDivElement | null>(null);
const isTouch = ref(false);
const stationOpen = ref(false);
const carPickerOpen = ref(false);
const driving = ref(false);
const drsOn = ref(false);
const currentLap = ref<number | null>(null);
const lastLap = ref<number | null>(null);
const bestLap = ref<number | null>(readBest());

// ── 自己 ──
const me = { x: STATION.trigger.x + 1.2, y: STATION.trigger.y + 0.3, facing: 'down' as 'up' | 'down' | 'left' | 'right', moving: false, walkClock: 0 };
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
  carPickerOpen.value = false;
  stationOpen.value = false;
  lapStart = null;
  lastAlong = null;
  currentLap.value = null;
}

// 一進來就站在自己的車旁邊（選車面板直接跳出來），不用從車站走一大段去找車
function standByCar(): void {
  const spot = [[0, 1.2], [0, -1.2], [-1.5, 0], [1.5, 0]].map(([dx = 0, dy = 0]) => ({ x: car.x + dx, y: car.y + dy })).find((p) => !blocked(p.x, p.y));
  if (!spot) return;
  me.x = spot.x;
  me.y = spot.y;
  me.facing = spot.y > car.y + 0.5 ? 'up' : spot.y < car.y - 0.5 ? 'down' : spot.x > car.x ? 'left' : 'right';
}

function getOut(): void {
  driving.value = false;
  car.speed = 0;
  me.x = car.x;
  me.y = car.y + 1.2;
  if (blocked(me.x, me.y)) me.y = car.y - 1.2;
  containerRef.value?.focus({ preventScroll: true });
}

// 開車：方向鍵（或搖桿）指哪個方向，車頭就轉過去並加速；在賽道外面會慢很多，DRS 直線比較快
function updateCar(dt: number, now: number): void {
  const near = GEO.nearest(car.x, car.y);
  const onTrack = near.dist <= TRACK_HALF + 0.3;
  drsOn.value = onTrack && car.speed > 0 && C.drs.includes(near.origin);
  const top = onTrack ? (drsOn.value ? 20 : 16) : 4;
  steerCar(car, dt, keys, stick, top);
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
  const rel = (((near.along - START_DIST) % GEO.length) + GEO.length) % GEO.length;
  const crossed = onTrack && lastAlong !== null && lastAlong > GEO.length - 8 && rel < 8;
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

// 看台的人面向賽道（朝畫面下方）坐
function sitAt(i: number): void {
  const seat = props.seats[i];
  const spot = SEAT_SPOTS[i];
  if (!seat || !spot) return;
  seatedIndex = i;
  walkTarget = null;
  carPickerOpen.value = false;
  me.x = spot.x;
  me.y = spot.y;
  me.facing = 'down';
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
  me.facing = 'down';
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
  // 點了座位：自己走過去（直線走，卡住就直接坐過去）
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
let miniBase: HTMLCanvasElement | null = null;
const view = { scale: 2, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };
const titleUpper = C.title['en-US'].toUpperCase();

function paintGround(): HTMLCanvasElement {
  const { canvas, c } = layerCanvas(W * T, H * T, groundRes);
  if (!c) return canvas;
  paintCityGround(c, C, CITY);
  paintLampGlow(c, CITY.lamps);
  // 維修道：藍色車道、白色分隔線、限速 80 的字
  const pl = C.pitLane;
  px(c, '#4b4f5e', pl.x0 * T - 2, pl.y0 * T - 2, (pl.x1 - pl.x0) * T + 4, (pl.y1 - pl.y0) * T + 4);
  px(c, '#2a3f73', pl.x0 * T, pl.y0 * T, (pl.x1 - pl.x0) * T, (pl.y1 - pl.y0) * T);
  px(c, '#e9e9ee', pl.x0 * T, pl.y0 * T, (pl.x1 - pl.x0) * T, 1);
  px(c, '#4f8fff', pl.x0 * T, pl.y1 * T - 2, (pl.x1 - pl.x0) * T, 2);
  for (let x = pl.x0 + 1; x < pl.x1 - 1; x += 2) px(c, 'rgba(255,255,255,0.35)', x * T, (pl.y0 + pl.y1) * 0.5 * T, 10, 1);
  c.fillStyle = 'rgba(255,255,255,0.55)';
  c.font = '700 7px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('PIT 80', (pl.x0 + 1.6) * T, (pl.y0 + pl.y1) * 0.5 * T);
  c.fillText('PIT 80', (pl.x1 - 1.6) * T, (pl.y0 + pl.y1) * 0.5 * T);
  paintTrack(c, GEO, { half: TRACK_HALF, neon: C.neon, drs: C.drs, startDist: START_DIST, seed: C.seed });
  return canvas;
}

// 小地圖的底圖：賽道外框＋起終點
function paintMiniBase(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 80;
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  const map = miniTrackTransform(GEO, 128, 80, 6);
  c.lineJoin = 'round';
  c.strokeStyle = 'rgba(255,255,255,0.15)';
  c.lineWidth = 6;
  c.beginPath();
  GEO.pts.forEach(([x, y], i) => {
    const [mx, my] = map(x, y);
    if (i === 0) c.moveTo(mx, my);
    else c.lineTo(mx, my);
  });
  c.closePath();
  c.stroke();
  c.strokeStyle = C.neon;
  c.lineWidth = 2;
  c.stroke();
  const [sx, sy] = map(START.x, START.y);
  c.fillStyle = '#ffffff';
  c.fillRect(sx - 1, sy - 4, 2, 8);
  return canvas;
}

function drawMini(seconds: number): void {
  const canvas = miniRef.value;
  const c = canvas?.getContext('2d');
  if (!canvas || !c || !miniBase) return;
  const map = miniTrackTransform(GEO, 128, 80, 6);
  c.clearRect(0, 0, 128, 80);
  c.drawImage(miniBase, 0, 0);
  for (const npc of NPC_CARS) {
    const p = GEO.pointAt(seconds * npc.speed + npc.offset * GEO.length);
    const [mx, my] = map(p.x, p.y);
    c.fillStyle = npc.color;
    c.fillRect(mx - 1.5, my - 1.5, 3, 3);
  }
  const at = driving.value ? car : me;
  const [mx, my] = map(at.x, at.y);
  c.fillStyle = '#fbbf24';
  c.beginPath();
  c.arc(mx, my, 3, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#15171f';
  c.lineWidth = 1;
  c.stroke();
}

// F1 賽車：共用的精緻版（pixel/f1Car.ts）；黃色車戴紅色安全帽
function drawF1(c: CanvasRenderingContext2D, x: number, y: number, angle: number, color: string, accent: string, seconds: number, helmet = color === '#f6c945' ? '#e25a4a' : '#f6c945', reversing = false): void {
  drawF1Car(c, x * T, y * T, angle, color, accent, seconds, helmet, reversing);
}

function drawSeatPerson(c: CanvasRenderingContext2D, i: number, seconds: number): void {
  const spot = SEAT_SPOTS[i];
  if (!spot) return;
  const state = seatState(i);
  drawStandSeat(c, spot.x, spot.y, state === 'me' && seatedIndex !== i, seconds);
  const occupied = state === 'mate' || state === 'taken' || (state === 'me' && seatedIndex === i);
  if (!occupied) return;
  const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
  const colors = state === 'me' ? lookColors(prefs.value.hair, prefs.value.shirt, prefs.value) : mate ? readerColors(mate) : { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };
  const sprite = getAvatarFrame(colors, 'down', 'idle');
  const x = Math.round(spot.x * T);
  const y = Math.round(spot.y * T);
  c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y + 1 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
}

function drawCornerSign(c: CanvasRenderingContext2D, sign: { n: number; x: number; y: number }): void {
  const x = Math.round(sign.x * T);
  const y = Math.round(sign.y * T);
  px(c, 'rgba(0,0,0,0.35)', x - 3, y, 7, 2);
  px(c, '#5a5f70', x - 1, y - 10, 2, 10);
  c.fillStyle = '#0f1118';
  c.beginPath();
  c.arc(x, y - 16, 7, 0, Math.PI * 2);
  c.fill();
  c.strokeStyle = '#ffffff';
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = '#ffffff';
  c.font = '700 8px system-ui, sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(String(sign.n), x, y - 15.5);
}

function drawFan(c: CanvasRenderingContext2D, fan: (typeof CROWD)[number], seconds: number): void {
  const x = Math.round(fan.x * T);
  const y = Math.round(fan.y * T);
  drawStandSeat(c, fan.x, fan.y, false, seconds, ['#2b2e3a', '#4a4f60', '#5f6578']);
  if (!fan.colors) return;
  // 偶爾跳起來一下
  const hop = Math.sin(seconds * 3 + fan.x * 2.1) > 0.93 ? 2 : 0;
  c.drawImage(getAvatarFrame(fan.colors, 'down', 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y + 1 - SEATED_ROWS - hop, AVATAR_SIZE.w, SEATED_ROWS);
}

function drawPerson(c: CanvasRenderingContext2D, x: number, y: number, colors: ReturnType<typeof lookColors>, facing: 'up' | 'down' | 'left' | 'right', moving: boolean, clock: number): void {
  const frame = moving ? (Math.floor(clock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  px(c, 'rgba(0,0,0,0.3)', Math.round(x * T - 5), Math.round(y * T + 3), 10, 2);
  c.drawImage(getAvatarFrame(colors, facing, frame), Math.round(x * T - AVATAR_SIZE.w / 2), Math.round(y * T + 5 - AVATAR_SIZE.h));
}

// 港口、池子的水面：一條條慢慢飄的反光
function drawWaterShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  for (const w of C.water) {
    const count = Math.round(((w.x1 - w.x0) * (w.y1 - w.y0)) / 5);
    for (let i = 0; i < count; i += 1) {
      const span = (w.x1 - w.x0) * T;
      const fx = (i * 97.3 + seconds * (6 + (i % 5))) % span;
      const fy = (i * 37.1) % ((w.y1 - w.y0) * T - 6);
      // 城市裡的橢圓池子：池子外面不畫
      const pond = w.x0 > 0.5 && w.y0 > 0.5 && w.x1 < C.W - 0.5 && w.y1 < C.H - 0.5;
      if (pond) {
        const nx = (fx / span) * 2 - 1;
        const ny = ((fy + 3) / ((w.y1 - w.y0) * T)) * 2 - 1;
        if (nx * nx + ny * ny > 0.7) continue;
      }
      const a = 0.12 + 0.12 * Math.sin(seconds * 1.5 + i);
      px(c, i % 3 === 0 ? `rgba(255, 190, 120, ${a})` : `rgba(140, 190, 255, ${a})`, Math.round(w.x0 * T + fx), Math.round(w.y0 * T + 3 + fy), 6 + (i % 4) * 2, 1);
    }
  }
}

function pill(c: CanvasRenderingContext2D, text: string, cx: number, bottom: number, color: string, small = false): void {
  c.font = small ? '700 10px system-ui, -apple-system, "PingFang TC", sans-serif' : '700 12px system-ui, -apple-system, "PingFang TC", sans-serif';
  const width = pillTextWidth(c, text) + (small ? 10 : 14);
  const height = small ? 16 : 20;
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
  // 走路時近一點看得到細節（跟其他地圖一樣 3 倍），開車拉遠到 2 倍看得到前面的彎
  const scale = !driving.value && cssW >= 900 ? 3 : 2;
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
  if ((cssW >= 900 ? 3 : 2) * dpr !== groundRes) {
    groundRes = (cssW >= 900 ? 3 : 2) * dpr;
    ground = paintGround();
  }
  if (ground) drawLayer(ctx, ground, 0, 0, W * T, H * T);
  const c = ctx;
  drawWaterShimmer(c, seconds);

  // 畫面裡看得到的才排進去（建築、樹、燈很多）
  const vx0 = -ox / scale / T - 2;
  const vx1 = (cssW - ox) / scale / T + 2;
  const vy0 = -oy / scale / T - 2;
  const vy1 = (cssH - oy) / scale / T + 16;
  const visible = (x0: number, x1: number, y: number) => x1 > vx0 && x0 < vx1 && y > vy0 && y < vy1;

  const items: { y: number; draw: () => void }[] = [];
  for (const b of BUILDINGS) if (visible(b.x0, b.x1, b.y1)) items.push({ y: b.y1, draw: () => drawBuilding(c, b) });
  for (const tr of TREES) if (visible(tr.x - 1, tr.x + 1, tr.y)) items.push({ y: tr.y, draw: () => drawTree(c, tr) });
  for (const sign of CORNER_SIGNS) if (visible(sign.x - 1, sign.x + 1, sign.y)) items.push({ y: sign.y, draw: () => drawCornerSign(c, sign) });
  for (const l of CITY.lamps) if (visible(l.x - 1, l.x + 1, l.y)) items.push({ y: l.y, draw: () => drawLamp(c, l) });
  for (const s of CITY.scooters) if (visible(s.x - 1, s.x + 1, s.y)) items.push({ y: s.y, draw: () => drawScooter(c, s) });
  for (const l of C.landmarks) if (visible(l.x0, l.x1, l.y1)) items.push({ y: l.y1, draw: () => drawLandmark(c, l, seconds) });
  items.push({ y: C.stand.y0, draw: () => drawStandBack(c, C.stand, C.neon, `${titleUpper}`, seconds) });
  items.push({ y: C.stand.y1 + 0.05, draw: () => drawStandFront(c, C.stand, C.neon, seconds) });
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y + 0.3, draw: () => drawSeatPerson(c, i, seconds) }));
  for (const fan of CROWD) items.push({ y: fan.y + 0.29, draw: () => drawFan(c, fan, seconds) });
  items.push({ y: C.pit.y1, draw: () => drawPitGarages(c, C.pit, seconds) });
  items.push({ y: C.station.y1, draw: () => drawStation(c, C.station, seconds) });
  for (const d of DRS_BOARDS) items.push({ y: d.y, draw: () => drawDrsBoard(c, d.x, d.y) });
  NPC_CARS.forEach((npc) => {
    const p = GEO.pointAt(seconds * npc.speed + npc.offset * GEO.length);
    items.push({ y: p.y, draw: () => drawF1(c, p.x, p.y, p.angle, npc.color, npc.accent, seconds) });
  });
  const mine = livery(prefs.value.carLivery);
  items.push({ y: car.y, draw: () => drawF1(c, car.x, car.y, car.angle, mine.body, mine.accent, seconds, mine.helmet, car.speed < -0.3) });
  if (!driving.value && seatedIndex === null) items.push({ y: me.y + 0.35, draw: () => drawPerson(c, me.x, me.y, lookColors(prefs.value.hair, prefs.value.shirt, prefs.value), me.facing, me.moving, me.walkClock) });
  for (const other of shownRemotes) {
    if (other.remote.car) {
      const color = RIVAL_COLORS[Math.abs([...other.remote.displayName].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7)) % RIVAL_COLORS.length] ?? '#e86a8a';
      const theirs = other.remote.livery === undefined ? null : livery(other.remote.livery);
      items.push({ y: other.y, draw: () => (theirs ? drawF1(c, other.x, other.y, other.angle, theirs.body, theirs.accent, seconds, theirs.helmet) : drawF1(c, other.x, other.y, other.angle, color, '#2b2d33', seconds)) });
    } else {
      items.push({ y: other.y + 0.35, draw: () => drawPerson(c, other.x, other.y, remoteColors(other.remote), other.remote.facing, other.remote.moving, seconds) });
    }
  }
  items.sort((a, b) => a.y - b.y).forEach((item) => item.draw());
  // 高空的東西最後畫：起跑燈門架、高樓頂上的紅色航空警示燈
  drawStartGantry(c, START.x, START.y, START.angle, TRACK_HALF, titleUpper, seconds);
  if (Math.sin(seconds * 2.4) > 0.2) {
    for (const b of BUILDINGS) if (b.beacon && visible(b.x0, b.x1, b.y1)) px(c, '#ff4040', Math.round(b.beacon.x * T) - 1, Math.round(b.beacon.y * T) - 1, 3, 2);
  }

  // 畫面四周暗一點（夜景的氣氛）
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const vignette = ctx.createRadialGradient(cssW / 2, cssH / 2, Math.min(cssW, cssH) * 0.35, cssW / 2, cssH / 2, Math.max(cssW, cssH) * 0.75);
  vignette.addColorStop(0, 'rgba(5, 6, 15, 0)');
  vignette.addColorStop(1, 'rgba(5, 6, 15, 0.45)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, cssW, cssH);

  // 名牌（螢幕座標）
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  const sp = screen((STATION.x0 + STATION.x1) / 2, STATION.y0 - 0.5);
  pill(ctx, `🚉 ${t.value.f1Hub.title}`, sp.x, sp.y, '#fbbf24');
  for (const l of C.landmarks) {
    const name = l.name[locale.value];
    if (!name || !visible(l.x0, l.x1, l.y1)) continue;
    const lp = screen((l.x0 + l.x1) / 2, l.y1 + 1.1);
    pill(ctx, name, lp.x, lp.y, '#94a3b8', true);
  }
  // 人站在車旁時，車的名牌往上疊在「我」上面，不要互相蓋住；觸控裝置寫「點車上車」
  const nearCarLabel = Math.hypot(me.x - car.x, me.y - car.y) < 1.6;
  const cp = screen(car.x, nearCarLabel ? Math.min(me.y - 1, car.y - 0.8) : car.y - 0.8);
  if (!driving.value) pill(ctx, isTouch.value ? t.value.f1.yourCarTouch : t.value.f1.yourCar, cp.x, cp.y - (nearCarLabel ? 24 : 0), '#fbbf24');
  const mp = driving.value ? screen(car.x, car.y - 0.8) : screen(me.x, me.y - 1);
  if (seatedIndex === null) pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
  for (const other of shownRemotes) {
    const op = screen(other.x, other.y - (other.remote.car ? 0.8 : 1));
    pill(ctx, remoteLabel(other), op.x, op.y, '#2dd4bf');
  }
  const vp = screen((C.stand.x0 + C.stand.x1) / 2, C.stand.y1 + 1.2);
  if (seatedIndex === null && !driving.value) pill(ctx, t.value.f1.vipSeats, vp.x, vp.y, '#2dd4bf', true);
  SEAT_SPOTS.forEach((spot, i) => {
    const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
    if (!mate) return;
    const p = screen(spot.x, spot.y - 1.1);
    pill(c, mate.displayName, p.x, p.y, '#2dd4bf');
  });
}

let rafId = 0;
let last = 0;
let frameCount = 0;
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
        ? { x: r2(car.x), y: r2(car.y), facing: me.facing, moving: Math.abs(car.speed) > 0.3, scene: C.id, vehicle: 'f1', angle: r2(car.angle), livery: prefs.value.carLivery }
        : { x: r2(me.x), y: r2(me.y), facing: me.facing, moving: me.moving, scene: C.id },
    seconds,
  );
  render(seconds);
  frameCount += 1;
  if (frameCount % 3 === 0) drawMini(seconds);
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
  // 點過場景外的按鈕、分頁、音量滑桿後焦點會留在那裡：空白鍵和移動鍵還給賽道，Enter 照樣按那個按鈕
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

// 點自己的車就上車；點看台座位走過去坐
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
  miniBase = paintMiniBase();
  // 找不到車旁的空位時人還站在車站旁：先走開才會再跳出回程面板
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
  else standByCar();
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
