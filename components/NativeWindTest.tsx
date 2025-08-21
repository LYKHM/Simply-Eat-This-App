import React from 'react';
import { View, Text, Pressable } from 'react-native';

export default function NativeWindTest() {
  return (
    <View className="flex-1 items-center justify-center bg-blue-50 p-4">
      <Text className="text-2xl font-bold text-blue-900 mb-4">
        NativeWind is Working! 🎉
      </Text>
      <Text className="text-base text-blue-700 text-center mb-6">
        This component uses Tailwind CSS classes instead of StyleSheet
      </Text>
      <Pressable className="bg-blue-600 px-6 py-3 rounded-lg">
        <Text className="text-white font-semibold">Test Button</Text>
      </Pressable>
    </View>
  );
}

