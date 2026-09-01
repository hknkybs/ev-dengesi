import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Room } from '../types';
import { useTheme } from '../theme/ThemeContext';
import { spacing } from '../theme';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';

export function RoomEditRow({
  room,
  onRename,
  onRemove,
}: {
  room: Room;
  onRename: (roomId: string, name: string) => void;
  onRemove: (roomId: string, name: string) => void;
}) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const [name, setName] = useState(room.name);

  function commit() {
    const trimmed = name.trim();
    if (trimmed) {
      onRename(room.id, trimmed);
    } else {
      setName(room.name);
    }
  }

  return (
    <View style={styles.row}>
      <Text style={styles.icon}>{room.icon}</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        onSubmitEditing={commit}
        onBlur={commit}
      />
      <TouchableOpacity onPress={() => onRemove(room.id, room.name)} hitSlop={8}>
        <Ionicons name="trash-outline" size={17} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    icon: { fontSize: 18 },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.text,
      fontFamily: fonts.bodySemiBold,
      paddingVertical: 4,
    },
  });
}
