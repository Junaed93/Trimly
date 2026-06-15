import api from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ExerciseLog {
  id?: number;
  user_id?: number;
  exercise_id: number;
  exercise_name: string;
  met: number;
  duration_minutes: number;
  calories_burned: number;
  logged_at?: string;
  synced?: boolean;
}

const EXERCISE_LOGS_KEY = '@trimly_exercise_logs';

export const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

export const getDailyExerciseLogs = async (): Promise<{ logs: ExerciseLog[], total_calories_burned: number }> => {
  let localLogs: ExerciseLog[] = [];
  try {
    const stored = await AsyncStorage.getItem(EXERCISE_LOGS_KEY);
    if (stored) {
      const allLogs: ExerciseLog[] = JSON.parse(stored);
      localLogs = allLogs.filter(log => {
        // filter by today. logged_at might not exist for local, or it's an ISO string.
        const logDate = log.logged_at ? log.logged_at.split('T')[0] : getTodayString();
        return logDate === getTodayString();
      });
    }
  } catch (e) {
    console.error('Error reading local exercise logs', e);
  }

  try {
    const response = await api.get(`/exercise/today`);
    const remoteData = response.data || { logs: [], total_calories_burned: 0 };
    const remoteLogs: ExerciseLog[] = remoteData.logs;
    
    const stored = await AsyncStorage.getItem(EXERCISE_LOGS_KEY);
    let allLogs: ExerciseLog[] = stored ? JSON.parse(stored) : [];
    // remove synced logs for today
    allLogs = allLogs.filter(log => {
       const logDate = log.logged_at ? log.logged_at.split('T')[0] : getTodayString();
       return !(logDate === getTodayString() && log.synced);
    });
    
    const mergedLogs = [...allLogs, ...remoteLogs.map(l => ({ ...l, synced: true }))];
    await AsyncStorage.setItem(EXERCISE_LOGS_KEY, JSON.stringify(mergedLogs));
    
    return remoteData;
  } catch (error) {
    console.log('Offline mode: failed to get remote exercise logs', error);
    const total_calories_burned = localLogs.reduce((sum, log) => sum + Number(log.calories_burned), 0);
    return { logs: localLogs, total_calories_burned };
  }
};

export const syncUnsyncedExerciseLogs = async () => {
  try {
    const stored = await AsyncStorage.getItem(EXERCISE_LOGS_KEY);
    if (!stored) return;
    const allLogs: ExerciseLog[] = JSON.parse(stored);
    const unsynced = allLogs.filter(log => !log.synced);
    
    for (const log of unsynced) {
      try {
        await api.post('/exercise/log', log);
        log.synced = true;
      } catch (e) {
        console.log('Failed to sync exercise log', log);
      }
    }
    await AsyncStorage.setItem(EXERCISE_LOGS_KEY, JSON.stringify(allLogs));
  } catch (e) {}
};

export const logExerciseItem = async (
  exercise: Omit<ExerciseLog, 'id' | 'user_id' | 'logged_at' | 'synced'>
): Promise<{ calories_burned: number }> => {
  const newLog: ExerciseLog = {
    ...exercise,
    synced: false,
    id: Date.now(),
    logged_at: new Date().toISOString(),
  };

  try {
    const stored = await AsyncStorage.getItem(EXERCISE_LOGS_KEY);
    const allLogs: ExerciseLog[] = stored ? JSON.parse(stored) : [];
    allLogs.push(newLog);
    await AsyncStorage.setItem(EXERCISE_LOGS_KEY, JSON.stringify(allLogs));

    await api.post('/exercise/log', newLog);
    
    newLog.synced = true;
    const updatedStored = await AsyncStorage.getItem(EXERCISE_LOGS_KEY);
    if (updatedStored) {
      const updatedLogs: ExerciseLog[] = JSON.parse(updatedStored);
      const idx = updatedLogs.findIndex(l => l.id === newLog.id);
      if (idx !== -1) updatedLogs[idx].synced = true;
      await AsyncStorage.setItem(EXERCISE_LOGS_KEY, JSON.stringify(updatedLogs));
    }
  } catch (error) {
    console.log('Offline mode: failed to sync exercise immediately. Will sync later.', error);
  }

  syncUnsyncedExerciseLogs();
  return { calories_burned: exercise.calories_burned };
};

export const getExerciseHistory = async () => {
  try {
    const response = await api.get('/exercise/history');
    return response.data;
  } catch (error) {
    console.error('Failed to get exercise history', error);
    return [];
  }
};
