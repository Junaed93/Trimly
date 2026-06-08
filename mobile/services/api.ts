import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Change this to your backend URL
const API_URL = 'http://192.168.0.100:3000';

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

export const logWeight = (data: { weight_kg: number; date: string }) => 
  api.post('/weight', data);

export const getWeightLogs = () => api.get('/weight');

export const saveToken = (token: string) =>
  AsyncStorage.setItem('token', token);

export const getToken = () => AsyncStorage.getItem('token');

export const removeToken = () => AsyncStorage.removeItem('token');

export default api;
