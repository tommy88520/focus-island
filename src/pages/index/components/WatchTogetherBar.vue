<template>
  <!-- 一起看 YouTube：疊在底部工具列上面的一小條。三種：我在分享／我在跟別人看／別人邀請（按了才看） -->
  <div v-if="watch.hosting.value || watch.followingName.value || invite" class="pixel-panel watch-bar mb-1.5 px-2.5 py-2 text-[11px]">
    <div v-if="watch.hosting.value" class="!flex !flex-nowrap items-center gap-2">
      <span class="min-w-0 flex-1 truncate font-bold">{{ t.watchTogether.sharing }}</span>
      <button type="button" class="pixel-btn h-8 shrink-0 px-3 text-[11px]" @click="watch.stopHosting()">{{ t.watchTogether.stopShare }}</button>
    </div>
    <div v-else-if="watch.followingName.value" class="!flex !flex-nowrap items-center gap-2">
      <span class="min-w-0 flex-1 truncate font-bold">{{ t.watchTogether.followingWith(watch.followingName.value) }}</span>
      <button type="button" class="pixel-btn h-8 shrink-0 px-3 text-[11px]" @click="watch.leave()">{{ t.watchTogether.leave }}</button>
    </div>
    <template v-else-if="invite">
      <div class="!flex !flex-nowrap items-center gap-2">
        <div class="min-w-0 flex-1">
          <p class="!mb-0 truncate font-black">{{ t.watchTogether.inviteFrom(invite.name) }}</p>
          <p class="!mb-0 truncate text-[10px] text-[color:var(--px-muted)]">{{ invite.title || t.watchTogether.untitled }}</p>
        </div>
        <button type="button" class="pixel-btn pixel-btn--primary h-8 shrink-0 px-3 text-[11px]" @click="watch.join()">▶ {{ t.watchTogether.join }}</button>
        <button type="button" class="pixel-btn h-8 shrink-0 px-2 text-[11px]" @click="watch.dismiss()">{{ t.watchTogether.dismiss }}</button>
      </div>
      <button type="button" class="mt-1 text-[10px] font-bold text-[color:var(--px-muted)] underline" @click="block(invite.fromUserId)">
        {{ t.watchTogether.block }}
      </button>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useLocale } from 'src/composables/useLocale';
import { usePlayerPrefs } from 'src/composables/usePlayerPrefs';
import type { WatchTogether } from '../composables/useWatchTogether';

const props = defineProps<{ watch: WatchTogether }>();
const { t } = useLocale();
const prefs = usePlayerPrefs();
const invite = computed(() => props.watch.visibleInvite.value);

function block(userId: string): void {
  if (!prefs.value.blocked.includes(userId)) prefs.value.blocked = [...prefs.value.blocked, userId];
}
</script>

<style scoped>
/* 手機跟工具列一樣寬；電腦版不要比工具列寬太多 */
@media (min-width: 640px) {
  .watch-bar {
    max-width: 30rem;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
