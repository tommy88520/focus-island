<template>
  <!-- 點別人的名牌：小卡（主地圖、F1、環河公園、北投共用）。打招呼只有主地圖有；悄悄話、封鎖每張地圖都有 -->
  <div
    class="pixel-panel absolute left-1/2 top-3 z-10 w-[min(18rem,calc(100%-1.5rem))] -translate-x-1/2 p-3"
    role="dialog"
    :aria-label="person.displayName"
  >
    <div class="!flex !flex-nowrap items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="!mb-0 truncate text-base font-black">{{ person.dnd ? '🔕 ' : '' }}{{ person.displayName }}</p>
        <p class="!mb-0 mt-0.5 text-[11px] font-bold text-[color:var(--px-muted)]">{{ status }}</p>
      </div>
      <button type="button" class="shrink-0 text-[color:var(--px-muted)]" :aria-label="t.seatScene.profileClose" @click="emit('close')">
        <q-icon name="close" size="18px" />
      </button>
    </div>
    <p v-if="person.todayMin !== undefined || person.streak !== undefined" class="!mb-0 mt-2 font-pixel text-[11px]">
      <span v-if="person.todayMin !== undefined">⏱ {{ t.seatScene.profileToday(person.todayMin) }}</span>
      <span v-if="person.streak !== undefined" class="ml-3">🔥 {{ t.seatScene.profileStreak(person.streak) }}</span>
    </p>
    <button v-if="waveLabel" type="button" class="pixel-btn pixel-btn--primary mt-3 h-8 w-full text-xs" :disabled="!canWave" @click="emit('wave')">
      {{ waveLabel }}
    </button>
    <!-- 悄悄話：只有他看得到，只能選固定的句子 -->
    <template v-if="person.userId && !person.userId.startsWith('demo_')">
      <p class="!mb-1 mt-3 text-[10px] font-black tracking-wide text-[color:var(--px-muted)]">🤫 {{ t.seatScene.whisperTitle }}</p>
      <div class="grid grid-cols-2 gap-1.5">
        <button
          v-for="phrase in WHISPER_IDS"
          :key="phrase"
          type="button"
          class="pixel-btn h-9 px-1 text-[11px]"
          :disabled="blocked"
          @click="emit('whisper', person.userId ?? '', phrase)"
        >
          {{ t.seatScene.whispers[phrase] }}
        </button>
      </div>
      <button type="button" class="mt-2 w-full text-center text-[10px] font-bold text-[color:var(--px-muted)] underline" @click="toggleBlock">
        {{ blocked ? t.seatScene.unblock : t.seatScene.block }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from 'src/composables/useLocale';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import { WHISPER_IDS, type ProfilePerson, type WhisperId } from 'src/pages/index/composables/useLibrarySocket';

const props = defineProps<{
  person: ProfilePerson;
  // 沒給就不顯示打招呼鈕（F1／公園／北投沒有表情泡泡）
  waveLabel?: string;
  canWave?: boolean;
}>();
const emit = defineEmits<{ close: []; wave: []; whisper: [to: string, phrase: WhisperId] }>();
const { t } = useLocale();
const prefs = usePlayerPrefs();

const status = computed(() => {
  const state = props.person.state;
  return state === '專注' ? t.value.seatScene.profileFocusing : state === '休息' ? t.value.seatScene.profileResting : t.value.seatScene.profileIdle;
});
const blocked = computed(() => !!props.person.userId && prefs.value.blocked.includes(props.person.userId));

// 擋掉／解除：擋掉之後收不到他的悄悄話（之後的一起看 YouTube 邀請也一樣）
function toggleBlock(): void {
  const id = props.person.userId;
  if (!id) return;
  prefs.value.blocked = blocked.value ? prefs.value.blocked.filter((b) => b !== id) : [...prefs.value.blocked, id];
}
</script>
