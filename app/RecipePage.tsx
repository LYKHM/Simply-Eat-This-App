import React, { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';



import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator
} from 'react-native';


// Define types
interface Recipe {
  name: string;
  image: string;
  prep_time: number;
  cook_time: number;
  makes_x_servings: number;
  Health_Score: number;
  allergies?: string;
  cost?: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  instructions: string;
}

interface Ingredient {
  name: string;
  quantity: number;
  unit: string;
}

interface RecipeData {
  original: Recipe & { ingredients: Ingredient[] };
  scaled: {
    scaledCalories: number;
    scaledProtein: number;
    scaledCarbs: number;
    scaledFat: number;
    ingredients: Ingredient[];
  };
}



const RecipePage = () => {

  const { id, recipe, servings  } = useLocalSearchParams(); 
  //const insets = useSafeAreaInsets();
  const scaledRecipe = JSON.parse(recipe as string); 


  //const [recipeData, setRecipeData] = useState<RecipeData | null>(null);
  const [showScaled, setShowScaled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchedRecipeData, setFetchedRecipeData] = useState<RecipeData | null>(null);

  

  // You'll need to pass recipe and servings data through navigation params or route
  // For now, using placeholder values
  //const recipe = { id: id }; // This should come from navigation params
  //const servings = 1; // This should come from navigation params

  useEffect(() => {
    // I need to make a new request to grab the unscaled recipe data
    const fetchRecipeData = async () => {
      try {
        const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/recipes`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: id,
            scaledRecipe: scaledRecipe
          }),
        });
        const data = await response.json();
        setFetchedRecipeData(data);
      } catch (error) {
        console.error('Error fetching recipe:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecipeData();
  }, [id]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!fetchedRecipeData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load recipe</Text>
      </View>
    );
  }

  const activeData = showScaled ? fetchedRecipeData.scaled : fetchedRecipeData.original;
  


  const { protein, carbs, fat } = fetchedRecipeData.original;
  const total = protein + carbs + fat;
  const proteinPercent = (protein / total) * 100;
  const carbsPercent = (carbs / total) * 100;
  const fatPercent = (fat / total) * 100;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView  contentContainerStyle={styles.contentContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{fetchedRecipeData.original.name}</Text>
        </View>

        {/* Image and Nutrition Chart */}
        <View style={styles.imageNutritionContainer}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: fetchedRecipeData.original.image }}
              style={styles.recipeImage}
              resizeMode="cover"
            />
          </View>

          <View style={styles.nutritionCard}>
            <Text style={styles.nutritionTitle}>Nutrition Breakdown</Text>
            
            {/* Simple percentage display - replace with actual chart if needed */}
            <View style={styles.percentageContainer}>
              <View style={styles.percentageItem}>
                <Text style={styles.percentageLabel}>Protein</Text>
                <Text style={styles.percentageValue}>{proteinPercent.toFixed(0)}%</Text>
              </View>
              <View style={styles.percentageItem}>
                <Text style={styles.percentageLabel}>Carbs</Text>
                <Text style={styles.percentageValue}>{carbsPercent.toFixed(0)}%</Text>
              </View>
              <View style={styles.percentageItem}>
                <Text style={styles.percentageLabel}>Fat</Text>
                <Text style={styles.percentageValue}>{fatPercent.toFixed(0)}%</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Meta Information */}
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>Prep: {fetchedRecipeData.original.prep_time} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>Cook: {fetchedRecipeData.original.cook_time} min</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>Serves: {fetchedRecipeData.original.makes_x_servings}</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>Health: {fetchedRecipeData.original.Health_Score}/10</Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>
              Allergens: {fetchedRecipeData.original.allergies || 'None listed'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaText}>
              Price: ${fetchedRecipeData.original.cost || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Toggle Switch */}
        <View style={styles.toggleContainer}>
          <Text style={[styles.toggleLabel, !showScaled && styles.activeToggle]}>
            Original
          </Text>
          <TouchableOpacity
            style={[styles.toggleSwitch, showScaled && styles.toggleSwitchActive]}
            onPress={() => setShowScaled(!showScaled)}
          >
            <View style={[styles.toggleButton, showScaled && styles.toggleButtonActive]} />
          </TouchableOpacity>
          <Text style={[styles.toggleLabel, showScaled && styles.activeToggle]}>
            Scaled to {servings} serving
          </Text>
        </View>

        {/* Ingredients and Nutrition */}
        <View style={styles.detailsContainer}>
          {/* Ingredients */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Ingredients</Text>
            {activeData.ingredients.map((ingredient, index) => (
              <Text key={index} style={styles.ingredientItem}>
                • {ingredient.name}: {ingredient.quantity.toFixed(0)}{ingredient.unit}
              </Text>
            ))}
          </View>

          {/* Nutrition Facts */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Nutrition Facts</Text>
            <View style={styles.nutritionTable}>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Calories</Text>
                <Text style={styles.nutritionValue}>
                  {showScaled ? fetchedRecipeData.scaled.scaledCalories : fetchedRecipeData.original.calories}
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Protein</Text>
                <Text style={styles.nutritionValue}>
                  {showScaled ? fetchedRecipeData.scaled.scaledProtein : fetchedRecipeData.original.protein}g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Fat</Text>
                <Text style={styles.nutritionValue}>
                  {showScaled ? fetchedRecipeData.scaled.scaledFat : fetchedRecipeData.original.fat}g
                </Text>
              </View>
              <View style={styles.nutritionRow}>
                <Text style={styles.nutritionLabel}>Carbs</Text>
                <Text style={styles.nutritionValue}>
                  {showScaled ? fetchedRecipeData.scaled.scaledCarbs : fetchedRecipeData.original.carbs}g
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Instructions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <Text style={styles.instructions}>{fetchedRecipeData.original.instructions}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB'
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  imageNutritionContainer: {
    marginBottom: 24,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  recipeImage: {
    width: '100%',
    height: '100%',
  },
  nutritionCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nutritionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
    textAlign: 'center',
  },
  percentageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  percentageItem: {
    alignItems: 'center',
  },
  percentageLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  percentageValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 8,
  },
  metaItem: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    margin: 4,
  },
  metaText: {
    fontSize: 12,
    color: '#4B5563',
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    gap: 12,
  },
  toggleLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  activeToggle: {
    color: '#111827',
    fontWeight: '600',
  },
  toggleSwitch: {
    width: 48,
    height: 24,
    backgroundColor: '#D1D5DB',
    borderRadius: 12,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleSwitchActive: {
    backgroundColor: '#1D4ED8',
  },
  toggleButton: {
    width: 20,
    height: 20,
    backgroundColor: 'white',
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  toggleButtonActive: {
    alignSelf: 'flex-end',
  },
  detailsContainer: {
    gap: 16,
    marginBottom: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  ingredientItem: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 4,
    lineHeight: 20,
  },
  nutritionTable: {
    gap: 8,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  nutritionLabel: {
    fontSize: 14,
    color: '#4B5563',
  },
  nutritionValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  instructions: {
    fontSize: 14,
    color: '#4B5563',
    lineHeight: 20,
  },
});

export default RecipePage;