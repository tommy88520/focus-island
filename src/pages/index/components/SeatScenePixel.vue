<template>
  <div class="relative" :class="{ 'shake-error': isShake }">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] sm:h-[calc(100dvh-262px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#1b1d26] outline-none transition-opacity duration-500 focus-visible:ring-2 focus-visible:ring-amber-400/40 lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" />

      <button
        type="button"
        class="absolute right-2 top-2 z-20 !flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900/80 text-white shadow-lg ring-1 ring-white/15 transition hover:bg-slate-800 sm:h-9 sm:w-9"
        :class="{ 'ring-amber-400/70': minimapOpen }"
        :aria-label="t.seatScene.minimap"
        :aria-expanded="minimapOpen"
        :title="t.seatScene.minimap"
        @click="toggleMinimap"
      >
        <q-icon :name="minimapOpen ? 'close' : 'map'" size="18px" />
      </button>
      <!-- 點別人的名牌：小卡 -->
      <ProfileCard
        v-if="profileCard && !isLoading"
        :person="profileCard"
        :wave-label="profileCard.dnd ? t.seatScene.profileDnd : isQuietZone ? t.seatScene.profileQuiet : `👋 ${t.seatScene.profileWave}`"
        :can-wave="!(profileCard.dnd || isQuietZone || disabled)"
        @close="closeProfile"
        @wave="waveFromProfile"
        @whisper="whisperFromProfile"
      />
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
      <!-- 手機的虛擬搖桿：按住拖動就能走 -->
      <div
        v-if="isTouch && !isLoading && !disabled"
        ref="stickRef"
        class="pixel-panel absolute bottom-8 left-8 h-24 w-24 !rounded-full opacity-80"
        style="touch-action: none"
        :aria-label="t.seatScene.joystick"
        @touchstart.prevent
        @touchmove.prevent
        @pointerdown="handleStickDown"
        @pointermove="handleStickMove"
        @pointerup="handleStickUp"
        @pointercancel="handleStickUp"
      >
        <div
          class="pointer-events-none absolute left-1/2 top-1/2 h-10 w-10 rounded-full border-2 border-[color:var(--px-ink)] bg-[color:var(--px-accent)]"
          :style="{ transform: `translate(calc(-50% + ${stickKnob.x}px), calc(-50% + ${stickKnob.y}px))` }"
        ></div>
      </div>
      <!-- 騎車時的下車鍵（手機沒有鍵盤） -->
      <button
        v-if="isRiding && !isLoading"
        type="button"
        class="pixel-btn pixel-btn--primary absolute right-2 h-9 px-3 text-xs"
        :class="isTouch && !disabled ? 'bottom-28' : 'bottom-2'"
        @click="handleDismountClick"
      >
        {{ t.seatScene.getOff }}
      </button>
      <!-- 打招呼：按鈕或數字鍵 1–4（H 也是揮手）；附近的人會回話 -->
      <!-- 手機：搖桿在左下，打招呼這些功能鍵改到右下直排（跟大部分手遊一樣） -->
      <div
        v-if="!isLoading && !isQuietZone && !disabled"
        class="absolute !flex !flex-nowrap gap-1.5"
        :class="isTouch ? 'bottom-3 right-3 !flex-col' : 'bottom-2 left-2'"
      >
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
        <!-- 同一層的其他分區也能直接搭過去（鍵盤 Z／X／C／V） -->
        <div v-if="zones.length > 1" class="mt-2 !flex !flex-wrap justify-center gap-2">
          <button
            v-for="(zone, i) in zones"
            :key="zone.id"
            type="button"
            class="h-9 whitespace-nowrap rounded-xl px-2 text-xs font-black ring-1 transition"
            :class="
              zone.id === currentZoneId
                ? 'cursor-default bg-amber-400 text-slate-900 ring-amber-300'
                : 'bg-slate-800 text-white ring-white/15 hover:bg-slate-700'
            "
            :disabled="zone.id === currentZoneId"
            @click="rideElevatorToZone(zone.id)"
          >
            <span v-if="!isTouch && ELEVATOR_ZONE_KEYS[i]" class="mr-1 font-pixel text-[9px] opacity-60">{{ ELEVATOR_ZONE_KEYS[i]?.slice(3) }}</span>{{ zone.name }}
          </button>
        </div>
        <p v-if="!isTouch" class="!mb-0 mt-2 text-[10px] text-white/50">{{ t.seatScene.elevatorKeys }}</p>
      </div>
      <!-- 搭車：台北車站大廳的閘門、101 旁的捷運站口都是這一張。一條線一排，點一站就搭過去
           （紅線：同一層的各分區、劍潭（士林夜市）、北投；綠線：環河公園；台鐵：基隆（廟口夜市）；文湖線：動物園；F1 專線：F1 月台；高鐵：各城市的指標地圖） -->
      <div v-if="mrtOpen" class="pixel-panel absolute bottom-3 left-1/2 z-10 w-[min(30rem,calc(100%-1rem))] -translate-x-1/2 px-2.5 pb-2.5 pt-3">
        <p class="!mb-2 text-center !text-[11px] font-black tracking-wide">🚉 {{ mrtAt === 'main' ? t.seatScene.mrtPromptMain : t.seatScene.mrtPrompt101 }}</p>
        <div class="space-y-1.5">
          <div v-for="line in mrtLines" :key="line.id" class="!flex !flex-nowrap items-start gap-1.5">
            <span
              class="mt-[6px] w-[3.4rem] shrink-0 rounded-[3px] px-1 py-[3px] text-center text-[10px] font-black leading-none text-white"
              :style="{ background: MRT_LINE_COLORS[line.id] }"
            >{{ line.name }}</span>
            <div class="!flex min-w-0 flex-1 flex-wrap gap-1">
              <button
                v-for="stop in line.stops"
                :key="stop.key"
                type="button"
                class="pixel-btn h-8 whitespace-nowrap px-2 text-[11px]"
                :class="{ 'pixel-btn--active': stop.here }"
                :disabled="stop.here"
                @click="stop.go()"
              >
                {{ stop.emoji }} {{ stop.name }}<span v-if="stop.here" class="ml-1 text-[9px] opacity-70">{{ t.seatScene.mrtHere }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div v-show="minimapOpen" class="absolute right-2 top-14 rounded-xl sm:top-12 bg-slate-900/85 p-2 shadow-lg ring-1 ring-white/15">
        <p class="!mb-1.5 text-center !text-[10px] font-black tracking-wide text-amber-300">
          {{ areaTitle }}
        </p>
        <canvas ref="minimapRef" class="block cursor-pointer rounded-md" @click="handleMinimapClick" />
      </div>
    </div>

    <SceneHint :text="isTouch ? t.seatScene.hintTouch : t.seatScene.hintDesktop" />


    <LeaveFocusDialog v-model="leaveConfirmOpen" @confirm="confirmLeave" @hide="afterFocusEnds = null" />
  </div>
</template>

<script setup lang="ts">
import { fillPillText, pillTextWidth, canvasDpr, drawLayer, layerCanvas } from 'src/pages/index/pixel/pixelUtil';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import {
  EMOTE_IDS,
  type EmoteId,
  type MyPosition,
  type Reader,
  type RemotePlayer,
  type SeatEmote,
  type ProfilePerson,
  type WhisperId,
} from 'src/pages/index/composables/useLibrarySocket';
import type { Seat } from 'src/pages/index/components/SeatGrid.vue';
import { useLocale } from 'src/composables/useLocale';
import ProfileCard from 'src/pages/index/components/ProfileCard.vue';
import { playTransition } from 'src/pages/index/sceneTransition';
import SceneHint from 'src/pages/index/components/SceneHint.vue';
import LeaveFocusDialog from 'src/pages/index/components/LeaveFocusDialog.vue';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { createNavigation, type Navigation, type Point } from 'src/pages/index/composables/seatNavigation';
import {
  TILE,
  WALL_ROWS,
  areaAt,
  createPixelMap,
  elevatorTrigger,
  mapObstacles,
  seatApproach,
  seatCenter,
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
  paintBeachChair,
  paintBenchSeat,
  paintCounter,
  paintPlasticStool,
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
  tvScreenRect, readerColors } from 'src/pages/index/pixel/pixelArt';
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
import {
  paintBackDoor,
  paintOutdoorGround,
  paintOutdoorProp,
  paintWalker,
  SHOP_ITEM_EMOJI,
  type ShopItemId,
  walkerPose,
  type MrtTrigger,
  type OutdoorKind,
} from 'src/pages/index/pixel/pixelWorld';
import { paintFloorSeat, paintRattanChair } from 'src/pages/index/pixel/xinyiArt';
import { XY } from 'src/pages/index/pixel/xinyi';
import { CITY_ORDER, type CityId } from 'src/pages/index/pixel/city';
import { CITIES } from 'src/pages/index/pixel/cities';
import { useYouTubeTv } from 'src/pages/index/composables/useYouTubeTv';
import { localPoint, sceneRotated } from 'src/pages/index/composables/sceneFullscreen';

const { tvScreen, showing: youtubeShowing } = useYouTubeTv();

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
  // 坐著的人手上拿的夜市小吃（key 跟 remotePlayers 一樣）
  seatedItems: Record<string, { item: ShopItemId; until: number }>;
  // 有人剛進房：要再送一次自己的位置
  peerJoinedAt: number;
  // 正在播雨聲：場景跟著下雨
  raining: boolean;
}>();

const emit = defineEmits<{
  select: [seatId: string];
  // 走進樓梯觸發區，要求父層切換到相鄰樓層
  'change-floor': [floor: number];
  // 走出左右牆的出口，要求父層切到隔壁分區
  'change-zone': [zoneId: string];
  // 在 F1 站搭車去 F1 賽車場
  'go-f1': [];
  // 在捷運站搭車去環河公園
  'go-park': [];
  'go-beitou': [];
  'go-miaokou': [];
  'go-shilin': [];
  'go-zoo': [];
  'go-city': [city: CityId];
  whisper: [to: string, phrase: WhisperId];
  // 走進另一個區域（圖書館／沙灘／101／動物園／夜市），父層用來切換場景環境音
  area: [area: Area];
  // 瀏覽器拿不到 2D canvas 時通知父層退回 2D 座位格子
  'webgl-failed': [];
  // 自己打招呼，父層轉送給同房間的人
  emote: [emote: EmoteId];
  // 自己站著（或騎車）的位置，父層轉送給同房間的人
  position: [position: MyPosition];
  // 專注中想離開座位，使用者確認後請父層結束專注
  'end-focus': [];
  // 點了牆上的電視：父層打開 YouTube 網址設定
  'open-tv': [];
}>();

const { t, locale } = useLocale();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const minimapRef = ref<HTMLCanvasElement | null>(null);
const isTouch = ref(false);
const minimapOpen = ref(false);
// 靜謐森林是完全靜音區：不能打招呼，也不顯示別人的表情
const isQuietZone = ref(false);
const isRiding = ref(false);

// ── 手機虛擬搖桿：stick 是 -1～1 的方向，跟方向鍵一起算 ──
const STICK_RADIUS_PX = 30;
const stickRef = ref<HTMLDivElement | null>(null);
const stickKnob = ref({ x: 0, y: 0 });
const stick = { x: 0, y: 0 };

function updateStick(event: PointerEvent): void {
  if (!stickRef.value) return;
  const at = localPoint(stickRef.value, event.clientX, event.clientY);
  let x = at.x - at.width / 2;
  let y = at.y - at.height / 2;
  const length = Math.hypot(x, y);
  if (length > STICK_RADIUS_PX) {
    x = (x / length) * STICK_RADIUS_PX;
    y = (y / length) * STICK_RADIUS_PX;
  }
  stickKnob.value = { x, y };
  // 推不到兩成當作沒推，避免手指輕碰就亂走
  const strength = Math.min(1, length / STICK_RADIUS_PX);
  stick.x = strength > 0.2 ? x / STICK_RADIUS_PX : 0;
  stick.y = strength > 0.2 ? y / STICK_RADIUS_PX : 0;
}

let stickPointer: number | null = null;

function handleStickDown(event: PointerEvent): void {
  if (askToLeave(null)) return;
  stickPointer = event.pointerId;
  try {
    // 手指滑出搖桿範圍也繼續算
    stickRef.value?.setPointerCapture(event.pointerId);
  } catch {
    // 拿不到 capture 也沒關係，只是滑出去就停
  }
  updateStick(event);
}

function handleStickMove(event: PointerEvent): void {
  if (event.pointerId === stickPointer) updateStick(event);
}

function handleStickUp(): void {
  stickPointer = null;
  stick.x = 0;
  stick.y = 0;
  stickKnob.value = { x: 0, y: 0 };
}

// ── 點別人的名牌 ──
const profileCard = ref<ProfilePerson | null>(null);

function openProfile(person: ProfilePerson): void {
  profileCard.value = { ...person };
}

// 送悄悄話：送出後關小卡、自己頭上冒一下提示
function whisperFromProfile(to: string, phrase: WhisperId): void {
  if (!to) return;
  emit('whisper', to, phrase);
  say('me', `🤫 ${t.value.seatScene.whisperSent(profileCard.value?.displayName ?? '')}`, 0.6);
  closeProfile();
}

function closeProfile(): void {
  profileCard.value = null;
  containerRef.value?.focus({ preventScroll: true });
}

function waveFromProfile(): void {
  closeProfile();
  sendEmote('wave');
}

// 點到別人：站著的人看頭到腳那一塊，坐著的人用座位
function pickPerson(point: { x: number; y: number }): boolean {
  for (const [key, shown] of remoteShown) {
    const remote = props.remotePlayers[key];
    if (remote && Math.abs(point.x - shown.x) < 0.6 && point.y > shown.y - 1.4 && point.y < shown.y + 0.4) {
      openProfile(remote);
      return true;
    }
  }
  const node = pickSeat(point);
  const mate = node && node.state === 'mate' ? props.getMateAtSeat(node.seatId) : null;
  if (mate) {
    openProfile(mate);
    return true;
  }
  return false;
}

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
// 走到 101 旁的捷運站口會跳出分區選單
const mrtOpen = ref(false);
// 捷運路線圖上的站：紅線是這層樓的分區，綠線通往獨立地圖
const MRT_LINE_COLORS = { red: '#e3002c', green: '#008659', blue: '#0070bd', brown: '#c48c31', orange: '#f39800', hsr: '#e8641c' } as const;
// 站在哪個站口（台北車站大廳、101 站口）：面板標題、換分區後從同一個站口出來
const mrtAt = ref<MrtTrigger['station']>('main');
const mrtLines = computed(() => {
  const s = t.value.seatScene;
  return [
    {
      id: 'red' as const,
      name: s.lineRed,
      stops: [
        ...props.zones.map((zone) => ({ key: zone.id, name: zone.name, emoji: '📚', here: zone.id === currentZoneId.value, go: () => rideMrt(zone.id) })),
        { key: 'shilin', name: s.shilinStop, emoji: '🍗', here: false, go: goShilin },
        { key: 'beitou', name: t.value.beitou.title, emoji: '♨️', here: false, go: goBeitou },
      ],
    },
    { id: 'green' as const, name: s.lineGreen, stops: [{ key: 'park', name: t.value.riverPark.title, emoji: '🌸', here: false, go: goPark }] },
    { id: 'blue' as const, name: s.lineTra, stops: [{ key: 'miaokou', name: s.miaokouStop, emoji: '🏮', here: false, go: goMiaokou }] },
    { id: 'brown' as const, name: s.lineBrown, stops: [{ key: 'zoo', name: t.value.zoo.station, emoji: '🐼', here: false, go: goZoo }] },
    { id: 'orange' as const, name: s.lineF1, stops: [{ key: 'f1', name: t.value.f1Hub.title, emoji: '🏎️', here: false, go: goF1 }] },
    // 高鐵：台灣各城市的指標地圖
    { id: 'hsr' as const, name: s.lineHsr, stops: CITY_ORDER.map((id) => ({ key: id, name: CITIES[id].stop[locale.value], emoji: CITIES[id].emoji, here: false, go: () => goCity(id) })) },
  ];
});
// 小地圖標題：目前在哪一區
const areaTitle = computed(() => {
  const s = t.value.seatScene;
  if (area.value === 'beach') return s.areaBeach;
  if (area.value === 'taipei101') return s.areaTaipei101;
  if (area.value === 'village') return s.areaVillage;
  if (area.value === 'station') return s.areaStation;
  return props.zoneName ? `${props.zoneName} ${props.currentFloor}F` : s.areaLibrary(props.currentFloor);
});
const currentZoneId = computed(() => (props.seats[0]?.id ?? '').split('-')[1] ?? '');
const elevatorFloors = computed(() => [...props.floors].sort((a, b) => a - b));
// 人現在在圖書館還是海灘（小地圖的標題、要不要換泳裝）
const area = ref<Area>('library');

const WALK_SPEED = 4.2;
const PLAYER_RADIUS = 0.28;
const STAIR_RADIUS = 0.6;
const SIT_TWEEN_SECONDS = 0.25;
const SIT_REACH = 1.8;
// 能整張放進畫面就用最大的整數倍；放不下（手機）就固定 2 倍、鏡頭跟著人走
const MIN_SCALE = 2;
const LABEL_FONT_PX = 12;
const COLOR_ME = '#fbbf24';
const COLOR_MATE = '#2dd4bf';
const MINIMAP_WIDTH = 148;
const BEACH_STROLL_SPEED = 1.1;
// 走到海灘就換上海灘褲
const playerPrefs = usePlayerPrefs();
// 自己的外觀跟著設定頁走；到海灘換泳裝（女生比基尼、男生海灘褲）
const myAvatar = (beach = false): AvatarColors => ({
  ...lookColors(playerPrefs.value.hair, playerPrefs.value.shirt, playerPrefs.value),
  ...(beach ? { outfit: playerPrefs.value.body === 1 ? ('bikini' as const) : ('trunks' as const) } : {}),
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
const MINIMAP_OUTDOOR_COLORS: Partial<Record<OutdoorKind, string>> = {
  tower101: '#3e6f6a',
  office: '#59606e',
  mrt: '#e25a4a',
  stationGates: '#f39800',
  goodCho: '#6b4a30',
  houseC: '#a5523c',
  banyan: '#2f6b35',
  streetTree: '#3d7a4c',
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
  // 坐這裡的人（別人）的連線 key（跟 remotePlayers 的 key 一樣）和 userId
  mateKey: string;
  mateUserId: string;
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
// 底圖用幾倍畫：畫面放大倍數 × 螢幕像素（變了就重畫），招牌的字和線條才清楚
let staticRes = 1;
let seatNodes: SeatNode[] = [];
let stairs: StairInfo[] = [];
let nav: Navigation | null = null;
let stairLock = false;
// 剛從隔壁分區走進來時站在出口旁：要先離開出口才會再觸發
// 剛搭捷運到這一區時人就站在捷運站口：先走開再走回來才會再跳出面板
let mrtLock = false;
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
  // 原本停的位置（海灘車、小船）；從 YouBike 站借的車沒有，閒置太久就收回站裡
  home?: { x: number; y: number; facing: Facing };
  // 最後一次有人下車的時間（秒）；騎著的時候是 null
  idleSince: number | null;
}

// 車子停在外面沒人騎超過 3 分鐘：YouBike 收回站裡，海灘車和小船開回原位
const VEHICLE_IDLE_RETURN_S = 180;

function returnIdleVehicles(): void {
  const now = performance.now() / 1000;
  vehicles = vehicles.flatMap((v) => {
    if (v === riding || v.idleSince === null || now - v.idleSince < VEHICLE_IDLE_RETURN_S) return [v];
    if (!v.home) return [];
    Object.assign(v, { x: v.home.x, y: v.home.y, facing: v.home.facing, vx: 0, vy: 0, idleSince: null });
    return [v];
  });
}

// ── 沙灘上可以躺的地方：沒有路人躺著的躺椅和海灘巾 ──
interface LieSpot {
  // 躺下時腳的位置（格）
  x: number;
  y: number;
  // lie：沙灘上平躺曬太陽；sink：窩在室內的懶骨頭裡
  // floor：直接躺在圖書館地板上
  pose: 'lie' | 'sink' | 'floor';
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
// 人走了（斷線、換房間）後端會送 LEAVE、重新連線會整個重抓，所以不靠「多久沒消息」來移除人：
// 對方切到別的 App／分頁時瀏覽器會暫停他的計時器，常常一分鐘以上沒送位置，人其實還在。
// 這裡只是保險（萬一漏了 LEAVE）；超過 REMOTE_AWAY_MS 名牌加 💤
const REMOTE_STALE_MS = 10 * 60_000;
const REMOTE_AWAY_MS = 60_000;
// 畫面上的位置慢慢追上收到的位置，看起來才不會一格一格跳
const remoteShown = new Map<string, { x: number; y: number; moving: boolean; facing: Facing }>();
// 別人的位置大約每 0.15 秒收到一次，網路一快一慢：收到的點排成一條路線，畫面固定晚 REMOTE_DELAY_MS 沿著路線內插，走起來才會等速、不會一頓一頓
const REMOTE_DELAY_MS = 260;
const remoteTracks = new Map<string, { lastAt: number; samples: { t: number; x: number; y: number }[] }>();
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

// 最低的樓層直接開門就是海灘；樓上的出口換成往下的手扶梯
function hasEscalator(): boolean {
  const lowest = props.floors.length > 0 ? Math.min(...props.floors) : 1;
  return props.currentFloor > lowest;
}

function buildMap(): void {
  // 分區決定主題：A 森林、B 咖啡店、C 深海艙、D 圖書館
  map = createPixelMap(props.seats.length, hasEscalator(), themeForZone(currentRoom().split('-')[1] ?? ''));
  isQuietZone.value = map.theme === 'forest';
  vehicles = map.vehicles.map((spot) => ({ ...spot, vx: 0, vy: 0, home: { x: spot.x, y: spot.y, facing: spot.facing }, idleSince: null }));
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
  profileCard.value = null;
  riding = null;
  isRiding.value = false;
  goalVehicle = null;
  seatNodes = props.seats.flatMap((seat, index) => {
    const slot = map.seats[index];
    // 士林夜市的座位（31–42）留著編號但不在這張地圖上
    return slot && !slot.offMap ? [{ seatId: seat.id, slot, index, state: 'empty' as SeatState, label: '', colors: TAKEN_AVATAR, focusing: false, dnd: false, mateKey: '', mateUserId: '' }] : [];
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

// 底圖涵蓋整個世界（包含負座標的戶外區），畫的時候先把原點移過去
function paintStatic(): void {
  const { world } = map;
  const { canvas, c: layer } = layerCanvas((world.x1 - world.x0) * TILE, (world.y1 - world.y0) * TILE, staticRes);
  if (layer) {
    layer.translate(-world.x0 * TILE, -world.y0 * TILE);
    paintOutdoorGround(layer, world, map.width, map.libraryHeight, map.beach.seaTop);
    paintStaticLayer(layer, map);
    paintBackDoor(layer, world.backDoor);
  }
  staticLayer = canvas;
}

// 保留這個座位的人現在站著（地圖上看得到他在走）：同一個連線在走；或同一個人的另一個連線在走、而這個座位沒在專注
// （重新整理前的舊連線留下的保留座位，後端還沒清掉時，不然同一個人會畫成兩個）
function mateIsUp(node: SeatNode): boolean {
  if (node.state !== 'mate' || !node.mateKey) return false;
  const now = Date.now();
  const fresh = (remote: RemotePlayer | undefined) => remote !== undefined && now - remote.at <= REMOTE_STALE_MS;
  if (fresh(props.remotePlayers[node.mateKey])) return true;
  if (node.focusing || !node.mateUserId) return false;
  return Object.values(props.remotePlayers).some((remote) => remote.userId === node.mateUserId && fresh(remote));
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
    node.mateKey = state === 'mate' && mate ? mate.sessionId || mate.userId : '';
    node.mateUserId = state === 'mate' && mate ? mate.userId : '';
    if (state === 'me') {
      node.label = t.value.common.meLabel;
      node.colors = myAvatar();
    } else if (state === 'mate' && mate) {
      node.label = mate.displayName;
      node.colors = readerColors(mate);
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
  // 只有一層樓也會開：還可以換分區
  if (props.floors.length < 2 && props.zones.length < 2) return false;
  const trigger = elevatorTrigger(map);
  return Math.hypot(x - trigger.x, y - trigger.y) < STAIR_RADIUS;
}

// 站在哪個搭車的地方（台北車站閘門、101 站口）；只有一個分區也會跳出面板（還可以搭去其他地圖）
function mrtTriggerAt(x: number, y: number): MrtTrigger | undefined {
  return map.world.mrtTriggers.find((trigger) => Math.hypot(x - trigger.x, y - trigger.y) < trigger.r);
}

// 搭捷運到同一層樓的另一個分區：從那一區的捷運站口出來
function rideMrt(zoneId: string): void {
  mrtOpen.value = false;
  containerRef.value?.focus({ preventScroll: true });
  if (zoneId === currentZoneId.value || !canInteract()) return;
  const trigger = map.world.mrtTriggers.find((m) => m.station === mrtAt.value) ?? map.world.mrtTriggers[0];
  if (trigger) pendingSpawn = { point: { x: trigger.x, y: trigger.y + 0.3 }, floor: props.currentFloor };
  savedPosition = null;
  restoredStanding = false;
  playTransition('mrt', props.zones.find((z) => z.id === zoneId)?.name ?? '', { line: 'red' });
  emit('change-zone', zoneId);
}

// 去 F1：先把自己的位置標成「不在這裡」，同房間的人就不會看到你停在站口不動
function goF1(): void {
  mrtOpen.value = false;
  emit('position', { x: player.x, y: player.y, facing: player.facing, moving: false, hidden: true });
  savePosition(performance.now() / 1000, true);
  emit('go-f1');
}

// 去環河公園：跟去 F1 一樣先把自己標成「不在這裡」，回來時從捷運站口出來
function goPark(): void {
  mrtOpen.value = false;
  emit('position', { x: player.x, y: player.y, facing: player.facing, moving: false, hidden: true });
  savePosition(performance.now() / 1000, true);
  emit('go-park');
}

// 去北投溫泉：同上
function goBeitou(): void {
  mrtOpen.value = false;
  emit('position', { x: player.x, y: player.y, facing: player.facing, moving: false, hidden: true });
  savePosition(performance.now() / 1000, true);
  emit('go-beitou');
}

// 去士林夜市：同上
function goShilin(): void {
  mrtOpen.value = false;
  emit('position', { x: player.x, y: player.y, facing: player.facing, moving: false, hidden: true });
  savePosition(performance.now() / 1000, true);
  emit('go-shilin');
}

// 去動物園：同上
function goZoo(): void {
  mrtOpen.value = false;
  emit('position', { x: player.x, y: player.y, facing: player.facing, moving: false, hidden: true });
  savePosition(performance.now() / 1000, true);
  emit('go-zoo');
}

// 搭高鐵去別的城市：同上
function goCity(id: CityId): void {
  mrtOpen.value = false;
  emit('position', { x: player.x, y: player.y, facing: player.facing, moving: false, hidden: true });
  savePosition(performance.now() / 1000, true);
  emit('go-city', id);
}

// 去基隆廟口夜市：同上
function goMiaokou(): void {
  mrtOpen.value = false;
  emit('position', { x: player.x, y: player.y, facing: player.facing, moving: false, hidden: true });
  savePosition(performance.now() / 1000, true);
  emit('go-miaokou');
}

// 電梯也能換到同一層的其他分區：從那一區的電梯口出來
const ELEVATOR_ZONE_KEYS = ['KeyZ', 'KeyX', 'KeyC', 'KeyV'];
function rideElevatorToZone(zoneId: string): void {
  elevatorOpen.value = false;
  containerRef.value?.focus({ preventScroll: true });
  if (zoneId === currentZoneId.value || !canInteract()) return;
  const trigger = elevatorTrigger(map);
  pendingSpawn = { point: { x: trigger.x, y: trigger.y + 0.2 }, floor: props.currentFloor };
  savedPosition = null;
  restoredStanding = false;
  playTransition('elevator', props.zones.find((z) => z.id === zoneId)?.name ?? '');
  emit('change-zone', zoneId);
}

function rideElevator(floor: number): void {
  elevatorOpen.value = false;
  containerRef.value?.focus({ preventScroll: true });
  if (floor === props.currentFloor || !canInteract()) return;
  const trigger = elevatorTrigger(map);
  pendingSpawn = { point: { x: trigger.x, y: trigger.y + 0.2 }, floor };
  savedPosition = null;
  restoredStanding = false;
  playTransition('elevator', `${floor}F`, { up: floor > props.currentFloor });
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
  mrtLock = mrtTriggerAt(player.x, player.y) !== undefined;
  elevatorLock = insideElevatorZone(player.x, player.y);
  elevatorOpen.value = false;
  mrtOpen.value = false;
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

// ── 專注中想走動：先問要不要結束專注，確定的話專注結束後把剛剛的動作做完 ──
const leaveConfirmOpen = ref(false);
let afterFocusEnds: (() => void) | null = null;
// 按了「結束並離開」才會留著，等專注真的結束再執行；取消就丟掉
let leaveAction: (() => void) | null = null;

function askToLeave(action: (() => void) | null): boolean {
  if (!props.disabled || props.isLoading || !nav) return false;
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
    if (action) void nextTick(action);
  },
);

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

// 走進海裡就是在游泳（比踩水再深一點）；游泳只看位置，別人那邊也用位置判斷，不用多送訊息
const SWIM_DEPTH = 0.6;
const SWIM_SPEED = WALK_SPEED * 0.55;
// 游泳時只露出上半身
const SWIM_ROWS = 13;
function isSwimmingAt(y: number): boolean {
  return y > map.beach.seaTop + SWIM_DEPTH;
}
function inSea(x: number, y: number): boolean {
  return y >= map.beach.seaTop + 0.5 && y <= map.height - 0.5 && x >= map.world.x0 + 0.5 && x <= map.world.x1 - 0.5;
}

// 現在這一步能不能站（騎車時要待在那台車能去的範圍裡；走路的話海裡也能去，就是游泳）
function canOccupy(x: number, y: number): boolean {
  if (!riding) return inSea(x, y) || (nav ? !nav.isBlocked(x, y) : false);
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
  v.idleSince = null;
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
  // 小船離岸很遠：直接跳下水游泳
  const spot =
    v.kind === 'boat' && v.y > map.beach.seaTop + 1.6
      ? { x: v.x, z: Math.min(map.height - 0.5, v.y + 0.6) }
      : nav.nearestFree(v.kind === 'boat' ? { x: v.x, z: shoreY } : { x: v.x, z: v.y + 0.5 });
  if (!spot) return false;
  riding = null;
  isRiding.value = false;
  v.vx = 0;
  v.vy = 0;
  v.idleSince = performance.now() / 1000;
  placePlayer(spot.x, spot.z);
  player.state = 'idle';
  // 在 YouBike 站旁下車就是還車：車子收進站裡
  if (v.kind === 'bike' && nearestStation()) {
    vehicles = vehicles.filter((other) => other !== v);
    say('me', `🚲 ${t.value.seatScene.bikeReturned}`);
  }
  return true;
}

function handleDismountClick(): void {
  containerRef.value?.focus({ preventScroll: true });
  dismount();
}

// ── YouBike 站：借車（站旁按 E 或點站）、騎到任何一站旁下車就還車 ──
const STATION_REACH = 1.8;
let goalStation: { x: number; y: number } | null = null;

function stations(): { x: number; y: number; rect: { x0: number; x1: number; y0: number; y1: number } }[] {
  return map.world.props
    .filter((p) => p.kind === 'youbike')
    .map((p) => ({ x: p.tx + p.w / 2, y: p.ty + p.h + 0.4, rect: { x0: p.tx, x1: p.tx + p.w, y0: p.ty - 1, y1: p.ty + p.h } }));
}

function nearestStation(): { x: number; y: number } | undefined {
  return stations().find((s) => Math.hypot(s.x - player.x, s.y - player.y) < STATION_REACH);
}

// 整個地圖同時最多 10 台借出去的 YouBike（停在外面的也算）
const MAX_RENTED_BIKES = 10;

function takeBike(): void {
  if (vehicles.filter((v) => v.kind === 'bike' && !v.home).length >= MAX_RENTED_BIKES) {
    say('me', `🚲 ${t.value.seatScene.bikesAllOut}`);
    return;
  }
  if (player.state === 'seated') standUp();
  const bike: VehicleState = { kind: 'bike', x: player.x, y: player.y, facing: player.facing, vx: 0, vy: 0, idleSince: null };
  vehicles.push(bike);
  mount(bike);
  say('me', `🚲 ${t.value.seatScene.bikeTaken}`);
}

function walkToStation(station: { x: number; y: number }): void {
  if (riding && !dismount()) return;
  if (Math.hypot(station.x - player.x, station.y - player.y) < STATION_REACH) {
    takeBike();
    return;
  }
  walkToPoint(station);
  goalStation = station;
}

// 躺在圖書館地板上（L，或沒有其他東西可以用時按 E；手機點自己）
function lieOnFloor(): void {
  if (riding || areaAt(map, player.x, player.y) !== 'library') return;
  lieDown({ x: player.x, y: player.y, pose: 'floor', rect: { x0: 0, x1: 0, y0: 0, y1: 0 } });
  player.facing = 'down';
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
  if (spot?.pose === 'floor') {
    player.state = 'idle';
    return;
  }
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
  goalStation = null;
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
  // 點到海裡：先走到岸邊，再直直游過去
  if (inSea(target.x, target.y) && isSwimmingAt(target.y)) {
    const swimTo = { x: target.x, z: Math.min(map.height - 0.5, target.y) };
    if (isSwimmingAt(player.y) || inSea(player.x, player.y)) {
      player.path = [swimTo];
    } else {
      const shore = findPath({ x: Math.min(map.world.x1 - 0.5, Math.max(map.world.x0 + 0.5, target.x)), y: map.beach.seaTop + 0.5 });
      if (!shore) return;
      player.path = [...shore.slice(1), swimTo];
    }
    player.goalSeatId = null;
    player.state = 'walking';
    return;
  }
  // 點到牆外：走到最靠近的邊緣
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

// 按下專注前父層來問：要在哪個座位專注。坐著、正要坐下、正走向座位、或就站在空位旁 → 那個座位（人直接坐好）；
// 躺在懶骨頭／躺椅／地板上 → null，人留在原地，座位還是原本保留的那個
// 開始專注用哪個座位：坐著／正要坐／走去坐／站在空位旁 → 那個座位；躺著 → 'lying'（躺著專注，保留原本的座位）；
// 其他（走在路上、騎車、游泳）→ null，父層會提示「還沒坐下」
function seatForFocus(): string | null {
  if (player.state === 'seated') return player.seatId;
  if (player.state === 'lying') return 'lying';
  const id = player.state === 'sitting' ? player.sitSeatId : (player.goalSeatId ?? (riding ? null : (nearestSittableSeat() ?? seatBeside())?.seatId ?? null));
  const node = seatNodes.find((n) => n.seatId === id);
  if (!node || (node.state !== 'empty' && node.state !== 'me')) return null;
  snapToSeat(node);
  return node.seatId;
}

// 不管從哪一側靠近：人跟空椅子貼在一起就算
function seatBeside(): SeatNode | undefined {
  let best: SeatNode | undefined;
  let bestDist = 1.8;
  for (const node of seatNodes) {
    if (!sitCandidate(node)) continue;
    const c = seatCenter(node.slot);
    const dist = Math.hypot(player.x - c.x, player.y - c.y);
    if (dist < bestDist) {
      bestDist = dist;
      best = node;
    }
  }
  return best;
}

// 分享位置用：自己現在站（或坐）在哪
function positionForShare(): { x: number; y: number } {
  return { x: Math.round(player.x * 10) / 10, y: Math.round(player.y * 10) / 10 };
}

defineExpose({ seatForFocus, positionForShare });

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
  if (active && player.state === 'lying' && (['up', 'down', 'left', 'right'].some((k) => keys.has(k)) || stick.x || stick.y)) getUp();

  if (active && (player.state === 'idle' || player.state === 'walking' || player.state === 'seated')) {
    const dx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0) || stick.x;
    const dy = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0) || stick.y;
    if (dx !== 0 || dy !== 0) {
      if (player.state === 'seated') standUp();
      player.path = [];
      player.goalSeatId = null;
      player.state = 'idle';
      goalVehicle = null;
      const length = Math.hypot(dx, dy);
      const speed = riding ? VEHICLE_SPEED[riding.kind] : isSwimmingAt(player.y) ? SWIM_SPEED : WALK_SPEED;
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
        if (goalStation && Math.hypot(goalStation.x - player.x, goalStation.y - player.y) < STATION_REACH) takeBike();
        goalStation = null;
      } else {
        const toX = next.x - player.x;
        const toY = next.z - player.y;
        const dist = Math.hypot(toX, toY);
        const step = (riding ? VEHICLE_SPEED[riding.kind] : isSwimmingAt(player.y) ? SWIM_SPEED : WALK_SPEED) * dt;
        const nx = dist <= step ? next.x : player.x + (toX / dist) * step;
        const ny = dist <= step ? next.z : player.y + (toY / dist) * step;
        if (riding && !canOccupy(nx, ny)) {
          // 擦到牆角：先試著順著牆滑（只動 x 或只動 y），真的過不去才停下來
          const slideX = canOccupy(nx, player.y);
          const slideY = canOccupy(player.x, ny);
          if (slideX) player.x = nx;
          else if (slideY) player.y = ny;
          else {
            player.path = [];
            player.state = 'idle';
          }
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
    // 開始專注（disabled）時還站著：直接回到自己的座位（車子留在原地）；躺著的就讓他躺著專注
    if (props.disabled && player.state !== 'seated' && player.state !== 'lying') {
      lyingOn = null;
      if (riding) riding.idleSince = performance.now() / 1000;
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
  const atMrt = !riding && player.state !== 'seated' && player.state !== 'sitting' ? mrtTriggerAt(player.x, player.y) : undefined;
  if (!atMrt) mrtLock = false;
  else if (!mrtOpen.value) mrtAt.value = atMrt.station;
  const showMrt = active && atMrt !== undefined && !mrtLock;
  if (showMrt !== mrtOpen.value) mrtOpen.value = showMrt;
  // 門：有人站在門口就滑開
  const doorTarget = atElevator ? 1 : 0;
  elevatorDoor += Math.sign(doorTarget - elevatorDoor) * Math.min(Math.abs(doorTarget - elevatorDoor), dt * 3);
  const nowArea = areaAt(map, player.x, player.y);
  if (nowArea !== area.value) {
    area.value = nowArea;
    emit('area', nowArea);
  }

  nearSeatId = active && !riding && (player.state === 'idle' || player.state === 'walking') ? (nearestSittableSeat()?.seatId ?? null) : null;

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
      playTransition('stairs', '', { up: stair.target > props.currentFloor });
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
    ...(player.state === 'lying' && lyingOn?.pose === 'floor' ? { pose: 'floor' as const } : {}),
    ...(hidden ? { hidden: true } : {}),
  };
  const key = hidden ? 'hidden' : JSON.stringify(pos);
  // 坐著的話 key 固定是 hidden，只會送一次。停下來那一則也照間隔送（晚一點點沒關係），太密會被後端丟掉，別人就看到人停在半路還在走
  const due = key !== lastPosKey && seconds - lastPosSentAt >= POS_SEND_INTERVAL_S;
  const keepalive = !hidden && seconds - lastPosSentAt > POS_KEEPALIVE_S;
  if (!due && !keepalive) return;
  lastPosSentAt = seconds;
  lastPosKey = key;
  emit('position', pos);
}

function updateRemotePlayers(): void {
  const now = Date.now();
  for (const key of remoteShown.keys()) {
    const remote = props.remotePlayers[key];
    if (!remote || remote.scene || now - remote.at > REMOTE_STALE_MS) {
      remoteShown.delete(key);
      remoteTracks.delete(key);
    }
  }
  for (const remote of Object.values(props.remotePlayers)) {
    // 在 F1／環河公園的人不畫在主地圖
    if (remote.scene || now - remote.at > REMOTE_STALE_MS) continue;
    let track = remoteTracks.get(remote.key);
    if (!track) {
      track = { lastAt: remote.at, samples: [{ t: remote.at, x: remote.x, y: remote.y }] };
      remoteTracks.set(remote.key, track);
    } else if (remote.at !== track.lastAt) {
      track.lastAt = remote.at;
      const prev = track.samples[track.samples.length - 1];
      if (!prev || Math.hypot(remote.x - prev.x, remote.y - prev.y) > 6) {
        // 搭電梯、走樓梯、重新連線：直接跳過去
        track.samples = [{ t: remote.at, x: remote.x, y: remote.y }];
      } else if (remote.at - prev.t > 400) {
        // 停了一陣子才又動：當作剛剛才從原地出發
        track.samples = [{ t: remote.at - POS_SEND_INTERVAL_S * 1000, x: prev.x, y: prev.y }, { t: remote.at, x: remote.x, y: remote.y }];
      } else {
        // 兩則擠在一起到的話往後推一點，速度才不會忽快忽慢
        track.samples.push({ t: Math.max(remote.at, prev.t + 100), x: remote.x, y: remote.y });
      }
    }
    const at = now - REMOTE_DELAY_MS;
    const samples = track.samples;
    while (samples.length > 2 && (samples[1]?.t ?? Infinity) <= at) samples.shift();
    const a = samples[0];
    const b = samples[1];
    if (!a) continue;
    let x = a.x;
    let y = a.y;
    let moving = false;
    let facing = remote.facing;
    if (b && at > a.t) {
      const k = Math.min(1, (at - a.t) / Math.max(1, b.t - a.t));
      x = a.x + (b.x - a.x) * k;
      y = a.y + (b.y - a.y) * k;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      moving = k < 1 && Math.hypot(dx, dy) > 0.02;
      if (moving) facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
    }
    // 最後一個點走完了就停下來（腳不要還在動）
    if (!b || at >= b.t) {
      const last = b ?? a;
      x = last.x;
      y = last.y;
      moving = false;
      facing = remote.facing;
    }
    remoteShown.set(remote.key, { x, y, moving, facing });
  }
}

function remoteColors(remote: RemotePlayer, y: number): AvatarColors {
  const base = readerColors(remote);
  return areaAt(map, remote.x, y) === 'beach' ? { ...base, outfit: remote.body === 1 ? 'bikini' : 'trunks' } : base;
}

function remoteHeadOffset(remote: RemotePlayer): number {
  if (remote.lying) return -21;
  if (!remote.vehicle && isSwimmingAt(remoteShown.get(remote.key)?.y ?? remote.y)) return -16 + (AVATAR_SIZE.h - SWIM_ROWS);
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
          drawLying(c, colors, footX, shown.y * TILE + (remote.floor ? 5 : 0), !remote.floor && areaAt(map, shown.x, shown.y) === 'library', remote.floor === true);
          return;
        }
        if (vehicle) {
          const rows = RIDE_ROWS[vehicle];
          paintVehicle(c, vehicle, shown.facing, footX, footY, 'back', seconds, shown.moving);
          c.drawImage(getAvatarFrame(colors, shown.facing, 'idle'), 0, 0, AVATAR_SIZE.w, rows, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - RIDE_LIFT[vehicle] - rows), AVATAR_SIZE.w, rows);
          paintVehicle(c, vehicle, shown.facing, footX, footY, 'front', seconds, shown.moving);
          return;
        }
        if (isSwimmingAt(shown.y)) {
          drawSwimmer(c, colors, shown.facing, footX, shown.y * TILE, shown.moving, seconds);
          return;
        }
        const frame = shown.moving ? (Math.floor(seconds / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
        c.fillStyle = 'rgba(0, 0, 0, 0.18)';
        c.fillRect(Math.round(footX - 5), Math.round(footY - 2), 10, 2);
        drawAvatar(c, colors, shown.facing, frame, footX, footY, false);
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
  const dpr = canvasDpr();
  if (canvas.width !== Math.round(cssW * dpr) || canvas.height !== Math.round(cssH * dpr)) {
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
  }
  const { world } = map;
  const worldW = (world.x1 - world.x0) * TILE;
  const worldH = (world.y1 - world.y0) * TILE;
  const fit = Math.floor(Math.min(cssW / worldW, cssH / worldH));
  // 桌機畫面夠大就放大到 3 倍，跟 Gather 一樣只看得到人附近、鏡頭跟著走
  const scale = Math.max(cssW >= 900 ? 3 : MIN_SCALE, fit);
  const viewW = worldW * scale;
  const viewH = worldH * scale;
  // 放得下就置中；放不下就讓玩家在畫面中間，但不超出地圖邊緣
  const follow = (size: number, world: number, focus: number) =>
    world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - focus));
  // 世界左上角是負座標：先當作從 0 開始算，再把原點移回去
  const ox = follow(cssW, viewW, (player.x - world.x0) * TILE * scale) - world.x0 * TILE * scale;
  const oy = follow(cssH, viewH, (player.y - world.y0) * TILE * scale) - world.y0 * TILE * scale;
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

// 游泳：只畫露出水面的上半身，跟著水浮上浮下；游的時候兩側濺水花，停著就是一圈漣漪
function drawSwimmer(c: CanvasRenderingContext2D, colors: AvatarColors, facing: Facing, x: number, y: number, moving: boolean, seconds: number): void {
  const water = Math.round(y + 2);
  const bob = Math.floor(seconds * (moving ? 4 : 2)) % 2;
  const frame = moving ? (Math.floor(seconds / 0.2) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  const sprite = getAvatarFrame(colors, facing, frame);
  c.drawImage(sprite, 0, 0, AVATAR_SIZE.w, SWIM_ROWS, Math.round(x - AVATAR_SIZE.w / 2), water - SWIM_ROWS + bob, AVATAR_SIZE.w, SWIM_ROWS);
  // 水面線蓋在身上
  c.fillStyle = 'rgba(120, 200, 235, 0.85)';
  c.fillRect(Math.round(x - 7), water, 14, 2);
  c.fillStyle = 'rgba(255, 255, 255, 0.85)';
  const ring = moving ? 0 : Math.floor(seconds * 1.5) % 3;
  c.fillRect(Math.round(x - 8 - ring), water + 1, 3, 1);
  c.fillRect(Math.round(x + 5 + ring), water + 1, 3, 1);
  if (moving) {
    // 划水：左右輪流濺起水花
    const left = Math.floor(seconds / 0.2) % 2 === 0;
    const sx = Math.round(x + (left ? -7 : 6));
    c.fillRect(sx, water - 2, 1, 1);
    c.fillRect(sx + (left ? -1 : 1), water - 3, 1, 1);
    c.fillRect(sx, water - 1, 2, 1);
  }
}

function seatDrawables(node: SeatNode, seconds: number): Drawable[] {
  const { slot } = node;
  const x = slot.tx * TILE;
  const y = slot.ty * TILE;
  const meSeated = node.state === 'me' && player.state === 'seated' && player.seatId === node.seatId;
  // 座位是別人保留的、但他人站在別處走動（還在送位置）：不要再畫一個坐著的他，不然同一個人會出現兩次
  const occupied = (node.state === 'mate' && !mateIsUp(node)) || node.state === 'taken' || meSeated;
  const highlighted = (hoveredSeatId === node.seatId || nearSeatId === node.seatId) && node.state === 'empty' && !props.disabled;
  const reservedAway = node.state === 'me' && !meSeated;

  const drawSeat = (c: CanvasRenderingContext2D) => {
    if (!sheet) return;
    if (slot.kind === 'chair') {
      const tile = slot.facing === 'down' ? 'chairDown' : slot.facing === 'up' ? 'chairUp' : slot.facing === 'right' ? 'chairRight' : 'chairLeft';
      drawKenney(c, sheet, tile, x, y);
    } else if (slot.kind === 'bench') {
      paintBenchSeat(c, x, y);
    } else if (slot.kind === 'plasticStool') {
      paintPlasticStool(c, x, y);
    } else if (slot.kind === 'beachChair') {
      paintBeachChair(c, x, y);
    } else if (slot.kind === 'floor') {
      if (!occupied) paintFloorSeat(c, x, y);
    } else if (slot.kind === 'rattan') {
      paintRattanChair(c, x, y, slot.facing);
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
    const lift = slot.kind === 'pouf' ? 5 : slot.kind === 'armchair' ? 6 : slot.kind === 'rattan' ? 5 : slot.kind === 'beachChair' ? 3 : slot.kind === 'floor' ? 0 : slot.facing === 'up' ? 2 : 4;
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
  if (player.state === 'lying') return lyingOn?.pose === 'floor' ? -14 : -21;
  if (!riding && isSwimmingAt(player.y)) return -16 + (AVATAR_SIZE.h - SWIM_ROWS);
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
function drawLying(c: CanvasRenderingContext2D, colors: AvatarColors, footX: number, footY: number, sink: boolean, floor = false): void {
  if (floor) {
    // 側躺在地板上：整個人轉 90 度，頭朝左
    c.fillStyle = 'rgba(0, 0, 0, 0.18)';
    c.fillRect(Math.round(footX - 11), Math.round(footY - 1), 22, 3);
    c.save();
    c.translate(Math.round(footX), Math.round(footY - 5));
    c.rotate(-Math.PI / 2);
    c.drawImage(getAvatarFrame(colors, 'down', 'idle'), -AVATAR_SIZE.w / 2, -AVATAR_SIZE.h / 2);
    c.restore();
    return;
  }
  if (sink) {
    drawAvatar(c, colors, 'down', 'idle', footX, footY + 1, true);
    return;
  }
  drawAvatar(c, colors, 'down', 'idle', footX, footY, false);
  paintSunglasses(c, Math.round(footX - AVATAR_SIZE.w / 2), Math.round(footY - AVATAR_SIZE.h));
}

// 戶外的建築，以及走來走去的路人、計程車
function outdoorDrawables(seconds: number): Drawable[] {
  const night = lightingNow() !== 'day';
  const list: Drawable[] = [];
  for (const prop of map.world.props) {
    list.push({
      sortY: prop.ty + prop.h,
      draw: (c: CanvasRenderingContext2D) => paintOutdoorProp(c, prop, seconds, night),
    });
  }
  for (const walker of map.world.walkers) {
    const pose = walkerPose(walker, seconds);
    list.push({
      sortY: pose.y + 0.35,
      draw: (c) =>
        paintWalker(c, walker, pose.x, pose.y, pose.dx, seconds, (footX, footY, facing, look) => {
          const frame = Math.floor(seconds / 0.18) % 2 === 0 ? 'walkA' : 'walkB';
          drawAvatar(c, avatarColorsFor(`walker-${look}`), facing, frame, footX, footY, false);
        }),
    });
  }
  return list;
}

function playerDrawable(seconds: number): Drawable | null {
  if (player.state === 'seated') return null;
  if (player.state === 'lying') {
    const sink = lyingOn?.pose === 'sink';
    const floor = lyingOn?.pose === 'floor';
    return {
      // 要蓋在躺椅／懶骨頭上面
      sortY: player.y + (floor ? 0.35 : 0.6),
      draw: (c) => drawLying(c, myAvatar(!sink && !floor), player.x * TILE, player.y * TILE + (floor ? 5 : 0), sink, floor),
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
  if (isSwimmingAt(player.y)) {
    return {
      sortY: player.y + 0.35,
      draw: (c) => drawSwimmer(c, myAvatar(true), player.facing, player.x * TILE, player.y * TILE, player.moving, seconds),
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

// tint：整張圖乘上去的色調；lamps：燈光的強度（黃昏時燈剛點起來，比較弱）
const OUTDOOR_NIGHT_TINT = '#7f88b8';
function drawNightLighting(c: CanvasRenderingContext2D, seconds: number, tint = NIGHT_TINT[map.theme], lamps = 1): void {
  const { world } = map;
  c.save();
  c.globalCompositeOperation = 'multiply';
  c.fillStyle = tint;
  c.fillRect(world.x0 * TILE, world.y0 * TILE, (world.x1 - world.x0) * TILE, (world.y1 - world.y0) * TILE);
  // 戶外比室內再暗一層（圖書館裡有開燈），路燈和燈籠才亮得起來
  if (lamps === 1) {
    c.beginPath();
    c.rect(world.x0 * TILE, world.y0 * TILE, (world.x1 - world.x0) * TILE, (world.y1 - world.y0) * TILE);
    c.rect(0, 0, map.width * TILE, map.libraryHeight * TILE);
    c.fillStyle = OUTDOOR_NIGHT_TINT;
    c.fill('evenodd');
  }
  c.globalCompositeOperation = 'lighter';
  c.globalAlpha = lamps;
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
  // 戶外：台北車站的大廳和窗、好丘和老平房的窗、101 的路燈與辦公室、捷運站
  for (const prop of world.props) {
    if (prop.kind === 'stationGates') glow((XY.hall.x0 + XY.hall.x1) * 0.5 * TILE, XY.hall.y1 * TILE - 20, 110, 'rgba(255, 240, 200, 0.35)');
    if (prop.kind === 'stationNight') {
      for (let x = XY.station.x0 + 2; x < XY.station.x1; x += 4) glow(x * TILE, XY.station.y1 * TILE - 30, 34, 'rgba(255, 210, 130, 0.22)');
      glow(16 * TILE, XY.station.y1 * TILE - 100, 60, 'rgba(255, 200, 110, 0.25)');
    }
    if (prop.kind === 'goodCho') {
      glow((prop.tx + 1.8) * TILE, (prop.ty + prop.h) * TILE - 18, 44, 'rgba(255, 200, 120, 0.42)');
      glow((prop.tx + prop.w - 2.2) * TILE, (prop.ty + prop.h) * TILE - 18, 50, 'rgba(255, 200, 120, 0.42)');
    }
    if (prop.kind === 'houseC') glow((prop.tx + 1) * TILE, (prop.ty + prop.h) * TILE - 18, 30, 'rgba(255, 210, 140, 0.3)');
    // 路燈：燈頭一團光＋照在地上的一圈
    if (prop.kind === 'streetLamp') {
      glow(prop.tx * TILE + 13, prop.ty * TILE - 21, 26, 'rgba(255, 236, 170, 0.5)');
      glow(prop.tx * TILE + 12, prop.ty * TILE + 10, 46, 'rgba(255, 214, 140, 0.32)');
    }
    if (prop.kind === 'mrt') glow((prop.tx + prop.w / 2) * TILE, prop.ty * TILE, 40, 'rgba(255, 255, 255, 0.25)');
    if (prop.kind === 'tower101') glow((prop.tx + prop.w / 2) * TILE, prop.ty * TILE - 60, 90, 'rgba(140, 220, 255, 0.18)');
  }
  const tvX = (map.tv.tx + map.tv.w / 2) * TILE;
  glow(tvX, TILE * 3, 60, `rgba(${TV_GLOW[map.theme]}, ${0.2 + Math.sin(seconds * 0.8) * 0.03})`);
  for (const [y0, y1] of map.windows) glow(TILE, ((y0 + y1) / 2) * TILE, 40, 'rgba(150, 180, 255, 0.14)');
  c.restore();
}

// 場景的光線：跟著瀏覽器的當地時間，或（關掉「跟著真實時間」時）跟著網站的深淺色。
// 當地時間：5–8 點清晨、8–15 點白天、15–18 點黃昏，其他時間是晚上（路燈、燈籠會亮）
const DUSK_TINT = '#f0c9a8';
// 清晨：天剛亮的淡紫藍，路燈還沒關
const DAWN_TINT = '#c9c6e8';
function lightingNow(): 'dawn' | 'day' | 'dusk' | 'night' {
  if (!playerPrefs.value.sceneClock) return dark ? 'night' : 'day';
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 8) return 'dawn';
  if (hour >= 8 && hour < 15) return 'day';
  if (hour >= 15 && hour < 18) return 'dusk';
  return 'night';
}

// 下雨：海灘上整片斜斜的雨絲、海面和沙上的小水花；室內只看得到窗戶上的雨痕
function drawRain(c: CanvasRenderingContext2D, seconds: number): void {
  // 戶外整片都下雨，圖書館裡面不下
  const { world } = map;
  const left = world.x0 * TILE;
  const top = world.y0 * TILE;
  const w = (world.x1 - world.x0) * TILE;
  const h = (world.y1 - world.y0) * TILE;
  const indoor = (x: number, y: number) => x >= 0 && x < map.width * TILE && y >= 0 && y < map.libraryHeight * TILE;
  c.save();
  c.fillStyle = 'rgba(40, 60, 90, 0.18)';
  c.fillRect(left, top, w, h);
  c.fillStyle = 'rgba(210, 225, 255, 0.55)';
  for (let i = 0; i < 420; i += 1) {
    const x = left + ((i * 97 + seconds * 40) % w);
    const y = top + ((i * 53 + seconds * 220) % h);
    if (indoor(x, y)) continue;
    c.fillRect(Math.round(x), Math.round(y), 1, 4);
    c.fillRect(Math.round(x) - 1, Math.round(y) + 4, 1, 2);
  }
  for (let i = 0; i < 70; i += 1) {
    const phase = (seconds * 1.7 + i * 0.29) % 1;
    if (phase > 0.35) continue;
    const x = left + ((i * 131 + Math.floor(seconds * 1.7 + i * 0.29) * 47) % w);
    const y = top + ((i * 71) % h);
    if (indoor(x, y)) continue;
    c.fillRect(x - 2, y, 1, 1);
    c.fillRect(x + 2, y, 1, 1);
    c.fillRect(x, y - 1, 1, 1);
  }
  c.fillStyle = 'rgba(220, 235, 255, 0.7)';
  for (const [y0, y1] of map.windows) {
    for (let i = 0; i < 6; i += 1) {
      const y = y0 * TILE + ((i * 13 + seconds * 18) % ((y1 - y0) * TILE));
      c.fillRect(5 + (i % 3) * 2, Math.round(y), 1, 3);
    }
  }
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
  c.fillRect(map.world.x0 * TILE, map.libraryHeight * TILE, (map.world.x1 - map.world.x0) * TILE, (map.height - map.libraryHeight) * TILE);
  c.restore();
}

// 小地圖：整張地圖縮小，標出座位、目前畫面看到的範圍、自己的位置
function renderMinimap(seconds: number): void {
  const canvas = minimapRef.value;
  if (!minimapOpen.value || !canvas || !staticLayer) return;
  const { world } = map;
  const worldW = (world.x1 - world.x0) * TILE;
  const worldH = (world.y1 - world.y0) * TILE;
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
  // 之後都用世界座標畫（左上角是負的）
  c.setTransform(dpr * k, 0, 0, dpr * k, -world.x0 * TILE * k * dpr, -world.y0 * TILE * k * dpr);
  c.imageSmoothingEnabled = true;
  c.drawImage(staticLayer, world.x0 * TILE, world.y0 * TILE, (world.x1 - world.x0) * TILE, (world.y1 - world.y0) * TILE);
  for (const prop of world.props) {
    const color = MINIMAP_OUTDOOR_COLORS[prop.kind];
    if (!color) continue;
    c.fillStyle = color;
    c.fillRect(prop.tx * TILE + 1, prop.ty * TILE + 1, prop.w * TILE - 2, prop.h * TILE - 2);
  }
  for (const prop of map.props) {
    const color = MINIMAP_PROP_COLORS[prop.kind];
    if (!color) continue;
    c.fillStyle = color;
    c.fillRect(prop.tx * TILE + 1, prop.ty * TILE + 1, prop.w * TILE - 2, prop.h * TILE - 2);
  }
  if (lightingNow() === 'night') {
    c.fillStyle = 'rgba(24, 20, 52, 0.35)';
    c.fillRect(world.x0 * TILE, world.y0 * TILE, worldW, worldH);
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
  const x0 = Math.max(world.x0 * TILE, -view.ox / view.scale);
  const y0 = Math.max(world.y0 * TILE, -view.oy / view.scale);
  const x1 = Math.min(world.x1 * TILE, (view.cssW - view.ox) / view.scale);
  const y1 = Math.min(world.y1 * TILE, (view.cssH - view.oy) / view.scale);
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
  const width = pillTextWidth(c, label) + 14;
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
  fillPillText(c, label, cx, y + height / 2 + 0.5);
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
  const width = pillTextWidth(c, text) + 18;
  const height = LABEL_FONT_PX + 13;
  // 冒出來時往上彈一下
  const pop = age < 0.15 ? Math.round((1 - age / 0.15) * 4) : 0;
  // 不要超出地圖畫布：例如夜市攤位在地圖最上緣，老闆的話冒在招牌上面會被切掉，就往下、往內收；尾巴還是指著說話的人
  const x = Math.min(Math.max(4, Math.round(cx - width / 2)), Math.max(4, Math.round(view.cssW - width - 4)));
  const y = Math.max(4, Math.round(bottom - height - 6 + pop));
  const tail = Math.round(Math.min(Math.max(cx, x + 6), x + width - 6));
  c.fillStyle = '#3b2a20';
  c.fillRect(x - 2, y - 2, width + 4, height + 4);
  c.fillRect(tail - 4, y + height, 8, 4);
  c.fillRect(tail - 2, y + height + 4, 4, 2);
  c.fillStyle = '#fffaf0';
  c.fillRect(x, y, width, height);
  c.fillRect(tail - 2, y + height, 4, 3);
  c.fillStyle = '#3b2a20';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  fillPillText(c, text, x + width / 2, y + height / 2 + 1);
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

  if (scale * dpr !== staticRes) {
    staticRes = scale * dpr;
    paintStatic();
  }
  if (staticLayer) drawLayer(ctx, staticLayer, map.world.x0 * TILE, map.world.y0 * TILE, (map.world.x1 - map.world.x0) * TILE, (map.world.y1 - map.world.y0) * TILE);
  paintWaves(ctx, map, seconds);
  paintElevatorDoors(ctx, map, elevatorDoor);
  paintAmbient(ctx, map, seconds, lightingNow() === 'night', 'under');
  paintEscalatorSteps(ctx, map, seconds);
  const drawables: Drawable[] = [
    ...propDrawables(seconds),
    ...seatNodes.flatMap((node) => seatDrawables(node, seconds)),
    ...vehicles.filter((v) => v !== riding).map((v) => vehicleDrawable(v, seconds)),
    ...map.beachgoers.map((goer) => beachgoerDrawable(goer, seconds)),
    ...remoteDrawables(seconds),
    ...outdoorDrawables(seconds),
  ];
  const me = playerDrawable(seconds);
  if (me) drawables.push(me);
  drawables.sort((a, b) => a.sortY - b.sortY);
  for (const item of drawables) item.draw(ctx);
  const light = lightingNow();
  if (light === 'night') drawNightLighting(ctx, seconds);
  else if (light === 'dusk') {
    drawSunlight(ctx);
    drawNightLighting(ctx, seconds, DUSK_TINT, 0.55);
  } else if (light === 'dawn') drawNightLighting(ctx, seconds, DAWN_TINT, 0.35);
  else drawSunlight(ctx);
  if (props.raining) drawRain(ctx, seconds);
  paintAmbient(ctx, map, seconds, lightingNow() === 'night', 'over');

  // 名牌與樓梯牌用螢幕座標畫，字才清楚、不會跟著像素一起放大
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const toScreen = (wx: number, wy: number) => ({ x: ox + wx * scale, y: oy + wy * scale });
  for (const stair of stairs) {
    const p = toScreen((stair.spot.tx + 1) * TILE, TILE + 2);
    const up = stair.spot.direction === 1;
    drawPill(ctx, up ? t.value.seatScene.stairUp(stair.target) : t.value.seatScene.stairDown(stair.target), p.x, p.y, up ? COLOR_ME : COLOR_MATE);
  }
  // 影音牆上掛個牌子：提醒可以點它放 YouTube（正在播就不用）
  if (!youtubeShowing.value) {
    const p = toScreen((map.tv.tx + map.tv.w / 2) * TILE, TILE + 2);
    drawPill(ctx, t.value.seatScene.youtubeTv, p.x, p.y, '#f87171');
  }
  if (props.floors.length > 1) {
    const p = toScreen((map.elevator.tx + 1) * TILE, TILE + 2);
    drawPill(ctx, t.value.seatScene.elevator, p.x, p.y, '#cbd5e1');
  }
  // 戶外的地標名牌，以及圖書館三道門通往哪裡
  for (const sign of map.world.signs) {
    const p = toScreen(sign.x * TILE, sign.y * TILE);
    drawPill(ctx, sign.text[locale.value], p.x, p.y, '#fbbf24');
  }
  const doors: [number, number, string][] = [
    [1.3, (map.sideExits.left?.y0 ?? 0) - 0.15, `← ${t.value.seatScene.exitTaipei101}`],
    [map.width - 1.3, (map.sideExits.right?.y0 ?? 0) - 0.15, `${t.value.seatScene.exitVillage} →`],
    [(map.world.backDoor[0] + map.world.backDoor[1]) / 2, WALL_ROWS + 0.9, `↑ ${t.value.seatScene.exitStation}`],
  ];
  for (const [x, y, text] of doors) {
    const p = toScreen(x * TILE, y * TILE);
    drawPill(ctx, text, p.x, p.y, COLOR_MATE);
  }
  if (map.beach.escalator) {
    const p = toScreen(((map.beach.door[0] + map.beach.door[1]) / 2) * TILE, map.beach.wallRow * TILE - 4);
    drawPill(ctx, t.value.seatScene.escalatorBeach, p.x, p.y, COLOR_MATE);
  }
  for (const node of seatNodes) {
    if (!node.label || mateIsUp(node)) continue;
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
    const away = Date.now() - remote.at > REMOTE_AWAY_MS;
    drawPill(ctx, `${away ? '💤 ' : ''}${remote.dnd ? '🔕 ' : ''}${remote.displayName}`, p.x, p.y, COLOR_MATE);
  }
  // 手上拿的夜市小吃（畫在螢幕座標，emoji 才清楚）
  ctx.font = `${Math.round(view.scale * 6)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  // 騎車：拿在把手上方；站著：拿在手上
  for (const remote of Object.values(props.remotePlayers)) {
    const shown = remoteShown.get(remote.key);
    if (!shown || !remote.item) continue;
    const p = toScreen(shown.x * TILE + 7, shown.y * TILE + (remote.vehicle ? -9 : -4));
    drawHeldItem(ctx, remote.item, p.x, p.y);
  }
  // 別人坐下時位置訊息是 hidden（人改畫在座位上），手上的東西另外記著畫在座位旁
  const nowMs = Date.now();
  for (const node of seatNodes) {
    if (node.state !== 'mate' || !node.mateKey) continue;
    const held = props.seatedItems[node.mateKey];
    if (!held || nowMs > held.until) continue;
    const p = toScreen(node.slot.tx * TILE + 14, node.slot.ty * TILE - 2);
    drawHeldItem(ctx, held.item, p.x, p.y);
  }
  drawBubbles(ctx, seconds, toScreen);
  renderMinimap(seconds);
  reportTvScreen(canvas);
}

// 牆上電視的螢幕（tvScreenRect）在視窗上的位置，給 YouTubeTv 把影片疊上去。
// 整台電視都在畫面裡、小地圖沒開才算看得到，不然它跳到右下角；切樓層／分區載入中整個藏起來。
function reportTvScreen(canvas: HTMLCanvasElement): void {
  const screen = tvScreenRect(map);
  const rect = canvas.getBoundingClientRect();
  const x = rect.left + view.ox + screen.x * view.scale;
  const y = rect.top + view.oy + screen.y * view.scale;
  const w = screen.w * view.scale;
  const h = screen.h * view.scale;
  // 全螢幕轉 90 度時影片疊不準：交給角落的小視窗
  const onMap = !sceneRotated.value && !minimapOpen.value;
  const visible = onMap && x >= rect.left && y >= rect.top && x + w <= rect.right && y + h <= rect.bottom;
  Object.assign(tvScreen, {
    visible,
    onMap,
    loading: props.isLoading,
    x: Math.round(x),
    y: Math.round(y),
    w: Math.round(w),
    h: Math.round(h),
    clipL: rect.left,
    clipT: rect.top,
    clipR: rect.right,
    clipB: rect.bottom,
  });
}

function animate(time: number): void {
  rafId = requestAnimationFrame(animate);
  if (!isVisible) tvScreen.visible = false;
  if (!ctx || !isVisible || document.hidden) return;
  const seconds = time / 1000;
  const dt = lastFrameTime ? Math.min(0.05, seconds - lastFrameTime) : 0;
  lastFrameTime = seconds;
  updatePlayer(dt);
  returnIdleVehicles();
  updateRemotePlayers();
  syncPosition(seconds);
  savePosition(seconds);
  render(seconds);
}

// ── 輸入 ──

function toWorld(event: MouseEvent): { x: number; y: number } | null {
  const canvas = canvasRef.value;
  if (!canvas) return null;
  const at = localPoint(canvas, event.clientX, event.clientY);
  return {
    x: (at.x - view.ox) / view.scale / TILE,
    y: (at.y - view.oy) / view.scale / TILE,
  };
}

// 手上的小吃（螢幕座標）：花生捲冰淇淋上面再插一撮香菜
function drawHeldItem(ctx: CanvasRenderingContext2D, item: ShopItemId, x: number, y: number): void {
  ctx.fillText(SHOP_ITEM_EMOJI[item], x, y);
  if (item !== 'icecreamRoll') return;
  const u = Math.max(1, Math.round(view.scale / 1.5));
  const top = Math.round(y - view.scale * 3.4) + u;
  const cx = Math.round(x);
  ctx.fillStyle = '#2f7d32';
  ctx.fillRect(cx - u, top - u * 2, u, u * 3);
  ctx.fillRect(cx + u, top - u * 3, u, u * 3);
  ctx.fillStyle = '#4caf50';
  ctx.fillRect(cx - u * 3, top - u * 3, u * 2, u * 2);
  ctx.fillRect(cx, top - u * 4, u * 2, u * 2);
  ctx.fillRect(cx + u * 2, top - u * 2, u * 2, u * 2);
  ctx.fillStyle = '#7bd47f';
  ctx.fillRect(cx - u * 3, top - u * 3, u, u);
  ctx.fillRect(cx, top - u * 4, u, u);
  ctx.fillRect(cx + u * 2, top - u * 2, u, u);
}

// 點到座位的格子，或坐著的人頭（座位上面那格）都算點座位；沒點正也算附近最近的空位（大約半格內）
function pickSeat(point: { x: number; y: number }): SeatNode | undefined {
  const tx = Math.floor(point.x);
  const ty = Math.floor(point.y);
  const exact =
    seatNodes.find((n) => n.slot.tx === tx && n.slot.ty === ty) ??
    seatNodes.find((n) => n.slot.tx === tx && n.slot.ty - 1 === ty && n.state !== 'empty');
  if (exact) return exact;
  let best: SeatNode | undefined;
  let bestDist = 1.05;
  for (const node of seatNodes) {
    if (node.state !== 'empty') continue;
    const dist = Math.hypot(point.x - (node.slot.tx + 0.5), point.y - (node.slot.ty + 0.5));
    if (dist < bestDist) {
      bestDist = dist;
      best = node;
    }
  }
  return best;
}

function handlePointerMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') return;
  const point = toWorld(event);
  const node = point ? pickSeat(point) : undefined;
  hoveredSeatId = node?.seatId ?? null;
  const canvas = canvasRef.value;
  const clickable = (node && node.state === 'empty' && !props.disabled) || (point !== null && pickTv(point));
  if (canvas) canvas.style.cursor = clickable ? 'pointer' : 'default';
}

function handlePointerLeave(): void {
  hoveredSeatId = null;
}

// 點到牆上的電視（point 是 tile 座標）
function pickTv(point: { x: number; y: number }): boolean {
  const screen = tvScreenRect(map);
  const x = point.x * TILE;
  const y = point.y * TILE;
  return x >= screen.x && x <= screen.x + screen.w && y >= screen.y && y <= screen.y + screen.h;
}

function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  // 點電視就是想看電視：專注中也不用起身
  const tvPoint = toWorld(event);
  if (tvPoint && pickTv(tvPoint)) {
    emit('open-tv');
    return;
  }
  if (props.disabled) {
    const point = toWorld(event);
    // 專注中還是可以點別人看名牌；點其他地方就是想走開
    if (point && !props.isLoading && pickPerson(point)) return;
    // 點自己的座位不算要離開
    if (point && pickSeat(point)?.state === 'me') return;
    askToLeave(() => handleClick(event));
    return;
  }
  if (!canInteract()) return;
  const point = toWorld(event);
  if (!point) return;
  if (pickPerson(point)) return;
  profileCard.value = null;
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
  const station = stations().find((s) => point.x >= s.rect.x0 && point.x <= s.rect.x1 && point.y >= s.rect.y0 && point.y <= s.rect.y1);
  if (station) {
    walkToStation(station);
    return;
  }
  // 點自己：在圖書館裡就躺下／起來（手機沒有鍵盤）
  if (!riding && Math.abs(point.x - player.x) < 0.5 && point.y > player.y - 1.3 && point.y < player.y + 0.4) {
    if (player.state === 'lying') getUp();
    else if (player.state === 'idle') lieOnFloor();
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
  if (canvas && askToLeave(() => handleMinimapClick(event))) return;
  if (!canvas || !canInteract()) return;
  const at = localPoint(canvas, event.clientX, event.clientY);
  const { world } = map;
  const point = {
    x: world.x0 + (at.x / at.width) * (world.x1 - world.x0),
    y: world.y0 + (at.y / at.height) * (world.y1 - world.y0),
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

function handleKeyDown(event: KeyboardEvent): void {
  if (keyBelongsToPage(event) || !isVisible) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const direction = KEY_MAP[event.code];
  if (direction) {
    event.preventDefault();
    if (props.disabled) {
      if (!event.repeat) askToLeave(null);
      return;
    }
    keys.add(direction);
    return;
  }
  if (props.disabled && ['Space', 'KeyE', 'Enter', 'KeyL'].includes(event.code) && !event.repeat) {
    event.preventDefault();
    askToLeave(null);
    return;
  }
  // 電梯面板開著：數字鍵選樓層、Z／X／C／V 選分區（這時候數字鍵不打招呼）
  if (elevatorOpen.value && !event.repeat) {
    const digit = /^Digit([1-9])$/.exec(event.code);
    if (digit && elevatorFloors.value.includes(Number(digit[1]))) {
      event.preventDefault();
      rideElevator(Number(digit[1]));
      return;
    }
    const zone = props.zones[ELEVATOR_ZONE_KEYS.indexOf(event.code)];
    if (zone) {
      event.preventDefault();
      rideElevatorToZone(zone.id);
      return;
    }
  }
  const emoteKey = event.code === 'KeyH' ? 0 : ['Digit1', 'Digit2', 'Digit3', 'Digit4'].indexOf(event.code);
  const emote = EMOTE_IDS[emoteKey];
  if (emote) {
    event.preventDefault();
    sendEmote(emote);
    return;
  }
  if (event.code === 'KeyL' && canInteract()) {
    event.preventDefault();
    if (player.state === 'lying') getUp();
    else if (player.state === 'idle' || player.state === 'walking') lieOnFloor();
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
      const node = nearestSittableSeat() ?? seatBeside();
      const lie = nearestLieSpot();
      const options: { dist: number; act: () => void }[] = [];
      if (node) options.push({ dist: Math.hypot(player.x - seatApproach(node.slot).x, player.y - seatApproach(node.slot).y), act: () => startSit(node) });
      if (vehicle) options.push({ dist: Math.hypot(vehicle.x - player.x, vehicle.y - player.y), act: () => mount(vehicle) });
      if (lie) options.push({ dist: Math.hypot(lie.x - player.x, lie.y - player.y), act: () => lieDown(lie) });
      const station = nearestStation();
      if (station) options.push({ dist: Math.hypot(station.x - player.x, station.y - player.y), act: takeBike });
      const best = options.sort((a, b) => a.dist - b.dist)[0];
      // 旁邊什麼都沒有：在圖書館裡就直接躺在地板上
      if (best) best.act();
      else lieOnFloor();
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
    if (map.beach.escalator !== hasEscalator()) {
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
  tvScreen.visible = false;
  tvScreen.onMap = false;
  tvScreen.loading = false;
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
