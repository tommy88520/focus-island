<template>
  <!-- 回報問題：寫描述、可以附一張截圖；版本、裝置、在哪張地圖自動帶上。只有維護者看得到 -->
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <form class="pixel-panel w-[min(28rem,calc(100vw-2rem))] p-4" @submit.prevent="send">
      <div class="!flex !flex-nowrap items-center justify-between gap-2">
        <p class="!mb-0 text-base font-black">🐞 {{ t.bugReport.title }}</p>
        <button type="button" class="text-[color:var(--px-muted)]" :aria-label="t.seatScene.profileClose" @click="emit('update:modelValue', false)">
          <q-icon name="close" size="18px" />
        </button>
      </div>
      <p class="!mb-0 mt-1 text-[11px] text-[color:var(--px-muted)]">{{ t.bugReport.hint }}</p>

      <textarea
        v-model="message"
        rows="5"
        :maxlength="MAX_MESSAGE"
        class="pixel-field mt-3 block w-full resize-none px-3 py-2 text-sm focus:outline-none"
        :placeholder="t.bugReport.placeholder"
      />
      <p class="!mb-0 mt-0.5 text-right text-[10px] text-[color:var(--px-muted)]">{{ message.length }} / {{ MAX_MESSAGE }}</p>

      <!-- 截圖（可不附）：先在瀏覽器縮到 1280px 的 JPEG 再送 -->
      <div class="mt-2 !flex !flex-nowrap items-center gap-2">
        <label class="pixel-btn h-9 shrink-0 cursor-pointer px-3 text-xs">
          📷 {{ image ? t.bugReport.changeImage : t.bugReport.addImage }}
          <input type="file" accept="image/*" class="hidden" @change="pickImage" />
        </label>
        <img v-if="image" :src="image" alt="" class="h-9 w-14 shrink-0 rounded-[2px] object-cover" />
        <button v-if="image" type="button" class="text-[11px] font-bold text-[color:var(--px-muted)] underline" @click="image = ''">{{ t.bugReport.removeImage }}</button>
        <span v-if="imageError" class="text-[11px] text-red-500">{{ imageError }}</span>
      </div>

      <p class="!mb-0 mt-3 text-[10px] text-[color:var(--px-muted)]">{{ t.bugReport.contextNote }}</p>
      <button type="submit" class="pixel-btn pixel-btn--primary mt-2 h-10 w-full text-sm" :disabled="!message.trim() || sending">
        {{ sending ? t.bugReport.sending : t.bugReport.send }}
      </button>
    </form>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useQuasar } from 'quasar';
import { useLocale } from 'src/composables/useLocale';
import { useDisplayName } from 'src/composables/useDisplayName';
import { accountRequest, useAccount } from 'src/composables/useAccount';

defineProps<{ modelValue: boolean }>();
const emit = defineEmits<{ 'update:modelValue': [value: boolean] }>();

const MAX_MESSAGE = 2000;
const MAX_IMAGE_SIDE = 1280;
const { t, locale } = useLocale();
const $q = useQuasar();
const { displayName } = useDisplayName();
const account = useAccount();

const message = ref('');
const image = ref('');
const imageError = ref('');
const sending = ref(false);

function readJson(key: string): unknown {
  try {
    return JSON.parse(localStorage.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}

// 自動帶的環境資訊（不含任何帳號密碼、登入權杖）
function collectContext(): Record<string, unknown> {
  const standalone = window.matchMedia?.('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return {
    version: process.env.APP_VERSION ?? '',
    path: window.location.pathname,
    ua: navigator.userAgent,
    screen: `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}`,
    standalone,
    lang: locale.value,
    dark: document.body.classList.contains('body--dark'),
    loggedIn: !!account.session.value,
    room: readJson('focus_island_current_room_info_v1'),
    lastLocation: readJson('focus_island_last_location_v1'),
    scene: readJson('focus_island_scene_v1'),
  };
}

function shrinkImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_SIDE / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext('2d')?.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('bad image'));
    };
    img.src = url;
  });
}

async function pickImage(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  imageError.value = '';
  if (!file) return;
  try {
    image.value = await shrinkImage(file);
  } catch {
    imageError.value = t.value.bugReport.imageFailed;
  }
}

async function send(): Promise<void> {
  const text = message.value.trim();
  if (!text || sending.value) return;
  sending.value = true;
  try {
    const res = await accountRequest('/api/v1/feedback', {
      method: 'POST',
      body: JSON.stringify({
        message: text,
        context: collectContext(),
        ...(image.value ? { image: image.value } : {}),
        clientId: localStorage.getItem('lib_uid') ?? '',
        name: displayName.value,
      }),
    });
    if (res.ok) {
      message.value = '';
      image.value = '';
      emit('update:modelValue', false);
      $q.notify({ message: t.value.bugReport.thanks, color: 'positive', icon: 'task_alt', position: 'top', timeout: 3000 });
    } else {
      $q.notify({ message: res.status === 429 ? t.value.bugReport.tooMany : t.value.bugReport.failed, color: 'warning', position: 'top', timeout: 3000 });
    }
  } catch {
    $q.notify({ message: t.value.bugReport.failed, color: 'warning', position: 'top', timeout: 3000 });
  } finally {
    sending.value = false;
  }
}
</script>
