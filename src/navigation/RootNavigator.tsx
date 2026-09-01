import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '../state/store';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { HomeMapScreen } from '../screens/HomeMapScreen';
import { RoomDetailScreen } from '../screens/RoomDetailScreen';
import { ScoreScreen } from '../screens/ScoreScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { HomeStackParamList, RootTabParamList } from './types';
import { colors } from '../theme';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

const TAB_ICONS: Record<keyof RootTabParamList, string> = {
  Ev: '🏠',
  Skor: '📊',
  Ayarlar: '⚙️',
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMap" component={HomeMapScreen} />
      <HomeStack.Screen name="RoomDetail" component={RoomDetailScreen} />
    </HomeStack.Navigator>
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
          height: 52 + insets.bottom,
          paddingBottom: insets.bottom + 6,
          paddingTop: 6,
        },
        tabBarIcon: () => (
          <Text style={{ fontSize: 20 }}>{TAB_ICONS[route.name as keyof RootTabParamList]}</Text>
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
