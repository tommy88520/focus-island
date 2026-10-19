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
import { px, pillTextWidth, fillPillText, canvasDpr, drawLayer, layerCanvas } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';
import { CIRCUITS } from 'src/pages/index/pixel/circuits';
import {
  drawBins,
  drawDepartureBoard,
  drawEscalator,
  drawExitSign,
  drawHubBenchBack,
  drawHubBenchSeat,
  drawHubPillar,
  drawHubTrain,
  drawPlant,
  drawScreenDoors,
  drawVending,
  paintHubGround,
  type HubLayout,
} from 'src/pages/index/pixel/hubArt';

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

// ── 場地（格，1 格 = 16px）：上面是列車和月台門，中間是月台，下面一排牆上海報，右下角是出口 ──
const T = 16;
const W = 44;
const H = 21;
const TRAIN_Y0 = 0.4;
const PLATFORM_Y = 5.6;
const WALL_Y = 16.8;
// 四個車門：各去一條賽道（顏色是那條賽道的代表色）
const GATES: { x: number; to: HubDestination; color: string }[] = [
  { x: 7, to: 'f1', color: '#f6c945' },
  { x: 17, to: 'gptpe', color: '#ff3b5c' },
  { x: 27, to: 'gptxg', color: '#ff8a3b' },
  { x: 37, to: 'gpkhh', color: '#ff3b8a' },
];
const EXIT = { x0: 39, y0: 12.8, x1: 43.5, y1: 16.4, trigger: { x: 41, y: 12 } };
// 柱子在車門之間；長椅靠著柱子（三張、各坐兩個人，順序 = 座位編號）
const PILLARS = [2, 12, 22, 32, 42];
const PILLAR_BASE = 8.6;
const BENCHES = [12, 22, 32];
const SEAT_Y = 11;
const SEAT_SPOTS = BENCHES.flatMap((bx) => [
  { x: bx - 0.75, y: SEAT_Y },
  { x: bx + 0.75, y: SEAT_Y },
]);
const BOARD_RECT = { x0: 4.4, x1: 10.6, base: 14.2 };
const VENDING = [
  { x: 0.7, body: '#c62828' },
  { x: 2.3, body: '#1e5fbf' },
];
const VENDING_BASE = 14.2;
const PLANTS = [
  { x: 14.5, y: 11.3 },
  { x: 34.5, y: 11.3 },
  { x: 19.5, y: 15.6 },
  { x: 29.5, y: 15.6 },
];
const BINS = { x: 24.1, y: 11.3 };

function gateLabel(to: HubDestination): string {
  return to === 'f1' ? t.value.f1.title : CIRCUITS[to].title[locale.value];
}

const inRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) => x > x0 && x < x1 && y > y0 && y < y1;
const blocked = (x: number, y: number) =>
  x < 0.5 || x > W - 0.5 || y < PLATFORM_Y + 0.7 || y > WALL_Y - 0.25 ||
  SEAT_SPOTS.some((s) => Math.abs(x - s.x) < 0.45 && Math.abs(y - s.y) < 0.45) ||
  BENCHES.some((b) => inRect(x, y, b - 1.6, SEAT_Y - 0.3, b + 1.6, SEAT_Y + 0.25)) ||
  PILLARS.some((p) => inRect(x, y, p - 0.55, PILLAR_BASE - 0.7, p + 0.55, PILLAR_BASE + 0.1)) ||
  inRect(x, y, BOARD_RECT.x0, BOARD_RECT.base - 0.6, BOARD_RECT.x1, BOARD_RECT.base + 0.1) ||
  inRect(x, y, 0.5, VENDING_BASE - 0.7, 3.8, VENDING_BASE + 0.1) ||
  PLANTS.some((pl) => inRect(x, y, pl.x - 0.5, pl.y - 0.5, pl.x + 0.5, pl.y + 0.1)) ||
  inRect(x, y, BINS.x - 0.1, BINS.y - 0.5, BINS.x + 1.2, BINS.y + 0.1) ||
  inRect(x, y, EXIT.x0, EXIT.y0, EXIT.x1, EXIT.y1);

// 給美術用的配置（名字跟著語言）
const hubLayout = (): HubLayout => ({
  W,
  H,
  trainY0: TRAIN_Y0,
  platformY: PLATFORM_Y,
  wallY: WALL_Y,
  exit: EXIT,
  gates: GATES.map((g) => ({ x: g.x, color: g.color, label: gateLabel(g.to), circuit: g.to === 'f1' ? null : CIRCUITS[g.to] })),
  title: `${t.value.f1Hub.title} · F1 PLATFORM`,
});
let layout = hubLayout();

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
const me = { x: 22, y: 13.5, facing: 'up' as 'up' | 'down' | 'left' | 'right', moving: false, walkClock: 0 };
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
// 底圖用幾倍畫：畫面放大倍數 × 螢幕像素（變了就重畫），招牌的字和線條才清楚
let groundRes = 1;
const view = { scale: 2, ox: 0, oy: 0 };

function paintGround(): HTMLCanvasElement {
  const { canvas, c } = layerCanvas(W * T, H * T, groundRes);
  if (c) paintHubGround(c, layout);
  return canvas;
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
    c.fillRect(x - 7, y + 3, 14, 2);
  }
  if (!occupied) return;
  const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
  const colors = state === 'me' ? lookColors(prefs.value.hair, prefs.value.shirt, prefs.value) : mate ? readerColors(mate) : { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };
  const sprite = getAvatarFrame(colors, 'down', 'idle');
  c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y + 1 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
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
  const dpr = canvasDpr();
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  // 月台很寬：電腦版也用 2 倍，列車、車門、長椅才看得到全貌
  const scale = cssW >= 1500 ? 3 : 2;
  const follow = (size: number, world: number, at: number) => (world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - at)));
  const ox = Math.round(follow(cssW, W * T * scale, me.x * T * scale) * dpr) / dpr;
  // 左上角有一排按鈕：地圖最上緣可以再往下捲一點；鏡頭往上偏一點（上面的列車和車門比下面的海報重要）
  const TOP_PAD = 52;
  const followY = (size: number, world: number, at: number) => (world <= size - TOP_PAD ? (size - world + TOP_PAD) / 2 : Math.min(TOP_PAD, Math.max(size - world, size / 2 - at)));
  const oy = Math.round(followY(cssH, H * T * scale, (me.y - 4) * T * scale) * dpr) / dpr;
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
  drawHubTrain(c, layout, gateIndex.value, seconds);
  drawScreenDoors(c, layout, gateIndex.value, seconds);
  drawEscalator(c, layout, seconds);
  const items: { y: number; draw: () => void }[] = [];
  PILLARS.forEach((p, i) => items.push({ y: PILLAR_BASE, draw: () => drawHubPillar(c, p, PILLAR_BASE, layout.gates[i % layout.gates.length]) }));
  BENCHES.forEach((b) => {
    items.push({ y: SEAT_Y - 0.1, draw: () => drawHubBenchBack(c, b, SEAT_Y) });
    items.push({ y: SEAT_Y + 0.05, draw: () => drawHubBenchSeat(c, b, SEAT_Y) });
  });
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y, draw: () => drawSeated(c, i, seconds) }));
  items.push({ y: BOARD_RECT.base, draw: () => drawDepartureBoard(c, BOARD_RECT.x0, BOARD_RECT.x1, BOARD_RECT.base, layout.gates, t.value.f1Hub.departures, t.value.f1Hub.boarding, seconds) });
  VENDING.forEach((v) => items.push({ y: VENDING_BASE, draw: () => drawVending(c, v.x, VENDING_BASE, v.body) }));
  PLANTS.forEach((pl) => items.push({ y: pl.y, draw: () => drawPlant(c, pl.x, pl.y) }));
  items.push({ y: BINS.y, draw: () => drawBins(c, BINS.x, BINS.y) });
  items.push({ y: EXIT.y0, draw: () => drawExitSign(c, layout) });
  if (seatedIndex === null) items.push({ y: me.y + 0.35, draw: () => drawPerson(c, me.x, me.y, lookColors(prefs.value.hair, prefs.value.shirt, prefs.value), me.facing, me.moving, me.walkClock) });
  for (const other of shownRemotes) items.push({ y: other.y + 0.35, draw: () => drawPerson(c, other.x, other.y, remoteColors(other.remote), other.remote.facing, other.remote.moving, seconds) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  for (const g of GATES) {
    const p = screen(g.x, PLATFORM_Y + 0.85);
    pill(ctx, `${g.to === 'f1' ? '🏁' : '🏆'} ${gateLabel(g.to)}`, p.x, p.y, g.color);
  }
  const ep = screen((EXIT.x0 + EXIT.x1) / 2, (EXIT.y0 + EXIT.y1) / 2 + 0.4);
  pill(ctx, t.value.f1.stationName, ep.x, ep.y, '#fbbf24');
  const sp = screen(22, 9.6);
  if (seatedIndex === null) pill(ctx, t.value.f1Hub.benches, sp.x, sp.y, '#2dd4bf');
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
  layout = hubLayout();
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
    me.y = PLATFORM_Y + 2.9;
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
