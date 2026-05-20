import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FoodLog {
  id: string;
  meal: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  time: string;
}

const FOOD_LOGS_KEY = '@fitTrack_foodLogs';

// Helper to get today's date string (YYYY-MM-DD)
export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const getDailyFoodLogs = async (date: string): Promise<FoodLog[]> => {
  try {
    const data = await AsyncStorage.getItem(FOOD_LOGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return parsed[date] || [];
    }
    return [];
  } catch (error) {
    console.error('Failed to get food logs', error);
    return [];
  }
};

export const getDailyCalories = async (date: string): Promise<number> => {
  const logs = await getDailyFoodLogs(date);
  return logs.reduce((total, log) => total + log.calories, 0);
};

export const logFoodItem = async (date: string, food: Omit<FoodLog, 'id' | 'time'>): Promise<FoodLog[]> => {
  try {
    const data = await AsyncStorage.getItem(FOOD_LOGS_KEY);
    const parsed = data ? JSON.parse(data) : {};
    
    const currentLogs: FoodLog[] = parsed[date] || [];
    const newLog: FoodLog = {
      ...food,
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      time: new Date().toLocaleTimeString(),
    };
    
    const updatedLogs = [...currentLogs, newLog];
    parsed[date] = updatedLogs;
    
    await AsyncStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(parsed));
    return updatedLogs;
  } catch (error) {
    console.error('Failed to log food item', error);
    return [];
  }
};
