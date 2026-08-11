<template>
  <div
    class="relative overflow-hidden rounded-[28px] border border-slate-200 dark:!border-white/10 bg-slate-50 dark:!bg-slate-950/55 p-3 shadow-2xl backdrop-blur-xl sm:rounded-[36px] sm:p-6"
  >
    <div
      class="pointer-events-none absolute -top-24 left-1/2 h-56 w-56 -translate-x-1/2 rounded-full bg-amber-300/10 blur-[92px]"
    ></div>
    <div class="pointer-events-none absolute -bottom-20 -right-16 h-48 w-48 rounded-full bg-cyan-300/10 blur-[88px]"></div>

    <div class="relative z-10 space-y-4 sm:space-y-5">
      <div
        class="flex items-center justify-between rounded-2xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 px-3 py-2"
      >
        <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:!text-white/60">Focus Clock</p>
        <span
          class="rounded-full px-2 py-1 text-[9px] font-black tracking-[0.2em]"
          :class="isRunning ? 'bg-emerald-300/20 text-emerald-200' : 'bg-slate-100 dark:!bg-white/10 text-slate-500 dark:!text-white/75'"
        >
          {{ isRunning ? 'RUNNING' : 'IDLE' }}
        </span>
      </div>

      <div
        class="rounded-3xl border border-slate-200 dark:!border-white/10 bg-slate-50 dark:!bg-slate-900/70 px-3 py-3 shadow-[inset_0_0_40px_rgba(15,23,42,0.55)] sm:px-5 sm:py-5"
      >
        <div class="mb-3 flex items-end justify-between">
          <p class="text-[10px] font-black uppercase tracking-[0.24em] text-amber-300/90">{{ t.focusClockPanel.remainingTimeLabel }}</p>
          <p class="text-[10px] font-black tracking-[0.14em] text-slate-500 dark:!text-white/60">
            Base {{ formattedBaseDuration }}
          </p>
        </div>

        <div
          class="rounded-2xl border border-slate-200 dark:!border-white/10 bg-gradient-to-br from-slate-50 dark:!from-slate-950/80 via-white dark:!via-slate-900/70 to-slate-50 dark:!to-slate-950/80 px-3 py-5 text-center"
        >
          <div class="text-[3rem] font-mono font-black leading-none tracking-tight text-amber-50 drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] sm:text-6xl">
            {{ formattedTime }}
          </div>
        </div>

        <div class="mt-3">
          <div class="mb-1.5 flex items-center justify-between text-[10px] font-black tracking-[0.12em] text-slate-500 dark:!text-white/60">
            <span>{{ t.focusClockPanel.progressLabel }}</span>
            <span>{{ progressPercent }}%</span>
          </div>
          <div class="h-2 rounded-full bg-slate-100 dark:!bg-white/10">
            <div
              class="h-full rounded-full bg-gradient-to-r from-amber-300 via-rose-300 to-cyan-300 transition-all duration-500"
              :style="{ width: `${progressPercent}%` }"
            ></div>
          </div>
        </div>
      </div>

      <div class="flex flex-col gap-y-3 space-y-[5px]">
        <button
          @click="$emit('toggle-focus')"
          class="w-full rounded-2xl py-3.5 text-sm font-black tracking-[0.14em] shadow-2xl transition-all active:scale-[0.98]"
          :class="isRunning ? 'bg-rose-500 text-white shadow-rose-500/30 hover:bg-rose-400' : 'bg-white text-slate-900 shadow-white/20 hover:bg-amber-50'"
        >
          {{ isRunning ? t.focusClockPanel.endFocusButton : t.focusClockPanel.startFocusButton }}
        </button>

        <button
          @click="$emit('restart-focus-timer')"
          class="w-full rounded-xl border border-amber-300 dark:!border-amber-300/35 bg-amber-50 dark:!bg-amber-400/10 px-3 py-2.5 text-[11px] font-black tracking-[0.08em] text-amber-700 dark:!text-amber-200 transition-all hover:border-amber-400 dark:hover:!border-amber-300/60 hover:bg-amber-100 dark:hover:!bg-amber-400/20 disabled:cursor-not-allowed disabled:opacity-45"
        >
          {{ t.focusClockPanel.restartButton }}
        </button>

        <button
          v-if="!isRunning && hasResumeCandidate"
          @click="$emit('resume-previous-focus')"
          class="w-full rounded-2xl border border-emerald-300/50 bg-emerald-400/10 px-3 py-2.5 text-[11px] font-black tracking-[0.08em] text-emerald-200 transition-all hover:border-emerald-300/70 hover:bg-emerald-400/20"
        >
          {{ t.focusClockPanel.resumeButton }}
          <span class="ml-1 text-emerald-100/80">{{ resumeCandidateLabel }}</span>
        </button>
      </div>

      <button
        type="button"
        @click="showAdvancedFocusControls = !showAdvancedFocusControls"
        class="w-full rounded-xl border border-slate-200 dark:!border-white/15 bg-slate-100 dark:!bg-white/5 px-3 py-2 text-[11px] font-black tracking-[0.1em] text-slate-600 dark:!text-white/85 transition-all hover:border-slate-300 dark:hover:!border-white/30 hover:bg-slate-100 dark:hover:!bg-white/10"
      >
        {{ showAdvancedFocusControls ? t.focusClockPanel.hideAdvancedButton : t.focusClockPanel.showAdvancedButton }}
      </button>

      <div
        v-if="showAdvancedFocusControls"
        class="space-y-3 rounded-2xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 p-3"
      >
        <div class="space-y-2 rounded-xl border border-slate-200 dark:!border-white/10 bg-white dark:!bg-slate-900/35 p-3">
          <p class="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500 dark:!text-white/60">{{ t.focusClockPanel.focusDurationLabel }}</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="minutes in focusDurationOptions"
              :key="minutes"
              type="button"
              @click="$emit('select-focus-duration', minutes)"
              class="rounded-xl border px-2 py-2 text-[11px] font-black tracking-[0.08em] transition-all"
              :class="
                selectedFocusDurationMinutes === minutes
                  ? 'border-amber-400 bg-amber-100 dark:!bg-amber-400/20 text-amber-800 dark:!text-amber-100'
                  : 'border-slate-200 dark:!border-white/15 bg-white dark:!bg-slate-900/45 text-slate-600 dark:!text-white/85 hover:border-slate-300 dark:hover:!border-white/30 hover:text-slate-900 dark:!text-white'
              "
            >
              {{ minutes }} {{ t.focusClockPanel.minutesSuffix }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-2">
          <button
            @click="$emit('reset-focus-timer')"
            :disabled="timeLeft === baseDuration && !isRunning"
            class="rounded-xl border border-slate-200 dark:!border-white/15 bg-white dark:!bg-slate-900/45 px-2.5 py-2 text-[11px] font-black tracking-[0.08em] text-slate-700 dark:!text-white/90 transition-all hover:border-slate-300 dark:hover:!border-white/30 hover:bg-slate-50 dark:hover:!bg-slate-900/65 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {{ t.focusClockPanel.resetTimeButton }}
          </button>
        </div>

        <label
          class="flex items-center justify-between rounded-xl border border-slate-200 dark:!border-white/10 bg-white dark:!bg-slate-900/35 px-3 py-2 text-[11px] text-slate-600 dark:!text-white/85"
        >
          <span class="font-bold tracking-[0.06em]">{{ t.focusClockPanel.autoRestartLabel }}</span>
          <input
            :checked="autoRestartOnFinish"
            @change="$emit('update:autoRestartOnFinish', ($event.target as HTMLInputElement).checked)"
            type="checkbox"
            class="accent-amber-400"
          />
        </label>

        <div class="rounded-xl border border-slate-200 dark:!border-white/10 bg-white dark:!bg-slate-900/35 p-3 text-left">
          <label for="display-name" class="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:!text-white/65">
            {{ t.focusClockPanel.displayNameLabel }}
          </label>
          <input
            id="display-name"
            v-model="displayNameInput"
            type="text"
            maxlength="20"
            :disabled="!isEditingDisplayName"
            class="w-full rounded-xl border border-slate-200 dark:!border-white/15 bg-slate-50 dark:!bg-slate-950/70 px-3 py-2 text-sm font-black text-slate-900 dark:!text-white placeholder:text-slate-300 dark:placeholder:text-white/45 focus:outline-none focus:ring-2 focus:ring-amber-400/60 disabled:cursor-not-allowed disabled:opacity-60"
            :placeholder="t.focusClockPanel.displayNamePlaceholder"
            @keyup.enter="applyDisplayName"
          />
          <div class="mt-3 flex justify-end">
            <button
              v-if="!isEditingDisplayName"
              class="rounded-lg border border-slate-200 dark:!border-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-600 dark:!text-white/80 hover:border-slate-300 dark:hover:!border-white/40 hover:text-slate-900 dark:!text-white"
              @click="isEditingDisplayName = true"
            >
              {{ t.focusClockPanel.editButton }}
            </button>
            <button
              v-else
              class="rounded-lg bg-amber-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-amber-950 hover:bg-amber-300"
              @click="applyDisplayName"
            >
              {{ t.focusClockPanel.saveButton }}
            </button>
          </div>
        </div>
      </div>

      <div class="rounded-xl border border-slate-200 dark:!border-white/10 bg-slate-100 dark:!bg-white/5 px-3.5 py-2.5 text-left mt-3.5">
        <p class="text-[11px] font-bold tracking-[0.06em] text-slate-500 dark:!text-white/70">{{ selectedSeatLabel }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { formatTime } from 'src/pages/index/functions/uiHelpers';
import { useLocale } from 'src/composables/useLocale';

const { t } = useLocale();

const props = defineProps<{
  isRunning: boolean;
  baseDuration: number;
  timeLeft: number;
  formattedTime: string;
  hasResumeCandidate: boolean;
  resumeCandidateLabel: string;
  selectedSeatLabel: string;
  focusDurationOptions: readonly number[];
  selectedFocusDurationMinutes: number;
  autoRestartOnFinish: boolean;
  displayName: string;
}>();

const emit = defineEmits<{
  'toggle-focus': [];
  'restart-focus-timer': [];
  'resume-previous-focus': [];
  'reset-focus-timer': [];
  'select-focus-duration': [minutes: number];
  'update:autoRestartOnFinish': [value: boolean];
  'apply-display-name': [name: string];
}>();

const showAdvancedFocusControls = ref(false);
const isEditingDisplayName = ref(false);
const displayNameInput = ref(props.displayName);

watch(
  () => props.displayName,
  (name) => {
    if (!isEditingDisplayName.value) displayNameInput.value = name;
  },
);

const formattedBaseDuration = computed(() => formatTime(props.baseDuration));
const progressPercent = computed(() =>
  Math.round(Math.min(100, Math.max(0, ((props.baseDuration - props.timeLeft) / Math.max(1, props.baseDuration)) * 100)),
));

function applyDisplayName() {
  const normalized = displayNameInput.value.trim().slice(0, 20) || props.displayName;
  displayNameInput.value = normalized;
  isEditingDisplayName.value = false;
  emit('apply-display-name', normalized);
}
</script>
