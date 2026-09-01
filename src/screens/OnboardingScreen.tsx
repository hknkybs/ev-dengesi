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
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../state/store';
import { HouseholdType, TemplateKey } from '../types';
import { TEMPLATE_LABELS } from '../data/roomTemplates';
import { colors, gradients, radius, shadow, spacing } from '../theme';
import { fonts } from '../theme/typography';

const TYPE_OPTIONS: {
  key: HouseholdType;
  label: string;
  hint: string;
  icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'couple', label: 'Çift', hint: 'İşbirlikçi mod — ortak hedef', icon: 'heart' },
  {
    key: 'roommates',
    label: 'Ev Arkadaşları',
    hint: 'Rekabetçi mod — sıralama görünür',
    icon: 'people',
  },
  { key: 'family', label: 'Aile', hint: 'İşbirlikçi mod — ortak hedef', icon: 'home' },
];

const TEMPLATE_ICONS: Record<TemplateKey, keyof typeof Ionicons.glyphMap> = {
  '1+1': 'business',
  '2+1': 'business',
  '3+1': 'business',
  'ogrenci-evi': 'school',
  mustakil: 'home',
};

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
    <View style={styles.container}>
      <LinearGradient colors={gradients.heroDark} style={styles.hero}>
        <SafeAreaView edges={['top']}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeEmoji}>🏡</Text>
          </View>
          <Text style={styles.title}>Ev Dengesi</Text>
          <Text style={styles.subtitle}>
            Kimin ne kadar iş yaptığını tartışmadan görün. Önce hanenizi kuralım.
          </Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.sheet}>
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
                {TYPE_OPTIONS.map((opt) => {
                  const active = type === opt.key;
                  return (
                    <TouchableOpacity
                      key={opt.key}
                      style={[styles.optionRow, active && styles.optionRowActive]}
                      onPress={() => setType(opt.key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                        <Ionicons
                          name={opt.icon}
                          size={18}
                          color={active ? colors.textOnDark : colors.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>
                          {opt.label}
                        </Text>
                        <Text style={styles.optionHint}>{opt.hint}</Text>
                      </View>
                      {active && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity
                  disabled={!canContinueStep0}
                  onPress={() => setStep(1)}
                  activeOpacity={0.88}
                  style={!canContinueStep0 && styles.disabledButton}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Devam Et</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.textOnDark} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {step === 1 && (
              <View style={styles.section}>
                <Text style={styles.label}>Ev planı</Text>
                <Text style={styles.hintBlock}>
                  Kat planı çizmene gerek yok — hazır bir şablon seç, odaları sonra düzenlersin.
                </Text>
                {TEMPLATE_OPTIONS.map((key) => {
                  const active = template === key;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.optionRow, active && styles.optionRowActive]}
                      onPress={() => setTemplate(key)}
                      activeOpacity={0.8}
                    >
                      <View style={[styles.optionIcon, active && styles.optionIconActive]}>
                        <Ionicons
                          name={TEMPLATE_ICONS[key]}
                          size={18}
                          color={active ? colors.textOnDark : colors.primary}
                        />
                      </View>
                      <Text style={[styles.optionLabel, active && styles.optionLabelActive, { flex: 1 }]}>
                        {TEMPLATE_LABELS[key]}
                      </Text>
                      {active && (
                        <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                      )}
                    </TouchableOpacity>
                  );
                })}

                <TouchableOpacity onPress={handleCreate} activeOpacity={0.88}>
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    <Text style={styles.primaryButtonText}>Haneyi Oluştur</Text>
                    <Ionicons name="sparkles" size={18} color={colors.textOnDark} />
                  </LinearGradient>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryButton} onPress={() => setStep(0)}>
                  <Text style={styles.secondaryButtonText}>Geri</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  hero: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    borderBottomLeftRadius: radius.xl,
    borderBottomRightRadius: radius.xl,
  },
  heroBadge: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  heroBadgeEmoji: { fontSize: 28 },
  title: {
    fontSize: 32,
    fontFamily: fonts.displayBold,
    color: colors.textOnDark,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fonts.body,
    color: colors.textOnDarkMuted,
    marginTop: spacing.xs,
    lineHeight: 20,
    maxWidth: 320,
  },
  scroll: { paddingBottom: spacing.xl },
  sheet: {
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  section: { gap: spacing.xs },
  label: {
    fontSize: 13,
    fontFamily: fonts.bodyBold,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  hintBlock: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted, marginBottom: spacing.md },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 15,
    fontFamily: fonts.bodyMedium,
    color: colors.text,
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadow.soft,
  },
  optionRowActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryMuted,
  },
  optionIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionIconActive: { backgroundColor: colors.primary },
  optionLabel: { fontSize: 15, fontFamily: fonts.bodyBold, color: colors.text },
  optionLabelActive: { color: colors.primary },
  optionHint: { fontSize: 12, fontFamily: fonts.body, color: colors.textMuted, marginTop: 2 },
  primaryButton: {
    flexDirection: 'row',
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    ...shadow.floating,
  },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: { color: colors.textOnDark, fontFamily: fonts.bodyBold, fontSize: 15 },
  secondaryButton: { alignItems: 'center', paddingVertical: spacing.md },
  secondaryButtonText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold },
});
