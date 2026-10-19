<template>
  <!-- 臺北市立動物園（獨立地圖，從主地圖的動物園站搭文湖線過來）：逛各個場館看動物、入口租腳踏車騎，
       長椅坐下專注（座位 25–30）。同房間也在這裡的人看得到彼此（騎車也看得到） -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#16161d] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <ProfileCard v-if="profilePerson" :person="profilePerson" @close="profilePerson = null" @whisper="whisperTo" />

      <!-- 腳踏車出租 -->
      <div v-if="bikeOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center" @click.stop>
        <p class="!mb-2 !text-[11px] font-black">🚲 {{ t.zoo.bikePrompt }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="mountBike">{{ t.zoo.bikeRent }}</button>
      </div>

      <!-- 回程的動物園站 -->
      <div v-else-if="stationOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center">
        <p class="!mb-2 !text-[11px] font-black">🚇 {{ t.f1.stationPrompt }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="emit('leave')">{{ t.f1.goBack }}</button>
      </div>

      <!-- 騎車中：下車（車子自動還回去） -->
      <button v-if="riding" type="button" class="pixel-btn absolute bottom-3 right-3 z-10 h-10 px-3 text-xs" @click.stop="dismount">🚲 {{ t.zoo.bikeOff }}</button>

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
    <SceneHint :text="isTouch ? t.zoo.hintTouch : t.zoo.hintDesktop" />

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
import { AVATAR_SIZE, getAvatarFrame, lookColors, paintVehicle, readerColors, SEATED_ROWS, type AvatarColors } from 'src/pages/index/pixel/pixelArt';
import { canvasDpr, drawLayer, fillPillText, layerCanvas, pillTextWidth, px, seeded } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';
import { SHOP_ITEM_EMOJI } from 'src/pages/index/pixel/pixelWorld';
import { ANIMALS, BENCHES, EXHIBIT_NAMES, ZOO, ZOO_SEATS, type Animal, type ExhibitId } from 'src/pages/index/pixel/zoo';
import {
  drawAcacia,
  drawAnimal,
  drawBamboo,
  drawBench,
  drawBikeStand,
  drawEucalyptus,
  drawExhibitHouse,
  drawFence,
  drawGate,
  drawJungleTree,
  drawLamp,
  drawOrangutanTower,
  drawPandaFrame,
  drawPlazaTree,
  drawTaiwanTree,
  drawZooStation,
  paintExhibitHedges,
  paintZooGround,
} from 'src/pages/index/pixel/zooArt';

const props = defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
  remotePlayers: Record<string, RemotePlayer>;
}>();
const emit = defineEmits<{ leave: []; select: [seatId: string]; 'end-focus': []; position: [position: MyPosition]; whisper: [to: string, phrase: WhisperId] }>();

const { t, locale } = useLocale();
const prefs = usePlayerPrefs();

// ── 場地（格，1 格 = 16px）──
const T = 16;
const W = ZOO.W;
const H = ZOO.H;
const SEAT_SPOTS = ZOO_SEATS;
const STATION_TRIGGER = { x: (ZOO.station.x0 + ZOO.station.x1) / 2, y: ZOO.station.y1 + 0.8 };
const BIKE_TRIGGER = { x: (ZOO.bikeStand.x0 + ZOO.bikeStand.x1) / 2, y: ZOO.bikeStand.y1 + 0.9 };
const EXHIBITS = Object.entries(ZOO.exhibits) as [ExhibitId, (typeof ZOO.exhibits)[ExhibitId]][];
const PLAZA_TREES = [
  { x: 8, y: 36.4 },
  { x: 53, y: 36.4 },
  { x: 33, y: 45 },
  { x: 57, y: 44 },
];
const LAMPS = [
  { x: 14, y: 35.2 },
  { x: 41, y: 35.2 },
  { x: 22, y: 44.6 },
];
const FLOWER_BEDS = [
  { x: 19, y: 36.2 },
  { x: 37, y: 36.2 },
  { x: 27, y: 41.4 },
];
const BAMBOO = [
  { x: 17.4, y: 5 },
  { x: 30.2, y: 9 },
  { x: 16.9, y: 9.4 },
];
const JUNGLE_TREES = [
  { x: 22, y: 19 },
  { x: 28, y: 18.8 },
];
const TAIWAN_TREES = [
  { x: 9.4, y: 18.9 },
  { x: 2.8, y: 26 },
];
// 坐下前站的位置：長椅前面
const approach = (i: number) => {
  const s = SEAT_SPOTS[i];
  return s ? { x: s.x, y: s.y + 0.9 } : { x: 0, y: 0 };
};

const inRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) => x > x0 && x < x1 && y > y0 && y < y1;
const blocked = (x: number, y: number) =>
  x < 0.5 || x > W - 0.5 || y < 0.5 || y > H - 0.5 ||
  EXHIBITS.some(([, r]) => inRect(x, y, r.x0 - 0.3, r.y0 - 0.3, r.x1 + 0.3, r.y1 + 0.15)) ||
  BENCHES.some((b) => inRect(x, y, b.x - 1.25, b.y - 0.4, b.x + 1.25, b.y + 0.25)) ||
  [ZOO.gate.x0 + 0.3, ZOO.gate.x1 - 0.3].some((gx) => Math.abs(x - gx) < 0.4 && Math.abs(y - ZOO.gate.y) < 0.3) ||
  inRect(x, y, ZOO.station.x0, ZOO.station.y0 - 0.5, ZOO.station.x1, ZOO.station.y1) ||
  inRect(x, y, ZOO.bikeStand.x0, ZOO.bikeStand.y0 - 0.6, ZOO.bikeStand.x1, ZOO.bikeStand.y1) ||
  FLOWER_BEDS.some((f) => ((x - f.x) / 2.2) ** 2 + ((y - f.y) / 0.95) ** 2 < 1) ||
  PLAZA_TREES.some((tr) => Math.abs(x - tr.x) < 0.35 && Math.abs(y - tr.y) < 0.3) ||
  LAMPS.some((l) => Math.abs(x - l.x) < 0.25 && Math.abs(y - l.y) < 0.25);

// ── 點別人的名牌 ──
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
const syncPosition = createPositionSync((pos) => emit('position', pos));
const viewRemotes = createRemoteView();
let shownRemotes: ShownRemote[] = [];

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stickRef = ref<HTMLDivElement | null>(null);
const isTouch = ref(false);

const stationOpen = ref(false);
const bikeOpen = ref(false);
// 騎腳踏車：比走路快；下車就自動還車
const riding = ref(false);
const WALK_SPEED = 4.2;
const BIKE_SPEED = 7;
const RIDE_LIFT = 7;

// ── 自己 ──
const me = { x: STATION_TRIGGER.x + 1.6, y: STATION_TRIGGER.y, facing: 'up' as 'up' | 'down' | 'left' | 'right', moving: false, walkClock: 0 };
let stationLock = true;
let bikeLock = false;
let seatedIndex: number | null = null;
let walkTarget: number | null = null;
let stuckFor = 0;
const keys = new Set<string>();
const stick = { x: 0, y: 0 };
const knob = ref({ x: 0, y: 0 });
let stickPointer: number | null = null;

function mountBike(): void {
  if (props.disabled) return;
  riding.value = true;
  bikeOpen.value = false;
  bikeLock = true;
  containerRef.value?.focus({ preventScroll: true });
}
function dismount(): void {
  riding.value = false;
  bikeLock = true;
  containerRef.value?.focus({ preventScroll: true });
}

function input(): { x: number; y: number } {
  const x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0) || stick.x;
  const y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0) || stick.y;
  return { x, y };
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
  riding.value = false;
  seatedIndex = i;
  walkTarget = null;
  me.x = spot.x;
  me.y = spot.y;
  me.facing = spot.facing;
  if (props.selectedSeatId !== seat.id) emit('select', seat.id);
}

function seatForFocus(): string | null {
  const i = seatedIndex ?? walkTarget ?? nearestSeat();
  const seat = i === null ? undefined : props.seats[i];
  const spot = i === null ? undefined : SEAT_SPOTS[i];
  if (i === null || !seat || !spot || (seatState(i) !== 'empty' && seatState(i) !== 'me')) return null;
  riding.value = false;
  seatedIndex = i;
  walkTarget = null;
  me.x = spot.x;
  me.y = spot.y;
  me.facing = spot.facing;
  return seat.id;
}

function positionForShare(): { x: number; y: number } {
  return { x: me.x, y: me.y };
}

defineExpose({ seatForFocus, positionForShare });

function standUp(): void {
  const i = seatedIndex;
  seatedIndex = null;
  if (i !== null) {
    const a = approach(i);
    me.x = a.x;
    me.y = a.y;
  }
}

function nearestSeat(): number | null {
  let best: number | null = null;
  let bestDist = 1.6;
  SEAT_SPOTS.forEach((_, i) => {
    const a = approach(i);
    const d = Math.hypot(me.x - a.x, me.y - a.y);
    if (d < bestDist && seatState(i) === 'empty') {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

function updateWalk(dt: number): void {
  if (props.disabled && seatedIndex === null) {
    const mine = props.seats.findIndex((s) => s.id === props.selectedSeatId);
    if (mine >= 0) sitAt(mine);
  }
  let { x, y } = input();
  if (seatedIndex !== null) {
    if ((x === 0 && y === 0) || props.disabled) return;
    standUp();
  }
  if (x === 0 && y === 0 && walkTarget !== null) {
    const a = approach(walkTarget);
    x = a.x - me.x;
    y = a.y - me.y;
    if (Math.hypot(x, y) < 0.2 || stuckFor > 0.5) {
      const target = walkTarget;
      walkTarget = null;
      stuckFor = 0;
      if (seatState(target) === 'empty') sitAt(target);
      return;
    }
  } else if (x !== 0 || y !== 0) {
    walkTarget = null;
  }
  me.moving = x !== 0 || y !== 0;
  if (me.moving) {
    const length = Math.hypot(x, y);
    const speed = riding.value ? BIKE_SPEED : WALK_SPEED;
    const nx = me.x + (x / length) * speed * dt;
    const ny = me.y + (y / length) * speed * dt;
    const bx = me.x;
    const by = me.y;
    if (!blocked(nx, me.y)) me.x = nx;
    if (!blocked(me.x, ny)) me.y = ny;
    stuckFor = walkTarget !== null && Math.hypot(me.x - bx, me.y - by) < 0.01 ? stuckFor + dt : 0;
    me.facing = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : y > 0 ? 'down' : 'up';
    me.walkClock += dt;
  }
  const atStation = Math.hypot(me.x - STATION_TRIGGER.x, me.y - STATION_TRIGGER.y) < 1.3;
  if (!atStation) stationLock = false;
  stationOpen.value = atStation && !stationLock;
  const atBike = !riding.value && Math.abs(me.x - BIKE_TRIGGER.x) < (ZOO.bikeStand.x1 - ZOO.bikeStand.x0) / 2 && Math.abs(me.y - BIKE_TRIGGER.y) < 0.9;
  if (!atBike) bikeLock = false;
  bikeOpen.value = atBike && !bikeLock && !stationOpen.value && !props.disabled;
}

// ── 遊客（用時間算的裝飾）：沿著步道、在入口廣場來回逛 ──
const WALKERS = Array.from({ length: 16 }, (_, i) => {
  const r = seeded(i * 23 + 7);
  const lane = i % 6;
  const ys = [15, 16.4, 31, 32.4, 36.6, 38];
  return {
    y: (ys[lane] ?? 15) + r() * 0.3,
    x0: 0.8 + r() * 6,
    x1: lane >= 4 ? 40 + r() * 6 : 50 + r() * 8,
    speed: 0.4 + r() * 0.5,
    phase: r(),
    colors: lookColors(Math.floor(r() * 5), Math.floor(r() * 7), { body: r() < 0.5 ? 1 : 0 }),
  };
});
function walkerPos(w: { x0: number; x1: number; speed: number; phase: number }, seconds: number): { x: number; dir: 1 | -1 } {
  const span = w.x1 - w.x0;
  if (span <= 0) return { x: w.x0, dir: 1 };
  const tt = ((seconds * w.speed) / span + w.phase) % 2;
  return tt < 1 ? { x: w.x0 + tt * span, dir: 1 } : { x: w.x1 - (tt - 1) * span, dir: -1 };
}
// 站著不動的動物偶爾轉個方向
function animalPose(an: Animal, seconds: number): { x: number; dir: 1 | -1; moving: boolean } {
  if (an.x1 <= an.x0 || an.speed <= 0) return { x: an.x0, dir: Math.floor(seconds / 7 + an.phase * 3) % 2 === 0 ? 1 : -1, moving: false };
  // 走一段、停一下
  const span = an.x1 - an.x0;
  const cycle = (span / an.speed) * 2 + 6;
  const tt = (seconds + an.phase * cycle) % cycle;
  const walk = span / an.speed;
  if (tt < walk) return { x: an.x0 + (tt / walk) * span, dir: 1, moving: true };
  if (tt < walk + 3) return { x: an.x1, dir: 1, moving: false };
  if (tt < walk * 2 + 3) return { x: an.x1 - ((tt - walk - 3) / walk) * span, dir: -1, moving: true };
  return { x: an.x0, dir: -1, moving: false };
}

// ── 畫 ──
let ctx: CanvasRenderingContext2D | null = null;
let ground: HTMLCanvasElement | null = null;
// 底圖用幾倍畫：畫面放大倍數 × 螢幕像素（變了就重畫），招牌的字和線條才清楚
let groundRes = 1;
const view = { scale: 2, ox: 0, oy: 0 };

function paintGround(): HTMLCanvasElement {
  const { canvas, c } = layerCanvas(W * T, H * T, groundRes);
  if (c) {
    paintZooGround(c);
    paintExhibitHedges(c);
  }
  return canvas;
}

function drawSeated(c: CanvasRenderingContext2D, i: number, seconds: number): void {
  const spot = SEAT_SPOTS[i];
  if (!spot) return;
  const x = Math.round(spot.x * T);
  const y = Math.round(spot.y * T);
  const state = seatState(i);
  if (state === 'me' && seatedIndex !== i) {
    c.fillStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(seconds * 3) * 0.15})`;
    c.fillRect(x - 7, y + 3, 14, 2);
  }
  const occupied = state === 'mate' || state === 'taken' || (state === 'me' && seatedIndex === i);
  if (!occupied) return;
  const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
  const colors = state === 'me' ? lookColors(prefs.value.hair, prefs.value.shirt, prefs.value) : mate ? readerColors(mate) : { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };
  const sprite = getAvatarFrame(colors, spot.facing, 'idle');
  c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y - 2 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
}

function drawPerson(c: CanvasRenderingContext2D, x: number, y: number, colors: AvatarColors, facing: 'up' | 'down' | 'left' | 'right', moving: boolean, clock: number): void {
  const frame = moving ? (Math.floor(clock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  px(c, 'rgba(0,0,0,0.25)', Math.round(x * T - 5), Math.round(y * T + 3), 10, 2);
  c.drawImage(getAvatarFrame(colors, facing, frame), Math.round(x * T - AVATAR_SIZE.w / 2), Math.round(y * T + 5 - AVATAR_SIZE.h));
}

// 騎腳踏車的人：車子後半 → 人（坐著的上半身）→ 車子前半
function drawRider(c: CanvasRenderingContext2D, x: number, y: number, colors: AvatarColors, facing: 'up' | 'down' | 'left' | 'right', moving: boolean, seconds: number): void {
  const footX = x * T;
  const footY = y * T + 5;
  paintVehicle(c, 'bike', facing, footX, footY, 'back', seconds, moving);
  const bob = moving && Math.floor(seconds * 8) % 2 === 0 ? 1 : 0;
  c.drawImage(getAvatarFrame(colors, facing, 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - RIDE_LIFT - SEATED_ROWS + bob), AVATAR_SIZE.w, SEATED_ROWS);
  paintVehicle(c, 'bike', facing, footX, footY, 'front', seconds, moving);
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

// 有些動物要畫在牠的道具上面（木架上的熊貓、高台上的猩猩、樹上的無尾熊）
function animalSortY(an: Animal): number {
  if (an.kind === 'pandaSleep') return ZOO.pandaFrame.y1 + 0.01;
  if (an.kind === 'orangutan' || an.kind === 'koala') return an.y + 0.01;
  return an.y;
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
  const follow = (size: number, world: number, at: number) => (world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - at)));
  const ox = Math.round(follow(cssW, W * T * scale, me.x * T * scale) * dpr) / dpr;
  // 左上角有一排按鈕：地圖最上緣可以再往下捲一點
  const TOP_PAD = 52;
  const followY = (size: number, world: number, at: number) => (world <= size - TOP_PAD ? (size - world + TOP_PAD) / 2 : Math.min(TOP_PAD, Math.max(size - world, size / 2 - at)));
  const oy = Math.round(followY(cssH, H * T * scale, (me.y - 1.5) * T * scale) * dpr) / dpr;
  Object.assign(view, { scale, ox, oy });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  if (scale * dpr !== groundRes) {
    groundRes = scale * dpr;
    ground = paintGround();
  }
  if (ground) drawLayer(ctx, ground, 0, 0, W * T, H * T);
  const c = ctx;

  const items: { y: number; draw: () => void }[] = [];
  items.push({ y: 5, draw: () => drawExhibitHouse(c, 'penguin') });
  for (const id of ['panda', 'koala', 'flamingo'] as const) items.push({ y: 4.9, draw: () => drawExhibitHouse(c, id) });
  for (const b of BAMBOO) items.push({ y: b.y, draw: () => drawBamboo(c, b.x, b.y, seconds) });
  items.push({ y: ZOO.pandaFrame.y1, draw: () => drawPandaFrame(c) });
  for (const x of ZOO.koalaTrees) items.push({ y: 9, draw: () => drawEucalyptus(c, x, 9) });
  for (const tr of JUNGLE_TREES) items.push({ y: tr.y, draw: () => drawJungleTree(c, tr.x, tr.y) });
  for (const tr of TAIWAN_TREES) items.push({ y: tr.y, draw: () => drawTaiwanTree(c, tr.x, tr.y) });
  items.push({ y: ZOO.acacia.y, draw: () => drawAcacia(c, ZOO.acacia.x, ZOO.acacia.y) });
  items.push({ y: ZOO.orangutanTower.y, draw: () => drawOrangutanTower(c, seconds) });
  for (const [, r] of EXHIBITS) items.push({ y: r.y1, draw: () => drawFence(c, r) });
  for (const an of ANIMALS) {
    const pose = animalPose(an, seconds);
    items.push({ y: animalSortY(an), draw: () => drawAnimal(c, an, pose.x, an.y, pose.dir, pose.moving, seconds) });
  }
  for (const b of BENCHES) items.push({ y: b.y, draw: () => drawBench(c, b.x, b.y) });
  items.push({ y: ZOO.gate.y, draw: () => drawGate(c, seconds) });
  items.push({ y: ZOO.station.y1, draw: () => drawZooStation(c, seconds) });
  items.push({ y: ZOO.bikeStand.y1, draw: () => drawBikeStand(c) });
  for (const tr of PLAZA_TREES) items.push({ y: tr.y, draw: () => drawPlazaTree(c, tr.x, tr.y) });
  for (const l of LAMPS) items.push({ y: l.y, draw: () => drawLamp(c, l.x, l.y, false) });
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y + 0.01, draw: () => drawSeated(c, i, seconds) }));
  for (const w of WALKERS) {
    const p = walkerPos(w, seconds);
    items.push({ y: w.y, draw: () => drawPerson(c, p.x, w.y, w.colors, p.dir > 0 ? 'right' : 'left', true, seconds + w.phase) });
  }
  const myColors = lookColors(prefs.value.hair, prefs.value.shirt, prefs.value);
  if (seatedIndex === null) {
    items.push({
      y: me.y + 0.35,
      draw: () => (riding.value ? drawRider(c, me.x, me.y, myColors, me.facing, me.moving, seconds) : drawPerson(c, me.x, me.y, myColors, me.facing, me.moving, me.walkClock)),
    });
  }
  for (const other of shownRemotes) {
    const colors = remoteColors(other.remote);
    items.push({
      y: other.y + 0.35,
      draw: () => (other.remote.vehicle === 'bike' ? drawRider(c, other.x, other.y, colors, other.remote.facing, other.remote.moving, seconds) : drawPerson(c, other.x, other.y, colors, other.remote.facing, other.remote.moving, seconds)),
    });
  }
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  // 別人手上拿的小吃（從夜市帶過來的）
  ctx.font = `${Math.round(9 * scale)}px system-ui, "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  for (const other of shownRemotes) {
    if (!other.remote.item) continue;
    const p = screen(other.x + 0.45, other.y - 0.55);
    ctx.fillText(SHOP_ITEM_EMOJI[other.remote.item], p.x, p.y);
  }
  // 名牌：各場館、車站、腳踏車出租
  for (const [id, r] of EXHIBITS) {
    const n = EXHIBIT_NAMES[id];
    // 掛在欄杆上（不擋步道上的人）
    const p = screen((r.x0 + r.x1) / 2, r.y1 - 0.15);
    pill(c, `${n.emoji} ${n[locale.value]}`, p.x, p.y, '#4ade80');
  }
  const sp = screen(STATION_TRIGGER.x, ZOO.station.y0 - 2);
  pill(ctx, `🚇 ${t.value.zoo.station}`, sp.x, sp.y, '#fbbf24');
  if (seatedIndex === null) {
    const p = screen(me.x, me.y - (riding.value ? 1.3 : 1));
    pill(ctx, t.value.common.meLabel, p.x, p.y, '#fbbf24');
  }
  for (const other of shownRemotes) {
    const p = screen(other.x, other.y - (other.remote.vehicle ? 1.3 : 1));
    pill(ctx, remoteLabel(other), p.x, p.y, '#2dd4bf');
  }
  SEAT_SPOTS.forEach((spot, i) => {
    const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
    if (!mate) return;
    const p = screen(spot.x, spot.y - 1.4);
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
  updateWalk(dt);
  shownRemotes = viewRemotes(props.remotePlayers, 'zoo', dt);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  rememberScene('zoo', positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: 'zoo' }
      : { x: r2(me.x), y: r2(me.y), facing: me.facing, moving: me.moving, scene: 'zoo', ...(riding.value ? { vehicle: 'bike' as const } : {}) },
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
  if (!containerRef.value?.contains(target)) {
    if (event.code !== 'Space' && !KEY_MAP[event.code]) return event.code === 'Enter';
    target.blur();
    containerRef.value?.focus({ preventScroll: true });
    return false;
  }
  return target.closest('button, a') !== null && ['Space', 'Enter'].includes(event.code);
}

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
    if (disabled) {
      riding.value = false;
      return;
    }
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
    if (stationOpen.value) emit('leave');
    else if (bikeOpen.value) mountBike();
    else if (riding.value) dismount();
    else if (seatedIndex !== null) standUp();
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

// 點長椅：走過去坐（騎車的話先下車）
function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  const at = canvasRef.value ? localPoint(canvasRef.value, event.clientX, event.clientY) : null;
  if (!at) return;
  const x = (at.x - view.ox) / view.scale / T;
  const y = (at.y - view.oy) / view.scale / T;
  if (pickPerson(x, y)) return;
  if (props.disabled) {
    const clicked = pickSeatSpot(SEAT_SPOTS, x, y, (i) => seatState(i) === 'empty');
    if (clicked < 0 || clicked !== seatedIndex) askToLeave(() => handleClick(event));
    return;
  }
  const seat = pickSeatSpot(SEAT_SPOTS, x, y, (i) => seatState(i) === 'empty');
  if (seat >= 0 && seatState(seat) === 'empty') {
    if (seatedIndex !== null) standUp();
    riding.value = false;
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
  // 分享連結：站到朋友旁邊；坐過的位子就坐回去；不然站在動物園站出口
  const arrival = takeArrival('zoo');
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
