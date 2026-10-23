<template>
  <!-- 自己的家（登入才進得來）：上半是室內（床、書桌、書架、衣櫃），下半是花園（可以用專注幣買東西擺）。
       衣櫃換裝、花園布置都是草稿，按「儲存」才生效；沒存就要離開會先問（防呆），關網頁也會擋。 -->
  <div class="relative">
    <div
      ref="containerRef"
      class="scene-box relative h-[calc(100dvh-235px)] min-h-[320px] w-full overflow-hidden rounded-[3px] bg-[#6f984f] outline-none sm:h-[calc(100dvh-262px)] lg:h-[calc(100dvh-262px)] lg:min-h-[460px]"
      style="touch-action: pan-y"
      tabindex="0"
    >
      <canvas ref="canvasRef" class="block h-full w-full" @click="handleClick" />

      <!-- 右上：自己家是「布置花園」「好友」；去別人家是「誰的家」 -->
      <div v-if="!gardenDraft && !panel && !visit" class="absolute right-2 top-2 z-10 !flex !flex-nowrap gap-1.5">
        <button v-if="!VILLA" type="button" class="pixel-btn h-9 whitespace-nowrap px-2.5 text-xs" @click="panel = 'upgrade'">🏡 {{ t.home.upgrade }}</button>
        <button type="button" class="pixel-btn h-9 px-2.5 text-xs" @click="openFriends">
          👥 {{ t.friends.button }}<span v-if="incomingCount" class="ml-1 rounded-full bg-[#e25a4a] px-1.5 text-[10px] font-black text-white">{{ incomingCount }}</span>
        </button>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-2.5 text-xs" @click="startDecorate">
          {{ t.home.decorate }}
        </button>
      </div>
      <div v-if="visit" class="pixel-panel absolute right-2 top-2 z-10 px-3 py-1.5 text-xs font-black">
        🏠 {{ t.friends.visiting(visit.profile.name) }}
      </div>

      <FriendsPanel v-if="panel === 'friends'" @close="closePanel" @visit="emit('visit', $event)" />

      <!-- 升級大宅：用專注幣買（浴室、雙人床、書桌、噴水池、花園） -->
      <div v-if="panel === 'upgrade'" class="pixel-panel absolute inset-x-2 bottom-2 z-10 p-3 sm:left-1/2 sm:right-auto sm:w-[24rem] sm:-translate-x-1/2" @click.stop>
        <div class="!flex !flex-nowrap items-center justify-between gap-2">
          <p class="!mb-0 text-sm font-black">🏡 {{ t.home.upgradeTitle }}</p>
          <button type="button" class="text-[color:var(--px-muted)]" :aria-label="t.seatScene.profileClose" @click="closePanel">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <ul class="!mb-2 mt-2 space-y-1 !pl-0 text-xs font-bold" style="list-style: none">
          <li v-for="line in t.home.upgradePerks" :key="line">{{ line }}</li>
        </ul>
        <p class="!mb-2 text-[11px] leading-snug text-[color:var(--px-muted)]">{{ t.home.upgradeNote }}</p>
        <div class="!flex !flex-nowrap items-center justify-between gap-2">
          <span class="text-xs font-black">🪙 {{ prefs.coins }}</span>
          <button type="button" class="pixel-btn pixel-btn--primary h-9 whitespace-nowrap px-4 text-xs" :disabled="upgrading || prefs.coins < VILLA_PRICE" @click="buyVilla">
            {{ upgrading ? t.home.upgrading : t.home.upgradeBuy(VILLA_PRICE) }}
          </button>
        </div>
        <p v-if="prefs.coins < VILLA_PRICE" class="!mb-0 mt-1.5 text-[11px] text-[color:var(--px-muted)]">{{ t.home.notEnough(VILLA_PRICE, prefs.coins) }}</p>
      </div>

      <!-- 布置花園：選東西、放上去；儲存才扣幣 -->
      <div v-if="gardenDraft" class="pixel-panel absolute inset-x-2 bottom-2 z-10 p-2 sm:left-1/2 sm:right-auto sm:w-[32rem] sm:-translate-x-1/2">
        <p class="!mb-1.5 text-[11px] font-bold leading-snug">{{ t.home.decorating }}</p>
        <div class="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
          <button
            v-for="item in GARDEN_ITEMS"
            :key="item.id"
            type="button"
            class="pixel-btn !flex h-auto flex-col items-center gap-0 px-0.5 py-1 text-[10px]"
            :class="{ 'pixel-btn--active': selectedItem === item.id }"
            :aria-pressed="selectedItem === item.id"
            @click="selectedItem = selectedItem === item.id ? null : item.id"
          >
            <span class="text-base leading-none">{{ item.emoji }}</span>
            <span class="line-clamp-2 min-h-[2.2em] w-full break-all font-black leading-tight">{{ item.name[locale] }}</span>
            <span class="text-[9px]">🪙{{ item.price }}</span>
          </button>
        </div>
        <div class="mt-2 !flex !flex-nowrap items-center justify-between gap-2">
          <span class="text-xs font-black">{{ t.home.cost(gardenCost) }} · 🪙 {{ prefs.coins }}</span>
          <div class="!flex !flex-nowrap gap-1.5">
            <button type="button" class="pixel-btn h-8 px-3 text-xs" @click="cancelGarden">{{ t.home.cancel }}</button>
            <button type="button" class="pixel-btn pixel-btn--primary h-8 px-3 text-xs" @click="saveGarden()">{{ t.home.save }}</button>
          </div>
        </div>
      </div>

      <!-- 衣櫃：換裝（草稿，儲存才換上） -->
      <div
        v-if="panel === 'wardrobe' && lookDraft"
        class="pixel-panel absolute inset-x-2 bottom-2 top-2 z-30 overflow-y-auto p-3 sm:left-1/2 sm:right-auto sm:w-[34rem] sm:-translate-x-1/2"
      >
        <div class="!flex !flex-nowrap items-center justify-between gap-2">
          <p class="!mb-0 text-sm font-black">{{ t.home.wardrobe }}</p>
          <div class="!flex !flex-nowrap gap-1.5">
            <button type="button" class="pixel-btn h-8 px-3 text-xs" @click="closePanel">{{ t.home.cancel }}</button>
            <button type="button" class="pixel-btn pixel-btn--primary h-8 px-3 text-xs" @click="saveLook()">{{ t.home.save }}</button>
          </div>
        </div>
        <NameField class="mt-2" />
        <LookEditor v-model="lookDraft" class="mt-2" />
      </div>

      <!-- 書架：我的設定（每日目標、勿擾、悄悄話；開關改了就存） -->
      <div v-if="panel === 'settings'" class="pixel-panel absolute inset-x-2 bottom-2 z-10 p-3 sm:left-1/2 sm:right-auto sm:w-[26rem] sm:-translate-x-1/2">
        <div class="!flex !flex-nowrap items-center justify-between gap-2">
          <p class="!mb-0 text-sm font-black">{{ t.home.bookshelf }}</p>
          <button type="button" class="text-[color:var(--px-muted)]" :aria-label="t.seatScene.profileClose" @click="closePanel">
            <q-icon name="close" size="18px" />
          </button>
        </div>
        <p class="!mb-1 mt-2 text-[10px] font-black tracking-wide text-[color:var(--px-muted)]">{{ t.settingsPage.goalTitle }}</p>
        <div class="grid grid-cols-5 gap-1.5">
          <button
            v-for="hours in DAILY_GOAL_OPTIONS"
            :key="hours"
            type="button"
            class="pixel-btn h-8 text-xs"
            :class="{ 'pixel-btn--active': prefs.dailyGoalHours === hours }"
            @click="prefs.dailyGoalHours = hours"
          >
            {{ t.settingsPage.hours(hours) }}
          </button>
        </div>
        <label class="pixel-field mt-2 !flex items-center justify-between px-3 py-2 text-xs font-bold">
          🔕 {{ t.settingsPage.dndLabel }}
          <input v-model="prefs.doNotDisturb" type="checkbox" class="h-4 w-4 accent-amber-400" />
        </label>
        <label class="pixel-field mt-1.5 !flex items-center justify-between px-3 py-2 text-xs font-bold">
          🤫 {{ t.settingsPage.whispersLabel }}
          <input :checked="!prefs.whispersOff" type="checkbox" class="h-4 w-4 accent-amber-400" @change="prefs.whispersOff = !($event.target as HTMLInputElement).checked" />
        </label>
      </div>

      <!-- 花園門口：出門 -->
      <div v-if="gateOpen && !panel && !gardenDraft" class="pixel-panel absolute bottom-3 left-1/2 z-10 -translate-x-1/2 px-4 py-3 text-center">
        <p class="!mb-2 !text-[11px] font-black">{{ t.home.gatePrompt }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-9 px-4 text-xs" @click="requestLeave()">{{ t.home.gate }}</button>
      </div>

      <!-- 手機搖桿 -->
      <div
        v-if="isTouch && !panel"
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
    <SceneHint :text="visit ? t.friends.visitHint : isTouch ? t.home.hintTouch : t.home.hintDesktop" />

    <!-- 防呆：還沒儲存就要離開 -->
    <q-dialog v-model="unsavedOpen">
      <div class="pixel-panel w-[min(22rem,calc(100vw-2rem))] p-4 text-center">
        <p class="!mb-1 text-base font-black">💾 {{ t.home.unsavedTitle }}</p>
        <p class="!mb-3 text-xs text-[color:var(--px-muted)]">{{ t.home.unsavedHint }}</p>
        <div class="grid gap-2">
          <button type="button" class="pixel-btn pixel-btn--primary h-9 text-xs" @click="resolveUnsaved('save')">{{ t.home.saveAndLeave }}</button>
          <button type="button" class="pixel-btn h-9 text-xs" @click="resolveUnsaved('discard')">{{ t.home.discard }}</button>
          <button type="button" class="pixel-btn h-9 text-xs" @click="resolveUnsaved('keep')">{{ t.home.keepEditing }}</button>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useQuasar } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { DAILY_GOAL_OPTIONS, usePlayerPrefs, type GardenPlacement, type Look } from 'src/composables/usePlayerPrefs';
import { localPoint } from 'src/pages/index/composables/sceneFullscreen';
import LookEditor from 'src/pages/index/components/LookEditor.vue';
import NameField from 'src/pages/index/components/NameField.vue';
import FriendsPanel from 'src/pages/index/components/FriendsPanel.vue';
import { useFriends, type FriendHome } from 'src/composables/useFriends';
import { useAccount } from 'src/composables/useAccount';
import type { MyPosition, RemotePlayer } from 'src/pages/index/composables/useLibrarySocket';
import { createPositionSync, createRemoteView, remoteColors, remoteLabel, type ShownRemote } from 'src/pages/index/sceneRemotes';
import SceneHint from 'src/pages/index/components/SceneHint.vue';
import { AVATAR_SIZE, getAvatarFrame, lookColors, SEATED_ROWS, type AvatarColors } from 'src/pages/index/pixel/pixelArt';
import { drawGardenItem, drawMermaidFountain, GARDEN_ITEM_BY_ID, GARDEN_ITEMS, MERMAID_FOUNTAIN, paintFountainPlaza, STARTER_GARDEN, VILLA_GARDEN } from 'src/pages/index/pixel/homeArt';
import { px, seeded, pillTextWidth, fillPillText, canvasDpr, drawLayer, layerCanvas } from 'src/pages/index/pixel/pixelUtil';
import { rememberScene, takeArrival } from 'src/pages/index/shareLocation';
import { useYouTubeTv } from 'src/pages/index/composables/useYouTubeTv';
import { sceneRotated } from 'src/pages/index/composables/sceneFullscreen';

type Facing = 'up' | 'down' | 'left' | 'right';
type Rect = { x0: number; y0: number; x1: number; y1: number };

// theme：管理員給的客製化（後端 users.perks.homeTheme），'villa' 是有浴室、雙人床的大宅
// visit：去好友家（唯讀：不能換裝、改設定、布置花園）；屋主只有真的在家（連線在這個家）才看得到
// remotePlayers：同一個家裡的其他人（伺服器只把同一個家的位置送過來）
const props = defineProps<{ disabled: boolean; theme?: 'villa' | undefined; visit?: FriendHome | null | undefined; remotePlayers: Record<string, RemotePlayer> }>();
const VILLA = (props.visit ? props.visit.profile.theme : props.theme) === 'villa';
const emit = defineEmits<{ leave: []; visit: [code: string]; position: [position: MyPosition]; 'open-tv': [] }>();
const { tvScreen, showing: youtubeShowing } = useYouTubeTv();
const syncPosition = createPositionSync((pos) => emit('position', pos));
const viewRemotes = createRemoteView();
let shownRemotes: ShownRemote[] = [];
// 坐在書桌前的（站在椅子上、面向上、沒在走）
const remoteAtDesk = (r: ShownRemote) => Math.hypot(r.x - CHAIR.x, r.y - CHAIR.y) < 0.3 && !r.remote.moving;
// 坐在沙發哪一個位子上（站在位子上、沒在走）
const remoteOnSofa = (r: ShownRemote): number | null => {
  if (r.remote.moving) return null;
  const i = SOFA_SPOTS.findIndex((spot) => Math.hypot(r.x - spot.x, r.y - spot.y) < 0.3);
  return i < 0 ? null : i;
};
const { incoming } = useFriends();
const incomingCount = computed(() => incoming.value.length);
const { t, locale } = useLocale();
const $q = useQuasar();
const prefs = usePlayerPrefs();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const stickRef = ref<HTMLDivElement | null>(null);
const isTouch = ref(false);

// ── 場地（格，1 格 = 16px）：上面 0–11 是房子，下面 11–24 是花園 ──
const T = 16;
const W = 20;
const H = 24;
const HOUSE_BOTTOM = 11;
const DOOR = { x0: 9, x1: 11 };
// villa：左上隔一間浴室，雙人床移到中間（可以躺），書桌、書架往右挪
const BED: Rect = VILLA ? { x0: 6.4, y0: 2.1, x1: 10, y1: 6.4 } : { x0: 1.5, y0: 2.6, x1: 4.5, y1: 6 };
const DESK: Rect = VILLA ? { x0: 10.9, y0: 2.6, x1: 13.7, y1: 3.8 } : { x0: 8.5, y0: 2.6, x1: 11.5, y1: 3.8 };
const CHAIR = VILLA ? { x: 12.3, y: 4.7 } : { x: 10, y: 4.7 };
const SHELF: Rect = VILLA ? { x0: 14.1, y0: 2, x1: 16.1, y1: 3.4 } : { x0: 12.8, y0: 2, x1: 15.6, y1: 3.4 };
const WARDROBE: Rect = { x0: 16.4, y0: 2, x1: 18.9, y1: 3.8 };
const RUG: Rect = VILLA ? { x0: 7, y0: 7.4, x1: 13, y1: 9.8 } : { x0: 6.5, y0: 6, x1: 13.5, y1: 9.2 };
// 浴室（villa）：外框、門（在下面那道牆）、浴缸、馬桶、洗手台
const BATHROOM: Rect = { x0: 0.4, y0: 1.9, x1: 5.6, y1: 7.4 };
const BATH_DOOR = { x0: 2.4, x1: 3.9 };
const TUB: Rect = { x0: 0.8, y0: 2.2, x1: 3.1, y1: 3.9 };
const SINK: Rect = { x0: 3.6, y0: 2.1, x1: 5.2, y1: 2.9 };
const TOILET: Rect = { x0: 0.8, y0: 5.4, x1: 1.8, y1: 6.7 };
const BED_SIDE = { x: BED.x1 + 0.6, y: (BED.y0 + BED.y1) / 2 + 0.6 };
// 浴缸前面（villa）：走到這裡按 E 或點浴缸就進去泡澡
const TUB_SIDE = { x: (TUB.x0 + TUB.x1) / 2, y: TUB.y1 + 0.7 };
const inBathroom = (x: number, y: number) => VILLA && x < BATHROOM.x1 && y < BATHROOM.y1;
const PLANTS = [
  { x: 1.6, y: 9.8 },
  { x: 18.4, y: 9.8 },
];
// 客廳右邊：矮櫃上一台大電視（螢幕朝我們）＋前面一張雙人沙發（背對畫面、面向電視）。
// 放 YouTube 時影片疊在電視螢幕上（TV_SCREEN，單位 px）；朋友在家裡也能按「邀請家裡的人一起看」
const TV_STAND: Rect = { x0: 13.6, y0: 8.15, x1: 18.4, y1: 8.75 };
const TV_SCREEN = { x: 16 * T - 28, y: Math.round(TV_STAND.y0 * T) - 39, w: 56, h: 32 };
const SOFA: Rect = { x0: 14.4, y0: 9.75, x1: 17.6, y1: 10.45 };
const SOFA_SPOTS = [
  { x: 15.25, y: 10 },
  { x: 16.75, y: 10 },
];
// 走到沙發前面（電視跟沙發中間）按 E 或點沙發就坐下
const SOFA_FRONT = { x: 16, y: 9.3 };
// 花園：可以擺東西的格子（避開步道、籬笆）
const GARDEN = { x0: 1, y0: 12, x1: 19, y1: 23 };
const PATH = { x0: 9, x1: 11 };
const GATE = { x: 10, y: 22.6 };
const SHELF_FRONT = { x: (SHELF.x0 + SHELF.x1) / 2, y: 4.3 };
const WARDROBE_FRONT = { x: 17.6, y: 4.6 };

// villa 花園中間的美人魚噴水池：池子擋路（橢圓），四周這塊不能擺東西，已經擺在上面的先不畫
const FOUNTAIN_AREA: Rect | null = VILLA ? { x0: 4, y0: 14, x1: 16, y1: 21 } : null;
const inFountain = (x: number, y: number) => {
  if (!VILLA) return false;
  const f = MERMAID_FOUNTAIN;
  return ((x - f.cx) / (f.rx + 0.25)) ** 2 + ((y - f.cy - f.face / 2) / (f.ry + f.face / 2 + 0.2)) ** 2 < 1;
};
const underFountain = (tx: number, ty: number) => !!FOUNTAIN_AREA && tx >= FOUNTAIN_AREA.x0 && tx < FOUNTAIN_AREA.x1 && ty >= FOUNTAIN_AREA.y0 && ty < FOUNTAIN_AREA.y1;

const inRect = (x: number, y: number, r: Rect, pad = 0) => x > r.x0 - pad && x < r.x1 + pad && y > r.y0 - pad && y < r.y1 + pad;

// 花園：正式存檔的、或布置中的草稿
const gardenDraft = ref<GardenPlacement[] | null>(null);
const placements = computed(() => (gardenDraft.value ?? props.visit?.garden ?? prefs.value.garden).filter((p) => {
  const item = GARDEN_ITEM_BY_ID[p.id];
  if (!item) return true;
  for (let dx = 0; dx < item.w; dx += 1) for (let dy = 0; dy < item.h; dy += 1) if (underFountain(p.x + dx, p.y + dy)) return false;
  return true;
}));

function occupiedBy(tx: number, ty: number, list: GardenPlacement[]): number {
  return list.findIndex((p) => {
    const item = GARDEN_ITEM_BY_ID[p.id];
    return !!item && tx >= p.x && tx < p.x + item.w && ty >= p.y && ty < p.y + item.h;
  });
}

const blocked = (x: number, y: number): boolean => {
  if (x < 0.6 || x > W - 0.6 || y < 2.2 || y > H - 0.8) return true;
  // 房子下緣那道牆（門口留空）
  if (y > HOUSE_BOTTOM - 0.5 && y < HOUSE_BOTTOM + 0.3 && !(x > DOOR.x0 + 0.2 && x < DOOR.x1 - 0.2)) return true;
  if (inRect(x, y, BED) || inRect(x, y, DESK) || inRect(x, y, SHELF) || inRect(x, y, WARDROBE)) return true;
  if (VILLA) {
    // 浴室的牆：右邊一道、下面一道（門口留空）
    if (y < BATHROOM.y1 + 0.2 && x > BATHROOM.x1 - 0.25 && x < BATHROOM.x1 + 0.35) return true;
    if (x < BATHROOM.x1 + 0.2 && y > BATHROOM.y1 - 0.2 && y < BATHROOM.y1 + 0.35 && !(x > BATH_DOOR.x0 && x < BATH_DOOR.x1)) return true;
    if (inRect(x, y, TUB) || inRect(x, y, SINK) || inRect(x, y, TOILET)) return true;
  }
  if (PLANTS.some((p) => Math.abs(x - p.x) < 0.5 && Math.abs(y - p.y) < 0.4)) return true;
  if (inRect(x, y, TV_STAND) || inRect(x, y, SOFA)) return true;
  if (inFountain(x, y)) return true;
  // 花園裡擺的東西（樹、燈只擋樹幹那一小塊）
  if (y > HOUSE_BOTTOM + 0.3) {
    const i = occupiedBy(Math.floor(x), Math.floor(y), placements.value);
    if (i >= 0) return true;
  }
  return false;
};

// ── 自己 ──
const me = { x: GATE.x, y: GATE.y - 1.5, facing: 'up' as Facing, moving: false, walkClock: 0 };
const seated = ref(false);
// 躺在床上（villa）：跟坐書桌一樣可以專注
const lying = ref(false);
// 泡在浴缸裡（villa）
const bathing = ref(false);
// 坐在沙發上（第幾個位子）：看電視用，也可以專注
const onSofa = ref<number | null>(null);
let route: { x: number; y: number }[] = [];
let arriveAction: (() => void) | null = null;
let stuckFor = 0;
const gateOpen = ref(false);
let gateLock = true;

const keys = new Set<string>();
const stick = { x: 0, y: 0 };
const knob = ref({ x: 0, y: 0 });
let stickPointer: number | null = null;

function input(): { x: number; y: number } {
  const x = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0) || stick.x;
  const y = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0) || stick.y;
  return { x, y };
}

// 走過去：房子和花園之間要先走到門口
function walkTo(to: { x: number; y: number }, onArrive: (() => void) | null = null): void {
  if (seated.value || lying.value || bathing.value || onSofa.value !== null) standUp();
  const inside = (y: number) => y < HOUSE_BOTTOM;
  const doorX = (DOOR.x0 + DOOR.x1) / 2;
  const pts: { x: number; y: number }[] = [];
  // 出浴室要先走到浴室門口
  const bathX = (BATH_DOOR.x0 + BATH_DOOR.x1) / 2;
  if (inBathroom(me.x, me.y) && !inBathroom(to.x, to.y)) pts.push({ x: bathX, y: BATHROOM.y1 - 0.6 }, { x: bathX, y: BATHROOM.y1 + 0.8 });
  if (inside(me.y) !== inside(to.y)) pts.push({ x: doorX, y: inside(me.y) ? HOUSE_BOTTOM - 0.9 : HOUSE_BOTTOM + 0.9 }, { x: doorX, y: inside(me.y) ? HOUSE_BOTTOM + 0.9 : HOUSE_BOTTOM - 0.9 });
  // 進浴室：先走到浴室門口
  if (!inBathroom(me.x, me.y) && inBathroom(to.x, to.y)) pts.push({ x: bathX, y: BATHROOM.y1 + 0.8 }, { x: bathX, y: BATHROOM.y1 - 0.6 });
  route = [...pts, to];
  arriveAction = onArrive;
  stuckFor = 0;
}

function sitAtDesk(): void {
  route = [];
  arriveAction = null;
  bathing.value = false;
  onSofa.value = null;
  seated.value = true;
  me.x = CHAIR.x;
  me.y = CHAIR.y;
  me.facing = 'up';
}

function lieDown(): void {
  route = [];
  arriveAction = null;
  seated.value = false;
  bathing.value = false;
  onSofa.value = null;
  lying.value = true;
}

function bathe(): void {
  route = [];
  arriveAction = null;
  seated.value = false;
  lying.value = false;
  bathing.value = true;
}

// 坐沙發：挑空的那個位子（朋友坐了一邊就坐另一邊）
function sitOnSofa(): void {
  const taken = new Set(shownRemotes.map(remoteOnSofa).filter((i) => i !== null));
  const free = SOFA_SPOTS.findIndex((_, i) => !taken.has(i));
  if (free < 0) return;
  route = [];
  arriveAction = null;
  onSofa.value = free;
  me.facing = 'up';
}

function standUp(): void {
  if (onSofa.value !== null) {
    onSofa.value = null;
    me.x = SOFA_FRONT.x;
    me.y = SOFA_FRONT.y;
    me.facing = 'down';
    return;
  }
  if (bathing.value) {
    bathing.value = false;
    me.x = TUB_SIDE.x;
    me.y = TUB_SIDE.y;
    me.facing = 'down';
    return;
  }
  if (lying.value) {
    lying.value = false;
    me.x = BED_SIDE.x;
    me.y = BED_SIDE.y;
    return;
  }
  seated.value = false;
  me.y = CHAIR.y + 0.9;
}

// 按專注時父層來問：坐在書桌前就可以（家裡不用搶座位）；在屋裡的話直接幫你坐到書桌前；在花園才回 null（提示要進屋坐）
function seatForFocus(): string | null {
  if (lying.value || onSofa.value !== null) return 'lying';
  if (!seated.value && me.y < HOUSE_BOTTOM) sitAtDesk();
  return seated.value ? 'lying' : null;
}

function positionForShare(): { x: number; y: number } {
  return { x: me.x, y: me.y };
}

function step(dx: number, dy: number, dt: number): void {
  const length = Math.hypot(dx, dy) || 1;
  const nx = me.x + (dx / length) * 4.2 * dt;
  const ny = me.y + (dy / length) * 4.2 * dt;
  const bx = me.x;
  const by = me.y;
  if (!blocked(nx, me.y)) me.x = nx;
  if (!blocked(me.x, ny)) me.y = ny;
  stuckFor = Math.hypot(me.x - bx, me.y - by) < 0.01 ? stuckFor + dt : 0;
  me.facing = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
  me.walkClock += dt;
}

function updateWalk(dt: number): void {
  if (props.disabled && !seated.value && !lying.value && onSofa.value === null) sitAtDesk();
  if (panel.value) {
    me.moving = false;
    return;
  }
  const { x, y } = input();
  if (seated.value || lying.value || bathing.value || onSofa.value !== null) {
    me.moving = false;
    if ((x === 0 && y === 0) || props.disabled) return;
    standUp();
  }
  if (x !== 0 || y !== 0) {
    route = [];
    arriveAction = null;
    me.moving = true;
    step(x, y, dt);
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
          const action = arriveAction;
          arriveAction = null;
          action?.();
        }
      } else {
        me.moving = true;
        step(dx, dy, dt);
      }
    }
  } else {
    me.moving = false;
  }
  const atGate = Math.hypot(me.x - GATE.x, me.y - GATE.y) < 1.2;
  if (!atGate) gateLock = false;
  gateOpen.value = atGate && !gateLock;
}

// ── 衣櫃、書架面板 ──
const panel = ref<'wardrobe' | 'settings' | 'friends' | 'upgrade' | null>(null);

// ── 升級大宅（自己家才有） ──
const VILLA_PRICE = 1500;
const account = useAccount();
const upgrading = ref(false);
async function buyVilla(): Promise<void> {
  if (upgrading.value || VILLA || props.visit) return;
  if (prefs.value.coins < VILLA_PRICE) {
    $q.notify({ message: t.value.home.notEnough(VILLA_PRICE, prefs.value.coins), color: 'warning', icon: 'savings', position: 'top', timeout: 2500 });
    return;
  }
  upgrading.value = true;
  prefs.value.coins -= VILLA_PRICE;
  // 大宅的櫻花、玫瑰補在花園空的格子（原本擺的都留著）；先標記好，換成大宅時才不會整個花園被換掉
  const garden = prefs.value.garden.map((p) => ({ ...p }));
  for (const p of VILLA_GARDEN) if (occupiedBy(p.x, p.y, garden) < 0) garden.push({ ...p });
  const hadVillaGarden = prefs.value.villaGarden;
  prefs.value.villaGarden = true;
  const ok = await account.upgradeHome();
  upgrading.value = false;
  if (!ok) {
    prefs.value.coins += VILLA_PRICE;
    prefs.value.villaGarden = hadVillaGarden;
    $q.notify({ message: t.value.home.upgradeFailed, color: 'negative', position: 'top', timeout: 3000 });
    return;
  }
  prefs.value.garden = garden;
  // perks 換了，父層會用新的 key 把家重建成大宅
  $q.notify({ message: t.value.home.upgraded, color: 'positive', position: 'top', timeout: 3000 });
}

function openFriends(): void {
  panel.value = 'friends';
}
const lookDraft = ref<Look | null>(null);
const currentLook = (): Look => ({ hair: prefs.value.hair, shirt: prefs.value.shirt, body: prefs.value.body, acc: prefs.value.acc });
const lookDirty = computed(() => {
  const d = lookDraft.value;
  if (!d || panel.value !== 'wardrobe') return false;
  const c = currentLook();
  return d.hair !== c.hair || d.shirt !== c.shirt || d.body !== c.body || d.acc !== c.acc;
});

function openWardrobe(): void {
  lookDraft.value = currentLook();
  panel.value = 'wardrobe';
}

function saveLook(close = true): void {
  if (lookDraft.value) Object.assign(prefs.value, lookDraft.value);
  $q.notify({ message: t.value.home.saved, color: 'positive', icon: 'check', position: 'top', timeout: 1500 });
  if (close) {
    panel.value = null;
    lookDraft.value = null;
  }
}

function closePanel(): void {
  guard(() => {
    panel.value = null;
    lookDraft.value = null;
    containerRef.value?.focus({ preventScroll: true });
  });
}

// ── 布置花園（草稿） ──
const selectedItem = ref<string | null>(null);
const gardenCost = computed(() => {
  const draft = gardenDraft.value;
  if (!draft) return 0;
  const key = (p: GardenPlacement) => `${p.id}@${p.x},${p.y}`;
  const before = new Set(prefs.value.garden.map(key));
  const after = new Set(draft.map(key));
  let cost = 0;
  for (const p of draft) if (!before.has(key(p))) cost += GARDEN_ITEM_BY_ID[p.id]?.price ?? 0;
  // 收起來的退一半
  for (const p of prefs.value.garden) if (!after.has(key(p))) cost -= Math.floor((GARDEN_ITEM_BY_ID[p.id]?.price ?? 0) / 2);
  return cost;
});
const gardenDirty = computed(() => {
  const draft = gardenDraft.value;
  if (!draft) return false;
  const key = (list: GardenPlacement[]) => list.map((p) => `${p.id}@${p.x},${p.y}`).sort().join('|');
  return key(draft) !== key(prefs.value.garden);
});

function startDecorate(): void {
  gardenDraft.value = prefs.value.garden.map((p) => ({ ...p }));
  selectedItem.value = null;
  // 走到花園看得到的地方
  if (me.y < HOUSE_BOTTOM) walkTo({ x: 10, y: 14 });
}

// 放／收：點空地放選好的東西，點已經放的東西收起來
function editAt(x: number, y: number): void {
  const draft = gardenDraft.value;
  if (!draft) return;
  const tx = Math.floor(x);
  const ty = Math.floor(y);
  const hit = occupiedBy(tx, ty, draft);
  if (hit >= 0) {
    draft.splice(hit, 1);
    return;
  }
  const item = selectedItem.value ? GARDEN_ITEM_BY_ID[selectedItem.value] : undefined;
  if (!item) return;
  for (let dx = 0; dx < item.w; dx += 1) {
    for (let dy = 0; dy < item.h; dy += 1) {
      const cx = tx + dx;
      const cy = ty + dy;
      if (cx < GARDEN.x0 || cx >= GARDEN.x1 || cy < GARDEN.y0 || cy >= GARDEN.y1) return;
      if (cx >= PATH.x0 && cx < PATH.x1) return;
      if (underFountain(cx, cy)) return;
      if (occupiedBy(cx, cy, draft) >= 0) return;
      // 不要擺在人身上
      if (Math.floor(me.x) === cx && Math.floor(me.y) === cy) return;
    }
  }
  draft.push({ id: item.id, x: tx, y: ty });
}

function saveGarden(close = true): boolean {
  const draft = gardenDraft.value;
  if (!draft) return true;
  const cost = gardenCost.value;
  if (cost > prefs.value.coins) {
    $q.notify({ message: t.value.home.notEnough(cost, prefs.value.coins), color: 'warning', icon: 'savings', position: 'top', timeout: 2500 });
    return false;
  }
  prefs.value.coins -= cost;
  prefs.value.garden = draft.map((p) => ({ ...p }));
  $q.notify({ message: t.value.home.saved, color: 'positive', icon: 'check', position: 'top', timeout: 1500 });
  if (close) {
    gardenDraft.value = null;
    selectedItem.value = null;
  }
  return true;
}

function cancelGarden(): void {
  gardenDraft.value = null;
  selectedItem.value = null;
}

// ── 防呆：有沒存的改動就先問 ──
const dirty = computed(() => lookDirty.value || gardenDirty.value);
const unsavedOpen = ref(false);
let pendingAction: (() => void) | null = null;

function guard(action: () => void): void {
  if (!dirty.value) {
    action();
    return;
  }
  pendingAction = action;
  unsavedOpen.value = true;
}

function resolveUnsaved(choice: 'save' | 'discard' | 'keep'): void {
  unsavedOpen.value = false;
  const action = pendingAction;
  pendingAction = null;
  if (choice === 'keep') return;
  if (choice === 'save') {
    if (lookDirty.value) saveLook(false);
    if (gardenDirty.value && !saveGarden(false)) return;
  }
  panel.value = null;
  lookDraft.value = null;
  gardenDraft.value = null;
  selectedItem.value = null;
  action?.();
}

// 出門：父層按「回地圖」也會先來問；回傳 false 代表正在問要不要存，先別走
function requestLeave(): boolean {
  if (!dirty.value) {
    emit('leave');
    return true;
  }
  guard(() => emit('leave'));
  return false;
}

// 有沒存的改動先問，問完（或本來就沒改）再做 action（例如去朋友家）
function guardThen(action: () => void): void {
  guard(action);
}

defineExpose({ seatForFocus, positionForShare, requestLeave, guardThen });

function onBeforeUnload(event: BeforeUnloadEvent): void {
  if (!dirty.value) return;
  event.preventDefault();
  event.returnValue = '';
}

// ── 光線 ──
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
const view = { scale: 2, ox: 0, oy: 0 };

function paintGround(): HTMLCanvasElement {
  const { canvas, c } = layerCanvas(W * T, H * T, groundRes);
  if (!c) return canvas;
  const rand = seeded(77);
  // 花園草地
  px(c, '#7ea85a', 0, HOUSE_BOTTOM * T, W * T, (H - HOUSE_BOTTOM) * T);
  for (let i = 0; i < 900; i += 1) px(c, rand() < 0.5 ? '#8bb766' : '#6f984f', Math.floor(rand() * W * T), HOUSE_BOTTOM * T + Math.floor(rand() * (H - HOUSE_BOTTOM) * T), 2, 1);
  // 步道：villa 是碎石小徑上一塊塊白色石板；一般的是米色石磚
  if (VILLA) {
    px(c, '#d9d2c3', PATH.x0 * T + 1, HOUSE_BOTTOM * T, (PATH.x1 - PATH.x0) * T - 2, (H - HOUSE_BOTTOM) * T);
    for (let i = 0; i < 260; i += 1) px(c, rand() < 0.5 ? '#c4bba8' : '#ebe5d8', PATH.x0 * T + 1 + Math.floor(rand() * ((PATH.x1 - PATH.x0) * T - 3)), HOUSE_BOTTOM * T + Math.floor(rand() * (H - HOUSE_BOTTOM) * T), 1, 1);
    for (let y = HOUSE_BOTTOM; y < H; y += 1) {
      const off = y % 2 === 0 ? 3 : 7;
      c.fillStyle = '#9a958a';
      c.beginPath();
      c.roundRect(PATH.x0 * T + off, y * T + 3, 22, 11, 4);
      c.fill();
      c.fillStyle = '#f2efe8';
      c.beginPath();
      c.roundRect(PATH.x0 * T + off, y * T + 2, 22, 10, 4);
      c.fill();
      px(c, '#ffffff', PATH.x0 * T + off + 3, y * T + 3, 8, 1);
    }
    paintFountainPlaza(c);
  } else {
    for (let y = HOUSE_BOTTOM; y < H; y += 1) {
      px(c, '#cbbfa8', PATH.x0 * T + 2, y * T + 1, (PATH.x1 - PATH.x0) * T - 4, T - 2);
      px(c, '#b8ab92', PATH.x0 * T + 2, y * T + T - 2, (PATH.x1 - PATH.x0) * T - 4, 1);
    }
  }
  // 籬笆（左右、下面，門口留空）
  const picket = (x: number, y: number) => {
    px(c, '#f4eee2', x, y, 3, 10);
    px(c, '#d9d4c8', x, y + 8, 3, 2);
  };
  for (let x = 2; x < W * T - 2; x += 6) if (x < PATH.x0 * T - 2 || x > PATH.x1 * T) picket(x, (H - 1) * T + 2);
  for (let y = HOUSE_BOTTOM * T + 4; y < H * T - 4; y += 6) {
    picket(2, y);
    picket(W * T - 5, y);
  }
  px(c, '#e3dccb', 2, (H - 1) * T + 5, PATH.x0 * T - 2, 2);
  px(c, '#e3dccb', PATH.x1 * T, (H - 1) * T + 5, W * T - PATH.x1 * T - 2, 2);
  // 室內地板：villa 是淺色人字拼木地板；一般的是長木地板（每片深淺不一，接縫錯開）
  if (VILLA) {
    // 只畫在屋子裡（一片 16px 高，不裁會漏到花園）
    c.save();
    c.beginPath();
    c.rect(0, 0, W * T, HOUSE_BOTTOM * T);
    c.clip();
    px(c, '#e0c49a', 0, 0, W * T, HOUSE_BOTTOM * T);
    const tones = ['#e6cba2', '#dcbd90', '#e9d2ad', '#d6b688'];
    for (let y = -16, row = 0; y < HOUSE_BOTTOM * T; y += 8, row += 1) {
      for (let x = -16, col = 0; x < W * T + 16; x += 16, col += 1) {
        const tone = tones[(row + col * 3) % tones.length] ?? '#e0c49a';
        // 一片往右下斜、一片往右上斜，拼成 V 字
        c.fillStyle = tone;
        c.beginPath();
        c.moveTo(x, y + (col % 2 === 0 ? 0 : 8));
        c.lineTo(x + 8, y + (col % 2 === 0 ? 8 : 0));
        c.lineTo(x + 8, y + (col % 2 === 0 ? 16 : 8));
        c.lineTo(x, y + (col % 2 === 0 ? 8 : 16));
        c.closePath();
        c.fill();
        c.fillStyle = tones[(row + col * 3 + 2) % tones.length] ?? '#d6b688';
        c.beginPath();
        c.moveTo(x + 8, y + (col % 2 === 0 ? 8 : 0));
        c.lineTo(x + 16, y + (col % 2 === 0 ? 0 : 8));
        c.lineTo(x + 16, y + (col % 2 === 0 ? 8 : 16));
        c.lineTo(x + 8, y + (col % 2 === 0 ? 16 : 8));
        c.closePath();
        c.fill();
      }
    }
    c.restore();
    // 浴室：白色大理石磁磚
    const b = BATHROOM;
    px(c, '#eef1f4', b.x0 * T, b.y0 * T, (b.x1 - b.x0) * T, (b.y1 - b.y0) * T);
    for (let ty = b.y0 * T; ty < b.y1 * T; ty += 12) px(c, '#d5dbe2', b.x0 * T, ty, (b.x1 - b.x0) * T, 1);
    for (let tx = b.x0 * T; tx < b.x1 * T; tx += 12) px(c, '#d5dbe2', tx, b.y0 * T, 1, (b.y1 - b.y0) * T);
    for (let i = 0; i < 40; i += 1) px(c, '#dfe4ea', b.x0 * T + Math.floor(rand() * (b.x1 - b.x0) * T), b.y0 * T + Math.floor(rand() * (b.y1 - b.y0) * T), 3, 1);
    // 浴室門口的踏墊
    px(c, '#9ec5d6', BATH_DOOR.x0 * T + 2, (b.y1 + 0.25) * T, (BATH_DOOR.x1 - BATH_DOOR.x0) * T - 4, 9);
    px(c, '#c3dde8', BATH_DOOR.x0 * T + 4, (b.y1 + 0.25) * T + 2, (BATH_DOOR.x1 - BATH_DOOR.x0) * T - 8, 5);
  } else for (let y = 0, row = 0; y < HOUSE_BOTTOM * T; y += 8, row += 1) {
    let x = -((row * 37) % 80);
    let i = 0;
    while (x < W * T) {
      const len = 72 + ((row * 13 + i * 29) % 40);
      px(c, (row + i) % 3 === 0 ? '#c2925a' : (row + i) % 3 === 1 ? '#cb9c64' : '#c69660', x, y, len, 8);
      px(c, '#d6aa72', x + 2, y + 1, len - 4, 1);
      px(c, '#b0804a', x + len - 1, y, 1, 8);
      x += len;
      i += 1;
    }
    px(c, '#ad7d48', 0, y + 7, W * T, 1);
  }
  // 後牆＋窗
  px(c, '#e8dcc6', 0, 0, W * T, 2 * T);
  px(c, '#d4c4a8', 0, 2 * T - 4, W * T, 4);
  for (const wx of [5.2, 6.8]) {
    px(c, '#8a5c3a', wx * T, 6, 22, 18);
    px(c, '#a9d6e8', wx * T + 2, 8, 18, 14);
    px(c, '#8a5c3a', wx * T + 10, 8, 2, 14);
  }
  // 側牆
  px(c, '#a0815e', 0, 0, 6, HOUSE_BOTTOM * T);
  px(c, '#a0815e', W * T - 6, 0, 6, HOUSE_BOTTOM * T);
  // 下牆（門口留空）＋門檻
  px(c, '#a0815e', 0, HOUSE_BOTTOM * T - 6, DOOR.x0 * T, 8);
  px(c, '#a0815e', DOOR.x1 * T, HOUSE_BOTTOM * T - 6, W * T - DOOR.x1 * T, 8);
  px(c, '#8a5c3a', DOOR.x0 * T, HOUSE_BOTTOM * T - 2, (DOOR.x1 - DOOR.x0) * T, 4);
  // 地毯（villa 是米白色長毛毯）
  const r = RUG;
  const [rugA, rugB] = VILLA ? ['#e9e1d3', '#f6f1e8'] : ['#c46a55', '#e3a17a'];
  c.fillStyle = rugA;
  c.beginPath();
  c.roundRect(r.x0 * T, r.y0 * T, (r.x1 - r.x0) * T, (r.y1 - r.y0) * T, VILLA ? 10 : 0);
  c.fill();
  c.fillStyle = rugB;
  c.beginPath();
  c.roundRect(r.x0 * T + 4, r.y0 * T + 4, (r.x1 - r.x0) * T - 8, (r.y1 - r.y0) * T - 8, VILLA ? 8 : 0);
  c.fill();
  if (!VILLA) px(c, '#c46a55', r.x0 * T + 8, r.y0 * T + 8, (r.x1 - r.x0) * T - 16, (r.y1 - r.y0) * T - 16);
  return canvas;
}

// villa 的書桌：白橡木桌面＋黃銅邊、螢幕（會發光）、鍵盤、綠色銀行家檯燈、冒煙的馬克杯、小盆栽、攤開的筆記本，配一張有坐墊的辦公椅
function drawVillaDesk(c: CanvasRenderingContext2D, lit: boolean, seconds: number): void {
  const d = DESK;
  const x = d.x0 * T;
  const y = d.y0 * T;
  const w = (d.x1 - d.x0) * T;
  const h = (d.y1 - d.y0) * T;
  // 影子、桌腳
  px(c, 'rgba(0,0,0,0.2)', x + 2, y + h + 2, w, 4);
  px(c, '#b89a6e', x + 2, y + h - 2, 3, 6);
  px(c, '#b89a6e', x + w - 5, y + h - 2, 3, 6);
  // 桌面：白橡木＋木紋＋前緣黃銅條
  px(c, '#d9bf94', x, y, w, h);
  px(c, '#e8d3ad', x, y, w, 3);
  for (let i = 0; i < 4; i += 1) px(c, '#cdb085', x + 4 + i * 11, y + 5 + (i % 2) * 4, 8, 1);
  px(c, '#c9a227', x, y + h - 3, w, 2);
  px(c, '#e6c65a', x, y + h - 3, w, 1);
  // 螢幕：細黑框、發光的畫面（藍綠漸層＋幾行字）、銀色腳座
  const mx = x + w / 2 - 11;
  px(c, '#c9ccd3', mx + 9, y - 1, 4, 4);
  px(c, '#a7abb4', mx + 6, y + 2, 10, 2);
  px(c, '#1f2229', mx, y - 15, 22, 15);
  const g = c.createLinearGradient(0, y - 14, 0, y - 2);
  g.addColorStop(0, lit ? '#9fd8f0' : '#7cc4e4');
  g.addColorStop(1, lit ? '#c7a6f0' : '#a88ad8');
  c.fillStyle = g;
  c.fillRect(mx + 1, y - 14, 20, 12);
  px(c, 'rgba(255,255,255,0.85)', mx + 3, y - 12, 9, 1);
  px(c, 'rgba(255,255,255,0.6)', mx + 3, y - 10, 13, 1);
  px(c, 'rgba(255,255,255,0.6)', mx + 3, y - 8, 7, 1);
  // 游標閃
  if (Math.floor(seconds * 2) % 2 === 0) px(c, '#ffffff', mx + 11, y - 8, 1, 1);
  if (lit) {
    c.fillStyle = 'rgba(160, 210, 255, 0.18)';
    c.fillRect(mx - 4, y - 18, 30, 26);
  }
  // 鍵盤、滑鼠
  px(c, '#f2f2f4', mx + 2, y + 4, 16, 4);
  for (let i = 0; i < 7; i += 1) px(c, '#d6d8de', mx + 3 + i * 2, y + 5, 1, 1);
  px(c, '#f2f2f4', mx + 20, y + 5, 3, 3);
  // 左邊：綠色銀行家檯燈（黃銅桿、綠燈罩）
  const lx = x + 5;
  px(c, '#c9a227', lx, y + 1, 7, 2);
  px(c, '#c9a227', lx + 3, y - 7, 1, 8);
  px(c, '#1f6b46', lx - 1, y - 10, 10, 4);
  px(c, '#2f8a5c', lx, y - 10, 8, 1);
  px(c, lit ? '#fff2b8' : '#e8d9a0', lx, y - 6, 8, 1);
  if (lit) {
    const lg = c.createRadialGradient(lx + 4, y - 4, 0, lx + 4, y - 4, 22);
    lg.addColorStop(0, 'rgba(255, 230, 150, 0.45)');
    lg.addColorStop(1, 'rgba(255, 230, 150, 0)');
    c.fillStyle = lg;
    c.fillRect(lx - 18, y - 26, 44, 44);
  }
  // 攤開的筆記本＋筆
  px(c, '#fbf8f1', lx + 1, y + 5, 12, 6);
  px(c, '#e7e1d4', lx + 7, y + 5, 1, 6);
  px(c, '#c9c2b2', lx + 2, y + 7, 4, 1);
  px(c, '#c9c2b2', lx + 9, y + 7, 3, 1);
  px(c, '#3a3d45', lx + 13, y + 4, 1, 6);
  // 右邊：馬克杯（冒煙）＋小多肉
  const rx = x + w - 13;
  px(c, '#ffffff', rx, y + 2, 5, 5);
  px(c, '#e25a7a', rx, y + 3, 5, 1);
  px(c, '#ffffff', rx + 5, y + 3, 1, 3);
  const k = (seconds * 0.8) % 1;
  px(c, `rgba(255,255,255,${0.6 * (1 - k)})`, rx + 1 + Math.round(Math.sin(seconds * 3)), y - 1 - Math.round(k * 6), 1, 2);
  px(c, `rgba(255,255,255,${0.6 * (1 - ((k + 0.5) % 1))})`, rx + 3 + Math.round(Math.cos(seconds * 3)), y - 1 - Math.round(((k + 0.5) % 1) * 6), 1, 2);
  px(c, '#d97a4a', rx + 7, y - 1, 5, 4);
  px(c, '#4f9a4a', rx + 7, y - 5, 2, 4);
  px(c, '#6fb85e', rx + 9, y - 6, 2, 5);
  px(c, '#4f9a4a', rx + 11, y - 4, 1, 3);
  // 辦公椅（坐著時畫在人後面的椅背，見 drawPerson）
  if (!seated.value) drawVillaChair(c);
}

function drawVillaChair(c: CanvasRenderingContext2D): void {
  const cx = CHAIR.x * T;
  const cy = CHAIR.y * T;
  px(c, 'rgba(0,0,0,0.2)', cx - 6, cy + 4, 12, 3);
  // 五爪腳
  px(c, '#3a3d45', cx - 6, cy + 4, 12, 1);
  px(c, '#3a3d45', cx - 1, cy, 2, 4);
  // 坐墊（奶油色）＋椅背
  c.fillStyle = '#e9dfcf';
  c.beginPath();
  c.roundRect(cx - 7, cy - 4, 14, 6, 3);
  c.fill();
  c.fillStyle = '#d8ccb8';
  c.beginPath();
  c.roundRect(cx - 6, cy - 12, 12, 8, 3);
  c.fill();
  px(c, '#f4ede2', cx - 4, cy - 11, 8, 1);
}

// colors：被子（屋主衣服的顏色）；me：自己躺在床上時頭要畫成自己的樣子（去朋友家躺不能變成屋主）
function drawFurniture(c: CanvasRenderingContext2D, lit: boolean, colors: AvatarColors, me: AvatarColors, seconds = 0): void {
  if (VILLA) {
    const sleepers = shownRemotes.filter((r) => r.remote.lying).map((r) => remoteColors(r.remote));
    drawVillaBed(c, colors, me, sleepers[0] ?? null);
  }
  else {
    // 床：被子用自己衣服的顏色
    const b = BED;
    px(c, 'rgba(0,0,0,0.18)', b.x0 * T + 2, b.y1 * T - 2, (b.x1 - b.x0) * T, 4);
    px(c, '#6b4a2f', b.x0 * T, b.y0 * T, (b.x1 - b.x0) * T, (b.y1 - b.y0) * T);
    px(c, '#f4eee2', b.x0 * T + 3, b.y0 * T + 3, (b.x1 - b.x0) * T - 6, 12);
    px(c, colors.shirt, b.x0 * T + 3, b.y0 * T + 17, (b.x1 - b.x0) * T - 6, (b.y1 - b.y0) * T - 20);
    px(c, colors.shirtShade, b.x0 * T + 3, b.y0 * T + 17, (b.x1 - b.x0) * T - 6, 2);
  }
  if (VILLA) {
    const bathers = shownRemotes.filter((r) => r.remote.bath).map((r) => remoteColors(r.remote));
    drawBathroom(c, lit, bathing.value ? [me, ...bathers] : bathers, seconds);
  }
  // 書桌＋檯燈＋椅子（villa 是另一套精緻的）
  const d = DESK;
  if (VILLA) {
    drawVillaDesk(c, lit, seconds);
  } else {
  px(c, 'rgba(0,0,0,0.18)', d.x0 * T + 2, d.y1 * T, (d.x1 - d.x0) * T, 3);
  px(c, '#8a5c3a', d.x0 * T, d.y0 * T, (d.x1 - d.x0) * T, (d.y1 - d.y0) * T);
  px(c, '#a8754a', d.x0 * T, d.y0 * T, (d.x1 - d.x0) * T, 3);
  px(c, '#f4eee2', d.x0 * T + 10, d.y0 * T + 5, 12, 8);
  px(c, '#3a3d45', d.x1 * T - 12, d.y0 * T - 6, 2, 10);
  px(c, lit ? '#ffe9a8' : '#c9b98a', d.x1 * T - 16, d.y0 * T - 9, 9, 4);
  if (!seated.value) {
    px(c, '#6b4a2f', CHAIR.x * T - 6, CHAIR.y * T - 6, 12, 10);
    px(c, '#8a5c3a', CHAIR.x * T - 6, CHAIR.y * T - 6, 12, 2);
  }
  }
  // 書架
  const s = SHELF;
  px(c, '#6b4a2f', s.x0 * T, s.y0 * T - 10, (s.x1 - s.x0) * T, (s.y1 - s.y0) * T + 10);
  const bookColors = ['#e25a4a', '#4f8fd9', '#f6c945', '#4ade80', '#a78bfa', '#fb923c'];
  for (let row = 0; row < 2; row += 1) {
    for (let i = 0; i < 9; i += 1) px(c, bookColors[(i + row) % bookColors.length] ?? '#e25a4a', s.x0 * T + 3 + i * 4.6, s.y0 * T - 7 + row * 13, 3, 10);
    px(c, '#4a3220', s.x0 * T, s.y0 * T + 4 + row * 13, (s.x1 - s.x0) * T, 2);
  }
  // 衣櫃
  const w = WARDROBE;
  px(c, 'rgba(0,0,0,0.18)', w.x0 * T + 2, w.y1 * T, (w.x1 - w.x0) * T, 3);
  px(c, '#8a5c3a', w.x0 * T, w.y0 * T - 12, (w.x1 - w.x0) * T, (w.y1 - w.y0) * T + 12);
  px(c, '#a8754a', w.x0 * T + 3, w.y0 * T - 9, (w.x1 - w.x0) * T / 2 - 4, (w.y1 - w.y0) * T + 6);
  px(c, '#a8754a', w.x0 * T + (w.x1 - w.x0) * T / 2 + 1, w.y0 * T - 9, (w.x1 - w.x0) * T / 2 - 4, (w.y1 - w.y0) * T + 6);
  px(c, '#f6c945', w.x0 * T + (w.x1 - w.x0) * T / 2 - 3, w.y0 * T + 4, 2, 4);
  px(c, '#f6c945', w.x0 * T + (w.x1 - w.x0) * T / 2 + 1, w.y0 * T + 4, 2, 4);
  // 盆栽
  for (const p of PLANTS) {
    px(c, '#b8402f', p.x * T - 5, p.y * T - 2, 10, 7);
    px(c, '#3f8a4a', p.x * T - 7, p.y * T - 12, 14, 11);
    px(c, '#5aa85e', p.x * T - 4, p.y * T - 14, 6, 4);
  }
}

// villa 的雙人床：深色木頭床頭板、白色床單、兩顆枕頭、蓬蓬的棉被（顏色跟著衣服）；躺著的話頭在左邊枕頭上、身體在被子裡
// other：躺在右邊枕頭的人（朋友來家裡一起躺）
function drawVillaBed(c: CanvasRenderingContext2D, colors: AvatarColors, me: AvatarColors, other: AvatarColors | null = null): void {
  const b = BED;
  const x = b.x0 * T;
  const y = b.y0 * T;
  const w = (b.x1 - b.x0) * T;
  const h = (b.y1 - b.y0) * T;
  px(c, 'rgba(0,0,0,0.2)', x + 3, y + h - 1, w, 5);
  // 床頭板
  px(c, '#5a3d2a', x - 2, y - 10, w + 4, 14);
  px(c, '#7a5236', x, y - 8, w, 10);
  for (let i = 0; i < 4; i += 1) px(c, '#6b4730', x + 6 + i * ((w - 12) / 3) - 1, y - 7, 2, 8);
  // 床架、床單
  px(c, '#6b4a2f', x, y, w, h);
  px(c, '#f6f3ee', x + 2, y + 2, w - 4, h - 4);
  // 兩顆枕頭
  const pillow = (px0: number) => {
    c.fillStyle = '#d9d4cc';
    c.beginPath();
    c.roundRect(px0, y + 5, w / 2 - 8, 13, 4);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath();
    c.roundRect(px0, y + 4, w / 2 - 8, 12, 4);
    c.fill();
    px(c, '#ece8e1', px0 + 3, y + 12, w / 2 - 14, 1);
  };
  pillow(x + 5);
  pillow(x + w / 2 + 3);
  // 躺著：頭放在左邊枕頭上（棉被會蓋住身體）
  if (lying.value) {
    c.drawImage(getAvatarFrame(me, 'down', 'idle'), 0, 0, AVATAR_SIZE.w, 12, Math.round(x + 5 + (w / 2 - 8) / 2 - AVATAR_SIZE.w / 2), y + 2, AVATAR_SIZE.w, 12);
  }
  if (other) {
    c.drawImage(getAvatarFrame(other, 'down', 'idle'), 0, 0, AVATAR_SIZE.w, 12, Math.round(x + w / 2 + 3 + (w / 2 - 8) / 2 - AVATAR_SIZE.w / 2), y + 2, AVATAR_SIZE.w, 12);
  }
  // 棉被：上緣反摺一條白邊，表面幾道皺褶；躺著的那半邊鼓起來
  const qy = y + 20;
  c.fillStyle = colors.shirtShade;
  c.beginPath();
  c.roundRect(x + 1, qy + 1, w - 2, h - 21, 5);
  c.fill();
  c.fillStyle = colors.shirt;
  c.beginPath();
  c.roundRect(x + 1, qy, w - 2, h - 22, 5);
  c.fill();
  px(c, '#ffffff', x + 2, qy, w - 4, 4);
  px(c, '#eeeae4', x + 2, qy + 3, w - 4, 1);
  for (let i = 1; i < 4; i += 1) px(c, colors.shirtShade, x + 6, qy + 6 + i * ((h - 32) / 4), w - 12, 1);
  if (lying.value) {
    c.fillStyle = 'rgba(255,255,255,0.18)';
    c.beginPath();
    c.ellipse(x + w / 4 + 2, qy + (h - 22) / 2, w / 5, (h - 22) / 2.6, 0, 0, Math.PI * 2);
    c.fill();
  }
}

// villa 的浴室：牆、浴缸（有水和泡泡）、洗手台＋鏡子、馬桶、毛巾架
// bathers：泡在浴缸裡的人（最多畫兩個），水面上只露出頭和肩膀
function drawBathroom(c: CanvasRenderingContext2D, lit: boolean, bathers: AvatarColors[], seconds: number): void {
  const b = BATHROOM;
  // 隔間牆（右邊、下面，門口留空）
  px(c, '#cdbfa8', b.x1 * T - 3, b.y0 * T - 8, 6, (b.y1 - b.y0) * T + 12);
  px(c, '#e8dcc6', b.x1 * T - 2, b.y0 * T - 8, 4, (b.y1 - b.y0) * T + 10);
  px(c, '#cdbfa8', b.x0 * T, b.y1 * T - 3, (BATH_DOOR.x0 - b.x0) * T, 7);
  px(c, '#e8dcc6', b.x0 * T, b.y1 * T - 3, (BATH_DOOR.x0 - b.x0) * T, 4);
  px(c, '#cdbfa8', BATH_DOOR.x1 * T, b.y1 * T - 3, (b.x1 - BATH_DOOR.x1) * T + 2, 7);
  px(c, '#e8dcc6', BATH_DOOR.x1 * T, b.y1 * T - 3, (b.x1 - BATH_DOOR.x1) * T + 2, 4);
  // 浴缸
  const tb = TUB;
  c.fillStyle = '#c9d1da';
  c.beginPath();
  c.roundRect(tb.x0 * T, tb.y0 * T, (tb.x1 - tb.x0) * T, (tb.y1 - tb.y0) * T, 8);
  c.fill();
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.roundRect(tb.x0 * T + 1, tb.y0 * T, (tb.x1 - tb.x0) * T - 2, (tb.y1 - tb.y0) * T - 2, 8);
  c.fill();
  c.fillStyle = '#9fd8e6';
  c.beginPath();
  c.roundRect(tb.x0 * T + 4, tb.y0 * T + 4, (tb.x1 - tb.x0) * T - 8, (tb.y1 - tb.y0) * T - 9, 6);
  c.fill();
  for (const [bx, by, r] of [
    [6, 6, 3],
    [10, 8, 2],
    [26, 7, 3],
    [30, 10, 2],
  ] as const) {
    c.fillStyle = 'rgba(255,255,255,0.9)';
    c.beginPath();
    c.arc(tb.x0 * T + bx, tb.y0 * T + by, r, 0, Math.PI * 2);
    c.fill();
  }
  px(c, '#b9c2cc', tb.x1 * T - 8, tb.y0 * T + 2, 3, 4);
  if (bathers.length) {
    // 泡澡：頭和肩膀露出水面、身邊一圈泡泡、黃色小鴨、熱氣往上飄
    const slots = bathers.length > 1 ? [0.32, 0.68] : [0.5];
    bathers.slice(0, 2).forEach((col, i) => {
      const hx = Math.round((tb.x0 + (tb.x1 - tb.x0) * (slots[i] ?? 0.5)) * T);
      const top = Math.round(tb.y0 * T + 1);
      c.drawImage(getAvatarFrame(col, 'down', 'idle'), 0, 0, AVATAR_SIZE.w, 13, hx - AVATAR_SIZE.w / 2, top, AVATAR_SIZE.w, 13);
      for (let k = 0; k < 5; k += 1) {
        const bob = Math.sin(seconds * 2 + k + i) * 0.8;
        c.fillStyle = 'rgba(255,255,255,0.95)';
        c.beginPath();
        c.arc(hx - 8 + k * 4, top + 13 + bob, 2.4, 0, Math.PI * 2);
        c.fill();
      }
    });
    const duck = Math.sin(seconds * 0.8) * 3;
    px(c, '#f6c945', Math.round(tb.x1 * T - 14 + duck), tb.y0 * T + 15, 5, 3);
    px(c, '#f6c945', Math.round(tb.x1 * T - 11 + duck), tb.y0 * T + 13, 3, 3);
    px(c, '#f28a2e', Math.round(tb.x1 * T - 9 + duck), tb.y0 * T + 14, 2, 1);
    for (let k = 0; k < 4; k += 1) {
      const p = (seconds * 0.4 + k / 4) % 1;
      c.fillStyle = `rgba(255,255,255,${0.35 * (1 - p)})`;
      c.beginPath();
      c.arc(tb.x0 * T + 8 + k * 9 + Math.sin(seconds + k) * 3, tb.y0 * T - p * 18, 3 + p * 3, 0, Math.PI * 2);
      c.fill();
    }
  }
  // 洗手台＋鏡子
  const sk = SINK;
  px(c, '#a9d6e8', sk.x0 * T + 4, sk.y0 * T - 14, (sk.x1 - sk.x0) * T - 8, 11);
  px(c, '#d5edf5', sk.x0 * T + 6, sk.y0 * T - 12, 5, 3);
  px(c, '#b9c2cc', sk.x0 * T + 3, sk.y0 * T - 15, (sk.x1 - sk.x0) * T - 6, 1);
  px(c, '#8a5c3a', sk.x0 * T, sk.y0 * T, (sk.x1 - sk.x0) * T, (sk.y1 - sk.y0) * T);
  px(c, '#ffffff', sk.x0 * T + 6, sk.y0 * T + 2, (sk.x1 - sk.x0) * T - 12, 7);
  px(c, '#cfe6ee', sk.x0 * T + 8, sk.y0 * T + 4, (sk.x1 - sk.x0) * T - 16, 3);
  px(c, '#b9c2cc', sk.x0 * T + (sk.x1 - sk.x0) * T / 2 - 1, sk.y0 * T, 2, 3);
  // 馬桶
  const tl = TOILET;
  px(c, '#e3e8ee', tl.x0 * T + 2, tl.y0 * T, (tl.x1 - tl.x0) * T - 4, 7);
  c.fillStyle = '#ffffff';
  c.beginPath();
  c.ellipse(((tl.x0 + tl.x1) / 2) * T, tl.y0 * T + 13, ((tl.x1 - tl.x0) * T) / 2 - 1, 7, 0, 0, Math.PI * 2);
  c.fill();
  c.fillStyle = '#dfe4ea';
  c.beginPath();
  c.ellipse(((tl.x0 + tl.x1) / 2) * T, tl.y0 * T + 13, ((tl.x1 - tl.x0) * T) / 2 - 4, 4, 0, 0, Math.PI * 2);
  c.fill();
  // 毛巾架（右牆上）
  px(c, '#b9c2cc', (b.x1 - 0.5) * T, (b.y0 + 2.6) * T, 2, 18);
  px(c, '#f4a3bf', (b.x1 - 0.5) * T - 5, (b.y0 + 2.6) * T + 2, 6, 14);
  px(c, '#fbd3e0', (b.x1 - 0.5) * T - 5, (b.y0 + 2.6) * T + 2, 6, 2);
  if (lit) {
    c.fillStyle = 'rgba(255, 240, 200, 0.12)';
    c.fillRect(b.x0 * T, b.y0 * T, (b.x1 - b.x0) * T, (b.y1 - b.y0) * T);
  }
}

function drawPerson(c: CanvasRenderingContext2D, colors: AvatarColors): void {
  if (lying.value || bathing.value || onSofa.value !== null) return;
  if (seated.value) {
    c.drawImage(getAvatarFrame(colors, 'up', 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, Math.round(CHAIR.x * T - AVATAR_SIZE.w / 2), Math.round(CHAIR.y * T + 2 - SEATED_ROWS), AVATAR_SIZE.w, SEATED_ROWS);
    if (VILLA) {
      // 辦公椅的椅背擋在人前面（背對我們坐）
      c.fillStyle = '#d8ccb8';
      c.beginPath();
      c.roundRect(CHAIR.x * T - 6, CHAIR.y * T - 6, 12, 9, 3);
      c.fill();
      px(c, '#3a3d45', CHAIR.x * T - 6, CHAIR.y * T + 4, 12, 1);
    } else px(c, '#6b4a2f', CHAIR.x * T - 6, CHAIR.y * T - 2, 12, 6);
    return;
  }
  const frame = me.moving ? (Math.floor(me.walkClock / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
  px(c, 'rgba(0,0,0,0.18)', Math.round(me.x * T - 5), Math.round(me.y * T + 3), 10, 2);
  c.drawImage(getAvatarFrame(colors, me.facing, frame), Math.round(me.x * T - AVATAR_SIZE.w / 2), Math.round(me.y * T + 5 - AVATAR_SIZE.h));
}

// 客廳的電視：矮櫃（villa 白色烤漆、一般的是木頭）上一台黑框大電視，前面一條聲霸；
// 沒在放的時候螢幕是暗的、有一道反光和紅色待機燈；放 YouTube 時影片疊在螢幕上（看 reportTvScreen）
function drawTv(c: CanvasRenderingContext2D, lit: boolean): void {
  const x0 = Math.round(TV_STAND.x0 * T);
  const x1 = Math.round(TV_STAND.x1 * T);
  const y0 = Math.round(TV_STAND.y0 * T);
  const y1 = Math.round(TV_STAND.y1 * T);
  const w = x1 - x0;
  const [top, face, edge, knob] = VILLA ? ['#f7f4ee', '#e6e0d4', '#cfc6b6', '#c9a227'] : ['#b5835a', '#94633f', '#74492c', '#e8c27a'];
  px(c, 'rgba(0,0,0,0.2)', x0 + 2, y1 + 2, w, 3);
  // 腳
  px(c, VILLA ? '#b89a6e' : '#5a3a22', x0 + 3, y1, 2, 3);
  px(c, VILLA ? '#b89a6e' : '#5a3a22', x1 - 5, y1, 2, 3);
  // 頂面、正面（三格抽屜）
  px(c, top, x0, y0 - 2, w, 4);
  px(c, face, x0, y0 + 2, w, y1 - y0 - 2);
  px(c, edge, x0, y1 - 1, w, 1);
  for (let i = 1; i < 3; i += 1) px(c, edge, x0 + Math.round((w * i) / 3), y0 + 3, 1, y1 - y0 - 4);
  for (let i = 0; i < 3; i += 1) px(c, knob, x0 + Math.round((w * (i + 0.5)) / 3) - 2, y0 + 5, 4, 1);
  // 櫃子兩邊的擺飾：左邊一盆小植物、右邊一疊書
  px(c, '#d97a4a', x0 + 1, y0 - 6, 6, 4);
  px(c, '#4f9a4a', x0 + 1, y0 - 11, 3, 5);
  px(c, '#6fb85e', x0 + 4, y0 - 12, 3, 6);
  px(c, '#4a7fd0', x1 - 8, y0 - 4, 7, 2);
  px(c, '#e25a4a', x1 - 7, y0 - 6, 6, 2);
  px(c, '#f6c945', x1 - 8, y0 - 8, 7, 2);
  // 電視腳座＋聲霸
  const s = TV_SCREEN;
  const cx = s.x + s.w / 2;
  px(c, '#2a2d34', cx - 9, y0 - 3, 18, 2);
  px(c, '#2a2d34', cx - 2, s.y + s.h + 2, 4, y0 - 3 - (s.y + s.h + 2));
  px(c, '#1c1e24', cx - 15, y0, 30, 3);
  px(c, '#3a3d45', cx - 14, y0, 28, 1);
  // 黑框＋螢幕（暗的，一道斜斜的反光）
  px(c, '#101218', s.x - 2, s.y - 2, s.w + 4, s.h + 4);
  const g = c.createLinearGradient(s.x, s.y, s.x + s.w, s.y + s.h);
  g.addColorStop(0, '#2b3442');
  g.addColorStop(1, '#151a22');
  c.fillStyle = g;
  c.fillRect(s.x, s.y, s.w, s.h);
  c.fillStyle = 'rgba(255,255,255,0.07)';
  c.beginPath();
  c.moveTo(s.x + 8, s.y);
  c.lineTo(s.x + 26, s.y);
  c.lineTo(s.x + 10, s.y + s.h);
  c.lineTo(s.x, s.y + s.h);
  c.lineTo(s.x, s.y + 10);
  c.closePath();
  c.fill();
  px(c, lit ? '#ff5a5a' : '#c94444', s.x + s.w - 3, s.y + s.h + 1, 1, 1);
}

// 客廳的雙人沙發（背對畫面、面向電視）：先畫坐墊，坐著的人畫在坐墊上，椅背跟扶手擋住下半身
function drawSofa(c: CanvasRenderingContext2D, sitters: (AvatarColors | null)[]): void {
  const x0 = Math.round(SOFA.x0 * T);
  const x1 = Math.round(SOFA.x1 * T);
  const y0 = Math.round(SOFA.y0 * T);
  const y1 = Math.round(SOFA.y1 * T);
  const w = x1 - x0;
  const [main, shade, light] = VILLA ? ['#7d97ad', '#64798c', '#a3b9cb'] : ['#6f8f5e', '#58744a', '#8fae7c'];
  px(c, 'rgba(0,0,0,0.2)', x0 + 1, y1, w, 3);
  // 坐墊（從後面看，椅背上方露出來的那一塊）
  c.fillStyle = light;
  c.beginPath();
  c.roundRect(x0 + 4, y0 - 6, w - 8, 9, 3);
  c.fill();
  px(c, main, x0 + w / 2, y0 - 5, 1, 7);
  // 坐著的人（背對我們，只畫上半身）
  sitters.forEach((col, i) => {
    const spot = SOFA_SPOTS[i];
    if (!col || !spot) return;
    c.drawImage(getAvatarFrame(col, 'up', 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, Math.round(spot.x * T - AVATAR_SIZE.w / 2), Math.round(spot.y * T - 2 - SEATED_ROWS), AVATAR_SIZE.w, SEATED_ROWS);
  });
  // 椅背：朝我們的這一面，中間一道縫、上緣一條亮邊
  c.fillStyle = shade;
  c.beginPath();
  c.roundRect(x0, y0, w, y1 - y0 + 1, 3);
  c.fill();
  c.fillStyle = main;
  c.beginPath();
  c.roundRect(x0, y0, w, y1 - y0 - 2, 3);
  c.fill();
  px(c, light, x0 + 3, y0 + 1, w - 6, 1);
  px(c, shade, x0 + w / 2, y0 + 3, 1, y1 - y0 - 6);
  // 扶手
  for (const ax of [x0 - 2, x1 - 4]) {
    c.fillStyle = shade;
    c.beginPath();
    c.roundRect(ax, y0 - 7, 6, y1 - y0 + 8, 2);
    c.fill();
    px(c, light, ax + 1, y0 - 6, 4, 1);
  }
  // 腳
  px(c, '#4a3220', x0 + 1, y1, 2, 2);
  px(c, '#4a3220', x1 - 3, y1, 2, 2);
}

// 電視螢幕在視窗上的位置，給 YouTubeTv 把影片疊上去：整台在畫面裡才算看得到（不然桌機跳右下角小視窗、手機裁切）
function reportTvScreen(canvas: HTMLCanvasElement): void {
  const rect = canvas.getBoundingClientRect();
  const s = TV_SCREEN;
  const x = rect.left + view.ox + s.x * view.scale;
  const y = rect.top + view.oy + s.y * view.scale;
  const w = s.w * view.scale;
  const h = s.h * view.scale;
  // 全螢幕轉 90 度時影片疊不準、開著面板（衣櫃、好友…）會蓋住：交給角落的小視窗
  const onMap = !sceneRotated.value && !panel.value;
  const visible = onMap && x >= rect.left && y >= rect.top && x + w <= rect.right && y + h <= rect.bottom;
  Object.assign(tvScreen, { visible, onMap, loading: false, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h), clipL: rect.left, clipT: rect.top, clipR: rect.right, clipB: rect.bottom });
}

// 名牌不能超出畫面（手機很窄，靠邊的名牌會被切掉）：左右夾在畫面裡
let pillMaxX = Infinity;
function pill(c: CanvasRenderingContext2D, text: string, cx: number, bottom: number, color: string): void {
  c.font = '700 12px system-ui, -apple-system, "PingFang TC", sans-serif';
  const width = pillTextWidth(c, text) + 14;
  // 東西本身在畫面外：不畫它的名牌（夾進來會跟別的名牌疊在一起）；在畫面內但名牌太寬：往內推
  if (cx < 0 || cx > pillMaxX) return;
  cx = Math.min(Math.max(cx, width / 2 + 4), pillMaxX - width / 2 - 4);
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
  const scale = cssW >= 900 ? 3 : 2;
  pillMaxX = cssW;
  const follow = (size: number, world: number, at: number) => (world <= size ? (size - world) / 2 : Math.min(0, Math.max(size - world, size / 2 - at)));
  const ox = Math.round(follow(cssW, W * T * scale, me.x * T * scale) * dpr) / dpr;
  const oy = Math.round(follow(cssH, H * T * scale, me.y * T * scale) * dpr) / dpr;
  Object.assign(view, { scale, ox, oy });

  const phase = lightPhase();
  const lit = phase === 'night' || phase === 'dawn';
  const colors = lookColors(
    (lookDraft.value ?? prefs.value).hair,
    (lookDraft.value ?? prefs.value).shirt,
    lookDraft.value ?? prefs.value,
  );
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#6f984f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, ox * dpr, oy * dpr);
  if (scale * dpr !== groundRes) {
    groundRes = scale * dpr;
    ground = paintGround();
  }
  if (ground) drawLayer(ctx, ground, 0, 0, W * T, H * T);
  const c = ctx;
  // 布置中：可以擺的格子打淡淡的格線
  if (gardenDraft.value) {
    c.fillStyle = 'rgba(255,255,255,0.08)';
    for (let tx = GARDEN.x0; tx < GARDEN.x1; tx += 1) {
      for (let ty = GARDEN.y0; ty < GARDEN.y1; ty += 1) {
        if ((tx >= PATH.x0 && tx < PATH.x1) || underFountain(tx, ty)) continue;
        if ((tx + ty) % 2 === 0) c.fillRect(tx * T, ty * T, T, T);
      }
    }
  }
  // 去別人家：被子是屋主的顏色
  const ownerLook = props.visit?.profile.look;
  const ownerColors = ownerLook ? lookColors(ownerLook.hair, ownerLook.shirt, ownerLook) : null;
  drawFurniture(c, lit, ownerColors ?? colors, colors, seconds);
  const items: { y: number; draw: () => void }[] = [];
  for (const p of placements.value) {
    const item = GARDEN_ITEM_BY_ID[p.id];
    if (!item) continue;
    items.push({ y: p.y + item.h, draw: () => drawGardenItem(c, p.id, p.x, p.y, seconds, lit) });
  }
  if (VILLA) items.push({ y: MERMAID_FOUNTAIN.cy + MERMAID_FOUNTAIN.ry, draw: () => drawMermaidFountain(c, seconds, lit) });
  items.push({ y: TV_STAND.y1, draw: () => drawTv(c, lit) });
  const sofaSitters: (AvatarColors | null)[] = SOFA_SPOTS.map((_, i) => (onSofa.value === i ? colors : null));
  for (const r of shownRemotes) {
    const i = remoteOnSofa(r);
    if (i !== null && !sofaSitters[i]) sofaSitters[i] = remoteColors(r.remote);
  }
  items.push({ y: SOFA.y1, draw: () => drawSofa(c, sofaSitters) });
  items.push({ y: seated.value ? CHAIR.y : me.y + 0.35, draw: () => drawPerson(c, colors) });
  for (const r of shownRemotes) {
    if (((r.remote.lying || r.remote.bath) && VILLA) || remoteOnSofa(r) !== null) continue;
    const rc = remoteColors(r.remote);
    if (remoteAtDesk(r)) {
      items.push({
        y: CHAIR.y,
        draw: () => {
          c.drawImage(getAvatarFrame(rc, 'up', 'idle'), 0, 0, AVATAR_SIZE.w, SEATED_ROWS, Math.round(CHAIR.x * T - AVATAR_SIZE.w / 2), Math.round(CHAIR.y * T + 2 - SEATED_ROWS), AVATAR_SIZE.w, SEATED_ROWS);
        },
      });
      continue;
    }
    items.push({
      y: r.y + 0.35,
      draw: () => {
        const frame = r.remote.moving ? (Math.floor(seconds / 0.14) % 2 === 0 ? 'walkA' : 'walkB') : 'idle';
        px(c, 'rgba(0,0,0,0.18)', Math.round(r.x * T - 5), Math.round(r.y * T + 3), 10, 2);
        c.drawImage(getAvatarFrame(rc, r.remote.facing, frame), Math.round(r.x * T - AVATAR_SIZE.w / 2), Math.round(r.y * T + 5 - AVATAR_SIZE.h));
      },
    });
  }
  items.sort((a, b) => a.y - b.y).forEach((it) => it.draw());

  if (phase !== 'day') {
    c.save();
    c.globalCompositeOperation = 'multiply';
    c.fillStyle = phase === 'night' ? '#6f7aa8' : phase === 'dusk' ? '#f0c9a8' : '#c9c6e8';
    c.fillRect(0, 0, W * T, H * T);
    if (lit) {
      c.globalCompositeOperation = 'lighter';
      const glow = (x: number, y: number, r: number, color: string) => {
        const g = c.createRadialGradient(x, y, 0, x, y, r);
        g.addColorStop(0, color);
        g.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g;
        c.fillRect(x - r, y - r, r * 2, r * 2);
      };
      glow((DESK.x1 - 0.8) * T, DESK.y0 * T, 60, 'rgba(255, 210, 140, 0.4)');
      if (youtubeShowing.value) glow(TV_SCREEN.x + TV_SCREEN.w / 2, TV_SCREEN.y + TV_SCREEN.h / 2, 70, 'rgba(150, 190, 255, 0.3)');
      glow(10 * T, 6 * T, 120, 'rgba(255, 200, 120, 0.18)');
      for (const p of placements.value) if (p.id === 'lamp') glow(p.x * T + 8, p.y * T - 10, 44, 'rgba(255, 210, 140, 0.45)');
    }
    c.restore();
  }

  // 名牌（螢幕座標）
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const screen = (x: number, y: number) => ({ x: ox + x * T * scale, y: oy + y * T * scale });
  // 名牌放在家具下方（上方會被畫面頂端切掉）
  if (!props.visit) {
    const lw = screen((WARDROBE.x0 + WARDROBE.x1) / 2, WARDROBE.y1 + 1.4);
    pill(ctx, t.value.home.wardrobe, lw.x, lw.y, '#fbbf24');
    const ls = screen((SHELF.x0 + SHELF.x1) / 2, SHELF.y1 + 1.4);
    pill(ctx, t.value.home.bookshelf, ls.x, ls.y, '#60a5fa');
  }
  // 家裡其他人的名牌
  for (const r of shownRemotes) {
    const sofa = remoteOnSofa(r);
    const sofaSpot = sofa === null ? undefined : SOFA_SPOTS[sofa];
    const at = r.remote.bath && VILLA ? { x: (TUB.x0 + TUB.x1) / 2, y: TUB.y0 - 0.2 } : r.remote.lying && VILLA ? { x: BED.x0 + ((BED.x1 - BED.x0) * 3) / 4, y: BED.y0 - 0.1 } : remoteAtDesk(r) ? { x: CHAIR.x, y: CHAIR.y - 0.9 } : sofaSpot ? { x: sofaSpot.x, y: sofaSpot.y - 0.9 } : { x: r.x, y: r.y - 1.1 };
    const p = screen(at.x, at.y);
    pill(ctx, remoteLabel(r), p.x, p.y, '#2dd4bf');
  }
  if (!seated.value) {
    const ld = screen(CHAIR.x, CHAIR.y + 1.4);
    pill(ctx, cssW < 640 ? `🪑 ${t.value.home.desk}` : `🪑 ${t.value.home.deskHint}`, ld.x, ld.y, '#4ade80');
  }
  const lg = screen(GATE.x, GATE.y + 0.6);
  pill(ctx, t.value.home.gate, lg.x, lg.y, '#2dd4bf');
  // 暗著的電視螢幕中間掛牌子：點電視放 YouTube（正在放就收起來）
  if (!youtubeShowing.value) {
    const lt = screen((TV_SCREEN.x + TV_SCREEN.w / 2) / T, (TV_SCREEN.y + TV_SCREEN.h / 2) / T);
    pill(ctx, t.value.seatScene.youtubeTv, lt.x, lt.y + 10, '#f87171');
  }
  const mySofa = onSofa.value === null ? undefined : SOFA_SPOTS[onSofa.value];
  const mp = mySofa
    ? screen(mySofa.x, mySofa.y - 0.9)
    : bathing.value
    ? screen((TUB.x0 + TUB.x1) / 2, TUB.y0 - 0.2)
    : lying.value
    ? screen(BED.x0 + (BED.x1 - BED.x0) / 4 + 0.1, BED.y0 - 0.1)
    : seated.value
      ? screen(CHAIR.x, CHAIR.y - 0.9)
      : screen(me.x, me.y - 1.1);
  if (VILLA && !lying.value) {
    const lb = screen((BED.x0 + BED.x1) / 2, BED.y1 - 0.4);
    pill(ctx, `🛏️ ${t.value.home.bed}`, lb.x, lb.y, '#f472b6');
  }
  if (VILLA && !bathing.value) {
    const lt = screen((TUB.x0 + TUB.x1) / 2, TUB.y1 + 0.2);
    pill(ctx, `🛁 ${t.value.home.bath}`, lt.x, lt.y, '#38bdf8');
  }
  pill(ctx, t.value.common.meLabel, mp.x, mp.y, '#fbbf24');
  reportTvScreen(canvas);
}

let rafId = 0;
let last = 0;
function frame(time: number): void {
  rafId = requestAnimationFrame(frame);
  const seconds = time / 1000;
  const dt = last ? Math.min(0.05, seconds - last) : 0;
  last = seconds;
  updateWalk(dt);
  if (!props.visit) rememberScene('home', positionForShare(), seated.value || lying.value || bathing.value || onSofa.value !== null, seconds);
  shownRemotes = viewRemotes(props.remotePlayers, 'home', dt);
  const sofaSpot = onSofa.value === null ? undefined : SOFA_SPOTS[onSofa.value];
  syncPosition(
    sofaSpot
      ? { x: sofaSpot.x, y: sofaSpot.y, facing: 'up', moving: false, scene: 'home' }
      : bathing.value
      ? { x: TUB_SIDE.x, y: TUB_SIDE.y, facing: 'down', moving: false, pose: 'bath', scene: 'home' }
      : lying.value
      ? { x: BED_SIDE.x, y: BED_SIDE.y, facing: 'down', moving: false, lying: true, scene: 'home' }
      : seated.value
        ? { x: CHAIR.x, y: CHAIR.y, facing: 'up', moving: false, scene: 'home' }
        : { x: Math.round(me.x * 100) / 100, y: Math.round(me.y * 100) / 100, facing: me.facing, moving: me.moving, scene: 'home' },
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
  if (!containerRef.value?.contains(target)) {
    if (event.code !== 'Space' && !KEY_MAP[event.code]) return event.code === 'Enter';
    target.blur();
    containerRef.value?.focus({ preventScroll: true });
    return false;
  }
  return target.closest('button, a') !== null && ['Space', 'Enter'].includes(event.code);
}

// 靠近什麼就用什麼：書桌坐下、衣櫃換裝、書架設定
function interact(): void {
  if (seated.value || lying.value || bathing.value || onSofa.value !== null) {
    if (!props.disabled) standUp();
    return;
  }
  const near = (p: { x: number; y: number }, r = 1.6) => Math.hypot(me.x - p.x, me.y - p.y) < r;
  if (VILLA && inBathroom(me.x, me.y) && near(TUB_SIDE, 1.5)) bathe();
  else if (VILLA && near(BED_SIDE, 2.2)) lieDown();
  else if (near(CHAIR, 2.6)) sitAtDesk();
  else if (near(SOFA_FRONT, 1.3)) sitOnSofa();
  else if (!props.visit && near(WARDROBE_FRONT)) openWardrobe();
  else if (!props.visit && near(SHELF_FRONT)) panel.value = 'settings';
}

function onKeyDown(event: KeyboardEvent): void {
  if (panel.value || unsavedOpen.value || ignoreKey(event) || event.metaKey || event.ctrlKey || event.altKey) return;
  const dir = KEY_MAP[event.code];
  if (dir) {
    if (props.disabled) return;
    event.preventDefault();
    keys.add(dir);
    return;
  }
  if (event.code === 'KeyE' || event.code === 'Space') {
    event.preventDefault();
    interact();
  }
}

function onKeyUp(event: KeyboardEvent): void {
  const dir = KEY_MAP[event.code];
  if (dir) keys.delete(dir);
}

function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  const at = canvasRef.value ? localPoint(canvasRef.value, event.clientX, event.clientY) : null;
  if (!at || panel.value) return;
  const x = (at.x - view.ox) / view.scale / T;
  const y = (at.y - view.oy) / view.scale / T;
  if (gardenDraft.value && y >= GARDEN.y0 && y < GARDEN.y1) {
    editAt(x, y);
    return;
  }
  // 點電視：打開音樂設定的 YouTube 網址欄（專注中也可以）
  const s = TV_SCREEN;
  if (x * T > s.x - 2 && x * T < s.x + s.w + 2 && y * T > s.y - 2 && y * T < s.y + s.h + 4) {
    emit('open-tv');
    return;
  }
  if (props.disabled) return;
  if (inRect(x, y, SOFA, 0.3)) walkTo(SOFA_FRONT, sitOnSofa);
  else if (!props.visit && inRect(x, y, WARDROBE, 0.6)) walkTo(WARDROBE_FRONT, openWardrobe);
  else if (!props.visit && inRect(x, y, SHELF, 0.6)) walkTo(SHELF_FRONT, () => (panel.value = 'settings'));
  else if (inRect(x, y, DESK, 0.6) || Math.hypot(x - CHAIR.x, y - CHAIR.y) < 0.8) walkTo({ x: CHAIR.x, y: CHAIR.y + 0.9 }, sitAtDesk);
  else if (VILLA && inRect(x, y, BED, 0.3)) walkTo(BED_SIDE, lieDown);
  else if (VILLA && inRect(x, y, TUB, 0.3)) walkTo(TUB_SIDE, bathe);
  else if (!blocked(x, y)) walkTo({ x, y });
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
  if (props.disabled) return;
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
  // 第一次回家：送幾樣擺設（去別人家不動自己的資料）
  if (!props.visit && !prefs.value.homeVisited) {
    if (!prefs.value.garden.length) prefs.value.garden = STARTER_GARDEN.map((p) => ({ ...p }));
    prefs.value.homeVisited = true;
  }
  // villa 第一次：換成專屬花園（左邊一排櫻花、右邊一排玫瑰、沒有路燈），只套一次，之後她自己可以再改
  if (VILLA && !props.visit && !prefs.value.villaGarden) {
    prefs.value.garden = VILLA_GARDEN.map((p) => ({ ...p }));
    prefs.value.villaGarden = true;
  }
  // 重整前在家裡：站回原本的地方（坐著的話專注一開始會自己坐回書桌）
  const back = props.visit ? null : takeArrival('home');
  if (back && !blocked(back.x + 1, back.y)) {
    me.x = back.x + 1;
    me.y = back.y;
  }
  ctx = canvasRef.value?.getContext('2d') ?? null;
  isTouch.value = window.matchMedia('(pointer: coarse)').matches;
  ground = paintGround();
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', clearKeys);
  window.addEventListener('beforeunload', onBeforeUnload);
  containerRef.value?.focus({ preventScroll: true });
  rafId = requestAnimationFrame(frame);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  tvScreen.visible = false;
  tvScreen.onMap = false;
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', clearKeys);
  window.removeEventListener('beforeunload', onBeforeUnload);
});
</script>
