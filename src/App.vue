<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { logConsoleBanner } from 'hey-console';
import { installTouchDebug } from 'src/utils/touchDebug';

onMounted(() => {
  installTouchDebug();
  if (import.meta.env.PROD) {
    logConsoleBanner('tommy');
  }
});
</script>
