import { Completion, Member, Room, TaskTemplate } from '../types';

export type StaleBucket = 'fresh' | 'ok' | 'warn' | 'overdue' | 'critical';

export function getLastCompletion(
  completions: Completion[],
  taskTemplateId: string
): Completion | undefined {
  let last: Completion | undefined;
  for (const c of completions) {
    if (c.taskTemplateId !== taskTemplateId) continue;
    if (c.status === 'no_points' && last && last.status !== 'no_points') continue;
    if (!last || c.completedAt > last.completedAt) last = c;
  }
  return last;
}

export function getStalenessRatio(task: TaskTemplate, lastCompletedAt: number | null): number {
  if (!task.expectedPeriodHours) return 0;
  const hoursSince = lastCompletedAt
    ? (Date.now() - lastCompletedAt) / (1000 * 60 * 60)
    : task.expectedPeriodHours * 3;
  return hoursSince / task.expectedPeriodHours;
}

export function ratioToBucket(ratio: number): StaleBucket {
  if (ratio < 0.5) return 'fresh';
  if (ratio < 1) return 'ok';
  if (ratio < 1.5) return 'warn';
  if (ratio < 2.5) return 'overdue';
  return 'critical';
}

export function getRoomStaleness(
  room: Room,
  tasks: TaskTemplate[],
  completions: Completion[]
): { ratio: number; bucket: StaleBucket } {
  const roomTasks = tasks.filter((t) => t.roomId === room.id && !t.isInvisibleLabor);
  if (roomTasks.length === 0) return { ratio: 0, bucket: 'fresh' };
  let maxRatio = 0;
  for (const t of roomTasks) {
    const last = getLastCompletion(completions, t.id);
    const ratio = getStalenessRatio(t, last ? last.completedAt : null);
    if (ratio > maxRatio) maxRatio = ratio;
  }
  return { ratio: maxRatio, bucket: ratioToBucket(maxRatio) };
}

export function isWithinCooldown(task: TaskTemplate, lastValidAt: number | null): boolean {
  if (!lastValidAt) return false;
  const hoursSince = (Date.now() - lastValidAt) / (1000 * 60 * 60);
  return hoursSince < task.cooldownHours;
}

export function currentYearMonth(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function isSameYearMonth(timestamp: number, yearMonth: string): boolean {
  return currentYearMonth(new Date(timestamp)) === yearMonth;
}

export interface MemberScore {
  member: Member;
  points: number;
  sharePercent: number;
  taskCount: number;
}

export function getMonthlyScores(
  members: Member[],
  completions: Completion[],
  yearMonth: string
): MemberScore[] {
  const active = members.filter((m) => !m.leftAt);
  const totals = new Map<string, { points: number; count: number }>();
  for (const m of active) totals.set(m.id, { points: 0, count: 0 });

  for (const c of completions) {
    if (c.status !== 'valid') continue;
    if (!isSameYearMonth(c.completedAt, yearMonth)) continue;
    const entry = totals.get(c.memberId);
    if (!entry) continue;
    entry.points += c.awardedPoints;
    entry.count += 1;
  }

  const grandTotal = Array.from(totals.values()).reduce((s, t) => s + t.points, 0);

  return active.map((member) => {
    const entry = totals.get(member.id) ?? { points: 0, count: 0 };
    return {
      member,
      points: entry.points,
      taskCount: entry.count,
      sharePercent: grandTotal > 0 ? Math.round((entry.points / grandTotal) * 100) : 0,
    };
  });
}

export interface CategoryShare {
  room: Room;
  points: number;
}

export function getCategoryBreakdown(
  memberId: string,
  rooms: Room[],
  taskTemplates: TaskTemplate[],
  completions: Completion[],
  yearMonth: string
): CategoryShare[] {
  const pointsByRoom = new Map<string, number>();
  for (const c of completions) {
    if (c.status !== 'valid' || c.memberId !== memberId) continue;
    if (!isSameYearMonth(c.completedAt, yearMonth)) continue;
    const task = taskTemplates.find((t) => t.id === c.taskTemplateId);
    if (!task) continue;
    pointsByRoom.set(task.roomId, (pointsByRoom.get(task.roomId) ?? 0) + c.awardedPoints);
  }
  return rooms
    .map((room) => ({ room, points: pointsByRoom.get(room.id) ?? 0 }))
    .filter((r) => r.points > 0)
    .sort((a, b) => b.points - a.points);
}
