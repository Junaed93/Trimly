import { useEffect } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { saveToken } from '../services/api';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  useEffect(() => {
    if (token) {
      saveToken(token).then(() => {
        router.replace('/profile');
      });
    } else {
      router.replace('/login');
    }
  }, [token]);

  return (
    <View className="flex-1 bg-[#0d1117] items-center justify-center">
      <ActivityIndicator size="large" color="#6366f1" />
      <Text className="text-gray-400 mt-4 font-medium text-base">Signing you in with Google...</Text>
    </View>
  );
}
