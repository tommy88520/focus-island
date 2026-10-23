// 過場動畫：坐捷運、搭電梯、走樓梯、回家／出門、一般載入。
// 觸發的地方先 playTransition(種類, 字)，SceneTransition.vue 蓋在地圖上播，播完（而且載入好了）才收掉。
import { ref } from 'vue';

export type TransitionKind = 'mrt' | 'elevator' | 'stairs' | 'home' | 'loading';

export interface TransitionState {
  kind: TransitionKind;
  label: string;
  // 捷運線的顏色（紅線＝分區、綠線＝公園／北投、橘＝F1）
  line?: 'red' | 'green' | 'orange' | 'blue' | 'brown' | 'hsr';
  // 搭電梯／走樓梯：往上還往下
  up?: boolean;
  startedAt: number;
}

export const transition = ref<TransitionState | null>(null);

export function playTransition(kind: TransitionKind, label = '', extra: Pick<TransitionState, 'line' | 'up'> = {}): void {
  transition.value = { kind, label, ...extra, startedAt: performance.now() };
}
