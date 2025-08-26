import { useSSO, useUser } from "@clerk/clerk-expo";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import * as AuthSession from 'expo-auth-session'
 
 
const SocialLoginButton = ({
  strategy,
}: {
  strategy: "facebook" | "google" | "apple";
}) => {
  const getStrategy = () => {
    if (strategy === "facebook") {
      return "oauth_facebook";
    } else if (strategy === "google") {
      return "oauth_google";
    } else if (strategy === "apple") {
      return "oauth_apple";
    }
    return "oauth_facebook";
  };

  
  const { startSSOFlow } = useSSO(); 
  const { user, isLoaded  } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  

  const router = useRouter();
  const buttonText = () => {
    if (isLoading) {
      return "Loading...";
    }
 
    if (strategy === "facebook") {
      return "Continue with Facebook";
    } else if (strategy === "google") {
      return "Continue with Google";
    } else if (strategy === "apple") {
      return "Continue with Apple";
    }
  };

  const buttonIcon = () => {
    if (strategy === "facebook") {
      return <Ionicons name="logo-facebook" size={24} color="#1977F3" />;
    } else if (strategy === "google") {
      return <Ionicons name="logo-google" size={24} color="#DB4437" />;
    } else if (strategy === "apple") {
      return <Ionicons name="logo-apple" size={24} color="black" />;
    }
  };
  
  useEffect(() => {
    if (user && isLoaded) {
      // User is now available, sync with database
      syncUserWithDatabase();
    }
  }, [user, isLoaded]);
 

  const onSocialLoginPress = React.useCallback(async () => {
    try {
      setIsLoading(true);

      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: getStrategy(), //Initiates the OAuth flow with Google or Apple
      });
    
      // If sign in was successful, set the active session
      if (createdSessionId) {
        //console.log("Session created", createdSessionId);
        setActive!({ session: createdSessionId });
        

      } else {
        // Use signIn or signUp returned from startOAuthFlow
        // for next steps, such as MFA
      }
    } catch (err) {
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  }, []);


  const syncUserWithDatabase = async () => {
   
    try {
      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: user?.id,
          email: user?.emailAddresses[0]?.emailAddress,
          provider: strategy === 'google' ? 'google' : strategy === 'apple' ? 'apple' : 'email'
        })
      });

    
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Response not OK. Status:", response.status, "Body:", errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
  
      const data = await response.json();
      console.log('✅ User synced successfully:', data);
    } catch (error) {
      console.error('Error syncing user, backend problem:', error);
    }
  };



  return (
    <TouchableOpacity
      style={[styles.container]}
      onPress={onSocialLoginPress}
      disabled={isLoading}
    >
      {isLoading ? (
        <ActivityIndicator size="small" color="black" />
      ) : (
        buttonIcon()
      )}
      <Text style={styles.buttonText}>{buttonText()}</Text>
      <View />
    </TouchableOpacity>
  );
};

export default SocialLoginButton;

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderColor: "gray",
    borderWidth: StyleSheet.hairlineWidth,
    padding: 10,
    borderRadius: 10,
    flexDirection: "row",
    gap: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonText: {
    fontSize: 15,
    fontWeight: "medium",
  },
});