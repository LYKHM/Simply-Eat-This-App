import { StyleSheet, Text, View, Image, ImageBackground, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform, Alert } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from "expo-web-browser";
import { useEffect, useState } from "react";
import React from "react";
import { Link } from 'expo-router';
import { useRouter } from 'expo-router'
import { useSignIn, useAuth, useUser } from '@clerk/clerk-expo'
import SocialLogInButton from "../../components/SocialLogInButton";
import { Ionicons } from '@expo/vector-icons';

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
  const {isSignedIn} = useAuth();
  const router = useRouter();
 
  const handleTestAIScan = () => {
    router.push('/modal')
  }
 
  useWarmUpBrowser();

  const { getToken } = useAuth();
  const { user } = useUser()  
  const { signIn, setActive, isLoaded } = useSignIn()

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')

     useEffect(() => {
      if (isSignedIn) {
      router.replace('/(tabs)');
      }
  }, [isSignedIn]);
 
  return (
    <SafeAreaView style={{flex: 1}} edges={['left', 'right']}>
      <ImageBackground
        source={require("../../assets/createAccountBackground.png")}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
          {/* Middle Section */}
          <View style={styles.middleSection}>
            <Text style={styles.mainTitle}>Now let's create an account</Text>
            <Text style={styles.subtitle}>Save your progress & reach your goals</Text>
          </View>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            <View style={styles.socialButtonsContainer}>
              <SocialLogInButton strategy="google" />
              <SocialLogInButton strategy="apple" />
            </View>

            {/* Test AI Scan Link */}
            <TouchableOpacity style={styles.testScanLink} onPress={handleTestAIScan}>
              <Text style={styles.testScanText}>Test the AI Fridge Scan</Text>
              <Text style={styles.testScanText}>Without an account</Text>
            </TouchableOpacity>
          </View>
      </ImageBackground>
    </SafeAreaView> 
  );
};

export default AuthScreen;

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  middleSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 100,
    paddingBottom: 40,
  },
  mainTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'BricolageGrotesqueBold',
  },
  subtitle: {
    fontSize: 24,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'BricolageGrotesque',
  },
  fastingIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#10b981',
    gap: 8,
  },
  fastingText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
    fontFamily: 'BricolageGrotesqueBold',
  },
  bottomSection: {
    backgroundColor: 'transparent',
    paddingTop: 32,
    paddingBottom: 10,
  },
  socialButtonsContainer: {
    gap: 12,
    marginBottom: 4,
    marginHorizontal: 14,
  },
  testScanLink: {
    alignItems: 'center',
    paddingVertical: 3,
    marginBottom: 15,
  },
  testScanText: {
    fontSize: 16,
    color: 'black',
    textDecorationLine: 'underline',
    textAlign: 'center',
    fontFamily: 'BricolageGrotesque',
  },
});