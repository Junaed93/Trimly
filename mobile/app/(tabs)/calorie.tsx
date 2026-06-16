import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, KeyboardAvoidingView, Pressable, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Icons from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInUp, useAnimatedStyle, withTiming, useSharedValue, useEffect as useReanimatedEffect } from 'react-native-reanimated';
import GlassBackground from '../../components/GlassBackground';
import AppCard from '../../components/AppCard';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../context/ThemeContext';
import Button from '../../components/Button';
import { getWeightLogs, getProfile, logWeight } from '../../services/api';
import { getUserStats } from '../../services/userStatsStorage';

const { width: screenWidth } = Dimensions.get('window');

// Custom Animated Bar Component
function AnimatedBar({ value, maxValue, color, label }: { value: number, maxValue: number, color: string, label: string }) {
  const { theme } = useTheme();
  const heightAnim = useSharedValue(0);

  React.useEffect(() => {
    const targetHeight = maxValue > 0 ? (value / maxValue) * 150 : 0;
    heightAnim.value = withTiming(targetHeight, { duration: 1000 });
  }, [value, maxValue]);

  const style = useAnimatedStyle(() => {
    return {
      height: heightAnim.value,
    };
  });

  return (
    <View style={styles.barContainer}>
      <Text style={[styles.barValueText, { color: theme.textMuted }]}>{value.toFixed(1)}</Text>
      <View style={[styles.barTrack, { backgroundColor: theme.surfaceRaised }]}>
        <Animated.View style={[styles.barFill, style, { backgroundColor: color }]} />
      </View>
      <Text style={[styles.barLabelText, { color: theme.textMuted }]}>{label}</Text>
    </View>
  );
}

export default function CalorieScreen() {
  const { theme } = useTheme();

  const [logs, setLogs] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>({ initialWeight: null, targetWeight: null });
  const [activeTab, setActiveTab] = useState<'Week' | 'Month'>('Week');
  
  const [isLogModalVisible, setLogModalVisible] = useState(false);
  const [weightInput, setWeightInput] = useState('');
  const [isLogging, setIsLogging] = useState(false);

  const handleLogWeight = async () => {
    if (!weightInput) return;
    setIsLogging(true);
    try {
      await logWeight({ weight_kg: parseFloat(weightInput), date: new Date().toISOString().split('T')[0] });
      setLogModalVisible(false);
      setWeightInput('');
      fetchData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsLogging(false);
    }
  };

  const fetchData = async () => {
    try {
      const [logsRes, profileRes, statsRes] = await Promise.all([
        getWeightLogs(),
        getProfile(),
        getUserStats()
      ]);
      setLogs(logsRes.data);
      setProfile(profileRes.data);
      setUserStats(statsRes);
    } catch (error) {
      console.log('Failed to fetch weight data', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
    }, [])
  );

  // Derived Stats
  let initialWeight = userStats?.initialWeight || 0;
  let currentWeight = 0;
  let targetWeight = userStats?.targetWeight || 0;

  if (logs.length > 0) {
    currentWeight = Number(logs[0].weight_kg) || 0;
    if (!initialWeight) initialWeight = Number(logs[logs.length - 1].weight_kg) || 0;
    if (!targetWeight) {
      if (profile?.height_cm) {
        targetWeight = (profile.height_cm / 100) ** 2 * 22; 
      } else {
        targetWeight = initialWeight > 60 ? initialWeight - 10 : initialWeight;
      }
    }
  }

  const weightLoss = initialWeight - currentWeight;
  const isGoalReached = currentWeight > 0 && currentWeight <= targetWeight;
  const totalToLose = initialWeight - targetWeight;
  const progressPercent = totalToLose > 0 && weightLoss > 0 ? (weightLoss / totalToLose) * 100 : 0;

  // Chart Data preparation (Mocked slightly for layout if < 7 logs)
  const chartData = useMemo(() => {
    // Reverse logs to chronologically ascending
    const chronologicalLogs = [...logs].reverse();
    const count = activeTab === 'Week' ? 7 : 30;
    const dataSlice = chronologicalLogs.slice(-count);
    
    // Fill gaps if needed
    const result = [];
    for (let i = 0; i < count; i++) {
      if (i < dataSlice.length) {
        const d = new Date(dataSlice[i].recorded_at);
        result.push({
          value: Number(dataSlice[i].weight_kg),
          label: activeTab === 'Week' ? d.toLocaleDateString('en-US', { weekday: 'short' }) : d.getDate().toString()
        });
      } else if (result.length > 0) {
        // Carry forward previous weight if no log
        result.push({
          value: result[result.length - 1].value,
          label: '-'
        });
      } else {
         result.push({ value: 0, label: '-' });
      }
    }
    return result;
  }, [logs, activeTab]);

  const maxChartValue = Math.max(...chartData.map(d => d.value)) + 5;

  return (
    <GlassBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp}>
          <Text style={[styles.title, { color: theme.text }]}>Weight Tracker</Text>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(100)} style={{ marginTop: 24 }}>
          {/* Main Progress Hero */}
          <AppCard variant="elevated" style={styles.heroCard}>
            <View style={styles.heroHeader}>
              <View>
                <Text style={[styles.heroLabel, { color: theme.textMuted }]}>Current Weight</Text>
                <Text style={[styles.heroValue, { color: theme.text }]}>{currentWeight > 0 ? currentWeight.toFixed(1) : '-'} <Text style={{ fontSize: 16 }}>kg</Text></Text>
              </View>
              <TouchableOpacity 
                onPress={() => setLogModalVisible(true)} 
                style={[styles.badge, { backgroundColor: theme.primary, paddingHorizontal: 16, paddingVertical: 12 }]}
              >
                <Icons.Plus size={18} color="#fff" />
                <Text style={[styles.badgeText, { color: '#fff', marginLeft: 6 }]}>Log Weight</Text>
              </TouchableOpacity>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: theme.surface, borderRadius: 16 }}>
              <View style={[styles.badge, { backgroundColor: weightLoss >= 0 ? theme.successSurface : theme.errorSurface, marginRight: 12 }]}>
                <Ionicons name={weightLoss >= 0 ? "arrow-down" : "arrow-up"} size={16} color={weightLoss >= 0 ? theme.success : theme.error} />
                <Text style={[styles.badgeText, { color: weightLoss >= 0 ? theme.success : theme.error }]}>
                  {Math.abs(weightLoss).toFixed(1)} kg
                </Text>
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: theme.textSecondary }}>
                {weightLoss >= 0 ? 'Lost since start' : 'Gained since start'}
              </Text>
            </View>

            <View style={styles.goalProgressContainer}>
              <View style={styles.goalRow}>
                <Text style={{ color: theme.textSecondary, fontSize: 12, fontWeight: '700' }}>Initial: {initialWeight.toFixed(1)} kg</Text>
                <Text style={{ color: theme.primary, fontSize: 12, fontWeight: '700' }}>Goal: {targetWeight.toFixed(1)} kg</Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: theme.surfaceRaised }]}>
                <View style={[styles.progressBarFill, { backgroundColor: theme.primary, width: `${Math.min(100, Math.max(0, progressPercent))}%` }]} />
              </View>
              <Text style={{ color: theme.text, fontSize: 16, textAlign: 'center', marginTop: 12, fontWeight: '800' }}>
                {isGoalReached ? 'Goal Reached! 🎉' : `${progressPercent.toFixed(1)}% to goal`}
              </Text>
              {!isGoalReached && (
                <Text style={{ color: theme.textMuted, fontSize: 13, textAlign: 'center', marginTop: 4, fontWeight: '600' }}>
                  ({Math.abs(weightLoss).toFixed(1)} kg / {Math.abs(totalToLose).toFixed(1)} kg)
                </Text>
              )}
            </View>
          </AppCard>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200)} style={{ marginTop: 24 }}>
          <SectionHeader title="Trends" />
          <AppCard variant="glass" style={styles.chartCard}>
            <View style={[styles.tabSelector, { backgroundColor: theme.surface }]}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'Week' && { backgroundColor: theme.primary }]}
                onPress={() => setActiveTab('Week')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'Week' ? '#fff' : theme.textSecondary }]}>Week</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'Month' && { backgroundColor: theme.primary }]}
                onPress={() => setActiveTab('Month')}
              >
                <Text style={[styles.tabText, { color: activeTab === 'Month' ? '#fff' : theme.textSecondary }]}>Month</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.chartArea}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}>
                {chartData.map((d, i) => (
                  <AnimatedBar 
                    key={i} 
                    value={d.value} 
                    maxValue={maxChartValue} 
                    color={theme.primary} 
                    label={d.label} 
                  />
                ))}
              </ScrollView>
            </View>
          </AppCard>
        </Animated.View>

        {logs.length > 0 && (
          <Animated.View entering={FadeInUp.delay(300)} style={{ marginTop: 24 }}>
            <SectionHeader title="History" />
            <AppCard variant="glass" style={{ padding: 0 }}>
              {logs.slice(0, 5).map((log, i) => (
                <View key={log.id} style={[styles.historyRow, { borderBottomColor: theme.border, borderBottomWidth: i === 4 ? 0 : StyleSheet.hairlineWidth }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.historyIcon, { backgroundColor: theme.surfaceRaised }]}>
                      <Icons.Scale size={16} color={theme.textMuted} />
                    </View>
                    <View>
                      <Text style={[styles.historyDate, { color: theme.text }]}>{new Date(log.recorded_at).toLocaleDateString()}</Text>
                      <Text style={[styles.historyTime, { color: theme.textMuted }]}>{new Date(log.recorded_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</Text>
                    </View>
                  </View>
                  <Text style={[styles.historyValue, { color: theme.text }]}>{log.weight_kg} kg</Text>
                </View>
              ))}
            </AppCard>
          </Animated.View>
        )}
        {/* Log Weight Modal */}
        <Modal visible={isLogModalVisible} transparent animationType="fade">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setLogModalVisible(false); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay} pointerEvents="box-none">
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
              <Text style={[styles.modalTitle, { color: theme.text }]}>Log Today's Weight</Text>
              
              <View style={styles.qtyContainer}>
                <TextInput
                  style={[styles.qtyInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                  keyboardType="numeric"
                  value={weightInput}
                  onChangeText={setWeightInput}
                  autoFocus
                  placeholder="e.g. 70"
                  placeholderTextColor={theme.textMuted}
                />
                <Text style={[styles.qtyUnit, { color: theme.textMuted }]}>kg</Text>
              </View>

              <Button title="Save Weight" onPress={handleLogWeight} loading={isLogging} />
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>

      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  heroCard: {
    padding: 24,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  heroLabel: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  heroValue: {
    fontSize: 40,
    fontWeight: '800',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 4,
  },
  goalProgressContainer: {
    marginTop: 8,
  },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressBarBg: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  chartCard: {
    padding: 16,
  },
  tabSelector: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  chartArea: {
    height: 200,
    justifyContent: 'flex-end',
  },
  chartScroll: {
    alignItems: 'flex-end',
    paddingBottom: 24,
    paddingHorizontal: 8,
  },
  barContainer: {
    alignItems: 'center',
    width: 40,
    marginRight: 12,
    justifyContent: 'flex-end',
  },
  barTrack: {
    width: 16,
    height: 150,
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginVertical: 8,
  },
  barFill: {
    width: '100%',
    borderRadius: 8,
  },
  barValueText: {
    fontSize: 10,
    fontWeight: '700',
  },
  barLabelText: {
    fontSize: 10,
    fontWeight: '600',
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '700',
  },
  historyTime: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  historyValue: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  qtyInput: {
    fontSize: 36,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 120,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  qtyUnit: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 12,
  },
});
