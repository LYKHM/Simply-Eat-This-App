// app/index.tsx
import { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Asset } from 'expo-asset';
import { useAuth } from '@clerk/clerk-expo';


import SPLASH_IMAGE from '../assets/images/SplashIcon.png';

// Match app.json -> { "splash": { "backgroundColor": "<this hex>" } }
const SPLASH_BG = '#ffffff';

export default function Index() {
  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();

  const [hasSeenOnboarding, setHasSeenOnboarding] = useState<boolean | null>(null);
  const [imgReady, setImgReady] = useState(false);

  // Preload the splash image to avoid flicker
  useEffect(() => {
    Asset.fromModule(SPLASH_IMAGE).downloadAsync().finally(() => setImgReady(true));
  }, []);

  // Read onboarding flag
  useEffect(() => {
    (async () => {
      try {
        const v = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(v === 'true');
      } catch {
        setHasSeenOnboarding(false);
      }
    })();
  }, []);

  const ready = clerkLoaded && hasSeenOnboarding !== null && imgReady;

  // In-app splash (identical to native)
  if (!ready) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: SPLASH_BG }}>
        <Image
          source={SPLASH_IMAGE}
          className="w-3/5 h-2/5"
          resizeMode="contain"
        />
      </View>
    );
  }

  // Routing decisions
  if (!hasSeenOnboarding) return <Redirect href="/onboarding" />;
  if (isSignedIn) return <Redirect href="/(tabs)" />;
  return <Redirect href="/" />;
}