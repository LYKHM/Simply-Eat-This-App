import React, { useMemo, useState, useEffect,useCallback, useRef, use } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, PanResponder, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import DonutChart from '@/components/DonutChart';
import MealCard, { MealItem } from '@/components/MealCard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo'
import Meal from '@/components/Meal';
import EmptyMeal from '@/components/EmptyMeal';
import WeeklyPerformance from '@/components/WeeklyPerformance';
import { router } from 'expo-router';
//import { useSubscription } from '@/lib/subscriptionService';

import { requestTrackingPermissionsAsync } from 'expo-tracking-transparency';


function SwipeRow({ children, onDelete }: { children: React.ReactNode; onDelete: () => void }) {
  const translateX = useRef(new Animated.Value(0)).current;
  const maxLeft = -76;



  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: (_e, g) => {
        const next = Math.min(0, Math.max(maxLeft, g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        const shouldOpen = g.dx < -30 || (translateX as any)._value < maxLeft / 2;
        Animated.spring(translateX, {
          toValue: shouldOpen ? maxLeft : 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  return (
    <View style={{ marginVertical: 4 }}>
      <View style={styles.swipeBehind}> 
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Ionicons name="trash" size={22} color="#fff" />
        </Pressable>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        {children}
      </Animated.View>
    </View>
  );
}


type MealPlan = {
  meals: Array<{
    label: string;
    labelCalories: number;
    diet: string;
    meals: Array<{
      recipeId: number;
      image: string;
      name: string;
      scaledCalories: number;
      scaledProtein: number;
      scaledCarbs: number;
      scaledFat: number;
      servings: number;
      diet: string;
    }>;
  }>;
  TARGET_PER_MEAL: number;
  totalDailyCalories: number;
  totalDailyProtein: number;
  totalDailyCarbs: number;
  totalDailyFat: number;
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = Dimensions.get('window');
  
  // Subscription state
  //const { isSubscribed, loading: subscriptionLoading, refreshStatus } = useSubscription();

  useEffect(() => {
    (async () => {
      const { status } = await requestTrackingPermissionsAsync();
      if (status === 'granted') {
        console.log('Yay! I have user permission to track data');
      }
    })();
  }, []);

  // Load daily meals on component mount
  useEffect(() => {
    const initializeMeals = async () => {
      const hasDailyMeals = await loadDailyMeals();
      if (!hasDailyMeals) {
        // If no daily meals exist, don't create empty meal plan automatically
        // Let user choose what to do with the buttons
        console.log('No daily meals found for today - showing choice buttons');
      }
    };
    
    initializeMeals();
  }, []);

  //Sneak peak into the data from the onboarding
  
  /*
  const lookAtData = async () => {
    const userDataString = await AsyncStorage.getItem("userData");
    const userData = userDataString ? JSON.parse(userDataString) : null;
    const nutritionDataString = await AsyncStorage.getItem("nutritionData");
    const nutritionData = nutritionDataString ? JSON.parse(nutritionDataString) : null;
    console.log("userData", userData);
    console.log("nutritionData", nutritionData);
  }

  useEffect(() => {
    lookAtData();
  }, []);
  */
  


  const { user, isLoaded } = useUser();
  //console.log("Do i have the suer data in the home screen? user: ", user)
  // Separate states for different meal plan types
  const [generatedMealPlan, setGeneratedMealPlan] = useState<MealPlan | null>(null);
  const [emptyMealPlan, setEmptyMealPlan] = useState<MealPlan | null>(null);
  const [mealPlanType, setMealPlanType] = useState<'generated' | 'empty' | null>(null);
  //console.log('mealPlanType', mealPlanType);
  const [time, setTime] = useState(20);
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Computed value for current meal plan data
  const mealPlanData = mealPlanType === 'generated' ? generatedMealPlan : emptyMealPlan;
  const isEmptyPlan = mealPlanType === 'empty';

  // Add this before the render to debug
  
      
  // Weekly performance data
  const [currentWeekCalories, setCurrentWeekCalories] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [previousWeekCalories, setPreviousWeekCalories] = useState([0, 0, 0, 0, 0, 0, 0]);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);
  
  // Checkmark state management
  const [checkedMeals, setCheckedMeals] = useState<boolean[][]>([]);
  const [macroLimits, setMacroLimits] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });

  // Modal state
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [modalOpacity] = useState(new Animated.Value(0));
  const [modalScale] = useState(new Animated.Value(0.8));


    // Load user's nutrition data on component mount
    // I need to load the users nutrition data from the database.
    useEffect(() => {
      const loadUserData = async () => {
        const nutritionDataString = await AsyncStorage.getItem("nutritionData");
        if (nutritionDataString) {
          const nutritionData = JSON.parse(nutritionDataString);
          setMacroLimits({
            calories: nutritionData.calories,
            protein: nutritionData.protein,
            carbs: nutritionData.carbs,
            fat: nutritionData.fat,
          });
        }
      };
      loadUserData();
    }, []);

    
    // Calculate totals only from checked meals
    const totals = useMemo(() => {
      const result = {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      };
    
      if (mealPlanData?.meals && checkedMeals.length > 0) {
        mealPlanData.meals.forEach((group, groupIndex) => {
          group.meals.forEach((meal, mealIndex) => {
            if (checkedMeals[groupIndex]?.[mealIndex]) {
              result.calories += meal.scaledCalories || 0;
              result.protein += meal.scaledProtein || 0;
              result.carbs += meal.scaledCarbs || 0;
              result.fat += meal.scaledFat || 0;
            }
          });
        });
      }
    
      return result;
    }, [mealPlanData, checkedMeals]); // Recalculate when these change

  /*
  const removeMeal = useCallback((section: keyof MealPlan, id: string) => {
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: prev[section].filter((m) => m.id !== id),
      };
    });
  }, []);
  */

  const renderRightActions = (onDelete: () => void) => (
    <View style={styles.swipeBehind}>
      <Pressable onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="trash" size={22} color="#fff" />
      </Pressable>
    </View>
  );

  // The refresh function
  const getMealByRecipeId = (recipeId: any) => {
    if (!mealPlanData || !mealPlanData.meals) return null;
  
    for (const group of mealPlanData.meals) {
      const found = group.meals.find((meal) => meal.recipeId === recipeId);
      if (found) {
        return {
          ...found,
          label: group.label,
          labelCalories: group.labelCalories,
          eventDiet: group.diet
        };
      }
    }
  
    return null;
  };


  const GenerateDailyMealPlan = async () => {
   
    if (!user) return;
    
    try {

      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ChosenDiet: "Keto",   //Hardcoded for now
          ChosenCalories: 2800,
          ChosenTime: 10,
          ChosenMeals: 3,
          clerk_id: user.id // This will save the meal plan to the database
        }),
      });
      
      if (response.ok) {
        const mealPlan = await response.json();
        
        // The meal plan is now saved to the database and returned
        setGeneratedMealPlan(mealPlan);
        setMealPlanType('generated');
        
        // Record daily performance after meal plan is generated
        await recordDailyPerformance();
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
    }
  };


  const copyYesterDayMealPlan = async () => {
    if (!user) return;

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayDate = yesterday.toISOString().split('T')[0];

    console.log("Yesterday's date:", yesterdayDate);

    try {
      console.log("Copying yesterday's meal plan:", `${process.env.EXPO_PUBLIC_API_BASE}/api/copy-yesterday/${user.id}/${yesterdayDate}`);
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/copy-yesterday/${user.id}/${yesterdayDate}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to copy yesterday\'s meal plan');
      }

      const data = await response.json();
      console.log("Yesterday's meal plan copied:", data);
      
      // Set the copied meal plan as the current meal plan
      setGeneratedMealPlan(data);
      setMealPlanType('generated');
      
      // Initialize checkmarks for the copied meals
      if (data.meals) {
        const initialCheckedMeals = data.meals.map((group: any) => 
          group.meals.map(() => false)
        );
        setCheckedMeals(initialCheckedMeals);
      }
      
      // Record daily performance for the copied meal plan
      await recordDailyPerformance();
      
    } catch (error) {
      console.error('Error copying yesterdays meal plan:', error);
    }
  }

  const createEmptyMealPlan = async () => {
    const emptyMealPlan: MealPlan = {
      meals: [
        {
          label: "Breakfast",
          labelCalories: 0,
          diet: "mixed",
          meals: [
            { recipeId: 0, image: "", name: "", scaledCalories: 0, scaledProtein: 0, scaledCarbs: 0, scaledFat: 0, servings: 0, diet: "" },
            { recipeId: 0, image: "", name: "", scaledCalories: 0, scaledProtein: 0, scaledCarbs: 0, scaledFat: 0, servings: 0, diet: "" }
          ]
        },
        {
          label: "Lunch", 
          labelCalories: 0,
          diet: "mixed",
          meals: [
            { recipeId: 0, image: "", name: "", scaledCalories: 0, scaledProtein: 0, scaledCarbs: 0, scaledFat: 0, servings: 0, diet: "" },
            { recipeId: 0, image: "", name: "", scaledCalories: 0, scaledProtein: 0, scaledCarbs: 0, scaledFat: 0, servings: 0, diet: "" }
          ]
        },
        {
          label: "Dinner",
          labelCalories: 0, 
          diet: "mixed",
          meals: [
            { recipeId: 0, image: "", name: "", scaledCalories: 0, scaledProtein: 0, scaledCarbs: 0, scaledFat: 0, servings: 0, diet: "" },
            { recipeId: 0, image: "", name: "", scaledCalories: 0, scaledProtein: 0, scaledCarbs: 0, scaledFat: 0, servings: 0, diet: "" }
          ]
        }
      ],
      TARGET_PER_MEAL: macroLimits.calories / 3,
      totalDailyCalories: 0,
      totalDailyProtein: 0,
      totalDailyCarbs: 0,
      totalDailyFat: 0
    };

    setEmptyMealPlan(emptyMealPlan);
    setMealPlanType('empty');
    
    // Initialize empty checkmarks
    const initialCheckedMeals = emptyMealPlan.meals.map(() => [false, false]);
    setCheckedMeals(initialCheckedMeals);

    // Save the empty meal plan to AsyncStorage. BUT WHY?? Because they are the empty cards
    await saveDailyMeals(emptyMealPlan);
  };

  // Handle recipe selection from EmptyMeal (saved recipes from AsyncStorage)
  const handleSavedRecipeSelected = async (groupIndex: number, mealIndex: number, savedRecipe: any) => {
    if (!emptyMealPlan) return;

    const updatedMealPlan = { ...emptyMealPlan };
    const mealGroup = updatedMealPlan.meals[groupIndex];
    
    // Convert saved recipe format to meal plan format
    mealGroup.meals[mealIndex] = {
      recipeId: savedRecipe.id,
      image: '', // No image in saved recipes
      name: savedRecipe.name,
      scaledCalories: savedRecipe.calories, // Use original calories
      scaledProtein: savedRecipe.protein_g, // Use original protein_g
      scaledCarbs: savedRecipe.carbs_g, // Use original carbs_g
      scaledFat: savedRecipe.fat_g, // Use original fat_g
      servings: 1, // Default to 1 serving
      diet: 'anything' // Default diet
    };

    // Recalculate group totals
    mealGroup.labelCalories = mealGroup.meals.reduce((sum, meal) => sum + meal.scaledCalories, 0);

    // Recalculate daily totals
    const allMeals = updatedMealPlan.meals.flatMap(group => group.meals);
    updatedMealPlan.totalDailyCalories = allMeals.reduce((sum, meal) => sum + meal.scaledCalories, 0);
    updatedMealPlan.totalDailyProtein = allMeals.reduce((sum, meal) => sum + meal.scaledProtein, 0);
    updatedMealPlan.totalDailyCarbs = allMeals.reduce((sum, meal) => sum + meal.scaledCarbs, 0);
    updatedMealPlan.totalDailyFat = allMeals.reduce((sum, meal) => sum + meal.scaledFat, 0);

    setEmptyMealPlan(updatedMealPlan);

    // Save to daily meals AsyncStorage
    console.log('Saving updated meal plan with SavedRecipe to AsyncStorage');
    await saveDailyMeals(updatedMealPlan);
  };

  // Handle recipe selection from backend (scaled recipes from generate button)
  // Why do I need this function again?
  const handleRecipeSelected = (groupIndex: number, mealIndex: number, recipe: any) => {
    if (!generatedMealPlan) return;

    const updatedMealPlan = { ...generatedMealPlan };
    const mealGroup = updatedMealPlan.meals[groupIndex];
    
    // Update the specific meal slot (backend already provides scaled values)
    mealGroup.meals[mealIndex] = {
      recipeId: recipe.id,
      image: recipe.image,
      name: recipe.name,
      scaledCalories: recipe.scaledCalories,
      scaledProtein: recipe.scaledProtein,
      scaledCarbs: recipe.scaledCarbs,
      scaledFat: recipe.scaledFat,
      servings: recipe.servings,
      diet: recipe.diet
    };

    // Recalculate group totals
    mealGroup.labelCalories = mealGroup.meals.reduce((sum, meal) => sum + meal.scaledCalories, 0);

    // Recalculate daily totals
    const allMeals = updatedMealPlan.meals.flatMap(group => group.meals);
    updatedMealPlan.totalDailyCalories = allMeals.reduce((sum, meal) => sum + meal.scaledCalories, 0);
    updatedMealPlan.totalDailyProtein = allMeals.reduce((sum, meal) => sum + meal.scaledProtein, 0);
    updatedMealPlan.totalDailyCarbs = allMeals.reduce((sum, meal) => sum + meal.scaledCarbs, 0);
    updatedMealPlan.totalDailyFat = allMeals.reduce((sum, meal) => sum + meal.scaledFat, 0);

    setGeneratedMealPlan(updatedMealPlan);
  };  //abs

  // Update meal macros when a card refreshes its recipe
  const handleMealRefreshed = async (groupIndex: number, mealIndex: number, updated: any) => {
    try {
      if (mealPlanType === 'generated' && generatedMealPlan) {
        const updatedPlan: MealPlan = { ...generatedMealPlan } as MealPlan;
        const group = updatedPlan.meals[groupIndex];
        group.meals[mealIndex] = {
          recipeId: Number(updated.recipeId ?? updated.id ?? group.meals[mealIndex].recipeId),
          image: updated.image || '',
          name: updated.name || updated.title || group.meals[mealIndex].name,
          scaledCalories: Number(updated.scaledCalories ?? updated.calories ?? 0),
          scaledProtein: Number(updated.scaledProtein ?? updated.protein ?? 0),
          scaledCarbs: Number(updated.scaledCarbs ?? updated.carbs ?? 0),
          scaledFat: Number(updated.scaledFat ?? updated.fat ?? 0),
          servings: Number(updated.servings ?? group.meals[mealIndex].servings ?? 1),
          diet: updated.diet || group.diet,
        };
        group.labelCalories = group.meals.reduce((sum, m) => sum + (m.scaledCalories || 0), 0);
        const all = updatedPlan.meals.flatMap(g => g.meals);
        updatedPlan.totalDailyCalories = all.reduce((s, m) => s + (m.scaledCalories || 0), 0);
        updatedPlan.totalDailyProtein = all.reduce((s, m) => s + (m.scaledProtein || 0), 0);
        updatedPlan.totalDailyCarbs = all.reduce((s, m) => s + (m.scaledCarbs || 0), 0);
        updatedPlan.totalDailyFat = all.reduce((s, m) => s + (m.scaledFat || 0), 0);
        setGeneratedMealPlan(updatedPlan);
      } else if (isEmptyPlan && emptyMealPlan) {
        const updatedPlan: MealPlan = { ...emptyMealPlan } as MealPlan;
        const group = updatedPlan.meals[groupIndex];
        group.meals[mealIndex] = {
          recipeId: Number(updated.recipeId ?? updated.id ?? group.meals[mealIndex].recipeId),
          image: updated.image || '',
          name: updated.name || updated.title || group.meals[mealIndex].name,
          scaledCalories: Number(updated.scaledCalories ?? updated.calories ?? 0),
          scaledProtein: Number(updated.scaledProtein ?? updated.protein ?? 0),
          scaledCarbs: Number(updated.scaledCarbs ?? updated.carbs ?? 0),
          scaledFat: Number(updated.scaledFat ?? updated.fat ?? 0),
          servings: Number(updated.servings ?? group.meals[mealIndex].servings ?? 1),
          diet: updated.diet || group.diet,
        };
        group.labelCalories = group.meals.reduce((sum, m) => sum + (m.scaledCalories || 0), 0);
        const all = updatedPlan.meals.flatMap(g => g.meals);
        updatedPlan.totalDailyCalories = all.reduce((s, m) => s + (m.scaledCalories || 0), 0);
        updatedPlan.totalDailyProtein = all.reduce((s, m) => s + (m.scaledProtein || 0), 0);
        updatedPlan.totalDailyCarbs = all.reduce((s, m) => s + (m.scaledCarbs || 0), 0);
        updatedPlan.totalDailyFat = all.reduce((s, m) => s + (m.scaledFat || 0), 0);
        setEmptyMealPlan(updatedPlan);
        await saveDailyMeals(updatedPlan);
      }
    } catch (e) {
      console.error('Error applying refreshed meal to plan:', e);
    }
  };

  // Save daily meals to AsyncStorage
  const saveDailyMeals = async (mealPlan: MealPlan) => {
    try {      
      const today = new Date().toISOString().split('T')[0];
      console.log('Save - Today string:', today);
      const dailyMealsKey = `dailyMeals_${today}`;
      console.log('Saving to key:', dailyMealsKey);
      await AsyncStorage.setItem(dailyMealsKey, JSON.stringify(mealPlan));
      console.log('Daily meals saved for', today);
    } catch (error) {
      console.error('Error saving daily meals:', error);
    }
  };

  // Load daily meals from AsyncStorage
  const loadDailyMeals = async () => {
  console.log("Loading daily meals from AsyncStorage");
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('Today string:', today);
      const dailyMealsKey = `dailyMeals_${today}`;
      console.log('Looking for key:', dailyMealsKey);
      const savedMeals = await AsyncStorage.getItem(dailyMealsKey); // returns a bunch of "" 
      console.log('The asyncStorage for SavedMeals:', savedMeals);
      
      if (savedMeals) {
        const mealPlan = JSON.parse(savedMeals);
        setEmptyMealPlan(mealPlan);
        console.log('Daily meals loaded for', today);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error loading daily meals:', error);
      return false;
    }
  };

  // Record daily performance
  const recordDailyPerformance = async () => {
    if (!user || !mealPlanData) return;
    
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      // Calculate totals only from checked meals
      let totalCalories = 0;
      let totalProtein = 0;
      let totalCarbs = 0;
      let totalFat = 0;

      if (checkedMeals.length > 0) {
        mealPlanData.meals.forEach((group, groupIndex) => {
          group.meals.forEach((meal, mealIndex) => {
            if (checkedMeals[groupIndex]?.[mealIndex]) {
              totalCalories += meal.scaledCalories || 0;
              totalProtein += meal.scaledProtein || 0;
              totalCarbs += meal.scaledCarbs || 0;
              totalFat += meal.scaledFat || 0;
            }
          });
        });
      }
      
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/daily-performance`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: user.id,
          date: today,
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fat: totalFat,
        }),
      });

      if (response.ok) {
        // Refresh weekly performance data
        const performanceResponse = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/weekly-performance-summary/${user.id}`);
        if (response.ok) {
          const performanceData = await performanceResponse.json();
          setCurrentWeekCalories(performanceData.current_week);
          setPreviousWeekCalories(performanceData.previous_week);
        }
      }
    } catch (error) {
      console.error('Error recording daily performance:', error);
    }
  };

 
  // Helper function to check if AsyncStorage has real meals
  const checkAsyncStorageForRealMeals = async (): Promise<boolean> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const dailyMealsKey = `dailyMeals_${today}`;
      const savedMeals = await AsyncStorage.getItem(dailyMealsKey);
      
      if (savedMeals) {
        const mealPlan = JSON.parse(savedMeals);
        const hasRealMeals = mealPlan.meals?.some((group: { meals: any[]; }) => 
          group.meals?.some(meal => meal.recipeId !== 0 && meal.name !== "")
        );
        
        if (hasRealMeals) {
          setEmptyMealPlan(mealPlan);
          setMealPlanType('empty');
          console.log('Found real meals in AsyncStorage. Set it to empty');
          return true;
        }
      }
      console.log('No real meals in AsyncStorage');
      return false;
    } catch (error) {
      console.error('Error checking AsyncStorage:', error);
      return false;
    }
  };

  useEffect(() => {
    const loadDailyMealPlan = async () => {
      if (!user) return;
  
      try {
        // First, try to load from backend (for generated meal plans)
        console.log("Loading meal plan from backend");
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/daily-recipes/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
  
        if (response.ok) {
          const theUsersDailyMealPlan = await response.json();
          
          // Check if this is an empty plan from backend (no meals)
          if (!theUsersDailyMealPlan.meals || theUsersDailyMealPlan.meals.length === 0) {
            // No meals in database - check AsyncStorage for user's custom meal plan
            console.log("No meals in database, checking AsyncStorage");
            await checkAsyncStorageForRealMeals();
          } else {
            // Found meals in database - this is a generated meal plan
            console.log("✅ Generated meal plan loaded from database");
            setGeneratedMealPlan(theUsersDailyMealPlan);
            setMealPlanType('generated');
          }
        } 
      } catch (error) {
        console.error('Error loading daily meal plan:', error);
        // Check AsyncStorage as fallback
        setMealPlanType(null);
      }
    };
  
    loadDailyMealPlan();
  }, [user?.id]);

  // Load weekly performance data
  // Add this later.
  
  useEffect(() => {
    loadWeeklyPerformance();
  }, [user?.id]);

  const loadWeeklyPerformance = async () => {
    if (!user) return;
    
    setIsLoadingPerformance(true);
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/weekly-performance-summary/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const performanceData = await response.json();
        setCurrentWeekCalories(performanceData.current_week);
        setPreviousWeekCalories(performanceData.previous_week);
      } else {
        console.error('Failed to load weekly performance:', response.status);
      }
    } catch (error) {
      console.error('Error loading weekly performance:', error);
    } finally {
      setIsLoadingPerformance(false);
    }
  };
  
  // Initialize checkmark state when meal plan data changes
  /*
  useEffect(() => {
    if (mealPlanData?.meals) {
      const initialCheckedMeals = mealPlanData.meals.map(group => 
        group.meals.map(() => false)
      );
      setCheckedMeals(initialCheckedMeals);
    }
  }, [mealPlanData]);
   */


  // Checkmark toggle function
  const handleMealToggle = async (groupIndex: number, mealIndex: number, isChecked: boolean) => {
    
    const newCheckedMeals = [...checkedMeals];
    newCheckedMeals[groupIndex] = [...newCheckedMeals[groupIndex]];
    newCheckedMeals[groupIndex][mealIndex] = isChecked;

    setCheckedMeals(newCheckedMeals);

    // Save to AsyncStorage with daily key
    try {
      const today = new Date().toISOString().split('T')[0];
      const key = `checkmarks_${today}`;
      await AsyncStorage.setItem(key, JSON.stringify(newCheckedMeals));
    
      // Clean up old data every x saves
      const saveCount = await AsyncStorage.getItem('save_count') || '0';
      const newCount = parseInt(saveCount) + 1;
      await AsyncStorage.setItem('save_count', newCount.toString());

       // Save totals to MySQL (daily_performance table)
       // Always save updated totals to MySQL
      await saveDailyTotalsToMySQL(newCheckedMeals);
      
      
      if (newCount % 10 === 0) {
        cleanupOldCheckmarks();
      }
    } catch (error) {
      console.error('Error saving checkmarks:', error);
    }
  };

  const saveDailyTotalsToMySQL = async (checkedMealsToUse: boolean[][]) => {
    
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Calculate totals from checked meals
      let totalCalories = 0, totalProtein = 0, totalCarbs = 0, totalFat = 0;
      
    
      if (checkedMealsToUse.length > 0 && mealPlanData) {
        mealPlanData.meals.forEach((group, groupIndex) => {
          group.meals.forEach((meal, mealIndex) => {
            if (checkedMealsToUse[groupIndex]?.[mealIndex]) {
              totalCalories += meal.scaledCalories || 0;
              totalProtein += meal.scaledProtein || 0;
              totalCarbs += meal.scaledCarbs || 0;
              totalFat += meal.scaledFat || 0;
            }
          });
        });
      }

  
      // Save to daily_performance table
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/daily-performance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerk_id: user?.id,
          date: today,
          total_calories: totalCalories,
          total_protein: totalProtein,
          total_carbs: totalCarbs,
          total_fat: totalFat,
        }),
      });
  
      if (response.ok) {
        
        // What if I grab user.id? Will this run the useEffect above?
        await loadWeeklyPerformance(); 
      }
    } catch (error) {
      console.error('Error saving daily totals:', error);
    }
  };

  // Cleanup function for old checkmarks
  const cleanupOldCheckmarks = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const checkmarkKeys = keys.filter(key => key.startsWith('checkmarks_'));
      
      // Keep only last 3 days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      
      for (const key of checkmarkKeys) {
        const dateStr = key.replace('checkmarks_', '');
        const keyDate = new Date(dateStr);
        
        if (keyDate < threeDaysAgo) {
          await AsyncStorage.removeItem(key);
          //console.log(`Cleaned up old checkmarks: ${key}`);
        }
      }
    } catch (error) {
      console.error('Error cleaning up checkmarks:', error);
    }
  };

  // Modal functions for the + button
  const openModal = () => {
    setIsModalVisible(true);
    // Fade in animation
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(modalScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  const closeModal = () => {
    // Fade out animation
    Animated.parallel([
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(modalScale, {
        toValue: 0.8,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsModalVisible(false);
    });
  };
  
const proAction = async () => {
  router.push('../FilterPage');
  /*
  if (isSubscribed) {
    // User has premium access, proceed to the feature
    router.push('../FilterPage');
  } else {
    // Navigate to paywall screen
    router.push('../paywall');
  }
    */
};
  
  
  // Load today's checkmarks
  useEffect(() => {
    const loadCheckmarks = async () => {
      if (!user || !isLoaded) return; 

      try {
        const today = new Date().toISOString().split('T')[0];
        const key = `checkmarks_${today}`;
        const saved = await AsyncStorage.getItem(key);
        
        if (saved) {
          setCheckedMeals(JSON.parse(saved));
        } else {
          // Initialize empty checkmarks for today
          if (mealPlanData?.meals) {
            const initialCheckedMeals = mealPlanData.meals.map(group => 
              group.meals.map(() => false)
            );
            setCheckedMeals(initialCheckedMeals);
          }
        }
      } catch (error) {
        console.error('Error loading checkmarks:', error);
      }
    };
    
    if (mealPlanData?.meals) {
      loadCheckmarks();
    }
  }, [mealPlanData]);

  return (
    <View style={{ flex: 1 }}>
    
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <LinearGradient
          colors={['#ffffff', '#e3f2fd', '#fce4ec']}
          style={{ flex: 1 }}
        >
        <ScrollView contentContainerStyle={styles.container}>

        <View>
            <Image 
              source={require('@/assets/images/home_screen_logo.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
          </View>


        <WeeklyPerformance
          currentWeekCalories={currentWeekCalories}
          previousWeekCalories={previousWeekCalories}
          targetCalories={macroLimits.calories || 2000}
          isLoading={isLoadingPerformance}
        />
        <View style={styles.heroCard}>
          <DonutChart value={totals.calories} total={macroLimits.calories} size={120}  color="#3e89ec" backgroundColor="rgba(62, 137, 236, 0.3)"  >
            <MaterialCommunityIcons name="fire" size={25} color="#111" />

            <Text style={styles.metricValue}>{totals.calories > macroLimits.calories 
                ? `+${(totals.calories - macroLimits.calories).toFixed(0)}g` 
                : `${(macroLimits.calories - totals.calories).toFixed(0)}g`
              }</Text>

            <Text style={styles.heroSubtitle}>{totals.calories > macroLimits.calories ? 'Calories Over' : 'Calories Left'}</Text>


          </DonutChart>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderColor: '#d7e3ff' }] }>
            <DonutChart value={totals.protein} total={macroLimits.protein} size={92} color="#eaec76"  backgroundColor="rgba(234, 236, 118, 0.3)" >
              <MaterialCommunityIcons name="food-steak" size={18} color="#111" />

              <Text style={styles.metricValue}>{totals.protein > macroLimits.protein 
                ? `+${(totals.protein - macroLimits.protein).toFixed(0)}g` 
                : `${(macroLimits.protein - totals.protein).toFixed(0)}g`
              }</Text>

              <Text style={styles.metricLabel}> {totals.protein > macroLimits.protein ? 'Protein Over' : 'Protein Left'}</Text>

            </DonutChart>
          </View>
          <View style={[styles.metricCard, { borderColor: '#e8f5d6' }] }>
            <DonutChart value={totals.carbs} total={macroLimits.carbs} size={92}  color="#30db1d"  backgroundColor="rgba(48, 219, 29, 0.3)">
              <MaterialCommunityIcons name="bread-slice" size={18} color="#111" />

              <Text style={styles.metricValue}>
                {totals.carbs > macroLimits.carbs
                ? `+${(totals.carbs - macroLimits.carbs).toFixed(0)}g` 
                : `${(macroLimits.carbs - totals.carbs).toFixed(0)}g`
              }
              </Text>

              <Text style={styles.metricLabel}> {totals.carbs > macroLimits.carbs ? 'Carbs Over' : 'Carbs Left'}</Text>


            </DonutChart>
          </View>
          <View style={[styles.metricCard, { borderColor: '#f7f5d9' }] }>
            <DonutChart value={totals.fat} total={macroLimits.fat} size={92} color="#f5d14e">
              <MaterialCommunityIcons name="peanut" size={18} color="#111" />

              <Text style={styles.metricValue}>
                {totals.fat > macroLimits.fat
                ? `+${(totals.fat - macroLimits.fat).toFixed(0)}g` 
                : `${(macroLimits.fat - totals.fat).toFixed(0)}g`
              }
              </Text>
              <Text style={styles.metricLabel}> {totals.fat > macroLimits.fat ? 'Fat Over' : 'Fat Left'}</Text>


            </DonutChart>
          </View>
        </View>

        <View style={styles.mealPlanHeader}>
          <Text style={styles.sectionTitle}>Meal Plan</Text>
          {mealPlanData?.meals && checkedMeals.length > 0 && (
            <Pressable style={styles.recordButton} onPress={recordDailyPerformance}>
              <Text style={styles.recordButtonText}>Record Today's Meals</Text>
            </Pressable>
          )}
        </View>
        {/*{(!mealPlanData || !mealPlanData.meals || mealPlanData.meals.length === 0) && ( */}

        {mealPlanType === null && (
          <>
            <Pressable style={styles.primaryBtn} onPress={GenerateDailyMealPlan}>
              <Text style={styles.primaryBtnText}>Generate Day</Text>
            </Pressable>
          
            <Pressable style={styles.secondaryBtn} onPress={copyYesterDayMealPlan}>
              <Text style={styles.secondaryBtnText}>Copy Yesterday</Text>
            </Pressable>

            <Pressable style={styles.tertiaryBtn} onPress={createEmptyMealPlan}>
              <Text style={styles.tertiaryBtnText}>Create Empty Plan</Text>
            </Pressable>
           
          </>
        )}

        {mealPlanType !== null && mealPlanData?.meals.map((group, i) => (
          <View key={i} style={styles.planSection}>
            <Text style={styles.mealHeading}>
              {group.label}: {group.labelCalories.toFixed()} kcal
            </Text>
            {group.meals.map((meal, j) => {
              // Check if this is an empty slot in an empty plan
              if (isEmptyPlan && meal.recipeId === 0) {
                return (
                  <EmptyMeal
                    key={`empty-${i}-${j}`}
                    groupIndex={i}
                    mealIndex={j}
                    mealLabel={group.label}
                    targetCalories={mealPlanData?.TARGET_PER_MEAL || 0}
                    onRecipeSelected={handleSavedRecipeSelected}
                  />
                );
              }
              
              // Regular meal component
              return (
                <Meal
                  key={`meal-${i}-${j}-${meal.recipeId}`}
                  groupIndex={i}
                  mealIndex={j}
                  recipeId={meal.recipeId}
                  recipeObj={getMealByRecipeId(meal.recipeId)}
                  foodImage={meal.image}
                  foodTitle={meal.name}
                  foodCalories={meal.scaledCalories}
                  foodProtein={meal.scaledProtein}
                  foodCarbs={meal.scaledCarbs}
                  foodFat={meal.scaledFat}
                  foodServings={meal.servings}
                  TargetCalories={mealPlanData?.TARGET_PER_MEAL}
                  foodDiet={meal.diet}
                  time={time}
                  clerk_id={user?.id || ''}
                  isChecked={checkedMeals[i]?.[j] || false}
                  onToggle={handleMealToggle}
                  onRecipeRefreshed={handleMealRefreshed}
                />
              );
            })}
          </View>
        ))}

      </ScrollView>

      <Pressable style={styles.fab} onPress={openModal}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>

      {/* Action Modal */}
      {isModalVisible && (
        <Animated.View 
          style={[
            styles.modalOverlay,
            { opacity: modalOpacity }
          ]}
        >
          <Animated.View 
            style={[
              styles.modalContainer,
              { 
                opacity: modalOpacity,
                transform: [{ scale: modalScale }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What would you like to do?</Text>
              <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalOptions}>
              <TouchableOpacity style={styles.modalOption} onPress={proAction}>
                <View style={styles.optionIcon}>
                  <Ionicons name="camera" size={32} color="#3b82f6" />
                </View>
                <Text style={styles.optionTitle}>AI Camera</Text>
                <Text style={styles.optionSubtitle}>Take a photo of your ingredients, and AI will suggest recipes.</Text>
                <Text style={styles.optionSubtitle2}>Note: This feature is free for now. Try it before it becomes premium!</Text>
              </TouchableOpacity>
              {/*  
              <TouchableOpacity style={styles.modalOption} onPress={handleOption2}>
                <View style={styles.optionIcon}>
                  <Ionicons name="bulb" size={32} color="#faf873" />
                </View>
                <Text style={styles.optionTitle}>Find Healthy Snacks</Text>
                <Text style={styles.optionSubtitle}>What you can add to your diet to hit your calories and macros</Text>
              </TouchableOpacity>
              */}
            </View>
          </Animated.View>
        </Animated.View>
      )}
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  logoContainer: {
    width: '100%',
    backgroundColor: 'red',
  },
  logo: {
    width: 40,
    height: 40,
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    //shadowColor: '#000',
    //shadowOpacity: 0.1,
    //shadowRadius: 10,
    //shadowOffset: {
    //  width: 0,
    //  height: 4,
    //},
    //elevation: 8,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
    //backdropFilter: 'blur(10px)',
  },
  heroValue: { fontSize: 25, fontWeight: '800', marginTop: 4 },
  heroSubtitle: { fontSize: 12, color: '#666' },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 10,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    //shadowColor: '#000',
    //shadowOpacity: 0.1,
    //shadowRadius: 10,
    //shadowOffset: {
    //  width: 0,
    //  height: 4,
    //},
    //elevation: 8,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
    //backdropFilter: 'blur(10px)',
  },
  metricValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  metricLabel: { fontSize: 9, color: '#666' },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  mealPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recordButton: {
    backgroundColor: '#10b981',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  recordButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  planSection: {
    marginTop: 8,
  },
  mealHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
  },
  primaryBtn: {
    backgroundColor: '#e6e6e6',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cfcfcf',
  },
  primaryBtnText: { fontWeight: '700', color: '#444' },
  secondaryBtn: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d8d8d8',
  },
  secondaryBtnText: { fontWeight: '700', color: '#555' },
  tertiaryBtn: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  tertiaryBtnText: { fontWeight: '700', color: '#6c757d' },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
   // shadowColor: '#000',
   // shadowOpacity: 0.2,
   // shadowRadius: 8,
   // shadowOffset: { width: 0, height: 3 },
   // elevation: 4,
   boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
  },
  swipeBehind: {
    position: 'absolute',
    right: 0,
    left: 0,
    top: 0,
    bottom: 0,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 6,
  },
  deleteBtn: {
    backgroundColor: '#e23d3d',
    width: 64,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    //shadowColor: '#000',
    //shadowOpacity: 0.12,
    //shadowRadius: 8,
    //shadowOffset: { width: 0, height: 2 },
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
  },
  
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 10 },
    //shadowOpacity: 0.25,
    //shadowRadius: 20,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
    //elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  modalOptions: {
    gap: 16,
  },
  modalOption: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  optionIcon: {
    marginBottom: 12,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  optionSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  optionSubtitle2: {
    fontSize: 12,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  
  // Empty state styles
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
});
