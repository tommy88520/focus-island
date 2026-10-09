// 「一起專注」：用時鐘對齊，每個整點和半點開始 25 分鐘專注、接著休息 5 分鐘。
// 大家看的是自己的時鐘，所以不用伺服器也會同步（誤差就是各自電腦時間的誤差）。

export const GROUP_CYCLE_S = 30 * 60;
export const GROUP_FOCUS_S = 25 * 60;

export interface GroupPhase {
  phase: 'focus' | 'break';
  // 這個階段還剩幾秒
  secondsLeft: number;
  // 下一輪專注開始的時間
  nextStart: Date;
}

export function groupPhaseAt(now: Date): GroupPhase {
  const secondsIntoHour = now.getMinutes() * 60 + now.getSeconds();
  const intoCycle = secondsIntoHour % GROUP_CYCLE_S;
  const nextStart = new Date(now.getTime() + (GROUP_CYCLE_S - intoCycle) * 1000);
  nextStart.setMilliseconds(0);
  if (intoCycle < GROUP_FOCUS_S) return { phase: 'focus', secondsLeft: GROUP_FOCUS_S - intoCycle, nextStart };
  return { phase: 'break', secondsLeft: GROUP_CYCLE_S - intoCycle, nextStart };
}
