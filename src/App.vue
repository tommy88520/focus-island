<template>
  <router-view />
  <PullToRefresh />
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { logConsoleBanner } from 'hey-console';
import PullToRefresh from 'src/components/PullToRefresh.vue';

onMounted(() => {
  if (import.meta.env.PROD) {
    logConsoleBanner('tommy');
  }
});
</script>
