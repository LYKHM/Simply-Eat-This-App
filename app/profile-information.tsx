import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

interface UserData {
  height: string;
  weight: string;
  biologicalSex: 'male' | 'female';
  goal: 'build' | 'lose' | 'maintain';
  targetWeight: string;
  activityLevel: 'sedentary' | 'lightly' | 'moderate' | 'very' | 'extremely';
  dietChoice: 'anything' | 'keto' | 'vegan';
}

export default function ProfileInformationScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    height: '',
    weight: '',
    biologicalSex: 'male',
    goal: 'build',
    targetWeight: '',
    activityLevel: 'sedentary',
    dietChoice: 'anything'
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const data = JSON.parse(userDataString);
        setUserData(data);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserData = async () => {
    try {
      await AsyncStorage.setItem("userData", JSON.stringify(userData));
      
      // Recalculate nutrition data with new user data
      const nutritionData = calculateNutrition(userData);
      await AsyncStorage.setItem("nutritionData", JSON.stringify(nutritionData));
      
      Alert.alert('Success', 'Profile information updated successfully!');
      router.back();
    } catch (error) {
      console.error('Error saving user data:', error);
      Alert.alert('Error', 'Failed to save profile information');
    }
  };

  const calculateNutrition = (data: UserData) => {
    const weight = parseFloat(data.weight);
    const height = parseFloat(data.height);
    const age = 25; // You might want to add age input later
    
    // Mifflin-St Jeor Formula
    let bmr = 0;
    if (data.biologicalSex === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      lightly: 1.375,
      moderate: 1.65,
      very: 1.725,
      extremely: 1.9
    };

    const tdee = bmr * activityMultipliers[data.activityLevel];

    // Goal adjustments
    let targetCalories = tdee;
    if (data.goal === 'lose') targetCalories = tdee - 500; // 500 calorie deficit
    if (data.goal === 'build') targetCalories = tdee + 300; // 300 calorie surplus

    // Macro distribution
    const protein = data.goal === 'build' ? 2.2 : 1.8; // g per kg
    const fat = 0.8; // g per kg
    const remainingCalories = targetCalories - (protein * weight * 4) - (fat * weight * 9);
    const carbs = remainingCalories / 4; // g

    return {
      calories: Math.round(targetCalories),
      protein: Math.round(protein * weight),
      fat: Math.round(fat * weight),
      carbs: Math.round(carbs),
      bmr: Math.round(bmr),
      tdee: Math.round(tdee)
    };
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    placeholder: string,
    keyboardType: 'numeric' | 'default' = 'default'
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        placeholderTextColor="#9ca3af"
      />
    </View>
  );

  const renderSelectionField = (
    label: string,
    value: string,
    options: { key: string; label: string; desc?: string }[],
    onSelect: (key: string) => void
  ) => (
    <View style={styles.selectionContainer}>
      <Text style={styles.inputLabel}>{label}</Text>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.option,
              value === option.key && styles.selectedOption
            ]}
            onPress={() => onSelect(option.key)}
          >
            <Text style={[
              styles.optionText,
              value === option.key && styles.selectedOptionText
            ]}>
              {option.label}
            </Text>
            {option.desc && (
              <Text style={[
                styles.optionDesc,
                value === option.key && styles.selectedOptionDesc
              ]}>
                {option.desc}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <LinearGradient
        colors={['#ffffff', '#fef7ff', '#f0f9ff']}
        style={styles.container}
      >
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading profile information...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
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
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Basic Information</Text>
            <View style={styles.sectionContent}>
              {renderInputField(
                'Height (cm)',
                userData.height,
                (text) => setUserData({...userData, height: text}),
                '170',
                'numeric'
              )}
              
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            <View style={styles.sectionContent}>
              {renderSelectionField(
                'Biological Sex',
                userData.biologicalSex,
                [
                  { key: 'male', label: 'Male' },
                  { key: 'female', label: 'Female' }
                ],
                (key) => setUserData({...userData, biologicalSex: key as 'male' | 'female'})
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Goals</Text>
            <View style={styles.sectionContent}>
              {renderSelectionField(
                'Goal',
                userData.goal,
                [
                  { key: 'build', label: '💪 Build Muscle', desc: 'Gain muscle mass' },
                  { key: 'lose', label: '🎯 Lose Fat', desc: 'Reduce body fat' },
                  { key: 'maintain', label: '⚖️ Maintain Weight', desc: 'Keep current weight' }
                ],
                (key) => setUserData({...userData, goal: key as 'build' | 'lose' | 'maintain'})
              )}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Activity Level</Text>
            <View style={styles.sectionContent}>
              {renderSelectionField(
                'Activity Level',
                userData.activityLevel,
                [
                  { key: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
                  { key: 'lightly', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
                  { key: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
                  { key: 'very', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
                  { key: 'extremely', label: 'Extremely Active', desc: 'Very hard exercise, physical job' }
                ],
                (key) => setUserData({...userData, activityLevel: key as any})
              )}
            </View>
          </View>

          

          <TouchableOpacity style={styles.saveButton} onPress={saveUserData}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  
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
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    color: '#1f2937',
  },
  selectionContainer: {
    marginBottom: 20,
  },
  optionsContainer: {
    gap: 12,
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  selectedOption: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedOptionText: {
    color: '#6366f1',
    fontWeight: '600',
  },
  selectedOptionDesc: {
    color: '#6366f1',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
