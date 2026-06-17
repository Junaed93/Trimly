import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Icons from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../context/ThemeContext';
import { getAwards, getUserAwards } from '../services/api';

export default function AwardsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [allAwards, setAllAwards] = useState<any[]>([]);
  const [earnedAwards, setEarnedAwards] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [allRes, userRes] = await Promise.all([
        getAwards(),
        getUserAwards()
      ]);
      setAllAwards(allRes.data || []);
      setEarnedAwards(userRes.data || []);
    } catch (e) {
      console.error('Failed to fetch awards', e);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const isEarned = (awardId: number) => {
    return earnedAwards.some(ua => ua.id === awardId);
  };

  const getEarnedDate = (awardId: number) => {
    const ua = earnedAwards.find(ua => ua.id === awardId);
    if (!ua) return null;
    return new Date(ua.earned_at).toLocaleDateString();
  };

  const renderIcon = (iconName: string, unlocked: boolean) => {
    let IconComponent = Icons.Award;
    try {
      if (iconName && (Icons as any)[iconName]) {
        IconComponent = (Icons as any)[iconName];
      }
    } catch(e) {}
    
    return <IconComponent size={32} color={unlocked ? '#F59E0B' : theme.textMuted} />;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.surface }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>All Awards</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.listContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
      >
        <View style={styles.summaryContainer}>
          <Text style={[styles.summaryText, { color: theme.text }]}>
            You have unlocked <Text style={{ color: theme.primary, fontWeight: 'bold' }}>{earnedAwards.length}</Text> out of <Text style={{ fontWeight: 'bold' }}>{allAwards.length}</Text> awards!
          </Text>
        </View>

        <View style={styles.grid}>
          {allAwards.map((award) => {
            const unlocked = isEarned(award.id);
            return (
              <View 
                key={award.id} 
                style={[
                  styles.awardCard, 
                  { 
                    backgroundColor: unlocked ? theme.surfaceRaised : theme.surface, 
                    borderColor: unlocked ? '#F59E0B' : theme.border,
                    opacity: unlocked ? 1 : 0.6
                  }
                ]}
              >
                <View style={[styles.iconContainer, { backgroundColor: unlocked ? '#F59E0B20' : theme.accentSurface }]}>
                  {renderIcon('Award', unlocked)}
                </View>
                <Text style={[styles.awardName, { color: theme.text }]} numberOfLines={2}>
                  {award.name}
                </Text>
                <Text style={[styles.awardDescription, { color: theme.textSecondary }]} numberOfLines={3}>
                  {award.description}
                </Text>
                {unlocked && (
                  <Text style={[styles.dateText, { color: theme.success }]}>
                    Earned: {getEarnedDate(award.id)}
                  </Text>
                )}
                {!unlocked && (
                  <Text style={[styles.dateText, { color: theme.textMuted }]}>
                    Locked
                  </Text>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
  },
  summaryContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  awardCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  awardName: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  awardDescription: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
  },
  dateText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 'auto',
  },
});
