import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, Platform, FlatList, TouchableOpacity, Alert, useWindowDimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import GlassBackground from '../../components/GlassBackground';
import Input from '../../components/Input';
import { useTheme } from '../../context/ThemeContext';
import foodsData from '../../assets/data/foods.json';
import { getProfile } from '../../services/api';
import { getDailyCalories, getTodayString, logFoodItem } from '../../services/foodStorage';

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

  const fetchData = async () => {
    try {
      const profileRes = await getProfile();
      setProfile(profileRes.data);
    } catch (e) {
      console.log('Failed to fetch profile', e);
    }
  };

  const loadCalories = async () => {
    const cals = await getDailyCalories(getTodayString());
    setConsumedCalories(cals);
  };

  useFocusEffect(
    useCallback(() => {
      fetchData();
      loadCalories();
    }, [])
  );

  const handleLogFood = async (food: FoodItem) => {
    try {
      await logFoodItem(getTodayString(), {
        foodName: food.food_name_en,
        calories: food.calories
      });
      // reload calories immediately
      loadCalories();
      Alert.alert('Success', `Logged ${food.food_name_en} (${food.calories} kcal)`);
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
        onPress={() => handleLogFood(item)}
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
  }
});
