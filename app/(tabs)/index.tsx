import React, { useMemo, useState, useEffect,useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, PanResponder, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DonutChart from '@/components/DonutChart';
import MealCard, { MealItem } from '@/components/MealCard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo'
import Meal from '@/components/Meal';
import WeeklyPerformance from '@/components/WeeklyPerformance';


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
  */

  const { user  } = useUser();
  //console.log("Do i have the suer data in the home screen? user: ", user)
  const [mealPlanData, setMealPlanData] = useState<MealPlan | null>(null);
  const [time, setTime] = useState(20);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
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
        setMealPlanData(mealPlan);
        
        // Record daily performance after meal plan is generated
        await recordDailyPerformance();
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
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

 

  useEffect(() => {
    const loadDailyMealPlan = async () => {
      if (!user) return;
  
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/daily-recipes/${user.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        });
  
        if (response.ok) {
          const theUsersDailyMealPlan = await response.json();
          //console.log("✅ Daily meal plan loaded:", theUsersDailyMealPlan);
          setMealPlanData(theUsersDailyMealPlan);
        } else {
          console.error('Failed to load daily meal plan:', response.status);
        }
      } catch (error) {
        console.error('Error loading daily meal plan:', error);
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
  useEffect(() => {
    if (mealPlanData?.meals) {
      const initialCheckedMeals = mealPlanData.meals.map(group => 
        group.meals.map(() => false)
      );
      setCheckedMeals(initialCheckedMeals);
    }
  }, [mealPlanData]);



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

  // Load today's checkmarks
  useEffect(() => {
    const loadCheckmarks = async () => {
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
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
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
              <MaterialCommunityIcons name="bottle-wine" size={18} color="#111" />

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

        {(!mealPlanData || !mealPlanData.meals || mealPlanData.meals.length === 0) && (
          <>
            <Pressable style={styles.primaryBtn} onPress={GenerateDailyMealPlan}>
              <Text style={styles.primaryBtnText}>Generate Day</Text>
            </Pressable>
          
            <Pressable style={styles.secondaryBtn} onPress={GenerateDailyMealPlan}>
              <Text style={styles.secondaryBtnText}>Copy Yesterday</Text>
            </Pressable>
           
          </>
        )}

        {mealPlanData?.meals.map((group, i) => (
          <View key={i} style={styles.planSection}>
            <Text style={styles.mealHeading}>
              {group.label}: {group.labelCalories.toFixed()} kcal
            </Text>
            {group.meals.map((meal, j) => (
              <Meal
                key={meal.recipeId}
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
              />
            ))}
          </View>
        ))}

      </ScrollView>

      <Pressable style={styles.fab} onPress={() => { /* future action */ }}>
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 16 },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 20,
    paddingVertical: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 8,
    backdropFilter: 'blur(10px)',
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
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    elevation: 8,
    backdropFilter: 'blur(10px)',
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
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
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
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
});
