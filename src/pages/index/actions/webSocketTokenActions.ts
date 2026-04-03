export interface WebSocketTokenResponse {
  token: string;
  expiresAt?: string;
}

function resolveHttpBaseUrl(apiBaseUrl?: string, wsBaseUrl?: string) {
  if (apiBaseUrl) return apiBaseUrl.replace(/\/$/, '');

  const fallbackWsBase = wsBaseUrl || 'ws://localhost:8080';
  const IS_DEV = import.meta.env.DEV;
  
  // Convert ws:// or wss:// to http:// or https://
  let httpUrl = fallbackWsBase
    .replace(/^wss:\/\//, 'https://')
    .replace(/^ws:\/\//, 'http://');
  
  // Remove trailing slash
  httpUrl = httpUrl.replace(/\/$/, '');
  
  if (IS_DEV) {
    console.log('[URL Resolution] WS URL to HTTP:', { fallbackWsBase, httpUrl });
  }
  
  return httpUrl;
}

export async function fetchWebSocketTokenAction(params: {
  roomID: string;
  userId: string;
  apiBaseUrl?: string;
  wsBaseUrl?: string;
  clientNonce?: string;
}) {
  const endpoint = `${resolveHttpBaseUrl(params.apiBaseUrl, params.wsBaseUrl)}/api/v1/library/ws-token`;
  const IS_DEV = import.meta.env.DEV;
  
  try {
    if (IS_DEV) console.log('[WS Token] Requesting token from:', endpoint);
    
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[WS Token] Token request failed with status ${response.status}:`, errorText);
      return null;
    }

    const payload = (await response.json()) as WebSocketTokenResponse;
    if (!payload?.token || typeof payload.token !== 'string') {
      console.error('[WS Token] Invalid token response:', payload);
      return null;
    }

    if (IS_DEV) console.log('[WS Token] Got token successfully');
    return payload;
  } catch (err) {
    console.error('[WS Token] Token request error:', err);
    return null;
  }
}