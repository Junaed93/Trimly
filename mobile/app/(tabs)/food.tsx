import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import GlassBackground from '../../components/GlassBackground';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import foodsData from '../../assets/data/foods.json';
import { getProfile } from '../../services/api';
import { getDailyCalories, getTodayString, logFoodItem, getDailyFoodLogs, FoodLog } from '../../services/foodStorage';

type MealKey = 'breakfast' | 'lunch' | 'snacks' | 'dinner';

const MEALS: { key: MealKey; label: string; hint: string }[] = [
  { key: 'breakfast', label: 'Breakfast', hint: 'First meal of the day' },
  { key: 'lunch', label: 'Lunch', hint: 'Midday fuel' },
  { key: 'snacks', label: 'Snacks', hint: 'Small bites between meals' },
  { key: 'dinner', label: 'Dinner', hint: 'Evening meal' },
];

interface FoodItem {
  id: number;
  food_name_en: string;
  food_name_bn: string;
  serving_size: string;
  calories: number;
  protein_g: number;
  fat_g: number;
  carbs_g: number;
}

export default function FoodScreen() {
  const { theme } = useTheme();

  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealKey>('breakfast');
  const [expandedMeal, setExpandedMeal] = useState<MealKey | null>(null);

  // Modals Visibility
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [mealSelectionModalVisible, setMealSelectionModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [quantityInput, setQuantityInput] = useState('100');

  const fetchData = async () => {
    try {
      const profileRes = await getProfile();
      setProfile(profileRes.data);
    } catch (e) {
      console.log('Failed to fetch profile', e);
    }
  };

  const loadLogs = async () => {
    const today = getTodayString();
    const cals = await getDailyCalories(today);
    const logs = await getDailyFoodLogs(today);
    setConsumedCalories(cals);
    setTodayLogs(
      logs.map((log: any) => ({
        ...log,
        meal: log.meal || 'snacks',
        protein_g: Number(log.protein_g || 0),
        carbs_g: Number(log.carbs_g || 0),
        fat_g: Number(log.fat_g || 0),
      })),
    );
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadLogs();
    }, [])
  );

  const openAddModal = (food: FoodItem) => {
    setSelectedFood(food);
    if (food.serving_size.includes('100g')) {
      setQuantityInput('100');
    } else {
      setQuantityInput('1');
    }
  };

  const confirmLogFood = async () => {
    if (!selectedFood) return;
    
    const qty = parseFloat(quantityInput);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity.');
      return;
    }

    let calculatedCalories = 0;
    let unitLabel = '';

    if (selectedFood.serving_size.includes('100g')) {
      calculatedCalories = (qty / 100) * selectedFood.calories;
      unitLabel = 'g';
    } else {
      calculatedCalories = qty * selectedFood.calories;
      const match = selectedFood.serving_size.match(/[a-zA-Z]+/);
      unitLabel = match ? match[0] : 'serving';
      if (qty > 1) unitLabel += 's';
    }

    try {
      const factor = selectedFood.serving_size.includes('100g') ? qty / 100 : qty;
      await logFoodItem(getTodayString(), {
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
      setSearchModalVisible(false); // Close search flow on success
      setSearchQuery('');
    } catch (e) {
      Alert.alert('Error', 'Failed to log food');
    }
  };

  const filteredFoods = (foodsData as FoodItem[]).filter(food => 
    food.food_name_en.toLowerCase().includes(searchQuery.toLowerCase()) || 
    food.food_name_bn.includes(searchQuery)
  );

  const totalAllowed = profile?.daily_calorie_target || 2000;
  const remaining = totalAllowed - consumedCalories;

  const getMealLogs = (meal: MealKey) =>
    todayLogs.filter((log) => ((log.meal as MealKey) || 'snacks') === meal);

  const getMealTotals = (mealLogs: FoodLog[]) =>
    mealLogs.reduce(
      (totals, log) => ({
        calories: totals.calories + Number(log.calories || 0),
        protein_g: totals.protein_g + Number(log.protein_g || 0),
        carbs_g: totals.carbs_g + Number(log.carbs_g || 0),
        fat_g: totals.fat_g + Number(log.fat_g || 0),
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
    );

  const getMealLabel = (meal: MealKey) => MEALS.find((item) => item.key === meal)?.label || meal;

  // Calculate dynamic macros in detail modal
  const getCalculatedNutrition = () => {
    if (!selectedFood) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
    const q = parseFloat(quantityInput) || 0;
    const isGrams = selectedFood.serving_size.includes('100g');
    const factor = isGrams ? q / 100 : q;

    return {
      calories: Math.round(selectedFood.calories * factor),
      protein: parseFloat((selectedFood.protein_g * factor).toFixed(1)),
      carbs: parseFloat((selectedFood.carbs_g * factor).toFixed(1)),
      fat: parseFloat((selectedFood.fat_g * factor).toFixed(1)),
    };
  };

  const calculated = getCalculatedNutrition();
  const caloriesRemainingAfterLog = remaining - calculated.calories;

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <View style={[styles.foodCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[styles.foodName, { color: theme.text }]}>
          {item.food_name_en} <Text style={{ fontSize: 13, fontWeight: '400', color: theme.textSecondary }}>({item.food_name_bn})</Text>
        </Text>
        <Text style={{ fontSize: 12, color: theme.textMuted, marginTop: 4 }}>
          {item.calories} kcal per {item.serving_size}
        </Text>
      </View>
      <TouchableOpacity 
        style={[styles.addBtn, { backgroundColor: theme.accentSurface }]} 
        onPress={() => openAddModal(item)}
      >
        <Ionicons name="add" size={20} color={theme.accentLight} />
      </TouchableOpacity>
    </View>
  );

  const openMealLogger = (meal: MealKey) => {
    setSelectedMeal(meal);
    setSearchQuery('');
    setMealSelectionModalVisible(false);
    setSearchModalVisible(true);
  };

  const openMealSelection = () => {
    setMealSelectionModalVisible(true);
  };

  const toggleMealSection = (meal: MealKey) => {
    setSelectedMeal(meal);
    setExpandedMeal((current) => (current === meal ? null : meal));
  };

  const renderMealSection = (meal: { key: MealKey; label: string; hint: string }) => {
    return (
      <TouchableOpacity
        key={meal.key}
        style={[
          styles.mealSelectionCard,
          {
            backgroundColor: expandedMeal === meal.key ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
            borderColor: expandedMeal === meal.key ? theme.accentBorder : 'rgba(255,255,255,0.1)',
          },
        ]}
        onPress={() => toggleMealSection(meal.key)}
      >
        <View style={styles.mealSectionHeader}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <Text style={[styles.mealSectionTitle, { color: theme.text }]}>{meal.label}</Text>
            <Text style={[styles.mealSectionSubtitle, { color: theme.textMuted }]}>{meal.hint}</Text>
          </View>

          <TouchableOpacity
            style={[styles.mealLogBtn, { backgroundColor: theme.accentSurface, borderColor: theme.accentBorder }]}
            onPress={() => openMealLogger(meal.key)}
          >
            <Ionicons name="add" size={16} color={theme.accentLight} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <Text style={[styles.mealSectionTotal, { color: theme.accentLight }]}>{getMealTotals(getMealLogs(meal.key)).calories} kcal</Text>
          <Text style={[styles.mealSectionMeta, { color: theme.textMuted }]}>{getMealLogs(meal.key).length} items</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderExpandedMealDetails = (mealKey: MealKey) => {
    const meal = MEALS.find((item) => item.key === mealKey);
    if (!meal) return null;

    const mealLogs = getMealLogs(meal.key);
    const totals = getMealTotals(mealLogs);

    return (
      <View style={[styles.mealDetailsPanel, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.accentBorder }]}>
        <View style={styles.mealSectionHeader}>
          <View>
            <Text style={[styles.mealSectionTitle, { color: theme.text }]}>{meal.label}</Text>
            <Text style={[styles.mealSectionSubtitle, { color: theme.textMuted }]}>{meal.hint}</Text>
          </View>
          <TouchableOpacity onPress={() => openMealLogger(meal.key)} style={[styles.mealLogBtn, { backgroundColor: theme.accentSurface, borderColor: theme.accentBorder }]}>
            <Ionicons name="add" size={16} color={theme.accentLight} />
          </TouchableOpacity>
        </View>

        <View style={styles.macroRow}>
          <Text style={[styles.macroText, { color: theme.textSecondary }]}>P {totals.protein_g.toFixed(1)}g</Text>
          <Text style={[styles.macroText, { color: theme.textSecondary }]}>C {totals.carbs_g.toFixed(1)}g</Text>
          <Text style={[styles.macroText, { color: theme.textSecondary }]}>F {totals.fat_g.toFixed(1)}g</Text>
        </View>

        {mealLogs.length > 0 ? (
          mealLogs.map((item) => (
            <View key={item.id} style={[styles.mealItemRow, { borderBottomColor: theme.border }]}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={[styles.logName, { color: theme.text }]}>{item.foodName}</Text>
                <Text style={[styles.logQty, { color: theme.textMuted }]}>
                  {item.quantity} {item.unit} • {item.time}
                </Text>
                <Text style={[styles.logMacroLine, { color: theme.textMuted }]}>
                  P {Number(item.protein_g || 0).toFixed(1)}g · C {Number(item.carbs_g || 0).toFixed(1)}g · F {Number(item.fat_g || 0).toFixed(1)}g
                </Text>
              </View>
              <Text style={[styles.logCals, { color: theme.accentLight }]}>{item.calories} kcal</Text>
            </View>
          ))
        ) : (
          <View style={styles.emptyMealRow}>
            <Text style={[styles.placeholderText, { color: theme.textMuted }]}>No items logged for {meal.label.toLowerCase()}.</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <GlassBackground>
      <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        <Text style={[styles.title, { color: theme.text }]}>Food Log</Text>
        
        {/* Calorie Summary Banner */}
        <View style={[styles.summaryBanner, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Calories Remaining</Text>
              <Text style={[styles.summaryValue, { color: remaining >= 0 ? theme.success : theme.error }]}>
                {remaining} <Text style={{ fontSize: 16, fontWeight: '600' }}>kcal</Text>
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.compactLogBtn, { backgroundColor: theme.accentSurface, borderColor: theme.accentBorder }]}
              onPress={openMealSelection}
            >
              <Ionicons name="restaurant" size={16} color={theme.accentLight} />
              <Text style={[styles.compactLogBtnText, { color: theme.text }]}>Log Meal</Text>
              <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1, marginTop: 24 }}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Meal Breakdown</Text>
          {todayLogs.length > 0 ? (
            <View style={styles.mealBreakdownGrid}>
              {MEALS.map(renderMealSection)}
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Ionicons name="cafe-outline" size={48} color={theme.textMuted} />
              <Text style={[styles.placeholderText, { color: theme.textMuted }]}>No meals logged today yet.</Text>
            </View>
          )}

          {expandedMeal ? renderExpandedMealDetails(expandedMeal) : null}
        </View>
      </ScrollView>

      {/* MEAL SELECTION MODAL */}
      <Modal visible={mealSelectionModalVisible} transparent animationType="fade">
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.mealSelectionContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
            <Text style={[styles.mealSelectionTitle, { color: theme.text }]}>Select a Meal</Text>
            
            <View style={styles.mealSelectionGrid}>
              {MEALS.map((meal) => (
                <TouchableOpacity
                  key={meal.key}
                  style={[styles.mealSelectionCard, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.border }]}
                  onPress={() => openMealLogger(meal.key)}
                >
                  <Ionicons 
                    name={meal.key === 'breakfast' ? 'cafe-outline' : meal.key === 'lunch' ? 'restaurant-outline' : meal.key === 'dinner' ? 'moon-outline' : 'fast-food-outline'} 
                    size={32} 
                    color={theme.accentLight} 
                  />
                  <Text style={[styles.mealSelectionLabel, { color: theme.text }]}>{meal.label}</Text>
                  <Text style={[styles.mealSelectionHint, { color: theme.textMuted }]}>{meal.hint}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={{ marginTop: 16 }}
              onPress={() => setMealSelectionModalVisible(false)}
            >
              <Text style={{ color: theme.accentLight, textAlign: 'center', fontWeight: '600' }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* SEARCH FOOD MODAL */}
      <Modal visible={searchModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.fullModalContent, { backgroundColor: theme.bg }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Search Food</Text>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setSearchModalVisible(false); setSearchQuery(''); }}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={{ marginBottom: 16 }}>
              <Input 
                label=""
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Type rice, egg, fish, sweet..."
                icon="search-outline"
              />
            </View>

            <FlatList
              data={filteredFoods}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderFoodItem}
              initialNumToRender={20}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 24 }}>No matches found</Text>
              }
            />
          </View>
        </View>
      </Modal>

      {/* DETAIL & ADD MODAL */}
      <Modal visible={!!selectedFood} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              {selectedFood ? (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text, fontSize: 20 }]}>{selectedFood.food_name_en}</Text>
                    <TouchableOpacity onPress={() => setSelectedFood(null)}>
                      <Ionicons name="close" size={24} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <Text style={{ color: theme.textSecondary, fontSize: 13, marginTop: -4, marginBottom: 16 }}>({selectedFood.food_name_bn})</Text>

                  <View style={{ marginBottom: 16 }}>
                    <Text style={[styles.mealPickerLabel, { color: theme.textSecondary }]}>Add to meal</Text>
                    <View style={styles.mealPickerRow}>
                      {MEALS.map((meal) => {
                        const active = selectedMeal === meal.key;
                        return (
                          <TouchableOpacity
                            key={meal.key}
                            style={[
                              styles.mealPickerChip,
                              {
                                backgroundColor: active ? theme.accentSurface : 'rgba(255,255,255,0.04)',
                                borderColor: active ? theme.accentBorder : theme.border,
                              },
                            ]}
                            onPress={() => setSelectedMeal(meal.key)}
                          >
                            <Text style={{ color: active ? theme.accentLight : theme.text, fontWeight: '700' }}>{meal.label}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                  
                  {/* Detailed Nutrition Summary */}
                  <View style={[styles.nutritionGrid, { borderColor: theme.border }]}>
                    <View style={styles.nutritionBox}>
                      <Text style={[styles.nutritionVal, { color: theme.accent }]}>{calculated.calories}</Text>
                      <Text style={[styles.nutritionLbl, { color: theme.textMuted }]}>Calories</Text>
                    </View>
                    <View style={styles.nutritionBox}>
                      <Text style={[styles.nutritionVal, { color: theme.text }]}>{calculated.protein}g</Text>
                      <Text style={[styles.nutritionLbl, { color: theme.textMuted }]}>Protein</Text>
                    </View>
                    <View style={styles.nutritionBox}>
                      <Text style={[styles.nutritionVal, { color: theme.text }]}>{calculated.carbs}g</Text>
                      <Text style={[styles.nutritionLbl, { color: theme.textMuted }]}>Carbs</Text>
                    </View>
                    <View style={styles.nutritionBox}>
                      <Text style={[styles.nutritionVal, { color: theme.text }]}>{calculated.fat}g</Text>
                      <Text style={[styles.nutritionLbl, { color: theme.textMuted }]}>Fat</Text>
                    </View>
                  </View>

                  <View style={{ marginBottom: 16 }}>
                     <Input
                        label={selectedFood.serving_size.includes('100g') ? "Enter Grams" : `Quantity (${selectedFood.serving_size})`}
                        value={quantityInput}
                        onChangeText={setQuantityInput}
                        keyboardType="numeric"
                        icon="calculator-outline"
                     />
                  </View>
                  
                  {/* Future remaining calories display */}
                  <View style={[styles.remainingPreviewBox, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.border }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: theme.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 }}>Remaining Calories After Logging</Text>
                    <Text style={{ fontSize: 24, fontWeight: '800', marginTop: 4, color: caloriesRemainingAfterLog >= 0 ? theme.success : theme.error }}>
                      {caloriesRemainingAfterLog} kcal
                    </Text>
                  </View>
                  
                  <View style={{ marginTop: 8 }}>
                    <Button title="Confirm & Log" onPress={confirmLogFood} />
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
    paddingTop: Platform.OS === 'ios' ? 64 : 40,
    paddingBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  mealStrip: {
    display: 'none',
  },
  mealChip: {
    flexBasis: '48%',
    borderWidth: 1,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  mealChipLabel: {
    fontSize: 14,
    fontWeight: '800',
  },
  mealChipMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  summaryBanner: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: '800',
  },
  summaryValueSm: {
    fontSize: 20,
    fontWeight: '700',
  },
  widgetCard: {
    display: 'none',
  },
  widgetIconContainer: {
    display: 'none',
  },
  widgetTitle: {
    display: 'none',
  },
  widgetSubtitle: {
    display: 'none',
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  placeholderText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  mealSection: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
  },
  mealSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealLogBtn: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  mealSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  mealSectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  mealSectionTotal: {
    fontSize: 18,
    fontWeight: '800',
  },
  mealSectionMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  mealBreakdownGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  mealDetailsPanel: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 16,
    marginTop: 12,
  },
  mealItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  compactLogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 999,
    gap: 8,
    marginBottom: 12,
  },
  compactLogBtnText: {
    fontSize: 12,
    fontWeight: '800',
  },
  macroRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  macroText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  emptyMealRow: {
    paddingVertical: 10,
  },
  foodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  foodName: {
    fontSize: 16,
    fontWeight: '700',
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContainer: {
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  logName: {
    fontSize: 16,
    fontWeight: '600',
  },
  logQty: {
    fontSize: 12,
    marginTop: 4,
  },
  logMacroLine: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  logCals: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 16,
  },
  fullModalContent: {
    flex: 1,
    borderRadius: 24,
    padding: 20,
    marginTop: Platform.OS === 'ios' ? 44 : 20,
    marginBottom: 20,
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
  mealPickerLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  mealPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  mealPickerChip: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  mealPreviewBadge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutritionGrid: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 16,
    marginBottom: 20,
    overflow: 'hidden',
  },
  nutritionBox: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: 'rgba(255,255,255,0.1)',
  },
  nutritionVal: {
    fontSize: 16,
    fontWeight: '800',
  },
  nutritionLbl: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  remainingPreviewBox: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  mealSelectionContent: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
  mealSelectionTitle: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 20,
    textAlign: 'center',
  },
  mealSelectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  mealSelectionCard: {
    width: '48%',
    flexGrow: 0,
    flexShrink: 0,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealSelectionLabel: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
    textAlign: 'center',
  },
  mealSelectionHint: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
});
