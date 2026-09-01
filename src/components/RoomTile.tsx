import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Room } from '../types';
import { StaleBucket } from '../lib/scoring';
import { useTheme } from '../theme/ThemeContext';
import { radius, shadow, spacing } from '../theme';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';

const bucketGradient: Record<StaleBucket, readonly [string, string]> = {
  fresh: ['#4FBE8E', '#2E9068'],
  ok: ['#A3D164', '#7BA83B'],
  warn: ['#F0C15C', '#DB9B2C'],
  overdue: ['#EF9663', '#D2632D'],
  critical: ['#DD6E62', '#B33B30'],
};

const bucketLabel: Record<StaleBucket, string> = {
  fresh: 'Taze',
  ok: 'İyi',
  warn: 'Zamanı geldi',
  overdue: 'Gecikti',
  critical: 'Uzun süredir bekliyor',
};

export function RoomTile({
  room,
  bucket,
  subtitle,
  onPress,
}: {
  room: Room;
  bucket: StaleBucket;
  subtitle: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bucketColor: Record<StaleBucket, string> = useMemo(
    () => ({
      fresh: colors.staleFresh,
      ok: colors.staleOk,
      warn: colors.staleWarn,
      overdue: colors.staleOverdue,
      critical: colors.staleCritical,
    }),
    [colors]
  );
  const dot = bucketColor[bucket];

  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.82}>
      <View style={styles.topRow}>
        <LinearGradient
          colors={bucketGradient[bucket]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconBadge}
        >
          <Text style={styles.icon}>{room.icon}</Text>
        </LinearGradient>
        <View style={[styles.dot, { backgroundColor: dot }]} />
      </View>
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {room.name}
        </Text>
        <Text style={[styles.statusText, { color: dot }]} numberOfLines={1}>
          {bucketLabel[bucket]}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    tile: {
      width: '47%',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    iconBadge: {
      width: 48,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    icon: {
      fontSize: 24,
    },
    dot: {
      width: 9,
      height: 9,
      borderRadius: 5,
      marginTop: 4,
    },
    body: {},
    name: {
      fontSize: 16,
      fontFamily: fonts.display,
      color: colors.text,
      marginBottom: 4,
    },
    statusText: {
      fontSize: 12,
      fontFamily: fonts.bodyBold,
      marginBottom: 3,
    },
    subtitle: {
      fontSize: 12,
      fontFamily: fonts.body,
      color: colors.textMuted,
    },
  });
}
