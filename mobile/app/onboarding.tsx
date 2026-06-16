import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import GlassBackground from '../components/GlassBackground';
import Input from '../components/Input';
import Button from '../components/Button';
import { updateProfile } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function OnboardingScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const [form, setForm] = useState({
    age: '25',
    gender: 'male',
    height_cm: '170',
    weight_kg: '70',
    goal: 'maintain',
    activity_level: 'sedentary',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, speed: 14, bounciness: 6, useNativeDriver: true }),
    ]).start();
  }, []);

  const updateField = (field: keyof typeof form, value: string) => {
    setForm(p => ({ ...p, [field]: value }));
  };

  const handleFinish = async () => {
    setError('');
    const ageNum = parseInt(form.age, 10);
    const heightNum = parseFloat(form.height_cm);
    const weightNum = parseFloat(form.weight_kg);

    if (isNaN(ageNum) || ageNum <= 0) return setError('Please enter a valid age.');
    if (isNaN(heightNum) || heightNum <= 0) return setError('Please enter a valid height.');
    if (isNaN(weightNum) || weightNum <= 0) return setError('Please enter a valid weight.');

    setLoading(true);
    try {
      await updateProfile({
        age: ageNum,
        gender: form.gender,
        height_cm: heightNum,
        weight_kg: weightNum,
        goal: form.goal,
        activity_level: form.activity_level,
      });
      router.replace('/(tabs)/home');
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to save profile details.');
    } finally {
      setLoading(false);
    }
  };

  const GoalOptions = [
    { label: 'Lose Weight (Slow)', value: 'lose_slow' },
    { label: 'Lose Weight (Aggressive)', value: 'lose_aggressive' },
    { label: 'Maintain Weight', value: 'maintain' },
    { label: 'Gain Weight', value: 'gain' },
  ];

  const ActivityOptions = [
    { label: 'Sedentary (Little/no exercise)', value: 'sedentary' },
    { label: 'Lightly Active (1-3 days/wk)', value: 'lightly_active' },
    { label: 'Moderately Active (3-5 days/wk)', value: 'moderately_active' },
    { label: 'Very Active (6-7 days/wk)', value: 'very_active' },
    { label: 'Extra Active (Physical job)', value: 'extra_active' },
  ];

  return (
    <GlassBackground>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView style={styles.flex} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View
            style={[
              styles.card,
              { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.6)' },
              { borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.4)' },
              { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
            ]}
          >
            <Text style={[styles.heading, { color: theme.text }]}>Let's personalize your plan</Text>
            <Text style={[styles.subheading, { color: theme.textSecondary }]}>We need a few details to calculate your daily goals.</Text>

            {error ? (
              <View style={[styles.errorBanner, { backgroundColor: theme.errorSurface, borderColor: theme.errorBorder }]}>
                <Ionicons name="alert-circle" size={16} color={theme.error} style={{ marginRight: 8 }} />
                <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Age"
              value={form.age}
              onChangeText={(v) => updateField('age', v)}
              keyboardType="numeric"
              placeholder="e.g. 25"
            />
            
            <Text style={[styles.label, { color: theme.text }]}>Gender</Text>
            <View style={styles.row}>
              <TouchableOpacity 
                style={[styles.chip, form.gender === 'male' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }]} 
                onPress={() => updateField('gender', 'male')}
              >
                <Text style={{ color: form.gender === 'male' ? '#fff' : theme.text }}>Male</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.chip, form.gender === 'female' ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: theme.border }]} 
                onPress={() => updateField('gender', 'female')}
              >
                <Text style={{ color: form.gender === 'female' ? '#fff' : theme.text }}>Female</Text>
              </TouchableOpacity>
            </View>

            <Input
              label="Height (cm)"
              value={form.height_cm}
              onChangeText={(v) => updateField('height_cm', v)}
              keyboardType="numeric"
              placeholder="e.g. 170"
            />

            <Input
              label="Weight (kg)"
              value={form.weight_kg}
              onChangeText={(v) => updateField('weight_kg', v)}
              keyboardType="numeric"
              placeholder="e.g. 70"
            />

            <Text style={[styles.label, { color: theme.text }]}>Your Goal</Text>
            {GoalOptions.map(opt => (
              <TouchableOpacity 
                key={opt.value}
                style={[styles.optionBtn, form.goal === opt.value ? { borderColor: theme.primary, backgroundColor: theme.primarySurface } : { borderColor: theme.border }]}
                onPress={() => updateField('goal', opt.value)}
              >
                <Text style={{ color: form.goal === opt.value ? theme.primary : theme.text, fontWeight: '500' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            <Text style={[styles.label, { color: theme.text, marginTop: 16 }]}>Activity Level</Text>
            {ActivityOptions.map(opt => (
              <TouchableOpacity 
                key={opt.value}
                style={[styles.optionBtn, form.activity_level === opt.value ? { borderColor: theme.primary, backgroundColor: theme.primarySurface } : { borderColor: theme.border }]}
                onPress={() => updateField('activity_level', opt.value)}
              >
                <Text style={{ color: form.activity_level === opt.value ? theme.primary : theme.text, fontWeight: '500' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}

            <View style={{ marginTop: 24 }}>
              <Button title="Complete Setup" onPress={handleFinish} loading={loading} />
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: 40,
  },
  card: {
    padding: 24,
    borderRadius: 32,
    borderWidth: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
  },
  heading: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
  },
  subheading: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  optionBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
