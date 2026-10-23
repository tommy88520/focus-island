<template>
  <div class="relative min-h-[calc(100vh-80px)] px-3 py-2 pb-24 sm:px-4 sm:py-3 sm:pb-20">
    <div class="relative z-10 mx-auto max-w-[1500px]">
      <!-- 地圖佔滿整個寬度；番茄鐘和音樂收進底部的工具列 -->
      <main class="space-y-2 sm:space-y-3">
        <header class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex min-w-0 items-center gap-2">
            <div
              class="font-pixel shrink-0 rounded-[3px] border-2 border-[color:var(--px-ink)] bg-[color:var(--px-accent)] px-2 py-0.5 text-[11px] font-bold uppercase text-[#3b2a20]"
            >
              {{ t.indexPage.floorBadgePrefix }}{{ currentFloor }}
            </div>
            <!-- 在 F1／公園／北投：換分區會在看不到的地方換房間，所以只給「搭車回去」 -->
            <button
              v-if="sceneLocation !== 'library'"
              type="button"
              class="pixel-btn h-7 min-w-0 shrink whitespace-nowrap px-2 text-[11px]"
              @click="leaveScene"
            >
              {{ visitHome && !visitFromMapScene ? `🏠 ${t.friends.backHome}` : visitHome ? `🗺️ ${t.home.backToMap}` : sceneLocation === 'home' ? `🗺️ ${t.home.backToMap}` : `🚇 ${t.indexPage.backToLibrary}` }}
            </button>
            <!-- 樓層、分區收成一顆，點開才有分頁，地圖才大（電腦、手機都一樣） -->
            <button
              v-else
              type="button"
              class="pixel-btn h-7 min-w-0 shrink !flex-nowrap gap-1 px-2 text-[11px]"
              :aria-expanded="mobileNavOpen"
              @click="mobileNavOpen = !mobileNavOpen"
            >
              <span class="truncate">{{ librarySocket.currentZone.value?.name || `Zone ${activeZoneId}` }}</span>
              <q-icon :name="mobileNavOpen ? 'expand_less' : 'expand_more'" size="16px" />
            </button>
            <h3 class="!hidden truncate !text-sm !leading-tight font-black !tracking-tight text-slate-900 dark:!text-white sm:!text-base">
              {{ store.isRunning ? t.indexPage.headerTitleRunning : t.indexPage.headerTitleIdle }}
            </h3>
            <p class="!hidden truncate text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:!text-white/55">
              {{ librarySocket.currentZone.value?.name }} · {{ librarySocket.currentZone.value?.description }}
            </p>
            <button
              v-if="sceneLocation !== 'home'"
              type="button"
              class="pixel-btn h-7 shrink-0 whitespace-nowrap px-2 text-[11px]"
              :title="t.indexPage.shareLocationHint"
              @click="shareMyLocation"
            >
              📍 <span class="sm:!hidden">{{ t.indexPage.shareLocationShort }}</span><span class="hide-below-sm">{{ t.indexPage.shareLocation }}</span>
            </button>
          </div>

          <FloorTabs
            :class="{ '!hidden': !mobileNavOpen || sceneLocation !== 'library' }"
            :floors="floorTabItems"
            :current-floor="currentFloor"
            @update:current-floor="currentFloor = $event"
          />
        </header>

        <section class="pixel-panel relative p-1.5 sm:p-3">
          <ZoneTabs
            :class="{ '!hidden': !mobileNavOpen || sceneLocation !== 'library' }"
            :zones="zoneTabItems"
            :active-zone-id="activeZoneId"
            @update:active-zone-id="activeZoneId = $event"
          />

          <!-- 地圖全螢幕：外層蓋滿畫面，裡層手機直拿時轉 90 度（sceneFullscreen.ts） -->
          <!-- 全螢幕時搬到 body 底下，才蓋得過上面的選單跟底部工具列（元件不會重建） -->
          <Teleport to="body" :disabled="!sceneFullscreen">
          <div ref="sceneShellRef" class="scene-shell" :class="{ 'scene-shell--fs': sceneFullscreen }">
          <div ref="sceneRotorRef" class="scene-rotor" :class="{ 'scene-rotor--rotated': sceneRotated, 'scene-rotor--bar-gap': sceneNeedsBarGap }">
          <SceneTransition v-if="useCanvasScene" :loading="isLoading" />
          <button
            v-if="useCanvasScene"
            type="button"
            class="absolute left-2 top-2 z-20 !flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/80 text-white shadow-lg ring-1 ring-white/15 transition hover:bg-slate-800"
            :aria-label="sceneFullscreen ? t.indexPage.exitFullscreen : t.indexPage.fullscreen"
            :title="sceneFullscreen ? t.indexPage.exitFullscreen : t.indexPage.fullscreen"
            @click="toggleSceneFullscreen"
          >
            <q-icon :name="sceneFullscreen ? 'fullscreen_exit' : 'fullscreen'" size="20px" />
          </button>
          <!-- 回自己家、好友：每張地圖左上角都有（沒登入先跳登入）；家裡的好友鈕在家裡右上角 -->
          <div v-if="useCanvasScene && sceneLocation !== 'home'" class="absolute left-[3.25rem] top-2 z-20 !flex !flex-nowrap gap-1.5">
            <button type="button" class="pixel-btn h-9 whitespace-nowrap px-2.5 text-xs" @click="goHome">
              🏠 {{ t.home.goHome }}
            </button>
            <button type="button" class="pixel-btn h-9 whitespace-nowrap px-2.5 text-xs" @click="openFriends">
              👥 {{ t.friends.button }}<span v-if="friendsApi.incoming.value.length" class="ml-1 rounded-full bg-[#e25a4a] px-1.5 text-[10px] font-black text-white">{{ friendsApi.incoming.value.length }}</span>
            </button>
            <!-- 賽車那幾張（F1 月台、賽道）：一鍵搭車回圖書館，不用走回地圖邊的車站；專注中不給（要先站起來結束專注） -->
            <button v-if="racingScene && !store.isRunning" type="button" class="pixel-btn h-9 whitespace-nowrap px-2.5 text-xs" @click="leaveScene">
              🚇 {{ t.indexPage.backToLibraryShort }}
            </button>
          </div>
          <FriendsPanel v-if="friendsOpen && sceneLocation !== 'home'" @close="friendsOpen = false" @visit="visitFromMap" />
          <HomeScene
            v-if="useCanvasScene && sceneLocation === 'home'"
            ref="homeSceneRef"
            :key="visitHome ? `visit:${visitHome.profile.code}` : (account.perks.value.homeTheme ?? 'basic')"
            :theme="account.perks.value.homeTheme"
            :visit="visitHome"
            :remote-players="librarySocket.remotePlayers.value"
            @position="librarySocket.sendPosition"
            :disabled="store.isRunning"
            @visit="startVisit"
            @open-tv="mobileAudioOpen = true; audioPlayerRef?.openYouTube()"
            @leave="sceneLocation = homeReturnTo"
          />
          <F1Scene
            v-else-if="useCanvasScene && sceneLocation === 'f1'"
            ref="f1SceneRef"
            :seats="currentSeats.slice(F1_SEAT_START, F1_SEAT_START + F1_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            @select="selectSeat"
            :remote-players="librarySocket.remotePlayers.value"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @leave="backToHub('f1')"
            @end-focus="endFocusToLeave"
          />
          <F1HubScene
            v-else-if="useCanvasScene && sceneLocation === 'f1hub'"
            ref="hubSceneRef"
            :seats="currentSeats.slice(HUB_SEAT_START, HUB_SEAT_START + HUB_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            :remote-players="librarySocket.remotePlayers.value"
            :from="hubFrom"
            @select="selectSeat"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @go="sceneLocation = $event"
            @leave="sceneLocation = 'library'"
            @end-focus="endFocusToLeave"
          />
          <GrandPrixScene
            v-else-if="useCanvasScene && gpScene"
            :key="gpScene"
            ref="gpSceneRef"
            :circuit="CIRCUITS[gpScene]"
            :seats="currentSeats.slice(gpSeatStart(gpScene), gpSeatStart(gpScene) + GP_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            :remote-players="librarySocket.remotePlayers.value"
            @select="selectSeat"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @leave="backToHub(gpScene)"
            @end-focus="endFocusToLeave"
          />
          <MiaokouScene
            v-else-if="useCanvasScene && sceneLocation === 'miaokou'"
            ref="miaokouSceneRef"
            :seats="currentSeats.slice(MIAOKOU_SEAT_START, MIAOKOU_SEAT_START + MIAOKOU_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            :remote-players="librarySocket.remotePlayers.value"
            @select="selectSeat"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @leave="sceneLocation = 'library'"
            @end-focus="endFocusToLeave"
          />
          <ZooScene
            v-else-if="useCanvasScene && sceneLocation === 'zoo'"
            ref="zooSceneRef"
            :seats="currentSeats.slice(ZOO_SEAT_START, ZOO_SEAT_START + ZOO_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            :remote-players="librarySocket.remotePlayers.value"
            @select="selectSeat"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @leave="sceneLocation = 'library'"
            @end-focus="endFocusToLeave"
          />
          <CityScene
            v-else-if="useCanvasScene && cityScene"
            :key="cityScene"
            ref="citySceneRef"
            :city="CITIES[cityScene]"
            :seats="currentSeats.slice(citySeatStart(cityScene), citySeatStart(cityScene) + CITY_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            :remote-players="librarySocket.remotePlayers.value"
            @select="selectSeat"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @leave="sceneLocation = 'library'"
            @go="sceneLocation = $event"
            @end-focus="endFocusToLeave"
          />
          <ShilinScene
            v-else-if="useCanvasScene && sceneLocation === 'shilin'"
            ref="shilinSceneRef"
            :seats="currentSeats.slice(SHILIN_SEAT_START, SHILIN_SEAT_START + SHILIN_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            :remote-players="librarySocket.remotePlayers.value"
            @select="selectSeat"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @leave="sceneLocation = 'library'"
            @end-focus="endFocusToLeave"
          />
          <RiverParkScene
            v-else-if="useCanvasScene && sceneLocation === 'park'"
            ref="parkSceneRef"
            :seats="currentSeats.slice(PARK_SEAT_START, PARK_SEAT_START + PARK_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            @select="selectSeat"
            :remote-players="librarySocket.remotePlayers.value"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @leave="sceneLocation = 'library'"
            @end-focus="endFocusToLeave"
          />
          <BeitouScene
            v-else-if="useCanvasScene && sceneLocation === 'beitou'"
            ref="beitouSceneRef"
            :seats="currentSeats.slice(BEITOU_SEAT_START, BEITOU_SEAT_START + BEITOU_SEAT_COUNT)"
            :selected-seat-id="selectedSeatId"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            @select="selectSeat"
            :remote-players="librarySocket.remotePlayers.value"
            @position="librarySocket.sendPosition"
            @whisper="librarySocket.sendWhisper"
            @leave="sceneLocation = 'library'"
            @end-focus="endFocusToLeave"
          />
          <SeatScenePixel
            v-else-if="useCanvasScene"
            ref="pixelSceneRef"
            :seats="currentSeats"
            :selected-seat-id="selectedSeatId"
            :is-shake="isShake"
            :is-loading="isLoading"
            :current-floor="currentFloor"
            :floors="floorTabItems.map((f) => f.floor)"
            :zone-name="librarySocket.currentZone.value?.name ?? ''"
            :zones="zoneTabItems.map((z) => ({ id: z.id, name: z.name }))"
            :disabled="store.isRunning"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            :remote-emote="librarySocket.lastEmote.value"
            :remote-players="librarySocket.remotePlayers.value"
            :seated-items="librarySocket.seatedItems.value"
            :peer-joined-at="librarySocket.peerJoinedAt.value"
            :raining="audio.isAudioPlaying.value && audio.selectedAudioTrack.value === 'rain'"
            @select="selectSeat"
            @emote="librarySocket.sendEmote"
            @position="librarySocket.sendPosition"
            @change-floor="currentFloor = $event"
            @change-zone="activeZoneId = $event"
            @go-f1="goToHub"
            @go-park="sceneLocation = 'park'"
            @go-beitou="sceneLocation = 'beitou'"
            @go-miaokou="sceneLocation = 'miaokou'"
            @go-shilin="sceneLocation = 'shilin'"
            @go-zoo="sceneLocation = 'zoo'"
            @go-city="sceneLocation = $event"
            @whisper="librarySocket.sendWhisper"
            @open-tv="mobileAudioOpen = true; audioPlayerRef?.openYouTube()"
            @end-focus="endFocusToLeave"
            @area="sceneArea = $event"
            @webgl-failed="useCanvasScene = false"
          />
          <SeatGrid
            v-else
            :seats="currentSeats"
            :selected-seat-id="selectedSeatId"
            :is-shake="isShake"
            :is-loading="isLoading"
            :current-floor="currentFloor"
            :disabled="store.isRunning"
            :seat-button-class="seatButtonClass"
            :get-mate-at-seat="librarySocket.getMateAtSeat"
            @select="selectSeat"
          />
          </div>
          </div>
          </Teleport>
        </section>
        <LoginDialog v-if="!account.session.value" v-model="loginOpen" :title="t.home.loginTitle" :hint="t.home.loginHint" @logged-in="afterLogin" />
      </main>
    </div>
  </div>

  <div
    class="fixed inset-x-1 bottom-1 z-50 sm:inset-x-auto sm:bottom-3 sm:left-1/2 sm:w-max sm:max-w-[calc(100vw-1.5rem)] sm:-translate-x-1/2"
    :style="{ paddingBottom: 'env(safe-area-inset-bottom)' }"
  >
    <!-- 全螢幕時計時、音樂搬進地圖裡（跟著一起轉），可以收成一顆小按鈕；YouTube 播放器不搬（iframe 搬了會重新載入） -->
    <Teleport :to="sceneRotorRef ?? 'body'" :disabled="!sceneFullscreen">
    <div :class="{ 'fs-dock': sceneFullscreen }">
    <WatchTogetherBar v-show="!sceneFullscreen || !dockCollapsed" :watch="watchTogether" />
    <button
      v-if="sceneFullscreen"
      type="button"
      class="pixel-btn fs-dock__toggle h-8 px-3 text-xs"
      :aria-expanded="!dockCollapsed"
      @click="dockCollapsed = !dockCollapsed"
    >
      <template v-if="dockCollapsed">⏱ {{ formattedTime }} <q-icon name="expand_less" size="16px" /></template>
      <template v-else><q-icon name="expand_more" size="16px" /> {{ t.indexPage.collapseDock }}</template>
    </button>
    <div v-show="!sceneFullscreen || !dockCollapsed" class="pixel-panel flex flex-col !flex-nowrap gap-2 p-2 sm:flex-row sm:items-center sm:gap-3 sm:px-3">
      <div class="flex min-w-0 !flex-nowrap items-center gap-2">
      <FocusClockPanel
        class="min-w-0 flex-1"
        :is-running="store.isRunning"
        :base-duration="store.baseDuration"
        :time-left="store.timeLeft"
        :formatted-time="formattedTime"
        :has-resume-candidate="!!resumeCandidate"
        :resume-candidate-label="resumeCandidateLabel"
        :selected-seat-label="selectedSeatLabel"
        :focus-duration-options="focusDurationOptions"
        :selected-focus-duration-minutes="selectedFocusDurationMinutes"
        :auto-restart-on-finish="autoRestartOnFinish"
        :group-focus-available="true"
        :group-focus="playerPrefs.groupFocus"
        :group-status="groupStatus"
        @toggle-focus="toggleFocus"
        @restart-focus-timer="restartFocusTimer"
        @resume-previous-focus="resumePreviousFocus"
        @reset-focus-timer="resetFocusTimer"
        @select-focus-duration="handleFocusDurationSelect"
        @update:auto-restart-on-finish="autoRestartOnFinish = $event"
        @update:group-focus="playerPrefs.groupFocus = $event"
        :notifications="playerPrefs.notifications"
        @update:notifications="handleNotificationsToggle"
      />
      <!-- 手機：音樂收成一顆按鈕，展開才佔一列 -->
      <button
        type="button"
        class="pixel-btn h-10 w-10 shrink-0 sm:!hidden"
        :class="{ 'pixel-btn--active': mobileAudioOpen }"
        :aria-label="t.indexPage.toggleMusic"
        :aria-expanded="mobileAudioOpen"
        @click="mobileAudioOpen = !mobileAudioOpen"
      >
        {{ audio.isAudioPlaying.value ? '🎶' : '🎵' }}
      </button>
      </div>
      <div class="hide-below-sm h-10 w-[2px] bg-[color:var(--px-ink)] opacity-30"></div>
      <AmbientAudioPlayer ref="audioPlayerRef" :class="{ 'max-sm:!hidden': !mobileAudioOpen && !sceneFullscreen }" :audio="audio" :watch-together="watchTogether" />
    </div>
    </div>
    </Teleport>
    <YouTubeTv :audio="audio" />
    <!-- 同一個帳號在別的裝置／分頁上線了：這裡已經被踢下線 -->
    <q-dialog :model-value="librarySocket.replaced.value" persistent>
      <div class="pixel-panel w-[min(22rem,calc(100vw-2rem))] px-5 py-4 text-center">
        <p class="!mb-1 text-2xl">📱💻</p>
        <p class="!mb-1 text-sm font-black">{{ t.librarySocket.replacedTitle }}</p>
        <p class="!mb-3 text-xs leading-relaxed text-[color:var(--px-muted)]">{{ t.librarySocket.replacedBody }}</p>
        <button type="button" class="pixel-btn pixel-btn--primary h-10 px-5 text-sm" @click="librarySocket.resumeHere()">{{ t.librarySocket.resumeHere }}</button>
      </div>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { onBeforeRouteLeave } from 'vue-router';
import { usePomodoroStore } from 'src/stores/pomodoro';
import { useQuasar } from 'quasar';
import { useAmbientAudio, type SoundscapeKind } from 'src/pages/index/composables/useAmbientAudio';
import AmbientAudioPlayer from 'src/pages/index/components/AmbientAudioPlayer.vue';
import YouTubeTv from 'src/pages/index/components/YouTubeTv.vue';
import WatchTogetherBar from 'src/pages/index/components/WatchTogetherBar.vue';
import { useWatchTogether } from 'src/pages/index/composables/useWatchTogether';
import { useDisplayName } from 'src/composables/useDisplayName';
import RiverParkScene from 'src/pages/index/components/RiverParkScene.vue';
import BeitouScene from 'src/pages/index/components/BeitouScene.vue';
import HomeScene from 'src/pages/index/components/HomeScene.vue';
import FriendsPanel from 'src/pages/index/components/FriendsPanel.vue';
import SceneTransition from 'src/pages/index/components/SceneTransition.vue';
import { playTransition, transition } from 'src/pages/index/sceneTransition';
import LoginDialog from 'src/pages/index/components/LoginDialog.vue';
import { useAccount } from 'src/composables/useAccount';
import { useFriends, type FriendHome } from 'src/composables/useFriends';
import { buildShareLink, forgetScene, takeSavedScene, takeSharedLocation } from 'src/pages/index/shareLocation';
import FloorTabs, { type FloorTabItem } from 'src/pages/index/components/FloorTabs.vue';
import ZoneTabs, { type ZoneTabItem } from 'src/pages/index/components/ZoneTabs.vue';
import { enterSceneFullscreen, exitSceneFullscreen, sceneFullscreen, sceneNeedsBarGap, sceneRotated } from 'src/pages/index/composables/sceneFullscreen';
import SeatScenePixel from 'src/pages/index/components/SeatScenePixel.vue';
import F1Scene from 'src/pages/index/components/F1Scene.vue';
import F1HubScene from 'src/pages/index/components/F1HubScene.vue';
import MiaokouScene from 'src/pages/index/components/MiaokouScene.vue';
import CityScene from 'src/pages/index/components/CityScene.vue';
import { CITIES } from 'src/pages/index/pixel/cities';
import { CITY_ORDER, CITY_SEAT_COUNT, isCityId, type CityId } from 'src/pages/index/pixel/city';
import ShilinScene from 'src/pages/index/components/ShilinScene.vue';
import ZooScene from 'src/pages/index/components/ZooScene.vue';
import GrandPrixScene from 'src/pages/index/components/GrandPrixScene.vue';
import { CIRCUITS, GP_ORDER } from 'src/pages/index/pixel/circuits';
import type { GpSceneId, SceneId } from 'src/pages/index/sceneRemotes';
import { BEITOU_SEAT_COUNT, BEITOU_SEAT_START, F1_SEAT_COUNT, F1_SEAT_START, GP_SEAT_COUNT, GP_SEAT_START, HUB_SEAT_COUNT, HUB_SEAT_START, LIBRARY_SEATS, MIAOKOU_SEAT_COUNT, MIAOKOU_SEAT_START, PARK_SEAT_COUNT, PARK_SEAT_START, SEATS_PER_ZONE, SHILIN_SEAT_COUNT, SHILIN_SEAT_START, ZOO_SEAT_COUNT, ZOO_SEAT_START, citySeatStart, type Area } from 'src/pages/index/pixel/pixelMap';
import SeatGrid, { type Seat } from 'src/pages/index/components/SeatGrid.vue';
import FocusClockPanel from 'src/pages/index/components/FocusClockPanel.vue';
import { useLibrarySocket, buildSeatId } from 'src/pages/index/composables/useLibrarySocket';
import {
  getHeatColor as getHeatColorHelper,
  getZoneHeatTextClass as getZoneHeatTextClassHelper,
  getFloorLoadLevel as getFloorLoadLevelHelper,
  getFloorLoadLabelClass as getFloorLoadLabelClassHelper,
  formatTime as formatTimeHelper,
} from 'src/pages/index/functions/uiHelpers';
import { useLocale } from 'src/composables/useLocale';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { GROUP_FOCUS_S, groupPhaseAt } from 'src/composables/groupFocus';
import { requestNotifyPermission, sendFocusNotification } from 'src/composables/focusNotify';
const $q = useQuasar();
const { t, locale } = useLocale();
const playerPrefs = usePlayerPrefs();

const store = usePomodoroStore();
const DEFAULT_ZONE_CAPACITY = SEATS_PER_ZONE;

// --- 狀態控制 ---
// 進站時如果本地記得上一次選的座位，樓層/分區直接從那裡帶入，這樣
// onMounted 的第一次 reconnectRoomSession 抓的就是正確的房間快照，不用
// 再多一次樓層切換。`loadLastSeat` 是下面定義的 function declaration，
// 因為會 hoist 所以這裡可以先用。
// 最後所在的樓層／分區優先：走樓梯去別層逛、沒坐下就關掉，下次也回到那一層
// （這兩個 key 要宣告在這裡：下面馬上就要讀，宣告在後面的話讀的時候會出錯、被 try/catch 吃掉，等於永遠讀不到）
const LAST_SEAT_KEY = 'focus_island_last_seat_v1';
const LAST_LOCATION_KEY = 'focus_island_last_location_v1';
// 朋友分享的位置連結：直接到那一層、那一區、那張地圖，站在他旁邊（圖書館一帶的話把「上次站的位置」改成他旁邊，場景載入時就會站過去）
const sharedLocation = takeSharedLocation();
// 朋友的連結帶去圖書館：上次記的獨立地圖作廢
if (sharedLocation?.scene === 'library') forgetScene();
if (sharedLocation?.scene === 'library') {
  try {
    localStorage.setItem(
      'focus_island_player_position_v1',
      JSON.stringify({ room: `${sharedLocation.floor}-${sharedLocation.zoneId}`, x: sharedLocation.x + 1, y: sharedLocation.y, facing: 'left', seated: false }),
    );
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}
const initialLastSeat = loadLastSeat();
const initialLocation = loadLastLocation();
// 從分享連結進來的樓層／分區要馬上記住，不然重新整理會回到更早記的那一層
if (sharedLocation) saveLastLocation(sharedLocation.floor, sharedLocation.zoneId);
const currentFloor = ref(sharedLocation?.floor ?? initialLocation?.floor ?? initialLastSeat?.floor ?? 2);
const activeZoneId = ref(sharedLocation?.zoneId ?? initialLocation?.zoneId ?? initialLastSeat?.zoneId ?? 'A');
const isLoading = ref(false);
const selectedSeatId = ref<string | null>(null);
const isShake = ref(false);
// WebGL 不可用（或建立 renderer 失敗）時退回 2D 座位格子
const useCanvasScene = ref(true);
const sceneShellRef = ref<HTMLElement | null>(null);
const sceneRotorRef = ref<HTMLElement | null>(null);
// 全螢幕時底部的計時／音樂預設收起來，點一下展開
const dockCollapsed = ref(true);
// 手機版：樓層／分區分頁、音樂列平常收起來，讓地圖最大
const mobileNavOpen = ref(false);
const mobileAudioOpen = ref(false);
// 選好分區就收起來
watch(activeZoneId, () => {
  mobileNavOpen.value = false;
});
function toggleSceneFullscreen() {
  if (sceneFullscreen.value) void exitSceneFullscreen();
  else if (sceneShellRef.value) void enterSceneFullscreen(sceneShellRef.value);
}
const isSwitching = ref(false);

// 很早的版本存的是「使用者_123」這種含中文的 ID，後端只收英數、底線、減號（拿不到連線權杖）：不合格就換一個新的
const storedUserId = localStorage.getItem('lib_uid');
const userId = ref(storedUserId && /^[A-Za-z0-9_-]{1,64}$/.test(storedUserId) ? storedUserId : createRandomId('user'));
localStorage.setItem('lib_uid', userId.value);

// 名字：衣櫃、設定頁也改得到（共用一份）
const nameApi = useDisplayName();
nameApi.ensureDefault(userId.value);
const displayName = nameApi.displayName;

// --- 背景音樂 ---
const audio = useAmbientAudio(() => store.isRunning);

const autoRestartOnFinish = ref(false);
const focusDurationOptions = [15, 25, 50] as const;
type FocusDurationOption = (typeof focusDurationOptions)[number];

const selectedFocusDurationMinutes = computed(() => Math.round(store.baseDuration / 60));

function handleFocusDurationSelect(minutes: number) {
  if (!focusDurationOptions.includes(minutes as FocusDurationOption)) return;

  if (store.isRunning) {
    $q.notify({
      message: t.value.indexPage.notifyDurationLocked,
      color: 'warning',
      icon: 'timer_off',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  if (selectedFocusDurationMinutes.value === minutes) return;
  clearResumeCandidate();
  store.setDuration(minutes);
  saveFocusPreferences();
}

const FOCUS_PREFS_KEY = 'focus_island_focus_prefs_v1';
const CURRENT_ROOM_INFO_KEY = 'focus_island_current_room_info_v1';

// --- 上次選的座位（跨次造訪記住座位偏好） ---

type LastSeatPayload = {
  seatId: string;
  floor: number;
  zoneId: string;
};

function loadLastSeat(): LastSeatPayload | null {
  try {
    const raw = localStorage.getItem(LAST_SEAT_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<LastSeatPayload>;
    const floor = Number(parsed.floor);
    const zoneId = String(parsed.zoneId || '');
    const seatId = String(parsed.seatId || '');

    if (!Number.isFinite(floor) || floor <= 0 || !zoneId || !seatId) return null;

    return { floor, zoneId, seatId };
  } catch {
    return null;
  }
}

function saveLastSeat(seatId: string, floor: number, zoneId: string) {
  try {
    const payload: LastSeatPayload = { seatId, floor, zoneId };
    localStorage.setItem(LAST_SEAT_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

// --- 最後所在的樓層與分區（不管有沒有坐下，換層／換區就記） ---

type LastLocationPayload = {
  floor: number;
  zoneId: string;
};

function loadLastLocation(): LastLocationPayload | null {
  try {
    const raw = localStorage.getItem(LAST_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LastLocationPayload>;
    const floor = Number(parsed.floor);
    const zoneId = String(parsed.zoneId || '');
    if (!Number.isFinite(floor) || floor <= 0 || !zoneId) return null;
    return { floor, zoneId };
  } catch {
    return null;
  }
}

function saveLastLocation(floor: number, zoneId: string) {
  try {
    const payload: LastLocationPayload = { floor, zoneId };
    localStorage.setItem(LAST_LOCATION_KEY, JSON.stringify(payload));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

// --- 入座狀態 flag ---
const IS_SEATED_FLAG_KEY = 'focus_island_is_seated_v1';
const TAB_ID_SESSION_KEY = 'focus_island_tab_id_v1';
const RESUME_CANDIDATE_KEY = 'focus_island_resume_candidate_v1';
const RESUME_CANDIDATE_TTL_MS = 20_000;

type SeatedFlagPayload = {
  tabId: string;
  userId: string;
  updatedAt: number;
};

type ResumeCandidatePayload = {
  userId: string;
  seatId: string;
  floor: number;
  zoneId: string;
  timeLeft: number;
  baseDuration: number;
  expiresAt: number;
};

const resumeCandidate = ref<ResumeCandidatePayload | null>(null);

function createRandomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

function getOrCreateTabId() {
  try {
    const existing = sessionStorage.getItem(TAB_ID_SESSION_KEY);
    if (existing) return existing;
    const next = createRandomId('tab');
    sessionStorage.setItem(TAB_ID_SESSION_KEY, next);
    return next;
  } catch {
    // fallback for restricted storage environments
    return createRandomId('tab_fallback');
  }
}

const currentTabId = getOrCreateTabId();

function parseSeatedPayload(raw: string | null): SeatedFlagPayload | null {
  if (!raw) return null;

  try {
    // backward compatibility: old payload used plain '1'/'0'
    if (raw === '1') {
      return {
        tabId: 'legacy',
        userId: userId.value,
        updatedAt: Date.now(),
      };
    }

    const parsed = JSON.parse(raw) as Partial<SeatedFlagPayload>;
    if (
      typeof parsed.tabId !== 'string' ||
      typeof parsed.userId !== 'string' ||
      typeof parsed.updatedAt !== 'number'
    ) {
      return null;
    }
    return {
      tabId: parsed.tabId,
      userId: parsed.userId,
      updatedAt: parsed.updatedAt,
    };
  } catch {
    return null;
  }
}

function setSeatedFlag(value: boolean) {
  try {
    if (value) {
      const payload: SeatedFlagPayload = {
        tabId: currentTabId,
        userId: userId.value,
        updatedAt: Date.now(),
      };
      localStorage.setItem(IS_SEATED_FLAG_KEY, JSON.stringify(payload));
      return;
    }

    const existing = parseSeatedPayload(localStorage.getItem(IS_SEATED_FLAG_KEY));
    if (!existing || existing.tabId === currentTabId) {
      localStorage.removeItem(IS_SEATED_FLAG_KEY);
    }
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

function clearSeatedFlag() {
  try {
    const existing = parseSeatedPayload(localStorage.getItem(IS_SEATED_FLAG_KEY));
    if (!existing || existing.tabId === currentTabId) {
      localStorage.removeItem(IS_SEATED_FLAG_KEY);
    }
  } catch {
    // ignore
  }
}

function clearResumeCandidate() {
  resumeCandidate.value = null;
  try {
    localStorage.removeItem(RESUME_CANDIDATE_KEY);
  } catch {
    // ignore
  }
}

function saveResumeCandidate() {
  if (!store.isRunning || !selectedSeatId.value) return;

  const payload: ResumeCandidatePayload = {
    userId: userId.value,
    seatId: selectedSeatId.value,
    floor: currentFloor.value,
    zoneId: activeZoneId.value,
    timeLeft: Math.max(1, Math.floor(store.timeLeft)),
    baseDuration: Math.max(60, Math.floor(store.baseDuration)),
    expiresAt: Date.now() + RESUME_CANDIDATE_TTL_MS,
  };

  resumeCandidate.value = payload;
  try {
    localStorage.setItem(RESUME_CANDIDATE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

function loadResumeCandidate() {
  try {
    const raw = localStorage.getItem(RESUME_CANDIDATE_KEY);
    if (!raw) {
      resumeCandidate.value = null;
      return;
    }

    const parsed = JSON.parse(raw) as Partial<ResumeCandidatePayload>;
    const normalized: ResumeCandidatePayload = {
      userId: String(parsed.userId || ''),
      seatId: String(parsed.seatId || ''),
      floor: Number(parsed.floor || 0),
      zoneId: String(parsed.zoneId || ''),
      timeLeft: Number(parsed.timeLeft || 0),
      baseDuration: Number(parsed.baseDuration || 0),
      expiresAt: Number(parsed.expiresAt || 0),
    };

    const isValid =
      normalized.userId === userId.value &&
      normalized.seatId.length > 0 &&
      Number.isFinite(normalized.floor) &&
      normalized.floor > 0 &&
      normalized.zoneId.length > 0 &&
      Number.isFinite(normalized.timeLeft) &&
      normalized.timeLeft > 0 &&
      Number.isFinite(normalized.baseDuration) &&
      normalized.baseDuration >= 60 &&
      Number.isFinite(normalized.expiresAt) &&
      normalized.expiresAt > Date.now();

    if (!isValid) {
      clearResumeCandidate();
      return;
    }

    resumeCandidate.value = normalized;
  } catch {
    clearResumeCandidate();
  }
}

const resumeCandidateLabel = computed(() => {
  const candidate = resumeCandidate.value;
  if (!candidate) return '';
  const remain = Math.max(1, Math.floor((candidate.expiresAt - Date.now()) / 1000));
  return t.value.indexPage.resumeCandidateLabel(formatTimeHelper(candidate.timeLeft), remain);
});

async function resumePreviousFocus() {
  const candidate = resumeCandidate.value;
  if (!candidate) return;

  if (candidate.expiresAt <= Date.now()) {
    clearResumeCandidate();
    $q.notify({
      message: t.value.indexPage.notifyResumeExpired,
      color: 'warning',
      icon: 'schedule',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  if (candidate.floor !== currentFloor.value || candidate.zoneId !== activeZoneId.value) {
    currentFloor.value = candidate.floor;
    activeZoneId.value = candidate.zoneId;
    await reconnectRoomSession();
  }

  if (librarySocket.getMateAtSeat(candidate.seatId)) {
    clearResumeCandidate();
    $q.notify({
      message: t.value.indexPage.notifySeatTakenResume,
      color: 'negative',
      icon: 'event_busy',
      timeout: 1800,
      position: 'top',
    });
    return;
  }

  selectedSeatId.value = candidate.seatId;
  store.baseDuration = Math.max(60, Math.floor(candidate.baseDuration));
  store.timeLeft = Math.min(store.baseDuration, Math.max(1, Math.floor(candidate.timeLeft)));

  clearResumeCandidate();
  toggleFocus('auto');
}

// When other tabs update resume candidate, reload it locally.
// We intentionally no longer auto-stop the timer when other tabs change seat flags,
// to allow multiple tabs to run focus concurrently.
window.addEventListener('storage', (e: StorageEvent) => {
  try {
    if (e.key === RESUME_CANDIDATE_KEY) {
      loadResumeCandidate();
    }
  } catch {
    // ignore
  }
});

function isMobileDevice() {
  try {
    return /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent);
  } catch {
    return false;
  }
}

// 頁面卸載或隱藏時清除 flag，避免 stale lock（mobile 尤其要處理）
window.addEventListener('beforeunload', () => {
  try {
    if (store.isRunning) clearSeatedFlag();
  } catch {
    // ignore
  }
});

window.addEventListener('pagehide', () => {
  try {
    if (store.isRunning) clearSeatedFlag();
  } catch {
    // ignore
  }
});

window.addEventListener('visibilitychange', () => {
  try {
    if (document.visibilityState === 'hidden' && isMobileDevice()) {
      if (store.isRunning) clearSeatedFlag();
    }
  } catch {
    // ignore
  }
});

function syncCurrentRoomInfo() {
  const payload = {
    roomID: librarySocket.roomID.value,
    roomName: librarySocket.currentZone.value?.name || `Zone ${activeZoneId.value}`,
    zoneDescription: librarySocket.currentZone.value?.description || '',
  };

  localStorage.setItem(CURRENT_ROOM_INFO_KEY, JSON.stringify(payload));
  window.dispatchEvent(new CustomEvent('focus-room-updated', { detail: payload }));
}

function onSeatStolen() {
  isShake.value = true;
  selectedSeatId.value = null;
  setTimeout(() => {
    isShake.value = false;
  }, 500);
}

function onSelfLeave() {
  try {
    clearSeatedFlag();
    if (store.isRunning) store.stopTimer();
  } catch {
    // ignore
  }
}

const librarySocket = useLibrarySocket({
  userId,
  sessionId: currentTabId,
  displayName,
  currentFloor,
  activeZoneId,
  selectedSeatId,
  isLoading,
  quasar: $q,
  onSelfLeave,
  onSeatStolen,
  debugSeatIdSync: import.meta.env.DEV,
});

// 收到悄悄話：關掉了、開勿擾、或封鎖了這個人就不顯示
watch(
  () => librarySocket.lastWhisper.value,
  (w) => {
    if (!w || playerPrefs.value.whispersOff || playerPrefs.value.doNotDisturb || playerPrefs.value.blocked.includes(w.fromUserId)) return;
    $q.notify({ message: t.value.seatScene.whisperFrom(w.name, t.value.seatScene.whispers[w.phrase]), color: 'deep-purple-6', position: 'top', timeout: 4000 });
  },
);

// --- 核心邏輯：熱度顏色判斷 ---
function getHeatColor(percent: number) {
  return getHeatColorHelper(percent);
}

function getZoneHeatTextClass(occupancyStr: string) {
  return getZoneHeatTextClassHelper(occupancyStr);
}

const floorLoadLabels: Record<ReturnType<typeof getFloorLoadLevelHelper>, () => string> = {
  high: () => t.value.common.loadHigh,
  medium: () => t.value.common.loadMedium,
  low: () => t.value.common.loadLow,
};

const floorTabItems = computed<FloorTabItem[]>(() =>
  librarySocket.floorHeatData.value.map((f) => {
    const percent = librarySocket.getFloorLoadPercent(f);
    return {
      floor: f.floor,
      occupancy: f.occupancy,
      capacity: f.capacity,
      percent,
      heatClass: getHeatColor(percent),
      label: floorLoadLabels[getFloorLoadLevelHelper(percent)](),
      labelClass: getFloorLoadLabelClassHelper(percent, currentFloor.value === f.floor),
    };
  }),
);

const zoneTabItems = computed<ZoneTabItem[]>(() =>
  librarySocket.floorZones.value.map((zone) => ({
    id: zone.id,
    name: zone.name,
    occupancy: zone.occupancy,
    heatTextClass: getZoneHeatTextClass(zone.occupancy),
  })),
);

// --- 座位生成與同步模擬 ---
const currentSeats = computed(() => {
  const prefix = `${currentFloor.value}-${activeZoneId.value.toUpperCase()}`;
  const currentZoneConfig = librarySocket.floorZones.value.find((zone) => zone.id === activeZoneId.value);
  const seatCount = currentZoneConfig?.capacity || DEFAULT_ZONE_CAPACITY;
  return Array.from({ length: seatCount }, (_, i) => ({
    id: buildSeatId(currentFloor.value, activeZoneId.value, i + 1),
    icon: i % 3 === 0 ? '📚' : i % 3 === 1 ? '💻' : '✍️',
    available: (() => {
      const seatId = `${prefix}-${String(i + 1).padStart(2, '0')}`;
      const snapshot = librarySocket.seatSnapshotMap.value[seatId];
      const status = snapshot?.status ?? 'AVAILABLE';
      const isMySeat = snapshot?.userId === userId.value || selectedSeatId.value === seatId;
      return status === 'AVAILABLE' || isMySeat;
    })(),
  }));
});

function saveFocusPreferences() {
  localStorage.setItem(
    FOCUS_PREFS_KEY,
    JSON.stringify({
      autoRestartOnFinish: autoRestartOnFinish.value,
      focusDurationMinutes: selectedFocusDurationMinutes.value,
    }),
  );
}

function loadFocusPreferences() {
  const raw = localStorage.getItem(FOCUS_PREFS_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as {
      autoRestartOnFinish?: boolean;
      focusDurationMinutes?: number;
    };
    autoRestartOnFinish.value = parsed.autoRestartOnFinish ?? false;

    if (
      typeof parsed.focusDurationMinutes === 'number' &&
      focusDurationOptions.includes(parsed.focusDurationMinutes as FocusDurationOption)
    ) {
      store.setDuration(parsed.focusDurationMinutes);
    }
  } catch {
    // ignore invalid stored payload
  }
}

// 打開通知時順便要權限（一定要在點擊當下要）；被拒絕就關回去
async function handleNotificationsToggle(on: boolean) {
  if (!on) {
    playerPrefs.value.notifications = false;
    return;
  }
  const granted = await requestNotifyPermission();
  playerPrefs.value.notifications = granted;
  if (!granted) {
    $q.notify({ message: t.value.focusClockPanel.notifyDenied, color: 'warning', icon: 'notifications_off', position: 'top', timeout: 3000 });
  }
}

// 場景在哪：圖書館那張大地圖，或從 F1 站過去的 F1 賽車場（獨立地圖）
// 重新整理時：分享連結優先，不然回到上次所在的獨立地圖
const account = useAccount();
// 重整前在自己家、但已經登出了：回圖書館
const savedScene = takeSavedScene();
type SceneLoc = 'library' | SceneId;
const sceneLocation = ref<SceneLoc>(
  sharedLocation?.scene ?? (savedScene === 'home' && !account.session.value ? null : savedScene) ?? 'library',
);
// 從哪張地圖回家的，出門就回那裡
const homeReturnTo = ref<Exclude<SceneLoc, 'home'>>('library');
// 現在在哪條大獎賽（台北／台中／高雄），不在就是 null
const gpScene = computed<GpSceneId | null>(() => (GP_ORDER as string[]).includes(sceneLocation.value) ? (sceneLocation.value as GpSceneId) : null);
const racingScene = computed(() => sceneLocation.value === 'f1hub' || sceneLocation.value === 'f1' || gpScene.value !== null);
// 現在在哪個城市的指標地圖，不在就是 null
const cityScene = computed<CityId | null>(() => (isCityId(sceneLocation.value) ? sceneLocation.value : null));
function gpSeatStart(id: GpSceneId): number {
  return GP_SEAT_START + GP_ORDER.indexOf(id) * GP_SEAT_COUNT;
}
// F1 月台：從主地圖的 F1 站搭過去；從賽道回來時站在那條賽道的車門前
const hubFrom = ref<string | undefined>(undefined);
function goToHub(): void {
  hubFrom.value = undefined;
  sceneLocation.value = 'f1hub';
}
function backToHub(from: string): void {
  hubFrom.value = from;
  sceneLocation.value = 'f1hub';
}
const loginOpen = ref(false);
// 登入被伺服器判定失效：告訴他要重新登入（不要默默變成沒登入）
watch(
  () => account.sessionLost.value,
  (lost) => {
    if (lost) $q.notify({ message: t.value.home.sessionLost, color: 'warning', icon: 'logout', position: 'top', timeout: 5000 });
  },
);
// 正在朋友家（null = 在自己家）
const visitHome = ref<FriendHome | null>(null);
// 一起看 YouTube：同房間（同樓層同分區）才看得到彼此的分享；在家裡就是同一個家的人
const watchTogether = useWatchTogether({
  audio,
  socket: librarySocket,
  roomKey: () => (sceneLocation.value === 'home' ? `home:${visitHome.value?.profile.userId ?? 'mine'}` : `${currentFloor.value}-${activeZoneId.value}`),
  atHome: () => sceneLocation.value === 'home',
  onEnded: (name) => $q.notify({ message: t.value.watchTogether.ended(name), color: 'grey-8', position: 'top', timeout: 2500 }),
});
const friendsApi = useFriends();
// 去朋友家：先問後端拿他家的樣子（只有好友拿得到），自己家沒存的改動會先問
async function startVisit(code: string): Promise<void> {
  // 先拿到他家的樣子，拿不到就留在原地（不要先離開自己家）
  const home = await friendsApi.loadHome(code);
  if (!home) {
    $q.notify({ message: t.value.friends.loadFailed, color: 'warning', position: 'top', timeout: 2500 });
    return;
  }
  const go = () => {
    if (sceneLocation.value !== 'home') {
      librarySocket.sendPosition({ x: 0, y: 0, facing: 'down', moving: false, hidden: true });
      homeReturnTo.value = sceneLocation.value;
      visitFromMapScene.value = true;
      mobileNavOpen.value = false;
    }
    visitHome.value = home;
    sceneLocation.value = 'home';
  };
  if (homeSceneRef.value) homeSceneRef.value.guardThen(go);
  else go();
}
// 從地圖直接去朋友家的（不是從自己家出發）：離開朋友家直接回地圖
const visitFromMapScene = ref(false);
// 沒在家就不算在朋友家
watch(sceneLocation, (loc) => {
  if (loc !== 'home') {
    visitHome.value = null;
    visitFromMapScene.value = false;
  }
});
// 告訴伺服器我在誰的家（自己家＝我的帳號代號、朋友家＝他的），家裡的人才看得到彼此；出門就清掉
watch(
  [sceneLocation, visitHome, () => account.session.value],
  ([loc, visit, session]) => {
    const owner = loc !== 'home' || !session ? '' : visit ? visit.profile.userId : userId.value;
    librarySocket.sendHome(owner.startsWith('g_') ? owner : '');
  },
  { immediate: true },
);
// 登入了：背景抓一次好友清單（有人邀請你，家裡的好友鈕會有紅點）
if (account.session.value) onMounted(() => window.setTimeout(() => void friendsApi.refresh(), 3000));
const homeSceneRef = ref<(SceneHandle & { requestLeave: () => boolean; guardThen: (action: () => void) => void }) | null>(null);
// 換地圖的過場：還沒有人先叫過場（例如捷運面板），就依目的地自己挑一個
watch(sceneLocation, (to, from) => {
  if (transition.value && performance.now() - transition.value.startedAt < 300) return;
  if (to === 'home' || from === 'home') {
    playTransition('home', to === 'home' ? (visitHome.value ? `🏠 ${t.value.friends.visiting(visitHome.value.profile.name)}` : t.value.transition.home) : t.value.transition.goOut);
    return;
  }
  const names: Record<string, string> = {
    park: t.value.riverPark.title,
    beitou: t.value.beitou.title,
    f1: t.value.f1.title,
    f1hub: t.value.f1Hub.title,
    miaokou: t.value.miaokou.title,
    shilin: t.value.shilin.title,
    zoo: t.value.zoo.title,
    library: librarySocket.currentZone.value?.name ?? '',
    ...Object.fromEntries(CITY_ORDER.map((id) => [id, CITIES[id].title[locale.value]])),
    ...Object.fromEntries(GP_ORDER.map((id) => [id, CIRCUITS[id].title[locale.value]])),
  };
  const f1Line = to === 'f1' || to === 'f1hub' || (GP_ORDER as string[]).includes(to);
  const city = isCityId(to) ? CITIES[to] : isCityId(from) ? CITIES[from] : null;
  const cityLine = city ? ({ hsr: 'hsr', red: 'red', tra: 'blue' } as const)[city.line ?? 'hsr'] : null;
  playTransition('mrt', names[to] ?? '', { line: f1Line ? 'orange' : cityLine ?? (to === 'library' || to === 'shilin' || to === 'beitou' ? 'red' : to === 'miaokou' ? 'blue' : to === 'zoo' ? 'brown' : 'green') });
});
// 回到圖書館就不用再記獨立地圖
watch(sceneLocation, (location) => {
  if (location === 'library') forgetScene();
});
// 人在大地圖的哪一區，決定場景環境音（海浪、車流、夜市人聲…）
const sceneArea = ref<Area>('library');
// 四四南村：樹葉、鳥叫、蟬（晚上蟋蟀），跟動物園同一組
const SOUNDSCAPES: Record<Area, SoundscapeKind | null> = { library: null, beach: 'beach', taipei101: 'city', village: 'zoo', station: 'city' };
watch(
  [sceneLocation, sceneArea, () => useCanvasScene.value],
  ([location, , canvas], [previousLocation]) => {
    // 從 F1 回來時場景會重建，它只在區域跟預設不同時才回報，所以先歸零
    if (location === 'library' && previousLocation !== 'library') sceneArea.value = 'library';
    const racing = location === 'f1' || (GP_ORDER as string[]).includes(location);
    audio.setSoundscape(!canvas || location === 'park' || location === 'beitou' || location === 'home' || location === 'f1hub' ? null : racing ? 'f1' : location === 'miaokou' || location === 'shilin' ? 'market' : location === 'zoo' ? 'zoo' : isCityId(location) ? CITIES[location].soundscape : SOUNDSCAPES[sceneArea.value]);
  },
);
// 開始專注就回到圖書館的位子上
watch(
  () => store.isRunning,
  (running) => {
    // 在自己家的書桌前專注就留在家裡
    if (running && sceneLocation.value !== 'home') sceneLocation.value = seatScene(selectedSeatId.value) ?? 'library';
  },
);

// 座位編號落在哪一段，就是哪張獨立地圖的座位（F1 看台、環河公園、北投、F1 月台長椅、三條大獎賽的看台、廟口、士林、動物園）；圖書館那張回 null
function seatScene(seatId: string | null): Exclude<SceneLoc, 'library' | 'home'> | null {
  const n = Number(seatId?.split('-').pop());
  if (!Number.isFinite(n)) return null;
  const within = (start: number, count: number) => n > start && n <= start + count;
  if (within(F1_SEAT_START, F1_SEAT_COUNT)) return 'f1';
  if (within(PARK_SEAT_START, PARK_SEAT_COUNT)) return 'park';
  if (within(BEITOU_SEAT_START, BEITOU_SEAT_COUNT)) return 'beitou';
  if (within(HUB_SEAT_START, HUB_SEAT_COUNT)) return 'f1hub';
  if (within(MIAOKOU_SEAT_START, MIAOKOU_SEAT_COUNT)) return 'miaokou';
  if (within(SHILIN_SEAT_START, SHILIN_SEAT_COUNT)) return 'shilin';
  if (within(ZOO_SEAT_START, ZOO_SEAT_COUNT)) return 'zoo';
  const city = CITY_ORDER.find((id) => within(citySeatStart(id), CITY_SEAT_COUNT));
  if (city) return city;
  return GP_ORDER.find((id) => within(gpSeatStart(id), GP_SEAT_COUNT)) ?? null;
}

// 上次坐的是獨立地圖的座位：一進來就回到那裡坐好
watch(
  () => selectedSeatId.value,
  (id) => {
    const loc = seatScene(id);
    if (loc) sceneLocation.value = loc;
  },
);

// ── 一起專注：每個整點、半點開始 25 分鐘，接著休息 5 分鐘 ──
const groupNow = ref(new Date());
const groupPhase = computed(() => groupPhaseAt(groupNow.value));
// 使用者在這一輪自己按了結束：這一輪就不再自動幫他開始
let groupSkippedRound = '';
let groupTimer: number | undefined;

const groupFocusCount = computed(
  () => librarySocket.readers.value.filter((r) => r.state === '專注').length + (store.isRunning ? 1 : 0),
);

const groupStatus = computed(() => {
  if (!playerPrefs.value.groupFocus) return '';
  const phase = groupPhase.value;
  const time = (d: Date) => d.toLocaleTimeString(locale.value, { hour: '2-digit', minute: '2-digit' });
  return phase.phase === 'focus'
    ? t.value.focusClockPanel.groupFocusing(groupFocusCount.value, time(new Date(phase.nextStart.getTime() - 5 * 60 * 1000)))
    : t.value.focusClockPanel.groupBreak(formatTimeHelper(phase.secondsLeft), time(phase.nextStart));
});

function tickGroupFocus() {
  groupNow.value = new Date();
  if (!playerPrefs.value.groupFocus || store.isRunning || !selectedSeatId.value) return;
  const phase = groupPhase.value;
  const round = phase.nextStart.toISOString();
  // 剩不到一分鐘就不加入了，等下一輪
  if (phase.phase !== 'focus' || phase.secondsLeft < 60 || groupSkippedRound === round) return;
  store.alignTimer(GROUP_FOCUS_S, phase.secondsLeft);
  toggleFocus('auto');
  if (playerPrefs.value.notifications) {
    sendFocusNotification(t.value.focusClockPanel.notifyGroupStartTitle, t.value.focusClockPanel.notifyGroupStartBody);
  }
}

watch(
  () => store.isRunning,
  (running, wasRunning) => {
    // 一起專注的一輪還沒結束就自己停掉：記下來，這一輪不再自動開始
    if (wasRunning && !running && store.timeLeft > 0 && playerPrefs.value.groupFocus) {
      groupSkippedRound = groupPhase.value.nextStart.toISOString();
    }
  },
);

watch(
  () => playerPrefs.value.groupFocus,
  (on) => {
    groupSkippedRound = '';
    if (on) tickGroupFocus();
  },
);

// 專注幣：每多專注 1 分鐘 +1（今天的分鐘數變多才算，換日歸零不會扣）
watch(
  () => store.todayFocusedMinutes,
  (now, before) => {
    // 只算番茄鐘跑著時多出來的那一分鐘（載入紀錄時數字跳上去不算）
    if (store.isRunning && now > before && now - before <= 2) playerPrefs.value.coins += now - before;
  },
);

// 今天專注的分鐘數變了：坐著的話重送一次，別人點你的名牌才看得到最新的數字
watch(
  () => store.todayFocusedMinutes,
  () => {
    if (selectedSeatId.value) librarySocket.sendMove(selectedSeatId.value, store.isRunning ? 'FOCUS' : 'READY');
  },
);

// 外觀或勿擾改了：坐著的話重送一次座位訊息，同房間的人才看得到
watch(
  () => [playerPrefs.value.hair, playerPrefs.value.shirt, playerPrefs.value.doNotDisturb],
  () => {
    if (selectedSeatId.value) librarySocket.sendMove(selectedSeatId.value, store.isRunning ? 'FOCUS' : 'READY');
  },
);

// 改名（在衣櫃或設定頁）：坐著的話馬上讓同房間的人看到新名字
watch(displayName, () => {
  if (selectedSeatId.value) {
    // 只是改名字，不代表使用者離開了專注狀態 —— 之前這裡寫死 'READY'，
    // 專注中改名會讓其他人看到你「假離座」。
    librarySocket.sendMove(selectedSeatId.value, store.isRunning ? 'FOCUS' : 'READY');
  }
});

async function reconnectRoomSession() {
  syncCurrentRoomInfo();
  await librarySocket.reconnectRoomSession();
}

const formattedTime = computed(() => {
  const m = Math.floor(store.timeLeft / 60);
  const s = store.timeLeft % 60;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
});

const selectedSeatLabel = computed(() => {
  if (store.isRunning && selectedSeatId.value)
    return `${displayName.value} @ ${selectedSeatId.value}`;
  return selectedSeatId.value
    ? t.value.indexPage.seatReserved(displayName.value, selectedSeatId.value)
    : t.value.indexPage.pickSeatFirst;
});

function selectSeat(id: string) {
  // 如果正在切換中，直接 return
  if (librarySocket.getMateAtSeat(id) || store.isRunning || isSwitching.value) return;

  // 標記切換中
  isSwitching.value = true;
  claimSeat(id);

  // 設定 500ms 後有下一次點擊
  setTimeout(() => {
    isSwitching.value = false;
  }, 500);
}

// 進站時的座位分配：優先坐回上次選的位置；如果那個位置現在有別人坐著（或
// 這是第一次來、沒有上次紀錄），就從目前這個分區裡隨機挑一個空位。只在
// onMounted 執行一次，手動切換樓層/分區不會觸發（那時使用者是自己在瀏覽，
// 不該幫他亂選位置）。
function autoAssignSeatOnLoad() {
  if (selectedSeatId.value || store.isRunning) return;

  // 一進來自動入座只挑圖書館裡的位子（戶外和 F1 的要自己走過去坐）
  const availableSeats = currentSeats.value.filter((seat, index) => seat.available && index < LIBRARY_SEATS);
  if (availableSeats.length === 0) return;

  const lastSeatId = initialLastSeat?.seatId ?? null;
  const canResumeLastSeat =
    lastSeatId !== null && availableSeats.some((seat) => seat.id === lastSeatId);

  if (canResumeLastSeat && lastSeatId) {
    selectSeat(lastSeatId);
    return;
  }

  const randomSeat = availableSeats[Math.floor(Math.random() * availableSeats.length)];
  if (!randomSeat) return;

  selectSeat(randomSeat.id);
}

function claimSeat(id: string) {
  selectedSeatId.value = id;
  saveLastSeat(id, currentFloor.value, activeZoneId.value);
  librarySocket.sendMove(id, 'READY');
}

// 在人現在所在的座位開始專注（場景決定是哪個；躺著就沿用原本保留的座位）
// seatForFocus 回傳座位 id、'lying'（躺著）或 null（不在座位上）
const pixelSceneRef = ref<SceneHandle | null>(null);
// 每張地圖都會回答：在哪個座位開始專注、我現在站在哪（分享位置用）
interface SceneHandle {
  seatForFocus: () => string | null;
  positionForShare: () => { x: number; y: number };
}
const f1SceneRef = ref<SceneHandle | null>(null);
const parkSceneRef = ref<SceneHandle | null>(null);
const beitouSceneRef = ref<SceneHandle | null>(null);
const hubSceneRef = ref<SceneHandle | null>(null);
const gpSceneRef = ref<SceneHandle | null>(null);
const miaokouSceneRef = ref<SceneHandle | null>(null);
const shilinSceneRef = ref<SceneHandle | null>(null);
const zooSceneRef = ref<SceneHandle | null>(null);
const citySceneRef = ref<SceneHandle | null>(null);
// 現在這張地圖的元件（問座位、分享位置用）
function activeScene(): SceneHandle | null {
  const loc = sceneLocation.value;
  if (loc === 'f1') return f1SceneRef.value;
  if (loc === 'park') return parkSceneRef.value;
  if (loc === 'beitou') return beitouSceneRef.value;
  if (loc === 'f1hub') return hubSceneRef.value;
  if (loc === 'miaokou') return miaokouSceneRef.value;
  if (loc === 'shilin') return shilinSceneRef.value;
  if (loc === 'zoo') return zooSceneRef.value;
  if (cityScene.value) return citySceneRef.value;
  if (gpScene.value) return gpSceneRef.value;
  if (loc === 'home') return homeSceneRef.value;
  return pixelSceneRef.value;
}
// 點牆上的電視時打開音樂設定裡的 YouTube 網址欄
const audioPlayerRef = ref<{ openYouTube: () => void } | null>(null);
// 回傳 false＝人不在座位上（走在路上、騎車、游泳），不該開始專注；2D 座位格子沒有「人在哪」，照舊用選好的座位
function claimSeatWhereIAm(): boolean {
  const scene = activeScene();
  if (!scene) return true;
  const spot = scene.seatForFocus();
  if (spot === 'lying') return true;
  if (!spot) return false;
  if (spot !== selectedSeatId.value && !librarySocket.getMateAtSeat(spot)) claimSeat(spot);
  return true;
}

function notifyNotSeated() {
  $q.notify({ message: sceneLocation.value === 'home' ? t.value.home.notSeated : t.value.indexPage.notifyNotSeated, color: 'warning', icon: 'event_seat', timeout: 2200, position: 'top' });
}

// 🏠 我的家：沒登入先登入；進去前先把自己在地圖上標成「不在這裡」
function goHome(): void {
  if (!account.session.value) {
    loginAction = 'home';
    loginOpen.value = true;
    return;
  }
  enterHome();
}

// 地圖上的「好友」：好友是跟著帳號的，沒登入先登入
const friendsOpen = ref(false);
let loginAction: 'home' | 'friends' = 'home';
function openFriends(): void {
  if (!account.session.value) {
    loginAction = 'friends';
    loginOpen.value = true;
    return;
  }
  friendsOpen.value = true;
}
function afterLogin(): void {
  if (loginAction === 'friends') friendsOpen.value = true;
  else enterHome();
}
// 從地圖直接去朋友家：回來時直接回到原本的地圖（不用先經過自己家）
function visitFromMap(code: string): void {
  friendsOpen.value = false;
  void startVisit(code);
}

function enterHome(): void {
  if (sceneLocation.value === 'home') return;
  librarySocket.sendPosition({ x: 0, y: 0, facing: 'down', moving: false, hidden: true });
  homeReturnTo.value = sceneLocation.value;
  mobileNavOpen.value = false;
  sceneLocation.value = 'home';
}

// 上方的「回地圖／搭車回去」：在家裡要先問有沒有沒存的（防呆）
function leaveScene(): void {
  // 在朋友家：從地圖來的回地圖，從自己家來的回自己家
  if (visitHome.value) {
    if (visitFromMapScene.value) sceneLocation.value = homeReturnTo.value;
    else visitHome.value = null;
    return;
  }
  if (sceneLocation.value === 'home') {
    if (homeSceneRef.value?.requestLeave() === false) return;
    sceneLocation.value = homeReturnTo.value;
    return;
  }
  sceneLocation.value = 'library';
}

// 分享我的位置：複製一條連結，朋友打開就會出現在我旁邊（手機用系統的分享選單）
async function shareMyLocation() {
  if (sceneLocation.value === 'home') {
    $q.notify({ message: t.value.home.noShareAtHome, color: 'warning', position: 'top', timeout: 2200 });
    return;
  }
  const scene = activeScene();
  const at = scene?.positionForShare() ?? { x: 16, y: 5.2 };
  const link = buildShareLink({ floor: currentFloor.value, zoneId: activeZoneId.value, scene: sceneLocation.value, x: at.x, y: at.y, name: displayName.value });
  const isTouch = window.matchMedia('(pointer: coarse)').matches;
  if (isTouch && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Focus Island', text: t.value.indexPage.shareText, url: link });
      return;
    } catch {
      // 使用者取消分享：退回複製連結
    }
  }
  try {
    await navigator.clipboard.writeText(link);
    $q.notify({ message: t.value.indexPage.shareCopied, color: 'positive', icon: 'link', timeout: 2600, position: 'top' });
  } catch {
    window.prompt(t.value.indexPage.shareManual, link);
  }
}

// --- 操作方法 ---
// how：'user' 是自己按的，人不在座位上就提示；'auto'（一起專注到點自動開始、接續上次的專注）照舊回到保留的座位
function toggleFocus(how: 'user' | 'auto' = 'user') {
  if (!store.isRunning && !claimSeatWhereIAm() && how === 'user') {
    notifyNotSeated();
    return;
  }
  // 在自己家的書桌前：不用圖書館的座位
  if (!selectedSeatId.value && !store.isRunning && sceneLocation.value !== 'home') {
    $q.notify({
      message: t.value.indexPage.notifyPickSeatFirst,
      color: 'warning',
      icon: 'event_seat',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  // Allow multiple tabs to run focus concurrently. Previously we blocked
  // entering focus when another tab held the seated flag; that caused
  // cross-tab issues. We no longer enforce a single-tab lock here.

  if (store.isRunning) {
    store.stopTimer();
    setSeatedFlag(false);
    clearResumeCandidate();
    if (audio.followFocusPlayback.value) {
      audio.stopPlayback();
    }
  } else {
    clearResumeCandidate();
    store.startTimer();
    setSeatedFlag(true);
    if (audio.followFocusPlayback.value) {
      void audio.startPlayback();
    }
  }
}

// 專注中離開座位：使用者在場景裡確認過了，結束這次專注
function endFocusToLeave() {
  if (store.isRunning) toggleFocus();
}

function resetFocusTimer() {
  store.resetTimer();
  if (audio.followFocusPlayback.value) {
    audio.stopPlayback();
  }
}

function restartFocusTimer() {
  if (!store.isRunning && !claimSeatWhereIAm()) {
    notifyNotSeated();
    return;
  }
  if (!selectedSeatId.value && !store.isRunning) {
    $q.notify({
      message: t.value.indexPage.notifyPickSeatToRestart,
      color: 'warning',
      icon: 'event_seat',
      timeout: 1600,
      position: 'top',
    });
    return;
  }

  store.resetTimer();
  store.startTimer();

  if (audio.followFocusPlayback.value) {
    void audio.startPlayback();
  }
}

function handleFocusFinished() {
  audio.stopPlayback();
  if (playerPrefs.value.notifications) {
    sendFocusNotification(
      t.value.indexPage.notifySessionComplete,
      playerPrefs.value.groupFocus ? t.value.focusClockPanel.notifyBreakBody : t.value.focusClockPanel.notifyDoneBody,
    );
  }

  // 一起專注時，下一輪由時鐘決定，不用自動重來
  if (autoRestartOnFinish.value && !playerPrefs.value.groupFocus) {
    store.resetTimer();
    store.startTimer();

    if (audio.followFocusPlayback.value) {
      void audio.startPlayback();
    }

    $q.notify({
      message: t.value.indexPage.notifyAutoRestarted,
      color: 'amber-9',
      icon: 'autorenew',
      timeout: 2200,
      position: 'top',
      classes: 'font-black tracking-tighter',
    });
    return;
  }

  // 結束後回到整輪的時間（25:00），不然停在 00:00、再按開始會倒數成負的
  store.resetTimer();
  $q.notify({
    message: t.value.indexPage.notifySessionComplete,
    color: 'positive',
    icon: 'task_alt',
    timeout: 2600,
    position: 'top',
    classes: 'font-black tracking-tighter',
  });
}

function seatButtonClass(seat: Seat) {
  // 我選的位子 + 切換中狀態
  if (selectedSeatId.value === seat.id) {
    return [
      'border-amber-400 bg-amber-400/20 shadow-[0_0_20px_rgba(251,191,36,0.2)] scale-105 z-10',
      isSwitching.value ? 'animate-pulse cursor-wait opacity-70' : '', // 顯示等待狀態
    ].join(' ');
  }

  if (!seat.available) return 'opacity-10 grayscale cursor-not-allowed border-transparent';

  const otherMate = librarySocket.getMateAtSeat(seat.id);
  if (otherMate) return 'border-teal-500/30 bg-teal-500/5 cursor-default';

  return 'border-slate-200 dark:!border-white/5 bg-slate-100 dark:!bg-white/5 hover:border-slate-200 dark:hover:!border-white/20 hover:bg-slate-100 dark:hover:!bg-white/10';
}

function formatTime(seconds: number): string {
  return formatTimeHelper(seconds);
}

watch([currentFloor, activeZoneId], ([, zone], [, previousZone]) => {
  saveLastLocation(currentFloor.value, activeZoneId.value);
  // 只有真的換到別的分區才換成那一區的音樂；開站、換樓層都保留你自己選的
  if (zone !== previousZone) audio.playZoneTrack(zone);
  isLoading.value = true;
  void reconnectRoomSession();
});

watch(
  [() => store.timeLeft, () => t.value],
  ([newTime]) => {
    // 專注中分頁標題顯示倒數；沒在專注就是網站名稱
    document.title = store.isRunning ? `⏳ ${formatTime(newTime)} ${t.value.indexPage.documentTitleFocused}` : t.value.indexPage.documentTitleIdle;
  },
  { immediate: true },
);

watch(
  () => store.isRunning,
  (isRunning, wasRunning) => {
    if (wasRunning && !isRunning && store.timeLeft <= 0) {
      handleFocusFinished();
    }
  },
);

watch(
  () => autoRestartOnFinish.value,
  () => {
    saveFocusPreferences();
  },
);

onMounted(() => {
  if (sharedLocation) {
    $q.notify({
      message: sharedLocation.name ? t.value.indexPage.arrivedNear(sharedLocation.name) : t.value.indexPage.arrivedGeneric,
      color: 'primary',
      icon: 'place',
      timeout: 3200,
      position: 'top',
    });
  }
  groupTimer = window.setInterval(tickGroupFocus, 1000);
  loadFocusPreferences();
  loadResumeCandidate();
  // 等第一次 reconnectRoomSession 把座位快照抓回來（seatSnapshotMap 才會有
  // 正確的佔用狀態）才能判斷上次的座位還在不在，所以自動選位接在它後面。
  void reconnectRoomSession().then(() => {
    autoAssignSeatOnLoad();
  });
  librarySocket.startFloorPollingTimer();
  document.addEventListener('visibilitychange', librarySocket.handleVisibilityChange);
});

let hasHandledPageLeaveCleanup = false;
function cleanupSessionOnPageLeave() {
  if (hasHandledPageLeaveCleanup) return;
  hasHandledPageLeaveCleanup = true;

  // 離開座位頁時，避免出現「已離座但計時仍在跑」
  saveResumeCandidate();
  if (store.isRunning) {
    store.stopTimer();
  }
  clearSeatedFlag();
  librarySocket.stopWebSocketConnection(true);
}

onBeforeRouteLeave(() => {
  cleanupSessionOnPageLeave();
});

onUnmounted(() => {
  window.clearInterval(groupTimer);
  cleanupSessionOnPageLeave();
  saveFocusPreferences();
  librarySocket.clearFloorPollingTimer();
  document.removeEventListener('visibilitychange', librarySocket.handleVisibilityChange);
});

watch(
  () => librarySocket.currentZone.value?.name,
  () => {
    syncCurrentRoomInfo();
  },
);

// --- Watchers & Lifecycle ---
</script>

<style scoped>
.scene-shell,
.scene-rotor {
  position: relative;
}
/* 全螢幕：蓋滿畫面（蓋過 Quasar 的 header 2000；對話框 6000、通知 9500 還是在上面） */
.scene-shell--fs {
  position: fixed;
  inset: 0;
  z-index: 3000;
  background: #1b1d26;
}
.scene-shell--fs .scene-rotor {
  position: absolute;
  inset: 0;
}
/* 手機直拿又鎖不了方向：整塊轉 90 度（順時針），手機往左轉就是正的 */
.scene-shell--fs .scene-rotor--rotated {
  inset: auto;
  top: 0;
  left: 100%;
  width: 100dvh;
  height: 100dvw;
  transform-origin: top left;
  transform: rotate(90deg);
}
/* 讓出 Safari 浮在最下面的網址列（只有直拿、地圖轉過來時；它在地圖的右邊） */
.scene-shell--fs .scene-rotor--rotated.scene-rotor--bar-gap {
  width: calc(100dvh - 72px);
}
.scene-shell--fs .scene-rotor > :deep(div:not(.fs-dock)),
.scene-shell--fs :deep(.scene-box) {
  height: 100% !important;
  min-height: 0 !important;
}
.fs-dock {
  position: absolute;
  left: 50%;
  bottom: 8px;
  z-index: 30;
  transform: translateX(-50%);
  width: max-content;
  max-width: calc(100% - 16px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}
.fs-dock__toggle {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
}
/* 地圖下面那行操作說明全螢幕時不用（會露在 Safari 網址列那條） */
.scene-shell--fs :deep(.scene-box + p) {
  display: none;
}
.scene-shell--fs :deep(.scene-box) {
  border-radius: 0;
  touch-action: none !important;
}
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.no-scrollbar {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.animate-spin-slow {
  animation: spin 12s linear infinite;
}
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

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
