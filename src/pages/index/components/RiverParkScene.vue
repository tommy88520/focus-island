<template>
  <!-- 環河公園：從圖書館外的捷運站搭過來的獨立地圖（參考富山的富岩運河環水公園）。只有自己看得到自己在這裡走（不同步），
       座位跟圖書館的一樣是這個分區的座位（編號 73–88，同步給所有人）。可以切換櫻花季／雪季。 -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      :class="season === 'snow' ? 'bg-[#e9eef4]' : 'bg-[#86bf68]'"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <!-- 點別人：名牌小卡（看資料、送悄悄話） -->
      <ProfileCard v-if="profilePerson" :person="profilePerson" @close="profilePerson = null" @whisper="whisperTo" />

      <!-- 切換季節 -->
      <!-- 手機上拿掉標題、縮小留白，少擋地圖（按鈕一定留字） -->
      <div class="pixel-panel absolute right-2 top-2 p-1 sm:px-2 sm:py-2">
        <p class="hide-below-sm !mb-1.5 text-center text-[10px] font-black">{{ t.riverPark.title }}</p>
        <div class="!flex !flex-nowrap gap-1 sm:gap-1.5">
          <button
            v-for="s in SEASONS"
            :key="s"
            type="button"
            class="pixel-btn h-8 whitespace-nowrap px-1.5 text-[11px] sm:px-2"
            :class="{ 'pixel-btn--active': season === s }"
            :aria-label="s === 'sakura' ? t.riverPark.sakura : t.riverPark.snow"
            @click="setSeason(s)"
          >
            {{ s === 'sakura' ? t.riverPark.sakura : t.riverPark.snow }}
          </button>
        </div>
      </div>

      <!-- 回程的捷運站 -->
      <div v-if="stationOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center">
        <p class="!mb-2 !text-[11px] font-black">🚇 {{ t.riverPark.stationPrompt }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="emit('leave')">{{ t.riverPark.goBack }}</button>
      </div>

      <!-- 湖畔咖啡：跟店員點飲料（用專注幣） -->
      <div v-if="cafeOpen && !stationOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(20rem,calc(100%-1.5rem))] -translate-x-1/2 px-4 py-3">
        <div class="!flex !flex-nowrap items-center justify-between gap-2">
          <p class="!mb-0 text-sm font-black">☕ {{ t.riverPark.cafeMenu }}</p>
          <button type="button" class="text-[color:var(--px-muted)]" :aria-label="t.seatScene.profileClose" @click="closeCafe">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <p class="!mb-2 mt-1 text-[11px] font-bold text-[color:var(--px-muted)]">🪙 {{ t.seatScene.coinsLeft(prefs.coins) }}</p>
        <div class="!flex flex-col !flex-nowrap gap-1.5">
          <button
            v-for="drink in cafeMenu"
            :key="drink.id"
            type="button"
            class="pixel-btn pixel-btn--primary h-10 w-full justify-between px-3 text-xs"
            :disabled="prefs.coins < drink.price"
            @click="buyDrink(drink)"
          >
            <span>{{ drink.emoji }} {{ drink.name[locale] }}</span>
            <span>🪙 {{ drink.price }}</span>
          </button>
        </div>
        <p v-if="cafeMenu.every((d) => prefs.coins < d.price)" class="!mb-0 mt-2 text-[11px] text-[color:var(--px-muted)]">{{ t.seatScene.notEnoughCoins }}</p>
      </div>

      <!-- YouBike：借車／騎上停好的車／下車 -->
      <button
        v-if="bikeAction && !disabled"
        type="button"
        class="pixel-btn pixel-btn--primary absolute right-2 h-9 px-3 text-xs"
        :class="isTouch ? 'bottom-28' : 'bottom-2'"
        @click="toggleBike"
      >
        {{ bikeAction === 'off' ? t.seatScene.getOff : bikeAction === 'rent' ? t.riverPark.rentBike : t.riverPark.rideBike }}
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
    <SceneHint :text="isTouch ? t.riverPark.hintTouch : t.riverPark.hintDesktop" />

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
import { AVATAR_SIZE, avatarColorsFor, getAvatarFrame, lookColors, paintVehicle, SEATED_ROWS, type AvatarColors, readerColors } from 'src/pages/index/pixel/pixelArt';
import { getBaristaFrame, paintBikeRack, paintCafe, paintCafeDeck, paintMenuSign } from 'src/pages/index/pixel/parkCafe';
import { px, seeded, pillTextWidth, fillPillText, canvasDpr, drawLayer, layerCanvas } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';

type Facing = 'up' | 'down' | 'left' | 'right';
type Season = 'sakura' | 'snow';

const props = defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
  // 同房間的人（只畫也在公園裡的）
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
// 自己的位置送給同房間的人；別人的位置平滑地畫出來
const syncPosition = createPositionSync((pos) => emit('position', pos));
const viewRemotes = createRemoteView();
let shownRemotes: ShownRemote[] = [];
const { t, locale } = useLocale();
const prefs = usePlayerPrefs();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stickRef = ref<HTMLDivElement | null>(null);
const isTouch = ref(false);
const stationOpen = ref(false);

// ── 季節：自己選的記在瀏覽器；沒選過就看月份（12–2 月是雪季） ──
const SEASONS: Season[] = ['sakura', 'snow'];
const SEASON_KEY = 'focus_island_park_season_v1';
function readSeason(): Season {
  try {
    const saved = localStorage.getItem(SEASON_KEY);
    if (saved === 'sakura' || saved === 'snow') return saved;
  } catch {
    // ignore storage errors
  }
  const month = new Date().getMonth();
  return month === 11 || month <= 1 ? 'snow' : 'sakura';
}
const season = ref<Season>(readSeason());
function setSeason(next: Season): void {
  season.value = next;
  try {
    localStorage.setItem(SEASON_KEY, next);
  } catch {
    // ignore storage errors
  }
  ground = paintGround();
  containerRef.value?.focus({ preventScroll: true });
}

// ── 場地（格，1 格 = 16px）：中間一條東西向的運河，北岸有咖啡屋和雙塔天橋的北塔，南岸是草地 ──
const T = 16;
const W = 56;
const H = 34;
const CANAL = { y0: 15.5, y1: 21.5 };
// 天橋的橋面：唯一能過河的地方
const BRIDGE = { x0: 26, x1: 29 };
const BRIDGE_X = (BRIDGE.x0 + BRIDGE.x1) / 2;
const NORTH_WALK = { y0: 13, y1: CANAL.y0 };
const SOUTH_WALK = { y0: CANAL.y1, y1: 24 };
const STATION = { x0: 2, y0: 1.5, x1: 6, y1: 4, trigger: { x: 4, y: 5 } };
const CAFE = { x0: 38.5, y0: 5.25, x1: 49.5, y1: 11.25 };
// 咖啡屋前的木頭露台；店員站在門口右邊，旁邊一塊立式黑板菜單
const DECK = { x0: 38.75, y0: CAFE.y1, x1: 49.75, y1: 13 };
const BARISTA = { x: 47.9, y: 11.85 };
const MENU_SIGN = { x: 49.1, y: 12.2 };
// YouBike 站（左上角、寬 3 格）：捷運站旁一個、南岸一個
const BIKE_STATIONS = [
  { x: 6.6, y: 5.6 },
  { x: 44.5, y: 24.7 },
];
const BIKE_SPEED = 7.5;
const WALK_SPEED = 4.2;
const TOWERS = [
  { x0: 22.5, y0: 10, x1: 25.5, y1: 12.6 },
  { x0: 29.5, y0: 24.6, x1: 32.5, y1: 27.2 },
];
const TOWER_HEIGHT = 58;
// 座位（順序 = 座位編號 73 起，不要調換）：北岸長椅 4、咖啡屋露台 4、南岸長椅 8。facing 是人坐下時面對的方向
const SEAT_SPOTS: { x: number; y: number; facing: Facing; kind: 'bench' | 'cafe' }[] = [
  ...[8.5, 9.5, 15.5, 16.5].map((x) => ({ x, y: 14.3, facing: 'down' as const, kind: 'bench' as const })),
  ...[41.5, 43, 45, 46.5].map((x) => ({ x, y: 12.3, facing: 'down' as const, kind: 'cafe' as const })),
  ...[6.5, 7.5, 13.5, 14.5, 36.5, 37.5, 44.5, 45.5].map((x) => ({ x, y: 22.9, facing: 'up' as const, kind: 'bench' as const })),
];
const CAFE_TABLES = [
  { x: 42.25, y: 13.3 },
  { x: 45.75, y: 13.3 },
];
const TREES = [
  // 兩岸步道旁一整排
  ...[3, 7, 12, 19, 34, 37, 51, 54].map((x, i) => ({ x, y: 11.6, v: i })),
  ...[3.5, 10, 18, 23, 35, 41, 49, 53].map((x, i) => ({ x, y: 26, v: i + 3 })),
  // 北邊草地上的一片櫻花林、南邊草地零星幾棵
  ...[
    [10, 4.5],
    [14, 7.5],
    [17, 3.5],
    [21, 6.5],
    [29, 4],
    [33, 7.5],
    [36, 3.5],
    [52.5, 3.5],
    [53, 8],
    [8, 31],
    [16, 30],
    [38, 31],
    [45, 30.5],
  ].map(([x, y], i) => ({ x: x as number, y: y as number, v: i + 7 })),
];
// 草地上的野餐墊（櫻花季才有人鋪）
const PICNICS = [
  { x: 12.5, y: 9, color: '#5b8de1' },
  { x: 25.5, y: 29.5, color: '#e25a4a' },
  { x: 31.5, y: 6, color: '#f2a541' },
];
const LAMPS = [
  ...[12, 21, 33, 50].map((x) => ({ x, y: 13.3 })),
  ...[10, 21, 40, 51].map((x) => ({ x, y: 23.8 })),
];
// 散步的人：沿著兩岸步道來回走
const STROLLERS = [
  { from: 2, to: 54, y: 14.9, speed: 0.8, phase: 0, look: 'park-a' },
  { from: 52, to: 3, y: 22.4, speed: 0.7, phase: 0.3, look: 'park-b' },
  { from: 30, to: 54, y: 22.6, speed: 0.6, phase: 0.6, look: 'park-c' },
];

function seatApproach(i: number): { x: number; y: number } | null {
  const spot = SEAT_SPOTS[i];
  if (!spot) return null;
  return { x: spot.x, y: spot.y + (spot.facing === 'down' ? 1 : -1) };
}

const inRect = (x: number, y: number, r: { x0: number; y0: number; x1: number; y1: number }) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;
const blocked = (x: number, y: number) =>
  x < 0.5 ||
  y < 0.5 ||
  x > W - 0.5 ||
  y > H - 0.5 ||
  (y > CANAL.y0 && y < CANAL.y1 && !(x > BRIDGE.x0 + 0.3 && x < BRIDGE.x1 - 0.3)) ||
  inRect(x, y, STATION) ||
  inRect(x, y, CAFE) ||
  TOWERS.some((r) => inRect(x, y, r)) ||
  SEAT_SPOTS.some((s) => Math.abs(x - s.x) < 0.45 && Math.abs(y - s.y) < 0.4) ||
  CAFE_TABLES.some((s) => Math.hypot(x - s.x, y - s.y) < 0.45) ||
  Math.hypot(x - BARISTA.x, y - BARISTA.y) < 0.4 ||
  Math.hypot(x - MENU_SIGN.x, y - MENU_SIGN.y) < 0.35 ||
  BIKE_STATIONS.some((b) => x > b.x && x < b.x + 3 && y > b.y + 0.2 && y < b.y + 0.85) ||
  TREES.some((tr) => Math.abs(x - tr.x) < 0.35 && Math.abs(y - tr.y) < 0.3) ||
  LAMPS.some((l) => Math.abs(x - l.x) < 0.25 && Math.abs(y - l.y) < 0.25);

// ── 自己 ──
const me = { x: STATION.trigger.x + 1.5, y: STATION.trigger.y + 0.5, facing: 'down' as Facing, moving: false, walkClock: 0 };
let stationLock = false;
let seatedIndex: number | null = null;
// 走路的路線（過河會先繞到天橋）；走到最後要坐哪個座位
let route: { x: number; y: number }[] = [];
let walkTarget: number | null = null;
let stuckFor = 0;

// ── YouBike：公園是自己一個人的地圖，車子也只有自己看得到，一次一台 ──
let riding = false;
// 不在站旁邊下車：車子停在原地，之後可以再騎上去；在站旁邊下車就是還車
let parkedBike: { x: number; y: number; facing: Facing } | null = null;
const bikeAction = ref<'rent' | 'ride' | 'off' | null>(null);

function stationNear(): boolean {
  return BIKE_STATIONS.some((b) => Math.hypot(me.x - (b.x + 1.5), me.y - (b.y + 1.4)) < 1.6);
}

function parkedNear(): boolean {
  return parkedBike !== null && Math.hypot(me.x - parkedBike.x, me.y - parkedBike.y) < 1.3;
}

function mount(): void {
  if (seatedIndex !== null) standUp();
  if (parkedBike && parkedNear()) {
    me.x = parkedBike.x;
    me.y = parkedBike.y;
    me.facing = parkedBike.facing;
  }
  parkedBike = null;
  riding = true;
  route = [];
  walkTarget = null;
}

function dismount(): void {
  riding = false;
  if (!stationNear()) parkedBike = { x: me.x, y: me.y, facing: me.facing };
}

function toggleBike(): void {
  if (riding) dismount();
  else if (parkedNear() || stationNear()) mount();
  containerRef.value?.focus({ preventScroll: true });
}

// ── 湖畔咖啡的店員：走到她面前會打招呼、跳出菜單，用專注幣買飲料（拿在手上 3 分鐘，只有自己看得到） ──
interface Drink {
  id: string;
  emoji: string;
  price: number;
  name: { 'zh-TW': string; 'en-US': string };
}
const cafeMenu = computed<Drink[]>(() => [
  { id: 'latte', emoji: '☕', price: 35, name: { 'zh-TW': '石虎拿鐵', 'en-US': 'Leopard cat latte' } },
  { id: 'matcha', emoji: '🍵', price: 40, name: { 'zh-TW': '抹茶拿鐵', 'en-US': 'Matcha latte' } },
  season.value === 'snow'
    ? { id: 'cocoa', emoji: '🍫', price: 45, name: { 'zh-TW': '熱可可（加棉花糖）', 'en-US': 'Hot cocoa with marshmallows' } }
    : { id: 'sakura', emoji: '🌸', price: 45, name: { 'zh-TW': '櫻花星冰樂', 'en-US': 'Sakura frappé' } },
]);
const HOLD_DRINK_S = 180;
const cafeOpen = ref(false);
let cafeDismissed = false;
let heldDrink: { emoji: string; until: number } | null = null;
let baristaSays: { text: string; until: number } | null = null;
let meSays: { text: string; until: number } | null = null;
let greetedAt = -Infinity;

const nowS = () => performance.now() / 1000;

function nearBarista(): boolean {
  return Math.hypot(me.x - BARISTA.x, me.y - BARISTA.y) < 1.7;
}

function closeCafe(): void {
  cafeOpen.value = false;
  cafeDismissed = true;
  containerRef.value?.focus({ preventScroll: true });
}

function buyDrink(drink: Drink): void {
  if (prefs.value.coins < drink.price) return;
  prefs.value.coins -= drink.price;
  const now = nowS();
  heldDrink = { emoji: drink.emoji, until: now + HOLD_DRINK_S };
  baristaSays = { text: t.value.riverPark.baristaThanks, until: now + 3.5 };
  meSays = { text: `${drink.emoji} ${t.value.riverPark.tasty}`, until: now + 2.5 };
  closeCafe();
}

function updateCafe(): void {
  const near = nearBarista() && seatedIndex === null && !riding && !props.disabled;
  if (!near) {
    cafeDismissed = false;
    cafeOpen.value = false;
    return;
  }
  if (cafeOpen.value || cafeDismissed) return;
  cafeOpen.value = true;
  const now = nowS();
  if (now - greetedAt > 20) {
    greetedAt = now;
    baristaSays = { text: t.value.riverPark.baristaHello, until: now + 3.5 };
  }
}

const keys = new Set<string>();
const stick = { x: 0, y: 0 };
const knob = ref({ x: 0, y: 0 });
let stickPointer: number | null = null;

function input(): { x: number; y: number } {
  const x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0) || stick.x;
  const y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0) || stick.y;
  return { x, y };
}

function side(y: number): 'north' | 'south' | 'bridge' {
  if (y <= CANAL.y0) return 'north';
  if (y >= CANAL.y1) return 'south';
  return 'bridge';
}

// 從自己走到某一點的路線：在不同岸就先走到天橋頭、過橋、再走過去
function planRoute(to: { x: number; y: number }): { x: number; y: number }[] {
  const from = side(me.y);
  const dest = side(to.y);
  if (from === dest || from === 'bridge' || dest === 'bridge') {
    if (from === 'bridge' && dest !== 'bridge') return [{ x: BRIDGE_X, y: dest === 'north' ? NORTH_WALK.y1 - 0.4 : SOUTH_WALK.y0 + 0.4 }, to];
    return [to];
  }
  const start = from === 'north' ? NORTH_WALK.y1 - 0.4 : SOUTH_WALK.y0 + 0.4;
  const end = from === 'north' ? SOUTH_WALK.y0 + 0.4 : NORTH_WALK.y1 - 0.4;
  return [{ x: BRIDGE_X, y: start }, { x: BRIDGE_X, y: end }, to];
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
  if (riding) dismount();
  seatedIndex = i;
  walkTarget = null;
  route = [];
  me.x = spot.x;
  me.y = spot.y;
  me.facing = spot.facing;
  if (props.selectedSeatId !== seat.id) emit('select', seat.id);
}

// 按下專注前父層來問：坐著、正走去坐、或就站在空位旁 → 在那個座位專注；不然回 null（父層提示還沒坐下）
function seatForFocus(): string | null {
  const i = seatedIndex ?? walkTarget ?? nearestSeat();
  const seat = i === null ? undefined : props.seats[i];
  if (i === null || !seat || (seatState(i) !== 'empty' && seatState(i) !== 'me')) return null;
  sitAt(i);
  return seat.id;
}

// 分享位置用：坐著就回報座位前面，不然是自己站的地方
function positionForShare(): { x: number; y: number } {
  const at = seatedIndex === null ? me : seatApproach(seatedIndex) ?? me;
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

// 站到某一點旁邊最近的空地
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

function walkTo(to: { x: number; y: number }, seat: number | null): void {
  if (seatedIndex !== null) standUp();
  if (seat !== null && riding) dismount();
  route = planRoute(to);
  walkTarget = seat;
  stuckFor = 0;
}

function step(dx: number, dy: number, dt: number): void {
  const length = Math.hypot(dx, dy) || 1;
  const speed = riding ? BIKE_SPEED : WALK_SPEED;
  const nx = me.x + (dx / length) * speed * dt;
  const ny = me.y + (dy / length) * speed * dt;
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
    if ((x === 0 && y === 0) || props.disabled) return;
    standUp();
  }
  if (x !== 0 || y !== 0) {
    route = [];
    walkTarget = null;
    me.moving = true;
    step(x, y, dt);
  } else if (route.length) {
    const next = route[0];
    if (next) {
      const dx = next.x - me.x;
      const dy = next.y - me.y;
      const close = Math.hypot(dx, dy) < 0.15;
      // 走到了（或被擋住走不過去）就換下一段；最後一段走完要坐下就坐
      if (close || stuckFor > 0.6) {
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
  updateCafe();
  bikeAction.value = seatedIndex !== null ? null : riding ? 'off' : parkedNear() ? 'ride' : stationNear() ? 'rent' : null;
}

// ── 光線：跟圖書館那張地圖一樣看當地時間（5–8 清晨、8–15 白天、15–18 黃昏、其他晚上） ──
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
// 底圖用幾倍畫：畫面放大倍數 × 螢幕像素（變了就重畫），招牌的字和線條才清楚
let groundRes = 1;
const view = { scale: 2, ox: 0, oy: 0, dpr: 1, w: 0, h: 0 };

function paintGround(): HTMLCanvasElement {
  const { canvas, c } = layerCanvas(W * T, H * T, groundRes);
  if (!c) return canvas;
  const snow = season.value === 'snow';
  const rand = seeded(377);
  // 草地（雪季是一片雪地）
  px(c, snow ? '#eef2f6' : '#86bf68', 0, 0, W * T, H * T);
  for (let i = 0; i < 3200; i += 1) {
    const color = snow ? (rand() < 0.5 ? '#ffffff' : '#dde5ee') : rand() < 0.5 ? '#94cb74' : '#76ad5b';
    px(c, color, Math.floor(rand() * W * T), Math.floor(rand() * H * T), 2, 1);
  }
  // 從捷運站下來的石板小路、往咖啡屋的小路
  const paving = snow ? '#dfe4ea' : '#d8cfbf';
  const joint = snow ? '#cdd4dc' : '#c4baa8';
  const path = (x: number, y: number, w: number, h: number) => {
    px(c, paving, x * T, y * T, w * T, h * T);
    for (let yy = y * T; yy < (y + h) * T; yy += 8) px(c, joint, x * T, yy, w * T, 1);
  };
  path(3.4, 4, 1.4, NORTH_WALK.y0 - 4);
  path(43.4, CAFE.y1, 1.2, NORTH_WALK.y0 - CAFE.y1);
  // 兩岸步道
  for (const walk of [NORTH_WALK, SOUTH_WALK]) {
    px(c, paving, 0, walk.y0 * T, W * T, (walk.y1 - walk.y0) * T);
    for (let x = 0; x < W * T; x += 16) px(c, joint, x, walk.y0 * T, 1, (walk.y1 - walk.y0) * T);
    px(c, joint, 0, Math.round(((walk.y0 + walk.y1) / 2) * T), W * T, 1);
  }
  // 運河：石砌河岸 + 水面
  const top = CANAL.y0 * T;
  const bottom = CANAL.y1 * T;
  px(c, '#8a8170', 0, top - 2, W * T, 3);
  px(c, '#8a8170', 0, bottom - 1, W * T, 3);
  px(c, snow ? '#4f8fae' : '#5aaccc', 0, top + 1, W * T, bottom - top - 2);
  px(c, snow ? '#467f9c' : '#4d9cbd', 0, top + 1, W * T, 4);
  for (let i = 0; i < 160; i += 1) {
    const x = Math.floor(rand() * W * T);
    const y = top + 6 + Math.floor(rand() * (bottom - top - 12));
    px(c, snow ? '#6aa6c2' : '#7cc3dd', x, y, 4 + Math.floor(rand() * 6), 1);
  }
  if (snow) {
    // 漂在水上的薄冰
    for (let i = 0; i < 14; i += 1) {
      const x = Math.floor(rand() * (W - 2) * T);
      const y = top + 8 + Math.floor(rand() * (bottom - top - 20));
      const w = 8 + Math.floor(rand() * 14);
      px(c, '#e6f1f7', x + 1, y, w - 2, 4);
      px(c, '#e6f1f7', x, y + 1, w, 2);
      px(c, '#c9dde8', x + 1, y + 4, w - 2, 1);
    }
    // 雪地上的腳印
    for (let i = 0; i < 40; i += 1) {
      const x = Math.floor(rand() * W * T);
      const y = (rand() < 0.5 ? NORTH_WALK.y0 : SOUTH_WALK.y0) * T + 4 + Math.floor(rand() * 26);
      px(c, '#cbd3dc', x, y, 2, 1);
      px(c, '#cbd3dc', x + 4, y + 2, 2, 1);
    }
  } else {
    // 草地上的花圃
    for (const [fx, fy] of [
      [9, 6],
      [16, 4],
      [33, 4],
      [12, 29],
      [26, 30],
      [44, 28],
    ] as const) {
      for (let i = 0; i < 18; i += 1) {
        px(c, ['#f28ab2', '#fde2ec', '#f6c945', '#ffffff'][i % 4] ?? '#ffffff', fx * T + Math.floor(rand() * 40), fy * T + Math.floor(rand() * 18), 2, 2);
      }
    }
    // 河面上漂的花瓣
    for (let i = 0; i < 90; i += 1) px(c, rand() < 0.5 ? '#f7c3d6' : '#fde2ec', Math.floor(rand() * W * T), top + 4 + Math.floor(rand() * (bottom - top - 8)), 2, 1);
  }
  return canvas;
}

// 天橋橋面（白色橋板 + 紅色欄杆）：畫在遊船後面，船才會從橋下穿過
function drawBridge(c: CanvasRenderingContext2D, snow: boolean): void {
  const top = CANAL.y0 * T;
  const bottom = CANAL.y1 * T;
  const bx = BRIDGE.x0 * T;
  const bw = (BRIDGE.x1 - BRIDGE.x0) * T;
  px(c, 'rgba(0,0,0,0.25)', bx + 3, top, bw, bottom - top + 4);
  px(c, snow ? '#f4f7fa' : '#ece7dd', bx, top - 6, bw, bottom - top + 12);
  for (let y = top - 6; y < bottom + 6; y += 6) px(c, snow ? '#e1e7ee' : '#d9d2c4', bx, y, bw, 1);
  px(c, '#c8423b', bx, top - 6, 2, bottom - top + 12);
  px(c, '#c8423b', bx + bw - 2, top - 6, 2, bottom - top + 12);
  for (let y = top - 4; y < bottom + 6; y += 8) {
    px(c, '#8e2c27', bx, y, 2, 2);
    px(c, '#8e2c27', bx + bw - 2, y, 2, 2);
  }
}

function drawStation(c: CanvasRenderingContext2D, snow: boolean): void {
  const x = STATION.x0 * T;
  const y = STATION.y0 * T;
  const w = (STATION.x1 - STATION.x0) * T;
  const h = (STATION.y1 - STATION.y0) * T;
  px(c, 'rgba(0,0,0,0.2)', x + 2, y + h - 2, w, 4);
  px(c, '#e3e8f0', x, y, w, h - 6);
  px(c, '#2f6fb5', x, y, w, 7);
  px(c, '#3a3d45', x + 10, y + 12, w - 20, h - 18);
  px(c, '#ffffff', x + w / 2 - 4, y + 1, 8, 5);
  if (snow) px(c, '#ffffff', x - 1, y - 3, w + 2, 4);
}

function drawTree(c: CanvasRenderingContext2D, tree: { x: number; y: number; v: number }, seconds: number, snow: boolean): void {
  const x = Math.round(tree.x * T);
  const y = Math.round(tree.y * T);
  px(c, 'rgba(0,0,0,0.18)', x - 12, y + 2, 24, 4);
  px(c, '#6b4a33', x - 2, y - 18, 4, 21);
  px(c, '#5a3d2a', x - 2, y - 18, 1, 21);
  if (snow) {
    // 冬天：光禿禿的枝枒，上面積雪
    const branches: [number, number, number, number][] = [
      [-10, -26, 9, 2],
      [2, -30, 10, 2],
      [-6, -36, 6, 2],
      [1, -22, 9, 2],
      [-12, -18, 9, 2],
    ];
    px(c, '#5a3d2a', x - 1, y - 38, 2, 22);
    for (const [bx, by, bw, bh] of branches) {
      px(c, '#5a3d2a', x + bx, y + by, bw, bh);
      px(c, '#ffffff', x + bx, y + by - 2, bw, 2);
    }
    px(c, '#ffffff', x - 3, y - 40, 6, 2);
    return;
  }
  // 櫻花：一團團粉紅色，微微晃動
  const sway = Math.round(Math.sin(seconds * 0.8 + tree.v) * 1);
  const blobs: [number, number, number][] = [
    [-11, -30, 10],
    [-2, -38, 11],
    [8, -31, 10],
    [-6, -24, 9],
    [5, -23, 9],
  ];
  for (const [bx, by, r] of blobs) {
    px(c, '#ef9fbe', x + bx - r / 2 + sway, y + by - r / 2 + 2, r + 2, r);
    px(c, '#f6b8cf', x + bx - r / 2 + sway, y + by - r / 2, r, r);
  }
  for (const [bx, by] of [
    [-9, -32],
    [0, -40],
    [9, -33],
    [-4, -27],
    [6, -26],
  ] as const) {
    px(c, '#fde2ec', x + bx + sway, y + by, 3, 2);
  }
}

function drawPicnic(c: CanvasRenderingContext2D, p: { x: number; y: number; color: string }): void {
  const x = Math.round(p.x * T);
  const y = Math.round(p.y * T);
  px(c, p.color, x - 14, y - 9, 28, 18);
  for (let i = 0; i < 28; i += 8) px(c, '#ffffff', x - 14 + i, y - 9, 4, 18);
  px(c, '#a87442', x - 6, y - 4, 8, 6);
  px(c, '#f4f2ea', x + 5, y - 2, 4, 4);
}

function drawLamp(c: CanvasRenderingContext2D, lamp: { x: number; y: number }, lit: boolean): void {
  const x = Math.round(lamp.x * T);
  const y = Math.round(lamp.y * T);
  px(c, 'rgba(0,0,0,0.2)', x - 4, y + 2, 8, 2);
  px(c, '#3d424c', x - 1, y - 26, 2, 28);
  px(c, '#2f333b', x - 4, y - 30, 8, 5);
  px(c, lit ? '#fff1a8' : '#cfd5de', x - 3, y - 26, 6, 2);
}

// 雙塔天橋的塔：白色塔身、玻璃觀景台、紅色斜撐；晚上窗戶亮起來
function drawTower(c: CanvasRenderingContext2D, r: { x0: number; y0: number; x1: number; y1: number }, lit: boolean, snow: boolean): void {
  const x = r.x0 * T;
  const w = (r.x1 - r.x0) * T;
  const base = r.y1 * T;
  const top = base - TOWER_HEIGHT - (r.y1 - r.y0) * T;
  px(c, 'rgba(0,0,0,0.22)', x + 4, base - 2, w, 6);
  px(c, '#f2f2ee', x + 6, top + 14, w - 12, base - top - 14);
  px(c, '#d9d9d2', x + w - 10, top + 14, 4, base - top - 14);
  // 斜撐
  for (let i = 0; i < 5; i += 1) px(c, '#c8423b', x + 6, top + 22 + i * 10, w - 12, 2);
  // 玻璃觀景台
  px(c, '#3a3d45', x + 1, top, w - 2, 16);
  px(c, lit ? '#ffe6a3' : '#9fd3e8', x + 3, top + 3, w - 6, 9);
  px(c, '#c8423b', x + 1, top + 13, w - 2, 3);
  for (let gx = x + 7; gx < x + w - 3; gx += 6) px(c, '#3a3d45', gx, top + 3, 1, 9);
  if (snow) px(c, '#ffffff', x, top - 2, w, 3);
  // 門
  px(c, '#3a3d45', x + w / 2 - 4, base - 12, 8, 12);
}

function towerTop(r: { x0: number; x1: number; y1: number; y0: number }): { x: number; y: number } {
  return { x: ((r.x0 + r.x1) / 2) * T, y: r.y1 * T - TOWER_HEIGHT - (r.y1 - r.y0) * T + 2 };
}


function drawBoat(c: CanvasRenderingContext2D, seconds: number): void {
  // 遊船：在運河上慢慢來回
  const span = 46;
  const period = 70;
  const k = (seconds % period) / period;
  const forward = k < 0.5;
  const along = forward ? k * 2 : 2 - k * 2;
  const x = Math.round((5 + along * span) * T);
  const y = Math.round(18.6 * T);
  const dir = forward ? 1 : -1;
  px(c, 'rgba(255,255,255,0.45)', x - dir * 30, y + 6, 16, 1);
  px(c, 'rgba(255,255,255,0.35)', x - dir * 34, y + 9, 10, 1);
  px(c, '#f4f7fa', x - 22, y - 2, 44, 9);
  px(c, '#f4f7fa', x + dir * 22 - (dir > 0 ? 0 : 4), y, 4, 5);
  px(c, '#2f6fb5', x - 22, y + 4, 44, 2);
  px(c, '#2b2d33', x - 22, y + 7, 44, 1);
  px(c, '#dfe7ee', x - 12, y - 10, 22, 9);
  for (let i = 0; i < 4; i += 1) px(c, '#6fb3d4', x - 10 + i * 5, y - 8, 3, 4);
}

function drawSeat(c: CanvasRenderingContext2D, i: number, seconds: number, snow: boolean): void {
  const spot = SEAT_SPOTS[i];
  if (!spot) return;
  const x = Math.round(spot.x * T);
  const y = Math.round(spot.y * T);
  const state = seatState(i);
  const occupied = state === 'mate' || state === 'taken' || (state === 'me' && seatedIndex === i);
  px(c, 'rgba(0,0,0,0.18)', x - 7, y + 4, 14, 3);
  if (spot.kind === 'bench') {
    // 木頭長椅：椅背在背對河的那一側
    const backY = spot.facing === 'down' ? y - 8 : y + 1;
    px(c, '#3a3d45', x - 7, y + 1, 1, 4);
    px(c, '#3a3d45', x + 6, y + 1, 1, 4);
    px(c, '#9c6b45', x - 8, y - 3, 16, 5);
    px(c, '#b9845a', x - 8, y - 3, 16, 1);
    px(c, '#8a5c3a', x - 8, backY, 16, 3);
    if (snow && !occupied) px(c, '#ffffff', x - 8, y - 4, 16, 2);
  } else {
    // 露台的小椅子
    px(c, '#3a3d45', x - 4, y, 1, 5);
    px(c, '#3a3d45', x + 3, y, 1, 5);
    px(c, '#2f6b4f', x - 5, y - 3, 10, 4);
    px(c, '#2f6b4f', x - 5, y - 9, 10, 3);
  }
  if (state === 'me' && seatedIndex !== i) {
    c.fillStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(seconds * 3) * 0.15})`;
    c.fillRect(x - 7, y + 4, 14, 2);
  }
  if (!occupied) return;
  const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
  const colors = state === 'me' ? lookColors(prefs.value.hair, prefs.value.shirt, prefs.value) : mate ? readerColors(mate) : { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };
  const sprite = getAvatarFrame(colors, spot.facing, 'idle');
  c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y + 1 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
}

function drawTable(c: CanvasRenderingContext2D, table: { x: number; y: number }, snow: boolean): void {
  const x = Math.round(table.x * T);
  const y = Math.round(table.y * T);
  px(c, 'rgba(0,0,0,0.18)', x - 6, y + 3, 12, 3);
  px(c, '#3a3d45', x - 1, y - 2, 2, 6);
  px(c, '#f4f2ea', x - 6, y - 6, 12, 5);
  px(c, '#c7c1b3', x - 6, y - 2, 12, 1);
  px(c, '#7a5236', x - 1, y - 8, 3, 3);
  if (snow) px(c, '#ffffff', x - 6, y - 7, 12, 1);
}

function drawPerson(c: CanvasRenderingContext2D, colors: AvatarColors, x: number, y: number, facing: Facing, moving: boolean, clock: number): void {
  const frame = moving ? (Math.floor(clock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  const sprite = getAvatarFrame(colors, facing, frame);
  px(c, 'rgba(0,0,0,0.18)', Math.round(x * T - 5), Math.round(y * T + 3), 10, 2);
  c.drawImage(sprite, Math.round(x * T - AVATAR_SIZE.w / 2), Math.round(y * T + 5 - AVATAR_SIZE.h));
}

// 店員：平常站著眨眼，打招呼時揮手
function drawBarista(c: CanvasRenderingContext2D, seconds: number): void {
  const greeting = baristaSays !== null && nowS() < baristaSays.until;
  const frame = greeting && Math.floor(seconds / 0.3) % 2 === 0 ? 'wave' : seconds % 4 < 0.14 ? 'blink' : 'idle';
  const bob = !greeting && Math.floor(seconds / 0.8) % 2 === 0 ? 1 : 0;
  const x = Math.round(BARISTA.x * T);
  const y = Math.round(BARISTA.y * T);
  px(c, 'rgba(0,0,0,0.18)', x - 5, y + 3, 10, 2);
  c.drawImage(getBaristaFrame(frame), x - 8, y + 5 - 20 + bob);
}

function drawBike(c: CanvasRenderingContext2D, x: number, y: number, facing: Facing, moving: boolean, seconds: number): void {
  paintVehicle(c, 'bike', facing, x * T, y * T + 5, 'back', seconds, moving);
  paintVehicle(c, 'bike', facing, x * T, y * T + 5, 'front', seconds, moving);
}

// 騎車：先畫車身，再畫坐在上面的人（只畫到腰），最後畫把手
function drawRider(c: CanvasRenderingContext2D, colors: AvatarColors, seconds: number): void {
  const footX = me.x * T;
  const footY = me.y * T + 5;
  paintVehicle(c, 'bike', me.facing, footX, footY, 'back', seconds, me.moving);
  c.drawImage(getAvatarFrame(colors, me.facing, 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - 7 - SEATED_ROWS), AVATAR_SIZE.w, SEATED_ROWS);
  paintVehicle(c, 'bike', me.facing, footX, footY, 'front', seconds, me.moving);
}

// 對話泡泡（螢幕座標）：白底、下面一個小尖角
function bubble(c: CanvasRenderingContext2D, text: string, cx: number, bottom: number): void {
  c.font = '700 12px system-ui, -apple-system, "PingFang TC", sans-serif';
  const width = pillTextWidth(c, text) + 16;
  const height = 22;
  const left = Math.round(cx - width / 2);
  const top = Math.round(bottom - height - 6);
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#2b2135';
  c.lineWidth = 1.5;
  c.beginPath();
  c.roundRect(left, top, width, height, 8);
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(cx - 5, top + height - 0.5);
  c.lineTo(cx, top + height + 6);
  c.lineTo(cx + 5, top + height - 0.5);
  c.fill();
  c.stroke();
  c.fillStyle = '#ffffff';
  c.fillRect(cx - 4, top + height - 2, 8, 2);
  c.fillStyle = '#2b2135';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  fillPillText(c, text, cx, top + height / 2 + 0.5);
}

function strollerPose(s: (typeof STROLLERS)[number], seconds: number): { x: number; facing: Facing } {
  const length = Math.abs(s.to - s.from);
  const lap = (length / s.speed) * 2;
  const k = ((seconds / lap + s.phase) % 1 + 1) % 1;
  const out = k < 0.5;
  const along = out ? k * 2 : 2 - k * 2;
  const x = s.from + (s.to - s.from) * along;
  const rightward = (s.to > s.from) === out;
  return { x, facing: rightward ? 'right' : 'left' };
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

// 飄落的櫻花瓣／雪花（螢幕座標，跟著時間算，不用存狀態）
function drawWeather(c: CanvasRenderingContext2D, seconds: number, w: number, h: number, snow: boolean): void {
  const count = snow ? 70 : 34;
  for (let i = 0; i < count; i += 1) {
    const speed = snow ? 18 + (i % 5) * 6 : 14 + (i % 4) * 5;
    const fall = (seconds * speed + i * 97) % (h + 20);
    const drift = Math.sin(seconds * (snow ? 0.8 : 1.3) + i) * (snow ? 10 : 22);
    const x = ((i * 137) % Math.max(1, w)) + drift + (snow ? 0 : seconds * 6) % 40;
    const y = fall - 10;
    if (snow) {
      c.fillStyle = 'rgba(255,255,255,0.9)';
      const size = i % 3 === 0 ? 3 : 2;
      c.fillRect(Math.round(x), Math.round(y), size, size);
    } else {
      c.fillStyle = i % 2 === 0 ? 'rgba(247, 182, 207, 0.95)' : 'rgba(253, 226, 236, 0.95)';
      const flip = Math.sin(seconds * 3 + i) > 0;
      c.fillRect(Math.round(x), Math.round(y), flip ? 4 : 2, flip ? 2 : 3);
    }
  }
}

function drawLighting(c: CanvasRenderingContext2D, seconds: number): void {
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
    for (const lamp of LAMPS) {
      glow(lamp.x * T, lamp.y * T - 25, 22, 'rgba(255, 236, 170, 0.55)');
      glow(lamp.x * T, lamp.y * T + 4, 44, 'rgba(255, 214, 140, 0.3)');
    }
    // 落地窗整面亮起來，光灑在露台上
    c.fillStyle = 'rgba(255, 190, 110, 0.35)';
    c.fillRect(CAFE.x0 * T, CAFE.y0 * T + 36, (CAFE.x1 - CAFE.x0) * T, (CAFE.y1 - CAFE.y0) * T - 44);
    const cafeX = ((CAFE.x0 + CAFE.x1) / 2) * T;
    glow(cafeX, CAFE.y1 * T - 20, 120, 'rgba(255, 205, 130, 0.45)');
    glow(cafeX - 50, CAFE.y1 * T + 10, 60, 'rgba(255, 210, 140, 0.25)');
    glow(cafeX + 50, CAFE.y1 * T + 10, 60, 'rgba(255, 210, 140, 0.25)');
    for (const r of TOWERS) {
      const top = towerTop(r);
      glow(top.x, top.y + 6, 40, `rgba(255, 230, 170, ${0.4 + Math.sin(seconds * 1.2) * 0.04})`);
    }
    // 河面上的倒影
    for (const lamp of LAMPS) glow(lamp.x * T, (lamp.y < CANAL.y0 ? CANAL.y0 + 1 : CANAL.y1 - 1) * T, 24, 'rgba(255, 220, 150, 0.18)');
  }
  c.restore();
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
  const oy = Math.round(follow(cssH, H * T * scale, me.y * T * scale) * dpr) / dpr;
  Object.assign(view, { scale, ox, oy, dpr, w: cssW, h: cssH });

  const snow = season.value === 'snow';
  const phase = lightPhase();
  const lit = phase === 'night' || phase === 'dawn';
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  if (scale * dpr !== groundRes) {
    groundRes = scale * dpr;
    ground = paintGround();
  }
  if (ground) drawLayer(ctx, ground, 0, 0, W * T, H * T);
  paintCafeDeck(ctx, DECK.x0 * T, DECK.y0 * T, (DECK.x1 - DECK.x0) * T, (DECK.y1 - DECK.y0) * T, snow);

  const c = ctx;
  drawBoat(c, seconds);
  drawBridge(c, snow);
  // 依 y 排前後
  const items: { y: number; draw: () => void }[] = [];
  items.push({ y: STATION.y1, draw: () => drawStation(c, snow) });
  items.push({ y: CAFE.y1, draw: () => paintCafe(c, CAFE.x0 * T, CAFE.y0 * T, (CAFE.x1 - CAFE.x0) * T, (CAFE.y1 - CAFE.y0) * T, { lit, snow, seconds }) });
  items.push({ y: BARISTA.y, draw: () => drawBarista(c, seconds) });
  items.push({ y: MENU_SIGN.y, draw: () => paintMenuSign(c, MENU_SIGN.x * T, MENU_SIGN.y * T + 4) });
  BIKE_STATIONS.forEach((b) => items.push({ y: b.y + 0.8, draw: () => paintBikeRack(c, Math.round(b.x * T), Math.round(b.y * T), 3, snow) }));
  const parked = parkedBike;
  if (parked) items.push({ y: parked.y + 0.35, draw: () => drawBike(c, parked.x, parked.y, parked.facing, false, seconds) });
  TOWERS.forEach((r) => items.push({ y: r.y1, draw: () => drawTower(c, r, lit, snow) }));
  TREES.forEach((tree) => items.push({ y: tree.y, draw: () => drawTree(c, tree, seconds, snow) }));
  if (!snow) PICNICS.forEach((p) => items.push({ y: p.y - 1, draw: () => drawPicnic(c, p) }));
  LAMPS.forEach((lamp) => items.push({ y: lamp.y, draw: () => drawLamp(c, lamp, lit) }));
  CAFE_TABLES.forEach((table) => items.push({ y: table.y, draw: () => drawTable(c, table, snow) }));
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y + 0.2, draw: () => drawSeat(c, i, seconds, snow) }));
  STROLLERS.forEach((s, i) => {
    const pose = strollerPose(s, seconds);
    items.push({ y: s.y, draw: () => drawPerson(c, avatarColorsFor(s.look), pose.x, s.y, pose.facing, true, seconds + i) });
  });
  for (const other of shownRemotes) {
    if (other.remote.lying) continue;
    const colors = remoteColors(other.remote);
    items.push({
      y: other.y + 0.35,
      draw: () => {
        if (other.remote.vehicle === 'bike') {
          const footX = other.x * T;
          const footY = other.y * T + 5;
          paintVehicle(c, 'bike', other.remote.facing, footX, footY, 'back', seconds, other.remote.moving);
          c.drawImage(getAvatarFrame(colors, other.remote.facing, 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - 7 - SEATED_ROWS), AVATAR_SIZE.w, SEATED_ROWS);
          paintVehicle(c, 'bike', other.remote.facing, footX, footY, 'front', seconds, other.remote.moving);
        } else {
          drawPerson(c, colors, other.x, other.y, other.remote.facing, other.remote.moving, seconds);
        }
      },
    });
  }
  if (seatedIndex === null) {
    const colors = lookColors(prefs.value.hair, prefs.value.shirt, prefs.value);
    items.push({
      y: me.y + 0.35,
      draw: () => (riding ? drawRider(c, colors, seconds) : drawPerson(c, colors, me.x, me.y, me.facing, me.moving, me.walkClock)),
    });
  }
  items.sort((a, b) => a.y - b.y).forEach((item) => item.draw());
  drawLighting(c, seconds);

  // 螢幕座標：飄落的花瓣／雪、名牌
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawWeather(ctx, seconds, cssW, cssH, snow);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  const sp = screen((STATION.x0 + STATION.x1) / 2, STATION.y0 - 0.6);
  pill(ctx, t.value.riverPark.stationName, sp.x, sp.y, '#60a5fa');
  const cp = screen((CAFE.x0 + CAFE.x1) / 2, CAFE.y0 - 0.6);
  pill(ctx, t.value.riverPark.cafe, cp.x, cp.y, '#fbbf24');
  const bp = screen(BRIDGE_X, CANAL.y1 + 1.6);
  pill(ctx, t.value.riverPark.bridge, bp.x, bp.y, '#f87171');
  const mp = seatedIndex === null ? screen(me.x, me.y - (riding ? 1.45 : 1.1)) : screen(SEAT_SPOTS[seatedIndex]?.x ?? me.x, (SEAT_SPOTS[seatedIndex]?.y ?? me.y) - 1.1);
  pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
  for (const other of shownRemotes) {
    const op = screen(other.x, other.y - (other.remote.vehicle === 'bike' ? 1.45 : 1.1));
    pill(ctx, remoteLabel(other), op.x, op.y, '#2dd4bf');
  }
  // 手上的飲料、說的話
  const now = nowS();
  if (heldDrink && now > heldDrink.until) heldDrink = null;
  if (heldDrink) {
    const hp = seatedIndex === null ? screen(me.x + 0.5, me.y - 0.2) : screen((SEAT_SPOTS[seatedIndex]?.x ?? me.x) + 0.5, (SEAT_SPOTS[seatedIndex]?.y ?? me.y) - 0.3);
    ctx.font = `${Math.round(scale * 6)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(heldDrink.emoji, hp.x, hp.y);
  }
  if (meSays && now < meSays.until) bubble(ctx, meSays.text, mp.x, mp.y - 24);
  if (baristaSays && now < baristaSays.until) {
    const bp2 = screen(BARISTA.x, BARISTA.y - 1.3);
    bubble(ctx, baristaSays.text, bp2.x, bp2.y);
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
  shownRemotes = viewRemotes(props.remotePlayers, 'park', dt);
  // 坐下就送 hidden（別人看座位就知道你在哪）
  rememberScene('park', positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: 'park' }
      : { x: Math.round(me.x * 100) / 100, y: Math.round(me.y * 100) / 100, facing: me.facing, moving: me.moving, scene: 'park', ...(riding ? { vehicle: 'bike' as const } : {}) },
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
    if (riding) dismount();
    else if (seatedIndex !== null) standUp();
    else {
      const seat = nearestSeat();
      if (seat !== null) sitAt(seat);
      else if (parkedNear() || stationNear()) mount();
      else if (nearBarista()) cafeDismissed = false;
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

// 點座位：走過去坐；點地面：走過去（在對岸就繞天橋）
function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  const at = canvasRef.value ? localPoint(canvasRef.value, event.clientX, event.clientY) : null;
  if (!at) return;
  const x = (at.x - view.ox) / view.scale / T;
  const y = (at.y - view.oy) / view.scale / T;
  if (pickPerson(x, y)) return;
  const seat = seatAt(x, y);
  if (props.disabled) {
    // 點自己的座位不算要離開
    if (seat < 0 || seat !== seatedIndex) askToLeave(() => handleClick(event));
    return;
  }
  // 點店員：走到她面前；點停著的車或 YouBike 站：走過去
  if (Math.abs(x - BARISTA.x) < 0.6 && y > BARISTA.y - 1.4 && y < BARISTA.y + 0.4) {
    walkTo({ x: BARISTA.x, y: BARISTA.y + 0.9 }, null);
    return;
  }
  if (parkedBike && Math.hypot(x - parkedBike.x, y - parkedBike.y) < 0.9) {
    walkTo({ x: parkedBike.x, y: parkedBike.y + 0.6 }, null);
    return;
  }
  const rack = BIKE_STATIONS.find((b) => x > b.x && x < b.x + 3 && y > b.y - 1 && y < b.y + 1);
  if (rack) {
    walkTo({ x: rack.x + 1.5, y: rack.y + 1.4 }, null);
    return;
  }
  if (seat >= 0) {
    const approach = seatApproach(seat);
    if (approach && seatState(seat) === 'empty') walkTo(approach, seat);
    return;
  }
  if (!blocked(x, y)) walkTo({ x, y }, null);
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
  // 朋友分享的位置：站到他旁邊；不然上次就坐在公園裡的話直接坐回去
  const arrival = takeArrival('park');
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
