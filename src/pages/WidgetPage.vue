<template>
  <div class="flex min-h-screen items-center justify-center bg-slate-950 p-3 pb-24 text-amber-50 sm:p-4 sm:pb-28">
    <div class="w-full max-w-sm">
      <FocusClockPanel
        :is-running="store.isRunning"
        :base-duration="store.baseDuration"
        :time-left="store.timeLeft"
        :formatted-time="formattedTime"
        :has-resume-candidate="false"
        resume-candidate-label=""
        selected-seat-label=""
        :focus-duration-options="focusDurationOptions"
        :selected-focus-duration-minutes="selectedFocusDurationMinutes"
        :auto-restart-on-finish="autoRestartOnFinish"
        :display-name="displayName"
        @toggle-focus="toggleFocus"
        @restart-focus-timer="restartFocusTimer"
        @reset-focus-timer="resetFocusTimer"
        @select-focus-duration="handleFocusDurationSelect"
        @update:auto-restart-on-finish="handleAutoRestartToggle"
        @apply-display-name="applyDisplayName"
      />
    </div>
  </div>

  <AmbientAudioPlayer :audio="audio" />
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Dark, useQuasar } from 'quasar';
import { usePomodoroStore } from 'src/stores/pomodoro';
import { useAmbientAudio } from 'src/pages/index/composables/useAmbientAudio';
import AmbientAudioPlayer from 'src/pages/index/components/AmbientAudioPlayer.vue';
import FocusClockPanel from 'src/pages/index/components/FocusClockPanel.vue';
import { formatTime } from 'src/pages/index/functions/uiHelpers';
import { useLocale } from 'src/composables/useLocale';

// Lightweight sibling of IndexPage.vue for iframe embedding elsewhere: same
// pomodoro store + ambient audio + FocusClockPanel, but none of the
// seat-map/WebSocket wiring — starting/restarting the timer here isn't
// gated on having a seat selected.
const $q = useQuasar();
const { t } = useLocale();

// MainLayout.vue is what normally calls Dark.set() (it's a light/dark
// toggle there) — this route skips MainLayout entirely, so without this
// Tailwind's `dark:` variant (scoped to body.body--dark, see app.scss)
// never activates and every dark: class throughout FocusClockPanel /
// AmbientAudioPlayer falls back to its light-mode look. This widget is
// meant for dark-themed host pages, so just force it on.
Dark.set(true);

const store = usePomodoroStore();

function createRandomId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2)}_${Date.now().toString(36)}`;
}

const userId = ref(localStorage.getItem('lib_uid') || createRandomId('user'));
localStorage.setItem('lib_uid', userId.value);

// Shares the 'lib_display_name' key with IndexPage.vue — same origin, so a
// name set on the full site (or in a previous widget session) carries over.
const displayName = ref(
  localStorage.getItem('lib_display_name') || `${t.value.indexPage.displayNameDefaultPrefix}${userId.value.slice(-4)}`,
);

const audio = useAmbientAudio(() => store.isRunning);

const autoRestartOnFinish = ref(false);
const focusDurationOptions = [15, 25, 50] as const;
type FocusDurationOption = (typeof focusDurationOptions)[number];

const selectedFocusDurationMinutes = computed(() => Math.round(store.baseDuration / 60));

const formattedTime = computed(() => formatTime(store.timeLeft));

// Shares the 'focus_island_focus_prefs_v1' key with IndexPage.vue — duration
// and auto-restart prefs stay in sync between the widget and the full site.
const FOCUS_PREFS_KEY = 'focus_island_focus_prefs_v1';

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

function handleAutoRestartToggle(value: boolean) {
  autoRestartOnFinish.value = value;
  saveFocusPreferences();
}

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
  store.setDuration(minutes);
  saveFocusPreferences();
}

function applyDisplayName(name: string) {
  displayName.value = name;
  localStorage.setItem('lib_display_name', name);
}

function toggleFocus() {
  if (store.isRunning) {
    store.stopTimer();
    if (audio.followFocusPlayback.value) {
      audio.stopPlayback();
    }
  } else {
    store.startTimer();
    if (audio.followFocusPlayback.value) {
      void audio.startPlayback();
    }
  }
}

function restartFocusTimer() {
  store.resetTimer();
  store.startTimer();
  if (audio.followFocusPlayback.value) {
    void audio.startPlayback();
  }
}

function resetFocusTimer() {
  store.resetTimer();
  if (audio.followFocusPlayback.value) {
    audio.stopPlayback();
  }
}

onMounted(() => {
  loadFocusPreferences();
});
</script>
