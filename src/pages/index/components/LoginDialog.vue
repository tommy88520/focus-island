<template>
  <!-- 要登入才能用的功能（自己的家）：說明為什麼要登入，直接放 Google 登入鈕 -->
  <q-dialog :model-value="modelValue" transition-show="fade" transition-hide="fade" @update:model-value="emit('update:modelValue', $event)" @show="renderButton">
    <div class="pixel-panel w-[min(22rem,calc(100vw-2rem))] p-5 text-center">
      <p class="!mb-1 text-3xl">🏠</p>
      <p class="!mb-1 text-base font-black">{{ title }}</p>
      <p class="!mb-4 text-xs text-[color:var(--px-muted)]">{{ hint }}</p>
      <!-- 登入鈕的位置先留好（固定大小），按鈕載入好之前顯示一條灰色佔位，出現時淡入，視窗不會跳 -->
      <div class="relative mx-auto h-[44px] w-[260px]">
        <!-- 佔位長得跟最後的按鈕一樣（同大小、同字），Google 的按鈕真的畫好才換上，看起來不會閃 -->
        <div
          v-if="!ready"
          class="absolute inset-y-[2px] left-[10px] right-[10px] !flex !flex-nowrap items-center overflow-hidden rounded-[4px] text-[15px]"
          :class="$q.dark.isActive ? 'bg-[#131314] text-[#e3e3e3]' : 'border border-[#747775] bg-white text-[#1f1f1f]'"
        >
          <span class="!flex h-full w-10 shrink-0 items-center justify-center bg-white text-lg font-bold text-[#4285f4]">G</span>
          <span class="flex-1 text-center">{{ t.home.googleSignIn }}</span>
        </div>
        <div ref="buttonRef" class="absolute inset-0 !flex justify-center" :class="ready ? 'visible' : 'invisible'"></div>
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

// Google 的按鈕是一個 iframe：等它真的載完（load）再多等一點點讓它畫好，才換掉佔位；最多等 3 秒
function waitForButton(): void {
  const done = () => window.setTimeout(() => (ready.value = true), 250);
  const fallback = window.setTimeout(() => (ready.value = true), 3000);
  const check = (tries: number) => {
    const iframe = buttonRef.value?.querySelector('iframe');
    if (iframe) {
      iframe.addEventListener(
        'load',
        () => {
          window.clearTimeout(fallback);
          done();
        },
        { once: true },
      );
      return;
    }
    if (tries > 0) window.setTimeout(() => check(tries - 1), 50);
  };
  check(40);
}

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
    .then(() => waitForButton())
    .catch(() => {
      ready.value = true;
      error.value = t.value.settingsPage.accountLoadFailed;
    });
}
</script>
