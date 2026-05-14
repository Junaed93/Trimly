import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Input from '../components/Input';
import { getProfile, updateProfile, removeToken } from '../services/api';

interface UserProfile {
  id: number;
  name: string;
  email: string;
  age: number | null;
  gender: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  goal: string | null;
  daily_calorie_target: number | null;
  created_at: string;
}

const GOALS = [
  { key: 'lose_slow', label: 'Lose (Slow)', icon: 'flame-outline' as const, desc: '-500 kcal / day' },
  { key: 'lose_aggressive', label: 'Lose (Aggressive)', icon: 'flash-outline' as const, desc: '-800 kcal / day' },
  { key: 'maintain', label: 'Maintain', icon: 'fitness-outline' as const, desc: 'Maintenance' },
  { key: 'gain', label: 'Gain Muscle', icon: 'barbell-outline' as const, desc: '+300 kcal / day' },
];

const GENDERS = [
  { key: 'male', label: 'Male', icon: 'male-outline' as const },
  { key: 'female', label: 'Female', icon: 'female-outline' as const },
];

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // State for Setup Mode
  const [isEditing, setIsEditing] = useState(false);
  
  // Independent Unit System States
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');
  
  // Form State
  const [formAge, setFormAge] = useState('');
  const [formGender, setFormGender] = useState('male');
  const [formHeightCm, setFormHeightCm] = useState('');
  const [formHeightFt, setFormHeightFt] = useState('');
  const [formHeightIn, setFormHeightIn] = useState('');
  const [formWeightKg, setFormWeightKg] = useState('');
  const [formWeightLbs, setFormWeightLbs] = useState('');
  const [formGoal, setFormGoal] = useState('maintain');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getProfile();
      setProfile(res.data);
      if (!res.data.daily_calorie_target) {
        setIsEditing(true);
      } else {
        setFormAge(res.data.age.toString());
        setFormGender(res.data.gender);
        setFormGoal(res.data.goal);
        setFormHeightCm(res.data.height_cm.toString());
        setFormWeightKg(res.data.weight_kg.toString());
        
        const totalInches = res.data.height_cm / 2.54;
        setFormHeightFt(Math.floor(totalInches / 12).toString());
        setFormHeightIn(Math.round(totalInches % 12).toString());
        setFormWeightLbs(Math.round(res.data.weight_kg * 2.20462).toString());
      }
    } catch (err: any) {
      setError('Failed to load profile');
      if (err.response?.status === 401) {
        await removeToken();
        router.replace('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await removeToken();
    router.replace('/login');
  };

  const handleSaveStats = async () => {
    setError('');
    let finalHeightCm = 0;
    let finalWeightKg = 0;
    
    if (heightUnit === 'cm') {
      if (!formHeightCm) { setError('Please fill in your height (cm)'); return; }
      finalHeightCm = parseFloat(formHeightCm);
    } else {
      if (!formHeightFt || !formHeightIn) { setError('Please fill in your height (ft/in)'); return; }
      const totalInches = (parseInt(formHeightFt) * 12) + parseInt(formHeightIn);
      finalHeightCm = totalInches * 2.54;
    }

    if (weightUnit === 'kg') {
      if (!formWeightKg) { setError('Please fill in your weight (kg)'); return; }
      finalWeightKg = parseFloat(formWeightKg);
    } else {
      if (!formWeightLbs) { setError('Please fill in your weight (lbs)'); return; }
      finalWeightKg = parseFloat(formWeightLbs) / 2.20462;
    }

    if (!formAge) { setError('Please provide your age'); return; }

    setSaving(true);
    try {
      const payload = {
        age: parseInt(formAge),
        gender: formGender,
        height_cm: Number(finalHeightCm.toFixed(1)),
        weight_kg: Number(finalWeightKg.toFixed(1)),
        goal: formGoal
      };
      
      const res = await updateProfile(payload);
      setProfile((prev) => prev ? { ...prev, ...payload, daily_calorie_target: res.data.daily_calorie_target } : null);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update stats');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View className="flex-1 bg-[#0d1117] items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  // ==== SETUP / EDIT MODE ====
  if (isEditing) {
    return (
      <KeyboardAvoidingView className="flex-1 bg-[#0d1117]" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <View className="px-7 pt-16 max-w-2xl w-full mx-auto">
            <View className="mb-6 flex-row items-center justify-between">
              <View>
                <Text className="text-white text-3xl font-extrabold mb-1">
                  {profile?.daily_calorie_target ? 'Edit Stats' : 'Welcome!'}
                </Text>
                <Text className="text-gray-500 text-base">
                  {profile?.daily_calorie_target ? 'Update your body stats' : 'Let\'s calculate your target calories'}
                </Text>
              </View>
              {profile?.daily_calorie_target && (
                <TouchableOpacity onPress={() => setIsEditing(false)} className="w-10 h-10 bg-[#1a1f2e] rounded-full items-center justify-center">
                  <Ionicons name="close" size={24} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {error ? (
              <View className="bg-red-500/10 border border-red-500/30 rounded-2xl px-4 py-3.5 mb-5 flex-row items-center">
                <Ionicons name="alert-circle" size={18} color="#f87171" style={{ marginRight: 8 }} />
                <Text className="text-red-400 text-sm flex-1">{error}</Text>
              </View>
            ) : null}

            <View className="md:flex-row md:gap-6">
              <View className="md:flex-1">
                <Input label="Age" value={formAge} onChangeText={setFormAge} placeholder="22" keyboardType="numeric" icon="calendar-outline" />
              </View>
              <View className="md:flex-1">
                <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 ml-1">Gender</Text>
                <View className="flex-row gap-3 mb-2">
                  {GENDERS.map(g => (
                    <TouchableOpacity key={g.key} onPress={() => setFormGender(g.key)}
                      className={`flex-1 py-4 rounded-2xl border flex-row justify-center ${formGender === g.key ? 'bg-[#6366f1]/15 border-[#6366f1]/50' : 'bg-[#1a1f2e] border-[#2a3040]'}`}>
                      <Ionicons name={g.icon} size={20} color={formGender === g.key ? '#818cf8' : '#6b7280'} style={{ marginRight: 8 }} />
                      <Text className={`font-bold ${formGender === g.key ? 'text-[#818cf8]' : 'text-gray-500'}`}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View className="md:flex-row md:gap-6">
              <View className="md:flex-1">
                <View className="flex-row items-center justify-between mb-2 mt-4 md:mt-0">
                  <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider ml-1">Height</Text>
                  <View className="flex-row bg-[#1a1f2e] rounded-lg border border-[#2a3040] overflow-hidden">
                    <TouchableOpacity onPress={() => setHeightUnit('cm')} className={`px-4 py-1.5 ${heightUnit === 'cm' ? 'bg-[#6366f1]' : ''}`}>
                       <Text className={`text-xs font-bold ${heightUnit === 'cm' ? 'text-white' : 'text-gray-500'}`}>cm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setHeightUnit('ft')} className={`px-4 py-1.5 ${heightUnit === 'ft' ? 'bg-[#6366f1]' : ''}`}>
                       <Text className={`text-xs font-bold ${heightUnit === 'ft' ? 'text-white' : 'text-gray-500'}`}>ft/in</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {heightUnit === 'cm' ? (
                  <Input label="" value={formHeightCm} onChangeText={setFormHeightCm} keyboardType="numeric" icon="resize-outline" placeholder="178" />
                ) : (
                  <View className="flex-row gap-3 mb-5">
                    <View className="flex-1"><Input label="" value={formHeightFt} onChangeText={setFormHeightFt} keyboardType="numeric" placeholder="Feet" icon="resize-outline" /></View>
                    <View className="flex-1"><Input label="" value={formHeightIn} onChangeText={setFormHeightIn} keyboardType="numeric" placeholder="Inches" /></View>
                  </View>
                )}
              </View>

              <View className="md:flex-1">
                <View className="flex-row items-center justify-between mb-2 mt-2 md:mt-0">
                  <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider ml-1">Weight</Text>
                  <View className="flex-row bg-[#1a1f2e] rounded-lg border border-[#2a3040] overflow-hidden">
                    <TouchableOpacity onPress={() => setWeightUnit('kg')} className={`px-4 py-1.5 ${weightUnit === 'kg' ? 'bg-[#6366f1]' : ''}`}>
                       <Text className={`text-xs font-bold ${weightUnit === 'kg' ? 'text-white' : 'text-gray-500'}`}>kg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setWeightUnit('lbs')} className={`px-4 py-1.5 ${weightUnit === 'lbs' ? 'bg-[#6366f1]' : ''}`}>
                       <Text className={`text-xs font-bold ${weightUnit === 'lbs' ? 'text-white' : 'text-gray-500'}`}>lbs</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {weightUnit === 'kg' ? (
                  <Input label="" value={formWeightKg} onChangeText={setFormWeightKg} keyboardType="numeric" icon="scale-outline" placeholder="83" />
                ) : (
                  <Input label="" value={formWeightLbs} onChangeText={setFormWeightLbs} keyboardType="numeric" icon="scale-outline" placeholder="185" />
                )}
              </View>
            </View>

            {/* Goals Section */}
            <Text className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-2 ml-1 mt-2">Fitness Goal</Text>
            <View className="flex-row flex-wrap gap-3 mb-8">
              {GOALS.map(g => (
                <TouchableOpacity key={g.key} onPress={() => setFormGoal(g.key)}
                  className={`w-[48%] md:w-[23%] flex-grow py-5 rounded-2xl items-center border ${formGoal === g.key ? 'bg-[#6366f1]/15 border-[#6366f1]/50' : 'bg-[#1a1f2e] border-[#2a3040]'}`}>
                  <Ionicons name={g.icon} size={28} color={formGoal === g.key ? '#818cf8' : '#6b7280'} />
                  <Text className={`font-bold text-sm mt-2 text-center ${formGoal === g.key ? 'text-[#818cf8]' : 'text-gray-500'}`}>{g.label}</Text>
                  <Text className={`text-xs mt-1 text-center ${formGoal === g.key ? 'text-[#a5b4fc]' : 'text-gray-600'}`}>{g.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Calculate Target" onPress={handleSaveStats} loading={saving} icon="calculator-outline" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // ==== DASHBOARD MODE ====
  const goalDetails = {
    lose_slow: { icon: 'flame', color: '#f59e0b', label: 'Lose Weight (Slow)' },
    lose_aggressive: { icon: 'flash', color: '#ef4444', label: 'Lose Weight (Aggressive)' },
    maintain: { icon: 'fitness', color: '#10b981', label: 'Maintain Weight' },
    gain: { icon: 'barbell', color: '#3b82f6', label: 'Gain Muscle' },
  };

  const userGoal = profile?.goal ? goalDetails[profile.goal as keyof typeof goalDetails] : goalDetails.maintain;

  return (
    <ScrollView className="flex-1 bg-[#0d1117]" contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header NavBar */}
      <View className="bg-[#1a1f2e] border-b border-[#2a3040] pt-14 pb-4 px-7 flex-row items-center justify-between shadow-lg">
         <View className="flex-row items-center">
            <Ionicons name="fitness" size={28} color="#6366f1" />
            <Text className="text-white text-xl font-bold ml-2">FitTrack<Text className="text-[#6366f1]">BD</Text></Text>
         </View>
         <TouchableOpacity className="flex-row items-center bg-[#ef4444]/10 px-4 py-2 rounded-xl border border-[#ef4444]/20" onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
            <Text className="text-[#ef4444] font-bold text-sm">Logout</Text>
         </TouchableOpacity>
      </View>

      <View className="px-7 pt-8 max-w-6xl mx-auto w-full">
        {/* Welcome Text */}
        <View className="mb-8">
           <Text className="text-gray-400 text-sm font-semibold uppercase tracking-wider mb-1">Dashboard</Text>
           <Text className="text-white text-3xl font-extrabold">Hello, {profile?.name}</Text>
        </View>

        <View className="md:flex-row md:gap-6">
          {/* Main Content - Calorie Target */}
          <View className="md:w-2/3">
            <View className="bg-gradient-to-br from-[#1a1f2e] to-[#0f1422] border border-[#6366f1]/30 rounded-3xl p-8 items-center mb-6 shadow-2xl shadow-[#6366f1]/10">
              <View className="flex-row items-center mb-4">
                 <View className="w-10 h-10 rounded-full bg-[#6366f1]/20 items-center justify-center mr-3">
                    <Ionicons name="nutrition-outline" size={20} color="#818cf8" />
                 </View>
                 <Text className="text-gray-400 text-base font-bold uppercase tracking-wider">Your Daily Target</Text>
              </View>
              
              <Text className="text-white text-7xl font-extrabold mb-2">
                {profile?.daily_calorie_target}
              </Text>
              <Text className="text-[#818cf8] text-lg font-medium mb-8">kcal / day</Text>
              
              <View className="w-full h-px bg-[#2a3040] mb-6" />

              <View className="flex-row items-center justify-center w-full bg-[#6366f1]/10 py-4 rounded-2xl">
                 <Ionicons name={userGoal?.icon as any} size={20} color={userGoal?.color} style={{ marginRight: 8 }} />
                 <Text className="text-white font-bold text-base">Goal: {userGoal?.label}</Text>
              </View>
            </View>
          </View>

          {/* Sidebar - Body Stats */}
          <View className="md:w-1/3">
            <View className="flex-row items-center justify-between mb-4 mt-2 md:mt-0">
                <View className="flex-row items-center">
                  <Ionicons name="stats-chart-outline" size={18} color="#6366f1" style={{ marginRight: 8 }} />
                  <Text className="text-gray-400 text-xs font-bold uppercase tracking-wider">Body Statistics</Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditing(true)} className="flex-row items-center bg-[#1a1f2e] px-3 py-1.5 rounded-lg border border-[#2a3040]">
                   <Ionicons name="pencil-outline" size={14} color="#a5b4fc" style={{ marginRight: 4 }} />
                   <Text className="text-[#a5b4fc] text-xs font-bold uppercase">Edit</Text>
                </TouchableOpacity>
            </View>

            <View className="bg-[#1a1f2e] border border-[#2a3040] rounded-3xl p-5 mb-8">
              <InfoRow icon="resize-outline" label="Height" value={`${profile?.height_cm} cm`} />
              <InfoRow icon="scale-outline" label="Weight" value={`${profile?.weight_kg} kg`} />
              <InfoRow icon="calendar-outline" label="Age" value={`${profile?.age} years`} />
              <InfoRow icon="male-female-outline" label="Gender" value={profile?.gender || '-'} capitalize />
            </View>
          </View>
        </View>

      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value, capitalize = false }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string; capitalize?: boolean }) {
  return (
    <View className="flex-row justify-between items-center py-4 px-2 border-b border-[#2a3040] last:border-b-0">
      <View className="flex-row items-center">
        <View className="w-8 h-8 rounded-full bg-[#2a3040]/50 items-center justify-center mr-3">
          <Ionicons name={icon} size={16} color="#9ca3af" />
        </View>
        <Text className="text-gray-400 text-sm font-medium">{label}</Text>
      </View>
      <Text className={`text-white text-base font-bold tracking-tight ${capitalize ? 'capitalize' : ''}`}>
        {value}
      </Text>
    </View>
  );
}
