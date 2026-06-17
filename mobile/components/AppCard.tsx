import React from 'react';
import { View, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: 'elevated' | 'glass' | 'flat';
  padding?: number;
}

export default function AppCard({ children, style, variant = 'glass', padding = 20 }: AppCardProps) {
  const { theme, isDark } = useTheme();

  const getVariantStyles = () => {
    switch (variant) {
      case 'glass':
        return {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.4)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.6)',
          borderWidth: 1,
        };
      case 'elevated':
        return {
          backgroundColor: theme.surfaceRaised,
          borderColor: theme.border,
          borderWidth: 1,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 12 },
          shadowOpacity: isDark ? 0.4 : 0.08,
          shadowRadius: 16,
          elevation: 10,
        };
      case 'flat':
      default:
        return {
          backgroundColor: theme.surface,
          borderColor: theme.border,
          borderWidth: 1,
        };
    }
  };

  return (
    <View style={[styles.card, getVariantStyles(), { padding }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    overflow: 'hidden',
  },
});
