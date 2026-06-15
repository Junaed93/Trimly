import React, { useEffect, useState } from 'react';
import { View, Platform, StyleSheet, Keyboard, TouchableOpacity, Text } from 'react-native';
import { Tabs } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Icons from 'lucide-react-native';

let LiquidTabBar: any = null;
if (Platform.OS !== 'web') {
  LiquidTabBar = require('liquidglass-rn').LiquidTabBar;
}

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme, isDark } = useTheme();
  
  const visibleRouteNames = ['home', 'food', 'calorie', 'exercise', 'profile'];
  const visibleRoutes = state.routes.filter((route) => visibleRouteNames.includes(route.name));
  
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  }, []);

  if (isKeyboardVisible) return null;

  const routes: any[] = visibleRoutes.map((route) => {
    let title = route.name;
    let icon: any = 'Home';
    if (route.name === 'home') { title = 'Home'; icon = 'Home'; }
    else if (route.name === 'food') { title = 'Food'; icon = 'Utensils'; }
    else if (route.name === 'calorie') { title = 'Calorie'; icon = 'Flame'; }
    else if (route.name === 'exercise') { title = 'Exercise'; icon = 'Dumbbell'; }
    else if (route.name === 'profile') { title = 'Profile'; icon = 'User'; }

    return {
      key: route.key,
      title,
      icon,
    };
  });

  const currentRouteName = state.routes[state.index]?.name;
  const activeIndex = visibleRoutes.findIndex(r => r.name === currentRouteName);

  const onChange = (index: number) => {
    const route = visibleRoutes[index];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (activeIndex !== index && !event.defaultPrevented) {
      navigation.navigate({ name: route.name, params: undefined, merge: true });
    }
  };

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.tabBarContainer, { height: 64, flexDirection: 'row', backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', backdropFilter: 'blur(15px)', borderRadius: 32, overflow: 'hidden' } as any]}>
        {routes.map((route, index) => {
          const isActive = index === activeIndex;
          const IconComponent = (Icons as any)[route.icon] || Icons.HelpCircle;
          return (
            <TouchableOpacity key={route.key} style={styles.webTabItem} onPress={() => onChange(index)}>
              <IconComponent size={22} color={isActive ? theme.accentLight : theme.textMuted} />
              <Text style={{ fontSize: 10, marginTop: 4, color: isActive ? theme.accentLight : theme.textMuted }}>{route.title}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.tabBarContainer}>
      <LiquidTabBar
        routes={routes}
        activeIndex={Math.max(0, activeIndex)}
        onChange={onChange}
        activeColor={theme.accentLight}
        inactiveColor={theme.textMuted}
      />
    </View>
  );
};

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="food" />
      <Tabs.Screen name="calorie" />
      <Tabs.Screen name="exercise" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 10,
  },
  webTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  }
});

