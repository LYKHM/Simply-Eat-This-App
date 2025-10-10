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
  const [selectedCategory, setSelectedCategory] = useState<'beverages' | 'meals' | 'snacks' | 'desserts'>(
    (params.category as 'beverages' | 'meals' | 'snacks' | 'desserts') || 'meals'
  );
  const [photoType, setPhotoType] = useState<'fridge' | 'pantry'>('fridge');
  const [fridgePhoto, setFridgePhoto] = useState<string | null>(null);
  const [pantryPhoto, setPantryPhoto] = useState<string | null>(null);
  console.log('Selected category:', selectedCategory);
  console.log('Photo type:', photoType);

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
        
        switch (photoType) {
          case 'fridge':
            setFridgePhoto(photo.uri);
            // If pantry photo already exists, navigate immediately
            if (pantryPhoto) {
              router.replace({
                pathname: '/RecipeResults',
                params: { 
                  fridgePhoto: photo.uri,
                  pantryPhoto: pantryPhoto,
                  timestamp: Date.now().toString(),
                  category: selectedCategory,
                  diet: params.diet,
                  familyMembers: params.familyMembers,
                  calorieRange: params.calorieRange,
                  timeRange: params.timeRange,
                  slowCooker: params.slowCooker,
                  excludedFoods: params.excludedFoods,
                }
              });
            } else {
              // Switch to pantry mode to take pantry photo
              setPhotoType('pantry');
            }
            break;
            
          case 'pantry':
            setPantryPhoto(photo.uri);
            // If fridge photo already exists, navigate immediately
            if (fridgePhoto) {
              router.replace({
                pathname: '/RecipeResults',
                params: { 
                  fridgePhoto: fridgePhoto,
                  pantryPhoto: photo.uri,
                  timestamp: Date.now().toString(),
                  category: selectedCategory,
                  diet: params.diet,
                  familyMembers: params.familyMembers,
                  calorieRange: params.calorieRange,
                  timeRange: params.timeRange,
                  slowCooker: params.slowCooker,
                  excludedFoods: params.excludedFoods,
                }
              });
            } else {
              // Switch to fridge mode to take fridge photo
              setPhotoType('fridge');
            }
            break;
        }
      } catch (error) {
        console.error('Error taking photo:', error);
      }
    }
  };

  const handlePhotoTypeSwitch = (type: 'fridge' | 'pantry') => {
    // Only allow switching if the required photo hasn't been taken yet
    if (type === 'fridge' && !fridgePhoto) {
      setPhotoType('fridge');
    } else if (type === 'pantry' && !pantryPhoto) {
      setPhotoType('pantry');
    }
  };
  

  const handleClose = () => {
    router.back();
  };

  const handleReset = () => {
    setPhotoType('fridge');
    setFridgePhoto(null);
    setPantryPhoto(null);
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
        {(fridgePhoto || pantryPhoto) && (
          <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
            <Ionicons name="refresh" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Bottom Matte Black/Gray Area with Photo Button */}
      <View style={styles.bottomArea}>
        {/* Photo Type Toggle */}
        <View style={styles.photoTypeContainer}>
          <Text style={styles.photoTypeLabel}>
            {!fridgePhoto && !pantryPhoto && 'Take a photo of your fridge first'}
            {fridgePhoto && !pantryPhoto && photoType === 'pantry' && 'Now take a photo of your pantry'}
            {fridgePhoto && !pantryPhoto && photoType === 'fridge' && 'Retake fridge photo or switch to pantry'}
          </Text>
          <View style={styles.photoTypeToggle}>
            <TouchableOpacity 
              style={[
                styles.photoTypeButton,
                photoType === 'fridge' && styles.photoTypeButtonActive,
                fridgePhoto && photoType !== 'fridge' && styles.photoTypeButtonDisabled
              ]}
              onPress={() => handlePhotoTypeSwitch('fridge')}
              disabled={!!(fridgePhoto && photoType !== 'fridge')}
            >
              <Ionicons 
                name="snow" 
                size={20} 
                color={photoType === 'fridge' ? '#000' : '#fff'} 
              />
              <Text style={[
                styles.photoTypeButtonText,
                photoType === 'fridge' && styles.photoTypeButtonTextActive
              ]}>
                Fridge
              </Text>
              {fridgePhoto && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={photoType === 'fridge' ? '#000' : '#4CAF50'} 
                />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.photoTypeButton,
                photoType === 'pantry' && styles.photoTypeButtonActive,
                pantryPhoto && photoType !== 'pantry' && styles.photoTypeButtonDisabled
              ]}
              onPress={() => handlePhotoTypeSwitch('pantry')}
              disabled={!!(pantryPhoto && photoType !== 'pantry')}
            >
              <Ionicons 
                name="archive" 
                size={20} 
                color={photoType === 'pantry' ? '#000' : '#fff'} 
              />
              <Text style={[
                styles.photoTypeButtonText,
                photoType === 'pantry' && styles.photoTypeButtonTextActive
              ]}>
                Pantry
              </Text>
              {pantryPhoto && (
                <Ionicons 
                  name="checkmark-circle" 
                  size={16} 
                  color={photoType === 'pantry' ? '#000' : '#4CAF50'} 
                />
              )}
            </TouchableOpacity>
          </View>
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
  resetButton: {
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
    height: 280,
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
  photoTypeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  photoTypeLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  photoTypeToggle: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    padding: 4,
  },
  photoTypeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    gap: 8,
  },
  photoTypeButtonActive: {
    backgroundColor: '#fff',
  },
  photoTypeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  photoTypeButtonTextActive: {
    color: '#000',
  },
  photoTypeButtonDisabled: {
    opacity: 0.5,
  },
});