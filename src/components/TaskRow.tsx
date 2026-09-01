import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { TaskTemplate } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';

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
  const { colors, gradients, shadow } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);

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
      <TouchableOpacity onPress={onComplete} activeOpacity={0.85}>
        <LinearGradient
          colors={gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.button}
        >
          <Text style={styles.buttonPoints}>+{task.basePoints}</Text>
          <Text style={styles.buttonLabel}>Yaptım</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors, shadow: { card: object; floating: object }) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      ...shadow.card,
    },
    info: {
      flex: 1,
      marginRight: spacing.sm,
    },
    name: {
      fontSize: 15,
      fontFamily: fonts.bodyBold,
      color: colors.text,
      marginBottom: 2,
    },
    meta: {
      fontSize: 12,
      fontFamily: fonts.body,
      color: colors.textMuted,
    },
    cooldownNote: {
      fontSize: 11,
      fontFamily: fonts.bodyMedium,
      color: colors.accent,
      marginTop: 4,
    },
    button: {
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      minWidth: 76,
      ...shadow.floating,
    },
    buttonPoints: {
      color: colors.textOnDark,
      fontFamily: fonts.bodyExtraBold,
      fontSize: 14,
    },
    buttonLabel: {
      color: colors.textOnDarkMuted,
      fontFamily: fonts.bodyMedium,
      fontSize: 11,
    },
  });
}
