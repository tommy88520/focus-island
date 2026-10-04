<template>
  <div class="relative" :class="{ 'shake-error': isShake }">
    <div
      ref="containerRef"
      class="relative h-[400px] w-full overflow-hidden rounded-2xl outline-none transition-opacity duration-500 focus-visible:ring-2 focus-visible:ring-amber-400/40 sm:h-[500px]"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
      style="touch-action: pan-y"
      tabindex="0"
      @keydown="handleKeyDown"
      @keyup="handleKeyUp"
      @blur="keys.clear()"
    >
      <canvas ref="canvasRef" class="block h-full w-full" />
      <p
        class="pointer-events-none absolute bottom-2 left-2 right-2 rounded-lg bg-slate-950/55 px-2 py-1 text-center text-[10px] font-bold tracking-wide text-white/75 backdrop-blur-sm"
      >
        {{ isTouch ? t.seatScene.hintTouch : t.seatScene.hintDesktop }}
      </p>
    </div>

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

const SEATS_PER_DESK = 5;
const SEAT_SPACING = 1.25;
const DESK_SPACING = 3.4;
const COLOR_ME = 0xfbbf24;
const COLOR_MATE = 0x2dd4bf;
const WALK_SPEED = 2.6;
const PLAYER_RADIUS = 0.2;
const ROOM_HALF_WIDTH = 4;
const STAIR_X = 2.7;
const STAIR_TRIGGER = { z: -1.55, radius: 0.55 };
// 椅子後方的走道，人從這裡走進椅子坐下
const APPROACH_OFFSET_Z = 1.62;
const CHAIR_OFFSET_Z = 0.95;
const SIT_TWEEN_SECONDS = 0.4;
const SIT_REACH = 1.3;

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
  x: number;
  z: number;
}

let renderer: THREE.WebGLRenderer | null = null;
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let ambient: THREE.HemisphereLight | null = null;
let sun: THREE.DirectionalLight | null = null;
let floorMaterial: THREE.MeshStandardMaterial | null = null;
let sceneRoot: THREE.Group | null = null;
let seatNodes: SeatNode[] = [];
let resizeObserver: ResizeObserver | null = null;
let intersectionObserver: IntersectionObserver | null = null;
let themeObserver: MutationObserver | null = null;
let rafId = 0;
let isVisible = true;
let hoveredSeatId: string | null = null;
let deskCount = 0;
let nav: Navigation | null = null;
let stairs: StairInfo[] = [];
let stairGroup: THREE.Group | null = null;
let stairLock = false;
let pendingSpawn: { point: Point; floor: number } | null = null;
let nearSeatId: string | null = null;
let lastFrameTime = 0;
const keys = new Set<string>();
let azimuth = 0;
let azimuthTarget = 0;
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const labelTextureCache = new Map<string, THREE.CanvasTexture>();
const staticDisposables: { dispose: () => void }[] = [];
const seatDisposables: { dispose: () => void }[] = [];
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
  if (!ambient || !sun || !floorMaterial) return;
  const dark = isDark();
  ambient.intensity = dark ? 0.55 : 1.05;
  ambient.color.set(dark ? 0xb8c4ff : 0xffffff);
  ambient.groundColor.set(dark ? 0x1b1410 : 0xcfc2ab);
  sun.intensity = dark ? 0.55 : 1.4;
  sun.color.set(dark ? 0xaab8ff : 0xfff1d6);
  floorMaterial.color.set(dark ? 0x2a2018 : 0xc9a97c);
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

function buildPerson(): { group: THREE.Group; material: THREE.MeshStandardMaterial; head: THREE.Mesh } {
  const group = new THREE.Group();
  const material = makeMaterial(COLOR_MATE, 0.7);
  const skin = makeMaterial(0xf1d3b3, 0.8);
  // 軀幹（坐姿，略向前傾）
  const torso = addMesh(group, new THREE.CapsuleGeometry(0.2, 0.34, 6, 12), material, [0, 0.58, 0]);
  torso.rotation.x = -0.22;
  // 頭（低頭看書）
  const head = addMesh(group, new THREE.SphereGeometry(0.17, 20, 16), skin, [0, 1.02, -0.1]);
  // 手臂伸向桌面
  for (const side of [-1, 1]) {
    const arm = addMesh(group, new THREE.CapsuleGeometry(0.055, 0.34, 4, 8), material, [side * 0.24, 0.62, -0.2]);
    arm.rotation.x = -1.25;
  }
  // 大腿
  for (const side of [-1, 1]) {
    const leg = addMesh(group, new THREE.CapsuleGeometry(0.075, 0.3, 4, 8), material, [side * 0.11, 0.3, -0.18]);
    leg.rotation.x = -Math.PI / 2;
  }
  return { group, material, head };
}

function buildSeat(seatId: string, index: number): SeatNode {
  const deskIndex = Math.floor(index / SEATS_PER_DESK);
  const col = index % SEATS_PER_DESK;
  const x = (col - (SEATS_PER_DESK - 1) / 2) * SEAT_SPACING;
  const z = deskIndex * DESK_SPACING;

  const group = new THREE.Group();
  group.position.set(x, 0, z);

  const wood = makeMaterial(0x6b4a2f, 0.7);
  const fabric = makeMaterial(0x3b4a6b, 0.9);

  // 椅子：座面、椅背（朝後 +z）
  const chairSeat = addMesh(group, new THREE.BoxGeometry(0.62, 0.08, 0.6), fabric, [0, 0.42, 0.95]);
  addMesh(group, new THREE.BoxGeometry(0.62, 0.62, 0.08), fabric, [0, 0.78, 1.25]);
  for (const lx of [-0.25, 0.25]) {
    for (const lz of [0.7, 1.2]) {
      addMesh(group, new THREE.CylinderGeometry(0.03, 0.03, 0.4, 6), wood, [lx, 0.2, lz], false);
    }
  }

  // 桌上物件：隔板 + 書
  addMesh(group, new THREE.BoxGeometry(0.04, 0.32, 0.5), makeMaterial(0xd8cdb8, 0.9), [SEAT_SPACING / 2, 0.98, -0.1]);
  const book = addMesh(group, new THREE.BoxGeometry(0.38, 0.05, 0.28), makeMaterial(0x8a3b3b, 0.8), [0, 0.855, 0.05]);
  book.rotation.y = (index % 5) * 0.15 - 0.3;

  // 檯燈
  const lampMaterial = track(
    new THREE.MeshStandardMaterial({
      color: 0xffe4a8,
      emissive: 0xffc36b,
      emissiveIntensity: 0,
      roughness: 0.5,
    }),
  );
  addMesh(group, new THREE.CylinderGeometry(0.07, 0.08, 0.02, 12), makeMaterial(0x222222, 0.5), [0.42, 0.84, -0.2], false);
  addMesh(group, new THREE.CylinderGeometry(0.012, 0.012, 0.3, 6), makeMaterial(0x222222, 0.5), [0.42, 0.99, -0.2], false);
  lampMaterial.side = THREE.DoubleSide;
  const lampShade = addMesh(group, new THREE.ConeGeometry(0.13, 0.14, 14, 1, true), lampMaterial, [0.42, 1.18, -0.2], false);

  // 人形
  const { group: person, material: personMaterial, head } = buildPerson();
  person.position.set(0, 0.42, 0.95);
  person.visible = false;
  group.add(person);

  // 點擊判定：桌面到椅子範圍的隱形方塊。刻意壓低、不往桌子後面延伸，否則會吃掉桌後（樓梯口）的地板點擊
  const hitMaterial = track(new THREE.MeshBasicMaterial({ visible: false }));
  const hitMesh = addMesh(group, new THREE.BoxGeometry(1.1, 1.1, 1.6), hitMaterial, [0, 0.55, 0.7], false);
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
    x,
    z,
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
  return { x: node.x, z: node.z + APPROACH_OFFSET_Z };
}

function buildStairs(): void {
  if (!sceneRoot) return;
  if (stairGroup) sceneRoot.remove(stairGroup);
  stairGroup = new THREE.Group();
  sceneRoot.add(stairGroup);
  stairs = [];
  const hasUp = props.floors.includes(props.currentFloor + 1);
  const hasDown = props.floors.includes(props.currentFloor - 1);
  if (hasDown) stairs.push({ direction: -1, x: -STAIR_X });
  if (hasUp) stairs.push({ direction: 1, x: STAIR_X });

  for (const stair of stairs) {
    const up = stair.direction === 1;
    const stepMaterial = makeMaterial(up ? 0x8b7355 : 0x5c4b3a, 0.8);
    for (let i = 0; i < 3; i += 1) {
      const height = 0.14 * (3 - i);
      addMesh(stairGroup, new THREE.BoxGeometry(1.3, height, 0.28), stepMaterial, [stair.x, height / 2, -3.01 + 0.14 + i * 0.28]);
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
      track(new THREE.SpriteMaterial({ map: getLabelTexture(text, up ? '#fbbf24' : '#2dd4bf'), depthTest: false, transparent: true })),
    );
    sign.scale.set(0.9, 0.25, 1);
    sign.position.set(stair.x, 1.35, -2.5);
    sign.renderOrder = 10;
    stairGroup.add(sign);
  }
}

function buildNavigation(): void {
  const obstacles: Rect[] = [];
  const deskHalfWidth = (SEATS_PER_DESK * SEAT_SPACING) / 2;
  for (let d = 0; d < deskCount; d += 1) {
    const z = d * DESK_SPACING;
    obstacles.push({ x0: -deskHalfWidth, x1: deskHalfWidth, z0: z - 0.6, z1: z + 0.5 });
  }
  for (const node of seatNodes) {
    obstacles.push({ x0: node.x - 0.31, x1: node.x + 0.31, z0: node.z + 0.65, z1: node.z + 1.3 });
  }
  for (const stair of stairs) {
    obstacles.push({ x0: stair.x - 0.7, x1: stair.x + 0.7, z0: -3.05, z1: -2.15 });
  }
  nav = createNavigation(
    { xMin: -ROOM_HALF_WIDTH, xMax: ROOM_HALF_WIDTH, zMin: -2.95, zMax: (deskCount - 1) * DESK_SPACING + 2.35 },
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
  placePlayer(node.x, node.z + CHAIR_OFFSET_Z);
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
  player.sitTo = { x: node.x, z: node.z + CHAIR_OFFSET_Z };
  player.sitSeatId = node.seatId;
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
      const length = Math.hypot(dx, dz);
      const stepX = (dx / length) * WALK_SPEED * dt;
      const stepZ = (dz / length) * WALK_SPEED * dt;
      // 分軸移動，貼著牆或桌子時可以順著滑過去
      if (nav && !nav.isBlocked(player.x + stepX, player.z)) player.x += stepX;
      if (nav && !nav.isBlocked(player.x, player.z + stepZ)) player.z += stepZ;
      player.facing = Math.atan2(dx, dz);
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
    player.facing = Math.atan2(player.sitTo.x - player.sitFrom.x, -1);
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
  playerGroup.position.set(player.x, 0.42 * sitProgress, player.z);

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

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 72;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.beginPath();
    ctx.roundRect(4, 8, 248, 56, 28);
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = '700 30px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text.length > 8 ? `${text.slice(0, 8)}…` : text, 128, 37);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  labelTextureCache.set(key, texture);
  return texture;
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
  const material = new THREE.SpriteMaterial({ map: getLabelTexture(text, color), depthTest: false, transparent: true });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(0.9, 0.25, 1);
  sprite.position.set(0, 1.75, 0.9);
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
  withSeatTracking(() => {
    props.seats.forEach((seat, index) => {
      seatNodes.push(buildSeat(seat.id, index));
    });
    deskCount = Math.ceil(props.seats.length / SEATS_PER_DESK);
    rebuildDesks();
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
    placePlayer(0, -1.4);
    player.state = 'idle';
    player.seatId = null;
  }
  stairLock = insideStairZone(player.x, player.z);
}

let deskGroup: THREE.Group | null = null;
function rebuildDesks(): void {
  if (!sceneRoot) return;
  if (deskGroup) sceneRoot.remove(deskGroup);
  deskGroup = new THREE.Group();
  const top = makeMaterial(0xb98b5b, 0.6);
  const leg = makeMaterial(0x4a3320, 0.8);
  const width = SEATS_PER_DESK * SEAT_SPACING;
  for (let d = 0; d < deskCount; d += 1) {
    const z = d * DESK_SPACING;
    addMesh(deskGroup, new THREE.BoxGeometry(width, 0.08, 1.1), top, [0, 0.8, z - 0.05]);
    for (const lx of [-width / 2 + 0.1, width / 2 - 0.1]) {
      for (const lz of [-0.5, 0.4]) {
        addMesh(deskGroup, new THREE.BoxGeometry(0.08, 0.76, 0.08), leg, [lx, 0.38, z + lz]);
      }
    }
  }
  sceneRoot.add(deskGroup);
}

function buildStaticScene(): void {
  if (!scene) return;
  sceneRoot = new THREE.Group();
  scene.add(sceneRoot);

  floorMaterial = track(new THREE.MeshStandardMaterial({ color: 0xc9a97c, roughness: 0.9 }));
  const floor = new THREE.Mesh(track(new THREE.PlaneGeometry(40, 40)), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  // 後方書牆：一排書櫃 + 隨機色書本
  const shelfZ = -3.2;
  const shelfMaterial = makeMaterial(0x5a3d26, 0.8);
  addMesh(scene, new THREE.BoxGeometry(11, 3.2, 0.5), shelfMaterial, [0, 1.6, shelfZ - 0.25]);
  const bookGeometry = track(new THREE.BoxGeometry(0.16, 0.5, 0.36));
  const bookPalette = [0x8a3b3b, 0x3b5a8a, 0x3b8a68, 0xb38a3b, 0x6b3b8a, 0xd8cdb8, 0x8a5a3b];
  const bookMaterials = bookPalette.map((c) => makeMaterial(c, 0.8));
  const booksPerRow = 40;
  const rows = 4;
  for (let r = 0; r < rows; r += 1) {
    for (let i = 0; i < booksPerRow; i += 1) {
      const seed = (r * 131 + i * 17) % 97;
      const mesh = new THREE.Mesh(bookGeometry, bookMaterials[seed % bookMaterials.length]);
      mesh.position.set(-5 + (i + 0.5) * (10 / booksPerRow), 0.5 + r * 0.7 + (seed % 3) * 0.02, shelfZ + 0.05);
      mesh.scale.y = 0.8 + (seed % 5) * 0.08;
      mesh.castShadow = false;
      scene.add(mesh);
    }
    addMesh(scene, new THREE.BoxGeometry(10.4, 0.05, 0.5), shelfMaterial, [0, 0.22 + r * 0.7, shelfZ + 0.1], false);
  }

  // 一盞暖色吊燈光暈（純視覺，不增加光源數量）
  const glow = new THREE.Mesh(
    track(new THREE.CircleGeometry(4.5, 32)),
    track(new THREE.MeshBasicMaterial({ color: 0xffd48a, transparent: true, opacity: 0.12 })),
  );
  glow.rotation.x = -Math.PI / 2;
  glow.position.set(0, 0.01, 1.5);
  scene.add(glow);
}

function fitCamera(): void {
  const container = containerRef.value;
  if (!camera || !container) return;
  const width = container.clientWidth;
  const height = container.clientHeight;
  if (!width || !height) return;

  camera.aspect = width / height;
  const sceneWidth = ROOM_HALF_WIDTH * 2 + 0.6;
  const sceneDepth = Math.max(1, deskCount - 1) * DESK_SPACING + 5.2;
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const hFov = 2 * Math.atan(Math.tan(vFov / 2) * camera.aspect);
  const distForWidth = sceneWidth / 2 / Math.tan(hFov / 2);
  const distForDepth = sceneDepth / 2 / Math.tan(vFov / 2);
  const distance = Math.max(distForWidth, distForDepth * 0.82, 8);
  const target = new THREE.Vector3(0, 0.4, ((deskCount - 1) * DESK_SPACING) / 2 + 0.2);
  const elevation = THREE.MathUtils.degToRad(52);
  const horizontal = Math.cos(elevation) * distance;
  camera.position.set(
    Math.sin(azimuth) * horizontal,
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
  azimuth += (azimuthTarget - azimuth) * 0.08;
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
      node.person.position.y = 0.42 + Math.sin(seconds * 1.4 + node.phase) * 0.006;
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
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(0x000000, 0);

  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);

  ambient = new THREE.HemisphereLight(0xffffff, 0xcfc2ab, 1);
  scene.add(ambient);
  sun = new THREE.DirectionalLight(0xfff1d6, 1.2);
  sun.position.set(-5, 10, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  sun.shadow.camera.left = -9;
  sun.shadow.camera.right = 9;
  sun.shadow.camera.top = 9;
  sun.shadow.camera.bottom = -9;
  scene.add(sun);

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
