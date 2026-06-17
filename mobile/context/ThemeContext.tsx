import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ─── Token Types ────────────────────────────────────────────────────────────
export interface Theme {
  isDark: boolean;
  // Backgrounds
  bg: string;
  bgSecondary: string;
  surface: string;
  surfaceRaised: string;
  // Borders
  border: string;
  borderStrong: string;
  // Text
  text: string;
  textSecondary: string;
  textMuted: string;
  textPlaceholder: string;
  // Brand Colors
  primary: string;
  primaryLight: string;
  primarySurface: string;
  primaryBorder: string;
  secondary: string;
  secondaryLight: string;
  // Old Accent (Map to Primary for compatibility during transition)
  accent: string;
  accentLight: string;
  accentSurface: string;
  accentBorder: string;
  // Semantic
  error: string;
  errorSurface: string;
  errorBorder: string;
  success: string;
  successSurface: string;
  warning: string;
  // Nav
  navBg: string;
  navBorder: string;
}

// ─── Dark Theme ──────────────────────────────────────────────────────────────
export const darkTheme: Theme = {
  isDark: true,
  bg: '#000000',
  bgSecondary: '#0C0C0C',
  surface: '#121212',
  surfaceRaised: '#1C1C1E',
  border: '#2C2C2E',
  borderStrong: '#3A3A3C',
  text: '#FFFFFF',
  textSecondary: '#EBEBF5',
  textMuted: '#8E8E93',
  textPlaceholder: '#636366',
  
  primary: '#32D74B', // iOS System Green
  primaryLight: '#30D158',
  primarySurface: 'rgba(50,215,75,0.12)',
  primaryBorder: 'rgba(50,215,75,0.4)',
  
  secondary: '#0A84FF', // iOS System Blue
  secondaryLight: '#5E5CE6', // iOS System Indigo
  
  accent: '#32D74B', 
  accentLight: '#30D158',
  accentSurface: 'rgba(50,215,75,0.12)',
  accentBorder: 'rgba(50,215,75,0.4)',
  
  error: '#FF453A', // iOS System Red
  errorSurface: 'rgba(255,69,58,0.12)',
  errorBorder: 'rgba(255,69,58,0.3)',
  success: '#32D74B',
  successSurface: 'rgba(50,215,75,0.12)',
  warning: '#FF9F0A', // iOS System Orange
  
  navBg: '#000000',
  navBorder: '#2C2C2E',
};

// ─── Light Theme ─────────────────────────────────────────────────────────────
export const lightTheme: Theme = {
  isDark: false,
  bg: '#F2F2F7',
  bgSecondary: '#FFFFFF',
  surface: '#FFFFFF',
  surfaceRaised: '#F2F2F7',
  border: '#E5E5EA',
  borderStrong: '#D1D1D6',
  text: '#000000',
  textSecondary: '#3C3C43',
  textMuted: '#8E8E93',
  textPlaceholder: '#C7C7CC',
  
  primary: '#34C759', // iOS System Green Light
  primaryLight: '#28CD41',
  primarySurface: 'rgba(52,199,89,0.08)',
  primaryBorder: 'rgba(52,199,89,0.3)',
  
  secondary: '#007AFF', // iOS System Blue Light
  secondaryLight: '#5856D6', // iOS System Indigo Light
  
  accent: '#34C759',
  accentLight: '#28CD41',
  accentSurface: 'rgba(52,199,89,0.08)',
  accentBorder: 'rgba(52,199,89,0.3)',
  
  error: '#FF3B30',
  errorSurface: 'rgba(255,59,48,0.08)',
  errorBorder: 'rgba(255,59,48,0.2)',
  success: '#34C759',
  successSurface: 'rgba(52,199,89,0.08)',
  warning: '#FF9500',
  navBg: '#FFFFFF',
  navBorder: '#E5E5EA',
};

// ─── Context ─────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: darkTheme,
  isDark: true,
  toggleTheme: () => {},
});

const STORAGE_KEY = '@fittrackbd_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  // Load persisted preference on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((val) => {
      if (val !== null) {
        setIsDark(val === 'dark');
      }
    });
  }, []);

  const toggleTheme = async () => {
    const next = !isDark;
    setIsDark(next);
    await AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
  };

  const theme = isDark ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
