<template>
  <div class="relative" :class="{ 'shake-error': isShake }">
    <div
      ref="containerRef"
      class="relative h-[calc(100dvh-350px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#1b1d26] outline-none transition-opacity duration-500 focus-visible:ring-2 focus-visible:ring-amber-400/40 lg:h-[calc(100vh-300px)] lg:min-h-[460px]"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" />

      <button
        type="button"
        class="absolute right-2 top-2 !flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-white shadow-lg ring-1 ring-white/15 transition hover:bg-slate-800"
        :class="{ 'ring-amber-400/70': minimapOpen }"
        :aria-label="t.seatScene.minimap"
        :aria-expanded="minimapOpen"
        :title="t.seatScene.minimap"
        @click="toggleMinimap"
      >
        <q-icon :name="minimapOpen ? 'close' : 'map'" size="18px" />
      </button>
      <!-- 第一次來的新手引導：四步，看完或略過就不再出現 -->
      <div
        v-if="tourStep !== null && !isLoading"
        class="pixel-panel absolute left-1/2 top-3 z-10 w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 p-3"
        role="dialog"
        :aria-label="t.seatScene.tourTitle"
      >
        <p class="!mb-1 font-pixel text-[10px] uppercase text-[color:var(--px-accent-dark)] dark:!text-amber-300">
          {{ t.seatScene.tourTitle }} · {{ tourStep + 1 }}/{{ tourSteps.length }}
        </p>
        <p class="!mb-0 text-sm font-bold leading-snug">{{ tourSteps[tourStep] }}</p>
        <div class="mt-3 !flex !flex-nowrap justify-end gap-2">
          <button type="button" class="pixel-btn h-8 px-3 text-xs" @click="finishTour">{{ t.seatScene.tourSkip }}</button>
          <button type="button" class="pixel-btn pixel-btn--primary h-8 px-3 text-xs" @click="nextTourStep">
            {{ tourStep + 1 < tourSteps.length ? t.seatScene.tourNext : t.seatScene.tourDone }}
          </button>
        </div>
      </div>
      <!-- 騎車時的下車鍵（手機沒有鍵盤） -->
      <button
        v-if="isRiding && !isLoading"
        type="button"
        class="pixel-btn pixel-btn--primary absolute bottom-2 right-2 h-9 px-3 text-xs"
        @click="handleDismountClick"
      >
        {{ t.seatScene.getOff }}
      </button>
      <!-- 打招呼：按鈕或數字鍵 1–4（H 也是揮手）；附近的人會回話 -->
      <div v-if="!isLoading && !isQuietZone && !disabled" class="absolute bottom-2 left-2 !flex !flex-nowrap gap-1.5">
        <button
          v-for="(emote, i) in EMOTE_IDS"
          :key="emote"
          type="button"
          class="pixel-btn h-9 w-9 text-base"
          :title="`${t.seatScene.emotes[emote]} (${i + 1})`"
          :aria-label="t.seatScene.emotes[emote]"
          @click="sendEmote(emote)"
        >
          {{ EMOTE_ICONS[emote] }}
        </button>
      </div>
      <div
        v-if="elevatorOpen"
        class="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-2xl bg-slate-900/90 px-4 py-3 text-center shadow-lg ring-1 ring-amber-400/40"
      >
        <p class="!mb-2 !text-[11px] font-black tracking-wide text-amber-300">{{ t.seatScene.elevatorPrompt }}</p>
        <div class="!flex justify-center gap-2">
          <button
            v-for="floor in elevatorFloors"
            :key="floor"
            type="button"
            class="h-9 min-w-9 rounded-xl px-2 text-xs font-black ring-1 transition"
            :class="
              floor === currentFloor
                ? 'cursor-default bg-amber-400 text-slate-900 ring-amber-300'
                : 'bg-slate-800 text-white ring-white/15 hover:bg-slate-700'
            "
            :disabled="floor === currentFloor"
            @click="rideElevator(floor)"
          >
            {{ floor }}F
          </button>
        </div>
      </div>
      <div v-show="minimapOpen" class="absolute right-2 top-12 rounded-xl bg-slate-900/85 p-2 shadow-lg ring-1 ring-white/15">
        <p class="!mb-1.5 text-center !text-[10px] font-black tracking-wide text-amber-300">
          {{ area === 'beach' ? t.seatScene.areaBeach : zoneName ? `${zoneName} ${currentFloor}F` : t.seatScene.areaLibrary(currentFloor) }}
        </p>
        <canvas ref="minimapRef" class="block cursor-pointer rounded-md" @click="handleMinimapClick" />
      </div>
    </div>

    <p class="mt-1.5 px-2 text-center text-[10px] font-bold leading-snug tracking-wide text-slate-500 dark:!text-white/55">
      {{ isTouch ? t.seatScene.hintTouch : t.seatScene.hintDesktop }}
    </p>

    <div v-if="isLoading" class="pointer-events-none absolute inset-0 flex items-center justify-center px-4">
      <div class="flex flex-col items-center gap-4">
        <div class="h-12 w-12 animate-spin rounded-full border-4 border-amber-400/20 border-t-amber-400"></div>
        <p class="text-[10px] font-black uppercase tracking-[0.4em] text-amber-400/80">
          {{ t.seatGrid.syncingFloor(currentFloor) }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import {
  EMOTE_IDS,
  type EmoteId,
  type MyPosition,
  type Reader,
  type RemotePlayer,
  type SeatEmote,
} from 'src/pages/index/composables/useLibrarySocket';
import type { Seat } from 'src/pages/index/components/SeatGrid.vue';
import { useLocale } from 'src/composables/useLocale';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { createNavigation, type Navigation, type Point } from 'src/pages/index/composables/seatNavigation';
import {
  TILE,
  areaAt,
  createPixelMap,
  elevatorTrigger,
  mapObstacles,
  seatApproach,
  seatCenter,
  sideExitArrival,
  sideExitAt,
  stairTrigger,
  themeForZone,
  vehicleArea,
  type VehicleKind,
  walkBounds,
  type Area,
  type Beachgoer,
  type Facing,
  type PixelMap,
  type PropKind,
  type SeatSlot,
  type StairSpot,
} from 'src/pages/index/pixel/pixelMap';
import {
  AVATAR_SIZE,
  KENNEY_SHEET_URL,
  ARMCHAIR_COLORS,
  POUF_COLORS,
  SEATED_ROWS,
  avatarColorsFor,
  lookColors,
  beachAvatar,
  drawKenney,
  getAvatarFrame,
  loadImage,
  paintCampfire,
  paintCounter,
  paintVehicle,
  paintElevatorDoors,
  paintEscalatorSteps,
  paintFloorLamp,
  paintArmchairBack,
  paintLog,
  paintLounger,
  paintPalm,
  paintPouf,
  paintSandcastle,
  paintStool,
  paintStaticLayer,
  paintSunglasses,
  paintSurfboard,
  paintTowel,
  paintUmbrella,
  paintWaves,
  type AvatarColors,
} from 'src/pages/index/pixel/pixelArt';
import {
  MUSHROOM_POUF,
  NIGHT_TINT,
  TV_GLOW,
  paintAmbient,
  paintCounterTop,
  paintMushroomDots,
  paintStump,
  paintThemedPlant,
  paintThemedTableTop,
} from 'src/pages/index/pixel/pixelThemes';

const props = defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  isShake: boolean;
  isLoading: boolean;
  currentFloor: number;
  // 有哪些樓層可去，用來決定要不要畫上樓／下樓的樓梯
  floors: number[];
  // 目前分區的名稱（靜謐森林、城市咖啡…），小地圖的標題用
  zoneName: string;
  // 這層樓的分區（依序排）：左右牆的出口通往前一個／後一個分區
  zones: { id: string; name: string }[];
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
  // 同房間其他人打的招呼
  remoteEmote: SeatEmote | null;
  // 同房間其他人站著／騎車時的位置
  remotePlayers: Record<string, RemotePlayer>;
  // 有人剛進房：要再送一次自己的位置
  peerJoinedAt: number;
}>();

const emit = defineEmits<{
  select: [seatId: string];
  // 走進樓梯觸發區，要求父層切換到相鄰樓層
  'change-floor': [floor: number];
  // 走出左右牆的出口，要求父層切到隔壁分區
  'change-zone': [zoneId: string];
  // 瀏覽器拿不到 2D canvas 時通知父層退回 2D 座位格子
  'webgl-failed': [];
  // 自己打招呼，父層轉送給同房間的人
  emote: [emote: EmoteId];
  // 自己站著（或騎車）的位置，父層轉送給同房間的人
  position: [position: MyPosition];
}>();

const { t } = useLocale();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const minimapRef = ref<HTMLCanvasElement | null>(null);
const isTouch = ref(false);
const minimapOpen = ref(false);
// 靜謐森林是完全靜音區：不能打招呼，也不顯示別人的表情
const isQuietZone = ref(false);
const isRiding = ref(false);

// ── 新手引導 ──
const TOUR_KEY = 'focus_island_tour_done_v1';
const tourStep = ref<number | null>(null);
const tourSteps = computed(() => (isTouch.value ? t.value.seatScene.tourTouch : t.value.seatScene.tourDesktop));

function finishTour(): void {
  tourStep.value = null;
  try {
    localStorage.setItem(TOUR_KEY, '1');
  } catch {
    // ignore storage errors (e.g. private mode)
  }
  containerRef.value?.focus({ preventScroll: true });
}

function nextTourStep(): void {
  if (tourStep.value === null) return;
  if (tourStep.value + 1 >= tourSteps.value.length) finishTour();
  else tourStep.value += 1;
}
// 走到電梯口會跳出樓層按鈕；走開就收起來
const elevatorOpen = ref(false);
const elevatorFloors = computed(() => [...props.floors].sort((a, b) => a - b));
// 人現在在圖書館還是海灘（小地圖的標題、要不要換泳裝）
const area = ref<Area>('library');

const WALK_SPEED = 4.2;
const PLAYER_RADIUS = 0.28;
const STAIR_RADIUS = 0.6;
const SIT_TWEEN_SECONDS = 0.25;
const SIT_REACH = 1.25;
// 能整張放進畫面就用最大的整數倍；放不下（手機）就固定 2 倍、鏡頭跟著人走
const MIN_SCALE = 2;
const LABEL_FONT_PX = 12;
const COLOR_ME = '#fbbf24';
const COLOR_MATE = '#2dd4bf';
const MINIMAP_WIDTH = 148;
const BEACH_STROLL_SPEED = 1.1;
// 走到海灘就換上海灘褲
const playerPrefs = usePlayerPrefs();
// 自己的外觀跟著設定頁走；到海灘換上海灘褲
const myAvatar = (beach = false): AvatarColors => ({
  ...lookColors(playerPrefs.value.hair, playerPrefs.value.shirt),
  ...(beach ? { outfit: 'trunks' as const } : {}),
});
const MINIMAP_PROP_COLORS: Partial<Record<PropKind, string>> = {
  table: '#8a5e36',
  roundTable: '#8a5e36',
  beanbag: '#c9774f',
  counter: '#c99a63',
  plant: '#4fa35a',
  tallPlant: '#4fa35a',
  palm: '#2f6b3a',
  umbrella: '#f25f5c',
  lounger: '#3e8fd9',
  campfire: '#f6a531',
  log: '#5c3d22',
  surfboard: '#2fb3a6',
  sandcastle: '#d7b36f',
  towel: '#f2a541',
};
const MINIMAP_SEAT_COLORS: Record<SeatState, string> = { empty: '#f8fafc', me: COLOR_ME, mate: COLOR_MATE, taken: '#6b7280' };
const EMOTE_ICONS: Record<EmoteId, string> = { wave: '👋', cheer: '💪', coffee: '☕', thumbs: '👍' };
const EMOTE_COOLDOWN_S = 1.2;
const BUBBLE_SECONDS = 2.6;
// 這個距離（格）內的路人和示範用的假人會回話
const REPLY_RADIUS = 3.5;
const TAKEN_AVATAR: AvatarColors = { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };

type SeatState = 'empty' | 'me' | 'mate' | 'taken';

interface SeatNode {
  seatId: string;
  slot: SeatSlot;
  index: number;
  state: SeatState;
  label: string;
  colors: AvatarColors;
  // 坐在這裡的人正在專注（自己的話就是番茄鐘在跑）
  focusing: boolean;
  // 開了勿擾
  dnd: boolean;
}

interface StairInfo {
  spot: StairSpot;
  target: number;
}

type PlayerState = 'seated' | 'idle' | 'walking' | 'sitting' | 'lying';

const POSITION_KEY = 'focus_island_player_position_v1';
const POSITION_SAVE_INTERVAL_S = 0.5;

interface SavedPosition {
  // 房間 = 座位 id 去掉最後的編號，例如 "2-A"
  room: string;
  x: number;
  y: number;
  facing: Facing;
  seated: boolean;
}

function loadSavedPosition(): SavedPosition | null {
  try {
    const raw = localStorage.getItem(POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedPosition>;
    const facings: Facing[] = ['up', 'down', 'left', 'right'];
    if (typeof parsed.room !== 'string' || !Number.isFinite(parsed.x) || !Number.isFinite(parsed.y)) return null;
    return {
      room: parsed.room,
      x: Number(parsed.x),
      y: Number(parsed.y),
      facing: facings.includes(parsed.facing as Facing) ? (parsed.facing as Facing) : 'down',
      seated: parsed.seated === true,
    };
  } catch {
    return null;
  }
}

const player = {
  state: 'idle' as PlayerState,
  x: 15.5,
  y: 5,
  facing: 'down' as Facing,
  seatId: null as string | null,
  path: [] as Point[],
  goalSeatId: null as string | null,
  sitFrom: { x: 0, y: 0 },
  sitTo: { x: 0, y: 0 },
  sitSeatId: '',
  sitElapsed: 0,
  moving: false,
  walkClock: 0,
};

let ctx: CanvasRenderingContext2D | null = null;
let sheet: HTMLImageElement | null = null;
let map: PixelMap = createPixelMap(0);
let staticLayer: HTMLCanvasElement | null = null;
let seatNodes: SeatNode[] = [];
let stairs: StairInfo[] = [];
let nav: Navigation | null = null;
let stairLock = false;
// 剛從隔壁分區走進來時站在出口旁：要先離開出口才會再觸發
let exitLock = false;
// 剛搭電梯抵達時人就站在電梯口：要先走開再走回來才會再跳出按鈕
let elevatorLock = false;
let elevatorDoor = 0;
let pendingSpawn: { point: { x: number; y: number }; floor: number } | null = null;
// 上次關掉頁面時站在哪：只在這次載入的第一個房間用一次
let savedPosition: SavedPosition | null = loadSavedPosition();
// 這次是從存檔站回原地（不是坐在位子上）：父層自動幫忙保留座位時，不要把人拉回椅子
let restoredStanding = false;
// ── 載具 ──
const VEHICLE_SPEED: Record<VehicleKind, number> = { bike: 7.5, cart: 6.5, boat: 3.4 };
const VEHICLE_REACH = 1.3;
// 騎上去時人坐多高（世界像素）
const RIDE_LIFT: Record<VehicleKind, number> = { bike: 7, cart: 6, boat: 4 };

interface VehicleState {
  kind: VehicleKind;
  x: number;
  y: number;
  facing: Facing;
  // 小船會滑：速度慢慢跟上方向鍵
  vx: number;
  vy: number;
}

// ── 沙灘上可以躺的地方：沒有路人躺著的躺椅和海灘巾 ──
interface LieSpot {
  // 躺下時腳的位置（格）
  x: number;
  y: number;
  // lie：沙灘上平躺曬太陽；sink：窩在室內的懶骨頭裡
  pose: 'lie' | 'sink';
  // 點這個範圍算點到它
  rect: { x0: number; x1: number; y0: number; y1: number };
}
const LIE_REACH = 1.6;
let lieSpots: LieSpot[] = [];
let goalLie: LieSpot | null = null;
let lyingOn: LieSpot | null = null;

let vehicles: VehicleState[] = [];
let riding: VehicleState | null = null;
let goalVehicle: VehicleState | null = null;

// ── 同房間其他人的位置 ──
const POS_SEND_INTERVAL_S = 0.15;
const POS_KEEPALIVE_S = 20;
// 這麼久沒收到位置就當作人走了
const REMOTE_STALE_MS = 45_000;
// 畫面上的位置慢慢追上收到的位置，看起來才不會一格一格跳
const remoteShown = new Map<string, { x: number; y: number }>();
let lastPosSentAt = -Infinity;
let lastPosKey = '';

// 頭上的對話泡泡：key 是 me、seat:<座位 id>、npc:<路人編號>
const bubbles = new Map<string, { text: string; from: number; until: number }>();
let lastEmoteAt = -Infinity;
let lastSavedAt = 0;
let lastSavedKey = '';
let hoveredSeatId: string | null = null;
let nearSeatId: string | null = null;
let rafId = 0;
let lastFrameTime = 0;
let isVisible = true;
let dark = true;
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let themeObserver: MutationObserver | null = null;
const keys = new Set<string>();
// 目前的視角：世界像素放大幾倍、以及世界原點在畫布上的位置（CSS px）
const view = { scale: MIN_SCALE, ox: 0, oy: 0, cssW: 0, cssH: 0, dpr: 1 };

// ── 地圖與座位 ──

// 左右隔壁的分區
function neighborZones(): { left?: { id: string; name: string }; right?: { id: string; name: string } } {
  const current = currentRoom().split('-')[1] ?? '';
  const index = props.zones.findIndex((z) => z.id === current);
  if (index < 0) return {};
  const left = props.zones[index - 1];
  const right = props.zones[index + 1];
  return { ...(left ? { left } : {}), ...(right ? { right } : {}) };
}

// 分區清單晚到時，左右出口要不要開會跟著變
function sideExitsChanged(): boolean {
  const n = neighborZones();
  return !!map.sideExits.left !== !!n.left || !!map.sideExits.right !== !!n.right;
}

// 最低的樓層直接開門就是海灘；樓上的出口換成往下的手扶梯
function hasEscalator(): boolean {
  const lowest = props.floors.length > 0 ? Math.min(...props.floors) : 1;
  return props.currentFloor > lowest;
}

function buildMap(): void {
  // 分區決定主題：A 森林、B 咖啡店、C 深海艙、D 圖書館
  const neighbors = neighborZones();
  map = createPixelMap(props.seats.length, hasEscalator(), themeForZone(currentRoom().split('-')[1] ?? ''), {
    left: !!neighbors.left,
    right: !!neighbors.right,
  });
  isQuietZone.value = map.theme === 'forest';
  vehicles = map.vehicles.map((spot) => ({ ...spot, vx: 0, vy: 0 }));
  lieSpots = map.props.flatMap((prop) => {
    if (prop.kind !== 'lounger' && prop.kind !== 'towel' && prop.kind !== 'beanbag') return [];
    const spot: LieSpot =
      prop.kind === 'beanbag'
        ? { x: prop.tx + 0.5, y: prop.ty + 0.8, pose: 'sink', rect: { x0: prop.tx, x1: prop.tx + 1, y0: prop.ty - 0.5, y1: prop.ty + 1 } }
        : prop.kind === 'lounger'
          ? { x: prop.tx + 0.5, y: prop.ty + 1.5, pose: 'lie', rect: { x0: prop.tx, x1: prop.tx + 1, y0: prop.ty, y1: prop.ty + 2 } }
          : { x: prop.tx + 0.25, y: prop.ty + 1.4, pose: 'lie', rect: { x0: prop.tx - 0.25, x1: prop.tx + 0.75, y0: prop.ty, y1: prop.ty + 1.7 } };
    // 已經有路人躺著的就不給躺
    const taken = map.beachgoers.some((g) => g.pose === 'lie' && Math.hypot(g.x - spot.x, g.y - spot.y) < 0.8);
    return taken ? [] : [spot];
  });
  goalLie = null;
  lyingOn = null;
  riding = null;
  isRiding.value = false;
  goalVehicle = null;
  seatNodes = props.seats.flatMap((seat, index) => {
    const slot = map.seats[index];
    return slot ? [{ seatId: seat.id, slot, index, state: 'empty' as SeatState, label: '', colors: TAKEN_AVATAR, focusing: false, dnd: false }] : [];
  });
  rebuildStairs();
  buildNavigation();
  paintStatic();
}

function rebuildMap(): void {
  buildMap();
  spawnPlayer();
  syncSeatStates();
}

function rebuildStairs(): void {
  stairs = [];
  if (props.floors.includes(props.currentFloor - 1)) stairs.push({ spot: map.stairs.down, target: props.currentFloor - 1 });
  if (props.floors.includes(props.currentFloor + 1)) stairs.push({ spot: map.stairs.up, target: props.currentFloor + 1 });
}

function buildNavigation(): void {
  nav = createNavigation(walkBounds(map), mapObstacles(map), PLAYER_RADIUS);
}

function paintStatic(): void {
  const canvas = document.createElement('canvas');
  canvas.width = map.width * TILE;
  canvas.height = map.height * TILE;
  const layer = canvas.getContext('2d');
  if (layer) paintStaticLayer(layer, map);
  staticLayer = canvas;
}

function syncSeatStates(): void {
  for (const node of seatNodes) {
    const seat = props.seats[node.index];
    if (!seat) continue;
    node.seatId = seat.id;
    const mate = props.getMateAtSeat(seat.id);
    let state: SeatState = 'empty';
    if (props.selectedSeatId === seat.id) state = 'me';
    else if (mate) state = 'mate';
    else if (!seat.available) state = 'taken';
    node.state = state;
    node.focusing = state === 'me' ? props.disabled : state === 'mate' && mate?.state === '專注';
    node.dnd = state === 'me' ? playerPrefs.value.doNotDisturb : state === 'mate' && mate?.dnd === true;
    if (state === 'me') {
      node.label = t.value.common.meLabel;
      node.colors = myAvatar();
    } else if (state === 'mate' && mate) {
      node.label = mate.displayName;
      node.colors = mate.hair !== undefined && mate.shirt !== undefined ? lookColors(mate.hair, mate.shirt) : avatarColorsFor(mate.displayName);
    } else {
      node.label = '';
      node.colors = TAKEN_AVATAR;
    }
  }
}

// ── 玩家移動（跟 3D 版同一套規則） ──

function insideStairZone(x: number, y: number): StairInfo | undefined {
  return stairs.find((stair) => {
    const trigger = stairTrigger(stair.spot);
    return Math.hypot(x - trigger.x, y - trigger.y) < STAIR_RADIUS;
  });
}

function insideElevatorZone(x: number, y: number): boolean {
  if (props.floors.length < 2) return false;
  const trigger = elevatorTrigger(map);
  return Math.hypot(x - trigger.x, y - trigger.y) < STAIR_RADIUS;
}

function rideElevator(floor: number): void {
  elevatorOpen.value = false;
  containerRef.value?.focus({ preventScroll: true });
  if (floor === props.currentFloor || !canInteract()) return;
  const trigger = elevatorTrigger(map);
  pendingSpawn = { point: { x: trigger.x, y: trigger.y + 0.2 }, floor };
  savedPosition = null;
  restoredStanding = false;
  emit('change-floor', floor);
}

function placePlayer(x: number, y: number): void {
  player.x = x;
  player.y = y;
  player.path = [];
  player.goalSeatId = null;
  player.moving = false;
}

function snapToSeat(node: SeatNode): void {
  restoredStanding = false;
  const c = seatCenter(node.slot);
  placePlayer(c.x, c.y);
  player.facing = node.slot.facing;
  player.state = 'seated';
  player.seatId = node.seatId;
}

function currentRoom(): string {
  const first = props.seats[0]?.id ?? '';
  return first.slice(0, first.lastIndexOf('-'));
}

// 存目前位置：走路時每 0.5 秒一次，位置沒變就不寫
function savePosition(seconds: number, force = false): void {
  const room = currentRoom();
  if (!room || props.isLoading || player.state === 'sitting') return;
  if (!force && seconds - lastSavedAt < POSITION_SAVE_INTERVAL_S) return;
  lastSavedAt = seconds;
  const payload: SavedPosition = {
    room,
    x: Math.round(player.x * 100) / 100,
    y: Math.round(player.y * 100) / 100,
    facing: player.facing,
    seated: player.state === 'seated',
  };
  const key = JSON.stringify(payload);
  if (key === lastSavedKey) return;
  lastSavedKey = key;
  try {
    localStorage.setItem(POSITION_KEY, key);
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

function handlePageHide(): void {
  savePosition(performance.now() / 1000, true);
}

// 上次是站著離開、而且就是這個房間：站回原地（擋到東西就挪到最近的空地）
function restoreStanding(): boolean {
  const saved = savedPosition;
  if (!saved || saved.seated || saved.room !== currentRoom() || !nav) return false;
  const spot = nav.isBlocked(saved.x, saved.y) ? nav.nearestFree({ x: saved.x, z: saved.y }) : { x: saved.x, z: saved.y };
  if (!spot) return false;
  placePlayer(spot.x, spot.z);
  player.facing = saved.facing;
  player.state = 'idle';
  player.seatId = null;
  restoredStanding = true;
  return true;
}

function spawnPlayer(): void {
  const mine = seatNodes.find((n) => n.seatId === props.selectedSeatId);
  if (!pendingSpawn && restoreStanding()) {
    // 站回上次的位置
  } else if (mine) {
    snapToSeat(mine);
  } else if (pendingSpawn && pendingSpawn.floor === props.currentFloor) {
    // 換樓層後座位資料會陸續到齊、地圖會重建不只一次，所以這裡不清掉，等載入完成才清
    placePlayer(pendingSpawn.point.x, pendingSpawn.point.y);
    player.state = 'idle';
    player.seatId = null;
  } else {
    placePlayer(16, 5.2);
    player.state = 'idle';
    player.seatId = null;
  }
  stairLock = insideStairZone(player.x, player.y) !== undefined;
  exitLock = sideExitAt(map, player.x, player.y) !== null;
  elevatorLock = insideElevatorZone(player.x, player.y);
  elevatorOpen.value = false;
}

// 站起來：座位在伺服器端仍保留，所以只是人離開椅子，站到椅子後方
function standUp(): void {
  const node = seatNodes.find((n) => n.seatId === player.seatId);
  if (node) {
    const approach = seatApproach(node.slot);
    placePlayer(approach.x, approach.y);
  } else {
    player.path = [];
  }
  player.state = 'idle';
  player.seatId = null;
  syncSeatStates();
}

function canInteract(): boolean {
  return !props.disabled && !props.isLoading && nav !== null;
}

function sitCandidate(node: SeatNode | undefined): node is SeatNode {
  if (!node) return false;
  const seat = props.seats[node.index];
  if (!seat || !seat.available) return false;
  return !props.getMateAtSeat(node.seatId);
}

function findPath(to: { x: number; y: number }): Point[] | null {
  if (!nav) return null;
  return nav.findPath({ x: player.x, z: player.y }, { x: to.x, z: to.y });
}

// 現在這一步能不能站（騎車時要待在那台車能去的範圍裡）
function canOccupy(x: number, y: number): boolean {
  if (!riding) return nav ? !nav.isBlocked(x, y) : false;
  const area = vehicleArea(map, riding.kind);
  if (x < area.xMin || x > area.xMax || y < area.yMin || y > area.yMax) return false;
  return riding.kind === 'boat' || (nav ? !nav.isBlocked(x, y) : false);
}

function nearestVehicle(): VehicleState | undefined {
  let best: VehicleState | undefined;
  let bestDist = VEHICLE_REACH;
  for (const v of vehicles) {
    const dist = Math.hypot(v.x - player.x, v.y - player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = v;
    }
  }
  return best;
}

function mount(v: VehicleState): void {
  if (player.state === 'seated') standUp();
  riding = v;
  isRiding.value = true;
  goalVehicle = null;
  placePlayer(v.x, v.y);
  player.facing = v.facing;
  player.state = 'idle';
}

// 下車：腳踏車、海灘車就地下來；小船要靠岸才能下
function dismount(): boolean {
  const v = riding;
  if (!v || !nav) return true;
  const shoreY = map.beach.seaTop + 0.35;
  if (v.kind === 'boat' && v.y > map.beach.seaTop + 1.6) {
    say('me', t.value.seatScene.boatTooFar);
    return false;
  }
  const spot = nav.nearestFree(v.kind === 'boat' ? { x: v.x, z: shoreY } : { x: v.x, z: v.y + 0.5 });
  if (!spot) return false;
  riding = null;
  isRiding.value = false;
  v.vx = 0;
  v.vy = 0;
  placePlayer(spot.x, spot.z);
  player.state = 'idle';
  return true;
}

function handleDismountClick(): void {
  containerRef.value?.focus({ preventScroll: true });
  dismount();
}

function nearestLieSpot(): LieSpot | undefined {
  let best: LieSpot | undefined;
  let bestDist = LIE_REACH;
  for (const spot of lieSpots) {
    const dist = Math.hypot(spot.x - player.x, spot.y - player.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = spot;
    }
  }
  return best;
}

function lieDown(spot: LieSpot): void {
  if (player.state === 'seated') standUp();
  goalLie = null;
  lyingOn = spot;
  placePlayer(spot.x, spot.y);
  player.facing = 'down';
  player.state = 'lying';
}

// 起身：站到躺椅旁邊最近的空地
function getUp(): void {
  const spot = lyingOn;
  lyingOn = null;
  const free = spot && nav ? nav.nearestFree({ x: spot.x + 0.9, z: spot.y }) : null;
  if (free) placePlayer(free.x, free.z);
  player.state = 'idle';
}

function walkToLie(spot: LieSpot): void {
  if (riding && !dismount()) return;
  if (Math.hypot(spot.x - player.x, spot.y - player.y) < LIE_REACH) {
    lieDown(spot);
    return;
  }
  walkToPoint({ x: spot.x + 0.9, y: spot.y });
  goalLie = spot;
}

function pickLieSpot(point: { x: number; y: number }): LieSpot | undefined {
  return lieSpots.find((s) => point.x >= s.rect.x0 && point.x <= s.rect.x1 && point.y >= s.rect.y0 && point.y <= s.rect.y1);
}

function pickVehicle(point: { x: number; y: number }): VehicleState | undefined {
  return vehicles.find((v) => v !== riding && Math.abs(point.x - v.x) < 0.9 && point.y > v.y - 1.4 && point.y < v.y + 0.5);
}

function walkToVehicle(v: VehicleState): void {
  if (riding && !dismount()) return;
  if (Math.hypot(v.x - player.x, v.y - player.y) < VEHICLE_REACH) {
    mount(v);
    return;
  }
  walkToPoint({ x: v.x, y: v.kind === 'boat' ? map.beach.seaTop + 0.5 : v.y + 0.3 });
  goalVehicle = v;
}

function walkToSeat(node: SeatNode): void {
  if (!sitCandidate(node) || player.state === 'sitting') return;
  if (riding && !dismount()) return;
  if (player.state === 'seated') {
    if (player.seatId === node.seatId) return;
    standUp();
  }
  const path = findPath(seatApproach(node.slot));
  if (!path) return;
  player.path = path.slice(1);
  player.goalSeatId = node.seatId;
  player.state = 'walking';
}

function walkToPoint(target: { x: number; y: number }): void {
  if (!nav || player.state === 'sitting') return;
  if (player.state === 'seated') standUp();
  goalVehicle = null;
  goalLie = null;
  if (riding) {
    // 騎車時點到哪就往哪去，但不會離開那台車能去的範圍
    const area = vehicleArea(map, riding.kind);
    const to = { x: Math.min(area.xMax, Math.max(area.xMin, target.x)), y: Math.min(area.yMax, Math.max(area.yMin, target.y)) };
    const route = riding.kind === 'boat' ? [{ x: to.x, z: to.y }] : (findPath(to)?.slice(1) ?? null);
    if (!route) return;
    player.path = route;
    player.goalSeatId = null;
    player.state = 'walking';
    return;
  }
  // 點到海裡或牆外：走到最靠近的邊緣
  const bounds = walkBounds(map);
  const path = findPath({
    x: Math.min(bounds.xMax, Math.max(bounds.xMin, target.x)),
    y: Math.min(bounds.zMax, Math.max(bounds.zMin, target.y)),
  });
  if (!path) return;
  player.path = path.slice(1);
  player.goalSeatId = null;
  player.state = path.length > 1 ? 'walking' : 'idle';
}

function startSit(node: SeatNode): void {
  player.state = 'sitting';
  player.path = [];
  player.goalSeatId = null;
  player.sitFrom = { x: player.x, y: player.y };
  player.sitTo = seatCenter(node.slot);
  player.sitSeatId = node.seatId;
  player.sitElapsed = 0;
  player.facing = node.slot.facing;
}

async function finishSit(): Promise<void> {
  const seatId = player.sitSeatId;
  const node = seatNodes.find((n) => n.seatId === seatId);
  if (!node) {
    player.state = 'idle';
    return;
  }
  snapToSeat(node);
  syncSeatStates();
  if (props.selectedSeatId !== seatId) {
    emit('select', seatId);
    await nextTick();
    // 父層拒絕了這次入座（例如切換太快、座位剛被別人坐走）：退回站立
    if (props.selectedSeatId !== seatId && player.state === 'seated' && player.seatId === seatId) standUp();
  }
}

function nearestSittableSeat(): SeatNode | undefined {
  let best: SeatNode | undefined;
  let bestDist = SIT_REACH;
  for (const node of seatNodes) {
    if (!sitCandidate(node)) continue;
    const approach = seatApproach(node.slot);
    const dist = Math.hypot(player.x - approach.x, player.y - approach.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = node;
    }
  }
  return best;
}

function facingFrom(dx: number, dy: number): Facing {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
  return dy > 0 ? 'down' : 'up';
}

function updatePlayer(dt: number): void {
  const active = canInteract();
  // 躺著時按方向鍵就起身
  if (active && player.state === 'lying' && ['up', 'down', 'left', 'right'].some((k) => keys.has(k))) getUp();

  if (active && (player.state === 'idle' || player.state === 'walking' || player.state === 'seated')) {
    const dx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const dy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (dx !== 0 || dy !== 0) {
      if (player.state === 'seated') standUp();
      player.path = [];
      player.goalSeatId = null;
      player.state = 'idle';
      goalVehicle = null;
      const length = Math.hypot(dx, dy);
      const speed = riding ? VEHICLE_SPEED[riding.kind] : WALK_SPEED;
      if (riding?.kind !== 'boat') {
        const stepX = (dx / length) * speed * dt;
        const stepY = (dy / length) * speed * dt;
        // 分軸移動，貼著牆或桌子時可以順著滑過去
        if (canOccupy(player.x + stepX, player.y)) player.x += stepX;
        if (canOccupy(player.x, player.y + stepY)) player.y += stepY;
        player.facing = facingFrom(dx, dy);
        player.moving = true;
      }
    } else if (player.state === 'walking' && riding?.kind !== 'boat') {
      const next = player.path[0];
      if (!next) {
        player.moving = false;
        const goal = seatNodes.find((n) => n.seatId === player.goalSeatId);
        player.state = 'idle';
        if (goal && sitCandidate(goal)) startSit(goal);
        player.goalSeatId = null;
        if (goalVehicle && Math.hypot(goalVehicle.x - player.x, goalVehicle.y - player.y) < VEHICLE_REACH) mount(goalVehicle);
        goalVehicle = null;
        if (goalLie && Math.hypot(goalLie.x - player.x, goalLie.y - player.y) < LIE_REACH) lieDown(goalLie);
        goalLie = null;
      } else {
        const toX = next.x - player.x;
        const toY = next.z - player.y;
        const dist = Math.hypot(toX, toY);
        const step = (riding ? VEHICLE_SPEED[riding.kind] : WALK_SPEED) * dt;
        const nx = dist <= step ? next.x : player.x + (toX / dist) * step;
        const ny = dist <= step ? next.z : player.y + (toY / dist) * step;
        if (riding && !canOccupy(nx, ny)) {
          // 前面出了這台車能去的範圍：停下來
          player.path = [];
          player.state = 'idle';
        } else {
          player.x = nx;
          player.y = ny;
          if (dist <= step) player.path.shift();
          else player.facing = facingFrom(toX, toY);
        }
        player.moving = true;
      }
    } else if (riding?.kind !== 'boat') {
      player.moving = false;
    }
    if (riding?.kind === 'boat') updateBoat(dt, dx, dy);
  } else if (player.state === 'sitting') {
    player.sitElapsed += dt;
    const t01 = Math.min(1, player.sitElapsed / SIT_TWEEN_SECONDS);
    player.x = player.sitFrom.x + (player.sitTo.x - player.sitFrom.x) * t01;
    player.y = player.sitFrom.y + (player.sitTo.y - player.sitFrom.y) * t01;
    player.moving = false;
    if (t01 >= 1) void finishSit();
  } else {
    player.moving = false;
    // 開始專注（disabled）時還站著：直接回到自己的座位（車子留在原地）
    if (props.disabled && player.state !== 'seated') {
      lyingOn = null;
      riding = null;
      isRiding.value = false;
      const mine = seatNodes.find((n) => n.seatId === props.selectedSeatId);
      if (mine) snapToSeat(mine);
      syncSeatStates();
    }
  }
  if (player.moving) player.walkClock += dt;
  if (riding) {
    riding.x = player.x;
    riding.y = player.y;
    riding.facing = player.facing;
  }

  // 載入中（剛搭到新樓層）不算離開電梯口，鎖要留著
  const inElevatorZone = !riding && player.state !== 'seated' && player.state !== 'sitting' && insideElevatorZone(player.x, player.y);
  if (!inElevatorZone) elevatorLock = false;
  const atElevator = active && inElevatorZone;
  const showElevator = atElevator && !elevatorLock;
  if (showElevator !== elevatorOpen.value) elevatorOpen.value = showElevator;
  // 門：有人站在門口就滑開
  const doorTarget = atElevator ? 1 : 0;
  elevatorDoor += Math.sign(doorTarget - elevatorDoor) * Math.min(Math.abs(doorTarget - elevatorDoor), dt * 3);
  const nowArea = areaAt(map, player.y);
  if (nowArea !== area.value) area.value = nowArea;

  nearSeatId = active && !riding && (player.state === 'idle' || player.state === 'walking') ? (nearestSittableSeat()?.seatId ?? null) : null;

  // 走出左右牆的出口 → 換到隔壁分區，從對面那道出口走進來
  if (active && !riding && (player.state === 'idle' || player.state === 'walking')) {
    const side = sideExitAt(map, player.x, player.y);
    const target = side ? neighborZones()[side] : undefined;
    if (!side) {
      exitLock = false;
    } else if (!exitLock && target) {
      exitLock = true;
      player.path = [];
      player.state = 'idle';
      pendingSpawn = { point: sideExitArrival(map, side === 'left' ? 'right' : 'left'), floor: props.currentFloor };
      savedPosition = null;
      restoredStanding = false;
      emit('change-zone', target.id);
    }
  }

  // 走進樓梯口 → 換樓層
  if (active && !riding && (player.state === 'idle' || player.state === 'walking')) {
    const stair = insideStairZone(player.x, player.y);
    if (!stair) {
      stairLock = false;
    } else if (!stairLock) {
      stairLock = true;
      player.path = [];
      player.state = 'idle';
      // 上樓會從新樓層的「下樓」樓梯口出來，反之亦然
      const arrival = stair.spot.direction === 1 ? map.stairs.down : map.stairs.up;
      const trigger = stairTrigger(arrival);
      pendingSpawn = { point: { x: trigger.x, y: trigger.y + 0.2 }, floor: stair.target };
      savedPosition = null;
      restoredStanding = false;
      emit('change-floor', stair.target);
    }
  }
}

// 小船：速度慢慢跟上方向（放開方向鍵還會滑一段）；點地圖時往目標划
function updateBoat(dt: number, dx: number, dy: number): void {
  const boat = riding;
  if (!boat) return;
  let dirX = dx;
  let dirY = dy;
  const next = player.path[0];
  if (dirX === 0 && dirY === 0 && next) {
    dirX = next.x - player.x;
    dirY = next.z - player.y;
    if (Math.hypot(dirX, dirY) < 0.3) {
      player.path = [];
      player.state = 'idle';
      dirX = 0;
      dirY = 0;
    }
  }
  const length = Math.hypot(dirX, dirY) || 1;
  const speed = VEHICLE_SPEED.boat;
  const ease = Math.min(1, dt * (dirX || dirY ? 2.2 : 0.8));
  boat.vx += ((dirX / length) * speed - boat.vx) * ease;
  boat.vy += ((dirY / length) * speed - boat.vy) * ease;
  if (dirX === 0 && dirY === 0) {
    boat.vx -= boat.vx * ease;
    boat.vy -= boat.vy * ease;
  }
  // 撞到岸邊或地圖邊緣就停在那個方向
  if (canOccupy(player.x + boat.vx * dt, player.y)) player.x += boat.vx * dt;
  else boat.vx = 0;
  if (canOccupy(player.x, player.y + boat.vy * dt)) player.y += boat.vy * dt;
  else boat.vy = 0;
  const v = Math.hypot(boat.vx, boat.vy);
  if (v > 0.4) player.facing = facingFrom(boat.vx, boat.vy);
  player.moving = v > 0.25;
}

// 把自己的位置送出去：走動時最多每 0.15 秒一次，停下來或坐下時再送一次，站著不動每 20 秒補一次
function syncPosition(seconds: number): void {
  if (props.isLoading || !canInteract()) return;
  const hidden = player.state === 'seated' || player.state === 'sitting';
  const pos: MyPosition = {
    x: Math.round(player.x * 100) / 100,
    y: Math.round(player.y * 100) / 100,
    facing: player.facing,
    moving: player.moving,
    ...(riding ? { vehicle: riding.kind } : {}),
    ...(player.state === 'lying' ? { lying: true } : {}),
    ...(hidden ? { hidden: true } : {}),
  };
  const key = hidden ? 'hidden' : JSON.stringify(pos);
  // 坐著的話 key 固定是 hidden，只會送一次
  const due = key !== lastPosKey && (!player.moving || seconds - lastPosSentAt >= POS_SEND_INTERVAL_S);
  const keepalive = !hidden && seconds - lastPosSentAt > POS_KEEPALIVE_S;
  if (!due && !keepalive) return;
  lastPosSentAt = seconds;
  lastPosKey = key;
  emit('position', pos);
}

function updateRemotePlayers(dt: number): void {
  const now = Date.now();
  for (const key of remoteShown.keys()) {
    const remote = props.remotePlayers[key];
    if (!remote || now - remote.at > REMOTE_STALE_MS) remoteShown.delete(key);
  }
  for (const remote of Object.values(props.remotePlayers)) {
    if (now - remote.at > REMOTE_STALE_MS) continue;
    const shown = remoteShown.get(remote.key);
    if (!shown || Math.hypot(remote.x - shown.x, remote.y - shown.y) > 4) {
      remoteShown.set(remote.key, { x: remote.x, y: remote.y });
      continue;
    }
    const ease = Math.min(1, dt * 10);
    shown.x += (remote.x - shown.x) * ease;
    shown.y += (remote.y - shown.y) * ease;
  }
}

function remoteColors(remote: RemotePlayer, y: number): AvatarColors {
  const base = remote.hair !== undefined && remote.shirt !== undefined ? lookColors(remote.hair, remote.shirt) : avatarColorsFor(remote.displayName);
  return areaAt(map, y) === 'beach' ? { ...base, outfit: 'trunks' } : base;
}

function remoteHeadOffset(remote: RemotePlayer): number {
  if (remote.lying) return -21;
  return remote.vehicle ? 5 - RIDE_LIFT[remote.vehicle] - RIDE_ROWS[remote.vehicle] - 1 : -16;
}

function remoteDrawables(seconds: number): Drawable[] {
  const list: Drawable[] = [];
  for (const remote of Object.values(props.remotePlayers)) {
    const shown = remoteShown.get(remote.key);
    if (!shown) continue;
    const footX = shown.x * TILE;
    const footY = shown.y * TILE + 5;
    const colors = remoteColors(remote, shown.y);
    const vehicle = remote.vehicle;
    list.push({
      sortY: shown.y + (remote.lying ? 0.6 : 0.35),
      draw: (c) => {
        if (remote.lying) {
          // 室內就是窩在懶骨頭裡，海灘上是躺著曬太陽
          drawLying(c, colors, footX, shown.y * TILE, areaAt(map, shown.y) === 'library');
          return;
        }
        if (vehicle) {
          const rows = RIDE_ROWS[vehicle];
          paintVehicle(c, vehicle, remote.facing, footX, footY, 'back', seconds, remote.moving);
          c.drawImage(getAvatarFrame(colors, remote.facing, 'idle'), 0, 0, AVATAR_SIZE.w, rows, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - RIDE_LIFT[vehicle] - rows), AVATAR_SIZE.w, rows);
          paintVehicle(c, vehicle, remote.facing, footX, footY, 'front', seconds, remote.moving);
          return;
        }
        const frame = remote.moving ? (Math.floor(seconds / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
        c.fillStyle = 'rgba(0, 0, 0, 0.18)';
        c.fillRect(Math.round(footX - 5), Math.round(footY - 2), 10, 2);
        drawAvatar(c, colors, remote.facing, frame, footX, footY, false);
      },
    });
  }
  return list;
}

// ── 繪製 ──

interface Drawable {
  sortY: number;
  draw: (c: CanvasRenderingContext2D) => void;
}

function updateView(): void {
  const container = containerRef.value;
  const canvas = canvasRef.value;
  if (!container || !canvas) return;
  const cssW = container.clientWidth;
  const cssH = container.clientHeight;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const worldW = map.width * TILE;
  const worldH = map.height * TILE;
  const fit = Math.floor(Math.min(cssW / worldW, cssH / worldH));
  // 桌機畫面夠大就放大到 3 倍，跟 Gather 一樣只看得到人附近、鏡頭跟著走
  const scale = Math.max(cssW >= 900 ? 3 : MIN_SCALE, fit);
  const viewW = worldW * scale;
  const viewH = worldH * scale;
  // 放得下就置中；放不下就讓玩家在畫面中間，但不超出地圖邊緣
  const follow = (size: number, world: number, focus: number) =>
    world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - focus));
  const ox = follow(cssW, viewW, player.x * TILE * scale);
  const oy = follow(cssH, viewH, player.y * TILE * scale);
  // 對齊實體像素，畫面捲動時像素才不會閃
  view.ox = Math.round(ox * dpr) / dpr;
  view.oy = Math.round(oy * dpr) / dpr;
  Object.assign(view, { scale, cssW, cssH, dpr });
}

function drawAvatar(c: CanvasRenderingContext2D, colors: AvatarColors, facing: Facing, frame: 'idle' | 'walkA' | 'walkB', footX: number, footY: number, seated: boolean): void {
  const sprite = getAvatarFrame(colors, facing, frame);
  const rows = seated ? SEATED_ROWS : AVATAR_SIZE.h;
  c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, rows, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - rows), AVATAR_SIZE.w, rows);
}

function seatDrawables(node: SeatNode, seconds: number): Drawable[] {
  const { slot } = node;
  const x = slot.tx * TILE;
  const y = slot.ty * TILE;
  const meSeated = node.state === 'me' && player.state === 'seated' && player.seatId === node.seatId;
  const occupied = node.state === 'mate' || node.state === 'taken' || meSeated;
  const highlighted = (hoveredSeatId === node.seatId || nearSeatId === node.seatId) && node.state === 'empty' && !props.disabled;
  const reservedAway = node.state === 'me' && !meSeated;

  const drawSeat = (c: CanvasRenderingContext2D) => {
    if (!sheet) return;
    if (slot.kind === 'chair') {
      const tile = slot.facing === 'down' ? 'chairDown' : slot.facing === 'up' ? 'chairUp' : slot.facing === 'right' ? 'chairRight' : 'chairLeft';
      drawKenney(c, sheet, tile, x, y);
    } else if (slot.kind === 'stool') {
      if (map.theme === 'forest') paintStump(c, x, y);
      else paintStool(c, x, y);
    } else if (slot.kind === 'pouf') {
      if (map.theme === 'forest') {
        paintPouf(c, x, y, MUSHROOM_POUF);
        paintMushroomDots(c, x, y);
      } else {
        paintPouf(c, x, y, POUF_COLORS[node.index % POUF_COLORS.length] ?? '#c9774f');
      }
    } else {
      paintArmchairBack(c, x, y, ARMCHAIR_COLORS[node.index % ARMCHAIR_COLORS.length] ?? '#b0603f');
    }
  };
  const drawPerson = (c: CanvasRenderingContext2D) => {
    if (!occupied) return;
    const breathe = Math.sin(seconds * 1.6 + node.index) > 0.92 ? 1 : 0;
    const lift = slot.kind === 'pouf' ? 5 : slot.kind === 'armchair' ? 6 : slot.facing === 'up' ? 2 : 4;
    drawAvatar(c, node.colors, slot.facing, 'idle', x + 8, y + TILE - lift + breathe, true);
  };
  const drawGlow = (c: CanvasRenderingContext2D) => {
    if (node.focusing && occupied) {
      // 專注中：座位底下一圈慢慢呼吸的暖光
      const breath = 0.18 + (Math.sin(seconds * 1.4 + node.index) + 1) * 0.08;
      c.fillStyle = `rgba(251, 191, 36, ${breath})`;
      c.fillRect(x - 2, y + TILE - 4, TILE + 4, 4);
      c.fillRect(x - 1, y + TILE - 6, TILE + 2, 2);
    }
    if (!highlighted && !reservedAway) return;
    const pulse = reservedAway ? 0.35 + Math.sin(seconds * 3) * 0.15 : 0.55;
    c.fillStyle = `rgba(251, 191, 36, ${pulse})`;
    c.fillRect(x + 1, y + TILE - 3, TILE - 2, 2);
    c.fillRect(x + 1, y + 1, 2, TILE - 4);
    c.fillRect(x + TILE - 3, y + 1, 2, TILE - 4);
  };

  // 背對鏡頭的座位（面向上）：椅背要蓋在人前面
  const backFacing = slot.facing === 'up';
  return [
    {
      sortY: slot.ty + 1,
      draw: (c) => {
        drawGlow(c);
        if (backFacing) {
          drawPerson(c);
          drawSeat(c);
        } else {
          drawSeat(c);
          drawPerson(c);
        }
      },
    },
  ];
}

function propDrawables(seconds: number): Drawable[] {
  const list: Drawable[] = [];
  for (const prop of map.props) {
    const x = prop.tx * TILE;
    const y = prop.ty * TILE;
    const sortY = prop.ty + prop.h;
    if (prop.kind === 'table') {
      list.push({
        sortY,
        draw: (c) => {
          if (!sheet) return;
          drawKenney(c, sheet, 'tableTopLeft', x, y);
          drawKenney(c, sheet, 'tableTopRight', x + TILE, y);
          drawKenney(c, sheet, 'tableBottomLeft', x, y + TILE);
          drawKenney(c, sheet, 'tableBottomRight', x + TILE, y + TILE);
          if (paintThemedTableTop(c, map.theme, x, y)) return;
          // 桌上：攤開的書 + 一盞小檯燈
          c.fillStyle = '#efe6d2';
          c.fillRect(x + 6, y + 10, 8, 5);
          c.fillStyle = '#c9b89a';
          c.fillRect(x + 10, y + 10, 1, 5);
          c.fillStyle = '#2b2d33';
          c.fillRect(x + 24, y + 9, 2, 5);
          c.fillStyle = '#f6e2b8';
          c.fillRect(x + 22, y + 6, 6, 3);
        },
      });
    } else if (prop.kind === 'roundTable') {
      list.push({
        sortY,
        draw: (c) => {
          if (!sheet) return;
          drawKenney(c, sheet, 'roundTable', x, y);
          c.fillStyle = '#f2efe8';
          c.fillRect(x + 9, y + 5, 3, 3);
          c.fillStyle = '#35604f';
          c.fillRect(x + 4, y + 7, 4, 3);
        },
      });
    } else if (prop.kind === 'counter') {
      list.push({
        sortY: prop.ty + 1,
        draw: (c) => {
          paintCounter(c, x, y, prop.h * TILE);
          paintCounterTop(c, map.theme, x, y, prop.h * TILE);
        },
      });
    } else if (prop.kind === 'plant' || prop.kind === 'tallPlant') {
      list.push({
        sortY,
        draw: (c) => {
          const top = y - (prop.kind === 'tallPlant' ? 4 : 0);
          // 海灘上的盆栽不跟著分區換
          if (prop.ty < map.libraryHeight && paintThemedPlant(c, map.theme, x, top, prop.variant ?? 0)) return;
          if (sheet) drawKenney(c, sheet, prop.variant === 1 ? 'plantB' : 'plantA', x, top);
        },
      });
    } else if (prop.kind === 'floorLamp') {
      list.push({ sortY, draw: (c) => paintFloorLamp(c, x, y) });
    } else if (prop.kind === 'palm') {
      list.push({ sortY, draw: (c) => paintPalm(c, x, y, prop.variant ?? 0) });
    } else if (prop.kind === 'umbrella') {
      list.push({ sortY, draw: (c) => paintUmbrella(c, x, y, prop.tx) });
    } else if (prop.kind === 'lounger') {
      list.push({ sortY, draw: (c) => paintLounger(c, x, y, prop.variant ?? 0) });
    } else if (prop.kind === 'campfire') {
      list.push({ sortY, draw: (c) => paintCampfire(c, x, y, seconds) });
    } else if (prop.kind === 'log') {
      list.push({ sortY, draw: (c) => paintLog(c, x, y) });
    } else if (prop.kind === 'surfboard') {
      list.push({ sortY, draw: (c) => paintSurfboard(c, x, y, prop.variant ?? 0) });
    } else if (prop.kind === 'sandcastle') {
      list.push({ sortY, draw: (c) => paintSandcastle(c, x, y) });
    } else if (prop.kind === 'beanbag') {
      list.push({
        sortY,
        draw: (c) => {
          if (map.theme === 'forest') {
            paintPouf(c, x, y, MUSHROOM_POUF);
            paintMushroomDots(c, x, y);
          } else {
            paintPouf(c, x, y, POUF_COLORS[(prop.variant ?? 0) % POUF_COLORS.length] ?? '#c9774f');
          }
        },
      });
    } else if (prop.kind === 'towel') {
      // 鋪在地上的東西永遠在人腳下
      list.push({ sortY: 0, draw: (c) => paintTowel(c, x, y, prop.variant ?? 0) });
    }
  }
  return list;
}

// 散步的路人此刻走到哪
function beachgoerPose(goer: Beachgoer, seconds: number): { x: number; facing: Facing; frame: 'idle' | 'walkA' | 'walkB' } {
  if (goer.pose !== 'stroll' || goer.strollTo === undefined) return { x: goer.x, facing: goer.facing, frame: 'idle' };
  const span = goer.strollTo - goer.x;
  const lap = (Math.abs(span) / BEACH_STROLL_SPEED) * 2;
  const phase = (seconds % lap) / lap;
  const forward = phase < 0.5;
  return {
    x: goer.x + span * (forward ? phase * 2 : 2 - phase * 2),
    facing: forward === span > 0 ? 'right' : 'left',
    frame: Math.floor(seconds / 0.18) % 2 === 0 ? 'walkA' : 'walkB',
  };
}

// 海灘上的路人：躺著曬太陽、坐在營火邊、站在水邊、沿著岸邊散步
function beachgoerDrawable(goer: Beachgoer, seconds: number): Drawable {
  const colors = beachAvatar(goer.look, goer.outfit);
  const { x, facing, frame } = beachgoerPose(goer, seconds);
  const footX = x * TILE;
  const footY = goer.y * TILE;
  const lying = goer.pose === 'lie';
  return {
    // 躺著的人要蓋在躺椅上面
    sortY: goer.y + (lying ? 0.6 : 0.35),
    draw: (c) => {
      if (goer.pose === 'stand' || goer.pose === 'stroll') {
        c.fillStyle = 'rgba(0, 0, 0, 0.18)';
        c.fillRect(Math.round(footX - 5), Math.round(footY - 2), 10, 2);
      }
      drawAvatar(c, colors, facing, frame, footX, footY, goer.pose === 'sit');
      if (lying) paintSunglasses(c, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - AVATAR_SIZE.h));
    },
  };
}

// 騎車時只畫上半身（腿被車擋住），小船再少一點
const RIDE_ROWS: Record<VehicleKind, number> = { bike: SEATED_ROWS, cart: SEATED_ROWS, boat: 14 };

// 頭頂離腳下幾個世界像素（名牌和泡泡用）
function myHeadOffset(): number {
  if (player.state === 'lying') return -21;
  return riding ? 5 - RIDE_LIFT[riding.kind] - RIDE_ROWS[riding.kind] - 1 : -16;
}

function vehicleDrawable(v: VehicleState, seconds: number): Drawable {
  const footX = v.x * TILE;
  const footY = v.y * TILE + 5;
  return {
    sortY: v.y + 0.35,
    draw: (c) => {
      paintVehicle(c, v.kind, v.facing, footX, footY, 'back', seconds, false);
      paintVehicle(c, v.kind, v.facing, footX, footY, 'front', seconds, false);
    },
  };
}

// 躺著（沙灘，戴墨鏡）或窩在懶骨頭裡（只露上半身，往下陷一點）
function drawLying(c: CanvasRenderingContext2D, colors: AvatarColors, footX: number, footY: number, sink: boolean): void {
  if (sink) {
    drawAvatar(c, colors, 'down', 'idle', footX, footY + 1, true);
    return;
  }
  drawAvatar(c, colors, 'down', 'idle', footX, footY, false);
  paintSunglasses(c, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - AVATAR_SIZE.h));
}

function playerDrawable(seconds: number): Drawable | null {
  if (player.state === 'seated') return null;
  if (player.state === 'lying') {
    const sink = lyingOn?.pose === 'sink';
    return {
      // 要蓋在躺椅／懶骨頭上面
      sortY: player.y + 0.6,
      draw: (c) => drawLying(c, myAvatar(!sink), player.x * TILE, player.y * TILE, sink),
    };
  }
  const frame = player.moving ? (Math.floor(player.walkClock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  const ride = riding;
  if (ride) {
    return {
      sortY: player.y + 0.35,
      draw: (c) => {
        const footX = player.x * TILE;
        const footY = player.y * TILE + 5;
        const rows = RIDE_ROWS[ride.kind];
        paintVehicle(c, ride.kind, player.facing, footX, footY, 'back', seconds, player.moving);
        const sprite = getAvatarFrame(myAvatar(area.value === 'beach'), player.facing, 'idle');
        const bob = player.moving && Math.floor(seconds * 8) % 2 === 0 ? 1 : 0;
        c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, rows, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - RIDE_LIFT[ride.kind] - rows + bob), AVATAR_SIZE.w, rows);
        paintVehicle(c, ride.kind, player.facing, footX, footY, 'front', seconds, player.moving);
      },
    };
  }
  return {
    sortY: player.y + 0.35,
    draw: (c) => {
      // 影子
      c.fillStyle = 'rgba(0, 0, 0, 0.18)';
      c.fillRect(Math.round(player.x * TILE - 5), Math.round(player.y * TILE + 3), 10, 2);
      const colors = myAvatar(area.value === 'beach');
      drawAvatar(c, colors, player.facing, frame, player.x * TILE, player.y * TILE + 5, false);
    },
  };
}

function drawNightLighting(c: CanvasRenderingContext2D, seconds: number): void {
  const w = map.width * TILE;
  const h = map.height * TILE;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = NIGHT_TINT[map.theme];
  c.fillRect(0, 0, w, h);
  c.globalCompositeOperation = 'lighter';
  const glow = (x: number, y: number, r: number, color: string) => {
    const g = c.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(x - r, y - r, r * 2, r * 2);
  };
  for (const prop of map.props) {
    if (prop.kind === 'floorLamp') glow(prop.tx * TILE + 8, prop.ty * TILE - 6, 52, 'rgba(255, 196, 110, 0.38)');
    if (prop.kind === 'table') glow(prop.tx * TILE + 25, prop.ty * TILE + 8, 30, 'rgba(255, 210, 140, 0.3)');
    if (prop.kind === 'campfire') {
      glow(prop.tx * TILE + 8, prop.ty * TILE + 6, 64 + Math.sin(seconds * 9) * 3, `rgba(255, 150, 60, ${0.5 + Math.sin(seconds * 13) * 0.05})`);
    }
  }
  const tvX = (map.tv.tx + map.tv.w / 2) * TILE;
  glow(tvX, TILE * 3, 60, `rgba(${TV_GLOW[map.theme]}, ${0.2 + Math.sin(seconds * 0.8) * 0.03})`);
  for (const [y0, y1] of map.windows) glow(TILE, ((y0 + y1) / 2) * TILE, 40, 'rgba(150, 180, 255, 0.14)');
  c.restore();
}

function drawSunlight(c: CanvasRenderingContext2D): void {
  // 白天：落地窗斜照進來的光塊（深海艙沒有陽光，整間偏冷藍）
  c.save();
  if (map.theme === 'deepsea') {
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = '#cfe2f5';
    c.fillRect(0, 0, map.width * TILE, map.libraryHeight * TILE);
  }
  c.globalCompositeOperation = 'soft-light';
  c.fillStyle = 'rgba(255, 244, 214, 0.55)';
  for (const [y0, y1] of map.theme === 'deepsea' ? [] : map.windows) {
    c.beginPath();
    c.moveTo(TILE, y0 * TILE);
    c.lineTo(TILE, y1 * TILE);
    c.lineTo(TILE * 4, y1 * TILE + TILE * 2);
    c.lineTo(TILE * 4, y0 * TILE + TILE * 2);
    c.closePath();
    c.fill();
  }
  // 海灘：整片曬得暖暖的
  c.fillStyle = 'rgba(255, 232, 150, 0.4)';
  c.fillRect(0, map.libraryHeight * TILE, map.width * TILE, (map.height - map.libraryHeight) * TILE);
  c.restore();
}

// 小地圖：整張地圖縮小，標出座位、目前畫面看到的範圍、自己的位置
function renderMinimap(seconds: number): void {
  const canvas = minimapRef.value;
  if (!minimapOpen.value || !canvas || !staticLayer) return;
  const worldW = map.width * TILE;
  const worldH = map.height * TILE;
  const k = MINIMAP_WIDTH / worldW;
  const cssH = Math.round(worldH * k);
  const { dpr } = view;
  if (canvas.width !== Math.round(MINIMAP_WIDTH * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(MINIMAP_WIDTH * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${MINIMAP_WIDTH}px`;
    canvas.style.height = `${cssH}px`;
  }
  const c = canvas.getContext('2d');
  if (!c) return;
  c.setTransform(dpr * k, 0, 0, dpr * k, 0, 0);
  c.imageSmoothingEnabled = true;
  c.drawImage(staticLayer, 0, 0);
  for (const prop of map.props) {
    const color = MINIMAP_PROP_COLORS[prop.kind];
    if (!color) continue;
    c.fillStyle = color;
    c.fillRect(prop.tx * TILE + 1, prop.ty * TILE + 1, prop.w * TILE - 2, prop.h * TILE - 2);
  }
  if (dark) {
    c.fillStyle = 'rgba(24, 20, 52, 0.35)';
    c.fillRect(0, 0, worldW, worldH);
  }
  for (const node of seatNodes) {
    c.fillStyle = MINIMAP_SEAT_COLORS[node.state];
    c.fillRect(node.slot.tx * TILE + 2, node.slot.ty * TILE + 2, TILE - 4, TILE - 4);
  }
  c.fillStyle = COLOR_MATE;
  for (const shown of remoteShown.values()) {
    c.beginPath();
    c.arc(shown.x * TILE, shown.y * TILE, 3.5 / k, 0, Math.PI * 2);
    c.fill();
  }
  c.fillStyle = '#e25a4a';
  for (const v of vehicles) if (v !== riding) c.fillRect(v.x * TILE - 6, v.y * TILE - 6, 12, 12);
  // 目前主畫面看到的範圍
  const x0 = Math.max(0, -view.ox / view.scale);
  const y0 = Math.max(0, -view.oy / view.scale);
  const x1 = Math.min(worldW, (view.cssW - view.ox) / view.scale);
  const y1 = Math.min(worldH, (view.cssH - view.oy) / view.scale);
  c.lineWidth = 1.5 / k;
  c.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  c.strokeRect(x0 + c.lineWidth / 2, y0 + c.lineWidth / 2, x1 - x0 - c.lineWidth, y1 - y0 - c.lineWidth);
  // 自己：會跳動的點
  const px = player.x * TILE;
  const py = player.y * TILE;
  const pulse = (Math.sin(seconds * 4) + 1) / 2;
  c.fillStyle = `rgba(251, 191, 36, ${0.35 - pulse * 0.2})`;
  c.beginPath();
  c.arc(px, py, (5 + pulse * 4) / k, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.arc(px, py, 4.5 / k, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = COLOR_ME;
  c.beginPath();
  c.arc(px, py, 3 / k, 0, Math.PI * 2);
  c.fill();
}

function drawPill(c: CanvasRenderingContext2D, text: string, cx: number, bottom: number, color: string): void {
  // 🔕／⏳ 不算在名字長度裡
  const label = text.length > 18 ? `${text.slice(0, 18)}…` : text;
  c.font = `700 ${LABEL_FONT_PX}px system-ui, -apple-system, "PingFang TC", sans-serif`;
  const width = Math.ceil(c.measureText(label).width) + 14;
  const height = LABEL_FONT_PX + 8;
  const x = Math.round(cx - width / 2);
  const y = Math.round(bottom - height);
  c.fillStyle = 'rgba(15, 23, 42, 0.86)';
  c.beginPath();
  c.roundRect(x, y, width, height, height / 2);
  c.fill();
  c.strokeStyle = color;
  c.lineWidth = 1.5;
  c.stroke();
  c.fillStyle = '#ffffff';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(label, cx, y + height / 2 + 0.5);
}

// ── 打招呼 ──

function say(key: string, text: string, delay = 0): void {
  const from = performance.now() / 1000 + delay;
  bubbles.set(key, { text, from, until: from + BUBBLE_SECONDS });
}

// 自己頭頂的位置（格）：坐著就是座位
function myPosition(): { x: number; y: number } {
  const node = player.state === 'seated' ? seatNodes.find((n) => n.seatId === player.seatId) : undefined;
  return node ? seatCenter(node.slot) : { x: player.x, y: player.y };
}

function sendEmote(emote: EmoteId): void {
  containerRef.value?.focus({ preventScroll: true });
  const now = performance.now() / 1000;
  if (props.isLoading || isQuietZone.value || props.disabled || now - lastEmoteAt < EMOTE_COOLDOWN_S) return;
  lastEmoteAt = now;
  say('me', `${EMOTE_ICONS[emote]} ${t.value.seatScene.emotes[emote]}`);
  emit('emote', emote);

  // 附近的路人、示範用的假人會回一句（真人要自己回）
  const me = myPosition();
  const reply = t.value.seatScene.emoteReplies[emote];
  let order = 0;
  map.beachgoers.forEach((goer, i) => {
    const { x } = beachgoerPose(goer, now);
    if (Math.hypot(x - me.x, goer.y - me.y) > REPLY_RADIUS) return;
    say(`npc:${i}`, reply, 0.5 + order * 0.35);
    order += 1;
  });
  for (const node of seatNodes) {
    if (node.state !== 'mate' || !props.getMateAtSeat(node.seatId)?.userId.startsWith('demo_')) continue;
    const c = seatCenter(node.slot);
    if (Math.hypot(c.x - me.x, c.y - me.y) > REPLY_RADIUS) continue;
    say(`seat:${node.seatId}`, reply, 0.5 + order * 0.35);
    order += 1;
  }
}

function drawBubble(c: CanvasRenderingContext2D, text: string, cx: number, bottom: number, age: number): void {
  c.font = `700 ${LABEL_FONT_PX + 1}px system-ui, -apple-system, "PingFang TC", sans-serif`;
  const width = Math.ceil(c.measureText(text).width) + 18;
  const height = LABEL_FONT_PX + 13;
  // 冒出來時往上彈一下
  const pop = age < 0.15 ? Math.round((1 - age / 0.15) * 4) : 0;
  const x = Math.round(cx - width / 2);
  const y = Math.round(bottom - height - 6 + pop);
  c.fillStyle = '#3b2a20';
  c.fillRect(x - 2, y - 2, width + 4, height + 4);
  c.fillRect(Math.round(cx) - 4, y + height, 8, 4);
  c.fillRect(Math.round(cx) - 2, y + height + 4, 4, 2);
  c.fillStyle = '#fffaf0';
  c.fillRect(x, y, width, height);
  c.fillRect(Math.round(cx) - 2, y + height, 4, 3);
  c.fillStyle = '#3b2a20';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText(text, cx, y + height / 2 + 1);
}

function drawBubbles(c: CanvasRenderingContext2D, seconds: number, toScreen: (wx: number, wy: number) => { x: number; y: number }): void {
  const now = performance.now() / 1000;
  for (const [key, bubble] of bubbles) {
    if (now > bubble.until) {
      bubbles.delete(key);
      continue;
    }
    if (now < bubble.from) continue;
    let anchor: { x: number; y: number } | null = null;
    if (key === 'me') {
      const node = player.state === 'seated' ? seatNodes.find((n) => n.seatId === player.seatId) : undefined;
      // 名牌上面再高一點
      anchor = node ? toScreen(node.slot.tx * TILE + 8, node.slot.ty * TILE - 6) : toScreen(player.x * TILE, player.y * TILE + myHeadOffset());
      anchor.y -= LABEL_FONT_PX + 10;
    } else if (key.startsWith('seat:')) {
      const node = seatNodes.find((n) => n.seatId === key.slice(5));
      if (node && node.state !== 'empty') {
        anchor = toScreen(node.slot.tx * TILE + 8, node.slot.ty * TILE - 6);
        if (node.label) anchor.y -= LABEL_FONT_PX + 10;
      }
    } else if (key.startsWith('remote:')) {
      const remote = props.remotePlayers[key.slice(7)];
      const shown = remote ? remoteShown.get(remote.key) : undefined;
      if (remote && shown) {
        anchor = toScreen(shown.x * TILE, shown.y * TILE + remoteHeadOffset(remote));
        anchor.y -= LABEL_FONT_PX + 10;
      }
    } else if (key.startsWith('npc:')) {
      const goer = map.beachgoers[Number(key.slice(4))];
      if (goer) anchor = toScreen(beachgoerPose(goer, seconds).x * TILE, goer.y * TILE - AVATAR_SIZE.h - 2);
    }
    if (anchor) drawBubble(c, bubble.text, anchor.x, anchor.y, now - bubble.from);
  }
}

function render(seconds: number): void {
  const canvas = canvasRef.value;
  if (!ctx || !canvas) return;
  updateView();
  const { scale, ox, oy, dpr } = view;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);

  if (staticLayer) ctx.drawImage(staticLayer, 0, 0);
  paintWaves(ctx, map, seconds);
  paintElevatorDoors(ctx, map, elevatorDoor);
  paintAmbient(ctx, map, seconds, dark, 'under');
  paintEscalatorSteps(ctx, map, seconds);
  const drawables: Drawable[] = [
    ...propDrawables(seconds),
    ...seatNodes.flatMap((node) => seatDrawables(node, seconds)),
    ...vehicles.filter((v) => v !== riding).map((v) => vehicleDrawable(v, seconds)),
    ...map.beachgoers.map((goer) => beachgoerDrawable(goer, seconds)),
    ...remoteDrawables(seconds),
  ];
  const me = playerDrawable(seconds);
  if (me) drawables.push(me);
  drawables.sort((a, b) => a.sortY - b.sortY);
  for (const item of drawables) item.draw(ctx);
  if (dark) drawNightLighting(ctx, seconds);
  else drawSunlight(ctx);
  paintAmbient(ctx, map, seconds, dark, 'over');

  // 名牌與樓梯牌用螢幕座標畫，字才清楚、不會跟著像素一起放大
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const toScreen = (wx: number, wy: number) => ({ x: ox + wx * scale, y: oy + wy * scale });
  for (const stair of stairs) {
    const p = toScreen((stair.spot.tx + 1) * TILE, TILE + 2);
    const up = stair.spot.direction === 1;
    drawPill(ctx, up ? t.value.seatScene.stairUp(stair.target) : t.value.seatScene.stairDown(stair.target), p.x, p.y, up ? COLOR_ME : COLOR_MATE);
  }
  if (props.floors.length > 1) {
    const p = toScreen((map.elevator.tx + 1) * TILE, TILE + 2);
    drawPill(ctx, t.value.seatScene.elevator, p.x, p.y, '#cbd5e1');
  }
  const neighbors = neighborZones();
  for (const side of ['left', 'right'] as const) {
    const exit = map.sideExits[side];
    const zone = neighbors[side];
    if (!exit || !zone) continue;
    const p = toScreen((side === 'left' ? 1.3 : map.width - 1.3) * TILE, exit.y0 * TILE - 2);
    drawPill(ctx, side === 'left' ? `← ${zone.name}` : `${zone.name} →`, p.x, p.y, COLOR_MATE);
  }
  if (map.beach.escalator) {
    const p = toScreen(((map.beach.door[0] + map.beach.door[1]) / 2) * TILE, map.beach.wallRow * TILE - 4);
    drawPill(ctx, t.value.seatScene.escalatorBeach, p.x, p.y, COLOR_MATE);
  }
  for (const node of seatNodes) {
    if (!node.label) continue;
    const meSeated = node.state === 'me' && player.state === 'seated' && player.seatId === node.seatId;
    if (node.state === 'me' && !meSeated) continue;
    const p = toScreen(node.slot.tx * TILE + 8, node.slot.ty * TILE - 6);
    const marks = `${node.dnd ? '🔕 ' : ''}${node.focusing ? '⏳ ' : ''}`;
    drawPill(ctx, `${marks}${node.label}`, p.x, p.y, node.state === 'me' ? COLOR_ME : COLOR_MATE);
  }
  if (player.state !== 'seated') {
    const p = toScreen(player.x * TILE, player.y * TILE + myHeadOffset());
    drawPill(ctx, `${playerPrefs.value.doNotDisturb ? '🔕 ' : ''}${t.value.common.meLabel}`, p.x, p.y, COLOR_ME);
  }
  for (const remote of Object.values(props.remotePlayers)) {
    const shown = remoteShown.get(remote.key);
    if (!shown) continue;
    const p = toScreen(shown.x * TILE, shown.y * TILE + remoteHeadOffset(remote));
    drawPill(ctx, `${remote.dnd ? '🔕 ' : ''}${remote.displayName}`, p.x, p.y, COLOR_MATE);
  }
  drawBubbles(ctx, seconds, toScreen);
  renderMinimap(seconds);
}

function animate(time: number): void {
  rafId = requestAnimationFrame(animate);
  if (!ctx || !isVisible || document.hidden) return;
  const seconds = time / 1000;
  const dt = lastFrameTime ? Math.min(0.05, seconds - lastFrameTime) : 0;
  lastFrameTime = seconds;
  updatePlayer(dt);
  updateRemotePlayers(dt);
  syncPosition(seconds);
  savePosition(seconds);
  render(seconds);
}

// ── 輸入 ──

function toWorld(event: MouseEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const rect = canvas.getBoundingClientRect();
  return {
    x: (event.clientX - rect.left - view.ox) / view.scale / TILE,
    y: (event.clientY - rect.top - view.oy) / view.scale / TILE,
  };
}

// 點到座位的格子，或坐著的人頭（座位上面那格）都算點座位
function pickSeat(point: { x: number; y: number }): SeatNode | undefined {
  const tx = Math.floor(point.x);
  const ty = Math.floor(point.y);
  return (
    seatNodes.find((n) => n.slot.tx === tx && n.slot.ty === ty) ??
    seatNodes.find((n) => n.slot.tx === tx && n.slot.ty - 1 === ty && n.state !== 'empty')
  );
}

function handlePointerMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') return;
  const point = toWorld(event);
  const node = point ? pickSeat(point) : undefined;
  hoveredSeatId = node?.seatId ?? null;
  const canvas = canvasRef.value;
  if (canvas) canvas.style.cursor = node && node.state === 'empty' && !props.disabled ? 'pointer' : 'default';
}

function handlePointerLeave(): void {
  hoveredSeatId = null;
}

function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  if (!canInteract()) return;
  const point = toWorld(event);
  if (!point) return;
  const node = pickSeat(point);
  if (node) {
    walkToSeat(node);
    return;
  }
  const vehicle = pickVehicle(point);
  if (vehicle) {
    walkToVehicle(vehicle);
    return;
  }
  const lie = pickLieSpot(point);
  if (lie) {
    walkToLie(lie);
    return;
  }
  if (player.state === 'lying') getUp();
  walkToPoint(point);
}

function toggleMinimap(): void {
  minimapOpen.value = !minimapOpen.value;
  // 焦點還給場景，方向鍵才能繼續用
  containerRef.value?.focus({ preventScroll: true });
}

// 點小地圖上的位置就走過去
function handleMinimapClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  const canvas = minimapRef.value;
  if (!canvas || !canInteract()) return;
  const rect = canvas.getBoundingClientRect();
  const point = {
    x: ((event.clientX - rect.left) / rect.width) * map.width,
    y: ((event.clientY - rect.top) / rect.height) * map.height,
  };
  // 小地圖上點車子（紅點）也算點車子，範圍放寬一點
  const vehicle = vehicles.find((v) => v !== riding && Math.hypot(point.x - v.x, point.y - v.y) < 1.5);
  if (vehicle) walkToVehicle(vehicle);
  else walkToPoint(point);
}

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

// 鍵盤聽在整個視窗上：一進頁面不用先點地圖就能走。
// 正在打字、操作滑桿／選單、或開著對話框時不搶按鍵；焦點在按鈕上時空白鍵和 Enter 留給按鈕。
function keyBelongsToPage(event: KeyboardEvent): boolean {
  const target = event.target instanceof HTMLElement ? event.target : null;
  if (!target || target === containerRef.value) return false;
  if (target.closest('input, textarea, select, [contenteditable="true"], [role="dialog"]')) return true;
  return target.closest('button, a') !== null && ['Space', 'Enter'].includes(event.code);
}

function handleKeyDown(event: KeyboardEvent): void {
  if (keyBelongsToPage(event) || !isVisible) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const direction = KEY_MAP[event.code];
  if (direction) {
    event.preventDefault();
    keys.add(direction);
    return;
  }
  const emoteKey = event.code === 'KeyH' ? 0 : ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(event.code);
  const emote = EMOTE_IDS[emoteKey];
  if (emote) {
    event.preventDefault();
    sendEmote(emote);
    return;
  }
  if (event.code === 'KeyM') {
    event.preventDefault();
    toggleMinimap();
    return;
  }
  if ((event.code === 'Space' || event.code === 'KeyE' || event.code === 'Enter') && canInteract()) {
    event.preventDefault();
    if (riding) {
      dismount();
      return;
    }
    if (player.state === 'lying') {
      getUp();
      return;
    }
    if (player.state === 'idle' || player.state === 'walking') {
      // 座位、車子、躺椅：哪個最近就用哪個
      const vehicle = nearestVehicle();
      const node = nearestSittableSeat();
      const lie = nearestLieSpot();
      const options: { dist: number; act: () => void }[] = [];
      if (node) options.push({ dist: Math.hypot(player.x - seatApproach(node.slot).x, player.y - seatApproach(node.slot).y), act: () => startSit(node) });
      if (vehicle) options.push({ dist: Math.hypot(vehicle.x - player.x, vehicle.y - player.y), act: () => mount(vehicle) });
      if (lie) options.push({ dist: Math.hypot(lie.x - player.x, lie.y - player.y), act: () => lieDown(lie) });
      options.sort((a, b) => a.dist - b.dist)[0]?.act();
    }
  }
}

function clearKeys(): void {
  keys.clear();
}

function handleKeyUp(event: KeyboardEvent): void {
  const direction = KEY_MAP[event.code];
  if (direction) keys.delete(direction);
}

function readTheme(): void {
  dark = document.body.classList.contains('body--dark');
}

onMounted(() => {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;
  ctx = canvas.getContext('2d');
  if (!ctx) {
    emit('webgl-failed');
    return;
  }
  isTouch.value = window.matchMedia('(pointer: coarse)').matches;
  try {
    if (!localStorage.getItem(TOUR_KEY)) tourStep.value = 0;
  } catch {
    // 讀不到儲存空間就不顯示引導
  }
  readTheme();
  rebuildMap();
  void loadImage(KENNEY_SHEET_URL)
    .then((image) => {
      sheet = image;
    })
    .catch(() => emit('webgl-failed'));

  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerleave', handlePointerLeave);
  canvas.addEventListener('click', handleClick);
  resizeObserver = new ResizeObserver(() => render(performance.now() / 1000));
  resizeObserver.observe(container);
  intersectionObserver = new IntersectionObserver((entries) => {
    isVisible = entries[0]?.isIntersecting ?? true;
  });
  intersectionObserver.observe(container);
  themeObserver = new MutationObserver(readTheme);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  window.addEventListener('pagehide', handlePageHide);
  window.addEventListener('keydown', handleKeyDown);
  window.addEventListener('keyup', handleKeyUp);
  window.addEventListener('blur', clearKeys);
  // 一進來就把焦點放在地圖上（不捲動頁面），鍵盤使用者看得到焦點框
  containerRef.value?.focus({ preventScroll: true });
  rafId = requestAnimationFrame(animate);
});

// 座位數量或 id 清單變動（切樓層／分區）才重建；其餘狀態變化只更新外觀
watch(
  () => props.seats.map((seat) => seat.id).join(','),
  () => rebuildMap(),
);

// 樓層清單到了才知道有沒有上下樓梯
watch(
  () => [props.floors.join(','), props.currentFloor, props.zones.map((z) => z.id).join(',')],
  () => {
    rebuildStairs();
    // 樓層清單晚到才知道這層是不是樓上：出口換了就重畫，但人留在原地
    if (map.beach.escalator !== hasEscalator() || sideExitsChanged()) {
      buildMap();
      syncSeatStates();
    }
  },
);

watch(
  () => props.isLoading,
  (loading) => {
    if (!loading) {
      // 連上新房間：重送一次自己的位置
      lastPosKey = '';
      lastPosSentAt = -Infinity;
      pendingSpawn = null;
      // 第一個房間載入完成後，存檔就用過了；之後換房間一律照一般規則出生
      savedPosition = null;
    }
  },
);

// 父層端改變座位（自動入座、還原上次座位）時，人跟著坐過去；
// 座位被釋放（切樓層斷線重連）時，如果人還坐在上面就讓他站起來
watch(
  () => props.selectedSeatId,
  (id) => {
    if (id) {
      if ((player.state === 'seated' && player.seatId === id) || player.state === 'sitting') return;
      // 剛從存檔站回原地：座位照樣幫你保留（椅子會亮），但人留在原地
      if (restoredStanding && player.state !== 'seated') {
        syncSeatStates();
        return;
      }
      const node = seatNodes.find((n) => n.seatId === id);
      if (node) snapToSeat(node);
    } else if (player.state === 'seated') {
      standUp();
    }
    syncSeatStates();
  },
);

// 有人剛進房：下一格就重送自己的位置
watch(
  () => props.peerJoinedAt,
  () => {
    lastPosKey = '';
    lastPosSentAt = -Infinity;
  },
);

watch(
  () => props.remoteEmote,
  (emote) => {
    // 專注中或在靜音區就不打擾
    if (!emote || isQuietZone.value || props.disabled || playerPrefs.value.doNotDisturb) return;
    const text = `${EMOTE_ICONS[emote.emote]} ${t.value.seatScene.emotes[emote.emote]}`;
    // 站著的人泡泡跟著人，坐著的人冒在座位上
    if (remoteShown.has(emote.senderKey)) say(`remote:${emote.senderKey}`, text);
    else if (emote.seatId) say(`seat:${emote.seatId}`, text);
  },
);

watchEffect(() => {
  // 讀取 props 與 getMateAtSeat 內的響應式資料，任何入座／離座都會觸發
  void props.seats.map((seat) => [seat.id, seat.available, props.getMateAtSeat(seat.id)?.displayName, props.getMateAtSeat(seat.id)?.state, props.getMateAtSeat(seat.id)?.dnd]);
  void props.disabled;
  void playerPrefs.value.doNotDisturb;
  void playerPrefs.value.hair;
  void playerPrefs.value.shirt;
  void props.selectedSeatId;
  void t.value;
  syncSeatStates();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  window.removeEventListener('pagehide', handlePageHide);
  window.removeEventListener('keydown', handleKeyDown);
  window.removeEventListener('keyup', handleKeyUp);
  window.removeEventListener('blur', clearKeys);
  handlePageHide();
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  themeObserver?.disconnect();
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerleave', handlePointerLeave);
    canvas.removeEventListener('click', handleClick);
  }
  ctx = null;
});
</script>

<style scoped>
.shake-error {
  animation: shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
}

@keyframes shake {
  10%,
  90% {
    transform: translate3d(-1px, 0, 0);
  }
  20%,
  80% {
    transform: translate3d(2px, 0, 0);
  }
  30%,
  50%,
  70% {
    transform: translate3d(-4px, 0, 0);
  }
  40%,
  60% {
    transform: translate3d(4px, 0, 0);
  }
}
</style>
