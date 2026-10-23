<template>
  <!-- 台灣各城市的指標地圖（獨立地圖，從台北車站搭高鐵過來）：每個城市的場地、美術在 pixel/ 底下的城市檔，這裡是共用的玩法——
       走路、坐下專注、買小吃、抽籤、看地標介紹、搭車回台北或去別的城市；同房間在這裡的人看得到彼此 -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] outline-none lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      :style="{ touchAction: 'pan-y', background: city.background }"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <ProfileCard v-if="profilePerson" :person="profilePerson" @close="profilePerson = null" @whisper="whisperTo" />

      <!-- 店家、攤位：買東西 -->
      <div v-if="shop" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 px-4 py-3" @click.stop>
        <p class="!mb-0 text-sm font-black">🛍️ {{ shop.name[locale] }}</p>
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

      <!-- 抽籤 -->
      <div v-else-if="fortuneOpen && city.fortune" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 px-4 py-3 text-center" @click.stop>
        <p class="!mb-1 text-sm font-black">🙏 {{ city.fortune.title[locale] }}</p>
        <p v-if="fortune" class="!mb-2 text-xs font-bold leading-relaxed">
          <span class="text-[color:var(--px-accent-dark)] dark:!text-amber-300">{{ fortune.rank[locale] }}</span>&nbsp;&nbsp;{{ fortune.text[locale] }}
        </p>
        <p v-else class="!mb-2 text-[11px] text-[color:var(--px-muted)]">{{ city.fortune.hint[locale] }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-5 text-xs" :disabled="fortuneCooldown" @click="drawFortune">{{ fortune ? city.fortune.again[locale] : city.fortune.draw[locale] }}</button>
      </div>

      <!-- 地標介紹 -->
      <div v-else-if="info" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(22rem,calc(100%-1.5rem))] -translate-x-1/2 px-4 py-3" @click.stop>
        <div class="!flex !flex-nowrap items-start justify-between gap-2">
          <p class="!mb-1 text-sm font-black">📍 {{ info.title[locale] }}</p>
          <button type="button" class="text-[color:var(--px-muted)]" :aria-label="t.seatScene.profileClose" @click="closeInfo">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <p class="!mb-0 text-xs leading-relaxed">{{ info.text[locale] }}</p>
      </div>

      <!-- 車站：回台北、去別的城市 -->
      <div v-else-if="stationOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(24rem,calc(100%-1rem))] -translate-x-1/2 px-3 pb-3 pt-3 text-center" @click.stop>
        <p class="!mb-2 !text-[11px] font-black">🚄 {{ t.city.stationPrompt(city.station.name[locale]) }}</p>
        <div class="!flex flex-wrap justify-center gap-1.5">
          <button type="button" class="pixel-btn pixel-btn--primary h-9 whitespace-nowrap px-3 text-xs" @click="emit('leave')">🚉 {{ t.city.backToTaipei }}</button>
          <button v-for="other in otherCities" :key="other.id" type="button" class="pixel-btn h-9 whitespace-nowrap px-3 text-xs" @click="emit('go', other.id)">{{ other.emoji }} {{ other.stop[locale] }}</button>
        </div>
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
    <SceneHint :text="isTouch ? city.hintTouch[locale] : city.hintDesktop[locale]" />

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
import { px, seeded, pillTextWidth, fillPillText, canvasDpr, drawLayer, layerCanvas } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { pickSeatSpot } from 'src/pages/index/seatPick';
import { SHOP_ITEM_EMOJI, type ShopItem, type ShopItemId } from 'src/pages/index/pixel/pixelWorld';
import { drawRoadVehicle } from 'src/pages/index/pixel/miaokouArt';
import type { CityDef, CityId, CityInfo, DrawCtx, Rect } from 'src/pages/index/pixel/city';
import { CITIES } from 'src/pages/index/pixel/cities';
import { CITY_ORDER } from 'src/pages/index/pixel/city';

const props = defineProps<{
  city: CityDef;
  seats: Seat[];
  selectedSeatId: string | null;
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
  remotePlayers: Record<string, RemotePlayer>;
}>();
const emit = defineEmits<{ leave: []; go: [city: CityId]; select: [seatId: string]; 'end-focus': []; position: [position: MyPosition]; whisper: [to: string, phrase: WhisperId] }>();

const { t, locale } = useLocale();
const prefs = usePlayerPrefs();

// ── 場地（格，1 格 = 16px）──
const T = 16;
// 換城市時元件會用 key 重建，city 不會中途換掉
const city = props.city;
const W = city.W;
const H = city.H;
const SEATS = city.seats;
const otherCities = computed<CityDef[]>(() => (CITY_ORDER as readonly CityId[]).filter((id) => id !== city.id).map((id) => CITIES[id]));

const inRect = (x: number, y: number, r: Rect) => x > r.x0 && x < r.x1 && y > r.y0 && y < r.y1;
const blocked = (x: number, y: number) =>
  x < 0.5 || x > W - 0.5 || y < 0.5 || y > H - 0.5 ||
  city.solid.some((r) => inRect(x, y, r)) ||
  SEATS.some((s) => Math.abs(x - s.x) < 0.42 && Math.abs(y - s.y) < 0.4) ||
  (city.blocked?.(x, y) ?? false);

// ── 點別人的名牌 ──
const profilePerson = ref<ProfilePerson | null>(null);
function pickPerson(x: number, y: number): boolean {
  const remote = shownRemotes.find((o) => Math.abs(x - o.x) < 0.6 && y > o.y - 1.4 && y < o.y + 0.4);
  if (remote) {
    profilePerson.value = { ...remote.remote };
    return true;
  }
  for (let i = 0; i < SEATS.length; i += 1) {
    const spot = SEATS[i];
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

// ── 現在站在哪裡前面：車站 > 抽籤 > 店家（同時只開一個面板）；地標介紹是點了才開 ──
const shopAt = ref<number | null>(null);
const fortuneOpen = ref(false);
const stationOpen = ref(false);
const info = ref<CityInfo | null>(null);
// 買完東西：先走開才會再跳出同一家
let shopLock: number | null = null;
const shop = computed(() => (shopAt.value !== null ? city.shops[shopAt.value] ?? null : null));

// ── 自己 ──
const me = { x: city.station.arrive.x, y: city.station.arrive.y, facing: 'down' as 'up' | 'down' | 'left' | 'right', moving: false, walkClock: 0 };
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
  if (shopAt.value !== null) say(`shop:${shopAt.value}`, t.value.seatScene.vendorThanks);
  say('me', `${item.emoji} ${t.value.seatScene.yummy}`, 2);
  shopLock = shopAt.value;
  shopAt.value = null;
  containerRef.value?.focus({ preventScroll: true });
}

// ── 抽籤 ──
const fortune = ref<{ rank: { 'zh-TW': string; 'en-US': string }; text: { 'zh-TW': string; 'en-US': string } } | null>(null);
const fortuneCooldown = ref(false);
function drawFortune(): void {
  const list = city.fortune?.fortunes ?? [];
  if (fortuneCooldown.value || !list.length) return;
  fortune.value = list[Math.floor(Math.random() * list.length)] ?? null;
  fortuneCooldown.value = true;
  window.setTimeout(() => {
    fortuneCooldown.value = false;
  }, 2500);
}

function closeInfo(): void {
  info.value = null;
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
  const spot = SEATS[i];
  if (!seat || !spot) return;
  seatedIndex = i;
  walkTarget = null;
  me.x = spot.x;
  me.y = spot.y;
  me.facing = spot.facing;
  shopAt.value = null;
  info.value = null;
  if (props.selectedSeatId !== seat.id) emit('select', seat.id);
}

function seatForFocus(): string | null {
  const i = seatedIndex ?? walkTarget ?? nearestSeat();
  const seat = i === null ? undefined : props.seats[i];
  const spot = i === null ? undefined : SEATS[i];
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

// 站起來：往座位面向的反方向（椅子後面）退一步，退不了就往下
function standUp(): void {
  const spot = seatedIndex === null ? null : SEATS[seatedIndex];
  seatedIndex = null;
  if (!spot) return;
  const off = spot.facing === 'up' ? [0, 0.9] : spot.facing === 'down' ? [0, -0.9] : spot.facing === 'left' ? [0.9, 0] : [-0.9, 0];
  for (const [dx, dy] of [off, [0, 0.9], [0, -0.9], [0.9, 0], [-0.9, 0]] as [number, number][]) {
    if (!blocked(spot.x + dx, spot.y + dy)) {
      me.x = spot.x + dx;
      me.y = spot.y + dy;
      return;
    }
  }
  me.x = spot.x;
  me.y = spot.y + 0.9;
}

// 座位前面走過去坐的那一點（跟 standUp 一樣的方向）
function seatApproach(i: number): { x: number; y: number } {
  const spot = SEATS[i];
  if (!spot) return { x: me.x, y: me.y };
  const off = spot.facing === 'up' ? [0, 0.9] : spot.facing === 'down' ? [0, -0.9] : spot.facing === 'left' ? [0.9, 0] : [-0.9, 0];
  const [dx = 0, dy = 0] = off;
  return blocked(spot.x + dx, spot.y + dy) ? { x: spot.x, y: spot.y + 0.9 } : { x: spot.x + dx, y: spot.y + dy };
}

function nearestSeat(): number | null {
  let best: number | null = null;
  let bestDist = 1.6;
  SEATS.forEach((_, i) => {
    const a = seatApproach(i);
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
    const a = seatApproach(walkTarget);
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
    if (info.value) info.value = null;
  }
  // 站在哪裡前面就打開哪個面板：車站 > 抽籤 > 店家
  const atStation = Math.hypot(me.x - city.station.x, me.y - city.station.y) < 1.4;
  if (!atStation) stationLock = false;
  stationOpen.value = atStation && !stationLock;
  fortuneOpen.value = !stationOpen.value && !!city.fortune && inRect(me.x, me.y, city.fortune.at);
  if (!fortuneOpen.value) fortune.value = null;
  const here = city.shops.findIndex((s) => inRect(me.x, me.y, s.at));
  if (here !== shopLock) shopLock = null;
  const next = !stationOpen.value && !fortuneOpen.value && here >= 0 && here !== shopLock ? here : null;
  if (next !== null && next !== shopAt.value) say(`shop:${next}`, city.shops[next]?.call[locale.value] ?? '');
  shopAt.value = next;
}

// ── 路人（用時間算的裝飾）：沿著線段來回走 ──
const WALKERS = city.walkers.flatMap((lane, li) =>
  Array.from({ length: lane.count }, (_, i) => {
    const r = seeded(li * 97 + i * 13 + 5);
    const side = (r() - 0.5) * 0.6;
    const horizontal = Math.abs(lane.x1 - lane.x0) >= Math.abs(lane.y1 - lane.y0);
    return {
      lane,
      off: horizontal ? { x: 0, y: side } : { x: side, y: 0 },
      speed: 0.45 + r() * 0.5,
      phase: r(),
      colors: lookColors(Math.floor(r() * 5), Math.floor(r() * 4), { body: r() < 0.5 ? 1 : 0 }),
    };
  }),
);
function walkerPos(w: (typeof WALKERS)[number], seconds: number): { x: number; y: number; facing: 'up' | 'down' | 'left' | 'right' } {
  const { x0, y0, x1, y1 } = w.lane;
  const span = Math.hypot(x1 - x0, y1 - y0) || 1;
  const tt = ((seconds * w.speed) / span + w.phase) % 2;
  const k = tt < 1 ? tt : 2 - tt;
  const forward = tt < 1;
  const dx = (x1 - x0) * (forward ? 1 : -1);
  const dy = (y1 - y0) * (forward ? 1 : -1);
  const facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  return { x: x0 + (x1 - x0) * k + w.off.x, y: y0 + (y1 - y0) * k + w.off.y, facing };
}

// ── 馬路上的車（裝飾）──
const VEHICLE_COLORS = ['#e25a4a', '#f2f2f2', '#3b82f6', '#2bb673', '#f6c945', '#8bd3c7'];
const VEHICLES = city.traffic.flatMap((lane, li) =>
  Array.from({ length: lane.count }, (_, i) => {
    const r = seeded(li * 131 + i * 29 + 7);
    return {
      lane,
      kind: r() < 0.3 ? ('taxi' as const) : ('scooter' as const),
      speed: 2.4 + r() * 1.8,
      phase: (i + r() * 0.5) / lane.count,
      color: VEHICLE_COLORS[Math.floor(r() * VEHICLE_COLORS.length)] ?? '#e25a4a',
      rider: VEHICLE_COLORS[Math.floor(r() * VEHICLE_COLORS.length)] ?? '#3b82f6',
    };
  }),
);
function vehiclePos(v: (typeof VEHICLES)[number], seconds: number): { x: number; y: number; dir: 1 | -1 } {
  const { x0, x1, y, dir } = v.lane;
  const span = x1 - x0 + 6;
  const k = ((seconds * v.speed) / span + v.phase) % 1;
  return { x: dir > 0 ? x0 - 3 + k * span : x1 + 3 - k * span, y, dir };
}

// ── 光線：照台灣時間，晚上燈會亮（設定裡關掉「場景跟著時間」就照深淺色模式） ──
function isNight(): boolean {
  if (!prefs.value.sceneClock) return document.body.classList.contains('body--dark');
  const hour = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hour12: false, timeZone: 'Asia/Taipei' }).format(new Date())) % 24;
  return hour >= 18 || hour < 5;
}

// ── 畫 ──
let ctx: CanvasRenderingContext2D | null = null;
let ground: HTMLCanvasElement | null = null;
// 底圖用幾倍畫：畫面放大倍數 × 螢幕像素（變了就重畫），招牌的字和線條才清楚
let groundRes = 1;
const view = { scale: 2, ox: 0, oy: 0 };

function paintGround(): HTMLCanvasElement {
  const { canvas, c } = layerCanvas(W * T, H * T, groundRes);
  if (c) city.paintGround(c);
  return canvas;
}

function drawSeated(c: CanvasRenderingContext2D, i: number, d: DrawCtx): void {
  const spot = SEATS[i];
  if (!spot) return;
  const x = Math.round(spot.x * T);
  const y = Math.round(spot.y * T);
  city.drawSeat(c, i, d);
  const state = seatState(i);
  if (state === 'me' && seatedIndex !== i) {
    c.fillStyle = `rgba(251, 191, 36, ${0.35 + Math.sin(d.seconds * 3) * 0.15})`;
    c.fillRect(x - 7, y + 3, 14, 2);
  }
  const occupied = state === 'mate' || state === 'taken' || (state === 'me' && seatedIndex === i);
  if (occupied) {
    const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
    const colors = state === 'me' ? lookColors(prefs.value.hair, prefs.value.shirt, prefs.value) : mate ? readerColors(mate) : { hair: '#6b7280', hairLight: '#8b93a1', shirt: '#94a3b8', shirtShade: '#6f7d91' };
    const sprite = getAvatarFrame(colors, spot.facing, 'idle');
    c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SEATED_ROWS, x - AVATAR_SIZE.w / 2, y - 2 - SEATED_ROWS, AVATAR_SIZE.w, SEATED_ROWS);
  }
  city.drawSeatFront?.(c, i, d);
}

function drawPerson(c: CanvasRenderingContext2D, x: number, y: number, colors: ReturnType<typeof lookColors>, facing: 'up' | 'down' | 'left' | 'right', moving: boolean, clock: number): void {
  const frame = moving ? (Math.floor(clock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  px(c, 'rgba(0,0,0,0.25)', Math.round(x * T - 5), Math.round(y * T + 3), 10, 2);
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
  // 城市裡高樓多：鏡頭往上偏一點，站在樓下也看得到屋頂
  const oy = Math.round(followY(cssH, H * T * scale, (me.y - 2.2) * T * scale) * dpr) / dpr;
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
  const d: DrawCtx = { seconds, night: isNight() };

  const items: { y: number; draw: () => void }[] = [];
  for (const p of city.props) items.push({ y: p.y, draw: () => p.draw(c, d) });
  SEATS.forEach((spot, i) => items.push({ y: spot.y, draw: () => drawSeated(c, i, d) }));
  for (const w of WALKERS) {
    const p = walkerPos(w, seconds);
    items.push({ y: p.y, draw: () => drawPerson(c, p.x, p.y, w.colors, p.facing, true, seconds + w.phase) });
  }
  for (const v of VEHICLES) {
    const p = vehiclePos(v, seconds);
    items.push({ y: p.y, draw: () => drawRoadVehicle(c, v.kind, p.x, p.y, p.dir, v.color, v.rider) });
  }
  if (seatedIndex === null) items.push({ y: me.y + 0.35, draw: () => drawPerson(c, me.x, me.y, lookColors(prefs.value.hair, prefs.value.shirt, prefs.value), me.facing, me.moving, me.walkClock) });
  for (const other of shownRemotes) items.push({ y: other.y + 0.35, draw: () => drawPerson(c, other.x, other.y, remoteColors(other.remote), other.remote.facing, other.remote.moving, seconds) });
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

  // 晚上：整張地圖調暗偏藍，燈、窗戶再加亮
  if (d.night) {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = '#5f6a9c';
    c.fillRect(0, 0, W * T, H * T);
    c.globalCompositeOperation = 'lighter';
    for (const l of city.lights) {
      const g = c.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
      g.addColorStop(0, l.color ?? 'rgba(255, 210, 140, 0.45)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g;
      c.fillRect(l.x - l.r, l.y - l.r, l.r * 2, l.r * 2);
    }
    c.restore();
  }

  // ── 螢幕座標：手上的東西、名牌、泡泡 ──
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
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
  for (const l of city.labels) {
    const p = screen(l.x, l.y);
    pill(ctx, l.text[locale.value], p.x, p.y, l.color);
  }
  const sp = screen(city.station.x, city.station.y - 1.2);
  pill(ctx, `🚄 ${city.station.name[locale.value]}`, sp.x, sp.y, '#fbbf24');
  if (city.fortune) {
    const fp = screen(city.fortune.label.x, city.fortune.label.y);
    pill(ctx, `🙏 ${city.fortune.title[locale.value]}`, fp.x, fp.y, '#f2c14e');
  }
  city.shops.forEach((s) => {
    const at = s.label ?? { x: (s.at.x0 + s.at.x1) / 2, y: s.at.y0 };
    const p = screen(at.x, at.y);
    pill(ctx!, `🛍️ ${s.name[locale.value]}`, p.x, p.y, '#94a3b8');
  });
  if (seatedIndex === null) {
    const mp = screen(me.x, me.y - 1);
    pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
  }
  for (const other of shownRemotes) {
    const op = screen(other.x, other.y - 1);
    pill(ctx, remoteLabel(other), op.x, op.y, '#2dd4bf');
  }
  SEATS.forEach((spot, i) => {
    const mate = props.seats[i] ? props.getMateAtSeat(props.seats[i]?.id ?? '') : null;
    if (!mate) return;
    const p = screen(spot.x, spot.y - 1.4);
    pill(ctx!, mate.displayName, p.x, p.y, '#2dd4bf');
  });
  // 對話泡泡：老闆在店家名牌上方，自己在頭上
  const now = performance.now() / 1000;
  for (const [key, b] of bubbles) {
    if (now > b.until) {
      bubbles.delete(key);
      continue;
    }
    const s = key.startsWith('shop:') ? city.shops[Number(key.slice(5))] : undefined;
    const sAt = s ? s.label ?? { x: (s.at.x0 + s.at.x1) / 2, y: s.at.y0 } : null;
    const at = key === 'me' ? screen(me.x, me.y - 1.6) : sAt ? screen(sAt.x, sAt.y - 1.4) : null;
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
  shownRemotes = viewRemotes(props.remotePlayers, city.id, dt);
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const item = heldItemNow();
  rememberScene(city.id, positionForShare(), seatedIndex !== null, seconds);
  syncPosition(
    seatedIndex !== null
      ? { x: me.x, y: me.y, facing: me.facing, moving: false, hidden: true, scene: city.id, ...(item ? { item } : {}) }
      : { x: r2(me.x), y: r2(me.y), facing: me.facing, moving: me.moving, scene: city.id, ...(item ? { item } : {}) },
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

// 站在地標旁邊（1.2 格內）按 E 看介紹
function nearInfo(): CityInfo | null {
  const pad = 1.2;
  return city.infos.find((i) => me.x > i.at.x0 - pad && me.x < i.at.x1 + pad && me.y > i.at.y0 - pad && me.y < i.at.y1 + pad) ?? null;
}

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
    else if (fortuneOpen.value) drawFortune();
    else if (seatedIndex !== null) standUp();
    else {
      const seat = nearestSeat();
      if (seat !== null) sitAt(seat);
      else info.value = info.value ? null : nearInfo();
    }
  }
}

function onKeyUp(event: KeyboardEvent): void {
  const dir = KEY_MAP[event.code];
  if (dir) keys.delete(dir);
}

// 點座位：走過去坐；點地標：看介紹；點抽籤的名牌附近：走過去
function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  const at = canvasRef.value ? localPoint(canvasRef.value, event.clientX, event.clientY) : null;
  if (!at) return;
  const x = (at.x - view.ox) / view.scale / T;
  const y = (at.y - view.oy) / view.scale / T;
  if (pickPerson(x, y)) return;
  if (props.disabled) {
    const clicked = pickSeatSpot(SEATS, x, y, (i) => seatState(i) === 'empty');
    if (clicked < 0 || clicked !== seatedIndex) askToLeave(() => handleClick(event));
    return;
  }
  const seat = pickSeatSpot(SEATS, x, y, (i) => seatState(i) === 'empty');
  if (seat >= 0 && seatState(seat) === 'empty') {
    if (seatedIndex !== null) standUp();
    walkTarget = seat;
    return;
  }
  const landmark = city.infos.find((i) => inRect(x, y, i.at));
  if (landmark) info.value = landmark;
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
  const arrival = takeArrival(city.id);
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
