import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, FlatList, TouchableOpacity, Alert, useWindowDimensions, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import GlassBackground from '../../components/GlassBackground';
import Input from '../../components/Input';
import Button from '../../components/Button';
import { useTheme } from '../../context/ThemeContext';
import foodsData from '../../assets/data/foods.json';
import { getProfile } from '../../services/api';
import { getDailyCalories, getTodayString, logFoodItem, getDailyFoodLogs, FoodLog } from '../../services/foodStorage';

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
  const { width } = useWindowDimensions();
  const isMobileLayout = width < 768;

  const [searchQuery, setSearchQuery] = useState('');
  const [profile, setProfile] = useState<any>(null);
  const [consumedCalories, setConsumedCalories] = useState(0);
  const [todayLogs, setTodayLogs] = useState<FoodLog[]>([]);

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
    setTodayLogs(logs);
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
      await logFoodItem(getTodayString(), {
        foodName: selectedFood.food_name_en,
        quantity: qty,
        unit: unitLabel,
        calories: Math.round(calculatedCalories)
      });
      loadLogs();
      setSelectedFood(null);
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

  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <View style={[styles.foodCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={[styles.foodName, { color: theme.text }]}>{item.food_name_en} <Text style={{ fontSize: 14, fontWeight: '400', color: theme.textSecondary }}>({item.food_name_bn})</Text></Text>
        <View style={{ flexDirection: 'row', marginTop: 4, gap: 12, flexWrap: 'wrap' }}>
          <Text style={[styles.macroText, { color: theme.accentLight }]}>{item.calories} kcal</Text>
          <Text style={[styles.macroText, { color: theme.textMuted }]}>Serving: {item.serving_size}</Text>
          <Text style={[styles.macroText, { color: theme.textMuted }]}>P: {item.protein_g}g</Text>
          <Text style={[styles.macroText, { color: theme.textMuted }]}>C: {item.carbs_g}g</Text>
          <Text style={[styles.macroText, { color: theme.textMuted }]}>F: {item.fat_g}g</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.addBtn, { backgroundColor: theme.accentSurface }]} 
        onPress={() => openAddModal(item)}
      >
        <Ionicons name="add" size={24} color={theme.accentLight} />
      </TouchableOpacity>
    </View>
  );

  return (
    <GlassBackground>
      <View style={styles.container}>
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
            <View style={{ alignItems: 'flex-end' }}>
               <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Eaten Today</Text>
               <Text style={[styles.summaryValueSm, { color: theme.accentLight }]}>{consumedCalories} / {totalAllowed}</Text>
            </View>
          </View>
        </View>

        {/* Today's Logs */}
        {!searchQuery && todayLogs.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Today's Log</Text>
            <View style={[styles.logContainer, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
               {todayLogs.map((log, index) => (
                  <View key={log.id} style={[styles.logRow, { borderBottomColor: theme.border, borderBottomWidth: index === todayLogs.length - 1 ? 0 : 1 }]}>
                    <View>
                      <Text style={[styles.logName, { color: theme.text }]}>{log.foodName}</Text>
                      <Text style={[styles.logQty, { color: theme.textMuted }]}>{log.quantity} {log.unit} • {log.time}</Text>
                    </View>
                    <Text style={[styles.logCals, { color: theme.accentLight }]}>{log.calories} kcal</Text>
                  </View>
               ))}
            </View>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>Add Food</Text>
        {/* Search Input */}
        <View style={{ marginBottom: 16 }}>
          <Input 
            label=""
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search foods (English or Bengali)..."
            icon="search-outline"
          />
        </View>

        {/* Food List */}
        <FlatList
          data={filteredFoods}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderFoodItem}
          initialNumToRender={20}
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
             <Text style={{ color: theme.textSecondary, textAlign: 'center', marginTop: 24 }}>No foods found</Text>
          }
        />
      </View>

      {/* Add Food Modal */}
      <Modal visible={!!selectedFood} transparent animationType="fade">
        <View style={styles.modalOverlay}>
           <View style={[styles.modalContent, { backgroundColor: theme.bg, borderColor: theme.border }]}>
              {selectedFood && (
                <>
                  <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: theme.text }]}>Add {selectedFood.food_name_en}</Text>
                    <TouchableOpacity onPress={() => setSelectedFood(null)}>
                      <Ionicons name="close" size={24} color={theme.textMuted} />
                    </TouchableOpacity>
                  </View>
                  
                  <Text style={{ color: theme.textSecondary, marginBottom: 16 }}>
                    Base: {selectedFood.calories} kcal per {selectedFood.serving_size}
                  </Text>
                  
                  <View style={{ marginBottom: 24 }}>
                     <Input
                        label={selectedFood.serving_size.includes('100g') ? "Quantity (grams)" : "Quantity (pieces/servings)"}
                        value={quantityInput}
                        onChangeText={setQuantityInput}
                        keyboardType="numeric"
                        icon="calculator-outline"
                     />
                  </View>
                  
                  <View style={[styles.calculatedBox, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: theme.border }]}>
                     <Text style={[styles.summaryLabel, { color: theme.textMuted, textAlign: 'center' }]}>Calculated Calories</Text>
                     <Text style={[styles.summaryValue, { color: theme.accent, textAlign: 'center' }]}>
                       {(() => {
                          const q = parseFloat(quantityInput) || 0;
                          return selectedFood.serving_size.includes('100g') 
                            ? Math.round((q / 100) * selectedFood.calories)
                            : Math.round(q * selectedFood.calories);
                       })()} kcal
                     </Text>
                  </View>
                  
                  <View style={{ marginTop: 8 }}>
                    <Button title="Confirm & Log" onPress={confirmLogFood} />
                  </View>
                </>
              )}
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
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  summaryBanner: {
    padding: 20,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 20,
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
  macroText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logContainer: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  logName: {
    fontSize: 16,
    fontWeight: '600',
  },
  logQty: {
    fontSize: 12,
    marginTop: 4,
  },
  logCals: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
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
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  calculatedBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  }
});
