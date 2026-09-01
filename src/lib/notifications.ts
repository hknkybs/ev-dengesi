import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const result = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return result.granted;
}

export async function cancelNotification(id: string | undefined) {
  if (!id) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch {
    // already fired or invalid id, ignore
  }
}

export async function scheduleStaleReminder(params: {
  taskName: string;
  roomName: string;
  delayHours: number;
}): Promise<string | undefined> {
  const { taskName, roomName, delayHours } = params;
  if (delayHours <= 0) return undefined;
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: `${roomName} bekliyor`,
        body: `${taskName} bir süredir yapılmadı.`,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: Math.max(60, Math.round(delayHours * 3600)),
        repeats: false,
      },
    });
    return id;
  } catch {
    return undefined;
  }
}

export function androidChannelSetup() {
  if (Platform.OS === 'android') {
    Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}
