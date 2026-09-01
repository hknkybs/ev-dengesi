import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStore } from '../state/store';
import { getLastCompletion, getRoomStaleness } from '../lib/scoring';
import { RoomTile } from '../components/RoomTile';
import { MemberSwitcher } from '../components/MemberSwitcher';
import { colors, spacing } from '../theme';
import { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'HomeMap'>;

function formatSince(timestamp: number | null): string {
  if (!timestamp) return 'Hiç yapılmadı';
  const hours = (Date.now() - timestamp) / (1000 * 60 * 60);
  if (hours < 1) return 'Az önce yapıldı';
  if (hours < 24) return `${Math.floor(hours)} saat oldu`;
  return `${Math.floor(hours / 24)} gün oldu`;
}

export function HomeMapScreen({ navigation }: Props) {
  const household = useStore((s) => s.household);
  const rooms = useStore((s) => s.rooms);
  const taskTemplates = useStore((s) => s.taskTemplates);
  const completions = useStore((s) => s.completions);
  const members = useStore((s) => s.members);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.householdName}>{household?.name}</Text>
          <Text style={styles.headerHint}>Evin şu anki durumu</Text>
        </View>

        <MemberSwitcher />

        <View style={styles.grid}>
          {rooms.map((room) => {
            const { bucket } = getRoomStaleness(room, taskTemplates, completions);
            const roomTasks = taskTemplates.filter((t) => t.roomId === room.id);
            let mostStaleTimestamp: number | null = null;
            let mostStaleMember: string | null = null;
            let worstRatio = -1;
            for (const t of roomTasks) {
              const last = getLastCompletion(completions, t.id);
              const ratio = last
                ? (Date.now() - last.completedAt) / (1000 * 60 * 60 * t.expectedPeriodHours)
                : 999;
              if (ratio > worstRatio) {
                worstRatio = ratio;
                mostStaleTimestamp = last ? last.completedAt : null;
                mostStaleMember = last
                  ? members.find((m) => m.id === last.memberId)?.displayName ?? null
                  : null;
              }
            }
            const subtitle = mostStaleMember
              ? `${mostStaleMember} · ${formatSince(mostStaleTimestamp)}`
              : formatSince(mostStaleTimestamp);

            return (
              <RoomTile
                key={room.id}
                room={room}
                bucket={bucket}
                subtitle={subtitle}
                onPress={() => navigation.navigate('RoomDetail', { roomId: room.id })}
              />
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  householdName: { fontSize: 24, fontWeight: '800', color: colors.text },
  headerHint: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
  },
});
