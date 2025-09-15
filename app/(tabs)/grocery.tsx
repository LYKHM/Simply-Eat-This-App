import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';


interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  unit: string;
  isCompleted: boolean;
}

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



export default function GroceryScreen() {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipe[]>([]);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [showRecipeSelection, setShowRecipeSelection] = useState(true);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    loadData();
  }, []);


  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load saved recipes from AsyncStorage
      const savedRecipesString = await AsyncStorage.getItem('savedRecipes');
      const recipes: SavedRecipe[] = savedRecipesString ? JSON.parse(savedRecipesString) : [];
      setSavedRecipes(recipes);

      const groceryItemsString = await AsyncStorage.getItem('groceryItems');
      //console.log('groceryItemsString', groceryItemsString);
      const groceryItems: GroceryItem[] = groceryItemsString ? JSON.parse(groceryItemsString) : [];
      setGroceryItems(groceryItems);

      const selectedRecipesString = await AsyncStorage.getItem('selectedRecipes');
      //console.log('selectedRecipesString', selectedRecipesString);
      const selectedRecipes: string[] = selectedRecipesString ? JSON.parse(selectedRecipesString) : [];
      setSelectedRecipes(new Set(selectedRecipes));

       // If we have grocery items, show grocery list instead of recipe selection
       if (groceryItems.length > 0) {
        setShowRecipeSelection(false);
      }

    } catch (error) {
      console.error('Error loading saved recipes:', error);
      Alert.alert('Error', 'Failed to load saved recipes');
    } finally {
      setIsLoading(false);
    }
  };


  const saveGroceryItems = async (items: GroceryItem[]) => {
    try {
      await AsyncStorage.setItem('groceryItems', JSON.stringify(items));
    } catch (error) {
      console.error('Error saving grocery items:', error);
    }
  };

  // Save selected recipes to AsyncStorage
  const saveSelectedRecipes = async (selected: Set<string>) => {
    try {
      await AsyncStorage.setItem('selectedRecipes', JSON.stringify(Array.from(selected)));
    } catch (error) {
      console.error('Error saving selected recipes:', error);
    }
  };


  const toggleRecipeSelection = (recipeName: string) => {
    const newSelected = new Set(selectedRecipes);
    if (newSelected.has(recipeName)) {
      newSelected.delete(recipeName);
    } else {
      newSelected.add(recipeName);
    }
    setSelectedRecipes(newSelected);
    saveSelectedRecipes(newSelected);
  };

  const addSelectedRecipesToGrocery = () => {
    if (selectedRecipes.size === 0) {
      Alert.alert('No Recipes Selected', 'Please select at least one recipe to add to your grocery list.');
      return;
    }

    // Get ingredients from selected recipes
    // What is the purpose of this
    const allIngredients: { [key: string]: { quantity: number; unit: string } } = {};


    savedRecipes.forEach(recipe => {
      if (selectedRecipes.has(recipe.name)) {
        recipe.ingredients_grams.forEach(ingredient => {
          const itemName = ingredient.item.toLowerCase().trim();
          const grams = ingredient.grams;
          
          if (allIngredients[itemName]) {
            allIngredients[itemName].quantity += grams;
          } else {
            allIngredients[itemName] = {
              quantity: grams,
              unit: grams > 0 ? 'g' : 'as needed'
            };
          }
        });
      }
    });

    // Convert to grocery items
    const newGroceryItems: GroceryItem[] = Object.entries(allIngredients).map(([name, data], index) => ({
      id: `ingredient-${Date.now()}-${index}`,
      name: name.charAt(0).toUpperCase() + name.slice(1),
      quantity: data.quantity > 0 ? data.quantity.toString() : '1',
      unit: data.unit,
      isCompleted: false,
    }));

    // Add to existing grocery items (avoid duplicates)
    setGroceryItems(prevItems => {
      const existingNames = new Set(prevItems.map(item => item.name.toLowerCase()));
      const uniqueNewItems = newGroceryItems.filter(item => !existingNames.has(item.name.toLowerCase()));
      const updatedItems = [...prevItems, ...uniqueNewItems];
      saveGroceryItems(updatedItems); // Save to AsyncStorage
      return updatedItems;
    });

    setShowRecipeSelection(false);
    Alert.alert('Success', `Added ingredients from ${selectedRecipes.size} recipe(s) to your grocery list!`);
  };

  const toggleItemCompletion = (id: string) => {
    setGroceryItems(prevItems => {
      const updatedItems = prevItems.map(item =>
        item.id === id ? { ...item, isCompleted: !item.isCompleted } : item
      );
      saveGroceryItems(updatedItems); // Save to AsyncStorage
      return updatedItems;
    });
  };




  const deleteItem = (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setGroceryItems(prevItems => {
              const updatedItems = prevItems.filter(item => item.id !== id);
              saveGroceryItems(updatedItems); // Save to AsyncStorage
              return updatedItems;
            });
          },
        },
      ]
    );
  };

  const clearGroceryList = () => {
    Alert.alert(
      'Clear Grocery List',
      'Are you sure you want to clear all items?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setGroceryItems([]);
            setShowRecipeSelection(true);
            setSelectedRecipes(new Set());
            
            
            await AsyncStorage.removeItem('groceryItems');
            await AsyncStorage.removeItem('selectedRecipes');
          },
        },
      ]
    );
  };

  const completedCount = groceryItems.filter(item => item.isCompleted).length;
  const totalCount = groceryItems.length;
  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container]} edges={['top', 'left', 'right']}>
        <LinearGradient colors={['#ffffff', '#e3f2fd', '#fce4ec']} style={{ flex: 1 }}>
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: colors.text }]}>Loading...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container]} edges={['top', 'left', 'right']}>
      <LinearGradient colors={['#ffffff', '#e3f2fd', '#fce4ec']} style={{ flex: 1 }}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Grocery List</Text>
          
          {!showRecipeSelection && (
            <View style={styles.headerActions}>
              <TouchableOpacity 
                style={styles.actionButton} 
                onPress={() => setShowRecipeSelection(true)}
              >
                <Ionicons name="add" size={20} color={colors.tint} />
                <Text style={[styles.actionButtonText, { color: colors.tint }]}>Add Recipes</Text>
              </TouchableOpacity>
              
              {groceryItems.length > 0 && (
                <TouchableOpacity 
                  style={styles.actionButton} 
                  onPress={clearGroceryList}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                  <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {!showRecipeSelection && (
            <View style={styles.progressContainer}>
              <Text style={[styles.progressText, { color: colors.text }]}>
                {completedCount} of {totalCount} completed
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }
                  ]} 
                />
              </View>
            </View>
          )}
        </View>

        {/* Recipe Selection Screen */}
        {showRecipeSelection && (
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Select Recipes to Add to Grocery List
            </Text>
            
            {savedRecipes.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="book-outline" size={64} color={colors.text} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  No saved recipes found!
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text }]}>
                  Save some recipes first to create a grocery list.
                </Text>
              </View>
            ) : (
              <>
                {savedRecipes.map(recipe => (
                  <TouchableOpacity
                    key={recipe.name}
                    style={[
                      styles.recipeCard,
                      { backgroundColor: colors.background },
                      selectedRecipes.has(recipe.name) && styles.selectedRecipeCard
                    ]}
                    onPress={() => toggleRecipeSelection(recipe.name)}
                  >
                    <View style={styles.recipeCardLeft}>
                      <View style={[
                        styles.recipeCheckbox,
                        { 
                          backgroundColor: selectedRecipes.has(recipe.name) ? colors.tint : 'transparent',
                          borderColor: colors.tint,
                        }
                      ]}>
                        {selectedRecipes.has(recipe.name) && (
                          <Ionicons name="checkmark" size={16} color="white" />
                        )}
                      </View>
                      <View style={styles.recipeInfo}>
                        <Text style={[styles.recipeName, { color: colors.text }]}>
                          {recipe.name}
                        </Text>
                        <Text style={[styles.recipeDetails, { color: colors.text }]}>
                          {recipe.ingredients_grams.length} ingredients • {recipe.time_minutes} min • {recipe.calories} cal
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  style={[
                    styles.addButton,
                    { backgroundColor: selectedRecipes.size > 0 ? colors.tint : '#ccc' }
                  ]}
                  onPress={addSelectedRecipesToGrocery}
                  disabled={selectedRecipes.size === 0}
                >
                  <Text style={styles.addButtonText}>
                    Add {selectedRecipes.size} Recipe{selectedRecipes.size !== 1 ? 's' : ''} to Grocery List
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        )}

        {/* Grocery List Screen */}
        {!showRecipeSelection && (
          <>
            {groceryItems.map(item => (
              <View key={item.id} style={[styles.groceryItem, { backgroundColor: colors.background }]}>
                <TouchableOpacity
                  style={styles.itemLeft}
                  onPress={() => toggleItemCompletion(item.id)}
                >
                  <View style={[
                    styles.checkbox,
                    { 
                      backgroundColor: item.isCompleted ? colors.tint : 'transparent',
                      borderColor: colors.tint,
                    }
                  ]}>
                    {item.isCompleted && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <View style={styles.itemInfo}>
                    <Text style={[
                      styles.itemName,
                      { color: colors.text },
                      item.isCompleted && styles.completedText
                    ]}>
                      {item.name}
                    </Text>
                    <Text style={[styles.itemQuantity, { color: colors.text }]}>
                      {item.quantity} {item.unit}
                    </Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => deleteItem(item.id)}
                >
                  <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
                </TouchableOpacity>
              </View>
            ))}

            {groceryItems.length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="basket-outline" size={64} color={colors.text} />
                <Text style={[styles.emptyStateText, { color: colors.text }]}>
                  Your grocery list is empty!
                </Text>
                <Text style={[styles.emptyStateSubtext, { color: colors.text }]}>
                  Select some recipes to add ingredients.
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    opacity: 0.7,
  },
  header: {
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressText: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.7,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4ECDC4',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  recipeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  selectedRecipeCard: {
    borderColor: '#4ECDC4',
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  recipeCardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipeCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recipeInfo: {
    flex: 1,
  },
  recipeName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  recipeDetails: {
    fontSize: 14,
    opacity: 0.7,
  },
  addButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  groceryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  itemQuantity: {
    fontSize: 14,
    opacity: 0.7,
  },
  completedText: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
  },
});