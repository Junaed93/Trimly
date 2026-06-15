import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal, Platform, KeyboardAvoidingView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Icons from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInUp, FadeIn, SlideInDown } from 'react-native-reanimated';
import GlassBackground from '../../components/GlassBackground';
import AppCard from '../../components/AppCard';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../context/ThemeContext';
import exerciseData from '../../assets/data/exercise.json';
import { getProfile } from '../../services/api';
import { getDailyExerciseLogs, logExerciseItem, ExerciseLog } from '../../services/exerciseStorage';

export default function ExerciseScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [profile, setProfile] = useState<any>(null);
  
  const [todayLogs, setTodayLogs] = useState<ExerciseLog[]>([]);
  const [totalCaloriesBurned, setTotalCaloriesBurned] = useState(0);

  // Modal State
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [durationInput, setDurationInput] = useState('30');

  const categories = ['All', ...new Set(exerciseData.map(item => item.category))];

  const fetchData = async () => {
    try {
      const profileRes = await getProfile();
      setProfile(profileRes.data);
    } catch (e) {
      console.log('Failed to fetch profile', e);
    }
  };

  const loadLogs = async () => {
    const { logs, total_calories_burned } = await getDailyExerciseLogs();
    setTodayLogs(logs);
    setTotalCaloriesBurned(total_calories_burned);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadLogs();
    }, [])
  );

  const calculateCalories = (met: number, durationStr: string) => {
    const duration = parseInt(durationStr, 10);
    if (isNaN(duration) || duration <= 0) return 0;
    const weightKg = profile?.weight_kg || 70;
    return Math.round((met * 3.5 * weightKg / 200) * duration);
  };

  const confirmLogExercise = async () => {
    if (!selectedExercise) return;
    
    const duration = parseInt(durationInput, 10);
    if (isNaN(duration) || duration <= 0) return;

    const caloriesBurned = calculateCalories(selectedExercise.met, durationInput);

    try {
      await logExerciseItem({
        exercise_id: selectedExercise.id,
        exercise_name: selectedExercise.exercise_name_en,
        met: selectedExercise.met,
        duration_minutes: duration,
        calories_burned: caloriesBurned,
      });
      loadLogs();
      setSelectedExercise(null);
      setDurationInput('30');
    } catch (e) {
      console.log('Failed to log exercise', e);
    }
  };

  const filteredExercises = useMemo(() => {
    return exerciseData.filter((item) => {
      const matchesSearch = item.exercise_name_en.toLowerCase().includes(searchQuery.toLowerCase()) || item.exercise_name_bn.includes(searchQuery);
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const renderDatasetItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
      <TouchableOpacity 
        style={[styles.exerciseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => setSelectedExercise(item)}
      >
        <View style={[styles.exerciseImagePlaceholder, { backgroundColor: theme.border }]}>
          <Icons.Dumbbell size={24} color={theme.textMuted} />
        </View>
        <View style={styles.exerciseCardContent}>
          <Text style={[styles.exerciseNameEn, { color: theme.text }]} numberOfLines={1}>{item.exercise_name_en}</Text>
          <Text style={[styles.exerciseNameBn, { color: theme.textSecondary }]} numberOfLines={1}>{item.exercise_name_bn}</Text>
          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: theme.primarySurface }]}>
              <Text style={[styles.badgeText, { color: theme.primary }]}>{item.category}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: theme.secondary + '20' }]}>
              <Icons.Flame size={12} color={theme.secondary} style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, { color: theme.secondary }]}>MET: {item.met}</Text>
            </View>
          </View>
        </View>
        <View style={[styles.addBtn, { backgroundColor: theme.primarySurface }]}>
          <Ionicons name="add" size={20} color={theme.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <GlassBackground>
      <View style={styles.container}>
        <Animated.View entering={FadeInUp}>
          <Text style={[styles.title, { color: theme.text }]}>Workout</Text>
        </Animated.View>

        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDatasetItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Animated.View entering={FadeInUp.delay(100)}>
              {/* Daily Summary */}
              <AppCard variant="elevated" style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Today's Burn</Text>
                    <Text style={[styles.summaryValue, { color: theme.primary }]}>{totalCaloriesBurned} <Text style={{ fontSize: 16 }}>kcal</Text></Text>
                  </View>
                  <View style={[styles.iconCircle, { backgroundColor: theme.primarySurface }]}>
                    <Icons.Flame size={32} color={theme.primary} />
                  </View>
                </View>

                {todayLogs.length > 0 && (
                  <View style={[styles.logsContainer, { borderTopColor: theme.border }]}>
                    {todayLogs.map((log) => (
                      <View key={log.id} style={[styles.logItem, { borderBottomColor: theme.border }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{log.exercise_name}</Text>
                          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{log.duration_minutes} min</Text>
                        </View>
                        <Text style={{ color: theme.secondary, fontSize: 16, fontWeight: '700' }}>{log.calories_burned} kcal</Text>
                      </View>
                    ))}
                  </View>
                )}
              </AppCard>

              <SectionHeader title="Find Activity" />
              
              <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Icons.Search size={20} color={theme.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search workouts..."
                  placeholderTextColor={theme.textPlaceholder}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
              </View>

              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={categories}
                keyExtractor={(item) => item}
                style={{ marginBottom: 16 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: activeCategory === item ? theme.primary : theme.surface,
                        borderColor: activeCategory === item ? theme.primary : theme.border,
                      }
                    ]}
                    onPress={() => setActiveCategory(item)}
                  >
                    <Text style={{ color: activeCategory === item ? '#fff' : theme.text, fontWeight: '600' }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </Animated.View>
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>No exercises found.</Text>
          }
        />
      </View>

      {/* DETAIL & ADD MODAL */}
      {selectedExercise && (
        <Modal transparent visible animationType="fade">
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
            <Animated.View entering={SlideInDown.springify()} style={[styles.modalContent, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>{selectedExercise.exercise_name_en}</Text>
                <TouchableOpacity onPress={() => setSelectedExercise(null)} style={styles.closeBtn}>
                  <Icons.X size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>
              
              {/* Duration Stepper */}
              <Text style={[styles.durationLabel, { color: theme.textMuted }]}>Duration (minutes)</Text>
              <View style={styles.qtyContainer}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setDurationInput(String(Math.max(1, parseInt(durationInput || '30') - 5)))}
                >
                  <Icons.Minus size={24} color={theme.text} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.qtyInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                  keyboardType="numeric"
                  value={durationInput}
                  onChangeText={setDurationInput}
                  autoFocus
                  selectTextOnFocus
                />
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setDurationInput(String(parseInt(durationInput || '30') + 5))}
                >
                  <Icons.Plus size={24} color={theme.text} />
                </TouchableOpacity>
              </View>

              <View style={[styles.livePreviewBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Estimated Burn</Text>
                  <Text style={{ fontSize: 36, fontWeight: '800', marginTop: 4, color: theme.primary }}>
                    {calculateCalories(selectedExercise.met, durationInput)} <Text style={{fontSize: 16}}>kcal</Text>
                  </Text>
                </View>
                <Icons.Activity size={48} color={theme.primarySurface} />
              </View>
              
              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.primary }]} onPress={confirmLogExercise}>
                <Text style={styles.confirmBtnText}>Save Workout</Text>
                <Icons.Check size={20} color="#fff" style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>
      )}

    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  listContainer: {
    paddingBottom: 100,
  },
  exerciseCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  exerciseImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  exerciseCardContent: {
    flex: 1,
  },
  exerciseNameEn: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  exerciseNameBn: {
    fontSize: 12,
    marginBottom: 6,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  summaryCard: {
    marginBottom: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 36,
    fontWeight: '800',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logsContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    paddingTop: 8,
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    flex: 1,
    paddingRight: 16,
  },
  closeBtn: {
    padding: 4,
  },
  durationLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    textAlign: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  qtyBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyInput: {
    flex: 1,
    height: 50,
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '800',
  },
  livePreviewBox: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  confirmBtn: {
    flexDirection: 'row',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
});
