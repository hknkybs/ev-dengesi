import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Room } from '../types';
import { StaleBucket } from '../lib/scoring';
import { colors, radius, spacing } from '../theme';

const bucketColor: Record<StaleBucket, string> = {
  fresh: colors.staleFresh,
  ok: colors.staleOk,
  warn: colors.staleWarn,
  overdue: colors.staleOverdue,
  critical: colors.staleCritical,
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
  const dot = bucketColor[bucket];
  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.8}>
      <View style={[styles.statusBar, { backgroundColor: dot }]} />
      <View style={styles.body}>
        <Text style={styles.icon}>{room.icon}</Text>
        <Text style={styles.name} numberOfLines={1}>
          {room.name}
        </Text>
        <View style={styles.statusRow}>
          <View style={[styles.dot, { backgroundColor: dot }]} />
          <Text style={styles.statusText} numberOfLines={1}>
            {bucketLabel[bucket]}
          </Text>
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  statusBar: {
    height: 5,
    width: '100%',
  },
  body: {
    padding: spacing.md,
  },
  icon: {
    fontSize: 26,
    marginBottom: 6,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
