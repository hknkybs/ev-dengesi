import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../state/store';
import { useTheme } from '../theme/ThemeContext';
import { radius, shadow, spacing } from '../theme';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';
import { MemberAvatar } from './MemberAvatar';

export function MemberSwitcher() {
  const allMembers = useStore((s) => s.members);
  const members = useMemo(() => allMembers.filter((m) => !m.leftAt), [allMembers]);
  const activeMemberId = useStore((s) => s.activeMemberId);
  const setActiveMember = useStore((s) => s.setActiveMember);
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (members.length <= 1) return null;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Şu an:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {members.map((m) => {
          const active = m.id === activeMemberId;
          return (
            <TouchableOpacity
              key={m.id}
              onPress={() => setActiveMember(m.id)}
              style={[styles.chip, active && styles.chipActive]}
            >
              <MemberAvatar member={m} size={20} />
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {m.displayName}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.sm,
      gap: spacing.sm,
    },
    label: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: fonts.bodyMedium,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      marginRight: spacing.sm,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
      ...shadow.soft,
    },
    chipText: {
      color: colors.textMuted,
      fontSize: 13,
      fontFamily: fonts.bodySemiBold,
    },
    chipTextActive: {
      color: colors.textOnDark,
    },
  });
}
