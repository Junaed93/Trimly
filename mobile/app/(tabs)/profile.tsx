import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Switch, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Icons from 'lucide-react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import GlassBackground from '../../components/GlassBackground';
import AppCard from '../../components/AppCard';
import SectionHeader from '../../components/SectionHeader';
import { getProfile, removeToken, getWeightLogs } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { theme, isDark, toggleTheme } = useTheme();

  const [profile, setProfile] = useState<any>(null);
  const [weightLogs, setWeightLogs] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profRes, logsRes] = await Promise.all([
        getProfile(),
        getWeightLogs()
      ]);
      setProfile(profRes.data);
      setWeightLogs(logsRes.data);
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

  const renderAchievement = (icon: any, title: string, unlocked: boolean, color: string) => {
    const IconComponent = (Icons as any)[icon];
    return (
      <View style={[styles.achievementItem, { backgroundColor: unlocked ? theme.surfaceRaised : theme.surface, borderColor: theme.border, opacity: unlocked ? 1 : 0.5 }]}>
        <View style={[styles.achievementIcon, { backgroundColor: unlocked ? color + '20' : theme.border }]}>
          <IconComponent size={24} color={unlocked ? color : theme.textMuted} />
        </View>
        <Text style={[styles.achievementTitle, { color: theme.text }]} numberOfLines={2} textAlign="center">{title}</Text>
      </View>
    );
  };

  const renderSettingRow = (icon: any, title: string, rightElement: React.ReactNode, hideBorder = false) => {
    const IconComponent = (Icons as any)[icon];
    return (
      <View style={[styles.settingRow, { borderBottomWidth: hideBorder ? 0 : StyleSheet.hairlineWidth, borderBottomColor: theme.border }]}>
        <View style={styles.settingLeft}>
          <IconComponent size={20} color={theme.textSecondary} style={{ marginRight: 12 }} />
          <Text style={[styles.settingTitle, { color: theme.text }]}>{title}</Text>
        </View>
        {rightElement}
      </View>
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
              <TouchableOpacity style={styles.editBtn}>
                <Icons.Edit2 size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>
          </AppCard>
        </Animated.View>

        {/* Stats Grid */}
        <Animated.View entering={FadeInUp.delay(200)} style={{ marginTop: 24 }}>
          <View style={styles.statsGrid}>
            <AppCard variant="elevated" style={styles.statCard}>
              <Icons.Scale size={24} color={theme.primary} style={{ marginBottom: 12 }} />
              <Text style={[styles.statValue, { color: theme.text }]}>{weightLogs.length}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Weight Logs</Text>
            </AppCard>
            <AppCard variant="elevated" style={styles.statCard}>
              <Icons.Flame size={24} color={theme.secondary} style={{ marginBottom: 12 }} />
              <Text style={[styles.statValue, { color: theme.text }]}>{profile?.daily_calorie_target || '-'}</Text>
              <Text style={[styles.statLabel, { color: theme.textMuted }]}>Daily Target</Text>
            </AppCard>
          </View>
        </Animated.View>

        {/* Achievements */}
        <Animated.View entering={FadeInUp.delay(300)} style={{ marginTop: 32 }}>
          <SectionHeader title="Achievements" actionText="View All" />
          <View style={styles.achievementsGrid}>
            {renderAchievement('Award', 'First Log', true, '#F59E0B')}
            {renderAchievement('Flame', '7 Day Streak', weightLogs.length >= 7, theme.error)}
            {renderAchievement('Star', '30 Day Streak', weightLogs.length >= 30, theme.secondary)}
            {renderAchievement('Target', 'Goal Reached', false, theme.success)}
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInUp.delay(400)} style={{ marginTop: 32 }}>
          <SectionHeader title="Settings" />
          <AppCard variant="glass" style={{ padding: 0 }}>
            {renderSettingRow('Moon', 'Dark Mode', (
              <Switch 
                value={isDark} 
                onValueChange={toggleTheme} 
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            ))}
            {renderSettingRow('Bell', 'Notifications', (
              <Switch 
                value={true} 
                onValueChange={() => {}} 
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            ))}
            {renderSettingRow('Shield', 'Privacy & Security', (
              <Icons.ChevronRight size={20} color={theme.textMuted} />
            ))}
            {renderSettingRow('HelpCircle', 'Help & Support', (
              <Icons.ChevronRight size={20} color={theme.textMuted} />
            ), true)}
          </AppCard>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInUp.delay(500)} style={{ marginTop: 32 }}>
          <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: theme.errorSurface, borderColor: theme.errorBorder }]} onPress={handleLogout}>
            <Icons.LogOut size={20} color={theme.error} style={{ marginRight: 8 }} />
            <Text style={[styles.logoutText, { color: theme.error }]}>Log Out</Text>
          </TouchableOpacity>
          <Text style={[styles.versionText, { color: theme.textMuted }]}>Trimly v1.0.0</Text>
        </Animated.View>
        
      </ScrollView>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  profileCard: {
    padding: 24,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 2,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  goalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
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
    fontSize: 28,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
    textTransform: 'uppercase',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  achievementItem: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  achievementTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
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
    paddingVertical: 16,
    borderRadius: 20,
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
    fontWeight: '500',
  },
});
