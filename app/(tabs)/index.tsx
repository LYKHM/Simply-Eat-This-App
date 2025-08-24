import React, { useMemo, useState, useEffect,useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Animated, PanResponder } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DonutChart from '@/components/DonutChart';
import MealCard, { MealItem } from '@/components/MealCard';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo'


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
  breakfast: MealItem[];
  lunch: MealItem[];
  dinner: MealItem[];
};


function generateRandomMeal(idSeed: string): MealItem {

  //Dummy data for now
  const foods = [
    { name: 'Lemon, Berry, Honey Smoothie', image: 'https://images.unsplash.com/photo-1542444459-db63c9f546a1?q=80&w=400&auto=format&fit=crop' },
    { name: 'Cauliflower Egg Bake', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=400&auto=format&fit=crop' },
    { name: 'Chicken and Avocado Salad', image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=400&auto=format&fit=crop' },
    { name: 'Oats with Blueberries', image: 'https://images.unsplash.com/photo-1490474418585-ba9bad8fd0ea?q=80&w=400&auto=format&fit=crop' },
    { name: 'Greek Yogurt Bowl', image: 'https://images.unsplash.com/photo-1505250469679-203ad9ced0cb?q=80&w=400&auto=format&fit=crop' },
  ];
  const pick = foods[Math.floor(Math.random() * foods.length)];
  const protein = Math.floor(5 + Math.random() * 35);
  const carbs = Math.floor(10 + Math.random() * 80);
  const fat = Math.floor(2 + Math.random() * 25);
  const calories = protein * 4 + carbs * 4 + fat * 9;
  return {
    id: `${idSeed}-${Math.random().toString(36).slice(2, 8)}`,
    name: pick.name,
    imageUrl: pick.image,
    calories,
    macros: { protein, carbs, fat },
  };
}

function generateDay(): MealPlan {
  return {
    breakfast: [generateRandomMeal('b1'), generateRandomMeal('b2')],
    lunch: [generateRandomMeal('l1'), generateRandomMeal('l2')],
    dinner: [generateRandomMeal('d1'), generateRandomMeal('d2')],
  };
}

export default function HomeScreen() {

  //Sneak peak into the data.
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
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [macroLimits, setMacroLimits] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
  });


    // Load user's nutrition data on component mount
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

  const totals = useMemo(() => {
    const items = plan ? [...plan.breakfast, ...plan.lunch, ...plan.dinner] : [];
    const protein = items.reduce((sum, m) => sum += m.macros.protein, 0);
    const carbs = items.reduce((sum, m) => sum += m.macros.carbs, 0);
    const fat = items.reduce((sum, m) => sum += m.macros.fat, 0);
    const calories = items.reduce((sum, m) => sum += m.calories, 0);
    return { protein, carbs, fat, calories };
  }, [plan]);

  const removeMeal = useCallback((section: keyof MealPlan, id: string) => {
    setPlan((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [section]: prev[section].filter((m) => m.id !== id),
      };
    });
  }, []);

  const renderRightActions = (onDelete: () => void) => (
    <View style={styles.swipeBehind}>
      <Pressable onPress={onDelete} style={styles.deleteBtn}>
        <Ionicons name="trash" size={22} color="#fff" />
      </Pressable>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroCard}>
          <DonutChart value={totals.calories} total={macroLimits.calories} size={120}  color="#3e89ec" backgroundColor="rgba(62, 137, 236, 0.3)"  >
            <MaterialCommunityIcons name="fire" size={25} color="#111" />
            <Text style={styles.heroValue}>{Math.max(0, macroLimits.calories - totals.calories)}</Text>
            <Text style={styles.heroSubtitle}>Calories Left</Text>
          </DonutChart>
        </View>

        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderColor: '#d7e3ff' }] }>
            <DonutChart value={totals.protein} total={macroLimits.protein} size={92} color="#eaec76"  backgroundColor="rgba(234, 236, 118, 0.3)" >
              <MaterialCommunityIcons name="food-steak" size={18} color="#111" />
              <Text style={styles.metricValue}>{Math.max(0, macroLimits.protein - totals.protein)}g</Text>
              <Text style={styles.metricLabel}>Protein Left</Text>
            </DonutChart>
          </View>
          <View style={[styles.metricCard, { borderColor: '#e8f5d6' }] }>
            <DonutChart value={totals.carbs} total={macroLimits.carbs} size={92}  color="#30db1d"  backgroundColor="rgba(48, 219, 29, 0.3)">
              <MaterialCommunityIcons name="bread-slice" size={18} color="#111" />
              <Text style={styles.metricValue}>{Math.max(0, macroLimits.carbs - totals.carbs)}g</Text>
              <Text style={styles.metricLabel}>Carbs Left</Text>
            </DonutChart>
          </View>
          <View style={[styles.metricCard, { borderColor: '#f7f5d9' }] }>
            <DonutChart value={totals.fat} total={macroLimits.fat} size={92} color="#f5d14e">
              <MaterialCommunityIcons name="bottle-wine" size={18} color="#111" />
              <Text style={styles.metricValue}>{Math.max(0, macroLimits.fat - totals.fat)}g</Text>
              <Text style={styles.metricLabel}>Fat Left</Text>
            </DonutChart>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Meal Plan</Text>

       
        {!plan && (
          <>
            <Pressable style={styles.primaryBtn} onPress={() => setPlan(generateDay())}>
              <Text style={styles.primaryBtnText}>Generate Day</Text>
            </Pressable>
            <Pressable style={styles.secondaryBtn} onPress={() => setPlan((prev) => (prev ? { ...prev } : prev))}>
              <Text style={styles.secondaryBtnText}>Copy Yesterday</Text>
            </Pressable>
          </>
        )}

        {plan && (
          <View style={styles.planSection}>
            <Text style={styles.mealHeading}>Breakfast</Text>
            {plan.breakfast.map((m) => (
              <SwipeRow key={m.id} onDelete={() => removeMeal('breakfast', m.id)}>
                <MealCard item={m} />
              </SwipeRow>
            ))}
            <Text style={styles.mealHeading}>Lunch</Text>
            {plan.lunch.map((m) => (
              <SwipeRow key={m.id} onDelete={() => removeMeal('lunch', m.id)}>
                <MealCard item={m} />
              </SwipeRow>
            ))}
            <Text style={styles.mealHeading}>Dinner</Text>
            {plan.dinner.map((m) => (
              <SwipeRow key={m.id} onDelete={() => removeMeal('dinner', m.id)}>
                <MealCard item={m} />
              </SwipeRow>
            ))}
          </View>
        )}
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
  planSection: {
    marginTop: 8,
  },
  mealHeading: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
  },
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
