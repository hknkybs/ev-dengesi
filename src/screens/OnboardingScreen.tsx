import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { radius, spacing } from '../theme';
import { useTheme } from '../theme/ThemeContext';
import { ThemeColors } from '../theme/palette';
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

function friendlyError(err: unknown): string {
  const message = err instanceof Error ? err.message : String(err);
  if (message.includes('invite_code_not_found')) return 'Bu davet kodu bulunamadı. Kodu kontrol edip tekrar dene.';
  return 'Bir şeyler ters gitti. İnternet bağlantını kontrol edip tekrar dene.';
}

export function OnboardingScreen() {
  const createHousehold = useStore((s) => s.createHousehold);
  const joinHousehold = useStore((s) => s.joinHousehold);

  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [step, setStep] = useState(0);
  const [householdName, setHouseholdName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [type, setType] = useState<HouseholdType>('couple');
  const [template, setTemplate] = useState<TemplateKey>('2+1');
  const [inviteCode, setInviteCode] = useState('');
  const [joinName, setJoinName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { colors, gradients, shadow } = useTheme();
  const styles = useMemo(() => createStyles(colors, shadow), [colors, shadow]);

  const canContinueStep0 = householdName.trim().length > 0 && ownerName.trim().length > 0;
  const canJoin = inviteCode.trim().length > 0 && joinName.trim().length > 0;

  async function handleCreate() {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await createHousehold(householdName.trim(), type, template, ownerName.trim());
    } catch (err) {
      setErrorMessage(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleJoin() {
    if (submitting) return;
    setSubmitting(true);
    setErrorMessage(null);
    try {
      await joinHousehold(inviteCode.trim(), joinName.trim());
    } catch (err) {
      setErrorMessage(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
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
            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, mode === 'create' && styles.tabActive]}
                onPress={() => {
                  setMode('create');
                  setErrorMessage(null);
                }}
              >
                <Text style={[styles.tabText, mode === 'create' && styles.tabTextActive]}>
                  Haneyi Oluştur
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'join' && styles.tabActive]}
                onPress={() => {
                  setMode('join');
                  setErrorMessage(null);
                }}
              >
                <Text style={[styles.tabText, mode === 'join' && styles.tabTextActive]}>
                  Haneye Katıl
                </Text>
              </TouchableOpacity>
            </View>

            {errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

            {mode === 'join' && (
              <View style={styles.section}>
                <Text style={styles.label}>Davet kodu</Text>
                <TextInput
                  style={[styles.input, styles.inviteInput]}
                  placeholder="ÖRN. A1B2C3"
                  placeholderTextColor={colors.textMuted}
                  value={inviteCode}
                  onChangeText={(t) => setInviteCode(t.toUpperCase())}
                  autoCapitalize="characters"
                  maxLength={8}
                />
                <Text style={styles.label}>Senin adın</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn. Aleyna"
                  placeholderTextColor={colors.textMuted}
                  value={joinName}
                  onChangeText={setJoinName}
                />

                <TouchableOpacity
                  disabled={!canJoin || submitting}
                  onPress={handleJoin}
                  activeOpacity={0.88}
                  style={(!canJoin || submitting) && styles.disabledButton}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.textOnDark} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Haneye Katıl</Text>
                        <Ionicons name="arrow-forward" size={18} color={colors.textOnDark} />
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {mode === 'create' && step === 0 && (
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

            {mode === 'create' && step === 1 && (
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

                <TouchableOpacity
                  onPress={handleCreate}
                  activeOpacity={0.88}
                  disabled={submitting}
                  style={submitting && styles.disabledButton}
                >
                  <LinearGradient
                    colors={gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.primaryButton}
                  >
                    {submitting ? (
                      <ActivityIndicator color={colors.textOnDark} />
                    ) : (
                      <>
                        <Text style={styles.primaryButtonText}>Haneyi Oluştur</Text>
                        <Ionicons name="sparkles" size={18} color={colors.textOnDark} />
                      </>
                    )}
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

function createStyles(colors: ThemeColors, shadow: { soft: object; floating: object }) {
  return StyleSheet.create({
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
  tabRow: {
    flexDirection: 'row',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: { flex: 1, paddingVertical: 10, borderRadius: radius.pill, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface, ...shadow.soft },
  tabText: { fontSize: 13, fontFamily: fonts.bodySemiBold, color: colors.textMuted },
  tabTextActive: { color: colors.primary },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.bodyMedium,
    color: colors.danger,
    marginBottom: spacing.sm,
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
  inviteInput: { fontFamily: fonts.displayBold, letterSpacing: 3, textAlign: 'center', fontSize: 18 },
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
    minHeight: 50,
    ...shadow.floating,
  },
  disabledButton: { opacity: 0.45 },
  primaryButtonText: { color: colors.textOnDark, fontFamily: fonts.bodyBold, fontSize: 15 },
  secondaryButton: { alignItems: 'center', paddingVertical: spacing.md },
  secondaryButtonText: { color: colors.textMuted, fontFamily: fonts.bodySemiBold },
  });
}
