import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ClerkLoaded, SignedIn, SignedOut, useOAuth } from '@clerk/clerk-expo';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Pressable, Text } from 'react-native';

async function doOAuth(strategy: 'oauth_google' | 'oauth_apple') {
  const { startOAuthFlow } = useOAuth({ strategy });
  const { createdSessionId, setActive } = await startOAuthFlow();
  if (createdSessionId) {
    await setActive?.({ session: createdSessionId });
  }
}

export default function SignOut() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ClerkLoaded>
        <View style={styles.container}>
          <SignedOut>
            <Pressable style={styles.btn} onPress={() => doOAuth('oauth_google')}>
              <Text style={styles.btnText}>Continue with Google</Text>
            </Pressable>
            <Pressable style={styles.btn} onPress={() => doOAuth('oauth_apple')}>
              <Text style={styles.btnText}>Continue with Apple</Text>
            </Pressable>
          </SignedOut>
          <SignedIn>
            <Text style={{ fontSize: 16 }}>You are signed in. Close this screen.</Text>
          </SignedIn>
        </View>
      </ClerkLoaded>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20, gap: 12 },
  btn: { backgroundColor: '#111', paddingVertical: 12, borderRadius: 12, paddingHorizontal: 16 },
  btnText: { color: '#fff', fontWeight: '700' },
});



