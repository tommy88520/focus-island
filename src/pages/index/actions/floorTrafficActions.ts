import { clampOccupancy } from '../functions/uiHelpers';

export interface FloorHeat {
  floor: number;
  occupancy: number;
  capacity: number;
}

export interface FloorTrafficDto {
  floor: number;
  name?: string;
  occupancy?: number;
  available?: number;
  capacity?: number;
  zones?: Array<{
    zone?: string;
    roomId?: string;
    name?: string;
    occupancy?: number;
    available?: number;
    capacity?: number;
  }>;
}

function resolveHttpBaseUrl(apiBaseUrl?: string, wsBaseUrl?: string) {
  if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, '');

  const fallbackWsBase = wsBaseUrl || 'ws://localhost:8080';
  return fallbackWsBase.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/$/, '');
}

export async function fetchFloorTrafficAction(params: {
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  defaultFloorCapacity: number;
}) {
  const endpoint = `${resolveHttpBaseUrl(params.apiBaseUrl, params.wsBaseUrl)}/api/v1/library/floors`;

  const response = await fetch(endpoint, { method: 'GET' });
  if (!response.ok) return null;

  const payload = (await response.json()) as FloorTrafficDto[] | { data?: FloorTrafficDto[] };
  const floors = Array.isArray(payload)
    ? payload
    : Array.isArray(payload.data)
      ? payload.data
      : [];

  if (!floors.length) return null;

  const normalized = floors
    .map((item) => {
      if (typeof item.floor !== 'number') return null;

      const zoneCapacitySum = (item.zones || []).reduce((sum, zone) => {
        const zoneCapacity =
          typeof zone.capacity === 'number' && zone.capacity > 0 ? zone.capacity : 0;
        return sum + zoneCapacity;
      }, 0);

      const capacity =
        typeof item.capacity === 'number' && item.capacity > 0
          ? item.capacity
          : zoneCapacitySum > 0
            ? zoneCapacitySum
            : params.defaultFloorCapacity;

      const occupancyFromApi =
        typeof item.occupancy === 'number' ? clampOccupancy(item.occupancy, capacity) : null;

      return {
        floor: item.floor,
        occupancy: occupancyFromApi ?? 0,
        capacity,
      };
    })
    .filter((item): item is FloorHeat => item !== null);

  if (!normalized.length) return null;

  return {
    floors,
    normalized,
  };
}

// export async function fetchSeatID(){
//   const result = await fetch(`${resolveHttpBaseUrl()}${'/api/v1/library/seat-id'}`, { method: 'GET' });
// }