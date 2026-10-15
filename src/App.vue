<template>
  <router-view />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { logConsoleBanner } from 'hey-console';

onMounted(() => {
  if (import.meta.env.PROD) {
    logConsoleBanner('tommy');
  }
});
</script>
