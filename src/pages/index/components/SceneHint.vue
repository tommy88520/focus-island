<template>
  <!-- 地圖下方的操作說明：手機上只留一行（不會被底部工具列蓋住），點一下展開／收起；電腦版整段顯示 -->
  <p
    class="mt-1.5 px-2 text-center text-[10px] font-bold leading-snug tracking-wide text-slate-500 dark:!text-white/55 max-sm:cursor-pointer"
    :class="{ 'max-sm:line-clamp-1': !open }"
    :aria-expanded="open"
    @click="open = !open"
  >
    {{ text }}
  </p>
</template>

<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ text: string }>();
const open = ref(false);
</script>
