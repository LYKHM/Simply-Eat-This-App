import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as FileSystem from "expo-file-system";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Recipe {
  id: number;
  name: string;
  instructions: string;
  ingredients_grams: Array<{ item: string; grams: number }>;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  health_rating: number;
  time_minutes: number;
  allergy_warning: string;
  cost: number;
  isMostPopular: boolean;
}

interface RecipeResponse {
  ingredientsInPhoto: string;
  meals: Recipe[];
}

export default function RecipeResults() {
    const params = useLocalSearchParams();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [ingredientsInPhoto, setIngredientsInPhoto] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
    const [base64Image, setBase64Image] = useState<string | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [fadeAnim] = useState(new Animated.Value(0));
    const [diet, setDiet] = useState<string>('');
    const [calories, setCalories] = useState<number>(0);

  
    

// Convert the image to base64
    useEffect(() => {
        const convertToBase64 = async () => {
          if (params.photo) {
            try {
              setLoading(true);
              
              
              const base64 = await FileSystem.readAsStringAsync(params.photo as string, {
                encoding: FileSystem.EncodingType.Base64,
              });
              setBase64Image(base64);
            
              setLoading(false);
            } catch (err) {
              console.error("Error converting file:", err);
              setLoading(false);
            }
          }
        };
    
        convertToBase64();
      }, [params.photo]);

// Take the base64 image and send it to the backend and set the data to recipes state
    useEffect(() => {
        if (!base64Image) return;

        const fetchRecipes = async () => {
          try {
            setLoading(true);
            setError(null);
            
            if (!base64Image) {
              setError('No photo data received');
              setLoading(false);
              return;
            }

            const userDataString = await AsyncStorage.getItem("userData");
            const userData = JSON.parse(userDataString || '{}');
            setDiet(userData.dietChoice || 'anything');

            const nutritionDataString = await AsyncStorage.getItem("nutritionData");
            const nutritionData = JSON.parse(nutritionDataString || '{}');
            setCalories(nutritionData.calories || 2000);




    
            const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/openai-photo`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                photo: base64Image,
                diet: diet,
                calories: calories,
              }),
            });
    
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
    
            const data: RecipeResponse = await response.json();
            
         
            setRecipes(data.meals);
            setIngredientsInPhoto(data.ingredientsInPhoto);
            setLoading(false);
            
          } catch (error) {
            console.error('Error fetching recipes:', error);
            setError(error instanceof Error ? error.message : 'Failed to fetch recipes');
            setLoading(false);
          }
        };
    
        fetchRecipes();
      }, [base64Image]);


      const handleBack = () => {
        router.back();
      };

      const handleRecipePress = (recipe: Recipe) => {
        setSelectedRecipe(recipe);
        setModalVisible(true);
        // Fade in animation
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      };

      const handleCloseRecipe = () => {
        // Fade out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => {
          setModalVisible(false);
          setSelectedRecipe(null);
        });
      };

      const handleSaveRecipe = async () => {
        if (!selectedRecipe) return;

        try {
          // Get existing saved recipes
          const savedRecipesString = await AsyncStorage.getItem('savedRecipes');
          const savedRecipes = savedRecipesString ? JSON.parse(savedRecipesString) : [];

          // Check if recipe already exists (by name)
          const existingIndex = savedRecipes.findIndex((recipe: Recipe) => recipe.name === selectedRecipe.name);
          
          if (existingIndex >= 0) {
            // Update existing recipe with ID
            const recipeWithId = {
              ...selectedRecipe,
              id: savedRecipes[existingIndex].id || Date.now() + Math.random() // Keep existing ID or create new one
            };
            savedRecipes[existingIndex] = recipeWithId;
            console.log('Recipe updated:', selectedRecipe.name);
          } else {
            // Add new recipe with unique ID
            const recipeWithId = {
              ...selectedRecipe,
              id: Date.now() + Math.random() // Generate unique ID
            };
            savedRecipes.push(recipeWithId);
            console.log('Recipe saved:', selectedRecipe.name);
          }

          // Save back to AsyncStorage
          await AsyncStorage.setItem('savedRecipes', JSON.stringify(savedRecipes));
          
          // You could add a toast notification here
          alert(`Recipe "${selectedRecipe.name}" saved successfully!`);
          
        } catch (error) {
          console.error('Error saving recipe:', error);
          alert('Failed to save recipe');
        }
      };

      
      const handleRetry = () => {
        // Reset and try again
        setLoading(true);
        setError(null);
        setRecipes([]);

    
        // The useEffect will trigger again
      };

      const renderHealthRating = (rating: number) => {
        const stars = [];
        const maxStars = 10;
        
        for (let i = 1; i <= maxStars; i++) {
          if (i <= rating) {
            stars.push(
              <Ionicons 
                key={i} 
                name="star" 
                size={12} 
                color="#FFD700" 
              />
            );
          } else {
            stars.push(
              <Ionicons 
                key={i} 
                name="star-outline" 
                size={12} 
                color="#D3D3D3" 
              />
            );
          }
        }
        
        return (
          <View style={styles.healthRatingContainer}>
            <Text style={styles.healthRatingLabel}>Health Rating:</Text>
            <View style={styles.starsContainer}>
              {stars}
            </View>
            <Text style={styles.healthRatingText}>{rating}/10</Text>
          </View>
        );
      };

 

        // ===== RENDER LOGIC =====
    
    // 1. LOADING SCREEN - Show while processing photo
    if (loading) {
      return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef', '#dee2e6']}
          style={styles.container}
        >
          <StatusBar barStyle="dark-content" />
                     <View style={styles.header}>
             <TouchableOpacity style={styles.backButton} onPress={handleBack}>
               <Ionicons name="arrow-back" size={24} color="#212529" />
             </TouchableOpacity>
             <Text style={styles.headerTitle}>Recipe Suggestions</Text>
             <View style={styles.headerSpacer} />
           </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#212529" />
              <Text>Wait, this can take a few seconds...</Text>
            </View>
        </LinearGradient>
        </SafeAreaView>
      );
    }

    // 2. ERROR SCREEN - Show if something goes wrong
    if (error) {
      return (
        <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef', '#dee2e6']}
          style={styles.container}
        >
          <StatusBar barStyle="dark-content" />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#212529" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recipe Suggestions</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.errorContainer}>
            <Ionicons name="warning" size={64} color="#dc3545" />
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorSubtitle}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        </SafeAreaView>
      );
    }
 
    // 3. NO RECIPES SCREEN - Show if API returns empty results
    if (!recipes || recipes.length === 0) {
      return (
        <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
        <LinearGradient
          colors={['#f8f9fa', '#e9ecef', '#dee2e6']}
          style={styles.container}
        >
          <StatusBar barStyle="dark-content" />
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#212529" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recipe Suggestions</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.noResultsContainer}>
            <Ionicons name="restaurant-outline" size={64} color="rgba(108, 117, 125, 0.5)" />
            <Text style={styles.noResultsTitle}>No recipes found</Text>
            <Text style={styles.noResultsSubtitle}>
              Try taking a photo of different ingredients or food items
            </Text>
            <TouchableOpacity style={styles.retryButton} onPress={handleBack}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
        </SafeAreaView>
      );
    }

    // ===== HELPER FUNCTIONS =====

  const renderRecipeModal = () => {
    if (!selectedRecipe || !modalVisible) return null;

    return (
      <Animated.View 
        style={[
          styles.modalOverlay,
          { opacity: fadeAnim }
        ]}
      >
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                })
              }]
            }
          ]}
        >
          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleContainer}>
                <Text style={styles.modalTitle}>{selectedRecipe.name}</Text>
                {selectedRecipe.isMostPopular && (
                  <View style={styles.modalPopularBadge}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.modalPopularText}>Most Popular</Text>
                  </View>
                )}
              </View>
              <View style={styles.modalHeaderButtons}>
                <TouchableOpacity style={styles.saveButton} onPress={handleSaveRecipe}>
                  <Ionicons name="bookmark-outline" size={20} color="#28a745" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.closeModalButton} onPress={handleCloseRecipe}>
                  <Ionicons name="close" size={24} color="#6c757d" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.modalMeta}>
              <View style={styles.modalMetaItem}>
                <Ionicons name="time-outline" size={20} color="#6c757d" />
                <Text style={styles.modalMetaText}>{selectedRecipe.time_minutes} minutes</Text>
              </View>
              <View style={styles.modalMetaItem}>
                <Ionicons name="cash-outline" size={20} color="#6c757d" />
                <Text style={styles.modalMetaText}>${selectedRecipe.cost.toFixed(2)}</Text>
              </View>
            </View>

            {renderHealthRating(selectedRecipe.health_rating)}

            <View style={styles.modalNutrition}>
              <Text style={styles.modalSectionTitle}>Nutrition Facts</Text>
              <View style={styles.modalNutritionGrid}>
                <View style={styles.modalNutritionItem}>
                  <Text style={styles.modalNutritionValue}>{selectedRecipe.calories}</Text>
                  <Text style={styles.modalNutritionLabel}>Calories</Text>
                </View>
                <View style={styles.modalNutritionItem}>
                  <Text style={styles.modalNutritionValue}>{selectedRecipe.protein_g}g</Text>
                  <Text style={styles.modalNutritionLabel}>Protein</Text>
                </View>
                <View style={styles.modalNutritionItem}>
                  <Text style={styles.modalNutritionValue}>{selectedRecipe.carbs_g}g</Text>
                  <Text style={styles.modalNutritionLabel}>Carbs</Text>
                </View>
                <View style={styles.modalNutritionItem}>
                  <Text style={styles.modalNutritionValue}>{selectedRecipe.fat_g}g</Text>
                  <Text style={styles.modalNutritionLabel}>Fat</Text>
                </View>
              </View>
            </View>

            <View style={styles.modalIngredients}>
              <Text style={styles.modalSectionTitle}>Ingredients</Text>
              {selectedRecipe.ingredients_grams.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientName}>{ingredient.item}</Text>
                  <Text style={styles.ingredientAmount}>{ingredient.grams}g</Text>
                </View>
              ))}
            </View>

            <View style={styles.modalInstructions}>
              <Text style={styles.modalSectionTitle}>Instructions</Text>
              <Text style={styles.instructionsText}>{selectedRecipe.instructions}</Text>
            </View>

            {selectedRecipe.allergy_warning !== 'no allergies found' && (
              <View style={styles.allergyWarning}>
                <Ionicons name="warning" size={20} color="#FF6B6B" />
                <Text style={styles.allergyText}>{selectedRecipe.allergy_warning}</Text>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </Animated.View>
    );
  };


     // 4. MAIN RECIPES SCREEN - Show when recipes are loaded successfully
     if(recipes){
        return (

        <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
          <LinearGradient
                colors={['#f8f9fa', '#e9ecef', '#dee2e6']}
                style={styles.container}
              >
          <StatusBar barStyle="dark-content" />
          
          {/* Header with back button */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color="#212529" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Recipe Suggestions</Text>
            <View style={styles.headerSpacer} />
          </View>
    
          {/* Recipe list */}
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            
            {/* Ingredients Detected Box */}
            {ingredientsInPhoto && (
              <View style={styles.ingredientsBox}>
                <LinearGradient
                  colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
                  style={styles.ingredientsGradient}
                >
                  <View style={styles.ingredientsHeader}>
                    <Ionicons name="eye-outline" size={20} color="#495057" />
                    <Text style={styles.ingredientsTitle}>Ingredients Detected</Text>
                  </View>
                  <Text style={styles.ingredientsText}>{ingredientsInPhoto}</Text>
                </LinearGradient>
              </View>
            )}

            <View style={styles.recipesGrid}>
              {recipes.map((recipe, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.recipeCard}
                  onPress={() => handleRecipePress(recipe)}
                >
                  <LinearGradient
                    colors={['rgba(255, 255, 255, 0.9)', 'rgba(255, 255, 255, 0.8)']}
                    style={styles.cardGradient}
                  >
                    <View style={styles.cardHeader}>
                      <View style={styles.recipeNameContainer}>
                        <Text style={styles.recipeName} numberOfLines={2}>
                          {recipe.name}
                        </Text>
                        {recipe.isMostPopular && (
                          <View style={styles.popularBadge}>
                            <Ionicons name="star" size={12} color="#FFD700" />
                            <Text style={styles.popularText}>Most Popular</Text>
                          </View>
                        )}
                      </View>
                      <View style={styles.recipeMeta}>
                        <View style={styles.metaItem}>
                          <Ionicons name="time-outline" size={16} color="#6c757d" />
                          <Text style={styles.metaText}>{recipe.time_minutes}m</Text>
                        </View>
                        <View style={styles.metaItem}>
                          <Ionicons name="cash-outline" size={16} color="#6c757d" />
                          <Text style={styles.metaText}>${recipe.cost.toFixed(2)}</Text>
                        </View>
                      </View>
                    </View>

                    {renderHealthRating(recipe.health_rating)}

                    <View style={styles.nutritionRow}>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{recipe.calories}</Text>
                        <Text style={styles.nutritionLabel}>cal</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{recipe.protein_g}g</Text>
                        <Text style={styles.nutritionLabel}>protein</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{recipe.carbs_g}g</Text>
                        <Text style={styles.nutritionLabel}>carbs</Text>
                      </View>
                      <View style={styles.nutritionItem}>
                        <Text style={styles.nutritionValue}>{recipe.fat_g}g</Text>
                        <Text style={styles.nutritionLabel}>fat</Text>
                      </View>
                    </View>

                    <View style={styles.ingredientsPreview}>
                      <Text style={styles.ingredientsLabel}>Ingredients:</Text>
                      <Text style={styles.ingredientsText} numberOfLines={2}>
                        {recipe.ingredients_grams.map(ing => ing.item).join(', ')}
                      </Text>
                    </View>

                  
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
    
          {/* Recipe detail modal (shows when recipe is tapped) */}
          {renderRecipeModal()}
        </LinearGradient>
       </SafeAreaView>
            
        )
     }
    
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 10,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(233, 236, 239, 0.5)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    letterSpacing: -0.5,
    
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  resultsHeader: {
    paddingVertical: 30,
    alignItems: 'center',
    backgroundColor: '#ffffff',
    marginHorizontal: -20,
    marginBottom: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  resultsTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  resultsSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  ingredientsBox: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  ingredientsGradient: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  ingredientsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  ingredientsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
  },
  ingredientsText: {
    fontSize: 15,
    color: '#495057',
    lineHeight: 22,
    fontStyle: 'italic',
  },
  recipesGrid: {
    paddingBottom: 40,
  },
  recipeCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
  },
  cardGradient: {
    padding: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(20px)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  cardHeader: {
    marginBottom: 20,
  },
  recipeNameContainer: {
    marginBottom: 12,
  },
  recipeName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    lineHeight: 28,
  },
  popularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  popularText: {
    fontSize: 12,
    color: '#B8860B',
    fontWeight: '600',
    marginLeft: 4,
  },
  recipeMeta: {
    flexDirection: 'row',
    gap: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  healthRatingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  healthRatingLabel: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '600',
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  healthRatingText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '600',
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(248, 249, 250, 0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(233, 236, 239, 0.5)',
  },
  nutritionItem: {
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  nutritionLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontWeight: '500',
  },

  ingredientsPreview: {
    marginBottom: 20,
  },
  ingredientsLabel: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 8,
    fontWeight: '600',
  },
  cardFooter: {
    alignItems: 'flex-end',
  },
  viewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: 'rgba(13, 110, 253, 0.1)',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(13, 110, 253, 0.2)',
  },
  viewButtonText: {
    fontSize: 14,
    color: '#0d6efd',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    width: width - 40,
    maxHeight: '90%',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  modalTitleContainer: {
    flex: 1,
    marginRight: 20,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 8,
  },
  modalPopularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  modalPopularText: {
    fontSize: 14,
    color: '#B8860B',
    fontWeight: '600',
    marginLeft: 6,
  },
  modalHeaderButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  saveButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(40, 167, 69, 0.3)',
  },
  closeModalButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalMeta: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 28,
    paddingVertical: 20,
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalMetaItem: {
    alignItems: 'center',
    gap: 6,
  },
  modalMetaText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  modalNutrition: {
    marginBottom: 28,
  },
  modalSectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  modalNutritionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  modalNutritionItem: {
    alignItems: 'center',
  },
  modalNutritionValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#212529',
  },
  modalNutritionLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 4,
    fontWeight: '500',
  },
  modalIngredients: {
    marginBottom: 28,
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  ingredientName: {
    fontSize: 16,
    color: '#212529',
    flex: 1,
    fontWeight: '500',
  },
  ingredientAmount: {
    fontSize: 16,
    color: '#6c757d',
    fontWeight: '600',
  },
  modalInstructions: {
    marginBottom: 24,
  },
  instructionsText: {
    fontSize: 16,
    color: '#495057',
    lineHeight: 26,
  },
  allergyWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
    backgroundColor: 'rgba(220, 53, 69, 0.1)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(220, 53, 69, 0.2)',
  },
  allergyText: {
    fontSize: 14,
    color: '#dc3545',
    flex: 1,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginTop: 24,
    marginBottom: 12,
  },
  errorSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  noResultsTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginTop: 20,
    marginBottom: 10,
  },
  noResultsSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  retryButton: {
    backgroundColor: '#212529',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  retryButtonText: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: '600',
  },
});
