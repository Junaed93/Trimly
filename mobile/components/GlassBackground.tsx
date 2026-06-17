import React from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { GlassView, isGlassEffectAPIAvailable } from 'expo-glass-effect';
import { useTheme } from '../context/ThemeContext';

const { width, height } = Dimensions.get('window');

export default function GlassBackground({ children }: { children: React.ReactNode }) {
  const { isDark } = useTheme();
  const useLiquidGlass = Platform.OS === 'ios' && typeof isGlassEffectAPIAvailable === 'function' && isGlassEffectAPIAvailable();

  return (
    <View style={styles.container}>
      {/* Abstract Gradient Orbs */}
      <View style={[styles.backgroundContainer, { backgroundColor: isDark ? '#000' : '#f8fafc' }]}>
        <LinearGradient
          colors={isDark ? ['#1e1b4b', '#1e1b4b'] : ['#e0e7ff', '#c7d2fe']}
          style={[styles.orb, { top: -height * 0.1, left: -width * 0.2, width: width * 0.8, height: width * 0.8, opacity: isDark ? 0.4 : 0.8 }]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        />
        <LinearGradient
          colors={isDark ? ['#064e3b', '#064e3b'] : ['#d1fae5', '#a7f3d0']}
          style={[styles.orb, { bottom: height * 0.1, right: -width * 0.3, width: width * 0.9, height: width * 0.9, opacity: isDark ? 0.3 : 0.8 }]}
          start={{ x: 1, y: 1 }} end={{ x: 0, y: 0 }}
        />
        <LinearGradient
          colors={isDark ? ['#831843', '#831843'] : ['#fce7f3', '#fbcfe8']}
          style={[styles.orb, { top: height * 0.4, left: width * 0.1, width: width * 0.6, height: width * 0.6, opacity: isDark ? 0.3 : 0.8 }]}
          start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
        />
      </View>

      {/* Main Glass Layer */}
      <View style={styles.absolute} pointerEvents="none">
        {useLiquidGlass ? (
          <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFillObject} />
        ) : Platform.OS !== 'web' ? (
          <BlurView intensity={isDark ? 100 : 80} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFillObject} />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(255,255,255,0.75)' } as any]} />
        )}

        <LinearGradient
          colors={[
            isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
            isDark ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.3)',
            isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.5)'
          ]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </View>

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Fallback
  },
  backgroundContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  absolute: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    flex: 1,
  },
  orb: {
    position: 'absolute',
    borderRadius: 9999,
  }
});
