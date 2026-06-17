import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, LayoutChangeEvent, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTheme } from '../context/ThemeContext';
import * as Icons from 'lucide-react-native';
import { LiquidView } from 'liquidglass-rn';

export interface TabRoute {
  key: string;
  title: string;
  icon: string;
}

export interface DraggableTabBarProps {
  routes: TabRoute[];
  activeIndex: number;
  onChange: (index: number) => void;
  activeColor?: string;
  inactiveColor?: string;
}

// True Native iOS Spring Physics
const SPRING_CONFIG = { damping: 20, stiffness: 180, mass: 0.8, overshootClamping: false };
const LENS_SPRING = { damping: 16, stiffness: 220, mass: 0.6 };

export const DraggableTabBar: React.FC<DraggableTabBarProps> = ({
  routes,
  activeIndex,
  onChange,
  activeColor,
  inactiveColor,
}) => {
  const { theme, isDark } = useTheme();
  
  const [tabLayouts, setTabLayouts] = useState<Array<{ x: number; width: number }>>([]);
  const [barDimensions, setBarDimensions] = useState({ width: 0, height: 0 });

  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const isDragging = useSharedValue(false);
  const dragVelocity = useSharedValue(0);
  
  const tabScales = routes.map(() => useSharedValue(1));
  const tabY = routes.map(() => useSharedValue(0));

  useEffect(() => {
    if (!isDragging.value && tabLayouts.length === routes.length && tabLayouts[activeIndex]) {
      translateX.value = withSpring(tabLayouts[activeIndex].x, SPRING_CONFIG);
      dragVelocity.value = withTiming(0, { duration: 300 });
    }
  }, [activeIndex, tabLayouts, routes.length]);

  const handleBarLayout = (e: LayoutChangeEvent) => {
    setBarDimensions({
      width: e.nativeEvent.layout.width,
      height: e.nativeEvent.layout.height,
    });
  };

  const handleTabLayout = (index: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    setTabLayouts((prev) => {
      const updated = [...prev];
      updated[index] = { x, width };
      return updated;
    });
  };

  const activeWidth = tabLayouts[activeIndex]?.width || 0;

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isDragging.value = true;
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      const minX = tabLayouts[0]?.x || 0;
      const maxX = tabLayouts[tabLayouts.length - 1]?.x || 0;
      const proposedX = contextX.value + event.translationX;
      translateX.value = Math.max(minX, Math.min(proposedX, maxX));
      dragVelocity.value = event.velocityX;
    })
    .onEnd((event) => {
      isDragging.value = false;
      const finalX = translateX.value + event.velocityX * 0.05;
      
      let closestIndex = activeIndex;
      let minDistance = Infinity;
      
      for (let i = 0; i < tabLayouts.length; i++) {
        const layout = tabLayouts[i];
        if (layout) {
          const dist = Math.abs(finalX - layout.x);
          if (dist < minDistance) {
            minDistance = dist;
            closestIndex = i;
          }
        }
      }
      
      if (closestIndex !== activeIndex) {
        runOnJS(onChange)(closestIndex);
      } else {
        translateX.value = withSpring(tabLayouts[activeIndex].x, SPRING_CONFIG);
      }
      dragVelocity.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.ease) });
    });

  const lensStyle = useAnimatedStyle(() => {
    // Optical distortion stretch
    const speed = Math.abs(dragVelocity.value);
    const stretch = isDragging.value ? Math.max(0.7, 1 - Math.abs(translateX.value - contextX.value) / 500) : 1;
    const dynamicWidth = (activeWidth || 50) * stretch;
    
    // Physics morphing
    const scaleX = 1 + Math.min(speed / 3000, 0.2);
    const scaleY = 1 - Math.min(speed / 6000, 0.1);

    return {
      left: translateX.value,
      width: dynamicWidth,
      transform: [
        { scaleX },
        { scaleY },
      ],
    };
  });

  const activeTextColor = activeColor || (isDark ? '#fff' : '#000');
  const inactiveTextColor = inactiveColor || theme.textSecondary;

  return (
    <GestureHandlerRootView style={styles.outerContainer}>
      <GestureDetector gesture={panGesture}>
        <View style={styles.glassWrapper}>
          
          {/* LAYER 1-4: The main tab bar uses liquidglass-rn to render the advanced AGSL Refraction shader */}
          <LiquidView
            intensity={isDark ? 85 : 70}
            tint={isDark ? 'dark' : 'light'}
            borderRadius={32}
            experimentalSkia={true}
            borderGlow={false}
            style={styles.floatingBar}
            onLayout={handleBarLayout}
          >
            <View style={styles.row}>
              {/* LAYER 5: Active Tab Lens Distortion Overlay */}
              {tabLayouts.length === routes.length && (
                <Animated.View style={[styles.activeLensContainer, lensStyle]}>
                   <View style={styles.lensVolume}>
                      {/* Physical elevation shadow to project depth behind the lens */}
                      <View style={styles.lensShadow} />
                      
                      {/* The Active Tab is itself a LiquidView! This stacks the AGSL refraction shader,
                          creating a true optical magnification and lens distortion effect exactly where the active tab is! */}
                      <LiquidView 
                        intensity={isDark ? 20 : 35} 
                        tint="none" 
                        experimentalSkia={true}
                        borderGlow={false}
                        borderRadius={24}
                        style={StyleSheet.absoluteFillObject} 
                      />
                   </View>
                </Animated.View>
              )}

              {/* Interactive Tab Icons */}
              {routes.map((route, index) => {
                const isActive = index === activeIndex;
                const IconComponent = (Icons as any)[route.icon] || Icons.HelpCircle;
                
                const iconStyle = useAnimatedStyle(() => ({
                  transform: [
                    { scale: tabScales[index].value },
                    { translateY: tabY[index].value }
                  ],
                }));

                const handlePressIn = () => {
                  tabScales[index].value = withSpring(0.85, LENS_SPRING);
                  tabY[index].value = withSpring(4, LENS_SPRING);
                };

                const handlePressOut = () => {
                  tabScales[index].value = withSpring(1, LENS_SPRING);
                  tabY[index].value = withSpring(0, LENS_SPRING);
                };

                return (
                  <Pressable
                    key={route.key}
                    onLayout={(e) => handleTabLayout(index, e)}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                    onPress={() => onChange(index)}
                    style={styles.tabItem}
                  >
                    <Animated.View style={[styles.center, iconStyle]}>
                      {/* Active icon magnification inside the lens */}
                      <Animated.View style={{ transform: [{ scale: isActive ? 1.12 : 1 }] }}>
                        <IconComponent
                          size={isActive ? 22 : 20}
                          color={isActive ? activeTextColor : inactiveTextColor}
                          strokeWidth={isActive ? 2.5 : 2.0}
                          // Add subtle drop shadow to the icon for depth inside the glass
                          style={isActive ? { shadowColor: activeTextColor, shadowOpacity: 0.4, shadowRadius: 6, shadowOffset: { width: 0, height: 2 } } : {}}
                        />
                      </Animated.View>
                      <Text
                        style={[
                          styles.tabLabel,
                          { color: isActive ? activeTextColor : inactiveTextColor },
                          isActive && styles.activeLabel,
                        ]}
                      >
                        {route.title}
                      </Text>
                    </Animated.View>
                  </Pressable>
                );
              })}
            </View>
          </LiquidView>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Platform.OS === 'ios' ? 20 : 12,
    backgroundColor: 'transparent',
    paddingBottom: Platform.OS === 'ios' ? 8 : 0, 
  },
  glassWrapper: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 24,
  },
  floatingBar: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    borderRadius: 32,
  },
  row: {
    flexDirection: 'row',
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 24,
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '600',
    marginTop: 5,
    letterSpacing: 0.4,
  },
  activeLabel: {
    fontWeight: '800',
  },
  activeLensContainer: {
    position: 'absolute',
    height: '95%',
    top: '2.5%',
    zIndex: 1,
  },
  lensVolume: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 24,
    transform: [{ scale: 1.02 }],
  },
  lensShadow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  }
});
