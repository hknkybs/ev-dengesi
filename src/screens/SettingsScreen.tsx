import React, { useMemo, useState } from 'react';
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useCurrentMember, useStore } from '../state/store';
import { usePrefsStore } from '../state/prefsStore';
import { MemberAvatar } from '../components/MemberAvatar';
import { RoomEditRow } from '../components/RoomEditRow';
import { useTheme } from '../theme/ThemeContext';
import { radius, roomIconChoices, spacing } from '../theme';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';
import { ThemeMode } from '../types';

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'Sistem', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Açık', icon: 'sunny-outline' },
  { key: 'dark', label: 'Koyu', icon: 'moon-outline' },
];

export function SettingsScreen() {
  const household = useStore((s) => s.household);
  const allMembers = useStore((s) => s.members);
  const members = useMemo(() => allMembers.filter((m) => !m.leftAt), [allMembers]);
  const currentMember = useCurrentMember();
  const setHouseholdMode = useStore((s) => s.setHouseholdMode);
  const leaveHousehold = useStore((s) => s.leaveHousehold);
  const registerPushToken = useStore((s) => s.registerPushToken);
  const rooms = useStore((s) => s.rooms);
  const renameRoom = useStore((s) => s.renameRoom);
  const addRoom = useStore((s) => s.addRoom);
  const removeRoom = useStore((s) => s.removeRoom);

  const notificationsEnabled = usePrefsStore((s) => s.notificationsEnabled);
  const toggleNotifications = usePrefsStore((s) => s.toggleNotifications);
  const themeMode = usePrefsStore((s) => s.themeMode);
  const setThemeMode = usePrefsStore((s) => s.setThemeMode);

  const { colors, gradients, shadow } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);

  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomIcon, setNewRoomIcon] = useState(roomIconChoices[0]);

  function handleAddRoom() {
    const name = newRoomName.trim();
    if (!name) return;
    addRoom(name, newRoomIcon);
    setNewRoomName('');
    setNewRoomIcon(roomIconChoices[0]);
  }

  function handleRemoveRoom(roomId: string, roomName: string) {
    Alert.alert(
      `${roomName} silinsin mi?`,
      'Bu odaya ait görevler ve geçmiş kayıtlar da silinecek.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => removeRoom(roomId) },
      ]
    );
  }

  function handleShareInvite() {
    if (!household) return;
    Share.share({
      message: `${household.name} hanesine katıl! Davet kodu: ${household.inviteCode}`,
    });
  }

  function handleLeave() {
    Alert.alert(
      'Haneden ayrıl',
      'Bu hanenin verilerine artık bu cihazdan erişemeyeceksin. Diğer üyelerin verisi etkilenmez.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Ayrıl', style: 'destructive', onPress: () => leaveHousehold() },
      ]
    );
  }

  if (!household) return null;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Ayarlar</Text>

        <LinearGradient
          colors={gradients.heroDark}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.inviteCard}
        >
          <Text style={styles.inviteLabel}>{household.name}</Text>
          <View style={styles.inviteRow}>
            <Text style={styles.inviteCode}>{household.inviteCode}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareInvite} activeOpacity={0.85}>
              <Ionicons name="share-social" size={15} color={colors.primary} />
              <Text style={styles.shareButtonText}>Davet Et</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Görünüm</Text>
          <View style={styles.modeRow}>
            {THEME_OPTIONS.map((opt) => {
              const active = themeMode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.modeButton, active && styles.modeButtonActive]}
                  onPress={() => setThemeMode(opt.key)}
                  activeOpacity={0.85}
                >
                  <Ionicons name={opt.icon} size={15} color={active ? colors.primary : colors.textMuted} />
                  <Text style={[styles.modeButtonText, active && styles.modeButtonTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hane üyeleri</Text>
          {members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <MemberAvatar member={m} size={30} />
              <Text style={styles.memberName}>{m.displayName}</Text>
              {m.id === currentMember?.id && (
                <View style={styles.youBadge}>
                  <Text style={styles.youBadgeText}>Sen</Text>
                </View>
              )}
            </View>
          ))}
          <Text style={styles.hint}>
            Yeni birinin katılması için davet kodunu paylaş — kendi telefonunda "Haneye Katıl"ı seçip kodu girsin.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Odalar</Text>
          {rooms.map((room) => (
            <RoomEditRow
              key={room.id}
              room={room}
              onRename={renameRoom}
              onRemove={handleRemoveRoom}
            />
          ))}

          <Text style={[styles.hint, { marginTop: spacing.sm, marginBottom: spacing.xs }]}>
            Yeni oda ekle
          </Text>
          <View style={styles.iconPickerRow}>
            {roomIconChoices.map((icon) => (
              <TouchableOpacity
                key={icon}
                style={[styles.iconChoice, newRoomIcon === icon && styles.iconChoiceActive]}
                onPress={() => setNewRoomIcon(icon)}
              >
                <Text style={styles.iconChoiceText}>{icon}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Örn. Çalışma Odası"
              placeholderTextColor={colors.textMuted}
              value={newRoomName}
              onChangeText={setNewRoomName}
              onSubmitEditing={handleAddRoom}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddRoom} activeOpacity={0.85}>
              <Ionicons name="add" size={20} color={colors.textOnDark} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Mod</Text>
          <View style={styles.modeRow}>
            <TouchableOpacity
              style={[
                styles.modeButton,
                household.mode === 'collaborative' && styles.modeButtonActive,
              ]}
              onPress={() => setHouseholdMode('collaborative')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="people"
                size={15}
                color={household.mode === 'collaborative' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  household.mode === 'collaborative' && styles.modeButtonTextActive,
                ]}
              >
                İşbirlikçi
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.modeButton,
                household.mode === 'competitive' && styles.modeButtonActive,
              ]}
              onPress={() => setHouseholdMode('competitive')}
              activeOpacity={0.85}
            >
              <Ionicons
                name="trophy"
                size={15}
                color={household.mode === 'competitive' ? colors.primary : colors.textMuted}
              />
              <Text
                style={[
                  styles.modeButtonText,
                  household.mode === 'competitive' && styles.modeButtonTextActive,
                ]}
              >
                Rekabetçi
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.switchRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Bayatlama bildirimleri</Text>
              <Text style={styles.hint}>Bir görev süresi geçince hatırlatma al.</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={async (enabled) => {
                await toggleNotifications(enabled);
                if (enabled) registerPushToken();
              }}
              trackColor={{ false: colors.surfaceMuted, true: colors.primaryLight }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleLeave} activeOpacity={0.85}>
          <Ionicons name="log-out-outline" size={16} color={colors.danger} />
          <Text style={styles.dangerButtonText}>Haneden Ayrıl</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors, shadow: { card: object; floating: object }) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 26, fontFamily: fonts.displayBold, color: colors.text, marginBottom: spacing.md },
  inviteCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadow.floating,
  },
  inviteLabel: { fontSize: 13, fontFamily: fonts.bodyMedium, color: colors.textOnDarkMuted, marginBottom: spacing.xs },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  cardTitle: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.text, marginBottom: spacing.sm },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inviteCode: { fontSize: 26, fontFamily: fonts.displayExtraBold, letterSpacing: 5, color: colors.textOnDark },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.textOnDark,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  shareButtonText: { color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 13 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  memberName: { flex: 1, fontSize: 14, color: colors.text, fontFamily: fonts.bodySemiBold },
  youBadge: {
    backgroundColor: colors.primaryMuted,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  youBadgeText: { fontSize: 11, fontFamily: fonts.bodyBold, color: colors.primary },
  iconPickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
  iconChoice: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  iconChoiceActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  iconChoiceText: { fontSize: 16 },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    color: colors.text,
    fontFamily: fonts.bodyMedium,
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 11, fontFamily: fonts.body, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
  },
  modeButtonActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  modeButtonText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold, fontSize: 13 },
  modeButtonTextActive: { color: colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.danger,
    backgroundColor: colors.dangerMuted,
    borderRadius: radius.md,
    paddingVertical: 12,
    marginTop: spacing.sm,
  },
  dangerButtonText: { color: colors.danger, fontFamily: fonts.bodyBold },
  });
}
