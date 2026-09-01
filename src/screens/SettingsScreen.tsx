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
import { useStore } from '../state/store';
import { MemberAvatar } from '../components/MemberAvatar';
import { colors, gradients, radius, shadow, spacing } from '../theme';
import { fonts } from '../theme/typography';

export function SettingsScreen() {
  const household = useStore((s) => s.household);
  const allMembers = useStore((s) => s.members);
  const members = useMemo(() => allMembers.filter((m) => !m.leftAt), [allMembers]);
  const addMember = useStore((s) => s.addMember);
  const removeMember = useStore((s) => s.removeMember);
  const setHouseholdMode = useStore((s) => s.setHouseholdMode);
  const notificationsEnabled = useStore((s) => s.notificationsEnabled);
  const toggleNotifications = useStore((s) => s.toggleNotifications);
  const resetHousehold = useStore((s) => s.resetHousehold);

  const [newMemberName, setNewMemberName] = useState('');

  function handleAddMember() {
    const name = newMemberName.trim();
    if (!name) return;
    addMember(name);
    setNewMemberName('');
  }

  function handleShareInvite() {
    if (!household) return;
    Share.share({
      message: `${household.name} hanesine katıl! Davet kodu: ${household.inviteCode}`,
    });
  }

  function handleReset() {
    Alert.alert(
      'Haneyi sil',
      'Tüm oda, görev ve puan verileri silinecek. Bu geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: resetHousehold },
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
          <Text style={styles.cardTitle}>Hane üyeleri</Text>
          {members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <MemberAvatar member={m} size={30} />
              <Text style={styles.memberName}>{m.displayName}</Text>
              {members.length > 1 && (
                <TouchableOpacity onPress={() => removeMember(m.id)}>
                  <Text style={styles.removeText}>Ayrıl</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
          <View style={styles.addRow}>
            <TextInput
              style={styles.input}
              placeholder="Yeni üye adı"
              placeholderTextColor={colors.textMuted}
              value={newMemberName}
              onChangeText={setNewMemberName}
              onSubmitEditing={handleAddMember}
            />
            <TouchableOpacity style={styles.addButton} onPress={handleAddMember} activeOpacity={0.85}>
              <Ionicons name="add" size={20} color={colors.textOnDark} />
            </TouchableOpacity>
          </View>
          <Text style={styles.hint}>
            Gerçek davetler backend bağlanınca davet koduyla otomatik katılım şeklinde çalışır.
            Şimdilik demo için üyeleri buradan ekleyebilirsin.
          </Text>
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
              onValueChange={toggleNotifications}
              trackColor={{ false: colors.surfaceMuted, true: colors.primaryLight }}
              thumbColor={colors.surface}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleReset} activeOpacity={0.85}>
          <Ionicons name="trash-outline" size={16} color={colors.danger} />
          <Text style={styles.dangerButtonText}>Haneyi Sil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  removeText: { color: colors.danger, fontSize: 13, fontFamily: fonts.bodyBold },
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
