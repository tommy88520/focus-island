<template>
  <!-- 底部工具列裡的音樂：放在番茄鐘旁邊 -->
  <div class="flex min-w-0 !flex-nowrap items-center gap-2.5">
    <button
      type="button"
      class="pixel-btn pixel-btn--primary h-10 w-10 shrink-0"
      :aria-label="audio.isAudioPlaying.value ? 'pause' : 'play'"
      @click="audio.togglePlayback"
    >
      <q-icon :name="audio.isAudioPlaying.value ? 'pause' : 'play_arrow'" size="18px" />
    </button>

    <div class="min-w-0 flex-1 sm:w-40 sm:flex-none">
      <div class="flex !flex-nowrap items-center gap-1.5">
        <q-icon :name="audio.selectedAudioTrackMeta.value.icon" size="12px" class="text-[color:var(--px-accent-dark)] dark:!text-amber-300" />
        <div class="truncate text-[10px] font-black uppercase tracking-[0.15em]">
          {{ audio.selectedAudioTrackMeta.value.name[locale] }}
        </div>
      </div>
      <div class="mt-1.5 flex !flex-nowrap items-center gap-1.5">
        <button type="button" class="flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--px-muted)]" @click="audio.toggleMute">
          <q-icon :name="audio.volumeIconName.value" size="13px" />
        </button>
        <input
          v-model.number="volume"
          type="range"
          min="0"
          max="100"
          class="h-1.5 w-full cursor-pointer accent-amber-400"
          :aria-label="`${audio.audioVolume.value}%`"
          @input="audio.updateVolume"
        />
      </div>
    </div>

    <button
      type="button"
      class="pixel-btn h-10 w-10 shrink-0"
      :aria-label="t.ambientAudioPlayer.audioSettingsTitle"
      @click="showSettings = true"
    >
      <q-icon name="more_horiz" size="18px" />
    </button>

    <q-dialog v-model="showSettings" position="bottom">
      <div class="pixel-panel w-full p-4 sm:mx-auto sm:max-w-md">
        <div class="mb-3 flex items-center justify-between">
          <p class="text-[11px] font-black uppercase tracking-[0.2em] text-slate-500 dark:!text-white/65">{{ t.ambientAudioPlayer.audioSettingsTitle }}</p>
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
            class="pixel-btn flex-col px-2 py-2.5"
            :class="{ 'pixel-btn--active': audio.selectedAudioTrack.value === trackKey }"
          >
            <q-icon :name="audio.audioTracks[trackKey].icon" size="18px" />
            <span class="text-[9px] font-black tracking-tight">{{ audio.audioTracks[trackKey].name[locale] }}</span>
          </button>
        </div>

        <div class="mt-4 space-y-2 pt-1">
          <label
            class="pixel-field flex items-center justify-between px-3 py-2 text-[11px]"
          >
            {{ t.ambientAudioPlayer.followFocusLabel }}
            <input v-model="followFocusPlayback" type="checkbox" class="accent-amber-400" />
          </label>
          <label
            class="pixel-field flex items-center justify-between px-3 py-2 text-[11px]"
          >
            {{ t.ambientAudioPlayer.loopLabel }}
            <input v-model="audioLoopEnabled" type="checkbox" class="accent-amber-400" />
          </label>
          <label
            class="pixel-field flex items-center justify-between px-3 py-2 text-[11px]"
          >
            {{ t.ambientAudioPlayer.autoplayOnLoadLabel }}
            <input v-model="audioAutoPlayOnLoad" type="checkbox" class="accent-amber-400" />
          </label>
          <label
            class="pixel-field flex items-center justify-between px-3 py-2 text-[11px]"
          >
            {{ t.ambientAudioPlayer.defaultTrackLabel }}
            <select
              v-model="defaultAudioTrack"
              class="rounded bg-white dark:!bg-slate-900/80 px-2 py-1 text-[10px] text-slate-900 dark:!text-white outline-none"
            >
              <option v-for="trackKey in audio.audioTrackOrder" :key="`default-${trackKey}`" :value="trackKey">
                {{ audio.audioTracks[trackKey].name[locale] }}
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
import { useLocale } from 'src/composables/useLocale';

const props = defineProps<{
  audio: AmbientAudio;
}>();

const { locale, t } = useLocale();
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
