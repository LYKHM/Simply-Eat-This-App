
import { StyleSheet, Text, View, Image, TextInput, Button, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import React from "react";
import { Link } from "expo-router";
import { useSignUp, useAuth, useUser } from '@clerk/clerk-expo'
import { useRouter } from 'expo-router'
//import { createSupabaseClient  } from "../../lib/supabaseClient"; // I use mysql now.
import { Alert } from "react-native";
import SocialLogInButton from "../../components/SocialLogInButton";


export default function SignUpScreen ()  {
  

  const { isLoaded, signUp, setActive } = useSignUp()
  const router = useRouter()
  const { getToken } = useAuth(); // I need this for mysql
  const { user } = useUser(); // same here

  const [emailAddress, setEmailAddress] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [pendingVerification, setPendingVerification] = React.useState(false)
  const [code, setCode] = React.useState('')

  
  const resendVerification = async () => {
    if(!signUp || !isLoaded ) return;
      try{
      //  console.log("signUp create...")
        
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      //console.log("prepare email verify adress...")
      setPendingVerification(true)
    }catch(err){
      console.log("Failed to send verification code", err)
      return;
    }
  }
   
  const onSignUpPress = async () =>{
  //  console.log("enterned onSignUpPress")
    if(!isLoaded) return
  
    try{
    //  console.log("signUp create...")
      await signUp.create({
        emailAddress,
        password,
      })

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' })
      // console.log("prepare email verify adress...")

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true)
    } catch(err){
      // See https://clerk.com/docs/custom-flows/error-handling
      // for more info on error handling
      Alert.alert(
        "Sign Up Error",
        "There was an issue with the email or password. Please try again.",
        [{ text: "OK" }]
      );
      console.error(JSON.stringify(err, null, 2))
    }
  }

  const onVerifyPress = async () => {
 //   console.log("Enterned onVerifyPress...")
    if (!isLoaded) return
 
    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      })

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === 'complete') {
        await setActive({ session: signUpAttempt.createdSessionId })
      //  console.log("Enterned verification code...")
      //  console.log("✅ Session set, now getting token...");



      console.log("What is inside signUpAttempt", signUpAttempt)
      await syncUserWithDatabase(signUpAttempt);
      // Does signUpAttemt contain the correct data?

      // use clerk_id: user?.id,
      // use email: user?.emailAddresses[0]?.emailAddress,

        //console.log("Replacing router to /(tabs)")
        router.replace('/(tabs)')
      } else {
        console.error(JSON.stringify(signUpAttempt, null, 2))
      }
    } catch (err) {
      console.error(JSON.stringify(err, null, 2))
      //Inform the user that the verification code is incorrect
      Alert.alert(
        "Verification Failed",
        "The verification code is incorrect. Please check your email and try again, or request a new code.",
        [{ text: "OK" }]
      );      
    }
  }

  const syncUserWithDatabase = async (signUpAttempt: any) => {
    
    try {
      //console.log("=== Starting manual signup sync ===");
      //console.log("API Base URL:", process.env.EXPO_PUBLIC_API_BASE);
      //console.log("Signup data:", {
      //clerk_id: signUpAttempt.createdUserId,
      //email: signUpAttempt.emailAddress,
      //provider: 'email'
    //});


      const response = await fetch(`${process.env.EXPO_PUBLIC_API_BASE}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerk_id: signUpAttempt.createdUserId, // is this correct? yes it was
          email: signUpAttempt.emailAddress, // is this correct? yes it was
          provider: 'email'
        })
      });

      //console.log("Response status:", response.status);
      //console.log("Response headers:", response.headers);
  
      if (!response.ok) {
        throw new Error('Failed to sync user with database');
      }
  
      const data = await response.json();
    //  console.log('User synced with database:', data);
    } catch (error) {
      console.error('Error syncing user:', error);
    }
  };

  


  if(pendingVerification){
    return (
      <View style={styles.verifyContainer}>
        <Text style={styles.Verifylabel}>Verify your email</Text>
        <TextInput
          style={styles.input}
          value={code}
          placeholder="Enter your verification code"
          onChangeText={(code) => setCode(code)}
        />
        <Button title="Verify" onPress={onVerifyPress} />
        <Button title="Resend Verification Code" onPress={resendVerification} />
      </View>
    )
  }


  return (
  <SafeAreaView>
    <KeyboardAvoidingView
      style={[
        styles.container,
      ]}
      behavior={Platform.OS === "ios" ? "padding" : "height"} //What about android?
      keyboardVerticalOffset={Platform.OS === "ios" ? 5 : 0} 
      
    >
      <ScrollView
        contentContainerStyle={styles.container}
        bounces={false} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled" 
             
      >
        <View style={styles.logoContainer}> 
          <Image source={require("../../assets/images/SplashIcon.png")} resizeMode="contain" style={styles.logo} />
        </View>

        <View style={styles.headingContainer}>
          <Text style={styles.label}>Sign Up to Lyft One AI</Text>
          <Text style={styles.description}>
            You must create an account to access the app
          </Text>
        </View>

        <View style={styles.socialButtonsContainer}>
          
          <SocialLogInButton strategy="google" />
          <SocialLogInButton strategy="apple" />
        </View>

        <View style={styles.dividerContainer}>
          <View style={styles.line} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.line} />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.SignIn}>Sign Up</Text>
          <TextInput
            style={styles.input}
            autoCapitalize="none"
            value={emailAddress}
            placeholder="Enter email"
            placeholderTextColor="#888" 
            onChangeText={(email) => setEmailAddress(email)}
          />
          <TextInput
            style={styles.input}
            value={password}
            placeholder="Enter password"
            placeholderTextColor="#888" 
            secureTextEntry={true}
            onChangeText={(password) => setPassword(password)}
          />
          <TouchableOpacity style={styles.button} onPress={onSignUpPress}>
            <Text style={styles.buttonText}>Sign Up</Text>
          </TouchableOpacity>
        </View>
        
          <View style={styles.pressButton}>
            <Text style={styles.pressButtonText}>Have an account?</Text>
            <Link href="/" style={styles.pressButtonText2}>Press Here</Link>
          </View>
      </ScrollView>
    </KeyboardAvoidingView>
  </SafeAreaView>
  );
};


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
  verifyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "white",
  },
  Verifylabel: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    paddingBottom: 10
  }
});