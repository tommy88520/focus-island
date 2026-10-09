<template>
  <!-- 底部工具列裡的番茄鐘：只留時間、進度、開始／重來，其餘設定收進對話框，不擋地圖 -->
  <div class="flex min-w-0 !flex-nowrap items-center gap-2 sm:gap-2.5">
    <div class="min-w-0 flex-1 sm:w-[8.5rem] sm:flex-none" :title="selectedSeatLabel">
      <div class="flex !flex-nowrap items-center gap-1.5">
        <span class="font-pixel text-[1.4rem] font-bold leading-none sm:text-[1.65rem]" :class="isRunning ? 'text-[color:var(--px-accent-dark)] dark:!text-amber-300' : ''">
          {{ formattedTime }}
        </span>
        <span
          class="hide-below-sm h-2 w-2 shrink-0"
          :class="isRunning ? 'animate-pulse bg-emerald-400' : 'bg-[color:var(--px-muted)]'"
          :aria-label="isRunning ? 'RUNNING' : 'IDLE'"
        ></span>
      </div>
      <p v-if="groupStatus" class="!mb-0 mt-1 truncate text-[10px] font-black text-[color:var(--px-accent-dark)] dark:!text-amber-300">
        👥 {{ groupStatus }}
      </p>
      <div class="pixel-track mt-1.5" role="progressbar" :aria-valuenow="progressPercent" aria-valuemin="0" aria-valuemax="100">
        <div :style="{ width: `${progressPercent}%` }"></div>
      </div>
    </div>

    <button
      type="button"
      class="pixel-btn h-10 shrink-0 px-3 text-xs tracking-[0.08em]"
      :class="isRunning ? 'pixel-btn--danger' : 'pixel-btn--primary'"
      @click="$emit('toggle-focus')"
    >
      <q-icon :name="isRunning ? 'stop' : 'play_arrow'" size="16px" />
      {{ isRunning ? t.focusClockPanel.endFocusButton : t.focusClockPanel.startFocusButton }}
    </button>
    <button
      type="button"
      class="pixel-btn h-10 w-10 shrink-0"
      :title="t.focusClockPanel.restartButton"
      :aria-label="t.focusClockPanel.restartButton"
      @click="$emit('restart-focus-timer')"
    >
      <q-icon name="replay" size="18px" />
    </button>
    <button
      v-if="!isRunning && hasResumeCandidate"
      type="button"
      class="pixel-btn h-10 w-10 shrink-0 !text-emerald-600 dark:!text-emerald-300"
      :title="`${t.focusClockPanel.resumeButton} ${resumeCandidateLabel}`"
      :aria-label="t.focusClockPanel.resumeButton"
      @click="$emit('resume-previous-focus')"
    >
      <q-icon name="history" size="18px" />
    </button>
    <button
      type="button"
      class="pixel-btn h-10 w-10 shrink-0"
      :title="t.focusClockPanel.advancedTitle"
      :aria-label="t.focusClockPanel.advancedTitle"
      @click="showAdvancedFocusControls = true"
    >
      <q-icon name="tune" size="18px" />
    </button>

    <q-dialog v-model="showAdvancedFocusControls" position="bottom">
      <div class="pixel-panel w-full space-y-3 p-4 sm:mx-auto sm:max-w-md">
        <div class="flex items-center justify-between">
          <p class="!mb-0 text-[11px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">
            {{ t.focusClockPanel.advancedTitle }}
          </p>
          <button type="button" class="text-[color:var(--px-muted)]" @click="showAdvancedFocusControls = false">
            <q-icon name="close" size="18px" />
          </button>
        </div>

        <p v-if="selectedSeatLabel" class="!mb-0 text-[11px] font-bold text-[color:var(--px-muted)]">{{ selectedSeatLabel }}</p>

        <div class="space-y-2">
          <p class="!mb-0 text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">{{ t.focusClockPanel.focusDurationLabel }}</p>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="minutes in focusDurationOptions"
              :key="minutes"
              type="button"
              class="pixel-btn py-2 text-[11px]"
              :class="{ 'pixel-btn--active': selectedFocusDurationMinutes === minutes }"
              @click="$emit('select-focus-duration', minutes)"
            >
              {{ minutes }} {{ t.focusClockPanel.minutesSuffix }}
            </button>
          </div>
        </div>

        <button
          type="button"
          class="pixel-btn w-full py-2 text-[11px]"
          :disabled="timeLeft === baseDuration && !isRunning"
          @click="$emit('reset-focus-timer')"
        >
          {{ t.focusClockPanel.resetTimeButton }}
        </button>

        <label v-if="groupFocusAvailable" class="pixel-field flex items-center justify-between px-3 py-2 text-[11px]">
          <span class="font-bold">{{ t.focusClockPanel.groupFocusLabel }}</span>
          <input
            :checked="groupFocus"
            type="checkbox"
            class="accent-amber-400"
            @change="$emit('update:groupFocus', ($event.target as HTMLInputElement).checked)"
          />
        </label>

        <label class="pixel-field flex items-center justify-between px-3 py-2 text-[11px]">
          <span class="font-bold">{{ t.focusClockPanel.autoRestartLabel }}</span>
          <input
            :checked="autoRestartOnFinish"
            type="checkbox"
            class="accent-amber-400"
            @change="$emit('update:autoRestartOnFinish', ($event.target as HTMLInputElement).checked)"
          />
        </label>

        <div>
          <label for="display-name" class="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-[color:var(--px-muted)]">
            {{ t.focusClockPanel.displayNameLabel }}
          </label>
          <div class="flex gap-2">
            <input
              id="display-name"
              v-model="displayNameInput"
              type="text"
              maxlength="20"
              :disabled="!isEditingDisplayName"
              class="pixel-field min-w-0 flex-1 px-3 py-2 text-sm font-black focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
              :placeholder="t.focusClockPanel.displayNamePlaceholder"
              @keyup.enter="applyDisplayName"
            />
            <button v-if="!isEditingDisplayName" type="button" class="pixel-btn px-3 text-[10px] uppercase tracking-[0.15em]" @click="isEditingDisplayName = true">
              {{ t.focusClockPanel.editButton }}
            </button>
            <button v-else type="button" class="pixel-btn pixel-btn--primary px-3 text-[10px] uppercase tracking-[0.15em]" @click="applyDisplayName">
              {{ t.focusClockPanel.saveButton }}
            </button>
          </div>
        </div>
      </div>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
  // 一起專注（跟著時鐘）；嵌入的小工具沒有座位，不提供
  groupFocusAvailable: boolean;
  groupFocus: boolean;
  groupStatus: string;
}>();

const emit = defineEmits<{
  'toggle-focus': [];
  'restart-focus-timer': [];
  'resume-previous-focus': [];
  'reset-focus-timer': [];
  'select-focus-duration': [minutes: number];
  'update:autoRestartOnFinish': [value: boolean];
  'apply-display-name': [name: string];
  'update:groupFocus': [value: boolean];
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
