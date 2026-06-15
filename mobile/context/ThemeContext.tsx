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
  bg: '#0B0F14',
  bgSecondary: '#111720',
  surface: '#151C26',
  surfaceRaised: '#1E2734',
  border: '#202936',
  borderStrong: '#2C3A4A',
  text: '#F8FAFC',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textPlaceholder: '#475569',
  
  primary: '#10B981', // Emerald
  primaryLight: '#34D399',
  primarySurface: 'rgba(16,185,129,0.12)',
  primaryBorder: 'rgba(16,185,129,0.4)',
  
  secondary: '#8B5CF6', // Purple
  secondaryLight: '#A78BFA',
  
  accent: '#10B981', // Mapped to primary
  accentLight: '#34D399',
  accentSurface: 'rgba(16,185,129,0.12)',
  accentBorder: 'rgba(16,185,129,0.4)',
  
  error: '#EF4444',
  errorSurface: 'rgba(239,68,68,0.12)',
  errorBorder: 'rgba(239,68,68,0.3)',
  success: '#10B981',
  successSurface: 'rgba(16,185,129,0.12)',
  warning: '#F59E0B',
  
  navBg: '#0B0F14',
  navBorder: '#202936',
};

// ─── Light Theme ─────────────────────────────────────────────────────────────
export const lightTheme: Theme = {
  isDark: false,
  bg: '#f8fafc',
  bgSecondary: '#f1f5f9',
  surface: '#ffffff',
  surfaceRaised: '#f8fafc',
  border: '#e2e8f0',
  borderStrong: '#cbd5e1',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textPlaceholder: '#94a3b8',
  
  primary: '#10B981',
  primaryLight: '#059669',
  primarySurface: 'rgba(16,185,129,0.08)',
  primaryBorder: 'rgba(16,185,129,0.3)',
  
  secondary: '#8B5CF6',
  secondaryLight: '#7C3AED',
  
  accent: '#10B981',
  accentLight: '#059669',
  accentSurface: 'rgba(16,185,129,0.08)',
  accentBorder: 'rgba(16,185,129,0.3)',
  
  error: '#dc2626',
  errorSurface: 'rgba(220,38,38,0.06)',
  errorBorder: 'rgba(220,38,38,0.2)',
  success: '#16a34a',
  successSurface: 'rgba(22,163,74,0.08)',
  warning: '#d97706',
  navBg: '#ffffff',
  navBorder: '#e2e8f0',
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
