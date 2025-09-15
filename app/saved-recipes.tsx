import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Animated, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

interface SavedRecipe {
  id?: number;
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

export default function SavedRecipesScreen() {
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRecipe, setSelectedRecipe] = useState<SavedRecipe | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [modalScale] = useState(new Animated.Value(0.8));

  const loadSavedRecipes = async () => {
    setIsLoading(true);
    try {
      const saved = await AsyncStorage.getItem('savedRecipes');
      const recipes = saved ? JSON.parse(saved) : [];
      setSavedRecipes(recipes);
    } catch (error) {
      console.error('Error loading saved recipes:', error);
      Alert.alert('Error', 'Failed to load saved recipes');
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadSavedRecipes();
      return () => {};
    }, [])
  );

  const handleBack = () => {
    router.back();
  };

  const openRecipe = (recipe: SavedRecipe) => {
    setSelectedRecipe(recipe);
    setModalVisible(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const closeModal = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
      setSelectedRecipe(null);
    });
  };

  const handleDelete = async (recipeId?: number) => {
    if (recipeId === undefined) return;
    try {
      const updated = savedRecipes.filter(r => r.id !== recipeId);
      await AsyncStorage.setItem('savedRecipes', JSON.stringify(updated));
      setSavedRecipes(updated);
      closeModal();
    } catch (error) {
      console.error('Error deleting recipe:', error);
      Alert.alert('Error', 'Failed to delete recipe');
    }
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
                <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(selectedRecipe.id)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
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

  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <LinearGradient
        colors={['#ffffff', '#fef7ff', '#f0f9ff']}
        style={styles.container}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={22} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Saved Recipes</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
          {isLoading ? (
            <View style={styles.center}>
              <Text>Loading saved recipes...</Text>
            </View>
          ) : savedRecipes.length === 0 ? (
            <View style={styles.center}>
              <Ionicons name="restaurant-outline" size={64} color="#9ca3af" />
              <Text style={styles.emptyTitle}>No saved recipes</Text>
              <Text style={styles.emptySubtitle}>Save recipes from the results screen to see them here.</Text>
            </View>
          ) : (
            savedRecipes.map((recipe, index) => (
              <TouchableOpacity
                key={recipe.id || `recipe-${index}`}
                style={styles.card}
                onPress={() => openRecipe(recipe)}
              >
                <View style={styles.cardIcon}>
                  <Ionicons name="restaurant" size={24} color="#6b7280" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{recipe.name}</Text>
                  <View style={styles.metaRow}>
                    <Text style={styles.metaText}>{recipe.calories} cal</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.metaText}>{recipe.time_minutes} min</Text>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.metaText}>${Number(recipe.cost).toFixed(2)}</Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* Recipe detail modal (shows when recipe is tapped) */}
        {renderRecipeModal()}
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  deleteButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  center: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    fontSize: 12,
    color: '#6b7280',
  },
  dot: {
    marginHorizontal: 4,
    color: '#9ca3af',
  },
  rowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  badgeText: {
    fontSize: 12,
    color: '#374151',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  macroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroText: {
    fontSize: 14,
    color: '#374151',
  },
  ingredientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
});


