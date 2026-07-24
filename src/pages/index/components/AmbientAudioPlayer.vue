<template>
  <div
    class="fixed bottom-1 left-1 right-1 z-50 rounded-2xl border border-slate-200 dark:!border-white/10 bg-white/95 dark:!bg-slate-950/92 shadow-[0_10px_28px_rgba(0,0,0,0.12)] dark:!shadow-[0_10px_28px_rgba(0,0,0,0.34)] backdrop-blur-xl sm:left-1/2 sm:right-auto sm:w-[min(100%-0.75rem,28rem)] sm:-translate-x-1/2"
    :style="{ paddingBottom: 'max(0.25rem, env(safe-area-inset-bottom))' }"
  >
    <div class="flex items-center gap-2.5 px-2.5 py-2 sm:px-3 sm:py-2.5">
      <button
        type="button"
        @click="audio.togglePlayback"
        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-amber-400 text-slate-950 shadow-[0_6px_16px_rgba(251,191,36,0.22)] transition-all active:scale-95 hover:bg-amber-300"
      >
        <q-icon :name="audio.isAudioPlaying.value ? 'pause' : 'play_arrow'" size="16px" />
      </button>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1.5">
          <q-icon :name="audio.selectedAudioTrackMeta.value.icon" size="12px" class="text-amber-600 dark:!text-amber-300/85" />
          <div class="truncate text-[10px] font-black uppercase tracking-[0.15em] text-slate-600 dark:!text-white/80">
            {{ audio.selectedAudioTrackMeta.value.name }}
          </div>
        </div>
        <div class="mt-1.5 flex items-center gap-1.5">
          <button
            type="button"
            @click="audio.toggleMute"
            class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-slate-500 dark:!text-white/75 transition-colors hover:text-slate-900 dark:hover:!text-white"
          >
            <q-icon :name="audio.volumeIconName.value" size="13px" />
          </button>
          <input
            v-model.number="volume"
            @input="audio.updateVolume"
            type="range"
            min="0"
            max="100"
            class="h-1.5 w-full cursor-pointer rounded-full bg-slate-200 dark:!bg-white/15 accent-amber-400"
          />
          <span class="w-7 flex-shrink-0 text-right text-[9px] font-black text-slate-500 dark:!text-white/60">
            {{ audio.audioVolume.value }}%
          </span>
        </div>
      </div>

      <button
        type="button"
        @click="showSettings = true"
        class="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 text-slate-600 dark:!text-white/80 transition-all hover:border-slate-300 dark:hover:!border-white/20 hover:bg-slate-100 dark:hover:!bg-white/10"
      >
        <q-icon name="more_horiz" size="18px" />
      </button>
    </div>

    <q-dialog v-model="showSettings" position="bottom">
      <div
        class="w-full rounded-t-3xl border border-slate-200 dark:!border-white/10 border-b-0 bg-white dark:!bg-slate-950 p-4 sm:mx-auto sm:max-w-md sm:rounded-3xl sm:border-b"
      >
        <div class="mb-3 flex items-center justify-between">
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:!text-white/65">音源設定</p>
          <button type="button" class="text-slate-400 dark:!text-white/55 hover:text-slate-900 dark:hover:!text-white" @click="showSettings = false">
            <q-icon name="close" size="18px" />
          </button>
        </div>

        <div class="grid grid-cols-3 gap-2 sm:grid-cols-6">
          <button
            v-for="trackKey in audio.audioTrackOrder"
            :key="trackKey"
            type="button"
            @click="audio.selectTrack(trackKey)"
            class="flex flex-col items-center gap-1 rounded-xl border px-2 py-2.5 transition-all duration-200"
            :class="
              audio.selectedAudioTrack.value === trackKey
                ? 'border-amber-400 bg-amber-400/10 text-amber-600 dark:!text-amber-200'
                : 'border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 text-slate-500 dark:!text-white/70 hover:border-slate-300 dark:hover:!border-white/20 hover:bg-slate-100 dark:hover:!bg-white/10 hover:text-slate-900 dark:hover:!text-white'
            "
          >
            <q-icon :name="audio.audioTracks[trackKey].icon" size="18px" />
            <span class="text-[9px] font-black tracking-tight">{{ audio.audioTracks[trackKey].name }}</span>
          </button>
        </div>

        <div class="mt-4 space-y-2 border-t border-slate-200 dark:!border-white/10 pt-3">
          <label
            class="flex items-center justify-between rounded-xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 px-3 py-2 text-[11px] text-slate-600 dark:!text-white/85"
          >
            跟隨專注自動播放
            <input v-model="followFocusPlayback" type="checkbox" class="accent-amber-400" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 px-3 py-2 text-[11px] text-slate-600 dark:!text-white/85"
          >
            循環播放
            <input v-model="audioLoopEnabled" type="checkbox" class="accent-amber-400" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 px-3 py-2 text-[11px] text-slate-600 dark:!text-white/85"
          >
            進頁自動播放
            <input v-model="audioAutoPlayOnLoad" type="checkbox" class="accent-amber-400" />
          </label>
          <label
            class="flex items-center justify-between rounded-xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 px-3 py-2 text-[11px] text-slate-600 dark:!text-white/85"
          >
            預設音源
            <select
              v-model="defaultAudioTrack"
              class="rounded bg-white dark:!bg-slate-900/80 px-2 py-1 text-[10px] text-slate-900 dark:!text-white outline-none"
            >
              <option v-for="trackKey in audio.audioTrackOrder" :key="`default-${trackKey}`" :value="trackKey">
                {{ audio.audioTracks[trackKey].name }}
              </option>
            </select>
          </label>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { AmbientAudio, AudioTrackKey } from '../composables/useAmbientAudio';

const props = defineProps<{
  audio: AmbientAudio;
}>();

const showSettings = ref(false);

// v-model can't write through a prop path directly (vue/no-mutating-props) even
// though what's actually being mutated is a Ref's .value, not the prop itself —
// these small writable computeds are the clean way to keep two-way binding.
// The rule can't see through the Ref, so it's disabled just for these setters.
/* eslint-disable vue/no-mutating-props */
const volume = computed({
  get: () => props.audio.audioVolume.value,
  set: (value: number) => {
    props.audio.audioVolume.value = value;
  },
});
const followFocusPlayback = computed({
  get: () => props.audio.followFocusPlayback.value,
  set: (value: boolean) => {
    props.audio.followFocusPlayback.value = value;
  },
});
const audioLoopEnabled = computed({
  get: () => props.audio.audioLoopEnabled.value,
  set: (value: boolean) => {
    props.audio.audioLoopEnabled.value = value;
  },
});
const audioAutoPlayOnLoad = computed({
  get: () => props.audio.audioAutoPlayOnLoad.value,
  set: (value: boolean) => {
    props.audio.audioAutoPlayOnLoad.value = value;
  },
});
const defaultAudioTrack = computed({
  get: () => props.audio.defaultAudioTrack.value,
  set: (value: AudioTrackKey) => {
    props.audio.defaultAudioTrack.value = value;
  },
});
/* eslint-enable vue/no-mutating-props */
</script>
