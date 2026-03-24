<template>
  <q-page class="flex flex-center bg-slate-900">
    <div
      class="p-8 md:p-12 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl text-center transform hover:scale-105 transition-all duration-300"
    >
      <h1
        class="text-4xl md:text-6xl font-black bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-4"
      >
        Tailwind v4 + Quasar
      </h1>

      <p class="text-slate-300 text-lg mb-8">
        如果看到藍色漸層文字、磨砂玻璃背景與縮放動畫，代表設定成功！
      </p>

      <div class="flex gap-4 justify-center">
        <q-btn unelevated color="primary" label="Quasar Button" class="px-6 py-2" />
        <button
          class="px-6 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full font-bold shadow-lg shadow-rose-500/30 transition-colors"
        >
          Tailwind Button
        </button>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { Todo, Meta } from 'components/models';
import ExampleComponent from 'components/ExampleComponent.vue';

const todos = ref<Todo[]>([
  {
    id: 1,
    content: 'ct1',
  },
  {
    id: 2,
    content: 'ct2',
  },
  {
    id: 3,
    content: 'ct3',
  },
  {
    id: 4,
    content: 'ct4',
  },
  {
    id: 5,
    content: 'ct5',
  },
]);

const meta = ref<Meta>({
  totalCount: 1200,
});
</script>
