import { ref, computed, type ComputedRef, type Ref } from 'vue';
import type { QVueGlobals } from 'quasar';
import { useLocale, type LocaleKey } from 'src/composables/useLocale';
import {
  clampOccupancy,
  getFloorLoadPercent as getFloorLoadPercentHelper,
} from 'src/pages/index/functions/uiHelpers';
import {
  fetchFloorTrafficAction,
  type FloorHeat,
  type FloorTrafficDto,
} from 'src/pages/index/actions/floorTrafficActions';
import { fetchSeatSnapshotAction, type SeatSnapshotItem } from 'src/pages/index/actions/seatSnapshotActions';
import { fetchWebSocketTokenAction } from 'src/pages/index/actions/webSocketTokenActions';

const DEFAULT_FLOOR_CAPACITY = 45;
const DEFAULT_ZONE_CAPACITY = 15;
const FLOOR_POLL_INTERVAL_ACTIVE_MS = 8000;
const FLOOR_POLL_INTERVAL_BACKGROUND_MS = 30000;
const WS_HEARTBEAT_INTERVAL_MS = 25000;
const WS_RECONNECT_DELAY_MS = 3000;

export interface Zone {
  id: string;
  name: string;
  description: string;
  capacity: number;
  occupancy: string;
}

export interface Reader {
  userId: string;
  // 分頁專屬 id：同一個 userId 開兩個分頁、各自入座不同座位時，
  // 用這個欄位分辨是「哪一個分頁的座位」，避免互相覆蓋彼此的紀錄。
  sessionId?: string;
  displayName: string;
  seatId?: string;
  state: '專注' | '休息' | '待命';
}

export type SeatSnapshotMap = Record<
  string,
  {
    status: string;
    userId?: string;
    username?: string;
  }
>;

// Zone IDs (A/B/C) and their Chinese names are hardcoded on the backend
// (COMEANC13-backend library_handler.go zoneDefs) and stable across floors,
// so we key the display translation off the zone ID rather than matching on
// the backend-supplied name text.
const zoneLocaleMap: Record<string, { name: Record<LocaleKey, string>; description: Record<LocaleKey, string> }> = {
  A: {
    name: { 'zh-TW': '靜謐森林', 'en-US': 'Quiet Forest' },
    description: { 'zh-TW': '完全靜音深度專注', 'en-US': 'Silent, deep-focus zone' },
  },
  B: {
    name: { 'zh-TW': '城市咖啡', 'en-US': 'City Café' },
    description: { 'zh-TW': '環境音輕柔交流', 'en-US': 'Soft ambient sound, casual chat okay' },
  },
  C: {
    name: { 'zh-TW': '深海艙', 'en-US': 'Deep Sea Cabin' },
    description: { 'zh-TW': '封閉式專注座艙', 'en-US': 'Enclosed, cabin-style focus pod' },
  },
};

export function normalizeSeatId(seatId?: string | null) {
  if (!seatId) return '';
  const value = seatId.trim();
  const matched = value.match(/^(\d+)-?([A-Za-z])-?(\d{1,2})$/);
  if (!matched) return value;

  const [, floorRaw = '0', zoneRaw = 'A', indexRaw = '0'] = matched;
  return `${Number(floorRaw)}-${zoneRaw.toUpperCase()}-${indexRaw.padStart(2, '0')}`;
}

export function buildSeatId(floor: number, zoneId: string, index: number) {
  return `${floor}-${zoneId.toUpperCase()}-${String(index).padStart(2, '0')}`;
}

interface UseLibrarySocketOptions {
  userId: Ref<string>;
  sessionId: string;
  displayName: Ref<string>;
  currentFloor: Ref<number>;
  activeZoneId: Ref<string>;
  selectedSeatId: Ref<string | null>;
  isLoading: Ref<boolean>;
  quasar: QVueGlobals;
  onSelfLeave: () => void;
  onSeatStolen: () => void;
  debugSeatIdSync: boolean;
}

/**
 * Owns everything about talking to the library backend: floor/zone traffic
 * polling, the seat snapshot REST call, and the WebSocket connection
 * (token fetch, connect, reconnect-with-backoff, heartbeat, and the
 * SYNC_ALL/JOIN/MOVE/LEAVE/ERROR message handlers that keep `readers` and
 * `seatSnapshotMap` in sync). IndexPage.vue still orchestrates *when* to
 * call `reconnectRoomSession`/`stopWebSocketConnection` (floor/zone change,
 * page leave, mount) — this composable is the toolbox, not the scheduler.
 */
export function useLibrarySocket(options: UseLibrarySocketOptions) {
  const { t, locale } = useLocale();
  const {
    userId,
    sessionId,
    displayName,
    currentFloor,
    activeZoneId,
    selectedSeatId,
    isLoading,
    quasar: $q,
    onSelfLeave,
    onSeatStolen,
    debugSeatIdSync,
  } = options;

  const floorHeatData = ref<FloorHeat[]>([]);
  const floorMetaData = ref<FloorTrafficDto[]>([]);
  const readers = ref<Reader[]>([]);
  const seatSnapshotMap = ref<SeatSnapshotMap>({});

  let socket: WebSocket | null = null;
  let floorHeatTimer: number | null = null;
  let reconnectTimer: number | null = null;
  let heartbeatTimer: number | null = null;
  let connectionVersion = 0;
  let socketCloseWasIntentional = false;

  const roomID = computed(() => `${currentFloor.value}-${activeZoneId.value}`);

  function logSeatIdNormalization(
    source: string,
    rawSeatId: string | undefined | null,
    normalizedSeatId: string,
    meta?: Record<string, unknown>,
  ) {
    if (!debugSeatIdSync) return;
    console.log('[SeatSync]', { source, rawSeatId, normalizedSeatId, ...meta });
  }

  function getUniqueZoneOccupancy(zoneId: string) {
    const uniqueUsers = new Set<string>();
    readers.value.forEach((reader) => {
      if (!reader.userId || !reader.seatId) return;
      if (normalizeSeatId(reader.seatId).startsWith(`${currentFloor.value}-${zoneId}-`)) {
        uniqueUsers.add(reader.userId);
      }
    });
    return uniqueUsers.size;
  }

  const floorZones: ComputedRef<Zone[]> = computed(() =>
    (floorMetaData.value.find((floor) => floor.floor === currentFloor.value)?.zones || []).map(
      (zoneMeta) => {
        const zoneId = zoneMeta.zone || 'A';
        const zoneLocale = zoneLocaleMap[zoneId];
        const zoneName = zoneLocale?.name[locale.value] || zoneMeta.name || `Zone ${zoneId}`;
        const zoneDescription = zoneLocale?.description[locale.value] || t.value.common.customZone;
        const zoneCapacity =
          typeof zoneMeta.capacity === 'number' && zoneMeta.capacity > 0
            ? zoneMeta.capacity
            : DEFAULT_ZONE_CAPACITY;

        const occupiedFromApi =
          typeof zoneMeta.occupancy === 'number'
            ? clampOccupancy(zoneMeta.occupancy, zoneCapacity)
            : null;
        const occupiedFallback = getUniqueZoneOccupancy(zoneId);
        const occupied = occupiedFromApi ?? occupiedFallback;

        return {
          id: zoneId,
          name: zoneName,
          description: zoneDescription,
          capacity: zoneCapacity,
          occupancy: `${occupied}/${zoneCapacity}`,
        };
      },
    ),
  );

  const currentZone = computed<Zone | undefined>(() =>
    floorZones.value.find((z) => z.id === activeZoneId.value),
  );

  const isMe = (id: string) => id === userId.value;
  const getMateAtSeat = (seatId: string) =>
    readers.value.find(
      (r) => normalizeSeatId(r.seatId) === normalizeSeatId(seatId) && !isMe(r.userId),
    );

  function updateCurrentFloorHeatByReaders() {
    const roomOccupied = getUniqueZoneOccupancy(activeZoneId.value);

    floorMetaData.value = floorMetaData.value.map((floor) => {
      if (floor.floor !== currentFloor.value) return floor;

      const zones = (floor.zones || []).map((zone) => {
        if (zone.zone !== activeZoneId.value) return zone;
        const zoneCapacity =
          typeof zone.capacity === 'number' && zone.capacity > 0 ? zone.capacity : DEFAULT_ZONE_CAPACITY;
        const occupancy = clampOccupancy(roomOccupied, zoneCapacity);
        return {
          ...zone,
          occupancy,
          available: Math.max(0, zoneCapacity - occupancy),
        };
      });

      const floorCapacity =
        typeof floor.capacity === 'number' && floor.capacity > 0 ? floor.capacity : DEFAULT_FLOOR_CAPACITY;
      const floorOccupancy = zones.reduce((sum, zone) => {
        const zoneOcc = typeof zone.occupancy === 'number' ? zone.occupancy : 0;
        return sum + zoneOcc;
      }, 0);

      return {
        ...floor,
        zones,
        occupancy: clampOccupancy(floorOccupancy, floorCapacity),
        available: Math.max(0, floorCapacity - floorOccupancy),
      };
    });

    floorHeatData.value = floorHeatData.value.map((item) => {
      if (item.floor !== currentFloor.value) return item;
      const floorMeta = floorMetaData.value.find((floor) => floor.floor === item.floor);
      const occupancy =
        typeof floorMeta?.occupancy === 'number'
          ? clampOccupancy(floorMeta.occupancy, item.capacity)
          : item.occupancy;
      return { floor: item.floor, occupancy, capacity: item.capacity };
    });
  }

  function normalizeSeatSnapshot(snapshot: SeatSnapshotItem[]) {
    const nextSeatMap: SeatSnapshotMap = {};
    const nextReaders: Reader[] = [];

    snapshot.forEach((seat) => {
      const normalizedSeatId = normalizeSeatId(seat.seatId);
      logSeatIdNormalization('snapshot', seat.seatId, normalizedSeatId, {
        status: seat.status,
        userId: seat.userId,
        username: seat.username,
      });
      if (!normalizedSeatId) return;

      nextSeatMap[normalizedSeatId] = {
        status: seat.status,
        ...(seat.userId ? { userId: seat.userId } : {}),
        ...(seat.username ? { username: seat.username } : {}),
      };

      if (seat.userId && seat.status !== 'AVAILABLE') {
        nextReaders.push({
          userId: seat.userId,
          displayName: seat.username || seat.userId,
          seatId: normalizedSeatId,
          state: seat.status === 'FOCUS' ? '專注' : seat.status === 'READY' ? '待命' : '休息',
        });
      }
    });

    seatSnapshotMap.value = nextSeatMap;
    readers.value = nextReaders;
  }

  async function fetchSeatSnapshot() {
    try {
      const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL as string | undefined;
      const wsBaseUrl = import.meta.env.VITE_BACKEND_WS_URL as string | undefined;
      const snapshot = await fetchSeatSnapshotAction({
        roomID: roomID.value,
        ...(apiBaseUrl ? { apiBaseUrl } : {}),
        ...(wsBaseUrl ? { wsBaseUrl } : {}),
      });
      if (!snapshot) return;

      normalizeSeatSnapshot(snapshot.seats);
      updateCurrentFloorHeatByReaders();
    } catch {
      // ignore seat snapshot failures and continue with websocket sync
    }
  }

  function getFloorLoadPercent(floor: FloorHeat) {
    return getFloorLoadPercentHelper(floor);
  }

  async function fetchFloorTraffic() {
    try {
      const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL as string | undefined;
      const wsBaseUrl = import.meta.env.VITE_BACKEND_WS_URL as string | undefined;
      const result = await fetchFloorTrafficAction({
        defaultFloorCapacity: DEFAULT_FLOOR_CAPACITY,
        ...(apiBaseUrl ? { apiBaseUrl } : {}),
        ...(wsBaseUrl ? { wsBaseUrl } : {}),
      });
      if (!result) return;

      floorHeatData.value = result.normalized.map((item) => ({
        floor: item.floor,
        occupancy: item.occupancy,
        capacity: item.capacity,
      }));

      floorMetaData.value = result.floors;

      if (!floorHeatData.value.some((f) => f.floor === currentFloor.value) && floorHeatData.value.length) {
        currentFloor.value = floorHeatData.value[0]!.floor;
      }

      if (!floorZones.value.some((zone) => zone.id === activeZoneId.value) && floorZones.value.length) {
        activeZoneId.value = floorZones.value[0]!.id;
      }
    } catch {
      // API 端點未就緒時維持現有畫面，不中斷互動
    }
  }

  function clearReconnectTimer() {
    if (reconnectTimer !== null) {
      window.clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
  }

  function clearHeartbeatTimer() {
    if (heartbeatTimer !== null) {
      window.clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function stopWebSocketConnection(intentional = true) {
    socketCloseWasIntentional = intentional;
    clearReconnectTimer();
    clearHeartbeatTimer();

    if (socket) {
      const currentSocket = socket;
      socket = null;
      try {
        currentSocket.close();
      } catch {
        // ignore
      }
    }
  }

  function startHeartbeat() {
    clearHeartbeatTimer();
    heartbeatTimer = window.setInterval(() => {
      if (socket?.readyState !== WebSocket.OPEN) return;

      socket.send(
        JSON.stringify({
          type: 'HEARTBEAT',
          userId: userId.value,
          sessionId,
          roomID: roomID.value,
          timestamp: Date.now(),
        }),
      );
    }, WS_HEARTBEAT_INTERVAL_MS);
  }

  async function requestWebSocketToken() {
    try {
      const apiBaseUrl = import.meta.env.VITE_BACKEND_API_URL as string | undefined;
      const wsBaseUrl = import.meta.env.VITE_BACKEND_WS_URL as string | undefined;
      if (import.meta.env.DEV) {
        console.log('[WS Token Request] Config:', {
          apiBaseUrl: apiBaseUrl || '(not set)',
          wsBaseUrl: wsBaseUrl || '(not set)',
          roomID: roomID.value,
          userId: userId.value,
        });
      }
      return await fetchWebSocketTokenAction({
        roomID: roomID.value,
        userId: userId.value,
        ...(apiBaseUrl ? { apiBaseUrl } : {}),
        ...(wsBaseUrl ? { wsBaseUrl } : {}),
        clientNonce: `${userId.value}-${Date.now()}`,
      });
    } catch (err) {
      console.error('[WS Token Request] Unexpected error:', err);
      return null;
    }
  }

  function sendMove(seatId: string, state: string, username = displayName.value) {
    if (socket?.readyState !== WebSocket.OPEN) return;
    socket.send(
      JSON.stringify({
        type: 'MOVE',
        userId: userId.value,
        sessionId,
        payload: { seatId, state, username },
      }),
    );
  }

  function connectWebSocket(token: string, version: number) {
    const baseUrl = import.meta.env.VITE_BACKEND_WS_URL || 'ws://localhost:8080';
    const url = `${baseUrl}/api/v1/library/ws?floor=${currentFloor.value}&zone=${activeZoneId.value}&userId=${userId.value}&sessionId=${encodeURIComponent(sessionId)}&token=${encodeURIComponent(token)}`;

    if (import.meta.env.DEV) {
      console.log('[WS Connect] Connecting to:', url);
    }

    const currentSocket = new WebSocket(url);
    socket = currentSocket;

    currentSocket.onopen = () => {
      if (socket !== currentSocket || version !== connectionVersion) return;

      console.log('[WS Connect] Connected successfully');
      socketCloseWasIntentional = false;
      clearReconnectTimer();
      startHeartbeat();

      currentSocket.send(
        JSON.stringify({
          type: 'JOIN',
          userId: userId.value,
          sessionId,
          payload: {
            state: 'READY',
            username: displayName.value,
            seatId: selectedSeatId.value,
          },
        }),
      );

      isLoading.value = false;
    };

    currentSocket.onmessage = (event) => {
      if (socket !== currentSocket || version !== connectionVersion) return;

      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'SYNC_ALL': {
            const synchronizedReaders: Reader[] = [];
            Object.keys(msg.data).forEach((sid) => {
              const payload =
                typeof msg.data[sid] === 'string' ? JSON.parse(msg.data[sid]) : msg.data[sid];
              const normalizedSeatId = normalizeSeatId(payload.seatId);
              const readerUserId = payload.userId || sid;
              logSeatIdNormalization('ws:SYNC_ALL', payload.seatId, normalizedSeatId, {
                sessionId: sid,
                userId: readerUserId,
                username: payload.username || payload.name,
                state: payload.state,
              });
              synchronizedReaders.push({
                userId: readerUserId,
                sessionId: sid,
                displayName: payload.username || payload.name || readerUserId,
                ...(normalizedSeatId ? { seatId: normalizedSeatId } : {}),
                state: payload.state || '專注',
              });
            });
            readers.value = synchronizedReaders;
            const nextSeatMap: SeatSnapshotMap = {};
            synchronizedReaders.forEach((reader) => {
              if (!reader.seatId) return;
              nextSeatMap[normalizeSeatId(reader.seatId)] = {
                status: reader.state === '專注' ? 'FOCUS' : 'READY',
                userId: reader.userId,
                username: reader.displayName,
              };
            });
            seatSnapshotMap.value = nextSeatMap;
            updateCurrentFloorHeatByReaders();
            break;
          }

          case 'JOIN': {
            const joinKey = msg.sessionId || msg.userId;
            const joinIdx = readers.value.findIndex((r) => (r.sessionId || r.userId) === joinKey);
            const previousSeatId = joinIdx !== -1 ? readers.value[joinIdx]?.seatId : undefined;
            const normalizedJoinSeatId = normalizeSeatId(msg.payload?.seatId);
            logSeatIdNormalization('ws:JOIN', msg.payload?.seatId, normalizedJoinSeatId, {
              userId: msg.userId,
              sessionId: msg.sessionId,
              username: msg.payload?.username,
              previousSeatId,
            });
            const joinReader: Reader = {
              userId: msg.userId,
              sessionId: msg.sessionId,
              displayName: msg.payload?.username || msg.userId,
              ...(normalizedJoinSeatId ? { seatId: normalizedJoinSeatId } : {}),
              state: msg.payload?.state || '待命',
            };

            if (joinIdx !== -1) readers.value[joinIdx] = joinReader;
            else readers.value.push(joinReader);

            if (joinReader.seatId) {
              if (previousSeatId && previousSeatId !== joinReader.seatId) {
                seatSnapshotMap.value[normalizeSeatId(previousSeatId)] = { status: 'AVAILABLE' };
              }
              seatSnapshotMap.value[joinReader.seatId] = {
                status: joinReader.state === '專注' ? 'FOCUS' : 'READY',
                userId: joinReader.userId,
                username: joinReader.displayName,
              };
            }

            if (msg.userId !== userId.value) {
              $q.notify({
                message: t.value.librarySocket.newReaderJoined(joinReader.displayName),
                color: 'amber-9',
                icon: 'sensors',
                position: 'top-right',
                timeout: 2500,
                classes: 'font-black tracking-tighter',
              });
            }
            updateCurrentFloorHeatByReaders();
            break;
          }

          case 'MOVE': {
            const isSomeoneElse = msg.userId !== userId.value;
            const normalizedIncomingSeatId = normalizeSeatId(msg.payload?.seatId);
            logSeatIdNormalization('ws:MOVE', msg.payload?.seatId, normalizedIncomingSeatId, {
              userId: msg.userId,
              sessionId: msg.sessionId,
              username: msg.payload?.username,
              state: msg.payload?.state,
            });
            const isTargetingMySeat = normalizedIncomingSeatId === normalizeSeatId(selectedSeatId.value);

            if (isSomeoneElse && isTargetingMySeat) {
              onSeatStolen();
              $q.notify({
                message: t.value.librarySocket.seatTakenBySomeoneWhileYouWereAway,
                color: 'negative',
                icon: 'priority_high',
                position: 'top',
                timeout: 2000,
                classes: 'font-black',
              });
            }

            const moveKey = msg.sessionId || msg.userId;
            const moveIdx = readers.value.findIndex((r) => (r.sessionId || r.userId) === moveKey);
            const moveReader: Reader = {
              userId: msg.userId,
              sessionId: msg.sessionId,
              displayName: msg.payload?.username || msg.userId,
              ...(normalizedIncomingSeatId ? { seatId: normalizedIncomingSeatId } : {}),
              state: msg.payload.state || '專注',
            };

            const previousSeatId = moveIdx !== -1 ? readers.value[moveIdx]?.seatId : undefined;
            if (moveIdx !== -1) readers.value[moveIdx] = moveReader;
            else readers.value.push(moveReader);

            if (previousSeatId && previousSeatId !== moveReader.seatId) {
              seatSnapshotMap.value[normalizeSeatId(previousSeatId)] = { status: 'AVAILABLE' };
            }

            if (moveReader.seatId) {
              seatSnapshotMap.value[moveReader.seatId] = {
                status: moveReader.state === '專注' ? 'FOCUS' : 'READY',
                userId: moveReader.userId,
                username: moveReader.displayName,
              };
            }

            updateCurrentFloorHeatByReaders();
            break;
          }

          case 'LEAVE': {
            const leaveKey = msg.sessionId || msg.userId;
            const leavingReader = readers.value.find((r) => (r.sessionId || r.userId) === leaveKey);
            const vacatedSeatId = msg.seatId
              ? normalizeSeatId(msg.seatId)
              : leavingReader?.seatId
                ? normalizeSeatId(leavingReader.seatId)
                : '';
            logSeatIdNormalization('ws:LEAVE', msg.seatId, vacatedSeatId, {
              userId: msg.userId,
              sessionId: msg.sessionId,
            });
            if (vacatedSeatId) {
              seatSnapshotMap.value[vacatedSeatId] = { status: 'AVAILABLE' };
            }
            readers.value = readers.value.filter((r) => (r.sessionId || r.userId) !== leaveKey);
            updateCurrentFloorHeatByReaders();

            const isThisTabsSession = msg.sessionId ? msg.sessionId === sessionId : msg.userId === userId.value;
            if (isThisTabsSession) {
              onSelfLeave();
            }
            break;
          }

          case 'ERROR': {
            if (msg.message === 'SEAT_TAKEN') {
              onSeatStolen();
              $q.notify({
                message: t.value.librarySocket.seatTakenBySomeoneElse,
                color: 'negative',
                icon: 'block',
                position: 'top',
                timeout: 2500,
                classes: 'font-black tracking-tighter',
              });
            }
            break;
          }
        }
      } catch (err) {
        console.error('WebSocket 訊息解析失敗:', err);
      }
    };

    currentSocket.onclose = () => {
      if (socket === currentSocket) {
        socket = null;
      }

      clearHeartbeatTimer();

      if (version !== connectionVersion) return;

      if (socketCloseWasIntentional) {
        console.log('[WS Close] Connection closed intentionally');
        socketCloseWasIntentional = false;
        onSelfLeave();
        return;
      }

      onSelfLeave();

      console.warn('[WS Close] Connection closed unexpectedly, scheduling reconnect...');
      isLoading.value = false;
      clearReconnectTimer();
      reconnectTimer = window.setTimeout(() => {
        if (version !== connectionVersion) return;
        isLoading.value = true;
        void reconnectRoomSession();
      }, WS_RECONNECT_DELAY_MS);
    };

    currentSocket.onerror = (error) => {
      if (socket !== currentSocket || version !== connectionVersion) return;

      console.error('[WS Error] WebSocket 發生錯誤:', {
        error,
        readyState: currentSocket.readyState,
        url: currentSocket.url,
        state: ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][currentSocket.readyState],
      });
      $q.notify({
        message: t.value.librarySocket.connectionError,
        color: 'negative',
        icon: 'wifi_off',
        position: 'top',
        timeout: 1800,
      });
    };
  }

  async function reconnectRoomSession() {
    const version = ++connectionVersion;
    stopWebSocketConnection(true);
    selectedSeatId.value = null;
    seatSnapshotMap.value = {};

    void fetchFloorTraffic();

    await fetchSeatSnapshot();

    if (version !== connectionVersion) return;

    const tokenPayload = await requestWebSocketToken();
    if (version !== connectionVersion) return;

    if (!tokenPayload?.token) {
      isLoading.value = false;
      console.error('[WS Connect] Token payload missing or invalid:', {
        hasPayload: !!tokenPayload,
        hasToken: !!tokenPayload?.token,
      });
      $q.notify({
        message: t.value.librarySocket.tokenFetchFailed,
        color: 'negative',
        icon: 'vpn_key_off',
        position: 'top',
        timeout: 2200,
      });
      return;
    }

    if (import.meta.env.DEV) {
      console.log('[WS Connect] Token acquired, initiating connection...');
    }
    connectWebSocket(tokenPayload.token, version);
  }

  function clearFloorPollingTimer() {
    if (floorHeatTimer !== null) {
      window.clearInterval(floorHeatTimer);
      floorHeatTimer = null;
    }
  }

  function startFloorPollingTimer() {
    clearFloorPollingTimer();
    const interval = document.hidden ? FLOOR_POLL_INTERVAL_BACKGROUND_MS : FLOOR_POLL_INTERVAL_ACTIVE_MS;
    floorHeatTimer = window.setInterval(() => {
      void fetchFloorTraffic();
    }, interval);
  }

  function handleVisibilityChange() {
    startFloorPollingTimer();
  }

  return {
    // state
    floorHeatData,
    floorMetaData,
    readers,
    seatSnapshotMap,
    roomID,
    floorZones,
    currentZone,
    // helpers
    isMe,
    getMateAtSeat,
    getFloorLoadPercent,
    // actions
    sendMove,
    reconnectRoomSession,
    stopWebSocketConnection,
    startFloorPollingTimer,
    clearFloorPollingTimer,
    handleVisibilityChange,
  };
}

export type LibrarySocket = ReturnType<typeof useLibrarySocket>;
