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
import { useStore } from '../state/store';
import { MemberAvatar } from '../components/MemberAvatar';
import { colors, radius, spacing } from '../theme';

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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Ayarlar</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>{household.name}</Text>
          <View style={styles.inviteRow}>
            <Text style={styles.inviteCode}>{household.inviteCode}</Text>
            <TouchableOpacity style={styles.shareButton} onPress={handleShareInvite}>
              <Text style={styles.shareButtonText}>Davet Et</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Hane üyeleri</Text>
          {members.map((m) => (
            <View key={m.id} style={styles.memberRow}>
              <MemberAvatar member={m} size={28} />
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
            <TouchableOpacity style={styles.addButton} onPress={handleAddMember}>
              <Text style={styles.addButtonText}>Ekle</Text>
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
            >
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
            >
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
            <Switch value={notificationsEnabled} onValueChange={toggleNotifications} />
          </View>
        </View>

        <TouchableOpacity style={styles.dangerButton} onPress={handleReset}>
          <Text style={styles.dangerButtonText}>Haneyi Sil</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, marginBottom: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: spacing.sm },
  inviteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  inviteCode: { fontSize: 22, fontWeight: '800', letterSpacing: 4, color: colors.primary },
  shareButton: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  shareButtonText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  memberName: { flex: 1, fontSize: 14, color: colors.text, fontWeight: '500' },
  removeText: { color: colors.danger, fontSize: 13, fontWeight: '600' },
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
  },
  addButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  addButtonText: { color: '#fff', fontWeight: '700' },
  hint: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  modeRow: { flexDirection: 'row', gap: spacing.sm },
  modeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  modeButtonActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  modeButtonText: { color: colors.textMuted, fontWeight: '600', fontSize: 13 },
  modeButtonTextActive: { color: colors.primary },
  switchRow: { flexDirection: 'row', alignItems: 'center' },
  dangerButton: {
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  dangerButtonText: { color: colors.danger, fontWeight: '700' },
});
