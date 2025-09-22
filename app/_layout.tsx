import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
//import 'react-native-reanimated';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'
import Purchases from 'react-native-purchases';
import { Alert, Platform } from 'react-native';

// Good for debugging the paywall




import { useColorScheme } from '@/components/useColorScheme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();
const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;




function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
  
    <ClerkProvider tokenCache={tokenCache} publishableKey={publishableKey || ''}>
       <ClerkLoaded>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="(tabs)" options={{ headerShown: false, gestureEnabled: false  }} />
              <Stack.Screen name="(auth)" options={{ headerShown: false, gestureEnabled: false }} />
              <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
              <Stack.Screen name="RecipePage" options={{ headerShown: false }} />
              <Stack.Screen name="RecipeResults" options={{ headerShown: false }} />
              <Stack.Screen name="profile-information" options={{ headerShown: false }} />
              <Stack.Screen name="account-information" options={{ headerShown: false }} />
              <Stack.Screen name="diet-type" options={{ headerShown: false }} />
              <Stack.Screen name="nutrition-targets" options={{ headerShown: false }} />
              <Stack.Screen name="weight-goal" options={{ headerShown: false }} />
              <Stack.Screen name="terms-of-service" options={{ headerShown: false }} />
              <Stack.Screen name="citations" options={{ headerShown: false }} />
              <Stack.Screen name="saved-recipes" options={{ headerShown: false }} />
              <Stack.Screen name="FilterPage" options={{ headerShown: false }} />
              <Stack.Screen name="paywall" options={{ headerShown: false }} />
            </Stack>
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    BricolageGrotesque: require('../assets/fonts/BricolageGrotesque_Condensed-Regular.ttf'), 
    BricolageGrotesqueBold: require('../assets/fonts/BricolageGrotesque_SemiCondensed-Bold.ttf'), 
    ...FontAwesome.font,
  });
  const [splashHold, setSplashHold] = useState(true);

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);


  useEffect(() => {
    async function prepare() {
      try {
        // Artificially delay for two seconds to simulate a slow loading
        // experience. Remove this if you copy and paste the code!
        await new Promise(resolve => setTimeout(resolve, 1000));
        SplashScreen.hide();
      //  console.log("main _layout: remove the splashscreen after 1s")
      } catch (e) {
        console.warn(e);
      } 
    }
    prepare();
  }, []);


  // Configure RevenueCat
  useEffect(() => {
    if (Platform.OS === 'ios') {
      if(!process.env.EXPO_PUBLIC_RC_IOS) {
        Alert.alert("Error configure RC", "RevenueCat API key for ios not provided")
      }else{
        Purchases.configure({apiKey: process.env.EXPO_PUBLIC_RC_IOS});
      }
      
    } else if (Platform.OS === 'android') {
      if(!process.env.EXPO_PUBLIC_RC_ANDROID) {
        Alert.alert("Error configure RC", "RevenueCat API key for android not provided")
      }else{
        Purchases.configure({apiKey: process.env.EXPO_PUBLIC_RC_ANDROID});
      }
    }

  
  },[]);

  useEffect(() => {
    async function fetchProducts() {
      const offerings = await Purchases.getOfferings();
      console.log('offerings', offerings);
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('customerInfo', customerInfo);
    }
    fetchProducts();
  },[]);

 
  return <RootLayoutNav />;
}
