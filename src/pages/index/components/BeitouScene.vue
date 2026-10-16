<template>
  <!-- 北投溫泉：從捷運站搭過來的獨立地圖。北投溪從中間流過（兩座紅橋），西岸是溫泉博物館、北投圖書館、溪邊泡腳池，
       東岸是地熱谷和露天溫泉。座位跟圖書館的一樣是這個分區的座位（編號 89–104，同步給所有人）；同房間在北投的人也看得到。 -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-350px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#7ea85a] outline-none lg:h-[calc(100vh-300px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <!-- 回程的捷運站 -->
      <div v-if="stationOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center">
        <p class="!mb-2 !text-[11px] font-black">🚇 {{ t.beitou.stationPrompt }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="emit('leave')">{{ t.beitou.goBack }}</button>
      </div>

      <!-- 手機搖桿 -->
      <div
        v-if="isTouch"
        ref="stickRef"
        class="pixel-panel absolute bottom-2 right-2 h-24 w-24 !rounded-full opacity-80"
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
    <p class="mt-1.5 px-2 text-center text-[10px] font-bold leading-snug tracking-wide text-slate-500 dark:!text-white/55">
      {{ isTouch ? t.beitou.hintTouch : t.beitou.hintDesktop }}
    </p>

    <LeaveFocusDialog v-model="leaveConfirmOpen" @confirm="confirmLeave" @hide="afterFocusEnds = null" />
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { MyPosition, Reader, RemotePlayer } from 'src/pages/index/composables/useLibrarySocket';
import { createPositionSync, createRemoteView, remoteColors, remoteLabel, type ShownRemote } from 'src/pages/index/sceneRemotes';
import type { Seat } from 'src/pages/index/components/SeatGrid.vue';
import { useLocale } from 'src/composables/useLocale';
import { localPoint } from 'src/pages/index/composables/sceneFullscreen';
import LeaveFocusDialog from 'src/pages/index/components/LeaveFocusDialog.vue';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { AVATAR_SIZE, avatarColorsFor, getAvatarFrame, lookColors, SEATED_ROWS, type AvatarColors } from 'src/pages/index/pixel/pixelArt';
import { px, seeded } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';

type Facing = 'up' | 'down' | 'left' | 'right';
type Rect = { x0: number; y0: number; x1: number; y1: number };

const props = defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
  // 同房間的人（只畫也在北投的）
  remotePlayers: Record<string, RemotePlayer>;
}>();
const emit = defineEmits<{ leave: []; select: [seatId: string]; 'end-focus': []; position: [position: MyPosition] }>();
const { t } = useLocale();
const prefs = usePlayerPrefs();
const syncPosition = createPositionSync((pos) => emit('position', pos));
const viewRemotes = createRemoteView();
let shownRemotes: ShownRemote[] = [];

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stickRef = ref<HTMLDivElement | null>(null);
const isTouch = ref(false);
const stationOpen = ref(false);

// ── 場地（格，1 格 = 16px） ──
const T = 16;
const W = 56;
const H = 34;
// 北投溪：南北向從中間流過，只有兩座紅橋能過
const CREEK = { x0: 25.5, x1: 28.5 };
const BRIDGES = [
  { y0: 9.2, y1: 11 },
  { y0: 23.2, y1: 25 },
];
const STATION = { x0: 2, y0: 1.5, x1: 7, y1: 4.5, trigger: { x: 4.5, y: 5.5 } };
const MUSEUM: Rect = { x0: 9, y0: 3.5, x1: 19, y1: 9.5 };
const LIBRARY: Rect = { x0: 7, y0: 17.5, x1: 18, y1: 24.5 };
const FOOTBATH: Rect = { x0: 19.8, y0: 14, x1: 24.6, y1: 16 };
const VALLEY: Rect = { x0: 34, y0: 3, x1: 50, y1: 12 };
const BATH: Rect = { x0: 33, y0: 18.5, x1: 49, y1: 29 };
// 座位（順序 = 座位編號 89 起，不要調換）：圖書館門口長椅 4、溪邊泡腳池 4、露天溫泉 8
type SeatKind = 'bench' | 'foot' | 'bath';
const SEAT_SPOTS: { x: number; y: number; facing: Facing; kind: SeatKind }[] = [
  ...[9.5, 10.5, 14.5, 15.5].map((x) => ({ x, y: 25.4, facing: 'down' as const, kind: 'bench' as const })),
  ...[20.8, 21.8, 22.8, 23.8].map((x) => ({ x, y: 13.6, facing: 'down' as const, kind: 'foot' as const })),
  ...[36, 39.5, 43, 46.5].map((x) => ({ x, y: 21.8, facing: 'down' as const, kind: 'bath' as const })),
  ...[36, 39.5, 43, 46.5].map((x) => ({ x, y: 26, facing: 'down' as const, kind: 'bath' as const })),
];
const TREES = [
  ...[
    [1.5, 8],
    [3, 12],
    [21, 2.5],
    [23, 6],
    [31, 2],
    [52, 4],
    [53.5, 9],
    [31, 15],
    [52, 16],
    [2.5, 27],
    [5, 31],
    [21, 30],
    [31, 30.5],
    [52, 31],
  ].map(([x, y], i) => ({ x: x as number, y: y as number, v: i, maple: i % 3 !== 2 })),
];
const LANTERNS = [
  { x: 8, y: 11.5 },
  { x: 20, y: 11.5 },
  { x: 24, y: 19 },
  { x: 30, y: 8 },
  { x: 30, y: 26.5 },
  { x: 32, y: 14 },
  { x: 50.5, y: 17 },
  { x: 19, y: 26.5 },
];

function seatApproach(i: number): { x: number; y: number } | null {
  const spot = SEAT_SPOTS[i];
  if (!spot) return null;
  if (spot.kind === 'bath') return { x: spot.x, y: spot.y < 24 ? BATH.y0 - 0.5 : BATH.y1 + 0.5 };
  if (spot.kind === 'foot') return { x: spot.x, y: spot.y - 1 };
  return { x: spot.x, y: spot.y + 1 };
}

const inRect = (x: number, y: number, r: Rect) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;
const onBridge = (y: number) => BRIDGES.some((b) => y > b.y0 + 0.2 && y < b.y1 - 0.2);
const blocked = (x: number, y: number) =>
  x < 0.5 ||
  y < 0.5 ||
  x > W - 0.5 ||
  y > H - 0.5 ||
  (x > CREEK.x0 && x < CREEK.x1 && !onBridge(y)) ||
  inRect(x, y, STATION) ||
  inRect(x, y, MUSEUM) ||
  inRect(x, y, LIBRARY) ||
  inRect(x, y, FOOTBATH) ||
  inRect(x, y, VALLEY) ||
  (x > VALLEY.x0 + 2 && x < VALLEY.x1 - 2 && y > VALLEY.y1 - 0.1 && y < VALLEY.y1 + 0.6) ||
  inRect(x, y, BATH) ||
  SEAT_SPOTS.some((s) => s.kind === 'bench' && Math.abs(x - s.x) < 0.45 && Math.abs(y - s.y) < 0.4) ||
  TREES.some((tr) => Math.abs(x - tr.x) < 0.35 && Math.abs(y - tr.y) < 0.3) ||
  LANTERNS.some((l) => Math.abs(x - l.x) < 0.3 && Math.abs(y - l.y) < 0.3);

// ── 自己 ──
const me = { x: STATION.trigger.x + 1.5, y: STATION.trigger.y + 0.5, facing: 'down' as Facing, moving: false, walkClock: 0 };
let stationLock = false;
let seatedIndex: number | null = null;
let route: { x: number; y: number }[] = [];
let walkTarget: number | null = null;
let stuckFor = 0;

const keys = new Set<string>();
const stick = { x: 0, y: 0 };
const knob = ref({ x: 0, y: 0 });
let stickPointer: number | null = null;

function input(): { x: number; y: number } {
  const x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0) || stick.x;
  const y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0) || stick.y;
  return { x, y };
}

const sideOf = (x: number) => (x <= CREEK.x0 ? 'west' : x >= CREEK.x1 ? 'east' : 'creek');

// 走到某一點的路線：在溪的另一邊就先走到比較近的那座橋過去
function planRoute(to: { x: number; y: number }): { x: number; y: number }[] {
  const from = sideOf(me.x);
  const dest = sideOf(to.x);
  if (from === dest || from === 'creek' || dest === 'creek') return [to];
  const mid = (me.y + to.y) / 2;
  const bridge = BRIDGES.reduce((best, b) => (Math.abs((b.y0 + b.y1) / 2 - mid) < Math.abs((best.y0 + best.y1) / 2 - mid) ? b : best));
  const by = (bridge.y0 + bridge.y1) / 2;
  const near = from === 'west' ? CREEK.x0 - 0.4 : CREEK.x1 + 0.4;
  const far = from === 'west' ? CREEK.x1 + 0.4 : CREEK.x0 - 0.4;
  return [{ x: near, y: by }, { x: far, y: by }, to];
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
  route = [];
  me.x = spot.x;
  me.y = spot.y;
  me.facing = spot.facing;
  if (props.selectedSeatId !== seat.id) emit('select', seat.id);
}

// 按下專注前父層來問：坐著、正走去坐、或站在空位旁 → 那個座位；不然 null（父層提示還沒坐下）
function seatForFocus(): string | null {
  const i = seatedIndex ?? walkTarget ?? nearestSeat();
  const seat = i === null ? undefined : props.seats[i];
  if (i === null || !seat || (seatState(i) !== 'empty' && seatState(i) !== 'me')) return null;
  sitAt(i);
  return seat.id;
}

// 分享位置用：坐著就回報座位前面，不然是自己站的地方
function positionForShare(): { x: number; y: number } {
  const at = seatedIndex === null ? me : (seatApproach(seatedIndex) ?? me);
  return { x: at.x, y: at.y };
}

defineExpose({ seatForFocus, positionForShare });

function standUp(): void {
  const i = seatedIndex;
  seatedIndex = null;
  const back = i === null ? null : seatApproach(i);
  if (back) {
    me.x = back.x;
    me.y = back.y;
  }
}

function nearestSeat(): number | null {
  let best: number | null = null;
  let bestDist = 2;
  SEAT_SPOTS.forEach((_, i) => {
    const a = seatApproach(i);
    if (!a) return;
    const d = Math.hypot(me.x - a.x, me.y - a.y);
    if (d < bestDist && seatState(i) === 'empty') {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

// 溫泉／泡腳池整塊是擋路的：走進去、點水面、在池邊按 E，都直接泡進離那一點最近的空位
function poolAt(x: number, y: number, margin = 0): SeatKind | null {
  const grow = (r: Rect) => ({ x0: r.x0 - margin, y0: r.y0 - margin, x1: r.x1 + margin, y1: r.y1 + margin });
  if (inRect(x, y, grow(BATH))) return 'bath';
  if (inRect(x, y, grow(FOOTBATH))) return 'foot';
  return null;
}

function emptySeatNear(kind: SeatKind, x: number, y: number): number | null {
  let best: number | null = null;
  let bestDist = Infinity;
  SEAT_SPOTS.forEach((spot, i) => {
    if (spot.kind !== kind || seatState(i) !== 'empty') return;
    const d = Math.hypot(x - spot.x, y - spot.y);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  });
  return best;
}

// 用方向鍵走進池子坐下後，要先放開按鍵才會站起來（不然一坐下就被還按著的鍵拉起來）
let holdUntilRelease = false;

function walkTo(to: { x: number; y: number }, seat: number | null): void {
  if (seatedIndex !== null) standUp();
  route = planRoute(to);
  walkTarget = seat;
  stuckFor = 0;
}

// 站到某一點旁邊最近的空地（分享連結過來時）
function placeNear(at: { x: number; y: number }): void {
  for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, 1], [0, 0]] as const) {
    if (!blocked(at.x + dx, at.y + dy)) {
      me.x = at.x + dx;
      me.y = at.y + dy;
      stationLock = false;
      return;
    }
  }
}

function step(dx: number, dy: number, dt: number): void {
  const length = Math.hypot(dx, dy) || 1;
  const nx = me.x + (dx / length) * 4.2 * dt;
  const ny = me.y + (dy / length) * 4.2 * dt;
  const beforeX = me.x;
  const beforeY = me.y;
  if (!blocked(nx, me.y)) me.x = nx;
  if (!blocked(me.x, ny)) me.y = ny;
  stuckFor = Math.hypot(me.x - beforeX, me.y - beforeY) < 0.01 ? stuckFor + dt : 0;
  me.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  me.walkClock += dt;
}

function updateWalk(dt: number): void {
  // 開始專注時人還沒坐好：直接坐回自己的座位
  if (props.disabled && seatedIndex === null) {
    const mine = props.seats.findIndex((s) => s.id === props.selectedSeatId);
    if (mine >= 0) sitAt(mine);
  }
  const { x, y } = input();
  if (seatedIndex !== null) {
    me.moving = false;
    if (x === 0 && y === 0) holdUntilRelease = false;
    if ((x === 0 && y === 0) || props.disabled || holdUntilRelease) return;
    standUp();
  }
  if (x !== 0 || y !== 0) {
    route = [];
    walkTarget = null;
    me.moving = true;
    step(x, y, dt);
    // 頂著池邊走一下下：下水
    const pool = stuckFor > 0.3 ? poolAt(me.x + Math.sign(x) * 0.6, me.y + Math.sign(y) * 0.6) : null;
    const seat = pool ? emptySeatNear(pool, me.x, me.y) : null;
    if (seat !== null) {
      sitAt(seat);
      holdUntilRelease = true;
    }
  } else if (route.length) {
    const next = route[0];
    if (next) {
      const dx = next.x - me.x;
      const dy = next.y - me.y;
      if (Math.hypot(dx, dy) < 0.15 || stuckFor > 0.6) {
        route.shift();
        stuckFor = 0;
        if (!route.length) {
          me.moving = false;
          const target = walkTarget;
          walkTarget = null;
          if (target !== null && seatState(target) === 'empty') sitAt(target);
        }
      } else {
        me.moving = true;
        step(dx, dy, dt);
      }
    }
  } else {
    me.moving = false;
  }
  const atStation = Math.hypot(me.x - STATION.trigger.x, me.y - STATION.trigger.y) < 1.1;
  if (!atStation) stationLock = false;
  stationOpen.value = atStation && !stationLock && seatedIndex === null;
}

// ── 光線：跟其他地圖一樣看當地時間 ──
function lightPhase(): 'dawn' | 'day' | 'dusk' | 'night' {
  if (!prefs.value.sceneClock) return document.body.classList.contains('body--dark') ? 'night' : 'day';
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 15) return 'day';
  if (hour >= 15 && hour < 18) return 'dusk';
  return 'night';
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
  const rand = seeded(902);
  px(c, '#7ea85a', 0, 0, W * T, H * T);
  for (let i = 0; i < 3000; i += 1) px(c, rand() < 0.5 ? '#8bb766' : '#6f984f', Math.floor(rand() * W * T), Math.floor(rand() * H * T), 2, 1);
  // 石板步道：車站 → 博物館前 → 上面那座橋 → 地熱谷；圖書館 → 下面那座橋 → 露天溫泉
  const path = (x: number, y: number, w: number, h: number) => {
    px(c, '#cbbfa8', x * T, y * T, w * T, h * T);
    for (let yy = y * T; yy < (y + h) * T; yy += 8) {
      for (let xx = x * T + ((yy / 8) % 2 === 0 ? 0 : 6); xx < (x + w) * T; xx += 12) px(c, '#b8ab92', xx, yy, 1, 8);
      px(c, '#b8ab92', x * T, yy, w * T, 1);
    }
  };
  path(3.5, 5, 1.6, 6);
  path(3.5, 10.2, CREEK.x0 - 3.5, 1.4);
  path(CREEK.x1, 10.2, 13, 1.4);
  path(41, 12, 1.6, 6.5);
  path(12, 11.6, 1.6, 6);
  path(12, 24.2, CREEK.x0 - 12, 1.4);
  path(CREEK.x1, 24.2, BATH.x0 - CREEK.x1, 1.4);
  // 北投溪：帶點硫磺綠的溪水、溪石
  const cx = CREEK.x0 * T;
  const cw = (CREEK.x1 - CREEK.x0) * T;
  px(c, '#6a6458', cx - 3, 0, 3, H * T);
  px(c, '#6a6458', cx + cw, 0, 3, H * T);
  px(c, '#62b7a6', cx, 0, cw, H * T);
  for (let i = 0; i < 120; i += 1) px(c, rand() < 0.5 ? '#86ccbd' : '#4e9f8f', cx + Math.floor(rand() * cw), Math.floor(rand() * H * T), 3 + Math.floor(rand() * 4), 1);
  for (let i = 0; i < 26; i += 1) {
    const rx = cx + Math.floor(rand() * (cw - 6));
    const ry = Math.floor(rand() * H * T);
    px(c, '#8d8a83', rx, ry, 5, 3);
    px(c, '#a8a59e', rx + 1, ry, 3, 1);
  }
  // 泡腳池：木框＋溫泉水
  const f = FOOTBATH;
  px(c, '#8a5c3a', f.x0 * T, f.y0 * T, (f.x1 - f.x0) * T, (f.y1 - f.y0) * T);
  px(c, '#8fd3cc', f.x0 * T + 3, f.y0 * T + 3, (f.x1 - f.x0) * T - 6, (f.y1 - f.y0) * T - 6);
  // 地熱谷：翠綠帶乳白的溫泉，外圈是土坡和一圈大石，水裡有幾處冒泡
  const v = VALLEY;
  const vx = ((v.x0 + v.x1) / 2) * T;
  const vy = ((v.y0 + v.y1) / 2) * T;
  const rx = ((v.x1 - v.x0) / 2) * T;
  const ry = ((v.y1 - v.y0) / 2) * T;
  const oval = (inset: number, color: string, dy = 0) => {
    c.fillStyle = color;
    c.beginPath();
    c.ellipse(vx, vy + dy, rx - inset, ry - inset, 0, 0, Math.PI * 2);
    c.fill();
  };
  oval(-4, '#6b5a45');
  oval(0, '#8a7458');
  oval(7, '#3f9e8e');
  oval(11, '#62bfac');
  oval(20, '#7fd1c0', 3);
  oval(40, '#9addd0', 6);
  for (let i = 0; i < 70; i += 1) {
    const a = (i / 70) * Math.PI * 2 + rand() * 0.05;
    const k = 0.93 + rand() * 0.08;
    boulder(c, Math.round(vx + Math.cos(a) * rx * k) - 5, Math.round(vy + Math.sin(a) * ry * k) - 4, 8 + Math.floor(rand() * 5), 6 + Math.floor(rand() * 4), i);
  }
  for (let i = 0; i < 30; i += 1) px(c, '#c4ece4', Math.round(vx + (rand() - 0.5) * rx * 1.4), Math.round(vy + (rand() - 0.5) * ry * 1.2), 4 + Math.floor(rand() * 4), 1);
  // 冒泡的泉眼
  for (const [bx2, by2] of [
    [-0.35, -0.2],
    [0.15, 0.1],
    [0.4, -0.35],
  ] as const) {
    const ex = Math.round(vx + bx2 * rx);
    const ey = Math.round(vy + by2 * ry);
    px(c, '#b9ebe1', ex - 6, ey - 2, 12, 4);
    px(c, '#e2f7f2', ex - 3, ey - 1, 2, 2);
    px(c, '#e2f7f2', ex + 2, ey, 2, 2);
  }
  // 觀景圍欄（岩石外面一排，blocked 有算它）
  for (let x = Math.round((v.x0 + 2) * T); x < (v.x1 - 2) * T; x += 10) px(c, '#5a3d2a', x, v.y1 * T + 2, 2, 7);
  px(c, '#7a5236', (v.x0 + 2) * T, v.y1 * T + 3, (v.x1 - v.x0 - 4) * T, 2);
  paintBath(c, rand);
  return canvas;
}

// 露天溫泉的兩個池子（世界格座標）：座位在池裡，順序跟 SEAT_SPOTS 對好
const POOLS: Rect[] = [
  { x0: 34.4, y0: 19.9, x1: 48.2, y1: 23.5 },
  { x0: 34.4, y0: 24.5, x1: 48.2, y1: 28.1 },
];

// 一顆有光影的岩石
function boulder(c: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, tone: number): void {
  const base = ['#7d786e', '#8f8a7f', '#6c675e'][tone % 3] ?? '#7d786e';
  px(c, '#4f4b44', x, y + 1, w, h);
  px(c, base, x, y, w, h - 1);
  px(c, '#b3ada1', x + 1, y, w - 2, 1);
  px(c, '#a39d91', x, y + 1, 1, h - 3);
}

// 露天溫泉：木棧平台、後面一排竹籬，兩個石砌圓角池，池緣一圈大小不一的岩石，竹管往池裡流水
function paintBath(c: CanvasRenderingContext2D, rand: () => number): void {
  const b = BATH;
  const bx = b.x0 * T;
  const by = b.y0 * T;
  const bw = (b.x1 - b.x0) * T;
  const bh = (b.y1 - b.y0) * T;
  // 木棧平台
  px(c, '#6e4b30', bx - 1, by + 1, bw + 2, bh + 1);
  px(c, '#b48756', bx, by, bw, bh);
  for (let y = by; y < by + bh; y += 5) {
    px(c, '#9c7247', bx, y + 4, bw, 1);
    const off = Math.floor(rand() * 30);
    for (let x = bx + off; x < bx + bw; x += 34 + Math.floor(rand() * 20)) px(c, '#9c7247', x, y, 1, 4);
    if (rand() < 0.5) px(c, '#c39667', bx + Math.floor(rand() * bw), y + 1, 6, 1);
  }
  // 竹籬（後面和右邊）
  const bamboo = (x: number, y: number, h: number) => {
    px(c, '#7f9a3f', x, y, 3, h);
    px(c, '#a9c46a', x, y, 1, h);
    for (let yy = y + 4; yy < y + h; yy += 6) px(c, '#5f7a2c', x, yy, 3, 1);
  };
  for (let x = bx; x < bx + bw; x += 3) bamboo(x, by - 6, 10);
  px(c, '#5a3d2a', bx, by - 3, bw, 2);
  for (let y = by + 4; y < by + bh - 2; y += 3) px(c, '#7f9a3f', bx + bw - 3, y, 3, 3);
  for (let y = by + 4; y < by + bh - 2; y += 6) px(c, '#5f7a2c', bx + bw - 3, y, 3, 1);
  // 池子
  POOLS.forEach((pool, pi) => {
    const x = pool.x0 * T;
    const y = pool.y0 * T;
    const w = (pool.x1 - pool.x0) * T;
    const h = (pool.y1 - pool.y0) * T;
    const fill = (inset: number, color: string, r: number) => {
      c.fillStyle = color;
      c.beginPath();
      c.roundRect(x + inset, y + inset, w - inset * 2, h - inset * 2, r);
      c.fill();
    };
    fill(-3, '#4f4b44', 16);
    fill(0, '#2f8f88', 14);
    fill(4, '#4fb3a9', 12);
    fill(9, '#67c4b9', 9);
    fill(16, '#5ab9ae', 6);
    // 水面反光
    for (let i = 0; i < 26; i += 1) {
      px(c, rand() < 0.6 ? '#9ee0d6' : '#c8f0ea', x + 12 + Math.floor(rand() * (w - 30)), y + 10 + Math.floor(rand() * (h - 20)), 3 + Math.floor(rand() * 4), 1);
    }
    // 池緣岩石：沿著外圈擺一顆顆，大小、深淺不一
    const ring: [number, number][] = [];
    for (let xx = x - 2; xx < x + w - 4; xx += 7 + Math.floor(rand() * 4)) ring.push([xx, y - 5], [xx, y + h - 3]);
    for (let yy = y + 4; yy < y + h - 8; yy += 7 + Math.floor(rand() * 3)) ring.push([x - 6, yy], [x + w - 3, yy]);
    ring.forEach(([rx, ry], i) => boulder(c, Math.round(rx + rand() * 2), Math.round(ry + rand() * 2), 8 + Math.floor(rand() * 4), 6 + Math.floor(rand() * 3), i));
    // 池裡幾顆大石頭
    boulder(c, x + w - 22, y + 6, 14, 10, pi);
    boulder(c, x + 6, y + h - 16, 12, 9, pi + 1);
  });
  // 竹管流水：從右邊竹籬伸出來，水流進上面那池
  const spoutX = POOLS[0] ? POOLS[0].x1 * T - 4 : bx + bw - 20;
  const spoutY = (POOLS[0]?.y0 ?? b.y0) * T - 2;
  px(c, '#7f9a3f', spoutX - 14, spoutY, 18, 3);
  px(c, '#a9c46a', spoutX - 14, spoutY, 18, 1);
  px(c, '#5f7a2c', spoutX - 14, spoutY, 2, 3);
  px(c, '#d8f4ef', spoutX - 15, spoutY + 3, 2, 8);
  px(c, '#ffffff', spoutX - 16, spoutY + 10, 4, 2);
  // 湯桶疊在平台角落
  const tub = (x: number, y: number) => {
    px(c, '#4f3522', x, y + 1, 10, 7);
    px(c, '#c99a62', x, y, 10, 7);
    px(c, '#e0b47c', x + 1, y, 8, 1);
    px(c, '#5a3d2a', x, y + 2, 10, 1);
    px(c, '#5a3d2a', x, y + 5, 10, 1);
  };
  tub(bx + 4, by + bh - 12);
  tub(bx + 15, by + bh - 12);
  tub(bx + 9, by + bh - 18);
}

// 兩座紅色木橋（畫在溪上）
function drawBridges(c: CanvasRenderingContext2D): void {
  for (const b of BRIDGES) {
    const x = (CREEK.x0 - 0.3) * T;
    const w = (CREEK.x1 - CREEK.x0 + 0.6) * T;
    const y = b.y0 * T;
    const h = (b.y1 - b.y0) * T;
    px(c, 'rgba(0,0,0,0.2)', x, y + h, w, 4);
    px(c, '#a8754a', x, y, w, h);
    for (let xx = x; xx < x + w; xx += 6) px(c, '#8d5f3a', xx, y, 1, h);
    px(c, '#b33a2a', x, y - 2, w, 3);
    px(c, '#b33a2a', x, y + h - 1, w, 3);
    for (let xx = x; xx <= x + w; xx += 12) {
      px(c, '#8e2c20', xx, y - 6, 2, 6);
      px(c, '#8e2c20', xx, y + h - 5, 2, 6);
    }
  }
}

function drawStation(c: CanvasRenderingContext2D, lit: boolean): void {
  const x = STATION.x0 * T;
  const y = STATION.y0 * T;
  const w = (STATION.x1 - STATION.x0) * T;
  const h = (STATION.y1 - STATION.y0) * T;
  px(c, 'rgba(0,0,0,0.2)', x + 3, y + h - 2, w, 5);
  // 日式車站：白牆、深色瓦頂、紅色招牌
  px(c, '#f2eee4', x + 3, y + 10, w - 6, h - 12);
  px(c, '#3f4652', x - 3, y, w + 6, 12);
  px(c, '#2c313b', x - 3, y + 10, w + 6, 2);
  px(c, '#c8423b', x + w / 2 - 16, y + 14, 32, 7);
  px(c, '#f2eee4', x + w / 2 - 12, y + 16, 24, 3);
  px(c, lit ? '#ffe9a8' : '#3a3d45', x + 10, y + h - 18, w - 20, 16);
  for (let gx = x + 18; gx < x + w - 10; gx += 12) px(c, '#8a5c3a', gx, y + h - 18, 2, 16);
}

// 北投溫泉博物館：下半紅磚、上半木造、深灰瓦頂、白色窗框
function drawMuseum(c: CanvasRenderingContext2D, lit: boolean): void {
  const r = MUSEUM;
  const x = r.x0 * T;
  const y = r.y0 * T;
  const w = (r.x1 - r.x0) * T;
  const h = (r.y1 - r.y0) * T;
  px(c, 'rgba(0,0,0,0.2)', x + 4, y + h - 2, w, 6);
  px(c, '#a24b36', x + 4, y + h / 2, w - 8, h / 2);
  for (let yy = y + h / 2; yy < y + h; yy += 4) px(c, '#8a3d2c', x + 4, yy, w - 8, 1);
  px(c, '#b58552', x + 4, y + 18, w - 8, h / 2 - 18);
  for (let xx = x + 4; xx < x + w - 4; xx += 5) px(c, '#9c6f42', xx, y + 18, 1, h / 2 - 18);
  for (let i = 0; i < 6; i += 1) {
    const wx = x + 14 + i * ((w - 28) / 6);
    px(c, '#f4f2ea', wx, y + 24, 12, 14);
    px(c, lit ? '#ffd98a' : '#5f7d8c', wx + 2, y + 26, 8, 10);
    px(c, '#f4f2ea', wx, y + h / 2 + 10, 12, 16);
    px(c, lit ? '#ffd98a' : '#5f7d8c', wx + 2, y + h / 2 + 12, 8, 12);
  }
  // 瓦頂
  px(c, '#4a505c', x - 4, y + 4, w + 8, 16);
  for (let xx = x - 4; xx < x + w + 4; xx += 4) px(c, '#3a3f49', xx, y + 4, 1, 16);
  px(c, '#2c313b', x - 4, y + 18, w + 8, 3);
  px(c, '#4a505c', x + w / 2 - 20, y - 4, 40, 10);
  // 入口
  px(c, '#5a3d2a', x + w / 2 - 8, y + h - 18, 16, 18);
}

// 北投圖書館：綠色木造、斜屋頂上是草皮和太陽能板、大片落地窗
function drawLibrary(c: CanvasRenderingContext2D, lit: boolean): void {
  const r = LIBRARY;
  const x = r.x0 * T;
  const y = r.y0 * T;
  const w = (r.x1 - r.x0) * T;
  const h = (r.y1 - r.y0) * T;
  px(c, 'rgba(0,0,0,0.2)', x + 4, y + h - 2, w, 6);
  px(c, '#9a7048', x + 4, y + 20, w - 8, h - 20);
  for (let xx = x + 4; xx < x + w - 4; xx += 4) px(c, '#86603c', xx, y + 20, 1, h - 20);
  // 落地窗
  for (let i = 0; i < 7; i += 1) {
    const wx = x + 10 + i * ((w - 20) / 7);
    px(c, lit ? '#ffe2a0' : '#a9d6d8', wx, y + 30, (w - 20) / 7 - 3, h - 42);
  }
  // 斜屋頂：草皮＋太陽能板
  px(c, '#5e9a3e', x - 6, y, w + 12, 22);
  for (let xx = x - 6; xx < x + w + 6; xx += 3) px(c, '#6fae4a', xx, y + ((xx / 3) % 2 === 0 ? 2 : 4), 1, 2);
  for (let i = 0; i < 5; i += 1) {
    const sx = x + 14 + i * 28;
    px(c, '#2f4a6b', sx, y + 5, 22, 10);
    px(c, '#4a6d96', sx + 1, y + 6, 20, 2);
  }
  px(c, '#3e6e2a', x - 6, y + 20, w + 12, 3);
  // 門
  px(c, '#5a3d2a', x + w / 2 - 9, y + h - 20, 18, 20);
  px(c, lit ? '#ffd98a' : '#c9a66b', x + w / 2 - 7, y + h - 18, 14, 12);
}

function drawTree(c: CanvasRenderingContext2D, tree: { x: number; y: number; v: number; maple: boolean }, seconds: number): void {
  const x = Math.round(tree.x * T);
  const y = Math.round(tree.y * T);
  const sway = Math.round(Math.sin(seconds * 0.7 + tree.v) * 1);
  px(c, 'rgba(0,0,0,0.18)', x - 12, y + 2, 24, 4);
  px(c, '#5a3d2a', x - 2, y - 16, 4, 19);
  if (tree.maple) {
    // 楓樹：紅、橘
    const colors = tree.v % 2 === 0 ? ['#c8423b', '#e2683d', '#f2a541'] : ['#e2683d', '#f2a541', '#c8423b'];
    const blobs: [number, number, number][] = [
      [-10, -28, 10],
      [-1, -35, 11],
      [8, -28, 10],
      [-5, -21, 9],
      [5, -20, 9],
    ];
    blobs.forEach(([bx, by, r], i) => px(c, colors[i % 3] ?? '#c8423b', x + bx - r / 2 + sway, y + by - r / 2, r, r));
    return;
  }
  // 松樹：一層層深綠
  for (let i = 0; i < 4; i += 1) {
    const w = 22 - i * 5;
    px(c, i % 2 === 0 ? '#2f6b3f' : '#3a7d4a', x - w / 2 + sway, y - 16 - i * 7, w, 8);
  }
}

// 石燈籠：晚上窗口亮起來
function drawLantern(c: CanvasRenderingContext2D, l: { x: number; y: number }, lit: boolean): void {
  const x = Math.round(l.x * T);
  const y = Math.round(l.y * T);
  px(c, 'rgba(0,0,0,0.2)', x - 5, y + 2, 10, 2);
  px(c, '#8d8a83', x - 4, y - 2, 8, 4);
  px(c, '#a19e96', x - 1, y - 12, 3, 10);
  px(c, '#8d8a83', x - 5, y - 18, 10, 6);
  px(c, lit ? '#ffd98a' : '#5c5a55', x - 2, y - 16, 4, 3);
  px(c, '#77746d', x - 7, y - 21, 14, 3);
  px(c, '#8d8a83', x - 1, y - 24, 3, 3);
}

function drawPerson(c: CanvasRenderingContext2D, colors: AvatarColors, x: number, y: number, facing: Facing, moving: boolean, clock: number): void {
  const frame = moving ? (Math.floor(clock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  const sprite = getAvatarFrame(colors, facing, frame);
  px(c, 'rgba(0,0,0,0.18)', Math.round(x * T - 5), Math.round(y * T + 3), 10, 2);
  c.drawImage(sprite, Math.round(x * T - AVATAR_SIZE.w / 2), Math.round(y * T + 5 - AVATAR_SIZE.h));
}

// 泡在溫泉裡：只露出頭和肩膀，水面一圈漣漪
function drawSoaker(c: CanvasRenderingContext2D, colors: AvatarColors, x: number, y: number, seconds: number): void {
  const rows = 12;
  const water = Math.round(y * T + 2);
  const bob = Math.floor(seconds * 1.5 + x) % 2;
  c.drawImage(getAvatarFrame(colors, 'down', 'idle'), 0, 0, AVATAR_SIZE.w, rows, Math.round(x * T - AVATAR_SIZE.w / 2), water - rows + bob, AVATAR_SIZE.w, rows);
  px(c, 'rgba(103, 196, 185, 0.95)', Math.round(x * T - 8), water, 16, 2);
  px(c, 'rgba(255,255,255,0.7)', Math.round(x * T - 9), water + 2, 3, 1);
  px(c, 'rgba(255,255,255,0.7)', Math.round(x * T + 6), water + 2, 3, 1);
  // 頭上的毛巾
  px(c, '#ffffff', Math.round(x * T - 4), water - rows + bob + 1, 8, 3);
}

function drawSeat(c: CanvasRenderingContext2D, i: number, seconds: number): void {
  const spot = SEAT_SPOTS[i];
  if (!spot) return;
  const x = Math.round(spot.x * T);
  const y = Math.round(spot.y * T);
  const state = seatState(i);
  const occupied = state === 'mate' || state === 'taken' || (state === 'me' && seatedIndex === i);
  const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
  const colors = state === 'me' ? lookColors(prefs.value.hair, prefs.value.shirt) : mate ? avatarColorsFor(mate.displayName) : { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };
  if (spot.kind === 'bath') {
    if (occupied) drawSoaker(c, colors, spot.x, spot.y, seconds);
    else {
      // 空位：水裡一塊可以坐的平石
      px(c, '#3f9b92', x - 6, y - 1, 12, 5);
      px(c, '#8fd0c7', x - 5, y - 2, 10, 4);
      px(c, '#b5e4dd', x - 4, y - 2, 8, 1);
    }
    if (state === 'me' && seatedIndex !== i) {
      c.fillStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(seconds * 3) * 0.15})`;
      c.fillRect(x - 7, y + 3, 14, 2);
    }
    return;
  }
  px(c, 'rgba(0,0,0,0.18)', x - 7, y + 4, 14, 3);
  if (spot.kind === 'bench') {
    px(c, '#3a3d45', x - 7, y + 1, 1, 4);
    px(c, '#3a3d45', x + 6, y + 1, 1, 4);
    px(c, '#9c6b45', x - 8, y - 3, 16, 5);
    px(c, '#b9845a', x - 8, y - 3, 16, 1);
    px(c, '#8a5c3a', x - 8, y - 8, 16, 3);
  } else {
    // 泡腳池邊的木頭坐板
    px(c, '#8a5c3a', x - 7, y - 2, 14, 4);
    px(c, '#a8754a', x - 7, y - 2, 14, 1);
  }
  if (state === 'me' && seatedIndex !== i) {
    c.fillStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(seconds * 3) * 0.15})`;
    c.fillRect(x - 7, y + 4, 14, 2);
  }
  if (!occupied) return;
  c.drawImage(getAvatarFrame(colors, spot.facing, 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y + 1 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
  // 泡腳：腳泡在水裡，冒一點熱氣
  if (spot.kind === 'foot') px(c, 'rgba(255,255,255,0.5)', x - 3, y + 5 - (Math.floor(seconds * 2) % 3), 2, 2);
}

// 溫泉的熱氣：地熱谷、露天溫泉、泡腳池、北投溪，一團團白霧慢慢往上飄（世界座標）
function drawSteam(c: CanvasRenderingContext2D, seconds: number): void {
  const sources: { x0: number; x1: number; y: number; n: number; size: number }[] = [
    { x0: VALLEY.x0 + 2, x1: VALLEY.x1 - 2, y: (VALLEY.y0 + VALLEY.y1) / 2 + 2, n: 16, size: 14 },
    { x0: BATH.x0 + 1, x1: BATH.x1 - 1, y: (BATH.y0 + BATH.y1) / 2 + 2, n: 12, size: 10 },
    { x0: FOOTBATH.x0, x1: FOOTBATH.x1, y: FOOTBATH.y1, n: 3, size: 6 },
    { x0: CREEK.x0, x1: CREEK.x1, y: H, n: 10, size: 8 },
  ];
  sources.forEach((src, si) => {
    for (let i = 0; i < src.n; i += 1) {
      const period = 5 + ((i * 7 + si) % 4);
      const k = ((seconds / period + i * 0.37 + si * 0.13) % 1 + 1) % 1;
      const baseX = src.x0 + ((i * 0.618 + si * 0.3) % 1) * (src.x1 - src.x0);
      // 溪上的熱氣沿著整條溪各處冒，其他的從池子中間冒
      const fromY = si === 3 ? ((i * 0.37 + 0.1) % 1) * H : src.y;
      const rise = si === 3 ? k * 2 : k * 4;
      const x = (baseX + Math.sin(seconds * 0.6 + i) * 0.4) * T;
      const y = (fromY - rise) * T;
      const r = src.size * (0.6 + k * 0.8);
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, `rgba(255, 255, 255, ${0.32 * (1 - k)})`);
      g.addColorStop(1, 'rgba(255, 255, 255, 0)');
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
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

function drawLighting(c: CanvasRenderingContext2D): void {
  const phase = lightPhase();
  if (phase === 'day') return;
  const tint = phase === 'night' ? '#6f7aa8' : phase === 'dusk' ? '#f0c9a8' : '#c9c6e8';
  const lamps = phase === 'night' ? 1 : phase === 'dawn' ? 0.35 : 0;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = tint;
  c.fillRect(0, 0, W * T, H * T);
  if (lamps > 0) {
    c.globalCompositeOperation = 'lighter';
    c.globalAlpha = lamps;
    const glow = (x: number, y: number, r: number, color: string) => {
      const g = c.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, color);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(x - r, y - r, r * 2, r * 2);
    };
    for (const l of LANTERNS) glow(l.x * T, l.y * T - 14, 36, 'rgba(255, 210, 140, 0.45)');
    glow(((MUSEUM.x0 + MUSEUM.x1) / 2) * T, MUSEUM.y1 * T, 80, 'rgba(255, 200, 120, 0.3)');
    glow(((LIBRARY.x0 + LIBRARY.x1) / 2) * T, LIBRARY.y1 * T, 80, 'rgba(255, 210, 140, 0.3)');
    glow(((BATH.x0 + BATH.x1) / 2) * T, ((BATH.y0 + BATH.y1) / 2) * T, 120, 'rgba(160, 230, 220, 0.18)');
  }
  c.restore();
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
  const follow = (size: number, world: number, at: number) => (world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - at)));
  const ox = Math.round(follow(cssW, W * T * scale, me.x * T * scale) * dpr) / dpr;
  const oy = Math.round(follow(cssH, H * T * scale, me.y * T * scale) * dpr) / dpr;
  Object.assign(view, { scale, ox, oy, dpr, w: cssW, h: cssH });

  const phase = lightPhase();
  const lit = phase === 'night' || phase === 'dawn';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  if (ground) ctx.drawImage(ground, 0, 0);
  const c = ctx;
  drawBridges(c);

  const items: { y: number; draw: () => void }[] = [];
  items.push({ y: STATION.y1, draw: () => drawStation(c, lit) });
  items.push({ y: MUSEUM.y1, draw: () => drawMuseum(c, lit) });
  items.push({ y: LIBRARY.y1, draw: () => drawLibrary(c, lit) });
  TREES.forEach((tree) => items.push({ y: tree.y, draw: () => drawTree(c, tree, seconds) }));
  LANTERNS.forEach((l) => items.push({ y: l.y, draw: () => drawLantern(c, l, lit) }));
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y + 0.2, draw: () => drawSeat(c, i, seconds) }));
  for (const other of shownRemotes) {
    const colors = remoteColors(other.remote);
    items.push({ y: other.y + 0.35, draw: () => drawPerson(c, colors, other.x, other.y, other.remote.facing, other.remote.moving, seconds) });
  }
  if (seatedIndex === null) {
    items.push({ y: me.y + 0.35, draw: () => drawPerson(c, lookColors(prefs.value.hair, prefs.value.shirt), me.x, me.y, me.facing, me.moving, me.walkClock) });
  }
  items.sort((a, b) => a.y - b.y).forEach((item) => item.draw());
  drawSteam(c, seconds);
  drawLighting(c);

  // 名牌（螢幕座標）
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  const labels: [string, number, number, string][] = [
    [t.value.beitou.stationName, (STATION.x0 + STATION.x1) / 2, STATION.y0 - 0.6, '#60a5fa'],
    [t.value.beitou.museum, (MUSEUM.x0 + MUSEUM.x1) / 2, MUSEUM.y0 - 0.8, '#fbbf24'],
    [t.value.beitou.library, (LIBRARY.x0 + LIBRARY.x1) / 2, LIBRARY.y0 - 0.6, '#4ade80'],
    [t.value.beitou.valley, (VALLEY.x0 + VALLEY.x1) / 2, VALLEY.y0 + 0.2, '#2dd4bf'],
    [t.value.beitou.bath, (BATH.x0 + BATH.x1) / 2, BATH.y0 - 0.2, '#38bdf8'],
    [t.value.beitou.footbath, (FOOTBATH.x0 + FOOTBATH.x1) / 2, FOOTBATH.y1 + 1.6, '#38bdf8'],
  ];
  for (const [text, x, y, color] of labels) {
    const p = screen(x, y);
    pill(ctx, text, p.x, p.y, color);
  }
  const seatSpot = seatedIndex === null ? null : SEAT_SPOTS[seatedIndex];
  const mp = seatSpot ? screen(seatSpot.x, seatSpot.y - (seatSpot.kind === 'bath' ? 0.9 : 1.1)) : screen(me.x, me.y - 1.1);
  pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
  for (const other of shownRemotes) {
    const op = screen(other.x, other.y - 1.1);
    pill(ctx, remoteLabel(other), op.x, op.y, '#2dd4bf');
  }
  SEAT_SPOTS.forEach((spot, i) => {
    const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
    if (!mate) return;
    const p = screen(spot.x, spot.y - (spot.kind === 'bath' ? 0.9 : 1.1));
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
  shownRemotes = viewRemotes(props.remotePlayers, 'beitou', dt);
  rememberScene('beitou', positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: 'beitou' }
      : { x: Math.round(me.x * 100) / 100, y: Math.round(me.y * 100) / 100, facing: me.facing, moving: me.moving, scene: 'beitou' },
    seconds,
  );
  render(seconds);
}

// ── 輸入 ──
const KEY_MAP: Record<string, Facing> = {
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
  // 點過場景外的按鈕、分頁、音量滑桿後焦點會留在那裡：空白鍵和移動鍵還給地圖，Enter 照樣按那個按鈕
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
    if (seatedIndex !== null) standUp();
    else {
      const pool = poolAt(me.x, me.y, 1.2);
      const seat = nearestSeat() ?? (pool ? emptySeatNear(pool, me.x, me.y) : null);
      if (seat !== null) sitAt(seat);
    }
  }
}

function onKeyUp(event: KeyboardEvent): void {
  const dir = KEY_MAP[event.code];
  if (dir) keys.delete(dir);
}

function seatAt(x: number, y: number): number {
  return pickSeatSpot(SEAT_SPOTS, x, y, (i) => seatState(i) === 'empty');
}

// 點座位：走過去坐（溫泉就走到池邊再下水）；點地面：走過去（在對岸就繞橋）
function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  const at = canvasRef.value ? localPoint(canvasRef.value, event.clientX, event.clientY) : null;
  if (!at) return;
  const x = (at.x - view.ox) / view.scale / T;
  const y = (at.y - view.oy) / view.scale / T;
  const seat = seatAt(x, y);
  if (props.disabled) {
    if (seat < 0 || seat !== seatedIndex) askToLeave(() => handleClick(event));
    return;
  }
  if (seat >= 0 && (seatState(seat) === 'empty' || !poolAt(x, y))) {
    const approach = seatApproach(seat);
    if (approach && seatState(seat) === 'empty') walkTo(approach, seat);
    return;
  }
  // 點水面：走到池邊，泡進離點的地方最近的空位
  const pool = poolAt(x, y);
  const near = pool ? emptySeatNear(pool, x, y) : null;
  const approach = near === null ? null : seatApproach(near);
  if (near !== null && approach) walkTo(approach, near);
  else if (!blocked(x, y)) walkTo({ x, y }, null);
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
  // 一抵達就站在捷運站旁：先走開才會再跳出回程面板
  stationLock = true;
  // 朋友分享的位置：站到他旁邊；不然上次就坐在北投的話直接坐回去
  const arrival = takeArrival('beitou');
  const mine = props.seats.findIndex((s) => s.id === props.selectedSeatId);
  if (arrival) placeNear(arrival);
  else if (mine >= 0) sitAt(mine);
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
