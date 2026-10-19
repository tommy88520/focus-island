<template>
  <!-- 基隆廟口夜市（獨立地圖，搭捷運過來）：仁三路的攤位買小吃、坐小板凳專注、奠濟宮求籤；雨都會不時下雨。
       同房間也在這裡的人看得到彼此（手上拿的小吃也看得到） -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#16161d] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <ProfileCard v-if="profilePerson" :person="profilePerson" @close="profilePerson = null" @whisper="whisperTo" />

      <!-- 攤位、店家：買小吃 -->
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

      <!-- 奠濟宮：求籤 -->
      <div v-else-if="templeOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 px-4 py-3 text-center" @click.stop>
        <p class="!mb-1 text-sm font-black">🙏 {{ t.miaokou.templeTitle }}</p>
        <p v-if="fortune" class="!mb-2 text-xs font-bold leading-relaxed">
          <span class="text-[color:var(--px-accent-dark)] dark:!text-amber-300">{{ fortune.rank[locale] }}</span>&nbsp;&nbsp;{{ fortune.text[locale] }}
        </p>
        <p v-else class="!mb-2 text-[11px] text-[color:var(--px-muted)]">{{ t.miaokou.templeHint }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-5 text-xs" :disabled="fortuneCooldown" @click="drawFortune">{{ fortune ? t.miaokou.drawAgain : t.miaokou.draw }}</button>
      </div>

      <!-- 回程的車站 -->
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
    <SceneHint :text="isTouch ? t.miaokou.hintTouch : t.miaokou.hintDesktop" />

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
import { SHOP_ITEM_EMOJI, type ShopItem, type ShopItemId } from 'src/pages/index/pixel/pixelWorld';
import { MIAOKOU_SEATS, MIAOKOU_SHOPS, MIAOKOU_STALLS, MK, stallCenter } from 'src/pages/index/pixel/miaokou';
import {
  drawBurner,
  drawGateSign,
  drawGoldFurnace,
  drawHarbor,
  drawHarborLamp,
  drawIncense,
  drawRoadVehicle,
  drawStoneLion,
  drawLanternString,
  drawMiaokouStation,
  drawRain,
  drawShophouse,
  drawStall,
  drawTemple,
  drawTempleBench,
  drawUmbrella,
  paintMiaokouGround,
  SHOPHOUSES,
} from 'src/pages/index/pixel/miaokouArt';

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
const W = MK.W;
const H = MK.H;
const SEAT_SPOTS = MIAOKOU_SEATS;
const STALL_X1 = MK.stallX0 + MK.stallW * MIAOKOU_STALLS.length;
const STATION_TRIGGER = { x: (MK.station.x0 + MK.station.x1) / 2, y: MK.station.y1 + 0.8 };
const BENCHES = [39.5, 44.5];
// 廟埕上空橫過走道的紅燈籠串、仁三路上的燈籠串
const LANTERN_STRINGS: [number, number, number][] = [
  [36, 42, 11.4],
  [42, 47.6, 11.4],
];

const HARBOR_LAMPS = [7.5, 14.5, 21.5, 28.5].map((x) => ({ x, y: MK.promenadeY + 0.5 }));
const LION_Y = MK.temple.y1 + 0.35;
// 馬路上的車（用時間算的裝飾）：上面車道往西、下面車道往東
const VEHICLES = [
  { kind: 'scooter' as const, lane: 0, speed: 3.2, phase: 0, color: '#e25a4a', rider: '#3b82f6' },
  { kind: 'scooter' as const, lane: 0, speed: 2.7, phase: 0.45, color: '#f2f2f2', rider: '#f6c945' },
  { kind: 'taxi' as const, lane: 0, speed: 4, phase: 0.75, color: '', rider: '' },
  { kind: 'scooter' as const, lane: 1, speed: 3, phase: 0.2, color: '#3b82f6', rider: '#2bb673' },
  { kind: 'taxi' as const, lane: 1, speed: 3.6, phase: 0.6, color: '', rider: '' },
  { kind: 'scooter' as const, lane: 1, speed: 2.5, phase: 0.9, color: '#8bd3c7', rider: '#e25a4a' },
];
function vehiclePos(v: (typeof VEHICLES)[number], seconds: number): { x: number; y: number; dir: 1 | -1 } {
  const span = W + 6;
  const k = ((seconds * v.speed) / span + v.phase) % 1;
  return v.lane === 0 ? { x: W + 3 - k * span, y: MK.roadY + 0.75, dir: -1 } : { x: -3 + k * span, y: MK.roadY + 2.05, dir: 1 };
}
// 拜拜的人（裝飾，面向廟）
const WORSHIPPERS = MK.worshippers.map((w, i) => ({ ...w, colors: lookColors(2 + i, 5 + i, { body: i % 2 }) }));

const inRect = (x: number, y: number, x0: number, y0: number, x1: number, y1: number) => x > x0 && x < x1 && y > y0 && y < y1;
const blocked = (x: number, y: number) =>
  x < 0.5 || x > W - 0.5 || y < 0.5 || y > H - 0.5 ||
  (y < MK.shopLine - 0.25 && x < MK.temple.x0 - 1.4) ||
  inRect(x, y, MK.stallX0 - 0.2, MK.stallTop - 0.2, STALL_X1 + 0.2, MK.counterY + 0.55) ||
  SEAT_SPOTS.some((s) => Math.abs(x - s.x) < 0.42 && Math.abs(y - s.y) < 0.4) ||
  inRect(x, y, MK.temple.x0, 0, MK.temple.x1, MK.temple.y1 - 0.1) ||
  inRect(x, y, MK.burner.x - 0.7, MK.burner.y - 0.5, MK.burner.x + 0.7, MK.burner.y + 0.2) ||
  BENCHES.some((b) => inRect(x, y, b - 1.15, 16.35, b + 1.15, 16.75)) ||
  y > MK.waterY - 0.55 ||
  inRect(x, y, MK.hill.x0 + 1, MK.hill.y0 + 1.2, W, H) ||
  inRect(x, y, MK.station.x0, MK.station.y0, MK.station.x1, MK.station.y1) ||
  MK.lions.some((lx) => inRect(x, y, lx - 0.6, LION_Y - 0.5, lx + 0.6, LION_Y + 0.1)) ||
  inRect(x, y, MK.furnace.x - 0.7, MK.furnace.y - 0.6, MK.furnace.x + 0.7, MK.furnace.y + 0.1) ||
  WORSHIPPERS.some((w) => Math.abs(x - w.x) < 0.35 && Math.abs(y - w.y) < 0.3) ||
  [MK.gateSign.x0 + 0.2, MK.gateSign.x1 - 0.2].some((gx) => Math.abs(x - gx) < 0.25 && Math.abs(y - MK.gateSign.y) < 0.25) ||
  HARBOR_LAMPS.some((l) => Math.abs(x - l.x) < 0.25 && Math.abs(y - l.y) < 0.25);

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

// ── 現在站在哪裡前面：攤位、店家、香爐、車站（同時只開一個面板）──
const stallAt = ref<number | null>(null);
const shopAt = ref<number | null>(null);
const templeOpen = ref(false);
const stationOpen = ref(false);
// 買完東西：先走開才會再跳出同一攤
let shopLock: string | null = null;
const shop = computed(() => (stallAt.value !== null ? MIAOKOU_STALLS[stallAt.value] : shopAt.value !== null ? MIAOKOU_SHOPS[shopAt.value] : null) ?? null);

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
  if (stallAt.value !== null) say(`stall:${stallAt.value}`, t.value.seatScene.vendorThanks);
  say('me', `${item.emoji} ${t.value.seatScene.yummy}`, 2);
  shopLock = stallAt.value !== null ? `stall:${stallAt.value}` : `shop:${shopAt.value}`;
  stallAt.value = null;
  shopAt.value = null;
  containerRef.value?.focus({ preventScroll: true });
}

// ── 求籤 ──
const FORTUNES = [
  { rank: { 'zh-TW': '上上籤', 'en-US': 'Supreme luck' }, text: { 'zh-TW': '今天專注力滿點，番茄鐘一顆接一顆！', 'en-US': 'Focus is maxed out today, one pomodoro after another!' } },
  { rank: { 'zh-TW': '大吉', 'en-US': 'Great luck' }, text: { 'zh-TW': '考運亨通，想做的事都會順利。', 'en-US': 'Exams go well, and what you set out to do will work out.' } },
  { rank: { 'zh-TW': '上籤', 'en-US': 'Good luck' }, text: { 'zh-TW': '遇到瓶頸就休息一下，回來就通了。', 'en-US': 'Stuck? Take a break and it will click.' } },
  { rank: { 'zh-TW': '上籤', 'en-US': 'Good luck' }, text: { 'zh-TW': '跟朋友一起讀，效率加倍。', 'en-US': 'Study with a friend and get twice as much done.' } },
  { rank: { 'zh-TW': '中籤', 'en-US': 'Fair luck' }, text: { 'zh-TW': '先把手機放遠一點，運勢會更好。', 'en-US': 'Put your phone away and your luck improves.' } },
  { rank: { 'zh-TW': '中吉', 'en-US': 'Fair luck' }, text: { 'zh-TW': '記得多喝水，配一碗鼎邊趖更好。', 'en-US': 'Drink more water, and a bowl of ding bian cuo helps.' } },
  { rank: { 'zh-TW': '小吉', 'en-US': 'Small luck' }, text: { 'zh-TW': '今天早點睡，明天會更專心。', 'en-US': 'Sleep early tonight and focus better tomorrow.' } },
];
const fortune = ref<(typeof FORTUNES)[number] | null>(null);
const fortuneCooldown = ref(false);
function drawFortune(): void {
  if (fortuneCooldown.value) return;
  fortune.value = FORTUNES[Math.floor(Math.random() * FORTUNES.length)] ?? null;
  fortuneCooldown.value = true;
  window.setTimeout(() => {
    fortuneCooldown.value = false;
  }, 2500);
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
  stallAt.value = null;
  shopAt.value = null;
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
  const spot = seatedIndex === null ? null : SEAT_SPOTS[seatedIndex];
  seatedIndex = null;
  if (spot) {
    me.x = spot.x;
    me.y = spot.y + 0.9;
  }
}

function nearestSeat(): number | null {
  let best: number | null = null;
  let bestDist = 1.6;
  SEAT_SPOTS.forEach((spot, i) => {
    const d = Math.hypot(me.x - spot.x, me.y - (spot.y + 0.9));
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
      y = spot.y + 0.9 - me.y;
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
  // 站在哪裡前面就打開哪個面板：車站 > 香爐 > 店家 > 攤位
  const atStation = Math.hypot(me.x - STATION_TRIGGER.x, me.y - STATION_TRIGGER.y) < 1.3;
  if (!atStation) stationLock = false;
  stationOpen.value = atStation && !stationLock;
  templeOpen.value = !stationOpen.value && Math.hypot(me.x - MK.burner.x, me.y - (MK.burner.y + 0.9)) < 1.5;
  if (!templeOpen.value) fortune.value = null;
  const door = MK.shopDoors.findIndex((d) => me.x > d.x0 + 0.6 && me.x < d.x1 - 0.6 && me.y < MK.shopLine + 1.1);
  const stall = me.y > MK.counterY + 0.5 && me.y < MK.counterY + 2.3 ? MIAOKOU_STALLS.findIndex((_, i) => Math.abs(me.x - stallCenter(i)) < 1.05) : -1;
  const here = door >= 0 ? `shop:${door}` : stall >= 0 ? `stall:${stall}` : null;
  if (here !== shopLock) shopLock = null;
  const free = !stationOpen.value && !templeOpen.value && here !== null && here !== shopLock;
  const nextShop = free && door >= 0 ? door : null;
  const nextStall = free && door < 0 && stall >= 0 ? stall : null;
  if (nextStall !== null && nextStall !== stallAt.value) say(`stall:${nextStall}`, MIAOKOU_STALLS[nextStall]?.call[locale.value] ?? '');
  shopAt.value = nextShop;
  stallAt.value = nextStall;
}

// ── 路人（用時間算的裝飾）：沿著攤位前後的走道來回走，下雨就撐傘 ──
const WALKERS = Array.from({ length: 12 }, (_, i) => {
  const r = seeded(i * 13 + 5);
  const lane = i % 3;
  return {
    y: lane === 0 ? 8.5 + r() * 0.6 : lane === 1 ? 14.4 + r() * 0.8 : 16.4 + r() * 0.6,
    x0: 1.5 + r() * 4,
    x1: 30 + r() * 4,
    speed: 0.5 + r() * 0.5,
    phase: r(),
    colors: lookColors(Math.floor(r() * 5), Math.floor(r() * 4), { body: r() < 0.5 ? 1 : 0 }),
    umbrella: ['#e25a4a', '#3b82f6', '#f6c945', '#2bb673', '#f4f4f4', '#ff6fb5'][Math.floor(r() * 6)] ?? '#3b82f6',
  };
});
function walkerPos(w: (typeof WALKERS)[number], seconds: number): { x: number; dir: 1 | -1 } {
  const span = w.x1 - w.x0;
  const tt = ((seconds * w.speed) / span + w.phase) % 2;
  return tt < 1 ? { x: w.x0 + tt * span, dir: 1 } : { x: w.x1 - (tt - 1) * span, dir: -1 };
}

// 下雨：大概一半的時間在下（用真實時間算，大家看到的一樣）
function rainStrength(): number {
  const tt = Date.now() / 1000;
  return Math.max(0, Math.min(1, (Math.sin(tt / 80) + 0.1) * 1.6));
}

// ── 老闆（每攤一個，面向客人）──
const OWNERS = MIAOKOU_STALLS.map((_, i) => {
  const r = seeded(i * 31 + 9);
  return getAvatarFrame(lookColors(Math.floor(r() * 5), 4 + Math.floor(r() * 3), { body: r() < 0.5 ? 1 : 0 }), 'down', 'idle');
});

// ── 畫 ──
let ctx: CanvasRenderingContext2D | null = null;
let ground: HTMLCanvasElement | null = null;
const view = { scale: 2, ox: 0, oy: 0 };

function paintGround(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = W * T;
  canvas.height = H * T;
  const c = canvas.getContext('2d');
  if (c) paintMiaokouGround(c);
  return canvas;
}

function drawSeated(c: CanvasRenderingContext2D, i: number, seconds: number): void {
  const spot = SEAT_SPOTS[i];
  if (!spot) return;
  const x = Math.round(spot.x * T);
  const y = Math.round(spot.y * T);
  // 前 12 個是紅色塑膠小板凳，後面是廟埕長椅（另外畫）
  if (i < 12) {
    px(c, 'rgba(0,0,0,0.3)', x - 5, y + 2, 11, 2);
    px(c, '#c62828', x - 5, y - 4, 10, 3);
    px(c, '#e53935', x - 5, y - 4, 10, 1);
    px(c, '#a32020', x - 4, y - 1, 2, 4);
    px(c, '#a32020', x + 2, y - 1, 2, 4);
  }
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

function drawPerson(c: CanvasRenderingContext2D, x: number, y: number, colors: ReturnType<typeof lookColors>, facing: 'up' | 'down' | 'left' | 'right', moving: boolean, clock: number): void {
  const frame = moving ? (Math.floor(clock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  px(c, 'rgba(0,0,0,0.25)', Math.round(x * T - 5), Math.round(y * T + 3), 10, 2);
  c.drawImage(getAvatarFrame(colors, facing, frame), Math.round(x * T - AVATAR_SIZE.w / 2), Math.round(y * T + 5 - AVATAR_SIZE.h));
}

function drawWaterShimmer(c: CanvasRenderingContext2D, seconds: number): void {
  const wy = MK.waterY * T;
  for (let i = 0; i < 70; i += 1) {
    const fx = (i * 97.3 + seconds * (6 + (i % 5))) % (W * T);
    const fy = (i * 37.1) % ((H - MK.waterY) * T - 6);
    const a = 0.12 + 0.12 * Math.sin(seconds * 1.5 + i);
    px(c, i % 3 === 0 ? `rgba(255, 190, 120, ${a})` : `rgba(140, 190, 255, ${a})`, Math.round(fx), Math.round(wy + 3 + fy), 6 + (i % 4) * 2, 1);
  }
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
  // 左上角有一排按鈕：地圖最上緣可以再往下捲一點
  const TOP_PAD = 52;
  const followY = (size: number, world: number, at: number) => (world <= size - TOP_PAD ? (size - world + TOP_PAD) / 2 : Math.min(TOP_PAD, Math.max(size - world, size / 2 - at)));
  const oy = Math.round(followY(cssH, H * T * scale, (me.y - 1.5) * T * scale) * dpr) / dpr;
  Object.assign(view, { scale, ox, oy });
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  if (ground) ctx.drawImage(ground, 0, 0);
  const c = ctx;
  drawWaterShimmer(c, seconds);
  drawHarbor(c, seconds);
  const rain = rainStrength();

  const items: { y: number; draw: () => void }[] = [];
  for (const b of SHOPHOUSES) items.push({ y: MK.shopLine, draw: () => drawShophouse(c, b) });
  items.push({ y: MK.temple.y1, draw: () => drawTemple(c, seconds) });
  items.push({ y: MK.burner.y, draw: () => drawBurner(c, seconds) });
  BENCHES.forEach((b) => items.push({ y: 16.55, draw: () => drawTempleBench(c, b, 16.55) }));
  for (const [x0, x1, y] of LANTERN_STRINGS) items.push({ y, draw: () => drawLanternString(c, x0, x1, y, seconds) });
  MIAOKOU_STALLS.forEach((stall, i) => items.push({ y: MK.counterY, draw: () => drawStall(c, i, stall, seconds, (k) => OWNERS[k] ?? null) }));
  items.push({ y: MK.station.y1, draw: () => drawMiaokouStation(c) });
  MK.lions.forEach((lx, i) => items.push({ y: LION_Y, draw: () => drawStoneLion(c, lx, LION_Y, i === 1) }));
  items.push({ y: MK.furnace.y, draw: () => drawGoldFurnace(c, MK.furnace.x, MK.furnace.y, seconds) });
  for (const w of WORSHIPPERS) {
    items.push({
      y: w.y,
      draw: () => {
        drawPerson(c, w.x, w.y, w.colors, 'up', false, 0);
        drawIncense(c, w.x, w.y, seconds);
      },
    });
  }
  items.push({ y: MK.gateSign.y, draw: () => drawGateSign(c) });
  for (const l of HARBOR_LAMPS) items.push({ y: l.y, draw: () => drawHarborLamp(c, l.x, l.y) });
  for (const v of VEHICLES) {
    const p = vehiclePos(v, seconds);
    items.push({ y: p.y, draw: () => drawRoadVehicle(c, v.kind, p.x, p.y, p.dir, v.color, v.rider) });
  }
  SEAT_SPOTS.forEach((spot, i) => items.push({ y: spot.y, draw: () => drawSeated(c, i, seconds) }));
  for (const w of WALKERS) {
    const p = walkerPos(w, seconds);
    items.push({
      y: w.y,
      draw: () => {
        drawPerson(c, p.x, w.y, w.colors, p.dir > 0 ? 'right' : 'left', true, seconds + w.phase);
        if (rain > 0.3) drawUmbrella(c, Math.round(p.x * T), Math.round(w.y * T) - 20, w.umbrella);
      },
    });
  }
  if (seatedIndex === null) items.push({ y: me.y + 0.35, draw: () => drawPerson(c, me.x, me.y, lookColors(prefs.value.hair, prefs.value.shirt, prefs.value), me.facing, me.moving, me.walkClock) });
  for (const other of shownRemotes) items.push({ y: other.y + 0.35, draw: () => drawPerson(c, other.x, other.y, remoteColors(other.remote), other.remote.facing, other.remote.moving, seconds) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

  // 雨（螢幕座標，蓋在地圖上面）
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawRain(ctx, cssW, cssH, seconds, rain);

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
  const sp = screen(STATION_TRIGGER.x, MK.station.y0 - 0.6);
  pill(ctx, `🚇 ${t.value.miaokou.station}`, sp.x, sp.y, '#fbbf24');
  const tp = screen(MK.burner.x, MK.burner.y - 2.5);
  pill(ctx, `🙏 ${t.value.miaokou.templeTitle}`, tp.x, tp.y, '#f2c14e');
  MK.shopDoors.forEach((d, i) => {
    const p = screen((d.x0 + d.x1) / 2, MK.shopLine + 0.2);
    pill(c, `🛍️ ${MIAOKOU_SHOPS[i]?.name[locale.value] ?? ''}`, p.x, p.y, '#94a3b8');
  });
  if (seatedIndex === null) {
    const mp = screen(me.x, me.y - 1);
    pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
  }
  for (const other of shownRemotes) {
    const op = screen(other.x, other.y - 1);
    pill(ctx, remoteLabel(other), op.x, op.y, '#2dd4bf');
  }
  SEAT_SPOTS.forEach((spot, i) => {
    const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
    if (!mate) return;
    const p = screen(spot.x, spot.y - 1.4);
    pill(c, mate.displayName, p.x, p.y, '#2dd4bf');
  });
  // 對話泡泡：老闆在攤位上方，自己在頭上
  const now = performance.now() / 1000;
  for (const [key, b] of bubbles) {
    if (now > b.until) {
      bubbles.delete(key);
      continue;
    }
    const at = key === 'me' ? screen(me.x, me.y - 1.6) : key.startsWith('stall:') ? screen(stallCenter(Number(key.slice(6))), MK.stallTop - 2.4) : null;
    if (at) bubble(ctx, b.text, at.x, at.y);
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
  shownRemotes = viewRemotes(props.remotePlayers, 'miaokou', dt);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const item = heldItemNow();
  rememberScene('miaokou', positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: 'miaokou', ...(item ? { item } : {}) }
      : { x: r2(me.x), y: r2(me.y), facing: me.facing, moving: me.moving, scene: 'miaokou', ...(item ? { item } : {}) },
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
    else if (templeOpen.value) drawFortune();
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

// 點小板凳、長椅：走過去坐
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
  // 分享連結：站到朋友旁邊；坐過的位子就坐回去；不然站在車站出口
  const arrival = takeArrival('miaokou');
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
