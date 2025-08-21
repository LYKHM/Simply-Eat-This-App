import * as SecureStore from 'expo-secure-store';
import type { TokenCache } from '@clerk/clerk-expo';

export const tokenCache: TokenCache = {
  async getToken(key: string) {
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async saveToken(key: string, value: string | null) {
    try {
      if (value) {
        await SecureStore.setItemAsync(key, value);
      } else {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      // noop
    }
  },
};



