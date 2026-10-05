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

**Seat scene (`pages/index/components/SeatScene3D.vue`)**: Three.js 3D library that replaces `SeatGrid.vue` (kept as the fallback — `IndexPage` flips `use3d` off when the scene emits `webgl-failed`). It takes the same props as `SeatGrid` plus `floors`, and emits `select` and `change-floor`.
- The player avatar is local-only: walking positions are **not** synced over the WS (the backend has no such message), so other users never see you walk. Only the seat you finally sit in is sent (`select` → `selectSeat` → `sendMove`).
- There is no "leave seat" message on the backend; a seat is released only by moving to another seat or by disconnecting. So standing up keeps `selectedSeatId` (the chair glows amber as "reserved"), and walking to the stairs triggers `change-floor` → the normal `currentFloor` watcher → `reconnectRoomSession`, which clears it.
- Movement: WASD/arrows (container must have focus), Space/E/Enter to sit, click floor/seat to walk. Collision and A* pathfinding live in `composables/seatNavigation.ts` (pure x/z logic, no three.js). Stairs are in the back wall strip (down = left, up = right); `pendingSpawn` makes the player appear at the matching stair of the new floor, and survives multiple scene rebuilds until `isLoading` goes false.
- Seat positions are not a grid: `composables/libraryLayout.ts` (pure x/z, no three.js) returns the seat slots (`desk`/`counter`/`beanbag`/`armchair`, each with a position and `yaw` facing) and the furniture for a zone, split into study tables, a beanbag lounge, an AV corner and a window counter. The first 15 slots are a standard zone; more seats add rows of 4-person tables at the front and make the room deeper. Each seat is built in a local frame (sitting point at the origin, facing +z) and the approach point is `APPROACH_DISTANCE` behind it.
- The camera keeps the room's long side along the screen's long side: landscape views from the front (`baseAzimuth = 0`), portrait rotates to the window side (`-π/2`). Arrow keys/WASD are screen-relative, so `updatePlayer` rotates them by `baseAzimuth`.
- Seats/furniture/stairs are rebuilt on every floor/zone change under `withSeatTracking`, so their geometries/materials are disposed separately from the static scene. Keep that split when adding meshes. Furniture registers its light/dark tweaks in `furnitureThemeHooks`, which is reset on each rebuild.
- The room shell (`buildShell`: concrete floor slab, a terraced bookshelf wall across the back with the two stairs in the middle, a window wall on the left and a concrete wall on the right) is modelled loosely on NCCU's Dah Hsian Seetoo Library. Its depth follows `layout.frontZ`, so `rebuildShell` rebuilds it only when that changes and tracks its resources in a third list, `shellDisposables`. Materials that differ between light and dark mode register a callback in `themeHooks` instead of being special-cased in `applyTheme`. Concrete/oak textures are generated on a canvas at startup (no image assets).

**Ambient audio (`composables/useAmbientAudio.ts` + `synthAmbience.ts`)**: tracks with a `synth` field (rain, ocean, library, blues, classical) are generated live with Web Audio instead of loading an mp3 (avoids loop seams on natural sounds). `createSynthPlayer()` owns one `AudioContext`; each track is a factory that builds a noise/instrument bed plus events scheduled ahead on the audio clock (`scheduleEvents`). The other tracks (forest, lofi, warm, glow) are still mp3s in `public/music/`; `rmultimediaeu-ocean-waves` and `liecio-light-rain` are now unused. Synth tracks go through `ctx.destination`, not the `<audio>` element, so they may be suspended by the OS on a locked phone.

**`stores/pomodoro.ts`**: Pinia store owning timer state (`baseDuration`, `timeLeft`, `isRunning`) and today's cumulative focus stats (persisted to `localStorage['focus_island_today_progress_v1']`, keyed by local date so it resets daily). Delegates actual countdown ticking to `src/workers/timer.worker.ts` (a dedicated Web Worker so the interval isn't throttled by background-tab timer clamping) and accumulates focused seconds from the `TICK` messages it receives back.
