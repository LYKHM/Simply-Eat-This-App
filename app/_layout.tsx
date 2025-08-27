import FontAwesome from '@expo/vector-icons/FontAwesome';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
//import 'react-native-reanimated';
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo'
import { tokenCache } from '@clerk/clerk-expo/token-cache'




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
              <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
              <Stack.Screen name="RecipePage" options={{ headerShown: false }} />
            </Stack>
        </ThemeProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
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


  return <RootLayoutNav />;
}





  /*
  useEffect(() => {
    if (!loaded) return;
    const t = setTimeout(() => setSplashHold(false), 3000);
    console.log("main _layout: remove the splashscreen after 3s")
    return () => clearTimeout(t);
  }, [loaded]);

  

  useEffect(() => {
    console.log("main _layout: splashHold", splashHold);
    if (loaded && !splashHold) {
      SplashScreen.hideAsync();
    }
  }, [loaded, splashHold]);

  if (!loaded || splashHold) {
    return null;
  }

}
*/