import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  AppState,
  Completion,
  Household,
  HouseholdMode,
  HouseholdType,
  Member,
  TaskTemplate,
  TemplateKey,
  ThemeMode,
} from '../types';
import { generateId, generateInviteCode } from '../lib/id';
import { ROOM_TEMPLATES } from '../data/roomTemplates';
import { getDefaultTasksForRoom } from '../data/taskCatalog';
import { isWithinCooldown } from '../lib/scoring';
import {
  cancelNotification,
  requestNotificationPermissions,
  scheduleStaleReminder,
} from '../lib/notifications';
import { memberEmojis, memberPalette } from '../theme';

function defaultModeForType(type: HouseholdType): HouseholdMode {
  return type === 'roommates' ? 'competitive' : 'collaborative';
}

interface Actions {
  createHousehold: (name: string, type: HouseholdType, templateKey: TemplateKey, ownerName: string) => void;
  addMember: (name: string) => void;
  removeMember: (memberId: string) => void;
  setActiveMember: (memberId: string) => void;
  setHouseholdMode: (mode: HouseholdMode) => void;
  toggleNotifications: (enabled: boolean) => void;
  completeTask: (taskTemplateId: string) => Promise<void>;
  resetHousehold: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  renameRoom: (roomId: string, name: string) => void;
  addRoom: (name: string, icon: string) => void;
  removeRoom: (roomId: string) => void;
  addTask: (
    roomId: string,
    name: string,
    basePoints: number,
    expectedPeriodHours: number,
    cooldownHours: number
  ) => void;
  updateTask: (
    taskId: string,
    patch: Partial<Pick<TaskTemplate, 'name' | 'basePoints' | 'expectedPeriodHours' | 'cooldownHours'>>
  ) => void;
  removeTask: (taskId: string) => void;
}

type Store = AppState & Actions;

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      household: null,
      members: [],
      rooms: [],
      taskTemplates: [],
      completions: [],
      activeMemberId: null,
      notificationsEnabled: false,
      scheduledNotifications: {},
      themeMode: 'system',

      createHousehold: (name, type, templateKey, ownerName) => {
        const household: Household = {
          id: generateId(),
          name,
          type,
          mode: defaultModeForType(type),
          inviteCode: generateInviteCode(),
          createdAt: Date.now(),
        };

        const owner: Member = {
          id: generateId(),
          displayName: ownerName || 'Ben',
          color: memberPalette[0],
          emoji: memberEmojis[0],
          joinedAt: Date.now(),
          leftAt: null,
        };

        const roomSeeds = ROOM_TEMPLATES[templateKey];
        const rooms = roomSeeds.map((seed) => ({
          id: generateId(),
          name: seed.name,
          icon: seed.icon,
        }));

        const taskTemplates = rooms.flatMap((room) =>
          getDefaultTasksForRoom(room.name).map((seed) => ({
            id: generateId(),
            roomId: room.id,
            name: seed.name,
            basePoints: seed.basePoints,
            expectedPeriodHours: seed.expectedPeriodHours,
            cooldownHours: seed.cooldownHours,
            isInvisibleLabor: seed.isInvisibleLabor,
          }))
        );

        set({
          household,
          members: [owner],
          rooms,
          taskTemplates,
          completions: [],
          activeMemberId: owner.id,
          scheduledNotifications: {},
        });
      },

      addMember: (name) => {
        const { members } = get();
        const nextColor = memberPalette[members.length % memberPalette.length];
        const nextEmoji = memberEmojis[members.length % memberEmojis.length];
        const member: Member = {
          id: generateId(),
          displayName: name,
          color: nextColor,
          emoji: nextEmoji,
          joinedAt: Date.now(),
          leftAt: null,
        };
        set({ members: [...members, member] });
      },

      removeMember: (memberId) => {
        const { members, activeMemberId } = get();
        const updated = members.map((m) =>
          m.id === memberId ? { ...m, leftAt: Date.now() } : m
        );
        const stillActive = updated.filter((m) => !m.leftAt);
        set({
          members: updated,
          activeMemberId:
            activeMemberId === memberId ? stillActive[0]?.id ?? null : activeMemberId,
        });
      },

      setActiveMember: (memberId) => set({ activeMemberId: memberId }),

      setHouseholdMode: (mode) => {
        const { household } = get();
        if (!household) return;
        set({ household: { ...household, mode } });
      },

      toggleNotifications: async (enabled) => {
        if (enabled) {
          const granted = await requestNotificationPermissions();
          set({ notificationsEnabled: granted });
        } else {
          set({ notificationsEnabled: false });
        }
      },

      completeTask: async (taskTemplateId) => {
        const {
          taskTemplates,
          completions,
          activeMemberId,
          rooms,
          notificationsEnabled,
          scheduledNotifications,
        } = get();
        if (!activeMemberId) return;
        const task = taskTemplates.find((t) => t.id === taskTemplateId);
        if (!task) return;

        const lastValid = completions
          .filter((c) => c.taskTemplateId === taskTemplateId && c.status === 'valid')
          .sort((a, b) => b.completedAt - a.completedAt)[0];

        const withinCooldown = isWithinCooldown(task, lastValid ? lastValid.completedAt : null);

        const completion: Completion = {
          id: generateId(),
          taskTemplateId,
          memberId: activeMemberId,
          completedAt: Date.now(),
          awardedPoints: withinCooldown ? 0 : task.basePoints,
          status: withinCooldown ? 'no_points' : 'valid',
        };

        const nextCompletions = [...completions, completion];
        set({ completions: nextCompletions });

        if (notificationsEnabled) {
          const room = rooms.find((r) => r.id === task.roomId);
          await cancelNotification(scheduledNotifications[taskTemplateId]);
          const newId = await scheduleStaleReminder({
            taskName: task.name,
            roomName: room?.name ?? '',
            delayHours: task.expectedPeriodHours,
          });
          if (newId) {
            set({
              scheduledNotifications: {
                ...get().scheduledNotifications,
                [taskTemplateId]: newId,
              },
            });
          }
        }
      },

      resetHousehold: () => {
        set({
          household: null,
          members: [],
          rooms: [],
          taskTemplates: [],
          completions: [],
          activeMemberId: null,
          scheduledNotifications: {},
        });
      },

      setThemeMode: (mode) => set({ themeMode: mode }),

      renameRoom: (roomId, name) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        set({
          rooms: get().rooms.map((r) => (r.id === roomId ? { ...r, name: trimmed } : r)),
        });
      },

      addRoom: (name, icon) => {
        const { household, rooms, taskTemplates } = get();
        const trimmed = name.trim();
        if (!household || !trimmed) return;

        const room = { id: generateId(), name: trimmed, icon };
        const newTasks = getDefaultTasksForRoom(trimmed).map((seed) => ({
          id: generateId(),
          roomId: room.id,
          name: seed.name,
          basePoints: seed.basePoints,
          expectedPeriodHours: seed.expectedPeriodHours,
          cooldownHours: seed.cooldownHours,
          isInvisibleLabor: seed.isInvisibleLabor,
        }));

        set({ rooms: [...rooms, room], taskTemplates: [...taskTemplates, ...newTasks] });
      },

      removeRoom: async (roomId: string) => {
        const { rooms, taskTemplates, completions, scheduledNotifications } = get();
        const removedTaskIds = new Set(
          taskTemplates.filter((t) => t.roomId === roomId).map((t) => t.id)
        );

        await Promise.all(
          Array.from(removedTaskIds).map((id) => cancelNotification(scheduledNotifications[id]))
        );

        const nextScheduled = { ...scheduledNotifications };
        removedTaskIds.forEach((id) => delete nextScheduled[id]);

        set({
          rooms: rooms.filter((r) => r.id !== roomId),
          taskTemplates: taskTemplates.filter((t) => t.roomId !== roomId),
          completions: completions.filter((c) => !removedTaskIds.has(c.taskTemplateId)),
          scheduledNotifications: nextScheduled,
        });
      },

      addTask: (roomId, name, basePoints, expectedPeriodHours, cooldownHours) => {
        const trimmed = name.trim();
        if (!trimmed) return;
        const task: TaskTemplate = {
          id: generateId(),
          roomId,
          name: trimmed,
          basePoints: Math.max(0, Math.round(basePoints) || 0),
          expectedPeriodHours: Math.max(1, expectedPeriodHours || 24),
          cooldownHours: Math.max(0, cooldownHours || 0),
          isInvisibleLabor: false,
        };
        set({ taskTemplates: [...get().taskTemplates, task] });
      },

      updateTask: (taskId, patch) => {
        set({
          taskTemplates: get().taskTemplates.map((t) =>
            t.id === taskId
              ? {
                  ...t,
                  ...patch,
                  name: patch.name?.trim() ? patch.name.trim() : t.name,
                  basePoints:
                    patch.basePoints !== undefined
                      ? Math.max(0, Math.round(patch.basePoints))
                      : t.basePoints,
                  expectedPeriodHours:
                    patch.expectedPeriodHours !== undefined
                      ? Math.max(1, patch.expectedPeriodHours)
                      : t.expectedPeriodHours,
                  cooldownHours:
                    patch.cooldownHours !== undefined
                      ? Math.max(0, patch.cooldownHours)
                      : t.cooldownHours,
                }
              : t
          ),
        });
      },

      removeTask: async (taskId: string) => {
        const { taskTemplates, completions, scheduledNotifications } = get();
        await cancelNotification(scheduledNotifications[taskId]);
        const nextScheduled = { ...scheduledNotifications };
        delete nextScheduled[taskId];

        set({
          taskTemplates: taskTemplates.filter((t) => t.id !== taskId),
          completions: completions.filter((c) => c.taskTemplateId !== taskId),
          scheduledNotifications: nextScheduled,
        });
      },
    }),
    {
      name: 'ev-dengesi-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
