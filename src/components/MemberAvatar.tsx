import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Member } from '../types';

export function MemberAvatar({ member, size = 32 }: { member: Member; size?: number }) {
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: member.color },
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
  },
});
