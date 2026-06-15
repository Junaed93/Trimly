import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FoodLog {
  id?: number;
  user_id?: number;
  date: string;
  meal: string;
  foodName: string;
  quantity: number;
  unit: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  time: string;
  synced?: boolean;
}

const FOOD_LOGS_KEY = '@trimly_food_logs';

export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const getDailyFoodLogs = async (date: string): Promise<FoodLog[]> => {
  // 1. Get from local storage first
  let localLogs: FoodLog[] = [];
  try {
    const stored = await AsyncStorage.getItem(FOOD_LOGS_KEY);
    if (stored) {
      const allLogs: FoodLog[] = JSON.parse(stored);
      localLogs = allLogs.filter(log => log.date === date);
    }
  } catch (e) {
    console.error('Error reading local food logs', e);
  }

  // 2. Fetch from backend and sync local
  try {
    const response = await api.get(`/food-logs/${date}`);
    const remoteLogs: FoodLog[] = response.data || [];
    
    // Update local storage with remote logs
    const stored = await AsyncStorage.getItem(FOOD_LOGS_KEY);
    let allLogs: FoodLog[] = stored ? JSON.parse(stored) : [];
    // Remove existing logs for this date that are synced, and replace with remote
    allLogs = allLogs.filter(log => log.date !== date || !log.synced);
    
    // Add remote logs
    const mergedLogs = [...allLogs, ...remoteLogs.map(l => ({ ...l, synced: true }))];
    await AsyncStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(mergedLogs));
    
    return mergedLogs.filter(log => log.date === date);
  } catch (error) {
    console.log('Offline mode: failed to get remote food logs', error);
    return localLogs;
  }
};

export const getDailyCalories = async (date: string): Promise<number> => {
  const logs = await getDailyFoodLogs(date);
  return logs.reduce((total, log) => total + Number(log.calories || 0), 0);
};

export const syncUnsyncedLogs = async () => {
  try {
    const stored = await AsyncStorage.getItem(FOOD_LOGS_KEY);
    if (!stored) return;
    const allLogs: FoodLog[] = JSON.parse(stored);
    const unsynced = allLogs.filter(log => !log.synced);
    
    for (const log of unsynced) {
      try {
        const payload = {
          ...log,
          food_name: log.foodName,
        };
        await api.post('/food-logs', payload);
        log.synced = true;
      } catch (e) {
        console.log('Failed to sync log', log);
      }
    }
    await AsyncStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(allLogs));
  } catch (e) {}
};

export const logFoodItem = async (date: string, food: Omit<FoodLog, 'id' | 'user_id' | 'date' | 'time' | 'synced'>): Promise<FoodLog[]> => {
  const newLog: FoodLog = {
    ...food,
    date,
    time: new Date().toLocaleTimeString(),
    synced: false,
    id: Date.now(), // temporary local ID
  };

  try {
    // 1. Save locally first
    const stored = await AsyncStorage.getItem(FOOD_LOGS_KEY);
    const allLogs: FoodLog[] = stored ? JSON.parse(stored) : [];
    allLogs.push(newLog);
    await AsyncStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(allLogs));

    // 2. Try to sync to backend
    const payload = {
      ...newLog,
      food_name: newLog.foodName,
    };
    await api.post('/food-logs', payload);
    
    // Mark as synced if successful
    newLog.synced = true;
    const updatedStored = await AsyncStorage.getItem(FOOD_LOGS_KEY);
    if (updatedStored) {
      const updatedLogs: FoodLog[] = JSON.parse(updatedStored);
      const idx = updatedLogs.findIndex(l => l.id === newLog.id);
      if (idx !== -1) updatedLogs[idx].synced = true;
      await AsyncStorage.setItem(FOOD_LOGS_KEY, JSON.stringify(updatedLogs));
    }
  } catch (error) {
    console.log('Offline mode: failed to sync immediately. Will sync later.', error);
  }

  // Attempt background sync of other logs
  syncUnsyncedLogs();
  
  return await getDailyFoodLogs(date);
};
