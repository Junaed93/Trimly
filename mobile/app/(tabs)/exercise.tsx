import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import GlassBackground from '../../components/GlassBackground';
import AppHeader from './_AppHeader';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import * as Icons from 'lucide-react-native';
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
    // Formula: (MET × 3.5 × UserWeightKg ÷ 200) × DurationMinutes
    return Math.round((met * 3.5 * weightKg / 200) * duration);
  };

  const confirmLogExercise = async () => {
    if (!selectedExercise) return;
    
    const duration = parseInt(durationInput, 10);
    if (isNaN(duration) || duration <= 0) {
      Alert.alert('Error', 'Please enter a valid duration in minutes.');
      return;
    }

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
      Alert.alert('Error', 'Failed to log exercise');
    }
  };

  const filteredExercises = exerciseData.filter(
    (item) => {
      const matchesSearch = item.exercise_name_en.toLowerCase().includes(searchQuery.toLowerCase()) || item.exercise_name_bn.includes(searchQuery);
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      return matchesSearch && matchesCategory;
    }
  );

  const renderDatasetItem = ({ item }: { item: any }) => (
    <View style={[styles.exerciseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.exerciseNameEn, { color: theme.text }]}>{item.exercise_name_en}</Text>
          <Text style={[styles.exerciseNameBn, { color: theme.textSecondary }]}>{item.exercise_name_bn}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.addBtn, { backgroundColor: theme.accentSurface }]} 
          onPress={() => setSelectedExercise(item)}
        >
          <Ionicons name="add" size={20} color={theme.accentLight} />
        </TouchableOpacity>
      </View>
      <View style={styles.detailsContainer}>
        <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '20', marginRight: 8 }]}>
          <Text style={[styles.categoryText, { color: theme.primary }]}>{item.category}</Text>
        </View>
        <View style={styles.metContainer}>
          <Icons.Flame size={14} color={theme.accentLight} style={{ marginRight: 4 }} />
          <Text style={[styles.metText, { color: theme.text }]}>MET: {item.met}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <GlassBackground>
      <AppHeader />
      <View style={styles.container}>
        
        <View style={{ marginBottom: 20 }}>
          <Text style={[styles.title, { color: theme.text }]}>Exercise</Text>
        </View>

        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderDatasetItem}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Daily Summary */}
              <View style={[styles.summaryCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: theme.border }]}>
                <View style={styles.summaryRow}>
                  <View>
                    <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Calories Burned Today</Text>
                    <Text style={[styles.summaryValue, { color: theme.accentLight }]}>{totalCaloriesBurned} <Text style={{ fontSize: 14 }}>kcal</Text></Text>
                  </View>
                  <View style={styles.progressRing}>
                    <Icons.Flame size={32} color={theme.accentLight} />
                  </View>
                </View>

                {todayLogs.length > 0 && (
                  <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)', paddingTop: 16 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: theme.textSecondary, marginBottom: 8, textTransform: 'uppercase' }}>Today's Exercises</Text>
                    {todayLogs.map((log) => (
                      <View key={log.id} style={styles.logItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: theme.text, fontSize: 16, fontWeight: '600' }}>{log.exercise_name}</Text>
                          <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{log.duration_minutes} min</Text>
                        </View>
                        <Text style={{ color: theme.accentLight, fontSize: 16, fontWeight: '700' }}>{log.calories_burned} kcal</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <Text style={[styles.sectionTitle, { color: theme.textSecondary, marginTop: 24 }]}>Browse Exercises</Text>
              <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Icons.Search size={20} color={theme.textMuted} style={styles.searchIcon} />
                <TextInput
                  style={[styles.searchInput, { color: theme.text }]}
                  placeholder="Search exercises..."
                  placeholderTextColor={theme.textMuted}
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
                        backgroundColor: activeCategory === item ? theme.accentSurface : 'rgba(255,255,255,0.05)',
                        borderColor: activeCategory === item ? theme.accentBorder : theme.border,
                      }
                    ]}
                    onPress={() => setActiveCategory(item)}
                  >
                    <Text style={{ color: activeCategory === item ? theme.accentLight : theme.text, fontWeight: '600' }}>{item}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          }
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No exercises found.</Text>
          }
        />
      </View>

      {/* DETAIL & ADD MODAL */}
      <Modal visible={!!selectedExercise} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              {selectedExercise ? (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text, fontSize: 20 }]}>{selectedExercise.exercise_name_en}</Text>
                    <TouchableOpacity onPress={() => setSelectedExercise(null)}>
                      <Ionicons name="close" size={24} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: -4, marginBottom: 16 }}>({selectedExercise.exercise_name_bn})</Text>

                  <View style={{ marginBottom: 16 }}>
                     <Input
                        label="Duration (minutes)"
                        value={durationInput}
                        onChangeText={setDurationInput}
                        keyboardType="numeric"
                        icon="time-outline"
                     />
                  </View>
                  
                  <View style={[styles.remainingPreviewBox, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.border }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Estimated Calories Burned</Text>
                    <Text style={{ fontSize: 32, fontWeight: '800', marginTop: 4, color: theme.accentLight }}>
                      {calculateCalories(selectedExercise.met, durationInput)} <Text style={{fontSize: 16}}>kcal</Text>
                    </Text>
                  </View>
                  
                  <View style={{ marginTop: 24 }}>
                    <Button title="Save Exercise Log" onPress={confirmLogExercise} />
                  </View>
                </>
              ) : null}
           </View>
        </View>
      </Modal>

    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
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
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseNameEn: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseNameBn: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
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
  progressRing: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  remainingPreviewBox: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
});
