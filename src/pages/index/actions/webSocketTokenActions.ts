export interface WebSocketTokenResponse {
  token: string;
  expiresAt?: string;
}

function resolveHttpBaseUrl(apiBaseUrl?: string, wsBaseUrl?: string) {
  if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, '');

  const fallbackWsBase = wsBaseUrl || 'ws://localhost:8080';
  return fallbackWsBase.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:').replace(/\/$/, '');
}

export async function fetchWebSocketTokenAction(params: {
  roomID: string;
  userId: string;
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  clientNonce?: string;
}) {
  const endpoint = `${resolveHttpBaseUrl(params.apiBaseUrl, params.wsBaseUrl)}/api/v1/library/ws-token`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      roomID: params.roomID,
      userId: params.userId,
      ...(params.clientNonce ? { clientNonce: params.clientNonce } : {}),
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as WebSocketTokenResponse;
  if (!payload?.token || typeof payload.token !== 'string') return null;

  return payload;
}