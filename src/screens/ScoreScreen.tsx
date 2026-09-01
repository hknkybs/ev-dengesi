import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../state/store';
import { currentYearMonth, getCategoryBreakdown, getMonthlyScores } from '../lib/scoring';
import { ShareBar } from '../components/ShareBar';
import { radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';

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
  const { colors, gradients, shadow } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);

  const yearMonth = currentYearMonth();
  const now = new Date();
  const scores = getMonthlyScores(members, completions, yearMonth);
  const isCompetitive = household?.mode === 'competitive';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.eyebrow}>{MONTH_NAMES[now.getMonth()]} {now.getFullYear()}</Text>
        <Text style={styles.title}>Bu Ay</Text>

        <LinearGradient
          colors={gradients.heroDark}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroHeaderRow}>
            <Text style={styles.heroCardTitle}>Pay dağılımı</Text>
            <View style={styles.modePill}>
              <Ionicons
                name={isCompetitive ? 'trophy' : 'people'}
                size={13}
                color={colors.textOnDark}
              />
              <Text style={styles.modePillText}>
                {isCompetitive ? 'Rekabetçi' : 'İşbirlikçi'}
              </Text>
            </View>
          </View>
          <Text style={styles.heroCardHint}>
            {isCompetitive
              ? 'Bu hanede rekabetçi mod açık.'
              : 'Amaç sıralama değil, ortak paylaşım.'}
          </Text>
          <View style={styles.heroDivider} />
          <ShareBar scores={scores} />
        </LinearGradient>

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

function createStyles(colors: ThemeColors, shadow: { card: object; floating: object }) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  eyebrow: {
    fontSize: 12,
    fontFamily: fonts.bodyBold,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  title: { fontSize: 26, fontFamily: fonts.displayBold, color: colors.text, marginBottom: spacing.md },
  heroCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.floating,
  },
  heroHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroCardTitle: { fontSize: 17, fontFamily: fonts.display, color: colors.textOnDark },
  modePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
  },
  modePillText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.textOnDark },
  heroCardHint: { fontSize: 12, fontFamily: fonts.body, color: colors.textOnDarkMuted, marginTop: 4 },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.14)', marginVertical: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadow.card,
  },
  memberHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberDot: { width: 10, height: 10, borderRadius: 5 },
  memberName: { flex: 1, fontSize: 15, fontFamily: fonts.bodyBold, color: colors.text },
  memberPoints: { fontSize: 14, fontFamily: fonts.bodyExtraBold, color: colors.primary },
  memberMeta: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2, marginBottom: spacing.sm },
  breakdownList: { gap: 6 },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownRoom: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.text },
  breakdownPoints: { fontSize: 13, fontFamily: fonts.body, color: colors.textMuted },
  emptyText: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted },
  });
}
