import React, { useState } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARD_KEY = 'hasSeenOnboarding';

export default function Onboarding() {
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');

  const finish = async () => {
    await AsyncStorage.setItem(ONBOARD_KEY, 'true');
    // Navigate back to main index which will then redirect to auth
    router.replace('/');
  };

  return (
    <View className="flex-1 p-5 gap-3 justify-center">
      <Text className="text-2xl font-extrabold mb-2 text-center">Quick Questions</Text>
      <Text className="text-sm font-semibold">1) Any dietary preference?</Text>
      <TextInput 
        value={q1} 
        onChangeText={setQ1} 
        placeholder="e.g. vegetarian" 
        className="border border-gray-300 rounded-lg p-3" 
      />
      <Text className="text-sm font-semibold">2) Any allergens?</Text>
      <TextInput 
        value={q2} 
        onChangeText={setQ2} 
        placeholder="e.g. peanuts" 
        className="border border-gray-300 rounded-lg p-3" 
      />
      <Pressable 
        className="bg-gray-900 py-3 rounded-xl items-center mt-2" 
        onPress={finish}
      >
        <Text className="text-white font-bold">Continue</Text>
      </Pressable>
    </View>
  );
}



