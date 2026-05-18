import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, ActivityIndicator, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import GlassBackground from '../../components/GlassBackground';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import { logWeight, getWeightLogs, getProfile } from '../../services/api';
import { getDailyCalories, getTodayString } from '../../services/foodStorage';

export default function HomeScreen() {
  const { theme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobileLayout = width < 768;

  const [weightInput, setWeightInput] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [consumedCalories, setConsumedCalories] = useState(0);

  const fetchDashboardData = async () => {
    try {
      const [logsRes, profileRes] = await Promise.all([
        getWeightLogs(),
        getProfile()
      ]);
      setLogs(logsRes.data);
      setProfile(profileRes.data);
    } catch (error) {
      console.log('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadCalories = async () => {
    const cals = await getDailyCalories(getTodayString());
    setConsumedCalories(cals);
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
      loadCalories();
    }, [])
  );

  const handleLogWeight = async () => {
    if (!weightInput || isNaN(Number(weightInput))) {
      Alert.alert('Error', 'Please enter a valid weight');
      return;
    }
    setSubmitting(true);
    try {
      const today = getTodayString();
      await logWeight({ weight_kg: Number(weightInput), date: today });
      setWeightInput('');
      fetchDashboardData();
    } catch (error) {
      Alert.alert('Error', 'Failed to log weight');
    } finally {
      setSubmitting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate Weight Stats
  let initialWeight = 0;
  let currentWeight = 0;
  let weightLoss = 0;
  let weightLossPercentage = 0;
  let remainingGoal = 0; 
  let targetWeight = 0;

  if (logs.length > 0) {
    currentWeight = Number(logs[0].weight_kg) || 0;
    initialWeight = Number(logs[logs.length - 1].weight_kg) || 0;
    weightLoss = initialWeight - currentWeight;
    weightLossPercentage = initialWeight > 0 ? (weightLoss / initialWeight) * 100 : 0;
    
    // Fallback target calculation: 22 BMI based target or 10kg less than initial
    if (profile?.height_cm) {
      targetWeight = (profile.height_cm / 100) ** 2 * 22; // Healthy BMI target
    } else {
      targetWeight = initialWeight > 60 ? initialWeight - 10 : initialWeight;
    }
    
    remainingGoal = currentWeight - targetWeight;
    if (remainingGoal < 0 && profile?.goal !== 'gain') remainingGoal = 0; // If they reached goal
  }

  // Calculate Calorie Stats
  const totalCaloriesAllowed = profile?.daily_calorie_target || 2000;
  const caloriesRemaining = totalCaloriesAllowed - consumedCalories;

  return (
    <GlassBackground>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={{ marginBottom: 24 }}>
          <Text style={[styles.greeting, { color: theme.textMuted }]}>{getGreeting()},</Text>
          <Text style={[styles.title, { color: theme.text }]}>{profile?.name || 'User'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.accent} style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Top Layout: Left/Right Split */}
            <View style={{ flexDirection: isMobileLayout ? 'column' : 'row', gap: 16 }}>
              
              {/* Left Column: Weight Logger */}
              <View style={{ flex: 1 }}>
                <View style={[styles.glassCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconBox, { backgroundColor: theme.accentSurface }]}>
                      <Ionicons name="scale-outline" size={24} color={theme.accentLight} />
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Log Weight</Text>
                  </View>
                  
                  <View style={{ marginTop: 8 }}>
                    <Input
                      label="Today's Weight (kg)"
                      value={weightInput}
                      onChangeText={setWeightInput}
                      keyboardType="numeric"
                      icon="speedometer-outline"
                    />
                    <View style={{ marginTop: 12 }}>
                      <Button title="Save Entry" onPress={handleLogWeight} loading={submitting} />
                    </View>
                  </View>

                  {logs.length > 0 && (
                     <View style={{ marginTop: 24 }}>
                       <Text style={[styles.historyTitle, { color: theme.textSecondary }]}>Recent Logs</Text>
                       {logs.slice(0, 3).map((log, i) => (
                          <View key={log.id} style={[styles.historyRow, { borderBottomColor: theme.border, borderBottomWidth: i === logs.slice(0,3).length - 1 ? 0 : 1 }]}>
                             <Text style={{ color: theme.text }}>{new Date(log.recorded_at).toLocaleDateString()}</Text>
                             <Text style={{ color: theme.accentLight, fontWeight: 'bold' }}>{log.weight_kg} kg</Text>
                          </View>
                       ))}
                     </View>
                  )}
                </View>
              </View>

              {/* Right Column: Weight Stats */}
              <View style={{ flex: 1 }}>
                <View style={[styles.glassCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
                  <Text style={[styles.cardTitle, { color: theme.text, marginBottom: 16 }]}>Weight Stats</Text>
                  
                  <View style={styles.statGrid}>
                    <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Initial</Text>
                      <Text style={[styles.statValue, { color: theme.text }]}>{initialWeight > 0 ? `${initialWeight.toFixed(1)} kg` : '-'}</Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Current</Text>
                      <Text style={[styles.statValue, { color: theme.accentLight }]}>{currentWeight > 0 ? `${currentWeight.toFixed(1)} kg` : '-'}</Text>
                    </View>
                  </View>

                  <View style={styles.statGrid}>
                    <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>Progress</Text>
                      <Text style={[styles.statValue, { color: weightLoss >= 0 ? theme.success : theme.error }]}>
                        {weightLossPercentage > 0 ? `-${weightLossPercentage.toFixed(1)}%` : `+${Math.abs(weightLossPercentage).toFixed(1)}%`}
                      </Text>
                    </View>
                    <View style={[styles.statBox, { borderColor: theme.border, backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Text style={[styles.statLabel, { color: theme.textMuted }]}>To Goal</Text>
                      <Text style={[styles.statValue, { color: theme.warning }]}>{remainingGoal > 0 ? `${remainingGoal.toFixed(1)} kg` : 'Done!'}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Bottom Section: Calorie Intake */}
            <View style={[styles.glassCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)', marginTop: 16 }]}>
              <View style={styles.cardHeader}>
                <View style={[styles.iconBox, { backgroundColor: theme.accentSurface }]}>
                  <Ionicons name="restaurant-outline" size={24} color={theme.accentLight} />
                </View>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Today's Calories</Text>
              </View>
              
              <View style={styles.calorieRow}>
                <View style={styles.calorieCol}>
                   <Text style={[styles.calorieValue, { color: theme.text }]}>{totalCaloriesAllowed}</Text>
                   <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>Goal</Text>
                </View>
                <View style={styles.calorieOperator}>
                   <Text style={{ color: theme.textMuted, fontSize: 24 }}>-</Text>
                </View>
                <View style={styles.calorieCol}>
                   <Text style={[styles.calorieValue, { color: theme.error }]}>{consumedCalories}</Text>
                   <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>Food (Eaten)</Text>
                </View>
                <View style={styles.calorieOperator}>
                   <Text style={{ color: theme.textMuted, fontSize: 24 }}>=</Text>
                </View>
                <View style={styles.calorieCol}>
                   <Text style={[styles.calorieValue, { color: theme.success }]}>{Math.max(0, caloriesRemaining)}</Text>
                   <Text style={[styles.calorieLabel, { color: theme.textMuted }]}>Remaining</Text>
                </View>
              </View>
            </View>

          </>
        )}
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingBottom: 100,
  },
  greeting: {
    fontSize: 16,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 4,
  },
  glassCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  historyTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  statGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statBox: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 8,
  },
  calorieCol: {
    alignItems: 'center',
  },
  calorieValue: {
    fontSize: 28,
    fontWeight: '800',
  },
  calorieLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  calorieOperator: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 16,
  }
});
