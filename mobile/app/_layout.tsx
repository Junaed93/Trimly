import '../global.css';
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, Platform } from 'react-native';
import { ThemeProvider, useTheme } from '../context/ThemeContext';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

let LiquidThemeProvider: any = ({ children }: any) => <>{children}</>;
if (Platform.OS !== 'web') {
  LiquidThemeProvider = require('liquidglass-rn').LiquidThemeProvider;
}

function AppShell() {
  const { theme, isDark } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
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
