import { Completion, Household, Member, Room, TaskTemplate } from '../types';

function toMillis(value: string | null): number {
  return value ? new Date(value).getTime() : 0;
}

export function mapHousehold(row: any): Household {
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    mode: row.mode,
    inviteCode: row.invite_code,
    createdAt: toMillis(row.created_at),
  };
}

export function mapMember(row: any): Member {
  return {
    id: row.id,
    userId: row.user_id,
    displayName: row.display_name,
    color: row.color,
    emoji: row.emoji,
    joinedAt: toMillis(row.joined_at),
    leftAt: row.left_at ? toMillis(row.left_at) : null,
  };
}

export function mapRoom(row: any): Room {
  return { id: row.id, name: row.name, icon: row.icon };
}

export function mapTaskTemplate(row: any): TaskTemplate {
  return {
    id: row.id,
    roomId: row.room_id,
    name: row.name,
    basePoints: row.base_points,
    expectedPeriodHours: Number(row.expected_period_hours),
    cooldownHours: Number(row.cooldown_hours),
    isInvisibleLabor: row.is_invisible_labor,
    assignedMemberId: row.assigned_member_id,
  };
}

export function mapCompletion(row: any): Completion {
  return {
    id: row.id,
    taskTemplateId: row.task_template_id,
    memberId: row.member_id,
    completedAt: toMillis(row.completed_at),
    awardedPoints: row.awarded_points,
    status: row.status,
  };
}
