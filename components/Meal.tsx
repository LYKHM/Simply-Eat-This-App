import React, { useEffect, useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';



interface MealProps {
  foodDiet: string;
  groupIndex: number;
  mealIndex: number;
  foodImage: string;
  foodTitle: string;
  foodCalories: number;
  foodProtein: number;
  foodCarbs: number;
  foodFat: number;
  foodServings: number;
  recipeId: number;
  recipeObj: any;
  TargetCalories: number;
  time: number;
  clerk_id: string;
}

const Meal: React.FC<MealProps> = ({ 
  foodDiet, 
  groupIndex, 
  mealIndex, 
  foodImage, 
  foodTitle, 
  foodCalories, 
  foodProtein, 
  foodCarbs, 
  foodFat, 
  foodServings, 
  recipeId, 
  recipeObj, 
  TargetCalories, 
  time,
  clerk_id
}) => {
  const [spinning, setSpinning] = useState(false);
  const [newRecipe, setNewRecipe] = useState(false);
  const [refreshedRecipe, setRefreshedRecipe] = useState<any>(null);
  const router = useRouter();
  
  

  useEffect(() => {
    const loadSavedRecipe = async () => {
      try {
        const saved = await AsyncStorage.getItem('freshRecipe');
        if (saved) {
          const parsedSaved = JSON.parse(saved);
          if (parsedSaved && parsedSaved.groupIndex === groupIndex && parsedSaved.mealIndex === mealIndex) {
            setRefreshedRecipe(parsedSaved.replacement);
          }
        }
      } catch (error) {
        console.error('Error loading saved recipe:', error);
      }
    };
    loadSavedRecipe();
  }, [groupIndex, mealIndex]);

  const handleClick = async () => {
    setSpinning(true);

    try {

   
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diet: foodDiet,
          time: time,
          targetCalories: TargetCalories,
          clerk_id: clerk_id,
          groupIndex: groupIndex,
          mealIndex: mealIndex
        })
      });

      console.log("🚨 Status:", response.status);

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        console.error("❌ Error response body:", errorBody);
        throw new Error(`Server returned ${response.status}: ${errorBody?.error || "Unknown error"}`);
      }

      const data = await response.json();
      setRefreshedRecipe(data);
      setNewRecipe(true);

      const replacement = {
        groupIndex,
        mealIndex,
        sourceRecipeId: recipeId,
        replacement: {
          ...data,
          recipeId: Number(data.recipeId ?? data.id),
        },
      };

      await AsyncStorage.setItem("freshRecipe", JSON.stringify(replacement));

      // Analytics equivalent for React Native would go here
      // You could use Firebase Analytics or similar

    } catch (error) {
      console.error('Error refreshing recipe:', error);
      Alert.alert('Error', 'Failed to refresh recipe');
    }

    setTimeout(() => {
      setSpinning(false);
    }, 1000);
  };

  const handleRecipePress = () => {
    
    // I need these 3 variables to be passed to the recipe page

 
 
    const recipeData = newRecipe ? refreshedRecipe : recipeObj;
    const servings = newRecipe ? refreshedRecipe.servings : foodServings;
    const id = newRecipe ? refreshedRecipe.id : recipeId;

    // Set the recipe data in context
    //Remove all context
    /*
    setCurrentRecipe({
      id: id.toString(),
      recipe: recipeData,
      servings
    });
    */

 
    router.push({
      pathname: '/RecipePage', 
      params: { 
        id: id.toString(),
        recipe: JSON.stringify(recipeData),  // This does NOT conver the object to a string
        servings: servings.toString()         // Convert to string
      }
    });

  }
  
  

  const displayTitle = newRecipe 
    ? (refreshedRecipe?.name ?? refreshedRecipe?.title ?? foodTitle)
    : foodTitle;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.contentRow}>
          {/* Food Image */}
          <View style={styles.imageContainer}>
            <Image 
              source={{ uri: newRecipe ? refreshedRecipe.image : foodImage }}
              style={styles.foodImage}
              resizeMode="cover"
            />
          </View>

          {/* Meal Info */}
          <View style={styles.infoContainer}>
            <TouchableOpacity onPress={handleRecipePress}>
              <Text style={styles.title}>
                {displayTitle.slice(0, 23) + '...'}
              </Text>
            </TouchableOpacity>
            
            <Text style={styles.calories}>
              Calories: {newRecipe ? refreshedRecipe.scaledCalories : foodCalories}
            </Text>

            <View style={styles.macrosGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroText}>
                  Protein: {newRecipe ? refreshedRecipe.scaledProtein : foodProtein}
                </Text>
              </View>

              <View style={styles.macroItem}>
                <Text style={styles.macroText}>
                  Carb: {newRecipe ? refreshedRecipe.scaledCarbs : foodCarbs}
                </Text>
              </View>

              <View style={styles.macroItem}>
                <Text style={styles.macroText}>
                  Fat: {newRecipe ? refreshedRecipe.scaledFat : foodFat}
                </Text>
              </View>

              <View style={styles.macroItem}>
                <Text style={styles.macroText}>
                  Servings: {newRecipe ? refreshedRecipe.servings : foodServings}
                </Text>
              </View>
            </View>
          </View>

          {/* Refresh Button */}
          <View style={styles.refreshContainer}>
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={handleClick}
              accessibilityLabel={`Refresh ${displayTitle || "meal"}`}
            >
              <Ionicons
                name="refresh"
                size={20}
                color="#666"
                style={spinning ? styles.spinning : undefined}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 8,
    marginBottom: 20,
  },
  card: {
    width: '100%',
    maxWidth: 600,
    minWidth: 300,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    marginHorizontal: 16,
  },
  contentRow: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    width: 128,
    height: 128,
    borderRadius: 12,
    overflow: 'hidden',
    flexShrink: 0,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  infoContainer: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  title: {
    color: '#1f2937',
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 8,
    textDecorationLine: 'underline',
  },
  calories: {
    color: '#374151',
    marginBottom: 8,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  macroItem: {
    minWidth: '45%',
    marginBottom: 4,
  },
  macroText: {
    fontSize: 12,
    color: '#374151',
  },
  refreshContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  spinning: {
    // Note: React Native doesn't have built-in CSS animations
    // You'd need to use Animated API or react-native-reanimated for spinning animation
  },
});

export default Meal;