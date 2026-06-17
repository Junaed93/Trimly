import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform, Alert, Modal, TextInput, KeyboardAvoidingView, Pressable, Keyboard, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import Animated, { FadeInUp, FadeInRight } from 'react-native-reanimated';
import GlassBackground from '../../components/GlassBackground';
import AppCard from '../../components/AppCard';
import SectionHeader from '../../components/SectionHeader';
import Button from '../../components/Button';
import { getProfile, removeToken, getWeightLogs, updateAccount, getUserAwards, getAwards } from '../../services/api';
import { getUserStats, saveUserStats } from '../../services/userStatsStorage';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);
  const [userStats, setUserStats] = useState<any>({});
  
  const [allAwards, setAllAwards] = useState<any[]>([]);
  const [earnedAwardIds, setEarnedAwardIds] = useState<Set<number>>(new Set());
  
  const [isGoalModalVisible, setGoalModalVisible] = useState(false);
  const [targetWeightInput, setTargetWeightInput] = useState('');

  const [isInitialWeightModalVisible, setInitialWeightModalVisible] = useState(false);
  const [initialWeightInput, setInitialWeightInput] = useState('');

  const [isEditProfileModalVisible, setEditProfileModalVisible] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profRes, logsRes, stats, allAwardsRes, userAwardsRes] = await Promise.all([
        getProfile(),
        getWeightLogs(),
        getUserStats(),
        getAwards(),
        getUserAwards(),
      ]);
      setProfile(profRes.data);
      setWeightLogs(logsRes.data);
      setUserStats(stats);
      
      // Deduplicate awards by name (in case the seed script created duplicates)
      const uniqueAwards: any[] = [];
      const seenNames = new Set<string>();
      (allAwardsRes.data || []).forEach((award: any) => {
        if (!seenNames.has(award.name)) {
          seenNames.add(award.name);
          uniqueAwards.push(award);
        }
      });
      setAllAwards(uniqueAwards);
      
      const earnedSet = new Set<number>();
      (userAwardsRes.data || []).forEach((aw: any) => earnedSet.add(aw.award_id || aw.id));
      setEarnedAwardIds(earnedSet);
      
      if (stats.targetWeight) setTargetWeightInput(stats.targetWeight.toString());
      if (stats.initialWeight) setInitialWeightInput(stats.initialWeight.toString());
    } catch (e) {
      console.log('Failed to fetch profile data', e);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log Out', style: 'destructive', onPress: async () => {
        await removeToken();
        router.replace('/login');
      }}
    ]);
  };

  const handleSaveGoal = async () => {
    if (!targetWeightInput) return;
    const val = parseFloat(targetWeightInput);
    if (!isNaN(val)) {
       const newStats = { ...userStats, targetWeight: val };
       await saveUserStats(newStats);
       setUserStats(newStats);
    }
    setGoalModalVisible(false);
    Keyboard.dismiss();
  };

  const handleSaveInitialWeight = async () => {
    if (!initialWeightInput) return;
    const val = parseFloat(initialWeightInput);
    if (!isNaN(val)) {
       const newStats = { ...userStats, initialWeight: val };
       await saveUserStats(newStats);
       setUserStats(newStats);
    }
    setInitialWeightModalVisible(false);
    Keyboard.dismiss();
  };

  const handleOpenEditProfile = () => {
    setEditName(profile?.name || '');
    setEditEmail(profile?.email || '');
    setEditPassword('');
    setEditError('');
    setEditProfileModalVisible(true);
  };

  const handleSaveProfile = async () => {
    try {
      const payload: any = {};
      if (editName && editName !== profile?.name) payload.name = editName;
      if (editEmail && editEmail !== profile?.email) payload.email = editEmail;
      if (editPassword) payload.password = editPassword;

      if (Object.keys(payload).length > 0) {
        await updateAccount(payload);
        fetchData();
      }
      setEditProfileModalVisible(false);
      Keyboard.dismiss();
    } catch (e: any) {
      setEditError(e.response?.data?.message || 'Failed to update profile');
    }
  };

  const [selectedAward, setSelectedAward] = useState<any>(null);

  const goalMap: any = {
    lose_slow: 'Lose Weight',
    lose_aggressive: 'Lose Fast',
    maintain: 'Maintain Weight',
    gain: 'Gain Muscle'
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  // Group Awards by Category
  const groupedAwards = {
    'Streaks': allAwards.filter(a => a.requirement_type.includes('STREAK')),
    'Diet & Nutrition': allAwards.filter(a => a.requirement_type.includes('MEAL') || a.requirement_type === 'CALORIES_TRACKED'),
    'Activity & Burn': allAwards.filter(a => a.requirement_type.includes('EXERCISE') || a.requirement_type === 'CALORIES_BURNED'),
    'Weight Milestones': allAwards.filter(a => a.requirement_type === 'WEIGHT_LOG' || a.requirement_type === 'FIRST_GOAL' || a.requirement_type === 'PROFILE_UPDATE')
  };

  const renderAchievementCategory = (title: string, awards: any[], delayIndex: number) => {
    if (!awards || awards.length === 0) return null;
    
    return (
      <Animated.View entering={FadeInUp.delay(delayIndex * 100)} style={styles.awardCategoryContainer} key={title}>
        <Text style={[styles.categoryTitle, { color: theme.textSecondary }]}>{title}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.awardScroll}>
          {awards.map((award, index) => {
            const unlocked = earnedAwardIds.has(award.id);
            let IconComponent = Icons.Award;
            try {
              if (award.icon && (Icons as any)[award.icon]) {
                IconComponent = (Icons as any)[award.icon];
              }
            } catch(e) {}
            
            // Generate a color based on the icon/type to make them vibrant
            const colorMap: any = {
              'Flame': theme.warning,
              'Star': theme.secondary,
              'Trophy': '#F59E0B',
              'Zap': theme.primary,
              'Scale': theme.primary,
              'Utensils': theme.success,
              'Dumbbell': theme.error,
              'Apple': theme.success,
              'Activity': theme.error,
            };
            const activeColor = colorMap[award.icon] || theme.primary;

            return (
              <Animated.View entering={FadeInRight.delay(index * 50)} key={award.id}>
                <TouchableOpacity 
                  activeOpacity={0.7}
                  onPress={() => setSelectedAward(award)}
                  style={[styles.achievementItem, { backgroundColor: theme.surfaceRaised, borderColor: unlocked ? activeColor : theme.border }]}
                >
                  {unlocked && (
                    <View style={[styles.glowBackground, { backgroundColor: activeColor }]} />
                  )}
                  <View style={[styles.achievementIconBox, { backgroundColor: unlocked ? activeColor + '20' : theme.surface }]}>
                    <IconComponent size={28} color={unlocked ? activeColor : theme.textPlaceholder} strokeWidth={unlocked ? 2.5 : 2.0} />
                    {!unlocked && (
                      <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: theme.surfaceRaised, borderRadius: 10, padding: 2 }}>
                        <Icons.Lock size={12} color={theme.textMuted} />
                      </View>
                    )}
                  </View>
                  <Text style={[styles.achievementTitle, { color: unlocked ? theme.text : theme.textMuted }]} numberOfLines={1}>{award.name}</Text>
                  <Text style={[styles.achievementDesc, { color: theme.textMuted }]} numberOfLines={2}>{award.description}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </ScrollView>
      </Animated.View>
    );
  };

  const renderSettingRow = (icon: any, title: string, rightElement: React.ReactNode, hideBorder = false, onPress?: () => void) => {
    const IconComponent = (Icons as any)[icon];
    return (
      <TouchableOpacity 
        style={[styles.settingRow, { borderBottomWidth: hideBorder ? 0 : StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}
        disabled={!onPress}
        onPress={onPress}
      >
        <View style={styles.settingLeft}>
          <IconComponent size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        </View>
        {rightElement}
      </TouchableOpacity>
    );
  };

  return (
    <GlassBackground>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInUp}>
          <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
        </Animated.View>

        {/* Profile Hero Card */}
        <Animated.View entering={FadeInUp.delay(100)} style={{ marginTop: 24 }}>
          <AppCard variant="glass" style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatarBox, { backgroundColor: theme.primarySurface }]}>
                <Text style={[styles.avatarText, { color: theme.primary }]}>{getInitials(profile?.name)}</Text>
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.profileName, { color: theme.text }]}>{profile?.name}</Text>
                <Text style={[styles.profileEmail, { color: theme.textMuted }]}>{profile?.email}</Text>
                <View style={[styles.goalBadge, { backgroundColor: theme.secondary + '20' }]}>
                  <Icons.Target size={12} color={theme.secondary} style={{ marginRight: 4 }} />
                  <Text style={[styles.goalText, { color: theme.secondary }]}>{profile?.goal ? goalMap[profile.goal] : 'No Goal Set'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={handleOpenEditProfile}>
                <Icons.Edit2 size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </AppCard>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInUp.delay(200)} style={{ marginTop: 24 }}>
          <View style={styles.statsGrid}>
            <AppCard variant="elevated" style={styles.statCard}>
              <Icons.Award size={24} color={theme.warning} style={{ marginBottom: 12 }} />
              <Text style={[styles.statValue, { color: theme.text }]}>{earnedAwardIds.size}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Awards</Text>
            </AppCard>
            <AppCard variant="elevated" style={styles.statCard}>
              <Icons.Activity size={24} color={theme.primary} style={{ marginBottom: 12 }} />
              <Text style={[styles.statValue, { color: theme.text }]}>{profile?.daily_calorie_target || '-'}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Daily Target</Text>
            </AppCard>
          </View>
        </Animated.View>

        {/* Achievements Gallery */}
        <Animated.View entering={FadeInUp.delay(300)} style={{ marginTop: 32 }}>
          <SectionHeader title="Achievements" />
          {Object.entries(groupedAwards).map(([catTitle, awards], index) => (
             renderAchievementCategory(catTitle, awards, index + 3)
          ))}
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInUp.delay(700)} style={{ marginTop: 32 }}>
          <SectionHeader title="Settings" />
          <AppCard variant="glass" style={{ padding: 0 }}>
            {renderSettingRow('Moon', 'Dark Mode', (
              <Switch 
                value={isDark} 
                onValueChange={toggleTheme} 
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            ))}
            {renderSettingRow('Scale', 'Starting Weight', (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: theme.textSecondary, fontWeight: '700', marginRight: 8 }}>
                  {userStats?.initialWeight ? `${userStats.initialWeight} kg` : 'Set'}
                </Text>
                <Icons.ChevronRight size={20} color={theme.textMuted} />
              </View>
            ), false, () => setInitialWeightModalVisible(true))}
            {renderSettingRow('Target', 'Target Weight', (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ color: theme.primary, fontWeight: '700', marginRight: 8 }}>
                  {userStats?.targetWeight ? `${userStats.targetWeight} kg` : 'Set Goal'}
                </Text>
                <Icons.ChevronRight size={20} color={theme.textMuted} />
              </View>
            ), false, () => setGoalModalVisible(true))}
            {renderSettingRow('Shield', 'Privacy & Security', (
              <Icons.ChevronRight size={20} color={theme.textMuted} />
            ))}
            {renderSettingRow('HelpCircle', 'Help & Support', (
              <Icons.ChevronRight size={20} color={theme.textMuted} />
            ), true)}
          </AppCard>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.delay(800)} style={{ marginTop: 32 }}>
          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.errorSurface, borderColor: theme.errorBorder }]} onPress={handleLogout}>
            <Icons.LogOut size={20} color={theme.error} style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: theme.error }]}>Log Out</Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>Trimly v2.0.0 Premium</Text>
        </Animated.View>
        
        {/* Modals omitted for brevity - reuse from previous file but with premium input styles */}
        {/* Target Weight Modal */}
        <Modal visible={isGoalModalVisible} transparent animationType="fade">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setGoalModalVisible(false); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay} pointerEvents="box-none">
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Target Weight</Text>
              <View style={styles.qtyContainer}>
                <TextInput style={[styles.qtyInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} keyboardType="numeric" value={targetWeightInput} onChangeText={setTargetWeightInput} autoFocus placeholder="e.g. 65" placeholderTextColor={theme.textMuted} />
                <Text style={[styles.qtyUnit, { color: theme.textMuted }]}>kg</Text>
              </View>
              <Button title="Save Goal" onPress={handleSaveGoal} />
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Initial Weight Modal */}
        <Modal visible={isInitialWeightModalVisible} transparent animationType="fade">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setInitialWeightModalVisible(false); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay} pointerEvents="box-none">
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Starting Weight</Text>
              <View style={styles.qtyContainer}>
                <TextInput style={[styles.qtyInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} keyboardType="numeric" value={initialWeightInput} onChangeText={setInitialWeightInput} autoFocus placeholder="e.g. 70" placeholderTextColor={theme.textMuted} />
                <Text style={[styles.qtyUnit, { color: theme.textMuted }]}>kg</Text>
              </View>
              <Button title="Save Weight" onPress={handleSaveInitialWeight} />
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Edit Profile Modal */}
        <Modal visible={isEditProfileModalVisible} transparent animationType="fade">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setEditProfileModalVisible(false); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay} pointerEvents="box-none">
            <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.surfaceRaised, borderColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Edit Profile</Text>
              {editError ? <Text style={{ color: theme.error, marginBottom: 16, textAlign: 'center', fontWeight: '500' }}>{editError}</Text> : null}
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Name</Text>
              <TextInput style={[styles.textInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} value={editName} onChangeText={setEditName} placeholder="Name" placeholderTextColor={theme.textMuted} />
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>Email</Text>
              <TextInput style={[styles.textInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} value={editEmail} onChangeText={setEditEmail} keyboardType="email-address" autoCapitalize="none" placeholder="Email" placeholderTextColor={theme.textMuted} />
              <Text style={[styles.inputLabel, { color: theme.textMuted }]}>New Password (Optional)</Text>
              <TextInput style={[styles.textInput, { color: theme.text, backgroundColor: theme.surface, borderColor: theme.border }]} value={editPassword} onChangeText={setEditPassword} secureTextEntry placeholder="Enter new password" placeholderTextColor={theme.textMuted} />
              <Button title="Save Changes" onPress={handleSaveProfile} />
            </Animated.View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Award Details Modal */}
        <Modal visible={!!selectedAward} transparent animationType="fade">
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setSelectedAward(null)} />
          <View style={styles.modalOverlay} pointerEvents="box-none">
            {selectedAward && (() => {
              const unlocked = earnedAwardIds.has(selectedAward.id);
              let IconComponent = Icons.Award;
              try {
                if (selectedAward.icon && (Icons as any)[selectedAward.icon]) {
                  IconComponent = (Icons as any)[selectedAward.icon];
                }
              } catch(e) {}
              
              const colorMap: any = {
                'Flame': theme.warning,
                'Star': theme.secondary,
                'Trophy': '#F59E0B',
                'Zap': theme.primary,
                'Scale': theme.primary,
                'Utensils': theme.success,
                'Dumbbell': theme.error,
                'Apple': theme.success,
                'Activity': theme.error,
              };
              const activeColor = colorMap[selectedAward.icon] || theme.primary;

              return (
                <Animated.View entering={FadeInUp} style={[styles.modalContent, { backgroundColor: theme.surfaceRaised, borderColor: theme.border, alignItems: 'center' }]}>
                  {unlocked && (
                    <View style={[StyleSheet.absoluteFillObject, { backgroundColor: activeColor, opacity: 0.05, borderRadius: 36 }]} />
                  )}
                  
                  <View style={[styles.achievementIconBox, { width: 80, height: 80, borderRadius: 40, backgroundColor: unlocked ? activeColor + '20' : theme.surface, marginBottom: 24 }]}>
                    <IconComponent size={40} color={unlocked ? activeColor : theme.textPlaceholder} strokeWidth={unlocked ? 2.5 : 2.0} />
                    {!unlocked && (
                      <View style={{ position: 'absolute', bottom: -4, right: -4, backgroundColor: theme.surfaceRaised, borderRadius: 12, padding: 4, borderWidth: 2, borderColor: theme.surfaceRaised }}>
                        <Icons.Lock size={16} color={theme.textMuted} />
                      </View>
                    )}
                  </View>
                  
                  <Text style={[styles.modalTitle, { color: unlocked ? theme.text : theme.textMuted, marginBottom: 8 }]}>{selectedAward.name}</Text>
                  
                  <View style={{ backgroundColor: unlocked ? theme.success + '20' : theme.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, marginBottom: 16 }}>
                    <Text style={{ color: unlocked ? theme.success : theme.textMuted, fontWeight: '700', fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {unlocked ? 'Unlocked' : 'Locked'}
                    </Text>
                  </View>
                  
                  <Text style={{ color: theme.textSecondary, textAlign: 'center', fontSize: 14, lineHeight: 20, marginBottom: 32 }}>
                    {selectedAward.description}
                  </Text>
                  
                  <Button title="Close" onPress={() => setSelectedAward(null)} style={{ width: '100%' }} />
                </Animated.View>
              );
            })()}
          </View>
        </Modal>

      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 120,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  profileCard: {
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 10,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editBtn: {
    padding: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  awardCategoryContainer: {
    marginBottom: 24,
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    marginLeft: 4,
  },
  awardScroll: {
    paddingRight: 20,
    gap: 16,
  },
  achievementItem: {
    width: width * 0.38,
    padding: 16,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    overflow: 'hidden',
  },
  glowBackground: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.05,
  },
  achievementIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  achievementDesc: {
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 14,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '700',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    padding: 32,
    borderRadius: 36,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 24,
    textAlign: 'center',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  qtyInput: {
    fontSize: 40,
    fontWeight: '800',
    textAlign: 'center',
    minWidth: 140,
    paddingVertical: 16,
    borderRadius: 24,
    borderWidth: 1,
  },
  qtyUnit: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
    marginLeft: 4,
  },
  textInput: {
    fontSize: 16,
    fontWeight: '500',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 20,
  },
});
