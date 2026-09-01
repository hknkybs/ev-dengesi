import { create } from 'zustand';
import {
  BootStatus,
  Completion,
  Household,
  HouseholdMode,
  HouseholdType,
  Member,
  Room,
  TaskTemplate,
  TemplateKey,
} from '../types';
import { generateInviteCode } from '../lib/id';
import { ROOM_TEMPLATES } from '../data/roomTemplates';
import { getDefaultTasksForRoom } from '../data/taskCatalog';
import { isWithinCooldown } from '../lib/scoring';
import { cancelNotification, getExpoPushToken, scheduleStaleReminder } from '../lib/notifications';
import { ensureAnonymousSession, supabase } from '../lib/supabase';
import { mapCompletion, mapHousehold, mapMember, mapRoom, mapTaskTemplate } from '../lib/mappers';
import { memberEmojis, memberPalette } from '../theme';
import { usePrefsStore } from './prefsStore';

function defaultModeForType(type: HouseholdType): HouseholdMode {
  return type === 'roommates' ? 'competitive' : 'collaborative';
}

function upsertById<T extends { id: string }>(list: T[], item: T): T[] {
  const idx = list.findIndex((x) => x.id === item.id);
  if (idx === -1) return [...list, item];
  const next = [...list];
  next[idx] = item;
  return next;
}

function removeById<T extends { id: string }>(list: T[], id: string): T[] {
  return list.filter((x) => x.id !== id);
}

interface State {
  bootStatus: BootStatus;
  bootError: string | null;
  currentUserId: string | null;
  household: Household | null;
  members: Member[];
  rooms: Room[];
  taskTemplates: TaskTemplate[];
  completions: Completion[];
  realtimeChannel: ReturnType<typeof supabase.channel> | null;
}

interface Actions {
  init: () => Promise<void>;
  loadHouseholdData: (householdId: string) => Promise<void>;
  subscribeRealtime: (householdId: string) => void;
  createHousehold: (
    name: string,
    type: HouseholdType,
    templateKey: TemplateKey,
    ownerName: string
  ) => Promise<void>;
  joinHousehold: (inviteCode: string, displayName: string) => Promise<void>;
  leaveHousehold: () => Promise<void>;
  setHouseholdMode: (mode: HouseholdMode) => Promise<void>;
  completeTask: (taskTemplateId: string) => Promise<void>;
  renameRoom: (roomId: string, name: string) => Promise<void>;
  addRoom: (name: string, icon: string) => Promise<void>;
  removeRoom: (roomId: string) => Promise<void>;
  addTask: (
    roomId: string,
    name: string,
    basePoints: number,
    expectedPeriodHours: number,
    cooldownHours: number
  ) => Promise<void>;
  updateTask: (
    taskId: string,
    patch: Partial<
      Pick<TaskTemplate, 'name' | 'basePoints' | 'expectedPeriodHours' | 'cooldownHours' | 'assignedMemberId'>
    >
  ) => Promise<void>;
  removeTask: (taskId: string) => Promise<void>;
  registerPushToken: () => Promise<void>;
}

type Store = State & Actions;

function currentMember(state: State): Member | undefined {
  return state.members.find((m) => m.userId === state.currentUserId);
}

export const useStore = create<Store>()((set, get) => ({
  bootStatus: 'loading',
  bootError: null,
  currentUserId: null,
  household: null,
  members: [],
  rooms: [],
  taskTemplates: [],
  completions: [],
  realtimeChannel: null,

  init: async () => {
    try {
      const session = await ensureAnonymousSession();
      const userId = session?.user.id ?? null;
      set({ currentUserId: userId });

      if (!userId) {
        set({ bootStatus: 'onboarding' });
        return;
      }

      const { data: memberRow, error: memberError } = await supabase
        .from('members')
        .select('*, households(*)')
        .eq('user_id', userId)
        .is('left_at', null)
        .limit(1)
        .maybeSingle();

      if (memberError) throw memberError;

      if (!memberRow || !memberRow.households) {
        set({ bootStatus: 'onboarding' });
        return;
      }

      const householdId = memberRow.household_id as string;
      await get().loadHouseholdData(householdId);
      get().subscribeRealtime(householdId);
      set({ bootStatus: 'ready' });
    } catch (err: any) {
      set({ bootStatus: 'error', bootError: err?.message ?? 'Bilinmeyen hata' });
    }
  },

  loadHouseholdData: async (householdId: string) => {
    const [householdRes, membersRes, roomsRes, tasksRes, completionsRes] = await Promise.all([
      supabase.from('households').select('*').eq('id', householdId).single(),
      supabase.from('members').select('*').eq('household_id', householdId),
      supabase.from('rooms').select('*').eq('household_id', householdId),
      supabase.from('task_templates').select('*').eq('household_id', householdId),
      supabase.from('completions').select('*').eq('household_id', householdId),
    ]);

    if (householdRes.error) throw householdRes.error;
    if (membersRes.error) throw membersRes.error;
    if (roomsRes.error) throw roomsRes.error;
    if (tasksRes.error) throw tasksRes.error;
    if (completionsRes.error) throw completionsRes.error;

    set({
      household: mapHousehold(householdRes.data),
      members: (membersRes.data ?? []).map(mapMember),
      rooms: (roomsRes.data ?? []).map(mapRoom),
      taskTemplates: (tasksRes.data ?? []).map(mapTaskTemplate),
      completions: (completionsRes.data ?? []).map(mapCompletion),
    });
  },

  subscribeRealtime: (householdId: string) => {
    const existing = get().realtimeChannel;
    if (existing) supabase.removeChannel(existing);

    const channel = supabase
      .channel(`household-${householdId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'members', filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            set({ members: removeById(get().members, (payload.old as any).id) });
          } else {
            set({ members: upsertById(get().members, mapMember(payload.new)) });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rooms', filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            set({ rooms: removeById(get().rooms, (payload.old as any).id) });
          } else {
            set({ rooms: upsertById(get().rooms, mapRoom(payload.new)) });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'task_templates', filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            set({ taskTemplates: removeById(get().taskTemplates, (payload.old as any).id) });
          } else {
            set({ taskTemplates: upsertById(get().taskTemplates, mapTaskTemplate(payload.new)) });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'completions', filter: `household_id=eq.${householdId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            set({ completions: removeById(get().completions, (payload.old as any).id) });
          } else {
            set({ completions: upsertById(get().completions, mapCompletion(payload.new)) });
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'households', filter: `id=eq.${householdId}` },
        (payload) => set({ household: mapHousehold(payload.new) })
      )
      .subscribe();

    set({ realtimeChannel: channel });
  },

  createHousehold: async (name, type, templateKey, ownerName) => {
    const userId = get().currentUserId;
    if (!userId) return;

    let householdRow: any = null;
    for (let attempt = 0; attempt < 5 && !householdRow; attempt++) {
      const { data, error } = await supabase
        .from('households')
        .insert({
          name,
          type,
          mode: defaultModeForType(type),
          invite_code: generateInviteCode(),
        })
        .select()
        .single();
      if (!error) {
        householdRow = data;
      } else if (error.code !== '23505') {
        throw error;
      }
    }
    if (!householdRow) throw new Error('invite_code_collision');

    const { data: memberRow, error: memberError } = await supabase
      .from('members')
      .insert({
        household_id: householdRow.id,
        user_id: userId,
        display_name: ownerName || 'Ben',
        color: memberPalette[0],
        emoji: memberEmojis[0],
      })
      .select()
      .single();
    if (memberError) throw memberError;

    const roomSeeds = ROOM_TEMPLATES[templateKey];
    const { data: roomRows, error: roomsError } = await supabase
      .from('rooms')
      .insert(roomSeeds.map((seed) => ({ household_id: householdRow.id, name: seed.name, icon: seed.icon })))
      .select();
    if (roomsError) throw roomsError;

    const taskSeeds = (roomRows ?? []).flatMap((room: any) =>
      getDefaultTasksForRoom(room.name).map((seed) => ({
        household_id: householdRow.id,
        room_id: room.id,
        name: seed.name,
        base_points: seed.basePoints,
        expected_period_hours: seed.expectedPeriodHours,
        cooldown_hours: seed.cooldownHours,
        is_invisible_labor: seed.isInvisibleLabor,
      }))
    );
    const { data: taskRows, error: tasksError } = await supabase
      .from('task_templates')
      .insert(taskSeeds)
      .select();
    if (tasksError) throw tasksError;

    set({
      household: mapHousehold(householdRow),
      members: [mapMember(memberRow)],
      rooms: (roomRows ?? []).map(mapRoom),
      taskTemplates: (taskRows ?? []).map(mapTaskTemplate),
      completions: [],
      bootStatus: 'ready',
    });
    get().subscribeRealtime(householdRow.id);
  },

  joinHousehold: async (inviteCode, displayName) => {
    const { data: householdId, error } = await supabase.rpc('join_household', {
      p_invite_code: inviteCode.trim(),
      p_display_name: displayName.trim() || 'Ben',
      p_color: memberPalette[Math.floor(Math.random() * memberPalette.length)],
      p_emoji: memberEmojis[Math.floor(Math.random() * memberEmojis.length)],
    });
    if (error) throw error;

    await get().loadHouseholdData(householdId as string);
    get().subscribeRealtime(householdId as string);
    set({ bootStatus: 'ready' });
  },

  leaveHousehold: async () => {
    const state = get();
    const me = currentMember(state);
    if (me) {
      await supabase.from('members').update({ left_at: new Date().toISOString() }).eq('id', me.id);
    }
    const channel = get().realtimeChannel;
    if (channel) supabase.removeChannel(channel);
    await supabase.auth.signOut();

    set({
      household: null,
      members: [],
      rooms: [],
      taskTemplates: [],
      completions: [],
      realtimeChannel: null,
      currentUserId: null,
      bootStatus: 'onboarding',
    });
    await get().init();
  },

  setHouseholdMode: async (mode) => {
    const household = get().household;
    if (!household) return;
    set({ household: { ...household, mode } });
    const { error } = await supabase.from('households').update({ mode }).eq('id', household.id);
    if (error) throw error;
  },

  completeTask: async (taskTemplateId) => {
    const state = get();
    const me = currentMember(state);
    const household = state.household;
    const task = state.taskTemplates.find((t) => t.id === taskTemplateId);
    if (!me || !household || !task) return;

    const lastValid = state.completions
      .filter((c) => c.taskTemplateId === taskTemplateId && c.status === 'valid')
      .sort((a, b) => b.completedAt - a.completedAt)[0];
    const withinCooldown = isWithinCooldown(task, lastValid ? lastValid.completedAt : null);

    const { data, error } = await supabase
      .from('completions')
      .insert({
        household_id: household.id,
        task_template_id: taskTemplateId,
        member_id: me.id,
        awarded_points: withinCooldown ? 0 : task.basePoints,
        status: withinCooldown ? 'no_points' : 'valid',
      })
      .select()
      .single();
    if (error) throw error;

    set({ completions: upsertById(get().completions, mapCompletion(data)) });

    const prefs = usePrefsStore.getState();
    if (prefs.notificationsEnabled) {
      const room = state.rooms.find((r) => r.id === task.roomId);
      const assignedMember = task.assignedMemberId
        ? state.members.find((m) => m.id === task.assignedMemberId)
        : undefined;
      await cancelNotification(prefs.scheduledNotifications[taskTemplateId]);
      const newId = await scheduleStaleReminder({
        taskName: task.name,
        roomName: room?.name ?? '',
        delayHours: task.expectedPeriodHours,
        assignedName: assignedMember?.displayName,
      });
      prefs.setScheduledNotification(taskTemplateId, newId);
    }
  },

  renameRoom: async (roomId, name) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set({ rooms: get().rooms.map((r) => (r.id === roomId ? { ...r, name: trimmed } : r)) });
    const { error } = await supabase.from('rooms').update({ name: trimmed }).eq('id', roomId);
    if (error) throw error;
  },

  addRoom: async (name, icon) => {
    const household = get().household;
    const trimmed = name.trim();
    if (!household || !trimmed) return;

    const { data: roomRow, error: roomError } = await supabase
      .from('rooms')
      .insert({ household_id: household.id, name: trimmed, icon })
      .select()
      .single();
    if (roomError) throw roomError;

    const taskSeeds = getDefaultTasksForRoom(trimmed).map((seed) => ({
      household_id: household.id,
      room_id: roomRow.id,
      name: seed.name,
      base_points: seed.basePoints,
      expected_period_hours: seed.expectedPeriodHours,
      cooldown_hours: seed.cooldownHours,
      is_invisible_labor: seed.isInvisibleLabor,
    }));
    const { data: taskRows, error: tasksError } = await supabase
      .from('task_templates')
      .insert(taskSeeds)
      .select();
    if (tasksError) throw tasksError;

    set({
      rooms: upsertById(get().rooms, mapRoom(roomRow)),
      taskTemplates: [...get().taskTemplates, ...(taskRows ?? []).map(mapTaskTemplate)],
    });
  },

  removeRoom: async (roomId) => {
    const removedTaskIds = get()
      .taskTemplates.filter((t) => t.roomId === roomId)
      .map((t) => t.id);
    const prefs = usePrefsStore.getState();
    await Promise.all(removedTaskIds.map((id) => cancelNotification(prefs.scheduledNotifications[id])));
    removedTaskIds.forEach((id) => prefs.setScheduledNotification(id, undefined));

    set({
      rooms: removeById(get().rooms, roomId),
      taskTemplates: get().taskTemplates.filter((t) => t.roomId !== roomId),
      completions: get().completions.filter((c) => !removedTaskIds.includes(c.taskTemplateId)),
    });
    const { error } = await supabase.from('rooms').delete().eq('id', roomId);
    if (error) throw error;
  },

  addTask: async (roomId, name, basePoints, expectedPeriodHours, cooldownHours) => {
    const household = get().household;
    const trimmed = name.trim();
    if (!household || !trimmed) return;

    const { data, error } = await supabase
      .from('task_templates')
      .insert({
        household_id: household.id,
        room_id: roomId,
        name: trimmed,
        base_points: Math.max(0, Math.round(basePoints) || 0),
        expected_period_hours: Math.max(1, expectedPeriodHours || 24),
        cooldown_hours: Math.max(0, cooldownHours || 0),
      })
      .select()
      .single();
    if (error) throw error;

    set({ taskTemplates: upsertById(get().taskTemplates, mapTaskTemplate(data)) });
  },

  updateTask: async (taskId, patch) => {
    const existing = get().taskTemplates.find((t) => t.id === taskId);
    if (!existing) return;

    const next: TaskTemplate = {
      ...existing,
      ...patch,
      name: patch.name?.trim() ? patch.name.trim() : existing.name,
      basePoints: patch.basePoints !== undefined ? Math.max(0, Math.round(patch.basePoints)) : existing.basePoints,
      expectedPeriodHours:
        patch.expectedPeriodHours !== undefined
          ? Math.max(1, patch.expectedPeriodHours)
          : existing.expectedPeriodHours,
      cooldownHours:
        patch.cooldownHours !== undefined ? Math.max(0, patch.cooldownHours) : existing.cooldownHours,
    };
    set({ taskTemplates: upsertById(get().taskTemplates, next) });

    const { error } = await supabase
      .from('task_templates')
      .update({
        name: next.name,
        base_points: next.basePoints,
        expected_period_hours: next.expectedPeriodHours,
        cooldown_hours: next.cooldownHours,
        assigned_member_id: next.assignedMemberId,
      })
      .eq('id', taskId);
    if (error) throw error;
  },

  removeTask: async (taskId) => {
    const prefs = usePrefsStore.getState();
    await cancelNotification(prefs.scheduledNotifications[taskId]);
    prefs.setScheduledNotification(taskId, undefined);

    set({
      taskTemplates: removeById(get().taskTemplates, taskId),
      completions: get().completions.filter((c) => c.taskTemplateId !== taskId),
    });
    const { error } = await supabase.from('task_templates').delete().eq('id', taskId);
    if (error) throw error;
  },

  registerPushToken: async () => {
    const me = currentMember(get());
    if (!me) return;
    const token = await getExpoPushToken();
    if (!token) return;
    await supabase.from('push_tokens').upsert({ member_id: me.id, expo_push_token: token });
  },
}));

export function useCurrentMember(): Member | undefined {
  return useStore((s) => s.members.find((m) => m.userId === s.currentUserId));
}
