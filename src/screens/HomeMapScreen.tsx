import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useStore } from '../state/store';
import { getLastCompletion, getRoomStaleness } from '../lib/scoring';
import { RoomTile } from '../components/RoomTile';
import { MemberSwitcher } from '../components/MemberSwitcher';
import { radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const roomStaleness = useMemo(
    () => rooms.map((room) => ({ room, ...getRoomStaleness(room, taskTemplates, completions) })),
    [rooms, taskTemplates, completions]
  );

  const freshCount = roomStaleness.filter((r) => r.bucket === 'fresh' || r.bucket === 'ok').length;
  const attentionCount = roomStaleness.length - freshCount;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View style={{ flex: 1 }}>
              <Text style={styles.eyebrow}>Evin şu anki durumu</Text>
              <Text style={styles.householdName}>{household?.name}</Text>
            </View>
            <View style={styles.badge}>
              <Text style={styles.badgeEmoji}>🏡</Text>
            </View>
          </View>

          {roomStaleness.length > 0 && (
            <View style={styles.summaryRow}>
              <View style={[styles.summaryPill, styles.summaryPillGood]}>
                <View style={[styles.summaryDot, { backgroundColor: colors.staleFresh }]} />
                <Text style={styles.summaryText}>{freshCount} oda iyi durumda</Text>
              </View>
              {attentionCount > 0 && (
                <View style={[styles.summaryPill, styles.summaryPillWarn]}>
                  <View style={[styles.summaryDot, { backgroundColor: colors.staleOverdue }]} />
                  <Text style={styles.summaryText}>{attentionCount} oda bekliyor</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <MemberSwitcher />

        <View style={styles.grid}>
          {roomStaleness.map(({ room, bucket }) => {
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

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.md, paddingBottom: spacing.xl },
  header: { paddingHorizontal: spacing.sm, marginBottom: spacing.md },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start' },
  eyebrow: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  householdName: { fontSize: 26, fontFamily: fonts.displayBold, color: colors.text },
  badge: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeEmoji: { fontSize: 20 },
  summaryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  summaryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.pill,
  },
  summaryPillGood: { backgroundColor: colors.primaryMuted },
  summaryPillWarn: { backgroundColor: colors.accentMuted },
  summaryDot: { width: 7, height: 7, borderRadius: 4 },
  summaryText: { fontSize: 12, fontFamily: fonts.bodySemiBold, color: colors.text },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xs,
  },
  });
}
