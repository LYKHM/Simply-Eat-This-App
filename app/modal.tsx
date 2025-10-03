import { CameraView, CameraType } from 'expo-camera';
import { useState, useRef } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Rect, Defs, Mask } from "react-native-svg";
 
export default function App() {
  const params = useLocalSearchParams();
  const [facing, setFacing] = useState<CameraType>('back');
  const cameraRef = useRef<CameraView>(null);
  const [selectedCategory, setSelectedCategory] = useState<'beverages' | 'meals' | 'snacks' | 'desserts'>('meals');
  console.log('Selected category:', selectedCategory);

  const { width, height } = Dimensions.get('window');
  const rectWidth = width * 0.85;
  const rectHeight = height * 0.55;
  const rectX = (width - rectWidth) / 2;
  const rectY = (height - rectHeight) / 2 - 50;


  const takePhoto = async () => {
   
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.6, // The image is too large, so reduce the quality
        });
        
        //const base64Image = photo.base64;
        
        
      // Navigate immediately to RecipeResults with the photo data and filter params
      
      router.replace({
        pathname: '/RecipeResults',
        params: { 
          photo: photo.uri,
          timestamp: Date.now().toString(), // Add timestamp to ensure fresh navigation
          category: selectedCategory,
          // Pass along all filter parameters
          diet: params.diet,
          familyMembers: params.familyMembers,
          calorieRange: params.calorieRange,
          timeRange: params.timeRange,
          slowCooker: params.slowCooker,
          excludedFoods: params.excludedFoods,

        }
      });
   
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    }
  };
  

  const handleClose = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" />
      
      {/* Camera View */}
      <CameraView style={styles.camera} facing={facing} ref={cameraRef} />
      
      {/* SVG Overlay with rounded rectangle cutout */}
      <Svg 
        height="100%" 
        width="100%" 
        style={StyleSheet.absoluteFillObject}
      >
        <Defs>
          <Mask id="mask">
            {/* White background = visible */}
            <Rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black rectangle = hidden (creates the hole) */}
            <Rect 
              x={rectX} 
              y={rectY} 
              width={rectWidth} 
              height={rectHeight} 
              fill="black" 
              rx="20" 
              ry="20" 
            />
          </Mask>
        </Defs>
        {/* Dark overlay with mask applied */}
        <Rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.2)"
          mask="url(#mask)"
        />
      </Svg>

      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Matte Black/Gray Area with Photo Button */}
      <View style={styles.bottomArea}>
        {/* Food Category Icons */}
        <View style={styles.categoryContainer}>

        {/*
          <TouchableOpacity 
            style={styles.categoryButton} 
            onPress={() => setSelectedCategory('beverages')}
          >
            <Ionicons 
              name="wine" 
              size={24} 
              color={selectedCategory === 'beverages' ? '#FFD700' : '#fff'} 
            />
            <Text style={styles.categoryText}>Beverage</Text>
          </TouchableOpacity>
          */}
          
          
          <TouchableOpacity 
            style={styles.categoryButton} 
            onPress={() => setSelectedCategory('meals')}
          >
            <Ionicons 
              name="restaurant" 
              size={24} 
              color={selectedCategory === 'meals' ? '#FFD700' : '#fff'} 
            />
            <Text style={styles.categoryText}>Meal</Text>
          </TouchableOpacity>
          
            
          <TouchableOpacity 
            style={styles.categoryButton} 
            onPress={() => setSelectedCategory('snacks')}
          >
            <Ionicons 
              name="nutrition" 
              size={24} 
              color={selectedCategory === 'snacks' ? '#FFD700' : '#fff'} 
            />
            <Text style={styles.categoryText}>Snack</Text>
          </TouchableOpacity>
          

          <TouchableOpacity 
            style={styles.categoryButton} 
            onPress={() => setSelectedCategory('desserts')}
          >
            <Ionicons 
              name="ice-cream" 
              size={24} 
              color={selectedCategory === 'desserts' ? '#FFD700' : '#fff'} 
            />
            <Text style={styles.categoryText}>Dessert</Text>
          </TouchableOpacity>
          
        </View>
        
        <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
  
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
    borderRadius: 20,
  },
  topControls: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    backdropFilter: 'blur(10px)',
    zIndex: 1,
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 4 },
    //shadowOpacity: 0.25,
    //shadowRadius: 12,
    //elevation: 6,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  captureButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 20,
  },
  categoryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  categoryButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  categoryText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
    textAlign: 'center',
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  permissionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
   // shadowColor: '#000',
   // shadowOffset: { width: 0, height: 20 },
   // shadowOpacity: 0.3,
   // shadowRadius: 40,
    //elevation: 10,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
   // backdropFilter: 'blur(20px)',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  permissionMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  permissionButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
    //shadowColor: '#000',
    //shadowOffset: { width: 0, height: 8 },
    //shadowOpacity: 0.2,
    //shadowRadius: 16,
    //elevation: 8,
    boxShadow: '7px 7px 10px 2px rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  permissionButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});