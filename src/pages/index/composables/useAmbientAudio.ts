import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useLocale, type LocaleKey } from 'src/composables/useLocale';
import { createSynthPlayer, type SynthKind, type SoundscapeKind } from 'src/pages/index/composables/synthAmbience';
import { useYouTubeTv } from 'src/pages/index/composables/useYouTubeTv';

export type AudioTrackKey = 'forest' | 'ocean' | 'silence' | 'lofi' | 'rain' | 'warm' | 'glow' | 'library' | 'blues' | 'classical' | 'beats' | 'chiptune' | 'youtube';
export type { SoundscapeKind };

export interface AudioTrackMeta {
  name: Record<LocaleKey, string>;
  description: Record<LocaleKey, string>;
  icon: string;
  url: string;
  // 有值時改用 Web Audio 即時合成，不載入 url 的音檔（見 synthAmbience.ts）。
  synth?: SynthKind;
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
    name: { 'zh-TW': '海浪', 'en-US': 'Ocean Waves' },
    description: { 'zh-TW': '一道道湧上岸的浪', 'en-US': 'Waves rolling onto the shore' },
    icon: 'waves',
    url: '',
    synth: 'ocean',
    gain: 0.3,
  },
  beats: {
    name: { 'zh-TW': '自習 Beats', 'en-US': 'Study Beats' },
    description: { 'zh-TW': '即時生成的 lofi：爵士和弦、鼓組、黑膠沙沙聲', 'en-US': 'Generated lo-fi: jazz chords, drums, vinyl crackle' },
    icon: 'headphones',
    url: '',
    synth: 'beats',
    gain: 0.17,
  },
  chiptune: {
    name: { 'zh-TW': '像素 8-bit', 'en-US': 'Pixel 8-bit' },
    description: { 'zh-TW': '跟地圖同款的 8-bit 小品，每次旋律都不同', 'en-US': '8-bit tunes to match the map, never the same twice' },
    icon: 'videogame_asset',
    url: '',
    synth: 'chiptune',
    gain: 0.14,
  },
  blues: {
    name: { 'zh-TW': '藍調', 'en-US': 'Blues' },
    description: { 'zh-TW': '慢速搖擺、電鋼琴與走動貝斯', 'en-US': 'Slow shuffle, electric piano, walking bass' },
    icon: 'nightlife',
    url: '',
    synth: 'blues',
    gain: 0.15,
  },
  classical: {
    name: { 'zh-TW': '古典鋼琴', 'en-US': 'Classical Piano' },
    description: { 'zh-TW': '巴哈風格的緩慢琶音', 'en-US': 'Slow Bach-style arpeggios' },
    icon: 'piano',
    url: '',
    synth: 'classical',
    gain: 0.26,
  },
  library: {
    name: { 'zh-TW': '圖書館', 'en-US': 'Library' },
    description: { 'zh-TW': '空調、翻書與遠處打字聲', 'en-US': 'Air-con hum, page turns, distant typing' },
    icon: 'local_library',
    url: '',
    synth: 'library',
    gain: 0.6,
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
    url: '',
    synth: 'rain',
    gain: 0.5,
  },
  warm: {
    name: { 'zh-TW': '溫暖背景樂', 'en-US': 'Warm Ambience' },
    description: { 'zh-TW': '柔和氛圍感', 'en-US': 'Soft ambient warmth' },
    icon: 'graphic_eq',
    url: '/music/absolutesound-background-music-560443.mp3',
    gain: 0.11,
  },
  // 不是音檔：在圖書館牆上的電視播自己貼的 YouTube（useYouTubeTv.ts）；gain 換算成 YouTube 的 0–100 音量
  youtube: {
    name: { 'zh-TW': 'YouTube', 'en-US': 'YouTube' },
    description: { 'zh-TW': '貼網址，在牆上的電視播', 'en-US': 'Paste a link, plays on the wall TV' },
    icon: 'smart_display',
    url: '',
    gain: 0.6,
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
  'library',
  'beats',
  'chiptune',
  'forest',
  'ocean',
  'rain',
  'lofi',
  'blues',
  'classical',
  'warm',
  'glow',
  'youtube',
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
  zoneSoundEnabled: boolean;
  sceneAmbienceEnabled: boolean;
  sceneAmbienceVolume: number;
};

// 換分區時自動換成符合場景的環境音
const ZONE_TRACKS: Record<string, AudioTrackKey> = { A: 'forest', B: 'beats', C: 'ocean', D: 'library' };

// 場景環境音各自的音量倍率（合成出來的響度不一樣）
const SOUNDSCAPE_GAIN: Record<SoundscapeKind, number> = { beach: 0.28, city: 0.5, market: 3, zoo: 3, f1: 1 };
// 音樂本身已經是同一種聲音時，就不再疊一層
const SOUNDSCAPE_SAME_AS: Partial<Record<SoundscapeKind, SynthKind>> = { beach: 'ocean' };

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
  const synthPlayer = createSynthPlayer();
  // 場景環境音是獨立的一層：有自己的音量，不受音樂播放／暫停影響
  const soundscapePlayer = createSynthPlayer();
  const youtube = useYouTubeTv();
  // 使用者在 YouTube 播放器裡自己按暫停／播放，也要反映到工具列
  youtube.onPlayingChange((playing) => {
    if (selectedAudioTrack.value !== 'youtube') return;
    isAudioPlaying.value = playing;
    updateMediaSessionPlaybackState();
  });
  let soundscape: SoundscapeKind | null = null;
  let userHasInteracted = false;
  let fadeTaskId = 0;

  const selectedAudioTrack = ref<AudioTrackKey>('lofi');
  const audioVolume = ref(80);
  const lastVolumeBeforeMute = ref(80);
  const isAudioPlaying = ref(false);
  const defaultAudioTrack = ref<AudioTrackKey>('lofi');
  const followFocusPlayback = ref(true);
  const audioLoopEnabled = ref(true);
  const audioAutoPlayOnLoad = ref(false);
  const zoneSoundEnabled = ref(true);
  const sceneAmbienceEnabled = ref(true);
  const sceneAmbienceVolume = ref(35);

  const selectedAudioTrackMeta = computed(() => audioTracks[selectedAudioTrack.value]);
  // 工具列上顯示的名字：YouTube 播過之後顯示影片標題
  const selectedTrackLabel = computed(() =>
    selectedAudioTrack.value === 'youtube' && youtube.title.value ? youtube.title.value : audioTracks[selectedAudioTrack.value].name[locale.value],
  );
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
      zoneSoundEnabled: zoneSoundEnabled.value,
      sceneAmbienceEnabled: sceneAmbienceEnabled.value,
      sceneAmbienceVolume: sceneAmbienceVolume.value,
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
      zoneSoundEnabled.value = parsed.zoneSoundEnabled ?? true;
      sceneAmbienceEnabled.value = parsed.sceneAmbienceEnabled ?? true;
      sceneAmbienceVolume.value = parsed.sceneAmbienceVolume === undefined ? 35 : normalizeVolume(parsed.sceneAmbienceVolume);
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
    const fallbackOrder: AudioTrackKey[] = ['lofi', 'forest', 'silence'];
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
    synthPlayer.stop();
    youtube.pause();
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
      title: selectedAudioTrack.value === 'youtube' && youtube.title.value ? youtube.title.value : track.name[locale.value],
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

  async function startSynthPlayback(kind: SynthKind) {
    youtube.pause();
    // 從 mp3 切過來：先淡出並停掉 <audio>，避免兩邊同時出聲
    if (audioElement && !audioElement.paused) {
      await fadeAudioVolume(0);
      audioElement.pause();
    }

    try {
      await synthPlayer.start(kind, getTrackVolume());
      isAudioPlaying.value = true;
      updateMediaSessionMetadata();
      updateMediaSessionPlaybackState();
    } catch {
      isAudioPlaying.value = false;
    }
  }

  // 實際有沒有在播由 YouTube 的狀態事件回報（onPlayingChange），這裡只負責開始
  function startYouTubePlayback() {
    synthPlayer.stop();
    if (audioElement && !audioElement.paused) audioElement.pause();
    youtube.setVolume(getTrackVolume() * 100);
    youtube.setLoop(audioLoopEnabled.value);
    if (!youtube.play()) {
      isAudioPlaying.value = false;
      return;
    }
    updateMediaSessionMetadata();
  }

  // 一起看：換到 YouTube、停掉其他音樂，載入別人分享的影片（autoplay=false＝對方暫停中，先停在那一秒）
  function playSharedYouTube(videoId: string, startSeconds: number, autoplay: boolean) {
    fadeTaskId += 1;
    synthPlayer.stop();
    if (audioElement && !audioElement.paused) audioElement.pause();
    if (selectedAudioTrack.value !== 'youtube') {
      selectedAudioTrack.value = 'youtube';
      saveAudioPreferences();
    }
    youtube.setVolume(getTrackVolume() * 100);
    youtube.setLoop(audioLoopEnabled.value);
    youtube.loadShared(videoId, startSeconds, autoplay);
    if (!autoplay) isAudioPlaying.value = false;
    updateMediaSessionMetadata();
    updateMediaSessionPlaybackState();
  }

  async function startPlayback() {
    const track = audioTracks[selectedAudioTrack.value];
    if (selectedAudioTrack.value === 'youtube') {
      startYouTubePlayback();
      return;
    }
    if (!track || selectedAudioTrack.value === 'silence' || (!track.url && !track.synth)) {
      stopPlayback();
      return;
    }

    if (track.synth) {
      await startSynthPlayback(track.synth);
      return;
    }

    if (synthPlayer.isPlaying) synthPlayer.stop();
    youtube.pause();
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

  // 使用者在設定裡改預設音源：順便換成那首。載入偏好時也會改到 defaultAudioTrack，
  // 所以不能用 watch，否則每次重新整理都會把你選的那首蓋成預設的
  function setDefaultTrack(trackKey: AudioTrackKey) {
    defaultAudioTrack.value = trackKey;
    selectTrack(trackKey);
  }

  // 有在播才換過去；沒在播就不動選項，不然之後按專注會播出不是自己選的那首
  function playZoneTrack(zoneId: string) {
    const track = ZONE_TRACKS[zoneId.toUpperCase()];
    // 自己貼的 YouTube 不會被分區音樂換掉
    if (!zoneSoundEnabled.value || !isAudioPlaying.value || !track || track === selectedAudioTrack.value) return;
    if (selectedAudioTrack.value === 'youtube') return;
    selectTrack(track);
  }

  // 依目前所在區域決定要不要有環境音；瀏覽器要等使用者互動過才准出聲
  function applySoundscape() {
    const musicSynth = isAudioPlaying.value ? audioTracks[selectedAudioTrack.value].synth : undefined;
    const wanted = sceneAmbienceEnabled.value && userHasInteracted && sceneAmbienceVolume.value > 0 ? soundscape : null;
    const duplicate = wanted !== null && musicSynth !== undefined && SOUNDSCAPE_SAME_AS[wanted] === musicSynth;
    const kind = duplicate ? null : wanted;
    if (!kind) {
      if (soundscapePlayer.isPlaying) soundscapePlayer.stop();
      return;
    }
    const volume = (sceneAmbienceVolume.value / 100) * SOUNDSCAPE_GAIN[kind];
    if (soundscapePlayer.isPlaying && soundscapePlayer.kind === kind) {
      soundscapePlayer.setVolume(volume);
      return;
    }
    void soundscapePlayer.start(kind, volume).catch(() => undefined);
  }

  function setSoundscape(kind: SoundscapeKind | null) {
    if (kind === soundscape) return;
    soundscape = kind;
    applySoundscape();
  }

  function handleFirstInteraction() {
    window.removeEventListener('pointerdown', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
    userHasInteracted = true;
    applySoundscape();
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
    synthPlayer.setVolume(getTrackVolume());
    if (selectedAudioTrack.value === 'youtube') youtube.setVolume(getTrackVolume() * 100);

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
    [selectedAudioTrack, defaultAudioTrack, followFocusPlayback, audioLoopEnabled, audioAutoPlayOnLoad, zoneSoundEnabled, sceneAmbienceEnabled, sceneAmbienceVolume],
    () => {
      if (audioElement) {
        audioElement.loop = audioLoopEnabled.value;
      }
      youtube.setLoop(audioLoopEnabled.value);

      if (selectedAudioTrack.value === 'silence' && defaultAudioTrack.value !== 'silence') {
        selectedAudioTrack.value = defaultAudioTrack.value;
      }

      saveAudioPreferences();
    },
  );

  watch([sceneAmbienceEnabled, sceneAmbienceVolume, isAudioPlaying, selectedAudioTrack], applySoundscape);
  watch(youtube.title, updateMediaSessionMetadata);


  onMounted(() => {
    loadAudioPreferences();
    setupMediaSessionActionHandlers();
    window.addEventListener('pointerdown', handleFirstInteraction);
    window.addEventListener('keydown', handleFirstInteraction);
    updateMediaSessionMetadata();
    if (audioAutoPlayOnLoad.value && selectedAudioTrack.value !== 'silence') {
      void startPlayback();
    }
  });

  onUnmounted(() => {
    saveAudioPreferences();
    stopPlayback();
    synthPlayer.dispose();
    soundscapePlayer.dispose();
    window.removeEventListener('pointerdown', handleFirstInteraction);
    window.removeEventListener('keydown', handleFirstInteraction);
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
    zoneSoundEnabled,
    sceneAmbienceEnabled,
    sceneAmbienceVolume,
    setSoundscape,
    selectedAudioTrackMeta,
    selectedTrackLabel,
    youtube,
    volumeIconName,
    startPlayback,
    stopPlayback,
    playSharedYouTube,
    togglePlayback,
    updateVolume,
    toggleMute,
    selectTrack,
    playZoneTrack,
    setDefaultTrack,
  };
}

export type AmbientAudio = ReturnType<typeof useAmbientAudio>;
