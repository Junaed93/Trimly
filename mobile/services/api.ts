import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Dynamically determine the backend URL based on where the Expo bundler is running.
let API_URL = 'http://localhost:3000';

if (Platform.OS !== 'web') {
  // Constants.expoConfig?.hostUri is usually something like "192.168.0.100:8081" during development
  const debuggerHost = Constants.expoConfig?.hostUri;
  if (debuggerHost) {
    const ip = debuggerHost.split(':')[0];
    API_URL = `http://${ip}:3000`;
  } else if (Platform.OS === 'android') {
    API_URL = 'http://10.0.2.2:3000';
  }
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

export const registerUser = (data: {
  name: string;
  email: string;
  password: string;
}) => api.post('/auth/register', data);

export const loginUser = (data: { email: string; password: string }) =>
  api.post('/auth/login', data);

export const getProfile = () => api.get('/auth/profile');

export const updateProfile = (data: {
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  goal: string;
}) => api.put('/auth/profile', data);

export const updateAccount = (data: {
  name?: string;
  email?: string;
  password?: string;
}) => api.put('/auth/account', data);

export const logWeight = (data: { weight_kg: number; date: string }) => 
  api.post('/weight', data);

export const getWeightLogs = () => api.get('/weight');

export const getAwards = () => api.get('/awards');
export const getUserAwards = () => api.get('/awards/user');

export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id: number) => api.post(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.post('/notifications/read-all');
export const saveToken = (token: string) =>
  AsyncStorage.setItem('token', token);

export const getToken = () => AsyncStorage.getItem('token');

export const removeToken = () => AsyncStorage.removeItem('token');

export default api;
