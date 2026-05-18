import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

export default function TabLayout() {
  const { theme, isDark } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          bottom: Platform.OS === 'ios' ? 24 : 16,
          left: 16,
          right: 16,
          elevation: 0,
          backgroundColor: 'transparent',
          borderRadius: 32,
          height: 64,
          borderTopWidth: 0,
        },
        tabBarBackground: () => (
          <View style={[styles.blurContainer, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)' }]}>
            {Platform.OS !== 'web' ? (
              <BlurView
                tint={isDark ? "dark" : "light"}
                intensity={80}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' } as any]} />
            )}
          </View>
        ),
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarItemStyle: Platform.OS === 'web' ? { outlineStyle: 'none' } as any : undefined,
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.textMuted,
      }}>
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? "home" : "home-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="food"
        options={{
          title: 'Food',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? "restaurant" : "restaurant-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calorie"
        options={{
          title: 'Calorie',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? "flame" : "flame-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconWrapper}>
              <Ionicons name={focused ? "person" : "person-outline"} size={26} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS === 'ios' ? 8 : 4,
  }
});
