import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, FlatList, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Pressable, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Icons from 'lucide-react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { FadeInUp, FadeIn, SlideInDown, Layout } from 'react-native-reanimated';
import GlassBackground from '../../components/GlassBackground';
import AppCard from '../../components/AppCard';
import SectionHeader from '../../components/SectionHeader';
import { useTheme } from '../../context/ThemeContext';
import foodsData from '../../assets/data/foods.json';
import { getProfile } from '../../services/api';
import { getDailyCalories, getTodayString, logFoodItem, getDailyFoodLogs, FoodLog } from '../../services/foodStorage';

type MealKey = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

interface FoodItem {
  id: number;
  food_name_en: string;
  food_name_bn: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
  category?: string;
}

export default function FoodScreen() {
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('breakfast');
  const [selectedDate, setSelectedDate] = useState(getTodayString());

  // Search Flow State
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  
  // Logging Modal State
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantityInput, setQuantityInput] = useState('1');
  const [isGrams, setIsGrams] = useState(false);

  const categories = ['All', 'Popular', 'Rice', 'Curry', 'Snacks', 'Sweets'];

  const fetchData = async () => {
    try {
      const profileRes = await getProfile();
      setProfile(profileRes.data);
    } catch (e) {
      console.log('Failed to fetch profile', e);
    }
  };

  const loadLogs = async () => {
    const cals = await getDailyCalories(selectedDate);
    const logs = await getDailyFoodLogs(selectedDate);
    setConsumedCalories(cals);
    setTodayLogs(logs.map((log: any) => ({
      ...log,
      meal: log.meal || 'snacks',
      protein_g: Number(log.protein_g || 0),
      carbs_g: Number(log.carbs_g || 0),
      fat_g: Number(log.fat_g || 0),
    })));
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadLogs();
    }, [selectedDate])
  );

  const openLoggingModal = (food: FoodItem) => {
    setSelectedFood(food);
    const usesGrams = food.serving_size.includes('100g');
    setIsGrams(usesGrams);
    setQuantityInput(usesGrams ? '100' : '1');
  };

  const confirmLogFood = async () => {
    if (!selectedFood) return;
    
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) return;

    let calculatedCalories = 0;
    let unitLabel = '';

    if (isGrams) {
      calculatedCalories = (qty / 100) * selectedFood.calories;
      unitLabel = 'g';
    } else {
      calculatedCalories = qty * selectedFood.calories;
      const match = selectedFood.serving_size.match(/[a-zA-Z]+/);
      unitLabel = match ? match[0] : 'serving';
      if (qty > 1 && !unitLabel.endsWith('s')) unitLabel += 's';
    }

    const factor = isGrams ? qty / 100 : qty;

    try {
      await logFoodItem(selectedDate, {
        meal: selectedMeal,
        foodName: selectedFood.food_name_en,
        quantity: qty,
        unit: unitLabel,
        calories: Math.round(calculatedCalories),
        protein_g: parseFloat((selectedFood.protein_g * factor).toFixed(1)),
        carbs_g: parseFloat((selectedFood.carbs_g * factor).toFixed(1)),
        fat_g: parseFloat((selectedFood.fat_g * factor).toFixed(1)),
      });
      loadLogs();
      setSelectedFood(null);
      setIsSearchActive(false);
      setSearchQuery('');
    } catch (e) {
      console.log('Failed to log food', e);
    }
  };

  const filteredFoods = useMemo(() => {
    if (!searchQuery && !isSearchActive) return [];
    let list = foodsData as FoodItem[];
    if (searchQuery) {
      list = list.filter(f => 
        f.food_name_en.toLowerCase().includes(searchQuery.toLowerCase()) || 
        f.food_name_bn.includes(searchQuery)
      );
    }
    // Very basic client-side category mock
    if (activeCategory !== 'All' && !searchQuery) {
      list = list.slice(0, 10); // Mocking category filter
    }
    return list;
  }, [searchQuery, isSearchActive, activeCategory]);

  const totalAllowed = profile?.daily_calorie_target || 2000;
  const remaining = totalAllowed - consumedCalories;

  const renderFoodCard = ({ item, index }: { item: FoodItem, index: number }) => (
    <Animated.View entering={FadeInUp.delay(index * 50).springify()}>
      <TouchableOpacity 
        style={[styles.foodCard, { backgroundColor: theme.surface, borderColor: theme.border }]}
        onPress={() => openLoggingModal(item)}
      >
        <View style={[styles.foodImagePlaceholder, { backgroundColor: theme.border }]}>
          <Icons.Utensils size={24} color={theme.textMuted} />
        </View>
        <View style={styles.foodCardContent}>
          <Text style={[styles.foodName, { color: theme.text }]} numberOfLines={1}>
            {item.food_name_en} {item.food_name_bn ? `(${item.food_name_bn})` : ''}
          </Text>
          <Text style={[styles.foodServing, { color: theme.textMuted }]}>
            {item.calories} kcal / {item.serving_size}
          </Text>
          <View style={styles.macroBadges}>
            <Text style={[styles.macroText, { color: theme.primary }]}>P: {item.protein_g}g</Text>
            <Text style={[styles.macroText, { color: theme.secondary }]}>C: {item.carbs_g}g</Text>
            <Text style={[styles.macroText, { color: theme.warning }]}>F: {item.fat_g}g</Text>
          </View>
        </View>
        <View style={[styles.addBtn, { backgroundColor: theme.primarySurface }]}>
          <Ionicons name="add" size={20} color={theme.primary} />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const calculatedNutrition = useMemo(() => {
    if (!selectedFood) return null;
    const q = parseFloat(quantityInput) || 0;
    const factor = isGrams ? q / 100 : q;
    return {
      cals: Math.round(selectedFood.calories * factor),
      p: (selectedFood.protein_g * factor).toFixed(1),
      c: (selectedFood.carbs_g * factor).toFixed(1),
      f: (selectedFood.fat_g * factor).toFixed(1),
    };
  }, [selectedFood, quantityInput, isGrams]);

  return (
    <GlassBackground>
      <View style={styles.container}>
        {/* Header */}
        <Animated.View entering={FadeInUp} style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Log Food</Text>
          <View style={[styles.dateSelector, { backgroundColor: theme.surface }]}>
            <Text style={[styles.dateText, { color: theme.text }]}>{selectedDate === getTodayString() ? 'Today' : selectedDate}</Text>
          </View>
        </Animated.View>

        {/* Search Bar */}
        <Animated.View entering={FadeInUp.delay(100)} style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: isSearchActive ? theme.primary : theme.border }]}>
          <Icons.Search size={20} color={isSearchActive ? theme.primary : theme.textMuted} style={{ marginRight: 12 }} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search for any food..."
            placeholderTextColor={theme.textPlaceholder}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsSearchActive(true)}
          />
          {isSearchActive && (
            <TouchableOpacity onPress={() => { setIsSearchActive(false); setSearchQuery(''); }}>
              <Icons.X size={20} color={theme.textMuted} />
            </TouchableOpacity>
          )}
        </Animated.View>

        {isSearchActive ? (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingRight: 16 }}>
              {categories.map((cat, i) => (
                <TouchableOpacity 
                  key={i} 
                  style={[styles.categoryChip, { backgroundColor: activeCategory === cat ? theme.primary : theme.surface, borderColor: activeCategory === cat ? theme.primary : theme.border }]}
                  onPress={() => setActiveCategory(cat)}
                >
                  <Text style={{ color: activeCategory === cat ? '#fff' : theme.text, fontWeight: '600' }}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <FlatList
              style={{ flex: 1 }}
              data={filteredFoods}
              keyExtractor={item => item.id.toString()}
              renderItem={renderFoodCard}
              contentContainerStyle={{ paddingBottom: 100 }}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
            <Animated.View entering={FadeInUp.delay(200)}>
              <AppCard variant="glass" style={styles.remainingCard}>
                <Text style={[styles.remainingLabel, { color: theme.textMuted }]}>Calories Remaining</Text>
                <Text style={[styles.remainingValue, { color: remaining >= 0 ? theme.primary : theme.error }]}>
                  {remaining} <Text style={{ fontSize: 16, fontWeight: '600' }}>kcal</Text>
                </Text>
              </AppCard>
            </Animated.View>

            {['breakfast', 'lunch', 'dinner', 'snacks'].map((mealKey, idx) => {
              const logs = todayLogs.filter(l => l.meal === mealKey);
              const cals = logs.reduce((sum, l) => sum + (l.calories || 0), 0);
              return (
                <Animated.View key={mealKey} entering={FadeInUp.delay(300 + idx * 50)}>
                  <View style={[styles.mealSection, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <View style={styles.mealHeader}>
                      <View>
                        <Text style={[styles.mealTitle, { color: theme.text }]} style={{textTransform: 'capitalize', fontSize: 18, fontWeight: '800', color: theme.text}}>{mealKey}</Text>
                        <Text style={[styles.mealCals, { color: theme.primary }]}>{cals} kcal</Text>
                      </View>
                      <TouchableOpacity 
                        style={[styles.quickAddBtn, { backgroundColor: theme.primarySurface }]}
                        onPress={() => { setSelectedMeal(mealKey as MealKey); setIsSearchActive(true); }}
                      >
                        <Icons.Plus size={20} color={theme.primary} />
                      </TouchableOpacity>
                    </View>

                    {logs.length > 0 ? (
                      logs.map(log => (
                        <View key={log.id} style={[styles.logRow, { borderTopColor: theme.border }]}>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.logName, { color: theme.text }]}>{log.food_name || log.foodName}</Text>
                            <Text style={[styles.logQty, { color: theme.textMuted }]}>{log.quantity} {log.unit}</Text>
                            <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                              <Text style={{ fontSize: 11, color: theme.primary, fontWeight: '600' }}>P: {log.protein_g || 0}g</Text>
                              <Text style={{ fontSize: 11, color: theme.secondary, fontWeight: '600' }}>C: {log.carbs_g || 0}g</Text>
                              <Text style={{ fontSize: 11, color: theme.warning, fontWeight: '600' }}>F: {log.fat_g || 0}g</Text>
                            </View>
                          </View>
                          <Text style={[styles.logCalsValue, { color: theme.textSecondary }]}>{log.calories} kcal</Text>
                        </View>
                      ))
                    ) : (
                      <Text style={[styles.emptyMealText, { color: theme.textMuted }]}>Tap + to log foods.</Text>
                    )}
                  </View>
                </Animated.View>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Fast Logging Modal */}
      {selectedFood && (
        <Modal transparent visible animationType="fade">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setSelectedFood(null); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay} pointerEvents="box-none">
            <Animated.View entering={SlideInDown.springify()} style={[styles.modalContent, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
              <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} />
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]} numberOfLines={1}>
                  {selectedFood.food_name_en} {selectedFood.food_name_bn ? `(${selectedFood.food_name_bn})` : ''}
                </Text>
                <TouchableOpacity onPress={() => setSelectedFood(null)} style={styles.closeBtn}>
                  <Icons.X size={24} color={theme.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Meal Selector */}
              <View style={styles.mealSelectorRow}>
                {['breakfast', 'lunch', 'dinner', 'snacks'].map(meal => (
                  <TouchableOpacity
                    key={meal}
                    style={[styles.mealPill, { backgroundColor: selectedMeal === meal ? theme.primary : theme.surface, borderColor: selectedMeal === meal ? theme.primary : theme.border }]}
                    onPress={() => setSelectedMeal(meal as MealKey)}
                  >
                    <Text style={{ color: selectedMeal === meal ? '#fff' : theme.text, fontSize: 12, fontWeight: '700', textTransform: 'capitalize' }}>{meal}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quick Quantity */}
              <View style={styles.qtyContainer}>
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setQuantityInput(String(Math.max(1, parseFloat(quantityInput || '1') - (isGrams ? 10 : 0.5))))}
                >
                  <Icons.Minus size={24} color={theme.text} />
                </TouchableOpacity>
                <TextInput
                  style={[styles.qtyInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]}
                  keyboardType="numeric"
                  value={quantityInput}
                  onChangeText={setQuantityInput}
                  autoFocus
                  selectTextOnFocus
                />
                <TouchableOpacity 
                  style={[styles.qtyBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
                  onPress={() => setQuantityInput(String(parseFloat(quantityInput || '0') + (isGrams ? 10 : 0.5)))}
                >
                  <Icons.Plus size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.qtyUnit, { color: theme.textMuted }]}>{isGrams ? 'g' : 'serving'}</Text>
              </View>

              {/* Live Macro Preview */}
              <View style={[styles.livePreviewBox, { backgroundColor: theme.surface }]}>
                <View style={styles.liveStat}>
                  <Text style={[styles.liveVal, { color: theme.primary }]}>{calculatedNutrition?.cals}</Text>
                  <Text style={[styles.liveLbl, { color: theme.textMuted }]}>Kcal</Text>
                </View>
                <View style={styles.liveStat}>
                  <Text style={[styles.liveVal, { color: theme.text }]}>{calculatedNutrition?.p}g</Text>
                  <Text style={[styles.liveLbl, { color: theme.textMuted }]}>Protein</Text>
                </View>
                <View style={styles.liveStat}>
                  <Text style={[styles.liveVal, { color: theme.text }]}>{calculatedNutrition?.c}g</Text>
                  <Text style={[styles.liveLbl, { color: theme.textMuted }]}>Carbs</Text>
                </View>
                <View style={styles.liveStat}>
                  <Text style={[styles.liveVal, { color: theme.text }]}>{calculatedNutrition?.f}g</Text>
                  <Text style={[styles.liveLbl, { color: theme.textMuted }]}>Fat</Text>
                </View>
              </View>

              <TouchableOpacity style={[styles.confirmBtn, { backgroundColor: theme.primary }]} onPress={confirmLogFood}>
                <Text style={styles.confirmBtnText}>Confirm</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
  },
  dateSelector: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  categoryScroll: {
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 16,
    maxHeight: 45,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  foodCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
    alignItems: 'center',
  },
  foodImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  foodCardContent: {
    flex: 1,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  foodServing: {
    fontSize: 12,
    marginBottom: 6,
  },
  macroBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  macroText: {
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
  remainingCard: {
    padding: 20,
    marginBottom: 20,
    alignItems: 'center',
  },
  remainingLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  remainingValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  mealSection: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitle: {
    // defined inline
  },
  mealCals: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  quickAddBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  logName: {
    fontSize: 15,
    fontWeight: '600',
  },
  logQty: {
    fontSize: 12,
    marginTop: 2,
  },
  logCalsValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  emptyMealText: {
    fontSize: 14,
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 32,
    borderWidth: 1,
    padding: 24,
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
  mealSelectorRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  mealPill: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '800',
  },
  qtyUnit: {
    fontSize: 16,
    fontWeight: '600',
    width: 60,
  },
  livePreviewBox: {
    flexDirection: 'row',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  liveStat: {
    alignItems: 'center',
  },
  liveVal: {
    fontSize: 20,
    fontWeight: '800',
  },
  liveLbl: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 4,
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
