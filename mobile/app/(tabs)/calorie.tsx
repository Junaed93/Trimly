import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import GlassBackground from '../../components/GlassBackground';
import { useTheme } from '../../context/ThemeContext';

export default function CalorieScreen() {
  const { theme } = useTheme();

  return (
    <GlassBackground>
      <View style={styles.container}>
        <View style={[styles.glassCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Calorie Burn</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Track your daily calorie expenditure</Text>
        </View>
      </View>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
  },
  glassCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', 
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
});
