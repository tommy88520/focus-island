<template>
  <div class="relative" :class="{ 'shake-error': isShake }">
    <div
      ref="containerRef"
      class="relative h-[400px] w-full overflow-hidden rounded-2xl transition-opacity duration-500 sm:h-[500px]"
      :class="isLoading ? 'opacity-0' : 'opacity-100'"
      style="touch-action: pan-y"
    >
      <canvas ref="canvasRef" class="block h-full w-full" />
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
import { onBeforeUnmount, onMounted, ref, watch, watchEffect } from 'vue';
import * as THREE from 'three';
import type { Reader } from 'src/pages/index/composables/useLibrarySocket';
import type { Seat } from 'src/pages/index/components/SeatGrid.vue';
import { useLocale } from 'src/composables/useLocale';

const props = defineProps<{
  seats: Seat[];
  selectedSeatId: string | null;
  isShake: boolean;
  isLoading: boolean;
  currentFloor: number;
  disabled: boolean;
  getMateAtSeat: (seatId: string) => Reader | null | undefined;
}>();

const emit = defineEmits<{
  select: [seatId: string];
  // WebGL 不可用時通知父層退回 2D 座位格子
  'webgl-failed': [];
}>();

const { t } = useLocale();

const containerRef = ref<HTMLDivElement | null>(null);
const canvasRef = ref<HTMLCanvasElement | null>(null);

const SEATS_PER_DESK = 5;
const SEAT_SPACING = 1.25;
const DESK_SPACING = 3.4;
const COLOR_ME = 0xfbbf24;
const COLOR_MATE = 0x2dd4bf;

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

  // 點擊判定：整個座位範圍的隱形方塊
  const hitMaterial = track(new THREE.MeshBasicMaterial({ visible: false }));
  const hitMesh = addMesh(group, new THREE.BoxGeometry(1.1, 1.6, 1.9), hitMaterial, [0, 0.8, 0.5], false);
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
  };
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
  });
  fitCamera();
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
  const sceneWidth = SEATS_PER_DESK * SEAT_SPACING + 1.2;
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

    const occupied = state === 'me' || state === 'mate' || state === 'taken';
    node.person.visible = occupied;
    node.lampMaterial.emissiveIntensity = occupied ? 1.2 : 0;

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
  updateCameraAzimuth();

  for (const node of seatNodes) {
    const isHovered = hoveredSeatId === node.seatId && node.state === 'empty' && !props.disabled;
    const chairMaterial = node.chairSeat.material as THREE.MeshStandardMaterial;
    chairMaterial.emissive.set(isHovered ? COLOR_ME : 0x000000);
    chairMaterial.emissiveIntensity = isHovered ? 0.6 : 0;

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

function handleClick(event: MouseEvent): void {
  if (props.disabled || props.isLoading) return;
  const seatId = pickSeat(event);
  if (!seatId) return;
  const seat = props.seats.find((s) => s.id === seatId);
  if (!seat || !seat.available) return;
  emit('select', seatId);
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

  buildStaticScene();
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
