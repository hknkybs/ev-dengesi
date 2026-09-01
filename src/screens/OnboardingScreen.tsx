import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { HouseholdType, TemplateKey } from '../types';
import { TEMPLATE_LABELS } from '../data/roomTemplates';
import { colors, radius, spacing } from '../theme';

const TYPE_OPTIONS: { key: HouseholdType; label: string; hint: string }[] = [
  { key: 'couple', label: 'Çift', hint: 'İşbirlikçi mod — ortak hedef' },
  { key: 'roommates', label: 'Ev Arkadaşları', hint: 'Rekabetçi mod — sıralama görünür' },
  { key: 'family', label: 'Aile', hint: 'İşbirlikçi mod — ortak hedef' },
];

const TEMPLATE_OPTIONS = Object.keys(TEMPLATE_LABELS) as TemplateKey[];

export function OnboardingScreen() {
  const createHousehold = useStore((s) => s.createHousehold);
  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [type, setType] = useState<HouseholdType>('couple');
  const [template, setTemplate] = useState<TemplateKey>('2+1');

  const canContinueStep0 = householdName.trim().length > 0 && ownerName.trim().length > 0;

  function handleCreate() {
    createHousehold(householdName.trim(), type, template, ownerName.trim());
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.title}>Ev Dengesi</Text>
          <Text style={styles.subtitle}>
            Kimin ne kadar iş yaptığını tartışmadan görün. Önce hanenizi kuralım.
          </Text>

          {step === 0 && (
            <View style={styles.section}>
              <Text style={styles.label}>Hanenin adı</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn. Bizim Ev"
                placeholderTextColor={colors.textMuted}
                value={householdName}
                onChangeText={setHouseholdName}
              />
              <Text style={styles.label}>Senin adın</Text>
              <TextInput
                style={styles.input}
                placeholder="Örn. Deniz"
                placeholderTextColor={colors.textMuted}
                value={ownerName}
                onChangeText={setOwnerName}
              />

              <Text style={[styles.label, { marginTop: spacing.lg }]}>Hane tipi</Text>
              {TYPE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.key}
                  style={[styles.optionRow, type === opt.key && styles.optionRowActive]}
                  onPress={() => setType(opt.key)}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={[styles.optionLabel, type === opt.key && styles.optionLabelActive]}
                    >
                      {opt.label}
                    </Text>
                    <Text style={styles.optionHint}>{opt.hint}</Text>
                  </View>
                  {type === opt.key && <View style={styles.checkDot} />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity
                style={[styles.primaryButton, !canContinueStep0 && styles.disabledButton]}
                disabled={!canContinueStep0}
                onPress={() => setStep(1)}
              >
                <Text style={styles.primaryButtonText}>Devam Et</Text>
              </TouchableOpacity>
            </View>
          )}

          {step === 1 && (
            <View style={styles.section}>
              <Text style={styles.label}>Ev planı</Text>
              <Text style={styles.hintBlock}>
                Kat planı çizmene gerek yok — hazır bir şablon seç, odaları sonra düzenlersin.
              </Text>
              {TEMPLATE_OPTIONS.map((key) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.optionRow, template === key && styles.optionRowActive]}
                  onPress={() => setTemplate(key)}
                >
                  <Text
                    style={[styles.optionLabel, template === key && styles.optionLabelActive]}
                  >
                    {TEMPLATE_LABELS[key]}
                  </Text>
                  {template === key && <View style={styles.checkDot} />}
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.primaryButton} onPress={handleCreate}>
                <Text style={styles.primaryButtonText}>Haneyi Oluştur</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(0)}>
                <Text style={styles.secondaryButtonText}>Geri</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: spacing.xl },
  title: { fontSize: 28, fontWeight: '800', color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: 14, color: colors.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
  section: { gap: spacing.xs },
  label: { fontSize: 13, fontWeight: '700', color: colors.text, marginBottom: spacing.xs, marginTop: spacing.sm },
  hintBlock: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
  optionLabelActive: { color: colors.primary },
  optionHint: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  checkDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  disabledButton: { opacity: 0.4 },
  primaryButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryButton: { alignItems: 'center', paddingVertical: spacing.md },
  secondaryButtonText: { color: colors.textMuted, fontWeight: '600' },
});
