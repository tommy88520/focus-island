<template>
  <!-- F1 月台：從主地圖的 F1 站搭過來，在這裡選要去哪條賽道（F1 賽車場、台北／台中／高雄大獎賽，各自是獨立地圖）。
       月台上有長椅可以坐著專注；同房間也在月台的人看得到彼此 -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#1b1e2b] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <ProfileCard v-if="profilePerson" :person="profilePerson" @close="profilePerson = null" @whisper="whisperTo" />

      <!-- 走到車門前：要搭去哪 -->
      <div v-if="openGate" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-max max-w-[calc(100%-1.5rem)] -translate-x-1/2 px-4 py-3 text-center">
        <p class="!mb-2 !text-[11px] font-black">🚄 {{ t.f1Hub.goPrompt(openGate.label) }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="emit('go', openGate.to)">{{ t.f1Hub.go }}</button>
      </div>
      <!-- 出口：回圖書館 -->
      <div v-else-if="exitOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center">
        <p class="!mb-2 !text-[11px] font-black">🚇 {{ t.f1.stationPrompt }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="emit('leave')">{{ t.f1.goBack }}</button>
      </div>

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
    <SceneHint :text="isTouch ? t.f1Hub.hintTouch : t.f1Hub.hintDesktop" />

    <LeaveFocusDialog v-model="leaveConfirmOpen" @confirm="confirmLeave" @hide="afterFocusEnds = null" />
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
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
import { CIRCUITS, type CircuitDef } from 'src/pages/index/pixel/circuits';

export type HubDestination = 'f1' | 'gptpe' | 'gptxg' | 'gpkhh';

const props = defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
  remotePlayers: Record<string, RemotePlayer>;
  // 從哪條賽道回來（站在那個車門前）；從圖書館來就站在出口樓梯旁
  from?: string | undefined;
}>();
const emit = defineEmits<{ leave: []; go: [to: HubDestination]; select: [seatId: string]; 'end-focus': []; position: [position: MyPosition]; whisper: [to: string, phrase: WhisperId] }>();

const { t, locale } = useLocale();
const prefs = usePlayerPrefs();

// ── 場地（格，1 格 = 16px）：上面是列車，中間是月台，下面一排路線看板，右下角是出口 ──
const T = 16;
const W = 44;
const H = 21;
const TRAIN = { y0: 0.5, y1: 5 };
const PLATFORM_Y = 5.4;
// 四個車門：各去一條賽道（顏色是那條賽道的代表色）
const GATES: { x: number; to: HubDestination; color: string }[] = [
  { x: 7, to: 'f1', color: '#f6c945' },
  { x: 17, to: 'gptpe', color: '#ff3b5c' },
  { x: 27, to: 'gptxg', color: '#ff8a3b' },
  { x: 37, to: 'gpkhh', color: '#ff3b8a' },
];
const EXIT = { x0: 39, y0: 12.8, x1: 43.5, y1: 16.4, trigger: { x: 41, y: 12 } };
const BOARD = { y0: 16.6, y1: 21 };
// 長椅：三張、各坐兩個人（順序 = 座位編號）
const BENCHES = [9.5, 21, 32.5];
const SEAT_SPOTS = BENCHES.flatMap((bx) => [
  { x: bx - 0.75, y: 10.6 },
  { x: bx + 0.75, y: 10.6 },
]);
const PILLARS = [3, 12, 22, 32];

function gateLabel(to: HubDestination): string {
  return to === 'f1' ? t.value.f1.title : CIRCUITS[to].title[locale.value];
}

const blocked = (x: number, y: number) =>
  x < 0.5 || x > W - 0.5 || y < PLATFORM_Y + 0.6 || y > BOARD.y0 - 0.2 ||
  SEAT_SPOTS.some((s) => Math.abs(x - s.x) < 0.45 && Math.abs(y - s.y) < 0.45) ||
  PILLARS.some((p) => Math.abs(x - p) < 0.5 && y > 8.6 && y < 9.6) ||
  (x > EXIT.x0 && x < EXIT.x1 && y > EXIT.y0 && y < EXIT.y1);

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
const gateIndex = ref<number | null>(null);
const exitOpen = ref(false);
const openGate = computed(() => {
  const g = gateIndex.value === null ? null : GATES[gateIndex.value];
  return g ? { to: g.to, label: gateLabel(g.to) } : null;
});

// ── 自己 ──
const me = { x: 22, y: 13, facing: 'up' as 'up' | 'down' | 'left' | 'right', moving: false, walkClock: 0 };
// 剛抵達時站在面板觸發範圍裡：先走開才會再跳出來
let triggerLock = true;
let seatedIndex: number | null = null;
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
  me.facing = 'down';
  if (props.selectedSeatId !== seat.id) emit('select', seat.id);
}

function seatForFocus(): string | null {
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

function positionForShare(): { x: number; y: number } {
  return { x: me.x, y: me.y };
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
    const bx = me.x;
    const by = me.y;
    if (!blocked(nx, me.y)) me.x = nx;
    if (!blocked(me.x, ny)) me.y = ny;
    stuckFor = walkTarget !== null && Math.hypot(me.x - bx, me.y - by) < 0.01 ? stuckFor + dt : 0;
    me.facing = Math.abs(x) > Math.abs(y) ? (x > 0 ? 'right' : 'left') : y > 0 ? 'down' : 'up';
    me.walkClock += dt;
  }
  // 站在車門前、出口前就跳面板
  const gate = GATES.findIndex((g) => Math.abs(me.x - g.x) < 1.6 && me.y < PLATFORM_Y + 2.2);
  const atExit = Math.hypot(me.x - EXIT.trigger.x, me.y - EXIT.trigger.y) < 1.4;
  if (gate < 0 && !atExit) triggerLock = false;
  gateIndex.value = !triggerLock && gate >= 0 && seatedIndex === null ? gate : null;
  exitOpen.value = !triggerLock && atExit && seatedIndex === null;
}

// ── 畫 ──
let ctx: CanvasRenderingContext2D | null = null;
let ground: HTMLCanvasElement | null = null;
const view = { scale: 2, ox: 0, oy: 0 };

// 路線看板上的小賽道圖：把中心線縮到框框裡
function miniTrack(c: CanvasRenderingContext2D, circuit: CircuitDef | null, x: number, y: number, w: number, h: number, color: string): void {
  c.strokeStyle = color;
  c.lineWidth = 2;
  c.lineJoin = 'round';
  c.beginPath();
  if (!circuit) {
    // F1 賽車場：原本那條（橢圓形的）
    c.ellipse(x + w / 2, y + h / 2, w / 2 - 4, h / 2 - 3, 0, 0, Math.PI * 2);
    c.stroke();
    return;
  }
  const xs = circuit.track.map((p) => p[0]);
  const ys = circuit.track.map((p) => p[1]);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const k = Math.min((w - 8) / (Math.max(...xs) - minX), (h - 6) / (Math.max(...ys) - minY));
  circuit.track.forEach(([tx, ty], i) => {
    const sx = x + 4 + (tx - minX) * k;
    const sy = y + 3 + (ty - minY) * k;
    if (i === 0) c.moveTo(sx, sy);
    else c.lineTo(sx, sy);
  });
  c.closePath();
  c.stroke();
}

function paintGround(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W * T;
  canvas.height = H * T;
  const c = canvas.getContext('2d');
  if (!c) return canvas;
  const rand = seeded(17);
  // 軌道：碎石、枕木、兩條鐵軌
  px(c, '#2a2a30', 0, 0, W * T, PLATFORM_Y * T);
  for (let i = 0; i < 500; i += 1) px(c, rand() < 0.5 ? '#3a3a42' : '#232328', Math.floor(rand() * W * T), Math.floor(rand() * PLATFORM_Y * T), 2, 2);
  for (let x = 0; x < W * T; x += 10) px(c, '#4a3a2c', x, 2 * T, 5, 2 * T);
  px(c, '#9aa0ab', 0, 2.3 * T, W * T, 2);
  px(c, '#9aa0ab', 0, 3.6 * T, W * T, 2);
  // 月台：磁磚地板、邊緣的黃色導盲磚、白色安全線
  px(c, '#cfcbc2', 0, PLATFORM_Y * T, W * T, (BOARD.y0 - PLATFORM_Y) * T);
  for (let x = 0; x < W; x += 1) for (let y = Math.ceil(PLATFORM_Y); y < BOARD.y0; y += 1) if ((x + y) % 2 === 0) px(c, '#cac6bc', x * T, y * T, T, T);
  for (let i = 0; i < 400; i += 1) px(c, 'rgba(0,0,0,0.05)', Math.floor(rand() * W * T), PLATFORM_Y * T + Math.floor(rand() * (BOARD.y0 - PLATFORM_Y) * T), 2, 2);
  px(c, '#f6c945', 0, PLATFORM_Y * T, W * T, 6);
  for (let x = 0; x < W * T; x += 6) px(c, '#e0b232', x + 1, PLATFORM_Y * T + 1, 3, 3);
  px(c, '#ffffff', 0, (PLATFORM_Y + 0.9) * T, W * T, 2);
  // 車門前的地上標示（排隊的箭頭）
  for (const g of GATES) {
    px(c, g.color, (g.x - 1.2) * T, (PLATFORM_Y + 1.3) * T, 2.4 * T, 3);
    for (let k = 0; k < 3; k += 1) px(c, 'rgba(0,0,0,0.25)', (g.x - 0.2) * T, (PLATFORM_Y + 1.8 + k * 0.5) * T, 6, 3);
  }
  // 下方的牆：四塊路線看板
  px(c, '#2b2f45', 0, BOARD.y0 * T, W * T, (H - BOARD.y0) * T);
  px(c, '#454a66', 0, BOARD.y0 * T, W * T, 3);
  GATES.forEach((g) => {
    const bx = (g.x - 4) * T;
    const by = BOARD.y0 * T + 6;
    const bw = 8 * T;
    const bh = (H - BOARD.y0) * T - 10;
    px(c, '#11131c', bx, by, bw, bh);
    px(c, g.color, bx, by, bw, 2);
    miniTrack(c, g.to === 'f1' ? null : CIRCUITS[g.to], bx + 4, by + 4, bw * 0.45, bh - 8, g.color);
    px(c, 'rgba(255,255,255,0.12)', bx + bw * 0.55, by + 8, bw * 0.4, 2);
    px(c, 'rgba(255,255,255,0.12)', bx + bw * 0.55, by + 14, bw * 0.3, 2);
  });
  // 出口的樓梯
  px(c, '#3a3d4a', EXIT.x0 * T, EXIT.y0 * T, (EXIT.x1 - EXIT.x0) * T, (EXIT.y1 - EXIT.y0) * T);
  for (let k = 0; k < 6; k += 1) px(c, '#5a5e70', EXIT.x0 * T, EXIT.y0 * T + k * 9, (EXIT.x1 - EXIT.x0) * T, 3);
  return canvas;
}

function drawTrain(c: CanvasRenderingContext2D, seconds: number): void {
  // 銀色車廂、紅色腰帶、四個車門上各一塊目的地 LED
  px(c, 'rgba(0,0,0,0.35)', 0, TRAIN.y1 * T - 2, W * T, 4);
  px(c, '#d6dae2', 0, TRAIN.y0 * T, W * T, (TRAIN.y1 - TRAIN.y0) * T);
  px(c, '#eef1f6', 0, TRAIN.y0 * T, W * T, 4);
  px(c, '#d72d2d', 0, (TRAIN.y1 - 1.4) * T, W * T, 4);
  for (let x = 1; x < W - 1; x += 3) {
    if (GATES.some((g) => Math.abs(x + 1 - g.x) < 3)) continue;
    px(c, '#28324a', x * T, (TRAIN.y0 + 1) * T, 2 * T, 1.4 * T);
    px(c, '#4a6a9a', x * T, (TRAIN.y0 + 1) * T, 2 * T, 3);
  }
  GATES.forEach((g, i) => {
    const near = gateIndex.value === i;
    const dx = (g.x - 1.2) * T;
    // 車門（站在前面就打開）
    px(c, '#9aa0ab', dx - 2, (TRAIN.y0 + 0.8) * T, 2.4 * T + 4, (TRAIN.y1 - TRAIN.y0 - 0.8) * T);
    const open = near ? 8 : 0;
    px(c, '#c9ced8', dx - open, (TRAIN.y0 + 0.9) * T, 1.2 * T, (TRAIN.y1 - TRAIN.y0 - 0.9) * T);
    px(c, '#c9ced8', dx + 1.2 * T + open, (TRAIN.y0 + 0.9) * T, 1.2 * T, (TRAIN.y1 - TRAIN.y0 - 0.9) * T);
    px(c, '#28324a', dx + 3 - open, (TRAIN.y0 + 1.2) * T, 1.2 * T - 6, T);
    px(c, '#28324a', dx + 1.2 * T + 3 + open, (TRAIN.y0 + 1.2) * T, 1.2 * T - 6, T);
    // 門上方的 LED 色條，會流動
    for (let k = 0; k < 8; k += 1) {
      const on = (k + Math.floor(seconds * 6)) % 8 < 5;
      px(c, on ? g.color : '#3a2a20', dx + k * 5, TRAIN.y0 * T + 4, 4, 3);
    }
  });
}

function drawBench(c: CanvasRenderingContext2D, bx: number): void {
  const x = (bx - 1.6) * T;
  const y = 10.5 * T;
  px(c, 'rgba(0,0,0,0.2)', x + 2, y + 9, 3.2 * T, 3);
  px(c, '#5a5e70', x + 3, y + 4, 2, 6);
  px(c, '#5a5e70', x + 3.2 * T - 5, y + 4, 2, 6);
  px(c, '#2f80d0', x, y - 4, 3.2 * T, 8);
  px(c, '#5aa3e8', x, y - 4, 3.2 * T, 2);
}

function drawPillar(c: CanvasRenderingContext2D, x: number): void {
  px(c, 'rgba(0,0,0,0.2)', x * T - 6, 9.6 * T, 14, 3);
  px(c, '#b8b3a8', x * T - 6, 6 * T, 12, 3.6 * T);
  px(c, '#d6d1c6', x * T - 6, 6 * T, 3, 3.6 * T);
}

function drawSeated(c: CanvasRenderingContext2D, i: number, seconds: number): void {
  const spot = SEAT_SPOTS[i];
  if (!spot) return;
  const state = seatState(i);
  const occupied = state === 'mate' || state === 'taken' || (state === 'me' && seatedIndex === i);
  const x = Math.round(spot.x * T);
  const y = Math.round(spot.y * T);
  if (state === 'me' && seatedIndex !== i) {
    c.fillStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(seconds * 3) * 0.15})`;
    c.fillRect(x - 7, y + 6, 14, 2);
  }
  if (!occupied) return;
  const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
  const colors = state === 'me' ? lookColors(prefs.value.hair, prefs.value.shirt, prefs.value) : mate ? readerColors(mate) : { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };
  const sprite = getAvatarFrame(colors, 'down', 'idle');
  c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y + 2 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
}

function drawPerson(c: CanvasRenderingContext2D, x: number, y: number, colors: ReturnType<typeof lookColors>, facing: 'up' | 'down' | 'left' | 'right', moving: boolean, clock: number): void {
  const frame = moving ? (Math.floor(clock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  px(c, 'rgba(0,0,0,0.18)', Math.round(x * T - 5), Math.round(y * T + 3), 10, 2);
  c.drawImage(getAvatarFrame(colors, facing, frame), Math.round(x * T - AVATAR_SIZE.w / 2), Math.round(y * T + 5 - AVATAR_SIZE.h));
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
  // 月台很寬：電腦版也用 2 倍，列車、車門、長椅才看得到全貌
  const scale = cssW >= 1500 ? 3 : 2;
  const follow = (size: number, world: number, at: number) => (world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - at)));
  const ox = Math.round(follow(cssW, W * T * scale, me.x * T * scale) * dpr) / dpr;
  // 鏡頭往上偏一點：上面的列車和車門比下面的看板重要
  // 左上角有一排按鈕（全螢幕、我的家、好友）：地圖最上緣可以再往下捲一點，車站、車門才不會被蓋住
  const TOP_PAD = 52;
  const followY = (size: number, world: number, at: number) => (world <= size - TOP_PAD ? (size - world + TOP_PAD) / 2 : Math.min(TOP_PAD, Math.max(size - world, size / 2 - at)));
  const oy = Math.round(followY(cssH, H * T * scale, (me.y - 4) * T * scale) * dpr) / dpr;
  Object.assign(view, { scale, ox, oy });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  if (ground) ctx.drawImage(ground, 0, 0);
  const c = ctx;
  drawTrain(c, seconds);
  const items: { y: number; draw: () => void }[] = [];
  PILLARS.forEach((p) => items.push({ y: 9.6, draw: () => drawPillar(c, p) }));
  BENCHES.forEach((b) => items.push({ y: 10.8, draw: () => drawBench(c, b) }));
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y + 0.4, draw: () => drawSeated(c, i, seconds) }));
  if (seatedIndex === null) items.push({ y: me.y + 0.35, draw: () => drawPerson(c, me.x, me.y, lookColors(prefs.value.hair, prefs.value.shirt, prefs.value), me.facing, me.moving, me.walkClock) });
  for (const other of shownRemotes) items.push({ y: other.y + 0.35, draw: () => drawPerson(c, other.x, other.y, remoteColors(other.remote), other.remote.facing, other.remote.moving, seconds) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  for (const g of GATES) {
    const p = screen(g.x, PLATFORM_Y + 0.2);
    pill(ctx, `${g.to === 'f1' ? '🏁' : '🏆'} ${gateLabel(g.to)}`, p.x, p.y, g.color);
  }
  const ep = screen((EXIT.x0 + EXIT.x1) / 2, EXIT.y0 - 0.3);
  pill(ctx, t.value.f1.stationName, ep.x, ep.y, '#fbbf24');
  const sp = screen(21, 9.4);
  pill(ctx, t.value.f1Hub.benches, sp.x, sp.y, '#2dd4bf');
  const mp = screen(me.x, me.y - 1);
  if (seatedIndex === null) pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
  for (const other of shownRemotes) {
    const op = screen(other.x, other.y - 1);
    pill(ctx, remoteLabel(other), op.x, op.y, '#2dd4bf');
  }
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
  updateWalk(dt);
  shownRemotes = viewRemotes(props.remotePlayers, 'f1hub', dt);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  rememberScene('f1hub', positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: 'f1hub' }
      : { x: r2(me.x), y: r2(me.y), facing: me.facing, moving: me.moving, scene: 'f1hub' },
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
    if (openGate.value) emit('go', openGate.value.to);
    else if (exitOpen.value) emit('leave');
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

// 點車門：走過去；點長椅座位：走過去坐
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
  const gate = GATES.findIndex((g) => Math.abs(x - g.x) < 1.5 && y < PLATFORM_Y + 1);
  if (gate >= 0) {
    const g = GATES[gate];
    if (g) {
      if (seatedIndex !== null) standUp();
      walkToPoint(g.x, PLATFORM_Y + 1.4);
    }
    return;
  }
  const seat = pickSeatSpot(SEAT_SPOTS, x, y, (i) => seatState(i) === 'empty');
  if (seat >= 0 && seatState(seat) === 'empty') {
    if (seatedIndex !== null) standUp();
    walkTarget = seat;
  }
}

// 點車門：直直走過去（月台空曠，不用找路）
let walkTimer = 0;
function walkToPoint(tx: number, ty: number): void {
  window.clearInterval(walkTimer);
  walkTimer = window.setInterval(() => {
    const dx = tx - me.x;
    const dy = ty - me.y;
    if (Math.hypot(dx, dy) < 0.25 || keys.size || stick.x || stick.y) {
      window.clearInterval(walkTimer);
      keys.clear();
      return;
    }
    keys.clear();
    if (Math.abs(dx) > 0.2) keys.add(dx > 0 ? 'right' : 'left');
    if (Math.abs(dy) > 0.2) keys.add(dy > 0 ? 'down' : 'up');
  }, 60);
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
  // 從賽道回來：站在那條賽道的車門前（不跳面板，走開再回來才會）；分享連結：站到朋友旁邊；坐過長椅就坐回去
  const arrival = takeArrival('f1hub');
  const mine = props.seats.findIndex((s) => s.id === props.selectedSeatId);
  const from = GATES.find((g) => g.to === props.from);
  if (arrival) {
    const spot = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].map(([dx = 0, dy = 0]) => ({ x: arrival.x + dx, y: arrival.y + dy })).find((p) => !blocked(p.x, p.y));
    if (spot) {
      me.x = spot.x;
      me.y = spot.y;
    }
  } else if (mine >= 0) sitAt(mine);
  else if (from) {
    me.x = from.x;
    me.y = PLATFORM_Y + 2.4;
    me.facing = 'down';
  } else {
    // 從圖書館搭下來：站在出口樓梯前
    me.x = EXIT.trigger.x - 1.5;
    me.y = EXIT.trigger.y;
  }
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
  window.clearInterval(walkTimer);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', clearKeys);
});
</script>
