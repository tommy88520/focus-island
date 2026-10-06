# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # quasar dev - local dev server (SPA)
npm run build     # quasar build -> dist/spa (deployed to Vercel)
npm run lint      # eslint over src*/**/*.{ts,js,cjs,mjs,vue}
npm run format    # prettier --write, respects .gitignore
npm test          # no-op placeholder, there is no test suite
```

Vercel deployment: framework preset `Other`, build command `npm run build`, output dir `dist/spa`, SPA rewrites handled by `vercel.json`.

Runtime config is via Vite env vars, read directly with `import.meta.env` at call sites (not centralized): `VITE_BACKEND_API_URL` (REST base) and `VITE_BACKEND_WS_URL` (WS base, falls back to `ws://localhost:8080` — actions convert this to `http(s)://` for REST calls when `VITE_BACKEND_API_URL` is unset). No `.env` file is committed; set these locally in `.env.local` or in Vercel project settings.

## Architecture

Quasar (Vue 3 + TypeScript, Composition API/`<script setup>`) SPA, deployed to Vercel. Pinia for state, Tailwind (via `@tailwindcss/postcss`) alongside Quasar's own component styling.

**Routes** (`src/router/routes.ts`, history mode): `/` (seat selection + focus timer, `IndexPage.vue`), `/progress` (`ProgressPage.vue`). `router/index.ts` also injects per-route SEO `<meta>`/canonical tags on every navigation from each route's `meta.seo`.

**`IndexPage.vue`** is the core of the app and is a single large (~2300 line) file combining: seat-map UI, floor/zone navigation, the Pomodoro timer UI, a background ambient-audio player (`<audio>` element managed manually with fade in/out), and all realtime networking. Key pieces inside it:
- Room = `{floor}-{zoneId}` (e.g. `2-A`), seat = `{floor}-{zoneId}-{NN}`; `normalizeSeatId`/`buildSeatId` reconcile the several seat-id shapes the backend/WS can emit.
- Connection flow on mount / whenever `currentFloor`/`activeZoneId` change (`reconnectRoomSession`): reset local seat state → `fetchFloorTraffic()` (fire-and-forget) → `fetchSeatSnapshot()` (REST, awaited) → `requestWebSocketToken()` (REST, awaited) → `connectWebSocket()`. A monotonically increasing `connectionVersion` guards against stale callbacks from a superseded connection attempt racing the current one.
- WS message types handled: `SYNC_ALL`, `JOIN`, `MOVE`, `LEAVE`, `ERROR` (`SEAT_TAKEN`) — mirrors the backend hub in `COMEANC13-backend`. A client-side heartbeat (`HEARTBEAT`) is sent every `WS_HEARTBEAT_INTERVAL_MS`; reconnect on unexpected close is delayed `WS_RECONNECT_DELAY_MS`.
- `userId` is a per-browser value persisted in `localStorage['lib_uid']` (generated via `createRandomId`, so it's high-entropy — shared across tabs in the same browser). `currentTabId` (`sessionStorage`, via `getOrCreateTabId`) is per-tab and is sent to the backend as `sessionId` on every WS connect/JOIN/MOVE/HEARTBEAT — it's the actual seat-ownership identity server-side (see backend `CLAUDE.md`), which is why `Reader` entries and the WS message handlers match on `sessionId` (falling back to `userId`) rather than `userId` alone: two tabs sharing the same `userId` need to be tracked as distinct occupants.
- Design intent (see comments around `toggleFocus`/the `storage` event listener): multiple browser tabs sharing the same `userId` are allowed to run independent focus sessions concurrently — there is deliberately no single-tab lock. Known residual limitation: the seat-availability/"mate" heuristics (`getMateAtSeat`, `isMe`) still treat "same `userId`" as "this is me", so a seat held by your *other* tab currently renders as available rather than as an occupied-by-you seat in this tab's view.
- The "seated" state, audio prefs, focus-duration prefs, and a short-lived (`RESUME_CANDIDATE_TTL_MS`) "resume previous focus session" payload are all separately persisted to `localStorage`/`sessionStorage` under their own keys near the top of the script block. The `focus-room-updated` `CustomEvent` + `localStorage['focus_island_current_room_info_v1']` is how `MainLayout.vue`'s drawer displays the currently selected room without a shared store.
- Networking helpers live in `src/pages/index/actions/*Actions.ts` (`floorTrafficActions`, `seatSnapshotActions`, `webSocketTokenActions`) and pure formatting/color helpers in `src/pages/index/functions/uiHelpers.ts`.

**Seat scene (`pages/index/components/SeatScenePixel.vue`)**: a Gather-style top-down pixel-art library drawn on a 2D canvas (it replaced the old Three.js scene). It takes the same props as `SeatGrid` plus `floors`, and emits `select` and `change-floor` (`webgl-failed` now means "no 2D canvas / sprite sheet failed", and `IndexPage` falls back to `SeatGrid`).
- Map (`pages/index/pixel/pixelMap.ts`, pure logic): tile coordinates, 1 tile = 16 world px. The back wall (top 3 rows) holds the bookshelves, both stairs and the AV-corner TV; the left wall has windows. `createPixelMap(seatCount)` returns the seat slots (`chair`/`stool`/`pouf`/`armchair`, each with a tile and a `facing`), the props and rugs. The first 15 slots are a standard zone (study tables, beanbag lounge, window counter, AV armchairs); more seats add 2×2 tables at the bottom right and make the map taller. Collision/pathfinding reuse `composables/seatNavigation.ts` with tile units (its `z` is the map's `y`).
- Art (`pages/index/pixel/pixelArt.ts`): chairs, tables, round table and plants come from Kenney's Roguelike Indoors sheet (CC0, `public/pixel/kenney-roguelike-indoor.png` + license next to it; tile ids in `KENNEY`). Everything the pack lacks — floor, walls, windows, bookshelves, stairs, TV, rugs, beanbags, stools, armchairs and the 16×20 avatars — is painted in code. Avatars are char-map sprites with a swappable palette (`AvatarColors`); other readers' colours are derived from their display name, so later outfit customisation only needs a different palette.
- Rendering: the static layer (floor, rugs, walls, shelves) is painted once per map build; every frame the props, seats/people and the player are Y-sorted and drawn on top, then a night tint + lamp glows (dark mode) or window sunlight (light mode). The world is scaled by an integer (3× when the canvas is ≥900px wide, otherwise 2×); if the map doesn't fit, the camera follows the player, clamped to the map. Name pills and stair signs are drawn afterwards in screen space so the text stays crisp.
- The player avatar is local-only: walking positions are **not** synced over the WS (the backend has no such message), so other users never see you walk. Only the seat you finally sit in is sent (`select` → `selectSeat` → `sendMove`).
- There is no "leave seat" message on the backend; a seat is released only by moving to another seat or by disconnecting. So standing up keeps `selectedSeatId` (the seat glows amber as "reserved"), and walking into a stair opening triggers `change-floor` → the normal `currentFloor` watcher → `reconnectRoomSession`, which clears it. `pendingSpawn` makes the player appear at the matching stair of the new floor, and survives multiple map rebuilds until `isLoading` goes false.
- Movement: WASD/arrows (container must have focus), Space/E/Enter to sit, click/tap the floor or a seat to walk there.

**Ambient audio (`composables/useAmbientAudio.ts` + `synthAmbience.ts`)**: tracks with a `synth` field (rain, ocean, library, blues, classical) are generated live with Web Audio instead of loading an mp3 (avoids loop seams on natural sounds). `createSynthPlayer()` owns one `AudioContext`; each track is a factory that builds a noise/instrument bed plus events scheduled ahead on the audio clock (`scheduleEvents`). The other tracks (forest, lofi, warm, glow) are still mp3s in `public/music/`; `rmultimediaeu-ocean-waves` and `liecio-light-rain` are now unused. Synth tracks go through `ctx.destination`, not the `<audio>` element, so they may be suspended by the OS on a locked phone.

**`stores/pomodoro.ts`**: Pinia store owning timer state (`baseDuration`, `timeLeft`, `isRunning`) and today's cumulative focus stats (persisted to `localStorage['focus_island_today_progress_v1']`, keyed by local date so it resets daily). Delegates actual countdown ticking to `src/workers/timer.worker.ts` (a dedicated Web Worker so the interval isn't throttled by background-tab timer clamping) and accumulates focused seconds from the `TICK` messages it receives back.
