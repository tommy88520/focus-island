// Known values are AVAILABLE / READY / FOCUS / OCCUPIED, but the type stays a
// plain string since the backend may introduce new statuses without a frontend release.
export type SeatStatus = string;

export interface SeatSnapshotItem {
  seatId: string;
  status: SeatStatus;
  userId?: string;
  username?: string;
  x?: number;
  y?: number;
}

export interface SeatSnapshotResponse {
  roomID: string;
  capacity: number;
  occupancy: number;
  available: number;
  seats: SeatSnapshotItem[];
}

function resolveHttpBaseUrl(apiBaseUrl?: string, wsBaseUrl?: string) {
  if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, '');

  const fallbackWsBase = wsBaseUrl || 'ws://localhost:8080';
  return fallbackWsBase.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/$/, '');
}

export async function fetchSeatSnapshotAction(params: {
  roomID: string;
  apiBaseUrl?: string;
  wsBaseUrl?: string;
}) {
  const endpoint = `${resolveHttpBaseUrl(params.apiBaseUrl, params.wsBaseUrl)}/api/v1/library/seats/${params.roomID}`;
  const response = await fetch(endpoint, { method: 'GET' });
  if (!response.ok) return null;

  const payload = (await response.json()) as SeatSnapshotResponse;
  if (!Array.isArray(payload.seats)) return null;
  return payload;
}
