import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TaskTemplate } from '../types';
import { colors, radius, spacing } from '../theme';

function formatRelative(timestamp: number | null): string {
  if (!timestamp) return 'Henüz işaretlenmedi';
  const hours = (Date.now() - timestamp) / (1000 * 60 * 60);
  if (hours < 1) return 'Az önce';
  if (hours < 24) return `${Math.floor(hours)} saat önce`;
  const days = Math.floor(hours / 24);
  return `${days} gün önce`;
}

export function TaskRow({
  task,
  lastCompletedAt,
  lastMemberName,
  cooldownActive,
  onComplete,
}: {
  task: TaskTemplate;
  lastCompletedAt: number | null;
  lastMemberName: string | null;
  cooldownActive: boolean;
  onComplete: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{task.name}</Text>
        <Text style={styles.meta}>
          {lastMemberName
            ? `Son: ${lastMemberName} · ${formatRelative(lastCompletedAt)}`
            : formatRelative(lastCompletedAt)}
        </Text>
        {cooldownActive && (
          <Text style={styles.cooldownNote}>Yakın zamanda puanlandı — şimdi puansız kaydedilir</Text>
        )}
      </View>
      <TouchableOpacity style={styles.button} onPress={onComplete} activeOpacity={0.75}>
        <Text style={styles.buttonPoints}>+{task.basePoints}</Text>
        <Text style={styles.buttonLabel}>Yaptım</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  info: {
    flex: 1,
    marginRight: spacing.sm,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 2,
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cooldownNote: {
    fontSize: 11,
    color: colors.accent,
    marginTop: 4,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    minWidth: 72,
  },
  buttonPoints: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 13,
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 11,
    opacity: 0.9,
  },
});
