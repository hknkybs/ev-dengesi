import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Member, TaskTemplate } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { radius, spacing } from '../theme';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';
import { MemberAvatar } from './MemberAvatar';

function toNumber(text: string, fallback: number): number {
  const n = Number(text.replace(',', '.'));
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export function TaskEditRow({
  task,
  members,
  onUpdate,
  onRemove,
}: {
  task: TaskTemplate;
  members: Member[];
  onUpdate: (
    taskId: string,
    patch: Partial<
      Pick<TaskTemplate, 'name' | 'basePoints' | 'expectedPeriodHours' | 'cooldownHours' | 'assignedMemberId'>
    >
  ) => void;
  onRemove: (taskId: string) => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [name, setName] = useState(task.name);
  const [points, setPoints] = useState(String(task.basePoints));
  const [period, setPeriod] = useState(String(task.expectedPeriodHours));
  const [cooldown, setCooldown] = useState(String(task.cooldownHours));

  function commitName() {
    const trimmed = name.trim();
    if (trimmed) onUpdate(task.id, { name: trimmed });
    else setName(task.name);
  }

  function commitPoints() {
    const value = toNumber(points, task.basePoints);
    setPoints(String(value));
    onUpdate(task.id, { basePoints: value });
  }

  function commitPeriod() {
    const value = Math.max(1, toNumber(period, task.expectedPeriodHours));
    setPeriod(String(value));
    onUpdate(task.id, { expectedPeriodHours: value });
  }

  function commitCooldown() {
    const value = toNumber(cooldown, task.cooldownHours);
    setCooldown(String(value));
    onUpdate(task.id, { cooldownHours: value });
  }

  return (
    <View style={styles.card}>
      <View style={styles.nameRow}>
        <TextInput
          style={styles.nameInput}
          value={name}
          onChangeText={setName}
          onBlur={commitName}
          onSubmitEditing={commitName}
        />
        <TouchableOpacity onPress={() => onRemove(task.id)} hitSlop={8}>
          <Ionicons name="trash-outline" size={17} color={colors.danger} />
        </TouchableOpacity>
      </View>
      <View style={styles.fieldsRow}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Puan</Text>
          <TextInput
            style={styles.fieldInput}
            value={points}
            onChangeText={setPoints}
            onBlur={commitPoints}
            onSubmitEditing={commitPoints}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Periyot (sa)</Text>
          <TextInput
            style={styles.fieldInput}
            value={period}
            onChangeText={setPeriod}
            onBlur={commitPeriod}
            onSubmitEditing={commitPeriod}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Bekleme (sa)</Text>
          <TextInput
            style={styles.fieldInput}
            value={cooldown}
            onChangeText={setCooldown}
            onBlur={commitCooldown}
            onSubmitEditing={commitCooldown}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <Text style={styles.assignLabel}>Sorumlu</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[styles.assignChip, !task.assignedMemberId && styles.assignChipActive]}
          onPress={() => onUpdate(task.id, { assignedMemberId: null })}
        >
          <Text style={[styles.assignChipText, !task.assignedMemberId && styles.assignChipTextActive]}>
            Kimseye atanmadı
          </Text>
        </TouchableOpacity>
        {members.map((m) => {
          const active = task.assignedMemberId === m.id;
          return (
            <TouchableOpacity
              key={m.id}
              style={[styles.assignChip, active && styles.assignChipActive]}
              onPress={() => onUpdate(task.id, { assignedMemberId: m.id })}
            >
              <MemberAvatar member={m} size={16} />
              <Text style={[styles.assignChipText, active && styles.assignChipTextActive]}>
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
    card: {
      backgroundColor: colors.surfaceMuted,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    nameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xs,
    },
    nameInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: fonts.bodyBold,
      color: colors.text,
      paddingVertical: 4,
    },
    fieldsRow: { flexDirection: 'row', gap: spacing.sm },
    field: { flex: 1 },
    fieldLabel: { fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.textMuted, marginBottom: 2 },
    fieldInput: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: 6,
      fontSize: 13,
      fontFamily: fonts.bodyMedium,
      color: colors.text,
      textAlign: 'center',
    },
    assignLabel: { fontSize: 10, fontFamily: fonts.bodyMedium, color: colors.textMuted, marginTop: spacing.sm, marginBottom: 4 },
    assignChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.pill,
      marginRight: spacing.xs,
    },
    assignChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    assignChipText: { fontSize: 11, fontFamily: fonts.bodySemiBold, color: colors.textMuted },
    assignChipTextActive: { color: colors.textOnDark },
  });
}
