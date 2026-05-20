import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Animated,
  Easing,
  useWindowDimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Button from '../../components/Button';
import Input from '../../components/Input';
import GlassBackground from '../../components/GlassBackground';
import { getProfile, updateProfile, removeToken } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { getUserStats, saveUserStats } from '../../services/userStatsStorage';

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

// Circular Progress Component
const CircularProgress = ({ progress, size, strokeWidth, color, backgroundColor, children }: any) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: backgroundColor }} />
      <View style={{ position: 'absolute', width: size, height: size, borderRadius: size / 2, borderWidth: strokeWidth, borderColor: color, borderLeftColor: 'transparent', borderBottomColor: 'transparent', transform: [{ rotate: '-45deg' }] }} />
      {children}
    </View>
  );
};

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const isMobileLayout = width < 768;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const [isEditing, setIsEditing] = useState(false);
  const [heightUnit, setHeightUnit] = useState<'cm' | 'ft'>('cm');
  const [weightUnit, setWeightUnit] = useState<'kg' | 'lbs'>('kg');

  const [form, setForm] = useState({
    age: '', gender: 'male', goal: 'maintain',
    heightCm: '', heightFt: '', heightIn: '',
    weightKg: '', weightLbs: '', initialWeightKg: '', targetWeightKg: ''
  });
  const [formErrors, setFormErrors] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const ringAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchProfile();
  }, []);

  useEffect(() => {
    if (profile?.daily_calorie_target && !isEditing) {
      Animated.timing(ringAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    } else {
      ringAnim.setValue(0);
    }
  }, [profile?.daily_calorie_target, isEditing]);

  const fetchProfile = async () => {
    try {
      const [res, stats] = await Promise.all([getProfile(), getUserStats()]);
      setProfile(res.data);
      if (!res.data.daily_calorie_target) {
        setIsEditing(true);
      } else {
        populateForm(res.data, stats);
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

  const populateForm = (data: UserProfile, stats?: any) => {
    const totalInches = (data.height_cm || 0) / 2.54;
    setForm({
      age: data.age?.toString() || '',
      gender: data.gender || 'male',
      goal: data.goal || 'maintain',
      heightCm: data.height_cm?.toString() || '',
      heightFt: Math.floor(totalInches / 12).toString(),
      heightIn: Math.round(totalInches % 12).toString(),
      weightKg: data.weight_kg?.toString() || '',
      weightLbs: Math.round((data.weight_kg || 0) * 2.20462).toString(),
      initialWeightKg: stats?.initialWeight?.toString() || '',
      targetWeightKg: stats?.targetWeight?.toString() || ''
    });
  };

  const handleLogout = async () => {
    await removeToken();
    router.replace('/login');
  };

  const validateForm = () => {
    const errs: any = {};
    let finalHeightCm = 0;
    let finalWeightKg = 0;

    if (heightUnit === 'cm') {
      if (!form.heightCm) errs.heightCm = 'Required';
      else finalHeightCm = parseFloat(form.heightCm);
    } else {
      if (!form.heightFt || !form.heightIn) errs.heightFt = 'Required';
      else finalHeightCm = ((parseInt(form.heightFt) * 12) + parseInt(form.heightIn)) * 2.54;
    }

    if (weightUnit === 'kg') {
      if (!form.weightKg) errs.weightKg = 'Required';
      else finalWeightKg = parseFloat(form.weightKg);
    } else {
      if (!form.weightLbs) errs.weightLbs = 'Required';
      else finalWeightKg = parseFloat(form.weightLbs) / 2.20462;
    }

    if (!form.age) errs.age = 'Required';
    else if (parseInt(form.age) < 15 || parseInt(form.age) > 100) errs.age = 'Must be 15-100';

    setFormErrors(errs);
    return Object.keys(errs).length === 0 ? { finalHeightCm, finalWeightKg } : null;
  };

  const handleSaveStats = async () => {
    setError('');
    setSuccessMsg('');
    const validData = validateForm();
    if (!validData) return;

    setSaving(true);
    try {
      const payload = {
        age: parseInt(form.age),
        gender: form.gender,
        height_cm: Number(validData.finalHeightCm.toFixed(1)),
        weight_kg: Number(validData.finalWeightKg.toFixed(1)),
        goal: form.goal
      };

      await saveUserStats({
        initialWeight: form.initialWeightKg ? parseFloat(form.initialWeightKg) : null,
        targetWeight: form.targetWeightKg ? parseFloat(form.targetWeightKg) : null
      });
      const res = await updateProfile(payload);
      setProfile((prev) => prev ? { ...prev, ...payload, daily_calorie_target: res.data.daily_calorie_target } : null);
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update stats');
    } finally {
      setSaving(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const calculateBMI = (cm: number, kg: number) => {
    const m = cm / 100;
    return (kg / (m * m)).toFixed(1);
  };

  const formatHeight = (cm: number | null) => {
    if (!cm) return '-';
    const rounded = Math.round(cm * 10) / 10;
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  };

  const formatWeight = (kg: number | null) => {
    if (!kg) return '-';
    const rounded = Math.round(kg * 10) / 10;
    return rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toFixed(1);
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.accent} />
      </View>
    );
  }

  if (isEditing) {
    return (
      <GlassBackground>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollPad} keyboardShouldPersistTaps="handled">
          <View style={styles.contentMax}>
            <View style={styles.editHeaderRow}>
              <View>
                <Text style={[styles.title, { color: theme.text }]}>{profile?.daily_calorie_target ? 'Edit Stats' : 'Welcome!'}</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{profile?.daily_calorie_target ? 'Update your body stats' : "Let's calculate your target calories"}</Text>
              </View>
              {profile?.daily_calorie_target && (
                <TouchableOpacity onPress={() => { setIsEditing(false); if (profile) getUserStats().then(stats => populateForm(profile, stats)); }} style={[styles.closeBtn, { backgroundColor: theme.surface }]}>
                  <Ionicons name="close" size={24} color={theme.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {error ? (
              <View style={[styles.alertBanner, { backgroundColor: theme.errorSurface, borderColor: theme.errorBorder }]}>
                <Ionicons name="alert-circle" size={18} color={theme.error} style={{ marginRight: 8 }} />
                <Text style={[styles.alertText, { color: theme.error }]}>{error}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: isMobileLayout ? 'column' : 'row', gap: isMobileLayout ? 0 : 24 }}>
              <View style={styles.flex}>
                <Input label="Age" value={form.age} onChangeText={(v) => setForm({ ...form, age: v })} keyboardType="numeric" icon="calendar-outline" error={formErrors.age} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.labelSm, { color: theme.textMuted }]}>Gender</Text>
                <View style={styles.toggleRow}>
                  {GENDERS.map(g => (
                    <TouchableOpacity key={g.key} onPress={() => setForm({ ...form, gender: g.key })}
                      style={[styles.toggleBtn, { backgroundColor: form.gender === g.key ? theme.accentSurface : theme.surface, borderColor: form.gender === g.key ? theme.accentBorder : theme.border }]}>
                      <Ionicons name={g.icon} size={20} color={form.gender === g.key ? theme.accentLight : theme.textMuted} style={{ marginRight: 8 }} />
                      <Text style={[styles.toggleText, { color: form.gender === g.key ? theme.accentLight : theme.textSecondary }]}>{g.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ flexDirection: isMobileLayout ? 'column' : 'row', gap: isMobileLayout ? 0 : 24 }}>
              <View style={styles.flex}>
                <View style={styles.unitHeader}>
                  <Text style={[styles.labelSm, { color: theme.textMuted }]}>Height</Text>
                  <View style={[styles.unitSwitch, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={() => setHeightUnit('cm')} style={[styles.unitOption, heightUnit === 'cm' && { backgroundColor: theme.accent }]}>
                       <Text style={[styles.unitText, { color: heightUnit === 'cm' ? '#fff' : theme.textSecondary }]}>cm</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setHeightUnit('ft')} style={[styles.unitOption, heightUnit === 'ft' && { backgroundColor: theme.accent }]}>
                       <Text style={[styles.unitText, { color: heightUnit === 'ft' ? '#fff' : theme.textSecondary }]}>ft/in</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {heightUnit === 'cm' ? (
                  <Input label="" value={form.heightCm} onChangeText={(v) => setForm({ ...form, heightCm: v })} keyboardType="numeric" icon="resize-outline" placeholder="178" error={formErrors.heightCm} />
                ) : (
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={styles.flex}><Input label="" value={form.heightFt} onChangeText={(v) => setForm({ ...form, heightFt: v })} keyboardType="numeric" placeholder="Feet" icon="resize-outline" error={formErrors.heightFt} /></View>
                    <View style={styles.flex}><Input label="" value={form.heightIn} onChangeText={(v) => setForm({ ...form, heightIn: v })} keyboardType="numeric" placeholder="Inches" /></View>
                  </View>
                )}
              </View>

              <View style={styles.flex}>
                <View style={styles.unitHeader}>
                  <Text style={[styles.labelSm, { color: theme.textMuted }]}>Weight</Text>
                  <View style={[styles.unitSwitch, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={() => setWeightUnit('kg')} style={[styles.unitOption, weightUnit === 'kg' && { backgroundColor: theme.accent }]}>
                       <Text style={[styles.unitText, { color: weightUnit === 'kg' ? '#fff' : theme.textSecondary }]}>kg</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setWeightUnit('lbs')} style={[styles.unitOption, weightUnit === 'lbs' && { backgroundColor: theme.accent }]}>
                       <Text style={[styles.unitText, { color: weightUnit === 'lbs' ? '#fff' : theme.textSecondary }]}>lbs</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                {weightUnit === 'kg' ? (
                  <Input label="" value={form.weightKg} onChangeText={(v) => setForm({ ...form, weightKg: v })} keyboardType="numeric" icon="scale-outline" placeholder="83" error={formErrors.weightKg} />
                ) : (
                  <Input label="" value={form.weightLbs} onChangeText={(v) => setForm({ ...form, weightLbs: v })} keyboardType="numeric" icon="scale-outline" placeholder="185" error={formErrors.weightLbs} />
                )}
              </View>
            </View>

            <View style={{ flexDirection: isMobileLayout ? 'column' : 'row', gap: isMobileLayout ? 0 : 24 }}>
               <View style={styles.flex}>
                 <Input label="Initial Weight (kg)" value={form.initialWeightKg} onChangeText={(v) => setForm({ ...form, initialWeightKg: v })} keyboardType="numeric" icon="speedometer-outline" placeholder="Your starting weight" />
               </View>
               <View style={styles.flex}>
                 <Input label="Goal Weight (kg)" value={form.targetWeightKg} onChangeText={(v) => setForm({ ...form, targetWeightKg: v })} keyboardType="numeric" icon="flag-outline" placeholder="Your goal weight" />
               </View>
            </View>

            <Text style={[styles.labelSm, { color: theme.textMuted, marginTop: 8 }]}>Fitness Goal</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
              {GOALS.map(g => (
                <TouchableOpacity key={g.key} onPress={() => setForm({ ...form, goal: g.key })}
                  style={[styles.goalBtn, { width: isMobileLayout ? '48%' : '23%', backgroundColor: form.goal === g.key ? theme.accentSurface : theme.surface, borderColor: form.goal === g.key ? theme.accentBorder : theme.border }]}>
                  <Ionicons name={g.icon} size={28} color={form.goal === g.key ? theme.accentLight : theme.textMuted} />
                  <Text style={[styles.goalLabel, { color: form.goal === g.key ? theme.accentLight : theme.textSecondary }]}>{g.label}</Text>
                  <Text style={[styles.goalDesc, { color: form.goal === g.key ? theme.accent : theme.textMuted }]}>{g.desc}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Button title="Save & Calculate" onPress={handleSaveStats} loading={saving} icon="calculator-outline" />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      </GlassBackground>
    );
  }

  // ==== DASHBOARD MODE ====
  const goalDetails = {
    lose_slow: { icon: 'flame', color: theme.warning, label: 'Lose Weight (Slow)' },
    lose_aggressive: { icon: 'flash', color: theme.error, label: 'Lose Weight (Aggressive)' },
    maintain: { icon: 'fitness', color: theme.success, label: 'Maintain Weight' },
    gain: { icon: 'barbell', color: theme.accentLight, label: 'Gain Muscle' },
  };

  const userGoal = profile?.goal ? goalDetails[profile.goal as keyof typeof goalDetails] : goalDetails.maintain;

  return (
    <GlassBackground>
      <View style={styles.flex}>
      {/* Header NavBar */}
      <View style={[styles.navBar, { borderBottomColor: 'transparent' }]}>
         <View style={styles.navBrand}>
            <Ionicons name="fitness" size={28} color={theme.accent} />
            <Text style={[styles.navTitle, { color: theme.text }]}>FitTrack<Text style={{ color: theme.accent }}>BD</Text></Text>
         </View>
         <View style={{ flexDirection: 'row', gap: 12 }}>
           <TouchableOpacity onPress={toggleTheme} style={[styles.iconBtnNav, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]} accessibilityLabel="Toggle theme">
             <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.textSecondary} />
           </TouchableOpacity>
           <TouchableOpacity onPress={handleLogout} style={[styles.iconBtnNav, { backgroundColor: 'rgba(239, 68, 68, 0.1)', borderColor: 'rgba(239, 68, 68, 0.2)' }]} accessibilityLabel="Logout">
             <Ionicons name="log-out-outline" size={20} color={theme.error} />
           </TouchableOpacity>
         </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollPad}>
        <View style={styles.contentMaxLg}>
          {successMsg ? (
            <View style={[styles.alertBanner, { backgroundColor: theme.successSurface, borderColor: theme.success, marginBottom: 20 }]}>
              <Ionicons name="checkmark-circle" size={18} color={theme.success} style={{ marginRight: 8 }} />
              <Text style={[styles.alertText, { color: theme.success }]}>{successMsg}</Text>
            </View>
          ) : null}

          <View style={{ marginBottom: 32 }}>
             <Text style={[styles.labelSm, { color: theme.textMuted }]}>{getGreeting()}</Text>
             <Text style={[styles.title, { color: theme.text }]}>{profile?.name}</Text>
          </View>

          {/* Calorie Target Card */}
          <View style={{ marginBottom: 24 }}>
            <View style={[styles.targetCard, { backgroundColor: 'rgba(255, 255, 255, 0.1)', borderColor: 'rgba(255, 255, 255, 0.2)' }]}>
              <View style={styles.targetHeader}>
                 <View style={[styles.iconBox, { backgroundColor: theme.accentSurface }]}>
                    <Ionicons name="nutrition-outline" size={20} color={theme.accentLight} />
                 </View>
                 <Text style={[styles.labelSm, { color: theme.textMuted, marginTop: 0 }]}>Your Daily Target</Text>
              </View>
              
              <Animated.Text style={[styles.calorieText, { color: theme.text }]}>
                {profile?.daily_calorie_target}
              </Animated.Text>
              <Text style={[styles.calorieUnit, { color: theme.accentLight }]}>kcal / day</Text>
              
              <View style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />

              <View style={[styles.goalBanner, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
                 <Ionicons name={userGoal?.icon as any} size={20} color={userGoal?.color} style={{ marginRight: 8 }} />
                 <Text style={[styles.goalBannerText, { color: theme.text }]}>Goal: {userGoal?.label}</Text>
              </View>
            </View>
          </View>

          {/* Body Statistics Card */}
          <View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="stats-chart-outline" size={18} color={theme.accent} style={{ marginRight: 8 }} />
                  <Text style={[styles.labelSm, { color: theme.textMuted, marginTop: 0 }]}>Body Statistics</Text>
                </View>
                <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.editBtn, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                   <Ionicons name="pencil-outline" size={14} color={theme.accentLight} style={{ marginRight: 4 }} />
                   <Text style={[styles.editBtnText, { color: theme.accentLight }]}>Edit</Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.statsCard, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)', marginBottom: 24 }]}>
              <InfoRow icon="resize-outline" label="Height" value={`${formatHeight(profile?.height_cm)} cm`} theme={theme} />
              <InfoRow icon="scale-outline" label="Weight" value={`${formatWeight(profile?.weight_kg)} kg`} theme={theme} />
              <InfoRow icon="calendar-outline" label="Age" value={`${profile?.age} yrs`} theme={theme} />
              <InfoRow icon="male-female-outline" label="Gender" value={profile?.gender || '-'} theme={theme} capitalize />
            </View>

            {profile?.height_cm && profile?.weight_kg && (
              <View style={[styles.bmiCard, { backgroundColor: 'rgba(255,255,255,0.1)', borderColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[styles.labelSm, { color: theme.textMuted, marginTop: 0, marginBottom: 8 }]}>BMI Estimate</Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                  <Text style={[styles.bmiValue, { color: theme.text }]}>{calculateBMI(profile.height_cm, profile.weight_kg)}</Text>
                  <Text style={[styles.bmiUnit, { color: theme.textSecondary }]}>kg/m²</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* FAB Edit Button for Mobile (Rule 7: Support User Control) */}
      <View style={styles.fabWrapper}>
         <TouchableOpacity onPress={() => setIsEditing(true)} style={[styles.fab, { backgroundColor: theme.accent }]}>
            <Ionicons name="pencil" size={24} color="#fff" />
         </TouchableOpacity>
      </View>
      </View>
    </GlassBackground>
  );
}

function InfoRow({ icon, label, value, theme, capitalize = false }: any) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: theme.border }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={[styles.infoIconBox, { backgroundColor: theme.border }]}>
          <Ionicons name={icon} size={16} color={theme.textMuted} />
        </View>
        <Text style={[styles.infoLabel, { color: theme.textSecondary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: theme.text, textTransform: capitalize ? 'capitalize' : 'none' }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollPad: { paddingBottom: 100, paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 44 : 24 },
  contentMax: { maxWidth: 640, width: '100%', alignSelf: 'center' },
  contentMaxLg: { maxWidth: 1024, width: '100%', alignSelf: 'center' },
  
  editHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  title: { fontSize: 32, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 16, fontWeight: '500' },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  
  alertBanner: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 },
  alertText: { fontSize: 14, fontWeight: '600', flex: 1 },
  
  labelSm: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 4 },
  
  toggleRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  toggleBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, borderWidth: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  toggleText: { fontWeight: '700' },
  
  unitHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  unitSwitch: { flexDirection: 'row', borderRadius: 8, borderWidth: 1, overflow: 'hidden' },
  unitOption: { paddingHorizontal: 12, paddingVertical: 6 },
  unitText: { fontSize: 12, fontWeight: '700' },
  
  goalBtn: { flexGrow: 1, paddingVertical: 20, borderRadius: 20, alignItems: 'center', borderWidth: 1 },
  goalLabel: { fontWeight: '700', fontSize: 14, marginTop: 12, textAlign: 'center' },
  goalDesc: { fontSize: 12, marginTop: 4, textAlign: 'center' },

  navBar: { paddingTop: Platform.OS === 'ios' ? 56 : 40, paddingBottom: 16, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1 },
  navBrand: { flexDirection: 'row', alignItems: 'center' },
  navTitle: { fontSize: 20, fontWeight: '800', marginLeft: 8 },
  iconBtnNav: { width: 40, height: 40, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  targetCard: { borderWidth: 1, borderRadius: 32, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  targetHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  calorieText: { fontSize: 64, fontWeight: '800', marginBottom: 4 },
  calorieUnit: { fontSize: 18, fontWeight: '600', marginBottom: 32 },
  divider: { width: '100%', height: 1, marginBottom: 24 },
  goalBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', width: '100%', paddingVertical: 16, borderRadius: 20 },
  goalBannerText: { fontWeight: '700', fontSize: 16 },

  editBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  editBtnText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },

  statsCard: { borderWidth: 1, borderRadius: 24, padding: 20, marginBottom: 24 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1 },
  infoIconBox: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  infoLabel: { fontSize: 14, fontWeight: '600' },
  infoValue: { fontSize: 16, fontWeight: '700' },

  bmiCard: { borderWidth: 1, borderRadius: 24, padding: 20 },
  bmiValue: { fontSize: 32, fontWeight: '800' },
  bmiUnit: { fontSize: 14, fontWeight: '600', paddingBottom: 4 },

  fabWrapper: { position: 'absolute', bottom: 24, right: 24, display: Platform.OS === 'web' ? 'none' : 'flex' },
  fab: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },
});
