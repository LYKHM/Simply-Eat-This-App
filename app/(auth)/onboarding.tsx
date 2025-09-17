import { StyleSheet, Text, TouchableOpacity, View, StatusBar, TextInput, ScrollView } from 'react-native'
import React, { useState } from 'react'
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

interface UserData {
  height: string;
  weight: string;
  biologicalSex: 'male' | 'female';
  goal: 'build' | 'lose' | 'maintain';
  targetWeight: string;
  activityLevel: 'sedentary' | 'lightly' | 'moderate' | 'very' | 'extremely';
  dietChoice: 'anything' | 'keto' | 'vegan';
}

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [userData, setUserData] = useState<UserData>({
    height: '',
    weight: '',
    biologicalSex: 'male',
    goal: 'build',
    targetWeight: '',
    activityLevel: 'sedentary',
    dietChoice: 'anything'
  });

  const markOnboardingComplete = async () => {
    // Calculate and store all the data
    const calculatedData = calculateNutrition(userData);
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
    await AsyncStorage.setItem("nutritionData", JSON.stringify(calculatedData));
    await AsyncStorage.setItem("hasSeenOnboarding", "true"); // Set this as false when developing
    router.push("/");
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

  const calculateTimeToGoal = () => {
    const currentWeight = parseFloat(userData.weight);
    const targetWeight = parseFloat(userData.targetWeight);
  
    // Return 0 if weights are not valid numbers
    if (isNaN(currentWeight) || isNaN(targetWeight)) return 0;

    const difference = Math.abs(currentWeight - targetWeight);
    
    if (userData.goal === 'maintain') return 0;
    
    // Rough estimate: 0.5kg per week for weight loss, 0.25kg per week for muscle gain
    const weeklyChange = userData.goal === 'lose' ? 0.5 : 0.25;
    const weeks = Math.ceil(difference / weeklyChange);
    
    return weeks;
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <View 
          style={[styles.progressFill, { width: `${(currentStep / 7) * 100}%` }]}
        />
      </View>
      <Text style={styles.progressText}>{currentStep}/7</Text>
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.frostedGlass}>
      <Text style={styles.title}>Basic Information</Text>
      <Text style={styles.subtitle}>Let's start with your physical details</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Height (cm)</Text>
        <TextInput
          style={styles.input}
          value={userData.height}
          onChangeText={(text) => setUserData({...userData, height: text})}
          placeholder="170"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={userData.weight}
          onChangeText={(text) => setUserData({...userData, weight: text})}
          placeholder="70"
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.sexContainer}>
        <Text style={styles.label}>Biological Sex</Text>
        <View style={styles.sexButtons}>
          <TouchableOpacity 
            style={[
              styles.sexButton, 
              userData.biologicalSex === 'male' && styles.selectedSexButton
            ]}
            onPress={() => setUserData({...userData, biologicalSex: 'male'})}
          >
            <Text style={[
              styles.sexButtonText, 
              userData.biologicalSex === 'male' && styles.selectedSexButtonText
            ]}>
              Male
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.sexButton, 
              userData.biologicalSex === 'female' && styles.selectedSexButton
            ]}
            onPress={() => setUserData({...userData, biologicalSex: 'female'})}
          >
            <Text style={[
              styles.sexButtonText, 
              userData.biologicalSex === 'female' && styles.selectedSexButtonText
            ]}>
              Female
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.frostedGlass}>
      <Text style={styles.title}>What's your goal?</Text>
      <Text style={styles.subtitle}>Choose what you want to achieve</Text>
      
      <TouchableOpacity 
        style={[
          styles.option, 
          userData.goal === 'build' && styles.selectedOption
        ]}
        onPress={() => setUserData({...userData, goal: 'build'})}
      >
        <Text style={[
          styles.optionText, 
          userData.goal === 'build' && styles.selectedOptionText
        ]}>
          💪 Build Muscle
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.option, 
          userData.goal === 'lose' && styles.selectedOption
        ]}
        onPress={() => setUserData({...userData, goal: 'lose'})}
      >
        <Text style={[
          styles.optionText, 
          userData.goal === 'lose' && styles.selectedOptionText
        ]}>
          🎯 Lose Fat
        </Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.option, 
          userData.goal === 'maintain' && styles.selectedOption
        ]}
        onPress={() => setUserData({...userData, goal: 'maintain'})}
      >
        <Text style={[
          styles.optionText, 
          userData.goal === 'maintain' && styles.selectedOptionText
        ]}>
          ⚖️ Maintain Weight
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.frostedGlass}>
      <Text style={styles.title}>Target Weight</Text>
      <Text style={styles.subtitle}>
        {userData.goal === 'lose' ? 'What weight do you want to reach?' : 
         userData.goal === 'build' ? 'What weight do you want to reach?' : 
         'What weight do you want to maintain?'}
      </Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.label}>Target Weight (kg)</Text>
        <TextInput
          style={styles.input}
          value={userData.targetWeight}
          onChangeText={(text) => setUserData({...userData, targetWeight: text})}
          placeholder={userData.goal === 'lose' ? '65' : '75'}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />
      </View>

      {userData.goal !== 'maintain' && userData.weight && userData.targetWeight && (
        <View style={styles.timeEstimate}>
          <Text style={styles.timeEstimateText}>
            Estimated time to goal: {String(calculateTimeToGoal())} weeks
          </Text>
        </View>
      )}
    </View>
  );

  const renderStep4 = () => (
    <View style={styles.frostedGlass}>
      <Text style={styles.title}>Your Journey Timeline</Text>
      <Text style={styles.subtitle}>See how following this plan accelerates your progress</Text>
      
      <View style={styles.graphContainer}>
        <View style={styles.graphBar}>
          <View style={styles.graphBarFill} />
          <Text style={styles.graphLabel}>Without Plan</Text>
          <Text style={styles.graphValue}>
            {userData.goal === 'maintain' ? '0 weeks' :  `${String(calculateTimeToGoal() * 1.7)} weeks`}
            </Text>
        </View>
        
        <View style={styles.graphBar}>
         <View style={[
          styles.graphBarFillWithPlan, styles.graphBarFillAccelerated,
          ]} />
          <Text style={styles.graphLabel}>With Plan</Text>
          <Text style={styles.graphValue}>{userData.goal === 'maintain' ? '0 weeks' : `${String(calculateTimeToGoal())} weeks`}</Text>
        </View>
      </View>
      
      <Text style={styles.accelerationText}>
      🚀 You'll reach your goal {userData.goal === 'maintain' ? '0' : Math.round((calculateTimeToGoal() * 1.7) - calculateTimeToGoal())} weeks faster!
      </Text>
    </View>
  );

  const renderStep5 = () => (
    <View style={styles.frostedGlass}>
      <Text style={styles.title}>Activity Level</Text>
      <Text style={styles.subtitle}>How active are you on a typical week?</Text>
      
      {[
        { key: 'sedentary', label: 'Sedentary', desc: 'Little to no exercise' },
        { key: 'lightly', label: 'Lightly Active', desc: 'Light exercise 1-3 days/week' },
        { key: 'moderate', label: 'Moderately Active', desc: 'Moderate exercise 3-5 days/week' },
        { key: 'very', label: 'Very Active', desc: 'Hard exercise 6-7 days/week' },
        { key: 'extremely', label: 'Extremely Active', desc: 'Very hard exercise, physical job' }
      ].map((activity) => (
        <TouchableOpacity 
          key={activity.key}
          style={[
            styles.option, 
            userData.activityLevel === activity.key && styles.selectedOption
          ]}
          onPress={() => setUserData({...userData, activityLevel: activity.key as any})}
        >
          <Text style={[
            styles.optionText, 
            userData.activityLevel === activity.key && styles.selectedOptionText
          ]}>
            {activity.label}
          </Text>
          <Text style={[
            styles.optionDesc, 
            userData.activityLevel === activity.key && styles.selectedOptionDesc
          ]}>
            {activity.desc}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep6 = () => (
    <View style={styles.frostedGlass}>
      <Text style={styles.title}>Diet Preference</Text>
      <Text style={styles.subtitle}>Choose your dietary approach</Text>
      
      {[
        { key: 'anything', label: 'Anything Goes', desc: 'Most Popular' },
        { key: 'keto', label: 'Keto', desc: 'Burn Fat Faster' },
        { key: 'vegan', label: 'Vegan', desc: 'Plant-based only' },
        { key: 'paleo', label: 'Paleo', desc: 'Popular Among Athletes' }
      ].map((diet) => (
        <TouchableOpacity 
          key={diet.key}
          style={[
            styles.option, 
            userData.dietChoice === diet.key && styles.selectedOption
          ]}
          onPress={() => setUserData({...userData, dietChoice: diet.key as any})}
        >
          <Text style={[
            styles.optionText, 
            userData.dietChoice === diet.key && styles.selectedOptionText
          ]}>
            {diet.label}
          </Text>
          <Text style={[
            styles.optionDesc, 
            userData.dietChoice === diet.key && styles.selectedOptionDesc
          ]}>
            {diet.desc}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderStep7 = () => {
    const nutritionData = calculateNutrition(userData);
    
    return (
      <View style={styles.frostedGlass}>
        <Text style={styles.title}>Your Nutrition Plan</Text>
        <Text style={styles.subtitle}>Here's what you need to reach your goal</Text>
        
        <View style={styles.nutritionContainer}>
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionValue}>{nutritionData.calories}</Text>
            <Text style={styles.nutritionLabel}>Calories</Text>
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionValue}>{nutritionData.protein}g</Text>
            <Text style={styles.nutritionLabel}>Protein</Text>
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionValue}>{nutritionData.carbs}g</Text>
            <Text style={styles.nutritionLabel}>Carbs</Text>
          </View>
          
          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionValue}>{nutritionData.fat}g</Text>
            <Text style={styles.nutritionLabel}>Fat</Text>
          </View>
        </View>

        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>Plan Summary</Text>
          <Text style={styles.summaryText}>
            • {userData.goal === 'lose' ? 'Weight loss' : userData.goal === 'build' ? 'Muscle building' : 'Weight maintenance'} plan
          </Text>
          <Text style={styles.summaryText}>
            • {userData.activityLevel} activity level
          </Text>
          <Text style={styles.summaryText}>
            • {userData.dietChoice} diet preference
          </Text>
          <Text style={styles.summaryText}>
            • Target: {userData.targetWeight}kg in {calculateTimeToGoal()} weeks
          </Text>
        </View>
        
        <View style={styles.citationNotice}>
          <Text style={styles.citationNoticeText}>
            📚 All calculations based on peer-reviewed scientific research
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.citationLink}
          onPress={() => router.push('/citations')}
        >
          <Text style={styles.citationLinkText}>View sources and calculation methods</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return userData.height && userData.weight;
      case 2: return userData.goal;
      case 3: return userData.targetWeight;
      case 4: return true; // Info page
      case 5: return userData.activityLevel;
      case 6: return userData.dietChoice;
      case 7: return true; // Results page
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed()) {
      if (currentStep === 7) {
        markOnboardingComplete();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      case 6: return renderStep6();
      case 7: return renderStep7();
      default: return renderStep1();
    }
  };

  return (
    <LinearGradient
      colors={['#ffffff', '#e3f2fd', '#fce4ec']}
      style={styles.container}
    >
      <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        
        {renderProgressBar()}
        
        <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        <View style={styles.buttonContainer}>
          {currentStep > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[
              styles.nextButton, 
              !canProceed() && styles.nextButtonDisabled
            ]}
            onPress={handleNext}
            disabled={!canProceed()}
          >
            <Text style={[
              styles.nextButtonText, 
              !canProceed() && styles.nextButtonTextDisabled
            ]}>
              {currentStep === 7 ? 'Get Started' : 'Next'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  
  progressContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  scrollContainer: {
    flex: 1,
  },
  frostedGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    padding: 20,
    margin: 20,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    //shadowColor: '#000',
    //shadowOffset: {
    //  width: 0,
    //  height: 4,
    //},
    //shadowOpacity: 0.1,
    //shadowRadius: 10,
    //elevation: 8,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
    //backdropFilter: 'blur(10px)',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: '#333333',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    color: '#000000',
  },
  sexContainer: {
    marginBottom: 24,
  },
  sexButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sexButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  selectedSexButton: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  sexButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  selectedSexButtonText: {
    color: '#ffffff',
  },
  option: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  selectedOption: {
    borderColor: '#000000',
    backgroundColor: '#000000',
  },
  optionText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionDesc: {
    fontSize: 14,
    color: '#333333',
    textAlign: 'center',
  },
  selectedOptionText: {
    color: '#ffffff',
  },
  selectedOptionDesc: {
    color: '#ffffff',
  },
  timeEstimate: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#000000',
    marginTop: 16,
  },
  timeEstimateText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
  },
  graphContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 30,
  },
  graphBar: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  graphBarFill: {
    width: 60,
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    marginBottom: 8,
  },
  graphBarFillWithPlan:{
    width: 60,
    height: 120 * 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 8,
    marginBottom: 8,
  },
  graphBarFillAccelerated: {
    backgroundColor: '#000000',
  },
  graphLabel: {
    fontSize: 14,
    color: '#333333',
    marginBottom: 4,
  },
  graphValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  accelerationText: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 20,
  },
  nutritionContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 20,
  },
  nutritionCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  nutritionValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  nutritionLabel: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '600',
  },
  summaryContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    padding: 20,
    borderRadius: 12,
    marginTop: 20,
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 16,
    textAlign: 'center',
  },
  summaryText: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 8,
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  backButton: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#000000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  backButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  nextButton: {
    flex: 2,
    backgroundColor: '#000000',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  nextButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  nextButtonTextDisabled: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  citationNotice: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.2)',
  },
  citationNoticeText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#000000',
    fontWeight: '500',
  },
  citationLink: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.3)',
    backgroundColor: 'rgba(99, 102, 241, 0.08)'
  },
  citationLinkText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#4f46e5',
    fontWeight: '600'
  },
});

export default Onboarding;