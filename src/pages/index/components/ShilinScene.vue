<template>
  <!-- 士林夜市（獨立地圖，從主地圖的夜市捷運站搭過來）：攤位、豪大大雞排、辛發亭、士林市場買小吃，慈諴宮廟埕撈金魚、射氣球，
       折疊桌的紅色塑膠椅坐下專注（座位 31–42）。同房間也在這裡的人看得到彼此（手上拿的小吃也看得到） -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#16161d] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <ProfileCard v-if="profilePerson" :person="profilePerson" @close="profilePerson = null" @whisper="whisperTo" />

      <!-- 攤位、店家、射氣球：買東西 -->
      <div v-if="shop" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 px-4 py-3" @click.stop>
        <p class="!mb-0 text-sm font-black">🏮 {{ shop.name[locale] }}</p>
        <p class="!mb-0 mt-0.5 text-[11px] font-bold text-[color:var(--px-accent-dark)] dark:!text-amber-300">「{{ shop.call[locale] }}」</p>
        <p class="!mb-2 mt-1 text-[11px] font-bold text-[color:var(--px-muted)]">🪙 {{ t.seatScene.coinsLeft(prefs.coins) }}</p>
        <div class="space-y-1.5">
          <button
            v-for="item in shop.items"
            :key="item.id"
            type="button"
            class="pixel-btn pixel-btn--primary h-auto min-h-10 w-full !flex-nowrap justify-between gap-2 px-3 py-1.5 text-left text-xs"
            :disabled="prefs.coins < item.price"
            @click="buy(item)"
          >
            <span>{{ item.emoji }} {{ item.name[locale] }}</span>
            <span class="shrink-0">🪙 {{ item.price }}</span>
          </button>
        </div>
        <p v-if="shop.items.every((item) => prefs.coins < item.price)" class="!mb-0 mt-2 text-[11px] text-[color:var(--px-muted)]">{{ t.seatScene.notEnoughCoins }}</p>
      </div>

      <!-- 撈金魚：拋竿 → 浮標動了就拉 -->
      <div v-else-if="fishOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(20rem,calc(100%-1.5rem))] -translate-x-1/2 px-4 py-3" @click.stop>
        <p class="!mb-0 text-sm font-black">{{ t.seatScene.fishTitle }}</p>
        <p class="!mb-2 mt-1 text-[11px] font-bold text-[color:var(--px-muted)]">🪙 {{ t.seatScene.coinsLeft(prefs.coins) }}</p>
        <p v-if="fishPhase !== 'idle'" class="!mb-2 text-center text-xs font-black" :class="{ 'text-red-500': fishPhase === 'bite' }">{{ fishMessage }}</p>
        <button v-if="fishPhase === 'waiting' || fishPhase === 'bite'" type="button" class="pixel-btn pixel-btn--primary h-11 w-full text-sm font-black" @click="pullLine">
          🎣 {{ t.seatScene.fishPull }}
        </button>
        <button v-else type="button" class="pixel-btn pixel-btn--primary h-10 w-full text-xs" :disabled="prefs.coins < FISHING_PRICE" @click="castLine">
          {{ fishPhase === 'idle' ? t.seatScene.fishCast(FISHING_PRICE) : `${t.seatScene.fishAgain}（🪙 ${FISHING_PRICE}）` }}
        </button>
        <p v-if="prefs.coins < FISHING_PRICE && fishPhase !== 'waiting' && fishPhase !== 'bite'" class="!mb-0 mt-2 text-[11px] text-[color:var(--px-muted)]">{{ t.seatScene.notEnoughCoins }}</p>
      </div>

      <!-- 回程的劍潭站 -->
      <div v-else-if="stationOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center">
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
    <SceneHint :text="isTouch ? t.shilin.hintTouch : t.shilin.hintDesktop" />

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
import { AVATAR_SIZE, getAvatarFrame, lookColors, readerColors, SEATED_ROWS, type AvatarColors } from 'src/pages/index/pixel/pixelArt';
import { px, seeded, pillTextWidth, fillPillText, canvasDpr, drawLayer, layerCanvas } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';
import { FISH, FISHING_PRICE, SHOP_ITEM_EMOJI, type ShopItem, type ShopItemId } from 'src/pages/index/pixel/pixelWorld';
import { BALLOON_GAME, MARKET_DOOR, SHILIN_SEATS, SHILIN_SHOPS, SHILIN_STALLS, SL, STALL_GAP_X, STALL_X1, stallCenter, stallLeft, type ShilinShop } from 'src/pages/index/pixel/shilin';
import {
  drawBalloonBooth,
  drawBurner,
  drawFishPool,
  drawFoldingTable,
  drawGateSign,
  drawMarket,
  drawParkedScooter,
  drawPlasticStool,
  drawRiverShimmer,
  drawShophouse,
  drawStall,
  drawStation,
  drawStreetLamp,
  drawTemple,
  drawTree,
  paintShilinGround,
  PARKED_SCOOTERS,
  SCOOTER_ROW_Y,
  SHOPHOUSES,
} from 'src/pages/index/pixel/shilinArt';
import { drawRoadVehicle } from 'src/pages/index/pixel/miaokouArt';

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
const W = SL.W;
const H = SL.H;
const SEAT_SPOTS = SHILIN_SEATS;
const STATION_TRIGGER = { x: (SL.station.x0 + SL.station.x1) / 2, y: SL.station.y1 + 0.8 };
// 坐下前站的位置：椅子外側（左邊的椅子站在更左邊）
const approach = (i: number) => {
  const s = SEAT_SPOTS[i];
  return s ? { x: s.x + (s.facing === 'right' ? -0.9 : 0.9), y: s.y } : { x: 0, y: 0 };
};
// 豪大大門口排隊的人（裝飾，面向櫃台）
const QUEUE = [10.9, 10.1, 9.3, 8.5].map((x, i) => ({ x, y: SL.shopLine + 0.85, colors: lookColors((i * 2 + 1) % 5, (i * 3 + 2) % 7, { body: i % 2 }) }));
const QUEUE_HEAD = (QUEUE[0]?.x ?? 0) + 0.6;
// 撈金魚池的老闆（坐在池子右邊、戴斗笠）
const FISH_OWNER = { x: SL.pool.x1 + 0.6, y: SL.pool.y0 + 1.3 };
const FISH_OWNER_COLORS: AvatarColors = { hair: '#3b2a20', hairLight: '#5a4130', shirt: '#2f6fb5', shirtShade: '#25598f' };
const TREES = [
  { x: 37.4, y: 21.2 },
  { x: 51, y: 21.2 },
  { x: 1.2, y: 30 },
  { x: 18.4, y: 35 },
];
const LAMPS = [21.5, 27.5, 33.5, 39.5, 45.5].map((x) => ({ x, y: 29.7 })).concat([{ x: 0.8, y: 24.3 }, { x: 17, y: 24.3 }]);
// 基河路上的車（用時間算的裝飾）：上面車道往西、下面車道往東
const VEHICLES = [
  { kind: 'scooter' as const, lane: 0, speed: 3.4, phase: 0, color: '#e25a4a', rider: '#3b82f6' },
  { kind: 'taxi' as const, lane: 0, speed: 4.2, phase: 0.35, color: '', rider: '' },
  { kind: 'scooter' as const, lane: 0, speed: 2.9, phase: 0.7, color: '#f2f2f2', rider: '#f6c945' },
  { kind: 'scooter' as const, lane: 1, speed: 3.1, phase: 0.15, color: '#3b82f6', rider: '#2bb673' },
  { kind: 'taxi' as const, lane: 1, speed: 3.8, phase: 0.55, color: '', rider: '' },
  { kind: 'scooter' as const, lane: 1, speed: 2.6, phase: 0.85, color: '#8bd3c7', rider: '#e25a4a' },
];
function vehiclePos(v: (typeof VEHICLES)[number], seconds: number): { x: number; y: number; dir: 1 | -1 } {
  const span = W + 6;
  const k = ((seconds * v.speed) / span + v.phase) % 1;
  return v.lane === 0 ? { x: W + 3 - k * span, y: SL.roadY + 0.75, dir: -1 } : { x: -3 + k * span, y: SL.roadY + 2.05, dir: 1 };
}

const SCOOTER_X0 = Math.min(...PARKED_SCOOTERS.map((s) => s.x));
const SCOOTER_X1 = Math.max(...PARKED_SCOOTERS.map((s) => s.x));
const inRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) => x > x0 && x < x1 && y > y0 && y < y1;
const blocked = (x: number, y: number) =>
  x < 0.5 || x > W - 0.5 || y < 0.5 || y > H - 0.5 ||
  (y < SL.shopLine - 0.25 && x < SL.temple.x0) ||
  inRect(x, y, SL.temple.x0 - 1.4, 0, SL.temple.x0, SL.temple.y1 - 0.4) ||
  inRect(x, y, stallLeft(0) - 0.2, SL.stallTop - 0.2, STALL_GAP_X[0] + 0.2, SL.counterY + 0.55) ||
  inRect(x, y, STALL_GAP_X[1] - 0.2, SL.stallTop - 0.2, STALL_X1 + 0.2, SL.counterY + 0.55) ||
  QUEUE.some((q) => Math.abs(x - q.x) < 0.35 && Math.abs(y - q.y) < 0.3) ||
  inRect(x, y, SL.temple.x0, 0, SL.temple.x1, SL.temple.y1 - 0.1) ||
  inRect(x, y, SL.burner.x - 0.7, SL.burner.y - 0.5, SL.burner.x + 0.7, SL.burner.y + 0.2) ||
  inRect(x, y, SL.pool.x0 - 0.1, SL.pool.y0 - 0.4, SL.pool.x1 + 0.1, SL.pool.y1 + 0.3) ||
  (Math.abs(x - FISH_OWNER.x) < 0.4 && Math.abs(y - FISH_OWNER.y) < 0.35) ||
  inRect(x, y, SL.balloon.x0, SL.balloon.top - 0.6, SL.balloon.x1, SL.balloon.counterY + 0.55) ||
  inRect(x, y, SL.market.x0, SL.market.y0 - 0.5, SL.market.x1, SL.market.y1 - 0.1) ||
  SL.tables.some((cx) => inRect(x, y, cx - 0.8, SL.tableY - 0.2, cx + 0.8, SL.tableY + 2.3)) ||
  SEAT_SPOTS.some((s) => Math.abs(x - s.x) < 0.4 && Math.abs(y - s.y) < 0.4) ||
  [SL.gateSign.x0 + 0.2, SL.gateSign.x1 - 0.2].some((gx) => Math.abs(x - gx) < 0.25 && Math.abs(y - SL.gateSign.y) < 0.25) ||
  inRect(x, y, SCOOTER_X0 - 0.5, SCOOTER_ROW_Y - 0.7, SCOOTER_X1 + 0.5, SCOOTER_ROW_Y + 0.15) ||
  TREES.some((tr) => Math.abs(x - tr.x) < 0.35 && Math.abs(y - tr.y) < 0.3) ||
  LAMPS.some((l) => Math.abs(x - l.x) < 0.25 && Math.abs(y - l.y) < 0.25) ||
  (x > SL.riverX - 0.2 && y > SL.riverY - 0.55) ||
  inRect(x, y, SL.station.x0, SL.station.y0 - 0.4, SL.station.x1, SL.station.y1);

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

// ── 現在站在哪裡前面：攤位、店家、射氣球、金魚池、車站（同時只開一個面板）──
// 'stall:i'、'shop:i'（0 豪大大、1 辛發亭、2 士林市場）、'balloon'
const shopKey = ref<string | null>(null);
const fishOpen = ref(false);
const stationOpen = ref(false);
// 買完東西：先走開才會再跳出同一家
let shopLock: string | null = null;
function shopFor(key: string | null): ShilinShop | null {
  if (!key) return null;
  if (key === 'balloon') return BALLOON_GAME;
  const [kind, n] = key.split(':');
  return (kind === 'stall' ? SHILIN_STALLS[Number(n)] : SHILIN_SHOPS[Number(n)]) ?? null;
}
const shop = computed(() => shopFor(shopKey.value));

// ── 自己 ──
const me = { x: STATION_TRIGGER.x + 1.6, y: STATION_TRIGGER.y, facing: 'up' as 'up' | 'down' | 'left' | 'right', moving: false, walkClock: 0 };
let stationLock = true;
let seatedIndex: number | null = null;
let walkTarget: number | null = null;
let stuckFor = 0;
const keys = new Set<string>();
const stick = { x: 0, y: 0 };
const knob = ref({ x: 0, y: 0 });
let stickPointer: number | null = null;

// 買到的東西拿在手上 3 分鐘（別人也看得到）
const HOLD_ITEM_S = 180;
let heldItem: { id: ShopItemId; until: number } | null = null;
function heldItemNow(): ShopItemId | null {
  if (heldItem && performance.now() / 1000 > heldItem.until) heldItem = null;
  return heldItem?.id ?? null;
}
// 頭上冒出的一句話（老闆的招呼、自己的「好吃！」）
const bubbles = new Map<string, { text: string; until: number }>();
function say(key: string, text: string, seconds = 2.6): void {
  bubbles.set(key, { text, until: performance.now() / 1000 + seconds });
}

function buy(item: ShopItem): void {
  if (prefs.value.coins < item.price) return;
  prefs.value.coins -= item.price;
  heldItem = { id: item.id, until: performance.now() / 1000 + HOLD_ITEM_S };
  if (shopKey.value) say(shopKey.value, t.value.seatScene.vendorThanks);
  say('me', `${item.emoji} ${t.value.seatScene.yummy}`, 2);
  shopLock = shopKey.value;
  shopKey.value = null;
  containerRef.value?.focus({ preventScroll: true });
}

// ── 撈金魚：拋竿等 1.5～4 秒魚上鉤，上鉤後 1.2 秒內要拉 ──
const fishPhase = ref<'idle' | 'waiting' | 'bite' | 'caught' | 'early' | 'missed'>('idle');
const fishCaughtName = ref('');
let fishTimer: number | undefined;
const fishMessage = computed(() => {
  if (fishPhase.value === 'waiting') return t.value.seatScene.fishWaiting;
  if (fishPhase.value === 'bite') return t.value.seatScene.fishBite;
  if (fishPhase.value === 'early') return t.value.seatScene.fishEarly;
  if (fishPhase.value === 'missed') return t.value.seatScene.fishMissed;
  if (fishPhase.value === 'caught') return t.value.seatScene.fishCaught(fishCaughtName.value);
  return '';
});
function castLine(): void {
  if (prefs.value.coins < FISHING_PRICE) return;
  prefs.value.coins -= FISHING_PRICE;
  fishPhase.value = 'waiting';
  say('fisher', t.value.seatScene.fishOwnerCast);
  window.clearTimeout(fishTimer);
  fishTimer = window.setTimeout(() => {
    fishPhase.value = 'bite';
    say('fisher', t.value.seatScene.fishOwnerBite);
    fishTimer = window.setTimeout(() => {
      if (fishPhase.value !== 'bite') return;
      fishPhase.value = 'missed';
      say('fisher', t.value.seatScene.fishOwnerMissed);
    }, 1200);
  }, 1500 + Math.random() * 2500);
}
function pullLine(): void {
  window.clearTimeout(fishTimer);
  if (fishPhase.value === 'waiting') {
    fishPhase.value = 'early';
    say('fisher', t.value.seatScene.fishOwnerEarly);
    return;
  }
  if (fishPhase.value !== 'bite') return;
  let roll = Math.random();
  const fish = FISH.find((f) => (roll -= f.chance) < 0) ?? FISH[0];
  if (!fish) return;
  fishCaughtName.value = fish.name[locale.value];
  fishPhase.value = 'caught';
  say('fisher', t.value.seatScene.fishOwnerCaught[fish.id as 'goldfish' | 'tropicalFish' | 'pufferfish']);
  heldItem = { id: fish.id, until: performance.now() / 1000 + HOLD_ITEM_S };
  say('me', `${fish.emoji}！`, 1.2);
}
function closeFishing(): void {
  window.clearTimeout(fishTimer);
  fishOpen.value = false;
  fishPhase.value = 'idle';
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
  seatedIndex = i;
  walkTarget = null;
  me.x = spot.x;
  me.y = spot.y;
  me.facing = spot.facing;
  shopKey.value = null;
  if (fishOpen.value) closeFishing();
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
  // 站在哪裡前面就打開哪個面板：車站 > 金魚池 > 店家／射氣球 > 攤位
  const atStation = Math.hypot(me.x - STATION_TRIGGER.x, me.y - STATION_TRIGGER.y) < 1.3;
  if (!atStation) stationLock = false;
  stationOpen.value = atStation && !stationLock;
  const atPool = !stationOpen.value && me.x > SL.pool.x0 - 0.3 && me.x < SL.pool.x1 + 0.3 && me.y > SL.pool.y1 + 0.2 && me.y < SL.pool.y1 + 1.6;
  if (atPool && !fishOpen.value) {
    fishOpen.value = true;
    fishPhase.value = 'idle';
    say('fisher', t.value.seatScene.fishOwnerGreet);
  } else if (!atPool && fishOpen.value) closeFishing();
  const door = SL.shopDoors.findIndex((d, i) => me.x > (i === 0 ? QUEUE_HEAD : d.x0 + 0.6) && me.x < d.x1 - 0.6 && me.y < SL.shopLine + 1.1);
  const atMarket = Math.abs(me.x - MARKET_DOOR.x) < 1.2 && me.y > SL.market.y1 && me.y < SL.market.y1 + 1.4;
  const atBalloon = me.x > SL.balloon.x0 + 0.4 && me.x < SL.balloon.x1 - 0.4 && me.y > SL.balloon.counterY + 0.5 && me.y < SL.balloon.counterY + 2;
  const stall = me.y > SL.counterY + 0.5 && me.y < SL.counterY + 2.3 ? SHILIN_STALLS.findIndex((_, i) => Math.abs(me.x - stallCenter(i)) < 1.05) : -1;
  const here = door >= 0 ? `shop:${door}` : atMarket ? 'shop:2' : atBalloon ? 'balloon' : stall >= 0 ? `stall:${stall}` : null;
  if (here !== shopLock) shopLock = null;
  const next = !stationOpen.value && !fishOpen.value && here !== shopLock ? here : null;
  if (next !== null && next !== shopKey.value && !prefs.value.doNotDisturb) say(next, shopFor(next)?.call[locale.value] ?? '');
  shopKey.value = next;
}

// 老闆們偶爾吆喝一聲（勿擾、專注中不吵）
let lastShout = 0;
function updateShouts(seconds: number): void {
  if (props.disabled || prefs.value.doNotDisturb || seconds - lastShout < 7) return;
  lastShout = seconds;
  const pick = Math.floor(Math.random() * (SHILIN_STALLS.length + 2));
  if (pick === SHILIN_STALLS.length) say('fisher', t.value.seatScene.fishOwnerShout);
  else if (pick === SHILIN_STALLS.length + 1) say('balloon', BALLOON_GAME.call[locale.value]);
  else say(`stall:${pick}`, SHILIN_STALLS[pick]?.call[locale.value] ?? '');
}

// ── 路人（用時間算的裝飾）：在攤位前的走道、河邊人行道（劍潭站東邊）來回逛 ──
const WALKERS = Array.from({ length: 18 }, (_, i) => {
  const r = seeded(i * 17 + 3);
  const lane = i % 6;
  const ys = [14.8, 15.6, 16.4, 17.2, 17.9, 29.1];
  return {
    y: (ys[lane] ?? 12) + r() * 0.3,
    x0: lane === 5 ? 18.6 + r() * 3 : 0.8 + r() * 4,
    x1: lane === 5 ? 44 + r() * 6 : 30 + r() * 5,
    speed: 0.45 + r() * 0.5,
    phase: r(),
    colors: lookColors(Math.floor(r() * 5), Math.floor(r() * 7), { body: r() < 0.5 ? 1 : 0 }),
  };
}).concat(
  // 逛廟埕的人
  [17, 18.4, 19.8].map((y, i) => {
    const r = seeded(i * 41 + 100);
    return { y, x0: 37 + r() * 2, x1: 48 + r() * 3, speed: 0.35 + r() * 0.3, phase: r(), colors: lookColors(Math.floor(r() * 5), Math.floor(r() * 7), { body: r() < 0.5 ? 1 : 0 }) };
  }),
);
function walkerPos(w: (typeof WALKERS)[number], seconds: number): { x: number; dir: 1 | -1 } {
  const span = w.x1 - w.x0;
  const tt = ((seconds * w.speed) / span + w.phase) % 2;
  return tt < 1 ? { x: w.x0 + tt * span, dir: 1 } : { x: w.x1 - (tt - 1) * span, dir: -1 };
}

// ── 老闆（每攤一個，面向客人）──
const OWNERS = SHILIN_STALLS.map((_, i) => {
  const r = seeded(i * 29 + 11);
  return getAvatarFrame(lookColors(Math.floor(r() * 5), 4 + Math.floor(r() * 3), { body: r() < 0.5 ? 1 : 0 }), 'down', 'idle');
});
const BALLOON_OWNER = getAvatarFrame(lookColors(3, 2, { body: 1 }), 'down', 'idle');

// ── 畫 ──
let ctx: CanvasRenderingContext2D | null = null;
let ground: HTMLCanvasElement | null = null;
// 底圖用幾倍畫：畫面放大倍數 × 螢幕像素（變了就重畫），招牌的字和線條才清楚
let groundRes = 1;
const view = { scale: 2, ox: 0, oy: 0 };

function paintGround(): HTMLCanvasElement {
  const { canvas, c } = layerCanvas(W * T, H * T, groundRes);
  if (c) paintShilinGround(c);
  return canvas;
}

function drawSeated(c: CanvasRenderingContext2D, i: number, seconds: number): void {
  const spot = SEAT_SPOTS[i];
  if (!spot) return;
  drawPlasticStool(c, spot.x, spot.y);
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

// 撈金魚的老闆：小板凳、斗笠、手上的網子
function drawFishOwner(c: CanvasRenderingContext2D): void {
  const x = Math.round(FISH_OWNER.x * T);
  const y = Math.round(FISH_OWNER.y * T) + 5;
  px(c, '#7a5236', x - 5, y - 4, 10, 4);
  const busy = fishPhase.value === 'waiting' || fishPhase.value === 'bite';
  c.drawImage(getAvatarFrame(FISH_OWNER_COLORS, busy ? 'left' : 'down', 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y - 2 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
  px(c, '#d9b97f', x - 8, y - 20, 16, 2);
  px(c, '#d9b97f', x - 5, y - 22, 10, 2);
  px(c, '#d9b97f', x - 2, y - 24, 4, 2);
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

// 對話泡泡（白底、尖角朝下）
function bubble(c: CanvasRenderingContext2D, text: string, cx: number, bottom: number): void {
  c.font = '700 12px system-ui, -apple-system, "PingFang TC", sans-serif';
  const width = Math.min(220, pillTextWidth(c, text) + 16);
  const height = 22;
  const x = Math.round(cx - width / 2);
  const y = Math.round(bottom - height - 6);
  c.fillStyle = '#ffffff';
  c.strokeStyle = '#3b2a20';
  c.lineWidth = 2;
  c.beginPath();
  c.roundRect(x, y, width, height, 6);
  c.fill();
  c.stroke();
  c.beginPath();
  c.moveTo(cx - 4, y + height);
  c.lineTo(cx, y + height + 6);
  c.lineTo(cx + 4, y + height);
  c.fillStyle = '#ffffff';
  c.fill();
  c.fillStyle = '#3b2a20';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  fillPillText(c, text, cx, y + height / 2 + 0.5);
}

// 泡泡冒在誰頭上（格座標）
function bubbleAnchor(key: string): { x: number; y: number } | null {
  if (key === 'me') return { x: me.x, y: me.y - 1.6 };
  if (key === 'fisher') return { x: FISH_OWNER.x, y: FISH_OWNER.y - 2.6 };
  if (key === 'balloon') return { x: (SL.balloon.x0 + SL.balloon.x1) / 2, y: SL.balloon.top - 2.4 };
  if (key.startsWith('stall:')) return { x: stallCenter(Number(key.slice(6))), y: SL.stallTop - 2.6 };
  if (key === 'shop:2') return { x: MARKET_DOOR.x, y: SL.market.y1 - 4.4 };
  if (key.startsWith('shop:')) {
    const d = SL.shopDoors[Number(key.slice(5))];
    return d ? { x: (d.x0 + d.x1) / 2, y: SL.shopLine - 0.6 } : null;
  }
  return null;
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
  drawRiverShimmer(c, seconds);

  const items: { y: number; draw: () => void }[] = [];
  for (const b of SHOPHOUSES) items.push({ y: SL.shopLine, draw: () => drawShophouse(c, b) });
  items.push({ y: SL.temple.y1, draw: () => drawTemple(c, seconds) });
  items.push({ y: SL.burner.y, draw: () => drawBurner(c, seconds) });
  const bobber = fishPhase.value === 'waiting' || fishPhase.value === 'bite' ? fishPhase.value : 'none';
  items.push({ y: SL.pool.y0, draw: () => drawFishPool(c, seconds, bobber) });
  items.push({ y: FISH_OWNER.y, draw: () => drawFishOwner(c) });
  items.push({ y: SL.balloon.counterY, draw: () => drawBalloonBooth(c, seconds, BALLOON_OWNER) });
  SHILIN_STALLS.forEach((stall, i) => items.push({ y: SL.counterY, draw: () => drawStall(c, i, stall, seconds, OWNERS[i] ?? null) }));
  items.push({ y: SL.market.y1, draw: () => drawMarket(c, seconds) });
  SL.tables.forEach((cx, i) => items.push({ y: SL.tableY + 1.4, draw: () => drawFoldingTable(c, cx, i * 13 + 7) }));
  items.push({ y: SL.gateSign.y, draw: () => drawGateSign(c, seconds) });
  for (const s of PARKED_SCOOTERS) items.push({ y: SCOOTER_ROW_Y, draw: () => drawParkedScooter(c, s.x, s.color) });
  for (const tr of TREES) items.push({ y: tr.y, draw: () => drawTree(c, tr.x, tr.y) });
  for (const l of LAMPS) items.push({ y: l.y, draw: () => drawStreetLamp(c, l.x, l.y) });
  items.push({ y: SL.station.y1, draw: () => drawStation(c, seconds) });
  for (const q of QUEUE) items.push({ y: q.y, draw: () => drawPerson(c, q.x, q.y, q.colors, 'right', false, 0) });
  for (const v of VEHICLES) {
    const p = vehiclePos(v, seconds);
    items.push({ y: p.y, draw: () => drawRoadVehicle(c, v.kind, p.x, p.y, p.dir, v.color, v.rider) });
  }
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y, draw: () => drawSeated(c, i, seconds) }));
  for (const w of WALKERS) {
    const p = walkerPos(w, seconds);
    items.push({ y: w.y, draw: () => drawPerson(c, p.x, w.y, w.colors, p.dir > 0 ? 'right' : 'left', true, seconds + w.phase) });
  }
  if (seatedIndex === null) items.push({ y: me.y + 0.35, draw: () => drawPerson(c, me.x, me.y, lookColors(prefs.value.hair, prefs.value.shirt, prefs.value), me.facing, me.moving, me.walkClock) });
  for (const other of shownRemotes) items.push({ y: other.y + 0.35, draw: () => drawPerson(c, other.x, other.y, remoteColors(other.remote), other.remote.facing, other.remote.moving, seconds) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  // 手上拿的小吃
  ctx.font = `${Math.round(9 * scale)}px system-ui, "Apple Color Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const mine = heldItemNow();
  if (mine && seatedIndex === null) {
    const p = screen(me.x + 0.45, me.y - 0.55);
    ctx.fillText(SHOP_ITEM_EMOJI[mine], p.x, p.y);
  }
  for (const other of shownRemotes) {
    if (!other.remote.item) continue;
    const p = screen(other.x + 0.45, other.y - 0.55);
    ctx.fillText(SHOP_ITEM_EMOJI[other.remote.item], p.x, p.y);
  }
  // 名牌
  const sp = screen(STATION_TRIGGER.x, SL.station.y0 - 2.2);
  pill(ctx, `🚇 ${t.value.shilin.station}`, sp.x, sp.y, '#fbbf24');
  const tp = screen((SL.temple.x0 + SL.temple.x1) / 2, SL.temple.y1 + 0.2);
  pill(ctx, `🙏 ${t.value.shilin.temple}`, tp.x, tp.y, '#f2c14e');
  const fp = screen(FISH_OWNER.x - 1.4, SL.pool.y0 - 0.6);
  pill(ctx, t.value.seatScene.fishOwnerName, fp.x, fp.y, '#38bdf8');
  SL.shopDoors.forEach((d, i) => {
    const p = screen((d.x0 + d.x1) / 2, SL.shopLine + 0.2);
    pill(c, `🛍️ ${SHILIN_SHOPS[i]?.name[locale.value] ?? ''}`, p.x, p.y, '#94a3b8');
  });
  const mp = screen(MARKET_DOOR.x, SL.market.y1 + 0.1);
  pill(ctx, `🛍️ ${SHILIN_SHOPS[2]?.name[locale.value] ?? ''}`, mp.x, mp.y, '#94a3b8');
  if (seatedIndex === null) {
    const p = screen(me.x, me.y - 1);
    pill(ctx, t.value.common.meLabel, p.x, p.y, '#fbbf24');
  }
  for (const other of shownRemotes) {
    const p = screen(other.x, other.y - 1);
    pill(ctx, remoteLabel(other), p.x, p.y, '#2dd4bf');
  }
  SEAT_SPOTS.forEach((spot, i) => {
    const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
    if (!mate) return;
    const p = screen(spot.x, spot.y - 1.4);
    pill(c, mate.displayName, p.x, p.y, '#2dd4bf');
  });
  const now = performance.now() / 1000;
  for (const [key, b] of bubbles) {
    if (now > b.until) {
      bubbles.delete(key);
      continue;
    }
    const at = bubbleAnchor(key);
    if (!at) continue;
    const p = screen(at.x, at.y);
    bubble(ctx, b.text, p.x, p.y);
  }
}

let rafId = 0;
let last = 0;
function frame(time: number): void {
  rafId = requestAnimationFrame(frame);
  const seconds = time / 1000;
  const dt = last ? Math.min(0.05, seconds - last) : 0;
  last = seconds;
  updateWalk(dt);
  updateShouts(seconds);
  shownRemotes = viewRemotes(props.remotePlayers, 'shilin', dt);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const item = heldItemNow();
  rememberScene('shilin', positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: 'shilin', ...(item ? { item } : {}) }
      : { x: r2(me.x), y: r2(me.y), facing: me.facing, moving: me.moving, scene: 'shilin', ...(item ? { item } : {}) },
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
    if (stationOpen.value) emit('leave');
    else if (fishOpen.value) {
      if (fishPhase.value === 'waiting' || fishPhase.value === 'bite') pullLine();
      else castLine();
    } else if (seatedIndex !== null) standUp();
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

// 點紅色塑膠椅：走過去坐
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
  // 分享連結：站到朋友旁邊；坐過的位子就坐回去；不然站在劍潭站出口
  const arrival = takeArrival('shilin');
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
  window.clearTimeout(fishTimer);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', clearKeys);
});
</script>
