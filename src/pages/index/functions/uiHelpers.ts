export type FloorLoadLike = {
  occupancy: number;
  capacity: number;
};

export function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function clampOccupancy(value: number, capacity: number) {
  return Math.max(0, Math.min(capacity, Math.round(value)));
}

export function getHeatColor(percent: number) {
  if (percent > 80) return 'bg-rose-500';
  if (percent > 50) return 'bg-orange-400';
  if (percent > 20) return 'bg-teal-400';
  return 'bg-slate-500';
}

export function getZoneHeatTextClass(occupancyStr: string) {
  const [currentRaw = '0', totalRaw = '1'] = (occupancyStr ?? '0/1').split('/');
  const current = Number(currentRaw);
  const total = Number(totalRaw);

  if (!Number.isFinite(current) || !Number.isFinite(total) || total <= 0) {
    return 'text-white/20';
  }

  const ratio = current / total;
  if (ratio > 0.7) return 'text-rose-400';
  if (ratio > 0.3) return 'text-teal-400';
  return 'text-white/20';
}

export function getFloorLoadPercent(floor: FloorLoadLike) {
  if (!floor.capacity) return 0;
  return clampPercent((floor.occupancy / floor.capacity) * 100);
}

export function getFloorLoadLabel(percent: number) {
  if (percent >= 80) return '高';
  if (percent >= 40) return '中';
  return '低';
}

export function getFloorLoadLabelClass(percent: number, isCurrentFloor: boolean) {
  if (percent >= 80) return isCurrentFloor ? 'text-rose-600' : 'text-rose-300';
  if (percent >= 40) {
    return isCurrentFloor ? 'text-orange-700' : 'text-orange-300';
  }
  return isCurrentFloor ? 'text-teal-700' : 'text-teal-300';
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
