import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Input from '../components/Input';
import Button from '../components/Button';
import { loginUser, saveToken } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const res = await loginUser({ email, password });
      await saveToken(res.data.access_token);
      router.replace('/profile');
    } catch (err: any) {
      const message =
        err.response?.data?.message || 'Login failed. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0d1117]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 md:flex-row">
        {/* Left Side: Branding (Visible only on PC/md+) */}
        <View className="hidden md:flex flex-1 bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] items-center justify-center p-12 border-r border-[#2a3040]">
           <View className="w-40 h-40 rounded-full bg-[#6366f1]/15 items-center justify-center mb-8 border-[4px] border-[#6366f1]/30">
              <Ionicons name="fitness" size={80} color="#6366f1" />
           </View>
           <Text className="text-white text-6xl font-extrabold tracking-tight mb-4 text-center">
             FitTrack<Text className="text-[#6366f1]">BD</Text>
           </Text>
           <Text className="text-gray-400 text-xl font-medium text-center max-w-md leading-relaxed">
             The ultimate platform to calculate your caloric needs, crush your goals, and transform your body.
           </Text>
        </View>

        {/* Right Side: Form */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-7 py-10 max-w-lg w-full mx-auto">
            {/* Logo & Brand (Visible only on Mobile) */}
            <View className="items-center mb-12 md:hidden">
              <View className="w-24 h-24 rounded-3xl bg-[#6366f1]/15 items-center justify-center mb-5 border border-[#6366f1]/30">
                <Ionicons name="fitness" size={48} color="#6366f1" />
              </View>
              <Text className="text-white text-4xl font-extrabold tracking-tight">
                FitTrack<Text className="text-[#6366f1]">BD</Text>
              </Text>
              <Text className="text-gray-500 text-base mt-2 font-medium">
                Your fitness journey starts here
              </Text>
            </View>

            {/* PC Header */}
            <View className="hidden md:flex mb-10">
              <Text className="text-white text-3xl font-bold mb-2">Welcome Back</Text>
              <Text className="text-gray-500">Sign in to your account to continue.</Text>
            </View>

            {/* Error */}
            {error ? (
              <View className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3.5 mb-5 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#f87171" style={{ marginRight: 8 }} />
                <Text className="text-red-400 text-sm flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Form */}
            <Input
              label="Email Address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              icon="mail-outline"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              icon="lock-closed-outline"
            />

            <View className="mt-3">
              <Button
                title="Sign In"
                onPress={handleLogin}
                loading={loading}
                icon="log-in-outline"
              />
            </View>

            {/* Divider */}
            <View className="flex-row items-center my-8">
              <View className="flex-1 h-px bg-[#2a3040]" />
              <Text className="text-gray-600 mx-4 text-xs font-medium uppercase tracking-wider">or</Text>
              <View className="flex-1 h-px bg-[#2a3040]" />
            </View>

            {/* Register link */}
            <Button
              title="Create New Account"
              onPress={() => router.push('/register')}
              variant="secondary"
              icon="person-add-outline"
            />

            {/* Divider */}
            <View className="flex-row items-center my-6">
              <View className="flex-1 h-px bg-[#2a3040]" />
              <Text className="text-gray-600 mx-4 text-xs font-medium uppercase tracking-wider">or</Text>
              <View className="flex-1 h-px bg-[#2a3040]" />
            </View>

            {/* Google OAuth */}
            <TouchableOpacity
              className="flex-row items-center justify-center py-4 px-6 rounded-2xl border border-[#2a3040] bg-[#1a1f2e]"
              onPress={() => {
                if (typeof window !== 'undefined') {
                  window.location.href = 'http://localhost:3000/auth/google';
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="logo-google" size={20} color="#ea4335" style={{ marginRight: 10 }} />
              <Text className="text-white font-bold text-base">Continue with Google</Text>
            </TouchableOpacity>

            {/* Footer */}
            <View className="items-center mt-10 md:mt-20">
              <Text className="text-gray-600 text-xs">
                Built with ❤️ in Bangladesh
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
