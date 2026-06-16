import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, LayoutChangeEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { LiquidView } from 'liquidglass-rn';
import { useTheme } from '../context/ThemeContext';
import * as Icons from 'lucide-react-native';

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

const APPLE_SPRING = { damping: 18, stiffness: 140, mass: 0.9 };

export const DraggableTabBar: React.FC<DraggableTabBarProps> = ({
  routes,
  activeIndex,
  onChange,
  activeColor,
  inactiveColor,
}) => {
  const { theme, isDark } = useTheme();
  
  const [tabLayouts, setTabLayouts] = useState<Array<{ x: number; width: number }>>([]);
  const [barWidth, setBarWidth] = useState(0);

  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);
  const isDragging = useSharedValue(false);

  useEffect(() => {
    if (!isDragging.value && tabLayouts.length === routes.length && tabLayouts[activeIndex]) {
      translateX.value = withSpring(tabLayouts[activeIndex].x, APPLE_SPRING);
    }
  }, [activeIndex, tabLayouts, routes.length]);

  const handleBarLayout = (e: LayoutChangeEvent) => {
    setBarWidth(e.nativeEvent.layout.width);
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
    })
    .onEnd((event) => {
      isDragging.value = false;
      const finalX = translateX.value + event.velocityX * 0.1;
      
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
        translateX.value = withSpring(tabLayouts[activeIndex].x, APPLE_SPRING);
      }
    });

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      left: translateX.value,
      width: activeWidth || 50,
    };
  });

  const activeTextColor = activeColor || theme.accent;
  const inactiveTextColor = inactiveColor || theme.textMuted;

  return (
    <GestureHandlerRootView style={styles.outerContainer}>
      <GestureDetector gesture={panGesture}>
        <LiquidView
          intensity={60}
          borderRadius={30}
          experimentalSkia={true}
          borderGlow={false}
          style={styles.floatingBar}
          onLayout={handleBarLayout}
        >
          <View style={styles.row}>
            {tabLayouts.length === routes.length && (
              <Animated.View
                style={[
                  styles.liquidBlob,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)' },
                  indicatorStyle,
                ]}
              />
            )}

            {routes.map((route, index) => {
              const isActive = index === activeIndex;
              const IconComponent = (Icons as any)[route.icon] || Icons.HelpCircle;
              
              return (
                <Pressable
                  key={route.key}
                  onLayout={(e) => handleTabLayout(index, e)}
                  onPress={() => onChange(index)}
                  style={styles.tabItem}
                >
                  <View style={styles.center}>
                    <IconComponent
                      size={22}
                      color={isActive ? activeTextColor : inactiveTextColor}
                      strokeWidth={isActive ? 2.5 : 2.0}
                    />
                    <Text
                      style={[
                        styles.tabLabel,
                        { color: isActive ? activeTextColor : inactiveTextColor },
                        isActive && styles.activeLabel,
                      ]}
                    >
                      {route.title}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </LiquidView>
      </GestureDetector>
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    backgroundColor: 'transparent',
  },
  floatingBar: {
    paddingVertical: 10,
    paddingHorizontal: 8,
    width: '100%',
    maxWidth: 450,
  },
  row: {
    flexDirection: 'row',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 4,
  },
  activeLabel: {
    fontWeight: '700',
  },
  liquidBlob: {
    position: 'absolute',
    height: '92%',
    top: '4%',
    borderRadius: 22,
    zIndex: 1,
  },
});
