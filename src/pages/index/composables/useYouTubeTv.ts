import { reactive, ref } from 'vue';

/**
 * 圖書館牆上的 YouTube 電視（只有自己看得到）。整個網站共用一個播放器：
 * - `YouTubeTv.vue` 負責 DOM（iframe 疊在電視上／角落小視窗／放大），掛載後 `hostMounted` 才是 true；
 * - `SeatScenePixel` 每格回報電視在畫面上的位置（`tvScreen`）：影片像真的掛在牆上，鏡頭移開就跟著移出畫面（聲音照樣播）；
 *   去 F1、開小地圖時整個藏起來；
 * - `useAmbientAudio` 把它當成一首「音樂」（track `youtube`）來播放、暫停、調音量。
 * YouTube 規定播放器要看得到，所以不能只放聲音、把影片藏起來。
 */

export interface YouTubeSource {
  videoId?: string;
  listId?: string;
}

export interface YouTubeRecent {
  url: string;
  title: string;
}

// 只宣告用得到的那幾個 IFrame Player API
interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  setLoop(loop: boolean): void;
  loadVideoById(id: string): void;
  loadPlaylist(options: { list: string; listType: 'playlist'; index?: number }): void;
  getVideoData?(): { title?: string };
  destroy(): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    options: {
      width?: string;
      height?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: () => void;
        onStateChange?: (event: { data: number }) => void;
        onError?: (event: { data: number }) => void;
      };
    },
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const STORAGE_KEY = 'focus_island_youtube_v1';
const MAX_RECENT = 5;
const STATE_ENDED = 0;
const STATE_PLAYING = 1;
const STATE_PAUSED = 2;

// 支援 youtube.com/watch?v=、youtu.be/、/shorts/、/live/、/embed/、music.youtube.com、只有 list= 的播放清單、或直接貼 11 碼影片 ID
export function parseYouTubeUrl(input: string): YouTubeSource | null {
  const text = input.trim();
  if (/^[\w-]{11}$/.test(text)) return { videoId: text };
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(text) ? text : `https://${text}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|m|music)\./, '');
  if (host !== 'youtube.com' && host !== 'youtu.be' && host !== 'youtube-nocookie.com') return null;
  const source: YouTubeSource = {};
  const v = url.searchParams.get('v');
  const path = url.pathname.split('/').filter(Boolean);
  if (host === 'youtu.be' && path[0]) source.videoId = path[0];
  else if (v) source.videoId = v;
  else if (['shorts', 'live', 'embed'].includes(path[0] ?? '') && path[1]) source.videoId = path[1];
  const list = url.searchParams.get('list');
  if (list) source.listId = list;
  if (source.videoId && !/^[\w-]{11}$/.test(source.videoId)) delete source.videoId;
  return source.videoId || source.listId ? source : null;
}

function loadSaved(): { url: string; recent: YouTubeRecent[] } {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as { url?: unknown; recent?: unknown };
    const recent = Array.isArray(parsed.recent)
      ? parsed.recent.filter((r): r is YouTubeRecent => typeof r?.url === 'string' && typeof r?.title === 'string').slice(0, MAX_RECENT)
      : [];
    return { url: typeof parsed.url === 'string' ? parsed.url : '', recent };
  } catch {
    return { url: '', recent: [] };
  }
}

const saved = loadSaved();
const url = ref(saved.url);
const recent = ref<YouTubeRecent[]>(saved.recent);
const title = ref('');
const playing = ref(false);
const expanded = ref(false);
const hostMounted = ref(false);
// 按過播放之後才建播放器、才在畫面上出現
const started = ref(false);
// YouTubeTv 現在有沒有顯示出來（顯示時牆上就不用再提示「可以放 YouTube」）
const showing = ref(false);
// 電視螢幕在視窗上的位置（CSS px，viewport 座標）跟地圖畫布的範圍（超出的部分裁掉）；visible=false 時整個藏起來
const tvScreen = reactive({ visible: false, x: 0, y: 0, w: 0, h: 0, clipL: 0, clipT: 0, clipR: 0, clipB: 0 });

let player: YTPlayer | null = null;
let playerReady = false;
let loadedUrl = '';
let wantPlaying = false;
let volume = 40;
let loop = true;
let apiPromise: Promise<YTNamespace> | null = null;
let hostEl: HTMLElement | null = null;
let onStateChange: (isPlaying: boolean) => void = () => undefined;

function save(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ url: url.value, recent: recent.value }));
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

function loadApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => {
      apiPromise = null;
      reject(new Error('YouTube API failed to load'));
    };
    document.head.appendChild(script);
  });
  return apiPromise;
}

function rememberTitle(): void {
  const current = player?.getVideoData?.().title || '';
  if (!current) return;
  title.value = current;
  const entry = { url: url.value, title: current };
  recent.value = [entry, ...recent.value.filter((r) => r.url !== url.value)].slice(0, MAX_RECENT);
  save();
}

function loadCurrent(): void {
  if (!player || !playerReady) return;
  const source = parseYouTubeUrl(url.value);
  if (!source) return;
  loadedUrl = url.value;
  title.value = '';
  if (source.listId) {
    player.loadPlaylist({ list: source.listId, listType: 'playlist', index: 0 });
    player.setLoop(loop);
  } else if (source.videoId) {
    player.loadVideoById(source.videoId);
  }
}

async function ensurePlayer(): Promise<void> {
  if (player || !hostEl) return;
  const YT = await loadApi();
  if (player || !hostEl) return;
  const mount = document.createElement('div');
  hostEl.appendChild(mount);
  player = new YT.Player(mount, {
    width: '100%',
    height: '100%',
    playerVars: { playsinline: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
    events: {
      onReady: () => {
        playerReady = true;
        player?.setVolume(volume);
        if (wantPlaying) loadCurrent();
      },
      onStateChange: ({ data }) => {
        if (data === STATE_PLAYING) {
          playing.value = true;
          rememberTitle();
          onStateChange(true);
        } else if (data === STATE_PAUSED) {
          playing.value = false;
          onStateChange(false);
        } else if (data === STATE_ENDED) {
          // 單支影片：照「循環播放」重來；播放清單由 setLoop 處理
          if (loop && !parseYouTubeUrl(loadedUrl)?.listId) {
            player?.seekTo(0, true);
            player?.playVideo();
            return;
          }
          playing.value = false;
          onStateChange(false);
        }
      },
      onError: () => {
        playing.value = false;
        onStateChange(false);
      },
    },
  });
}

export function useYouTubeTv() {
  function attachHost(el: HTMLElement | null): void {
    hostEl = el;
    hostMounted.value = el !== null;
    if (!el) {
      player?.destroy();
      player = null;
      playerReady = false;
      loadedUrl = '';
      playing.value = false;
      started.value = false;
      return;
    }
    if (wantPlaying) void ensurePlayer();
  }

  // 有網址才會播；回傳 false 代表還沒設定網址
  function play(): boolean {
    if (!parseYouTubeUrl(url.value)) return false;
    wantPlaying = true;
    started.value = true;
    if (!player) {
      void ensurePlayer();
      return true;
    }
    if (!playerReady) return true;
    if (loadedUrl !== url.value) loadCurrent();
    else player.playVideo();
    return true;
  }

  function pause(): void {
    wantPlaying = false;
    if (player && playerReady) player.pauseVideo();
    playing.value = false;
  }

  function setUrl(next: string): boolean {
    if (!parseYouTubeUrl(next)) return false;
    url.value = next.trim();
    save();
    return true;
  }

  function setVolume(next: number): void {
    volume = Math.max(0, Math.min(100, Math.round(next)));
    if (player && playerReady) player.setVolume(volume);
  }

  function setLoop(next: boolean): void {
    loop = next;
    if (player && playerReady && parseYouTubeUrl(loadedUrl)?.listId) player.setLoop(next);
  }

  function onPlayingChange(handler: (isPlaying: boolean) => void): void {
    onStateChange = handler;
  }

  return {
    url,
    recent,
    title,
    playing,
    expanded,
    hostMounted,
    started,
    showing,
    tvScreen,
    attachHost,
    play,
    pause,
    setUrl,
    setVolume,
    setLoop,
    onPlayingChange,
  };
}
