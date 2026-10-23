import { computed, onBeforeUnmount, reactive, ref, watch, type Ref } from 'vue';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import type { AmbientAudio, AudioTrackKey } from './useAmbientAudio';
import type { IncomingWatch, WatchState } from './useLibrarySocket';

/**
 * 一起看 YouTube（同一個房間）：
 * - 開的人（host）在 YouTube 電視播影片時按「邀請同房間一起看」，每 10 秒、播放／暫停、有人進房時送一次「影片 ID＋秒數＋在不在播」；
 * - 其他人只會看到一張邀請小卡，**按了才跟著看**（不自動播）；擋掉的人、開勿擾、設定裡關掉邀請就看不到；
 * - 跟著看的時候：對方換片就換、播放／暫停跟著、差超過 4 秒就跳過去；自己按暫停不會被硬拉回去，等對方下一次按播放；
 * - 35 秒沒收到對方的消息就當作他停了（關分頁、斷線、換房間）。
 * - 在家裡（自己家、朋友家）就只跟同一個家的人一起看（後端只送給那個家，訊息帶 home）；圖書館房間的邀請在家裡不顯示，反過來也是。
 * 換片至少隔 30 秒（後端也會擋），太快換的那次等下一次報到才送出去。
 */

const HEARTBEAT_MS = 10_000;
const STALE_MS = 35_000;
const CHANGE_GAP_MS = 30_000;
const DRIFT_SECONDS = 4;

interface WatchSocket {
  lastWatch: Ref<IncomingWatch | null>;
  peerJoinedAt: Ref<number>;
  sendWatch: (state: WatchState | null) => boolean;
}

export interface WatchInvite extends IncomingWatch {
  title: string;
}

// 影片標題：各自的瀏覽器去 YouTube 的 oEmbed 抓（訊息裡不帶任何文字）
const titleCache = new Map<string, string>();
async function fetchTitle(videoId: string): Promise<string> {
  const cached = titleCache.get(videoId);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`);
    const data = res.ok ? ((await res.json()) as { title?: unknown }) : {};
    const title = typeof data.title === 'string' ? data.title.slice(0, 120) : '';
    titleCache.set(videoId, title);
    return title;
  } catch {
    return '';
  }
}

export function useWatchTogether(options: { audio: AmbientAudio; socket: WatchSocket; roomKey: () => string; atHome: () => boolean; onEnded: (name: string) => void }) {
  const { audio, socket } = options;
  const youtube = audio.youtube;
  const prefs = usePlayerPrefs();

  // 正在跟誰看（對方的分頁 key）；開的人那邊也要用到，放前面
  const following = ref<string | null>(null);

  // --- 開的人 ---
  const hosting = ref(false);
  let heartbeatTimer: number | null = null;
  let pendingTimer: number | null = null;
  let lastSentAt = 0;
  let sentVideo = '';
  let sentVideoAt = 0;

  // 可以邀請：正在用 YouTube、畫面上有影片、不是在跟別人看
  const canHost = computed(() => audio.selectedAudioTrack.value === 'youtube' && youtube.started.value && !following.value);

  function hostState(): WatchState | null {
    const videoId = youtube.currentVideoId();
    if (!videoId) return null;
    return { videoId, t: Math.round(youtube.currentTime() * 10) / 10, playing: youtube.playing.value };
  }

  function sendNow(): void {
    if (!hosting.value) return;
    const state = hostState();
    if (!state) return;
    const now = Date.now();
    // 換片太快：先不送，等 30 秒到了的下一次報到
    if (state.videoId !== sentVideo && sentVideo && now - sentVideoAt < CHANGE_GAP_MS) return;
    if (!socket.sendWatch(state)) return;
    lastSentAt = now;
    if (state.videoId !== sentVideo) {
      sentVideo = state.videoId;
      sentVideoAt = now;
    }
  }

  // 後端每則至少隔 1 秒：太密的合併成一則晚一點送
  function scheduleSend(): void {
    if (!hosting.value || pendingTimer !== null) return;
    const wait = Math.max(0, lastSentAt + 1100 - Date.now());
    pendingTimer = window.setTimeout(() => {
      pendingTimer = null;
      sendNow();
    }, wait);
  }

  function startHosting(): void {
    if (!canHost.value || hosting.value) return;
    hosting.value = true;
    scheduleSend();
    heartbeatTimer = window.setInterval(scheduleSend, HEARTBEAT_MS);
  }

  function stopHosting(): void {
    if (!hosting.value) return;
    hosting.value = false;
    if (heartbeatTimer !== null) window.clearInterval(heartbeatTimer);
    if (pendingTimer !== null) window.clearTimeout(pendingTimer);
    heartbeatTimer = null;
    pendingTimer = null;
    socket.sendWatch(null);
    // 停止那則也算一則（後端每則隔 1 秒）；sentVideo 留著：停掉再開別支一樣要隔 30 秒
    lastSentAt = Date.now();
  }

  watch(youtube.playing, scheduleSend);
  watch(socket.peerJoinedAt, scheduleSend);
  // 不放 YouTube 了（換別的音樂、關掉電視）就停止分享
  watch(canHost, (ok) => {
    if (!ok) stopHosting();
  });

  // --- 看的人 ---
  const invite = ref<WatchInvite | null>(null);
  // 按了「不用了」：同一個人、同一支影片不再跳出來
  const dismissed = reactive(new Set<string>());
  let hostWasPlaying = false;
  let trackBeforeFollow: AudioTrackKey | null = null;
  let applyingRemote = false;

  function muted(fromUserId: string): boolean {
    return prefs.value.watchInvitesOff || prefs.value.doNotDisturb || prefs.value.blocked.includes(fromUserId);
  }

  const visibleInvite = computed(() => {
    const inv = invite.value;
    if (!inv || following.value === inv.key || hosting.value) return null;
    if (muted(inv.fromUserId) || dismissed.has(`${inv.key}:${inv.videoId}`)) return null;
    return inv;
  });
  const followingName = computed(() => (following.value && invite.value?.key === following.value ? invite.value.name : ''));

  function applyRemote(w: IncomingWatch, joining: boolean): void {
    applyingRemote = true;
    try {
      if (joining || youtube.currentVideoId() !== w.videoId || !youtube.started.value) {
        audio.playSharedYouTube(w.videoId, w.t, w.playing);
      } else {
        if (w.playing !== hostWasPlaying) {
          youtube.seekTo(w.t);
          if (w.playing) void audio.startPlayback();
          else audio.stopPlayback();
        } else if ((w.playing ? youtube.playing.value : true) && Math.abs(youtube.currentTime() - w.t) > DRIFT_SECONDS) {
          youtube.seekTo(w.t);
        }
      }
    } finally {
      hostWasPlaying = w.playing;
      window.setTimeout(() => {
        applyingRemote = false;
      }, 0);
    }
  }

  function endFollow(notify: boolean): void {
    const name = followingName.value;
    following.value = null;
    if (notify && name) options.onEnded(name);
  }

  watch(socket.lastWatch, (w) => {
    if (!w || w.home !== options.atHome()) return;
    if (w.stop) {
      if (following.value === w.key) endFollow(true);
      if (invite.value?.key === w.key) invite.value = null;
      return;
    }
    if (muted(w.fromUserId) && following.value !== w.key) return;
    const sameVideo = invite.value?.key === w.key && invite.value.videoId === w.videoId;
    invite.value = { ...w, title: sameVideo ? (invite.value?.title ?? '') : titleCache.get(w.videoId) ?? '' };
    if (!sameVideo) {
      void fetchTitle(w.videoId).then((title) => {
        if (invite.value?.videoId === w.videoId) invite.value = { ...invite.value, title };
      });
    }
    if (following.value === w.key) applyRemote(w, false);
  });

  function join(): void {
    const inv = invite.value;
    if (!inv) return;
    if (hosting.value) stopHosting();
    trackBeforeFollow = audio.selectedAudioTrack.value === 'youtube' ? null : audio.selectedAudioTrack.value;
    following.value = inv.key;
    // 收到的秒數是對方送出那時的，播放中就補上經過的時間
    const elapsed = inv.playing ? (Date.now() - inv.at) / 1000 : 0;
    applyRemote({ ...inv, t: inv.t + elapsed }, true);
  }

  function dismiss(): void {
    const inv = invite.value;
    if (inv) dismissed.add(`${inv.key}:${inv.videoId}`);
  }

  // 自己退出：停掉影片、回到原本的音樂
  function leave(): void {
    const inv = invite.value;
    if (inv) dismissed.add(`${inv.key}:${inv.videoId}`);
    following.value = null;
    audio.stopPlayback();
    youtube.started.value = false;
    if (trackBeforeFollow) audio.selectTrack(trackBeforeFollow);
    trackBeforeFollow = null;
  }

  // 自己換了別的音樂、關掉電視：不再跟著看（不是遠端觸發的才算）
  watch(
    () => [audio.selectedAudioTrack.value, youtube.started.value] as const,
    ([track, started]) => {
      if (applyingRemote || !following.value) return;
      if (track !== 'youtube' || !started) {
        following.value = null;
        trackBeforeFollow = null;
      }
    },
  );

  // 太久沒消息：對方不見了
  const staleTimer = window.setInterval(() => {
    const inv = invite.value;
    if (!inv || Date.now() - inv.at < STALE_MS) return;
    if (following.value === inv.key) endFollow(true);
    invite.value = null;
  }, 5000);

  // 換房間（含進出家裡）：邀請、跟著看、分享都只在原本那個房間
  watch(options.roomKey, () => {
    stopHosting();
    invite.value = null;
    following.value = null;
    trackBeforeFollow = null;
  });

  onBeforeUnmount(() => {
    window.clearInterval(staleTimer);
    stopHosting();
  });

  const atHome = computed(options.atHome);

  return { atHome, hosting, canHost, startHosting, stopHosting, visibleInvite, following, followingName, join, dismiss, leave };
}

export type WatchTogether = ReturnType<typeof useWatchTogether>;
