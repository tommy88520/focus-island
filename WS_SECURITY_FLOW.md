# WS Security Flow Spec

## Goal

Reduce WebSocket abuse by adding a first-layer gate before any long-lived connection is established.

## Desired Flow

1. User opens the page.
2. Frontend fetches the seat snapshot first.
3. User selects a room.
4. Frontend requests a short-lived WS token from backend.
5. Frontend opens WebSocket with the token.
6. Backend validates token, room, user, origin, and rate limits.
7. If valid, backend allows the WS connection.
8. WS only handles incremental events after the snapshot.

## Implemented Backend Endpoints

1. Seat snapshot:

```http
GET /api/v1/library/seats/{roomID}
```

2. WS token:

```http
POST /api/v1/library/ws-token
```

3. WebSocket:

```http
GET /api/v1/library/ws?floor={n}&zone={A|B|C}&userId={id}&token={short_lived_token}
```

Token notes:

- short TTL
- bound to roomID
- bound to userId
- single-use anti-replay on the current backend process

## Frontend Responsibilities

- Fetch seat snapshot on page load.
- Do not open WS immediately on first render.
- Request WS token only after room selection.
- Open WS with token.
- Handle loading, reconnect, and error UI.
- Send heartbeat when connected.
- Render UI only; do not make security decisions.

## Backend Responsibilities

- Validate access to snapshot API.
- Issue short-lived WS token.
- Validate WS handshake.
- Check token expiry.
- Verify roomID, user identity, and origin.
- Enforce IP/user rate limits.
- Maintain seat state as the source of truth.
- Close idle connections via heartbeat timeout.

## APIs

### 1. Seat Snapshot API

Purpose: get the current room seat state before WS subscription.

Example:

```http
GET /api/v1/library/seats/{roomID}
```

Path param:

- `roomID`: string, format `{floor}-{zone}`
- Example: `2-A`, `1-B`, `5-C`

Response example:

```json
{
  "roomID": "2-A",
  "capacity": 15,
  "occupancy": 1,
  "available": 14,
  "seats": [
    {
      "seatId": "2-A-01",
      "status": "AVAILABLE",
      "x": 1,
      "y": 1
    }
  ]
}
```

Seat fields:

- `seatId`
- `status`
- `userId` optional
- `username` optional
- `x`
- `y`

Suggested statuses:

- `AVAILABLE`
- `READY`
- `FOCUS`
- `OCCUPIED`

### 2. WS Token API

Purpose: issue a short-lived token for a specific room/user.

Implemented endpoint:

```http
POST /api/v1/library/ws-token
```

Request body:

- `roomID`
- `userId`
- optional client nonce or correlation id

Response:

- `token`
- `expiresAt`

Token rules:

- short TTL
- bound to userId
- bound to roomID
- ideally single-use or strongly anti-replay

### 3. WebSocket Endpoint

Purpose: receive incremental seat updates.

Handshake validation must check:

- token validity
- token expiry
- roomID match
- user identity match
- origin allowlist
- rate limit

Client query params used by the backend now:

- `floor`
- `zone`
- `userId`
- `token`

## Security Controls

- No anonymous direct WS access.
- No unauthorized room access.
- Reject expired or malformed tokens.
- Reject invalid origin.
- Enforce per-IP and per-user rate limits.
- Enforce max concurrent WS connections per user.
- Disconnect idle connections via heartbeat timeout.

## Data Ownership

Frontend owns:

- initial render
- seat snapshot display
- token request trigger
- heartbeat
- UI state

Backend owns:

- auth and authorization
- token issuance and validation
- final seat state
- rate limiting
- connection approval/rejection

## Acceptance Criteria

- Page load does not immediately create an anonymous WS connection.
- Snapshot is fetched before WS subscription.
- WS without token is rejected.
- Invalid token is rejected.
- Mismatched roomID is rejected.
- Invalid origin is rejected.
- Excessive connection attempts are rate-limited.
- Heartbeat timeout disconnects the session.
- Snapshot data and WS incremental data stay in sync.

## Implementation Priority

1. Seat snapshot API
2. WS token API
3. WS handshake validation
4. Rate limiting and origin checks
5. Heartbeat timeout handling
6. Frontend flow: snapshot first, WS second

## Notes

- If auth is not ready yet, use temporary session-based identity for the transition period.
- Keep seatId formatting consistent across snapshot, WS, and UI.
- Prefer backend-generated identifiers over frontend guesses.
