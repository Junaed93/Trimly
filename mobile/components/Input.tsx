import React from 'react';
import { TextInput, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface InputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function Input({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  icon,
}: InputProps) {
  return (
    <View className="mb-5">
      <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">
        {label}
      </Text>
      <View className="flex-row items-center bg-[#1a1f2e] border border-[#2a3040] rounded-2xl px-4">
        {icon && (
          <Ionicons name={icon} size={20} color="#6366f1" style={{ marginRight: 12 }} />
        )}
        <TextInput
          className="flex-1 text-white py-4 text-base"
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#4a5568"
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}
