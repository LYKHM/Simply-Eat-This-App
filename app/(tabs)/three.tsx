
/*
import React from 'react'
import { View, Text, Button, Alert } from 'react-native'
import RevenueCatUI, {PAYWALL_RESULT} from 'react-native-purchases-ui'

const isSubscribed = async () => {
    const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({requiredEntitlementIdentifier: 'pro'});
    console.log('paywallResult', paywallResult);
   
    switch (paywallResult) {
       case PAYWALL_RESULT.NOT_PRESENTED:
        return true;
       case PAYWALL_RESULT.ERROR:
       case PAYWALL_RESULT.CANCELLED:
           return false;
       case PAYWALL_RESULT.PURCHASED:
       case PAYWALL_RESULT.RESTORED:
           return true;
       default:
           return false;
   }

}

const proAction = async () => {
  if (await isSubscribed()) {
     Alert.alert('You are subscribed')
  }
}


const three = () => {
  return (
      <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
        <Button title="Perform PRO feature" onPress={proAction} />
      </View>
  )
}

export default three
*/