import React from 'react';
import { StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../state/store';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeMapScreen } from '../screens/HomeMapScreen';
import { RoomDetailScreen } from '../screens/RoomDetailScreen';
import { ScoreScreen } from '../screens/ScoreScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HomeStackParamList, RootTabParamList } from './types';
import { colors, radius, spacing } from '../theme';
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

function TabIcon({ name, focused }: { name: keyof RootTabParamList; focused: boolean }) {
  const icon = focused ? TAB_ICONS[name] : TAB_ICONS_OUTLINE[name];
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Ionicons name={icon} size={19} color={focused ? colors.textOnDark : colors.textMuted} />
    </View>
  );
}

function MainTabs() {
  const insets = useSafeAreaInsets();

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
          <TabIcon name={route.name as keyof RootTabParamList} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Ev" component={HomeStackNavigator} />
      <Tab.Screen name="Skor" component={ScoreScreen} />
      <Tab.Screen name="Ayarlar" component={SettingsScreen} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const household = useStore((s) => s.household);

  return (
    <NavigationContainer>
      {household ? <MainTabs /> : <OnboardingScreen />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
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
