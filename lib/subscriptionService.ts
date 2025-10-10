
import Purchases, { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';

export interface SubscriptionService {
  checkSubscriptionStatus(): Promise<boolean>;
  getOfferings(): Promise<PurchasesOffering | null>;
  purchasePackage(packageToPurchase: PurchasesPackage): Promise<boolean>;
  restorePurchases(): Promise<boolean>;
  getCustomerInfo(): Promise<CustomerInfo | null>;
}

class RevenueCatService implements SubscriptionService {
  private readonly PRO_ENTITLEMENT = 'pro';

  async checkSubscriptionStatus(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.getCustomerInfo();
      console.log('customerInfo', customerInfo);
      console.log('customerInfo.entitlements.active[this.PRO_ENTITLEMENT]', customerInfo.entitlements.active[this.PRO_ENTITLEMENT]);
      return customerInfo.entitlements.active[this.PRO_ENTITLEMENT] !== undefined; // Is this the correct path?
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    try {
      const offerings = await Purchases.getOfferings();
      console.log('offerings', offerings);
      console.log('offerings.current', offerings.current);
      return offerings.current;
    } catch (error) {
      console.error('Error fetching offerings:', error);
      return null;
    }
  }

  async purchasePackage(packageToPurchase: PurchasesPackage): Promise<boolean> {
    try {
      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      console.log('customerInfo', customerInfo);
      console.log('customerInfo.entitlements.active[this.PRO_ENTITLEMENT]', customerInfo.entitlements.active[this.PRO_ENTITLEMENT]);
      return customerInfo.entitlements.active[this.PRO_ENTITLEMENT] !== undefined;
    } catch (error) {
      console.error('Error purchasing package:', error);
      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const customerInfo = await Purchases.restorePurchases();
      return customerInfo.entitlements.active[this.PRO_ENTITLEMENT] !== undefined;
    } catch (error) {
      console.error('Error restoring purchases:', error);
      return false;
    }
  }

  async getCustomerInfo(): Promise<CustomerInfo | null> {
    try {
      return await Purchases.getCustomerInfo();
    } catch (error) {
      console.error('Error getting customer info:', error);
      return null;
    }
  }
}

// Export singleton instance
export const subscriptionService = new RevenueCatService();

// Hook for React components
import { useState, useEffect } from 'react';

export function useSubscription() {
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const checkStatus = async () => {
    setLoading(true);
    const status = await subscriptionService.checkSubscriptionStatus();
    setIsSubscribed(status);
    setLoading(false);
  };
  
  useEffect(() => {
    checkStatus();
  }, []);
    
  const refreshStatus = () => {
    checkStatus();
  };

  return {
    isSubscribed,
    loading,
    refreshStatus,
  };
}
 