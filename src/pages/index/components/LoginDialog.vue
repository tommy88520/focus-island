<template>
  <!-- 要登入才能用的功能（自己的家）。沒登入時這個視窗一直掛在頁面上、平常透明（不用 visibility:hidden，Google 才會先把按鈕排好大小）：
       Google 的登入鈕在頁面載入後就先畫好，打開視窗時按鈕已經在了，不會「空的 → 佔位 → 真按鈕」換來換去。
       （q-dialog 每次打開都重建內容，iframe 會重新載入，所以不用它） -->
  <Teleport to="body">
    <div
      class="fixed inset-0 z-[6000] !flex items-center justify-center bg-black/50 px-4 transition-opacity duration-200"
      :class="modelValue ? 'opacity-100' : 'pointer-events-none opacity-0'"
      :aria-hidden="!modelValue"
      :inert="!modelValue"
      @click.self="close"
    >
      <div class="pixel-panel w-[min(22rem,calc(100vw-2rem))] p-5 text-center" role="dialog" aria-modal="true" :aria-label="title">
        <p class="!mb-1 text-3xl">🏠</p>
        <p class="!mb-1 text-base font-black">{{ title }}</p>
        <p class="!mb-4 text-xs text-[color:var(--px-muted)]">{{ hint }}</p>
        <div ref="buttonRef" class="mx-auto !flex h-[44px] w-[260px] justify-center"></div>
        <p v-if="error" class="!mb-0 mt-2 text-xs font-bold text-[#e25a4a]">{{ error }}</p>
        <button type="button" class="pixel-btn mt-4 h-8 px-4 text-xs" @click="close">{{ t.home.later }}</button>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useQuasar } from 'quasar';
import { GOOGLE_CLIENT_ID, useAccount } from 'src/composables/useAccount';
import { renderGoogleButton } from 'src/composables/googleIdentity';
import { useLocale } from 'src/composables/useLocale';

const props = defineProps<{ modelValue: boolean; title: string; hint: string }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean]; 'logged-in': [] }>();
const { t, locale } = useLocale();
const $q = useQuasar();
const account = useAccount();
const buttonRef = ref<HTMLDivElement | null>(null);
const error = ref('');

function close(): void {
  emit('update:modelValue', false);
}

function onKey(event: KeyboardEvent): void {
  if (props.modelValue && event.key === 'Escape') close();
}

// 畫 Google 登入鈕（深淺色、語言換了要重畫；平常只畫一次）
function renderButton(): void {
  if (!buttonRef.value) return;
  buttonRef.value.innerHTML = '';
  renderGoogleButton(
    buttonRef.value,
    GOOGLE_CLIENT_ID,
    (credential) => {
      void account.loginWithGoogle(credential).then((ok) => {
        if (!ok) {
          error.value = t.value.settingsPage.accountLoginFailed;
          // 失敗了：按鈕重畫一次，才能再按
          renderButton();
          return;
        }
        error.value = '';
        close();
        emit('logged-in');
      });
    },
    { dark: $q.dark.isActive, locale: locale.value },
  ).catch(() => {
    error.value = t.value.settingsPage.accountLoadFailed;
  });
}

// 按了 Google 登入、跳去 Google 的視窗後沒登入就回來（取消、關掉），Google 的按鈕會卡住不能再按：
// 視窗開著的時候，頁面一回到前景就把按鈕重畫
function onReturn(): void {
  if (props.modelValue && document.visibilityState === 'visible') renderButton();
}

onMounted(() => {
  window.addEventListener('keydown', onKey);
  window.addEventListener('focus', onReturn);
  document.addEventListener('visibilitychange', onReturn);
  // 等頁面其他東西先載完再畫，不要搶開場
  window.setTimeout(renderButton, 1500);
});
watch([() => $q.dark.isActive, locale], renderButton);
// 打開時還沒畫好（例如載入失敗過、上次按過沒成功）：重畫
watch(
  () => props.modelValue,
  (open) => {
    if (open && (error.value || !buttonRef.value?.querySelector('iframe'))) {
      error.value = '';
      renderButton();
    }
  },
);

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKey);
  window.removeEventListener('focus', onReturn);
  document.removeEventListener('visibilitychange', onReturn);
});
</script>
