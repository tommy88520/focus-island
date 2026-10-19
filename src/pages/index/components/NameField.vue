<template>
  <!-- 名牌上的名字（人物面板：衣櫃、設定頁的角色外觀）。按儲存、Enter 或離開輸入框就改好（不跟衣櫃的草稿一起） -->
  <form class="!flex !flex-nowrap items-center gap-2" @submit.prevent="save">
    <label class="shrink-0 text-xs font-black" :for="inputId">🏷️ {{ t.focusClockPanel.displayNameLabel }}</label>
    <input
      :id="inputId"
      v-model="draft"
      type="text"
      :maxlength="MAX_DISPLAY_NAME"
      class="pixel-field h-9 min-w-0 flex-1 px-2 text-sm font-black focus:outline-none"
      :placeholder="t.focusClockPanel.displayNamePlaceholder"
      @change="save"
    />
    <button type="submit" class="pixel-btn pixel-btn--primary h-9 shrink-0 px-3 text-xs" :disabled="!changed">
      {{ saved ? '✓' : t.focusClockPanel.saveButton }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useLocale } from 'src/composables/useLocale';
import { MAX_DISPLAY_NAME, useDisplayName } from 'src/composables/useDisplayName';

const { t } = useLocale();
const { displayName, setDisplayName } = useDisplayName();
const inputId = `name-${Math.random().toString(36).slice(2, 8)}`;
const draft = ref(displayName.value);
const saved = ref(false);
const changed = computed(() => !!draft.value.trim() && draft.value.trim() !== displayName.value);

watch(displayName, (name) => {
  draft.value = name;
});
watch(draft, () => {
  saved.value = false;
});

function save(): void {
  if (!changed.value) return;
  draft.value = setDisplayName(draft.value);
  saved.value = true;
}
</script>
