import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MemberScore } from '../lib/scoring';
import { colors, radius, spacing } from '../theme';
import { fonts } from '../theme/typography';

export function ShareBar({ scores }: { scores: MemberScore[] }) {
  const total = scores.reduce((s, m) => s + m.points, 0);

  return (
    <View>
      <View style={styles.track}>
        {total === 0 ? (
          <View style={[styles.segment, { flex: 1, backgroundColor: colors.surfaceMuted }]} />
        ) : (
          scores.map((s) => (
            <View
              key={s.member.id}
              style={[
                styles.segment,
                { flex: Math.max(s.sharePercent, 2), backgroundColor: s.member.color },
              ]}
            />
          ))
        )}
      </View>
      <View style={styles.legend}>
        {scores.map((s) => (
          <View key={s.member.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: s.member.color }]} />
            <Text style={styles.legendText}>
              {s.member.displayName} · %{s.sharePercent}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    height: 16,
    borderRadius: radius.pill,
    overflow: 'hidden',
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceMuted,
  },
  segment: {
    height: '100%',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 13,
    color: colors.text,
    fontFamily: fonts.bodySemiBold,
  },
});
