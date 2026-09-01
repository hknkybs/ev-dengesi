export type HouseholdType = 'couple' | 'roommates' | 'family';

export type HouseholdMode = 'collaborative' | 'competitive';

export type TemplateKey = '1+1' | '2+1' | '3+1' | 'ogrenci-evi' | 'mustakil';

export interface Household {
  id: string;
  name: string;
  type: HouseholdType;
  mode: HouseholdMode;
  inviteCode: string;
  createdAt: number;
}

export interface Member {
  id: string;
  displayName: string;
  color: string;
  emoji: string;
  joinedAt: number;
  leftAt: number | null;
}

export interface Room {
  id: string;
  name: string;
  icon: string;
}

export interface TaskTemplate {
  id: string;
  roomId: string;
  name: string;
  basePoints: number;
  expectedPeriodHours: number;
  cooldownHours: number;
  isInvisibleLabor: boolean;
}

export type CompletionStatus = 'valid' | 'disputed' | 'no_points';

export interface Completion {
  id: string;
  taskTemplateId: string;
  memberId: string;
  completedAt: number;
  awardedPoints: number;
  status: CompletionStatus;
}

export interface AppState {
  household: Household | null;
  members: Member[];
  rooms: Room[];
  taskTemplates: TaskTemplate[];
  completions: Completion[];
  activeMemberId: string | null;
  notificationsEnabled: boolean;
  scheduledNotifications: Record<string, string>;
}
