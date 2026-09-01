import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Member } from '../types';
import { colors } from '../theme';

export function MemberAvatar({ member, size = 32 }: { member: Member; size?: number }) {
  return (
    <View
      style={[
        styles.circle,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: member.color,
          borderWidth: Math.max(2, size * 0.06),
        },
      ]}
    >
      <Text style={{ fontSize: size * 0.5 }}>{member.emoji}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.surface,
  },
});
