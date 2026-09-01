import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { currentYearMonth, getCategoryBreakdown, getMonthlyScores } from '../lib/scoring';
import { ShareBar } from '../components/ShareBar';
import { colors, radius, spacing } from '../theme';

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

export function ScoreScreen() {
  const household = useStore((s) => s.household);
  const members = useStore((s) => s.members);
  const completions = useStore((s) => s.completions);
  const rooms = useStore((s) => s.rooms);
  const taskTemplates = useStore((s) => s.taskTemplates);

  const yearMonth = currentYearMonth();
  const now = new Date();
  const scores = getMonthlyScores(members, completions, yearMonth);
  const isCompetitive = household?.mode === 'competitive';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Bu Ay</Text>
        <Text style={styles.subtitle}>
          {MONTH_NAMES[now.getMonth()]} {now.getFullYear()}
        </Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Pay dağılımı</Text>
          <Text style={styles.cardHint}>
            {isCompetitive
              ? 'Bu hanede rekabetçi mod açık.'
              : 'Bu hanede işbirlikçi mod açık — amaç sıralama değil, ortak paylaşım.'}
          </Text>
          <ShareBar scores={scores} />
        </View>

        {scores.map((score) => {
          const breakdown = getCategoryBreakdown(
            score.member.id,
            rooms,
            taskTemplates,
            completions,
            yearMonth
          );
          return (
            <View key={score.member.id} style={styles.card}>
              <View style={styles.memberHeader}>
                <View style={[styles.memberDot, { backgroundColor: score.member.color }]} />
                <Text style={styles.memberName}>{score.member.displayName}</Text>
                <Text style={styles.memberPoints}>{score.points} puan</Text>
              </View>
              <Text style={styles.memberMeta}>{score.taskCount} görev tamamlandı</Text>

              {breakdown.length > 0 ? (
                <View style={styles.breakdownList}>
                  {breakdown.map((b) => (
                    <View key={b.room.id} style={styles.breakdownRow}>
                      <Text style={styles.breakdownRoom}>
                        {b.room.icon} {b.room.name}
                      </Text>
                      <Text style={styles.breakdownPoints}>{b.points} puan</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Bu ay henüz görev işaretlenmedi.</Text>
              )}
            </View>
          );
        })}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: colors.text },
  subtitle: { fontSize: 13, color: colors.textMuted, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
  cardHint: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberDot: { width: 10, height: 10, borderRadius: 5 },
  memberName: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.text },
  memberPoints: { fontSize: 14, fontWeight: '700', color: colors.primary },
  memberMeta: { fontSize: 12, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  breakdownList: { gap: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownRoom: { fontSize: 13, color: colors.text },
  breakdownPoints: { fontSize: 13, color: colors.textMuted },
  emptyText: { fontSize: 12, color: colors.textMuted },
});
