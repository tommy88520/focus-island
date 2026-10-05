<template>
  <div class="relative" :class="{ 'shake-error': isShake }">
    <div
      ref="containerRef"
      class="relative h-[52vh] min-h-[340px] w-full overflow-hidden rounded-2xl outline-none transition-opacity duration-500 focus-visible:ring-2 focus-visible:ring-amber-400/40 lg:h-[calc(100vh-330px)] lg:min-h-[460px]"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
      style="touch-action: pan-y"
      tabindex="0"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
      @blur="keys.clear()"
    >
      <canvas ref="canvasRef" class="block h-full w-full" />
    </div>

    <p class="mt-2 px-2 text-center text-[10px] font-bold tracking-wide text-slate-500 dark:!text-white/55">
      {{ isTouch ? t.seatScene.hintTouch : t.seatScene.hintDesktop }}
    </p>

    <div
      v-if="isLoading"
      class="pointer-events-none absolute inset-0 flex items-center justify-center px-4"
    >
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
import { nextTick, onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import * as THREE from 'three';
import type { Reader } from 'src/pages/index/composables/useLibrarySocket';
import type { Seat } from 'src/pages/index/components/SeatGrid.vue';
import { useLocale } from 'src/composables/useLocale';
import { createNavigation, type Navigation, type Point, type Rect } from 'src/pages/index/composables/seatNavigation';
import {
  BACK_Z,
  ROOM_HALF_WIDTH,
  STAIR_X,
  createLibraryLayout,
  type FurnitureItem,
  type LibraryLayout,
  type SeatKind,
  type SeatSlot,
} from 'src/pages/index/composables/libraryLayout';

const props = defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  isShake: boolean;
  isLoading: boolean;
  currentFloor: number;
  // 有哪些樓層可去，用來決定要不要畫上樓／下樓的樓梯
  floors: number[];
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
}>();

const emit = defineEmits<{
  select: [seatId: string];
  // 走進樓梯觸發區，要求父層切換到相鄰樓層
  'change-floor': [floor: number];
  // WebGL 不可用時通知父層退回 2D 座位格子
  'webgl-failed': [];
}>();

const { t } = useLocale();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isTouch = ref(false);

const COLOR_ME = 0xfbbf24;
const COLOR_MATE = 0x2dd4bf;
const WALK_SPEED = 2.6;
const PLAYER_RADIUS = 0.2;
const STAIR_TRIGGER = { z: -1.55, radius: 0.55 };
// 座位正後方多遠是「走過去坐下」的起點
const APPROACH_DISTANCE = 0.78;
// 各種座位的坐高、身體往後靠的角度、佔地（俯視半寬／半深）
const SEAT_SPECS: Record<SeatKind, { sitHeight: number; lean: number; half: number }> = {
  desk: { sitHeight: 0.42, lean: 0, half: 0.32 },
  counter: { sitHeight: 0.42, lean: 0, half: 0.32 },
  beanbag: { sitHeight: 0.26, lean: 0.5, half: 0.46 },
  armchair: { sitHeight: 0.46, lean: 0.22, half: 0.46 },
};
const BEANBAG_COLORS = [0xc9774f, 0x7f9a83, 0xd8b56a, 0x6f7f9e];
const ARMCHAIR_COLORS = [0x5b8a6c, 0xb0603f, 0xc49a45];
const SIT_TWEEN_SECONDS = 0.4;
const SIT_REACH = 1.3;
// 名牌與樓梯牌固定以螢幕像素為準，鏡頭拉遠或畫布變小時字也不會跟著縮
const LABEL_PX = 26;
const SIGN_PX = 34;

interface SeatNode {
  seatId: string;
  group: THREE.Group;
  hitMesh: THREE.Mesh;
  chairSeat: THREE.Mesh;
  person: THREE.Group;
  personMaterial: THREE.MeshStandardMaterial;
  head: THREE.Mesh;
  lampShade: THREE.Mesh;
  lampMaterial: THREE.MeshStandardMaterial;
  book: THREE.Mesh;
  label: THREE.Sprite | null;
  labelText: string;
  state: 'empty' | 'me' | 'mate' | 'taken';
  phase: number;
  kind: SeatKind;
  x: number;
  z: number;
  yaw: number;
  sitHeight: number;
}

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let ambient: THREE.HemisphereLight | null = null;
let sun: THREE.DirectionalLight | null = null;
let concretePlain: THREE.CanvasTexture | null = null;
let concreteHoles: THREE.CanvasTexture | null = null;
let oakTexture: THREE.CanvasTexture | null = null;
let shellGroup: THREE.Group | null = null;
let shellFrontZ = Number.NaN;
let layout: LibraryLayout = createLibraryLayout(0);
// 隨深淺色切換要調整的材質，由建立它的地方自己登記
let themeHooks: ((dark: boolean) => void)[] = [];
// 家具每次換樓層都重建，它的登記另外放，重建時整批換掉
let furnitureThemeHooks: ((dark: boolean) => void)[] = [];
let sceneRoot: THREE.Group | null = null;
let seatNodes: SeatNode[] = [];
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let themeObserver: MutationObserver | null = null;
let rafId = 0;
let isVisible = true;
let hoveredSeatId: string | null = null;
let nav: Navigation | null = null;
let stairs: StairInfo[] = [];
let stairGroup: THREE.Group | null = null;
let stairSigns: THREE.Sprite[] = [];
let stairLock = false;
let pendingSpawn: { point: Point; floor: number } | null = null;
let nearSeatId: string | null = null;
let lastFrameTime = 0;
const keys = new Set<string>();
// 鏡頭方位：橫的畫面從正前方看（0），直的畫面轉 90 度從窗邊看，讓房間的長邊對齊螢幕的長邊
let baseAzimuth = 0;
let azimuth = 0;
let azimuthTarget = 0;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const labelTextureCache = new Map<string, THREE.CanvasTexture>();
const staticDisposables: { dispose: () => void }[] = [];
const seatDisposables: { dispose: () => void }[] = [];
// 外殼（地板、書牆、落地窗）的深度跟桌子排數有關，排數變了才重建，所以也單獨記錄
const shellDisposables: { dispose: () => void }[] = [];
// 座位／桌子在切樓層時會重建，它們的資源要能單獨釋放，所以和靜態場景分開記錄
let trackTarget = staticDisposables;

function track<T extends { dispose: () => void }>(resource: T): T {
  trackTarget.push(resource);
  return resource;
}

function withSeatTracking(build: () => void): void {
  seatDisposables.forEach((resource) => resource.dispose());
  seatDisposables.length = 0;
  trackTarget = seatDisposables;
  try {
    build();
  } finally {
    trackTarget = staticDisposables;
  }
}

function isDark(): boolean {
  return document.body.classList.contains('body--dark');
}

function applyTheme(): void {
  if (!ambient || !sun) return;
  const dark = isDark();
  // 深色模式是「入夜後開著燈的圖書館」，不是關燈：整體亮度只略降，靠層板燈與檯燈帶出暖色
  ambient.intensity = dark ? 1.05 : 1.0;
  ambient.color.set(dark ? 0xcdd6f5 : 0xffffff);
  ambient.groundColor.set(dark ? 0x5a5048 : 0xb9b2a6);
  sun.intensity = dark ? 1.1 : 1.6;
  sun.color.set(dark ? 0xffe0b8 : 0xfff0d8);
  themeHooks.forEach((hook) => hook(dark));
  furnitureThemeHooks.forEach((hook) => hook(dark));
}

function makeMaterial(color: number, roughness = 0.8): THREE.MeshStandardMaterial {
  return track(new THREE.MeshStandardMaterial({ color, roughness, metalness: 0.05 }));
}

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number],
  castShadow = true,
): THREE.Mesh {
  track(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.castShadow = castShadow;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}

// 人形本身面向 -z；外層 group 轉 180 度讓它面向座位的 +z。lean 是往後靠的角度（懶骨頭、沙發）
function buildPerson(lean: number): { group: THREE.Group; material: THREE.MeshStandardMaterial; head: THREE.Mesh } {
  const group = new THREE.Group();
  const body = new THREE.Group();
  body.rotation.x = lean;
  group.rotation.y = Math.PI;
  group.add(body);
  const material = makeMaterial(COLOR_MATE, 0.7);
  const skin = makeMaterial(0xf1d3b3, 0.8);
  // 軀幹（坐姿，略向前傾）
  const torso = addMesh(body, new THREE.CapsuleGeometry(0.2, 0.34, 6, 12), material, [0, 0.58, 0]);
  torso.rotation.x = -0.22;
  // 頭（低頭看書）
  const head = addMesh(body, new THREE.SphereGeometry(0.17, 20, 16), skin, [0, 1.02, -0.1]);
  // 手臂往前伸
  for (const side of [-1, 1]) {
    const arm = addMesh(body, new THREE.CapsuleGeometry(0.055, 0.34, 4, 8), material, [side * 0.24, 0.62, -0.2]);
    arm.rotation.x = -1.25;
  }
  // 大腿
  for (const side of [-1, 1]) {
    const leg = addMesh(body, new THREE.CapsuleGeometry(0.075, 0.3, 4, 8), material, [side * 0.11, 0.3, -0.18]);
    leg.rotation.x = -Math.PI / 2;
  }
  return { group, material, head };
}

// 座位的本地座標：坐的位置在原點、面向 +z（桌子或咖啡桌在前方），椅背在 -z
function buildSeat(seatId: string, index: number, slot: SeatSlot): SeatNode {
  const spec = SEAT_SPECS[slot.kind];
  const group = new THREE.Group();
  group.position.set(slot.x, 0, slot.z);
  group.rotation.y = slot.yaw;

  const lampMaterial = track(
    new THREE.MeshStandardMaterial({ color: 0xffe4a8, emissive: 0xffc36b, emissiveIntensity: 0, roughness: 0.5 }),
  );
  lampMaterial.side = THREE.DoubleSide;
  const metal = makeMaterial(0x26282b, 0.5);
  let chairSeat: THREE.Mesh;
  let lampShade: THREE.Mesh;
  let book: THREE.Mesh;

  if (slot.kind === 'desk' || slot.kind === 'counter') {
    const wood = makeMaterial(0xb88d5c, 0.65);
    const fabric = makeMaterial(0x4c5564, 0.9);
    chairSeat = addMesh(group, new THREE.BoxGeometry(0.58, 0.08, 0.56), fabric, [0, 0.42, 0]);
    addMesh(group, new THREE.BoxGeometry(0.58, 0.46, 0.06), wood, [0, 0.82, -0.28]);
    for (const lx of [-0.24, 0.24]) {
      for (const lz of [-0.24, 0.24]) {
        addMesh(group, new THREE.CylinderGeometry(0.025, 0.025, 0.4, 6), metal, [lx, 0.2, lz], false);
      }
    }
    // 桌上：書 + 檯燈（桌面高 0.82，在座位前方）
    book = addMesh(group, new THREE.BoxGeometry(0.36, 0.05, 0.27), makeMaterial(0x8a3b3b, 0.8), [0, 0.845, 0.5]);
    book.rotation.y = (index % 5) * 0.15 - 0.3;
    addMesh(group, new THREE.CylinderGeometry(0.07, 0.08, 0.02, 12), metal, [0.34, 0.83, 0.62], false);
    addMesh(group, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), metal, [0.34, 0.98, 0.62], false);
    lampShade = addMesh(group, new THREE.ConeGeometry(0.12, 0.13, 14, 1, true), lampMaterial, [0.34, 1.16, 0.62], false);
  } else if (slot.kind === 'beanbag') {
    const fabric = makeMaterial(BEANBAG_COLORS[index % BEANBAG_COLORS.length] ?? 0xc9774f, 0.95);
    chairSeat = addMesh(group, new THREE.SphereGeometry(0.46, 22, 14), fabric, [0, 0.17, 0]);
    chairSeat.scale.set(1, 0.42, 1);
    const back = addMesh(group, new THREE.SphereGeometry(0.42, 22, 14), fabric, [0, 0.36, -0.26]);
    back.scale.set(1, 0.72, 0.55);
    // 地上的蘑菇燈 + 一本攤開的書
    book = addMesh(group, new THREE.BoxGeometry(0.34, 0.04, 0.25), makeMaterial(0x2f4a6b, 0.8), [0.05, 0.42, 0.22]);
    book.rotation.x = -0.5;
    addMesh(group, new THREE.CylinderGeometry(0.02, 0.05, 0.4, 8), metal, [0.62, 0.2, 0.12], false);
    lampShade = addMesh(group, new THREE.SphereGeometry(0.13, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), lampMaterial, [0.62, 0.4, 0.12], false);
  } else {
    const fabric = makeMaterial(ARMCHAIR_COLORS[index % ARMCHAIR_COLORS.length] ?? 0x3f5a4a, 0.9);
    const oak = track(new THREE.MeshStandardMaterial({ map: oakTexture, roughness: 0.55 }));
    addMesh(group, new THREE.BoxGeometry(0.86, 0.3, 0.8), fabric, [0, 0.23, 0]);
    chairSeat = addMesh(group, new THREE.BoxGeometry(0.66, 0.1, 0.66), fabric, [0, 0.43, 0.04]);
    addMesh(group, new THREE.BoxGeometry(0.86, 0.62, 0.16), fabric, [0, 0.62, -0.34]);
    for (const side of [-1, 1]) {
      addMesh(group, new THREE.BoxGeometry(0.12, 0.26, 0.8), fabric, [side * 0.37, 0.5, 0]);
    }
    for (const lx of [-0.36, 0.36]) {
      for (const lz of [-0.32, 0.32]) {
        addMesh(group, new THREE.CylinderGeometry(0.025, 0.02, 0.08, 6), oak, [lx, 0.04, lz], false);
      }
    }
    // 旁邊的小邊几 + 檯燈 + 耳機
    addMesh(group, new THREE.CylinderGeometry(0.17, 0.17, 0.04, 18), oak, [0.62, 0.5, 0], false);
    addMesh(group, new THREE.CylinderGeometry(0.02, 0.02, 0.5, 6), metal, [0.62, 0.25, 0], false);
    book = addMesh(group, new THREE.TorusGeometry(0.08, 0.018, 8, 16, Math.PI), metal, [0.6, 0.53, 0.08]);
    book.rotation.x = -Math.PI / 2;
    addMesh(group, new THREE.CylinderGeometry(0.01, 0.01, 0.22, 6), metal, [0.64, 0.63, -0.06], false);
    lampShade = addMesh(group, new THREE.CylinderGeometry(0.08, 0.11, 0.12, 14, 1, true), lampMaterial, [0.64, 0.78, -0.06], false);
  }

  // 人形
  const { group: person, material: personMaterial, head } = buildPerson(spec.lean);
  person.position.set(0, spec.sitHeight, 0);
  person.visible = false;
  group.add(person);

  // 點擊判定：座位本身再往前一點的隱形方塊
  const hitMaterial = track(new THREE.MeshBasicMaterial({ visible: false }));
  const hitMesh = addMesh(group, new THREE.BoxGeometry(1.0, 1.0, 1.1), hitMaterial, [0, 0.5, 0.12], false);
  hitMesh.userData.seatId = seatId;

  sceneRoot?.add(group);
  return {
    seatId,
    group,
    hitMesh,
    chairSeat,
    person,
    personMaterial,
    head,
    lampShade,
    lampMaterial,
    book,
    label: null,
    labelText: '',
    state: 'empty',
    phase: index * 0.9,
    kind: slot.kind,
    x: slot.x,
    z: slot.z,
    yaw: slot.yaw,
    sitHeight: spec.sitHeight,
  };
}

interface StairInfo {
  direction: 1 | -1;
  x: number;
}

type PlayerState = 'seated' | 'idle' | 'walking' | 'sitting';

const player = {
  state: 'idle' as PlayerState,
  x: 0,
  z: -1.4,
  facing: 0,
  seatId: null as string | null,
  path: [] as Point[],
  goalSeatId: null as string | null,
  sitFrom: { x: 0, z: 0 },
  sitTo: { x: 0, z: 0 },
  sitSeatId: '',
  sitElapsed: 0,
  sitYaw: 0,
  sitHeight: 0.42,
  moving: false,
};

let playerGroup: THREE.Group | null = null;
let playerLegs: THREE.Group[] = [];
let playerArms: THREE.Group[] = [];

function buildPlayer(): void {
  if (!scene) return;
  playerGroup = new THREE.Group();
  const shirt = makeMaterial(COLOR_ME, 0.7);
  const skin = makeMaterial(0xf1d3b3, 0.8);
  const pants = makeMaterial(0x334155, 0.85);

  addMesh(playerGroup, new THREE.CapsuleGeometry(0.2, 0.3, 6, 12), shirt, [0, 0.95, 0]);
  addMesh(playerGroup, new THREE.SphereGeometry(0.17, 20, 16), skin, [0, 1.46, 0]);
  // 鼻子：讓人看得出面向哪個方向
  addMesh(playerGroup, new THREE.SphereGeometry(0.035, 8, 8), makeMaterial(0xd9a98a, 0.8), [0, 1.44, 0.17], false);

  playerLegs = [];
  playerArms = [];
  for (const side of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(side * 0.1, 0.62, 0);
    addMesh(leg, new THREE.CapsuleGeometry(0.08, 0.36, 4, 8), pants, [0, -0.3, 0]);
    playerGroup.add(leg);
    playerLegs.push(leg);

    const arm = new THREE.Group();
    arm.position.set(side * 0.27, 1.2, 0);
    addMesh(arm, new THREE.CapsuleGeometry(0.055, 0.4, 4, 8), shirt, [0, -0.25, 0]);
    playerGroup.add(arm);
    playerArms.push(arm);
  }

  playerGroup.position.set(player.x, 0, player.z);
  scene.add(playerGroup);
}

function seatApproach(node: SeatNode): Point {
  return { x: node.x - Math.sin(node.yaw) * APPROACH_DISTANCE, z: node.z - Math.cos(node.yaw) * APPROACH_DISTANCE };
}

function buildStairs(): void {
  if (!sceneRoot) return;
  if (stairGroup) sceneRoot.remove(stairGroup);
  stairGroup = new THREE.Group();
  sceneRoot.add(stairGroup);
  stairs = [];
  stairSigns = [];
  const hasUp = props.floors.includes(props.currentFloor + 1);
  const hasDown = props.floors.includes(props.currentFloor - 1);
  if (hasDown) stairs.push({ direction: -1, x: -STAIR_X });
  if (hasUp) stairs.push({ direction: 1, x: STAIR_X });

  for (const stair of stairs) {
    const up = stair.direction === 1;
    // 清水模台階 + 橡木踏板，跟書牆同一套材質；踏板前緣的色條分辨上樓（琥珀）或下樓（青）
    const riserMaterial = makeMaterial(0xb9b5ad, 0.85);
    const treadMaterial = track(new THREE.MeshStandardMaterial({ map: oakTexture, roughness: 0.55, metalness: 0.03 }));
    const nosingMaterial = track(
      new THREE.MeshStandardMaterial({ color: up ? 0xfbbf24 : 0x2dd4bf, emissive: up ? 0xfbbf24 : 0x2dd4bf, emissiveIntensity: 0.6 }),
    );
    for (let i = 0; i < 3; i += 1) {
      const height = 0.14 * (3 - i);
      const z = -3.01 + 0.14 + i * 0.28;
      addMesh(stairGroup, new THREE.BoxGeometry(1.3, height - 0.03, 0.28), riserMaterial, [stair.x, (height - 0.03) / 2, z]);
      addMesh(stairGroup, new THREE.BoxGeometry(1.32, 0.03, 0.3), treadMaterial, [stair.x, height - 0.015, z]);
      addMesh(stairGroup, new THREE.BoxGeometry(1.32, 0.012, 0.025), nosingMaterial, [stair.x, height + 0.001, z + 0.14], false);
    }
    // 觸發區的地面標記
    const marker = new THREE.Mesh(
      track(new THREE.CircleGeometry(STAIR_TRIGGER.radius, 24)),
      track(new THREE.MeshBasicMaterial({ color: up ? 0xfbbf24 : 0x2dd4bf, transparent: true, opacity: 0.22 })),
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.set(stair.x, 0.012, STAIR_TRIGGER.z);
    stairGroup.add(marker);

    const targetFloor = props.currentFloor + stair.direction;
    const text = up ? t.value.seatScene.stairUp(targetFloor) : t.value.seatScene.stairDown(targetFloor);
    const sign = new THREE.Sprite(
      track(
        new THREE.SpriteMaterial({
          map: getLabelTexture(text, up ? '#fbbf24' : '#2dd4bf'),
          depthTest: false,
          transparent: true,
          sizeAttenuation: false,
        }),
      ),
    );
    applyScreenScale(sign, SIGN_PX);
    stairSigns.push(sign);
    sign.position.set(stair.x, 1.35, -2.5);
    sign.renderOrder = 10;
    stairGroup.add(sign);
  }
}

// 旋轉過的矩形取外接的軸對齊矩形（尋路只認軸對齊的障礙物）
function rotatedRect(x: number, z: number, yaw: number, halfW: number, halfD: number, offsetX = 0, offsetZ = 0): Rect {
  const cos = Math.cos(yaw);
  const sin = Math.sin(yaw);
  const cx = x + offsetX * cos + offsetZ * sin;
  const cz = z - offsetX * sin + offsetZ * cos;
  const ex = Math.abs(halfW * cos) + Math.abs(halfD * sin);
  const ez = Math.abs(halfW * sin) + Math.abs(halfD * cos);
  return { x0: cx - ex, x1: cx + ex, z0: cz - ez, z1: cz + ez };
}

function buildNavigation(): void {
  const obstacles: Rect[] = [];
  for (const item of layout.furniture) {
    if (!item.blocks) continue;
    obstacles.push({ x0: item.x - item.w / 2, x1: item.x + item.w / 2, z0: item.z - item.d / 2, z1: item.z + item.d / 2 });
  }
  for (const node of seatNodes) {
    const half = SEAT_SPECS[node.kind].half;
    obstacles.push(rotatedRect(node.x, node.z, node.yaw, half, half));
    // 懶骨頭旁的蘑菇燈、沙發旁的邊几
    if (node.kind === 'beanbag') obstacles.push(rotatedRect(node.x, node.z, node.yaw, 0.1, 0.1, 0.62, 0.12));
    if (node.kind === 'armchair') obstacles.push(rotatedRect(node.x, node.z, node.yaw, 0.18, 0.18, 0.62, 0));
  }
  for (const stair of stairs) {
    obstacles.push({ x0: stair.x - 0.7, x1: stair.x + 0.7, z0: -3.05, z1: -2.15 });
  }
  nav = createNavigation(
    { xMin: -ROOM_HALF_WIDTH, xMax: ROOM_HALF_WIDTH, zMin: -2.95, zMax: layout.frontZ - 0.45 },
    obstacles,
    PLAYER_RADIUS,
  );
}

function insideStairZone(x: number, z: number): boolean {
  return stairs.some((stair) => Math.hypot(x - stair.x, z - STAIR_TRIGGER.z) < STAIR_TRIGGER.radius);
}

function placePlayer(x: number, z: number): void {
  player.x = x;
  player.z = z;
  player.path = [];
  player.goalSeatId = null;
  player.moving = false;
}

function snapToSeat(node: SeatNode): void {
  placePlayer(node.x, node.z);
  player.state = 'seated';
  player.seatId = node.seatId;
}

// 站起來：座位在伺服器端仍保留，所以只是人離開椅子，站到椅子後方的走道
function standUp(): void {
  const node = seatNodes.find((n) => n.seatId === player.seatId);
  if (node) {
    const approach = seatApproach(node);
    placePlayer(approach.x, approach.z);
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
  const seat = props.seats.find((s) => s.id === node.seatId);
  if (!seat || !seat.available) return false;
  return !props.getMateAtSeat(node.seatId);
}

function walkToSeat(node: SeatNode): void {
  if (!nav || !sitCandidate(node)) return;
  if (player.state === 'sitting') return;
  if (player.state === 'seated') {
    if (player.seatId === node.seatId) return;
    standUp();
  }
  const path = nav.findPath({ x: player.x, z: player.z }, seatApproach(node));
  if (!path) return;
  player.path = path.slice(1);
  player.goalSeatId = node.seatId;
  player.state = 'walking';
}

function walkToPoint(target: Point): void {
  if (!nav || player.state === 'sitting') return;
  if (player.state === 'seated') standUp();
  const path = nav.findPath({ x: player.x, z: player.z }, target);
  if (!path) return;
  player.path = path.slice(1);
  player.goalSeatId = null;
  player.state = path.length > 1 ? 'walking' : 'idle';
}

function startSit(node: SeatNode): void {
  player.state = 'sitting';
  player.path = [];
  player.goalSeatId = null;
  player.sitFrom = { x: player.x, z: player.z };
  player.sitTo = { x: node.x, z: node.z };
  player.sitSeatId = node.seatId;
  player.sitYaw = node.yaw;
  player.sitHeight = node.sitHeight;
  player.sitElapsed = 0;
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
    if (props.selectedSeatId !== seatId && player.state === 'seated' && player.seatId === seatId) {
      standUp();
    }
  }
}

function nearestSittableSeat(): SeatNode | undefined {
  let best: SeatNode | undefined;
  let bestDist = SIT_REACH;
  for (const node of seatNodes) {
    if (!sitCandidate(node)) continue;
    const approach = seatApproach(node);
    const dist = Math.hypot(player.x - approach.x, player.z - approach.z);
    if (dist < bestDist) {
      bestDist = dist;
      best = node;
    }
  }
  return best;
}

function updatePlayer(dt: number): void {
  const active = canInteract();

  if (active && (player.state === 'idle' || player.state === 'walking' || player.state === 'seated')) {
    const dx = (keys.has('right') ? 1 : 0) - (keys.has('left') ? 1 : 0);
    const dz = (keys.has('down') ? 1 : 0) - (keys.has('up') ? 1 : 0);
    if (dx !== 0 || dz !== 0) {
      if (player.state === 'seated') standUp();
      player.path = [];
      player.goalSeatId = null;
      player.state = 'idle';
      // 方向鍵是「畫面上的方向」：鏡頭轉了 90 度時，換算回場景座標
      const cos = Math.cos(baseAzimuth);
      const sin = Math.sin(baseAzimuth);
      const worldX = dx * cos + dz * sin;
      const worldZ = -dx * sin + dz * cos;
      const length = Math.hypot(worldX, worldZ);
      const stepX = (worldX / length) * WALK_SPEED * dt;
      const stepZ = (worldZ / length) * WALK_SPEED * dt;
      // 分軸移動，貼著牆或桌子時可以順著滑過去
      if (nav && !nav.isBlocked(player.x + stepX, player.z)) player.x += stepX;
      if (nav && !nav.isBlocked(player.x, player.z + stepZ)) player.z += stepZ;
      player.facing = Math.atan2(worldX, worldZ);
      player.moving = true;
    } else if (player.state === 'walking') {
      const next = player.path[0];
      if (!next) {
        player.moving = false;
        const goal = seatNodes.find((n) => n.seatId === player.goalSeatId);
        player.state = 'idle';
        if (goal && sitCandidate(goal)) startSit(goal);
        player.goalSeatId = null;
      } else {
        const toX = next.x - player.x;
        const toZ = next.z - player.z;
        const dist = Math.hypot(toX, toZ);
        const step = WALK_SPEED * dt;
        if (dist <= step) {
          player.x = next.x;
          player.z = next.z;
          player.path.shift();
        } else {
          player.x += (toX / dist) * step;
          player.z += (toZ / dist) * step;
          player.facing = Math.atan2(toX, toZ);
        }
        player.moving = true;
      }
    } else {
      player.moving = false;
    }
  } else if (player.state === 'sitting') {
    player.sitElapsed += dt;
    const t01 = Math.min(1, player.sitElapsed / SIT_TWEEN_SECONDS);
    player.x = player.sitFrom.x + (player.sitTo.x - player.sitFrom.x) * t01;
    player.z = player.sitFrom.z + (player.sitTo.z - player.sitFrom.z) * t01;
    player.facing = player.sitYaw;
    player.moving = false;
    if (t01 >= 1) void finishSit();
  } else {
    player.moving = false;
    // 開始專注（disabled）時還站著：直接回到自己的座位
    if (props.disabled && player.state !== 'seated') {
      const mine = seatNodes.find((n) => n.seatId === props.selectedSeatId);
      if (mine) snapToSeat(mine);
      syncSeatStates();
    }
  }

  // 靠近哪個座位（鍵盤入座用）
  nearSeatId = active && (player.state === 'idle' || player.state === 'walking') ? (nearestSittableSeat()?.seatId ?? null) : null;

  // 走進樓梯觸發區 → 換樓層
  if (active && (player.state === 'idle' || player.state === 'walking')) {
    const inZone = insideStairZone(player.x, player.z);
    if (!inZone) {
      stairLock = false;
    } else if (!stairLock) {
      const stair = stairs.find((st) => Math.hypot(player.x - st.x, player.z - STAIR_TRIGGER.z) < STAIR_TRIGGER.radius);
      if (stair) {
        stairLock = true;
        player.path = [];
        player.state = 'idle';
        // 上樓會從新樓層的「下樓」樓梯出來，反之亦然
        const targetFloor = props.currentFloor + stair.direction;
        pendingSpawn = { point: { x: stair.direction === 1 ? -STAIR_X : STAIR_X, z: STAIR_TRIGGER.z }, floor: targetFloor };
        emit('change-floor', targetFloor);
      }
    }
  }
}

function renderPlayer(seconds: number): void {
  if (!playerGroup) return;
  playerGroup.visible = player.state !== 'seated';
  const sitProgress = player.state === 'sitting' ? Math.min(1, player.sitElapsed / SIT_TWEEN_SECONDS) : 0;
  playerGroup.position.set(player.x, player.sitHeight * sitProgress, player.z);

  let delta = player.facing - playerGroup.rotation.y;
  delta = Math.atan2(Math.sin(delta), Math.cos(delta));
  playerGroup.rotation.y += delta * 0.25;

  const swing = player.moving ? Math.sin(seconds * 10) * 0.7 : 0;
  playerLegs[0]?.rotation.set(swing, 0, 0);
  playerLegs[1]?.rotation.set(-swing, 0, 0);
  playerArms[0]?.rotation.set(-swing * 0.8, 0, 0);
  playerArms[1]?.rotation.set(swing * 0.8, 0, 0);
  playerGroup.position.y += player.moving ? Math.abs(Math.sin(seconds * 10)) * 0.025 : 0;
}

function getLabelTexture(text: string, color: string): THREE.CanvasTexture {
  const key = `${text}|${color}`;
  const cached = labelTextureCache.get(key);
  if (cached) return cached;

  const label = text.length > 8 ? `${text.slice(0, 8)}…` : text;
  const font = '800 36px system-ui, -apple-system, "PingFang TC", sans-serif';
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d');
  if (measure) measure.font = font;
  // 底板寬度跟著文字走，短名字不會頂著一條長長的空白膠囊
  const width = Math.min(256, Math.max(72, Math.ceil((measure?.measureText(label).width ?? 120) + 44)));
  // 畫兩倍解析度，高 DPI 螢幕上才不會糊
  canvas.width = width * 2;
  canvas.height = 72 * 2;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.scale(2, 2);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.beginPath();
    ctx.roundRect(3, 8, width - 6, 56, 28);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = font;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, width / 2, 37);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.userData.aspect = width / 72;
  labelTextureCache.set(key, texture);
  return texture;
}

// sizeAttenuation: false 的 sprite，scale 是以 NDC 高度計；換算成想要的像素高度
function applyScreenScale(sprite: THREE.Sprite, px: number): void {
  const height = containerRef.value?.clientHeight || 500;
  const focal = camera ? camera.projectionMatrix.elements[5] ?? 2.9 : 2.9;
  const scaleY = ((px / height) * 2) / focal;
  const aspect = (sprite.material.map?.userData.aspect as number | undefined) ?? 256 / 72;
  sprite.scale.set(scaleY * aspect, scaleY, 1);
}

function rescaleLabels(): void {
  for (const node of seatNodes) {
    if (node.label) applyScreenScale(node.label, LABEL_PX);
  }
  for (const sign of stairSigns) applyScreenScale(sign, SIGN_PX);
}

function setLabel(node: SeatNode, text: string, color: string): void {
  if (node.labelText === text && node.label) return;
  if (node.label) {
    node.group.remove(node.label);
    (node.label.material).dispose();
    node.label = null;
  }
  node.labelText = text;
  if (!text) return;
  const material = new THREE.SpriteMaterial({ map: getLabelTexture(text, color), depthTest: false, transparent: true, sizeAttenuation: false });
  const sprite = new THREE.Sprite(material);
  applyScreenScale(sprite, LABEL_PX);
  sprite.position.set(0, node.sitHeight + 1.35, 0);
  sprite.renderOrder = 10;
  node.group.add(sprite);
  node.label = sprite;
}

function clearSeatNodes(): void {
  for (const node of seatNodes) {
    if (node.label) (node.label.material).dispose();
    sceneRoot?.remove(node.group);
  }
  seatNodes = [];
}

function rebuildSeats(): void {
  if (!sceneRoot) return;
  clearSeatNodes();
  layout = createLibraryLayout(props.seats.length);
  withSeatTracking(() => {
    props.seats.forEach((seat, index) => {
      const slot = layout.slots[index];
      if (slot) seatNodes.push(buildSeat(seat.id, index, slot));
    });
    rebuildFurniture();
    buildStairs();
  });
  buildNavigation();
  spawnPlayer();
  fitCamera();
}

// 重建座位後決定玩家在哪：有座位就坐回去，走樓梯過來就出現在樓梯口，否則站在後方走道
function spawnPlayer(): void {
  const mine = seatNodes.find((n) => n.seatId === props.selectedSeatId);
  if (mine) {
    snapToSeat(mine);
  } else if (pendingSpawn && pendingSpawn.floor === props.currentFloor) {
    // 換樓層後座位資料會陸續到齊、場景會重建不只一次，所以這裡不清掉，等載入完成才清
    placePlayer(pendingSpawn.point.x, pendingSpawn.point.z);
    player.state = 'idle';
    player.seatId = null;
  } else {
    placePlayer(0, -1.0);
    player.state = 'idle';
    player.seatId = null;
  }
  stairLock = insideStairZone(player.x, player.z);
}

let furnitureGroup: THREE.Group | null = null;
function rebuildFurniture(): void {
  if (!sceneRoot) return;
  if (furnitureGroup) sceneRoot.remove(furnitureGroup);
  furnitureGroup = new THREE.Group();
  rebuildShell();
  furnitureThemeHooks = [];
  const oak = track(new THREE.MeshStandardMaterial({ map: oakTexture, roughness: 0.55, metalness: 0.03 }));
  const metal = makeMaterial(0x26282b, 0.5);
  const leaves = [0x4f7a4a, 0x3d6b45, 0x6a9160].map((color) => {
    const material = makeMaterial(color, 0.9);
    material.flatShading = true;
    return material;
  });
  const rand = seededRandom(509);
  for (const item of layout.furniture) buildFurniture(furnitureGroup, item, { oak, metal, leaves, rand });
  sceneRoot.add(furnitureGroup);
  applyTheme();
}

function buildFurniture(
  parent: THREE.Group,
  item: FurnitureItem,
  shared: { oak: THREE.Material; metal: THREE.Material; leaves: THREE.Material[]; rand: () => number },
): void {
  const { oak, metal, leaves, rand } = shared;
  const { x, z, w, d } = item;
  if (item.kind === 'table') {
    addMesh(parent, new THREE.BoxGeometry(w, 0.06, d), oak, [x, 0.79, z]);
    for (const sx of [-1, 1]) {
      // 板腳式桌腳：兩片黑鐵 + 一根橫桿
      addMesh(parent, new THREE.BoxGeometry(0.05, 0.76, d - 0.2), metal, [x + sx * (w / 2 - 0.15), 0.38, z]);
    }
    addMesh(parent, new THREE.BoxGeometry(w - 0.3, 0.04, 0.04), metal, [x, 0.2, z], false);
  } else if (item.kind === 'counter') {
    addMesh(parent, new THREE.BoxGeometry(w, 0.05, d), oak, [x, 0.8, z]);
    const base = makeMaterial(0xb9b5ad, 0.85);
    addMesh(parent, new THREE.BoxGeometry(w - 0.12, 0.77, d - 0.1), base, [x - 0.04, 0.385, z]);
  } else if (item.kind === 'coffeeTable') {
    addMesh(parent, new THREE.CylinderGeometry(w / 2, w / 2, 0.05, 28), oak, [x, 0.36, z]);
    addMesh(parent, new THREE.CylinderGeometry(0.06, 0.12, 0.34, 12), metal, [x, 0.17, z]);
    // 桌上的杯子跟書
    addMesh(parent, new THREE.CylinderGeometry(0.045, 0.04, 0.09, 12), makeMaterial(0xf2efe8, 0.4), [x + 0.14, 0.43, z - 0.08], false);
    addMesh(parent, new THREE.BoxGeometry(0.26, 0.04, 0.19), makeMaterial(0x35604f, 0.8), [x - 0.1, 0.405, z + 0.08], false);
  } else if (item.kind === 'roundRug' || item.kind === 'rug') {
    const material = makeMaterial(item.color ?? 0xd9cfbd, 1);
    furnitureThemeHooks.push((dark) => material.color.set(item.color ?? 0xd9cfbd).multiplyScalar(dark ? 0.82 : 1));
    const geometry =
      item.kind === 'roundRug' ? new THREE.CircleGeometry(w / 2, 48) : new THREE.PlaneGeometry(w, d);
    const rug = addMesh(parent, geometry, material, [x, 0.008, z], false);
    rug.rotation.x = -Math.PI / 2;
  } else if (item.kind === 'avWall') {
    // 影音牆：木格柵吸音板 + 大螢幕 + 低櫃
    const slat = makeMaterial(0x5a3d26, 0.8);
    for (let i = 0; i < 14; i += 1) {
      addMesh(parent, new THREE.BoxGeometry(0.04, 2.3, 0.07), slat, [x + 0.16, 1.15, z - d / 2 + 0.11 + i * ((d - 0.2) / 13)], false);
    }
    addMesh(parent, new THREE.BoxGeometry(0.06, 1.0, 1.75), metal, [x + 0.08, 1.45, z]);
    const screenMaterial = track(new THREE.MeshStandardMaterial({ color: 0x0b1220, emissive: 0x3b6ea8, emissiveIntensity: 0.35, roughness: 0.2 }));
    furnitureThemeHooks.push((dark) => {
      screenMaterial.emissiveIntensity = dark ? 0.9 : 0.35;
    });
    const screen = addMesh(parent, new THREE.PlaneGeometry(1.65, 0.9), screenMaterial, [x + 0.045, 1.45, z], false);
    screen.rotation.y = -Math.PI / 2;
    addMesh(parent, new THREE.BoxGeometry(0.38, 0.4, d - 0.6), oak, [x, 0.2, z]);
  } else if (item.kind === 'plant') {
    const pot = makeMaterial(0xa9a59c, 0.9);
    addMesh(parent, new THREE.CylinderGeometry(0.22, 0.17, 0.42, 16), pot, [x, 0.21, z]);
    for (let leaf = 0; leaf < 7; leaf += 1) {
      const material = leaves[leaf % leaves.length];
      if (!material) continue;
      addMesh(
        parent,
        new THREE.IcosahedronGeometry(0.18 + rand() * 0.12, 0),
        material,
        [x + (rand() - 0.5) * 0.36, 0.6 + rand() * 0.75, z + (rand() - 0.5) * 0.36],
      );
    }
  } else if (item.kind === 'floorLamp') {
    // 弧形落地燈：燈罩伸向旁邊的座位區
    addMesh(parent, new THREE.CylinderGeometry(0.16, 0.18, 0.04, 18), metal, [x, 0.02, z]);
    addMesh(parent, new THREE.CylinderGeometry(0.018, 0.018, 1.7, 8), metal, [x, 0.85, z], false);
    const shadeMaterial = track(new THREE.MeshStandardMaterial({ color: 0xffe4a8, emissive: 0xffc36b, emissiveIntensity: 0.4, side: THREE.DoubleSide }));
    furnitureThemeHooks.push((dark) => {
      shadeMaterial.emissiveIntensity = dark ? 1.6 : 0.4;
    });
    addMesh(parent, new THREE.SphereGeometry(0.2, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2), shadeMaterial, [x, 1.72, z], false);
  }
}

// ── 場景外殼：參考政大達賢圖書館──清水模、層退的木書牆、整面落地窗 ──
const SHELL_HALF_WIDTH = ROOM_HALF_WIDTH + 0.45;
const TIER_DEPTH = 0.5;
const TIER_HEIGHT = 0.8;
const BAY_LENGTH = 1.5;
const BOOK_COLORS = [0x7d2e2e, 0x2f4a6b, 0x35604f, 0xa88442, 0x4b3a63, 0xd9d0bd, 0x8a5a3b, 0x2e3033, 0xe8e2d2, 0x9a4a32];

function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 16807) % 2147483647;
    return state / 2147483647;
  };
}

function makeCanvasTexture(size: number, paint: (ctx: CanvasRenderingContext2D, size: number) => void): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) paint(ctx, size);
  const texture = track(new THREE.CanvasTexture(canvas));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  return texture;
}

// 清水模：一張貼圖是一塊模板，邊緣是模板接縫，tieHoles 是固定模板留下的螺栓孔
function makeConcreteTexture(tieHoles: boolean): THREE.CanvasTexture {
  return makeCanvasTexture(512, (ctx, size) => {
    const rand = seededRandom(tieHoles ? 7 : 11);
    ctx.fillStyle = '#c9c6bf';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 26; i += 1) {
      const x = rand() * size;
      const y = rand() * size;
      const r = 40 + rand() * 120;
      const tone = rand() > 0.5 ? '255,255,255' : '60,58,54';
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, r);
      gradient.addColorStop(0, `rgba(${tone},0.07)`);
      gradient.addColorStop(1, `rgba(${tone},0)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    for (let i = 0; i < 9000; i += 1) {
      ctx.fillStyle = rand() > 0.5 ? 'rgba(255,255,255,0.05)' : 'rgba(40,38,36,0.06)';
      ctx.fillRect(rand() * size, rand() * size, 1.5, 1.5);
    }
    ctx.strokeStyle = 'rgba(60,58,54,0.3)';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, 0, size, size);
    if (tieHoles) {
      ctx.fillStyle = 'rgba(50,48,45,0.42)';
      for (const u of [1 / 6, 1 / 2, 5 / 6]) {
        for (const v of [1 / 4, 3 / 4]) {
          ctx.beginPath();
          ctx.arc(u * size, v * size, 7, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  });
}

function makeOakTexture(): THREE.CanvasTexture {
  return makeCanvasTexture(256, (ctx, size) => {
    const rand = seededRandom(23);
    ctx.fillStyle = '#d2ab78';
    ctx.fillRect(0, 0, size, size);
    for (let i = 0; i < 150; i += 1) {
      ctx.fillStyle = rand() > 0.35 ? `rgba(110,70,32,${0.03 + rand() * 0.09})` : `rgba(255,236,200,${0.04 + rand() * 0.08})`;
      ctx.fillRect(0, rand() * size, size, 1 + rand() * 2.5);
    }
  });
}

function buildStaticScene(): void {
  if (!scene) return;
  sceneRoot = new THREE.Group();
  scene.add(sceneRoot);
  concretePlain = makeConcreteTexture(false);
  concreteHoles = makeConcreteTexture(true);
  oakTexture = makeOakTexture();
}

function rebuildShell(): void {
  if (!scene) return;
  if (layout.frontZ === shellFrontZ) return;
  shellFrontZ = layout.frontZ;
  if (shellGroup) scene.remove(shellGroup);
  shellDisposables.forEach((resource) => resource.dispose());
  shellDisposables.length = 0;
  themeHooks = [];
  const previous = trackTarget;
  trackTarget = shellDisposables;
  try {
    shellGroup = buildShell(layout.frontZ);
    scene.add(shellGroup);
  } finally {
    trackTarget = previous;
  }
  applyTheme();
}

function buildShell(frontZ: number): THREE.Group {
  const group = new THREE.Group();
  const backTiers = 3;
  const backWallZ = BACK_Z - backTiers * TIER_DEPTH;
  const sideLength = frontZ - BACK_Z - 0.2;
  const sideCenterZ = BACK_Z + sideLength / 2;
  const leftX = -SHELL_HALF_WIDTH;
  const rightX = SHELL_HALF_WIDTH;

  const concrete = (repeatX: number, repeatY: number, tieHoles: boolean, roughness = 0.85): THREE.MeshStandardMaterial => {
    const source = tieHoles ? concreteHoles : concretePlain;
    const material = track(new THREE.MeshStandardMaterial({ roughness, metalness: 0.02 }));
    if (source) {
      const map = track(source.clone());
      map.repeat.set(repeatX, repeatY);
      map.needsUpdate = true;
      material.map = map;
    }
    themeHooks.push((dark) => material.color.set(dark ? 0xdfe2ec : 0xffffff));
    return material;
  };

  // 地板：清水模樓板，做成有厚度的一塊，邊緣才不會像紙片
  const floorWidth = SHELL_HALF_WIDTH * 2 + 0.5;
  const floorDepth = frontZ - backWallZ + 0.2;
  addMesh(
    group,
    new THREE.BoxGeometry(floorWidth, 0.3, floorDepth),
    concrete(floorWidth / 1.8, floorDepth / 1.8, false, 0.5),
    [0, -0.15, backWallZ - 0.2 + floorDepth / 2],
    false,
  );

  const carcass = makeMaterial(0x6f4e33, 0.75);
  const board = track(new THREE.MeshStandardMaterial({ map: oakTexture, roughness: 0.6, metalness: 0.03 }));
  const ledMaterial = track(new THREE.MeshStandardMaterial({ color: 0xffe2b0, emissive: 0xffc878, emissiveIntensity: 1 }));
  themeHooks.push((dark) => {
    ledMaterial.emissiveIntensity = dark ? 2.4 : 0.9;
  });
  const portalMaterial = makeMaterial(0x2a2c30, 0.9);
  const bookGeometry = track(new THREE.BoxGeometry(0.11, 0.5, 0.26));
  const bookMaterial = track(new THREE.MeshStandardMaterial({ roughness: 0.85 }));

  // 層退書牆：每往上一層就往後退一階，像梯田。沿本地 x 軸延伸、正面朝 +z；gaps 是最下層留給樓梯口的缺口
  const buildShelfRun = (length: number, tiers: number, gaps: [number, number][], seed: number): THREE.Group => {
    const run = new THREE.Group();
    const rand = seededRandom(seed);
    const books: { matrix: THREE.Matrix4; color: THREE.Color }[] = [];
    const bodyHeight = TIER_HEIGHT - 0.1;

    for (let k = 0; k < tiers; k += 1) {
      const baseY = k * TIER_HEIGHT;
      const faceZ = -k * TIER_DEPTH;
      const centerZ = faceZ - TIER_DEPTH / 2;
      if (k > 0) {
        addMesh(run, new THREE.BoxGeometry(length, baseY, TIER_DEPTH), concrete(length / 1.8, baseY / 0.9, true), [0, baseY / 2, centerZ]);
      }

      const segments: [number, number][] = [];
      let cursor = -length / 2;
      for (const [g0, g1] of k === 0 ? gaps : []) {
        segments.push([cursor, g0]);
        cursor = g1;
        addMesh(run, new THREE.BoxGeometry(g1 - g0 - 0.1, TIER_HEIGHT - 0.06, 0.02), portalMaterial, [(g0 + g1) / 2, (TIER_HEIGHT - 0.06) / 2, -TIER_DEPTH + 0.011], false);
      }
      segments.push([cursor, length / 2]);

      for (const [x0, x1] of segments) {
        const width = x1 - x0;
        const cx = (x0 + x1) / 2;
        addMesh(run, new THREE.BoxGeometry(width, bodyHeight, TIER_DEPTH - 0.2), carcass, [cx, baseY + bodyHeight / 2, centerZ - 0.1]);
        addMesh(run, new THREE.BoxGeometry(width, 0.06, TIER_DEPTH), board, [cx, baseY + 0.03, centerZ]);
        addMesh(run, new THREE.BoxGeometry(width + 0.04, 0.05, TIER_DEPTH + 0.04), board, [cx, baseY + TIER_HEIGHT - 0.025, centerZ]);
        addMesh(run, new THREE.BoxGeometry(Math.max(0.05, width - 0.1), 0.015, 0.02), ledMaterial, [cx, baseY + TIER_HEIGHT - 0.06, faceZ - 0.03], false);

        const bays = Math.max(1, Math.round(width / 1.1));
        const bayWidth = width / bays;
        for (let b = 0; b <= bays; b += 1) {
          addMesh(run, new THREE.BoxGeometry(0.04, bodyHeight, TIER_DEPTH), board, [x0 + b * bayWidth, baseY + bodyHeight / 2, centerZ], false);
        }
        for (let b = 0; b < bays; b += 1) {
          let x = x0 + b * bayWidth + 0.06;
          const end = x0 + (b + 1) * bayWidth - 0.06;
          while (x < end - 0.14) {
            // 偶爾留一段空位，書架才不會像一整片色塊
            if (rand() < 0.07) {
              x += 0.16 + rand() * 0.2;
              continue;
            }
            const thickness = 0.07 + rand() * 0.07;
            const height = 0.36 + rand() * 0.2;
            const lean = rand() < 0.06 ? (rand() - 0.5) * 0.3 : 0;
            books.push({
              matrix: new THREE.Matrix4().compose(
                new THREE.Vector3(x + thickness / 2, baseY + 0.06 + height / 2, faceZ - 0.16),
                new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, lean)),
                new THREE.Vector3(thickness / 0.11, height / 0.5, 1),
              ),
              color: new THREE.Color(BOOK_COLORS[Math.floor(rand() * BOOK_COLORS.length)] ?? 0xd9d0bd),
            });
            x += thickness + 0.008;
          }
        }
      }
    }

    const mesh = track(new THREE.InstancedMesh(bookGeometry, bookMaterial, books.length));
    books.forEach((book, i) => {
      mesh.setMatrixAt(i, book.matrix);
      mesh.setColorAt(i, book.color);
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.receiveShadow = true;
    run.add(mesh);
    return run;
  };

  // 後方：三層層退書牆橫跨整面牆，中間是上下樓的樓梯口
  const backRun = buildShelfRun(SHELL_HALF_WIDTH * 2, backTiers, [[-STAIR_X - 0.7, -STAIR_X + 0.7], [STAIR_X - 0.7, STAIR_X + 0.7]], 101);
  backRun.position.set(0, 0, BACK_Z);
  group.add(backRun);
  addMesh(group, new THREE.BoxGeometry(SHELL_HALF_WIDTH * 2 + 0.4, 3.2, 0.2), concrete((SHELL_HALF_WIDTH * 2) / 1.8, 3.2 / 0.9, true), [0, 1.6, backWallZ - 0.1]);

  // 右邊：清水模矮牆（影音區的格柵板與螢幕由家具負責）
  addMesh(group, new THREE.BoxGeometry(0.2, 2.4, sideLength), concrete(sideLength / 1.8, 2.4 / 0.9, true), [rightX + 0.1, 1.2, sideCenterZ]);

  // 左邊：整面落地窗
  const frameMaterial = makeMaterial(0x2e3238, 0.45);
  const windowX = leftX - 0.05;
  const windowHeight = 3;
  const bayCount = Math.max(1, Math.round(sideLength / BAY_LENGTH));
  const bayLength = sideLength / bayCount;
  for (let i = 0; i <= bayCount; i += 1) {
    addMesh(group, new THREE.BoxGeometry(0.07, windowHeight, 0.07), frameMaterial, [windowX, windowHeight / 2, BACK_Z + i * bayLength]);
  }
  for (const y of [0.05, 2.1, windowHeight - 0.04]) {
    addMesh(group, new THREE.BoxGeometry(0.07, 0.07, sideLength), frameMaterial, [windowX, y, sideCenterZ]);
  }
  const glassMaterial = track(
    new THREE.MeshStandardMaterial({ color: 0xcfe9f7, transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.1, depthWrite: false }),
  );
  themeHooks.push((dark) => {
    glassMaterial.color.set(dark ? 0x1d2742 : 0xcfe9f7);
    glassMaterial.opacity = dark ? 0.34 : 0.2;
  });
  addMesh(group, new THREE.BoxGeometry(0.02, windowHeight, sideLength), glassMaterial, [windowX, windowHeight / 2, sideCenterZ], false);

  // 從落地窗斜射進來的日光，純視覺的地面色塊；方向跟 sun 的陰影一致
  const sunPatchMaterial = track(
    new THREE.MeshBasicMaterial({ color: 0xfff3cf, transparent: true, opacity: 0.14, depthWrite: false, side: THREE.DoubleSide }),
  );
  themeHooks.push((dark) => {
    sunPatchMaterial.visible = !dark;
  });
  const patchNearX = leftX + 0.55;
  const patchFarX = patchNearX + 2.6;
  const patchShift = -2.6 * 1.2;
  for (let i = 0; i < bayCount; i += 1) {
    const z0 = BACK_Z + i * bayLength + 0.12;
    const z1 = BACK_Z + (i + 1) * bayLength - 0.12;
    if (z0 + patchShift < BACK_Z + 0.15) continue;
    const geometry = track(new THREE.BufferGeometry());
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(
        [patchNearX, 0.014, z0, patchNearX, 0.014, z1, patchFarX, 0.014, z1 + patchShift, patchFarX, 0.014, z0 + patchShift],
        3,
      ),
    );
    geometry.setIndex([0, 1, 2, 0, 2, 3]);
    group.add(new THREE.Mesh(geometry, sunPatchMaterial));
  }

  return group;
}

function fitCamera(): void {
  const container = containerRef.value;
  if (!camera || !container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (!width || !height) return;

  camera.aspect = width / height;
  // 直的畫面（手機）把鏡頭轉到窗邊，房間的長邊才會對齊螢幕的長邊
  const portrait = camera.aspect < 1;
  baseAzimuth = portrait ? -Math.PI / 2 : 0;
  azimuth = baseAzimuth + azimuthTarget;
  const roomWidth = SHELL_HALF_WIDTH * 2 + 0.4;
  const roomDepth = layout.frontZ - (BACK_Z - 1.5);
  const screenWidth = portrait ? roomDepth : roomWidth;
  const screenDepth = portrait ? roomWidth : roomDepth;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const distForWidth = screenWidth / 2 / Math.tan(hFov / 2);
  const distForDepth = screenDepth / 2 / Math.tan(vFov / 2);
  const distance = Math.max(distForWidth * 1.14, distForDepth * 0.92, 8);
  const target = new THREE.Vector3(0, 0.4, (BACK_Z - 0.9 + layout.frontZ) / 2);
  const elevation = THREE.MathUtils.degToRad(52);
  const horizontal = Math.cos(elevation) * distance;
  camera.position.set(
    target.x + Math.sin(azimuth) * horizontal,
    Math.sin(elevation) * distance + 0.4,
    target.z + Math.cos(azimuth) * horizontal,
  );
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  // 保存供旋轉時使用
  camera.userData = { target, distance, elevation };
}

function updateCameraAzimuth(): void {
  if (!camera) return;
  const data = camera.userData as { target?: THREE.Vector3; distance?: number; elevation?: number };
  if (!data.target || !data.distance || data.elevation === undefined) return;
  azimuth += (baseAzimuth + azimuthTarget - azimuth) * 0.08;
  const horizontal = Math.cos(data.elevation) * data.distance;
  camera.position.set(
    data.target.x + Math.sin(azimuth) * horizontal,
    Math.sin(data.elevation) * data.distance + 0.4,
    data.target.z + Math.cos(azimuth) * horizontal,
  );
  camera.lookAt(data.target);
}

function syncSeatStates(): void {
  for (let i = 0; i < seatNodes.length; i += 1) {
    const node = seatNodes[i];
    const seat = props.seats[i];
    if (!node || !seat) continue;
    node.seatId = seat.id;
    node.hitMesh.userData.seatId = seat.id;

    const mate = props.getMateAtSeat(seat.id);
    let state: SeatNode['state'] = 'empty';
    if (props.selectedSeatId === seat.id) state = 'me';
    else if (mate) state = 'mate';
    else if (!seat.available) state = 'taken';
    node.state = state;

    // 自己的座位：人坐著才顯示人形；站起來走動時座位仍保留，只亮椅子
    const meSeated = state === 'me' && player.state === 'seated' && player.seatId === seat.id;
    const occupied = state === 'mate' || state === 'taken' || meSeated;
    node.person.visible = occupied;
    node.lampMaterial.emissiveIntensity = occupied ? 1.2 : state === 'me' ? 0.45 : 0;

    if (state === 'me') {
      node.personMaterial.color.set(COLOR_ME);
      setLabel(node, t.value.common.meLabel, '#fbbf24');
    } else if (state === 'mate' && mate) {
      node.personMaterial.color.set(COLOR_MATE);
      setLabel(node, mate.displayName, '#2dd4bf');
    } else if (state === 'taken') {
      node.personMaterial.color.set(0x64748b);
      setLabel(node, '', '');
    } else {
      setLabel(node, '', '');
    }
  }
}

function animate(time: number): void {
  rafId = requestAnimationFrame(animate);
  if (!renderer || !scene || !camera || !isVisible || document.hidden) return;

  const seconds = time / 1000;
  const dt = lastFrameTime ? Math.min(0.05, seconds - lastFrameTime) : 0;
  lastFrameTime = seconds;
  updateCameraAzimuth();
  updatePlayer(dt);
  renderPlayer(seconds);

  for (const node of seatNodes) {
    const isHovered = (hoveredSeatId === node.seatId || nearSeatId === node.seatId) && node.state === 'empty' && !props.disabled;
    const reservedAway = node.state === 'me' && !(player.state === 'seated' && player.seatId === node.seatId);
    const chairMaterial = node.chairSeat.material as THREE.MeshStandardMaterial;
    chairMaterial.emissive.set(isHovered || reservedAway ? COLOR_ME : 0x000000);
    chairMaterial.emissiveIntensity = isHovered ? 0.6 : reservedAway ? 0.35 + Math.sin(seconds * 3) * 0.1 : 0;

    if (node.person.visible) {
      // 呼吸 + 偶爾翻頁的微小動作
      node.person.position.y = node.sitHeight + Math.sin(seconds * 1.4 + node.phase) * 0.006;
      node.head.rotation.x = 0.35 + Math.sin(seconds * 0.5 + node.phase) * 0.05;
    }
    if (node.state === 'me') {
      node.lampMaterial.emissiveIntensity = 1.2 + Math.sin(seconds * 2) * 0.15;
    }
  }

  renderer.render(scene, camera);
}

function pickSeat(event: MouseEvent): string | null {
  const canvas = canvasRef.value;
  if (!canvas || !camera) return null;
  const rect = canvas.getBoundingClientRect();
  pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(
    seatNodes.map((node) => node.hitMesh),
    false,
  );
  const first = hits[0];
  return first ? ((first.object.userData.seatId as string | undefined) ?? null) : null;
}

function handlePointerMove(event: PointerEvent): void {
  if (event.pointerType !== 'mouse') return;
  const canvas = canvasRef.value;
  if (canvas) {
    const rect = canvas.getBoundingClientRect();
    azimuthTarget = (((event.clientX - rect.left) / rect.width) * 2 - 1) * 0.35;
  }
  hoveredSeatId = pickSeat(event);
  if (canvas) canvas.style.cursor = hoveredSeatId && !props.disabled ? 'pointer' : 'default';
}

function handlePointerLeave(): void {
  hoveredSeatId = null;
  azimuthTarget = 0;
}

const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function pickGround(): Point | null {
  const hit = raycaster.ray.intersectPlane(groundPlane, new THREE.Vector3());
  return hit ? { x: hit.x, z: hit.z } : null;
}

function handleClick(event: MouseEvent): void {
  containerRef.value?.focus({ preventScroll: true });
  if (!canInteract()) return;
  const seatId = pickSeat(event);
  if (seatId) {
    const node = seatNodes.find((n) => n.seatId === seatId);
    if (node) walkToSeat(node);
    return;
  }
  // pickSeat 已經用同一次的 raycaster 設定好射線
  const ground = pickGround();
  if (ground) walkToPoint(ground);
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

function handleKeyDown(event: KeyboardEvent): void {
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  const direction = KEY_MAP[event.code];
  if (direction) {
    event.preventDefault();
    keys.add(direction);
    return;
  }
  if ((event.code === 'Space' || event.code === 'KeyE' || event.code === 'Enter') && canInteract()) {
    event.preventDefault();
    if (player.state === 'idle' || player.state === 'walking') {
      const node = nearestSittableSeat();
      if (node) startSit(node);
    }
  }
}

function handleKeyUp(event: KeyboardEvent): void {
  const direction = KEY_MAP[event.code];
  if (direction) keys.delete(direction);
}

function resize(): void {
  const container = containerRef.value;
  if (!renderer || !container) return;
  renderer.setSize(container.clientWidth, container.clientHeight, false);
  fitCamera();
  rescaleLabels();
}

onMounted(() => {
  const canvas = canvasRef.value;
  const container = containerRef.value;
  if (!canvas || !container) return;

  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    emit('webgl-failed');
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  ambient = new THREE.HemisphereLight(0xffffff, 0xcfc2ab, 1);
  scene.add(ambient);
  sun = new THREE.DirectionalLight(0xfff1d6, 1.2);
  sun.position.set(-5, 10, 9);
  sun.target.position.set(0, 0, 1);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  sun.shadow.camera.left = -13;
  sun.shadow.camera.right = 13;
  sun.shadow.camera.top = 13;
  sun.shadow.camera.bottom = -13;
  scene.add(sun);
  scene.add(sun.target);

  isTouch.value = window.matchMedia('(pointer: coarse)').matches;
  buildStaticScene();
  buildPlayer();
  rebuildSeats();
  applyTheme();
  syncSeatStates();
  resize();

  canvas.addEventListener('pointermove', handlePointerMove);
  canvas.addEventListener('pointerleave', handlePointerLeave);
  canvas.addEventListener('click', handleClick);

  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(container);
  intersectionObserver = new IntersectionObserver((entries) => {
    isVisible = entries[0]?.isIntersecting ?? true;
  });
  intersectionObserver.observe(container);
  themeObserver = new MutationObserver(applyTheme);
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });

  rafId = requestAnimationFrame(animate);
});

// 座位數量或 id 清單變動（切樓層／分區）才重建；其餘狀態變化只更新外觀
watch(
  () => props.seats.map((seat) => seat.id).join(','),
  () => {
    if (!sceneRoot) return;
    rebuildSeats();
    syncSeatStates();
  },
);

// 樓層清單到了才知道有沒有上下樓梯
watch(
  () => `${props.currentFloor}|${props.floors.join(',')}`,
  () => {
    if (!sceneRoot) return;
    rebuildSeats();
    syncSeatStates();
  },
);

watch(
  () => props.isLoading,
  (loading) => {
    if (!loading) pendingSpawn = null;
  },
);

// 父層端改變座位（自動入座、還原上次座位）時，人形跟著坐過去；
// 座位被釋放（切樓層斷線重連）時，如果人還坐在上面就讓他站起來
watch(
  () => props.selectedSeatId,
  (id) => {
    if (!sceneRoot) return;
    if (id) {
      if ((player.state === 'seated' && player.seatId === id) || player.state === 'sitting') return;
      const node = seatNodes.find((n) => n.seatId === id);
      if (node) snapToSeat(node);
    } else if (player.state === 'seated') {
      standUp();
    }
    syncSeatStates();
  },
);

watchEffect(() => {
  // 讀取 props 與 getMateAtSeat 內的響應式資料，任何入座／離座都會觸發
  void props.seats.map((seat) => [seat.id, seat.available, props.getMateAtSeat(seat.id)?.displayName]);
  void props.selectedSeatId;
  void t.value;
  syncSeatStates();
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  resizeObserver?.disconnect();
  intersectionObserver?.disconnect();
  themeObserver?.disconnect();
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('pointermove', handlePointerMove);
    canvas.removeEventListener('pointerleave', handlePointerLeave);
    canvas.removeEventListener('click', handleClick);
  }
  for (const node of seatNodes) {
    if (node.label) (node.label.material).dispose();
  }
  labelTextureCache.forEach((texture) => texture.dispose());
  labelTextureCache.clear();
  staticDisposables.forEach((resource) => resource.dispose());
  staticDisposables.length = 0;
  seatDisposables.forEach((resource) => resource.dispose());
  seatDisposables.length = 0;
  shellDisposables.forEach((resource) => resource.dispose());
  shellDisposables.length = 0;
  renderer?.dispose();
  renderer = null;
  scene = null;
  camera = null;
  seatNodes = [];
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
