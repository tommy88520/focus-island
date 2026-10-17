<template>
  <!-- 好友（在自己家裡打開）：我的好友碼、用碼加好友、別人的邀請、好友清單（去他家） -->
  <div class="pixel-panel absolute inset-x-2 bottom-2 top-2 z-10 !flex flex-col overflow-hidden p-3 sm:left-1/2 sm:right-auto sm:w-[26rem] sm:-translate-x-1/2">
    <div class="!flex !flex-nowrap items-center justify-between gap-2">
      <p class="!mb-0 text-sm font-black">👥 {{ t.friends.title }}</p>
      <button type="button" class="text-[color:var(--px-muted)]" :aria-label="t.seatScene.profileClose" @click="emit('close')">
        <q-icon name="close" size="18px" />
      </button>
    </div>

    <div class="mt-2 min-h-0 flex-1 space-y-3 overflow-y-auto">
      <!-- 我的好友碼 -->
      <div class="pixel-field !flex !flex-nowrap items-center justify-between gap-2 px-3 py-2">
        <div class="min-w-0">
          <p class="!mb-0 text-[10px] font-black tracking-wide text-[color:var(--px-muted)]">{{ t.friends.myCode }}</p>
          <p class="font-pixel !mb-0 text-lg font-bold tracking-[0.2em]">{{ myCode || '……' }}</p>
        </div>
        <button type="button" class="pixel-btn h-9 shrink-0 px-3 text-xs" :disabled="!myCode" @click="shareCode">
          {{ copied ? t.friends.copied : t.friends.share }}
        </button>
      </div>

      <!-- 加好友 -->
      <form class="!flex !flex-nowrap gap-2" @submit.prevent="submit">
        <input
          v-model="codeInput"
          class="pixel-field h-10 min-w-0 flex-1 px-3 font-pixel text-base uppercase tracking-[0.2em]"
          :placeholder="t.friends.codePlaceholder"
          maxlength="6"
          autocapitalize="characters"
          autocomplete="off"
          spellcheck="false"
        />
        <button type="submit" class="pixel-btn pixel-btn--primary h-10 shrink-0 px-3 text-xs" :disabled="codeInput.trim().length !== 6 || busy">
          {{ t.friends.add }}
        </button>
      </form>
      <p v-if="message" class="!mb-0 -mt-1 text-xs font-bold" :class="messageOk ? 'text-emerald-500' : 'text-[#e25a4a]'">{{ message }}</p>

      <!-- 別人邀請我 -->
      <div v-if="incoming.length">
        <p class="!mb-1 text-[10px] font-black tracking-wide text-[color:var(--px-muted)]">{{ t.friends.incoming }}</p>
        <div v-for="p in incoming" :key="p.code" class="pixel-field mb-1.5 !flex !flex-nowrap items-center gap-2 px-2 py-1.5">
          <FriendAvatar :look="p.look" />
          <span class="min-w-0 flex-1 truncate text-sm font-bold">{{ p.name }}</span>
          <button type="button" class="pixel-btn pixel-btn--primary h-8 shrink-0 px-2 text-xs" @click="accept(p.code)">{{ t.friends.accept }}</button>
          <button type="button" class="pixel-btn h-8 shrink-0 px-2 text-xs" @click="remove(p.code)">{{ t.friends.decline }}</button>
        </div>
      </div>

      <!-- 好友 -->
      <div>
        <p class="!mb-1 text-[10px] font-black tracking-wide text-[color:var(--px-muted)]">{{ t.friends.list(friends.length) }}</p>
        <p v-if="!friends.length" class="!mb-0 text-xs text-[color:var(--px-muted)]">{{ t.friends.empty }}</p>
        <div v-for="p in friends" :key="p.code" class="pixel-field mb-1.5 !flex !flex-nowrap items-center gap-2 px-2 py-1.5">
          <FriendAvatar :look="p.look" />
          <span class="min-w-0 flex-1 truncate text-sm font-bold">{{ p.theme === 'villa' ? '🏡 ' : '' }}{{ p.name }}</span>
          <button type="button" class="pixel-btn pixel-btn--primary h-8 shrink-0 px-2 text-xs" @click="emit('visit', p.code)">🏠 {{ t.friends.visit }}</button>
          <button type="button" class="pixel-btn h-8 w-8 shrink-0 text-xs" :aria-label="t.friends.remove" :title="t.friends.remove" @click="confirmRemove(p)">
            <q-icon name="person_remove" size="16px" />
          </button>
        </div>
      </div>

      <!-- 我送出的邀請 -->
      <div v-if="outgoing.length">
        <p class="!mb-1 text-[10px] font-black tracking-wide text-[color:var(--px-muted)]">{{ t.friends.outgoing }}</p>
        <div v-for="p in outgoing" :key="p.code" class="pixel-field mb-1.5 !flex !flex-nowrap items-center gap-2 px-2 py-1.5">
          <FriendAvatar :look="p.look" />
          <span class="min-w-0 flex-1 truncate text-sm font-bold">{{ p.name }}</span>
          <button type="button" class="pixel-btn h-8 shrink-0 px-2 text-xs" @click="remove(p.code)">{{ t.friends.cancel }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useLocale } from 'src/composables/useLocale';
import { useFriends, type FriendProfile } from 'src/composables/useFriends';
import FriendAvatar from 'src/pages/index/components/FriendAvatar.vue';

const emit = defineEmits<{ close: []; visit: [code: string] }>();
const { t } = useLocale();
const { myCode, friends, incoming, outgoing, refresh, add, accept, remove } = useFriends();
const codeInput = ref('');
const message = ref('');
const messageOk = ref(false);
const busy = ref(false);
const copied = ref(false);

async function submit(): Promise<void> {
  busy.value = true;
  const result = await add(codeInput.value);
  busy.value = false;
  messageOk.value = result === 'sent' || result === 'accepted' || result === 'pending' || result === 'already';
  message.value = t.value.friends.result[result];
  if (messageOk.value) codeInput.value = '';
}

function confirmRemove(p: FriendProfile): void {
  if (window.confirm(t.value.friends.removeConfirm(p.name))) void remove(p.code);
}

// 分享好友碼：手機用系統分享，電腦複製
async function shareCode(): Promise<void> {
  const text = t.value.friends.shareText(myCode.value);
  try {
    if (window.matchMedia('(pointer: coarse)').matches && typeof navigator.share === 'function') {
      await navigator.share({ text });
      return;
    }
    await navigator.clipboard.writeText(text);
    copied.value = true;
    window.setTimeout(() => (copied.value = false), 1800);
  } catch {
    // 使用者取消分享
  }
}

onMounted(() => {
  void refresh();
});
</script>
