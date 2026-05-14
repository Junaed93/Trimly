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
import { registerUser, loginUser, saveToken } from '../services/api';

export default function RegisterScreen() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleRegister = async () => {
    setError('');

    if (!form.name || !form.email || !form.password) {
      setError('Please fill in all fields');
      return;
    }

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await registerUser(form);
      
      const loginRes = await loginUser({ email: form.email, password: form.password });
      await saveToken(loginRes.data.access_token);
      
      router.replace('/profile');
    } catch (err: any) {
      const message =
        err.response?.data?.message ||
        'Registration failed. Please try again.';
      setError(Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-[#0d1117]"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View className="flex-1 md:flex-row-reverse">
        {/* Left Side: Branding (Visible only on PC/md+) - Reversed order for variety */}
        <View className="hidden md:flex flex-1 bg-gradient-to-tr from-[#1a1f2e] to-[#0f1422] items-center justify-center p-12 border-l border-[#2a3040]">
           <View className="w-40 h-40 rounded-full bg-[#10b981]/15 items-center justify-center mb-8 border-[4px] border-[#10b981]/30">
              <Ionicons name="rocket" size={80} color="#10b981" />
           </View>
           <Text className="text-white text-5xl font-extrabold tracking-tight mb-4 text-center">
             Start Your Journey
           </Text>
           <Text className="text-gray-400 text-lg font-medium text-center max-w-md leading-relaxed">
             Join thousands of users tracking their macros and hitting their fitness goals seamlessly.
           </Text>
        </View>

        {/* Right Side: Form */}
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="px-7 py-10 max-w-lg w-full mx-auto">
            {/* Header */}
            <View className="flex-row items-center mb-10">
              <TouchableOpacity
                onPress={() => router.back()}
                className="w-10 h-10 rounded-xl bg-[#1a1f2e] items-center justify-center mr-4"
              >
                <Ionicons name="arrow-back" size={20} color="#9ca3af" />
              </TouchableOpacity>
              <View className="flex-1">
                <Text className="text-white text-3xl font-extrabold">
                  Join Us
                </Text>
                <Text className="text-gray-500 text-base mt-1">
                  Create an account to get started
                </Text>
              </View>
            </View>

            {/* Error */}
            {error ? (
              <View className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3.5 mb-5 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#f87171" style={{ marginRight: 8 }} />
                <Text className="text-red-400 text-sm flex-1">{error}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              value={form.name}
              onChangeText={(v) => updateField('name', v)}
              placeholder="Junaed"
              icon="person-outline"
            />

            <Input
              label="Email Address"
              value={form.email}
              onChangeText={(v) => updateField('email', v)}
              placeholder="junaed@gmail.com"
              keyboardType="email-address"
              icon="mail-outline"
            />

            <Input
              label="Password"
              value={form.password}
              onChangeText={(v) => updateField('password', v)}
              placeholder="Min 6 characters"
              secureTextEntry
              icon="lock-closed-outline"
            />

            <View className="mt-4">
              <Button
                title="Create Account"
                onPress={handleRegister}
                loading={loading}
                icon="person-add-outline"
              />
            </View>

            {/* Login link */}
            <View className="flex-row justify-center mt-10">
              <Text className="text-gray-500">Already have an account? </Text>
              <TouchableOpacity onPress={() => router.replace('/login')}>
                 <Text className="text-[#818cf8] font-bold">Sign In</Text>
              </TouchableOpacity>
            </View>

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
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}
