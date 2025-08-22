import { StyleSheet, Text, TouchableOpacity, View, StatusBar } from 'react-native'
import React, { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [goal, setGoal] = useState('');
  const [experience, setExperience] = useState('');

  const markOnboardingComplete = async () => {
    await AsyncStorage.setItem("hasSeenOnboarding", "true");
    router.push("/");
  };

  const handleNext = () => {
    if (currentStep === 1 && goal) {
      setCurrentStep(2);
    } else if (currentStep === 2 && experience) {
      markOnboardingComplete();
    }
  };

  const renderStep1 = () => (
    <View style={styles.container}>
      <Text style={styles.title}>What's your main goal?</Text>
      <Text style={styles.subtitle}>Help us personalize your meal planning experience</Text>
      
      <TouchableOpacity 
        style={[styles.option, goal === 'lose' && styles.selectedOption]} 
        onPress={() => setGoal('lose')}
      >
        <Text style={[styles.optionText, goal === 'lose' && styles.selectedOptionText]}>
          🎯 Lose Weight
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.option, goal === 'maintain' && styles.selectedOption]} 
        onPress={() => setGoal('maintain')}
      >
        <Text style={[styles.optionText, goal === 'maintain' && styles.selectedOptionText]}>
          ⚖️ Maintain Weight
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.option, goal === 'gain' && styles.selectedOption]} 
        onPress={() => setGoal('gain')}
      >
        <Text style={[styles.optionText, goal === 'gain' && styles.selectedOptionText]}>
          💪 Gain Muscle
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.container}>
      <Text style={styles.title}>What's your experience level?</Text>
      <Text style={styles.subtitle}>We'll adjust the complexity of your meal plans</Text>
      
      <TouchableOpacity 
        style={[styles.option, experience === 'beginner' && styles.selectedOption]} 
        onPress={() => setExperience('beginner')}
      >
        <Text style={[styles.optionText, experience === 'beginner' && styles.selectedOptionText]}>
          🌱 Beginner - New to meal planning
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.option, experience === 'intermediate' && styles.selectedOption]} 
        onPress={() => setExperience('intermediate')}
      >
        <Text style={[styles.optionText, experience === 'intermediate' && styles.selectedOptionText]}>
          🚀 Intermediate - Some experience
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[styles.option, experience === 'advanced' && styles.selectedOption]} 
        onPress={() => setExperience('advanced')}
      >
        <Text style={[styles.optionText, experience === 'advanced' && styles.selectedOptionText]}>
          🎯 Advanced - Experienced planner
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        <View style={[styles.progressDot, currentStep >= 1 && styles.progressDotActive]} />
        <View style={[styles.progressDot, currentStep >= 2 && styles.progressDotActive]} />
      </View>

      {currentStep === 1 ? renderStep1() : renderStep2()}

      <TouchableOpacity 
        style={[styles.nextButton, (!goal && currentStep === 1) || (!experience && currentStep === 2) ? styles.nextButtonDisabled : null]} 
        onPress={handleNext}
        disabled={(!goal && currentStep === 1) || (!experience && currentStep === 2)}
      >
        <Text style={styles.nextButtonText}>
          {currentStep === 2 ? 'Get Started' : 'Next'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
    justifyContent: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  progressDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#333',
    marginHorizontal: 6,
  },
  progressDotActive: {
    backgroundColor: '#4CAF50',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 22,
  },
  option: {
    backgroundColor: '#2a2a2a',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: '#4CAF50',
    backgroundColor: '#2d4a2d',
  },
  optionText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedOptionText: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
    padding: 16,
    borderRadius: 12,
    marginTop: 40,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#555',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default Onboarding;