import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: keyof typeof Ionicons.glyphMap;
}

export default function Button({
  title,
  onPress,
  loading = false,
  variant = 'primary',
  icon,
}: ButtonProps) {
  const variantStyles = {
    primary: 'bg-[#6366f1] shadow-lg shadow-indigo-500/30',
    secondary: 'bg-[#1a1f2e] border border-[#2a3040]',
    danger: 'bg-[#ef4444]/90',
  };

  const textStyles = {
    primary: 'text-white',
    secondary: 'text-gray-300',
    danger: 'text-white',
  };

  const iconColor = {
    primary: '#fff',
    secondary: '#9ca3af',
    danger: '#fff',
  };

  return (
    <TouchableOpacity
      className={`rounded-2xl py-4 px-6 flex-row items-center justify-center mt-3 ${variantStyles[variant]}`}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View className="flex-row items-center">
          {icon && (
            <Ionicons
              name={icon}
              size={20}
              color={iconColor[variant]}
              style={{ marginRight: 8 }}
            />
          )}
          <Text className={`font-bold text-base ${textStyles[variant]}`}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}
