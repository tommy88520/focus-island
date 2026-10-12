<template>
  <!-- 專注中想離開座位：先問一聲，確定才結束專注 -->
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <div class="pixel-panel w-[min(92vw,340px)] p-4">
      <p class="text-sm font-black">{{ t.leaveFocus.title }}</p>
      <p class="mt-1.5 text-xs text-[color:var(--px-muted)]">{{ t.leaveFocus.body }}</p>
      <div class="mt-4 flex !flex-nowrap justify-end gap-2">
        <button v-close-popup type="button" class="pixel-btn h-9 px-3 text-xs">{{ t.leaveFocus.stay }}</button>
        <button type="button" class="pixel-btn pixel-btn--danger h-9 px-3 text-xs" @click="emit('confirm')">{{ t.leaveFocus.leave }}</button>
      </div>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { useLocale } from 'src/composables/useLocale';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; confirm: [] }>();
const { t } = useLocale();
</script>
