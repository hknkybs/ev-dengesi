import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { androidChannelSetup } from './src/lib/notifications';

export default function App() {
  useEffect(() => {
    androidChannelSetup();
  }, []);

  return (
    <SafeAreaProvider>
      <RootNavigator />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
