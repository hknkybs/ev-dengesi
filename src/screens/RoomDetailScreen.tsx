import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../state/store';
import { getLastCompletion, isWithinCooldown } from '../lib/scoring';
import { TaskRow } from '../components/TaskRow';
import { colors, radius, spacing } from '../theme';
import { fonts } from '../theme/typography';
import { HomeStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'RoomDetail'>;

export function RoomDetailScreen({ route, navigation }: Props) {
  const { roomId } = route.params;
  const room = useStore((s) => s.rooms.find((r) => r.id === roomId));
  const allTaskTemplates = useStore((s) => s.taskTemplates);
  const taskTemplates = useMemo(
    () => allTaskTemplates.filter((t) => t.roomId === roomId),
    [allTaskTemplates, roomId]
  );
  const completions = useStore((s) => s.completions);
  const members = useStore((s) => s.members);
  const completeTask = useStore((s) => s.completeTask);
  const activeMemberId = useStore((s) => s.activeMemberId);

  if (!room) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
          <Text style={styles.backButtonText}>Geri</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.iconBadge}>
            <Text style={styles.icon}>{room.icon}</Text>
          </View>
          <Text style={styles.title}>{room.name}</Text>
        </View>

        {taskTemplates.map((task) => {
          const last = getLastCompletion(completions, task.id);
          const lastValid = completions
            .filter((c) => c.taskTemplateId === task.id && c.status === 'valid')
            .sort((a, b) => b.completedAt - a.completedAt)[0];
          const cooldownActive = isWithinCooldown(task, lastValid ? lastValid.completedAt : null);
          const lastMember = last ? members.find((m) => m.id === last.memberId) : undefined;

          return (
            <TaskRow
              key={task.id}
              task={task}
              lastCompletedAt={last ? last.completedAt : null}
              lastMemberName={lastMember ? lastMember.displayName : null}
              cooldownActive={cooldownActive}
              onComplete={() => completeTask(task.id)}
            />
          );
        })}

        {!activeMemberId && (
          <Text style={styles.warning}>
            Aktif üye seçili değil. Ayarlar sekmesinden bir üye seç.
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.pill,
  },
  backButtonText: { color: colors.primary, fontSize: 15, fontFamily: fonts.bodyBold, marginLeft: 2 },
  scroll: { padding: spacing.lg, paddingTop: spacing.sm, paddingBottom: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.lg },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: radius.lg,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  icon: { fontSize: 34 },
  title: { fontSize: 22, fontFamily: fonts.displayBold, color: colors.text },
  warning: { color: colors.accent, textAlign: 'center', marginTop: spacing.md, fontSize: 13, fontFamily: fonts.bodyMedium },
});
