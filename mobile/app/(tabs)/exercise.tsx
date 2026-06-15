import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput } from 'react-native';
import GlassBackground from '../../components/GlassBackground';
import AppHeader from './_AppHeader';
import { useTheme } from '../../context/ThemeContext';
import * as Icons from 'lucide-react-native';
import exerciseData from '../../../dataset/exercise.json';

export default function ExerciseScreen() {
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredExercises = exerciseData.filter(
    (item) =>
      item.exercise_name_en.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.exercise_name_bn.includes(searchQuery) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderItem = ({ item }: { item: any }) => (
    <View style={[styles.exerciseCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleContainer}>
          <Text style={[styles.exerciseNameEn, { color: theme.text }]}>{item.exercise_name_en}</Text>
          <Text style={[styles.exerciseNameBn, { color: theme.textSecondary }]}>{item.exercise_name_bn}</Text>
        </View>
        <View style={[styles.categoryBadge, { backgroundColor: theme.primary + '20' }]}>
          <Text style={[styles.categoryText, { color: theme.primary }]}>{item.category}</Text>
        </View>
      </View>
      <View style={styles.detailsContainer}>
        <View style={styles.metContainer}>
          <Icons.Flame size={16} color={theme.accentLight} style={{ marginRight: 6 }} />
          <Text style={[styles.metText, { color: theme.text }]}>MET: {item.met}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <GlassBackground>
      <AppHeader />
      <View style={styles.container}>
        <View style={[styles.searchContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Icons.Search size={20} color={theme.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: theme.text }]}
            placeholder="Search exercises..."
            placeholderTextColor={theme.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredExercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: theme.textSecondary }]}>No exercises found.</Text>
          }
        />
      </View>
    </GlassBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 100,
  },
  exerciseCard: {
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  titleContainer: {
    flex: 1,
    paddingRight: 12,
  },
  exerciseNameEn: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  exerciseNameBn: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  metText: {
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },
});
