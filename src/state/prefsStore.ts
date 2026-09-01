import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { ThemeMode } from '../types';
import { requestNotificationPermissions } from '../lib/notifications';

interface PrefsState {
  themeMode: ThemeMode;
  notificationsEnabled: boolean;
  scheduledNotifications: Record<string, string>;
  setThemeMode: (mode: ThemeMode) => void;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  setScheduledNotification: (taskId: string, notificationId: string | undefined) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set, get) => ({
      themeMode: 'system',
      notificationsEnabled: false,
      scheduledNotifications: {},

      setThemeMode: (mode) => set({ themeMode: mode }),
      toggleNotifications: async (enabled) => {
        if (enabled) {
          const granted = await requestNotificationPermissions();
          set({ notificationsEnabled: granted });
        } else {
          set({ notificationsEnabled: false });
        }
      },
      setScheduledNotification: (taskId, notificationId) => {
        const next = { ...get().scheduledNotifications };
        if (notificationId) next[taskId] = notificationId;
        else delete next[taskId];
        set({ scheduledNotifications: next });
      },
    }),
    {
      name: 'ev-dengesi-prefs',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
