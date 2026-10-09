# CLAUDE.md

Quasar (Vue 3 + TS, `<script setup>`) SPA on Vercel. Pinia, Tailwind v4 alongside Quasar. Backend is the sibling repo `COMEANC13-backend` (Go, on Koyeb).

## Commands

```bash
npm run dev     # quasar dev
npm run build   # -> dist/spa
npm run lint
npx vue-tsc --noEmit   # type-check (no test suite)
```

Env (in `.env.local` / Vercel): `VITE_BACKEND_API_URL`, `VITE_BACKEND_WS_URL` (falls back to `ws://localhost:8080`; REST derives `http://` from it).

## Gotchas

- Quasar's `.flex` also sets `flex-wrap: wrap` — add `!flex-nowrap` on rows that must stay on one line.
- **Quasar's global CSS beats Tailwind utilities** (Tailwind v4 is layered, Quasar isn't). `hidden`, `flex`, and heading sizes on `h1`–`h6`/`p` get overridden — use the `!` modifier (`md:!hidden`, `!text-sm`, `dark:!text-white`) or the `hide-below-sm` utility. `dark:` follows Quasar's `body--dark` class.
- No backend locally? Seats still render with defaults. Stairs only appear when `GET /api/v1/library/floors` answers, so mock that on :8080 to see them.

- **Pixel UI**: `src/css/app.scss` has `pixel-panel` / `pixel-btn` / `pixel-field` / `pixel-track` and the `--px-*` colour tokens (redefined under `body.body--dark`); `font-pixel` is Silkscreen (Latin + digits only) from Google Fonts. These are unlayered, so don't stack Tailwind `bg-`/`border-`/`shadow-` utilities on the same element.

## How it fits together

- **`pages/IndexPage.vue`**: seat selection, the connection flow, and a fixed bottom dock holding the timer (`FocusClockPanel`, settings in a dialog) and `AmbientAudioPlayer`, so the map gets the full width. Room = `{floor}-{zone}` (`2-A`), seat = `{room}-{NN}`. On mount and on floor/zone change: seat snapshot (REST) → WS token (REST) → WebSocket; `connectionVersion` drops callbacks from superseded attempts. Networking lives in `pages/index/composables/useLibrarySocket.ts` + `pages/index/actions/`.
- **Identity**: `userId` is per browser (`localStorage['lib_uid']`); the per-tab id (`sessionStorage`) is sent as `sessionId` and is what owns a seat server-side. Two tabs of one user may hold different seats on purpose — don't add a single-tab lock.
- **Seats are only released by moving or disconnecting** (no "leave" message). Standing up keeps `selectedSeatId`; the seat just glows as reserved.
- **Remembered across visits** (`localStorage`): last seat, last floor/zone (`focus_island_last_location_v1`), and the avatar's standing position (`focus_island_player_position_v1`, written by the scene). On load: seated → sit back; standing → stand at the same spot while the seat is still auto-reserved.
- **Seat scene (`pages/index/components/SeatScenePixel.vue`)**: Gather-style top-down pixel library on a 2D canvas. Emits `select`, `change-floor`, and `webgl-failed` (→ `IndexPage` falls back to `SeatGrid`).
  - `pixel/pixelMap.ts` (pure): tile coords, 1 tile = 16px; seat slots with a `facing`, props, rugs. First 15 slots are a standard zone; extra seats add 2×2 tables and grow the map.
  - `pixel/pixelArt.ts`: Kenney Roguelike Indoors (CC0, `public/pixel/`) for chairs/tables/plants; floor, walls, shelves, stairs, TV, rugs, beanbags, armchairs and avatars are painted in code. Avatars use a swappable palette (`AvatarColors`).
  - `pixel/pixelThemes.ts`: the zone picks the look (`themeForZone`: A forest, B café, C deep-sea cabin, D/unknown library). Themes only re-skin floor, walls, back-wall decor, the TV spot, plants and small props plus per-frame ambience — seat slots and collision are shared, so a new theme never touches navigation. Zone ids/names come from the backend's `zoneDefs`; `zoneLocaleMap` in `useLibrarySocket.ts` translates them.
  - Collision + A* in `composables/seatNavigation.ts` (pure, tile units; its `z` is the map's `y`).
  - Static layer painted once per map build; props/seats/player Y-sorted each frame; integer scale (3× ≥900px wide, else 2×) with a follow camera; name pills drawn in screen space.
  - Every room has the same beach below the library's front wall — through a glass door on the lowest floor, down an escalator on the floors above (`map.beach.escalator`) (`map.libraryHeight` is where it starts; `map.height` includes it). The minimap (button / `M`) redraws the static layer scaled down each frame while open; clicking it walks there.
  - Floor changes: stairs (adjacent floor) or the elevator on the back wall (any floor, picked from a panel). Both set `pendingSpawn` and emit `change-floor`.
  - Emotes (bottom-left buttons, `H` / `1`–`4`): a fixed set (`EMOTE_IDS`, mirrored by the backend's `allowedEmotes`) sent as an `EMOTE` WS message. Others only see a bubble over the sender's **seat**, since standing positions aren't shared. Beachgoers and `demo_` bots within a few tiles reply locally.
  - Vehicles (`map.vehicles`, art in `paintVehicle`): bike indoors, cart on deck/sand, boat at sea. `vehicleArea` limits where each can go; `canOccupy` swaps in for `nav.isBlocked` while riding. The boat has inertia (`updateBoat`) and you can only get off near the shore. Riding is local only, like walking; the scene drops you off when focus starts or the map rebuilds.
  - Standing/riding positions are shared via `POS` (throttled to ~7/s while moving, a 20s keepalive, `hidden` when you sit). Not stored server-side: a new peer's `JOIN` bumps `peerJoinedAt` so everyone re-sends. Remote players are eased toward their last position (`remoteShown`) and dropped after 45s of silence. The seat itself still goes through `MOVE`.
- **Audio** (`composables/useAmbientAudio.ts`, `synthAmbience.ts`): tracks with a `synth` field are generated with Web Audio; the rest are mp3s in `public/music/`.
- **Focus together** (`composables/groupFocus.ts`, pref `groupFocus`): clock-aligned rounds, 25 min from every :00/:30 then a 5 min break. No server state; `IndexPage` checks each second, joins mid-round via `store.alignTimer`, and won't re-start a round the user stopped. Auto-restart is ignored in this mode.
- `WidgetPage.vue` (iframe embed) reuses `FocusClockPanel` + `AmbientAudioPlayer` inside one panel — keep both components layout-neutral (no fixed positioning).
- **Timer** (`stores/pomodoro.ts` + `workers/timer.worker.ts`): countdown runs in a Web Worker so background tabs aren't throttled; today's stats reset by local date.
- **Player prefs** (`composables/usePlayerPrefs.ts`, one shared ref in `localStorage`): daily goal (header progress), avatar palette indices (`LOOK_HAIRS`/`LOOK_SHIRTS` in `pixelArt.ts`) and do-not-disturb. Look + DND ride along in every `MOVE`/`JOIN` payload (`readerExtras` parses them); changing them while seated re-sends `MOVE`. DND hides others' emote bubbles locally and shows 🔕 on the name pill.
- Reader `state` is normalised from the backend's `FOCUS`/`READY`/`BREAK` by `toReaderState`.
- `MainLayout.vue` learns the current room via the `focus-room-updated` event + `localStorage`, not a shared store.

## Direction

Visual reference is Gather (2D pixel art, not 3D). Prefer CC0 art; otherwise paint it in code in the Kenney palette. The beach south of the library is purely local decoration: no seats, nothing sent to the backend, and its sunbathers (`map.beachgoers`) are not real users.
