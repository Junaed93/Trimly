import '../global.css';
import React from 'react';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import NotificationPoller from '../components/NotificationPoller';
import * as Notifications from 'expo-notifications';
import { markNotificationRead } from '../services/api';

let LiquidThemeProvider: any = ({ children }: any) => <>{children}</>;
if (Platform.OS !== 'web') {
  LiquidThemeProvider = require('liquidglass-rn').LiquidThemeProvider;
}

// Handle notifications that are received while the app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

function AppShell() {
  const { theme, isDark } = useTheme();
  const router = useRouter();

  React.useEffect(() => {
    // Request permissions
    const requestPermissions = async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        await Notifications.requestPermissionsAsync();
      }
    };
    requestPermissions();

    // Listen for user tapping on a notification
    const responseListener = Notifications.addNotificationResponseReceivedListener(async response => {
      const { data } = response.notification.request.content;
      if (data && data.id) {
        try {
          await markNotificationRead(data.id as number);
        } catch(e) {}
        router.push('/notifications');
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NotificationPoller />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.bg },
          animation: 'slide_from_right',
        }}
      />
    </View>
  );
}

export default function RootLayout() {

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <LiquidThemeProvider defaultMode="system">
        <ThemeProvider>
          <AppShell />
        </ThemeProvider>
      </LiquidThemeProvider>
    </GestureHandlerRootView>
  );
}
