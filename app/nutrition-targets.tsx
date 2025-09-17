import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { PieChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

interface NutritionData {
  bmr: number;
  calories: number;
  carbs: number;
  fat: number;
  protein: number;
  tdee: number;
}

export default function NutritionTargetsScreen() {
  const router = useRouter();
  const [nutritionData, setNutritionData] = useState<NutritionData>({
    bmr: 0,
    calories: 0,
    carbs: 0,
    fat: 0,
    protein: 0,
    tdee: 0
  });
  const [dailyCalories, setDailyCalories] = useState<string>('');
  const [carbsPercentage, setCarbsPercentage] = useState<string>('');
  const [fatPercentage, setFatPercentage] = useState<string>('');
  const [proteinPercentage, setProteinPercentage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadNutritionData();
  }, []);

  const loadNutritionData = async () => {
    try {
      const nutritionDataString = await AsyncStorage.getItem("nutritionData");
      if (nutritionDataString) {
        const data: NutritionData = JSON.parse(nutritionDataString);
        setNutritionData(data);
        setDailyCalories(data.calories.toString());
        
        // Calculate current percentages
        const carbsPercent = Math.round((data.carbs * 4) / data.calories * 100).toString();
        const fatPercent = Math.round((data.fat * 9) / data.calories * 100).toString();
        const proteinPercent = Math.round((data.protein * 4) / data.calories * 100).toString();
        
        setCarbsPercentage(carbsPercent);
        setFatPercentage(fatPercent);
        setProteinPercentage(proteinPercent);
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateMacros = () => {
    const calories = parseFloat(dailyCalories) || 0;
    const carbsPercent = parseFloat(carbsPercentage) || 0;
    const fatPercent = parseFloat(fatPercentage) || 0;
    const proteinPercent = parseFloat(proteinPercentage) || 0;

    const carbs = Math.round((calories * carbsPercent / 100) / 4);
    const fat = Math.round((calories * fatPercent / 100) / 9);
    const protein = Math.round((calories * proteinPercent / 100) / 4);

    return { carbs, fat, protein };
  };

  const normalizePercentages = () => {
    const carbsPercent = parseFloat(carbsPercentage) || 0;
    const fatPercent = parseFloat(fatPercentage) || 0;
    const proteinPercent = parseFloat(proteinPercentage) || 0;
    
    const total = carbsPercent + fatPercent + proteinPercent;
    
    if (total > 0) {
      // Normalize to 100%
      const normalizedCarbs = (carbsPercent / total * 100).toFixed(1);
      const normalizedFat = (fatPercent / total * 100).toFixed(1);
      const normalizedProtein = (proteinPercent / total * 100).toFixed(1);
      
      setCarbsPercentage(normalizedCarbs);
      setFatPercentage(normalizedFat);
      setProteinPercentage(normalizedProtein);
    }
  };

  const validatePercentages = () => {
    const carbsPercent = parseFloat(carbsPercentage) || 0;
    const fatPercent = parseFloat(fatPercentage) || 0;
    const proteinPercent = parseFloat(proteinPercentage) || 0;
    
    const total = carbsPercent + fatPercent + proteinPercent;
    
    if (total === 0) {
      Alert.alert('Invalid Percentages', 'Please enter at least one macro percentage.');
      return false;
    }
    
    return true;
  };

  const getPieChartData = () => {
    const carbsPercent = parseFloat(carbsPercentage) || 0;
    const fatPercent = parseFloat(fatPercentage) || 0;
    const proteinPercent = parseFloat(proteinPercentage) || 0;
    
    const total = carbsPercent + fatPercent + proteinPercent;
    
    if (total === 0) {
      return [
        { value: 33.3, color: '#30db1d' },
        { value: 33.3, color: '#f5d14e' },
        { value: 33.4, color: '#eaec76' }
      ];
    }
    
    // Normalize to 100%
    const normalizedCarbs = (carbsPercent / total * 100);
    const normalizedFat = (fatPercent / total * 100);
    const normalizedProtein = (proteinPercent / total * 100);
    
    return [
      { value: normalizedCarbs, color: '#30db1d' },
      { value: normalizedFat, color: '#f5d14e' },
      { value: normalizedProtein, color: '#eaec76' }
    ];
  };

  const getPercentageTotal = () => {
    const carbsPercent = parseFloat(carbsPercentage) || 0;
    const fatPercent = parseFloat(fatPercentage) || 0;
    const proteinPercent = parseFloat(proteinPercentage) || 0;
    
    return Math.round(carbsPercent + fatPercent + proteinPercent);
  };

  const isPercentageValid = () => {
    const total = getPercentageTotal();
    return total === 100;
  };

  const saveNutritionTargets = async () => {
    if (!dailyCalories || !carbsPercentage || !fatPercentage || !proteinPercentage) {
      Alert.alert('Missing Information', 'Please fill in all fields before saving.');
      return;
    }

    if (!isPercentageValid()) {
      Alert.alert('Invalid Percentages', 'The percentages must add up to exactly 100%. Current total: ' + getPercentageTotal() + '%');
      return;
    }

    try {
      const calories = parseFloat(dailyCalories);
      const { carbs, fat, protein } = calculateMacros();

      const updatedNutritionData: NutritionData = {
        ...nutritionData,
        calories: calories,
        carbs: carbs,
        fat: fat,
        protein: protein
      };

      await AsyncStorage.setItem("nutritionData", JSON.stringify(updatedNutritionData));
      
      Alert.alert('Success', 'Nutrition targets updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving nutrition targets:', error);
      Alert.alert('Error', 'Failed to save nutrition targets');
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    unit: string,
    keyboardType: 'numeric' | 'default' = 'numeric'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType={keyboardType}
          placeholderTextColor="#9ca3af"
        />
        <Text style={styles.unitText}>{unit}</Text>
      </View>
    </View>
  );

  const renderMacroCard = (title: string, value: number, color: string, icon: string) => (
    <View style={[styles.macroCard, { borderColor: color }]}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroIcon}>{icon}</Text>
        <Text style={styles.macroTitle}>{title}</Text>
      </View>
      <Text style={[styles.macroValue, { color: color }]}>{value}g</Text>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#ffffff', '#fef7ff', '#f0f9ff']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading nutrition data...</Text>
        </View>
      </LinearGradient>
    );
  }

  const { carbs, fat, protein } = calculateMacros();

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
    <LinearGradient
      colors={['#ffffff', '#fef7ff', '#f0f9ff']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition Targets</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Customize your daily calorie and macro targets. Adjust the percentages to match your dietary preferences.
          </Text>
          
          <TouchableOpacity 
            style={styles.citationNotice}
            onPress={() => router.push('/citations')}
          >
            <Ionicons name="library-outline" size={16} color="#6366f1" />
            <Text style={styles.citationNoticeText}>
              View scientific references for calculations
            </Text>
            <Ionicons name="chevron-forward" size={16} color="#6366f1" />
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Calories</Text>
            <View style={styles.sectionContent}>
              {renderInputField(
                'Daily Calories',
                dailyCalories,
                setDailyCalories,
                '2000',
                'kcal'
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Macro Percentages</Text>
            <Text style={styles.sectionSubtitle}>
              Set the percentage of calories from each macronutrient (should total ~100%)
            </Text>
            <View style={styles.sectionContent}>
              {renderInputField(
                'Carbohydrates',
                carbsPercentage,
                setCarbsPercentage,
                '50',
                '%'
              )}
              {renderInputField(
                'Fat',
                fatPercentage,
                setFatPercentage,
                '30',
                '%'
              )}
              {renderInputField(
                'Protein',
                proteinPercentage,
                setProteinPercentage,
                '20',
                '%'
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Macro Distribution</Text>
            <Text style={styles.sectionSubtitle}>
              Visual representation of your macro percentages (must total 100%)
            </Text>
            <View style={styles.chartContainer}>
              {isPercentageValid() ? (
                <PieChart
                  data={getPieChartData()}
                  radius={80}
                  innerRadius={0}
                />
              ) : (
                <View style={styles.warningContainer}>
                  <Ionicons name="warning" size={32} color="#f59e0b" />
                  <Text style={styles.warningText}>
                    The percentages must add up to 100%
                  </Text>
                  <Text style={styles.warningSubtext}>
                    Currently at {getPercentageTotal()}%
                  </Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Calculated Macros</Text>
            <Text style={styles.sectionSubtitle}>
              Based on your calorie target and percentages
            </Text>
            <View style={styles.macrosContainer}>
              {renderMacroCard('Carbs', carbs, '#30db1d', '🍞')}
              {renderMacroCard('Fat', fat, '#f5d14e', '🥑')}
              {renderMacroCard('Protein', protein, '#eaec76', '🥩')}
            </View>
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveNutritionTargets}>
            <Text style={styles.saveButtonText}>Save Nutrition Targets</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 2 },
    //shadowOpacity: 0.1,
    //shadowRadius: 4,
    //elevation: 3,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  placeholder: {
    width: 40,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    paddingLeft: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 2 },
    //shadowOpacity: 0.1,
    //shadowRadius: 8,
    //elevation: 3,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#1f2937',
    marginRight: 12,
  },
  unitText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6b7280',
    minWidth: 40,
  },
  macrosContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  macroCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 2 },
    //shadowOpacity: 0.1,
    //shadowRadius: 8,
    //elevation: 3,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
  },
  macroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  macroIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  macroTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  macroValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  chartContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 2 },
    //shadowOpacity: 0.1,
    //shadowRadius: 8,
    //elevation: 3,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
  },
  centerLabel: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#374151',
  },
  warningContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  warningText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#f59e0b',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  warningSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    //shadowColor: '#6366f1',
    //shadowOffset: { width: 0, height: 4 },
    //shadowOpacity: 0.3,
    //shadowRadius: 8,
    //elevation: 6,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  citationNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.2)',
  },
  citationNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#6366f1',
    marginLeft: 8,
    fontWeight: '500',
  },
});
