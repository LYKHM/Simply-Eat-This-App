import { StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { router } from 'expo-router';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image'; 
import { useAuth } from '@clerk/clerk-expo';
import SPLASH_IMAGE from '../assets/SplashIcon.png';


SplashScreen.preventAutoHideAsync();

const USE_SPLAH_IMAGE = SPLASH_IMAGE;
// Match your app.json -> splash.backgroundColor
const SPLASH_BG = '#ffffff'; // What is this color?

const Index = () => {
  //const navState = useRootNavigationState(); // I dont think i need this

  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  //console.log("main index: hasSeenOnboarding State:", hasSeenOnboarding)

    SplashScreen.setOptions({
    duration: 1100,
    fade: true,
  });
  
  useEffect(() => {
      async function prepare() {
        try {
          // Artificially delay for two seconds to simulate a slow loading
          // experience. Remove this if you copy and paste the code!
          await new Promise(resolve => setTimeout(resolve, 3000));
          SplashScreen.hide();
          console.log("main index: remove the splashscreen after 3s")
        } catch (e) {
          console.warn(e);
        } 
      }
      prepare();
    }, []);
  

  useEffect(() => {
    const checkHasUserSeenOnboarding = async () => {
     // console.log("main index: check of the user has seen onboarding")
      try {
        const value = await AsyncStorage.getItem('hasSeenOnboarding'); // This has to be async storage
        console.log("main index: The hasSeenOnboarding value is:", value)
        setHasSeenOnboarding(value === 'true');
      } catch (error) {
        console.error('Error checking onboarding status:', error);
        setHasSeenOnboarding(false); // Fallback to onboarding on error
      }
      //finally{
      //  await SecureStore.deleteItemAsync('hasSeenOnboarding');
      //  console.log("main index: temporary remove the hasSeenOnboarding")
   //  }
    };
    checkHasUserSeenOnboarding();
  }, []);

  useEffect(() => {
    if (hasSeenOnboarding === null) return;
    if (hasSeenOnboarding) {
    //  console.log('main index: the user has seen onboarding, go to paywall/sign-in page');
      router.replace('/auth'); // Should this be router.replace or redirect? 
    } else {
    //  console.log('main index: the user has not seen onboarding');
      router.replace('/auth/onboarding');
    }
  }, [hasSeenOnboarding]);



  // Return null until onboarding status is known to keep splash screen visible
  if (hasSeenOnboarding === null) {
    return null;
  }

  // No UI needed, as navigation happens via router.replace
  return null;
};

export default Index;

const styles = StyleSheet.create({});