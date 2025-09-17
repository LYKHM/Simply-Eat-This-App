import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

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

interface EmptyMealProps {
  groupIndex: number;
  mealIndex: number;
  mealLabel: string;
  targetCalories: number;
  onRecipeSelected: (groupIndex: number, mealIndex: number, recipe: SavedRecipe) => void;
}

const EmptyMeal: React.FC<EmptyMealProps> = ({
  groupIndex,
  mealIndex,
  mealLabel,
  targetCalories,
  onRecipeSelected
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadSavedRecipes = async () => {
    setIsLoading(true);
    try {
      const saved = await AsyncStorage.getItem('savedRecipes');
      if (saved) {
        const recipes = JSON.parse(saved);
        setSavedRecipes(recipes);
      } else {
        setSavedRecipes([]);
      }
    } catch (error) {
      console.error('Error loading saved recipes:', error);
      Alert.alert('Error', 'Failed to load saved recipes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmptySlotPress = () => {
    loadSavedRecipes();
    setIsModalVisible(true);
  };

  const handleRecipeSelect = (recipe: SavedRecipe) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRecipeSelected(groupIndex, mealIndex, recipe);
    setIsModalVisible(false);
  };


  return (
    <>
      <View style={styles.container}>
        <TouchableOpacity style={styles.emptyCard} onPress={handleEmptySlotPress}>
          <View style={styles.emptyIconContainer}>
            <Ionicons name="add-circle-outline" size={48} color="#9ca3af" />
          </View>
          <View style={styles.emptyContent}>
            <Text style={styles.emptyText}>Tap to add recipe</Text>
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Choose Recipe for {mealLabel}</Text>
            <TouchableOpacity onPress={() => setIsModalVisible(false)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.recipesList}>
            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text>Loading saved recipes...</Text>
              </View>
            ) : savedRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="restaurant-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No saved recipes found</Text>
                <Text style={styles.emptyStateSubtext}>
                  Save recipes from the recipe page to use them here
                </Text>
              </View>
            ) : ( 
              savedRecipes.map((recipe, index) => {
                return (
                  <TouchableOpacity
                    key={recipe.id || `recipe-${index}`}
                    style={styles.recipeCard}
                    onPress={() => handleRecipeSelect(recipe)}
                  >
                    <View style={styles.recipeIconContainer}>
                      <Ionicons name="restaurant" size={32} color="#9ca3af" />
                    </View>
                    <View style={styles.recipeInfo}>
                      <Text style={styles.recipeName}>{recipe.name}</Text>
                      <Text style={styles.recipeCalories}>
                        {recipe.calories} cal
                      </Text>
                      <View style={styles.recipeMacros}>
                        <Text style={styles.macroText}>P: {recipe.protein_g}g</Text>
                        <Text style={styles.macroText}>C: {recipe.carbs_g}g</Text>
                        <Text style={styles.macroText}>F: {recipe.fat_g}g</Text>
                      </View>
                      <Text style={styles.recipeTime}>
                        {recipe.time_minutes} min
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  emptyCard: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e5e5',
    borderStyle: 'dashed',
    marginBottom: 12,
    height: 80,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContent: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6b7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  recipesList: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 1 },
    //shadowOpacity: 0.05,
    //shadowRadius: 2,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
    //elevation: 1,
  },
  recipeIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  recipeCalories: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  recipeMacros: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  macroText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  recipeTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

export default EmptyMeal;
