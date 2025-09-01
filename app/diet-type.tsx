import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
//import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

interface UserData {
  height: string;
  weight: string;
  biologicalSex: 'male' | 'female';
  goal: 'build' | 'lose' | 'maintain';
  targetWeight: string;
  activityLevel: 'sedentary' | 'lightly' | 'moderate' | 'very' | 'extremely';
  dietChoice: 'anything' | 'keto' | 'vegan';
}

const dietOptions = [
  {
    key: 'anything',
    label: 'Anything',
    description: 'Most Popular',
  //  icon: '🍽️',
    details: 'No dietary restrictions. Enjoy a variety of foods while meeting your nutrition goals.'
  },
  {
    key: 'keto',
    label: 'Keto',
    description: 'Burn Fat Faster',
 //   icon: '🥑',
    details: 'Low-carb, high-fat diet that helps your body burn fat for energy instead of carbohydrates.'
  },
  {
    key: 'vegan',
    label: 'Vegan',
    description: 'Plant-based only',
   // icon: '🌱',
    details: 'Plant-based diet that excludes all animal products including meat, dairy, and eggs.'
  }
];

export default function DietTypeScreen() {
  const router = useRouter();
  const [selectedDiet, setSelectedDiet] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCurrentDiet();
  }, []);

  const loadCurrentDiet = async () => {
    try {
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const userData: UserData = JSON.parse(userDataString);
        setSelectedDiet(userData.dietChoice);
      }
    } catch (error) {
      console.error('Error loading current diet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveDietChoice = async () => {
    if (!selectedDiet) {
      Alert.alert('Selection Required', 'Please select a diet type before saving.');
      return;
    }

    try {
      // Load current user data
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const userData: UserData = JSON.parse(userDataString);
        
        // Update diet choice
        const updatedUserData = {
          ...userData,
          dietChoice: selectedDiet as 'anything' | 'keto' | 'vegan'
        };
        
        // Save updated user data
        await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
        
        Alert.alert('Success', 'Diet preference updated successfully!');
        router.back();
      }
    } catch (error) {
      console.error('Error saving diet choice:', error);
      Alert.alert('Error', 'Failed to save diet preference');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading diet preferences...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Primary Diet Type</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Choose your primary dietary approach. This will help us recommend meals that align with your preferences.
          </Text>

          <View style={styles.optionsContainer}>
            {dietOptions.map((diet) => (
              <TouchableOpacity
                key={diet.key}
                style={[
                  styles.dietOption,
                  selectedDiet === diet.key && styles.selectedDietOption
                ]}
                onPress={() => setSelectedDiet(diet.key)}
              >
                <View style={styles.dietHeader}>
                  <View style={styles.dietInfo}>
                    <Text style={[
                      styles.dietLabel,
                      selectedDiet === diet.key && styles.selectedDietLabel
                    ]}>
                      {diet.label}
                    </Text>
                    <Text style={[
                      styles.dietDescription,
                      selectedDiet === diet.key && styles.selectedDietDescription
                    ]}>
                      {diet.description}
                    </Text>
                  </View>
                  {selectedDiet === diet.key && (
                    <View style={styles.checkmarkContainer}>
                      <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
                    </View>
                  )}
                </View>
                <Text style={[
                  styles.dietDetails,
                  selectedDiet === diet.key && styles.selectedDietDetails
                ]}>
                  {diet.details}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity 
            style={[
              styles.saveButton,
              !selectedDiet && styles.saveButtonDisabled
            ]} 
            onPress={saveDietChoice}
            disabled={!selectedDiet}
          >
            <Text style={[
              styles.saveButtonText,
              !selectedDiet && styles.saveButtonTextDisabled
            ]}>
              Save Diet Preference
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
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
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  optionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  dietOption: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  selectedDietOption: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(255, 255, 255, 1)',
  },
  dietHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
   
  },
  dietIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  dietIcon: {
    fontSize: 24,
  },
  dietInfo: {
    flex: 1,
    backgroundColor: 'white',
  },
  dietLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedDietLabel: {
    color: '#6366f1',
  },
  dietDescription: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  selectedDietDescription: {
    color: '#6366f1',
  },
  checkmarkContainer: {
    marginLeft: 8,
  },
  dietDetails: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  selectedDietDetails: {
    color: '#6366f1',
  },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  saveButtonDisabled: {
    backgroundColor: '#e5e7eb',
    shadowOpacity: 0,
    elevation: 0,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    color: '#9ca3af',
  },
});
