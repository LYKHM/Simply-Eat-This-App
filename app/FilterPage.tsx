import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

type DietType = 'high-protein' | 'low-carb' | 'keto' | 'paleo' | 'vegan' | 'vegetarian' | 'mediterranean' | 'anything';
type TimeRange = '5-10' | '10-15' | '15-20' | '20-25' | '25-30';
type CalorieRange = '<100' | '200-400' | '400-600' | '600-800' | '800-1000' | '1000+';
type CategoryType = 'meals' | 'snacks' | 'desserts';

interface FilterState {
  diet: DietType;
  familyMembers: number;
  calorieRange: CalorieRange;
  timeRange: TimeRange;
  slowCooker: boolean;
  excludedFoods: string[];
  category: CategoryType;
}
 
const FilterPage = () => {
  const [filters, setFilters] = useState<FilterState>({
    diet: 'anything',
    familyMembers: 1,
    calorieRange: '400-600',
    timeRange: '15-20',
    slowCooker: false,
    excludedFoods: [],
    category: 'meals'
  });
  //console.log('Filters:', filters);

  const dietOptions: { value: DietType; label: string }[] = [
    { value: 'anything', label: 'Anything' },
    { value: 'high-protein', label: 'High Protein' },
    { value: 'low-carb', label: 'Low Carb' },
    { value: 'keto', label: 'Keto' },
    { value: 'paleo', label: 'Paleo' },
    { value: 'vegan', label: 'Vegan' },
    { value: 'vegetarian', label: 'Vegetarian' },
    { value: 'mediterranean', label: 'Mediterranean' },
  ];

  const timeOptions: { value: TimeRange; label: string }[] = [
    { value: '5-10', label: '5-10 min' },
    { value: '10-15', label: '10-15 min' },
    { value: '15-20', label: '15-20 min' },
    { value: '20-25', label: '20-25 min' },
    { value: '25-30', label: '25-30 min' },
  ];

  const calorieOptions: { value: CalorieRange; label: string }[] = [
    { value: '<100', label: '<100 cal' },
    { value: '200-400', label: '200-400 cal' },
    { value: '400-600', label: '400-600 cal' },
    { value: '600-800', label: '600-800 cal' },
    { value: '800-1000', label: '800-1000 cal' },
    { value: '1000+', label: '1000+ cal' },
  ];

  const commonAllergens = [
    'Nuts', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Shellfish', 'Fish', 
    'Sesame', 'Mushrooms', 'Onions', 'Garlic', 'Spicy Food'
  ];

  const familyMemberOptions = [
    { value: 1, label: '1 person', icon: 'person' },
    { value: 2, label: '2 people', icon: 'people' },
    { value: 3, label: '3 people', icon: 'people' },
    { value: 4, label: '4 people', icon: 'people' },
    { value: 5, label: '5+ people', icon: 'people' },
  ];

  const categoryOptions: { value: CategoryType; label: string; icon: string }[] = [
    { value: 'meals', label: 'Meals', icon: 'restaurant' },
    { value: 'snacks', label: 'Snacks', icon: 'nutrition' },
    { value: 'desserts', label: 'Desserts', icon: 'ice-cream' },
  ];

  const handleDietSelect = (diet: DietType) => {
    setFilters(prev => ({ ...prev, diet }));
  };

  const handleTimeSelect = (timeRange: TimeRange) => {
    setFilters(prev => ({ ...prev, timeRange }));
  };

  const handleCalorieSelect = (calorieRange: CalorieRange) => {
    setFilters(prev => ({ ...prev, calorieRange }));
  };

  const handleFamilyMemberSelect = (familyMembers: number) => {
    setFilters(prev => ({ ...prev, familyMembers }));
  };

  const handleCategorySelect = (category: CategoryType) => {
    setFilters(prev => ({ ...prev, category }));
  };

  const toggleExcludedFood = (food: string) => {
    setFilters(prev => ({
      ...prev,
      excludedFoods: prev.excludedFoods.includes(food)
        ? prev.excludedFoods.filter(f => f !== food)
        : [...prev.excludedFoods, food]
    }));
  };

  const handleContinueToCamera = () => {
    // Navigate to camera with filter params
    router.push({
      pathname: '/modal',
      params: {
        diet: filters.diet,
        familyMembers: filters.familyMembers.toString(),
        calorieRange: filters.calorieRange,
        timeRange: filters.timeRange,
        slowCooker: filters.slowCooker.toString(),
        excludedFoods: JSON.stringify(filters.excludedFoods),
        category: filters.category,
      }
    });
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#212529" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Recipe Filters</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          
          {/* Diet Type Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Diet Preference</Text>
            <View style={styles.optionsGrid}>
              {dietOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionCard,
                    filters.diet === option.value && styles.selectedCard
                  ]}
                  onPress={() => handleDietSelect(option.value)}
                >
                  <Text style={[
                    styles.optionTextCentered,
                    filters.diet === option.value && styles.selectedText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Category Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recipe Category</Text>
            <View style={styles.horizontalOptions}>
              {categoryOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.horizontalOption,
                    filters.category === option.value && styles.selectedHorizontal
                  ]}
                  onPress={() => handleCategorySelect(option.value)}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={16} 
                    color={filters.category === option.value ? '#0d6efd' : '#6c757d'} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[
                    styles.horizontalOptionText,
                    filters.category === option.value && styles.selectedHorizontalText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Serving Size Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Serving Size</Text>
            <View style={styles.horizontalOptions}>
              {familyMemberOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.horizontalOption,
                    filters.familyMembers === option.value && styles.selectedHorizontal
                  ]}
                  onPress={() => handleFamilyMemberSelect(option.value)}
                >
                  <Ionicons 
                    name={option.icon as any} 
                    size={16} 
                    color={filters.familyMembers === option.value ? '#0d6efd' : '#6c757d'} 
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[
                    styles.horizontalOptionText,
                    filters.familyMembers === option.value && styles.selectedHorizontalText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Calories Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calories per Serving</Text>
            <View style={styles.horizontalOptions}>
              {calorieOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.horizontalOption,
                    filters.calorieRange === option.value && styles.selectedHorizontal
                  ]}
                  onPress={() => handleCalorieSelect(option.value)}
                >
                  <Text style={[
                    styles.horizontalOptionText,
                    filters.calorieRange === option.value && styles.selectedHorizontalText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Time Options Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cooking Time</Text>
            <View style={styles.horizontalOptions}>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.horizontalOption,
                    filters.timeRange === option.value && styles.selectedHorizontal
                  ]}
                  onPress={() => handleTimeSelect(option.value)}
                >
                  <Text style={[
                    styles.horizontalOptionText,
                    filters.timeRange === option.value && styles.selectedHorizontalText
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Slow Cooker Option */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Cooking Method</Text>
            <View style={styles.switchRow}>
              <View style={styles.switchInfo}>
                <Ionicons name="timer" size={24} color="#6c757d" />
                <Text style={styles.switchLabel}>Slow Cooker / Set & Forget</Text>
              </View>
              <Switch
                value={filters.slowCooker}
                onValueChange={(value) => setFilters(prev => ({ ...prev, slowCooker: value }))}
                trackColor={{ false: '#e9ecef', true: '#0d6efd' }}
                thumbColor={filters.slowCooker ? '#fff' : '#6c757d'}
              />
            </View>
          </View>

          {/* Exclude Foods Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergies</Text>
            <Text style={styles.sectionSubtitle}>Select any foods you want to avoid</Text>
            <View style={styles.excludeGrid}>
              {commonAllergens.map((food) => (
                <TouchableOpacity
                  key={food}
                  style={[
                    styles.excludeChip,
                    filters.excludedFoods.includes(food) && styles.excludeChipSelected
                  ]}
                  onPress={() => toggleExcludedFood(food)}
                >
                  <Text style={[
                    styles.excludeChipText,
                    filters.excludedFoods.includes(food) && styles.excludeChipTextSelected
                  ]}>
                    {food}
                  </Text>
                  {filters.excludedFoods.includes(food) && (
                    <Ionicons name="close-circle" size={16} color="#dc3545" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Continue Button */}
          <TouchableOpacity style={styles.continueButton} onPress={handleContinueToCamera}>
            <View style={styles.continueContent}>
              <Ionicons name="camera" size={24} color="#fff" />
              <Text style={styles.continueText}>Continue to Camera</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.bottomPadding} />
        </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233, 236, 239, 0.5)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  headerSpacer: {
    width: 48,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
  },
  optionCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#0d6efd',
    backgroundColor: 'rgba(13, 110, 253, 0.1)',
  },
  optionText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  optionTextCentered: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedText: {
    color: '#0d6efd',
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginTop: 16,
  },
  switchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '600',
    marginLeft: 12,
  },
  horizontalOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  horizontalOption: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedHorizontal: {
    borderColor: '#0d6efd',
    backgroundColor: 'rgba(13, 110, 253, 0.1)',
  },
  horizontalOptionText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  selectedHorizontalText: {
    color: '#0d6efd',
  },
  excludeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  excludeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  excludeChipSelected: {
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderColor: '#dc3545',
  },
  excludeChipText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  excludeChipTextSelected: {
    color: '#dc3545',
  },
  continueButton: {
    marginTop: 20,
    borderRadius: 16,
    backgroundColor: '#0d6efd',
    overflow: 'hidden',
  },
  continueContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  continueText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  bottomPadding: {
    height: 40,
  },
});

export default FilterPage;