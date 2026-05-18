import React, { useEffect, useState, useRef } from 'react';
import { View, Platform, StyleSheet, Animated, useWindowDimensions, Keyboard, PanResponder, TouchableOpacity } from 'react-native';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const { theme, isDark } = useTheme();
  const { width } = useWindowDimensions();
  
  // Tab Bar Width configuration
  const HORIZONTAL_PADDING = 16;
  const TAB_BAR_WIDTH = width - (HORIZONTAL_PADDING * 2);
  const TAB_WIDTH = TAB_BAR_WIDTH / state.routes.length;
  
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const panX = useRef(new Animated.Value(state.index * TAB_WIDTH)).current;

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

  // Sync animation when state changes externally (e.g. standard click or back button)
  useEffect(() => {
    Animated.spring(panX, {
      toValue: state.index * TAB_WIDTH,
      useNativeDriver: false,
      bounciness: 8,
      speed: 12
    }).start();
  }, [state.index, TAB_WIDTH]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // Let TouchableOpacity handle pure taps/clicks!
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (e, gs) => Math.abs(gs.dx) > 5, // Hijack gesture if dragging horizontally
      onMoveShouldSetPanResponderCapture: (e, gs) => Math.abs(gs.dx) > 5,
      onPanResponderGrant: (e, gs) => {
        panX.stopAnimation();
        // Since we hijack mid-move, gs.x0 is where the gesture started.
        let localX = gs.x0 - HORIZONTAL_PADDING;
        let newX = localX - (TAB_WIDTH / 2);
        const maxX = (state.routes.length - 1) * TAB_WIDTH;
        if (newX < 0) newX = 0;
        if (newX > maxX) newX = maxX;
        panX.setValue(newX);
      },
      onPanResponderMove: (e, gs) => {
        let localX = gs.moveX - HORIZONTAL_PADDING;
        let newX = localX - (TAB_WIDTH / 2);
        const maxX = (state.routes.length - 1) * TAB_WIDTH;
        if (newX < 0) newX = 0;
        if (newX > maxX) newX = maxX;
        panX.setValue(newX);
      },
      onPanResponderRelease: (e, gs) => {
        let localX = (gs.moveX > 0 ? gs.moveX : gs.x0) - HORIZONTAL_PADDING;
        
        let targetIndex = Math.floor(localX / TAB_WIDTH);
        if (targetIndex < 0) targetIndex = 0;
        if (targetIndex >= state.routes.length) targetIndex = state.routes.length - 1;

        Animated.spring(panX, {
          toValue: targetIndex * TAB_WIDTH,
          useNativeDriver: false, // Ensure smooth handoff from JS touch to animation
          bounciness: 8,
          speed: 12
        }).start();

        const route = state.routes[targetIndex];
        
        const event = navigation.emit({
          type: 'tabPress',
          target: route.key,
          canPreventDefault: true,
        });

        if (targetIndex !== state.index && !event.defaultPrevented) {
          navigation.navigate({ name: route.name, merge: true });
        }
      },
      onPanResponderTerminate: () => {
         Animated.spring(panX, {
           toValue: state.index * TAB_WIDTH,
           useNativeDriver: false,
           bounciness: 8,
           speed: 12
         }).start();
      }
    })
  ).current;

  if (isKeyboardVisible) return null; // Hide on keyboard open

  return (
    <View style={styles.tabBarContainer}>
      <View style={[styles.blurContainer, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.5)' }]}>
        {Platform.OS !== 'web' ? (
          <BlurView tint={isDark ? "dark" : "light"} intensity={80} style={StyleSheet.absoluteFill} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)', backdropFilter: 'blur(10px)' } as any]} />
        )}
        
        {/* Animated Sliding Highlight Pill */}
        <Animated.View style={[
          styles.activePill, 
          { 
            width: TAB_WIDTH,
            transform: [{ translateX: panX }]
          }
        ]}>
          <View style={[styles.pillInner, { backgroundColor: theme.accentSurface }]} />
        </Animated.View>

        {/* Tab Items Container wrapped with PanResponder */}
        <View style={styles.tabItemsContainer} {...panResponder.panHandlers}>
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const isFocused = state.index === index;

            // Icons
            let iconName: any = 'home-outline';
            if (route.name === 'home') iconName = isFocused ? 'home' : 'home-outline';
            else if (route.name === 'food') iconName = isFocused ? 'restaurant' : 'restaurant-outline';
            else if (route.name === 'calorie') iconName = isFocused ? 'flame' : 'flame-outline';
            else if (route.name === 'profile') iconName = isFocused ? 'person' : 'person-outline';

            const onPress = () => {
              const event = navigation.emit({
                type: 'tabPress',
                target: route.key,
                canPreventDefault: true,
              });

              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate({ name: route.name, merge: true });
              }
            };

            const onLongPress = () => {
              navigation.emit({
                type: 'tabLongPress',
                target: route.key,
              });
            };

            return (
              <TouchableOpacity
                key={route.key}
                accessibilityRole="button"
                accessibilityState={isFocused ? { selected: true } : {}}
                accessibilityLabel={options.tabBarAccessibilityLabel}
                testID={options.tabBarTestID}
                onPress={onPress}
                onLongPress={onLongPress}
                style={styles.tabItem}
              >
                <AnimatedIcon 
                   name={iconName} 
                   panX={panX}
                   index={index}
                   tabWidth={TAB_WIDTH}
                   isFocused={isFocused} 
                   activeColor={theme.accentLight} 
                   inactiveColor={theme.textMuted} 
                />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// Continuous Magnifying Glass Effect driven directly by PanX
const AnimatedIcon = ({ name, panX, index, tabWidth, isFocused, activeColor, inactiveColor }: any) => {
  const targetX = index * tabWidth;
  
  // Bulge up to 1.35x scale when the highlight pill is perfectly centered underneath it
  const scale = panX.interpolate({
    inputRange: [targetX - tabWidth, targetX, targetX + tabWidth],
    outputRange: [1, 1.35, 1],
    extrapolate: 'clamp'
  });
  
  // Slight upward lift (levitation) when focused/magnified
  const translateY = panX.interpolate({
    inputRange: [targetX - tabWidth, targetX, targetX + tabWidth],
    outputRange: [0, -3, 0],
    extrapolate: 'clamp'
  });

  return (
    <Animated.View style={{ transform: [{ scale }, { translateY }] }}>
      <Ionicons name={name} size={24} color={isFocused ? activeColor : inactiveColor} />
    </Animated.View>
  );
};

export default function TabLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="food" />
      <Tabs.Screen name="calorie" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 16,
    left: 16,
    right: 16,
    height: 64,
    zIndex: 999,
    elevation: 10,
  },
  blurContainer: {
    flex: 1,
    borderRadius: 32,
    overflow: 'hidden',
    borderWidth: 1,
  },
  tabItemsContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activePill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pillInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
  }
});
