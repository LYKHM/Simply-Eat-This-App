import React, { createContext, useContext, useState, useEffect } from 'react';
import { subscriptionService } from './subscriptionService';

interface SubscriptionContextType {
  isSubscribed: boolean;
  loading: boolean;
  refreshStatus: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const status = await subscriptionService.checkSubscriptionStatus();
      console.log('Subscription status checked:', status);
      setIsSubscribed(status);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setIsSubscribed(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const refreshStatus = async () => {
    console.log('Refreshing subscription status...');
    await checkStatus();
  };

  return (
    <SubscriptionContext.Provider value={{ isSubscribed, loading, refreshStatus }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider');
  }
  return context;
}

