import { Redirect, router, Stack } from 'expo-router';
import { useAuth } from '@clerk/clerk-expo';
import React, { useEffect, useState } from 'react';

export default function AuthRoutesLayout() {

  //Do I need isSingedIn inside this file or can I move it to the auth/index??
 //const {isSignedIn} = useAuth();
 //console.log("auth/_layout: isSignedIn:", isSignedIn);

 // This one doesnt trigger because I logged in with social media account?
 // Or something else runs before this _layout.tsx
 
 // If I remove this useEffect I can't log in. I am just stuck in the sign up page with a error  "code": "session_exists"
 // ,
 /*
 useEffect(() => {
  if (isSignedIn) {
    // Signed in → go into the protected tab navigator
    router.replace('/(tabs)');
  } else {
    // Not signed in → stay on /auth (your paywall + login screen)
    router.replace('/auth');
  }
}, [isSignedIn]);
*/
 
     return (
        <Stack>
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="sign-up" options={{ gestureEnabled: false, headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ gestureEnabled: false, headerShown: false }} />  
        </Stack>
      );
    }