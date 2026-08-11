import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useLocale, type LocaleKey } from 'src/composables/useLocale';

export type AudioTrackKey = 'forest' | 'ocean' | 'silence' | 'lofi' | 'rain' | 'warm' | 'glow';

export interface AudioTrackMeta {
  name: Record<LocaleKey, string>;
  description: Record<LocaleKey, string>;
  icon: string;
  url: string;
  // 手動音量倍率，用來補償現有素材音檔本身大小聲不一致的問題。
  // 之後換成音量已經正規化過的音源，這個欄位應該可以整個拿掉。
  gain: number;
}

export const audioTracks: Record<AudioTrackKey, AudioTrackMeta> = {
  forest: {
    name: { 'zh-TW': '靜謐森林', 'en-US': 'Quiet Forest' },
    description: { 'zh-TW': '柔和樹葉感', 'en-US': 'Gentle rustling leaves' },
    icon: 'park',
    url: '/music/dany_photo-forestbirds-319791.mp3',
    gain: 0.12,
  },
  ocean: {
    name: { 'zh-TW': '深海艙', 'en-US': 'Deep Sea Cabin' },
    description: { 'zh-TW': '低頻潮汐感', 'en-US': 'Low tidal hum' },
    icon: 'waves',
    url: '/music/rmultimediaeu-ocean-waves-250310.mp3',
    gain: 0.14,
  },
  silence: {
    name: { 'zh-TW': '無聲', 'en-US': 'Silence' },
    description: { 'zh-TW': '關閉播放', 'en-US': 'Playback off' },
    icon: 'volume_off',
    url: '',
    gain: 0,
  },
  lofi: {
    name: { 'zh-TW': 'Lofi', 'en-US': 'Lofi' },
    description: { 'zh-TW': '暖色低保真', 'en-US': 'Warm lo-fi tone' },
    icon: 'music_note',
    url: '/music/alex-morgan-study-lofi-music-548638.mp3',
    gain: 0.11,
  },
  rain: {
    name: { 'zh-TW': '下雨聲', 'en-US': 'Rainfall' },
    description: { 'zh-TW': '細碎雨滴聲', 'en-US': 'Soft pattering rain' },
    icon: 'water_drop',
    url: '/music/liecio-light-rain-109591.mp3',
    gain: 0.11,
  },
  warm: {
    name: { 'zh-TW': '溫暖背景樂', 'en-US': 'Warm Ambience' },
    description: { 'zh-TW': '柔和氛圍感', 'en-US': 'Soft ambient warmth' },
    icon: 'graphic_eq',
    url: '/music/absolutesound-background-music-560443.mp3',
    gain: 0.11,
  },
  glow: {
    name: { 'zh-TW': '浮光', 'en-US': 'Glow' },
    description: { 'zh-TW': '空靈飄浮感', 'en-US': 'Airy, weightless feel' },
    icon: 'auto_awesome',
    url: '/music/paulyudin-background-background-music-574010.mp3',
    gain: 0.11,
  },
};

export const audioTrackOrder: AudioTrackKey[] = [
  'forest',
  'ocean',
  'lofi',
  'rain',
  'warm',
  'glow',
  'silence',
];

const AUDIO_PREFS_KEY = 'focus_island_audio_prefs_v1';
const FADE_DURATION_MS = 220;

type AudioPrefs = {
  selectedAudioTrack: AudioTrackKey;
  defaultAudioTrack: AudioTrackKey;
  audioVolume: number;
  followFocusPlayback: boolean;
  audioLoopEnabled: boolean;
  audioAutoPlayOnLoad: boolean;
};

function isTrackKey(value: unknown): value is AudioTrackKey {
  return typeof value === 'string' && value in audioTracks;
}

function normalizeVolume(value: unknown) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 80;
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Owns the ambient background audio player: track selection, volume/fade,
 * and playback prefs. `isFocusRunning` lets it decide whether "follow focus
 * playback" should auto-start/stop without importing the pomodoro store directly.
 */
export function useAmbientAudio(isFocusRunning: () => boolean) {
  const { locale } = useLocale();
  let audioElement: HTMLAudioElement | null = null;
  let fadeTaskId = 0;

  const selectedAudioTrack = ref<AudioTrackKey>('lofi');
  const audioVolume = ref(80);
  const lastVolumeBeforeMute = ref(80);
  const isAudioPlaying = ref(false);
  const defaultAudioTrack = ref<AudioTrackKey>('lofi');
  const followFocusPlayback = ref(true);
  const audioLoopEnabled = ref(true);
  const audioAutoPlayOnLoad = ref(false);

  const selectedAudioTrackMeta = computed(() => audioTracks[selectedAudioTrack.value]);
  const volumeIconName = computed(() => {
    if (audioVolume.value <= 0) return 'volume_off';
    if (audioVolume.value < 50) return 'volume_down';
    return 'volume_up';
  });

  function ensureAudioElement() {
    if (!audioElement) {
      audioElement = new Audio();
      audioElement.loop = audioLoopEnabled.value;
      audioElement.preload = 'auto';
      audioElement.crossOrigin = 'anonymous';
      audioElement.addEventListener('error', handleAudioPlaybackError);
    }
    return audioElement;
  }

  function saveAudioPreferences() {
    const payload: AudioPrefs = {
      selectedAudioTrack: selectedAudioTrack.value,
      defaultAudioTrack: defaultAudioTrack.value,
      audioVolume: audioVolume.value,
      followFocusPlayback: followFocusPlayback.value,
      audioLoopEnabled: audioLoopEnabled.value,
      audioAutoPlayOnLoad: audioAutoPlayOnLoad.value,
    };
    localStorage.setItem(AUDIO_PREFS_KEY, JSON.stringify(payload));
  }

  function loadAudioPreferences() {
    const raw = localStorage.getItem(AUDIO_PREFS_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as Partial<AudioPrefs>;
      if (isTrackKey(parsed.defaultAudioTrack)) {
        defaultAudioTrack.value = parsed.defaultAudioTrack;
      }

      if (isTrackKey(parsed.selectedAudioTrack)) {
        selectedAudioTrack.value = parsed.selectedAudioTrack;
      } else {
        selectedAudioTrack.value = defaultAudioTrack.value;
      }

      audioVolume.value = normalizeVolume(parsed.audioVolume);
      followFocusPlayback.value = parsed.followFocusPlayback ?? true;
      audioLoopEnabled.value = parsed.audioLoopEnabled ?? true;
      audioAutoPlayOnLoad.value = parsed.audioAutoPlayOnLoad ?? false;
    } catch {
      // ignore invalid stored payload
    }
  }

  function getTrackVolume(trackKey = selectedAudioTrack.value) {
    return (audioVolume.value / 100) * (audioTracks[trackKey]?.gain ?? 0);
  }

  function fadeAudioVolume(target: number, duration = FADE_DURATION_MS) {
    const player = audioElement;
    if (!player) return Promise.resolve();

    fadeTaskId += 1;
    const taskId = fadeTaskId;
    const from = player.volume;
    const start = performance.now();

    return new Promise<void>((resolve) => {
      const tick = (now: number) => {
        if (!audioElement || taskId !== fadeTaskId) {
          resolve();
          return;
        }

        const progress = Math.min(1, Math.max(0, (now - start) / duration));
        audioElement.volume = Math.min(1, Math.max(0, from + (target - from) * progress));

        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          resolve();
        }
      };

      requestAnimationFrame(tick);
    });
  }

  function shouldAutoPlayTrack() {
    return isAudioPlaying.value || (followFocusPlayback.value && isFocusRunning());
  }

  function handleAudioPlaybackError() {
    const fallbackOrder: AudioTrackKey[] = ['rain', 'forest', 'silence'];
    const fallback = fallbackOrder.find((key) => key !== selectedAudioTrack.value);

    if (!fallback) {
      stopPlayback();
      return;
    }

    selectedAudioTrack.value = fallback;
    saveAudioPreferences();

    if (fallback === 'silence') {
      stopPlayback();
    } else {
      void startPlayback();
    }

    return fallback;
  }

  function stopPlayback() {
    fadeTaskId += 1;
    if (audioElement) {
      try {
        audioElement.pause();
        audioElement.currentTime = 0;
      } catch {
        // ignore
      }
    }

    isAudioPlaying.value = false;
    updateMediaSessionPlaybackState();
  }

  // Registering a Media Session is what tells the OS "this tab is actively
  // playing audio" — it's what gets lock-screen playback controls on mobile,
  // and on Android in particular it's a big factor in whether a backgrounded
  // tab is allowed to keep playing at all instead of being suspended.
  function updateMediaSessionMetadata() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const track = audioTracks[selectedAudioTrack.value];
    if (!track || selectedAudioTrack.value === 'silence') {
      navigator.mediaSession.metadata = null;
      return;
    }

    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.name[locale.value],
      artist: 'Focus Island',
      album: track.description[locale.value],
    });
  }

  function updateMediaSessionPlaybackState() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = isAudioPlaying.value ? 'playing' : 'paused';
  }

  function setupMediaSessionActionHandlers() {
    if (typeof navigator === 'undefined' || !('mediaSession' in navigator)) return;

    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ['play', () => void startPlayback()],
      ['pause', () => stopPlayback()],
      ['stop', () => stopPlayback()],
    ];

    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // some actions aren't supported on every browser; safe to ignore
      }
    }
  }

  async function startPlayback() {
    const track = audioTracks[selectedAudioTrack.value];
    if (!track || selectedAudioTrack.value === 'silence' || !track.url) {
      stopPlayback();
      return;
    }

    const player = ensureAudioElement();
    player.loop = audioLoopEnabled.value;

    const targetVolume = getTrackVolume();
    const currentSrc = player.getAttribute('src') || '';
    const sourceChanged = currentSrc !== track.url;

    if (isAudioPlaying.value && sourceChanged) {
      await fadeAudioVolume(0);
      player.pause();
    }

    if (sourceChanged) {
      player.setAttribute('src', track.url);
      player.load();
    }

    player.volume = sourceChanged ? 0 : targetVolume;

    void player
      .play()
      .then(async () => {
        isAudioPlaying.value = true;
        updateMediaSessionMetadata();
        updateMediaSessionPlaybackState();
        if (sourceChanged) {
          await fadeAudioVolume(targetVolume);
        } else {
          player.volume = targetVolume;
        }
      })
      .catch(() => {
        isAudioPlaying.value = false;
      });
  }

  function switchTrack() {
    if (selectedAudioTrack.value === 'silence') {
      stopPlayback();
      updateMediaSessionMetadata();
      saveAudioPreferences();
      return;
    }

    if (shouldAutoPlayTrack()) {
      void startPlayback();
    } else {
      updateMediaSessionMetadata();
    }

    saveAudioPreferences();
  }

  function selectTrack(trackKey: AudioTrackKey) {
    selectedAudioTrack.value = trackKey;
    switchTrack();
  }

  function togglePlayback() {
    if (isAudioPlaying.value) {
      stopPlayback();
    } else {
      void startPlayback();
    }

    saveAudioPreferences();
  }

  function updateVolume() {
    if (audioVolume.value > 0) {
      lastVolumeBeforeMute.value = audioVolume.value;
    }

    if (audioElement) {
      audioElement.volume = getTrackVolume();
    }

    saveAudioPreferences();
  }

  function toggleMute() {
    if (audioVolume.value > 0) {
      lastVolumeBeforeMute.value = audioVolume.value;
      audioVolume.value = 0;
    } else {
      audioVolume.value = Math.max(20, lastVolumeBeforeMute.value || 80);
    }

    updateVolume();
  }

  watch(
    [selectedAudioTrack, defaultAudioTrack, followFocusPlayback, audioLoopEnabled, audioAutoPlayOnLoad],
    () => {
      if (audioElement) {
        audioElement.loop = audioLoopEnabled.value;
      }

      if (selectedAudioTrack.value === 'silence' && defaultAudioTrack.value !== 'silence') {
        selectedAudioTrack.value = defaultAudioTrack.value;
      }

      saveAudioPreferences();
    },
  );

  watch(
    () => defaultAudioTrack.value,
    () => {
      selectedAudioTrack.value = defaultAudioTrack.value;
      switchTrack();
    },
  );

  onMounted(() => {
    loadAudioPreferences();
    setupMediaSessionActionHandlers();
    updateMediaSessionMetadata();
    if (audioAutoPlayOnLoad.value && selectedAudioTrack.value !== 'silence') {
      void startPlayback();
    }
  });

  onUnmounted(() => {
    saveAudioPreferences();
    stopPlayback();
    if (audioElement) {
      audioElement.removeEventListener('error', handleAudioPlaybackError);
    }
    audioElement = null;
  });

  return {
    audioTracks,
    audioTrackOrder,
    selectedAudioTrack,
    audioVolume,
    isAudioPlaying,
    defaultAudioTrack,
    followFocusPlayback,
    audioLoopEnabled,
    audioAutoPlayOnLoad,
    selectedAudioTrackMeta,
    volumeIconName,
    startPlayback,
    stopPlayback,
    togglePlayback,
    updateVolume,
    toggleMute,
    selectTrack,
  };
}

export type AmbientAudio = ReturnType<typeof useAmbientAudio>;
