import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
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

const goalOptions = [
  {
    value: 'lose',
    label: 'Lose Fat',
    description: 'Reduce body fat and lose weight',
    icon: '📉'
  },
  {
    value: 'maintain',
    label: 'Maintain Weight',
    description: 'Keep current weight and body composition',
    icon: '⚖️'
  },
  {
    value: 'build',
    label: 'Build Muscle',
    description: 'Gain muscle mass and strength',
    icon: '💪'
  }
];

export default function WeightGoalScreen() {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData>({
    height: '',
    weight: '',
    biologicalSex: 'male',
    goal: 'maintain',
    targetWeight: '',
    activityLevel: 'moderate',
    dietChoice: 'anything'
  });
  const [selectedGoal, setSelectedGoal] = useState<string>('');
  const [currentWeight, setCurrentWeight] = useState<string>('');
  const [targetWeight, setTargetWeight] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load user data
      const userDataString = await AsyncStorage.getItem("userData");
      if (userDataString) {
        const data: UserData = JSON.parse(userDataString);
        setUserData(data);
        setSelectedGoal(data.goal);
        setCurrentWeight(data.weight);
        setTargetWeight(data.targetWeight);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveGoal = async () => {
    try {
      const updatedUserData = {
        ...userData,
        goal: selectedGoal as 'build' | 'lose' | 'maintain',
        weight: currentWeight,
        targetWeight: targetWeight
      };

      await AsyncStorage.setItem("userData", JSON.stringify(updatedUserData));
      setUserData(updatedUserData);
      
      Alert.alert('Success', 'Goal and weight updated successfully!');
    } catch (error) {
      console.error('Error saving goal:', error);
      Alert.alert('Error', 'Failed to save goal');
    }
  };

  const renderGoalOption = (option: typeof goalOptions[0]) => (
    <TouchableOpacity
      key={option.value}
      style={[
        styles.goalOption,
        selectedGoal === option.value && styles.selectedGoalOption
      ]}
      onPress={() => setSelectedGoal(option.value)}
    >
      <Text style={styles.goalIcon}>{option.icon}</Text>
      <View style={styles.goalTextContainer}>
        <Text style={[
          styles.goalLabel,
          selectedGoal === option.value && styles.selectedGoalLabel
        ]}>
          {option.label}
        </Text>
        <Text style={[
          styles.goalDescription,
          selectedGoal === option.value && styles.selectedGoalDescription
        ]}>
          {option.description}
        </Text>
      </View>
      {selectedGoal === option.value && (
        <Ionicons name="checkmark-circle" size={24} color="#6366f1" />
      )}
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading weight and goal data...</Text>
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
          <Text style={styles.headerTitle}>Weight & Goal</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.content}>
          <Text style={styles.subtitle}>
            Set your fitness goal and current weight information.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Fitness Goal</Text>
            <Text style={styles.sectionSubtitle}>
              Choose your primary fitness objective
            </Text>
            <View style={styles.sectionContent}>
              {goalOptions.map(renderGoalOption)}
            </View>
          </View>

          {selectedGoal !== 'maintain' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weight Tracking</Text>
              <Text style={styles.sectionSubtitle}>
                Update your current weight and target
              </Text>
              <View style={styles.sectionContent}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Current Weight</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={currentWeight}
                      onChangeText={setCurrentWeight}
                      placeholder="70"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                    <Text style={styles.unitText}>kg</Text>
                  </View>
                </View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Target Weight</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      style={styles.input}
                      value={targetWeight}
                      onChangeText={setTargetWeight}
                      placeholder="75"
                      keyboardType="numeric"
                      placeholderTextColor="#9ca3af"
                    />
                    <Text style={styles.unitText}>kg</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={saveGoal}>
            <Text style={styles.saveButtonText}>Save Goal & Weight</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f9ff',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedGoalOption: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  goalIcon: {
    fontSize: 24,
    marginRight: 16,
  },
  goalTextContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
  },
  goalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  selectedGoalLabel: {
    color: '#6366f1',
  },
  goalDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectedGoalDescription: {
    color: '#6366f1',
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
