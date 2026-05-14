import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { getToken } from '../services/api';

export default function Index() {
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = await getToken();
    if (token) {
      router.replace('/profile');
    } else {
      router.replace('/login');
    }
  };

  return (
    <View className="flex-1 bg-dark-900 items-center justify-center">
      <ActivityIndicator size="large" color="#10b981" />
    </View>
  );
}
