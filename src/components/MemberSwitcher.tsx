import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useStore } from '../state/store';
import { colors, radius, spacing } from '../theme';
import { MemberAvatar } from './MemberAvatar';

export function MemberSwitcher() {
  const allMembers = useStore((s) => s.members);
  const members = useMemo(() => allMembers.filter((m) => !m.leftAt), [allMembers]);
  const activeMemberId = useStore((s) => s.activeMemberId);
  const setActiveMember = useStore((s) => s.setActiveMember);

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

const styles = StyleSheet.create({
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
    backgroundColor: colors.primaryMuted,
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextActive: {
    color: colors.primary,
  },
});
