import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { DarkTheme, DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../state/store';
import { useTheme } from '../theme/ThemeContext';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeMapScreen } from '../screens/HomeMapScreen';
import { RoomDetailScreen } from '../screens/RoomDetailScreen';
import { ScoreScreen } from '../screens/ScoreScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HomeStackParamList, RootTabParamList } from './types';
import { radius, spacing } from '../theme';
import { ThemeColors } from '../theme/palette';
import { fonts } from '../theme/typography';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Ev: 'home',
  Skor: 'stats-chart',
  Ayarlar: 'settings-sharp',
};

const TAB_ICONS_OUTLINE: Record<keyof RootTabParamList, keyof typeof Ionicons.glyphMap> = {
  Ev: 'home-outline',
  Skor: 'stats-chart-outline',
  Ayarlar: 'settings-outline',
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMap" component={HomeMapScreen} />
      <HomeStack.Screen name="RoomDetail" component={RoomDetailScreen} />
    </HomeStack.Navigator>
  );
}

function TabIcon({
  name,
  focused,
  colors,
}: {
  name: keyof RootTabParamList;
  focused: boolean;
  colors: ThemeColors;
}) {
  const icon = focused ? TAB_ICONS[name] : TAB_ICONS_OUTLINE[name];
  const styles = createIconStyles(colors);
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={icon} size={19} color={focused ? colors.textOnDark : colors.textMuted} />
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: 58 + insets.bottom,
          paddingBottom: insets.bottom + 8,
          paddingTop: 10,
        },
        tabBarLabelStyle: { fontFamily: fonts.bodySemiBold, fontSize: 11, marginTop: 2 },
        tabBarIcon: ({ focused }) => (
          <TabIcon name={route.name as keyof RootTabParamList} focused={focused} colors={colors} />
        ),
      })}
    >
      <Tab.Screen name="Ev" component={HomeStackNavigator} />
      <Tab.Screen name="Skor" component={ScoreScreen} />
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

function BootScreen({ error }: { error?: string | null }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background, padding: spacing.lg }}>
      {error ? (
        <Text style={{ color: colors.danger, fontFamily: fonts.bodyMedium, textAlign: 'center' }}>
          Bağlantı kurulamadı: {error}
        </Text>
      ) : (
        <ActivityIndicator color={colors.primary} />
      )}
    </View>
  );
}

export function RootNavigator() {
  const household = useStore((s) => s.household);
  const bootStatus = useStore((s) => s.bootStatus);
  const bootError = useStore((s) => s.bootError);
  const { colors, isDark } = useTheme();

  const navTheme: Theme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      {bootStatus === 'loading' && <BootScreen />}
      {bootStatus === 'error' && <BootScreen error={bootError} />}
      {bootStatus === 'ready' && household && <MainTabs />}
      {bootStatus === 'onboarding' && <OnboardingScreen />}
    </NavigationContainer>
  );
}

function createIconStyles(colors: ThemeColors) {
  return StyleSheet.create({
    iconWrap: {
      width: 38,
      height: 30,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapActive: {
      backgroundColor: colors.primary,
    },
  });
}
