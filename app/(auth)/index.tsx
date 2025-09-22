

import { StyleSheet, Text, View, Image, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import React from "react";
import { Link } from "expo-router";
import { useRouter } from 'expo-router'
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo'
import SocialLogInButton from "../../components/SocialLogInButton";



export const useWarmUpBrowser = () => {
  useEffect(() => {
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
};
WebBrowser.maybeCompleteAuthSession();



const AuthScreen = () => {
  //console.log("You are on the index screen/sign in screen")
  //console.log("env file:", process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY); 

  const {isSignedIn} = useAuth();
  //console.log("auth/index: isSignedIn:", isSignedIn);

 
 
 
 
  useWarmUpBrowser();

  const { getToken } = useAuth();  // This is for auto log in later
  const { user } = useUser()  
  //console.log("auth/index: user:", user);

  const { signIn, setActive, isLoaded } = useSignIn()
  const router = useRouter()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')


     // This one does not work
     useEffect(() => {
    //  console.log("auth/index: useEffect. isSignedIn:", isSignedIn);
    //  console.log("auth/index: useEffect. showPaywall:", showPaywall);
      if (isSignedIn) {
     //   console.log("auth/index: Run useEffect with isSignedIn");
        router.replace('/(tabs)'); //
      }
  }, [isSignedIn]);

  
  const onSignInPress = React.useCallback(async () => {
    if(!isLoaded) return

 
  if (signIn) {
  //  console.log("auth/index: showpaywall is false and signIn is true")
    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress,
        password,
      });

      if (signInAttempt.status === 'complete') {
        await setActive({ session: signInAttempt.createdSessionId })

        router.replace('/(tabs)')
       // router.replace('/(tabs)/eat_this') // Oh is this the problem???
      } else {
        console.error(JSON.stringify(signInAttempt, null, 2))
      }
    } catch (err) {
      Alert.alert(
      "Sign In Error",
      "There was an issue with the email or password. Please try again.",
      [{ text: "OK" }]
    );
      console.error(JSON.stringify(err, null, 2))
    }
  }
}, [isLoaded, emailAddress, password]);
 
  return (
 
  <SafeAreaView style={{flex: 1}} edges={['top', 'left', 'right']}>
    <KeyboardAvoidingView
      style={[
        styles.container,
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0} // What about android+
    >
      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled" 
        >

          
          <View style={styles.headingContainer}>
            <Text style={styles.label}>Sign In to Simply Eat This</Text>
            <Text style={styles.description}>
              You must create an account to access the app
            </Text>
          </View>

          <View style={styles.socialButtonsContainer}>
            {/*<SocialLogInButton strategy="facebook" /> */}
            <SocialLogInButton strategy="google" />
            <SocialLogInButton strategy="apple" />
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>
          
          <View style={styles.inputContainer}>
            <Text style={styles.SignIn}>Sign In</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={emailAddress}
              placeholder="Enter email"
              placeholderTextColor="#888" 
              onChangeText={(emailAddress) => setEmailAddress(emailAddress)}
            />
            <TextInput
              style={styles.input}
              value={password}
              placeholder="Enter password"
              placeholderTextColor="#888" 
              secureTextEntry={true}
              onChangeText={(password) => setPassword(password)}
            />
            <TouchableOpacity style={styles.button} onPress={onSignInPress}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          </View>
          
            <View style={styles.pressButton}>
              <Text style={styles.pressButtonText}>Don't have an account?</Text>
              <Link href={"/sign-up" as any} style={styles.pressButtonText2}>Sign Up</Link>
            </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView> 
  ); 
};

export default AuthScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    padding: 20,
    justifyContent: "center",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 10,
  },
  logo: {
    width: 115,
    height: 60,
  },
  headingContainer: {
    marginBottom: 20,
    alignItems: "center",
  },
  label: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  description: {
    fontSize: 15,
    color: "gray",
    textAlign: "center"
  },
  socialButtonsContainer: {
    marginTop: 20,
    gap: 10,
  },
  inputContainer: {
    backgroundColor: "white", 
    gap: 12, 
    padding: 20, 
    borderRadius: 10, 
  },
  input: {
    backgroundColor: "#f0f0f0", 
    borderWidth: 1, 
    borderColor: "#ccc",
    borderRadius: 10, 
    height: 45, 
    paddingHorizontal: 15,
    fontSize: 16, 
    color: "black"
  },
  SignIn: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    color: "#333",
    marginBottom: 1,
    bottom: 10
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20, // Space around the divider
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc", // Light gray line
  },
  orText: {
    marginHorizontal: 10,
    fontSize: 16,
    color: "#666", // Darker gray for text
    fontWeight: "bold",
  },
  pressButton:{
    
    justifyContent: "center",
    alignContent: "center",
    gap: 4,
    flexDirection: "row"
  },
  pressButtonText:{
    fontSize: 16
  },
  pressButtonText2: {
    fontSize: 16,
    fontWeight: "bold"
  },
  button: {
    backgroundColor: "#007bff", // Change this to any color
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: {
    color: "white", // Text color
    fontSize: 16,
    fontWeight: "bold",
  },
})