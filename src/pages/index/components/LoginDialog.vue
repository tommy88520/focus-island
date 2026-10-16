<template>
  <!-- 要登入才能用的功能（自己的家）：說明為什麼要登入，直接放 Google 登入鈕 -->
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" @show="renderButton">
    <div class="pixel-panel w-[min(22rem,calc(100vw-2rem))] p-5 text-center">
      <p class="!mb-1 text-3xl">🏠</p>
      <p class="!mb-1 text-base font-black">{{ title }}</p>
      <p class="!mb-4 text-xs text-[color:var(--px-muted)]">{{ hint }}</p>
      <!-- 登入鈕的位置先留好（固定大小），按鈕載入好之前顯示一條灰色佔位，出現時淡入，視窗不會跳 -->
      <div class="relative mx-auto h-[44px] w-[240px]">
        <div v-if="!ready" class="absolute inset-0 animate-pulse rounded-[4px] bg-[color:var(--px-panel-2)]"></div>
        <div ref="buttonRef" class="absolute inset-0 !flex justify-center transition-opacity duration-200" :class="ready ? 'opacity-100' : 'opacity-0'"></div>
      </div>
      <p v-if="error" class="!mb-0 mt-2 text-xs font-bold text-[#e25a4a]">{{ error }}</p>
      <button type="button" class="pixel-btn mt-4 h-8 px-4 text-xs" @click="emit('update:modelValue', false)">{{ t.home.later }}</button>
    </div>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { GOOGLE_CLIENT_ID, useAccount } from 'src/composables/useAccount';
import { renderGoogleButton } from 'src/composables/googleIdentity';
import { useLocale } from 'src/composables/useLocale';

defineProps<{ modelValue: boolean; title: string; hint: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; 'logged-in': [] }>();
const { t, locale } = useLocale();
const $q = useQuasar();
const account = useAccount();
const buttonRef = ref<HTMLDivElement | null>(null);
const error = ref('');
const ready = ref(false);

function renderButton(): void {
  if (!buttonRef.value) return;
  error.value = '';
  ready.value = false;
  renderGoogleButton(
    buttonRef.value,
    GOOGLE_CLIENT_ID,
    (credential) => {
      void account.loginWithGoogle(credential).then((ok) => {
        if (!ok) {
          error.value = t.value.settingsPage.accountLoginFailed;
          return;
        }
        emit('update:modelValue', false);
        emit('logged-in');
      });
    },
    { dark: $q.dark.isActive, locale: locale.value },
  )
    .then(() => {
      // Google 的 iframe 畫好還要一下下
      window.setTimeout(() => (ready.value = true), 150);
    })
    .catch(() => {
      ready.value = true;
      error.value = t.value.settingsPage.accountLoadFailed;
    });
}
</script>
