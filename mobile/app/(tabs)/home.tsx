import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, ActivityIndicator, TouchableOpacity, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Icons from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import GlassBackground from '../../components/GlassBackground';
import AppCard from '../../components/AppCard';
import ProgressRing from '../../components/ProgressRing';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../context/ThemeContext';
import { getWeightLogs, getProfile } from '../../services/api';
import { getDailyCalories, getTodayString, getDailyFoodLogs, FoodLog } from '../../services/foodStorage';
import { getUserStats } from '../../services/userStatsStorage';
import { getDailyExerciseLogs } from '../../services/exerciseStorage';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const router = useRouter();

  const [logs, setLogs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [burnedCalories, setBurnedCalories] = useState(0);
  const [foodLogs, setFoodLogs] = useState<FoodLog[]>([]);

  const fetchDashboardData = async () => {
    try {
      const today = getTodayString();
      const [logsRes, profileRes, cals, exerciseData, dailyFood] = await Promise.all([
        getWeightLogs(),
        getProfile(),
        getDailyCalories(today),
        getDailyExerciseLogs(),
        getDailyFoodLogs(today)
      ]);
      setLogs(logsRes.data);
      setProfile(profileRes.data);
      setConsumedCalories(cals);
      setBurnedCalories(exerciseData.total_calories_burned);
      setFoodLogs(dailyFood);
    } catch (error) {
      console.log('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Stats
  const totalCaloriesAllowed = profile?.daily_calorie_target || 2000;
  const netCalories = consumedCalories - burnedCalories;
  const caloriesRemaining = totalCaloriesAllowed - netCalories;
  
  const progressPercent = totalCaloriesAllowed > 0 ? netCalories / totalCaloriesAllowed : 0;
  let statusColor = theme.primary;
  if (progressPercent > 1) statusColor = theme.error;
  else if (progressPercent > 0.85) statusColor = theme.warning;

  const goalMap: any = {
    lose_slow: 'Lose Weight',
    lose_aggressive: 'Lose Fast',
    maintain: 'Maintain Weight',
    gain: 'Gain Muscle'
  };

  const currentGoal = profile?.goal ? goalMap[profile.goal] : 'Stay Healthy';

  // Quick Action Config
  const quickActions = [
    { id: 'meal', icon: 'pizza-outline', label: 'Log Meal', color: theme.secondary, route: '/(tabs)/food' },
    { id: 'exercise', icon: 'barbell-outline', label: 'Add Workout', color: theme.primary, route: '/(tabs)/exercise' },
    { id: 'weight', icon: 'scale-outline', label: 'Log Weight', color: theme.accent, route: '/(tabs)/calorie' } // Navigating to weight trend tab
  ];

  const meals = [
    { key: 'breakfast', label: 'Breakfast', icon: 'partly-sunny-outline' },
    { key: 'lunch', label: 'Lunch', icon: 'sunny-outline' },
    { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
    { key: 'snacks', label: 'Snacks', icon: 'nutrition-outline' },
  ];

  return (
    <GlassBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Section */}
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greeting, { color: theme.textMuted }]}>{getGreeting()},</Text>
            <Text style={[styles.title, { color: theme.text }]}>{profile?.name || 'User'}</Text>
            <Text style={[styles.subtitle, { color: theme.primary }]}>Goal: {currentGoal}</Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: 'rgba(255, 165, 0, 0.1)', borderColor: 'rgba(255, 165, 0, 0.3)' }]}>
            <Text style={{ fontSize: 20 }}>🔥</Text>
            <View style={{ marginLeft: 6 }}>
              <Text style={{ color: '#FFA500', fontWeight: '800', fontSize: 16 }}>{logs.length > 0 ? logs.length : 1}</Text>
              <Text style={{ color: theme.textMuted, fontSize: 10, fontWeight: '700', textTransform: 'uppercase' }}>Day Streak</Text>
            </View>
          </View>
        </Animated.View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.primary} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Main Hero Card */}
            <Animated.View entering={FadeInUp.delay(200).springify()}>
              <AppCard variant="elevated" style={styles.heroCard}>
                <View style={styles.heroTop}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.heroTitle, { color: theme.text }]}>Calories</Text>
                    <Text style={[styles.heroRemaining, { color: caloriesRemaining >= 0 ? theme.text : theme.error }]}>
                      {Math.abs(caloriesRemaining)} {caloriesRemaining >= 0 ? 'Remaining' : 'Over'}
                    </Text>
                  </View>
                  <View style={styles.progressWrapper}>
                    <ProgressRing progress={progressPercent} size={110} strokeWidth={10} color={statusColor} backgroundColor={theme.border}>
                      <Icons.Flame size={24} color={statusColor} />
                    </ProgressRing>
                  </View>
                </View>

                <View style={[styles.heroDivider, { backgroundColor: theme.border }]} />

                <View style={styles.heroStats}>
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatValue, { color: theme.text }]}>{totalCaloriesAllowed}</Text>
                    <Text style={[styles.heroStatLabel, { color: theme.textMuted }]}>Target</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatValue, { color: theme.primary }]}>{consumedCalories}</Text>
                    <Text style={[styles.heroStatLabel, { color: theme.textMuted }]}>Eaten</Text>
                  </View>
                  <View style={styles.heroStatItem}>
                    <Text style={[styles.heroStatValue, { color: theme.secondary }]}>{burnedCalories}</Text>
                    <Text style={[styles.heroStatLabel, { color: theme.textMuted }]}>Burned</Text>
                  </View>
                </View>
              </AppCard>
            </Animated.View>

            {/* Quick Actions */}
            <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.quickActionsContainer}>
              {quickActions.map(action => (
                <TouchableOpacity 
                  key={action.id} 
                  style={[styles.quickActionBtn, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: theme.border }]}
                  onPress={() => router.push(action.route as any)}
                >
                  <View style={[styles.quickActionIconBox, { backgroundColor: action.color + '20' }]}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={[styles.quickActionLabel, { color: theme.text }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>

            {/* Daily Overview */}
            <Animated.View entering={FadeInUp.delay(400).springify()} style={{ marginTop: 24 }}>
              <SectionHeader title="Today's Meals" />
              
              <View style={styles.mealsGrid}>
                {meals.map((meal) => {
                  const items = foodLogs.filter(log => (log.meal || 'snacks') === meal.key);
                  const mealCalories = items.reduce((sum, item) => sum + (item.calories || 0), 0);

                  return (
                    <AppCard key={meal.key} variant="glass" padding={16} style={styles.mealCard}>
                      <View style={styles.mealCardHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Ionicons name={meal.icon as any} size={18} color={theme.textMuted} style={{ marginRight: 8 }} />
                          <Text style={[styles.mealCardTitle, { color: theme.text }]}>{meal.label}</Text>
                        </View>
                        <TouchableOpacity onPress={() => router.push('/(tabs)/food')}>
                          <Ionicons name="add-circle" size={24} color={theme.primary} />
                        </TouchableOpacity>
                      </View>
                      
                      <View style={styles.mealCardContent}>
                        <Text style={[styles.mealCardCalories, { color: mealCalories > 0 ? theme.primary : theme.textMuted }]}>
                          {mealCalories} <Text style={{ fontSize: 12, fontWeight: '600' }}>kcal</Text>
                        </Text>
                        <Text style={[styles.mealCardItems, { color: theme.textSecondary }]}>
                          {items.length} {items.length === 1 ? 'item' : 'items'}
                        </Text>
                      </View>
                    </AppCard>
                  );
                })}
              </View>
            </Animated.View>
            
          </>
        )}
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  heroCard: {
    marginBottom: 24,
  },
  heroTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroRemaining: {
    fontSize: 28,
    fontWeight: '800',
  },
  progressWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroDivider: {
    height: 1,
    width: '100%',
    marginVertical: 16,
  },
  heroStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  heroStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  heroStatValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  heroStatLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  quickActionBtn: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  quickActionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  mealCard: {
    width: '48%',
    marginBottom: 12,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  mealCardTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  mealCardContent: {
    marginTop: 4,
  },
  mealCardCalories: {
    fontSize: 20,
    fontWeight: '800',
  },
  mealCardItems: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
});
